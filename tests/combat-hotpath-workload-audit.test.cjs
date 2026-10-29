'use strict';
// Source-grounded combat CPU diagnostic. Wrappers are test-instance-only:
// no changes to native collision, combat, saves or runtime instrumentation.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const version = require('../package.json').version;
const timed = [
  'updateParty', 'updateEnemies', 'updateProjectiles', 'updatePacks',
  'syncSquadDoctrine', 'squadContext', 'combatTargets', 'activeLivingParty',
  'line', 'clearSegment', 'move', 'follow', 'companionTravelClear',
  'companionSafetyAssessment', 'tacticalActiveTargetCount',
  'tacticalHighestThreatTarget', 'tacticalRegroupCandidates',
  'tacticalRegroupGroups', 'tacticalLocalSupport', 'tacticalPresentOpponents',
  'tacticalAutoRogue', 'enemyRangedLine', 'fortShotClear',
  'advanceBudgetedRoute', 'gatheringThreats', 'route', 'companionRoute',
];
function witness(g) {
  let blocked = 0;
  const counts = new Map(timed.map(name => [name, { calls: 0, blockedInclusive: 0, maxBlocked: 0, msInclusive: 0 }]));
  const previous = new Map();
  const originalBlocked = g.blocked, ownBlocked = Object.hasOwn(g, 'blocked');
  g.blocked = function (...args) { blocked++; return originalBlocked.apply(this, args); };
  for (const name of timed) {
    if (typeof g[name] !== 'function') continue;
    const original = g[name], own = Object.hasOwn(g, name);
    previous.set(name, { original, own });
    g[name] = function (...args) {
      const before = blocked, start = performance.now();
      try { return original.apply(this, args); }
      finally {
        const row = counts.get(name), used = blocked - before;
        row.calls++;
        row.blockedInclusive += used;
        row.maxBlocked = Math.max(row.maxBlocked, used);
        row.msInclusive += performance.now() - start;
      }
    };
  }
  return {
    get probes() { return blocked; },
    summary() {
      return [...counts].filter(([, r]) => r.calls).map(([name, r]) => ({
        name, calls: r.calls, blockedInclusive: r.blockedInclusive,
        maxBlocked: r.maxBlocked, msInclusive: +r.msInclusive.toFixed(2),
      })).sort((a,b) => b.blockedInclusive - a.blockedInclusive || b.calls - a.calls);
    },
    stop() {
      for (const [name, { original, own }] of previous) {
        if (own) g[name] = original; else delete g[name];
      }
      if (ownBlocked) g.blocked = originalBlocked; else delete g.blocked;
      assert.equal(g.blocked, originalBlocked);
    },
  };
}
function world({ count = 8, companions = 3, quiet = false, shots = 0, wall = false }) {
  const g = new Campaign('developer', 'paladin', () => 0.73), z = g.zone();
  z.props = []; z.nodes = []; z.buildings = []; z.enemies = [];
  g.s.valeFieldAwakened = true;
  g.s.mercyTime = 0;
  g.s.recallActive = false;
  Object.assign(g.hero, { x: quiet ? 330 : 1230, y: quiet ? 330 : 1400,
    hp: 100000, maxHp: 100000 });
  const party = [];
  for (let i=0; i<companions; i++) {
    const type = i%3 === 0 ? 'soldier' : i%3 === 1 ? 'archer' : 'pet';
    const u = g.unit(type, 1190+(i%3)*20, 1345+Math.floor(i/3)*35,
      type==='pet' ? 'thorn' : undefined);
    u.hp = Math.max(u.hp, 10000);
    u.maxHp = Math.max(u.maxHp, u.hp);
    u.order = null;
    party.push(u);
  }
  g.s.party = party;
  if (wall) for (let y=1310;y<=1550;y+=40)
    z.props.push({ id:'combat-probe-wall-'+y, x:1315, y, r:25 });
  for(let i=0;i<count;i++) {
    const e=g.makeEnemy({
      species: 'goblin', name: 'Combat audit actor '+i, level:1,
      hp: 100000, damage: 1, gold:0, xp:0
    }, { x:quiet ? 1800+(i%6)*25 : 1390+(i%6)*26,
         y:quiet ? 1700+Math.floor(i/6)*35 : 1340+Math.floor(i/6)*38 });
    e.aggro = !quiet;
    e.cd = 0.5;
    z.enemies.push(e);
  }
  // Real enemy projectile physics and terrain interception path, with a
  // deterministic native projectile state. No stubbed geometry or hits.
  for(let i=0; i<shots; i++) {
    g.s.projectiles.push({
      id:'audit-shot-'+i, source:'enemy', sourceId:z.enemies[i%z.enemies.length].id,
      x:1420+(i%4)*14, y:1260+Math.floor(i/4)*23,
      dx:-1, dy:0, speed:180+(i%3)*60, damage:1,
      life:3.5, hitRadius:18, style:'arrow'
    });
  }
  return g;
}
function run(label, options, instrument = true) {
  const g=world(options), m=instrument?witness(g):null, rows=[], began=performance.now();
  for(let i=0;i<24;i++) {
    const before=m?.probes || 0;
    const t=performance.now();
    g.tick(0.05, {x:0,y:0});
    rows.push({ probes:m ? m.probes-before : 0, ms:performance.now()-t,
      shots:g.s.projectiles.length });
  }
  const snapshot=g.snapshot();
  const s=rows.map(r=>r.probes).sort((a,b)=>a-b),
    result={ label, version, ticks:rows.length,
      enemies:options.count, companions:options.companions,
      projectileSeed:options.shots||0, wall:!!options.wall,
      totalBlocked:m?.probes ?? null, peakBlocked:s.at(-1)||0,
      p95Blocked:s[Math.floor((s.length-1)*.95)]||0,
      tickDurationMs:+(performance.now()-began).toFixed(2),
      maximumTickMs:+Math.max(...rows.map(r=>r.ms)).toFixed(2),
      methods:m?.summary().slice(0,23)||[], endingShots:g.s.projectiles.length,
      survivingEnemies:g.zone().enemies.filter(e=>e.hp>0).length };
  if(m) { m.stop(); assert(!Object.hasOwn(g,'blocked')); }
  console.log('COMBAT_HOTPATH_AUDIT '+JSON.stringify(result));
  return snapshot;
}
const controls=[
  ['quiet-12-enemies',{ count:12,companions:0,quiet:true }],
  ['engaged-8-enemies-3-allies',{ count:8,companions:3 }],
  ['engaged-24-enemies-5-allies',{ count:24,companions:5 }],
  ['crowded-wall-24-enemies',{ count:24,companions:5,wall:true }],
  ['projectiles-24-enemies-24-shots',{ count:24,companions:5,shots:24 }],
  ['wall-and-projectiles-24-enemies',{ count:24,companions:5,shots:24,wall:true }]
];
for (const [label, options] of controls) run(label, options);
// Verify observer wrappers preserve saved gameplay outcomes in a live battle.
const options={count:8, companions:3};
const native=run('parity-uninstrumented',options,false);
const measured=run('parity-instrumented',options,true);
assert.deepEqual(measured,native,'test-only method wrappers may not alter combat');
const crowdedOptions={count:24,companions:5,wall:true};
const nativeCrowded=run('parity-wall-uninstrumented',crowdedOptions,false);
const measuredCrowded=run('parity-wall-instrumented',crowdedOptions,true);
assert.deepEqual(measuredCrowded,nativeCrowded,
  'test-only instrumentation cannot change obstructed enemy pursuit decisions');

// The synchronous route() is a deliberate public API. The incremental enemy
// planner must choose the same valid waypoints when allowed to complete.
{
  const g=world({count:1,companions:0,wall:true}), e=g.zone().enemies[0],
    destination={x:g.hero.x,y:g.hero.y}, origin={x:e.x,y:e.y},
    native=g.route(origin,destination);
  let pending=null, found=null, completed=false;
  for (let tick=0;tick<200;tick++) {
    g.s.time+=.05;
    const outcome=g.advanceBudgetedRoute(pending?.origin || origin,
      pending?.target || destination,'pursuit',pending);
    if (!outcome.pending) {
      found=outcome.path;completed=true;break;
    }
    pending=outcome.state;
  }
  assert(completed, 'bounded ordinary enemy route must complete');
  assert.deepEqual(found,native,
    'ordinary enemy pursuit uses the same native valid four-neighbor route');
  console.log('PASS combat pursuit route parity: '+native.length+' waypoints');
}
// Even if the hero moves a few units every update, real enemies must continue
// advancing a pending route rather than restarting forever.
{
  const g=world({count:4,companions:0,wall:true});
  let peak=0, probes=0;
  const original=g.blocked;
  g.blocked=function(...args){probes++;return original.apply(this,args);};
  const enemy=g.zone().enemies[0], startX=enemy.x;
  for(let tick=0;tick<160;tick++){
    const before=probes;
    g.hero.y=1400+Math.sin(tick/18)*20;
    g.tick(.05,{x:0,y:0});
    peak=Math.max(peak,probes-before);
  }
  delete g.blocked;
  assert(peak<=1500, 'enemy pursuit planning must not cause multi-thousand-probe spikes');
  assert(enemy.x<startX-25 || enemy.y<1300 || enemy.y>1580,
    'enemy must advance across or around native obstacle while hero moves');
  console.log('COMBAT_PURSUIT_LIVENESS '+JSON.stringify({
    peakBlocked:peak,totalBlocked:probes,
    progressed:+Math.hypot(enemy.x-startX,enemy.y-1340).toFixed(1),
  }));
}

// Same live-battle progression sample on baseline and candidate, not a
// synthetic route-only speed test. Measures how AI responsiveness changes.
for(const [label, opts] of [
  ['open-8-enemies-6sec',{count:8,companions:3}],
  ['wall-8-enemies-6sec',{count:8,companions:3,wall:true}],
]) {
  const g=world(opts), actors=g.zone().enemies.map(e=>({
    e,x:e.x,y:e.y,initialDistance:Math.hypot(e.x-g.hero.x,e.y-g.hero.y)
  }));
  let blocked=0, peak=0;
  const original=g.blocked;
  g.blocked=function(...args){blocked++;return original.apply(this,args);};
  for(let i=0;i<120;i++) {
    const before=blocked;
    g.tick(.05,{x:0,y:0});
    peak=Math.max(peak,blocked-before);
  }
  delete g.blocked;
  const data=actors.map(({e,x,y,initialDistance})=>({
    moved:Math.hypot(e.x-x,e.y-y),
    closer:initialDistance-Math.hypot(e.x-g.hero.x,e.y-g.hero.y),
    noProgress:e.noProgress||0,
    aggro:!!e.aggro,
  }));
  console.log('COMBAT_PURSUIT_RESPONSIVENESS '+JSON.stringify({
    label, ticks:120, enemyCount:actors.length,
    enemiesMoved:data.filter(x=>x.moved>10).length,
    meanMovement:+(data.reduce((s,x)=>s+x.moved,0)/data.length).toFixed(1),
    meanDistanceImprovement:+(data.reduce((s,x)=>s+x.closer,0)/data.length).toFixed(1),
    maximumNoProgress:+Math.max(...data.map(x=>x.noProgress)).toFixed(2),
    peakBlocked:peak,totalBlocked:blocked,
  }));
}
console.log('PASS combat hotpath audit native multi-actor ticks and test-only instrumentation parity');
