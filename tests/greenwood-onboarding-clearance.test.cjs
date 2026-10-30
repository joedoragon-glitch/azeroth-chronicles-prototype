'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  zlib = require('node:zlib');
const C = require('../tools/greenwood-layout/fixtures.cjs').loadRuntime();
const fixture = JSON.parse(
  zlib.gunzipSync(
    fs.readFileSync(__dirname + '/fixtures/greenwood/pre-clearance-main753f-v4.json.gz'),
  ),
);
assert.equal(fixture.sourceSha, '753f4532e744b3f5c8b7e6c9cd4bfff22fe4dfd2');
const raw = fixture.state,
  untouched = JSON.stringify(raw),
  ids = ['settlement-major-0', 'settlement-major-6'];
// Preserve this actual pre-implementation QA output. Do not regenerate the
// expected old positions from the corrected implementation.
assert.equal(raw.zones.vale.props.find((p) => p.id === ids[0]).y, 130);
assert(raw.zones.vale.npcs.find((n) => n.id === 'rest').y < 115);
function verify(g) {
  const z = g.zone(),
    start = { x: 300, y: 350 };
  assert.equal(z.greenwoodFrontageVersion, 1);
  assert.equal(g.zoneSize(), 2700, 'this bounded repair is not final map-size selection');
  for (const id of ids) {
    const p = z.props.find((p) => p.id === id);
    assert(p);
    assert(g.distanceToRoad(z, p) >= 207, id + ' preserves full 32+175 roof setback');
    assert.equal(p.r, 32, 'no shrunken collision/art workaround');
    for (const q of z.props.filter(
      (q) => q !== p && /house|cottage|workshop/.test(q.structure || ''),
    ))
      assert(
        Math.abs((p.x - p.y - q.x + q.y) * 0.76) >= 110 ||
          Math.abs((p.x + p.y - q.x - q.y) * 0.27) >= 110,
        id + ' roof separates from ' + q.id,
      );
  }
  const rest = z.npcs.find((n) => n.id === 'rest');
  assert(rest.y >= 115);
  assert.equal(rest.servicePoint.x - rest.x, 35);
  assert.equal(rest.servicePoint.y - rest.y, 100);
  for (const id of [
    'supplier',
    'recruiter',
    'board',
    'rest',
    'minor',
    'outbound',
    'entrance',
    'den-ruins',
    'orchard',
    'mill-pond',
    'supply-entrance',
  ]) {
    const n = z.npcs.find((n) => n.id === id),
      p = n.servicePoint || n;
    for (const [a, b] of [
      [start, p],
      [p, start],
    ]) {
      const ps = g.route(a, b);
      assert(ps.length, id + ' actual destination reachable both ways');
      assert(
        Math.hypot(ps.at(-1).x - b.x, ps.at(-1).y - b.y) <= 35,
        id + ' no arbitrary snapped endpoint',
      );
      let last = a;
      for (const q of ps) {
        assert(g.clearSegment(last, q), id + ' segment clear');
        last = q;
      }
    }
  }
  for (const path of z.footpaths || [])
    for (let j = 1; j < path.length; j++)
      assert(g.clearSegment(path[j - 1], path[j]), 'footpath segment remains usable');
  assert.equal(z.props.length, raw.zones.vale.props.length, 'no removed/replaced scenery');
  assert.equal(z.enemies.filter((e) => e.type === 'mob').length, 32);
}
let state = 0x47564101;
const random = () => {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state / 4294967296;
};
for (let j = 0; j < 4; j++) verify(new C('normal', 'paladin', random));
const restored = C.restore(raw, () => 0.73);
verify(restored);
assert.equal(JSON.stringify(raw), untouched, 'backup input unchanged');
const after = restored.snapshot(),
  before = raw.zones.vale,
  z = after.zones.vale;
assert.deepEqual(z.enemies, before.enemies, 'actor identities/wounds/deaths/homes preserved');
assert.deepEqual(z.nodes, before.nodes, 'finite tribute/hidden amounts preserved');
assert.deepEqual(z.buildings, before.buildings, 'Barracks construction preserved');
assert.deepEqual(after.quests, raw.quests);
assert.deepEqual(after.paid, raw.paid);
assert.equal(after.hero.gold, raw.hero.gold);
for (const p of before.props.filter((p) => !ids.includes(p.id)))
  assert.deepEqual(
    z.props.find((q) => q.id === p.id),
    p,
    'unrelated prop unchanged ' + p.id,
  );
for (const n of before.npcs.filter((n) => n.id !== 'rest'))
  assert.deepEqual(
    z.npcs.find((q) => q.id === n.id),
    n.id === 'supply-entrance' ? { ...n, name: "Scornfang's Treasury" } : n,
    'service/site unchanged except approved C06 visible name ' + n.id,
  );
assert.deepEqual(
  C.restore(after, () => 0.73).snapshot(),
  after,
  'second restore is semantically idempotent',
);
console.log(
  'PASS post-onboarding roof/edge repair, four fresh streams, exact old-v4 synthetic fixture, routes, footpaths, IDs/state and two reloads',
);

// A player's existing camp can occupy the preferred new parcel. Keep that
// camp and its construction state; find a different valid workshop parcel.
const occupied = JSON.parse(JSON.stringify(raw)),
  preferred = new C('normal', 'paladin', () => 0.73)
    .zone()
    .props.find((p) => p.id === 'settlement-major-6');
const camp = {
  ...occupied.zones.vale.buildings[0],
  id: 'legacy-parcel-camp',
  x: preferred.x,
  y: preferred.y,
};
occupied.zones.vale.buildings.push(camp);
const migrated = C.restore(occupied, () => 0.73),
  parcel = migrated.zone().props.find((p) => p.id === 'settlement-major-6');
assert.equal(migrated.zone().greenwoodFrontageVersion, 1);
assert.deepEqual(
  migrated.zone().buildings.find((b) => b.id === camp.id),
  camp,
);
assert(
  Math.hypot(parcel.x - camp.x, parcel.y - camp.y) >= 165,
  'player camp has reserved frontage',
);
assert(migrated.distanceToRoad(migrated.zone(), parcel) >= 207);
const recovery = JSON.parse(JSON.stringify(raw)),
  rest = recovery.zones.vale.npcs.find((n) => n.id === 'rest');
recovery.refugeSite = { zone: 'vale', id: 'rest', ...rest.servicePoint };
const recovered = C.restore(recovery, () => 0.73);
assert.deepEqual(
  { x: recovered.s.refugeSite.x, y: recovered.s.refugeSite.y },
  recovered.zone().npcs.find((n) => n.id === 'rest').servicePoint,
);
console.log(
  'PASS occupied preferred parcel and persisted refuge follow same IDs without moving player camp',
);
