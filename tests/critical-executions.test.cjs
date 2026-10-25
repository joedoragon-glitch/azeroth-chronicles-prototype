'use strict';
// Focused Stage 1 module tests, independent of campaign, browser and game scripts.
const assert = require('node:assert/strict');
const Crit = require('../src/prototype/critical-executions.js');

assert.deepEqual(Crit.BASE_CHANCE, { party: 0.1, world: 0.1 });
assert(Object.isFrozen(Crit.BASE_CHANCE));
assert.equal(Crit.chanceFor('party'), 0.1);
assert.equal(Crit.chanceFor('world'), 0.1);
assert(Math.abs(Crit.chanceFor('party', { partyBonus: 0.05, worldModifier: 0.35 }) - 0.15) < 1e-12);
assert(Math.abs(Crit.chanceFor('world', { partyBonus: 0.05, worldModifier: 0.35 }) - 0.45) < 1e-12);
assert.equal(Crit.chanceFor('party', { partyBonus: 2 }), 1);
assert.equal(Crit.chanceFor('world', { worldModifier: -2 }), 0);
assert.throws(() => Crit.chanceFor('everyone'), /domain/);
assert.throws(() => Crit.chanceFor('party', { partyBonus: NaN }), /bonus/);
assert.throws(() => Crit.chanceFor('world', { worldModifier: Infinity }), /bonus/);

let calls = 0;
const source = { next() { calls++; return 0.08; } };
const off = Crit.createResolver({ stream: source });
const action = {};
assert.equal(off.enabled, false);
assert.equal(off.release({ action, key: 'hero/paladin/1-tap', domain: 'party', released: true }), null);
assert.equal(off.release({ action, key: 'hero/paladin/1-tap', domain: 'party' }), null);
assert.equal(calls, 0, 'OFF never consumes RNG');
assert.throws(() => Crit.createResolver({ enabled: true }), /isolated random/);
assert.throws(() => Crit.createResolver({ enabled: 'true' }), /feature gate/);

const on = Crit.createResolver({ enabled: true, stream: source });
assert.equal(on.release({ action, key: 'hero/paladin/1-tap', domain: 'party' }), null);
assert.equal(calls, 0, 'windup/cancel is not a critical roll');
const hit = on.release({ action, key: 'hero/paladin/1-tap', domain: 'party', released: true });
assert.equal(calls, 1);
assert.equal(hit.critical, true);
assert.equal(hit.chance, 0.1);
assert(Object.isFrozen(hit));
assert.strictEqual(on.release({ action, key: hit.key, domain: 'party', released: true }), hit);
assert.equal(calls, 1, 'same released action has exactly one roll');
assert.throws(() => on.release({ action, key: 'enemy/wolf/melee', domain: 'world', released: true }), /identity changed/);
assert.equal(calls, 1, 'wrong action identity never rerolls');
assert.deepEqual([hit, hit, hit].map(x => x.critical), [true, true, true], 'burst child impacts reuse release receipt');
const second = on.release({ action: {}, key: 'enemy/wolf/melee', domain: 'world', released: true });
assert.equal(second.critical, true);
assert.equal(calls, 2, 'new release rolls once');
assert.throws(() => on.release({ action: {}, key: '', domain: 'party', released: true }), /identity/);
assert.throws(() => on.release({ action: {}, key: 'a', domain: 'neither', released: true }), /domain/);
assert.equal(calls, 2, 'malformed releases never sample');

let samples = [0.1000000001, 0.0999999999, 0, 0.99];
const exact = Crit.createResolver({ enabled: true, stream: { next: () => samples.shift() } });
assert.equal(exact.release({ action: {}, key: 'a', domain: 'party', released: true }).critical, false);
assert.equal(exact.release({ action: {}, key: 'b', domain: 'party', released: true }).critical, true);
assert.equal(exact.release({ action: {}, key: 'c', domain: 'world', released: true }).critical, true);
assert.equal(exact.release({ action: {}, key: 'd', domain: 'world', released: true }).critical, false);
assert.throws(() => Crit.createResolver({ enabled: true, stream: { next: () => 1 } })
  .release({ action: {}, key: 'a', domain: 'world', released: true }), /random sample/);

for (const bad of [-1, 0x100000000, 1.5, NaN, Infinity])
  assert.throws(() => Crit.seededStream(bad), /seed/);
const seeded1 = Crit.seededStream(0);
const seeded2 = Crit.seededStream(0);
const firstThree = Array.from({ length: 3 }, () => seeded1.next());
assert(firstThree.every(v => v >= 0 && v < 1));
assert.deepEqual(firstThree, Array.from({ length: 3 }, () => seeded2.next()));
const checkpoint = seeded1.snapshot();
const later = Array.from({ length: 4 }, () => seeded1.next());
seeded1.restore(checkpoint);
assert.deepEqual(Array.from({ length: 4 }, () => seeded1.next()), later);
assert.throws(() => seeded1.restore(-1), /state/);

// The consumer's ordinary campaign random stream stays untouched.
let worldCalls = 0;
const worldRandom = () => { worldCalls++; return 0.5; };
const seeded = Crit.seededStream(19);
const resolver = Crit.createResolver({ enabled: true, stream: seeded });
for (let i = 0; i < 100; i++) {
  resolver.release({ action: {}, key: 'hero/mage/1-charged', domain: 'party', released: true });
}
assert.equal(worldCalls, 0, 'isolated critical stream does not borrow global world random');
worldRandom();
assert.equal(worldCalls, 1);

console.log('Stage 1 critical-executions: focused Node contract checks passed.');
