'use strict';
// Original Scornfang Encapsulation: ONE initial circle and subsequent native
// persistent hazard. The critical applies to initial contact only; the
// existing floor remains equally damaging regardless of release result.
const assert=require('node:assert/strict');
const C=require('../src/prototype/engine.js');
const Crit=require('../src/prototype/critical-executions.js');
const Levels=require('../src/prototype/critical-levels.js');
const World=require('../src/prototype/critical-world-native.js');
const {completeFieldOpening}=require('./helpers/field-opening.cjs');
function scene() {
 const g=new C('normal','paladin',()=>.99);completeFieldOpening(g);
 const z=g.zone();for(const k of ['props','npcs','buildings','enemies'])z[k]=[];
 g.s.time=30;g.s.mercyTime=0;g.s.party=[];g.s.hazards=[];
 Object.assign(g.hero,{x:1470,y:1700,hp:10000,maxHp:10000,immune:0});
 const e=g.makeEnemy({species:'goblin',name:'Encapsulation captain',level:4,
   hp:10000,damage:300,xp:0,gold:0},{x:1400,y:1700});
 Object.assign(e,{aggro:true,captain:true,roomCaptain:true,captainProfile:'supply-vale',
   specialCd:0,lastCaptainAttack:-1});
 z.enemies=[e];g.zone=()=>z;
 let chosen=false;
 for(let n=0;n<100;n++){
   g.random=()=>n/100;
   e.telegraph=null;e.sequence=[];e.lastCaptainAttack=-1;
   if(g.startCaptainAttack(e,g.hero)&&e.telegraph?.index===1){chosen=true;break;}
 }
 assert(chosen,'native Scornfang selector reaches Encapsulation');
 const a=e.telegraph;
 assert.equal(a.kind,'circle');
 assert.equal(a.persistent,true);
 assert.equal(a.arenaSequential,false,'one native warning, never sequential');
 assert.equal(a.arenaPatches?.length,1,'one legal single-patch hazard');
 assert.equal(e.sequence.length,0);
 const patch=a.arenaPatches[0];
 Object.assign(g.hero,{x:patch.x,y:patch.y});
 return {g,e,a};
}
function attach(g,level=1,roll=0){
 let n=0;const session=World.createSession(Crit,Levels,{
 enabled:true,stream:{next(){n++;return roll;}}});
 session.setCriticalLevel('world',level);g._criticalWorldNative=session;
 return {count:()=>n};
}
const near=(a,b,label)=>assert(Math.abs(a-b)<1e-6,label+': '+a+' vs '+b);
assert.equal(C.prototype._criticalWorldNative,undefined,'never production auto-install');
for(const level of [1,2,3]){
 const x=scene(),y=scene(),t=attach(y.g,level);
 const time=y.a.timer,recovery=y.a.recovery,patch=y.a.arenaPatches[0];
 assert.equal(t.count(),0,'no critical decision at warning creation');
 x.g.resolveAttack(x.e);y.g.resolveAttack(y.e);
 assert.equal(t.count(),1,'exactly one native area release');
 const receipt=y.a.criticalExecution;
 assert(receipt&&Object.isFrozen(receipt));
 assert.equal(receipt.key,'world/captain/supply-vale/1');
 assert.equal(receipt.intensity,level);
 assert.equal(y.a.timer,time);
 assert.equal(y.a.recovery,recovery);
 assert.deepEqual(y.a.arenaPatches[0],patch,'original location and radius');
 const hpA=10000-x.g.hero.hp,hpB=10000-y.g.hero.hp;
 assert(hpA>0,'real Encapsulation initial contact');
 assert(hpB>hpA,'critical strengthens initial contact at Level '+level);
 assert.equal(y.g.s.hazards.length,x.g.s.hazards.length);
 assert.equal(y.g.s.hazards.length,1,'same one persistent hazard');
 const oldHazard=x.g.s.hazards[0],newHazard=y.g.s.hazards[0];
 for(const key of ['x','y','radius','damage','life','tick','sourceId'])
   assert.equal(newHazard[key],oldHazard[key],'persistent hazard unchanged '+key);
 assert(!newHazard.criticalExecution,'hazard ticks carry no new critical receipt');
 assert.equal(y.g.s.projectiles.length,x.g.s.projectiles.length,'no new projectiles');
 assert.equal(t.count(),1,'hazard creation never rerolls');
}
{
 const x=scene(),y=scene(),t=attach(y.g,2,.99);
 x.g.resolveAttack(x.e);y.g.resolveAttack(y.e);
 assert.equal(t.count(),1);
 near(x.g.hero.hp,y.g.hero.hp,'noncritical initial hit unchanged');
 assert.equal(x.g.s.hazards[0].damage,y.g.s.hazards[0].damage);
}
{
 const x=scene(),t=attach(x.g);
 x.e.telegraph=null;x.g.resolveAttack(x.e);
 assert.equal(t.count(),0,'cancelled action no sample');
 assert.equal(x.g.s.hazards.length,0);
}
{
 const x=scene(),t=attach(x.g);
 x.a.arenaPatches.push({x:x.a.x+200,y:x.a.y,radius:60});
 x.g.resolveAttack(x.e);
 assert.equal(t.count(),0,'forged extra patch is not an authored one-patch release');
}
{
 const x=scene(),t=attach(x.g,3);
 x.g.hero.immune=2;
 const hp=x.g.hero.hp;
 x.g.resolveAttack(x.e);
 assert.equal(t.count(),1,'committed release rolls despite native immunity');
 assert.equal(x.g.hero.hp,hp,'immunity not bypassed');
}
console.log('PASS World Scornfang Encapsulation: 3 levels, one original patch, unchanged hazard ticks, warning, immune/cancel/false, fail-closed extra patch');
