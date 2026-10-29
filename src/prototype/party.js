/* Companion roster, orders, formations, combat skills and Ranger support. */
(function (root) {
  'use strict';
  function install(Campaign, { D, R }) {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const normalizeCharacterName = (value) => {
      if (typeof value !== 'string') return null;
      const name = value.normalize('NFC').trim().replace(/\s+/gu, ' ');
      return Array.from(name).length >= 1 &&
        Array.from(name).length <= 24 &&
        /^[\p{L}\p{N}][\p{L}\p{M}\p{N} .'’\-]*$/u.test(name)
        ? name
        : null;
    };
    Campaign.normalizeCharacterName = normalizeCharacterName;
    const laborAttacks = new WeakMap(),
      depositTrips = new WeakMap(),
      deliveryAvoidance = new WeakMap();
    const companionJudgments = new WeakMap();
    // Unsaved, per-game retreat-search allowance. Only critical planning is
    // metered: real movement, ordinary collision and combat checks never lie.
    const criticalRetreatFrames = new WeakMap(),
      criticalRetreatRetries = new WeakMap(),
      criticalRetreatExhausted = Object.freeze({});
    const heroGuidance = new WeakMap();
    const rangerHealRequests = new WeakMap();
    // Game-time song boons are transient, bounded, and never saved. Actors
    // are weak keys; a zone or class change automatically invalidates them.
    const roguePerformanceBoons = new WeakMap();
    // A charge fizzle earns the pet's ready first special one brief turn.
    // Kept outside unit/save state; never shared across pets or campaigns.
    const petFirstAfterFailedCharge = new WeakMap();

    // Diagnostic-only, transient and bounded. Never serialize, modify tactics,
    // or examine paths/nearby actors while taking these observations.
    const partyDiagnosticSessions = new WeakMap();
    const partyDiagnosticCooldownKeys = [
      'cd', 'skill1Cd', 'skill2Cd', 'skillGlobalCd', 'healCd', 'manaCd',
      'survivalCd', 'supportCd', 'potionCd',
    ];
    const partyDiagnosticRound = (value) =>
      Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
    function partyDiagnosticBounded(rows, value, limit, session, droppedKey) {
      rows.push(value);
      if (rows.length > limit) {
        rows.shift();
        session[droppedKey]++;
      }
    }
    function partyDiagnosticSession(game) {
      let session = partyDiagnosticSessions.get(game);
      if (!session) {
        session = {
          samples: [], slowApplications: [], emergencyTransitions: [],
          recoveryActions: [], nextSampleAt: -Infinity, simulationTicks: 0,
          emergencyActive: false, droppedSamples: 0, droppedSlowApplications: 0,
          droppedEmergencyTransitions: 0, droppedRecoveryActions: 0,
        };
        partyDiagnosticSessions.set(game, session);
      }
      return session;
    }


    class Party {
      // Stage 2: only six Soldier/Archer combat moves; feature gate is absent in production.
      troopCriticalRelease(u, move) {
        if (!this._criticalPartyNative || u?.charmOrigin || !['soldier', 'archer'].includes(u?.type)) return null;
        return this._criticalPartyNative.release(this, 'troop/' + u.type + '/' + move, u.id);
      }
      troopCriticalDamage(receipt, amount) {
        return receipt?.critical
          ? this._criticalPartyNative.enhance(receipt, amount, 'damage')
          : amount;
      }
      // Apply at casting, never per five-second support tick. The original
      // support cap remains full HP/MP; the authored multiplier tops at 1.45.
      troopCriticalSupportAmount(receipt, amount) {
        return receipt?.critical
          ? this._criticalPartyNative.enhance(receipt, amount, 'healAmount', {
              max: amount * 1.45,
            })
          : amount;
      }

      // Read only the existing unit and judgment state. Active samples include
      // companions and boss pets; the full current roster includes benched units.
      partyDiagnosticUnit(u) {
        const judgment = companionJudgments.get(u),
          cooldowns = {};
        for (const key of partyDiagnosticCooldownKeys)
          if (Number.isFinite(u[key])) cooldowns[key] = partyDiagnosticRound(u[key]);
        return {
          id: u.id,
          name: u.name || null,
          type: u.type,
          kind: u.type === 'pet' ? 'pet' : 'companion',
          petFamily: u.type === 'pet' ? u.petFamily || null : null,
          active: u.active !== false,
          hp: partyDiagnosticRound(u.hp),
          maxHp: partyDiagnosticRound(u.maxHp),
          x: partyDiagnosticRound(u.x),
          y: partyDiagnosticRound(u.y),
          slow: {
            remainingSeconds: partyDiagnosticRound(u.slow || 0),
            stacks: u.slow > 0 ? Math.max(1, Math.floor(u.slowStacks || 1)) : 0,
            rogueSeconds: partyDiagnosticRound(u.rogueSlow || 0),
            movementFactor: partyDiagnosticRound(this.slowMovementFactor(u)),
            cooldownRecoveryFactor: partyDiagnosticRound(
              this.cooldownRecoveryElapsed(u, 0.05) / 0.05,
            ),
          },
          cooldowns,
          tactical: {
            order: u.order?.type || null,
            targetId: this._tacticalPartyTargets?.get(u.id) || null,
            charging: !!this._companionCharges?.has(u.id),
            regrouping: !!judgment?.regrouping,
            critical: u.hp > 0 && u.hp <= u.maxHp * R.companionJudgment.criticalFraction,
            recallActive: !!this.s.recallActive,
            deathRollHeld: !!u.deathRollHeld,
            keeperHeld: !!u.keeperHeld,
          },
        };
      }
      partyDiagnosticsCurrent() {
        const units = (this.s.party || []).map((u) => this.partyDiagnosticUnit(u));
        return {
          gameSeconds: partyDiagnosticRound(this.s.time),
          zone: this.zoneId,
          rosterSize: units.length,
          activeCount: units.filter((u) => u.active).length,
          petCount: units.filter((u) => u.kind === 'pet').length,
          units,
        };
      }
      // Called after completed simulation ticks, never during a paused/menu frame.
      // At most two small party snapshots per game second, retaining one minute.
      partyDiagnosticsObserveTick() {
        const session = partyDiagnosticSession(this);
        session.simulationTicks++;
        if (this.s.time < session.nextSampleAt) return;
        session.nextSampleAt = this.s.time + 0.5;
        const current = this.partyDiagnosticsCurrent();
        partyDiagnosticBounded(
          session.samples,
          {
            gameSeconds: current.gameSeconds,
            zone: current.zone,
            units: current.units.filter((u) => u.active),
          },
          120, session, 'droppedSamples',
        );
      }
      // A successful Slow event records the *actual* post-hit stacks and
      // cooldowns. Attribution is known for Rogue attacks; other sources are
      // explicitly labeled unknown rather than guessing from nearby warnings.
      partyDiagnosticsRecordSlow(u, diagnostic, duration, debt) {
        if (!this.s.party?.includes(u)) return;
        const session = partyDiagnosticSession(this);
        partyDiagnosticBounded(
          session.slowApplications,
          {
            gameSeconds: partyDiagnosticRound(this.s.time),
            zone: this.zoneId,
            targetId: u.id,
            targetKind: u.type === 'pet' ? 'pet' : 'companion',
            kind: diagnostic?.kind || 'other',
            sourceId: diagnostic?.sourceId || null,
            moveName: diagnostic?.moveName || null,
            durationSeconds: partyDiagnosticRound(duration),
            cooldownDebtSeconds: partyDiagnosticRound(debt),
            after: this.partyDiagnosticUnit(u),
          },
          128, session, 'droppedSlowApplications',
        );
      }
      // The emergency loop still runs while combat simulation is suspended.
      // Record only transitions so these markers are inexpensive even on phones.
      partyDiagnosticsObserveEmergency(active, intervalMs, entries) {
        const session = partyDiagnosticSession(this);
        if (!!active === session.emergencyActive) return;
        session.emergencyActive = !!active;
        partyDiagnosticBounded(
          session.emergencyTransitions,
          {
            phase: active ? 'entered' : 'recovered',
            gameSeconds: partyDiagnosticRound(this.s.time),
            zone: this.zoneId,
            callbackIntervalMs: partyDiagnosticRound(intervalMs),
            emergencyEntries: entries,
            party: this.partyDiagnosticsCurrent(),
          },
          16, session, 'droppedEmergencyTransitions',
        );
      }
      partyDiagnosticsRecoveryAction(action) {
        const session = partyDiagnosticSession(this);
        partyDiagnosticBounded(
          session.recoveryActions,
          {
            action,
            gameSeconds: partyDiagnosticRound(this.s.time),
            zone: this.zoneId,
            party: this.partyDiagnosticsCurrent(),
          },
          12, session, 'droppedRecoveryActions',
        );
      }
      partyDiagnosticsReport() {
        const session = partyDiagnosticSessions.get(this);
        return {
          version: 1,
          current: this.partyDiagnosticsCurrent(),
          simulationTicksObserved: session?.simulationTicks || 0,
          sampleIntervalSeconds: 0.5,
          retainedSampleLimit: 120,
          samples: session?.samples.slice() || [],
          slowApplications: session?.slowApplications.slice() || [],
          emergencyTransitions: session?.emergencyTransitions.slice() || [],
          recoveryActions: session?.recoveryActions.slice() || [],
          dropped: {
            samples: session?.droppedSamples || 0,
            slowApplications: session?.droppedSlowApplications || 0,
            emergencyTransitions: session?.droppedEmergencyTransitions || 0,
            recoveryActions: session?.droppedRecoveryActions || 0,
          },
          note: 'Session-local observations only, not saved-game data. History is bounded (up to 60 game seconds at 0.5-second sampling), includes active companions and pets, and only advances on completed gameplay ticks. Emergency markers can be captured while simulation is paused. Slow sources are identified only when the caller supplies them. CompanionAIMs measures the entire party update, not CPU time for individual allies. No per-unit CPU attribution is claimed.',
        };
      }
    // Exceptional recovery is not a death. Preserve health, crowns, quest
    // progress, and Succession rules. Reset only the current live encounter.
    emergencyResetEncounter() {
      if (this.hero.hp <= 0 || this.s.challenge.pending || this.s.challenge.gameOver) return false;
      const z = this.zone(),
        engaged = z.enemies.filter(e => e.hp > 0 && !e.neutral &&
          (e.aggro || e.returning || e.telegraph || e.motion || e.rangedAim));
      if (!engaged.length) return false;
      const owners = new Set(engaged.map(e => e.id)),
        hero = this.hero,
        closest = engaged.reduce((best, e) =>
          !best || Math.hypot(hero.x - e.x, hero.y - e.y) <
            Math.hypot(hero.x - best.x, hero.y - best.y) ? e : best, null),
        dx = hero.x - closest.x,
        dy = hero.y - closest.y,
        distance = Math.hypot(dx, dy) || 1,
        awayX = dx / distance,
        awayY = dy / distance;
      this.clearPartyCharges();
      this.tacticalClearThreat();
      this.tacticalClearBurst();
      this.tacticalClearRogueRegroup();
      this._tacticalScatter?.clear();
      this._tacticalScatterLeash?.clear();
      this._tacticalRepositions?.clear();
      this._tacticalPartyTargets?.clear();
      for (const e of engaged) {
        // Finish the same combat lifecycle as an ordinary completed leash
        // return. Cancel specialist spells/summons first, then use the shared
        // reset for HP, phase flags, frenzy and authored cooldowns.
        const resume = this.patrolResume(e);
        if (e.family === 'mine' && e.type === 'boss')
          z.props = z.props.filter(p => !p.garunTemporary && !p.garunPreview);
        this.cancelEncounter(e);
        if (this.thornPatroller(e)) {
          e.thornLeg = resume?.leg ?? R.thornPatrol.startLeg;
          e.thornPause = resume?.pause ?? R.thornPatrol.pause;
          delete e.thornReturn;
        } else if (this.cinderPatroller(e)) {
          if (resume?.destination) e.cinderDestination = { ...resume.destination };
          else delete e.cinderDestination;
          e.cinderStop = resume?.stop ?? 0;
          e.cinderInspectionPause = resume?.inspectionPause ?? R.cinderInspection.pauseMin;
          delete e.cinderReturn;
        }
        if (e.home) Object.assign(e, e.home);
        e.path = [];
        e.pursuitBurst = 0;
        delete e.rogueDustCoverUntil;
        this.finishDisengage(e);
      }
      z.enemies = z.enemies.filter(e => !e.summon ||
        !(e.aggro || owners.has(e.owner) || owners.has(e.id)));
      this.s.projectiles = [];
      this.s.hazards = [];
      this.s.squadEngagement = null;
      this.s.squadBoss = false;
      this.s.heroTarget = null;
      // Existing Recall logic continues the protected withdrawal after
      // normal simulation safely resumes.
      this.s.recallActive = true;
      this.hero.order = null;
      // Give living companions a physical, terrain-safe withdrawal goal behind
      // the hero, opposite the nearest engaged enemy. Never teleport them.
      const living = this.activeLivingParty();
      const destinations = [];
      for (let i = 0; i < living.length; i++) {
        const u = living[i],
          side = (i - (living.length - 1) / 2) * 38,
          desired = { x: hero.x + awayX * (100 + Math.floor(i / 4) * 40) - awayY * side,
            y: hero.y + awayY * (100 + Math.floor(i / 4) * 40) + awayX * side };
        this.clearCompanionJudgment(u);
        this.clearCompanionTravel(u);
        u.order = null;
        let point;
        try { point = this.safe(desired.x, desired.y); }
        catch (_) { point = { x: u.x, y: u.y }; }
        destinations.push({ unit: u, point });
      }
      this._emergencyWithdraw = destinations;
      this.say('Critical slowdown: the encounter disengages while your company withdraws.');
      return true;
    }
    emergencyAdvanceWithdrawal(dt = 0.05) {
      const list = this._emergencyWithdraw;
      if (!list?.length) return false;
      let pending = false;
      // Bounded work: at most two companions move per callback while the
      // hostile simulation is paused. Terrain and body collision still apply.
      const start = this._emergencyWithdrawCursor || 0;
      for (let n = 0; n < Math.min(2, list.length); n++) {
        const item = list[(start + n) % list.length];
        if (item.unit.hp <= 0 || Math.hypot(item.unit.x - item.point.x,
            item.unit.y - item.point.y) <= 12) continue;
        this.followCompanion(item.unit, item.point, 210, Math.min(dt, 0.05), 12);
      }
      this._emergencyWithdrawCursor = (start + 2) % list.length;
      pending = list.some(item => item.unit.hp > 0 &&
        Math.hypot(item.unit.x - item.point.x, item.unit.y - item.point.y) > 12);
      if (!pending) this._emergencyWithdraw = null;
      return pending;
    }
    // Last resort, including after an unclean browser restart: use established
    // safe-zone entry and configured recovery placement, never die().
    emergencyReturnToSafety() {
      if (this.hero.hp <= 0 || this.s.challenge.pending || this.s.challenge.gameOver) return false;
      const selected = this.selectedBarracksRespawn(),
        region = this.definition().id,
        refuge = this.s.refugeSite?.zone === region ? this.s.refugeSite
          : { zone: region, id: 'rest' };
      if (selected) {
        if (!this.enter(selected.zone,
          { x: selected.barracks.x + 85, y: selected.barracks.y + 50 })) return false;
      } else {
        if (!this.enter(refuge.zone)) return false;
        this.arriveRefuge(refuge);
      }
      this._emergencyWithdraw = null;
      this._emergencyWithdrawCursor = 0;
      this.say('Performance recovery: returned safely without a defeat penalty.');
      return true;
    }
      clearCompanionJudgment(u) {
        companionJudgments.delete(u);
      }
      recallInProgress() {
        return (
          !!this.s.recallActive &&
          this.activeLivingParty().some((u) => dist(u, this.hero) > R.companionRecall.arrivalRadius)
        );
      }
      releaseRecallForCombat() {
        if (!this.recallInProgress()) this.s.recallActive = false;
      }
      companionSurvivalMode(u) {
        if (u === this.hero || u.hp <= 0 || u.active === false || !this.s.party.includes(u))
          return false;
        return u.hp <= u.maxHp * R.companionJudgment.criticalFraction;
      }
      companionRetreatMode(u) {
        if (u === this.hero || u.hp <= 0 || u.active === false || !this.s.party.includes(u))
          return false;
        const state = companionJudgments.get(u),
          critical = this.companionSurvivalMode(u) && state?.critical;
        if (this.s.recallActive && !critical)
          return dist(u, this.hero) > R.companionRecall.arrivalRadius;
        return !!(
          state?.zone === this.zoneId &&
          state.regrouping &&
          state.point &&
          (critical || !u.order || this.gatheringUnit(u))
        );
      }
      companionRetreating(u) {
        if (!this.companionRetreatMode(u)) return false;
        const state = companionJudgments.get(u);
        if (this.companionSurvivalMode(u) && state?.critical && state.point) {
          if (state.guiding)
            return state.guidanceMovedAt === this.s.time && state.guidanceMoved > 0.1;
          return (
            dist(u, state.point) > R.companionJudgment.criticalArrivalRadius ||
            (dist(u, state.point) > 1 &&
              (this.companionAreaDanger(u) > 0 || !this.companionPositionProtected(u)))
          );
        }
        if (this.s.recallActive) return true;
        return dist(u, companionJudgments.get(u).point) > R.companionJudgment.arrivalRadius;
      }
      companionSurvivalThreats() {
        const cfg = R.companionJudgment;
        return this.peace
          ? []
          : this.zone()
              .enemies.filter((e) => e.hp > 0 && !e.neutral && !e.returning)
              .map((e) => ({
                enemy: e,
                x: e.x,
                y: e.y,
                r: Math.max(
                  cfg.nearThreatRadius,
                  this.enemyAcquisitionRange(e) + cfg.criticalEnemyMargin,
                  this.enemyRanged(e) ? this.enemyRangedRange(e) + cfg.criticalEnemyMargin : 0,
                  e.type === 'boss' ? R.bossCadence.specialRange + cfg.criticalEnemyMargin : 0,
                ),
                weight: this.companionEnemyWeight(e),
              }));
      }
      updateCompanionHeroGuidance() {
        const old = heroGuidance.get(this),
          h = this.hero;
        heroGuidance.set(this, {
          hero: h,
          zone: this.zoneId,
          x: h.x,
          y: h.y,
          dx: old && old.hero === h && old.zone === this.zoneId ? h.x - old.x : 0,
          dy: old && old.hero === h && old.zone === this.zoneId ? h.y - old.y : 0,
          moving: !!(
            old &&
            old.hero === h &&
            old.zone === this.zoneId &&
            dist(old, h) > R.companionJudgment.criticalHeroMotionEpsilon
          ),
        });
      }
      companionHeroMoving() {
        const state = heroGuidance.get(this);
        return !!(
          state &&
          state.hero === this.hero &&
          state.zone === this.zoneId &&
          (state.moving || dist(state, this.hero) > R.companionJudgment.criticalHeroMotionEpsilon)
        );
      }
      companionPositionProtected(
        u,
        point = u,
        margin = R.companionJudgment.criticalInstantSafetyMargin,
      ) {
        const cfg = R.companionJudgment;
        const allies = [
          this.hero,
          ...this.activeLivingParty().filter(
            (a) => a !== u && !a.order && !this.companionSurvivalMode(a),
          ),
        ].filter(
          (a) =>
            a.hp > 0 &&
            !a.deathRollHeld &&
            !a.keeperHeld &&
            dist(a, point) <= cfg.supportRadius &&
            this.clearSegment(a, point),
        );
        return !this.zone().enemies.some((e) => {
          if (e.hp <= 0 || e.neutral || e.returning || !this.enemyRangedLine(e, point))
            return false;
          const gap = dist(e, point);
          if (gap < 65 + margin) return true;
          const reach = Math.max(
            this.enemyAcquisitionRange(e),
            this.enemyRanged(e) ? this.enemyRangedRange(e) : 0,
            e.type === 'boss' ? R.bossCadence.specialRange : 0,
            e.captain || e.roomCaptain ? this.captainProfile(e)?.specialRange || 0 : 0,
          );
          return (
            gap <= reach + cfg.criticalEnemyMargin &&
            !allies.some((a) => dist(e, a) + cfg.criticalScreenMargin < gap && this.line(e, a))
          );
        });
      }
      // Read current mechanical states, not the enemy's possible future range.
      // Shared native patch/board/trap geometry remains authoritative.
      companionDangerShapes(horizon = R.companionJudgment.criticalAvoidLookahead) {
        if (this.peace) return [];
        const out = [],
          circle = (p, radius, source = p) => {
            if (Number.isFinite(p?.x) && Number.isFinite(p?.y) && radius > 0)
              out.push({ ...p, shape: 'circle', radius, source });
          },
          line = (from, to, width, source = from) => {
            if (
              Number.isFinite(from?.x) &&
              Number.isFinite(to?.x) &&
              Number.isFinite(from?.y) &&
              Number.isFinite(to?.y)
            )
              out.push({ shape: 'line', from, to, width, source });
          },
          attack = (e, a) => {
            if (!a || a.bossHeal || a.selfDefense || a.kind === 'summon' || a.kind === 'formation')
              return;
            if (a.kind === 'checkerboard') {
              if (a.boardPlan)
                for (const cell of this.sentinelBoardCells({ board: { ...a.boardPlan, beat: 0 } }))
                  if (cell.selected) out.push({ ...cell, shape: 'box', source: e });
            } else if (a.kind === 'line' || a.charge || a.landing || a.kind === 'pattern-charge') {
              if (a.landing && !a.charge) {
                for (const p of this.attackPatches(a)) circle(p, p.radius, e);
              } else {
                const from = { x: a.fromX ?? e.x, y: a.fromY ?? e.y };
                if (a.arenaLines)
                  for (const p of a.arenaLines) line({ x: p.fromX, y: p.fromY }, p, p.halfWidth, e);
                else if (a.path?.length || a.flightPath?.length) {
                  let previous = from;
                  for (const p of a.path || a.flightPath) {
                    line(previous, p, a.radius || R.combatGeometry.lineHalfWidth, e);
                    previous = p;
                  }
                } else if (a.count === 2 && !a.charge && !a.cargo) {
                  for (const n of [-85, 85]) {
                    const dx = Math.cos(a.angle + Math.PI / 2) * n,
                      dy = Math.sin(a.angle + Math.PI / 2) * n;
                    line(
                      { x: from.x + dx, y: from.y + dy },
                      { x: a.x + dx, y: a.y + dy },
                      R.combatGeometry.dualLineHalfWidth,
                      e,
                    );
                  }
                } else line(from, a, a.charge ? a.radius || 55 : R.combatGeometry.lineHalfWidth, e);
              }
            } else if (['cone', 'sector', 'canister', 'volley'].includes(a.kind)) {
              out.push({
                ...a,
                shape: 'cone',
                x: a.kind === 'volley' ? e.x : a.x,
                y: a.kind === 'volley' ? e.y : a.y,
                halfAngle: a.angleDegrees
                  ? (a.angleDegrees * Math.PI) / 360
                  : a.kind === 'sector'
                    ? 0.65
                    : a.kind === 'canister'
                      ? 0.46
                      : a.kind === 'volley'
                        ? 0.22
                        : 1.1,
                radius: a.kind === 'volley' ? R.bossCadence.specialRange : a.radius,
                source: e,
              });
            } else if (a.kind === 'ring' && a.dreadMechanic === 'closure') {
              out.push({
                ...a,
                shape: 'ring',
                inner: a.initialRadius,
                outer: a.initialRadius,
                width: a.width,
                source: a,
              });
            } else if (a.kind === 'ring') circle(a, a.radius, e);
            else if (Number.isFinite(a.x) && Number.isFinite(a.y))
              for (const p of this.attackPatches(a)) circle(p, p.radius || a.radius, e);
          };
        for (const a of this.s.hazards) {
          if (!(a.life > 0)) continue;
          if (a.kind === 'ring') {
            const radius = a.radius || 0;
            out.push({
              ...a,
              shape: 'ring',
              inner: radius,
              outer:
                radius + (a.waveSpeed || R.combatGeometry.ringSpeed) * Math.min(horizon, a.life),
              width: R.combatGeometry.ringHalfWidth,
              source: a,
            });
          } else circle(a, a.radius);
        }
        for (const e of this.zone().enemies) {
          if (e.hp <= 0 || e.neutral || e.returning) continue;
          attack(e, e.telegraph);
          if (
            e.motion &&
            !e.motion.bossHeal &&
            !e.motion.royalSidestepAfterStrike &&
            e.motion.aerial !== 'go-around'
          ) {
            const m = e.motion;
            line(e, m.target || m, m.radius || 55, e);
          }
          if (e.rangedAim) {
            line(e, e.rangedAim, R.balance.enemyProjectileHitRadius || 10, e);
            out.at(-1).enemyAim = e;
          }
          for (const v of e.dreadVapors || [])
            if (v.life > 0)
              v.kind === 'cone'
                ? out.push({
                    ...v,
                    shape: 'cone',
                    halfAngle: (v.angleDegrees * Math.PI) / 360,
                    source: v,
                  })
                : circle(v, v.radius);
          const ring = e.dreadClosure;
          if (ring) {
            const remaining = Math.max(0, ring.duration - ring.age),
              radius = ring.radius;
            out.push({
              ...ring,
              shape: 'ring',
              inner: radius,
              outer:
                radius +
                ((ring.finalRadius - ring.initialRadius) / ring.duration) *
                  Math.min(horizon, remaining),
              source: ring,
            });
            if (remaining <= horizon) circle(ring, ring.finalBlastRadius);
          }
          if (e.cinderCordon) {
            const c = e.cinderCordon,
              p = R.attacks.cindermaw[0],
              remaining = Math.max(0, p.cordonLife - c.elapsed);
            out.push({
              ...c,
              shape: 'ring',
              gaps: [c.gapAngle],
              gapWidth: p.gapWidth,
              width: p.width,
              inner: c.radius,
              outer:
                c.radius +
                ((p.finalRadius - p.initialRadius) / p.cordonLife) * Math.min(horizon, remaining),
              source: c,
            });
            if (!c.switched && c.elapsed + horizon >= p.switchAt)
              out.push({ ...out.at(-1), gaps: [c.nextGap] });
            if (remaining <= horizon)
              out.push({
                ...c,
                shape: 'circle',
                radius: p.finalRadius + p.width,
                gaps: [c.gapAngle],
                gapWidth: p.gapWidth,
                source: c,
              });
          }
          if (e.board?.phase === 'warn')
            for (const cell of this.sentinelBoardCells(e))
              if (cell.selected) out.push({ ...cell, shape: 'box', source: e });
          if (e.ashCloud?.expires > this.s.time) circle(e.ashCloud, 180);
        }
        for (const t of this.traps())
          if (t.phase < t.warningTime + t.activeTime || t.phase + horizon >= t.cycleLength) {
            if (t.kind === 'jet')
              line(
                { x: t.x - t.length / 2, y: t.y },
                { x: t.x + t.length / 2, y: t.y },
                t.halfWidth,
                null,
              );
            else circle(t, t.radius, null);
          }
        for (const p of this.s.projectiles)
          if (p.source === 'enemy' && p.life > 0 && (p.delay || 0) <= horizon) {
            const duration = Math.min(p.life, Math.max(0, horizon - (p.delay || 0)));
            const to = { x: p.x + p.dx * p.speed * duration, y: p.y + p.dy * p.speed * duration };
            line(p, to, 10, p);
            out.at(-1).fort = this.projectileFort(p);
          }
        return out;
      }
      companionAreaDanger(
        u,
        point = u,
        horizon = R.companionJudgment.criticalAvoidLookahead,
        shapes = null,
      ) {
        const padding = R.companionJudgment.criticalAreaMargin;
        let total = 0;
        for (const a of shapes || this.companionDangerShapes(horizon)) {
          if (a.shape === 'ring' && a.hit?.includes(u === this.hero ? 'hero' : u.id)) continue;
          const gap = dist(point, a),
            margin = padding;
          let depth = 0;
          if (a.shape === 'circle') depth = a.radius + margin - gap;
          else if (a.shape === 'line')
            depth = (a.width || 0) + margin - this.distanceToSegment(point, a.from, a.to);
          else if (a.shape === 'box')
            depth =
              a.size / 2 + margin - Math.max(Math.abs(point.x - a.x), Math.abs(point.y - a.y));
          else if (a.shape === 'cone') {
            const angle = Math.abs(
              Math.atan2(
                Math.sin(Math.atan2(point.y - a.y, point.x - a.x) - a.angle),
                Math.cos(Math.atan2(point.y - a.y, point.x - a.x) - a.angle),
              ),
            );
            if (angle <= a.halfAngle + Math.atan2(margin, Math.max(1, gap)))
              depth = a.radius + margin - gap;
          } else if (a.shape === 'ring') {
            const angle = Math.atan2(point.y - a.y, point.x - a.x);
            const inGap = a.gaps?.some(
              (g) =>
                Math.abs(Math.atan2(Math.sin(angle - g), Math.cos(angle - g))) <
                Math.max(0, a.gapWidth / 2 - Math.atan2(margin, Math.max(1, gap))),
            );
            if (!inGap) {
              const low = Math.min(a.inner, a.outer) - (a.width || 0) - margin,
                high = Math.max(a.inner, a.outer) + (a.width || 0) + margin;
              if (gap >= low && gap <= high) depth = Math.min(gap - low, high - gap) + 1;
            }
          }
          if (!(depth > 0)) continue;
          if (
            a.shape !== 'ring' &&
            a.gaps?.some(
              (g) =>
                Math.abs(
                  Math.atan2(
                    Math.sin(Math.atan2(point.y - a.y, point.x - a.x) - g),
                    Math.cos(Math.atan2(point.y - a.y, point.x - a.x) - g),
                  ),
                ) < Math.max(0, a.gapWidth / 2 - Math.atan2(margin, Math.max(1, gap))),
            )
          )
            continue;
          if (
            a.source &&
            !(a.enemyAim
              ? this.enemyRangedLine(a.enemyAim, point)
              : a.fort
                ? this.fortShotClear(a.source, point, a.fort)
                : this.line(a.source, point))
          )
            continue;
          total += 1 + depth / 100;
        }
        return total;
      }
      companionSurvivalScore(u, p, preferred, threats, shapes = null) {
        const cfg = R.companionJudgment;
        shapes ||= this.companionDangerShapes();
        let crossing = threats.reduce(
          (cost, e) =>
            cost + Math.max(0, Math.min(90, dist(u, e)) - this.distanceToSegment(e, u, p)) / 90,
          0,
        );
        if (shapes.length) {
          const initial = this.companionAreaDanger(u, u, cfg.criticalAvoidLookahead, shapes),
            steps = Math.max(1, Math.ceil(dist(u, p) / 24));
          for (let i = 1; i < steps; i++)
            crossing = Math.max(
              crossing,
              this.companionAreaDanger(
                u,
                { x: u.x + ((p.x - u.x) * i) / steps, y: u.y + ((p.y - u.y) * i) / steps },
                cfg.criticalAvoidLookahead,
                shapes,
              ) - initial,
            );
        }
        return (
          (this.companionAreaDanger(u, p, cfg.criticalAvoidLookahead, shapes) + crossing) *
            cfg.criticalDangerCost +
          (this.companionPositionProtected(u, p) ? 0 : cfg.criticalDangerCost / 4) +
          threats.reduce((sum, e) => sum + Math.max(0, 1 - dist(p, e) / 90) * e.weight, 0) *
            cfg.criticalDangerCost +
          dist(p, preferred) * cfg.criticalFormationCost +
          dist(p, u) * cfg.criticalTravelCost
        );
      }
      companionSurvivalRadius() {
        return R.companionJudgment.criticalFollowRadius;
      }
      withCriticalRetreatBudget(u, search, fallback) {
        const cfg = R.companionJudgment,
          now = this.s.time;
        let frame = criticalRetreatFrames.get(this);
        if (!frame || frame.zone !== this.zoneId || frame.time !== now) {
          frame = { zone: this.zoneId, time: now, remaining: cfg.criticalTerrainChecksPerTick };
          criticalRetreatFrames.set(this, frame);
        }
        const retry = criticalRetreatRetries.get(u);
        if (
          retry?.zone === this.zoneId &&
          now >= retry.since &&
          now < retry.until
        )
          return fallback();
        const allowed = Math.min(frame.remaining, cfg.criticalTerrainChecksPerSearch);
        if (allowed <= 0) {
          criticalRetreatRetries.set(u, {
            zone: this.zoneId, since: now, until: now + cfg.criticalTerrainRetrySeconds,
          });
          return fallback();
        }
        let remaining = allowed;
        const hadOwn = Object.hasOwn(this, 'blocked'),
          original = this.blocked;
        // Scope this strict count to one synchronous retreat search. A thrown
        // sentinel stops *nested* clearance and protection tests before they
        // can exceed the allowance; no unchecked path is reported as clear.
        this.blocked = function (...args) {
          if (remaining <= 0 || frame.remaining <= 0) throw criticalRetreatExhausted;
          remaining--;
          frame.remaining--;
          return original.apply(this, args);
        };
        try {
          return search();
        } catch (error) {
          if (error !== criticalRetreatExhausted) throw error;
          criticalRetreatRetries.set(u, {
            zone: this.zoneId, since: now, until: now + cfg.criticalTerrainRetrySeconds,
          });
          return fallback();
        } finally {
          if (hadOwn) this.blocked = original;
          else delete this.blocked;
        }
      }
      companionSurvivalPoint(u, living, threats) {
        const standing = { x: u.x, y: u.y };
        let best = null, bestScore = Infinity;
        return this.withCriticalRetreatBudget(
          u,
          () => {
            const cfg = R.companionJudgment,
              shapes = this.companionDangerShapes(),
              preferred = this.partyFollowPoint(u, living),
              radius = this.companionSurvivalRadius(),
              // Spend the first checks on nearby steps *away* from the
              // closest live threat, not distant formation candidates. This
              // keeps first-tick withdrawal responsive on a small CPU budget.
              nearest = threats
                .filter((e) => Number.isFinite(e.x) && Number.isFinite(e.y))
                .sort((a, b) => dist(a, u) - dist(b, u))[0],
              away = nearest
                ? Math.atan2(u.y - nearest.y, u.x - nearest.x)
                : null,
              candidates = [];
            if (away !== null)
              for (const distance of [cfg.criticalStep, ...cfg.criticalLocalRadii])
                candidates.push({
                  x: u.x + Math.cos(away) * distance,
                  y: u.y + Math.sin(away) * distance,
                });
            candidates.push(preferred, { x: this.hero.x, y: this.hero.y }, standing);
            if (
              dist(u, this.hero) <= cfg.maxAdvanceFromHero &&
              this.companionPositionProtected(u) &&
              !this.companionAreaDanger(u, u, cfg.criticalAvoidLookahead, shapes)
            )
              return standing;
            for (const [origin, radii] of [
              [this.hero, [cfg.criticalPreferredRadius, radius]],
              [u, cfg.criticalLocalRadii],
            ])
              for (const r of radii)
                for (let i = 0; i < cfg.criticalDirections; i++) {
                  const angle = (i * Math.PI * 2) / cfg.criticalDirections;
                  candidates.push({
                    x: origin.x + Math.cos(angle) * r,
                    y: origin.y + Math.sin(angle) * r,
                  });
                }
            for (const point of candidates) {
              if (
                dist(point, this.hero) > radius ||
                this.blocked(point.x, point.y, this.zoneId, this.actorRadius(u)) ||
                !this.clearSegment(u, point, this.actorRadius(u))
              )
                continue;
              // Update only after every geometry check and the score finish.
              // An interrupted candidate must never become an escape target.
              const score = this.companionSurvivalScore(u, point, preferred, threats, shapes);
              if (score < bestScore) {
                best = point;
                bestScore = score;
              }
            }
            return best || standing;
          },
          () => best || standing,
        );
      }
      companionContributionRange(u, slot = 0) {
        if (u.charmOrigin && slot) return 0;
        if (!slot) return this.companionCombatReach(u);
        if (u.type === 'pet') return this.petSkillDefinition(u, slot)?.range || 0;
        if (slot === 2) return R.companionSkills.second[u.type]?.range || 0;
        return u.type === 'archer' ? 185 : u.type === 'soldier' ? 80 : 0;
      }
      companionContributionTargets() {
        const context = this.squadContext();
        if (!context.engaged) return [];
        if (context.boss) {
          if (this.s.squadDoctrine === 'focus') return [context.bossEnemy];
          const adds = this.zone().enemies.filter(
            (e) =>
              e.hp > 0 &&
              !e.neutral &&
              !e.returning &&
              e.type !== 'boss' &&
              this.tacticalDirectTargetable(e) &&
              (context.threats.includes(e) || (e.summon && e.owner === context.bossEnemy.id)),
          );
          return adds.length ? adds : [context.bossEnemy];
        }
        if (this.s.squadDoctrine === 'focus')
          return [
            context.threats.find((e) => e.id === this.s.heroTarget) ||
              context.threats.slice().sort((a, b) => dist(a, this.hero) - dist(b, this.hero))[0],
          ].filter(Boolean);
        return context.threats;
      }
      companionSafeContribution(u, target, slot = 0) {
        const cfg = R.companionJudgment;
        if (
          !this.companionSurvivalMode(u) ||
          !target ||
          target.hp <= 0 ||
          !target.aggro ||
          target.neutral ||
          target.returning ||
          this.peace ||
          u.deathRollHeld ||
          u.keeperHeld ||
          this._tacticalScatter?.has(u.id) ||
          dist(u, this.hero) > cfg.maxAdvanceFromHero ||
          !this.line(u, target) ||
          !this.tacticalDirectTargetable(target) ||
          dist(u, target) > this.companionContributionRange(u, slot)
        )
          return false;
        const allowed = this.companionContributionTargets();
        if (!allowed.includes(target)) return false;
        const victims =
          slot === 2
            ? this.companionSecondSkillTargets(u, target)
            : slot === 1 && u.type === 'pet'
              ? this.petSkillTargets(u, target, 1)
              : [target];
        if (!victims.length || victims.some((e) => !e.aggro || !allowed.includes(e))) return false;
        const margin =
          slot === 2 ? cfg.criticalChargeSafetyMargin : cfg.criticalInstantSafetyMargin;
        return (
          !this.companionHeroMoving() &&
          this.companionPositionProtected(u, u, margin) &&
          !this.companionAreaDanger(
            u,
            u,
            slot === 2 ? R.chargedSkills.holdSeconds : cfg.criticalAvoidLookahead,
          )
        );
      }
      companionCriticalContribution(u) {
        const targets = this.companionContributionTargets()
          .slice()
          .sort((a, b) => dist(u, a) - dist(u, b));
        for (const target of targets) {
          if (!this.mageSilenceActive(u) && (u.skillGlobalCd || 0) <= 0) {
            if ((u.skill1Cd || 0) <= 0 && this.companionSafeContribution(u, target, 1))
              return { target, slot: 1 };
            if (
              (u.skill2Cd || 0) <= 0 &&
              this.companionSecondSkillUnlocked() &&
              this.companionSafeContribution(u, target, 2)
            )
              return { target, slot: 2 };
          }
          if (this.companionSafeContribution(u, target, 0)) return { target, slot: 0 };
        }
        return null;
      }
      followCriticalCompanion(u, living, dt, state) {
        const cfg = R.companionJudgment;
        this._tacticalPartyTargets?.delete(u.id);
        const moving = this.companionHeroMoving();
        // A distant hero is a higher-priority escape anchor than local replan.
        // Keep the native followCompanion collision checks fully authoritative.
        if (moving || dist(u, this.hero) > cfg.maxAdvanceFromHero) {
          this.clearPartyCharge(u);
          state.contributing = false;
          state.evading = false;
          state.guiding = true;
          const distance = dist(u, this.hero),
            guide = heroGuidance.get(this),
            copy = moving && distance <= cfg.maxAdvanceFromHero;
          state.point = copy
            ? { x: u.x + guide.dx, y: u.y + guide.dy }
            : { x: this.hero.x, y: this.hero.y };
          const before = { x: u.x, y: u.y };
          const speed =
            this.companionRallyMoveSpeed(
              u,
              distance > 650 ? 500 : distance > 350 ? 390 : distance > 200 ? 315 : cfg.retreatSpeed,
            ) *
            this.slowMovementFactor(u) *
            this.mireBogMovementFactor(u) *
            this.ashMovementFactor(u);
          this.followCompanion(
            u,
            state.point,
            speed,
            dt,
            copy ? 0 : cfg.criticalHeroFollowStop,
            false,
          );
          state.guidanceMovedAt = this.s.time;
          state.guidanceMoved = dist(before, u);
          if (this.s.recallActive && !moving) {
            const target = this.companionContributionTargets().find((e) =>
              this.companionSafeContribution(u, e, 0),
            );
            if (target && this.companionCoverAttack(u, target, true))
              this._tacticalPartyTargets?.set(u.id, target.id);
          }
          return true;
        }
        // The hero has stopped. Replan immediately if either our current spot
        // or the old destination is threatened by a newly marked attack.
        const exposed = this.companionAreaDanger(u);
        if (state.guiding) {
          state.guiding = false;
          state.point = this.companionSurvivalPoint(u, living, this.companionSurvivalThreats());
          this.clearCompanionTravel(u);
        }
        if (
          (!state.evading && exposed) ||
          !state.point ||
          this.companionAreaDanger(u, state.point)
        ) {
          state.point = this.companionSurvivalPoint(u, living, this.companionSurvivalThreats());
          state.contributing = false;
          state.evading = !!exposed;
        }
        if (!exposed) state.evading = false;
        const pending = this._companionCharges?.get(u.id),
          prepared = pending && this.zone().enemies.find((e) => e.id === pending.targetId),
          observation = this.partyChargeState(u);
        if (
          pending &&
          !this.s.recallActive &&
          observation &&
          !observation.interrupted &&
          !this.mageSilenceActive(u) &&
          this.companionSafeContribution(u, prepared, 2)
        ) {
          state.contributing = true;
          state.point = { x: u.x, y: u.y };
          this.clearCompanionTravel(u);
          return true;
        }
        this.clearPartyCharge(u);
        const contribution = !this.s.recallActive && this.companionCriticalContribution(u);
        if (contribution) {
          state.contributing = true;
          state.point = { x: u.x, y: u.y };
          this.clearCompanionTravel(u);
          const fired = contribution.slot
            ? this.companionTrySkill(u, contribution.target)
            : this.companionCoverAttack(u, contribution.target);
          if (fired) this._tacticalPartyTargets?.set(u.id, contribution.target.id);
          return true;
        }
        if (state.contributing) {
          state.contributing = false;
          state.point = this.companionSurvivalPoint(u, living, this.companionSurvivalThreats());
          this.clearCompanionTravel(u);
        }
        const distance = dist(u, this.hero),
          speed =
            this.companionRallyMoveSpeed(
              u,
              distance > 650 ? 500 : distance > 350 ? 390 : distance > 200 ? 315 : cfg.retreatSpeed,
            ) *
            this.slowMovementFactor(u) *
            this.mireBogMovementFactor(u) *
            this.ashMovementFactor(u),
          before = { x: u.x, y: u.y };
        const stop =
          this.companionAreaDanger(u) || !this.companionPositionProtected(u)
            ? 0
            : cfg.criticalArrivalRadius;
        this.followCompanion(u, state.point, speed, dt, stop, false);
        if (dist(before, u) < 0.1 && dist(u, state.point) > cfg.criticalArrivalRadius) {
          // If a distant anchor has no safe route, make a bounded local escape
          // without ever relaxing hostile or terrain collision.
          let best = null;
          const escape = this.withCriticalRetreatBudget(
            u,
            () => {
              const danger = this.companionSurvivalThreats(),
                preferred = this.partyFollowPoint(u, living),
                standingScore = this.companionSurvivalScore(u, u, preferred, danger);
              let bestScore = standingScore;
              for (let i = 0; i < cfg.criticalDirections; i++) {
                const angle = (i * Math.PI * 2) / cfg.criticalDirections,
                  p = {
                    x: u.x + Math.cos(angle) * cfg.criticalStep,
                    y: u.y + Math.sin(angle) * cfg.criticalStep,
                  };
                if (
                  dist(p, this.hero) <=
                    Math.max(this.companionSurvivalRadius(danger), dist(u, this.hero)) + 1 &&
                  this.clearSegment(u, p, this.actorRadius(u))
                ) {
                  const score = this.companionSurvivalScore(u, p, preferred, danger);
                  if (score < bestScore) {
                    best = p;
                    bestScore = score;
                  }
                }
              }
              return best;
            },
            () => best,
          );
          // Movement is *outside* the planning budget and still checks real
          // collision. No result means stay put, not permission to phase.
          if (escape) this.move(u, escape, speed, dt);
        }
        if (this.s.recallActive) {
          const counter = this.companionContributionTargets().find((e) =>
            this.companionSafeContribution(u, e, 0),
          );
          if (counter && this.companionCoverAttack(u, counter, true))
            this._tacticalPartyTargets?.set(u.id, counter.id);
        }
        return true;
      }
      followRecalledCompanion(u, living, dt) {
        const index = Math.max(0, living.indexOf(u)),
          count = Math.min(6, living.length),
          row = Math.floor(index / 6),
          angle = ((index % 6) * Math.PI * 2) / count + (row ? Math.PI / 6 : 0),
          radius = R.companionRecall.formationRadius + row * 24,
          desired = {
            x: this.hero.x + Math.cos(angle) * radius,
            y: this.hero.y + Math.sin(angle) * radius,
          };
        let point = this.safe(desired.x, desired.y);
        if (dist(point, this.hero) > R.companionRecall.arrivalRadius - 10) point = this.hero;
        const d = dist(u, this.hero),
          speed =
            this.companionRallyMoveSpeed(u, d > 650 ? 500 : d > 350 ? 390 : d > 200 ? 315 : 255) *
            this.slowMovementFactor(u) *
            this.mireBogMovementFactor(u) *
            this.ashMovementFactor(u);
        return this.follow(u, point, speed, dt, point === this.hero ? 35 : 15);
      }
      companionCombatReach(u) {
        const monster = this.charmedCompanionProfile(u);
        if (monster) return monster.reach;
        return u.type === 'pet'
          ? this.petDefinition(u)?.role === 'ranged'
            ? R.balance.companions.petBasicRange
            : R.balance.companions.petMeleeBasicRange
          : u.type === 'archer'
            // The Archer's ordinary 280-unit shot is also its defensive and
            // Recall basic reach; separate first skills keep their own 185.
            ? 280
            : R.balance.companions.soldierMeleeBasicRange;
      }
      companionEnemyWeight(e) {
        const cfg = R.companionJudgment;
        return e.type === 'boss'
          ? cfg.bossWeight
          : e.captain || e.roomCaptain || e.fieldCaptain
            ? cfg.captainWeight
            : e.form === 'ringleader'
              ? cfg.ringleaderWeight
              : 1;
      }
      companionCoverAttack(u, e, basicOnly = false) {
        if (this.companionSurvivalMode(u) && !this.companionSafeContribution(u, e, 0)) return false;
        if (!basicOnly && this.companionCoveringShot(u, e)) return true;
        if (
          !e ||
          e.hp <= 0 ||
          e.neutral ||
          e.returning ||
          u.cd > 0 ||
          dist(u, e) > this.companionCombatReach(u) ||
          !this.line(u, e) ||
          !this.tacticalDirectTargetable(e)
        )
          return false;
        if (u.type === 'pet') return this.petDefensiveCounter(u, e);
        u.cd = this.companionBasicInterval(u) / this.companionRallyAttackSpeed(u);
        const criticalReceipt = this.troopCriticalRelease(u, 'basic');
        if (u.type === 'archer') {
          const d = Math.max(1, dist(u, e));
          this.s.projectiles.push({
            id: 'projectile-' + this.s.nextId++,
            x: u.x,
            y: u.y,
            dx: (e.x - u.x) / d,
            dy: (e.y - u.y) / d,
            target: e.id,
            damage: this.troopCriticalDamage(criticalReceipt, this.companionBasicAttackDamage(u)),
            source: u.id,
            ...(criticalReceipt ? { criticalExecution: criticalReceipt } : {}),
            speed: this.charmedCompanionProfile(u)?.shotSpeed || 450,
            style: this.charmedCompanionProfile(u)?.style || 'arrow',
          });
          return true;
        }
        const hit = this.damage(
          e, this.troopCriticalDamage(criticalReceipt, this.companionBasicAttackDamage(u)), u.id,
        );
        if (hit)
          this.event('melee', {
            actor: 'companion',
            role: 'soldier',
            source: u.id,
            weapon: u.charmOrigin ? 'claw' : 'sword',
            x: e.x,
            y: e.y,
            target: e.id,
          });
        return hit;
      }
      companionSafetyAssessment(u, target, living) {
        const cfg = R.companionJudgment,
          enemies = this.zone().enemies.filter((e) => e.hp > 0 && !e.neutral && !e.returning),
          weight = (a) =>
            cfg.minimumAllyWeight +
            (1 - cfg.minimumAllyWeight) * Math.max(0, Math.min(1, a.hp / a.maxHp)),
          allies = living.filter(
            (a) =>
              !this.companionSurvivalMode(a) &&
              (!a.order || (this.gatheringUnit(u) && this.gatheringUnit(a))) &&
              dist(a, u) <= cfg.supportRadius &&
              this.clearSegment(a, u),
          ),
          heroNearby =
            this.hero.hp > 0 &&
            dist(this.hero, u) <= cfg.supportRadius &&
            this.clearSegment(this.hero, u),
          support =
            allies.reduce((sum, a) => sum + weight(a), 0) +
            (heroNearby ? cfg.heroWeight * weight(this.hero) : 0),
          danger = enemies
            .filter(
              (e) => dist(e, target) <= cfg.threatRadius || dist(e, u) <= cfg.nearThreatRadius,
            )
            .reduce((sum, e) => sum + this.companionEnemyWeight(e), 0),
          nearby = enemies
            .filter((e) => dist(e, u) <= cfg.nearThreatRadius)
            .reduce((sum, e) => sum + this.companionEnemyWeight(e), 0),
          wounded =
            (this.companionSurvivalMode(u) &&
              (target?.aggro || nearby >= 1 || this.companionAreaDanger(u) > 0)) ||
            (u.hp / u.maxHp <= cfg.woundedFraction && nearby >= cfg.woundedThreatForce),
          ranged =
            u.type === 'archer' || (u.type === 'pet' && this.petDefinition(u)?.role === 'ranged'),
          unsupported =
            this.companionSupportDistance(u, u) > cfg.maxAdvanceFromHero ||
            this.companionPursuitDetour(u) ||
            (dist(target, this.hero) - (ranged ? this.companionCombatReach(u) : 55) >
              cfg.maxAdvanceFromHero &&
              dist(u, target) > this.companionCombatReach(u)),
          overwhelmed = danger >= cfg.minimumEnemyForce && danger > support * cfg.overwhelmRatio,
          heroCommitted =
            dist(this.hero, target) <= cfg.heroCommittedRange &&
            heroNearby &&
            this.line(this.hero, target);
        return {
          unsafe: unsupported || wounded || (overwhelmed && !heroCommitted),
          safe: !unsupported && !wounded && (danger <= support * cfg.safeRatio || heroCommitted),
          enemies,
          danger,
          support,
        };
      }
      companionRegroupPoint(u, living, enemies) {
        const cfg = R.companionJudgment,
          points = [this.partyFollowPoint(u, living)];
        for (const ally of living) {
          if (
            ally === u ||
            ally.order ||
            ally.hp / ally.maxHp < cfg.woundedFraction ||
            dist(ally, this.hero) > cfg.supportRadius
          )
            continue;
          const d = Math.max(1, dist(u, ally));
          const point = this.safe(
            ally.x + ((u.x - ally.x) / d) * 65,
            ally.y + ((u.y - ally.y) / d) * 65,
          );
          points.push(point);
        }
        const score = (p) =>
          enemies
            .filter((e) => dist(e, p) < cfg.nearThreatRadius)
            .reduce((sum, e) => sum + this.companionEnemyWeight(e), 0) *
            cfg.anchorDangerCost +
          dist(p, this.hero) * 0.25 +
          dist(p, u) * 0.1;
        return points.sort((a, b) => score(a) - score(b))[0];
      }
      companionCautiousCombat(u, target, living, dt) {
        const cfg = R.companionJudgment,
          critical = this.companionSurvivalMode(u);
        let state = companionJudgments.get(u);
        if (!state || state.zone !== this.zoneId) {
          state = { zone: this.zoneId, next: 0, regrouping: false, safeSince: null };
          companionJudgments.set(u, state);
        }
        // Arrival completes the rejected pursuit. Do not let its stale route
        // flag prevent a fresh safety assessment forever at the regroup point.
        if (state.regrouping && state.point && dist(u, state.point) <= cfg.arrivalRadius)
          this.clearCompanionTravel(u);
        if (
          this.s.time >= state.next ||
          state.target !== target.id ||
          state.critical !== critical ||
          (critical && state.hero && dist(state.hero, this.hero) > 50) ||
          (!state.regrouping && this.companionPursuitDetour(u))
        ) {
          const wasCritical = state.critical,
            assessment = this.companionSafetyAssessment(u, target, living);
          state.critical = critical;
          state.hero = { x: this.hero.x, y: this.hero.y };
          state.next = this.s.time + cfg.assessSeconds;
          state.target = target.id;
          state.enemies = assessment.enemies;
          if (assessment.unsafe) {
            state.regrouping = true;
            state.safeSince = null;
          } else if (state.regrouping) {
            if (assessment.safe) {
              state.safeSince ??= this.s.time;
              if (this.s.time - state.safeSince >= cfg.regroupSeconds) state.regrouping = false;
            } else state.safeSince = null;
          }
          state.point = state.regrouping
            ? critical
              ? this.companionSurvivalPoint(u, living, this.companionSurvivalThreats())
              : this.companionRegroupPoint(u, living, assessment.enemies)
            : null;
          if (critical && !wasCritical && state.regrouping)
            this.notice(
              'Critically wounded companions are keeping their distance.',
              2.8,
              'Safe attacks and skills remain available; retreat comes first.',
              'feedback',
            );
        }
        if (!state.regrouping) return false;
        if (critical) return this.followCriticalCompanion(u, living, dt, state);
        // Defensive Triple Shot is an existing veteran technique. Take the
        // shot before moving out of its close range, then keep withdrawing.
        const pursuer = (state.enemies || [])
          .filter(
            (e) =>
              e.hp > 0 &&
              e.aggro &&
              !e.returning &&
              dist(u, e) < R.companionSkills.veteran.coveringRange,
          )
          .sort((a, b) => dist(u, a) - dist(u, b))[0];
        this.companionCoveringShot(u, pursuer);
        const point = state.point || this.partyFollowPoint(u, living),
          before = { x: u.x, y: u.y };
        if (dist(u, point) > cfg.arrivalRadius) {
          this.followCompanion(
            u,
            point,
            this.companionRallyMoveSpeed(u, cfg.retreatSpeed) *
              this.slowMovementFactor(u) *
              this.mireBogMovementFactor(u) *
              this.ashMovementFactor(u),
            dt,
            cfg.arrivalRadius,
            !(state.escapeUntil > this.s.time),
          );
          state.stalled = dist(before, u) < 0.1 ? (state.stalled || 0) + dt : 0;
          // Escape an enclosing crowd toward support if no fully clear route
          // exists. Physical collision remains authoritative; never teleport.
          if (state.stalled >= cfg.escapeDelay) {
            state.escapeUntil = this.s.time + cfg.escapeSeconds;
            state.stalled = 0;
          }
        }
        const attacker = (state.enemies || [])
          .filter(
            (e) =>
              e.hp > 0 &&
              e.aggro &&
              !e.returning &&
              (target.type === 'boss' || e.type !== 'boss') &&
              dist(u, e) <= this.companionCombatReach(u),
          )
          .sort((a, b) => dist(a, u) - dist(b, u))[0];
        if (this.companionCoverAttack(u, attacker))
          this._tacticalPartyTargets.set(u.id, attacker.id);
        return true;
      }
      clearGatheringIntent(u) {
        laborAttacks.delete(u);
        depositTrips.delete(u);
        deliveryAvoidance.delete(u);
        this.clearCompanionTravel(u);
      }
      noteGatheringAttack(u, e) {
        if (this.gatheringUnit(u) && e?.hp > 0)
          laborAttacks.set(u, {
            zone: this.zoneId,
            id: e.id,
            until: this.s.time + R.gatheringTravel.defenseSeconds,
          });
      }
      gatheringCounterattack(u) {
        const receipt = laborAttacks.get(u);
        if (
          !receipt ||
          receipt.zone !== this.zoneId ||
          receipt.until <= this.s.time ||
          this.peace ||
          u.cd > 0
        )
          return;
        const e = this.zone().enemies.find(
            (e) => e.id === receipt.id && e.hp > 0 && !e.neutral && !e.returning,
          ),
          reach = this.companionCombatReach(u);
        if (!e || dist(e, u) > reach || !this.line(u, e) || !this.tacticalDirectTargetable(e))
          return;
        u.cd = this.companionBasicInterval(u) / this.companionRallyAttackSpeed(u);
        const criticalReceipt = this.troopCriticalRelease(u, 'basic');
        if (u.type === 'archer') {
          const d = Math.max(1, dist(u, e));
          this.s.projectiles.push({
            id: 'projectile-' + this.s.nextId++,
            x: u.x,
            y: u.y,
            dx: (e.x - u.x) / d,
            dy: (e.y - u.y) / d,
            target: e.id,
            damage: this.troopCriticalDamage(criticalReceipt, this.companionBasicAttackDamage(u)),
            source: u.id,
            ...(criticalReceipt ? { criticalExecution: criticalReceipt } : {}),
            speed: this.charmedCompanionProfile(u)?.shotSpeed || 450,
            style: this.charmedCompanionProfile(u)?.style || 'arrow',
          });
        } else if (this.damage(e, this.troopCriticalDamage(
          criticalReceipt, this.companionBasicAttackDamage(u),
        ), u.id))
          this.event('melee', {
            actor: 'companion',
            role: 'soldier',
            source: u.id,
            weapon: u.charmOrigin ? 'claw' : 'sword',
            x: e.x,
            y: e.y,
            target: e.id,
          });
      }
      gatheringRouteLength(u, target, cautious = false) {
        const path = this.companionRoute(u, target, cautious);
        if (!path.length) return Infinity;
        let length = 0,
          from = u;
        for (const p of path) {
          length += dist(from, p);
          from = p;
        }
        return length;
      }
      heroDisplayName() {
        return (
          (this.s.throneClaimed && this.hero.regnalName) || this.hero.customName || this.hero.class
        );
      }
      nameHero(value, regnal = false) {
        const name = normalizeCharacterName(value),
          key = regnal ? 'regnalName' : 'customName';
        if (!name || this.hero[key] || (regnal && !this.s.throneClaimed)) return false;
        this.hero[key] = name;
        return true;
      }
      nextRogueCharmNickname() {
        const locale = this.rogueNicknameLanguage === 'es' ? 'es' : 'en',
          pool = R.rogueCharmNicknames[locale],
          cursor = this.s.rogueNicknameCursor ??= { en: 0, es: 0 },
          original = cursor[locale] || 0,
          used = new Set(this.s.party.map((u) => u.customName)
            .filter(Boolean).map((name) => name.toLocaleLowerCase()));
        for (let offset = 0; offset < pool.length; offset++) {
          const index = (original + offset) % pool.length,
            name = pool[index];
          if (used.has(name.toLocaleLowerCase())) continue;
          cursor[locale] = (index + 1) % pool.length;
          return name;
        }
        // Extremely large inherited rosters can occupy all 70 suggestions.
        // Stay within the existing 24-character, one-time naming contract.
        const base = pool[original],
          limit = 24;
        for (let suffix = 2; suffix <= 200; suffix++) {
          const end = ' ' + suffix,
            name = Array.from(base).slice(0, limit - end.length).join('') + end;
          if (used.has(name.toLocaleLowerCase())) continue;
          cursor[locale] = (original + 1) % pool.length;
          return name;
        }
        throw Error('Charmed nickname pool exhausted');
      }
      nameCompanion(id, value) {
        const unit = this.s.party.find((u) => u.id === id),
          name = normalizeCharacterName(value);
        if (!unit || !name || unit.customName) return false;
        unit.customName = name;
        return true;
      }
      companionDisplayName(unit) {
        if (unit.customName) return unit.customName;
        if (unit.charmOrigin) return unit.charmOrigin.typeName;
        if (!['soldier', 'archer', 'pet'].includes(unit.type))
          return unit.name || unit.type || 'Companion';
        return unit.type === 'pet'
          ? this.petDefinition(unit)?.name || 'Boss pet'
          : unit.type === 'archer'
            ? 'Ranger'
            : 'Soldier';
      }
      rangerRallyActive(u) {
        return (
          !!u &&
          u.hp > 0 &&
          u.active !== false &&
          u.rangerRallyZone === this.zoneId &&
          (u.rangerRallyUntil || 0) > this.s.time
        );
      }
      rogueSongBoon(u, family) {
        if (
          this.hero.class !== 'rogue' ||
          !u || u.hp <= 0 ||
          (u !== this.hero && (u.active === false || !this.s.party.includes(u)))
        ) return null;
        const saved = roguePerformanceBoons.get(u);
        const entry = saved?.zone === this.zoneId ? saved[family] : null;
        return entry && entry.until > this.s.time ? entry : null;
      }
      applyRogueSongBoon(u, family, form) {
        if (!['refrain', 'quickstep', 'borrowedTime', 'steadyBeat', 'firmFooting', 'mending', 'finale'].includes(family) ||
          this.hero.class !== 'rogue' ||
          !(u === this.hero ? u.hp > 0 : this.activeLivingParty().includes(u)))
          return false;
        let state = roguePerformanceBoons.get(u);
        if (!state || state.zone !== this.zoneId) {
          state = { zone: this.zoneId };
          roguePerformanceBoons.set(u, state);
        }
        const previous = state[family]?.until > this.s.time ? state[family] : null;
        const until = this.s.time + Math.min(8, Math.max(0, form.seconds || 0));
        // One strongest instance per family, never additive or permanent.
        state[family] = {
          until: Math.max(previous?.until || 0, until),
          basicDamage: Math.max(previous?.basicDamage || 0, Math.min(0.07, form.basicDamage || 0)),
          move: Math.max(previous?.move || 0, Math.min(0.12, form.move || 0)),
          recovery: Math.max(previous?.recovery || 0, Math.min(0.08, form.recovery || 0)),
          specialRecovery: Math.max(previous?.specialRecovery || 0,
            Math.min(0.18, form.specialRecovery || 0)),
          outgoing: Math.max(previous?.outgoing || 0,
            Math.min(0.08, form.outgoing || 0)),
          protection: !!(previous?.protection || form.protection),
          incomingHealing: Math.max(previous?.incomingHealing || 0,
            Math.min(0.12, form.incomingHealing || 0)),
          // Only a frozen critical Skill 4 release may increase the
          // original 5%-of-max-HP HoT budget (up to Level-3 7.25%).
          // Delivery ticks merely spend this finite budget; no extra rolls.
          remainingHeal: Math.max(previous?.remainingHeal || 0,
            Math.min(u.maxHp * (form.criticalMending === true ? 0.075 : 0.05),
              u.maxHp * (form.healFraction || 0))),
          criticalChance: Math.max(previous?.criticalChance || 0,
            Math.min(0.06, form.criticalChance || 0)),
          specialDamage: Math.max(previous?.specialDamage || 0,
            Math.min(0.06, form.specialDamage || 0)),
        };
        return true;
      }
      advanceRogueMending(dt) {
        if (this.hero.class !== 'rogue' || !Number.isFinite(dt) || dt <= 0) return;
        for (const u of [this.hero, ...this.activeLivingParty()]) {
          const effect = this.rogueSongBoon(u, 'mending');
          if (!effect || !(effect.remainingHeal > 0)) continue;
          const live = Math.max(0.01, effect.until - (this.s.time - dt)),
            paid = Math.min(effect.remainingHeal, effect.remainingHeal * Math.min(dt, live) / live);
          u.hp = Math.min(u.maxHp, u.hp + paid);
          effect.remainingHeal = Math.max(0, effect.remainingHeal - paid);
        }
      }
      companionRallyMoveSpeed(u, base) {
        const rally = this.rangerRallyActive(u)
          ? Math.min(0.25, u.rangerRallyMovement || 0) : 0;
        const quickstep = this.rogueSongBoon(u, 'quickstep')?.move || 0;
        return this.companionMoveSpeed(base) *
          (this.charmedCompanionProfile(u)?.speed || 1) *
          (1 + Math.max(rally, quickstep));
      }
      companionRallyAttackSpeed(u) {
        return this.rangerRallyActive(u) ? 1 + Math.min(0.2, u.rangerRallyAttack || 0) : 1;
      }
      rogueCompanionSpecialDamage(u, amount) {
        return amount * (1 + (this.rogueSongBoon(u, 'finale')?.specialDamage || 0));
      }
      companionAttackDamage(u) {
        return (
          (this.charmedCompanionProfile(u)?.damage ?? u.damage) +
          this.hero.level * 2 + this.companionInheritedDamageBonus()
        );
      }
      // Skill 1's short allied refrain affects ordinary companion basics only.
      // Existing troop special skills retain their unmodified source damage.
      companionBasicAttackDamage(u) {
        const base = this.companionAttackDamage(u);
        return base * (1 + ((u.rogueSharpRefrainUntil || 0) > this.s.time
          ? Math.min(0.07, Math.max(0, u.rogueSharpRefrainBonus || 0)) : 0));
      }
      companionBasicInterval(u) {
        return this.charmedCompanionProfile(u)?.interval || 0.85;
      }
      companionSecondSkillUnlocked() {
        return (this.s.companionCombatTraining || 1) >= 2 || (this.hero.skills[1] || 0) > 0;
      }
      companionSecondSkillTargets(u, target) {
        if (u.type === 'pet') return this.petSkillTargets(u, target, 2);
        const def = R.companionSkills?.second?.[u.type];
        if (!def || !target) return [];
        const angle = Math.atan2(target.y - u.y, target.x - u.x),
          from = { x: u.x, y: u.y },
          delta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b)),
          end = {
            x: u.x + Math.cos(angle) * (def.range || 0),
            y: u.y + Math.sin(angle) * (def.range || 0),
          };
        return this.zone()
          .enemies.filter(
            (e) =>
              e.hp > 0 &&
              !e.neutral &&
              this.line(u, e) &&
              (def.shape === 'cone'
                ? dist(e, u) <= def.range &&
                  Math.abs(delta(Math.atan2(e.y - u.y, e.x - u.x), angle)) <= def.halfAngle
                : def.shape === 'line'
                  ? (() => {
                      const along = (e.x - u.x) * Math.cos(angle) + (e.y - u.y) * Math.sin(angle);
                      return (
                        along >= 0 &&
                        along <= def.range &&
                        this.distanceToSegment(e, from, end) <= def.halfWidth
                      );
                    })()
                  : false),
          )
          .sort((a, b) => this.idOrder(a, b));
      }
      companionUseFirstSkill(u, target) {
        if (u.charmOrigin) return false;
        if (this.companionSurvivalMode(u) && !this.companionSafeContribution(u, target, 1))
          return false;
        if (u.type === 'pet') return this.usePetSkill(u, target, 1);
        if (!['soldier', 'archer'].includes(u.type)) return false;
        const cfg = R.companionSkills?.first,
          def = cfg?.[u.type];
        if (!cfg || !def || !target || (u.skill1Cd || 0) > 0) return false;
        const base = this.companionAttackDamage(u);
        if (u.type === 'soldier') {
          if (dist(u, target) > 80 || !this.line(u, target)) return false;
          const criticalReceipt = this.troopCriticalRelease(u, 'first');
          if (!this.damage(
            target, this.troopCriticalDamage(criticalReceipt,
              this.rogueCompanionSpecialDamage(u, base * cfg.multiplier)), u.id,
          )) return false;
          const veteran = R.companionSkills.veteran;
          if (
            (this.s.expeditionRank || 1) >= veteran.expeditionRank &&
            ((u.wardUntil || 0) <= this.s.time || (u.wardReduction || 0) <= veteran.soldierWard)
          ) {
            u.wardUntil = this.s.time + veteran.soldierWardSeconds;
            u.wardReduction = veteran.soldierWard;
          }
          u.skill1Cd = cfg.cooldown;
          u.skillGlobalCd = R.companionSkills.globalCooldown || 1.5;
          u.cd = Math.max(u.cd, 0.4);
          this.event('melee', {
            actor: 'companion',
            role: 'soldier',
            source: u.id,
            weapon: u.charmOrigin ? 'claw' : 'sword',
            x: target.x,
            y: target.y,
            target: target.id,
            special: 'power-strike',
          });
          this.event('swing', {
            actor: 'companion',
            role: 'soldier',
            source: u.id,
            weapon: u.charmOrigin ? 'claw' : 'sword',
            x: u.x,
            y: u.y,
            targetX: target.x,
            targetY: target.y,
            combo: 3,
            companionSkill: 'power-strike',
          });
          this.event('companionSkill', {
            source: u.id,
            unitType: u.type,
            skill: 'power-strike',
            targetId: target.id,
          });
          return true;
        }
        if (dist(u, target) > 320 || !this.line(u, target)) return false;
        const criticalReceipt = this.troopCriticalRelease(u, 'first');
        u.skill1Cd = cfg.cooldown;
        u.skillGlobalCd = R.companionSkills.globalCooldown || 1.5;
        u.cd = Math.max(u.cd, 0.4);
        const shot = Math.max(1, dist(u, target));
        for (let j = 0; j < 3; j++)
          this.s.projectiles.push({
            id: 'projectile-' + this.s.nextId++,
            x: u.x,
            y: u.y,
            dx: (target.x - u.x) / shot,
            dy: (target.y - u.y) / shot,
            target: target.id,
            damage: this.troopCriticalDamage(criticalReceipt,
              this.rogueCompanionSpecialDamage(u, base)),
            source: u.id,
            ...(criticalReceipt ? { criticalExecution: criticalReceipt } : {}),
            speed: 520,
            delay: j * 0.08,
            ...(j > 0 ? { companionDelayedLaunch: true } : {}),
            style: this.charmedCompanionProfile(u)?.style || 'arrow',
            rapid: true,
            companionSkill: 'triple-shot',
            ...(j === 0 &&
            (this.s.expeditionRank || 1) >= R.companionSkills.veteran.expeditionRank &&
            dist(u, target) < R.companionSkills.veteran.coveringRange
              ? { slow: R.companionSkills.veteran.coveringSlow }
              : {}),
          });
        this.event('projectileLaunch', {
          actor: 'companion',
          role: 'archer',
          source: u.id,
          style: this.charmedCompanionProfile(u)?.style || 'arrow',
          count: 3, // Retain existing three-shot audio contract.
          releasedCount: 1,
          pendingCount: 2,
          special: 'triple-shot',
          x: u.x,
          y: u.y,
          target: target.id,
        });
        this.event('companionSkill', {
          source: u.id,
          unitType: u.type,
          skill: 'triple-shot',
          targetId: target.id,
        });
        return true;
      }
      companionCoveringShot(u, target) {
        if (
          u.type !== 'archer' ||
          !target ||
          target.hp <= 0 ||
          target.neutral ||
          target.returning ||
          (this.s.expeditionRank || 1) < R.companionSkills.veteran.expeditionRank ||
          dist(u, target) >= R.companionSkills.veteran.coveringRange ||
          (u.skillGlobalCd || 0) > 0 ||
          this.mageSilenceActive(u) ||
          this._companionCharges?.has(u.id) ||
          !this.tacticalDirectTargetable(target)
        )
          return false;
        return this.companionUseFirstSkill(u, target);
      }
      // The second companion skill is charged, not an instantaneous AoE.
      // The actor keeps the aim for 0.65s and releases only after surviving damage.
      companionUseSecondSkill(u, target, targets = this.companionSecondSkillTargets(u, target)) {
        if (u.charmOrigin) return false;
        if (
          (this.companionSurvivalMode(u) && !this.companionSafeContribution(u, target, 2)) ||
          !this.companionSecondSkillUnlocked() ||
          !(u.type === 'pet' ? this.petDefinition(u) : R.companionSkills.second?.[u.type]) ||
          !target ||
          (u.skill2Cd || 0) > 0 ||
          !targets.length ||
          this.mageSilenceActive(u) ||
          this._companionCharges?.has(u.id) ||
          !this.beginPartyCharge(u, 2)
        )
          return false;
        if (!this._companionCharges) this._companionCharges = new Map();
        this._companionCharges.set(u.id, {
          unit: u,
          zone: this.zoneId,
          targetId: target.id,
          readyAt: this.partyChargeState(u).readyAt,
        });
        this.event('companionChargeStart', {
          source: u.id,
          unitType: u.type,
          targetId: target.id,
          slot: 2,
          duration: R.chargedSkills.holdSeconds,
          x: u.x,
          y: u.y,
        });
        return true;
      }
      resolveCompanionSecondSkill(
        u,
        target,
        targets = this.companionSecondSkillTargets(u, target),
      ) {
        if (u.type === 'pet') return this.usePetSkill(u, target, 2, targets);
        const cfg = R.companionSkills?.second,
          def = cfg?.[u.type];
        if (
          !this.companionSecondSkillUnlocked() ||
          !cfg ||
          !def ||
          !target ||
          (u.skill2Cd || 0) > 0 ||
          !targets.length
        )
          return false;
        const criticalReceipt = this.troopCriticalRelease(u, 'second');
        const base = this.companionAttackDamage(u),
          damage = this.troopCriticalDamage(criticalReceipt,
            this.rogueCompanionSpecialDamage(u, base * def.multiplier)),
          angle = Math.atan2(target.y - u.y, target.x - u.x);
        let hits = 0;
        if (u.type === 'archer') {
          // #464: the original selected targets receive real physical arrows.
          // A single committed critical receipt is shared across all shafts;
          // no damage/status occurs until the native projectile contact.
          for (const e of targets) {
            const distance = Math.max(1, dist(u, e));
            this.s.projectiles.push({
              id: 'projectile-' + this.s.nextId++,
              x: u.x,
              y: u.y,
              dx: (e.x - u.x) / distance,
              dy: (e.y - u.y) / distance,
              target: e.id,
              damage,
              source: u.id,
              speed: 650,
              style: this.charmedCompanionProfile(u)?.style || 'arrow',
              area: true,
              companionSkill: 'piercing-volley',
              ...(criticalReceipt ? { criticalExecution: criticalReceipt } : {}),
            });
            hits++;
          }
        } else {
          for (const e of targets) if (this.damage(e, damage, u.id, { area: true })) hits++;
        }
        if (!hits) return false;
        u.skill2Cd = cfg.cooldown;
        u.skillGlobalCd = R.companionSkills.globalCooldown || 1.5;
        u.cd = Math.max(u.cd, 0.5);
        this.event(
          u.type === 'soldier' ? 'melee' : 'spell',
          u.type === 'soldier'
            ? {
                actor: 'companion',
                role: 'soldier',
                source: u.id,
                weapon: u.charmOrigin ? 'claw' : 'sword',
                x: target.x,
                y: target.y,
                target: target.id,
                special: 'holy-cleave',
              }
            : {
                actor: 'companion',
                role: 'archer',
                class: 'ranger',
                source: u.id,
                x: u.x,
                y: u.y,
                special: 'piercing-volley',
              },
        );
        this.event('chargedArea', {
          slot: 2,
          class: u.type === 'soldier' ? 'paladin' : 'ranger',
          companion: true,
          actor: 'companion',
          role: u.type,
          source: u.id,
          targetId: target.id,
          effect: def.effect,
          shape: def.shape,
          ...(u.type === 'archer' ? { projectileVolley: true } : {}),
          x: target.x,
          y: target.y,
          fromX: u.x,
          fromY: u.y,
          angle,
          radius: 0,
          range: def.range || 0,
          halfAngle: def.halfAngle || 0,
          halfWidth: def.halfWidth || 0,
          hits: u.type === 'archer' ? 0 : hits,
          ...(u.type === 'archer' ? { arrows: hits } : {}),
        });
        this.event('companionSkill', {
          source: u.id,
          unitType: u.type,
          skill: u.type === 'soldier' ? 'holy-cleave' : 'piercing-volley',
          targetId: target.id,
          hits: u.type === 'archer' ? 0 : hits,
          ...(u.type === 'archer' ? { arrows: hits } : {}),
        });
        return true;
      }
      resolveCompanionCharges() {
        const z = this.zone();
        for (const [id, pending] of this._companionCharges || []) {
          const u = pending.unit,
            observation = this.partyChargeState(u);
          const valid =
            pending.zone === this.zoneId &&
            this.s.party.includes(u) &&
            u.active !== false &&
            u.hp > 0 &&
            !u.deathRollHeld &&
            !u.keeperHeld &&
            !this.mageSilenceActive(u) &&
            !this._tacticalScatter?.has(u.id) &&
            !this.peace &&
            (!this.companionSurvivalMode(u) ||
              this.companionSafeContribution(
                u,
                z.enemies.find((foe) => foe.id === pending.targetId),
                2,
              )) &&
            !this.s.recallActive;
          if (!valid || !observation || observation.interrupted) {
            this.clearPartyCharge(u);
            continue;
          }
          if (this.partyChargeNow() + 1e-9 < pending.readyAt) continue;
          const selected = z.enemies.find(
            (foe) =>
              foe.id === pending.targetId &&
              foe.hp > 0 &&
              !foe.neutral &&
              this.tacticalDirectTargetable(foe) &&
              this.line(u, foe),
          );
          this.clearPartyCharge(u);
          if (!selected || !this.resolveCompanionSecondSkill(u, selected)) {
            this.recoverPartyCharge(u);
            u.skillGlobalCd = Math.max(
              u.skillGlobalCd || 0,
              R.chargedSkills.interrupt.recoverySeconds,
            );
          }
        }
      }
      // Only meaningful support takes priority over the usual multi-target charge.
      // Lifebinder heals on contact, so check reachable wounded recipients.
      // A live stronger ward is never overwritten simply to refresh it.
      petSupportSkillNeeded(u, slot) {
        if (u.type !== 'pet') return false;
        const def = this.petSkillDefinition(u, slot);
        if (!def) return false;
        if (def.ward) {
          const existing = (u.wardReduction || 0),
            remaining = (u.wardUntil || 0) - this.s.time;
          // The impact handler preserves a stronger active ward. Only renew
          // an equal ward near expiry, or upgrade a weaker/expired ward.
          if (remaining <= 0 || existing < def.ward || (existing === def.ward && remaining <= 0.5))
            return true;
        }
        if (def.heal && u.maxHp - u.hp >= u.maxHp * def.heal * 0.5) return true;
        if (!def.allyHeal) return false;
        const worthwhile = u.maxHp * def.allyHeal * 0.5;
        return [this.hero, ...this.activeLivingParty()].some(
          (a) =>
            a !== u &&
            a.hp > 0 &&
            a.maxHp - a.hp >= worthwhile &&
            dist(u, a) <= def.healRange &&
            this.line(u, a),
        );
      }
      rememberFailedPetCharge(u) {
        if (u?.type === 'pet' && (u.skill1Cd || 0) <= 0)
          petFirstAfterFailedCharge.set(u, { zone: this.zoneId, until: this.s.time + 3 });
      }
      petFirstDueAfterFailedCharge(u) {
        const retry = petFirstAfterFailedCharge.get(u);
        if (!retry) return false;
        if (
          retry.zone !== this.zoneId ||
          this.s.time > retry.until ||
          (u.skill1Cd || 0) > 0
        ) {
          petFirstAfterFailedCharge.delete(u);
          return false;
        }
        return true;
      }
      // A Charmed ranged healer uses the same automatic HP recovery as a
      // conventional Ranger: the Neri-trained amount, five-second pulses,
      // ten-second cooldown and idle/combat triage thresholds. Unlike the
      // original hostile healer, it must support the friendly party while idle.
      // Keep this separate from Ranger mana and offensive skill ownership.
      charmedRangedSupport(u, living = this.activeLivingParty()) {
        if (
          !u?.charmOrigin ||
          u.type !== 'archer' ||
          !this.s.party.includes(u) ||
          u.active === false ||
          u.hp <= 0 ||
          u.deathRollHeld ||
          u.keeperHeld ||
          !this.isCharmedCompanion(u) ||
          (u.charmSupportCd || 0) > 0 ||
          u.order ||
          this.peace ||
          this.s.challenge.pending ||
          this.s.challenge.gameOver ||
          this.mageSilenceActive(u)
        )
          return false;
        const healThreshold = this.manaCombatActive()
            ? R.rangerSupport.healThreshold
            : 1,
          patients = [this.hero, ...living].filter((ally) =>
            ally.hp > 0 &&
            ally.hp < ally.maxHp &&
            ally.hp <= ally.maxHp * healThreshold &&
            !this.hasSupportEffect(ally, 'health')),
          target = patients.includes(this.hero)
            ? this.hero
            : patients.sort((a, b) =>
                a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (!target) return false;
        const amount = this.rangerSupportAmount('health');
        this.addSupportEffect(target, 'health', amount);
        u.charmSupportCd = R.rangerSupport.cooldown;
        this.say(
          (u.customName || u.charmOrigin.typeName) + ' casts Heal on ' +
          (target === this.hero
            ? 'the hero'
            : target.customName || target.name || 'an ally') +
          ' · restoring ' + amount + ' HP over ' +
          R.rangerSupport.duration + ' seconds.',
        );
        this.event('heal', {
          x: target.x, y: target.y,
          fromX: u.x, fromY: u.y,
          target: target === this.hero ? 'hero' : target.id,
          resource: 'health',
        });
        return true;
      }
      companionTrySkill(u, target) {
        // An authored species must not inherit Soldier/Ranger special skills.
        if (u.charmOrigin) return false;
        if (
          !target ||
          (u.skillGlobalCd || 0) > 0 ||
          this.mageSilenceActive(u) ||
          this._companionCharges?.has(u.id)
        )
          return false;
        const firstReady = (u.skill1Cd || 0) <= 0,
          secondReady = this.companionSecondSkillUnlocked() && (u.skill2Cd || 0) <= 0,
          secondTargets = secondReady ? this.companionSecondSkillTargets(u, target) : [];
        // The normal area preference must not starve a useful heal/ward, or
        // retry another easily interrupted charge before a ready first special.
        if (
          u.type === 'pet' &&
          firstReady &&
          (this.petSupportSkillNeeded(u, 1) || this.petFirstDueAfterFailedCharge(u)) &&
          this.companionUseFirstSkill(u, target)
        ) {
          petFirstAfterFailedCharge.delete(u);
          return true;
        }
        // Cinder Cub's protective ward belongs to its charged second skill.
        if (
          u.type === 'pet' &&
          secondReady &&
          this.petSupportSkillNeeded(u, 2) &&
          this.companionUseSecondSkill(u, target, secondTargets)
        )
          return true;
        if (
          secondReady &&
          (secondTargets.length >= 2 || !firstReady) &&
          this.companionUseSecondSkill(u, target, secondTargets)
        )
          return true;
        if (firstReady && this.companionUseFirstSkill(u, target)) {
          if (u.type === 'pet') petFirstAfterFailedCharge.delete(u);
          return true;
        }
        if (secondReady && this.companionUseSecondSkill(u, target, secondTargets)) return true;
        return false;
      }
      unit(type, x, y, petFamily = null) {
        const pet = type === 'pet' ? this.petDefinition(petFamily) : null;
        if (type === 'pet' && !pet) throw Error('Unknown boss pet');
        const base = {
          soldier: [120, 12, '⚔️'],
          archer: [105, 15, '🏹'],
          pet: [112, R.balance.companions.petDamage, '🐾'],
        }[type];
        if (!base) throw Error('Unknown companion type');
        const maxHp = this.companionMaxHp(type);
        return {
          id: 'ally-' + this.s.nextId++,
          type,
          ...(pet ? { petFamily, name: pet.name } : {}),
          x,
          y,
          hp: maxHp,
          maxHp,
          damage: base[1],
          icon: base[2],
          cd: 0,
          skill1Cd: 0,
          skill2Cd: 0,
          skillGlobalCd: 0,
          healCd: 0,
          manaCd: 0,
          survivalCd: 0,
          immune: 0,
          supportEffects: [],
          order: null,
          carry: 0,
          active: true,
        };
      }
      queuedCompanions(includeRequest = true) {
        return (
          (includeRequest && this.s.recruitmentRequest ? 1 : 0) +
          Object.values(this.s.zones).reduce(
            (n, z) => n + z.buildings.filter((b) => b.queue > 0).length,
            0,
          )
        );
      }
      activeParty() {
        return this.s.party.filter((u) => u.active !== false);
      }
      activeLivingParty() {
        return this.s.party.filter((u) => u.active !== false && u.hp > 0);
      }
      barracksFieldCap(b) {
        return b?.full ? this.expeditionPartyCap() : Math.min(3, this.expeditionPartyCap());
      }
      rosterCount() {
        return this.s.party.length;
      }
      gatheringCapacity() {
        return (
          R.gatheringTravel.capacity +
          Math.max(0, this.regionIndex()) * R.gatheringTravel.capacityPerRegion
        );
      }
      depositSite(u) {
        const z = this.isDungeon() ? this.s.zones[this.definition().id] : this.zone(),
          i = this.regionIndex(),
          sites = [
            ...(z?.npcs.filter((n) => n.kind === 'supplier' || n.kind === 'rest') || []),
            ...(this.isDungeon()
              ? []
              : z?.buildings.filter((b) => b.progress >= 4 && b.full) || []),
            { x: D.towns[i][0], y: D.towns[i][1] },
          ];
        const cached = depositTrips.get(u),
          avoid = deliveryAvoidance.get(u);
        if (
          cached?.zone === this.zoneId &&
          cached.until > this.s.time &&
          cached.site &&
          sites.some((p) => p.x === cached.site.x && p.y === cached.site.y) &&
          !(avoid?.until > this.s.time && dist(avoid.point, cached.site) < 30)
        )
          return cached.site;
        const threats = this.gatheringThreats(),
          seen = new Set(),
          candidates = [];
        for (const site of sites) {
          const key = site.x + ':' + site.y;
          if (seen.has(key)) continue;
          seen.add(key);
          const length = this.gatheringRouteLength(u, site);
          if (!Number.isFinite(length)) continue;
          const danger = threats.filter((e) => dist(site, e) < e.r).length;
          const rejected =
            avoid?.zone === this.zoneId &&
            avoid.until > this.s.time &&
            dist(avoid.point, site) < 30;
          candidates.push({
            site,
            score: length + danger * this.zoneSize() + (rejected ? this.zoneSize() * 4 : 0),
          });
        }
        const site = candidates.sort((a, b) => a.score - b.score)[0]?.site || null;
        depositTrips.set(u, {
          zone: this.zoneId,
          until: this.s.time + R.gatheringTravel.replanSeconds,
          site,
        });
        return site;
      }
      gatheringEncounter(u) {
        if (this.peace) return null;
        return (
          this.zone()
            .enemies.filter(
              (e) =>
                e.hp > 0 &&
                !e.neutral &&
                !e.returning &&
                dist(u, e) <=
                  Math.max(R.companionJudgment.nearThreatRadius, this.enemyAcquisitionRange(e)) &&
                (e.aggro || this.enemyRangedLine(e, u)),
            )
            .sort((a, b) => dist(a, u) - dist(b, u))[0] || null
        );
      }
      laborMoveSpeed(u) {
        return (
          this.companionRallyMoveSpeed(u, 230) *
          this.slowMovementFactor(u) *
          this.mireBogMovementFactor(u) *
          this.ashMovementFactor(u)
        );
      }
      laborRegroup(u, living, dt) {
        const point = this.companionRegroupPoint(
          u,
          living,
          this.zone().enemies.filter((e) => e.hp > 0 && !e.neutral),
        );
        if (dist(u, point) > R.companionRecall.arrivalRadius)
          this.followCompanion(
            u,
            point,
            this.laborMoveSpeed(u),
            dt,
            R.companionRecall.arrivalRadius,
            true,
          );
      }
      resumeGathering(u) {
        const current = this.zone().nodes.find(
          (n) => n.id === u.order.id && n.amount > 0 && this.tributeKnown(n),
        );
        u.order = current ? { type: 'gather', id: current.id, group: current.resourceGroup } : null;
        depositTrips.delete(u);
        this.clearCompanionTravel(u);
        if (!current) this.clearGatheringIntent(u);
      }
      returnFromDelivery(u, living, dt) {
        const journey = u.order?.journey;
        if (!journey?.returning) return false;
        while (journey.points.length && dist(u, journey.points[0]) <= 8) journey.points.shift();
        if (!journey.points.length) {
          this.resumeGathering(u);
          return true;
        }
        const point = journey.points[0];
        // Validate and traverse the recorded segment with the same actual body.
        // Encounter AI above this branch handles enemies; perception is not a wall.
        if (this.clearSegment(u, point, this.actorRadius(u)))
          this.move(u, point, this.laborMoveSpeed(u), dt, 3);
        else this.followCompanion(u, point, this.laborMoveSpeed(u), dt, 3);
        return true;
      }
      availableRangers(type) {
        const key = type === 'health' ? 'healCd' : 'manaCd';
        return this.activeLivingParty().filter(
          (u) => u.type === 'archer' && !u.charmOrigin && !u.keeperHeld && (u[key] || 0) <= 0,
        );
      }
      supportEffectActive(type) {
        return [this.hero, ...this.activeLivingParty()].some((u) =>
          (u.supportEffects || []).some((e) => e.type === type),
        );
      }
      hasSupportEffect(u, type) {
        return (u.supportEffects || []).some((e) => e.type === type);
      }
      addSupportEffect(u, type, amount) {
        if (!u.supportEffects) u.supportEffects = [];
        u.supportEffects.push({ type, remaining: amount, seconds: R.rangerSupport.duration });
      }
      cancelRangerHealRequest() {
        rangerHealRequests.delete(this);
      }
      queuedRangerHeal() {
        const request = rangerHealRequests.get(this);
        if (!request) return null;
        const active = this.activeLivingParty().filter((u) => u.type === 'archer' && !u.charmOrigin);
        if (
          request.hero !== this.hero ||
          request.zone !== this.zoneId ||
          request.deaths !== this.s.statistics.deaths ||
          this.hero.hp <= 0 ||
          this.s.challenge.pending ||
          this.s.challenge.gameOver ||
          !active.length
        ) {
          this.cancelRangerHealRequest();
          return null;
        }
        const casters = active.filter((u) => !u.keeperHeld);
        return {
          cooldown: casters.length
            ? Math.max(0, Math.min(...casters.map((u) => u.healCd || 0)))
            : 0,
          blocked: !casters.some((u) => (u.healCd || 0) <= 0 && !this.mageSilenceActive(u)),
        };
      }
      requestRangerHeal() {
        if (this.queuedRangerHeal()) {
          this.resolveQueuedRangerHeal();
          return true;
        }
        const active = this.activeLivingParty().filter((u) => u.type === 'archer'),
          ready = this.availableRangers('health').some((u) => !this.mageSilenceActive(u));
        if (
          !ready &&
          active.some((u) => (u.healCd || 0) > 0) &&
          this.hero.hp > 0 &&
          !this.s.challenge.pending &&
          !this.s.challenge.gameOver
        ) {
          rangerHealRequests.set(this, {
            hero: this.hero,
            zone: this.zoneId,
            deaths: this.s.statistics.deaths,
          });
          this.say('Ranger Heal queued for the hero.');
          return true;
        }
        return this.rangerSupport('health', true);
      }
      resolveQueuedRangerHeal() {
        if (!this.queuedRangerHeal()) return false;
        if (!this.availableRangers('health').some((u) => !this.mageSilenceActive(u))) return false;
        // A stored hero request must never fall back to a wounded companion.
        // Already-full/covered heroes need no duplicate effect or paid cooldown.
        if (this.hero.hp >= this.hero.maxHp || this.hasSupportEffect(this.hero, 'health')) {
          this.cancelRangerHealRequest();
          return false;
        }
        const cast = this.rangerSupport('health', false, this.hero);
        if (cast) this.cancelRangerHealRequest();
        return cast;
      }
      rangerSupport(type, manual = true, targetOverride = null) {
        if (type === 'mana' && !R.resourceMode.manaEnabled) return false;
        if (
          !['health', 'mana'].includes(type) ||
          this.s.challenge.pending ||
          this.s.challenge.gameOver
        )
          return false;
        const readyRangers = this.availableRangers(type),
          rangers = readyRangers.filter((u) => !this.mageSilenceActive(u)),
          key = type === 'health' ? 'healCd' : 'manaCd';
        if (!rangers.length) {
          if (manual) {
            const active = this.activeLivingParty().filter((u) => u.type === 'archer' && !u.charmOrigin);
            if (!active.length)
              this.say(
                'No active Ranger is available to use ' +
                  (type === 'health' ? 'Heal.' : 'Mana Recovery.'),
              );
            else if (readyRangers.length)
              this.say(
                'Ranger cannot use ' +
                  (type === 'health' ? 'Heal' : 'Mana Recovery') +
                  ' while silenced.',
              );
            else
              this.say(
                (type === 'health' ? 'Heal' : 'Mana Recovery') +
                  ' is cooling down · ' +
                  Math.ceil(Math.min(...active.map((u) => u[key] || 0))) +
                  's.',
              );
          }
          return false;
        }
        if (type === 'health') {
          const injured = [this.hero, ...this.activeLivingParty()].filter(
            (u) => u.hp > 0 && u.hp < u.maxHp && !this.hasSupportEffect(u, 'health'),
          );
          if (!injured.length) {
            if (manual) this.say('The active party is already fully covered or at full health.');
            return false;
          }
          const target =
              targetOverride && injured.includes(targetOverride)
                ? targetOverride
                : injured.includes(this.hero)
                  ? this.hero
                  : injured.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0],
            ranger = rangers[0],
            originalAmount = this.rangerSupportAmount(type),
            criticalReceipt = this.troopCriticalRelease(ranger, 'heal'),
            amount = this.troopCriticalSupportAmount(criticalReceipt, originalAmount);
          ranger[key] = R.rangerSupport.cooldown;
          this.addSupportEffect(target, type, amount);
          this.say(
            'Ranger casts Heal on ' +
              (target === this.hero
                ? 'the hero'
                : target.type === 'pet'
                  ? this.petDefinition(target).name
                  : target.type === 'archer'
                    ? 'a Ranger'
                    : 'a Soldier') +
              ' · restoring ' +
              amount +
              ' HP over five seconds.',
          );
          this.event('heal', {
            x: target.x,
            y: target.y,
            fromX: ranger.x,
            fromY: ranger.y,
            resource: 'health',
            target: target === this.hero ? 'hero' : target.id,
          });
          return true;
        }
        if (this.hero.mp >= this.hero.maxMp || this.hasSupportEffect(this.hero, 'mana')) {
          if (manual)
            this.say(
              this.hero.mp >= this.hero.maxMp
                ? 'Hero mana is already full.'
                : 'Mana Recovery is already restoring the hero.',
            );
          return false;
        }
        const ranger = rangers[0],
          originalAmount = this.rangerSupportAmount(type),
          criticalReceipt = this.troopCriticalRelease(ranger, 'mana'),
          amount = this.troopCriticalSupportAmount(criticalReceipt, originalAmount);
        ranger[key] = R.rangerSupport.cooldown;
        this.addSupportEffect(this.hero, type, amount);
        this.say(
          'Ranger casts Mana Recovery · hero restoring ' + amount + ' MP over five seconds.',
        );
        this.event('heal', {
          x: this.hero.x,
          y: this.hero.y,
          fromX: ranger.x,
          fromY: ranger.y,
          resource: 'mana',
          target: 'hero',
        });
        return true;
      }
      potion(type) {
        return this.rangerSupport(type, true);
      }
      updateRangerSupport(dt) {
        for (const u of [this.hero, ...this.s.party]) {
          if (!Array.isArray(u.supportEffects)) u.supportEffects = [];
          const next = [];
          for (const e of u.supportEffects) {
            if (e.type === 'mana' && !R.resourceMode.manaEnabled) {
              next.push(e); // Dormant legacy state remains available for restoration.
              continue;
            }
            if (u.hp <= 0 || e.seconds <= 0 || e.remaining <= 0) continue;
            const field = e.type === 'health' ? 'hp' : 'mp',
              max = e.type === 'health' ? 'maxHp' : 'maxMp';
            if (field === 'mp' && u !== this.hero) continue;
            if (u[field] >= u[max]) continue;
            const step = Math.min(dt, e.seconds),
              amount = (e.remaining * step) / e.seconds;
            u[field] = Math.min(u[max], u[field] + amount *
              (field === 'hp' ? 1 + (this.rogueSongBoon(u, 'mending')?.incomingHealing || 0) : 1));
            e.remaining = Math.max(0, e.remaining - amount);
            e.seconds = Math.max(0, e.seconds - step);
            if (e.seconds > 0 && e.remaining > 0 && u[field] < u[max]) next.push(e);
          }
          u.supportEffects = next;
        }
        this.advanceRogueMending(dt);
      }
      autoRangerSupport() {
        // Explicit queued hero care gets the first eligible Ranger before triage.
        this.resolveQueuedRangerHeal();
        const h = this.hero;
        if (h.hp <= 0 || this.s.challenge.pending || this.s.challenge.gameOver) return;
        const engaged = this.manaCombatActive(),
          healThreshold = engaged ? R.rangerSupport.healThreshold : 1,
          manaThreshold = engaged ? R.rangerSupport.manaThreshold : 1;
        for (const ranger of this.availableRangers('health').slice()) {
          const candidates = [h, ...this.activeLivingParty()].filter(
            (u) =>
              u.hp > 0 &&
              u.hp < u.maxHp &&
              u.hp <= u.maxHp * healThreshold &&
              !this.hasSupportEffect(u, 'health'),
          );
          if (!candidates.length) break;
          const target = candidates.includes(h)
            ? h
            : candidates.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          if (!this.rangerSupport('health', false, target)) break;
        }
        // Heal after conventional Rangers have claimed patients. Every active
        // Charmed ranged healer can then treat another wounded party member,
        // including the Rogue, pets and companions of different species.
        // Run even when no enemies are engaged; Ranger support does too.
        const living = this.activeLivingParty();
        for (const healer of living)
          if (healer.charmOrigin && healer.type === 'archer')
            this.charmedRangedSupport(healer, living);
        if (
          R.resourceMode.manaEnabled &&
          h.mp < h.maxMp &&
          h.mp <= h.maxMp * manaThreshold &&
          !this.hasSupportEffect(h, 'mana')
        )
          this.rangerSupport('mana', false);
      }
      companionServiceReason() {
        if (this.hero.hp <= 0 || this.s.challenge.pending || this.s.challenge.gameOver)
          return 'Companion services require a living, available hero.';
        if (this.refugeThreat()) return 'Companion services wait until nearby combat has ended.';
        return '';
      }
      companionServiceSourceReason(barracksId, zone = this.zoneId) {
        const z = this.s.zones[zone];
        if (barracksId === null)
          return z?.npcs.some((n) => n.kind === 'recruiter')
            ? ''
            : 'The source town Captain is no longer available.';
        const b = z?.buildings.find((b) => b.id === barracksId && b.kind === 'barracks');
        if (!b) return 'This Barracks is no longer available. Reopen a local Barracks.';
        if (b.progress < 4) return 'Finish building this Barracks before using companion services.';
        return '';
      }
      companionRecruitmentReason(type, barracksId = null, options = {}) {
        if (!['soldier', 'archer'].includes(type)) return 'Choose a Soldier or Ranger to recruit.';
        // Capability gate, not a menu-only restriction: covers Captain,
        // Barracks, paid requests, queued completions and direct API calls.
        if (this.hero.class === 'rogue')
          return 'Rogues cannot hire Soldiers or Rangers. Charm eligible monsters in battle.';
        if ((this.s.expeditionRank || 1) < 2)
          return 'Recruitment unlocks at Expedition 2. Rescue Mira and train the Expedition Skill.';
        const request =
          options.replaceRequest || options.completeRequest ? null : this.s.recruitmentRequest;
        if (this.rosterCount() + this.queuedCompanions(false) + (request ? 1 : 0) >= 200)
          return 'Company limit reached: 200 companions, including reserves and queued recruits.';
        if (options.replaceRequest || options.completeRequest) {
          const sourceReason = this.companionServiceSourceReason(
            barracksId,
            options.zone || this.zoneId,
          );
          if (sourceReason) return sourceReason;
        }
        if (barracksId !== null) {
          const b = this.s.zones[options.zone || this.zoneId]?.buildings.find(
            (b) => b.id === barracksId,
          );
          if (!b) return 'This Barracks is no longer available. Reopen a local Barracks.';
          if (b.progress < 4) return 'Finish building this Barracks before recruiting.';
          if (b.queue > 0)
            return 'This Barracks is already training a companion. Wait for training to finish.';
        } else if (
          !options.completeRequest &&
          this.rosterCount() + (request?.barracksId === null ? 1 : 0) >= 3
        )
          return 'The town can employ only 3 companions, including reserves. Recruit at a completed Basic or Full Barracks; resting someone does not free a town hiring place.';
        const serviceReason = this.companionServiceReason();
        if (serviceReason) return serviceReason;
        const price =
          barracksId === null ? this.recruitPrice(type) : this.barracksRecruitPrice(type);
        if (!price) return 'Recruitment is unavailable for this companion.';
        if (!options.ignoreFunds && this.hero.gold < price)
          return 'Not enough crowns: recruitment costs ' + price + '.';
        return '';
      }
      recruitmentRequestMatches(type, barracksId = null) {
        const request = this.s.recruitmentRequest;
        return !!request && request.type === type && request.barracksId === barracksId;
      }
      recruitmentRequestPrice(request = this.s.recruitmentRequest) {
        return !request
          ? 0
          : request.barracksId === null
            ? this.recruitPrice(request.type)
            : this.barracksRecruitPrice(request.type);
      }
      cancelRecruitmentRequest() {
        if (!this.s.recruitmentRequest) return false;
        this.s.recruitmentRequest = null;
        this.say('Queued recruitment cancelled. No crowns were spent.');
        return true;
      }
      requestCompanionRecruitment(type, barracksId = null) {
        if (this.recruitmentRequestMatches(type, barracksId))
          return this.cancelRecruitmentRequest();
        const reason = this.companionRecruitmentReason(type, barracksId, {
          ignoreFunds: true,
          replaceRequest: true,
        });
        if (reason) {
          this.say(reason);
          return false;
        }
        const previous = this.s.recruitmentRequest;
        const request = { type, barracksId, zone: this.zoneId };
        const price = this.recruitmentRequestPrice(request);
        if (this.hero.gold >= price) {
          // Selecting another recruit replaces the unpaid request only on success.
          this.s.recruitmentRequest = null;
          const success = barracksId === null ? this.recruit(type) : this.train(barracksId, type);
          if (!success) this.s.recruitmentRequest = previous;
          return success;
        }
        this.s.recruitmentRequest = request;
        this.say(
          (type === 'archer' ? 'Ranger' : 'Soldier') +
            ' recruitment queued. Tap the same choice to cancel.',
        );
        return true;
      }
      resolveRecruitmentRequest() {
        const request = this.s.recruitmentRequest;
        if (!request || this.hero.hp <= 0 || this.s.challenge.pending || this.s.challenge.gameOver)
          return false;
        if (this.hero.gold < this.recruitmentRequestPrice(request)) return false;
        const reason = this.companionRecruitmentReason(request.type, request.barracksId, {
          completeRequest: true,
          zone: request.zone,
        });
        if (reason) return false;
        const price = this.recruitmentRequestPrice(request);
        if (!this.spend(price)) return false;
        const b =
          request.barracksId === null
            ? null
            : this.s.zones[request.zone].buildings.find((b) => b.id === request.barracksId);
        const cap = b ? this.barracksFieldCap(b) : this.expeditionPartyCap();
        const point = this.safe(this.hero.x + 50, this.hero.y + 50);
        const u = this.unit(request.type, point.x, point.y);
        u.active = this.activeParty().length < cap;
        this.s.recruitmentRequest = null;
        this.s.party.push(u);
        const label = request.type === 'archer' ? 'Ranger' : 'Soldier';
        const destination = u.active
          ? 'Joined your active group.'
          : 'Active group full. Resting in reserve.';
        this.say(label + ' recruited. ' + destination);
        this.notice(label + ' recruited', 4, destination, 'feedback');
        this.event('companionRecruitment', { companionId: u.id, active: u.active });
        return true;
      }
      briefCompanions() {
        const tutorial = this.s.quests['quest-barracks'];
        if (tutorial && !tutorial.paid) tutorial.captainBriefed = true;
      }
      briefBarracks() {
        const tutorial = this.s.quests['quest-barracks'];
        if (tutorial && !tutorial.paid && tutorial.recallPracticed) tutorial.barracksBriefed = true;
      }
      recruit(type) {
        const reason = this.companionRecruitmentReason(type);
        if (reason) {
          this.say(reason);
          return false;
        }
        if (!this.spend(this.recruitPrice(type))) return false;
        const p = this.safe(this.hero.x + 50, this.hero.y + 50),
          u = this.unit(type, p.x, p.y);
        u.active = this.activeParty().length < this.expeditionPartyCap();
        this.s.party.push(u);
        return true;
      }
      companionCarePrice(kind) {
        return kind === 'recovery'
          ? this.companionRecoveryCost()
          : kind === 'treatment'
            ? this.companionTreatmentCost()
            : 0;
      }
      companionCareTargets(kind, request) {
        const ids = new Set(request?.companionIds || []);
        return this.s.party.filter(
          (u) =>
            ids.has(u.id) &&
            (kind === 'recovery' ? u.hp <= 0 : kind === 'treatment' && u.hp > 0 && u.hp < u.maxHp),
        );
      }
      companionCareHeroWounded(kind, request) {
        return kind === 'treatment' && request?.heroWounded === true &&
          this.hero.hp > 0 && this.hero.hp < this.hero.maxHp;
      }
      companionCareCandidate(kind, barracksId = null, companionId = null) {
        const units =
          kind === 'recovery'
            ? [
                companionId
                  ? this.s.party.find((u) => u.id === companionId)
                  : this.s.party.find((u) => u.hp <= 0),
              ].filter(Boolean)
            : this.s.party.filter((u) => u.hp > 0 && u.hp < u.maxHp);
        return {
          companionIds: units.map((u) => u.id),
          ...(kind === 'treatment'
            ? { heroWounded: this.hero.hp > 0 && this.hero.hp < this.hero.maxHp }
            : {}),
          barracksId,
          zone: this.zoneId,
        };
      }
      companionCareReason(kind, request, options = {}) {
        if (!['recovery', 'treatment'].includes(kind)) return 'Choose recovery or treatment.';
        const targets = this.companionCareTargets(kind, request);
        if (!targets.length && !this.companionCareHeroWounded(kind, request))
          return kind === 'recovery'
            ? 'No requested companion is still fallen.'
            : 'No requested party member is still wounded.';
        if (targets.some((u) => u.expeditionId))
          return 'A requested companion is away on a resource expedition.';
        const serviceReason = this.companionServiceReason();
        if (serviceReason) return serviceReason;
        if (options.checkSource) {
          const sourceReason = this.companionServiceSourceReason(request.barracksId, request.zone);
          if (sourceReason) return sourceReason;
        }
        if (!options.ignoreFunds && this.hero.gold < this.companionCarePrice(kind))
          return 'Not enough crowns for companion care.';
        return '';
      }
      cancelCompanionCareRequest(kind, unnecessary = false) {
        if (!this.s.companionCareRequests[kind]) return false;
        this.s.companionCareRequests[kind] = null;
        const message = unnecessary
          ? 'Queued companion care is no longer needed. No crowns were spent.'
          : 'Queued companion care cancelled. No crowns were spent.';
        this.say(message);
        if (unnecessary) this.notice(message, 3.5, '', 'feedback');
        this.event('companionQueueChanged', { kind });
        return true;
      }
      requestCompanionCare(kind, barracksId = null, companionId = null) {
        if (!['recovery', 'treatment'].includes(kind)) return false;
        const previous = this.s.companionCareRequests[kind];
        if (previous && (!companionId || previous.companionIds.includes(companionId)))
          return this.cancelCompanionCareRequest(kind);
        const request = this.companionCareCandidate(kind, barracksId, companionId);
        const reason = this.companionCareReason(kind, request, {
          ignoreFunds: true,
          checkSource: true,
        });
        if (reason) {
          this.say(reason);
          return false;
        }
        if (this.hero.gold >= this.companionCarePrice(kind)) {
          const success =
            kind === 'recovery'
              ? this.recover(request.companionIds[0])
              : this.treatCompanions(request.companionIds, request.heroWounded === true);
          if (success) this.s.companionCareRequests[kind] = null;
          return success;
        }
        this.s.companionCareRequests[kind] = request;
        this.say(
          kind === 'recovery'
            ? 'Companion recovery queued. Tap the same choice to cancel.'
            : 'Companion treatment queued. Tap the same choice to cancel.',
        );
        return true;
      }
      resolveCompanionCareRequests() {
        // Preserve the company first when multiple services become affordable.
        for (const kind of ['recovery', 'treatment']) {
          const request = this.s.companionCareRequests[kind];
          if (!request) continue;
          if (
            !this.companionCareTargets(kind, request).length &&
            !this.companionCareHeroWounded(kind, request)
          ) {
            this.cancelCompanionCareRequest(kind, true);
            continue;
          }
          if (
            this.hero.gold < this.companionCarePrice(kind) ||
            this.companionCareReason(kind, request, { checkSource: true })
          )
            continue;
          const success =
            kind === 'recovery'
              ? this.recover(request.companionIds[0])
              : this.treatCompanions(request.companionIds, request.heroWounded === true);
          if (success) this.s.companionCareRequests[kind] = null;
        }
      }
      recover(companionId = null) {
        const request = this.companionCareCandidate('recovery', null, companionId);
        const reason = this.companionCareReason('recovery', request);
        if (reason) {
          this.say(reason);
          return false;
        }
        const dead = this.companionCareTargets('recovery', request)[0];
        if (!this.spend(this.companionRecoveryCost())) return false;
        const id = dead.id,
          active = dead.active !== false,
          charmOrigin = dead.charmOrigin ? { ...dead.charmOrigin } : null,
          p = this.safe(this.hero.x + 40, this.hero.y),
          u = this.unit(dead.type, p.x, p.y, dead.petFamily);
        if (charmOrigin) {
          u.charmOrigin = charmOrigin;
          u.name = charmOrigin.typeName;
          u.icon = dead.icon;
          u.damage = this.charmedCompanionProfile(u).damage;
          u.charmSupportCd = 0;
          u.maxHp = this.companionMaxHp(u);
          u.hp = u.maxHp;
          u.customName = dead.customName;
        }
        this.clearPartyCharge(dead);
        this.clearCompanionJudgment(dead);
        this._partyChargeRecovery?.delete(dead);
        this.tacticalClearScatter(dead);
        Object.assign(dead, u, { id, active, slow: 0 });
        delete dead.slowStacks;
        delete dead.rogueSlow;
        this.say('Companion recovered.');
        this.notice('Companion recovered', 4, this.companionDisplayName(dead), 'feedback');
        this.event('companionRecovery', { companionId: id });
        return true;
      }
      treatCompanions(companionIds = null, heroWounded = false) {
        const request = this.companionCareCandidate('treatment');
        if (companionIds !== null) {
          request.companionIds = companionIds;
          request.heroWounded = heroWounded === true;
        }
        const reason = this.companionCareReason('treatment', request);
        if (reason) {
          this.say(reason);
          return false;
        }
        const wounded = this.companionCareTargets('treatment', request);
        const healHero = this.companionCareHeroWounded('treatment', request);
        if (!this.spend(this.companionTreatmentCost())) return false;
        if (healHero) {
          this.hero.hp = this.hero.maxHp;
          this.event('heal', { x: this.hero.x, y: this.hero.y, resource: 'health', target: 'hero' });
        }
        for (const u of wounded) {
          u.hp = u.maxHp;
          this.event('heal', { x: u.x, y: u.y, resource: 'health', target: u.id });
        }
        this.say('Party wounds treated. Fallen companions still require recovery.');
        this.notice(
          'Wounds treated',
          4,
          'Hero and wounded living companions restored to full health.',
          'feedback',
        );
        return true;
      }
      isCharmedCompanion(u) {
        const origin = u?.charmOrigin,
          receipt = this.s.charmCaptures?.[u?.id];
        return !!origin && !!receipt &&
          Object.keys(origin).length === 6 &&
          Object.keys(receipt).length === 6 &&
          Object.keys(origin).every((key) => receipt[key] === origin[key]) &&
          origin.role === u.type &&
          !!this.charmedCompanionProfile(u);
      }
      canGatherTribute(u) {
        return (
          !!u &&
          (!u.charmOrigin || this.isCharmedCompanion(u)) &&
          (['soldier', 'archer'].includes(u.type) ||
            (u.type === 'pet' && u.petFamily === R.gatheringTravel.petWorkerFamily))
        );
      }
      availableGatherers() {
        return this.activeLivingParty().filter((u) => this.canGatherTribute(u) && !u.order);
      }
      availableLabor() {
        return this.activeLivingParty().filter(
          (u) => ['soldier', 'archer'].includes(u.type) &&
            (!u.charmOrigin || this.isCharmedCompanion(u)) && !u.order,
        );
      }
      companionRestReason(id) {
        const u = this.s.party.find((u) => u.id === id);
        if (!u) return 'This companion is no longer in your company. Reopen Manage active group.';
        if (u.active === false) return 'This companion is already resting in reserve.';
        if (this.refugeThreat())
          return 'Cannot rest a companion while nearby enemies are engaged. Retreat and end the fight first.';
        return '';
      }
      restCompanion(id) {
        const reason = this.companionRestReason(id);
        if (reason) {
          this.say(reason);
          return false;
        }
        const u = this.s.party.find((u) => u.id === id);
        this.clearPartyCharge(u);
        this.clearCompanionJudgment(u);
        u.active = false;
        u.order = null;
        u.path = [];
        return true;
      }
      companionActivationReason(id, barracksId) {
        const u = this.s.party.find((u) => u.id === id && u.active === false),
          b = this.zone().buildings.find((b) => b.id === barracksId && b.progress >= 4);
        if (!u)
          return 'This companion is no longer resting in reserve. Reopen Manage active group.';
        if (!b) return 'Adding a companion requires a completed local Barracks.';
        if (u.expeditionId) return 'This companion is away on a resource expedition.';
        if (u.hp <= 0) return 'This companion has fallen. Recover them at the Barracks first.';
        if (this.refugeThreat())
          return 'Cannot add a companion while nearby enemies are engaged. Retreat and end the fight first.';
        if (this.activeParty().length >= this.barracksFieldCap(b)) {
          const count = this.activeParty().length,
            cap = this.barracksFieldCap(b),
            needed = count - cap + 1;
          return (
            'Active group full (' +
            count +
            '/' +
            cap +
            '). Rest ' +
            needed +
            ' active member' +
            (needed === 1 ? '' : 's') +
            ' in Manage active group to make room here. Fallen active companions also use slots.'
          );
        }
        return '';
      }
      activateCompanion(id, barracksId) {
        const reason = this.companionActivationReason(id, barracksId);
        if (reason) {
          this.say(reason);
          return false;
        }
        const u = this.s.party.find((u) => u.id === id),
          b = this.zone().buildings.find((b) => b.id === barracksId);
        u.active = true;
        this.clearCompanionJudgment(u);
        Object.assign(u, this.safe(b.x + 45, b.y + 45));
        u.order = null;
        return true;
      }
      dismissCompanion(id) {
        const i = this.s.party.findIndex((u) => u.id === id && u.active === false);
        if (i < 0) return false;
        if (this.s.party[i].expeditionId) {
          this.say('This companion is away on a resource expedition. Wait for their return.');
          return false;
        }
        if (this.s.party[i].type === 'pet') {
          this.say('Boss pets stay in your collection. Rest them or recover them at a Barracks.');
          return false;
        }
        const dismissed = this.s.party.splice(i, 1)[0];
        if (dismissed.charmOrigin && this.s.charmCaptures)
          delete this.s.charmCaptures[dismissed.id];
        return true;
      }
      squadDefaultDoctrine() {
        return this.hero.class === 'paladin' ? 'focus' : 'guard';
      }
      squadThreats() {
        // The existing hero-centered encounter radius stays intact, but an
        // active ranged ally can recognize an already-engaged visible foe
        // throughout its *own* basic firing reach even beyond that radius.
        // Never enlist idle monsters, benched units or gathering assignments.
        const rangedAllies = this.activeLivingParty().filter(
          (u) =>
            !u.order &&
            (u.type === 'archer' ||
              (u.type === 'pet' && this.petDefinition(u)?.role === 'ranged')),
        );
        return this.zone().enemies.filter(
          (e) =>
            e.hp > 0 &&
            !e.neutral &&
            !e.returning &&
            this.tacticalDirectTargetable(e) &&
            e.aggro &&
            (dist(e, this.hero) < (e.type === 'boss' || e.summon ? 720 : 540) ||
              rangedAllies.some(
                (u) => dist(e, u) <= this.companionCombatReach(u) && this.line(u, e),
              )),
        );
      }
      squadContext() {
        const threats = this.squadThreats(),
          liveBosses = this.zone().enemies.filter(
            (e) =>
              e.type === 'boss' &&
              e.hp > 0 &&
              !e.neutral &&
              !e.returning &&
              this.tacticalDirectTargetable(e),
          ),
          bossEnemy =
            liveBosses
              .filter(
                (e) =>
                  threats.includes(e) ||
                  // If a boss briefly drops aggro during its summon phase,
                  // retain that encounter and obey a manual BOSS order.
                  (this.s.squadEngagement === 'boss' &&
                    dist(e, this.hero) < 720 &&
                    threats.some((x) => x.summon && x.owner === e.id)),
              )
              .sort((a, b) => dist(a, this.hero) - dist(b, this.hero))[0] || null;
        // Temporary dust cover blocks selection, not the ongoing encounter.
        // Keep a manual doctrine when the last active foe is briefly covered.
        const coveredThreat = this.zone().enemies.some(
          (e) =>
            e.hp > 0 &&
            !e.neutral &&
            !e.returning &&
            e.aggro &&
            !this.tacticalDirectTargetable(e) &&
            dist(e, this.hero) < (e.type === 'boss' || e.summon ? 720 : 540),
        );
        return {
          engaged: threats.length > 0 || coveredThreat,
          boss: !!bossEnemy,
          bossEnemy,
          threats,
        };
      }
      syncSquadDoctrine() {
        const context = this.squadContext(),
          phase = context.engaged ? (context.boss ? 'boss' : 'field') : null;
        if (!phase) {
          if (this.s.squadEngagement) {
            this.s.squadEngagement = null;
            this.s.squadBoss = false;
            this.s.squadDoctrine = this.squadDefaultDoctrine();
            this.s.heroTarget = null;
          }
          return context;
        }
        if (this.s.squadEngagement !== phase) {
          // Keep an explicit doctrine choice for the whole continuous encounter,
          // even if an adds-only phase briefly loses sight of its boss.
          const enteringCombat = !this.s.squadEngagement;
          this.s.squadEngagement = phase;
          this.s.squadBoss = context.boss;
          if (enteringCombat) this.s.squadDoctrine = this.squadDefaultDoctrine();
        }
        return context;
      }
      toggleSquadDoctrine() {
        if ((this.s.expeditionRank || 1) < 3) return false;
        const context = this.syncSquadDoctrine();
        if (!context.engaged) return false;
        // An explicit combat-doctrine switch during an ongoing encounter is
        // a new engagement order; Recall itself remains defensive until then.
        this.releaseRecallForCombat();
        this.s.squadDoctrine = this.s.squadDoctrine === 'focus' ? 'guard' : 'focus';
        this.event('squadDoctrine', { mode: this.s.squadDoctrine, boss: context.boss });
        return true;
      }
      squadDoctrineLabel() {
        const context = this.syncSquadDoctrine();
        return {
          active: context.engaged,
          boss: context.boss,
          mode: this.s.squadDoctrine,
          label: context.boss
            ? this.s.squadDoctrine === 'focus'
              ? 'BOSS'
              : 'ADDS'
            : this.s.squadDoctrine === 'focus'
              ? 'TARGET'
              : 'THREATS',
        };
      }
      recallParty() {
        const tutorial = this.s.quests['quest-barracks'];
        if (tutorial && !tutorial.paid && this.activeLivingParty().length)
          tutorial.recallPracticed = true;
        this.cancelRangerHealRequest();
        if (
          this.s.recallActive &&
          this.activeLivingParty().every((u) => !u.order && !this.partyChargeState(u))
        )
          return true;
        const gathering = this.activeLivingParty().filter((u) => this.gatheringUnit(u));
        this._gatherRecallResume = gathering.length
          ? { zone: this.zoneId, ids: gathering.map((u) => u.id) }
          : null;
        this.s.recallActive = true;
        if (this.hero.order?.type !== 'move') this.hero.order = null;
        this._tacticalPartyTargets?.clear();
        for (const u of this.activeLivingParty()) {
          this.clearCompanionJudgment(u);
          this.clearGatheringIntent(u);
          this.clearPartyCharge(u);
          u.order = null;
          u.path = [];
          u.routeAge = 0;
        }
        this.say('Squad recalled. Companions are regrouping on the hero.');
        this.notice('Companions recalled · retreat protection active.', 2.8, '', 'feedback');
        this.event('squadRecall');
        return true;
      }
      partyFormationOffset(u, living = this.activeLivingParty()) {
        const rangedHero = ['mage', 'ranger', 'rogue'].includes(this.hero.class);
        if (u.type === 'pet') {
          // Keep distinct mixed-pet lanes: melee pets screen a ranged hero and
          // flank behind a Paladin; ranged pets remain behind either hero role.
          const pets = living.filter((v) => v.type === 'pet' && !v.order);
          const i = Math.max(0, pets.indexOf(u));
          const side = i % 2 ? 1 : -1;
          const row = Math.floor(i / 2),
            cfg = R.balance.companions.petFormation,
            role = this.petDefinition(u)?.role === 'ranged' ? 'ranged' : 'melee',
            forward = (rangedHero ? cfg.rangedHero : cfg.meleeHero)[role];
          return [
            side * (cfg.side + row * cfg.sidePerRow),
            forward + Math.sign(forward) * row * cfg.forwardPerRow,
          ];
        }
        const same = living.filter((v) => v.type === u.type && !v.order),
          index = Math.max(
            0,
            same.findIndex((v) => v.id === u.id),
          );
        const ranged = {
            archer: [
              [-34, -24],
              [34, -24],
              [0, -52],
              [-62, -45],
              [62, -45],
              [0, -78],
              [0, -225], // Seventh same-type actor: never recycle the first slot.
            ],
            soldier: [
              [0, 95],
              [-90, 45],
              [90, 45],
              [-110, -25],
              [110, -25],
              [0, -105],
              [0, 165],
            ],
          },
          melee = {
            soldier: [
              [-42, -20],
              [42, -20],
              [0, -55],
              [-68, -50],
              [68, -50],
              [0, 35],
              [0, 105],
            ],
            archer: [
              [-65, -115],
              [65, -115],
              [0, -145],
              [-105, -145],
              [105, -145],
              [0, -175],
              [0, -235],
            ],
          },
          slots = (rangedHero ? ranged : melee)[u.type] || [[0, -100]];
        return slots[index % slots.length];
      }
      partyFollowPoint(u, living = this.activeLivingParty()) {
        const [side, forward] = this.partyFormationOffset(u, living),
          heading = this.formationHeading || { x: 0, y: 1 },
          n = Math.hypot(heading.x, heading.y) || 1,
          fx = heading.x / n,
          fy = heading.y / n,
          rx = -fy,
          ry = fx,
          p = {
            x: this.hero.x + fx * forward + rx * side,
            y: this.hero.y + fy * forward + ry * side,
          };
        try {
          return this.blocked(p.x, p.y) ? this.safe(this.hero.x, this.hero.y) : p;
        } catch (_) {
          return this.hero;
        }
      }
      followPartyMember(u, living, dt) {
        const d = dist(u, this.hero),
          speed =
            this.companionRallyMoveSpeed(u, d > 650 ? 500 : d > 350 ? 390 : d > 200 ? 315 : 255) *
            this.slowMovementFactor(u) *
            this.mireBogMovementFactor(u) *
            this.ashMovementFactor(u);
        return this.follow(u, this.partyFollowPoint(u, living), speed, dt, 45);
      }
      soldierScreenTarget(u, targets, living, claimed) {
        const protectedUnits = [
            this.hero,
            ...living.filter(
              (v) =>
                (v.type === 'archer' ||
                  (v.type === 'pet' && this.petDefinition(v)?.role === 'ranged')) &&
                !v.order,
            ),
          ],
          pressure = (e) => Math.min(...protectedUnits.map((p) => dist(e, p))),
          band = (e) => (pressure(e) < 150 ? 0 : pressure(e) < 280 ? 1 : 2);
        return (
          targets
            .filter((e) => dist(u, e) < 620)
            .sort(
              (a, b) =>
                band(a) - band(b) ||
                (claimed.has(a.id) ? 1 : 0) - (claimed.has(b.id) ? 1 : 0) ||
                pressure(a) - pressure(b) ||
                dist(a, u) - dist(b, u),
            )[0] || null
        );
      }
      archerCombatPoint(u, e, living) {
        const anchor = this.partyFollowPoint(u, living),
          // Do not let short-ranged species choose a preferred point outside reach.
          preferred = Math.min(250, Math.max(110, this.companionCombatReach(u) - 35)),
          anchorRange = dist(anchor, e);
        if (anchorRange <= this.companionCombatReach(u) && this.line(anchor, e)) return anchor;
        const dx = anchor.x - e.x,
          dy = anchor.y - e.y,
          n = Math.hypot(dx, dy) || 1,
          p = { x: e.x + (dx / n) * preferred, y: e.y + (dy / n) * preferred };
        try {
          return this.blocked(p.x, p.y) ? this.safe(p.x, p.y) : p;
        } catch (_) {
          return anchor;
        }
      }
      archerFallbackPoint(u, e, living) {
        const anchor = this.partyFollowPoint(u, living),
          d = dist(anchor, e);
        if (d >= 190) return anchor;
        const dx = anchor.x - e.x,
          dy = anchor.y - e.y,
          n = Math.hypot(dx, dy) || 1,
          p = { x: anchor.x + (dx / n) * (190 - d + 55), y: anchor.y + (dy / n) * (190 - d + 55) };
        try {
          return this.blocked(p.x, p.y) ? anchor : p;
        } catch (_) {
          return anchor;
        }
      }
      companionFight(u, e, living, dt) {
        this._tacticalPartyTargets.set(u.id, e.id);
        const monster = this.charmedCompanionProfile(u);
        if (u.type === 'pet') {
          this.updatePetCombat(u, e, living, dt);
          return;
        }
        if (u.type === 'archer') {
          const d = dist(u, e),
            visible = this.line(u, e),
            anchor = this.partyFollowPoint(u, living);
          if (d < (monster?.retreat ?? 150)) {
            // Veteran Rangers can cover a retreat with their existing Triple Shot.
            // Still move this frame; never trade the fallback for standing fire.
            this.companionCoveringShot(u, e);
            this.follow(
              u,
              this.archerFallbackPoint(u, e, living),
              this.companionRallyMoveSpeed(u, 270) *
                this.slowMovementFactor(u) *
                this.mireBogMovementFactor(u) *
                this.ashMovementFactor(u),
              dt,
              35,
            );
            return;
          }
          if (d > this.companionCombatReach(u) || !visible) {
            this.follow(
              u,
              this.archerCombatPoint(u, e, living),
              this.companionRallyMoveSpeed(u, 260) *
                this.slowMovementFactor(u) *
                this.mireBogMovementFactor(u) *
                this.ashMovementFactor(u),
              dt,
              35,
            );
            return;
          }
          if (
            dist(u, anchor) > 70 &&
            dist(anchor, e) <= this.companionCombatReach(u) &&
            this.line(anchor, e)
          ) {
            this.follow(
              u,
              anchor,
              this.companionRallyMoveSpeed(u, 245) *
                this.slowMovementFactor(u) *
                this.mireBogMovementFactor(u) *
                this.ashMovementFactor(u),
              dt,
              35,
            );
            return;
          }
          if (this.companionTrySkill(u, e)) return;
          if (u.cd <= 0) {
            u.cd = this.companionBasicInterval(u) / this.companionRallyAttackSpeed(u);
            const criticalReceipt = this.troopCriticalRelease(u, 'basic');
            const shot = Math.max(1, d);
            this.s.projectiles.push({
              id: 'projectile-' + this.s.nextId++,
              x: u.x,
              y: u.y,
              dx: (e.x - u.x) / shot,
              dy: (e.y - u.y) / shot,
              target: e.id,
              damage: this.troopCriticalDamage(criticalReceipt, this.companionBasicAttackDamage(u)),
              source: u.id,
              ...(criticalReceipt ? { criticalExecution: criticalReceipt } : {}),
              speed: this.charmedCompanionProfile(u)?.shotSpeed || 450,
              style: this.charmedCompanionProfile(u)?.style || 'arrow',
            });
            this.event('projectileLaunch', {
              actor: 'companion',
              role: 'archer',
              source: u.id,
              style: this.charmedCompanionProfile(u)?.style || 'arrow',
              x: u.x,
              y: u.y,
              target: e.id,
            });
          }
          return;
        }
        if (u.type !== 'soldier') return;
        if (this.line(u, e) && dist(u, e) <= 185 && this.companionTrySkill(u, e)) return;
        if (dist(u, e) > this.companionCombatReach(u) || !this.line(u, e))
          this.follow(
            u,
            e,
            this.companionRallyMoveSpeed(u, 250) *
              this.slowMovementFactor(u) *
              this.mireBogMovementFactor(u) *
              this.ashMovementFactor(u),
            dt,
            this.line(u, e) ? 55 : 0,
          );
        else if (u.cd <= 0) {
          u.cd = this.companionBasicInterval(u) / this.companionRallyAttackSpeed(u);
          const criticalReceipt = this.troopCriticalRelease(u, 'basic');
          if (this.damage(e, this.troopCriticalDamage(
            criticalReceipt, this.companionBasicAttackDamage(u),
          ), u.id))
            this.event('melee', {
              actor: 'companion',
              role: 'soldier',
              source: u.id,
              weapon: u.charmOrigin ? 'claw' : 'sword',
              x: e.x,
              y: e.y,
              target: e.id,
            });
        }
      }
      updateParty(dt, performanceMark = null) {
        this.updateCompanionHeroGuidance();
        performanceMark?.('partyGuidanceEnd');
        const z = this.zone(),
          living = this.activeLivingParty(),
          context = this.syncSquadDoctrine(),
          claimed = new Set();
        const returningLabor = this._gatherRecallResume;
        if (returningLabor && (!this.s.recallActive || returningLabor.zone !== this.zoneId))
          this._gatherRecallResume = null;
        else if (returningLabor && !this.recallInProgress()) {
          this.s.recallActive = false;
          this._gatherRecallResume = null;
        }
        // Pending casts cannot survive removal, a zone change, death or benching.
        for (const [id, cast] of this._companionCharges || []) {
          if (
            cast.zone !== this.zoneId ||
            !this.s.party.includes(cast.unit) ||
            cast.unit.hp <= 0 ||
            cast.unit.active === false
          ) {
            this._companionCharges.delete(id);
            this.clearPartyCharge(cast.unit);
          }
        }
        // Target intent is transient: active selection, not proximity or party size.
        this._tacticalPartyTargets = new Map();
        for (const u of living)
          if (
            context.engaged &&
            u.type === 'soldier' && !u.charmOrigin &&
            u.hp <= u.maxHp * 0.5 &&
            !this.mageSilenceActive(u) &&
            (u.survivalCd || 0) <= 0
          ) {
            // This survival trigger is its own action: no basic-attack roll,
            // no new activation, no cooldown or immunity bypass.
            const guardReceipt = this.troopCriticalRelease(u, 'guard');
            u.survivalCd = 14;
            const protection = guardReceipt?.critical
              ? this._criticalPartyNative.enhance(guardReceipt, 2.5, 'guardDuration', { max: 3 })
              : 2.5;
            u.immune = Math.max(u.immune || 0, protection);
            this.event('spell', { x: u.x, y: u.y, target: u.id, kind: 'soldierGuard' });
          }
        // Recall is a standing defensive order. Reaching formation never
        // silently authorizes companions to re-enter the previous fight.
        const crowdTarget = (u, targets) =>
          targets
            .filter((e) => dist(u, e) < 620)
            .sort(
              (a, b) =>
                (claimed.has(a.id) ? 1 : 0) - (claimed.has(b.id) ? 1 : 0) ||
                dist(a, this.hero) - dist(b, this.hero) ||
                dist(a, u) - dist(b, u),
            )[0] || null;
        performanceMark?.('partySetupEnd');
        for (const u of living) {
          const recovery = this.cooldownRecoveryElapsed(u, dt);
          const specialRecovery = this.cooldownRecoveryElapsed(u, dt, false, true);
          u.slow = Math.max(0, (u.slow || 0) - dt);
          if (!u.slow) delete u.slowStacks;
          if (u.rogueSlow > 0) {
            u.rogueSlow = Math.max(0, u.rogueSlow - dt);
            if (!u.rogueSlow) delete u.rogueSlow;
          }
          u.cd = Math.max(0, u.cd - recovery);
          u.skill1Cd = Math.max(0, (u.skill1Cd || 0) - specialRecovery);
          u.skill2Cd = Math.max(0, (u.skill2Cd || 0) - specialRecovery);
          u.skillGlobalCd = Math.max(0, (u.skillGlobalCd || 0) - specialRecovery);
          if (u.charmOrigin)
            u.charmSupportCd = Math.max(0, (u.charmSupportCd || 0) - specialRecovery);
          // Thornfang scatter overrides orders, doctrine and combat until
          // forced movement ends; then the unit resumes its normal assignment.
          if (u.deathRollHeld || u.keeperHeld || this.tacticalAdvanceScatter(u, dt)) {
            if (this._companionCharges?.has(u.id)) {
              this._companionCharges.delete(u.id);
              this.clearPartyCharge(u);
            }
            continue;
          }
          // Run the existing judgment early for critical wounds, so a cast or
          // job cannot hide danger. No independent recovery state or HP gate.
          if (this.companionSurvivalMode(u)) {
            const threat =
              this.companionSurvivalThreats()
                .filter(
                  (e) =>
                    dist(u, e) <= e.r ||
                    dist(this.hero, e) <= e.r + R.companionJudgment.criticalFollowRadius,
                )
                .sort((a, b) => dist(u, a) - dist(u, b))[0]?.enemy ||
              (this.companionAreaDanger(u) ? { id: 'environment-danger', x: u.x, y: u.y } : null);
            if (threat) {
              if (this.companionCautiousCombat(u, threat, living, dt)) continue;
            } else {
              this.clearCompanionJudgment(u);
              this.clearPartyCharge(u);
            }
          }
          const pending = this._companionCharges?.get(u.id);
          if (pending) {
            const observation = this.partyChargeState(u);
            if (
              pending.unit !== u ||
              !observation ||
              observation.interrupted ||
              this.mageSilenceActive(u)
            ) {
              this._companionCharges.delete(u.id);
              this.clearPartyCharge(u);
              continue;
            }
            // Resolution belongs after enemy/projectile/trap damage in tick().
            // Waiting here prevents another skill or basic during preparation.
            continue;
          }
          if (u.type === 'pet' && !this.canGatherTribute(u)) u.order = null;
          if (u.order?.type === 'build') {
            const b = z.buildings.find((b) => b.id === u.order.id);
            if (b && b.progress < 4) {
              if (dist(u, b) > 85)
                this.follow(
                  u,
                  b,
                  this.companionRallyMoveSpeed(u, 230) *
                    this.slowMovementFactor(u) *
                    this.mireBogMovementFactor(u) *
                    this.ashMovementFactor(u),
                  dt,
                  70,
                );
              else {
                b.progress = Math.min(4, b.progress + dt);
                if (b.progress >= 4) {
                  u.order = null;
                  this.say('Barracks construction complete.');
                  if (b.recoveryOnComplete) this.setBarracksRespawn(b.id);
                  this.event('construction', { id: b.id });
                  this.checkQuests();
                }
              }
            } else u.order = null;
            continue;
          }
          if (u.order?.type === 'upgrade') {
            const b = z.buildings.find((b) => b.id === u.order.id);
            if (b && b.progress >= 4 && !b.full && b.upgradePaid) {
              if (dist(u, b) > 85)
                this.follow(
                  u,
                  b,
                  this.companionRallyMoveSpeed(u, 230) *
                    this.slowMovementFactor(u) *
                    this.mireBogMovementFactor(u) *
                    this.ashMovementFactor(u),
                  dt,
                  70,
                );
              else {
                b.upgradeProgress = Math.min(4, (b.upgradeProgress || 0) + dt);
                if (b.upgradeProgress >= 4) {
                  b.full = true;
                  b.upgradeProgress = 4;
                  u.order = null;
                  this.say('Full barracks ready.');
                  this.event('barracksUpgrade', { id: b.id });
                }
              }
            } else u.order = null;
            continue;
          }
          if (u.order?.type === 'deposit') {
            const journey = (u.order.journey ||= {
                returning: false,
                points: [{ x: u.x, y: u.y }],
              }),
              last = journey.points.at(-1);
            if (last && dist(last, u) >= 20 && journey.points.length < 512)
              journey.points.push({ x: u.x, y: u.y });
          }
          if (this.gatheringUnit(u)) {
            const enemy = this.gatheringEncounter(u);
            if (enemy) {
              if (this.companionCautiousCombat(u, enemy, living, dt)) {
                if (u.order.type === 'deposit') {
                  const trip = depositTrips.get(u);
                  if (trip?.site) {
                    deliveryAvoidance.set(u, {
                      zone: this.zoneId,
                      point: { x: trip.site.x, y: trip.site.y },
                      until: this.s.time + R.gatheringTravel.retryDestinationSeconds,
                    });
                    depositTrips.delete(u);
                  }
                }
              } else {
                this.engage(enemy);
                this._tacticalPartyTargets.set(u.id, enemy.id);
                this.companionFight(u, enemy, living, dt);
              }
              continue;
            }
            this.clearCompanionJudgment(u);
            if (this.returnFromDelivery(u, living, dt)) continue;
          }
          if (u.order?.type === 'gather') {
            this.gatheringCounterattack(u);
            const n = z.nodes.find((n) => n.id === u.order.id);
            if (n?.tribute && !this.tributeKnown(n)) {
              if (!u.order.scouting || !n.concealedTribute || z.id !== 'highlands') {
                u.order =
                  u.carry > 1e-7 ? { type: 'deposit', id: n.id, group: n.resourceGroup } : null;
                continue;
              }
              if (dist(u, n) > R.highlandsTribute.searchRadius || !this.line(u, n)) {
                this.followCompanion(u, n, this.laborMoveSpeed(u), dt, 30, false);
                continue;
              }
              this.locateTribute(n);
            }
            if (u.order?.scouting) delete u.order.scouting;
            if (n && n.amount > 0 && (!n.mini || this.peace || this.miniCleared(n.mini))) {
              if (dist(u, n) > 60)
                this.followCompanion(
                  u,
                  n,
                  this.companionRallyMoveSpeed(u, 230) *
                    this.slowMovementFactor(u) *
                    this.mireBogMovementFactor(u) *
                    this.ashMovementFactor(u),
                  dt,
                  45,
                  false,
                );
              else {
                const amount = Math.min(
                  n.amount,
                  R.gatheringTravel.harvestPerSecond * dt,
                  Math.max(0, this.gatheringCapacity() - u.carry),
                );
                n.amount = Math.max(0, n.amount - amount);
                u.carry += amount;
                this.s.gathered[this.definition().id] =
                  (this.s.gathered[this.definition().id] || 0) + amount;
              }
              if (this.s.gatheringTarget?.id === n.id && n.amount <= 0)
                this.s.gatheringTarget = null;
              if (u.carry >= this.gatheringCapacity() - 1e-7 || n.amount <= 0)
                u.order = { type: 'deposit', id: n.id, group: n.resourceGroup };
            } else
              u.order =
                u.carry > 1e-7 ? { type: 'deposit', id: u.order.id, group: u.order.group } : null;
            continue;
          }
          if (u.order?.type === 'deposit') {
            this.gatheringCounterattack(u);
            const journey = u.order.journey;
            const deposit = this.depositSite(u);
            if (!deposit) {
              this.laborRegroup(u, living, dt);
              continue;
            }
            if (dist(u, deposit) > 130)
              this.followCompanion(u, deposit, this.laborMoveSpeed(u), dt, 110);
            else {
              this.depositTributeCargo([u]);
              const source = z.nodes.find((n) => n.id === u.order.id && n.amount > 0);
              u.order = source
                ? {
                    ...u.order,
                    type: 'gather',
                    journey: { returning: true, points: journey.points.slice().reverse() },
                  }
                : null;
              depositTrips.delete(u);
              this.clearCompanionTravel(u);
            }
            continue;
          }
          if (u.order) u.order = null;
          if (this.peace || this.s.recallActive) {
            // Recall is a defensive escort posture: no target acquisition,
            // pursuit or active skills. A nearby attacking enemy may be
            // counterattacked from the companion's *current* position only.
            if (this.s.recallActive) this.followRecalledCompanion(u, living, dt);
            else this.followPartyMember(u, living, dt);
            if (this.s.recallActive && !this.peace && u.cd <= 0) {
              const reach = this.companionCombatReach(u);
              const pursuer = z.enemies
                .filter(
                  (e) =>
                    e.hp > 0 &&
                    e.aggro &&
                    !e.neutral &&
                    !e.returning &&
                    dist(e, u) <= reach &&
                    dist(e, this.hero) <= 350 &&
                    this.line(u, e),
                )
                .sort((a, b) => dist(a, u) - dist(b, u) || this.idOrder(a, b))[0];
              if (pursuer) {
                // Pet defensive basic keeps pet range and effects; never Soldier fallback.
                if (u.type === 'pet') {
                  this.petDefensiveCounter(u, pursuer);
                  continue;
                }
                u.cd = this.companionBasicInterval(u) / this.companionRallyAttackSpeed(u);
                const criticalReceipt = this.troopCriticalRelease(u, 'basic');
                if (u.type === 'archer') {
                  const d = Math.max(1, dist(u, pursuer));
                  this.s.projectiles.push({
                    id: 'projectile-' + this.s.nextId++,
                    x: u.x,
                    y: u.y,
                    dx: (pursuer.x - u.x) / d,
                    dy: (pursuer.y - u.y) / d,
                    target: pursuer.id,
                    damage: this.troopCriticalDamage(criticalReceipt, this.companionBasicAttackDamage(u)),
                    source: u.id,
                    ...(criticalReceipt ? { criticalExecution: criticalReceipt } : {}),
                    speed: this.charmedCompanionProfile(u)?.shotSpeed || 450,
                    style: this.charmedCompanionProfile(u)?.style || 'arrow',
                  });
                } else if (this.damage(pursuer, this.troopCriticalDamage(
                  criticalReceipt, this.companionBasicAttackDamage(u),
                ), u.id))
                  this.event('melee', {
                    actor: 'companion',
                    role: 'soldier',
                    source: u.id,
                    weapon: u.charmOrigin ? 'claw' : 'sword',
                    x: pursuer.x,
                    y: pursuer.y,
                    target: pursuer.id,
                  });
              }
            }
            continue;
          }
          let e = null;
          if (context.engaged) {
            if (context.boss) {
              if (this.s.squadDoctrine === 'focus') e = context.bossEnemy;
              else {
                // ADDS: completely ignore boss damage while living adds need
                // clearing, then attack the boss until fresh adds appear.
                // Include this boss's summons even before they approach the hero;
                // also screen unrelated active attackers pressuring the party.
                // An explicit BOSS order above always overrides this policy.
                const adds = [
                  ...new Map(
                    [
                      ...context.threats.filter((x) => x.type !== 'boss'),
                      ...z.enemies.filter(
                        (x) =>
                          x.hp > 0 &&
                          x.summon &&
                          x.owner === context.bossEnemy.id &&
                          !x.neutral &&
                          this.tacticalDirectTargetable(x) &&
                          !x.returning,
                      ),
                    ].map((x) => [x.id, x]),
                  ).values(),
                ];
                if (adds.length) {
                  e =
                    (u.type === 'soldier'
                      ? this.soldierScreenTarget(u, adds, living, claimed)
                      : crowdTarget(u, adds)) ||
                    adds
                      .slice()
                      .sort(
                        (a, b) =>
                          (claimed.has(a.id) ? 1 : 0) - (claimed.has(b.id) ? 1 : 0) ||
                          dist(a, this.hero) - dist(b, this.hero) ||
                          dist(a, u) - dist(b, u),
                      )[0];
                } else e = context.bossEnemy;
              }
            } else if (this.s.squadDoctrine === 'focus') {
              e =
                context.threats.find((x) => x.id === this.s.heroTarget) ||
                context.threats
                  .slice()
                  .sort((a, b) => dist(a, this.hero) - dist(b, this.hero))[0] ||
                null;
            } else
              e =
                u.type === 'soldier'
                  ? this.soldierScreenTarget(u, context.threats, living, claimed)
                  : crowdTarget(u, context.threats);
          }
          if (!e) {
            this.clearCompanionJudgment(u);
            this.followPartyMember(u, living, dt);
            continue;
          }
          if (this.companionCautiousCombat(u, e, living, dt)) continue;
          claimed.add(e.id);
          this.companionFight(u, e, living, dt);
        }
        performanceMark?.('partyUnitsEnd');
        const finishRecruit = (b) => {
          if (b.queue > 0) {
            b.queue = Math.max(0, b.queue - dt);
            if (b.queue === 0) {
              const p = this.safe(b.x + 50, b.y + 50),
                type = b.queueType == null ? 'soldier' : b.queueType,
                u = this.unit(type, p.x, p.y);
              u.active = this.activeParty().length < this.barracksFieldCap(b);
              this.s.party.push(u);
              b.queueType = null;
            }
          }
        };
        for (const b of z.buildings) finishRecruit(b);
        performanceMark?.('partyBookkeepingEnd');
      }
    }
    for (const name of Object.getOwnPropertyNames(Party.prototype))
      if (name !== 'constructor')
        Object.defineProperty(
          Campaign.prototype,
          name,
          Object.getOwnPropertyDescriptor(Party.prototype, name),
        );
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeParty = api;
})(typeof window !== 'undefined' ? window : globalThis);
