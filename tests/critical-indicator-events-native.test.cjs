'use strict';
// Release-only presentation events: no saved stats, no gameplay RNG changes.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Critical = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');
const Party = require('../src/prototype/critical-party-native.js');
const World = require('../src/prototype/critical-world-native.js');
const game = new Campaign('normal','paladin',()=>.9);
assert.equal(game._criticalPartyNative,undefined);
assert.equal(game._criticalWorldNative,undefined);
const oldStats = game.s.statistics.events.length;
const party = Party.createSession(Critical,Levels,{enabled:true,stream:{next:()=>0}});
const world = World.createSession(Critical,Levels,{enabled:true,stream:{next:()=>0}});
const h = party.release(game,'hero/paladin/auto','hero');
const w = world.release(game,'world/basic/melee','enemy-test');
assert(h.critical && w.critical);
const cues = game.effects.filter(e=>e.type==='criticalExecutionRelease');
assert.equal(cues.length,2);
assert.equal(cues[0].source,'hero');
assert.equal(cues[0].group,'hero');
assert.equal(cues[1].source,'enemy-test');
assert.equal(cues[1].group,'world');
assert(cues.every(e=>e.zone===game.zoneId &&
  e.deaths===game.s.statistics.deaths));
assert.equal(game.s.statistics.events.length,oldStats,'cosmetic cues cannot change statistics');
const snapshot = game.snapshot();
assert(!JSON.stringify(snapshot).includes('criticalExecutionRelease'),
  'transient drawing events are not saved');
game.effects.length=0;
const fail = Party.createSession(Critical,Levels,{enabled:true,stream:{next:()=>.99}});
assert(!fail.release(game,'hero/paladin/auto','hero').critical);
assert.equal(game.effects.length,0,'failed roll creates no critical indicator');
console.log('PASS critical indicator release events: party, world, fail, no stats/save changes');
