'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Campaign = require('../src/prototype/engine.js');
const Archive = require('../src/prototype/archive.js');
const Menus = require('../src/prototype/menus.js');
const Approved = require('../src/prototype/narration.js').approved;
const { shell } = require('./helpers/production-shell.cjs');

const c = new Campaign('normal', 'paladin', () => 0.9);
c.enter('archive');
c.s.normal.archive = true;
c.s.rescued.archive = true;
c.s.keeperPact = true;
for (const e of c.zone().enemies)
  if (e.type === 'boss' && e.family === 'archive') e.hp = 0;
assert(c.keeperAvailable());
let shown, dismissed = 0;
const back = () => { dismissed++; };
const menus = Menus.create({
  getGame: () => c, Campaign, D: Campaign.data,
  action: (label, action, detail = '', disabled = false) =>
    ({ label, action, detail, disabled }),
  openMenu: (title, description, actions, goBack, options) => {
    shown = { title, description, actions, back: goBack, view: options?.view };
  },
  closeMenu: back,
  recallSquad() {}, showMap() {}, finaleMenu() {},
});
const primary = [
  'Battle and protection', 'Conditions and recovery',
  'Experience and discipline', 'Your skills',
  'Companions and field bases', 'The Crown and its institutions',
  'Adversaries and their attacks', 'The provinces',
];
menus.keeper(back);
assert.equal(shown.title, 'The Keeper’s shelves');
assert.equal(shown.description, Approved.P03.en);
assert.equal(shown.view, 'archive-index');
assert.deepEqual(shown.actions.map((a) => a.label), primary,
  'Eight scannable top-level shelves retain the approved hierarchy');
const go = (title) => {
  const action = shown.actions.find((a) => a.label === title);
  assert(action, title + ' visible on ' + shown.title);
  action.action();
};
go('Adversaries and their attacks');
assert.equal(shown.view, 'archive-shelf');
const originalShelfBack = shown.back;
const section = Archive.sections(c, { D: Campaign.data, R: Campaign.rules })
  .find((item) => item.title === 'Adversaries and their attacks');
assert.deepEqual(
  shown.actions.filter((a) => a.kind !== 'section').map((a) => a.label),
  section.topics.map(([title]) => title),
  'Grouping never drops or moves encounter material',
);
const headings = shown.actions.filter((a) => a.kind === 'section').map((a) => a.label);
assert(headings.includes('Field adversaries') && headings.includes('Dungeon guardians'));
go('Mirejaw');
assert.equal(shown.view, 'archive-reading');
assert(shown.description.includes(Approved.K01.en), 'Full approved Keeper history survives in answer');
const answerBack = shown.back;
go('Another question');
assert.equal(shown.title, 'Adversaries and their attacks');
assert.equal(shown.back, originalShelfBack, 'Stable shelf Back callback across visit');
shown.back();
assert.equal(shown.title, 'The Keeper’s shelves');
go('Experience and discipline');
go('Why old enemies teach little');
assert.equal(shown.view, 'archive-reading');
assert(!shown.description.includes('100 / 75 / 40 / 10%'), 'Narrative is shown before live figures');
go('Show me the figures');
assert.equal(shown.view, 'archive-reading');
assert(shown.description.includes('100 / 75 / 40 / 10 / 0%'));
go('Return to the answer');
assert.equal(shown.title, 'Why old enemies teach little');
assert(shown.actions.some((a) => a.label === 'Show me the figures'));
go('All shelves');
assert.equal(shown.title, 'The Keeper’s shelves');
assert.equal(shown.actions.length, 8);
c.s.keeperEvidence = true;
menus.keeper(back);
assert.equal(shown.actions.length, 9, 'Ninth shelf unlocked solely by signed evidence');
go('The orders among the shelves');
go('A prisoner for the Archive');
assert.equal(shown.description, Approved.P05.en);
c.s.keeperEvidence = false;
shown.back();
assert.equal(shown.title, 'The Keeper’s shelves',
  'Locked shelf safely disappears after fact is unavailable');
assert(!shown.actions.some((a) => a.label === 'The orders among the shelves'));
c.s.pending.archive = { active: true };
menus.keeper(back);
assert.equal(dismissed, 0, 'Opening disallowed Archive creates no dialogue');

// The generic renderer accepts scoped Archive views and preserves long text
// and ancestor scroll without treating buttons as the beginning of an answer.
const { scope, elements } = shell('en');
const prototype = scope.Prototype;
const modal = elements.get('modal'), content = elements.get('modal-content');
const pick = (label) => {
  const button = elements.get('modal-actions').children.find((b) => b.textContent.startsWith(label));
  assert(button, label + ' action exists');
  button.click();
};
const reading = 'Author copy.\n\n' + 'This full narrative remains intact. '.repeat(65);
const openReading = () => prototype.openMenu('Full record', reading,
  [{ label: 'Another question', action: openShelf }],
  openShelf, { view: 'archive-reading' });
const openShelf = () => prototype.openMenu('Shelf', 'Topics',
  [{ label: 'Full record', action: openReading }],
  openIndex, { view: 'archive-shelf' });
const openIndex = () => prototype.openMenu('Bookshelves', 'Eight shelves',
  [{ label: 'Shelf', action: openShelf }],
  prototype.closeMenu, { view: 'archive-index' });
openIndex();
content.scrollTop = 105;
pick('Shelf');
assert.equal(modal.getAttribute('data-view'), 'archive-shelf');
content.scrollTop = 190;
pick('Full record');
assert.equal(modal.getAttribute('data-view'), 'archive-reading');
assert.equal(elements.get('modal-description').textContent, reading,
  'Reading mode preserves every paragraph and character');
content.scrollTop = 280;
elements.get('close-button').click();
assert.equal(content.scrollTop, 190, 'Reading Back restores shelf scroll');
assert(elements.get('modal-actions').children[0].classList.contains('selected'),
  'Reading Back restores selected question');
elements.get('close-button').click();
assert.equal(content.scrollTop, 105, 'Shelf Back restores index scroll');

const app = fs.readFileSync(path.join(__dirname, '../src/prototype/app.js'), 'utf8');
assert(app.includes("if (moveFocus) selected?.scrollIntoView"),
  'Opening a long answer cannot autoscroll into the action buttons');
const css = fs.readFileSync(path.join(__dirname, '../styles/prototype.css'), 'utf8');
const phone = fs.readFileSync(path.join(__dirname, '../styles/phone.css'), 'utf8');
assert(css.includes("#modal[data-view='archive-reading'] #modal-description") &&
  css.includes('white-space: pre-wrap'), 'Full answers have a readable paragraph style');
assert(phone.includes("body[data-experience='phone'] #modal[data-view='archive-reading']"),
  'Long answers have a phone-specific reading layout');
console.log('PASS A2 eight + gated ninth shelves, grouped topics, live figures, stable Back and A3 reading/scroll');
