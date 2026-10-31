'use strict';
// #709 Phase A1: real campaign scene routing exercised through recording voice ownership.
// A simulated AudioContext and synthetic buffers prove state/transport contracts only,
// NOT actual MP3 decoding, audible output, music balance or mobile playback.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const { audio } = require('./helpers/audio-context.cjs');
const manifest = require('../assets/audio/manifest.json');
const flush = () => new Promise(resolve => setImmediate(resolve));
const nativeCampaigns = new Map();
function sceneFor(a, id, night=false, peace=false) {
  let campaign = nativeCampaigns.get(id);
  if (!campaign) {
    campaign = new Campaign('normal', 'paladin', () => 0.73);
    campaign.enter(id);
    nativeCampaigns.set(id, campaign);
  }
  assert.equal(campaign.zoneId, id);
  const before = JSON.stringify(campaign.s);
  const scene = { ...a.describe(campaign, {started:true}), night, peace };
  assert.equal(JSON.stringify(campaign.s), before, 'audio description must be read-only');
  return scene;
}
function rig() {
  const a = audio();
  a.configureRecordings(manifest);
  a.enableProduction();
  a.ambient = () => {}; // do not synthesize fallback noise during transport tests
  const counters = { loads:0, retains:0, releases:0 };
  const store = {
    closed:false,
    async load(id) {
      const entry = manifest.assets[id];
      assert.equal(entry?.kind, 'ambience', id);
      counters.loads++;
      return { entry, buffer: { duration:entry.duration } };
    },
    retain() { counters.retains++; },
    release() { counters.releases++; },
  };
  a.assetsForRecordings = async () => store;
  return { a, store, counters };
}
async function run() {
  const {a,counters} = rig();
  let rows=0, distinct=new Set();
  for (const id of Object.keys(manifest.director.places)) {
    for (const night of [false,true]) for (const peace of [false,true]) {
      const scene = sceneFor(a,id,night,peace);
      const rule = a.environmentCue(scene);
      assert(rule, 'missing production rule '+id);
      a.context = scene;
      a.updateEnvironment(scene);
      assert.equal(await a.environmentPending,true, 'recorded source must start '+id);
      assert.equal(a.environmentVoice?.id,rule.asset,id);
      assert.equal(a.environmentVoice?.osc.loop,true);
      assert.equal(a.environmentVoice?.osc.loopStart,manifest.assets[rule.asset].loop.start);
      assert.equal(a.environmentVoice?.osc.loopEnd,manifest.assets[rule.asset].loop.end);
      assert.equal(a.environmentVoice?.bus,'ambience');
      assert(a.voices.size<=2,'more than active and fading recorded environment voices');
      distinct.add(rule.asset);
      rows++;
    }
  }
  assert.equal(rows,76);
  assert.equal(distinct.size,14);
  let s=sceneFor(a,'vale');
  a.updateEnvironment(s);
  assert.equal(await a.environmentPending,true);
  let bed=a.environmentVoice;
  const starts=counters.loads;
  a.updateEnvironment({...s,settlement:'rest'});
  assert.equal(a.environmentVoice,bed,'settlement must not duplicate unchanged bed');
  assert.equal(counters.loads,starts);
  a.ctx.currentTime=40;
  a.updateEnvironment({...s,engaged:3});
  assert(Math.abs(bed.targetGain - a.environmentCue(s).gain*.45)<1e-9);
  a.updateEnvironment({...s,boss:{family:'thorn',form:'normal'}});
  assert(Math.abs(bed.targetGain - a.environmentCue(s).gain*.25)<1e-9);
  a.ctx.currentTime=43;
  a.updateEnvironment(s);
  assert(Math.abs(bed.targetGain - a.environmentCue(s).gain)<1e-9);
  a.setSceneMix('menu');
  a.updateEnvironment({...s,situation:'menu'});
  assert.equal(a.environmentVoice,bed,'menu should quiet rather than restart a bed');
  assert.equal(a.mixLevel('ambience'),a.settings.ambience*.15);
  a.setSceneMix('world');
  a.setSettings({muted:true});
  assert.equal(a.mixLevel('ambience'),0);
  a.setSettings({muted:false});
  assert(a.mixLevel('ambience')>0);
  a.setPaused(true);
  assert.equal(a.paused,true);
  assert.equal(a.ctx.state,'suspended');
  a.updateEnvironment(sceneFor(a,'march'));
  assert.equal(a.environmentVoice,bed,'pause must not start a new bed');
  a.setPaused(false);
  await flush();
  assert.equal(a.ctx.state,'running');
  a.updateEnvironment(s);
  assert.equal(a.environmentVoice,bed,'resume must not restart an unchanged bed');
  a.ctx.state='suspended';
  a.updateEnvironment(sceneFor(a,'march'));
  assert.equal(a.environmentVoice,bed,'background suspend must not start new audio');
  a.ctx.state='running';
  a.updateEnvironment(sceneFor(a,'march'));
  assert.equal(await a.environmentPending,true);
  assert.equal(a.environmentVoice.id,'env-marsh-day');
  a.setOptimizationMode(true);
  assert.equal(a.environmentVoice,null,'optimization on must stop the recorded source');
  assert.equal(a.voices.size,0,'optimization must clean active and outgoing environment');
  a.setOptimizationMode(false);
  assert.equal(await a.environmentPending,true);
  assert.equal(a.environmentVoice.id,'env-marsh-day','optimization off restarts the selected bed');
  a.updateEnvironment({...s,situation:'title',started:false});
  assert.equal(a.environmentVoice,null,'title entry stops environment');
  a.dispose();
  assert.equal(a.voices.size,0);
  // Rapid travel/aborted loads: a stale asynchronous load must never win.
  const {a:b,store:storeB}=rig();
  let release;
  const gate=new Promise(resolve=>{release=resolve});
  storeB.load=async(id)=>{
    await gate;
    const entry=manifest.assets[id];
    return {entry,buffer:{duration:entry.duration}};
  };
  b.updateEnvironment(sceneFor(b,'vale'));
  const stale=b.environmentPending;
  b.updateEnvironment(sceneFor(b,'march'));
  const current=b.environmentPending;
  release();
  assert.equal(await stale,false);
  assert.equal(await current,true);
  assert.equal(b.environmentVoice.id,'env-marsh-day');
  assert(b.voices.size<=1,'no leaked stale voice');
  b.dispose();
  assert.equal(b.voices.size,0);
  console.log('PASS #709 A1 synthetic-transport native routing: '+rows+
    ' actual Campaign zone/night/peace cases, '+distinct.size+
    ' registered MP3 IDs; combat/boss, menu/mute, pause/background, optimization, title, stale load/disposal');
  console.log('A1_LIMIT simulated AudioContext/asset buffers: NOT Chromium, speaker or physical MP3 verification');
}
run().catch(e=>{console.error(e);process.exitCode=1});
