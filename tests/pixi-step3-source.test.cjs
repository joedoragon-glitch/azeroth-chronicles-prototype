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
assert(
  order.every((value, i) => value >= 0 && (i === 0 || value > order[i - 1])),
  'PixiJS dependencies must load before the game starts',
);

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
assert(
  canvas.includes("if (renderLayer !== 'background')"),
  'Transient telegraphs must not be frozen in GPU terrain',
);
assert(canvas.includes("if (renderLayer === 'background') return;"));
assert(canvas.includes("renderLayer === 'overlay'"));

assert(pixi.includes('resolution: effectiveRatio()'), 'GPU display resolution must match Canvas');
assert(
  pixi.includes('createBackgroundPainter()'),
  'Background must be rendered at the same density',
);
assert(
  pixi.includes('canvasRenderer.presentEntity'),
  'GPU actors must share Canvas presentation sizing',
);
assert(
  pixi.includes('backingRatio * zoom'),
  'Procedural art must bake at physical display density',
);
assert(
  canvas.includes('presentEntity,'),
  'Canvas must expose its shared asset-safe visual contract',
);
assert(
  canvas.includes('drawPixiNameplates();'),
  'World labels and recruitment cues must remain visible',
);
assert(
  app.includes("document.addEventListener('visibilitychange'"),
  'iOS PWA visibility changes must be handled on document',
);
assert(
  app.includes("addEventListener('pagehide'"),
  'Interrupted PWA trials must be cancelled on pagehide',
);
assert(
  pixi.includes('scene.unregisterTexture(body.id)'),
  'Area transitions must free obsolete Pixi textures',
);
assert(
  pixi
    .replace(/\s+/g, '')
    .includes("backingRatio + ':' + zoom + ':' + key + ':' + current.zoneId".replace(/\s+/g, '')) &&
    pixi.includes('evictUnused(protectedRevisions') &&
    pixi.includes('imageBytes + bytes > proceduralBudget') &&
    !pixi.includes('if (imageBytes > trimAt && !nearActiveFight(current))'),
  'Zoom/density/zone raster identities must retain art until emergency allocation pressure',
);
// Performance instrumentation is presentation-only, not a new FPS policy.
const runtimeSource = read('src/prototype/runtime.js');
assert(app.includes('pixiAttempted: false'), 'Pixi draw samples must be explicitly identified');
assert(app.includes('canvasOverlayDrawn: false'), 'Canvas overlay draws need their own samples');
assert(app.includes('canvasWorldDrawn: false'), 'Canvas-only samples must remain distinct');
assert(
  app.includes('addRenderStageTimes(stageTimes, drawTiming)'),
  'World draw stages must be collected from actual drawing',
);
assert(
  app.includes('addRenderStageTimes(stageTimes, redrawTiming)'),
  'Resolution redraws must not silently lose renderer-stage timing',
);
assert(
  app.includes('measuredLayer:') &&
    app.includes("graphicsController.status().mode === 'webgl2'") &&
    app.includes("'canvas-combat-overlay'") &&
    app.includes("'canvas-full-world'"),
  'Reported Canvas counters must identify their true rendering layer',
);
assert(
  pixi.includes('sceneMetrics: scene?.metrics?.() || null'),
  'Export actual Pixi scene counters, not Canvas overlay substitutes',
);
assert(runtimeSource.includes("['pixiMs', 'pixiAttempted']"));
assert(runtimeSource.includes("['canvasOverlayMs', 'canvasOverlayDrawn']"));
assert(runtimeSource.includes("['canvasWorldMs', 'canvasWorldDrawn']"));
assert(
  runtimeSource.includes('not monitor-presented frames'),
  'Never report synchronous CPU call timings as hardware display FPS',
);
console.log('PixiJS Step 3 source, asset and renderer-profile contract passed');
