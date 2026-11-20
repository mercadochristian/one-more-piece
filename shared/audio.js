/* Original synthesized interface/portal effects; no sampled third-party sounds. */
(function(){
  'use strict';
  let context=null,master=null,enabled=true,lastHover=0,lastTick=0;
  try{enabled=sessionStorage.getItem('omp-effects')!=='off';}catch(_){}
  function init(){
    if(!enabled)return false;
    try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;
      if(!context){context=new Audio();master=context.createGain();master.gain.value=.45;master.connect(context.destination);}
      if(context.state==='suspended')context.resume().then(refreshButton).catch(refreshButton);refreshButton();return true;
    }catch(_){return false;}
  }
  function tone(from,to,length,amplitude=.09,delay=0,type='sine'){
    if(!context||!enabled)return;const at=context.currentTime+delay,o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.setValueAtTime(from,at);o.frequency.exponentialRampToValueAtTime(to,at+length);g.gain.setValueAtTime(.0001,at);g.gain.linearRampToValueAtTime(amplitude,at+.008);g.gain.exponentialRampToValueAtTime(.0001,at+length);o.connect(g);g.connect(master);o.start(at);o.stop(at+length+.02);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  function whoosh(){
    const duration=.95,count=Math.ceil(context.sampleRate*duration),buffer=context.createBuffer(1,count,context.sampleRate),samples=buffer.getChannelData(0);for(let i=0;i<count;i++)samples[i]=(Math.random()*2-1)*.5;
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain(),at=context.currentTime;source.buffer=buffer;filter.type='bandpass';filter.Q.value=.6;filter.frequency.setValueAtTime(1300,at);filter.frequency.exponentialRampToValueAtTime(90,at+duration);gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(.12,at+.25);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);source.connect(filter);filter.connect(gain);gain.connect(master);source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  }
  function play(kind){
    if(!enabled||document.hidden)return;
    // Hover never creates or resumes an audio context.
    if(kind==='hover'&&context?.state!=='running')return;
    if(!init())return;
    if(kind==='hover'){const now=performance.now();if(now-lastHover<180)return;lastHover=now;tone(620,800,.075,.07);}
    else if(kind==='portal'){whoosh();tone(140,45,.95,.12);}
    else if(kind==='tv-off')tone(760,65,.2,.08,0,'triangle');
    else if(kind==='tv-on'){tone(100,480,.18,.075);tone(700,950,.12,.035,.06);}
    else if(kind==='open'){tone(400,520,.09,.05);tone(650,730,.08,.04,.06);}
    else if(kind==='close')tone(510,320,.1,.05);
    else if(kind==='select')tone(440,520,.1,.10);
    else if(kind==='deselect')tone(400,300,.09,.08);
    else if(kind==='correct'){tone(523,523,.22,.11);tone(659,659,.22,.10,.1);tone(784,1047,.26,.10,.2);}
    else if(kind==='wrong'){tone(220,180,.2,.10);tone(165,130,.2,.08,.14);}
    else if(kind==='memory'){tone(440,660,.18,.07);}
    else if(kind==='tick'){const now=performance.now();if(now-lastTick<120)return;lastTick=now;tone(450,500,.035,.02);}
    else tone(360,250,.09,.14);
  }
  let effectButton=null;
  function refreshButton(){if(effectButton){effectButton.textContent=!enabled?'Effects off':context?.state==='running'?'Effects on':'Enable sound';effectButton.setAttribute('aria-pressed',String(enabled&&context?.state==='running'));}}
  function setEnabled(value){enabled=value;if(master&&context)master.gain.setValueAtTime(value?.45:0,context.currentTime);try{sessionStorage.setItem('omp-effects',value?'on':'off');}catch(_){}refreshButton();}
  window.GameAudio=Object.freeze({play,setEnabled});
  document.addEventListener('DOMContentLoaded',()=>{
    const controls=document.querySelector('#library-audio-control');
    if(controls){effectButton=document.createElement('button');effectButton.className='audio-toggle r-button r-button--secondary';effectButton.type='button';effectButton.addEventListener('click',()=>{if(enabled&&context?.state!=='running'){init();play('click');}else{setEnabled(!enabled);if(enabled)play('click');}});controls.append(effectButton);setEnabled(enabled);}
    const gameSound=document.getElementById('sound-toggle');
    if(gameSound&&!enabled&&gameSound.getAttribute('aria-pressed')==='true')gameSound.click();
    document.addEventListener('pointerdown',event=>{if(event.target.closest('.audio-toggle'))return;if(enabled)init();},{capture:true,passive:true});
    document.addEventListener('keydown',event=>{if(enabled&&['Enter',' '].includes(event.key))init();},{capture:true});
    document.querySelectorAll('a.game-feature').forEach(el=>el.addEventListener('pointerenter',()=>play('hover')));
    document.addEventListener('click',event=>{
      const el=event.target.closest('button,a,input,select');if(!el)return;
      if(el===gameSound){setEnabled(el.getAttribute('aria-pressed')==='true');if(enabled)play('click');return;}
      if(el===effectButton||el.matches('.card,.loop-edge,.hex-tile,#submit'))return;
      if(el.matches('.game-feature'))return; // Portal owns its own transition sound.
      play(document.querySelector('dialog[open]')?'open':'click');
    });
    document.querySelectorAll('dialog').forEach(el=>el.addEventListener('close',()=>play('close')));
    document.querySelectorAll('input[type=range]').forEach(el=>el.addEventListener('input',()=>play('tick')));
  });
  window.addEventListener('pagehide',()=>{context?.suspend().catch(()=>{});});
  window.addEventListener('pageshow',()=>{if(master&&context)master.gain.setValueAtTime(enabled?.45:0,context.currentTime);});
})();
