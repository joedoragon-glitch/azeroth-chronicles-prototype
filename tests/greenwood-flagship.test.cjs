'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  zlib = require('node:zlib');
const C = require('../src/prototype/engine');
const { rng } = require('../tools/greenwood-layout/fixtures.cjs');
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function route(g, a, b, label) {
  const p = g.route(a, b);
  assert(p.length, label);
  assert(dist(p.at(-1), b) < 35, label + ' exact frontage');
  let last = a;
  for (const q of p) {
    assert(g.clearSegment(last, q, 15), label + ' physical segment');
    last = q;
  }
  return p;
}
for (const seed of [0x47564101, 0x47564102, 0x47564103, 0x47564104]) {
  const g = new C('normal', 'paladin', rng(seed)),
    z = g.zone(),
    by = (id) => z.npcs.find((n) => n.id === id);
  assert.equal(g.zoneSize(), 3200);
  assert.deepEqual(
    C.rules.barriers[0].gaps.map(([a, b]) => b - a),
    [180, 130],
    'main cart bridge and narrower southern footbridge share exact collision/paint widths',
  );
  assert.equal(z.greenwoodSceneVersion, 2);
  assert(!z.greenwoodSceneAudit.some((p) => p.essential && !p.placed));
  assert(z.props.length <= 400);
  assert.equal(z.enemies.filter((e) => e.type === 'mob' && !e.summon).length, 32);
  assert.equal(
    z.nodes.reduce((s, n) => s + n.amount, 0),
    640,
  );
  assert.equal(g.questDefs().filter((q) => q.region === 'vale' && q.kind !== 'barracks').length, 6);
  for (const [id, setback] of [
    ['rest', 190],
    ['minor', 180],
    ['supplier', 92],
    ['recruiter', 92],
    ['board', 95],
  ])
    assert(g.distanceToRoad(z, by(id)) + 0.01 >= setback, id + ' service building setback');
  for (const p of z.props)
    assert(g.distanceToRoad(z, p) + 0.01 >= g.roadSetback(p), 'roof/road ' + p.id);
  for (const id of [
    'supplier',
    'recruiter',
    'board',
    'rest',
    'minor',
    'orchard',
    'mill-pond',
    'bridge-north',
    'bridge-south',
    'cache',
    'supply-entrance',
    'entrance',
    'den-ruins',
    'goblin-camp',
    'outbound',
  ]) {
    const n = by(id);
    assert(n, id);
    const p = n.servicePoint || n;
    route(g, g.hero, p, id);
    route(g, p, g.hero, id + ' reverse');
  }
  for (const b of z.bridgeApproaches) {
    assert(g.clearSegment(b.west, b.east, 25));
    route(g, b.west, b.east, b.id);
    route(g, b.east, b.west, b.id + ' reverse');
  }
  const mill = z.props.find((p) => p.id === 'greenwood-working-mill'),
    cellar = z.props.find((p) => p.id === 'greenwood-working-cellar'),
    water = C.rules.terrain[0][0];
  assert(mill && cellar);
  for (const [id, kind] of [
    ['established', 'fruit-tree'],
    ['young', 'sapling'],
    ['new', 'furrow-plot'],
  ])
    assert.equal(
      z.props.find((p) => p.id === 'greenwood-orchard-' + id)?.structure,
      kind,
      'distinct orchard growth stage ' + id,
    );
  assert(dist(mill, water) > water.r + mill.r);
  assert(dist(mill, water) < water.r + 100, 'wheel remains at actual pond');
  const sluice = z.props.find((p) => p.id === 'greenwood-mill-sluice');
  assert(sluice && dist(sluice, water) <= water.r + 35, 'controlled outlet meets the real pond bank');
  assert(g.blocked(water.x, water.y, 'vale', 15, true));
  assert.equal(
    C.rules.terrain[0].filter((p) => p.kind === 'water').length,
    2,
    'western and eastern water both preserved',
  );
  for (const p of [mill, cellar]) {
    const door = { x: p.x + 60, y: p.y + 95 };
    route(g, g.hero, door, p.id + ' loading door');
  }
  assert(
    !z.npcs.some((n) => n.id === cellar.id),
    'working cellar is decorative, no new dungeon or reward',
  );
  assert(
    z.npcs.some((n) => n.sideDungeon && n.family === 'side-vale-cellars'),
    'occupied old Goblin cellars remain',
  );
  const qcount = JSON.stringify(g.s.quests),
    paid = JSON.stringify(g.s.paid),
    gold = g.hero.gold;
  Object.assign(g.hero, by('bridge-south'));
  assert(g.interact(by('bridge-south')));
  assert(g.s.discovered['vale:bridge-south']);
  const first = g.hero.gold;
  assert(g.interact(by('bridge-south')));
  assert.equal(g.hero.gold, first, 'no repeat bridge payment');
  for (const room of ['side-vale-cellars', 'supply-vale', 'crypt']) {
    const door = z.npcs.find((n) => n.kind === 'dungeon' && n.family === room);
    assert(door, room + ' original entrance');
    Object.assign(g.hero, door);
    assert(g.interact(door));
    assert.equal(g.zoneId, room);
    if (room === 'side-vale-cellars')
      assert(g.zone().npcs.some((n) => n.kind === 'critical-codex'));
    if (room === 'supply-vale') {
      assert.equal(g.supplyRoom().name, "Scornfang's Treasury");
      assert.equal(g.supplyRoom().boss, 'thorn');
    }
    const exit = g.zone().npcs.find((n) => n.kind === 'exit');
    Object.assign(g.hero, exit);
    assert(g.interact(exit));
    assert.equal(g.zoneId, 'vale');
    assert(!g.blocked(g.hero.x, g.hero.y), 'safe original exterior return');
  }
  const once = g.snapshot();
  assert.deepEqual(C.restore(once, rng(seed)).snapshot(), once, 'fresh complete scene reload');
}
console.log(
  'PASS four fresh production layouts: essentials, road/door routes, bridges, occupied interiors, returns and unchanged counts/economy',
);
const cases = JSON.parse(
  zlib.gunzipSync(
    fs.readFileSync('docs/evidence/greenwood-gva-20261028/synthetic-v4-inputs.json.gz'),
  ),
).saves;
for (const [name, raw] of cases) {
  const original = JSON.stringify(raw),
    g = C.restore(raw, rng(0x47564102)),
    z = g.zone(),
    s = g.snapshot();
  assert.equal(JSON.stringify(raw), original, name + ' original backup untouched');
  for (const p of raw.zones.vale.props)
    assert(
      z.props.some((q) => q.id === p.id),
      name + ' preserved scenery ' + p.id,
    );
  assert.deepEqual(
    z.nodes.map((n) => [n.id, n.amount]),
    raw.zones.vale.nodes.map((n) => [n.id, n.amount]),
    name + ' finite tribute',
  );
  assert.deepEqual(s.quests, raw.quests, name + ' quests');
  assert.deepEqual(s.paid, raw.paid, name + ' paid rewards');
  assert.equal(s.hero.gold, raw.hero.gold, name + ' crowns');
  assert.deepEqual(
    z.enemies.map((e) => [e.id, e.hp <= 0, e.deathPaid]),
    raw.zones.vale.enemies.map((e) => [e.id, e.hp <= 0, e.deathPaid]),
    name + ' deaths and identities',
  );
  assert.deepEqual(
    z.buildings.map((b) => [b.id, b.progress, b.full, b.upgradeProgress, b.queue]),
    raw.zones.vale.buildings.map((b) => [b.id, b.progress, b.full, b.upgradeProgress, b.queue]),
    name + ' construction',
  );
  assert.equal(z.greenwoodSceneVersion, 2, name + ' essential scenes');
  for (const patch of [3, 4, 5])
    assert(
      z.props.some((p) => String(p.id).startsWith('forest-' + patch + '-')),
      name + ' receives authored new woodland grove ' + patch,
    );
  assert.deepEqual(
    C.restore(s, rng(0x47564102)).snapshot(),
    s,
    name + ' second reload idempotence',
  );
}
console.log(
  'PASS five preserved pre-change synthetic v4 variants: IDs, resources, quests, rewards, construction and exact two-load stability',
);

// Exercise the production companion locomotion methods, separately from the
// terrain-radius probes above. Combat is outside this navigation fixture: no
// enemy, reward, health or movement rule is altered and no full tick is run.
{
  const g = new C('normal', 'paladin', rng(0x47564103));
  for (const bridge of g.zone().bridgeApproaches) {
    for (const reverse of [false, true]) {
      const start = reverse ? bridge.east : bridge.west;
      const end = reverse ? bridge.west : bridge.east;
      const direction = Math.sign(end.x - start.x);
      Object.assign(g.hero, { x: start.x - direction * 100, y: start.y, path: [] });
      g.formationHeading = { x: direction, y: 0 };
      const party = g.activeLivingParty();
      assert(party.length >= 2, 'actual starting companions');
      for (let i = 0; i < party.length; i++) {
        Object.assign(party[i], g.safe(g.hero.x - direction * (45 + i * 35), start.y));
        g.clearCompanionTravel(party[i]);
      }
      const target = { x: end.x + direction * 170, y: end.y };
      for (let step = 0; step < 600; step++) {
        g.s.time += 0.1;
        g.follow(g.hero, target, g.heroMoveSpeed(), 0.1, 5);
        for (const u of party) {
          const before = { x: u.x, y: u.y };
          g.followPartyMember(u, party, 0.1);
          assert(g.clearSegment(before, u, g.actorRadius(u)), bridge.id + ' companion sweep');
          assert(!g.blocked(u.x, u.y, 'vale', g.actorRadius(u)), bridge.id + ' dry companion');
        }
        if (
          dist(g.hero, target) <= 6 &&
          party.every((u) => Math.abs(u.x - end.x) < 210 && direction * (u.x - end.x) > 0)
        )
          break;
      }
      assert(dist(g.hero, target) <= 6, bridge.id + ' hero crosses');
      for (const u of party)
        assert(direction * (u.x - end.x) > 0, bridge.id + ' companion crosses ' + u.id);
    }
  }
  const departure = g.zone().npcs.find((n) => n.id === 'outbound');
  Object.assign(g.hero, departure.servicePoint || departure);
  // A paid-travel fixture supplies precisely the existing fare. This does not
  // change rewards or permit free travel in the implementation.
  const fare = g.travelFare(0, 1);
  g.hero.gold = fare;
  assert(g.travel(1));
  assert.equal(g.zoneId, 'march');
  assert.equal(g.hero.gold, 0);
  assert(g.travel(-1), 'purchased return ticket');
  assert.equal(g.zoneId, 'vale');
  for (const u of [g.hero, ...g.activeLivingParty()])
    assert(!g.blocked(u.x, u.y, 'vale', g.actorRadius(u)), 'safe native return ' + u.id);
  assert.equal(g.hero.gold, 0, 'no repeated fare or payment');
}
console.log(
  'PASS native companion locomotion across both bridges in both directions and paid transport return',
);

// Scene revision must never run the 2700-to-3200 projection a second time.
{
  const g = new C('normal', 'paladin', rng(0x47564101));
  const raw = g.snapshot(), z = raw.zones.vale, pond = C.rules.terrain[0][0];
  z.greenwoodSceneVersion = z.greenwoodAttemptVersion = 1;
  Object.assign(z.props.find((p) => p.id === 'greenwood-mill-sluice'), {x: pond.x + 170, y: pond.y - 30});
  const before = JSON.stringify({hero: raw.hero, nodes: z.nodes, enemies: z.enemies, buildings: z.buildings});
  const restored = C.restore(raw, rng(0x47564101)), once = restored.snapshot();
  assert.equal(once.zones.vale.greenwoodSourceVersion, 1, 'source geometry migration stays at version 1');
  assert.equal(once.zones.vale.greenwoodSceneVersion, 2);
  assert.equal(JSON.stringify({hero: once.hero, nodes: once.zones.vale.nodes, enemies: once.zones.vale.enemies, buildings: once.zones.vale.buildings}), before, 'scene-only repair preserves actors, tribute and construction without projecting twice');
  assert(dist(once.zones.vale.props.find(p=>p.id==='greenwood-mill-sluice'),pond)<=pond.r+35);
  assert.deepEqual(C.restore(once,rng(0x47564101)).snapshot(),once,'scene revision is exactly idempotent');
}
console.log('PASS scene-only outlet correction preserves source geometry and exact second reload');
