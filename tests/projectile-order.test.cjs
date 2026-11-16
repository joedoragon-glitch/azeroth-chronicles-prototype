'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
function flight({ step, heroX = 325, wall = true, radius = 22, style = 'arrow' }) {
  const g = new C('normal', 'mage', () => 0.73),
    z = g.zone();
  g.s.party = [];
  g.s.mercyTime = 0;
  Object.assign(g.hero, { x: heroX, y: 1500 });
  z.props = wall ? [{ id: 'ordering-rock', x: 350, y: 1500, r: 10 }] : [];
  const e = g.makeEnemy(
    { species: 'goblin', name: 'Ordering archer', level: 1, hp: 100, damage: 20, gold: 0, xp: 0 },
    { x: 300, y: 1500 },
  );
  z.enemies = [e];
  g.admitOpeningHeroAttack(e);
  g.engage(e);
  assert(!g.blocked(g.hero.x, g.hero.y), 'Fixture hero has a legal physical position');
  g.s.projectiles = [
    {
      source: 'enemy',
      sourceId: e.id,
      x: 300,
      y: 1500,
      dx: 1,
      dy: 0,
      speed: 500,
      life: 1,
      damage: 20,
      hitRadius: radius,
      style,
    },
  ];
  const before = g.hero.hp;
  for (let elapsed = 0; elapsed < 1 && g.s.projectiles.length; elapsed += step)
    g.updateProjectiles(step);
  assert.equal(g.s.projectiles.length, 0);
  return before - g.hero.hp;
}
for (const style of ['arrow', 'cargo', 'stone'])
  for (const radius of [6, 22, 34]) {
    const results = [1 / 60, 1 / 30, 0.1].map((step) => flight({ step, radius, style }));
    assert(
      results.every((d) => d > 0),
      'Target before terrain is hit at every timestep',
    );
    assert(
      results.every((d) => Math.abs(d - results[0]) < 1e-9),
      'Damage does not depend on step',
    );
    for (const step of [1 / 60, 1 / 30, 0.1])
      assert.equal(flight({ step, heroX: 400, radius, style }), 0, 'Terrain before target blocks');
  }
// When a fast hostile shaft sweeps over two living actors in a single
// simulation update, the nearer real contact must win. The hero is listed
// first by combatTargets(), but that list is not physical shot ordering.
function twoTargets(step, heroX, soldierX, protectedSoldier = false) {
  const g = new C('normal', 'mage', () => 0.73);
  const z = g.zone();
  g.s.mercyTime = 0;
  z.props = [];
  z.buildings = [];
  Object.assign(g.hero, { x: heroX, y: 1500, immune: 0 });
  const soldier = g.unit('soldier', soldierX, 1500);
  Object.assign(soldier, { x: soldierX, y: 1500, immune: protectedSoldier ? 2 : 0 });
  g.s.party = [soldier];
  for (const u of [g.hero, soldier])
    assert(!g.blocked(u.x, u.y), 'simultaneous-contact actor stands on legal terrain');
  const enemy = g.makeEnemy(
    { species: 'goblin', name: 'Swept contact witness', level: 1,
      hp: 100, damage: 20, gold: 0, xp: 0 },
    { x: 300, y: 1500 },
  );
  z.enemies = [enemy];
  g.admitOpeningHeroAttack(enemy);
  g.engage(enemy);
  g.s.projectiles = [{
    source: 'enemy', sourceId: enemy.id,
    x: 300, y: 1500, dx: 1, dy: 0,
    speed: 1000, life: 1, damage: 80, hitRadius: 12, style: 'arrow',
  }];
  const heroHp = g.hero.hp, soldierHp = soldier.hp;
  for (let i = 0; i < 8 && g.s.projectiles.length; i++)
    g.updateProjectiles(step);
  assert.equal(g.s.projectiles.length, 0, 'single real contact consumes the shot');
  return { heroLoss: heroHp - g.hero.hp, soldierLoss: soldierHp - soldier.hp };
}
for (const dt of [0.04, 0.1]) {
  const frontSoldier = twoTargets(dt, 388, 342);
  assert.equal(frontSoldier.heroLoss, 0,
    'rear hero cannot be hit through an unprotected front companion at ' + dt);
  assert(frontSoldier.soldierLoss > 0, 'front companion absorbs the real shaft');
  const frontHero = twoTargets(dt, 342, 388);
  assert(frontHero.heroLoss > 0, 'hero in front receives the real shaft');
  assert.equal(frontHero.soldierLoss, 0, 'rear companion is not hit');
  const protectedFront = twoTargets(dt, 388, 342, true);
  assert.equal(protectedFront.heroLoss, 0, 'immune front companion still stops the shaft');
  assert.equal(protectedFront.soldierLoss, 0, 'immunity protects the contact recipient');
}

// Preserve the native fort/canister contact widths, warning footprints and
// launch permissions using the existing boundary scenarios.
require('./helpers/canister-boundaries.cjs')();
console.log(
  'PASS swept target/terrain ordering at 30/60/100ms steps, cargo and native canister boundaries',
);
