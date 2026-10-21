'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine'),
  R = C.rules,
  oldRoot = process.env.MARCHES_PREVIOUS_ROOT,
  Old = oldRoot ? require(oldRoot + '/src/prototype/engine') : null;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  fresh = (seed = 0.73) => {
    const g = new C('normal', 'mage', () => seed);
    g.enter('march');
    return g;
  };
for (const seed of [0.13, 0.43, 0.73, 0.93]) {
  const g = fresh(seed),
    z = g.zone(),
    arrival = { ...g.hero };
  for (const id of [
    'rest',
    'supplier',
    'minor',
    'entrance',
    'watch',
    'supply-entrance',
    'outbound',
  ]) {
    const n = z.npcs.find((n) => n.id === id);
    assert(n, id);
    assert(!g.blocked(n.x, n.y, 'march', 12), id + ' dry entrance');
    assert(g.route(arrival, n).length, id + ' reachable');
  }
  for (const road of z.roads)
    for (let j = 1; j < road.length; j++) {
      const a = road[j - 1],
        b = road[j],
        l = dist(a, b);
      for (let d = 0; d < l; d += 30) {
        const x = a.x + ((b.x - a.x) * d) / l,
          y = a.y + ((b.y - a.y) * d) / l;
        assert(!g.blocked(x, y, 'march', 10, true), 'road cannot pave over water');
      }
    }
  g.s.clock = 500;
  g.updateNight();
  const wave = z.enemies.filter((e) => e.nightOnly && e.species === 'wraith');
  assert.equal(wave.length, 4);
  const mire = z.enemies.find((e) => e.family === 'mire' && e.type === 'boss');
  for (const e of wave) {
    assert(dist(e.home, mire.home) > 1250);
    assert(!g.blocked(e.x, e.y, 'march', 15));
    assert(g.route(g.hero, e).length);
  }
  const count = z.enemies.length;
  g.updateNight();
  assert.equal(z.enemies.length, count, 'no duplicate wave');
  assert(g.lanternFerryReason(1));
  assert.equal(g.lanternFerryReason(-1), '');
  g.hero.gold = 1000;
  const gold = g.hero.gold;
  assert.equal(g.travel(1), false);
  assert.equal(g.hero.gold, gold);
  assert.equal(g.zoneId, 'march');
  g.s.rescued.mire = true;
  g.s.rescued.archive = true;
  g.hero.gold = 0;
  assert.equal(g.travel(1, { workPassage: true }), false, 'work cannot bypass the Wraiths');
  const h = C.restore(g.snapshot());
  assert(h.lanternFerryReason(1));
  assert.deepEqual(
    h
      .zone()
      .enemies.filter((e) => e.nightOnly)
      .map((e) => e.id),
    wave.map((e) => e.id),
  );
  h.s.clock = 100;
  const beforeGold = h.hero.gold,
    beforeXp = h.hero.xp;
  h.zone().enemies.find((e) => e.nightOnly).aggro = true;
  h.updateNight();
  assert(!h.zone().enemies.some((e) => e.nightOnly && e.species === 'wraith'));
  assert.equal(h.hero.gold, beforeGold);
  assert.equal(h.hero.xp, beforeXp);
  assert.equal(h.lanternFerryReason(1), '');
  h.hero.gold = 1000;
  assert(h.travel(1), 'daylight departure');
  assert.equal(h.zoneId, 'highlands');
}
{
  const g = fresh();
  g.s.clock = 500;
  g.updateNight();
  g.hero.gold = 1000;
  for (const e of g.zone().enemies.filter((e) => e.nightOnly)) {
    e.hp = 0;
    e.heroParticipated = true;
    g.kill(e);
  }
  assert(g.lanternFerryReason(1), 'normal pending night reinforcements are part of the challenge');
  g.updateElites(3);
  for (const e of g.zone().enemies.filter((e) => e.nightOnly && e.hp > 0)) {
    e.hp = 0;
    e.heroParticipated = true;
    g.kill(e);
  }
  assert.equal(g.lanternFerryReason(1), '');
  assert(g.travel(1), 'clearing the night encounter permits departure');
}
{
  const g = fresh();
  g.s.clock = 500;
  g.updateNight();
  g.s.rescued.mire = true;
  g.s.rescued.archive = true;
  g.hero.gold = 0;
  const Menus = require('../src/prototype/menus');
  let opened,
    closed = 0;
  const catalog = Menus.create({
    getGame: () => g,
    Campaign: C,
    D: C.data,
    action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
    openMenu: (title, description, actions) => (opened = { title, description, actions }),
    closeMenu: () => closed++,
    recallSquad() {},
    showMap() {},
    finaleMenu() {},
  });
  const ferry = g.zone().npcs.find((n) => n.id === 'outbound');
  catalog.transport(ferry);
  assert.equal(opened.actions.length, 2);
  assert(
    opened.actions.every((a) => a.disabled && a.detail.includes('daylight')),
    'fare and work rows explain night hold',
  );
  g.s.clock = 100;
  g.updateNight();
  g.hero.gold = 1000;
  catalog.transport(ferry);
  const daytimeAction = opened.actions[0];
  assert(!daytimeAction.disabled);
  g.s.clock = 500;
  g.updateNight();
  daytimeAction.action();
  assert.equal(g.zoneId, 'march');
  assert.equal(closed, 0, 'old open menu cannot bypass a new night');
}
// Match optimized collision against the full authored polygon, including shore margins.
for (let x = 50; x < 3000; x += 81)
  for (let y = 50; y < 3000; y += 83)
    assert.equal(
      R.harborWaterBlocked(R.harbors.march.water, x, y, 15),
      R.rainPoolBlocked([R.harbors.march.water], x, y, 15),
    );
if (Old) {
  const old = new Old('normal', 'mage', () => 0.73);
  old.enter('march');
  old.s.clock = 500;
  old.updateNight();
  const z = old.zone();
  const node = z.nodes.find((n) => n.tributeId === 'lantern-cache');
  node.amount = 47.5;
  old.s.discovered['march:tribute:lantern-cache'] = true;
  const ws = z.enemies.filter((e) => e.nightOnly && e.species === 'wraith');
  ws[0].hp = 17;
  ws[1].hp = 0;
  ws[1].deathPaid = true;
  old.s.pending.wraith = {
    kind: 'mob',
    zone: 'march',
    count: 1,
    base: JSON.parse(JSON.stringify(ws[0])),
    delay: 1,
  };
  const n = z.npcs.find((n) => n.id === 'entrance');
  Object.assign(old.hero, n);
  z.enemies.forEach((e) => (e.aggro = false));
  old.s.party = [old.unit('soldier', n.x, n.y)];
  assert(old.prepareDungeonCamp(n));
  const camp = z.buildings.at(-1);
  camp.progress = 4;
  delete camp.recoveryOnComplete;
  old.setBarracksRespawn(camp.id);
  const before = old.snapshot();
  before.zones.march.enemies.find((e) => e.id === ws[0].id).hp = 17; // raw historical wounds are legal; normal snapshots rest idle enemies
  const ids = before.zones.march.enemies.map((e) => e.id).sort(),
    g = C.restore(before),
    nz = g.zone();
  assert.deepEqual(nz.enemies.map((e) => e.id).sort(), ids, 'old native identities preserved');
  assert.equal(nz.nodes.find((n) => n.id === node.id).amount, 47.5);
  assert(g.s.discovered['march:tribute:lantern-cache']);
  for (const e of ws) {
    const moved = nz.enemies.find((n) => n.id === e.id);
    assert.equal(moved.hp, e.hp);
    assert(dist(moved.home, { x: 1880, y: 2600 }) < 220);
  }
  assert(dist(g.s.pending.wraith.base.home, { x: 1880, y: 2600 }) < 220);
  const entrance = nz.npcs.find((n) => n.id === 'entrance');
  assert(dist(entrance, { x: 500, y: 2350 }) < 1);
  assert(dist(g.hero, entrance) < 400);
  assert(
    dist(
      nz.buildings.find((b) => b.id === camp.id),
      entrance,
    ) < 650,
    'player camp follows Archive',
  );
  assert.equal(g.selectedBarracksRespawn().barracks.id, camp.id);
  assert(
    nz.props
      .filter((p) => p.regionalDistrict === 'archive-relief')
      .every((p) => dist(p, entrance) < 420),
  );
  const copy = C.restore(g.snapshot());
  assert.deepEqual(copy.snapshot(), g.snapshot(), 'migration is idempotent');
}
console.log(
  'PASS coastal Marches: four seeds, principal routes, water/roads, Wraith separation, night clear/day wait, fare/work guards, exact collision and ' +
    (Old ? 'actual dev133 migration/camp/idempotence' : 'current save lifecycle'),
);
