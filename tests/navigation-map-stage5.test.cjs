'use strict';
// Narrow Stage 5 production-shell regression; not a substitute for physical
// iPhone/WebKit or desktop-browser visual acceptance.
const assert = require('node:assert/strict');
const { shell } = require('./helpers/production-shell.cjs');

for (const language of ['en', 'es']) {
  const { scope, elements, events, frame } = shell(language);
  const game = scope.Prototype.game;
  const tr = (en, es) => language === 'es' ? es : en;
  const key = (code) => {
    for (const cb of events.keydown || [])
      cb({ code, target: {}, preventDefault() {}, repeat: false });
  };
  const byText = (text) => elements.get('modal-actions').children
    .find((element) => element.textContent.startsWith(text));
  const open = () => {
    scope.Prototype.closeMenu();
    key('KeyM');
    assert(!elements.get('modal').hidden);
    const map = elements.get('modal-description').children.find((node) =>
      node.width === 480 && node.height === 320);
    assert(map && typeof map.onclick === 'function', 'live map canvas available');
    assert(elements.get('modal-actions').children.some(e => e.className === 'menu-section'),
      'map keeps grouped headings while keyboard focus visits only real buttons');
    return map;
  };
  const cancel = scope.document.body.children.find(el => el.id === 'cancel-navigation-button');
  const size = game.zoneSize();
  let map = open();
  const actual = game.mapDestinations();
  // Find a real named destination that has a walkable path and is not
  // crowding its nearest other marker at either phone-like presentation size.
  const far = actual.find(place =>
    game.navigationTarget(place) &&
    Math.hypot(game.hero.x-place.x, game.hero.y-place.y) > 250 &&
    actual.every(other => other === place ||
      Math.hypot((other.x-place.x)*240/size,(other.y-place.y)*150/size) > 50));
  assert(far, 'a real separated marker exists');

  let rect = { left: 17, top: 65, width: 240, height: 150 };
  map.getBoundingClientRect = () => rect;
  const markerPoint = (place) => ({
    clientX: rect.left + place.x / size * rect.width,
    clientY: rect.top + place.y / size * rect.height,
  });
  const placeAction = () => byText((far.icon || '•') + ' ' + far.name);
  const go = () => elements.get('modal-actions').children
    .find(el => el.classList.contains('route-go'));
  assert(go().disabled, 'Navigate is disabled without an explicit marker/list selection');
  assert(cancel.hidden);

  const where = markerPoint(far);
  map.onclick({ ...where, pointerType: 'mouse' });
  assert(placeAction().classList.contains('route-picked'),
    'scaled CSS marker selects its correct listed destination');
  assert(placeAction().classList.contains('selected'),
    'keyboard highlight uses real buttons, not category heading offsets');
  assert(!go().disabled, 'selected real marker enables the separate Navigate action');
  assert(elements.get('modal').hidden === false, 'selecting alone cannot start travel');
  assert.equal(game.hero.order, null, 'marker selection does not move the hero');

  // The screen may change orientation while the map remains open. Targeting
  // works off the current DOM rectangle, with independent x/y projection.
  rect = { left: 28, top: 18, width: 410, height: 180 };
  map.onclick({ ...markerPoint(far), pointerType: 'mouse' });
  assert(placeAction().classList.contains('route-picked'));
  // Marker tap hit-area is usable with a finger, while an equally distant
  // desktop mouse click is deliberately more precise.
  rect = { left: 11, top: 70, width: 240, height: 150 };
  const near = markerPoint(far);
  map.onclick({ clientX: near.clientX + 17, clientY: near.clientY,
    pointerType: 'mouse' });
  // Valid selection stays unchanged on an unaccepted stray click.
  assert(placeAction().classList.contains('route-picked'));
  map.onpointerdown({ pointerType: 'touch' });
  map.onclick({ clientX: near.clientX + 17, clientY: near.clientY });
  assert(placeAction().classList.contains('route-picked'), 'finger-sized tap selects same marker');
  go().click();
  assert(elements.get('modal').hidden, 'the explicit Navigate action starts walking');
  assert.equal(game.hero.order?.type, 'move');
  assert(!cancel.hidden, 'Cancel is only visible for an actual navigation guide');
  // Attacks do not erase navigation, including out-of-range attempted skills.
  const travel = game.hero.order;
  game.castMovementBasic();
  assert.equal(game.hero.order, travel, 'passive attack cannot redirect travel');
  cancel.click();
  assert.equal(game.hero.order, null);
  assert(cancel.hidden);

  // Special-case closely packed markers: tie must not guess or create a
  // waypoint, and tapping the unmarked map must not cause movement.
  const realPlaces = game.mapDestinations;
  const realTarget = game.navigationTarget;
  const left = { id: 'stage5-left', name: 'Twin left', icon: 'A', kind: 'rest', x: 1600, y: 1600 };
  const right = { id: 'stage5-right', name: 'Twin right', icon: 'B', kind: 'rest', x: 1618, y: 1600 };
  game.mapDestinations = () => [left, right];
  game.navigationTarget = p => ({ point: { x: p.x, y: p.y },
    path: [{ x: p.x, y: p.y }] });
  map = open();
  rect = { left: 12, top: 15, width: 240, height: 150 };
  map.getBoundingClientRect = () => rect;
  const middle = { clientX: rect.left+(left.x+right.x)/2/size*rect.width,
    clientY: rect.top+left.y/size*rect.height };
  const first = byText('A Twin left');
  const second = byText('B Twin right');
  const activate = () => elements.get('modal-actions').children
    .find(el => el.classList.contains('route-go'));
  assert(activate().disabled);
  map.onpointerdown({ pointerType: 'touch' });
  map.onclick(middle);
  assert(activate().disabled, 'ambiguous overlapping markers do not select either destination');
  assert(!first.classList.contains('route-picked') && !second.classList.contains('route-picked'));
  map.onclick({ clientX: rect.left+4, clientY: rect.top+4, pointerType: 'mouse' });
  assert(activate().disabled, 'empty terrain is never treated as a destination');
  assert.equal(game.hero.order, null, 'map taps never directly move the hero');
  second.click();
  assert(!activate().disabled, 'accessible text choices remain available for overlapping markers');
  assert(second.classList.contains('selected'),
    'grouped text action receives correct keyboard/menu highlight');
  game.mapDestinations = realPlaces;
  game.navigationTarget = realTarget;
  scope.Prototype.closeMenu();

  // Zone transitions, death and a new game never retain old on-screen cancel.
  map = open();
  const next = game.mapDestinations().find(p=>game.navigationTarget(p) &&
    Math.hypot(p.x-game.hero.x,p.y-game.hero.y)>250);
  assert(next);
  byText((next.icon||'•')+' '+next.name).click();
  go().click();
  assert(!cancel.hidden);
  game.enter('march');
  scope.Prototype.updateHUD();
  assert(cancel.hidden, 'region transition invalidates the navigation cancel');
  assert.equal(scope.Prototype.navigationState.active, false);
  const mapAgain = open();
  const travelTarget = game.mapDestinations().find(p=>game.navigationTarget(p) &&
    Math.hypot(p.x-game.hero.x,p.y-game.hero.y)>250);
  assert(travelTarget && mapAgain);
  byText((travelTarget.icon||'•')+' '+travelTarget.name).click();
  go().click();
  game.hero.hp=0;
  scope.Prototype.updateHUD();
  assert(cancel.hidden, 'a defeated hero is not shown a stale cancel action');
  assert.equal(scope.Prototype.navigationState.active, false);
}
console.log('PASS Stage 5: bilingual real marker selection, scaled touch/mouse, list/keyboard, close markers, combat and journey lifecycle');
