(function(){
  'use strict';
  const dialog=document.getElementById('help-dialog'),host=document.getElementById('tutorial-example');if(!dialog||!host)return;
  const example=HexagonExample,board=Hexagon.cells(1).map((c,i)=>({...c,number:example.values[i]})),reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let step=0,playing=false,timer=null,autoTimer=null,token=0,animations=[];
  const seenKey='omp-onboarding-hexagon-v1';
  host.innerHTML='<span class="tutorial-badge">Worked example · separate from your round</span><h3>Memorize a line. Find it again.</h3><section class="tutorial-conditions" aria-label="Example conditions"><h4>Example conditions</h4><ul><li data-condition="memory"><span class="tutorial-condition-mark" aria-hidden="true">○</span><span>Remember the numbers before they hide.</span></li><li data-condition="line"><span class="tutorial-condition-mark" aria-hidden="true">○</span><span>Three adjacent tiles in one straight line.</span></li><li data-condition="sum"><span class="tutorial-condition-mark" aria-hidden="true">○</span><span>The remembered numbers match the target.</span></li></ul></section><p class="hex-example-target">Target: hidden during memorization</p><div class="hex-board hex-example-board" role="group" aria-label="Seven-tile worked example"></div><div class="tutorial-answer"><strong>Selected letters</strong><div class="tutorial-slots" aria-label="Example selected letters"></div></div><span class="tutorial-step"></span><p class="tutorial-caption" role="status"></p><div class="tutorial-controls"><button class="primary" data-action="play">Play example</button><button class="outline" data-action="next">Next step</button><button class="text-button" data-action="restart">Restart</button></div>';
  const canvas=host.querySelector('.hex-example-board'),play=host.querySelector('[data-action=play]'),next=host.querySelector('[data-action=next]'),restart=host.querySelector('[data-action=restart]');
  const nodes=new Map();
  board.forEach(c=>{const el=document.createElement('div');el.className='hex-tile';el.style.left=`${50+(c.q+c.r/2)*29}%`;el.style.top=`${50+c.r*30}%`;el.innerHTML='<span class="hex-small"></span><span class="hex-value"></span>';el.setAttribute('role','img');canvas.append(el);nodes.set(c.letter,el);});
  const ns='http://www.w3.org/2000/svg',path=document.createElementNS(ns,'svg');path.classList.add('hex-example-line');path.setAttribute('viewBox','0 0 100 100');path.setAttribute('aria-hidden','true');const trace=document.createElementNS(ns,'line');for(const [key,value]of Object.entries({x1:35.5,y1:20,x2:64.5,y2:80}))trace.setAttribute(key,value);path.append(trace);canvas.prepend(path);
  function stop(){playing=false;clearTimeout(timer);token++;animations.forEach(a=>a.cancel());animations=[];play.textContent=step===example.steps.length-1?'Replay example':'Play example';}
  function condition(id,complete){const row=host.querySelector(`[data-condition=${id}]`);row.dataset.met=String(complete);row.querySelector('.tutorial-condition-mark').textContent=complete?'✓':'○';}
  function render(motion=true){
    const current=example.steps[step],visible=current.phase!=='recall';host.dataset.solved=String(Boolean(current.solved));
    host.querySelector('.tutorial-step').textContent=`Step ${step+1} of ${example.steps.length}`;host.querySelector('.tutorial-caption').textContent=current.text;
    host.querySelector('.hex-example-target').textContent=current.phase==='study'?'Target: hidden during memorization':'Target sum: 12';
    board.forEach(c=>{const el=nodes.get(c.letter),newly=current.selected.includes(c.letter)&&el.dataset.chosen!=='true';el.dataset.chosen=String(current.selected.includes(c.letter));el.setAttribute('aria-label',visible?`Tile ${c.letter}, number ${c.number}`:`Tile ${c.letter}${current.selected.includes(c.letter)?', selected':''}`);el.querySelector('.hex-small').textContent=visible?c.letter:'';el.querySelector('.hex-value').textContent=visible?c.number:c.letter;if(newly&&motion&&!reduce.matches){const a=el.animate([{opacity:.45},{opacity:1}],{duration:250,easing:'ease-out'});animations.push(a);}});
    path.style.display=current.trace?'':'none';
    if(current.trace&&motion&&!reduce.matches){const a=path.animate([{opacity:0,clipPath:'inset(0 0 100% 0)'},{opacity:1,clipPath:'inset(0 0 0% 0)'}],{duration:700,easing:'cubic-bezier(0.23, 1, 0.32, 1)'});animations.push(a);}
    const slots=host.querySelector('.tutorial-slots');slots.replaceChildren(...Array.from({length:3},(_,i)=>{const el=document.createElement('span');el.textContent=current.selected[i]||'—';return el;}));slots.setAttribute('aria-label',`Example selected letters: ${current.selected.join('')||'empty'}`);
    condition('memory',step>=2);condition('line',current.selected.length===3);condition('sum',current.selected.length===3);
    next.disabled=step===example.steps.length-1;next.textContent=example.steps[step+1]?.solved?'Submit example':'Next step';restart.disabled=step===0;
  }
  function advance(){if(step<example.steps.length-1){step++;render();window.GameAudio?.play(example.steps[step].solved?'correct':'select');window.Beans?.react(example.steps[step].solved?'win':'select');}if(step===example.steps.length-1){const focus=document.activeElement===next;stop();if(focus)play.focus({preventScroll:true});}}
  function schedule(currentToken){timer=setTimeout(()=>{if(token!==currentToken||!playing||!dialog.open||document.hidden)return;advance();if(playing)schedule(currentToken);},1900);}
  play.addEventListener('click',()=>{if(playing){stop();return;}if(step===example.steps.length-1){step=0;render(false);}playing=true;play.textContent='Pause example';schedule(token);});
  next.addEventListener('click',()=>{stop();advance();});
  restart.addEventListener('click',()=>{stop();step=0;render(false);play.textContent='Play example';play.focus({preventScroll:true});});
  dialog.addEventListener('close',()=>{clearTimeout(autoTimer);stop();try{localStorage.setItem(seenKey,'seen');}catch(_){}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  reduce.addEventListener('change',()=>{stop();render(false);});
  window.addEventListener('pagehide',()=>{clearTimeout(autoTimer);stop();});
  window.addEventListener('load',()=>{let seen=false;try{seen=localStorage.getItem(seenKey)==='seen';}catch(_){}if(!seen)autoTimer=setTimeout(()=>{try{if(localStorage.getItem(seenKey)==='seen')return;}catch(_){}if(document.querySelector('dialog[open]')||document.hidden)return;dialog.showModal();document.getElementById('help-title').focus({preventScroll:true});Beans.react('review');},650);},{once:true});
  render(false);
})();
