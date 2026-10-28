'use strict';
// dev.206 first live phone report: Rogue receipts had neither hero art nor foley.
const assert = require('node:assert/strict');
const Hero = require('../src/prototype/hero-presentation.js');
const Audio = require('../src/prototype/audio.js');
const cases = [
  { type: 'rogueBellBasic', actor: 'hero', class: 'rogue', slot: 1,
    automaticBasic: true, combo: 1, landed: true, x: 100, y: 100,
    targetX: 125, targetY: 94, audioCue: 'bell-jingle' },
  { type: 'rogueBellSkill1', actor: 'hero', class: 'rogue', slot: 1,
    form: 'tap', x: 125, y: 94, radius: 145, audioCue: 'bell-jingle' },
  { type: 'rogueBellSkill1', actor: 'hero', class: 'rogue', slot: 1,
    form: 'charged', x: 125, y: 94, radius: 190, audioCue: 'bell-jingle' },
  { type: 'rogueBellPerformance', actor: 'hero', class: 'rogue', slot: 5,
    form: 'charged', x: 125, y: 94, radius: 180, audioCue: 'bell-jingle' },
];
const effects = [];
Hero.queue(cases, (f, type, seconds, priority) =>
  effects.push({ ...f, type, life: seconds, max: seconds, priority }));
assert.deepEqual(effects.map(f => f.stage), ['cast', 'impact', 'area', 'area', 'area']);
assert.equal(effects[0].name, 'Jingle Bell Combo');
assert.equal(effects[1].x, cases[0].targetX);
assert.equal(effects[1].y, cases[0].targetY);
assert.equal(effects[2].charged, false);
assert.equal(effects[3].charged, true);
assert(effects[3].max > effects[2].max);
assert(effects.every(f => f.type === 'heroSkill' && f.material));
assert.equal(Hero.owns({ type: 'rogueBellBasic', class: 'ranger' }), false);
assert.equal(Hero.profile({ class: 'rogue', slot: 1, automaticBasic: true }).name, 'Jingle Bell Combo');
assert.equal(Hero.profile({ class: 'paladin', slot: 1, automaticBasic: true }).name, 'Sword Combo');
const rejects = [];
Hero.queue([{ ...cases[0], landed: false }], (f, type) => rejects.push({ f, type }));
assert.equal(rejects.length, 1, 'miss must not invent a contact cue');
const calls = [];
const context = new Proxy({}, {
  get(_, key) {
    if (key === 'canvas') return { width: 512, height: 512 };
    return (...args) => { calls.push([key, ...args]); return undefined; };
  },
  set(_target, key, value) { calls.push(['set', key, value]); return true; },
});
for (const f of effects)
  assert.doesNotThrow(() =>
    Hero.draw(context, e => ({ x: e.x, y: e.y }), f, { width: 512, height: 512 }));
assert(calls.some(e => e[0] === 'quadraticCurveTo'), 'bell outline drawn');
assert(calls.some(e => e[0] === 'arc'), 'bell waves and song area drawn');
const audio = new Audio();
const tones = [];
audio.ctx = { state: 'running', currentTime: 10 };
audio.paused = false;
audio.settings.muted = false;
audio.mixLevel = () => 1;
audio.tone = (...args) => tones.push(args);
audio.playSoundEvent = () => false;
for (const e of cases) {
  assert.equal(audio.supportsType(e.type), true, 'event supported by audio facade');
  assert.equal(audio.heroSkillEffect(e), true);
  audio.ctx.currentTime += 1;
}
assert(tones.length >= cases.length * 2, 'every release needs audible foley');
const count = tones.length;
audio.ctx.currentTime -= 1;
assert.equal(audio.heroSkillEffect(cases[3]), true);
assert.equal(tones.length, count, 'per-form sound throttling');
audio.settings.muted = true;
assert.equal(audio.heroSkillEffect(cases[2]), true);
assert.equal(tones.length, count, 'mute prevents new voices');
assert.equal(audio.heroSkillEffect({ type: 'rogueBellBasic', class: 'ranger' }), false);
console.log('PASS Rogue bell basic/tap/charged/song feedback, miss integrity, mute, voice bounds, original classes');
