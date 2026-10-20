'use strict';
const fs = require('node:fs'),
  assert = require('node:assert/strict');
const {
  g,
  f,
  a,
  R,
  isNature,
  group,
  drawFrontier,
  evidence,
  createCanvas,
} = require('./audit.cjs');
const clone = (x) => JSON.parse(JSON.stringify(x)),
  d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
const plan = [
  ['roadworks-yard', [1080, 700], [990, 280], 'North repair yard'],
  ['emberwatch-livelihood', [650, 620], [340, 970], 'West market / work frontage'],
  ['burned-hamlet-recovery', [1240, 1080], [480, 1740], 'West recovery yard'],
  ['inspection-yard', [1720, 1360], [3050, 1560], 'East inspection yard'],
  ['checkpoint-support', [2300, 1650], [2360, 3000], 'South garrison support'],
  ['bastion-cordon', [3000, 2420], [3070, 3020], 'South Bastion support'],
  ['route-convoy-service', [900, 600], [450, 2640], 'Southwest supplies'],
  ['route-inspection-spur', [1900, 1250], [3070, 1360], 'East inspection spur'],
  ['route-checkpoint-logistics', [2250, 1650], [2370, 2790], 'South logistics spur'],
  ['route-bastion-cordon', [3000, 2400], [3030, 2810], 'South Bastion spur'],
];
const houses = {
  'settlement-minor-0': { x: 330, y: 2450 },
  'settlement-minor-2': { x: 700, y: 2620 },
  'settlement-minor-4': { x: 440, y: 2940 },
};
const byGroup = new Map(plan.map((row) => [row[0], row]));
const z = clone(f),
  natureBefore = clone(f.props.filter(isNature)),
  originalBlocked = g.blocked.bind(g);
g.s.zone = 'frontier';
g.s.zones.frontier = z;
const moving = z.props.filter((p) => !isNature(p) && (byGroup.has(group(p)) || houses[p.id]));
z.props = z.props.filter((p) => !moving.includes(p));
const newRoads = [],
  roadFailures = [];
const addRoad = (goal) => {
  const starts = z.roads
    .flat()
    .filter((p) => !originalBlocked(p.x, p.y, 'frontier', 30))
    .sort((p, q) => d(p, goal) - d(q, goal));
  const saved = g.blocked;
  g.blocked = (x, y, zone, radius = 15, terrainOnly = false) =>
    saved.call(g, x, y, zone, Math.max(radius, 30), terrainOnly);
  let road = [];
  try {
    const goals = [goal];
    for (const radius of [60, 120])
      for (let j = 0; j < 12; j++)
        goals.push({
          ...goal,
          x: goal.x + Math.cos((j * Math.PI) / 6) * radius,
          y: goal.y + Math.sin((j * Math.PI) / 6) * radius,
        });
    for (const candidate of goals) {
      if (g.blocked(candidate.x, candidate.y, 'frontier', 30)) continue;
      for (const start of starts.slice(0, 8)) {
        road = g.route(start, candidate, { road: true });
        if (road.length) break;
      }
      if (road.length) break;
    }
  } finally {
    g.blocked = saved;
  }
  if (!road.length) {
    roadFailures.push(goal);
    return;
  }
  for (let j = 1; j < road.length; j++)
    assert(
      g.clearSegment(road[j - 1], road[j], 25),
      'Road avoids solid nature, houses and terrain',
    );
  z.roads.push(road);
  newRoads.push(road);
};
for (const [, old, target, name] of plan)
  addRoad({ x: target[0], y: Math.min(3220, target[1] + 175), name });
for (const h of Object.values(houses))
  addRoad({ x: h.x, y: h.y + 110, name: 'Recovery home approach' });
const moves = [],
  placementFailures = [];
const roadDistance = (p) =>
  Math.min(
    ...z.roads.flatMap((road) => road.slice(1).map((q, i) => g.distanceToSegment(p, road[i], q))),
  );
for (const prop of moving) {
  const cfg = byGroup.get(group(prop)),
    raw = houses[prop.id] || {
      x: prop.x + cfg[2][0] - cfg[1][0],
      y: prop.y + cfg[2][1] - cfg[1][1],
    },
    margin = prop.r ? prop.r + 34 : 45;
  const clear = (p) =>
    p.x > 100 + margin &&
    p.y > 100 + margin &&
    p.x < 3300 - margin &&
    p.y < 3300 - margin &&
    !originalBlocked(p.x, p.y, 'frontier', Math.max(18, prop.r || 0)) &&
    roadDistance(p) > margin + 12 &&
    !z.npcs.some((n) => d(n, p) < 85 + margin * 0.3) &&
    !z.nodes.some((n) => d(n, p) < 65 + margin * 0.3) &&
    !z.buildings.some((n) => d(n, p) < 85 + margin * 0.3) &&
    !z.enemies.some((e) => e.hp > 0 && d(e, p) < (prop.r || 0) + 40) &&
    !z.props.some((q) => d(q, p) < (isNature(q) ? 44 : 42) + (prop.r || 0) + (q.r || 0));
  let chosen = null;
  for (const radius of [0, 35, 70, 105, 140, 180, 225, 270]) {
    for (let j = 0; j < (radius ? 24 : 1); j++) {
      const theta = (j * Math.PI) / 12,
        p = { x: raw.x + Math.cos(theta) * radius, y: raw.y + Math.sin(theta) * radius };
      if (clear(p)) {
        chosen = p;
        break;
      }
    }
    if (chosen) break;
  }
  if (!chosen) {
    placementFailures.push(prop.id);
    z.props.push(prop);
    continue;
  }
  const moved = { ...prop, ...chosen, proposedMove: true };
  z.props.push(moved);
  moves.push({
    id: prop.id,
    structure: prop.structure,
    group: group(prop),
    before: [prop.x, prop.y],
    after: [chosen.x, chosen.y],
  });
}
for (const road of newRoads)
  for (let j = 1; j < road.length; j++)
    assert(
      g.clearSegment(road[j - 1], road[j], 25),
      'Road clearance survives final structure placement',
    );
assert.deepEqual(
  z.props.filter(isNature),
  natureBefore,
  'Every natural prop and tree stays exactly in place',
);
assert.equal(z.props.length, f.props.length, 'No asset removed');
if (roadFailures.length) console.log('Unconnected approaches:', JSON.stringify(roadFailures));
assert.equal(roadFailures.length, 0, 'All new road approaches connect');
assert.equal(placementFailures.length, 0, 'All intended assets placed');
const bins = Array.from({ length: 4 }, () => Array(4).fill(0));
for (const p of z.props.filter((p) => !isNature(p)))
  bins[Math.min(3, Math.floor(p.y / 850))][Math.min(3, Math.floor(p.x / 850))]++;
z.proposedLabels = [
  ['North repair yard', 990, 280],
  ['West market', 340, 970],
  ['Recovery works', 480, 1740],
  ['Inspection', 3050, 1500],
  ['Recovery homes / supplies', 450, 2800],
  ['South logistics', 2360, 3000],
  ['Aerie support', 3070, 3020],
];
drawFrontier(
  z,
  'frontier-proposed.png',
  'Frontier · proposed redistribution (not applied)',
  'Gold: relocated structures · Nature, town services, bosses, crossings and entrances retained',
);
// Physical dungeon proposal: 10% larger shell, expanded floor strips and wider gates.
const current = clone(R.dungeonArchitecture.abyss),
  proposed = clone(current);
proposed.version = 2;
const scale = 1.1;
for (const room of proposed.walkable) room.bounds = room.bounds.map((n) => Math.round(n * scale));
// Preserve room proportions: the footprint grows only with the 10% coordinate expansion.
for (const wall of proposed.partitions) {
  for (const k of ['x1', 'x2', 'y1', 'y2']) wall[k] = Math.round(wall[k] * scale);
  wall.gaps = wall.gaps.map(([l, h]) => {
    const center = ((l + h) * scale) / 2,
      width = wall.id === 'aerie-gate' ? 180 : 160;
    return [Math.round(center - width / 2), Math.round(center + width / 2)];
  });
}
proposed.partitions.find((w) => w.id === 'service-gate').gaps = [
  [625, 785],
  [815, 975],
];
proposed.partitions.find((w) => w.id === 'aerie-gate').gaps = [
  [940, 1120],
  [1160, 1340],
];
function blocked(architecture, size, x, y, radius = 15) {
  if (x < 40 + radius || y < 40 + radius || x > size - 40 - radius || y > size - 40 - radius)
    return true;
  if (
    !architecture.walkable.some(
      ({ bounds: [l, r, t, b] }) =>
        x > l + radius && x < r - radius && y > t + radius && y < b - radius,
    )
  )
    return true;
  return architecture.partitions.some(
    (w) =>
      x > w.x1 - radius &&
      x < w.x2 + radius &&
      y > w.y1 - radius &&
      y < w.y2 + radius &&
      !w.gaps.some(
        ([l, h]) => (w.axis === 'x' ? x : y) > l + radius && (w.axis === 'x' ? x : y) < h - radius,
      ),
  );
}
const staticRoutes = [];
g.s.zone = 'abyss';
g.s.zones.abyss = clone(a);
const exit = a.npcs.find((n) => n.kind === 'exit'),
  boss = a.enemies.find((e) => e.type === 'boss');
for (const e of a.enemies)
  staticRoutes.push({
    species: e.species,
    position: [e.x, e.y],
    exitRoute: g.route(e, exit).length,
    bossRoute: g.route(e, boss).length,
    blocked: originalBlocked(e.x, e.y, 'abyss'),
  });
const actualSize = g.zoneSize.bind(g),
  actualBlocked = g.blocked;
g.zoneSize = (id) => ((id || g.s.zone) === 'abyss' ? 1650 : actualSize(id));
g.blocked = (x, y, zone = g.s.zone, radius = 15, terrainOnly = false) =>
  zone === 'abyss'
    ? blocked(proposed, 1650, x, y, radius)
    : originalBlocked(x, y, zone, radius, terrainOnly);
const proposedExit = { x: exit.x * scale, y: exit.y * scale },
  proposedBoss = { x: boss.x * scale, y: boss.y * scale };
const proposedStaticRoutes = a.enemies.map((e) => {
  const point = { x: e.x * scale, y: e.y * scale };
  return {
    species: e.species,
    position: [point.x, point.y],
    exitRoute: g.route(point, proposedExit).length,
    bossRoute: g.route(point, proposedBoss).length,
    blocked: g.blocked(point.x, point.y, 'abyss'),
  };
});
assert(
  proposedStaticRoutes.every((r) => !r.blocked && r.exitRoute && r.bossRoute),
  'All proposed guards/boss keep a route to exit and aerie',
);
g.blocked = actualBlocked;
g.zoneSize = actualSize;
function area(architecture, size) {
  let count = 0;
  for (let y = 5; y < size; y += 10)
    for (let x = 5; x < size; x += 10) if (!blocked(architecture, size, x, y, 0)) count++;
  return count * 100;
}
// Candidate props retain their role/count, with bulky pieces shifted to perimeter alcoves.
const props = clone(a.props).map((p) => ({
  ...p,
  x: Math.round(p.x * scale),
  y: Math.round(p.y * scale),
}));
const changes = {
  'decor-4': [400, 430],
  'decor-5': [560, 390],
  'decor-12': [755, 690],
  'decor-18': [1240, 340],
  'decor-19': [1240, 460],
  'decor-26': [500, 1340],
  'decor-27': [640, 1400],
  'decor-30': [1440, 1360],
  'decor-31': [1450, 1420],
  'decor-32': [1420, 1140],
  'decor-33': [1460, 1210],
  'decor-37': [1440, 925],
};
for (const p of props) {
  if (changes[p.id]) [p.x, p.y] = changes[p.id];
  if (blocked(proposed, 1650, p.x, p.y, 15)) {
    let found = false;
    for (let r = 20; r < 160 && !found; r += 20)
      for (let k = 0; k < 24; k++) {
        const x = p.x + r * Math.cos((k * Math.PI) / 12),
          y = p.y + r * Math.sin((k * Math.PI) / 12);
        if (!blocked(proposed, 1650, x, y, 15)) {
          p.x = x;
          p.y = y;
          found = true;
          break;
        }
      }
    assert(found, 'Proposed prop anchor on floor ' + p.id);
  }
}
const dcanvas = createCanvas(1400, 920),
  ctx = dcanvas.getContext('2d');
ctx.fillStyle = '#263438';
ctx.fillRect(0, 0, 1400, 920);
ctx.fillStyle = '#f1e8d6';
ctx.font = 'bold 25px sans-serif';
ctx.fillText('Abyss Bastion · current and proposed movement space', 24, 38);
ctx.font = '16px sans-serif';
ctx.fillText(
  'Proposal only: 1500 → 1650 shell; wider room connections; furniture shifted into side alcoves.',
  24,
  68,
);
for (const [j, arch, size, ps] of [
  [0, current, 1500, a.props],
  [1, proposed, 1650, props],
]) {
  const ox = 35 + j * 700,
    oy = 140,
    k = 620 / 1650;
  ctx.fillStyle = '#151e24';
  ctx.fillRect(ox, oy, size * k, size * k);
  for (let y = 0; y < size; y += 10)
    for (let x = 0; x < size; x += 10)
      if (!blocked(arch, size, x + 5, y + 5, 0)) {
        ctx.fillStyle = '#78786a';
        ctx.fillRect(ox + x * k, oy + y * k, 10 * k + 1, 10 * k + 1);
      }
  for (const w of arch.partitions) {
    ctx.fillStyle = '#393f42';
    ctx.fillRect(ox + w.x1 * k, oy + w.y1 * k, (w.x2 - w.x1) * k, (w.y2 - w.y1) * k);
    for (const [l, h] of w.gaps) {
      ctx.fillStyle = '#c7b680';
      if (w.axis === 'x') ctx.fillRect(ox + l * k, oy + w.y1 * k, (h - l) * k, (w.y2 - w.y1) * k);
      else ctx.fillRect(ox + w.x1 * k, oy + l * k, (w.x2 - w.x1) * k, (h - l) * k);
    }
  }
  for (const p of ps) {
    ctx.fillStyle = changes[p.id] && j ? '#edd27f' : '#ce9364';
    ctx.fillRect(ox + p.x * k - 4, oy + p.y * k - 4, 8, 8);
  }
  for (const e of a.enemies) {
    ctx.fillStyle = e.type === 'boss' ? '#bca2d6' : '#dfe4d8';
    ctx.beginPath();
    ctx.arc(
      ox + e.x * (j ? scale : 1) * k,
      oy + e.y * (j ? scale : 1) * k,
      e.type === 'boss' ? 10 : 3.6,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.fillStyle = '#f1e8d6';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(j ? 'Proposed · 160–180 unit gates' : 'Current · 80–110 unit gates', ox, 115);
  ctx.font = '16px sans-serif';
  ctx.fillText(
    j
      ? 'Side storage and a broader route to the royal aerie'
      : 'All 38 props are decorative, not solid obstacles',
    ox,
    820,
  );
}
ctx.font = '16px sans-serif';
ctx.fillText(
  'Orange / gold: props   ·   White: guards   ·   Purple: dragon   ·   Cream: gate openings',
  35,
  875,
);
fs.writeFileSync(__dirname + '/bastion-comparison.png', dcanvas.toBuffer('image/png'));
const result = {
  frontier: {
    moves: moves.length,
    movesByGroup: plan.map(([id, from, to, name]) => ({
      id,
      from,
      to,
      name,
      count: moves.filter((p) => p.group === id).length,
    })),
    natureUnchanged: natureBefore.length,
    oldBottomQuarterStructures: evidence.frontier.structureBins850[3].reduce((a, b) => a + b, 0),
    newBottomQuarterStructures: bins[3].reduce((a, b) => a + b, 0),
    proposedStructureBins850: bins,
    maximumRelocatedPropRoadDistance: Math.round(
      Math.max(...z.props.filter((p) => p.proposedMove).map(roadDistance)),
    ),
    newRoadSpurs: newRoads.length,
    movedProps: moves,
    roadFailures,
    placementFailures,
  },
  abyss: {
    currentShell: 1500,
    proposedShell: 1650,
    currentWalkableArea: area(current, 1500),
    proposedWalkableArea: area(proposed, 1650),
    currentStaticRoutes: staticRoutes,
    proposedStaticRoutes,
    architecture: proposed,
    proposedProps: props,
    gates: proposed.partitions.map((w) => ({ id: w.id, widths: w.gaps.map(([l, h]) => h - l) })),
    note: 'Current static routes exist for all guards and boss. Crowd/AI stalls during live combat are not reproduced or claimed solved. This is an unimplemented geometric proposal.',
  },
};
fs.writeFileSync(__dirname + '/proposal.json', JSON.stringify(result, null, 2) + '\n');
console.log(
  JSON.stringify({
    frontier: { ...result.frontier, movedProps: undefined },
    abyss: {
      ...result.abyss,
      architecture: undefined,
      proposedProps: undefined,
      currentStaticRoutes: undefined,
      proposedStaticRoutes: undefined,
    },
  }),
);
