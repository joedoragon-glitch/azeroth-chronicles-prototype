'use strict';
const assert = require('node:assert/strict');
const { shell } = require('./helpers/production-shell.cjs');

for (const language of ['en', 'es']) {
  const { scope, elements, storage, events, documentEvents, frame } =
    shell(language, 'ranger', { stayOnTitle: true });
  const title = elements.get('title-screen');
  const saved = storage.get('azeroth-v4-normal');
  assert.equal(scope.Prototype.started, false, 'restored run is initially inactive');
  assert.equal(title.hidden, false, 'title is visible on a cold launch');
  assert.equal(elements.get('title-continue').disabled, false);
  assert.equal(elements.get('title-new').textContent,
    language === 'es' ? 'Nueva partida' : 'New Game');
  frame(100);
  frame(350);
  assert.equal(scope.Prototype.started, false, 'idle title does not start gameplay');
  assert.equal(scope.Prototype.game.s.time, JSON.parse(saved).time, 'no title simulation');
  assert.equal(storage.get('azeroth-v4-normal'), saved, 'no title autosave');
  elements.get('title-continue').click();
  assert.equal(scope.Prototype.started, false, 'Continue draws before activation');
  frame(500);
  assert.equal(scope.Prototype.started, true, 'Continue activates the exact loaded run');
  assert.equal(title.hidden, true);
  assert.equal(scope.Prototype.game.hero.class, 'ranger');
  elements.get('menu-button').click();
  const label = language === 'es' ? 'Volver al menú principal' : 'Return to Main Menu';
  const back = elements.get('modal-actions').children.find((x) => x.textContent === label);
  assert(back, 'Return to Main Menu action should be available');
  back.click();
  assert.equal(scope.Prototype.started, false);
  assert.equal(title.hidden, false);
  documentEvents.visibilitychange?.forEach((fn) => fn());
  assert.equal(title.hidden, false, 'visibility does not reactivate the game');
  assert(events.pageshow?.length > 0);
}
// Minimize is a real session boundary, not just a pause while an expensive
// WebGL cache is reconstructed on top of moving enemies.
for (const language of ['en', 'es']) {
  let clock = 0;
  const { scope, elements, storage, events, documentEvents, frame } =
    shell(language, 'mage', { stayOnTitle: true, now: () => clock });
  const title = elements.get('title-screen');
  const continueButton = elements.get('title-continue');
  const hiddenChanged = () => documentEvents.visibilitychange.forEach((fn) => fn());
  continueButton.click();
  frame(100);
  assert.equal(scope.Prototype.started, true);
  const liveCampaign = scope.Prototype.game;
  const originalTime = liveCampaign.s.time;
  const originalHeroX = liveCampaign.hero.x;

  // Browser focus alone must not trigger the title contract.
  for (const fn of events.blur || []) fn();
  assert.equal(scope.Prototype.started, true, 'blur without hiding remains paused in-place');
  for (const fn of events.focus || []) fn();

  elements.get('menu-button').click();
  clock = 100;
  scope.document.hidden = true;
  hiddenChanged();
  assert.equal(scope.Prototype.started, true, 'hidden game is frozen before classification');
  assert.equal(title.hidden, true, 'no immediate title bounce during a brief hidden signal');
  const saved = JSON.parse(storage.get('azeroth-v4-normal'));
  assert.equal(saved.time, originalTime, 'minimize persisted exact campaign time');
  assert.equal(saved.hero.x, originalHeroX, 'minimize persisted player position');
  frame(200);
  frame(300);
  assert.equal(liveCampaign.s.time, originalTime, 'no simulation while hidden');
  hiddenChanged();
  assert.equal(scope.Prototype.started, true, 'repeated hidden signals do not start or cancel play');

  clock = 4100;
  scope.document.hidden = false;
  hiddenChanged();
  for (const fn of events.focus || []) fn();
  frame(4200);
  assert.equal(title.hidden, false, 'sustained background still needs Continue');
  assert.equal(elements.get('modal').hidden, true, 'old gameplay menu is closed');
  assert.equal(continueButton.disabled, false, 'valid saved game stays resumable');
  assert.equal(scope.Prototype.started, false);
  assert.equal(scope.Prototype.game, liveCampaign, 'live campaign remains in memory');

  continueButton.click();
  assert.equal(scope.Prototype.started, false, 'Continue keeps game gated by ready frame');
  frame(500);
  assert.equal(scope.Prototype.started, true, 'Continue resumes gameplay after preparation');
  assert.equal(scope.Prototype.game, liveCampaign, 'Continue does not reload or reset campaign');
  assert.equal(liveCampaign.hero.x, originalHeroX);
  assert.equal(liveCampaign.s.time, originalTime);

  // If the tab is minimized during Continue's asynchronous ready-frame step,
  // cancelling that step must never allow an automatic foreground launch.
  clock = 4400;
  scope.document.hidden = true;
  hiddenChanged();
  clock = 7500;
  scope.document.hidden = false;
  hiddenChanged();
  assert.equal(scope.Prototype.started, false, 'a second sustained hide re-enters title');
  continueButton.click();
  assert.equal(scope.Prototype.started, false);
  scope.document.hidden = true;
  hiddenChanged();
  assert.equal(title.hidden, false, 'interrupted Continue returns to title');
  scope.document.hidden = false;
  hiddenChanged();
  frame(600);
  assert.equal(scope.Prototype.started, false,
    'pending requestAnimationFrame cannot launch play after another minimize');
  continueButton.click();
  frame(700);
  assert.equal(scope.Prototype.started, true, 'explicit new Continue works');
}

// A brief iPhone-style visibility flip should save and freeze play without
// discarding its live scene. A missing visibilitychange on return can be
// reconciled through pageshow or focus, as some Home Screen PWAs behave.
for (const [language, resumeSource] of [
  ['en', 'visibilitychange'],
  ['es', 'pageshow'],
  ['en', 'focus'],
]) {
  let clock = 0;
  const { scope, elements, storage, documentEvents, events, frame } =
    shell(language, 'mage', { stayOnTitle: true, now: () => clock });
  const visibility = () => documentEvents.visibilitychange.forEach((fn) => fn());
  elements.get('title-continue').click();
  frame(100);
  assert.equal(scope.Prototype.started, true);
  const campaign = scope.Prototype.game;
  const firstTime = campaign.s.time;
  clock = 150;
  scope.document.hidden = true;
  visibility();
  assert.equal(scope.Prototype.started, true, 'short hide retains live session identity');
  assert.equal(elements.get('title-screen').hidden, true);
  assert.equal(JSON.parse(storage.get('azeroth-v4-normal')).time, firstTime,
    'the short interruption saves immediately');
  frame(200);
  assert.equal(campaign.s.time, firstTime, 'the hidden game never simulates');
  clock = 650;
  scope.document.hidden = false;
  if (resumeSource === 'visibilitychange') visibility();
  else if (resumeSource === 'pageshow')
    for (const fn of events.pageshow || []) fn({ persisted: false });
  else for (const fn of events.focus || []) fn();
  assert.equal(scope.Prototype.started, true, 'brief interruption resumes in place');
  assert.equal(scope.Prototype.game, campaign, 'brief interruption never restores a new campaign');
  assert.equal(elements.get('title-screen').hidden, true);
  frame(700);
  assert(campaign.s.time >= firstTime, 'the resumed scene is eligible for simulation');
  const history = JSON.parse(storage.get('sibdlp-playtest-diagnostics-v1')).events;
  assert(history.some((event) => event.kind === 'background-return-classified' &&
    event.decision === 'live-resume' && event.source === resumeSource));
  assert(!history.some((event) => event.kind === 'return-to-title'),
    'a short background signal is not misclassified as a title transition');
}

// Even a brief hide requires the guarded Continue path if a renderer signals
// that it needs GPU recovery rather than risking active combat during rebuild.
{
  let clock = 0;
  const state = { mode: 'canvas2d', phase: 'canvas', preferredRenderer: 'canvas2d',
    recoveryPending: false, recoveryPaused: false };
  const guard = { startupChoice: () => ({ renderer: 'canvas2d' }), create: () => ({
    status: () => state, visibilityChanged() {}, check: () => state,
    confirm: () => false, revert: () => false, requestWebGL: async () => false,
    maybeRecover: async () => false, webglFailed: () => false,
    resumeConfirmedWebGL: async () => false,
  }) };
  const { scope, elements, documentEvents, frame } =
    shell('en', 'mage', { stayOnTitle: true, now: () => clock, graphicsGuard: guard });
  elements.get('title-continue').click();
  frame(100);
  assert.equal(scope.Prototype.started, true);
  clock = 150;
  scope.document.hidden = true;
  for (const fn of documentEvents.visibilitychange || []) fn();
  state.recoveryPending = true;
  clock = 350;
  scope.document.hidden = false;
  for (const fn of documentEvents.visibilitychange || []) fn();
  assert.equal(scope.Prototype.started, false,
    'known renderer recovery still requires the guarded title loading route');
  const history = JSON.parse(scope.localStorage.getItem('sibdlp-playtest-diagnostics-v1')).events;
  assert(history.some((event) => event.kind === 'return-to-title' &&
    event.reason === 'document-hidden-graphics-recovery'));
}

// A failed campaign save must not be mislabeled as a safe live return.
// The previous durable save and the unsaved in-memory run must both survive.
for (const language of ['en', 'es']) {
  let clock = 0;
  const { scope, elements, storage, documentEvents, frame } =
    shell(language, 'ranger', { stayOnTitle: true, now: () => clock });
  elements.get('title-continue').click();
  frame(100);
  assert.equal(scope.Prototype.started, true);
  const live = scope.Prototype.game;
  const primary = storage.get('azeroth-v4-normal');
  const beforeTime = live.s.time;
  const originalSet = storage.set.bind(storage);
  storage.set = (key, value) => {
    if (key === 'azeroth-v4-normal') throw Error('simulated save-storage failure');
    return originalSet(key, value);
  };
  clock = 130;
  scope.document.hidden = true;
  for (const fn of documentEvents.visibilitychange || []) fn();
  clock = 230;
  scope.document.hidden = false;
  for (const fn of documentEvents.visibilitychange || []) fn();
  assert.equal(scope.Prototype.started, true,
    'failed persistence cannot discard the unsaved live campaign');
  assert.equal(scope.Prototype.game, live);
  assert.equal(elements.get('title-screen').hidden, true);
  assert.equal(storage.get('azeroth-v4-normal'), primary,
    'the previous saved snapshot is not overwritten');
  frame(300);
  assert.equal(live.s.time, beforeTime, 'simulation stays paused after save failure');
  const history = JSON.parse(storage.get('sibdlp-playtest-diagnostics-v1')).events;
  assert(history.some((event) => event.kind === 'background-return-classified' &&
    event.decision === 'save-or-ownership-pause'),
    'failed save is classified as a safe paused state, never live-resume');
  storage.set = originalSet;
}

// Confirmed WebGL loss in a session may restore behind Continue, but the
// startup quarantine and repeated-failure hold must not be bypassed.
for (const [label, launchRenderer, pending, recoveryPaused, expectedAttempts] of [
  ['in-session context loss after Canvas startup', 'canvas2d', true, false, 1],
  ['no recovery requested after Canvas startup', 'canvas2d', false, false, 0],
  ['repeated WebGL failure hold', 'webgl2', false, true, 0],
]) {
  let attempts = 0;
  const state = {
    mode: 'canvas2d', phase: 'canvas', preferredRenderer: 'webgl2',
    recoveryPending: pending, recoveryPaused,
  };
  const graphicsGuard = {
    startupChoice: () => ({ renderer: launchRenderer }),
    create: () => ({
      status: () => state,
      visibilityChanged() {},
      check: () => state,
      confirm: () => false,
      revert: () => false,
      requestWebGL: async () => false,
      maybeRecover: async () => false,
      webglFailed: () => false,
      resumeConfirmedWebGL: async () => { attempts++; return false; },
    }),
  };
  const { elements } = shell('en', 'mage', { stayOnTitle: true, graphicsGuard });
  elements.get('title-continue').click();
  assert.equal(attempts, expectedAttempts, label);
}

// A browser terminated in active gameplay leaves a tiny recovery marker. The
// validated refuge relocation creates a NEW Campaign object; its first scene
// must still pass the title readiness gate instead of leaving every button
// disabled at "Drawing first scene…".
for (const language of ['en', 'es']) {
  const C = require('../src/prototype/engine');
  const initial = new C('normal', 'mage', () => 0.5);
  const snapshot = initial.snapshot();
  const storage = new Map([
    ['azeroth-v4-normal', JSON.stringify(snapshot)],
    ['azeroth-active-play-recovery-v1', JSON.stringify({
      version: 1, active: true, mode: 'normal', heroClass: 'mage',
      nextId: snapshot.nextId, gameTime: snapshot.time,
    })],
  ]);
  const { scope, elements, frame } =
    shell(language, 'mage', { stayOnTitle: true, storage });
  const beforeRecovery = scope.Prototype.game;
  elements.get('title-continue').click();
  assert.notEqual(scope.Prototype.game, beforeRecovery,
    'crash marker must exercise a real recovered Campaign object');
  assert.equal(scope.Prototype.started, false,
    'recovery still waits for the ready scene before activation');
  frame(850);
  assert.equal(scope.Prototype.started, true,
    'recovered Campaign must not strand Continue behind the loading screen');
  assert.equal(elements.get('title-screen').hidden, true);
}

const fresh = shell('en', 'paladin', { stayOnTitle: true, seedSave: false });
assert.equal(fresh.scope.Prototype.started, false);
assert.equal(fresh.elements.get('title-continue').disabled, true);
assert.equal(fresh.elements.get('title-new').disabled, false);
console.log('PASS bilingual main screen, background-to-title, guarded Continue and save safety');
