/* Dark Fog by Kevin MacLeod — CC BY 4.0. Full credit in shared/audio-credits.html. */
(function(){
  'use strict';
  const toolbar=document.querySelector('.toolbar-actions'),settings=document.getElementById('settings-dialog');
  if(!toolbar||!settings)return;
  const audio=new Audio(new URL('assets/audio/dark-fog-kevin-macleod.mp3',document.currentScript.src).href);
  audio.loop=true;audio.preload='none';audio.volume=.1;audio.id='ambient-track';audio.setAttribute('aria-hidden','true');document.body.append(audio);
  const toggle=document.createElement('button');toggle.className='text-button music-toggle';toggle.textContent='♫ Music off';toggle.setAttribute('aria-pressed','false');toggle.setAttribute('aria-label','Play background music');toolbar.prepend(toggle);
  const row=document.createElement('label');row.className='setting-row';
  const description=document.createElement('span'),title=document.createElement('strong'),copy=document.createElement('small');title.textContent='Background music volume';copy.textContent='Dark Fog · Kevin MacLeod. Separate from game sounds; pauses when this tab is hidden.';description.append(title,copy);
  const volume=document.createElement('input');volume.type='range';volume.className='music-volume';volume.min='0';volume.max='100';volume.value='10';volume.setAttribute('aria-label','Background music volume');row.append(description,volume);settings.insertBefore(row,document.getElementById('settings-close'));
  const credit=document.createElement('p'),link=document.createElement('a');credit.className='audio-credit';link.href=new URL('audio-credits.html',document.currentScript.src).href;link.target='_blank';link.rel='noopener';link.textContent='Music & sound credits';credit.append(link);settings.insertBefore(credit,document.getElementById('settings-close'));
  let wanted=true,sequence=0,pending=false;
  try{wanted=sessionStorage.getItem('omp-music')!=='off';}catch(_){}
  function remember(){try{sessionStorage.setItem('omp-music',wanted?'on':'off');}catch(_){}}
  function state(){const playing=wanted&&!audio.paused;toggle.textContent=playing?'♫ Music on':pending?'♫ Starting…':wanted?'♫ Tap for music':'♫ Music off';toggle.setAttribute('aria-pressed',String(playing));toggle.setAttribute('aria-label',playing||pending?'Pause background music':'Play background music');}
  async function start(){
    if(!wanted||document.hidden||pending)return;
    const token=++sequence;pending=true;state();
    try{await audio.play();if(token===sequence&&(!wanted||document.hidden))audio.pause();}
    catch(_){/* Keep the requested on state; a user gesture can retry autoplay. */}
    finally{if(token===sequence){pending=false;state();}}
  }
  toggle.addEventListener('click',()=>{
    if(wanted&&(!audio.paused||pending)){wanted=false;sequence++;pending=false;audio.pause();state();}
    else{wanted=true;start();}
    remember();
  });
  const activate=event=>{if(event.target.closest('.music-toggle'))return;if(wanted&&audio.paused&&!pending)start();};
  document.addEventListener('pointerdown',activate,{capture:true,passive:true});
  document.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key))activate(event);},{capture:true});
  volume.addEventListener('input',()=>audio.volume=Number(volume.value)/100);
  document.addEventListener('visibilitychange',()=>{sequence++;pending=false;if(document.hidden){audio.pause();state();}else if(wanted)start();});
  window.addEventListener('pagehide',()=>{sequence++;pending=false;audio.pause();state();});
  window.addEventListener('pageshow',event=>{if(event.persisted&&wanted)start();});
  state();if(wanted)start();
})();
