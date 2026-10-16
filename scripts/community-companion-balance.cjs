'use strict';
// AUTHORED, NOT RUN. Explicitly authorized overnight observation only.
// Usage: node scripts/community-companion-balance.cjs <exact-308-checkout> [output.json]
// Both engines run the SAME fixture/policy below. No production flag or AI change.
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto');
const baselineSha = '6bc27be31792b1c38147d61e98ceed6acf3e2560';
const root = path.resolve(__dirname, '..');
const rng = (seed) => {
  let value = seed >>> 0;
  return () => (value = (1664525 * value + 1013904223) >>> 0) / 4294967296;
};
function cases() {
  const out = [];
  for (const cls of ['paladin', 'mage', 'ranger'])
    for (const mode of ['normal', 'nightmare'])
      for (const region of ['highlands', 'frontier', 'crown'])
        for (const investment of ['low', 'trained'])
          for (const seed of [113, 271])
            for (const party of [
              'solo',
              'troops-2',
              'troops-4',
              'troops-6',
              'mixed-4',
              'mixed-6',
              'pets-0',
              'pets-4',
              'pets-8',
            ])
              for (const encounter of [
                'pack-1',
                'pack-3',
                'pack-5',
                'pack-8',
                'pack-12',
                'captain',
                'field-normal',
                'field-true',
                'dungeon-normal',
                'dungeon-true',
                'final-normal',
                'final-true',
              ]) {
                if (encounter.startsWith('final') && region !== 'crown') continue;
                out.push({ cls, mode, region, investment, seed, party, encounter });
              }
  return out;
}
function trial(C, c) {
  const regionIndex = ['highlands', 'frontier', 'crown'].indexOf(c.region),
    level = [9, 12, 16][regionIndex],
    trained = c.investment === 'trained';
  const g = new C(c.mode, c.cls, rng(c.seed)),
    h = g.hero;
  h.level = level;
  h.talents = trained ? [2, 2, 2, 1] : [0, 0, 0, 0];
  h.maxHp =
    C.classes[c.cls].hp +
    (level - 1) * C.rules.balance.growth.hpPerLevel +
    h.talents[2] * g.talentProfile().hp;
  h.hp = h.maxHp;
  h.mp = h.maxMp;
  h.weapon = h.armorTier = trained ? [2, 3, 4][regionIndex] : [1, 2, 3][regionIndex];
  const curriculum = C.rules.teachers[['ridge', 'warlord', 'citadel'][regionIndex]];
  h.skills = Array.from({ length: 8 }, (_, i) =>
    curriculum.train.includes(i + 1) ? (trained ? curriculum.maxRank : 1) : 0,
  );
  g.s.companionCombatTraining = 2;
  g.s.companionVitalityRank = trained ? 3 : 0;
  g.s.expeditionSkills = {
    sharedTraining: trained ? [3, 4, 5][regionIndex] : 0,
    sharedStrength: trained ? [2, 3, 4][regionIndex] : 0,
  };
  // Six-unit Highlands/Frontier rows are labelled cap-stress, not natural progression.
  const size =
    c.party === 'solo' ? 0 : c.party.startsWith('pets') ? 6 : Number(c.party.split('-')[1]);
  g.s.expeditionRank = Math.max([4, 5, 6][regionIndex], size === 6 ? 6 : size === 4 ? 4 : 1);
  const boss = C.data.bosses.find(
    (b) =>
      b.region === c.region &&
      b.kind ===
        (c.encounter.startsWith('final')
          ? 'final'
          : c.encounter.startsWith('dungeon')
            ? 'dungeon'
            : 'field'),
  );
  g.enter(
    c.encounter === 'captain' && c.region !== 'frontier'
      ? 'supply-' + c.region
      : c.encounter.startsWith('dungeon')
        ? boss.id
        : c.region,
  );
  const z = g.zone();
  let targets;
  if (c.encounter.includes('normal') || c.encounter.includes('true')) {
    const original = z.enemies.find((e) => e.type === 'boss' && e.family === boss.id);
    if (!original && boss.kind === 'dungeon')
      throw Error('Missing authored dungeon boss ' + boss.id);
    const form = c.encounter.endsWith('true') ? 'true' : 'normal';
    if (form === 'true') {
      g.s.phase = 'awakening';
      g.s.awakeningLevel = level + 2;
    }
    targets = [
      g.bossEnemy(boss, form, original?.home || g.safe(...C.data.fields[regionIndex + 2])),
    ];
    if (boss.id === 'cindermaw') targets.push(...z.enemies.filter((e) => e.veraEscort));
  } else if (c.encounter === 'captain') {
    const captain = z.enemies.find((e) => e.captain || e.roomCaptain);
    if (!captain) throw Error('No authored captain for ' + c.region);
    // Retain this captain's native formation; its authored AI and mechanics run normally.
    targets = z.enemies.filter((e) => e === captain || (captain.pack && e.pack === captain.pack));
  } else {
    const natives = z.enemies.filter(
      (e) =>
        e.type === 'mob' &&
        e.form === 'normal' &&
        !e.guard &&
        !e.captain &&
        !e.summon &&
        !e.veraEscort &&
        !e.nightOnly &&
        !e.mini &&
        !e.strongholdResident,
    );
    const blueprints = [
      ...new Map(
        natives.map((e) => [e.species + ':' + !!e.ranged + ':' + !!e.mountedCrownRider, e]),
      ).values(),
    ];
    if (!blueprints.length) throw Error('No native pack source for ' + c.region);
    const home = blueprints[0].home;
    // Retain factory-authored role/weapon/mount fields, not only species and HP.
    // A generic makeEnemy call would silently turn native ranged troops into melee.
    targets = Array.from({ length: Number(c.encounter.split('-')[1]) }, (_, i) => {
      const e = JSON.parse(JSON.stringify(blueprints[i % blueprints.length])),
        p = g.safe(home.x + (i % 4) * 36, home.y + Math.floor(i / 4) * 38);
      Object.assign(e, {
        id: 'enemy-' + g.s.nextId++,
        x: p.x,
        y: p.y,
        home: { ...p },
        pack: 'community-audit-pack',
        aggro: false,
        gold: 0,
        xp: 0,
      });
      return e;
    });
  }
  z.enemies = targets;
  // Keep authored captives, workstations and boss entourage dependencies. Only
  // refuge services are removed to avoid automatic town healing in this trial.
  z.npcs = z.npcs.filter((n) => !['rest', 'supplier', 'recruiter', 'quests'].includes(n.kind));
  z.buildings = [];
  z.nodes = [];
  g.s.quests = {};
  g.s.mercyTime = 0;
  Object.assign(h, g.safe(targets[0].x - (c.cls === 'paladin' ? 85 : 190), targets[0].y));
  // The Sovereign unlocks AFTER TRUE Dark Lord, so it cannot take part in that
  // first-victory fight. It remains covered in postgame-return pack/boss trials.
  const families = C.data.bosses
      .filter((b) => !(c.encounter.startsWith('final') && b.id === 'darklord'))
      .map((b) => b.id),
    offset = c.party.startsWith('pets') ? Number(c.party.split('-')[1]) : c.seed % families.length;
  g.s.party = Array.from({ length: size }, (_, i) => {
    const isPet = c.party.startsWith('pets') || (c.party.startsWith('mixed') && i >= 2);
    const family = families[(offset + i) % families.length];
    if (isPet) g.s.normal[family] = g.s.true[family] = true;
    return g.unit(
      isPet ? 'pet' : i % 2 ? 'archer' : 'soldier',
      h.x - 20,
      h.y + i * 12,
      isPet ? family : null,
    );
  });
  g.syncCompanionLevelStats();
  // Identical encounter isolation in both versions, matching the earlier balance study.
  g.updateNight = g.updatePacks = g.updateGuardianReinforcements = g.updateElites = () => {};
  g.xp = () => {};
  g.enemyVfxEnabled = false;
  const units = g.s.party.slice(),
    telemetry = new Map(
      units.map((u) => [
        u.id,
        {
          type: u.type,
          family: u.petFamily || null,
          maxHp: u.maxHp,
          armor: g.companionArmor(u.type),
          damage: 0,
          received: 0,
          healing: 0,
          first: 0,
          second: 0,
          holds: 0,
          interrupted: 0,
          immuneSeconds: 0,
          wardSeconds: 0,
          movementDistance: 0,
          movingWithoutCastSeconds: 0,
          deathAt: null,
          targetSamples: {},
        },
      ]),
    );
  let heroDamage = 0,
    seconds = 0,
    pending = null;
  const record = g.tacticalRecordHit,
    hit = g.hitParty,
    event = g.event;
  g.tacticalRecordHit = function (e, source, amount) {
    if (source === 'hero') heroDamage += amount;
    if (telemetry.has(source)) telemetry.get(source).damage += amount;
    return record.call(this, e, source, amount);
  };
  g.hitParty = function (u, ...args) {
    const hp = u.hp,
      result = hit.call(this, u, ...args),
      t = telemetry.get(u.id);
    if (t) t.received += Math.max(0, hp - u.hp);
    return result;
  };
  g.event = function (type, detail = {}) {
    const t = telemetry.get(type === 'chargeInterrupted' ? detail.target : detail.source);
    if (t) {
      if (
        (type === 'petSkill' && detail.slot === 1) ||
        (type === 'companionSkill' && ['power-strike', 'triple-shot'].includes(detail.skill))
      )
        t.first++;
      if (
        (type === 'petSkill' && detail.slot === 2) ||
        (type === 'companionSkill' && ['holy-cleave', 'piercing-volley'].includes(detail.skill))
      )
        t.second++;
      if (type === 'companionChargeStart') t.holds++;
      if (type === 'chargeInterrupted') t.interrupted++;
    }
    return event.call(this, type, detail);
  };
  // Measure positive HP changes at each healing owner, avoiding net-tick healing estimates.
  for (const method of ['cast', 'updateRangerSupport', ...(g.usePetSkill ? ['usePetSkill'] : [])]) {
    const original = g[method];
    g[method] = function (...args) {
      const hp = units.map((u) => u.hp),
        result = original.apply(this, args);
      units.forEach((u, i) => {
        telemetry.get(u.id).healing += Math.max(0, u.hp - hp[i]);
      });
      return result;
    };
  }
  g.engage(targets[0]);
  g.manualHeroTargetId = targets[0].id;
  const enemyOpening = targets.map((e) => ({
    species: e.species,
    level: e.level,
    ranged: !!e.ranged,
    mounted: !!e.mountedCrownRider,
    hp: e.hp,
    damage: e.damage,
  }));
  for (
    let step = 0;
    step < 900 && !g.s.statistics.deaths && targets.some((e) => e.hp > 0);
    step++
  ) {
    const target = targets.find((e) => e.hp > 0),
      warning = z.enemies.find((e) => e.telegraph || e.motion);
    if (pending) {
      const cast = g.partyChargeState(h);
      if (!cast || cast.interrupted) {
        g.clearPartyCharge(h);
        pending = null;
      } else if (g.partyChargeProgress(h) >= 1 - 1e-9) {
        g.cast(pending.slot, pending.target, true);
        g.clearPartyCharge(h);
        pending = null;
      }
    }
    if (!pending)
      for (const slot of [8, 7, 6, 5, 4, 3, 2, 1]) {
        if (!h.skills[slot - 1] || h.cd[slot - 1] > 0) continue;
        if (
          slot === 3 &&
          h.hp > h.maxHp * 0.65 &&
          !units.some((u) => u.hp > 0 && u.hp < u.maxHp * 0.6)
        )
          continue;
        const charged = slot === 2 && z.enemies.filter((e) => e.hp > 0).length >= 3;
        if (charged && g.beginPartyCharge(h, slot)) {
          pending = { slot, target: target.id };
          break;
        }
        if (!charged && g.cast(slot, target.id)) break;
      }
    if (warning) {
      const angle = Math.atan2(h.y - warning.y, h.x - warning.x) + 1.6;
      h.order = {
        type: 'move',
        ...g.safe(warning.x + Math.cos(angle) * 260, warning.y + Math.sin(angle) * 260),
      };
    } else h.order = { type: 'attack', id: target.id };
    const before = units.map((u) => ({
      x: u.x,
      y: u.y,
      hp: u.hp,
      casts: telemetry.get(u.id).first + telemetry.get(u.id).second,
    }));
    g.tick(0.1);
    seconds += 0.1;
    units.forEach((u, i) => {
      const t = telemetry.get(u.id),
        prev = before[i];
      if (prev.hp <= 0) return;
      const distance = Math.hypot(u.x - prev.x, u.y - prev.y);
      t.movementDistance += distance;
      if (distance > 0.01 && t.first + t.second === prev.casts && !g.partyChargeState(u))
        t.movingWithoutCastSeconds += 0.1;
      if (u.immune > 0) t.immuneSeconds += 0.1;
      if ((u.wardUntil || 0) > g.s.time) t.wardSeconds += 0.1;
      if (u.hp <= 0 && t.deathAt === null) t.deathAt = seconds;
      const aim = g._tacticalPartyTargets?.get(u.id);
      if (aim) t.targetSamples[aim] = (t.targetSamples[aim] || 0) + 1;
    });
    g.effects = [];
    g.notices = [];
    g.messages = [];
  }
  return {
    ...c,
    level,
    expeditionRank: g.s.expeditionRank,
    capStress: size === 6 && c.region !== 'crown',
    enemyOpening,
    seconds,
    won: targets.every((e) => e.hp <= 0),
    heroDied: !!g.s.statistics.deaths,
    heroDamage,
    heroHp: h.hp / h.maxHp,
    remaining: targets.reduce((sum, e) => sum + Math.max(0, e.hp), 0),
    units: units.map((u) => ({
      ...telemetry.get(u.id),
      hp: u.hp,
      survived: u.hp > 0,
      healRecovery: u.healCd || 0,
      manaRecovery: u.manaCd || 0,
      survivalRecovery: u.survivalCd || 0,
    })),
  };
}
function sources(dir) {
  return Object.fromEntries(
    [
      'engine',
      'combat',
      'hero-combat',
      'party',
      'party-pets',
      'rules',
      'progression',
      'boss-combat',
      'cindermaw-combat',
      'dreadmaw-combat',
      'navigation',
      'world',
      'data',
    ].flatMap((name) => {
      const file = 'src/prototype/' + name + '.js',
        full = path.join(dir, file);
      return fs.existsSync(full)
        ? [[file, crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex')]]
        : [];
    }),
  );
}
module.exports = { cases, trial };
if (require.main === module) {
  const baselineRoot = path.resolve(process.argv[2] || 'MISSING-AUTHORIZED-308-CHECKOUT');
  // Exact source provenance is mandatory. Export this receipt during authorized checkout preparation.
  if (
    fs.readFileSync(path.join(baselineRoot, 'community-baseline-commit.txt'), 'utf8').trim() !==
    baselineSha
  )
    throw Error('Wrong baseline receipt');
  const before = require(path.join(baselineRoot, 'src/prototype/engine.js'));
  const candidate = require('../src/prototype/engine.js');
  const [shard, shards] = (process.env.COMMUNITY_BALANCE_SHARD || '0/1').split('/').map(Number);
  if (
    !Number.isInteger(shard) ||
    !Number.isInteger(shards) ||
    shards < 1 ||
    shard < 0 ||
    shard >= shards
  )
    throw Error('Invalid shard');
  const rows = cases()
    .filter((_, i) => i % shards === shard)
    .map((c) => ({
      configuration: c,
      baseline: c.party === 'solo' || c.party.startsWith('troops') ? trial(before, c) : null,
      candidate: trial(candidate, c),
      comparison:
        c.party === 'solo' || c.party.startsWith('troops')
          ? 'matched identical configuration'
          : 'candidate-only; compare equal-slot troop rows, never nonexistent baseline pets',
    }));
  const output = process.argv[3] || 'test-results/community-companion-balance.json';
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(
    output,
    JSON.stringify(
      {
        baselineSha,
        harnessSha256: crypto
          .createHash('sha256')
          .update(fs.readFileSync(__filename))
          .digest('hex'),
        shard,
        shards,
        sources: { baseline: sources(baselineRoot), candidate: sources(root) },
        limits:
          'Seeded 90-second scripted encounters; no human or physical-device acceptance. Deaths/failures retained; no invented balance pass threshold. Enemy combat/AI unchanged. High early-region cap rows are explicit stress fixtures. Moving-without-cast is observed motion, not a claim that every moving frame is wasted.',
        rows,
      },
      (key, value) => {
        if (typeof value === 'number' && !Number.isFinite(value))
          throw Error('Nonfinite balance telemetry: ' + key);
        return value;
      },
      2,
    ) + '\n',
  );
  console.log('Recorded', rows.length, 'Community balance observations; interpretation required');
}
