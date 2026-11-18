(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  let puzzle=null,level='medium',phase='ready',selected=[],found=[],score=0,round=0;
  let deadline=null,remaining=0,pending=null,returnFocus=null,lastTile='A',confirmed=false;
  let activeSound=true;
  const ended=()=>phase==='finished';
  const config=()=>Hexagon.levels[level];
  const blocked=()=>document.hidden||Boolean(document.querySelector('dialog[open]'));
  function tell(text,kind=''){ $('feedback').textContent=text;$('feedback').dataset.kind=kind; }
  const sound=kind=>window.GameAudio?.play(kind);
  function timeLabel(ms){const s=Math.max(0,Math.ceil(ms/1000));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
  function tileButton(letter){return $('hex-board').querySelector(`[data-letter="${letter}"]`);}
  function focusTile(letter=lastTile){const button=tileButton(letter)||tileButton('A');if(!button||button.disabled){$('new-game').focus({preventScroll:true});return;}$('hex-board').querySelectorAll('button').forEach(b=>b.tabIndex=-1);button.tabIndex=0;button.focus({preventScroll:true});}
  function tiles(){
    const study=phase==='study'&&deadline!==null,review=ended();
    $('hex-board').dataset.phase=phase;$('hex-board').dataset.covered=String(phase==='study'&&!study);
    puzzle.board.forEach(c=>{const el=tileButton(c.letter),value=el.querySelector('.hex-value'),small=el.querySelector('.hex-small');
      value.textContent=study||review?c.number:phase==='study'?'·':c.letter;
      small.textContent=study||review?c.letter:'';
      el.setAttribute('aria-label',study||review?`Tile ${c.letter}, number ${c.number}`:`Tile ${c.letter}${phase==='study'?', study paused':''}`);
      el.setAttribute('aria-pressed',String(selected.includes(c.letter)));el.disabled=phase!=='recall';
    });
  }
  function update(){
    if(!puzzle)return;tiles();
    $('target').textContent=phase==='ready'||phase==='study'?'—':puzzle.target;
    $('selected-letters').replaceChildren(...Array.from({length:3},(_,i)=>{const el=document.createElement('span');el.textContent=[...selected].sort()[i]||'—';return el;}));
    $('selected-letters').setAttribute('aria-label',`Selected letters: ${[...selected].sort().join(', ')||'empty'}`);
    $('clear').disabled=phase!=='recall'||!selected.length;$('submit').disabled=phase!=='recall'||selected.length!==3;
    $('start-study').disabled=false;$('start-study').hidden=phase==='recall'||ended();$('start-study').textContent=phase==='study'?'Hide numbers & start recall':`Start memorizing · ${config().memorySeconds}s`;
    $('phase-label').textContent={ready:'Ready',study:deadline===null?'Study paused':'Memorize',recall:deadline===null&&config().answerSeconds?'Recall paused':'Recall',finished:'Round complete'}[phase];
    $('score').textContent=score;$('found-count').textContent=phase==='ready'||phase==='study'?`${found.length} lines found`:`${found.length} of ${puzzle.answers.length} lines found`;
    $('found-lines').replaceChildren(...found.map(line=>{const el=document.createElement('span');el.textContent=line;return el;}));
    $('give-up').disabled=ended();
  }
  function syncClock(){
    if(!puzzle)return;
    const timed=phase==='study'||phase==='recall'&&config().answerSeconds>0;
    if(!timed){deadline=null;$('clock').textContent=phase==='recall'?'Untimed':'';return;}
    if(blocked()){
      if(deadline!==null){remaining=Math.max(0,deadline-Date.now());deadline=null;tiles();$('phase-label').textContent=phase==='study'?'Study paused':'Recall paused';}
      $('clock').textContent='Paused';return;
    }
    if(deadline===null){deadline=Date.now()+remaining;tiles();$('phase-label').textContent=phase==='study'?'Memorize':'Recall';}
    remaining=Math.max(0,deadline-Date.now());$('clock').textContent=timeLabel(remaining);
    if(remaining<=0){if(phase==='study')recall();else finish(false,'Time’s up. Review every matching line below.');}
  }
  function recall(){
    phase='recall';deadline=null;remaining=config().answerSeconds*1000;
    $('phase-copy').textContent='Choose three adjacent tiles in one straight line. Their remembered numbers must add up to the target.';
    update();syncClock();tell('Find every matching line. Numbers stay hidden until this round ends.');sound('memory');Beans.react('review');focusTile('A');
  }
  function study(){
    if(!puzzle)return;
    if(phase==='ready'){
      phase='study';remaining=config().memorySeconds*1000;deadline=null;
      $('phase-copy').textContent='Memorize the numbers and their positions. The target is still hidden.';update();syncClock();sound('memory');Beans.react('review');
      $('start-study').focus({preventScroll:true});
    }else if(phase==='study'){recall();}
  }
  function toggle(letter){
    if(phase!=='recall'||blocked())return;syncClock();if(phase!=='recall')return;
    lastTile=letter;focusTile(letter);
    if(selected.includes(letter)){selected=selected.filter(l=>l!==letter);sound('deselect');}
    else if(selected.length<3){selected.push(letter);sound('select');Beans.react('select');}
    else{tell('Three tiles are selected. Deselect one before choosing another.');return;}
    update();tell(`${selected.length} of 3 letters selected. Submit a straight line matching the target.`);
  }
  function renderBoard(){
    const board=$('hex-board');board.replaceChildren();
    puzzle.board.forEach(c=>{
      const button=document.createElement('button');button.className='hex-tile';button.type='button';button.dataset.letter=c.letter;button.tabIndex=c.letter==='A'?0:-1;
      button.style.left=`${50+(c.q+c.r/2)*18}%`;button.style.top=`${50+c.r*18.5}%`;
      const small=document.createElement('span'),value=document.createElement('span');small.className='hex-small';value.className='hex-value';button.append(small,value);
      button.addEventListener('click',()=>toggle(c.letter));
      button.addEventListener('keydown',event=>{const direction={ArrowRight:[1,0],ArrowLeft:[-1,0],ArrowDown:[0,1],ArrowUp:[0,-1]}[event.key];if(!direction)return;event.preventDefault();let best=null,distance=Infinity;const x=c.q+c.r/2,y=c.r*.866;puzzle.board.forEach(other=>{const dx=other.q+other.r/2-x,dy=other.r*.866-y,along=dx*direction[0]+dy*direction[1],across=Math.abs(dx*direction[1]-dy*direction[0]);if(along>.01&&along+across*2<distance){distance=along+across*2;best=other;}});if(best){lastTile=best.letter;focusTile(best.letter);}});
      board.append(button);
    });
  }
  function newRound(next=level){
    try{const seed=new Uint32Array(1);crypto.getRandomValues(seed);puzzle=Hexagon.generate(next,seed[0]);}
    catch(_){if(!puzzle){$('start-study').disabled=true;$('give-up').disabled=true;}$('new-game').focus({preventScroll:true});tell('Could not create a playable round. Choose New round to retry.','error');return;}
    level=next;round++;phase='ready';deadline=null;remaining=0;selected=[];found=[];score=0;lastTile='A';
    $('puzzle-label').textContent=`Round ${String(round).padStart(2,'0')} · ${config().label}`;
    document.querySelectorAll('input[name=difficulty]').forEach(el=>el.checked=el.value===level);
    $('range-label').textContent=`Numbers 1–${config().max}`;$('memory-label').textContent=`${config().memorySeconds}s to memorize`;$('limit-label').textContent=config().answerSeconds?`${config().answerSeconds}s recall`:'Untimed recall';
    $('round-review').hidden=true;$('review-lines').replaceChildren();$('phase-copy').textContent='Start when you’re ready. The target appears after the numbers are hidden.';
    renderBoard();update();syncClock();tell('Press Start memorizing when you’re ready.');Beans.react('new');
    if(round>1)$('start-study').focus({preventScroll:true});
  }
  function finish(won,message){
    phase='finished';deadline=null;remaining=0;selected=[];update();syncClock();$('round-review').hidden=false;
    $('review-lines').replaceChildren(...puzzle.answers.map(line=>{const li=document.createElement('li'),label=document.createElement('strong'),sum=document.createElement('span');label.textContent=line;sum.textContent=`${[...line].map(l=>puzzle.board.find(c=>c.letter===l).number).join(' + ')} = ${puzzle.target}`;li.append(label,sum);if(found.includes(line)){const tag=document.createElement('small');tag.textContent='Found';li.append(tag);}return li;}));
    tell(message,won?'success':'');
    if(won){$('win-level').textContent=config().label;$('win-time').textContent=score;$('win-clues').textContent=found.length;$('win-dialog').showModal();$('win-again').focus();sound('correct');Beans.react('win');}
    else{sound('wrong');Beans.react('fail');$('next-round').focus({preventScroll:true});}
  }
  function submit(){
    if(phase!=='recall'||selected.length!==3)return;syncClock();if(phase!=='recall')return;
    Beans.react('submit');const result=Hexagon.check(puzzle,selected,found);
    if(result.ok){
      score++;found.push(result.key);selected=[];
      if(found.length===puzzle.answers.length){finish(true,'Every matching line found. Round mastered.');return;}
      update();tell(`${result.key} found. +1 point. Keep looking for the remaining lines.`,'success');
      $('correct-copy').textContent=`${result.key} matches the target. +1 point. ${found.length} of ${puzzle.answers.length} lines found.`;
      $('correct-dialog').showModal();$('correct-continue').focus();syncClock();sound('correct');Beans.react('win');
    }else{
      score--;update();sound('wrong');
      const copy={line:'Choose three adjacent tiles on one straight line. Corners and skipped tiles do not count.',sum:'The remembered numbers on this line do not add up to the target. Try another line.',duplicate:'You already found that line. Repeating it costs a point.',selection:'Select three different board tiles.'}[result.reason];
      $('wrong-title').textContent=result.reason==='duplicate'?'Already found.':'Not quite.';$('wrong-copy').textContent=`${copy} −1 point. The hidden numbers are not revealed.`;
      $('wrong-dialog').showModal();$('wrong-primary').focus();syncClock();Beans.react('fail');tell('Try another line. Your selection is preserved.','error');
    }
  }
  function confirm(title,copy,label,action,trigger){confirmed=false;pending=action;returnFocus=trigger||document.activeElement;$('confirm-title').textContent=title;$('confirm-copy').textContent=copy;$('confirm-ok').textContent=label;$('confirm-dialog').showModal();$('confirm-cancel').focus();syncClock();Beans.react('review');}
  function replaceRound(next=level,trigger=$('new-game')){if(puzzle&&!ended())confirm(next===level?'Start a new round?':'Change difficulty?','This discards your current board, selections and round score.','Start round',()=>newRound(next),trigger);else newRound(next);}
  $('confirm-ok').addEventListener('click',()=>{confirmed=true;const action=pending;pending=null;$('confirm-dialog').close();action?.();});
  $('confirm-cancel').addEventListener('click',()=>$('confirm-dialog').close());
  $('confirm-dialog').addEventListener('close',()=>{const restore=!confirmed;confirmed=false;pending=null;syncClock();if(restore&&!returnFocus?.disabled)returnFocus?.focus({preventScroll:true});});
  $('new-game').addEventListener('click',()=>replaceRound());
  $('next-round').addEventListener('click',()=>newRound());
  $('start-study').addEventListener('click',study);
  $('submit').addEventListener('click',submit);
  $('clear').addEventListener('click',()=>{selected=[];update();tell('Selection cleared.');focusTile();sound('deselect');});
  document.querySelectorAll('input[name=difficulty]').forEach(el=>el.addEventListener('change',()=>{const next=el.value;document.querySelectorAll('input[name=difficulty]').forEach(r=>r.checked=r.value===level);replaceRound(next,document.querySelector(`input[name=difficulty][value="${level}"]`));}));
  $('give-up').addEventListener('click',()=>confirm('End this round?','This reveals all hidden numbers and matching lines. Your current round ends.','End & reveal',()=>finish(false,'Round ended. Review the numbers and matching lines below.'),$('give-up')));
  $('back-library').addEventListener('click',event=>{if(puzzle&&!ended()){event.preventDefault();confirm('Back to the library?','Your current round and score will be discarded.','Back to library',()=>location.assign('../../index.html'),$('back-library'));}});
  for(const name of ['settings','help']){
    $(name+'-button').addEventListener('click',()=>{$(name+'-dialog').showModal();$(name+'-title').focus({preventScroll:true});$(name+'-dialog').scrollTop=0;syncClock();Beans.react('review');});
    $(name+'-close').addEventListener('click',()=>$(name+'-dialog').close());
    $(name+'-dialog').addEventListener('close',()=>{syncClock();$(name+'-button').focus({preventScroll:true});});
  }
  $('correct-continue').addEventListener('click',()=>$('correct-dialog').close());
  $('wrong-primary').addEventListener('click',()=>$('wrong-dialog').close());
  for(const id of ['correct-dialog','wrong-dialog'])$(id).addEventListener('close',()=>{syncClock();if(phase==='recall')focusTile();});
  $('win-again').addEventListener('click',()=>{$('win-dialog').close();newRound();});
  $('win-review').addEventListener('click',()=>$('win-dialog').close());
  $('win-dialog').addEventListener('close',()=>$('next-round').focus({preventScroll:true}));
  $('sound-toggle').addEventListener('click',()=>{activeSound=!activeSound;$('sound-toggle').setAttribute('aria-pressed',String(activeSound));$('sound-toggle').textContent=activeSound?'Sound on':'Sound off';});
  document.addEventListener('visibilitychange',syncClock);
  new MutationObserver(syncClock).observe(document.querySelector('main'),{attributes:true,attributeFilter:['open'],subtree:true});
  window.addEventListener('pagehide',()=>{if(deadline!==null){remaining=Math.max(0,deadline-Date.now());deadline=null;}});
  window.addEventListener('pageshow',syncClock);
  newRound();setInterval(syncClock,200);
})();
