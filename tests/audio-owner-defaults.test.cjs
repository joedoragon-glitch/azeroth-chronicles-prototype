'use strict';
// Narrow owner-selected sound-default and audio-proximity acceptance.
// Independent of legacy full-campaign boss/ending test fixtures.
const assert = require('node:assert/strict');
const Audio = require('../src/prototype/audio.js');
const Campaign = require('../src/prototype/engine.js');

const fresh = new Audio();
assert.equal(fresh.ctx, null, 'audio construction must not start Web Audio');
assert.deepEqual(fresh.settings, {
  master: 0.33, music: 1, ambience: 1, effects: 1, interface: 1, muted: false,
}, 'new profiles use the approved mix');

const saved = {
  master: 0.65, music: 0.21, ambience: 0.52, effects: 0.72, interface: 0.70, muted: false,
};
const existing = new Audio(saved);
assert.deepEqual(existing.settings, saved, 'preexisting preferences take precedence');
existing.setSettings({ muted: true });
assert.deepEqual({ ...existing.settings, muted: false }, saved,
  'mute must preserve every saved channel');

const campaign = new Campaign();
const director = new Audio();
const enemy = campaign.zone().enemies.find(e => e.hp > 0 && !e.neutral);
assert(enemy, 'fixture must include a living ordinary enemy');
enemy.aggro = true;
enemy.x = campaign.hero.x + 2000;
enemy.y = campaign.hero.y;
let scene = director.describe(campaign, { started: true });
assert(scene.engaged >= 1, 'distant enemy retains its original gameplay aggro observation');
assert.equal(scene.nearbyEngaged, 0, 'distant enemy cannot intensify local audio');
enemy.x = campaign.hero.x + 200;
scene = director.describe(campaign, { started: true });
assert(scene.nearbyEngaged >= 1, 'nearby fighting still raises local combat audio');

// A saved hero in Millhaven must never make the title synthesize the
// Greenwood melody while the dedicated title MP3 is being fetched/decoded.
const { audio: fakeAudio } = require('./helpers/audio-context.cjs');
const titleDirector = fakeAudio();
titleDirector.enableProduction();
titleDirector.sceneDetails = () => {};
titleDirector.updateEnvironment = () => {};
titleDirector.ambient = () => {};
titleDirector.setRecordedScore = () => new Promise(() => {}); // pending title load
titleDirector.update(campaign, false, { started: false });
assert.equal(titleDirector.cue.id, 'title-fallback',
  "the title fallback must not select the saved region");
assert.equal(titleDirector.productionCue(titleDirector.context).id, 'title',
  'the authored title recording must remain the actual production choice');
const tones = [];
titleDirector.tone = (...args) => tones.push(args);
titleDirector.next = titleDirector.ctx.currentTime + 0.05;
titleDirector.schedule();
assert.deepEqual(tones.map(t => t[0]), [48, 55],
  'the title fallback is a subdued independent pad, not a regional melody');
assert(tones.every(t => t[4] === 'sine' && t[5] === 'music'),
  'title fallback must not emit regional percussion or environment events');
titleDirector.recordedScore = { id: 'title', at: titleDirector.ctx.currentTime };
titleDirector.schedule();
assert.equal(tones.length, 2, 'recorded title silences subsequent procedural scheduling');
titleDirector.recordedScore = null;
titleDirector.update(campaign, false, { started: true });
assert.notEqual(titleDirector.cue.id, 'title-fallback',
  'gameplay restores the saved location music only after Continue');

console.log('PASS approved fresh defaults, saved preferences, nearby combat and isolated title fallback');
