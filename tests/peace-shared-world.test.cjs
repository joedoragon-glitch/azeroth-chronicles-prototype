'use strict';

const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

const regions = Campaign.data.regions.map((r) => r.id);
const dungeons = Campaign.dungeonIds;
const treasuries = Campaign.rules.supplyRooms.map((r) => r.id);
const sideDungeons = (Campaign.rules.sideDungeons || []).map((r) => r.id);
const allZones = [...regions, ...dungeons, ...treasuries, ...sideDungeons];
assert.equal(new Set(allZones).size, allZones.length, 'zone IDs must be unique');
assert.equal(dungeons.length, 5, 'five former companions, not field bosses');

function crownVictory(c, early = ['crypt', 'archive', 'mine']) {
  for (const id of dungeons) c.victory(id, 'normal');
  for (const id of early) c.victory(id, 'true');
  c.victory('darklord', 'normal');
  c.victory('darklord', 'true');
  c.awaken();
}

function assertPeaceful(c, id) {
  assert.equal(c.enter(id), true, 'zone reachable: ' + id);
  const z = c.zone();
  assert(z.habitat, 'habitat flag: ' + id);
  assert(z.enemies.length > 0, 'inhabitants in ' + id);
  assert(
    z.enemies.every((e) => e.neutral && !e.guard && !e.summon && e.hp > 0),
    'only living, non-combatant residents: ' + id,
  );
  assert.equal(c.traps().length, 0, 'no active traps: ' + id);
  if ([...dungeons, ...treasuries, ...sideDungeons].includes(id)) {
    assert(
      z.enemies.some((e) => e.name.endsWith(' visitor')),
      'former hostile interior hosts people from another region: ' + id,
    );
    const i = c.regionIndex(id);
    assert(
      z.enemies.some((e) => !Campaign.data.species[i].some((local) => local[0] === e.species)),
      'shared interior contains a visibly nonlocal species: ' + id,
    );
  }
  const occupants = z.enemies.map((e) => e.id);
  const hp = c.hero.hp;
  Object.assign(c.hero, { x: z.enemies[0].x, y: z.enemies[0].y });
  c.s.mercyTime = 0;
  c.tick(0.1);
  assert.equal(c.hero.hp, hp, 'neutral resident cannot attack: ' + id);
  assert.deepEqual(c.zone().enemies.map((e) => e.id), occupants, 'idempotent zone load: ' + id);
}

for (const mode of ['normal', 'nightmare']) {
  for (const heroClass of ['paladin', 'mage', 'ranger']) {
    const c = new Campaign(mode, heroClass, () => 0.9);
    crownVictory(c);
    assert.equal(c.s.phase, 'awakening');
    assert.equal(dungeons.filter((id) => c.s.true[id]).length, 3);
    assert.deepEqual(Object.keys(c.s.late), [], 'early TRUE wins cannot be relabeled late');
    assert(c.s.pending.abyss && c.s.pending.citadel, 'only remaining successors appear');
    const checkpoint = Campaign.restore(c.snapshot(), () => 0.9);
    assert(checkpoint.s.true.crypt && checkpoint.s.true.archive && checkpoint.s.true.mine);
    checkpoint.victory('abyss', 'true');
    checkpoint.checkEnding();
    assert(!checkpoint.peace, 'last outstanding successor still matters');
    checkpoint.victory('citadel', 'true');
    checkpoint.checkEnding();
    assert(checkpoint.peace, 'all five TRUE flags plus the Dark Lord yield peace');
    assert.equal(Object.keys(checkpoint.s.pending).length, 0);
    assert.equal(checkpoint.s.hazards.length, 0);
    assert.equal(checkpoint.s.projectiles.length, 0);
    for (const q of checkpoint.questDefs()) {
      const p = checkpoint.s.quests[q.id];
      if (
        p &&
        !p.done &&
        (['patrol', 'night', 'escort'].includes(q.kind) ||
          (q.clear && !checkpoint.miniCleared(q.clear, q.region)))
      ) {
        assert(p.closedByPeace && !p.active, 'incompatible quest closed: ' + q.id);
      }
    }

    // Includes interiors never entered before peace, which previously bypassed makeHabitat.
    for (const id of allZones) assertPeaceful(checkpoint, id);
    const restored = Campaign.restore(checkpoint.snapshot(), () => 0.9);
    assert(restored.peace && restored.s.true.darklord);
    for (const id of allZones) {
      assertPeaceful(restored, id);
      assert.equal(restored.s.pending[id], undefined);
    }
    console.log('PASS shared peaceful world for ' + mode + ' / ' + heroClass);
  }
}

// An already-complete TRUE run must not ask for five new battles.
const already = new Campaign('normal', 'paladin', () => 0.9);
crownVictory(already, dungeons);
assert(already.peace, 'five early TRUE wins immediately satisfy Awakening');
assert(!already.notices.some((n) => n.text.startsWith('AWAKENING')), 'no false re-fight notice');

// A pre-fix peaceful Treasury save had habitat=true but no residents.
const historical = new Campaign('normal', 'ranger', () => 0.9);
crownVictory(historical, dungeons);
historical.enter(treasuries[0]);
const oldPeace = historical.snapshot();
oldPeace.zones[treasuries[0]].habitat = true;
oldPeace.zones[treasuries[0]].enemies = [];
const repaired = Campaign.restore(oldPeace, () => 0.9);
assertPeaceful(repaired, treasuries[0]);
assert(Campaign.restore(repaired.snapshot(), () => 0.9).peace);

// A side dungeon first visited under the old peaceful flow had no habitat flag.
historical.enter(sideDungeons[0]);
const oldSide = historical.snapshot();
delete oldSide.zones[sideDungeons[0]].habitat;
oldSide.zones[sideDungeons[0]].enemies = [];
const repairedSide = Campaign.restore(oldSide, () => 0.9);
assertPeaceful(repairedSide, sideDungeons[0]);

console.log('PASS historical peaceful interior repairs and early TRUE credits');
