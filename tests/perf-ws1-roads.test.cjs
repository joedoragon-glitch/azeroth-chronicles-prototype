'use strict';
const assert = require('node:assert/strict'),
  { createCanvas } = require('@napi-rs/canvas'),
  Campaign = require('../src/prototype/engine.js'),
  Rules = require('../src/prototype/rules.js'),
  Visuals = require('../src/prototype/visuals.js'),
  baseline = require('./helpers/perf-ws1-roads-baseline.cjs');
function trace(draw, paths, region, shift = 0) {
  const calls = [],
    target = {};
  const context = new Proxy(target, {
    set(o, key, value) {
      calls.push(['set', key, value]);
      o[key] = value;
      return true;
    },
    get(o, key) {
      return key in o ? o[key] : (...args) => calls.push([key, ...args]);
    },
  });
  const material = {
    paint(ctx, key, screen, points) {
      calls.push(['material', key, points.map((p) => [p.x, p.y]), points.map(screen)]);
    },
  };
  draw(
    context,
    paths,
    (p) => ({ x: shift + (p.x - p.y) * 0.76, y: (p.x + p.y) * 0.27 }),
    region,
    material,
  );
  return calls;
}
function compare(paths, region, label) {
  for (const shift of [0, 24.25])
    assert.deepEqual(
      trace(Visuals.roads, paths, region, shift),
      trace(baseline, paths, region, shift),
      label,
    );
}
let scenes = 0;
for (const [region, data] of Campaign.data.regions.entries()) {
  const campaign = new Campaign();
  campaign.enter(data.id);
  const paths = campaign.zone().roads,
    before = JSON.stringify(campaign.snapshot());
  compare(paths, region, data.id);
  for (const scale of [1, 1.5, 2.25, 3.5]) {
    const render = (draw) => {
      const canvas = createCanvas(540, 320),
        ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      draw(
        ctx,
        paths,
        (p) => ({ x: 270 / scale + (p.x - p.y) * 0.1, y: -30 + (p.x + p.y) * 0.035 }),
        region,
      );
      return Buffer.from(ctx.getImageData(0, 0, 540, 320).data);
    };
    assert.deepEqual(
      render(Visuals.roads),
      render(baseline),
      data.id + ' exact raster scale ' + scale,
    );
  }
  assert.equal(
    JSON.stringify(campaign.snapshot()),
    before,
    data.id + ' draw leaves state unchanged',
  );
  scenes++;
}
const paths = [
  [
    { x: 300, y: 800 },
    { x: 850, y: 800 },
    { x: 850, y: 800 },
  ],
  [
    { x: 850, y: 800 },
    { x: 300, y: 800 },
  ],
];
compare(paths, 0, 'duplicate and zero-length edges');
paths[0][0].x += 2.25;
compare(paths, 0, 'in-place coordinate change');
paths[0].push({ x: 1500, y: 1200 });
compare(paths, 0, 'path grows');
paths.push([
  { x: 1500, y: 1200 },
  { x: 1500, y: 900 },
]);
compare(paths, 0, 'topology grows');
paths[0].reverse();
compare(paths, 0, 'direction changes');
paths.shift();
compare(paths, 0, 'path removed');
const bridge = Rules.barriers[0],
  oldBounds = bridge.bounds.slice(),
  oldGaps = bridge.gaps.map((g) => g.slice());
try {
  bridge.bounds[0] = 1400;
  bridge.bounds[1] = 1600;
  bridge.gaps.splice(0, bridge.gaps.length, [0, 2000]);
  compare(paths, 0, 'bridge geometry mutates');
  bridge.gaps[0][0] = 1800;
  compare(paths, 0, 'bridge gap changes in place');
} finally {
  bridge.bounds.splice(0, bridge.bounds.length, ...oldBounds);
  bridge.gaps.splice(0, bridge.gaps.length, ...oldGaps);
}
compare([], 0, 'empty roads');
compare(paths, 4, 'region changes');
compare(paths, 0, 'region returns');
console.log(
  'PASS WS1 exact baseline Canvas/material traces, 20 native raster comparisons, mutable-road/bridge invalidation and ' +
    scenes +
    ' unchanged campaign snapshots',
);
