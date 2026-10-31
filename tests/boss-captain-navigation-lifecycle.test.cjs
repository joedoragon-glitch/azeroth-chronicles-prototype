'use strict';
// #615 focused encounter acceptance: native TRUE boss, captain phases,
// unreachable/obstructed paths, reset, travel and v4 restoration.
// Real terrain/collision and Campaign.tick; only the explicit sealed-ring
// negative test adds synthetic walls. CPU probes are not hardware FPS.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const dt = .05;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const round=v=>+v.toFixed(2);
function scene(zone,selector) {
  const g=new Campaign('normal','paladin',()=>.73);
  if(zone!=='vale')assert(g.enter(zone));
  const z=g.zone(),e=z.enemies.find(selector);
  assert(e,'Missing authored actor in '+zone);
  z.enemies=[e];g.s.party=[];g.s.mercyTime=0;g.s.valeFieldAwakened=true;
  g.hero.hp=g.hero.maxHp=1000000;
  return {g,z,e};
}
function positionNear(g,e,d=95) {
  for(const r of [d,115,145,185])for(let n=0;n<24;n++) {
    const a=n*Math.PI/12,p={x:e.x+Math.cos(a)*r,y:e.y+Math.sin(a)*r};
    if(!g.blocked(p.x,p.y) && g.clearSegment(e,p) && g.line(e,p)){
      Object.assign(g.hero,p);return p;
    }
  }
  throw Error('No legal, native visible attack lane near '+e.name);
}
// Authored reachable obstruction, no synthetic walls: reuse the precise
// collision and route acceptance of the real Campaign. Reconstructed actor
// positions are labeled; the NPCs, walls, roads and solver remain untouched.
function reachableObstruction(g,e){
  const size=g.zoneSize(),origin={x:e.x,y:e.y};
  const valid=(a,b)=>{
    if(distance(a,b)<100||distance(a,b)>420||g.blocked(a.x,a.y)||
       g.blocked(b.x,b.y)||g.clearSegment(a,b))return null;
    const route=g.route(a,b);
    return route.length?{a,b,waypoints:route.length}:null;
  };
  for(const radius of [180,260,360])for(let n=0;n<24;n++){
    const t=n*Math.PI/12;
    const b={x:origin.x+Math.cos(t)*radius,y:origin.y+Math.sin(t)*radius};
    const v=valid(origin,b);if(v)return v;
  }
  let searched=0;
  for(let y=220;y<size-230;y+=140)for(let x=220;x<size-440;x+=140){
    for(const [dx,dy] of [[240,0],[0,240],[240,160],[-240,160]]){
      const a={x,y},b={x:x+dx,y:y+dy};
      if(g.blocked(a.x,a.y)||g.blocked(b.x,b.y)||g.clearSegment(a,b))continue;
      if(++searched>24)return null;
      const v=valid(a,b);if(v)return v;
    }
  }
  return null;
}
function observe(g,e,ticks) {
  let probes=0,peak=0,routeCalls=0,elitePlans=0,peakPlanner=0,actorFollowDepth=0;
  let warn=0,releases=0,maxFollowMotion=0,illegalLegs=0;
  const old={blocked:g.blocked,route:g.route,advance:g.advanceBudgetedRoute,
    follow:g.follow,startBoss:g.startAttack,startCaptain:g.startCaptainAttack,
    resolve:g.resolveAttack};
  g.blocked=function(...a){probes++;return old.blocked.apply(this,a)};
  g.route=function(a,b,...rest){if(a===e)routeCalls++;return old.route.call(this,a,b,...rest)};
  g.advanceBudgetedRoute=function(a,b,mode,...rest){
    const before=probes,result=old.advance.call(this,a,b,mode,...rest);
    if(actorFollowDepth>0&&(mode==='elite-pursuit'||mode==='captain-patrol')){
      elitePlans++;peakPlanner=Math.max(peakPlanner,probes-before);
    }
    return result;
  };
  g.startAttack=function(actor,...args){
    const outcome=old.startBoss.call(this,actor,...args);
    if(actor===e&&outcome)warn++;
    return outcome;
  };
  g.startCaptainAttack=function(actor,...args){
    const outcome=old.startCaptain.call(this,actor,...args);
    if(actor===e&&outcome)warn++;
    return outcome;
  };
  g.resolveAttack=function(actor,...args){
    if(actor===e)releases++;
    return old.resolve.call(this,actor,...args);
  };
  g.follow=function(actor,...args){
    const before={x:actor.x,y:actor.y},isSubject=actor===e;
    if(isSubject)actorFollowDepth++;
    let outcome;
    try{outcome=old.follow.call(this,actor,...args);}
    finally{if(isSubject)actorFollowDepth--;}
    if(isSubject && distance(before,actor)>0) {
      const moved=distance(before,actor);
      maxFollowMotion=Math.max(maxFollowMotion,moved);
      if(!g.clearSegment(before,actor))illegalLegs++;
    }
    return outcome;
  };
  const start={x:e.x,y:e.y},states=[];
  for(let i=0;i<ticks;i++){
    const before=probes;
    g.tick(dt,{x:0,y:0});
    peak=Math.max(peak,probes-before);
    states.push({aggro:!!e.aggro,returning:!!e.returning,
      telegraph:!!e.telegraph,motion:!!e.motion,phase:!!e.captainPhase});
  }
  for(const [name,fn] of Object.entries(old)) {
    const field={blocked:'blocked',route:'route',advance:'advanceBudgetedRoute',
      follow:'follow',startBoss:'startAttack',startCaptain:'startCaptainAttack',
      resolve:'resolveAttack'}[name];
    delete g[field];
    assert.equal(g[field],fn,'restore wrapper '+name);
  }
  const result={ticks,probes,peak,routeCalls,elitePlans,peakPlanner,warn,releases,
    moved:round(distance(start,e)),maxFollowMotion:round(maxFollowMotion),illegalLegs,
    phaseTicks:states.filter(s=>s.phase).length,
    warningTicks:states.filter(s=>s.telegraph).length,
    motionTicks:states.filter(s=>s.motion).length,
    ending:states.at(-1)};
  assert.equal(illegalLegs,0,'route-follow physical movement must remain collision legal');
  assert.equal(routeCalls,0,'native elite must not use synchronous route()');
  assert(peakPlanner<=512,'independent elite planning must obey per-search terrain budget');
  return result;
}
// Earn an actual TRUE field boss through first defeat, normal respawn,
// second defeat and delayed pending TRUE arrival. Spawn selection's unrelated
// reachability work is tracked in #605; this asserts combat after admission.
{
  const {g,z,e}=scene('highlands',u=>u.type==='boss'&&u.form==='normal'&&u.family==='ridge');
  if(g.hero.level<2)g.xp(120);
  const kill=()=>{e.hp=0;e.heroParticipated=true;g.kill(e)};
  kill();g.updateEnemies(121);
  assert(e.hp>0,'normal field boss must respawn between two genuine defeats');
  kill();assert.equal(g.s.pending.ridge.kind,'field');
  g.updateElites(5.1);
  const trueBoss=z.enemies.find(u=>u.family==='ridge'&&u.form==='true'&&u.hp>0);
  assert(trueBoss,'native delayed TRUE field-boss arrival');
  z.enemies=[trueBoss];positionNear(g,trueBoss,115);
  assert.notEqual(g.engage(trueBoss,true,false),false);
  assert(trueBoss.aggro,'TRUE boss really engaged');
  const first=observe(g,trueBoss,200);
  assert(first.warn>0&&first.releases>0,'TRUE boss must warn and resolve attacks');
  assert(first.warningTicks>0,'TRUE telegraph visible over real ticks');
  assert(trueBoss.trueEntourageSpawned,'TRUE boss must trigger its native entourage');
  const snap=g.snapshot(),restored=Campaign.restore(snap,()=>.73);
  const same=restored.zone().enemies.find(u=>u.id===trueBoss.id);
  assert(same&&same.form==='true','TRUE form persists in v4 restore');
  assert.equal(same.hp,trueBoss.hp,'TRUE HP persists across save/restore');
  restored.enter('vale');
  assert.equal(restored.zoneId,'vale','travel retires active navigation context');
  // The same genuine TRUE actor must navigate while obstructed, not merely
  // perform close-range attacks in an unobstructed combat lane.
  g.disengage(trueBoss,1.1);
  z.enemies=[trueBoss];
  const obstruction=reachableObstruction(g,trueBoss);
  assert(obstruction,'TRUE Ridge actor needs a reachable authored obstacle lane');
  Object.assign(trueBoss,obstruction.a);
  trueBoss.home={...obstruction.a};
  Object.assign(g.hero,obstruction.b,{hp:1000000,maxHp:1000000});
  assert(!g.clearSegment(trueBoss,g.hero),'TRUE pursuit should need terrain routing');
  assert.notEqual(g.engage(trueBoss,true,false),false);
  const pursuit=observe(g,trueBoss,120);
  assert(pursuit.elitePlans>0,'TRUE active boss must use the finite elite planner');
  assert.equal(pursuit.routeCalls,0,'TRUE active boss must not route synchronously');
  console.log('ISSUE615_TRUE_BOSS '+JSON.stringify({family:'ridge',form:trueBoss.form,
    nativePending:true,summoned:true,observed:first,obstructedPursuit:pursuit,
    v4Restored:true,travel:true}));
}
// Source-authored Treasury and Frontier captains. Cross the real phase
// thresholds, resolve a warned attack, reset phase and restart a new fight.
for(const [zone,match,expectedPhase] of [
  ['supply-highlands',e=>e.roomCaptain&&e.captainProfile==='supply-highlands','howl'],
  ['frontier',e=>e.fieldCaptain&&e.captainProfile==='frontier-overseer','overtime']
]) {
  const {g,e}=scene(zone,match);
  const profile=Campaign.rules.roomCaptains[e.captainProfile];
  assert.equal(profile.phase.kind,expectedPhase,'authoritative captain phase contract');
  positionNear(g,e,85);
  e.hp=e.maxHp*(profile.phase.threshold-.06);
  assert.notEqual(g.engage(e,true,false),false);
  const first=observe(g,e,180);
  assert(first.phaseTicks>0,'native captain phase must activate in combat');
  assert(first.warn>0&&first.releases>0,'captain must warn and resolve attacks');
  assert(e.captainPhase,'native captain phase remains one-shot until reset');
  assert(!g.triggerCaptainPhase(e),'same encounter cannot retrigger phase');
  assert(first.warningTicks>0,'captain warning persisted through native ticks');
  g.disengage(e,1.1);
  assert(!e.aggro&&!e.returning&&!e.captainPhase,'reset retires combat and one-shot phase');
  assert(!e.telegraph&&!e.motion,'reset retires committed telegraph/motion');
  assert.equal(e.captainPhaseMove,1);
  assert.equal(e.captainAttackRate,1);
  const saved=g.snapshot(),again=Campaign.restore(saved,()=>.73);
  const restored=again.zone().enemies.find(u=>u.id===e.id);
  assert(restored&&!restored.aggro&&!restored.captainPhase,'v4 restored clean captain reset');
  positionNear(again,restored,85);
  restored.hp=restored.maxHp*(profile.phase.threshold-.06);
  assert.notEqual(again.engage(restored,true,false),false);
  assert(again.triggerCaptainPhase(restored),'fresh restored encounter may phase once');
  const obstacle=reachableObstruction(again,restored);
  assert(obstacle,zone+' phased captain needs a reachable authored obstacle lane');
  Object.assign(restored,obstacle.a);
  restored.home={...obstacle.a};
  Object.assign(again.hero,obstacle.b,{hp:1000000,maxHp:1000000});
  assert(!again.clearSegment(restored,again.hero),'phase pursuit must be obstructed');
  const phasePursuit=observe(again,restored,120);
  assert(phasePursuit.elitePlans>0,zone+' phased captain must use bounded routing');
  assert.equal(phasePursuit.routeCalls,0,'no synchronous phase-specific captain route');
  console.log('ISSUE615_CAPTAIN_PHASE '+JSON.stringify({zone,phase:expectedPhase,
    measured:first,obstructedPursuit:phasePursuit,reset:true,v4Restored:true,reengagement:true}));
}
// Synthetic sealed ring is an explicit negative geometry, not a claimed
// authored obstacle. It forces a genuinely unreachable hero using native
// blocked, route, LOS and movement to expose cancellation/no-route handling.
{
  const {g,z,e}=scene('frontier',u=>u.fieldCaptain);
  const center=g.safe(1200,950);
  Object.assign(e,center);e.home={...center};
  let outer=null;
  for(const radius of [270,330,390,450]) {
    for(let n=0;n<24;n++) {
      const angle=n*Math.PI/12;
      const point={x:center.x+radius*Math.cos(angle),y:center.y+radius*Math.sin(angle)};
      if(!g.blocked(point.x,point.y)){outer=point;break;}
    }
    if(outer)break;
  }
  assert(outer,'source-authored Frontier needs a walkable point outside sealed ring');
  Object.assign(g.hero,outer);
  for(let i=0;i<32;i++){
    const a=i*Math.PI/16;
    z.props.push({id:'issue615-sealed-wall-'+i,x:center.x+90*Math.cos(a),
      y:center.y+90*Math.sin(a),r:38});
  }
  assert(!g.blocked(e.x,e.y),'native collision keeps isolated actor walkable');
  assert(!g.blocked(g.hero.x,g.hero.y),'native collision keeps target walkable');
  assert(!g.clearSegment(e,g.hero),'sealed ring blocks direct line');
  assert.equal(g.route(e,g.hero).length,0,'native route rejects sealed enclosure');
  assert.notEqual(g.engage(e,true,false),false);
  const route=observe(g,e,300); // 15s: includes 12s native no-progress reset
  assert(route.elitePlans>0,'sealed-ring pursuit invokes bounded elite search');
  assert(route.peak<4500,'no full-frame 10k+ route despite impossible destination');
  assert(!e.aggro,'impossible 15-second pursuit must eventually disengage');
  assert(route.maxFollowMotion<12,'no wall crossing or teleport by route-follow');
  assert(g.clearSegment(center,e),'no-route must not move captain through enclosing wall');
  const raw=g.snapshot(),copy=Campaign.restore(raw,()=>.73);
  assert(copy.zone().enemies.some(u=>u.id===e.id),'v4 preserves unreachable actor');
  console.log('ISSUE615_NO_ROUTE '+JSON.stringify({nativeNoRoute:true,actor:e.name,measured:route,
    disengaged:!e.aggro,saved:true}));
}
console.log('PASS issue #615 TRUE boss, captain phases, sealed no-route and reset/v4/travel focus.');
