'use strict';
// Dreadmaw's original three Evapotranspiration marks form one action.
// Only native immediate contacts may crit; vapor ticks and existing v4
// encounter-reset-on-save rules must remain untouched.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine.js');
const Crit=require('../src/prototype/critical-executions.js');
const Levels=require('../src/prototype/critical-levels.js');
const World=require('../src/prototype/critical-world-native.js');
const nightContext=require('./helpers/specialist-night-context.cjs');
function scene(context='normal'){
 const g=nightContext.campaign(context,'paladin',()=>.99);
 g.enter('supply-crown');g.s.time=30;g.s.mercyTime=0;
 g.s.party=[];g.s.hazards=[];
 const e=g.zone().enemies.find(u=>u.roomCaptain&&u.captainProfile==='supply-crown');
 assert(e,'actual specialist room captain');
 g.zone().enemies=g.zone().enemies.filter(u=>u===e);
 Object.assign(g.hero,g.safe(e.x+80,e.y),{hp:1000000,maxHp:1000000,immune:0});
 g.engage(e,true,false);
 Object.assign(e,{aggro:true,cd:1e6,specialCd:0,lastCaptainAttack:-1,captainOpeningSummon:true});
 let chosen=false;
 for(let sample=0;sample<100;sample++){
  g.random=()=>sample/100;e.telegraph=null;e.sequence=[];e.lastCaptainAttack=-1;
  if(g.startCaptainAttack(e,g.hero)&&e.telegraph?.index===6){chosen=true;break;}
 }
 assert(chosen,'native selector admits Evapotranspiration');
 assert.equal(e.telegraph.dreadMechanic,'steam');
 assert.equal(e.telegraph.kind,'circle');
 assert.equal(e.telegraph.stage,1);
 assert.equal(e.sequence.length,2,'three existing separately warned beats');
 assert.deepEqual(e.sequence.map(a=>a.stage),[2,3]);
 for(const a of [e.telegraph,...e.sequence])assert.equal(a.arenaPatches?.length,1);
 return {g,e};
}
function attach(g,level=1,roll=0){
 let n=0;const session=World.createSession(Crit,Levels,{enabled:true,stream:{next(){n++;return roll;}}});
 session.setCriticalLevel('world',level);g._criticalWorldNative=session;
 return {count:()=>n,session};
}
const near=(a,b,msg)=>assert(Math.abs(a-b)<1e-6,msg+': '+a+' vs '+b);
function beat(x,y,prior=null){
 const a=x.e.telegraph,b=y.e.telegraph;
 assert(a&&b);
 assert.equal(a.stage,b.stage);
 const pa=a.arenaPatches[0],pb=b.arenaPatches[0];
 Object.assign(x.g.hero,{x:pa.x,y:pa.y});
 Object.assign(y.g.hero,{x:pb.x,y:pb.y});
 const base=x.g.hero.hp,crit=y.g.hero.hp,warning=b.timer,
   recovery=b.recovery,geometry=JSON.stringify(b.arenaPatches);
 x.g.resolveAttack(x.e);y.g.resolveAttack(y.e);
 assert.equal(b.timer,warning);
 assert.equal(b.recovery,recovery);
 assert.equal(JSON.stringify(b.arenaPatches),geometry,'original terrain-safe warning mark');
 if(prior)assert.strictEqual(b.criticalExecution,prior,'inherited original activation');
 const hitX=base-x.g.hero.hp,hitY=crit-y.g.hero.hp;
 assert(hitX>0,'original Evapotranspiration impact hits');
 assert(hitY>hitX,'same impact strengthened by critical');
 assert.equal(x.g.s.projectiles.length,y.g.s.projectiles.length,'no added projectiles');
 assert.equal(x.g.s.hazards.length,y.g.s.hazards.length,'same original hazards');
 for(let i=0;i<x.g.s.hazards.length;i++){
  const l=x.g.s.hazards[i],r=y.g.s.hazards[i];
  for(const key of ['x','y','radius','life','tick','damage'])
   assert.equal(r[key],l[key],'original persistent floor '+key);
  assert(!r.criticalExecution,'floor hazard has no critical receipt');
 }
 assert.equal(x.e.dreadVapors?.length,y.e.dreadVapors?.length,'same vapor count');
 for(let i=0;i<(x.e.dreadVapors||[]).length;i++){
  const v=x.e.dreadVapors[i],w=y.e.dreadVapors[i];
  for(const key of ['x','y','angle','radius','life','coefficient','tickInterval',
    'slow','age','skill'])assert.equal(w[key],v[key],'native steam '+key);
  assert(!w.criticalExecution,'no vapor critical metadata');
 }
 x.e.telegraph=x.g.advanceQueuedAttack(x.e);
 y.e.telegraph=y.g.advanceQueuedAttack(y.e);
 return b.criticalExecution;
}
assert.equal(Campaign.prototype._criticalWorldNative,undefined);
for(const context of ['normal','nightmare-night']){
 for(const level of [1,2,3]){
  const x=scene(context),y=scene(context),t=attach(y.g,level);
  assert.equal(t.count(),0,'three warnings do not sample before contact');
  const receipt=beat(x,y);
  assert(receipt&&Object.isFrozen(receipt),'native frozen cast receipt');
  assert.equal(receipt.key,'world/captain/supply-crown/6');
  assert.equal(receipt.intensity,level);
  assert.equal(t.count(),1);
  t.session.setCriticalLevel('world',3);
  beat(x,y,receipt);
  beat(x,y,receipt);
  assert.equal(t.count(),1,'three impact stages are exactly one sample');
  assert.equal(x.e.telegraph,null);
  assert.equal(y.e.telegraph,null);
  assert.equal(y.e.sequence.length,0);
  assert.equal(x.e.dreadVapors.length,3,'three original steam vapor states');
  const lastA=x.g.hero.hp,lastB=y.g.hero.hp;
  x.g.updateCinderRegularState(x.e,0);
  y.g.updateCinderRegularState(y.e,0);
  near(lastA-x.g.hero.hp,lastB-y.g.hero.hp,'original vapor ticks equal');
  assert.equal(t.count(),1,'vapor ticks never roll World RNG');
 }
}
{
 const x=scene(),y=scene(),t=attach(y.g,3,.99);
 for(let i=0;i<3;i++){
  const a=x.e.telegraph,b=y.e.telegraph;
  Object.assign(x.g.hero,a.arenaPatches[0]);
  Object.assign(y.g.hero,b.arenaPatches[0]);
  x.g.resolveAttack(x.e);y.g.resolveAttack(y.e);
  near(x.g.hero.hp,y.g.hero.hp,'noncritical impact parity');
  x.e.telegraph=x.g.advanceQueuedAttack(x.e);
  y.e.telegraph=y.g.advanceQueuedAttack(y.e);
 }
 assert.equal(t.count(),1);
}
{
 const x=scene(),t=attach(x.g,3);
 x.e.telegraph=null;x.g.resolveAttack(x.e);
 assert.equal(t.count(),0,'cancelled cast no roll');
}
{
 const x=scene(),t=attach(x.g,2);
 x.g.hero.immune=3;const hp=x.g.hero.hp;
 x.g.resolveAttack(x.e);
 assert.equal(t.count(),1);
 assert.equal(x.g.hero.hp,hp,'native immunity not pierced');
}
{
 const x=scene(),t=attach(x.g);
 x.e.telegraph=x.e.sequence[1];x.e.sequence=[];
 x.g.resolveAttack(x.e);
 assert.equal(t.count(),0,'orphan final mark cannot roll independently');
}
// Confirm existing save version 4 clears in-flight receipts and stage state,
// rather than silently serializing a new resumable critical action.
{
 const x=scene(),t=attach(x.g,3);
 x.g.resolveAttack(x.e);
 assert.equal(t.count(),1);
 assert(x.e.telegraph.criticalExecution&&x.e.sequence[0].criticalExecution);
 const saved=x.g.snapshot();
 const enemy=saved.zones['supply-crown'].enemies.find(e=>e.id===x.e.id);
 assert(enemy,'native captain persists in original encounter reset');
 assert.equal(enemy.telegraph,null,'save clears current warned cast');
 assert.equal(enemy.motion,null,'save clears transient movement');
 assert.deepEqual(enemy.sequence,[],'save clears queued attack steps');
 assert(!enemy.dreadVapors,'save clears specialist vapor hazard states');
 assert.deepEqual(saved.projectiles,[],'save clears transient projectiles');
 assert.deepEqual(saved.hazards,[],'save clears transient hazards');
 assert(!JSON.stringify(saved).includes('criticalExecution'),
   'v4 snapshot cannot retain in-flight critical receipts');
}
console.log('PASS Dreadmaw 3-stage Evapotranspiration: one World roll, three levels, Normal/Nightmare, native vapor ticks, cancellation, v4 snapshot reset');
