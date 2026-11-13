'use strict';
// Game-wide character identity and player-neutral language, v0.9.2 draft #868.
// This is copy/presentation coverage, not a complete player campaign run.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Campaign = require('../src/prototype/engine.js');
const Archive = require('../src/prototype/archive.js');
const { shell } = require('./helpers/production-shell.cjs');
Campaign.enableRoguePlaytest();

const app = fs.readFileSync(require.resolve('../src/prototype/app.js'), 'utf8');
const start = app.indexOf('  const heroClassPresentation = Object.freeze({');
const end = app.indexOf('  function playableClassCountWord(', start);
assert(start >= 0 && end > start, 'read class presentation from production source');
const intros = Object.fromEntries(['en', 'es'].map((language) => {
  const descriptions = vm.runInNewContext(app.slice(start, end) + '\n' +
    'Object.fromEntries([\'paladin\',\'mage\',\'ranger\',\'rogue\'].map(id => ' +
    '[id, { label: heroClassLabel(id), detail: heroClassDetail(id) }]))', { language });
  return [language, descriptions];
}));
assert.deepEqual(Object.keys(intros.es), ['paladin', 'mage', 'ranger', 'rogue']);
assert.equal(intros.es.mage.label, 'Maga');
assert.equal(intros.es.rogue.label, 'Pícara');
assert.equal(intros.es.paladin.label, 'Paladín');
assert.equal(intros.es.ranger.label, 'Explorador');
for (const language of ['en', 'es'])
  for (const heroClass of ['paladin', 'mage', 'ranger', 'rogue']) {
    const copy = intros[language][heroClass].detail;
    assert(copy.length > 120 && copy.length < 390,
      heroClass + '/' + language + ': meaningful portrait, suitable for an interactive card');
    assert(copy.split(/[.!?]+/).filter((part) => part.trim()).length >= 2,
      heroClass + '/' + language + ': two complete sentences, not a skill fragment');
  }
assert(intros.en.mage.detail.startsWith('She ') && intros.en.rogue.detail.startsWith('She '));
assert(intros.en.paladin.detail.startsWith('He ') && intros.en.ranger.detail.startsWith('He '));
assert(intros.es.mage.detail.includes('La maga') && intros.es.rogue.detail.includes('La pícara'));
assert(intros.es.rogue.detail.includes('Empieza sola'), 'the Rogue starts without company');
assert(intros.en.rogue.detail.includes('Charm'), 'actual Charm-first play is explained');
assert(!/Mago/.test(intros.es.mage.label), 'Mage is not presented as male');

assert.equal(Archive.translateArchiveLabel('A prisoner for the Archive'),
  'Una prisionera para el Archivo', 'Neri is female in the Keeper reference');
assert.equal(Archive.translateArchiveLabel('Hero critical chance: '),
  'Probabilidad crítica de tu personaje: ', 'Archive uses a neutral player reference');
const veyraEnglish = 'The Ash Sentinel takes 65% damage while its armor is closed; the Stone Colossus takes 125% while its core is exposed. Some captains gain protection from their followers. Clear the warning, then strike during the opening.';
assert(Archive.translateArchive(veyraEnglish).startsWith('La centinela de ceniza'),
  'female Marshal Veyra never becomes a masculine sentinel in reference text');

for (const language of ['en', 'es']) {
  const { scope, elements } = shell(language);
  const g = scope.Prototype.game;
  const actions = () => elements.get('modal-actions').children.filter((b) => typeof b.onclick === 'function');
  const press = (prefix) => {
    const b = actions().find((a) => a.textContent.startsWith(prefix));
    assert(b, 'expected interactive menu: ' + prefix);
    b.click();
  };
  for (const region of Campaign.data.regions) {
    assert(g.enter(region.id), region.id + ' enter');
    const rescues = g.questDefs().filter((q) => q.region === region.id && q.kind === 'rescue');
    assert.equal(rescues.length, 2);
    for (const q of rescues) g.s.rescued[q.target] = true;
    scope.Prototype.closeMenu();
    elements.get('menu-button').click();
    press(language === 'es' ? 'Diario de misiones' : 'Quest journal');
    for (const q of rescues) {
      const captive = Campaign.data.bosses.find((b) => b.id === q.target).captive.split(' the ')[0];
      const expected = captive + (language === 'es' ? ' ya está libre.' : ' is free.');
      assert(actions().some((b) => b.children.some((child) => child.textContent.includes(expected))),
        region.id + '/' + language + ': named liberated specialist ' + expected);
    }
  }
}
console.log('PASS four characterized classes, neutral EN/ES player copy, Keeper/Veyra/Neri and ten specialist rescue rows');
