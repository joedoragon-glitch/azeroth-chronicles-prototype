'use strict';
// Focused Cindermaw release-owner gates. The seven authored ministry actions
// share source wiring but not extra geometry, recipients or cooldown changes.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Critical = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');
const World = require('../src/prototype/critical-world-native.js');
const ctx = require('./helpers/specialist-night-context.cjs');
function scene(form = 'normal') {
  const g = ctx.campaign('normal', 'mage', () => .99);
  g.s.party = [];
  g.s.mercyTime = 0;
  g.enter('crown');
  const e = g.bossEnemy(g.boss('cindermaw'), form, { x: 2200, y: 1750 });
  g.zone().enemies = [e];
  Object.assign(g.hero, g.safe(e.x + 70, e.y), {
    hp: 1000000, maxHp: 1000000, immune: 0,
  });
  g.engage(e, true, false);
  e.cd = 1000000;
  e.summonCd = 0;
  g.line = () => true;
  return { g, e };
}
function cast(g,e,index) {
  const built = g.buildBossAttack(e,index,g.bossAttackTarget(e,g.hero,index));
  assert(built.first, 'source creates real Cindermaw action '+index);
  e.telegraph = built.first;
  e.sequence = built.sequence;
  g.resolveAttack(e);
  return built.first;
}
function attach(g,level=1,roll=0) {
  let count=0;
  const session = World.createSession(Critical, Levels, {
    enabled:true,stream:{next(){count++;return roll;}},
  });
  session.setCriticalLevel('world',level);
  g._criticalWorldNative=session;
  return {count:()=>count,session};
}
for (const form of ['normal','true']) for (const level of [1,2,3]) {
  // The lawful original marked physical lunge commits one immutable receipt
  // before its collision-checked movement, never per encountered victim.
  {
    const {g,e}=scene(form), t=attach(g,level);
    const move=cast(g,e,1);
    assert.equal(t.count(),1);
    assert.equal(move.criticalExecution.key,'world/boss/cindermaw/1');
    assert.equal(e.motion.criticalExecution,move.criticalExecution);
    assert.equal(e.motion.cinderMotion,'distraint');
    assert.equal(e.motion.criticalExecution.intensity,level);
    t.session.setCriticalLevel('world', level===3?1:3);
    assert.equal(t.count(),1);
  }
  // Defensive Ministry protection strengthens the same original ward duration
  // and protects exactly the same admitted existing ashbeast units.
  {
    const baseline=scene(form),critical=scene(form);
    for(const {g,e} of [baseline,critical]) {
      g.summonBossAdds(e,g.trueSummonPlan(e),3);
      e.summonCd=0;
    }
    const t=attach(critical.g,level);
    const originalAllies=baseline.g.cinderAllies(baseline.e,320);
    const buffedAllies=critical.g.cinderAllies(critical.e,320);
    assert.equal(originalAllies.length,buffedAllies.length);
    assert(buffedAllies.length>0,'original Ministry ward has legal recipients');
    cast(baseline.g,baseline.e,2);
    const castPlan=cast(critical.g,critical.e,2);
    assert.equal(t.count(),1);
    assert.equal(castPlan.criticalExecution.key,'world/boss/cindermaw/2');
    assert(critical.e.cinderProtectionCast.until>baseline.e.cinderProtectionCast.until);
    assert.equal(critical.e.cinderProtectionCd,baseline.e.cinderProtectionCd);
    assert.equal(critical.g.zone().enemies.length,baseline.g.zone().enemies.length);
  }
  // Cindermaw responders are enhanced only if the original actual summon
  // produces units, with the same count and cooldown across both runs.
  {
    const baseline=scene(form),critical=scene(form),t=attach(critical.g,level);
    const existingBaseline=baseline.g.bossOwnedSummons(baseline.e);
    const existingCritical=critical.g.bossOwnedSummons(critical.e);
    assert.equal(existingBaseline.length,existingCritical.length,
      'each form starts with the same authored live responder population');
    // TRUE Cindermaw is already staffed on engagement. Defeat the original
    // responders first: the next authentic Summon action may now admit replacements.
    for (const u of [...existingBaseline,...existingCritical]) u.hp=0;
    assert.equal(baseline.g.bossOwnedSummons(baseline.e).length,0);
    assert.equal(critical.g.bossOwnedSummons(critical.e).length,0);
    cast(baseline.g,baseline.e,6);
    cast(critical.g,critical.e,6);
    const normal=baseline.g.bossOwnedSummons(baseline.e);
    const enhanced=critical.g.bossOwnedSummons(critical.e);
    assert(normal.length>0,'summon action admitted actual responders');
    assert.equal(t.count(),1, 'Ministry admission audit: ' + JSON.stringify({
      form, level, original: normal.length, enhanced: enhanced.length,
      plan: { kind: critical.e.telegraph?.kind, index: critical.e.telegraph?.index,
        family: critical.e.telegraph?.family, mechanic: critical.e.telegraph?.cinderMechanic,
        receipt: !!critical.e.telegraph?.criticalExecution },
      native: critical.g._criticalWorldNative?.enabled,
      bossType: critical.e.type, bossFamily: critical.e.family,
    }));
    assert.equal(normal.length,enhanced.length);
    assert(enhanced.every((u,i)=>u.maxHp>normal[i].maxHp));
    assert.equal(critical.e.summonCd,baseline.e.summonCd);
  }
}
{
  const {g,e}=scene('true'),t=attach(g);
  const staffed=g.bossOwnedSummons(e).length;
  assert(staffed>0,'TRUE Cindermaw begins with its real protector population');
  cast(g,e,6);
  assert.equal(g.bossOwnedSummons(e).length,staffed,
    'full-cap TRUE summon does not add a hidden replacement');
  assert.equal(t.count(),0,
    'a fully staffed TRUE summon cannot roll without admitted responders');
}
{
  const {g,e}=scene(),t=attach(g);
  // A fixture/setup summon is not the boss's warned Ministry release.
  g.summonBossAdds(e,g.trueSummonPlan(e),3);
  assert.equal(t.count(),0,'direct setup summons cannot trigger a critical release');
  e.telegraph=null;g.resolveAttack(e);
  assert.equal(t.count(),0,'cancelled specialist action cannot sample');
}
console.log('PASS Cindermaw native physical lunge, ward and actual responders: Normal/TRUE, all levels, cancellation and native invariants');
