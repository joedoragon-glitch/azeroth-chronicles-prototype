'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const Cooperative = require('../src/prototype/cooperative');
const original = new Campaign('normal', 'paladin', () => 0.9);
original.s.projectiles.push({ id: 'live-shot', x: 15, damage: 7 });
original.s.hazards.push({ id: 'live-danger', time: 2 });
original.zone().enemies[0].hp -= 9;
original._tacticalThreat = new Map([['enemy', new Map([['hero', [{ damage: 12 }]]])]]);
const before = JSON.stringify(original);
const saveBefore = original.snapshot();
const protoBefore = Object.getOwnPropertyDescriptors(Campaign.prototype);
const session = Cooperative.create({ Campaign, source: original });
assert.equal(session.mode, 'single-player');
assert.deepEqual(session.slots(), { capacity: 2, occupied: 2, humanCompanions: 0 });
assert.deepEqual(session.campaign.s.projectiles, original.s.projectiles);
assert.deepEqual(session.campaign.s.hazards, original.s.hazards);
assert.equal(session.campaign.zone().enemies[0].hp, original.zone().enemies[0].hp);
assert.notEqual(session.campaign.s.projectiles, original.s.projectiles);
assert.notEqual(session.campaign._tacticalThreat, original._tacticalThreat);
session.campaign._tacticalThreat.get('enemy').get('hero')[0].damage = 20;
assert.equal(original._tacticalThreat.get('enemy').get('hero')[0].damage, 12);
assert.deepEqual(session.join({ playerId: 'guest', heroClass: 'ranger' }), {
  ok: false,
  reason: 'companion-slot-required',
});
assert.equal(session.character('guest'), null);
const companion = session.campaign.activeParty()[0];
assert.equal(session.restCompanion('guest', companion.id), false);
assert.equal(session.restCompanion('host', companion.id), true);
for (const playerId of ['', 'host', null])
  assert.equal(session.join({ playerId, heroClass: 'ranger' }).ok, false);
assert.equal(session.join({ playerId: 'guest', heroClass: '__proto__' }).ok, false);
assert.equal(session.join({ playerId: 'guest', heroClass: 'ranger' }).ok, true);
assert.equal(session.mode, 'cooperative');
assert.deepEqual(session.slots(), { capacity: 2, occupied: 2, humanCompanions: 1 });
assert.equal(session.campaign.s.party.length, 2, 'rest preserves the original AI roster');
assert.equal(session.campaign.activeParty().length, 1);
assert.equal(session.join({ playerId: 'other', heroClass: 'mage' }).ok, false);
session.campaign.zone().buildings.push({ id: 'test-barracks', x: 300, y: 350, progress: 4 });
assert.equal(session.activateCompanion('host', companion.id, 'test-barracks'), false);
const hostGold = session.team.gold;
assert.equal(session.spend('guest', 10), true);
assert.equal(session.team.gold, hostGold - 10);
assert.equal(session.character('host').gold, session.character('guest').gold);
assert.equal(session.spend('stranger', 1), false);
assert.equal(session.spend('guest', Infinity), false);
session.team.potions.health = 3;
session.team.weapon = 2;
session.team.reforges['weapon:2'] = true;
for (const id of ['host', 'guest']) {
  assert.equal(session.character(id).potions.health, 3);
  assert.equal(session.character(id).weapon, 2);
  assert.equal(session.character(id).reforges['weapon:2'], true);
}
const partyHp = session.campaign.s.party.map((u) => u.maxHp);
assert.equal(session.awardExperience('guest', session.campaign.xpRequired()), true);
assert.equal(session.character('guest').level, 2);
assert.equal(session.character('host').level, 1);
assert.equal(session.character('guest').talentPoints, 1);
assert.deepEqual(
  session.campaign.s.party.map((u) => u.maxHp),
  partyHp,
);
assert.equal(session.awardExperience('host', 5), true);
assert.equal(session.character('host').xp, 5);
assert.equal(session.character('guest').xp, 0);
for (const amount of [-1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER])
  assert.equal(session.awardExperience('guest', amount), false);
assert.equal(session.awardExperience('stranger', 1), false);
const detached = session.character('guest');
detached.level = 99;
detached.potions.health = 999;
assert.equal(session.character('guest').level, 2);
assert.equal(session.team.potions.health, 3);
assert.throws(() => session.campaign.tick(0.1), /combat simulation/);
assert.throws(() => session.campaign.snapshot(), /persistence/);
assert.throws(() => session.finishSolo(), /Guest must leave/);
assert.equal(session.leave('host'), false);
assert.equal(session.leave('guest'), true);
assert.equal(session.mode, 'single-player');
assert.equal(session.slots().occupied, 1);
assert.equal(session.activateCompanion('guest', companion.id, 'test-barracks'), false);
assert.equal(session.activateCompanion('host', companion.id, 'test-barracks'), true);
assert.equal(
  session.join({ playerId: 'guest', heroClass: 'ranger' }).reason,
  'companion-slot-required',
);
assert.equal(session.restCompanion('host', companion.id), true);
assert.equal(session.connectedCharacter('guest'), null);
assert.equal(session.awardExperience('guest', 1), false);
assert.equal(session.character('guest').level, 2, 'progress is kept for the same guest');
assert.equal(
  session.join({ playerId: 'guest', heroClass: 'mage' }).reason,
  'character-class-mismatch',
);
assert.equal(session.join({ playerId: 'guest', heroClass: 'ranger' }).ok, true);
assert.equal(session.character('guest').level, 2);
session.leave('guest');
const soloBranch = session.finishSolo();
assert.equal(soloBranch.hero.gold, hostGold - 10);
assert.equal(soloBranch.hero.xp, 5);
assert.equal(soloBranch.snapshot().version, 4);
soloBranch.tick(0.01);
assert.throws(() => session.join({ playerId: 'guest', heroClass: 'ranger' }), /closed/);
assert.equal(JSON.stringify(original), before, 'the running single-player campaign is untouched');
assert.deepEqual(original.snapshot(), saveBefore);
assert.deepEqual(Object.getOwnPropertyDescriptors(Campaign.prototype), protoBefore);
for (const a of ['paladin', 'mage', 'ranger'])
  for (const b of ['paladin', 'mage', 'ranger']) {
    const selected = Cooperative.recommendCompanion([a, b], () => 0.1);
    assert(['soldier', 'archer'].includes(selected));
    if (a !== 'paladin' && b !== 'paladin') assert.equal(selected, 'soldier');
    if (a === 'paladin' && b === 'paladin') assert.equal(selected, 'archer');
  }
assert.equal(
  Cooperative.recommendCompanion(['paladin', 'ranger'], () => 0.9),
  'archer',
);
assert.throws(() => Cooperative.recommendCompanion(['paladin', 'mage'], () => 1), /random/);
const succession = new Campaign('normal', 'mage', () => 0.9, { succession: true });
const blocked = Cooperative.create({ Campaign, source: succession });
blocked.restCompanion('host', blocked.campaign.activeParty()[0].id);
assert.equal(
  blocked.join({ playerId: 'guest', heroClass: 'ranger' }).reason,
  'campaign-unavailable',
);
console.log(
  'PASS opt-in co-op roster, slot admission, shared resources, independent progression and live single-player preservation',
);
