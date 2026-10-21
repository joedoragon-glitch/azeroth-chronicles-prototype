'use strict';
const assert = require('node:assert/strict');
const C = require('../../src/prototype/engine');
const FX = require('../../src/prototype/combat-visuals');
const fixture = require('../../tests/helpers/specialist-night-context.cjs');
function inside(p, poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++)
    if (
      poly[i].y > p.y !== poly[j].y > p.y &&
      p.x < ((poly[j].x - poly[i].x) * (p.y - poly[i].y)) / (poly[j].y - poly[i].y) + poly[i].x
    )
      hit = !hit;
  return hit;
}
const cleanup = [];
for (const context of fixture.contexts) {
  const g = fixture.campaign(context, 'mage');
  g.enter('frontier');
  g.s.party = [];
  g.s.mercyTime = 0;
  const z = g.zone(),
    site = g.treasuryRecoverySite('frontier'),
    cap = g.treasuryCaptain(z, site);
  Object.assign(g.hero, g.safe(cap.x + 40, cap.y), { hp: 1e6, maxHp: 1e6, immune: 1e6 });
  const boss = z.enemies.find((e) => e.type === 'boss');
  const others = z.enemies.filter((e) => e !== cap && e.hp > 0 && !e.neutral);
  assert(others.includes(boss), 'real regional boss is among the unrelated survivors');
  assert(g.damage(cap, 1e8, 'hero', { piercing: true }));
  assert.equal(
    others.filter((e) => e.hp > 0).length,
    others.length,
    'defeat itself does not clear outdoor population',
  );
  const killedSave = g.snapshot();
  const wallet = g.hero.gold,
    xp = g.hero.xp;
  // Use the actual enemy-update owner without the unrelated loot-pickup phase.
  g.s.time += 0.05;
  g.updateEnemies(0.05);
  const cleared = others.filter((e) => e.hp <= 0);
  assert.equal(cleared.length, others.length, 'F1 reproduces region-wide cleanup');
  assert.equal(g.hero.gold, wallet, 'unrelated deaths award no crowns');
  assert.equal(g.hero.xp, xp, 'unrelated deaths award no XP');
  assert(!g.s.normal[boss.family], 'regional boss is removed without victory credit');
  assert(!g.s.pending[boss.family], 'cleanup does not schedule that boss to return');
  const loaded = C.restore(killedSave, () => 0.9);
  assert(loaded);
  const survivorsAfterRestore = loaded.zone().enemies.filter((e) => e.hp > 0 && !e.neutral).length;
  assert.equal(survivorsAfterRestore, 0, 'restore also invokes the incorrect cleanup');
  cleanup.push({
    context,
    captainId: cap.id,
    unrelatedAliveAfterKill: others.length,
    unrelatedAliveAfterTick: others.length - cleared.length,
    regionalBossId: boss.id,
    regionalBossHpAfterTick: boss.hp,
    regionalBossVictoryCredited: !!g.s.normal[boss.family],
    regionalBossReturnScheduled: !!g.s.pending[boss.family],
    survivorsAfterRestore,
    walletChangeOnCleanup: g.hero.gold - wallet,
    xpChangeOnCleanup: g.hero.xp - xp,
  });
}
const enclosed = new C('normal', 'mage', () => 0.9);
enclosed.enter('supply-vale');
const treasury = enclosed.zone(),
  captain = treasury.enemies.find((e) => e.roomCaptain);
Object.assign(enclosed.hero, enclosed.safe(captain.x + 40, captain.y));
enclosed.s.mercyTime = 0;
assert(enclosed.damage(captain, 1e8, 'hero', { piercing: true }));
assert(
  treasury.enemies.every((e) => e.hp <= 0 || e.neutral),
  'enclosed Treasury cleanup is intentional',
);

const canister = [];
for (const context of fixture.contexts)
  for (const form of ['normal', 'true'])
    for (const degrees of [180, 225, 270]) {
      const g = fixture.campaign(context, 'mage');
      g.enter('citadel');
      g.s.party = [];
      g.s.mercyTime = 0;
      const z = g.zone();
      let e = z.enemies.find((u) => u.type === 'boss' && u.family === 'citadel');
      if (form === 'true') {
        const previous = e;
        e = g.bossEnemy(g.boss('citadel'), 'true', previous.home);
        z.enemies[z.enemies.indexOf(previous)] = e;
      }
      const angle = (degrees * Math.PI) / 180;
      Object.assign(g.hero, g.safe(e.x + Math.cos(angle) * 200, e.y + Math.sin(angle) * 200), {
        hp: 1e6,
        maxHp: 1e6,
        immune: 0,
      });
      g.engage(e, true, false);
      assert(
        g.bossAttackWeights(e, g.hero)[0] > 0,
        'native canister is eligible at the preparation target',
      );
      const a = g.buildBossAttack(e, 0, g.hero, false).first;
      const p = {
        x: e.x + Math.cos(a.angle) * (a.radius + 30),
        y: e.y + Math.sin(a.angle) * (a.radius + 30),
      };
      assert(!g.blocked(p.x, p.y, g.zoneId, 15));
      assert(g.fortShotClear(e, p, g.enemyShotCover(g.enemyFort(e))));
      const warned = FX.warningShapes(a, g.attackPatches(a)).some((poly) => inside(p, poly));
      assert.equal(warned, false, 'sample lies outside every actual rendered warning polygon');
      Object.assign(g.hero, p);
      e.telegraph = a;
      g.resolveAttack(e);
      assert.equal(g.s.projectiles.length, 9);
      const shot = g.s.projectiles[4],
        originalSpan = shot.speed * shot.life,
        hp = g.hero.hp;
      for (let i = 0; i < 100 && g.s.projectiles.length; i++) g.updateProjectiles(0.02);
      assert(g.hero.hp < hp, 'F2 reproduces native untelegraphed fragment damage');
      assert(shot.fortDistance > originalSpan, 'fort minimum flight extends the special footprint');
      canister.push({
        context,
        form,
        degrees,
        sourceId: e.id,
        origin: { x: e.x, y: e.y },
        point: p,
        warningRadius: a.radius,
        warned,
        originalSpan,
        fortifiedSpan: shot.fortDistance,
        speed: shot.speed,
        hpLost: hp - g.hero.hp,
      });
    }
const c = new C('normal', 'mage', () => 0.9);
c.enter('highlands');
const z = c.zone(),
  closeRoads = [];
for (const wall of z.props.filter((p) => p.stronghold === 'wolf-packhold' && p.r > 0))
  for (const [road, points] of z.roads.entries())
    for (let i = 1; i < points.length; i++) {
      const distance = c.distanceToSegment(wall, points[i - 1], points[i]);
      if (distance < 85) {
        const clear = c.clearSegment(points[i - 1], points[i], 15);
        assert(
          clear,
          '85-unit exclusion failure is not a blocked centerline in these native cases',
        );
        closeRoads.push({
          wall: wall.id,
          road,
          segment: i,
          distance,
          radius: wall.r,
          clearForRadius15: clear,
        });
      }
    }
assert(closeRoads.length > 0, 'retain the original spacing-contract reproduction');
console.log(
  JSON.stringify(
    {
      kind: 'audit reproductions, not a green gameplay gate',
      cleanup,
      enclosedTreasuryCleanup: 'intentionally retained',
      canister,
      closeRoads,
    },
    null,
    2,
  ),
);
