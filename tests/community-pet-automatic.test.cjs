'use strict';
// Authored only. Do not execute until the owner authorizes consolidated validation.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
function scene(family, distance) {
  const g = new C('normal', 'paladin', () => 0.9);
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
  g.s.normal[family] = g.s.true[family] = true;
  const u = g.unit('pet', g.hero.x, g.hero.y, family);
  g.s.party = [u];
  Object.assign(u, g.partyFollowPoint(u));
  const ranged = g.petDefinition(u).role === 'ranged';
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
  g.engage(e);
  // Isolate the ally decision path while preserving real tick, navigation, projectiles,
  // cooldowns and charge resolution. Enemy motion/attacks are covered by the balance matrix.
  g.updateEnemies = () => {};
  g.updateNight = g.updatePacks = g.updateGuardianReinforcements = g.updateElites = () => {};
  const events = [],
    original = g.event;
  g.event = function (type, detail) {
    events.push({ type, ...detail });
    return original.call(this, type, detail);
  };
  return { g, u, e, events };
}
function ticks(g, seconds) {
  for (let n = 0; n < Math.ceil(seconds / 0.05); n++) g.tick(0.05);
}
for (const { id: family } of C.data.bosses) {
  const { g, u, e, events } = scene(family);
  const initial = e.hp;
  ticks(g, 5);
  const moves = events.filter((e) => e.type === 'petSkill' && e.source === u.id);
  assert(
    moves.some((e) => e.slot === 1),
    family + ' automatically uses first',
  );
  assert(
    moves.some((e) => e.slot === 2),
    family + ' automatically holds and releases second',
  );
  assert(e.hp < initial, family + ' real tick deals damage');
  // No direct skill calls: force ordinary cooldown selection through the normal update.
  u.skill1Cd = u.skill2Cd = 30;
  u.skillGlobalCd = 0;
  u.cd = 0;
  const before = e.hp;
  ticks(g, 1.5);
  assert(e.hp < before, family + ' basic reaches real contact/projectile damage');
  assert(
    events.some(
      (e) =>
        e.source === u.id &&
        (g.petDefinition(u).role === 'ranged'
          ? e.type === 'projectileLaunch'
          : e.skill === 'basic'),
    ),
  );
}
for (const family of ['crypt', 'archive', 'abyss', 'citadel']) {
  for (const distance of [0, 149, 150, 259, 260, 261, 270, 279, 280, 281, 305]) {
    const { g, u, e, events } = scene(family, distance),
      hero = { x: g.hero.x, y: g.hero.y };
    ticks(g, 6);
    assert(
      events.some((e) => e.type === 'petSkill' && e.slot === 2),
      family + ' closes shorter reach at ' + distance,
    );
    assert.deepEqual(
      { x: g.hero.x, y: g.hero.y },
      hero,
      'stationary hero cannot rescue positioning',
    );
    const reach = Math.min(
      C.rules.balance.companions.petBasicRange,
      g.petDefinition(u).first.range,
      g.petDefinition(u).second.range,
    );
    const destination = g.petCombatPoint(u, e, g.activeLivingParty(), reach);
    assert(
      Math.hypot(destination.x - e.x, destination.y - e.y) +
        C.rules.balance.companions.petFollowStop <=
        reach + 1e-9,
      'destination includes stopping margin',
    );
  }
  const { g, u, e, events } = scene(family, 270);
  u.skill1Cd = u.skill2Cd = 30;
  ticks(g, 1.5);
  assert(
    events.some((e) => e.type === 'projectileLaunch' && e.source === u.id),
    'shorter unavailable special cannot block basic',
  );
  assert(e.hp < e.maxHp);
}
// A deliberately blocked line must not permit an attack through terrain. Restore
// the real line owner to prove the same automatic path resumes when sight returns.
{
  const { g, u, events } = scene('citadel', 270),
    line = g.line;
  g.line = () => false;
  ticks(g, 0.5);
  assert(!events.some((e) => e.type === 'petSkill' || e.type === 'projectileLaunch'));
  g.line = line;
  ticks(g, 5);
  assert(events.some((e) => e.type === 'petSkill' && e.source === u.id));
}
// The existing damage contract allows area collateral under dust cover but never
// permits that covered actor to become the direct aim. Exercise all area shapes.
for (const [family, slot] of [
  ['crypt', 2],
  ['citadel', 1],
  ['warlord', 1],
]) {
  const { g, u, e } = scene(family);
  const collateral = g.makeEnemy(
    { species: 'goblin', level: 1, hp: 10000, damage: 0, xp: 0, gold: 0 },
    { x: e.x + 5, y: e.y + 2 },
  );
  g.zone().enemies.push(collateral);
  g.engage(collateral);
  collateral.rogueDustCoverUntil = g.s.time + 10;
  const before = collateral.hp;
  assert(g.petSkillTargets(u, e, slot).includes(collateral));
  assert.equal(g.petSkillTargets(u, collateral, slot).length, 0);
  assert(g.usePetSkill(u, e, slot));
  assert(collateral.hp < before);
}
for (const { id: family } of C.data.bosses) {
  for (const transition of ['save', 'zone', 'reserve', 'silence', 'aim-death', 'range-loss']) {
    const { g, u, e, events } = scene(family);
    u.skill1Cd = 30;
    ticks(g, 0.05);
    assert(g.partyChargeState(u), family + ' automatic second begins before ' + transition);
    const count = () => events.filter((e) => e.type === 'petSkill' && e.slot === 2).length;
    const before = count();
    if (transition === 'save') {
      const restored = C.restore(g.snapshot());
      assert(!restored.partyChargeState(restored.s.party[0]));
      assert(!restored._companionCharges?.size);
      continue;
    }
    if (transition === 'zone') g.enter('march');
    if (transition === 'reserve') u.active = false;
    if (transition === 'silence')
      g.hero.silenceField = { x: u.x, y: u.y, radius: 1000, zone: g.zoneId, until: g.s.time + 10 };
    if (transition === 'aim-death') e.hp = 0;
    if (transition === 'range-loss') e.x += 1000;
    ticks(g, 0.8);
    assert.equal(count(), before, family + ' cannot leak a release after ' + transition);
    assert(!g.partyChargeState(u));
    assert.equal(u.skill2Cd, 0, 'failed release does not consume the full cooldown');
  }
}
console.log(
  'PASS authored Community automatic pet range, basic, charge transition and area contracts',
);
