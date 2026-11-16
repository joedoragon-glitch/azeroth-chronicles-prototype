'use strict';
// v0.9.2: real Rogue Wither damage is periodic, not a new qualifying sword/bow
// attack on every simulation update. Preserve all actual HP loss and skill rules.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Visuals = require('../src/prototype/combat-visuals.js');
const bossDef = Campaign.data.bosses.find((b) => b.id === 'darklord');
const rules = Campaign.rules;

// Some standalone tests still register Rogue explicitly for test isolation.
const hadRogue = Object.prototype.hasOwnProperty.call(Campaign.classes, 'rogue');
const oldRogue = Campaign.classes.rogue;
const oldTalents = Campaign.talentProfiles.rogue;
if (!hadRogue) {
  Campaign.classes.rogue = { ...rules.rogueHeroFoundation.stats, icon: 'bell' };
  Campaign.talentProfiles.rogue = { ...rules.rogueHeroFoundation.talents };
}

function scene(boss = false) {
  const game = new Campaign('normal', 'rogue', () => 0.9);
  if (boss) assert(game.enter('crown'));
  game.s.mercyTime = 0;
  game.s.valeFieldAwakened = true;
  game.s.party = [];
  game.hero.skills[3] = 1;
  Object.assign(game.hero, { x: 1200, y: 1100, order: null });
  game.zone().props = [];
  game.zone().buildings = [];
  const foe = boss
    ? game.bossEnemy(bossDef, 'normal', { x: 1100, y: 1100 })
    : game.makeEnemy(
        { species: 'goblin', name: 'Wither impact target',
          level: 1, hp: 10000, damage: 0, gold: 0, xp: 0 },
        { x: 1100, y: 1100 });
  foe.aggro = true;
  foe.returning = false;
  game.zone().enemies = [foe];
  game.line = () => true;
  game.tacticalRogueLeashAllows = () => true;
  if (boss) game.engage(foe, true);
  assert.equal(game.cast(4, foe.id), true, 'committed ordinary Rogue Wither');
  assert(game.rogueEnemyWithered(foe));
  return { game, foe };
}

function advanceWither(game, foe, seconds, dt) {
  const start = game.s.time;
  const steps = Math.round(seconds / dt);
  for (let i = 1; i <= steps; i++) {
    game.s.time = start + i * dt;
    game.tickRogueEnemyDot(foe, dt);
  }
}

try {
  // Wither consumes a finite damage budget independent of simulation cadence;
  // it must not generate a one-frame visual flash for *every* small budget step.
  const samples = [1 / 20, 1 / 30, 1 / 60].map((dt) => {
    const { game, foe } = scene();
    const before = foe.hp;
    game.effects.length = 0;
    advanceWither(game, foe, 2, dt);
    const dealt = before - foe.hp;
    const rawHits = game.effects.filter((e) => e.type === 'hit');
    assert(dealt > 0, 'Wither deals native HP loss in the real damage resolver');
    assert(rawHits.length >= 2 && rawHits.length <= 6,
      'visible Wither impacts follow legible periodic cadence, not the simulation frame rate');
    assert(Visuals.queue(rawHits, game, []).some((f) => f.type === 'impact'),
      'a real periodized hit remains visible through the existing Canvas/Pixi cue path');
    assert.doesNotThrow(() => Campaign.validate(game.snapshot()),
      'finite status remains compatible with original v4 snapshots');
    return dealt;
  });
  for (const amount of samples.slice(1))
    assert(Math.abs(amount - samples[0]) < 0.05,
      'Wither total damage stays stable at 20/30/60 simulation steps');

  // Royal Taxation requires qualifying *attacks*, not dozens of tiny DoT
  // accounting updates from one performed song. Such damage still reduces HP.
  const { game, foe } = scene(true);
  const before = foe.hp;
  foe.royalTaxation = {
    marked: ['hero'], expires: game.s.time + 10, sources: [], hits: 0,
  };
  game.effects.length = 0;
  advanceWither(game, foe, 1, 1 / 20);
  assert(foe.hp < before, 'tax-marked boss still receives lawful Wither damage');
  assert.equal(foe.royalTaxation?.hits, 0,
    'periodic Wither updates are not repeated qualifying strike actions');
  assert.equal(foe.royalTaxShield || 0, 0,
    'Wither alone cannot instantly fund a Royal Taxation shield');
  assert(!foe.passiveVeteranUntil || foe.passiveVeteranUntil <= game.s.time,
    'Wither updates must not become four separate Veteran Instinct attacks');
  assert.equal((foe.passiveVeteranHits || []).length, 0,
    'an ongoing DoT does not build an attack-pattern hit roster');
  for (let i = 1; i <= 4; i++) {
    assert(game.damage(foe, 15, 'hero'), 'real direct attack still lands');
    if (i < 4) assert(!foe.royalTaxShield);
  }
  assert.equal(foe.royalTaxShield, foe.maxHp * 0.12,
    'four separate direct attacks preserve native shield mechanics');
  assert(foe.passiveVeteranUntil > game.s.time,
    'four legitimate solo attacks still trigger the native Veteran defense');

  // Expiration is a separate lifecycle obligation: skipping DoT attack-count
  // receipts must not leave an expired boss condition latched indefinitely.
  const { game: expiredGame, foe: expiredFoe } = scene(true);
  expiredFoe.royalTaxation = {
    marked: ['hero'], expires: expiredGame.s.time - 0.01, sources: [], hits: 0,
  };
  advanceWither(expiredGame, expiredFoe, 0.05, 0.05);
  assert.equal(expiredFoe.royalTaxation, null,
    'existing taxation expires even if subsequent damage is only periodic');

  console.log('PASS Rogue Wither cadence, real HP budget, VFX receipts, Veteran and Royal Taxation identity');
} finally {
  if (!hadRogue) {
    delete Campaign.classes.rogue;
    if (oldTalents === undefined) delete Campaign.talentProfiles.rogue;
    else Campaign.talentProfiles.rogue = oldTalents;
  } else Campaign.classes.rogue = oldRogue;
}
