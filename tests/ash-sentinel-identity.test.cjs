'use strict';

const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const Archive = require('../src/prototype/archive');

const boss = Campaign.data.bosses.find((row) => row.id === 'citadel');
const lore = Campaign.rules.dungeonLore.citadel;
assert.equal(boss.name, 'Ash Sentinel');
assert.equal(boss.kind, 'dungeon');
assert.equal(boss.captive, 'Tovan the Final Instructor');
assert.match(boss.history, /Marshal Veyra/);
assert.match(boss.history, /professional standing army/);
assert.match(boss.history, /officers and garrisons/);
assert.match(lore, /professional army/);
assert.match(lore, /private quarters/);
assert.match(lore, /Citadel of Ashes/);

const pages = Archive.sections(new Campaign(), { D: Campaign.data, R: Campaign.rules });
const entry = pages
  .find((section) => section.title === 'Adversaries and their attacks')
  .topics.find(([title]) => title === 'Ash Sentinel');
assert(entry && entry[1].includes(boss.history), 'existing Archive displays the biography');

assert.deepEqual(boss.attacks.map((a) => a.split(':')[0]), ['Microdermabrasion', 'Dress Ranks', 'Deep-Tissue Contouring', 'Fractional Resurfacing', 'Volumize']);
assert(Campaign.rules.dungeonDecor.citadel.some((row) => row[2] === 'citadel-vanity-quarters'));
const moves = Campaign.rules.attacks.citadel;
assert.deepEqual(moves.map((move) => move.kind), ['canister', 'formation', 'pattern-charge', 'checkerboard', 'summon']);
assert.equal(moves[0].warning, 1.6, 'canister warning');
assert.equal(moves[1].kind, 'formation', 'no original ash lanes');
assert.equal(moves[2].kind, 'pattern-charge', 'fixed five-leg route');
assert.equal(moves[3].kind, 'checkerboard', 'persistent squares');
assert.equal(moves[4].species, 'crownguard', 'living troop muster unchanged');

for (const mode of ['normal', 'nightmare']) {
  const c = new Campaign(mode, 'paladin', () => 0.9);
  assert(c.enter('citadel'));
  assert(c.messages.includes(lore), mode + ' first entrance shows authored Citadel clue');
  const discoveryKey = 'crown:dungeon-lore:citadel';
  assert(c.s.discovered[discoveryKey]);
  const zone = c.zone();
  assert.equal(zone.enemies.filter((enemy) => enemy.guard).length, 32);
  assert.equal(c.traps().length, 28);
  assert(zone.enemies.some((enemy) => enemy.family === 'citadel' && enemy.form === 'normal'));
  assert(zone.npcs.some((npc) => npc.family === 'citadel' && npc.kind === 'cage'));
  const stations = zone.props.filter((prop) => prop.decorative).map((prop) => prop.structure);
  for (const station of [
    'citadel-vanity-quarters',
    'citadel-muster',
    'citadel-command',
    'citadel-ritual-array',
    'citadel-barracks-bay',
    'citadel-forge-bay',
    'citadel-boss-approach',
  ]) assert(stations.includes(station), station + ' unchanged');

  assert(c.enter('crown'));
  const old = c.snapshot();
  const restored = Campaign.restore(old);
  restored.messages.length = 0;
  assert(restored.enter('citadel'));
  assert(!restored.messages.includes(lore), 'seen lore is not repeated after save/reload');
  delete old.discovered[discoveryKey];
  const legacy = Campaign.restore(old);
  legacy.messages.length = 0;
  assert(legacy.enter('citadel'));
  assert(legacy.messages.includes(lore), 'visited pre-patch save receives the clue once');
  assert(legacy.s.discovered[discoveryKey]);
}

const succession = new Campaign('normal', 'paladin', () => 0.9);
for (const id of Campaign.dungeonIds) succession.victory(id, 'normal');
succession.victory('citadel', 'true');
succession.victory('darklord', 'normal');
succession.victory('darklord', 'true');
succession.awaken();
assert.equal(succession.s.phase, 'awakening');
assert(!succession.s.pending.citadel, 'already-earned TRUE Citadel victory remains credited');
succession.enter('citadel');
assert(!succession.zone().enemies.some((enemy) => enemy.type === 'boss' && enemy.hp > 0));
for (const id of Campaign.dungeonIds) succession.victory(id, 'true');
succession.checkEnding();
assert.equal(succession.s.phase, 'peace');
succession.enter('citadel');
assert(succession.zone().habitat);
assert(succession.zone().enemies.length > 0);
assert(succession.zone().enemies.every((enemy) => enemy.neutral));
assert.equal(Campaign.restore(succession.snapshot()).s.phase, 'peace');

console.log('PASS Ash Sentinel authored lore, existing Citadel geometry, normal/TRUE/Awakening credit and old-save peace');
