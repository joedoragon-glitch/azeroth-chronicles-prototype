'use strict';
// Native release validation on the actual production application shell.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Critical = require('../src/prototype/critical-executions.js');
const { shell } = require('./helpers/production-shell.cjs');
for (const lang of ['en','es']) {
  const { scope, storage } = shell(lang);
  const g = scope.Prototype.game;
  assert(g._criticalPartyNative?.enabled, 'Party session active in saved PWA game');
  assert(g._criticalWorldNative?.enabled, 'World session active in saved PWA game');
  assert.deepEqual(Object.keys(g.s.criticalStreams).sort(), ['party','world']);
  assert.equal(g._criticalPartyNative.criticalLevels().hero, 1);
  assert.equal(g._criticalPartyNative.criticalLevels().companion, 1);
  assert.equal(g._criticalWorldNative.criticalLevels().world, 1);
  const start={...g.s.criticalStreams};
  const hero=g._criticalPartyNative.release(g,'hero/paladin/auto','hero');
  assert.equal(hero.intensity,1); assert.equal(hero.chance,.1);
  assert.notEqual(g.s.criticalStreams.party,start.party);
  assert.equal(g.s.criticalStreams.world,start.world);
  const enemy=g._criticalWorldNative.release(g,'world/basic/melee','enemy-a');
  assert.equal(enemy.intensity,1);
  assert.notEqual(g.s.criticalStreams.world,start.world);
  const snap=g.snapshot();
  assert.equal(snap.version,4);
  assert.deepEqual(snap.criticalStreams,g.s.criticalStreams);
  storage.set('azeroth-v4-normal',JSON.stringify(snap));
  const resumed=shell(lang,'paladin',{storage}).scope.Prototype.game;
  assert(resumed._criticalPartyNative?.enabled&&resumed._criticalWorldNative?.enabled);
  assert.deepEqual(resumed.s.criticalStreams,snap.criticalStreams,
    'existing saved critical RNG must not be reseeded on load');
  const expected=Critical.seededStream(snap.criticalStreams.party);
  expected.next();
  resumed._criticalPartyNative.release(resumed,'hero/paladin/auto','hero');
  assert.equal(resumed.s.criticalStreams.party,expected.snapshot(),
    'resumed critical roll matches independent saved stream');
}
const fresh=shell('en','paladin',{seedSave:false}).scope.Prototype.game;
assert(fresh._criticalPartyNative?.enabled&&fresh._criticalWorldNative?.enabled,
  'new player run has active criticals');
assert.equal(Campaign.prototype._criticalPartyNative,undefined,
  'live shell must not patch isolated Campaign tests globally');
console.log('PASS live production Party/World critical sessions, Level 1, v4 RNG resume and fresh starts');
