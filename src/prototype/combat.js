/* Shared combat targets, damage, mana drain, segment geometry, projectiles and hazards. */
(function (root) {
  'use strict';
  function install(Campaign, { R }) {
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n)),
      dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const ROGUE_REGROUP_INCOMING_DAMAGE_MULTIPLIER = 0.5;
    // Stable field lists: stacking adds debt on Slow impact, never by iterating stacks per tick.
    const SLOW_COMPANION_COOLDOWNS = [
      'cd',
      'skill1Cd',
      'skill2Cd',
      'skillGlobalCd',
      'healCd',
      'manaCd',
      'survivalCd',
    ];
    const SLOW_ENEMY_COOLDOWNS = [
      'cd',
      'specialCd',
      'summonCd',
      'healCd',
      'supportHealCd',
      'anastylosisCd',
      'sabotageCd',
    ];
    const SLOW_ENEMY_DEADLINES = [
      'royalPrerogativeReadyAt',
      'passiveRepairReadyAt',
      'passiveVeteranReadyAt',
      'ledgerNextAt',
      'ashNextAt',
    ];
    function sweptCircleEntry(unit, from, to, radius) {
      const dx = to.x - from.x,
        dy = to.y - from.y,
        ox = from.x - unit.x,
        oy = from.y - unit.y,
        a = dx * dx + dy * dy,
        c = ox * ox + oy * oy - radius * radius;
      if (c < 0) return 0;
      if (!a) return Infinity;
      const b = 2 * (ox * dx + oy * dy),
        discriminant = b * b - 4 * a * c;
      if (discriminant <= 0) return Infinity;
      const entry = (-b - Math.sqrt(discriminant)) / (2 * a);
      return entry >= 0 && entry <= 1 ? entry : Infinity;
    }
    // A hit conveys short-lived awareness, not permanent omniscience or saved AI state.
    // Weak keys also keep dead/despawned monsters from accumulating alert records.
    const underFireAlerts = new WeakMap();
    class Combat {
      combatTargets() {
        const z = this.s.zones[this.s.zone];
        return [this.hero, ...this.activeLivingParty(), ...(z?.escort?.hp > 0 ? [z.escort] : [])];
      }

      // The hold receipt identifies enemies already engaged at charge start;
      // it never changes the persistent campaign or save format.
      chargedEncounterProtected(e) {
        return !!e && (e.type === 'boss' || e.captain || e.roomCaptain);
      }
      chargedEncounterSnapshot() {
        return {
          zone: this.zoneId,
          engaged: this.zone()
            .enemies.filter(
              (e) => this.chargedEncounterProtected(e) && e.hp > 0 && e.aggro && !e.returning,
            )
            .map((e) => ({ id: e.id, fightStart: e.fightStart })),
        };
      }
      invalidChargedOpener(e, receipt) {
        // Direct engine simulations without held-input receipts preserve their
        // existing behavior. Real keyboard and touch charges always pass one.
        return !!(
          receipt &&
          this.chargedEncounterProtected(e) &&
          (receipt.zone !== this.zoneId ||
            !Array.isArray(receipt.engaged) ||
            !receipt.engaged.some(
              (fight) => fight.id === e.id && fight.fightStart === e.fightStart,
            ))
        );
      }

      // One active-time clock for every friendly preparation. The shell injects
      // a pause-aware monotonic clock; headless callers advance the same clock
      // through tick(). No browser clock, actor field or timestamp is saved.
      partyChargeNow() {
        return this._partyChargeClock
          ? this._partyChargeClock()
          : (this._partyChargeTime ?? this.s.time);
      }
      setPartyChargeClock(clock) {
        this._partyChargeClock = clock;
      }
      advancePartyChargeClock(seconds) {
        if (!this._partyChargeClock && Number.isFinite(seconds) && seconds > 0)
          this._partyChargeTime = this.partyChargeNow() + seconds;
      }
      partyChargeRecovery(unit) {
        const remaining = Math.max(
          0,
          (this._partyChargeRecovery?.get(unit) || 0) - this.partyChargeNow(),
        );
        if (!remaining) this._partyChargeRecovery?.delete(unit);
        return remaining;
      }
      partyChargeProgress(unit) {
        const cast = this.partyChargeState(unit);
        return cast
          ? Math.min(
              1,
              Math.max(0, (this.partyChargeNow() - cast.started) / R.chargedSkills.holdSeconds),
            )
          : 0;
      }
      beginPartyCharge(unit, slot) {
        if (!unit || unit.hp <= 0 || this.partyChargeRecovery(unit) > 0) return false;
        if (!this._pendingPartyCharges) this._pendingPartyCharges = new Map();
        const started = this.partyChargeNow();
        this._pendingPartyCharges.set(unit, {
          slot,
          started,
          readyAt: started + R.chargedSkills.holdSeconds,
          zone: this.zoneId,
          lostHp: 0,
          interrupted: false,
        });
        return true;
      }
      partyChargeState(unit) {
        return this._pendingPartyCharges?.get(unit) || null;
      }
      clearPartyCharge(unit) {
        this._pendingPartyCharges?.delete(unit);
        this._companionCharges?.delete(unit?.id);
      }
      clearPartyCharges() {
        this._pendingPartyCharges?.clear();
        this._companionCharges?.clear();
        this._partyChargeRecovery?.clear();
      }
      recoverPartyCharge(unit) {
        if (!this._partyChargeRecovery) this._partyChargeRecovery = new Map();
        this._partyChargeRecovery.set(
          unit,
          this.partyChargeNow() + R.chargedSkills.interrupt.recoverySeconds,
        );
        // This marks the next legal first-special opportunity; it never
        // changes the 8/12-second clocks or the interruption recovery.
        this.rememberFailedPetCharge?.(unit);
      }
      recordPartyChargeDamage(unit, actualLostHp) {
        const cast = this.partyChargeState(unit);
        if (!cast || cast.interrupted || !(actualLostHp > 0)) return false;
        // Completion wins an exact deadline tie for both actors. Damage after
        // readiness cannot break preparation; death still clears an unreleased
        // action before respawn/Developer immortality can revive the actor.
        if (this.partyChargeNow() + 1e-9 >= cast.readyAt) {
          if (unit.hp <= 0) this.clearPartyCharge(unit);
          return false;
        }
        cast.lostHp += actualLostHp;
        const rule = R.chargedSkills.interrupt,
          threshold = Math.max(rule.minimumHp, (unit.maxHp || 1) * rule.hpFraction);
        if (cast.lostHp + 1e-9 < threshold && unit.hp > 0) return false;
        cast.interrupted = true;
        this.recoverPartyCharge(unit);
        if (unit !== this.hero)
          unit.skillGlobalCd = Math.max(unit.skillGlobalCd || 0, rule.recoverySeconds);
        this.event('chargeInterrupted', {
          zone: this.zoneId,
          actor: unit === this.hero ? 'hero' : 'companion',
          target: unit === this.hero ? 'hero' : unit.id,
          slot: cast.slot,
          damage: cast.lostHp,
          threshold,
          x: unit.x,
          y: unit.y,
        });
        return true;
      }

      // Shared tactical observations and authored damage/targeting safeguards.
      tacticalClearBurst(e = null) {
        if (!this._tacticalBurstWindow) return;
        if (e) this._tacticalBurstWindow.delete(e.id);
        else this._tacticalBurstWindow.clear();
      }

      tacticalCompressDamage(e, rawDamage) {
        const config = R.tacticalFoundation.burstCompression;
        if (!config?.enabled) return rawDamage;
        const tier = this.tacticalProtectionTier(e);
        const profile = config.tiers[tier];
        if (!profile) return rawDamage;

        // This is a transient, target-specific sliding window shared by all
        // hero/companion hits, not per-skill, per-attacker or per-attack cooldown.
        if (!this._tacticalBurstWindow) this._tacticalBurstWindow = new Map();
        const now = this.s.time || 0;
        const recent = this._tacticalBurstWindow.get(e.id) || [];
        const cutoff = now - config.windowSeconds;
        while (recent.length && recent[0].time <= cutoff) recent.shift();
        const beforeRaw = recent.reduce((total, hit) => total + hit.raw, 0);
        const hp = Math.max(1, e.maxHp || e.baseHp || 1);
        // A genuinely exposed opening remains valuable; ordinary attack windows
        // and existing scripted defenses keep their original multipliers.
        const opening = (e.open || 0) > 0 ? config.openingMultiplier : 1;
        const knee = hp * profile.knee * opening;
        const tail = hp * profile.tail * opening;
        const curve = (raw) => (raw <= knee ? raw : knee + tail * Math.log1p((raw - knee) / tail));
        const compressed = Math.max(
          0,
          Math.min(rawDamage, curve(beforeRaw + rawDamage) - curve(beforeRaw)),
        );
        recent.push({ time: now, raw: rawDamage });
        this._tacticalBurstWindow.set(e.id, recent);
        return compressed;
      }

      tacticalClearThreat(e = null) {
        if (!this._tacticalThreat) return;
        if (e) this._tacticalThreat.delete(e.id);
        else this._tacticalThreat.clear();
      }

      tacticalPruneThreat(e) {
        const ledger = this._tacticalThreat?.get(e?.id);
        if (!ledger) return null;
        const cutoff = (this.s.time || 0) - R.tacticalFoundation.threatWindowSeconds;
        for (const [source, hits] of ledger) {
          while (hits.length && hits[0].time < cutoff) hits.shift();
          if (!hits.length) ledger.delete(source);
        }
        if (!ledger.size) {
          this._tacticalThreat.delete(e.id);
          return null;
        }
        return ledger;
      }

      tacticalThreatSnapshot(e) {
        const ledger = this.tacticalPruneThreat(e);
        if (!ledger) return [];
        return [...ledger.entries()]
          .map(([source, hits]) => ({
            source,
            damage: hits.reduce((total, hit) => total + hit.damage, 0),
            lastHit: hits[hits.length - 1].time,
          }))
          .sort((a, b) => b.damage - a.damage || a.source.localeCompare(b.source));
      }

      tacticalRecordHit(e, source, damage) {
        if (!e || !Number.isFinite(damage) || damage <= 0) return;
        const actor =
          source === 'hero'
            ? 'hero'
            : this.s.party.find((unit) => unit.id === source && unit.hp > 0)?.id;
        if (!actor) return;
        if (!this._tacticalThreat) this._tacticalThreat = new Map();
        const ledger = this.tacticalPruneThreat(e) || new Map();
        const now = this.s.time || 0;
        const hits = ledger.get(actor) || [];
        const last = hits[hits.length - 1];
        if (last && last.time === now) last.damage += damage;
        else hits.push({ time: now, damage });
        // Keep the transient observation cache bounded even in extreme rapid-hit cases.
        if (hits.length > 128) hits.splice(0, hits.length - 128);
        ledger.set(actor, hits);
        this._tacticalThreat.set(e.id, ledger);
      }

      noteEnemyUnderFire(e, source, origin, actualDamage) {
        if (!(actualDamage > 0) || e.hp <= 0) return;
        // PR #516 must never reinterpret an earlier hit as an attack on a
        // refuge the monster reached later. Only real damage taken WHILE
        // anchored and outside the close Rogue response radius requests a
        // fresh tactical assessment. This state remains unsaved/transient.
        const regroup = this.tacticalRogueRegroup(e);
        if (regroup?.phase === 'anchored' && dist(origin, e) > 280)
          regroup.hitWhileAnchored = true;
        const previous = underFireAlerts.get(e);
        const realAttacker =
          source === 'hero' ||
          this.s.party.some((unit) => unit.id === source && unit.hp > 0);
        underFireAlerts.set(e, {
          zone: this.zoneId,
          source: realAttacker ? source : null,
          // Impact direction is remembered briefly; it is not live tracking
          // through walls or an expansion of passive detection.
          x: origin.x,
          y: origin.y,
          expires: this.s.time + 4,
          nextSidestep: previous?.zone === this.zoneId ? previous.nextSidestep : 0,
        });
      }

      enemyUnderFireAlert(e) {
        const alert = underFireAlerts.get(e);
        if (!alert) return null;
        if (
          e.hp <= 0 ||
          !e.aggro ||
          e.returning ||
          alert.zone !== this.zoneId ||
          alert.expires < this.s.time
        ) {
          underFireAlerts.delete(e);
          return null;
        }
        return alert;
      }

      clearEnemyUnderFire(e) {
        underFireAlerts.delete(e);
      }

      // When a real ranged hit has engaged a monster but pursuit cannot find
      // a route, try a bounded local step. This is a defensive response, not
      // a teleport, wall bypass, remote attack or new aggro range.
      enemyUnderFireSidestep(e, dt, territory) {
        const alert = this.enemyUnderFireAlert(e);
        if (
          !alert ||
          !e.home ||
          !(dt > 0) ||
          e.telegraph ||
          e.motion ||
          e.rangedAim ||
          this.s.time < alert.nextSidestep
        )
          return false;
        alert.nextSidestep = this.s.time + 1.25;
        const away = Math.atan2(e.y - alert.y, e.x - alert.x);
        for (const offset of [Math.PI / 2, -Math.PI / 2, 0, Math.PI / 4, -Math.PI / 4]) {
          const angle = away + offset;
          const point = { x: e.x + Math.cos(angle) * 48, y: e.y + Math.sin(angle) * 48 };
          if (dist(point, e.home) > territory || !this.clearSegment(e, point)) continue;
          const before = { x: e.x, y: e.y };
          this.move(e, point, 125, dt);
          if (dist(before, e) > 0.1) return true;
        }
        return false;
      }

      tacticalActiveTargetCount(e) {
        if (!e || !e.aggro || e.hp <= 0) return 0;
        const now = this.s.time || 0;
        const recent = this.tacticalThreatSnapshot(e);
        const attackingHero =
          this.hero.hp > 0 &&
          dist(this.hero, e) <= 520 &&
          this.line(this.hero, e) &&
          ((this.hero.order?.type === 'attack' && this.hero.order.id === e.id) ||
            (this.basicComboTargetId === e.id && now - this.basicComboAt <= 2.2) ||
            recent.some((entry) => entry.source === 'hero' && now - entry.lastHit <= 2.2));
        let count = attackingHero ? 1 : 0;
        for (const u of this.activeLivingParty()) {
          if (u.order || this.s.recallActive || dist(u, e) > 640) continue;
          if (this._tacticalPartyTargets?.get(u.id) === e.id) count++;
        }
        return count;
      }

      weakenedEnemyDamage(e) {
        return (
          e.damage *
          ((e.weakenUntil || 0) > this.s.time ? 1 - Math.min(0.8, e.weakenFraction || 0) : 1)
        );
      }
      tacticalHighestThreatTarget(e, fallback = this.hero) {
        const ledger = this.tacticalThreatSnapshot(e),
          now = this.s.time || 0,
          // Only a real, recent HP hit can expand a Rogue cast's target
          // selection. An idle or merely ordered ranged actor still uses the
          // original 360/500 range, so this does not enlarge passive aggro.
          recentAttackers = new Set(
            ledger.filter((hit) => now - hit.lastHit <= 2.2).map((hit) => hit.source),
          ),
          baseRange = Math.max(
            e.type === 'boss' ? 500 : 360,
            this.enemyRanged(e) && this.enemyFort(e) ? this.enemyRangedRange(e) : 0,
          ),
          // Match the existing Rogue move's legal reach; do not increase it.
          moveRange =
            (e.type === 'boss' ? 500 : e.captain || e.roomCaptain ? 440 : 340) *
            R.balance.enemySpecialReachMultiplier,
          candidates = this.combatTargets().filter(
            (u) =>
              u.hp > 0 &&
              dist(e, u) <=
                (e.aggro && recentAttackers.has(u === this.hero ? 'hero' : u.id)
                  ? Math.max(baseRange, moveRange)
                  : baseRange) &&
              this.enemyRangedLine(e, u),
          );
        for (const record of ledger) {
          const found = candidates.find((u) => (u === this.hero ? 'hero' : u.id) === record.source);
          if (found) return found;
        }
        return candidates.includes(fallback) ? fallback : candidates[0] || null;
      }

      tacticalDirectTargetable(e) {
        return !!e && (e.rogueDustCoverUntil || 0) <= (this.s.time || 0);
      }

      tacticalDropDustTarget(e) {
        if (!e?.id) return;
        // Direct target selection is invalid immediately, not merely at the
        // moment damage would land. Other foes remain auto-targetable.
        if (this.s.heroTarget === e.id) this.s.heroTarget = null;
        if (this.manualHeroTargetId === e.id) {
          this.manualHeroTargetId = null;
          this.manualHeroTargetLocked = false;
          this.manualHeroTargetZone = null;
        }
        if (this.hero.order?.type === 'attack' && this.hero.order.id === e.id)
          this.hero.order = null;
        if (this.basicComboTargetId === e.id) this.resetBasicCombo();
        for (const u of this.s.party) {
          if (u.order?.type === 'attack' && u.order.id === e.id) u.order = null;
        }
        if (this._tacticalPartyTargets)
          for (const [id, targetId] of this._tacticalPartyTargets)
            if (targetId === e.id) this._tacticalPartyTargets.delete(id);
        // Already launched single-target shots are abandoned. Area effects
        // retain their own hit geometry and remain able to damage the goblin.
        this.s.projectiles = this.s.projectiles.filter(
          (p) => p.source === 'enemy' || p.target !== e.id,
        );
      }
      tacticalProtectionTier(e) {
        if (e?.type === 'boss') return e.form === 'true' ? 'trueBoss' : 'boss';
        if (e?.captain || e?.roomCaptain) return 'captain';
        if (e?.form === 'ringleader') return 'ringleader';
        if (e?.guard) return 'guardian';
        return 'ordinary';
      }

      tacticalRegroupCandidates(e) {
        if (!e || !this.zone()?.enemies) return [];
        const radius = R.tacticalFoundation.awarenessRadius;
        // Awareness crosses packs; tacticalBeginRogueRegroup separately checks
        // route length, collision and protected-town safety before movement.
        return this.zone()
          .enemies.filter(
            (ally) =>
              ally !== e &&
              ally.hp > 0 &&
              !ally.neutral &&
              !ally.returning &&
              !['travel', 'escape', 'extended'].includes(this.tacticalRogueRegroup(ally)?.phase) &&
              dist(ally, e) <= radius,
          )
          .sort((a, b) => dist(a, e) - dist(b, e) || a.id.localeCompare(b.id));
      }

      tacticalRegroupGroups(e) {
        if (!e) return [];
        const groups = new Map();
        for (const ally of this.tacticalRegroupCandidates(e)) {
          const key = ally.pack || ally.id;
          if (!groups.has(key)) groups.set(key, { key, members: [], distance: Infinity });
          const group = groups.get(key);
          group.members.push(ally);
          group.distance = Math.min(group.distance, dist(e, ally));
        }
        // A group assessment, not a retreat destination or an order to engage.
        // Any one reachable ally can be sufficient. Favor close support first;
        // group size only breaks a proximity tie. Actual path viability is
        // checked when a specific regroup destination is requested.
        return [...groups.values()].sort(
          (a, b) =>
            a.distance - b.distance ||
            b.members.length - a.members.length ||
            a.key.localeCompare(b.key),
        );
      }

      tacticalPresentOpponents(e) {
        const radius = R.tacticalFoundation.presenceRadius;
        const party = this.activeLivingParty().filter(
          (u) => !u.order && !this.s.recallActive && dist(u, e) <= radius,
        );
        const heroHere = this.hero.hp > 0 && dist(this.hero, e) <= radius;
        return party.length + (heroHere ? 1 : 0);
      }

      tacticalLocalSupport(e) {
        return this.zone().enemies.filter(
          (ally) =>
            ally.hp > 0 &&
            !ally.neutral &&
            !ally.returning &&
            !['travel', 'escape', 'extended'].includes(this.tacticalRogueRegroup(ally)?.phase) &&
            dist(ally, e) <= R.tacticalFoundation.supportRadius + 35,
        ).length;
      }

      tacticalRogueWounded(e) {
        // Bosses and captains retain their own phase/summon mechanics. Ordinary,
        // guardian and ringleader monsters can seek support when badly hurt.
        return !!(
          e &&
          e.hp > 0 &&
          e.maxHp > 0 &&
          e.type !== 'boss' &&
          !e.captain &&
          !e.roomCaptain &&
          (e.type === 'mob' || e.guard || e.form === 'ringleader') &&
          e.hp / e.maxHp < R.tacticalFoundation.woundedThreshold
        );
      }

      tacticalRogueEligibility(e, activeTargetCount = 0) {
        const config = R.tacticalFoundation;
        if (!e || !this.hero || e.hp <= 0 || this.peace) return false;
        if (this.tacticalPresentOpponents(e) === 0 && activeTargetCount === 0) return false;
        const difference = e.level - this.hero.level;
        if (difference >= config.outlevelProtection) return false;
        if (this.tacticalRogueWounded(e)) return true;
        if (difference <= -config.heroLevelDisadvantageMinimum) return true;

        const pressured = activeTargetCount >= config.simultaneousPressureSources;
        if (e.type !== 'boss' && !e.captain && !e.roomCaptain) return pressured;
        const summonProfile = e.type === 'boss' ? true : !!this.captainProfile(e)?.summon;
        if (!summonProfile || difference !== 0) return pressured;

        const living = this.zone().enemies.filter(
          (unit) => unit.summon && unit.owner === e.id && unit.hp > 0,
        ).length;
        const depleted = living <= config.summonSupportThreshold && (e.summonCd || 0) > 0;
        // Cunning status requires an explicit authored entry in the live rules.
        const cunningKey = e.captainProfile || e.family;
        const cunning = config.cunningEnemies.includes(cunningKey);
        return depleted && (pressured || cunning);
      }

      // Slow stack strength is one scalar per actor. Each extra hit suppresses
      // recovery with diminishing returns, without timers or work per stack.
      // Split the final frame at Slow expiry to keep recovery frame-rate stable.
      cooldownRecoveryElapsed(unit, dt, enemy = false) {
        if (!Number.isFinite(dt) || dt <= 0) return 0;
        const slow = Number.isFinite(unit?.slow) ? Math.max(0, unit.slow) : 0;
        if (!slow) return dt;
        const base = enemy
          ? R.cooldownBalance.enemySlowRecoveryMultiplier
          : R.cooldownBalance.slowRecoveryMultiplier;
        const perStack = enemy
          ? R.cooldownBalance.enemySlowStackPenalty
          : R.cooldownBalance.slowStackPenalty;
        const recordedStacks = Number.isFinite(unit?.slowStacks)
          ? Math.max(1, Math.floor(unit.slowStacks))
          : 1;
        const stacks = enemy
          ? recordedStacks
          : Math.min(R.cooldownBalance.partySlowMaxStacks, recordedStacks);
        const recovery = base / (1 + (stacks - 1) * perStack);
        return dt - Math.min(dt, slow) * (1 - recovery);
      }

      // Absolute encounter-clock readiness deadlines need the same recovery
      // adjustment as remaining-second timers, including when a deadline falls
      // inside the current frame. Never extend an already-ready ability.
      slowCooldownReadyAt(unit, readyAt, dt, enemy = false) {
        if (!Number.isFinite(readyAt) || !Number.isFinite(dt) || dt <= 0) return readyAt;
        const frameStart = this.s.time - dt;
        if (readyAt <= frameStart) return readyAt;
        const remaining = readyAt - frameStart;
        return this.s.time + Math.max(0, remaining - this.cooldownRecoveryElapsed(unit, dt, enemy));
      }

      // The shared Slow contract: valid hits refresh one duration window, while
      // stacking strength and *lasting* debt reward repeated, coordinated hits.
      // No timer or array is allocated per stack. For heroes, companions and pets,
      // cooldown debt stops at the party cap. Enemy Slow remains unchanged.
      applySlow(unit, seconds, diagnostic = null) {
        if (
          !unit ||
          unit.hp <= 0 ||
          (unit.immune || 0) > 0 ||
          this.peace ||
          !Number.isFinite(seconds) ||
          seconds <= 0
        )
          return false;
        const duration = seconds + R.cooldownBalance.slowDurationBonusSeconds;
        const alreadySlowed = Number.isFinite(unit.slow) && unit.slow > 0;
        const priorStacks = Number.isFinite(unit.slowStacks)
          ? Math.max(1, Math.floor(unit.slowStacks))
          : 1;
        const isHero = unit === this.hero;
        const isCompanion = !isHero && this.s.party.includes(unit);
        const isEnemy = !isHero && !isCompanion;
        const maxStacks = isEnemy ? Infinity : R.cooldownBalance.partySlowMaxStacks;
        // An uninterrupted party Slow episode has finite stack/debt pressure.
        // Enemy Slow stacking retains the existing offensive control behavior.
        const earnsDebt = !alreadySlowed || priorStacks < maxStacks;
        unit.slowStacks = alreadySlowed ? Math.min(maxStacks, priorStacks + 1) : 1;
        unit.slow = Math.max(alreadySlowed ? unit.slow : 0, duration);
        const debt = earnsDebt
          ? duration *
            (isEnemy ? R.cooldownBalance.enemySlowDebtFraction : R.cooldownBalance.slowDebtFraction)
          : 0;
        if (isHero) {
          for (const timers of [unit.cd, unit.chargedCd || []])
            for (let i = 0; i < timers.length; i++) if (timers[i] > 0) timers[i] += debt;
          if (unit.basicCd > 0) unit.basicCd += debt;
        } else {
          for (const key of isEnemy ? SLOW_ENEMY_COOLDOWNS : SLOW_COMPANION_COOLDOWNS)
            if (Number.isFinite(unit[key]) && unit[key] > 0) unit[key] += debt;
        }
        if (isEnemy) {
          const rogueReady = this._tacticalRogueNext?.get(unit.id);
          if (Number.isFinite(rogueReady) && rogueReady > this.s.time)
            this._tacticalRogueNext.set(unit.id, rogueReady + debt);
          for (const key of SLOW_ENEMY_DEADLINES)
            if (Number.isFinite(unit[key]) && unit[key] > this.s.time) unit[key] += debt;
        }
        // Preserve the actual earned amount for source-attributed Rogue reports.
        if (diagnostic) diagnostic.appliedDebt = debt;
        if (!diagnostic?.deferPartyDiagnostic)
          this.partyDiagnosticsRecordSlow?.(unit, diagnostic, duration, debt);
        return true;
      }

      applyRogueSlow(unit, seconds, sourceId = null, moveName = null) {
        // Wait until rogueSlow is updated so the reported post-hit state is exact.
        const diagnostic = { deferPartyDiagnostic: true };
        if (!this.applySlow(unit, seconds, diagnostic)) return false;
        const duration = seconds + R.cooldownBalance.slowDurationBonusSeconds;
        unit.rogueSlow = Math.max(unit.rogueSlow || 0, duration);
        this.partyDiagnosticsRecordSlow?.(
          unit, { kind: 'rogue', sourceId, moveName },
          duration, diagnostic.appliedDebt,
        );
        return true;
      }

      slowMovementFactor(unit) {
        if (!(unit?.slow > 0)) return 1;
        return unit.rogueSlow > 0 ? R.tacticalFoundation.rogueSlowMovementFactor : 0.65;
      }

      ashMovementFactor(unit) {
        if (!unit) return 1;
        const now = this.s.time;
        const cloud = this.s.zones[this.s.zone]?.enemies.find(
          (e) =>
            e.type === 'boss' &&
            e.family === 'warlord' &&
            e.aggro &&
            e.hp > 0 &&
            e.ashCloud &&
            e.ashCloud.expires > now &&
            dist(unit, e.ashCloud) < 180,
        );
        if (cloud) unit.ashLastAt = now;
        return cloud || (Number.isFinite(unit.ashLastAt) && now - unit.ashLastAt <= 2) ? 0.7 : 1;
      }
      mireBogMovementFactor(unit) {
        if (!unit || !Number.isFinite(unit.mireBogLastAt)) return 1;
        const away = Math.max(0, this.s.time - unit.mireBogLastAt);
        if (away >= 2) return 1;
        const seconds = unit.mireBogExposure || 0;
        const inMudSpeed = seconds < 1 ? 0.75 : seconds < 2 ? 0.6 : seconds < 3 ? 0.45 : 0.35;
        // When no longer standing in the bog, movement recovers smoothly over two seconds.
        return 1 - (1 - inMudSpeed) * (away > 0.11 ? Math.max(0, 1 - away / 2) : 1);
      }
      drainMana(u, fraction) {
        if (!R.resourceMode.manaEnabled) return 0;
        if (u !== this.hero || !fraction || u.mp <= 0 || this.peace) return 0;
        const amount = Math.min(u.mp, Math.max(1, Math.round(u.maxMp * fraction)));
        u.mp = Math.max(0, u.mp - amount);
        if (amount > 0) this.event('manaDrain', { amount });
        return amount;
      }

      damage(e, amount, source = 'hero', options = null) {
        if (
          !e ||
          e.hp <= 0 ||
          e.neutral ||
          (!options?.area && !this.tacticalDirectTargetable(e)) ||
          this.peace ||
          this.attackResetProtected(e) ||
          !Number.isFinite(amount) ||
          amount <= 0
        )
          return false;
        const origin =
          source === 'hero' ? this.hero : this.s.party.find((u) => u.id === source) || this.hero;
        const normalDamageTerritory = e.type === 'boss' ? (this.isDungeon() ? 1800 : 700) : 500;
        // A valid tactical retreat moves the active encounter, not the permanent
        // spawn. Allow damage near the retreat corridor/anchor; otherwise a
        // regrouper beyond its original home leash would become invulnerable.
        const inCombatArea = this.tacticalRogueLeashAllows(e, origin, normalDamageTerritory);
        if (!this.line(origin, e) || !inCombatArea) return false;
        if (this.awaitsHeroAttack(e)) {
          if (source !== 'hero') {
            this.openingCompanionHit(e);
            return false;
          }
          if (options?.automaticBasic) return false;
          this.admitOpeningHeroAttack(e);
        }
        if (this.invalidChargedOpener(e, options?.encountersAtStart)) {
          // Kill every arrow from the same precharged attack, including the
          // copied projectile iterator's later Ranger shots.
          for (const shot of this.s.projectiles)
            if (shot.target === e.id && shot.encountersAtStart === options.encountersAtStart)
              shot.cancelledChargedOpener = true;
          this.s.projectiles = this.s.projectiles.filter((shot) => !shot.cancelledChargedOpener);
          // Deflecting an early charge still notices the attack. A roaming
          // patrol must stop and fight instead of silently walking through it.
          this.interruptPatrolReturn(e);
          this.engage(e, true);
          // Deflect only this invalid charged hit. Preserve aggro, prior
          // damage, position, conditions and the ongoing encounter.
          this.say(e.name + ' deflects the pre-engagement charged attack.');
          return false;
        }
        e.mercyProvoked = true;
        this.interruptPatrolReturn(e);
        this.engage(e, true);
        if (source === 'hero') e.heroParticipated = true;
        // Ash abrades eyes: attacks issued by a party member inside or recently
        // outside Choking Ash have a 35% miss chance, without extra damage.
        if (this.ashMovementFactor(origin) < 1 && this.random() < 0.35) return false;
        // Piercing bypasses defensive mitigation, not terrain, range or Ash misses.
        const piercing = source === 'hero' && options?.piercing === true;
        if (!piercing && this.enemyFort(e)) amount *= R.balance.fortifications.incomingMultiplier;
        if (!piercing && e.roomCaptain && e.captainGuard > 0) amount *= 0.7;
        if (!piercing && e.roomCaptain) {
          const profile = this.captainProfile(e),
            summon = profile?.summon;
          if (summon?.guardPerSummon) {
            const living = this.captainOwnedSummons(e).length,
              guard = Math.min(summon.guardCap ?? 1, living * summon.guardPerSummon);
            amount *= 1 - guard;
          }
        }
        // Mirejaw's crocodilian scales lose their protection permanently as health falls.
        // At full health they stop 40%; by half health they stop none.
        if (e.family === 'mire' && e.type === 'boss') {
          e.mireLowestHpRatio = Math.min(
            e.mireLowestHpRatio ?? 1,
            Math.max(0, e.hp / Math.max(1, e.maxHp)),
          );
          const ratio = Math.max(0, Math.min(1, e.mireLowestHpRatio));
          if (!piercing) amount *= 1 - 0.4 * Math.max(0, Math.min(1, (ratio - 0.5) * 2));
        }
        if (!piercing && e.type === 'boss' && e.family === 'crypt')
          amount *=
            R.greenwoodPassives.structuralConsolidation[e.form === 'true' ? 'true' : 'normal'] *
            (e.anastylosis > 0 ? R.attacks.crypt[5].defenseFactor : 1);
        if (
          !piercing &&
          e.roomCaptain &&
          e.captainProfile === 'supply-march' &&
          e.strainHardeningUntil > this.s.time
        )
          amount *=
            1 -
            Math.min(R.marchesPassives.strainHardening.maxStacks, e.strainHardeningStacks || 0) *
              R.marchesPassives.strainHardening.perHit;
        if (
          !piercing &&
          e.type === 'boss' &&
          e.family === 'archive' &&
          e.emergencyStabilizationUntil > this.s.time
        )
          amount *=
            1 -
            R.marchesPassives.emergencyStabilization[e.form === 'true' ? 'true' : 'normal']
              .reduction;
        if (e.family === 'darklord' && e.telegraph?.secondWind) {
          // Front-facing stance mitigates damage; a real hit from behind
          // interrupts healing without negating that hit.
          const facing = e.secondWindFacing || 0,
            angle = Math.atan2(origin.y - e.y, origin.x - e.x);
          if (Math.cos(angle - facing) < -0.5) e.secondWindCancelled = true;
          if (!piercing) amount *= R.bossRecovery.darklord.damageMultiplier;
        }
        if (
          !piercing &&
          e.owner &&
          e.royalFormationUntil > this.s.time &&
          e.species === 'crownguard'
        )
          amount *= 0.8;
        if (!piercing && e.family === 'citadel' && e.open <= 0) amount *= 0.65;
        if (e.family === 'mine' && e.open > 0) amount *= 1.25;
        // Individual passive defenses run before burst compression and remain
        // bypassable by the existing explicit piercing contract.
        if (!piercing) amount *= this.snapshotBossIncomingFactor(e);
        // All hero/companion damage sources use this same resolver. This
        // reduction is exclusive to active travel; it ends on arrival or abort.
        if (!piercing) {
          const retreat = this.tacticalRogueRegroup(e)?.phase;
          if (retreat === 'extended') amount *= 0.35;
          else if (['thinking', 'travel', 'escape'].includes(retreat))
            amount *= ROGUE_REGROUP_INCOMING_DAMAGE_MULTIPLIER;
        }
        if (!piercing) amount = this.tacticalCompressDamage(e, amount);
        // Existing Royal Tax shields absorb first. A hit wholly stopped by
        // that shield does NOT count as another qualifying taxation hit.
        // A newly earned shield starts protecting only AFTER its triggering hit.
        if (!piercing && e.family === 'darklord' && e.royalTaxShield > 0) {
          const absorbed = Math.min(e.royalTaxShield, Math.max(0, amount));
          e.royalTaxShield -= absorbed;
          amount -= absorbed;
        }
        if (e.family === 'darklord' && e.royalTaxation) {
          const tax = e.royalTaxation;
          if (this.s.time > tax.expires) e.royalTaxation = null;
          else if (amount > 0 && tax.marked.includes(source)) {
            // Four distinct sources in a full party. Smaller parties must
            // still make four real hits in total, including one from each
            // marked attacker. Four hits by just one member of a duo/trio
            // never substitute for the other members' contributions.
            if (!tax.sources.includes(source)) tax.sources.push(source);
            tax.hits = (tax.hits || 0) + 1;
            if (tax.hits >= 4 && tax.sources.length === tax.marked.length) {
              e.royalTaxShield = e.maxHp * 0.12;
              e.royalTaxation = null;
            }
          }
        }
        const equipment = e.veraEquipment,
          minister = equipment && this.zone().enemies.find((u) => u.id === equipment.owner);
        if (
          !piercing &&
          equipment &&
          this.veraHeld() &&
          minister?.hp > 0 &&
          minister.aggro &&
          !minister.returning &&
          e.species === 'ashbeast' &&
          e.type === 'mob' &&
          this.zoneId === 'crown'
        ) {
          const absorbed = Math.min(
            equipment.remaining,
            Math.max(0, amount) * R.cinderInspection.repairs.absorption,
          );
          equipment.remaining -= absorbed;
          amount -= absorbed;
        }
        // Shield Stance sacrifices Paladin offense; Arcane Fracture increases
        // actual damage from both the hero and companions, once per hit.
        if (source === 'hero' && this.hero.class === 'paladin' && (this.hero.shieldStance || 0) > 0)
          amount *= R.heroTactics.paladin.shield.outgoing;
        if ((e.fractureUntil || 0) > this.s.time) amount *= 1 + (e.fractureFraction || 0);
        const actualDamage = Math.max(0, Math.min(e.hp, amount));
        const reflected =
          e.captainProfile === 'supply-crown' && e.captainReflect > 0 ? actualDamage * 0.3 : 0;
        e.hp = Math.max(0, e.hp - amount);
        this.recordMarchesDamage(e, actualDamage);
        this.snapshotPassiveRecordHit(e, actualDamage, source);
        this.tacticalRecordHit(e, source, actualDamage);
        if (actualDamage > 0 && e.hp > 0)
          this.noteEnemyUnderFire(e, source, origin, actualDamage);
        if (source === 'hero') this.recordDeveloperDamage('outgoing', actualDamage);
        this.effects.push({ type: 'hit', x: e.x, y: e.y, amount });
        if (e.hp === 0) {
          this.clearEnemyUnderFire(e);
          this.kill(e);
        }
        if (reflected > 0 && origin.hp > 0) this.hitParty(origin, reflected, 0, null, true);
        return true;
      }
      hitParty(u, amount, manaDrain = 0, rangedSourceId = null, alreadyMitigated = false) {
        if (this.peace || u.hp <= 0 || (u.immune || 0) > 0) return false;
        // Real two-second Endure window, class-only and never granted to pets.
        if (u === this.hero && u.class === 'rogue' && (u.rogueEndureUntil || 0) > this.s.time)
          return false;
        // Real source IDs also cover melee now. Passive bonuses never apply to
        // environment hazards, reflected damage, or unrelated named species.
        const attacker = rangedSourceId
          ? this.zone().enemies.find((e) => e.id === rangedSourceId)
          : null;
        if (!alreadyMitigated) amount *= this.snapshotPassiveOutgoingFactor(attacker);
        const armor =
          u === this.hero
            ? this.armor()
            : ['soldier', 'archer', 'pet'].includes(u.type)
              ? this.companionArmor(u)
              : 5 + this.hero.level * 0.5;
        const oldHp = u.hp;
        let mitigated = alreadyMitigated
          ? Math.max(0, amount)
          : Math.max(3, amount - armor * this.armorEffectivenessFor(u));
        // Hero Shield Stance and the party ward share a mitigation layer:
        // apply the STRONGER one, not both multiplicatively. Last Bastion
        // still protects companions, while a tank cannot stack two defenses
        // into near-immunity. Enemy weakening remains an offensive debuff.
        let defensiveFactor = 1;
        if (this.companionRetreating(u))
          defensiveFactor = Math.min(defensiveFactor, R.companionRecall.retreatDamageMultiplier);
        if (u === this.hero && u.class === 'paladin' && (u.shieldStance || 0) > 0) {
          const shield = R.heroTactics.paladin.shield;
          defensiveFactor = Math.min(
            defensiveFactor,
            1 -
              Math.min(
                0.9,
                shield.reduction + Math.floor((u.shieldRank || 1) / 2) * shield.reductionStep,
              ),
          );
        }
        if ((u.wardUntil || 0) > this.s.time)
          defensiveFactor = Math.min(defensiveFactor, 1 - Math.min(0.75, u.wardReduction || 0));
        mitigated *= defensiveFactor;
        u.hp = Math.max(0, u.hp - mitigated);
        if (
          u === this.hero && u.class === 'rogue' && u.hp === 0 &&
          u.rogueEndureUsed !== true && oldHp > 0
        ) {
          // Once per life is the conservative Phase-2 recovery policy; no
          // unapproved 90s retrigger or automatic death is invented.
          u.hp = R.rogueHeroFoundation.endure.floorHp;
          u.rogueEndureUsed = true;
          u.rogueEndureUntil = this.s.time + R.rogueHeroFoundation.endure.duration;
          this.event('rogueEndure', { actor: 'hero', class: 'rogue', duration: 2, hp: u.hp });
        }
        if (oldHp > u.hp && attacker) this.noteGatheringAttack(u, attacker);
        this.recordPartyChargeDamage(u, oldHp - u.hp);
        if (u === this.hero) this.recordDeveloperDamage('incoming', mitigated);
        if (R.resourceMode.manaEnabled && u === this.hero && manaDrain > 0)
          this.drainMana(u, manaDrain);
        // All life-steal uses actual HP lost after armor, immunity and overkill.
        // It never adds a second damage tick, heals other enemies, or uses a
        // percentage of the attacker's max HP as an artificial healing cap.
        // Previous mana-drain semantics remain available in legacy MP mode.
        if (!R.resourceMode.manaEnabled && rangedSourceId) {
          const source = this.zone().enemies.find((e) => e.id === rangedSourceId);
          const cinder = source?.species === 'ashbeast' && source.projectileStyle === 'cinder';
          const spectral =
            manaDrain > 0 &&
            (source?.species === 'wraith' ||
              (source?.type === 'boss' && R.vitalitySiphon.bossFamilies.includes(source.family)));
          if (source && source.hp > 0 && source.hp < source.maxHp && (cinder || spectral)) {
            const heal = Math.min(
              source.maxHp - source.hp,
              (oldHp - u.hp) * (cinder ? R.ashFeeding.healFraction : R.vitalitySiphon.healFraction),
            );
            if (heal > 0) {
              source.hp += heal;
              this.event(cinder ? 'ashFeeding' : 'lifeSiphon', {
                source: source.id,
                target: u === this.hero ? 'hero' : u.id,
                amount: heal,
                x: source.x,
                y: source.y,
                fromX: u.x,
                fromY: u.y,
              });
            }
          }
        }
        this.event('hurt', { x: u.x, y: u.y, target: u === this.hero ? 'hero' : u.id });
        if (u === this.hero && this.s.mode === 'developer' && u.hp === 0) {
          u.hp = u.maxHp;
          this.event('heal', { x: u.x, y: u.y, target: 'hero', amount: u.maxHp });
        }
        if (u.hp === 0) {
          u.slow = 0;
          delete u.slowStacks;
          this.tacticalClearScatter(u);
          if (u === this.hero)
            this.die({ source: rangedSourceId, damage: mitigated, hpBefore: oldHp });
        }
        return true;
      }

      distanceToSegment(p, a, b) {
        const dx = b.x - a.x,
          dy = b.y - a.y,
          t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
        return dist(p, { x: a.x + t * dx, y: a.y + t * dy });
      }
      updateProjectiles(dt) {
        const hero = this.hero,
          zone = this.zoneId,
          deaths = this.s.statistics.deaths;
        for (const p of [...this.s.projectiles]) {
          if (p.cancelledChargedOpener) continue;
          if (p.delay > 0) {
            p.delay -= dt;
            continue;
          }
          if (p.source === 'enemy') {
            if (!p.fortChecked) {
              p.fortChecked = true;
              if (!p.fortId)
                this.prepareFortProjectile(
                  p,
                  this.zone().enemies.find((e) => e.id === p.sourceId),
                );
            }
            const fort = this.projectileFort(p);
            const elapsed = p.rangedArc ? Math.min(dt, Math.max(0, p.life)) : dt;
            p.life -= elapsed;
            const before = { x: p.x, y: p.y };
            p.x += p.dx * p.speed * elapsed;
            p.y += p.dy * p.speed * elapsed;
            let terrainContact = null,
              terrainFraction = Infinity;
            if (!(fort ? this.fortShotClear(before, p, fort) : this.clearSegment(before, p, 0))) {
              // Report the actual first obstruction, rather than the previous frame's origin.
              const steps = Math.max(1, Math.ceil(dist(before, p) / 4));
              const blocked = (point) =>
                fort
                  ? this.fortShotBlocked(point, fort)
                  : this.blocked(point.x, point.y, this.zoneId, 0);
              const pointAt = (t) => ({
                x: before.x + (p.x - before.x) * t,
                y: before.y + (p.y - before.y) * t,
              });
              for (let j = 0; j <= steps; j++) {
                const point = {
                  x: before.x + ((p.x - before.x) * j) / steps,
                  y: before.y + ((p.y - before.y) * j) / steps,
                };
                if (blocked(point)) {
                  let low = Math.max(0, (j - 1) / steps),
                    high = j / steps;
                  // Refine only an actual obstruction; ordinary flights retain
                  // their existing inexpensive segment/collision checks.
                  for (let k = 0; k < 12; k++) {
                    const middle = (low + high) / 2;
                    if (blocked(pointAt(middle))) high = middle;
                    else low = middle;
                  }
                  terrainFraction = high;
                  terrainContact = pointAt(high);
                  break;
                }
              }
              // A conservative failure to localize a rejected segment must
              // never turn it into permission to shoot through terrain.
              terrainContact ||= before;
              if (terrainFraction === Infinity) terrainFraction = 0;
            }
            const radius = p.hitRadius ?? (p.style === 'cargo' ? 34 : 22);
            const victim = this.combatTargets().find(
              (u) =>
                this.distanceToSegment(u, before, p) < radius &&
                sweptCircleEntry(u, before, p, radius) < terrainFraction,
            );
            if (terrainContact && !victim) {
              this.enemyVfxProjectileImpact?.(p, { ...terrainContact, terrain: true });
              if (p.style === 'cargo')
                this.event('projectileImpact', {
                  actor: 'enemy',
                  source: p.sourceId || 'enemy',
                  species: 'cargo',
                  style: 'cargo',
                  terrain: true,
                  x: terrainContact.x,
                  y: terrainContact.y,
                });
              this.s.projectiles.splice(this.s.projectiles.indexOf(p), 1);
              continue;
            }
            if (victim) {
              const landed = this.hitParty(victim, p.damage, p.manaDrain || 0, p.sourceId);
              if (this.hero !== hero || this.zoneId !== zone || this.s.statistics.deaths !== deaths)
                return;
              if (landed && p.slow) this.applySlow(victim, p.slow);
              if (landed && victim.hp > 0 && p.style === 'cargo') {
                const away = this.safe(victim.x + p.dx * 75, victim.y + p.dy * 75);
                if (this.clearSegment(victim, away)) {
                  victim.x = away.x;
                  victim.y = away.y;
                }
              }
              this.enemyVfxProjectileImpact?.(p, {
                x: victim.x,
                y: victim.y,
                target: victim === this.hero ? 'hero' : victim.id,
              });
              this.event('projectileImpact', {
                actor: 'enemy',
                source: p.sourceId || 'enemy',
                species: p.species,
                style: p.style || 'arrow',
                x: victim.x,
                y: victim.y,
                target: victim === this.hero ? 'hero' : victim.id,
              });
              p.life = 0;
            }
            if (!victim && p.rangedArc && p.life <= 0 && !this.peace) {
              this.enemyVfxProjectileImpact?.(p, { x: p.x, y: p.y, terrain: true });
              this.event('projectileImpact', {
                actor: 'enemy',
                source: p.sourceId || 'enemy',
                species: p.species,
                style: p.style || 'arrow',
                terrain: true,
                x: p.x,
                y: p.y,
              });
            }
            if (p.life <= 0 || (!fort && !this.line(before, p)) || this.peace)
              this.s.projectiles.splice(this.s.projectiles.indexOf(p), 1);
            if (this.hero !== hero || this.s.challenge.pending || this.s.challenge.gameOver) return;
            continue;
          }
          const e = this.zone().enemies.find(
            (e) =>
              e.id === p.target &&
              e.hp > 0 &&
              !e.neutral &&
              (p.area || this.tacticalDirectTargetable(e)),
          );
          if (!e || this.peace) {
            this.s.projectiles.splice(this.s.projectiles.indexOf(p), 1);
            continue;
          }
          if (p.rangerDelayedLaunch && p.source === 'hero' && hero.class === 'ranger') {
            // Each bow release is a physical event, not a snapshot from the
            // original button press. Move the REAL projectile to the living
            // Ranger and aim at the foe's position at this sub-launch only.
            // Once fired it follows the ordinary independent collision path.
            const distance = Math.max(1, dist(hero, e));
            p.x = hero.x;
            p.y = hero.y;
            p.dx = (e.x - hero.x) / distance;
            p.dy = (e.y - hero.y) / distance;
            delete p.rangerDelayedLaunch;
            // This receipt belongs to the actual moving bow, not the
            // earlier event that scheduled several delayed shafts.
            this.event('projectileLaunch', {
              actor: 'hero',
              class: 'ranger',
              source: 'hero',
              slot: p.slot || 1,
              style: p.style || 'arrow',
              charged: !!p.charged,
              rapid: !!p.rapid,
              projectileId: p.id,
              releasedCount: 1,
              x: p.x,
              y: p.y,
              target: e.id,
            });
          }
          if (p.companionDelayedLaunch) {
            // Delayed Triple Shot members do not materialize at the Archer's
            // former coordinates. Release them from the living companion's
            // current bow and keep that real flight path independent thereafter.
            const caster = this.s.party.find((u) => u.id === p.source && u.type === 'archer');
            if (!caster || caster.hp <= 0 || caster.active === false) {
              this.s.projectiles.splice(this.s.projectiles.indexOf(p), 1);
              continue;
            }
            const distance = Math.max(1, dist(caster, e));
            p.x = caster.x;
            p.y = caster.y;
            p.dx = (e.x - caster.x) / distance;
            p.dy = (e.y - caster.y) / distance;
            delete p.companionDelayedLaunch;
            this.event('projectileLaunch', {
              actor: 'companion',
              role: 'archer',
              source: caster.id,
              style: 'arrow',
              special: 'triple-shot',
              // The initial legacy three-shot sound has already scheduled
              // the volley. A real later subrelease is an observable event,
              // NOT a second full three-shot audio/performance cue.
              presentationHandled: true,
              projectileId: p.id,
              releasedCount: 1,
              x: caster.x,
              y: caster.y,
              target: e.id,
            });
          }
          // Additive transient observation, after the existing stagger delay.
          if (p.source === 'hero' && !p.heroFlightPresented) {
            p.heroFlightPresented = true;
            this.event('heroProjectileFlight', {
              actor: 'hero',
              class: hero.class,
              slot: p.slot || 1,
              x: p.x,
              y: p.y,
              target: p.target,
              style: p.style,
              charged: !!p.charged,
              piercing: !!p.piercing,
              effect: p.effect,
            });
          }
          // Ordinary Mage Skill 1 alone steers gently toward its ORIGINAL
          // target. Other projectiles and the charged wide corridor stay fixed.
          if (p.mageSkill1Homing) {
            const desired = Math.atan2(e.y - p.y, e.x - p.x),
              current = Math.atan2(p.dy, p.dx),
              delta = Math.atan2(Math.sin(desired - current), Math.cos(desired - current)),
              turn = Math.max(-1.6 * dt, Math.min(1.6 * dt, delta)),
              launch = p.launchHeading ?? current,
              attempted = current + turn,
              deviation = Math.atan2(Math.sin(attempted - launch),
                Math.cos(attempted - launch)),
              heading = launch + Math.max(-Math.PI / 10,
                Math.min(Math.PI / 10, deviation));
            p.dx = Math.cos(heading);
            p.dy = Math.sin(heading);
          }
          // Sweep the physical frame segment, including every curved-flight
          // step, so damage never precedes the actual visible front.
          const flight = R.balance.friendlyProjectiles,
            elapsed = Math.min(dt, p.life ?? flight.lifeSeconds),
            before = { x: p.x, y: p.y },
            step = Math.min(
              p.speed * elapsed,
              p.mageSkill1Homing ? Math.max(0, p.travelBudget - (p.traveled || 0)) : Infinity,
            );
          p.life = (p.life ?? flight.lifeSeconds) - elapsed;
          p.x += p.dx * step;
          p.y += p.dy * step;
          if (p.mageSkill1Homing) {
            p.traveled = (p.traveled || 0) + step;
            const points = (p.trailPoints ||= [{ x: p.originX, y: p.originY }]),
              last = points[points.length - 1];
            if (Math.hypot(p.x - last.x, p.y - last.y) >= 8) {
              points.push({ x: p.x, y: p.y });
              // Preserve the caster origin and bound save/rendering work.
              if (points.length > 64) points.splice(1, points.length - 64);
            }
          }
          if (!this.clearSegment(before, p, 0)) {
            if (p.source === 'hero')
              this.event('projectileImpact', {
                actor: 'hero',
                source: 'hero',
                class: hero.class,
                slot: p.slot || 1,
                style: p.style,
                effect: p.effect,
                charged: !!p.charged,
                x: before.x,
                y: before.y,
                landed: false,
                blocked: true,
              });
            this.s.projectiles.splice(this.s.projectiles.indexOf(p), 1);
            continue;
          }
          if (this.distanceToSegment(e, before, p) < flight.hitRadius) {
            // Royal Prerogative only redirects actual approaching projectiles
            // into an existing living Crown summon crossing the flight path.
            const guard =
              !p.piercing &&
              e.family === 'darklord' &&
              !this.invalidChargedOpener(e, p.encountersAtStart) &&
              this.s.time >= (e.royalPrerogativeReadyAt || 0)
                ? this.zone().enemies.find(
                    (unit) =>
                      unit.owner === e.id &&
                      unit.summon &&
                      unit.hp > 0 &&
                      dist(unit, e) < 165 &&
                      this.distanceToSegment(unit, before, p) < 45 &&
                      this.line(unit, e),
                  )
                : null;
            const victim = guard || e;
            const contactPoint = { x: victim.x, y: victim.y };
            if (guard) e.royalPrerogativeReadyAt = this.s.time + 18;
            const landed =
              p.effect === 'interrupt'
                ? this.interruptEnemyAction(victim, p.interruptAction, p.criticalExecution)
                : this.damage(
                    victim,
                    p.damage,
                    p.source,
                    p.encountersAtStart || p.area || p.piercing || p.automaticBasic
                      ? {
                          ...(p.encountersAtStart
                            ? { encountersAtStart: p.encountersAtStart }
                            : {}),
                          ...(p.area ? { area: true } : {}),
                          ...(p.piercing ? { piercing: true } : {}),
                          ...(p.automaticBasic ? { automaticBasic: true } : {}),
                        }
                      : null,
                  );
            if (this.hero !== hero || this.zoneId !== zone || this.s.statistics.deaths !== deaths)
              return;
            if (p.cancelledChargedOpener) continue;
            if (landed && p.basicComboFinisher)
              this.basicComboFinisher(
                victim,
                { x: p.finisherFromX, y: p.finisherFromY },
                p.finisherBaseDamage,
                p.source,
                p.comboClass || this.hero.class,
                !!p.automaticBasic,
              );
            if (landed && p.petSkillSlot) {
              const pet = this.s.party.find((unit) => unit.id === p.source && unit.type === 'pet');
              if (pet)
                this.petSkillContact(
                  pet, victim, p.petSkillSlot, 1,
                  p.criticalExecution || null,
                  { x: p.launchX ?? pet.x, y: p.launchY ?? pet.y },
                );
            }
            if (landed && p.fractureFraction)
              this.fractureEnemy(victim, p.fractureFraction, p.fractureDuration);
            if (landed && p.tauntDuration) {
              const duration =
                victim.type === 'boss' ? Math.min(2.5, p.tauntDuration) : p.tauntDuration;
              victim.tauntUntil = Math.max(victim.tauntUntil || 0, this.s.time + duration);
            }
            if (landed && p.slow) this.applySlow(victim, p.slow);
            if (landed && p.rangerVolleySlow) this.applySlow(victim, p.rangerVolleySlow);
            if (landed && p.push && victim.hp > 0 && p.source === 'hero')
              this.shieldPush(victim, p.push);
            this.event('projectileImpact', {
              actor: p.source === 'hero' ? 'hero' : 'companion',
              class: p.source === 'hero' ? this.hero.class : undefined,
              role: p.source === 'hero' ? undefined : p.style === 'pet' ? 'pet' : 'archer',
              source: p.source,
              style: p.style || 'arrow',
              effect: p.effect,
              slot: p.slot,
              x: contactPoint.x,
              y: contactPoint.y,
              target: victim.id,
              charged: !!p.charged,
              landed: !!landed,
              piercing: !!p.piercing,
              directionX: p.dx,
              directionY: p.dy,
            });
            if (p.charged && (!p.rapid || p.chargedBurst))
              this.event('chargedImpact', {
                actor: 'hero',
                source: 'hero',
                x: e.x,
                y: e.y,
                class: this.hero.class,
              });
            this.s.projectiles.splice(this.s.projectiles.indexOf(p), 1);
          } else if (
            p.life <= 0 ||
            (p.mageSkill1Homing && p.traveled >= p.travelBudget)
          ) {
            this.s.projectiles.splice(this.s.projectiles.indexOf(p), 1);
          }
        }
        this.rechargeOwnMud(dt);
        this.snapshotPassiveRegen(dt);
        for (const a of [...this.s.hazards]) {
          if (a.family === 'mire' && a.index === 2 && a.kind === 'circle') {
            for (const u of this.combatTargets()) {
              if (u.hp <= 0 || dist(u, a) >= a.radius) continue;
              if ((u.mireBogLastAt || -100) < this.s.time - dt * 1.5) u.mireBogExposure = 0;
              if (u.mireBogLastAt !== this.s.time)
                u.mireBogExposure = Math.min(4, (u.mireBogExposure || 0) + dt);
              u.mireBogLastAt = this.s.time;
            }
          }
          a.life -= dt;
          a.tick -= dt;
          const previousRadius = a.radius || 0;
          a.age = a.slowOnly ? Math.min(a.waveLife, (a.age || 0) + dt) : (a.age || 0) + dt;
          if (a.kind === 'ring') {
            a.radius = a.age * (a.waveSpeed || R.combatGeometry.ringSpeed);
            for (const u of this.combatTargets()) {
              const id = u === this.hero ? 'hero' : u.id;
              if (
                !a.hit.includes(id) &&
                (a.slowOnly
                  ? dist(u, a) >= previousRadius - R.combatGeometry.ringHalfWidth &&
                    dist(u, a) <= a.radius + R.combatGeometry.ringHalfWidth
                  : Math.abs(dist(u, a) - a.radius) < R.combatGeometry.ringHalfWidth) &&
                this.line(a, u)
              ) {
                a.hit.push(id);
                if (a.slowOnly) this.applySlow(u, a.slowDuration);
                else {
                  const landed = this.hitParty(u, a.damage, a.manaDrain || 0, a.sourceId || null);
                  if (
                    this.hero !== hero ||
                    this.zoneId !== zone ||
                    this.s.statistics.deaths !== deaths
                  )
                    return;
                  if (landed) {
                    this.enemyVfxHazardImpact?.(a, u);
                    if (a.slowDuration && u.hp > 0) this.applySlow(u, a.slowDuration);
                  }
                }
              }
            }
          } else if (a.tick <= 0) {
            a.tick = 1;
            for (const u of this.combatTargets())
              if (dist(u, a) < a.radius && this.line({ x: a.fromX ?? a.x, y: a.fromY ?? a.y }, u)) {
                const landed = this.hitParty(u, a.damage, a.manaDrain || 0, a.sourceId || null);
                if (
                  this.hero !== hero ||
                  this.zoneId !== zone ||
                  this.s.statistics.deaths !== deaths
                )
                  return;
                if (landed) {
                  this.enemyVfxHazardImpact?.(a, u);
                  if (a.slow)
                    this.applySlow(
                      u,
                      this.regularSlowDuration(
                        this.zone().enemies.find((e) => e.id === a.sourceId),
                        a,
                        a.slowSeconds || 3,
                      ),
                    );
                }
              }
          }
          if (a.life <= 0 || this.peace) this.s.hazards.splice(this.s.hazards.indexOf(a), 1);
          if (hero !== this.hero || this.s.challenge.pending || this.s.challenge.gameOver) return;
        }
      }
    }
    for (const name of Object.getOwnPropertyNames(Combat.prototype))
      if (name !== 'constructor')
        Object.defineProperty(
          Campaign.prototype,
          name,
          Object.getOwnPropertyDescriptor(Combat.prototype, name),
        );
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeCombat = api;
})(typeof window !== 'undefined' ? window : globalThis);
