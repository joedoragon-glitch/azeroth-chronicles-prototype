'use strict';
// Issue #708. Native source-behavior audit for shared terrain motion and atmosphere.
const assert = require('node:assert/strict');
const V = require('../src/prototype/visuals.js');
const expectedCount = [14,14,14,18,0];
const phaseValues = [0,0.001,0.5,0.999,1];
let moteCases = 0, canvasCases = 0;
for (let region = 0; region < 5; region++) {
  const width = 960, height = 540;
  let precedingAlpha = 0;
  for (const darkness of phaseValues) {
    const spec = { width,height,region,darkness,time:101.5 };
    const a = V.atmosphereMotes(spec);
    assert.equal(a.length,expectedCount[region], 'outdoor region '+region);
    assert.deepEqual(a,V.atmosphereMotes(spec),'same clock and scene are deterministic');
    assert.equal(V.atmosphereMotes({...spec,optimized:true}).length,0);
    const interiors = [
      {...spec,dungeon:true}, {...spec,room:true}
    ];
    for(const indoors of interiors) assert.equal(V.atmosphereMotes(indoors).length,8);
    assert(a.every(m => Number.isFinite(m.x)&&Number.isFinite(m.y) &&
      m.r>0 && m.r<=2.5 && m.alpha>=0 && m.alpha<=1 &&
      m.rgb.length===3 && m.rgb.every(n=>Number.isInteger(n)&&n>=0&&n<=255)));
    assert(a.every(m=>m.alpha>=precedingAlpha),'darkening must not reduce alpha');
    precedingAlpha = a[0]?.alpha ?? 0;
    if (a.length) assert.notDeepEqual(a,V.atmosphereMotes({...spec,time:102.5}),
      'motes must animate with presentation time');
    moteCases++;
  }
}
const nearbyMotion = (x, y, time) =>
  V.terrainMotionLines(4, (p) => ({ x: p.x - x + 120, y: p.y - y + 80 }), {
    width: 240,
    height: 160,
  }, time);
const ash = (lines) => lines.filter(({ color }) => color.startsWith('#c4b6ae'));
const shimmer = (lines) => lines.filter(({ color }) => color === '#dcad7c43');
assert.equal(ash(nearbyMotion(1665, 3240, 2)).length, 4, 'ash visits the exposed roost edge');
assert.equal(ash(nearbyMotion(1665, 3240, 8)).length, 0, 'clear air between short gusts');
assert.equal(ash(nearbyMotion(940, 390, 2)).length, 0, 'ash stays away from Crownwatch');
assert.equal(shimmer(nearbyMotion(2770, 710, 2)).length, 2, 'two faint geothermal traces');
assert.notDeepEqual(shimmer(nearbyMotion(2770, 710, 2)), shimmer(nearbyMotion(2770, 710, 3)));
assert.equal(shimmer(nearbyMotion(940, 390, 2)).length, 0, 'geothermal effects stay local');

function recordCanvas() {
  const calls = {circles:0,gradients:[],save:0,restore:0,fill:0,rects:0};
  const grad = ()=>({
    addColorStop(offset,color) {
      assert(Number.isFinite(offset)&&offset>=0&&offset<=1);
      assert(!/NaN|Infinity|e[-+]\d+/i.test(color),'CSS gradient must be finite and decimal');
      calls.gradients.push([offset,color]);
    }
  });
  const base = {
    createLinearGradient:grad,createRadialGradient:grad,
    save(){calls.save++},restore(){calls.restore++},
    beginPath(){},arc(x,y,r){assert([x,y,r].every(Number.isFinite));calls.circles++},
    fill(){calls.fill++},fillRect(){calls.rects++},
    stroke(){},moveTo(){},lineTo(){},strokeRect(){},closePath(){}
  };
  return {calls,ctx:new Proxy(base,{get:(o,k)=>(k in o?o[k]:(()=>{})),set(o,k,v){o[k]=v;return true}})};
}
for(let region=0;region<5;region++) {
  for(const phase of [
    {phase:'day',darkness:0,warmth:0},
    {phase:'sunset',darkness:0.5,warmth:0.5},
    {phase:'night',darkness:1,warmth:0},
    {phase:'sunrise',darkness:0.5,warmth:0.5},
    {phase:'victory-sunrise',darkness:0.5,warmth:0.8}
  ]) {
    for(const optimized of [false,true]) {
      const {calls,ctx}=recordCanvas();
      V.atmosphere(ctx,{width:960,height:540},region,{
        daylight:phase,night:phase.darkness>=1,optimized,
        lights:[],hero:null,dungeon:false,room:false
      });
      assert.equal(calls.save,calls.restore,'canvas state must restore');
      assert.equal(calls.circles,optimized?0:expectedCount[region],
        'canvas must draw exactly shared motes when enabled');
      assert(calls.rects>0,'color grade must still paint when optimized');
      canvasCases++;
    }
  }
}
console.log('PASS issue #708 focused source: '+moteCases+' deterministic/optimization/indoor particle checks; '+
  canvasCases+' real Canvas atmosphere phase x region x optimization draws; finite gradients');


