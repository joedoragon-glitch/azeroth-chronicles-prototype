'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');

// A presentation migration must not undo a real player's dungeon progress.
const c = new Campaign();
c.enter('frontier');
c.enter('abyss');
const guard = c.zone().enemies.find((e) => e.guard);
guard.hp = 0;
c.kill(guard);
const saved = c.snapshot();
delete saved.zones.abyss.flightProjectVersion;
saved.zones.frontier.frontierLayoutVersion = 2;
for (const p of saved.zones.abyss.props.filter((p) => p.decorative)) {
  if (p.structure === 'flight-planning-table') p.structure = 'handler-station';
  if (p.structure === 'flight-harness-station') p.structure = 'containment-post';
  if (p.structure === 'royal-launch-platform') p.structure = 'dragon-perch';
  if (p.dungeonDistrict === 'flight-training') p.dungeonDistrict = 'containment-gallery';
}
const before = JSON.parse(JSON.stringify(saved));
const restored = Campaign.restore(saved);
const z = restored.zone();
assert.equal(z.flightProjectVersion, 1);
assert.equal(z.dungeonVersion, before.zones.abyss.dungeonVersion);
assert.equal(z.enemies.find((e) => e.id === guard.id).hp, 0);
assert.equal(restored.hero.gold, before.hero.gold);
assert.equal(restored.hero.xp, before.hero.xp);
assert.deepEqual(z.npcs, before.zones.abyss.npcs);
assert.deepEqual(z.enemies, before.zones.abyss.enemies);
assert.deepEqual(restored.s.rescued, before.rescued);
assert.deepEqual(z.props.map(({ id, x, y, r }) => ({ id, x, y, r })),
  before.zones.abyss.props.map(({ id, x, y, r }) => ({ id, x, y, r })));
const structures = new Set(z.props.map((p) => p.structure));
for (const kind of ['flight-planning-table', 'flight-harness-station', 'royal-launch-platform', 'royal-flight-standard', 'egg-cradle']) assert(structures.has(kind));
assert(!structures.has('containment-post'));
assert.equal(restored.s.zones.frontier.frontierLayoutVersion, 4);
assert.equal(Campaign.rules.frontierDistricts.find((d) => d.id === 'bastion-cordon').role, 'air-superiority-project');
assert.deepEqual(Campaign.restore(restored.snapshot()).zone().props, z.props);
console.log('PASS Existing Bastion and Frontier saves gain flight-project dressing without changing dungeon progress, occupants or collision');

const fresh = new Campaign();
fresh.enter('abyss');
const lore = Campaign.rules.dungeonLore.abyss;
assert(lore.includes('personal flying mount') && lore.includes('future air force'));
assert.equal(fresh.messages.filter((m) => m === lore).length, 1);
fresh.enter('frontier');
fresh.enter('abyss');
assert.equal(fresh.messages.filter((m) => m === lore).length, 1);
const reload = Campaign.restore(fresh.snapshot());
reload.enter('abyss');
assert(!reload.messages.includes(lore));
console.log('PASS First-entry project context is remembered across travel and reload');
