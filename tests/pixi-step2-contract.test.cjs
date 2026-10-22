'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const assets = require('../scripts/site-assets.cjs');
const app = read('src/prototype/app.js');
const pixi = read('src/prototype/pixi-experimental.js');
const canvas = read('src/prototype/renderer.js');
assert(assets.scripts.includes('src/prototype/pixi-experimental.js'));
for (const pilot of [
  'tools/webgl-pilot/native-webgl2-core.js',
  'tools/webgl-pilot/native-sprite-adapter.js',
  'tools/webgl-pilot/pixi-scene-bridge.js',
  'tools/webgl-pilot/renderer-switch-guard.js',
]) assert(assets.core.includes(pilot), 'Missing staging asset: '+pilot);
assert(app.includes('graphicsController.requestWebGL()'));
assert(app.includes("renderer.setRenderLayer('overlay')"));
assert(app.includes("renderer.setRenderLayer('full')"));
assert(app.includes('function drawWorld()'));
assert(canvas.includes("renderLayer === 'background'"));
assert(canvas.includes("renderLayer === 'overlay'"));
assert(pixi.includes('getGame()'), 'GPU path must use live Campaign');
assert(pixi.includes('scene.syncActors(records)'));
assert(pixi.includes('syncBackground()'));
assert(!pixi.includes('new Campaign('));
assert(pixi.includes('pixi.js@8.22.0'));
console.log('PixiJS Step 2 source contract passes (not a browser test)');
