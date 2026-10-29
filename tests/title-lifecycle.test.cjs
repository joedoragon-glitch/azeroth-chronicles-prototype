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
  const { scope, elements, storage, events, documentEvents, frame } =
    shell(language, 'mage', { stayOnTitle: true });
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
  scope.document.hidden = true;
  hiddenChanged();
  assert.equal(scope.Prototype.started, false, 'hidden game enters title');
  assert.equal(title.hidden, false);
  assert.equal(elements.get('modal').hidden, true, 'old gameplay menu is closed');
  assert.equal(continueButton.disabled, false, 'valid saved game stays resumable');
  const saved = JSON.parse(storage.get('azeroth-v4-normal'));
  assert.equal(saved.time, originalTime, 'minimize persisted exact campaign time');
  assert.equal(saved.hero.x, originalHeroX, 'minimize persisted player position');
  frame(200);
  frame(300);
  assert.equal(liveCampaign.s.time, originalTime, 'no simulation while hidden');
  hiddenChanged();
  assert.equal(scope.Prototype.started, false, 'repeated hidden notification is inert');

  scope.document.hidden = false;
  hiddenChanged();
  for (const fn of events.focus || []) fn();
  frame(400);
  assert.equal(title.hidden, false, 'foreground does not restart play');
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
  scope.document.hidden = true;
  hiddenChanged();
  scope.document.hidden = false;
  hiddenChanged();
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

const fresh = shell('en', 'paladin', { stayOnTitle: true, seedSave: false });
assert.equal(fresh.scope.Prototype.started, false);
assert.equal(fresh.elements.get('title-continue').disabled, true);
assert.equal(fresh.elements.get('title-new').disabled, false);
console.log('PASS bilingual main screen, background-to-title, guarded Continue and save safety');
