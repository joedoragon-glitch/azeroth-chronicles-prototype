'use strict';
// #708 V-04: preserve the native water/lava temporal contract without forcing
// Pixi to repaint its full, deliberately cached terrain every animation frame.
const assert=require('node:assert/strict');
const {createCanvas}=require('@napi-rs/canvas');
const Campaign=require('../src/prototype/engine.js');
const Visuals=require('../src/prototype/visuals.js');
const Rules=Campaign.rules;
assert.equal(typeof Visuals.terrainMotionLines,'function');
for(const region of [1,4]) {
  const b=Rules.barriers[region];
  assert.equal(b.kind,region===1?'water':'lava');
  const y=(b.bounds[2]+b.bounds[3])/2,
    banks=Rules.channelBanks(region,y),
    mid={x:(banks[0]+banks[1])/2,y},
    width=520,height=380;
  const project=p=>({x:width/2+(p.x-mid.x)*0.76-(p.y-mid.y)*0.76,
    y:height/2+(p.x-mid.x)*0.27+(p.y-mid.y)*0.27});
  const rect={width,height};
  const capture=(time,omit=false)=>{
    const c=createCanvas(width,height),ctx=c.getContext('2d');
    Visuals.terrain(ctx,project,region,Campaign.data.regions[region].size,
      null,rect,[],time,omit);
    return Buffer.from(ctx.getImageData(0,0,width,height).data);
  };
  const orig0=capture(0),orig3=capture(3),baked0=capture(0,true),baked3=capture(3,true);
  assert(!orig0.equals(orig3),'Original Canvas '+b.kind+' should move at fixed camera');
  assert(baked0.equals(baked3),'Only original moving highlights may be omitted from cached '+b.kind);
  assert(!orig0.equals(baked0),'Pixi static background must exclude the moved strokes');
  const lines0=Visuals.terrainMotionLines(region,project,rect,0),
    lines3=Visuals.terrainMotionLines(region,project,rect,3),
    stable=Visuals.terrainMotionLines(region,project,rect,0);
  assert(lines0.length>0&&lines0.length<=320,'Expected bounded authored '+b.kind+' stroke count');
  assert.deepEqual(lines0,stable,'Same phase and camera must produce deterministic strokes');
  assert.notDeepEqual(lines0,lines3,'Living strokes must change without camera movement');
  for(const line of lines0) {
    assert([line.x1,line.y1,line.x2,line.y2,line.width].every(Number.isFinite));
    assert(line.width>0&&/^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(line.color));
    assert(Math.min(line.x1,line.x2)<=width+30&&Math.max(line.x1,line.x2)>=-30);
  }
  console.log('PASS V-04 '+b.kind+': native Canvas animated, Pixi backing static, bounded live highlights ('+
    lines0.length+' strokes)');
}
const game=new Campaign('normal','paladin',()=>.73);
const saved=JSON.stringify(game.s);
Visuals.terrainMotionLines(1,p=>({x:p.x,y:p.y}),{width:500,height:400},1);
assert.equal(JSON.stringify(game.s),saved,'Liquid presentation must never change game saves');
assert.deepEqual(Visuals.terrainMotionLines(-1,p=>p,{width:10,height:10},0),[]);
console.log('PASS issue #708 no simulation or save mutation from liquid motion');
