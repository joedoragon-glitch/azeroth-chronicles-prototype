'use strict';
// Phase 2: dormant Rogue Bard hero fundamentals. No public fourth-class entry.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const R = Campaign.rules;

assert.deepEqual(Object.keys(Campaign.classes), ['paladin', 'mage', 'ranger']);
assert.throws(() => new Campaign('normal', 'rogue'), /Unknown mode or class/);
const foundation = R.rogueHeroFoundation;
assert.equal(foundation.classId, 'rogue');
assert.deepEqual(foundation.stats, { hp: 90, mp: 60, power: 18, armor: 3, speed: 300 });
assert.deepEqual(foundation.talents, { power: 7, mana: 2, hp: 27, speed: 38 });
assert.equal(foundation.weapon.kind, 'staff');
assert.equal(foundation.weapon.instrument, 'suspended-jingle-bell');
assert.equal(foundation.weapon.basicCue, 'bell-jingle');
assert.equal(foundation.endure.duration, 2);
assert.equal(foundation.endure.floorHp, 1);
assert.equal(Campaign.expeditionPartyCapFor('rogue', 1), 3);

// A temporary registry entry is test-only. It lets native mechanics execute
// without exposing a broken Rogue run in the real class-choice menu.
Campaign.classes.rogue = { ...foundation.stats, icon: '🔔' };
Campaign.talentProfiles.rogue = { ...foundation.talents };
try {
  function fresh(count = 1) {
    const g = new Campaign('normal', 'rogue', () => 0.9);
    g.s.mercyTime = 0;
    g.s.valeFieldAwakened = true;
    g.s.party = [];
    Object.assign(g.hero, { x: 500, y: 500, order: null });
    g.zone().props = [];
    g.zone().buildings = [];
    const enemies = Array.from({ length: count }, (_, i) => {
      const e = g.makeEnemy(
        { species: 'goblin', name: 'Bell test foe', level: 1,
          hp: 10000, damage: 0, gold: 0, xp: 0 },
        { x: 585 + i * 10, y: 500 },
      );
      e.aggro = true;
      e.returning = false;
      e.hp = e.maxHp;
      e.home = { x: e.x, y: e.y };
      return e;
    });
    g.zone().enemies = enemies;
    return { g, enemies };
  }

  const { g, enemies } = fresh(7);
  assert.deepEqual(g.s.party, [], 'fresh Rogue starts solo');
  assert.equal(g.hero.hp, 90);
  assert.equal(g.hero.maxHp, 90);
  assert.equal(g.hero.mp, 60);
  assert.equal(g.talentProfile().power, 7);
  assert.equal(g.heroBasicAttackApproachRange(), 260);
  assert.equal(g.heroSkillRange(1), 0, 'manual skill range not authorized');
  assert.equal(g.cast(1, enemies[0].id), false, 'tap remains unavailable');
  assert.equal(g.cast(1, enemies[0].id, true), false, 'charged form remains unavailable');
  assert.equal(g.cast(2, enemies[0].id), false);
  assert.equal(g.effects.filter((e) => e.type === 'rogueBellBasic').length, 0);

  const originalHP = enemies.map(e => e.hp);
  const originalGold = g.hero.gold;
  assert.equal(g.cast(1, enemies[0].id, false, null, true), true, 'automatic bell basic');
  assert(g.hero.basicCd > 0);
  assert.equal(g.hero.cd[0], 0, 'manual cooldown stays independent');
  assert.equal(g.hero.gold, originalGold, 'no purchase or Charm outcome');
  assert.equal(g.s.party.length, 0, 'no premature Charm conversion');
  assert.equal(g.s.projectiles.length, 0, 'no projectile actor');
  assert(enemies[0].hp < originalHP[0], 'primary took real damage');
  assert.equal(enemies.slice(1).filter((e, i) => e.hp < originalHP[i + 1]).length, 2,
    'normal release contacts exactly two legal secondaries');
  const firstCue = g.effects.find(e => e.type === 'rogueBellBasic');
  assert.equal(firstCue.instrument, 'suspended-jingle-bell');
  assert.equal(firstCue.audioCue, 'bell-jingle');
  assert.equal(firstCue.combo, 1);
  assert.equal(firstCue.splashHits, 2);
  assert.equal(g.cast(1, enemies[0].id, false, null, true), false, 'basic recovery enforced');

  // Third legitimate release uses existing combo bookkeeping, with total
  // five contacts rather than unbounded area damage.
  for (let i = 0; i < 2; i++) {
    g.hero.basicCd = 0;
    g.s.time += 0.85;
    assert(g.castMovementBasic());
  }
  const third = g.effects.filter(e => e.type === 'rogueBellBasic').at(-1);
  assert.equal(third.combo, 3);
  assert.equal(third.splashHits, 4);

  // No target, blocked target, or unsupported manual action may spend time,
  // MP, crit RNG, cooldown or mutate the company.
  const noTarget = fresh();
  noTarget.g.zone().enemies = [];
  const before = noTarget.g.snapshot();
  assert.equal(noTarget.g.castMovementBasic(), false);
  assert.deepEqual(noTarget.g.snapshot(), before);

  const survival = fresh().g;
  survival.hero.hp = 8;
  assert(survival.hitParty(survival.hero, 1000), 'first lethal hit lands');
  assert.equal(survival.hero.hp, 1, 'Endure at 1 HP');
  assert.equal(survival.hero.rogueEndureUsed, true);
  assert.equal(survival.hero.rogueEndureUntil, survival.s.time + 2);
  assert.equal(survival.hitParty(survival.hero, 1000), false, 'within Endure window');
  assert.equal(survival.hero.hp, 1);
  const saved = survival.snapshot();
  assert.equal(saved.hero.rogueEndureUsed, true);
  assert.equal(saved.hero.rogueEndureUntil, undefined);
  assert.doesNotThrow(() => Campaign.validate(saved));
  const invalid = structuredClone(saved);
  invalid.hero.rogueEndureUsed = 'yes';
  assert.throws(() => Campaign.validate(invalid), /Invalid Rogue Endure state/);

  survival.s.time += 2.1;
  const deathsBefore = survival.s.statistics.deaths;
  assert(survival.hitParty(survival.hero, 1000));
  assert.equal(survival.s.statistics.deaths, deathsBefore + 1, 'no endless retrigger');
  assert.equal(survival.hero.rogueEndureUsed, false, 'standard recovery starts a new life');
  assert.equal(survival.hero.rogueEndureUntil, undefined);
} finally {
  delete Campaign.classes.rogue;
  delete Campaign.talentProfiles.rogue;
}
assert.deepEqual(Object.keys(Campaign.classes), ['paladin', 'mage', 'ranger']);
console.log('PASS staged Rogue Bell basic, Endure, no Charm, three-class isolation');
