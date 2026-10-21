'use strict';
const assert = require('node:assert/strict'),
  C = require('../../src/prototype/engine');
const rows = [];
for (const zone of ['crypt', 'archive', 'mine']) {
  const g = new C('normal', 'mage', () => 0.9);
  g.enter(zone);
  assert.equal(g.fortAreas().length, 0, 'no unapproved main-dungeon fort bonus');
  const a = C.rules.dungeonArchitecture[zone],
    cover = g.enemyShotCover();
  for (const wall of a.partitions) {
    const allowed = C.rules.balance.fortifications.lowPartitionIds.includes(wall.id);
    assert.equal(cover.partitions.has(wall.id), allowed);
    if (!allowed) continue;
    let crossing;
    for (
      let t = (wall.axis === 'x' ? wall.x1 : wall.y1) + 8;
      t < (wall.axis === 'x' ? wall.x2 : wall.y2) - 8;
      t += 8
    ) {
      const from = wall.axis === 'x' ? { x: t, y: wall.y1 - 25 } : { x: wall.x1 - 25, y: t };
      const to = wall.axis === 'x' ? { x: t, y: wall.y2 + 25 } : { x: wall.x2 + 25, y: t };
      if (
        g.blocked(from.x, from.y, zone, 15) ||
        g.blocked(to.x, to.y, zone, 15) ||
        g.line(from, to) ||
        !g.fortShotClear(from, to, cover)
      )
        continue;
      crossing = { from, to };
      break;
    }
    assert(crossing, 'native low-screen crossing for ' + zone + '/' + wall.id);
    assert(!g.clearSegment(crossing.from, crossing.to, 15));
    assert(!g.line(crossing.to, crossing.from));
    rows.push({
      zone,
      partition: wall.id,
      hostileShotPasses: true,
      movementBlocked: true,
      friendlySightBlocked: true,
      ...crossing,
    });
  }
}
assert.equal(
  rows.length,
  5,
  'every authored low screen in the three reviewed unfortified main dungeons is exercised',
);
console.log(JSON.stringify(rows, null, 2));
