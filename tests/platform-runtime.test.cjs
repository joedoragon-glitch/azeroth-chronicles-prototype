'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine'),
  P = require('../src/prototype/platform'),
  Store = require('../src/prototype/persistence'),
  Runtime = require('../src/prototype/runtime'),
  Renderer = require('../src/prototype/renderer');
for (const [caps, expected] of [
  [{ fine: true, coarse: true }, 'desktop'],
  [{ fine: true, coarse: false }, 'desktop'],
  [{ fine: false, coarse: true }, 'phone'],
  [{ fine: false, coarse: false }, 'desktop'],
  [{ requested: 'phone', fine: true }, 'phone'],
  [{ requested: 'desktop', coarse: true }, 'desktop'],
])
  assert.equal(P.resolve(caps), expected);
const items = new Map(),
  attributes = new Map(),
  queries = new Map();
let changed = 0;
const env = {
  localStorage: { getItem: (k) => items.get(k), setItem: (k, v) => items.set(k, v) },
  location: { search: '' },
  document: { body: { setAttribute: (k, v) => attributes.set(k, v), getAttribute: () => null } },
  matchMedia: (q) => ({ matches: true, addEventListener: (name, fn) => queries.set(q, fn) }),
};
const platform = P.init(env);
assert.equal(platform.mode, 'desktop', 'Hybrid touchscreen laptop chooses desktop');
platform.onChange(() => changed++);
platform.select('phone');
assert.equal(attributes.get('data-experience'), 'phone');
assert.equal(items.get(P.preferenceKey), 'phone');
assert(changed);
platform.select('auto');
assert.equal(platform.mode, 'desktop');
assert(platform.cameraAnchor(1280, 800).x < 640, 'Camera centers unobstructed desktop play space');
env.location.search = '?experience=desktop';
assert.equal(P.init(env).mode, 'desktop');
env.location.search = '';
env.document.body.getAttribute = () => 'phone';
assert.equal(P.init(env).mode, 'phone', 'Dedicated installed entry opens phone presentation');
items.set(P.preferenceKey, 'desktop');
assert.equal(
  P.init(env).mode,
  'desktop',
  'An explicit saved choice survives relaunching the installed entry',
);
items.set(P.preferenceKey, 'auto');
const previousChanges = changed;
platform.select('auto');
assert.equal(changed, previousChanges, 'Unchanged capabilities do not reset gameplay input');
console.log(
  'PASS phone, desktop, hybrid Chromebook, explicit entry and persistent screen preferences',
);

// Presentation preferences are separate from campaign saves and from each other.
assert.equal(P.defaultCameraZoom, 1.5);
assert.equal(platform.cameraZoom, 1.5, 'Desktop starts at selected 150% framing');
const comparison = JSON.stringify({ desktop: 1, phone: 1.75 });
items.set('azeroth-camera-v1', comparison);
assert.equal(
  P.init(env).cameraZoom,
  1.5,
  'Old comparison choices do not override finalized framing',
);
assert.equal(
  items.get('azeroth-camera-v1'),
  comparison,
  'Comparison preference is retained for rollback',
);
platform.selectCameraZoom(1);
assert.equal(platform.cameraZoom, 1);
assert.equal(P.init(env).cameraZoom, 1.5, 'Phone defaults to 150% independently');
platform.select('phone');
platform.selectCameraZoom(1.75);
assert.equal(platform.cameraZoom, 1.75);
platform.selectCameraZoom(3);
assert.equal(platform.cameraZoom, 1.75, 'Unsupported camera scales cannot leak into rendering');
assert.equal(P.init(env).cameraZoom, 1.75, 'Camera choice survives reload');
platform.select('desktop');
assert.equal(platform.cameraZoom, 1, 'Desktop retains its independent camera choice');
items.set(P.cameraPreferenceKey, '{broken');
assert.equal(
  P.init(env).cameraZoom,
  1.5,
  'Malformed camera preference returns to selected default',
);
console.log('PASS independent desktop/phone camera preferences, reload and invalid-data fallback');

const messages = [],
  storage = { getItem: (k) => items.get(k), setItem: (k, v) => items.set(k, v) },
  store = Store.create({ storage, Campaign: C, status: (s) => messages.push(s) }),
  game = new C('normal', 'mage', () => 0.9),
  profile = { activeMode: 'normal', nightmareUnlocked: false, audio: {} };
game.hero.gold = 317;
store.save(game, profile);
const restored = store.load('normal');
assert.equal(restored.hero.gold, 317);
assert.deepEqual(restored.snapshot(), game.snapshot(), 'v4 snapshot and state remain compatible');
assert(store.exists('normal'));
assert(!store.exists('nightmare'));
items.set(Store.saveKey('nightmare'), '{broken');
assert.equal(store.load('nightmare'), null);
assert(messages.at(-1).includes('Import a backup'));
assert.equal(items.get(Store.saveKey('nightmare')), '{broken', 'Corrupt original is retained');
const blocked = Store.create({
  storage: {
    getItem: () => null,
    setItem() {
      throw Error('quota');
    },
  },
  Campaign: C,
  status: (s) => messages.push(s),
});
assert.equal(blocked.save(game, profile), false);
assert(messages.at(-1).includes('Export'));
assert.equal(blocked.migrateLegacy(), null);
items.set('azeroth-v2-original-backup', 'older original');
items.set('azeroth-chronicles-prototype-save-v2', '{broken');
assert.equal(store.migrateLegacy(), null);
assert.equal(items.get('azeroth-v2-original-backup'), 'older original');
console.log(
  'PASS platform-independent v4 saves, independent modes, corrupt-save retention and storage failures',
);

let clock = 0,
  draws = 0;
const runtime = Runtime.create(() => clock);
for (let i = 0; i < 240; i++) {
  clock = i * 16 + 3;
  runtime.record(i * 16, i * 16, () => draws++);
}
const report = runtime.report({}, 'phone');
assert.equal(report.sampleFrames, 180);
assert.equal(report.workP95Ms, 3);
assert.equal(report.fps, 63);
assert.equal(draws, 240);
assert(runtime.shouldDrawIdle(0));
assert(!runtime.shouldDrawIdle(100));
assert(runtime.shouldDrawIdle(250));
runtime.suspend();
clock = 10000;
runtime.record(10000, 9997, () => {});
assert.equal(
  runtime.report().fps,
  63,
  'A paused interval does not pollute active frame measurements',
);
runtime.reset();
assert.equal(runtime.report().sampleFrames, 0);
console.log('PASS bounded performance samples, active-time accounting and idle redraw limit');

// Compare candidate bounds with a full-grid oracle, including map edges and phone dimensions.
for (const [width, height] of [
  [320, 568],
  [375, 812],
  [844, 390],
  [1280, 800],
])
  for (const hero of [
    { x: 50, y: 50 },
    { x: 1700, y: 1700 },
    { x: 3300, y: 3300 },
  ])
    for (const scale of P.cameraScales) {
      const g = { hero },
        renderer = Renderer.create({
          canvas: { width, height },
          ctx: {},
          getGame: () => g,
          platform: {
            cameraZoom: scale,
            cameraAnchor: () => ({ x: width * 0.5, y: height * 0.5 }),
          },
          Campaign: C,
          PrototypeVisuals: {},
          PrototypeCombatVisuals: {},
          chargePresentation: () => null,
          isPaused: () => false,
        }),
        bounds = renderer.tileBounds(3400);
      let full = 0,
        candidates = 0,
        visible = 0;
      for (let x = 0; x < 3400; x += 80)
        for (let y = 0; y < 3400; y += 80) {
          full++;
          const p = renderer.screen({ x, y });
          const roundTrip = renderer.world(p.x, p.y);
          assert(
            Math.abs(roundTrip.x - x) < 1e-8 && Math.abs(roundTrip.y - y) < 1e-8,
            'Pointer inversion matches projection at every zoom',
          );
          if (
            p.x >= -160 * scale &&
            p.x <= width + 160 * scale &&
            p.y >= -100 * scale &&
            p.y <= height + 100 * scale
          ) {
            visible++;
            assert(
              x >= bounds.x1 && x <= bounds.x2 && y >= bounds.y1 && y <= bounds.y2,
              'Bounds preserve every original visible floor tile',
            );
          }
        }
      for (let x = bounds.x1; x <= bounds.x2; x += 80)
        for (let y = bounds.y1; y <= bounds.y2; y += 80) candidates++;
      assert(candidates <= full);
      if (width < 400)
        assert(candidates < full * 0.7, 'Phone bounds avoid scanning most of the full map');
      assert(visible > 0);
      const anchor = renderer.screen(hero);
      assert(
        Math.abs(anchor.x - width * 0.5) < 1e-8 && Math.abs(anchor.y - height * 0.5) < 1e-8,
        'Hero anchor stays fixed',
      );
    }
console.log('PASS viewport floor bounds preserve visible coverage while reducing full-map scans');
