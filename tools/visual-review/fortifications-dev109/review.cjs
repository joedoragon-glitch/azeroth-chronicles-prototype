'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas'),
  sharp = require('sharp');
const C = require('../../../src/prototype/engine'),
  V = require('../../../src/prototype/visuals'),
  FX = require('../../../src/prototype/combat-visuals'),
  Renderer = require('../../../src/prototype/renderer');
async function run() {
  const g = new C('developer', 'paladin', () => 0.9);
  g.s.zone = 'frontier';
  const z = g.zone();
  g.s.clock = 120;
  g.s.mercyTime = 0;
  Object.assign(g.hero, { x: 3340, y: 950, hp: 10000, maxHp: 10000 });
  let archer = z.enemies.find((e) => e.stronghold === 'raider-drill-redoubt' && e.ranged);
  if (!archer)
    archer = z.enemies.find(
      (e) => e.species === 'archer' && Math.hypot(e.x - 3050, e.y - 950) < 180,
    );
  Object.assign(archer, {
    x: 3000,
    y: 950,
    home: { x: 3000, y: 950 },
    ranged: true,
    aggro: true,
    cd: 0,
    specialCd: 999,
    rogueCd: 999,
  });
  z.enemies.forEach((e) => {
    if (e !== archer) e.hp = 0;
  });
  g.s.party = [];
  g.updateEnemies(0.01);
  assert(archer.rangedAim);
  archer.rangedAim.timer = 0;
  g.updateEnemies(0.01);
  const shot = g.s.projectiles.find((p) => p.sourceId === archer.id);
  assert(shot?.fortId);
  const c = createCanvas(1200, 850),
    r = Renderer.create({
      canvas: c,
      ctx: c.getContext('2d'),
      getGame: () => g,
      platform: { cameraZoom: 1.8, cameraAnchor: () => ({ x: 930, y: 520 }) },
      Campaign: C,
      PrototypeVisuals: V,
      PrototypeCombatVisuals: FX,
      now: () => 16000,
      chargePresentation: () => null,
      isPaused: () => false,
    });
  const rows = [];
  for (const t of [0, 0.25, 0.5, 0.75, 0.94]) {
    const p = {
      ...shot,
      x: shot.fortFromX + shot.dx * shot.fortDistance * t,
      y: shot.fortFromY + shot.dy * shot.fortDistance * t,
    };
    g.s.projectiles = [p];
    const before = JSON.stringify(g.s);
    r.draw();
    assert.equal(JSON.stringify(g.s), before, 'native renderer remains state pure');
    const name = 'wall-fire-' + Math.round(t * 100) + '.webp';
    await sharp(c.toBuffer('image/png')).webp({ quality: 90 }).toFile(path.join(__dirname, name));
    rows.push({ t, x: p.x, y: p.y, lift: g.fortProjectileLift(p) });
  }
  fs.writeFileSync(path.join(__dirname, 'flight.json'), JSON.stringify(rows, null, 2) + '\n');
  // A single scene shows the actual native projectile at successive heights.
  g.s.projectiles = rows.map(({ t }) => ({
    ...shot,
    x: shot.fortFromX + shot.dx * shot.fortDistance * t,
    y: shot.fortFromY + shot.dy * shot.fortDistance * t,
  }));
  r.draw();
  await sharp(c.toBuffer('image/png'))
    .webp({ quality: 90 })
    .toFile(path.join(__dirname, 'wall-fire-sequence.webp'));
  const interior = new C('developer', 'paladin', () => 0.9);
  interior.s.zone = 'crypt';
  const iz = interior.zone();
  Object.assign(interior.hero, { x: 220, y: 850 });
  const shooter = interior.makeEnemy(
    {
      species: 'skeleton',
      name: 'Skeleton bow guard',
      level: 5,
      hp: 1000,
      damage: 20,
      gold: 0,
      xp: 0,
    },
    { x: 220, y: 650 },
  );
  shooter.ranged = true;
  iz.enemies = [shooter];
  interior.zone();
  for (const e of iz.enemies) if (e !== shooter) e.hp = 0;
  assert(!interior.line(shooter, interior.hero));
  assert(interior.enemyRangedLine(shooter, interior.hero));
  const arrow = {
    source: 'enemy',
    sourceId: shooter.id,
    x: 220,
    y: 650,
    dx: 0,
    dy: 1,
    speed: 260,
    life: 2,
    damage: 20,
    style: 'arrow',
    species: 'skeleton',
  };
  interior.prepareFortProjectile(arrow, shooter, interior.hero);
  interior.s.projectiles = [0.1, 0.45, 0.85].map((t) => ({ ...arrow, x: 220, y: 650 + 200 * t }));
  const ic = createCanvas(1100, 850),
    ir = Renderer.create({
      canvas: ic,
      ctx: ic.getContext('2d'),
      getGame: () => interior,
      platform: { cameraZoom: 1.5, cameraAnchor: () => ({ x: 550, y: 620 }) },
      Campaign: C,
      PrototypeVisuals: V,
      PrototypeCombatVisuals: FX,
      now: () => 16000,
      chargePresentation: () => null,
      isPaused: () => false,
    });
  const ib = JSON.stringify(interior.s);
  ir.draw();
  assert.equal(JSON.stringify(interior.s), ib);
  await sharp(ic.toBuffer('image/png'))
    .webp({ quality: 90 })
    .toFile(path.join(__dirname, 'crypt-screen-sequence.webp'));
  console.log('PASS five native flight stages, shield cue and renderer state purity');
}
run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
