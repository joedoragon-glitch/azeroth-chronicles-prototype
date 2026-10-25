'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');
const near = (a, b) => assert(Math.abs(a - b) < 1e-7, `${a} vs ${b}`);
function arena(cls = 'mage', rank = 1, training = 0, count = 1) {
  const g = new C('normal', cls, () => 0.9);
  completeFieldOpening(g);
  g.zone().props = [];
  g.zone().buildings = [];
  g.zone().npcs = [];
  Object.assign(g.hero, { x: 500, y: 500, order: null, hp: 1000, maxHp: 1000 });
  g.hero.skills.fill(rank);
  g.hero.talents[1] = training;
  g.s.party = [g.unit('soldier', 520, 500)];
  g.s.mercyTime = 0;
  const enemies = Array.from({ length: count }, (_, i) =>
    g.makeEnemy(
      { species: 'goblin', name: 'Integration', level: 1, hp: 100000, damage: 0, gold: 0, xp: 0 },
      { x: 580 + i * 8, y: 500 },
    ),
  );
  g.zone().enemies = enemies;
  for (const e of enemies) assert(g.damage(e, 1, 'hero'));
  return { g, e: enemies[0], enemies };
}
let cases = 0;
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const rank of [1, 4, 8])
    for (const training of [0, 5])
      for (let slot = 1; slot <= 8; slot++) {
        const { g, e } = arena(cls, rank, training),
          h = g.hero;
        h.hp = 1;
        if (cls === 'mage' && slot === 3)
          e.rangedAim = { timer: 1, remaining: 1, max: 1, targetId: 'hero' };
        const companions = JSON.stringify(
          g.s.party.map((u) => [u.cd, u.skill1Cd, u.skill2Cd, u.skillGlobalCd]),
        );
        assert(g.cast(slot, e.id, true), `${cls} ${rank} ${training} charged ${slot}`);
        near(h.cd[slot - 1], g.skillCooldown(slot, false));
        near(h.chargedCd[slot - 1], g.skillCooldown(slot, true));
        assert(!g.cast(slot, e.id, true));
        const lock = h.chargedCd[slot - 1];
        h.cd[slot - 1] = 0;
        h.hp = 1;
        if (cls === 'mage' && slot === 3) {
          assert(!g.cast(slot, e.id, false), 'native Silence still blocks the caster');
          delete h.silenceField;
          e.rangedAim = { timer: 1, remaining: 1, max: 1, targetId: 'hero' };
        }
        assert(g.cast(slot, e.id, false), `${cls} normal ${slot} during charged lock`);
        near(h.chargedCd[slot - 1], lock);
        assert.equal(
          JSON.stringify(g.s.party.map((u) => [u.cd, u.skill1Cd, u.skill2Cd, u.skillGlobalCd])),
          companions,
          'hero casts cannot spend companion cooldowns',
        );
        cases++;
      }
for (const cls of ['paladin', 'mage', 'ranger']) {
  const { g, e } = arena(cls),
    h = g.hero;
  h.cd.fill(3);
  h.chargedCd.fill(7);
  h.basicCd = 0.4;
  const duration = 2 + C.rules.cooldownBalance.slowDurationBonusSeconds,
    debt = duration * C.rules.cooldownBalance.slowDebtFraction;
  assert(g.applySlow(h, 2));
  assert(g.applySlow(h, 2));
  near(h.cd[0], 3 + 2 * debt);
  near(h.chargedCd[0], 7 + 2 * debt);
  near(h.basicCd, 0.4 + 2 * debt);
  g.updateEnemies = g.updateParty = () => {};
  const before = [h.cd[0], h.chargedCd[0], h.basicCd];
  g.tick(0.1);
  for (const [i, value] of [h.cd[0], h.chargedCd[0], h.basicCd].entries())
    near(value, before[i] - (0.1 * 0.65) / 1.35);
  const u = g.s.party[0];
  Object.assign(u, { cd: 1, skill1Cd: 2, skill2Cd: 3, skillGlobalCd: 0.4 });
  const restored = C.restore(g.snapshot());
  for (const key of ['cd', 'chargedCd', 'basicCd']) assert.deepEqual(restored.hero[key], h[key]);
  for (const key of ['cd', 'skill1Cd', 'skill2Cd', 'skillGlobalCd'])
    near(restored.s.party[0][key], u[key]);
  h.cd.fill(0);
  h.chargedCd.fill(0);
  h.basicCd = 0;
  g.applySlow(h, 2);
  assert(h.cd.every((v) => v === 0));
  assert(h.chargedCd.every((v) => v === 0));
  near(h.basicCd, 0);
}
{
  const { g, enemies } = arena('mage', 8, 0, 12);
  assert(g.cast(1, enemies[0].id, true));
  const hits = g.effects.filter((x) => x.type === 'heroSkillArea' && x.class === 'mage').at(-1);
  assert.equal(hits.hits, 12, 'wide beam has no arbitrary target cap');
}
{
  const { g, enemies } = arena('paladin', 8, 0, 12);
  assert(g.cast(1, enemies[0].id, true));
  near(g.effects.filter((x) => x.type === 'heroSkillArea').at(-1).hits, 8);
  g.s.time += 0.36;
  g.advanceHeroSkillEffects(0.36);
  near(g.effects.filter((x) => x.type === 'heroSkillArea').at(-1).hits, 8);
}
for (const cls of ['paladin', 'mage', 'ranger']) {
  const { g, e } = arena(cls);
  assert(g.cast(1, e.id, true));
  g.enter('march');
  const before = e.hp;
  g.advanceHeroSkillEffects(1);
  near(e.hp, before);
  assert.equal(g._heroSkillEffects?.length || 0, 0, 'zone transfer cancels delayed effects');
}
// Every pet retains its own ordinary/first/second clocks and Skill 2 gate.
for (const { id: family } of C.data.bosses) {
  const { g, e } = arena('mage');
  g.s.normal[family] = g.s.true[family] = true;
  g.s.expeditionRank = 6;
  const u = g.unit('pet', 540, 500, family);
  g.s.party = [u];
  g.hero.cd.fill(3);
  g.hero.chargedCd.fill(8);
  g.hero.basicCd = 0.5;
  const first = JSON.stringify(g.petSkillDefinition(u, 1));
  g.hero.skills[0] = 8;
  assert.equal(
    JSON.stringify(g.petSkillDefinition(u, 1)),
    first,
    'hero Skill 1 rank does not retrain ' + family,
  );
  g.s.companionCombatTraining = 0;
  g.hero.skills[1] = 0;
  assert(!g.companionSecondSkillUnlocked());
  assert(g.usePetSkill(u, e, 1), family + ' first works during hero recovery');
  near(u.skill1Cd, 8);
  g.hero.skills[1] = 1;
  g.s.companionCombatTraining = 2;
  u.skillGlobalCd = 0;
  assert(g.companionUseSecondSkill(u, e), family + ' independently starts second');
  g.advancePartyChargeClock(0.65);
  g.resolveCompanionCharges();
  near(u.skill2Cd, 12);
  near(g.hero.cd[0], 3);
  near(g.hero.chargedCd[0], 8);
  near(g.hero.basicCd, 0.5);
}
for (const cls of ['paladin', 'mage', 'ranger']) {
  const { g, e } = arena(cls);
  assert(g.castMovementBasic());
  const step = g.basicComboStep;
  assert(g.cast(1, e.id, false));
  assert.equal(g.basicComboStep, step, 'Tap preserves automatic combo');
  g.hero.cd[0] = 0;
  assert(g.cast(1, e.id, true));
  assert.equal(g.basicComboStep, step, 'Charged preserves automatic combo');
  g.hero.basicCd = 0;
  assert(g.castMovementBasic());
  assert.equal(g.basicComboStep, step + 1);
}
// Oblique contact against a large boss must not hover at a floating-point
// residue until expiry. The tolerance is far below one world pixel.
for (const dt of [1 / 60, 1 / 30, 0.1]) {
  const { g } = arena('ranger');
  const boss = g.bossEnemy(g.boss('thorn'), 'normal', { x: 584, y: 502 });
  g.zone().enemies = [boss];
  assert(g.damage(boss, 1, 'hero'));
  const before = boss.hp;
  assert(g.cast(1, boss.id, true));
  for (let t = 0; t < 1.4 && g._heroSkillEffects.length; t += dt) {
    g.s.time += dt;
    g.advanceHeroSkillEffects(dt);
  }
  assert(boss.hp < before, 'oblique hawk contact lands at ' + dt);
  assert(g.effects.some((e) => e.type === 'heroHawk' && e.phase === 'impact'));
}
console.log(
  `PASS ${cases} class/rank/training/slot dual-clock cases, Slow debt/recovery, v4 companion timers, crowd caps and effect lifecycle`,
);
