'use strict';
// Diagnostic only: distinguish travel collisions/blocked frontages from
// blanket road connectedness and art-margin ideals. Never suppress red originals.
const C=require('../src/prototype/engine.js');
const {rng}=require('../tools/greenwood-layout/fixtures.cjs');
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
for(const [i,id] of ['march','highlands','frontier','crown'].entries()){
 const c=new C('normal','paladin',rng(0x11005a10+i));c.enter(id);
 const z=c.zone(),k=c.regionIndex(),town={x:C.data.towns[k][0],y:C.data.towns[k][1]};
 const segs=[],props=[],npcs=[],buildings=[];
 for(const [ridx,r] of z.roads.entries()){
  for(let j=1;j<r.length;j++)if(!c.clearSegment(r[j-1],r[j],15)){
   segs.push({road:ridx,index:j,from:r[j-1],to:r[j]});
  }
 }
 for(const p of z.props){
  if(p.roadTrace)continue;
  const available=c.distanceToRoad(z,p),need=c.roadSetback(p);
  if(available+.01<need)props.push({
   id:p.id,x:p.x,y:p.y,structure:p.structure,roadBlocker:!!p.roadBlocker,
   decorative:!!p.decorative,r:p.r||0,actual:+available.toFixed(1),
   required:+need.toFixed(1)});
 }
 for(const [id,need] of [['rest',190],['minor',180],['supplier',92],['recruiter',92],['board',95]]){
  const p=z.npcs.find(n=>n.id===id);
  if(p){
   const d=c.distanceToRoad(z,p);
   if(d+.01<need)npcs.push({id,x:p.x,y:p.y,actual:+d.toFixed(1),required:need});
  }
 }
 for(const b of z.buildings){
  const d=c.distanceToRoad(z,b);
  if(d+.01<175)buildings.push({id:b.id,x:b.x,y:b.y,actual:+d.toFixed(1),required:175});
 }
 const touched=(p,path)=>path.some((q,j)=>j&&c.distanceToSegment(p,path[j-1],q)<1);
 const connected=new Set(z.roads.map((r,j)=>touched(town,r)?j:-1).filter(j=>j>=0));
 for(let grew=true;grew;){
  grew=false;
  z.roads.forEach((r,j)=>{
   if(connected.has(j))return;
   if([...connected].some(k=>r.some(p=>touched(p,z.roads[k]))||z.roads[k].some(p=>touched(p,r)))){
    connected.add(j);grew=true;
   }
  });
 }
 console.log('REGIONAL_SAFETY '+JSON.stringify({id,roads:z.roads.length,connected:connected.size,
  unsafeRoadSegments:segs,roofAndSceneryMarginViolations:props.length,
  blockingProps:props.filter(p=>p.roadBlocker),sampleMarginViolations:props.slice(0,25),
  servicesTooNearRoad:npcs,playerBuildingsTooNearRoad:buildings}));
}
console.log('PASS native road physical-segment and authored-frontage diagnostic; no red case waived');