'use strict';
// Issue #708: functional-only test of the original time-based water/lava shimmer.
// Does NOT change terrain, artistic quality, palettes, camera or performance.
const assert=require('node:assert/strict');
const {createCanvas}=require('@napi-rs/canvas');
const Game=require('../src/prototype/engine.js');
const V=require('../src/prototype/visuals.js');
const DATA=Game.data;
const R=Game.rules;
for(const region of [1,4]) {
  const width=800,height=600;
  const barrier=R.barriers[region];
  assert(['water','lava'].includes(barrier.kind),
    'expected original moving surface '+region+': '+barrier.kind);
  const y=(barrier.bounds[2]+barrier.bounds[3])/2;
  const banks=R.channelBanks(region,y);
  const mid={x:(banks[0]+banks[1])/2,y};
  const project=p=>({x:400+(p.x-mid.x)*0.76-(p.y-mid.y)*0.76,
    y:300+(p.x-mid.x)*0.27+(p.y-mid.y)*0.27});
  const capture=time=>{
    const canvas=createCanvas(width,height),ctx=canvas.getContext('2d');
    V.terrain(ctx,project,region,DATA.regions[region].size,
      null,{width,height},[],time);
    return Buffer.from(ctx.getImageData(0,0,width,height).data);
  };
  const a=capture(0),b=capture(3),a2=capture(0);
  assert(a.equals(a2),'fixed terrain time must be reproducible');
  assert(!a.equals(b),'water/lava shimmer must depend on changing time');
  console.log('AUDIT-TERRAIN-TIME '+DATA.regions[region].id+
    ' repeat-identical=true dynamic-different=true');
}
console.log('PASS #708 Canvas native water/lava original shimmer time dependency; Pixi retained tile cache motion NOT certified');
