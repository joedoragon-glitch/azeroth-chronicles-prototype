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
  assert.equal(g.heroSkillRange(1), 260, 'first tap available at level 1');
  assert.equal(g.heroSkillRange(1, true), 300, 'first charge available at level 1');
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
  const realHit = g.effects.find(e => e.type === 'hit');
  // Engagement legitimately scales the opponent to its fighting max HP.
  // A real hit must reduce that MAX; pre-engagement HP is not comparable.
  assert(enemies[0].hp < enemies[0].maxHp, JSON.stringify({
    reason: 'primary took real damage', before: originalHP[0], after: enemies[0].hp,
    landed: g.effects.find(e => e.type === 'rogueBellBasic')?.landed,
    hit: realHit, hero: { x: g.hero.x, y: g.hero.y, hp: g.hero.hp },
    enemy: { id: enemies[0].id, x: enemies[0].x, y: enemies[0].y,
      home: enemies[0].home, aggro: enemies[0].aggro, returning: enemies[0].returning },
  }));
  assert.equal(enemies.slice(1).filter((e) => e.hp < e.maxHp).length, 2,
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

  // Both starting manual forms must deal real spatial combat damage
  // without spawning fake Charm companions or duplicating the auto cooldown.
  const manual = fresh(6), m = manual.g, foes = manual.enemies;
  const ally = m.unit('soldier', foes[0].x + 12, foes[0].y + 12);
  m.s.party.push(ally);
  const baseline = m.companionBasicAttackDamage(ally),
    originalSpecial = m.companionAttackDamage(ally);
  assert(m.cast(1, foes[0].id), 'normal Skill 1 available from level one');
  assert.equal(m.hero.cd[0], m.skillCooldown(1));
  assert.equal(m.hero.chargedCd[0], 0);
  assert.equal(m.hero.basicCd, 0);
  assert(m.companionBasicAttackDamage(ally) > baseline, 'friendly mirror actually changes basics');
  assert.equal(m.companionAttackDamage(ally), originalSpecial, 'special attacks not buffed');
  assert.equal(m.cast(1, foes[0].id), false, 'tap respects cooldown');
  m.hero.cd[0] = 0;
  assert(m.cast(1, foes[0].id, true), 'charged Skill 1 available at level one');
  assert(m.hero.chargedCd[0] > m.hero.cd[0], 'charged recovery distinct');
  assert.equal(m.cast(1, foes[0].id, true), false, 'charge respects longer cooldown');
  assert.equal(m.cast(2, foes[0].id), false, 'later performances remain inaccessible');
  const cues = m.effects.filter(e => e.type === 'rogueBellSkill1');
  assert.deepEqual(cues.map(e => e.form), ['tap', 'charged']);
  assert(cues[1].hits >= cues[0].hits, 'charged area capacity not smaller');
  assert.equal(cues[0].audioCue, 'bell-jingle');
  assert.equal(cues[1].allyCount, 1);
  assert.equal(m.companionBasicAttackDamage(ally), baseline * 1.07);
  const skillCard = require('../src/prototype/skill-reference.js').describe(m, 1);
  assert(skillCard?.tap && skillCard?.charge && skillCard?.auto,
    'the starting three forms must have gameplay-facing descriptions');
  const saveBoon = m.snapshot();
  assert.equal(saveBoon.party[0].rogueSharpRefrainBonus, undefined);
  assert.equal(saveBoon.party[0].rogueSharpRefrainUntil, undefined);
  assert.doesNotThrow(() => Campaign.validate(saveBoon));
  const forgedBoon = structuredClone(saveBoon);
  forgedBoon.party[0].rogueSharpRefrainBonus = 100;
  assert.throws(() => Campaign.validate(forgedBoon), /Invalid saved temporary Rogue boon/);
  m.s.time += 5.1;
  assert.equal(m.companionBasicAttackDamage(ally), baseline, 'benefit expires');

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
console.log('PASS staged Rogue three-form Skill 1, basic combo, boon, Endure, save and three-class isolation');
