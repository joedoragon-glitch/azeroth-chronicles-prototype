'use strict';
// Diagnostic-only reconstruction of the owner's dev.238 iPhone Vale report.
// Real Campaign.tick(), authored Vale geometry and native route()/blocked().
// Reconstructed movement/Thorn state are not a replay of the owner's save.
// No production behavior is changed; time measurements are CI CPU, not phone FPS.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine');
const waypoints=Campaign.rules.thornPatrol.route;
const reportPath=[
  [809.5,460,480],
  [810.8,581,620],
  [812.2,734,981],
  [813.5,669,1320],
  [814.8,979,1554],
  [816.27,1186,1681],
];
function heroAt(t){
  for(let i=1;i<reportPath.length;i++){
    const a=reportPath[i-1],b=reportPath[i];
    if(t<=b[0]){
      const f=Math.max(0,Math.min(1,(t-a[0])/(b[0]-a[0])));
      return {x:a[1]+f*(b[1]-a[1]),y:a[2]+f*(b[2]-a[2])};
    }
  }
  const p=reportPath.at(-1);
  return {x:p[1],y:p[2]};
}
function measure(label,options={}){
  // Current native test registry excludes Rogue; Paladin with party removed
  // isolates class-neutral enemy navigation without changing class registration.
  const g=new Campaign('normal','paladin',()=>.73);
  g.xp(120);
  assert.equal(g.hero.level,2,'same level as the owner report');
  const z=g.zone(),thorn=z.enemies.find(e=>e.family==='thorn'&&e.hp>0);
  assert(thorn,'native level-two Vale contains Thornfang');
  g.s.party=[];
  g.s.mercyTime=0;
  g.s.time=809.45;
  g.s.clock=209;
  z.clock=209;
  if(options.fromLeg!==undefined){
    const p=waypoints[options.fromLeg];
    Object.assign(thorn,g.safe(p[0],p[1]));
    thorn.thornLeg=options.toLeg;
    thorn.thornPause=0;
    delete thorn.path;
    thorn.routeAge=0;
  }
  if(options.noThorn)z.enemies=z.enemies.filter(e=>e!==thorn);
  const originalRoute=g.route,originalBlocked=g.blocked,originalFollow=g.follow;
  let checks=0,atTick=0;
  const routeCalls=[],longTick=[],followCalls=[];
  g.blocked=function(...args){checks++;return originalBlocked.apply(this,args);};
  g.route=function(...args){
    const before=checks,started=performance.now(),source=args[0]||{},goal=args[1]||{};
    const stack=(new Error()).stack?.split('\n').slice(2,6).map(s=>s.trim())||[];
    try{
      const path=originalRoute.apply(this,args);
      routeCalls.push({
        tick:atTick,time:+g.s.time.toFixed(2),sourceId:source.id||null,
        sourceFamily:source.family||null,sourceType:source.type||null,
        aggro:!!source.aggro,returning:!!source.returning,
        from:[Math.round(source.x||0),Math.round(source.y||0)],
        to:[Math.round(goal.x||0),Math.round(goal.y||0)],
        probes:checks-before,ms:+(performance.now()-started).toFixed(2),
        waypoints:path.length,stack
      });
      return path;
    }catch(err){routeCalls.push({time:g.s.time,error:err.message,stack});throw err;}
  };
  g.follow=function(...args){
    const actor=args[0];
    if(actor===thorn)followCalls.push({tick:atTick,time:+g.s.time.toFixed(2),
      from:[Math.round(actor.x),Math.round(actor.y)],to:[Math.round(args[1].x),Math.round(args[1].y)],
      aggro:!!actor.aggro,returning:!!actor.returning});
    return originalFollow.apply(this,args);
  };
  const perTick=[];
  for(let i=0;i<140;i++){
    atTick=i;
    Object.assign(g.hero,heroAt(g.s.time));
    const before=checks,started=performance.now();
    g.tick(.05,{x:0,y:0});
    const probes=checks-before;
    const ms=performance.now()-started;
    perTick.push({tick:i,time:+g.s.time.toFixed(2),probes,ms:+ms.toFixed(2)});
    if(probes>=800)longTick.push({tick:i,time:+g.s.time.toFixed(2),probes,ms:+ms.toFixed(2)});
  }
  delete g.follow;delete g.route;delete g.blocked;
  const sorted=perTick.slice().sort((a,b)=>b.probes-a.probes).slice(0,12);
  const heavy=routeCalls.filter(x=>x.probes>=800);
  const result={label,version:'dev.238 source',heroClass:'paladin/no-party engine proxy (Rogue unavailable to direct test entrypoint)',level:g.hero.level,
    roster:z.enemies.length,thornPresent:!options.noThorn,
    thornStart:options.fromLeg===undefined?'native':options.fromLeg,
    targetLeg:options.toLeg??null,
    totalBlocked:checks,peakTickProbes:sorted[0]?.probes||0,
    routeCount:routeCalls.length,routeProbes:routeCalls.reduce((s,r)=>s+(r.probes||0),0),
    heavyRoutes:heavy.slice(0,20),highProbeTicks:longTick.slice(0,22),
    worstTicks:sorted,thornFollowCalls:followCalls.length,
    thornFinal:{x:+thorn.x.toFixed(1),y:+thorn.y.toFixed(1),leg:thorn.thornLeg,retreat:thorn.thornIntroRetreat??null}};
  console.log('VALE_IDLE_PERIODIC_ROUTE_TRACE '+JSON.stringify(result));
  return result;
}
const baseline=measure('native-thorn');
const control=measure('no-thorn-control',{noThorn:true});
const patrolA=measure('thorn-patrol-0-to-4',{fromLeg:0,toLeg:4});
const patrolB=measure('thorn-patrol-4-to-0',{fromLeg:4,toLeg:0});
assert(baseline.roster>0&&control.roster>0);
assert.equal(baseline.roster-control.roster,1);
assert(patrolA.peakTickProbes<2000 && patrolB.peakTickProbes<2000,
  'Thorn and Mira must not repeat multi-thousand-probe synchronous route scans');
assert(!patrolA.heavyRoutes.some(r=>r.sourceFamily==='thorn') &&
  !patrolB.heavyRoutes.some(r=>r.sourceFamily==='thorn'),
  'Idle scripted Vale pathfinding must use bounded planning');
console.log('VALE_IDLE_ROUTE_COMPARISON '+JSON.stringify({
  native:baseline.peakTickProbes,control:control.peakTickProbes,
  patrolA:patrolA.peakTickProbes,patrolB:patrolB.peakTickProbes,
  nativeRouteCalls:baseline.routeCount,controlRouteCalls:control.routeCount,
  periodicSignature:'Measured native route probes; causal inference requires matching actor and call stack.'
}));
console.log('PASS Vale dev.238 report reconstruction and route-call attribution (diagnostic only).');
