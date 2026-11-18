(function(root){
  'use strict';
  const example={values:[2,4,3,5,4,6,5],target:12,answer:'ADG',steps:[
    {phase:'study',selected:[],text:'This small example has seven tiles. Memorize their numbers and positions. Focus on A = 2, D = 5, and G = 5.'},
    {phase:'study',selected:[],trace:true,text:'A → D → G are three adjacent tiles on one straight diagonal. Remember their values: 2, 5, 5.'},
    {phase:'recall',selected:[],text:'The numbers disappear and target 12 is revealed. The letters identify the same tile positions.'},
    {phase:'recall',selected:['A'],text:'Choose A first. We remember the number 2 at that position.'},
    {phase:'recall',selected:['A','D'],text:'Choose its neighbor D. We remember 5, so the running total is 2 + 5 = 7.'},
    {phase:'recall',selected:['A','D','G'],trace:true,text:'Choose the next neighbor G, also 5. The three tiles form a straight line and 2 + 5 + 5 = 12.'},
    {phase:'review',selected:['A','D','G'],trace:true,solved:true,text:'Submit ADG for +1 point. CDE is another valid line: 3 + 5 + 4 = 12. In a real round, find all matching lines without repeating one.'}
  ]};
  if(typeof module!=='undefined'&&module.exports)module.exports=example;else root.HexagonExample=example;
})(typeof window==='undefined'?globalThis:window);
