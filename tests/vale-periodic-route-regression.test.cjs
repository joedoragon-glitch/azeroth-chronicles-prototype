'use strict';
// PR #689: native terrain waypoint parity, liveness, bounded scripted work.
// Real Campaign simulation, not hardware FPS.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine');
const legs=Campaign.rules.thornPatrol.route;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function fixture(){
  // The native direct constructor rejects Rogue; this no-party Paladin
  // isolates class-independent enemy navigation without altering registration.
  const g=new Campaign('normal','paladin',()=>.73);
  g.xp(120);assert.equal(g.hero.level,2);
  g.s.party=[];g.s.mercyTime=0;g.s.time=50;
  const thorn=g.zone().enemies.find(e=>e.family==='thorn'&&e.hp>0);
  const mira=g.thornCaptive();
  assert(thorn&&mira);
  return {g,thorn,mira};
}
function compare(g,actor,target,mode){
  const original=g.route(actor,target),blocked=g.blocked;
  let probes=0,peak=0,pending=null,result=null,steps=0;
  g.blocked=function(...args){probes++;return blocked.apply(this,args);};
  for(;steps<180;steps++){
    g.s.time+=.05;const before=probes;
    const r=g.advanceBudgetedRoute(pending?.origin||actor,
      pending?.target||target,mode,pending);
    peak=Math.max(peak,probes-before);
    if(!r.pending){result=r.path;break}
    pending=r.state;
  }
  delete g.blocked;
  assert(result!==null,mode+' finishes within 180 updates');
  assert.deepEqual(result,original,mode+' preserves original native waypoints');
  assert(peak<=512,mode+' per-update budget');
  assert(result.length>0,mode+' has reachable destination');
  console.log('VALE_BOUNDED_ROUTE_PARITY '+JSON.stringify({
    mode,steps,waypoints:result.length,peakProbes:peak,totalProbes:probes}));
}
for(const [mode,fromLeg,toLeg,person] of [
  ['thorn-patrol',0,4,'thorn'],['thorn-escort',4,0,'mira']
]){
  const {g,thorn,mira}=fixture(),actor=person==='thorn'?thorn:mira;
  Object.assign(actor,g.safe(...legs[fromLeg]));
  compare(g,actor,g.safe(...legs[toLeg]),mode);
}
// Real native world ticks must remain affordable and actors may not teleport
// or starve while searches are pending.
for(const [name,fromLeg,toLeg] of [
  ['thorn-patrol',0,4],['thorn-escort',4,0]
]){
  const {g,thorn,mira}=fixture();
  Object.assign(thorn,g.safe(...legs[fromLeg]));
  thorn.thornLeg=toLeg;thorn.thornPause=0;thorn.routeAge=0;
  delete thorn.path;
  if(name==='thorn-escort')Object.assign(mira,g.safe(...legs[4]));
  const actor=name==='thorn-patrol'?thorn:mira,
    start={x:actor.x,y:actor.y},original=g.blocked;
  let probes=0,peak=0,maxMotion=0;
  g.blocked=function(...args){probes++;return original.apply(this,args);};
  for(let i=0;i<220;i++){
    const last=probes,old={x:actor.x,y:actor.y};
    g.tick(.05,{x:0,y:0});
    peak=Math.max(peak,probes-last);
    maxMotion=Math.max(maxMotion,distance(actor,old));
    assert(!thorn.aggro,'authored passive patrol must remain passive');
  }
  delete g.blocked;
  const moved=distance(actor,start);
  assert(moved>40,name+' advances after preparation rather than starving');
  const speed=name==='thorn-patrol'?Campaign.rules.thornPatrol.speed:
    Campaign.rules.thornPatrol.captiveSpeed;
  assert(maxMotion<=speed*.05+.5,name+' physical movement never teleports');
  assert(peak<2000,name+' no 10k+ sync route in a full game update');
  console.log('VALE_SCRIPTED_MOVEMENT '+JSON.stringify({
    name,moved:+moved.toFixed(1),maxMotion:+maxMotion.toFixed(2),
    peakWholeTickProbes:peak,totalProbes:probes}));
}
console.log('PASS native Vale route parity, bounded work and scripted movement.');
