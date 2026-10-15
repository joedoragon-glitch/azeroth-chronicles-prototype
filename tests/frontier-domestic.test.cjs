'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');

const c = new C();
c.enter('frontier');
const z = c.zone();
const domestic = z.props.filter((p) => p.regionalDistrict === 'burned-hamlet-home');
assert.deepEqual(
  domestic.map((p) => p.structure).sort(),
  ['garden', 'laundry'],
  'Burned Hamlet gains exactly two familiar household details',
);
const [hx, hy] = C.data.minors[3];
for (const p of domestic) {
  assert.equal(p.r, 0);
  assert(!c.blocked(p.x, p.y, 'frontier', 24));
  assert(Math.hypot(p.x - hx, p.y - hy) < 440);
  assert(
    !z.roads.some((road) => road.some((b, j) => j && c.distanceToSegment(p, road[j - 1], b) < 60)),
  );
}
assert(
  z.props.some(
    (p) =>
      p.frontierDistrict === 'burned-hamlet-recovery' &&
      ['ash-patch', 'charred-foundation'].includes(p.structure),
  ),
  'wartime damage remains visible',
);
const old = c.snapshot();
delete old.zones.frontier.regionalHandoffVersion;
old.zones.frontier.props = old.zones.frontier.props.filter(
  (p) => p.regionalDistrict !== 'burned-hamlet-home',
);
const migrated = C.restore(old);
assert.equal(migrated.s.zones.frontier.regionalHandoffVersion, 1);
const furnishings = (game) =>
  game.s.zones.frontier.props.filter((p) => p.regionalDistrict === 'burned-hamlet-home');
assert.deepEqual(furnishings(migrated), furnishings(C.restore(migrated.snapshot())));
assert.deepEqual(migrated.s.quests, c.s.quests);
assert.deepEqual(migrated.s.rescued, c.s.rescued);
assert.equal(migrated.hero.gold, c.hero.gold);
console.log('PASS Burned Hamlet domestic recovery and old-save safety');
