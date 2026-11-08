'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
function world(id = 'frontier') {
  const g = new C('developer', 'paladin', () => 0.9);
  g.s.zone = id;
  g.zone();
  g.s.party = [];
  g.s.mercyTime = 0;
  g.s.clock = 120;
  return g;
}
function hostile(g, x = 3000, y = 950, ranged = true) {
  const e = g.makeEnemy(
    {
      species: 'archer',
      name: 'Garrison fixture',
      level: 10,
      hp: 10000,
      damage: 80,
      xp: 0,
      gold: 0,
    },
    { x, y },
  );
  Object.assign(e, { ranged, shotRange: 280, cd: 0, specialCd: 999, rogueCd: 999, aggro: true });
  g.zone().enemies = [e];
  for (const other of g.zone().enemies) if (other !== e) other.hp = 0;
  return e;
}
function fixture() {
  const g = world();
  const e = hostile(g);
  Object.assign(g.hero, { x: 3340, y: 950, hp: 10000, maxHp: 10000, immune: 0 });
  return { g, e };
}
// All ranged archetypes/legacy shot metadata now share the owner's final
// 320 basic/detection distance or 416 in a native fortified footprint.
{
  const { g, e } = fixture();
  const profiles = [
    ['mireling', 230], ['goblin', 240], ['reedbeast', 250],
    ['ogre', 260], ['orc', 260], ['ashbeast', 270],
    ['archer', 280], ['crownguard', 280], ['wraith', 280],
    ['skeleton', 290], ['other', null],
  ];
  assert.equal(C.rules.balance.enemyRangedBasicRange, 320);
  assert.equal(C.rules.balance.enemyRangedBasicRangeMultiplier, undefined,
    'obsolete ranged 10% bonus is removed');
  assert.equal(C.rules.balance.fortifications.rangeMultiplier, 1.3);
  for (const [species, legacyShotRange] of profiles) {
    Object.assign(e, { species, ranged: true, x: 3400 });
    if (legacyShotRange === null) delete e.shotRange;
    else e.shotRange = legacyShotRange;
    assert.equal(g.enemyFort(e), null, species + ': outside native fort');
    assert.equal(g.enemyRangedRange(e), 320, species + ': outdoor basic');
    assert.equal(g.enemyAcquisitionRange(e), 320, species + ': outdoor detection');
    e.x = 3000;
    assert(g.enemyFort(e), species + ': inside native fort');
    assert.equal(g.enemyRangedRange(e), 416, species + ': garrison basic');
    assert.equal(g.enemyAcquisitionRange(e), 416, species + ': garrison detection');
  }
  Object.assign(e, { species: 'goblin', ranged: true, hybrid: true, shotRange: 750, x: 3400 });
  assert.equal(g.enemyRangedRange(e), 320, 'hybrid old shotRange cannot alter basics');
  assert.equal(g.enemyAcquisitionRange(e), 320, 'hybrid actual detection equals basic');
  Object.assign(e, { ranged: false, shotRange: 900, species: 'skeleton' });
  assert.equal(g.enemyAcquisitionRange(e), 286, 'explicit melee keeps existing awareness');
}
// One authored ranged basic range controls both shot and detection; melee
// awareness may still be adjusted independently, but not the ranged value.
{
  const { g, e } = fixture();
  const balance = C.rules.balance;
  const oldRange = balance.enemyRangedBasicRange,
    oldMeleeDetection = balance.enemyAcquisitionRangeMultiplier;
  try {
    assert.equal(g.enemyRangedRange(e), 416);
    assert.equal(g.enemyAcquisitionRange(e), 416);
    balance.enemyRangedBasicRange = 340;
    assert.equal(g.enemyRangedRange(e), 442, 'fortified basic follows configured distance');
    assert.equal(g.enemyAcquisitionRange(e), 442, 'fortified detection follows basic distance');
    e.x = 3400;
    assert.equal(g.enemyRangedRange(e), 340);
    assert.equal(g.enemyAcquisitionRange(e), 340);
    balance.enemyRangedBasicRange = 280;
    assert.equal(g.enemyRangedRange(e), 280);
    assert.equal(g.enemyAcquisitionRange(e), 280, 'no hidden 10% awareness floor');
    e.x = 3000;
    assert.equal(g.enemyRangedRange(e), 364);
    assert.equal(g.enemyAcquisitionRange(e), 364);
    balance.enemyAcquisitionRangeMultiplier = 1.5;
    assert.equal(g.enemyAcquisitionRange(e), 364,
      'melee perception multiplier never changes ranged detection');
    e.ranged = false;
    assert.equal(g.enemyAcquisitionRange(e), 390, 'melee perception stays independent');
  } finally {
    balance.enemyRangedBasicRange = oldRange;
    balance.enemyAcquisitionRangeMultiplier = oldMeleeDetection;
  }
}
// The real fortified AI must see a valid target and prepare basic fire.
{
  const { g, e } = fixture();
  e.aggro = false;
  assert(g.enemyFort(e));
  assert(g.enemyRangedLine(e, g.hero));
  g.updateEnemies(0.01);
  assert(e.aggro, 'native fort AI automatically spots visible target in 416 reach');
}
// Native wall-line and passive aggro must agree with fortified basic reach.
{
  const { g, e } = fixture();
  e.aggro = false;
  assert(g.enemyFort(e));
  assert(g.enemyRangedLine(e, g.hero));
  g.updateEnemies(0.01);
  assert(e.aggro, 'idle fortified ranged actor auto-detects inside basic shot range');
}
// PR #817 global perimeter contract: the same 160-unit position-derived apron
// applies to every defended outdoor region, not just Greenwood/Skeleton Watch.
// Inspect actual generated polygons so moved forts remain covered.
{
  const cfg = C.rules.balance.fortifications, apron = cfg.outdoorLeeway;
  assert.equal(apron, 160);
  const ring = [
    [-145, -105], [-70, -145], [70, -145], [145, -105], [155, 20],
    [115, 120], [40, 155], [-40, 155], [-115, 120], [-155, 20],
  ];
  const regions = [...new Set(C.rules.creatureStrongholds.map((p) => p.region))];
  assert.deepEqual(regions, ['vale', 'march', 'highlands', 'frontier', 'crown']);
  let holds = 0, fields = 0, authoredFields = 0, crownParcels = 0;
  for (const region of regions) {
    const g = world(region), zone = g.zone(), areas = g.fortAreas();
    for (const plan of C.rules.creatureStrongholds.filter((p) => p.region === region)) {
      const area = areas.find((p) => p.id === plan.id);
      assert(area, plan.id + ': native defended footprint is registered');
      assert(zone.props.some((p) => p.stronghold === plan.id && !p.decorative && p.r > 0),
        plan.id + ': a real wall is still required');
      const authoredWalls = zone.props.filter((p) =>
        p.stronghold === plan.id && p.greenwoodWall && p.r > 0);
      if (authoredWalls.length >= 3) {
        // The reconstructed Greenwood walls are long line segments rather
        // than the legacy ten individual ring posts; protection must be
        // derived from their actual endpoints and include the outdoor apron.
        assert(area.points.length > ring.length,
          plan.id + ': contour follows the authored line-wall exterior');
        const endpoints = authoredWalls.flatMap((p) =>
          [p.greenwoodWall.a, p.greenwoodWall.b]);
        const box = (points) => ({
          left: Math.min(...points.map((p) => p.x)),
          right: Math.max(...points.map((p) => p.x)),
          top: Math.min(...points.map((p) => p.y)),
          bottom: Math.max(...points.map((p) => p.y)),
        });
        const wallsBox = box(endpoints),
          contour = box(area.points.map(([x, y]) => ({ x, y })));
        for (const side of ['left', 'right', 'top', 'bottom']) {
          const delta = Math.abs(contour[side] - wallsBox[side]);
          assert(delta >= apron - 2 && delta <= apron + 3,
            plan.id + ': actual wall ' + side + ' has requested outdoor leeway');
        }
      } else if (plan.defenseStyle === 'fort') {
        assert.equal(area.points[1][0] - area.points[0][0], 2 * (150 + apron),
          plan.id + ': square fort horizontal margin');
        assert.equal(area.points[2][1] - area.points[1][1], 2 * (150 + apron),
          plan.id + ': square fort vertical margin');
      } else {
        assert.equal(area.points.length, ring.length);
        // The midpoint of symmetrical outer vertices yields the current
        // relocated wall-derived center, rather than the obsolete plan center.
        const east = area.points[4], west = area.points[9];
        const cx = (east[0] + west[0]) / 2;
        const cy = east[1] - 20 * (1 + apron / Math.hypot(155, 20));
        for (let i = 0; i < ring.length; i++) {
          const [dx, dy] = ring[i], scale = 1 + apron / Math.hypot(dx, dy);
          assert(Math.hypot(
            area.points[i][0] - (cx + dx * scale),
            area.points[i][1] - (cy + dy * scale),
          ) < 1e-6, plan.id + ': enlarged vertex ' + i + ' follows relocated walls');
        }
      }
      holds++;
    }
    for (const mini of (zone.minis || []).filter((m) => m.type === 'field')) {
      authoredFields++;
      const hasWall = zone.props.some((p) =>
        p.mini === mini.id && String(p.id).startsWith('mini-wall-') && !p.decorative);
      const a = areas.find((area) => area.id === mini.id);
      if (!hasWall) {
        // World generation can omit *all* walls at a blocked field site.
        // A site label by itself must never grant fortified protection.
        assert.equal(a, undefined, mini.id + ': unwalled field site is not a fort');
        continue;
      }
      assert(a, mini.id + ': real walled field compound');
      assert.deepEqual(a.points[0], [
        mini.x - cfg.compoundHalfSize - apron,
        mini.y - cfg.compoundHalfSize - apron,
      ], mini.id + ': all field compounds use global margin');
      assert.deepEqual(a.points[2], [
        mini.x + cfg.compoundHalfSize + apron,
        mini.y + cfg.compoundHalfSize + apron,
      ], mini.id + ': opposite field edge also extended');
      fields++;
    }
    for (const plan of cfg.outdoorAreas.filter((p) => p.zone === region)) {
      const a = areas.find((area) => area.id === plan.id);
      assert(a, plan.id + ': Crown outdoor parcel registered');
      assert.deepEqual(a.points[0], [plan.bounds[0] - apron, plan.bounds[2] - apron]);
      assert.deepEqual(a.points[2], [plan.bounds[1] + apron, plan.bounds[3] + apron]);
      crownParcels++;
    }
  }
  assert.equal(holds, C.rules.creatureStrongholds.length, 'all creature strongholds checked');
  assert.equal(authoredFields, 5, 'all five authored field-boss sites inspected');
  assert(fields >= 4 && fields <= authoredFields,
    'every actually walled field compound uses the margin; unwalled sites remain exempt');
  assert.equal(crownParcels, cfg.outdoorAreas.length, 'all Crown parcels checked');
}
{
  const cfg = C.rules.balance.fortifications, g = world('vale');
  const watch = g.fortAreas().find((area) => area.id === 'skeleton-watch');
  const defender = g.zone().enemies.find(
    (e) => e.hp > 0 && e.stronghold === 'skeleton-watch',
  );
  assert(watch && defender, 'real Skeleton Watch guard and live walls are present');
  const oldPosition = { x: defender.x, y: defender.y };
  const wallEnds = g.zone().props.filter((p) =>
    p.stronghold === 'skeleton-watch' && p.greenwoodWall)
    .flatMap((p) => [p.greenwoodWall.a, p.greenwoodWall.b]);
  assert(wallEnds.length >= 6, 'Skeleton Watch has physical line-wall endpoints');
  const eastX = Math.max(...wallEnds.map((p) => p.x)),
    minY = Math.min(...wallEnds.map((p) => p.y)),
    maxY = Math.max(...wallEnds.map((p) => p.y)),
    eastY = (minY + maxY) / 2;
  defender.x = eastX + cfg.outdoorLeeway - 10;
  defender.y = eastY;
  assert(defender.x > eastX, 'pursuer has stepped outside the actual visible eastern wall');
  assert.equal(g.enemyFort(defender)?.id, 'skeleton-watch', 'protection persists in the real wall apron');
  assert.equal(g.enemyRangedRange(defender), 416, 'position grants the fortified ranged basic value');
  // The natural Skeleton Watch guard in this fixture is melee. Its awareness
  // stays governed by the independent melee rule, not the ranged 416-unit rule.
  assert.equal(g.enemyAcquisitionRange(defender),
    g.enemyRanged(defender) ? 416 :
      C.rules.balance.enemyAcquisitionRange *
      C.rules.balance.enemyAcquisitionRangeMultiplier,
    'melee awareness remains separate from fortified ranged detection');
  const ranged = { ...defender, id: 'apron-ranged-fixture', species: 'archer', ranged: true };
  g.zone().enemies.push(ranged);
  assert.equal(g.enemyAcquisitionRange(ranged), 416,
    'a genuinely ranged guard detects targets at 416 while inside the apron');
  g.zone().enemies.pop();
  const shot = { source: 'enemy', sourceId: defender.id, x: defender.x, y: defender.y,
    dx: 1, dy: 0, speed: 300, life: 2 };
  g.prepareFortProjectile(shot, defender);
  assert.equal(shot.fortId, 'skeleton-watch', 'apron shooter keeps own-wall launch rights');
  const restored = C.restore(g.snapshot(), () => 0.9);
  const restoredGuard = restored.zone().enemies.find((enemy) => enemy.id === defender.id);
  assert.equal(restored.enemyFort(restoredGuard)?.id, 'skeleton-watch',
    'restoring v4 save derives the same protection without saved timers');
  defender.x = eastX + cfg.outdoorLeeway + 25;
  assert.equal(g.enemyFort(defender), null, 'outside the true wall + outdoor apron removes protection');
  assert.equal(g.enemyRangedRange(defender), 320, 'normal basic attack range returns');
  const outside = { source: 'enemy', sourceId: defender.id, x: defender.x, y: defender.y,
    dx: 1, dy: 0, speed: 300, life: 2 };
  g.prepareFortProjectile(outside, defender);
  assert.equal(outside.fortId, undefined, 'outside launches do not inherit fort wall rights');
  Object.assign(defender, oldPosition);
  assert.equal(g.enemyFort(defender)?.id, 'skeleton-watch', 'returning home restores the passive');
}
{
  // Interior rooms and Treasury passages must not acquire a 160-unit halo.
  for (const id of ['abyss', 'citadel', 'side-highlands-signal', 'supply-vale']) {
    const g = world(id),
      arch = C.rules.dungeonArchitecture[id] || C.rules.treasuryArchitecture[id];
    if (!arch?.walkable?.length) {
      // Old Signal Keep uses the existing size/edge fallback, not an authored
      // dungeonArchitecture.walkable collection. Its inner extent is unchanged.
      assert.equal(id, 'side-highlands-signal');
      const fallback = g.fortAreas().find((f) => f.id === id);
      assert(fallback, 'Old Signal Keep preserves the interior fallback');
      assert.deepEqual(fallback.points[0], [70, 70],
        'legacy indoor fallback does not acquire outdoor leeway');
      continue;
    }
    const room = arch.walkable[0], area = g.fortAreas().find((f) => f.id === id + '-' + room.id);
    assert(area, id + ': unchanged interior region found');
    assert.deepEqual(area.points[0], [room.bounds[0], room.bounds[2]],
      id + ': no outdoor margin applied inside rooms or Treasuries');
  }
}

// One catalog covers every regional hold, every field compound, fortified
// interiors and Crown command/final courtyard, and survives save restoration.
for (const id of [
  'vale',
  'march',
  'highlands',
  'frontier',
  'crown',
  'abyss',
  'citadel',
  'side-highlands-signal',
]) {
  const g = world(id),
    areas = g.fortAreas();
  assert(areas.length > 0, id);
  for (const plan of C.rules.creatureStrongholds.filter((p) => p.region === id))
    assert(
      areas.some((f) => f.id === plan.id),
      plan.id,
    );
  // Layouts need not invent a field- prefixed fort. Register every real
  // authored field mini-site that has defensive walls, by its stable ID.
  const builtFieldMinis = (g.zone().minis || []).filter((mini) =>
    mini.type === 'field' && g.zone().props.some((p) =>
      p.mini === mini.id && String(p.id).startsWith('mini-wall-') && !p.decorative));
  for (const mini of builtFieldMinis)
    assert(areas.some((fort) => fort.id === mini.id),
      id + ': real walled field fort ' + mini.id);
  const restored = C.restore(g.snapshot(), () => 0.9);
  assert.deepEqual(
    restored.fortAreas().map((f) => f.id),
    areas.map((f) => f.id),
  );
}
{
  const { g, e } = fixture();
  assert.equal(g.enemyFort(e).id, 'raider-drill-redoubt');
  assert(Math.abs(g.enemyRangedRange(e) - 416) < 1e-8);
  assert(!g.line(e, g.hero), 'ordinary sight blocked by stockade');
  assert(g.enemyRangedLine(e, g.hero));
  assert(!g.clearSegment(e, g.hero), 'movement still blocked');
  g.updateEnemies(0.01);
  assert(e.rangedAim, 'actual AI aims through own walls at extended range');
  e.rangedAim.timer = 0;
  g.updateEnemies(0.01);
  const p = g.s.projectiles.find((p) => p.sourceId === e.id);
  assert(p?.fortId);
  assert(g.fortProjectileLift(p) > 0);
  const start = g.hero.hp;
  for (let i = 0; i < 100 && g.s.projectiles.length; i++) g.updateProjectiles(0.02);
  assert(g.hero.hp < start, 'shot crosses stockade and damages hero');
  assert(!g.s.projectiles.length);
  // Position derived fresh on every use: no stale fort bonus when walking out.
  e.x = 3400;
  assert.equal(g.enemyFort(e), null);
  assert(Math.abs(g.enemyRangedRange(e) - 320) < 1e-8);
}
{
  const { g, e } = fixture();
  Object.assign(g.hero, { x: 3340, y: 950 });
  g.updateEnemies(0.01);
  e.rangedAim.timer = 0;
  g.updateEnemies(0.01);
  const p = g.s.projectiles[0];
  g.hero.y += 90;
  const hp = g.hero.hp;
  for (let i = 0; i < 130; i++) g.updateProjectiles(0.02);
  assert.equal(g.hero.hp, hp, 'wall fire stays dodgeable');
  assert(p.fortId);
  assert.equal(g.s.projectiles.length, 0);
}
{
  const { g, e } = fixture();
  const fort = g.enemyFort(e);
  g.zone().props.push({ id: 'unrelated-tree', x: 3290, y: 950, r: 22 });
  assert(!g.enemyRangedLine(e, g.hero), 'unrelated solids stop shots');
  g.zone().props.pop();
  g.zone().props.push({
    id: 'other-fort-wall',
    x: 3290,
    y: 950,
    r: 22,
    stronghold: 'orc-road-fort',
    structure: 'stockade',
  });
  assert(!g.enemyRangedLine(e, g.hero), 'other fort walls stop shots');
  assert(g.fortShotBlocked({ x: 1450, y: 1600 }, fort), 'ravine blocks wall fire');
}
for (const type of ['mob', 'boss']) {
  const { g, e } = fixture();
  Object.assign(g.hero, { x: 3050, y: 980 });
  if (type === 'boss') Object.assign(e, { type: 'boss', family: 'thorn' });
  const hp = e.hp;
  assert(g.damage(e, 100));
  assert.equal(hp - e.hp, 60, '40% fort reduction for ' + type);
  e.x = 3400;
  e.y = 950;
  e.home = { x: e.x, y: e.y };
  g.hero.x = 3420;
  g.hero.y = 950;
  const outside = e.hp;
  assert(g.damage(e, 100));
  assert.equal(outside - e.hp, 100, 'protection ends on leaving');
}
{
  const { g, e } = fixture();
  Object.assign(g.hero, { x: 3050, y: 980 });
  const hp = e.hp;
  assert(g.damage(e, 100, 'hero', { piercing: true }));
  assert.equal(hp - e.hp, 100, 'existing piercing bypass contract');
  const u = g.unit('soldier', 3050, 980);
  g.s.party = [u];
  const before = e.hp;
  assert(g.damage(e, 100, u.id));
  assert.equal(before - e.hp, 60);
  e.hp = 0;
  assert.equal(g.enemyFort(e), null);
  assert.equal(g.enemyFort(u), null);
  e.hp = 100;
  e.neutral = true;
  assert.equal(g.enemyFort(e), null);
}
{
  const { g, e } = fixture();
  e.x = 3400;
  const p = { source: 'enemy', sourceId: e.id, x: e.x, y: e.y, speed: 300, life: 2 };
  g.prepareFortProjectile(p, e);
  assert(!p.fortId, 'outside launches never gain wall permissions');
  e.x = 3050;
  g.prepareFortProjectile(p, e);
  g.s.projectiles = [p];
  const restored = C.restore(g.snapshot(), () => 0.9);
  assert.equal(restored.s.projectiles.length, 0, 'flight remains transient');
  g.s.zone = 'vale';
  g.zone();
  assert.equal(g.projectileFort(p), null, 'zone-bound permission');
}
// Interior fortification partitions are bypassed, never gaps between rooms or
// map limits; non-fort interiors retain all ordinary collision.
for (const id of ['abyss', 'citadel']) {
  const g = world(id);
  const a = C.rules.dungeonArchitecture[id];
  const w = a.partitions[0];
  const area = g.fortAreas()[0];
  let found = false;
  for (let x = w.x1 + 1; x < w.x2; x += 8)
    for (let y = w.y1 + 1; y < w.y2; y += 8) {
      const p = { x, y };
      if (g.blocked(x, y, id, 0) && !g.fortShotBlocked(p, area)) found = true;
    }
  assert(found, id + ' own partitions');
  assert(g.fortShotBlocked({ x: 20, y: 20 }, area), 'boundary remains solid');
}
console.log(
  'PASS global 160-unit outdoor fort coverage, AI range/wall aim, real impact/dodge, 40% damage, exit/piercing, obstacles and lifecycle',
);
// Low obstacles are enemy-only cover allowances in the field and interiors.
for (const id of ['vale', 'crypt', 'archive', 'mine', 'supply-vale', 'side-highlands-signal']) {
  const g = world(id);
  const start = id === 'vale' ? { x: 400, y: 1600 } : g.safe(220, 250);
  const e = hostile(g, start.x, start.y);
  Object.assign(g.hero, { x: start.x + 180, y: start.y });
  g.zone().props = g
    .zone()
    .props.filter((p) => p.decorative || Math.hypot(p.x - start.x, p.y - start.y) > 300);
  if (!g.clearSegment(e, g.hero, 0, true)) continue;
  g.zone().props.push({ id: 'low-cart', structure: 'cart', x: start.x + 90, y: start.y, r: 25 });
  assert(!g.line(e, g.hero));
  assert(g.enemyRangedLine(e, g.hero), id + ' can fire over cart');
  assert(!g.clearSegment(e, g.hero), 'movement unchanged');
  assert(!g.line(g.hero, e), 'friendly sight unchanged');
  const p = {
    source: 'enemy',
    sourceId: e.id,
    x: e.x,
    y: e.y,
    dx: 1,
    dy: 0,
    speed: 260,
    life: 2,
    damage: 30,
    style: 'arrow',
  };
  g.prepareFortProjectile(p, e, g.hero);
  assert(p.rangedArc);
  assert(g.fortProjectileLift(p) > 0);
  g.s.projectiles = [p];
  const hp = g.hero.hp;
  for (let j = 0; j < 50 && g.s.projectiles.length; j++) g.updateProjectiles(0.02);
  assert(g.hero.hp < hp, id + ' real shot over low cover');
}
for (const id of ['crypt', 'archive', 'supply-crown']) {
  const g = world(id),
    a = C.rules.dungeonArchitecture[id] || C.rules.treasuryArchitecture[id],
    cover = g.enemyShotCover();
  for (const w of a.partitions)
    assert.equal(
      cover.partitions.has(w.id),
      C.rules.balance.fortifications.lowPartitionIds.includes(w.id),
      'only authored low screens/shelves pass',
    );
}
console.log(
  'PASS enemy-only low props/screens in fields, dungeons and other interiors; friendly sight and movement preserved',
);
// A dodged arc lands once at its original aim point, even on a long final tick.
for (const dt of [0.02, 2]) {
  const { g, e } = fixture();
  const target = { x: 3340, y: 950 },
    d = Math.hypot(target.x - e.x, target.y - e.y);
  const p = {
    source: 'enemy',
    sourceId: e.id,
    x: e.x,
    y: e.y,
    dx: (target.x - e.x) / d,
    dy: (target.y - e.y) / d,
    speed: 280,
    life: 2.8,
    damage: 30,
    style: 'arrow',
  };
  g.prepareFortProjectile(p, e, target);
  assert.equal(p.fortDistance, d);
  assert(Math.abs(p.life - d / p.speed) < 1e-8, 'arc life ends at fixed target');
  g.hero.y += 100;
  const hp = g.hero.hp,
    impacts = [];
  g.enemyVfxProjectileImpact = (shot, point) => impacts.push(point);
  g.s.projectiles = [p];
  for (let i = 0; i < 200 && g.s.projectiles.length; i++) g.updateProjectiles(dt);
  assert.equal(g.hero.hp, hp, 'dodged shot does not home');
  assert.equal(g.s.projectiles.length, 0);
  assert(Math.hypot(p.x - target.x, p.y - target.y) < 1e-6, 'no ground overshoot');
  assert(g.fortProjectileLift(p) < 1e-6, 'flight reaches ground at removal');
  assert.equal(impacts.length, 1, 'one terminal ground impact');
  assert(impacts[0].terrain);
  const landed = { x: p.x, y: p.y };
  g.updateProjectiles(1);
  assert.deepEqual({ x: p.x, y: p.y }, landed, 'cannot bounce or continue');
  assert.equal(impacts.length, 1);
}
console.log(
  'PASS fixed landing point, dodge, short/long ticks, one ground impact and no continued arc flight',
);

// Real Goblin Slinger release exercises both the stone-only speed correction
// and native fort preparation, not a manually fabricated projectile.
{
  const { g, e } = fixture();
  Object.assign(e, {
    species: 'goblin', ranged: true, hybrid: false,
    shotSpeed: C.rules.rangedProfiles.goblin.shotSpeed,
    projectileStyle: 'stone',
  });
  g.updateEnemies(0.01);
  assert(e.rangedAim, 'fortified Goblin prepares an authentic ranged basic');
  e.rangedAim.timer = 0;
  g.updateEnemies(0.01);
  const p = g.s.projectiles.find((shot) => shot.sourceId === e.id);
  assert(p, 'fortified Goblin released a real stone');
  const baseline = C.rules.rangedProfiles.goblin.shotSpeed *
    C.rules.rangedEnemyCombat.projectileMultiplier;
  const stonePace = C.rules.balance.goblinSlingerProjectileSpeedMultiplier;
  const fortPace = C.rules.balance.fortifications.projectileSpeedMultiplier;
  assert.equal(p.fortBaseSpeed, baseline * stonePace,
    'hostile Goblin native stone launch speed includes the new boost');
  assert.equal(p.speed, baseline * stonePace * fortPace,
    'fort adds its separate 30% bonus exactly once');
  assert(Math.abs(p.fortBaseSpeed * p.fortBaseLife -
    C.rules.rangedProfiles.goblin.shotSpeed * 2.5) < 1e-8,
    'Slinger native missed-shot travel budget is preserved');
  assert(Math.abs(p.life * p.speed - p.fortDistance) < 1e-8,
    'fixed fortified arc still lands at its original aim point');
}

// Fort launch speed improves accuracy without extending special-shot footprints.
{
  const { g, e } = fixture();
  const p = {
    source: 'enemy',
    sourceId: e.id,
    x: e.x,
    y: e.y,
    dx: 1,
    dy: 0,
    speed: 280,
    life: 2.8,
    damage: 30,
    style: 'arrow',
  };
  g.prepareFortProjectile(p, e, g.hero);
  assert.equal(p.speed, 364);
  const time = p.life;
  assert(Math.abs(time - 340 / 280 / 1.3) < 1e-8, '30% faster fixed flight');
  g.prepareFortProjectile(p, e, g.hero);
  assert.equal(p.speed, 364);
  assert.equal(p.life, time, 'no stacked boost');
  const special = {
    source: 'enemy',
    sourceId: e.id,
    x: e.x,
    y: e.y,
    dx: 1,
    dy: 0,
    speed: 280,
    life: 2.8,
    damage: 30,
  };
  g.prepareFortProjectile(special, e);
  assert(Math.abs(special.fortDistance - 784) < 1e-8);
  assert(Math.abs(special.life * special.speed - 784) < 1e-8, 'same special footprint');
  const ordinary = { ...special, speed: 280, life: 2.8 };
  delete ordinary.fortBaseSpeed;
  delete ordinary.fortBaseLife;
  e.x = 3400;
  g.prepareFortProjectile(ordinary, e);
  assert.equal(ordinary.speed, 280, 'outside-fort speed unchanged');
}
console.log(
  'PASS fort-only 30% projectile speed, fixed footprint/lifetime and idempotent launch preparation',
);
