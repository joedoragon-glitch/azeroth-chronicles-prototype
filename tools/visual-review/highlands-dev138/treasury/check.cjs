'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  C = require('../../../../src/prototype/engine'),
  Sprites = require('../../../../src/prototype/sprites'),
  fixture = require('./dev137-save.json'),
  control = require('./dev137-control-defenders.json');
const report = { scenes: [], migration: null };
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  stable = (z) =>
    JSON.stringify({
      props: z.props,
      npcs: z.npcs.map((n) => ({ id: n.id, x: n.x, y: n.y, kind: n.kind })),
      homes: z.enemies.map((e) => [e.id, e.home]),
    });
function inspect(g, label) {
  const z = g.zone(),
    exit = z.npcs.find((n) => n.id === 'exit');
  assert.equal(z.treasuryVersion, 6);
  assert.equal(z.enemies.length, 7);
  assert.equal(z.enemies.filter((e) => e.roomCaptain).length, 1);
  assert.equal(z.enemies.filter((e) => e.mountedCrownRider).length, 6);
  assert.equal(z.npcs.filter((n) => n.kind === 'bundle' && !n.treasuryRecovery).length, 3);
  for (const n of z.npcs) {
    assert(!g.blocked(n.x, n.y, z.id, 15), 'NPC in room ' + n.id);
    assert(g.route(exit, n).length, 'NPC route ' + n.id);
  }
  for (const p of z.props) {
    assert.equal(Sprites.definitionFor({ ...p, renderKind: 'prop' }, 2), null);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      assert(
        !g.blocked(p.x + Math.cos(a) * 45, p.y + Math.sin(a) * 45, z.id, 0, true),
        'visual base inside room ' + p.structure,
      );
    }
    if (p.r) assert(g.blocked(p.x, p.y), 'physical prop actually blocks');
  }
  for (const e of z.enemies) {
    assert(
      !g.blocked(e.home.x, e.home.y, z.id, g.actorRadius(e)),
      'defender body clearance ' + e.id,
    );
    assert(g.route(exit, e.home).length, 'defender access ' + e.id);
    assert(g.enemyFort(e), 'existing fort advantage ' + e.id);
    assert.equal(Sprites.definitionFor({ ...e, renderKind: 'enemy' }, 2), null);
  }
  const front = { x: 330, y: 350 },
    cover = z.enemies.filter(
      (e) => e.ranged && g.enemyRangedLine(e, front) && dist(e, front) <= g.enemyRangedRange(e),
    );
  assert(cover.length >= 2, 'retain original two-archer entry crossfire');
  const captain = z.enemies.find((e) => e.roomCaptain);
  assert(
    dist(
      captain,
      z.enemies.find((e) => e.ranged && e.id !== cover[0].id),
    ) > 60,
  );
  const before = stable(z);
  g.zone();
  assert.equal(stable(z), before, 'repeat access stable');
  const h = C.restore(g.snapshot());
  assert.equal(stable(h.zone()), before, 'repeat restore spatially stable');
  report.scenes.push({
    label,
    defenders: 7,
    mountedRiders: 6,
    caches: 3,
    props: z.props.length,
    propsInside: true,
    defenderFortPreserved: true,
    entryRangedPosts: cover.length,
    routes: true,
    spatiallyStable: true,
  });
}
const fresh = new C('normal', 'paladin', () => 0.37);
fresh.enter('supply-highlands');
inspect(fresh, 'fresh');
const live = C.restore(fixture);
inspect(live, 'dev137');
for (const e of control) {
  const actual = live.zone().enemies.find((p) => p.id === e.id);
  for (const key of [
    'species',
    'hp',
    'maxHp',
    'baseHp',
    'damage',
    'baseDamage',
    'level',
    'gold',
    'xp',
  ])
    assert.equal(actual[key], e[key], 'normal legacy restore stats ' + key);
}
const data = structuredClone(fixture),
  id = data.zones['supply-highlands'].enemies[0].id;
data.zones['supply-highlands'].enemies[0].hp = 0;
data.zones['supply-highlands'].enemies[0].deathPaid = true;
data.discovered['highlands:bundle-2'] = true;
data.treasuryRecovery.highlands = { crowns: 735.5, unlocked: false, respawnAt: 900.25 };
data.zones['supply-highlands'].npcs.push({
  id: 'seized-crowns-highlands',
  kind: 'bundle',
  treasuryRecovery: true,
  region: 'highlands',
  x: 700,
  y: 470,
  name: 'Seized crowns',
});
const g = C.restore(data);
assert.equal(g.zone().enemies.find((e) => e.id === id).hp, 0);
assert(g.zone().enemies.find((e) => e.id === id).deathPaid);
assert(g.s.discovered['highlands:bundle-2']);
assert(!g.s.discovered['highlands:bundle-0']);
assert.equal(g.treasuryLostCrowns(), 735.5);
assert.equal(g.s.treasuryRecovery.highlands.respawnAt, 900.25);
assert(g.zone().npcs.some((n) => n.id === 'seized-crowns-highlands'));
assert.deepEqual(
  new Set(
    g
      .zone()
      .props.filter((p) => /^treasury-\d+$/.test(p.id))
      .slice(0, 16)
      .map((p) => p.id),
  ),
  new Set(fixture.zones['supply-highlands'].props.map((p) => p.id)),
);
report.migration = {
  guardDeathAndPaid: true,
  exactCollectedCacheIndex: 2,
  seizedCrowns: 735.5,
  returnDeadline: 900.25,
  oldPropIdsRetained: 16,
  defenderIdsRetained: 7,
  statsMatchNormalDev137Restore: true,
};
const returning = new C('normal', 'paladin', () => 0.37);
returning.enter('supply-highlands');
const rz = returning.zone(),
  ids = rz.enemies.map((e) => e.id).sort(),
  cap = rz.enemies.find((e) => e.roomCaptain);
returning.treasuryRecoveryState('highlands').crowns = 91.5;
cap.hp = 0;
returning.treasuryCaptainDefeated(cap);
const deadline = returning.treasuryRecoveryState('highlands').respawnAt;
returning.s.time = deadline + 0.1;
Object.assign(returning.hero, { x: 100, y: 100 });
returning.syncTreasuryRecovery(rz);
assert.equal(
  rz.enemies.filter((e) => e.hp > 0 && e.roomGuard).length,
  7,
  'all seven defenders return together',
);
assert.deepEqual(rz.enemies.map((e) => e.id).sort(), ids);
assert.equal(returning.treasuryLostCrowns(), 91.5);
assert(!returning.treasuryRecoveryState('highlands').unlocked);
const pending = structuredClone(fixture),
  base = structuredClone(pending.zones['supply-highlands'].enemies[0]);
base.hp = 0;
pending.pending.wolf = { kind: 'mob', count: 2, zone: 'supply-highlands', base, delay: 9.5 };
const wave = C.restore(pending);
assert.equal(wave.s.pending.wolf.delay, 9.5);
assert.deepEqual(
  wave.s.pending.wolf.base.home,
  wave.zone().enemies.find((e) => e.id === base.id).home,
);
Object.assign(wave.hero, { x: 100, y: 100 });
wave.updateElites(10);
assert(wave.s.pending.wolf.active);
assert.equal(wave.zone().enemies.filter((e) => e.eliteKey === 'wolf').length, 2);
report.returnAndPending = {
  allSevenOriginalIdsReturn: true,
  crownsPreserved: 91.5,
  pendingTimerPreserved: 9.5,
  pendingRingleaders: 2,
};
fs.writeFileSync(path.join(__dirname, 'checks.json'), JSON.stringify(report, null, 2) + '\n');
console.log(
  'PASS Treasury routes/body/base bounds, seven defenders, crossfire/fort, procedural selection, legacy progress and exact stats',
);
