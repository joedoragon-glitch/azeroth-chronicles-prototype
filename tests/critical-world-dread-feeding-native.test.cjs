'use strict';
// Dreadmaw Creep Feeding: extend the existing eligible living brood haste
// clock only, not the amount/identity of recipients, native haste factors,
// original readiness trigger, cooldown, cap or spawn ownership.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine.js');
const Critical=require('../src/prototype/critical-executions.js');
const Levels=require('../src/prototype/critical-levels.js');
const World=require('../src/prototype/critical-world-native.js');
const ctx=require('./helpers/specialist-night-context.cjs');
function scene(context='normal', prebuff=0){
 const g=ctx.campaign(context,'paladin',()=>.99);
 g.enter('supply-crown');g.s.time=30;g.s.mercyTime=0;g.s.party=[];
 const e=g.zone().enemies.find(u=>u.roomCaptain&&u.captainProfile==='supply-crown');
 assert(e,'real Dreadmaw source exists');
 g.zone().enemies=g.zone().enemies.filter(u=>u===e);
 Object.assign(g.hero,g.safe(e.x+80,e.y),{hp:1000000,maxHp:1000000,immune:0});
 g.engage(e,true,false);
 e.captainOpeningSummon=true;e.specialCd=0;e.lastCaptainAttack=-1;
 assert.equal(g.summonCaptainAdds(e),4,'four original living brood to feed');
 const brood=g.captainOwnedSummons(e);
 assert.deepEqual(brood.map(u=>u.forcedRole),['melee','melee','melee','ranged']);
 for(let i=0;i<brood.length;i++){
  brood[i].cd=2;
  if(i<prebuff)brood[i].dreadFeedUntil=g.s.time+8;
 }
 let chosen=false;
 for(let n=0;n<100;n++){
  g.random=()=>n/100;e.telegraph=null;e.sequence=[];e.lastCaptainAttack=-1;
  if(g.startCaptainAttack(e,g.hero)&&e.telegraph?.index===5){chosen=true;break;}
 }
 assert(chosen,'real native Creep Feeding selector found a valid cast');
 assert.equal(e.telegraph.dreadMechanic,'feeding');
 assert.equal(e.telegraph.kind,'circle');
 assert.equal(e.telegraph.duration,5);
 assert.equal(e.telegraph.cooldown,10);
 return {g,e,brood};
}
function attach(g,level=1,roll=0){
 let calls=0;
 const session=World.createSession(Critical,Levels,{
 enabled:true,stream:{next(){calls++;return roll;}}
 });
 session.setCriticalLevel('world',level);g._criticalWorldNative=session;
 return {count:()=>calls,session};
}
const near=(x,y,msg)=>assert(Math.abs(x-y)<1e-6,msg+': '+x+' vs '+y);
assert.equal(Campaign.prototype._criticalWorldNative,undefined,'Critical OFF by default');
for(const context of ['normal','nightmare-night']){
 for(const level of [1,2,3]){
  const a=scene(context),b=scene(context),t=attach(b.g,level);
  assert.equal(t.count(),0,'planning existing eligible brood consumes no critical RNG');
  const clock=b.e.telegraph.timer,recovery=b.e.telegraph.recovery;
  const oldBrood=a.g.captainOwnedSummons(a.e),critBrood=b.g.captainOwnedSummons(b.e);
  a.g.resolveAttack(a.e);b.g.resolveAttack(b.e);
  assert.equal(t.count(),1,'one actual four-brood buff makes one World decision');
  assert.equal(b.e.telegraph.timer,clock,'original warning untouched');
  assert.equal(b.e.telegraph.recovery,recovery,'original recovery untouched');
  assert.equal(b.e.dreadFeedCd,a.e.dreadFeedCd,'native support cooldown untouched');
  assert.equal(b.e.dreadFeedCd,10);
  const delta=Levels.LEVERS.hasteDuration.values[level-1];
  for(let i=0;i<4;i++){
   const x=oldBrood[i],y=critBrood[i];
   for(const field of ['id','x','y','owner','maxHp','hp','damage',
     'ranged','forcedRole','gold','xp','summonBalanceVersion'])
    assert.deepEqual(y[field],x[field],'same recipient/role/stats: '+field);
   near(x.dreadFeedUntil-a.g.s.time,5,'original five-second brood haste');
   near(y.dreadFeedUntil-b.g.s.time,5+delta,'only buff lifetime extended');
   assert(y.dreadFeedUntil-b.g.s.time<b.e.dreadFeedCd,
     'no effect outlasts the original ten-second support clock');
   assert.equal(y.cd,x.cd,'same native immediate readiness effect');
   assert.equal(y.cd,.25);
  }
  assert.equal(b.g.captainOwnedSummons(b.e).length,4,'no new brood created');
  assert.equal(b.g.s.projectiles.length,a.g.s.projectiles.length);
  assert.equal(b.g.s.hazards.length,a.g.s.hazards.length);
  t.session.setCriticalLevel('world',3);
  assert.equal(t.count(),1,'no per-brood or per-readiness-tick World rolls');
 }
}
{
 const a=scene(),b=scene(),t=attach(b.g,3,.99);
 a.g.resolveAttack(a.e);b.g.resolveAttack(b.e);
 assert.equal(t.count(),1,'noncritical cast still samples once');
 for(let i=0;i<4;i++){
  near(a.brood[i].dreadFeedUntil,b.brood[i].dreadFeedUntil,
    'failed critical roll leaves existing feed clock unchanged');
  assert.equal(a.brood[i].cd,b.brood[i].cd);
 }
}
{
 const a=scene('normal',2),b=scene('normal',2),t=attach(b.g,2);
 a.g.resolveAttack(a.e);b.g.resolveAttack(b.e);
 assert.equal(t.count(),1,'two eligible recipients still one cast roll');
 for(let i=0;i<2;i++){
  near(a.brood[i].dreadFeedUntil,b.brood[i].dreadFeedUntil,
    'already-fed brood not re-targeted');
  near(a.brood[i].dreadFeedUntil,a.g.s.time+8,
    'existing independent buff remains unmodified');
 }
 for(let i=2;i<4;i++)
  near(b.brood[i].dreadFeedUntil,a.brood[i].dreadFeedUntil+
    Levels.LEVERS.hasteDuration.values[1],'same original eligible recipients');
}
{
 const a=scene(),t=attach(a.g);
 a.e.telegraph=null;a.g.resolveAttack(a.e);
 assert.equal(t.count(),0,'canceled support warning consumes no RNG');
 assert(a.brood.every(u=>!u.dreadFeedUntil),'no invented feeding effect');
}
{
 const a=scene(),t=attach(a.g,3);
 for(const u of a.brood)u.dreadFeedUntil=a.g.s.time+9;
 a.g.resolveAttack(a.e);
 assert.equal(t.count(),0,'no eligible brood means no World release');
 assert(a.brood.every(u=>u.dreadFeedUntil===a.g.s.time+9));
 assert.equal(a.e.dreadFeedCd,10,'original cooldown still consumed by forced invalid cast');
}
{
 const a=scene(),t=attach(a.g,2);
 a.g.resolveAttack(a.e);
 assert.equal(t.count(),1);
 const saved=a.g.snapshot();
 assert(!saved.zones['supply-crown'].enemies.some(u=>u.summon),
   'v4 save continues discarding temporary brood and haste windows');
 assert(!JSON.stringify(saved).includes('criticalExecution'),
   'no transient World release metadata in existing v4 save');
}
console.log('PASS World Dreadmaw Creep Feeding: 3 intensities Normal/Nightmare, original four brood/roles/cooldown, bounded haste lifetime, partial and no-recipient admissions, parity/v4');
