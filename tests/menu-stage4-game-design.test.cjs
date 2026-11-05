'use strict';
// Focused Stage 4 game-design contract against the actual production menu shell.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { shell } = require('./helpers/production-shell.cjs');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const button = (elements, prefix) => {
  const match = elements
    .get('modal-actions')
    .children.find((entry) => entry.textContent.startsWith(prefix) && !entry.disabled);
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
  const setupActions = elements.get('modal-actions').children;
  const normalIndex = setupActions.findIndex((entry) =>
    entry.textContent.startsWith(es ? 'Normal · Recomendada' : 'Normal · Recommended'),
  );
  const nightmareIndex = setupActions.findIndex((entry) =>
    entry.textContent.startsWith(es ? 'Pesadilla' : 'Nightmare'),
  );
  const successionIndex = setupActions.findIndex((entry) =>
    entry.textContent.startsWith(es ? 'Sucesión · Desactivada' : 'Succession · Off'),
  );
  const chooseIndex = setupActions.findIndex((entry) =>
    entry.textContent.startsWith(es ? 'Elegir héroe' : 'Choose Hero'),
  );
  assert(
    normalIndex >= 0 && nightmareIndex > normalIndex &&
      successionIndex > nightmareIndex && chooseIndex > successionIndex,
    'setup decisions precede the Choose Hero action',
  );
  assert.equal(
    setupActions[normalIndex].getAttribute('aria-pressed'),
    'true',
    'Normal is the active default, independently of keyboard focus',
  );
  assert.equal(
    setupActions[successionIndex].getAttribute('aria-pressed'),
    'false',
    'Succession is visibly optional and off by default',
  );
  assert(
    setupActions[successionIndex].children.some((span) =>
      span.textContent.includes(es ? 'Recuperación habitual' : 'Standard recovery'),
    ),
    'Succession Off explains the active standard recovery rather than implying permanent loss',
  );
  assert(
    elements
      .get('modal-actions')
      .children.some((entry) =>
        entry.textContent.includes(es ? 'Desactivada' : 'Succession · Off'),
      ),
    'Succession starts off',
  );
  const nightmare = elements
    .get('modal-actions')
    .children.find((entry) => entry.textContent.startsWith(es ? 'Pesadilla' : 'Nightmare'));
  assert(nightmare?.disabled, 'Nightmare is explicitly locked on an uncompleted profile');
  assert.equal(
    JSON.stringify(scope.Prototype.game.snapshot()),
    initialSnapshot,
    'reading setup never changes campaign state',
  );
  button(elements, es ? 'Sucesión · Desactivada' : 'Succession · Off').click();
  assert(
    elements
      .get('modal-actions')
      .children.some((entry) =>
        entry.textContent.startsWith(es ? 'Sucesión · Activada' : 'Succession · On'),
      ),
    'Succession choice remains visibly selected',
  );
  const chosenSuccession = button(elements, es ? 'Sucesión · Activada' : 'Succession · On');
  assert.equal(chosenSuccession.getAttribute('aria-pressed'), 'true');
  assert(
    chosenSuccession.children.some((span) =>
      span.textContent.includes(es ? 'Si caen las cuatro' : 'Lose all four'),
    ),
    'the enabled challenge explains run-ending consequences before the class picker',
  );
  button(elements, es ? 'Elegir héroe' : 'Choose Hero').click();
  assert.equal(elements.get('modal').getAttribute('data-view'), 'class-select');
  const nameField = elements.get('modal-actions').children.at(-1);
  assert(
    nameField.className === 'character-name-field',
    'optional name input follows the four hero cards',
  );
  const paladin = elements
    .get('modal-actions')
    .children.find(
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
  assert(
    save.some((entry) => entry.textContent === (es ? 'Copias de seguridad' : 'Backups')) &&
      save.some((entry) => entry.textContent === (es ? 'Recuperación y almacenamiento' : 'Recovery & storage')),
    'Backup files and recovery/storage are separate player intents',
  );
  assert(
    save.some((entry) => entry.className?.includes('menu-import-picker')),
    'native file input remains in the save menu',
  );
  const backupIndex = save.findIndex((entry) => entry.textContent === (es ? 'Copias de seguridad' : 'Backups'));
  const importIndex = save.findIndex((entry) => entry.className?.includes('menu-import-picker'));
  const recoveryIndex = save.findIndex((entry) =>
    entry.textContent === (es ? 'Recuperación y almacenamiento' : 'Recovery & storage'),
  );
  assert(
    backupIndex > 0 && importIndex > backupIndex && recoveryIndex > importIndex,
    'save slots precede backup actions, which precede recovery/storage controls',
  );
  const recoveryAction = save.find((entry) =>
    entry.textContent.startsWith(es ? 'Intentar recuperar' : 'Try recovery'),
  );
  assert(recoveryAction?.className?.includes('menu-wide'), 'recovery is not a peer save slot');

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
  assert(
    elements.get('modal-description').textContent.includes(es ? 'fotogramas' : 'frames'),
    'detailed diagnostics remain available',
  );
  elements.get('close-button').click();
  assert.equal(
    elements.get('modal-title').textContent,
    es ? 'Diagnósticos avanzados' : 'Advanced diagnostics',
  );
  elements.get('close-button').click();
  assert.equal(
    elements.get('modal-title').textContent,
    es ? 'Problemas e informes' : 'Troubleshooting & reports',
  );
}
// The default path is three deliberate actions for every real class, in both languages.
for (const language of ['en', 'es']) {
  for (const classId of ['paladin', 'mage', 'ranger', 'rogue']) {
    const app = shell(language, classId, { stayOnTitle: true, seedSave: false });
    app.elements.get('title-new').click();
    button(app.elements, language === 'es' ? 'Elegir héroe' : 'Choose Hero').click();
    const cards = app.elements
      .get('modal-actions')
      .children.filter((x) => x.className !== 'character-name-field');
    assert.equal(cards.length, 4);
    cards[['paladin', 'mage', 'ranger', 'rogue'].indexOf(classId)].click();
    assert.equal(app.scope.Prototype.game.hero.class, classId);
    assert.equal(app.scope.Prototype.game.s.challenge.succession, false);
    assert.equal(app.scope.Prototype.game.s.mode, 'normal');
  }
  for (const succession of [false, true]) {
    const app = shell(language, 'paladin', { stayOnTitle: true, seedSave: false });
    app.scope.Prototype.profile.nightmareUnlocked = true;
    app.elements.get('title-new').click();
    button(app.elements, language === 'es' ? 'Pesadilla' : 'Nightmare').click();
    if (succession)
      button(
        app.elements,
        language === 'es' ? 'Sucesión · Desactivada' : 'Succession · Off',
      ).click();
    button(app.elements, language === 'es' ? 'Elegir héroe' : 'Choose Hero').click();
    app.elements.get('close-button').click();
    assert(
      app.elements
        .get('modal-actions')
        .children.some((x) =>
          x.textContent.startsWith(language === 'es' ? 'Pesadilla ✓' : 'Nightmare ✓'),
        ),
      'Back retains selected difficulty',
    );
    button(app.elements, language === 'es' ? 'Elegir héroe' : 'Choose Hero').click();
    app.elements.get('modal-actions').children[0].click();
    assert.equal(app.scope.Prototype.game.s.mode, 'nightmare');
    assert.equal(app.scope.Prototype.game.s.challenge.succession, succession);
  }
}
const css = read('styles/prototype.css');
const phone = read('styles/phone.css');
for (const key of ['menu-canvas', 'menu-surface', 'menu-gold', 'menu-violet', 'menu-ink'])
  assert(css.includes('--' + key + ': '), 'missing design token: ' + key);
assert.match(css, /#title-screen,[\s\S]*?#modal/);
assert.match(phone, /body\[data-experience='phone'\] #modal-description \{\s*font-size: 15px/);
assert.match(
  phone,
  /body\[data-experience='phone'\] #modal-actions \.detail,[\s\S]*?font-size: 13px/,
);
assert.match(phone, /#modal-actions button,[\s\S]*?min-height: 44px/);
assert.match(phone, /#close-button small \{\s*display: none/);
assert.match(phone, /#modal\[data-view='new-adventure'\]/);
console.log('PASS Stage 4 icon-led menu, bilingual new game, Help, saves and CSS contracts');
