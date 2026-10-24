'use strict';
// Focused regression for the shared terrain route solver, not a browser test.
// The synthetic blockers use the exact production radius-15 sweep contract.
const assert = require('node:assert/strict');
const Navigation = require('../src/prototype/navigation.js');

class SyntheticCampaign {}
Navigation.install(SyntheticCampaign, {}, {}, []);
const start = { x: 255.8739062724635, y: 432.98672090284526 };
const target = { x: 220.7593571068719, y: 268.0368645489216 };
const blockers = [
  [26.355212104972452, 385.6596170505509, 104.51147910673171, 113.36692988872528],
  [100.82747043808922, 271.46154824178666, 73.2928328262642, 96.1669347062707],
  [427.69438630668446, 74.59772173780948, 37.5569366896525, 103.65014111623168],
  [356.3673176965676, 135.71946700569242, 31.566275102086365, 97.67109759151936],
  [239.013912032824, 258.1570241646841, 103.75073524657637, 36.193104814738035],
];
function synthetic(rects = blockers) {
  const game = new SyntheticCampaign();
  game.s = { zone: 'synthetic' };
  game.zoneSize = () => 500;
  game.blocked = (x, y, _zone, radius = 15) =>
    x < radius || y < radius || x > 500 - radius || y > 500 - radius ||
    rects.some(([left, top, width, height]) =>
      x > left - radius && x < left + width + radius &&
      y > top - radius && y < top + height + radius);
  return game;
}
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function safeSegments(game, from, path) {
  let previous = from;
  for (const point of path) {
    assert(game.clearSegment(previous, point, 15),
      'every returned route segment must be independently traversable');
    previous = point;
  }
}
{
  const g = synthetic();
  assert(!g.clearSegment(start, target, 15), 'the direct shortcut really is blocked');
  // The production solver previously returned [] for both requests although
  // these two radius-15 clear segments reach the destination through node 74.
  const connector = { x: 225, y: 375 };
  assert(g.clearSegment(start, connector, 15));
  assert(g.clearSegment(connector, target, 15));
  const walked = g.route(start, target);
  assert(walked.length, 'alternate valid grid anchors must defeat a false no-route');
  assert(distance(walked.at(-1), target) < 1e-8);
  safeSegments(g, start, walked);
  const road = g.route(start, target, { road: true });
  assert(road.length > 1, 'road construction also finds the alternate anchors');
  assert.deepEqual(road[0], start, 'road mode still includes its authored origin');
  assert.deepEqual(road.at(-1), target, 'road mode still reaches the destination');
  safeSegments(g, start, road.slice(1));
}
{
  // This path already succeeded with the original nearest-node BFS.
  // The new secondary search may not change existing reachable road geometry.
  const g = synthetic([]);
  const from = { x: 100, y: 100 }, to = { x: 380, y: 280 };
  assert.deepEqual(g.route(from, to), [to], 'clear direct walks preserve their shape');
  assert.deepEqual(g.route(from, to, { road: true }), [
    from, { x: 75, y: 75 }, { x: 375, y: 75 }, { x: 375, y: 275 }, to,
  ], 'established nearest-anchor road layout remains byte-for-byte deterministic');
}
{
  const g = synthetic([[245, 0, 10, 500]]);
  const from = { x: 100, y: 250 }, to = { x: 400, y: 250 };
  assert.equal(g.route(from, to).length, 0,
    'truly disconnected terrain never receives a fabricated walking route');
  assert.equal(g.route(from, to, { road: true }).length, 0,
    'truly disconnected terrain never receives an invented road');
}
{
  // One production actor consumer: following an obstacle-aware route still
  // reaches its goal without changing the simulation's movement contract.
  // This narrow check is intentionally not the broad roads/AI test matrix.
  const Campaign = require('../src/prototype/engine.js');
  const campaign = new Campaign('normal', 'paladin', () => 0.73);
  campaign.zone().props.push({
    id: 'stage4-follow-obstacle', x: 350, y: 350, r: 24, icon: 'rock',
  });
  const origin = { x: 300, y: 350 };
  const destination = { x: 400, y: 350 };
  const route = campaign.route(origin, destination);
  assert(route.length, 'production actor still receives an obstacle-aware route');
  safeSegments(campaign, origin, route);
  const actor = { ...origin };
  for (let frame = 0; frame < 160 && distance(actor, destination) > 10; frame++)
    campaign.follow(actor, destination, 300, 0.1, 10);
  assert(distance(actor, destination) <= 10 + 1e-6,
    'a real actor completes movement around its blocker');
}
console.log('PASS Stage 4 solver: alternate clear grid anchors, unchanged legacy roads, collision-safe edges and disconnected terrain');
