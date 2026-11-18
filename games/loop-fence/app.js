(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  let puzzle=null, values=[], history=[], future=[], tool=1, ended=false, failed=false, busy=false, level='medium', puzzleNumber=0, startedAt=0, strict=false;
  let soundEnabled=true, audio=null, audioMaster=null, pending=null, returnFocus=null;
  function sound(kind) {
    if (!soundEnabled) return;
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      audio ||= new Context();
      if (!audioMaster) { audioMaster = audio.createGain(); audioMaster.connect(audio.destination); }
      audioMaster.gain.setValueAtTime(soundEnabled ? 1 : 0, audio.currentTime);
      const notes = { select: [440], deselect: [330], wrong: [220, 164.81], buzz: [523, 659], timeout: [220, 165], win: [523.25, 659.25, 783.99, 1046.5] }[kind] || [];
      const success = kind === 'win', failure = kind === 'wrong' || kind === 'timeout';
      const spacing = success ? 0.12 : failure ? 0.16 : 0.09;
      const duration = success ? 0.32 : failure ? 0.24 : 0.15;
      const volume = success ? 0.12 : failure ? 0.08 : 0.045;
      const play = () => { if (!soundEnabled) return; notes.forEach((frequency, i) => {
        const oscillator = audio.createOscillator(), gain = audio.createGain();
        const at = audio.currentTime + i * spacing;
        oscillator.type = success || failure ? 'triangle' : 'sine'; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(volume, at + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, at + duration - 0.01);
        oscillator.connect(gain); gain.connect(audioMaster);
        oscillator.start(at); oscillator.stop(at + duration);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      }); };
      if (audio.state === 'suspended') audio.resume().then(play).catch(() => {}); else play();
    } catch (_) { /* Audio is optional; unavailable audio never blocks a game. */ }
  }
  function tell(text,kind=''){ $('feedback').textContent=text;$('feedback').dataset.kind=kind; }
  function update(){
    document.querySelectorAll('.loop-edge').forEach((el,i)=>{el.dataset.state=values[i];el.setAttribute('aria-label',`${edgeLabel(i)}: ${['empty','fence','cross'][values[i]]}`);el.disabled=ended||busy;});
    const count=values.filter(v=>v===1).length;
    $('line-count').textContent=`${count} fence edge${count===1?'':'s'}`;
    $('undo').disabled=busy||ended||!history.length;$('redo').disabled=busy||ended||!future.length;
    $('clear').disabled=busy||ended||!values.some(v=>v!==0);$('give-up').disabled=busy||ended&&!failed||!puzzle;
    $('submit').disabled=busy||ended||!count;
    $('new-game').disabled=busy;
    document.querySelectorAll('input[name=difficulty]').forEach(el=>el.disabled=busy);
    document.querySelectorAll('[data-tool]').forEach(el=>el.disabled=busy||ended);
  }
  function edgeLabel(i){const e=LoopFence.topology(puzzle.size).edges[i];return `${e.orientation==='h'?'Horizontal':'Vertical'} edge, row ${e.r+1}, column ${e.c+1}`;}
  function edit(i,value){if(busy||ended||value===0&&values[i]===0)return;history.push(values.slice());future=[];values[i]=values[i]===value?0:value;update();sound(values[i]===1?'select':'deselect');Beans.react(values[i]===1?'select':'click');tell('Your drawing is private. Submit when you’re ready.');}
  function focusEdge(button){document.querySelectorAll('.loop-edge').forEach(el=>el.tabIndex=-1);button.tabIndex=0;button.focus({preventScroll:true});}
  function render(){
    const t=LoopFence.topology(puzzle.size),n=puzzle.size,grid=document.createElement('div');grid.className='loop-grid';grid.style.setProperty('--n',n);
    const place=(el,x,y)=>{el.style.left=`${x/n*100}%`;el.style.top=`${y/n*100}%`;grid.append(el);};
    for(let r=0;r<=n;r++)for(let c=0;c<=n;c++){const dot=document.createElement('span');dot.className='loop-dot';dot.ariaHidden='true';place(dot,c,r);}
    puzzle.clues.forEach((v,i)=>{if(v===null)return;const el=document.createElement('span');el.className='loop-clue';el.setAttribute('role','img');el.textContent=v;el.setAttribute('aria-label',`Cell row ${Math.floor(i/n)+1}, column ${i%n+1}: ${v} fence edges`);place(el,i%n+.5,Math.floor(i/n)+.5);});
    const positions=t.edges.map(e=>({x:e.c+(e.orientation==='h'?.5:0),y:e.r+(e.orientation==='v'?.5:0)}));
    t.edges.forEach((e,i)=>{const button=document.createElement('button');button.className=`loop-edge ${e.orientation}`;button.type='button';button.tabIndex=i===0?0:-1;button.dataset.edge=i;
      button.addEventListener('click',()=>{focusEdge(button);edit(i,tool);});
      button.addEventListener('contextmenu',event=>{event.preventDefault();focusEdge(button);edit(i,2);});
      button.addEventListener('keydown',event=>{
        if(['x','X','Delete','Backspace'].includes(event.key)){event.preventDefault();edit(i,event.key.toLowerCase()==='x'?2:0);return;}
        const direction={ArrowRight:[1,0],ArrowLeft:[-1,0],ArrowDown:[0,1],ArrowUp:[0,-1]}[event.key];if(!direction)return;event.preventDefault();let best=-1,score=Infinity;const p=positions[i];positions.forEach((q,j)=>{const dx=q.x-p.x,dy=q.y-p.y,along=dx*direction[0]+dy*direction[1],across=Math.abs(dx*direction[1]-dy*direction[0]);if(along>.01){const distance=along+across*3;if(distance<score){score=distance;best=j;}}});if(best>=0)focusEdge(grid.querySelector(`[data-edge="${best}"]`));
      });place(button,positions[i].x,positions[i].y);
    });
    $('loop-board').replaceChildren(grid);$('loop-board').dataset.revealed='false';$('loop-board').setAttribute('aria-label',`${n} by ${n} loop fence puzzle`);
  }
  async function newGame(nextLevel=level){
    busy=true;ended=false;failed=false;update();$('loop-board').setAttribute('aria-busy','true');tell('Preparing a fresh puzzle…');
    try{
      const seed=new Uint32Array(1);crypto.getRandomValues(seed);
      puzzle=await LoopFence.generate(nextLevel,seed[0],()=>new Promise(resolve=>setTimeout(resolve,0)));
      level=nextLevel;values=Array(LoopFence.topology(puzzle.size).edges.length).fill(0);history=[];future=[];puzzleNumber++;strict=$('strict').checked;startedAt=Date.now();
      render();$('puzzle-label').textContent=`Puzzle ${String(puzzleNumber).padStart(2,'0')} · ${LoopFence.levels[level].label}`;$('board-size').textContent=`${puzzle.size} × ${puzzle.size} grid`;
      document.querySelectorAll('input[name=difficulty]').forEach(el=>el.checked=el.value===level);
      tell(strict?'One attempt. Make every edge count.':'Draw one closed loop. Crosses are optional notes.');Beans.react('new');
    }catch(error){puzzle=null;values=[];history=[];future=[];$('loop-board').replaceChildren();tell('Could not verify a fresh puzzle. Choose New puzzle to retry.','error');}
    finally{busy=false;$('loop-board').setAttribute('aria-busy','false');update();if(puzzle&&puzzleNumber>1)focusEdge(document.querySelector('.loop-edge'));else if(!puzzle)$('new-game').focus();}
  }
  function confirm(title,copy,label,action,trigger){pending=action;returnFocus=trigger||document.activeElement;$('confirm-title').textContent=title;$('confirm-copy').textContent=copy;$('confirm-ok').textContent=label;$('confirm-dialog').showModal();$('confirm-cancel').focus();Beans.react('review');}
  function replacePuzzle(next=level,trigger=$('new-game')){if(busy)return;if(puzzle&&!ended)confirm(next===level?'Start a new puzzle?':'Change difficulty?','This starts a fresh board and discards your current drawing.','Start puzzle',()=>newGame(next),trigger);else newGame(next);}
  $('confirm-cancel').addEventListener('click',()=>$('confirm-dialog').close());
  $('confirm-ok').addEventListener('click',()=>{const action=pending;pending=null;$('confirm-dialog').close();action?.();});
  $('confirm-dialog').addEventListener('close',()=>{pending=null;returnFocus?.focus({preventScroll:true});});
  $('new-game').addEventListener('click',()=>replacePuzzle());
  document.querySelectorAll('input[name=difficulty]').forEach(el=>el.addEventListener('change',()=>{const next=el.value;document.querySelectorAll('input[name=difficulty]').forEach(r=>r.checked=r.value===level);replacePuzzle(next,document.querySelector(`input[name=difficulty][value="${level}"]`));}));
  document.querySelectorAll('[data-tool]').forEach(el=>el.addEventListener('click',()=>{tool=Number(el.dataset.tool);document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b===el)));$('board-instructions').textContent=['Tap an edge to erase its mark.','Tap between two dots to draw. Tap again to remove.','Tap an edge to mark a cross. Tap again to remove.'][tool];sound('deselect');}));
  $('undo').addEventListener('click',()=>{if(!history.length||ended)return;future.push(values.slice());values=history.pop();update();if($('undo').disabled)focusEdge(document.querySelector('.loop-edge[tabindex="0"]'));sound('deselect');Beans.react('review');tell('Last move undone.');});
  $('redo').addEventListener('click',()=>{if(!future.length||ended)return;history.push(values.slice());values=future.pop();update();if($('redo').disabled)focusEdge(document.querySelector('.loop-edge[tabindex="0"]'));sound('select');Beans.react('select');tell('Move restored.');});
  $('clear').addEventListener('click',()=>confirm('Clear this board?','Remove all fences and crosses. You can undo this clear.','Clear board',()=>{history.push(values.slice());future=[];values.fill(0);update();focusEdge(document.querySelector('.loop-edge[tabindex="0"]'));tell('Board cleared. Undo restores your drawing.');},$('clear')));
  function reveal(){ended=true;failed=false;values=puzzle.answer.slice();update();$('loop-board').dataset.revealed='true';tell('Solution revealed. Start a fresh puzzle whenever you’re ready.');Beans.react('review');$('new-game').focus();}
  $('give-up').addEventListener('click',()=>confirm('Reveal the loop?','This ends your attempt and shows the solution.','Reveal solution',reveal,$('give-up')));
  $('back-library').addEventListener('click',event=>{if(busy||puzzle&&!ended){event.preventDefault();confirm('Back to the library?','Your current puzzle and drawing will be discarded.','Back to library',()=>{window.location.href='../../index.html';},$('back-library'));}});
  $('submit').addEventListener('click',()=>{
    if(busy||ended)return;Beans.react('submit');
    if(LoopFence.valid(puzzle,values)){
      ended=true;update();sound('win');$('win-level').textContent=LoopFence.levels[level].label;const seconds=Math.max(1,Math.round((Date.now()-startedAt)/1000));$('win-time').textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;$('win-clues').textContent=values.filter(v=>v===1).length;tell('Fence complete. Every clue fits.','success');$('win-dialog').showModal();$('win-again').focus();Beans.react('win');
    }else{
      if(strict){ended=true;failed=true;update();}sound('wrong');$('wrong-title').textContent=strict?'Attempt used.':'Not quite.';$('wrong-copy').textContent=strict?'Your fence does not satisfy every rule. Start a fresh puzzle, or return to reveal the solution.':'Check that every numbered cell has the right number of sides, and that your fence is one closed loop without branches. Your solution is still hidden.';$('wrong-primary').textContent=strict?'New puzzle':'Try again';$('wrong-review').textContent=strict?'Reveal solution':'Review board';$('wrong-dialog').showModal();$('wrong-primary').focus();Beans.react('fail');tell(strict?'Attempt ended. Reveal the solution or start a new puzzle.':'Not quite. Your drawing is preserved.','error');
    }
  });
  $('win-again').addEventListener('click',()=>{$('win-dialog').close();newGame();});
  $('win-review').addEventListener('click',()=>$('win-dialog').close());
  $('win-dialog').addEventListener('close',()=>$('new-game').focus());
  $('wrong-primary').addEventListener('click',()=>{$('wrong-dialog').close();if(strict)newGame();});
  $('wrong-review').addEventListener('click',()=>{$('wrong-dialog').close();if(strict)reveal();});
  $('wrong-dialog').addEventListener('close',()=>{if(ended)$('new-game').focus();else document.querySelector('.loop-edge[tabindex="0"]')?.focus({preventScroll:true});});
  for(const name of ['settings','help']){
    $(name+'-button').addEventListener('click',()=>{$(name+'-dialog').showModal();$(name+'-title').focus();Beans.react('review');});
    $(name+'-close').addEventListener('click',()=>$(name+'-dialog').close());
    $(name+'-dialog').addEventListener('close',()=>$(name+'-button').focus());
  }
  $('strict').addEventListener('change',()=>{$('settings-feedback').textContent='One-attempt setting applies to the next puzzle.';});
  $('sound-toggle').addEventListener('click',()=>{soundEnabled=!soundEnabled;if(audio&&audioMaster)audioMaster.gain.setValueAtTime(soundEnabled?1:0,audio.currentTime);$('sound-toggle').setAttribute('aria-pressed',String(soundEnabled));$('sound-toggle').textContent=soundEnabled?'Sound on':'Sound off';if(soundEnabled)sound('select');});
  newGame();
})();
