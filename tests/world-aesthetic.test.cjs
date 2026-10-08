'use strict';
const assert=require('node:assert/strict'),Campaign=require('../src/prototype/engine.js'),R=require('../src/prototype/rules.js'),Visuals=require('../src/prototype/visuals.js');
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
assert.equal(typeof Visuals.atmosphere,'function','procedural renderer exposes the regional atmosphere layer');
let passed=0;function test(name,fn){try{fn();passed++;console.log('PASS '+name);}catch(e){process.exitCode=1;console.error('FAIL '+name+' '+e.stack);}}

for(const [i,region] of Campaign.data.regions.entries())test(region.id+' overworld reads as a settled, natural place',()=>{
 const c=new Campaign(),ok=c.enter(region.id),z=c.zone();assert(ok);assert.equal(z.roadVersion,['frontier','crown'].includes(region.id)?10:9);assert.equal(z.settlementLayoutVersion,3);assert.equal(z.aestheticVersion,4);assert.equal(z.landmarkLayoutVersion,3);assert.equal(z.worldLifeVersion,1);
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
 for(const [i,region] of Campaign.data.regions.entries()){const c=new Campaign();c.enter(region.id);const z=c.zone(),entrance=z.npcs.find(n=>n.id==='entrance');assert.equal(z.destinationLayoutVersion,region.id==='crown'?4:2);assert(distance(entrance,{x:Campaign.data.entrances[i][0],y:Campaign.data.entrances[i][1]})<1,region.id+' dungeon entrance follows expanded geography');if(!R.harbors?.[region.id]&&i<4){const out=z.npcs.find(n=>n.id==='outbound');assert(distance(out,{x:Campaign.data.ports[i][0],y:Campaign.data.ports[i][1]})<1,region.id+' outbound transport follows expanded geography');}}
});

test('Flooded Marches and Ironroot Highlands share a continuous ferry route',()=>{for(const region of ['march','highlands']){const c=new Campaign();c.enter(region);const z=c.zone(),h=R.harbors[region],boat=z.npcs.find(n=>n.harbor);assert(h&&boat,region+' has an authored ferry harbor and boat');assert.equal(z.harborVersion,2);assert(distance(boat,h.boat)<1,region+' boat sits at the authored water berth');assert(!c.blocked(h.arrival.x,h.arrival.y,region),region+' dock arrival is walkable');const waterPoint={x:(h.water.x1+h.water.x2)/2,y:(h.water.y1+h.water.y2)/2};if(distance(waterPoint,h.boat)>45)assert(c.blocked(waterPoint.x,waterPoint.y,region),region+' surrounding harbor water is impassable');assert(c.route(h.arrival,{x:Campaign.data.towns[c.regionIndex()][0],y:Campaign.data.towns[c.regionIndex()][1]}).length,region+' dock connects by foot to town');if(region==='march')assert(z.props.filter(p=>String(p.id).startsWith('harbor-')&&p.structure==='mangrove').length>=3,'March ferry shore is visibly mangrove/swamp authored');}}
);
test('major waterways and ferry waters continue to world boundaries',()=>{const vale=Campaign.rules.barriers[0],valeSize=Campaign.data.regions[0].size;assert.equal(vale.kind,'water');assert.equal(vale.bounds[2],0);assert.equal(vale.bounds[3],valeSize,'Greenwood river reaches both world edges');const march=Campaign.rules.harbors.march,high=Campaign.rules.harbors.highlands;assert(march.water.x2>=Campaign.data.regions[1].size,'Reedport ferry water opens to the eastern world edge');assert(high.water.x1<=0,'Stonecross ferry water opens to the western world edge');});

test('Ironroot wilderness is filled by physical nature rather than terrain panels',()=>{const c=new Campaign();c.enter('highlands');const z=c.zone(),nature=z.props.filter(p=>String(p.id).startsWith('aesthetic-nature-'));assert(nature.length>=70,'Highlands has enough pines, scrub and rocks to read as authored wilderness');assert(nature.some(p=>p.structure==='pine-sapling'));assert(nature.some(p=>p.structure==='rock-cluster'||p.structure==='alpine-scrub'));});

test('retained named landmarks sit beside the world feature their names describe',()=>{
 const vale=new Campaign();vale.enter('vale');let z=vale.zone(),pond=z.npcs.find(n=>n.id==='mill-pond'),water=R.terrain[0].find(p=>p.r);const pondDistance=distance(pond,water);assert(pondDistance>water.r&&pondDistance<water.r+70,'Mill pond marker belongs on the pond shore');
 const frontier=new Campaign();frontier.enter('frontier');z=frontier.zone();const checkpoint=z.npcs.find(n=>n.id==='checkpoint'),warlord=frontier.fieldCenter();assert(checkpoint&&distance(checkpoint,warlord)<220,'Occupied checkpoint belongs to the Ashen Warlord compound');
 const crown=new Campaign();crown.enter('crown');const gate=crown.zone().npcs.find(n=>n.id==='fortress-gate'),apron=R.landforms[4].find(l=>l.kind==='fortress-apron');assert(gate&&apron);assert(distance(gate,{x:apron.x,y:apron.y})<120,'Dark fortress gate belongs to the authored fortress apron');
});

test('Ashen Frontier reads as recovery under a functioning occupation corridor',()=>{
 const c=new Campaign();c.enter('frontier');const z=c.zone(),town={x:Campaign.data.towns[3][0],y:Campaign.data.towns[3][1]},hamlet={x:Campaign.data.minors[3][0],y:Campaign.data.minors[3][1]};
 assert.equal(z.frontierLayoutVersion,3);assert.equal(z.roadVersion,10);
 assert(R.frontierRoutes.length>=5,'Frontier has separate supply, repair, inspection, checkpoint and Bastion routes');
 const routeIds=new Set(R.frontierRoutes.map(r=>r.id));assert.equal(routeIds.size,R.frontierRoutes.length);
 for(const route of R.frontierRoutes){const target={x:route.point[0],y:route.point[1]};assert(c.route(town,target).length,'route '+route.id+' is reachable');assert(z.roads.some(path=>distance(path.at(-1),target)<2),'road network reaches '+route.id);}
 const props=z.props.filter(p=>String(p.id).startsWith('frontier-layout-')),districts=new Set(props.map(p=>p.frontierDistrict));
 for(const id of ['emberwatch-livelihood','burned-hamlet-recovery','roadworks-yard','inspection-yard','checkpoint-support','bastion-cordon'])assert(districts.has(id),id+' has procedural occupation/recovery dressing');
 assert(new Set(props.map(p=>p.structure)).size>=20,'Frontier layout mixes civilian recovery, roadwork and standardized military infrastructure');
 const ember=props.filter(p=>p.frontierDistrict==='emberwatch-livelihood'),burned=props.filter(p=>p.frontierDistrict==='burned-hamlet-recovery'),roadworks=props.filter(p=>p.frontierDistrict==='roadworks-yard'),inspection=props.filter(p=>p.frontierDistrict==='inspection-yard'),checkpointSupport=props.filter(p=>p.frontierDistrict==='checkpoint-support'),cordon=props.filter(p=>p.frontierDistrict==='bastion-cordon');
 assert(ember.some(p=>['market','field-kitchen','woodpile','cart'].includes(p.structure))&&ember.some(p=>p.structure==='watchpost')&&ember.some(p=>p.structure==='patched-fence'),'Emberwatch visibly combines livelihood, repair and occupation control');
 assert(burned.some(p=>['charred-foundation','ash-patch'].includes(p.structure))&&burned.some(p=>['repair-brace','replacement-stakes','stacked-lumber','broken-cart'].includes(p.structure)),'Burned Hamlet pairs visible destruction with visible rebuilding instead of separate generic clutter');
 assert(roadworks.some(p=>['stacked-lumber','wagon-wheel'].includes(p.structure))&&roadworks.some(p=>p.structure==='road-ruts'),'roadworks read as an active transport-repair scene');
 assert(inspection.some(p=>p.structure==='inspection-marker')&&checkpointSupport.some(p=>p.structure==='checkpoint-standard'),'occupation administration repeats standardized authority markers');
 assert(cordon.some(p=>p.structure==='chain'||p.structure==='barricade'||p.structure==='chain-anchor')&&cordon.some(p=>p.structure==='warm-brazier'||p.structure==='supply-stack'||p.structure==='roost'),'Abyss Bastion approach reads as a controlled dragon support/containment zone');
 const traces=props.filter(p=>p.roadTrace);assert(traces.length>=2&&traces.every(p=>p.decorative&&!p.r),'Frontier adds flat road wear/repair traces without adding collision');
 assert(distance(town,hamlet)>650,'Emberwatch and Burned Hamlet remain separate lived-in settlements');
 const field=c.fieldCenter(),bastion=z.npcs.find(n=>n.id==='entrance');assert(distance(field,bastion)>900,'Warlord checkpoint and Abyss Bastion remain separate power centers');
 assert(R.creatureStrongholds.filter(s=>s.region==='frontier').length>=3,'Frontier retains multiple ordinary-monster centers of power');
 assert(R.creatureStrongholds.some(s=>s.region==='frontier'&&s.night&&s.nightSpecies==='stalker'),'night Stalkers retain their own authored hold');
 const overseer=R.roomCaptains['frontier-overseer'];assert(overseer&&overseer.patrol.length>=5,'Cinder Warlord keeps a real inspection circuit through the occupied province');
});

test('Frontier procedural props gain deterministic local variants instead of repeating one identical drawing',()=>{
 const region=3;
 const cartA={id:'frontier-cart-a',renderKind:'prop',decorative:true,structure:'cart'},cartB={id:'frontier-cart-b',renderKind:'prop',decorative:true,structure:'cart'};
 assert.equal(visualSignature(cartA,region),visualSignature(cartA,region),'same prop id renders deterministically');
 const cartVariants=['frontier-cart-a','frontier-cart-b','frontier-cart-c','frontier-cart-d'].map(id=>visualSignature({id,renderKind:'prop',decorative:true,structure:'cart'},region));assert(new Set(cartVariants).size>=2,'Frontier carts vary load/damage detail');
 const houses=['frontier-house-a','frontier-house-b','frontier-house-c','frontier-house-d'].map(id=>visualSignature({id,renderKind:'prop',structure:'frontier-patched-house',r:32},region));assert(new Set(houses).size>=2,'Frontier patched houses vary their repair history');
 const recovery=['road-ruts','road-patch','stacked-lumber','repair-brace','broken-cart','wagon-wheel','charred-foundation','replacement-stakes','patched-fence','inspection-marker','checkpoint-standard','chain-anchor'].map((structure,i)=>visualSignature({id:'frontier-depth-'+i,renderKind:'prop',decorative:true,structure},region));
 assert.equal(new Set(recovery).size,recovery.length,'new recovery/occupation prop families have distinct procedural silhouettes');
});

test('Dark Crown reads as a regime with separate districts and distributed outward routes',()=>{
 const c=new Campaign();c.enter('crown');const z=c.zone(),town={x:Campaign.data.towns[4][0],y:Campaign.data.towns[4][1]};
 assert.equal(z.crownLayoutVersion,1);assert.equal(z.roadVersion,10);assert.equal(z.destinationLayoutVersion,4);
 assert(R.crownRoutes.length>=5,'Crown has several functionally distinct outward/logistics routes');
 const routeIds=new Set(R.crownRoutes.map(r=>r.id));assert.equal(routeIds.size,R.crownRoutes.length);
 for(let a=0;a<R.crownRoutes.length;a++)for(let b=a+1;b<R.crownRoutes.length;b++)assert(distance({x:R.crownRoutes[a].point[0],y:R.crownRoutes[a].point[1]},{x:R.crownRoutes[b].point[0],y:R.crownRoutes[b].point[1]})>500,'Crown routes are not clumped together');
 for(const route of R.crownRoutes){const target={x:route.point[0],y:route.point[1]};assert(c.route(town,target).length,'route '+route.id+' is reachable');assert(z.roads.some(path=>distance(path.at(-1),target)<2),'road network reaches '+route.id);}
 const hubRoutes=R.crownRoutes.filter(r=>r.travelHub),hubs=z.npcs.filter(n=>n.crownTravelHub);assert.equal(hubRoutes.length,4,'four existing Crown route structures support travel');assert.equal(hubs.length,4,'all four route structures expose travel interaction');assert(!z.npcs.some(n=>n.id==='return'),'old single-return transport is replaced by the shared Crown hubs');for(const route of hubRoutes){const hub=hubs.find(n=>n.routeId===route.id);assert(hub,route.id+' has a travel interaction');assert(distance(hub,{x:route.point[0],y:route.point[1]})<2,route.id+' travel interaction stays on the existing route structure');}assert.equal(hubs.filter(n=>!n.interactionOnly).length,1,'only the already-visible dragon adds a transport vehicle; other hubs reuse their existing structures');
 const props=z.props.filter(p=>String(p.id).startsWith('crown-layout-')),districts=new Set(props.map(p=>p.crownDistrict));
 for(const id of ['labor-quarter','citadel-command','cindermaw-domain','fortress-logistics','fortress-approach'])assert(districts.has(id),id+' has procedural district dressing');
 const composed=['crown-levy-yard','crown-command-post','ashbeast-roost-scene','crown-logistics-bay','crown-fortress-checkpoint'],authored=R.crownDistricts.flatMap(d=>d.props.map(p=>p[2]));for(const structure of composed)assert(authored.includes(structure),structure+' is authored as a composed Crown scene');assert(props.filter(p=>composed.includes(p.structure)).length>=3,'road clearance still leaves several large composed Crown scenes visible');assert(props.length<28,'Crown composition pass reduces loose district prop count instead of increasing density');
 const citadel=z.npcs.find(n=>n.id==='entrance'),cinder=c.fieldCenter(),gate=z.npcs.find(n=>n.id==='fortress-gate');assert(distance(citadel,cinder)>600,'Citadel and Cindermaw read as separate power centers');assert(distance(cinder,gate)>1000,'Cindermaw territory does not collapse into the fortress approach');
 assert(R.creatureStrongholds.filter(s=>s.region==='crown').length>=3,'Crown has multiple ordinary-monster/military centers of power');
});


function visualSignature(entity,region){
 const log=[],target={};const ctx=new Proxy(target,{get(o,p){if(p in o)return o[p];return (...args)=>{log.push([String(p),...args.map(v=>typeof v==='number'?Math.round(v*100)/100:v)]);};},set(o,p,v){o[p]=v;log.push(['set',String(p),v]);return true;}});
 Visuals.draw(ctx,entity,{x:0,y:0},region,false);return JSON.stringify(log);
}
test('actual occupied side entrances and main dungeons have distinct geometry without mutating campaign state',()=>{
 const c=new Campaign(),sideShapes=[],mainShapes=[];
 const geometry=(entity,region)=>JSON.stringify(JSON.parse(visualSignature(entity,region)).filter(op=>op[0]!=='set'));
 for(const side of R.sideDungeons){
  c.enter(side.region);const entrance=c.zone().npcs.find(n=>n.sideDungeon&&n.family===side.id);assert(entrance,side.id+' is instantiated as an occupied entrance');
  const entity={...entrance,renderKind:'npc'},before=JSON.stringify(c.s),sig=geometry(entity,c.regionIndex());
  assert.equal(geometry(entity,c.regionIndex()),sig,'same entrance renders deterministically');
  assert.equal(JSON.stringify(c.s),before,'drawing cannot change the campaign');sideShapes.push(sig);
 }
 for(const boss of Campaign.data.bosses.filter(b=>b.kind==='dungeon')){
  c.enter(boss.region);const entrance=c.zone().npcs.find(n=>n.kind==='dungeon'&&n.family===boss.id);assert(entrance,boss.id+' is instantiated as a main entrance');mainShapes.push(geometry({...entrance,renderKind:'npc'},c.regionIndex()));
 }
 assert.equal(new Set(sideShapes).size,5,'side entrances differ in geometry, independent of palette');
 assert.equal(new Set(mainShapes).size,5,'main entrances differ in geometry, independent of palette');
 const exit=geometry({renderKind:'npc',kind:'exit'},0);assert(!sideShapes.includes(exit),'occupied interiors do not fall back to the generic exit gate');
 const stages=[.5,1.5,2.5,3.5].map(progress=>geometry({renderKind:'building',kind:'barracks',progress},0));
 assert.equal(new Set(stages).size,4,'unfinished camp visibly advances before completion');
});
test('Abyss Bastion procedural props and authored partitions are visually distinct',()=>{
 assert.equal(typeof Visuals.dungeonArchitecture,'function','renderer exposes authored dungeon partition geometry');
 const region=3,structures=['flight-planning-table','feed-crate','flight-harness-station','scorched-floor','egg-cradle','feeding-trough','carcass-rack','claw-scrape','royal-launch-platform','royal-flight-standard'];
 const signatures=structures.map((structure,i)=>visualSignature({id:'abyss-prop-'+i,renderKind:'prop',decorative:true,structure},region));
 assert.equal(new Set(signatures).size,structures.length,'Abyss service, containment and dragon-life props have distinct silhouettes');
 for(const structure of ['chain','roost','hatchery','bone-pile']){const variants=Array.from({length:8},(_,i)=>visualSignature({id:'abyss-'+structure+'-'+i,renderKind:'prop',decorative:true,structure},region));assert(new Set(variants).size>=2,structure+' gains deterministic Frontier/Abyss variation');}
});
test('military Ringleaders read as officers without changing body scale',()=>{
 for(const species of ['orc','archer','crownguard']){
  const base={id:'rank-'+species,species,name:species,renderKind:'enemy',type:'mob',form:'normal',ranged:species!=='orc'},lead={...base,form:'ringleader'};
  assert.equal(Visuals.height(base),Visuals.height(lead),species+' hierarchy must not use size inflation');
  assert.notEqual(visualSignature(base,species==='crownguard'?4:3),visualSignature(lead,species==='crownguard'?4:3),species+' Ringleader has officer-specific hierarchy cues');
 }
});
test('Citadel composition continues into an irregular military fortress',()=>{
 const c=new Campaign();c.enter('citadel');const z=c.zone(),decor=z.props.filter(p=>String(p.id).startsWith('decor-')),required=['citadel-muster','citadel-command','citadel-ritual-array','citadel-barracks-bay','citadel-forge-bay','citadel-boss-approach'],architecture=R.dungeonArchitecture.citadel;
 assert.equal(z.enemies.filter(e=>e.guard&&e.form==='normal').length,R.dungeonGuardFormations.citadel.length,'Citadel uses its authored military formation quota');
 assert.equal(R.dungeonGuardFormations.citadel.length,32,'Citadel has more rewardless defenders without changing the regional field population');
 assert.equal(R.dungeonTraps.citadel.length,28,'Citadel trap systems expand with the fortress while retaining safe alternatives');
 assert(architecture.walkable.length>=6&&architecture.partitions.length>=4,'Citadel uses multiple overlapping wings and internal gates instead of the legacy single divider');
 const bounds=architecture.walkable.map(a=>a.bounds.join(','));assert(new Set(bounds).size===architecture.walkable.length,'Citadel wings have distinct footprints');
 assert(c.blocked(700,180,'citadel',12)&&!c.blocked(300,300,'citadel',12)&&!c.blocked(1180,1200,'citadel',12),'Citadel footprint is visibly irregular rather than one full rectangular floor');
 for(const structure of required)assert(decor.some(p=>p.structure===structure),structure+' is present');
 assert(decor.length<=8,'Citadel uses composed stations instead of dozens of loose decorations');
});
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
test('Basic and Full Barracks are distinct cozy regional expedition camps, not shops or houses',()=>{
 const genericByRegion=Campaign.data.regions.map((_,i)=>visualSignature({id:'generic-house',renderKind:'prop',structure:'house',decorative:false},i));
 const construction=Campaign.data.regions.map((_,i)=>visualSignature({id:'barracks-building',kind:'barracks',renderKind:'building',name:'Barracks',progress:2,full:false},i));
 const basic=Campaign.data.regions.map((_,i)=>visualSignature({id:'barracks-basic',kind:'barracks',renderKind:'building',name:'Barracks',progress:4,full:false},i));
 const full=Campaign.data.regions.map((_,i)=>visualSignature({id:'barracks-full',kind:'barracks',renderKind:'building',name:'Barracks',progress:4,full:true},i));
 assert.equal(new Set(construction).size,5,'every region keeps a distinct camp-construction state');
 assert.equal(new Set(basic).size,5,'every region gets a distinct Basic camp');
 assert.equal(new Set(full).size,5,'every region gets a distinct Full expedition base');
 for(let i=0;i<5;i++){
  const id=Campaign.data.regions[i].id;
  assert.notEqual(basic[i],genericByRegion[i],id+' Basic Barracks is a camp rather than a house/shop body');
  assert.notEqual(full[i],genericByRegion[i],id+' Full Barracks remains a camp rather than becoming a house/shop body');
  assert.notEqual(basic[i],construction[i],id+' Basic camp visibly completes construction');
  assert.notEqual(full[i],basic[i],id+' Full Barracks visibly expands the Basic camp');
 }
});
console.log(passed+' world-aesthetic scenarios passed.');
