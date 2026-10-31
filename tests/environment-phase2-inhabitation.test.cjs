'use strict';
// Environmental finishing Phase 2: bounded, genuine current-Campaign
// inhabited-place actual-game evidence. Authoritative scene objects rather than scene-declaration count; not owner/device acceptance.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Renderer = require('../src/prototype/renderer.js');
const Visuals = require('../src/prototype/visuals.js');
const Combat = require('../src/prototype/combat-visuals.js');

const output = path.join(__dirname, '..', 'test-artifacts', 'environment-phase2', 'native');
fs.mkdirSync(output, { recursive: true });
const width = 880, height = 560, records = [];
const localities = {};
for (let i = 0; i < Campaign.data.regions.length; i++) {
  const region = Campaign.data.regions[i].id;
  const plan = Campaign.rules.worldLifePlans[i];
  const list = [
    ['principal-settlement', 'town', null, 245, 'town'],
    ['secondary-settlement', 'minor', null, 245, 'hamlet'],
    ...plan.habitats.map((h) => [
      h.id, 'habitat', h.center, region === 'crown' && h.id === 'dark-fortress-court' ? 480 : 245,
      'inhabited-home',
      h.props.map((p) => p[2]),
    ]),
    ['everyday-work', 'work', plan.civilian[0].slice(0,2), 245, 'civilian-work'],
    ['local-supplies', 'work', plan.civilian[1].slice(0,2), 245, 'civilian-work'],
  ];
  const authored = {
    vale: [['smallhold-livelihood', Campaign.rules.greenwoodRuralScenes[0].slice(0,2)],
      ['millhaven-kitchen-gardens', Campaign.rules.greenwoodRuralScenes[3].slice(0,2)]],
    march: [['reedport-fish-trade', [730,1170]], ['archive-relief-yard', [460,2170]]],
    highlands: [['stonecross-mint-work', [1145,2310]], ['quarry-ore-sorting', [2570,275]]],
    frontier: [['burned-hamlet-home-repair', [1240,1080]], ['inspection-courtyard', [1720,1360]]],
    crown: [['labor-quarter-domesticity', [720,900]], ['public-thermal-washhouse', [2630,2135]]],
  }[region];
  for (const [label, coordinate] of authored)
    list.push([label, 'authored-place', coordinate, 245, 'inhabited-work']);
  localities[region] = list;
}

for (const [region, locations] of Object.entries(localities)) {
  const game = new Campaign('normal', 'paladin', () => 0.73);
  assert(game.enter(region), 'Could not enter existing ' + region);
  const index = Campaign.data.regions.findIndex((r) => r.id === region);
  assert(index >= 0);
  const zone = game.zone();
  const original = JSON.stringify(game.s);
  for (const [label, role, target, clock, category, expectedKinds = []] of locations) {
    const coordinate = role === 'town'
      ? Campaign.data.towns[index]
      : role === 'minor'
        ? Campaign.data.minors[index]
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
    const props = near(zone.props), buildings = near(zone.buildings), npcs = near(zone.npcs);
    const structureTotals = {};
    for (const p of props)
      if (p.structure) structureTotals[p.structure] = (structureTotals[p.structure] || 0) + 1;
    const missing = [...new Set(expectedKinds)].filter((kind) => !structureTotals[kind]);
    records.push({
      region, label, category, x, y, phase: game.daylightPhase().phase,
      zoom: 1.5, optimized: false, canvasOnly: true,
      propsWithin430: props.length,
      buildingsWithin430: buildings.length,
      npcsWithin430: npcs.length,
      declaredHouseholdKinds: [...new Set(expectedKinds)],
      absentDeclaredKindsWithin430: missing,
      realizedStructures: structureTotals,
      occupiedSceneTags: [...new Set(props.flatMap((p) => [
        p.worldLifeHabitat ? 'habitat:' + p.worldLifeHabitat : null,
        p.ironrootDistrict ? 'ironroot:' + p.ironrootDistrict : null,
        p.frontierDistrict ? 'frontier:' + p.frontierDistrict : null,
        p.crownDistrict ? 'crown:' + p.crownDistrict : null,
        p.regionalDistrict ? 'regional:' + p.regionalDistrict : null,
        p.greenwoodCountry ? 'rural:' + p.greenwoodCountry : null,
      ].filter(Boolean)))].sort(),
      localNpcNames: npcs.map((n) => n.name || n.id).slice(0,16),
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
const report = { phase: 2, status: 'real occupied-world Canvas references; no automatic aesthetic acceptance',
  gameBaseline: 'test checkout', count: records.length, records };
fs.writeFileSync(path.join(output, 'scene-index.json'), JSON.stringify(report, null, 2) + '\n');
assert.equal(records.length, 46, '10 settlements + 16 inhabited habitats + 10 everyday-work + 10 authored-work scenes');
console.log('PASS Phase 2: ' + records.length +
  ' native 150%-zoom inhabited-place screenshots from real Campaign; no draw/save mutation');
for (const row of records) console.log('SCENE ' + row.region + '/' + row.label +
  ' missingKinds=' + row.absentDeclaredKindsWithin430.join(',') + ' nearBlack=' + row.nearBlackSampleFraction + ' props=' + row.propsWithin430 +
  ' buildings=' + row.buildingsWithin430 + ' npcs=' + row.npcsWithin430);
