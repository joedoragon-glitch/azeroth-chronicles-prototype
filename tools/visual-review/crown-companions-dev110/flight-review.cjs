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
  g.s.projectiles = [shot];
  g.hero.y += 90;
  const hp = g.hero.hp;
  for (let j = 0; j < 200 && g.s.projectiles.length; j++) g.updateProjectiles(0.02);
  assert.equal(g.s.projectiles.length, 0);
  assert.equal(g.hero.hp, hp);
  const before = JSON.stringify(g.s);
  r.draw();
  assert.equal(JSON.stringify(g.s), before);
  await sharp(c.toBuffer('image/png'))
    .webp({ quality: 90 })
    .toFile(path.join(__dirname, 'wall-fire-landed.webp'));
  fs.writeFileSync(
    path.join(__dirname, 'landing.json'),
    JSON.stringify(
      {
        passed: true,
        origin: [shot.fortFromX, shot.fortFromY],
        landing: [shot.x, shot.y],
        distance: shot.fortDistance,
        projectilesRemaining: g.s.projectiles.length,
        heroDamage: hp - g.hero.hp,
      },
      null,
      2,
    ) + '\n',
  );
}
run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
