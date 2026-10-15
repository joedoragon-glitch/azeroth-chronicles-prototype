'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Campaign = require('../src/prototype/engine');

function encounter(cls = 'paladin', make = null) {
  const game = new Campaign('normal', cls, () => 0.9);
  const enemy = make
    ? make(game)
    : game.makeEnemy(
        { species: 'goblin', name: 'Rogue test', level: 5, hp: 10000, damage: 50, xp: 0, gold: 0 },
        { x: 1400, y: 1700 },
      );
  game.zone().props = [];
  game.zone().enemies = [enemy];
  game.s.party = [];
  game.s.time = 30;
  Object.assign(enemy, { aggro: true, fightStart: 0, summonCd: 100, cd: 100 });
  Object.assign(game.hero, {
    x: enemy.x + 70, y: enemy.y, level: enemy.level + 1,
    hp: 10000, maxHp: 10000, immune: 0, slow: 0,
  });
  return { game, enemy };
}
const cases = [
  ['ordinary', (g) => g.makeEnemy(
    { species: 'wolf', name: 'Wolf', level: 5, hp: 10000, damage: 50, xp: 0, gold: 0 },
    { x: 1400, y: 1700 },
  ), false],
  ['melee guardian', (g) => {
    const e = g.makeEnemy({ species: 'wolf', name: 'Wolf guard', level: 5, hp: 10000, damage: 50, xp: 0, gold: 0 }, { x: 1400, y: 1700 });
    e.guard = true; return e;
  }, true],
  ['ranged guardian', (g) => {
    const e = g.makeEnemy({ species: 'archer', name: 'Archer guard', level: 5, hp: 10000, damage: 50, xp: 0, gold: 0 }, { x: 1400, y: 1700 });
    e.guard = true; e.ranged = true; return e;
  }, true],
  ['melee ringleader', (g) => {
    const e = g.makeEnemy({ species: 'wolf', name: 'Ringleader', level: 5, hp: 10000, damage: 50, xp: 0, gold: 0 }, { x: 1400, y: 1700 });
    e.form = 'ringleader'; return e;
  }, true],
  ['ranged ringleader', (g) => {
    const e = g.makeEnemy({ species: 'archer', name: 'Ringleader', level: 5, hp: 10000, damage: 50, xp: 0, gold: 0 }, { x: 1400, y: 1700 });
    e.form = 'ringleader'; e.ranged = true; return e;
  }, true],
  ['captain', (g) => {
    const e = g.makeEnemy({ species: 'wolf', name: 'Crag', level: 5, hp: 10000, damage: 50, xp: 0, gold: 0 }, { x: 1400, y: 1700 });
    e.captain = true; e.captainProfile = 'supply-highlands'; return e;
  }, true],
  ['normal boss', (g) => g.bossEnemy(g.boss('crypt'), 'normal', { x: 1400, y: 1700 }), true],
  ['TRUE boss', (g) => g.bossEnemy(g.boss('crypt'), 'true', { x: 1400, y: 1700 }), true],
];
for (const [name, make, elite] of cases) {
  const { game, enemy } = encounter('paladin', make);
  assert(game.tacticalRogueMove(enemy, game.hero), name + ' casts');
  const cast = enemy.telegraph;
  assert.equal(cast.mobileRogueCast, elite, name + ' uses correct actor-only policy');
  assert.equal(cast.timer, cast.total, name + ' warning time unchanged');
  if (elite) {
    const spot = { x: enemy.x, y: enemy.y };
    game.hero.x = spot.x + 250;
    game.s.time += 0.1;
    game.updateEnemies(0.1);
    assert(Math.hypot(enemy.x - spot.x, enemy.y - spot.y) > 0, name + ' may move during cast');
    assert(enemy.telegraph === cast, name + ' cast remains in progress after motion');
    assert(cast.timer < cast.total, name + ' progress advances during motion');
  }
}
for (const cls of ['paladin', 'mage', 'ranger']) {
  const { game, enemy } = encounter(cls, (g) => {
    const e = g.makeEnemy({ species: 'wolf', name: 'Wolf ringleader', level: 5, hp: 10000, damage: 50, xp: 0, gold: 0 }, { x: 1400, y: 1700 });
    e.form = 'ringleader';
    return e;
  });
  assert(game.tacticalRogueMove(enemy, game.hero));
  const cast = enemy.telegraph;
  assert.equal(cast.slowSeconds, 0, 'ordinary fallback is resolved on hit');
  game.tacticalResolveRogueMove(enemy, cast);
  assert.equal(game.hero.slow, 2, cls + ' gets the approved 2s baseline');
  game.hero.slow = 3;
  game.tacticalResolveRogueMove(enemy, cast);
  assert.equal(game.hero.slow, 3, 'repeated Slow never shortens existing impairment');

  const { game: escaped, enemy: chaser } = encounter(cls, (g) => {
    const e = g.makeEnemy({ species: 'wolf', name: 'Wolf ringleader', level: 5, hp: 10000, damage: 50, xp: 0, gold: 0 }, { x: 1400, y: 1700 });
    e.form = 'ringleader';
    return e;
  });
  assert(escaped.tacticalRogueMove(chaser, escaped.hero));
  const failed = chaser.telegraph;
  escaped.hero.x = chaser.x + 450;
  const hp = escaped.hero.hp;
  escaped.tacticalResolveRogueMove(chaser, failed);
  assert.equal(escaped.hero.hp, hp, cls + ' escaped live melee reach');
  assert.equal(escaped.hero.slow, 0, cls + ' escaped Slow');
  escaped.hero.x = chaser.x + 70;
  escaped.hero.immune = 5;
  escaped.tacticalResolveRogueMove(chaser, failed);
  assert.equal(escaped.hero.slow, 0, 'immune actor cannot acquire Rogue Slow');
}
const t = Campaign.rules.tacticalFoundation;
for (const section of [t.rogueRingleaderSignatures.melee, t.rogueRingleaderSignatures.ranged, t.rogueSignatures.captains, t.rogueSignatures.bosses])
  for (const skill of Object.values(section))
    if (skill.slowSeconds) assert(skill.slowSeconds >= 2.2, skill.name + ' distinct elite duration');
assert.equal(t.rogueMoves.rangedGuardian.slowSeconds, 2);
assert.equal(t.rogueMoves.rangedFallback.slowSeconds, 2);
assert.equal(t.rogueMoves.ranged.goblin.blinds, 1.65, 'Blinding Dust cover is separate and locked');
const visual = fs.readFileSync(path.join(__dirname, '../src/prototype/combat-visuals.js'), 'utf8');
assert(visual.includes('!e.telegraph?.mobileRogueCast'), 'Rogue cast removes terrain telegraphs');
assert(visual.includes('ROGUE CAST'), 'actor progress bar remains visible');
console.log('PASS Rogue cast tier, mobile warning, contact Slow and avoidance regression');
