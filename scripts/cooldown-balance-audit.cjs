'use strict';
// Offline, repeatable observation of the production Campaign methods.
// Fixtures are isolated; this script does not change live rules or saved campaigns.
const fs = require('node:fs'),
  path = require('node:path'),
  cp = require('node:child_process');
const C = require('../src/prototype/engine');
const classes = ['paladin', 'mage', 'ranger'];
const tiers = [
  { level: 6, skill: 1, gear: 0, slots: 3, family: 'thorn' },
  { level: 16, skill: 4, gear: 2, slots: 6, family: 'archive' },
  { level: 30, skill: 8, gear: 4, slots: 8, family: 'darklord' },
];
const seeds = [113, 271, 997];
function rng(seed) {
  let x = seed >>> 0;
  return () => {
    x = (1664525 * x + 1013904223) >>> 0;
    return x / 4294967296;
  };
}
const round = (n) => {
  const value = Math.round(n * 10000) / 10000;
  return value === 0 ? 0 : value;
};
function fixture(cls, tier, rank, mode = 'normal', seed = 113, party = 'mixed') {
  const g = new C(mode, cls, rng(seed));
  const h = g.hero,
    z = g.zone();
  h.level = tier.level;
  h.maxHp = C.classes[cls].hp + (tier.level - 1) * C.rules.balance.growth.hpPerLevel;
  h.hp = h.maxHp;
  h.skills = Array.from({ length: 8 }, (_, i) => (i < tier.slots ? tier.skill : 0));
  h.talents =
    tier.level === 6 ? [0, rank, 0, 0] : tier.level === 16 ? [3, rank, 3, 1] : [5, rank, 5, 3];
  h.maxHp += h.talents[2] * g.talentProfile().hp;
  h.hp = h.maxHp;
  h.weapon = h.armorTier = tier.gear;
  h.mp = 0;
  Object.assign(h, { x: 910, y: 1000, order: null });
  g.s.expeditionRank = 6;
  g.s.companionCombatTraining = tier.slots >= 2 ? 2 : 1;
  g.s.mercyTime = 0;
  // A cleared outdoor benchmark arena avoids town rest or unrelated guardian waves.
  z.props = [];
  z.npcs = [];
  z.nodes = [];
  z.buildings = [];
  g.s.quests = {};
  g.s.party = (
    party === 'solo'
      ? []
      : party === 'soldiers'
        ? ['soldier', 'soldier']
        : party === 'six'
          ? ['soldier', 'archer', 'soldier', 'archer', 'soldier', 'archer']
          : ['soldier', 'archer']
  ).map((type, i) => g.unit(type, 875, 980 + i * 12));
  g.syncCompanionLevelStats();
  // Background world activity is outside this isolated encounter. Boss AI,
  // summons, rogue maneuvers, collision, damage and support still run unchanged.
  g.updateNight = () => {};
  g.updatePacks = () => {};
  g.updateGuardianReinforcements = () => {};
  g.updateElites = () => {};
  g.xp = () => {};
  g.enemyVfxEnabled = false;
  return g;
}
function meter(g, primary) {
  const m = {
    damage: 0,
    heroDamage: 0,
    companionDamage: 0,
    primaryDamage: 0,
    received: 0,
    siphon: 0,
    allSiphon: 0,
    recovery: 0,
    heroHealing: 0,
    partyHealing: 0,
    rangerHealing: 0,
    immuneTime: 0,
    hasteTime: 0,
    slowTime: 0,
    casts: Array(11).fill(0),
    summons: 0,
    resets: 0,
    resetHpDelta: 0,
    normalizationHpDelta: 0,
  };
  const recordHit = g.tacticalRecordHit,
    hit = g.hitParty,
    event = g.event,
    cast = g.cast,
    support = g.updateRangerSupport,
    summon = g.summonBossAdds,
    disengage = g.disengage,
    engage = g.engage,
    updateEnemies = g.updateEnemies;
  // Observe the resolver's actual post-compression HP damage. A hit may first
  // normalize a disengaged enemy; net HP delta is not an accurate damage meter.
  g.tacticalRecordHit = function (e, source, dealt) {
    m.damage += dealt;
    if (e === primary) m.primaryDamage += dealt;
    if (source === 'hero') m.heroDamage += dealt;
    else m.companionDamage += dealt;
    return recordHit.call(this, e, source, dealt);
  };
  g.engage = function (e, ...args) {
    const hp = e.hp;
    const result = engage.call(this, e, ...args);
    if (e === primary) m.normalizationHpDelta += e.hp - hp;
    return result;
  };
  g.updateEnemies = function (...args) {
    const hp = primary?.hp,
      maxHp = primary?.maxHp,
      deaths = this.s.statistics.deaths;
    const balance = () =>
      m.siphon + m.recovery + m.resetHpDelta + m.normalizationHpDelta - m.primaryDamage;
    const before = balance();
    const result = updateEnemies.apply(this, args);
    if (primary && primary.maxHp !== maxHp && this.s.statistics.deaths === deaths)
      m.normalizationHpDelta += primary.hp - hp - (balance() - before);
    return result;
  };
  g.hitParty = function (u, ...args) {
    const hp = u.hp,
      deaths = this.s.statistics.deaths,
      result = hit.call(this, u, ...args);
    m.received += this.s.statistics.deaths > deaths ? hp : Math.max(0, hp - u.hp);
    return result;
  };
  g.event = function (type, details = {}) {
    if (['lifeSiphon', 'ashFeeding'].includes(type)) {
      m.allSiphon += details.amount;
      if (details.source === primary?.id) m.siphon += details.amount;
    }
    if (type === 'heal' && details.target === primary?.id) m.recovery += details.amount || 0;
    return event.call(this, type, details);
  };
  g.cast = function (slot, target, charged = false) {
    const units = [this.hero, ...this.activeLivingParty()],
      hp = units.map((u) => u.hp);
    const result = cast.call(this, slot, target, charged);
    if (result) {
      m.casts[charged ? 7 + slot : slot - 1]++;
      units.forEach((u, i) => {
        const heal = Math.max(0, u.hp - hp[i]);
        if (i === 0) m.heroHealing += heal;
        else m.partyHealing += heal;
      });
    }
    return result;
  };
  g.updateRangerSupport = function (dt) {
    const units = [this.hero, ...this.activeLivingParty()],
      hp = units.map((u) => u.hp);
    support.call(this, dt);
    m.rangerHealing += units.reduce((sum, u, i) => sum + Math.max(0, u.hp - hp[i]), 0);
  };
  g.summonBossAdds = function (...args) {
    const made = summon.apply(this, args);
    m.summons += made;
    return made;
  };
  g.disengage = function (e, ...args) {
    const hp = e.hp;
    if (e === primary && !e.returning) m.resets++;
    const result = disengage.call(this, e, ...args);
    if (e === primary) m.resetHpDelta += e.hp - hp;
    return result;
  };
  return m;
}
function dummy(g, x = 1000, y = 1000) {
  return g.makeEnemy(
    {
      species: 'goblin',
      name: 'Unarmored audit target',
      level: g.hero.level,
      hp: 1e9,
      damage: 0,
      gold: 0,
      xp: 0,
    },
    { x, y },
  );
}
function throughput(cls, tier, rank, slot, charged, targets = 1, duration = 120) {
  const g = fixture(cls, { ...tier, slots: 8 }, rank, 'normal', 113, 'six');
  g.zone().enemies = Array.from({ length: targets }, (_, i) => dummy(g, 1000 + i * 16, 1000));
  const e = g.zone().enemies[0],
    m = meter(g, e);
  g.zone();
  let charge = null;
  for (let step = 0; step < duration * 100; step++) {
    const dt = 0.01,
      h = g.hero;
    g.s.time += dt;
    h.cd = h.cd.map((x) => Math.max(0, x - dt));
    for (const key of ['immune', 'haste', 'slow']) h[key] = Math.max(0, h[key] - dt);
    for (const u of g.zone().enemies) u.slow = Math.max(0, (u.slow || 0) - dt);
    if (h.cd[slot - 1] < 1e-9) {
      if (charged && charge === null) charge = g.s.time + C.rules.chargedSkills.holdSeconds;
      if (!charged || g.s.time + 1e-9 >= charge) {
        if ([3, 8].includes(slot)) for (const u of [h, ...g.s.party]) u.hp = u.maxHp * 0.05;
        g.cast(slot, e.id, charged);
        charge = null;
      }
    }
    g.updateProjectiles(dt);
    if (h.immune > 0) m.immuneTime += dt;
    if (h.haste > 0) m.hasteTime += dt;
    if (e.slow > 0) m.slowTime += dt;
    g.effects = [];
    g.notices = [];
    g.messages = [];
  }
  return {
    class: cls,
    level: tier.level,
    skillRank: tier.skill,
    talent: rank,
    slot,
    charged,
    targets,
    cooldown: g.skillCooldown(slot, charged),
    duration,
    dps: round(m.damage / duration),
    hps: round(m.heroHealing / duration),
    partyHps: round(m.partyHealing / duration),
    immunity: round(m.immuneTime / duration),
    haste: round(m.hasteTime / duration),
    slow: round(m.slowTime / duration),
    casts: m.casts[charged ? 7 + slot : slot - 1],
  };
}
function fight(config) {
  const {
    cls,
    level,
    family,
    form = 'normal',
    rank,
    mode,
    party,
    seed,
    healing = true,
    strategy = 'mixed',
    dodge = true,
    authored = false,
    partyHeal = true,
  } = config;
  const tier = tiers.find((t) => t.level === level),
    g = fixture(cls, tier, rank, mode, seed, party);
  const packRegion = family.startsWith('pack-') ? family.slice(5) : null;
  let z = g.zone();
  let pack;
  let encounterPoint;
  if (packRegion) {
    g.enter(packRegion);
    z = g.zone();
    pack = z.enemies
      .filter((e) => e.type === 'mob' && !e.captain && !e.guard && (!e.form || e.form === 'normal'))
      .slice(0, 4);
    if (pack.length !== 4) throw Error('Audit pack needs four ordinary enemies: ' + packRegion);
    z.props = [];
    z.nodes = [];
    z.npcs = [];
    z.buildings = [];
  }
  if (!packRegion) {
    const definition = C.data.bosses.find((b) => b.id === family);
    g.enter(definition.kind === 'dungeon' ? family : definition.region);
    z = g.zone();
    encounterPoint =
      z.enemies.find((u) => u.type === 'boss' && u.family === family)?.home ||
      (definition.kind === 'dungeon'
        ? { x: 1160, y: 1110 }
        : { x: C.data.fields[g.regionIndex()][0], y: C.data.fields[g.regionIndex()][1] });
    z.enemies = [];
    z.nodes = [];
    z.npcs = [];
    z.buildings = [];
    if (!authored) z.props = [];
  }
  if (
    !packRegion &&
    form === 'true' &&
    C.data.bosses.find((b) => b.id === family).kind === 'dungeon'
  ) {
    g.s.phase = 'awakening';
    g.s.awakeningLevel = level + 2;
  }
  const p = packRegion
    ? g.safe(1000, 1000)
    : g.safe(
        (encounterPoint || { x: 1160, y: 1110 }).x,
        (encounterPoint || { x: 1160, y: 1110 }).y,
      );
  if (g.blocked(p.x, p.y)) throw Error('Blocked audit encounter origin: ' + family);
  const e = packRegion ? pack[0] : g.bossEnemy(g.boss(family), form, p);
  z.enemies = packRegion ? pack : [e];
  if (packRegion)
    for (const [i, u] of pack.entries())
      Object.assign(u, {
        x: p.x + i * 35,
        y: p.y + (i % 2) * 30,
        home: { x: p.x + i * 35, y: p.y + (i % 2) * 30 },
      });
  g.zone();
  const multipliers = g.multipliers();
  for (const u of z.enemies) {
    u.maxHp = u.hp = u.baseHp * multipliers.hp;
    u.damage = u.baseDamage * multipliers.damage;
  }
  Object.assign(g.hero, g.safe(e.x - 90, e.y));
  for (const [i, u] of g.s.party.entries())
    Object.assign(u, g.safe(g.hero.x - 30, g.hero.y + i * 12));
  if (!healing) {
    g.startBossRecovery = () => false;
    const hit = g.hitParty;
    g.hitParty = function (u, amount, drain) {
      return hit.call(this, u, amount, drain, null);
    };
  }
  const initialBossHp = e.hp,
    m = meter(g, e),
    initialParty = g.s.party.length;
  g.engage(e);
  g.selectHeroTarget?.(e.id);
  let charge = null,
    stage = null,
    goal = null,
    elapsed = 0;
  while (
    elapsed < 179.99 &&
    (packRegion ? pack.some((u) => u.hp > 0) : e.hp > 0) &&
    !g.s.statistics.deaths
  ) {
    const target = packRegion ? pack.find((u) => u.hp > 0) : e;
    const h = g.hero,
      injured = g.activeLivingParty().filter((u) => u.hp < u.maxHp * 0.7);
    if (charge && g.s.time + 1e-9 >= charge.until) {
      g.cast(charge.slot, target.id, true);
      charge = null;
    }
    if (!charge && h.cd[2] < 1e-9 && h.skills[2]) {
      if (partyHeal && party !== 'solo' && injured.length >= 2)
        charge = { slot: 3, until: g.s.time + 0.65 };
      else if (h.hp < h.maxHp * 0.65) g.cast(3, target.id);
    }
    if (h.skills[3] && e.telegraph && !e.telegraph.bossHeal) g.cast(4, e.id);
    for (const slot of [8, 7, 6, 5]) if (h.skills[slot - 1]) g.cast(slot, target.id);
    if (!charge && h.cd[1] < 1e-9 && h.skills[1]) {
      const count = z.enemies.filter(
        (u) => u.hp > 0 && Math.hypot(u.x - e.x, u.y - e.y) < 220,
      ).length;
      if (strategy === 'charged2' || count >= 2) charge = { slot: 2, until: g.s.time + 0.65 };
      else g.cast(2, target.id);
    }
    if (!charge && h.cd[0] < 1e-9) {
      if (strategy === 'charged1') charge = { slot: 1, until: g.s.time + 0.65 };
      else g.cast(1, target.id);
    }
    const a = e.telegraph || e.motion;
    if (dodge && a && !a.bossHeal && !a.rogueMove && a.kind !== 'summon') {
      if (stage !== a) {
        stage = a;
        const angle = Math.atan2(h.y - e.y, h.x - e.x);
        goal =
          a.kind === 'cone' || a.kind === 'sector'
            ? g.safe(e.x + Math.cos(angle + 1.6) * 240, e.y + Math.sin(angle + 1.6) * 240)
            : g.safe(
                (a.x || e.x) + Math.cos((a.angle || 0) + Math.PI / 2) * 240,
                (a.y || e.y) + Math.sin((a.angle || 0) + Math.PI / 2) * 240,
              );
      }
      h.order = { type: 'move', ...goal };
    } else {
      h.order = { type: 'move', ...g.safe(target.x - (cls === 'paladin' ? 90 : 220), target.y) };
    }
    if (charge?.slot === 1) g.s.holdFire = true;
    else g.s.holdFire = false;
    const positionBefore = { x: h.x, y: h.y };
    g.tick(0.1);
    // Mirror the shell's existing movement autoattack, including Skill-1 hold suppression.
    if (
      charge?.slot !== 1 &&
      C.rules.movementBasicClasses[cls] &&
      Math.hypot(h.x - positionBefore.x, h.y - positionBefore.y) > 0.25 &&
      !g.s.statistics.deaths
    )
      g.cast(1);
    if (h.immune > 0) m.immuneTime += 0.1;
    if (h.haste > 0) m.hasteTime += 0.1;
    if (e.slow > 0) m.slowTime += 0.1;
    elapsed += 0.1;
    g.effects = [];
    g.notices = [];
    g.messages = [];
  }
  return {
    ...config,
    zone: z.id,
    origin: { x: round(p.x), y: round(p.y) },
    seconds: round(elapsed),
    won: packRegion ? pack.every((u) => u.hp <= 0) : e.hp <= 0,
    died: g.s.statistics.deaths > 0,
    remainingBossHp: round(e.hp / e.maxHp),
    initialBossHp: round(initialBossHp),
    // Defeat intentionally resets the encounter. Do not label that reset as healing.
    unaccountedHpGain: g.s.statistics.deaths
      ? null
      : round(
          e.hp -
            initialBossHp -
            m.siphon -
            m.recovery -
            m.resetHpDelta -
            m.normalizationHpDelta +
            m.primaryDamage,
        ),
    heroHp: g.s.statistics.deaths ? 0 : round(g.hero.hp / g.hero.maxHp),
    companionsAlive: g.s.party.filter((u) => u.hp > 0).length,
    initialParty,
    ...Object.fromEntries(
      Object.entries(m)
        .filter(([k]) => k !== 'casts')
        .map(([k, v]) => [k, round(v)]),
    ),
    casts: m.casts,
  };
}
function run({ quick = false, shard = 0, shards = 1, encountersOnly = false, startCase = 0 } = {}) {
  const throughputRows = [],
    fights = [];
  const talentRanks = quick ? [0, 5] : [0, 1, 2, 3, 4, 5];
  for (const tier of shard === 0 && !encountersOnly ? (quick ? [tiers[0]] : tiers) : [])
    for (const cls of classes)
      for (const rank of talentRanks)
        for (const [slot, charged] of [
          ...Array.from({ length: 8 }, (_, i) => [i + 1, false]),
          [1, true],
          [2, true],
          [3, true],
        ])
          for (const targets of slot <= 2 ? [1, 6] : [1])
            throughputRows.push(throughput(cls, tier, rank, slot, charged, targets));
  console.log('Throughput fixtures:', throughputRows.length);
  const cases = [];
  for (const tier of quick ? [tiers[0]] : tiers)
    for (const cls of classes)
      for (const rank of talentRanks)
        for (const mode of ['normal', 'nightmare'])
          for (const party of quick ? ['mixed'] : ['solo', 'mixed', 'six'])
            for (const seed of quick ? [113] : seeds)
              for (const form of ['normal', 'true'])
                cases.push({
                  cls,
                  level: tier.level,
                  family: tier.family,
                  form,
                  rank,
                  mode,
                  party,
                  seed,
                });
  if (!quick) {
    for (const tier of tiers)
      for (const cls of classes)
        for (const rank of talentRanks)
          for (const mode of ['normal', 'nightmare'])
            for (const party of ['solo', 'mixed', 'six'])
              for (const seed of seeds)
                cases.push({
                  cls,
                  level: tier.level,
                  family:
                    'pack-' +
                    (tier.level === 6 ? 'vale' : tier.level === 16 ? 'highlands' : 'crown'),
                  rank,
                  mode,
                  party,
                  seed,
                });
    for (const family of [
      'crypt',
      'abyss',
      'citadel',
      'mire',
      'ridge',
      'mine',
      'warlord',
      'cindermaw',
    ])
      for (const cls of classes)
        for (const rank of [0, 5])
          for (const mode of ['normal', 'nightmare'])
            for (const party of ['solo', 'mixed', 'six'])
              for (const seed of seeds)
                for (const form of ['normal', 'true'])
                  cases.push({
                    cls,
                    level: ['crypt', 'mire'].includes(family)
                      ? 6
                      : ['abyss', 'ridge', 'mine'].includes(family)
                        ? 16
                        : 30,
                    family,
                    form,
                    rank,
                    mode,
                    party,
                    seed,
                  });
    // Matched healing ablation and no-Ranger / tactical charge comparisons.
    for (const family of ['crypt', 'archive', 'abyss', 'citadel', 'darklord'])
      for (const mode of ['normal', 'nightmare'])
        for (const seed of seeds)
          for (const form of ['normal', 'true'])
            for (const party of ['soldiers', 'mixed', 'six'])
              for (const healing of [false, true])
                cases.push({
                  cls: 'mage',
                  level: 30,
                  family,
                  form,
                  rank: 5,
                  mode,
                  party,
                  seed,
                  healing,
                });
    for (const cls of classes)
      for (const seed of seeds)
        for (const strategy of ['mixed', 'charged1', 'charged2'])
          cases.push({
            cls,
            level: 16,
            family: 'archive',
            form: 'normal',
            rank: 5,
            mode: 'normal',
            party: 'mixed',
            seed,
            strategy,
            authored: true,
          });
    // Late-game awakened dungeons for every class, rather than treating the
    // early-level TRUE stress cases as a normal progression expectation.
    for (const family of ['crypt', 'archive', 'mine', 'abyss', 'citadel'])
      for (const cls of classes)
        for (const rank of [0, 5])
          for (const mode of ['normal', 'nightmare'])
            for (const party of ['solo', 'mixed', 'six'])
              for (const seed of seeds)
                cases.push({
                  cls,
                  level: 30,
                  family,
                  form: 'true',
                  rank,
                  mode,
                  party,
                  seed,
                  scenario: 'late-awakening',
                });
    for (const family of ['darklord', 'abyss'])
      for (const cls of classes)
        for (const rank of [0, 5])
          for (const mode of ['normal', 'nightmare'])
            for (const seed of seeds)
              for (const form of ['normal', 'true'])
                cases.push({
                  cls,
                  level: 30,
                  family,
                  form,
                  rank,
                  mode,
                  party: 'mixed',
                  seed,
                  dodge: false,
                });
    for (const family of ['crypt', 'archive', 'abyss', 'citadel', 'darklord'])
      for (const mode of ['normal', 'nightmare'])
        for (const seed of seeds)
          for (const form of ['normal', 'true'])
            for (const party of ['soldiers', 'mixed', 'six'])
              cases.push({
                cls: 'mage',
                level: 30,
                family,
                form,
                rank: 5,
                mode,
                party,
                seed,
                healing: true,
                partyHeal: false,
              });
    // Extend matched enemy-healing ablations to all classes, both talent
    // extremes and solo play. The original Mage/rank-5 party cases above are
    // reused; do not duplicate their statistical weight.
    for (const family of ['crypt', 'archive', 'abyss', 'citadel', 'darklord'])
      for (const cls of classes)
        for (const rank of [0, 5])
          for (const mode of ['normal', 'nightmare'])
            for (const seed of seeds)
              for (const form of ['normal', 'true'])
                for (const party of ['solo', 'soldiers', 'mixed', 'six']) {
                  if (cls === 'mage' && rank === 5 && party !== 'solo') continue;
                  for (const healing of [false, true])
                    cases.push({ cls, level: 30, family, form, rank, mode, party, seed, healing });
                }
    for (const family of ['archive', 'darklord'])
      for (const cls of classes)
        for (const rank of talentRanks)
          for (const mode of ['normal', 'nightmare'])
            for (const party of ['solo', 'mixed'])
              for (const seed of seeds)
                for (const form of ['normal', 'true'])
                  for (const strategy of ['mixed', 'charged1', 'charged2'])
                    cases.push({
                      cls,
                      level: family === 'archive' ? 16 : 30,
                      family,
                      form,
                      rank,
                      mode,
                      party,
                      seed,
                      strategy,
                      authored: family === 'archive',
                      scenario: 'charge-policy',
                    });
  }
  for (const [i, config] of cases.entries()) {
    if (i < startCase) continue;
    if (i % shards !== shard) continue;
    fights.push({ caseIndex: i, ...fight(config) });
    if ((i + 1) % 100 === 0) console.log('Encounter trials:', i + 1, '/', cases.length);
  }
  const result = {
    version: require('../package.json').version,
    commit: cp
      .execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
      })
      .trim(),
    seeds,
    tiers,
    shard,
    shards,
    totalCases: cases.length,
    startCase,
    limits:
      'Scripted tactical policies at authored boss spawn points in the correct region/dungeon, with local props removed; selected Archive trials retain props. Original terrain, dungeon boundaries/partitions and traps remain. Full tick / production combat AI and summons, no town recovery/background waves/reward leveling. TRUE dungeons use awakening level +2. Throughput uses 10ms steps and encounter trials use 100ms steps. Not a human enjoyment or physical-device performance measurement.',
    throughput: throughputRows,
    fights,
  };
  return result;
}
module.exports = { rng, fixture, meter, throughput, fight, run };
if (require.main === module) {
  const partition = (process.argv.find((a) => a.startsWith('--shard='))?.slice(8) || '0/1')
    .split('/')
    .map(Number);
  const result = run({
    quick: process.argv.includes('--quick'),
    shard: partition[0],
    shards: partition[1],
    encountersOnly: process.argv.includes('--encounters-only'),
    startCase: Number(process.argv.find((a) => a.startsWith('--from-case='))?.slice(12) || 0),
  });
  const out =
    process.argv.find((a) => a.startsWith('--out='))?.slice(6) ||
    'docs/evidence/COOLDOWN_BALANCE_20261009.json';
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
  console.log('Saved', out, '·', result.fights.length, 'encounters');
}
