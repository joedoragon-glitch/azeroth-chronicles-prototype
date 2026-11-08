'use strict';
const assert = require('node:assert/strict');
const { shell } = require('./helpers/production-shell.cjs');
const Guard = require('../tools/webgl-pilot/renderer-switch-guard.js');
function choose(app, label) {
  const button = app.elements
    .get('modal-actions')
    .children.find((x) => x.textContent.startsWith(label));
  assert(button, 'visible menu action: ' + label);
  button.click();
}
(async () => {
  for (const language of ['en', 'es'])
    for (const hold of ['interrupted-restore', 'repeated-failures']) {
      const storage = new Map([
        [Guard.PREFERENCE_KEY, 'webgl2'],
        [Guard.PRIMARY_DEFAULT_MIGRATION_KEY, 'applied'],
        [Guard.RECOVERY_HOLD_KEY, hold],
      ]);
      const app = shell(language, 'mage', { storage, graphicsGuard: Guard, stayOnTitle: true });
      const panel = app.scope.document.body.children.find((x) => x.id === 'gpu-renderer-trial');
      assert(panel.hidden, 'quarantine prompt must not cover the title');
      const saved = storage.get('azeroth-v4-normal');
      app.elements.get('title-continue').click();
      app.frame(0);
      assert.equal(app.scope.Prototype.started, true);
      assert.equal(panel.hidden, false, 'startup Canvas hold must be explained visibly');
      assert.match(
        panel.children[0].textContent,
        language === 'es' ? /automáticos están pausados/ : /Automatic retries are paused/,
      );
      assert.equal(storage.get(Guard.RECOVERY_HOLD_KEY), hold, 'no silent retry or hold clearing');
      assert.equal(storage.get(Guard.PENDING_KEY), undefined);
      assert.equal(
        storage.get('azeroth-v4-normal'),
        saved,
        'graphics notice never rewrites the campaign',
      );
      let blob;
      app.scope.URL.createObjectURL = (value) => {
        blob = value;
        return 'test-blob';
      };
      app.elements.get('menu-button').click();
      choose(app, language === 'es' ? 'Ajustes' : 'Settings');
      choose(app, language === 'es' ? 'Herramientas de prueba' : 'Playtest tools');
      choose(app, language === 'es' ? 'Exportar informe de prueba' : 'Export playtest report');
      const report = JSON.parse(await blob.text());
      assert.equal(report.performance.graphicsRenderer.activeRenderer, 'canvas2d');
      assert.equal(
        report.performance.graphicsRenderer.startupDecision.reason,
        'confirmed-recovery-quarantined',
      );
      assert.equal(report.performance.graphicsRenderer.recoveryHoldReason, hold);
      assert.equal(
        report.performance.graphicsRenderer.lastFallbackReason,
        'confirmed-recovery-quarantined',
      );
      assert.equal(
        report.performance.graphicsRenderer.firstFailure,
        null,
        'an older unrecorded cause stays unknown',
      );
      assert.equal(report.performance.graphicsRenderer.preferredRenderer, 'webgl2');
      // The explicit safe alternative uses the existing selection path.
      panel.children[2].children[1].click();
      assert.equal(storage.get(Guard.PREFERENCE_KEY), 'canvas2d');
      assert.equal(storage.get(Guard.RECOVERY_HOLD_KEY), undefined);
      assert.equal(panel.hidden, true);
      assert.equal(Guard.startupChoice(app.scope.localStorage).renderer, 'canvas2d');
    }
  for (const successful of [false, true]) {
    let preparedWidth;
    let active = false;
    const storage = new Map([
      [Guard.PREFERENCE_KEY, 'webgl2'],
      [Guard.PRIMARY_DEFAULT_MIGRATION_KEY, 'applied'],
      [Guard.RECOVERY_HOLD_KEY, 'repeated-failures'],
    ]);
    const app = shell('en', 'mage', {
      storage, graphicsGuard: Guard, devicePixelRatio: 1.5,
      pixi: {
        create: ({ worldCanvas }) => ({
          prepare: async () => { preparedWidth = worldCanvas.width; return successful; },
          status: () => ({ active }),
          activate: () => { active = true; },
          deactivate: () => { active = false; },
          noteEvents() {}, draw() {}, release() {},
        }),
      },
    });
    const { renderResolution, game } = app.scope.Prototype;
    for (let i = 0; i <= 140; i++) renderResolution.observe(i * 50, 62, 20, 4);
    assert(renderResolution.ratio < 1.5);
    app.events.resize[0]();
    const canvas = app.elements.get('world');
    const previousWidth = canvas.width;
    const saved = JSON.stringify(game.snapshot());
    const panel = app.scope.document.body.children.find((x) => x.id === 'gpu-renderer-trial');
    await panel.children[2].children[0].onclick();
    assert.equal(preparedWidth, Math.round(393 * 1.5));
    assert.equal(active, successful);
    if (successful) panel.children[2].children[1].onclick();
    assert.equal(canvas.width, previousWidth, 'fallback restores Canvas relief');
    assert.equal(JSON.stringify(game.snapshot()), saved);
  }
  console.log(
    'PASS EN/ES quarantined Continue, visible reason, real JSON export, save integrity and explicit Canvas',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
