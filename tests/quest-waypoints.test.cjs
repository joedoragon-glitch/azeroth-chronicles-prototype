'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine'),
  Menus = require('../src/prototype/menus');
const g = new C('normal', 'mage', () => 0.9);
let dest = g.questDestination('quest-2');
assert.equal(dest.family, 'supply-vale');
g.enter('supply-vale');
dest = g.questDestination('quest-2');
assert.equal(dest.kind, 'bundle');
const first = dest.index;
g.s.discovered['vale:bundle-' + first] = true;
assert.notEqual(g.questDestination('quest-2').index, first);
g.s.quests['quest-2'].paid = true;
assert.equal(g.questDestination('quest-2'), null);
g.enter('vale');
assert.equal(g.questDestination('quest-3').family, 'crypt');
g.enter('crypt');
assert.equal(g.questDestination('quest-3').family, 'crypt');
g.s.keys.crypt = true;
assert.equal(g.questDestination('quest-3').kind, 'cage');
assert.equal(g.questDestination('quest-4').kind, 'exit', 'foreign interior routes to its exit');
g.enter('vale');
assert.equal(g.questDestination('quest-7').kind, 'transport');
assert(g.questDestination('quest-1')?.type === 'mob');
const site = g.questDestination('quest-4');
assert(site?.id);
g.s.discovered['vale:' + site.id] = true;
assert.notEqual(g.questDestination('quest-4')?.id, site.id);
let menu, tracked;
const ui = Menus.create({
  getGame: () => g,
  Campaign: C,
  D: C.data,
  action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
  openMenu: (title, description, actions) => {
    menu = { title, actions };
  },
  closeMenu() {},
  recallSquad() {},
  showMap() {},
  finaleMenu() {},
  storyNavigate: (dest, label, id) => {
    tracked = { dest, label, id };
  },
});
for (const board of [true, false]) {
  ui.quests(board);
  const row = menu.actions.find((a) =>
    a.label.startsWith(g.questDefs().find((q) => q.id === 'quest-4').name),
  );
  assert(row && !row.disabled);
  row.action();
  assert.equal(tracked.id, 'quest-4');
}
for (const room of C.rules.supplyRooms) {
  const c = new C('normal', 'mage', () => 0.9);
  c.s.expeditionRank = 6;
  c.s.party = Array.from({ length: 6 }, () => c.unit('soldier', 300, 130));
  c.enter(room.id);
  const exit = c.zone().npcs.find((n) => n.kind === 'exit');
  assert.deepEqual({ x: exit.x, y: exit.y }, C.rules.treasuryEntry.exit);
  const actors = [c.hero, ...c.activeParty()];
  for (const a of actors) {
    assert(!c.blocked(a.x, a.y));
    assert(
      c
        .zone()
        .enemies.filter((e) => e.hp > 0)
        .every((e) => Math.hypot(e.x - a.x, e.y - a.y) > c.enemyAcquisitionRange(e)),
    );
  }
  for (let i = 0; i < actors.length; i++)
    for (let j = i + 1; j < actors.length; j++)
      assert(Math.hypot(actors[i].x - actors[j].x, actors[i].y - actors[j].y) >= 28);
  const before = c.snapshot();
  delete before.zones[room.id].treasuryEntryVersion;
  const oldExit = before.zones[room.id].npcs.find((n) => n.kind === 'exit');
  Object.assign(oldExit, { x: 125, y: 155 });
  const restored = C.restore(before, () => 0.9);
  assert.equal(restored.zone().npcs.find((n) => n.kind === 'exit').x, 60);
  assert.equal(restored.hero.x, c.hero.x);
  assert.deepEqual(restored.s.discovered, c.s.discovered);
}
console.log(
  'PASS quest objectives, cache progression/completion, region/interior transitions, shared quest menu callbacks; four Treasury corner entries, quiet distinct party staging and save migration',
);
