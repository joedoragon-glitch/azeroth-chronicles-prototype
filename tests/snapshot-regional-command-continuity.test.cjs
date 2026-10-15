'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const Archive = require('../src/prototype/archive');

const D = Campaign.data;
const R = Campaign.rules;
const warlord = D.bosses.find((b) => b.id === 'warlord');
const ridge = D.bosses.find((b) => b.id === 'ridge');
assert.match(warlord.role, /military governor/i);
assert.match(warlord.history, /Cinder Warlord/);
assert.match(warlord.history, /unfinished Abyss Bastion/);
assert.match(ridge.role, /Master of Coin/);
assert.match(R.roomCaptains['supply-highlands'].history, /horned humanoid/);
assert.equal(R.roomCaptains['supply-highlands'].species, 'ridge');
assert.match(R.roomCaptains['frontier-overseer'].history, /not the military governor/);
assert.match(R.roomCaptains['frontier-overseer'].history, /cannot create troops/);

for (const mode of ['normal', 'nightmare']) {
  for (const cls of ['paladin', 'mage', 'ranger']) {
    const game = new Campaign(mode, cls, () => 0.5);
    const before = JSON.stringify(game.snapshot());
    const shelf = Archive.sections(game, { D, R }).find(
      (entry) => entry.title === 'The Crown and its institutions',
    );
    assert(shelf, 'Crown institutions shelf is available');
    const topics = new Map(shelf.topics.map(([label, description]) => [label, description]));
    for (const name of [
      'Ridge Tyrant — Master of Coin',
      'Crag Tyrant — Treasury captain',
      'Ashen Warlord — Frontier governor',
      'Cinder Warlord — Frontier inspector',
    ]) {
      assert(topics.has(name), mode + ' ' + cls + ' missing ' + name);
      assert(topics.get(name).length > 90);
    }
    assert.match(topics.get('Crag Tyrant — Treasury captain'), /paid Crown soldiers on armored direwolves/);
    assert.match(topics.get('Ashen Warlord — Frontier governor'), /military commander/);
    assert.match(topics.get('Cinder Warlord — Frontier inspector'), /Mandatory Overtime/);
    assert.equal(JSON.stringify(game.snapshot()), before, 'read-only Archive cannot change saves');
  }
}

// A development summon before entering the Treasury must also use Crag's
// approved species, rather than borrowing the normal Highland Wolf fallback.
const dev = new Campaign('developer', 'paladin', () => 0.5);
dev.enter('highlands');
const crag = dev.developerSummon('captain:supply-highlands');
assert(crag?.roomCaptain, 'Crag may be summoned in his home region');
assert.equal(crag.captainProfile, 'supply-highlands');
assert.equal(crag.species, 'ridge', 'developer Crag is not a Wolf');
assert.equal(crag.developerSummon, true);
assert(!dev.snapshot().zones.highlands.enemies.some((e) => e.developerSummon));
console.log('PASS six class/mode Archive command histories, read-only saves and Crag developer identity');
