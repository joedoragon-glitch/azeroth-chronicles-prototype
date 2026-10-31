'use strict';
// Phase 1: audit the REAL retained-sprite overlay path (Renderer draws the
// approved raster and calls frontierTreeShoots(..., raster=true)). We neither
// rewrite the accepted tree image nor move or mutate the gameplay entity.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {createCanvas} = require('@napi-rs/canvas');
const V = require('../src/prototype/visuals.js');
function paint(id, region, raster=true) {
  const canvas=createCanvas(180,180),ctx=canvas.getContext('2d');
  const e={id,structure:'dead-tree',renderKind:'prop',decorative:true,x:620,y:1080};
  const before=JSON.stringify(e);
  V.frontierTreeShoots(ctx,e,{x:90,y:134},region,raster);
  assert.equal(JSON.stringify(e),before,'Read-only drawing must not modify the game');
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  const sha=crypto.createHash('sha256').update(pixels).digest('hex');
  const xs=[],ys=[];
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)
    if(pixels[(y*canvas.width+x)*4+3]>18){xs.push(x);ys.push(y);}
  if(region===3) {
    assert(xs.length>50,'Frontier requires a genuine painted attached-sprout overlay '+id+'; pixels='+xs.length);
    assert(Math.max(...xs)-Math.min(...xs)>24,
      'Fresh shoots must remain spaced over the two established trunk branches');
    assert(Math.max(...ys)-Math.min(...ys)>16,
      'Attached shoots need vertical shape and not a single dot');
  } else assert.equal(xs.length,0,'No unrelated region should acquire Frontier growth');
  return sha;
}
const ids=Array.from({length:16},(_,i)=>'frontier-burned-tree-identity-'+i);
const unique=ids.map(id=>paint(id,3,true));
assert.equal(new Set(unique).size,16,
  'Existing retained trees must carry visibly distinct, identity-seeded sprout variants');
for(let i=0;i<ids.length;i++)
  assert.equal(paint(ids[i],3,true),unique[i],'Sprout shape must remain deterministic across frames');
const nonRaster=paint(ids[0],3,false);
assert.equal(nonRaster,paint(ids[0],3,false),'Procedural fallback is unchanged and stable');
assert.equal(paint(ids[0],2,true),paint(ids[1],2,true),
  'No sprout overlay in Ironroot or other regions');
console.log('PASS Phase 1: 16 identity-stable real retained-sprite Frontier sprout overlays, other regions untouched, read-only render');
