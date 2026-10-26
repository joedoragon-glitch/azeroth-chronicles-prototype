'use strict';
// Native Scornfang paired Hot Zone. Two original warned pairs share ONE World
// critical receipt; floor hazards retain unchanged native damage and timing.
const assert=require('node:assert/strict');
const C=require('../src/prototype/engine.js');
const Crit=require('../src/prototype/critical-executions.js');
const Levels=require('../src/prototype/critical-levels.js');
const World=require('../src/prototype/critical-world-native.js');
const {completeFieldOpening}=require('./helpers/field-opening.cjs');
function arena(){
 const g=new C('normal','paladin',()=>.99);completeFieldOpening(g);
 const z=g.zone();for(const k of ['props','buildings','npcs','enemies'])z[k]=[];
 g.s.time=30;g.s.mercyTime=0;g.s.party=[];g.s.hazards=[];
 Object.assign(g.hero,{x:1470,y:1700,hp:10000,maxHp:10000,immune:0});
 const e=g.makeEnemy({species:'goblin',name:'Hot Zone captain',level:4,
  hp:10000,damage:300,gold:0,xp:0},{x:1400,y:1700});
 Object.assign(e,{aggro:true,captain:true,roomCaptain:true,captainProfile:'supply-vale',
  specialCd:0,lastCaptainAttack:-1});
 z.enemies=[e];g.zone=()=>z;
 let found=false;
 for(let n=0;n<100;n++){
  g.random=()=>n/100;e.lastCaptainAttack=-1;e.telegraph=null;e.sequence=[];
  if(g.startCaptainAttack(e,g.hero)&&e.telegraph?.index===4){found=true;break;}
 }
 assert(found,'native selector must produce Hot Zone');
 assert.equal(e.telegraph.kind,'circle');
 assert.equal(e.telegraph.paired,true);
 assert.equal(e.telegraph.arenaPatches?.length,2,'original first pair');
 assert.equal(e.sequence.length,1,'second pair is one queued warning');
 assert.equal(e.sequence[0].arenaPatches?.length,2,'original second pair');
 return {g,e};
}
function attach(g,level=1,roll=0){
 let n=0;const session=World.createSession(Crit,Levels,{enabled:true,stream:{next(){n++;return roll;}}});
 session.setCriticalLevel('world',level);g._criticalWorldNative=session;
 return {count:()=>n,session};
}
function near(a,b,label){assert(Math.abs(a-b)<1e-6,label+': '+a+' != '+b);}
function beat(a,b,existing=null){
 const original=a.e.telegraph,boosted=b.e.telegraph;
 assert(original&&boosted,'paired native warning still exists');
 assert.equal(original.name,boosted.name);
 const patchA=original.arenaPatches[0],patchB=boosted.arenaPatches[0];
 Object.assign(a.g.hero,{x:patchA.x,y:patchA.y});
 Object.assign(b.g.hero,{x:patchB.x,y:patchB.y});
 const hpA=a.g.hero.hp,hpB=b.g.hero.hp;
 const notice=boosted.timer,recovery=boosted.recovery,
   shape=JSON.stringify(boosted.arenaPatches);
 a.g.resolveAttack(a.e);b.g.resolveAttack(b.e);
 assert.equal(boosted.timer,notice,'warning duration retained');
 assert.equal(boosted.recovery,recovery,'native cooldown data retained');
 assert.equal(JSON.stringify(boosted.arenaPatches),shape,'original patches unchanged');
 if(existing) assert.strictEqual(boosted.criticalExecution,existing,'second beat shares first receipt');
 const hitA=hpA-a.g.hero.hp,hitB=hpB-b.g.hero.hp;
 assert(hitA>0,'native original patch really hits hero');
 assert(hitB>hitA,'strengthens same original hit');
 assert.equal(a.g.s.hazards.length,b.g.s.hazards.length);
 for(let i=0;i<a.g.s.hazards.length;i++){
  const p=a.g.s.hazards[i],q=b.g.s.hazards[i];
  for(const attr of ['x','y','radius','life','tick','damage'])
   assert.equal(p[attr],q[attr],'same hazard '+attr);
  assert(!q.criticalExecution,'persistent hazard has no critical receipt');
 }
 assert.equal(a.g.s.projectiles.length,b.g.s.projectiles.length);
 a.e.telegraph=a.g.advanceQueuedAttack(a.e);
 b.e.telegraph=b.g.advanceQueuedAttack(b.e);
 return boosted.criticalExecution;
}
assert.equal(C.prototype._criticalWorldNative,undefined,'test-only World opt in');
for(const level of [1,2,3]){
 const a=arena(),b=arena(),t=attach(b.g,level);
 assert.equal(t.count(),0,'neither warning preparation samples');
 let receipt=beat(a,b);
 assert(receipt&&Object.isFrozen(receipt),'immutable original pair decision');
 assert.equal(receipt.key,'world/captain/supply-vale/4');
 assert.equal(receipt.intensity,level);
 assert.equal(t.count(),1,'first pair rolls once');
 t.session.setCriticalLevel('world',3);
 assert(a.e.telegraph&&b.e.telegraph,'second original warning remains');
 beat(a,b,receipt);
 assert.equal(t.count(),1,'second pair cannot reroll');
 assert.equal(a.e.telegraph,null);
 assert.equal(b.e.telegraph,null);
 assert.equal(b.e.sequence.length,0);
 assert.equal(a.g.s.hazards.length,4,'original two pairs yield 4 persistent hazards');
}
{
 const a=arena(),b=arena(),t=attach(b.g,2,.99);
 for(let i=0;i<2;i++){
  const original=a.e.telegraph,other=b.e.telegraph;
  const locA=original.arenaPatches[0],locB=other.arenaPatches[0];
  Object.assign(a.g.hero,{x:locA.x,y:locA.y});
  Object.assign(b.g.hero,{x:locB.x,y:locB.y});
  a.g.resolveAttack(a.e);b.g.resolveAttack(b.e);
  near(a.g.hero.hp,b.g.hero.hp,'noncritical parity after pair '+i);
  a.e.telegraph=a.g.advanceQueuedAttack(a.e);
  b.e.telegraph=b.g.advanceQueuedAttack(b.e);
 }
 assert.equal(t.count(),1,'noncritical full activation still one roll');
}
{
 const a=arena(),t=attach(a.g);
 a.e.telegraph=null;a.g.resolveAttack(a.e);
 assert.equal(t.count(),0,'cancelled first warning rolls zero times');
}
{
 const a=arena(),t=attach(a.g);
 a.g.resolveAttack(a.e);
 assert.equal(t.count(),1);
 a.e.sequence=[];a.e.telegraph=null;
 assert.equal(t.count(),1,'cancelled follow-up never samples twice');
}
{
 const a=arena(),t=attach(a.g,3);
 a.g.hero.immune=3;
 a.g.resolveAttack(a.e);
 assert.equal(t.count(),1);
 assert.equal(a.g.hero.hp,10000,'critical bypasses no immunity');
}
console.log('PASS native Scornfang paired Hot Zone: one release for two warnings / four original patches, 3 levels, immutable receipt, unchanged hazards and cancellation');
