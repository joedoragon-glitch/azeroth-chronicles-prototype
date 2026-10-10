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

  if (mode === 'normal') {
    const probes = [
      [610, 1030], [640, 1030], [670, 1030], [700, 1030],
      [610, 1060], [640, 1060], [670, 1060], [700, 1060],
      [610, 1090], [640, 1090], [670, 1090], [700, 1090],
      [730, 1090], [760, 1090], [790, 1090],
      [650, 1130], [700, 1130], [750, 1130], [800, 1130],
      [650, 1170], [700, 1170], [750, 1170], [800, 1170],
      [620, 970], [680, 970], [740, 970], [800, 970],
    ].map(([x, y]) => {
      const p = { x, y };
      const clear = !c.blocked(x, y, 'abyss', 15);
      return { x, y, clear, reachable: clear && c.route(start, p).length > 0 };
    });
    console.log('ABYSS SERVICE SAFE-WING PROBES ' + JSON.stringify(probes));
  }

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
