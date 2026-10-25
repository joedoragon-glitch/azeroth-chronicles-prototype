'use strict';
// Dreadmaw's two real Subsoiling ground releases share one committed World
// receipt; terrain-safe placement, two warning clocks and original geometry
// are strictly untouched. All original hit protection remains in resolveArea.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine.js');
const Critical=require('../src/prototype/critical-executions.js');
const Levels=require('../src/prototype/critical-levels.js');
const World=require('../src/prototype/critical-world-native.js');
const nightContext=require('./helpers/specialist-night-context.cjs');
function scene(context='normal'){
 const g=nightContext.campaign(context,'paladin',()=>.99);
 g.enter('supply-crown');
 g.s.time=30;g.s.mercyTime=0;g.s.party=[];g.s.hazards=[];
 const e=g.zone().enemies.find(u=>u.roomCaptain&&u.captainProfile==='supply-crown');
 assert(e,'original real Crown captain is present');
 g.zone().enemies=g.zone().enemies.filter(u=>u===e);
 Object.assign(g.hero,g.safe(e.x+80,e.y),{
   hp:1000000,maxHp:1000000,immune:0
 });
 g.engage(e,true,false);
 Object.assign(e,{aggro:true,cd:1e6,specialCd:0,lastCaptainAttack:-1,
   captainOpeningSummon:true});
 let chosen=false;
 for(let i=0;i<100;i++){
  g.random=()=>i/100;e.telegraph=null;e.sequence=[];e.lastCaptainAttack=-1;
  if(g.startCaptainAttack(e,g.hero)&&e.telegraph?.index===0){chosen=true;break;}
 }
 assert(chosen,'actual Dreadmaw selector chooses Subsoiling');
 assert.equal(e.telegraph.dreadMechanic,'fracture');
 assert.equal(e.telegraph.kind,'circle');
 assert.equal(e.telegraph.stage,1);
 assert.equal(e.sequence.length,1,'original two separately warned impacts');
 assert.equal(e.sequence[0].stage,2);
 assert.equal(e.telegraph.arenaPatches?.length,1);
 assert.equal(e.sequence[0].arenaPatches?.length,1);
 return {g,e};
}
function attach(g,level=1,roll=0){
 let n=0;const session=World.createSession(Critical,Levels,{
  enabled:true,stream:{next(){n++;return roll;}}
 });
 session.setCriticalLevel('world',level);g._criticalWorldNative=session;
 return {count:()=>n,session};
}
const near=(a,b,label)=>assert(Math.abs(a-b)<1e-6,label+': '+a+' versus '+b);
function impact(x,y,receipt=null){
 const a=x.e.telegraph,b=y.e.telegraph;
 assert(a&&b,'real native stage available');
 assert.equal(a.stage,b.stage);
 const pa=a.arenaPatches[0],pb=b.arenaPatches[0];
 Object.assign(x.g.hero,{x:pa.x,y:pa.y});
 Object.assign(y.g.hero,{x:pb.x,y:pb.y});
 const hpX=x.g.hero.hp,hpY=y.g.hero.hp,
       marks=JSON.stringify(b.arenaPatches),timer=b.timer,
       recovery=b.recovery,projectiles=y.g.s.projectiles.length;
 x.g.resolveAttack(x.e);
 y.g.resolveAttack(y.e);
 assert.equal(JSON.stringify(b.arenaPatches),marks,'original safe mark unchanged');
 assert.equal(b.timer,timer,'native warning timer unchanged');
 assert.equal(b.recovery,recovery,'native recovery unchanged');
 assert.equal(y.g.s.projectiles.length,projectiles,'no invented missile');
 assert.equal(y.g.s.hazards.length,x.g.s.hazards.length,'no invented floor hazard');
 if(receipt)assert.strictEqual(b.criticalExecution,receipt,'second mark inherits same release');
 const dealtX=hpX-x.g.hero.hp,dealtY=hpY-y.g.hero.hp;
 assert(dealtX>0,'original native marked contact hits hero');
 assert(dealtY>0,'critical candidate retains original contact');
 x.e.telegraph=x.g.advanceQueuedAttack(x.e);
 y.e.telegraph=y.g.advanceQueuedAttack(y.e);
 return {receipt:b.criticalExecution,dealtX,dealtY};
}
assert.equal(Campaign.prototype._criticalWorldNative,undefined);
for(const context of ['normal','nightmare-night']){
 for(const level of [1,2,3]){
  const x=scene(context),y=scene(context),t=attach(y.g,level);
  assert.equal(t.count(),0,'planning two marks consumes no world samples');
  const first=impact(x,y);
  assert(first.receipt&&Object.isFrozen(first.receipt),'committed receipt immutable');
  assert.equal(first.receipt.key,'world/captain/supply-crown/0');
  assert.equal(first.receipt.intensity,level);
  assert(first.dealtY>first.dealtX,'first stage critical enhances original hit');
  assert.equal(t.count(),1);
  t.session.setCriticalLevel('world',3);
  const second=impact(x,y,first.receipt);
  assert(second.dealtY>second.dealtX,'second stage retains original strength '+level);
  assert.equal(t.count(),1,'two warned hits share exactly one roll');
  assert.equal(x.e.telegraph,null);
  assert.equal(y.e.telegraph,null);
  assert.equal(y.e.sequence.length,0);
 }
}
{
 const x=scene(),y=scene(),t=attach(y.g,2,.99);
 for(let i=0;i<2;i++){
  const a=x.e.telegraph,b=y.e.telegraph;
  Object.assign(x.g.hero,a.arenaPatches[0]);
  Object.assign(y.g.hero,b.arenaPatches[0]);
  x.g.resolveAttack(x.e);y.g.resolveAttack(y.e);
  near(x.g.hero.hp,y.g.hero.hp,'noncritical Subsoiling parity');
  x.e.telegraph=x.g.advanceQueuedAttack(x.e);
  y.e.telegraph=y.g.advanceQueuedAttack(y.e);
 }
 assert.equal(t.count(),1);
}
{
 const x=scene(),t=attach(x.g);
 x.e.telegraph=null;x.g.resolveAttack(x.e);
 assert.equal(t.count(),0,'cancelled first mark never samples');
}
{
 const x=scene(),t=attach(x.g,3);
 x.g.hero.immune=3;const hp=x.g.hero.hp;
 x.g.resolveAttack(x.e);
 assert.equal(t.count(),1,'immunity does not alter committed release');
 assert.equal(x.g.hero.hp,hp,'native immunity intact');
}
{
 const x=scene(),t=attach(x.g);
 x.e.telegraph=x.e.sequence[0];x.e.sequence=[];
 x.g.resolveAttack(x.e);
 assert.equal(t.count(),0,'orphan second warning cannot create independent roll');
}
console.log('PASS Dreadmaw Subsoiling: Normal/Nightmare two real warnings, one World receipt, 3 tiers, original geometry, immunity, cancellation, parity');
