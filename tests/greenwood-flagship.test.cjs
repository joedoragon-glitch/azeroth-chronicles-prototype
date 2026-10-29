'use strict';
// Current Greenwood acceptance: owner-authorized return to the historical
// 2700-unit world. The rejected dev.233 flagship assertions remain in PR #570.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');
const zlib=require('node:zlib');
const C=require('../src/prototype/engine');
const {rng}=require('../tools/greenwood-layout/fixtures.cjs');
assert.equal(C.data.regions[0].size,2700,'original Greenwood region size');
assert.equal(C.rules.barriers[0].gaps.length,2,'original two crossings');
assert.equal(C.rules.barriers[0].gaps[1][1]-C.rules.barriers[0].gaps[1][0],
  180,'original southern bridge width');
for(const seed of [0x47564101,0x47564102,0x47564103,0x47564104]){
  const g=new C('normal','paladin',rng(seed)),z=g.zone();
  assert.equal(g.zoneSize(),2700);
  assert(!z.greenwoodSceneVersion,'no rejected scene regeneration');
  assert(!z.props.some(p=>p.greenwoodScene||p.greenwoodReserved));
  assert.equal(z.enemies.filter(e=>e.type==='mob'&&!e.summon).length,32);
  assert.equal(z.nodes.reduce((n,p)=>n+p.amount,0),640);
  for(const id of ['rest','supplier','recruiter','board','minor',
    'bridge-north','bridge-south','orchard','mill-pond','outbound'])
    assert(z.npcs.some(n=>n.id===id),'original service/landmark '+id);
  const old=C.restore(g.snapshot(),rng(seed));
  assert.equal(old.zoneSize(),2700);
  assert(!old.zone().greenwoodRollbackVersion,'no inverse conversion for original save');
}
// Produce a genuine dev.233 expanded world with the exact original author's
// configure() function, isolated from the restored runtime in a child process.
const source=`
 const f=require('./tools/greenwood-layout/fixtures.cjs');
 const C=f.loadRuntime(3200,true);
 const g=new C('normal','paladin',f.rng(0x47564102));
 console.log(JSON.stringify(g.snapshot()));
`;
const shipped=JSON.parse(cp.execFileSync(process.execPath,['-e',source],{
  cwd:require('node:path').resolve(__dirname,'..'),
  encoding:'utf8',maxBuffer:8*1024*1024
}));
assert.equal(shipped.zones.vale.greenwoodSourceVersion,1);
assert(shipped.zones.vale.greenwoodSceneVersion,'fixture really contains 3200 scene');
const input=JSON.stringify(shipped),g=C.restore(shipped,rng(0x47564102)),z=g.zone();
assert.equal(JSON.stringify(shipped),input,'input save not overwritten');
assert.equal(g.zoneSize(),2700);
assert.equal(z.greenwoodRollbackVersion,1,'one-time inverse conversion');
assert(!z.props.some(p=>p.greenwoodScene||p.greenwoodReserved));
assert.equal(z.nodes.reduce((n,p)=>n+p.amount,0),640,'tribute retained');
assert.equal(z.enemies.filter(e=>e.type==='mob'&&!e.summon).length,32);
assert(g.hero.x>=0&&g.hero.x<=2700&&g.hero.y>=0&&g.hero.y<=2700);
const once=g.snapshot(),again=C.restore(once,rng(0x47564102)).snapshot();
assert.equal(again.zones.vale.greenwoodRollbackVersion,1);
assert.equal(again.zones.vale.nodes.reduce((n,p)=>n+p.amount,0),640);
assert.equal(again.zones.vale.enemies.length,once.zones.vale.enemies.length);
assert.deepEqual(again.quests,once.quests,'no earned quest loss');
assert.deepEqual(again.paid,once.paid,'no paid-history loss');
assert.equal(once.zones.vale.greenwoodSourceVersion,0,
  'downgraded save explicitly records restored source geometry');
const savedPositions=(snap)=>({
  hero:{x:snap.hero.x,y:snap.hero.y},
  party:(snap.party||[]).map(p=>[p.id,p.x,p.y,p.order?.x,p.order?.y]),
  services:snap.zones.vale.npcs.map(p=>[p.id,p.x,p.y,p.servicePoint?.x,p.servicePoint?.y]),
  enemies:snap.zones.vale.enemies.map(p=>[p.id,p.x,p.y,p.home?.x,p.home?.y]),
  buildings:snap.zones.vale.buildings.map(p=>[p.id,p.x,p.y]),
});
assert.deepEqual(savedPositions(again),savedPositions(once),
  'no actor/home/service/construction moves on second restore');

const progress=JSON.parse(JSON.stringify(shipped));
progress.hero.gold=9001;
progress.zones.vale.nodes[0].amount=0;
const advanced=C.restore(progress,rng(0x47564102));
assert.equal(advanced.hero.gold,9001,'saved crowns unchanged');
assert.equal(advanced.zone().nodes[0].amount,0,'no renewed tribute');
const archive=JSON.parse(zlib.gunzipSync(fs.readFileSync(
  'docs/evidence/greenwood-gva-20261028/synthetic-v4-inputs.json.gz'))).saves;
for(const [name,raw] of archive){
  const before=JSON.stringify(raw),restored=C.restore(raw,rng(0x47564102));
  assert.equal(JSON.stringify(raw),before,name+' raw input untouched');
  assert.equal(restored.zoneSize(),2700,name+' original world');
  assert(!restored.zone().greenwoodRollbackVersion,name+' no reverse conversion');
}
console.log('PASS rollback: original 2700 worlds, upgraded v4 conversion, identity, progress and reloading');
