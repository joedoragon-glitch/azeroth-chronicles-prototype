'use strict';
// Focused, actual Campaign route acceptance for the five Crown Foundry
// production workspaces. Rendering and camera teleports do NOT prove
// a player can get to them. No changes to traps, guards or campaign state.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const stations = Campaign.rules.crownFoundryStations;

assert.equal(stations.length, 5, 'Authorial plan has five sequential work functions');
for (const mode of ['normal', 'nightmare']) {
  const game = new Campaign(mode, 'paladin', () => 0.73);
  assert(game.enter('side-crown-foundry'), mode + ' existing Foundry is enterable');
  const zone = game.zone();
  const start = game.safe(game.hero.x, game.hero.y, zone.id);
  assert(Math.hypot(start.x - game.hero.x, start.y - game.hero.y) < 90,
    mode + ' initial Foundry landing remains collision-safe');
  const workers = zone.props.filter(p => p.crownFoundryWorker);
  const roles = workers.map(p => p.id.replace('crown-foundry-work-', '')).sort();
  const expected = stations.map(row => row[0]).sort();
  assert.deepEqual(roles, expected,
    mode + ' must actually place all five identifiable production stages');
  for (const worker of workers) {
    assert(!game.blocked(worker.x, worker.y, zone.id, 15, true),
      mode + ' ' + worker.id + ' work center must be walkable');
    const destination = game.safe(worker.x + 36, worker.y + 28, zone.id);
    assert(Math.hypot(destination.x - worker.x, destination.y - worker.y) <= 110,
      mode + ' ' + worker.id + ' reachable floor must be adjacent to the task');
    for (const [from, to, direction] of [
      [start, destination, 'entry'], [destination, start, 'return'],
    ]) {
      const route = game.route(from, to);
      assert(route.length > 0,
        mode + ' ' + worker.id + ' needs a ' + direction + ' path from the actual entrance');
      assert.deepEqual(route.at(-1), to,
        mode + ' ' + worker.id + ' path must reach the selected legal work point');
      let previous = from;
      for (const waypoint of route) {
        assert(!game.blocked(waypoint.x, waypoint.y, zone.id, 15, true),
          mode + ' ' + worker.id + ' route has blocked waypoint');
        assert(game.clearSegment(previous, waypoint, 15),
          mode + ' ' + worker.id + ' route crosses collision');
        previous = waypoint;
      }
    }
  }
  assert.equal(zone.enemies.length, 14,
    'All original hostile Foundry occupants remain in the playable floor');
  console.log('PASS ' + mode + ': all five actual Crown Foundry workspaces have round-trip collision-safe routes');
}
