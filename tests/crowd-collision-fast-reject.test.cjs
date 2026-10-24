'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const Campaign = require('../src/prototype/engine');

// Reconstruct the exact pre-change navigation routines from the candidate
// source, then mount that original navigation onto a separate Campaign class.
// This compares actual old/new collision consumers, not a simplified formula.
const filename = require.resolve('../src/prototype/navigation.js');
const updated = fs.readFileSync(filename, 'utf8');
function restore(source, start, end, original) {
  const from = source.indexOf(start), to = source.indexOf(end, from);
  assert(from >= 0 && to >= 0, 'Expected fast rejection edit missing: ' + start);
  assert.equal(source.indexOf(start, from + start.length), -1, 'Edit anchor must be unique');
  return source.slice(0, from) + original + source.slice(to + end.length);
}
const legacyTerrain = `                  ? Math.hypot(x - p.x, y - p.y) < p.r + radius`;
const terrainStart = '                  ? // Reject obstacles far outside the circle';
const terrainEnd = 'Math.hypot(x - p.x, y - p.y) < p.r + radius)';
const legacyScenery = `              if (
                r === null ||
                (candidate && R.sceneryTraversal.radii[p.structure] === 0) ||
                Math.hypot(x - p.x, y - p.y) >= r + radius
              )
                return false;
              const body = candidate ? this.sceneryMovementRadius(p, z) : r;
              return body !== null && Math.hypot(x - p.x, y - p.y) < body + radius;`;
const sceneryStart = '              if (r === null || (candidate && R.sceneryTraversal.radii[p.structure] === 0))';
const sceneryEnd = 'return body !== null && distance < body + radius;';
let original = restore(updated, terrainStart, terrainEnd, legacyTerrain);
original = restore(original, sceneryStart, sceneryEnd, legacyScenery);
const alternate = new Module(filename, module);
alternate.filename = filename;
alternate.paths = Module._nodeModulePaths(path.dirname(filename));
alternate._compile(original, filename);
class BaselineCampaign extends Campaign {}
alternate.exports.install(BaselineCampaign, Campaign.data, Campaign.rules, Campaign.dungeonIds);

const unitProps = [
  { id: 'circle', x: 400, y: 1500, r: 25 },
  { id: 'edge', x: 600, y: 1500, r: 15 },
  { id: 'decoration', x: 300, y: 1470, r: 45, decorative: true },
  { id: 'home', x: 600, y: 1600, r: 30, structure: 'house' },
];
function setup(Klass) {
  const g = new Klass('developer', 'paladin', () => 0.73);
  g.s.party = [];
  g.zone().enemies = [];
  g.zone().props = unitProps.map(p => ({...p}));
  Object.assign(g.hero, {x: 300, y: 1500});
  return g;
}
function pair(fn, label) {
  const a = setup(Campaign), b = setup(BaselineCampaign);
  const result = fn(a, b);
  assert.deepEqual(JSON.parse(JSON.stringify(a.snapshot())),
    JSON.parse(JSON.stringify(b.snapshot())), label + ' snapshot');
  return result;
}

// Exact comparison of physical collision in ordinary, LOS, decorative,
// legacy radius=0, excluded props, altered radii, and map edge conditions.
pair((a,b) => {
  const directions = [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1]];
  for (const radius of [0, 1, 14, 15, 26, 45]) {
    for (let x = 70; x <= 850; x += 13) {
      for (let y = 1320; y <= 1690; y += 17) {
        assert.equal(a.blocked(x,y,'vale',radius), b.blocked(x,y,'vale',radius),
          'blocked equality at '+[x,y,radius]);
      }
    }
    for (const [dx,dy] of directions) {
      for (const offset of [0, 1e-7, -1e-7, 15, 25, 40]) {
        const x = 400 + (25 + radius + offset) * dx,
          y = 1500 + (25 + radius + offset) * dy;
        assert.equal(a.blocked(x,y,'vale',radius), b.blocked(x,y,'vale',radius));
      }
    }
  }
  for (const g of [a,b]) {
    const z = g.zone();
    g.setSceneryTraversal(z, true);
    z.props.push({ id:'art', structure:'house', decorative:true, x:510,y:1450,r:40 });
  }
  for (const x of [400, 450, 490, 510, 530, 550, 600])
    for (const y of [1430, 1450, 1470, 1500, 1600])
      for (const radius of [0, 14, 26]) {
        assert.equal(a.blocked(x,y,'vale',radius), b.blocked(x,y,'vale',radius));
      }
  // In-place mutations and replacement lists cannot make a stale index.
  for (const g of [a,b]) {
    const p = g.zone().props[0];
    p.x += 100; p.y -= 45; p.r = 32;
    g.zone().props.splice(1,1);
    g.zone().props.push({id:'new',x:620,y:1510,r:30});
  }
  for (let x=290; x<750; x+=7)
    for (let y=1430; y<1640; y+=11)
      assert.equal(a.blocked(x,y), b.blocked(x,y),'mutable scenery');
  const fort={props:new Set(['circle','new']), partitions:new Set()};
  for (let x=300; x<700; x+=13)
    for(let y=1400; y<1660; y+=17)
      assert.equal(a.blocked(x,y,'vale',15,false,fort),
        b.blocked(x,y,'vale',15,false,fort),'fort destroyed props');
}, 'geometry');

// Real movement/formation collision equivalence, including limited passage
// in a narrow obstructed lane. No changed state, knockback or deaths.
pair((a,b) => {
  function place(g) {
    const z=g.zone(); z.props=[];
    for (let x=100; x<=900; x+=25)
      for(const y of [1450,1550]) z.props.push({id:'lane-'+x+'-'+y,x,y,r:30});
    const troop=g.unit('soldier',280,1500,'crypt'); troop.active=true;
    g.s.party=[troop];
    for(let k=0;k<10;k++){
      const e=g.makeEnemy({species:'goblin',name:'Crowd obstacle',
        level:1,hp:100000,damage:0,gold:0,xp:0},{x:330+k*12,y:1500});
      z.enemies.push(e);
    }
  }
  place(a);place(b);
  for (let tick=0;tick<25;tick++) {
    for (const g of [a,b]) {
      g.observeCrowdFrame(75);
      g.s.time += .075;
      for (const u of [g.hero, ...g.s.party, ...g.zone().enemies])
        g.move(u,{x:800,y:1500},100,.075);
      g.separateActors(.075);
    }
    assert.deepEqual(JSON.parse(JSON.stringify(a.snapshot())),
      JSON.parse(JSON.stringify(b.snapshot())), 'crowd step '+tick);
  }
}, 'crowded movement');

// A focused, instrumented comparison. Report clock time as a diagnostic,
// never require a fixed speedup on a shared CI runner.
function stress(Klass) {
  const g=setup(Klass);
  const z=g.zone();
  z.props = Array.from({length:600},(_,i)=>({
    id:'remote-'+i,x:850+(i%40)*26,y:700+Math.floor(i/40)*25,r:17,
  }));
  z.props.push({id:'near',x:400,y:1500,r:25});
  let hypotCalls=0;
  const old=Math.hypot;
  Math.hypot=(...a)=>{hypotCalls++;return old(...a)};
  const started=process.hrtime.bigint();
  let blocked=0;
  try {
    for(let k=0;k<3200;k++) {
      const x=285+(k%37)*9, y=1420+((k*7)%23)*7;
      if(g.blocked(x,y,'vale',14))blocked++;
    }
  } finally {Math.hypot=old}
  return { hypotCalls, blocked, ms:Number(process.hrtime.bigint()-started)/1e6 };
}
const baseline=stress(BaselineCampaign),candidate=stress(Campaign);
assert.equal(candidate.blocked,baseline.blocked);
assert(candidate.hypotCalls < baseline.hypotCalls*.55,
  'Fast broad rejection significantly reduces precise distance calculations');
console.log('Collision diagnostic comparison (shared CI timings not a certified FPS gain):');
console.log(JSON.stringify({baseline,candidate,
  avoidedPreciseDistanceCalls:baseline.hypotCalls-candidate.hypotCalls}));

// Guard preexisting crowd escape and retreat passage directly, not the full suite.
require('./crowd-escape.test.cjs');
require('./retreat-party-collision.test.cjs');
console.log('PASS fast collision rejection: live baseline equivalence, mutation, crowd motion and focused contracts');
