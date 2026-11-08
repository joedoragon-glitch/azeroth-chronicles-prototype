'use strict';
const assert = require('node:assert/strict');
const { shell } = require('./helpers/production-shell.cjs');

for (const [language, code, label] of [
  ['en', 'KeyF', '[F] Interact'],
  ['es', 'KeyF', '[F] Interactuar'],
  ['en', 'KeyY', '[Y] Interact'],
]) {
  const storage = new Map([['azeroth-input-v1', JSON.stringify({ bindings: { confirm: code } })]]);
  const { scope, elements, events, frame } = shell(language, 'paladin', { storage });
  const game = scope.Prototype.game;
  const captain = game.zone().npcs.find((n) => n.kind === 'recruiter');
  const origin = { x: game.hero.x, y: game.hero.y };
  const prompt = elements.get('desktop-interaction');
  for (let i = 1; i <= 12; i++) frame(i * 17);
  assert(prompt.hidden, 'the prompt starts hidden away from interactions');
  Object.assign(game.hero, { x: captain.x, y: captain.y });
  for (let i = 13; i <= 24; i++) frame(i * 17);
  assert(!prompt.hidden);
  assert(prompt.textContent.startsWith(label + ' · '));
  if (language === 'en') assert.equal(prompt.textContent, label + ' · ' + captain.name);
  Object.assign(game.hero, origin);
  for (let i = 25; i <= 36; i++) frame(i * 17);
  assert(prompt.hidden, 'the prompt disappears after leaving interaction range');
  Object.assign(game.hero, { x: captain.x, y: captain.y });
  for (let i = 37; i <= 48; i++) frame(i * 17);
  const press = (key) => events.keydown.forEach((fn) => fn({ code: key, preventDefault() {} }));
  if (code !== 'KeyF') {
    press('KeyF');
    assert(
      !elements.get('modal') || elements.get('modal').hidden,
      'F no longer interacts after rebinding',
    );
  }
  press(code);
  assert.equal(
    elements.get('modal-title').textContent,
    language === 'en' ? 'Meet your company' : 'Conoce a tu compañía',
  );
  assert(prompt.hidden, 'opening an interaction menu hides the prompt');
}

{
  const phone = shell('en');
  phone.scope.Prototype.platform.select('phone');
  const game = phone.scope.Prototype.game;
  const captain = game.zone().npcs.find((n) => n.kind === 'recruiter');
  Object.assign(game.hero, { x: captain.x, y: captain.y });
  for (let i = 1; i <= 12; i++) phone.frame(i * 17);
  assert(phone.elements.get('desktop-interaction').hidden);
  assert(!phone.elements.get('touch-interact-button').hidden);
}
console.log('PASS contextual desktop interaction uses the current binding in English and Spanish');
