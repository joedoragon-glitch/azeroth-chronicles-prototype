'use strict';
const assert = require('node:assert/strict');
const { shell } = require('./helpers/production-shell.cjs');

for (const language of ['en', 'es']) {
  const { scope, elements, events } = shell(language);
  const { Prototype } = scope;
  const byLabel = (prefix) => {
    const button = elements
      .get('modal-actions')
      .children.find((element) => element.textContent.startsWith(prefix));
    assert(button, 'missing action ' + prefix);
    return button;
  };
  elements.get('menu-button').click();
  byLabel(language === 'en' ? 'Game and settings' : 'Juego y ajustes').click();
  byLabel(language === 'en' ? 'Sound settings' : 'Ajustes de sonido').click();
  const sound = elements.get('modal-content');
  sound.scrollTop = 85;
  byLabel(language === 'en' ? 'Music volume' : 'Volumen de música').click();
  byLabel(language === 'en' ? 'Quieter' : 'Bajar volumen').click();
  assert(
    byLabel(language === 'en' ? 'Quieter' : 'Bajar volumen').classList.contains('selected'),
    'refresh keeps the selected sound action',
  );
  elements.get('close-button').click();
  assert.equal(sound.scrollTop, 85, 'Back restores parent scroll');
  assert(
    byLabel(language === 'en' ? 'Music volume' : 'Volumen de música').classList.contains('selected'),
    'Back restores the parent choice',
  );
  elements.get('close-button').click();
  elements.get('close-button').click();
  elements.get('close-button').click();

  let returnedFocus = false;
  scope.document.activeElement = { focus: () => { returnedFocus = true; } };
  const controls = Prototype.menuControls;
  const changes = [];
  const entries = [
    controls.section('Display'),
    controls.toggle('Try setting', false, (v) => changes.push(['toggle', v])),
    controls.select('Renderer choice', 'a', [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ], (v) => changes.push(['select', v])),
    controls.slider('Sharpness', 50, 0, 100, 10, (v) => changes.push(['slider', v])),
  ];
  const before = JSON.stringify(Prototype.game.snapshot());
  Prototype.openMenu('Foundation controls', '', entries, Prototype.closeMenu);
  const children = elements.get('modal-actions').children;
  assert.equal(children[0].textContent, 'Display');
  children[1].click();
  assert(children[1].textContent.includes('On'), 'toggle updates its visible state');
  const select = children[2].children.find((element) => element.className === 'menu-setting-input');
  select.value = 'b';
  select.onchange();
  const range = children[3].children.find((element) => element.className === 'menu-setting-input');
  range.value = '70';
  range.oninput();
  assert.deepEqual(changes, [
    ['toggle', true],
    ['select', 'b'],
    ['slider', 70],
  ]);
  assert.equal(JSON.stringify(Prototype.game.snapshot()), before, 'menu-only edits preserve campaign');
  assert.equal(elements.get('modal').hidden, false);
  Prototype.closeMenu();
  assert(returnedFocus, 'closing root menu returns focus to its opener');

  // Tab must still be handled when a native form control currently has focus.
  Prototype.openMenu('Form navigation', '', [
    controls.select('Input', 'a', [{ value: 'a', label: 'A' }], () => {}),
  ], Prototype.closeMenu);
  const event = {
    code: 'Tab',
    target: { tagName: 'SELECT' },
    preventDefault() { this.prevented = true; },
    repeat: false,
    shiftKey: false,
  };
  events.keydown[0](event);
  assert(event.prevented, 'Tab is trapped inside the open dialog');
  Prototype.closeMenu();
}
console.log('PASS bilingual shared controls, in-place adjustments, Back/selection/scroll and focus contracts');
