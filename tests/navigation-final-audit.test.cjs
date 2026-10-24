'use strict';
// Focused regressions for findings A-01 (arrival boundary), A-02 (gathering
// guidance restoration), and A-03 (localized map canvas accessibility).
const assert = require('node:assert/strict');
const { shell } = require('./helpers/production-shell.cjs');

for (const language of ['en', 'es']) {
  const { scope, elements, frame, events } = shell(language);
  const game = scope.Prototype.game;
  const tr = (en, es) => language === 'es' ? es : en;
  const cancel = scope.document.body.children.find(el=>el.id === 'cancel-navigation-button');
  const action = label => elements.get('modal-actions').children
    .find(el=>el.textContent.startsWith(label));
  const beginMap = () => {
    scope.Prototype.closeMenu();
    elements.get('menu-button').click();
    const mapRow = action(tr('Map and travel routes', 'Mapa y rutas de viaje'));
    assert(mapRow, 'accessible Map choice in both languages');
    mapRow.click();
    const canvas = elements.get('modal-description').children
      .find(el=>el.width === 480 && el.height === 320);
    assert(canvas, 'Map canvas is created');
    assert.equal(
      canvas.getAttribute('aria-label'),
      tr('Map of the current area. Select a place to navigate.',
         'Mapa de la zona actual. Selecciona un lugar para navegar.'),
      'A-03: canvas spoken description must follow language preference',
    );
  };
  const navigate = () => {
    beginMap();
    const place = game.mapDestinations().find(p =>
      Math.hypot(p.x-game.hero.x,p.y-game.hero.y) > 350 && game.navigationTarget(p));
    assert(place, 'a reachable authored destination is available');
    const row = action((place.icon || '•') + ' ' + place.name);
    assert(row);
    row.click();
    const go = elements.get('modal-actions').children
      .find(el=>el.classList.contains('route-go'));
    assert(go && !go.disabled);
    go.click();
    assert.equal(game.hero.order?.type, 'move');
    assert(!cancel.hidden);
    return { x: game.hero.order.x, y: game.hero.order.y };
  };
  // Freeze only the simulated engine so each 40/20-unit boundary is examined
  // without a time-step moving the hero. App update/navigation logic runs.
  game.tick = () => {};
  const gathering = game.zone().nodes.find(node =>
    node.amount > 0 &&
    Math.hypot(node.x-game.hero.x,node.y-game.hero.y) > 170 &&
    game.navigationTarget(node));
  assert(gathering, 'existing active gathering node for guidance restoration');
  const task = { zone: game.zoneId, id: gathering.id };
  game.s.gatheringTarget = task;
  frame(100);
  assert.equal(scope.Prototype.trackedWaypoint?.kind, 'gathering',
    'preexisting gathering task is visibly tracked before map takeover');
  const goal = navigate();
  assert.equal(scope.Prototype.trackedWaypoint.kind, 'navigation',
    'Map takes visual priority while autopilot is active');
  const old = { x: game.hero.x, y: game.hero.y };
  const owned = game.hero.order;

  Object.assign(game.hero, { x: goal.x - 40, y: goal.y });
  scope.Prototype.updateHUD();
  frame(200);
  assert.equal(game.hero.order, owned, 'test retains the active navigation order');
  assert(scope.Prototype.navigationState.active && scope.Prototype.navigationState.autopilot,
    'A-01: at 40 units the map route is still active');
  assert.equal(scope.Prototype.trackedWaypoint?.kind,'navigation');
  assert(!cancel.hidden, 'A-01: Cancel cannot disappear while moving within 40 units');

  // Even inside the engine's 25-unit arrival window, the owned move must be
  // explicitly retired before UI completion can be declared.
  Object.assign(game.hero, { x: goal.x - 20, y: goal.y });
  scope.Prototype.updateHUD();
  assert(!cancel.hidden, 'the final move order still has an available Cancel button');
  assert(scope.Prototype.navigationState.autopilot);
  game.hero.order = null;
  game.hero.path = [];
  frame(300);
  scope.Prototype.updateHUD();
  assert(!scope.Prototype.navigationState.active,
    'the navigation session ends only once its movement finishes');
  assert(cancel.hidden, 'Cancel disappears on actual completed arrival');
  assert.equal(scope.Prototype.trackedWaypoint?.kind, 'gathering',
    'A-02: the interrupted gathering guide returns after natural arrival');
  assert.equal(game.s.gatheringTarget, task,
    'gathering work and its saved task identity are never affected');

  // Deliberate manual takeover near the endpoint does not lose Cancel or
  // discard the destination. Reaching it manually restores passive guidance.
  Object.assign(game.hero, old);
  const manualGoal = navigate();
  Object.assign(game.hero, { x: manualGoal.x - 40, y: manualGoal.y });
  for (const handler of events.keydown || [])
    handler({ code: 'KeyW', target: {}, preventDefault() {}, repeat: false });
  for (const handler of events.keyup || [])
    handler({ code: 'KeyW', target: {} });
  scope.Prototype.updateHUD();
  assert(scope.Prototype.navigationState.active &&
    !scope.Prototype.navigationState.autopilot,
    'manual movement at 40 units switches to guidance-only');
  assert(!cancel.hidden, 'manual travel still offers Cancel near the destination');
  Object.assign(game.hero, { x: manualGoal.x - 20, y: manualGoal.y });
  frame(350);
  scope.Prototype.updateHUD();
  assert(cancel.hidden, 'manual arrival ends the guidance-only session');
  assert.equal(scope.Prototype.trackedWaypoint?.kind, 'gathering',
    'a successful manual arrival also restores the earlier gathering guide');

  // Explicit Cancel means dismiss guidance, NOT silently resume the old
  // gathering waypoint. The companion's gathering assignment stays intact.
  Object.assign(game.hero, old);
  navigate();
  scope.Prototype.cancelNavigation();
  frame(400);
  assert.equal(scope.Prototype.trackedWaypoint, null,
    'explicit Cancel clears the active waypoint without reinstating gathering');
  assert(cancel.hidden);
  assert.equal(game.s.gatheringTarget, task,
    'Cancel never cancels the companion gathering task');
}
console.log('PASS final audit A-01/A-02/A-03: arrival-owned Cancel, gathering resume versus clear, bilingual ARIA');
