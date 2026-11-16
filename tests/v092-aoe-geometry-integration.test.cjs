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
// The original #902 audit also established that captain acquisition is not
// the same distance as an attack footprint. Move that contract here rather
// than losing it when leaving the unrelated historical F01-F79 suite intact.
for (const [key, oldRange] of Object.entries({
  'supply-vale': 420, 'supply-march': 390,
  'supply-highlands': 430, 'supply-crown': 440,
  'frontier-overseer': 440,
})) {
  const cfg = R.roomCaptains[key];
  assert(cfg, key + ' native captain profile remains registered');
  assert(cfg.specialRange > oldRange, key + ' authored acquisition remains expanded');
  const cone = cfg.attacks.find((a) => a.kind === 'cone');
  if (cone) assert(
    (cone.radius || R.bossAreaGeometry.captainDefaultConeRadius) < cfg.specialRange - 8,
    key + ' close cone must not be mistaken for full acquisition range',
  );
}

// Original #902 F39: the Mine ring can only be selected when its actual
// moving wave can reach the victim, including the baked-in life extension.
{
  const g = new C('normal', 'paladin', () => 0.5);
  const reach = R.combatGeometry.ringSpeed * R.bossAreaGeometry.ringLife;
  assert(reach > R.combatGeometry.ringSpeed * R.combatGeometry.ringLife,
    'normalized real ring sweep retains its approved extension');
  const e = g.bossEnemy(g.boss('mine'), 'normal', { x: 1100, y: 1200 });
  g.zone().enemies = [e];
  g.s.party = [];
  g.line = () => true;
  e.lastAttackIndex = -1;
  assert(g.bossAttackWeights(e, { x: e.x + 320, y: e.y })[2] > 0,
    'Mine wave remains a legal threat inside real moving sweep');
  assert.equal(g.bossAttackWeights(e, { x: e.x + 430, y: e.y })[2], 0,
    'Mine wave is not selected beyond the actual moving sweep');
}

// Original #902 F42: the Highlands captain may place ground area at a
// distant visible hero, but terrain blocking hero LOS must retain a nearby
// frontline target rather than projecting an invisible backline hit.
{
  const g = new C('normal', 'paladin', () => 0.5);
  g.enter('supply-highlands');
  const e = g.zone().enemies.find((u) => u.roomCaptain);
  assert(e, 'native Highlands captain exists');
  g.s.party = [];
  const front = { x: e.x + 90, y: e.y };
  Object.assign(g.hero, { x: e.x + 360, y: e.y });
  g.random = () => 0;
  g.line = () => true;
  e.lastCaptainAttack = 0;
  assert(g.startCaptainAttack(e, front), 'visible-hero ground pressure is valid');
  assert.equal(e.telegraph.kind, 'circle');
  assert.equal(e.telegraph.x, g.hero.x,
    'clear LOS permits targeting the distant hero');
  assert.equal(e.telegraph.radius,
    R.roomCaptains['supply-highlands'].attacks[1].radius,
    'native effective area radius is used directly');
  g.line = (a, b) => b !== g.hero;
  e.lastCaptainAttack = 0;
  assert(g.startCaptainAttack(e, front), 'blocked-hero frontline attack remains valid');
  assert.equal(e.telegraph.x, front.x,
    'blocked LOS prevents an invisible ground area at the distant hero');
}

// Stage 3: these are the effective dev.291 shapes, not new balance choices.
// Each value used to be expanded by 1.2 when the combat rules were exported.
{
  const moves = R.attacks.cindermaw;
  assert.deepEqual(
    { initial: moves[0].initialRadius, final: moves[0].finalRadius,
      seals: moves[3].radius, sealOrbit: moves[3].sealOrbit,
      equalisation: moves[4].radius, finisher: moves[5].finisherRadius,
      protection: moves[2].radius, delegation: moves[5].radius },
    { initial: 300, final: 186, seals: 64.8, sealOrbit: 174,
      equalisation: 81.6, finisher: 66, protection: 320, delegation: 360 },
    'Cindermaw retains all previously effective areas, including two unscaled defensive radii',
  );

  const movesD = R.roomCaptains['supply-crown'].attacks;
  assert.deepEqual(
    { fractureOrbit: movesD[0].orbit, fractureSeparation: movesD[0].minimumSeparation,
      rushLeg: movesD[1].legLength, closureInitial: movesD[4].initialRadius,
      closureFinal: movesD[4].finalRadius, closureBlast: movesD[4].finalBlastRadius,
      closureChoices: movesD[4].allowedRadii, steamOrbit: movesD[6].orbit,
      steamSeparation: movesD[6].minimumSeparation },
    { fractureOrbit: 84, fractureSeparation: 90, rushLeg: 204,
      closureInitial: 204, closureFinal: 132, closureBlast: 102,
      closureChoices: [204, 174, 144, 120, 108],
      steamOrbit: 120, steamSeparation: 90 },
    'Dreadmaw dynamic ring, orbit, spread and explosion sizes remain identical',
  );
  assert.equal(R.attacks.crypt[4].waveLife, 1.44,
    'Crypt slow-only ring lifetime stays expanded');
  assert.equal(R.attacks.crypt[3].patchRadius, 86.4);
  assert.equal(R.attacks.warlord[1].patchRadius, 86.4);
  assert.equal(R.attacks.crypt[1].volleyReach, 780,
    'the bow-volley warning and flying arrows share their effective reach');
  assert.equal(R.attacks.citadel[0].radius, 432);
}

// Native marks and launch trajectories consume the authored values; neither
// warning geometry nor attack construction may add the old multiplier again.
{
  const FX = require('../src/prototype/combat-visuals.js');
  const game = new C('normal', 'paladin', () => 0.5);
  game.zone().props = [];
  game.s.party = [];
  Object.assign(game.hero, { x: 1250, y: 1000, hp: 100000, maxHp: 100000 });
  const enemy = (family) => {
    const e = game.bossEnemy(game.boss(family), 'normal', { x: 1100, y: 1000 });
    game.zone().enemies = [e];
    return e;
  };
  let e = enemy('warlord');
  let a = game.buildBossAttack(e, 1, game.hero, true).first;
  let pads = game.attackPatches(a);
  assert.equal(pads.length, 6, 'Warlord retains six separate damaging artillery pads');
  assert.deepEqual(pads.map((p) => [p.x - a.x, p.y - a.y]), [
    [-264, -120], [0, -120], [264, -120],
    [-264, 150], [0, 150], [264, 150],
  ], 'Warlord pad centers still match the historical reach expansion');
  assert(pads.every((p) => Math.abs(p.radius - 86.4) < 1e-8));
  assert.equal(FX.warningShapes(a, pads).length, pads.length,
    'Warlord warning shows all six actual pads');

  e = enemy('crypt');
  a = game.buildBossAttack(e, 3, game.hero, true).first;
  pads = game.attackPatches(a);
  assert.equal(pads.length, 4, 'Crypt Groundwork retains four original pads');
  assert(pads.every((p) => Math.abs(p.radius - 86.4) < 1e-8));
  const otherFamily = { ...a, family: 'cindermaw', arenaPatches: undefined,
    groundworkMarks: undefined };
  assert(game.attackPatches(otherFamily).every(
    (p) => p.radius === R.bossAreaGeometry.multiCircleRadius),
    'Crypt-specific patch radius never contaminates another boss family');

  a = game.buildBossAttack(e, 1, game.hero, true).first;
  e.telegraph = a;
  game.s.projectiles = [];
  game.resolveAttack(e);
  assert.equal(game.s.projectiles.length, 3, 'Crypt fires three physical projectiles');
  for (const p of game.s.projectiles)
    close(p.speed * p.life, R.attacks.crypt[1].volleyReach,
      'real arrow travel equals the range projected by its warning');
  assert.equal(FX.warningShapes(a, []).length, 3, 'all three lanes are warned');

  e = enemy('citadel');
  a = game.buildBossAttack(e, 0, game.hero, true).first;
  assert.equal(a.radius, 432, 'Citadel canister uses authored reach');
  assert.equal(FX.warningShapes(a, []).length, 9,
    'Citadel displays all nine canister lanes at the same reach');
}

console.log('PASS v0.9.2 integration: effective boss/captain AoE, both forms, projectile lifetime, PT-007 line of sight');
