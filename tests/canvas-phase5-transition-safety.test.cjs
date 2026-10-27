'use strict';
// Phase 5 source/integration gate. Uses the production app and actual native
// travel commit, but does not install a new Canvas cache or modify save rules.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { shell } = require('./helpers/production-shell.cjs');

const flush = async () => { for (let i = 0; i < 60; i++) await Promise.resolve(); };
const source = (name) => fs.readFileSync(require.resolve('../src/prototype/' + name), 'utf8');

function forwardTravel(app) {
  const game = app.scope.Prototype.game;
  const ferry = game.zone().npcs.find(e => e.kind === 'transport' && e.direction === 1);
  assert(ferry, 'actual Vale forward transport exists');
  game.hero.gold = 20000;
  Object.assign(game.hero, { x: ferry.x, y: ferry.y });
  for (const fn of app.events.keydown || [])
    fn({ code: 'KeyF', preventDefault() {}, target: null, repeat: false });
  const travel = app.elements.get('modal-actions').children
    .find(button => button.textContent.startsWith('Travel to '));
  assert(travel && !travel.disabled, 'native travel action available');
  return travel;
}

// The approved Canvas painter remains a single static floor cache, while
// danger warnings, dynamic terrain and entity silhouettes remain separate.
assert.match(source('renderer.js'),
  /groundCache\.draw\(ctx, outdoorGroundOptions\(z, i, size\)\)/);
assert.match(source('renderer.js'),
  /PrototypeCombatVisuals\.ground\(ctx, screen, game, 'fill'/);
assert.match(source('renderer.js'),
  /PrototypeCombatVisuals\.ground\(ctx, screen, game, 'underlay-cue'/);
assert.match(source('renderer.js'), /entities\.sort\(\(a, b\) => a\.x \+ a\.y - b\.x - b\.y\)/);
assert.match(source('renderer.js'),
  /PrototypeVisuals\.draw\(target, e, q, game\.regionIndex\(\), rescued\)/);
assert.doesNotMatch(source('renderer.js'), /CanvasProceduralArtCache|PrototypeProceduralArtCache/);

// Outdoor travel paints only AFTER the native commit, while the loading
// interlude covers the frame; no optional Canvas title-ground work can execute
// in the active scene or near active enemies.
(async () => {
  for (const language of ['en', 'es']) {
    const jobs = [], app = shell(language, 'paladin', { idleCallbacks: jobs });
    const game = app.scope.Prototype.game;
    const startTime = game.s.time, startZone = game.zoneId;
    const passes = [];
    let prepares = 0;
    app.scope.Prototype.renderer.prepareCurrentGround = () => { prepares++; return true; };
    app.scope.Prototype.renderer.draw = () => {
      passes.push({
        loading: app.scope.Prototype.sceneLoading,
        zone: game.zoneId,
        time: game.s.time,
      });
    };
    app.scope.PrototypeSprites = {
      definitionFor: actor => actor.renderKind === 'hero' ? { key: 'hero' } : null,
      warm: () => Promise.resolve(),
    };
    const travel = forwardTravel(app);
    const beforeClick = JSON.stringify(game.snapshot());
    travel.click();
    assert.equal(app.scope.Prototype.sceneLoading, true);
    assert.equal(game.zoneId, startZone, 'preflight must not enter an unconstructed zone');
    assert.equal(JSON.stringify(game.snapshot()), beforeClick,
      'preflight leaves campaign completely unchanged');
    await flush();
    assert.notEqual(game.zoneId, startZone, 'only native commit creates next region');
    assert.equal(game.s.time, startTime, 'preparation does not advance combat clock');
    assert.equal(app.scope.Prototype.sceneLoading, true);
    assert.equal(passes.length, 0, 'first arrival must wait behind loading barrier');
    app.frame(300);
    assert(passes.length >= 1, 'committed arrival is painted');
    assert(passes.every(p => p.loading && p.zone === game.zoneId),
      'never present old zone or uncover a partially painted arrival');
    assert(passes.every(p => p.time === startTime),
      'first painted frame has no unearned combat time');
    assert.equal(app.scope.Prototype.sceneLoading, false);
    assert.equal(prepares, 0, 'do not add synchronous Canvas prepaint during travel');
    for (const job of jobs) job({ timeRemaining: () => 30 });
    assert.equal(prepares, 0, 'stale title idle tasks cannot paint during active play');
    const enemy = game.zone().enemies.find(e => e.hp > 0);
    if (enemy) {
      enemy.aggro = true;
      enemy.telegraph = { type: 'circle', time: 1 };
      Object.assign(enemy, { x: game.hero.x + 40, y: game.hero.y + 40 });
    }
    app.frame(400);
    assert.equal(prepares, 0, 'active combat never triggers optional Canvas prepaint');
  }

  // A hidden PWA after an authorized travel commit must retain that commit,
  // freeze the first hostile frame, then reveal the SAME destination on resume.
  {
    const app = shell('en');
    const game = app.scope.Prototype.game;
    let commitCalls = 0, finishEncounter;
    let warmCalls = 0, paints = 0, prepares = 0;
    const travelOriginal = game.travel.bind(game);
    game.travel = (...args) => {
      commitCalls++;
      return travelOriginal(...args);
    };
    app.scope.PrototypeSprites = {
      definitionFor: actor => actor.renderKind === 'hero' ? { key: 'hero' } : null,
      warm: () => ++warmCalls === 1
        ? Promise.resolve()
        : new Promise(resolve => { finishEncounter = resolve; }),
    };
    app.scope.Prototype.renderer.prepareCurrentGround = () => { prepares++; };
    app.scope.Prototype.renderer.draw = () => { paints++; };
    const action = forwardTravel(app);
    const initialZone = game.zoneId, t0 = game.s.time;
    action.click();
    await flush();
    assert.notEqual(game.zoneId, initialZone, 'real travel committed exactly once');
    const arrival = game.zoneId, arrivalState = JSON.stringify(game.snapshot());
    assert.equal(commitCalls, 1);
    assert.equal(app.scope.Prototype.sceneLoading, true);
    assert.equal(paints, 0, 'optional sprite warmup cannot reveal unpainted arrival');
    assert.equal(typeof finishEncounter, 'function');
    app.scope.document.hidden = true;
    for (const fn of app.documentEvents.visibilitychange || []) fn();
    finishEncounter();
    await flush();
    app.frame(500);
    assert.equal(game.zoneId, arrival);
    assert.equal(game.s.time, t0, 'hiding never ticks the battlefield');
    assert.equal(app.scope.Prototype.sceneLoading, true, 'committed hidden arrival stays covered');
    assert.equal(paints, 0, 'no hidden first-frame painting');
    assert.equal(commitCalls, 1, 'hidden state never duplicates fare/encounter creation');
    assert.equal(JSON.stringify(game.snapshot()), arrivalState,
      'hidden art completion cannot mutate authoritative campaign');
    app.scope.document.hidden = false;
    for (const fn of app.documentEvents.visibilitychange || []) fn();
    app.frame(600);
    assert.equal(app.scope.Prototype.sceneLoading, false);
    assert(paints >= 1, 'resume paints the committed destination');
    assert.equal(commitCalls, 1);
    assert.equal(game.zoneId, arrival);
    assert.equal(game.s.time, t0);
    assert.equal(prepares, 0, 'no idle floor work during hidden/resumed transition');
  }

  // A failed first Canvas drawing has an explicit retry; it must not replay
  // native travel or advance the campaign while the arrival is obscured.
  {
    const app = shell('es');
    const game = app.scope.Prototype.game;
    let drawFails = true, commits = 0, prepares = 0;
    const original = game.travel.bind(game);
    game.travel = (...args) => { commits++; return original(...args); };
    app.scope.Prototype.renderer.prepareCurrentGround = () => { prepares++; };
    app.scope.Prototype.renderer.draw = () => {
      if (drawFails) throw Error('controlled first Canvas draw failure');
    };
    forwardTravel(app).click();
    await flush();
    const arrival = game.zoneId, snapshot = JSON.stringify(game.snapshot());
    app.frame(100);
    assert.equal(app.scope.Prototype.sceneLoading, true, 'paint failure keeps loading barrier');
    assert.equal(app.elements.get('scene-loading-retry').hidden, false);
    assert.equal(commits, 1);
    drawFails = false;
    app.elements.get('scene-loading-retry').click();
    app.frame(200);
    assert.equal(app.scope.Prototype.sceneLoading, false);
    assert.equal(game.zoneId, arrival);
    assert.equal(JSON.stringify(game.snapshot()), snapshot, 'retry does not replay campaign');
    assert.equal(commits, 1);
    assert.equal(prepares, 0);
  }
  console.log('PASS Canvas Phase 5 transition/hostile-frame guards, hide-resume, fallback retry and unchanged native state');
})().catch(error => { console.error(error); process.exitCode = 1; });
