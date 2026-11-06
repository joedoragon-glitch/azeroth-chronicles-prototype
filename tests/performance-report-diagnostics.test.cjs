'use strict';
const assert = require('node:assert/strict');
const { shell } = require('./helpers/production-shell.cjs');

(async () => {
  for (const language of ['en', 'es']) {
    let clock = 0;
    const app = shell(language, 'paladin', { now: () => clock });
    const { scope, elements } = app;
    // Simulate the metadata stamped into the actual deployable build.
    const simulatedBuildCommit = 'a'.repeat(40);
    scope.PrototypeBuild = Object.freeze({
      version: scope.PrototypeBuild.version,
      commit: simulatedBuildCommit,
    });
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
    for (const now of [20, 40, 110, 185, 225, 275, 355, 375, 550])
      app.frame(now);
    // Exercise the real app resize callback while the opt-in recorder runs.
    // A backing reset must carry cause, ratios and timing in an ordered event.
    scope.innerWidth = 411;
    for (const callback of app.events.resize || []) callback();
    // One >650ms callback must activate the real existing emergency guard
    // before the graphics Auto override, followed by an actual resize request.
    app.frame(1300);
    // Regression: the exact player-reported interruption MUST NOT stop the
    // opt-in recorder. Both a hidden-document return and a deliberate menu
    // return are nonterminal boundaries for the playtest evidence.
    scope.document.hidden = true;
    for (const fn of app.documentEvents.visibilitychange || []) fn();
    assert.equal(scope.Prototype.started, true, 'short hidden interval freezes play without title');
    assert.equal(elements.get('title-screen').hidden, true);
    assert.equal(JSON.parse(app.storage.get('sibdlp-playtest-diagnostics-v1')).active, true,
      'background interruption checkpoints the live renderer capture');
    clock = 3200;
    scope.document.hidden = false;
    for (const fn of app.documentEvents.visibilitychange || []) fn();
    elements.get('title-continue').click();
    app.frame(1330);
    assert.equal(scope.Prototype.started, true, 'Continue resumes the campaign');
    elements.get('menu-button').click();
    click(label('Return to Main Menu', 'Volver al menú principal'));
    assert.equal(scope.Prototype.started, false, 'manual title is also a nonterminal boundary');
    elements.get('title-continue').click();
    app.frame(1360);
    openPerformance();
    click(label('Stop renderer profiling', 'Detener registro del renderizador'));
    click(label('Export playtest report', 'Exportar informe de prueba'));
    assert(exported, 'the player receives the standard local JSON download');
    const report = JSON.parse(await exported.text());
    assert(report.version, 'export retains the original version field');
    assert.equal(report.buildCommit, simulatedBuildCommit,
      'EN/ES report exports the exact loaded packaged build SHA');
    assert(report.performance.frameProfile, 'export retains standard frame profiling');
    const slowdowns = report.performance.frameProfile.slowdownIncidents;
    assert(slowdowns, 'ordinary export automatically includes exceptional callbacks');
    assert(slowdowns.records.length >= 1,
      'slow callback location is recorded without starting optional renderer profiling');
    assert.equal(slowdowns.records.at(-1).location.zone, 'vale');
    assert(Number.isFinite(slowdowns.records.at(-1).location.heroX));
    assert(Number.isFinite(slowdowns.records.at(-1).location.gridX));
    assert(slowdowns.records.at(-1).location.nearbyEnemyKinds);
    assert(slowdowns.records.some((incident) => incident.previous),
      'bounded incident ledger retains prior-frame context even after emergency resets short samples');
    assert(!('campaign' in slowdowns.records.at(-1)),
      'slowdown capture is bounded context, not a copied save');
    assert(report.performance.graphicsRenderer, 'export retains renderer status');
    const capture = report.performance.rendererDiagnostics;
    assert.equal(capture.state, 'stopped');
    const continuity = report.performance.diagnosticContinuity;
    assert(continuity.events.some((row) =>
      row.kind === 'return-to-title' && row.reason === 'document-hidden-sustained'));
    assert(continuity.events.some((row) =>
      row.kind === 'background-return-classified' && row.decision === 'guarded-continue'));
    assert.equal(typeof continuity.documentId, 'string');
    assert(continuity.events.some((row) =>
      row.kind === 'document-start' && row.documentId === continuity.documentId));
    assert(continuity.events.some((row) =>
      row.kind === 'return-to-title' && row.reason === 'manual-menu'));
    assert(continuity.priorFrameProfiles.some((entry) => entry.runtimeWindow &&
      Number.isFinite(entry.runtimeWindow.sampledWindowMs)),
      'pre-title rolling runtime performance survives Continue reset');
    assert.equal(capture.initialRenderer, 'canvas2d');
    assert.equal(capture.finalRenderer, 'canvas2d');
    assert.equal(capture.version, undefined, 'existing report shape has no public schema version');
    assert(Array.isArray(capture.graphicsTransitions));
    assert(capture.graphicsTransitions.length <= 48, 'graphics event chronology is bounded');
    assert.equal(capture.droppedGraphicsTransitions, 0);
    const resized = capture.graphicsTransitions.find(
      (event) => event.type === 'canvas-backing-resize' && event.reset,
    );
    assert(resized, 'opt-in recording captures actual Canvas backing resets');
    assert.equal(resized.reason, 'external-or-settings');
    assert.equal(resized.before.viewportWidth, 393);
    assert.equal(resized.after.viewportWidth, 411);
    assert(resized.durationMs >= 0);
    assert(Number.isFinite(resized.elapsedMs));
    assert(Number.isFinite(capture.initialGraphics.backingRatio));
    assert(Number.isFinite(capture.finalGraphics.backingRatio));
    const events = capture.graphicsTransitions;
    const enteredAt = events.findIndex((event) => event.type === 'emergency-enter-before-draw');
    const optimizedAt = events.findIndex((event) =>
      event.type === 'optimization-change' && event.reason === 'emergency');
    const emergencyResizeAt = events.findIndex((event) =>
      event.type === 'canvas-backing-resize' && event.reason === 'emergency-optimization');
    assert(enteredAt >= 0, 'critical callback enters emergency ahead of renderer work');
    assert(optimizedAt > enteredAt, 'emergency optimizer fires after the guard');
    assert(emergencyResizeAt > optimizedAt,
      'backing reset request is caused by recovery policy, not the earlier stall');
    assert.equal(events[optimizedAt].frameId, events[enteredAt].frameId);
    assert.equal(events[emergencyResizeAt].frameId, events[enteredAt].frameId);
    assert(capture.frames > 0, 'only active gameplay frames are counted');
    assert(capture.slowFrames > 0, 'long callback intervals are captured');
    assert(capture.worstFrames.length <= 32, 'slow-frame capture stays bounded');
    assert(capture.worstFrames.every((row) => Array.isArray(row.pixiDraws) &&
      row.pixiDraws.length <= 2 && Array.isArray(row.graphicsTransitions)),
      'every retained slow callback has bounded correlation fields');
    assert.equal(capture.histograms.frameWork.reduce((a, b) => a + b, 0),
      capture.frames, 'all captured work frames contribute to bounded percentiles');
    assert.equal(capture.histograms.callbackInterval.reduce((a, b) => a + b, 0),
      capture.frames, 'all captured callback intervals contribute to bounded percentiles');
    assert(capture.approximatePercentiles.frameWork.p95UpperMs !== undefined);
    assert(capture.approximatePercentiles.callbackInterval.p99UpperMs !== undefined);
    assert(Array.isArray(capture.counterResetKeys));
    assert(capture.counterDeltas && typeof capture.counterDeltas === 'object');
    assert(!Object.prototype.hasOwnProperty.call(capture, 'campaign'),
      'diagnostic data never embeds game state');
    click(label('Clear renderer profiling', 'Borrar registro del renderizador'));
    click(label('Export playtest report', 'Exportar informe de prueba'));
    const cleared = JSON.parse(await exported.text());
    assert(cleared.performance.frameProfile.slowdownIncidents.records.length >= 1,
      'clearing optional renderer capture does not erase independent slowdown evidence');
    assert.equal(cleared.performance.rendererDiagnostics.state, 'not-recorded',
      'ordinary playtest export works without optional capture');

    // A full document restart must retain a prior-clock segment and re-arm
    // the opted-in capture. This is separate from v4 campaign serialization.
    click(label('Start renderer profiling', 'Iniciar registro del renderizador'));
    for (let i = 0; i < 5 && !elements.get('modal').hidden; i++)
      elements.get('close-button').click();
    app.frame(1800);
    for (const fn of app.events.pagehide || []) fn();
    const savedBeforeRestart = app.storage.get('azeroth-v4-normal');
    const reopened = shell(language, 'paladin', { storage: app.storage, stayOnTitle: true });
    assert.equal(app.storage.get('azeroth-v4-normal'), savedBeforeRestart,
      'diagnostic restoration does not write or migrate campaign saves');
    let restoredExport = null;
    reopened.scope.URL.createObjectURL = (blob) => {
      restoredExport = blob; return 'blob:diagnostic-continuity';
    };
    reopened.elements.get('title-settings').click();
    const settingsActions = () => reopened.elements.get('modal-actions').children;
    const settingsClick = (labelText) => {
      const entry = settingsActions().find((item) => item.textContent.startsWith(labelText));
      assert(entry && !entry.disabled, 'Missing title settings action: ' + labelText);
      entry.click();
    };
    settingsClick(label('Screen and performance', 'Pantalla y rendimiento'));
    settingsClick(label('Show performance details', 'Mostrar detalles de rendimiento'));
    assert(settingsActions().some((item) => item.textContent.startsWith(
      label('Stop renderer profiling', 'Detener registro del renderizador'))),
      'profiler remains opt-in active after document restart');
    settingsClick(label('Export playtest report', 'Exportar informe de prueba'));
    assert(restoredExport);
    const restoredReport = JSON.parse(await restoredExport.text());
    assert.equal(restoredReport.buildCommit, null,
      'an unstamped local build must explicitly leave provenance unknown');
    assert.equal(restoredReport.performance.rendererDiagnostics.state, 'recording');
    assert.notEqual(restoredReport.performance.diagnosticContinuity.documentId,
      continuity.documentId, 'a new JavaScript document has a new event identity');
    const restoredContinuity = restoredReport.performance.diagnosticContinuity;
    assert(restoredContinuity.priorRendererSegments.length > 0,
      'interrupted profiling survives as a separately clocked segment');
    assert(restoredContinuity.priorRendererSegments.some((segment) =>
      segment.boundary === 'document-restarted-or-restored'));
    assert(restoredContinuity.priorFrameProfiles.length > 0,
      'automatic frame-profile evidence is retained independently of profiling');
    assert(restoredContinuity.events.some((row) =>
      row.kind === 'document-start' && row.resumedProfiling));
  }
  console.log('Playtest export and optional renderer diagnostics pass in EN/ES.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
