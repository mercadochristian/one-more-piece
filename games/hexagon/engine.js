/* Original solo memory rounds on a radius-two hexagonal grid. */
(function(root){
  'use strict';
  const levels=Object.freeze({
    easy:{label:'Easy',max:5,memorySeconds:60,answerSeconds:0},
    medium:{label:'Medium',max:9,memorySeconds:30,answerSeconds:0},
    hard:{label:'Hard',max:9,memorySeconds:20,answerSeconds:90},
    advanced:{label:'Advanced',max:12,memorySeconds:12,answerSeconds:60}
  });
  function cells(radius=2){
    const result=[];
    for(let r=-radius;r<=radius;r++)for(let q=Math.max(-radius,-r-radius);q<=Math.min(radius,-r+radius);q++)result.push({letter:String.fromCharCode(65+result.length),q,r});
    return result;
  }
  function lines(board){
    const byPosition=new Map(board.map(c=>[`${c.q},${c.r}`,c.letter])),result=[];
    for(const c of board)for(const [dq,dr]of [[1,0],[0,1],[1,-1]]){
      const middle=byPosition.get(`${c.q+dq},${c.r+dr}`),last=byPosition.get(`${c.q+2*dq},${c.r+2*dr}`);
      if(middle&&last)result.push([c.letter,middle,last].sort().join(''));
    }
    return result.sort();
  }
  function key(letters){return typeof letters==='string'?[...letters.toUpperCase()].sort().join(''):Array.isArray(letters)?letters.map(l=>String(l).toUpperCase()).sort().join(''):'';}
  function solutions(board,target){const byLetter=new Map(board.map(c=>[c.letter,c.number]));return lines(board).filter(line=>[...line].reduce((sum,l)=>sum+byLetter.get(l),0)===target);}
  function check(puzzle,letters,found=[]){
    const answer=key(letters);
    if(answer.length!==3||new Set(answer).size!==3||![...answer].every(l=>puzzle.board.some(c=>c.letter===l)))return {ok:false,reason:'selection'};
    if(!lines(puzzle.board).includes(answer))return {ok:false,reason:'line'};
    if(found.includes(answer))return {ok:false,reason:'duplicate'};
    const numbers=[...answer].map(l=>puzzle.board.find(c=>c.letter===l).number);
    if(numbers.reduce((a,b)=>a+b,0)!==puzzle.target)return {ok:false,reason:'sum'};
    return {ok:true,key:answer};
  }
  function seeded(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
  function generate(difficulty='medium',seed=Date.now()){
    const config=levels[difficulty];if(!config)throw new Error('Unknown difficulty');const random=seeded(seed);
    for(let attempt=0;attempt<100;attempt++){
      const board=cells().map(c=>({...c,number:1+Math.floor(random()*config.max)})),groups=new Map();
      for(const line of lines(board)){const sum=[...line].reduce((total,l)=>total+board.find(c=>c.letter===l).number,0);if(!groups.has(sum))groups.set(sum,[]);groups.get(sum).push(line);}
      const targets=[...groups].filter(([,answers])=>answers.length>=2&&answers.length<=5);
      if(targets.length){const [target,answers]=targets[Math.floor(random()*targets.length)];return {difficulty,seed,board,target,answers};}
    }
    throw new Error('Could not generate a playable round. Try again.');
  }
  const api=Object.freeze({levels,cells,lines,key,solutions,check,generate});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Hexagon=api;
})(typeof window==='undefined'?globalThis:window);
