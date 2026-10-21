'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine'),
  Menus = require('../src/prototype/menus');
const fresh = () => new C('normal', 'paladin', () => 0.73);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const kill = (g, e) => {
  e.hp = 0;
  e.heroParticipated = true;
  g.kill(e);
};
let plots = 0;
for (const r of C.data.regions) {
  const base = fresh();
  base.enter(r.id);
  for (const n of base
    .zone()
    .npcs.filter((n) => n.kind === 'dungeon' && !base.sideDungeon(n.family))) {
    const g = C.restore(base.snapshot());
    g.zone().enemies = [];
    Object.assign(g.hero, { x: n.x, y: n.y });
    g.s.party = [g.unit('soldier', n.x, n.y)];
    const gold = g.hero.gold;
    assert(g.prepareDungeonCamp(n), n.name);
    const b = g.dungeonCamp(n);
    assert(b && b.progress < 4 && b.recoveryOnComplete, n.name);
    assert(distance(b, n) <= 650 && g.route(n, b).length, n.name + ' physical nearby camp');
    assert.equal(g.hero.gold, gold, 'first camp is free');
    assert(!g.selectedBarracksRespawn(), 'unfinished camp is not a respawn');
    const h = C.restore(g.snapshot()),
      worker = h.s.party[0],
      camp = h.zone().buildings[0];
    Object.assign(worker, { x: camp.x, y: camp.y });
    for (let t = 0; t < 45; t++) h.updateParty(0.1);
    assert.equal(camp.progress, 4, n.name);
    assert.equal(h.selectedBarracksRespawn().barracks.id, camp.id);
    assert(!camp.recoveryOnComplete);
    assert(h.prepareDungeonCamp(n), 'reuse existing camp');
    assert.equal(h.zone().buildings.length, 1, 'no duplicate construction');
    assert.equal(h.hero.gold, gold, 'reuse costs nothing');
    h.enter(n.family);
    h.hero.gold = 100;
    h.die();
    assert.equal(h.zoneId, r.id);
    assert.equal(h.selectedBarracksRespawn().barracks.id, camp.id);
    assert(distance(h.hero, camp) < 120, 'dungeon defeat uses outside camp');
    plots++;
  }
}
{
  const g = fresh(),
    n = g.zone().npcs.find((n) => n.kind === 'dungeon');
  Object.assign(g.hero, n);
  g.s.party = [];
  assert(g.dungeonCampReason(n).includes('Soldier or Ranger'));
  g.s.party = [g.unit('pet', n.x, n.y, 'ridge')];
  assert(
    g.dungeonCampReason(n).includes('Soldier or Ranger'),
    'Treasurer resource exception does not add construction',
  );
  g.s.party = [g.unit('soldier', n.x, n.y)];
  g.s.challenge.succession = true;
  assert(g.dungeonCampReason(n).includes('Succession'));
  g.s.challenge.succession = false;
  assert(g.prepareDungeonCamp(n));
  const b = g.dungeonCamp(n);
  g.recallParty();
  assert(g.prepareDungeonCamp(n), 'resumes cancelled construction');
  assert.equal(g.zone().buildings.length, 1);
  const bad = g.snapshot();
  bad.zones.vale.buildings[0].recoveryOnComplete = 'yes';
  assert.throws(() => C.restore(bad));
  let menu,
    closed = false;
  const catalog = Menus.create({
    getGame: () => g,
    Campaign: C,
    D: C.data,
    action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
    openMenu: (title, description, actions) => {
      menu = { title, description, actions };
    },
    closeMenu: () => {
      closed = true;
    },
    recallSquad() {},
    showMap() {},
    finaleMenu() {},
  });
  catalog.dungeonEntranceMenu(n);
  assert.equal(menu, undefined, 'already requested camp skips entrance prompt');
  assert(closed);
  assert.equal(g.zoneId, n.family);
  g.enter('vale', { x: n.x, y: n.y });
  g.zone().buildings = [];
  closed = false;
  catalog.dungeonEntranceMenu(n);
  assert.equal(menu.actions.length, 2);
  assert(menu.description.includes('Leaving resets an unfinished'));
  menu.actions[0].action();
  assert(closed);
  assert.equal(g.zoneId, n.family);
}
{
  const g = fresh();
  g.enter('crypt');
  const original = g.zone().enemies.filter((e) => e.guard && !e.reinforcement),
    first = original[0],
    second = original[1],
    boss = g.zone().enemies.find((e) => e.type === 'boss');
  kill(g, first);
  kill(g, second);
  original[2].hp = 1;
  boss.hp = 1;
  boss.slow = 30;
  boss.telegraph = { timer: 5 };
  const summon = g.makeEnemy(
    { species: 'skeleton', hp: 50, damage: 2, level: 1, gold: 0, xp: 0 },
    { x: 600, y: 600 },
  );
  summon.summon = true;
  g.zone().enemies.push(summon);
  const rein = { ...original[3], id: 'reinforcement-fixture', reinforcement: true };
  g.zone().enemies.push(rein);
  const exit = g.zone().npcs.find((n) => n.kind === 'exit');
  Object.assign(g.hero, { x: exit.x, y: exit.y });
  assert(g.interact(exit));
  assert.equal(g.zoneId, 'vale');
  const entrance = g.zone().npcs.find((n) => n.family === 'crypt');
  assert(distance(g.hero, entrance) < 100, 'exit returns to entrance');
  const room = g.s.zones.crypt;
  assert.equal(room.enemies.filter((e) => e.guard).length, original.length);
  assert(!room.enemies.some((e) => e.summon || e.reinforcement));
  for (const e of room.enemies.filter((e) => e.guard)) assert.equal(e.hp, e.baseHp);
  const b = room.enemies.find((e) => e.id === boss.id);
  assert.equal(b.hp, b.baseHp);
  assert(!b.slow && !b.telegraph);
  assert(!Object.values(g.s.pending).some((p) => p.kind === 'mob' && p.zone === 'crypt'));
  let h = C.restore(g.snapshot(), () => 0.73);
  h.enter('crypt');
  const again = h.zone().enemies.find((e) => e.id === first.id);
  assert(again.hp > 0);
  assert.equal(again.gold, 0);
  assert.equal(again.xp, 0);
  h.enter('vale');
  h.enter('crypt');
  assert.equal(
    h.zone().enemies.filter((e) => e.guard).length,
    original.length,
    'no wave accumulation',
  );
  const nativeBoss = h.zone().enemies.find((e) => e.type === 'boss' && e.form === 'normal');
  kill(h, nativeBoss);
  assert(h.s.normal.crypt);
  h.s.rescued.crypt = true;
  h.enter('vale');
  h.enter('crypt');
  assert(h.s.normal.crypt && h.s.rescued.crypt);
  assert(
    !h.zone().enemies.some((e) => e.guard && e.hp > 0),
    'defeated boss does not leave an immediate new garrison',
  );
  assert(
    !h.zone().enemies.some((e) => e.type === 'boss' && e.form === 'normal' && e.hp > 0),
    'won boss stays won',
  );
}
{
  const g = fresh();
  g.s.normal.crypt = true;
  g.s.phase = 'awakening';
  g.s.awakeningLevel = 20;
  g.s.pending.crypt = { kind: 'dungeon', count: 1 };
  g.enter('crypt');
  const count = g.zone().enemies.filter((e) => e.guard).length,
    boss = g.zone().enemies.find((e) => e.type === 'boss' && e.form === 'true');
  assert(count > 0 && boss);
  kill(
    g,
    g.zone().enemies.find((e) => e.guard),
  );
  boss.hp = 1;
  g.enter('vale');
  g.enter('crypt');
  assert.equal(g.zone().enemies.filter((e) => e.guard).length, count);
  assert.equal(g.zone().enemies.filter((e) => e.guard && e.hp > 0).length, count);
  const restored = g
    .zone()
    .enemies.filter((e) => e.type === 'boss' && e.form === 'true' && e.hp > 0);
  assert.equal(restored.length, 1);
  assert.equal(restored[0].hp, restored[0].baseHp);
}
for (const site of C.rules.treasuryRecovery.sites.filter((s) => s.zone !== s.region)) {
  const g = fresh();
  g.enter(site.zone);
  const z = g.zone(),
    count = z.enemies.filter((e) => e.roomGuard && !e.reinforcement).length;
  const captain = g.treasuryCaptain(z, site),
    guard = z.enemies.find((e) => e !== captain && e.roomGuard);
  kill(g, guard);
  captain.hp = 1;
  g.enter(site.region);
  g.enter(site.zone);
  assert.equal(
    g.zone().enemies.filter((e) => e.roomGuard && e.hp > 0).length,
    count,
    'unfinished attempt restores full garrison',
  );
  const leader = g.treasuryCaptain(g.zone(), site);
  kill(g, leader);
  const state = g.treasuryRecoveryState(site.region),
    deadline = state.respawnAt;
  state.crowns = 123;
  g.s.discovered[site.region + ':bundle-0'] = true;
  assert(
    g.zone().enemies.every((e) => e.neutral || e.hp <= 0),
    'captain victory empties Treasury',
  );
  g.enter(site.region);
  g.enter(site.zone);
  assert.equal(state.respawnAt, deadline, 'doors cannot restart or skip captain cooldown');
  assert(state.unlocked);
  assert(g.zone().enemies.every((e) => e.neutral || e.hp <= 0));
  assert.equal(state.crowns, 123);
  assert(g.s.discovered[site.region + ':bundle-0']);
  g.s.time = deadline - 0.1;
  g.enter(site.region);
  g.enter(site.zone);
  assert(
    g.zone().enemies.every((e) => e.neutral || e.hp <= 0),
    'still empty immediately before due return',
  );
  g.s.time = deadline + 1;
  g.enter(site.region);
  g.enter(site.zone);
  assert(g.treasuryCaptain(g.zone(), site).hp > 0, 'captain returns only when due');
  assert.equal(
    g.zone().enemies.filter((e) => e.roomGuard && e.hp > 0).length,
    count,
    'entire garrison returns with captain',
  );
  assert(!state.unlocked);
  assert.equal(state.crowns, 123);
}
{
  const g = fresh();
  g.enter('side-vale-cellars');
  const dead = g.zone().enemies[0];
  kill(g, dead);
  g.enter('vale');
  g.enter('side-vale-cellars');
  assert.equal(
    g.zone().enemies.find((e) => e.id === dead.id).hp,
    0,
    'side dungeon retains its existing behavior',
  );
  g.enter('vale');
  const n = g.zone().npcs.find((n) => n.family === 'side-vale-cellars');
  Object.assign(g.hero, { x: n.x, y: n.y });
  assert(!g.dungeonEntrance(n), 'side entrance has no preparation menu');
}

{
  const g = fresh(),
    n = g.zone().npcs.find((n) => n.family === 'crypt');
  Object.assign(g.hero, { x: n.x, y: n.y });
  g.zone().enemies = [];
  g.s.party = [g.unit('soldier', n.x, n.y)];
  assert(g.build());
  const b = g.zone().buildings[0];
  b.progress = 4;
  assert(
    !b.dungeonEntrance && g.dungeonCamp(n) === b,
    'a genuinely nearby ordinary camp qualifies',
  );
  const selectedBefore = g.s.barracksRespawn;
  let opened = false;
  const catalog = Menus.create({
    getGame: () => g,
    Campaign: C,
    D: C.data,
    action: () => {},
    openMenu: () => {
      opened = true;
    },
    closeMenu() {},
    recallSquad() {},
    showMap() {},
    finaleMenu() {},
  });
  catalog.dungeonEntranceMenu(n);
  assert(!opened);
  assert.equal(g.zoneId, 'crypt');
  assert.deepEqual(
    g.s.barracksRespawn,
    selectedBefore,
    'auto-entry preserves the chosen recovery point',
  );
}
console.log(
  'PASS ' +
    plots +
    ' entrance plots, construction/reuse/save/respawn, two-choice menu/blockers, exit arrival, normal/TRUE defenders, no accumulated waves or repeated enemy rewards, victories/rescues and Treasury balances/collections.',
);
