'use strict';
// Focused Stage 4 game-design contract against the actual production menu shell.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { shell } = require('./helpers/production-shell.cjs');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const button = (elements, prefix) => {
  const match = elements.get('modal-actions').children.find(
    (entry) => entry.textContent.startsWith(prefix) && !entry.disabled,
  );
  assert(match, 'Expected selectable action ' + prefix);
  return match;
};
for (const language of ['en', 'es']) {
  const es = language === 'es';
  const app = shell(language, 'paladin', { stayOnTitle: true, seedSave: false });
  const { scope, elements, storage } = app;
  const initialSnapshot = JSON.stringify(scope.Prototype.game.snapshot());
  elements.get('title-new').click();
  assert.equal(elements.get('modal-title').textContent, es ? 'Nueva aventura' : 'New Adventure');
  assert(elements.get('modal-actions').children.some(
    (entry) => entry.textContent.includes(es ? 'Desactivada' : 'Succession · Off')),
    'Succession starts off');
  const nightmare = elements.get('modal-actions').children.find(
    (entry) => entry.textContent.startsWith(es ? 'Pesadilla' : 'Nightmare'),
  );
  assert(nightmare?.disabled, 'Nightmare is explicitly locked on an uncompleted profile');
  assert.equal(JSON.stringify(scope.Prototype.game.snapshot()), initialSnapshot,
    'reading setup never changes campaign state');
  button(elements, es ? 'Sucesión · Desactivada' : 'Succession · Off').click();
  assert(elements.get('modal-actions').children.some(
    (entry) => entry.textContent.startsWith(es ? 'Sucesión · Activada' : 'Succession · On')),
    'Succession choice remains visibly selected');
  button(elements, es ? 'Elegir héroe' : 'Choose Hero').click();
  assert.equal(elements.get('modal').getAttribute('data-view'), 'class-select');
  const nameField = elements.get('modal-actions').children.at(-1);
  assert(nameField.className === 'character-name-field',
    'optional name input follows the four hero cards');
  const paladin = elements.get('modal-actions').children.find(
    (entry) => entry.textContent.includes(es ? 'Paladín' : 'Paladin') && !entry.disabled,
  );
  assert(paladin, 'first hero class remains available');
  paladin.click();
  assert.equal(scope.Prototype.game.s.challenge.succession, true);
  assert.equal(scope.Prototype.game.s.mode, 'normal');
  assert(storage.has('azeroth-v4-normal'), 'the same compatible save slot is used');
}
for (const language of ['en', 'es']) {
  const es = language === 'es';
  const { elements } = shell(language, 'paladin', { stayOnTitle: true });
  elements.get('title-saves').click();
  const save = elements.get('modal-actions').children;
  assert(save.some((entry) => entry.textContent === (es ? 'Tus partidas' : 'Your adventures')));
  assert(save.some((entry) => entry.textContent === (es ? 'Copias y recuperación' : 'Backups & recovery')));
  assert(save.some((entry) => entry.className?.includes('menu-import-picker')),
    'native file input remains in the save menu');
  elements.get('close-button').click();
  elements.get('title-help').click();
  const titles = [
    es ? 'Primeros pasos' : 'Quick Start',
    es ? 'Combate y compañeros' : 'Combat & companions',
    es ? 'Partidas y actualizaciones' : 'Saved games & updates',
    es ? 'Problemas e informes' : 'Troubleshooting & reports',
    es ? 'Acerca de, versión y créditos' : 'About, version & credits',
  ];
  for (const title of titles) button(elements, title);
  button(elements, es ? 'Problemas e informes' : 'Troubleshooting & reports').click();
  button(elements, es ? 'Diagnósticos avanzados' : 'Advanced diagnostics').click();
  button(elements, es ? 'Medir el renderizado' : 'Renderer profiling').click();
  assert(elements.get('modal-description').textContent.includes(
    es ? 'fotogramas' : 'frames'), 'detailed diagnostics remain available');
  elements.get('close-button').click();
  assert.equal(elements.get('modal-title').textContent,
    es ? 'Diagnósticos avanzados' : 'Advanced diagnostics');
  elements.get('close-button').click();
  assert.equal(elements.get('modal-title').textContent,
    es ? 'Problemas e informes' : 'Troubleshooting & reports');
}
const css = read('styles/prototype.css');
const phone = read('styles/phone.css');
for (const key of ['menu-canvas', 'menu-surface', 'menu-gold', 'menu-violet', 'menu-ink'])
  assert(css.includes('--' + key + ': '), 'missing design token: ' + key);
assert.match(css, /#title-screen,[\s\S]*?#modal/);
assert.match(phone, /body\[data-experience='phone'\] #modal-description \{\s*font-size: 15px/);
assert.match(phone, /body\[data-experience='phone'\] #modal-actions \.detail,[\s\S]*?font-size: 13px/);
assert.match(phone, /#modal-actions button,[\s\S]*?min-height: 44px/);
assert.match(phone, /#close-button small \{\s*display: none/);
assert.match(phone, /#modal\[data-view='new-adventure'\]/);
console.log('PASS Stage 4 icon-led menu, bilingual new game, Help, saves and CSS contracts');
