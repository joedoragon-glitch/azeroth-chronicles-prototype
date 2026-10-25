'use strict';
// Native Scornfang tracking salvo, on the original 4-shot captain path.
// One world release per full cast, NOT per warning, retarget, arrow or impact.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine.js');
const Critical=require('../src/prototype/critical-executions.js');
const Levels=require('../src/prototype/critical-levels.js');
const World=require('../src/prototype/critical-world-native.js');
const {completeFieldOpening}=require('./helpers/field-opening.cjs');
function arena() {
  const g=new Campaign('normal','paladin',()=>.99);
  completeFieldOpening(g);
  const z=g.zone();for(const key of ['props','buildings','npcs','enemies'])z[key]=[];
  g.s.time=30;g.s.mercyTime=0;g.s.party=[];
  Object.assign(g.hero,{x:1470,y:1700,hp:10000,maxHp:10000,immune:0});
  const e=g.makeEnemy(
    {species:'goblin',name:'Tracking native captain',level:4,hp:10000,damage:300,xp:0,gold:0},
    {x:1400,y:1700});
  Object.assign(e,{aggro:true,captain:true,roomCaptain:true,captainProfile:'supply-vale',
    specialCd:0,lastCaptainAttack:-1});
  z.enemies=[e];g.zone=()=>z;
  let selected=false;
  for(let n=0;n<100;n++) {
    g.random=()=>n/100;
    e.telegraph=null;e.sequence=[];e.lastCaptainAttack=-1;
    if(g.startCaptainAttack(e,g.hero) && e.telegraph?.index===3) {
      selected=true;break;
    }
  }
  assert(selected,'native plan selector must select Scornfang tracking action');
  assert.equal(e.telegraph.shotNumber,1);
  assert.equal(e.telegraph.kind,'volley');
  assert.equal(e.sequence.length,3);
  assert.deepEqual(e.sequence.map(a=>a.shotNumber),[2,3,4]);
  return {g,e};
}
function attach(g,level=1,roll=0) {
  let calls=0;
  const session=World.createSession(Critical,Levels,{
    enabled:true,stream:{next(){calls++;return roll;}},
  });
  session.setCriticalLevel('world',level);g._criticalWorldNative=session;
  return {count:()=>calls,session};
}
function near(a,b,label){assert(Math.abs(a-b)<1e-7,label+': '+a+' vs '+b);}
function fire(g,e) {
  assert(e.telegraph,'existing warning needed');
  const a=e.telegraph;
  assert(a.tracking&&a.captainSkill,'real tracking captain action');
  g.resolveAttack(e);
  e.telegraph=g.advanceQueuedAttack(e);
  return a;
}
assert.equal(Campaign.prototype._criticalWorldNative,undefined,'session not attached to production');
for(const level of [1,2,3]){
  const x=arena(),y=arena(),t=attach(y.g,level);
  const originalCount=y.g.s.projectiles.length;
  assert.equal(t.count(),0,'action selection and warnings do not roll');
  let receipt=null;
  for(let shot=1;shot<=4;shot++){
    assert.equal(x.e.telegraph.shotNumber,shot);
    assert.equal(y.e.telegraph.shotNumber,shot);
    const oldTimer=x.e.telegraph.timer,newTimer=y.e.telegraph.timer;
    const ax=fire(x.g,x.e),ay=fire(y.g,y.e);
    assert.equal(t.count(),1,'all four shots use one World roll');
    assert.equal(ay.timer,newTimer,'warning was not shortened');
    assert.equal(ax.timer,oldTimer,'baseline warning unmodified');
    if(shot===1){
      receipt=ay.criticalExecution;
      assert(receipt&&Object.isFrozen(receipt),'immutable original-shot receipt');
      assert.equal(receipt.key,'world/captain/supply-vale/3');
      assert.equal(receipt.domain,'world');
      assert.equal(receipt.intensity,level);
      t.session.setCriticalLevel('world',3,'normal');
    }
    assert.strictEqual(ay.criticalExecution,receipt,'same receipt in queued warned stage');
    const p=x.g.s.projectiles.at(-1),q=y.g.s.projectiles.at(-1);
    assert.strictEqual(q.criticalExecution,receipt,'same receipt in real projectile');
    near(q.damage,p.damage*Levels.LEVERS.damage.values[level-1],
      'native shot '+shot+' remains at level '+level);
    for(const f of ['speed','life','dx','dy','source','sourceId','style'])
      assert.equal(q[f],p[f],'native shot geometry and ownership unchanged: '+f);
    assert.equal(y.g.s.projectiles.length,x.g.s.projectiles.length,'no additional projectile');
    assert.equal(y.e.sequence.length,x.e.sequence.length,'same 4-shot sequence');
  }
  assert.equal(t.count(),1,'whole activation has exactly one sample');
  assert.equal(y.g.s.projectiles.length,originalCount+4);
  assert.equal(y.e.telegraph,null);
  assert.equal(y.e.sequence.length,0);
  const oldHp=x.g.hero.hp,newHp=y.g.hero.hp;
  for(let i=0;i<20;i++){
    x.g.updateProjectiles(.05);
    y.g.updateProjectiles(.05);
  }
  assert.equal(t.count(),1,'travel, collision and repeated impacts never reroll');
  assert(x.g.hero.hp<oldHp,'baseline shot physically hits');
  assert(y.g.hero.hp<newHp,'critical shot physically hits');
  assert(y.g.hero.hp<x.g.hero.hp,'native critical damage stronger');
}
{
  const x=arena(),y=arena(),t=attach(y.g,2,.99);
  for(let i=0;i<4;i++){fire(x.g,x.e);fire(y.g,y.e);}
  assert.equal(t.count(),1,'noncritical still samples once');
  assert.deepEqual(x.g.s.projectiles.map(p=>p.damage),y.g.s.projectiles.map(p=>p.damage),
    'noncritical outcomes identical');
}
{
  const x=arena(),t=attach(x.g);
  x.g.hero.hp=0;
  fire(x.g,x.e);
  assert.equal(t.count(),0,'lost target before first release consumes no roll');
  assert.equal(x.g.s.projectiles.length,0);
  assert.equal(x.e.sequence.length,0,'native tracking cancellation remains');
}
{
  const x=arena(),t=attach(x.g,3);
  fire(x.g,x.e);
  assert.equal(t.count(),1);
  x.g.hero.hp=0;
  assert.equal(x.g.advanceQueuedAttack(x.e),null,
    'lost target cancels queued follow-up warnings');
  assert.equal(x.e.sequence.length,0);
  assert.equal(x.g.s.projectiles.length,1,'first released projectile is not duplicated');
  assert.equal(t.count(),1,'queued cancellation never consumes another roll');
}
{
  const x=arena(),t=attach(x.g);
  x.e.telegraph=null;
  x.g.resolveAttack(x.e);
  assert.equal(t.count(),0,'cancelled original warning has no release');
}
console.log('PASS World Scornfang tracked volley: real selector, 4 shots/1 roll, 3 tiers, retained timers/geometry, independent impact, lost target and no-crit parity');
