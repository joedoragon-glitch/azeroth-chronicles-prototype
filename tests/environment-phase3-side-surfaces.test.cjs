'use strict';
// Phase 3: all five established side interiors must have legible DIFFERENT
// material treatment and context-aware original pillars, while original zone
// identity, enemies, nav geometry and approved artwork remain untouched.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {createCanvas}=require('@napi-rs/canvas');
const V=require('../src/prototype/visuals.js');
const C=require('../src/prototype/engine.js');
const sides=C.rules.sideDungeons;
assert.equal(sides.length,5,'Mandatory five inhabited side interiors');
const sha=(ctx,w,h)=>crypto.createHash('sha256').update(ctx.getImageData(0,0,w,h).data).digest('hex');
function tile(id,region,materials=null){
  const w=520,h=240,canvas=createCanvas(w,h),ctx=canvas.getContext('2d');
  for(let k=0;k<8;k++)V.floor(ctx,{x:75+k*48,y:70+(k%3)*54},k*80,Math.floor(k/3)*80,region,false,id,false,materials);
  return {hash:sha(ctx,w,h),bytes:ctx.getImageData(0,0,w,h).data};
}
function pillar(theme,region){
  const w=180,h=180,canvas=createCanvas(w,h),ctx=canvas.getContext('2d');
  const p={id:'side-wall-0',renderKind:'prop',structure:'pillar',
    decorative:false,householdPartition:theme,r:28,x:500,y:500};
  const before=JSON.stringify(p);
  V.draw(ctx,p,{x:90,y:110},region,false);
  assert.equal(JSON.stringify(p),before,'Material drawing never changes save/state');
  const data=ctx.getImageData(0,0,w,h).data;
  assert(data.some((v,j)=>j%4===3&&v>64),'Real old pillar silhouette still drawn');
  return sha(ctx,w,h);
}
const ids=[],tileHashes=[],pillarHashes=[];
for(const [i,side] of sides.entries()){
  const index=C.data.regions.findIndex(x=>x.id===side.region);
  assert(index>=0);
  const finished=tile(side.id,index),base=tile('',index);
  let changed=0;for(let j=0;j<finished.bytes.length;j+=4)
    if(Math.max(Math.abs(finished.bytes[j]-base.bytes[j]),
      Math.abs(finished.bytes[j+1]-base.bytes[j+1]),
      Math.abs(finished.bytes[j+2]-base.bytes[j+2]))>7)changed++;
  assert(changed>1000,'Actual tile color/art improvement must be visible in '+side.name);
  ids.push(side.id);tileHashes.push(finished.hash);
  pillarHashes.push(pillar(side.theme,index));
  const g=new C('normal','paladin',()=>0.73);assert(g.enter(side.id));
  const z=g.zone(),walls=z.props.filter(p=>p.id.startsWith('side-wall-'));
  assert(walls.length>=6 && walls.every(p=>p.r===28 && (p.structure==='pillar' || (side.id==='side-vale-cellars' && p.structure==='cellar-pier'))),
    'Original solid columns, including Greenwood-specific cellar piers, and collision remain present in '+side.name);
  assert(walls.some(p=>p.householdPartition===side.theme),
    'Original occupied-wall alcove receives its true theme in '+side.name);
  assert(z.enemies.filter(e=>e.hp>0).every(e=>e.species===side.species),
    'No new enemy types/bosses are introduced in '+side.name);
  const save=g.snapshot(),reload=C.restore(save);reload.enter(side.id);
  assert.deepEqual(reload.zone().props.map(p=>[p.id,p.x,p.y,p.r,p.structure]),
    z.props.map(p=>[p.id,p.x,p.y,p.r,p.structure]),
    'Side aesthetic finish must not move original solid walls or furnishings');
}
assert.equal(new Set(ids).size,5);
assert.equal(new Set(tileHashes).size,5,'Each existing side interior floor visually distinct');
assert.equal(new Set(pillarHashes).size,5,'Each worn masonry palette visually distinct');
console.log('PASS Phase 3: 5 distinct side-dungeon floors and low walls, 5 original rosters/layouts/save re-entry preserved');
