'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');

const regionIds = C.data.regions.map((r) => r.id);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const expectedLanding = (c, from, to) => {
  const a = C.rules.travelArrivals[from + '>' + to];
  assert(a, from + '>' + to + ' must have an authored transport landing');
  if (a.transportId) {
    const n = c.zone().npcs.find((npc) => npc.id === a.transportId && npc.kind === 'transport');
    assert(n, to + ' destination vehicle ' + a.transportId + ' exists');
    return { x: n.x + (a.dx || 0), y: n.y + (a.dy || 0) };
  }
  return a;
};

for (let i = 0; i < regionIds.length - 1; i++) {
  for (const direction of [1, -1]) {
    const sourceIndex = direction === 1 ? i : i + 1;
    const from = regionIds[sourceIndex], to = regionIds[sourceIndex + direction];
    const c = new C();
    c.enter(from);
    c.hero.gold = 100000;
    c.s.tickets[regionIds[i]] = true;
    const before = c.hero.gold;
    assert(c.travel(direction), from + '>' + to + ' can be traveled');
    assert.equal(c.zoneId, to);
    const landing = expectedLanding(c, from, to);
    assert(distance(c.hero, landing) < 190, from + '>' + to + ' lands beside the vehicle');
    assert(!c.blocked(c.hero.x, c.hero.y, to, 15), from + '>' + to + ' landing walkable');
    assert(
      c.route(c.hero, { x: C.data.towns[c.regionIndex()][0], y: C.data.towns[c.regionIndex()][1] }).length,
      from + '>' + to + ' has a town route',
    );
    assert(c.hero.gold <= before, from + '>' + to + ' never grants a fare');
    assert(c.zone().enemies.filter((e) => e.hp > 0 && e.type !== 'boss')
      .every((e) => distance(e.home, c.hero) > 180), from + '>' + to + ' has breathing room');
  }
}

for (const to of regionIds.slice(0, -1)) {
  const c = new C();
  c.enter(to); // A discovered destination is eligible for Crown transit.
  c.enter('crown');
  const before = c.hero.gold;
  assert(c.travelHub(to), 'Crown hub reaches ' + to);
  const landing = expectedLanding(c, 'crown', to);
  assert(distance(c.hero, landing) < 190, 'Crown>' + to + ' lands beside vehicle');
  assert(!c.blocked(c.hero.x, c.hero.y, to, 15));
  assert.equal(c.hero.gold, before, 'hub retains its zero-fare behavior');
}

// Old saves without the new layout version migrate on zone access without wiping enemies.
const c = new C();
const beforeCount = c.zone().enemies.length;
const snapshot = c.snapshot();
for (const z of Object.values(snapshot.zones)) {
  delete z.destinationLayoutVersion;
  delete z.travelSafetyVersion;
}
const loaded = C.restore(snapshot);
assert.equal(loaded.zone().enemies.length, beforeCount, 'travel migrations preserve population');
assert(loaded.zone().travelSafetyVersion === 1);
console.log('PASS all regional directions, Crown transit, safe landings and save migration');
