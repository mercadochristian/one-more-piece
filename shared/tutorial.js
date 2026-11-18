(function(){
  'use strict';
  const game=document.body.dataset.game,example=window.TutorialExamples?.[game];
  const dialog=document.getElementById('help-dialog'),host=document.getElementById('tutorial-example');
  if(!example||!dialog||!host)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const key=`omp-onboarding-${game}-v1`;
  let step=0,playing=false,timer=null,generation=0,animations=[],onboardingTimer=null;
  const title=document.createElement('h3');title.textContent=example.title;
  const badge=document.createElement('span');badge.className='tutorial-badge';badge.textContent='Worked example · separate from your puzzle';
  const canvas=document.createElement('div');canvas.className='tutorial-canvas';
  const conditions=document.createElement('section');conditions.className='tutorial-conditions';conditions.setAttribute('aria-label','Example conditions');const conditionsTitle=document.createElement('h4');conditionsTitle.textContent='Example conditions';const conditionList=document.createElement('ul'),conditionRows=new Map();
  example.conditions.forEach(condition=>{const row=document.createElement('li'),mark=document.createElement('span'),text=document.createElement('span');mark.className='tutorial-condition-mark';mark.ariaHidden='true';text.textContent=condition.text;row.append(mark,text);conditionList.append(row);conditionRows.set(condition.id,{row,mark,text});});conditions.append(conditionsTitle,conditionList);canvas.append(conditions);

  const caption=document.createElement('p');caption.className='tutorial-caption';caption.setAttribute('role','status');
  const count=document.createElement('span');count.className='tutorial-step';
  const controls=document.createElement('div');controls.className='tutorial-controls';
  const play=document.createElement('button');play.className='primary';play.textContent='Play example';
  const next=document.createElement('button');next.className='outline';next.textContent='Next step';
  const restart=document.createElement('button');restart.className='text-button';restart.textContent='Restart';
  controls.append(play,next,restart);host.append(badge,title,canvas,count,caption,controls);
  function halt(){playing=false;clearTimeout(timer);timer=null;generation++;animations.forEach(a=>a.cancel());animations=[];play.textContent=step===example.steps.length-1?'Replay example':'Play example';}
  function animate(el,keys,options){if(reduced.matches)return;const a=el.animate(keys,{duration:250,easing:'cubic-bezier(0.23, 1, 0.32, 1)',...options});animations.push(a);a.finished.catch(()=>{});return a;}
  let cards=new Map(),slots=null,math=null,lines=new Map(),crosses=new Map(),cursor=null;
  if(game==='secret-code'){
    const clue=document.createElement('p');clue.className='tutorial-clue';clue.textContent='Follow the solution by clicking each numbered card, or press Play example.';
    const board=document.createElement('div');board.className='tutorial-cards';board.setAttribute('aria-label','Example cards');
    example.cards.forEach(card=>{const el=document.createElement('button');el.type='button';el.className='tutorial-card';el.setAttribute('aria-label',`Card ${card.letter}, number ${card.number}, ${card.color}`);const letter=document.createElement('strong'),number=document.createElement('span');letter.textContent=card.letter;number.textContent=card.number;const color=document.createElement('small');color.textContent=card.color;el.dataset.color=card.color;el.append(letter,number,color);el.addEventListener('click',()=>{halt();const upcoming=example.steps[step+1];if(!upcoming||upcoming.solved)return;const expected=upcoming.selected.find(letter=>!example.steps[step].selected.includes(letter));if(!expected){caption.textContent='Read the deduction, then choose Next step to continue the example.';return;}if(card.letter===expected){halt();advance();}else{const nextCard=example.cards.find(card=>card.letter===expected);caption.textContent=`To follow this worked solution, click ${expected} (${nextCard.number}) next, or use Play example.`;}});board.append(el);cards.set(card.letter,el);});
    const answer=document.createElement('div');answer.className='tutorial-answer';const label=document.createElement('strong');label.textContent='Answer · selected letters';slots=document.createElement('div');slots.className='tutorial-slots';slots.setAttribute('aria-label','Example letter code');answer.append(label,slots);
    math=document.createElement('p');math.className='tutorial-math';canvas.append(clue,board,answer,math);
  }else{
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 180 180');svg.classList.add('tutorial-loop');svg.setAttribute('role','img');svg.setAttribute('aria-label','Two by two worked example. Each cell has clue 2.');
    const segment=(x1,y1,x2,y2,id)=>{const line=document.createElementNS(ns,'line');for(const [name,value]of Object.entries({x1,y1,x2,y2}))line.setAttribute(name,value);line.classList.add('tutorial-line');svg.append(line);lines.set(id,line);const text=document.createElementNS(ns,'text');text.setAttribute('x',(x1+x2)/2);text.setAttribute('y',(y1+y2)/2+5);text.textContent='×';text.classList.add('tutorial-cross');svg.append(text);crosses.set(id,text);};
    let id=0;for(let r=0;r<=2;r++)for(let c=0;c<2;c++)segment(30+c*60,30+r*60,90+c*60,30+r*60,id++);for(let r=0;r<2;r++)for(let c=0;c<=2;c++)segment(30+c*60,30+r*60,30+c*60,90+r*60,id++);
    for(let r=0;r<=2;r++)for(let c=0;c<=2;c++){const dot=document.createElementNS(ns,'circle');dot.setAttribute('cx',30+c*60);dot.setAttribute('cy',30+r*60);dot.setAttribute('r','3');dot.classList.add('tutorial-dot');svg.append(dot);}
    for(let r=0;r<2;r++)for(let c=0;c<2;c++){const text=document.createElementNS(ns,'text');text.setAttribute('x',60+c*60);text.setAttribute('y',67+r*60);text.textContent='2';text.classList.add('tutorial-number');svg.append(text);}
    cursor=document.createElementNS(ns,'circle');cursor.setAttribute('r','5');cursor.classList.add('tutorial-cursor');svg.append(cursor);canvas.append(svg);
  }
  function setConditions(met){conditionRows.forEach(({row,mark,text},id)=>{row.dataset.met=String(Boolean(met[id]));mark.textContent=met[id]?'✓':'○';row.setAttribute('aria-label',`${met[id]?'Complete':'Pending'}: ${text.textContent}`);});}
  function render(motion=true){
    const current=example.steps[step];host.dataset.solved=String(Boolean(current.solved));count.textContent=`Step ${step+1} of ${example.steps.length}`;caption.textContent=current.text;next.textContent=example.steps[step+1]?.solved?'Submit example':'Next step';next.disabled=step===example.steps.length-1;restart.disabled=step===0;
    if(game==='secret-code'){
      const selected=[...current.selected].sort(),added=[];
      cards.forEach((el,letter)=>{const was=el.dataset.selected==='true',chosen=selected.includes(letter);el.dataset.selected=String(chosen);el.dataset.excluded=String((current.excluded||[]).includes(letter));el.setAttribute('aria-pressed',String(chosen));if(chosen&&!was){added.push(letter);if(motion&&!reduced.matches){const ring=document.createElement('i');ring.className='tutorial-click-ring';el.querySelector('span').append(ring);animate(ring,[{opacity:.9,transform:'translate(-50%,-50%) scale(.95)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.25)'}],{duration:250})?.finished.then(()=>ring.remove(),()=>ring.remove());}}if(chosen&&!was&&motion)animate(el,[{opacity:.5,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{});});
      slots.replaceChildren(...Array.from({length:4},(_,i)=>{const el=document.createElement('span');el.textContent=selected[i]||'—';return el;}));
      slots.setAttribute('aria-label',`Example letter code: ${selected.join('')||'empty'}`);
      if(motion&&!reduced.matches)for(const letter of added){const source=cards.get(letter).querySelector('strong').getBoundingClientRect(),target=slots.children[selected.indexOf(letter)].getBoundingClientRect(),ghost=document.createElement('span');ghost.className='tutorial-letter-flight';ghost.textContent=letter;ghost.ariaHidden='true';ghost.style.left=`${source.left}px`;ghost.style.top=`${source.top}px`;dialog.append(ghost);const animation=animate(ghost,[{transform:'translate(0,0)',opacity:1},{offset:.85,transform:`translate(${target.left-source.left+6}px,${target.top-source.top+5}px)`,opacity:1},{transform:`translate(${target.left-source.left+6}px,${target.top-source.top+5}px)`,opacity:0}],{duration:400});animation?.finished.then(()=>ghost.remove(),()=>ghost.remove());}

      const numbers=selected.map(letter=>example.cards.find(c=>c.letter===letter).number);
      math.textContent=numbers.length?`${numbers.join(' + ')} = ${numbers.reduce((a,b)=>a+b,0)}`:'Use the numbers to solve. The code boxes receive letters.';
      const sum=numbers.reduce((a,b)=>a+b,0);setConditions({blue:selected.filter(letter=>example.cards.find(card=>card.letter===letter).color==='Blue').length===2,sum:selected.length===4&&sum===example.target});
    }else{
      const previous=new Set(step?example.steps[step-1].edges:[]);
      lines.forEach((line,id)=>line.dataset.active=String(current.edges.includes(id)));
      crosses.forEach((el,id)=>el.dataset.active=String(current.crosses.includes(id)));
      setConditions({clues:step>=2,loop:step>=2,branches:step>=2});
      const added=current.edges.filter(id=>!previous.has(id));cursor.style.opacity='0';
      if(motion&&!reduced.matches&&added.length){const points=[];added.forEach((id,i)=>{const line=lines.get(id);let x1=Number(line.getAttribute('x1')),y1=Number(line.getAttribute('y1')),x2=Number(line.getAttribute('x2')),y2=Number(line.getAttribute('y2'));if(step===2){[x1,x2]=[x2,x1];[y1,y2]=[y2,y1];}animate(line,[{opacity:0},{opacity:1}],{duration:180,delay:i*180,fill:'backwards'});points.push({transform:`translate(${x1}px,${y1}px)`,opacity:1,offset:i/added.length});points.push({transform:`translate(${x2}px,${y2}px)`,opacity:1,offset:(i+.85)/added.length});});points.push({...points.at(-1),opacity:0,offset:1});animate(cursor,points,{duration:900});}
    }
  }
  function advance(){if(step<example.steps.length-1){step++;render();window.Beans?.react(example.steps[step].solved?'win':'select');window.GameAudio?.play(example.steps[step].solved?'open':'click');}if(step===example.steps.length-1){const returnFocus=document.activeElement===next;halt();if(returnFocus)play.focus({preventScroll:true});}}
  function schedule(token){timer=setTimeout(()=>{if(token!==generation||!playing||!dialog.open||document.hidden)return;advance();if(playing)schedule(token);},1900);}
  play.addEventListener('click',()=>{if(playing){halt();return;}if(step===example.steps.length-1){step=0;render(false);}playing=true;play.textContent='Pause example';schedule(generation);});
  next.addEventListener('click',()=>{halt();advance();});
  restart.addEventListener('click',()=>{halt();step=0;render(false);play.textContent='Play example';play.focus({preventScroll:true});});
  dialog.addEventListener('close',()=>{clearTimeout(onboardingTimer);onboardingTimer=null;halt();try{localStorage.setItem(key,'seen');}catch(_){}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)halt();});
  reduced.addEventListener('change',()=>{halt();render(false);});
  render(false);
  window.addEventListener('pagehide',()=>{halt();clearTimeout(onboardingTimer);});
  window.addEventListener('load',()=>{
    let seen=false;try{seen=localStorage.getItem(key)==='seen';}catch(_){}
    if(!seen)onboardingTimer=setTimeout(()=>{try{if(localStorage.getItem(key)==='seen')return;}catch(_){}if(document.querySelector('dialog[open]')||document.hidden)return;dialog.showModal();document.getElementById('help-title').focus({preventScroll:true});window.Beans?.react('review');},650);
  },{once:true});
})();
