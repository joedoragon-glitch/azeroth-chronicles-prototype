'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm'),
  path = require('node:path');
const Audio = require('../src/prototype/audio'),
  Campaign = require('../src/prototype/engine');
const evidence = require('./helpers/audio-preservation.cjs');
assert.deepEqual(evidence(Audio), require('./fixtures/audio-v0886.json').audio);
console.log(
  'PASS existing catalog, all arrangement note schedules, effects and routing match v0.8.86',
);
function harness() {
  const nodes = [],
    contexts = [],
    timers = new Set();
  let timer = 0;
  const param = () => ({
    value: 0,
    calls: [],
    setValueAtTime(v, t) {
      this.value = v;
      this.calls.push(['set', v, t]);
    },
    linearRampToValueAtTime(v, t) {
      this.value = v;
      this.calls.push(['ramp', v, t]);
    },
    exponentialRampToValueAtTime(v, t) {
      this.value = v;
      this.calls.push(['exp', v, t]);
    },
    setTargetAtTime(v, t) {
      this.value = v;
      this.calls.push(['target', v, t]);
    },
    cancelScheduledValues(t) {
      this.calls.push(['cancel', t]);
    },
  });
  function node() {
    const n = {
      gain: param(),
      frequency: param(),
      Q: param(),
      threshold: param(),
      ratio: param(),
      connect() {},
      disconnect() {
        this.disconnected = true;
      },
      start() {},
      stop() {
        this.stopped = true;
      },
    };
    nodes.push(n);
    return n;
  }
  class Context {
    constructor() {
      this.currentTime = 0;
      this.state = Context.initialState || 'suspended';
      this.sampleRate = 1000;
      this.destination = node();
      contexts.push(this);
    }
    createGain() {
      return node();
    }
    createOscillator() {
      return node();
    }
    createBiquadFilter() {
      return node();
    }
    createBufferSource() {
      return node();
    }
    createDynamicsCompressor() {
      return node();
    }
    createBuffer(channels, length) {
      return { getChannelData: () => new Float32Array(length) };
    }
    async resume() {
      this.resumeCalls = (this.resumeCalls || 0) + 1;
      if (this.defer) await new Promise((resolve) => (this.finishResume = resolve));
      if (this.state !== 'closed') this.state = 'running';
    }
    async suspend() {
      if (this.state !== 'closed') this.state = 'suspended';
    }
    async close() {
      this.state = 'closed';
    }
  }
  const root = {
    AudioContext: Context,
    setInterval() {
      timers.add(++timer);
      return timer;
    },
    clearInterval(id) {
      timers.delete(id);
    },
  };
  root.window = root;
  vm.createContext(root);
  for (const file of [
    'audio-catalog',
    'audio-assets',
    'audio-mixer',
    'audio-runtime',
    'audio-score',
    'audio-effects',
    'audio-recordings',
    'audio-production',
    'audio',
  ])
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, '../src/prototype', file + '.js'), 'utf8'),
      root,
    );
  return { Audio: root.PrototypeAudio, Context, nodes, contexts, timers };
}
(async () => {
  const pausedHarness = harness();
  pausedHarness.Context.initialState = 'running';
  const pausedAudio = new pausedHarness.Audio();
  pausedAudio.setPaused(true);
  assert.equal(await pausedAudio.unlock(), false);
  assert.equal(
    pausedAudio.ctx.state,
    'suspended',
    'a gesture creating a running context still respects an already-open menu',
  );
  pausedAudio.dispose();
  const h = harness(),
    a = new h.Audio({ music: 0.22 });
  assert.equal(h.contexts.length, 0);
  assert.equal(a.status().state, 'locked');
  assert(await a.unlock());
  assert.equal(h.contexts.length, 1);
  assert.equal(h.timers.size, 1);
  await a.unlock();
  assert.equal(h.contexts.length, 1);
  assert.equal(h.timers.size, 1);
  const ctx = a.ctx;
  for (let i = 0; i < 1000; i++) a.noiseBurst(0);
  assert.equal(a.voices.size, 60);
  const voices = [...a.voices];
  for (const v of voices) {
    v.osc.onended();
    assert(v.osc.disconnected && v.filter.disconnected && v.gain.disconnected);
  }
  assert.equal(a.voices.size, 0);
  console.log('PASS noise sources share the 64-voice budget and disconnect after completion');
  a.effect('warning');
  assert.equal(a.duckUntil, 0.55, 'first warning is audible at context time zero');
  a.setSettings({ music: 0.8, muted: true });
  for (const bus of Object.values(a.buses))
    assert(bus.gain.calls.filter((c) => c[0] === 'target').slice(-1)[0][1] === 0);
  a.setSettings({ muted: false, music: 0.2 });
  assert.equal(a.buses.music.gain.calls.at(-1)[1], 0.2, 'duck restores newest preference');
  const sourceCount = a.voices.size;
  ctx.state = 'interrupted';
  a.effect('level');
  assert.equal(a.voices.size, sourceCount);
  assert(await a.unlock());
  ctx.state = 'suspended';
  ctx.defer = true;
  const pending = a.unlock();
  a.setPaused(true);
  ctx.finishResume();
  assert.equal(await pending, false);
  assert.equal(ctx.state, 'suspended');
  ctx.defer = false;
  a.setPaused(false);
  await Promise.resolve();
  a.update(new Campaign());
  a.schedule();
  a.noiseBurst(ctx.currentTime);
  const live = [...a.voices],
    ambient = a.noise;
  a.dispose();
  assert.equal(h.timers.size, 0);
  assert.equal(a.ctx, null);
  assert.equal(a.voices.size, 0);
  assert.equal(a.scores.length, 0);
  assert.equal(a.noise, null);
  for (const v of live) assert(v.osc.stopped && v.osc.disconnected && v.gain.disconnected);
  assert(ambient.source.stopped && ambient.source.disconnected && ambient.filter.disconnected);
  a.dispose();
  assert(await a.unlock());
  assert.equal(h.contexts.length, 2);
  assert.equal(h.timers.size, 1);
  a.ctx.state = 'suspended';
  a.ctx.defer = true;
  const late = a.unlock(),
    lateCtx = a.ctx;
  a.dispose();
  lateCtx.finishResume();
  assert.equal(await late, false);
  assert.equal(h.timers.size, 0);
  console.log(
    'PASS mute/volume during ducking, interrupted contexts, pending resume races and repeated disposal',
  );
  const c = new Campaign(),
    director = new Audio(),
    snapshot = JSON.stringify(c.snapshot());
  director.describe(c);
  assert.equal(
    JSON.stringify(c.snapshot()),
    snapshot,
    'context observation never mutates game state',
  );
  const refuge = c.zone().npcs.find((n) => n.kind === 'rest');
  Object.assign(c.hero, { x: refuge.x, y: refuge.y });
  assert.equal(director.describe(c).situation, 'settlement');
  assert.equal(director.describe(c, { menu: true }).situation, 'menu');
  assert.equal(director.describe(c, { backgrounded: true, menu: true }).situation, 'background');
  const boss = c.zone().enemies.find((e) => e.type === 'boss');
  c.engage(boss);
  const context = director.describe(c);
  assert.equal(context.situation, 'boss');
  assert.equal(context.boss.family, boss.family);
  c.enter('crypt');
  assert.equal(director.describe(c).interior, 'dungeon');
  for (const room of Campaign.rules.supplyRooms) {
    c.enter(room.id);
    assert.equal(director.describe(c).interior, 'treasury');
    assert.equal(director.describe(c).region, room.region);
  }
  for (const side of Campaign.rules.sideDungeons) {
    c.enter(side.id);
    assert.equal(director.describe(c).interior, 'side-dungeon');
    assert.equal(director.describe(c).region, side.region);
  }
  console.log(
    'PASS context exposes actual places, settlement, boss identity, interiors and shell state without changing cue policy',
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
