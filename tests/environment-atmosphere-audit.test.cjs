'use strict';
// Issue #708. Native source-behavior audit: no new effects, no scene changes.
const assert = require('node:assert/strict');
const V = require('../src/prototype/visuals.js');
const expectedCount = [14,14,14,18,18];
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
    precedingAlpha = a[0].alpha;
    assert.notDeepEqual(a,V.atmosphereMotes({...spec,time:102.5}),
      'motes must animate with presentation time');
    moteCases++;
  }
}
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
console.log('PASS issue #708: '+moteCases+' deterministic/optimization/indoor particle checks; '+
  canvasCases+' real Canvas atmosphere phase x region x optimization draws; finite gradients');


const Campaign=require('../src/prototype/engine.js');
for(const zone of ['vale','march','highlands','frontier','crown']) {
  const g=new Campaign('normal','paladin',()=>0.73);
  g.enter(zone);
  const z=g.zone();
  const prop=(z.props||[]).filter(p=>Campaign.rules.ambientLife[p.structure||p.id]);
  const actors=(g.visibleNPCs?.()||[]).filter(p=>Campaign.rules.ambientLife[p.structure||p.id]);
  const counts={};
  for(const p of [...prop,...actors]) {
    const key=p.structure||p.id;
    counts[key]=(counts[key]||0)+1;
  }
  console.log('AMBIENT-LIFE-CENSUS '+zone+' '+JSON.stringify(counts));
}
const {execFileSync}=require('node:child_process');
for(const file of [
  'tests/daylight-cycle.test.cjs',
  'tests/ambient-life.test.cjs',
  'tests/optimization-mode.test.cjs',
  'tests/pixi-fidelity.test.cjs',
  'tools/webgl-pilot/pixi-scene-bridge.test.cjs',
  'tests/ground-cache.test.cjs'
]) {
  console.log('AUDIT-EXISTING-TEST '+file);
  execFileSync(process.execPath,[file],{cwd:require('node:path').resolve(__dirname,'..'),
    stdio:'inherit',timeout:180000});
}
console.log('PASS issue #708 independent historical regression replay');
