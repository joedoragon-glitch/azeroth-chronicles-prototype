'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../src/prototype/engine.js');
const Approved = require('../src/prototype/narration.js').approved;
const R = C.rules;
for (const [key, id] of [['crypt', 'D01'], ['mine', 'D02'], ['abyss', 'D03']])
  assert.equal(R.dungeonLore[key], Approved[id].en, id + ' first-entry prose must be verbatim');
// The Citadel's last sentence belongs to private quarters. Never expose it at entrance.
assert.equal(R.dungeonLore.citadel, Approved.D04_entrance.en);
assert(Approved.D04.en.startsWith(Approved.D04_entrance.en));
assert(Approved.D04.es.startsWith(Approved.D04_entrance.es));
assert(!/cosmetics|private quarters|Veyra’s quarters/i.test(R.dungeonLore.citadel));
for (const [key, id] of [
  ['side-vale-cellars', 'I01'], ['side-march-watchhouse', 'I02'],
  ['side-highlands-signal', 'I03'], ['side-frontier-shrine', 'I04'],
  ['side-crown-foundry', 'I05'],
]) {
  const side = R.sideDungeons.find((x) => x.id === key);
  assert(side, 'Saved side-dungeon id stays stable: ' + key);
  assert.equal(side.lore, Approved[id].en, 'English interior text is exactly approved: ' + id);
}
const crownSites = R.landmarks?.crown || R.regionalLandmarks?.[4] || [];
const ruleSource = fs.readFileSync(path.join(__dirname, '../src/prototype/rules.js'), 'utf8');
assert(ruleSource.includes("['shelf', 'Crystal Deposit', 1250, 2350]"),
  'Only the Crystal Deposit display name changes; stable shelf ID survives');
const eng = fs.readFileSync(path.join(__dirname, '../src/prototype/engine.js'), 'utf8');
for (const id of ['L01','L02','L03','M01','M02'])
  assert(eng.includes('AuthorCopy.' + id + '.en'), id + ' uses approved source');
const app = fs.readFileSync(path.join(__dirname, '../src/prototype/app.js'), 'utf8');
assert(app.includes('approvedNarrative.M03.es'), 'Credits use author-approved Spanish');
assert(app.includes("'Crystal Deposit': 'Yacimiento de Cristales'"),
  'Crystal Deposit Spanish display name is approved');
const menus = fs.readFileSync(path.join(__dirname, '../src/prototype/menus.js'), 'utf8');
for (const id of ['P01','P02','P03','P04','P06','P07','P07_nomana'])
  assert(menus.includes('approvedNarrative.' + id + '.en'), id + ' uses immutable author text');
console.log('PASS N1 dungeon, interior, landmark, dialogue and finale source boundaries');
