'use strict';
const assert = require('node:assert/strict');
const { shell } = require('./helpers/production-shell.cjs');
const Campaign = require('../src/prototype/engine');
const Menus = require('../src/prototype/menus.js');
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

function openForwardTravel(app) {
  const game = app.scope.Prototype.game;
  const transport = game.zone().npcs.find((npc) => npc.kind === 'transport' && npc.direction === 1);
  assert(transport, 'a real first-region transport is available');
  game.hero.gold = 20000;
  Object.assign(game.hero, { x: transport.x, y: transport.y });
  for (const callback of app.events.keydown || [])
    callback({ code: 'KeyF', preventDefault() {}, target: null, repeat: false });
  const modal = app.elements.get('modal-actions');
  assert(modal, 'the transport interaction opens the existing menu');
  const action = modal.children.find((button) => button.textContent.startsWith('Travel to '));
  assert(action && !action.disabled, 'valid fare and unlocked forward transport');
  return action;
}

(async () => {
  for (const language of ['en', 'es']) {
    const app = shell(language);
    const game = app.scope.Prototype.game;
    assert.equal(app.scope.Prototype.started, true);
    const departure = game.zoneId;
    const destination = Campaign.data.regions[game.regionIndex() + 1].id;
    let resolveWarm;
    const warmed = [];
    app.scope.PrototypeSprites = {
      definitionFor: (actor) => actor.renderKind === 'hero' ? { key: 'tested-hero' } : null,
      warm: (keys) => {
        warmed.push([...keys]);
        return new Promise((resolve) => { resolveWarm = resolve; });
      },
      advance() {},
      beginFrame() {},
      endFrame() {},
      status: () => ({}),
    };
    const action = openForwardTravel(app);
    const snapshot = JSON.stringify(game.snapshot());
    const knownZones = Object.keys(game.s.zones).sort().join(',');
    assert(!game.s.zones[destination], 'the destination is not generated for this test');
    action.click();
    assert.equal(app.scope.Prototype.sceneLoading, true);
    assert.equal(app.elements.get('scene-loading').hidden, false);
    assert.equal(game.zoneId, departure, 'preflight does not enter destination');
    await flush();
    assert.deepEqual(warmed, [['tested-hero']], 'bounded sprite keys come from current appearance');
    assert.equal(JSON.stringify(game.snapshot()), snapshot, 'preflight never mutates authoritative campaign');
    assert.equal(Object.keys(game.s.zones).sort().join(','), knownZones,
      'no speculative authoritative region exists before travel commit');
    assert.equal(app.scope.Prototype.game.s.time, JSON.parse(snapshot).time);
    resolveWarm();
    await flush();
    assert.equal(game.zoneId, destination, 'native travel is committed after preflight');
    assert.equal(app.scope.Prototype.sceneLoading, true, 'scene stays obscured until draw');
    assert.equal(app.elements.get('modal').hidden, true);
    app.frame(500);
    assert.equal(app.scope.Prototype.sceneLoading, false);
    assert.equal(app.elements.get('scene-loading').hidden, true);
    assert.equal(app.scope.Prototype.started, true);
    assert(game.s.zones[destination], 'only native travel generated the destination');
  }

  // A page hidden during pending preflight cancels the COMMIT, even if images finish later.
  {
    const app = shell('en');
    const game = app.scope.Prototype.game;
    let finish;
    app.scope.PrototypeSprites = {
      definitionFor: (actor) => actor.renderKind === 'hero' ? { key: 'current-hero' } : null,
      warm: () => new Promise((resolve) => { finish = resolve; }),
    };
    const travel = openForwardTravel(app);
    const before = JSON.stringify(game.snapshot());
    travel.click();
    await flush();
    app.scope.document.hidden = true;
    for (const listener of app.documentEvents.visibilitychange || []) listener();
    assert.equal(app.scope.Prototype.sceneLoading, false);
    finish();
    await flush();
    assert.equal(JSON.stringify(game.snapshot()), before,
      'late async art completion must not spend fare or move an invisible campaign');
    app.scope.document.hidden = false;
  }

  // A failed native travel keeps the menu and original game state intact.
  {
    const app = shell('en');
    const game = app.scope.Prototype.game;
    const travel = openForwardTravel(app);
    const before = JSON.stringify(game.snapshot());
    game.travel = () => false;
    travel.click();
    assert.equal(app.scope.Prototype.sceneLoading, false);
    assert.equal(app.elements.get('scene-loading').hidden, true);
    assert.equal(app.elements.get('modal').hidden, false);
    assert.equal(JSON.stringify(game.snapshot()), before);
  }

  // Dungeon presentation uses the existing interaction itself as the sole commit.
  {
    const game = new Campaign();
    const entrance = game.zone().npcs.find((npc) => npc.kind === 'dungeon' && !npc.sideDungeon);
    assert(entrance, 'authored regional dungeon entrance available');
    Object.assign(game.hero, { x: entrance.x, y: entrance.y });
    let root;
    let destination = null;
    let committed = false;
    const menus = Menus.create({
      getGame: () => game, Campaign, D: Campaign.data,
      action: (label, fn, detail, disabled) => ({ label, action: fn, disabled }),
      openMenu: (_title, _description, actions) => { root = actions; },
      closeMenu() {},
      sceneTransitionTo: (zone, label, operation) => {
        destination = zone;
        assert.equal(game.zoneId, 'vale', 'no early dungeon entry');
        assert(!game.s.zones[zone], 'preflight must not generate the dungeon');
        assert.equal(typeof operation, 'function');
        committed = true;
      },
    });
    menus.dungeonEntranceMenu(entrance);
    assert(root, 'dungeon menu is offered');
    root.find((item) => item.label === 'Enter dungeon').action();
    assert.equal(destination, entrance.family);
    assert(committed);
    assert.equal(game.zoneId, 'vale');
  }

  console.log('PASS Stage 5 native travel, guarded preflight, loading barrier, cancellation, dungeon admission');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
