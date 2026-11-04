'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const { route, passable, budget } = require('../src/prototype/strategist-lab-navigation.js');

function world() {
  return {
    s: { zone: 'vale', zones: { vale: {}, march: {} } },
    zoneSize() { return 1200; },
    calls: [],
    blocked(x, y, zone, radius) {
      this.calls.push(zone);
      if (x < 40 + radius || y < 40 + radius ||
          x > 1200 - 40 - radius || y > 1200 - 40 - radius) return true;
      // Wall in the remote Marches has a single physical passable opening.
      if (zone === 'march' && x >= 540 - radius && x <= 555 + radius &&
          y < 650) return true;
      return false;
    },
  };
}
test('zone-explicit direct path does not change Campaign active zone', () => {
  const g = world(), b = budget();
  const a = { x: 100, y: 100 }, target = { x: 350, y: 100 };
  assert.deepEqual(route(g, 'vale', a, target, b), [target]);
  assert.equal(g.s.zone, 'vale');
  assert.ok(g.calls.every(x => x === 'vale'));
  assert.ok(b.tested > 0);
});
test('remote wall requires a real detour, not teleportation or a fake direct path', () => {
  const g = world(), b = budget(1100, 9200);
  const from = { x: 220, y: 400 }, to = { x: 850, y: 400 };
  const path = route(g, 'march', from, to, b);
  assert.ok(path.length > 1, 'must go around the wall ending at y=650');
  assert.deepEqual(path.at(-1), to);
  let at = from;
  for (const p of path) {
    assert.equal(passable(g, 'march', at, p, budget(0, 2000)), true);
    at = p;
  }
  assert.ok(path.some(p => p.y > 650), 'physical detour through open corridor');
  assert.equal(g.s.zone, 'vale', 'no remote region mutation');
  assert.ok(g.calls.every(id => id === 'march'));
});
test('unreachable hard budget returns no invented route; probes remain bounded', () => {
  const g = world(), b = budget(2, 75);
  const p = route(g, 'march', { x: 220, y: 400 }, { x: 850, y: 400 }, b);
  assert.deepEqual(p, []);
  assert.ok(b.tested <= 75);
  assert.ok(b.expanded <= 2);
  assert.equal(g.s.zone, 'vale');
});
test('reject blocked destination, missing zone, invalid coordinate', () => {
  const g = world();
  assert.deepEqual(route(g, 'march', {x:220,y:400}, {x:548,y:400}), []);
  assert.deepEqual(route(g, 'void', {x:220,y:400}, {x:850,y:400}), []);
  assert.deepEqual(route(g, 'march', {x:NaN,y:400}, {x:850,y:400}), []);
  assert.equal(passable(g, 'march', {x:220,y:400},{x:850,y:400}), false);
});
test('20-source batch shares one search budget rather than 20 full A* attempts', () => {
  const g = world(), b = budget(180, 1000);
  for (let i = 0; i < 20; i++)
    route(g, 'march', {x:220,y:400}, {x:850,y:410+i*5}, b);
  assert.ok(b.tested <= 1000);
  assert.ok(b.expanded <= 180);
});
