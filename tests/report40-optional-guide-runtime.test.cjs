'use strict';
// Report #40: production-shell completion/cancellation for the optional
// visual map guide. Exact old-BFS route geometry is deliberately NOT required.
const assert = require('node:assert/strict');
const { shell } = require('./helpers/production-shell.cjs');
const { scope, elements, frame } = shell('en');
const game = scope.Prototype.game;
game.tick = () => {}; // Keep real UI frame updates; freeze only engine movement.
game.hero.level = 2;
const witness = game.zone().npcs.find(n => n.thornReport);
Object.assign(game.hero, { x: witness.x, y: witness.y });
elements.get('touch-interact-button').click();
const lead = game.thornWitnessLead();
const chosen = game.navigationTarget(lead);
assert(chosen?.path?.length, 'native authored informant waypoint is reachable');
const action = elements.get('modal-actions').children.find(button =>
  button.textContent.startsWith('Follow this lead'));
assert(action, 'the real production menu offers the waypoint action');
action.click();
assert.equal(scope.Prototype.trackedWaypoint?.kind, 'navigation');
const destination = { ...chosen.point };
const firstGuide = scope.Prototype.trackedWaypoint.points;
game.hero.order = null;
game.hero.path = [];
frame(0); // detect manual takeover
const origin = { x: game.hero.x, y: game.hero.y };
let validPath;
for (const [dx,dy] of [[120,0],[0,120],[-120,0],[0,-120],[90,90]]) {
  const candidate = { x: origin.x+dx, y: origin.y+dy };
  if (game.blocked(candidate.x,candidate.y)) continue;
  const route = game.route(candidate,destination);
  if (route?.length && game.clearSegment(candidate,route[0])) {
    Object.assign(game.hero,candidate);
    validPath = route;
    break;
  }
}
assert(validPath?.length, 'test uses an actual reachable Greenwood manual detour');
let generated = 0, yielded = 0, attached = 0;
const nativeSegment = game.budgetedRouteSegment;
game.budgetedRouteSegment = function* (...args) {
  attached++;
  return yield* nativeSegment.apply(this,args);
};
game.budgetedCompanionRoute = function* () {
  generated++;
  for (let i=0;i<110;i++) { yielded++; yield { kind:'node' }; }
  return validPath;
};
game.s.time += 3;
const beforeQuest = JSON.stringify(game.snapshot());
frame(100);
assert.equal(generated,1,'one optional plan starts after meaningful displacement');
assert(yielded <= 40, 'bounded update does not consume all 110 planner nodes at once');
assert.deepEqual(scope.Prototype.trackedWaypoint.points, firstGuide,
  'old visual guide remains visible until a safe replacement completes');
const beforeCombat = yielded;
const actualCombat = game.manaCombatActive;
game.manaCombatActive = () => true;
frame(200);
assert.equal(yielded,beforeCombat,'combat prevents optional guide planner work');
game.manaCombatActive = actualCombat;
for (let t=300;t<2400 && attached===0;t+=100) frame(t);
assert(attached>0,'completed plan reconnects to the real hero with bounded segment tests');
for (let t=2400;t<4100;t+=100) frame(t);
let updated = scope.Prototype.trackedWaypoint?.points;
assert(updated?.length,'completed route remains visible');
assert(Math.hypot(updated.at(-1).x-destination.x,updated.at(-1).y-destination.y)<1,
  'visual route still leads to the selected destination');
let from=game.hero;
for (const waypoint of updated) {
  assert(game.clearSegment(from,waypoint),
    'every displayed updated leg is actually walkable from the current hero');
  from=waypoint;
}
assert.equal(game.hero.order,null,'visual reroute never commandeers manual hero movement');
assert.equal(generated,1,'stationary hero does not repeatedly plan on a timer');
assert.equal(JSON.stringify(game.snapshot()),beforeQuest,
  'optional guide planning does not mutate saved campaign state');

// A reachable fallback is not rejected merely for differing from A* geometry.
// Walk the real legal route while the fallback generator is still unfinished:
// the displayed result must connect from the hero's NEW position.
const walkAlong=(start,path,distance)=>{
  let from={x:start.x,y:start.y};
  for (const point of path) {
    const span=Math.hypot(point.x-from.x,point.y-from.y);
    if (span>=distance && span>0)
      return {x:from.x+(point.x-from.x)*distance/span,
        y:from.y+(point.y-from.y)*distance/span};
    distance-=span;
    from=point;
  }
  return from;
};
const pathBeforeFallback=game.route(game.hero,destination);
assert(pathBeforeFallback.length,'existing route remains reachable');
Object.assign(game.hero,walkAlong(game.hero,pathBeforeFallback,90));
assert(!game.blocked(game.hero.x,game.hero.y),'moving hero remains on legal terrain');
const fallbackPath=game.route(game.hero,destination);
assert(fallbackPath.length,'safe fallback path exists from new origin');
let fallbackCalls=0;
game.budgetedCompanionRoute=function*(){ generated++; return []; };
game.budgetedTacticalRoute=function*(){
  fallbackCalls++;
  for(let i=0;i<145;i++) yield {kind:'node'};
  return fallbackPath;
};
game.s.time += 3;
frame(4200);
assert.equal(fallbackCalls,1,'A* failure starts incremental BFS fallback');
Object.assign(game.hero,walkAlong(game.hero,fallbackPath,90));
assert(!game.blocked(game.hero.x,game.hero.y),
  'player continues moving safely while the search is pending');
for(let t=4300;t<5700;t+=100) frame(t);
assert.equal(fallbackCalls,1,'the pending BFS generator is resumed instead of restarted');
const fallbackVisible=scope.Prototype.trackedWaypoint?.points;
assert(fallbackVisible?.length,'fallback leaves usable map guidance');
assert(Math.hypot(fallbackVisible.at(-1).x-destination.x,
  fallbackVisible.at(-1).y-destination.y)<1,'fallback still ends at the selected landmark');
let safeFrom=game.hero;
for(const point of fallbackVisible){
  assert(game.clearSegment(safeFrom,point),
    'fallback connects to current moving hero without an obsolete first leg');
  safeFrom=point;
}

// Clearing a pending route means no later cancelled work may be published.
let cancelledRequests=0;
game.budgetedCompanionRoute=function*(){
  for(let i=0;i<300;i++){ cancelledRequests++; yield {kind:'node'}; }
  return fallbackPath;
};
Object.assign(game.hero,walkAlong(game.hero,fallbackVisible,95));
game.s.time += 3;
frame(5800);
assert(cancelledRequests>0,'a fresh optional plan is in flight before cancellation');
scope.Prototype.cancelNavigation();
const afterCancel=cancelledRequests;
frame(5900);
frame(6000);
assert.equal(cancelledRequests,afterCancel,'clearing the waypoint discards in-flight work');
assert.equal(scope.Prototype.trackedWaypoint,null,'cleared route never reappears');
assert.equal(game.hero.order,null,'cancellation preserves manual control');
console.log('PASS Report40 optional guide: bounded progress, combat deferral, live reattachment, fallback, clear and save purity');
