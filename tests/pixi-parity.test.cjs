'use strict';
const assert = require('node:assert/strict');
const R = require('../src/prototype/renderer.js');
const boss = {type:'boss',family:'warlord',aggro:true,hp:100,
  ashCloud:{x:25,y:40,expires:16}};
const game={s:{time:10},zone:()=>({enemies:[boss]})};
const project=p=>({x:p.x*1.52,y:p.y*.54});
assert.deepEqual(R.ashCloudPresentation(game,project,2),[
  {x:38,y:21.6,rx:273.6,ry:131.328,lineWidth:5}]);
for(const change of [{hp:0},{aggro:false},{ashCloud:{x:25,y:40,expires:10}}]) {
  const old={...boss};Object.assign(boss,change);
  assert.deepEqual(R.ashCloudPresentation(game,project,2),[]);
  Object.assign(boss,old);
}
boss.family='ridge';boss.ledgerMarkedId='hero';boss.ledgerMarkUntil=11;
assert(R.ledgerMarked(game,{renderKind:'hero',id:'different'}));
assert(!R.ledgerMarked(game,{renderKind:'ally',id:'different'}));
boss.ledgerMarkedId='ally-7';
assert(R.ledgerMarked(game,{renderKind:'ally',id:'ally-7'}));
assert(!R.ledgerMarked(game,{renderKind:'enemy',id:'ally-7'}));
game.s.time=11;
assert(!R.ledgerMarked(game,{renderKind:'ally',id:'ally-7'}));
game.zone=()=>({enemies:[]});
assert.deepEqual(R.ashCloudPresentation(game,project,2),[]);
assert(!R.ledgerMarked(game,{renderKind:'hero'}));
console.log('PASS #748 critical fields: shared geometry, target identity, expiry and zone cleanup');
