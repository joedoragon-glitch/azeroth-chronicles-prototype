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
    g.s.rogueCharmRng = 1; // preserve the original Phase-2 hit witness
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

  // Phase 3: exercise the real damage-and-conversion path.
  function capture(g, species = 'goblin', ranged = false) {
    const e = g.makeEnemy(
      { species, name: species, level: 1, hp: 10000,
        damage: 0, gold: 47, xp: 53 },
      { x: 585, y: 500 },
    );
    e.ranged = ranged;
    e.aggro = true;
    g.zone().enemies = [e];
    g.hero.basicCd = 0;
    g.s.rogueCharmRng = 12345; // reproducible successful LCG result
    const kills = g.s.statistics.kills, gold = g.hero.gold,
      quests = structuredClone(g.s.quests);
    assert.equal(g.cast(1, e.id, false, null, true), true);
    assert.equal(g.s.statistics.kills, kills);
    assert.equal(g.hero.gold, gold);
    assert.deepEqual(g.s.quests, quests);
    return e;
  }
  const legal = fresh(1).g;
  const source = capture(legal);
  assert(!legal.zone().enemies.includes(source), 'hostile removed once');
  assert.equal(legal.s.party.length, 1);
  const capturedAlly = legal.s.party[0];
  assert.equal(capturedAlly.charmOrigin.typeId, 'enemy:goblin:melee');
  assert.equal(legal.companionDisplayName(capturedAlly), 'Goblin');
  assert.equal(capturedAlly.charmOrigin.sourceEnemyId, source.id);
  assert(capturedAlly.hp > 0 && capturedAlly.hp <= capturedAlly.maxHp);
  assert.equal(legal.s.charmCaptures[capturedAlly.id].typeId, 'enemy:goblin:melee');
  assert.equal(legal.effects.filter((e) => e.type === 'rogueCharm').length, 1);
  assert.notEqual(legal.s.heroTarget, source.id, 'captured hostile cannot remain targeted');
  const savedCapture = legal.snapshot();
  assert.doesNotThrow(() => Campaign.validate(savedCapture));
  const restoredCapture = Campaign.restore(savedCapture, () => 0.9);
  assert.deepEqual(restoredCapture.s.party[0].charmOrigin, capturedAlly.charmOrigin);
  // Identity survives ordinary native recovery, including fallen reserve status.
  capturedAlly.hp = 0;
  capturedAlly.active = false;
  const fallSnapshot = legal.snapshot();
  assert.equal(fallSnapshot.party[0].charmOrigin.typeId, 'enemy:goblin:melee');
  // The Captain provides ordinary care: Phase 4 will extend species combat AI,
  // not discard the source identity during standard healing/recovery.
  capturedAlly.active = true;
  capturedAlly.hp = Math.max(1, capturedAlly.maxHp);
  capturedAlly.active = false;
  assert(legal.dismissCompanion(capturedAlly.id), 'resting capture dismisses normally');
  assert.equal(legal.s.charmCaptures[capturedAlly.id], undefined);
  assert.doesNotThrow(() => Campaign.validate(legal.snapshot()));
  const tampered = structuredClone(savedCapture);
  tampered.party[0].charmOrigin.typeId = 'enemy:goblin:ranged';
  assert.throws(() => Campaign.validate(tampered), /Invalid charm provenance/);
  const bareClaim = structuredClone(savedCapture);
  delete bareClaim.charmCaptures;
  assert.throws(() => Campaign.validate(bareClaim), /Invalid charm provenance/);
  const malformedType = structuredClone(savedCapture);
  malformedType.party[0].charmOrigin.role = 'archer';
  malformedType.charmCaptures[malformedType.party[0].id].role = 'archer';
  assert.throws(() => Campaign.validate(malformedType), /Invalid charm provenance/);

  // Fake reserve units cannot evade the total-owned per-subtype rank quota.
  // Keep only the legitimate capture active so the active-field cap does not
  // reject the fixture before the more specific quota invariant runs.
  const forgedOverflow = structuredClone(savedCapture);
  for (let i = 0; i < 3; i++) {
    const extra = structuredClone(forgedOverflow.party[0]);
    extra.id = 'ally-' + (900 + i);
    extra.active = false;
    extra.charmOrigin.sourceEnemyId = 'enemy-' + (900 + i);
    forgedOverflow.party.push(extra);
    forgedOverflow.charmCaptures[extra.id] = { ...extra.charmOrigin };
  }
  forgedOverflow.nextId = Math.max(forgedOverflow.nextId, 904);
  assert.throws(() => Campaign.validate(forgedOverflow), /Invalid charm subtype quota/);


  const excluded = fresh(1).g, elite = excluded.zone().enemies[0];
  elite.captain = true;
  excluded.s.rogueCharmRng = 12345;
  assert(excluded.cast(1, elite.id, false, null, true));
  assert.equal(excluded.s.rogueCharmRng, 12345, 'captain exclusion spends no roll');
  assert.equal(excluded.s.party.length, 0);
  elite.captain = false;
  elite.hp = 1;
  excluded.hero.basicCd = 0;
  assert(excluded.cast(1, elite.id, false, null, true));
  assert.equal(excluded.s.party.length, 0, 'lethal primary cannot Charm');
  assert.equal(excluded.s.rogueCharmRng, 12345);

  for (const [rankIndex, cap] of [3, 4, 4, 5, 6, 7].entries()) {
    const g = fresh(1).g;
    g.s.expeditionRank = rankIndex + 1;
    for (let i = 0; i < cap; i++) capture(g);
    assert.equal(g.s.party.length, cap);
    const refused = capture(g);
    assert(g.zone().enemies.includes(refused), 'quota refusal leaves enemy alive');
    assert.equal(g.s.party.length, cap);
    assert.equal(g.s.rogueCharmRng, 12345, 'quota refusal spends no roll');
    capture(g, 'goblin', true);
    assert.equal(g.s.party.at(-1).charmOrigin.typeId, 'enemy:goblin:ranged');
    assert.equal(g.s.party.length, cap + 1);
  }
  const reserveGame = fresh(1).g;
  reserveGame.s.party = Array.from({ length: 3 }, () =>
    reserveGame.unit('soldier', 500, 500));
  capture(reserveGame);
  assert.equal(reserveGame.s.party.at(-1).active, false,
    'full field admits captured ally into reserve');
  assert.doesNotThrow(() => Campaign.validate(reserveGame.snapshot()));
} finally {
  delete Campaign.classes.rogue;
  delete Campaign.talentProfiles.rogue;
}
assert.deepEqual(Object.keys(Campaign.classes), ['paladin', 'mage', 'ranger']);
console.log('PASS Rogue Skill 1, Endure, Charm, subtype caps, save and three-class isolation');
