'use strict';
// Focused production-shell regression: Stage 2 navigation ownership.
// Run: node tests/navigation-stage2.test.cjs
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const { shell } = require('./helpers/production-shell.cjs');

for (const language of ['en', 'es']) {
  const { scope, elements, events } = shell(language);
  const game = scope.Prototype.game;
  const t = (en, es) => (language === 'es' ? es : en);
  const menuButton = (prefix) => {
    const item = elements.get('modal-actions').children.find((b) => b.textContent.startsWith(prefix));
    assert(item && !item.disabled, 'available action: ' + prefix);
    return item;
  };
  const cancel = scope.document.body.children.find((child) => child.id === 'cancel-navigation-button');
  assert(cancel, 'the contextual cancel button is mounted');
  assert(cancel.hidden, 'no cancel control before choosing a route');
  const moveKey = (code) => {
    for (const handler of events.keydown || []) handler({ code, preventDefault() {}, target: {} });
  };
  const upKey = (code) => {
    for (const handler of events.keyup || []) handler({ code, target: {} });
  };

  const startMapRoute = () => {
    scope.Prototype.closeMenu();
    elements.get('menu-button').click();
    menuButton(t('Map and travel routes', 'Mapa y rutas de viaje')).click();
    const place = game.mapDestinations().find((site) =>
      Math.hypot(game.hero.x - site.x, game.hero.y - site.y) > 350 &&
      game.navigationTarget(site),
    );
    assert(place, 'a distant walkable authored destination exists');
    menuButton((place.icon || '•') + ' ' + place.name).click();
    const go = elements.get('modal-actions').children.find((b) => b.classList.contains('route-go'));
    assert(go && !go.disabled, 'selected destination has an explicit Navigate action');
    go.click();
    assert(elements.get('modal').hidden);
    assert.equal(game.hero.order?.type, 'move');
    assert(scope.Prototype.trackedWaypoint?.points.length > 0, 'the visible guide is owned');
    assert.equal(scope.Prototype.trackedWaypoint.kind, 'navigation');
    assert(scope.Prototype.navigationState.autopilot);
    assert(!cancel.hidden, 'contextual Cancel appears while a route is active');
    assert.equal(cancel.textContent, t('Cancel navigation', 'Cancelar ruta'));
    return place;
  };

  startMapRoute();
  const originalOrder = game.hero.order;
  const originalGuide = scope.Prototype.trackedWaypoint.points;
  // Menu access preserves a trip while the world is frozen in the modal.
  elements.get('menu-button').click();
  assert.equal(game.hero.order, originalOrder, 'opening menu does not cancel navigation');
  menuButton(t('Map and travel routes', 'Mapa y rutas de viaje')).click();
  menuButton(t('Clear waypoint', 'Quitar ruta')); // Must be available after MAP navigation.
  scope.Prototype.closeMenu();
  assert.equal(game.hero.order, originalOrder, 'closing map does not cancel navigation');

  // A combat input is NOT a manual movement takeover, including an attempted skill.
  moveKey('KeyJ');
  upKey('KeyJ');
  assert.equal(game.hero.order, originalOrder, 'skill attempt keeps automatic walking');
  assert(scope.Prototype.navigationState.autopilot);
  game.castMovementBasic();
  assert.equal(game.hero.order, originalOrder, 'passive attacks do not cancel movement');

  // The actual directional key is the interruption boundary, not combat.
  moveKey('KeyW');
  upKey('KeyW');
  assert.equal(game.hero.order, null, 'manual key movement immediately releases autopilot');
  assert.equal(scope.Prototype.navigationState.autopilot, false);
  assert(scope.Prototype.trackedWaypoint?.points.length > 0,
    'waypoint remains after manual takeover');
  assert.deepEqual(
    JSON.parse(JSON.stringify(scope.Prototype.trackedWaypoint.points)),
    JSON.parse(JSON.stringify(originalGuide)),
    'a canceled order does not relabel a different move path as the waypoint',
  );
  cancel.click();
  assert.equal(scope.Prototype.trackedWaypoint, null);
  assert(!scope.Prototype.navigationState.active);
  assert(cancel.hidden);

  // Contextual Cancel stops an actively owned move, too.
  startMapRoute();
  cancel.click();
  assert.equal(game.hero.order, null);
  assert.equal(scope.Prototype.trackedWaypoint, null);

  // The map's Clear action is the alternative to the HUD button.
  startMapRoute();
  elements.get('menu-button').click();
  menuButton(t('Map and travel routes', 'Mapa y rutas de viaje')).click();
  menuButton(t('Clear waypoint', 'Quitar ruta')).click();
  assert.equal(game.hero.order, null);
  assert.equal(scope.Prototype.trackedWaypoint, null);

  // Guide cancellation cannot erase the saved gathering work assignment.
  const node = game.zone().nodes.find((n) => n.amount > 0);
  assert(node);
  const task = { zone: game.zoneId, id: node.id };
  game.s.gatheringTarget = task;
  // Route-free dismissal does not authorize changing the work order.
  scope.Prototype.cancelNavigation();
  assert.equal(game.s.gatheringTarget, task);
}

// Save/export sanitization: neither new nor historical v4 saves should resume
// an invisible autonomous walk/skill approach with no browser guide to cancel.
const game = new Campaign('normal', 'paladin', () => 0.73);
game.hero.order = { type: 'move', x: 450, y: 650 };
game.hero.path = [{ x: 450, y: 650 }];
const clean = game.snapshot();
assert.equal(clean.hero.order, null);
assert.equal(clean.hero.path, undefined);
const historical = JSON.parse(JSON.stringify(game.s));
const loaded = Campaign.restore(historical, () => 0.73);
assert.equal(loaded.hero.order, null, 'old saved move instructions are cleared on restore');
assert.equal(loaded.hero.path, undefined);
console.log('PASS Stage 2: EN/ES navigation, manual takeover vs skill, cancel, map clear, menu lifecycle, save safety');
