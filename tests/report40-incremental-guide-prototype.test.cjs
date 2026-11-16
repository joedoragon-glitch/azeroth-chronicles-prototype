'use strict';
// Test only. Characterize whether the existing native budgeted tactical
// generator can provide a gameplay-safe, incrementally updated optional guide.
// This does NOT alter the planner or add work to enemy/companion pools.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine');
const {performance}=require('node:perf_hooks');
const g=new Campaign('normal','mage',()=>.5);
const destination=Campaign.rules.thornPatrol.route[4];
const results=[];
for(const [x,y] of [[1700,1000],[1300,900]]){
  const from={x,y},to={x:destination[0],y:destination[1]},
    startNative=performance.now(),
    native=g.route(from,to),
    nativeMs=performance.now()-startNative;
  assert(native.length,'actual Greenwood candidate route reachable');
  const iterator=g.budgetedTacticalRoute(from,to);
  let pending=null,reply,finished=false,route=null;
  let ticks=0,probesTotal=0,nodesTotal=0,maxTickMs=0,sumTickMs=0,maxTickProbes=0;
  while(!finished && ticks<200){
    ticks++;
    let probesLeft=512,nodesLeft=80,frameProbes=0;
    const start=performance.now();
    while(true){
      if(!pending){
        const next=iterator.next(reply);
        reply=undefined;
        if(next.done){finished=true;route=next.value;break;}
        pending=next.value;
      }
      if(pending.kind==='blocked'){
        if(!probesLeft)break;
        probesLeft--;probesTotal++;frameProbes++;
        reply=g.blocked(...pending.args);
      }else if(pending.kind==='node'){
        if(!nodesLeft)break;
        nodesLeft--;nodesTotal++;
        reply=undefined;
      }else throw Error('unexpected generator instruction');
      pending=null;
    }
    maxTickProbes=Math.max(maxTickProbes,frameProbes);
    const ms=performance.now()-start;
    maxTickMs=Math.max(maxTickMs,ms);sumTickMs+=ms;
  }
  assert(finished,'native incremental guide generator must complete in bounded ticks');
  assert.deepEqual(route,native,'already-shipping tactical generator must match native route exact waypoints');
  let at=from;
  for(const point of route){
    assert(g.clearSegment(at,point,15,false),'incremental route segment walkable');
    at=point;
  }
  results.push({
    from:[x,y],to:destination,nativeMs:+nativeMs.toFixed(2),
    incrementalFrames:ticks,
    incrementalSimSecondsAt20Fps:+(ticks/20).toFixed(2),
    perFrameMaximumMs:+maxTickMs.toFixed(2),
    perFrameMeanMs:+(sumTickMs/ticks).toFixed(2),
    totalMs:+sumTickMs.toFixed(2),
    totalProbes:probesTotal,totalNodes:nodesTotal,
    perFrameMaxProbes:maxTickProbes,
    pathPoints:route.length,exactNativeParity:true,
  });
}
console.log('REPORT40_INCREMENTAL_GUIDE_PROTOTYPE '+JSON.stringify({
  results,scope:'native existing tactical generator, test-only per-guide isolated budget',
  warning:'an unfinished route is stale; production acceptance must preserve correct destination and handle moving hero and terrain changes',
}));
console.log('PASS incremental route generator exact path parity and bounded per-slice work');
