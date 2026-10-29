/* Deterministic campaign rules, independent of the browser and renderer. */
(function (root) {
  'use strict';
  const R = typeof PrototypeRules !== 'undefined' ? PrototypeRules : require('./rules.js');
  const D = typeof PrototypeData !== 'undefined' ? PrototypeData : require('./data.js');
  const AuthorCopy = (
    typeof PrototypeNarration !== 'undefined' ? PrototypeNarration : require('./narration.js')
  ).approved;
  const clone = (x) => JSON.parse(JSON.stringify(x)),
    clamp = (n, a, b) => Math.max(a, Math.min(b, n)),
    dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const classes = R.balance.classes;
  // Fail closed when future classes are registered without an authored
  // starting party or chase profile. Nothing here makes Rogue playable.
  const classStartingCompanions = Object.freeze({
    paladin: Object.freeze(['soldier', 'archer']),
    mage: Object.freeze(['soldier', 'archer']),
    ranger: Object.freeze(['soldier', 'archer']),
    rogue: Object.freeze([]),
  });
  const basicAttackApproachRanges = Object.freeze({
    paladin: 105,
    mage: 350,
    ranger: 350,
    rogue: R.rogueHeroFoundation.basic.range, // Dormant until class admission is authorized.
  });

  const talentMaxRanks = R.balance.disciplines.maxRanks;
  // Rounded from the level-1 class stat ratios: talent growth reinforces each class's natural strengths while keeping the old average power budget.
  const talentProfiles = R.balance.disciplines.profiles;
  const legacyWeapons = {
    'Espada de Cruzado': 10,
    'Bastón de Escarcha': 10,
    'Arco de Exploradora': 10,
    'Martillo del Juicio': 18,
    'Arma de la Frontera': 40,
    'Arma de las Cumbres': 70,
  };
  const ceilings = R.balance.instructors.skillCeilings;
  const expeditionCeilings = R.balance.instructors.expeditionCeilings;
  const dungeonIds = D.bosses.filter((b) => b.kind === 'dungeon').map((b) => b.id);

  const pursuitBurstSeconds = R.balance.pursuit.burstSeconds,
    pursuitBurstMultiplier = R.balance.pursuit.burstMultiplier,
    mercyStartRadius = R.balance.pursuit.mercyStartRadius;
  // Civilian restoration routes are runtime-only; only the worker's position saves.
  const archiveRestorationTrips = new WeakMap();
  // No tactical search frontier is serialized or allowed to grant a regroup.
  const tacticalRogueRouteSearches = new WeakMap();
  // Per-caster leader-heal cadence is independent of buffed ordinary casts.
  // Runtime-only WeakMap: no additional fields on saved enemy actors.
  const enemyLeaderHealRecovery = new WeakMap();
  // The independent captain self-heal cooldown must survive this pilot.
  const captainSelfHealRecovery = new WeakMap();
  const archiveRepairSites = [
    { x: 1130, y: 560 },
    { x: 790, y: 430 },
    { x: 480, y: 650 },
    { x: 530, y: 850 },
    { x: 700, y: 1180 },
    { x: 1030, y: 945 },
  ];
  class Campaign {
    constructor(mode = 'normal', heroClass = 'paladin', random = Math.random, options = {}) {
      if (!['normal', 'nightmare', 'developer', 'arena'].includes(mode) || !classes[heroClass])
        throw Error('Unknown mode or class');
      this.random = random;
      this.formationHeading = { x: 0, y: 1 };
      this.messages = [];
      this.effects = [];
      this.notices = [];
      this.noticeId = 0;
      this.noticeVisit = 0;
      this.noticeHistory = [];
      this.basicComboStep = 0;
      this.basicComboAt = -1e9;
      this.basicComboClass = heroClass;
      this.basicComboTargetId = null;
      // Non-persistent test telemetry must not alter ordinary campaign state.
      if (mode === 'developer') {
        this.developerCombat = { incoming: [], outgoing: [], startedAt: 0 };
      }
      this.s = {
        version: 4,
        mode,
        phase: 'adventure',
        clock: 0,
        nightmareIntroRemaining: mode === 'nightmare' ? R.dayCycle.twilightSeconds : 0,
        victoryDawnRemaining: 0,
        time: 0,
        mercyTime: 10,
        restCooldown: 0,
        thornHeroInitiated: false,
        valeFieldAwakened: false,
        zone: mode === 'arena' ? 'arena' : 'vale',
        refuge: 'vale',
        nextId: 1,
        manaBalanceVersion: 1,
        talentBalanceVersion: 1,
        heroPassiveVersion: 1,
        normal: {},
        true: {},
        fieldBossKills: {},
        earlyRoll: {},
        pending: {},
        origins: {},
        late: {},
        victories: {},
        rescued: {},
        keys: {},
        paid: {},
        tickets: {},
        recovery: {},
        treasuryRecovery: {},
        quests: {},
        discovered: {},
        // Earned optional manuals are permanent campaign knowledge, not items.
        // Crit chance stays OFF without an explicit native Party session.
        criticalCodices: {},
        // Independent, save-safe nickname rotation for automated Rogue captures.
        rogueNicknameCursor: { en: 0, es: 0 },
        gathered: {},
        tributeRemainder: 0,
        gatheringTarget: null,
        resourceExpeditions: [],
        recruitmentRequest: null,
        companionCareRequests: { recovery: null, treatment: null },
        fountains: {},
        zones: {},
        loot: [],
        projectiles: [],
        hazards: [],
        streak: { key: null, count: 0 },
        endingAck: false,
        awakeningAck: false,
        throneClaimed: false,
        finalRestCompleted: false,
        appointments: {},
        expeditionRank: 1,
        expeditionSkills: { sharedTraining: 0, sharedStrength: 0 },
        expeditionSupportVersion: 2,
        companionVitalityRank: 0,
        companionCombatTraining: 1,
        rangerSupport: { heal: 1, mana: 1 },
        squadDoctrine: heroClass === 'paladin' ? 'focus' : 'guard',
        squadEngagement: null,
        squadBoss: false,
        heroTarget: null,
        statistics: {
          kills: 0,
          deaths: 0,
          goldEarned: 0,
          suppliesUsed: 0,
          bossSeconds: {},
          events: [],
        },
      };
      const c = classes[heroClass];
      const innateHp =
        heroClass === 'paladin' ? R.balance.classPassives.paladin.hpPerLevel : 0;
      this.s.hero = {
        class: heroClass,
        x: 300,
        y: 350,
        hp: c.hp + innateHp,
        maxHp: c.hp + innateHp,
        mp: c.mp,
        maxMp: c.mp,
        level: 1,
        xp: 0,
        gold: R.balance.economy.startingCrowns,
        power: c.power,
        armor: c.armor,
        speed: c.speed,
        skills: [1, 0, 0, 0, 0, 0, 0, 0],
        cd: Array(8).fill(0),
        chargedCd: Array(8).fill(0),
        basicCd: 0,
        immune: 0,
        haste: 0,
        weapon: 0,
        armorTier: 0,
        reforges: {},
        potions: { health: 0, mana: 0, greater_health: 0, greater_mana: 0 },
        tonic: false,
        tonicStock: 0,
        weaponSelection: null,
        potionCd: 0,
        slow: 0,
        supportEffects: [],
        talents: [0, 0, 0, 0],
        talentPoints: 0,
        freeTalentResets: 2,
      };
      this.s.challenge = {
        succession: options.succession === true,
        fallen: [],
        pending: false,
        gameOver: false,
      };
      if (mode !== 'arena') this.initializeQuests();
      const starterTypes = classStartingCompanions[heroClass];
      if (!starterTypes) throw Error('Missing starting company for hero class');
      this.s.party = starterTypes.map((type, i) =>
        this.unit(type, i === 0 ? 260 : 350, i === 0 ? 390 : 380),
      );
      if (mode === 'arena') {
        this.s.arenaStage = 'hub';
        this.s.arenaRegion = 0;
        this.s.rescued = Object.fromEntries(D.bosses.map((boss) => [boss.id, true]));
        this.s.expeditionRank = 4;
        // Skills are earned through the real instructors in the arena hub.
        // The normal class-specific starting basic attack remains learned.
        this.hero.gold = 50000000;
        this.hero.x = 650;
        this.hero.y = 1070;
        this.s.party.forEach((unit, i) => {
          unit.x = 600 + i * 110;
          unit.y = 1170;
        });
      }
      this.zone();
    }
    get hero() {
      return this.s.hero;
    }
    get zoneId() {
      return this.s.zone;
    }
    get peace() {
      return this.s.phase === 'peace';
    }
    regionIndex(id = this.s.zone) {
      if (this.s.mode === 'arena' && id === 'arena')
        return this.s.arenaRegion ?? 0;
      const boss = D.bosses.find((b) => b.id === id),
        room = R.supplyRooms.find((r) => r.id === id),
        side = R.sideDungeons?.find((r) => r.id === id);
      return D.regions.findIndex(
        (r) => r.id === (boss?.region || room?.region || side?.region || id),
      );
    }
    definition() {
      return D.regions[this.regionIndex()];
    }
    fieldCenter(index = this.regionIndex()) {
      const p = R.fieldBossCenters?.[index] || D.fields[index];
      return { x: p[0], y: p[1] };
    }
    supplyRoom(id = this.s.zone) {
      return R.supplyRooms.find((r) => r.id === id);
    }
    sideDungeon(id = this.s.zone) {
      return R.sideDungeons?.find((r) => r.id === id);
    }
    zoneSize(id = this.s.zone) {
      if (this.s.mode === 'arena' && id === 'arena') return 2400;
      const room = this.supplyRoom(id),
        side = this.sideDungeon(id);
      return room
        ? room.size || 900
        : side
          ? side.size || 1100
          : dungeonIds.includes(id)
            ? R.dungeonSpace?.[id]?.size || 1500
            : D.regions[this.regionIndex(id)]?.size;
    }
    isDungeon() {
      if (this.s.mode === 'arena') return false;
      return dungeonIds.includes(this.s.zone) || !!this.supplyRoom() || !!this.sideDungeon();
    }
    night() {
      if (this.s.mode === 'arena') return false;
      if (!this.peace && this.s.mode === 'nightmare') return !(this.s.nightmareIntroRemaining > 0);
      return this.s.clock % R.dayCycle.seconds >= R.dayCycle.nightAt;
    }
    daylightPhase() {
      if (this.s.mode === 'arena')
        return { phase: 'day', progress: 1, darkness: 0, warmth: 0 };
      const cfg = R.dayCycle,
        span = cfg.twilightSeconds;
      let phase, progress;
      if (this.peace && this.s.victoryDawnRemaining > 0) {
        phase = 'victory-sunrise';
        progress = 1 - this.s.victoryDawnRemaining / span;
      } else if (!this.peace && this.s.mode === 'nightmare') {
        if (!(this.s.nightmareIntroRemaining > 0))
          return { phase: 'night', progress: 1, darkness: 1, warmth: 0 };
        phase = 'sunset';
        progress = 1 - this.s.nightmareIntroRemaining / span;
      } else {
        const time = this.s.clock % cfg.seconds;
        if (time >= cfg.seconds - span) {
          phase = 'sunrise';
          progress = (time - cfg.seconds + span) / span;
        } else if (time >= cfg.nightAt)
          return { phase: 'night', progress: 1, darkness: 1, warmth: 0 };
        else if (time >= cfg.nightAt - span) {
          phase = 'sunset';
          progress = (time - cfg.nightAt + span) / span;
        } else return { phase: 'day', progress: 1, darkness: 0, warmth: 0 };
      }
      progress = clamp(progress, 0, 1);
      const smooth = progress * progress * (3 - 2 * progress);
      return {
        phase,
        progress,
        darkness: phase === 'sunset' ? smooth : 1 - smooth,
        warmth: Math.sin(Math.PI * progress),
      };
    }
    advanceDaylight(dt) {
      const cfg = R.dayCycle;
      if (!this.peace && this.s.mode === 'nightmare') {
        if (this.s.nightmareIntroRemaining > 0) {
          this.s.nightmareIntroRemaining = Math.max(0, this.s.nightmareIntroRemaining - dt);
          if (this.s.nightmareIntroRemaining < 1e-9) {
            this.s.nightmareIntroRemaining = 0;
            // Only the one-time Nightmare grace boundary refreshes engaged
            // combat. Ordinary day/night encounter locking remains unchanged.
            const m = this.multipliers();
            for (const z of Object.values(this.s.zones))
              for (const e of z.enemies) {
                if (
                  !(e.hp > 0) ||
                  !e.aggro ||
                  e.neutral ||
                  e.eliteNightBonus ||
                  !(e.baseHp > 0) ||
                  !Number.isFinite(e.baseDamage)
                )
                  continue;
                const fraction = e.hp / e.maxHp;
                e.maxHp = e.baseHp * m.hp;
                e.hp = e.maxHp * fraction;
                e.damage = e.baseDamage * m.damage;
              }
          }
        }
        return;
      }
      this.s.clock = (this.s.clock + dt) % cfg.seconds;
      if (this.peace && this.s.victoryDawnRemaining > 0) {
        this.s.victoryDawnRemaining = Math.max(0, this.s.victoryDawnRemaining - dt);
        if (this.s.victoryDawnRemaining < 1e-9) {
          this.s.victoryDawnRemaining = 0;
          this.s.clock = 0;
        }
      }
    }
    nightPoints() {
      const count = (obj) =>
        Object.keys(obj || {}).filter(
          (key) => key.split(':')[0] !== 'darklord' && key !== 'darklord',
        ).length;
      return this.s.mode === 'nightmare'
        ? count(this.s.victories)
        : count(this.s.normal) + count(this.s.true);
    }
    multipliers() {
      const n = this.nightPoints();
      return this.night() && !this.peace
        ? { hp: 1.1 + 0.03 * n, damage: 1.15 + 0.02 * n }
        : { hp: 1, damage: 1 };
    }
    mountedMovementFactor(e) {
      return e.mountedCrownRider ? R.balance.mountedMovementMultiplier : 1;
    }
    nightTempo() {
      if (!this.night() || this.peace) return 1;
      const cfg = R.balance.nightTempo;
      return 1 + Math.min(cfg.maxBonus, cfg.baseBonus + cfg.perVictoryBonus * this.nightPoints());
    }
    // Authoritative enemy support healing. Only actual ranged ordinary roles,
    // authored ranged-aligned captains and the explicitly selected bosses qualify.
    enemyHealProfile(e) {
      const cfg = R.enemySupportHealing;
      if (!cfg || !e || e.neutral || e.hp <= 0) return null;
      if (e.type === 'boss') return cfg.bosses[e.family] || null;
      if (e.captain || e.roomCaptain) return cfg.captains[e.captainProfile] || null;
      return e.ranged ? cfg.species[e.species] || null : null;
    }
    enemyHealMultiplier(e) {
      // Mirror the damage *escalation layers* that apply to this actor, not
      // individual attack coefficients or its absolute attack value.
      // Population modifiers already included in baseDamage are deliberately
      // reconstructed once for healing; e.damage/baseDamage contributes only
      // the encounter's live/frozen nighttime or owner-inherited factor.
      const i = Math.max(0, this.regionIndex()),
        region =
          e.type === 'boss' || e.nightOnly
            ? 1
            : e.awakenedGuard
              ? R.awakenedGuardianScaling.damage
              : e.summon && !e.developerSummon
                ? R.summonScaling[i]?.damage || 1
                : e.guard
                  ? R.guardianScaling[i]?.damage || 1
                  : e.fieldCaptain
                    ? R.ordinaryMeleeScaling[i]?.damage || 1
                    : // Ordinary ranged population scaling is deliberately
                      // absent inside main boss dungeons and Treasury rooms.
                      // Apply the same exclusion here, or support healing would
                      // secretly gain a region multiplier that damage lacks.
                      dungeonIds.includes(this.zoneId) || this.supplyRoom()
                      ? 1
                      : R.ordinaryRangedScaling[i]?.damage || 1;
      let factor = region;
      if (e.form === 'ringleader') factor *= R.ringleaderScaling.damage;
      // TRUE boss minions have a distinct 1.25 role budget; TRUE captains
      // already use the Ringleader's 1.50 factor above.
      if (e.trueSummon && e.trueSummonRole === 'minion')
        factor *= R.trueBossSummons.minionScaling.damage;
      // Night-exclusive monster strength is separate from global nightPoints;
      // it is already baked into baseDamage for these spawned species.
      if (e.nightOnly) factor *= R.nightEnemyCombat[e.species]?.damage || 1;
      if (e.type === 'boss' && e.form === 'true') {
        const normalDamage = D.bosses.find((b) => b.id === e.family)?.damage;
        if (normalDamage > 0) factor *= e.baseDamage / normalDamage;
      }
      const encounter = e.baseDamage > 0 ? e.damage / e.baseDamage : 1;
      factor *= Number.isFinite(encounter) && encounter > 0 ? encounter : 1;
      return Number.isFinite(factor) && factor > 0 ? factor : 1;
    }
    enemyHealingActor(u) {
      // "Enemy" is relative to the player, never relative to the healer.
      // Player actors remain ineligible even if a malformed roster contains them.
      return !!(
        u &&
        (u.type === 'mob' || u.type === 'boss') &&
        u.hp > 0 &&
        !u.neutral &&
        u !== this.hero &&
        !this.s.party.includes(u) &&
        this.s.zones[this.zoneId]?.enemies.includes(u)
      );
    }
    enemyHealTeammate(e, u) {
      // The Dark Lord's faction is mechanically allied across species, packs,
      // guard posts and commanders. Local range, LoS, health and hostile status
      // are checked by the support cast itself, not by formation membership.
      return !!(this.enemyHealingActor(e) && this.enemyHealingActor(u) && u !== e && !u.returning);
    }
    enemyHealLeader(u) {
      return !!(u && (u.type === 'boss' || u.captain || u.roomCaptain || u.fieldCaptain));
    }
    enemyNeedsSupportHeal(u, healer = null) {
      const cfg = R.enemySupportHealing;
      // A wounded ordinary monster is an eligible patient for any ordinary
      // ranged healer, including one from a different species or pack.
      // Bosses/captains keep their original 75% / regroup 90% threshold.
      if (
        healer &&
        !this.enemyHealLeader(u) &&
        (!this.enemyHealLeader(healer) ||
          (healer.type !== 'boss' && (healer.captain || healer.roomCaptain)))
      )
        return u.hp > 0 && u.maxHp > 0 && u.hp < u.maxHp;
      if (healer && healer.type !== 'boss' && u.type !== 'boss' && this.enemyHealLeader(u))
        return u.hp > 0 && u.hp / u.maxHp <= cfg.captain.threshold;
      return (
        u.hp / u.maxHp <= (this.tacticalRogueRegroup(u) ? cfg.regroupThreshold : cfg.threshold)
      );
    }
    enemySupportHeal(e) {
      const cfg = R.enemySupportHealing,
        skill = this.enemyHealProfile(e),
        captainHealer = !!(skill && e && e.type !== 'boss' && (e.captain || e.roomCaptain)),
        ordinaryHealer = !this.enemyHealLeader(e),
        allyReady = (e?.supportHealCd || 0) <= 0,
        selfReady = !captainHealer || (captainSelfHealRecovery.get(e) || 0) <= 0,
        // Leader eligibility is a separate ten-second clock for every caster.
        // The short ordinary-ally cast never refreshes another leader early.
        leaderRecovery =
          ordinaryHealer || captainHealer ? enemyLeaderHealRecovery.get(e) || 0 : 0;
      if (
        !skill ||
        !this.enemyHealingActor(e) ||
        this.mageSilenceActive(e) ||
        this.peace ||
        e.returning ||
        e.motion ||
        e.telegraph ||
        e.rangedAim ||
        (!captainHealer && !allyReady) ||
        (captainHealer && !allyReady && !selfReady)
      )
        return false;
      const inReach = (u) =>
          u.hp > 0 &&
          u.hp < u.maxHp &&
          !u.supportHeal &&
          dist(e, u) <= cfg.range &&
          (e === u || this.line(e, u)),
        injured = allyReady
          ? this.zone().enemies.filter(
              (u) =>
                this.enemyHealTeammate(e, u) &&
                inReach(u) &&
                this.enemyNeedsSupportHeal(u, e) &&
                !((ordinaryHealer || captainHealer) && this.enemyHealLeader(u) && leaderRecovery > 0),
            )
          : [],
        // Existing boss self-recovery, vitality siphon and mud recovery remain
        // authoritative: support must never duplicate them.
        establishedBossRecovery =
          e.type === 'boss' &&
          (Boolean(R.bossRecovery[e.family]) ||
            R.vitalitySiphon.bossFamilies.includes(e.family) ||
            e.family === 'mire'),
        selfAllowed =
          (e.type === 'boss' && !establishedBossRecovery) ||
          e.captain ||
          e.roomCaptain ||
          (e.form === 'ringleader' && !e.hybrid),
        self =
          selfReady && selfAllowed && inReach(e) && e.hp / e.maxHp <= cfg.threshold ? e : null,
        targets = self ? [...injured, self] : injured;
      if (!targets.length) return false;
      const multiplier = this.enemyHealMultiplier(e);
      let healed = 0,
        criticalReceipt = null,
        allyTreated = false,
        selfTreated = false,
        leaderTreated = false;
      for (const target of targets) {
        const leader = this.enemyHealLeader(target),
          // Captains are now as effective as ordinary ranged monsters when
          // healing ordinary allies. Their own HP and other leaders retain
          // the original 5%-over-five-seconds budget.
          // A captain patient receives half its missing HP from another
          // healer, never the boss's 5%-of-max budget or the ordinary full heal.
          // Self-recovery remains a separate 5%-of-max captain clock.
          captainRecipient =
            leader && target.type !== 'boss' && target !== e && (ordinaryHealer || captainHealer),
          buffed = !leader && (ordinaryHealer || captainHealer),
          duration = buffed
            ? cfg.ordinary.duration
            : captainRecipient
              ? cfg.captain.duration
              : cfg.duration,
          amount = buffed
            ? target.maxHp - target.hp
            : captainRecipient
              ? (target.maxHp - target.hp) * cfg.captain.missingFraction
              : Math.min(target.maxHp - target.hp, target.maxHp * cfg.fraction * multiplier);
        if (!(amount > 0) || !Number.isFinite(amount)) continue;
        // The first actual eligible treatment commits the whole cast.
        // A single immutable World decision is shared by every original
        // recipient; neither another recipient nor an HoT tick rerolls.
        if (healed === 0) criticalReceipt = this.worldCriticalRelease(e, 'heal');
        target.supportHeal = {
          source: e.id,
          skill,
          remaining: amount,
          seconds: this.worldCriticalHealSeconds(criticalReceipt, duration),
          // Captain healing never requires engagement: a captain can be
          // wounded while idle, enter combat, or leave combat mid-treatment.
          // Captain-origin ordinary healing likewise finishes without aggro.
          allowIdle:
            buffed ||
            (target.type !== 'boss' &&
              (captainHealer || !!(target.captain || target.roomCaptain || target.fieldCaptain))),
        };
        if (target === e) selfTreated = true;
        else {
          allyTreated = true;
          if (leader && (ordinaryHealer || captainHealer)) leaderTreated = true;
        }
        healed++;
        this.event('heal', {
          x: target.x,
          y: target.y,
          fromX: e.x,
          fromY: e.y,
          actor: 'enemy',
          resource: 'health',
          source: e.id,
          target: target.id,
          amount,
          skill,
          species: e.species,
          family: e.family,
          form: e.form,
          boss: e.type === 'boss',
          captain: !!(e.captain || e.roomCaptain),
          captainProfile: e.captainProfile,
        });
      }
      if (!healed) return false;
      // Treating allies never spends the captain's independent self clock.
      // Healing only self never spends its ordinary-ally support clock.
      if (allyTreated) {
        e.supportHealCd =
          ordinaryHealer || captainHealer ? cfg.ordinary.cooldown : cfg.cooldown;
        if (leaderTreated) enemyLeaderHealRecovery.set(e, cfg.cooldown);
      }
      if (selfTreated) {
        if (captainHealer) captainSelfHealRecovery.set(e, cfg.cooldown);
        else if (!allyTreated)
          e.supportHealCd = ordinaryHealer ? cfg.ordinary.cooldown : cfg.cooldown;
      }
      e.noProgress = 0;
      if (e.type === 'boss' || e.captain || e.roomCaptain || e.form === 'ringleader')
        this.say(e.name + ' uses ' + skill + ' in an area.');
      return true;
    }
    // Hybrid self-recovery is independent of incoming ranged ally healing.
    // Both may coexist; each pulse independently observes the same HP cap.
    // This state and its cooldown must not consume the ally-support slot.
    enemyHybridSelfHeal(e) {
      const cfg = R.enemySupportHealing.hybridSelf;
      if (
        !cfg ||
        !e?.hybrid ||
        !this.enemyHealingActor(e) ||
        e.type === 'boss' ||
        e.captain || e.roomCaptain || e.fieldCaptain ||
        this.peace ||
        e.returning ||
        this.mageSilenceActive(e) ||
        e.motion || e.telegraph || e.rangedAim ||
        e.hybridSelfHeal ||
        (e.hybridSelfHealCd || 0) > 0 ||
        !(e.maxHp > 0) ||
        e.hp / e.maxHp > cfg.threshold
      ) return false;
      const amount = Math.min(e.maxHp - e.hp, e.maxHp * cfg.fraction);
      if (!(amount > 0)) return false;
      e.hybridSelfHeal = {
        source: e.id,
        skill: 'Hybrid Recovery',
        remaining: amount,
        seconds: cfg.duration,
        allowIdle: true,
      };
      e.hybridSelfHealCd = cfg.cooldown;
      this.event('heal', {
        x: e.x, y: e.y, actor: 'enemy', resource: 'health',
        source: e.id, target: e.id, amount,
        skill: 'Hybrid Recovery', species: e.species, form: e.form,
      });
      return true;
    }
    advanceHybridSelfHeal(e, dt) {
      const h = e.hybridSelfHeal;
      if (!h) return;
      if (
        this.peace || !this.enemyHealingActor(e) ||
        e.returning || !Number.isFinite(h.seconds) ||
        h.seconds <= 0 || !Number.isFinite(h.remaining) ||
        h.remaining <= 0 || !Number.isFinite(e.hp) || e.hp <= 0
      ) {
        delete e.hybridSelfHeal;
        return;
      }
      const step = Math.min(dt, h.seconds),
        amount = Math.min(e.maxHp - e.hp, (h.remaining * step) / h.seconds);
      if (amount > 0) e.hp = Math.min(e.maxHp,
        e.hp + amount * this.rogueEnemyHealingFactor(e));
      h.remaining = Math.max(0, h.remaining - Math.max(0, amount));
      h.seconds = Math.max(0, h.seconds - step);
      if (h.seconds <= 0 || h.remaining <= 0 || e.hp >= e.maxHp)
        delete e.hybridSelfHeal;
    }
    enemySupportApproach(e, dt) {
      const cfg = R.enemySupportHealing;
      if (
        !cfg ||
        !this.enemyHealProfile(e) ||
        !this.enemyHealingActor(e) ||
        e.returning ||
        this.mageSilenceActive(e) ||
        e.motion ||
        e.rangedAim ||
        e.telegraph ||
        (e.supportHealCd || 0) > 0
      )
        return false;
      const leaderRecovery = enemyLeaderHealRecovery.get(e) || 0;
      const ally = this.zone()
        .enemies.filter(
          (u) =>
            this.enemyHealTeammate(e, u) &&
            !u.supportHeal &&
            this.enemyNeedsSupportHeal(u, e) &&
            !(this.enemyHealLeader(u) && !this.enemyHealLeader(e) && leaderRecovery > 0) &&
            (e.aggro ||
              !!this.tacticalRogueRegroup(u) ||
              (!this.enemyHealLeader(e) &&
                (!this.enemyHealLeader(u) || u.captain || u.roomCaptain || u.fieldCaptain))) &&
            dist(e, u) > cfg.range &&
            dist(e, u) <= cfg.range + 210,
        )
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || this.idOrder(a, b))[0];
      if (!ally || !this.route(e, ally).length) return false;
      const before = { x: e.x, y: e.y };
      this.follow(
        e,
        ally,
        160 * this.slowMovementFactor(e) * this.mountedMovementFactor(e) * this.nightTempo(),
        dt,
        cfg.range - 25,
      );
      if (dist(before, e) <= 0.1) return false;
      e.noProgress = 0;
      return true;
    }
    advanceEnemySupportHeal(e, dt) {
      const h = e.supportHeal;
      if (!h) return;
      if (
        this.peace ||
        !this.enemyHealingActor(e) ||
        (!e.aggro && !h.allowIdle) ||
        e.returning ||
        !Number.isFinite(h.seconds) ||
        h.seconds <= 0 ||
        !Number.isFinite(h.remaining) ||
        h.remaining <= 0 ||
        !Number.isFinite(e.hp) ||
        e.hp <= 0
      ) {
        delete e.supportHeal;
        return;
      }
      const step = Math.min(dt, h.seconds),
        amount = Math.min(e.maxHp - e.hp, (h.remaining * step) / h.seconds);
      if (amount > 0) e.hp = Math.min(e.maxHp,
        e.hp + amount * this.rogueEnemyHealingFactor(e));
      h.remaining = Math.max(0, h.remaining - Math.max(0, amount));
      h.seconds = Math.max(0, h.seconds - step);
      if (h.seconds <= 0 || h.remaining <= 0 || e.hp >= e.maxHp) delete e.supportHeal;
    }
    event(type, data = {}) {
      this.s.statistics.events.push({ time: Math.round(this.s.time), type, ...data });
      if (this.s.statistics.events.length > 400) this.s.statistics.events.shift();
      this.effects.push({ type, ...data });
    }

    say(text) {
      this.messages.push(text);
      if (this.messages.length > 7) this.messages.shift();
    }
    notice(text, duration = 5.5, detail = '', kind, context = {}) {
      const local = kind === 'narration' || kind === 'warning' || kind === 'feedback';
      const notice = {
        id: ++this.noticeId,
        text,
        duration,
        ...(detail ? { detail } : {}),
        ...(kind ? { kind } : {}),
        region: this.definition().id,
        scope: local ? 'visit' : 'global',
        ...(local ? { zone: this.zoneId, visit: this.noticeVisit } : {}),
        ...context,
      };
      this.notices.push(notice);
      this.noticeHistory.push(notice);
      if (this.noticeHistory.length > 60) this.noticeHistory.shift();
    }
    boss(id) {
      return D.bosses.find((b) => b.id === id);
    }

    idOrder(a, b) {
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    }

    setRefuge(zone, id) {
      const n = this.s.zones[zone]?.npcs.find((n) => n.id === id && n.kind === 'rest');
      if (n) {
        this.s.refuge = zone;
        const point = n.servicePoint || n;
        this.s.refugeSite = { zone, id, x: point.x, y: point.y };
      }
    }
    minorRefugePoint() {
      const minor = this.s.zones[this.s.zone]?.npcs.find(
        (n) => n.id === 'minor' && n.kind === 'rest',
      );
      return (
        minor?.servicePoint ||
        (minor
          ? { x: minor.x, y: minor.y }
          : { x: D.minors[this.regionIndex()][0], y: D.minors[this.regionIndex()][1] })
      );
    }
    acknowledgeRefuge(site) {
      const current = this.zone().npcs.find((n) => n.id === site?.id && n.kind === 'rest');
      if (
        this.s.zone !== 'vale' ||
        !current ||
        !['rest', 'minor'].includes(current.id) ||
        this.interactionDistance(current) > 115
      )
        return false;
      this.s.discovered['vale:refuge-help:' + current.id] = true;
      return true;
    }
    arriveRefuge(site) {
      const n = this.zone().npcs.find((n) => n.id === site.id && n.kind === 'rest');
      if (!n) return;
      const point = n.servicePoint || n;
      Object.assign(this.hero, this.safe(point.x, point.y));
      for (const u of this.activeParty()) Object.assign(u, this.safe(point.x + 40, point.y + 30));
    }
    miniCleared(id, region = this.s.zone) {
      return !!this.s.zones[region]?.minis?.find((m) => m.id === id)?.cleared;
    }
    miniStatus(id) {
      const z = this.zone(),
        m = z.minis?.find((m) => m.id === id);
      if (!m) return 'Unknown encounter';
      const guards = z.enemies.filter((e) => e.mini === id && e.hp > 0 && !e.neutral).length,
        pending = Object.values(this.s.pending).some(
          (p) => p.kind === 'mob' && p.zone === z.id && p.base.mini === id,
        );
      return (
        m.name +
        ' · ' +
        (this.peace
          ? 'Peaceful'
          : m.cleared
            ? 'Cleared'
            : guards +
              ' guardians' +
              (pending ? ' + incoming ringleaders' : '') +
              (m.type === 'field' && !this.s.normal[m.family]
                ? ' + ' + this.boss(m.family).name
                : '')) +
        ' · ' +
        (m.type === 'resource'
          ? 'Clear to unlock expedition resources and marked supplies.'
          : 'Clear the guardians, defeat the boss and free the captive for the local quest reward.') +
        ' Two open approaches and cover allow retreat. Guardians give reduced crowns and EXP.'
      );
    }
    checkMinis() {
      if (this.isDungeon() || this.peace) return;
      const z = this.s.zones[this.s.zone];
      for (const m of z?.minis || []) {
        if (m.cleared || (m.type === 'field' && !this.s.normal[m.family])) continue;
        if (
          z.enemies.some((e) => e.mini === m.id && e.hp > 0 && !e.neutral) ||
          Object.values(this.s.pending).some(
            (p) => p.kind === 'mob' && p.zone === z.id && p.base.mini === m.id,
          )
        )
          continue;
        m.cleared = true;
        this.say(
          m.name +
            ' cleared. ' +
            (m.type === 'resource'
              ? 'Troops can gather and supplies can be recovered.'
              : 'Any completed quest reward is delivered automatically.'),
        );
        this.event('miniClear', { id: m.id });
        this.checkQuests();
      }
    }
    bundleCollected(n) {
      if (n.treasuryRecovery) return this.treasuryLostCrowns(n.region) <= 0;
      return (
        n.kind === 'bundle' && !!this.s.discovered[this.definition().id + ':bundle-' + n.index]
      );
    }
    keeperAvailable() {
      if (!this.s.normal.archive) return false;
      if (this.s.pending.archive?.active) return false;
      const room = this.s.zones.archive;
      return !room?.enemies.some((e) => e.type === 'boss' && e.family === 'archive' && e.hp > 0);
    }
    archiveRestorerAvailable() {
      return !!this.s.rescued.archive && !!this.s.keeperPact && this.keeperAvailable();
    }
    updateArchiveRestoration(dt) {
      if (this.s.zone !== 'archive') return;
      const n = this.zone().npcs.find((n) => n.id === 'archive-restorer');
      if (!n) return;
      if (!this.archiveRestorerAvailable()) {
        archiveRestorationTrips.delete(n);
        return;
      }
      let trip = archiveRestorationTrips.get(n);
      if (!trip) {
        let nearest = 0;
        for (let i = 1; i < archiveRepairSites.length; i++)
          if (dist(n, archiveRepairSites[i]) < dist(n, archiveRepairSites[nearest])) nearest = i;
        trip = { index: (nearest + 1) % archiveRepairSites.length, wait: 6, path: [], retry: 0 };
        archiveRestorationTrips.set(n, trip);
      }
      if (trip.wait > 0) {
        // Neri actually turns to the nearby books while restoring them. This
        // visual pose is unrelated to her stock, training, pact and pathing.
        const volumes = this.zone().props.filter((prop) =>
          ['shelf', 'scroll-stack'].includes(prop.structure),
        );
        const nearest = volumes.sort((a, b) => dist(n, a) - dist(n, b))[0];
        n.bookRestoring = !!nearest;
        n.bookFacing = nearest && nearest.x < n.x ? -1 : 1;
        trip.wait = Math.max(0, trip.wait - dt);
        return;
      }
      n.bookRestoring = false;
      const target = archiveRepairSites[trip.index];
      if (dist(n, target) < 4) {
        trip.index = (trip.index + 1) % archiveRepairSites.length;
        trip.wait = 6;
        trip.path = [];
        trip.retry = 0;
        return;
      }
      trip.retry = Math.max(0, trip.retry - dt);
      if (!trip.path.length && trip.retry <= 0) {
        trip.path = this.route(n, target);
        trip.retry = 2;
      }
      while (trip.path.length && dist(n, trip.path[0]) < 2) trip.path.shift();
      if (trip.path.length && !this.move(n, trip.path[0], 42, dt)) {
        trip.path = [];
        trip.retry = 2;
      }
    }
    keeperPactReady() {
      return this.keeperAvailable() && !!this.s.rescued.archive;
    }
    promiseKeeper() {
      if (!this.keeperPactReady() || this.s.keeperPact) return false;
      this.s.keeperPact = true;
      this.event('archiveKnowledge', { fact: 'keeperPact' });
      this.say('The Keeper takes your word. Neri will return freely to restore the Archive.');
      return true;
    }
    keeperReadLedger() {
      if (this.s.zone !== 'archive') return false;
      if (!this.s.keeperEvidence) {
        this.s.keeperEvidence = true;
        this.notice(
          'The orders bear the Keeper’s seal. The plan to seize the specialists began among these shelves.',
          7,
          '',
          'narration',
        );
        this.event('archiveKnowledge', { fact: 'keeperEvidence' });
      }
      return true;
    }
    dungeonMasterCandidates() {
      const result = [
        ...D.bosses
          .filter((b) => b.kind === 'field')
          .map((b) => ({ id: 'field:' + b.id, name: b.name, group: 'field' })),
        ...Object.entries(R.roomCaptains).map(([id, captain]) => ({
          id: 'captain:' + id,
          name: captain.name,
          group: 'captain',
        })),
        ...D.bosses
          .filter((b) => b.captive && this.s.rescued[b.id])
          .map((b) => ({
            id: 'specialist:' + b.id,
            name: b.captive,
            group: 'specialist',
          })),
      ];
      return result;
    }
    dungeonMaster(dungeonId = this.s.zone) {
      const id = this.s.appointments?.[dungeonId];
      return this.dungeonMasterCandidates().find((c) => c.id === id) || null;
    }
    syncDungeonMasterStation(z = this.s.zones[this.s.zone]) {
      if (!z || !dungeonIds.includes(z.id)) return;
      z.npcs = z.npcs.filter(
        (n) => !['dungeon-master-choice', 'dungeon-master-resident'].includes(n.id),
      );
      if (!this.s.throneClaimed || !this.s.true[z.id]) return;
      const previous = this.s.zone;
      this.s.zone = z.id;
      try {
        const podium = this.safe(980, 940, z.id);
        z.npcs.push({
          id: 'dungeon-master-choice',
          kind: 'appointment',
          name: 'Appoint Dungeon Master',
          ...podium,
          icon: '♜',
        });
        const master = this.dungeonMaster(z.id);
        if (master) {
          const p = this.safe(1120, 950, z.id);
          z.npcs.push({
            id: 'dungeon-master-resident',
            kind: 'dungeon-master',
            name: 'Dungeon Master: ' + master.name,
            masterId: master.id,
            masterGroup: master.group,
            ...p,
            icon: '♛',
          });
        }
      } finally {
        this.s.zone = previous;
      }
    }
    appointDungeonMaster(dungeonId, candidateId = null) {
      if (
        !this.s.throneClaimed ||
        this.s.zone !== dungeonId ||
        !dungeonIds.includes(dungeonId) ||
        !this.s.true[dungeonId] ||
        (candidateId !== null &&
          !this.dungeonMasterCandidates().some((c) => c.id === candidateId)) ||
        (candidateId !== null &&
          Object.entries(this.s.appointments || {}).some(
            ([id, appointed]) => id !== dungeonId && appointed === candidateId,
          ))
      )
        return false;
      this.s.appointments = this.s.appointments || {};
      if (candidateId === null) delete this.s.appointments[dungeonId];
      else this.s.appointments[dungeonId] = candidateId;
      this.syncDungeonMasterStation();
      const chosen = this.dungeonMaster(dungeonId);
      this.say(
        chosen
          ? chosen.name + ' now keeps the peaceful dungeon.'
          : 'The dungeon remains without an appointed master.',
      );
      this.event('dungeonMaster', { dungeonId, candidateId });
      return true;
    }
    visibleNPCs() {
      return this.zone().npcs.filter(
        (n) =>
          !n.internalSite &&
          !this.bundleCollected(n) &&
          // Codices are one-time world pickups; previously earned volumes
          // remain in the historical zone data without reappearing as loot.
          (n.kind !== 'critical-codex' || !this.s.criticalCodices?.[n.sideCodex]) &&
          (n.kind !== 'keeper' || this.keeperAvailable()) &&
          (n.id !== 'cage-archive' || !this.s.rescued.archive) &&
          (n.id !== 'archive-restorer' || this.archiveRestorerAvailable()) &&
          (!n.thornFootprint || n.expires > this.s.time) &&
          (n.id !== 'cage-thorn' || !this.s.rescued.thorn),
      );
    }
    // Each of these three approved landmark discoveries has a real, stable site ID.
    // Read from the existing v4 discovered map; no new save flags.
    landmarkNarrative(id) {
      return (
        {
          'goblin-camp': AuthorCopy.L01.en,
          'mire-nests': AuthorCopy.L02.en,
          'ogre-hearth': AuthorCopy.L03.en,
        }[id] || null
      );
    }
    announceLandmark(n) {
      const prose = this.landmarkNarrative(n.id);
      if (prose)
        this.notice(prose, 8, '', 'narration', { scope: 'region', region: this.definition().id });
    }
    siteDescription(n) {
      const z = this.zone(),
        guards = z.enemies.filter((e) => e.site === n.id && e.hp > 0 && !e.neutral).length,
        parts = [];
      if (z.id === 'highlands' && R.ironrootLore?.[n.id]) parts.push(R.ironrootLore[n.id]);
      const crownLink = R.crownPeaceLinks?.[z.id]?.[n.id];
      if (crownLink) parts.push(crownLink);
      if (n.id.startsWith('bridge-'))
        parts.push(
          'A crossing through the regional terrain. Walk across the connected road; no separate entrance.',
        );
      const quests = this.questDefs().filter((q) => q.region === z.id && q.sites?.includes(n.id));
      if (quests.length)
        parts.push('Survey objective: ' + quests.map((q) => q.name).join(', ') + '.');
      const caches = z.npcs.filter(
        (b) => b.kind === 'bundle' && b.site === n.id && !this.bundleCollected(b),
      );
      if (caches.length) parts.push('Recover the marked supplies here with Interact.');
      const room = R.supplyRooms.find((r) => r.region === z.id && r.site === n.id);
      if (room)
        parts.push(
          'The quest supplies are secured inside ' +
            room.name +
            ' nearby. Recover all ' +
            room.count +
            ' caches there after clearing its guards.',
        );
      const node = z.nodes.find((a) => a.site === n.id && this.tributeKnown(a));
      if (node)
        parts.push(
          node.amount > 0
            ? 'Dark Lord Tribute has been located here. Assign idle troops from Barracks Operations to recover it; exact value is tracked there.'
            : 'The recovered tribute at this site is exhausted.',
        );
      if (n.id === 'convoy')
        parts.push(
          'Escort the supplier back to Emberwatch. Stay close so the convoy keeps moving.',
        );
      if (n.id === 'checkpoint')
        parts.push(
          "This is the Ashen Warlord's occupied checkpoint; Lyss is held inside the compound.",
        );
      if (n.id === 'fortress-gate')
        parts.push(
          this.s.rescued.cindermaw && this.s.rescued.citadel
            ? 'Both Crown specialists are free. The fortress approach now leads to the Dark Lord.'
            : 'The Dark Lord remains beyond the fortress, but first free Vera from Cindermaw and Tovan from the Citadel.',
        );
      if (n.id === 'night-site')
        parts.push('Visit after dark and defeat two Lantern wraiths for Shadows After Sundown.');
      if (n.id === 'goblin-camp') parts.push(AuthorCopy.L01.en);
      if (n.id === 'mire-nests') parts.push(AuthorCopy.L02.en);
      if (n.id === 'wolf-den')
        parts.push(
          'Tracks, bedding and old kills mark a real hunting ground used by the highland wolf packs.',
        );
      if (n.id === 'ogre-hearth') parts.push(AuthorCopy.L03.en);
      if (n.id === 'orc-bivouac')
        parts.push(
          'A long-term occupation bivouac: soldiers cook, sleep, drill and repair equipment here between patrol quotas.',
        );
      if (n.id === 'ash-roost')
        parts.push(
          'Ash beasts roost and feed here among warm stone and old bones instead of simply wandering the volcanic road.',
        );
      if (n.id === 'crown-barracks')
        parts.push(
          "A permanent Crown field barracks with bunks, meals, stores and training space for troops enforcing the Dark Lord's order.",
        );
      const hold = (R.creatureStrongholds || []).find((s) => s.region === z.id && s.site === n.id);
      if (hold)
        parts.push(
          hold.night
            ? 'This site becomes a defended center of power for ' +
                (hold.nightSpecies === 'wraith' ? 'wraiths' : 'Ash stalkers') +
                ' after dark.'
            : 'Ordinary ' +
                hold.species +
                's have made this a defended personal stronghold with sleeping, food, storage and social space of their own.',
        );
      if (n.sideDungeon)
        parts.push(
          'This named site has an occupied interior. Regional enemies have adapted the old structure into living space, traps and defensible rooms.',
        );
      const mini = z.minis?.find(
        (m) => m.site === n.id || (m.type === 'field' && dist(m, n) < 260),
      );
      if (mini) parts.push(this.miniStatus(mini.id));
      if (!parts.length) parts.push('An outdoor patrol site. It has no separate dungeon interior.');
      if (!this.peace)
        parts.push(
          guards
            ? 'Local patrol: ' +
                guards +
                ' guards alive. Patrols return after the whole party leaves.'
            : 'No local guards remain.',
        );
      else parts.push('The war is over; this place is safe.');
      return n.name + '. ' + parts.join(' ');
    }
    questDestination(id) {
      const q = this.questDefs().find((q) => q.id === id),
        state = this.s.quests[id];
      if (!q || state?.paid || state?.done || state?.closedByPeace) return null;
      const z = this.zone(),
        nearest = (list) => list.slice().sort((a, b) => dist(a, this.hero) - dist(b, this.hero))[0],
        seen = (id) => !!this.s.discovered[q.region + ':' + id];
      if (q.kind === 'barracks') {
        if (
          !state.captainBriefed ||
          (state.recallPracticed && !state.barracksBriefed && !this.hasAnyBarracks())
        )
          return z.npcs.find((n) => n.kind === 'recruiter') || null;
        return nearest(z.buildings.filter((b) => b.progress < 4)) || null;
      }
      let targetZone = q.region,
        rescue = q.kind === 'rescue' ? q.target : null;
      if (q.requiresRescues) rescue = q.requiresRescues.find((id) => !this.s.rescued[id]) || rescue;
      if (rescue && !this.s.rescued[rescue] && this.boss(rescue)?.kind === 'dungeon')
        targetZone = rescue;
      if (q.kind === 'bundles')
        targetZone = R.supplyRooms.find((r) => r.region === q.region)?.id || targetZone;
      const currentRegion = this.definition().id;
      if (this.isDungeon() && this.zoneId !== targetZone)
        return z.npcs.find((n) => n.kind === 'exit') || null;
      if (currentRegion !== q.region) {
        const from = D.regions.findIndex((r) => r.id === currentRegion),
          to = D.regions.findIndex((r) => r.id === q.region);
        return (
          z.npcs.find((n) => n.kind === 'transport' && n.direction === Math.sign(to - from)) ||
          z.npcs.find((n) => n.kind === 'transport' && n.hub) ||
          null
        );
      }
      if (this.zoneId !== targetZone)
        return z.npcs.find((n) => n.kind === 'dungeon' && n.family === targetZone) || null;
      if (rescue && !this.s.rescued[rescue])
        return (
          (this.s.keys[rescue]
            ? z.npcs.find((n) => n.kind === 'cage' && n.family === rescue)
            : null) ||
          nearest(z.enemies.filter((e) => e.type === 'boss' && e.family === rescue && e.hp > 0)) ||
          z.npcs.find((n) => n.kind === 'cage' && n.family === rescue) ||
          null
        );
      if (q.clear && !this.miniCleared(q.clear, q.region))
        return z.npcs.find((n) => n.mini === q.clear) || null;
      if (q.kind === 'bundles')
        return (
          nearest(
            z.npcs.filter(
              (n) => n.kind === 'bundle' && !n.treasuryRecovery && !this.bundleCollected(n),
            ),
          ) || null
        );
      if (q.kind === 'patrol')
        return (
          nearest(
            z.enemies.filter(
              (e) =>
                e.type === 'mob' &&
                !e.guard &&
                !e.neutral &&
                !e.summon &&
                (e.hp > 0 || e.respawn > 0),
            ),
          ) || null
        );
      if (q.kind === 'night')
        return (
          (!seen('night-site') ? z.npcs.find((n) => n.id === 'night-site') : null) ||
          nearest(
            z.enemies.filter(
              (e) => e.species === 'wraith' && e.nightOnly && (e.hp > 0 || e.respawn > 0),
            ),
          ) ||
          z.npcs.find((n) => n.id === 'night-site') ||
          null
        );
      if (q.kind === 'sites') {
        const sites = z.npcs.filter((n) => q.sites.includes(n.id) && !seen(n.id));
        if (q.sites.includes('port') && !seen('port')) {
          const [x, y] = D.ports[D.regions.findIndex((r) => r.id === q.region)];
          sites.push({ id: 'port', kind: 'landmark', x, y });
        }
        return nearest(sites) || null;
      }
      if (q.kind === 'barracks') return nearest(z.buildings.filter((b) => b.progress < 4)) || null;
      return null;
    }
    questProgress(q) {
      const p = this.s.quests[q.id],
        seen = (id) => !!this.s.discovered[q.region + ':' + id];
      if (p?.paid)
        return q.kind === 'barracks'
          ? 'Complete · field base established'
          : 'Complete · reward delivered';
      if (p?.closedByPeace) return 'Resolved by peace';
      if (p?.done) return 'Complete';
      if (q.kind === 'barracks' && !p?.captainBriefed)
        return 'Meet the town Captain to learn about your Soldier and Ranger.';
      if (q.kind === 'barracks' && !p?.recallPracticed)
        return 'Try Recall squad to bring your companions back to you.';
      if (q.kind === 'barracks') {
        if (this.hasAnyBarracks())
          return 'Construction in progress · keep one companion assigned until complete';
        return p?.barracksBriefed
          ? 'Leave town → open ground off the road → Menu → Establish Basic Barracks (FREE).'
          : "Continue the Captain's briefing for the next step.";
      }
      if (q.kind === 'bundles')
        return (
          Array.from({ length: q.target }, (_, j) => j).filter((j) => seen('bundle-' + j)).length +
          '/' +
          q.target +
          ' supplies recovered'
        );
      if (q.kind === 'patrol') return (p?.count || 0) + '/' + q.target + ' outdoor enemies';
      if (q.kind === 'night')
        return (
          (p?.count || 0) +
          '/' +
          q.target +
          ' night wraiths; ' +
          (seen('night-site') ? 'shore observed' : 'observe Lantern Shore after dark')
        );
      if (q.kind === 'sites') {
        if (q.minSites)
          return (
            q.sites.filter(seen).length +
            '/' +
            q.minSites +
            ' places discovered · explore naturally'
          );
        const missing = q.sites
            .filter((id) => !seen(id))
            .map((id) =>
              id === 'port'
                ? 'transport stand'
                : id === 'minor'
                  ? D.regions.find((r) => r.id === q.region).minor
                  : R.sites[D.regions.findIndex((r) => r.id === q.region)].find(
                      (s) => s[0] === id,
                    )?.[1] || id,
            ),
          rescues = (q.requiresRescues || [])
            .filter((id) => !this.s.rescued[id])
            .map((id) => this.boss(id).captive);
        return [...missing, ...rescues].join(', ') + ' still required';
      }
      if (q.kind === 'rescue')
        return (
          (this.s.rescued[q.target]
            ? 'Captive freed'
            : this.boss(q.target).captive + ' still captive') +
          (q.clear && !this.miniCleared(q.clear, q.region)
            ? ' · clear the field dungeon guardians'
            : '')
        );
      return 'Meet the supplier at Supply convoy; stay within escort range on the return road';
    }

    upgradeRingleader(e) {
      if (e.form !== 'ringleader' || e.ringleaderHealthVersion === 3) return;
      const alive = e.hp > 0,
        fraction = e.maxHp ? e.hp / e.maxHp : 0,
        hpState = e.baseHp ? e.maxHp / e.baseHp : 1,
        damageState = e.baseDamage ? e.damage / e.baseDamage : 1;
      if (!e.ringleaderHealthVersion) {
        e.baseHp = Math.round(e.baseHp * 1.25);
        e.ringleaderHealthVersion = 2;
      }
      if (e.ringleaderHealthVersion === 2) {
        e.baseHp = Math.round(e.baseHp * 1.25);
        e.baseDamage = Math.round(e.baseDamage * 1.2);
      }
      e.maxHp = e.baseHp * hpState;
      e.hp = alive ? e.maxHp * fraction : 0;
      e.damage = e.baseDamage * damageState;
      e.ringleaderHealthVersion = 3;
    }
    guardianPopulation(z) {
      const ri = this.regionIndex(z.id),
        cfg = R.guardianScaling[ri],
        legacy = R.guardianLegacyScaling[ri],
        melee = R.ordinaryMeleeScaling[ri],
        outdoor = !dungeonIds.includes(z.id) && !this.supplyRoom(z.id);
      if (!cfg) return;
      const scale = (e) => {
        if (!e?.guard || e.neutral || e.guardianBalanceVersion === 2) return;
        const alive = e.hp > 0,
          fraction = e.maxHp ? e.hp / e.maxHp : 0,
          hpState = e.baseHp ? e.maxHp / e.baseHp : 1,
          damageState = e.baseDamage ? e.damage / e.baseDamage : 1;
        if (e.guardianBalanceVersion === 1 && legacy) {
          e.baseHp = Math.round(e.baseHp / legacy.hp);
          e.baseDamage = Math.round(e.baseDamage / legacy.damage);
        } else if (outdoor && e.meleeBalanceVersion) {
          e.baseHp = Math.round(e.baseHp / melee.hp);
          e.baseDamage = Math.round(e.baseDamage / melee.damage);
          delete e.meleeBalanceVersion;
        }
        e.baseHp = Math.round(e.baseHp * cfg.hp);
        e.baseDamage = Math.round(e.baseDamage * cfg.damage);
        e.maxHp = e.baseHp * hpState;
        e.hp = alive ? e.maxHp * fraction : 0;
        e.damage = e.baseDamage * damageState;
        e.guardianBalanceVersion = 2;
      };
      for (const e of z.enemies) scale(e);
      for (const p of Object.values(this.s.pending))
        if (p.kind === 'mob' && p.zone === z.id && p.base.guard) scale(p.base);
      z.guardianBalanceVersion = 2;
    }
    summonPopulation(z) {
      const cfg = R.summonScaling[this.regionIndex(z.id)];
      if (!cfg) return;
      for (const e of z.enemies.filter((e) => e.summon && !e.summonBalanceVersion)) {
        const alive = e.hp > 0,
          fraction = e.maxHp ? e.hp / e.maxHp : 0,
          hpState = e.baseHp ? e.maxHp / e.baseHp : 1,
          damageState = e.baseDamage ? e.damage / e.baseDamage : 1;
        e.baseHp = Math.round(e.baseHp * cfg.hp);
        e.baseDamage = Math.round(e.baseDamage * cfg.damage);
        e.maxHp = e.baseHp * hpState;
        e.hp = alive ? e.maxHp * fraction : 0;
        e.damage = e.baseDamage * damageState;
        e.summonBalanceVersion = 1;
      }
    }
    nightEnemyPopulation(z) {
      for (const e of z.enemies.filter((e) => e.nightOnly && !e.nightBalanceVersion)) {
        const cfg = R.nightEnemyCombat[e.species];
        if (!cfg) continue;
        const alive = e.hp > 0,
          fraction = e.maxHp ? e.hp / e.maxHp : 0,
          hpState = e.baseHp ? e.maxHp / e.baseHp : 1,
          damageState = e.baseDamage ? e.damage / e.baseDamage : 1;
        e.baseHp = Math.round(e.baseHp * cfg.hp);
        e.baseDamage = Math.round(e.baseDamage * cfg.damage);
        e.maxHp = e.baseHp * hpState;
        e.hp = alive ? e.maxHp * fraction : 0;
        e.damage = e.baseDamage * damageState;
        e.nightBalanceVersion = 1;
        e.specialCd = Math.min(e.specialCd ?? 1.5, 1.5);
      }
      for (const p of Object.values(this.s.pending))
        if (
          p.kind === 'mob' &&
          p.zone === z.id &&
          p.base.nightOnly &&
          !p.base.nightBalanceVersion
        ) {
          const cfg = R.nightEnemyCombat[p.base.species];
          if (cfg) {
            p.base.baseHp = Math.round(p.base.baseHp * cfg.hp);
            p.base.maxHp = Math.round(p.base.maxHp * cfg.hp);
            p.base.baseDamage = Math.round(p.base.baseDamage * cfg.damage);
            p.base.damage = Math.round(p.base.damage * cfg.damage);
            p.base.nightBalanceVersion = 1;
          }
        }
    }
    // Add only genuinely missing posts. The first four legacy records always
    // retain their IDs, wounds/deaths and captain slot, even on old v4 saves.
    // Extra Treasury guards are security, not repeatable XP/Crown farming.
    treasuryGuardPopulation(z) {
      const slots = R.treasuryGuardFormations?.[z.id];
      if (!slots || this.peace) return;
      const region = this.regionIndex(z.id),
        original = z.enemies
          .filter((e) => e.roomGuard && !e.reinforcement)
          .sort((a, b) => this.idOrder(a, b));
      for (let j = 0; j < slots.length; j++) {
        const slot = slots[j];
        let e = original[j];
        if (!e) {
          if (slot.captain) continue; // Historical captain may not be fabricated.
          const sp = D.species[region][0],
            p = this.safe(slot.x, slot.y, z.id);
          e = this.makeEnemy(
            {
              species: sp[0],
              name: slot.name || sp[1] + ' treasury guardian',
              icon: sp[2],
              level: region * 3 + 2,
              hp: 65 + region * 105,
              damage: 7 + region * 8,
              gold: 0,
              xp: 0,
            },
            p,
          );
          e.guard = true;
          e.roomGuard = true;
          e.pack = z.id + '-' + (slot.group || 'guard-' + j);
          e.forcedRole = slot.role || null;
          e.mountedCrownRider = !!slot.mountedCrownRider;
          if (e.mountedCrownRider) {
            e.crownTroop = true;
            e.crownAncestry = 'wolf';
          }
          this.configureEnemy(e, j);
          z.enemies.push(e);
          continue;
        }
        if (slot.captain) continue;
        // The first four slots are original identities; do not change their
        // native species, level, strength, death state or saved position.
        e.mountedCrownRider = !!slot.mountedCrownRider;
        if (e.mountedCrownRider) {
          e.crownTroop = true;
          e.crownAncestry = 'wolf';
        }
        if (slot.role) e.forcedRole = slot.role;
        e.name =
          slot.name ||
          (D.species[region].find((sp) => sp[0] === e.species)?.[1] || e.species) +
            ' treasury guard';
        e.pack = z.id + '-' + (slot.group || 'guard-' + j);
        this.configureEnemy(e, j);
        e.gold = 0;
        e.xp = 0;
      }
      // Normal, dead and newly generated guardian records stay distinct.
      // The existing guardian scaling pass handles only fresh recruits once.
    }
    treasuryInterior(z) {
      const room = this.supplyRoom(z.id),
        layout = room && R.treasuryDecor?.[room.id],
        targetVersion = room?.id === 'supply-crown' ? 5 : room?.id === 'supply-highlands' ? 6 : 3;
      if (!room || !layout) return;
      if (z.treasuryEntryVersion !== 1) {
        const exit = z.npcs.find((n) => n.kind === 'exit');
        if (exit) Object.assign(exit, R.treasuryEntry.exit);
        z.treasuryEntryVersion = 1;
      }
      if (z.treasuryVersion === targetVersion) {
        // Append only new nonblocking character-life details to historical
        // saves. Never rebuild the Treasury or reset caches, guards or captain.
        for (const [j, [x, y, structure, radius, sceneRole]] of layout.entries()) {
          if (!sceneRole || z.props.some((p) => p.id === 'treasury-' + j)) continue;
          z.props.push({
            id: 'treasury-' + j,
            ...this.safe(x, y, z.id),
            r: radius || 0,
            decorative: !radius,
            structure,
            treasuryBoss: room.boss,
            sceneRole,
          });
        }
        return;
      }
      z.room = true;
      z.treasury = room.boss;
      z.props = z.props.filter(
        (p) =>
          !/^room-(pillar|crate)-/.test(String(p.id || '')) &&
          !/^treasury-/.test(String(p.id || '')),
      );
      for (const [j, [x, y, structure, radius, sceneRole]] of layout.entries()) {
        const p = this.safe(x, y, z.id);
        z.props.push({
          id: 'treasury-' + j,
          ...p,
          r: radius || 0,
          decorative: !radius,
          structure,
          treasuryBoss: room.boss,
          ...(sceneRole ? { sceneRole } : {}),
        });
      }
      const exit = z.npcs.find((n) => n.id === 'exit');
      if (exit) {
        exit.name = 'Leave ' + room.name;
        Object.assign(exit, this.safe(exit.x, exit.y, z.id));
      }
      const collected = Math.min(
          room.count,
          [0, 1, 2].filter((j) => this.s.discovered[room.region + ':bundle-' + j]).length,
        ),
        cacheSpots = R.treasuryCacheSpots?.[room.id] || [
          [650, 365],
          [720, 690],
          [545, 760],
        ];
      z.npcs = z.npcs.filter(
        (n) => n.kind !== 'bundle' || (room.id === 'supply-highlands' && n.treasuryRecovery),
      );
      for (let j = 0; j < room.count; j++) {
        const p = this.safe(cacheSpots[j][0], cacheSpots[j][1], z.id);
        z.npcs.push({
          id: 'bundle-' + j,
          name: room.name + ' cache ' + (j + 1),
          kind: 'bundle',
          index: j,
          ...p,
          icon: '📦',
        });
      }
      if (room.id === 'supply-highlands') {
        const recovery = z.npcs.find((n) => n.treasuryRecovery);
        if (recovery) {
          const point = R.treasuryRecovery.sites.find((s) => s.zone === z.id).point;
          Object.assign(recovery, this.safe(...point, z.id));
        }
      }
      if (room.id !== 'supply-highlands') {
        for (let j = 0; j < 3; j++) delete this.s.discovered[room.region + ':bundle-' + j];
        for (let j = 0; j < collected; j++) this.s.discovered[room.region + ':bundle-' + j] = true;
      }
      if (R.treasuryGuardFormations?.[room.id]) {
        const fallback = this.safe(150, 180, z.id),
          formation = R.treasuryGuardFormations?.[room.id] || [],
          guards = z.enemies.filter((e) => e.roomGuard).sort((a, b) => this.idOrder(a, b));
        for (const [j, e] of guards.entries()) {
          const slot = formation[j];
          if (slot) {
            const p = this.safe(slot.x, slot.y, z.id);
            e.home = { ...p };
            e.pack = z.id + '-' + (slot.group || 'guard-' + j);
            if (slot.role) e.forcedRole = slot.role;
            if (!e.roomCaptain && slot.name) e.name = slot.name;
            if (e.hp > 0 && !e.aggro) Object.assign(e, p);
            this.configureEnemy(e, j);
          } else {
            const p = this.blocked(e.home?.x, e.home?.y, z.id, 12)
              ? this.safe(e.home?.x || fallback.x, e.home?.y || fallback.y, z.id)
              : e.home;
            e.home = { ...p };
            if (e.hp > 0 && !e.aggro && this.blocked(e.x, e.y, z.id, 12)) Object.assign(e, p);
          }
        }
        for (const e of z.enemies.filter((e) => !e.roomGuard)) {
          if (e.home && this.blocked(e.home.x, e.home.y, z.id, 12))
            e.home = this.safe(e.home.x, e.home.y, z.id);
          if (e.hp > 0 && !e.aggro && this.blocked(e.x, e.y, z.id, 12))
            Object.assign(e, this.safe(e.x, e.y, z.id));
        }
        if (this.s.zone === z.id) {
          if (this.blocked(this.hero.x, this.hero.y, z.id, 12)) Object.assign(this.hero, fallback);
          for (const [j, u] of this.activeParty().entries())
            if (this.blocked(u.x, u.y, z.id, 12))
              Object.assign(
                u,
                this.safe(
                  fallback.x + 35 + (j % 3) * 25,
                  fallback.y + 35 + Math.floor(j / 3) * 25,
                  z.id,
                ),
              );
        }
      }
      if (room.id === 'supply-highlands') {
        for (const e of z.enemies) {
          if (e.home) Object.assign(e, e.home);
          delete e.path;
          this.clearEncounterState(e);
          e.aggro = false;
          e.returning = 0;
        }
        for (const p of Object.values(this.s.pending))
          if (p.zone === z.id && p.base) {
            const source = z.enemies.find((e) => e.id === p.base.id);
            if (source) {
              p.base.home = { ...source.home };
              Object.assign(p.base, source.home);
              delete p.base.path;
            }
          }
      }
      for (const e of z.enemies.filter(
        (e) => e.roomGuard && !e.roomCaptain && / store guard/i.test(e.name),
      ))
        e.name = e.name.replace(/ store guard/i, ' treasury guard');
      z.treasuryVersion = targetVersion;
    }
    upgradeCaptainEndurance(e, profile) {
      if (!e || !profile?.enduranceHp) return;
      // The new Greenwood health budget must migrate existing v2 captains,
      // but should never repeatedly scale an already upgraded saved actor.
      const version = e.captainProfile === 'supply-vale' ? 3 : 2;
      if (e.captainEnduranceVersion === version) return;
      const previous = e.maxHp || e.baseHp || 1;
      const fraction = Math.max(0, Math.min(1, (e.hp || 0) / previous));
      const oldBase = e.baseHp || previous;
      const ratio = previous / oldBase;
      // Authoritative base HP is a fixed captain budget, not a multiplier of
      // historical treasury/scaling revisions (which would stack on old saves).
      e.baseHp = profile.enduranceHp;
      e.maxHp = e.baseHp * ratio;
      e.hp = e.hp > 0 ? e.maxHp * fraction : 0;
      // Saves restore living enemies at full HP but may retain legacy phase
      // flags. Let the revised phase trigger cleanly at its new threshold.
      e.captainPhase = false;
      e.captainPhaseMove = 1;
      e.captainAttackRate = 1;
      e.captainGuard = 0;
      e.captainReflect = 0;
      e.captainOvertimeCd = 0;
      e.captainEnduranceVersion = version;
    }
    roomCaptainPopulation(z) {
      const profile = R.roomCaptains?.[z.id];
      if (!profile) return;
      let captain = z.enemies.find((e) => e.roomCaptain);
      if (!captain) captain = z.enemies.find((e) => e.roomGuard && / captain$/i.test(e.name));
      if (!captain) return;
      captain.captain = true;
      captain.roomCaptain = true;
      captain.captainProfile = z.id;
      captain.captainMentor = profile.mentor;
      captain.captainVisualIdol = profile.visualIdol || profile.mentor;
      if (profile.species) captain.species = profile.species;
      captain.visualScale = profile.visualScale || 1.16;
      // Population reconciliation is also called during active simulation. The
      // agriculture selector's cooldown must survive these reads after setup.
      // Setup normalization must not repeatedly truncate a live captain's
      // special cooldown whenever zone() is read during simulation.
      if (captain.roomCaptainVersion !== 1)
        captain.specialCd = Math.min(captain.specialCd ?? 1.25, 1.25);
      captain.roomCaptainVersion = 1;
      this.upgradeCaptainEndurance(captain, profile);
      if (captain.name !== profile.name) captain.name = profile.name;
    }
    fieldCaptainPopulation(z) {
      if (z.id !== 'frontier' || this.peace) return;
      const key = 'frontier-overseer',
        profile = R.roomCaptains?.[key];
      if (!profile) return;
      let captain = z.enemies.find((e) => e.fieldCaptain);
      if (!captain) {
        const i = this.regionIndex(z.id),
          r = D.regions[i],
          scale = R.ordinaryMeleeScaling[i],
          sp = D.species[i][0],
          raw = profile.patrol?.[0] || [1200, 950],
          p = this.safe(raw[0], raw[1], z.id),
          hp = Math.round((65 + i * 105) * scale.hp * 2),
          damage = Math.round((7 + i * 8) * scale.damage * 1.25),
          { gold, xp } = this.regionalEnemyRewards(i, 'fieldCaptain');
        captain = this.makeEnemy(
          {
            species: sp[0],
            name: profile.name,
            icon: sp[2],
            level: i * 3 + 2,
            hp,
            damage,
            gold,
            xp,
          },
          p,
        );
        captain.pack = 'frontier-overseer';
        z.enemies.push(captain);
      }
      captain.captain = true;
      captain.fieldCaptain = true;
      captain.meleeBalanceVersion = 1;
      captain.captainProfile = key;
      captain.captainMentor = profile.mentor;
      captain.captainVisualIdol = profile.visualIdol || profile.mentor;
      captain.visualScale = profile.visualScale || 1.18;
      captain.specialCd = Math.min(captain.specialCd ?? 1.25, 1.25);
      captain.captainPatrolIndex = Number.isInteger(captain.captainPatrolIndex)
        ? captain.captainPatrolIndex
        : 0;
      captain.captainPatrolWait = Math.max(0, captain.captainPatrolWait || 0);
      captain.fieldCaptainVersion = 1;
      this.upgradeCaptainEndurance(captain, profile);
      if (captain.name !== profile.name) captain.name = profile.name;
      z.fieldCaptainVersion = 1;
    }
    finalBossPopulation(z) {
      if (
        z.id !== 'crown' ||
        this.peace ||
        !this.s.rescued.cindermaw ||
        !this.s.rescued.citadel ||
        this.s.normal.darklord ||
        this.s.true.darklord ||
        this.s.pending.darklord
      )
        return;
      let e = z.enemies.find((e) => e.family === 'darklord' && e.hp > 0);
      if (e) return;
      const b = this.boss('darklord'),
        p = this.safe(D.fields[4][0], D.fields[4][1], z.id);
      e = this.bossEnemy(b, 'normal', p);
      z.enemies.push(e);
      this.say(
        'With both Crown specialists free, the Dark Lord now waits beyond the fortress gate.',
      );
    }

    dungeonGuardCount(zone = this.s.zone) {
      const formation = R.dungeonGuardFormations?.[zone];
      return formation?.length || D.regions[this.regionIndex(zone)]?.guards || 0;
    }
    dungeonGuardBlueprint(zone, index) {
      const i = this.regionIndex(zone),
        formation = R.dungeonGuardFormations?.[zone];
      if (formation?.length) {
        const spec = formation[index % formation.length],
          defaultSpecies = zone === 'citadel' ? 'crownguard' : D.species[i][0][0],
          sp =
            D.species[i].find((s) => s[0] === (spec.species || defaultSpecies)) || D.species[i][0],
          defaultName =
            zone === 'citadel'
              ? spec.role === 'ranged'
                ? 'Crown marksman guardian'
                : 'Crown shield guardian'
              : sp[1] + ' guardian';
        return {
          ...spec,
          sp,
          pack: zone + '-' + (spec.group || 'formation-' + Math.floor(index / 4)),
          name: spec.name || defaultName,
        };
      }
      const pack = Math.floor(index / 2),
        sp = D.species[i][pack % D.species[i].length],
        [x, y] = R.guardPosts[pack % R.guardPosts.length];
      return {
        x: x + (index % 2) * 44,
        y: y + (index % 2) * 50,
        sp,
        pack: zone + '-pack-' + pack,
        name: sp[1] + ' guardian',
      };
    }
    configureEnemy(e, index) {
      if (e.type !== 'mob' || e.summon || e.neutral) return;
      if (e.forcedRole === 'melee') {
        e.ranged = false;
        delete e.hybrid;
        delete e.shotRange;
        delete e.shotSpeed;
        delete e.projectileStyle;
        return;
      }
      if (e.forcedRole === 'ranged') {
        e.ranged = true;
        e.shotRange = 280;
        e.shotSpeed = 260;
        e.projectileStyle = e.species === 'wraith' ? 'spectral' : 'arrow';
        return;
      }
      const profile = R.rangedProfiles[e.species];
      if (
        profile &&
        (index % 3 === 2 ||
          (e.guard && index % 2 === 1) ||
          (e.species === 'reedbeast' && index % 2 === 0))
      ) {
        Object.assign(e, profile, { ranged: true });
        if (!e.name.includes(profile.variant)) e.name += ' ' + profile.variant;
      } else if (['archer', 'crownguard', 'wraith'].includes(e.species)) {
        e.ranged = true;
        e.shotRange = 280;
        e.shotSpeed = 260;
        e.projectileStyle = e.species === 'wraith' ? 'spectral' : 'arrow';
      }
    }
    combatPopulation(z) {
      if (z.combatVersion === 1) return;
      z.combatVersion = 1;
      z.enemies.forEach((e, j) => this.configureEnemy(e, j));
    }
    ordinaryMeleePopulation(z) {
      if (dungeonIds.includes(z.id) || this.supplyRoom(z.id)) return;
      const cfg = R.ordinaryMeleeScaling[this.regionIndex(z.id)];
      if (!cfg) return;
      const eligible = (e) =>
        e &&
        !e.meleeBalanceVersion &&
        e.type === 'mob' &&
        e.form !== 'true' &&
        !e.guard &&
        !e.summon &&
        !e.neutral &&
        !e.nightOnly &&
        !e.ranged;
      const scale = (e) => {
        if (!eligible(e)) return;
        const alive = e.hp > 0,
          fraction = e.maxHp ? e.hp / e.maxHp : 0,
          hpState = e.baseHp ? e.maxHp / e.baseHp : 1,
          damageState = e.baseDamage ? e.damage / e.baseDamage : 1;
        e.baseHp = Math.round(e.baseHp * cfg.hp);
        e.maxHp = e.baseHp * hpState;
        e.hp = alive ? e.maxHp * fraction : 0;
        e.baseDamage = Math.round(e.baseDamage * cfg.damage);
        e.damage = e.baseDamage * damageState;
        e.meleeBalanceVersion = 1;
      };
      for (const e of z.enemies) scale(e);
      for (const p of Object.values(this.s.pending))
        if (p.kind === 'mob' && p.zone === z.id) scale(p.base);
      z.meleeBalanceVersion = 1;
    }
    ordinaryRangedPopulation(z) {
      if (dungeonIds.includes(z.id) || this.supplyRoom(z.id)) return;
      const cfg = R.ordinaryRangedScaling[this.regionIndex(z.id)];
      if (!cfg) return;
      const eligible = (e) =>
        e &&
        !e.rangedBalanceVersion &&
        e.type === 'mob' &&
        e.form === 'normal' &&
        !e.guard &&
        !e.summon &&
        !e.neutral &&
        !e.nightOnly &&
        e.ranged;
      const scale = (e) => {
        if (!eligible(e)) return;
        const alive = e.hp > 0,
          fraction = e.maxHp ? e.hp / e.maxHp : 0,
          hpState = e.baseHp ? e.maxHp / e.baseHp : 1,
          damageState = e.baseDamage ? e.damage / e.baseDamage : 1;
        e.baseHp = Math.round(e.baseHp * cfg.hp);
        e.maxHp = e.baseHp * hpState;
        e.hp = alive ? e.maxHp * fraction : 0;
        e.baseDamage = Math.round(e.baseDamage * cfg.damage);
        e.damage = e.baseDamage * damageState;
        e.rangedBalanceVersion = 1;
      };
      for (const e of z.enemies) scale(e);
      for (const p of Object.values(this.s.pending))
        if (p.kind === 'mob' && p.zone === z.id) scale(p.base);
      z.rangedBalanceVersion = 1;
    }
    decorateDungeon(z) {
      const targetVersion =
        z.id === 'crypt'
          ? 4
          : R.dungeonWorkstations?.[z.id]
            ? 3
            : z.id === 'abyss'
              ? 4
              : z.id === 'citadel'
                ? 3
                : 2;
      // Append only the newly approved gallery to existing Mine saves.
      if (z.id === 'mine' && z.dungeonVersion === targetVersion) {
        for (const [j, [x, y, structure, district, sceneRole]] of R.dungeonDecor.mine.entries()) {
          if (
            ![
              'geometric-gallery',
              'kinetic-collection',
              'art-object',
              'mixed-rider-quarters',
            ].includes(sceneRole)
          )
            continue;
          if (z.props.some((p) => p.id === 'decor-' + j)) continue;
          z.props.push({
            id: 'decor-' + j,
            ...this.safe(x, y, z.id),
            r: 0,
            decorative: true,
            structure,
            dungeonDistrict: district,
            sceneRole,
            icon: '🕯️',
          });
        }
      }
      // Append Veyra's eighth dressing station to legacy v3 Citadel saves.
      // Do not reset the dungeon, traps, guards or active encounter.
      if (z.id === 'citadel' && z.dungeonVersion === targetVersion) {
        const j = R.dungeonDecor.citadel.findIndex((row) => row[2] === 'citadel-vanity-quarters');
        if (j !== -1 && !z.props.some((p) => p.id === 'decor-' + j)) {
          const [x, y, structure, district, sceneRole] = R.dungeonDecor.citadel[j];
          z.props.push({
            id: 'decor-' + j,
            ...this.safe(x, y, z.id),
            r: 0,
            decorative: true,
            structure,
            ...(district ? { dungeonDistrict: district } : {}),
            ...(sceneRole ? { sceneRole } : {}),
            icon: '🕯️',
          });
        }
      }
      if (z.dungeonVersion === targetVersion) return;
      z.props = z.props.filter((p) => !p.decorative || !String(p.id).startsWith('decor-'));
      z.dungeonVersion = targetVersion;
      const i = this.regionIndex(z.id),
        region = D.regions[i];
      for (const [j, [x, y, kind, district, sceneRole]] of R.dungeonDecor[z.id].entries()) {
        const p = this.safe(x, y, z.id);
        z.props.push({
          id: 'decor-' + j,
          ...p,
          r: 0,
          decorative: true,
          structure: kind,
          icon: '🕯️',
          ...(district ? { dungeonDistrict: district } : {}),
          ...(sceneRole ? { sceneRole } : {}),
        });
      }
      const architecture = R.dungeonArchitecture?.[z.id],
        formation = R.dungeonGuardFormations?.[z.id];
      if (architecture) {
        const fallback = this.safe(180, 240, z.id),
          nearest = (p, alt = fallback) => {
            if (!p || !this.blocked(p.x, p.y, z.id, 12)) return p;
            try {
              return this.safe(p.x, p.y, z.id);
            } catch (_) {
              return { ...alt };
            }
          };
        for (const n of z.npcs) {
          const p = nearest(n);
          if (p) Object.assign(n, p);
        }
        for (const e of z.enemies) {
          const h = nearest(
            e.home,
            e.type === 'boss'
              ? this.safe(this.dungeonBossHome(z.id).x, this.dungeonBossHome(z.id).y, z.id)
              : fallback,
          );
          if (h) e.home = { ...h };
          if (e.hp > 0 && !e.aggro) {
            const p = nearest(e, h || fallback);
            if (p) Object.assign(e, p);
          }
        }
        if (this.s.zone === z.id) {
          const p = nearest(this.hero);
          if (p) Object.assign(this.hero, p);
          for (const [j, u] of this.activeParty().entries()) {
            const q = nearest(
              u,
              this.safe(p.x + 40 + (j % 3) * 28, p.y + 35 + Math.floor(j / 3) * 28, z.id),
            );
            if (q) Object.assign(u, q);
          }
        }
      }
      if (this.peace || this.s.paid['clear:' + z.id] || this.s.normal[z.id]) return;
      const target = this.dungeonGuardCount(z.id),
        existing = z.enemies
          .filter((e) => e.guard && e.form === 'normal' && !e.reinforcement)
          .sort((a, b) => this.idOrder(a, b));
      if (formation?.length) {
        for (let j = 0; j < Math.min(existing.length, target); j++) {
          const e = existing[j],
            g = this.dungeonGuardBlueprint(z.id, j),
            p = this.safe(g.x, g.y, z.id);
          e.species = g.sp[0];
          e.icon = g.sp[2];
          e.name = g.name;
          e.forcedRole = g.role;
          e.mountedCrownRider = !!g.mountedCrownRider;
          if (e.mountedCrownRider) {
            e.crownTroop = true;
            e.crownAncestry = 'wolf';
          }
          e.pack = g.pack;
          e.home = { ...p };
          if (e.hp > 0 && !e.aggro) Object.assign(e, p);
          this.configureEnemy(e, j);
        }
      }
      for (let j = existing.length; j < target; j++) {
        const g = this.dungeonGuardBlueprint(z.id, j),
          p = this.safe(g.x, g.y, z.id),
          e = this.makeEnemy(
            {
              species: g.sp[0],
              name: g.name,
              icon: g.sp[2],
              level: Math.max(1, i * 3 + (Math.floor(j / 2) % 2) + 1),
              hp: 65 + i * 105,
              damage: 7 + i * 8,
              gold: 0,
              xp: 0,
            },
            p,
          );
        e.guard = true;
        e.mountedCrownRider = !!g.mountedCrownRider;
        if (e.mountedCrownRider) {
          e.crownTroop = true;
          e.crownAncestry = 'wolf';
        }
        e.pack = g.pack;
        if (g.role) e.forcedRole = g.role;
        this.configureEnemy(e, j);
        z.enemies.push(e);
      }
      this.guardianPopulation(z);
    }
    makeEnemy(def, p) {
      return {
        id: 'enemy-' + this.s.nextId++,
        family: def.family || null,
        species: def.species || def.family,
        name: def.name,
        icon: def.icon || '👿',
        form: def.form || 'normal',
        type: def.type || 'mob',
        level: def.level,
        baseHp: def.hp,
        baseDamage: def.damage,
        hp: def.hp,
        maxHp: def.hp,
        damage: def.damage,
        gold: def.gold,
        xp: def.xp,
        x: p.x,
        y: p.y,
        home: { ...p },
        cd: 0,
        aggro: false,
        heroParticipated: false,
        noProgress: 0,
        attackIndex: 0,
        respawn: 0,
        neutral: false,
        open: 0,
        deathPaid: false,
      };
    }
    recordDeveloperDamage(direction, amount) {
      if (this.s.mode !== 'developer' || !['incoming', 'outgoing'].includes(direction)) return;
      if (!Number.isFinite(amount) || amount <= 0) return;
      const history = this.developerCombat[direction];
      history.push({ time: this.s.time, damage: amount });
      while (history.length > 3 && history[0].time < this.s.time - 5) history.shift();
    }
    developerCombatSnapshot() {
      if (this.s.mode !== 'developer') return null;
      const windowSeconds = 5;
      const elapsed = Math.min(
        windowSeconds,
        Math.max(1, this.s.time - this.developerCombat.startedAt),
      );
      const read = (direction) => {
        const history = this.developerCombat[direction];
        return {
          last: history
            .slice(-3)
            .reverse()
            .map((hit) => hit.damage),
          dps:
            history
              .filter((hit) => hit.time >= this.s.time - windowSeconds)
              .reduce((sum, hit) => sum + hit.damage, 0) / elapsed,
        };
      };
      return { incoming: read('incoming'), outgoing: read('outgoing') };
    }
    developerSummonOptions() {
      if (this.s.mode !== 'developer' || this.peace) return [];
      const region = this.definition()?.id;
      if (!region) return [];
      const bosses = D.bosses
        .filter((boss) => boss.region === region)
        .flatMap((boss) =>
          ['normal', 'true'].map((form) => ({
            id: 'boss:' + boss.id + ':' + form,
            label: boss.name + (form === 'true' ? ' · TRUE' : ' · Regular'),
            kind: 'boss',
            boss: boss.id,
            form,
          })),
        );
      const captains = Object.entries(R.roomCaptains || {})
        .filter(
          ([id]) =>
            id === 'supply-' + region || (region === 'frontier' && id === 'frontier-overseer'),
        )
        .map(([id, profile]) => ({
          id: 'captain:' + id,
          label: profile.name + ' · Captain',
          kind: 'captain',
          profile: id,
        }));
      return [...bosses, ...captains];
    }
    developerSummon(id) {
      if (this.s.mode !== 'developer' || this.peace || this.hero.hp <= 0) return null;
      const option = this.developerSummonOptions().find((entry) => entry.id === id);
      if (!option) return null;
      // Choose an unoccupied position so repeated tests do not stack actors.
      const z = this.zone();
      const offsets = [
        [175, 65],
        [0, 190],
        [-175, 65],
        [175, -100],
        [-175, -100],
        [0, -190],
        [255, 145],
        [-255, 145],
      ];
      const placements = offsets.map(([x, y]) =>
        this.safe(this.hero.x + x, this.hero.y + y, this.zoneId),
      );
      const p =
        placements.find(
          (candidate) =>
            dist(candidate, this.hero) >= 85 &&
            !z.enemies.some((e) => e.hp > 0 && dist(candidate, e) < 85),
        ) || placements[0];
      let enemy;
      if (option.kind === 'boss') {
        enemy = this.bossEnemy(this.boss(option.boss), option.form, p);
      } else {
        const profile = R.roomCaptains[option.profile];
        const region = this.regionIndex();
        const species = D.species[region][0];
        const field = option.profile === 'frontier-overseer';
        const original = field
          ? z.enemies.find((e) => e.fieldCaptain && e.captainProfile === option.profile)
          : this.s.zones[option.profile]?.enemies.find((e) => e.roomCaptain);
        // Match the production spawn formulas even when the treasury has not
        // yet been visited. Existing originals retain their authored balance.
        const scaling = field ? R.ordinaryMeleeScaling[region] : R.guardianScaling[region];
        enemy = this.makeEnemy(
          {
            // A named captain's locked identity outranks the region's generic
            // fallback even when the actual Treasury has not been generated.
            species: profile.species || original?.species || species[0],
            name: profile.name,
            icon: original?.icon || species[2],
            level: original?.level || region * 3 + 2,
            hp: original?.baseHp ?? Math.round((65 + region * 105) * scaling.hp * 2),
            damage: original?.baseDamage ?? Math.round((7 + region * 8) * scaling.damage * 1.25),
            gold: 0,
            xp: 0,
          },
          p,
        );
        enemy.captain = true;
        enemy.captainProfile = option.profile;
        enemy.captainMentor = profile.mentor;
        enemy.captainVisualIdol = profile.visualIdol || profile.mentor;
        enemy.visualScale = profile.visualScale || 1.16;
        enemy.specialCd = 0;
        if (field) {
          enemy.fieldCaptain = true;
          enemy.fieldCaptainVersion = 1;
          enemy.meleeBalanceVersion = 1;
          enemy.captainPatrolIndex = 0;
          enemy.captainPatrolWait = 0;
          enemy.pack = 'frontier-overseer';
        } else {
          enemy.roomCaptain = true;
          enemy.roomGuard = true;
          enemy.guard = true;
          enemy.guardianBalanceVersion = 2;
          enemy.roomCaptainVersion = 1;
          const formation = R.treasuryGuardFormations?.[option.profile] || [];
          const captainIndex = formation.findIndex((slot) => slot.captain);
          const slot = formation[captainIndex] || {};
          enemy.pack = option.profile + '-' + (slot.group || 'guard-' + captainIndex);
          if (original?.forcedRole || slot.role)
            enemy.forcedRole = original?.forcedRole || slot.role;
          this.configureEnemy(enemy, captainIndex < 0 ? 3 : captainIndex);
        }
      }
      // Test spawns exercise authentic AI and attacks but cannot award campaign progress.
      enemy.developerSummon = true;
      enemy.summon = true;
      // These are full native bosses/captains, not scaled minion summons.
      enemy.summonBalanceVersion = 1;
      enemy.neutral = false;
      enemy.home = { ...p };
      if (!enemy.pack) enemy.pack = 'developer-' + enemy.id;
      z.enemies.push(enemy);
      this.engage(enemy, true);
      this.say('Developer summon: ' + enemy.name + '.');
      return enemy;
    }
    bossEnemy(b, form, p) {
      let hp = b.hp,
        damage = b.damage,
        { gold, xp } = this.bossRewards(b, form),
        level = b.level;
      if (form === 'true') {
        hp *= 1.8;
        damage *= 1.25;
        level += 2;
        if (b.kind === 'dungeon' && this.s.phase !== 'adventure') {
          const i = dungeonIds.indexOf(b.id);
          level = this.s.awakeningLevel || this.hero.level + 2;
          const scale = Math.max(1, level / 18);
          hp = Math.round((13000 + i * 1000) * scale);
          damage = Math.round((70 + i * 2) * scale);
          level = this.s.awakeningLevel || this.hero.level + 2;
        }
      }
      return this.makeEnemy(
        {
          family: b.id,
          name: b.name + (form === 'true' ? ' TRUE' : ''),
          icon: b.id === 'darklord' ? '😈' : b.kind === 'field' ? '👹' : '💀',
          form,
          type: 'boss',
          level,
          hp,
          damage,
          gold,
          xp,
        },
        p,
      );
    }
    refreshNPCs() {
      for (const [id, z] of Object.entries(this.s.zones)) {
        if (id === 'arena') continue; // Keep the separate hub specialists intact.
        if (dungeonIds.includes(id) || this.supplyRoom(id) || this.sideDungeon(id)) continue;
        const i = this.regionIndex(id),
          [x, y] = D.towns[i];
        z.npcs = z.npcs.filter(
          (n) =>
            !['teacher', 'smith', 'alchemist'].includes(n.kind) &&
            !n.id.startsWith('service-') &&
            (n.id !== 'dark-crown-throne' || (id === 'crown' && this.s.true.darklord)),
        );
        if (
          id === 'crown' &&
          this.s.true.darklord &&
          !z.npcs.some((n) => n.id === 'dark-crown-throne')
        ) {
          // The actual fortress courtyard, not Veyra's Citadel. Idempotent
          // for fresh worlds and historical v4 restores with cached regions.
          const point = this.safe(3250, 3090, id);
          z.npcs.push({
            id: 'dark-crown-throne',
            name: 'Claim the Throne',
            kind: 'throne',
            ...point,
            icon: '♛',
          });
        }
        for (const b of D.bosses.filter((b) => b.region === id && b.captive)) {
          const kind = ceilings[b.id] ? 'teacher' : b.id === 'archive' ? 'alchemist' : 'smith',
            offset = R.serviceOffsets[kind] || [-120, -120],
            exists = z.npcs.some((n) => n.id === 'service-' + b.id);
          if (this.s.rescued[b.id] && !exists) {
            const p = this.safe(x + offset[0], y + offset[1], id);
            z.npcs.push({
              id: 'service-' + b.id,
              name: b.captive,
              kind,
              family: b.id,
              ...p,
              icon: kind === 'teacher' ? '🧙' : kind === 'alchemist' ? '⚗️' : '⚒️',
            });
          }
        }
        this.frontierTownServices(z);
        this.crownTownServices(z);
        this.highlandsTownServices(z);
      }
    }
    clearTonic() {
      if (this.hero.tonic) {
        this.hero.maxHp -= this.hero.tonicBonus || 0;
        this.hero.hp = Math.min(this.hero.hp, this.hero.maxHp);
        this.hero.tonic = false;
        this.hero.tonicBonus = 0;
        this.syncCompanionLevelStats();
      }
    }
    refugeThreat() {
      return (
        !this.peace &&
        this.zone().enemies.some(
          (e) => e.hp > 0 && !e.neutral && e.aggro && dist(e, this.hero) < 700,
        )
      );
    }
    completeFinalRest(source, site) {
      if (!this.peace || !this.s.throneClaimed || this.s.finalRestCompleted) return false;
      if (
        source === 'barracks' &&
        !this.zone().buildings.some(
          (b) =>
            b.id === site?.id &&
            b.kind === 'barracks' &&
            b.progress >= 4 &&
            dist(b, this.hero) <= 115,
        )
      )
        return false;
      if (!['refuge', 'fountain', 'barracks'].includes(source)) return false;
      if (
        source === 'fountain' &&
        !this.zone().npcs.some(
          (n) => n === site && n.kind === 'fountain' && dist(n, this.hero) <= 115,
        )
      )
        return false;
      if (
        source === 'refuge' &&
        !this.zone().npcs.some(
          (n) =>
            n.id === site?.id &&
            n.kind === 'rest' &&
            Math.min(dist(n, this.hero), dist(n.servicePoint || n, this.hero)) <= 115,
        )
      )
        return false;
      this.clearTonic();
      this.hero.supportEffects = [];
      this.hero.hp = this.hero.maxHp;
      if (R.resourceMode.manaEnabled) this.hero.mp = this.hero.maxMp;
      for (const u of this.activeParty())
        if (u.hp > 0) {
          u.hp = u.maxHp;
          u.supportEffects = [];
        }
      this.s.finalRestCompleted = true;
      // One-time author-final text is visible and recoverable via earned stories.
      this.notice(AuthorCopy.M02.en, 8, '', 'milestone');
      this.say(AuthorCopy.M02.en);
      this.event('finalRest', { source });
      return true;
    }
    rest(siteId = null) {
      const site = this.zone()
        .npcs.filter(
          (n) =>
            n.kind === 'rest' &&
            (!siteId || n.id === siteId) &&
            (dist(n, this.hero) <= 115 || dist(n.servicePoint || n, this.hero) <= 115),
        )
        .sort(
          (a, b) => dist(a.servicePoint || a, this.hero) - dist(b.servicePoint || b, this.hero),
        )[0];
      if (!site) return false;
      if (this.refugeThreat()) {
        this.say('Cannot rest while nearby enemies are engaged. Retreat and end the fight first.');
        return false;
      }
      if (this.s.restCooldown > 0 && !this.peace) {
        this.say('Refuge restoration ready in ' + Math.ceil(this.s.restCooldown) + ' seconds.');
        return false;
      }
      this.clearTonic();
      this.hero.supportEffects = [];
      this.hero.hp = this.hero.maxHp;
      if (R.resourceMode.manaEnabled) this.hero.mp = this.hero.maxMp;
      for (const u of this.activeParty())
        if (u.hp > 0) {
          u.hp = u.maxHp;
          u.supportEffects = [];
        }
      this.s.restCooldown = 90;
      this.setRefuge(this.s.zone, site.id);
      this.say(
        'Rested at the refuge. Hero and all living companions restored. Fallen companions require recovery through the Captain or a barracks.',
      );
      this.event('rest');
      if (this.peace && !this.s.finalRestCompleted) this.completeFinalRest('refuge', site);
      return true;
    }

    rescue(family) {
      if (!this.boss(family)?.captive) return false;
      if (this.s.rescued[family]) return false;
      if (!this.s.keys[family] && !this.peace) {
        this.say('Defeat ' + this.boss(family).name + ' to obtain the key.');
        return false;
      }
      this.s.rescued[family] = true;
      if (family === 'cindermaw')
        for (const z of Object.values(this.s.zones)) this.clearVeraRepairs(z);
      this.refreshNPCs();
      this.say(this.boss(family).captive + ' is free and returning to town.');
      this.notice(this.boss(family).captive + ' rescued · new services unlocked', 5.5);
      this.event('rescue', { family });
      this.checkQuests();
      return true;
    }

    barracksSpecialists() {
      const teacherOrder = ['thorn', 'mire', 'ridge', 'warlord', 'citadel'],
        rescuedTeachers = teacherOrder.filter((id) => this.s.rescued[id]),
        highestTeacher = rescuedTeachers.at(-1),
        keep = new Set();
      for (const id of rescuedTeachers) {
        const catalog = this.teacherCatalog(id);
        if (id === highestTeacher || catalog.learn.some((slot) => !this.hero.skills[slot - 1]))
          keep.add(id);
      }
      const smithOrder = ['crypt', 'mine', 'abyss', 'cindermaw'],
        highestSmith = smithOrder.filter((id) => this.s.rescued[id]).at(-1);
      if (highestSmith) keep.add(highestSmith);
      for (const [key, def] of Object.entries(R.expeditionSupportSkills || {})) {
        const rank = this.expeditionSupportRank(key);
        if (rank >= def.maxRank) continue;
        const capable = Object.entries(def.trainers || {})
          .filter(([id, cap]) => this.s.rescued[id] && cap > rank)
          .sort((a, b) => a[1] - b[1]);
        if (capable.length) keep.add(capable.at(-1)[0]);
      }
      if (this.s.rescued.archive) keep.add('archive');
      return D.bosses
        .filter((b) => keep.has(b.id))
        .map((b) => ({
          family: b.id,
          name: b.captive,
          kind: R.teachers[b.id] ? 'teacher' : b.id === 'archive' ? 'alchemist' : 'smith',
        }));
    }

    preparationTonicStock() {
      return this.hero.tonicStock || 0;
    }
    purchasePreparationTonic() {
      // Match the inventory limit enforced by v4 save validation; never charge for unusable stock.
      if (!this.s.rescued.archive || this.preparationTonicStock() >= 10000) return false;
      if (!this.spend(this.preparationTonicCost())) return false;
      this.hero.tonicStock = this.preparationTonicStock() + 1;
      this.say('Preparation Tonic purchased. Use it at any completed Barracks.');
      return true;
    }
    activatePreparationTonic() {
      if (this.hero.tonic) return false;
      this.hero.tonic = true;
      this.hero.tonicBonus = Math.ceil(this.hero.maxHp * 0.1);
      this.hero.maxHp += this.hero.tonicBonus;
      this.hero.hp += this.hero.tonicBonus;
      // Personal consumables do not add inheritable HP to companions.
      this.syncCompanionLevelStats();
      this.say('Preparation Tonic active · maximum health +10% until rest or defeat.');
      return true;
    }
    usePreparationTonic() {
      if (this.hero.tonic || this.preparationTonicStock() < 1) return false;
      this.hero.tonicStock--;
      return this.activatePreparationTonic();
    }
    buyPotion(type, advanced = false) {
      if (type === 'tonic') {
        if (!advanced || !this.s.rescued.archive) return false;
        if (this.hero.tonic) {
          this.say('Preparation tonic already active.');
          return false;
        }
        if (!this.spend(this.preparationTonicCost())) {
          this.say('Not enough crowns for a Preparation tonic.');
          return false;
        }
        return this.activatePreparationTonic();
      }
      this.say(
        R.resourceMode.manaEnabled
          ? 'Combat potions are no longer used. Rangers provide Heal and Mana Recovery in the field.'
          : 'Combat potions are no longer used. Rangers provide Heal in the field.',
      );
      return false;
    }

    hasAnyBarracks() {
      return Object.values(this.s.zones).some((z) =>
        z?.buildings?.some((b) => b.kind === 'barracks'),
      );
    }
    hasCompletedBarracks() {
      return Object.values(this.s.zones).some((z) =>
        z?.buildings?.some((b) => b.kind === 'barracks' && b.progress >= 4),
      );
    }
    selectedBarracksRespawn() {
      const selected = this.s.barracksRespawn;
      if (!selected || selected.zone !== this.definition().id || this.s.challenge.succession)
        return null;
      const barracks = this.s.zones[selected.zone]?.buildings?.find(
        (b) => b.id === selected.id && b.kind === 'barracks' && b.progress >= 4,
      );
      return barracks ? { zone: selected.zone, barracks } : null;
    }
    setBarracksRespawn(id) {
      if (this.s.challenge.succession || this.isDungeon()) return false;
      const barracks = this.zone().buildings.find(
        (b) => b.id === id && b.kind === 'barracks' && b.progress >= 4,
      );
      if (!barracks) return false;
      for (const z of Object.values(this.s.zones))
        for (const b of z.buildings) delete b.recoveryOnComplete;
      this.s.barracksRespawn = { zone: this.zoneId, id: barracks.id };
      this.say('Barracks selected for death recovery. You can change camps later.');
      return true;
    }
    clearBarracksRespawn() {
      if (this.s.challenge.succession || !this.s.barracksRespawn) return false;
      this.s.barracksRespawn = null;
      this.say('Death recovery returned to your last refuge.');
      return true;
    }

    dungeonEntrance(ref) {
      if (this.isDungeon()) return null;
      return (
        this.zone().npcs.find(
          (n) =>
            n.kind === 'dungeon' &&
            !this.sideDungeon(n.family) &&
            n.id === ref?.id &&
            n.family === ref.family &&
            dist(n, this.hero) <= 115,
        ) || null
      );
    }
    dungeonCamp(ref) {
      const entrance = this.dungeonEntrance(ref);
      if (!entrance) return null;
      return (
        this.zone()
          .buildings.filter(
            (b) =>
              b.kind === 'barracks' &&
              dist(b, entrance) <=
                (b.dungeonEntrance === entrance.family
                  ? R.dungeonCamp.builtRadius
                  : R.dungeonCamp.nearbyRadius) &&
              this.route(entrance, b).length,
          )
          .sort(
            (a, b) =>
              (b.progress >= 4) - (a.progress >= 4) || dist(a, entrance) - dist(b, entrance),
          )[0] || null
      );
    }
    dungeonCampReason(ref) {
      if (!this.dungeonEntrance(ref)) return 'Visit the dungeon entrance to prepare a camp.';
      if (this.s.challenge.succession)
        return 'Succession uses successors instead of recovery points.';
      if (this.refugeThreat()) return 'End nearby combat before preparing your camp.';
      const camp = this.dungeonCamp(ref);
      if (camp?.progress >= 4) return '';
      if (
        camp &&
        this.activeLivingParty().some((u) => u.order?.type === 'build' && u.order.id === camp.id)
      )
        return '';
      if (!this.availableLabor().length)
        return 'An idle active Soldier or Ranger is needed to build. Recall workers or recover a fallen companion first.';
      if (!camp && this.hero.gold < this.barracksBuildCost())
        return 'Not enough crowns to build a Barracks (' + this.barracksBuildCost() + ' needed).';
      return '';
    }
    prepareDungeonCamp(ref) {
      const reason = this.dungeonCampReason(ref);
      if (reason) {
        this.say(reason);
        return false;
      }
      let camp = this.dungeonCamp(ref);
      if (camp?.progress >= 4) return this.setBarracksRespawn(camp.id);
      if (!camp) {
        if (!this.build(this.dungeonEntrance(ref))) return false;
        camp = this.zone().buildings.at(-1);
      } else if (
        !this.activeLivingParty().some((u) => u.order?.type === 'build' && u.order.id === camp.id)
      ) {
        if (!this.assignBuilder(camp.id)) return false;
      }
      for (const z of Object.values(this.s.zones))
        for (const b of z.buildings) delete b.recoveryOnComplete;
      camp.recoveryOnComplete = true;
      camp.dungeonEntrance = this.dungeonEntrance(ref).family;
      this.say(
        'Your companion is building outside the dungeon. Stay outside until construction finishes; this camp will then become your recovery point.',
      );
      return true;
    }

    build(anchor = this.hero) {
      if (this.isDungeon()) return false;
      const builder = this.availableLabor()[0],
        cost = this.barracksBuildCost();
      if (!builder) return false;
      const zone = this.zone(),
        origin = { x: anchor.x + 130, y: anchor.y },
        candidates = [origin];
      for (const radius of [85, 145, 205, 275, 355, 440])
        for (let j = 0; j < 24; j++) {
          const angle = (j * Math.PI) / 12;
          candidates.push({
            x: origin.x + Math.cos(angle) * radius,
            y: origin.y + Math.sin(angle) * radius,
          });
        }
      const p = candidates.find(
        (point) =>
          !this.blocked(point.x, point.y, this.zoneId, 50) &&
          this.distanceToRoad(zone, point) >= 175 &&
          zone.npcs.every((n) => Math.hypot(n.x - point.x, n.y - point.y) > 105) &&
          zone.buildings.every((b) => Math.hypot(b.x - point.x, b.y - point.y) > 170) &&
          zone.props.every(
            (item) => Math.hypot(item.x - point.x, item.y - point.y) > (item.r || 0) + 60,
          ) &&
          this.route(anchor, point).length > 0,
      );
      if (!p) {
        this.say('No clear plot for barracks nearby. Move away from the road and try again.');
        return false;
      }
      if (!this.spend(cost)) return false;
      this.s.recallActive = false;
      const b = {
        id: 'barracks-' + this.s.nextId++,
        ...p,
        progress: 0,
        queue: 0,
        queueType: null,
        kind: 'barracks',
        name: 'Barracks',
        theme: this.zoneId,
        icon: '🏗️',
        full: false,
        upgradeProgress: 0,
        upgradePaid: false,
      };
      this.zone().buildings.push(b);
      builder.order = { type: 'build', id: b.id };
      this.say(
        this.companionDisplayName(builder) +
          ' assigned to build the basic barracks.',
      );
      return true;
    }
    assignBuilder(id) {
      const b = this.zone().buildings.find((b) => b.id === id && b.progress < 4),
        already = this.activeLivingParty().some(
          (u) => u.order?.type === 'build' && u.order.id === id,
        ),
        builder = this.availableLabor()[0];
      if (!b || already || !builder) return false;
      this.s.recallActive = false;
      builder.order = { type: 'build', id: b.id };
      this.say(
        this.companionDisplayName(builder) + ' assigned to resume construction.',
      );
      return true;
    }
    upgradeBarracks(id) {
      const b = this.zone().buildings.find((b) => b.id === id && b.progress >= 4 && !b.full),
        already = this.activeLivingParty().some(
          (u) => u.order?.type === 'upgrade' && u.order.id === id,
        ),
        builder = this.availableLabor()[0];
      if (!b || (this.s.expeditionRank || 1) < 4 || already || !builder) return false;
      if (!b.upgradePaid) {
        if (!this.spend(this.barracksUpgradeCost())) return false;
        b.upgradePaid = true;
        b.upgradeProgress = b.upgradeProgress || 0;
      }
      this.s.recallActive = false;
      builder.order = { type: 'upgrade', id: b.id };
      this.say(
        this.companionDisplayName(builder) + ' assigned to upgrade the barracks.',
      );
      return true;
    }
    train(id, type = 'soldier') {
      const reason = this.companionRecruitmentReason(type, id ?? '');
      if (reason) {
        this.say(reason);
        return false;
      }
      const b = this.zone().buildings.find((b) => b.id === id);
      if (!this.spend(this.barracksRecruitPrice(type))) return false;
      b.queue = 4;
      b.queueType = type;
      return true;
    }
    tributeKnown(n, region = this.definition().id) {
      return !n?.tribute || !n.hidden || !!this.s.discovered[region + ':tribute:' + n.tributeId];
    }
    visibleResourceNodes() {
      return this.zone().nodes.filter((n) => n.amount > 0 && this.tributeKnown(n));
    }
    hiddenTributeNodes() {
      return this.zone().nodes.filter(
        (n) => n.tribute && n.hidden && n.amount > 0 && !this.tributeKnown(n),
      );
    }
    scoutTribute(nodeId = null, barracksId = null) {
      if ((this.s.expeditionRank || 1) < 2 || this.isDungeon()) return false;
      const hidden = this.hiddenTributeNodes();
      if (!hidden.length) {
        this.say('No undiscovered Dark Lord Tribute remains in this region.');
        return false;
      }
      const n = nodeId ? hidden.find((n) => n.id === nodeId) : hidden[0];
      if (!n) return false;
      if (this.zoneId === 'highlands' && n.concealedTribute) {
        if (
          !this.zone().buildings.some(
            (b) => b.id === barracksId && b.kind === 'barracks' && b.progress >= 4,
          )
        ) {
          this.say('Organize Highlands searches from a completed Barracks.');
          return false;
        }
        return this.gather(n.id, { scouting: true });
      }
      return this.locateTribute(n);
    }
    locateTribute(n) {
      if (!n?.tribute || this.tributeKnown(n) || !this.zone().nodes.includes(n)) return false;
      this.s.discovered[this.definition().id + ':tribute:' + n.tributeId] = true;
      this.say('Scouts located Dark Lord Tribute at ' + n.siteName + '. ' + n.context + '.');
      this.event('tributeDiscovery', {
        region: this.definition().id,
        tributeId: n.tributeId,
        site: n.site,
      });
      return true;
    }
    gather(nodeId, options = null) {
      if ((this.s.expeditionRank || 1) < 2) {
        this.say(
          'Resource gathering unlocks at Expedition 2. Rescue Mira and train the Expedition Skill.',
        );
        return false;
      }
      this.checkMinis();
      const n = this.zone().nodes.find((n) => n.id === nodeId),
        labor = this.availableGatherers(),
        scouting =
          this.zoneId === 'highlands' &&
          n?.concealedTribute &&
          options?.scouting === true &&
          !this.tributeKnown(n);
      if (n?.tribute && !this.tributeKnown(n) && !scouting) {
        this.say('That tribute cache has not been located by your expedition yet.');
        return false;
      }
      if (n?.mini && !this.peace && !this.miniCleared(n.mini)) {
        this.say(this.miniStatus(n.mini));
        return false;
      }
      if (!n || n.amount <= 0 || !labor.length) {
        this.say('An idle gatherer and an unexhausted tribute site are required.');
        return false;
      }
      this.s.recallActive = false;
      this.s.gatheringTarget = { zone: this.zoneId, id: n.id };
      for (const u of labor) {
        this.clearPartyCharge(u);
        this._companionCharges?.delete(u.id);
        this.clearGatheringIntent(u);
        u.order = {
          type: 'gather',
          id: nodeId,
          group: n.resourceGroup,
          ...(scouting ? { scouting: true } : {}),
        };
      }
      if (scouting) {
        this.say(
          'Search party sent toward ' +
            n.siteName +
            '. Escort them; the cache stays concealed until they reach it.',
        );
        return true;
      }
      this.say(
        labor.length +
          ' troop' +
          (labor.length === 1 ? '' : 's') +
          ' assigned to recover Dark Lord Tribute at ' +
          (n.siteName || n.name) +
          '. Escort them along the waypoint. They will fight or withdraw when needed, then resume this site.',
      );
      return true;
    }

    emptyDungeonDefenders(leader) {
      const z = this.zone();
      z.enemies = z.enemies.filter((e) => !e.summon && !e.reinforcement && e.form !== 'ringleader');
      for (const e of z.enemies)
        if (e !== leader && !e.neutral && e.hp > 0) {
          this.cancelEncounter(e);
          this.clearEncounterState(e);
          e.hp = 0;
          e.deathPaid = true;
        }
      z.packTimers = {};
      z.guardianReinforcementTimer = 0;
      for (const [key, pending] of Object.entries(this.s.pending))
        if (pending.kind === 'mob' && pending.zone === z.id) delete this.s.pending[key];
    }
    resetDungeonDefenders() {
      if (!this.isDungeon() || this.sideDungeon() || this.peace) return;
      const z = this.zone();
      const captain = this.supplyRoom() && z.enemies.find((e) => e.roomCaptain && !e.summon);
      const activeBoss = z.enemies.find(
        (e) => e.type === 'boss' && e.hp > 0 && !e.neutral && !e.summon,
      );
      // A defeated leader owns the return schedule. Door travel never
      // bypasses its cooldown or leaves defenders without their leader.
      if ((captain && captain.hp <= 0) || (dungeonIds.includes(z.id) && !activeBoss)) {
        this.emptyDungeonDefenders(captain || z.enemies.find((e) => e.type === 'boss'));
        return;
      }
      // Restore native defenses, not accumulated summons/reinforcement waves.
      // Keep campaign victories, rescue/collection flags, loot and geometry.
      z.enemies = z.enemies
        .filter(
          (e) => !e.summon && !e.developerSummon && !e.reinforcement && e.form !== 'ringleader',
        )
        .map((old) => {
          if (old.neutral) return old;
          if (
            old.type === 'boss' &&
            (old.hp <= 0 || this.s[old.form === 'true' ? 'true' : 'normal'][old.family])
          )
            return old;
          const home = old.home || old;
          const fresh =
            old.type === 'boss'
              ? this.bossEnemy(this.boss(old.family), old.form, home)
              : this.makeEnemy(
                  {
                    species: old.species,
                    name: old.name,
                    icon: old.icon,
                    family: old.family,
                    form: old.form,
                    level: old.level,
                    hp: old.baseHp,
                    damage: old.baseDamage,
                    gold: old.deathPaid || old.hp <= 0 ? 0 : old.gold,
                    xp: old.deathPaid || old.hp <= 0 ? 0 : old.xp,
                  },
                  home,
                );
          fresh.id = old.id;
          fresh.home = { x: home.x, y: home.y };
          for (const key of Object.keys(old))
            if (
              /Version$/.test(key) ||
              [
                'guard',
                'roomGuard',
                'roomCaptain',
                'captain',
                'captainProfile',
                'captainMentor',
                'captainVisualIdol',
                'visualScale',
                'pack',
                'forcedRole',
                'ranged',
                'hybrid',
                'shotRange',
                'shotSpeed',
                'projectileStyle',
                'mountedCrownRider',
                'crownTroop',
                'crownAncestry',
                'crownRogueTurn',
                'awakenedGuard',
                'awakeningStatsLevel',
                'sideDungeon',
                'treasuryReinforcement',
              ].includes(key)
            )
              fresh[key] = old[key];
          fresh.specialCd = fresh.captain ? 1.25 : 0;
          return fresh;
        });
      z.packTimers = {};
      z.guardianReinforcementTimer = 0;
      for (const [key, pending] of Object.entries(this.s.pending))
        if (pending.kind === 'mob' && pending.zone === z.id) delete this.s.pending[key];
      this.s.streak = { key: null, count: 0 };
      const site = R.treasuryRecovery.sites.find((s) => s.zone === z.id);
      if (site && this.treasuryCaptain(z, site)?.hp > 0) {
        const state = this.treasuryRecoveryState(site.region);
        state.unlocked = false;
        state.respawnAt = 0;
      }
    }

    enter(zone, arrival = null) {
      if (
        !D.regions.some((r) => r.id === zone) &&
        !dungeonIds.includes(zone) &&
        !this.supplyRoom(zone) &&
        !this.sideDungeon(zone)
      )
        return false;
      const previousZone = this.zoneId,
        previousRegion = this.definition().id,
        i = this.regionIndex(zone),
        p =
          arrival ||
          (this.supplyRoom(zone)
            ? R.treasuryEntry.spawn
            : this.sideDungeon(zone)
              ? { x: 120, y: 150 }
              : dungeonIds.includes(zone)
                ? R.interiorEncounterLayout?.[zone]?.entry ||
                  R.dungeonSpace?.[zone]?.exit || { x: 160, y: 240 }
                : { x: D.towns[i][0], y: D.towns[i][1] });
      this.clearPartyCharges();
      this.s.gatheringTarget = null;
      this.tacticalClearThreat(); // Transient observations never survive zone travel.
      this.tacticalClearBurst();
      this.tacticalClearRogueRegroup();
      this._tacticalScatter?.clear();
      this._tacticalScatterLeash?.clear();
      this._tacticalRepositions?.clear();
      this._tacticalPartyTargets?.clear();
      this.clearEncounterUnits();
      if (zone !== this.zoneId) this.resetDungeonDefenders();
      for (const oldZone of Object.values(this.s.zones))
        oldZone.props = oldZone.props.filter((p) => !p.garunTemporary && !p.garunPreview);
      this.s.zone = zone;
      this.noticeVisit++;
      this.clearPatrolResumes();
      this.zone();
      if (zone !== previousZone && this.isDungeon()) this.resetDungeonDefenders();
      // A camp choice belongs to its region. Crossing into another region
      // starts recovery at that region's refuge until a local camp is chosen.
      if (previousRegion !== this.definition().id) {
        this.s.barracksRespawn = null;
        if (zone === this.definition().id) this.setRefuge(zone, 'rest');
      }
      this.syncDungeonMasterStation();
      this.s.recallActive = false;
      this.s.squadEngagement = null;
      this.s.squadBoss = false;
      this.s.squadDoctrine = this.squadDefaultDoctrine();
      this.s.heroTarget = null;
      const transport = arrival?.transportId
        ? this.zone().npcs.find((n) => n.id === arrival.transportId && n.kind === 'transport')
        : null;
      if (arrival?.transportId && !transport) throw Error('Destination transport is missing');
      const landing = transport
        ? { x: transport.x + (arrival.dx || 0), y: transport.y + (arrival.dy || 0) }
        : p;
      const q = this.safe(landing.x, landing.y);
      Object.assign(this.hero, q);
      let arrivalSlot = 0;
      for (const u of this.activeParty()) {
        this.clearCompanionJudgment(u);
        const staging =
          this.supplyRoom(zone) && !arrival
            ? R.treasuryEntry.party[arrivalSlot++ % R.treasuryEntry.party.length]
            : null;
        Object.assign(u, this.safe(staging?.x ?? q.x + 40, staging?.y ?? q.y + 30));
        u.order = null;
        u.path = [];
      }
      this.hero.order = null;
      this.s.projectiles = [];
      this.s.hazards = [];
      for (const z of Object.values(this.s.zones)) {
        z.enemies = z.enemies.filter((e) => !e.summon);
        for (const e of z.enemies) {
          const thornReturn =
            e.family === 'thorn' && e.type === 'boss' && (e.aggro || e.returning || e.thornReturn);
          this.clearEncounterState(e);
          if (thornReturn) e.thornReturn = true;
          if (
            e.family === 'cindermaw' &&
            e.type === 'boss' &&
            (e.aggro || e.returning || e.cinderReturn)
          )
            e.cinderReturn = true;
          e.aggro = false;
          e.telegraph = null;
          e.sequence = [];
          e.motion = null;
          e.rangedAim = null;
          e.frozen = false;
          delete e.rogueDustCoverUntil;
          if (e.hp > 0) {
            if (!((['thorn', 'cindermaw'].includes(e.family) && e.type === 'boss') || e.veraEscort))
              Object.assign(e, e.home);
            e.hp = e.baseHp;
            e.maxHp = e.baseHp;
            e.damage = e.baseDamage;
          }
        }
      }
      for (const z of Object.values(this.s.zones)) this.clearVeraRepairs(z);
      this.activatePending();
      this.discover('arrival');
      const dungeonLore = R.dungeonLore?.[zone],
        loreKey = this.definition().id + ':dungeon-lore:' + zone;
      if (dungeonLore && !this.s.discovered[loreKey]) {
        this.s.discovered[loreKey] = true;
        this.say(dungeonLore);
        // Region-scoped quiet narration: full text remains in earned stories.
        this.notice(dungeonLore, 8, '', 'narration', {
          scope: 'region',
          region: this.definition().id,
        });
      }
      const side = this.sideDungeon();
      if (side && !this.s.discovered[side.region + ':side-lore:' + side.id]) {
        this.s.discovered[side.region + ':side-lore:' + side.id] = true;
        if (side.lore) {
          this.say(side.lore);
          // Retain the full earned story in Announcements; don't repeat
          // the in-world inspectable narrative in an oversized toast.
          this.notice(side.lore, 8, '', 'narration', {
            scope: 'region', region: side.region,
            silentWhenInspectable: !!R.narrativeSceneInspections?.[side.id]?.length,
          });
        }
        this.event('sideInteriorDiscovery', { id: side.id, region: side.region });
      }
      this.syncTreasuryRecovery(this.zone());
      return true;
    }
    travel(direction, options = null) {
      if (this.isDungeon() || ![1, -1].includes(direction)) return false;
      const i = this.regionIndex(),
        j = i + direction;
      if (j < 0 || j >= D.regions.length) return false;
      const edge = direction === 1 ? D.regions[i].id : D.regions[j].id;
      if (this.s.mode !== 'developer' && direction < 0 && !this.s.tickets[edge]) return false;
      const departureReason = this.lanternFerryReason(direction);
      if (departureReason) {
        this.say(departureReason);
        return false;
      }
      const work = options?.workPassage ? this.passageWorkQuote(direction) : null;
      if (options?.workPassage && !work) return false;
      const fare = work ? work.payment : this.travelFare(i, direction);
      if (this.hero.gold < fare) {
        this.say('Not enough crowns.');
        return false;
      }
      const before = clone(this.s),
        messageCount = this.messages.length,
        noticeState = {
          visit: this.noticeVisit,
          notices: [...this.notices],
          history: [...this.noticeHistory],
        },
        effectCount = this.effects.length,
        from = D.regions[i].id,
        to = D.regions[j].id,
        arrival = R.travelArrivals?.[from + '>' + to] || null;
      try {
        if (!this.enter(to, arrival)) throw Error('Invalid destination');
        this.payTravelFare(fare);
        if (direction === 1 && this.s.mode !== 'developer') {
          delete this.s.recovery[edge];
          this.s.tickets[edge] = true;
          this.s.lastEdge = edge;
        }
        this.event('travel', { from: before.zone, to: this.s.zone });
        if (work)
          this.say(
            'You help load and secure the crew’s supplies, working off ' +
              work.work +
              ' crowns of the fare. ' +
              work.payment +
              ' crowns paid; return passage is included.',
          );
        return true;
      } catch (_) {
        this.s = before;
        this.messages.length = messageCount;
        this.noticeVisit = noticeState.visit;
        this.notices = noticeState.notices;
        this.noticeHistory = noticeState.history;
        this.effects.length = effectCount;
        this.say('Travel could not complete. Your fare and progress were kept.');
        return false;
      }
    }
    hubDestinations() {
      if (this.isDungeon() || this.zoneId !== 'crown') return [];
      return D.regions.filter(
        (r) => r.id !== this.zoneId && (this.s.mode === 'developer' || this.s.zones[r.id]),
      );
    }
    travelHub(regionId) {
      if (this.isDungeon() || this.zoneId !== 'crown') return false;
      const targetIndex = D.regions.findIndex((r) => r.id === regionId);
      if (targetIndex < 0 || !this.hubDestinations().some((r) => r.id === regionId)) return false;
      const before = clone(this.s),
        messageCount = this.messages.length,
        noticeState = {
          visit: this.noticeVisit,
          notices: [...this.notices],
          history: [...this.noticeHistory],
        },
        effectCount = this.effects.length,
        arrival = R.travelArrivals?.['crown>' + regionId];
      try {
        if (!arrival || !this.enter(regionId, arrival)) throw Error('Invalid destination');
        this.event('travel', { from: before.zone, to: this.s.zone, hub: true });
        return true;
      } catch (_) {
        this.s = before;
        this.messages.length = messageCount;
        this.noticeVisit = noticeState.visit;
        this.notices = noticeState.notices;
        this.noticeHistory = noticeState.history;
        this.effects.length = effectCount;
        this.say('Travel could not complete. Your progress was kept.');
        return false;
      }
    }

    discover(key) {
      if (key === 'night-site' && !this.night()) return;
      const region = this.definition().id;
      this.s.discovered[region + ':' + key] = true;
      for (const n of this.zone().nodes.filter((n) => n.tribute && !n.hidden && n.site === key))
        this.s.discovered[region + ':tribute:' + n.tributeId] = true;
      this.checkQuests();
    }
    interact(npc) {
      if (
        !npc ||
        (npc.kind === 'rest' ? this.interactionDistance(npc) : dist(npc, this.hero)) > 115
      )
        return false;
      if (npc.thornReport || npc.thornTrail !== undefined || npc.thornFootprint) {
        const report = this.thornReport(!!npc.thornReport);
        this.say(report);
        if (npc.thornReport) this.notice('Trail witness', 6, report, 'narration');
        return true;
      }
      switch (npc.kind) {
        case 'scene-detail': {
          const descriptor = R.narrativeSceneInspections?.[this.zoneId]?.find(
            (item) => item.id === npc.id && item.narrativeId === npc.narrativeId,
          );
          if (!descriptor || !this.zone().npcs.includes(npc)) return false;
          // D04's private-quarters claim requires actual inspectable furniture.
          if (npc.id === 'veyra-private-quarters') {
            const furnishings = this.zone().props.find(
              (prop) => prop.structure === 'citadel-vanity-quarters' && dist(prop, npc) < 180,
            );
            if (!furnishings) return false;
            this.s.discovered['citadel:veyra-private-quarters-inspected'] = true;
          }
          return true;
        }
        case 'cage':
          if (
            (npc.lore || npc.context) &&
            !this.s.keys[npc.family] &&
            !this.s.rescued[npc.family] &&
            !this.peace
          ) {
            this.say(
              npc.lore ||
                npc.context +
                  ' Defeat ' +
                  this.boss(npc.family).name +
                  ' to free ' +
                  npc.name +
                  '.',
            );
            return false;
          }
          return this.rescue(npc.family);
        case 'critical-codex': {
          const side = this.sideDungeon();
          const def = R.criticalCodices?.[npc.sideCodex];
          if (!side || side.id !== npc.sideCodex || !def ||
              npc.id !== 'critical-codex-' + side.id ||
              !this.zone().npcs.includes(npc)) return false;
          this.s.criticalCodices ||= {};
          if (this.s.criticalCodices[side.id] === true) {
            this.say(def.name + ' has already been studied.');
            this.say(def.description);
            return true;
          }
          this.s.criticalCodices[side.id] = true;
          const learned = this.criticalCodexCount();
          this.say('Learned ' + def.name + ' · ' + learned + '/5 Codices of the Unforeseen.');
          this.say(def.description);
          const chance = (this.criticalPartyChance('hero') * 100).toFixed(0);
          this.notice(
            def.name + ' · +1 percentage point critical chance (' + chance + '%)',
            4.5, '', 'milestone', {
              textEs: def.nameEs + ' · +1 punto porcentual de probabilidad crítica (' +
                chance + '%)',
            },
          );
          this.event('criticalCodex', { id: side.id, count: learned, name: def.name });
          return true;
        }
        case 'supplier':
          return this.unloadCompanyTribute(npc) !== null;
        case 'rest':
          return this.rest(npc.id);
        case 'appointment':
          this.say('Choose the dungeon master through the appointment menu.');
          return false;
        case 'dungeon-master':
          this.say(npc.name + ' keeps the dungeon in peace, without new combat duties.');
          return true;
        case 'throne': {
          if (this.s.zone !== 'crown' || npc.id !== 'dark-crown-throne') return false;
          if (!this.s.true.darklord) {
            this.say('The Dark Lord still holds the throne.');
            return false;
          }
          if (this.s.throneClaimed) {
            this.say('You already hold the Crown.');
            return true;
          }
          if (this.refugeThreat()) {
            this.say('The throne cannot be claimed while enemies are engaged nearby.');
            return false;
          }
          this.s.throneClaimed = true;
          const remaining = dungeonIds.filter((id) => !this.s.true[id]).length;
          // The approved seven-mark throne recognition is revealed only here.
          // Current class and
          // prior TRUE-dungeon order do not change the lost companion fact.
          this.say(AuthorCopy.M01.en);
          this.say(
            remaining
              ? 'You claim the crown. ' + remaining + ' old powers still hold their dungeons.'
              : 'You claim the crown. The five former powers have already fallen.',
          );
          this.notice(AuthorCopy.M01.en, 8, '', 'milestone');
          this.event('throneClaimed', { remaining });
          this.checkEnding();
          return true;
        }
        case 'mini':
          this.checkMinis();
          this.say(this.miniStatus(npc.mini));
          return true;
        case 'bundle':
          if (npc.treasuryRecovery) return this.collectTreasuryRecovery(npc);
          this.checkMinis();
          if (
            this.supplyRoom() &&
            !this.peace &&
            (this.zone().enemies.some((e) => e.guard && e.hp > 0) ||
              Object.values(this.s.pending).some(
                (p) => p.kind === 'mob' && p.zone === this.s.zone && p.base.guard,
              ))
          ) {
            this.say('Clear the Treasury guards before recovering the caches.');
            return false;
          }
          if (npc.mini && !this.peace && !this.miniCleared(npc.mini)) {
            this.say(this.miniStatus(npc.mini));
            return false;
          }
          if (this.bundleCollected(npc)) return false;
          this.s.discovered[this.definition().id + ':bundle-' + npc.index] = true;
          this.say(npc.name + ' recovered.');
          this.event('supplies');
          this.checkQuests();
          return true;
        case 'resource':
          return this.gather(npc.id);
        case 'landmark': {
          const first = !this.s.discovered[this.definition().id + ':' + npc.id];
          this.discover(npc.id);
          this.say(this.siteDescription(npc));
          if (first) this.announceLandmark(npc);
          return true;
        }
        case 'exit': {
          const room = this.supplyRoom(),
            side = this.sideDungeon();
          if (side) {
            const entrance = this.s.zones[side.region]?.npcs.find(
              (n) => n.family === side.id || n.id === side.site,
            );
            return this.enter(side.region, entrance && { x: entrance.x + 45, y: entrance.y + 35 });
          }
          if (!room) {
            const region = this.definition().id,
              entrance = this.s.zones[region]?.npcs.find(
                (n) => n.kind === 'dungeon' && n.family === this.zoneId,
              );
            return this.enter(region, entrance && { x: entrance.x + 45, y: entrance.y + 35 });
          }
          const entrance = this.s.zones[room.region]?.npcs.find((n) => n.id === 'supply-entrance');
          return this.enter(room.region, entrance && { x: entrance.x + 35, y: entrance.y + 40 });
        }
        case 'dungeon':
          if (npc.sideDungeon) this.discover(npc.id);
          return this.enter(npc.family);
        case 'fountain':
          // Post-coronation Rest works even at a fountain consumed long ago.
          if (this.peace)
            return this.completeFinalRest('fountain', npc) || this.s.finalRestCompleted;
          if (this.refugeThreat()) {
            this.say('Cannot use the preparation fountain during nearby combat.');
            return false;
          }
          if (
            this.s.fountains[this.s.zone] ||
            this.zone().enemies.some((e) => e.guard && e.hp > 0) ||
            Object.values(this.s.pending).some(
              (p) => p.kind === 'mob' && p.zone === this.s.zone && p.base.guard,
            )
          )
            return false;
          this.s.fountains[this.s.zone] = true;
          this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + 0.6 * this.hero.maxHp);
          if (R.resourceMode.manaEnabled)
            this.hero.mp = Math.min(this.hero.maxMp, this.hero.mp + 0.6 * this.hero.maxMp);
          this.activeParty().forEach((u) => {
            if (u.hp > 0) u.hp = Math.min(u.maxHp, u.hp + 0.6 * u.maxHp);
          });
          return true;
        default:
          return false;
      }
    }
    questId(i) {
      return 'quest-' + i;
    }
    questDefs() {
      const onboarding = {
        id: 'quest-barracks',
        region: 'vale',
        name: 'Your First Company',
        objective:
          'Meet the town Captain, try Recall squad, then establish your first Basic Barracks (free).',
        gold: 0,
        xp: 0,
        index: -1,
        kind: 'barracks',
        target: 1,
        tutorial: true,
      };
      return [
        onboarding,
        ...D.quests.map((q, i) => {
          const rule = R.quests[i],
            room = rule.kind === 'bundles' ? R.supplyRooms.find((r) => r.region === q[0]) : null;
          return {
            id: this.questId(i),
            region: q[0],
            name: q[1],
            objective: q[2],
            gold: q[3],
            xp: q[4],
            index: i % 6,
            ...rule,
            target: room ? room.count : rule.target,
            objective:
              (room ? room.objective : q[2]) + (rule.clear ? '; clear compound guards' : ''),
          };
        }),
      ];
    }
    initializeQuests() {
      for (const q of this.questDefs()) {
        if (!this.s.quests[q.id]) {
          const alreadyBuilt = q.kind === 'barracks' && this.hasCompletedBarracks();
          this.s.quests[q.id] = {
            active: !alreadyBuilt,
            count: alreadyBuilt ? 1 : 0,
            done: alreadyBuilt,
            paid: alreadyBuilt,
          };
        }
        const p = this.s.quests[q.id];
        if (!p.closedByPeace && !p.paid) p.active = true;
      }
    }
    accept(id) {
      const q = this.questDefs().find((q) => q.id === id);
      if (!q) return false;
      this.initializeQuests();
      this.checkQuests();
      return true;
    }

    checkQuests() {
      this.initializeQuests();
      for (const q of this.questDefs()) {
        const p = this.s.quests[q.id];
        if (p.closedByPeace) continue;
        if (!p.done) {
          const seen = (id) => this.s.discovered[q.region + ':' + id];
          p.done =
            q.kind === 'barracks'
              ? this.hasCompletedBarracks()
              : q.kind === 'rescue'
                ? !!this.s.rescued[q.target] && (!q.clear || this.miniCleared(q.clear, q.region))
                : q.kind === 'patrol'
                  ? p.count >= q.target
                  : q.kind === 'bundles'
                    ? Array.from({ length: q.target }, (_, j) => j).every((j) =>
                        seen('bundle-' + j),
                      )
                    : q.kind === 'escort'
                      ? !!seen('escort')
                      : q.kind === 'night'
                        ? p.count >= q.target && q.sites.every(seen)
                        : q.kind === 'sites'
                          ? q.sites.filter(seen).length >= (q.minSites || q.sites.length) &&
                            (!q.requiresRescues ||
                              q.requiresRescues.every((id) => this.s.rescued[id]))
                          : false;
        }
        if (p.done) this.payQuest(q, p);
      }
    }
    claim(id) {
      const q = this.questDefs().find((q) => q.id === id),
        p = this.s.quests[id];
      return this.payQuest(q, p);
    }

    engage(e, forced = true, spreadPack = true) {
      if (this.awaitsHeroAttack(e)) return false;
      if (e.aggro || e.neutral || e.returning || e.thornReturn || e.cinderReturn) return false;
      if ((this.s.mercyTime || 0) > 0 && !forced && !e.mercyProvoked) return false;
      this.capturePatrolResume(e);
      if (this.roamingBoss(e)) {
        e.path = [];
        e.routeAge = 0;
      }
      e.aggro = true;
      if (this.thornPatroller(e)) e.thornFightAnchor = { x: e.x, y: e.y };
      if (this.cinderPatroller(e)) e.cinderFightAnchor = { x: e.x, y: e.y };
      if (e.veraEscort) e.veraFightAnchor = { x: e.x, y: e.y };
      e.frozen = true;
      delete e.idleWanderTarget;
      e.idleWanderWait = 0;
      const m = e.eliteNightBonus || this.multipliers(),
        ratio = e.hp / e.maxHp;
      e.maxHp = e.baseHp * m.hp;
      e.hp = e.maxHp * ratio;
      e.damage = e.baseDamage * m.damage;
      e.fightStart = this.s.time;
      if (e.type === 'boss' && e.family === 'mire') e.mireLowestHpRatio = 1;
      if (e.family === 'ridge' && e.type === 'boss') {
        e.ledgerOpen = true;
        e.ledgerNextAt = this.s.time + 12;
        e.ledgerMarkUntil = 0;
      }
      if (e.family === 'warlord' && e.type === 'boss') {
        // Ash hangs at its birthplace; the Warlord never drags a moving cloud.
        e.ashCloud = { x: e.x, y: e.y, expires: this.s.time + 6 };
        e.ashNextAt = this.s.time + 18;
      }
      e.heroParticipated = false;
      e.noProgress = 0;
      if (e.type === 'boss' && e.form === 'true') {
        const first = !e.trueEntourageSpawned;
        e.trueEntourageSpawned = true;
        this.summonBossAdds(e, this.trueSummonPlan(e), this.bossSummonCap(e));
        if (first) this.say(e.name + ' calls a TRUE warband.');
      }
      if (spreadPack && !(e.veraEscort && this.veraHeld()))
        for (const ally of this.zone().enemies)
          if (ally.pack && ally.pack === e.pack && ally.hp > 0 && !ally.aggro)
            this.engage(ally, false);
      // Treasury guards' pack IDs describe formation posts, not independent
      // allegiances. Assaulting a live guard alerts its captain across posts.
      if (e.roomGuard && !e.roomCaptain && this.supplyRoom()) {
        const captain = this.zone().enemies.find(
          (u) => u.roomCaptain && u.hp > 0 && !u.neutral && !u.returning,
        );
        if (captain && !captain.aggro) this.engage(captain, true, false);
      }
    }

    die(cause = null) {
      // Endure is per life; a genuine defeat starts a new one, never an infinite loop.
      if (this.hero.class === 'rogue') {
        this.hero.rogueEndureUsed = false;
        delete this.hero.rogueEndureUntil;
      }
      if (this.s.mode === 'arena') {
        this.s.statistics.deaths++;
        this.arenaSelectStage('hub');
        this.arenaRest();
        this.say('Combat Arena: returned to the safe hub after defeat.');
        return;
      }
      this.clearPatrolResumes();
      this.clearPartyCharges();
      for (const z of Object.values(this.s.zones)) this.clearVeraRepairs(z);
      for (const z of Object.values(this.s.zones))
        z.props = z.props.filter((p) => !p.garunTemporary && !p.garunPreview);
      this.clearEncounterUnits();
      this.tacticalClearRogueRegroup();
      this._tacticalScatter?.clear();
      this._tacticalScatterLeash?.clear();
      this.tacticalClearThreat();
      this._tacticalRepositions?.clear();
      this.tacticalClearBurst();
      this._tacticalPartyTargets?.clear();
      this.clearTonic();
      this.hero.supportEffects = [];
      this.hero.shieldStance = 0;
      this.hero.shieldRank = 0;
      delete this.hero.silenceField;
      for (const u of [this.hero, ...this.s.party]) {
        delete u.wardUntil;
        delete u.wardReduction;
        delete u.rangerRallyUntil;
        delete u.rangerRallyZone;
        delete u.rangerRallyMovement;
        delete u.rangerRallyAttack;
      }
      for (const u of this.s.party) u.supportEffects = [];
      const goldLost = this.applyDeathPenalty();
      this.s.statistics.deaths++;
      this.s.streak = { key: null, count: 0 };
      this.s.projectiles = [];
      this.s.hazards = [];
      this.event('death', { goldLost, region: this.definition().id, ...(cause ? { cause } : {}) });
      if (goldLost) this.say('Defeat penalty: lost ' + goldLost + ' crowns.');
      if (this.s.lastEdge) this.s.recovery[this.s.lastEdge] = true;
      for (const z of Object.values(this.s.zones))
        for (const e of z.enemies) {
          if (e.family === 'thorn' && e.type === 'boss' && (e.aggro || e.returning))
            e.thornReturn = true;
          if (e.family === 'cindermaw' && e.type === 'boss' && (e.aggro || e.returning))
            e.cinderReturn = true;
          this.clearEncounterState(e);
          delete e.rogueDustCoverUntil;
          e.telegraph = null;
          e.sequence = [];
          e.motion = null;
          e.rangedAim = null;
          e.aggro = false;
        }
      if (this.s.challenge.succession) {
        const challenge = this.s.challenge;
        if (!challenge.fallen.includes(this.hero.class)) challenge.fallen.push(this.hero.class);
        this.hero.hp = 0;
        challenge.pending = true;
        const remaining = Object.keys(classes).filter((id) => !challenge.fallen.includes(id));
        if (!remaining.length) {
          challenge.pending = false;
          challenge.gameOver = true;
          this.say('Your last successor has fallen. Game over.');
          this.event('gameOver');
        } else if (remaining.length === 1) this.successor(remaining[0]);
        else
          this.say(
            'Choose a successor from the remaining classes. Crowns and world progress are preserved.',
          );
        return;
      }
      this.hero.hp = this.hero.maxHp;
      if (R.resourceMode.manaEnabled) this.hero.mp = this.hero.maxMp;
      this.hero.tonic = false;
      this.hero.immune = 0;
      this.hero.slow = 0;
      delete this.hero.slowStacks;
      delete this.hero.rogueSlow;
      this.hero.haste = 0;
      const chosen = this.selectedBarracksRespawn();
      if (chosen) {
        this.enter(chosen.zone, { x: chosen.barracks.x + 85, y: chosen.barracks.y + 50 });
        this.say('Recovered at your selected barracks in ' + this.definition().name + '.');
      } else {
        if (this.s.barracksRespawn) this.s.barracksRespawn = null;
        const region = this.definition().id,
          refuge = clone(
            this.s.refugeSite?.zone === region ? this.s.refugeSite : { zone: region, id: 'rest' },
          );
        this.enter(refuge.zone);
        this.setRefuge(refuge.zone, refuge.id);
        this.arriveRefuge(refuge);
        this.say('Returned to your refuge. Learning and rescue progress are safe.');
      }
      this.notice(
        'Defeated · Recovered at ' + (chosen ? 'your barracks' : 'your refuge'),
        6,
        (goldLost
          ? goldLost +
            ' crowns lost. Recover ' +
            this.treasuryLostCrowns() +
            ' accumulated crowns at ' +
            this.treasuryRecoverySite().name +
            '. '
          : '') + 'Your progress is safe.',
        'warning',
      );
    }
    heroBasicAttackApproachRange() {
      const reach = basicAttackApproachRanges[this.hero.class];
      if (!Number.isFinite(reach)) throw Error('Missing basic attack approach range');
      return reach;
    }
    // Called only when class changes: preserve every owned companion, but
    // never permit an inherited larger army to violate the successor's save.
    normalizeSuccessorCompany() {
      const active = this.s.party.filter((u) => u.active !== false),
        overflow = active.length - this.expeditionPartyCap();
      if (overflow <= 0) return 0;
      for (const u of active.slice(-overflow)) {
        this.clearPartyCharge(u);
        this.clearCompanionJudgment(u);
        u.active = false;
        u.order = null;
        u.path = [];
      }
      this.say(overflow + ' inherited companion' + (overflow === 1 ? '' : 's') + ' moved to reserve.');
      return overflow;
    }
    successor(heroClass) {
      if (
        !this.s.challenge.succession ||
        !this.s.challenge.pending ||
        this.s.challenge.fallen.includes(heroClass) ||
        !classes[heroClass]
      )
        return false;
      const old = this.hero,
        fresh = new Campaign(this.s.mode, heroClass, this.random, { succession: true }).hero;
      for (const key of ['gold', 'weapon', 'armorTier', 'reforges', 'potions'])
        fresh[key] = clone(old[key]);
      fresh.tonicStock = this.preparationTonicStock();
      for (const key of [
        'customWeaponName',
        'customArmorName',
        'legacyWeaponPower',
        'legacyWeaponName',
        'legacyPotions',
        'legacyEquipped',
        'weaponSelection',
      ])
        if (old[key] !== undefined) fresh[key] = clone(old[key]);
      this.s.hero = fresh;
      this.resetBasicCombo();
      this.normalizeSuccessorCompany();
      this.syncCompanionLevelStats();
      this.s.challenge.pending = false;
      this.s.refuge = 'vale';
      this.s.refugeSite = { zone: 'vale', id: 'rest', x: 300, y: 350 };
      this.s.party.forEach((u) => {
        u.cd = 1;
        u.order = null;
      });
      this.enter('vale');
      this.event('successor', { class: heroClass });
      this.say(
        'Your ' + heroClass + ' successor begins at level 1. The world remembers your progress.',
      );
      return true;
    }

    victory(family, form) {
      const key = family + ':' + form;
      if (this.s.victories[key]) return false;
      this.s.victories[key] = true;
      if (form === 'normal') this.s.normal[family] = true;
      else this.s.true[family] = true;
      if (form === 'true' && this.s.phase === 'awakening' && dungeonIds.includes(family))
        this.s.late[family] = true;
      return true;
    }
    kill(e) {
      if (e.deathPaid) return;
      if (e.family === 'mine' && e.type === 'boss')
        this.zone().props = this.zone().props.filter((p) => !p.garunTemporary && !p.garunPreview);
      this.tacticalClearThreat(e);
      this.tacticalClearBurst(e);
      this.tacticalClearRogueRegroup(e);
      this._tacticalScatterLeash?.delete(e.id);
      this._tacticalRepositions?.delete(e.id);
      e.slow = 0;
      delete e.slowStacks;
      delete e.rogueDustCoverUntil;
      const victoryLevel = this.hero.level;
      this.cancelEncounter(e);
      e.deathPaid = true;
      e.aggro = false;
      e.telegraph = null;
      e.motion = null;
      e.rangedAim = null;
      delete e.ashCloud;
      delete e.ashNextAt;
      delete e.ledgerOpen;
      delete e.ledgerMarkedId;
      delete e.ledgerMarkUntil;
      if (e.hookedVictim) {
        const held =
          e.hookedVictim === 'hero' ? this.hero : this.s.party.find((u) => u.id === e.hookedVictim);
        if (held) held.keeperHeld = null;
        e.hookedVictim = null;
      }
      if (e.deathRoll) {
        const victim =
          e.deathRoll.victim === 'hero'
            ? this.hero
            : this.s.party.find((u) => u.id === e.deathRoll.victim);
        if (victim) victim.deathRollHeld = false;
        e.deathRoll = null;
      }
      e.sequence = [];
      if (e.rogueEmergencyReinforcement) this._tacticalEmergencyCleanupPending = true;
      if (e.form === 'ringleader') this.tacticalRetireEmergencyGuards(e);
      if (this.s.mode === 'arena' && e.arenaFixture) {
        // Retain native combat behavior; suppress only campaign reward/progress.
        this.zone().enemies.forEach((add) => {
          if (add.summon && add.owner === e.id) add.hp = 0;
        });
        return;
      }
      if (e.summon) {
        if (e.developerSummon)
          this.zone().enemies.forEach((add) => {
            if (add.summon && add.owner === e.id) add.hp = 0;
          });
        return;
      }
      this.s.statistics.kills++;
      // One hero-involved monster kill ends the Vale's opening protection,
      // even while the hero is still level 1. A hit alone does not unlock it.
      if (e.heroParticipated && !e.neutral) this.s.valeFieldAwakened = true;
      this.awardEnemyReward(e);
      this.treasuryCaptainDefeated(e);
      for (const q of this.questDefs().filter((q) => q.region === this.definition().id)) {
        const p = this.s.quests[q.id];
        if (
          p &&
          !p.closedByPeace &&
          !p.done &&
          ((q.kind === 'patrol' && e.type === 'mob' && !e.guard && !this.isDungeon()) ||
            (q.kind === 'night' && e.species === 'wraith' && e.nightOnly && this.night()))
        )
          p.count++;
      }
      this.checkQuests();
      if ((e.captain || e.roomCaptain) && !e.summon)
        this.zone().enemies.forEach((a) => {
          if (a.summon && a.owner === e.id) a.hp = 0;
        });
      if (e.type === 'boss') {
        const b = this.boss(e.family);
        const petWasUnlocked = this.petUnlocked(e.family);
        const firstVictory = this.victory(e.family, e.form);
        if (
          e.form === 'true' &&
          !petWasUnlocked &&
          !e.summon &&
          !e.developerSummon &&
          this.petDefinition(e.family)
        ) {
          const pet = this.petDefinition(e.family);
          this.say(pet.name + ' unlocked permanently · meet your boss pet at any Barracks.');
          this.notice('BOSS PET UNLOCKED · ' + pet.name, 6);
        }
        this.s.statistics.bossSeconds[e.family + ':' + e.form] = Math.round(
          this.s.time - (e.fightStart || this.s.time),
        );
        if (e.form === 'normal') this.s.keys[e.family] = true;
        if (b.kind === 'dungeon') {
          if (e.form === 'normal' && !(e.family in this.s.earlyRoll)) {
            this.s.earlyRoll[e.family] = this.random() < 1 / 3;
            if (this.s.earlyRoll[e.family] || this.s.phase === 'awakening')
              this.s.pending[e.family] = { kind: 'dungeon', count: 1 };
          }
          if (e.form === 'true') delete this.s.pending[e.family];
        } else if (e.family === 'darklord' && e.form === 'true') {
          delete this.s.pending.darklord;
          this.awaken(victoryLevel);
        }
        this.zone().enemies.forEach((a) => {
          if (a.summon && a.owner === e.id) a.hp = 0;
        });
        this.say(e.name + ' defeated.');
        if (dungeonIds.includes(this.zoneId) && e.family === this.zoneId)
          this.emptyDungeonDefenders(e);
        if (firstVictory && e.form === 'normal') this.notice('BOSS VANQUISHED · ' + b.name, 5.5);
        this.event('bossDefeat', { family: e.family, form: e.form });
      }
      if (e.captain || e.roomCaptain) this.s.streak = { key: null, count: 0 };
      else if (e.heroParticipated) {
        if (
          e.type === 'boss' &&
          e.form === 'normal' &&
          (this.boss(e.family)?.kind === 'field' || e.family === 'darklord')
        )
          this.fieldBossStreak(e);
        else this.streak(e);
      }
      if (
        !this.peace &&
        e.type === 'boss' &&
        this.boss(e.family).kind === 'field' &&
        e.form === 'normal'
      )
        e.respawn = 120;
      else if (
        !this.peace &&
        e.type === 'boss' &&
        this.boss(e.family).kind === 'field' &&
        e.family !== 'darklord' &&
        e.form === 'true'
      )
        e.respawn = 120;
      if (e.type === 'boss' && this.boss(e.family).kind === 'field') {
        for (const other of this.zone().enemies)
          if (other !== e && other.family === e.family) other.respawn = 0;
        if (e.form === 'true') delete this.s.pending[e.family];
        else if (this.s.pending[e.family]) e.respawn = 0;
      }
      if (this.thornPatroller(e)) {
        const n = this.thornCaptive();
        // The same Mira waits at her last physical position, never at a cloned cage.
        if (n) {
          delete n.path;
        }
      }
      this.checkClear();
      this.checkMinis();
      this.checkEnding();
      if (e.type === 'boss' && dungeonIds.includes(this.s.zone)) this.syncDungeonMasterStation();
    }
    fieldBossStreak(e) {
      if (
        this.peace ||
        e.type !== 'boss' ||
        e.form !== 'normal' ||
        (this.boss(e.family)?.kind !== 'field' && e.family !== 'darklord')
      )
        return;
      const key = e.family,
        required = key === 'darklord' ? 1 : 2,
        current = this.s.fieldBossKills?.[key] || 0,
        count = Math.min(required, current + 1);
      this.s.fieldBossKills = this.s.fieldBossKills || {};
      this.s.fieldBossKills[key] = count;
      if (count < required || this.s.true[key] || this.s.pending[key]) return;
      this.s.pending[key] = {
        kind: 'field',
        count: 1,
        zone: this.s.zone,
        base: clone(e),
        delay: 5,
      };
      this.event('eliteWarning', { family: key });
      this.say(this.boss(key).name + ' has revealed its TRUE presence.');
      this.notice(this.boss(key).name + ' TRUE will emerge in 5 seconds', 5.5, '', 'warning');
    }
    streak(e) {
      if (this.peace || e.summon || e.type === 'boss' || e.captain || e.roomCaptain) {
        this.s.streak = { key: null, count: 0 };
        return;
      }
      if (e.form !== 'normal') {
        this.s.streak = { key: null, count: 0 };
        return;
      }
      const key = e.family || e.species;
      if (this.s.streak.key !== key) this.s.streak = { key, count: 1 };
      else this.s.streak.count++;
      if (this.s.streak.count < 2) return;
      this.s.streak = { key: null, count: 0 };
      if (this.s.pending[key]) return;
      if (e.type === 'boss' && this.boss(e.family).kind !== 'field') return;
      if (e.family === 'darklord' && this.s.true.darklord) return;
      this.s.pending[key] = {
        kind: e.type === 'boss' ? 'field' : 'mob',
        count: e.type === 'boss' ? 1 : this.random() < 0.5 ? 2 : 1,
        zone: this.s.zone,
        base: clone(e),
        delay: e.type === 'boss' ? 5 : 2,
        ...(e.nightOnly ? { nightBonus: this.multipliers() } : {}),
      };
      this.event('eliteWarning', { family: key });
    }
    returnGuardians(id) {
      const z = this.zone();
      if (z.awakenedGuardWave === this.s.awakeningLevel) return;
      z.awakenedGuardWave = this.s.awakeningLevel;
      z.enemies = z.enemies.filter((e) => !e.guard && !e.summon);
      for (const [key, p] of Object.entries(this.s.pending))
        if (p.kind === 'mob' && p.zone === id && p.base.guard) delete this.s.pending[key];
      const i = this.regionIndex(),
        aw = R.awakenedGuardianScaling,
        count = this.dungeonGuardCount(id);
      for (let j = 0; j < count; j++) {
        const g = this.dungeonGuardBlueprint(id, j),
          sp = g.sp,
          p = this.safe(g.x, g.y, id),
          e = this.makeEnemy(
            {
              species: sp[0],
              name: 'Awakened ' + g.name,
              icon: sp[2],
              level: this.s.awakeningLevel,
              hp: Math.round((120 + 35 * this.s.awakeningLevel) * aw.hp),
              damage: Math.round((12 + this.s.awakeningLevel) * aw.damage),
              gold: 0,
              xp: 0,
            },
            p,
          );
        e.guard = true;
        e.awakenedGuard = true;
        e.pack = id + '-awakened-' + g.pack;
        if (g.role) e.forcedRole = g.role;
        this.configureEnemy(e, j);
        z.enemies.push(e);
      }
      z.guardianBalanceVersion = 0;
      this.guardianPopulation(z);
      z.guardRewardsVersion = 0;
      this.guardianRewards(z);
      this.say('The guardians have returned at level ' + this.s.awakeningLevel + '.');
    }
    activatePending() {
      if (this.peace) return;
      const p = this.s.pending[this.s.zone];
      if (this.isDungeon() && p && !this.s.true[this.s.zone]) {
        if (this.s.phase === 'awakening' && !this.s.awakeningLevel)
          this.s.awakeningLevel = this.hero.level + 2;
        let e = this.zone().enemies.find((e) => e.type === 'boss' && e.form === 'true' && e.hp > 0),
          appeared = false;
        if (!e) {
          e = this.bossEnemy(this.boss(this.s.zone), 'true', this.dungeonBossHome());
          this.zone().enemies.push(e);
          appeared = true;
        }
        if (this.s.phase === 'awakening') {
          e.level = this.s.awakeningLevel;
          if (e.awakeningStatsLevel !== e.level) {
            const def = this.bossEnemy(this.boss(this.s.zone), 'true', e.home),
              fraction = e.hp / e.maxHp,
              hpMultiplier = e.maxHp / e.baseHp,
              damageMultiplier = e.damage / e.baseDamage;
            e.baseHp = def.baseHp;
            e.maxHp = def.baseHp * hpMultiplier;
            e.hp = e.maxHp * fraction;
            e.baseDamage = def.baseDamage;
            e.damage = def.baseDamage * damageMultiplier;
            e.awakeningStatsLevel = e.level;
          }
          this.returnGuardians(this.s.zone);
        }
        if (appeared) this.resetDungeonDefenders();
        p.active = true;
        this.s.origins[this.s.zone] = this.s.phase === 'adventure' ? 'early' : 'awakening';
        this.say(this.boss(this.s.zone).name + ' TRUE waits in the chamber.');
      }
    }
    awaken(victoryLevel = this.hero.level) {
      if (this.s.phase === 'peace') return;
      this.s.awakeningLevel = this.s.awakeningLevel || victoryLevel + 2;
      this.s.phase = 'awakening';
      this.s.awakeningAck = false;
      this.s.streak = { key: null, count: 0 };
      for (const z of Object.values(this.s.zones))
        for (const e of z.enemies) if (e.family === 'darklord') e.hp = 0;
      for (const id of dungeonIds) {
        if (this.s.true[id]) continue;
        if (this.s.normal[id]) this.s.pending[id] = { kind: 'dungeon', count: 1 };
        const z = this.s.zones[id];
        if (z)
          for (const e of z.enemies)
            if (e.form === 'true' && e.hp > 0) {
              const upgraded = this.bossEnemy(this.boss(id), 'true', e.home);
              upgraded.id = e.id;
              Object.assign(e, upgraded);
            }
      }
      this.say(
        'The Dark Lord has fallen. His throne stands empty, but the realm is not yet yours.',
      );
      this.refreshNPCs();
      this.notice('DARK CROWN · Claim the Throne in the fortress courtyard', 6.5);
      this.event('awakening', { level: this.s.awakeningLevel });
      this.checkEnding();
    }
    checkClear() {
      if (!this.isDungeon()) return;
      const z = this.zone(),
        id = this.s.zone;
      if (
        !this.s.paid['clear:' + id] &&
        this.s.normal[id] &&
        !z.enemies.some((e) => e.guard && e.hp > 0) &&
        !Object.values(this.s.pending).some(
          (p) => p.kind === 'mob' && p.zone === id && p.base.guard,
        )
      ) {
        this.s.paid['clear:' + id] = true;
        this.grant(this.dungeonClearReward(id), 0);
        this.say('Dungeon first clear reward earned.');
        this.notice(this.boss(id).place + ' · halls secured', 5.5, '', 'milestone', {
          scope: 'region',
          region: this.definition().id,
        });
      }
    }
    checkEnding() {
      // Previously earned TRUE victories count; peace cannot start until
      // coronation occurs through the actual fortress throne interaction.
      if (
        this.s.true.darklord &&
        this.s.throneClaimed &&
        dungeonIds.every((id) => this.s.true[id])
      ) {
        if (this.peace) return;
        this.s.phase = 'peace';
        this.s.endingAck = false;
        this.s.finalRestCompleted = false;
        this.s.streak = { key: null, count: 0 };
        this.s.pending = {};
        this.s.projectiles = [];
        this.s.hazards = [];
        this.hero.order = null;
        this.s.party.forEach((u) => (u.order = null));
        if (this.s.mode === 'nightmare') {
          this.s.nightmareIntroRemaining = 0;
          this.s.victoryDawnRemaining = R.dayCycle.twilightSeconds;
          this.s.clock = R.dayCycle.seconds - R.dayCycle.twilightSeconds;
        }
        for (const z of Object.values(this.s.zones)) {
          this.makeHabitat(z);
          this.syncDungeonMasterStation(z);
        }
        for (const q of this.questDefs()) {
          const p = this.s.quests[q.id];
          if (
            p &&
            !p.done &&
            (['patrol', 'night', 'escort'].includes(q.kind) ||
              (q.clear && !this.miniCleared(q.clear, q.region)))
          ) {
            p.closedByPeace = true;
            p.active = false;
          }
        }
        this.say('The five old powers have fallen. The realm is peaceful. It is time to rest.');
        this.event('peace');
      }
    }
    makeHabitat(z) {
      if (z.habitat) return;
      z.habitat = true;
      z.enemies = [];
      if (this.supplyRoom(z.id)) return;
      const i = this.regionIndex(z.id),
        side = this.sideDungeon(z.id),
        dungeon = dungeonIds.includes(z.id),
        count = side ? 5 : dungeon ? 4 : [8, 10, 12, 14, 16][i];
      for (let j = 0; j < count; j++) {
        const sp = D.species[i][Math.floor(j / 2) % 2],
          size = side ? side.size || 1100 : dungeon ? this.zoneSize() : D.regions[i].size,
          p = this.safe(
            350 + ((Math.floor(j / 2) * 337) % (size - 600)) + (j % 2) * 55,
            400 + ((Math.floor(j / 2) * 277) % (size - 650)),
            z.id,
          );
        const e = this.makeEnemy(
          {
            species: sp[0],
            name: sp[1] + ' resident',
            icon: sp[2],
            level: 1,
            hp: 1,
            damage: 0,
            gold: 0,
            xp: 0,
          },
          p,
        );
        e.neutral = true;
        z.enemies.push(e);
      }
      if (!dungeon && !side) {
        const b = D.bosses.find((b) => b.region === z.id && b.kind === 'field');
        if (b) {
          const p = this.fieldCenter(i),
            e = this.bossEnemy(b, 'normal', p);
          e.neutral = true;
          z.enemies.push(e);
        }
      }
    }
    tick(dt, input = { x: 0, y: 0 }) {
      if (
        !Number.isFinite(dt) ||
        dt <= 0 ||
        this.s.challenge?.pending ||
        this.s.challenge?.gameOver
      )
        return;
      this.advancePartyChargeClock(dt);
      dt = Math.min(dt, 0.1);
      this.s.time += dt;
      this.advanceResourceExpeditions();
      this.s.mercyTime = Math.max(0, (this.s.mercyTime || 0) - dt);
      if (this.s.mercyTime < 1e-9) this.s.mercyTime = 0;
      this.s.restCooldown = Math.max(0, (this.s.restCooldown || 0) - dt);
      this.advanceDaylight(dt);
      const h = this.hero,
        z = this.zone(),
        formationStart = { x: h.x, y: h.y };
      z.clock += dt;
      if (z.id === 'mine')
        z.props = z.props.filter(
          (p) =>
            (!p.garunTemporary && !p.garunPreview) ||
            (p.expiresAt > this.s.time &&
              !this.peace &&
              z.enemies.some((e) => e.family === 'mine' && e.hp > 0)),
        );
      // No capture may outlive its owner through death, dungeon transitions or a loaded save.
      for (const unit of [h, ...this.s.party]) {
        if (
          unit.keeperHeld &&
          !z.enemies.some((e) => e.id === unit.keeperHeld && e.hp > 0 && e.aggro)
        )
          unit.keeperHeld = null;
        if (
          unit.deathRollHeld &&
          !z.enemies.some(
            (e) =>
              e.family === 'mire' &&
              e.hp > 0 &&
              e.deathRoll &&
              e.deathRoll.victim === (unit === h ? 'hero' : unit.id),
          )
        )
          unit.deathRollHeld = false;
      }
      const heroRecovery = this.cooldownRecoveryElapsed(h, dt),
        heroSpecialRecovery = this.cooldownRecoveryElapsed(h, dt, false, true);
      h.cd = h.cd.map((c) => Math.max(0, c - heroSpecialRecovery));
      h.chargedCd = h.chargedCd.map((c) => Math.max(0, c - heroSpecialRecovery));
      h.basicCd = Math.max(0, h.basicCd - heroRecovery);
      if ((h.shieldStance || 0) > 0) {
        h.shieldStance = Math.max(0, h.shieldStance - dt);
        if (h.shieldStance === 0) {
          h.shieldRank = 0;
          h.cd[2] = this.skillCooldown(3);
        }
      }
      if (
        h.silenceField &&
        (h.silenceField.until <= this.s.time || h.silenceField.zone !== this.zoneId)
      )
        delete h.silenceField;
      for (const f of ['immune', 'haste', 'potionCd', 'slow']) h[f] = Math.max(0, h[f] - dt);
      if (!h.slow) delete h.slowStacks;
      if (h.rogueSlow > 0) {
        h.rogueSlow = Math.max(0, h.rogueSlow - dt);
        if (!h.rogueSlow) delete h.rogueSlow;
      }
      for (const u of this.s.party) {
        const recovery = this.cooldownRecoveryElapsed(u, dt);
        if (!u.keeperHeld) u.healCd = Math.max(0, (u.healCd || 0) - recovery);
        u.manaCd = Math.max(0, (u.manaCd || 0) - recovery);
        u.survivalCd = Math.max(0, (u.survivalCd || 0) - recovery);
        u.immune = Math.max(0, (u.immune || 0) - dt);
      }
      this.syncCompanionLevelStats();
      if (h.deathRollHeld || h.keeperHeld) {
        h.order = null;
      } else if (this.tacticalAdvanceScatter(h, dt)) {
        h.order = null;
      } else if (input.x || input.y) {
        h.order = null;
        const n = Math.hypot(input.x, input.y),
          speed =
            this.heroMoveSpeed() *
            (h.haste > 0 ? 1.25 : 1) *
            this.slowMovementFactor(h) *
            this.mireBogMovementFactor(h) *
            this.ashMovementFactor(h) *
            clamp(input.speedFactor || 1, 1, 1.35);
        this.move(h, { x: h.x + (input.x / n) * speed, y: h.y + (input.y / n) * speed }, speed, dt);
      } else if (h.order) {
        const pendingSkill = h.order.type === 'skill-approach' ? h.order : null;
        if (pendingSkill) {
          const target = z.enemies.find(
            (e) =>
              e.id === pendingSkill.id &&
              e.hp > 0 &&
              !e.neutral &&
              !e.returning &&
              this.tacticalDirectTargetable(e),
          );
          if (!target || pendingSkill.zone !== this.zoneId || h.hp <= 0) {
            h.order = null;
          } else {
            const range = this.heroSkillRange(pendingSkill.slot, pendingSkill.charged);
            if (dist(h, target) <= range && this.line(h, target)) {
              // Cast through the ordinary resolver only after truly reaching
              // the target, preserving all skill costs, interrupts and cooldowns.
              h.order = null;
              this.cast(
                pendingSkill.slot,
                target.id,
                pendingSkill.charged,
                pendingSkill.encountersAtStart,
              );
            } else {
              const before = { x: h.x, y: h.y },
                speed =
                  this.heroMoveSpeed() *
                  (h.haste > 0 ? 1.25 : 1) *
                  this.slowMovementFactor(h) *
                  this.mireBogMovementFactor(h) *
                  this.ashMovementFactor(h);
              this.follow(h, target, speed, dt, Math.max(0, range - 15));
              if (dist(h, before) < 0.1) pendingSkill.stalled += dt;
              else pendingSkill.stalled = 0;
              // An unreachable foe never traps the player in an endless order.
              if (pendingSkill.stalled >= 2) h.order = null;
            }
          }
        } else {
          const target =
            h.order.type === 'attack'
              ? z.enemies.find((e) => e.id === h.order.id && this.tacticalDirectTargetable(e))
              : h.order;
          if (
            target &&
            !target.neutral &&
            (h.order.type !== 'attack' || (target.hp > 0 && this.tacticalDirectTargetable(target)))
          ) {
            if (
              dist(h, target) >
              (h.order.type === 'attack' ? this.heroBasicAttackApproachRange() : 25)
            )
              this.follow(
                h,
                target,
                this.heroMoveSpeed() *
                  (h.haste > 0 ? 1.25 : 1) *
                  this.slowMovementFactor(h) *
                  this.mireBogMovementFactor(h) *
                  this.ashMovementFactor(h),
                dt,
                20,
              );
            else if (h.order.type === 'attack') this.cast(1, target.id);
            else h.order = null;
          } else h.order = null;
        }
      }
      const formationDx = h.x - formationStart.x,
        formationDy = h.y - formationStart.y,
        formationDistance = Math.hypot(formationDx, formationDy);
      if (formationDistance > 0.5)
        this.formationHeading = {
          x: formationDx / formationDistance,
          y: formationDy / formationDistance,
        };
      if (this.s.mercyTime > 0) {
        const [mx, my] = D.towns[0];
        if (this.s.zone !== 'vale' || dist(h, { x: mx, y: my }) > mercyStartRadius)
          this.s.mercyTime = 0;
      }
      if (!this.isDungeon()) {
        const [tx, ty] = D.towns[this.regionIndex()];
        if (dist(h, { x: tx, y: ty }) < 170) {
          this.setRefuge(this.s.zone, 'rest');
          if (!this.refugeThreat()) h.hp = Math.min(h.maxHp, h.hp + 8 * dt);
        }
        for (const n of z.npcs.filter((n) => n.kind === 'landmark' || n.sideDungeon))
          if (dist(h, n) < 120) {
            const first = !this.s.discovered[this.definition().id + ':' + n.id];
            this.discover(n.id);
            if (first) {
              this.say(this.siteDescription(n));
              this.announceLandmark(n);
            }
          }
        const [px, py] = D.ports[this.regionIndex()];
        if (dist(h, { x: px, y: py }) < 140) this.discover('port');
        const minor = this.minorRefugePoint();
        if (dist(h, minor) < 180) {
          this.discover('minor');
          this.setRefuge(this.s.zone, 'minor');
        }
      }
      // Optional presentation timing marks, without exposing a browser clock to rules.
      const performanceMark =
        typeof input.performanceMark === 'function' ? input.performanceMark : null;
      performanceMark?.('partyStart');
      this.updateParty(dt, performanceMark);
      performanceMark?.('partyEnd');
      this.updateEnemies(dt);
      this.tickRogueStations();
      // Scripted charges, pulls and teleports can bypass ordinary path collision.
      // Keep every arena combatant inside the same marked, walkable perimeter.
      if (this.s.mode === 'arena') this.arenaContainActors();
      performanceMark?.('enemyEnd');
      if (
        h !== this.hero ||
        z !== this.zone() ||
        this.s.challenge.pending ||
        this.s.challenge.gameOver
      )
        return;
      this.advanceHeroSkillEffects(dt);
      this.updateProjectiles(dt);
      if (this.s.mode === 'arena') this.arenaContainActors();
      if (
        h !== this.hero ||
        z !== this.zone() ||
        this.s.challenge.pending ||
        this.s.challenge.gameOver
      )
        return;
      performanceMark?.('enemyExtraStart');
      this.updateElites(dt);
      this.updatePacks(dt);
      this.updateGuardianReinforcements(dt);
      performanceMark?.('enemyExtraEnd');
      this.updateTraps(dt);
      if (
        h !== this.hero ||
        z !== this.zone() ||
        this.s.challenge.pending ||
        this.s.challenge.gameOver
      )
        return;
      // Friendly preparation resolves only after every damage phase above.
      this.resolveCompanionCharges();
      if (
        h !== this.hero ||
        z !== this.zone() ||
        this.s.challenge.pending ||
        this.s.challenge.gameOver
      )
        return;
      this.updateRangerSupport(dt);
      this.autoRangerSupport();
      if (R.resourceMode.manaEnabled) h.mp = Math.min(h.maxMp, h.mp + this.manaRegenRate() * dt);
      this.updateNight();
      this.updateEscort(dt);
      this.updateArchiveRestoration(dt);
      this.checkClear();
      this.checkMinis();
      for (const l of [...this.s.loot])
        if (l.zone === this.s.zone && dist(l, h) < 65) {
          this.grant(l.gold, 0);
          this.s.loot.splice(this.s.loot.indexOf(l), 1);
          this.event('gold');
        }
      this.resolveCompanionCareRequests();
      this.resolveRecruitmentRequest();
      if (this.s.mode === 'arena') this.arenaContainActors();
    }

    captainProfile(e) {
      return e?.captainProfile && (e.captain || e.roomCaptain)
        ? R.roomCaptains?.[e.captainProfile]
        : null;
    }
    updateCaptainPatrol(e, dt) {
      if (!e?.fieldCaptain || e.aggro || e.returning) return false;
      const profile = this.captainProfile(e),
        patrol = profile?.patrol || [];
      if (!patrol.length) return false;
      e.captainPatrolWait = Math.max(0, (e.captainPatrolWait || 0) - dt);
      if (e.captainPatrolWait > 0) return true;
      const index = (e.captainPatrolIndex || 0) % patrol.length,
        [x, y] = patrol[index],
        target = { x, y };
      if (dist(e, target) < 30) {
        e.home = { x: e.x, y: e.y };
        e.captainPatrolIndex = (index + 1) % patrol.length;
        e.captainPatrolWait = profile.inspectionPause || 2.4;
        return true;
      }
      if (
        !this.follow(e, target, (profile.patrolSpeed || 82) * this.mountedMovementFactor(e), dt, 20)
      ) {
        e.captainPatrolIndex = (index + 1) % patrol.length;
        e.captainPatrolWait = 0.5;
      }
      return true;
    }
    idleWanderProfile(e) {
      if (e?.fieldCaptain) return null;
      if (e?.type === 'boss') return R.idleWander.boss;
      if (e?.captain || e?.roomCaptain) return R.idleWander.captain;
      if (e?.form === 'ringleader') return R.idleWander.ringleader;
      if (e?.nightOnly) return R.idleWander.night;
      if (e?.summon) return R.idleWander.summon;
      if (e?.guard) return R.idleWander.guardian;
      if (e?.ranged) return R.idleWander.ranged;
      return R.idleWander.ordinary;
    }
    updateIdleWander(e, dt) {
      if (!e || e.aggro || e.returning || e.neutral || e.hp <= 0 || e.fieldCaptain) return false;
      if (e.family === 'mine' && e.type === 'boss' && this.s.zone === 'mine') {
        const anchors = [
            [1120, 1010],
            [1260, 1120],
            [1160, 1240],
          ],
          index = (e.inspectionIndex || 0) % anchors.length,
          destination = { x: anchors[index][0], y: anchors[index][1] };
        e.inspectionWait = Math.max(0, (e.inspectionWait ?? 1.5) - dt);
        if (e.inspectionWait > 0) return true;
        // Geometry and trap checks are stable between inspections. Avoid a path search per frame.
        if (e.inspectionValidatedIndex !== index) {
          const danger = this.traps().some((t) =>
            this.trapContains(
              {
                ...t,
                radius: (t.radius || 0) + 26,
                length: (t.length || 0) + 52,
                halfWidth: (t.halfWidth || 0) + 26,
              },
              destination,
            ),
          );
          if (
            danger ||
            this.blocked(destination.x, destination.y, 'mine', 24) ||
            !this.route(e, destination).length
          ) {
            e.inspectionIndex = index + 1;
            e.inspectionValidatedIndex = -1;
            e.inspectionWait = 1.2;
            return true;
          }
          e.inspectionValidatedIndex = index;
        }
        if (dist(e, destination) < 32) {
          e.inspectionIndex = index + 1;
          e.inspectionValidatedIndex = -1;
          e.inspectionWait = 3;
          return true;
        }
        if (!this.follow(e, destination, 38, dt, 20)) {
          e.inspectionIndex = index + 1;
          e.inspectionValidatedIndex = -1;
          e.inspectionWait = 1.2;
        }
        return true;
      }
      const cfg = this.idleWanderProfile(e);
      if (!cfg || !e.home) return false;
      e.idleWanderWait = Math.max(
        0,
        (e.idleWanderWait ?? ((Number(e.id?.split('-').at(-1)) || 1) % 5) * 0.55 + 1.2) - dt,
      );
      if (e.idleWanderTarget) {
        if (dist(e, e.idleWanderTarget) < 8) {
          delete e.idleWanderTarget;
          e.idleWanderWait = cfg.minPause + this.random() * (cfg.maxPause - cfg.minPause);
          return true;
        }
        if (!this.follow(e, e.idleWanderTarget, cfg.speed * this.mountedMovementFactor(e), dt, 4)) {
          delete e.idleWanderTarget;
          e.idleWanderWait = 0.8;
        }
        return true;
      }
      if (e.idleWanderWait > 0) return true;
      for (let n = 0; n < 8; n++) {
        const angle = this.random() * Math.PI * 2,
          radius = cfg.radius * (0.35 + this.random() * 0.65),
          candidate = {
            x: e.home.x + Math.cos(angle) * radius,
            y: e.home.y + Math.sin(angle) * radius,
          };
        if (
          this.blocked(candidate.x, candidate.y, this.s.zone, 12) ||
          !this.clearSegment(e, candidate, 12)
        )
          continue;
        e.idleWanderTarget = candidate;
        return true;
      }
      e.idleWanderWait = 1.2;
      return true;
    }
    triggerCaptainPhase(e) {
      const profile = this.captainProfile(e),
        phase = profile?.phase;
      if (!phase || e.captainPhase || e.hp > e.maxHp * phase.threshold) return false;
      e.captainPhase = true;
      e.captainPhaseMove = 1;
      e.captainAttackRate = 1;
      if (phase.kind === 'scramble') {
        e.captainPhaseMove = 1.28;
        e.captainAttackRate = 0.8;
        e.pursuitBurst = Math.max(e.pursuitBurst || 0, 2.4);
        e.cd = Math.min(e.cd, 0.15);
        e.specialCd = 0;
      } else if (phase.kind === 'molt') {
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.5);
        e.captainPhaseMove = 1.2;
        e.specialCd = 0;
      } else if (phase.kind === 'howl') {
        e.captainPhaseMove = 1.35;
        e.captainAttackRate = 0.75;
        e.cd = Math.min(e.cd, 0.15);
        e.specialCd = 0;
      } else if (phase.kind === 'carapace') {
        e.captainReflect = 8;
        e.captainAttackRate = 0.85;
        e.specialCd = 0;
        if (profile.summon) this.summonCaptainAdds(e, profile.summon);
      } else if (phase.kind === 'overtime') {
        e.captainPhaseMove = 1.15;
        e.captainAttackRate = 0.8;
        e.specialCd = 0;
        e.captainOvertimeCd = 12;
        this.captainOvertimeRecruit(e);
      }
      this.say(e.name + ' uses ' + phase.name + '.');
      this.event('captainPhase', { profile: e.captainProfile, name: phase.name });
      return true;
    }
    captainOvertimeRecruit(e) {
      const candidates = this.zone()
          .enemies.filter(
            (u) =>
              u !== e &&
              u.hp > 0 &&
              !u.neutral &&
              !u.captain &&
              !u.roomCaptain &&
              !u.summon &&
              u.type === 'mob' &&
              dist(u, e) < 900,
          )
          .sort((a, b) => dist(a, e) - dist(b, e)),
        workers =
          candidates.length <= 7
            ? candidates
            : [...candidates.slice(0, 3), ...candidates.slice(-4)];
      for (const u of workers) {
        u.quotaOvertime = Math.max(u.quotaOvertime || 0, 9);
        u.quotaTarget = { x: this.hero.x, y: this.hero.y };
        u.pursuitBurst = Math.max(u.pursuitBurst || 0, 4);
        u.cd = Math.min(u.cd || 0, 0.2);
        this.engage(u);
      }
    }
    captainOwnedSummons(e) {
      return this.zone().enemies.filter((u) => u.summon && u.owner === e.id && u.hp > 0);
    }
    summonCaptainAdds(e, plan = this.captainProfile(e)?.summon) {
      if (!e || !plan) return 0;
      const z = this.zone(),
        cap = plan.cap || 3,
        live = this.captainOwnedSummons(e);
      if (live.length >= cap) return 0;
      const composition = (plan.composition || Array(cap).fill('melee')).slice(0, cap),
        missing = [...composition],
        sc = R.summonScaling[this.regionIndex()],
        baseHp = Math.round((40 + e.level * 15) * sc.hp),
        baseDamage = Math.round((5 + e.level) * sc.damage),
        spawnPoint = (slot) => {
          for (let n = 0; n < 30; n++) {
            const a = ((slot + n) * Math.PI) / 3,
              r = 105 + Math.floor(n / 6) * 45,
              p = { x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r };
            if (
              this.blocked(p.x, p.y, this.s.zone, 12) ||
              dist(p, this.hero) < 70 ||
              z.enemies.some((u) => u !== e && u.hp > 0 && dist(p, u) < 36)
            )
              continue;
            return p;
          }
          return this.safe(e.x + 90, e.y + 90);
        };
      for (const u of live) {
        const role = u.forcedRole === 'ranged' || u.ranged ? 'ranged' : 'melee',
          at = missing.indexOf(role);
        if (at >= 0) missing.splice(at, 1);
      }
      let made = 0;
      for (const role of missing.slice(0, cap - live.length)) {
        const p = spawnPoint(live.length + made),
          ranged = role === 'ranged',
          s = this.makeEnemy(
            {
              species: plan.species || 'ashbeast',
              name: ranged ? 'Cinder broodling' : 'Ash broodling',
              icon: '👻',
              level: e.level,
              hp: baseHp,
              damage: baseDamage,
              gold: 0,
              xp: 0,
            },
            p,
          );
        s.summon = true;
        s.summonBalanceVersion = 1;
        s.owner = e.id;
        s.treasurySummon = true;
        s.pack = e.id + '-brood';
        s.forcedRole = ranged ? 'ranged' : 'melee';
        this.summonCombatProfile(s, { species: plan.species || 'ashbeast', ranged });
        z.enemies.push(s);
        made++;
        if (e.aggro) this.engage(s);
      }
      if (made) {
        e.summonCd = plan.cooldown || 12;
        this.say(
          e.name + ' calls ' + made + ' Ash-beast broodling' + (made === 1 ? '' : 's') + '.',
        );
        this.event('captainSummon', { captain: e.captainProfile, count: made });
      }
      return made;
    }
    startCaptainAttack(e, target, withdrawal = false) {
      const profile = this.captainProfile(e),
        plans = profile?.attacks || [];
      if (!plans.length) return false;
      const summonCfg = profile.summon,
        owned = this.captainOwnedSummons(e).length,
        d = dist(e, target),
        eligible = plans
          .map((plan, index) => ({ plan, index }))
          .filter((x) => {
            if (withdrawal && !this.enemyWithdrawalPlan(e, x.plan, x.index)) return false;
            if (x.plan.kind === 'summon')
              return summonCfg && owned < (summonCfg.cap || 3) && (e.summonCd || 0) <= 0;
            if (x.plan.kind === 'cone')
              return d <= (x.plan.radius || 145) * R.bossCadence.areaRangeMultiplier + 25;
            return true;
          }),
        available = eligible.filter((x) => x.index !== e.lastCaptainAttack),
        weighted = [];
      let chosen = null;
      if (summonCfg?.opening && !e.captainOpeningSummon && owned === 0 && (e.summonCd || 0) <= 0) {
        const opening = eligible.find((x) => x.plan.kind === 'summon');
        if (opening) {
          chosen = opening;
          e.captainOpeningSummon = true;
        }
      }
      if (!chosen) {
        for (const x of available.length ? available : eligible) {
          let weight = 1;
          if (x.plan.kind === 'summon') weight += 1.5 + (summonCfg.cap || 3) - owned;
          if (x.plan.kind === 'cone' && d < 170) weight += 1.4;
          if (x.plan.kind === 'line' && d > 140) weight += 1.2;
          if (x.plan.kind === 'circle' && d > 180) weight += 1;
          weighted.push({ ...x, weight });
        }
        if (!weighted.length) return false;
        let roll = this.random() * weighted.reduce((n, x) => n + x.weight, 0);
        chosen = weighted[0];
        for (const x of weighted) {
          roll -= x.weight;
          if (roll <= 0) {
            chosen = x;
            break;
          }
        }
      }
      const plan = chosen.plan,
        index = chosen.index,
        fatigued = e.captainProfile === 'supply-highlands' && e.hp <= 550,
        anonymousCast =
          (e.captainProfile === 'supply-highlands' && !fatigued) ||
          (e.captainProfile === 'supply-march' && plan.warning === 0),
        attackWarning = anonymousCast ? 0.9 : plan.warning,
        markHero =
          plan.kind === 'circle' &&
          this.hero.hp > 0 &&
          dist(e, this.hero) < profile.specialRange &&
          this.line(e, this.hero),
        actualTarget = markHero ? this.hero : target,
        angle = Math.atan2(actualTarget.y - e.y, actualTarget.x - e.x),
        center = ['cone', 'sector', 'ring'].includes(plan.kind)
          ? { x: e.x, y: e.y }
          : { x: actualTarget.x, y: actualTarget.y },
        a = {
          ...plan,
          captainSkill: true,
          anonymousCast,
          family: e.family,
          captainProfile: e.captainProfile,
          index,
          timer: attackWarning,
          total: attackWarning,
          coefficient: plan.coefficient ?? 1,
          fromX: e.x,
          fromY: e.y,
          angle,
          ...center,
          radius:
            (plan.radius || (plan.kind === 'cone' ? 145 : 85)) *
            (plan.fixedRadius ? 1 : R.bossCadence.areaRangeMultiplier) *
            (plan.captainRadiusMultiplier || 1),
          sequence: [],
        };
      if (plan.tracking) {
        a.shotNumber = 1;
        a.targetId = target === this.hero ? 'hero' : target.id;
        for (let j = 2; j <= plan.shots; j++)
          a.sequence.push({
            ...a,
            sequence: [],
            shotNumber: j,
            timer: plan.shotWarning,
            total: plan.shotWarning,
          });
      }
      if (plan.paired && e.captainProfile === 'supply-vale' && index === 4) {
        this.prepareGroundAttack(e, a);
        const pads = this.attackPatches(a);
        a.arenaPatches = pads.slice(0, 2).map(({ x, y, radius }) => ({ x, y, radius }));
        a.pairMarks = pads.slice(0, 2).map((p) => ({ x: p.x, y: p.y }));
        a.count = 2;
        a.sequence.push({
          ...a,
          sequence: [],
          arenaPatches: pads.slice(2).map(({ x, y, radius }) => ({ x, y, radius })),
          pairMarks: pads.slice(2).map((p) => ({ x: p.x, y: p.y })),
          timer: plan.pairWarning,
          total: plan.pairWarning,
          name: plan.name + ' — second pair',
        });
      }
      if (plan.sequential && plan.kind === 'circle') {
        this.prepareGroundAttack(e, a);
        const patches = this.attackPatches(a);
        Object.assign(a, patches[0], {
          count: 1,
          arenaPatches: [{ x: patches[0].x, y: patches[0].y, radius: patches[0].radius }],
        });
        a.sequence = patches.slice(1).map((p) => ({
          ...a,
          ...p,
          arenaPatches: [{ x: p.x, y: p.y, radius: p.radius }],
          count: 1,
          timer: attackWarning * 0.72,
          total: attackWarning * 0.72,
          name: plan.name + ' follow-up',
        }));
      }
      const sequence = [...(a.sequence || [])];
      delete a.sequence;
      if (!this.prepareAttackSequence(e, a, sequence)) return false;
      e.lastCaptainAttack = index;
      e.sequence = sequence;
      e.telegraph = a;
      e.specialCd =
        profile.specialCooldown *
        (e.captainPhase
          ? e.captainProfile === 'supply-highlands'
            ? e.captainAttackRate
            : 0.82
          : 1);
      this.event(
        'warning',
        anonymousCast
          ? { captain: e.captainProfile, anonymousCast: true }
          : { captain: e.captainProfile, index },
      );
      return true;
    }
    startNightSkill(e, target) {
      const cfg = R.nightEnemyCombat[e.species];
      if (!cfg) return false;
      if (e.species === 'wraith') {
        e.telegraph = {
          nightSkill: 'drain',
          kind: 'circle',
          name: 'Soul Drain',
          x: e.x,
          y: e.y,
          radius: cfg.radius,
          coefficient: cfg.coefficient,
          slowDuration: cfg.slow,
          heal: cfg.heal,
          manaDrain: cfg.manaDrain || 0,
          timer: cfg.warning,
          total: cfg.warning,
          recovery: 0.55,
        };
      } else if (e.species === 'stalker') {
        // Preserve the full 0.7s cast without leaking the pounce target,
        // named warning or ground hitbox. The shared anonymous cast bar
        // remains visible above the enemy health plate.
        e.telegraph = {
          nightSkill: 'pounce',
          anonymousCast: true,
          kind: 'circle',
          name: 'Shadow Pounce',
          x: target.x,
          y: target.y,
          radius: cfg.radius,
          coefficient: cfg.coefficient,
          slowDuration: cfg.slow,
          pounceSpeed: cfg.pounceSpeed,
          landing: true,
          timer: cfg.warning,
          total: cfg.warning,
          recovery: 0.6,
        };
      } else return false;
      e.specialCd = cfg.skillCooldown * (e.frenzy ? 0.7 : 1);
      // Wraith Soul Drain keeps its ordinary warning. Shadow Pounce is
      // recognizable only by the generic cast bar until physical release.
      if (e.species === 'wraith') this.event('warning', { family: e.species });
      return true;
    }

    // Each monster evaluates its own disadvantage. Support can chain across
    // packs while the player keeps pursuing; there is no encounter-wide cap.
    tacticalRogueRegroup(e) {
      return this._tacticalRegroups?.get(e?.id) || null;
    }
    hawkRetreatLocked(e, family) {
      return (this._hawkRetreatLocks?.get(e)?.[family] || 0) > this.s.time;
    }
    hawkRetreatKind(e) {
      if (!e || e.hp <= 0 || !e.aggro || e.returning || this.attackResetProtected(e)) return null;
      const regroup = this.tacticalRogueRegroup(e);
      if (regroup && ['thinking', 'travel', 'escape', 'extended'].includes(regroup.phase)) return 'regroup';
      if (e.telegraph?.rogueMove && e.telegraph.style === 'withdraw') return 'withdraw';
      if (this._hawkBackpedalAt?.get(e) === this.s.time) return 'backpedal';
      if (e.rangedAim?.withdrawal || e.telegraph?.withdrawal) return 'backpedal';
      return null;
    }
    hawkInterruptRetreat(e, family, seconds) {
      if (!family || !this.hawkRetreatKind(e)) return false;
      if (!this._hawkRetreatLocks) this._hawkRetreatLocks = new WeakMap();
      const current = this._hawkRetreatLocks.get(e) || {};
      current[family] = Math.max(current[family] || 0, this.s.time + seconds);
      this._hawkRetreatLocks.set(e, current);
      if (family === 'regroup') {
        // Keep combat and a local temporary leash rather than resetting home.
        this._tacticalRegroups ||= new Map();
        this._tacticalRegroups.set(e.id, {
          phase: 'anchored',
          anchor: { x: e.x, y: e.y },
          holdRemaining: 12,
          moveUsed: true,
          recruited: true,
        });
        e.path = [];
        e.routeAge = 0;
        e.noProgress = 0;
      } else if (family === 'withdraw') {
        // A warned attack remains committed: suppress only its retreat motion.
        e.path = [];
        e.routeAge = 0;
      } else if (family === 'backpedal') {
        this._hawkBackpedalAt?.delete(e);
        if (e.rangedAim) e.rangedAim.withdrawal = false;
        if (e.telegraph?.withdrawal) e.telegraph.withdrawal = false;
      }
      this.event('hawkRetreatInterrupted', {
        actor: 'hero',
        class: 'ranger',
        target: e.id,
        family,
        seconds,
      });
      return true;
    }
    tacticalClearRogueRegroup(e = null) {
      this.clearCinderResponses(e);
      if (e) {
        tacticalRogueRouteSearches.delete(e);
        this._tacticalRegroups?.delete(e.id);
        this._tacticalRogueNext?.delete(e.id);
        this._tacticalVisitedAllies?.delete(e.id);
        this._tacticalWoundedUsed?.delete(e.id);
        this._tacticalTerritorialVisited?.delete(e.id);
        this._tacticalExtendedSearchAfter?.delete(e.id);
        this._tacticalRogueLastCast?.delete(e.id);
        this._tacticalEmergencyNext?.delete(e.id);
      } else {
        this._tacticalRegroups?.clear();
        this._tacticalRogueNext?.clear();
        this._tacticalVisitedAllies?.clear();
        this._tacticalWoundedUsed?.clear();
        this._tacticalTerritorialVisited?.clear();
        this._tacticalExtendedSearchAfter?.clear();
        this._tacticalRogueLastCast?.clear();
        this._tacticalEmergencyNext?.clear();
      }
    }
    tacticalStopRogueRegroup(e) {
      this._tacticalRegroups?.delete(e?.id);
      if (e) {
        tacticalRogueRouteSearches.delete(e);
        e.path = [];
        e.routeAge = 0;
      }
    }
    tacticalRetireEmergencyGuards(owner) {
      let retired = false;
      for (const add of this.zone().enemies) {
        if (add.summon && add.rogueEmergencyReinforcement && add.owner === owner.id) {
          add.hp = 0;
          retired = true;
        }
      }
      if (retired) this._tacticalEmergencyCleanupPending = true;
    }
    tacticalBeginRogueRegroup(e, ally, activeTargetCount = 0, incremental = false) {
      const prior = this.tacticalRogueRegroup(e),
        preparing = prior?.phase === 'thinking' || prior?.phase === 'escape';
      if (
        !e?.aggro ||
        e.hp <= 0 ||
        e.neutral ||
        e.returning ||
        e.telegraph ||
        e.motion ||
        e.rangedAim ||
        (prior && !preparing) ||
        this.hawkRetreatLocked(e, 'regroup') ||
        (!preparing && (this._tacticalRogueNext?.get(e.id) || 0) > this.s.time) ||
        !this.tacticalRogueEligibility(e, activeTargetCount) ||
        !this.tacticalRegroupCandidates(e).includes(ally)
      )
        return false;
      const groupKey = ally.pack || ally.id;
      if (this._tacticalVisitedAllies?.get(e.id)?.has(groupKey)) return false;
      const destination = { x: ally.x, y: ally.y },
        retreatOrigin = { x: e.x, y: e.y };
      if (!Number.isFinite(destination.x) || !Number.isFinite(destination.y)) return false;
      let path;
      if (incremental) {
        const previous = tacticalRogueRouteSearches.get(e),
          pending = previous?.allyId === ally.id ? previous.state : null,
          result = this.advanceBudgetedRoute(
            pending?.origin || e, pending?.target || destination, 'tactical', pending,
          );
        if (result.pending) {
          tacticalRogueRouteSearches.set(e, { allyId: ally.id, state: result.state });
          return null; // pending is distinct from an invalid or unreachable regroup
        }
        tacticalRogueRouteSearches.delete(e);
        path = result.path;
        // An actor may have continued its defensive escape while a route
        // was being planned. Never commit a path with an obstructed first
        // leg from the actor's actual current position.
        if (path.length && !this.clearSegment(e, path[0])) return false;
      } else path = this.route(e, destination);
      if (!path.length) return false;
      let length = 0;
      let previous = e;
      for (const waypoint of path) {
        length += dist(previous, waypoint);
        previous = waypoint;
      }
      if (length > R.tacticalFoundation.awarenessRadius * 1.8) return false;
      const radius = this.tacticalDefenderTerritory(e),
        post = this.tacticalDefenderPost(e);
      if (radius && (dist(destination, post) > radius - 55 ||
          path.some((point) => dist(point, post) > radius - 25)))
        return false;
      // Keep the established major-town protection; ordinary monster patrols
      // elsewhere in occupied regions remain legal.
      if (!this.isDungeon()) {
        const coords = D.towns[this.regionIndex()];
        if (coords) {
          const town = { x: coords[0], y: coords[1] };
          previous = e;
          for (const waypoint of path) {
            if (this.distanceToSegment(town, previous, waypoint) < 185) return false;
            previous = waypoint;
          }
        }
      }
      if (!this._tacticalRegroups) this._tacticalRegroups = new Map();
      if (!this._tacticalVisitedAllies) this._tacticalVisitedAllies = new Map();
      if (!this._tacticalRogueNext) this._tacticalRogueNext = new Map();
      const visited = this._tacticalVisitedAllies.get(e.id) || new Set();
      visited.add(groupKey);
      this._tacticalVisitedAllies.set(e.id, visited);
      this._tacticalRegroups.set(e.id, {
        phase: 'travel',
        allyId: ally.id,
        destination,
        retreatOrigin,
        travelRemaining: 12,
        stalled: 0,
        anchor: null,
        holdRemaining: 12,
      });
      this._tacticalRogueNext.set(e.id, this.s.time + R.tacticalFoundation.moveCooldownSeconds);
      e.path = [];
      e.routeAge = 0;
      return true;
    }
    // Transient forced movement is shared by hero and companions, but never
    // serialized. While scattering, no player movement or party AI can override
    // the direction. World collision remains authoritative.
    tacticalScatterState(unit) {
      return this._tacticalScatter?.get(unit === this.hero ? 'hero' : unit?.id) || null;
    }
    tacticalClearScatter(unit) {
      const key = unit === this.hero ? 'hero' : unit?.id;
      this._tacticalScatter?.delete(key);
      for (const [actor, allowance] of this._tacticalScatterLeash || []) {
        allowance.victims.delete(key);
        if (!allowance.victims.size) this._tacticalScatterLeash.delete(actor);
      }
    }
    tacticalBeginScatter(actor, unit, push) {
      if (!unit || unit.hp <= 0 || !Number.isFinite(push) || push <= 0) return false;
      const key = unit === this.hero ? 'hero' : unit.id,
        distance = Math.max(1, dist(actor, unit)),
        direction =
          distance > 1
            ? { x: (unit.x - actor.x) / distance, y: (unit.y - actor.y) / distance }
            : { x: 1, y: 0 },
        duration = 0.6;
      if (!this._tacticalScatter) this._tacticalScatter = new Map();
      this._tacticalScatter.set(key, {
        zone: this.zoneId,
        unit,
        direction,
        speed: push / duration,
        remaining: duration,
      });
      if (unit === this.hero) this.hero.order = null;
      // The short leash allowance is boss-specific and cannot become a
      // permanent extended territory or a new aggro/recruitment rule.
      if (actor?.family === 'thorn' && actor.type === 'boss') {
        if (!this._tacticalScatterLeash) this._tacticalScatterLeash = new Map();
        const prior = this._tacticalScatterLeash.get(actor.id),
          victims = prior?.until > this.s.time ? prior.victims : new Set();
        victims.add(key);
        this._tacticalScatterLeash.set(actor.id, {
          zone: this.zoneId,
          anchor: { x: actor.x, y: actor.y },
          victims,
          until: this.s.time + 1.6,
        });
      }
      return true;
    }
    tacticalAdvanceScatter(unit, dt) {
      const key = unit === this.hero ? 'hero' : unit?.id,
        state = this._tacticalScatter?.get(key);
      if (!state) return false;
      if (state.zone !== this.zoneId || state.unit !== unit || unit.hp <= 0) {
        this._tacticalScatter.delete(key);
        return false;
      }
      const step = Math.min(dt, state.remaining),
        goal = {
          x: unit.x + state.direction.x * state.speed * step,
          y: unit.y + state.direction.y * state.speed * step,
        };
      if (step > 0) this.move(unit, goal, state.speed, step, 0);
      state.remaining = Math.max(0, state.remaining - dt);
      if (state.remaining <= 0) this._tacticalScatter.delete(key);
      return true;
    }
    // A captain/boss sidestep may carry the encounter across the original
    // home leash, but never heal/reset the encounter merely for that motion.
    // The temporary corridor is anchored to the actual short skill movement,
    // bounded to local combat and cannot follow a genuine player escape.
    tacticalRecordRogueReposition(e, from, target) {
      if (!(e.type === 'boss' || e.captain || e.roomCaptain) || !target || dist(from, e) < 1)
        return;
      if (!this._tacticalRepositions) this._tacticalRepositions = new Map();
      this._tacticalRepositions.set(e.id, {
        zone: this.zoneId,
        from,
        to: { x: e.x, y: e.y },
        until: this.s.time + 4,
      });
    }
    tacticalDefenderPost(e) {
      // An interrupted patrol remains responsible for the interception area,
      // not its distant den. Captive movement already belongs to patrol code.
      if (this.thornPatroller(e)) return e.thornFightAnchor || e;
      if (this.cinderPatroller(e)) return e.cinderFightAnchor || e;
      return e.home || e;
    }
    tacticalDefenderTerritory(e) {
      if (e.type === 'boss') return this.isDungeon() ? 650 : 700;
      if (e.fieldCaptain || e.captain || e.roomCaptain)
        return this.isDungeon() ? 600 : 900;
      return null;
    }
    tacticalGuardedSpecialist(e) {
      // Mobile captives already follow Thornfang/Cindermaw during combat.
      // Only static captive posts need this final-stand destination.
      if (e.type !== 'boss' || this.roamingBoss(e) ||
          this.s.keys[e.family] || this.s.rescued[e.family]) return null;
      return this.zone().npcs.find((n) => n.kind === 'cage' && n.family === e.family) || null;
    }
    tacticalRogueLeashAllows(e, target, territory) {
      const response = this._tacticalCinderResponses?.get(e?.id);
      if (response?.joined && response.zone === this.zoneId) {
        const owner = this.zone().enemies.find((u) => u.id === response.owner);
        if (owner?.hp > 0 && owner.aggro && !owner.returning && !owner.neutral)
          return target?.hp > 0 && dist(target, owner) <= 700 && dist(e, owner) <= 900;
      }
      const home = this.thornPatroller(e)
        ? e.thornFightAnchor || e
        : this.cinderPatroller(e)
          ? e.cinderFightAnchor || e
          : e.home;
      const shift = this._tacticalRepositions?.get(e?.id);
      if (
        shift &&
        shift.zone === this.zoneId &&
        target?.hp > 0 &&
        (shift.until > this.s.time ||
          (dist(e, shift.to) <= 250 &&
            dist(target, e) <= 350 &&
            dist(target, home) <= territory + 250)) &&
        dist(target, e) <= Math.max(territory, 550) &&
        dist(target, shift.to) <= Math.max(territory + 200, 650) &&
        this.distanceToSegment(target, shift.from, shift.to) <= Math.max(territory, 550)
      )
        return true;
      // The boss must not disengage merely because its own howl forcibly
      // pushed an opponent beyond the normal home leash. This short exception
      // applies only to victims of that howl, near its point of impact.
      const scatter = this._tacticalScatterLeash?.get(e?.id);
      if (
        scatter &&
        scatter.zone === this.zoneId &&
        scatter.victims.has(target === this.hero ? 'hero' : target?.id) &&
        (scatter.until > this.s.time ||
          (dist(target, e) <= 350 && dist(target, home) <= territory + 250)) &&
        dist(target, e) <= Math.max(territory + 250, 900) &&
        dist(target, scatter.anchor) <= Math.max(territory + 250, 900)
      )
        return true;
      const state = this.tacticalRogueRegroup(e);
      if (!state) return dist(target, home) <= territory;
      if (state.phase === 'thinking' && !state.anchor) return dist(target, home) <= territory;
      if (state.phase === 'extended') {
        const radius = this.tacticalDefenderTerritory(e),
          post = this.tacticalDefenderPost(e);
        return dist(target, e) <= R.tacticalFoundation.extendedEncounterSeparation &&
          (!radius || (dist(e, post) <= radius + 40 &&
            dist(target, post) <= radius + 250));
      }
      // A defensive leader resumes the original encounter leash, including
      // larger dungeon rooms; a fallback tactical state grants no new roam
      // radius and cannot arbitrarily shorten the existing boss encounter.
      if (state.phase === 'defend' && this.tacticalDefenderTerritory(e))
        return dist(target, home) <= territory;
      const separationLimit = R.tacticalFoundation.awarenessRadius + 200;
      if (dist(target, e) > separationLimit) return false;
      if (state.phase === 'guard-captive')
        return dist(e, this.tacticalDefenderPost(e)) <= territory + 100 &&
          dist(target, state.destination) <= separationLimit;
      if (state.phase === 'travel')
        return (
          this.distanceToSegment(target, state.retreatOrigin || home, state.destination) <=
          territory
        );
      return (
        ['anchored', 'thinking', 'escape', 'defend'].includes(state.phase) &&
        dist(target, state.anchor || e) <= separationLimit
      );
    }
    // A local ally is useful, but reaching one does not necessarily fix the odds.
    // Distinguish need for support from basic Rogue eligibility (including level gap).
    tacticalNeedsMoreSupport(e) {
      const opponents = this.tacticalPresentOpponents(e);
      return opponents > 0 &&
        this.tacticalLocalSupport(e) <
          opponents + (this.hero.level > e.level ? 1 : 0);
    }
    tacticalBeginExtendedRetreat(e) {
      // Dungeon bosses hold their rooms; field leaders can seek native
      // monsters within their existing territorial defense envelope.
      if (this.isDungeon() || e.summon || !this.tacticalNeedsMoreSupport(e))
        return false;
      const cfg = R.tacticalFoundation, z = this.zone();
      // Avoid repeated expensive route probing against blocked outposts.
      if ((this._tacticalExtendedSearchAfter?.get(e.id) || 0) > this.s.time)
        return false;
      if (!this._tacticalExtendedSearchAfter) this._tacticalExtendedSearchAfter = new Map();
      this._tacticalExtendedSearchAfter.set(e.id, this.s.time + 5);
      if (!this._tacticalRegroups) this._tacticalRegroups = new Map();
      if (!this._tacticalTerritorialVisited) this._tacticalTerritorialVisited = new Map();
      const visited = this._tacticalTerritorialVisited.get(e.id) || new Set();
      // Do not mistake the same nearby ally already tried at Level 1 for
      // genuinely new territorial support.
      const localVisited = this._tacticalVisitedAllies?.get(e.id);
      // Homes/posts, not magically acquired line-of-sight targets: inhabitants
      // know where the region's defenders usually live, even over the horizon.
      const candidates = z.enemies.filter((ally) =>
        ally !== e && ally.hp > 0 && !ally.neutral && !ally.returning &&
        !ally.summon && dist(ally, e) > cfg.supportRadius + 35 &&
        dist(ally, ally.home || ally) <= cfg.supportRadius &&
        dist(ally.home || ally, e) <= cfg.extendedAwarenessRadius &&
        !localVisited?.has(ally.pack || ally.id) &&
        !visited.has(ally.pack || ally.id)
      ).sort((a, b) => dist(e, a.home || a) - dist(e, b.home || b) || this.idOrder(a, b));
      // Regrouped defenders should follow the same distant refuge rather than
      // independently scattering to different outposts.
      const traveling = z.enemies.find((ally) =>
        ally !== e && ally.hp > 0 &&
        dist(e, ally) <= cfg.supportRadius + 35 &&
        this.tacticalRogueRegroup(ally)?.phase === 'extended'
      );
      if (traveling) {
        const idx = candidates.indexOf(traveling);
        if (idx >= 0) candidates.splice(idx, 1);
        candidates.unshift(traveling);
      }
      for (const ally of candidates.slice(0, 8)) {
        const fellow = this.tacticalRogueRegroup(ally);
        // A guide is not the refuge: retain the living defender at the post
        // so defeating the guide cannot cancel another actor's withdrawal.
        const refuge = fellow?.phase === 'extended'
          ? z.enemies.find((unit) =>
              unit.id === fellow.allyId && unit.hp > 0 &&
              !unit.neutral && !unit.returning
            )
          : ally;
        if (!refuge) continue;
        const destination = fellow?.phase === 'extended'
          ? fellow.destination : refuge.home || refuge;
        const path = this.route(e, destination);
        if (!path.length) continue;
        let length = 0, previous = e, safe = true;
        for (const point of path) {
          length += dist(previous, point);
          if (!this.isDungeon()) {
            const town = D.towns[this.regionIndex()];
            if (town && this.distanceToSegment(
              { x: town[0], y: town[1] }, previous, point
            ) < 185) safe = false;
          }
          previous = point;
        }
        const radius = this.tacticalDefenderTerritory(e),
          post = this.tacticalDefenderPost(e);
        if (radius && (dist(destination, post) > radius - 55 ||
            path.some((point) => dist(point, post) > radius - 25)))
          continue;
        // Leaders may seek any living ally, including another boss/captain,
        // but their retreat must remain a modest local reposition, not a
        // cross-map chase hidden inside the larger native encounter leash.
        if (radius) {
          const budget = e.type === 'boss' ? 340 : 400;
          if (dist(destination, e) > budget || length > budget * 1.6 ||
              path.some((point) => dist(point, e) > budget))
            continue;
        }
        if (!safe || length > cfg.extendedRouteMaxLength) continue;
        visited.add(ally.pack || ally.id);
        this._tacticalTerritorialVisited.set(e.id, visited);
        this._tacticalRegroups.set(e.id, {
          phase: 'extended', allyId: refuge.id,
          destination: { x: destination.x, y: destination.y },
          anchor: { x: e.x, y: e.y }, travelRemaining: Math.max(15, length / 210 + 5),
          stalled: 0,
        });
        this.event('rogueExtendedRetreat', { actor: e.id, ally: ally.id });
        e.path = [];
        e.routeAge = 0;
        return true;
      }
      return false;
    }
    tacticalAdvanceExtendedRetreat(e, target, dt) {
      const state = this.tacticalRogueRegroup(e);
      if (state?.phase !== 'extended') return false;
      const ally = this.zone().enemies.find((unit) => unit.id === state.allyId);
      const replan = () => {
        this._tacticalRegroups.set(e.id, {
          phase: 'thinking', anchor: { x: e.x, y: e.y },
          thinkRemaining: R.tacticalFoundation.thinkingSeconds,
        });
        e.path = [];
        e.routeAge = 0;
      };
      if (!this.tacticalNeedsMoreSupport(e)) {
        this._tacticalRegroups.set(e.id, {
          phase: 'anchored', anchor: { x: e.x, y: e.y },
          holdRemaining: 12, moveUsed: true, recruited: false,
        });
        return false;
      }
      state.travelRemaining -= dt;
      if (!ally || ally.hp <= 0 || ally.neutral || ally.returning ||
          state.travelRemaining <= 0) {
        replan();
        return true;
      }
      if (dist(e, state.destination) <= 65) {
        this._tacticalRegroups.set(e.id, {
          phase: 'anchored', anchor: { x: e.x, y: e.y },
          holdRemaining: 12, moveUsed: true, recruited: false,
        });
        return true;
      }
      const before = { x: e.x, y: e.y };
      this.follow(
        e, state.destination,
        (e.type === 'boss' ? 145 : 175) * 1.5 *
          this.mountedMovementFactor(e) * this.nightTempo(), dt, 55
      );
      state.stalled = dist(before, e) > Math.max(0.1, dt * 10)
        ? 0 : state.stalled + dt;
      if (state.stalled >= 2.5) { replan(); return true; }
      e.noProgress = 0;
      // A covering move must not replace the travel order or aim at the pursuer
      // instead of the destination. Existing warnings still resolve normally.
      if (!e.telegraph && !e.motion && !e.rangedAim &&
          (this._tacticalRogueNext?.get(e.id) || 0) <= this.s.time &&
          dist(e, target) <= 320 && this.line(e, target))
        this.tacticalRogueMove(e, target, true);
      return true;
    }
    tacticalEmergencyCall(e) {
      if (e.form !== 'ringleader' || e.type === 'boss' ||
          e.captain || e.roomCaptain || e.summon ||
          !this.tacticalNeedsMoreSupport(e)) return false;
      const cfg = R.tacticalFoundation;
      if ((this._tacticalEmergencyNext?.get(e.id) || 0) > this.s.time) return false;
      const z = this.zone(),
        owned = z.enemies.filter((u) =>
          u.hp > 0 && u.summon && u.rogueEmergencyReinforcement && u.owner === e.id
        );
      if (owned.length >= cfg.emergencyLivingCap) return false;
      const roll = this.random() < 0.5 ? 2 : 3,
        count = Math.min(roll, cfg.emergencyLivingCap - owned.length);
      let made = 0;
      for (let i = 0; i < count; i++) {
        let point = null;
        for (let n = 0; n < 30; n++) {
          const angle = (i + n) * Math.PI / 3,
            radius = 105 + Math.floor(n / 6) * 40,
            candidate = {
              x: e.x + Math.cos(angle) * radius,
              y: e.y + Math.sin(angle) * radius,
            };
          if (this.blocked(candidate.x, candidate.y, z.id, 12) ||
              this.combatTargets().some((u) => u.hp > 0 && dist(u, candidate) < 80) ||
              z.enemies.some((u) => u.hp > 0 && dist(u, candidate) < 37))
            continue;
          point = candidate;
          break;
        }
        if (!point) break;
        const baseHp = e.baseHp / R.ringleaderScaling.hp,
          baseDamage = e.baseDamage / R.ringleaderScaling.damage;
        const add = this.makeEnemy({
          species: e.species, name: 'Called ' + e.species + ' guardian',
          icon: e.icon, level: Math.max(1, e.level - 2),
          hp: baseHp, damage: baseDamage, gold: 0, xp: 0,
        }, point);
        add.guard = true;
        add.owner = e.id;
        add.rogueEmergencyReinforcement = true;
        add.pack = e.id + '-emergency';
        if (e.ranged) add.forcedRole = 'ranged';
        // Native role assignment has to precede summon admission: the
        // shared configurator intentionally skips already-summoned actors.
        this.configureEnemy(add, i);
        add.summon = true;
        add.summonBalanceVersion = 1;
        z.enemies.push(add);
        this.engage(add, true, false);
        made++;
      }
      if (!made) return false;
      if (!this._tacticalEmergencyNext) this._tacticalEmergencyNext = new Map();
      this._tacticalEmergencyNext.set(e.id, this.s.time + cfg.emergencyCooldownSeconds);
      this.event('rogueEmergencyCall', { actor: e.id, count: made });
      return true;
    }
    tacticalSeekRogueSupport(e, pressure) {
      let attempts = 0;
      for (const group of this.tacticalRegroupGroups(e)) {
        for (const ally of group.members) {
          if (attempts++ >= 5) return false;
          const decision = this.tacticalBeginRogueRegroup(e, ally, pressure, true);
          if (decision === null) return null; // waiting for the complete validated path
          if (decision) {
            this.event('rogueRegroup', { actor: e.id, ally: ally.id });
            return true;
          }
        }
      }
      return false;
    }
    tacticalRogueOutnumbered(e) {
      // Present individuals on the hero's side are all effectively hero-level.
      // Every nearby active monster, of any species or strength, contributes
      // one defender; summons and bosses are meaningful support too.
      return (
        this.tacticalPresentOpponents(e) >= 2 &&
        this.tacticalPresentOpponents(e) > this.tacticalLocalSupport(e)
      );
    }
    tacticalAdvanceRogueRegroup(e, target, dt, committed = false) {
      const state = this.tacticalRogueRegroup(e);
      if (!state) return false;
      // Covering actions keep traveling, but cannot start another decision or
      // replace a committed warning when they arrive at support.
      if (committed && !['travel', 'escape'].includes(state.phase)) return false;
      if (state.phase === 'thinking') {
        state.thinkRemaining -= dt;
        e.noProgress = 0;
        if (state.thinkRemaining > 0) return true;
        const pressure = this.tacticalActiveTargetCount(e);
        const totalPressure = this.tacticalRogueOutnumbered(e)
          ? Math.max(pressure, R.tacticalFoundation.simultaneousPressureSources)
          : pressure;
        if (!this.tacticalRogueEligibility(e, totalPressure)) {
          this.tacticalStopRogueRegroup(e);
          return false;
        }
        const support = this.tacticalSeekRogueSupport(e, totalPressure);
        if (support === null || support) return true;
        // Exhausting local support is not a reason to spam an attack.
        // Field inhabitants seek remembered, more distant occupied posts.
        if (this.tacticalBeginExtendedRetreat(e)) return true;
        // Dungeon/side-dungeon leaders, or field leaders with no viable post,
        // can call temporary guards without altering native population.
        if (this.tacticalEmergencyCall(e)) {
          this._tacticalRegroups.set(e.id, {
            phase: 'anchored', anchor: { x: e.x, y: e.y },
            holdRemaining: 12, moveUsed: true, recruited: true,
          });
          return true;
        }
        // With no live reinforcements, a stationary captive guardian stands
        // near its captive rather than abandoning the encounter post.
        const captive = this.tacticalGuardedSpecialist(e);
        if (captive) {
          this._tacticalRegroups.set(e.id, {
            phase: 'guard-captive',
            destination: { x: captive.x, y: captive.y },
            travelRemaining: Math.max(12, dist(e, captive) / 150 + 5),
            stalled: 0,
          });
          return true;
        }
        // No support is not a license to reset a boss/captain encounter.
        // Nor should an ordinary enemy flee solely because the hero outlevels
        // it. Stand and fight until real numerical/wound pressure warrants
        // withdrawal or fresh support makes a counteroffensive viable.
        if (this.tacticalDefenderTerritory(e) ||
            !(this.tacticalRogueOutnumbered(e) || this.tacticalRogueWounded(e))) {
          this._tacticalRegroups.set(e.id, {
            phase: 'defend', anchor: { x: e.x, y: e.y }, holdRemaining: 6,
          });
          return true;
        }
        // Truly overwhelmed ordinary monsters get a finite escape, with
        // optional defensive covering casts that never replace locomotion.
        this._tacticalRegroups.set(e.id, {
          phase: 'escape',
          anchor: { x: e.x, y: e.y },
          fleeRemaining: R.tacticalFoundation.escapeSeconds,
          seekDelay: 0.9,
          stalled: 0,
        });
        this.tacticalRogueMove(e, target, true);
        return true;
      }
      if (state.phase === 'defend') {
        // Rejoin the native attack AI every frame: this is a fighting stance,
        // not an inert retreat or a two-second stationary Rogue-cast loop.
        // Periodically reconsider the situation, and react immediately if
        // allied support makes the fight favorable again.
        state.holdRemaining -= dt;
        if (!this.tacticalNeedsMoreSupport(e) || state.holdRemaining <= 0)
          this.tacticalStopRogueRegroup(e);
        return false;
      }
      if (state.phase === 'guard-captive') {
        const captive = this.tacticalGuardedSpecialist(e);
        state.travelRemaining -= dt;
        if (!captive || state.travelRemaining <= 0) {
          this.tacticalStopRogueRegroup(e);
          return false;
        }
        if (dist(e, captive) > 85) {
          const before = { x: e.x, y: e.y };
          this.follow(e, captive, 190 * this.mountedMovementFactor(e) * this.nightTempo(), dt, 70);
          state.stalled = dist(before, e) > Math.max(0.1, dt * 10)
            ? 0 : state.stalled + dt;
          e.noProgress = 0;
          if (state.stalled <= 2.5) return true;
        }
        this._tacticalRegroups.set(e.id, {
          phase: 'anchored', anchor: { x: e.x, y: e.y },
          holdRemaining: 12, moveUsed: false, recruited: true,
        });
        return true;
      }
      if (state.phase === 'escape') {
        // Defensive compatibility for a retreat already underway when a
        // leader is reassessed. An elite cannot transition into a reset loop.
        if (this.tacticalDefenderTerritory(e)) {
          this._tacticalRegroups.set(e.id, {
            phase: 'defend', anchor: { x: e.x, y: e.y }, holdRemaining: 6,
          });
          return false;
        }
        state.fleeRemaining -= dt;
        state.seekDelay -= dt;
        if (!committed && state.seekDelay <= 0) {
          state.seekDelay = 1;
          const support = this.tacticalSeekRogueSupport(e, this.tacticalActiveTargetCount(e));
          if (support) return true;
          if (support === null) state.seekDelay = 0; // keep fleeing, resume pending plan next update
          else if (this.tacticalBeginExtendedRetreat(e)) return true;
        }
        const radius = this.tacticalDefenderTerritory(e);
        if (radius && dist(e, this.tacticalDefenderPost(e)) >= radius - 55) {
          // A roaming or field leader may regroup, but must not desert its
          // defended encounter area when no help exists.
          this.disengage(e, dt);
          return true;
        }
        const before = { x: e.x, y: e.y },
          d = Math.max(1, dist(e, target)),
          away = {
            x: e.x + ((e.x - target.x) / d) * 145,
            y: e.y + ((e.y - target.y) / d) * 145,
          };
        this.move(
          e,
          away,
          (e.type === 'boss' ? 145 : 175) * 1.5 * this.mountedMovementFactor(e) * this.nightTempo(),
          dt,
          0,
        );
        state.stalled = dist(before, e) > Math.max(0.1, dt * 10) ? 0 : state.stalled + dt;
        e.noProgress = 0;
        if (dist(target, e) > 480 || state.fleeRemaining <= 0 || state.stalled > 1.8) {
          this.disengage(e, dt);
          return true;
        }
        // Covering casts are optional; movement remains authoritative.
        if (!committed && !e.telegraph && !e.motion && !e.rangedAim &&
            (this._tacticalRogueNext?.get(e.id) || 0) <= this.s.time &&
            dist(e, target) <= 320 && this.line(e, target))
          this.tacticalRogueMove(e, target, true);
        return true;
      }
      if (state.phase === 'travel') {
        state.travelRemaining -= dt;
        const ally = this.zone().enemies.find((unit) => unit.id === state.allyId);
        if (!ally || ally.hp <= 0 || ally.neutral || ally.returning || state.travelRemaining <= 0) {
          // An interrupted retreat stays attached to the current encounter,
          // rather than snapping back under the original-home leash.
          this._tacticalRegroups.set(e.id, {
            phase: 'thinking',
            anchor: { x: e.x, y: e.y },
            thinkRemaining: R.tacticalFoundation.thinkingSeconds,
          });
          e.path = [];
          e.routeAge = 0;
          e.noProgress = 0;
          return true;
        }
        if (dist(e, state.destination) > 65) {
          const before = { x: e.x, y: e.y };
          this.follow(
            e,
            state.destination,
            (e.type === 'boss' ? 145 : 175) *
              1.5 *
              this.mountedMovementFactor(e) *
              this.nightTempo(),
            dt,
            55,
          );
          state.stalled = dist(before, e) > Math.max(0.1, dt * 10) ? 0 : state.stalled + dt;
          if (state.stalled >= 2.5) {
            this._tacticalRegroups.set(e.id, {
              phase: 'thinking',
              anchor: { x: e.x, y: e.y },
              thinkRemaining: R.tacticalFoundation.thinkingSeconds,
            });
            e.path = [];
            e.routeAge = 0;
            e.noProgress = 0;
            return true;
          }
          e.noProgress = 0;
          return true;
        }
        state.phase = 'anchored';
        state.anchor = { x: e.x, y: e.y };
        state.recruited = false;
        state.moveUsed = false;
        e.path = [];
        e.routeAge = 0;
        if (committed) return true;
      }
      if (state.phase === 'anchored') {
        // A completed retreat is a real tactical decision, not an inert
        // target lock. An HP hit BEFORE arrival must not undo the refuge.
        // A fresh distant hit AT the post can request another Rogue decision
        // (support, defend or escape), but never forcibly converts it into
        // immediate pursuit. Preserve the existing two-second decision floor.
        const underFire = state.hitWhileAnchored ? this.enemyUnderFireAlert(e) : null;
        const source =
          underFire?.source === 'hero'
            ? this.hero
            : underFire?.source
              ? this.activeLivingParty().find((u) => u.id === underFire.source)
              : null;
        if (
          state.hitWhileAnchored &&
          e.type === 'mob' &&
          e.form === 'normal' &&
          !e.summon &&
          !e.rogueEmergencyReinforcement &&
          !e.captain &&
          !e.roomCaptain &&
          !e.fieldCaptain &&
          (this._tacticalRogueNext?.get(e.id) || 0) <= this.s.time &&
          source?.hp > 0 &&
          target === source &&
          dist(e, source) > 280 &&
          this.enemyRangedLine(e, source) &&
          this.tacticalRogueLeashAllows(e, source, 500) &&
          (this.isDungeon() ||
            dist(source, {
              x: D.towns[this.regionIndex()][0],
              y: D.towns[this.regionIndex()][1],
            }) >= 160)
        ) {
          this._tacticalRegroups.set(e.id, {
            phase: 'thinking',
            anchor: { x: e.x, y: e.y },
            thinkRemaining: R.tacticalFoundation.thinkingSeconds,
          });
          if (!this._tacticalRogueNext) this._tacticalRogueNext = new Map();
          this._tacticalRogueNext.set(e.id, this.s.time + R.tacticalFoundation.moveCooldownSeconds);
          e.path = [];
          e.routeAge = 0;
          e.noProgress = 0;
          return true;
        }
        // The temporary combat anchor follows a real continued encounter,
        // never changing the original respawn home.
        if (dist(e, state.anchor) > 340) {
          if (dist(target, e) <= 300) state.anchor = { x: e.x, y: e.y };
          else {
            this.tacticalStopRogueRegroup(e);
            return false;
          }
        }
        if (dist(target, e) > 280) {
          state.holdRemaining -= dt;
          if (state.holdRemaining <= 0) {
            if (this.tacticalDefenderTerritory(e)) {
              // The normal encounter leash, not Rogue regroup expiry,
              // decides whether a boss/captain may truly disengage.
              this.tacticalStopRogueRegroup(e);
              return false;
            }
            this.disengage(e, dt);
            return true;
          }
          e.noProgress = 0;
          return true;
        }
        state.holdRemaining = 12;
        this.tacticalRecruitRegroupAllies(e, state, target);
        // Use the shelter actually reached while an ally's restorative pulses are running.
        if (e.supportHeal && this.tacticalRogueWounded(e) && dist(target, e) > 180) {
          e.noProgress = 0;
          return true;
        }
        const pressure = this.tacticalActiveTargetCount(e);
        const wounded = this.tacticalRogueWounded(e);
        const freshWound = wounded && !this._tacticalWoundedUsed?.has(e.id);
        const pressureRemains =
          (this.tacticalRogueOutnumbered(e) ||
            this.tacticalNeedsMoreSupport(e)) &&
          this.tacticalRogueEligibility(e, Math.max(pressure, 2)) &&
          (this._tacticalRogueNext?.get(e.id) || 0) <= this.s.time &&
          !this.hawkRetreatLocked(e, 'regroup');
        if (
          !this.hawkRetreatLocked(e, 'regroup') &&
          ((freshWound && this.tacticalRogueEligibility(e, pressure)) || pressureRemains)
        ) {
          if (freshWound) {
            if (!this._tacticalWoundedUsed) this._tacticalWoundedUsed = new Set();
            this._tacticalWoundedUsed.add(e.id);
          }
          this._tacticalRegroups.set(e.id, {
            phase: 'thinking',
            thinkRemaining: R.tacticalFoundation.thinkingSeconds,
            anchor: state.anchor,
          });
          return true;
        }
        if (!state.moveUsed && this.tacticalRogueMove(e, target)) {
          state.moveUsed = true;
          return true;
        }
      }
      return false;
    }
    // Tactical one-action repertoire: each species keeps its basic maneuver;
    // elite signatures are authored for the species AND its actual combat role.
    tacticalRogueMove(e, fallback, fromRegroupAnchor = false) {
      if (e.hp <= 0 || e.returning || e.telegraph || e.motion || e.rangedAim) return false;
      // Enforce cast-to-cast cadence across initial, anchored, and interrupted
      // regroup paths; the decision cooldown alone cannot enforce this.
      const lastCast = this._tacticalRogueLastCast?.get(e.id);
      if (lastCast !== undefined &&
          this.s.time - lastCast < R.tacticalFoundation.moveCooldownSeconds - 1e-7)
        return false;
      const tier = this.tacticalProtectionTier(e),
        cfg = R.tacticalFoundation,
        profiles = cfg.rogueMoves,
        ranged = !!e.ranged,
        // One cast per existing Rogue window: Crown members alternate their
        // armored military doctrine with their own people's movement craft.
        // Their HP, hit strength and regular attack timers are untouched.
        crownDoctrineSpecies =
          e.crownTroop && e.crownAncestry
            ? (e.crownRogueTurn || 0) % 2
              ? 'crownguard'
              : e.crownAncestry
            : e.type === 'boss'
              ? cfg.bossSpeciesRogue?.[e.family] || e.species
              : e.species,
        namedBasic =
          (e.type === 'boss' && profiles.bosses[e.family]) ||
          ((e.captain || e.roomCaptain) && profiles.captains[e.captainProfile]) ||
          null,
        speciesBasic =
          (ranged && profiles.ranged[crownDoctrineSpecies]) ||
          profiles.species[crownDoctrineSpecies] ||
          null,
        basic =
          namedBasic && speciesBasic
            ? (e.rogueBasicTurn || 0) % 2 === 0
              ? speciesBasic
              : namedBasic
            : namedBasic ||
              (tier === 'guardian' && ranged && !e.crownTroop && profiles.rangedGuardian) ||
              speciesBasic ||
              (ranged && profiles.rangedFallback) ||
              profiles[tier] ||
              profiles.ordinary,
        signature =
          (e.type === 'boss' && cfg.rogueSignatures.bosses[e.family]) ||
          ((e.captain || e.roomCaptain) && cfg.rogueSignatures.captains[e.captainProfile]) ||
          (tier === 'ringleader' &&
            cfg.rogueRingleaderSignatures[ranged ? 'ranged' : 'melee'][crownDoctrineSpecies]),
        pressured =
          fromRegroupAnchor ||
          this.tacticalRogueOutnumbered(e) ||
          !!this.tacticalRogueRegroup(e)?.anchor,
        wantsSignature =
          tier === 'ringleader' ? pressured || this.tacticalRogueWounded(e) : pressured,
        threat = this.tacticalHighestThreatTarget(e, fallback),
        closeTargets =
          signature && ['scatter', 'sweep'].includes(signature.effect)
            ? this.combatTargets()
                .filter(
                  (unit) => unit.hp > 0 && dist(unit, e) <= signature.radius && this.line(e, unit),
                )
                .sort((a, b) => dist(e, a) - dist(e, b))
            : [],
        isSignature =
          !!signature &&
          wantsSignature &&
          (!['scatter', 'sweep'].includes(signature.effect) || closeTargets.length > 0),
        chosenProfile = isSignature
          ? signature
          : e.mountedCrownRider && crownDoctrineSpecies !== 'crownguard'
            ? {
                ...basic,
                name: e.ranged ? 'Crown Direwolf Archer Dash' : 'Crown Direwolf Lance Dash',
                style: 'dash',
                radius: 165 * R.balance.enemySpecialReachMultiplier,
              }
            : basic,
        coveringRetreat = ['extended', 'escape'].includes(this.tacticalRogueRegroup(e)?.phase),
        // Gap-closing dashes belong to a supported counteroffensive, not a
        // withdrawal. Retain the authored attack roster outside retreat.
        profile = coveringRetreat && chosenProfile.style === 'dash'
          ? (ranged && profiles.ranged[crownDoctrineSpecies]) || profiles.ordinary
          : chosenProfile,
        target =
          isSignature && closeTargets.length
            ? closeTargets.includes(threat)
              ? threat
              : closeTargets[0]
            : threat,
        maxRange =
          (e.type === 'boss' ? 500 : e.captain || e.roomCaptain ? 440 : 340) *
          R.balance.enemySpecialReachMultiplier;
      if (!target || dist(e, target) > maxRange || !this.line(e, target)) return false;
      if (profile.style === 'withdraw' && this.hawkRetreatLocked(e, 'withdraw')) return false;
      const effect = isSignature ? profile.effect : null,
        centered = effect === 'scatter' || effect === 'sweep',
        warning =
          profile.warning || (e.type === 'boss' ? 1.05 : e.captain || e.roomCaptain ? 0.95 : 0.75),
        radius =
          profile.radius ||
          (e.type === 'boss' ? 105 : e.captain || e.roomCaptain ? 95 : 80) *
            R.balance.enemySpecialReachMultiplier;
      e.telegraph = {
        rogueMove: true,
        rogueSignature: isSignature,
        defensiveCover: coveringRetreat,
        // Elite basic/signature Rogue actions show only a mobile actor cast,
        // while ordinary non-guardian monsters keep their original footprint.
        mobileRogueCast:
          e.type === 'boss' ||
          !!(e.captain || e.roomCaptain || e.fieldCaptain || e.guard) ||
          tier === 'guardian' ||
          tier === 'ringleader',
        anonymousCast: !!(isSignature && profile.anonymousCast),
        kind: profile.style === 'slab' ? 'line' : effect === 'sweep' ? 'cone' : 'circle',
        name: profile.name,
        style: profile.style || null,
        effect,
        coefficient: profile.coefficient,
        targetId: target === this.hero ? 'hero' : target.id,
        fromX:
          profile.style === 'slab'
            ? target.x - (target.x >= e.x ? 60 : -60) * R.balance.enemySpecialReachMultiplier
            : e.x,
        fromY: profile.style === 'slab' ? target.y : e.y,
        angle:
          profile.style === 'slab'
            ? target.x >= e.x
              ? 0
              : Math.PI
            : Math.atan2(target.y - e.y, target.x - e.x),
        x:
          profile.style === 'slab'
            ? target.x + (target.x >= e.x ? 100 : -100) * R.balance.enemySpecialReachMultiplier
            : centered
              ? e.x
              : target.x,
        y: centered ? e.y : target.y,
        radius,
        slowSeconds: profile.slowSeconds || 0,
        push: profile.push || 0,
        retreat: profile.retreat || 0,
        blinds: profile.blinds || 0,
        sidestep: profile.sidestep || 0,
        rallySeconds: profile.rallySeconds || 0,
        reinforceBelow: profile.reinforceBelow || 0,
        reinforceCap: profile.reinforceCap || 0,
        reinforceSpecies: profile.reinforceSpecies || null,
        reinforceRangedSpecies: profile.reinforceRangedSpecies || null,
        reinforceName: profile.reinforceName || null,
        timer: warning,
        total: warning,
        recovery: isSignature ? 1.05 : 0.8,
      };
      this.event(
        'warning',
        e.telegraph.anonymousCast
          ? { family: e.family, rogue: true, anonymousCast: true }
          : { family: e.family, rogue: true, name: profile.name },
      );
      this.event('rogueMove', {
        actor: e.id,
        name: profile.name,
        style: effect || profile.style,
        signature: isSignature,
      });
      if (!this._tacticalRogueLastCast) this._tacticalRogueLastCast = new Map();
      if (!this._tacticalRogueNext) this._tacticalRogueNext = new Map();
      this._tacticalRogueLastCast.set(e.id, this.s.time);
      this._tacticalRogueNext.set(e.id, Math.max(
        this._tacticalRogueNext.get(e.id) || 0,
        this.s.time + cfg.moveCooldownSeconds
      ));
      if (e.crownTroop && e.crownAncestry) e.crownRogueTurn = ((e.crownRogueTurn || 0) + 1) % 2;
      if (!isSignature && namedBasic && speciesBasic)
        e.rogueBasicTurn = ((e.rogueBasicTurn || 0) + 1) % 2;
      return true;
    }
    // Field commanders rally native ordinary-monster spawn records; Ridge Tyrant
    // instead rallies GUARD spawn records via tacticalRogueCommanderSupport.
    // Never manufacture new field enemies or count a boss's summoned warband.
    clearCinderResponses(e = null) {
      if (!this._tacticalCinderResponses) return;
      const canceled = [];
      for (const [id, state] of this._tacticalCinderResponses) {
        if (e && e.id !== id && e.id !== state.owner) continue;
        this._tacticalCinderResponses.delete(id);
        const unit = this.zone().enemies.find((u) => u.id === id);
        if (unit) {
          unit.path = [];
          unit.routeAge = 0;
        }
        if (e && e.id === state.owner && unit?.hp > 0 && !unit.returning) canceled.push(unit);
      }
      // Remove records before disengaging: the existing cancellation callback
      // can then clear an individual unit without recursively canceling peers.
      for (const unit of canceled) this.disengage(unit, 0);
    }
    cinderNativeResponse(e, move) {
      if (this.peace || e.hp <= 0 || !e.aggro || e.returning || e.neutral) return true;
      const z = this.zone(),
        cfg = R.bossSummoning.cinderResponse,
        native = (u) =>
          u !== e &&
          u.type === 'mob' &&
          u.form === 'normal' &&
          u.pack &&
          u.species === 'ashbeast' &&
          !u.guard &&
          !u.summon &&
          !u.neutral &&
          !u.nightOnly &&
          !u.captain &&
          !u.roomCaptain &&
          !u.mini &&
          u.home &&
          dist(u.home, e) <= cfg.radius,
        living = z.enemies.filter(
          (u) =>
            native(u) &&
            u.hp > 0 &&
            !u.returning &&
            !u.telegraph &&
            !u.motion &&
            !u.rangedAim &&
            !u.cinderDelegate &&
            dist(u, e) <= cfg.radius,
        ),
        party = this.combatTargets();
      if (!this._tacticalCinderResponses) this._tacticalCinderResponses = new Map();
      const admitted = () =>
        [...this._tacticalCinderResponses.values()].filter(
          (p) => p.owner === e.id && p.zone === this.zoneId,
        ).length;
      const candidates = [...living];
      if (living.length <= move.reinforceBelow)
        candidates.push(
          ...z.enemies.filter(
            (u) =>
              native(u) &&
              u.hp <= 0 &&
              u.deathPaid &&
              !this.blocked(u.home.x, u.home.y, z.id, 12) &&
              party.every((a) => a.hp <= 0 || dist(a, u.home) >= 115),
          ),
        );
      candidates.sort(
        (a, b) =>
          dist(a.hp > 0 ? a : a.home, e) - dist(b.hp > 0 ? b : b.home, e) || this.idOrder(a, b),
      );
      let recruited = 0;
      for (const u of candidates) {
        if (this._tacticalCinderResponses.has(u.id) || admitted() >= move.reinforceCap) continue;
        const origin = u.hp > 0 ? u : u.home,
          path = this.route(origin, e);
        if (
          !path.length ||
          (!this.isDungeon() &&
            path.some(
              (p) =>
                dist(p, { x: D.towns[this.regionIndex()][0], y: D.towns[this.regionIndex()][1] }) <
                170,
            ))
        )
          continue;
        if (u.hp <= 0) {
          Object.assign(u, u.home);
          u.hp = u.maxHp = u.baseHp;
          u.damage = u.baseDamage;
          u.deathPaid = false;
          u.heroParticipated = false;
          u.aggro = false;
          u.returning = 0;
          this.clearEncounterState(u);
          u.cd = 0.25;
          u.noProgress = 0;
        }
        this._tacticalCinderResponses.set(u.id, {
          owner: e.id,
          zone: this.zoneId,
          joined: false,
          remaining: cfg.travelSeconds,
          rallySeconds: move.rallySeconds,
          stalled: 0,
        });
        u.path = [];
        u.routeAge = 0;
        recruited++;
      }
      if (recruited)
        this.event('rogueSupport', { actor: e.id, allies: recruited, existingSpawns: true });
      // Arrival does not replace the retained Broodscreen rally. A later
      // roar refreshes the original readiness burst for the same joined six,
      // without redirecting a busy unit or interrupting its current warning.
      for (const [id, response] of this._tacticalCinderResponses) {
        if (response.owner !== e.id || !response.joined || response.zone !== this.zoneId) continue;
        const u = z.enemies.find((unit) => unit.id === id);
        if (!u || u.hp <= 0 || u.neutral || u.returning || dist(u, e) > cfg.radius) continue;
        u.pursuitBurst = Math.max(u.pursuitBurst || 0, move.rallySeconds);
        u.cd = Math.min(u.cd || 0, 0.5);
      }
      // Magical personnel retain independent ownership and cannot use up any
      // of the six ordinary response places.
      for (const u of this.bossOwnedSummons(e))
        if (
          u.aggro &&
          !u.returning &&
          dist(u, e) <= R.tacticalFoundation.supportRadius &&
          this.line(e, u)
        ) {
          u.pursuitBurst = Math.max(u.pursuitBurst || 0, move.rallySeconds);
          u.cd = Math.min(u.cd || 0, 0.5);
        }
      return true;
    }
    updateCinderResponse(u, dt) {
      const state = this._tacticalCinderResponses?.get(u.id);
      if (!state) return false;
      const owner = this.zone().enemies.find((e) => e.id === state.owner),
        cfg = R.bossSummoning.cinderResponse;
      if (
        state.zone !== this.zoneId ||
        !owner ||
        owner.hp <= 0 ||
        !owner.aggro ||
        owner.returning ||
        owner.neutral ||
        this.peace ||
        u.hp <= 0 ||
        u.neutral ||
        u.returning
      ) {
        this._tacticalCinderResponses.delete(u.id);
        u.path = [];
        u.routeAge = 0;
        if (u.hp > 0 && !u.returning) this.disengage(u, dt);
        return true;
      }
      if (state.joined) return false;
      if (dist(u, owner) <= cfg.joinRadius && this.line(u, owner)) {
        state.joined = true;
        u.path = [];
        u.routeAge = 0;
        this.engage(u, true, false);
        u.pursuitBurst = Math.max(u.pursuitBurst || 0, state.rallySeconds);
        return false;
      }
      state.remaining -= dt;
      const before = { x: u.x, y: u.y };
      this.follow(u, owner, cfg.speed, dt, cfg.joinRadius - 20);
      state.stalled = dist(before, u) > Math.max(0.1, dt * 10) ? 0 : state.stalled + dt;
      u.noProgress = 0;
      if (state.remaining <= 0 || state.stalled >= cfg.stallSeconds) {
        this._tacticalCinderResponses.delete(u.id);
        this.disengage(u, dt);
      }
      return true;
    }
    tacticalRogueFieldSupport(e, move) {
      if (
        e.type !== 'boss' ||
        !['warlord', 'cindermaw', 'darklord'].includes(e.family) ||
        !move.reinforceSpecies ||
        !move.reinforceCap
      )
        return false;
      if (e.family === 'cindermaw') return this.cinderNativeResponse(e, move);
      const z = this.zone(),
        radius = 750,
        species = [move.reinforceSpecies, move.reinforceRangedSpecies].filter(Boolean),
        nativeTroop = (u) =>
          u !== e &&
          u.type === 'mob' &&
          u.form === 'normal' &&
          !!u.pack &&
          !u.guard &&
          !u.summon &&
          !u.neutral &&
          !u.nightOnly &&
          !u.captain &&
          !u.roomCaptain &&
          !u.mini &&
          !u.site &&
          species.includes(u.species) &&
          !!u.home &&
          dist(u.home, e) <= radius,
        nearby = () =>
          z.enemies
            .filter((u) => nativeTroop(u) && u.hp > 0 && !u.returning && dist(u, e) <= radius)
            .sort((a, b) => dist(a, e) - dist(b, e) || this.idOrder(a, b)),
        living = nearby();
      if (living.length <= move.reinforceBelow) {
        const wanted = Math.max(0, move.reinforceCap - living.length),
          party = [this.hero, ...this.activeLivingParty()],
          dormant = z.enemies
            .filter(
              (u) =>
                nativeTroop(u) &&
                u.hp <= 0 &&
                u.deathPaid &&
                !this.blocked(u.home.x, u.home.y, z.id, 12) &&
                party.every((a) => a.hp <= 0 || dist(a, u.home) >= 115),
            )
            .sort((a, b) => dist(a.home, e) - dist(b.home, e) || this.idOrder(a, b));
        let returned = 0;
        for (const u of dormant.slice(0, wanted)) {
          Object.assign(u, u.home);
          u.hp = u.maxHp = u.baseHp;
          u.damage = u.baseDamage;
          u.deathPaid = false;
          u.heroParticipated = false;
          u.aggro = false;
          u.returning = 0;
          u.telegraph = null;
          u.rangedAim = null;
          u.motion = null;
          u.sequence = [];
          u.cd = 0.25;
          u.noProgress = 0;
          if (dist(u, e) <= R.tacticalFoundation.supportRadius && this.line(e, u))
            this.engage(u, true, false);
          returned++;
        }
        if (returned) {
          this.say(e.name + ' rallies ' + returned + ' returning ' + move.reinforceName + '.');
          this.event('rogueSupport', { actor: e.id, allies: returned, respawn: true });
        }
      }
      // Refresh ordinary spawn positions throughout the local area, but only
      // call defenders into combat when they are in the existing support radius.
      for (const u of nearby().slice(0, move.reinforceCap)) {
        if (!u.aggro && dist(u, e) <= R.tacticalFoundation.supportRadius && this.line(e, u))
          this.engage(u, true, false);
        if (u.aggro) {
          u.pursuitBurst = Math.max(u.pursuitBurst || 0, move.rallySeconds);
          u.cd = Math.min(u.cd || 0, 0.5);
        }
      }
      // Broodscreen and Crown Decree also rally their living, already engaged
      // owned troops. These summons never enter native respawn counts or caps.
      if (['cindermaw', 'darklord'].includes(e.family))
        for (const u of z.enemies) {
          if (
            !u.summon ||
            u.owner !== e.id ||
            u.hp <= 0 ||
            !u.aggro ||
            u.returning ||
            dist(u, e) > R.tacticalFoundation.supportRadius ||
            !this.line(e, u)
          )
            continue;
          u.pursuitBurst = Math.max(u.pursuitBurst || 0, move.rallySeconds);
          u.cd = Math.min(u.cd || 0, 0.5);
        }
      return true;
    }
    tacticalRogueCommanderSupport(e, move) {
      if (!move.reinforceSpecies || !move.reinforceCap) return false;
      const captain = ['supply-highlands', 'frontier-overseer'].includes(e.captainProfile),
        fieldBoss = e.type === 'boss' && e.family === 'ridge';
      if (!captain && !fieldBoss) return false;
      const z = this.zone(),
        range = fieldBoss ? 750 : 560,
        supports = (u) => {
          if (
            u === e ||
            u.neutral ||
            u.summon ||
            u.captain ||
            u.roomCaptain ||
            u.type !== 'mob' ||
            u.nightOnly ||
            u.form !== 'normal' ||
            u.site ||
            (u.mini && this.miniCleared(u.mini))
          )
            return false;
          if (e.captainProfile === 'supply-highlands')
            return u.guard && ['wolf', 'ogre', 'archer'].includes(u.species);
          if (e.captainProfile === 'frontier-overseer')
            return !u.guard && !u.mini && ['orc', 'archer'].includes(u.species);
          return u.guard && ['wolf', 'ogre', 'archer'].includes(u.species);
        },
        live = () =>
          z.enemies.filter((u) => supports(u) && u.hp > 0 && !u.returning && dist(u, e) <= range),
        existing = live();
      if (existing.length <= move.reinforceBelow) {
        // Existing defeated spawn identities only: no new monster objects.
        const available = z.enemies
          .filter(
            (u) =>
              supports(u) &&
              u.hp <= 0 &&
              u.home &&
              dist(u.home, e) <= range &&
              [this.hero, ...this.activeLivingParty()].every(
                (a) => a.hp <= 0 || dist(a, u.home) >= 105,
              ) &&
              !this.blocked(u.home.x, u.home.y, z.id, 12) &&
              this.clearSegment(e, u.home, 12),
          )
          .sort((a, b) => dist(a.home, e) - dist(b.home, e) || a.id.localeCompare(b.id));
        let revived = 0;
        for (const u of available.slice(0, Math.max(0, move.reinforceCap - existing.length))) {
          Object.assign(u, u.home);
          u.hp = u.baseHp;
          u.maxHp = u.baseHp;
          u.damage = u.baseDamage;
          u.returning = 0;
          u.deathPaid = false;
          u.heroParticipated = false;
          u.telegraph = null;
          u.motion = null;
          u.rangedAim = null;
          u.aggro = false;
          u.frenzy = false;
          u.cd = 0.5;
          u.pursuitBurst = Math.max(u.pursuitBurst || 0, move.rallySeconds);
          if (u.pack) delete z.packTimers[u.pack];
          if (dist(u, e) <= R.tacticalFoundation.supportRadius && this.line(e, u))
            this.engage(u, true, false);
          revived++;
        }
        if (revived) {
          this.say(e.name + ' recalls ' + revived + ' nearby defenders to their posts.');
          this.event('rogueSupport', { actor: e.id, allies: revived, existingSpawns: true });
        }
      }
      // Distant existing spawns occupy their posts, not automatic combat aggro.
      for (const ally of live()) {
        ally.pursuitBurst = Math.max(ally.pursuitBurst || 0, move.rallySeconds);
        if (ally.aggro) ally.cd = Math.min(ally.cd || 0, 0.5);
      }
      return true;
    }
    tacticalResolveRogueMove(e, move) {
      const target =
        move.targetId === 'hero'
          ? this.hero
          : this.combatTargets().find((u) => u !== this.hero && u.id === move.targetId);
      if (move.mobileRogueCast) {
        // Targeted Rogue actions must still be in the caster's actual reach
        // on release. Reanchoring the target marker alone cannot create
        // unlimited range against a player who escaped during preparation.
        if (
          move.effect !== 'scatter' &&
          move.effect !== 'sweep' &&
          (!target || target.hp <= 0 || dist(e, target) > move.radius || !this.line(e, target))
        )
          return;
        // No stale cast-origin circles: live caster/target positions at release
        // determine coverage, facing, collision and true escape opportunities.
        const centered = move.effect === 'scatter' || move.effect === 'sweep';
        const bearing = target?.hp > 0 ? Math.atan2(target.y - e.y, target.x - e.x) : move.angle;
        if (centered) {
          move.x = e.x;
          move.y = e.y;
          move.fromX = e.x;
          move.fromY = e.y;
        } else if (target?.hp > 0) {
          move.x = target.x;
          move.y = target.y;
        }
        move.angle = bearing;
        if (move.style === 'slab' && target?.hp > 0) {
          const side = target.x >= e.x ? 1 : -1;
          move.fromX = target.x - side * 60;
          move.fromY = target.y;
          move.x = target.x + side * 100;
          move.y = target.y;
        }
      }
      // The actual resolved maneuver owns one World decision. Invalid
      // mobile/reach/LOS casts returned above without sampling. Boss and
      // captain Rogue specials use separate delegated release owners later.
      const criticalReceipt =
        e.type !== 'boss' && !e.captain && !e.roomCaptain
          ? this.worldCriticalAction(e,
              move.rogueSignature ? 'world/rogue/signature' : 'world/rogue/basic')
          : null;
      if (!move.rogueSignature) {
        // The slab is a physical lane: dodging the originally marked target
        // must not cancel contact with other party members still inside it.
        if (e.family === 'mine' && move.style === 'slab') {
          const start = { x: move.fromX, y: move.fromY },
            side = Math.sign(move.x - move.fromX) || 1,
            hero = this.hero,
            zone = this.zoneId,
            deaths = this.s.statistics.deaths;
          for (const unit of this.combatTargets()) {
            if (
              unit.hp <= 0 ||
              this.distanceToSegment(unit, start, move) > R.combatGeometry.lineHalfWidth ||
              !this.line(e, unit)
            )
              continue;
            const destination = { x: unit.x + side * 100, y: unit.y };
            const landed = this.hitParty(
              unit,
              this.worldCriticalDamage(
                criticalReceipt, this.weakenedEnemyDamage(e) * move.coefficient,
              ),
              0,
              e.family === 'cindermaw' ? e.id : undefined,
            );
            if (
              this.hero !== hero ||
              this.zoneId !== zone ||
              this.s.statistics.deaths !== deaths ||
              this.s.challenge.pending ||
              this.s.challenge.gameOver
            )
              return;
            if (landed && unit.hp > 0 && this.clearSegment(unit, destination, 12))
              this.move(unit, destination, 280, 0.42);
          }
          return;
        }
        // Ordinary ground-marked basics cover the entire fixed warning circle.
        // Actor-only elite basics retain their targeted, reach-limited contract.
        const victims = (move.mobileRogueCast ? [target] : this.combatTargets()).filter(
          (unit) => unit && unit.hp > 0 && dist(unit, move) <= move.radius && this.line(e, unit),
        );
        if (!victims.length) return;
        const contactTarget = victims.includes(target) ? target : victims[0];
        const startingHero = this.hero,
          startingZone = this.zoneId,
          startingDeaths = this.s.statistics.deaths;
        if (move.style === 'dash' && !move.defensiveCover &&
            dist(e, contactTarget) > 95) {
          const previous = { x: e.x, y: e.y };
          this.move(
            e,
            contactTarget,
            e.mountedCrownRider ? 395 : 300,
            e.mountedCrownRider ? 0.36 : 0.3,
            85,
          );
          this.tacticalRecordRogueReposition(e, previous, contactTarget);
        }
        let landedAny = false;
        for (const victim of victims) {
          if (!this.hitParty(victim, this.worldCriticalDamage(
            criticalReceipt, this.weakenedEnemyDamage(e) * move.coefficient,
          ), 0, e.id))
            continue;
          landedAny = true;
          if (
            this.hero !== startingHero ||
            this.zoneId !== startingZone ||
            this.s.statistics.deaths !== startingDeaths ||
            this.s.challenge.pending ||
            this.s.challenge.gameOver
          )
            return;
          if (victim.hp <= 0) continue;
          if (move.style === 'shove') {
            const d = Math.max(1, dist(e, victim)),
              point = {
                x: victim.x + ((victim.x - e.x) / d) * 55,
                y: victim.y + ((victim.y - e.y) / d) * 55,
              };
            this.move(victim, point, 220, 0.25);
          } else {
            this.applyRogueSlow(
              victim,
              move.slowSeconds ||
                (e.form === 'ringleader' ? R.tacticalFoundation.eliteRogueSlowSeconds : 2),
              e.id, move.name,
            );
          }
        }
        if (!landedAny) return;
        if (move.blinds > 0) {
          // Dust blinds the victim narratively: the goblin briefly cannot be
          // DIRECTLY targeted, but is still vulnerable to area damage.
          e.rogueDustCoverUntil = Math.max(e.rogueDustCoverUntil || 0, this.s.time + move.blinds);
          // Break locked attacks immediately; party AI can pick another threat.
          this.tacticalDropDustTarget(e);
        }
        if (
          move.style === 'withdraw' &&
          move.retreat > 0 &&
          !this.hawkRetreatLocked(e, 'withdraw')
        ) {
          const d = Math.max(1, dist(e, contactTarget)),
            point = {
              x: e.x + ((e.x - contactTarget.x) / d) * move.retreat,
              y: e.y + ((e.y - contactTarget.y) / d) * move.retreat,
            };
          const defendedRadius = this.tacticalDefenderTerritory(e);
          if (this.clearSegment(e, point, 12) &&
              (!move.defensiveCover || !defendedRadius ||
                dist(point, this.tacticalDefenderPost(e)) < defendedRadius - 25))
            this.move(e, point, 350, 0.35);
        }
        return;
      }
      const inside = (unit) => {
        if (unit.hp <= 0 || !this.line(e, unit)) return false;
        if (dist(unit, move) > move.radius) return false;
        if (move.kind !== 'cone') return true;
        const bearing = Math.atan2(unit.y - move.y, unit.x - move.x),
          delta = Math.atan2(Math.sin(bearing - move.angle), Math.cos(bearing - move.angle));
        return Math.abs(delta) <= 1.1;
      };
      const startingHero = this.hero,
        startingZone = this.zoneId,
        startingDeaths = this.s.statistics.deaths;
      for (const unit of this.combatTargets().filter(inside)) {
        if (
          !this.hitParty(
            unit,
            this.worldCriticalDamage(
              criticalReceipt, this.weakenedEnemyDamage(e) * move.coefficient,
            ),
            0,
            e.family === 'cindermaw' ? e.id : undefined,
          )
        )
          continue;
        if (
          this.hero !== startingHero ||
          this.zoneId !== startingZone ||
          this.s.statistics.deaths !== startingDeaths ||
          this.s.challenge.pending ||
          this.s.challenge.gameOver
        )
          return;
        // A fallen companion does not end the hero's encounter, but cannot
        // receive a new slow or displacement. Other marked survivors still do.
        if (unit.hp <= 0) continue;
        if (move.effect === 'scatter' && e.family === 'thorn' && e.type === 'boss') {
          this.tacticalBeginScatter(e, unit, move.push || 70);
        } else if (move.effect === 'scatter' || move.effect === 'sweep') {
          const d = Math.max(1, dist(e, unit)),
            push = move.push || 65,
            point = {
              x: unit.x + ((unit.x - e.x) / d) * push,
              y: unit.y + ((unit.y - e.y) / d) * push,
            };
          this.move(unit, point, 250, 0.36);
        } else this.applyRogueSlow(unit, move.slowSeconds || 2.4, e.id, move.name);
      }
      if (
        move.rallySeconds > 0 &&
        !this.tacticalRogueFieldSupport(e, move) &&
        !this.tacticalRogueCommanderSupport(e, move)
      ) {
        // Other commanders motivate only ALREADY engaged units.
        for (const ally of this.zone().enemies) {
          if (
            ally === e ||
            ally.hp <= 0 ||
            !ally.aggro ||
            ally.returning ||
            dist(e, ally) > R.tacticalFoundation.supportRadius ||
            !this.line(e, ally)
          )
            continue;
          ally.pursuitBurst = Math.max(ally.pursuitBurst || 0, move.rallySeconds);
          ally.cd = Math.min(ally.cd || 0, 0.5);
        }
      }
      if (move.sidestep > 0 && target?.hp > 0) {
        const d = Math.max(1, dist(e, target)),
          away = { x: (e.x - target.x) / d, y: (e.y - target.y) / d },
          point = {
            x: e.x + (away.x * 0.65 - away.y * 0.35) * move.sidestep,
            y: e.y + (away.y * 0.65 + away.x * 0.35) * move.sidestep,
          };
        if (this.clearSegment(e, point)) {
          const previous = { x: e.x, y: e.y };
          this.move(e, point, 380, 0.36);
          this.tacticalRecordRogueReposition(e, previous, target);
        }
      }
    }
    tacticalRecruitRegroupAllies(e, state, target) {
      if (state.recruited || dist(target, e) > 280) return;
      state.recruited = true;
      let recruited = 0;
      for (const ally of this.tacticalRegroupCandidates(e)) {
        if (
          ally.aggro ||
          dist(ally, e) > R.tacticalFoundation.supportRadius ||
          dist(target, ally) > 320
        )
          continue;
        // No global limit or faction restrictions. Nearby reinforcements can
        // make further independent rogue decisions if the player keeps chasing.
        if (this.engage(ally, true, false) !== false) recruited++;
      }
      if (recruited) this.event('rogueSupport', { actor: e.id, allies: recruited });
    }
    tacticalAutoRogue(e, target) {
      const cfg = R.tacticalFoundation;
      const newWound = this.tacticalRogueWounded(e) && !this._tacticalWoundedUsed?.has(e?.id);
      if (
        !cfg.enabled ||
        this.peace ||
        !target ||
        !e?.aggro ||
        e.hp <= 0 ||
        e.returning ||
        e.rogueEmergencyReinforcement ||
        e.telegraph ||
        e.motion ||
        e.rangedAim ||
        this.tacticalRogueRegroup(e) ||
        this.hawkRetreatLocked(e, 'regroup') ||
        (!newWound && (this._tacticalRogueNext?.get(e.id) || 0) > this.s.time) ||
        (!newWound &&
          Number.isFinite(e.fightStart) &&
          this.s.time - e.fightStart < cfg.initialAssessmentSeconds)
      )
        return false;
      const pressure = this.tacticalActiveTargetCount(e);
      const totalPressure = this.tacticalRogueOutnumbered(e)
        ? Math.max(pressure, cfg.simultaneousPressureSources)
        : pressure;
      if (!this.tacticalRogueEligibility(e, totalPressure)) return false;
      if (!this._tacticalRegroups) this._tacticalRegroups = new Map();
      if (!this._tacticalRogueNext) this._tacticalRogueNext = new Map();
      if (newWound) {
        if (!this._tacticalWoundedUsed) this._tacticalWoundedUsed = new Set();
        this._tacticalWoundedUsed.add(e.id);
      }
      this._tacticalRegroups.set(e.id, {
        phase: 'thinking',
        thinkRemaining: cfg.thinkingSeconds,
      });
      this._tacticalRogueNext.set(e.id, this.s.time + cfg.moveCooldownSeconds);
      e.noProgress = 0;
      return true;
    }
    // Only ordinary, nonsummoned melee and melee Ringleaders receive the
    // validated short native recovery. Captain Overtime already grants
    // workers its own four-second burst and is deliberately excluded.
    // Leave summons, ranged/hybrid actors, bosses, captains and reset logic
    // on their existing behavior pending the separate territory audit #510.
    meleePursuitBurstEligible(e) {
      return !!(
        !this.peace && e && e.aggro && e.hp > 0 &&
        !e.neutral && !e.returning && e.type === 'mob' &&
        !e.captain && !e.roomCaptain && !e.fieldCaptain &&
        !e.summon && !e.developerSummon &&
        !e.rogueEmergencyReinforcement &&
        !(e.quotaOvertime > 0) &&
        !this.enemyRanged(e)
      );
    }

    // Tuned ordinary/elite melee basics preserve longer native actor reach.
    // Hybrid switch threshold is a distinct stance decision.
    enemyMeleeBasicRange(e) {
      const baseline =
        e?.type === 'boss' || e?.captain || e?.roomCaptain ||
        e?.fieldCaptain || e?.form === 'ringleader'
          ? R.balance.eliteMeleeBasicRange
          : R.balance.meleeBasicRange;
      return Math.max(baseline, e?.meleeBasicRange || 0);
    }

    // Hybrid actors retain both disciplines: native ranged healing/aim and
    // standoff spacing beyond this close-range threshold, ordinary melee
    // attack/pursuit inside it. These decisions use the same shared boundary
    // as the withdrawal covering attack path.
    enemyHybridMeleeRange(e) {
      return e.form === 'ringleader'
        ? R.rangedEnemyCombat.ringleaderHybridMeleeRange
        : R.balance.meleeBasicRange;
    }
    enemyBackpedalThreshold(e) {
      const band = this.enemyRangedRange(e) * R.rangedEnemyCombat.retreatFraction;
      // A hybrid's ranged posture has a small defensible buffer outside its
      // melee switch, avoiding immediate melee/ranged oscillation.
      return e.hybrid ? Math.max(band, this.enemyHybridMeleeRange(e) + 40) : band;
    }

    updateEnemies(dt) {
      // Called guards are not persistent dungeon slots. Reap dead bodies
      // after combat (not inside kill), without a per-frame roster scan.
      if (this._tacticalEmergencyCleanupPending) {
        this._tacticalEmergencyCleanupPending = false;
        for (const zone of Object.values(this.s.zones)) {
          if (!Array.isArray(zone.enemies)) continue;
          for (let i = zone.enemies.length - 1; i >= 0; i--) {
            const add = zone.enemies[i];
            if (add.rogueEmergencyReinforcement && add.hp <= 0)
              zone.enemies.splice(i, 1);
          }
        }
      }
      this.syncTreasuryRecovery(this.zone());
      const z = this.zone(),
        deaths = this.s.statistics.deaths,
        nightTempo = this.nightTempo(),
        hasWoundedAllies = z.enemies.some(
          (u) => u.hp > 0 && u.hp < u.maxHp && !u.neutral && !u.returning,
        );
      for (const e of [...z.enemies]) {
        // Safely retire in-flight Vale Interception from older v4 saves;
        // never re-interpret its warning/motion as a boss attack or dash.
        if (e.telegraph?.valeMeleeCounter) e.telegraph = null;
        if (e.motion?.valeMeleeCounter) e.motion = null;
        const recovery = this.cooldownRecoveryElapsed(e, dt, true);
        // Read remaining Slow before consuming it, including the final partial
        // frame. Apply readiness debt once even on scripted/early-continue paths.
        if (e.hp > 0) {
          const nextRogue = this._tacticalRogueNext?.get(e.id);
          if (recovery < dt && nextRogue > this.s.time - dt)
            this._tacticalRogueNext.set(e.id, this.slowCooldownReadyAt(e, nextRogue, dt, true));
          if (recovery < dt)
            for (const key of [
              'royalPrerogativeReadyAt',
              'passiveRepairReadyAt',
              'passiveVeteranReadyAt',
              'ledgerNextAt',
              'ashNextAt',
            ])
              if (e[key] > this.s.time - dt) e[key] = this.slowCooldownReadyAt(e, e[key], dt, true);
          if (e.slow > 0) e.slow = Math.max(0, e.slow - dt);
          if (!(e.slow > 0)) delete e.slowStacks;
        }
        // Advance existing restorative pulses even if a boss is holding a
        // board, scripted movement or other early-continuation state.
        if (e.hp > 0) {
          // Uninvolved actors must keep their original state shape and
          // deterministic non-healer simulation: don't create idle cooldown
          // fields for every monster during each ordinary combat tick.
          if ((e.supportHealCd || 0) > 0) e.supportHealCd = Math.max(0, e.supportHealCd - recovery);
          if ((e.hybridSelfHealCd || 0) > 0)
            e.hybridSelfHealCd = Math.max(0, e.hybridSelfHealCd - recovery);
          const leaderHealCd = enemyLeaderHealRecovery.get(e) || 0;
          if (leaderHealCd > 0) {
            const left = Math.max(0, leaderHealCd - recovery);
            if (left > 0) enemyLeaderHealRecovery.set(e, left);
            else enemyLeaderHealRecovery.delete(e);
          }
          const selfHealCd = captainSelfHealRecovery.get(e) || 0;
          if (selfHealCd > 0) {
            const left = Math.max(0, selfHealCd - recovery);
            if (left > 0) captainSelfHealRecovery.set(e, left);
            else captainSelfHealRecovery.delete(e);
          }
          if (e.hp > 0) this.tickRogueEnemyDot(e, dt);
          if (e.hp > 0 && e.supportHeal) this.advanceEnemySupportHeal(e, dt);
          if (e.hybridSelfHeal) this.advanceHybridSelfHeal(e, dt);
        } else {
          if (e.supportHeal) delete e.supportHeal;
          if (e.hybridSelfHeal) delete e.hybridSelfHeal;
        }
        if (e.hp <= 0) {
          if (e.respawn > 0 && !this.peace) {
            e.respawn -= dt;
            if (
              e.respawn <= 0 &&
              !this.s.pending[e.family] &&
              !z.enemies.some((a) => a !== e && a.family === e.family && a.hp > 0) &&
              !(e.family === 'darklord' && this.s.true.darklord)
            ) {
              Object.assign(e, this.bossEnemy(this.boss(e.family), 'normal', e.home));
              this.say(this.boss(e.family).name + ' has returned.');
            }
          }
          continue;
        }
        if (this.awaitsHeroAttack(e) && e.aggro) this.openingCompanionHit(e);
        if (this.updateOpeningRetreat(e, dt)) continue;
        if (e.family === 'citadel' && e.board && e.aggro && !e.returning) {
          this.sentinelUpdateBoard(e, dt);
          if (
            this.s.statistics.deaths !== deaths ||
            z !== this.zone() ||
            this.s.challenge.pending ||
            this.s.challenge.gameOver
          )
            return;
        }
        if (e.dressPost) {
          const post = e.dressPost;
          if (
            post.expires <= this.s.time ||
            e.returning ||
            !z.enemies.some((b) => b.id === post.owner && b.hp > 0 && b.aggro)
          ) {
            delete e.dressPost;
          } else if (dist(e, post) > 7) {
            this.move(e, post, 145 * this.mountedMovementFactor(e), dt);
            e.noProgress = 0;
            continue;
          } else delete e.dressPost;
        }
        if (e.neutral) {
          const t = this.s.time * 0.1 + Number(e.id.split('-')[1]);
          this.move(e, { x: e.home.x + Math.cos(t) * 35, y: e.home.y + Math.sin(t) * 35 }, 12, dt);
          continue;
        }
        if (
          (this.thornPatroller(e) && (e.returning || e.thornReturn)) ||
          (this.cinderPatroller(e) && (e.returning || e.cinderReturn)) ||
          (e.veraEscort && e.returning && this.zoneId === 'crown')
        ) {
          this.disengage(e, dt);
          continue;
        }
        e.slow = Math.max(0, e.slow || 0);
        if (!e.aggro && !e.eliteNightBonus) {
          const m = this.multipliers(),
            ratio = e.hp / e.maxHp;
          e.maxHp = e.baseHp * m.hp;
          e.hp = e.maxHp * ratio;
          e.damage = e.baseDamage * m.damage;
        }
        e.cd = Math.max(0, e.cd - recovery);
        e.specialCd = Math.max(0, (e.specialCd || 0) - recovery);
        e.summonCd = Math.max(0, (e.summonCd || 0) - recovery);
        if (e.family === 'crypt' && e.type === 'boss') {
          e.anastylosis = Math.max(0, (e.anastylosis || 0) - dt);
          e.anastylosisCd = Math.max(0, (e.anastylosisCd || 0) - recovery);
        }
        if (e.type === 'boss' && e.family === 'archive')
          e.sabotageCd = Math.max(0, (e.sabotageCd || 0) - recovery);
        e.healCd = Math.max(0, (e.healCd || 0) - recovery);
        e.pursuitBurst = Math.max(0, (e.pursuitBurst || 0) - dt);
        const openBefore = e.open || 0;
        e.open = Math.max(0, openBefore - dt);
        if (e.type === 'boss' && e.family === 'mine' && openBefore > 0 && e.open === 0)
          this.snapshotPassiveCoreRelock(e);
        e.captainGuard = Math.max(0, (e.captainGuard || 0) - dt);
        if (e.captain || e.roomCaptain) {
          e.captainReflect = Math.max(0, (e.captainReflect || 0) - dt);
          e.captainPursuit = Math.max(0, (e.captainPursuit || 0) - dt);
        }
        e.quotaOvertime = Math.max(0, (e.quotaOvertime || 0) - dt);
        if (!e.quotaOvertime) delete e.quotaTarget;
        if (
          e.family === 'ridge' &&
          e.type === 'boss' &&
          e.aggro &&
          this.s.time >= (e.ledgerNextAt || Infinity)
        ) {
          const biggest = this.tacticalThreatSnapshot(e).find(
            (a) => a.source === 'hero' || this.s.party.some((u) => u.id === a.source && u.hp > 0),
          );
          e.ledgerMarkedId = biggest?.source || 'hero';
          e.ledgerMarkUntil = this.s.time + 5;
          e.ledgerNextAt = this.s.time + 12;
        }
        if (
          e.family === 'warlord' &&
          e.type === 'boss' &&
          e.aggro &&
          this.s.time >= (e.ashNextAt || Infinity)
        ) {
          e.ashCloud = { x: e.x, y: e.y, expires: this.s.time + 6 };
          e.ashNextAt = this.s.time + 18;
        }
        if (
          e.family === 'warlord' &&
          e.type === 'boss' &&
          e.ashCloud &&
          e.ashCloud.expires > this.s.time
        )
          for (const victim of this.combatTargets()) this.ashMovementFactor(victim);
        if (e.fieldCaptain && e.captainPhase && e.aggro && e.hp > 0) {
          e.captainOvertimeCd = Math.max(0, (e.captainOvertimeCd ?? 12) - recovery);
          if (e.captainOvertimeCd === 0) {
            this.captainOvertimeRecruit(e);
            e.captainOvertimeCd = 12;
          }
        }
        if (e.captain || e.roomCaptain) this.triggerCaptainPhase(e);
        if (
          e.form === 'ringleader' &&
          !e.frenzy &&
          e.hp <= e.maxHp * R.ringleaderScaling.frenzyThreshold
        ) {
          e.frenzy = true;
          e.cd = Math.min(e.cd, 0.2);
          e.specialCd *= 0.65;
          if (e.rangedAim) e.rangedAim.timer *= R.ringleaderScaling.frenzyAim;
          this.event('eliteFrenzy', { species: e.species });
        }
        if (
          e.type === 'boss' &&
          e.form === 'true' &&
          e.hp <= e.maxHp * 0.5 &&
          !e.trueHalfSummonWave
        ) {
          e.trueHalfSummonWave = true;
          this.summonBossAdds(e, this.trueSummonPlan(e), this.bossSummonCap(e));
          e.summonCd = Math.max(e.summonCd || 0, R.bossSummoning.trueCooldown * 0.6);
          this.say(e.name + ' reinforces its TRUE warband.');
        }
        if (
          this.s.statistics.deaths !== deaths ||
          this.s.challenge.pending ||
          this.s.challenge.gameOver ||
          z !== this.zone()
        )
          return;
        // Mirejaw commits completely to its death roll; the victim cannot act.
        if (e.family === 'mire' && e.type === 'boss' && e.deathRoll) {
          const roll = e.deathRoll,
            victim =
              roll.victim === 'hero' ? this.hero : this.s.party.find((u) => u.id === roll.victim);
          if (!victim || victim.hp <= 0 || e.hp <= 0) {
            if (victim) victim.deathRollHeld = false;
            e.deathRoll = null;
          } else {
            roll.life -= dt;
            roll.elapsed += dt;
            while (roll.hits < 3 && roll.elapsed + 1e-9 >= (roll.hits + 1) * 0.5 && victim.hp > 0) {
              roll.hits++;
              const hero = this.hero,
                zone = this.zoneId,
                deaths = this.s.statistics.deaths;
              const landed = this.hitParty(victim, roll.totalDamage / 3, 0, e.id, true);
              if (this.hero !== hero || this.zoneId !== zone || this.s.statistics.deaths !== deaths)
                return;
              if (landed)
                this.enemyVfxResolvedContact?.(e, roll, victim, {
                  ...R.attacks.mire[0],
                  kind: 'cone',
                  index: 0,
                });
            }
            if (roll.life <= 0 || victim.hp <= 0) {
              victim.deathRollHeld = false;
              if (victim.hp > 0) this.applySlow(victim, 2);
              e.deathRoll = null;
            }
            continue;
          }
        }
        const cinderAdvanced = this.updateCinderRegularState(e, dt, recovery);
        if (this.s.statistics.deaths !== deaths) return;
        if (cinderAdvanced) continue;
        if (this.updateCinderResponse(e, dt)) continue;
        const candidates = this.combatTargets();
        // Keeper focuses available archers, the healers, within normal combat reach.
        const ridgeOwner = e.summon
          ? z.enemies.find((u) => u.id === e.owner && u.type === 'boss' && u.family === 'ridge')
          : null;
        const ridgeLeader =
          ridgeOwner && e.ranged
            ? ridgeOwner.ledgerMarkUntil > this.s.time
              ? ridgeOwner.ledgerMarkedId
              : this.tacticalThreatSnapshot(ridgeOwner)[0]?.source
            : null;
        const ridgeTarget =
          ridgeLeader === 'hero'
            ? this.hero
            : candidates.find((u) => u.id === ridgeLeader && u.hp > 0) || null;
        const keeperHealer =
          e.type === 'boss' && e.family === 'archive'
            ? candidates
                .filter(
                  (u) =>
                    u.type === 'archer' &&
                    !u.keeperHeld &&
                    u.hp > 0 &&
                    dist(e, u) <= 600 &&
                    this.line(e, u),
                )
                .sort((u, v) => dist(e, u) - dist(e, v))[0]
            : null;
        const keeperHero =
          e.type === 'boss' &&
          e.family === 'archive' &&
          !candidates.some((u) => u.type === 'archer' && u.hp > 0)
            ? this.hero
            : null;
        let target =
          keeperHero ||
          (ridgeTarget && dist(e, ridgeTarget) < 700 && this.line(e, ridgeTarget)
            ? ridgeTarget
            : null) ||
          keeperHealer ||
          (e.quotaOvertime > 0 && this.hero.hp > 0
            ? this.hero
            : e.summon &&
                (e.ranged || e.trueSummonRole === 'captain') &&
                this.hero.hp > 0 &&
                dist(e, this.hero) < 700
              ? this.hero
              : candidates.sort((a, b) => dist(e, a) - dist(b, e))[0]);
        // Hybrid restoration is a self-action, independent of allied support
        // and available in both active encounters and a wounded idle phase.
        if (!e.aggro && this.enemyHybridSelfHeal(e)) continue;
        // An arriving wounded ally does not have to drag the healer into combat first.
        if (
          !e.aggro &&
          hasWoundedAllies &&
          (this.enemySupportHeal(e) || this.enemySupportApproach(e, dt))
        )
          continue;
        if (!e.aggro && e.fieldCaptain) this.updateCaptainPatrol(e, dt);
        else if (
          !e.aggro &&
          !e.veraEscort &&
          !this.updateThornPatrol(e, dt) &&
          !this.updateCinderInspection(e, dt) &&
          !this.updateVeraEscort(e, dt)
        )
          this.updateIdleWander(e, dt);
        // Bosses can be provoked for ordinary attacks, but must preserve
        // their scripted special-target choice and arena rules.
        const scriptedBossTarget = target;
        // Judgment provokes living targets without deleting boss telegraphs,
        // attack phases or the encounter's existing leash restrictions.
        if (
          (e.tauntUntil || 0) > this.s.time &&
          this.hero.hp > 0 &&
          dist(e, this.hero) <= 620 &&
          this.line(e, this.hero)
        )
          target = this.hero;
        if (e.guard && !e.ranged && this.hero.hp > 0) {
          const screenFor = z.enemies.find(
            (u) => u !== e && u.guard && u.pack === e.pack && u.ranged && u.hp > 0,
          );
          if (screenFor && dist(this.hero, screenFor) < R.rangedEnemyCombat.guardianScreenRange)
            target = this.hero;
        }
        if (
          !e.aggro &&
          // Reject distant targets before tracing through every intervening
          // obstacle. The same range and visibility rules still gate aggro.
          (this.enemyRanged(e)
            ? dist(e, target) <= this.enemyAcquisitionRange(e)
            : dist(e, target) < this.enemyAcquisitionRange(e)) &&
          this.enemyRangedLine(e, target) &&
          (!this.isDungeon() &&
          dist(target, { x: D.towns[this.regionIndex()][0], y: D.towns[this.regionIndex()][1] }) <
            170
            ? false
            : true)
        )
          this.engage(e, false);
        if (e.returning) {
          this.disengage(e, dt);
          continue;
        }
        if (!e.aggro) {
          if (e.veraEscort) this.updateVeraEscort(e, dt);
          continue;
        }
        const territory =
          e.type === 'boss'
            ? this.isDungeon()
              ? 1800
              : 700
            : e.fieldCaptain
              ? 900
              : e.quotaOvertime > 0
                ? 1300
                : e.summon
                  ? 900
                  : 500;
        // A real recent damaging actor takes priority over a merely closer
        // bystander, provided they are visible and inside the ORIGINAL leash.
        // Boss/captain scripting, taunts and unrelated pack acquisition retain
        // their existing targeting rules.
        if (
          e.aggro &&
          e.type !== 'boss' &&
          !e.captain &&
          !e.roomCaptain &&
          !(e.tauntUntil > this.s.time)
        ) {
          const alert = this.enemyUnderFireAlert(e);
          if (alert?.source) {
            const attacker =
              alert.source === 'hero'
                ? this.hero
                : this.activeLivingParty().find((unit) => unit.id === alert.source);
            if (
              attacker?.hp > 0 &&
              this.tacticalRogueLeashAllows(e, attacker, territory) &&
              this.enemyRangedLine(e, attacker) &&
              (this.isDungeon() ||
                dist(attacker, {
                  x: D.towns[this.regionIndex()][0],
                  y: D.towns[this.regionIndex()][1],
                }) >= 160)
            )
              target = attacker;
          }
        }
        if (
          !this.tacticalRogueLeashAllows(e, target, territory) ||
          (!this.isDungeon() &&
            dist(target, { x: D.towns[this.regionIndex()][0], y: D.towns[this.regionIndex()][1] }) <
              160)
        ) {
          this.disengage(e, dt);
          continue;
        }
        if (e.returning) {
          this.disengage(e, dt);
          continue;
        }
        const mobilityReset = this.fieldBossMobilityReset(e, target, dt);
        if (mobilityReset) {
          this.disengage(e, dt, mobilityReset);
          continue;
        }
        if (this.enemyHybridSelfHeal(e)) continue;
        if (this.enemySupportHeal(e)) continue;
        if (this.enemySupportApproach(e, dt)) continue;
        // Healing wins the next free decision, including a fresh Rogue window.
        // Committed warnings, motions and aiming still own their release clocks.
        if (
          e.type === 'boss' &&
          !e.telegraph &&
          !e.motion &&
          !e.rangedAim &&
          !this.mageSilenceActive(e) &&
          e.cd <= 0 &&
          this.line(e, target) &&
          dist(e, target) < R.bossCadence.specialRange &&
          this.startBossRecovery(e)
        )
          continue;
        // Native pursuit and existing Rogue tactics retain their own cadence.
        if (!this.mageSilenceActive(e) && this.tacticalAutoRogue(e, target)) continue;
        const covering = !!(e.telegraph?.withdrawal || e.rangedAim?.withdrawal),
          regroup = this.tacticalRogueRegroup(e),
          extendedCover = regroup?.phase === 'extended' && !!e.telegraph?.rogueMove,
          escapeCover = regroup?.phase === 'escape' && !!e.telegraph?.rogueMove;
        if (regroup && !e.motion &&
            ((!e.telegraph && !e.rangedAim) || covering || extendedCover || escapeCover)) {
          const held = regroup.phase === 'extended'
            ? this.tacticalAdvanceExtendedRetreat(e, target, dt)
            : this.tacticalAdvanceRogueRegroup(e, target, dt, covering || escapeCover);
          if (e.returning || !e.aggro) continue;
          if (extendedCover || escapeCover) {
            // Defensive casting does not override ongoing outward locomotion.
          } else if (covering) this.enemyWithdrawalCastPosition(e);
          else if (held) {
            if (['travel', 'escape', 'anchored', 'guard-captive'].includes(this.tacticalRogueRegroup(e)?.phase))
              this.enemyWithdrawalAction(e, target, scriptedBossTarget);
            continue;
          }
        }
        if (e.telegraph && this.mageSilenceActive(e)) {
          // Existing warned specials remain queued, but cannot resolve
          // inside a Silence Field. Pausing the warning preserves boss
          // phase/sequence integrity rather than erasing authored attacks.
          e.noProgress = 0;
          continue;
        }
        if (e.telegraph) {
          if (e.telegraph.rogueMove && e.telegraph.mobileRogueCast &&
              !['extended', 'escape'].includes(this.tacticalRogueRegroup(e)?.phase)) {
            // Cast preparation does not create an extra strike or freeze the
            // elite actor. Reuse ordinary collision-aware, leash-bounded travel.
            const castTarget =
              e.telegraph.targetId === 'hero'
                ? this.hero
                : this.combatTargets().find((u) => u.id === e.telegraph.targetId);
            if (castTarget?.hp > 0 && this.line(e, castTarget)) {
              const gap = dist(e, castTarget),
                rangedCast = !!e.ranged && !e.hybrid,
                stop = rangedCast
                  ? e.mountedCrownRider
                    ? 125
                    : Math.min(e.shotRange || 280, 205)
                  : 70,
                pace =
                  (e.type === 'boss' ? 145 : 175) *
                  this.mountedMovementFactor(e) *
                  (e.form === 'ringleader' ? R.ringleaderScaling.pursuit : 1) *
                  (e.captainPhaseMove || 1) *
                  this.ownedSummonMovementFactor(e) *
                  (e.quotaOvertime > 0 ? 1.15 : 1) *
                  (e.slow > 0 ? 0.5 : 1) *
                  nightTempo;
              if (gap > stop + 8) {
                this.follow(e, castTarget, pace, dt, stop);
              } else if (rangedCast) {
                // Preserve a genuinely hittable release: an archer may
                // withdraw while casting, but cannot drift outside the
                // basic Rogue maneuver's own legal contact radius.
                const keep = Math.min(110, Math.max(45, e.telegraph.radius - 12));
                if (gap < keep) {
                  const step = keep - gap;
                  const retreat = {
                    x: e.x + ((e.x - castTarget.x) / Math.max(1, gap)) * step,
                    y: e.y + ((e.y - castTarget.y) / Math.max(1, gap)) * step,
                  };
                  if (dist(retreat, e.home) < territory && this.clearSegment(e, retreat, 12))
                    this.move(
                      e,
                      retreat,
                      R.rangedEnemyCombat.retreatSpeed * this.mountedMovementFactor(e) * nightTempo,
                      dt,
                    );
                }
              }
            }
          }
          e.telegraph.timer -= dt;
          e.noProgress = 0;
          if (e.telegraph.timer <= 0) {
            const a = e.telegraph;
            const hero = this.hero,
              zone = this.zoneId,
              deaths = this.s.statistics.deaths;
            this.resolveAttack(e);
            if (this.hero !== hero || this.zoneId !== zone || this.s.statistics.deaths !== deaths)
              return;
            e.telegraph = e.motion ? null : this.advanceQueuedAttack(e);
            if (e.family === 'mine' && a.index !== 1 && e.telegraph?.index === 1)
              this.prepareMineWorksPreview(e);
            if (e.telegraph)
              this.event(
                'warning',
                e.telegraph.anonymousCast
                  ? { family: e.family, anonymousCast: true }
                  : { family: e.family },
              );
            if (!e.telegraph && !e.motion) {
              e.cd =
                a.recovery *
                (e.type === 'boss'
                  ? R.bossCadence.specialRecoveryMultiplier
                  : e.captainAttackRate || 1);
              if (!a.rogueMove)
                e.basicDue =
                  e.type === 'boss' && e.attackIndex % R.bossCadence.skillsPerBasic === 0;
              if (a.opening)
                e.open = e.form === 'true' && e.family === 'citadel' ? a.opening / 2 : a.opening;
            }
          }
          continue;
        }
        if (e.rangedAim) {
          if (e.rangedAim.withdrawal && !this.tacticalRogueRegroup(e))
            this.enemyBackpedal(e, target, dt, territory);
          e.rangedAim.timer -= dt;
          if (e.rangedAim.timer <= 0) {
            const a = e.rangedAim,
              angle = Math.atan2(a.y - e.y, a.x - e.x),
              pace = R.rangedEnemyCombat;
            if (this.enemyRangedLine(e, a)) {
              // Aim is not a release. Sample once here, only when the real
              // ranged shot launches; collision, dodges and armor stay native.
              const criticalReceipt = this.worldCriticalRelease(e, 'ranged');
              const style = e.projectileStyle || 'arrow';
              const shot = {
                id: 'projectile-' + this.s.nextId++,
                x: e.x,
                y: e.y,
                dx: Math.cos(angle),
                dy: Math.sin(angle),
                speed: (e.shotSpeed || 260) * pace.projectileMultiplier,
                life: 2.5 / pace.projectileMultiplier,
                damage: this.worldCriticalDamage(
                  criticalReceipt, this.weakenedEnemyDamage(e) * (e.hybrid ? 0.85 : 1),
                ),
                ...(criticalReceipt ? { criticalExecution: criticalReceipt } : {}),
                style,
                slow: e.projectileSlow || 0,
                manaDrain: R.manaBalance.rangedDrain[e.species] || 0,
                source: 'enemy',
                sourceId: e.id,
                species: e.species,
              };
              this.prepareFortProjectile(shot, e, a);
              this.s.projectiles.push(shot);
              this.event('projectileLaunch', {
                actor: 'enemy',
                source: e.id,
                species: e.species,
                family: e.family,
                style,
                x: e.x,
                y: e.y,
              });
            }
            e.rangedAim = null;
            const cooldown = pace.cooldown * (e.frenzy ? R.ringleaderScaling.frenzyCooldown : 1),
              aimTime = a.total ?? pace.aimTime;
            // Keep the visible aiming warning intact. Shorten recovery enough
            // to apply the rate bonus to the complete aim-and-shot cycle.
            e.cd =
              nightTempo === 1
                ? cooldown
                : Math.max(0, (cooldown + aimTime) / nightTempo - aimTime);
          }
          e.noProgress = 0;
          continue;
        }
        if (e.motion) {
          this.advanceMotion(e, dt);
          e.noProgress = 0;
          continue;
        }
        const d = dist(e, target),
          hybridMeleeRange = this.enemyHybridMeleeRange(e),
          ranged =
            (e.ranged ?? ['archer', 'crownguard'].includes(e.species)) &&
            !(e.hybrid && d <= hybridMeleeRange),
          range = ranged ? this.enemyRangedRange(e) : this.enemyMeleeBasicRange(e),
          retreatRange = ranged ? this.enemyBackpedalThreshold(e) : 0,
          before = { x: e.x, y: e.y },
          visible = this.line(e, target),
          firingLine = ranged ? this.enemyRangedLine(e, target) : visible;
        let opportunity = false;
        if (
          (e.captain || e.roomCaptain) &&
          !this.mageSilenceActive(e) &&
          e.specialCd <= 0 &&
          visible &&
          d < (this.captainProfile(e)?.specialRange || 420) &&
          this.startCaptainAttack(e, target)
        ) {
          opportunity = true;
        } else if (
          e.type === 'boss' &&
          !this.mageSilenceActive(e) &&
          e.cd <= 0 &&
          d < R.bossCadence.specialRange &&
          visible &&
          (!e.basicDue || d > 200) &&
          this.startAttack(e, scriptedBossTarget)
        ) {
          opportunity = true;
        } else if (
          e.nightOnly &&
          !this.mageSilenceActive(e) &&
          !this.rogueEnemySilenced(e) &&
          e.specialCd <= 0 &&
          visible &&
          d <
            (e.species === 'wraith'
              ? R.nightEnemyCombat.wraith.radius
              : 360 * R.balance.enemySpecialReachMultiplier) &&
          this.startNightSkill(e, target)
        ) {
          opportunity = true;
        } else if (retreatRange && d < retreatRange && visible) {
          opportunity = this.enemyBackpedal(e, target, dt, territory);
          if (opportunity) this.enemyWithdrawalAction(e, target, scriptedBossTarget);
        }
        // Hybrids inherit ranged spacing during melee recovery while keeping
        // their melee pursuit, healing, ranged attacks and Rogue decisions.
        if (!opportunity && e.hybrid && visible)
          opportunity = this.enemyHybridBackstep(e, target, dt, territory);
        if (!opportunity && d <= range && e.cd <= 0 && firingLine) {
          this.enemyStartBasic(e, target, ranged);
          opportunity = true;
        }
        if (!opportunity && (d > range || !firingLine)) {
          // Saved long readiness migrates through the existing deadline.
          // Neither the active burst nor the targeting/collision rules change.
          const enhancedMeleePursuit =
            target === this.hero && this.meleePursuitBurstEligible(e);
          if (
            enhancedMeleePursuit &&
            e.pursuitBurstReadyAt > this.s.time + pursuitBurstSeconds + R.balance.pursuit.meleeRecoverySeconds
          )
            e.pursuitBurstReadyAt =
              this.s.time + pursuitBurstSeconds + R.balance.pursuit.meleeRecoverySeconds;
          if (
            target === this.hero &&
            visible &&
            d > range &&
            this.s.time >= (e.pursuitBurstReadyAt || 0) &&
            !(e.pursuitBurst > 0)
          ) {
            // Native speed/duration, follow collision and leash are shared.
            // Bosses/captains, their summons and pure ranged keep old cadence.
            e.pursuitBurst = pursuitBurstSeconds;
            e.pursuitBurstUsed = true;
            e.pursuitBurstReadyAt = this.s.time + (
              enhancedMeleePursuit
                ? pursuitBurstSeconds + R.balance.pursuit.meleeRecoverySeconds
                : e.type === 'boss' ? 5.5 : 7
            );
          }
          this.follow(
            e,
            target,
            (e.type === 'boss' ? 145 : 175) *
              this.mountedMovementFactor(e) *
              (e.form === 'ringleader' ? R.ringleaderScaling.pursuit : 1) *
              (e.captainPhaseMove || 1) *
              this.ownedSummonMovementFactor(e) *
              (e.captainPursuit > 0 ? 1.2 : 1) *
              (e.quotaOvertime > 0 ? 1.15 : 1) *
              (e.slow > 0 ? 0.5 : 1) *
              (e.pursuitBurst > 0 ? pursuitBurstMultiplier : 1) *
              nightTempo,
            dt,
            visible ? range - 8 : 0,
          );
        }
        const progress = dist(before, e) > Math.max(0.1, dt * 10);
        if (opportunity || progress) e.noProgress = 0;
        else e.noProgress += dt;
        // A blocked pursuit after a genuine hit must not look like an inert
        // target dummy. Only sidestep when movement was needed and impossible;
        // do not interrupt normal ranged cooldowns or committed Rogue actions.
        if (
          !opportunity &&
          !progress &&
          (d > range || !firingLine) &&
          e.noProgress >= 0.6 &&
          !this.tacticalRogueRegroup(e) &&
          this.enemyUnderFireSidestep(e, dt, territory)
        )
          e.noProgress = 0;
        if (e.noProgress >= 12) this.disengage(e, dt);
      }
      this.updateThornCaptive(dt);
      this.updateVeraFieldwork(dt);
    }
    disengage(e, dt, resetPoint = null) {
      const resume = this.patrolResume(e);
      if (!e.returning) {
        if (e.family === 'mine' && e.type === 'boss')
          this.zone().props = this.zone().props.filter((p) => !p.garunTemporary && !p.garunPreview);
        this.tacticalClearThreat(e);
        this.clearEnemyUnderFire(e);
        this.tacticalClearBurst(e);
        this.tacticalClearRogueRegroup(e);
        if (e.form === 'ringleader') this.tacticalRetireEmergencyGuards(e);
        this._tacticalScatterLeash?.delete(e.id);
        this._tacticalRepositions?.delete(e.id);
        delete e.rogueDustCoverUntil;
        this.cancelEncounter(e);
        e.returning = 1;
        e.pursuitBurst = 0;
        this.say(e.name + ' disengages.');
        this.event('reset');
      }
      if (resetPoint) this.beginFieldBossReturn(e, resetPoint);
      const mobilityReturn = this.advanceFieldBossReturn(e, dt);
      if (mobilityReturn) {
        if (mobilityReturn.waiting) return;
        Object.assign(e, mobilityReturn.point);
        e.returning = 0;
      } else if (this.thornPatroller(e)) {
        e.thornReturn = true;
        e.aggro = false;
        const before = { x: e.x, y: e.y },
          n = this.thornCaptive();
        const together =
          !n || !this.thornCaptiveFollowing() || dist(n, e) <= R.thornPatrol.waitForCaptive;
        const goal = resume?.point || e.home;
        if (together) this.follow(e, goal, R.thornPatrol.speed, dt, 0);
        if (dist(before, e) > 0) this.recordThornTracks(e, before);
        if (dist(e, goal) > 1e-7 || !together) return;
        e.returning = 0;
        delete e.thornReturn;
        e.thornLeg = resume?.leg ?? R.thornPatrol.startLeg;
        e.thornPause = resume ? resume.pause : R.thornPatrol.pause;
      } else if (this.cinderPatroller(e)) {
        e.cinderReturn = true;
        e.aggro = false;
        const together = this.cinderEntourageTogether(e);
        const goal = resume?.point || e.home;
        if (together) this.follow(e, goal, R.cinderInspection.speed, dt, 0);
        if (dist(e, goal) > 1e-7 || !together) return;
        e.returning = 0;
        delete e.cinderReturn;
        if (resume?.destination) e.cinderDestination = { ...resume.destination };
        else delete e.cinderDestination;
        e.cinderStop = resume?.stop ?? 0;
        e.cinderInspectionPause = resume ? resume.inspectionPause : R.cinderInspection.pauseMin;
      } else if (e.veraEscort && this.zoneId === 'crown') {
        e.aggro = false;
        const minister =
            this.veraHeld() &&
            this.zone().enemies.find((u) => this.cinderPatroller(u) && u.hp > 0 && !u.neutral),
          goal = minister || e.home,
          stop = minister ? 65 : 0;
        this.follow(e, goal, R.cinderInspection.guardSpeed, dt, stop);
        if (dist(e, goal) > stop + 1e-7) return;
        e.returning = 0;
      } else e.returning -= dt;
      if (e.returning <= 0) {
        if (
          !resume &&
          !mobilityReturn &&
          !(e.veraEscort && this.zoneId === 'crown' && this.veraHeld())
        )
          Object.assign(e, e.home);
        this.finishDisengage(e);
      }
    }

    // Shared post-return combat reset: ordinary leashes and emergency rescue
    // must retire identical cooldowns, boss phases and summon flags.
    finishDisengage(e) {
      this.clearEnemyUnderFire(e);
      enemyLeaderHealRecovery.delete(e);
      captainSelfHealRecovery.delete(e);
      e.aggro = false;
      delete e.ashCloud;
      delete e.ashNextAt;
      delete e.ledgerOpen;
      delete e.ledgerMarkedId;
      delete e.ledgerMarkUntil;
      e.telegraph = null;
      e.sequence = [];
      e.motion = null;
      e.rangedAim = null;
      e.hp = e.baseHp;
      e.maxHp = e.baseHp;
      delete e.supportHeal;
      delete e.hybridSelfHeal;
      e.hybridSelfHealCd = 0;
      e.supportHealCd = 0;
      e.damage = e.baseDamage;
      e.returning = 0;
      e.heroParticipated = false;
      e.mercyProvoked = false;
      e.noProgress = 0;
      e.pursuitBurstUsed = false;
      delete e.pursuitBurstReadyAt;
      e.frozen = false;
      e.frenzy = false;
      for (const key of [
        'passiveAerialUntil',
        'passiveRepairReadyAt',
        'passiveVeteranUntil',
        'passiveVeteranReadyAt',
        'passiveVeteranHits',
        'passiveRegenTotal',
        'passiveViolationUntil',
        'passiveViolationStacks',
      ])
        delete e[key];
      e.captainPhase = false;
      e.captainPhaseMove = 1;
      e.captainAttackRate = 1;
      e.captainGuard = 0;
      if (e.captain || e.roomCaptain) {
        e.captainReflect = 0;
        e.captainPursuit = 0;
        e.captainOvertimeCd = 0;
      }
      e.quotaOvertime = 0;
      e.captainOpeningSummon = false;
      if (e.family === 'darklord') {
        // A complete leash return starts a genuinely new encounter.
        delete e.secondWindUsed;
        delete e.secondWindCancelled;
        delete e.secondWindFacing;
        delete e.royalTaxation;
        delete e.royalTaxShield;
        delete e.royalPrerogativeReadyAt;
        delete e.crownDecreeZone;
        e.healCd = 0;
      }
      delete e.quotaTarget;
      delete e.idleWanderTarget;
      e.idleWanderWait = 1.5;
      e.specialCd = e.captain || e.roomCaptain ? 1.25 : e.nightOnly ? 1.5 : 0;
      e.summonCd = 0;
      e.sabotageCd = 0;
      delete e.mireLowestHpRatio;
      if (e.hookedVictim) {
        const held =
          e.hookedVictim === 'hero' ? this.hero : this.s.party.find((u) => u.id === e.hookedVictim);
        if (held) held.keeperHeld = null;
        e.hookedVictim = null;
      }
      if (e.captain || e.roomCaptain)
        this.zone().enemies = this.zone().enemies.filter((u) => !(u.summon && u.owner === e.id));
      if (e.type === 'boss' && e.form === 'true') {
        this.zone().enemies = this.zone().enemies.filter((u) => !(u.summon && u.owner === e.id));
        e.trueEntourageSpawned = false;
        e.trueHalfSummonWave = false;
      }
      this.releasePatrolResume(e);
    }

    fieldTrueSpawnPoint(base) {
      const size = this.definition().size,
        i = this.regionIndex(),
        town = { x: D.towns[i][0], y: D.towns[i][1] },
        minor = this.minorRefugePoint(),
        home = base.home || base,
        hero = this.hero,
        z = this.zone(),
        margin = 260;
      const raw = [
        [0.16, 0.18],
        [0.5, 0.14],
        [0.84, 0.18],
        [0.18, 0.5],
        [0.82, 0.5],
        [0.16, 0.82],
        [0.5, 0.86],
        [0.84, 0.82],
        [0.34, 0.32],
        [0.66, 0.68],
        [0.68, 0.32],
        [0.32, 0.68],
      ]
        .map(([rx, ry]) => ({ x: Math.round(size * rx), y: Math.round(size * ry) }))
        .sort((a, b) => dist(b, home) - dist(a, home));
      for (const candidate of raw) {
        let p;
        try {
          p = this.safe(candidate.x, candidate.y);
        } catch (_) {
          continue;
        }
        if (
          dist(p, home) < Math.max(650, size * 0.24) ||
          dist(p, hero) < 380 ||
          dist(p, town) < 320 ||
          dist(p, minor) < 260
        )
          continue;
        if (
          z.npcs.some((n) => dist(p, n) < 150) ||
          z.enemies.some((e) => e.hp > 0 && !e.neutral && dist(p, e) < 120)
        )
          continue;
        if (p.x < margin || p.y < margin || p.x > size - margin || p.y > size - margin) continue;
        if (!this.route(hero, p).length) continue;
        return p;
      }
      for (let r = Math.max(700, size * 0.28); r <= size * 0.6; r += 140)
        for (let n = 0; n < 16; n++) {
          const a = (n * Math.PI) / 8,
            p0 = { x: home.x + Math.cos(a) * r, y: home.y + Math.sin(a) * r };
          let p;
          try {
            p = this.safe(p0.x, p0.y);
          } catch (_) {
            continue;
          }
          if (
            dist(p, home) < 650 ||
            dist(p, hero) < 380 ||
            dist(p, town) < 320 ||
            dist(p, minor) < 260 ||
            z.npcs.some((npc) => dist(p, npc) < 150) ||
            z.enemies.some((e) => e.hp > 0 && !e.neutral && dist(p, e) < 120)
          )
            continue;
          if (this.route(hero, p).length) return p;
        }
      return null;
    }
    updateElites(dt) {
      for (const [key, p] of Object.entries(this.s.pending)) {
        if (p.kind === 'dungeon' || p.zone !== this.s.zone || p.active) continue;
        p.delay -= dt;
        if (p.delay > 0) continue;
        const points = [];
        if (p.kind === 'field') {
          const point = this.fieldTrueSpawnPoint(p.base);
          if (point) points.push(point);
        } else
          for (let i = 0; i < p.count; i++) {
            let point = null;
            for (let n = 0; n < 24; n++) {
              const a = (n * Math.PI) / 12,
                x = p.base.home.x + Math.cos(a) * (210 + i * 110),
                y = p.base.home.y + Math.sin(a) * (210 + i * 110);
              if (
                !this.blocked(x, y) &&
                dist({ x, y }, this.hero) > 200 &&
                (this.isDungeon() ||
                  [
                    { x: D.towns[this.regionIndex()][0], y: D.towns[this.regionIndex()][1] },
                    this.minorRefugePoint(),
                  ].every((point) => dist({ x, y }, point) > 220)) &&
                !points.some((q) => dist(q, { x, y }) < 100)
              ) {
                point = { x, y };
                break;
              }
            }
            if (!point) break;
            points.push(point);
          }
        if (points.length !== p.count) continue;
        for (const point of points) {
          const e =
            p.kind === 'field'
              ? this.bossEnemy(this.boss(key), 'true', point)
              : this.makeEnemy(
                  {
                    species: key,
                    name: p.base.name + ' Ringleader',
                    icon: p.base.icon,
                    form: 'ringleader',
                    hp: p.base.baseHp * R.ringleaderScaling.hp,
                    damage: p.base.baseDamage * R.ringleaderScaling.damage,
                    level: p.base.level + 2,
                    ...this.ringleaderRewards(p.base),
                  },
                  point,
                );
          e.eliteKey = key;
          if (e.form === 'ringleader') e.ringleaderHealthVersion = 3;
          if (p.base.guard) e.guard = true;
          if (p.base.mini) {
            e.mini = p.base.mini;
            e.site = p.base.site;
            e.miniRewardVersion = 1;
          }
          for (const f of [
            'ranged',
            'hybrid',
            'shotRange',
            'shotSpeed',
            'projectileStyle',
            'meleeBalanceVersion',
            'guardianBalanceVersion',
            'nightBalanceVersion',
            'reinforcement',
            'awakenedGuard',
            'mountedCrownRider',
            'crownTroop',
            'crownAncestry',
            'crownRogueTurn',
            'trueSummon',
            'trueSummonRole',
          ])
            if (p.base[f] !== undefined) e[f] = p.base[f];
          if (p.base.nightOnly) {
            e.nightOnly = true;
            const bonus = p.nightBonus || {
              hp: p.base.maxHp / p.base.baseHp,
              damage: p.base.damage / p.base.baseDamage,
            };
            e.eliteNightBonus = bonus;
            e.maxHp = e.hp = e.baseHp * bonus.hp;
            e.damage = e.baseDamage * bonus.damage;
          }
          if (key === 'thorn' && p.kind === 'field') e.home = { ...this.fieldCenter(0) };
          if (key === 'cindermaw' && p.kind === 'field') e.home = { ...this.fieldCenter(4) };
          this.zone().enemies.push(e);
        }
        p.active = true;
        if (p.kind === 'field') {
          this.say('A TRUE boss has appeared.');
          this.notice(
            this.boss(key).name +
              ' TRUE has appeared elsewhere in ' +
              this.definition().name +
              (key === 'thorn'
                ? ' · Follow scout tracks and ask at the Orchard trail witness'
                : ' · Map: Z'),
            6.5,
            '',
            'warning',
          );
        } else this.say('Ringleaders have appeared.');
      }
      for (const [key, p] of Object.entries(this.s.pending))
        if (
          p.active &&
          p.kind !== 'dungeon' &&
          p.zone === this.s.zone &&
          !this.zone().enemies.some(
            (e) =>
              e.hp > 0 &&
              (e.eliteKey === key || (p.kind === 'field' && e.family === key && e.form === 'true')),
          )
        )
          delete this.s.pending[key];
    }
    retireSpentReinforcements(z) {
      // Native corpses still anchor respawns and specialist revivals. Only
      // paid, ordinary dungeon reinforcement deaths are candidates for retirement.
      if (!dungeonIds.includes(z.id)) return 0;
      const disposable = (e) =>
        e.reinforcement === true &&
        e.guard &&
        e.type === 'mob' &&
        e.form === 'normal' &&
        e.hp <= 0 &&
        e.deathPaid &&
        !e.neutral &&
        !e.summon &&
        !e.captain &&
        !e.roomCaptain &&
        !e.family &&
        !e.owner &&
        !(e.respawn > 0) &&
        !e.supportHeal;
      if (!z.enemies.some(disposable)) return 0;
      const commander = z.enemies.some(
        (e) =>
          (e.type === 'boss' && e.family === 'ridge') ||
          ['supply-highlands', 'frontier-overseer'].includes(e.captainProfile),
      );
      const referenced = new Set();
      const retain = (v) => {
        if (typeof v === 'string') referenced.add(v);
      };
      for (const p of [...this.s.projectiles, ...this.s.hazards]) {
        retain(p.sourceId);
        retain(p.targetId);
        retain(p.target);
        retain(p.owner);
      }
      for (const p of Object.values(this.s.pending)) retain(p.base?.id);
      retain(this.s.heroTarget);
      for (const u of [this.hero, ...this.s.party, ...z.enemies]) {
        retain(u.owner);
        retain(u.order?.id);
        retain(u.targetId);
        retain(u.supportHeal?.source);
        retain(u.telegraph?.targetId);
        retain(u.rangedAim?.targetId);
      }
      const count = z.enemies.length;
      z.enemies = z.enemies.filter(
        (e) =>
          !disposable(e) ||
          referenced.has(e.id) ||
          (commander && ['wolf', 'ogre', 'archer'].includes(e.species)),
      );
      return count - z.enemies.length;
    }
    updateGuardianReinforcements(dt) {
      if (this.peace || !dungeonIds.includes(this.s.zone)) return;
      const z = this.zone();
      this.retireSpentReinforcements(z);
      const boss = z.enemies.find((e) => e.type === 'boss' && e.hp > 0 && !e.neutral),
        cfg = R.dungeonReinforcement;
      if (!boss) {
        z.guardianReinforcementTimer = 0;
        return;
      }
      const region = this.definition(),
        original = this.dungeonGuardCount(z.id),
        target = Math.ceil(original * cfg.targetFraction),
        formation = R.dungeonGuardFormations?.[z.id] || null,
        postCount = formation?.length || R.guardPosts.length,
        aliveGuards = () => z.enemies.filter((e) => e.guard && e.hp > 0 && !e.neutral);
      let alive = aliveGuards().length;
      if (alive >= target) {
        z.guardianReinforcementTimer = 0;
        return;
      }
      if (z.enemies.filter((e) => e.hp > 0 && !e.neutral && e.aggro).length >= cfg.engagedLimit)
        return;
      z.guardianReinforcementTimer = (z.guardianReinforcementTimer || 0) + dt;
      if (z.guardianReinforcementTimer < cfg.delay) return;
      const min = boss.aggro ? cfg.bossMinGroup : cfg.minGroup,
        max = boss.aggro ? cfg.bossMaxGroup : cfg.maxGroup,
        wanted = Math.min(
          target - alive,
          original - alive,
          min + Math.floor(this.random() * (max - min + 1)),
        ),
        points = [],
        targets = this.combatTargets(),
        start = (z.guardianReinforcementWave || 0) * 4;
      for (let j = 0; j < wanted; j++) {
        let chosen = null;
        for (let n = 0; n < postCount; n++) {
          const index = (start + j + n) % postCount,
            g = this.dungeonGuardBlueprint(z.id, index),
            p = this.safe(g.x, g.y, z.id);
          if (
            targets.some((u) => dist(p, u) < cfg.spawnDistance) ||
            dist(p, boss) < 180 ||
            aliveGuards().some((e) => dist(p, e) < 90) ||
            points.some((q) => dist(p, q.p) < 100)
          )
            continue;
          chosen = { p, index, g };
          break;
        }
        if (!chosen) break;
        points.push(chosen);
      }
      if (!points.length) return;
      const i = this.regionIndex(),
        awakened = boss.form === 'true' && this.s.phase === 'awakening' && this.s.awakeningLevel;
      for (const { p, index, g } of points) {
        const pack = Math.floor(index / 2),
          sp = g.sp,
          level = awakened ? this.s.awakeningLevel : Math.max(1, i * 3 + (pack % 2) + 1),
          hp = awakened
            ? Math.round((120 + 35 * this.s.awakeningLevel) * R.awakenedGuardianScaling.hp)
            : 65 + i * 105,
          damage = awakened
            ? Math.round((12 + this.s.awakeningLevel) * R.awakenedGuardianScaling.damage)
            : 7 + i * 8,
          e = this.makeEnemy(
            {
              species: sp[0],
              name: (awakened ? 'Awakened ' : '') + g.name + ' reinforcement',
              icon: sp[2],
              level,
              hp,
              damage,
              gold: 0,
              xp: 0,
            },
            p,
          );
        e.guard = true;
        e.reinforcement = true;
        e.pack = z.id + '-reinforcement-' + (z.guardianReinforcementWave || 0);
        if (g.role) e.forcedRole = g.role;
        if (awakened) e.awakenedGuard = true;
        this.configureEnemy(e, index);
        z.enemies.push(e);
      }
      this.guardianPopulation(z);
      z.guardianReinforcementWave = (z.guardianReinforcementWave || 0) + 1;
      z.guardianReinforcementTimer = 0;
      this.say('Dungeon guardians reinforce their posts.');
    }
    updatePacks(dt) {
      if (this.peace) return;
      const z = this.zone(),
        packs = new Set(),
        groups = new Map();
      // Build membership once per update, preserving both the first ordinary
      // member's pack order and every member's original roster order. Guards
      // sharing an ordinary pack still participate in its existing lifecycle.
      for (const e of z.enemies) {
        if (!e.pack) continue;
        if (!e.guard) packs.add(e.pack);
        const members = groups.get(e.pack);
        if (members) members.push(e);
        else groups.set(e.pack, [e]);
      }
      let nearbyParty;
      for (const pack of packs) {
        const members = groups.get(pack);
        if (
          members.some((e) => e.hp > 0) ||
          members.some((e) =>
            (nearbyParty ||= [this.hero, ...this.activeLivingParty()]).some(
              (u) => dist(e.home, u) < 350,
            ),
          )
        ) {
          delete z.packTimers[pack];
          continue;
        }
        z.packTimers[pack] = (z.packTimers[pack] || 0) + dt;
        if (z.packTimers[pack] >= 60) {
          for (const e of members) {
            Object.assign(e, e.home);
            e.hp = e.baseHp;
            e.maxHp = e.baseHp;
            e.deathPaid = false;
            e.heroParticipated = false;
            e.aggro = false;
            if (e.captain || e.roomCaptain) {
              e.captainPhase = false;
              e.captainPhaseMove = 1;
              e.captainAttackRate = 1;
              e.captainGuard = 0;
              e.captainReflect = 0;
              e.captainPursuit = 0;
              e.captainOvertimeCd = 0;
              e.specialCd = 1.25;
            }
          }
          delete z.packTimers[pack];
        }
      }
    }
    traps() {
      if (this.peace || this.supplyRoom()) return [];
      const z = this.zone(),
        side = this.sideDungeon(),
        dungeon = dungeonIds.includes(this.s.zone),
        tune = side
          ? R.sideDungeonTrapTuning[side.region]
          : dungeon
            ? R.dungeonTrapTuning[this.s.zone]
            : R.outdoorMiniTrapTuning[this.s.zone],
        activeMinis = side || dungeon ? [] : (z.minis || []).filter((m) => !m.cleared),
        posts = side
          ? (side.traps || []).map(([x, y, kind], index) => ({ x, y, kind, index: 200 + index }))
          : dungeon
            ? R.dungeonTraps[this.s.zone].map(([x, y, kind], index) => ({ x, y, kind, index }))
            : activeMinis.flatMap((m, mi) => {
                const saved = (m.trapPosts || []).map((p) => ({ ...p, miniId: m.id }));
                if (saved.length) return saved;
                const kinds = R.outdoorMiniTrapKinds[this.s.zone] || ['spikes'],
                  returnOffsets = [[50, 65]];
                return returnOffsets.map(([dx, dy], j) => ({
                  x: m.x + dx,
                  y: m.y + dy,
                  kind: kinds[Math.min(j, kinds.length - 1)],
                  index: 100 + (mi + 1) * 10 + j,
                  miniId: m.id,
                }));
              });
      return posts.map(({ x, y, kind, index, miniId }) => {
        const p = this.safe(x, y),
          cycleLength = tune?.cycle || 8,
          warningTime = tune?.warning || 1.5,
          activeTime = tune?.active || 0.6,
          offset = tune?.offset || 1.35,
          elapsed = z.clock + index * offset,
          phase = elapsed % cycleLength;
        return {
          ...p,
          kind,
          miniId,
          radius: kind === 'seal' ? tune?.sealRadius || 58 : tune?.radius || 42,
          length: kind === 'jet' ? tune?.jetLength || 140 : 0,
          halfWidth: tune?.jetHalfWidth || 28,
          phase,
          warningTime,
          activeTime,
          cycleLength,
          damageFraction: tune?.damage || 0.08,
          slowSeconds: tune?.slow || 2,
          cycle: Math.floor(elapsed / cycleLength),
          index,
        };
      });
    }
    trapContains(t, u) {
      return t.kind === 'jet'
        ? this.distanceToSegment(
            u,
            { x: t.x - t.length / 2, y: t.y },
            { x: t.x + t.length / 2, y: t.y },
          ) < (t.halfWidth || 28)
        : dist(u, t) < t.radius;
    }
    // A jet's blast pushes perpendicular to its fiery lane, never through
    // solid terrain or into the authored footprint of another installation.
    // This is immediate collision-aware movement, not a saved Stun/Root state.
    trapJetPush(unit, trap) {
      const safety = (trap.halfWidth || 28) + 24,
        direction = unit.y < trap.y ? -1 : 1,
        landing = { x: unit.x, y: trap.y + direction * safety };
      if (
        !this.clearSegment(unit, landing) ||
        this.traps().some(
          (other) => other.index !== trap.index && this.trapContains(other, landing),
        )
      )
        return false;
      return this.move(unit, landing, 260, 0.35, 0, true);
    }
    updateTraps(dt) {
      const hero = this.hero,
        zone = this.zoneId;
      for (const t of this.traps())
        if (t.phase >= t.warningTime && t.phase < t.warningTime + t.activeTime)
          for (const u of [this.hero, ...this.activeLivingParty()]) {
            u.trapHits = u.trapHits || {};
            const key = this.s.zone + ':layout' + (this.zone().dungeonVersion || 2) + ':' + t.index;
            if (u.trapHits[key] !== t.cycle && this.trapContains(t, u)) {
              u.trapHits[key] = t.cycle;
              const landed = this.hitParty(u, u.maxHp * t.damageFraction);
              if (
                this.hero !== hero ||
                this.zoneId !== zone ||
                this.s.challenge.pending ||
                this.s.challenge.gameOver
              )
                return;
              if (!landed || u.hp <= 0) continue;
              if (t.kind === 'seal') this.applySlow(u, t.slowSeconds);
              else if (t.kind === 'spikes') this.applySlow(u, t.slowSeconds * 0.35);
              else if (t.kind === 'jet') this.trapJetPush(u, t);
            }
          }
    }
    updateNight() {
      if (this.s.mode === 'arena' || this.peace) return; // Test spawns are menu-controlled.

      const i = this.regionIndex();
      if (this.isDungeon() || ![1, 3].includes(i)) return;
      const z = this.zone();
      if (this.night()) {
        if (!z.enemies.some((e) => e.nightOnly && e.hp > 0) && !z.nightSpawned) {
          const species = i === 1 ? 'wraith' : 'stalker',
            cfg = R.nightEnemyCombat[species],
            hold = (R.creatureStrongholds || []).find(
              (s) => s.region === z.id && s.nightSpecies === species,
            ),
            center = hold ? this.creatureStrongholdCenter(z, hold) : { x: 1700, y: 900 },
            spots = hold?.nightSpots || [
              [-95, -20],
              [-25, -95],
              [80, -65],
              [100, 35],
            ];
          for (let j = 0; j < 4; j++) {
            const [dx, dy] = spots[j],
              p = this.safe(center.x + dx, center.y + dy, z.id),
              e = this.makeEnemy(
                {
                  species,
                  name: i === 1 ? 'Lantern wraith' : 'Ash stalker',
                  icon: '👻',
                  level: i * 3 + 2,
                  hp: Math.round((120 + i * 100) * cfg.hp),
                  damage: Math.round((12 + i * 7) * cfg.damage),
                  ...this.regionalEnemyRewards(i, 'night'),
                },
                p,
              );
            e.nightOnly = true;
            e.nightBalanceVersion = 1;
            e.specialCd = 1 + j * 0.35;
            e.stronghold = hold?.id || null;
            z.enemies.push(e);
          }
          z.nightSpawned = true;
        }
      } else {
        if (i === 1) {
          // Dawn ends the shore challenge without granting kill rewards.
          for (const e of z.enemies.filter((e) => e.nightOnly && e.species === 'wraith')) {
            this.cancelEncounter(e);
            this.clearEncounterState(e);
          }
          z.enemies = z.enemies.filter((e) => !e.nightOnly || e.species !== 'wraith');
          for (const [key, p] of Object.entries(this.s.pending))
            if (
              p.zone === z.id &&
              p.kind === 'mob' &&
              p.base?.nightOnly &&
              p.base.species === 'wraith'
            )
              delete this.s.pending[key];
        } else
          z.enemies = z.enemies.filter((e) => !e.nightOnly || e.aggro || e.form === 'ringleader');
        z.nightSpawned = false;
      }
    }
    updateEscort(dt) {
      const z = this.s.zones.frontier;
      if (z?.escort) delete z.escort;
    }
  }
  const World = typeof PrototypeWorld !== 'undefined' ? PrototypeWorld : require('./world.js');
  World.install(Campaign, { D, R, dungeonIds, classes });
  const FieldOnboarding =
    typeof PrototypeFieldOnboarding !== 'undefined'
      ? PrototypeFieldOnboarding
      : require('./field-onboarding.js');
  FieldOnboarding.install(Campaign, { R });
  const Highlands =
    typeof PrototypeHighlands !== 'undefined' ? PrototypeHighlands : require('./highlands.js');
  Highlands.install(Campaign, { D, R });
  const Navigation =
    typeof PrototypeNavigation !== 'undefined' ? PrototypeNavigation : require('./navigation.js');
  Navigation.install(Campaign, D, R, dungeonIds);
  const Fortifications =
    typeof PrototypeFortifications !== 'undefined'
      ? PrototypeFortifications
      : require('./fortifications.js');
  Fortifications.install(Campaign, { R });
  const Progression =
    typeof PrototypeProgression !== 'undefined'
      ? PrototypeProgression
      : require('./progression.js');
  Progression.install(Campaign, {
    D,
    R,
    classes,
    talentProfiles,
    talentMaxRanks,
    ceilings,
    expeditionCeilings,
    legacyWeapons,
  });
  const Save = typeof PrototypeSave !== 'undefined' ? PrototypeSave : require('./save.js');
  Save.install(Campaign, {
    D,
    R,
    classes,
    talentProfiles,
    talentMaxRanks,
    expeditionCeilings,
    dungeonIds,
  });
  const Combat = typeof PrototypeCombat !== 'undefined' ? PrototypeCombat : require('./combat.js');
  Combat.install(Campaign, { R });
  const HeroCombat =
    typeof PrototypeHeroCombat !== 'undefined' ? PrototypeHeroCombat : require('./hero-combat.js');
  HeroCombat.install(Campaign, { R });
  const BossCombat =
    typeof PrototypeBossCombat !== 'undefined' ? PrototypeBossCombat : require('./boss-combat.js');
  BossCombat.install(Campaign, { R });
  const CindermawCombat =
    typeof PrototypeCindermawCombat !== 'undefined'
      ? PrototypeCindermawCombat
      : require('./cindermaw-combat.js');
  CindermawCombat.install(Campaign, { D, R });
  const DreadmawCombat =
    typeof PrototypeDreadmawCombat !== 'undefined'
      ? PrototypeDreadmawCombat
      : require('./dreadmaw-combat.js');
  DreadmawCombat.install(Campaign, { R });
  const Party = typeof PrototypeParty !== 'undefined' ? PrototypeParty : require('./party.js');
  Party.install(Campaign, { D, R });
  const PartyPets =
    typeof PrototypePartyPets !== 'undefined' ? PrototypePartyPets : require('./party-pets.js');
  PartyPets.install(Campaign, { D, R });
  const Economy =
    typeof PrototypeEconomy !== 'undefined' ? PrototypeEconomy : require('./economy.js');
  Economy.install(Campaign, { D, R, dungeonIds });
  const Treasury =
    typeof PrototypeTreasury !== 'undefined' ? PrototypeTreasury : require('./treasury.js');
  Treasury.install(Campaign, { D, R });
  const Expeditions =
    typeof PrototypeExpeditions !== 'undefined'
      ? PrototypeExpeditions
      : require('./expeditions.js');
  Expeditions.install(Campaign, { D, R });
  const Rewards =
    typeof PrototypeRewards !== 'undefined' ? PrototypeRewards : require('./rewards.js');
  Rewards.install(Campaign, { D, R, dungeonIds });
  const EnemyVfxEvents =
    typeof PrototypeEnemyVfxEvents !== 'undefined'
      ? PrototypeEnemyVfxEvents
      : require('./enemy-vfx-events.js');
  EnemyVfxEvents.install(Campaign);
  // Register the fourth class as one coherent capability: the live browser
  // shell invokes this before loading saves or offering New Game/Succession.
  // Native fixtures may still opt in deliberately to retain their original
  // three-class baselines; saves never encode a registration switch.
  Campaign.enableRoguePlaytest = () => {
    if (classes.rogue) return false;
    classes.rogue = Object.freeze({
      icon: 'jingle-bell', ...R.rogueHeroFoundation.stats,
    });
    talentProfiles.rogue = Object.freeze({ ...R.rogueHeroFoundation.talents });
    R.movementBasicClasses.rogue = true;
    return true;
  };
  Campaign.rules = R;
  Campaign.data = D;
  Campaign.classes = classes;
  Campaign.talentProfiles = talentProfiles;
  Campaign.talentMaxRanks = talentMaxRanks;
  Campaign.legacyWeapons = legacyWeapons;
  Campaign.dungeonIds = dungeonIds;
  Campaign.mercyStartRadius = mercyStartRadius;
  if (typeof module !== 'undefined') module.exports = Campaign;
  else root.Campaign = Campaign;
})(typeof window !== 'undefined' ? window : globalThis);
