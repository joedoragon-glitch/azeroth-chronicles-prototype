'use strict';
const assert = require('node:assert/strict');
const { shell } = require('./helpers/production-shell.cjs');

(async () => {
  for (const language of ['en', 'es']) {
    const app = shell(language);
    const { scope, elements } = app;
    let exported = null;
    scope.URL.createObjectURL = (blob) => { exported = blob; return 'blob:diagnostic-test'; };
    const label = (en, es) => language === 'es' ? es : en;
    const actions = () => elements.get('modal-actions').children;
    const click = (text) => {
      const entry = actions().find((item) => item.textContent.startsWith(text));
      assert(entry && !entry.disabled, 'Missing usable action: ' + text);
      entry.click();
    };
    const openPerformance = () => {
      elements.get('menu-button').click();
      click(label('Game and settings', 'Juego y ajustes'));
      click(label('Screen and performance', 'Pantalla y rendimiento'));
    };
    openPerformance();
    assert(actions().some((item) => item.textContent.startsWith(
      label('Export playtest report', 'Exportar informe de prueba'))));
    click(label('Show performance details', 'Mostrar detalles de rendimiento'));
    click(label('Start renderer profiling', 'Iniciar registro del renderizador'));
    assert(actions().some((item) => item.textContent.startsWith(
      label('Stop renderer profiling', 'Detener registro del renderizador'))));
    for (let i = 0; i < 5 && !elements.get('modal').hidden; i++)
      elements.get('close-button').click();
    assert(elements.get('modal').hidden, 'player can return to gameplay with recording active');
    for (const now of [20, 40, 110, 185, 225, 275, 355, 375])
      app.frame(now);
    openPerformance();
    click(label('Stop renderer profiling', 'Detener registro del renderizador'));
    click(label('Export playtest report', 'Exportar informe de prueba'));
    assert(exported, 'the player receives the standard local JSON download');
    const report = JSON.parse(await exported.text());
    assert(report.version, 'export retains the original version field');
    assert(report.performance.frameProfile, 'export retains standard frame profiling');
    assert(report.performance.graphicsRenderer, 'export retains renderer status');
    const capture = report.performance.rendererDiagnostics;
    assert.equal(capture.state, 'stopped');
    assert.equal(capture.initialRenderer, 'canvas2d');
    assert.equal(capture.finalRenderer, 'canvas2d');
    assert(capture.frames > 0, 'only active gameplay frames are counted');
    assert(capture.slowFrames > 0, 'long callback intervals are captured');
    assert(capture.worstFrames.length <= 32, 'slow-frame capture stays bounded');
    assert(capture.counterDeltas && typeof capture.counterDeltas === 'object');
    assert(!Object.prototype.hasOwnProperty.call(capture, 'campaign'),
      'diagnostic data never embeds game state');
    click(label('Clear renderer profiling', 'Borrar registro del renderizador'));
    click(label('Export playtest report', 'Exportar informe de prueba'));
    const cleared = JSON.parse(await exported.text());
    assert.equal(cleared.performance.rendererDiagnostics.state, 'not-recorded',
      'ordinary playtest export works without optional capture');
  }
  console.log('Playtest export and optional renderer diagnostics pass in EN/ES.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
