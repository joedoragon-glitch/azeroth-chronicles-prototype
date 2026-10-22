'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const Assets=require('./native-asset-residency.js');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../../assets/sprites/manifest.json')));
const originalG=manifest.sprites['enemy:goblin'];
const originalF=manifest.sprites['transport:ferry'];
function descriptor(entry) {
  return {id:entry.src,src:entry.src,width:entry.width,height:entry.height};
}
function fakeGPU(total=64*1024*1024) {
  const resident=new Map(),log=[];
  let alive=true;
  return {
    gpu:{
      registerTexture(id,image){
        assert.ok(alive,'Cannot upload to failed GPU');
        resident.set(id,[image.width,image.height]);log.push(['upload',id]);
        return {id,width:image.width,height:image.height};
      },
      releaseTexture(id){resident.delete(id);log.push(['release',id]);},
      available(){return alive;},
      metrics(){return{textureBudgetBytes:total}}
    },
    resident,log,lose(){alive=false}
  };
}
const image=d=>({width:d.width,height:d.height});
test('real manifest PNG and WebP sources are approved, external and traversed resources rejected',()=>{
  assert.ok(Assets.VALID_SOURCE.test(originalG.src));
  assert.ok(Assets.VALID_SOURCE.test(originalF.src));
  for(const src of ['../evil.png','./assets/sprites/../../evil.png',
    'https://example.com/pixel.png','./assets/sprites/x.svg',
    './assets/sprites/x.png?cache=no'])assert.equal(Assets.VALID_SOURCE.test(src),false);
});
test('approved original sprite decodes once and remains GPU resident across frames',async()=>{
  const f=fakeGPU(),d=descriptor(originalG);let loads=0;
  const assets=Assets.create({gpu:f.gpu,loader:async()=>{loads++;return image(d)}});
  const [a,b]=await Promise.all([assets.ensure(d),assets.ensure(d)]);
  assert.equal(a.id,d.id);assert.equal(b.id,d.id);
  await assets.ensure(d);
  assert.equal(loads,1);
  assert.equal(f.log.filter(([kind])=>kind==='upload').length,1);
  assert.equal(assets.metrics().resident,1);
  assert.equal(assets.metrics().bytes,d.width*d.height*4);
  assets.destroy();
  assert.equal(f.resident.size,0);
});
test('source dimensions cannot silently substitute lower-resolution artwork',async()=>{
  const f=fakeGPU(),d=descriptor(originalG);
  const assets=Assets.create({gpu:f.gpu,loader:async()=>({width:d.width-1,height:d.height})});
  await assert.rejects(assets.ensure(d),/dimensions disagree/);
  assert.equal(assets.metrics().resident,0);
  assets.destroy();
});
test('memory budget evicts unpinned least-recently-used GPU art',async()=>{
  const size=16,bytes=size*size*4, f=fakeGPU(bytes*2);
  const assets=Assets.create({gpu:f.gpu,budgetBytes:bytes*2,
    loader:async()=>({width:size,height:size})});
  const d=(name)=>({id:'./assets/sprites/'+name+'.png',
    src:'./assets/sprites/'+name+'.png',width:size,height:size});
  const a=d('a'),b=d('b'),c=d('c');
  await assets.ensure(a);await assets.ensure(b);
  assert.equal(assets.has(a.id),true);
  assets.beginFrame([]);
  await assets.ensure(c);
  assert.equal(f.resident.has(a.id),true,'recently used a stays resident');
  assert.equal(f.resident.has(b.id),false,'oldest b is evicted');
  assert.equal(assets.metrics().evictions,1);
  assert.equal(assets.metrics().bytes,bytes*2);
  assets.destroy();
});
test('cannot evict an image marked essential for current frame',async()=>{
  const f=fakeGPU(1024),d=name=>({id:'./assets/sprites/'+name+'.png',
    src:'./assets/sprites/'+name+'.png',width:16,height:16});
  const assets=Assets.create({gpu:f.gpu,budgetBytes:1024,
    loader:async()=>({width:16,height:16})});
  const original=d('pinned'),wanted=d('other');
  await assets.ensure(original);
  assets.beginFrame([original.id]);
  await assert.rejects(assets.ensure(wanted),/active original artwork cannot be evicted/);
  assert.equal(f.resident.has(original.id),true);
  assert.equal(f.resident.has(wanted.id),false);
  assets.destroy();
});
test('concurrent conflicting descriptors fail before misleading GPU upload',async()=>{
  const f=fakeGPU(),d=descriptor(originalG);
  let unblock;
  const loader=()=>new Promise(resolve=>{unblock=resolve});
  const assets=Assets.create({gpu:f.gpu,loader});
  const pending=assets.ensure(d);
  await assert.rejects(assets.ensure({...d,width:d.width-2}),
    /Conflicting concurrent/);
  await Promise.resolve();
  unblock(image(d));
  await pending;
  assert.equal(f.log.filter(([kind])=>kind==='upload').length,1);
  assets.destroy();
});
test('a WebGL context failure forbids further asset requests',async()=>{
  const f=fakeGPU(),assets=Assets.create({gpu:f.gpu,
    loader:async()=>({width:8,height:8})});
  f.lose();
  await assert.rejects(assets.ensure({
    id:'./assets/sprites/face.png',
    src:'./assets/sprites/face.png',width:8,height:8
  }),/fallback/);
  assets.destroy();
});
test('strict in-flight queue cap does not spawn unlimited decoding',async()=>{
  const f=fakeGPU(),resolveFirst=[];
  const assets=Assets.create({gpu:f.gpu,budgetBytes:2048,concurrency:1,maxPending:1,
    loader:()=>new Promise(resolve=>resolveFirst.push(resolve))});
  const d=name=>({id:'./assets/sprites/'+name+'.png',
    src:'./assets/sprites/'+name+'.png',width:8,height:8});
  const first=assets.ensure(d('one'));
  await assert.rejects(assets.ensure(d('two')),/queue is full/);
  await Promise.resolve();
  resolveFirst[0]({width:8,height:8});
  await first;
  assets.destroy();
});

test('invalidating during async decode rejects instantly and forbids stale GPU upload',async()=>{
  const f=fakeGPU(),d=descriptor(originalG);
  let allowResolution;
  const assets=Assets.create({gpu:f.gpu,
    loader:()=>new Promise(resolve=>{allowResolution=resolve})});
  const original=assets.ensure(d);
  await Promise.resolve();
  assets.clear();
  await assert.rejects(original,/invalidated/);
  allowResolution(image(d));
  for(let i=0;i<6;i++)await Promise.resolve();
  assert.equal(assets.metrics().resident,0);
  assert.equal(f.log.filter(([kind])=>kind==='upload').length,0);
  assets.destroy();
});
