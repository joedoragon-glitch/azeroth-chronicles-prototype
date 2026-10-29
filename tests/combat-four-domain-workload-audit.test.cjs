'use strict';
// Diagnostic only: authoritative native Campaign.tick/route/projectile calls,
// no mocked collision or gameplay changes. CI CPU time is NOT device FPS.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const renderer = require('../src/prototype/renderer');
const dist = (a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clock = ()=>performance.now();

function world({count=8,party=3,wall=true,projectiles=0}) {
  const g = new Campaign('developer','paladin',()=>0.73), z=g.zone();
  z.enemies=[];z.props=[];z.nodes=[];z.npcs=[];z.buildings=[];
  g.s.mercyTime=0;g.s.valeFieldAwakened=true;
  Object.assign(g.hero,{x:1230,y:1400,hp:100000,maxHp:100000});
  g.s.party=[];
  for(let i=0;i<party;i++) {
    const type=i%3===0?'soldier':i%3===1?'archer':'pet';
    const u=g.unit(type,1190+(i%3)*20,1345+Math.floor(i/3)*35,
      type==='pet'?'thorn':undefined);
    u.hp=10000;u.maxHp=10000;g.s.party.push(u);
  }
  if(wall)for(let y=1310;y<=1550;y+=40)
    z.props.push({id:'audit-four-wall-'+y,x:1315,y,r:25});
  for(let i=0;i<count;i++){
    const e=g.makeEnemy({species:'goblin',name:'audit-foe-'+i,
      level:1,hp:100000,damage:1,gold:0,xp:0},
      {x:1390+(i%8)*25,y:1340+Math.floor(i/8)*38});
    e.aggro=true;e.cd=.5;z.enemies.push(e);
  }
  for(let i=0;i<projectiles;i++)g.s.projectiles.push({
    id:'audit-four-shot-'+i,source:'enemy',sourceId:z.enemies[i%count].id,
    x:1420+(i%7)*17,y:1270+Math.floor(i/7)*17,
    dx:-1,dy:0,speed:220+(i%4)*40,damage:1,life:3.5,
    hitRadius:18,style:'arrow',
  });
  return g;
}
function probe(g,names) {
  const records = new Map(names.map(name=>[name,{calls:0,blocked:0,peakBlocked:0,ms:0}]));
  const originals=[], old=g.blocked, own=Object.hasOwn(g,'blocked');
  let blocked=0;
  g.blocked=function(...args){blocked++;return old.apply(this,args);};
  for(const name of names) {
    if(typeof g[name]!=='function')continue;
    const fn=g[name], has=Object.hasOwn(g,name);originals.push({name,fn,has});
    g[name]=function(...args) {
      const start=clock(),before=blocked;
      try{return fn.apply(this,args)}
      finally{
        const row=records.get(name),probes=blocked-before;
        row.calls++;row.blocked+=probes;
        row.peakBlocked=Math.max(row.peakBlocked,probes);
        row.ms+=clock()-start;
      }
    };
  }
  return{
    get blocked(){return blocked},
    rows(){return [...records].map(([name,v])=>({name,calls:v.calls,blocked:v.blocked,
      peakBlocked:v.peakBlocked,ms:+v.ms.toFixed(2)})).filter(x=>x.calls)
      .sort((a,b)=>b.blocked-a.blocked||b.calls-a.calls)},
    stop(){for(const {name,fn,has} of originals)
      if(has)g[name]=fn;else delete g[name];
      if(own)g.blocked=old;else delete g.blocked;
      assert.equal(g.blocked,old);}
  };
}
const combatNames=[
  'updateEnemies','updateParty','updateProjectiles','follow','route',
  'advanceBudgetedRoute','clearSegment','line','move','blocked',
  'tacticalActiveTargetCount','tacticalPresentOpponents','tacticalLocalSupport',
  'tacticalRegroupCandidates','tacticalRegroupGroups','tacticalRogueOutnumbered',
  'tacticalAutoRogue','combatTargets','activeLivingParty','fortShotClear',
  'distanceToSegment','projectileFort'
].filter(n=>n!=='blocked');
function tickScenario(label,options,ticks=24) {
  const g=world(options),m=probe(g,combatNames),peaks=[];
  const beforeActors=g.zone().enemies.map(e=>({e,x:e.x,y:e.y}));
  for(let i=0;i<ticks;i++) {
    const old=m.blocked;
    g.tick(.05,{x:0,y:0});
    peaks.push(m.blocked-old);
  }
  const result={label,ticks,actors:options.count,party:options.party,shots:options.projectiles,
    wall:options.wall,totalBlocked:m.blocked,maxBlocked:Math.max(...peaks),
    p95Blocked:peaks.slice().sort((a,b)=>a-b)[Math.floor((ticks-1)*.95)],
    actorsMoved:beforeActors.filter(({e,x,y})=>dist(e,{x,y})>10).length,
    shotsRemaining:g.s.projectiles.length,hotspots:m.rows().slice(0,19)};
  m.stop();
  console.log('COMBAT_FOUR_DOMAIN_AUDIT '+JSON.stringify(result));
}
for(const n of [8,24,48])tickScenario('tactical-crowd-'+n,
  {count:n,party:5,wall:false,projectiles:0});
for(const n of [0,24,96])tickScenario('hostile-projectiles-'+n,
  {count:24,party:5,wall:true,projectiles:n});
// A boss/captain still uses the original synchronous navigation API: isolate
// cost of authorized native detours without accidentally reassigning skills.
for(const kind of ['ordinary','captain','boss']) {
  const g=world({count:8,party:0,wall:true,projectiles:0});
  const e=g.zone().enemies[0], from={x:e.x,y:e.y};
  if(kind==='captain')e.captain=true;
  if(kind==='boss')e.type='boss';
  const m=probe(g,['follow','route','advanceBudgetedRoute','clearSegment','move']);
  const peaks=[];
  for(let i=0;i<120;i++){
    g.s.time+=.05;
    const before=m.blocked;
    g.follow(e,g.hero,155,.05,45);
    peaks.push(m.blocked-before);
  }
  const rows=m.rows(),result={kind,ticks:120,totalBlocked:m.blocked,
    peakBlocked:Math.max(...peaks),movement:+dist(e,from).toFixed(1),methods:rows};
  m.stop();
  console.log('BOSS_CAPTAIN_ROUTE_AUDIT '+JSON.stringify(result));
  assert(result.movement>10,kind+' retains native pursuit progress');
}
assert.equal(typeof renderer.create,'function');
console.log('RENDERER_MEASUREMENT_BOUNDARY '+JSON.stringify({
  canvas:'renderer.js draw()/metrics().phases samples every twelfth permitted draw',
  overlay:'renderer.js renderLayer=overlay still paints combat cues, nameplates and projectiles',
  pixi:'pixi-experimental.js draw() syncs viewport/background/actors/atmosphere then scene.draw()',
  device:'Browser main-thread / GPU compositing / physical FPS require timed browser or device capture',
}));
console.log('PASS combat four-domain audit native simulation, projectile collision and renderer interface');
