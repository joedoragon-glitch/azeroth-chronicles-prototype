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

// A future class can be announced in the registry without inheriting a
// Ranger projectile or charged Skill 1. The current classes' ranges remain.
{
  const expected = { paladin: 105, mage: 350, ranger: 350 };
  for (const [id, reach] of Object.entries(expected)) {
    const c = new Campaign('normal', id, () => 0.9);
    assert.equal(c.heroBasicAttackApproachRange(), reach);
    assert(c.heroSkillRange(1) > 0);
  }
  const c = new Campaign('normal', 'mage', () => 0.9);
  c.hero.class = 'rogue'; // Dormant only, no playable class registered.
  assert.equal(c.heroBasicAttackApproachRange(), 260);
  assert.equal(c.heroSkillRange(1), 260);
  assert.equal(c.heroSkillRange(1, true), 300);
  const snapshot = c.snapshot();
  assert.equal(c.cast(1), false, 'unknown skill dispatch cannot become a Mage/Ranger cast');
  assert.deepEqual(c.snapshot(), snapshot, 'unsupported cast is inert');
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

// The Rogue cannot newly hire conventional troops, even if an internal
// service API is called directly. Existing companions can still be inherited.
{
  const g = new Campaign('normal', 'mage', () => 0.9);
  g.s.expeditionRank = 2;
  g.hero.gold = 1000;
  g.hero.class = 'rogue'; // Capability probe only, not a playable class.
  const b = {
    id: 'no-hire-cap', kind: 'barracks', x: g.hero.x, y: g.hero.y,
    progress: 4, full: false, queue: 0, queueType: null,
  };
  g.zone().buildings.push(b);
  const before = g.snapshot();
  assert.match(g.companionRecruitmentReason('soldier'), /cannot hire/);
  assert.match(g.companionRecruitmentReason('archer', b.id), /cannot hire/);
  assert.equal(g.recruit('soldier'), false);
  assert.equal(g.train(b.id, 'archer'), false);
  assert.equal(g.requestCompanionRecruitment('soldier'), false);
  assert.equal(g.requestCompanionRecruitment('archer', b.id), false);
  assert.deepEqual(g.snapshot(), before, 'no crowns, queues or recruits changed');
}

// Succession changes the hero, not ownership of the company's people.
// Rogue may inherit and command previously recruited soldiers/rangers but
// may neither receive free conventional starters nor hire replacements.
{
  const g = new Campaign('normal', 'mage', () => 0.9, { succession: true });
  g.s.expeditionRank = 4;
  const inheritedSoldier = g.s.party[0],
    inheritedArcher = g.s.party[1],
    anotherArcher = g.unit('archer', 390, 390);
  anotherArcher.active = false;
  g.s.party.push(anotherArcher);
  const originalIds = g.s.party.map((u) => u.id);
  const oldClasses = Object.keys(classes);
  try {
    classes.rogue = { ...classes.ranger };
    Campaign.talentProfiles.rogue = { ...Campaign.talentProfiles.ranger };
    g.s.challenge.fallen = ['mage'];
    g.s.challenge.pending = true;
    g.hero.hp = 0;
    assert(g.successor('rogue'));
    assert.equal(g.hero.class, 'rogue');
    assert.deepEqual(g.s.party.map((u) => u.id), originalIds);
    assert.equal(inheritedSoldier.active, true);
    assert.equal(inheritedArcher.active, true);
    assert.equal(anotherArcher.active, false);
    assert.equal(g.activeParty().length, 2, 'Rogue inherits existing deployed allies');
    const barracks = {
      id: 'inherited-company', kind: 'barracks', progress: 4,
      full: true, x: g.hero.x + 80, y: g.hero.y, queue: 0,
    };
    g.zone().buildings.push(barracks);
    g.zone().enemies = [];
    assert.equal(g.companionActivationReason(anotherArcher.id, barracks.id), '');
    assert.equal(g.activateCompanion(anotherArcher.id, barracks.id), true);
    assert.equal(g.activeParty().length, 3);
    assert.deepEqual(g.s.party.map((u) => u.id), originalIds);
    assert.match(g.companionRecruitmentReason('soldier'), /cannot hire/);
    assert.match(g.companionRecruitmentReason('archer', barracks.id), /cannot hire/);
    assert.doesNotThrow(() => Campaign.validate(copy(g.snapshot())));
  } finally {
    delete classes.rogue;
    delete Campaign.talentProfiles.rogue;
    assert.deepEqual(Object.keys(classes), oldClasses);
  }
}

// Charm provenance is UI-only preparation today; imported records may not
// impersonate future captured creatures until the authenticated save schema
// and species allowlist are implemented.
{
  const g = new Campaign('normal', 'mage', () => 0.9);
  const baseline = g.snapshot();
  assert.doesNotThrow(() => Campaign.validate(copy(baseline)));
  const forged = copy(baseline);
  forged.party[0].charmOrigin = { typeId: 'enemy:goblin:ranged', typeName: 'Goblin Slinger' };
  assert.throws(() => Campaign.validate(forged), /Invalid charm provenance/);
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

  const secondDeathPending = copy(gameOverThree);
  secondDeathPending.challenge = {
    succession: true, fallen: ['mage', 'paladin'], pending: true, gameOver: false,
  };
  assert.doesNotThrow(() => Campaign.validate(copy(secondDeathPending)),
    'with four classes, second death still offers two successor choices');
  const prematureThirdPending = copy(secondDeathPending);
  prematureThirdPending.challenge.fallen.push('ranger');
  assert.throws(() => Campaign.validate(prematureThirdPending), /Invalid succession state/,
    'one class remaining must auto-succeed, never remain pending');

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
