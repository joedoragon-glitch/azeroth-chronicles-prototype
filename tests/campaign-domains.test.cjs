'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm'),
  Campaign = require('../src/prototype/engine.js'),
  inventory = require('../scripts/site-assets.cjs');

// Run the actual browser script graph without CommonJS or a DOM. Domain modules
// must install before Campaign is exported and keep all state on that instance.
const context = vm.createContext({});
context.window = context;
const engineIndex = inventory.scripts.indexOf('src/prototype/engine.js');
assert(engineIndex > 0);
for (const file of inventory.scripts.slice(0, engineIndex + 1)) {
  if (!file.startsWith('src/prototype/')) continue;
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context, {
    filename: file,
  });
}
assert.equal(typeof context.Campaign, 'function');
const ownedMethods = new Set();
for (const owner of ['combat', 'hero-combat', 'boss-combat', 'party', 'economy', 'rewards']) {
  assert(inventory.core.includes('src/prototype/' + owner + '.js'));
  class Probe {}
  require('../src/prototype/' + owner + '.js').install(Probe, {
    D: Campaign.data,
    R: Campaign.rules,
    dungeonIds: Campaign.dungeonIds,
  });
  for (const name of Object.getOwnPropertyNames(Probe.prototype)) {
    if (name === 'constructor') continue;
    assert(!ownedMethods.has(name), 'Campaign method has multiple domain owners: ' + name);
    ownedMethods.add(name);
    const expected = Object.getOwnPropertyDescriptor(Probe.prototype, name);
    for (const C of [Campaign, context.Campaign]) {
      const actual = Object.getOwnPropertyDescriptor(C.prototype, name);
      assert(actual, owner + '.' + name + ' installed');
      assert.equal(typeof actual.value, 'function');
      assert.equal(actual.enumerable, expected.enumerable);
      assert.equal(actual.configurable, expected.configurable);
      assert.equal(actual.writable, expected.writable);
    }
  }
}

const replay = (C, mode, heroClass) => {
  const c = new C(mode, heroClass, () => 0.9);
  c.enter('crypt');
  c.zone().props = [];
  c.s.mercyTime = 0;
  Object.assign(c.hero, { x: 500, y: 500, skills: Array(8).fill(1), mp: 1000, maxMp: 1000 });
  c.s.companionCombatTraining = 2;
  c.s.expeditionRank = 3;
  c.s.party.forEach((u, i) => Object.assign(u, { x: 480, y: 500 + i * 30 }));
  const e = c.makeEnemy(
    { species: 'goblin', name: 'Domain fixture', level: 1, hp: 10000, damage: 8, gold: 1, xp: 1 },
    { x: 570, y: 500 },
  );
  c.zone().enemies = [e];
  const timeline = [];
  for (let i = 0; i < 30; i++) {
    if (i % 5 === 0) c.cast(1, e.id);
    if (i === 8) c.toggleSquadDoctrine();
    if (i === 15) c.recallParty();
    c.tick(0.05, { x: i < 10 ? 1 : 0, y: 0 });
    timeline.push(
      JSON.parse(JSON.stringify({ state: c.snapshot(), effects: c.effects, messages: c.messages })),
    );
  }
  return timeline;
};
for (const mode of ['normal', 'nightmare'])
  for (const heroClass of ['paladin', 'mage', 'ranger'])
    assert.deepEqual(
      replay(context.Campaign, mode, heroClass),
      replay(Campaign, mode, heroClass),
      mode + '/' + heroClass + ' browser/CommonJS combat and party state',
    );
console.log(
  'PASS combat and party install through the offline browser graph and match CommonJS simulation for every class/mode',
);
