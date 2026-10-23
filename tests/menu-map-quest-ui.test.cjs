'use strict';
const assert = require('node:assert/strict');
const { shell } = require('./helpers/production-shell.cjs');

for (const language of ['en', 'es']) {
  const { scope: s, elements: e, events } = shell(language);
  const g = s.Prototype.game;
  const tr = (en, es) => language === 'en' ? en : es;
  const title = () => e.get('modal-title').textContent;
  const menu = () => e.get('modal-actions').children;
  const click = (prefix) => {
    const button = menu().find((b) => b.textContent.startsWith(prefix));
    assert(button, 'Missing menu choice: ' + prefix + ' in ' + title());
    assert(!button.disabled, 'Disabled menu choice: ' + prefix);
    button.click();
  };
  const back = () => e.get('close-button').click();
  const openRoot = () => {
    s.Prototype.closeMenu();
    e.get('menu-button').click();
  };
  const baseline = JSON.stringify(g.snapshot());

  openRoot();
  click(tr('Map and travel routes', 'Mapa y rutas de viaje'));
  assert.match(title(), /map|mapa/);
  const places = g.mapDestinations();
  const sections = menu().filter((n) => n.className === 'menu-section');
  assert(sections.length >= 2, 'map separates different kinds of available destinations');
  const placeButtons = menu().filter((n) => typeof n.onclick === 'function');
  assert.equal(placeButtons.length, places.length + 1, 'no route choices were lost');
  assert(placeButtons[0].disabled, 'Navigate is unavailable until a destination is selected');
  const town = places.find((p) => p.kind === 'rest' && p.id === 'rest');
  assert(town);
  const label = (town.icon || '•') + ' ' + town.name;
  click(label);
  const townButton = placeButtons.find((b) => b.textContent.startsWith(label));
  assert(townButton.classList.contains('route-picked'), 'picked destination is highlighted');
  assert(!placeButtons[0].disabled, 'a valid route enables Navigate');
  assert(placeButtons[0].textContent.startsWith(tr('Navigate', 'Ir')));
  assert.equal(
    placeButtons.filter((b) => b.classList.contains('route-picked')).length,
    1,
    'only the current destination is highlighted',
  );
  const actualMap = e.get('modal-description').children.find((n) => n.width === 480);
  assert(actualMap?.onclick, 'interactive map canvas remains available');
  const size = g.zoneSize();
  actualMap.onclick({
    clientX: 12 + (town.x / size) * 110,
    clientY: 670 + (town.y / size) * 110,
  });
  assert(townButton.classList.contains('route-picked'), 'map coordinate selection matches the list');
  placeButtons[0].click();
  assert(e.get('modal').hidden, 'Navigate closes the map');
  assert.equal(g.hero.order?.type, 'move');
  assert(g.hero.path.length, 'native wayfinding still sets a route');

  openRoot();
  click(tr('Quest journal', 'Diario de misiones'));
  assert.equal(title(), tr('Quest journal', 'Diario de misiones'));
  click(tr('Side Quests', 'Misiones secundarias'));
  assert.equal(title(), tr('Side Quests', 'Misiones secundarias'));
  assert(menu().some((b) => b.textContent.startsWith(tr('Completed quests', 'Misiones completadas'))));
  back();
  assert.equal(title(), tr('Quest journal', 'Diario de misiones'));
  click(tr('Completed quests', 'Misiones completadas'));
  assert.equal(title(), tr('Completed quests', 'Misiones completadas'));
  assert(menu().every((b) => b.disabled || !/Complete|Completad/.test(b.textContent)),
    'finished objectives remain read-only');
  back();
  click(tr('Announcements', 'Anuncios'));
  assert.equal(title(), tr('Announcements', 'Anuncios'));
  back();
  assert.equal(title(), tr('Quest journal', 'Diario de misiones'));
  back();
  assert.equal(title(), tr('Adventure menu', 'Menú de aventura'));
  s.Prototype.closeMenu();
  assert(!g.s.quests['quest-barracks'].paid, 'menu inspection does not complete a tutorial quest');

  // Re-opening the map after starting a route must never produce a phantom
  // command or alter campaign progression.
  assert.equal(g.hero.order, null, 'reopening a menu cancels ongoing movement as before');
  assert.equal(
    JSON.stringify(g.snapshot()),
    baseline,
    'map and journal inspection preserve the campaign state and rewards',
  );
}
console.log('PASS bilingual grouped map routes, canvas selection, quest navigation, Back and saved state');
