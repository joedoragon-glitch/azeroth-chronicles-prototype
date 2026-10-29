'use strict';
// Owner contract: lawful Rogue skills' similar friendly and hostile effects
// STACK while their independent time windows survive; no strongest-only rule.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const R = Campaign.rules;
assert.deepEqual(Object.keys(Campaign.classes), ['paladin','mage','ranger']);
Campaign.classes.rogue = { ...R.rogueHeroFoundation.stats, icon: 'bell' };
Campaign.talentProfiles.rogue = { ...R.rogueHeroFoundation.talents };
const close = (actual, expected, description) =>
  assert(Math.abs(actual - expected) < 1e-7, description + ': ' + actual + ' versus ' + expected);
function fresh() {
  const g = new Campaign('normal', 'rogue', () => 0.9);
  g.s.mercyTime = 0;
  g.s.valeFieldAwakened = true;
  Object.assign(g.hero, { x: 500, y: 500, order: null });
  g.hero.skills = Array(8).fill(1);
  g.zone().props = [];
  g.zone().buildings = [];
  const ally = g.unit('soldier', 520, 500);
  g.s.party = [ally];
  const foe = g.makeEnemy({
    species:'goblin', name:'Stacking target', level:1,
    hp:1000000, damage:100, gold:0, xp:0,
  }, { x: 590, y: 500 });
  foe.aggro = true;
  g.zone().enemies = [foe];
  return { g, ally, foe };
}
function sing(g, foe, slot, charged = false) {
  g.hero.cd[slot - 1] = 0;
  if (charged) g.hero.chargedCd[slot - 1] = 0;
  assert(g.cast(slot, foe.id, charged),
    'legal ' + (charged ? 'charged ' : 'tap ') + 'skill ' + slot);
}
try {
  {
    const { g, ally, foe } = fresh();
    const baseline = g.companionAttackDamage(ally);
    sing(g, foe, 1);
    sing(g, foe, 1, true);
    close(g.rogueSongBoon(ally,'refrain').basicDamage, 0.12,
      'normal + charged Skill 1 on companion');
    close(g.rogueSongBoon(g.hero,'refrain').basicDamage, 0.12,
      'normal + charged Skill 1 on singer');
    close(g.companionBasicAttackDamage(ally), baseline * 1.12,
      'both normal and charged Skill 1 apply to real basic damage');
    sing(g, foe, 1);
    close(g.rogueSongBoon(ally,'refrain').basicDamage, 0.17,
      'a third lawful cast stacks instead of replacing either active cast');
    g.s.time += 4.01;
    close(g.rogueSongBoon(ally,'refrain').basicDamage, 0.07,
      'expired tap instances disappear without dropping active charged form');
    g.s.time += 1;
    assert.equal(g.rogueSongBoon(ally,'refrain'), null,
      'all independent Refrains expire cleanly');
  }
  {
    const { g, ally, foe } = fresh();
    sing(g, foe, 2);
    sing(g, foe, 2, true);
    close(g.rogueSongBoon(ally,'quickstep').move, 0.20,
      'Skill 2 normal and charged movement benefits add');
    close(g.rogueSongBoon(g.hero,'quickstep').move, 0.20,
      'Rogue receives same movement stacking');
    close(g.rogueSongBoon(ally,'quickstep').recovery, 0.13,
      'Skill 2 normal and charged recovery add');
    assert(foe.slowStacks >= 2, 'two legal hostile Slow hits increase stack count');
    // Native Ranger Rally should not erase the song's contribution either.
    ally.rangerRallyZone = g.zoneId;
    ally.rangerRallyUntil = g.s.time + 5;
    ally.rangerRallyMovement = 0.25;
    const base = g.companionMoveSpeed(230) *
      (g.charmedCompanionProfile(ally)?.speed || 1);
    close(g.companionRallyMoveSpeed(ally,230), base * 1.45,
      'Ranger Rally and combined Rogue movement song add');
    sing(g, foe, 6);
    sing(g, foe, 6, true);
    close(g.rogueSongBoon(ally,'borrowedTime').specialRecovery, 0.30,
      'both Skill 6 special recovery forms add');
    close(g.cooldownRecoveryElapsed(ally,1,false,true), 1.43,
      'Skill 2 + Skill 6 stack without old +25% suppression');
    close(g.cooldownRecoveryElapsed(ally,1,false,false), 1.13,
      'normal cooldown recovery excludes Skill 6 special-only bonus');
    g.s.time += 4.6;
    close(g.rogueSongBoon(ally,'quickstep').move, 0.12,
      'tap Quickstep expires independently while charged remains');
  }
  {
    const { g, foe } = fresh();
    sing(g, foe, 7);
    sing(g, foe, 7, true);
    close(g.rogueEnemyWeakenFraction(foe), 0.34,
      'Skill 7 normal + charged enemy Weaken sum');
    close(g.weakenedEnemyDamage(foe), foe.damage * 0.66,
      'native enemy damage reads both Weaken contributions');
    close(g.rogueSongBoon(g.hero,'firmFooting').outgoing, 0.13,
      'Skill 7 outgoing advantages sum for Rogue');
    g.s.time += 3.1;
    close(g.rogueEnemyWeakenFraction(foe), 0.20,
      'expired tap Weaken drops while charged continues');
    close(g.weakenedEnemyDamage(foe), foe.damage * 0.80,
      'damage reduction tracks independently expiring stacks');
    g.s.time += 1;
    close(g.weakenedEnemyDamage(foe), foe.damage,
      'all hostile Weaken instances expire');
  }
  {
    const { g, ally, foe } = fresh();
    ally.hp = ally.maxHp * 0.2;
    g.hero.hp *= 0.5;
    sing(g, foe, 4);
    sing(g, foe, 4, true);
    close(g.rogueEnemyHealingFactor(foe), 0.35,
      'Skill 4 anti-heal 25% and 40% combine against enemies');
    close(g.rogueSongBoon(ally,'mending').incomingHealing, 0.20,
      'Skill 4 incoming healing bonuses 8% and 12% combine');
    close(g.rogueSongBoon(ally,'mending').remainingHeal,
      ally.maxHp * 0.08, 'two finite HoT budgets stack');
    const beforeHP=ally.hp, foeHP=foe.hp;
    g.s.time += 0.5;
    g.advanceRogueMending(0.5);
    assert(ally.hp > beforeHP, 'independent Mending ticks heal without duplicating grants');
    assert(g.tickRogueEnemyDot(foe,0.5), 'both hostile DoT budgets tick');
    assert(foe.hp < foeHP, 'hostile DoT from both casts actually harms');
    g.s.time = 4.1;
    close(g.rogueEnemyHealingFactor(foe), 0.60,
      'tap anti-heal expires while charged still suppresses');
    g.s.time = 5.1;
    close(g.rogueEnemyHealingFactor(foe), 1,
      'both hostile anti-heal statuses ultimately expire');
    assert(!JSON.stringify(g.snapshot()).includes('"remainingHeal"'),
      'individual transient Mending budgets do not enter saves');
  }
  {
    const { g, ally, foe } = fresh();
    sing(g, foe, 8);
    sing(g, foe, 8, true);
    close(g.rogueSongBoon(ally,'finale').criticalChance, 0.10,
      'Skill 8 tap + charged critical chance stack');
    close(g.rogueSongBoon(g.hero,'finale').specialDamage, 0.10,
      'Skill 8 tap + charged damage advantages stack');
    sing(g, foe, 3, true);
    assert(g.rogueSongBoon(ally,'steadyBeat').protection,
      'protection remains active alongside Finale');
    // Charged Skill 8 and Skill 3 apply independent hostile Silence actions.
    g.s.time += 1.3;
    assert(g.rogueEnemySilenced(foe),
      'stacked hush durations outlive the longer single hush');
    g.s.time += 0.7;
    assert(!g.rogueEnemySilenced(foe),
      'combined hush still ends at its finite duration');
  }
  {
    const { g, ally, foe } = fresh();
    sing(g, foe, 5);
    sing(g, foe, 5, true);
    close(g.rogueStationProtection(ally).resistance, 0.65,
      'both physically overlapping station resistances add');
    close(g.rogueStationProtection(g.hero).ward, 0.06,
      'only charged station contributes actual damage ward');
    g.s.time += 4.1;
    close(g.rogueStationProtection(ally).resistance, 0.40,
      'expired station ceases buff without erasing charged station');
    g.s.time += 1;
    assert.equal(g.rogueStationProtection(ally), null,
      'station overlap is finite and respects exit/expiry');
  }
  console.log('PASS Rogue all eight skills: same-form, tap/charged and cross-skill buffs/debuffs stack with separate lawful expiry');
} finally {
  delete Campaign.classes.rogue;
  delete Campaign.talentProfiles.rogue;
}
