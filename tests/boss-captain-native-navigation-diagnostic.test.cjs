'use strict';
// Issue #615: TEST-ONLY native active boss/captain route attribution.
// Keep authored terrain, NPCs, props, attack/phase code and native collision.
// Positions may be reconstructed from existing obstacle lanes, not owner saves.
// Node runner CPU times are NOT iPhone/Chromebook FPS or GPU measurements.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const VERSION = require('../package.json').version;
const dt = 0.05;
const d = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const xy = a => [Math.round(a.x),Math.round(a.y)];
const round = n => +n.toFixed(3);
const percentile = (samples,p) => {
  if(!samples.length) return 0;
  const sorted=samples.slice().sort((a,b)=>a-b);
  return sorted[Math.ceil(p*sorted.length)-1];
};
function build(zone,actorKind) {
  const g = new Campaign('normal','paladin',()=>0.73);
  if(zone!=='vale') assert.equal(g.enter(zone),true,'native zone exists: '+zone);
  if(g.hero.level < 2) g.xp(120);
  const z=g.zone(),original=z.enemies.slice();
  const select=actorKind==='field-boss'
    ? e=>e.type==='boss' && e.hp>0 && !e.neutral
    : actorKind==='field-captain'
      ? e=>e.fieldCaptain && e.hp>0 && !e.neutral
      : e=>e.roomCaptain && e.hp>0 && !e.neutral;
  const e=original.find(select);
  assert(e,'Native '+actorKind+' missing in '+zone+'; do not substitute a fake elite.');
  z.enemies=[e]; // isolate one actual native actor, never remove authored scenery
  g.s.party=[];
  g.s.mercyTime=0;
  g.s.valeFieldAwakened=true;
  return {g,z,e,original};
}
function lane(g,e) {
  const origin={x:e.x,y:e.y},size=g.definition().size;
  const candidate=(a,b,originKind)=>{
    if(d(a,b)<100 || d(a,b)>420) return null;
    if(g.blocked(a.x,a.y) || g.blocked(b.x,b.y))return null;
    if(g.clearSegment(a,b))return null;
    const path=g.route(a,b);
    return path.length ? {a,b,originKind,waypoints:path.length} : null;
  };
  // First try the actor's real spawning location against nearby walkable points.
  for(const radius of [180,260,360])for(let n=0;n<24;n++){
    const angle=n*Math.PI/12;
    const b={x:origin.x+Math.cos(angle)*radius,y:origin.y+Math.sin(angle)*radius};
    if(b.x<150||b.y<150||b.x>size-150||b.y>size-150)continue;
    if(g.blocked(b.x,b.y))continue;
    if(!g.clearSegment(origin,b)){
      const found=candidate(origin,b,'authored-actor-home');
      if(found)return found;
    }
  }
  // If the native home is unobstructed, use a deterministic reconstructed
  // lane through *unchanged* source terrain for an obstructed active encounter.
  // Do not manufacture walls or override blocked()/clearSegment()/route().
  let routeAttempts=0;
  for(let y=280;y<size-280;y+=160)for(let x=280;x<size-550;x+=160){
    for(const [dx,dy] of [[250,0],[0,250],[250,160],[-250,160]]){
      const a={x,y},b={x:x+dx,y:y+dy};
      if(g.blocked(a.x,a.y)||g.blocked(b.x,b.y)||g.clearSegment(a,b))continue;
      if(++routeAttempts>16)return null;
      const found=candidate(a,b,'reconstructed-native-terrain');
      if(found)return found;
    }
  }
  return null;
}
function measure(label,zone,kind) {
  const {g,e,z,original}=build(zone,kind);
  const way=lane(g,e);
  assert(way,'No reachable obstructed native lane for '+label+'; fixture needs investigation.');
  // Put a REAL authored elite in a reachable obstructed corridor. Only the
  // positions are reconstructed; its attack, reset, classification and AI are real.
  Object.assign(e,way.a);
  e.home={...way.a};
  Object.assign(g.hero,way.b,{hp:100000,maxHp:100000});
  const started=g.engage(e,true,false);
  assert.notEqual(started,false,'native engage must accept '+label);
  const orig={blocked:g.blocked,route:g.route,follow:g.follow,advance:g.advanceBudgetedRoute};
  let tickIndex=0,probes=0,inRoute=false;
  const calls=[],follows=[],ticks=[],states=[],budgeted=[];
  g.blocked=function(...args){probes++;return orig.blocked.apply(this,args)};
  g.route=function(source,target,...rest){
    const before=probes,start=performance.now(),stack=(new Error()).stack?.split('\n').slice(2,7).map(x=>x.trim());
    const prev=inRoute;inRoute=true;
    try{
      const path=orig.route.call(this,source,target,...rest);
      calls.push({tick:tickIndex,phase:tickIndex<120?'active':'return',
        actorId:source?.id||null,actorType:source?.type||null,actorFamily:source?.family||null,
        origin:xy(source),target:xy(target),aggro:!!source.aggro,returning:!!source.returning,
        telegraph:!!source.telegraph,motion:!!source.motion,
        probes:probes-before,ms:round(performance.now()-start),waypoints:path.length,stack});
      return path;
    } finally {inRoute=prev;}
  };
  g.advanceBudgetedRoute=function(a,b,mode,...rest){
    const before=probes;
    const result=orig.advance.call(this,a,b,mode,...rest);
    budgeted.push({tick:tickIndex,mode,probes:probes-before,
      pending:!!result.pending,pathLength:result.path?.length||0});
    return result;
  };
  g.follow=function(actor,target,speed,elapsed,stop,mode){
    if(actor===e)follows.push({tick:tickIndex,phase:tickIndex<120?'active':'return',
      target:xy(target),from:xy(actor),stop,aggro:!!actor.aggro,returning:!!actor.returning,
      warning:!!actor.telegraph,motion:!!actor.motion,mode:mode||'default'});
    return orig.follow.apply(this,arguments);
  };
  const posStart={x:e.x,y:e.y};
  function step() {
    const before=probes,previous={x:e.x,y:e.y},
      patrolIndex=e.captainPatrolIndex,start=performance.now();
    g.tick(dt,{x:0,y:0});
    const used=probes-before;
    // An incremental frontier is not a failed inspection checkpoint.
    if(budgeted.some(v=>v.tick===tickIndex&&v.mode==='captain-patrol'&&v.pending))
      assert.equal(e.captainPatrolIndex,patrolIndex,
        'field captain may not skip its authored checkpoint while planning');
    ticks.push({index:tickIndex,phase:tickIndex<120?'active':'return',probes:used,
      ms:round(performance.now()-start),moved:round(d(previous,e))});
    states.push({aggro:!!e.aggro,returning:!!e.returning,telegraph:!!e.telegraph,
      rangedAim:!!e.rangedAim,motion:!!e.motion,health:round(e.hp)});
    tickIndex++;
  }
  for(let n=0;n<120;n++)step(); // six real seconds: attacks, pursuit and telegraphs
  const activeEnd={x:e.x,y:e.y},activeState={...states.at(-1)};
  // Invoke native disengagement transition, then advance its real lifecycle.
  // This is distinct from re-calling isolated follow() manually.
  g.disengage(e,dt);
  for(let n=0;n<120;n++)step();
  const peak=ticks.reduce((a,b)=>b.probes>a.probes?b:a,ticks[0]);
  const top=calls.slice().sort((a,b)=>b.probes-a.probes).slice(0,6);
  const summary={
    label,sourceVersion:VERSION,zone,kind,family:e.family,id:e.id,
    scene:'native Campaign.tick(.05) / authored collision, reconstructed positional lane',
    backgroundActors:original.length-1,
    setup:{originKind:way.originKind,from:xy(way.a),hero:xy(way.b),
      routeWaypoints:way.waypoints},
    active:{duration:6,ticks:120,routeCalls:calls.filter(v=>v.phase==='active').length,
      actorFollowCalls:follows.filter(v=>v.phase==='active').length,
      moved:round(d(posStart,activeEnd)),endingState:activeState},
    return:{duration:6,ticks:120,routeCalls:calls.filter(v=>v.phase==='return').length,
      actorFollowCalls:follows.filter(v=>v.phase==='return').length,
      endingPosition:xy(e),endingState:states.at(-1)},
    probes:{total:probes,p95:percentile(ticks.map(v=>v.probes),.95),
      p99:percentile(ticks.map(v=>v.probes),.99),peakTick:peak,
      routeTotal:calls.reduce((s,v)=>s+v.probes,0),
      worstRoute:top[0]||null,heavyRoutes:calls.filter(v=>v.probes>=1000).length},
    cpuMs:{p95:round(percentile(ticks.map(v=>v.ms),.95)),
      p99:round(percentile(ticks.map(v=>v.ms),.99))},
    topRoutes:top,
    attackStateTicks:{
      telegraph:states.filter(s=>s.telegraph).length,
      rangedAim:states.filter(s=>s.rangedAim).length,
      motion:states.filter(s=>s.motion).length,
      returning:states.filter(s=>s.returning).length
    },
    firstRouteTicks:calls.map(v=>v.tick).slice(0,18),
    budgeted:{calls:budgeted.length,
      modes:Object.fromEntries([...new Set(budgeted.map(v=>v.mode))].map(mode=>{
        const items=budgeted.filter(v=>v.mode===mode);
        return [mode,{calls:items.length,pending:items.filter(v=>v.pending).length,
          completed:items.filter(v=>!v.pending).length,
          totalProbes:items.reduce((s,v)=>s+v.probes,0),
          peakCallProbes:Math.max(...items.map(v=>v.probes))}];
      }))},
  };
  // Wrappers were observers, not replacement physics.
  assert.equal(ticks.length,240);
  assert.equal(g.zone(),z,'no unexpected zone change');
  assert(states.every(s=>Number.isFinite(s.health)));
  assert(follows.some(v=>v.aggro),label+' never exercised native active follow');
  assert(summary.attackStateTicks.telegraph>0,label+' did not exercise native special warnings');
  // This test is run on the fix candidate. The baseline CI output predates
  // these assertions and remains the immutable comparison receipt.
  assert.equal(calls.filter(v=>v.actorId===e.id).length,0,
    label+' must not invoke an unbounded synchronous route for its actor');
  assert(budgeted.some(v=>v.mode==='elite-pursuit'),
    label+' must exercise the independent bounded elite pool');
  assert(summary.probes.peakTick.probes<4500,
    label+' retained a multi-thousand-probe route burst');
  console.log('ISSUE615_NATIVE_ACTIVE_TRACE '+JSON.stringify(summary));
  delete g.route;delete g.blocked;delete g.follow;delete g.advanceBudgetedRoute;
  return summary;
}
const results=[
  measure('Ridge field boss','highlands','field-boss'),
  measure('Frontier field captain','frontier','field-captain'),
  measure('Highlands treasury room captain','supply-highlands','room-captain'),
  measure('Warlord field boss','frontier','field-boss')
];
assert.equal(results.length,4);
// Exact original native waypoint contract on unchanged authored obstruction.
// The independent pools may spread search over ticks but cannot substitute
// different collision, corners, destination or failed-route behavior.
for(const [zone,kind,mode] of [
  ['highlands','field-boss','elite-pursuit'],
  ['frontier','field-captain','captain-patrol'],
  ['supply-highlands','room-captain','elite-pursuit'],
]) {
  const {g,e}=build(zone,kind),way=lane(g,e);
  assert(way,'expected reachable authored obstruction for parity in '+zone);
  const original=g.route(way.a,way.b);
  assert(original.length>0,'native route must be reachable');
  const realBlocked=g.blocked;
  let blocked=0,peak=0,pending=null,found=null,ticks=0;
  g.blocked=function(...args){blocked++;return realBlocked.apply(this,args)};
  for(;ticks<400;ticks++){
    g.s.time+=dt;
    const before=blocked;
    const result=g.advanceBudgetedRoute(pending?.origin||way.a,
      pending?.target||way.b,mode,pending);
    peak=Math.max(peak,blocked-before);
    if(!result.pending){found=result.path;break;}
    pending=result.state;
  }
  delete g.blocked;
  assert(found!==null,'bounded '+mode+' must terminate in reachable native terrain');
  assert.deepEqual(found,original,'exact native route waypoints for '+mode+' '+zone);
  assert(peak<=512,'per-search elite terrain budget not exceeded');
  console.log('ISSUE615_ELITE_WAYPOINT_PARITY '+JSON.stringify({
    zone,mode,waypoints:found.length,searchTicks:ticks+1,
    peakTerrainProbes:peak,totalTerrainProbes:blocked,
    origin:xy(way.a),target:xy(way.b)}));
}
console.log('ISSUE615_SUMMARY '+JSON.stringify(results.map(r=>({
  label:r.label,originKind:r.setup.originKind,peak:r.probes.peakTick.probes,
  p95:r.probes.p95,heavyRoutes:r.probes.heavyRoutes,
  worstRoute:r.probes.worstRoute?.probes||0,activeFollow:r.active.actorFollowCalls,
  activeMoved:r.active.moved,attacks:r.attackStateTicks.telegraph
}))));
