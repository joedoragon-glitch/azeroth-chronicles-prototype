'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
const census = [];
for (const room of C.rules.supplyRooms) {
  const g = new C('developer', 'mage', () => 0.9);
  g.enter(room.id);
  g.s.party = [];
  g.s.mercyTime = 0;
  const z = g.zone(),
    residents = z.enemies.filter((e) => e.hp > 0 && !e.neutral),
    areas = g.fortAreas();
  assert(
    residents.every((e) => g.enemyFort(e)),
    room.id + ' every guard/captain is fortified',
  );
  assert(
    residents.some((e) => e.roomCaptain),
    'native captain present',
  );
  const architecture = C.rules.treasuryArchitecture[room.id];
  if (architecture)
    assert.equal(areas.length, architecture.walkable.length, 'authored rooms define fort coverage');
  const partitions = architecture?.partitions || C.rules.treasuryWalls[room.id];
  for (const wall of partitions) {
    assert(
      areas.every((a) => a.partitions.has(wall.id)),
      'own wall firing permission retained',
    );
    let checked = false;
    for (let x = wall.x1 + 1; x < wall.x2 && !checked; x += 8)
      for (let y = wall.y1 + 1; y < wall.y2 && !checked; y += 8) {
        if (!g.blocked(x, y, room.id, 0)) continue;
        // Some authored partitions extend into outer walls or meet another
        // obstacle. Find an actual clear floor crossing of this partition.
        if (g.fortShotBlocked({ x, y }, g.enemyShotCover(areas[0]))) continue;
        assert(g.blocked(x, y), 'movement does not receive firing permissions');
        checked = true;
      }
    assert(checked, 'real partition checked');
  }
  assert(
    g.fortShotBlocked({ x: 20, y: 20 }, g.enemyShotCover(areas[0])),
    'outer walls remain solid',
  );
  for (const e of residents) {
    Object.assign(g.hero, { x: e.x, y: e.y });
    const before = e.hp;
    assert(g.damage(e, 10));
    assert.equal(
      before - e.hp,
      e.captainProfile === 'supply-highlands' ? 4.5 : 6,
      'fort reduction composes with native defenses for ' + e.name,
    );
    const piercing = e.hp;
    assert(g.damage(e, 10, 'hero', { piercing: true }));
    assert.equal(piercing - e.hp, 10, 'piercing bypass remains');
    assert(
      Math.abs(
        g.enemyRangedRange(e) -
          C.rules.balance.enemyRangedBasicRange * 1.3,
      ) < 1e-8,
    );
    const p = {
      source: 'enemy',
      sourceId: e.id,
      x: e.x,
      y: e.y,
      dx: 1,
      dy: 0,
      speed: 300,
      life: 1,
    };
    g.prepareFortProjectile(p, e);
    assert.equal(p.speed, 390, 'full garrison projectile bonus');
    assert(p.fortId && p.rangedArc, 'fort flight and launch rights');
  }
  const restored = C.restore(g.snapshot(), () => 0.9);
  assert(
    restored
      .zone()
      .enemies.filter((e) => e.hp > 0 && !e.neutral)
      .every((e) => restored.enemyFort(e)),
    'existing save receives bonus',
  );
  const e = residents[0];
  e.x = 20;
  e.y = 20;
  assert.equal(g.enemyFort(e), null, 'outside floor gets no fort rights');
  census.push({
    id: room.id,
    residents: residents.length,
    areas: areas.length,
    captains: residents.filter((e) => e.roomCaptain).length,
  });
}
// The request covers the four treasuries; other main dungeons remain pending.
for (const id of ['crypt', 'archive', 'mine']) {
  const g = new C('developer', 'mage', () => 0.9);
  g.enter(id);
  assert.equal(g.fortAreas().length, 0);
}
console.log(
  'PASS all four Treasury garrisons/captains, reduction/piercing, ranged/projectile bonuses, own walls, floor coverage and save lifecycle',
  JSON.stringify(census),
);
