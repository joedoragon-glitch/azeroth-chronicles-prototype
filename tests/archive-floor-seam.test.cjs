'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const g = new C('developer', 'mage', () => 0.9);
g.enter('archive');
g.zone().enemies = [];
g.s.party = [];
// The lab/study floor is visually continuous here. Previously radius-15
// movement stopped at y=785 and zero-radius sight failed exactly at y=800.
for (const x of [1080, 1130, 1200, 1220]) {
  const a = { x, y: 770 },
    b = { x, y: 840 };
  assert(g.clearSegment(a, b), 'continuous floor must allow southward movement at ' + x);
  assert(g.clearSegment(b, a), 'return passage must remain open at ' + x);
  assert(g.line(a, b), 'no invisible sight barrier on the join');
}
const z = g.zone();
const actors = [
  g.hero,
  g.unit('soldier', 1130, 770),
  g.unit('archer', 1130, 770),
  g.makeEnemy(
    { species: 'wraith', name: 'Passage fixture', level: 1, hp: 100, damage: 0, gold: 0, xp: 0 },
    { x: 1130, y: 770 },
  ),
];
for (const actor of actors) {
  // Isolate terrain from unrelated crowd spacing while using real movement.
  g.s.party = actor === actors[1] || actor === actors[2] ? [actor] : [];
  z.enemies = actor === actors[3] ? [actor] : [];
  if (actor !== g.hero) Object.assign(g.hero, { x: 900, y: 850 });
  Object.assign(actor, { x: 1130, y: 770 });
  for (let i = 0; i < 24; i++) {
    g.s.time += 0.05;
    g.move(actor, { x: 1130, y: 850 }, 100, 0.05);
  }
  assert(actor.y >= 845, 'hero, companions and enemies can cross the same floor');
}
// Restoring an existing in-Archive save receives the static geometry fix;
// no room regeneration or actor/progress reset is required.
z.enemies = [];
g.s.party = [];
Object.assign(g.hero, { x: 1130, y: 780 });
g.s.normal.archive = true;
const saved = g.snapshot(),
  restored = C.restore(saved, () => 0.9);
assert.equal(restored.zoneId, 'archive');
assert.equal(restored.s.normal.archive, true);
assert.deepEqual(
  restored.zone().props.map((p) => p.id),
  z.props.map((p) => p.id),
);
for (let i = 0; i < 24; i++) restored.tick(0.05, { x: 0, y: 1 });
assert(restored.hero.y > 830, 'existing save can walk down through the join');
assert(restored.blocked(1250, 850), 'actual outer study wall stays solid');
assert(restored.blocked(1005, 330), 'lab partition stays solid');
assert(!restored.blocked(1020, 500), 'authored lab doorway stays open');
console.log(
  'PASS Archive lab/study passage, hero/troop/enemy movement, existing save and real walls/doorway',
);
