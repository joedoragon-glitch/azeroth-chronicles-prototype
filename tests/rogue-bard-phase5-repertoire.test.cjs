'use strict';
// Phase 5 first executable musical families. The fourth class remains
// test-only/unregistered, and these tests must never open public selection.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Reference = require('../src/prototype/skill-reference.js');
const R = Campaign.rules;
assert.deepEqual(Object.keys(Campaign.classes), ['paladin', 'mage', 'ranger']);
Campaign.classes.rogue = { ...R.rogueHeroFoundation.stats, icon: '🔔' };
Campaign.talentProfiles.rogue = { ...R.rogueHeroFoundation.talents };
try {
  function fresh() {
    const g = new Campaign('normal', 'rogue', () => 0.9);
    g.s.party = [];
    g.s.mercyTime = 0;
    g.s.valeFieldAwakened = true;
    Object.assign(g.hero, { x: 500, y: 500, order: null });
    g.zone().props = [];
    g.zone().buildings = [];
    const unit = g.unit('soldier', 590, 500);
    g.s.party = [unit];
    const foe = g.makeEnemy(
      { species: 'goblin', name: 'Hostile for song', level: 1,
        hp: 10000, damage: 0, gold: 0, xp: 0 },
      { x: 590, y: 500 },
    );
    foe.aggro = true;
    foe.returning = false;
    g.zone().enemies = [foe];
    return {g,unit,foe};
  }
  const { g,unit,foe } = fresh();
  assert.equal(g.heroSkillRange(2), 260);
  assert.equal(g.cast(2, foe.id), false, 'unlearned song barred');
  g.hero.skills[1] = 1;
  g.hero.skills[5] = 1;
  g.hero.skills[6] = 1;
  const card2 = Reference.describe(g,2);
  assert(card2 && card2.tap.metrics.some((m)=>m.key==='slow'));
  assert(Reference.describe(g,3)===null, 'other Phase 5 forms are still locked');
  assert(Reference.describe(g,7)?.tap.metrics.some((m)=>m.key==='push'));
  assert(Reference.describe(g,6)?.charge.metrics.some((m)=>m.key==='specialRecovery'));
  const initialSpeed = g.companionRallyMoveSpeed(unit, 230);
  const originalCharmStream = g.s.rogueCharmRng;
  assert.equal(g.cast(2, foe.id), true, 'song requires legal engaged hostile');
  assert(foe.slow > 0, 'native hostile slow');
  assert(g.rogueSongBoon(unit,'quickstep'), 'real nearby living ally receives boon');
  assert(g.companionRallyMoveSpeed(unit,230) > initialSpeed);
  assert(g.cooldownRecoveryElapsed(unit,1) > 1);
  assert.equal(g.cast(2,foe.id), false, 'normal cooldown enforced');
  assert.equal(g.s.rogueCharmRng,originalCharmStream,'songs never trigger Charm');
  const songEffects = g.effects.filter((e)=>e.type==='rogueBellPerformance');
  assert.equal(songEffects.length,1);
  assert.equal(songEffects[0].allies,1);
  const boon = g.rogueSongBoon(unit,'quickstep');
  assert(boon.move <= 0.12 && boon.recovery <= 0.08);
  g.hero.cd[1] = 0;
  assert.equal(g.cast(2, foe.id, true), true,'charged family available');
  assert(g.rogueSongBoon(unit,'quickstep').move <= 0.12,
    'charged refresh does not stack two movement bonuses');
  assert(g.cooldownRecoveryElapsed(unit,1) <= 1.08 + 1e-8);
  const earlySave = g.snapshot();
  assert(!JSON.stringify(earlySave).includes('quickstep'),
    'transient song family does not become a new save entitlement');
  assert.doesNotThrow(()=>Campaign.validate(earlySave));
  const restored = Campaign.restore(earlySave,()=>0.9);
  assert.equal(restored.rogueSongBoon(restored.s.party[0],'quickstep'),null,
    'no song revival on reload');
  // Skill 6 accelerates only real special timers, does not grant readiness.
  g.hero.cd[5] = 0;
  foe.specialCd = 3;
  unit.skill1Cd = 6;
  unit.cd = 6;
  assert.equal(g.cast(6, foe.id),true);
  assert(foe.specialCd > 3, 'native enemy special gets finite readiness debt');
  assert(g.rogueSongBoon(unit,'borrowedTime'));
  assert(g.cooldownRecoveryElapsed(unit,1,false,true) >
    g.cooldownRecoveryElapsed(unit,1,false,false),'special-only acceleration');
  assert(g.cooldownRecoveryElapsed(unit,1,false,true) <= 1.25 + 1e-8,
    'Quickstep and Borrowed Time combine below 25%');
  assert.equal(g.cast(6,foe.id),false);
  g.s.time += 9;
  assert.equal(g.rogueSongBoon(unit,'quickstep'),null);
  assert.equal(g.rogueSongBoon(unit,'borrowedTime'),null);
  assert.equal(g.cooldownRecoveryElapsed(unit,1),1);
  assert.equal(g.cooldownRecoveryElapsed(unit,1,false,true),1);
  // Skill 7 shares native collision-safe push and Weaken. Its timed ally
  // damage advantage never mutates companion base power.
  g.hero.cd[6] = 0;
  const priorEnemyAttack = foe.damage, previousUnitDamage = unit.damage;
  assert.equal(g.cast(7,foe.id),true);
  assert(foe.weakenUntil > g.s.time && foe.weakenFraction > 0);
  assert(g.rogueSongBoon(unit,'firmFooting')?.outgoing === 0.05);
  assert.equal(unit.damage,previousUnitDamage,'no permanent stat modification');
  assert.equal(foe.damage,priorEnemyAttack,'hostile native attack untouched');
  assert(Reference.describe(g,7)?.charge.metrics.some((m)=>m.key==='outgoing'));
  g.hero.cd[6] = 0;
  assert.equal(g.cast(7,foe.id,true),true);
  assert(g.rogueSongBoon(unit,'firmFooting')?.outgoing <= 0.08);
  // Empty legal hostile range never yields a free party boon or consumes CD.
  g.zone().enemies = [];
  g.hero.cd[1]=0;
  const before = g.snapshot();
  assert.equal(g.cast(2), false);
  assert.deepEqual(g.snapshot(),before);
  // A resting/off-field unit cannot retain active song benefits.
  g.s.party[0].active=false;
  assert.equal(g.rogueSongBoon(g.s.party[0],'quickstep'),null);
  // Non-Rogue classes retain their exact original cooldown/movement behavior.
  for(const cls of ['paladin','mage','ranger']) {
    const normal = new Campaign('normal',cls,()=>0.9);
    const native = normal.unit('soldier',500,500);
    assert.equal(normal.companionRallyMoveSpeed(native,230),
      normal.companionMoveSpeed(230));
    assert.equal(normal.cooldownRecoveryElapsed(native,1,false,true),1);
  }
  console.log('PASS Phase 5 Quickstep/Borrowed Time: legal dual-sided AoE, cap, cooldown, save isolation');
} finally {
  delete Campaign.classes.rogue;
  delete Campaign.talentProfiles.rogue;
}
