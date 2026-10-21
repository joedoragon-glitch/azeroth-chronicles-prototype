'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine'),
  dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function game(id) {
  const g = new C('normal', 'mage', () => 0.73);
  g.s.mercyTime = 0;
  g.enter(id);
  return g;
}
const evidence = { entrances: [], signatures: [], summons: [], migrations: [] };
for (const id of C.dungeonIds) {
  const g = game(id);
  g.s.expeditionRank = 6;
  g.s.party = Array.from({ length: 6 }, () => g.unit('soldier', g.hero.x, g.hero.y));
  g.enter(id);
  const z = g.zone(),
    units = [g.hero, ...g.activeLivingParty()];
  assert.equal(units.length, 7);
  assert(units.every((u) => !g.blocked(u.x, u.y, id, g.actorRadius(u))));
  const acquisition = z.enemies.filter(
    (e) =>
      e.hp > 0 &&
      units.some((u) => dist(e, u) < g.enemyAcquisitionRange(e) && g.enemyRangedLine(e, u)),
  );
  assert.equal(acquisition.length, 0, id + ' receiving buffer covers arriving party');
  assert.equal(z.enemies.filter((e) => e.guard).length, g.dungeonGuardCount(id));
  assert(z.enemies.every((e) => !g.blocked(e.x, e.y, id, g.actorRadius(e))));
  const exit = z.npcs.find((n) => n.kind === 'exit');
  assert.deepEqual({ x: exit.x, y: exit.y }, { x: g.hero.x, y: g.hero.y });
  if (['crypt', 'archive', 'mine'].includes(id)) assert.equal(g.fortAreas().length, 0);
  else {
    assert(
      z.enemies.filter((e) => e.guard).every((e) => g.enemyFort(e)),
      'forts remain',
    );
    const watch = z.enemies.filter((e) => /entry-watch|intake-watch/.test(e.pack));
    const approach = id === 'abyss' ? { x: 330, y: 360 } : { x: 330, y: 340 };
    assert(
      watch.every(
        (e) => dist(e, approach) < g.enemyAcquisitionRange(e) && g.enemyRangedLine(e, approach),
      ),
      'defenders still acquire the inward approach',
    );
  }
  const reload = C.restore(g.snapshot(), () => 0.73);
  assert.equal(reload.zone().npcs.find((n) => n.kind === 'exit').x, 120);
  assert.deepEqual({ x: reload.hero.x, y: reload.hero.y }, { x: 120, y: 140 });
  evidence.entrances.push({ id, acquisition: acquisition.length, defenders: z.enemies.length });
}
for (const id of ['crypt', 'archive', 'supply-highlands']) {
  const g = game(id),
    z = g.zone(),
    e = z.enemies.find((e) => e.type === 'boss' || e.roomCaptain),
    home = { ...e.home },
    old = id === 'supply-highlands' ? { x: 760, y: 564.0192378864668 } : { x: 1160, y: 1110 };
  delete z.defenderLayoutVersion;
  delete e.defenderHomeVersion;
  Object.assign(e, old, { home: { ...old }, hp: 37, aggro: true, telegraph: { timer: 1 } });
  const cast = e.telegraph,
    enemyId = e.id,
    hero = { x: g.hero.x, y: g.hero.y };
  g.defenderEncounterLayout(z);
  assert.deepEqual(e.home, old, 'active encounter retains its anchor');
  assert.equal(e.telegraph, cast);
  assert.equal(e.hp, 37);
  e.aggro = false;
  e.telegraph = null;
  Object.assign(g.hero, home);
  g.defenderEncounterLayout(z);
  assert.deepEqual(e.home, old, 'occupied destination defers');
  Object.assign(g.hero, hero);
  g.defenderEncounterLayout(z);
  assert.deepEqual(e.home, home);
  assert.equal(e.hp, 37);
  assert.equal(e.id, enemyId);
  assert.deepEqual({ x: g.hero.x, y: g.hero.y }, hero);
  Object.assign(e, { x: home.x + 30, y: home.y, hp: 0, deathPaid: true });
  delete z.defenderLayoutVersion;
  delete e.defenderHomeVersion;
  g.defenderEncounterLayout(z);
  assert.equal(e.hp, 0);
  assert(e.deathPaid);
  assert.equal(e.x, home.x + 30, 'dead position remains');
  assert.deepEqual(e.home, home);
  const saved = C.restore(g.snapshot(), () => 0.73);
  assert.equal(saved.zone().enemies.find((u) => u.id === enemyId).hp, 0);
  evidence.migrations.push({
    id,
    activeDeferred: true,
    occupiedDeferred: true,
    deadPreserved: true,
  });
}
for (const id of ['crypt', 'archive']) {
  const g = game(id),
    z = g.zone();
  // Actual pending TRUE creation, rather than constructing only a test actor.
  z.enemies = z.enemies.filter((e) => e.type !== 'boss');
  g.s.pending[id] = { kind: 'dungeon' };
  g.activatePending();
  const e = z.enemies.find((e) => e.type === 'boss' && e.form === 'true');
  assert(e);
  assert.deepEqual(e.home, C.rules.interiorEncounterLayout[id].boss);
}
for (const id of ['crypt', 'archive', 'mine'])
  for (const form of ['normal', 'true']) {
    const g = game(id),
      z = g.zone();
    z.enemies = z.enemies.filter((e) => e.type !== 'boss');
    const e = g.bossEnemy(g.boss(id), form, g.dungeonBossHome());
    z.enemies.push(e);
    Object.assign(g.hero, {
      x: e.x - (id === 'mine' ? 400 : 100),
      y: e.y,
      hp: 1e8,
      maxHp: 1e8,
      immune: 1e8,
    });
    assert(!g.blocked(g.hero.x, g.hero.y, id, g.actorRadius(g.hero)));
    const indices = id === 'crypt' ? [1, 3] : id === 'archive' ? [1, 2] : [3];
    for (const index of indices) {
      e.telegraph = null;
      e.sequence = [];
      e.motion = null;
      assert(g.startAttack(e, g.hero, index), id + ' signature starts');
      const cast = e.telegraph,
        sequence = [cast, ...e.sequence];
      g.damage(e, 1, 'hero', { piercing: true });
      assert.equal(e.telegraph, cast, 'ordinary hit retains warning');
      if (id === 'archive' && index === 1) {
        assert.equal(cast.arenaLines.length, 2);
        assert(cast.arenaLines.every((a) => Math.hypot(a.x - a.fromX, a.y - a.fromY) >= 80));
      }
      for (const a of sequence) g.resolveAttack(e, a);
      if (id === 'mine') {
        assert(e.motion);
        const start = { x: e.x, y: e.y };
        for (let n = 0; n < 100 && e.motion; n++) g.advanceMotion(e, 0.02);
        assert(dist(start, e) >= 350, 'Colossus can charge down existing haulage lane');
        assert(!g.blocked(e.x, e.y, id, g.actorRadius(e)));
      }
      evidence.signatures.push({ id, form, index, stages: sequence.length });
    }
    const plan = C.rules.attacks[id].find((a) => a.kind === 'summon');
    const count = g.summonBossAdds(e, plan, g.bossSummonCap(e));
    const adds = g.bossOwnedSummons(e);
    assert(adds.length > 0, id + '/' + form + ' deploys summons (including TRUE damage response)');
    for (const add of adds) {
      assert(!g.blocked(add.x, add.y, id, g.actorRadius(add)));
      assert(
        z.enemies
          .filter((u) => u !== add && u.hp > 0)
          .every((u) => dist(add, u) >= g.actorRadius(add) + g.actorRadius(u)),
        'summon body separation',
      );
      assert(
        Array.from({ length: 12 }, (_, j) => ({
          x: add.x + Math.cos((j * Math.PI) / 6) * 80,
          y: add.y + Math.sin((j * Math.PI) / 6) * 80,
        })).some((p) => g.clearSegment(add, p, g.actorRadius(add))),
        'summon can leave its post',
      );
    }
    evidence.summons.push({ id, form, count: adds.length });
  }
for (const room of C.rules.supplyRooms) {
  const g = game(room.id);
  assert(
    g.zone().enemies.every((e) => !g.blocked(e.x, e.y, room.id, g.actorRadius(e))),
    room.id + ' all Treasury defenders body-clear',
  );
}
const crag = game('supply-highlands'),
  captain = crag.zone().enemies.find((e) => e.roomCaptain);
Object.assign(crag.hero, { x: 570, y: 430, hp: 1e8, maxHp: 1e8, immune: 1e8 });
crag.engage(captain, true, false);
assert(crag.startCaptainAttack(captain, crag.hero));
let impacts = 0;
const resolve = crag.resolveAttack;
crag.resolveAttack = function (e, ...args) {
  if (e === captain) impacts++;
  return resolve.call(this, e, ...args);
};
for (let i = 0; i < 60; i++) {
  crag.s.time += 0.1;
  crag.updateEnemies(0.1);
  crag.updateProjectiles(0.1);
}
assert(impacts > 0, 'Crag resolves skills from repaired room');
evidence.crag = {
  impacts,
  bodyClear: !crag.blocked(captain.x, captain.y, crag.zoneId, crag.actorRadius(captain)),
};
require('node:fs').writeFileSync(
  'tools/visual-review/defender-space-dev129/focused-result.json',
  JSON.stringify(evidence, null, 2) + '\n',
);
console.log(
  'Defender space: arrivals, prepared defense, signatures/summons and save migration pass.',
);
