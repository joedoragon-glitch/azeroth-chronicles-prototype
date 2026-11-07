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
      choose(app, language === 'es' ? 'Juego y ajustes' : 'Game and settings');
      choose(app, language === 'es' ? 'Pantalla y rendimiento' : 'Screen and performance');
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
  console.log(
    'PASS EN/ES quarantined Continue, visible reason, real JSON export, save integrity and explicit Canvas',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
