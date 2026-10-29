'use strict';
// Source-exact original-vs-optimized opening Thorn retreat, never mocked
// collision or pathfinding. Same hero/party geometry and deterministic RNG.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine');
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function fixture({hero,wall}){
  const g=new Campaign('developer','paladin',()=>.73),z=g.zone();
  for(const key of ['props','nodes','npcs','buildings','enemies'])z[key]=[];
  g.s.mercyTime=0;g.s.valeFieldAwakened=true;
  g.s.thornHeroInitiated=false;
  Object.assign(g.hero,{x:hero[0],y:hero[1],hp:100000,maxHp:100000});
  g.s.party=[];
  for(let i=0;i<3;i++){
    const type=i%2?'archer':'soldier',u=g.unit(type,1190+(i%3)*20,1345);
    u.hp=10000;u.maxHp=10000;g.s.party.push(u);
  }
  if(wall)for(let y=1310;y<=1550;y+=40)
    z.props.push({id:'thorn-retreat-wall-'+y,x:1315,y,r:25});
  const thorn=g.bossEnemy(g.boss('thorn'),'normal',{x:1390,y:1340});
  z.enemies=[thorn];
  thorn.aggro=true;
  return {g,thorn};
}
// This body is the full old selection and commit from the dev.224 method;
// pin it independently so any future priority or eligibility change fails.
function originalOpeningCompanionHit(e){
  if (!this.awaitsHeroAttack(e)) return false;
  const thorn = this.openingThornOwner(e);
  if (thorn) {
    if (thorn.thornIntroRetreat !== undefined) return true;
    const party = [this.hero, ...this.activeLivingParty()],
      route = Campaign.rules.thornPatrol.route,
      choices = route
        .map(([x, y], leg) => ({
          x, y, leg,
          distance: Math.min(...party.map((u) => dist(u, { x, y }))),
        }))
        .filter((p) =>
          p.distance >= Campaign.rules.fieldOnboarding.withdrawClearance &&
          !this.blocked(p.x, p.y) &&
          this.route(thorn, p).length)
        .sort((a, b) => b.distance - a.distance || a.leg - b.leg);
    const goal = choices[0];
    if (goal) {
      this.cancelEncounter(thorn);
      thorn.aggro = false;
      thorn.returning = 0;
      delete thorn.thornReturn;
      delete thorn.path;
      thorn.routeAge = 0;
      thorn.thornIntroRetreat = goal.leg;
      this.releasePatrolResume(thorn);
    }
  } else if (!e.returning) this.disengage(e, 0);
  return true;
}
function sample(opts,original=false,unreachable=false){
  const {g,thorn}=fixture(opts);
  if(original)g.openingCompanionHit=originalOpeningCompanionHit;
  const nativeRoute=g.route,nativeBlocked=g.blocked;
  let checks=0,calls=0,peakRoute=0;
  g.blocked=function(...args){checks++;return nativeBlocked.apply(this,args)};
  g.route=function(...args){
    const prior=checks;calls++;
    const result=unreachable?[]:nativeRoute.apply(this,args);
    peakRoute=Math.max(peakRoute,checks-prior);
    return result;
  };
  assert(g.awaitsHeroAttack(thorn),'hero-first Thorn opening must apply');
  assert.equal(g.openingCompanionHit(thorn),true);
  delete g.blocked;delete g.route;
  if(original)delete g.openingCompanionHit;
  const state=g.snapshot();
  return {state,leg:thorn.thornIntroRetreat??null,calls,checks,peakRoute,
    aggro:thorn.aggro,returning:thorn.returning};
}
for(const opts of [
  {hero:[1230,1400],wall:true},
  {hero:[1450,1300],wall:true},
  {hero:[950,1600],wall:true},
  {hero:[1650,1600],wall:false},
]){
  const legacy=sample(opts,true),candidate=sample(opts,false);
  assert.deepEqual(candidate.state,legacy.state,'Thorn retreat saved campaign and event parity');
  assert.equal(candidate.leg,legacy.leg,'Thorn retreat must choose same safe patrol leg');
  assert(candidate.calls<=legacy.calls,'no additional synchronous route calls');
  assert(candidate.checks<=legacy.checks,'terrain probes must not increase');
  console.log('THORN_RETREAT_PRIORITY_PARITY '+JSON.stringify({opts,
    legacy:{leg:legacy.leg,calls:legacy.calls,checks:legacy.checks,peakRoute:legacy.peakRoute},
    candidate:{leg:candidate.leg,calls:candidate.calls,checks:candidate.checks,
      peakRoute:candidate.peakRoute}}));
}

// Also compare actual engine combat updates, not only direct method calls.
// This catches a priority-preserving algorithm that accidentally changes
// when Thorn disengages, attacks or completes his original retreat.
function liveCombat(opts,legacy) {
  const {g,thorn}=fixture(opts);
  if(legacy)g.openingCompanionHit=originalOpeningCompanionHit;
  let checks=0,peak=0,routeCalls=0;
  const oldBlocked=g.blocked,oldRoute=g.route;
  g.blocked=function(...args){checks++;return oldBlocked.apply(this,args)};
  g.route=function(...args){routeCalls++;return oldRoute.apply(this,args)};
  for(let i=0;i<24;i++){
    const before=checks;
    g.tick(.05,{x:0,y:0});
    peak=Math.max(peak,checks-before);
  }
  delete g.route;delete g.blocked;
  if(legacy)delete g.openingCompanionHit;
  return {state:g.snapshot(),leg:thorn.thornIntroRetreat??null,peak,checks,routeCalls};
}
for(const opts of [
  {hero:[1230,1400],wall:true},
  {hero:[1650,1600],wall:false},
]) {
  const original=liveCombat(opts,true),optimized=liveCombat(opts,false);
  // Selection and immediate cancellation are snapshot-identical above.
  // The deliberate bounded planner moves later than a full synchronous path
  // search; requiring frame-for-frame positions here would demand the stall.
  // Instead preserve its chosen leg and enforce the native work budget.
  assert.equal(optimized.leg,original.leg,
    'bounded retreat must choose the same authored patrol destination');
  assert(optimized.peak<=original.peak,
    'Thorn real combat peak terrain probes must improve or remain equal');
  console.log('THORN_RETREAT_LIVE_TICK_PARITY '+JSON.stringify({opts,
    original:{leg:original.leg,peak:original.peak,checks:original.checks,calls:original.routeCalls},
    optimized:{leg:optimized.leg,peak:optimized.peak,checks:optimized.checks,calls:optimized.routeCalls}}));
}

const unreachable={hero:[1230,1400],wall:true};
const oldFail=sample(unreachable,true,true),newFail=sample(unreachable,false,true);
assert.deepEqual(newFail.state,oldFail.state,
  'no reachable route must not manufacture a retreat or dismiss the boss');
assert.equal(newFail.leg,null);
console.log('PASS Thorn opening retreat priority, no-route behavior, native route cost and exact save parity');

// The same native route graph must return identical existence answers for
// every authored patrol goal, even when heuristic exploration order differs.
for(const opts of [
  {hero:[1230,1400],wall:true},
  {hero:[1450,1300],wall:true},
  {hero:[1650,1600],wall:false},
]){
  const {g,thorn}=fixture(opts);
  for(const [x,y] of Campaign.rules.thornPatrol.route){
    const p={x,y};
    assert.equal(g.route(thorn,p,{reachabilityOnly:true}).length>0,
      g.route(thorn,p).length>0,'native route existence must match at every patrol leg');
  }
}
console.log('PASS all Thorn patrol reachability flags preserve native route existence');

// Preserve the exact completed route when the 50-unit grid search is
// performed over multiple updates. A pending route may not mutate boss save
// fields, skip walls or inherit budgets from ordinary enemy pursuers.
for(const opts of [
  {hero:[1230,1400],wall:true},
  {hero:[1650,1600],wall:false},
]){
  const {g,thorn}=fixture(opts);
  const target={x:Campaign.rules.thornPatrol.route[opts.wall?5:1][0],
    y:Campaign.rules.thornPatrol.route[opts.wall?5:1][1]};
  const full=g.route(thorn,target);
  let pending=null,result=null,peak=0;
  const blocked=g.blocked;let probes=0;
  g.blocked=function(...args){probes++;return blocked.apply(this,args)};
  for(let tick=0;tick<200;tick++){
    g.s.time+=.05;
    const before=probes;
    const current=g.advanceBudgetedRoute(pending?.origin||thorn,
      pending?.target||target,'thorn-retreat',pending);
    peak=Math.max(peak,probes-before);
    if(!current.pending){result=current.path;break}
    pending=current.state;
  }
  delete g.blocked;
  assert(result!==null,'budgeted Thorn route must finish in finite ticks');
  assert.deepEqual(result,full,'same original path and waypoints after incremental search');
  assert(peak<=850,'single native Thorn planning tick must stay within terrain budget');
  console.log('THORN_BUDGETED_ROUTE_PARITY '+JSON.stringify({
    wall:opts.wall,peak,waypoints:result.length,probes}));
}

// The exact intro-retreat decision is unchanged, but executing a costly
// patrol path may now take additional ticks. Assert eventual arrival and
// absence of a stuck retreat, rather than silently declaring frame parity.
for(const opts of [
  {hero:[1230,1400],wall:true},
  {hero:[1650,1600],wall:false},
]){
  const {g,thorn}=fixture(opts);
  assert.equal(g.openingCompanionHit(thorn),true);
  const chosen=thorn.thornIntroRetreat;
  assert(Number.isInteger(chosen),'native companion opening selects a patrol leg');
  const [x,y]=Campaign.rules.thornPatrol.route[chosen];
  let arrived=false,peak=0,probes=0,plannerProbes=0,
    plannerCalls=0,plannerCompletions=0,plannerPending=0;
  const planHistory=[];
  const old=g.blocked,originalAdvance=g.advanceBudgetedRoute;
  g.blocked=function(...args){probes++;return old.apply(this,args)};
  g.advanceBudgetedRoute=function(...args){
    const before=probes,result=originalAdvance.apply(this,args);
    if(args[2]==='thorn-retreat'){
      plannerProbes+=probes-before;
      plannerCalls++;
      if(!args[3])planHistory.push({
        startedAt:+g.s.time.toFixed(2),
        x:+thorn.x.toFixed(2),y:+thorn.y.toFixed(2),
        distance:+Math.hypot(thorn.x-x,thorn.y-y).toFixed(2),
        currentPathLength:thorn.path?.length||0,routeAge:thorn.routeAge,
      });
      if(result.pending)plannerPending++;
      else {
        plannerCompletions++;
        const last=planHistory.at(-1);
        if(last)last.completedAt=+g.s.time.toFixed(2);
        if(last)last.waypoints=result.path.length;
      }
    }
    return result;
  };
  for(let tick=0;tick<500;tick++){
    const before=probes;
    g.tick(.05,{x:0,y:0});
    peak=Math.max(peak,probes-before);
    if(thorn.thornIntroRetreat===undefined){
      arrived=true;break;
    }
  }
  delete g.blocked;
  delete g.advanceBudgetedRoute;
  console.log('THORN_BUDGETED_RETREAT_WORKLOAD '+JSON.stringify({
    wall:opts.wall,peak,probes,plannerCalls,plannerPending,
    plannerCompletions,plannerProbes,arrived
  }));
  assert(arrived,'Thorn retreat must eventually finish without teleport');
  console.log('THORN_RETREAT_ROUTE_REPLAN_TRACE '+JSON.stringify({
    wall:opts.wall,history:planHistory
  }));
  assert(plannerCompletions<=2,'retreat must not repeatedly rebuild completed routes');
  if(!opts.wall) assert(plannerProbes<=45000,
    'actual Thorn route planner cannot repeatedly rescan an intact full route');
  assert(Math.hypot(thorn.x-x,thorn.y-y)<=Campaign.rules.thornPatrol.arrival+1e-7,
    'Thorn must reach the selected real patrol destination');
  assert.equal(thorn.hp,thorn.maxHp,'complete retreat restores original boss HP');
  assert(!thorn.aggro,'completed introductory retreat remains passive');
  console.log('THORN_BUDGETED_RETREAT_LIVENESS '+JSON.stringify({
    wall:opts.wall,selectedLeg:chosen,peak,probes,
    arrivalDistance:+Math.hypot(thorn.x-x,thorn.y-y).toFixed(2)
  }));
}

// A hero's actual opening hit must immediately retire passive retreat intent,
// even when the boss's next movement has a clear direct approach.
{
  const {g,thorn}=fixture({hero:[1650,1600],wall:false});
  assert.equal(g.openingCompanionHit(thorn),true);
  for(let i=0;i<4;i++)g.tick(.05,{x:0,y:0});
  assert(Number.isInteger(thorn.thornIntroRetreat),
    'fixture must have an active passive introductory retreat');
  g.admitOpeningHeroAttack(thorn);
  assert.equal(g.s.thornHeroInitiated,true,'native hero-first rule must activate');
  assert.equal(thorn.thornIntroRetreat,undefined,'hero attack cancels passive retreat');
  const engaged=g.engage(thorn,true);
  assert.equal(engaged,true,'original boss engagement must be admitted');
  let retreatPlans=0;
  const native=g.advanceBudgetedRoute;
  g.advanceBudgetedRoute=function(...args){
    if(args[2]==='thorn-retreat')retreatPlans++;
    return native.apply(this,args);
  };
  g.follow(thorn,g.hero,145,.05,45);
  delete g.advanceBudgetedRoute;
  assert.equal(retreatPlans,0,'active boss may not consume passive retreat planning');
  assert.equal(thorn.thornIntroRetreat,undefined,
    'normal active combat cannot silently resume old retreat');
  console.log('PASS hero-first interruption cannot continue passive Thorn routing');
}
