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


// The name "bridge" in a saved site list is not proof that players can
// traverse the terrain. Exercise the live Campaign navigation/collision over
// BOTH canonical lava throats, and walk from the civic side to the Foundry.
// No camera teleports or synthetic obstacle stubs are used.
for (const mode of ['normal', 'nightmare']) {
  const game = new Campaign(mode, 'paladin', () => 0.73);
  assert(game.enter('crown'), mode + ' original Crown field is enterable');
  const zone = game.zone();
  const bridges = [...(zone.bridgeApproaches || [])]
    .sort((a, b) => a.id.localeCompare(b.id));
  assert.deepEqual(bridges.map(p => p.id), ['bridge-north', 'bridge-south'],
    mode + ' keeps exactly the original two named lava crossings');
  const rest = zone.npcs.find(n => n.id === 'rest');
  const foundryGate = zone.npcs.find(n => n.id === 'foundry');
  assert(rest && foundryGate && foundryGate.kind === 'dungeon',
    mode + ' retains original service and Foundry entrance');
  const preservedRoads = JSON.stringify(zone.roads);
  const preservedBridges = JSON.stringify(bridges);
  const walk = (from, to, name) => {
    const origin = game.safe(from.x, from.y, 'crown');
    const destination = game.safe(to.x, to.y, 'crown');
    const path = game.route(origin, destination);
    assert(path.length > 0, mode + ' ' + name + ' must have a real path');
    assert.deepEqual(path.at(-1), destination,
      mode + ' ' + name + ' must reach the specified destination');
    let prior = origin;
    for (const point of path) {
      assert(!game.blocked(point.x, point.y, 'crown', 15, true),
        mode + ' ' + name + ' has a terrain-blocked route waypoint');
      assert(game.clearSegment(prior, point, 15),
        mode + ' ' + name + ' crosses an occupied/terrain-blocked segment');
      prior = point;
    }
    return path.length;
  };
  for (const bridge of bridges) {
    assert(!game.blocked(bridge.west.x, bridge.west.y, 'crown', 15, true) &&
      !game.blocked(bridge.east.x, bridge.east.y, 'crown', 15, true),
    mode + ' ' + bridge.id + ' has usable approaches on BOTH banks');
    assert(game.clearSegment(bridge.west, bridge.east, 15),
      mode + ' ' + bridge.id + ' must be passable through the true lava gap');
    walk(bridge.west, bridge.east, bridge.id + ' west-to-east');
    walk(bridge.east, bridge.west, bridge.id + ' east-to-west');
  }
  // A complete route is a stronger assertion than a decorative painted road.
  // Keep expensive long-distance trips bounded to one pass per game mode.
  walk(rest, bridges[0].west, 'Crownwatch civic hall to north crossing');
  walk(bridges[1].east, foundryGate, 'south crossing to real Foundry gate');
  assert.equal(JSON.stringify(zone.roads), preservedRoads,
    'A route inspection may never regenerate or modify Crown roads');
  const restored = Campaign.restore(game.snapshot());
  assert(restored.enter('crown'));
  assert.equal(JSON.stringify([...restored.zone().bridgeApproaches]
    .sort((a, b) => a.id.localeCompare(b.id))), preservedBridges,
  mode + ' v4 restored world must preserve both bank coordinates');
  assert.equal(JSON.stringify(restored.zone().roads), preservedRoads,
    mode + ' v4 restore must preserve roads and original crossings');
  console.log('PASS ' + mode +
    ': both Crown lava bridges and civic-to-Foundry travel have collision-safe paths');
}
