/* Deliberately small worked examples, independent of the player's current puzzle. */
(function(root){
  'use strict';
  const examples={
    'secret-code':{
      title:'Use the clues. Find the cards. Read their letters.',
      cards:[{letter:'A',number:3,color:'Blue'},{letter:'B',number:7,color:'Gold'},{letter:'C',number:8,color:'Blue'},{letter:'D',number:10,color:'Gold'},{letter:'E',number:11,color:'Jade'},{letter:'F',number:15,color:'Jade'}],
      target:36,answer:'ACDF',conditions:[{id:'blue',text:'Exactly two selected cards are Blue.'},{id:'sum',text:'The four selected numbers add up to 36.'}],
      steps:[
        {selected:[],text:'Choose four cards using both conditions. Numbers and colors help you find the cards; the letters on those cards form the answer.'},
        {selected:['A'],text:'There are only two Blue cards on this example board: A and C. We need both. Start by clicking A (3).'},
        {selected:['A','C'],text:'Click C (8), the other Blue card. Both required Blue cards are now selected, so mark the color condition complete.'},
        {selected:['A','C'],excluded:['B','E'],text:'A and C total 11. We need 36 − 11 = 25 more from two cards. Only D (10) + F (15) make 25; leave B and E out.'},
        {selected:['A','C','D'],excluded:['B','E'],text:'Click D (10). The running total is 3 + 8 + 10 = 21. We still need 15.'},
        {selected:['A','C','D','F'],excluded:['B','E'],text:'Click F (15). We have four cards, exactly two Blue, and 3 + 8 + 10 + 15 = 36. Both conditions are complete.'},
        {selected:['A','C','D','F'],excluded:['B','E'],solved:true,text:'Read the selected cards’ letters: A, C, D, F. Submit ACDF. Your real puzzle uses 26 cards and more conditions; its answer may use different letters.'}
      ]
    },
    'loop-fence':{
      title:'Four clues. One closed loop.',conditions:[{id:'clues',text:'Every cell has exactly two fence sides.'},{id:'loop',text:'The fence is one closed loop.'},{id:'branches',text:'No branches or crossings.'}],size:2,clues:[2,2,2,2],answer:[1,1,0,0,1,1,1,0,1,1,0,1],
      steps:[
        {edges:[],crosses:[],text:'Mini example: each 2 needs exactly two of its cell’s four sides. Draw one closed loop.'},
        {edges:[0,1,8,11],crosses:[],text:'Draw the top and right sides of the outer fence. The top-right cell now has its two sides.'},
        {edges:[0,1,8,11,5,4,9,6],crosses:[],text:'Continue along the bottom and left. The fence closes into one loop, and every cell has exactly two sides.'},
        {edges:[0,1,8,11,5,4,9,6],crosses:[2,3,7,10],text:'The four interior edges are unused. Crosses can record this, but they are optional notes.'},
        {edges:[0,1,8,11,5,4,9,6],crosses:[2,3,7,10],solved:true,text:'Submit the loop. All four clues match, with no branches, crossings or separate loops. Your real board follows the same rules.'}
      ]
    }
  };
  if(typeof module!=='undefined'&&module.exports)module.exports=examples;else root.TutorialExamples=examples;
})(typeof window==='undefined'?globalThis:window);
