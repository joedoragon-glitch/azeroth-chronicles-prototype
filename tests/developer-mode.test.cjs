'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Persistence = require('../src/prototype/persistence.js');

const normal = new Campaign('normal', 'paladin', () => 0.5);
assert.equal(normal.developerCombatSnapshot(), null);
assert.equal(normal.developerSummon('boss:thorn:normal'), null);
assert.equal(normal.developerSummonOptions().length, 0);

const dev = new Campaign('developer', 'paladin', () => 0.5);
assert.equal(dev.cast(1), false, 'Skill 1 is disabled');
assert.deepEqual(dev.developerSummonOptions().filter((x) => x.kind === 'boss').map((x) => x.form).slice(0, 2), ['normal', 'true']);
assert(dev.developerSummonOptions().some((x) => x.id === 'captain:supply-vale'));
assert(!dev.developerSummonOptions().some((x) => x.id === 'captain:frontier-overseer'));
assert.equal(dev.developerSummon('boss:warlord:true'), null, 'cross-region spawn rejected');

const deaths = dev.s.statistics.deaths;
dev.hitParty(dev.hero, 100000);
assert.equal(dev.hero.hp, dev.hero.maxHp, 'fatal hit restores HP');
assert.equal(dev.s.statistics.deaths, deaths);
assert.equal(dev.s.challenge.pending, false);
const incoming = dev.developerCombatSnapshot().incoming;
assert.equal(incoming.last.length, 1);
assert(incoming.last[0] > 0);
assert(incoming.dps > 0);

const summoned = dev.developerSummon('boss:thorn:true');
assert(summoned && summoned.type === 'boss' && summoned.form === 'true');
assert.equal(summoned.neutral, false);
assert.equal(summoned.aggro, true);
assert.equal(summoned.developerSummon, true);
assert.equal(summoned.summon, true);
dev.damage(summoned, 25, 'hero');
assert(dev.developerCombatSnapshot().outgoing.last.length > 0);
const kills = dev.s.statistics.kills;
summoned.hp = 0;
dev.kill(summoned);
assert.equal(dev.s.statistics.kills, kills);
assert.equal(dev.s.true.thorn, undefined, 'no campaign victory');

const captain = dev.developerSummon('captain:supply-vale');
assert(captain && captain.captain && captain.roomCaptain);
assert.equal(captain.captainProfile, 'supply-vale');
assert.equal(captain.aggro, true);
assert(Campaign.restore(dev.snapshot()).s.mode === 'developer');

const store = new Map();
const storage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, value) => store.set(key, value),
};
const persistence = Persistence.create({ storage, Campaign });
const profile = { activeMode: 'normal', nightmareUnlocked: false };
persistence.save(dev, profile);
assert.equal(profile.activeMode, 'normal');
assert(persistence.exists('developer'));
assert(!persistence.exists('normal'));
console.log('PASS Developer Mode isolation, immortality, disabled Skill 1, hostile regional summons and combat telemetry');
