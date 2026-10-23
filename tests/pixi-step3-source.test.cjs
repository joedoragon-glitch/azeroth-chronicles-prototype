'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const { scripts, core } = require('../scripts/site-assets.cjs');
const scriptOrder = (page) =>
  [...read(page).matchAll(/<script src="\.\/([^"]+)"/g)].map((match) => match[1]);

for (const page of ['templates/game.html', 'index.html', 'prototype.html', 'phone.html'])
  assert.deepEqual(scriptOrder(page), scripts, page + ' must follow script inventory');

const sw = read('sw.js');
const manifest = /const APP_FILES = (\[[^\n]*\])/.exec(sw);
assert(manifest, 'Generated service worker must declare its PWA files');
const listed = JSON.parse(manifest[1]);
for (const asset of core) assert(listed.includes('./' + asset), 'Missing offline asset: ' + asset);

const index = (name) => scripts.indexOf(name);
const order = [
  'src/prototype/renderer.js',
  'tools/webgl-pilot/native-webgl2-core.js',
  'tools/webgl-pilot/native-sprite-adapter.js',
  'tools/webgl-pilot/pixi-scene-bridge.js',
  'tools/webgl-pilot/renderer-switch-guard.js',
  'src/prototype/pixi-experimental.js',
  'src/prototype/app.js',
].map(index);
assert(order.every((value, i) => value >= 0 && (i === 0 || value > order[i - 1])),
  'PixiJS dependencies must load before the game starts');

const app = read('src/prototype/app.js');
const pixi = read('src/prototype/pixi-experimental.js');
const canvas = read('src/prototype/renderer.js');
assert(app.includes('pixiGame.noteEvents(events)'), 'Animation events must reach GPU adapter');
assert(pixi.includes('collect(manifest.sprites)'), 'Warm approved sprite manifest before reveal');
assert(pixi.includes('./assets/vendor/pixi-8.22.0.min.js'), 'Use a same-origin PixiJS script');
assert(!pixi.includes('cdn.jsdelivr.net'), 'No third-party runtime dependency');
assert(app.includes('resumeConfirmedWebGL()'), 'Confirmed choice must resume safely');
assert(app.includes('pixiGame.release()'), 'Fallback should release GPU resources');
assert(!pixi.includes('new Campaign('), 'Do not create a parallel game');
assert(canvas.includes("if (renderLayer !== 'background')"), 'Transient telegraphs must not be frozen in GPU terrain');
assert(canvas.includes("if (renderLayer === 'background') return;"));
assert(canvas.includes("renderLayer === 'overlay'"));
console.log('PixiJS Step 3 source and generated-asset contract passed');
