'use strict';
// Report #40 test-only experiment: can a selected map route remain collision
// valid after the player manually deviates? Do not change game runtime here.
const assert=require('node:assert/strict');
const C=require('../src/prototype/engine');
const {performance}=require('node:perf_hooks');
const g=new C('normal','mage',()=>.5),z=g.zone();
const witness=z.npcs.find(n=>n.thornReport);
assert(witness,'native Western road observer exists');
const goal=C.rules.thornPatrol.route[4],
  destination={id:'thorn-lead-4',x:goal[0],y:goal[1],name:'Skeleton territory'};
Object.assign(g.hero,{x:witness.x,y:witness.y});
const initial=g.navigationTarget(destination);
assert(initial?.path?.length,'native witness can establish initial route');
const sourceRoute=initial.path.map(p=>({x:p.x,y:p.y}));
const samples=[
  [1700,1000],[1600,1000],[1500,1000],[1400,1000],
  [1300,1000],[1300,900],[1200,800],
];
const rows=[];
for(const [x,y] of samples){
  Object.assign(g.hero,{x,y});
  const start=performance.now();
  // A retained route may be joined at ANY existing downstream waypoint
  // when the current hero->waypoint segment is safely traversable. The
  // original route remains the only travel suggestion otherwise.
  let nextRoute=null,joinIndex=-1;
  for(let i=sourceRoute.length-1;i>=0;i--){
    if(g.clearSegment(g.hero,sourceRoute[i],15,false)){
      const candidate=sourceRoute.slice(i);
      let prior={x,y};
      for(const point of candidate){
        assert(g.clearSegment(prior,point,15,false),
          'existing waypoint reconnect segment must be currently collision-safe');
        prior=point;
      }
      nextRoute=candidate;
      joinIndex=i;
      break;
    }
  }
  rows.push({from:[x,y],joinIndex,originalPoints:sourceRoute.length,
    reusesExistingPath:!!nextRoute,walkablePath:!!nextRoute,
    validationMs:+(performance.now()-start).toFixed(2),
    retainedPathPoints:nextRoute?.length??0});
}
console.log('REPORT40_WAYPOINT_REUSE_EXPERIMENT '+JSON.stringify({
  witness:{x:Math.round(witness.x),y:Math.round(witness.y)},
  destination:goal,
  originalRouteWaypoints:sourceRoute.length,
  sampled:rows.length,
  reused:rows.filter(row=>row.reusesExistingPath).length,
  rows,
  note:'synthetic coordinates on actual terrain; collision-valid reuse test only; no source behavior change',
}));
console.log('PASS collision-valid waypoint-route reuse experiment');
