const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../engine.js');

// Independent traversal of selected horizontal/vertical segments, without the engine validator.
function check(p, values) {
  const n=p.size, segments=[];
  let index=0;
  for(let r=0;r<=n;r++)for(let c=0;c<n;c++,index++)if(values[index]===1)segments.push([`${r},${c}`,`${r},${c+1}`]);
  for(let r=0;r<n;r++)for(let c=0;c<=n;c++,index++)if(values[index]===1)segments.push([`${r},${c}`,`${r+1},${c}`]);
  if(!segments.length)return false;
  const neighbors=new Map();for(const [a,b]of segments){if(!neighbors.has(a))neighbors.set(a,[]);if(!neighbors.has(b))neighbors.set(b,[]);neighbors.get(a).push(b);neighbors.get(b).push(a);}
  if([...neighbors.values()].some(a=>a.length!==2))return false;
  const seen=new Set(),stack=[segments[0][0]];while(stack.length){const v=stack.pop();if(seen.has(v))continue;seen.add(v);stack.push(...neighbors.get(v));}if(seen.size!==neighbors.size)return false;
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){const clue=p.clues[r*n+c];if(clue===null)continue;const ids=[r*n+c,(r+1)*n+c,n*(n+1)+r*(n+1)+c,n*(n+1)+r*(n+1)+c+1];if(ids.filter(i=>values[i]===1).length!==clue)return false;}
  return true;
}

test('solver agrees with exhaustive enumeration on small boards',()=>{
  const patterns=[[null,null,null,null],[3,1,1,3],[0,0,0,0],[2,2,2,2],[3,null,2,null],[1,1,1,1],[0,3,3,0]];
  for(const clues of patterns){let expected=0;for(let bits=0;bits<4096;bits++){const values=Array.from({length:12},(_,i)=>(bits>>i)&1);if(check({size:2,clues},values))expected++;}
    const result=E.solve(2,clues,1000);assert.equal(result.exhausted,false);assert.equal(result.solutions.length,expected,JSON.stringify(clues));}
});

test('generation is repeatable, legal and uniquely solvable across all levels',async()=>{
  const signatures=new Set();
  for(const [level,config]of Object.entries(E.levels))for(let seed=1;seed<=80;seed++){
    const p=await E.generate(level,seed);assert.equal(p.size,config.size);assert.equal(p.difficulty,level);assert.ok(p.clues.every(c=>c===null||Number.isInteger(c)&&c>=0&&c<=3));
    assert.ok(check(p,p.answer));assert.ok(E.valid(p,p.answer));
    const solved=E.solve(p.size,p.clues,2);assert.equal(solved.exhausted,false);assert.equal(solved.solutions.length,1);assert.deepEqual(solved.solutions[0],p.answer);
    signatures.add(`${level}:${JSON.stringify(p.clues)}`);
    if(seed===1)assert.deepEqual(await E.generate(level,seed),p);
  }
  assert.ok(signatures.size>300);
});

test('submission rejects empty, open, branching, disconnected and clue-breaking drawings',async()=>{
  const p=await E.generate('easy',122);
  assert.equal(E.valid(p,Array(p.answer.length).fill(0)),false);
  const open=p.answer.slice();open[open.indexOf(1)]=0;assert.equal(E.valid(p,open),false);
  const branch=p.answer.slice();branch[branch.indexOf(0)]=1;assert.equal(E.valid(p,branch),false);
  const crossed=p.answer.map(v=>v===1?1:2);assert.equal(E.valid(p,crossed),true);
  const t=E.topology(4), two=Array(t.edges.length).fill(0);for(const i of [...t.cells[0],...t.cells[15]])two[i]=1;
  assert.equal(E.valid({size:4,clues:Array(16).fill(null)},two),false);
  const wrong={...p,clues:p.clues.slice()};const c=wrong.clues.findIndex(v=>v!==null);wrong.clues[c]=(wrong.clues[c]+1)%4;assert.equal(E.valid(wrong,p.answer),false);
  assert.equal(E.valid(p,p.answer.slice(1)),false);
});

test('bounded search reports exhaustion instead of claiming uniqueness',()=>{
  const result=E.solve(4,Array(16).fill(null),2,1);assert.equal(result.exhausted,true);
});

test('phone corner input resolves to the nearest line at every difficulty and viewport size',()=>{
  for(const {size}of Object.values(E.levels))for(const width of [258,312,434]){
    // Near a corner, choose the edge with the shorter perpendicular distance.
    assert.equal(E.hitEdge(size,9,8,width),0);
    assert.equal(E.hitEdge(size,8,9,width),size*(size+1));
    assert.equal(E.hitEdge(size,0,0,width),null,'dots do not choose an arbitrary edge');
    assert.equal(E.hitEdge(size,9,9,width),null,'equidistant corners are ambiguous');
    const step=width/size;
    assert.equal(E.hitEdge(size,step/2,step/2,width),null,'cell centers never draw');
    assert.equal(E.hitEdge(size,width-step/2,width,width),size*size+size-1);
    assert.equal(E.hitEdge(size,width,width-step/2,width),2*size*(size+1)-1);
    assert.equal(E.hitEdge(size,-50,-50,width),null);
  }
});

test('reveal comparison preserves the attempt and identifies missing/extra borders and affected cells',async()=>{
  const p=await E.generate('advanced',88),attempt=p.answer.map(v=>v===1?1:2);
  const missing=attempt.findIndex(v=>v===1),extra=attempt.findIndex(v=>v===2);attempt[missing]=0;attempt[extra]=1;
  const original=attempt.slice(),report=E.compare(p,attempt),topology=E.topology(p.size);
  assert.deepEqual(attempt,original);assert.equal(report.correct,false);assert.deepEqual(report.missing,[missing]);assert.deepEqual(report.extra,[extra]);
  assert.deepEqual(report.cells,topology.cells.map((edges,i)=>edges.includes(missing)||edges.includes(extra)?i:-1).filter(i=>i>=0));
  assert.equal(E.compare(p,p.answer).correct,true);assert.deepEqual(E.compare(p,p.answer).cells,[]);
  const notes=p.answer.map(v=>v===1?1:2);assert.equal(E.compare(p,notes).correct,true);assert.deepEqual(E.compare(p,notes).missing,[]);
});

test('all generated correct loops remain accepted after noisy corner taps are resolved spatially',async()=>{
  for(const level of Object.keys(E.levels))for(let seed=1;seed<=20;seed++){
    const p=await E.generate(level,seed),t=E.topology(p.size),values=Array(t.edges.length).fill(0),step=312/p.size;
    t.edges.forEach((edge,id)=>{if(p.answer[id]!==1)return;const x=edge.c*step+(edge.orientation==='h'?9:8),y=edge.r*step+(edge.orientation==='v'?9:8);const hit=E.hitEdge(p.size,x,y,312);assert.equal(hit,id);values[hit]=1;});
    assert.equal(E.valid(p,values),true);
  }
});

test('reveal includes incorrect blank cells without pretending they have numbered clues',async()=>{
  const p=await E.generate('advanced',90),cell=p.clues.findIndex(c=>c===null),t=E.topology(p.size),edge=t.cells[cell][0],attempt=p.answer.slice();
  attempt[edge]=attempt[edge]===1?0:1;
  const report=E.compare(p,attempt);
  assert.equal(report.correct,false);assert.ok(report.cells.includes(cell));assert.equal(report.clueCells.includes(cell),false);
});
