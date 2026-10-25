'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');
function scene(type, family, distance) {
  const g = new C('normal', 'paladin', () => 0.9);
  // Today's tutorial requires a hero-led first engagement. A trained roster
  // test must complete that gate before observing autonomous companion casts.
  completeFieldOpening(g);
  const z = g.zone();
  z.props = [];
  z.npcs = [];
  z.nodes = [];
  z.buildings = [];
  z.enemies = [];
  g.s.mercyTime = 0;
  g.s.expeditionRank = 6;
  g.s.companionCombatTraining = 2;
  Object.assign(g.hero, g.safe(1500, 1500), { order: null });
  if (family) g.s.normal[family] = g.s.true[family] = true;
  if (family === 'darklord') g.s.phase = 'awakening';
  const u = g.unit(type, g.hero.x, g.hero.y, family);
  g.s.party = [u];
  let origin;
  for (const x of [400, 900, 1600, 2200]) {
    for (const y of [400, 900, 1600, 2200]) {
      if (g.blocked(x, y)) continue;
      Object.assign(g.hero, { x, y });
      const anchor = g.partyFollowPoint(u);
      if (
        [0, 80, 150, 230, 305, 410].every(
          (dx) =>
            !g.blocked(anchor.x + dx, anchor.y) &&
            g.line(anchor, { x: anchor.x + dx, y: anchor.y }),
        )
      ) {
        origin = anchor;
        break;
      }
    }
    if (origin) break;
  }
  assert(origin, 'fixture needs an actual unobstructed firing lane');
  Object.assign(u, origin);
  const ranged = type === 'archer' || (type === 'pet' && g.petDefinition(u).role === 'ranged');
  const e = g.makeEnemy(
    {
      species: 'goblin',
      name: 'Stationary pet aim',
      level: 1,
      hp: 100000,
      damage: 0,
      xp: 0,
      gold: 0,
    },
    { x: u.x + (distance ?? (ranged ? 230 : 55)), y: u.y },
  );
  z.enemies.push(e);
  return { g, u, e };
}
function automate(g) {
  g.updateEnemies = () => {};
  g.updateNight = g.updatePacks = g.updateGuardianReinforcements = g.updateElites = () => {};
  const e = g.zone().enemies[0];
  g.engage(e);
  for (let n = 0; n < 100; n++) g.tick(0.05);
  return e;
}

const roster = [['soldier', null], ['archer', null], ...C.data.bosses.map(({ id }) => ['pet', id])];
for (const [type, family] of roster) {
  for (const training of [undefined, 1, 2]) {
    const { g, u } = scene(type, family);
    g.hero.skills[1] = 1;
    const data = g.snapshot();
    if (training === undefined) delete data.companionCombatTraining;
    else data.companionCombatTraining = training;
    const saved = data.party[0];
    saved.customName = 'Veteran friend';
    saved.hp = Math.floor(saved.maxHp * 0.7);
    for (const field of ['skill1Cd', 'skill2Cd', 'skillGlobalCd']) delete saved[field];
    const c = C.restore(data, () => 0.9),
      friend = c.s.party[0];
    assert.equal(friend.id, u.id, 'existing identity survives');
    assert.equal(friend.customName, 'Veteran friend');
    assert.equal(friend.hp, saved.hp, 'migration grants no free healing');
    assert.equal(c.s.companionCombatTraining, 2, 'learned hero Skill 2 repairs old flag');
    assert(c.companionSecondSkillUnlocked());
    const e = automate(c);
    assert(
      friend.skill1Cd > 0,
      `${type}/${family}/${training} first used automatically after restore`,
    );
    assert(
      friend.skill2Cd > 0,
      `${type}/${family}/${training} second used automatically after restore`,
    );
    assert(e.hp < e.maxHp, 'real automatic attacks reach the enemy');
  }
}
for (const learned of [false, true]) {
  const { g } = scene('pet', 'crypt');
  g.hero.skills[1] = learned ? 1 : 0;
  g.s.companionCombatTraining = 1;
  assert.equal(g.companionSecondSkillUnlocked(), learned, 'live session uses actual learning');
  const c = C.restore(g.snapshot(), () => 0.9);
  const e = automate(c),
    u = c.s.party[0];
  assert(u.skill1Cd > 0 && e.hp < e.maxHp, 'first does not require training');
  assert.equal(u.skill2Cd > 0, learned, 'untrained second stays locked');
}
{
  const { g } = scene('soldier');
  g.s.companionCombatTraining = 2;
  g.hero.skills[1] = 0;
  g.s.party[0].skill1Cd = 4;
  g.s.party[0].skill2Cd = 7;
  const c = C.restore(g.snapshot());
  assert(c.companionSecondSkillUnlocked(), 'previously earned training is not revoked');
  assert.equal(c.s.party[0].skill1Cd, 4);
  assert.equal(c.s.party[0].skill2Cd, 7, 'saved cooldowns are not reset');
}
{
  const { g } = scene('soldier');
  g.hero.skills[1] = 1;
  const data = g.snapshot();
  data.companionCombatTraining = 99;
  assert.throws(
    () => C.restore(data),
    /Invalid companion combat training/,
    'repair cannot hide invalid data',
  );
}
console.log(
  'PASS restored existing soldier, archer and all 11 pets automatically use current skills; legacy unlock repair, untrained gates, identities, wounds and cooldowns preserved',
);
