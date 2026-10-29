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
  assert.deepEqual(optimized.state,original.state,
    'full native Thorn combat ticks must preserve gameplay after route priority optimization');
  assert(optimized.peak<=original.peak,'Thorn real combat peak terrain checks cannot worsen');
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
