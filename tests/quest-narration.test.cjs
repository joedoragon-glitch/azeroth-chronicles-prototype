'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Campaign = require('../src/prototype/engine.js');

const run = new Campaign('normal', 'paladin', () => 0.9);
const quests = run.questDefs().filter((q) => q.id !== 'quest-barracks');
const prose = require('../src/prototype/narration.js');
assert.equal(quests.length, 30);
assert.equal(prose.length, 30);
assert.equal(new Set(prose).size, 30, 'Each quest has a distinct authored payoff');
for (const [i, text] of prose.entries()) {
  assert.equal(typeof text, 'string');
  assert(text.trim().length >= 45 && text.length <= 180, 'Compact narration ' + i);
  assert(!/reward delivered|\bcrowns\b|\bXP\b|quest complete/i.test(text), 'Not a reward receipt ' + i);
  assert(!/^(you (see|notice|discover)|quest)/i.test(text), 'No boilerplate narrator ' + i);
}

for (let i = 0; i < quests.length; i++) {
  const c = new Campaign('normal', 'paladin', () => 0.9);
  const quest = c.questDefs().find((q) => q.id === 'quest-' + i);
  assert(quest);
  const state = c.s.quests[quest.id];
  state.done = true;
  c.checkQuests();
  const narrations = c.notices.filter((n) => n.kind === 'narration');
  assert.equal(narrations.length, 1, 'Quest ' + quest.id + ' narrates once');
  assert.equal(narrations[0].text, prose[i], 'Correct narrative for ' + quest.id);
  assert.equal(state.paid, true);
  c.checkQuests();
  assert.equal(c.notices.filter((n) => n.kind === 'narration').length, 1, 'No duplicate on repeat');
  const restored = Campaign.restore(c.snapshot());
  restored.checkQuests();
  assert.equal(
    restored.notices.filter((n) => n.kind === 'narration').length,
    0,
    'Already-paid quest never narrates after restoring ' + quest.id,
  );
}
const b = new Campaign('normal', 'paladin', () => 0.9);
const tutorial = b.questDefs()[0];
b.s.quests[tutorial.id].done = true;
b.checkQuests();
assert.equal(b.notices.filter((n) => n.kind === 'narration').length, 0, 'Tutorial is not regional lore');

const css = fs.readFileSync(require('node:path').join(__dirname, '../styles/prototype.css'), 'utf8');
assert(css.includes('.notice-card.notice-narration'), 'Narration has its own presentation');
assert(css.includes('.notice-card.notice-warning'), 'Urgent warnings have a distinct treatment');
console.log('PASS 30 lore payoffs, automatic once-only rewards, save restore and tiered appearance');
