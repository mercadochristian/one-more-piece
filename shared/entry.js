(function(){
  'use strict';
  const url=new URL(location.href),reduce=matchMedia('(prefers-reduced-motion: reduce)');
  if(!url.searchParams.has('portal')||reduce.matches)return;
  document.documentElement.classList.add('portal-entry');
  // Safety release: an unsupported animation can never keep the game hidden.
  const release=()=>{document.documentElement.classList.remove('portal-entry');document.querySelector('.entry-beam')?.remove();};
  setTimeout(release,1800);
  window.addEventListener('load',async()=>{
    const beam=document.createElement('div');beam.className='entry-beam';beam.ariaHidden='true';document.documentElement.append(beam);
    try{
      const animation=document.body.animate([
        {clipPath:'inset(calc(50vh - 1px) calc(50vw - 2px) calc(100% - 50vh - 1px) calc(50vw - 2px))'},
        {offset:.35,clipPath:'inset(calc(50vh - 1px) 0px calc(100% - 50vh - 1px) 0px)'},
        {clipPath:'inset(0px 0px 0px 0px)'}
      ],{duration:450,easing:'cubic-bezier(0.23, 1, 0.32, 1)',fill:'both'});
      beam.animate([{opacity:.5,transform:'scaleX(.02)'},{offset:.35,opacity:.5,transform:'scaleX(1)'},{opacity:0,transform:'scaleX(1)'}],{duration:450,easing:'ease-out',fill:'forwards'});
      await animation.finished;animation.cancel();
    }catch(_){}finally{release();url.searchParams.delete('portal');history.replaceState(null,'',url);}
  },{once:true});
  window.addEventListener('pageshow',event=>{if(event.persisted)release();});
})();
