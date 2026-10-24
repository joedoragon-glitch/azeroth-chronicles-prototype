'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
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
// The two previously accepted KEEP slots were explicitly authorized for this voice-polish pass.
const polishedKeeps = new Map([
  [
    20,
    "Supplies arrive with the convoy. Repair crews keep its wagons moving, and soldiers guard the ravine crossing on the way to the Ashen Warlord's checkpoint.",
  ],
  [
    21,
    'Eren is free. At Abyss Bastion, dragons are being raised for a royal air force that does not yet exist. Veyrith fiercely defends the plan as the way to secure peace from above.',
  ],
]);
const authored = prose.filter(Boolean);
assert.equal(authored.length, 13, 'Only approved events are announced');
// Locked English/Spanish transcription fingerprint from the 24 October editorial master DOCX.
// Recompute against the owner's document; never revise this to legitimize invented prose.
const transcription = authored.map((entry) => [entry.id, entry.text, entry.es]);
assert.equal(
  createHash('sha256').update(JSON.stringify(transcription)).digest('hex'),
  'd26c0d5a85ddaf6cdf964c9026e3063594fe6ace256cd8759b2b6dc884447d45',
  'N1 Chronicle wording must match all thirteen approved EN/ES pairs verbatim',
);
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
  assert.equal(entry.id, 'C' + String(number).padStart(2, '0'));
  assert.equal(typeof entry.es, 'string');
  assert(entry.es.length <= 180 && entry.es.length >= 45, 'Approved Spanish card length');
  assert(
    entry.text.trim().length >= 45 && entry.text.length <= 180,
    'Selected quest ' + number + ' remains compact',
  );
  assert(!/reward delivered|quest complete|\+\d+ XP|\b\d+ crowns\b/i.test(entry.text), 'No reward receipt');
  assert(!/^(you (see|notice|discover)|quest)/i.test(entry.text), 'No generic event feed');
  if (disposition === 'keep')
    assert.equal(entry.text, polishedKeeps.get(number), 'Approved KEEP selection has its latest voice-polished wording');
}
assert(prose[29].text.includes('fortress gate'), 'Final approach is a significant event');
for (const [quest, fact] of [
  [4, 'Lifebinder'],
  [16, 'Crag'],
  [18, 'Stonecross'],
  [23, 'Ashen Warlord'],
  [29, 'Cindermaw'],
]) assert(prose[quest - 1].text.includes(fact), 'Approved quest ' + quest + ' gains grounded new canon');
assert(!/six signatures|sixth companion/i.test(prose[3].text),
  'Retired six-signature clue stays absent from C04');
assert(prose[3].text.includes('Every skeleton the Lifebinder creates retains its identity.'),
  'Approved C04 preserves the identity of every skeleton');
assert(prose[28].text.includes('The Crown also pays specialists drafted into service.'),
  'C29 preserves paid compulsory appointments');

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

const app = fs.readFileSync(path.join(__dirname, '../src/prototype/app.js'), 'utf8');
assert(app.includes('chronicleTranslations.has(value)'), 'Exact EN/ES Chronicle lookup is wired');
assert(app.includes("n.kind === 'narration' || n.kind === 'milestone' ? tr(n.text) : n.text"),
  "Active Chronicle notice uses the player’s language");
assert(app.includes('chroniclePreview.es.slice(0, 64)'),
  'Announcement index preview can use approved Spanish copy');

const css = fs.readFileSync(path.join(__dirname, '../styles/prototype.css'), 'utf8');
assert(css.includes('.notice-card.notice-narration'), 'Narration retains subdued styling');
assert(css.includes('.notice-card.notice-warning'), 'Warnings retain an urgent treatment');
const audition = fs.readFileSync(path.join(__dirname, '../tools/audio/index.html'), 'utf8');
assert(
  audition.includes('src/prototype/narration.js') &&
    audition.indexOf('src/prototype/narration.js') < audition.indexOf('src/prototype/rewards.js'),
  'Standalone audio audition loads narration before rewards',
);
console.log('PASS approved narration catalog, saved-game isolation and standalone tool script order');
