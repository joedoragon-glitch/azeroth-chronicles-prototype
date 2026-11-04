'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const Threats=require('../src/prototype/strategist-lab-threats.js');
function game() {
  return {
    s:{time:0,zone:'vale',zones:{
      vale:{enemies:[]},
      march:{enemies:[{id:'mob-1',x:220,y:220,hp:100,neutral:false,returning:false}]},
    }},
    calls:0,
    enemyAcquisitionRange(enemy){this.calls++;return 250;},
  };
}
test('authored remote hostile stops labor without mutating active region or enemy',()=>{
  const g=game();
  const before=JSON.stringify(g.s.zones.march.enemies);
  const threats=Threats.create({sight:()=>true});
  const t=threats.inspect(g,'march',{x:150,y:220,workerId:'ally-1'});
  assert.deepEqual(t,{safe:false,threatId:'mob-1',reason:'hostile'});
  assert.equal(g.s.zone,'vale');
  assert.equal(JSON.stringify(g.s.zones.march.enemies),before);
  assert.equal(threats.safeFromThreat(g,'march',{x:150,y:220},{id:'ally-1'}),false);
});
test('neutral/dead/returning enemies do not invent combat encounters',()=>{
  const g=game();const e=g.s.zones.march.enemies[0];
  const threats=Threats.create({sight:()=>true});
  e.neutral=true;
  assert.equal(threats.inspect(g,'march',{x:150,y:220,workerId:'a'}).safe,true);
  threats.invalidate(g);e.neutral=false;e.hp=0;
  assert.equal(threats.inspect(g,'march',{x:150,y:220,workerId:'a'}).safe,true);
  threats.invalidate(g);e.hp=100;e.returning=true;
  assert.equal(threats.inspect(g,'march',{x:150,y:220,workerId:'a'}).safe,true);
});
test('line-of-sight and actual native awareness gate threat',()=>{
  const g=game();const t=Threats.create({sight:()=>false});
  assert.equal(t.inspect(g,'march',{x:150,y:220,workerId:'a'}).safe,true);
  assert.equal(t.inspect(g,'march',{x:800,y:800,workerId:'b'}).safe,true);
});
test('worst-case twenty workers use cached no-mutation threat queries',()=>{
  const g=game(),t=Threats.create({sight:()=>true});
  for(let i=0;i<20;i++){
    const id='ally-'+i,p={x:150,y:220,workerId:id};
    for(let j=0;j<20;j++)t.inspect(g,'march',p);
  }
  assert.equal(g.calls,20,'one actual enemy awareness call per worker');
  g.s.time=0.5;
  t.inspect(g,'march',{x:150,y:220,workerId:'ally-0'});
  assert.equal(g.calls,21);
});
test('missing native sources fail closed, not guaranteed worker immunity',()=>{
  const g=game();
  const t=Threats.create();
  assert.deepEqual(t.inspect(g,'march',{x:150,y:220,workerId:'a'}),
    {safe:false,threatId:null,reason:'unverified'});
  assert.equal(t.safeFromThreat(g,'march',{x:150,y:220},{id:'a'}),false);
});
