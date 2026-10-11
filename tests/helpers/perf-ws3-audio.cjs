'use strict';
const Audio = require('../../src/prototype/audio.js');
const { audio } = require('./audio-context.cjs');
const fixture = require('../fixtures/perf-ws3-audio-baseline.json');
class BaselineAudio extends Audio {}
for (const [name, source] of Object.entries(fixture.methods))
  BaselineAudio.prototype[name] = new Function('return ({' + source + '})')()[name];
function createAudio(baseline = false) {
  const instance = audio();
  if (baseline) Object.setPrototypeOf(instance, BaselineAudio.prototype);
  return instance;
}
function campaign(size = 64, extra = {}) {
  const enemies = Array.from({ length: size }, (_, i) => ({
    hp: i % 7 === 0 ? 0 : 100,
    aggro: i % 3 !== 0,
    neutral: i % 11 === 0,
    type: i === 17 || i === 31 ? 'boss' : 'enemy',
    family: i === 17 ? 'thorn' : 'crypt',
    form: i === 17 ? 'normal' : 'true',
    name: 'Enemy ' + i,
  }));
  const zone = { enemies, npcs: [{ id: 'refuge', kind: 'rest', x: 400, y: 0 }] };
  return {
    hero: { x: 0, y: 0, hp: 20, maxHp: 100 },
    s: { challenge: { gameOver: false } },
    zoneId: 'vale',
    peace: false,
    zone: () => zone,
    definition: () => ({ id: 'vale' }),
    supplyRoom: () => false,
    sideDungeon: () => false,
    isDungeon: () => false,
    night: () => false,
    ...extra,
  };
}
module.exports = { createAudio, campaign, baseline: fixture.baseline };
