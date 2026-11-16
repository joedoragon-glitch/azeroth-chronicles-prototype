'use strict';
// Report #40: test-only, gameplay-tolerant comparison of an already existing
// incremental A* planner for OPTIONAL route guidance. No runtime changes.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine');
const {performance}=require('node:perf_hooks');
const goal=Campaign.rules.thornPatrol.route[4];
const positions=[[1700,1000],[1600,1000],[1500,1000],[1400,1000],
 [1300,1000],[1300,900],[1200,800]];
const g=new Campaign('normal','mage',()=>.5);
const samples=[];
for(const [x,y] of positions){
 const from={x,y},to={x:goal[0],y:goal[1]};
 const iterator=g.budgetedCompanionRoute(from,to,false);
 let pending=null,reply,done=false,path=null;
 let frames=0,probes=0,nodes=0,maxMs=0,totalMs=0;
 while(!done && frames<300){
  frames++;
  let probeQuota=256,nodeQuota=40;
  const begin=performance.now();
  for(;;){
   if(!pending){
    const next=iterator.next(reply);reply=undefined;
    if(next.done){done=true;path=next.value;break;}
    pending=next.value;
   }
   if(pending.kind==='blocked'){
    if(!probeQuota)break;
    probeQuota--;probes++;
    reply=g.blocked(...pending.args);
   } else if(pending.kind==='node'){
    if(!nodeQuota)break;
    nodeQuota--;nodes++;reply=undefined;
   }else throw Error('unknown request');
   pending=null;
  }
  const ms=performance.now()-begin;
  totalMs+=ms;maxMs=Math.max(ms,maxMs);
 }
 // Reachability and geometric legality matter; exact BFS shape does not.
 assert(done,'A* search must terminate with a bounded search effort');
 assert(path?.length,'existing A* must produce a useful path at '+x+','+y);
 let last=from;
 for(const point of path){
  assert(g.clearSegment(last,point,15,false),'A* leg must be walkable');
  last=point;
 }
 assert(Math.hypot(last.x-to.x,last.y-to.y)<1,'correct destination');
 samples.push({from:[x,y],frames,probes,nodes,pathPoints:path.length,
  maxSliceMs:+maxMs.toFixed(2),totalSearchMs:+totalMs.toFixed(2)});
}
console.log('REPORT40_INCREMENTAL_ASTAR_GUIDE '+JSON.stringify({
 samples,guideOnly:true,criterion:'reachability + walkable legs + bounded work, not identical native BFS route',
 warning:'CI-only timings; implementation still requires movement-drift, cancellation and gameplay controls'
}));
console.log('PASS existing bounded A* at 7 Greenwood detours with relaxed path-shape parity');
