/* Original Slitherlink boards. No show boards or external puzzle data. */
(function (root) {
  'use strict';
  const levels = Object.freeze({easy:{label:'Easy',size:4,keep:.85},medium:{label:'Medium',size:5,keep:.72},hard:{label:'Hard',size:6,keep:.6},advanced:{label:'Advanced',size:7,keep:.5}});
  function topology(n) {
    const edges=[], cells=Array.from({length:n*n},()=>[]), vertices=Array.from({length:(n+1)**2},()=>[]);
    function add(a,b,adjacent,orientation,r,c) { const id=edges.length; edges.push({a,b,orientation,r,c}); vertices[a].push(id);vertices[b].push(id); adjacent.filter(x=>x>=0).forEach(x=>cells[x].push(id)); }
    for(let r=0;r<=n;r++) for(let c=0;c<n;c++) add(r*(n+1)+c,r*(n+1)+c+1,[r>0?(r-1)*n+c:-1,r<n?r*n+c:-1],'h',r,c);
    for(let r=0;r<n;r++) for(let c=0;c<=n;c++) add(r*(n+1)+c,(r+1)*(n+1)+c,[c>0?r*n+c-1:-1,c<n?r*n+c:-1],'v',r,c);
    return {n,edges,cells,vertices};
  }
  function singleLoop(t,values) {
    const active=[]; values.forEach((v,i)=>{if(v===1) active.push(i);});
    if(!active.length) return false;
    if(t.vertices.some(es=>{const d=es.filter(i=>values[i]===1).length;return d!==0&&d!==2;})) return false;
    const seen=new Set(), stack=[active[0]];
    while(stack.length) {const e=stack.pop();if(seen.has(e))continue;seen.add(e); const {a,b}=t.edges[e];for(const v of [a,b])for(const i of t.vertices[v])if(values[i]===1&&!seen.has(i))stack.push(i);}
    return seen.size===active.length;
  }
  function valid(p,values) {const t=topology(p.size);return values.length===t.edges.length&&values.every(v=>v===0||v===1||v===2)&&singleLoop(t,values)&&t.cells.every((es,i)=>p.clues[i]===null||es.reduce((s,e)=>s+(values[e]===1),0)===p.clues[i]);}
  // Constraint propagation plus bounded search; an exhausted search is never a uniqueness proof.
  function solve(size,clues,limit=2,budget=40000) {
    const t=topology(size), solutions=[];let nodes=0, exhausted=false;
    function visit(input) {
      if(solutions.length>=limit||exhausted)return;
      if(++nodes>budget){exhausted=true;return;}
      const state=input.slice();let changed=true;
      function assign(es,value){for(const e of es)if(state[e]===-1){state[e]=value;changed=true;}}
      while(changed) {
        changed=false;
        for(let i=0;i<clues.length;i++)if(clues[i]!==null){const es=t.cells[i],on=es.filter(e=>state[e]===1).length,unknown=es.filter(e=>state[e]===-1);if(on>clues[i]||on+unknown.length<clues[i])return;if(on===clues[i])assign(unknown,0);else if(on+unknown.length===clues[i])assign(unknown,1);}
        for(const es of t.vertices){const on=es.filter(e=>state[e]===1).length,u=es.filter(e=>state[e]===-1);if(on>2||(on===1&&!u.length))return;if(on===2||(on===0&&u.length===1))assign(u,0);else if(on===1&&u.length===1)assign(u,1);}
        // A closed component cannot coexist with another line component.
        const active=state.map((v,i)=>v===1?i:-1).filter(i=>i>=0),seen=new Set();
        for(const start of active){if(seen.has(start))continue;const stack=[start];let count=0,closed=true;while(stack.length){const e=stack.pop();if(seen.has(e))continue;seen.add(e);count++;for(const v of [t.edges[e].a,t.edges[e].b]){const adjacent=t.vertices[v].filter(i=>state[i]===1);if(adjacent.length!==2)closed=false;for(const i of adjacent)if(!seen.has(i))stack.push(i);}}if(closed){if(count!==active.length)return;assign(state.map((v,i)=>v===-1?i:-1).filter(i=>i>=0),0);}}
      }
      let choice=-1,best=-1;
      state.forEach((v,e)=>{if(v!==-1)return;const edge=t.edges[e];let score=t.vertices[edge.a].filter(i=>state[i]!==-1).length+t.vertices[edge.b].filter(i=>state[i]!==-1).length;for(let i=0;i<t.cells.length;i++)if(clues[i]!==null&&t.cells[i].includes(e))score+=5-t.cells[i].filter(i=>state[i]===-1).length;if(score>best){best=score;choice=e;}});
      if(choice<0){if(singleLoop(t,state))solutions.push(state);return;}
      for(const v of [0,1]){const next=state.slice();next[choice]=v;visit(next);}
    }
    visit(Array(t.edges.length).fill(-1));return {solutions,exhausted,nodes};
  }
  function rng(seed) {let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
  function shuffle(a,random){for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  async function generate(level='medium',seed=Date.now(),yieldControl=()=>Promise.resolve()) {
    if(!levels[level])throw new Error('Unknown difficulty');
    const {size:n,keep}=levels[level],t=topology(n),random=rng(seed);
    for(let attempt=0;attempt<24;attempt++) {
      const region=new Set([Math.floor(n/2)*n+Math.floor(n/2)]);
      const boundary=()=>t.edges.map(e=>{const {r,c,orientation}=e;const a=orientation==='h'?(r>0?(r-1)*n+c:-1):(c>0?r*n+c-1:-1);const b=orientation==='h'?(r<n?r*n+c:-1):(c<n?r*n+c:-1);return Number(region.has(a)!==region.has(b));});
      const target=Math.floor(n*n*(.45+random()*.3));
      for(let step=0;step<n*n*6&&region.size<target;step++) {const candidates=[];for(let i=0;i<n*n;i++)if(!region.has(i)){const r=Math.floor(i/n),c=i%n;if((r>0&&region.has(i-n))||(r<n-1&&region.has(i+n))||(c>0&&region.has(i-1))||(c<n-1&&region.has(i+1)))candidates.push(i);}if(!candidates.length)break;const i=candidates[Math.floor(random()*candidates.length)];region.add(i);if(!singleLoop(t,boundary()))region.delete(i);}
      const answer=boundary(),clues=t.cells.map(es=>es.reduce((s,e)=>s+answer[e],0));
      if(clues.some(c=>c>3))continue;
      const full=solve(n,clues);if(full.exhausted||full.solutions.length!==1)continue;
      let remaining=clues.length;
      for(const i of shuffle([...clues.keys()],random)) {if(remaining<=Math.ceil(n*n*keep))break;const old=clues[i];clues[i]=null;const check=solve(n,clues,2,16000);if(check.exhausted||check.solutions.length!==1)clues[i]=old;else remaining--;await yieldControl();}
      return {size:n,difficulty:level,seed,clues,answer};
    }
    throw new Error('Could not verify a unique puzzle. Please try again.');
  }
  const api=Object.freeze({levels,topology,singleLoop,valid,solve,generate});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LoopFence=api;
})(typeof window==='undefined'?globalThis:window);
