'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('node:assert/strict'),
  C = require('../../../src/prototype/engine'),
  R = C.rules;
const seed = JSON.parse(
  require('zlib').gunzipSync(fs.readFileSync(path.join(__dirname, 'dev109-save.json.gz'))),
);
const clone = (o) => JSON.parse(JSON.stringify(o)),
  dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const g = C.restore(clone(seed), () => 0.9),
  z = g.zone(),
  old = seed.zones.crown;
assert.equal(z.crownSceneVersion, 1);
assert.equal(z.props.length, old.props.length);
assert.equal(new Set(z.props.map((p) => p.id)).size, z.props.length);
for (const p of old.props)
  assert(
    z.props.some((q) => q.id === p.id),
    'prop retained ' + p.id,
  );
assert.deepEqual(
  z.enemies.map((e) => [e.id, e.x, e.y, e.home, e.hp <= 0]),
  old.enemies.map((e) => [e.id, e.x, e.y, e.home, e.hp <= 0]),
  'enemy placement, homes and dead state retained',
);
for (const key of ['normal', 'true', 'rescued', 'quests', 'statistics', 'inventory'])
  if (seed[key]) assert.deepEqual(g.s[key], seed[key], key + ' retained');
const snap = JSON.stringify(g.snapshot());
for (let i = 0; i < 5; i++) g.zone();
assert.equal(JSON.stringify(g.snapshot()), snap, 'idempotent');
const reload = C.restore(g.snapshot(), () => 0.9);
assert.deepEqual(reload.zone().props, z.props);
assert.deepEqual(reload.zone().roads, z.roads);
assert.deepEqual(reload.zone().footpaths, z.footpaths);
let fronts = 0;
for (const [id] of Object.entries(R.crownSceneLayout.props)) {
  const p = z.props.find((p) => p.id === id);
  if (!p || !/house|well|market|yard|kiln|shed|washhouse/.test(p.structure || '')) continue;
  const door = g.safe(p.x + 45, p.y + 45),
    near = g.nearestRoadPoint(z, door);
  assert(g.route(near, door).length, id + ' reachable');
  assert(
    z.footpaths.some((r) => dist(r.at(-1), door) < 5),
    id + ' visible front path',
  );
  fronts++;
}
for (const r of z.footpaths)
  for (let j = 1; j < r.length; j++)
    assert(g.clearSegment(r[j - 1], r[j]), 'walkable footpath ' + JSON.stringify(r));
for (const [id] of Object.entries(R.crownSceneLayout.npcs)) {
  const n = z.npcs.find((n) => n.id === id);
  assert(n);
  assert(!g.blocked(n.x, n.y), 'service clear ' + id);
}
g.refreshNPCs();
assert.deepEqual(
  [
    z.npcs.find((n) => n.id === 'service-citadel').x,
    z.npcs.find((n) => n.id === 'service-citadel').y,
  ],
  z.crownTownPlacements['service-citadel'],
);
for (const y of [1000, 2400]) assert(g.clearSegment({ x: 1200, y }, { x: 1520, y }), 'bridge ' + y);
for (const y of [70, 2950, 3720]) {
  const [lo, hi] = R.channelBanks(4, y);
  assert(g.blocked((lo + hi) / 2, y, 'crown', 0, true), 'continuous lava');
}
assert(g.blocked(1850, 3150, 'crown', 0, true), 'orrery body blocks');
assert(!g.blocked(1970, 3150, 'crown', 15, true), 'smaller landmark opens former circle edge');
assert(!g.blocked(2150, 2400, 'crown', 15, true), 'southern industrial dry crossing');
assert(!g.blocked(2900, 1080, 'crown', 15, true), 'northern industrial dry crossing');
const occupied = clone(seed);
Object.assign(occupied.hero, { x: 180, y: 230 });
const og = C.restore(occupied, () => 0.9);
assert.equal(og.hero.x, 180);
assert.equal(og.hero.y, 230);
assert(
  og
    .zone()
    .props.filter((p) => p.r > 0)
    .every((p) => dist(p, og.hero) > p.r + 14),
  'no new house traps hero',
);
for (const [x, y] of [
  [180, 230],
  [2200, 2400],
  [1350, 3200],
]) {
  const state = clone(seed),
    b = {
      id: 'barracks-9999',
      kind: 'barracks',
      name: 'Owner camp',
      x,
      y,
      progress: 4,
      full: true,
      queue: 0,
    };
  state.zones.crown.buildings.push(b);
  const bg = C.restore(state, () => 0.9),
    actual = bg.zone().buildings.find((p) => p.id === b.id);
  assert.deepEqual([actual.x, actual.y], [x, y], 'existing construction stays ' + x + ',' + y);
  assert(
    bg
      .zone()
      .props.filter((p) => p.r > 0 && dist(p, old.props.find((q) => q.id === p.id) || p) > 0.1)
      .every((p) => dist(p, actual) > p.r + 95),
    'plots avoid construction',
  );
  if (x === 1350) {
    assert(bg.zone().crownInheritedDecks.length === 1);
    assert(!bg.blocked(x, y, 'crown', 15, true), 'old camp gets a dry foundation');
  }
}
const interiors = [];
for (const id of ['citadel', 'supply-crown', 'side-crown-foundry']) {
  g.s.zone = id;
  const iz = g.zone(),
    exit = iz.npcs.find((n) => n.kind === 'exit') || iz.npcs[0],
    targets = [
      ...iz.npcs,
      ...iz.enemies,
      ...iz.props.filter((p) => /cache/.test(p.structure || '')),
    ];
  for (const p of targets) {
    const start = g.safe(exit.x, exit.y, id),
      goal = g.safe(p.x + 45, p.y + 45, id);
    assert(g.route(start, goal).length, id + ' approach ' + p.id);
  }
  interiors.push({
    id,
    props: iz.props.length,
    solidProps: iz.props.filter((p) => !p.decorative && p.r > 0).length,
    approaches: targets.length,
  });
}
// New streets must be clear, not merely connected on the planning diagram.
g.s.zone = 'crown';
g.zone();
for (const road of R.crownSceneLayout.streets)
  for (let j = 1; j < road.length; j++)
    assert(
      g.clearSegment({ x: road[j - 1][0], y: road[j - 1][1] }, { x: road[j][0], y: road[j][1] }),
      'authored street physically clear',
    );
assert.deepEqual(
  z.nodes.map((n) => [n.id, n.amount, n.hidden, n.resourceGroup]),
  old.nodes.map((n) => [n.id, n.amount, n.hidden, n.resourceGroup]),
  'logistics relocation preserves deposits and discovery identity',
);
// Exact native boundary pixels: lava reaches both edges, with background beyond.
{
  const { createCanvas } = require('@napi-rs/canvas'),
    Renderer = require('../../../src/prototype/renderer'),
    V = require('../../../src/prototype/visuals'),
    FX = require('../../../src/prototype/combat-visuals');
  for (const [cameraY, mouthY, beyondY] of [
    [100, 5, -20],
    [3700, 3795, 3820],
  ]) {
    Object.assign(g.hero, { x: 1350, y: cameraY });
    g.s.clock = 120;
    const c = createCanvas(900, 600),
      ctx = c.getContext('2d'),
      before = JSON.stringify(g.s);
    Renderer.create({
      canvas: c,
      ctx,
      getGame: () => g,
      platform: { cameraZoom: 1, cameraAnchor: () => ({ x: 450, y: 324 }) },
      Campaign: C,
      PrototypeVisuals: V,
      PrototypeCombatVisuals: FX,
      now: () => 16000,
      chargePresentation: () => null,
      isPaused: () => false,
    }).draw();
    assert.equal(JSON.stringify(g.s), before);
    const pixel = (x, y) => [
      ...ctx.getImageData(
        Math.round(450 + (x - 1350 - (y - cameraY)) * 0.76),
        Math.round(324 + (x - 1350 + y - cameraY) * 0.27),
        1,
        1,
      ).data,
    ];
    const [lo, hi] = R.channelBanks(4, mouthY),
      mouth = pixel((lo + hi) / 2, mouthY),
      beyond = pixel(1355, beyondY);
    assert(mouth[0] > mouth[1] + 25, 'visible lava mouth');
    assert(
      beyond[1] > beyond[0] + 4 && beyond[0] < 35 && beyond[2] < 40,
      'background beyond mouth, no ground cap',
    );
  }
}
const moved = old.props.flatMap((p) => {
  const q = z.props.find((q) => q.id === p.id);
  return dist(p, q) > 0.1
    ? [{ id: p.id, structure: p.structure, from: [p.x, p.y], to: [q.x, q.y] }]
    : [];
});
const result = {
  passed: true,
  originalProps: old.props.length,
  currentProps: z.props.length,
  movedProps: moved.length,
  connectedFronts: fronts,
  footpaths: z.footpaths.length,
  enemiesPreserved: z.enemies.length,
  interiors,
  moved,
};
fs.writeFileSync(path.join(__dirname, 'layout-audit.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ ...result, moved: undefined }));
