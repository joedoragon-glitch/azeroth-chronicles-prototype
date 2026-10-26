'use strict';
// Dreadmaw Nucleus Herd: one optional World vitality receipt AFTER an actual
// native summon, with four-owned cap, 3 melee/1 ranged roles, original terrain
// placements, cooldown and zero rewards unchanged. No extra brood or rolls.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine.js');
const Critical=require('../src/prototype/critical-executions.js');
const Levels=require('../src/prototype/critical-levels.js');
const World=require('../src/prototype/critical-world-native.js');
const ctx=require('./helpers/specialist-night-context.cjs');
function scene(context='normal'){
 const g=ctx.campaign(context,'paladin',()=>.99);
 g.enter('supply-crown');g.s.time=30;g.s.mercyTime=0;g.s.party=[];
 const e=g.zone().enemies.find(u=>u.roomCaptain&&u.captainProfile==='supply-crown');
 assert(e,'real Dreadmaw encounter');
 g.zone().enemies=g.zone().enemies.filter(u=>u===e);
 Object.assign(g.hero,g.safe(e.x+80,e.y),{hp:1000000,maxHp:1000000,immune:0});
 g.engage(e,true,false);
 e.specialCd=0;e.lastCaptainAttack=-1;
 assert.equal(g.captainOwnedSummons(e).length,0,'native opening has no brood');
 assert(g.startCaptainAttack(e,g.hero),'Dreadmaw opens with authored summons');
 assert.equal(e.telegraph?.index,3,'real opening selects Nucleus Herd');
 assert.equal(e.telegraph?.kind,'summon');
 assert.equal(e.telegraph?.dreadMechanic,'herd');
 return {g,e};
}
function attach(g,level=1,roll=0){
 let count=0;
 const session=World.createSession(Critical,Levels,{
 enabled:true,stream:{next(){count++;return roll;}}
 });
 session.setCriticalLevel('world',level);g._criticalWorldNative=session;
 return {count:()=>count,session};
}
function compareBrood(a,b,value=1){
 const x=a.g.captainOwnedSummons(a.e),y=b.g.captainOwnedSummons(b.e);
 assert.equal(x.length,4,'original cap of four brood');
 assert.equal(y.length,4,'critical cap never exceeded');
 assert.deepEqual(y.map(u=>u.forcedRole),['melee','melee','melee','ranged']);
 assert.deepEqual(x.map(u=>u.forcedRole),['melee','melee','melee','ranged']);
 const fields=['id','x','y','owner','species','damage','level','summon',
  'summonBalanceVersion','treasurySummon','forcedRole','ranged','gold','xp'];
 for(let i=0;i<4;i++){
  for(const f of fields)assert.deepEqual(y[i][f],x[i][f],
    'native brood role/position/ownership/loot intact: '+f);
  assert.equal(y[i].maxHp,Math.max(x[i].maxHp,Math.round(x[i].maxHp*value)),
    'only original brood vitality strengthens');
  assert.equal(y[i].hp,y[i].maxHp,'newborn brood remains full HP');
 }
 assert.equal(y.filter(u=>u.gold!==0||u.xp!==0).length,0,
   'summoned brood never become farmable rewards');
}
assert.equal(Campaign.prototype._criticalWorldNative,undefined,'production OFF');
for(const context of ['normal','nightmare-night']){
 for(const level of [1,2,3]){
  const a=scene(context),b=scene(context),t=attach(b.g,level);
  assert.equal(t.count(),0,'warning and allocation planning do not roll');
  const warning=b.e.telegraph.timer,recovery=b.e.telegraph.recovery;
  a.g.resolveAttack(a.e);b.g.resolveAttack(b.e);
  assert.equal(t.count(),1,'four native brood from one activation use one roll');
  assert.equal(b.e.telegraph.timer,warning,'warning not modified');
  assert.equal(b.e.telegraph.recovery,recovery,'authored recovery not modified');
  assert.equal(a.e.summonCd,b.e.summonCd,'original spawn cooldown intact');
  compareBrood(a,b,Levels.LEVERS.summonVitality.values[level-1]);
  assert.equal(a.g.s.projectiles.length,b.g.s.projectiles.length);
  assert.equal(a.g.s.hazards.length,b.g.s.hazards.length);
  t.session.setCriticalLevel('world',3);
  compareBrood(a,b,Levels.LEVERS.summonVitality.values[level-1]);
  assert.equal(t.count(),1,'existing brood vitality frozen at cast strength');
  b.g.resolveAttack(b.e);
  assert.equal(t.count(),1,'full cap cannot trigger another World sample');
  assert.equal(b.g.captainOwnedSummons(b.e).length,4,'no fifth broodling');
 }
}
{
 const a=scene(),b=scene(),t=attach(b.g,3,.99);
 a.g.resolveAttack(a.e);b.g.resolveAttack(b.e);
 assert.equal(t.count(),1,'non-critical original summon still samples once');
 compareBrood(a,b,1);
}
{
 const a=scene(),t=attach(a.g);
 a.e.telegraph=null;a.g.resolveAttack(a.e);
 assert.equal(t.count(),0,'canceled warning draws nothing');
 assert.equal(a.g.captainOwnedSummons(a.e).length,0);
}
{
 const a=scene(),t=attach(a.g,2);
 assert.equal(a.g.summonCaptainAdds(a.e),4,'native spawn fills all four slots');
 a.g.resolveAttack(a.e);
 assert.equal(t.count(),0,'no new brood / no release on full cap');
 assert.equal(a.g.captainOwnedSummons(a.e).length,4);
}
{
 const a=scene(),t=attach(a.g,3);
 a.g.resolveAttack(a.e);
 assert.equal(t.count(),1);
 const saved=a.g.snapshot();
 assert(!saved.zones['supply-crown'].enemies.some(u=>u.summon),
   'native snapshot still strips ephemeral summoned brood');
 assert(!JSON.stringify(saved).includes('criticalExecution'),
   'no World receipt or summon state leaked into existing v4 save');
}
console.log('PASS World Dreadmaw Nucleus Herd: 3 tiers Normal/Nightmare, 4 original brood, only HP vitality, one post-spawn roll, cap/cancel/no-crit/v4');
