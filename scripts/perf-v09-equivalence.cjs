'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto'),
  zlib = require('node:zlib');
const baseline = path.resolve(process.argv[2] || ''),
  current = path.resolve(__dirname, '..');
assert(process.argv[2], 'Provide untouched c6ce1af baseline checkout');
const load = (root, name) => require(path.join(root, 'src/prototype', name + '.js'));
const A = load(baseline, 'engine'),
  B = load(current, 'engine');
const rng = () => {
  let state = 73129;
  return () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296;
};
const json = (x) => JSON.parse(JSON.stringify(x));
const live = (c) => json({ ...c, snapshot: c.snapshot() });
const hash = (x) =>
  crypto
    .createHash('sha256')
    .update(Buffer.isBuffer(x) ? x : JSON.stringify(x))
    .digest('hex');
const evidence = {
  baseline: 'c6ce1af236bddd7ca881903499c4cf5de175f9e2',
  scenarios: [],
  historical: [],
  scenes: [],
};
for (const mode of ['normal', 'nightmare'])
  for (const cls of ['paladin', 'mage', 'ranger'])
    for (const succession of [false, true]) {
      const a = new A(mode, cls, rng(), { succession }),
        b = new B(mode, cls, rng(), { succession });
      const compare = (label) =>
        assert.deepEqual(live(b), live(a), `${mode}/${cls}/${succession}/${label}`);
      compare('fresh');
      for (const c of [a, b]) {
        c.enter('crypt');
        c.s.mercyTime = 0;
        c.hero.skills = Array(8).fill(1);
        c.hero.hp = c.hero.maxHp = 100000;
        c.hero.immune = 0;
        Object.assign(c.hero, c.safe(500, 500));
        c.zone().enemies = [];
        for (let i = 0; i < 4; i++) {
          const e = c.makeEnemy(
            {
              species: i % 2 ? 'archer' : 'goblin',
              name: 'Equivalence target ' + i,
              level: 8,
              hp: 10000,
              damage: 10,
              gold: 1,
              xp: 1,
            },
            c.safe(555 + i * 30, 530),
          );
          c.configureEnemy(e, i);
          c.zone().enemies.push(e);
          c.engage(e, true, false);
        }
        for (const u of c.s.party) Object.assign(u, c.safe(480, 490));
      }
      compare('engaged');
      for (let i = 0; i < 240; i++) {
        const input = { x: i % 60 < 30 ? 0.4 : -0.4, y: i % 80 < 40 ? 0.2 : -0.2 };
        for (const c of [a, b]) {
          if (i % 20 === 0) c.cast(1 + ((i / 20) % 8), null, i % 40 === 0);
          c.tick([0.016, 0.033, 0.05][i % 3], input);
        }
        compare('frame-' + i);
      }
      assert.deepEqual(
        live(B.restore(b.snapshot(), rng())),
        live(A.restore(a.snapshot(), rng())),
        'save roundtrip',
      );
      evidence.scenarios.push({
        mode,
        cls,
        succession,
        frames: 240,
        finalHash: hash(live(b)),
        events: b.s.statistics.events.length,
      });
    }
for (const file of fs
  .readdirSync(path.join(current, 'tests/fixtures/beta-history'))
  .filter((f) => f.endsWith('.gz'))) {
  const original = zlib.gunzipSync(
      fs.readFileSync(path.join(current, 'tests/fixtures/beta-history', file)),
    ),
    data = JSON.parse(original),
    saved = JSON.stringify(data);
  const a = A.restore(data, rng()),
    b = B.restore(data, rng());
  assert.equal(JSON.stringify(data), saved, 'historical source immutable');
  assert.deepEqual(live(b), live(a), file + ' restore');
  for (let i = 0; i < 20; i++) {
    a.tick(0.05, { x: 0, y: 0 });
    b.tick(0.05, { x: 0, y: 0 });
  }
  assert.deepEqual(live(b), live(a), file + ' continued simulation');
  evidence.historical.push({ file, sourceHash: hash(original), restoredHash: hash(live(b)) });
}
Object.defineProperty(globalThis, 'performance', {
  value: { now: () => 16000 },
  configurable: true,
});
const { createCanvas } = require('@napi-rs/canvas');
for (const zone of [...A.data.regions.map((r) => r.id), ...A.dungeonIds])
  for (const [width, height, zoom] of [
    [1280, 800, 1.5],
    [375, 800, 1.5],
  ])
    for (const clock of [200, 600]) {
      const draw = (root) => {
        const C = load(root, 'engine'),
          c = new C('normal', 'paladin', rng());
        c.enter(zone);
        c.s.clock = clock;
        Object.assign(c.hero, c.safe(800, 800));
        const before = JSON.stringify(live(c));
        const canvas = createCanvas(width, height),
          ctx = canvas.getContext('2d');
        const renderer = load(root, 'renderer').create({
          getGame: () => c,
          canvas: { width, height },
          ctx,
          platform: { cameraZoom: zoom, cameraAnchor: () => ({ x: width * 0.6, y: height * 0.5 }) },
          Campaign: C,
          PrototypeVisuals: load(root, 'visuals'),
          PrototypeCombatVisuals: load(root, 'combat-visuals'),
          now: () => 16000,
          chargePresentation: () => null,
          isPaused: () => false,
        });
        renderer.draw();
        renderer.draw();
        assert.equal(JSON.stringify(live(c)), before, 'drawing may not mutate gameplay');
        const pixels = Buffer.from(ctx.getImageData(0, 0, width, height).data);
        canvas.width = canvas.height = 1;
        return pixels;
      };
      const a = draw(baseline),
        b = draw(current);
      assert(a.equals(b), zone + ' native full-render pixels ' + width + '/' + clock);
      global.gc?.();
      evidence.scenes.push({ zone, width, height, zoom, clock, pixelHash: hash(b) });
    }
fs.mkdirSync(path.join(current, 'test-results/perf'), { recursive: true });
fs.writeFileSync(
  path.join(current, 'test-results/perf/combined-equivalence.json'),
  JSON.stringify(evidence, null, 2) + '\n',
);
console.log(
  `PASS ${evidence.scenarios.length * 240} paired simulation frames, ${evidence.historical.length} historical saves, ${evidence.scenes.length} exact full-render images`,
);
