'use strict';
// Focused, actual Campaign route acceptance for the five Crown Foundry
// production workspaces. Rendering and camera teleports do NOT prove
// a player can get to them. No changes to traps, guards or campaign state.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const plannedStations = Campaign.rules.crownFoundryStations;

assert.equal(plannedStations.length, 5, 'Authorial plan has five sequential work functions');
for (const mode of ['normal', 'nightmare']) {
  const game = new Campaign(mode, 'paladin', () => 0.73);
  assert(game.enter('side-crown-foundry'), mode + ' existing Foundry is enterable');
  const zone = game.zone();
  const start = game.safe(game.hero.x, game.hero.y, zone.id);
  assert(Math.hypot(start.x - game.hero.x, start.y - game.hero.y) < 90,
    mode + ' initial Foundry landing remains collision-safe');
  const stations = zone.props.filter(p => p.crownFoundryEquipment);
  const roles = stations.map(p => p.id.replace('crown-foundry-work-', '')).sort();
  const expected = plannedStations.map(row => row[0]).sort();
  assert.deepEqual(roles, expected,
    mode + ' must actually place all five identifiable production stages');
  for (const station of stations) {
    assert(!game.blocked(station.x, station.y, zone.id, 15, true),
      mode + ' ' + station.id + ' work center must be walkable');
    const destination = game.safe(station.x + 36, station.y + 28, zone.id);
    assert(Math.hypot(destination.x - station.x, destination.y - station.y) <= 110,
      mode + ' ' + station.id + ' reachable floor must be adjacent to the task');
    for (const [from, to, direction] of [
      [start, destination, 'entry'], [destination, start, 'return'],
    ]) {
      const route = game.route(from, to);
      assert(route.length > 0,
        mode + ' ' + station.id + ' needs a ' + direction + ' path from the actual entrance');
      assert.deepEqual(route.at(-1), to,
        mode + ' ' + station.id + ' path must reach the selected legal work point');
      let previous = from;
      for (const waypoint of route) {
        assert(!game.blocked(waypoint.x, waypoint.y, zone.id, 15, true),
          mode + ' ' + station.id + ' route has blocked waypoint');
        assert(game.clearSegment(previous, waypoint, 15),
          mode + ' ' + station.id + ' route crosses collision');
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
  // The generated footpath ledger also needs actual in-game connectivity,
  // not just successful placement of two endpoints in source metadata.
  // These are short, authored local freight links, NOT new roads or lava spans.
  if (mode === 'normal') {
    const foundryLinks = zone.crownIndustrialRoutes || [];
    assert(foundryLinks.length > 0, 'At least one real industry connector exists');
    for (const link of foundryLinks) {
      const from = zone.props.find(p => p.id === link.from);
      const to = link.to === 'foundry' ? foundryGate
        : zone.props.find(p => p.id === link.to);
      assert(from && to, 'Industrial ledger links actual placed fixtures: ' + link.id);
      walk({ x: from.x + 64, y: from.y + 66 },
        { x: to.x + 64, y: to.y + 66 },
        'actual industrial link ' + link.id);
    }
    console.log('PASS normal: ' + foundryLinks.length +
      ' realized industrial links are collision-reachable in the playable field');
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


// Phase 1: audit the *resolved* geometry instead of mistaking rules.js's
// requested anchors and eight optional freight links for a working network.
// This is diagnostic-only evidence, not an assertion that geothermal pipes,
// potable water, a bathhouse, cargo transfer or living station AI exists.
{
  const audit = new Campaign('normal', 'paladin', () => 0.73);
  assert(audit.enter('crown'), 'Phase 1 ledger enters the real Crown world');
  const outside = audit.zone();
  const thermal = Campaign.rules.crownThermalWorksScenes.map(
    ([requestedX, requestedY, structure, purpose], index) => {
      const p = outside.props.find(q => q.id === 'recovery-heat-crown-' + index);
      return {
        index, purpose, structure, requested: [requestedX, requestedY],
        actual: p ? [Math.round(p.x), Math.round(p.y)] : null,
      };
    },
  );
  const links = (outside.crownIndustrialRoutes || []).map(l => ({
    id: l.id, from: l.from, to: l.to, roadConnected: !!l.roadConnected,
  }));
  const freight = outside.props.filter(q => q.crownIndustrialFreight).map(q => ({
    id: q.id, structure: q.structure,
    actual: [Math.round(q.x), Math.round(q.y)],
  })).sort((a, b) => a.id.localeCompare(b.id));
  const originalGate = outside.npcs.find(n => n.id === 'foundry');
  assert(originalGate && originalGate.kind === 'dungeon',
    'Phase 1 ledger uses only the original Foundry exterior entrance');
  const gate = [Math.round(originalGate.x), Math.round(originalGate.y)];
  // Phase-1 exit: the final design is grounded in the *generated* Crown,
  // not only authored coordinates. These are read-only corridor/easement
  // tests: they do NOT create pipes, turn on heat, move water or promise a
  // running bathhouse. A Phase-3 construction may use a revised safe route
  // only after explicitly revalidating it against the true world.
  const actualHeat = (i) => {
    const p = outside.props.find(q => q.id === 'recovery-heat-crown-' + i);
    assert(p, 'Thermal role ' + i + ' must actually exist in this seed');
    assert(!audit.blocked(p.x, p.y, 'crown', 15, true),
      'Thermal role ' + i + ' must be on safe rock, not a lava channel');
    return { x: p.x, y: p.y };
  };
  for (let i = 0; i < Campaign.rules.crownThermalWorksScenes.length; i++)
    actualHeat(i);
  const pt = (x, y) => ({ x, y });
  const corridorCases = [
    // The eastern industrial lava has its ORIGINAL dry gap y 980–1160.
    ['east-collector-to-glass', [
      actualHeat(0), pt(actualHeat(0).x, 1060),
      pt(actualHeat(1).x, 1060), actualHeat(1),
    ]],
    ['east-collector-to-ceramics', [
      actualHeat(0), pt(actualHeat(0).x, 1060),
      pt(actualHeat(3).x, 1060), actualHeat(3),
    ]],
    ['east-collector-to-flue', [actualHeat(0), actualHeat(2)]],
    ['east-flue-to-distributor', [actualHeat(2), actualHeat(4)]],
    ['east-distributor-to-dryer', [actualHeat(4), actualHeat(5)]],
    // The southern industrial lava retains its ORIGINAL dry gap y 2260–2520.
    ['south-collector-to-glass', [
      actualHeat(6), pt(actualHeat(6).x, 2390),
      pt(actualHeat(7).x, 2390), actualHeat(7),
    ]],
    ['south-collector-to-flue-to-ceramics', [
      actualHeat(6), actualHeat(8), actualHeat(10),
    ]],
    ['south-collector-to-washhouse', [
      actualHeat(6), pt(actualHeat(6).x, 2390),
      pt(actualHeat(13).x, 2390), actualHeat(13),
    ]],
    ['washhouse-to-exhaust', [actualHeat(13), actualHeat(14)]],
    ['south-glass-to-drying', [actualHeat(7), actualHeat(9)]],
    ['south-drying-to-distributor', [actualHeat(9), actualHeat(11)]],
    ['south-collector-to-service-distributor', [
      actualHeat(6), pt(actualHeat(6).x, 2390),
      pt(actualHeat(12).x, 2390), actualHeat(12),
    ]],
    ['south-collector-to-foundry-exterior', [
      actualHeat(6), actualHeat(8), pt(originalGate.x, originalGate.y),
    ]],
    ['dry-gap-freight-to-original-foundry-gate', [
      actualHeat(9), pt(actualHeat(9).x, 2390),
      pt(1980, 2390), pt(originalGate.x, originalGate.y),
    ]],
    // Water's east-bank utility chase uses the ORIGINAL south main bridge.
    ['original-south-bridge-utility-deck', [
      pt(1195, 2400), pt(1515, 2400),
    ]],
    // The main lava's cool WEST bank can support a *proposed* exchanger:
    // not a third heat intake nor a currently operating west-side system.
    ['proposed-west-geothermal-to-bath-and-civic-hall', [
      pt(1155, 850), pt(950, 635), pt(600, 550),
    ]],
  ];
  for (const [name, path] of corridorCases) {
    for (let i = 1; i < path.length; i++)
      assert(audit.clearSegment(path[i - 1], path[i], 15, true),
        'Phase 1 ' + name + ' must avoid actual Crown collision at segment ' + i);
  }

  // These are *unoccupied reserved design envelopes*, not installed props.
  // The exact visual footprint/placement must be rechecked in Phase 3 on
  // old saves and with real tower/bathhouse artwork before construction.
  const utilitySites = [
    // Protected imported-water intake, filtering/valve and lift service.
    ['west-levy-water-inlet-service', 315, 1710, 45],
    ['crownwatch-water-tower', 1150, 545, 48],
    ['ash-refuge-water-tower', 355, 2135, 45],
    ['east-service-water-tower', 2980, 2700, 48],
    ['public-geothermal-bathhouse', 950, 635, 72],
    ['cool-west-bank-heat-exchanger', 1155, 850, 25],
    ['southwest-covered-wastewater-service', 450, 3225, 53],
  ];
  for (const [id, x, y, r] of utilitySites) {
    assert(!audit.blocked(x, y, 'crown', r, true),
      'Phase 1 ' + id + ' proposed footprint is free of native collision');
    assert(audit.distanceToRoad(outside, pt(x, y)) > r + 15,
      'Phase 1 ' + id + ' proposed footprint must not occupy an existing road');
  }
  for (let i = 0; i < utilitySites.length; i++)
    for (let j = i + 1; j < utilitySites.length; j++) {
      const a = utilitySites[i], b = utilitySites[j];
      assert(Math.hypot(a[1] - b[1], a[2] - b[2]) > a[3] + b[3] + 24,
        'Phase 1 waterworks design cannot overlap ' + a[0] + ' and ' + b[0]);
    }
  console.log('PASS Phase 1 native terrain: all 15 installed heatworks, ' +
    corridorCases.length + ' collision-clear candidate corridor chains and ' +
    utilitySites.length + ' unobstructed proposed utility footprints');
  assert(audit.enter('side-crown-foundry'),
    'Phase 1 ledger enters the existing Foundry side dungeon');
  const inside = audit.zone();
  const stations = inside.props.filter(q => q.crownFoundryEquipment)
    .map(q => ({
      id: q.id, role: q.crownFoundryRole,
      actual: [Math.round(q.x), Math.round(q.y)],
    })).sort((a, b) => a.id.localeCompare(b.id));
  const hostileHomes = inside.enemies.map(q => ({
    id: q.id, home: [
      Math.round((q.home || q).x),
      Math.round((q.home || q).y),
    ],
  })).sort((a, b) => a.id.localeCompare(b.id));
  const foundry = Campaign.rules.sideDungeons.find(s => s.id === 'side-crown-foundry');
  // Do not call this a trap-free route audit. Ordinary route() checks
  // collision, while trap footprints remain an independent safety gate.
  console.log('PHASE1_SOURCE_LEDGER_JSON ' + JSON.stringify({
    inspectedSource: 'actual Campaign constructor and generated normal-zone',
    rng: 'constant callback 0.73', originalGate: gate,
    thermal, authoredLinkCount: Campaign.rules.crownIndustrialLinks.length,
    realizedLinks: links, freight, foundry: {
      exit: [120, 150], size: foundry.size,
      stations, hostileHomes, trapAnchors: foundry.traps,
      pillarAnchors: foundry.walls,
    },
  }));
}
