'use strict';

// Read-only measurements: approximate collision occupancy and actual route samples.
// Tall artwork is not collision occupancy; these numbers cannot certify occlusion.
const Campaign = require('../src/prototype/engine.js');
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const percentile = (values, fraction) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? +sorted[Math.floor((sorted.length - 1) * fraction)].toFixed(2) : null;
};
function measure(C = Campaign) {
  const c = new C('normal', 'paladin', () => 0.9);
  return C.data.regions.map((region, index) => {
    c.enter(region.id);
    const zone = c.zone(),
      size = c.zoneSize(),
      step = 50,
      edge = 250;
    let samples = 0,
      blocked = 0,
      edgeSamples = 0,
      edgeBlocked = 0;
    for (let x = step / 2; x < size; x += step)
      for (let y = step / 2; y < size; y += step) {
        const solid = c.blocked(x, y, region.id, 15);
        samples++;
        blocked += Number(solid);
        if (Math.min(x, y, size - x, size - y) < edge) {
          edgeSamples++;
          edgeBlocked += Number(solid);
        }
      }
    const mobs = zone.enemies.filter(
      (e) => e.type === 'mob' && !e.guard && !e.nightOnly && !e.summon,
    );
    const origin = c.safe(C.data.towns[index][0], C.data.towns[index][1]);
    const destinations = zone.npcs.filter((n) =>
      ['transport', 'dungeon', 'sideDungeon', 'treasury'].includes(n.kind),
    );
    const field = zone.enemies.find((e) => e.type === 'boss' && e.form === 'normal');
    if (field) destinations.push({ ...field, name: field.name, kind: 'field-boss' });
    const routes = destinations.map((destination) => {
      const end = c.safe(destination.x, destination.y);
      const route = c.route(origin, end);
      let length = 0,
        longestQuiet = 0,
        quiet = 0,
        nearest = [],
        previous = origin;
      for (const point of route) {
        const segment = distance(previous, point),
          count = Math.max(1, Math.ceil(segment / step));
        length += segment;
        for (let i = 1; i <= count; i++) {
          const sample = {
            x: previous.x + ((point.x - previous.x) * i) / count,
            y: previous.y + ((point.y - previous.y) * i) / count,
          };
          const near = Math.min(...mobs.map((e) => distance(sample, e.home || e)));
          nearest.push(near);
          quiet = near > 300 ? quiet + segment / count : 0;
          longestQuiet = Math.max(longestQuiet, quiet);
        }
        previous = point;
      }
      return {
        id: destination.id,
        kind: destination.kind,
        name: destination.name,
        requested: { x: destination.x, y: destination.y },
        walkableEndpoint: end,
        approachOffset: +distance(end, destination).toFixed(2),
        reachable: route.length > 0 && distance(route.at(-1), end) < 1,
        length: +length.toFixed(2),
        idealSecondsAtFreshSpeed: +(length / c.hero.speed).toFixed(2),
        nearestMobDistance: {
          p50: percentile(nearest, 0.5),
          p90: percentile(nearest, 0.9),
          max: percentile(nearest, 1),
        },
        longestRouteGapBeyond300UnitsOfMobHome: +longestQuiet.toFixed(2),
      };
    });
    return {
      region: region.id,
      size,
      squareArea: size * size,
      sampleGrid: step,
      approximateTraversableArea: (samples - blocked) * step * step,
      collisionOccupiedFraction: +(blocked / samples).toFixed(4),
      edgeStrip: edge,
      edgeCollisionOccupiedFraction: +(edgeBlocked / edgeSamples).toFixed(4),
      ordinaryMobActors: mobs.length,
      ordinaryPackGroups: new Set(mobs.map((e) => e.pack).filter(Boolean)).size,
      bossActors: zone.enemies.filter((e) => e.type === 'boss').length,
      decorativeProps: zone.props.filter((p) => p.decorative).length,
      physicalProps: zone.props.filter((p) => !p.decorative).length,
      routes,
    };
  });
}
if (require.main === module)
  console.log(
    JSON.stringify(
      {
        method:
          '50-unit collision grid, 250-unit edge strip, actual town-to-site routes, 50-unit route samples; 300-unit proximity is descriptive, not an aggro or acceptance threshold',
        limitations:
          'Fresh deterministic Normal/Paladin. No geometry expansion. Does not measure artwork occlusion, subjective pacing, human travel or all districts. Safe interaction approaches are explicitly recorded.',
        regions: measure(),
      },
      null,
      2,
    ),
  );
module.exports = { measure };
