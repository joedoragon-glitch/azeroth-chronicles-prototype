'use strict';
// Source-level block probabilities and receipt priority. No rendering or wall-clock RNG.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

const game = new Campaign('normal', 'mage', () => 0.99);
const enemies = game.zone().enemies.filter((e) => e.hp > 0 && !e.neutral);
assert(enemies.length, 'ordinary world creates living enemies');
const enemy = enemies[0];
game.night = () => false;
let rolls = [];
game.rollSkillBlock = () => {
  assert(rolls.length, 'unexpected extra block roll');
  return rolls.shift();
};
function blocks(target, shape, source, samples, criticalExecution = null) {
  rolls = samples.slice();
  const answer = game.skillBlocks(target, shape, { source, criticalExecution });
  assert.equal(rolls.length, 0, 'exactly one roll per eligible skill target');
  return answer;
}
assert(blocks(enemy, 'single', 'hero', [0.19]), 'Mage single 20%');
assert(!blocks(enemy, 'single', 'hero', [0.20]), 'exact single threshold');
assert(blocks(enemy, 'area', 'hero', [0.29]), 'Mage area 30%');
assert(!blocks(enemy, 'area', 'hero', [0.30]), 'exact area threshold');
game.hero.class = 'ranger';
assert(blocks(enemy, 'single', 'hero', [0.14]), 'Ranger single 15%');
assert(!blocks(enemy, 'single', 'hero', [0.15]), 'Ranger single has lower block');
assert(blocks(enemy, 'area', 'hero', [0.24]), 'Ranger area 25%');
assert(!blocks(enemy, 'area', 'hero', [0.25]), 'Ranger area threshold');
game.night = () => true;
assert(blocks(enemy, 'single', 'hero', [0.19]), 'Ranger single at night +5 points');
assert(!blocks(enemy, 'single', 'hero', [0.20]), 'night threshold exact');
game.hero.class = 'mage';
assert(blocks(enemy, 'single', 'hero', [0.24]), 'Mage night single 25%');
assert(blocks(enemy, 'area', 'hero', [0.34]), 'Mage night area 35%');
game.hero.class = 'rogue';
rolls = [];
assert(!game.skillBlocks(enemy, 'area', { source: 'hero' }), 'Rogue performances ignore block');
game.hero.class = 'mage';
rolls = [];
assert(!game.skillBlocks(enemy, 'area', {
  source: 'hero', criticalExecution: { critical: true },
}), 'critical attack cannot be blocked or consume a block roll');
assert(!game.skillBlocks(enemy, 'basic', { source: 'hero' }), 'basic attacks cannot roll');

game.night = () => false;
rolls = [0.1, 0.9, 0.2];
const recipients = [enemy,
  { ...enemy, id: 'area-block-2' },
  { ...enemy, id: 'area-block-3' }];
game.zone().enemies.push(...recipients.slice(1));
assert.deepEqual(recipients.map((e) => game.skillBlocks(e, 'area', { source: 'hero' })),
  [true, false, true], 'AoE rolls independently for each eligible enemy');
assert.equal(rolls.length, 0);
assert.equal(game.effects.filter((e) => e.type === 'skillBlocked').length >= 2, true);
const soldier = game.unit('soldier', game.hero.x, game.hero.y);
soldier.active = true;
game.s.party = [soldier];
assert(blocks(soldier, 'single', enemy.id, [0.19]), 'Soldier has 20% versus hostile skill');
assert(!blocks(soldier, 'single', enemy.id, [0.20]), 'companion single threshold');
assert(blocks(soldier, 'area', enemy.id, [0.29]), 'Soldier has 30% area block');
game.night = () => true;
assert(!blocks(soldier, 'area', enemy.id, [0.30]), 'night does not enhance companions');
rolls = [];
assert(!game.skillBlocks(game.hero, 'area', { source: enemy.id }),
  'current hero classes do not receive passive Block');

delete game.rollSkillBlock;
// The fourth RNG stream must never sample Campaign.random or shift critical streams.
let worldCalls = 0;
game.random = () => { worldCalls++; return 0.01; };
game.s.skillBlockRngState = 0x12345678;
const a = game.rollSkillBlock(), state = game.s.skillBlockRngState;
assert(Number.isFinite(a) && a >= 0 && a < 1);
game.s.skillBlockRngState = 0x12345678;
assert.equal(game.rollSkillBlock(), a, 'restored state yields deterministic roll');
assert.equal(game.s.skillBlockRngState, state, 'state persists reproducibly');
assert.equal(worldCalls, 0, 'no world RNG used');
// Critical AoE casts carry one frozen critical receipt. None of their
// recipients should consume a Block roll or show a false Blocked!.
rolls = [];
assert(recipients.every((e) => !game.skillBlocks(e, 'area', {
  source: 'hero', criticalExecution: { critical: true },
})), 'critical AoE bypasses block for all recipients');

// Existing v4 saves without the optional stream remain legal, while a seeded
// stream resumes exactly and edited/invalid RNG state is rejected.
{
  const savedGame = new Campaign('normal', 'paladin', () => 0.9);
  savedGame.s.skillBlockRngState = 0x12345678;
  const save = savedGame.snapshot();
  assert.equal(Campaign.restore(save).s.skillBlockRngState, 0x12345678,
    'block stream survives save/reload without re-seeding');
  const oldSave = structuredClone(save);
  delete oldSave.skillBlockRngState;
  assert.equal(Campaign.restore(oldSave).s.skillBlockRngState, undefined,
    'legacy v4 saves remain compatible with lazy stream creation');
  const earlierDraft = structuredClone(save);
  earlierDraft.skillEvasionRngState = earlierDraft.skillBlockRngState;
  delete earlierDraft.skillBlockRngState;
  const migrated = Campaign.restore(earlierDraft).s;
  assert.equal(migrated.skillBlockRngState, 0x12345678,
    'earlier draft save retains the exact block RNG state');
  assert.equal(migrated.skillEvasionRngState, undefined,
    'earlier draft field is normalized away');
  const conflicting = structuredClone(save);
  conflicting.skillEvasionRngState = 0x87654321;
  assert.throws(() => Campaign.restore(conflicting), /Invalid skill block RNG state/,
    'reject ambiguous old and new RNG state fields');
  for (const invalid of [0, -1, NaN, 2 ** 32, 'malformed']) {
    const corrupted = structuredClone(save);
    corrupted.skillBlockRngState = invalid;
    assert.throws(() => Campaign.restore(corrupted), /Invalid skill block RNG state/,
      'reject invalid saved block RNG state: ' + String(invalid));
  }
}
console.log('PASS skill block base/ranger/night/rogue/critical/companion/AoE/RNG/save rules');
