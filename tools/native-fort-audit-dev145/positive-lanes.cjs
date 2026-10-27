const assert = require('node:assert/strict'),
  C = require('../../src/prototype/engine');
const rows = [];
for (const zone of [
  'frontier',
  'abyss',
  'citadel',
  'supply-vale',
  'supply-march',
  'supply-highlands',
  'supply-crown',
]) {
  const c = new C('normal', 'mage', () => 0.9);
  c.enter(zone);
  c.s.party = [];
  c.s.mercyTime = 0;
  const z = c.zone();
  let choice;
  for (const e of z.enemies.filter(
    (e) => e.hp > 0 && !e.neutral && c.enemyRanged(e) && c.enemyFort(e),
  )) {
    const fort = c.enemyFort(e),
      cover = c.enemyShotCover(fort),
      plain = c.enemyShotCover();
    for (const distance of [340, 380, 240, 180]) {
      for (let k = 0; k < 64; k++) {
        const a = (k * Math.PI) / 32,
          p = { x: e.x + Math.cos(a) * distance, y: e.y + Math.sin(a) * distance };
        if (
          !c.blocked(p.x, p.y, zone, 15) &&
          distance <= c.enemyRangedRange(e) &&
          !c.line(e, p) &&
          c.fortShotClear(e, p, cover) &&
          !c.fortShotClear(e, p, plain)
        ) {
          choice = { e, p, fort: fort.id, distance };
          break;
        }
      }
      if (choice) break;
    }
    if (choice) break;
  }
  assert(choice, 'native own-wall lane in ' + zone);
  const { e, p } = choice;
  Object.assign(c.hero, p, { hp: 1e6, maxHp: 1e6, immune: 0 });
  c.engage(e, true, false);
  e.cd = 0;
  e.specialCd = 999;
  c._tacticalRogueNext = new Map([[e.id, 1e6]]);
  c.updateEnemies(0.01);
  assert(e.rangedAim, zone + ' actual native AI aims');
  e.rangedAim.timer = 0;
  c.updateEnemies(0.01);
  const shot = c.s.projectiles.find((p) => p.sourceId === e.id);
  assert(shot, zone + ' native AI launches');
  const ownCover = c.enemyShotCover(c.enemyFort(e));
  const foreignWall = z.props.find(
    (w) =>
      w.r > 0 &&
      !w.decorative &&
      w.stronghold &&
      w.stronghold !== e.stronghold &&
      !ownCover.props.has(w.id) &&
      c.fortShotBlocked(w, ownCover),
  );
  if (zone === 'frontier') assert(foreignWall, 'other fort wall remains solid');
  assert(c.fortShotBlocked({ x: 20, y: 20 }, ownCover), 'outer boundary remains solid');
  const impacts = [];
  const emit = c.event;
  c.event = function (type, data) {
    if (type === 'projectileImpact' && data.source === e.id) impacts.push(data);
    return emit.call(this, type, data);
  };
  for (let n = 0; n < 300 && c.s.projectiles.some((p) => p.sourceId === e.id); n++)
    c.updateProjectiles(0.02);
  rows.push({
    zone,
    enemy: e.id,
    profile: e.captainProfile || null,
    species: e.species,
    fort: choice.fort,
    distance: choice.distance,
    baseRange: C.rules.balance.enemyRangedBasicRange,
    ownWallBypassed: true,
    friendlyLineBlocked: !c.line(p, e),
    foreignWall: foreignWall?.id || null,
    outerBoundaryBlocked: true,
    moveBlocked: !c.clearSegment(e, p, 15),
    heroImpacts: impacts.filter((p) => p.target === 'hero').length,
    terrainImpacts: impacts.filter((p) => p.terrain).length,
  });
  assert(
    impacts.some((p) => p.target === 'hero'),
    zone + ' actual impact through own wall',
  );
}
console.log(JSON.stringify(rows, null, 2));
