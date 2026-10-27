'use strict';

// Draft PR #511 infrastructure-only regression coverage.
// Rogue must remain unselectable until its authored gameplay is implemented.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

const copy = (value) => JSON.parse(JSON.stringify(value));
const classes = Campaign.classes;
const activeCaps = Campaign.rules.balance.companions.activeCaps;

assert.deepEqual(Object.keys(classes), ['paladin', 'mage', 'ranger']);
assert.deepEqual(activeCaps, [0, 2, 3, 3, 4, 5, 6]);
assert.equal(Campaign.activeSlotBonuses.rogue, 1);
assert.equal(Campaign.expeditionPartyCapFor('paladin', 6), 6);
assert.equal(Campaign.expeditionPartyCapFor('rogue', 6), 7);

for (const heroClass of Object.keys(classes)) {
  const c = new Campaign('normal', heroClass, () => 0.9);
  assert.deepEqual(c.s.party.map((u) => u.type), ['soldier', 'archer']);
  for (let rank = 1; rank <= 6; rank++) {
    c.s.expeditionRank = rank;
    assert.equal(c.expeditionPartyCap(), activeCaps[rank], heroClass + ' rank ' + rank);
  }
  c.hero.class = 'rogue'; // Probe the dormant capacity policy, not Rogue gameplay.
  assert.equal(c.expeditionPartyCap(1), 3);
  assert.equal(c.expeditionPartyCap(6), 7);
}

// Inert fourth-class contract: independent type quota = Rogue Expedition cap.
{
  const candidate = require('../tools/rogue-bard/rogue-bard-candidate.json');
  const caps = candidate.proposal.capacity;
  assert.deepEqual(caps.charmTypeOwnershipRank1To6, [3, 4, 4, 5, 6, 7]);
  assert.deepEqual(caps.rogueBasicBarracksRank1To6, [3, 3, 3, 3, 3, 3]);
  assert(!Object.hasOwn(candidate.proposal.charm, 'proposedTotalPermanentCharmedRosterCap'));
  const game = new Campaign('normal', 'mage', () => 0.9);
  game.hero.class = 'rogue';
  for (let rank = 1; rank <= 6; rank++) {
    game.s.expeditionRank = rank;
    assert.equal(game.expeditionPartyCap(), caps.charmTypeOwnershipRank1To6[rank - 1]);
    assert.equal(game.barracksFieldCap({ full: false }), 3);
    assert.equal(game.barracksFieldCap({ full: true }), caps.rogueFullBarracksRank1To6[rank - 1]);
  }
}
for (const [heroClass, type, firstSix] of [
  ['mage', 'archer', [[-34, -24], [34, -24], [0, -52], [-62, -45], [62, -45], [0, -78]]],
  ['mage', 'soldier', [[0, 95], [-90, 45], [90, 45], [-110, -25], [110, -25], [0, -105]]],
  ['paladin', 'soldier', [[-42, -20], [42, -20], [0, -55], [-68, -50], [68, -50], [0, 35]]],
  ['paladin', 'archer', [[-65, -115], [65, -115], [0, -145], [-105, -145], [105, -145], [0, -175]]],
]) {
  const c = new Campaign('normal', heroClass, () => 0.9);
  const living = Array.from({ length: 7 }, (_, i) => c.unit(type, 300 + i * 4, 350));
  c.s.party = living;
  const offsets = living.map((u) => c.partyFormationOffset(u, living));
  assert.deepEqual(offsets.slice(0, 6), firstSix, heroClass + '/' + type + ' original slots unchanged');
  assert.equal(new Set(offsets.map((o) => o.join(','))).size, 7, heroClass + '/' + type + ' has seven unique slots');
}

// Ordinary Expedition text is byte-for-byte unchanged; a future Rogue's
// display is derived from the same class cap, never from the old six-slot copy.
{
  const c = new Campaign('normal', 'mage', () => 0.9);
  assert.deepEqual([2, 3, 4, 5, 6].map((rank) => c.expeditionUnlock(rank)), [
    'Recruitment + resources · active group 3',
    'Manual squad doctrine',
    'Full Barracks upgrade · active group 4',
    'Active group 5',
    'Active group 6',
  ]);
  c.hero.class = 'rogue';
  assert.deepEqual([2, 3, 4, 5, 6].map((rank) => c.expeditionUnlock(rank)), [
    'Resources · active group 4',
    'Manual squad doctrine',
    'Full Barracks upgrade · active group 5',
    'Active group 6',
    'Active group 7',
  ]);
}

// The extra Rogue slot cannot corrupt a later six-slot successor's save:
// keep every owned ID, rest only deterministic overflow, never delete pets.
{
  const c = new Campaign('normal', 'paladin', () => 0.9, { succession: true });
  c.s.expeditionRank = 6;
  while (c.s.party.length < 7) c.s.party.push(c.unit('archer', 300, 350));
  const ids = c.s.party.map((u) => u.id),
    last = c.s.party.at(-1);
  c.s.challenge.fallen = ['paladin'];
  c.s.challenge.pending = true;
  c.hero.hp = 0;
  assert(c.successor('mage'));
  assert.deepEqual(c.s.party.map((u) => u.id), ids, 'all inherited identities survive');
  assert.equal(c.activeParty().length, 6);
  assert.equal(last.active, false, 'last active member rests, not deleted');
  assert.doesNotThrow(() => Campaign.validate(c.snapshot()));
}

// Succession validator should track the actual playable class registry, not 3.
const c = new Campaign('normal', 'paladin', () => 0.9);
const gameOverThree = c.snapshot();
gameOverThree.challenge = {
  succession: true,
  fallen: ['paladin', 'mage', 'ranger'],
  pending: false,
  gameOver: true,
};
gameOverThree.hero.hp = 0;
assert.doesNotThrow(() => Campaign.validate(copy(gameOverThree)));
const invalidThree = copy(gameOverThree);
invalidThree.challenge.fallen.pop();
assert.throws(() => Campaign.validate(invalidThree), /Invalid succession state/);

// Test future four-class validation by temporarily augmenting the registry.
// This does not register Rogue in the shipped game and does not instantiate it.
try {
  classes.rogue = { ...classes.ranger };
  const incompleteFour = copy(gameOverThree);
  assert.throws(() => Campaign.validate(incompleteFour), /Invalid succession state/);
  const gameOverFour = copy(gameOverThree);
  gameOverFour.challenge.fallen.push('rogue');
  assert.doesNotThrow(() => Campaign.validate(gameOverFour));

  const withSeven = new Campaign('normal', 'paladin', () => 0.9);
  withSeven.s.expeditionRank = 6;
  while (withSeven.s.party.length < 7) {
    withSeven.s.party.push(withSeven.unit('soldier', 300, 350));
  }
  const sevenActiveRogue = withSeven.snapshot();
  sevenActiveRogue.hero.class = 'rogue';
  assert.doesNotThrow(() => Campaign.validate(copy(sevenActiveRogue)), 'seven active allowed for future Rogue');
  sevenActiveRogue.hero.class = 'paladin';
  assert.throws(() => Campaign.validate(sevenActiveRogue), /Invalid party/, 'old classes still capped at six');
} finally {
  delete classes.rogue;
}

console.log('PASS draft fourth-class readiness: legacy caps, seventh slot, dynamic Succession and save admission');
