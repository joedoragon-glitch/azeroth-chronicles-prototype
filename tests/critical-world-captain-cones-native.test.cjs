'use strict';
// Native captain area ownership; only four authored single-release cones.
// No changed warnings, footprint, recovery, AI target, guards or add spawns.
const assert=require('node:assert/strict');
const C=require('../src/prototype/engine.js');
const Crit=require('../src/prototype/critical-executions.js');
const Levels=require('../src/prototype/critical-levels.js');
const World=require('../src/prototype/critical-world-native.js');
const {completeFieldOpening}=require('./helpers/field-opening.cjs');
const plans=[
 ['supply-vale',2],['supply-march',1],['supply-highlands',2],
 ['frontier-overseer',0],
];
function arena(profile,index,extra={}){
 const g=new C('normal','paladin',()=>.99);completeFieldOpening(g);
 const z=g.zone();for(const k of ['props','buildings','npcs','enemies'])z[k]=[];
 g.s.time=30;g.s.mercyTime=0;g.s.party=[];
 Object.assign(g.hero,{x:1470,y:1700,hp:10000,maxHp:10000,immune:0});
 const e=g.makeEnemy(
  {species:'orc',name:'Critical captain',level:4,hp:10000,damage:300,xp:0,gold:0},
  {x:1400,y:1700});
 Object.assign(e,{aggro:true,captain:true,roomCaptain:true,captainProfile:profile,
  specialCd:0,lastCaptainAttack:-1,...extra});
 z.enemies=[e];g.zone=()=>z;
 // Exercise the actual native attack selector (not a fabricated telegraph).
 // All ordinary cone actions are eligible at this in-range location.
 let chosen=false;
 for(let sample=0;sample<100;sample++){
  g.random=()=>sample/100;
  e.lastCaptainAttack=-1;e.telegraph=null;e.sequence=[];
  if(!g.startCaptainAttack(e,g.hero))continue;
  if(e.telegraph?.index===index){chosen=true;break;}
 }
 assert(chosen,'native cone selectable: '+profile+' index '+index);
 assert(e.telegraph.captainSkill&&e.telegraph.kind==='cone');
 return {g,e};
}
function attach(g,level=1,roll=0){
 let calls=0;
 const session=World.createSession(Crit,Levels,{enabled:true,stream:{next(){calls++;return roll;}}});
 session.setCriticalLevel('world',level);g._criticalWorldNative=session;
 return {count:()=>calls,session};
}
const close=(a,b,label)=>assert(Math.abs(a-b)<1e-6,label+': '+a+' != '+b);
for(const [profile,index] of plans){
 for(const level of [1,2,3]){
  const a=arena(profile,index),b=arena(profile,index),t=attach(b.g,level);
  const prior=b.e.telegraph,warning=prior.timer,recovery=prior.recovery;
  assert.equal(t.count(),0,'selecting and warning do not consume critical RNG');
  a.g.resolveAttack(a.e);b.g.resolveAttack(b.e);
  assert.equal(t.count(),1,'one real cone release '+profile+'/'+index);
  const receipt=prior.criticalExecution;
  assert(receipt&&Object.isFrozen(receipt));
  assert.equal(receipt.key,'world/captain/'+profile+'/'+index);
  assert.equal(receipt.intensity,level);
  assert.equal(prior.timer,warning,'native warning untouched');
  assert.equal(prior.recovery,recovery,'native recovery untouched');
  const before=10000-a.g.hero.hp,after=10000-b.g.hero.hp;
  assert(before>0,profile+' cone really contacted');
  assert(after>before,profile+' tier '+level+' enhances existing cone');
  assert.equal(a.g.s.projectiles.length,b.g.s.projectiles.length,'no extra projectiles');
  assert.equal(a.g.s.hazards.length,b.g.s.hazards.length,'no extra hazards');
 }
 const a=arena(profile,index),b=arena(profile,index),t=attach(b.g,3,.99);
 a.g.resolveAttack(a.e);b.g.resolveAttack(b.e);
 assert.equal(t.count(),1);
 close(a.g.hero.hp,b.g.hero.hp,'noncritical parity');
 const c=arena(profile,index),cT=attach(c.g);
 c.e.telegraph=null;c.g.resolveAttack(c.e);
 assert.equal(cT.count(),0,'cancelled cone does not roll');
}
{
 const a=arena('supply-vale',2),b=arena('supply-vale',2),t=attach(b.g);
 a.g.hero.immune=2;b.g.hero.immune=2;
 a.g.resolveAttack(a.e);b.g.resolveAttack(b.e);
 assert.equal(t.count(),1,'released cone rolls even if damage immune');
 close(a.g.hero.hp,b.g.hero.hp,'immunity absolute');
}
{
 const x=arena('supply-vale',2),t=attach(x.g);
 // An unreviewed/forged captain action cannot borrow one of the allowed IDs.
 x.e.telegraph.index=4;
 x.g.resolveAttack(x.e);
 assert.equal(t.count(),0,'paired Hot Zone excluded');
}
assert.equal(C.prototype._criticalWorldNative,undefined);
console.log('PASS native captain cone criticals: four named actions x three levels, actual selector, warning, immunity, noncritical, cancel, excluded moves');
