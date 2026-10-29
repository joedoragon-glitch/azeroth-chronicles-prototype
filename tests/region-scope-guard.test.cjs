'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {audit,named}=require('../scripts/region-scope-guard.cjs');
function diff(path,line) {return 'diff --git a/'+path+' b/'+path+'\n--- a/'+path+'\n+++ b/'+path+'\n@@ -1,0 +1 @@\n+'+line+'\n';}
function gv(path,line) {return audit({branch:'feature/greenwood-redesign',title:'Greenwood Vale',diff:diff(path,line)});}
test('regional aliases avoid false substring matches',()=>{
  assert.deepEqual(named('marching onward'),[]);
  assert.deepEqual(named("z.id === 'crown'"),['crown']);
});
test('target-only Greenwood source passes',()=>{
  assert.deepEqual(gv('src/prototype/greenwood.js',"if(z.id==='vale') layout();").errors,[]);
});
test('non-runtime documents do not create a scope violation',()=>{
  assert.deepEqual(gv('docs/DEVELOPMENT_STATE.md','Ironroot remains unchanged').errors,[]);
});
test('PR 570 Ironroot module repair is forbidden',()=>{
  assert.match(gv('src/prototype/highlands.js','z.highlandsFinalRoadsideVersion=1').errors.join(' '),/belongs to highlands/);
});
test('PR 570 moved Ironroot ogre habitat in shared rules',()=>{
  assert.match(gv('src/prototype/rules.js',"id:'ogre-hearth',").errors.join(' '),/highlands/);
});
test('PR 570 generic world finalizer explicitly operated on Crown and Frontier',()=>{
  assert.match(gv('src/prototype/world.js',"for(const region of ['frontier','crown'])").errors.join(' '),/frontier,crown/);
});
test('Marches repairs in shared world source are forbidden',()=>{
  assert.match(gv('src/prototype/world.js',"if(z.id==='march') repair();").errors.join(' '),/march/);
});
test('undeclared region-owned change fails closed',()=>{
  assert.match(audit({branch:'feature/layout',title:'Layout',diff:diff('src/prototype/highlands.js','const a=1')}).errors.join(' '),/without naming/);
});
test('legitimate unrelated PRs are not classified as regional',()=>{
  assert.deepEqual(audit({branch:'feature/audio',title:'Audio',diff:diff('src/prototype/audio.js','const a=1')}).errors,[]);
});
