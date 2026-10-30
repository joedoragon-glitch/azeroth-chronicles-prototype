'use strict';
// Local architecture, original v4 migration and prepared-defense defect tests.
// No human first-hour, broad game certification or balance acceptance claim.
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  zlib = require('node:zlib');
const C = require('../src/prototype/engine'),
  { rng } = require('../tools/greenwood-layout/fixtures.cjs');
const fixtures = JSON.parse(
  zlib.gunzipSync(
    fs.readFileSync(
      'docs/evidence/greenwood-redesign-20261029/interiors-before/synthetic-interiors-v4.json.gz',
    ),
  ),
);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
{
  const g = new C('normal', 'paladin', rng(0x47564101));
  const door = g.zone().npcs.find((n) => n.id === 'den-ruins');
  assert(door);
  Object.assign(g.hero, door);
  assert(g.interact(door), 'native entry from relocated exterior');
  assert.equal(g.zoneId, 'side-vale-cellars');
  assert(!g.blocked(g.hero.x, g.hero.y));
  assert(g.activeLivingParty().every((u) => !g.blocked(u.x, u.y)));
  const exit = g.zone().npcs.find((n) => n.kind === 'exit');
  Object.assign(g.hero, exit);
  assert(g.interact(exit));
  assert.equal(g.zoneId, 'vale');
  assert(distance(g.hero, door) < 160);
  console.log(
    'PASS native distant Cellars door/party arrival/return without premature interior coordinate repair',
  );
}
const state = (s) => ({
  hero: s.hero.gold,
  quests: s.quests,
  paid: s.paid,
  normal: s.normal,
  true: s.true,
  rescued: s.rescued,
  discovered: s.discovered,
  nodes: s.zones.vale.nodes.map((n) => [n.id, n.amount, n.hidden]),
});
const spatial = (s) => ({
  hero: [s.hero.x, s.hero.y],
  party: s.party.map((e) => [e.id, e.x, e.y]),
  rooms: Object.fromEntries(
    Object.entries(s.zones).map(([id, z]) => [
      id,
      { props: z.props, npcs: z.npcs, enemies: z.enemies.map((e) => [e.id, e.x, e.y, e.home]) },
    ]),
  ),
});
for (const [id, input] of fixtures.saves) {
  const raw = JSON.parse(JSON.stringify(input)),
    room = raw.zones[id];
  raw.hero.gold = 3217;
  room.enemies[0].hp = 0;
  room.enemies[0].deathPaid = true;
  if (id === 'supply-vale') raw.discovered['vale:bundle-0'] = true;
  const original = JSON.stringify(raw),
    g = C.restore(raw, rng(0x47564101)),
    z = g.zone();
  assert.equal(JSON.stringify(raw), original, 'import untouched');
  assert.equal(z.greenwoodInteriorVersion, 1);
  assert.deepEqual(state(g.snapshot()), state(raw), 'earned state');
  assert.deepEqual(
    z.enemies.map((e) => e.id),
    room.enemies.map((e) => e.id),
    'original roster',
  );
  for (const old of room.enemies) {
    const e = z.enemies.find((e) => e.id === old.id);
    for (const key of ['hp', 'maxHp', 'damage', 'gold', 'xp', 'species', 'type', 'deathPaid'])
      assert.equal(e[key], old[key], id + ' preserves ' + old.id + ' ' + key);
  }
  const exit = z.npcs.find((n) => n.kind === 'exit');
  for (const p of [...z.npcs, ...z.enemies.filter((e) => e.hp > 0).map((e) => e.home || e)]) {
    const route = g.route(exit, p);
    assert(route.length && distance(route.at(-1), p) < 40, id + ' connected ' + (p.id || 'post'));
    let previous = exit;
    for (const step of route) {
      assert(g.clearSegment(previous, step, 15));
      previous = step;
    }
  }
  for (const p of z.props) {
    assert(
      !g.blocked(p.x, p.y, id, Math.max(8, p.r || 0), true),
      id + ' furniture on usable floor ' + p.id,
    );
    assert(
      !z.npcs.some((n) => distance(n, p) < 35 && (p.r || 0) > 0),
      id + ' interaction front ' + p.id,
    );
  }
  const once = g.snapshot(),
    twice = C.restore(once, rng(0x47564101)).snapshot(),
    third = C.restore(twice, rng(0x47564101)).snapshot();
  assert.deepEqual(spatial(twice), spatial(once), id + ' second spatial reload');
  assert.deepEqual(spatial(third), spatial(twice), id + ' third spatial reload');
  assert.deepEqual(state(third), state(once));
  if (id === 'supply-vale') {
    assert.equal(z.enemies.filter((e) => e.ranged && !e.roomCaptain).length, 3);
    assert(
      z.enemies.filter((e) => e.hp > 0).every((e) => g.enemyFort(e)),
      'defended workplace',
    );
    assert(
      !z.props.some((p) =>
        ['thorn-bed', 'fang-trophy', 'pup-nest', 'stolen-goods'].includes(p.structure),
      ),
    );
    assert.equal(z.npcs.filter((n) => n.kind === 'bundle' && !n.treasuryRecovery).length, 2);
  }
  if (id === 'side-vale-cellars') {
    assert(z.npcs.some((n) => n.id === 'critical-codex-side-vale-cellars'));
    assert(z.npcs.some((n) => n.id === 'goblin-paid-preserves'));
    assert(z.props.some((p) => p.structure === 'preserve-rack'));
  }
  console.log(
    'PASS ' +
      id +
      ': original roster/progress, usable furniture, interactions, routes and repeat v4 reload',
  );
}
{
  const g = new C('normal', 'paladin', rng(0x47564101));
  g.enter('crypt');
  const boss = g.zone().enemies.find((e) => e.type === 'boss' && e.family === 'crypt');
  assert.deepEqual(boss.home, { x: 1210, y: 1210 });
  const arena = [
    { x: 1040, y: 1120 },
    { x: 1320, y: 1120 },
    { x: 1320, y: 1340 },
    { x: 1040, y: 1340 },
  ];
  for (const p of arena) assert(!g.blocked(p.x, p.y, 'crypt', 30), 'usable command arena');
  for (const p of [
    { x: 1050, y: 1020 },
    { x: 1250, y: 1020 },
    { x: 950, y: 1200 },
  ])
    assert(!g.blocked(p.x, p.y, 'crypt', 20), 'distinct command approaches');
  Object.assign(g.hero, { x: 1100, y: 1210 });
  g.startAttack(boss, g.hero, 2);
  g.resolveAttack(boss);
  boss.telegraph = null;
  const attendants = g.zone().enemies.filter((e) => e.estateAttendant && e.owner === boss.id);
  assert.equal(attendants.length, 3, 'native Clerk of Works creates original three attendants');
  for (const e of attendants) {
    assert(!g.blocked(e.x, e.y, 'crypt', g.actorRadius(e)), 'attendant legal spawn');
    assert(g.route(e, g.hero).length, 'attendant can leave spawn toward hero');
  }
  console.log(
    'PASS prepared Lifebinder arena, three separate approaches and native attendant spawns/routes',
  );
}

{
  const g = new C('normal', 'paladin', rng(0x47564101));
  g.hero.gold = 1000;
  assert(g.build(), 'native paid construction fixture');
  const raw = g.snapshot(),
    b = raw.zones.vale.buildings[0];
  Object.assign(b, C.rules.greenwoodLayout.mill);
  delete raw.zones.vale.greenwoodRedesignScene;
  const before = JSON.stringify(raw),
    restored = C.restore(raw, rng(0x47564101));
  const after = restored.zone().buildings.find((p) => p.id === b.id);
  assert.equal(JSON.stringify(raw), before);
  assert(after && distance(after, b) >= 190, 'complete paid camp relocates out of fixed mill');
  assert.equal(after.progress, b.progress);
  assert.equal(restored.hero.gold, raw.hero.gold, 'migration neither refunds nor charges again');
  assert.deepEqual(
    restored.s.party.map((u) => u.order),
    raw.party.map((u) => u.order),
    'native snapshot intentionally clears ordinary non-recovery build orders',
  );
  assert(restored.assignBuilder(b.id), 'native construction can resume at the relocated camp');
  assert.deepEqual(
    {
      x: restored.zone().props.find((p) => p.id === 'greenwood-working-mill').x,
      y: restored.zone().props.find((p) => p.id === 'greenwood-working-mill').y,
    },
    C.rules.greenwoodLayout.mill,
  );
  assert(restored.zone().greenwoodSceneAudit.every((p) => !p.essential || p.placed));
  const again = C.restore(restored.snapshot(), rng(0x47564101));
  assert.deepEqual(again.zone().buildings, restored.zone().buildings);
  console.log(
    'PASS paid-camp conflict: retained payment/state, native resume, whole plot relocation, fixed mill and stable reload',
  );
}
