'use strict';
// #679: local physical scout evidence, stable IDs and historical-save reconciliation.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const c = new C('normal', 'paladin', () => 0.5);
c.hero.level = 2;
const z = c.zone(), cfg = C.rules.thornPatrol,
  e = z.enemies.find((e) => e.family === 'thorn' && e.type === 'boss'),
  witness = z.npcs.find((n) => n.thornReport);
assert(e && witness);
assert.equal(witness.id, 'thorn-local-report');
assert.equal(witness.name, 'Western road observer');
assert.equal(cfg.startLeg, 7);
assert.equal(cfg.direction, -1);
assert.equal(cfg.route.length, 8);
assert(cfg.names[2].startsWith('Northern freight crossing'));
assert(cfg.names[3].startsWith('Northern freight crossing'));
for (let i = 0; i < cfg.route.length; i++) {
  const marker = z.npcs.find((n) => n.id === 'thorn-trailhead-' + i);
  assert(marker, 'original scout trailhead ' + i);
  assert.equal(marker.name, 'Scout tracks · ' + cfg.names[i]);
}
// The same witness must not give a live, all-region tracking report.
const fixed = c.thornReport(true), longer = c.thornReport(false);
assert(fixed.includes('No recent sighting from the western road'));
assert(longer.includes('northern freight crossing'));
for (let i = 0; i < cfg.route.length; i++) {
  Object.assign(e, {
    x: cfg.route[i][0], y: cfg.route[i][1],
    thornLeg: (i + cfg.direction + cfg.route.length) % cfg.route.length,
  });
  const raw = JSON.stringify(c.snapshot());
  assert.equal(c.thornReport(true), fixed, 'witness cannot know live leg ' + i);
  assert.equal(c.thornReport(false), longer, 'static landmarks do not report live boss coordinates');
  assert.equal(JSON.stringify(c.snapshot()), raw, 'clues cannot mutate game state');
}
// A real, expiring footprint can support only an appropriately local statement.
const mark = { id: 'report-print', thornFootprint: true, expires: c.s.time + 4,
  x: witness.x + 10, y: witness.y + 10 };
z.npcs.push(mark);
assert(c.thornReport(true).includes('Recent pawprints were found by the western road'));
Object.assign(c.hero, { x: mark.x, y: mark.y });
assert(c.thornReport(false).startsWith('Fresh pawprints mark this nearby path'));
c.s.time += 5;
assert.equal(c.thornReport(true), fixed, 'stale physical evidence does not become live intelligence');
assert.equal(c.thornReport(false), longer);
c.s.keys.thorn = true;
const mira = c.thornCaptive();
Object.assign(mira, { x: cfg.route[3][0], y: cfg.route[3][1] });
assert(c.thornReport(true).includes('Mira waits near ' + cfg.names[3]),
  'the post-defeat rescue clue still identifies her actual waiting area');
c.s.rescued.thorn = true;
assert.equal(c.thornReport(true), 'Mira is free. Find her teaching in Millhaven.');
Object.assign(c.hero, { x: witness.x + 120, y: witness.y });
assert.equal(c.interact(witness), false);
Object.assign(c.hero, { x: witness.x, y: witness.y });
assert(c.interact(witness));
assert(c.messages.at(-1).includes('Mira is free'));
assert.equal(c.notices.at(-1).kind, 'narration');
for (const seed of [0.1, 0.5, 0.9]) {
  const g = new C('normal', 'paladin', () => seed);
  const resident = g.zone().npcs.find((n) => n.id === 'thorn-local-report');
  assert(resident);
  assert.equal(resident.name, 'Western road observer');
  assert(!g.blocked(resident.x, resident.y));
  assert(g.route(g.hero, resident).length, 'road witness reachable from Millhaven');
  Object.assign(resident, { name: 'Orchard trail witness', x: 900, y: 850, savedWitnessNote: 'retained' });
  const marker = g.zone().npcs.find((n) => n.id === 'thorn-trailhead-2');
  marker.name = 'Scout tracks · Mill crossing, west bank';
  const input = g.snapshot(), before = JSON.stringify(input);
  const restored = C.restore(input, () => seed);
  assert.equal(JSON.stringify(input), before, 'restore does not mutate import');
  const matches = restored.zone().npcs.filter((n) => n.id === resident.id);
  assert.equal(matches.length, 1, 'same historical witness, never a duplicate');
  assert.equal(matches[0].name, 'Western road observer');
  assert.equal(matches[0].savedWitnessNote, 'retained');
  assert.equal(restored.zone().npcs.find((n) => n.id === marker.id).name,
    'Scout tracks · ' + cfg.names[2], 'historic misleading bridge caption repaired');
  const position = { x: matches[0].x, y: matches[0].y };
  restored.migrateThornPatrol(restored.zone());
  assert.deepEqual({ x: matches[0].x, y: matches[0].y }, position);
  assert.equal(restored.zone().npcs.filter((n) => n.id === resident.id).length, 1);
}
console.log('PASS #679 truthful, localized Thornfang/Mira clues; stable trail/witness IDs; v4 migration; rescue');
