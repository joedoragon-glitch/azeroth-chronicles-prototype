'use strict';
// Owner-authorized narrow source/geometry and native-render visual review.
// This does not certify the overall world, stored saves, or device performance.
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto');
const {createCanvas}=require('@napi-rs/canvas'),sharp=require('sharp');
const C=require('../src/prototype/engine.js');
const Renderer=require('../src/prototype/renderer.js');
const V=require('../src/prototype/visuals.js');
const FX=require('../src/prototype/combat-visuals.js');
const {rng}=require('../tools/greenwood-layout/fixtures.cjs');
const D=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const xy=p=>({x:+p.x.toFixed(2),y:+p.y.toFixed(2)});
function record(z) {
 const indexed={};
 for(const name of ['props','npcs','buildings']){
  indexed[name]={};const seen={};
  for(const p of z[name]){
   const id=String(p.id||p.structure||p.kind||'unknown');
   const key=id+'#'+(seen[id]=(seen[id]||0)+1);
   indexed[name][key]=xy(p);
  }
 }
 return {roads:z.roads.map(r=>JSON.stringify(r)),indexed};
}
function delta(a,b){
 const old=new Set(a.roads),add=b.roads.filter(r=>!old.has(r)).map(r=>JSON.parse(r));
 const moved=[];
 for(const type of ['props','npcs','buildings'])
  for(const [id,p] of Object.entries(a.indexed[type])){
   const q=b.indexed[type][id];
   if(q&&D(p,q)>.02)moved.push({type,id,from:p,to:q,units:+D(p,q).toFixed(2)});
  }
 return {oldRoads:a.roads.length,newRoads:b.roads.length,
  added:add.map(r=>({start:xy(r[0]),end:xy(r.at(-1)),points:r.length,
   length:+r.reduce((s,p,i)=>s+(i?D(p,r[i-1]):0),0).toFixed(2)})),
  moved,counts:Object.fromEntries(['props','npcs','buildings'].map(t=>[t,moved.filter(x=>x.type===t).length]))};
}
function capture(g,t){
 const canvas=createCanvas(760,465),ctx=canvas.getContext('2d'),hero={...g.hero},clock=g.s.clock;
 Object.assign(g.hero,g.safe(t.x,t.y,g.s.zone));g.s.clock=120;g.updateNight();
 const snapshot=JSON.stringify(g.snapshot());
 Renderer.create({canvas,ctx,getGame:()=>g,
  platform:{cameraZoom:1.5,cameraAnchor:(w,h)=>({x:w*.5,y:h*.58})},
  Campaign:C,PrototypeVisuals:V,PrototypeCombatVisuals:FX,now:()=>16000,
  chargePresentation:()=>null,isPaused:()=>false}).draw();
 assert.equal(JSON.stringify(g.snapshot()),snapshot,'renderer must not mutate saved state');
 Object.assign(g.hero,hero);g.s.clock=clock;g.updateNight();
 return canvas.toBuffer('image/png');
}
async function sheet(region,pics){
 const layers=[],width=1520,height=1000;
 for(let i=0;i<4;i++){
  layers.push({input:pics[i].png,left:(i%2)*760,top:35+Math.floor(i/2)*500});
  const label=pics[i].label;
  layers.push({input:Buffer.from('<svg width="760" height="35"><rect width="760" height="35" fill="#ecebe5"/><text x="12" y="24" font-size="18" font-family="sans-serif" fill="#18251d">'+label+'</text></svg>'),
   left:(i%2)*760,top:Math.floor(i/2)*500});
 }
 const webp=await sharp({create:{width,height,channels:4,background:'#ecebe5'}})
  .composite(layers).webp({quality:68,effort:3}).toBuffer();
 console.log('REGIONAL_VISUAL '+region+' '+webp.toString('base64'));
}
(async()=>{
 console.log('WORLD_SHA256 '+crypto.createHash('sha256')
  .update(fs.readFileSync(require.resolve('../src/prototype/world.js'))).digest('hex'));
 for(const [i,region] of ['march','highlands','frontier','crown'].entries()){
  const g=new C('normal','paladin',rng(0x1c001d00+i));g.enter(region);
  const z=g.zone(),k=g.regionIndex();
  assert.equal(z.finalStreetClearanceVersion,undefined,
   region+' candidate should not execute the extra network sweep');
  const t=C.data.towns[k],m=C.data.minors[k],town={x:t[0],y:t[1]},hamlet={x:m[0],y:m[1]};
  if(region==='highlands') {
    const rest=z.npcs.find(n=>n.id==='rest');
    const candidates=[];
    const R=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y);
    const old={x:rest.x,y:rest.y};
    for(let x=old.x-420;x<=old.x+420;x+=20)
      for(let y=old.y-420;y<=old.y+420;y+=20){
        const p={x,y},setback=g.distanceToRoad(z,p);
        if(setback<190||Math.min(x,y,3400-x,3400-y)<115)continue;
        if(g.blocked(x,y,region,Math.max(12,(rest.r||0)+9),true))continue;
        if(z.props.some(q=>R(q,p)<(q.r||0)+(rest.r||0)+(q.decorative?26:29)))continue;
        if(z.npcs.some(q=>q!==rest&&R(q,p)<Math.max(96,(['rest','minor'].includes(q.id)?82:42)+36)))continue;
        if(z.buildings.some(q=>R(q,p)<165))continue;
        if(z.nodes.some(q=>R(q,p)<(rest.r||0)+55))continue;
        if(z.enemies.some(q=>q.hp>0&&R(q.home||q,p)<(rest.r||0)+145))continue;
        const neighbor=R(p,town),distance=R(p,old);
        if(neighbor>=460)continue;
        candidates.push({x,y,travel:+distance.toFixed(2),road:+setback.toFixed(2),neighborhood:+neighbor.toFixed(2)});
      }
    candidates.sort((a,b)=>a.travel-b.travel||a.neighborhood-b.neighborhood);
    console.log('HIGHLANDS_REFUGE_CHOICES '+JSON.stringify({old,candidates:candidates.slice(0,20),total:candidates.length}));
  }
  const a=record(z),preTown=capture(g,town),preHamlet=capture(g,hamlet);
  // The released dev.233 extra pass is gone. Even an old caller supplying
  // the former second argument must not add streets or relocate anything.
  g.clearStreetCorridors(z,true);
  g.zone();
  const b=record(z),postTown=capture(g,town),postHamlet=capture(g,hamlet);
  assert.deepEqual(b,a,region+' revisiting a restored region must not modify roads or object locations');
  console.log('REGIONAL_STABILITY '+JSON.stringify({region,...delta(a,b)}));
  await sheet(region,[
    {label:region+' - restored town, initial view',png:preTown},
    {label:region+' - restored town, repeated view',png:postTown},
    {label:region+' - restored hamlet, initial view',png:preHamlet},
    {label:region+' - restored hamlet, repeated view',png:postHamlet}
  ]);
 }
 console.log('PASS native original-region scenery stable after old-call and repeat access');
})().catch(e=>{console.error(e);process.exitCode=1;});