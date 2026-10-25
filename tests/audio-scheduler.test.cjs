'use strict';
const assert = require('node:assert/strict'),
  Audio = require('../src/prototype/audio.js'),
  C = require('../src/prototype/engine.js');
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
  },
  cancelScheduledValues() {},
  setTargetAtTime(v) {
    this.value = v;
  },
});
const nodes = [],
  node = () => {
    const n = {
      gain: param(),
      frequency: param(),
      connect() {},
      disconnect() {
        this.disconnected = true;
      },
    };
    nodes.push(n);
    return n;
  };
const ctx = {
  currentTime: 0,
  state: 'running',
  sampleRate: 16,
  createGain: node,
  createBiquadFilter: node,
  createBuffer: () => ({ getChannelData: () => new Float32Array(48) }),
  createBufferSource: () => ({ ...node(), start() {}, stop() {} }),
  createOscillator() {
    return {
      ...node(),
      start() {},
      stop(t) {
        this.stopAt = t;
      },
    };
  },
};
const a = new Audio(),
  c = new C();
a.ctx = ctx;
a.buses = { master: node(), music: node(), ambience: node(), effects: node() };
a.update(c);
a.schedule();
assert(a.voices.size > 0);
const initialScore = a.score;
a.step = 77;
c.s.clock = 500;
a.update(c);
assert.equal(a.step, 77);
assert.equal(a.score, initialScore);
for (const id of ['march', 'highlands', 'frontier', 'crown', 'vale']) {
  ctx.currentTime += 0.1;
  c.enter(id);
  a.update(c);
  assert(a.scores.length <= 2);
  assert.equal(a.score.node.gain.calls.at(-1)[2], ctx.currentTime + 2);
}
// The protected Vale opening requires an actual hero hit before Thornfang can engage.
c.hero.level = 2;
c.syncThornArrival(c.zone());
const boss = c.zone().enemies.find((e) => e.type === 'boss' && e.hp > 0);
assert(boss, 'expected the living Vale boss');
assert(c.awaitsHeroAttack(boss));
c.zone().props = [];
c.zone().buildings = [];
Object.assign(c.hero, { x: boss.x - 50, y: boss.y });
c.damage(boss, 1, 'hero');
assert(boss.aggro, 'native hero contact must actually start the boss cue');
ctx.currentTime += 0.1;
a.update(c);
assert.equal(a.score.node.gain.calls.at(-1)[2], ctx.currentTime + 0.5);
assert(a.scores.length <= 2);
for (const b of C.data.bosses) c.victory(b.id, 'normal');
for (const id of ['darklord', ...C.dungeonIds]) c.victory(id, 'true');
c.checkEnding();
assert.equal(c.peace, false, 'boss victories alone cannot bypass the physical Crown throne');
c.enter('crown');
c.refreshNPCs();
const throne = c.zone().npcs.find((n) => n.id === 'dark-crown-throne');
assert(throne);
Object.assign(c.hero, { x: throne.x + 20, y: throne.y });
for (const enemy of c.zone().enemies) if (enemy.family === 'darklord') enemy.hp = 0;
assert(c.interact(throne), 'peace audio requires the actual crown claim');
assert(c.peace);
a.update(c);
assert.equal(a.scores.length, 1);
assert(a.cue.peace);
for (const t of Audio.themes) {
  assert.equal(t.form.length, 256);
  assert.notDeepEqual(t.form.slice(0, 64), t.form.slice(128, 192));
}
for (let i = 0; i < 1000; i++) {
  ctx.currentTime += 0.2;
  a.schedule();
  assert(a.voices.size <= 64);
  assert(a.scores.length <= 2);
}
for (const voice of [...a.voices]) voice.osc.onended();
assert.equal(a.voices.size, 0);
console.log(
  'PASS F22 32-bar contrasting forms, retained night loop, 0.5/2 second fades, newest-cue priority and bounded scores/voices',
);
