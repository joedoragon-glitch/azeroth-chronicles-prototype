'use strict';
// Stage 3 native healer cast: one world decision for the real effect,
// never for an extra recipient, timer tick, idle scan, failed cast or full HP.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Critical = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');
const World = require('../src/prototype/critical-world-native.js');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');
function arena() {
  const g = new Campaign('normal', 'paladin', () => 0.9);
  completeFieldOpening(g);
  g.s.mercyTime = 0;
  for(const key of ['props','npcs','buildings','enemies'])g.zone()[key]=[];
  g.s.party = [];
  Object.assign(g.hero,{x:900,y:900});
  g.line=()=>true; // Isolate healer admission; terrain geometry is separately tested.
  const mob=(species, x, hp=1000)=>{
    const e=g.makeEnemy(
      {species,name:'World support '+species,level:1,hp:1000,damage:10,xp:0,gold:0},
      {x,y:500});
    e.hp=hp;
    e.ranged=true;
    e.aggro=true;
    e.supportHealCd=0;
    g.zone().enemies.push(e);
    return e;
  };
  const healer=mob('ogre',500);
  const ally=mob('wolf',530,400);
  return {g,healer,ally};
}
function attach(g,level=1,roll=0){
  let samples=0;
  const session=World.createSession(Critical,Levels,{
    enabled:true,stream:{next(){samples++;return roll;}},
  });
  session.setCriticalLevel('world',level);
  g._criticalWorldNative=session;
  return {count:()=>samples,session};
}
const near=(a,b,msg)=>assert(Math.abs(a-b)<1e-6,msg+' '+a+' vs '+b);
for(const level of [1,2,3]){
  const a=arena(),b=arena(),counter=attach(b.g,level);
  assert(a.g.enemySupportHeal(a.healer));
  assert(b.g.enemySupportHeal(b.healer));
  assert.equal(counter.count(),1,'one cast, one roll');
  near(b.ally.supportHeal.remaining,a.ally.supportHeal.remaining,
    'no added HP budget or recipients');
  near(b.ally.supportHeal.seconds,
    a.ally.supportHeal.seconds/Levels.LEVERS.healTempo.values[level-1],
    'tier '+level+' improves native recovery tempo');
  assert.equal(b.healer.supportHealCd,a.healer.supportHealCd,
    'healer cooldown remains original');
  const duration=b.ally.supportHeal.seconds;
  counter.session.setCriticalLevel('world',3);
  near(b.ally.supportHeal.seconds,duration,'existing heal retains release tier');
  a.g.advanceEnemySupportHeal(a.ally,duration);
  b.g.advanceEnemySupportHeal(b.ally,duration);
  assert(b.ally.hp>a.ally.hp,'faster recovery during same elapsed time');
  assert.equal(counter.count(),1,'no per-tick RNG');
  a.g.advanceEnemySupportHeal(a.ally,5);
  b.g.advanceEnemySupportHeal(b.ally,5);
  near(a.ally.hp,a.ally.maxHp,'original full ordinary recovery');
  near(b.ally.hp,b.ally.maxHp,'critical cannot overheal');
  assert.equal(b.ally.supportHeal,undefined,'same completion cleanup');
}
{
  const x=arena(),tally=attach(x.g,1,0.99);
  assert(x.g.enemySupportHeal(x.healer));
  assert.equal(tally.count(),1);
  near(x.ally.supportHeal.seconds,3,'non-critical uses unchanged three seconds');
}
{
  const x=arena(),tally=attach(x.g);
  x.ally.hp=x.ally.maxHp;
  assert.equal(x.g.enemySupportHeal(x.healer),false);
  assert.equal(tally.count(),0,'full HP cannot consume a World sample');
  assert.equal(x.healer.supportHealCd,0);
  x.ally.hp=400;
  x.healer.supportHealCd=2;
  assert.equal(x.g.enemySupportHeal(x.healer),false);
  assert.equal(tally.count(),0,'cooldown blocked action cannot sample');
  x.healer.supportHealCd=0;
  x.g.mageSilenceActive=()=>true;
  assert.equal(x.g.enemySupportHeal(x.healer),false);
  assert.equal(tally.count(),0,'silenced cast cannot sample');
}
{
  const x=arena(),counter=attach(x.g,2);
  const ally2=x.g.makeEnemy({species:'skeleton',name:'second',level:1,hp:1000,damage:0,xp:0,gold:0},
    {x:540,y:500});
  ally2.hp=250;
  x.g.zone().enemies.push(ally2);
  assert(x.g.enemySupportHeal(x.healer),'multi-target native heal');
  assert.equal(counter.count(),1,'one decision for two recipients');
  assert(ally2.supportHeal,'ordinary second recipient was not invented');
  near(ally2.supportHeal.seconds,x.ally.supportHeal.seconds,'one release tier for both');
  const shots=x.g.s.projectiles.length;
  assert.equal(shots,0,'healing does not spawn projectiles');
}
assert.equal(Campaign.prototype._criticalWorldNative,undefined);
console.log('PASS native World healing: three levels, unchanged budgets/cooldowns, one cast, multiple recipients, all failure guards');
