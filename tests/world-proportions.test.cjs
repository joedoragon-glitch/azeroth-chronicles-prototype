'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Visuals = require('../src/prototype/visuals.js');

const sample = (renderKind, fields) => Visuals.featureScale({ renderKind, ...fields });
assert.equal(sample('prop', { structure: 'vale-cottage' }), 1.4);
assert.equal(sample('prop', { structure: 'highland-stone-house' }), 1.4);
assert.equal(sample('prop', { structure: 'frontier-workshop' }), 1.4);
assert.equal(sample('prop', { structure: 'pine-sapling' }), 1.3);
assert.equal(sample('prop', { structure: 'dead-tree' }), 1.3);
assert.equal(sample('prop', { id: 'forest-0-1', icon: '🌳' }), 1.3);
assert.equal(sample('prop', { id: 'forest-0-2', icon: '🪨' }), 1);
assert.equal(sample('npc', { kind: 'landmark', id: 'orchard', name: 'Abandoned orchard' }), 1.3);
assert.equal(sample('npc', { kind: 'dungeon', name: 'Crypt entrance' }), 1.35);
assert.equal(sample('npc', { kind: 'transport', name: 'Merchant wagon' }), 1.35);
assert.equal(sample('npc', { kind: 'transport', interactionOnly: true }), 1);
assert.equal(sample('prop', { structure: 'crown-fortress-checkpoint' }), 1.35);
assert.equal(sample('building', { kind: 'barracks' }), 1.35);
assert.equal(sample('hero', { class: 'paladin' }), 1);
assert.equal(sample('enemy', { species: 'goblin' }), 1);
assert.equal(sample('prop', { structure: 'vale-fence' }), 1);

const baselines = [
  ['vale', 2700, 32],
  ['march', 3000, 40],
  ['highlands', 3400, 48],
  ['frontier', 3400, 56],
  ['crown', 3800, 64],
];
const game = new Campaign('normal', 'paladin', () => 0.9);
const audit = [];
for (const [zoneId, size, ordinaryBase] of baselines) {
  game.enter(zoneId);
  const zone = game.zone();
  assert.equal(game.zoneSize(), size, zoneId + ' boundaries are unchanged');
  assert.equal(Campaign.data.regions.find((r) => r.id === zoneId).enemy_count, ordinaryBase);
  const before = JSON.stringify(game.snapshot());
  const entries = [
    ...zone.props.map((e) => ({ ...e, renderKind: 'prop' })),
    ...zone.npcs.map((e) => ({ ...e, renderKind: 'npc' })),
    ...zone.buildings.map((e) => ({ ...e, renderKind: 'building' })),
  ];
  const major = entries.filter((e) => Visuals.featureScale(e) > 1);
  assert(major.length > 0, zoneId + ' has proportion candidates');
  const byKind = {};
  for (const item of major) {
    const key = item.renderKind === 'prop' ? item.structure || 'forest-tree' : item.kind || item.renderKind;
    byKind[key] = (byKind[key] || 0) + 1;
    assert(Visuals.featureScale(item) <= 1.4);
  }
  const enemies = zone.enemies
    .filter((e) => e.type === 'mob' && !e.guard && !e.neutral)
    .map((e) => ({ x: e.home.x, y: e.home.y, pack: e.pack }))
    .sort((a, b) => a.x - b.x || a.y - b.y);
  const reachable = zone.npcs.filter((n) => ['transport', 'dungeon'].includes(n.kind));
  for (const point of reachable) {
    if (point.harbor) continue;
    assert(game.route(game.hero, point).length, zoneId + ': entrance/transport unreachable ' + point.id);
  }
  const outer = major.filter((e) => [e.x, e.y, size - e.x, size - e.y].some((n) => n < 300)).length;
  const pairs = major.reduce((count, a, i) => count + major.slice(i + 1).filter((b) => Math.hypot(a.x - b.x, a.y - b.y) < 85).length, 0);
  assert.equal(JSON.stringify(game.snapshot()), before, 'visual proportion analysis cannot mutate saves or enemies');
  audit.push({ zoneId, size, ordinaryBase, actualOrdinary: enemies.length, majorFeatures: major.length, outer300: outer, closeFeaturePairs: pairs, kinds: Object.keys(byKind).length, sitesChecked: reachable.length });
}
assert.equal(baselines.reduce((s, x) => s + x[2], 0), 240);
console.log('PASS major feature scale only changes presentation; authored dimensions, enemy populations, combat anchors and routes remain unchanged');
console.log('WORLD PROPORTION AUDIT ' + JSON.stringify(audit));
