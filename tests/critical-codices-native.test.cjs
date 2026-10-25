'use strict';
// One permanent collectible in each of five existing optional interiors.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const c = new Campaign('normal', 'paladin', () => .91);
assert.equal(c.s.version, 4);
assert.equal(Object.keys(Campaign.rules.criticalCodices).length, 5);
assert.equal(c.criticalCodexCount(), 0);
assert.equal(c.criticalPartyChance('hero'), .1);
const ids = [];
for (const side of Campaign.rules.sideDungeons) {
  assert(c.enter(side.id), 'original optional interior remains reachable ' + side.id);
  const z = c.zone();
  const books = z.npcs.filter((n) => n.kind === 'critical-codex');
  assert.equal(books.length, 1, 'exactly one inspectable book per side interior');
  const book = books[0];
  assert.equal(book.sideCodex, side.id);
  assert.equal(book.id, 'critical-codex-' + side.id);
  assert(!z.enemies.some((e) => e.type === 'boss'), 'no side boss introduced');
  assert.equal(z.nodes.length, 0, 'no new gathering materials');
  const before = c.criticalCodexCount();
  Object.assign(c.hero, { x: book.x, y: book.y });
  assert(c.interact(book), 'first book learned');
  ids.push(side.id);
  assert.equal(c.criticalCodexCount(), before + 1);
  assert(c.interact(book), 'repeat inspect is harmless');
  assert.equal(c.criticalCodexCount(), before + 1, 'no re-entry duplicate');
  const saved = c.snapshot();
  assert.equal(saved.version, 4);
  const restored = Campaign.restore(saved, () => .91);
  assert.equal(restored.criticalCodexCount(), before + 1, 'v4 restore keeps learned book');
  assert(restored.s.criticalCodices[side.id]);
}
assert.equal(new Set(ids).size, 5);
assert(Math.abs(c.criticalPartyChance('hero') - .15) < 1e-10);
c.s.party.push({ id: 'codex-test-soldier', type: 'soldier' });
c.s.party.push({ id: 'codex-test-pet', type: 'pet' });
assert.equal(c.criticalPartyChance('codex-test-soldier'), .1);
c.s.expeditionSkills.sharedTraining = 3;
assert(Math.abs(c.criticalPartyChance('codex-test-soldier') - .13) < 1e-10);
assert(Math.abs(c.criticalPartyChance('codex-test-pet') - .13) < 1e-10);
assert.equal(c.criticalPartyChance('unknown'), .1, 'unrelated actor gets no book bonus');
// Pre-feature saves may already contain every optional interior. Restore
// inserts its missing book without rebuilding that saved inhabitant roster.
{
  const visited = new Campaign('normal', 'mage', () => .91);
  const side = Campaign.rules.sideDungeons[0];
  assert(visited.enter(side.id));
  const historical = visited.snapshot();
  delete historical.criticalCodices;
  historical.zones[side.id].npcs =
    historical.zones[side.id].npcs.filter((n) => n.kind !== 'critical-codex');
  const oldCount = historical.zones[side.id].enemies.length;
  const again = Campaign.restore(historical, () => .91);
  const patched = again.s.zones[side.id];
  assert.equal(patched.npcs.filter((n) => n.kind === 'critical-codex').length, 1);
  assert.equal(patched.enemies.length, oldCount, 'no extra old-zone population');
}
const legacy = new Campaign('normal', 'mage', () => .9).snapshot();
delete legacy.criticalCodices;
assert.equal(Campaign.restore(legacy, () => .9).criticalCodexCount(), 0,
  'old v4 campaign without books remains valid');
const invalid = new Campaign('normal', 'ranger', () => .9).snapshot();
invalid.criticalCodices = { 'made-up-dungeon': true };
assert.throws(() => Campaign.validate(invalid), /Codex/);
invalid.criticalCodices = { [ids[0]]: 4 };
assert.throws(() => Campaign.validate(invalid), /Codex/);
console.log('PASS 5 side Codices: visible, single-claim, re-entry, existing v4, live inheritance, invalid saves');
