'use strict';
// Diagnostic-only baseline for PR #579 follow-up. Identical source must run
// on the published main baseline and on the proposed implementation branch.
// No runtime instrumentation, save fields, collision changes or performance
// thresholds are installed by this file.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const clock = () => performance.now();
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const targets = ['companionRoute', 'followCompanion', 'depositSite',
  'gatheringRouteLength', 'tacticalSeekRogueSupport',
  'tacticalBeginRogueRegroup', 'route', 'clearSegment',
  'companionTravelClear', 'advanceBudgetedRoute'];

function scenario() {
  const g = new Campaign('developer', 'mage', () => 0.73);
  g.s.time = 40;
  g.s.mercyTime = 0;
  const z = g.zone();
  z.enemies = [];
  z.props = [];
  // A real prop wall exercises the native collision resolver, with upper and
  // lower exits so an A* search must decide how to route around the obstacle.
  for (let y = 760; y <= 1240; y += 40)
    z.props.push({ id: 'audit-barrier-' + y, x: 950, y, r: 30 });
  const from = g.safe(540, 1010),
    to = g.safe(1600, 1010);
  assert(!g.clearSegment(from, to), 'the original terrain check recognizes the wall');
  return { g, z, from, to };
}
function watch(g) {
  let blocked = 0;
  const rows = new Map(targets.map(name => [name,
    { calls: 0, blockedInclusive: 0, maxBlocked: 0, msInclusive: 0 }]));
  const originals = new Map();
  const oldBlocked = g.blocked;
  const ownBlocked = Object.hasOwn(g, 'blocked');
  g.blocked = function (...args) {
    blocked++;
    return oldBlocked.apply(this, args);
  };
  for (const name of targets) {
    if (typeof g[name] !== 'function') continue;
    const original = g[name], hadOwn = Object.hasOwn(g, name);
    originals.set(name, { original, hadOwn });
    g[name] = function (...args) {
      const start = clock(), before = blocked;
      try { return original.apply(this, args); }
      finally {
        const row = rows.get(name), count = blocked - before;
        row.calls++;
        row.blockedInclusive += count;
        row.maxBlocked = Math.max(row.maxBlocked, count);
        row.msInclusive += clock() - start;
      }
    };
  }
  return {
    get blocked() { return blocked; },
    summarize() {
      return [...rows].filter(([, row]) => row.calls).map(([name, row]) =>
        ({ name, ...row, msInclusive: +row.msInclusive.toFixed(2) }));
    },
    stop() {
      for (const [name, { original, hadOwn }] of originals) {
        if (hadOwn) g[name] = original;
        else delete g[name];
      }
      if (ownBlocked) g.blocked = oldBlocked;
      else delete g.blocked;
      assert.equal(g.blocked, oldBlocked, 'test instrumentation must be removed');
    },
  };
}
function result(label, g, monitor, tickProbes, extra) {
  const sorted = [...tickProbes].sort((a,b) => a-b),
    percentile = (p) => sorted[Math.floor((sorted.length - 1)*p)] ?? 0;
  const out = {
    label, version: require('../package.json').version,
    ticks: tickProbes.length,
    totalBlocked: monitor.blocked,
    meanBlockedPerTick: tickProbes.length ? +(monitor.blocked/tickProbes.length).toFixed(2) : 0,
    p95BlockedPerTick: percentile(0.95),
    maxBlockedPerTick: sorted.at(-1) || 0,
    methods: monitor.summarize(),
    ...extra,
  };
  monitor.stop();
  assert.equal(Object.hasOwn(g, 'blocked'), false);
  console.log('TERRAIN_SEARCH_AUDIT ' + JSON.stringify(out));
}
// Direct route algorithms remain synchronous by design. Measure them as
// controls so only live call-site differences are called improvements.
{
  const { g, from, to } = scenario();
  const m = watch(g), began = clock();
  const path = g.companionRoute(from, to);
  const elapsed = clock() - began;
  result('companion-direct-reference', g, m, [m.blocked],
    { pathLength: path.length, elapsedMs: +elapsed.toFixed(2),
      endpointDistance: path.length ? +distance(path.at(-1), to).toFixed(2) : null });
}
{
  const { g, from, to } = scenario();
  const u = g.unit('soldier', from.x, from.y);
  g.s.party = [u];
  const m = watch(g), ticks = [], dt = 0.05, started = clock();
  for (let i = 0; i < 55; i++) {
    g.s.time += dt;
    const before = m.blocked;
    g.followCompanion(u, to, 190, dt, 25);
    ticks.push(m.blocked - before);
  }
  result('companion-follow-55-ticks', g, m, ticks,
    { durationMs: +(clock()-started).toFixed(2), distanceRemaining: +distance(u,to).toFixed(2) });
}
{
  const { g, z, from } = scenario();
  const u = g.unit('soldier', from.x, from.y);
  g.s.party = [u];
  u.order = { type: 'deposit', id: 'audit-resource', group: 'audit' };
  u.carry = 75;
  z.npcs.push(
    { id: 'audit-near', kind: 'rest', x: 1600, y: 1010 },
    { id: 'audit-far', kind: 'supplier', x: 1800, y: 1500 },
    { id: 'audit-extra', kind: 'rest', x: 680, y: 1650 },
  );
  const m = watch(g), ticks = [], started = clock();
  let chosen = null;
  for (let i = 0; i < 70; i++) {
    g.s.time += 0.05;
    const before = m.blocked;
    const candidate = g.depositSite(u, true);
    ticks.push(m.blocked - before);
    if (candidate) { chosen = candidate; break; }
  }
  assert.equal(u.carry, 75);
  assert.equal(u.order.type, 'deposit');
  result('delivery-rank-search', g, m, ticks,
    { durationMs: +(clock()-started).toFixed(2), destination: chosen?.id || null,
      completed: !!chosen, carried: u.carry });
}
{
  const { g, z, from, to } = scenario();
  const e = g.makeEnemy({ species: 'goblin', level: 5, hp: 1000,
    damage: 8, gold: 0, xp: 0 }, from);
  const ally = g.makeEnemy({ species: 'goblin', level: 5, hp: 1000,
    damage: 8, gold: 0, xp: 0 }, to);
  e.aggro = true;
  z.enemies = [e, ally];
  // Isolate the actual regroup route/search and commitment while keeping
  // native route(), terrain, and the real tacticalBeginRogueRegroup body.
  g.tacticalRegroupGroups = () => [{ members: [ally] }];
  g.tacticalRegroupCandidates = () => [ally];
  g.tacticalRogueEligibility = () => true;
  g.hawkRetreatLocked = () => false;
  g.tacticalDefenderTerritory = () => 0;
  g.isDungeon = () => true;
  const m = watch(g), ticks = [], started = clock();
  for (let i = 0; i < 40 && !g._tacticalRegroups?.has(e.id); i++) {
    g.s.time += 0.05;
    const before = m.blocked;
    g.tacticalSeekRogueSupport(e, 4);
    ticks.push(m.blocked - before);
  }
  result('enemy-regroup-route-search', g, m, ticks,
    { durationMs: +(clock()-started).toFixed(2),
      committed: !!g._tacticalRegroups?.has(e.id), allyId: ally.id });
}
console.log('PASS terrain-search workload audit: test-only instrumentation, source-call attribution, and unchanged native collision');
