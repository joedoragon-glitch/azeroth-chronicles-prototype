'use strict';
// Stage 5 pre-release shell acceptance. No browser matrix or hardware claims.
// Exercise the real app menu/export actions with in-memory production shell.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const { shell } = require('./helpers/production-shell.cjs');

function harness({ developerFlag = false, developerSave = false } = {}) {
  const storage = new Map();
  if (developerSave) {
    const game = new Campaign('developer', 'paladin', () => 0.5);
    storage.set('azeroth-v4-developer', JSON.stringify(game.snapshot()));
  }
  const location = {
    // Local in-memory shell has no Web Locks API. HTTP localhost exercises
    // developer URL opt-in without pretending to own a production HTTPS lock.
    protocol: 'http:', hostname: 'localhost',
    search: developerFlag ? '?developer=1' : '',
  };
  const h = shell('en', 'paladin', { storage, location });
  const { scope, elements } = h;
  function click(label) {
    const modal = elements.get('modal-actions');
    const row = modal?.children.find((b) => b.textContent.startsWith(label));
    assert(row, label + ' not found on ' + elements.get('modal-title')?.textContent);
    assert(!row.disabled, label + ' unexpectedly disabled');
    row.click();
  }
  function contains(label) {
    return !!elements.get('modal-actions')?.children.some((r) => r.textContent.startsWith(label));
  }
  let saved;
  scope.URL.createObjectURL = (blob) => {
    saved = blob;
    return 'blob:effect-stage5-test';
  };
  const exportReport = async () => {
    click('Save and game management');
    click('Export playtest report');
    assert(saved instanceof Blob, 'actual playtest export was not produced');
    return JSON.parse(await saved.text());
  };
  return { scope, elements, click, contains, exportReport, h };
}
(async () => {
  {
    const h = harness({ developerFlag: true, developerSave: true });
    const g = h.scope.Prototype.game;
    assert.equal(g.s.mode, 'developer', 'Developer Mode campaign must actually be loaded');
    h.elements.get('menu-button').click();
    h.click('Game and settings');
    h.click('Screen and performance');
    assert(!h.contains('Start effect recording'),
      'diagnostic controls should not clutter collapsed performance view');
    h.click('Show performance details');
    assert(h.contains('Start effect recording'));
    assert(h.contains('Clear effect recording'));
    const renderer = h.scope.Prototype.renderer;
    assert.equal(renderer.effectDiagnosticsReport().captured, false,
      'no recorder allocated before explicit opt-in');
    h.click('Start effect recording');
    assert.equal(renderer.effectDiagnosticsReport().recording, true);
    assert(h.contains('Stop effect recording'));
    // Observe a real engine-generated event through the original app renderer.
    g.event('hit', { x: g.hero.x + 2, y: g.hero.y + 3 });
    renderer.queue(g.effects.splice(0));
    renderer.noteEffectDrawDecision(true, true);
    const during = renderer.effectDiagnosticsReport();
    assert(during.identities.some((x) => x.id === 'impact' && x.queued === 1),
      'the UI-enabled recorder must observe the ordinary real event queue');
    assert.equal(during.drawDecisions.adaptiveSkipped, 1);
    h.click('Stop effect recording');
    assert.equal(renderer.effectDiagnosticsReport().recording, false);
    assert(h.contains('Start effect recording'));
    const retained = renderer.effectDiagnosticsReport();
    assert(retained.identities.some((x) => x.id === 'impact' && x.queued === 1),
      'Stop must retain in-memory records for shared export');
    h.elements.get('close-button').click();
    const report = await h.exportReport();
    assert.equal(report.mode, 'developer');
    assert.equal(report.performance.effectDiagnostics.recording, false);
    assert(report.performance.effectDiagnostics.identities.some((x) => x.id === 'impact'));
    assert(report.performance.frameProfile, 'existing frame data must coexist');
    assert(report.performance.frameSkip, 'existing frame-skip data must coexist');
    assert(report.performance.crowdDiagnostics, 'existing crowd diagnostics must coexist');
    assert(report.partyDiagnostics, 'existing party diagnostics must coexist');
    assert.equal(report.currency, 'crowns');

    // Clearing must discard the in-memory trace without altering normal save.
    h.elements.get('close-button').click(); // Return to Game and settings
    h.click('Screen and performance');
    h.click('Clear effect recording');
    assert.equal(renderer.effectDiagnosticsReport().captured, false);
  }
  {
    const h = harness({ developerFlag: false });
    assert.equal(h.scope.Prototype.game.s.mode, 'normal');
    assert.equal(h.scope.Prototype.renderer.setEffectDiagnostics(true), false);
    h.elements.get('menu-button').click();
    h.click('Game and settings');
    h.click('Screen and performance');
    h.click('Show performance details');
    assert(!h.contains('Start effect recording'), 'ordinary player must not see developer recorder');
    assert(!h.contains('Clear effect recording'), 'ordinary player must not see recorder reset');
    h.elements.get('close-button').click();
    const report = await h.exportReport();
    assert.equal(Object.hasOwn(report.performance, 'effectDiagnostics'), false,
      'ordinary playtest export must not contain effect diagnostic data');
  }
  {
    const h = harness({ developerFlag: true, developerSave: false });
    assert.equal(h.scope.Prototype.game.s.mode, 'normal',
      'developer URL alone must not make a normal campaign a developer campaign');
    h.elements.get('menu-button').click();
    h.click('Game and settings');
    h.click('Screen and performance');
    h.click('Show performance details');
    assert(!h.contains('Start effect recording'),
      'developer query parameter with a Normal run must not enable diagnostics');
  }
  console.log('PASS Stage 5 real menu actions, opt-in recorder lifecycle, shared JSON export and normal-player isolation');
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
