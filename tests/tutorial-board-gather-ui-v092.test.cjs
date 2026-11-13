'use strict';
// Production shell (English and Spanish) acceptance for the additional
// tutorial entrypoints. Native fixtures accelerate construction/travel;
// they do NOT certify an earned browser walk or a physical device.
const assert = require('node:assert/strict');
const { shell } = require('./helpers/production-shell.cjs');

for (const language of ['en', 'es']) {
  const { scope, elements: e } = shell(language);
  const game = scope.Prototype.game;
  const t = (en, es) => language === 'en' ? en : es;
  const actions = () => e.get('modal-actions').children;
  const title = () => e.get('modal-title').textContent;
  const click = (prefix) => {
    const item = actions().find((b) => b.textContent.startsWith(prefix));
    assert(item, 'Missing ' + prefix + ' from ' + title());
    assert(!item.disabled, 'Disabled ' + prefix + ' in ' + title());
    item.click();
  };
  const back = () => e.get('close-button').click();
  const root = () => {
    scope.Prototype.closeMenu();
    e.get('menu-button').click();
  };

  // First finish the real native Barracks construction. Terrain placement
  // and labor approach are isolated; the quest receipt is not fabricated.
  game.zone().enemies = [];
  game.distanceToRoad = () => 400;
  game.blocked = () => false;
  game.s.recallActive = false;
  assert(game.build());
  const base = game.zone().buildings.find((b) => b.kind === 'barracks');
  const worker = game.s.party.find((u) => u.order?.type === 'build');
  assert(base && worker);
  Object.assign(worker, { x: base.x, y: base.y });
  game.updateParty(4.1);
  assert(game.s.quests['quest-barracks'].paid);
  assert(game.s.quests['quest-tutorial-board'].active);
  assert(!game.s.quests['quest-tutorial-board'].boardOpened);

  const board = game.zone().npcs.find((n) => n.kind === 'quests' && n.id === 'board');
  assert(board);
  Object.assign(game.hero, { x: board.x, y: board.y });
  e.get('touch-interact-button').click();
  assert.equal(title(), t('Quest board', 'Tablón de misiones'));
  assert(game.s.quests['quest-tutorial-board'].boardOpened, 'real Board interaction advances quest');
  assert(actions().some((b) => b.textContent.startsWith(t('Side Quests', 'Misiones secundarias'))));
  const story = game.questDefs().filter((q) => q.kind === 'rescue' && q.region === 'vale')[0];
  assert(story);
  click(story.name);
  assert(game.s.quests['quest-tutorial-board'].storyViewed, 'opening a real Main Story objective');
  back();
  click(t('Side Quests', 'Misiones secundarias'));
  assert(game.s.quests['quest-tutorial-board'].sideViewed, 'visiting real Side Quests');
  back();

  root();
  click(t('Map and travel routes', 'Mapa y rutas de viaje'));
  assert(game.s.quests['quest-tutorial-board'].mapOpened, 'real map opened');
  const cellar = game.mapDestinations().find((p) => p.sideDungeon && p.family === 'side-vale-cellars');
  assert(cellar, 'Old Orchard Cellars in normal map destinations');
  click((cellar.icon || '•') + ' ' + cellar.name);
  click(t('Navigate', 'Ir'));
  assert(game.s.quests['quest-tutorial-board'].navigationUsed, 'real map Navigate action');
  assert(!game.s.quests['quest-tutorial-board'].paid, 'Codex still awaits actual study');

  game.enter('side-vale-cellars');
  const codex = game.zone().npcs.find((n) => n.kind === 'critical-codex');
  assert(codex);
  Object.assign(game.hero, { x: codex.x, y: codex.y });
  e.get('touch-interact-button').click();
  assert(game.s.criticalCodices['side-vale-cellars']);
  assert(game.s.quests['quest-tutorial-board'].paid);

  // First eligible Barracks gathering use is a different contextual quest.
  game.enter('vale');
  game.s.expeditionRank = 2;
  const camp = game.zone().buildings.find((b) => b.id === base.id);
  assert(camp);
  Object.assign(game.hero, { x: camp.x, y: camp.y });
  e.get('touch-interact-button').click();
  click(t('Operations', 'Operaciones'));
  click(t('Gather resources', 'Recoger recursos'));
  assert.equal(title(), t('Gathering basics', 'Lo básico de la recolección'));
  assert(game.s.quests['quest-tutorial-gather'].active);
  click(t('Choose a tribute source', 'Elegir una fuente de tributo'));
  assert.equal(title(), t('Resources & labor', 'Recursos y trabajo'));
  const source = game.visibleResourceNodes()[0];
  assert(source);
  click(t('Recover Dark Lord Tribute', 'Recuperar tributo'));
  assert(game.s.quests['quest-tutorial-gather'].gatherStarted);
  assert(!game.s.quests['quest-tutorial-gather'].gatherDeposited);
  const carrying = game.s.party.filter((u) => u.order?.type === 'gather');
  assert(carrying.length);
  for (const u of carrying) Object.assign(u, { x: source.x, y: source.y });
  for (let i = 0; i < 120 && !carrying.some((u) => u.carry > 0); i++)
    game.updateParty(.1);
  assert(carrying.some((u) => u.carry > 0));
  const supplier = game.zone().npcs.find((n) => n.kind === 'supplier');
  Object.assign(game.hero, { x: supplier.x, y: supplier.y });
  e.get('touch-interact-button').click();
  assert(game.s.quests['quest-tutorial-gather'].paid, 'real deposit completed contextual tutorial');
  assert.equal(game.s.version, 4);
}
console.log('PASS v0.9.2 bilingual production-shell Board, map navigation, Codex and first-use gathering');
