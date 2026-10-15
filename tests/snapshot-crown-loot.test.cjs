'use strict';
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Renderer = require('../src/prototype/renderer.js');

// Coins painted at the enemy's loot position are minted Crown portraits,
// not the old golden disk. The raster never reads/mutates the saved amount.
const canvas = createCanvas(80, 80);
const ctx = canvas.getContext('2d');
const point = { x: 40, y: 35 };
const beforePoint = JSON.stringify(point);
Renderer.drawCrownLoot(ctx, point);
assert.equal(JSON.stringify(point), beforePoint, 'drawing is presentation only');
const pix = ctx.getImageData(0, 0, 80, 80).data;
let metal = 0;
let darkPortrait = 0;
let visible = 0;
for (let y = 19; y <= 42; y++)
  for (let x = 27; x <= 53; x++) {
    const i = (y * 80 + x) * 4;
    const [r, g, b, a] = pix.slice(i, i + 4);
    if (a < 200) continue;
    visible++;
    // Neutral silvery body must dominate the metal rather than legacy gold.
    if (r > 155 && g > 165 && b > 170 && Math.abs(r - g) < 27) metal++;
    if (r < 133 && g < 155 && b < 166 && b > r) darkPortrait++;
  }
assert(visible > 160 && metal > 48, 'coin has a visible silver-metal face');
assert(darkPortrait > 16, 'a dark crowned portrait is visibly stamped on its face');
const goldenDisk = [220, 173, 84];
let oldGoldPixels = 0;
for (let i = 0; i < pix.length; i += 4)
  if (pix[i + 3] > 220 &&
    Math.abs(pix[i] - goldenDisk[0]) < 5 &&
    Math.abs(pix[i + 1] - goldenDisk[1]) < 5 &&
    Math.abs(pix[i + 2] - goldenDisk[2]) < 5) oldGoldPixels++;
assert.equal(oldGoldPixels, 0, 'original gold-disc color has been retired');

// The single loot payload remains exactly the historical v4 gold key. Every
// character/difficulty keeps reward, pickup distance and accounting unchanged.
for (const mode of ['normal', 'nightmare'])
  for (const heroClass of Object.keys(Campaign.classes)) {
    const c = new Campaign(mode, heroClass, () => 0.9);
    const e = {
      x: c.hero.x,
      y: c.hero.y,
      level: c.hero.level,
      gold: 23,
      xp: 0,
    };
    const amount = c.enemyReward(e).gold;
    c.awardEnemyReward(e);
    assert.equal(c.s.loot.length, 1);
    assert.equal(c.s.loot[0].gold, amount);
    assert(!('crowns' in c.s.loot[0]), 'no incompatible new save key');
    const restored = Campaign.restore(c.snapshot());
    assert.equal(restored.s.version, 4);
    assert.equal(restored.s.loot[0].gold, amount, 'old loot value restores');
    const prior = restored.hero.gold;
    restored.tick(0.05);
    assert.equal(restored.s.loot.length, 0, 'unchanged nearby automatic collection');
    assert.equal(restored.hero.gold, prior + amount);
  }

console.log('PASS Crown portrait drop pixels and six old-schema loot/save/collection cases');
