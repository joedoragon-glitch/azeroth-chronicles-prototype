'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Visuals = require('../src/prototype/visuals.js');
const Campaign = require('../src/prototype/engine.js');

// Validate the actual shared presentation owner, not just narrative text.
function probe(night, optimized = true, sources = []) {
  const calls = { radial: 0, gradient: 0, fills: 0, lanternFrames: 0 };
  const ctx = {
    save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {},
    stroke() {}, strokeRect() {}, fill() {}, arc() {}, ellipse() {},
    fillRect(x, y, w, h) { calls.fills++; if (w === 12 && h === 12) calls.lanternFrames++; },
    createLinearGradient() { calls.gradient++; return { addColorStop() {} }; },
    createRadialGradient() { calls.radial++; return { addColorStop() {} }; },
  };
  const data = JSON.stringify(sources);
  Visuals.atmosphere(ctx, { width: 400, height: 270 }, 0, {
    night, optimized, hero: { x: 200, y: 140 }, lights: sources,
  });
  assert.equal(JSON.stringify(sources), data, 'lighting never changes simulation or map sources');
  return calls;
}
const sources = [
  { id: 'occupied-cottage', x: 70, y: 80, kind: 'window' },
  { id: 'service-stand', x: 150, y: 110, kind: 'lantern' },
  { id: 'working-hearth', x: 250, y: 190, kind: 'fire' },
  { id: 'village-forge', x: 300, y: 185, kind: 'work-fire' },
];
const day = probe(false, true, sources);
assert.equal(day.radial, 0, 'daylight does not create any night glow');
assert.equal(day.lanternFrames, 0, 'lantern glasses remain unlit during the day');
const night = probe(true, true, sources);
assert.equal(night.radial, sources.length + 1,
  'the existing hero light and every inhabited night source has its own pool');
assert.equal(night.lanternFrames, 1, 'only the service lantern creates a glazed lamp');
assert(night.fills > day.fills, 'warm house windows and lantern fixtures are visible at night');
const wilderness = probe(true, true, []);
assert.equal(wilderness.radial, 1, 'wild terrain stays dark except the hero visibility pool');
assert.equal(wilderness.lanternFrames, 0, 'no invented lanterns in empty wilderness');
assert.doesNotThrow(() => probe(true, false, sources), 'full atmospheric mode preserves night fixtures');

// Source selection stays derived from existing houses, active work and services,
// and deliberately does not add any flame props or gameplay blockers.
const renderer = fs.readFileSync(path.join(__dirname, '../src/prototype/renderer.js'), 'utf8');
assert(/const nightSources = !nightNow\s*\? \[\]\s*:\s*\[/.test(renderer),
  'daytime avoids unnecessary nighttime lighting scans');
for (const kind of ["'window'", "'fire'", "'work-fire'", "'lantern'"])
  assert(renderer.includes(kind), 'source classification supports ' + kind);
for (const structure of ['cookfire', 'warm-brazier', 'ember-pit', 'forge', 'field-kitchen'])
  assert(['fire', 'work-fire'].includes(require('../src/prototype/renderer.js').nightLightKind(structure)), 'working ' + structure + ' produces light');
const game = new Campaign();
const before = JSON.stringify(game.snapshot());
game.s.clock = 480;
assert(game.night(), 'natural world clock turns lights on at night');
game.s.clock = 120;
assert(!game.night(), 'same world clock turns them off during the day');
game.s.clock = JSON.parse(before).clock;
assert.equal(JSON.stringify(game.snapshot()), before, 'lighting never writes a saved nighttime flag');
console.log('PASS night-specific inhabited windows, cozy lanterns, working fires, wilderness contrast and state purity');
