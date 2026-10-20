'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
const g = new C('normal', 'mage', () => 0.9);
g.enter('frontier');
const z = g.zone(),
  R = C.rules;
z.props = [];
z.npcs = [];
z.buildings = [];
for (const y of [80, 100, 2500, 3000, 3320]) {
  const [lo, hi] = R.channelBanks(3, y);
  assert(g.blocked((lo + hi) / 2, y, 'frontier', 14), 'channel stays solid up to both map edges');
  assert(!g.blocked(lo - 40, y, 'frontier', 14), 'west bank remains usable');
  assert(!g.blocked(hi + 40, y, 'frontier', 14), 'east bank remains usable');
}
for (const [lo, hi] of R.barriers[3].gaps) {
  const y = (lo + hi) / 2;
  assert(g.clearSegment({ x: 1350, y }, { x: 1560, y }, 14), 'existing crossing remains open');
}
assert(g.blocked(1775, 1120, 'frontier', 14), 'visible basin has a matching circular obstacle');
for (const y of [1030, 1210])
  assert(!g.blocked(1775, y, 'frontier', 14), 'old detached strip is dry usable ground');
assert(
  g.route({ x: 1695, y: 1120 }, { x: 1855, y: 1120 }).length,
  'can walk around the round basin',
);
// A save whose actor stood in the newly extended channel receives the existing safe-position repair.
Object.assign(g.hero, { x: 1455, y: 3000 });
g.hero.gold = 1234;
g.hero.xp = 57;
const old = g.snapshot();
const victim = old.zones.frontier.enemies.find((e) => e.hp > 0);
victim.hp = 0;
victim.deathPaid = true;
const copy = C.restore(old, () => 0.9);
assert(
  !copy.blocked(copy.hero.x, copy.hero.y),
  'restored actor is not trapped inside extended terrain',
);
assert.equal(copy.hero.gold, 1234);
assert.equal(copy.hero.xp, 57);
assert.equal(copy.zone().enemies.find((e) => e.id === victim.id)?.hp, 0);
assert(
  !copy.zone().props.some((p) => p.structure === 'frontier-civic-fountain'),
  'fixed terrain body creates no duplicate saved furnishing',
);
console.log(
  'PASS Frontier boundary collision, both bridge routes, circular basin and dry former strip, round-basin routing and old-save safe placement/progress',
);
