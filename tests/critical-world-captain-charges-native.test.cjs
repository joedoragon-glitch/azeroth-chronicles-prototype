'use strict';
// Real native 4 conventional captain line charges. One release per physical
// flight, never a per-segment/collision roll. No boss/Dreadmaw fallback.
const assert=require('node:assert/strict');
const C=require('../src/prototype/engine.js');
const Crit=require('../src/prototype/critical-executions.js');
const Levels=require('../src/prototype/critical-levels.js');
const World=require('../src/prototype/critical-world-native.js');
const {completeFieldOpening}=require('./helpers/field-opening.cjs');
const plans=[['supply-vale',0],['supply-march',0],['supply-highlands',0],['frontier-overseer',2]];
function arena(profile,index,withCompanion=false){
 const g=new C('normal','paladin',()=>.99);completeFieldOpening(g);
 const z=g.zone();for(const key of ['props','buildings','npcs','enemies'])z[key]=[];
 g.s.time=30;g.s.mercyTime=0;g.s.party=[];
 Object.assign(g.hero,{x:1470,y:1700,hp:10000,maxHp:10000,immune:0});
 if(withCompanion){
   const u=g.unit('soldier',1450,1700);u.hp=u.maxHp=10000;u.immune=0;g.s.party=[u];
 }
 const e=g.makeEnemy(
  {species:'orc',name:'Native charge '+profile,level:4,hp:10000,damage:300,gold:0,xp:0},
  {x:1400,y:1700});
 Object.assign(e,{aggro:true,captain:true,roomCaptain:true,captainProfile:profile,
 specialCd:0,lastCaptainAttack:-1});
 z.enemies=[e];g.zone=()=>z;
 let found=false;
 for(let n=0;n<100;n++){
  g.random=()=>n/100;e.lastCaptainAttack=-1;e.telegraph=null;e.sequence=[];
  if(g.startCaptainAttack(e,g.hero)&&e.telegraph?.index===index){found=true;break;}
 }
 assert(found,'original selector can produce '+profile+'/'+index);
 assert.equal(e.telegraph.kind,'line');
 assert.equal(e.telegraph.charge,true);
 assert.equal(e.sequence.length,0,'one warned charge, no hidden sequence');
 return {g,e};
}
function attach(g,level=1,roll=0){
 let calls=0;const session=World.createSession(Crit,Levels,{enabled:true,stream:{next(){calls++;return roll;}}});
 session.setCriticalLevel('world',level);g._criticalWorldNative=session;
 return {count:()=>calls,session};
}
function near(x,y,msg){assert(Math.abs(x-y)<1e-6,msg+': '+x+' vs '+y);}
function motion(g,e){
 for(let i=0;i<60&&e.motion;i++)g.advanceMotion(e,.05);
 assert.equal(e.motion,null,'native charge eventually completes or collides');
}
assert.equal(C.prototype._criticalWorldNative,undefined,'critical not in live Campaign');
for(const [profile,index] of plans){
 for(const level of [1,2,3]){
  const a=arena(profile,index,true),b=arena(profile,index,true),t=attach(b.g,level);
  const warning=b.e.telegraph.timer,rec=b.e.telegraph.recovery;
  assert.equal(t.count(),0,'no roll during selector or warning');
  a.g.resolveAttack(a.e);b.g.resolveAttack(b.e);
  assert.equal(t.count(),1,'charge commits one World sample at movement start');
  const receipt=b.e.motion?.criticalExecution;
  assert(receipt&&Object.isFrozen(receipt),'immutable native charge receipt');
  assert.equal(receipt.key,'world/captain/'+profile+'/'+index);
  assert.equal(receipt.domain,'world');
  assert.equal(receipt.intensity,level);
  assert.equal(b.e.motion.timer,warning,'warned timer preserved');
  assert.equal(b.e.motion.recovery,rec,'recovery retained');
  assert.equal(a.e.motion.speed,b.e.motion.speed,'flight speed unchanged');
  assert.equal(a.e.motion.life,b.e.motion.life,'flight expiry unchanged');
  t.session.setCriticalLevel('world',3);
  motion(a.g,a.e);motion(b.g,b.e);
  assert.equal(t.count(),1,'motion ticks and each victim never reroll');
  const baseline=10000-a.g.hero.hp,critical=10000-b.g.hero.hp;
  assert(baseline>0,'real native charge crosses hero '+profile);
  assert(critical>baseline,'existing lawful hit strengthened at level '+level);
  near(a.e.x,b.e.x,'unchanged physical destination x');
  near(a.e.y,b.e.y,'unchanged physical destination y');
  assert.equal(a.g.s.projectiles.length,b.g.s.projectiles.length,'no invented missile');
  assert.equal(a.g.s.hazards.length,b.g.s.hazards.length,'no invented floor hazard');
  assert.equal(a.e.cd,b.e.cd,'native recovery unchanged');
  assert.equal(a.g.s.party[0].hp<10000,b.g.s.party[0].hp<10000,'same original second victim');
 }
 const a=arena(profile,index),b=arena(profile,index),t=attach(b.g,2,.99);
 a.g.resolveAttack(a.e);b.g.resolveAttack(b.e);
 motion(a.g,a.e);motion(b.g,b.e);
 assert.equal(t.count(),1,'noncritical decision remains one sample');
 near(a.g.hero.hp,b.g.hero.hp,'failed critical preserves original damage');
}
{
 const a=arena('supply-vale',0),t=attach(a.g,1);
 a.e.telegraph=null;a.g.resolveAttack(a.e);
 assert.equal(t.count(),0,'cancelled attack never commits RNG');
}
{
 const a=arena('supply-march',0),t=attach(a.g,3);
 a.g.hero.immune=3;const hp=a.g.hero.hp;
 a.g.resolveAttack(a.e);motion(a.g,a.e);
 assert.equal(t.count(),1,'immune target does not change action release');
 assert.equal(a.g.hero.hp,hp,'immunity remains absolute');
}
{
 const a=arena('supply-march',0),t=attach(a.g,1);
 a.g.resolveAttack(a.e);
 const start=a.g.hero.hp;
 a.g.move=()=>false;
 motion(a.g,a.e);
 assert.equal(t.count(),1,'blocked movement rolls at original committed release');
 assert.equal(a.g.hero.hp,start,'blocked movement never causes warning-free hit');
}
console.log('PASS World 4 captain physical charges: three tiers each, real selector/flight/contact, immutable receipt, two victims, cancel, immunity and no-crit parity');
