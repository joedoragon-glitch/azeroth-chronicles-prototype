'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine'),
  Ref = require('../src/prototype/skill-reference');
const near = (a, b) => assert(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
let casts = 0;
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const rank of [1, 2, 3, 8])
    for (let slot = 1; slot <= 8; slot++)
      for (const charged of [false, true]) {
        const g = new C('normal', cls, () => 0.9);
        Object.assign(g.hero, {
          x: 500,
          y: 500,
          order: null,
          level: 12,
          weapon: 2,
          maxHp: 1000,
          hp: 1,
        });
        g.hero.skills.fill(rank);
        g.hero.talents[1] = 3;
        const zone = g.zone();
        zone.props = [];
        zone.buildings = [];
        zone.npcs = [];
        const enemy = g.makeEnemy(
          {
            species: 'goblin',
            name: 'Reference target',
            level: 1,
            hp: 100000,
            damage: 20,
            gold: 0,
            xp: 0,
          },
          { x: 570, y: 500 },
        );
        zone.enemies = [enemy];
        g.s.party = [g.unit('soldier', 520, 500)];
        if (cls === 'mage' && slot === 3 && !charged)
          enemy.rangedAim = { remaining: 0.4, max: 0.4, targetId: 'hero' };
        const before = g.snapshot(),
          info = Ref.describe(g, slot),
          preview = Ref.changes(g, slot),
          form = charged ? info.charge : info.tap;
        assert.deepEqual(g.snapshot(), before, 'references and rank previews must be read-only');
        assert(info.name && form.effect);
        const m = (key) => form.metrics.find((x) => x.key === key)?.value;
        const raw = [];
        g.damage = (e, n) => {
          raw.push(n);
          return true;
        };
        assert(g.cast(slot, enemy.id, charged), `${cls} ${slot} ${rank} ${charged}`);
        if (!(slot === 3 && cls === 'paladin' && !charged))
          near(g.hero.cd[slot - 1], info.tap.metrics.find((x) => x.key === 'cooldown').value);
        near(g.hero.chargedCd[slot - 1], charged ? m('cooldown') : 0);
        // Hawk damage occurs on actual contact, never at launch.
        if (cls === 'ranger' && slot === 1 && charged) g.advanceHeroSkillEffects(0.2);
        // Charged Mage's beam is a traveling effect; sample actual arrival.
        if (cls === 'mage' && slot === 1 && charged) {
          for (let i = 0; i < 10 && g._heroSkillEffects?.length; i++) {
            g.s.time += 0.1;
            g.advanceHeroSkillEffects(0.1);
          }
        }
        const output = raw.length ? raw : g.s.projectiles.map((p) => p.damage);
        if (m('damage') !== undefined)
          near(output[0], Array.isArray(m('damage')) ? m('damage')[0] : m('damage'));
        if (m('healing') !== undefined) near(g.hero.hp - 1, m('healing'));
        if (m('slow') !== undefined) {
          const shot = g.s.projectiles[0];
          const actual = shot?.slow
            ? shot.slow + C.rules.cooldownBalance.slowDurationBonusSeconds
            : enemy.slow;
          assert(
            Math.abs(actual - m('slow')) < 1e-7,
            `${cls} slot ${slot} rank ${rank} charged ${charged}: Slow ${actual} vs ${m('slow')}`,
          );
        }
        if (m('weaken') !== undefined) {
          near(enemy.weakenFraction * 100, m('weaken'));
          near(enemy.weakenUntil - g.s.time, m('weakenDuration'));
        }
        if (m('fracture') !== undefined) {
          const p = g.s.projectiles[0];
          near((p?.fractureFraction || enemy.fractureFraction) * 100, m('fracture'));
          near(p?.fractureDuration || enemy.fractureUntil - g.s.time, m('fractureDuration'));
        }
        if (cls === 'mage' && slot === 3 && charged) {
          near(g.hero.silenceField.radius, m('radius'));
          near(g.hero.silenceField.until - g.s.time, m('duration'));
        }
        if (cls === 'ranger' && slot === 4) {
          if (!charged) near(g.hero.haste, m('duration'));
          else {
            near(g.s.party[0].rangerRallyMovement * 100, m('movement'));
            near(g.s.party[0].rangerRallyAttack * 100, m('attackSpeed'));
            near(g.s.party[0].rangerRallyUntil - g.s.time, m('duration'));
          }
        }
        if (cls === 'paladin' && slot === 8) {
          near(g.hero.wardReduction * 100, m('ward'));
          near(g.hero.wardUntil - g.s.time, m('wardDuration'));
        }
        if (rank === 8) assert.deepEqual(preview, []);
        else {
          const next = Ref.describe(g, slot, rank + 1);
          for (const [i, name] of (slot === 1
            ? ['auto', 'tap', 'charge']
            : ['tap', 'charge']
          ).entries()) {
            const changed = next[name].metrics.filter(
              (v, j) => JSON.stringify(v.value) !== JSON.stringify(info[name].metrics[j].value),
            );
            assert.equal(preview[i].rows.length, changed.length);
            for (const row of preview[i].rows) assert(row.value.includes(' → '));
          }
        }
        casts++;
      }
const mage = new C('normal', 'mage');
mage.hero.skills[1] = 2;
assert.equal(
  Ref.describe(mage, 2).tap.metrics.find((m) => m.key === 'slow').value,
  2.3,
  'show exact current slow, not a rank range',
);
assert.equal(
  Ref.describe(mage, 3, 2).tap.metrics.some((m) => m.key === 'damage'),
  false,
  'interrupt does not gain imaginary damage',
);
assert.deepEqual(
  Ref.changes(mage, 3, 2)[0].rows,
  [],
  'odd ranks do not claim unchanged tactical gains',
);
console.log(
  'PASS ' +
    casts +
    ' native class/slot/form/rank resolver comparisons: damage, healing, Slow, Weaken, fracture, silence, rally, ward, cooldown and pure upgrade previews',
);
