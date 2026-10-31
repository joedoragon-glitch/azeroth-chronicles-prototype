'use strict';
// Written for the deferred shared validation gate; no standalone run requested.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const Archive = require('../src/prototype/archive.js');
const Menus = require('../src/prototype/menus.js');
for (const cls of ['paladin', 'mage', 'ranger']) {
  const g = new C('normal', cls, () => 0.9);
  const before = g.snapshot(),
    effects = JSON.stringify(g.effects);
  const topics = Archive.conditionTopics(C.rules);
  const shelf = Archive.sections(g, { D: C.data, R: C.rules }).find(
    (s) => s.title === 'Conditions and recovery',
  );
  assert.deepEqual(shelf.topics, topics, 'Archive and short reference use the same definitions');
  const slow = topics.find((t) => t[0] === 'Slow');
  assert(slow[1].includes('skill cooldowns') &&
    slow[1].includes('Repeated Slow hits') &&
    slow[1].includes('lasting cooldown debt'));
  assert(slow[2].includes('65%') && slow[2].includes('85%') && slow[2].includes('40%'));
  const silence = topics.find((t) => t[0] === 'Silence');
  assert(silence[1].includes('you and companions') && silence[1].includes('ordinary attacks'));
  assert(silence[2].includes('warnings') || silence[2].includes('warned specials'));
  const interruption = topics.find((t) => t[0] === 'Interrupted charges');
  for (const number of ['0.65', '7%', '6 HP', '0.5']) assert(interruption[2].includes(number));
  assert(interruption[2].includes('Spell Interrupt'), 'cancellation is distinct from Silence');
  assert(
    topics.find((t) => t[0] === 'Shields, wards and immunity')[2].includes('No class’s Skill 8'),
  );
  const healing = topics.find((t) => t[0] === 'Healing in battle')[2];
  assert(healing.includes('ordinary patient') &&
    healing.includes('full heal measured from wounds') &&
    healing.includes('per-healer leader interval'),
    'current Keeper guide distinguishes full ordinary treatment from leader healing');
  let opened;
  const menus = Menus.create({
    getGame: () => g,
    Campaign: C,
    D: C.data,
    action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
    openMenu: (title, description, actions, back) => {
      opened = { title, description, actions, back };
    },
    closeMenu() {},
    recallSquad() {},
    showMap() {},
    finaleMenu() {},
  });
  menus.skillBook();
  opened.actions.find((a) => a.label === 'Combat conditions').action();
  assert.equal(opened.title, 'Combat conditions');
  assert(!opened.description.includes('65%'), 'figures are not forced into the quick list');
  for (const [name, brief, figures] of topics) {
    const item = opened.actions.find((a) => a.label === name);
    assert(item);
    item.action();
    assert.equal(opened.description, brief, 'each selected quick topic stays concise');
    assert.notEqual(opened.description, figures, 'detailed rules belong at the Keeper');
    assert.equal(opened.actions.length, 0, 'quick topic is read-only');
    opened.back();
  }
  opened.back();
  assert.equal(opened.title, 'Skill journal', 'Back returns to the actual parent');
  assert.deepEqual(g.snapshot(), before);
  assert.equal(JSON.stringify(g.effects), effects, 'learning never produces combat events');
}
const alteredRules = {
  ...C.rules,
  cooldownBalance: {
    ...C.rules.cooldownBalance,
    slowRecoveryMultiplier: 0.5,
    enemySlowRecoveryMultiplier: 0.75,
  },
};
const figures = Archive.conditionTopics(alteredRules).find((t) => t[0] === 'Slow')[2];
assert(figures.includes('50%') && figures.includes('75%'), 'figures read live rules');
console.log(
  'PASS concise shared condition guide, optional Archive detail, live rules and read-only navigation',
);
