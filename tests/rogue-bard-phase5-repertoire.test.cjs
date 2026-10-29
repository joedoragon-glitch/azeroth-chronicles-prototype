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
  g.hero.skills[2] = 1;
  g.hero.skills[3] = 1;
  g.hero.skills[7] = 1;
  g.hero.skills[4] = 1;
  const card2 = Reference.describe(g,2);
  assert(card2 && card2.tap.metrics.some((m)=>m.key==='slow'));
  assert(Reference.describe(g,3)?.tap.metrics.some((m)=>m.key==='interruptDebt'));
  assert(Reference.describe(g,7)?.tap.metrics.some((m)=>m.key==='push'));
  assert(Reference.describe(g,6)?.charge.metrics.some((m)=>m.key==='specialRecovery'));
  const initialSpeed = g.companionRallyMoveSpeed(unit, 230);
  const originalCharmStream = g.s.rogueCharmRng;
  assert.equal(g.cast(2, foe.id), true, 'song requires legal engaged hostile');
  assert(foe.slow > 0, 'native hostile slow');
  assert(g.rogueSongBoon(unit,'quickstep'), 'real nearby living ally receives boon');
  assert(g.rogueSongBoon(g.hero,'quickstep'), 'Rogue receives her own legal Quickstep');
  assert(g.heroMoveSpeed() > g.hero.speed, 'Rogue movement is faster inside the timed boon');
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
  assert(g.rogueSongBoon(g.hero,'borrowedTime'));
  assert(g.cooldownRecoveryElapsed(g.hero,1,false,true) >
    g.cooldownRecoveryElapsed(g.hero,1), 'Rogue specials recover faster than her basic');
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
  assert.equal(g.rogueSongBoon(g.hero,'firmFooting')?.outgoing, 0.05);
  assert.equal(unit.damage,previousUnitDamage,'no permanent stat modification');
  assert.equal(foe.damage,priorEnemyAttack,'hostile native attack untouched');
  assert(Reference.describe(g,7)?.charge.metrics.some((m)=>m.key==='outgoing'));
  g.hero.cd[6] = 0;
  assert.equal(g.cast(7,foe.id,true),true);
  assert(g.rogueSongBoon(unit,'firmFooting')?.outgoing <= 0.08);
  // Skill 3 interrupts only a real warned enemy action; Steady Beat
  // protects a lawful living companion charge, never grants invulnerability.
  foe.rangedAim = { warning: true };
  g.hero.cd[2] = 0;
  assert.equal(g.cast(3,foe.id),true);
  assert.equal(foe.rangedAim,null);
  assert(g.rogueSongBoon(unit,'steadyBeat')?.protection);
  assert(g.rogueSongBoon(g.hero,'steadyBeat')?.protection);
  g.hero.cd[2] = 0;
  assert.equal(g.cast(3,foe.id,true),true);
  assert(g.rogueEnemySilenced(foe),'eligible enemy special hush is active');
  const protectedSnapshot = g.snapshot();
  assert(!JSON.stringify(protectedSnapshot).includes('steadyBeat'));
  // Skill 4 uses a finite nonstacking wither/mend budget; only outside healing
  // receives the capped boost. No friend/enemy status enters a campaign save.
  g.hero.cd[3] = 0;
  unit.hp = Math.max(1, unit.hp - 25);
  const beforeMend = unit.hp, beforeWither = foe.hp;
  assert.equal(g.cast(4,foe.id),true);
  assert(g.rogueSongBoon(unit,'mending')?.remainingHeal > 0);
  assert(g.rogueSongBoon(g.hero,'mending')?.remainingHeal > 0);
  g.hero.hp = Math.max(1, g.hero.hp - 24);
  const heroBeforeMend = g.hero.hp;
  assert(g.rogueEnemyHealingFactor(foe) < 1);
  assert.equal(g.tickRogueEnemyDot(foe,0.5),true);
  assert(foe.hp < beforeWither);
  g.advanceRogueMending(0.5);
  assert(unit.hp > beforeMend);
  assert(g.hero.hp > heroBeforeMend, 'the original Mending heal also reaches Rogue');
  assert(!JSON.stringify(g.snapshot()).includes('remainingHeal'));
  // Skill 8: actual AoE blast and bounded per-companion Finale; the bonus
  // applies to the native critical chance source without changing the Rogue's.
  g.hero.cd[7] = 0;
  const chanceBefore = g.criticalPartyChance(unit.id), heroChance = g.criticalPartyChance('hero');
  const hitBefore = foe.hp;
  assert.equal(g.cast(8,foe.id),true);
  assert(foe.hp < hitBefore);
  assert(Math.abs(g.criticalPartyChance(unit.id)-chanceBefore-0.04) < 1e-8);
  assert(Math.abs(g.criticalPartyChance('hero')-heroChance-0.04) < 1e-8,
    'Finale grants Rogue the same temporary critical chance as companions');
  assert(g.rogueCompanionSpecialDamage(unit,100) > 100);
  g.hero.cd[7] = 0;
  assert.equal(g.cast(8,foe.id,true),true);
  assert(g.rogueSongBoon(unit,'finale')?.criticalChance <= 0.06);
  // Skill 5: ephemeral two-station ceiling, no benefit outside footprints,
  // and direct native slow pulses rather than a new permanent actor.
  g.hero.cd[4] = 0;
  assert.equal(g.cast(5,foe.id),true);
  assert(g.rogueStationProtection(unit)?.resistance === 0.25);
  assert(g.rogueStationProtection(g.hero)?.resistance === 0.25);
  g.tickRogueStations();
  assert(foe.slow > 0);
  g.hero.cd[4] = 0;
  assert.equal(g.cast(5,foe.id,true),true);
  assert(g.rogueStationProtection(unit)?.resistance >= 0.40);
  assert(g.rogueStationProtection(g.hero)?.ward === 0.06);
  const savedStation = g.snapshot();
  assert(!JSON.stringify(savedStation).includes('pulseDamage'));
  unit.x += 400;
  assert.equal(g.rogueStationProtection(unit),null);
  unit.x -= 400;
  g.hero.x -= 400;
  assert.equal(g.rogueStationProtection(g.hero),null,
    'station self-protection ceases immediately on exit');
  g.hero.x += 400;
  assert(g.rogueStationProtection(g.hero), 'station protects on re-entry');
  // Empty legal hostile range never yields a free party boon or consumes CD.
  g.zone().enemies = [];
  g.hero.cd[1]=0;
  const before = g.snapshot();
  assert.equal(g.cast(2), false);
  assert.deepEqual(g.snapshot(),before);
  // A resting/off-field unit cannot retain active song benefits.
  g.s.party[0].active=false;
  assert.equal(g.rogueSongBoon(g.s.party[0],'quickstep'),null);
  // Target range is not equivalent to the friendly AoE: outside gets no buff.
  g.s.time += 12;
  g.hero.x = 320;
  foe.x = 590;
  g.zone().enemies = [foe];
  g.hero.cd[1] = 0;
  assert(g.cast(2,foe.id,true));
  assert.equal(g.rogueSongBoon(g.hero,'quickstep'),null,
    'a charged performance at 270 range does not self-buff beyond its 185 area');
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
