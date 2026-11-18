(function(){
  'use strict';
  const main=document.querySelector('main'),portal=document.getElementById('portal'),dark=document.getElementById('screen-dark'),status=document.getElementById('launch-status');
  const motion=document.getElementById('motion-mode'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const ease='cubic-bezier(0.23, 1, 0.32, 1)',morph='cubic-bezier(0.77, 0, 0.175, 1)';
  let busy=false,destination=null,navigated=false,running=[],epoch=0;
  function animate(el,keys,options){const a=el.animate(keys,{fill:'forwards',...options});running.push(a);return a.finished.catch(()=>{});}
  function cleanup(){epoch++;running.forEach(a=>a.cancel());running=[];busy=false;navigated=false;main.inert=false;document.body.classList.remove('launching');status.textContent='';}
  function go(entrance=true,token=epoch){if(token!==epoch||navigated||!destination)return;navigated=true;const url=new URL(destination,location.href);if(entrance)url.searchParams.set('portal','1');location.assign(url.href);}
  async function launch(link,event){
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();if(busy)return;
    const token=++epoch;destination=link.href;
    // Keyboard activation and system reduced motion do not receive the cinematic movement.
    if(event.detail===0){go(false,token);return;}
    window.GameAudio?.play('click');busy=true;main.inert=true;document.body.classList.add('launching');status.textContent='Opening game · Escape to skip';
    try{
      if(reduce.matches||motion?.value==='reduced'){
        await animate(main,[{opacity:1},{opacity:0}],{duration:150,easing:'ease'});go(false,token);return;
      }
      window.GameAudio?.play('portal');
      const cx=innerWidth/2,cy=innerHeight/2;
      const pieces=[...document.querySelectorAll('.library-header>a,.library-header>nav,.library-intro>* ,.beans-home,.library-section-heading,.game-feature .game-cover,.game-feature .game-details>*,.library-note,.library-footer')].filter(el=>{const r=el.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;});
      animate(portal,[{opacity:0,transform:'translate(-50%,-50%) scale(.95)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)'}],{duration:200,easing:ease});
      const pulls=pieces.map((el,i)=>{
        const r=el.getBoundingClientRect(),dx=cx-r.left-r.width/2,dy=cy-r.top-r.height/2;
        return animate(el,[{transform:'translate(0,0) rotate(0deg) scale(1)',opacity:1},{offset:.3,transform:`translate(${dx*.12}px,${dy*.12}px) rotate(${i%2?8:-8}deg) scale(.94)`,opacity:1},{transform:`translate(${dx}px,${dy}px) rotate(${i%2?130:-130}deg) scale(.04)`,opacity:0}],{duration:900,delay:100+i%5*35,easing:morph});
      });
      await Promise.all(pulls);
      if(token!==epoch||navigated)return;
      await Promise.all([animate(portal,[{opacity:1,transform:'translate(-50%,-50%) scale(1)'},{opacity:0,transform:'translate(-50%,-50%) scale(.95)'}],{duration:150,easing:ease}),animate(dark,[{opacity:0},{opacity:1}],{duration:150,easing:'ease'})]);
      if(token!==epoch||navigated)return;
      window.GameAudio?.play('tv-off');
      await animate(document.querySelector('.tv-line'),[{opacity:0,transform:'scaleX(1)'},{offset:.2,opacity:.65,transform:'scaleX(1)'},{opacity:0,transform:'scaleX(.01)'}],{duration:250,easing:ease});
      if(token!==epoch||navigated)return;
      window.GameAudio?.play('tv-on');
      await new Promise(resolve=>setTimeout(resolve,180));
      go(true,token);
    }catch(_){go(false,token);}
  }
  document.querySelectorAll('a.game-feature').forEach(link=>link.addEventListener('click',event=>launch(link,event)));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&busy){event.preventDefault();go(false);}});
  window.addEventListener('pageshow',cleanup);
  window.addEventListener('pagehide',()=>{epoch++;running.forEach(a=>a.cancel());});
})();
