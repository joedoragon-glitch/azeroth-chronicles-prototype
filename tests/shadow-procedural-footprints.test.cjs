'use strict';
// #893: real five-region Campaign samples, original Canvas procedural artist.
// Read-only census; pixel alpha is NOT a definitive physical-footprint verdict.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Visuals = require('../src/prototype/visuals.js');
const Renderer = require('../src/prototype/renderer.js');

const root = path.resolve(__dirname, '..');
const out = path.resolve(process.env.SHADOW_AUDIT_OUT || path.join(root, 'test-artifacts/shadow-893'));
fs.mkdirSync(out, { recursive: true });
const campaign = new Campaign('normal', 'paladin', () => 0.73);
const canvas = createCanvas(576, 576), ctx = canvas.getContext('2d');
const anchor = { x: 288, y: 460 };
const painter = Renderer.create({
  canvas: { width: 912, height: 600 },
  ctx: {},
  getGame: () => campaign,
  platform: { cameraZoom: 1 },
  Campaign,
  PrototypeVisuals: Visuals,
  PrototypeSprites: { definitionFor: () => null },
  PrototypeCombatVisuals: {},
  chargePresentation: () => null,
  isPaused: () => false,
});
const sites = ['vale','march','highlands','frontier','crown'];
const records = [], coverage = {}, unknown = [];
function signature(item, kind, region) {
  const fields = ['renderKind','structure','greenwoodNature','highlandsNature','frontierScene',
    'crownScene','greenwoodFacility','miningFacility','kind','type','family','species','form',
    'petFamily','greenwoodInteriorAsset','greenwoodWall','presentation','highlandsLandscape',
    'icon','crowned'];
  const identity = fields.map(f => [f,item[f]]).filter(([,v]) => v !== undefined);
  // Exclude instance IDs/coordinates/health: the census samples each distinct
  // visible *art family*, not every repeated tree along a road.
  return JSON.stringify([region,kind,identity]);
}
function summarize(rgba, threshold) {
  let left=576, right=-1, top=576, bottom=-1, occupied=0, bandMin=576, bandMax=-1, band=0;
  for(let y=0;y<576;y++) for(let x=0;x<576;x++) {
    if(rgba[(y*576+x)*4+3]<threshold) continue;
    occupied++;
    if(x<left)left=x;if(x>right)right=x;
    if(y<top)top=y;if(y>bottom)bottom=y;
    if(Math.abs(y-anchor.y)<=5) {band++;if(x<bandMin)bandMin=x;if(x>bandMax)bandMax=x;}
  }
  return {alphaCutoff:threshold, occupiedPixels:occupied,
    bbox:occupied?[left,top,right,bottom]:null,
    nearAnchorWidth:bandMax<bandMin?0:bandMax-bandMin+1,
    nearAnchorPixels:band,
    croppedAtRasterEdge:occupied>0 && (left===0||top===0||right===575||bottom===575)};
}
let reviewed = 0;
for(const region of sites) {
  assert(campaign.enter(region), 'Native region admission failed: '+region);
  const z=campaign.zone();
  const entries = [
    ...(z.props||[]).map(v=>[v,'prop']),
    ...(z.buildings||[]).map(v=>[v,'building']),
    ...(z.enemies||[]).filter(v=>v.hp>0).map(v=>[v,'enemy']),
    ...(z.npcs||[]).map(v=>[v,'npc']),
    ...(z.nodes||[]).map(v=>[v,'node']),
  ];
  const census = new Map();
  for(const [raw,kind] of entries) {
    const key = signature(raw,kind,region);
    const bucket=census.get(key);
    if(bucket) {bucket.instances++;continue;}
    census.set(key,{raw,kind,instances:1});
  }
  coverage[region]={originalEntities:entries.length,distinctNativeArtSignatures:census.size};
  for(const [signatureKey,{raw,kind,instances}] of census) {
    const sourceJSON=JSON.stringify(raw);
    let error=null, visual=null, alpha16=null, alpha64=null, ellipse=null;
    try {
      visual=painter.presentEntity(raw,kind);
      ellipse=painter.groundPresentation(visual);
      ctx.clearRect(0,0,576,576);
      Visuals.draw(ctx,visual,anchor,sites.indexOf(region),!!campaign.s.rescued[raw.family]);
      const rgba=ctx.getImageData(0,0,576,576).data;
      alpha16=summarize(rgba,16);
      alpha64=summarize(rgba,64);
    } catch(err) {error=String(err?.message||err).slice(0,240);}
    assert.equal(JSON.stringify(raw),sourceJSON, 'Painter mutated original Campaign entity: '+String(raw.id));
    const record={region,kind,id:raw.id||null,structure:raw.structure||null,
      family:raw.family||null,type:raw.type||null,species:raw.species||null,
      instances,signature:signatureKey,shadow:ellipse
        ? {rx:ellipse.rx,ry:ellipse.ry,opacity:ellipse.shadowOpacity}
        : null,alpha16,alpha64,error};
    if(error || (alpha16?.occupiedPixels===0 && (ellipse?.shadowOpacity||0)>0))unknown.push(record);
    records.push(record);
    reviewed++;
  }
}
const canary=records.find(r=>r.id==='stronghold-wolf-packhold-prop-0');
assert(canary && canary.alpha16?.occupiedPixels>500,
  'The native wolf-den stronghold prop must be visibly grounded');
const output={
  issue:893,baseline:process.env.GITHUB_SHA||'local-checkout',
  note:'Measurements of one live instance per unique region/visual signature, not all entities or every animation frame. Does not assign defect verdicts from simple alpha geometry.',
  limitations:[
    'Each group may contain scale/state variants; inspect actual gameplay screenshots for representative height/feet',
    'Painted ground, airborne bodies, shadows, decorative/flat records and hidden visual states require artistic classification',
    'Raster boundaries can clip large structures and do not include registered raster art adapter output',
    'Source visual errors and painted-alpha empty objects are investigation leads, not automatically approved changes',
    'No player playthrough or mobile-device acceptance implied',
  ],
  coverage,inspectedSignatures:reviewed,unknownCount:unknown.length,
  candidates:unknown.map(r=>({region:r.region,kind:r.kind,id:r.id,structure:r.structure,
    instances:r.instances,shadow:r.shadow,error:r.error,occupied:r.alpha16?.occupiedPixels||0})),
  records,
};
fs.writeFileSync(path.join(out,'procedural-footprints.json'),JSON.stringify(output,null,2)+'\n');
console.log('PASS #893 procedural native artist census: '+reviewed+' unique five-region samples; '+
  unknown.length+' blank/error candidates preserved for review, wolf-den painted; no game/save mutation');
