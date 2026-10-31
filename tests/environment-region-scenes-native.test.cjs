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
fs.writeFileSync(path.join(out,'scene-index.json'),JSON.stringify({
  purpose:'Issue #708 native Canvas current-site comparison; not GPU or device verification',
  count:scenarios.length,scenes:scenarios,
},null,2)+'\n');
assert.equal(scenarios.length,20);
console.log('PASS #708 20 native Canvas screenshots: 5 regions x (civic twilight/optimization Off-On, field night at 150%, canonical dungeon night); saved state unchanged');
