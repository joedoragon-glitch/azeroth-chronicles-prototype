'use strict';
// Five side-dungeon books must change the probability used by native attacks,
// not merely increment the collection journal or UI display.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Critical = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');
const Native = require('../src/prototype/critical-party-native.js');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');

const near = (actual, expected, label) =>
  assert(Math.abs(actual - expected) < 1e-10, label + ': ' + actual + ' != ' + expected);
const sides = Campaign.rules.sideDungeons;
assert.equal(sides.length, 5);

function nativeRelease(game, sample, source = 'hero') {
  let rolls = 0;
  const session = Native.createSession(Critical, Levels, {
    enabled: true,
    stream: { next() { rolls++; return sample; } },
  });
  const receipt = session.release(game, 'hero/paladin/1-tap', source);
  assert.equal(rolls, 1, 'one probability sample per released action');
  return receipt;
}

// Each book must move the real critical threshold by exactly one percentage
// point. A roll halfway between the previous and new chances is decisive.
const game = new Campaign('normal', 'paladin', () => .91);
for (const [index, side] of sides.entries()) {
  assert(game.enter(side.id), 'enter ' + side.name);
  const room = game.zone();
  const books = room.npcs.filter(n => n.id === 'critical-codex-' + side.id);
  assert.equal(books.length, 1, 'one book identity in ' + side.name);
  const book = books[0];
  assert.equal(book.kind, 'critical-codex', side.name + ' uses book interaction, not placeholder NPC');
  assert.equal(book.presentation, 'critical-codex', side.name + ' uses book visuals');
  assert.equal(book.icon, '📖', side.name + ' uses book icon');
  assert(!room.npcs.some(n => n.sideCodex === side.id && n !== book),
    'no duplicate Codex-shaped NPC in ' + side.name);

  const previous = .10 + index * .01;
  const threshold = previous + .005;
  const before = nativeRelease(game, threshold);
  near(before.chance, previous, 'before ' + side.name);
  assert.equal(before.critical, false, 'roll misses previous threshold');
  Object.assign(game.hero, { x: book.x, y: book.y });
  assert(game.interact(book), 'book can be read in ' + side.name);
  assert.equal(game.s.criticalCodices[side.id], true);
  const after = nativeRelease(game, threshold);
  near(after.chance, previous + .01, 'after ' + side.name);
  assert.equal(after.critical, true, 'newly earned point now wins the SAME roll');
  assert(after.effect, 'real critical effect is authored for the winning action');
  assert(!game.visibleNPCs().includes(book), 'learned volume is no longer a world pickup');

  const loaded = Campaign.restore(game.snapshot(), () => .91);
  near(nativeRelease(loaded, threshold).chance, previous + .01,
    'restored native critical chance in ' + side.name);
}
near(game.criticalPartyChance('hero'), .15, 'five books hero chance');
near(Critical.chanceFor('world'), .10, 'enemy probability remains independent');

// Verify a real legal Paladin basic/tap action, not just a direct resolver call.
// The deterministic 10.5% sample loses before the first book and wins after.
function paladinTap(collectFirstBook) {
  const g = new Campaign('normal', 'paladin', () => .91);
  completeFieldOpening(g);
  assert(g.enter(sides[0].id));
  if (collectFirstBook) {
    const book = g.zone().npcs.find(n => n.kind === 'critical-codex');
    assert(book);
    Object.assign(g.hero, { x: book.x, y: book.y });
    assert(g.interact(book), 'live fixture collects the actual Vale book');
  }
  g.zone().props = [];
  g.zone().buildings = [];
  g.zone().npcs = [];
  Object.assign(g.hero, { x: 500, y: 500, order: null, hp: 1000, maxHp: 1000 });
  g.hero.skills.fill(8);
  g.s.party = [];
  g.s.mercyTime = 0;
  const enemy = g.makeEnemy(
    { species: 'goblin', name: 'Codex threshold target', level: 1,
      hp: 100000, damage: 0, gold: 0, xp: 0 },
    { x: 580, y: 500 },
  );
  g.zone().enemies = [enemy];
  assert(g.damage(enemy, 1, 'hero'));
  let rolls = 0;
  g._criticalPartyNative = Native.createSession(Critical, Levels, {
    enabled: true,
    stream: { next() { rolls++; return .105; } },
  });
  assert(g.cast(1, enemy.id, false), 'legal Paladin Skill 1 tap releases');
  assert.equal(rolls, 1, 'actual attack rolls once');
  const projectile = g.s.projectiles[0];
  assert(projectile?.criticalExecution, 'released projectile inherits native receipt');
  return { receipt: projectile.criticalExecution, damage: projectile.damage };
}
const withoutBook = paladinTap(false);
const withBook = paladinTap(true);
near(withoutBook.receipt.chance, .10, 'before-book actual attack');
near(withBook.receipt.chance, .11, 'after-book actual attack');
assert.equal(withoutBook.receipt.critical, false);
assert.equal(withBook.receipt.critical, true);
assert(withBook.damage > withoutBook.damage,
  'winning the new critical roll enhances the actual projectile');

console.log('PASS all five book appearances, native roll thresholds, save persistence, and real Paladin combat effect');
