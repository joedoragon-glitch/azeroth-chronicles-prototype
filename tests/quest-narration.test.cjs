'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Campaign = require('../src/prototype/engine.js');
const prose = require('../src/prototype/narration.js');

// 1-based review decisions map directly onto stable quest-0 through quest-29.
const cut = [1, 2, 3, 7, 8, 10, 12, 13, 14, 15, 17, 19, 22, 25, 26, 27, 28];
const keep = [20, 21];
const rewrite = [4, 5, 6, 9, 11, 16, 18, 23, 24, 29];
const milestone = [30];
const decisions = new Map();
for (const [kind, numbers] of [
  ['cut', cut],
  ['keep', keep],
  ['rewrite', rewrite],
  ['milestone', milestone],
])
  for (const number of numbers) {
    assert(!decisions.has(number), 'Each quest has exactly one decision');
    decisions.set(number, kind);
  }
assert.equal(decisions.size, 30, 'All regional quests have reviewed dispositions');
assert.equal(prose.length, 30);
const quests = new Campaign('normal', 'paladin', () => 0.9)
  .questDefs()
  .filter((q) => q.id !== 'quest-barracks');
assert.equal(quests.length, 30);
const keptOriginals = new Map([
  [
    20,
    'Convoys, repair yards, guarded crossings: the occupation needs more than soldiers to keep its roads.',
  ],
  [
    21,
    'Eren is free of Abyss Bastion. Its dragon preparations were built for war, not ordinary travelers.',
  ],
]);
const authored = prose.filter(Boolean);
assert.equal(authored.length, 13, 'Only approved events are announced');
assert.equal(new Set(authored.map((x) => x.text)).size, authored.length);
for (let i = 0; i < prose.length; i++) {
  const number = i + 1;
  const disposition = decisions.get(number);
  const entry = prose[i];
  if (disposition === 'cut') {
    assert.equal(entry, null, 'Cut quest ' + number + ' has no narration');
    continue;
  }
  assert(entry && typeof entry === 'object', 'Selected quest has a typed announcement');
  assert.equal(entry.kind, disposition === 'milestone' ? 'milestone' : 'narration');
  assert.equal(typeof entry.text, 'string');
  assert(
    entry.text.trim().length >= 45 && entry.text.length <= 180,
    'Selected quest ' + number + ' remains compact',
  );
  assert(!/reward delivered|quest complete|\\+\\d+ XP|\\b\\d+ crowns\\b/i.test(entry.text), 'No reward receipt');
  assert(!/^(you (see|notice|discover)|quest)/i.test(entry.text), 'No generic event feed');
  if (disposition === 'keep')
    assert.equal(entry.text, keptOriginals.get(number), 'Approved keep is unchanged');
}
assert(prose[29].text.includes('fortress gate'), 'Final approach is a significant event');

for (let i = 0; i < quests.length; i++) {
  const c = new Campaign('normal', 'paladin', () => 0.9);
  const q = c.questDefs().find((quest) => quest.id === 'quest-' + i);
  assert(q, 'Quest id preserved');
  const record = c.s.quests[q.id];
  record.done = true;
  const before = { crowns: c.hero.gold, xp: c.hero.xp };
  c.checkQuests();
  assert.equal(record.paid, true, 'Quest still automatically pays');
  assert.equal(c.s.statistics.events.filter((e) => e.type === 'questComplete' && e.id === q.id).length, 1);
  assert(c.hero.gold >= before.crowns + q.gold, 'Quest crowns remain unchanged');
  if (q.xp > 0) assert(c.hero.xp !== before.xp || c.hero.level > 1, 'Quest XP is awarded');
  const cards = c.notices.filter((n) => n.kind === 'narration' || n.text === prose[i]?.text);
  if (prose[i]) {
    assert.equal(cards.length, 1, 'Exactly one selected card for ' + q.id);
    assert.equal(cards[0].text, prose[i].text);
    assert.equal(cards[0].kind, prose[i].kind);
    assert.equal(cards[0].duration, prose[i].kind === 'milestone' ? 5.5 : 6.8);
  } else assert.equal(cards.length, 0, 'No unwanted card for cut ' + q.id);
  c.checkQuests();
  assert.equal(c.notices.filter((n) => n.text === prose[i]?.text).length, prose[i] ? 1 : 0);
  const restored = Campaign.restore(c.snapshot(), () => 0.9);
  restored.checkQuests();
  assert.equal(restored.s.quests[q.id].paid, true, 'Paid flag persists');
  assert.equal(
    restored.notices.filter((n) => n.kind === 'narration' || n.text === prose[i]?.text).length,
    0,
    'Saved quest announcement never replays for ' + q.id,
  );
}
const b = new Campaign('normal', 'paladin', () => 0.9);
const tutorial = b.questDefs()[0];
b.s.quests[tutorial.id].done = true;
b.checkQuests();
assert.equal(
  b.notices.filter((n) => n.kind === 'narration').length,
  0,
  'Barracks tutorial does not narrate',
);

const css = fs.readFileSync(path.join(__dirname, '../styles/prototype.css'), 'utf8');
assert(css.includes('.notice-card.notice-narration'), 'Narration retains subdued styling');
assert(css.includes('.notice-card.notice-warning'), 'Warnings retain an urgent treatment');
console.log('PASS reviewed 17 cuts, 2 verbatim keeps, 10 rewrites, final milestone and quest/save integrity');
