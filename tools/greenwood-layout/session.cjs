'use strict';
// A native scripted exploration/combat pilot, not a human enjoyment or device claim.
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto'),
  cp = require('node:child_process');
const C = require('../../src/prototype/engine'),
  { rng } = require('./fixtures.cjs');
const seconds = Number(process.argv[2] || 600),
  seed = Number(process.argv[3] || 0x47564101);
if (![600, 1800].includes(seconds)) throw Error('Focused pilots are 600 or 1800 simulated seconds');
const g = new C('normal', 'paladin', rng(seed)),
  out = path.resolve(__dirname, '../../docs/evidence/greenwood-revised-20261028');
const route = [
  'supplier',
  'recruiter',
  'board',
  'rest',
  'minor',
  'orchard',
  'mill-pond',
  'bridge-north',
  'outbound',
  'bridge-south',
  'goblin-camp',
  'den-ruins',
  'cache',
  'entrance',
  'supply-entrance',
];
const mode = process.argv[4] || 'orientation';
if (!['orientation', 'farm-woods', 'estate'].includes(mode)) throw Error('Unknown pilot circuit');
if (mode === 'farm-woods')
  route.splice(
    0,
    route.length,
    'supplier',
    'recruiter',
    'minor',
    'orchard',
    'mill-pond',
    'goblin-camp',
    'den-ruins',
    'bridge-south',
    'minor',
    'rest',
  );
if (mode === 'estate')
  route.splice(
    0,
    route.length,
    'supplier',
    'recruiter',
    'bridge-north',
    'outbound',
    'cache',
    'entrance',
    'supply-entrance',
    'bridge-south',
    'rest',
  );
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  visits = [],
  stalls = [],
  positions = [],
  initialOrdinary = g.zone().enemies.filter((e) => e.type === 'mob' && !e.summon).length;
let index = 0,
  travel = 0,
  still = 0,
  last = g.hero,
  priorDeaths = 0,
  combatSeconds = 0,
  restCalls = 0,
  successfulRests = 0,
  healRequests = 0,
  recoveries = 0,
  restRetry = 0,
  dwellUntil = 0;
const build = g.build();
const started = performance.now();
for (let step = 0; step < seconds * 10; step++) {
  const z = g.zone(),
    by = (id) => z.npcs.find((n) => n.id === id),
    n = by(route[index % route.length]),
    point = n?.servicePoint || n;
  if (g.zoneId !== 'vale' || g.hero.hp <= 0 || !point) break;
  // Native player actions, with their real prerequisites and costs. The first
  // pilot omitted healing/recovery and spammed rejected refuge calls every tick.
  // Retain that evidence; this strategy is a separate, explicitly named pilot.
  if (g.hero.talentPoints > 0) g.talent(g.hero.talents[2] < g.talentMaxRank(2) ? 2 : 0);
  if (
    g.hero.hp < g.hero.maxHp * 0.7 &&
    !g.hasSupportEffect(g.hero, 'health') &&
    !g.queuedRangerHeal()
  )
    if (g.requestRangerHeal()) healRequests++;
  const captain = by('recruiter'),
    fallen = g.s.party.some((u) => u.hp <= 0);
  if (captain && distance(g.hero, captain) <= 110 && fallen) if (g.recover()) recoveries++;
  const threat = z.enemies
    .filter(
      (e) =>
        e.hp > 0 && !e.neutral && !e.returning && e.type === 'mob' && distance(e, g.hero) < 260,
    )
    .sort((a, b) => distance(a, g.hero) - distance(b, g.hero))[0];
  if (step / 10 < dwellUntil && !threat) {
    g.hero.order = null;
  } else if (g.hero.hp < g.hero.maxHp * 0.35) {
    const rest = z.npcs
        .filter((n) => n.kind === 'rest')
        .sort(
          (a, b) => distance(a.servicePoint || a, g.hero) - distance(b.servicePoint || b, g.hero),
        )[0],
      p = rest.servicePoint || rest;
    if (distance(g.hero, p) <= 100 && !g.refugeThreat()) {
      if (g.s.time >= restRetry) {
        if (g.interact(rest)) successfulRests++;
        restCalls++;
        restRetry = g.s.time + Math.max(1, g.s.restCooldown || 0);
      }
      g.hero.order = null;
    } else if (distance(g.hero, p) <= 100 && g.refugeThreat()) {
      // Keep retreating into the existing safe town instead of waiting beside
      // pursuing enemies and repeatedly requesting a rest the game refuses.
      const town = g.safe(C.data.towns[0][0] - 100, C.data.towns[0][1] - 80);
      if (g.hero.order?.type !== 'move' || distance(g.hero.order, town) > 2)
        g.hero.order = { type: 'move', ...town, navigation: true };
    } else if (g.hero.order?.type !== 'move' || g.hero.order.x !== p.x || g.hero.order.y !== p.y)
      g.hero.order = { type: 'move', x: p.x, y: p.y, navigation: true };
  } else if (threat) {
    if (g.hero.order?.type !== 'attack' || g.hero.order.id !== threat.id)
      g.hero.order = { type: 'attack', id: threat.id };
    combatSeconds += 0.1;
  } else if (distance(g.hero, point) > 30) {
    if (g.hero.order?.type !== 'move' || g.hero.order.x !== point.x || g.hero.order.y !== point.y)
      g.hero.order = { type: 'move', x: point.x, y: point.y, navigation: true };
  } else {
    if (['landmark', 'rest'].includes(n.kind)) g.interact(n);
    visits.push({
      id: n.id,
      time: Math.round(step / 10),
      position: { x: g.hero.x, y: g.hero.y },
      kind: n.kind,
    });
    index++;
    dwellUntil = step / 10 + 5;
  }
  const before = { x: g.hero.x, y: g.hero.y };
  g.tick(0.1);
  const moved = distance(before, g.hero);
  travel += moved;
  still =
    moved < 0.05 && !threat && step / 10 >= dwellUntil && g.hero.hp >= g.hero.maxHp * 0.35
      ? still + 0.1
      : 0;
  if (still > 12) {
    stalls.push({
      time: step / 10,
      target: n.id,
      hero: before,
      path: g.route(g.hero, point).length,
    });
    g.hero.order = null;
    index++;
    still = 0;
  }
  if (g.s.statistics.deaths !== priorDeaths) {
    priorDeaths = g.s.statistics.deaths;
    // A death is recorded as a failed leg; resume exploration after recovery,
    // rather than resetting the same opening sequence indefinitely.
    visits.push({ id: n.id, time: Math.round(step / 10), outcome: 'death before destination' });
    index++;
  }
  if (step % 600 === 0) {
    fs.mkdirSync(path.resolve(__dirname, '../../test-results'), { recursive: true });
    fs.writeFileSync(
      path.resolve(__dirname, '../../test-results/session-progress-' + seconds + '.json'),
      JSON.stringify({
        step,
        simulatedSeconds: g.s.time,
        visits: visits.length,
        kills: g.s.statistics.kills,
        deaths: g.s.statistics.deaths,
      }),
    );
  }
  if (step % 100 === 0)
    positions.push({
      time: step / 10,
      x: g.hero.x,
      y: g.hero.y,
      hp: g.hero.hp,
      level: g.hero.level,
      kills: g.s.statistics.kills,
      deaths: g.s.statistics.deaths,
    });
  last = g.hero;
}
const snapshot = g.snapshot();
const result = {
  sourceSha: cp.execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  sourceGreenwoodSha256: crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.resolve(__dirname, '../../src/prototype/greenwood.js')))
    .digest('hex'),
  seed,
  mode,
  requestedSimulatedSeconds: seconds,
  actualGameSeconds: g.s.time,
  hostCpuWallMs: Math.round(performance.now() - started),
  boundary:
    'Native Normal Paladin and starting companions; move/attack orders, legal earned Health/Power training, requested Ranger healing, paid Captain recovery when affordable, native rests, five-second scene stops and one normal build request. No direct actor/crown/HP/XP/rank/damage/count edits. Algorithmic exploration is not manual newcomer or human enjoyment acceptance.',
  initialOrdinary,
  displacementUnitsIncludingTeleports: Math.round(travel),
  distanceBoundary:
    'Cumulative frame-to-frame displacement includes automatic death returns; not walked distance. Collision-route lengths are in the comparison datasets.',
  stallBoundary:
    'More than 12 seconds without movement while healthy, no nearby threat, outside scene stops; excludes combat/recovery loops.',
  combatSeconds: Math.round(combatSeconds),
  buildRequested: !!build,
  restCalls,
  successfulRests,
  healRequests,
  recoveries,
  visits,
  stalls,
  positions,
  final: {
    zone: g.zoneId,
    level: g.hero.level,
    hp: g.hero.hp,
    kills: g.s.statistics.kills,
    deaths: g.s.statistics.deaths,
    crowns: g.hero.gold,
    completedValeQuests: g
      .questDefs()
      .filter((q) => q.region === 'vale' && g.s.quests[q.id]?.done)
      .map((q) => q.id),
    livingCompanions: g.activeLivingParty().length,
  },
  snapshotSha256: crypto.createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'),
};
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(
  path.join(out, 'session-' + mode + '-' + seconds + '-' + seed + '.json'),
  JSON.stringify(result, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    seconds,
    actual: result.actualGameSeconds,
    visits: visits.length,
    stalls: stalls.length,
    ...result.final,
    hostMs: result.hostCpuWallMs,
  }),
);
