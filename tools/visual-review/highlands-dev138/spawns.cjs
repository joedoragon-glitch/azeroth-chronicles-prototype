'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  C = require('../../../src/prototype/engine.js'),
  controls = require('./dev137-spawn-rosters.json'),
  fixture = require('./dev137-save.json');
const report = { baseline: controls.baseline, fresh: [], pending: null };
const random = (seed) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const roster = (z) =>
  z.enemies
    .filter((e) => !e.summon && !e.reinforcement)
    .map((e) => e.id)
    .sort();
for (const seed of [7, 39, 89, 319]) {
  const g = new C('developer', 'paladin', random(seed));
  g.s.zone = 'highlands';
  const a = controls.rows.find((row) => row.seed === seed),
    z = g.zone();
  assert.deepEqual(roster(z), roster(a), 'same original spawn IDs and count');
  assert.equal(z.enemies.length, a.enemies.length);
  for (const e of z.enemies)
    assert(!g.blocked(e.home.x, e.home.y, z.id, g.actorRadius(e)), 'clear spawn ' + e.id);
  const initial = roster(z);
  g.s.clock = 700;
  g.updateNight();
  assert.deepEqual(roster(g.zone()), initial, 'Highlands keeps original night rules');
  g.enter('march');
  g.enter('highlands', C.rules.harbors.highlands.arrival);
  assert.deepEqual(roster(g.zone()), initial, 'leaving and returning loses no native spawns');
  const restored = C.restore(g.snapshot());
  assert.deepEqual(roster(restored.zone()), initial, 'save/reload loses no native spawns');
  report.fresh.push({
    seed,
    before: a.enemies.length,
    after: z.enemies.length,
    ordinary: z.enemies.filter((e) => e.type !== 'boss').length,
    bosses: z.enemies.filter((e) => e.type === 'boss').length,
    clearHomes: true,
    nightAndReturnAndReload: true,
  });
}
const data = structuredClone(fixture),
  z = data.zones.highlands,
  wolf = z.enemies.find(
    (e) => e.species === 'wolf' && !e.mountedCrownRider && !e.mini && !e.stronghold && !e.site,
  ),
  boss = z.enemies.find((e) => e.type === 'boss' && e.family === 'ridge');
assert(wolf && boss);
wolf.hp = boss.hp = 0;
data.pending.wolf = {
  kind: 'mob',
  count: 2,
  zone: 'highlands',
  base: structuredClone(wolf),
  delay: 0.1,
};
data.pending.ridge = {
  kind: 'field',
  count: 1,
  zone: 'highlands',
  base: structuredClone(boss),
  delay: 0.1,
};
const g = C.restore(data),
  native = roster(g.zone());
for (const p of Object.values(g.s.pending).filter((p) => p.zone === 'highlands' && p.base))
  assert.deepEqual(
    p.base.home,
    g.zone().enemies.find((e) => e.id === p.base.id).home,
    'pending source follows its original home',
  );
Object.assign(g.hero, { x: 425, y: 1900 });
g.updateElites(0.2);
assert(g.s.pending.wolf.active, 'both ringleaders can spawn');
assert(g.s.pending.ridge.active, 'TRUE Ridge can spawn');
const elites = g.zone().enemies.filter((e) => e.eliteKey === 'wolf' || e.eliteKey === 'ridge');
assert.equal(elites.filter((e) => e.eliteKey === 'wolf').length, 2);
assert.equal(elites.filter((e) => e.eliteKey === 'ridge').length, 1);
assert(
  native.every((id) => g.zone().enemies.some((e) => e.id === id)),
  'pending activation retains native IDs',
);
for (const e of elites) assert(!g.blocked(e.x, e.y), 'elite on walkable land');
report.pending = {
  originalNativeIds: native.length,
  ringleaders: 2,
  trueRidge: 1,
  relocatedSourceHomes: true,
  clearSpawnPoints: true,
  noNativeLoss: true,
};
fs.writeFileSync(path.join(__dirname, 'spawn-checks.json'), JSON.stringify(report, null, 2) + '\n');
console.log(
  'PASS four-seed original spawn IDs/count, clear homes, night/return/reload, both pending ringleaders and TRUE Ridge',
);
