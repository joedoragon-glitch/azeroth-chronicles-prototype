'use strict';

const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');

// v0.9 regression: the Bastion's functional wings must stay reachable without
// requiring the player to accept a trap hit. This intentionally uses the same
// pessimistic, permanently-active inflated hazards as dungeon-pressure tests.
for (const mode of ['normal', 'nightmare']) {
  const c = new Campaign(mode, 'paladin', () => 0.9);
  c.enter('abyss');
  const traps = c.traps();
  const start = { x: 160, y: 240 };
  const rawBlocked = c.blocked.bind(c);
  const inflate = (t, r = 24) => ({
    ...t,
    radius: t.radius + r,
    length: t.length + 2 * r,
    halfWidth: (t.halfWidth || 28) + r,
  });

  c.blocked = (x, y, zone, r = 15, terrain) =>
    rawBlocked(x, y, zone, r, terrain) ||
    traps.some((t) => c.trapContains(inflate(t, 24 + r), { x, y }));

  // Check genuine landing points *inside* the functional wings; do not use
  // c.safe() to silently move an unsafe requested destination elsewhere.
  const destinations = [
    ['hatchery/flight-training wing', { x: 1020, y: 615 }],
    ['feeding/service wing', { x: 680, y: 1080 }],
  ];
  assert(!c.blocked(start.x, start.y, 'abyss', 15), 'entrance must be safe');

  for (const [name, destination] of destinations) {
    assert(
      !c.blocked(destination.x, destination.y, 'abyss', 15),
      mode + ' ' + name + ' checkpoint must be clear of geometry and inflated traps',
    );
    for (const [from, to, direction] of [
      [start, destination, 'entry'],
      [destination, start, 'return'],
    ]) {
      const route = c.route(from, to);
      assert(route.length > 0, mode + ' ' + name + ' must have a trap-free ' + direction + ' route');
      assert.deepEqual(route.at(-1), to, name + ' route must reach the actual checkpoint');
      let previous = from;
      for (const waypoint of route) {
        assert(!c.blocked(waypoint.x, waypoint.y, 'abyss', 15), name + ' route waypoint must be safe');
        assert(c.clearSegment(previous, waypoint, 15), name + ' route segment must be clear');
        previous = waypoint;
      }
    }
  }
  c.blocked = rawBlocked;
  console.log('PASS ' + mode + ' Abyss hatchery and feeding/service wings have round-trip inflated-hazard routes');
}
