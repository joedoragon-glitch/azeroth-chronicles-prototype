'use strict';
// Bounded pet audit: actual ally ticks in an unobstructed arena. This measures
// delivered damage, not encounter win rate or a promise about live difficulty.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const C = require('../../src/prototype/engine');
if (process.env.PET_AUDIT_BASELINE) {
  const cp = require('node:child_process'),
    vm = require('node:vm');
  for (const owner of ['party', 'party-pets']) {
    const source = cp.execFileSync(
      'git',
      [
        'show',
        (process.env.PET_AUDIT_BASELINE_REF || 'e0ce4a90451f88699dfbb2e93af08411cf808235') +
          ':src/prototype/' +
          owner +
          '.js',
      ],
      { cwd: __dirname, encoding: 'utf8' },
    );
    const module = { exports: {} };
    vm.runInNewContext(source, { module });
    module.exports.install(C, { D: C.data, R: C.rules });
  }
}
const families = C.data.bosses.map((b) => b.id);
const names = ['soldier', 'archer', ...families];
const round = (n) => Math.round(n * 100) / 100;
const report = {
  baseline: 'dev.112',
  stats: [],
  inheritance: [],
  formations: [],
  positioning: [],
  combat: [],
  reach: [],
  contracts: [],
};
function scene(name, heroClass = 'paladin') {
  const g = new C('normal', heroClass, () => 0.9),
    z = g.zone();
  for (const key of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) z[key] = [];
  g.s.mercyTime = 0;
  g.s.expeditionRank = 6;
  g.s.companionCombatTraining = 2;
  g.hero.level = 20;
  g.hero.maxHp = g.hero.hp = g.heroNaturalMaxHp();
  Object.assign(g.hero, { x: 850, y: 900, order: null });
  g.formationHeading = { x: 1, y: 0 };
  const pet = families.includes(name);
  if (pet) g.s.normal[name] = g.s.true[name] = true;
  if (name === 'darklord') g.s.phase = 'awakening';
  const u = g.unit(pet ? 'pet' : name, 895, 900, pet ? name : null);
  g.s.party = [u];
  const ranged = name === 'archer' || g.petDefinition(u)?.role === 'ranged';
  if (ranged) u.x = 720;
  const e = g.makeEnemy(
    { species: 'goblin', name: 'Audit aim', level: 20, hp: 1000000, damage: 0, xp: 0, gold: 0 },
    { x: 950, y: 900 },
  );
  z.enemies = [e];
  g.engage(e);
  assert(!g.blocked(u.x, u.y) && !g.blocked(e.x, e.y) && g.line(u, e));
  g.updateEnemies =
    g.updateNight =
    g.updatePacks =
    g.updateGuardianReinforcements =
    g.updateElites =
      () => {};
  const events = [],
    event = g.event;
  g.event = function (type, detail) {
    events.push({ type, ...detail });
    return event.call(this, type, detail);
  };
  return { g, u, e, events, ranged };
}
function ticks(g, seconds, before = () => {}) {
  for (let i = 0; i < Math.ceil(seconds / 0.05); i++) {
    before(i * 0.05);
    g.tick(0.05);
  }
}
for (const name of names) {
  const { g, u } = scene(name);
  for (const level of [1, 10, 20, 30]) {
    g.hero.level = level;
    g.syncCompanionLevelStats();
    const interval = u.type === 'pet' ? C.rules.balance.companions.petBasicInterval : 0.85;
    report.stats.push({
      name,
      level,
      hp: u.maxHp,
      armor: g.companionArmor(u.type),
      hit: g.companionAttackDamage(u),
      basicDps: round(g.companionAttackDamage(u) / interval),
    });
  }
}
for (const heroClass of ['paladin', 'mage', 'ranger']) {
  for (const name of names) {
    const { g, u } = scene(name, heroClass),
      baseHp = u.maxHp,
      baseHit = g.companionAttackDamage(u),
      baseArmor = g.companionArmor(u.type);
    g.hero.talents = [2, 0, 2, 2];
    g.hero.maxHp = g.heroNaturalMaxHp() + g.heroTalentHpBonus() + 50;
    g.hero.power += g.heroTalentDamageBonus() + 11;
    g.hero.weapon = g.hero.armorTier = 4;
    g.hero.reforges = { 'weapon:4': true, 'armor:4': true };
    g.s.expeditionSkills = { sharedTraining: 5, sharedStrength: 4 };
    const bonusHp = g.heroTalentHpBonus() + 50;
    const bonusHit = g.heroTalentDamageBonus() + g.heroOtherDamageBonus();
    assert.equal(g.companionInheritedHpBonus(), bonusHp);
    assert.equal(g.companionInheritedDamageBonus(), bonusHit);
    assert.equal(g.companionMoveSpeed(255), 255 + g.heroTalentSpeedBonus());
    assert.equal(g.companionArmor(u.type) - baseArmor, g.heroEquipmentArmorBonus());
    g.s.companionVitalityRank = 2;
    g.syncCompanionLevelStats();
    assert.equal(u.maxHp, Math.round((baseHp + bonusHp) * 1.2));
    assert.equal(g.companionAttackDamage(u) - baseHit, bonusHit);
    const hp = u.hp;
    g.hitParty(u, 100);
    assert(Math.abs(hp - u.hp - (100 - g.companionArmor(u.type) * 0.35)) < 1e-7);
    u.rangerRallyZone = g.zoneId;
    u.rangerRallyUntil = g.s.time + 10;
    u.rangerRallyMovement = 0.25;
    u.rangerRallyAttack = 0.2;
    assert.equal(g.companionRallyMoveSpeed(u, 255), g.companionMoveSpeed(255) * 1.25);
    assert.equal(g.companionRallyAttackSpeed(u), 1.2);
    const wounds = u.maxHp - u.hp;
    g.hero.level++;
    g.hero.maxHp += 18;
    g.syncCompanionLevelStats();
    assert(Math.abs(u.maxHp - u.hp - wounds) < 1e-7);
    u.hp = 0;
    g.hero.level++;
    g.syncCompanionLevelStats();
    assert.equal(u.hp, 0);
    report.inheritance.push({
      name,
      heroClass,
      bonusHp,
      bonusHit,
      bonusArmor: g.heroEquipmentArmorBonus(),
      bonusSpeed: g.heroTalentSpeedBonus(),
    });
    report.formations.push({ name, heroClass, offset: g.partyFormationOffset(u) });
  }
}
for (const name of names) {
  for (const mode of ['single', 'cluster', 'moving']) {
    const { g, u, e, events } = scene(name);
    if (mode === 'cluster')
      for (let i = 1; i < 6; i++) {
        const add = g.makeEnemy(
          { species: 'goblin', level: 20, hp: 1000000, damage: 0, xp: 0, gold: 0 },
          { x: 950 + i * 4, y: 900 + i * 3 },
        );
        g.zone().enemies.push(add);
        g.engage(add);
      }
    // The hero stands within committed support range of the target. No hero
    // attacks or target movement toward the ally inflate delivered damage.
    const initial = g.zone().enemies.reduce((n, e) => n + e.hp, 0);
    let moved = 0,
      last = { x: u.x, y: u.y };
    ticks(g, 30, (t) => {
      if (mode === 'moving') e.y = 900 + Math.sin(t * 2) * 120;
      moved += Math.hypot(u.x - last.x, u.y - last.y);
      last = { x: u.x, y: u.y };
    });
    const damage = initial - g.zone().enemies.reduce((n, e) => n + e.hp, 0);
    const petCasts = events.filter((v) => v.type === 'petSkill' && v.stage === 'release');
    report.combat.push({
      name,
      mode,
      deliveredDps: round(damage / 30),
      first:
        u.type === 'pet'
          ? petCasts.filter((v) => v.slot === 1).length
          : events.filter(
              (v) =>
                v.type === 'companionSkill' && ['power-strike', 'triple-shot'].includes(v.skill),
            ).length,
      second:
        u.type === 'pet'
          ? petCasts.filter((v) => v.slot === 2).length
          : events.filter(
              (v) =>
                v.type === 'companionSkill' && ['holy-cleave', 'piercing-volley'].includes(v.skill),
            ).length,
      moved: round(moved),
    });
    assert(damage > 0, name + ' ' + mode + ' deals actual damage');
  }
}
// Reproduce the authored skill-range gate without allowing a movement step to
// conceal it. This is the normal shared update, with dt=0, on legal open terrain.
for (const name of families.filter((f) => C.rules.petCompanions[f].role === 'melee')) {
  for (const slot of [1, 2]) {
    const { g, u, e, events } = scene(name),
      def = g.petSkillDefinition(u, slot);
    e.x = u.x + def.range - 1;
    if (slot === 2) u.skill1Cd = 30;
    else u.skill2Cd = 30;
    assert(g.petSkillTargets(u, e, slot).length > 0);
    g.updateParty(0);
    report.reach.push({
      name,
      slot,
      distance: def.range - 1,
      activates:
        slot === 1
          ? events.some((v) => v.type === 'petSkill' && v.stage === 'release')
          : !!g.partyChargeState(u),
    });
  }
}
for (const name of families)
  for (const heroClass of ['paladin', 'mage', 'ranger']) {
    const { g, u, e, events } = scene(name, heroClass);
    assert.equal(g.squadDoctrineLabel().mode, heroClass === 'paladin' ? 'focus' : 'guard');
    const add = g.makeEnemy(
      { species: 'goblin', level: 20, hp: 1000000, damage: 0, xp: 0, gold: 0 },
      { x: 890, y: 930 },
    );
    g.zone().enemies.push(add);
    g.engage(add);
    g.s.squadDoctrine = 'focus';
    g.holdHeroTarget(() => true, e.id);
    g.updateParty(0);
    assert.equal(g._tacticalPartyTargets.get(u.id), e.id, name + ' obeys player focus');
    g.clearPartyCharge(u);
    g._companionCharges?.clear();
    // Switch a real boss context through the same BOSS/ADDS doctrine path.
    e.type = 'boss';
    e.family = 'thorn';
    e.stage = 'normal';
    add.summon = true;
    add.owner = e.id;
    g.clearCompanionJudgment(u);
    g.updateParty(0);
    assert.equal(g._tacticalPartyTargets.get(u.id), e.id, name + ' BOSS');
    g.clearPartyCharge(u);
    g._companionCharges?.clear();
    g.s.squadDoctrine = 'guard';
    g.clearCompanionJudgment(u);
    g.updateParty(0);
    assert.equal(g._tacticalPartyTargets.get(u.id), add.id, name + ' ADDS');
    // Critical wounds must trigger shared caution even against a single enemy.
    g.clearPartyCharge(u);
    g._companionCharges?.clear();
    g.zone().enemies = [add];
    Object.assign(add, { x: u.x + 60, y: u.y, summon: false, owner: null });
    u.hp = u.maxHp * 0.2;
    g.clearCompanionJudgment(u);
    assert(g.companionSafetyAssessment(u, add, [u]).unsafe);
    g.updateParty(0.05);
    assert(g.companionRetreating(u), name + ' shared retreat state');
    assert(
      !g.companionPursuitRouteAllowed(u, [{ x: g.hero.x + 1000, y: g.hero.y + 500 }, add]),
      name + ' rejects unsupported detour',
    );
    // One Recall cancels the action, applies actual mitigation, reaches the hero,
    // and does not autonomously resume offensive skills during the defensive hold.
    u.hp = u.maxHp;
    Object.assign(u, { x: g.hero.x - 320, y: g.hero.y });
    assert(g.recallParty());
    const hp = u.hp;
    g.hitParty(u, 100);
    assert(Math.abs(hp - u.hp - (100 - g.companionArmor('pet') * 0.35) * 0.5) < 1e-7);
    const at = events.length;
    g.zone().enemies = [];
    ticks(g, 5);
    assert(!g.recallInProgress(), name + ' arrives after one Recall');
    assert(!events.slice(at).some((v) => v.type === 'petSkill' && v.slot > 0));
    const saved = g.snapshot();
    saved.party[0].damage = 1; // Previously saved numbers must refresh from live rules.
    const restored = C.restore(saved, () => 0.9),
      pet = restored.s.party[0];
    assert.equal(pet.petFamily, name);
    assert.equal(pet.damage, C.rules.balance.companions.petDamage);
    assert(restored.companionSecondSkillUnlocked());
    const ranger = g.unit('archer', g.hero.x, g.hero.y);
    g.s.party.push(ranger);
    u.hp = u.maxHp * 0.25;
    const wounded = u.hp;
    g.autoRangerSupport();
    assert(g.hasSupportEffect(u, 'health'), name + ' receives automatic Ranger healing');
    g.updateRangerSupport(1);
    assert(u.hp > wounded);
    report.contracts.push({
      name,
      heroClass,
      focus: true,
      bossAdds: true,
      criticalRetreat: true,
      supportRoute: true,
      recall: true,
      armorAndRetreatMitigation: true,
      restoredSkills: true,
      rangerHealing: true,
    });
  }
for (const name of families.filter((f) => C.rules.petCompanions[f].role === 'ranged')) {
  for (const heroClass of ['paladin', 'mage', 'ranger']) {
    const { g, u, e, events } = scene(name, heroClass);
    Object.assign(g.hero, { x: 400, y: 400 });
    g.formationHeading = { x: 0, y: 1 };
    Object.assign(u, g.partyFollowPoint(u));
    Object.assign(e, { x: u.x, y: u.y });
    e.home = { x: e.x, y: e.y };
    const reach = Math.min(
      C.rules.balance.companions.petBasicRange,
      g.petDefinition(u).first.range,
      g.petDefinition(u).second.range,
    );
    const point = g.petCombatPoint(u, e, [u], reach);
    const supportedPoint =
      g.companionSupportDistance(u, point) <= C.rules.companionJudgment.maxAdvanceFromHero;
    ticks(g, 6);
    const secondActivates = events.some(
      (v) => v.type === 'petSkill' && v.stage === 'release' && v.slot === 2,
    );
    if (!process.env.PET_AUDIT_BASELINE) {
      assert(supportedPoint);
      assert(secondActivates, name + ' close-target positioning does not suppress second');
    }
    report.positioning.push({ name, heroClass, supportedPoint, secondActivates });
  }
}
fs.writeFileSync(
  process.env.PET_AUDIT_OUTPUT || __dirname + '/findings.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    cases:
      report.stats.length +
      report.inheritance.length +
      report.combat.length +
      report.reach.length +
      report.contracts.length +
      report.positioning.length,
    meleeReachPasses: report.reach.filter((r) => r.activates).length,
    contracts: report.contracts.length,
  }),
);
module.exports = { scene, ticks, families, report };
