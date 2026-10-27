'use strict';
const assert = require('node:assert/strict');
const { shell } = require('./helpers/production-shell.cjs');
const Campaign = require('../src/prototype/engine');
const Menus = require('../src/prototype/menus.js');
const flush = async () => { for (let i = 0; i < 40; i++) await Promise.resolve(); };

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
    const nativeTravel = game.travel.bind(game);
    game.travel = (...args) => {
      const success = nativeTravel(...args);
      if (success) {
        const zone = game.s.zones[destination];
        const old = zone.enemies.find((e) => e.hp > 0) || { hp: 20, type: 'mob' };
        zone.enemies.unshift({ ...old, id: 'first-encounter',
          hp: 20, x: game.hero.x + 45, y: game.hero.y + 55 });
      }
      return success;
    };
    app.scope.PrototypeSprites = {
      definitionFor: (actor) => actor.renderKind === 'hero' ? { key: 'tested-hero' } :
        actor.renderKind === 'enemy' ? { key: 'threat-' + actor.id } : null,
      warm: (keys, options = {}) => {
        warmed.push({ keys: [...keys], options });
        if (warmed.length === 1) return new Promise((resolve) => { resolveWarm = resolve; });
        return Promise.resolve();
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
    for (const listener of app.events.keydown || [])
      listener({ code: 'Escape', preventDefault() {}, target: null, repeat: false });
    assert.equal(app.scope.Prototype.sceneLoading, true,
      'keyboard Escape cannot close a preparing transition');
    await flush();
    assert.deepEqual(warmed[0].keys, ['tested-hero'],
      'unentered-region preflight cannot manufacture destination enemies');
    assert.equal(JSON.stringify(game.snapshot()), snapshot, 'preflight never mutates authoritative campaign');
    assert.equal(Object.keys(game.s.zones).sort().join(','), knownZones,
      'no speculative authoritative region exists before travel commit');
    assert.equal(app.scope.Prototype.game.s.time, JSON.parse(snapshot).time);
    resolveWarm();
    await flush();
    assert.equal(game.zoneId, destination, 'native travel is committed after preflight');
    assert(warmed.length >= 2, 'committed region prepares real enemies near arrival');
    assert.equal(warmed[1].keys[0], 'threat-first-encounter',
      'imminent enemy art takes priority before hero and scenery');
    assert.equal(warmed[1].options.variants, true);
    assert.equal(warmed[1].options.clips, true);
    assert.equal(app.scope.Prototype.sceneLoading, true, 'scene stays obscured until draw');
    assert.equal(app.elements.get('modal').hidden, true);
    app.frame(500);
    assert.equal(app.scope.Prototype.sceneLoading, false);
    assert.equal(app.elements.get('scene-loading').hidden, true);
    assert.equal(app.scope.Prototype.started, true);
    assert(game.s.zones[destination], 'only native travel generated the destination');
  }

  // Hostile Continue prepares the saved fight before any simulation resumes.
  {
    const app = shell('en', 'ranger', { stayOnTitle: true });
    const game = app.scope.Prototype.game;
    const enemy = game.zone().enemies.find((e) => e.hp > 0);
    assert(enemy);
    Object.assign(enemy, { x: game.hero.x + 60, y: game.hero.y + 45 });
    const seen = [];
    app.scope.PrototypeSprites = {
      definitionFor: (actor) => actor.renderKind === 'enemy'
        ? { key: 'enemy-' + actor.id }
        : actor.renderKind === 'hero' ? { key: 'hero' } : null,
      warm: (keys, options) => {
        seen.push({ keys, options });
        return Promise.resolve();
      },
    };
    app.elements.get('title-continue').click();
    assert.equal(app.scope.Prototype.started, false);
    await flush();
    assert(seen.some((batch) =>
      batch.keys.includes('enemy-' + enemy.id) &&
      batch.options.variants && batch.options.clips),
    'hostile Continue warms the exact nearby enemy and combat frames');
    app.frame(450);
    assert.equal(app.scope.Prototype.started, true);
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


  // Both dungeon types are hot entries: the native zone is admitted first,
  // nearby encounter art can prepare only after real construction, and the
  // combat/world clock stays unchanged until that first view is actually drawn.
  for (const kind of ['main', 'side']) {
    const app = shell('en');
    const game = app.scope.Prototype.game;
    const entrance = game.zone().npcs.find((npc) =>
      npc.kind === 'dungeon' && !!npc.sideDungeon === (kind === 'side'));
    assert(entrance, kind + ' dungeon entrance exists in the authored start region');
    const oldZone = game.zoneId;
    const oldTime = game.s.time;
    let resolveEncounter;
    let warmedAfterAdmission = 0;
    app.scope.PrototypeSprites = {
      definitionFor: (actor) => actor.renderKind === 'hero' ? { key: 'hero-entry' } : null,
      warm: (_keys, opts) => {
        assert.equal(opts.variants, true, 'dungeon arrival warms enemy variants');
        assert.equal(opts.clips, true, 'dungeon arrival warms enemy attack clips');
        assert.equal(game.zoneId, entrance.family,
          'combat dungeon sprite warming happens only after native admission');
        warmedAfterAdmission++;
        return new Promise((resolve) => { resolveEncounter = resolve; });
      },
      advance() {}, beginFrame() {}, endFrame() {}, status: () => ({}),
    };
    Object.assign(game.hero, { x: entrance.x, y: entrance.y });
    for (const fn of app.events.keydown || [])
      fn({ code: 'KeyF', preventDefault() {}, target: null, repeat: false });
    if (kind === 'main') {
      const actions = app.elements.get('modal-actions')?.children || [];
      const enter = actions.find((action) => action.textContent.startsWith('Enter dungeon'));
      assert(enter && !enter.disabled, 'main dungeon action remains explicit');
      enter.click();
    }
    assert.equal(game.zoneId, entrance.family, 'native ' + kind + ' admission committed');
    assert.notEqual(game.zoneId, oldZone);
    assert.equal(app.scope.Prototype.sceneLoading, true, 'arrival remains covered');
    assert.equal(app.elements.get('scene-loading').hidden, false);
    assert(game.zone().enemies.length > 0, 'real hostile dungeon actors exist before reveal');
    await flush();
    assert.equal(warmedAfterAdmission, 1, 'nearby sprites get bounded one-time warming');
    app.frame(200);
    app.frame(400);
    assert.equal(game.s.time, oldTime, 'combat cannot begin while arrival is obscured');
    assert.equal(app.scope.Prototype.sceneLoading, true);
    resolveEncounter();
    await flush();
    app.frame(600);
    assert.equal(app.scope.Prototype.sceneLoading, false);
    assert.equal(app.elements.get('scene-loading').hidden, true);
    assert.equal(game.s.time, oldTime, 'painting/reveal do not advance combat');
  }

  // A first-draw failure never exposes the previous scene or ticks combat.
  // The dedicated retry becomes keyboard-accessible and reveals Canvas only
  // after an actual successful paint of the already committed destination.
  {
    const app = shell('en');
    const game = app.scope.Prototype.game;
    const travel = openForwardTravel(app);
    let broken = true;
    app.scope.Prototype.renderer.draw = () => {
      if (broken) throw Error('simulated Canvas drawing failure');
    };
    travel.click();
    const arrival = game.zoneId;
    assert.notEqual(arrival, 'vale');
    app.frame(100);
    assert.equal(app.scope.Prototype.sceneLoading, true);
    assert.equal(app.elements.get('scene-loading-retry').hidden, false);
    const saved = JSON.stringify(game.snapshot());
    broken = false;
    app.elements.get('scene-loading-retry').click();
    app.frame(200);
    assert.equal(app.scope.Prototype.sceneLoading, false);
    assert.equal(game.zoneId, arrival, 'retry may never replay travel');
    assert.equal(JSON.stringify(game.snapshot()), saved,
      'retry only redraws presentation without modifying campaign progress');
  }

  // Title idle can warm only the selected, previously loaded save's artwork.
  {
    const app = shell('en', 'paladin', { stayOnTitle: true });
    let warmCalls = 0;
    app.scope.PrototypeSprites = {
      definitionFor: (entity) => entity.renderKind === 'hero' ? { key: 'current-save-hero' } : null,
      warm: async (keys) => {
        warmCalls++;
        assert.deepEqual(keys, ['current-save-hero']);
      },
      status: () => ({}),
    };
    app.elements.get('title-saves').click();
    const option = app.elements.get('modal-actions').children
      .find((button) => button.textContent.startsWith('Normal'));
    assert(option && !option.disabled);
    option.click();
    const saved = app.storage.get('azeroth-v4-normal');
    await flush();
    assert(warmCalls > 0, 'selecting a validated save prepares only its own visual resources');
    assert.equal(app.scope.Prototype.started, false);
    assert.equal(app.storage.get('azeroth-v4-normal'), saved,
      'title-only warming cannot rewrite campaign data');
    app.elements.get('title-continue').click();
    await flush();
    app.frame(600);
    assert.equal(app.scope.Prototype.started, true, 'Continue eventually reveals prepared view');
  }

  console.log('PASS Stage 5 native travel, guarded preflight, loading barrier, cancellation, dungeon admission');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
