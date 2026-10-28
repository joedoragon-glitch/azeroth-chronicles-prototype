'use strict';
const assert = require('node:assert/strict');
const GroundCache = require('../src/prototype/ground-cache.js');
const { shell } = require('./helpers/production-shell.cjs');

// These are the same public report-export buttons used by a player. No
// developer console, extra diagnostics tool or new menu is required.
for (const language of ['en', 'es']) {
  let clockMs = 0;
  const cache = new GroundCache({
    now: () => clockMs,
    createCanvas: (width, height) => ({
      width,
      height,
      getContext: () => ({ setTransform() {}, fillRect() {} }),
    }),
  });
  const context = {
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    drawImage() {},
  };
  assert.equal(cache.draw(context, {
    width: 393,
    height: 852,
    origin: { x: 0, y: 0 },
    scene: {},
    revision: 'report-test',
    paint() { clockMs += 3.25; },
  }), true);
  assert.equal(cache.status().rebuildMs, 3.25);

  const app = shell(language);
  const { scope, elements } = app;
  const originalMetrics = scope.Prototype.renderer.metrics.bind(scope.Prototype.renderer);
  scope.Prototype.renderer.metrics = () => ({
    ...originalMetrics(),
    groundCache: cache.status(),
  });

  const exported = [];
  scope.Blob = class {
    constructor(parts, options) {
      exported.push({ text: parts.join(''), type: options.type });
    }
  };
  const click = (label) => {
    const button = elements.get('modal-actions').children.find((b) =>
      b.textContent.startsWith(label));
    assert(button, 'Missing menu action: ' + label);
    assert.equal(button.disabled, false);
    button.click();
  };
  elements.get('menu-button').click();
  click(language === 'es' ? 'Juego y ajustes' : 'Game and settings');
  click(language === 'es' ? 'Pantalla y rendimiento' : 'Screen and performance');
  click(language === 'es' ? 'Exportar informe de prueba' : 'Export playtest report');
  assert.equal(exported.length, 1, 'one actual playtest JSON export');
  assert.equal(exported[0].type, 'application/json');
  const report = JSON.parse(exported[0].text);
  assert.equal(report.performance.render.measuredLayer, 'canvas-full-world');
  assert.equal(report.performance.graphicsRenderer.activeRenderer, 'canvas2d');
  assert.deepEqual(
    JSON.parse(JSON.stringify(report.performance.render.groundCache)),
    JSON.parse(JSON.stringify(cache.status())),
    'the ordinary player-facing report must preserve all new Canvas cache metrics',
  );
  for (const key of [
    'builds', 'hits', 'rebuildMs', 'lastRebuildMs', 'maxRebuildMs',
    'failedBuilds', 'budgetSkips', 'transformSkips', 'bytes', 'budget',
  ]) assert.equal(typeof report.performance.render.groundCache[key], 'number', key);
}

console.log('PASS Canvas terrain diagnostics are included in EN/ES player playtest JSON exports');
