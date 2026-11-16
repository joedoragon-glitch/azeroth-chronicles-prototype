'use strict';
// Report #40 non-shipping algorithm comparison. Keep native Campaign terrain.
// This is an experiment, NOT permission to change enemy/companion routing.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine');
const {performance}=require('node:perf_hooks');
const xy=[[1700,1000],[1600,1000],[1500,1000],[1400,1000],
  [1300,1000],[1300,900],[1200,800]];
const goal=Campaign.rules.thornPatrol.route[4];
const g=new Campaign('normal','mage',()=>.5);
const nativeRoute=g.route;
let nativeBlockedCalls=0, astarBlockedCalls=0, countGroup='native';
const originalBlocked=g.blocked;
g.blocked=function(...args){
  if(countGroup==='native')nativeBlockedCalls++;
  else astarBlockedCalls++;
  return originalBlocked.apply(this,args);
};
// Duplicated here solely for comparison. No production runtime modification.
// Preserve the source's anchor validation, grid size, 4-connected walkability,
// safe() endpoint, fallback seed policy and last-leg exact collision test.
function aStarRoute(game,origin,dest,options={}){
  if(options.road) return nativeRoute.call(game,origin,dest,options);
  const terrainOnly=!!options.terrainOnly,
    target=game.safe(dest.x,dest.y),
    step=50,size=game.zoneSize(),n=Math.ceil(size/step),
    point=id=>({x:(id%n)*step+25,y:Math.floor(id/n)*step+25});
  if(game.clearSegment(origin,target,15,terrainOnly))return [target];
  const nearby=p=>{
    const out=[],cx=Math.floor(p.x/step),cy=Math.floor(p.y/step);
    for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++){
      const x=cx+dx,y=cy+dy;
      if(x<0||y<0||x>=n||y>=n)continue;
      const id=y*n+x,q=point(id);
      if(!game.blocked(q.x,q.y,game.s.zone,15,terrainOnly)&&
          game.clearSegment(p,q,15,terrainOnly))out.push(id);
    }
    return out.sort((a,b)=>Math.hypot(point(a).x-p.x,point(a).y-p.y)-
      Math.hypot(point(b).x-p.x,point(b).y-p.y));
  };
  const starts=nearby(origin),ends=nearby(target);
  if(!starts.length||!ends.length)return [];
  const search=(sources,goals)=>{
    const parents=new Map(),cost=new Map(),heap=[],targets=new Set(goals),
      valid=new Map();
    const heuristic=id=>{
      let best=Infinity;
      for(const goalId of goals){
        const dx=Math.abs((id%n)-(goalId%n)),
          dy=Math.abs(Math.floor(id/n)-Math.floor(goalId/n));
        best=Math.min(best,dx+dy);
      }
      return best*step;
    };
    const push=(item)=>{
      let i=heap.length;heap.push(item);
      while(i){const p=(i-1)>>1;if(heap[p].f<=item.f)break;
        heap[i]=heap[p];i=p;}heap[i]=item;
    };
    const pop=()=>{
      const top=heap[0],last=heap.pop();
      if(heap.length){
        let i=0;
        while((i*2+1)<heap.length){
          let c=i*2+1;
          if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;
          if(last.f<=heap[c].f)break;
          heap[i]=heap[c];i=c;
        }
        heap[i]=last;
      }
      return top;
    };
    const free=id=>{
      if(!valid.has(id)){
        const p=point(id);
        valid.set(id,!game.blocked(p.x,p.y,game.s.zone,15,terrainOnly));
      }
      return valid.get(id);
    };
    for(const id of sources){
      parents.set(id,null);cost.set(id,0);
      push({id,g:0,f:heuristic(id)});
    }
    while(heap.length){
      const entry=pop(),id=entry.id;
      if(entry.g!==cost.get(id))continue;
      if(targets.has(id)){
        const path=[target];
        for(let at=id;at!==null;at=parents.get(at))path.push(point(at));
        path.reverse();
        const smoothed=[];
        let current=origin,j=0;
        while(j<path.length){
          let far=j;
          for(let k=j+1;k<path.length;k++){
            if(!game.clearSegment(current,path[k],15,terrainOnly))break;
            far=k;
          }
          smoothed.push(path[far]);
          current=path[far];j=far+1;
        }
        return smoothed;
      }
      const x=id%n,y=Math.floor(id/n),from=point(id);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const xx=x+dx,yy=y+dy,next=yy*n+xx;
        if(xx<0||yy<0||xx>=n||yy>=n||!free(next)||
            !game.clearSegment(from,point(next),15,terrainOnly))continue;
        const candidate=entry.g+step;
        if(candidate >= (cost.get(next)??Infinity))continue;
        cost.set(next,candidate);parents.set(next,id);
        push({id:next,g:candidate,f:candidate+heuristic(next)});
      }
    }
    return [];
  };
  const primary=search([starts[0]],[ends[0]]);
  return primary.length?primary:search(starts,ends);
}
const rows=[];
for(const [x,y] of xy){
  Object.assign(g.hero,{x,y});
  const dest={id:'thorn-lead-4',name:'Skeleton territory',x:goal[0],y:goal[1]};
  const startNative=performance.now();countGroup='native';
  const fromNative=nativeRoute;
  g.route=nativeRoute;
  const original=g.navigationTarget(dest);
  const msNative=performance.now()-startNative;
  countGroup='astar';
  g.route=function(a,b,options){return aStarRoute(this,a,b,options)};
  const startFast=performance.now();
  const fast=g.navigationTarget(dest);
  const msFast=performance.now()-startFast;
  const samePoint=JSON.stringify(original?.point)===JSON.stringify(fast?.point);
  assert(samePoint,'same legal arrival landmark for '+x+','+y);
  assert(fast?.path?.length,'the non-shipping A* prototype finds a route');
  let previous={x,y};
  for(const next of fast.path){
    assert(g.clearSegment(previous,next,15,false),'prototype path must be traversable');
    previous=next;
  }
  const pathLength=path=>{
    let length=0,prev={x,y};
    for(const a of path){length+=Math.hypot(a.x-prev.x,a.y-prev.y);prev=a;}
    return length;
  };
  const nativeDistance=pathLength(original.path),
    trialDistance=pathLength(fast.path);
  rows.push({from:[x,y],nativeMs:+msNative.toFixed(2),astarMs:+msFast.toFixed(2),
    nativeWaypoints:original.path.length,astarWaypoints:fast.path.length,
    nativeDistance:+nativeDistance.toFixed(1),
    astarDistance:+trialDistance.toFixed(1),
    detourRatio:+(trialDistance/nativeDistance).toFixed(3)});
}
const sorted=k=>rows.map(row=>row[k]).sort((a,b)=>a-b);
const base=sorted('nativeMs'),trial=sorted('astarMs');
console.log('REPORT40_ASTAR_PROTOTYPE '+JSON.stringify({
  baseMedianMs:base[Math.floor(base.length/2)],
  astarMedianMs:trial[Math.floor(trial.length/2)],
  totalNativeBlockedCalls:nativeBlockedCalls,
  totalAstarBlockedCalls:astarBlockedCalls,
  rows,
  status:'NONSHIPPING test-only prototype: collision-legality + terminal target parity checked',
}));
console.log('PASS native versus targeted A* algorithm experiment (no game change)');
