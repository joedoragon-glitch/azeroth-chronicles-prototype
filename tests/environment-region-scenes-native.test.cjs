'use strict';
// Issue #708 V2: screenshots rendered with the original Campaign and Canvas2D
// implementation, not concept art or hand-painted placeholders. No game edits.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {createCanvas} = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Renderer = require('../src/prototype/renderer.js');
const Visuals = require('../src/prototype/visuals.js');
const Combat = require('../src/prototype/combat-visuals.js');
const out = path.join(__dirname, '..', 'test-artifacts', 'environment-708', 'native');
fs.mkdirSync(out, {recursive: true});
const scenarios = [];
const width=880,height=560;
function capture(game, context, zoom=1, optimized=false){
  const canvas=createCanvas(width,height);
  const ctx=canvas.getContext('2d');
  const before=JSON.stringify(game.s);
  const painter=Renderer.create({
    canvas:{width,height},ctx,getGame:()=>game,
    platform:{cameraZoom:zoom,cameraAnchor:(w,h)=>({x:w*.56,y:h*.52})},
    Campaign,PrototypeVisuals:Visuals,PrototypeCombatVisuals:Combat,
    chargePresentation:()=>null,isPaused:()=>false,now:()=>16000,
  });
  painter.setOptimizationMode(optimized);
  painter.draw();
  assert.equal(JSON.stringify(game.s),before,
    'Renderer altered saved campaign in '+context);
  const bytes=canvas.toBuffer('image/png');
  assert(bytes.length>10000,'Expected actual painted region '+context);
  const pix=ctx.getImageData(0,0,width,height).data;
  let opaque=0;
  for(let j=3;j<pix.length;j+=4) if(pix[j]>32)opaque++;
  assert(opaque>width*height*.8,'Expected visible world rather than empty overlay');
  const filename=context+'.png';
  fs.writeFileSync(path.join(out,filename),bytes);
  scenarios.push({scene:context,zone:game.zoneId,
    region:game.definition().name,phase:game.daylightPhase().phase,
    clock:game.s.clock,zoom,optimized,hero:{x:game.hero.x,y:game.hero.y},
    bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
  return bytes;
}
for(let i=0;i<Campaign.data.regions.length;i++){
  const region=Campaign.data.regions[i].id;
  const game=new Campaign('normal','paladin',()=>.73);
  assert(game.enter(region),'Could not enter current canon region '+region);
  game.s.clock=345;
  const city=capture(game,region+'-civic-sunset',1,false);
  const opt=capture(game,region+'-civic-sunset-opt-on',1,true);
  assert(!city.equals(opt),
    'Optimization Mode must remove optional atmosphere in '+region);
  game.s.clock=480;
  const center=game.fieldCenter(i);
  Object.assign(game.hero,center);
  capture(game,region+'-field-night-zoom150',1.5,false);
  const dungeon=Campaign.data.bosses.find(b=>b.kind==='dungeon'&&b.region===region);
  assert(dungeon,'Missing authored dungeon for '+region);
  assert(game.enter(dungeon.id),'Could not enter existing '+dungeon.id);
  capture(game,region+'-dungeon-night',1,false);
}
// V2 locality supplement: these are current authored geographic anchors, not
// invented environmental recipes, relocated game props or a new art direction.
// Multiple views are essential: one generic settlement screenshot cannot prove
// what ash/sparks/dust look like in a separately authored district.
const localitySites = [
  {region:'vale',sites:[
    ['orchard-hamlet',550,1750,345,'Greenwood current rebuilt Orchard Hamlet'],
    ['winter-estate-approach',2830,2850,480,'Forest Crypt unfinished winter-estate approach'],
    ['woodland-den',920,2880,480,'Thornfang territory / occupied Greenwood'],
  ]},
  {region:'march',sites:[
    ['archive-banks',500,2350,345,'Sunken Archive receiving/restoration bank'],
    ['lantern-shore',1880,2600,480,'Lantern Wraith shore and ferry'],
    ['mirejaw-wetland',2180,1120,345,'Mirejaw wetland'],
  ]},
  {region:'highlands',sites:[
    ['silver-ore-road',650,390,345,'Stonecross silver working; dust plausibly local'],
    ['autumn-wolf-hollow',480,1010,345,'Autumn hardwood wolf habitat'],
    ['ogre-hearth',940,3010,480,'Ogre household, not a lifeless quarry'],
  ]},
  {region:'frontier',sites:[
    ['recovering-poppy-ground',920,2120,345,'Frontier recovering poppy/young-tree ground'],
    ['burned-crossing',1450,2160,345,'Burned forest crossing with actual scars'],
    ['occupied-checkpoint',2600,1650,480,'Warlord occupied checkpoint'],
  ]},
  {region:'crown',sites:[
    ['labor-quarter',720,900,345,'Crownwatch inhabited worker district'],
    ['thermal-services',2030,2640,480,'Authored recovery-heat / industrial services'],
    ['ruined-foundry',1850,2700,345,'Ruined Foundry industrial hazard area'],
  ]},
];
for (const item of localitySites) {
  const game = new Campaign('normal','paladin',()=>.73);
  assert(game.enter(item.region),'Could not inspect locality in '+item.region);
  for (const [id,x,y,clock,context] of item.sites) {
    // Reposition ONLY this isolated test Campaign camera. No world/save edit
    // and no inference that the selected coordinate is a walkable player route.
    game.s.clock=clock;
    Object.assign(game.hero,{x,y});
    const point={x,y};
    const nearby=(objects)=> (objects||[])
      .filter(o=>Number.isFinite(o.x)&&Number.isFinite(o.y))
      .map(o=>({id:String(o.id||''),name:String(o.name||''),
        kind:String(o.kind||''),structure:String(o.structure||''),
        role:String(o.sceneRole||''),distance:Math.round(Math.hypot(o.x-x,o.y-y))}))
      .filter(o=>o.distance<=450).sort((a,b)=>a.distance-b.distance).slice(0,12);
    capture(game,item.region+'-local-'+id,1,false);
    scenarios[scenarios.length-1].authoredLocality={
      context,source:'current src/prototype/rules.js, data.js and current regional landscape',
      cameraTarget:point,nearbyProps:nearby(game.zone().props),
      nearbyNPCs:nearby(game.zone().npcs),
      interpretation:'Visual locality evidence only; no aesthetic approval or renderer parity claim',
    };
  }
}
fs.writeFileSync(path.join(out,'scene-index.json'),JSON.stringify({
  purpose:'Issue #708 native Canvas current-site comparison; not GPU or device verification',
  count:scenarios.length,scenes:scenarios,
},null,2)+'\n');
assert.equal(scenarios.length,35);
console.log('PASS #708 35 native Canvas screenshots: original 20 plus 15 site-specific current-canon localities, with proximity evidence; saved state unchanged');
