'use strict';
const assert=require('node:assert/strict'),Campaign=require('../src/prototype/engine.js'),R=require('../src/prototype/rules.js'),Visuals=require('../src/prototype/visuals.js');
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
assert.equal(typeof Visuals.atmosphere,'function','procedural renderer exposes the regional atmosphere layer');
let passed=0;function test(name,fn){try{fn();passed++;console.log('PASS '+name);}catch(e){process.exitCode=1;console.error('FAIL '+name+' '+e.stack);}}

for(const [i,region] of Campaign.data.regions.entries())test(region.id+' overworld reads as a settled, natural place',()=>{
 const c=new Campaign(),ok=c.enter(region.id),z=c.zone();assert(ok);assert.equal(z.roadVersion,8);assert.equal(z.settlementLayoutVersion,3);assert.equal(z.aestheticVersion,3);assert.equal(z.landmarkLayoutVersion,3);assert.equal(z.worldLifeVersion,1);
 const blockers=z.props.filter(p=>p.roadBlocker),life=z.props.filter(p=>String(p.id).startsWith('aesthetic-town-')||String(p.id).startsWith('aesthetic-hamlet-')),nature=z.props.filter(p=>String(p.id).startsWith('aesthetic-nature-')||String(p.id).startsWith('aesthetic-bank-'));
 assert(blockers.length>=13,region.id+' has a real settlement footprint');assert(life.length>=6,region.id+' towns show daily life');assert(nature.length>=25,region.id+' countryside has visible regional nature');assert(new Set(nature.map(p=>p.structure)).size>=3,region.id+' nature is not one repeated prop');const lived=z.props.filter(p=>String(p.id).startsWith('world-life-'));assert(lived.length>=12,region.id+' has civilian, habitat and field living-space details');assert(lived.some(p=>String(p.id).includes('-civilian-')));assert(lived.some(p=>String(p.id).includes('-habitat-')));assert(lived.some(p=>String(p.id).includes('-field-')));assert(R.landforms[i]?.length>=4,region.id+' has authored regional landforms');assert(z.props.length<=380);
 for(const p of blockers)for(const path of z.roads)for(let j=1;j<path.length;j++)assert(c.distanceToSegment(p,path[j-1],path[j])>p.r+15,region.id+' road crosses '+p.id);
 const ids=['rest','supplier','recruiter','board','return'].map(id=>z.npcs.find(n=>n.id===id)).filter(Boolean);
 for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++)assert(distance(ids[a],ids[b])>=90,region.id+' town NPCs visually stack: '+ids[a].id+' '+ids[b].id);
 const {bounds:[x1,x2],gaps}=R.barriers[i],bridges=z.npcs.filter(n=>n.kind==='landmark'&&n.id.startsWith('bridge-')).sort((a,b)=>a.y-b.y);
 assert.equal(bridges.length,gaps.length,region.id+' crossing landmarks match actual crossings');
 bridges.forEach((n,j)=>{assert(Math.abs(n.x-(x1+x2)/2)<=35,region.id+' bridge is not on barrier');assert(n.y>=gaps[j][0]&&n.y<=gaps[j][1],region.id+' bridge is not inside its crossing gap');});
});

test('expanded destination migration keeps transports, dungeons and strongholds aligned with canonical data',()=>{
 for(const [i,region] of Campaign.data.regions.entries()){const c=new Campaign();c.enter(region.id);const z=c.zone(),entrance=z.npcs.find(n=>n.id==='entrance');assert.equal(z.destinationLayoutVersion,2);assert(distance(entrance,{x:Campaign.data.entrances[i][0],y:Campaign.data.entrances[i][1]})<1,region.id+' dungeon entrance follows expanded geography');if(!R.harbors?.[region.id]&&i<4){const out=z.npcs.find(n=>n.id==='outbound');assert(distance(out,{x:Campaign.data.ports[i][0],y:Campaign.data.ports[i][1]})<1,region.id+' outbound transport follows expanded geography');}}
});

test('Flooded Marches and Ironroot Highlands share a continuous ferry route',()=>{for(const region of ['march','highlands']){const c=new Campaign();c.enter(region);const z=c.zone(),h=R.harbors[region],boat=z.npcs.find(n=>n.harbor);assert(h&&boat,region+' has an authored ferry harbor and boat');assert.equal(z.harborVersion,1);assert(distance(boat,h.boat)<1,region+' boat sits at the authored water berth');assert(!c.blocked(h.arrival.x,h.arrival.y,region),region+' dock arrival is walkable');const waterPoint={x:(h.water.x1+h.water.x2)/2,y:(h.water.y1+h.water.y2)/2};if(distance(waterPoint,h.boat)>45)assert(c.blocked(waterPoint.x,waterPoint.y,region),region+' surrounding harbor water is impassable');assert(c.route(h.arrival,{x:Campaign.data.towns[c.regionIndex()][0],y:Campaign.data.towns[c.regionIndex()][1]}).length,region+' dock connects by foot to town');if(region==='march')assert(z.props.filter(p=>String(p.id).startsWith('harbor-')&&p.structure==='mangrove').length>=3,'March ferry shore is visibly mangrove/swamp authored');}}
);
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
test('regional settlements use genuinely different building families rather than recolored generic houses',()=>{
 const expected=['vale-cottage','march-stilt-house','highland-stone-house','frontier-patched-house','crown-ash-house'];
 for(const [i,region] of Campaign.data.regions.entries()){const c=new Campaign();c.enter(region.id);const z=c.zone(),houses=z.props.filter(p=>String(p.id).startsWith('settlement-')&&p.roadBlocker);assert(houses.some(p=>p.structure===expected[i]),region.id+' has its authored regional house family');const signatures=houses.slice(0,5).map(p=>visualSignature({...p,renderKind:'prop'},i));assert(new Set(signatures).size>=2,region.id+' settlement footprint is not one repeated silhouette');}
});
test('expanded regions actually use their extra land for occupation and breathing room',()=>{
 const minimum=[2700,3000,3400,3400,3800];
 for(const [i,region] of Campaign.data.regions.entries()){assert(region.size>=minimum[i],region.id+' expanded size retained');const c=new Campaign();c.enter(region.id);const z=c.zone(),outer=z.enemies.filter(e=>e.type==='mob'&&!e.guard&&!e.mini&&!e.site&&e.home&&(e.home.x>region.size*.72||e.home.y>region.size*.72));assert(outer.length,region.id+' enlarged outer space contains real patrol territory');const occupied=z.props.filter(p=>String(p.id).startsWith('world-life-habitat-'));assert(occupied.length>=5,region.id+' monster territory has lived-in props');}
});
test('each field-boss Treasury has a distinct boss-home entrance rather than a dungeon gate',()=>{
 const genericGate=visualSignature({id:'entrance',kind:'dungeon',family:'crypt',renderKind:'npc'},0),seen=[];
 for(const room of R.supplyRooms){const region=Campaign.data.regions.findIndex(r=>r.id===room.region),sig=visualSignature({id:'supply-entrance',kind:'dungeon',family:room.id,treasury:true,treasuryBoss:room.boss,renderKind:'npc'},region);assert.notEqual(sig,genericGate,room.id+' entrance differs from generic dungeon gate');seen.push(sig);}
 assert.equal(new Set(seen).size,R.supplyRooms.length,'all four Treasury entrances have distinct boss identities');
});
test('completed barracks are rough regional military shelters, not polished houses',()=>{
 const genericByRegion=Campaign.data.regions.map((_,i)=>visualSignature({id:'generic-house',renderKind:'prop',structure:'house',decorative:false},i));
 const finished=Campaign.data.regions.map((_,i)=>visualSignature({id:'barracks',kind:'barracks',renderKind:'building',name:'Barracks',progress:4},i));
 const building=Campaign.data.regions.map((_,i)=>visualSignature({id:'barracks',kind:'barracks',renderKind:'building',name:'Barracks',progress:2},i));
 assert.equal(new Set(finished).size,5,'every region gets a distinct finished barracks design');
 assert.equal(new Set(building).size,5,'every region gets a distinct rough construction state');
 for(let i=0;i<5;i++){assert.notEqual(finished[i],genericByRegion[i],Campaign.data.regions[i].id+' finished barracks does not inherit generic-house body');assert.notEqual(finished[i],building[i],Campaign.data.regions[i].id+' finished barracks evolves from construction without becoming a house');}
});
console.log(passed+' world-aesthetic scenarios passed.');
