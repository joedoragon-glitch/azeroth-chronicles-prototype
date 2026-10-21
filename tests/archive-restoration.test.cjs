'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine'),
  Menus = require('../src/prototype/menus');
const g = new C('normal', 'mage', () => 0.9);
g.enter('archive');
const visible = (id) => g.visibleNPCs().filter((n) => n.id === id);
assert.equal(visible('cage-archive').length, 1);
assert.equal(visible('archive-restorer').length, 0);
const normal = g.zone().enemies.find((e) => e.type === 'boss' && e.family === 'archive');
normal.hp = 0;
g.kill(normal);
assert(g.rescue('archive'));
assert.equal(visible('cage-archive').length, 0, 'rescued workstation has no ghost label/shadow');
assert.equal(visible('archive-restorer').length, 0, 'rescue alone does not make the promise');
g.enter('march');
g.refreshNPCs();
assert.equal(
  g.visibleNPCs().filter((n) => n.id === 'service-archive').length,
  1,
  'town services remain',
);
g.enter('archive');
assert(g.promiseKeeper());
assert.equal(visible('archive-restorer').length, 1, 'promise returns Neri freely');
const n = visible('archive-restorer')[0];
assert.equal(n.kind, 'alchemist');
assert.equal(n.presentation, 'archive-restorer');
let shown;
const menus = Menus.create({
  getGame: () => g,
  Campaign: C,
  D: C.data,
  action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
  openMenu: (title, description, actions) => {
    shown = { title, description, actions };
  },
  closeMenu() {},
  recallSquad() {},
  showMap() {},
  finaleMenu() {},
});
menus.supplier(n);
assert(shown.description.includes('by choice'));
assert(shown.actions.some((a) => a.label.includes('Preparation Tonic')));
const visited = [];
for (let i = 0; i < 2400; i++) {
  g.s.time += 0.1;
  g.updateArchiveRestoration(0.1);
  assert(!g.blocked(n.x, n.y), 'civilian stays on walkable floor');
  if (i % 10 === 0) visited.push({ x: n.x, y: n.y });
}
assert(
  Math.max(...visited.map((p) => p.x)) - Math.min(...visited.map((p) => p.x)) > 500,
  'visits separate work wings',
);
assert(
  Math.max(...visited.map((p) => p.y)) - Math.min(...visited.map((p) => p.y)) > 650,
  'visits the soaked lower records',
);
const saved = g.snapshot();
assert(
  !saved.zones.archive.npcs.find((n) => n.id === 'archive-restorer').path,
  'route is runtime-only',
);
const copy = C.restore(saved, () => 0.9);
assert.equal(copy.visibleNPCs().filter((n) => n.id === 'archive-restorer').length, 1);
const old = JSON.parse(JSON.stringify(saved));
old.zones.archive.npcs = old.zones.archive.npcs.filter((n) => n.id !== 'archive-restorer');
assert.equal(
  C.restore(old, () => 0.9)
    .visibleNPCs()
    .filter((n) => n.id === 'archive-restorer').length,
  1,
  'old promised save upgrades automatically',
);
g.s.pending.archive = { kind: 'dungeon', count: 1 };
g.activatePending();
assert.equal(
  visible('archive-restorer').length,
  0,
  'TRUE appearance immediately removes the civilian',
);
const at = { x: n.x, y: n.y };
g.updateArchiveRestoration(1);
assert.deepEqual({ x: n.x, y: n.y }, at);
g.enter('march');
assert(
  g.visibleNPCs().some((n) => n.id === 'service-archive'),
  'town Neri remains available during TRUE encounter',
);
g.enter('archive');
const boss = g
  .zone()
  .enemies.find(
    (e) => e.type === 'boss' && e.family === 'archive' && e.form === 'true' && e.hp > 0,
  );
boss.hp = 0;
g.kill(boss);
assert.equal(visible('archive-restorer').length, 1, 'returns after TRUE defeat');
assert.equal(visible('keeper-captive').length, 1, 'Keeper is back in his cage');
assert.equal(visible('cage-archive').length, 0);
console.log(
  'PASS Neri rescue/promise, ghost removal, voluntary repair tour, town services, TRUE absence/return and old-save continuity',
);
