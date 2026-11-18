const test=require('node:test');
const assert=require('node:assert/strict');
const examples=require('../shared/tutorial-data.js');
const Loop=require('../games/loop-fence/engine.js');

test('Secret Code worked example has one four-card answer and submits letters',()=>{
  const e=examples['secret-code'],solutions=[],sumOnly=[],colorOnly=[];
  for(let a=0;a<6;a++)for(let b=a+1;b<6;b++)for(let c=b+1;c<6;c++)for(let d=c+1;d<6;d++){
    const cards=[a,b,c,d].map(i=>e.cards[i]);if(cards.reduce((sum,card)=>sum+card.number,0)===e.target)sumOnly.push(cards);if(cards.filter(card=>card.color==='Blue').length===2)colorOnly.push(cards);if(cards.reduce((sum,card)=>sum+card.number,0)===e.target&&cards.filter(card=>card.color==='Blue').length===2)solutions.push(cards.map(c=>c.letter).join(''));
  }
  assert.deepEqual(sumOnly.map(cards=>cards.map(card=>card.letter).join('')),['ABEF','ACDF','BCDE']);assert.equal(colorOnly.length,6);assert.deepEqual(solutions,[e.answer]);assert.deepEqual(e.steps[1].selected,['A']);assert.equal(e.answer,'ACDF');
  const final=e.steps.at(-1);assert.equal(final.solved,true);assert.equal([...final.selected].sort().join(''),e.answer);
  for(const step of e.steps){assert.equal(new Set(step.selected).size,step.selected.length);assert.ok(step.selected.every(l=>e.cards.some(c=>c.letter===l)));}
});

test('Loop Fence worked example traces one valid loop and optional crosses do not change it',()=>{
  const e=examples['loop-fence'],solved=Loop.solve(e.size,e.clues,2);assert.equal(solved.exhausted,false);assert.equal(solved.solutions.length,1);assert.deepEqual(solved.solutions[0],e.answer);
  for(const [i,step]of e.steps.entries()){
    assert.ok(step.crosses.every(id=>!step.edges.includes(id)));
    const values=Array(e.answer.length).fill(0);for(const id of step.edges)values[id]=1;for(const id of step.crosses)values[id]=2;
    assert.equal(Loop.valid(e,values),i>=2);
    if(step.solved)assert.deepEqual(values.map(v=>v===1?1:0),e.answer);
  }
});
