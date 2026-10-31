'use strict';
// Issue #709. Actual production manifest/director and audio-owner source-level policy.
const assert=require('node:assert/strict');
const {audio}=require('./helpers/audio-context.cjs');
const {validateCatalog}=require('../src/prototype/audio-contract.js');
const manifest=require('../assets/audio/manifest.json');
const book=require('../tools/audio/environment-book.json');
const director=manifest.director;
assert.equal(Object.keys(manifest.assets).length,127);
const assets=Object.entries(manifest.assets).filter(([,x])=>x.kind==='ambience');
assert.equal(assets.length,14,'exact retained environmental asset count');
assert.equal(Object.keys(director.places).length,19,'exact mapped music/scene places');
assert.equal(director.environment.rules.length,18,'first-match location rule inventory');
assert.equal(book.seconds,24);
assert.equal(book.cues.length,14);
assert.deepEqual(new Set(assets.map(([id])=>id)),new Set(book.cues.map(c=>c.id)),
 '14 scored procedural environmental sources have an authoring book entry');
for(const [id,asset] of assets) {
  assert(asset.loop && asset.loop.end>asset.loop.start && asset.loop.end<=asset.duration,
   id+' must have valid loop bounds');
  assert(asset.src?.startsWith('./assets/audio/ambience/'),id+' must be local');
}
validateCatalog(manifest);
const a=audio();
a.enableProduction();
const base={region:'vale',zone:'vale',interior:'outdoors',started:true,
 situation:'world',night:false,peace:false,engaged:0,settlement:null,boss:null};
let routeCases=0;
for(const [zone,place] of Object.entries(director.places)) {
  const outdoors=['vale','march','highlands','frontier','crown'].includes(zone);
  const region=outdoors?zone:zone.startsWith('side-march')||zone==='archive'?'march':
    zone.startsWith('side-highlands')||zone==='mine'?'highlands':
    zone.startsWith('side-frontier')||zone==='abyss'?'frontier':
    zone.startsWith('side-crown')||zone==='citadel'?'crown':'vale';
  const interior=outdoors?'outdoors':zone.startsWith('supply-')?'treasury':'dungeon';
  for(const night of [false,true]) for(const peace of [false,true]) {
    const scene={...base,zone,region,interior,night,peace};
    const env=a.environmentCue(scene);
    assert(env,zone+' lacks environment for night='+night+' peace='+peace);
    assert.equal(manifest.assets[env.asset].kind,'ambience',zone);
    assert.equal(a.environmentCue(scene).id,env.id,'rule selection must be stable');
    assert.equal(typeof place.base,'string');
    routeCases++;
  }
}
for(const region of ['vale','march','highlands','frontier','crown']) {
  for(const night of [false,true]) {
    const rule=a.environmentCue({...base,region,zone:region,night});
    assert(rule && rule.when.interior==='outdoors',region);
    if(region==='vale') assert.equal(rule.asset,night?'env-woodland-night':'env-woodland-day');
    if(region==='march') assert.equal(rule.asset,night?'env-marsh-night':'env-marsh-day');
  }
}
for(const extra of [
 {started:false},{gameOver:true},{situation:'title'},
 {situation:'game-over'}
]) assert.equal(a.environmentCue({...base,...extra}),null);
for(const [key,n] of [['combatGain',0.45],['bossGain',0.25]])
 assert.equal(director.environment[key],n);
assert.deepEqual(director.environment.detailGap,[18,36]);
assert.equal(a.setOptimizationMode(true),true);
assert.equal(a.optimizationMode,true);
assert.equal(a.setOptimizationMode(false),true);
assert.equal(a.optimizationMode,false);
a.dispose();
console.log('PASS issue #709: 127 assets/14 ambience/18 routing rules, '+
 routeCases+' real director place-night-peace policy checks, authoring parity, title gating, optimization');


const {execFileSync}=require('node:child_process');
for(const file of [
 'tests/audio-environment.test.cjs',
 'tests/audio-stage4-mix-matrix.test.cjs',
 'tests/audio-recordings.test.cjs',
 'tests/audio-stage2-recovery.test.cjs',
 'tests/audio-stage5-release-preflight.test.cjs',
 'tests/optimization-mode.test.cjs'
]) {
  console.log('AUDIT-EXISTING-TEST '+file);
  execFileSync(process.execPath,[file],{cwd:require('node:path').resolve(__dirname,'..'),
   stdio:'inherit',timeout:180000});
}
console.log('PASS issue #709 independent historical regression replay');
