'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Journal = require('../src/prototype/startup-diagnostics.js');
const { shell } = require('./helpers/production-shell.cjs');
const memory = () => {
  const values = new Map();
  let writes = 0;
  return {
    values,
    get writes() {
      return writes;
    },
    getItem: (k) => values.get(k) ?? null,
    setItem(k, v) {
      writes++;
      values.set(k, v);
    },
  };
};
const last = (j) => j.report().attempts.at(-1);
function menu(app, label) {
  const button = app.elements
    .get('modal-actions')
    .children.find((x) => x.textContent.startsWith(label));
  assert(button, 'existing menu action: ' + label);
  button.click();
}
(async () => {
  let wall = 1000000,
    clock = 0;
  const storage = memory();
  let journal = Journal.create({ storage, now: () => wall, clock: () => clock });
  assert.equal(last(journal).events[0].stage, 'document-open', 'records without user action');
  journal.record('app-entered', {
    version: '0.9.1+snapshot.dev.265',
    buildCommit: 'a'.repeat(40),
    password: 'never-copy',
  });
  clock = 7;
  journal.record('gpu-start', { renderer: 'canvas2d', preferredRenderer: 'webgl2' });
  const errors = Journal.create({ storage: memory() });
  errors.record('page-error', {
    failureType: 'TypeError',
    failureMessage: 'Failed https://private.example/path?token=secret ' + 'x'.repeat(300),
    asset: 'engine.js',
    line: 17,
    column: 9,
  });
  const failure = last(errors).firstFailure;
  assert.equal(failure.line, 17);
  assert.equal(failure.asset, 'engine.js');
  assert(failure.failureMessage.length <= 160);
  assert(!failure.failureMessage.includes('private.example'));
  // Keep the final recorded checkpoint a preparation step.
  journal.record('gpu-start');
  const frozen = storage.getItem(Journal.KEY);
  // Simulate abrupt termination, with no shutdown hook to flush another event.
  wall += 300;
  clock = 0;
  journal = Journal.create({ storage, now: () => wall, clock: () => clock });
  const prior = journal.report().attempts[0];
  assert.equal(prior.outcome, 'interrupted');
  assert.equal(prior.interruption, 'previous-document-ended-before-ready');
  assert.equal(prior.events.at(-1).stage, 'gpu-start');
  assert.equal(prior.firstFailure, null, 'unfinished preparation is not invented as a GPU crash');
  assert.equal(prior.build.buildCommit, 'a'.repeat(40));
  assert(!frozen.includes('never-copy'));
  journal.record('graphics-state', {
    failureType: 'preparation-failed',
    failureStage: 'application-init',
    reason: 'webgl-preparation-failed',
  });
  journal.record('scene-revealed', { renderer: 'canvas2d' });
  journal.record('controls-ready');
  assert.equal(last(journal).outcome, 'ready', 'Canvas fallback can still complete startup');
  assert.equal(last(journal).firstFailure.failureStage, 'application-init');
  assert(journal.needsMovement(), 'standing still does not block completed startup');
  assert(journal.needsLiveDraw());
  journal.record('first-live-draw');
  assert(!journal.needsLiveDraw());
  journal.foreground();
  journal.foreground('bfcache-return');
  assert.equal(
    journal.report().attempts.length,
    3,
    'duplicate visibility/BFCache boundary is coalesced',
  );
  journal.record('background-return-classified', { decision: 'guarded-continue' });
  journal.entry('continue');
  journal.record('scene-revealed');
  journal.record('controls-ready');
  for (let i = 0; i < 20; i++) {
    journal.foreground();
    journal.record('scene-revealed');
  }
  assert.equal(journal.report().attempts.length, 3);
  assert(journal.report().droppedAttempts > 0);
  for (let i = 0; i < 300; i++) journal.record('graphics-state', { reason: 'attempt-' + i });
  assert.equal(last(journal).events.length, Journal.MAX_EVENTS);
  assert(last(journal).droppedEvents > 0);
  assert(storage.getItem(Journal.KEY).length <= Journal.MAX_BYTES);
  const writes = storage.writes;
  for (let i = 0; i < 50; i++) journal.record('graphics-state', { reason: 'attempt-299' });
  assert.equal(storage.writes, writes, 'duplicate state cannot add periodic persistence work');
  for (const raw of ['{bad', 'x'.repeat(Journal.MAX_BYTES + 1), JSON.stringify({ version: 99 })]) {
    const store = memory();
    store.setItem(Journal.KEY, raw);
    const clean = Journal.create({ storage: store });
    assert.equal(clean.report().attempts.length, 1);
    assert.equal(last(clean).events[0].stage, 'document-open');
  }
  const denied = Journal.create({
    storage: {
      getItem() {
        throw Error('denied');
      },
      setItem() {
        throw Error('quota');
      },
    },
  });
  denied.record('gpu-start');
  denied.record('scene-revealed');
  assert.equal(last(denied).outcome, 'ready');
  assert.equal(denied.report().persistence.lastWriteSucceeded, false);
  assert.equal(denied.report().persistence.available, false);
  // Journal storage is independent: it must never touch campaign save keys.
  assert.deepEqual([...storage.values.keys()], [Journal.KEY]);

  for (const language of ['en', 'es']) {
    let clock = 0;
    const app = shell(language, 'mage', { now: () => clock });
    const j = app.scope.PrototypeStartupDiagnostics.journal;
    const owner = app.scope.Prototype;
    owner.fps.select('20');
    owner.renderResolution.select('native');
    owner.frameSkip.select(false);
    owner.platform.selectCameraZoom(1.5);
    owner.audio.setSettings({ master: 0.37, music: 0.23, muted: true });
    app.scope.navigator.platform = 'TestOS';
    app.scope.navigator.hardwareConcurrency = 4;
    app.scope.navigator.deviceMemory = 8;
    app.scope.navigator.userAgentData = {
      platform: 'TestOS',
      mobile: false,
      brands: [{ brand: 'TestBrowser', version: '123' }],
    };
    app.scope.performance.memory = {
      usedJSHeapSize: 1234,
      totalJSHeapSize: 5678,
      jsHeapSizeLimit: 9999,
    };
    const before = JSON.stringify(owner.game.snapshot());
    assert.equal(last(j).outcome, 'ready');
    for (const stage of [
      'document-open',
      'app-entered',
      'save-load-start',
      'save-load-finished',
      'graphics-choice',
      'update-check-start',
      'update-gate-finished',
      'title-shown',
      'entry-requested',
      'sprites-start',
      'sprites-settled',
      'save-recovery-start',
      'save-recovery-finished',
      'scene-draw-completed',
      'scene-revealed',
      'controls-ready',
    ])
      assert(
        last(j).events.some((x) => x.stage === stage),
        'automatic milestone ' + stage,
      );
    assert(!last(j).events.some((x) => x.stage === 'first-movement-observed'));
    assert.doesNotThrow(() => app.events.pagehide[0](), 'minimal lifecycle event stays nonfatal');
    let blob;
    app.scope.URL.createObjectURL = (value) => {
      blob = value;
      return 'test-blob';
    };
    app.elements.get('menu-button').click();
    menu(app, language === 'es' ? 'Ajustes' : 'Settings');
    menu(app, language === 'es' ? 'Herramientas de prueba' : 'Playtest tools');
    menu(app, language === 'es' ? 'Exportar informe de prueba' : 'Export playtest report');
    const report = JSON.parse(await blob.text());
    assert.equal(report.performance.startupDiagnostics.attempts.at(-1).outcome, 'ready');
    assert.equal(report.analysisGuide.version, 1);
    assert.equal(report.analysisGuide.language, 'en');
    const sections = new Map(
      report.analysisGuide.sections.map((section) => [section.path, section]),
    );
    for (const path of [
      'performance.rendererDiagnostics',
      'performance.effectDiagnostics',
      'performance.crowdDiagnostics',
      'performance.frameProfile',
      'performance.startupDiagnostics',
      'partyDiagnostics',
      'settings',
      'audio',
      'sprites',
      'materials',
    ])
      assert(sections.has(path), 'self-contained guidance for ' + path);
    for (const section of sections.values()) {
      const value = section.path.split('.').reduce((object, key) => object?.[key], report);
      assert(
        value !== undefined || section.optional,
        'documented paths resolve in actual export: ' + section.path,
      );
    }
    for (const key of Object.keys(report))
      assert(
        [...sections.keys()].some((path) => path.split('.')[0] === key) || key === 'analysisGuide',
        'every exported root section has guidance: ' + key,
      );
    assert.equal(report.settings.display.language, language);
    assert.deepEqual(report.settings.controls, JSON.parse(JSON.stringify(owner.input.preferences)));
    assert.equal(report.settings.references.sound, 'audio.settings');
    assert.equal(report.audio.settings.master, 0.37);
    assert.equal(report.audio.settings.music, 0.23);
    assert.equal(report.audio.settings.muted, true);
    assert.equal(report.performance.frameRatePreference, '20');
    assert.equal(report.performance.renderResolution.preference, 'native');
    assert.equal(report.performance.frameSkip.enabled, false);
    assert.equal(report.performance.environment.device.platform, 'TestOS');
    assert.equal(report.performance.environment.device.browserHints.brands[0].brand, 'TestBrowser');
    assert.equal(report.performance.environment.device.jsHeapEstimate.usedBytes, 1234);
    assert.equal(report.performance.environment.device.exactCpuModel, null);
    assert.equal(
      report.performance.environment.device.screen.cssWidth,
      null,
      'unavailable readings stay null',
    );
    assert.equal(
      report.performance.rendererDiagnostics.state,
      'not-recorded',
      'never enabled optional recording',
    );
    assert.equal(
      JSON.stringify(app.scope.Prototype.game.snapshot()),
      before,
      'observation/export never changes campaign',
    );
    app.scope.Prototype.closeMenu();
    clock = 33;
    app.frame(33);
    assert(last(j).events.some((x) => x.stage === 'first-live-draw'));
    for (const fn of app.events.keydown)
      fn({ code: 'KeyD', key: 'd', target: null, repeat: false, preventDefault() {} });
    clock = 66;
    app.frame(66);
    for (const fn of app.events.keyup || [])
      fn({ code: 'KeyD', key: 'd', target: null, preventDefault() {} });
    assert(
      last(j).events.some((x) => x.stage === 'first-movement-observed'),
      'real native movement is observed without instrumenting input rules',
    );
    const unchanged = j.report().updatedAt;
    const startupBytes = app.storage.get(Journal.KEY);
    for (let i = 0; i < 5; i++) {
      clock += 33;
      app.frame(clock);
    }
    assert.equal(
      app.storage.get(Journal.KEY),
      startupBytes,
      'steady frames do not keep writing startup history',
    );
    assert.equal(
      j.report().updatedAt,
      unchanged,
      'reading the report does not manufacture new evidence',
    );
    clock = 300;
    app.scope.document.hidden = true;
    app.documentEvents.visibilitychange.forEach((fn) => fn());
    const count = j.report().attempts.length;
    app.documentEvents.visibilitychange.forEach((fn) => fn());
    assert.equal(
      j.report().attempts.length,
      count,
      'duplicate hidden signals do not allocate history',
    );
    clock = 5000;
    app.scope.document.hidden = false;
    app.documentEvents.visibilitychange.forEach((fn) => fn());
    assert.equal(
      app.scope.Prototype.started,
      false,
      'long hidden return preserves guarded Continue',
    );
    assert.equal(last(j).kind, 'foreground-return');
    assert(
      last(j).events.some(
        (x) => x.stage === 'background-return-classified' && x.decision === 'guarded-continue',
      ),
    );
    app.elements.get('title-continue').click();
    app.frame(5050);
    assert.equal(app.scope.Prototype.started, true);
    assert.equal(last(j).outcome, 'ready');
    assert(last(j).events.some((x) => x.stage === 'scene-revealed'));
    clock = 5100;
    app.scope.document.hidden = true;
    app.documentEvents.visibilitychange.forEach((fn) => fn());
    clock = 5200;
    app.scope.document.hidden = false;
    app.documentEvents.visibilitychange.forEach((fn) => fn());
    assert.equal(app.scope.Prototype.started, true, 'brief return does not create a title bounce');
    assert(
      last(j).events.some(
        (x) => x.stage === 'background-return-classified' && x.decision === 'live-resume',
      ),
    );
  }
  const template = fs.readFileSync('templates/game.html', 'utf8');
  assert(template.indexOf('startup-diagnostics.js') < template.indexOf('src/sprint.js'));
  assert.equal(
    require('../scripts/site-assets.cjs').scripts[0],
    'src/prototype/startup-diagnostics.js',
  );
  console.log(
    'PASS automatic bounded startup history, interrupted boot, one EN/ES report, no opt-in, short/long returns and save independence',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
