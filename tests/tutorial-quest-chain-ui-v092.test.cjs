'use strict';
// Real production-shell interactions: tutorial handoff, Board/map/Codex and
// Rank-2 Barracks first-use. Native combat and actual cargo are covered apart.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const { shell } = require('./helpers/production-shell.cjs');
Campaign.enableRoguePlaytest();

function finishBarracks(game) {
  game.zone().props = [];
  game.distanceToRoad = () => 400;
  game.blocked = () => false;
  assert(game.build(), 'native free first Barracks');
  const b = game.zone().buildings.find((x) => x.kind === 'barracks');
  const worker = game.s.party.find((u) => u.order?.type === 'build');
  assert(b && worker);
  Object.assign(worker, { x: b.x, y: b.y });
  game.zone().enemies = [];
  game.updateParty(4.1);
  assert(b.progress >= 4);
  return b;
}
for (const language of ['en', 'es']) {
  const tr = (en, es) => language === 'en' ? en : es;
  const { scope: s, elements: e, storage } = shell(language);
  const g = s.Prototype.game;
  const buttons = () => e.get('modal-actions').children.filter((b) => typeof b.onclick === 'function');
  const click = (label) => {
    const b = buttons().find((x) => x.textContent.startsWith(label));
    assert(b, 'Missing ' + label + ' from ' + buttons().map((x) => x.textContent).join(' / '));
    assert(!b.disabled, 'Disabled ' + label);
    b.click();
  };
  const interactAt = (target) => {
    Object.assign(g.hero, { x: target.x, y: target.y });
    s.Prototype.closeMenu();
    e.get('touch-interact-button').click();
  };
  const base = finishBarracks(g);
  assert(g.s.quests['quest-tutorial-board'].active);
  assert(!g.s.quests['quest-tutorial-board'].boardOpened);
  assert(!g.s.quests['quest-tutorial-gather'].active);
  const board = g.zone().npcs.find((x) => x.kind === 'quests' && x.id === 'board');
  interactAt(board);
  assert.equal(e.get('modal-title').textContent, tr('Quest board', 'Tablón de misiones'));
  assert(g.s.quests['quest-tutorial-board'].boardOpened);
  assert(buttons().some((b) => b.textContent.startsWith(tr('The Quest Board', 'El tablón de misiones'))));
  click(tr('A Teacher Taken', 'Una maestra cautiva'));
  assert(g.s.quests['quest-tutorial-board'].storyViewed);
  interactAt(board);
  click(tr('Side Quests', 'Misiones secundarias'));
  assert(g.s.quests['quest-tutorial-board'].sideViewed);
  s.Prototype.closeMenu();
  e.get('menu-button').click();
  click(tr('Map and travel routes', 'Mapa y rutas de viaje'));
  assert(g.s.quests['quest-tutorial-board'].mapOpened);
  const cellar = g.mapDestinations().find((place) => place.family === 'side-vale-cellars');
  assert(cellar, 'real cellar entrance is a native map destination');
  const row = buttons().find((x) => x.textContent.includes(cellar.name));
  assert(row && !row.disabled, cellar.name);
  row.click();
  const go = buttons()[0];
  assert(!go.disabled);
  go.click();
  assert(g.s.quests['quest-tutorial-board'].navigationUsed, 'only real map route counts');
  assert(g.hero.order?.navigation, 'native map movement remains intact');
  assert(!g.s.quests['quest-tutorial-board'].paid, 'actual Codex still required');
  const midway = Campaign.restore(g.snapshot());
  assert(midway.s.quests['quest-tutorial-board'].navigationUsed);
  g.enter('side-vale-cellars');
  const book = g.zone().npcs.find((x) => x.kind === 'critical-codex');
  assert(book);
  interactAt(book);
  assert(g.s.quests['quest-tutorial-board'].paid);
  assert.equal(e.get('modal-title').textContent,
    tr('Critical executions', 'Ejecuciones críticas'));
  assert(e.get('modal-description').textContent.includes(
    tr('one percentage point', 'un punto porcentual')));
  assert(Campaign.restore(g.snapshot()).s.quests['quest-tutorial-board'].paid);
  // A previous Board visit must not be erased merely to restart its cue.
  assert(g.s.discovered['vale:quest-board-intro']);

  const gatherUI = shell(language);
  const h = gatherUI.scope.Prototype.game;
  const el = gatherUI.elements;
  const options = () => el.get('modal-actions').children.filter((x) => typeof x.onclick === 'function');
  const press = (name) => {
    const button = options().find((x) => x.textContent.startsWith(name));
    assert(button && !button.disabled, name + ': ' + options().map((x) => x.textContent).join(' / '));
    button.click();
  };
  const camp = finishBarracks(h);
  h.s.expeditionRank = 2;
  Object.assign(h.hero, { x: camp.x, y: camp.y });
  gatherUI.scope.Prototype.closeMenu();
  el.get('touch-interact-button').click();
  press(tr('Operations', 'Operaciones'));
  assert(!h.s.quests['quest-tutorial-gather'].active, 'mere Barracks entry is not a trigger');
  press(tr('Gather resources', 'Recoger recursos'));
  assert.equal(el.get('modal-title').textContent, tr('Gathering basics', 'Lo básico de la recolección'));
  assert(h.s.quests['quest-tutorial-gather'].active);
  assert(Campaign.restore(h.snapshot()).s.quests['quest-tutorial-gather'].active);
  press(tr('Choose a tribute source', 'Elegir una fuente de tributo'));
  const sourceChoice = options().find((x) => /Recover Dark Lord Tribute|Recuperar el tributo/i.test(x.textContent));
  assert(sourceChoice && !sourceChoice.disabled, 'real local resource action');
  sourceChoice.click();
  assert(h.s.quests['quest-tutorial-gather'].gatherStarted);
  assert(h.s.gatheringTarget, 'real saved worker intent');
  assert(JSON.parse(gatherUI.storage.get('azeroth-v4-normal')).quests['quest-tutorial-gather'].gatherStarted);
}
{
  const { scope: s, elements: e } = shell('en', 'rogue');
  const g = s.Prototype.game;
  assert.equal(g.s.party.length, 0);
  const captain = g.zone().npcs.find((n) => n.kind === 'recruiter');
  Object.assign(g.hero, { x: captain.x, y: captain.y });
  e.get('touch-interact-button').click();
  assert.equal(e.get('modal-title').textContent, 'Meet your company');
  assert(e.get('modal-description').textContent.includes('You begin alone'));
  assert(!e.get('modal-description').textContent.includes('Soldier: close combat'));
  assert(e.get('modal-actions').children.some((b) =>
    b.textContent.startsWith('Find your first Charmed companion')));
  assert(!e.get('modal-actions').children.some((b) =>
    b.textContent.startsWith('Practice Recall squad')));
  assert.equal(g.tutorialStage(), 'charm');
}
console.log('PASS production-shell EN/ES Board, map, Codex, first-use gathering and Rogue Captain');
