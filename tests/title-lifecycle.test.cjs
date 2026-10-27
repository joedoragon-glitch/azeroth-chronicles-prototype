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
const fresh = shell('en', 'paladin', { stayOnTitle: true, seedSave: false });
assert.equal(fresh.scope.Prototype.started, false);
assert.equal(fresh.elements.get('title-continue').disabled, true);
assert.equal(fresh.elements.get('title-new').disabled, false);
console.log('PASS bilingual main screen, guarded Continue, return, inactive title');
