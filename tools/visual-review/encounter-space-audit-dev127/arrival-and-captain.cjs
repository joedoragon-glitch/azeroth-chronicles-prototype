'use strict';
const C = require('../../../src/prototype/engine'),
  fs = require('node:fs'),
  path = require('node:path'),
  dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const result = { arrivals: [], crag: null };
for (const id of [
  ...C.dungeonIds,
  ...C.rules.supplyRooms.map((r) => r.id),
  ...C.rules.sideDungeons.map((r) => r.id),
]) {
  const g = new C('normal', 'mage', () => 0.73);
  g.s.expeditionRank = 6;
  g.s.party = Array.from({ length: 6 }, () => g.unit('soldier', g.hero.x, g.hero.y));
  g.enter(id);
  const units = [g.hero, ...g.activeLivingParty()];
  result.arrivals.push({
    zone: id,
    visibleAcquisition: g
      .zone()
      .enemies.filter(
        (e) =>
          e.hp > 0 &&
          !e.neutral &&
          dist(e, g.hero) < g.enemyAcquisitionRange(e) &&
          g.enemyRangedLine(e, g.hero),
      )
      .map((e) => ({
        id: e.id,
        name: e.name,
        distance: dist(e, g.hero),
        range: g.enemyAcquisitionRange(e),
      })),
    bodyOverlaps: units.flatMap((a, i) =>
      units
        .slice(i + 1)
        .filter((b) => dist(a, b) < g.actorRadius(a) + g.actorRadius(b))
        .map((b) => [a.id || 'hero', b.id]),
    ),
  });
}
const g = new C('normal', 'mage', () => 0.73);
g.enter('supply-highlands');
g.s.mercyTime = 0;
g.s.party = [];
const e = g.zone().enemies.find((e) => e.roomCaptain);
g.hero.hp = g.hero.maxHp = 1e8;
g.hero.immune = 1e8;
for (let j = 0; j < 24; j++) {
  const a = (j * Math.PI) / 12,
    p = { x: e.x + Math.cos(a) * 160, y: e.y + Math.sin(a) * 160 };
  if (!g.blocked(p.x, p.y, g.zoneId, g.actorRadius(g.hero)) && g.line(e, p)) {
    Object.assign(g.hero, p);
    break;
  }
}
g.engage(e, true, false);
const started = g.startCaptainAttack(e, g.hero),
  cast = e.telegraph;
g.damage(e, 1, 'hero');
result.crag = {
  spawn: { x: e.x, y: e.y },
  bodyBlocked: g.blocked(e.x, e.y, g.zoneId, g.actorRadius(e)),
  started,
  ordinaryDamagePreservesCast: e.telegraph === cast,
  nearbySolid: g
    .zone()
    .props.filter((p) => !p.decorative && p.r > 0 && dist(p, e) < 100)
    .map((p) => ({ id: p.id, x: p.x, y: p.y, r: p.r })),
  proposedPoints: [
    { x: 700, y: 450 },
    { x: 670, y: 430 },
  ].map((p) => ({
    ...p,
    blocked: g.blocked(p.x, p.y, g.zoneId, g.actorRadius(e)),
    open140UsingBossRadius: g.fieldBossOpenDirections(p),
  })),
};
let impacts = 0,
  resolve = g.resolveAttack;
g.resolveAttack = function (u, ...args) {
  if (u === e) impacts++;
  return resolve.call(this, u, ...args);
};
for (let i = 0; i < 60; i++) {
  g.s.time += 0.1;
  g.updateEnemies(0.1);
  g.updateProjectiles(0.1);
}
Object.assign(result.crag, {
  simulatedSeconds: 6,
  impacts,
  final: { x: e.x, y: e.y },
  finalBlocked: g.blocked(e.x, e.y, g.zoneId, g.actorRadius(e)),
});
fs.writeFileSync(
  path.join(__dirname, 'arrival-and-captain.json'),
  JSON.stringify(result, null, 2) + '\n',
);
console.log('PASS captured actual entry acquisition/staging and Crag cast/escape evidence');
