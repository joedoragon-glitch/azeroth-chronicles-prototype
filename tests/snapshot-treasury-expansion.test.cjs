'use strict';
const claimThrone = require('./helpers/claim-throne.cjs');
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
const size = 1400,
  profile = C.rules.roomCaptains['supply-crown'];
for (const mode of ['normal', 'nightmare'])
  for (const cls of ['paladin', 'mage', 'ranger']) {
    const c = new C(mode, cls, () => 0.6);
    c.enter('supply-crown');
    const z = c.zone(),
      captain = z.enemies.find((e) => e.roomCaptain),
      exit = z.npcs.find((n) => n.kind === 'exit');
    assert.equal(c.zoneSize(), size);
    assert.equal(z.treasuryVersion, 5);
    assert.equal(z.enemies.filter((u) => u.roomGuard).length, 11, 'expanded Treasury has ten sentries plus original captain');
    assert.equal(captain.baseHp, 5000);
    for (const id of [
      'agricultural-stores',
      'distribution-gallery',
      'roost-chamber',
      'hoard-chamber',
      'ash-den',
      'inner-vault',
    ]) {
      const area = C.rules.treasuryArchitecture['supply-crown'].walkable.find((a) => a.id === id);
      assert(area, id + ' real floor');
      const [x1, x2, y1, y2] = area.bounds,
        p = c.safe((x1 + x2) / 2, (y1 + y2) / 2);
      assert(c.route(exit, p).length, id + ' reachable from entrance');
    }
    assert.equal(z.npcs.filter((n) => n.kind === 'bundle').length, 3);
    for (const n of z.npcs.filter((n) => n.kind === 'bundle')) assert(c.route(exit, n).length);
    c.s.party = [];
    Object.assign(c.hero, { x: captain.x + 80, y: captain.y });
    c.engage(captain, true, false);
    const ring = c.dreadClosurePlan(captain);
    assert(ring);
    assert.equal(
      ring.initialRadius,
      profile.attacks[4].initialRadius,
      'full authored ring fits actual Inner Vault',
    );
    assert.equal(ring.x, captain.x);
    assert.equal(ring.y, captain.y, 'no offset required in main arena');
    const rush = c.dreadRushPlan(captain, c.hero);
    assert(rush);
    assert(
      Math.abs(
        Math.hypot(rush.first.x - captain.x, rush.first.y - captain.y) -
          profile.attacks[1].legLength,
      ) < 1e-7,
      'full first leg',
    );
    assert(
      Math.abs(
        Math.hypot(rush.next.x - rush.first.x, rush.next.y - rush.first.y) -
          profile.attacks[1].legLength,
      ) < 1e-7,
      'full second leg',
    );
  }
for (const state of ['living', 'wounded', 'dead', 'collected']) {
  const c = new C('normal', 'paladin', () => 0.6);
  c.enter('crown');
  c.enter('supply-crown');
  const raw = c.snapshot(),
    z = raw.zones['supply-crown'],
    e = z.enemies.find((u) => u.roomCaptain),
    ids = z.enemies.map((u) => u.id);
  z.treasuryVersion = 4;
  const oldPosts = [
    [330, 260],
    [585, 315],
    [300, 520],
    [705, 650],
  ];
  z.enemies
    .filter((u) => u.roomGuard)
    .slice(0, 4) // Displace historical posts only, not newly added sentries.
    .forEach((u, i) => {
      const [x, y] = oldPosts[i];
      Object.assign(u, { x, y, home: { x, y } });
    });
  const oldCaches = [
    [705, 285],
    [270, 700],
    [735, 725],
  ];
  z.npcs
    .filter((u) => u.kind === 'bundle')
    .sort((a, b) => a.index - b.index)
    .forEach((n, i) => {
      const [x, y] = oldCaches[i];
      Object.assign(n, { x, y });
    });
  if (state === 'wounded') {
    e.hp = e.maxHp * 0.37;
    e.captainPhase = true;
  }
  if (state === 'dead') e.hp = 0;
  if (state === 'collected')
    raw.discovered['crown:bundle-0'] = raw.discovered['crown:bundle-2'] = true;
  const hp = e.hp,
    phase = e.captainPhase,
    r = C.restore(raw, () => 0.6),
    rz = r.zone(),
    restored = rz.enemies.find((u) => u.id === e.id);
  assert.equal(rz.treasuryVersion, 5);
  assert.deepEqual(
    rz.enemies.map((u) => u.id),
    ids,
    'no duplicate or lost existing occupants',
  );
  assert.equal(restored.hp, hp, 'raw migration preserves actual HP/dead state');
  assert.equal(restored.captainPhase, false, 'existing restore contract resets encounter phase');
  assert.deepEqual(restored.home, { x: 985, y: 980 });
  const visible = r.visibleNPCs().filter((n) => n.kind === 'bundle');
  assert.equal(visible.length, state === 'collected' ? 1 : 3, 'cache discovery progress retained');
  const before = JSON.stringify(r.s);
  r.zone();
  r.zone();
  assert.equal(JSON.stringify(r.s), before, 'layout migration is idempotent');
  assert(!r.blocked(r.hero.x, r.hero.y));
  for (const n of visible) assert(r.route(r.hero, n).length);
}
console.log(
  'PASS expanded shared Treasury: six class/mode full-size attack arenas, reachable stores/gallery/caches, retained captain and guard IDs plus seven sentries, five historical state migrations and idempotence',
);

{
  const c = new C('normal', 'mage', () => 0.6);
  c.enter('supply-crown');
  const z = c.zone(),
    e = z.enemies.find((u) => u.roomCaptain);
  e.captainPhase = true;
  e.captainReflect = 3;
  e.hp = 1700;
  e.aggro = true;
  z.treasuryVersion = 4;
  c.treasuryInterior(z);
  assert.equal(e.captainPhase, true);
  assert.equal(e.captainReflect, 3);
  assert.equal(e.hp, 1700, 'live layout reconciliation does not restart phase/reflection/heal');
}

{
  const c = new C('normal', 'mage', () => 0.6);
  for (const b of C.data.bosses) c.victory(b.id, 'normal');
  for (const id of ['darklord', ...C.dungeonIds]) c.victory(id, 'true');
  claimThrone(c);c.checkEnding();
  assert(c.peace);
  c.enter('supply-crown');
  const raw = c.snapshot();
  raw.zones['supply-crown'].treasuryVersion = 4;
  raw.discovered['crown:bundle-0'] = true;
  const r = C.restore(raw, () => 0.6);
  assert(r.peace);
  assert.equal(r.zone().treasuryVersion, 5);
  assert(r.zone().enemies.every((e) => e.neutral && !e.guard && !e.summon));
  assert.equal(r.visibleNPCs().filter((n) => n.kind === 'bundle').length, 2);
  const before = JSON.stringify(r.s);
  r.zone();
  assert.equal(JSON.stringify(r.s), before);
}
