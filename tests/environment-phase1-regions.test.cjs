'use strict';
// Environmental finishing Phase 1: bounded, genuine current-Campaign
// landscape composition references. Not an artistic acceptance or device test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Renderer = require('../src/prototype/renderer.js');
const Visuals = require('../src/prototype/visuals.js');
const Combat = require('../src/prototype/combat-visuals.js');

const output = path.join(__dirname, '..', 'test-artifacts', 'environment-phase1', 'native');
fs.mkdirSync(output, { recursive: true });
const width = 880, height = 560, records = [];
const localities = {
  vale: [
    ['millhaven-entry', 'town', null, 245],
    ['orchard-hamlet', 'minor', null, 245],
    ['working-mill', null, [1200, 1400], 245],
    ['cultivated-orchard', null, [780, 2100], 245],
    ['estate-edge', null, [2830, 2850], 480],
    ['wagon-departure', 'port', null, 245],
  ],
  march: [
    ['reedport-entry', 'town', null, 245],
    ['fisher-camp', 'minor', null, 245],
    ['lake-causeway', null, [1405, 1780], 245],
    ['archive-banks', null, [500, 2350], 245],
    ['lantern-shore', null, [1880, 2600], 480],
  ],
  highlands: [
    ['stonecross-entry', 'town', null, 245],
    ['quarry-outpost', 'minor', null, 245],
    ['ore-workings', null, [650, 390], 245],
    ['timber-crossing', null, [1735, 2420], 245],
    ['wolf-hollow', null, [480, 1010], 245],
    ['ogre-hearth', null, [940, 3010], 480],
  ],
  frontier: [
    ['emberwatch-entry', 'town', null, 245],
    ['burned-hamlet', 'minor', null, 245],
    ['damaged-crossing', null, [1450, 2160], 245],
    ['recovery-ground', null, [920, 2120], 245],
    ['checkpoint', null, [2600, 1650], 480],
    ['bastion-approach', null, [3000, 2700], 245],
  ],
  crown: [
    ['crownwatch-entry', 'town', null, 245],
    ['ash-refuge', 'minor', null, 245],
    ['labor-quarter', null, [720, 900], 245],
    ['lava-crossing', null, [1350, 1000], 245],
    ['thermal-works', null, [2030, 2640], 480],
    ['foundry-approach', null, [1850, 2700], 245],
    ['fortress-gate', null, [3060, 3040], 480],
  ],
};

for (const [region, locations] of Object.entries(localities)) {
  const game = new Campaign('normal', 'paladin', () => 0.73);
  assert(game.enter(region), 'Could not enter existing ' + region);
  const index = Campaign.data.regions.findIndex((r) => r.id === region);
  assert(index >= 0);
  const zone = game.zone();
  const original = JSON.stringify(game.s);
  for (const [label, role, target, clock] of locations) {
    const coordinate = role === 'town'
      ? Campaign.data.towns[index]
      : role === 'minor'
        ? Campaign.data.minors[index]
        : role === 'port'
          ? Campaign.data.ports[index]
          : target;
    assert(coordinate && coordinate.length === 2);
    const [x, y] = coordinate;
    game.s.clock = clock;
    game.hero.x = x;
    game.hero.y = y;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const before = JSON.stringify(game.s);
    const painter = Renderer.create({
      canvas: { width, height }, ctx, getGame: () => game,
      platform: {
        cameraZoom: 1.5,
        cameraAnchor: (w, h) => ({ x: w * 0.56, y: h * 0.52 }),
      },
      Campaign,
      PrototypeVisuals: Visuals,
      PrototypeCombatVisuals: Combat,
      chargePresentation: () => null,
      isPaused: () => false,
      now: () => 16000,
    });
    painter.setOptimizationMode(false);
    painter.draw();
    assert.equal(JSON.stringify(game.s), before,
      'Drawing changed gameplay state at ' + region + ' ' + label);
    const bytes = canvas.toBuffer('image/png');
    assert(bytes.length > 10000, 'Missing rendered world at ' + region + ' ' + label);
    const pixels = ctx.getImageData(0, 0, width, height).data;
    let nearBlack = 0, samples = 0;
    for (let py = 0; py < height; py += 12) {
      for (let px = 0; px < width; px += 12) {
        const offset = (py * width + px) * 4;
        const luminance = (pixels[offset] + pixels[offset + 1] + pixels[offset + 2]) / 3;
        if (luminance < 32) nearBlack++;
        samples++;
      }
    }
    const near = (objects) => (objects || [])
      .filter((o) => Number.isFinite(o.x) && Number.isFinite(o.y) &&
        Math.hypot(o.x - x, o.y - y) <= 430);
    const file = region + '-' + label + '.png';
    fs.writeFileSync(path.join(output, file), bytes);
    records.push({
      region, label, x, y, phase: game.daylightPhase().phase,
      zoom: 1.5, optimized: false, canvasOnly: true,
      propsWithin430: near(zone.props).length,
      buildingsWithin430: near(zone.buildings).length,
      npcsWithin430: near(zone.npcs).length,
      nearBlackSampleFraction: Number((nearBlack / samples).toFixed(3)),
      pngBytes: bytes.length,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    });
  }
  // The camera is moved within a dedicated test Campaign only. We never
  // mutate a pre-existing player campaign or save / production data.
  assert.notEqual(JSON.stringify(game.s), original,
    'Expected ephemeral camera/clock changes in isolated review only');
}
const report = { phase: 1, status: 'actual Canvas composition references; no automatic art acceptance',
  gameBaseline: 'test checkout', count: records.length, records };
fs.writeFileSync(path.join(output, 'scene-index.json'), JSON.stringify(report, null, 2) + '\n');
assert.equal(records.length, 30);
console.log('PASS Phase 1: ' + records.length +
  ' native 150%-zoom region-composition screenshots from real Campaign; no draw/save mutation');
for (const row of records) console.log('SCENE ' + row.region + '/' + row.label +
  ' nearBlack=' + row.nearBlackSampleFraction + ' props=' + row.propsWithin430 +
  ' buildings=' + row.buildingsWithin430 + ' npcs=' + row.npcsWithin430);
