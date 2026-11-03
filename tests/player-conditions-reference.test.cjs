'use strict';
// Written for the deferred shared validation gate; no standalone run requested.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const Archive = require('../src/prototype/archive.js');
const fs = require('node:fs');
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
  const block = topics.find((t) => t[0] === 'Skill Block');
  assert.equal(topics.filter((t) => t[0] === 'Skill Block').length, 1);
  assert(block[1].includes('Each target in an area attack checks separately'));
  assert(block[1].includes('Critical skill hits cannot be blocked'));
  assert(!block[1].includes('20%'), 'short guide never forces advanced figures');
  for (const part of ['20%', '30%', '15%', '25%', '0%', '+5', '25% / 35%', '20% / 30%'])
    assert(block[2].includes(part), 'Keeper figures include ' + part);
  assert(block[2].includes('The hero has no general Skill Block'));
  assert(block[2].includes('Charmed monsters and boss pets gain that same night bonus (to 25% / 35%)'),
    'Keeper must explain the shared night bonus for owned monsters');
  assert(block[2].includes('Soldiers and Archers do not.'),
    'ordinary troops remain excluded from bonus');
  assert(block[2].includes('Casting still spends its cooldown'));
  const night = topics.find((topic) => topic[0] === 'Monsters after dark');
  assert(night, 'the established Combat conditions reference teaches the night passive');
  for (const phrase of [
    'more health', 'strike harder', 'fight faster', 'Charmed monsters',
    'boss pets', 'fade at dawn', 'Soldiers, Archers and heroes',
  ]) assert(night[1].includes(phrase), 'short night topic explains ' + phrase);
  for (const figure of ['+10%', '0.75 percentage points per victory', '+25%',
    '+5 percentage points', 'single-target enemy skills at 25% and area skills at 35%'])
    assert(night[2].includes(figure), 'Keeper night figures use current rule source: ' + figure);
  assert(night[2].includes('Basic automatic attacks and combo finishers'),
    'night reference preserves Skill Block basic exclusions');
  assert(night[2].includes('Resting monsters keep boosted statistics'),
    'night reference distinguishes reserves from active block recipients');
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
  // The actual Keeper menu retains its original pact gate and two-step reading.
  if (cls === 'paladin') {
    const oldAvailable = g.keeperAvailable;
    g.keeperAvailable = () => true;
    g.s.keeperPact = false;
    menus.keeper();
    assert.notEqual(opened.title, 'The Keeper’s shelves', 'no pact grants no shelves');
    g.s.keeperPact = true;
    menus.keeper();
    assert.equal(opened.title, 'The Keeper’s shelves');
    opened.actions.find((a) => a.label === 'Conditions and recovery').action();
    assert.equal(opened.title, 'Conditions and recovery');
    opened.actions.find((a) => a.label === 'Skill Block').action();
    assert.equal(opened.title, 'Skill Block');
    assert.equal(opened.description, block[1]);
    opened.actions.find((a) => a.label === 'Show me the figures').action();
    assert.equal(opened.description, block[2]);
    opened.back();
    assert.equal(opened.description, block[1], 'figures Back returns to answer');
    opened.back();
    assert.equal(opened.title, 'Conditions and recovery', 'answer Back returns to shelf');
    g.s.keeperPact = false;
    g.keeperAvailable = oldAvailable;
  }
}
const alteredRules = {
  ...C.rules,
  cooldownBalance: {
    ...C.rules.cooldownBalance,
    slowRecoveryMultiplier: 0.5,
    enemySlowRecoveryMultiplier: 0.75,
  },
};
alteredRules.skillBlock = {
  ...C.rules.skillBlock,
  enemySingle: 0.1775,
  enemyArea: 0.3125,
  rangerSingle: 0.125,
  rangerArea: 0.225,
  companionSingle: 0.23,
  companionArea: 0.34,
  nightEnemyBonus: 0.075,
};
const dynamicBlock = Archive.conditionTopics(alteredRules).find((t) => t[0] === 'Skill Block')[2];
for (const figure of ['17.75%', '31.25%', '12.5%', '22.5%', '+7.5', '25.25% / 38.75%', '20% / 30%', '23%', '34%', '30.5% / 41.5%'])
  assert(dynamicBlock.includes(figure), 'Skill Block figures derive from live rules: ' + figure);
const retunedNight = Archive.conditionTopics(alteredRules)
  .find((topic) => topic[0] === 'Monsters after dark')[2];
for (const figure of ['+7.5 percentage points', '30.5% and area skills at 41.5%'])
  assert(retunedNight.includes(figure), 'night help follows live Block tuning: ' + figure);
const figures = Archive.conditionTopics(alteredRules).find((t) => t[0] === 'Slow')[2];
assert(figures.includes('50%') && figures.includes('75%'), 'figures read live rules');
const appHelp = fs.readFileSync(require.resolve('../src/prototype/app.js'), 'utf8');
assert(appHelp.includes('red means an obstructed shot, not Skill Block'));
assert(appHelp.includes('rojo indica un disparo obstruido, no bloqueo de habilidades'));
assert(appHelp.includes("menu?.title === 'Skill Block'"), 'quick topic uses Archive localization');
console.log(
  'PASS concise shared condition guide, optional Archive detail, live rules and read-only navigation',
);
