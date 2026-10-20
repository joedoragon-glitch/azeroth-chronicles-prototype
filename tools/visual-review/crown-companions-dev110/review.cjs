'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('node:assert/strict'),
  { createCanvas } = require('@napi-rs/canvas'),
  sharp = require('sharp');
const C = require((process.env.CROWN_REVIEW_SOURCE || '../../../src/prototype') + '/engine'),
  V = require((process.env.CROWN_REVIEW_SOURCE || '../../../src/prototype') + '/visuals'),
  FX = require((process.env.CROWN_REVIEW_SOURCE || '../../../src/prototype') + '/combat-visuals'),
  Renderer = require((process.env.CROWN_REVIEW_SOURCE || '../../../src/prototype') + '/renderer');
const seed = JSON.parse(
  require('zlib').gunzipSync(fs.readFileSync(path.join(__dirname, 'dev109-save.json.gz'))),
);
const prefix = process.argv[2] || 'after';
(async () => {
  const g = C.restore(seed, () => 0.9);
  g.zone();
  g.refreshNPCs();
  for (const [id, x, y, w, h, zoom, clock] of [
    ['town', 650, 730, 1700, 1100, 1.05, 120],
    ['town-night', 650, 730, 1400, 950, 1.15, 500],
    ['hamlet', 920, 1900, 1300, 850, 1.1, 120],
    ['north-bridge', 1350, 900, 1100, 800, 1.2, 120],
    ['south-bridge', 1350, 2400, 1100, 800, 1.2, 120],
    ['channel-north', 1350, 80, 1100, 700, 1.2, 120],
    ['channel-south', 1350, 3720, 1100, 700, 1.2, 120],
    ['south-forge', 2170, 2450, 1400, 1000, 1.05, 120],
    ['north-forge', 2890, 950, 1300, 950, 1.1, 120],
    ['orrery', 1850, 3150, 1000, 800, 1.3, 120],
    ['foundry-interior', 550, 550, 1200, 900, 1.05, 120],
    ['treasury', 700, 700, 1300, 950, 0.95, 120],
    ['citadel', 850, 850, 1500, 1100, 0.9, 120, 'citadel'],
  ]) {
    g.s.zone =
      id === 'citadel'
        ? 'citadel'
        : id === 'foundry-interior'
          ? 'side-crown-foundry'
          : id === 'treasury'
            ? 'supply-crown'
            : 'crown';
    g.zone();
    g.zone(); // Finish the existing one-time room combat normalization before measuring a draw.
    g.s.clock = clock;
    Object.assign(g.hero, g.safe(x, y));
    const before = JSON.stringify(g.s),
      c = createCanvas(w, h);
    Renderer.create({
      canvas: c,
      ctx: c.getContext('2d'),
      getGame: () => g,
      platform: { cameraZoom: zoom, cameraAnchor: () => ({ x: w / 2, y: h * 0.54 }) },
      Campaign: C,
      PrototypeVisuals: V,
      PrototypeCombatVisuals: FX,
      now: () => 16000,
      chargePresentation: () => null,
      isPaused: () => false,
    }).draw();
    assert.equal(JSON.stringify(g.s), before, 'normalized scene rendering is state pure');
    await sharp(c.toBuffer('image/png'))
      .webp({ quality: 88 })
      .toFile(path.join(__dirname, prefix + '-' + id + '.webp'));
  }
  for (const kind of ['watchpost', 'crown-orrery']) {
    const c = createCanvas(600, 560);
    V.draw(
      c.getContext('2d'),
      {
        renderKind: 'prop',
        structure: kind,
        decorative: true,
        r: kind === 'watchpost' ? 0 : 70,
        id: 'reference-' + kind,
      },
      { x: 300, y: 420 },
      3,
    );
    fs.writeFileSync(path.join(__dirname, prefix + '-' + kind + '.png'), c.toBuffer('image/png'));
  }
})();
