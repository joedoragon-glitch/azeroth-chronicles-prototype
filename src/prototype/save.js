/* Version-4 serialization, validation/repair and version-2 imports. Storage belongs to persistence.js. */
(function (root) {
  'use strict';
  function install(
    Campaign,
    { D, R, classes, talentProfiles, talentMaxRanks, expeditionCeilings, dungeonIds },
  ) {
    const clone = (x) => JSON.parse(JSON.stringify(x)),
      clamp = (n, a, b) => Math.max(a, Math.min(b, n)),
      dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const recoveryCampOrder = (u, s) => {
      if (
        s.recallActive ||
        u.active === false ||
        u.hp <= 0 ||
        !['soldier', 'archer'].includes(u.type) ||
        u.order?.type !== 'build'
      )
        return null;
      const camp = s.zones?.[s.zone]?.buildings?.find(
        (b) =>
          b.id === u.order.id &&
          b.kind === 'barracks' &&
          b.progress < 4 &&
          b.recoveryOnComplete === true,
      );
      return camp ? { type: 'build', id: camp.id } : null;
    };
    const gatheringOrder = (u, s) => {
      if (
        s.recallActive ||
        !(
          ['soldier', 'archer'].includes(u.type) ||
          (u.type === 'pet' && u.petFamily === R.gatheringTravel.petWorkerFamily)
        ) ||
        u.active === false ||
        !['gather', 'deposit'].includes(u.order?.type)
      )
        return null;
      const nodes = s.zones?.[s.zone]?.nodes;
      const node = Array.isArray(nodes) ? nodes.find((n) => n.id === u.order.id) : null;
      if (!node) return null;
      const journey = u.order.journey;
      const validJourney =
        journey &&
        typeof journey.returning === 'boolean' &&
        Array.isArray(journey.points) &&
        journey.points.length > 0 &&
        journey.points.length <= 512 &&
        journey.points.every(
          (p) =>
            p &&
            Number.isFinite(p.x) &&
            Number.isFinite(p.y) &&
            p.x >= 0 &&
            p.y >= 0 &&
            p.x <= 10000 &&
            p.y <= 10000,
        );
      return {
        type: u.order.type,
        id: node.id,
        ...(u.order.cautious === true ? { cautious: true } : {}),
        ...(u.order.scouting === true &&
        s.zone === 'highlands' &&
        node.hidden &&
        node.concealedTribute
          ? { scouting: true }
          : {}),
        ...(node.resourceGroup ? { group: node.resourceGroup } : {}),
        ...(validJourney
          ? {
              journey: {
                returning: journey.returning,
                points: journey.points.map((p) => ({ x: p.x, y: p.y })),
              },
            }
          : {}),
      };
    };
    class Save {
      snapshot() {
        const out = clone(this.s);
        out.recallActive = !!this.s.recallActive;
        out.squadDoctrine = this.squadDefaultDoctrine();
        out.squadEngagement = null;
        out.squadBoss = false;
        out.heroTarget = null;
        // Movement paths and queued skill approaches are live instructions, not
        // saved permission to resume an invisible autopilot after loading.
        if (['skill-approach', 'move'].includes(out.hero.order?.type)) out.hero.order = null;
        delete out.hero.path;
        delete out.holdFire;
        out.projectiles = [];
        out.hazards = [];
        // Temporary combat stances and wards do not survive save/import.
        // Saving during Shield Stance ends it with its normal cooldown.
        if ((out.hero.shieldStance || 0) > 0)
          out.hero.cd[2] = Math.max(out.hero.cd[2], this.skillCooldown(3));
        for (const unit of [out.hero, ...out.party]) {
          delete unit.wardUntil;
          delete unit.wardReduction;
          // Charged Ranger Skill 4 is an in-combat rally, never a saved stat.
          delete unit.rangerRallyUntil;
          delete unit.rangerRallyZone;
          delete unit.rangerRallyMovement;
          delete unit.rangerRallyAttack;
        }
        delete out.hero.shieldStance;
        delete out.hero.shieldRank;
        delete out.hero.silenceField;
        this.clearEncounterUnits([out.hero, ...out.party]);
        out.party.forEach((u) => {
          delete u.path;
          u.order = gatheringOrder(u, out) || recoveryCampOrder(u, out);
        });
        for (const z of Object.values(out.zones)) {
          z.props = z.props.filter((p) => !p.garunTemporary && !p.garunPreview);
          for (const n of z.npcs) {
            if (['cage-thorn', 'cage-cindermaw'].includes(n.id)) {
              delete n.path;
              delete n.routeAge;
              delete n.veraRepairDue;
              delete n.veraRepairUntil;
              delete n.veraRepairTarget;
            }
          }
          z.enemies = z.enemies.filter((e) => !e.summon && !e.arenaFixture);
          for (const e of z.enemies) {
            if (e.family === 'thorn' && e.type === 'boss' && (e.aggro || e.returning))
              e.thornReturn = true;
            if (e.family === 'cindermaw' && e.type === 'boss' && (e.aggro || e.returning))
              e.cinderReturn = true;
            // Copy only the validated board beat: no live attack/motion receipts.
            const board = this.sentinelValidBoard(e, e.board, z.id)
              ? {
                  x: e.board.x,
                  y: e.board.y,
                  size: e.board.size,
                  beat: e.board.beat,
                  phase: e.board.phase,
                  timer: e.board.timer,
                }
              : null;
            this.clearEncounterState(e, [out.hero, ...out.party]);
            if (board && out.phase !== 'peace') e.board = board;
            e.telegraph = null;
            e.motion = null;
            e.sequence = [];
            e.rangedAim = null;
            delete e.supportHeal;
            delete e.supportHealCd;
            e.aggro = false;
            e.frenzy = false;
            delete e.path;
            delete e.idleWanderTarget;
            delete e.idleWanderWait;
            delete e.rogueDustCoverUntil;
            e.returning = 0;
            if (e.hp > 0 && !e.neutral) {
              if (
                !((['thorn', 'cindermaw'].includes(e.family) && e.type === 'boss') || e.veraEscort)
              )
                Object.assign(e, e.home);
              e.hp = e.maxHp;
              e.heroParticipated = false;
              e.mercyProvoked = false;
            }
          }
        }
        return out;
      }
      static validate(data) {
        const s = clone(data);
        if (
          !s ||
          s.version !== 4 ||
          !['normal', 'nightmare', 'developer', 'arena'].includes(s.mode) ||
          !['adventure', 'awakening', 'peace'].includes(s.phase) ||
          !classes[s.hero?.class]
        )
          throw Error('Invalid save');
        if (s.recallActive === undefined) s.recallActive = false;
        if (typeof s.recallActive !== 'boolean') throw Error('Invalid Recall order');
        const validateName = (value) => {
          if (
            value !== undefined &&
            (typeof value !== 'string' ||
              !value ||
              Campaign.normalizeCharacterName(value) !== value)
          )
            throw Error('Invalid character name');
        };
        validateName(s.hero.customName);
        validateName(s.hero.regnalName);
        validateName(s.hero.customWeaponName);
        validateName(s.hero.customArmorName);
        // Legacy v4 saves simply start with no collected Codices. Claimed
        // entries cannot be injected for other dungeons or overwritten by bad
        // types; the original save version remains exactly 4.
        s.criticalCodices ??= {};
        if (!s.criticalCodices || typeof s.criticalCodices !== 'object' ||
            Array.isArray(s.criticalCodices) ||
            Object.entries(s.criticalCodices).some(([id, claimed]) =>
              !Object.hasOwn(R.criticalCodices, id) || claimed !== true))
          throw Error('Invalid critical Codex claims');
        // Independent Party and World streams are optional until opt-in.
        // Saving a game mid-combat stores RNG state, not transient receipts.
        if (s.criticalStreams !== undefined) {
          const state = s.criticalStreams;
          if (!state || typeof state !== 'object' || Array.isArray(state) ||
              Object.keys(state).length !== 2 ||
              !Object.hasOwn(state, 'party') || !Object.hasOwn(state, 'world') ||
              Object.values(state).some((v) =>
                !Number.isInteger(v) || v < 0 || v > 0xffffffff))
            throw Error('Invalid independent critical RNG state');
        }
        if (s.hero.regnalName !== undefined && !s.throneClaimed)
          throw Error('Dark Lord name before claiming the throne');
        if (s.talentBalanceVersion === undefined) {
          const rank = Array.isArray(s.hero?.talents) ? s.hero.talents[2] || 0 : 0,
            p = talentProfiles[s.hero.class],
            delta = rank * (p.hp - 30);
          if (Number.isFinite(s.hero.maxHp) && Number.isFinite(s.hero.hp) && delta) {
            const missing = Math.max(0, s.hero.maxHp - s.hero.hp),
              alive = s.hero.hp > 0;
            s.hero.maxHp = Math.max(1, s.hero.maxHp + delta);
            s.hero.hp = alive ? Math.max(1, s.hero.maxHp - missing) : 0;
          }
          s.talentBalanceVersion = 1;
        }
        if (s.talentBalanceVersion !== 1) throw Error('Invalid talent balance version');
        if (s.hero.freeTalentResets === undefined) s.hero.freeTalentResets = 2;
        if (Array.isArray(s.party))
          for (const u of s.party) if (u.active === undefined) u.active = true;
        if (s.mercyTime === undefined) s.mercyTime = 0;
        if (s.expeditionRank === undefined) {
          let inferred = 1;
          for (const [id, cap] of Object.entries(expeditionCeilings))
            if (s.rescued?.[id]) inferred = Math.max(inferred, cap);
          const active = Array.isArray(s.party)
            ? s.party.filter((u) => u.active !== false).length
            : 0;
          inferred = Math.max(
            inferred,
            active >= 6 ? 6 : active === 5 ? 5 : active === 4 ? 4 : active === 3 ? 2 : 1,
          );
          s.expeditionRank = inferred;
        }
        if (s.expeditionSkills === undefined)
          s.expeditionSkills = { sharedTraining: 0, sharedStrength: 0 };
        if (s.expeditionSupportVersion === undefined) {
          if (s.expeditionSkills.sharedTraining === 4) s.expeditionSkills.sharedTraining = 5;
          s.expeditionSupportVersion = 2;
        }
        if (s.expeditionSupportVersion !== 2) throw Error('Invalid Expedition support version');
        s.recruitmentRequest ??= null;
        if (s.recruitmentRequest !== null) {
          const r = s.recruitmentRequest;
          if (
            !r ||
            typeof r !== 'object' ||
            Array.isArray(r) ||
            !['soldier', 'archer'].includes(r.type) ||
            typeof r.zone !== 'string' ||
            !Object.hasOwn(s.zones || {}, r.zone) ||
            !(
              r.barracksId === null ||
              (typeof r.barracksId === 'string' &&
                r.barracksId.length > 0 &&
                r.barracksId.length <= 160)
            )
          )
            throw Error('Invalid pending recruitment');
        }
        s.companionCareRequests ??= { recovery: null, treatment: null };
        const care = s.companionCareRequests;
        if (
          !care ||
          typeof care !== 'object' ||
          Array.isArray(care) ||
          Object.keys(care).some((kind) => !['recovery', 'treatment'].includes(kind))
        )
          throw Error('Invalid companion care requests');
        for (const kind of ['recovery', 'treatment']) {
          care[kind] ??= null;
          const r = care[kind];
          if (r === null) continue;
          if (
            !r ||
            typeof r !== 'object' ||
            Array.isArray(r) ||
            !Array.isArray(r.companionIds) ||
            !r.companionIds.length ||
            r.companionIds.length > (kind === 'recovery' ? 1 : 200) ||
            new Set(r.companionIds).size !== r.companionIds.length ||
            r.companionIds.some((id) => typeof id !== 'string' || !id.length || id.length > 160) ||
            typeof r.zone !== 'string' ||
            !Object.hasOwn(s.zones || {}, r.zone) ||
            !(
              r.barracksId === null ||
              (typeof r.barracksId === 'string' &&
                r.barracksId.length > 0 &&
                r.barracksId.length <= 160)
            )
          )
            throw Error('Invalid companion care request');
        }
        if (s.companionVitalityRank === undefined) s.companionVitalityRank = 0;
        if (s.companionCombatTraining === undefined)
          s.companionCombatTraining = (s.hero?.skills?.[1] || 0) > 0 ? 2 : 1;
        if (s.rangerSupport === undefined) s.rangerSupport = { heal: 1, mana: 1 };
        if (
          !Number.isInteger(s.companionVitalityRank) ||
          s.companionVitalityRank < 0 ||
          s.companionVitalityRank > 1000000
        )
          throw Error('Invalid Companion Vitality rank');
        if (
          !Number.isInteger(s.companionCombatTraining) ||
          s.companionCombatTraining < 1 ||
          s.companionCombatTraining > 2
        )
          throw Error('Invalid companion combat training');
        if (
          !s.rangerSupport ||
          !Number.isInteger(s.rangerSupport.heal) ||
          !Number.isInteger(s.rangerSupport.mana) ||
          s.rangerSupport.heal < 1 ||
          s.rangerSupport.heal > 2 ||
          s.rangerSupport.mana < 1 ||
          s.rangerSupport.mana > 2
        )
          throw Error('Invalid Ranger support training');
        const finite = (v, min, max) => {
          if (!Number.isFinite(v) || v < min || v > max) throw Error('Invalid save number');
        };
        if (s.treasuryRecovery === undefined) s.treasuryRecovery = {};
        if (
          !s.treasuryRecovery ||
          typeof s.treasuryRecovery !== 'object' ||
          Array.isArray(s.treasuryRecovery)
        )
          throw Error('Invalid Treasury recovery balances');
        for (const [region, account] of Object.entries(s.treasuryRecovery)) {
          if (
            !D.regions.some((r) => r.id === region) ||
            !account ||
            typeof account !== 'object' ||
            Array.isArray(account) ||
            typeof account.unlocked !== 'boolean'
          )
            throw Error('Invalid Treasury recovery account');
          finite(account.crowns, 0, 1e9);
          finite(account.respawnAt, 0, 1e9);
          if (account.cachePoint !== undefined) {
            if (
              !account.cachePoint ||
              typeof account.cachePoint !== 'object' ||
              Array.isArray(account.cachePoint)
            )
              throw Error('Invalid Treasury recovery cache position');
            finite(account.cachePoint.x, 0, 5000);
            finite(account.cachePoint.y, 0, 5000);
          }
        }
        for (const field of [
          'level',
          'gold',
          'xp',
          'hp',
          'maxHp',
          'mp',
          'maxMp',
          'power',
          'armor',
          'speed',
          'x',
          'y',
        ])
          finite(s.hero[field], field === 'level' ? 1 : 0, field === 'level' ? 10000 : 1e9);
        if (
          s.hero.hp > s.hero.maxHp ||
          s.hero.mp > s.hero.maxMp ||
          !Array.isArray(s.hero.skills) ||
          s.hero.skills.length !== 8 ||
          s.hero.skills.some((v) => !Number.isInteger(v) || v < 0 || v > 8) ||
          s.hero.skills[0] < 1
        )
          throw Error('Invalid hero');
        // Older rosters may retain the core-only flag after learning hero Skill 2.
        // Repair the shared unlock without replacing units or resetting their cooldowns.
        if (s.hero.skills[1] > 0) s.companionCombatTraining = 2;
        finite(s.mercyTime, 0, 10);
        if (s.restCooldown !== undefined) finite(s.restCooldown, 0, 90);
        if (s.thornHeroInitiated !== undefined && typeof s.thornHeroInitiated !== 'boolean')
          throw Error('Invalid Thornfang introduction');
        // Old v4 campaigns did not store the first-kill boundary. Preserve
        // their established field behavior; new campaigns save an explicit fact.
        if (s.valeFieldAwakened === undefined)
          s.valeFieldAwakened =
            (s.statistics?.kills || 0) > 0 || s.hero.level >= R.fieldOnboarding.spawnLevel;
        if (typeof s.valeFieldAwakened !== 'boolean') throw Error('Invalid Vale first-kill state');
        for (const id of ['rest', 'minor']) {
          const value = s.discovered?.['vale:refuge-help:' + id];
          if (value !== undefined && typeof value !== 'boolean')
            throw Error('Invalid refuge guidance');
        }
        if (s.manaBalanceVersion !== undefined && s.manaBalanceVersion !== 1)
          throw Error('Invalid mana balance version');
        if (s.squadDoctrine !== undefined && !['focus', 'guard'].includes(s.squadDoctrine))
          throw Error('Invalid squad doctrine');
        if (
          s.squadEngagement !== undefined &&
          s.squadEngagement !== null &&
          !['field', 'boss'].includes(s.squadEngagement)
        )
          throw Error('Invalid squad engagement');
        if (s.squadBoss !== undefined && typeof s.squadBoss !== 'boolean')
          throw Error('Invalid squad boss context');
        if (s.heroTarget !== undefined && s.heroTarget !== null && typeof s.heroTarget !== 'string')
          throw Error('Invalid hero target');
        if (
          !Array.isArray(s.hero.cd) ||
          s.hero.cd.length !== 8 ||
          // Lasting Slow debt can legitimately exceed the base 60s window.
          // Use the same finite numeric ceiling as other persisted actor timers.
          s.hero.cd.some((v) => !Number.isFinite(v) || v < 0 || v > 1e9)
        )
          throw Error('Invalid cooldown');
        // Legacy v4 kept a single last-used-form cooldown. Preserve its remaining
        // charged lock, but never force a promoted normal Tap to wait that long.
        // Capture Skill 1's old timer before converting it into three forms.
        const legacyBasicRemaining = s.hero.cd[0];
        if (s.hero.chargedCd === undefined) {
          s.hero.chargedCd = s.hero.cd.slice();
          const reduction =
            1 -
            (R.resourceMode.manaEnabled
              ? 0
              : Math.min(5, s.hero.talents?.[1] || 0) * R.cooldownBalance.reductionPerTalentRank);
          s.hero.cd = s.hero.cd.map((remaining, i) =>
            Math.min(
              remaining,
              (i === 0 ? R.chargedSkills.first.normalSeconds : R.balance.skills.cooldowns[i + 1]) *
                reduction,
            ),
          );
        }
        if (
          !Array.isArray(s.hero.chargedCd) ||
          s.hero.chargedCd.length !== 8 ||
          s.hero.chargedCd.some((v) => !Number.isFinite(v) || v < 0 || v > 1e9)
        )
          throw Error('Invalid charged cooldowns');
        if (s.hero.basicCd === undefined) s.hero.basicCd = legacyBasicRemaining;
        finite(s.hero.basicCd, 0, 1e9);
        // Strip transient fields from historical or interrupted exports.
        // Existing learned ranks and charged cooldowns remain in v4.
        if (['skill-approach', 'move'].includes(s.hero.order?.type)) s.hero.order = null;
        delete s.hero.path;
        if ((s.hero.shieldStance || 0) > 0)
          s.hero.cd[2] = Math.max(
            s.hero.cd[2],
            R.balance.skills.cooldowns[3] *
              (1 -
                (R.resourceMode.manaEnabled
                  ? 0
                  : Math.min(5, s.hero.talents?.[1] || 0) *
                    R.cooldownBalance.reductionPerTalentRank)),
          );
        delete s.hero.shieldStance;
        delete s.hero.shieldRank;
        delete s.hero.silenceField;
        for (const unit of [s.hero, ...(Array.isArray(s.party) ? s.party : [])]) {
          delete unit.wardUntil;
          delete unit.wardReduction;
          // Charged Ranger Skill 4 is an in-combat rally, never a saved stat.
          delete unit.rangerRallyUntil;
          delete unit.rangerRallyZone;
          delete unit.rangerRallyMovement;
          delete unit.rangerRallyAttack;
        }
        if (!Number.isInteger(s.expeditionRank) || s.expeditionRank < 1 || s.expeditionRank > 6)
          throw Error('Invalid Expedition rank');
        if (
          !s.expeditionSkills ||
          typeof s.expeditionSkills !== 'object' ||
          Array.isArray(s.expeditionSkills) ||
          Object.keys(s.expeditionSkills).some((k) => !R.expeditionSupportSkills[k]) ||
          Object.keys(R.expeditionSupportSkills).some(
            (k) =>
              !Number.isInteger(s.expeditionSkills[k]) ||
              s.expeditionSkills[k] < 0 ||
              s.expeditionSkills[k] > R.expeditionSupportSkills[k].maxRank,
          )
        )
          throw Error('Invalid Expedition support skills');
        if (
          !Array.isArray(s.party) ||
          s.party.length > 200 ||
          s.party.filter((u) => u.active !== false).length >
            Campaign.expeditionPartyCapFor(s.hero.class, s.expeditionRank)
        )
          throw Error('Invalid party');
        const ids = new Set(D.bosses.map((b) => b.id));
        if (s.fieldBossKills !== undefined) {
          if (
            !s.fieldBossKills ||
            typeof s.fieldBossKills !== 'object' ||
            Array.isArray(s.fieldBossKills)
          )
            throw Error('Invalid field boss counters');
          for (const [id, v] of Object.entries(s.fieldBossKills))
            if (
              !ids.has(id) ||
              !(D.bosses.find((b) => b.id === id)?.kind === 'field' || id === 'darklord') ||
              !Number.isInteger(v) ||
              v < 0 ||
              v > 2
            )
              throw Error('Invalid field boss counter');
        }
        for (const field of ['normal', 'true', 'rescued', 'keys', 'late']) {
          if (!s[field] || typeof s[field] !== 'object') throw Error('Missing facts');
          for (const [id, v] of Object.entries(s[field]))
            if (!ids.has(id) || v !== true) throw Error('Invalid boss identity');
        }
        // Some historical v4 exports retain the authoritative facts but omit
        // the detailed victory map. Rebuild only that existing field so later
        // victories remain writable and old rewards are not announced again.
        if (s.victories === undefined)
          s.victories = Object.fromEntries(
            ['normal', 'true'].flatMap((form) =>
              Object.keys(s[form]).map((id) => [id + ':' + form, true]),
            ),
          );
        if (!s.victories || typeof s.victories !== 'object' || Array.isArray(s.victories))
          throw Error('Invalid victory history');
        for (const [key, v] of Object.entries(s.victories))
          if (
            !/^(.*):(normal|true)$/.test(key) ||
            !ids.has(key.split(':')[0]) ||
            v !== true ||
            !s[key.endsWith(':normal') ? 'normal' : 'true'][key.split(':')[0]]
          )
            throw Error('Invalid victory identity');
        for (const id of Object.keys(s.true))
          if (!s.normal[id]) throw Error('TRUE victory without normal victory');
        if (s.appointments === undefined) s.appointments = {};
        if (!s.appointments || typeof s.appointments !== 'object' || Array.isArray(s.appointments))
          throw Error('Invalid dungeon appointments');
        const appointmentChoices = new Set([
          ...D.bosses.filter((b) => b.kind === 'field').map((b) => 'field:' + b.id),
          ...Object.keys(R.roomCaptains).map((id) => 'captain:' + id),
          ...D.bosses.filter((b) => b.captive && s.rescued[b.id]).map((b) => 'specialist:' + b.id),
        ]);
        const appointed = Object.entries(s.appointments);
        if (
          appointed.length > dungeonIds.length ||
          new Set(appointed.map(([, id]) => id)).size !== appointed.length ||
          appointed.some(
            ([id, candidate]) =>
              !dungeonIds.includes(id) ||
              !s.true[id] ||
              !s.throneClaimed ||
              !appointmentChoices.has(candidate),
          )
        )
          throw Error('Invalid dungeon master selection');
        // Legacy v4 peaceful campaigns were already completed. Grandfather
        // them without forcing a new throne visit or replay of defeated bosses.
        if (s.throneClaimed === undefined) s.throneClaimed = s.phase === 'peace';
        if (typeof s.throneClaimed !== 'boolean' || (s.throneClaimed && !s.true.darklord))
          throw Error('Invalid coronation');
        if (s.phase === 'peace' && !s.throneClaimed) throw Error('Missing coronation');
        // Old v4 peaceful saves already displayed their ending before Rest
        // was introduced. Preserve that completed state, never replay credits.
        if (s.finalRestCompleted === undefined) s.finalRestCompleted = s.phase === 'peace';
        if (
          typeof s.finalRestCompleted !== 'boolean' ||
          (s.finalRestCompleted && s.phase !== 'peace')
        )
          throw Error('Invalid final Rest');
        if (s.phase !== 'adventure' && !s.true.darklord) throw Error('Invalid awakening');
        if (s.phase === 'peace' && !dungeonIds.every((id) => s.true[id]))
          throw Error('Invalid peace');
        if (s.phase === 'adventure' && s.true.darklord) throw Error('Missing awakening');
        // Missing fields belong to pre-twilight v4 runs; never grant a new grace
        // period or replay the victory dawn on an established save.
        for (const key of ['nightmareIntroRemaining', 'victoryDawnRemaining']) {
          if (s[key] === undefined) s[key] = 0;
          finite(s[key], 0, R.dayCycle.twilightSeconds);
          if (
            s[key] > 0 &&
            (s.mode !== 'nightmare' ||
              (key === 'nightmareIntroRemaining' ? s.phase === 'peace' : s.phase !== 'peace'))
          )
            throw Error('Invalid twilight state');
        }
        finite(s.clock, 0, 720);
        finite(s.time, 0, 1e12);
        finite(s.nextId, 1, 1e9);
        if (s.mode === 'arena') {
          const stages = new Set([
            'hub',
            ...D.regions.flatMap((r) => [
              r.id + '-ordinary', r.id + '-guardians',
              ...(['march', 'frontier'].includes(r.id) ? [r.id + '-night'] : []),
            ]),
            ...D.bosses.flatMap((b) => ['boss-' + b.id, 'boss-' + b.id + '-true']),
          ]);
          if (s.zone !== 'arena') throw Error('Invalid combat arena world');
          // Content updates can rename or retire encounters. Keep the player's
          // hero, learned skills, talents, companions and arena save intact.
          // Only the obsolete location resets to the safe training hub.
          if (!stages.has(s.arenaStage)) {
            s.arenaStage = 'hub';
            s.arenaRegion = 0;
          }
        }
        const zones = new Set([
          ...(s.mode === 'arena' ? ['arena'] : []),
          ...D.regions.map((r) => r.id),
          ...dungeonIds,
          ...R.supplyRooms.map((r) => r.id),
          ...(R.sideDungeons || []).map((r) => r.id),
        ]);
        if (
          !zones.has(s.zone) ||
          !D.regions.some((r) => r.id === s.refuge) ||
          !s.zones ||
          Object.keys(s.zones).length > 20
        )
          throw Error('Invalid zone');
        for (const [id, z] of Object.entries(s.zones)) {
          if (
            !zones.has(id) ||
            !Array.isArray(z.enemies) ||
            z.enemies.length > 2000 ||
            !Array.isArray(z.npcs) ||
            z.npcs.length > 100
          )
            throw Error('Invalid population');
          if (z.thornArrival !== undefined) {
            const arrival = z.thornArrival;
            if (
              id !== 'vale' ||
              !arrival ||
              arrival.boss?.family !== 'thorn' ||
              arrival.boss.type !== 'boss' ||
              arrival.captive?.id !== 'cage-thorn' ||
              arrival.captive.kind !== 'cage' ||
              arrival.captive.family !== 'thorn' ||
              z.npcs.some((n) => n.id === 'cage-thorn')
            )
              throw Error('Invalid Thornfang arrival');
            finite(arrival.captive.x, 0, 1e9);
            finite(arrival.captive.y, 0, 1e9);
          }
          const seen = new Set();
          for (const e of [...z.enemies, ...(z.thornArrival ? [z.thornArrival.boss] : [])]) {
            if (e.introHeroProvoked !== undefined && typeof e.introHeroProvoked !== 'boolean')
              throw Error('Invalid opening provocation');
            if (
              e.thornIntroRetreat !== undefined &&
              (id !== 'vale' ||
                e.family !== 'thorn' ||
                e.type !== 'boss' ||
                !Number.isInteger(e.thornIntroRetreat) ||
                e.thornIntroRetreat < 0 ||
                e.thornIntroRetreat >= R.thornPatrol.route.length)
            )
              throw Error('Invalid Thornfang retreat');
            delete e.rogueDustCoverUntil;
            delete e.supportHeal;
            delete e.supportHealCd;
            if (seen.has(e.id) || (e.family && !ids.has(e.family))) throw Error('Invalid enemy');
            seen.add(e.id);
            for (const f of ['x', 'y', 'hp', 'maxHp', 'baseHp', 'baseDamage', 'gold', 'xp'])
              finite(e[f], 0, 1e9);
            if (e.hp > e.maxHp || !e.home) throw Error('Invalid enemy health');
            if (
              s.phase === 'peace' &&
              (!e.neutral || e.summon || e.guard || e.family === 'darklord')
            )
              throw Error('Invalid peaceful habitat');
          }
        }
        if (!s.challenge)
          s.challenge = { succession: false, fallen: [], pending: false, gameOver: false };
        const ch = s.challenge;
        const classCount = Object.keys(classes).length;
        if (
          typeof ch.succession !== 'boolean' ||
          typeof ch.pending !== 'boolean' ||
          typeof ch.gameOver !== 'boolean' ||
          !Array.isArray(ch.fallen) ||
          ch.fallen.length > classCount ||
          new Set(ch.fallen).size !== ch.fallen.length ||
          ch.fallen.some((id) => !classes[id])
        )
          throw Error('Invalid succession');
        if (
          (!ch.succession && (ch.fallen.length || ch.pending || ch.gameOver)) ||
          (ch.pending &&
            (!ch.fallen.includes(s.hero.class) || ch.fallen.length !== 1 || s.hero.hp !== 0)) ||
          (ch.gameOver && (ch.fallen.length !== classCount || ch.pending || s.hero.hp !== 0)) ||
          (ch.succession && !ch.pending && !ch.gameOver && ch.fallen.includes(s.hero.class))
        )
          throw Error('Invalid succession state');
        for (const f of ['immune', 'haste', 'potionCd', 'talentPoints', 'weapon', 'armorTier'])
          finite(s.hero[f], 0, f === 'weapon' || f === 'armorTier' ? 4 : 1e9);
        finite(s.hero.freeTalentResets, 0, 2);
        if (!Number.isInteger(s.hero.freeTalentResets))
          throw Error('Invalid free talent reset count');
        if (
          !Array.isArray(s.hero.talents) ||
          s.hero.talents.length !== 4 ||
          s.hero.talents.some((v, i) => !Number.isInteger(v) || v < 0 || v > (i === 3 ? 3 : 5))
        )
          throw Error('Invalid talents');
        for (const [k, v] of Object.entries(s.hero.potions || {})) {
          if (!['health', 'mana', 'greater_health', 'greater_mana'].includes(k))
            throw Error('Invalid legacy potion');
          finite(v, 0, 1e6);
          if (!Number.isInteger(v)) throw Error('Invalid potion count');
        }
        if (s.hero.potionEffect !== undefined) {
          delete s.hero.potionEffect;
        }
        if (s.hero.supportEffects === undefined) s.hero.supportEffects = [];
        if (!Array.isArray(s.hero.supportEffects) || s.hero.supportEffects.length > 20)
          throw Error('Invalid hero recovery effects');
        for (const e of s.hero.supportEffects) {
          if (!e || !['health', 'mana'].includes(e.type))
            throw Error('Invalid hero recovery effect');
          finite(e.remaining, 0, 1000);
          finite(e.seconds, 0, 5);
        }
        const petFamilies = new Set();
        for (const u of s.party) {
          u.order = gatheringOrder(u, s) || recoveryCampOrder(u, s);
          validateName(u.customName);
          if (u.type === 'pet') {
            if (
              !D.bosses.some((b) => b.id === u.petFamily) ||
              !Object.hasOwn(R.petCompanions, u.petFamily) ||
              !s.true[u.petFamily] ||
              petFamilies.has(u.petFamily)
            )
              throw Error('Invalid or duplicate boss pet');
            petFamilies.add(u.petFamily);
            u.name = R.petCompanions[u.petFamily].name;
            u.damage = R.balance.companions.petDamage;
            if (u.petFamily !== R.gatheringTravel.petWorkerFamily) {
              u.order = null;
              u.carry = 0;
            }
          } else if (u.petFamily !== undefined) throw Error('Pet identity on troop');
          if (
            !['worker', 'soldier', 'archer', 'pet'].includes(u.type) ||
            typeof u.id !== 'string' ||
            typeof u.active !== 'boolean'
          )
            throw Error('Invalid companion');
          if (u.survivalRetreat !== undefined && typeof u.survivalRetreat !== 'boolean')
            throw Error('Invalid companion survival retreat');
          // Dev.141's saved recovery lock is obsolete; health and tactical judgment own retreat.
          delete u.survivalRetreat;
          if (u.skill1Cd === undefined) u.skill1Cd = 0;
          if (u.skill2Cd === undefined) u.skill2Cd = 0;
          if (u.skillGlobalCd === undefined) u.skillGlobalCd = 0;
          if (u.healCd === undefined) u.healCd = 0;
          if (u.manaCd === undefined) u.manaCd = 0;
          if (u.survivalCd === undefined) u.survivalCd = 0;
          if (u.immune === undefined) u.immune = 0;
          if (u.supportEffects === undefined) u.supportEffects = [];
          for (const f of [
            'x',
            'y',
            'hp',
            'maxHp',
            'damage',
            'cd',
            'skill1Cd',
            'skill2Cd',
            'skillGlobalCd',
            'healCd',
            'manaCd',
            'survivalCd',
            'immune',
            'carry',
          ])
            finite(u[f], 0, 1e9);
          if (u.hp > u.maxHp || !Array.isArray(u.supportEffects) || u.supportEffects.length > 20)
            throw Error('Invalid companion health');
          for (const e of u.supportEffects) {
            if (!e || e.type !== 'health') throw Error('Invalid companion recovery effect');
            finite(e.remaining, 0, 1000);
            finite(e.seconds, 0, 5);
          }
        }
        for (const [id, v] of Object.entries(s.earlyRoll || {}))
          if (!dungeonIds.includes(id) || typeof v !== 'boolean' || !s.normal[id])
            throw Error('Invalid TRUE roll');
        for (const [id, p] of Object.entries(s.pending || {})) {
          if (
            !p ||
            !['field', 'dungeon', 'mob'].includes(p.kind) ||
            ![1, 2].includes(p.count) ||
            (p.kind === 'dungeon' && !dungeonIds.includes(id)) ||
            (p.kind === 'field' && (!ids.has(id) || p.count !== 1)) ||
            (p.kind !== 'dungeon' && (!zones.has(p.zone) || !p.base || !Number.isFinite(p.delay)))
          )
            throw Error('Invalid pending elite');
        }
        for (const [id, q] of Object.entries(s.quests || {}))
          if (
            !/^(?:quest-(?:[0-9]|[12][0-9])|quest-barracks)$/.test(id) ||
            !q ||
            typeof q.active !== 'boolean' ||
            typeof q.done !== 'boolean' ||
            typeof q.paid !== 'boolean' ||
            (q.paid && !q.done) ||
            !Number.isFinite(q.count) ||
            q.count < 0 ||
            (q.captainBriefed !== undefined && typeof q.captainBriefed !== 'boolean') ||
            (q.recallPracticed !== undefined && typeof q.recallPracticed !== 'boolean') ||
            (q.barracksBriefed !== undefined && typeof q.barracksBriefed !== 'boolean')
          )
            throw Error('Invalid quest');
        for (const [id, z] of Object.entries(s.zones)) {
          if (z.minis !== undefined) {
            if (
              !Array.isArray(z.minis) ||
              z.minis.length < 1 ||
              z.minis.length > 2 ||
              new Set(z.minis.map((m) => m.id)).size !== z.minis.length
            )
              throw Error('Invalid field dungeons');
            for (const m of z.minis) {
              const regionIndex = D.regions.findIndex((r) => r.id === id),
                family = D.bosses.find((b) => b.region === id && b.kind === 'field')?.id;
              if (
                regionIndex < 0 ||
                !['field', 'resource'].includes(m.type) ||
                m.id !== (m.type === 'field' ? 'field-' + family : 'resource-' + id) ||
                typeof m.cleared !== 'boolean' ||
                !Array.isArray(m.trapPosts) ||
                m.trapPosts.length > 2
              )
                throw Error('Invalid field dungeon identity');
              finite(m.x, 0, 5000);
              finite(m.y, 0, 5000);
              for (const t of m.trapPosts) {
                finite(t.x, 0, 5000);
                finite(t.y, 0, 5000);
                finite(t.index, 100, 200);
                if (!['spikes', 'jet', 'seal'].includes(t.kind)) throw Error('Invalid field trap');
              }
            }
          }
          if (!Array.isArray(z.props) || z.props.length > 512) throw Error('Invalid zone assets');
          for (const f of ['nodes', 'buildings'])
            if (!Array.isArray(z[f]) || z[f].length > 300) throw Error('Invalid zone assets');
          if (!z.packTimers || typeof z.packTimers !== 'object') throw Error('Invalid pack timers');
          finite(z.clock, 0, 1e12);
          for (const n of z.nodes) {
            if (n.legacyCapacity !== undefined) finite(n.legacyCapacity, 0, 900);
            finite(
              n.amount,
              0,
              Math.max(
                R.tributeTotal || 640,
                R.legacyResourceTotals?.[id] || 0,
                D.regions[D.regions.findIndex((r) => r.id === id)]?.resource || 0,
                n.legacyCapacity || 0,
              ),
            );
          }
          for (const e of z.enemies) {
            finite(e.home.x, 0, 5000);
            finite(e.home.y, 0, 5000);
            for (const f of ['level', 'damage', 'respawn', 'cd', 'noProgress', 'attackIndex'])
              finite(e[f], 0, 1e9);
            if (
              !['normal', 'true', 'ringleader'].includes(e.form) ||
              !['mob', 'boss'].includes(e.type) ||
              (e.type === 'boss' && !ids.has(e.family))
            )
              throw Error('Invalid enemy role');
          }
        }
        if (
          !s.statistics ||
          !Array.isArray(s.statistics.events) ||
          s.statistics.events.length > 400 ||
          !s.statistics.bossSeconds
        )
          throw Error('Invalid report');
        if (
          !s.hero.reforges ||
          typeof s.hero.reforges !== 'object' ||
          !s.hero.potions ||
          s.hero.maxHp < 1 ||
          s.hero.maxMp < 1 ||
          !Number.isInteger(s.hero.level) ||
          s.hero.xp >= 120 * s.hero.level
        )
          throw Error('Invalid hero progression');
        for (const f of [
          'victories',
          'pending',
          'quests',
          'earlyRoll',
          'paid',
          'tickets',
          'recovery',
          'origins',
          'gathered',
          'discovered',
          'fountains',
        ])
          if (!s[f] || typeof s[f] !== 'object' || Array.isArray(s[f]))
            throw Error('Missing campaign facts');
        if (
          !s.streak ||
          ![0, 1].includes(s.streak.count) ||
          (s.streak.key !== null && typeof s.streak.key !== 'string') ||
          !Array.isArray(s.loot) ||
          s.loot.length > 5000
        )
          throw Error('Invalid reward state');
        for (const l of s.loot) {
          if (!zones.has(l.zone)) throw Error('Invalid loot location');
          for (const f of ['x', 'y', 'gold']) finite(l[f], 0, 1e9);
        }
        for (const p of Object.values(s.pending))
          if (p.kind !== 'dungeon') {
            for (const f of ['level', 'baseHp', 'baseDamage', 'gold', 'xp'])
              finite(p.base[f], 0, 1e9);
            if (!p.base.home) throw Error('Invalid elite home');
            finite(p.base.home.x, 0, 5000);
            finite(p.base.home.y, 0, 5000);
            if (p.nightBonus !== undefined) {
              if (!p.base.nightOnly || !p.nightBonus || typeof p.nightBonus !== 'object')
                throw Error('Invalid night elite');
              for (const f of ['hp', 'damage']) finite(p.nightBonus[f], 0.1, 1000);
            }
          }
        // Stock is optional on old saves. The active-effect flag stays separate.
        if (
          s.hero.tonicStock !== undefined &&
          (!Number.isInteger(s.hero.tonicStock) ||
            s.hero.tonicStock < 0 ||
            s.hero.tonicStock > 10000)
        )
          throw Error('Invalid preparation tonic stock');
        for (const f of ['weapon', 'armorTier', 'talentPoints', 'nextId'])
          if (!Number.isInteger(f === 'nextId' ? s[f] : s.hero[f]))
            throw Error('Invalid integer progression');
        if (
          s.hero.weaponSelection !== undefined &&
          s.hero.weaponSelection !== null &&
          s.hero.weaponSelection !== 'tier' &&
          !Object.prototype.hasOwnProperty.call(Campaign.legacyWeapons, s.hero.weaponSelection)
        )
          throw Error('Invalid weapon selection');
        for (const key of ['keeperPact', 'keeperEvidence'])
          if (s[key] !== undefined && typeof s[key] !== 'boolean')
            throw Error('Invalid Archive knowledge');
        if (s.awakeningAck !== undefined && typeof s.awakeningAck !== 'boolean')
          throw Error('Invalid awakening acknowledgement');
        if (
          s.awakeningLevel !== undefined &&
          (!Number.isInteger(s.awakeningLevel) ||
            s.awakeningLevel < 3 ||
            s.awakeningLevel > 10002 ||
            !s.true.darklord)
        )
          throw Error('Invalid awakening level');
        for (const z of Object.values(s.zones))
          if (z.awakenedGuardWave !== undefined && z.awakenedGuardWave !== s.awakeningLevel)
            throw Error('Invalid guardian return level');
        if (s.hero.slow !== undefined) finite(s.hero.slow, 0, 60);
        // Optional v4 condition detail; older saves simply use ordinary Slow.
        for (const unit of [s.hero, ...s.party])
          if (unit.rogueSlow !== undefined) {
            finite(unit.rogueSlow, 0, 60);
            unit.rogueSlow = Math.min(unit.rogueSlow, unit.slow || 0);
          }
        if (s.refugeSite) {
          if (
            !D.regions.some((r) => r.id === s.refugeSite.zone) ||
            !['rest', 'minor'].includes(s.refugeSite.id)
          )
            throw Error('Invalid refuge');
          finite(s.refugeSite.x, 0, 5000);
          finite(s.refugeSite.y, 0, 5000);
        }
        // Optional v4 preference: old saves continue using the last refuge.
        if (s.barracksRespawn != null) {
          const selected = s.barracksRespawn;
          if (
            !selected ||
            typeof selected !== 'object' ||
            Array.isArray(selected) ||
            s.challenge?.succession ||
            !D.regions.some((r) => r.id === selected.zone) ||
            typeof selected.id !== 'string' ||
            selected.id.length < 1 ||
            selected.id.length > 100
          )
            throw Error('Invalid barracks recovery point');
          // A removed/unfinished barracks is never a dangerous or unusable spawn.
          if (
            !s.zones[selected.zone]?.buildings?.some(
              (b) => b.id === selected.id && b.kind === 'barracks' && b.progress >= 4,
            )
          )
            s.barracksRespawn = null;
        }
        const allIds = new Set();
        for (const u of s.party) {
          if (allIds.has(u.id)) throw Error('Duplicate companion');
          allIds.add(u.id);
        }
        let reservations = s.party.length + (s.recruitmentRequest ? 1 : 0);
        for (const z of Object.values(s.zones)) {
          for (const b of z.buildings) {
            if (b.full === undefined) b.full = true;
            if (b.upgradeProgress === undefined) b.upgradeProgress = b.full ? 4 : 0;
            if (b.upgradePaid === undefined) b.upgradePaid = !!b.full;
            finite(b.x, 0, 5000);
            finite(b.y, 0, 5000);
            finite(b.progress, 0, 4);
            finite(b.queue, 0, 4);
            finite(b.upgradeProgress, 0, 4);
            if (b.recoveryOnComplete !== undefined && typeof b.recoveryOnComplete !== 'boolean')
              throw Error('Invalid pending recovery camp');
            if (
              b.dungeonEntrance !== undefined &&
              (typeof b.dungeonEntrance !== 'string' ||
                !z.npcs.some((n) => n.kind === 'dungeon' && n.family === b.dungeonEntrance))
            )
              throw Error('Invalid dungeon camp entrance');
            if (typeof b.full !== 'boolean' || typeof b.upgradePaid !== 'boolean')
              throw Error('Invalid barracks state');
            if (b.queueType != null && !['soldier', 'archer'].includes(b.queueType))
              throw Error('Invalid recruitment queue type');
            if (b.queue > 0) reservations++;
          }
          for (const n of z.npcs) {
            finite(n.x, 0, 5000);
            finite(n.y, 0, 5000);
          }
          for (const v of Object.values(z.packTimers)) finite(v, 0, 1e9);
        }
        if (reservations > 200) throw Error('Recruitment reservations exceed save capacity');
        if (s.hero.legacyPotions) {
          if (!Array.isArray(s.hero.legacyPotions) || s.hero.legacyPotions.length > 10000)
            throw Error('Invalid legacy supplies');
          for (const p of s.hero.legacyPotions) {
            if (!['health', 'mana'].includes(p.type)) throw Error('Invalid supply type');
            finite(p.value, 1, 1000);
          }
        }
        s.resourceExpeditions ??= [];
        if (
          !Array.isArray(s.resourceExpeditions) ||
          s.resourceExpeditions.length > D.regions.length - 1
        )
          throw Error('Invalid resource expeditions');
        const expeditionRegions = new Set(),
          expeditionWorkers = new Set(),
          expeditionIds = new Set();
        for (const mission of s.resourceExpeditions) {
          const worker = mission && s.party.find((u) => u.id === mission.workerId);
          if (
            !mission ||
            typeof mission.id !== 'string' ||
            !/^resource-expedition-\d+$/.test(mission.id) ||
            !D.regions.some((r) => r.id === mission.region) ||
            !s.zones[mission.region] ||
            !worker ||
            !(
              ['soldier', 'archer'].includes(worker.type) ||
              (worker.type === 'pet' && worker.petFamily === R.gatheringTravel.petWorkerFamily)
            ) ||
            worker.active ||
            worker.order ||
            worker.expeditionId !== mission.id ||
            typeof mission.wasActive !== 'boolean' ||
            expeditionRegions.has(mission.region) ||
            expeditionWorkers.has(mission.workerId) ||
            expeditionIds.has(mission.id)
          )
            throw Error('Invalid resource expedition');
          finite(mission.startedAt, 0, 1e12);
          finite(mission.finishAt, mission.startedAt, 1e12);
          if (mission.finishAt - mission.startedAt > R.dayCycle.seconds)
            throw Error('Invalid resource expedition duration');
          expeditionRegions.add(mission.region);
          expeditionWorkers.add(mission.workerId);
          expeditionIds.add(mission.id);
        }
        for (const u of s.party)
          if (u.expeditionId !== undefined && !expeditionWorkers.has(u.id))
            throw Error('Orphan resource expedition worker');
        s.tributeRemainder ??= 0;
        finite(s.tributeRemainder, 0, 1);
        if (s.tributeRemainder >= 1) throw Error('Invalid tribute remainder');
        const gathering = s.gatheringTarget;
        s.gatheringTarget =
          gathering &&
          gathering.zone === s.zone &&
          typeof gathering.id === 'string' &&
          s.zones[s.zone]?.nodes.some(
            (n) =>
              n.id === gathering.id &&
              n.amount > 0 &&
              (!n.hidden ||
                s.discovered[s.zone + ':tribute:' + n.tributeId] ||
                (s.zone === 'highlands' &&
                  n.concealedTribute &&
                  s.party.some((u) => u.order?.id === n.id && u.order.scouting === true))),
          )
            ? { zone: s.zone, id: gathering.id }
            : null;
        return s;
      }
      static restore(data, random = Math.random) {
        const s = Campaign.validate(data),
          c = new Campaign(s.mode, s.hero.class, random);
        c.s = s;
        c.clearEncounterUnits();
        c.hero.potions = { health: 0, mana: 0, greater_health: 0, greater_mana: 0 };
        delete c.hero.legacyPotions;
        for (const u of c.s.party)
          if (u.type === 'worker') {
            const ratio = u.maxHp ? clamp(u.hp / u.maxHp, 0, 1) : 0;
            u.type = 'soldier';
            u.maxHp = c.companionMaxHp('soldier');
            u.hp = Math.round(u.maxHp * ratio);
            u.damage = 12;
            u.icon = '⚔️';
            u.order = null;
          }
        c.s.squadDoctrine = c.squadDefaultDoctrine();
        c.s.squadEngagement = null;
        c.s.squadBoss = false;
        c.s.heroTarget = null;
        delete c.s.holdFire;
        c.normalizeManaProgression();
        c.s.clock %= 600;
        c.s.fieldBossKills = c.s.fieldBossKills || {};
        if (c.s.rescued.darklord && !c.s.rescued.cindermaw) {
          c.s.rescued.cindermaw = true;
          c.s.normal.cindermaw = true;
          c.s.keys.cindermaw = true;
          c.s.victories['cindermaw:normal'] = true;
          c.s.fieldBossKills.cindermaw = Math.max(1, c.s.fieldBossKills.cindermaw || 0);
          delete c.s.rescued.darklord;
        }
        for (const b of D.bosses.filter((b) => b.kind === 'field' || b.id === 'darklord')) {
          const required = b.id === 'darklord' ? 1 : 2,
            logged = (c.s.statistics?.events || []).filter(
              (ev) => ev.type === 'bossDefeat' && ev.family === b.id && ev.form === 'normal',
            ).length,
            known = c.s.normal[b.id] ? 1 : 0,
            done = c.s.true[b.id] ? required : 0,
            reconstructed = Math.min(
              required,
              Math.max(c.s.fieldBossKills[b.id] || 0, logged, known, done),
            );
          if (reconstructed > 0) c.s.fieldBossKills[b.id] = reconstructed;
          else delete c.s.fieldBossKills[b.id];
          if (reconstructed >= required && !c.s.true[b.id] && !c.s.pending[b.id]) {
            const ri = D.regions.findIndex((r) => r.id === b.region),
              home =
                c.s.zones[b.region]?.enemies.find((e) => e.family === b.id)?.home ||
                c.fieldCenter(ri);
            c.s.pending[b.id] = {
              kind: 'field',
              count: 1,
              zone: b.region,
              base: {
                family: b.id,
                form: 'normal',
                type: 'boss',
                home: { ...home },
                x: home.x,
                y: home.y,
              },
              delay: 5,
            };
            if (c.s.zone === b.region)
              c.notice(
                b.name + ' TRUE encounter restored from your saved boss defeats',
                4,
                '',
                'feedback',
              );
          }
        }
        if (c.s.awakeningAck === undefined) c.s.awakeningAck = c.s.phase !== 'awakening';
        c.repairLegacyRescues();
        if (c.s.phase === 'awakening' && !c.s.awakeningLevel) c.s.awakeningLevel = c.hero.level + 2;
        c.s.projectiles = [];
        c.s.hazards = [];
        c.messages = [];
        c.effects = [];
        if (s.mode === 'arena') {
          // Arena actors are deliberately transient test fixtures; restore the
          // selected stage without touching campaign world migrations.
          // Re-evaluate the stage's region against CURRENT game data on every
          // reload (a release can reorder/expand regions without an arena fork).
          c.s.arenaRegion = c.arenaStages().find((stage) => stage.id === c.s.arenaStage)?.region ?? 0;
          delete c.s.zones.arena;
          c.zone();
          c.syncCompanionLevelStats();
          return c;
        }
        for (const z of Object.values(c.s.zones)) {
          // Expand before old coordinates are filtered against the new floor.
          c.dungeonSpaceLayout(z);
          z.enemies = z.enemies.filter((e) => !e.summon && !e.arenaFixture);
          c.crownSceneComposition(z);
          // Relocate complete Ironroot sites before the new shore/ravine can prune old records.
          c.highlandsLandscape(z);
          // Move authored Marches assets before new water can prune old exterior scenery.
          if (z.id === 'march') {
            c.roadNetwork(z);
            c.marchCoastalLayout(z);
            c.lanternShoreLayout(z);
          }
          z.props = z.props.filter(
            (p) =>
              !p.garunTemporary && !p.garunPreview && !c.blocked(p.x, p.y, z.id, p.r || 0, true),
          );
          c.roadNetwork(z);
          for (const e of z.enemies) {
            if (e.family === 'thorn' && e.type === 'boss' && (e.aggro || e.returning))
              e.thornReturn = true;
            if (e.family === 'cindermaw' && e.type === 'boss' && (e.aggro || e.returning))
              e.cinderReturn = true;
            const board = c.sentinelValidBoard(e, e.board, z.id)
              ? {
                  x: e.board.x,
                  y: e.board.y,
                  size: e.board.size,
                  beat: e.board.beat,
                  phase: e.board.phase,
                  timer: e.board.timer,
                }
              : null;
            c.clearEncounterState(e);
            if (board && s.phase !== 'peace') e.board = board;
            e.aggro = false;
            e.returning = 0;
            // Raw historical restores retain wounds/dead state; snapshot() owns
            // the ordinary resting-enemy serialization contract.
            // Rename the existing boss in historical saves; never change 'crypt'
            // save keys, rewards, quest/rescue flags or normal/TRUE progression.
            if (e.family === 'crypt' && e.type === 'boss')
              e.name = e.form === 'true' ? 'Lifebinder TRUE' : 'Lifebinder';
            if (e.family === 'thorn' && e.type === 'boss') {
              const base = c.boss('thorn').hp * (e.form === 'true' ? 1.8 : 1),
                fraction = e.hp / e.maxHp,
                m = e.maxHp / e.baseHp;
              e.baseHp = base;
              e.maxHp = base * m;
              e.hp = e.maxHp * fraction;
            }
            const authoredResident = !!(e.mini || e.strongholdResident || e.sideDungeon);
            if (c.blocked(e.home.x, e.home.y, z.id, 15, authoredResident))
              e.home = c.safe(e.home.x, e.home.y, z.id);
            if (c.blocked(e.x, e.y, z.id, 15, authoredResident))
              Object.assign(e, c.safe(e.x, e.y, z.id));
          }
          for (const n of [...z.npcs, ...z.nodes, ...z.buildings])
            if (c.blocked(n.x, n.y, z.id)) Object.assign(n, c.safe(n.x, n.y, z.id));
          c.authoredPlaces(z);
          c.ensureCriticalCodex(z);
          c.migrateThornPatrol(z);
          c.migrateCinderInspection(z);
          c.clearVeraRepairs(z);
          c.frontierEdgeRedistribution(z);
          const families = new Set();
          z.enemies = z.enemies.filter((e) => {
            if (
              e.type !== 'boss' ||
              e.hp <= 0 ||
              !(c.boss(e.family).kind === 'field' || e.family === 'darklord')
            )
              return true;
            if (families.has(e.family)) return false;
            families.add(e.family);
            return true;
          });
        }
        c.zone();
        c.refreshNPCs();
        c.syncDungeonMasterStation();
        c.initializeQuests();
        c.checkQuests();
        c.restoreWeaponSelection();
        c.syncCompanionLevelStats();
        for (const u of [c.hero, ...c.s.party])
          if (c.blocked(u.x, u.y)) Object.assign(u, c.safe(u.x, u.y));
        if (c.s.phase === 'awakening') c.activatePending();
        c.syncTreasuryRecovery(c.zone());
        c.advanceResourceExpeditions();
        return c;
      }
      repairLegacyRescues() {
        // Earlier v2 imports granted nine service unlocks without checking campaign progress.
        if (!Array.isArray(this.s.legacyInventory) || this.s.legacyRescueAuditVersion === 1) return;
        for (const id of [
          'thorn',
          'mire',
          'ridge',
          'warlord',
          'citadel',
          'crypt',
          'mine',
          'abyss',
          'cindermaw',
        ])
          if (
            this.s.rescued[id] &&
            !this.s.normal[id] &&
            !this.s.keys[id] &&
            !this.s.statistics.events.some((e) => e.type === 'rescue' && e.family === id)
          )
            delete this.s.rescued[id];
        this.s.legacyRescueAuditVersion = 1;
      }
      static migrate(old, random = Math.random) {
        if (old?.version !== 2 || !old.player || !classes[old.player.heroClass || 'paladin'])
          throw Error('Unknown legacy save');
        const c = new Campaign('normal', old.player.heroClass || 'paladin', random),
          p = old.player,
          h = c.hero;
        c.s.mercyTime = 0;
        for (const [a, b] of [
          ['level', 'level'],
          ['gold', 'gold'],
          ['maxHp', 'maxHp'],
          ['maxMp', 'maxMp'],
          ['hp', 'hp'],
          ['mp', 'mp'],
          ['power', 'spellPower'],
          ['armor', 'armor'],
          ['speed', 'maxSpeed'],
        ])
          if (Number.isFinite(p[b]) && p[b] >= 0) h[a] = p[b];
        h.xp = clamp(p.xp || 0, 0, 120 * h.level - 1);
        h.skills = Array.from({ length: 8 }, (_, i) => clamp(p.spellLevels?.[i + 1] || 1, 1, 8));
        h.talents = (old.talents || [0, 0, 0, 0]).map((v, i) => clamp(v, 0, talentMaxRanks[i]));
        h.talentPoints = p.talentPoints || 0;
        {
          const delta = (h.talents[2] || 0) * (c.talentProfile().hp - 30);
          if (delta) {
            const missing = Math.max(0, h.maxHp - h.hp),
              alive = h.hp > 0;
            h.maxHp = Math.max(1, h.maxHp + delta);
            h.hp = alive ? Math.max(1, h.maxHp - missing) : 0;
          }
        }
        c.s.legacyRescueAuditVersion = 1;
        for (const id of ['crypt', 'mine', 'abyss', 'citadel'])
          if (old.dungeonCleared?.[id] === true) {
            c.victory(id, 'normal');
            c.s.keys[id] = true;
            c.s.paid['clear:' + id] = true;
            c.s.earlyRoll[id] = random() < 1 / 3;
            if (c.s.earlyRoll[id]) c.s.pending[id] = { kind: 'dungeon', count: 1 };
          }
        if (old.bossDefeated === true) {
          c.victory('darklord', 'normal');
          c.s.keys.darklord = true;
        }
        if (old.squad?.units) {
          c.s.party = old.squad.units.slice(0, 100).map((u) => {
            const type = u.type === 'archer' ? 'archer' : 'soldier',
              v = c.unit(type, 300, 400),
              oldMax = Math.max(1, u.maxHp || v.maxHp),
              ratio = clamp((u.hp || 0) / oldMax, 0, 1);
            v.hp = Math.round(v.maxHp * ratio);
            v.carry = u.carry || 0;
            return v;
          });
          const active = Math.min(6, c.s.party.length);
          c.s.expeditionRank =
            active >= 6 ? 6 : active === 5 ? 5 : active === 4 ? 4 : active === 3 ? 2 : 1;
          c.s.party.forEach((u, i) => (u.active = i < active));
        }
        const equipped = old.inventory?.[old.equipped],
          weaponPower =
            {
              'Espada de Cruzado': 10,
              'Bastón de Escarcha': 10,
              'Arco de Exploradora': 10,
              'Martillo del Juicio': 18,
              'Arma de la Frontera': 40,
              'Arma de las Cumbres': 70,
            }[equipped] || 0;
        h.legacyWeaponPower = weaponPower;
        h.legacyWeaponName = equipped || '';
        h.power = Math.max(0, h.power - h.talents[0] * 8 - weaponPower);
        h.speed = Math.max(50, h.speed - h.talents[3] * 40);
        h.potions = { health: 0, mana: 0, greater_health: 0, greater_mana: 0 };
        h.legacyPotions = [];
        const legacyRegion = (region, x = 0) =>
          dungeonIds.includes(region)
            ? region
            : x >= 2800
              ? 'crown'
              : x >= 1800
                ? 'frontier'
                : 'vale';
        for (const b of old.squad?.buildings || []) {
          const region = legacyRegion(b.region, b.wx),
            previous = c.s.zone;
          c.s.zone = region;
          const z = c.zone(),
            i = c.regionIndex(),
            point = c.safe(
              D.towns[i][0] + 200 + (z.buildings.length % 3) * 90,
              D.towns[i][1] + 200,
            );
          z.buildings.push({
            id: 'legacy-barracks-' + c.s.nextId++,
            ...point,
            progress: clamp(b.progress || 0, 0, 4),
            queue: clamp(b.queue || 0, 0, 4),
            queueType: null,
            kind: 'barracks',
            name: 'Barracks',
            theme: region,
            icon: '🏗️',
            full: true,
            upgradeProgress: 4,
            upgradePaid: true,
          });
          c.s.zone = previous;
        }
        if (old.squad) {
          for (const [region, nodeId] of [
            ['vale', 'wood'],
            ['highlands', 'ore'],
            ['crown', 'crystal'],
          ]) {
            c.s.zone = region;
            const zone = c.zone(),
              savedNode = old.squad.nodes?.find((n) => n.id === nodeId);
            zone.nodes[0].legacyCapacity = Math.min(900, Math.max(0, savedNode?.amount || 0));
            zone.nodes[0].amount = zone.nodes[0].legacyCapacity;
          }
          c.s.zone = 'vale';
        }
        const origin = legacyRegion(old.activeRegion, p.wx);
        c.normalizeManaProgression(true);
        c.enter(origin);
        c.s.legacyInventory = clone(old.inventory || []);
        c.autoEquipBestWeapon();
        c.s.legacyQuests = clone(old.quest || {});
        c.refreshNPCs();
        c.say('Legacy progression preserved. New regions and quests await.');
        Campaign.validate(c.snapshot());
        return c;
      }
    }
    for (const name of Object.getOwnPropertyNames(Save.prototype))
      if (name !== 'constructor')
        Object.defineProperty(
          Campaign.prototype,
          name,
          Object.getOwnPropertyDescriptor(Save.prototype, name),
        );
    for (const name of ['validate', 'restore', 'migrate'])
      Object.defineProperty(Campaign, name, Object.getOwnPropertyDescriptor(Save, name));
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeSave = api;
})(typeof window !== 'undefined' ? window : globalThis);
