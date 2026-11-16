'use strict';
// #886: production-shell guide scheduler acceptance, not a device FPS claim.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const { shell } = require('./helpers/production-shell.cjs');
for (const language of ['en', 'es']) {
  const { scope, elements, frame } = shell(language);
  const game = scope.Prototype.game;
  game.tick = () => {}; // isolate the browser-shell route refresh from normal AI
  game.hero.level = 2;
  const observer = game.zone().npcs.find((n) => n.thornReport);
  Object.assign(game.hero, { x: observer.x, y: observer.y });
  elements.get('touch-interact-button').click();
  const lead = game.thornWitnessLead();
  const follow = elements.get('modal-actions').children.find((b) =>
    b.textContent.startsWith(language === 'es' ? 'Seguir esta pista' : 'Follow this lead'));
  assert(follow, 'the real bilingual observer route is selectable');
  follow.click();
  assert(scope.Prototype.trackedWaypoint, 'explicit waypoint remains visible');
  game.hero.order = null;
  game.hero.path = [];
  game.hero.x += 120;
  const choice = game.navigationTarget(lead);
  assert(choice?.path.length);
  const native = game.navigationTarget.bind(game);
  let synchronous = 0, budgeted = 0, blocked = 0, generatorCompleted = 0;
  game.navigationTarget = (...args) => {
    synchronous++;
    return native(...args);
  };
  game.budgetedNavigationTarget = function* (destination, origin) {
    budgeted++;
    for (let i = 0; i < 300; i++)
      yield { kind: 'blocked', args: [origin.x, origin.y, game.zoneId, 15] };
    generatorCompleted++;
    return choice; // Native, authored Greenwood path; delayed across frames.
  };
  const nativeBlocked = game.blocked;
  game.blocked = function (...args) {
    blocked++;
    return nativeBlocked.apply(this, args);
  };
  game.s.time += 3;
  let before = blocked;
  frame(100);
  assert.equal(synchronous, 0, 'frame cannot call the legacy synchronous solver');
  assert.equal(budgeted, 1, 'one resumable guide begins after movement');
  assert(blocked - before <= 128,
    'first animation callback respects 128-probe guide quota');
  // Combat must suspend all optional route probes without canceling the guide.
  game.s.squadEngagement = true;
  for (let i = 0; i < 4; i++) {
    before = blocked;
    frame(200 + i * 20);
    assert.equal(blocked - before, 0,
      'no optional route work while squad combat is active');
  }
  game.s.squadEngagement = false;
  // Reposition to a known walkable downstream point WHILE the earlier-origin
  // search is unfinished. The result must reconnect from here, not its start.
  const rejoin = choice.path.slice(0, -1).filter((point) =>
    Math.hypot(point.x - choice.point.x, point.y - choice.point.y) > 25).at(-1);
  assert(rejoin, 'real obstructed Greenwood guide has a safe downstream rejoin');
  Object.assign(game.hero, { x: rejoin.x, y: rejoin.y });
  let completed = false;
  for (let i = 0; i < 80; i++) {
    before = blocked;
    frame(400 + i * 20);
    assert(blocked - before <= 128,
      'each resumed callback respects the route probe quota');
    const active = scope.Prototype.trackedWaypoint;
    if (generatorCompleted && active?.points.length === 1 &&
        active.points[0].x === choice.point.x &&
        active.points[0].y === choice.point.y) {
      completed = true;
      break;
    }
  }
  assert(completed, 'completed guide reconnects to the moved hero with a short current tail');
  assert(game.clearSegment(game.hero, scope.Prototype.trackedWaypoint.points[0], 15, false),
    'the newly published first leg is collision safe from the current hero');
  assert.equal(budgeted, 1, 'single search survives interruption without restarts');
  assert.equal(synchronous, 0, 'passive route never falls back to synchronous BFS');
  // A second pending guide is abandoned by explicit Clear and never resumes.
  game.hero.x += 520;
  game.s.time += 3;
  frame(2500);
  assert.equal(budgeted, 2, 'substantial movement schedules a new bounded search');
  scope.Prototype.cancelNavigation();
  before = blocked;
  frame(2520);
  frame(2540);
  assert.equal(blocked - before, 0, 'Clear cancels pending optional search');
  assert.equal(scope.Prototype.trackedWaypoint, null);
  assert.equal(game.snapshot().version, 4, 'no save-schema migration or new serialized frontier');
  assert(!JSON.stringify(game.snapshot()).includes('"generator"'),
    'live generator is never serialized into the v4 campaign');
}
console.log('PASS #886 bilingual shell: no synchronous guide search, combat deferral, quotas and cancel');
