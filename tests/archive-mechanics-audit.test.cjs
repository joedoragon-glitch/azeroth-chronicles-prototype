'use strict';
// Set ARCHIVE_MECHANICS_ROOT to a detached latest-main checkout to audit this
// Archive against that engine without merging, rebasing or changing gameplay.
const assert = require('node:assert/strict');
const path = require('node:path');
const root = process.env.ARCHIVE_MECHANICS_ROOT || path.resolve(__dirname, '..');
const C = require(path.join(root, 'src/prototype/engine.js'));
const A = require('../src/prototype/archive.js');
const { D, R } = { D: C.data, R: C.rules };
const n = (x) => Math.round(x * 100) / 100;
const pc = (x) => n(x * 100);
const near = (a, b, label) => assert(Math.abs(a - b) < 1e-7, label + ': ' + a + ' != ' + b);
const catalog = (g) => A.sections(g, { D, R });
const topic = (g, name) =>
  catalog(g)
    .flatMap((s) => s.topics)
    .find((t) => t[0] === name);
const has = (text, fragment) =>
  assert(text.includes(fragment), 'Missing audited fact: ' + fragment);
function arena(cls = 'paladin') {
  const g = new C('normal', cls, () => 0.93);
  Object.assign(g.hero, { x: 500, y: 500, order: null, level: 12, weapon: 2, hp: 1, maxHp: 1000 });
  g.zone().props = [];
  g.zone().buildings = [];
  g.zone().npcs = [];
  g.line = () => true;
  g.zone().enemies = Array.from({ length: 20 }, (_, i) =>
    g.makeEnemy(
      {
        species: 'goblin',
        name: 'Audit target ' + i,
        level: 1,
        hp: 100000,
        damage: 20,
        gold: 0,
        xp: 0,
      },
      { x: 570 + i, y: 500 },
    ),
  );
  g.s.party = [g.unit('soldier', 520, 500)];
  return g;
}
let casts = 0;
for (const cls of ['paladin', 'mage', 'ranger'])
  for (let rank = 1; rank <= 8; rank++)
    for (let slot = 1; slot <= 8; slot++)
      for (const charged of [false, true]) {
        const g = arena(cls),
          target = g.zone().enemies[0];
        g.hero.skills.fill(rank);
        g.hero.talents[1] = rank % 6;
        if (cls === 'mage' && slot === 3 && !charged)
          target.rangedAim = { remaining: 0.4, max: 0.4, targetId: 'hero' };
        const before = JSON.stringify(g.snapshot());
        const card = catalog(g).find((s) => s.title === 'Your skills').topics[slot - 1];
        assert.equal(JSON.stringify(g.snapshot()), before, 'Reference remains read-only');
        const wait = Number(
          card[2].match(charged ? /Charged recovery: ([\d.]+)/ : /base recovery ([\d.]+)/)[1],
        );
        const raw = [];
        g.damage = (e, amount) => {
          raw.push(amount);
          return true;
        };
        assert(g.cast(slot, target.id, charged), [cls, slot, rank, charged].join('/'));
        if (cls === 'paladin' && slot === 3 && !charged) {
          near(g.hero.shieldStance, R.heroTactics.paladin.shield.duration, 'Shield duration');
          has(card[1], 'for ' + g.hero.shieldStance + 's');
        } else
          near(n(g.hero.cd[slot - 1]), wait, 'Native spent cooldown vs rounded Archive figure');
        if (slot === 2 && cls !== 'paladin') {
          if (!charged) {
            for (const p of g.s.projectiles) if (p.slow) g.applySlow(target, p.slow);
          }
          const advertised = Number(
            card[2].match(charged ? /charged Slow: ([\d.]+)/ : /Tap Slow: ([\d.]+)/)[1],
          );
          near(target.slow, advertised, 'Applied Slow including shared duration bonus');
        }
        if (slot === 5 || (slot === 7 && cls === 'paladin')) {
          const cap =
            slot === 5
              ? R.heroAreaTargetCaps[5][charged ? 'charged' : 'normal']
              : R.heroAreaTargetCaps[7][charged ? 'paladinCharged' : 'paladinNormal'];
          assert.equal(raw.length || g.s.projectiles.length, cap, 'Native area target cap');
          has(card[1], String(cap));
        }
        if (cls === 'ranger' && slot === 2 && !charged) assert.equal(g.s.projectiles.length, 2);
        if (cls === 'ranger' && slot === 6 && charged)
          assert.equal(g.s.projectiles.length, R.advancedCharges[6].ranger.arrows);
        if (cls === 'ranger' && slot === 8) {
          const cfg = R.classUltimates.ranger[charged ? 'charged' : 'normal'];
          assert.equal(g.s.projectiles.length, cfg.targets * (cfg.arrowsPerTarget || 1));
          has(card[1], String(cfg.targets));
        }
        if (cls === 'mage' && slot === 7) {
          const cfg = R.classUltimates.mage[charged ? 'chargedChain' : 'chain'];
          assert.equal(raw.length, cfg.targets);
          has(card[1], String(cfg.targets));
        }
        if (cls === 'mage' && slot === 8)
          assert.equal(
            raw.length,
            R.classUltimates.mage[charged ? 'charged' : 'normal'].maxTargets,
          );
        if (cls === 'mage' && slot === 3 && charged) {
          const text = A.conditionTopics(R).find((t) => t[0] === 'Silence')[2];
          near(
            g.hero.silenceField.until - g.s.time,
            R.heroTactics.mage.silence.duration +
              g.tacticMilestones(rank) * R.heroTactics.mage.silence.durationStep,
            'Native rank-based Silence',
          );
          has(
            text,
            R.heroTactics.mage.silence.duration +
              '–' +
              (R.heroTactics.mage.silence.duration + 4 * R.heroTactics.mage.silence.durationStep),
          );
        }
        if (cls === 'ranger' && slot === 4) {
          if (charged) {
            const u = g.s.party[0];
            near(
              u.rangerRallyMovement,
              R.heroTactics.ranger.rally.movementBonus +
                g.tacticMilestones(rank) * R.heroTactics.ranger.rally.movementStep,
              'Rally movement',
            );
            near(
              u.rangerRallyAttack,
              R.heroTactics.ranger.rally.attackSpeedBonus +
                g.tacticMilestones(rank) * R.heroTactics.ranger.rally.attackSpeedStep,
              'Rally attack speed',
            );
            has(
              card[1],
              pc(R.heroTactics.ranger.rally.movementBonus) +
                '–' +
                pc(
                  R.heroTactics.ranger.rally.movementBonus +
                    4 * R.heroTactics.ranger.rally.movementStep,
                ) +
                '%',
            );
          } else near(g.hero.haste, Math.min(6, 4 + 0.25 * (rank - 1)), 'Hero haste duration');
        }
        if (cls === 'paladin' && slot === 8) {
          const cfg = R.classUltimates.paladin[charged ? 'charged' : 'normal'];
          near((g.hero.hp - 1) / g.hero.maxHp, cfg.heal, 'Sanctuary/Last Bastion healing');
          near(g.hero.wardReduction, cfg.wardReduction, 'Native ward');
          has(card[1], pc(cfg.heal) + '%');
          has(card[1], pc(cfg.wardReduction) + '%');
        }
        if (cls === 'mage' && slot === 8 && charged) {
          const cfg = R.classUltimates.mage.charged;
          near(
            target.fractureFraction,
            cfg.fracture + g.tacticMilestones(rank) * cfg.fractureStep,
            'Cataclysm vulnerability',
          );
          has(card[1], pc(cfg.fracture) + '–' + pc(cfg.fracture + 4 * cfg.fractureStep) + '%');
        }
        casts++;
      }
// Slow first/overlapping hits: check actual remaining timer and hit-time debt.
{
  const g = arena();
  g.hero.hp = g.hero.maxHp;
  const text = topic(g, 'Slow')[2],
    cfg = R.cooldownBalance;
  has(text, pc(cfg.slowRecoveryMultiplier) + '%');
  has(text, pc(cfg.enemySlowRecoveryMultiplier) + '%');
  for (const [u, enemy] of [
    [g.hero, false],
    [g.zone().enemies[0], true],
  ]) {
    if (enemy) u.specialCd = 10;
    else u.cd[0] = 10;
    assert(g.applySlow(u, 2));
    near(u.slow, 2 + (cfg.slowDurationBonusSeconds || 0), 'Adjusted Slow duration');
    near(
      g.cooldownRecoveryElapsed(u, 1, enemy),
      enemy ? cfg.enemySlowRecoveryMultiplier : cfg.slowRecoveryMultiplier,
      'Single-hit recovery',
    );
    if (Number.isFinite(cfg.slowStackPenalty)) {
      const debt =
        (2 + cfg.slowDurationBonusSeconds) *
        (enemy ? cfg.enemySlowDebtFraction : cfg.slowDebtFraction);
      near(enemy ? u.specialCd : u.cd[0], 10 + debt, 'Hit-time cooldown debt');
      assert(g.applySlow(u, 2));
      near(
        g.cooldownRecoveryElapsed(u, 1, enemy),
        (enemy ? cfg.enemySlowRecoveryMultiplier : cfg.slowRecoveryMultiplier) /
          (1 + (enemy ? cfg.enemySlowStackPenalty : cfg.slowStackPenalty)),
        'Two-hit stack recovery',
      );
      has(text, String(cfg.slowDurationBonusSeconds));
      has(text, pc(cfg.slowDebtFraction) + '%');
      has(text, pc(cfg.enemySlowDebtFraction) + '%');
      has(text, 'accumulated cooldown debt remains');
    }
  }
}
// Boss data, attack coefficients, warnings and summon limits: normal daytime
// baseline is deliberately separate from the actually observed encounter rows.
{
  const g = arena();
  for (const b of D.bosses) {
    const e = g.bossEnemy(b, 'normal', { x: 800, y: 500 });
    const row = topic(g, b.name);
    has(row[2], 'Level ' + e.level + ' · HP ' + e.maxHp + ' · base damage ' + e.damage);
    for (const [index, a] of R.attacks[b.id].entries()) {
      const built = g.buildBossAttack(e, index, g.hero, false).first;
      near(built.total, a.warning, 'Native normal warning');
      near(built.coefficient, a.coefficient, 'Native normal coefficient');
      has(row[2], 'warning ' + built.total + 's');
      has(row[2], 'damage ×' + built.coefficient);
    }
    has(
      row[2],
      'Summon limit: ' +
        g.bossSummonCap({ family: b.id, form: 'normal' }) +
        ' normal / ' +
        g.bossSummonCap({ family: b.id, form: 'true' }) +
        ' TRUE',
    );
  }
  const dark = g.bossEnemy(g.boss('darklord'), 'normal', { x: 800, y: 500 });
  g.zone().enemies = [dark];
  dark.hp = dark.maxHp * R.bossRecovery.darklord.threshold;
  assert.equal(
    g.startBossRecovery(dark),
    false,
    'Second Wind requires strictly below its own threshold',
  );
  dark.hp -= 1;
  assert(g.startBossRecovery(dark));
  const details = topic(g, g.boss('darklord').name)[2];
  has(details, 'below ' + pc(R.bossRecovery.darklord.threshold) + '%');
  has(details, 'restores ' + pc(dark.telegraph.healFraction) + '%');
  has(details, 'warning ' + dark.telegraph.total + 's');
  assert(!details.includes('9999'));
  has(details, 'once per encounter');
  dark.telegraph = null;
  dark.healCd = 0;
  assert.equal(g.startBossRecovery(dark), false, 'No second recovery in the encounter');
}
// Progression/reward calculations are the native queries, not copied totals.
{
  const g = arena();
  for (const level of [1, 5, 20]) {
    g.hero.level = level;
    has(topic(g, 'Why old enemies teach little')[2], 'Next level: ' + g.xpRequired());
    for (let gap = 0; gap <= 5; gap++) {
      const e = {
        type: 'mob',
        form: 'normal',
        level: Math.max(1, level - gap),
        xp: 113,
        gold: 101,
      };
      const m = R.progression.levelGapRewards[Math.min(Math.max(0, level - e.level), 4)];
      assert.deepEqual(g.enemyReward(e), {
        xp: Math.floor(113 * R.progression.ordinaryXpMultiplier * m),
        gold: Math.floor(101 * m),
      });
    }
  }
  has(
    topic(g, 'Why old enemies teach little')[2],
    R.progression.levelGapRewards.map(pc).join(' / '),
  );
  has(topic(g, 'The next lesson')[2], 'point and ' + R.balance.growth.hpPerLevel + ' maximum HP');
  has(topic(g, 'A Ranger’s care')[2], 'Outside combat, any wounded living ally');
  for (const rank of [1, 2]) {
    g.s.rangerSupport = { heal: rank };
    has(
      topic(g, 'A Ranger’s care')[2],
      ': ' + g.rangerSupportAmount('health') + ' HP over ' + R.rangerSupport.duration,
    );
  }
}
// All pet effects: the Archive must report applied Slow, not only its raw seed.
{
  const g = arena();
  g.hero.skills[1] = 1;
  for (const b of D.bosses) g.s.true[b.id] = true;
  for (const b of D.bosses)
    for (const slot of [1, 2]) {
      const u = g.unit('pet', 500, 500, b.id),
        def = g.petSkillDefinition(u, slot),
        target = g.zone().enemies[0];
      g.s.party = [u];
      target.slow = 0;
      delete target.slowStacks;
      g.s.projectiles = [];
      g.damage = () => true;
      assert(g.usePetSkill(u, target, slot));
      for (const p of g.s.projectiles) if (p.slow) g.applySlow(target, p.slow);
      const row = topic(g, g.petDefinition(b.id).name + ' · Active');
      has(row[2], def.range + ' reach');
      has(row[2], def.multiplier + '× companion attack');
      if (def.slow) has(row[2], 'Slow ' + n(target.slow) + 's');
      assert.equal(g.canGatherTribute(u), b.id === R.gatheringTravel.petWorkerFamily);
    }
  const advice = topic(g, 'TRUE boss pets')[1];
  has(advice, 'Little Treasurer alone');
  assert(!advice.includes('no pet summons or performs labor'));
}
// Armor/wards and fortified reach/damage are isolated native resolver layers.
{
  const g = arena(),
    hero = g.hero;
  hero.hp = hero.maxHp;
  const before = hero.hp,
    amount = 100;
  g.hitParty(hero, amount);
  near(before - hero.hp, Math.max(3, amount - g.armor() * 0.35), 'Native armor formula');
  has(topic(g, 'Steel, wounds and armor')[2], 'max(3, incoming damage − armor × 0.35)');
  hero.hp = hero.maxHp;
  hero.shieldStance = 8;
  hero.shieldRank = 1;
  hero.wardUntil = g.s.time + 5;
  hero.wardReduction = 0.2;
  g.hitParty(hero, amount);
  near(
    hero.maxHp - hero.hp,
    Math.max(3, amount - g.armor() * 0.35) *
      (1 - Math.max(R.heroTactics.paladin.shield.reduction, 0.2)),
    'Stronger defense only',
  );
  const e = g.zone().enemies[0];
  e.ranged = true;
  g.enemyFort = () => null;
  const reach = g.enemyRangedRange(e);
  g.enemyFort = () => ({ id: 'audit-fort' });
  near(g.enemyRangedRange(e) / reach, R.balance.fortifications.rangeMultiplier, 'Fort reach');
  g.tacticalCompressDamage = (e, amount) => amount;
  hero.shieldStance = 0;
  g.admitOpeningHeroAttack(e);
  g.engage(e, true);
  const hp = e.hp;
  g.damage(e, 100, 'hero');
  near(hp - e.hp, 100 * R.balance.fortifications.incomingMultiplier, 'Fort incoming factor');
  const text = topic(g, 'Fortified enemies and covering fire')[1];
  has(text, pc(1 - R.balance.fortifications.incomingMultiplier) + '% less damage');
  has(text, pc(R.balance.fortifications.rangeMultiplier - 1) + '% reach');
}
// Isolate the closed-armor/open-core multipliers from the other layers.
{
  const g = arena();
  g.enemyFort = () => null;
  g.snapshotBossIncomingFactor = () => 1;
  g.tacticalCompressDamage = (e, amount) => amount;
  for (const [family, open, multiplier] of [
    ['citadel', 0, 0.65],
    ['mine', 1, 1.25],
  ]) {
    const e = g.bossEnemy(g.boss(family), 'normal', { x: 700, y: 500 });
    e.aggro = true;
    e.open = open;
    g.zone().enemies = [e];
    g.admitOpeningHeroAttack(e);
    const hp = e.hp;
    g.damage(e, 100);
    near(hp - e.hp, 100 * multiplier, 'Native shell/core multiplier');
    has(topic(g, 'Openings and stubborn defenders')[1], pc(multiplier) + '%');
  }
}
// Automatic combat care has a threshold; manual care does not.
for (const manual of [false, true]) {
  const g = arena(),
    u = g.unit('archer', 520, 500);
  g.s.party = [u];
  g.hero.hp = 0.8 * g.hero.maxHp;
  g.manaCombatActive = () => true;
  if (manual) assert(g.rangerSupport('health', true));
  else g.autoRangerSupport();
  assert.equal(g.hasSupportEffect(g.hero, 'health'), manual);
  has(topic(g, 'A Ranger’s care')[2], 'Automatic healing in combat');
  has(topic(g, 'A Ranger’s care')[2], 'Manual care can treat any wounded living ally');
}
// Every compression tier, the logarithmic tail, shared hit history and opening.
{
  const g = arena(),
    cfg = R.tacticalFoundation.burstCompression;
  const text = topic(g, 'Why a great volley loses force')[2];
  has(text, cfg.windowSeconds + '-second');
  has(text, 'multiplied by ' + cfg.openingMultiplier);
  const roles = {
    ordinary: {},
    guardian: { guard: true },
    ringleader: { form: 'ringleader' },
    captain: { captain: true },
    boss: { type: 'boss' },
    trueBoss: { type: 'boss', form: 'true' },
  };
  for (const [tier, flags] of Object.entries(roles))
    for (const opening of [false, true]) {
      const e = {
        ...g.zone().enemies[0],
        ...flags,
        id: 'curve-' + tier + opening,
        open: opening ? 1 : 0,
      };
      const p = cfg.tiers[tier],
        factor = opening ? cfg.openingMultiplier : 1;
      const knee = e.maxHp * p.knee * factor,
        tail = e.maxHp * p.tail * factor;
      near(g.tacticalCompressDamage(e, knee / 2), knee / 2, 'Below knee unchanged');
      const extra = knee * 2;
      near(
        g.tacticalCompressDamage(e, extra),
        knee + tail * Math.log1p((knee / 2 + extra - knee) / tail) - knee / 2,
        'Native logarithmic shared-hit tail',
      );
      has(text, pc(p.knee) + '% of maximum HP; tail ' + pc(p.tail) + '%');
    }
}
// Native passive factors, ownership/radius/cap gates, healing rate and budget.
{
  const g = arena();
  const p = R.snapshotPassives;
  for (const form of ['normal', 'true'])
    for (const family of ['ridge', 'warlord', 'mine', 'abyss', 'citadel', 'darklord']) {
      const e = g.bossEnemy(g.boss(family), form, { x: 700, y: 500 });
      e.aggro = true;
      g.zone().enemies = [e];
      const text = topic(g, g.boss(family).name)[1];
      if (family === 'ridge' || family === 'warlord') {
        const cfg = p[family],
          ridge = family === 'ridge',
          cap = ridge ? cfg.maxArchers : cfg.maxOrcs;
        const species = ridge ? 'archer' : 'orc',
          each = ridge ? cfg.perArcher[form] : cfg.perOrc[form];
        for (let i = 0; i < cap + 1; i++) {
          const u = g.makeEnemy(
            { species, level: e.level, hp: 100, damage: 1, xp: 0, gold: 0 },
            { x: e.x, y: e.y },
          );
          Object.assign(u, { aggro: true, summon: true, owner: e.id });
          g.zone().enemies.push(u);
        }
        near(
          g.snapshotBossIncomingFactor(e),
          1 - cfg.baseline[form] - cap * each,
          'Capped owned passive',
        );
        has(text, String(cap));
        has(text, String(cfg.radius));
        has(text, pc(each) + '%');
        g.zone().enemies[1].x += cfg.radius + 1;
        // There were cap+1 summons, so one outside still leaves exactly the cap.
        near(g.snapshotBossIncomingFactor(e), 1 - cfg.baseline[form] - cap * each, 'Radius guard');
      } else if (family === 'mine') {
        near(g.snapshotBossIncomingFactor(e), 1 - p.mine.shellReduction[form], 'Closed core');
        e.open = 1;
        near(g.snapshotBossIncomingFactor(e), 1, 'Open core loses shell reduction');
        has(text, pc(p.mine.repairFraction[form]) + '%');
      } else if (family === 'abyss') {
        near(g.snapshotBossIncomingFactor(e), 1 - p.abyss.baseline[form], 'Flight baseline');
        e.passiveAerialUntil = g.s.time + 1;
        near(g.snapshotBossIncomingFactor(e), 1 - p.abyss.reduction[form], 'Flight defense');
        has(text, pc(p.abyss.reduction[form]) + '%');
      } else if (family === 'citadel') {
        near(g.snapshotBossIncomingFactor(e), 1 - p.citadel.baseline[form], 'Regiment baseline');
        e.dressUntil = g.s.time + 1;
        g.zone().enemies.push(
          g.makeEnemy(
            { species: 'crownguard', level: e.level, hp: 100, damage: 1, xp: 0, gold: 0 },
            { x: e.x, y: e.y },
          ),
        );
        near(g.snapshotBossIncomingFactor(e), 1 - p.citadel.reduction[form], 'Guarded formation');
        has(text, pc(p.citadel.reduction[form]) + '%');
      } else {
        for (let i = 0; i < p.darklord.triggerHits; i++) g.snapshotPassiveRecordHit(e, 1, 'hero');
        assert(!e.passiveVeteranUntil, 'With a living companion one source is insufficient');
        g.snapshotPassiveRecordHit(e, 1, g.s.party[0].id);
        near(g.snapshotBossIncomingFactor(e), 1 - p.darklord.reduction[form], 'Veteran defense');
        near(e.passiveVeteranUntil - g.s.time, p.darklord.duration, 'Veteran duration');
        has(text, 'two distinct attackers');
        has(text, pc(p.darklord.reduction[form]) + '%');
      }
    }
  for (const form of ['normal', 'true']) {
    const e = g.bossEnemy(g.boss('cindermaw'), form, { x: 700, y: 500 });
    e.aggro = true;
    e.hp = e.maxHp * 0.1;
    g.zone().enemies = [e];
    const hp = e.hp;
    g.snapshotPassiveRegen(1);
    near(e.hp - hp, e.maxHp * p.cindermaw.soloRegen[form], 'Cindermaw solo rate');
    e.passiveRegenTotal = e.maxHp * p.cindermaw.bossHealCap[form];
    const capped = e.hp;
    g.snapshotPassiveRegen(1);
    near(e.hp, capped, 'Cindermaw lifetime budget');
  }
  const c = { captainProfile: 'supply-vale' };
  near(
    g.regularSlowDuration(c, { captainSkill: true }, 2) / 2,
    R.greenwoodPassives.prolongedExposure.normal,
    'Scornfang regular duration',
  );
  c.captainPhase = true;
  near(
    g.regularSlowDuration(c, { captainSkill: true }, 2) / 2,
    R.greenwoodPassives.prolongedExposure.phase,
    'Scornfang phase duration',
  );
}
// Enemy support timing/amount/HP thresholds; base figures are not scaled totals.
{
  const g = arena(),
    cfg = R.enemySupportHealing;
  const healer = g.zone().enemies[0],
    patient = g.zone().enemies[1];
  healer.ranged = true;
  patient.hp = patient.maxHp * cfg.threshold;
  assert(g.enemySupportHeal(healer));
  near(
    patient.supportHeal.remaining,
    patient.maxHp * cfg.fraction * g.enemyHealMultiplier(healer),
    'Native support amount',
  );
  near(patient.supportHeal.seconds, cfg.duration, 'Support duration');
  near(healer.supportHealCd, cfg.cooldown, 'Support cooldown');
  const text = topic(g, 'Healing in battle')[2];
  for (const fragment of [
    pc(cfg.fraction) + '%',
    cfg.duration + ' seconds',
    cfg.cooldown + 's',
    pc(cfg.threshold) + '%',
    pc(cfg.regroupThreshold) + '%',
  ])
    has(text, fragment);
  const inter = topic(g, 'Interrupted charges')[2];
  for (const fragment of [
    R.chargedSkills.holdSeconds + ' seconds',
    pc(R.chargedSkills.interrupt.hpFraction) + '%',
    R.chargedSkills.interrupt.minimumHp + ' HP',
    R.chargedSkills.interrupt.recoverySeconds + ' seconds',
  ])
    has(inter, fragment);
  for (const [id, cfg] of Object.entries(R.expeditionSupportSkills)) {
    g.s.expeditionSkills ||= {};
    g.s.expeditionSkills[id] = cfg.maxRank;
    near(g.expeditionSupportFraction(id), 1, 'Full inheritance');
    has(
      topic(g, 'Shared lessons and equipment')[2],
      cfg.name + ': Rank ' + cfg.maxRank + '/' + cfg.maxRank + ' passes 100%',
    );
  }
}

// Keep the bilingual audit strict against the actual latest-mechanics output.
{
  const g = arena('mage');
  for (const text of [
    topic(g, 'Slow')[1],
    topic(g, 'Slow')[2],
    catalog(g).find((s) => s.title === 'Your skills').topics[1][1],
  ]) {
    const es = A.translateArchive(text, A.translationNames(g, { D, R }));
    assert.deepEqual(es.match(/\d+(?:\.\d+)?/g), text.match(/\d+(?:\.\d+)?/g));
    assert(
      !/first Slow hit|stack penalty|eligible recovering|fresh hit|slow one foe/.test(es),
      'Complete Spanish mechanics text',
    );
  }
}
console.log(
  'PASS Archive mechanics audit: ' +
    casts +
    ' native casts, Slow/debt, 11 bosses/22 pets, recovery gates, rewards and bilingual figures against ' +
    root,
);
