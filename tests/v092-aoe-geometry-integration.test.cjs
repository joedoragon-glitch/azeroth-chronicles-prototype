'use strict';
// PR #908: new, accurately scoped geometry checks. Keep the existing
// historical F01–F79 audit untouched until its independent modernization.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const R = C.rules;
const close = (actual, expected, why) =>
  assert(Math.abs(actual - expected) < 1e-7, why + ': ' + actual + ' vs ' + expected);

// These values were already effective in v0.9.1 after historical range
// multipliers, before the authorized v0.9.2 source normalization.
assert.equal(R.bossCadence.specialRange, 720);
assert.equal(R.bossCadence.areaRangeMultiplier, undefined);
assert.deepEqual(
  {
    cone: R.bossAreaGeometry.coneRadius,
    sector: R.bossAreaGeometry.sectorRadius,
    ring: R.bossAreaGeometry.ringInitialRadius,
    first: R.bossAreaGeometry.firstCircleRadius,
    other: R.bossAreaGeometry.otherCircleRadius,
    multi: R.bossAreaGeometry.multiCircleRadius,
    double: R.bossAreaGeometry.doubleCircleRadius,
    ringLife: R.bossAreaGeometry.ringLife,
  },
  {
    cone: 227.7, sector: 386.4, ring: 144.9, first: 124.2,
    other: 158.7, multi: 103.5, double: 207, ringLife: 2.208,
  },
  'final geometry is explicit; there is no second runtime amplification',
);
assert.equal(R.roomCaptains['supply-vale'].specialRange, 672);
assert.equal(R.roomCaptains['supply-vale'].attacks[1].radius, 144);
assert.equal(R.roomCaptains['supply-vale'].attacks[2].radius, 227.7);
assert.equal(R.roomCaptains['supply-vale'].attacks[3].shotSpeed, 600,
  'the projectile-authoring workstream owns tracking volley speed');
close(R.roomCaptains['supply-vale'].attacks[3].shotLife, 1.68,
  'the already-scaled tracking volley life is baked after #899');
assert.equal(R.rangedEnemyCombat.projectileMultiplier, undefined);

// Exercise native attack construction rather than making a visualization
// assertion against an unrelated older fixed boss-spawn fixture.
for (const form of ['normal', 'true']) {
  for (const [family, index, kind, expected] of [
    ['thorn', 0, 'cone', R.bossAreaGeometry.coneRadius],
    ['crypt', 4, 'ring', R.bossAreaGeometry.ringInitialRadius],
    ['mine', 0, 'circle', R.bossAreaGeometry.firstCircleRadius],
    ['darklord', 3, 'sector', R.bossAreaGeometry.sectorRadius],
  ]) {
    const c = new C('normal', 'paladin', () => 0.5);
    c.zone().props = [];
    const e = c.bossEnemy(c.boss(family), form, { x: 1100, y: 1000 });
    c.zone().enemies = [e];
    Object.assign(c.hero, { x: 1250, y: 1000 });
    if (family === 'darklord') e.hp = e.maxHp * 0.4;
    const cast = c.buildBossAttack(e, index, c.hero, true).first;
    assert(cast, family + '/' + form + ' must retain a real native attack');
    assert.equal(cast.kind, kind, family + '/' + form + ' move identity');
    close(cast.radius, expected, family + '/' + form + ' warned hit footprint');
    assert.equal(cast.total, R.attacks[family][index].warning,
      family + '/' + form + ' original preparation time');
    assert.equal(cast.recovery, R.attacks[family][index].recovery,
      family + '/' + form + ' original recovery time');
  }
}

// PT-007: ground circles resolve at their marked position even where physical
// cover blocks directional line, cone, and sector strikes.
{
  const c = new C('normal', 'paladin', () => 0.5);
  const e = c.bossEnemy(c.boss('thorn'), 'normal', { x: 1100, y: 1000 });
  c.s.party = [];
  c.zone().enemies = [e];
  Object.assign(e, { x: 1100, y: 1000, home: { x: 1100, y: 1000 } });
  Object.assign(c.hero, { x: 1300, y: 1000 });
  c.zone().props.push(
    { x: 1100, y: 930, r: 45 },
    { x: 1100, y: 1070, r: 45 },
    { x: 1030, y: 1000, r: 45 },
    { x: 1190, y: 1000, r: 34 },
  );
  assert.equal(c.line(e, c.hero), false, 'directed casts are blocked by cover');
  c.engage(e);
  const area = {
    x: 1300, y: 1000, fromX: 1100, fromY: 1000,
    angle: 0, radius: 400, coefficient: 1,
  };
  const hp = c.hero.hp;
  c.resolveArea(e, { ...area, kind: 'circle' });
  assert(c.hero.hp < hp, 'ground pulse lands on its marked footprint');
  const afterGround = c.hero.hp;
  for (const kind of ['line', 'cone', 'sector'])
    c.resolveArea(e, { ...area, kind });
  assert.equal(c.hero.hp, afterGround,
    'physically directed attacks never bypass blocking terrain');
}
console.log('PASS v0.9.2 integration: effective boss/captain AoE, both forms, projectile lifetime, PT-007 line of sight');
