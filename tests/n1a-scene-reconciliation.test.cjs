'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Campaign = require('../src/prototype/engine.js');
const Approved = require('../src/prototype/narration.js').approved;
const scenes = [
  ['citadel', 'veyra-private-quarters', 'D04', 'citadel-vanity-quarters'],
  ['side-vale-cellars', 'goblin-paid-preserves', 'I01', 'purchased-preserves'],
  ['side-highlands-signal', 'signal-working-beacon', 'I03', 'active-signal-beacon'],
  ['side-frontier-shrine', 'scornfang-shrine-records', 'I04', 'scornfang-memoranda'],
];
const game = () => new Campaign('normal', 'paladin', () => 0.9);
for (const [zone, id, narrativeId, structure] of scenes) {
  const g = game();
  assert(g.enter(zone), zone + ' can be entered with existing rules');
  const room = g.zone();
  const npc = room.npcs.find((n) => n.id === id);
  assert(npc && npc.kind === 'scene-detail' && npc.narrativeId === narrativeId,
    zone + ' provides an in-world inspection point, not an entrance claim');
  assert(room.props.some((prop) => prop.structure === structure),
    zone + ' genuinely renders the source-supported evidence');
  assert.equal(room.narrativeSceneVersion, 1, 'Scene migration recorded');
  assert(!g.interact({ ...npc, x: g.hero.x, y: g.hero.y }),
    'A forged interaction reference does not grant facts');
  if (narrativeId === 'D04') {
    assert.equal(g.s.discovered['citadel:veyra-private-quarters-inspected'], undefined);
    const initial = g.storyReadings().find((r) => r.text === Approved.D04_entrance.en);
    assert(initial, 'Before quarters inspection, only approved Citadel entrance is earned');
    assert(!g.storyReadings().some((r) => r.text === Approved.D04.en));
  }
  g.hero.x = npc.x; g.hero.y = npc.y;
  assert(g.interact(npc), zone + ' is genuinely inspectable');
  if (narrativeId === 'D04') {
    assert.equal(g.s.discovered['citadel:veyra-private-quarters-inspected'], true);
    assert(g.storyReadings().some((r) => r.text === Approved.D04.en),
      'The complete unedited D04 appears only after verified quarters inspection');
    assert(!g.storyReadings().some((r) => r.text === Approved.D04_entrance.en),
      'The quarters-verified reading replaces the shorter entrance copy');
    const restored = Campaign.restore(g.snapshot(), () => 0.9);
    assert(restored.storyReadings().some((r) => r.text === Approved.D04.en),
      'The full D04 remains earned after a v4 round-trip');
  }
  const before = room.props.filter((p) => p.id.startsWith('side-wall-'))
    .map((p) => [p.id, p.x, p.y, p.r]);
  const copy = g.snapshot();
  const saved = copy.zones[zone];
  saved.npcs = saved.npcs.filter((n) => n.id !== id);
  delete saved.narrativeSceneVersion;
  if (zone === 'side-vale-cellars')
    saved.props.find((p) => p.id === 'side-decor-2').structure = 'stolen-goods';
  const originalProps = new Map(saved.props.map((p) => [p.id, { x: p.x, y: p.y, r: p.r }]));
  const restored = Campaign.restore(copy, () => 0.9);
  assert(restored.enter(zone));
  const fixed = restored.zone();
  assert.equal(fixed.npcs.filter((n) => n.id === id).length, 1,
    zone + ' historical v4 scene marker added exactly once');
  assert(fixed.props.some((p) => p.structure === structure), 'Old save prop is reconciled');
  assert.deepEqual(
    fixed.props.filter((p) => p.id.startsWith('side-wall-')).map((p) => [p.id, p.x, p.y, p.r]),
    before, 'Already-set side pillars are not shifted again');
  for (const prop of fixed.props.filter((p) => p.id.startsWith('side-decor-'))) {
    const old = originalProps.get(prop.id);
    if (old) assert.deepEqual({ x: prop.x, y: prop.y, r: prop.r }, old,
      'Reconciliation cannot change existing decorative geometry');
  }
  restored.zone();
  assert.equal(fixed.npcs.filter((n) => n.id === id).length, 1,
    zone + ' second visit remains idempotent');
}
const side = Campaign.rules.sideDungeons;
const vale = side.find((x) => x.id === 'side-vale-cellars');
assert(vale.decor.some((x) => x[2] === 'purchased-preserves'));
assert(!vale.decor.some((x) => x[2] === 'stolen-goods'),
  'Goblin wages are not illustrated as stolen goods');
const highlands = side.find((x) => x.id === 'side-highlands-signal');
assert(highlands.decor.some((x) => x[2] === 'crown-maintained-tools'));
const shrine = side.find((x) => x.id === 'side-frontier-shrine');
assert(shrine.decor.some((x) => x[2] === 'protected-ritual-furnishings'));
const app = fs.readFileSync(path.join(__dirname, '../src/prototype/app.js'), 'utf8');
assert(app.includes("n.kind === 'scene-detail'") &&
  app.includes('approvedNarrative[n.narrativeId].en'),
  'Inspection exposes only approved author copy via the existing bilingual menu');
const visuals = fs.readFileSync(path.join(__dirname, '../src/prototype/visuals.js'), 'utf8');
for (const structure of ['purchased-preserves', 'active-signal-beacon',
  'crown-maintained-tools', 'scornfang-memoranda', 'protected-ritual-furnishings'])
  assert(visuals.includes("case '" + structure + "':"), structure + ' is actually drawn');
const renderer = fs.readFileSync(path.join(__dirname, '../src/prototype/renderer.js'), 'utf8');
assert(renderer.includes("structure === 'active-signal-beacon'"), 'Beacon emits night light');
const n = game();
assert(n.enter('archive'));
let worker = n.zone().npcs.find((npc) => npc.id === 'archive-restorer');
assert(worker, 'Neri restoration scene exists');
n.updateArchiveRestoration(0.05);
assert.notEqual(worker.bookRestoring, true, 'No involuntary restoration before pact');
n.s.normal.archive = true;
n.s.rescued.archive = true;
n.s.keeperPact = true;
for (const e of n.zone().enemies)
  if (e.type === 'boss' && e.family === 'archive') e.hp = 0;
n.updateArchiveRestoration(0.05);
assert(worker.bookRestoring && [-1, 1].includes(worker.bookFacing),
  'After her voluntary return, Neri visibly faces books during a repair pause');
assert(renderer.includes("e.presentation === 'archive-restorer'") &&
  renderer.includes('e.bookRestoring && e.bookFacing === -1'),
  'The Neri book-facing state is actually painted, not only narrated');
assert(!n.s.keeperEvidence, 'Restoration pose does not disclose signed evidence');
console.log('PASS four inspectable N1a world scenes, old v4 prop/position stability and Neri pose');
