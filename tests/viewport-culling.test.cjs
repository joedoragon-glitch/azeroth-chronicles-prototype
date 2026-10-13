'use strict';
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Visuals = require('../src/prototype/visuals.js');
const Rules = require('../src/prototype/rules.js');

// The new caller supplies the unzoomed viewport. A direct legacy caller
// remains the comparison oracle; all pixels inside the viewport must match.
function image(region, anchor, scale, clipped) {
  const surface = createCanvas(640, 400);
  const ctx = surface.getContext('2d');
  ctx.scale(scale, scale);
  const viewport = { width: 640 / scale, height: 400 / scale };
  const center = {
    x: (anchor.x - anchor.y) * 0.76,
    y: (anchor.x + anchor.y) * 0.27,
  };
  const screen = (p) => ({
    x: (p.x - p.y) * 0.76 - center.x + viewport.width / 2,
    y: (p.x + p.y) * 0.27 - center.y + viewport.height / 2,
  });
  const game = new Campaign();
  game.enter(Campaign.data.regions[region].id);
  const view = clipped ? viewport : undefined;
  Visuals.terrain(ctx, screen, region, game.zoneSize(), null, view);
  Visuals.roads(ctx, game.zone().roads || [], screen, region, null, view);
  Visuals.bridges(ctx, screen, region, null, view);
  return Buffer.from(ctx.getImageData(0, 0, 640, 400).data);
}
let compared = 0;
for (let region = 0; region < 5; region++) {
  const town = Campaign.data.towns[region];
  const { bounds, gaps } = Rules.barriers[region];
  const cameras = [
    { x: town[0], y: town[1] },
    { x: (bounds[0] + bounds[1]) / 2, y: (gaps[0][0] + gaps[0][1]) / 2 },
    { x: 320, y: 320 },
  ];
  for (const scale of [1, 1.5, 1.75]) {
    for (const anchor of cameras) {
      assert.deepEqual(
        image(region, anchor, scale, true),
        image(region, anchor, scale, false),
        'Visible pixels: region ' + region + ', scale ' + scale + ', camera ' + JSON.stringify(anchor),
      );
      compared++;
    }
  }
}

// A distant camera must not submit paint paths for invisible roads or decks.
function paintCalls(clipped) {
  let calls = 0;
  const ctx = new Proxy(
    { canvas: { width: 1280, height: 800 } },
    {
      get(target, key) {
        if (key in target) return target[key];
        return () => {
          if (key === 'fill' || key === 'stroke') calls++;
        };
      },
      set(target, key, value) {
        target[key] = value;
        return true;
      },
    },
  );
  const game = new Campaign();
  game.enter('vale');
  const screen = (p) => ({ x: (p.x - p.y) * 0.76 + 50000, y: (p.x + p.y) * 0.27 + 50000 });
  const viewport = clipped ? { width: 800, height: 533 } : undefined;
  Visuals.roads(ctx, game.zone().roads || [], screen, 0, null, viewport);
  Visuals.bridges(ctx, screen, 0, null, viewport);
  return calls;
}
assert(paintCalls(false) > 0, 'Unculled roads and bridges issue paint commands');
assert.equal(paintCalls(true), 0, 'Fully off-screen roads and bridges issue none');
console.log('PASS ' + compared + ' exact terrain/roads/bridges raster comparisons and off-screen culling');
