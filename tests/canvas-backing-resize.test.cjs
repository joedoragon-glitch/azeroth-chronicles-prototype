'use strict';
const assert = require('node:assert/strict');
const { shell } = require('./helpers/production-shell.cjs');

// A canvas.width or canvas.height assignment clears its pixels even when the
// value is unchanged. Trace the real app resize listener and the player's
// existing exported report, without running or modifying a saved campaign.
for (const language of ['en', 'es']) {
  const app = shell(language);
  const { scope, elements, events } = app;
  const canvas = elements.get('world');
  const game = scope.Prototype.game;
  const baseline = JSON.stringify(game.snapshot());
  const resetWrites = [];
  let width = canvas.width, height = canvas.height, paintedMarker = true;
  Object.defineProperty(canvas, 'width', {
    configurable: true,
    get: () => width,
    set(value) { width = value; paintedMarker = false; resetWrites.push('width'); },
  });
  Object.defineProperty(canvas, 'height', {
    configurable: true,
    get: () => height,
    set(value) { height = value; paintedMarker = false; resetWrites.push('height'); },
  });
  const resize = events.resize?.[0];
  assert.equal(typeof resize, 'function', 'the real window resize listener is registered');
  resize();
  assert.deepEqual(resetWrites, [], 'unchanged resize preserves the existing Canvas bitmap');
  assert.equal(paintedMarker, true, 'preserved image is not blanked');

  scope.innerWidth++;
  resize();
  assert.deepEqual(resetWrites, ['width'], 'only the changed dimension resets the backing');
  assert.equal(paintedMarker, false, 'a genuine dimension change still clears the bitmap');
  assert.equal(width, scope.innerWidth);

  resetWrites.length = 0;
  paintedMarker = true;
  resize();
  assert.deepEqual(resetWrites, [], 'repeat resize after a genuine change is idempotent');
  assert.equal(paintedMarker, true);

  game.s.clock = 580; // A normal-cycle sunrise; no campaign tick or save.
  assert.equal(game.daylightPhase().phase, 'sunrise');
  const snapshotAtSunrise = JSON.stringify(game.snapshot());
  scope.innerHeight += 2;
  resize();
  assert.deepEqual(resetWrites, ['height'], 'height-only changes avoid an extra width reset');
  assert.equal(JSON.stringify(game.snapshot()), snapshotAtSunrise,
    'resize does not mutate the daylight clock or campaign state');

  const exported = [];
  scope.Blob = class {
    constructor(parts, options) { exported.push({ text: parts.join(''), type: options.type }); }
  };
  const click = (en, es) => {
    const label = language === 'es' ? es : en;
    const node = elements.get('modal-actions').children.find(
      (child) => child.textContent.startsWith(label));
    assert(node, 'missing existing menu action ' + label);
    node.click();
  };
  elements.get('menu-button').click();
  click('Game and settings', 'Juego y ajustes');
  click('Screen and performance', 'Pantalla y rendimiento');
  click('Export playtest report', 'Exportar informe de prueba');
  assert.equal(exported.length, 1);
  assert.equal(exported[0].type, 'application/json');
  const report = JSON.parse(exported[0].text);
  assert.equal(report.performance.graphicsRenderer.activeRenderer, 'canvas2d');
  assert.equal(report.performance.canvasBacking.backingResets, 2);
  assert(report.performance.canvasBacking.avoidedResets >= 2);
  assert(report.performance.canvasBacking.resizeRequests >= 4);
  assert.equal(report.performance.canvasBacking.lastReset.width, width);
  assert.equal(report.performance.canvasBacking.lastReset.height, height);
  assert.equal(report.performance.canvasBacking.lastReset.phase, 'sunrise');
  assert.equal(report.performance.canvasBacking.lastReset.clock, 580);
  assert.equal(report.performance.render.groundCache?.budget, 64 * 1024 * 1024,
    'existing Canvas ground-cache diagnostics still export');
  assert.notEqual(baseline, snapshotAtSunrise, 'fixture deliberately changed only its clock');
  assert.equal(JSON.stringify(game.snapshot()), snapshotAtSunrise,
    'export and resize never mutate the saved run');
}
console.log('PASS unchanged Canvas resize preserves pixels; bilingual reports expose actual twilight backing resets');
