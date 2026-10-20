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
      depositTrips = new WeakMap();
    const companionJudgments = new WeakMap();

    class Party {
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
      companionRetreating(u) {
        if (u === this.hero || u.hp <= 0 || u.active === false || !this.s.party.includes(u))
          return false;
        if (this.s.recallActive) return dist(u, this.hero) > R.companionRecall.arrivalRadius;
        const state = companionJudgments.get(u);
        return !!(
          state?.zone === this.zoneId &&
          state.regrouping &&
          state.point &&
          !u.order &&
          dist(u, state.point) > R.companionJudgment.arrivalRadius
        );
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
        return u.type === 'pet'
          ? this.petDefinition(u)?.role === 'ranged'
            ? R.balance.companions.petBasicRange
            : 70
          : u.type === 'archer'
            ? 185
            : 65;
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
      companionCoverAttack(u, e) {
        if (this.companionCoveringShot(u, e)) return true;
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
        u.cd = 0.85 / this.companionRallyAttackSpeed(u);
        if (u.type === 'archer') {
          const d = Math.max(1, dist(u, e));
          this.s.projectiles.push({
            id: 'projectile-' + this.s.nextId++,
            x: u.x,
            y: u.y,
            dx: (e.x - u.x) / d,
            dy: (e.y - u.y) / d,
            target: e.id,
            damage: this.companionAttackDamage(u),
            source: u.id,
            speed: 450,
            style: 'arrow',
          });
          return true;
        }
        const hit = this.damage(e, this.companionAttackDamage(u), u.id);
        if (hit)
          this.event('melee', {
            actor: 'companion',
            role: 'soldier',
            source: u.id,
            weapon: 'sword',
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
            (a) => !a.order && dist(a, u) <= cfg.supportRadius && this.clearSegment(a, u),
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
            (u.hp / u.maxHp <= cfg.criticalFraction && nearby >= 1) ||
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
        const cfg = R.companionJudgment;
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
          (!state.regrouping && this.companionPursuitDetour(u))
        ) {
          const assessment = this.companionSafetyAssessment(u, target, living);
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
            ? this.companionRegroupPoint(u, living, assessment.enemies)
            : null;
        }
        if (!state.regrouping) return false;
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
          reach = u.type === 'archer' ? 185 : 65;
        if (!e || dist(e, u) > reach || !this.line(u, e) || !this.tacticalDirectTargetable(e))
          return;
        u.cd = 0.85 / this.companionRallyAttackSpeed(u);
        if (u.type === 'archer') {
          const d = Math.max(1, dist(u, e));
          this.s.projectiles.push({
            id: 'projectile-' + this.s.nextId++,
            x: u.x,
            y: u.y,
            dx: (e.x - u.x) / d,
            dy: (e.y - u.y) / d,
            target: e.id,
            damage: this.companionAttackDamage(u),
            source: u.id,
            speed: 450,
            style: 'arrow',
          });
        } else if (this.damage(e, this.companionAttackDamage(u), u.id))
          this.event('melee', {
            actor: 'companion',
            role: 'soldier',
            source: u.id,
            weapon: 'sword',
            x: e.x,
            y: e.y,
            target: e.id,
          });
      }
      gatheringRouteLength(u, target) {
        const path = this.companionRoute(u, target, true);
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
      nameCompanion(id, value) {
        const unit = this.s.party.find((u) => u.id === id),
          name = normalizeCharacterName(value);
        if (!unit || !name || unit.customName) return false;
        unit.customName = name;
        return true;
      }
      companionDisplayName(unit) {
        if (unit.customName) return unit.customName;
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
      companionRallyMoveSpeed(u, base) {
        return (
          this.companionMoveSpeed(base) *
          (this.rangerRallyActive(u) ? 1 + Math.min(0.25, u.rangerRallyMovement || 0) : 1)
        );
      }
      companionRallyAttackSpeed(u) {
        return this.rangerRallyActive(u) ? 1 + Math.min(0.2, u.rangerRallyAttack || 0) : 1;
      }
      companionAttackDamage(u) {
        return u.damage + this.hero.level * 2 + this.companionInheritedDamageBonus();
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
        if (u.type === 'pet') return this.usePetSkill(u, target, 1);
        if (!['soldier', 'archer'].includes(u.type)) return false;
        const cfg = R.companionSkills?.first,
          def = cfg?.[u.type];
        if (!cfg || !def || !target || (u.skill1Cd || 0) > 0) return false;
        const base = this.companionAttackDamage(u);
        if (u.type === 'soldier') {
          if (dist(u, target) > 80 || !this.line(u, target)) return false;
          if (!this.damage(target, base * cfg.multiplier, u.id)) return false;
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
            weapon: 'sword',
            x: target.x,
            y: target.y,
            target: target.id,
            special: 'power-strike',
          });
          this.event('swing', {
            actor: 'companion',
            role: 'soldier',
            source: u.id,
            weapon: 'sword',
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
            damage: base,
            source: u.id,
            speed: 520,
            delay: j * 0.08,
            style: 'arrow',
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
          style: 'arrow',
          count: 3,
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
        if (
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
        const base = this.companionAttackDamage(u),
          damage = base * def.multiplier,
          angle = Math.atan2(target.y - u.y, target.x - u.x);
        let hits = 0;
        for (const e of targets) if (this.damage(e, damage, u.id, { area: true })) hits++;
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
                weapon: 'sword',
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
          x: target.x,
          y: target.y,
          fromX: u.x,
          fromY: u.y,
          angle,
          radius: 0,
          range: def.range || 0,
          halfAngle: def.halfAngle || 0,
          halfWidth: def.halfWidth || 0,
          hits,
        });
        this.event('companionSkill', {
          source: u.id,
          unitType: u.type,
          skill: u.type === 'soldier' ? 'holy-cleave' : 'piercing-volley',
          targetId: target.id,
          hits,
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
      companionTrySkill(u, target) {
        if (
          !target ||
          (u.skillGlobalCd || 0) > 0 ||
          this.mageSilenceActive(u) ||
          this._companionCharges?.has(u.id)
        )
          return false;
        const secondReady = this.companionSecondSkillUnlocked() && (u.skill2Cd || 0) <= 0,
          secondTargets = secondReady ? this.companionSecondSkillTargets(u, target) : [];
        if (
          secondReady &&
          (secondTargets.length >= 2 || (u.skill1Cd || 0) > 0) &&
          this.companionUseSecondSkill(u, target, secondTargets)
        )
          return true;
        if ((u.skill1Cd || 0) <= 0 && this.companionUseFirstSkill(u, target)) return true;
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
      queuedCompanions() {
        return Object.values(this.s.zones).reduce(
          (n, z) => n + z.buildings.filter((b) => b.queue > 0).length,
          0,
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
      depositSite(u) {
        const z = this.isDungeon() ? this.s.zones[this.definition().id] : this.zone(),
          i = this.regionIndex(),
          sites = [
            ...(z?.npcs.filter((n) => n.kind === 'rest') || []),
            ...(this.isDungeon()
              ? []
              : z?.buildings.filter((b) => b.progress >= 4 && b.full) || []),
            { x: D.towns[i][0], y: D.towns[i][1] },
          ];
        if (!this.gatheringUnit(u) || this.isDungeon())
          return sites.sort((a, b) => dist(a, u) - dist(b, u))[0];
        const cached = depositTrips.get(u);
        if (
          cached?.zone === this.zoneId &&
          cached.until > this.s.time &&
          (!cached.site || sites.some((p) => p.x === cached.site.x && p.y === cached.site.y))
        )
          return cached.site;
        let site = null,
          best = Infinity;
        const seen = new Set();
        for (const candidate of sites.sort((a, b) => dist(a, u) - dist(b, u))) {
          const key = candidate.x + ':' + candidate.y;
          if (seen.has(key) || dist(candidate, u) >= best) continue;
          seen.add(key);
          const length = this.gatheringRouteLength(u, candidate);
          if (length < best) {
            site = candidate;
            best = length;
          }
        }
        depositTrips.set(u, {
          zone: this.zoneId,
          until: this.s.time + R.gatheringTravel.replanSeconds,
          site,
        });
        return site;
      }
      availableRangers(type) {
        const key = type === 'health' ? 'healCd' : 'manaCd';
        return this.activeLivingParty().filter(
          (u) => u.type === 'archer' && !u.keeperHeld && (u[key] || 0) <= 0,
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
      rangerSupport(type, manual = true, targetOverride = null) {
        if (type === 'mana' && !R.resourceMode.manaEnabled) return false;
        if (
          !['health', 'mana'].includes(type) ||
          this.s.challenge.pending ||
          this.s.challenge.gameOver
        )
          return false;
        const rangers = this.availableRangers(type).filter((u) => !this.mageSilenceActive(u)),
          key = type === 'health' ? 'healCd' : 'manaCd';
        if (!rangers.length) {
          if (manual) {
            const active = this.activeLivingParty().filter((u) => u.type === 'archer');
            if (!active.length)
              this.say(
                'No active Ranger is available to use ' +
                  (type === 'health' ? 'Heal.' : 'Mana Recovery.'),
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
            amount = this.rangerSupportAmount(type);
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
          amount = this.rangerSupportAmount(type);
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
            u[field] = Math.min(u[max], u[field] + amount);
            e.remaining = Math.max(0, e.remaining - amount);
            e.seconds = Math.max(0, e.seconds - step);
            if (e.seconds > 0 && e.remaining > 0 && u[field] < u[max]) next.push(e);
          }
          u.supportEffects = next;
        }
      }
      autoRangerSupport() {
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
        if (
          R.resourceMode.manaEnabled &&
          h.mp < h.maxMp &&
          h.mp <= h.maxMp * manaThreshold &&
          !this.hasSupportEffect(h, 'mana')
        )
          this.rangerSupport('mana', false);
      }
      recruit(type) {
        const price = this.recruitPrice(type);
        if ((this.s.expeditionRank || 1) < 2) {
          this.say(
            'Recruitment unlocks at Expedition 2. Rescue Mira and train the Expedition Skill.',
          );
          return false;
        }
        if (!price) return false;
        if (this.rosterCount() >= 3) {
          this.say('Town recruitment limit reached. Build a barracks to recruit more companions.');
          return false;
        }
        if (!this.spend(price)) return false;
        const p = this.safe(this.hero.x + 50, this.hero.y + 50),
          u = this.unit(type, p.x, p.y);
        u.active = this.activeParty().length < this.expeditionPartyCap();
        this.s.party.push(u);
        return true;
      }
      recover() {
        const dead = this.s.party.find((u) => u.hp <= 0);
        if (!dead || !this.spend(this.companionRecoveryCost())) return false;
        const id = dead.id,
          active = dead.active !== false,
          u = this.unit(dead.type, this.hero.x + 40, this.hero.y, dead.petFamily);
        this.clearPartyCharge(dead);
        this.clearCompanionJudgment(dead);
        this._partyChargeRecovery?.delete(dead);
        this.tacticalClearScatter(dead);
        Object.assign(dead, u, { id, active, slow: 0 });
        delete dead.rogueSlow;
        return true;
      }
      treatCompanions() {
        const wounded = this.s.party.filter((u) => u.hp > 0 && u.hp < u.maxHp);
        if (!wounded.length) return false;
        if (this.refugeThreat()) {
          this.say(
            'Cannot treat companions while nearby enemies are engaged. Retreat and end the fight first.',
          );
          return false;
        }
        if (!this.spend(this.companionTreatmentCost())) return false;
        for (const u of wounded) {
          u.hp = u.maxHp;
          this.event('heal', { x: u.x, y: u.y, resource: 'health', target: u.id });
        }
        this.say(
          'Living companions treated at the barracks. Fallen companions still require recovery.',
        );
        return true;
      }
      availableLabor() {
        return this.activeLivingParty().filter(
          (u) => ['soldier', 'archer'].includes(u.type) && !u.order,
        );
      }
      restCompanion(id) {
        const u = this.s.party.find((u) => u.id === id && u.active !== false);
        if (!u || this.refugeThreat()) return false;
        this.clearPartyCharge(u);
        this.clearCompanionJudgment(u);
        u.active = false;
        u.order = null;
        u.path = [];
        return true;
      }
      activateCompanion(id, barracksId) {
        const u = this.s.party.find((u) => u.id === id && u.active === false),
          b = this.zone().buildings.find((b) => b.id === barracksId && b.progress >= 4);
        if (
          !u ||
          !b ||
          u.hp <= 0 ||
          this.refugeThreat() ||
          this.activeParty().length >= this.barracksFieldCap(b)
        )
          return false;
        u.active = true;
        this.clearCompanionJudgment(u);
        Object.assign(u, this.safe(b.x + 45, b.y + 45));
        u.order = null;
        return true;
      }
      dismissCompanion(id) {
        const i = this.s.party.findIndex((u) => u.id === id && u.active === false);
        if (i < 0) return false;
        if (this.s.party[i].type === 'pet') {
          this.say('Boss pets stay in your collection. Rest them or recover them at a Barracks.');
          return false;
        }
        this.s.party.splice(i, 1);
        return true;
      }
      squadDefaultDoctrine() {
        return this.hero.class === 'paladin' ? 'focus' : 'guard';
      }
      squadThreats() {
        return this.zone().enemies.filter(
          (e) =>
            e.hp > 0 &&
            !e.neutral &&
            !e.returning &&
            this.tacticalDirectTargetable(e) &&
            e.aggro &&
            dist(e, this.hero) < (e.type === 'boss' || e.summon ? 720 : 540),
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
        this.notice('Recall ordered. Companions return under retreat protection.', 4);
        this.event('squadRecall');
        return true;
      }
      partyFormationOffset(u, living = this.activeLivingParty()) {
        if (u.type === 'pet') {
          // Mixed pets have their own six distinct ring positions, outside troop lanes.
          const pets = living.filter((v) => v.type === 'pet' && !v.order);
          const i = Math.max(0, pets.indexOf(u));
          const side = i % 2 ? 1 : -1;
          const row = Math.floor(i / 2);
          return [
            side * (130 + row * 35),
            this.petDefinition(u)?.role === 'ranged' ? -95 - row * 35 : 25 + row * 35,
          ];
        }
        const rangedHero = this.hero.class === 'mage' || this.hero.class === 'ranger',
          same = living.filter((v) => v.type === u.type && !v.order),
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
            ],
            soldier: [
              [0, 95],
              [-90, 45],
              [90, 45],
              [-110, -25],
              [110, -25],
              [0, -105],
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
            ],
            archer: [
              [-65, -115],
              [65, -115],
              [0, -145],
              [-105, -145],
              [105, -145],
              [0, -175],
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
          preferred = 250,
          anchorRange = dist(anchor, e);
        if (anchorRange <= 280 && this.line(anchor, e)) return anchor;
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
      updateParty(dt) {
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
            u.type === 'soldier' &&
            u.hp <= u.maxHp * 0.5 &&
            !this.mageSilenceActive(u) &&
            (u.survivalCd || 0) <= 0
          ) {
            u.survivalCd = 14;
            u.immune = Math.max(u.immune || 0, 2.5);
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
        for (const u of living) {
          const recovery = this.cooldownRecoveryElapsed(u, dt);
          u.slow = Math.max(0, (u.slow || 0) - dt);
          if (u.rogueSlow > 0) {
            u.rogueSlow = Math.max(0, u.rogueSlow - dt);
            if (!u.rogueSlow) delete u.rogueSlow;
          }
          u.cd = Math.max(0, u.cd - recovery);
          u.skill1Cd = Math.max(0, (u.skill1Cd || 0) - recovery);
          u.skill2Cd = Math.max(0, (u.skill2Cd || 0) - recovery);
          u.skillGlobalCd = Math.max(0, (u.skillGlobalCd || 0) - recovery);
          // Thornfang scatter overrides orders, doctrine and combat until
          // forced movement ends; then the unit resumes its normal assignment.
          if (u.deathRollHeld || u.keeperHeld || this.tacticalAdvanceScatter(u, dt)) {
            if (this._companionCharges?.has(u.id)) {
              this._companionCharges.delete(u.id);
              this.clearPartyCharge(u);
            }
            continue;
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
          if (u.type === 'pet') u.order = null; // Pets never perform troop labor.
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
          if (u.order?.type === 'gather') {
            this.gatheringCounterattack(u);
            const n = z.nodes.find((n) => n.id === u.order.id);
            if (n && n.amount > 0 && (!n.mini || this.peace || this.miniCleared(n.mini))) {
              if (dist(u, n) > 60)
                this.follow(
                  u,
                  n,
                  this.companionRallyMoveSpeed(u, 230) *
                    this.slowMovementFactor(u) *
                    this.mireBogMovementFactor(u) *
                    this.ashMovementFactor(u),
                  dt,
                );
              else {
                const amount = Math.min(n.amount, 12 * dt);
                n.amount = Math.max(0, n.amount - amount);
                u.carry += amount;
                this.s.gathered[this.definition().id] =
                  (this.s.gathered[this.definition().id] || 0) + amount;
              }
              if (u.carry >= 35 || n.amount <= 0)
                u.order = { type: 'deposit', id: n.id, group: n.resourceGroup };
            } else u.order = { type: 'deposit', id: u.order.id, group: u.order.group };
            continue;
          }
          if (u.order?.type === 'deposit') {
            this.gatheringCounterattack(u);
            const deposit = this.depositSite(u);
            if (!deposit) continue;
            if (dist(u, deposit) > 130)
              this.follow(
                u,
                deposit,
                this.companionRallyMoveSpeed(u, 230) *
                  this.slowMovementFactor(u) *
                  this.mireBogMovementFactor(u) *
                  this.ashMovementFactor(u),
                dt,
              );
            else {
              const payout = this.resourceDepositReward(u.carry);
              this.grant(payout, 0);
              u.carry = Math.max(0, u.carry - payout);
              const current = z.nodes.find(
                  (n) => n.id === u.order.id && n.amount > 0 && this.tributeKnown(n),
                ),
                next =
                  current ||
                  z.nodes
                    .filter(
                      (n) =>
                        u.order.group &&
                        n.resourceGroup === u.order.group &&
                        n.amount > 0 &&
                        this.tributeKnown(n) &&
                        (!n.mini || this.peace || this.miniCleared(n.mini)),
                    )
                    .map((n) => ({ node: n, length: this.gatheringRouteLength(u, n) }))
                    .sort((a, b) => a.length - b.length || dist(a.node, u) - dist(b.node, u))[0]
                    ?.node;
              u.order = next ? { type: 'gather', id: next.id, group: next.resourceGroup } : null;
              depositTrips.delete(u);
              this.clearCompanionTravel(u);
              if (!next) this.clearGatheringIntent(u);
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
              const pet = u.type === 'pet' ? this.petDefinition(u) : null;
              const reach = pet
                ? pet.role === 'ranged'
                  ? R.balance.companions.petBasicRange
                  : 70
                : u.type === 'archer'
                  ? 185
                  : 65;
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
                u.cd = 0.85 / this.companionRallyAttackSpeed(u);
                if (u.type === 'archer') {
                  const d = Math.max(1, dist(u, pursuer));
                  this.s.projectiles.push({
                    id: 'projectile-' + this.s.nextId++,
                    x: u.x,
                    y: u.y,
                    dx: (pursuer.x - u.x) / d,
                    dy: (pursuer.y - u.y) / d,
                    target: pursuer.id,
                    damage: this.companionAttackDamage(u),
                    source: u.id,
                    speed: 450,
                    style: 'arrow',
                  });
                } else if (this.damage(pursuer, this.companionAttackDamage(u), u.id))
                  this.event('melee', {
                    actor: 'companion',
                    role: 'soldier',
                    source: u.id,
                    weapon: 'sword',
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
          this._tacticalPartyTargets.set(u.id, e.id);
          if (u.type === 'pet') {
            this.updatePetCombat(u, e, living, dt);
            continue;
          }
          if (u.type === 'archer') {
            const d = dist(u, e),
              visible = this.line(u, e),
              anchor = this.partyFollowPoint(u, living);
            if (d < 150) {
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
              continue;
            }
            if (d > 280 || !visible) {
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
              continue;
            }
            if (dist(u, anchor) > 70 && dist(anchor, e) <= 280 && this.line(anchor, e)) {
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
              continue;
            }
            if (this.companionTrySkill(u, e)) continue;
            if (u.cd <= 0) {
              u.cd = 0.85 / this.companionRallyAttackSpeed(u);
              const shot = Math.max(1, d);
              this.s.projectiles.push({
                id: 'projectile-' + this.s.nextId++,
                x: u.x,
                y: u.y,
                dx: (e.x - u.x) / shot,
                dy: (e.y - u.y) / shot,
                target: e.id,
                damage: this.companionAttackDamage(u),
                source: u.id,
                speed: 450,
                style: 'arrow',
              });
              this.event('projectileLaunch', {
                actor: 'companion',
                role: 'archer',
                source: u.id,
                style: 'arrow',
                x: u.x,
                y: u.y,
                target: e.id,
              });
            }
            continue;
          }
          if (u.type !== 'soldier') continue;
          if (this.line(u, e) && dist(u, e) <= 185 && this.companionTrySkill(u, e)) continue;
          if (dist(u, e) > 65 || !this.line(u, e))
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
            u.cd = 0.85 / this.companionRallyAttackSpeed(u);
            if (this.damage(e, this.companionAttackDamage(u), u.id))
              this.event('melee', {
                actor: 'companion',
                role: 'soldier',
                source: u.id,
                weapon: 'sword',
                x: e.x,
                y: e.y,
                target: e.id,
              });
          }
        }
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
