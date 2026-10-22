'use strict';
const assert = require('node:assert/strict');
const C = require('../../src/prototype/engine');
const FX = require('../../src/prototype/combat-visuals');
const fixture = require('./specialist-night-context.cjs');
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
module.exports = function canisterBoundaries() {
  let cases = 0;
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
          e = g.bossEnemy(g.boss('citadel'), form, previous.home);
          z.enemies[z.enemies.indexOf(previous)] = e;
        }
        const angle = (degrees * Math.PI) / 180;
        Object.assign(g.hero, g.safe(e.x + Math.cos(angle) * 200, e.y + Math.sin(angle) * 200), {
          hp: 1e6,
          maxHp: 1e6,
          immune: 0,
        });
        g.engage(e, true, false);
        assert(g.bossAttackWeights(e, g.hero)[0] > 0);
        const a = g.buildBossAttack(e, 0, g.hero, false).first;
        const shapes = FX.warningShapes(a, g.attackPatches(a));
        const sample = (distance, offset = 0, edge = false) => {
          const ray = a.angle + (edge ? 4 * 0.115 : 0);
          return {
            x: e.x + Math.cos(ray) * distance - Math.sin(ray) * offset,
            y: e.y + Math.sin(ray) * distance + Math.cos(ray) * offset,
          };
        };
        const targets = [
          { point: sample(a.radius + 30), hit: false, step: 0.02 },
          { point: sample(a.radius + 30), hit: false, step: 0.1 },
          { point: sample(a.radius + 30), hit: false, step: 2 },
          { point: sample(a.radius - 10), hit: true, step: 0.02 },
          ...(degrees === 180
            ? [
                { point: sample(200, 7, true), hit: false, step: 0.02 },
                { point: sample(200, 5, true), hit: true, step: 0.02 },
              ]
            : []),
        ];
        for (const { point, hit, step } of targets) {
          assert(!g.blocked(point.x, point.y, g.zoneId, 15), 'native boundary target fits');
          assert(g.fortShotClear(e, point, g.enemyShotCover(g.enemyFort(e))));
          assert.equal(
            shapes.some((poly) => inside(point, poly)),
            hit,
            'actual warning agrees with expected contact',
          );
          Object.assign(g.hero, point, { hp: 1e6, immune: 0 });
          e.telegraph = a;
          g.resolveAttack(e);
          const shots = [...g.s.projectiles];
          assert.equal(shots.length, 9);
          const span = shots[4].speed * shots[4].life;
          for (let frame = 0; frame < 100 && g.s.projectiles.length; frame++)
            g.updateProjectiles(step);
          assert.equal(
            g.hero.hp < 1e6,
            hit,
            context + '/' + form + '/' + degrees + ' actual contact',
          );
          for (const p of shots) {
            assert(
              Math.abs(p.fortDistance - span) < 1e-8,
              'fort preserves the authored special footprint',
            );
            assert.equal(p.speed, 637, '30% fort speed remains');
            assert.equal(p.hitRadius, C.rules.combatGeometry.canisterHalfWidth);
          }
          assert.equal(g.s.projectiles.length, 0);
          cases++;
        }
      }
  return cases;
};
