'use strict';
const assert=require('node:assert/strict'),Campaign=require('../src/prototype/engine.js'),R=require('../src/prototype/rules.js'),Visuals=require('../src/prototype/visuals.js');
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
let passed=0;function test(name,fn){try{fn();passed++;console.log('PASS '+name);}catch(e){process.exitCode=1;console.error('FAIL '+name+' '+e.stack);}}

for(const [i,region] of Campaign.data.regions.entries())test(region.id+' overworld reads as a settled, natural place',()=>{
 const c=new Campaign(),ok=c.enter(region.id),z=c.zone();assert(ok);assert.equal(z.roadVersion,5);assert.equal(z.settlementLayoutVersion,2);assert.equal(z.aestheticVersion,2);assert.equal(z.landmarkLayoutVersion,2);
 const blockers=z.props.filter(p=>p.roadBlocker),life=z.props.filter(p=>String(p.id).startsWith('aesthetic-town-')||String(p.id).startsWith('aesthetic-hamlet-')),nature=z.props.filter(p=>String(p.id).startsWith('aesthetic-nature-')||String(p.id).startsWith('aesthetic-bank-'));
 assert(blockers.length>=13,region.id+' has a real settlement footprint');assert(life.length>=6,region.id+' towns show daily life');assert(nature.length>=25,region.id+' countryside has visible regional nature');assert(new Set(nature.map(p=>p.structure)).size>=3,region.id+' nature is not one repeated prop');assert(z.props.length<=300);
 for(const p of blockers)for(const path of z.roads)for(let j=1;j<path.length;j++)assert(c.distanceToSegment(p,path[j-1],path[j])>p.r+15,region.id+' road crosses '+p.id);
 const ids=['rest','supplier','recruiter','board','return'].map(id=>z.npcs.find(n=>n.id===id)).filter(Boolean);
 for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++)assert(distance(ids[a],ids[b])>=90,region.id+' town NPCs visually stack: '+ids[a].id+' '+ids[b].id);
 const {bounds:[x1,x2],gaps}=R.barriers[i],bridges=z.npcs.filter(n=>n.kind==='landmark'&&n.id.startsWith('bridge-')).sort((a,b)=>a.y-b.y);
 assert.equal(bridges.length,gaps.length,region.id+' crossing landmarks match actual crossings');
 bridges.forEach((n,j)=>{assert(Math.abs(n.x-(x1+x2)/2)<=35,region.id+' bridge is not on barrier');assert(n.y>=gaps[j][0]&&n.y<=gaps[j][1],region.id+' bridge is not inside its crossing gap');});
});

test('named landmarks sit beside the world feature their names describe',()=>{
 const vale=new Campaign();vale.enter('vale');let z=vale.zone(),pond=z.npcs.find(n=>n.id==='mill-pond'),water=R.terrain[0].find(p=>p.r);const pondDistance=distance(pond,water);assert(pondDistance>water.r&&pondDistance<water.r+70,'Mill pond marker belongs on the pond shore');
 const march=new Campaign();march.enter('march');z=march.zone();const dock=z.npcs.find(n=>n.id==='dock'),lake=R.barriers[1].bounds;assert(Math.min(Math.abs(dock.x-lake[0]),Math.abs(dock.x-lake[1]))<100&&dock.y>lake[2]&&dock.y<lake[3],'Sunken dock belongs on the lake shore');
 for(const [region,id,max] of [['highlands','tower',260],['frontier','checkpoint',220],['crown','fortress-gate',220]]){const c=new Campaign();c.enter(region);const n=c.zone().npcs.find(n=>n.id===id),f=c.fieldCenter();assert(distance(n,f)<max,region+' '+id+' belongs to its stronghold area');}
});


function visualSignature(entity,region){
 const log=[],target={};const ctx=new Proxy(target,{get(o,p){if(p in o)return o[p];return (...args)=>{log.push([String(p),...args.map(v=>typeof v==='number'?Math.round(v*100)/100:v)]);};},set(o,p,v){o[p]=v;log.push(['set',String(p),v]);return true;}});
 Visuals.draw(ctx,entity,{x:0,y:0},region,false);return JSON.stringify(log);
}
test('named town utilities use distinct purpose-specific silhouettes while retaining each regional palette',()=>{
 const roles=[
  {id:'rest',kind:'rest',renderKind:'npc',name:'Refuge'},
  {id:'supplier',kind:'supplier',renderKind:'npc',name:'Supplies'},
  {id:'recruiter',kind:'recruiter',renderKind:'npc',name:'Captain'},
  {id:'board',kind:'quests',renderKind:'npc',name:'Quest board'},
  {id:'barracks',kind:'barracks',renderKind:'building',name:'Barracks',progress:4}
 ];
 for(let region=0;region<Campaign.data.regions.length;region++){
  const generic=visualSignature({id:'generic-house',renderKind:'prop',structure:'house',decorative:false},region),signatures=roles.map(e=>visualSignature(e,region));
  assert.equal(new Set(signatures).size,roles.length,Campaign.data.regions[region].id+' utility silhouettes are distinct');
  assert(signatures.every(s=>s!==generic),Campaign.data.regions[region].id+' named utilities do not reuse generic-house drawing');
 }
 for(const role of roles){const regional=Campaign.data.regions.map((_,i)=>visualSignature(role,i));assert(new Set(regional).size>=4,role.kind+' visibly inherits regional materials/colors');}
});
test('each field-boss Treasury has a distinct boss-home entrance rather than a dungeon gate',()=>{
 const genericGate=visualSignature({id:'entrance',kind:'dungeon',family:'crypt',renderKind:'npc'},0),seen=[];
 for(const room of R.supplyRooms){const region=Campaign.data.regions.findIndex(r=>r.id===room.region),sig=visualSignature({id:'supply-entrance',kind:'dungeon',family:room.id,treasury:true,treasuryBoss:room.boss,renderKind:'npc'},region);assert.notEqual(sig,genericGate,room.id+' entrance differs from generic dungeon gate');seen.push(sig);}
 assert.equal(new Set(seen).size,R.supplyRooms.length,'all four Treasury entrances have distinct boss identities');
});
console.log(passed+' world-aesthetic scenarios passed.');
