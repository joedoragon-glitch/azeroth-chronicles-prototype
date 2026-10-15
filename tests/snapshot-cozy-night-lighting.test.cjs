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
    save() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    strokeRect() {},
    fill() {},
    arc() {},
    ellipse() {},
    fillRect(x, y, w, h) {
      calls.fills++;
      if (w === 12 && h === 12) calls.lanternFrames++;
    },
    createLinearGradient() {
      calls.gradient++;
      return { addColorStop() {} };
    },
    createRadialGradient() {
      calls.radial++;
      return { addColorStop() {} };
    },
  };
  const data = JSON.stringify(sources);
  Visuals.atmosphere(ctx, { width: 400, height: 270 }, 0, {
    night,
    optimized,
    hero: { x: 200, y: 140 },
    lights: sources,
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
assert.equal(
  night.radial,
  sources.length + 1,
  'the existing hero light and every inhabited night source has its own pool',
);
assert.equal(night.lanternFrames, 1, 'only the service lantern creates a glazed lamp');
assert(night.fills > day.fills, 'warm house windows and lantern fixtures are visible at night');
const streetPost = probe(true, true, [
  { id: 'real-post', x: 200, y: 140, kind: 'lantern', fixture: 'post' },
]);
assert.equal(streetPost.radial, 2, 'hero plus the real street fixture');
assert.equal(
  streetPost.lanternFrames,
  0,
  'an existing post does not get a second floating hanging lamp',
);
assert.equal(
  streetPost.fills - probe(true, true, []).fills,
  2,
  'one local glow and one fill inside existing glass, with no extra night-only structure',
);
const wilderness = probe(true, true, []);
assert.equal(wilderness.radial, 1, 'wild terrain stays dark except the hero visibility pool');
assert.equal(wilderness.lanternFrames, 0, 'no invented lanterns in empty wilderness');
assert.doesNotThrow(
  () => probe(true, false, sources),
  'full atmospheric mode preserves night fixtures',
);

// Source selection stays derived from existing houses, active work and services,
// and deliberately does not add any flame props or gameplay blockers.
const renderer = fs.readFileSync(path.join(__dirname, '../src/prototype/renderer.js'), 'utf8');
assert(
  /const nightSources = !nightNow\s*\? \[\]\s*:\s*\[/.test(renderer),
  'daytime avoids unnecessary nighttime lighting scans',
);
for (const kind of ["'window'", "'fire'", "'work-fire'", "'lantern'"])
  assert(renderer.includes(kind), 'source classification supports ' + kind);
for (const structure of ['cookfire', 'warm-brazier', 'ember-pit', 'forge', 'field-kitchen'])
  assert(
    ['fire', 'work-fire'].includes(
      require('../src/prototype/renderer.js').nightLightKind(structure),
    ),
    'working ' + structure + ' produces light',
  );
const game = new Campaign();
const before = JSON.stringify(game.snapshot());
game.s.clock = 480;
assert(game.night(), 'natural world clock turns lights on at night');
game.s.clock = 120;
assert(!game.night(), 'same world clock turns them off during the day');
game.s.clock = JSON.parse(before).clock;
assert.equal(
  JSON.stringify(game.snapshot()),
  before,
  'lighting never writes a saved nighttime flag',
);
console.log(
  'PASS night-specific inhabited windows, cozy lanterns, working fires, wilderness contrast and state purity',
);

// Carried sources follow the real renderer's facing and bobbed foot anchor.
const { createCanvas } = require('@napi-rs/canvas'),
  Renderer = require('../src/prototype/renderer');
for (const night of [false, true])
  for (const side of [-1, 1])
    for (const captain of [false, true]) {
      const c = new Campaign('normal', 'paladin', () => 0.99);
      c.s.party = [];
      c.s.clock = night ? 480 : 120;
      const e = c.makeEnemy(
        { species: 'wraith', name: 'Lantern wraith', level: 2, hp: 100, damage: 1 },
        { x: 1400, y: 1700 },
      );
      if (captain) {
        e.captain = true;
        e.visualScale = 1.3;
      }
      e.aggro = true;
      c.zone().enemies = [e];
      Object.assign(c.hero, { x: e.x + side * 70, y: e.y });
      const canvas = createCanvas(400, 300);
      let lights;
      const renderer = Renderer.create({
        canvas,
        ctx: canvas.getContext('2d'),
        getGame: () => c,
        platform: { cameraZoom: 1, cameraAnchor: () => ({ x: 200, y: 150 }) },
        Campaign,
        PrototypeCombatVisuals: require('../src/prototype/combat-visuals'),
        PrototypeVisuals: {
          ...Visuals,
          atmosphere(ctx, canvas, region, opts) {
            lights = opts.lights;
            Visuals.atmosphere(ctx, canvas, region, opts);
          },
        },
        now: () => 16000,
        chargePresentation: () => null,
        isPaused: () => false,
      });
      renderer.setOptimizationMode(true);
      const draw = () => {
        c.zone(); // Finish authored enemy normalization before the read-only render.
        const before = JSON.stringify(c.snapshot());
        renderer.draw();
        assert.equal(JSON.stringify(c.snapshot()), before);
        return lights.filter((p) => p.kind === 'carried-lantern');
      };
      const [lamp] = draw();
      assert(lamp, 'living Lantern Wraith emits in day and night, including Optimization Mode');
      const anchor = renderer.screen(e),
        scale = captain ? 1.3 : 1;
      assert(
        Math.abs(lamp.x - anchor.x - side * 22.5 * scale) < 0.4,
        'light follows the lantern hand on either facing',
      );
      assert(
        Math.abs(lamp.y - anchor.y - 1.5 * scale) < 1.3,
        'light follows the bobbed carried glass',
      );
      e.x += 20;
      const [moved] = draw();
      assert(Math.abs(moved.x - lamp.x - 15.2) < 0.01, 'light moves with world position');
      e.hp = 0;
      assert.equal(draw().length, 0, 'dead wraith has no orphan light');
      e.hp = 100;
      e.species = 'stalker';
      assert.equal(draw().length, 0, 'unrelated creatures do not gain lamps');
    }
const carried = { id: 'carried', x: 170, y: 120, kind: 'carried-lantern' };
assert.equal(
  probe(false, true, [carried]).radial,
  1,
  'daylight retains only a restrained carried bloom',
);
const glowing = probe(true, true, [carried]);
assert.equal(glowing.radial, 3, 'night has hero visibility plus carried pool and bright glass');
assert.equal(glowing.lanternFrames, 0, 'no second lantern fixture is invented');
console.log(
  'PASS carried Wraith glass/ground illumination: day/night, moving/facing/scaled hand, Optimization Mode, death exclusion and save-pure rendering',
);
