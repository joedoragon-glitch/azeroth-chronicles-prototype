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

  // M is the existing map alias; Z remains the configurable default.
  // Tab is already Squad Doctrine and must never be hijacked for Map.
  assert.equal(scope.Prototype.input.actionFor('KeyM'), 'map');
  assert.equal(scope.Prototype.input.actionFor('KeyZ'), 'map');
  assert.equal(scope.Prototype.input.actionFor('Tab'), 'doctrine');
  moveKey('KeyM');
  assert(elements.get('modal').hidden === false, 'M opens the map directly');
  assert(elements.get('modal-title').textContent.endsWith(' map'));
  assert(cancel.hidden, 'merely opening the map must not display Cancel');
  scope.Prototype.closeMenu();
  moveKey('KeyZ');
  assert(!elements.get('modal').hidden, 'the original Z map hotkey remains available');
  assert(cancel.hidden, 'Z map inspection alone does not create navigation');
  scope.Prototype.closeMenu();

  // An ordinary independent tap-to-move order is not a chosen map route.
  game.hero.order = { type: 'move', x: game.hero.x + 120, y: game.hero.y + 40 };
  game.hero.path = [{ x: game.hero.x + 120, y: game.hero.y + 40 }];
  scope.Prototype.updateHUD();
  assert(cancel.hidden, 'ordinary world movement does not invent navigation UI');
  game.hero.order = null;
  game.hero.path = [];

  // A quest waypoint is optional guidance, not an active map-navigation session.
  elements.get('menu-button').click();
  const root = elements.get('modal-actions').children;
  assert(root[1].textContent.includes(t('Map and travel routes', 'Mapa y rutas de viaje')),
    'the map remains prominent in the phone-accessible Adventure menu');
  assert(root[1].children.some((child) => child.textContent.includes('Z / M')),
    'both available map keys are visible without changing bindings');
  menuButton(t('Quest journal', 'Diario de misiones')).click();
  menuButton(t('Your First Company', 'Tu primera compañía')).click();
  scope.Prototype.updateHUD();
  assert.equal(scope.Prototype.trackedQuest, 'quest-barracks');
  assert(cancel.hidden, 'quest-only guidance must not display navigation Cancel');
  scope.Prototype.closeMenu();

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
    assert.equal(game.hero.order.navigation, true,
      'only explicit Navigate marks this move as navigation-owned');
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
  assert(!cancel.hidden, 'manual control keeps Cancel for the remaining navigation guide');
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

  // Pausing is not a directional takeover: the trip remains ready to resume.
  startMapRoute();
  const pauseOrder = game.hero.order;
  moveKey('KeyP');
  upKey('KeyP');
  assert.equal(game.hero.order, pauseOrder, 'pause preserves the active trip');
  moveKey('KeyP');
  upKey('KeyP');
  assert.equal(game.hero.order, pauseOrder, 'resuming does not create a new order');
  cancel.click();

  // The phone joystick claims control as soon as its pointer begins.
  startMapRoute();
  const joystick = elements.get('joystick');
  const bounds = joystick.getBoundingClientRect();
  joystick.onpointerdown({
    pointerType: 'touch',
    pointerId: 901,
    isPrimary: true,
    clientX: bounds.left + bounds.width / 2,
    clientY: bounds.top + bounds.height / 2,
    preventDefault() {},
  });
  assert.equal(game.hero.order, null, 'neutral joystick contact immediately stops autopilot');
  assert.equal(scope.Prototype.navigationState.autopilot, false);
  assert(scope.Prototype.trackedWaypoint?.points.length, 'manual joystick leaves guidance active');
  joystick.onpointerup({ pointerId: 901 });
  cancel.click();

  // A deliberate world tap also takes over, even if the tapped ground is blocked.
  startMapRoute();
  const canvas = elements.get('world');
  const touch = { pointerType: 'touch', button: 0, pointerId: 902,
    clientX: 190, clientY: 510, preventDefault() {} };
  canvas.onpointerdown(touch);
  canvas.onpointerup(touch);
  assert.equal(scope.Prototype.navigationState.autopilot, false,
    'world tap takes over the navigation session');
  assert(scope.Prototype.trackedWaypoint, 'new manual move does not dismiss the selected guide');
  cancel.click();

  // Arrival hides the control as soon as the destination is reached.
  startMapRoute();
  const last = scope.Prototype.trackedWaypoint.points.at(-1);
  const wasAt = { x: game.hero.x, y: game.hero.y };
  Object.assign(game.hero, last);
  scope.Prototype.updateHUD();
  assert(cancel.hidden, 'arrival never leaves a useless Cancel button on screen');
  assert.equal(scope.Prototype.navigationState.active, false);
  scope.Prototype.cancelNavigation();
  Object.assign(game.hero, wasAt);

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

  // Custom keybindings outrank the M convenience alias; no collisions.
  const bindError = scope.Prototype.input.rebind('skill5', 'KeyM');
  assert.equal(bindError, null);
  assert.equal(scope.Prototype.input.actionFor('KeyM'), 'skill5');
  assert.equal(scope.Prototype.input.actionFor('KeyZ'), 'map');

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
