'use strict';
const assert = require('node:assert/strict'),
  C = require('../../src/prototype/engine'),
  FX = require('../../src/prototype/combat-visuals');
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
const g = new C('normal', 'mage', () => 0.9);
g.s.party = [];
g.s.mercyTime = 0;
const e = g.zone().enemies.find((e) => e.type === 'boss' && e.family === 'thorn');
assert(e);
g.engage(e, true, false);
let chosen;
for (let k = 0; k < 64; k++) {
  const angle = (k * Math.PI) / 32;
  const fringe = { x: e.x + Math.cos(angle) * 210, y: e.y + Math.sin(angle) * 210 };
  if (g.blocked(fringe.x, fringe.y, g.zoneId, 15) || !g.line(e, fringe)) continue;
  const a = g.buildBossAttack(e, 0, fringe, false).first;
  const outside = {
    x: e.x + Math.cos(a.angle) * (a.radius + 10),
    y: e.y + Math.sin(a.angle) * (a.radius + 10),
  };
  if (!g.blocked(outside.x, outside.y, g.zoneId, 15) && g.line(e, outside)) {
    chosen = { a, fringe, outside };
    break;
  }
}
assert(chosen, 'two real clear positions at native Thornfang origin');
const { a, fringe, outside } = chosen;
assert(FX.warningShapes(a, g.attackPatches(a)).some((poly) => inside(fringe, poly)));
Object.assign(g.hero, fringe, { hp: 1e6, maxHp: 1e6, immune: 0 });
e.telegraph = a;
g.resolveAttack(e);
const insideDamage = 1e6 - g.hero.hp;
assert(insideDamage > 0);
Object.assign(g.hero, outside, { hp: 1e6, immune: 0 });
e.telegraph = a;
g.resolveAttack(e);
assert.equal(g.hero.hp, 1e6);
const c = new C('normal', 'mage', () => 0.9);
c.enter('crypt');
const boss = c.zone().enemies.find((e) => e.type === 'boss' && e.family === 'crypt');
assert(boss);
c.s.party = [];
c.s.mercyTime = 0;
Object.assign(c.hero, c.safe(boss.x - 150, boss.y), { hp: 1e6, maxHp: 1e6, immune: 1e6 });
c.engage(boss, true, false);
const volley = c.buildBossAttack(boss, 1, c.hero, false).first;
boss.telegraph = volley;
c.resolveAttack(boss);
const shots = [...c.s.projectiles];
assert.equal(shots.length, 3);
const launchSpeeds = shots.map((p) => p.speed);
// Later volley members must finish their real launch delays before measuring.
for (let frame = 0; frame < 120; frame++) c.updateProjectiles(0.02);
for (const [index, p] of shots.entries()) {
  assert.equal(p.fortBaseSpeed * p.fortBaseLife, 780);
  assert.equal(p.speed, launchSpeeds[index]);
  assert.equal(p.fortId, undefined);
}
console.log(
  JSON.stringify(
    {
      thornfang: {
        enemyId: e.id,
        origin: { x: e.x, y: e.y },
        warningRadius: a.radius,
        fringe,
        insideDamage,
        outside,
        outsideDamage: 0,
      },
      lifebinder: {
        enemyId: boss.id,
        shots: shots.length,
        nominalSpan: 780,
        fortGranted: false,
        scope: 'long volley launch contract; not a claim of unobstructed native end-to-end flight',
      },
    },
    null,
    2,
  ),
);
