'use strict';
// Phase 1 bounded art regression: every burned woodland tree remains its own
// stable, rooted shape; new growth stays attached across Canvas and Pixi's
// shared procedural-paint path. No world positions, colliders or saves change.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {createCanvas} = require('@napi-rs/canvas');
const V = require('../src/prototype/visuals.js');
function paint(id, region, variant) {
  const canvas = createCanvas(180, 180);
  const ctx = canvas.getContext('2d');
  const e = { id, structure: variant || 'dead-tree', renderKind:'prop',
    decorative:true, x:620, y:1080 };
  const before = JSON.stringify(e);
  V.draw(ctx,e,{x:90,y:134},region,false);
  assert.equal(JSON.stringify(e),before,'No entity mutation or save state changes');
  const pixels = ctx.getImageData(0,0,canvas.width,canvas.height).data;
  const sha = crypto.createHash('sha256').update(pixels).digest('hex');
  const xs=[],ys=[];
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)
    if(pixels[(y*canvas.width+x)*4+3]>18){xs.push(x);ys.push(y);}
  assert(xs.length>500,'Expected a real visible tree '+id+' in '+region);
  return {sha, bbox:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]};
}
const ids=Array.from({length:16},(_,i)=>'frontier-burned-tree-identity-'+i);
const frontier=ids.map(id=>paint(id,3));
assert.equal(new Set(frontier.map(s=>s.sha)).size,ids.length,
  'Different authored burned trees must not be a single stamped silhouette');
assert(frontier.every(x=>x.bbox[2]-x.bbox[0]>30 && x.bbox[3]-x.bbox[1]>36),
  'Even small trees need coherent rooted crowns/branches at gameplay scale');
for(let i=0;i<ids.length;i++)
  assert.deepEqual(paint(ids[i],3),frontier[i],
    'Identity-stable burned-tree drawing cannot vary between frames');
assert.equal(paint(ids[0],2).sha,paint(ids[1],2).sha,
  'Only Frontier dead-tree rendering may change; other-region silhouettes remain original');
assert.equal(paint(ids[0],3,'dead-shrub').sha,paint(ids[1],3,'dead-shrub').sha,
  'Short dead-shrub family remains original outside the tree-craft scope');
console.log('PASS Phase 1 Frontier: 16 stable distinct burned-tree silhouettes, rooted/nonmutating, other-region and shrub boundaries retained');
