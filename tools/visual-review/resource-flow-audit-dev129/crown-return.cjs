'use strict';
const C = require('../../../src/prototype/engine'),
  fs = require('node:fs'),
  path = require('node:path');
const g = new C('normal', 'mage', () => 0.73);
g.enter('crown');
g.s.expeditionRank = 2;
g.s.mercyTime = 0;
const z = g.zone(),
  n = g.visibleResourceNodes()[0];
z.enemies = [];
z.nodes = [n];
const u = g.unit('soldier', g.hero.x, g.hero.y);
g.s.party = [u];
g.gather(n.id);
let prev = { x: u.x, y: u.y },
  stall = 0,
  record = null,
  last = null;
const samples = [];
for (let i = 0; i < 1600; i++) {
  g.s.time += 0.05;
  g.updateParty(0.05);
  const moved = Math.hypot(u.x - prev.x, u.y - prev.y);
  stall = moved < 0.001 ? stall + 0.05 : 0;
  prev = { x: u.x, y: u.y };
  if (u.order?.journey?.returning)
    last = {
      time: g.s.time,
      pos: { x: u.x, y: u.y },
      next: u.order.journey.points[0],
      points: u.order.journey.points.length,
    };
  if (i % 200 === 0)
    samples.push({
      time: g.s.time,
      pos: { x: u.x, y: u.y },
      remaining: n.amount,
      returning: u.order?.journey?.returning,
      points: u.order?.journey?.points.length,
    });
  if (
    u.order?.journey?.returning &&
    !g.companionTravelClear(u, u.order.journey.points[0], g.gatheringThreats())
  ) {
    const p = u.order.journey.points[0];
    record = {
      time: g.s.time,
      pos: { x: u.x, y: u.y },
      node: { x: n.x, y: n.y },
      hero: { x: g.hero.x, y: g.hero.y },
      next: p,
      points: u.order.journey.points.length,
      path: u.path,
      clear: g.companionTravelClear(u, p, g.gatheringThreats()),
      fromBlocked: g.blocked(u.x, u.y),
      nextBlocked: g.blocked(p.x, p.y),
      actualRadius: g.actorRadius(u),
      nextAtBodyRadius: g.blocked(p.x, p.y, g.zoneId, g.actorRadius(u)),
      terrain15: g.clearSegment(u, p, 15),
      terrain14: g.clearSegment(u, p, 14),
      notices: g.noticeHistory.slice(-3),
    };
    break;
  }
}
const out = { record, last, samples, crowns: g.hero.gold, remaining: n.amount, order: u.order };
fs.writeFileSync(path.join(__dirname, 'crown-return.json'), JSON.stringify(out, null, 2) + '\n');
console.log(
  JSON.stringify(
    {
      ...out,
      order: out.order
        ? {
            ...out.order,
            journey: {
              returning: out.order.journey?.returning,
              points: out.order.journey?.points.slice(0, 3),
            },
          }
        : null,
    },
    null,
    2,
  ),
);
