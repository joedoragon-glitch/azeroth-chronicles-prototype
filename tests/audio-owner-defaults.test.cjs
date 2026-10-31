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

console.log('PASS approved fresh defaults, saved preferences and nearby-only combat-audio observation');
