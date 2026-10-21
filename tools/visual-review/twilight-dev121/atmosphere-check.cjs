'use strict';
const fs = require('fs'),
  vm = require('vm'),
  assert = require('assert/strict'),
  cp = require('child_process'),
  { createCanvas } = require('@napi-rs/canvas');
const sources = [
  cp.execFileSync(
    'git',
    [
      'show',
      (process.env.TWILIGHT_BASE_REF || '34b84b3c408aee6569e1cc27579d98a63c31f519') +
        ':src/prototype/visuals.js',
    ],
    { encoding: 'utf8' },
  ),
  fs.readFileSync('src/prototype/visuals.js', 'utf8'),
];
const painters = sources.map((s) => {
  const code = s.slice(s.indexOf('  function atmosphere('), s.indexOf('  function enemyBodyKind('));
  return vm.runInNewContext(code + ';atmosphere', { performance: { now: () => 1000 } });
});
function paint(fn, region, night, daylight, extra = {}) {
  const c = createCanvas(240, 180),
    ctx = c.getContext('2d');
  ctx.fillStyle = '#70826a';
  ctx.fillRect(0, 0, 240, 180);
  ctx.fillStyle = '#9f815a';
  ctx.fillRect(20, 50, 90, 90);
  fn(ctx, c, region, {
    night,
    hero: { x: 100, y: 120 },
    lights: [{ x: 100, y: 100, kind: 'window' }],
    daylight,
    ...extra,
  });
  return ctx.getImageData(0, 0, 240, 180).data;
}
for (let r = 0; r < 5; r++)
  for (const night of [false, true])
    for (const optimized of [false, true]) {
      const base = paint(painters[0], r, night, null, { optimized }),
        now = paint(
          painters[1],
          r,
          night,
          { phase: night ? 'night' : 'day', progress: 1, darkness: night ? 1 : 0, warmth: 0 },
          { optimized },
        );
      assert.deepEqual(now, base, 'original day/night pixels preserved');
      for (const [phase, dark] of [
        ['sunset', night ? 1 : 0],
        ['sunrise', night ? 1 : 0],
      ]) {
        const endpoint = paint(
          painters[1],
          r,
          phase === 'sunrise',
          {
            phase,
            progress: phase === 'sunset' ? (night ? 1 : 0) : night ? 0 : 1,
            darkness: dark,
            warmth: 0,
          },
          { optimized },
        );
        assert.deepEqual(endpoint, base, 'twilight endpoint matches adjacent static lighting');
      }
    }
for (const extra of [{ dungeon: true }, { room: true }])
  assert.deepEqual(
    paint(painters[1], 1, true, { phase: 'sunset', darkness: 0, warmth: 1 }, extra),
    paint(painters[0], 1, true, null, extra),
    'outdoor twilight cannot recolor interiors',
  );
const sunset = paint(painters[1], 0, false, {
    phase: 'sunset',
    progress: 0.5,
    darkness: 0.5,
    warmth: 1,
  }),
  dawn = paint(painters[1], 0, true, { phase: 'sunrise', progress: 0.5, darkness: 0.5, warmth: 1 });
assert.notDeepEqual(sunset, dawn, 'dawn and dusk have distinct palettes');
const early = paint(
  painters[1],
  0,
  true,
  { phase: 'victory-sunrise', progress: 0, darkness: 1, warmth: 0 },
  { peace: true },
);
assert.deepEqual(
  early,
  paint(painters[0], 0, true, null),
  'victory starts without an immediate peace-brightness flash',
);
console.log(
  'PASS exact day/night endpoints across five regions and Optimization Mode, interior isolation, distinct twilight palettes and seamless victory start',
);
