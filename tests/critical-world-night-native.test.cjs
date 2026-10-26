'use strict';
const assert=require('node:assert/strict');
const C=require('../src/prototype/engine.js');
const Crit=require('../src/prototype/critical-executions.js');
const Levels=require('../src/prototype/critical-levels.js');
const World=require('../src/prototype/critical-world-native.js');
const {completeFieldOpening}=require('./helpers/field-opening.cjs');
function scene(species, party=false){
 const g=new C('normal','paladin',()=>.99);completeFieldOpening(g);
 const z=g.zone();for(const k of ['props','buildings','npcs','enemies'])z[k]=[];
 g.s.party=[];g.s.mercyTime=0;g.s.time=30;
 Object.assign(g.hero,{x:548,y:500,hp:10000,maxHp:10000,immune:0});
 if(party){const u=g.unit('soldier',550,520);u.hp=u.maxHp=10000;g.s.party=[u];}
 const e=g.makeEnemy({species,name:'Night '+species,level:1,hp:10000,damage:140,gold:0,xp:0},{x:500,y:500});
 Object.assign(e,{aggro:true,nightOnly:true,specialCd:0});z.enemies=[e];g.zone=()=>z;
 return {g,e};
}
function attach(g,level=1,roll=0){
 let count=0;const session=World.createSession(Crit,Levels,{enabled:true,stream:{next(){count++;return roll;}}});
 session.setCriticalLevel('world',level);g._criticalWorldNative=session;
 return {count:()=>count,session};
}
function stepMotion(g,e){for(let i=0;i<40&&e.motion;i++)g.advanceMotion(e,.1);assert(!e.motion,'native flight settled');}
function close(a,b,msg){assert(Math.abs(a-b)<1e-6,msg+': '+a+' != '+b);}
assert.equal(C.prototype._criticalWorldNative,undefined,'OFF in production');
for(const species of ['wraith','stalker']){
 for(const level of [1,2,3]){
  const x=scene(species,species==='wraith'),y=scene(species,species==='wraith'),t=attach(y.g,level);
  assert(x.g.startNightSkill(x.e,x.g.hero));assert(y.g.startNightSkill(y.e,y.g.hero));
  assert.equal(t.count(),0,'warning never rolls');
  const warn=y.e.telegraph;
  x.g.resolveAttack(x.e);y.g.resolveAttack(y.e);
  assert.equal(t.count(),1,'one committed native special');
  if(species==='stalker'){
   const receipt=y.e.motion?.criticalExecution;
   assert(receipt&&Object.isFrozen(receipt),'real motion inherits immutable receipt');
   assert.equal(receipt.key,'world/night/stalker-pounce');
   assert.equal(receipt.intensity,level);
   t.session.setCriticalLevel('world',3);
   stepMotion(x.g,x.e);stepMotion(y.g,y.e);
   assert.equal(t.count(),1,'no reroll at landing');
  } else {
   assert.equal(y.g.s.projectiles.length,x.g.s.projectiles.length,'no fake missiles');
   assert.equal(y.g.effects.filter(e=>e.type==='hurt').length,
     x.g.effects.filter(e=>e.type==='hurt').length,'no additional victims');
  }
  const a=10000-x.g.hero.hp,b=10000-y.g.hero.hp;
  assert(a>0,species+' native contact exists');
  assert(b>a,species+' tier '+level+' changes only existing hit');
  close(x.e.specialCd,y.e.specialCd,'special cooldown intact');
 }
 const x=scene(species),y=scene(species),t=attach(y.g,2,.99);
 assert(x.g.startNightSkill(x.e,x.g.hero));assert(y.g.startNightSkill(y.e,y.g.hero));
 x.g.resolveAttack(x.e);y.g.resolveAttack(y.e);
 if(species==='stalker'){stepMotion(x.g,x.e);stepMotion(y.g,y.e);}
 assert.equal(t.count(),1);close(x.g.hero.hp,y.g.hero.hp,'noncritical parity');
 const z=scene(species),uncast=attach(z.g);
 assert(z.g.startNightSkill(z.e,z.g.hero));z.e.telegraph=null;
 z.g.resolveAttack(z.e);assert.equal(uncast.count(),0,'cancelled warning no roll');
}
{
 const x=scene('wraith',true),t=attach(x.g,3);
 x.g.s.party[0].immune=2;
 const before=x.g.s.party[0].hp;
 assert(x.g.startNightSkill(x.e,x.g.hero));x.g.resolveAttack(x.e);
 assert.equal(t.count(),1,'AoE rolls once regardless of immune victim');
 assert.equal(x.g.s.party[0].hp,before,'original immunity');
}
console.log('PASS native World night Wraith/Stalker: 3 tiers, warnings, cancellation, flight, immunity, no double roll');
