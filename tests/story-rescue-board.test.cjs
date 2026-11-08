'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const { shell } = require('./helpers/production-shell.cjs');

for (const language of ['en', 'es']) {
  const { scope, elements, storage } = shell(language);
  const game = scope.Prototype.game;
  const buttons = () => elements.get('modal-actions').children.filter((b) => typeof b.onclick === 'function');
  const press = (title) => {
    const button = buttons().find((b) => b.textContent.startsWith(title));
    assert(button, title);
    button.click();
  };
  const journal = () => {
    elements.get('menu-button').click();
    press(language === 'en' ? 'Quest journal' : 'Diario de misiones');
  };
  const interact = (site) => {
    Object.assign(game.hero, { x: site.x, y: site.y });
    elements.get('touch-interact-button').click();
  };
  const mainRows = () => buttons().filter((b) => b.children.some((child) => child.textContent.includes('still captive') ||
    child.textContent.includes('cautiv'))).map((b) => b.textContent);
  const flag = 'vale:quest-board-intro';
  assert(!game.s.discovered[flag]);
  for (const region of Campaign.data.regions) {
    assert(game.enter(region.id));
    const board = game.zone().npcs.find((npc) => npc.id === 'board');
    assert(board, region.id);
    journal();
    const title = elements.get('modal-title');
    const summary = elements.get('modal-description').textContent;
    assert(summary.includes(language === 'en' ? 'Main Story' : 'Historia principal'));
    assert(!game.s.discovered[flag] || region.id !== 'vale', 'journal never marks the board visited');
    const rescues = game.questDefs().filter((q) => q.region === region.id && q.kind === 'rescue');
    assert.equal(rescues.length, 2);
    const fromJournal = buttons().map((b) => b.textContent);
    const rowsFromJournal = mainRows();
    assert.equal(rowsFromJournal.length, 2, 'both rows expose rescue context and progress');
    scope.Prototype.closeMenu();
    interact(board);
    assert.notEqual(title.textContent, language === 'en' ? 'Quest journal' : 'Diario de misiones');
    assert.equal(elements.get('modal-description').textContent, summary);
    assert.deepEqual(mainRows(), rowsFromJournal);
    assert.deepEqual(buttons().map((b) => b.textContent), fromJournal.slice(0, -1));
    assert(game.s.discovered[flag]);
    press(language === 'en' ? 'Side Quests' : 'Misiones secundarias');
    for (const q of rescues)
      assert(!buttons().some((b) => b.textContent.includes(q.name)));
    assert.equal(mainRows().length, 0);
    scope.Prototype.closeMenu();
  }
  assert(JSON.parse(storage.get('azeroth-v4-normal')).discovered[flag]);
  assert(Campaign.restore(game.snapshot()).s.discovered[flag]);
  game.enter('vale');
  const witness = game.zone().npcs.find((n) => n.thornReport);
  assert.equal(game.questDestination('quest-0').id, witness.id);
  journal();
  press(language === 'en' ? 'A Teacher Taken' : 'Una maestra cautiva');
  assert(buttons().some((b) => b.textContent === (language === 'en' ? 'Navigate' : 'Ir')), JSON.stringify(buttons().map((b) => b.textContent)));
  press(language === 'en' ? 'Track quest' : 'Seguir misión');
  assert.equal(scope.Prototype.trackedQuest, 'quest-0');
}
console.log('PASS five shared EN/ES rescue boards and journals, story/side separation, witness guidance and persisted first visit');
