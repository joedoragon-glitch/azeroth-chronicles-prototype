'use strict';
// Issue #615: READ-ONLY source attribution and Cindermaw native route traces.
// This file must not mutate production source or alter the published game.
// Distinguish authored actors/terrain from test-reconstructed positions.
// Node CPU timing and blocked-probe totals are NOT device FPS.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine');
const dt=.05,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const xy=p=>[Math.round(p.x),Math.round(p.y)];
const median=xs=>xs.slice().sort((a,b)=>a-b)[Math.floor(xs.length/2)]||0;
const num=n=>Math.round(n*100)/100;
function walkableNear(g,e,d=85){
  for(const radius of [d,115,145,185])for(let n=0;n<24;n++){
    const a=n*Math.PI/12,p={x:e.x+Math.cos(a)*radius,y:e.y+Math.sin(a)*radius};
    if(!g.blocked(p.x,p.y)&&g.clearSegment(e,p)&&g.line(e,p))return p;
  }
  throw Error('No native attack lane');
}
function obstacle(g,e){
  const origin={x:e.x,y:e.y},size=g.zoneSize();
  const choose=(a,b)=>{
    if(dist(a,b)<100||dist(a,b)>420||g.blocked(a.x,a.y)||g.blocked(b.x,b.y)||g.clearSegment(a,b))return null;
    const route=g.route(a,b);
    return route.length?{a,b,waypoints:route.length}:null;
  };
  for(const radius of [180,260,360])for(let n=0;n<24;n++){
    const a=n*Math.PI/12,p={x:origin.x+Math.cos(a)*radius,y:origin.y+Math.sin(a)*radius};
    const o=choose(origin,p);if(o)return o;
  }
  let count=0;
  for(let y=220;y<size-230;y+=140)for(let x=220;x<size-440;x+=140)
    for(const [dx,dy] of [[240,0],[0,240],[240,160],[-240,160]]){
      const a={x,y},b={x:x+dx,y:y+dy};
      if(g.blocked(a.x,a.y)||g.blocked(b.x,b.y)||g.clearSegment(a,b))continue;
      if(++count>24)return null;
      const o=choose(a,b);if(o)return o;
    }
  return null;
}
function highlands(){
  const g=new Campaign('normal','paladin',()=>.73);
  assert(g.enter('supply-highlands'));
  const z=g.zone(),e=z.enemies.find(u=>u.roomCaptain&&u.captainProfile==='supply-highlands');
  assert(e);z.enemies=[e];g.s.party=[];g.s.mercyTime=0;
  g.hero.hp=g.hero.maxHp=1e6;
  Object.assign(g.hero,walkableNear(g,e));
  const profile=Campaign.rules.roomCaptains[e.captainProfile];
  e.hp=e.maxHp*(profile.phase.threshold-.06);
  assert.notEqual(g.engage(e,true,false),false);
  for(let i=0;i<180;i++)g.tick(dt,{x:0,y:0});
  assert(e.captainPhase);
  g.disengage(e,1.1);
  const restored=Campaign.restore(g.snapshot(),()=>.73),a=restored.zone().enemies.find(u=>u.id===e.id);
  assert(a&&!a.aggro);
  Object.assign(restored.hero,walkableNear(restored,a));
  a.hp=a.maxHp*(profile.phase.threshold-.06);
  assert.notEqual(restored.engage(a,true,false),false);
  assert(restored.triggerCaptainPhase(a));
  const lane=obstacle(restored,a);assert(lane);
  Object.assign(a,lane.a);a.home={...lane.a};
  Object.assign(restored.hero,lane.b,{hp:1e6,maxHp:1e6});
  assert(!restored.clearSegment(a,restored.hero));
  return {g:restored,e:a,lane};
}
function capture(g,label,ticks,subject,{sourceStacks=false}={}){
  const original={blocked:g.blocked,route:g.route,follow:g.follow,
    advance:g.advanceBudgetedRoute,updateEnemies:g.updateEnemies,
    updateElites:g.updateElites,updatePacks:g.updatePacks};
  let probes=0,routeCalls=[],followCalls=[],planCalls=[],segments=[],stackCounts=new Map();
  const peak={tick:-1,probes:-1,stacks:[],domain:{}},tickRows=[];
  const actors=Array.isArray(subject)?subject:[subject];
  let currentTick=0,domain='other',activeFollow=null;
  const domainCounts={};
  for(const k of ['updateEnemies','updateElites','updatePacks']){
    g[k]=function(...args){const prev=domain;domain=k;
      try{return original[k].apply(this,args)}finally{domain=prev}};
  }
  let routesByTick=[];
  g.blocked=function(...args){
    probes++;
    domainCounts[domain]=(domainCounts[domain]||0)+1;
    if(sourceStacks){
      const frames=(new Error()).stack.split('\n').slice(2);
      const callsites=frames.filter(s=>s.includes('/src/prototype/')).slice(0,5);
      const key=callsites.join(' <= ').replace(/\s+at /g,' ');
      const prev=stackCounts.get(key);if(prev)prev.count++;
      else stackCounts.set(key,{key,count:1});
    }
    return original.blocked.apply(this,args);
  };
  g.route=function(from,to,...rest){
    const before=probes,start=performance.now();
    const stack=(new Error()).stack.split('\n').slice(2,8).map(s=>s.trim());
    const out=original.route.call(this,from,to,...rest);
    const call={tick:currentTick,domain,actor:from?.id||null,origin:xy(from),
      dest:xy(to),probes:probes-before,cpuMs:num(performance.now()-start),
      waypoints:out.length,stack};
    routeCalls.push(call);routesByTick.push(call);
    return out;
  };
  g.advanceBudgetedRoute=function(a,b,mode,...rest){
    const before=probes;
    const out=original.advance.call(this,a,b,mode,...rest);
    planCalls.push({tick:currentTick,mode,probes:probes-before,
      domain,actor:activeFollow?.id||null,pending:out.pending});
    return out;
  };
  g.follow=function(actor,target,...rest){
    const before=probes,p={x:actor.x,y:actor.y},prev=activeFollow;
    activeFollow=actor;
    try{
      const out=original.follow.call(this,actor,target,...rest);
      followCalls.push({tick:currentTick,actor:actor.id||actor.name||'npc',
        kind:actor.family||actor.veraEscort&&'escort-guard'||'other',
        domain,probes:probes-before,moved:num(dist(p,actor)),dest:xy(target),
        planningMode:rest[3]||null});
      return out;
    }finally{activeFollow=prev;}
  };
  const positions=actors.map(a=>({x:a.x,y:a.y}));
  try{
    for(let i=0;i<ticks;i++){
      currentTick=i;domainCounts.updateEnemies=0;domainCounts.updateElites=0;domainCounts.updatePacks=0;domainCounts.other=0;
      stackCounts=new Map();routesByTick=[];const before=probes,start=performance.now();
      g.tick(dt,{x:0,y:0});
      const count=probes-before,cpuMs=num(performance.now()-start);
      const row={tick:i,probes:count,cpuMs,domains:{...domainCounts},
        routes:routesByTick.map(r=>({actor:r.actor,probes:r.probes,stack:r.stack.slice(0,4)}))};
      tickRows.push(row);
      if(count>peak.probes){
        peak.tick=i;peak.probes=count;peak.cpuMs=cpuMs;
        peak.domain={...domainCounts};
        peak.stacks=[...stackCounts.values()].sort((a,b)=>b.count-a.count).slice(0,12);
      }
    }
  }finally{
    for(const [k,fn] of Object.entries(original))delete g[k];
  }
  const topRoutes=routeCalls.slice().sort((a,b)=>b.probes-a.probes).slice(0,12);
  const topFollows=followCalls.slice().sort((a,b)=>b.probes-a.probes).slice(0,12);
  const stats={label,ticks,zone:g.zoneId,actors:actors.map(a=>({id:a.id||a.name,
    kind:a.family||a.veraEscort&&'escort-guard'||'npc'})),
    totalProbes:probes,peak,medianTickProbes:median(tickRows.map(z=>z.probes)),
    p95TickProbes:tickRows.map(z=>z.probes).sort((a,b)=>a-b)[Math.floor(ticks*.95)],
    routes:{calls:routeCalls.length,probes:routeCalls.reduce((x,r)=>x+r.probes,0),
      peak:topRoutes[0]||null,top:topRoutes},
    follows:{calls:followCalls.length,top:topFollows},
    plans:{calls:planCalls.length,peakProbes:Math.max(0,...planCalls.map(p=>p.probes)),
      breakdown:Object.fromEntries([...new Set(planCalls.map(p=>p.mode))].map(mode=>{
        const a=planCalls.filter(p=>p.mode===mode);
        return [mode,{calls:a.length,probes:a.reduce((x,p)=>x+p.probes,0),
          pending:a.filter(p=>p.pending).length}];
      }))},
    end:actors.map((a,i)=>({id:a.id||a.name,from:xy(positions[i]),
      to:xy(a),moved:num(dist(positions[i],a)),aggro:!!a.aggro,returning:!!a.returning,
      cinderReturn:!!a.cinderReturn}))};
  console.log('ISSUE615_REMAINING_NATIVE_TRACE '+JSON.stringify(stats));
  return stats;
}
// The exact previous Highlands captain phase scenario, isolated to identify
// the 8,830-probe burst. Stack buckets retain native source callers.
{
  const {g,e,lane}=highlands();
  const stats=capture(g,'highlands-phased-obstructed',120,e,{sourceStacks:true});
  assert(stats.peak.probes>1000,'must reproduce the high-cost phase fixture');
  assert(stats.plans.breakdown['elite-pursuit']?.calls>0,'same phased elite planner used');
  console.log('ISSUE615_HIGHLANDS_SETUP '+JSON.stringify({origin:xy(lane.a),hero:xy(lane.b),
    exactWaypoints:lane.waypoints}));
}
// Cindermaw and Vera: retain native source actors, original civilian NPC and
// authored Crown geometry. Only the unrelated enemy population is excluded,
// matching existing six class/mode ministry lifecycle fixtures.
function crown(seed=11){
  const random=()=> (seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
  const g=new Campaign('normal','paladin',random);assert(g.enter('crown'));
  g.s.party=[];g.hero.hp=g.hero.maxHp=1e6;
  const z=g.zone(),boss=z.enemies.find(e=>e.family==='cindermaw'&&e.type==='boss'),
    vera=g.veraCaptive(),guards=z.enemies.filter(u=>vera?.escortGuardIds?.includes(u.id));
  assert(boss&&vera&&guards.length===2,'native Crown boss/forge/two guard identities');
  z.enemies=[boss,...guards];
  // Real town arrival leaves the hero out of the minister's immediate range.
  return {g,z,boss,vera,guards,random};
}
{
  const {g,boss,vera,guards}=crown(11);
  const stats=capture(g,'cinder-passive-authored-spawn',240,[boss,vera,...guards]);
  console.log('ISSUE615_CINDER_BASELINE '+JSON.stringify({
    inspection:!!boss.cinderDestination,stop:boss.cinderStop,forgeDistance:num(dist(boss,vera)),
    guardDistances:guards.map(u=>num(dist(u,boss))),routeCalls:stats.routes.calls}));
}
{
  const {g,boss,vera,guards}=crown(11);
  // Force only the documented idle inspection pause to expire. Actual
  // itinerary selection, NPC following and collision remain original.
  boss.cinderInspectionPause=0;delete boss.cinderDestination;
  const stats=capture(g,'cinder-inspection-selection',80,[boss,vera,...guards]);
  console.log('ISSUE615_CINDER_SELECTION '+JSON.stringify({
    stop:boss.cinderStop,destination:boss.cinderDestination||null,
    forgeDistance:num(dist(boss,vera)),routeCalls:stats.routes.calls}));
}
{
  const {g,boss,vera,guards}=crown(11);
  const stops=g.cinderInspectionStops();
  // Distant authored stop to exercise a real leg, while keeping existing
  // native entourage/escort decisions and terrain validation.
  const idx=stops.findIndex(p=>dist(p,boss)>300 && g.route(boss,p).length);
  assert(idx>=0,'native Cinder stop reachable');
  const target={...stops[idx],i:idx};
  boss.cinderDestination=target;boss.cinderInspectionPause=0;
  const stats=capture(g,'cinder-inspection-leg-and-escort',240,[boss,vera,...guards]);
  console.log('ISSUE615_CINDER_LEG '+JSON.stringify({target:xy(target),stop:boss.cinderStop,
    destination:boss.cinderDestination||null,forgeDistance:num(dist(boss,vera)),
    routeCalls:stats.routes.calls}));
}
{
  const {g,boss,vera,guards}=crown(11);
  // Reconstruct an actual remote interception at a native safe Crown point,
  // then use the original engage/disengage/physical return state machine.
  const p=g.safe(1900,1450);Object.assign(boss,p);
  Object.assign(vera,g.safe(p.x+20,p.y+20));
  for(const [i,u] of guards.entries())Object.assign(u,g.safe(p.x+(i?70:-70),p.y+60));
  Object.assign(g.hero,g.safe(p.x+60,p.y),{hp:1e6,maxHp:1e6});
  assert.notEqual(g.engage(boss,true,false),false);
  // The engagement anchor is at p; move the real actor to another legal
  // position as scripted combat displacement would, so physical return has
  // a genuine route and cannot finish immediately at its own anchor.
  Object.assign(boss,g.safe(p.x+340,p.y+120));
  Object.assign(g.hero,g.safe(300,350));
  g.disengage(boss,dt);
  assert(boss.cinderReturn || boss.returning,'native Cindermaw return initiated');
  const stats=capture(g,'cinder-remote-disengage-return',400,[boss,vera,...guards]);
  console.log('ISSUE615_CINDER_RETURN '+JSON.stringify({
    bossReturning:!!boss.cinderReturn,returnedHome:dist(boss,boss.home)<.1,
    forgeDistance:num(dist(boss,vera)),guardDistances:guards.map(u=>num(dist(u,boss))),
    routeCalls:stats.routes.calls}));
}
console.log('PASS #615 diagnostic complete; traces are evidence, not automatic gameplay acceptance.');
