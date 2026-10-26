/* Boss attack selection, sequences, geometry, summons and attack resolution. Shared with captain/night attacks where the existing rules reuse these primitives. */
(function (root) {
  'use strict';
  function install(Campaign, { R }) {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const originalRogueMove = Campaign.prototype.tacticalResolveRogueMove;
    const mobility = new WeakMap(),
      returns = new WeakMap();
    class BossCombat {
      fieldBossOpenDirections(point) {
        const cfg = R.fieldBossMobility;
        let open = 0;
        for (let j = 0; j < cfg.directions; j++) {
          const a = (j * Math.PI * 2) / cfg.directions;
          if (
            this.clearSegment(
              point,
              {
                x: point.x + Math.cos(a) * cfg.roomRadius,
                y: point.y + Math.sin(a) * cfg.roomRadius,
              },
              cfg.bodyRadius,
            )
          )
            open++;
        }
        return open;
      }
      fieldBossRecoveryPoint(e) {
        const cfg = R.fieldBossMobility,
          home = e.home || e;
        for (const radius of cfg.recoveryRings)
          for (let j = 0; j < (radius ? cfg.directions : 1); j++) {
            const a = (j * Math.PI * 2) / cfg.directions,
              p = { x: home.x + Math.cos(a) * radius, y: home.y + Math.sin(a) * radius };
            if (
              this.blocked(p.x, p.y, this.zoneId, cfg.bodyRadius) ||
              this.fieldBossOpenDirections(p) < cfg.recoveryDirections
            )
              continue;
            if (
              this.zone().npcs.some(
                (n) =>
                  ['rest', 'shop', 'transport', 'teacher'].includes(n.kind) &&
                  dist(n, p) < cfg.serviceClearance,
              )
            )
              continue;
            if (
              [this.hero, ...this.activeLivingParty()].some(
                (u) => u.hp > 0 && dist(u, p) < cfg.landingClearance,
              )
            )
              continue;
            if (
              this.zone().enemies.some(
                (u) =>
                  u !== e && u.hp > 0 && dist(u, p) < cfg.bodyRadius + this.actorRadius(u) + 20,
              )
            )
              continue;
            return p;
          }
        return null;
      }
      fieldBossMobilityReset(e, target, dt) {
        if (
          e.type !== 'boss' ||
          this.boss(e.family).kind !== 'field' ||
          this.isDungeon() ||
          !e.aggro ||
          e.returning ||
          e.hp <= 0 ||
          e.neutral
        )
          return null;
        const cfg = R.fieldBossMobility;
        let state = mobility.get(e);
        if (
          !state ||
          state.zone !== this.zoneId ||
          this.s.time - (state.lastTick || this.s.time) > cfg.sampleSeconds * 2
        ) {
          state = { zone: this.zoneId, elapsed: 0, confined: 0, stalled: 0, x: e.x, y: e.y };
          mobility.set(e, state);
        }
        state.lastTick = this.s.time;
        state.elapsed += dt;
        if (state.elapsed < cfg.sampleSeconds) return null;
        const elapsed = state.elapsed;
        state.elapsed = 0;
        const travel = Math.hypot(e.x - state.x, e.y - state.y),
          confined = this.fieldBossOpenDirections(e) < cfg.minimumDirections,
          pursuing =
            target?.hp > 0 &&
            dist(e, target) > cfg.meleeRange &&
            !e.telegraph &&
            !e.motion &&
            !e.rangedAim &&
            !e.supportHeal &&
            !e.sequence?.length &&
            !(e.slow > 0);
        state.confined = confined ? state.confined + elapsed : 0;
        state.stalled = pursuing && travel < cfg.minimumProgress ? state.stalled + elapsed : 0;
        state.x = e.x;
        state.y = e.y;
        if (state.confined < cfg.confinedSeconds && state.stalled < cfg.stallSeconds) return null;
        const point = this.fieldBossRecoveryPoint(e);
        if (point) mobility.delete(e);
        return point;
      }
      beginFieldBossReturn(e, point) {
        returns.set(e, {
          zone: this.zoneId,
          point: { ...point },
          remaining: R.fieldBossMobility.returnSeconds,
        });
        e.aggro = false;
        this.notice(e.name + ' withdraws to open ground.', 3, '', 'feedback');
      }
      fieldBossReturning(e) {
        return returns.get(e)?.zone === this.zoneId;
      }
      advanceFieldBossReturn(e, dt) {
        const state = returns.get(e);
        if (!state) return null;
        if (state.zone !== this.zoneId || e.hp <= 0) {
          returns.delete(e);
          return null;
        }
        state.remaining -= dt;
        if (state.remaining > 0) return { waiting: true };
        const landing = this.fieldBossRecoveryPoint(e);
        if (!landing) {
          state.remaining = R.fieldBossMobility.sampleSeconds;
          return { waiting: true };
        }
        state.point = landing;
        returns.delete(e);
        delete e.thornReturn;
        delete e.cinderReturn;
        delete e.cinderDestination;
        this.releasePatrolResume(e);
        // Roaming captives and their existing living escorts return with the
        // encounter. No new units, revival or quest-state change.
        const captive =
          this.thornPatroller(e) && this.thornCaptiveFollowing()
            ? this.thornCaptive()
            : this.cinderPatroller(e) && this.veraHeld()
              ? this.veraCaptive()
              : null;
        if (captive) {
          Object.assign(captive, this.safe(state.point.x - 65, state.point.y + 45));
          delete captive.path;
          captive.routeAge = 0;
        }
        if (this.cinderPatroller(e))
          for (const [i, u] of this.zone()
            .enemies.filter((u) => u.veraEscort && u.hp > 0)
            .entries()) {
            Object.assign(u, this.safe(state.point.x + (i ? 90 : -90), state.point.y + 85));
            delete u.path;
            u.routeAge = 0;
          }
        delete e.path;
        e.routeAge = 0;
        return { point: state.point };
      }
      // Each role is explicitly checked: species/name collisions cannot grant a trait.
      snapshotBossIncomingFactor(e) {
        if (!e || !e.aggro || e.hp <= 0 || e.returning || e.neutral) return 1;
        const p = R.snapshotPassives,
          form = e.form === 'true' ? 'true' : 'normal',
          near = (u, radius) => dist(u, e) <= radius,
          owned = (species, radius) =>
            this.zone().enemies.filter(
              (u) =>
                u.hp > 0 &&
                u.aggro &&
                !u.returning &&
                !u.neutral &&
                u.summon &&
                u.owner === e.id &&
                u.species === species &&
                near(u, radius),
            ).length;
        if (e.type === 'boss') {
          if (e.family === 'ridge')
            return (
              1 -
              p.ridge.baseline[form] -
              Math.min(p.ridge.maxArchers, owned('archer', p.ridge.radius)) *
                p.ridge.perArcher[form]
            );
          if (e.family === 'mine' && !(e.open > 0)) return 1 - p.mine.shellReduction[form];
          if (e.family === 'warlord')
            return (
              1 -
              p.warlord.baseline[form] -
              Math.min(p.warlord.maxOrcs, owned('orc', p.warlord.radius)) * p.warlord.perOrc[form]
            );
          if (e.family === 'abyss')
            return (
              1 -
              (e.passiveAerialUntil > this.s.time
                ? p.abyss.reduction[form]
                : p.abyss.baseline[form])
            );
          if (e.family === 'citadel') {
            const formed =
              e.dressUntil > this.s.time &&
              this.zone().enemies.some(
                (u) =>
                  u !== e &&
                  u.hp > 0 &&
                  !u.neutral &&
                  u.species === 'crownguard' &&
                  near(u, p.citadel.radius),
              );
            return 1 - (formed ? p.citadel.reduction[form] : p.citadel.baseline[form]);
          }
          if (e.family === 'darklord' && e.passiveVeteranUntil > this.s.time)
            return 1 - p.darklord.reduction[form];
        }
        if (e.roomCaptain && e.captainProfile === 'supply-highlands') {
          const cfg = p.captains['supply-highlands'],
            hasGuard = this.zone().enemies.some(
              (u) =>
                u !== e &&
                u.hp > 0 &&
                !u.neutral &&
                !u.returning &&
                u.roomGuard &&
                near(u, cfg.guardRadius),
            );
          return 1 - cfg.baseline - (hasGuard ? cfg.selfReduction : 0);
        }
        if (
          e.fieldCaptain &&
          e.captainProfile === 'frontier-overseer' &&
          e.passiveViolationUntil > this.s.time
        )
          return (
            1 -
            Math.min(p.captains['frontier-overseer'].maxStacks, e.passiveViolationStacks || 0) *
              p.captains['frontier-overseer'].perHitReduction
          );
        return 1;
      }
      snapshotPassiveOutgoingFactor(source) {
        if (!source || source.hp <= 0 || !source.aggro || source.returning || source.neutral)
          return 1;
        const p = R.snapshotPassives;
        if (source.summon && source.species === 'orc') {
          const owner = this.zone().enemies.find(
            (e) =>
              e.id === source.owner &&
              e.type === 'boss' &&
              e.family === 'warlord' &&
              e.hp > 0 &&
              e.aggro &&
              !e.returning &&
              !e.neutral &&
              dist(source, e) <= p.warlord.radius,
          );
          if (owner) return 1 + p.warlord.orcDamage[owner.form === 'true' ? 'true' : 'normal'];
        }
        if (source.roomGuard) {
          const cfg = p.captains['supply-highlands'],
            captain = this.zone().enemies.find(
              (e) =>
                e.roomCaptain &&
                e.captainProfile === 'supply-highlands' &&
                e.hp > 0 &&
                e.aggro &&
                !e.returning &&
                !e.neutral &&
                dist(source, e) <= cfg.guardRadius,
            );
          if (captain) return 1 + cfg.guardDamage;
        }
        if (
          source.fieldCaptain &&
          source.captainProfile === 'frontier-overseer' &&
          source.passiveViolationUntil > this.s.time &&
          (source.passiveViolationStacks || 0) >= p.captains['frontier-overseer'].maxStacks
        )
          return 1 + p.captains['frontier-overseer'].maxStackDamage;
        return 1;
      }
      snapshotPassiveRecordHit(e, actualDamage, source) {
        if (!e || actualDamage <= 0 || e.hp <= 0 || !e.aggro || e.returning) return;
        const now = this.s.time,
          p = R.snapshotPassives;
        if (e.type === 'boss' && e.family === 'darklord') {
          const cfg = p.darklord;
          if (e.passiveVeteranUntil > now || e.passiveVeteranReadyAt > now) return;
          const hits = (e.passiveVeteranHits || []).filter((h) => now - h.time <= cfg.window);
          hits.push({ time: now, source });
          e.passiveVeteranHits = hits;
          const unique = new Set(hits.map((h) => h.source)).size;
          if (
            hits.length >= cfg.triggerHits &&
            (this.activeLivingParty().length === 0 || unique >= 2)
          ) {
            e.passiveVeteranUntil = now + cfg.duration;
            e.passiveVeteranReadyAt = now + cfg.cooldown;
            e.passiveVeteranHits = [];
            this.say('The Dark Lord reads the party\u2019s attack pattern.');
          }
        }
        if (e.fieldCaptain && e.captainProfile === 'frontier-overseer') {
          const cfg = p.captains['frontier-overseer'],
            active = (e.passiveViolationUntil || 0) > now;
          e.passiveViolationStacks = Math.min(
            cfg.maxStacks,
            (active ? e.passiveViolationStacks || 0 : 0) + 1,
          );
          e.passiveViolationUntil = now + cfg.duration;
        }
      }
      snapshotPassiveCoreRelock(e) {
        if (
          !e ||
          e.type !== 'boss' ||
          e.family !== 'mine' ||
          !e.aggro ||
          e.hp <= 0 ||
          e.returning ||
          (e.passiveRepairReadyAt || 0) > this.s.time
        )
          return;
        const cfg = R.snapshotPassives.mine,
          amount = Math.min(
            e.maxHp - e.hp,
            e.maxHp * cfg.repairFraction[e.form === 'true' ? 'true' : 'normal'],
          );
        if (amount <= 0) return;
        e.hp += amount;
        e.passiveRepairReadyAt = this.s.time + cfg.repairCooldown;
        this.event('heal', {
          x: e.x,
          y: e.y,
          source: e.id,
          target: e.id,
          resource: 'health',
          amount,
        });
      }
      snapshotPassiveRegen(dt) {
        if (this.peace || dt <= 0) return;
        const cfg = R.snapshotPassives.cindermaw;
        for (const e of this.zone().enemies) {
          if (
            e.type !== 'boss' ||
            e.family !== 'cindermaw' ||
            e.hp <= 0 ||
            !e.aggro ||
            e.returning ||
            e.neutral
          )
            continue;
          const allies = this.zone()
            .enemies.filter(
              (u) =>
                u !== e &&
                u.hp > 0 &&
                !u.neutral &&
                u.species === 'ashbeast' &&
                dist(u, e) <= cfg.radius,
            )
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          const form = e.form === 'true' ? 'true' : 'normal';
          if (e.hp < e.maxHp * cfg.threshold) {
            const budget = e.maxHp * cfg.bossHealCap[form] - (e.passiveRegenTotal || 0),
              heal = Math.max(
                0,
                Math.min(
                  e.maxHp - e.hp,
                  e.maxHp * (allies.length ? cfg.bossRegen[form] : cfg.soloRegen[form]) * dt,
                  budget,
                ),
              );
            if (heal > 0) {
              e.hp += heal;
              e.passiveRegenTotal = (e.passiveRegenTotal || 0) + heal;
            }
          }
          for (const ally of allies.slice(0, cfg.allyCap))
            if (ally.hp < ally.maxHp)
              ally.hp = Math.min(ally.maxHp, ally.hp + ally.maxHp * cfg.allyRegen[form] * dt);
        }
      }
      abyssFlightLegs(e, target, sign = 1) {
        const dx = target.x - e.x,
          dy = target.y - e.y,
          len = Math.hypot(dx, dy),
          direction = len > 1e-7 ? { x: dx / len, y: dy / len } : { x: 1, y: 0 },
          perp = { x: -direction.y, y: direction.x },
          first = this.safe(
            e.x + dx * 0.33 + perp.x * sign * 105,
            e.y + dy * 0.33 + perp.y * sign * 105,
          ),
          second = this.safe(
            e.x + dx * 0.67 - perp.x * sign * 105,
            e.y + dy * 0.67 - perp.y * sign * 105,
          ),
          last = this.safe(target.x, target.y);
        // Never cut through walls to achieve an attractive pattern.
        return this.clearSegment(e, first, 15) &&
          this.clearSegment(first, second, 15) &&
          this.clearSegment(second, last, 15)
          ? [first, second, last]
          : [last];
      }
      tacticalResolveRogueMove(e, move) {
        if (e.family !== 'abyss' || e.type !== 'boss') return originalRogueMove.call(this, e, move);
        if (move.mobileRogueCast) {
          const victim =
            move.targetId === 'hero'
              ? this.hero
              : this.combatTargets().find((u) => u.id === move.targetId);
          if (!victim || victim.hp <= 0 || !this.line(e, victim)) return;
          if (!move.rogueSignature && dist(e, victim) > move.radius) return;
          // High Yo-Yo begins from the caster's new real position; Wingover
          // radiates from that position rather than the old warning center.
          move.angle = Math.atan2(victim.y - e.y, victim.x - e.x);
          if (move.rogueSignature && move.effect === 'scatter') {
            move.x = e.x;
            move.y = e.y;
          } else {
            move.x = victim.x;
            move.y = victim.y;
          }
        }
        if (!move.rogueSignature && move.style === 'dash') {
          const target =
            move.targetId === 'hero'
              ? this.hero
              : this.combatTargets().find((u) => u.id === move.targetId);
          if (!target || target.hp <= 0 || !this.line(e, target)) return;
          e.motion = {
            aerial: 'high-yo-yo',
            flightPath: this.abyssFlightLegs(e, move, 1),
            target: { x: move.x, y: move.y },
            hit: [],
            speed: 350,
            life: 5,
            rogueMove: true,
            rogueSignature: false,
            style: move.style,
            rogueAttack: move,
            recovery: move.recovery,
          };
          return;
        }
        if (move.rogueSignature && move.effect === 'scatter') {
          const origin = { x: e.x, y: e.y },
            side = this.safe(
              e.x + Math.cos(move.angle + Math.PI / 2) * 105,
              e.y + Math.sin(move.angle + Math.PI / 2) * 105,
            ),
            path =
              this.clearSegment(e, side, 15) && this.clearSegment(side, origin, 15)
                ? [side, origin]
                : [origin];
          e.motion = {
            aerial: 'wingover',
            flightPath: path,
            target: origin,
            hit: [],
            speed: 350,
            life: 4,
            rogueMove: true,
            rogueSignature: true,
            effect: move.effect,
            style: move.style,
            rogueAttack: move,
            recovery: move.recovery,
          };
          return;
        }
        return originalRogueMove.call(this, e, move);
      }

      clearEncounterState(e, units = [this.hero, ...this.s.party]) {
        mobility.delete(e);
        returns.delete(e);
        for (const u of units) {
          if (u.keeperHeld === e.id) delete u.keeperHeld;
          if (e.deathRoll?.victim === (u === units[0] ? 'hero' : u.id)) delete u.deathRollHeld;
        }
        e.telegraph = null;
        e.sequence = [];
        e.motion = null;
        e.rangedAim = null;
        // Enemy support healing is encounter-transient, never an enduring
        // restoration across leash resets, defeat, travel or save snapshots.
        delete e.supportHeal;
        delete e.supportHealCd;
        for (const key of [
          'board',
          'dressUntil',
          'dressPost',
          'thornFightAnchor',
          'introHeroProvoked',
          'hookedVictim',
          'deathRoll',
          'ashCloud',
          'ashNextAt',
          'ledgerOpen',
          'ledgerMarkedId',
          'ledgerMarkUntil',
          'ledgerNextAt',
          'mireLowestHpRatio',
          'sabotageCd',
          'anastylosis',
          'anastylosisCd',
          'quotaTarget',
          // Recent Rogue-basic selection and anti-kite pursuit are encounter
          // decisions, not persistent enemy identity or save fields.
          'rogueBasicTurn',
          'pursuitBurstReadyAt',
          'strainHardeningStacks',
          'strainHardeningUntil',
          'emergencyStabilizationUsed',
          'emergencyStabilizationUntil',
          'tauntUntil',
          'weakenUntil',
          'weakenFraction',
          'fractureUntil',
          'fractureFraction',
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
        if (e.quotaOvertime !== undefined) e.quotaOvertime = 0;
        if (e.type === 'boss') {
          e.trueEntourageSpawned = false;
          e.trueHalfSummonWave = false;
        }
        if (e.captain || e.roomCaptain) {
          e.captainPhase = false;
          e.captainPhaseMove = 1;
          e.captainAttackRate = 1;
          e.captainGuard = 0;
          e.captainReflect = 0;
          e.captainPursuit = 0;
          e.captainOvertimeCd = 0;
          e.captainOpeningSummon = false;
        }
      }
      cancelEncounter(e) {
        this.clearCinderResponses(e);
        this.clearEncounterState(e);
        for (const u of this.zone().enemies)
          if (u.supportHeal?.source === e.id) delete u.supportHeal;
        if (e.family === 'citadel')
          for (const u of this.zone().enemies) if (u.dressPost?.owner === e.id) delete u.dressPost;
        this.s.projectiles = this.s.projectiles.filter((p) => p.sourceId !== e.id);
        this.s.hazards = this.s.hazards.filter((h) => h.source !== e.id && h.sourceId !== e.id);
        for (const u of this.zone().enemies)
          if (u.summon && u.owner === e.id) {
            u.hp = 0;
            u.aggro = false;
            this.clearEncounterState(u);
          }
        this.zone().enemies = this.zone().enemies.filter((u) => !(u.summon && u.owner === e.id));
      }
      clearEncounterUnits(units = [this.hero, ...this.s.party]) {
        for (const u of units)
          for (const key of [
            'keeperHeld',
            'deathRollHeld',
            'ashLastAt',
            'mireBogLastAt',
            'mireBogExposure',
          ])
            delete u[key];
      }

      rechargeOwnMud(dt) {
        if (this.peace || dt <= 0) return;
        for (const e of this.zone().enemies) {
          if (
            e.type !== 'boss' ||
            e.family !== 'mire' ||
            e.hp <= 0 ||
            !e.aggro ||
            e.returning ||
            e.neutral
          )
            continue;
          // Overlapping beds form one wet footprint, never multiple healing
          // streams. Clip the final interval to the longest live owned bed.
          let wetSeconds = 0;
          for (const h of this.s.hazards)
            if (
              h.family === 'mire' &&
              h.index === 2 &&
              h.kind === 'circle' &&
              h.sourceId === e.id &&
              h.life > 0 &&
              dist(e, h) < h.radius
            )
              wetSeconds = Math.max(wetSeconds, Math.min(dt, h.life));
          const rate = R.marchesPassives.groundwaterRecharge[e.form === 'true' ? 'true' : 'normal'];
          e.hp = Math.min(e.maxHp, e.hp + e.maxHp * rate * wetSeconds);
        }
      }

      recordMarchesDamage(e, actualDamage) {
        if (actualDamage <= 0 || e.hp <= 0) return;
        if (e.type === 'boss' && e.family === 'mire')
          e.mireLowestHpRatio = Math.min(e.mireLowestHpRatio ?? 1, e.hp / e.maxHp);
        if (e.roomCaptain && e.captainProfile === 'supply-march') {
          const p = R.marchesPassives.strainHardening,
            active = (e.strainHardeningUntil || 0) > this.s.time;
          e.strainHardeningStacks = Math.min(
            p.maxStacks,
            (active ? e.strainHardeningStacks || 0 : 0) + 1,
          );
          e.strainHardeningUntil = this.s.time + p.duration;
        }
        if (
          e.type === 'boss' &&
          e.family === 'archive' &&
          !e.emergencyStabilizationUsed &&
          e.hp <= e.maxHp * R.marchesPassives.emergencyStabilization.threshold
        ) {
          const p = R.marchesPassives.emergencyStabilization[e.form === 'true' ? 'true' : 'normal'];
          e.emergencyStabilizationUsed = true;
          e.emergencyStabilizationUntil = this.s.time + p.duration;
          this.say(e.name + ' uses Emergency Stabilization.');
          this.event('captainPhase', { profile: 'archive', name: 'Emergency Stabilization' });
        }
      }

      advanceQueuedAttack(e) {
        const a = e.sequence?.shift() || null;
        if (a && e.family === 'darklord' && a.index === 0) {
          // A physical sidestep changes the origin of the NEXT warning.
          // Sync the impact cone and its warning center with the actual
          // actor position, not the first strike's stale snapshot.
          Object.assign(a, { x: e.x, y: e.y, fromX: e.x, fromY: e.y });
        }
        if (a?.tracking) {
          const target = this.combatTargets().find(
            (u) => (u === this.hero ? 'hero' : u.id) === a.targetId && u.hp > 0,
          );
          if (!target) {
            e.sequence = [];
            return null;
          }
          Object.assign(a, {
            x: target.x,
            y: target.y,
            fromX: e.x,
            fromY: e.y,
            angle: Math.atan2(target.y - e.y, target.x - e.x),
          });
        }
        if (a?.withdrawal) this.enemyWithdrawalCastPosition(e, a);
        return a;
      }
      ownedSummonMovementFactor(e) {
        if (!e.summon || e.species !== 'wolf') return 1;
        const owner = this.zone().enemies.find(
          (u) => u.id === e.owner && u.type === 'boss' && u.family === 'thorn' && u.hp > 0,
        );
        return owner
          ? R.greenwoodPassives.rapidDeployment[owner.form === 'true' ? 'true' : 'normal']
          : 1;
      }
      regularSlowDuration(e, a, seconds) {
        return (
          seconds *
          (e?.captainProfile === 'supply-vale' && a.captainSkill && !a.rogueMove
            ? R.greenwoodPassives.prolongedExposure[e.captainPhase ? 'phase' : 'normal']
            : 1)
        );
      }
      trueSummonPlan(e) {
        const authored = R.attacks[e.family]?.find((a) => a.kind === 'summon');
        return authored
          ? {
              species: authored.species,
              ranged: !!authored.ranged,
              attendant: !!authored.attendant,
            }
          : R.trueBossSummons.families[e.family];
      }
      bossOwnedSummons(e) {
        return this.zone().enemies.filter((u) => u.summon && u.owner === e.id && u.hp > 0);
      }
      bossSummonProfile(e) {
        const o = R.bossSummoning.overrides?.[e.family] || {};
        return {
          normalCap: o.normalCap || R.bossSummoning.normalCap,
          trueCap: o.trueCap || R.bossSummoning.trueCap,
          minions: o.minions || R.trueBossSummons.minions,
          captains: o.captains || R.trueBossSummons.captains,
        };
      }
      bossSummonCap(e) {
        const p = this.bossSummonProfile(e);
        return e.form === 'true' ? p.trueCap : p.normalCap;
      }
      summonName(species) {
        return species === 'wolf'
          ? 'Den pup'
          : species === 'skeleton'
            ? 'Summoned skeleton'
            : species === 'archer'
              ? 'Ridge archer'
              : species === 'mireling'
                ? 'Brood mireling'
                : species === 'crownguard'
                  ? 'Black guard'
                  : species === 'wraith'
                    ? 'Drowned echo'
                    : species === 'ogre'
                      ? 'Stonebound ogre'
                      : species === 'orc'
                        ? 'Warband orc'
                        : species === 'ashbeast'
                          ? 'Abyss hatchling'
                          : 'Summoned ' + species;
      }
      summonCombatProfile(s, plan) {
        s.ranged = !!plan.ranged;
        if (!s.ranged) return;
        const profile = R.rangedProfiles[s.species];
        if (profile) Object.assign(s, profile, { ranged: true });
        else if (['archer', 'crownguard', 'wraith'].includes(s.species)) {
          s.shotRange = 280;
          s.shotSpeed = 260;
          s.projectileStyle = s.species === 'wraith' ? 'spectral' : 'arrow';
        }
      }
      summonBossAdds(e, plan, cap) {
        if (!e || !plan || cap < 1) return 0;
        const z = this.zone(),
          sc = R.summonScaling[this.regionIndex()],
          baseHp =
            (this.s.phase === 'awakening' && this.isDungeon() ? 700 : 40 + e.level * 15) * sc.hp,
          baseDamage =
            (this.s.phase === 'awakening' && this.isDungeon() ? 30 : 5 + e.level) * sc.damage,
          spawnPoint = (slot) => {
            for (let n = 0; n < 24; n++) {
              const k = slot + n,
                a = (k * Math.PI) / 3,
                r = 125 + Math.floor(k / 6) * 55,
                candidate = this.safe(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r);
              if (
                dist(candidate, this.hero) < 75 ||
                z.enemies.some((u) => u.hp > 0 && u !== e && dist(candidate, u) < 38)
              )
                continue;
              return candidate;
            }
            return this.safe(e.x + 120, e.y + 120);
          };
        if (e.form !== 'true') {
          const owned = () => z.enemies.filter((u) => u.summon && u.owner === e.id && u.hp > 0),
            limit = Math.min(cap, this.bossSummonProfile(e).normalCap),
            nextCount = Math.min(limit, owned().length + (plan.attendant ? 3 : limit));
          let made = 0;
          for (let i = owned().length; i < nextCount; i++) {
            const p = spawnPoint(i),
              s = this.makeEnemy(
                {
                  species: plan.species,
                  name: plan.attendant ? 'Estate attendant' : this.summonName(plan.species),
                  icon: '👻',
                  level: e.level,
                  hp: Math.round(baseHp * (plan.normalHpScale || 1)),
                  damage: Math.round(baseDamage * (plan.normalDamageScale || 1)),
                  gold: 0,
                  xp: 0,
                },
                p,
              );
            s.summon = true;
            if (plan.attendant) {
              s.estateAttendant = true;
              s.visualScale = 0.78;
            }
            s.summonBalanceVersion = 1;
            s.owner = e.id;
            this.summonCombatProfile(s, plan);
            s.eliteNightBonus = { hp: e.maxHp / e.baseHp, damage: e.damage / e.baseDamage };
            s.maxHp = s.hp = s.baseHp * s.eliteNightBonus.hp;
            s.damage = s.baseDamage * s.eliteNightBonus.damage;
            z.enemies.push(s);
            made++;
            if (e.aggro) this.engage(s);
          }
          return made;
        }
        z.enemies = z.enemies.filter(
          (u) =>
            !(
              u.summon &&
              u.owner === e.id &&
              u.hp > 0 &&
              !['minion', 'captain'].includes(u.trueSummonRole)
            ),
        );
        const composition = this.bossSummonProfile(e),
          live = (role) =>
            z.enemies
              .filter((u) => u.summon && u.owner === e.id && u.hp > 0 && u.trueSummonRole === role)
              .sort((a, b) => this.idOrder(a, b));
        for (const u of live('minion').slice(composition.minions))
          z.enemies.splice(z.enemies.indexOf(u), 1);
        for (const u of live('captain').slice(composition.captains))
          z.enemies.splice(z.enemies.indexOf(u), 1);
        const owned = () => z.enemies.filter((u) => u.summon && u.owner === e.id && u.hp > 0);
        let made = 0;
        const spawnRole = (role) => {
          const p = spawnPoint(owned().length),
            captain = role === 'captain',
            hpScale = captain ? R.ringleaderScaling.hp : R.trueBossSummons.minionScaling.hp,
            damageScale = captain
              ? R.ringleaderScaling.damage
              : R.trueBossSummons.minionScaling.damage,
            hp = Math.round(baseHp * hpScale),
            damage = Math.round(baseDamage * damageScale),
            baseName = this.summonName(plan.species),
            s = this.makeEnemy(
              {
                species: plan.species,
                name: plan.attendant
                  ? captain
                    ? 'TRUE Estate attendant Ringleader'
                    : 'TRUE-bound Estate attendant'
                  : captain
                    ? 'TRUE ' + baseName + ' Ringleader'
                    : 'TRUE-bound ' + baseName,
                icon: '👻',
                form: captain ? 'ringleader' : 'normal',
                level: e.level,
                hp,
                damage,
                gold: 0,
                xp: 0,
              },
              p,
            );
          s.summon = true;
          s.summonBalanceVersion = 1;
          s.owner = e.id;
          this.summonCombatProfile(s, plan);
          s.trueSummon = true;
          if (plan.attendant) {
            s.estateAttendant = true;
            s.visualScale = captain ? 0.9 : 0.78;
          }
          s.trueSummonRole = role;
          s.pack = e.id + '-summons';
          if (captain) s.ringleaderHealthVersion = 3;
          s.eliteNightBonus = { hp: e.maxHp / e.baseHp, damage: e.damage / e.baseDamage };
          s.maxHp = s.hp = s.baseHp * s.eliteNightBonus.hp;
          s.damage = s.baseDamage * s.eliteNightBonus.damage;
          z.enemies.push(s);
          made++;
          if (e.aggro) this.engage(s);
          return true;
        };
        for (let i = live('minion').length; i < composition.minions; i++) spawnRole('minion');
        for (let i = live('captain').length; i < composition.captains; i++) spawnRole('captain');
        return made;
      }
      sentinelFormationOrders(e) {
        // Only select Dress Ranks when living soldiers can really take posts.
        // This is also the execution source, preventing AI/cast mismatches.
        const posts = [
          [-115, -70],
          [-115, 70],
          [115, -70],
          [115, 70],
        ];
        return this.zone()
          .enemies.filter(
            (u) =>
              u !== e && u.hp > 0 && u.species === 'crownguard' && !u.neutral && dist(u, e) < 390,
          )
          .sort((a, b) => dist(a, e) - dist(b, e))
          .slice(0, 4)
          .flatMap((unit, i) => {
            const [dx, dy] = posts[i];
            const post = this.safe(e.x + dx, e.y + dy);
            return dist(unit, post) <= 240 && this.clearSegment(unit, post) ? [{ unit, post }] : [];
          });
      }
      sentinelPatternPath(e) {
        const directions = [
          [1, 0],
          [1, 1],
          [-1, 1],
          [-1, -1],
          [1, -1],
        ];
        const origin = { x: e.x, y: e.y };
        for (const size of [150, 120, 90, 65]) {
          const path = directions.map(([x, y]) => ({
            x: origin.x + x * size,
            y: origin.y + y * size,
          }));
          if (
            path.every(
              (p, i) =>
                !this.blocked(p.x, p.y, this.zoneId, 23) &&
                this.clearSegment(i ? path[i - 1] : origin, p),
            )
          )
            return path;
        }
        return [];
      }
      sentinelBoardPlan(e) {
        // Keep all sixteen tiles. A smaller court is the explicit confined-room
        // fallback; validate the whole square's enclosing footprint before warning.
        const points = this.connectedArenaPoints(e).sort(
          (a, b) => dist(a, e.home || e) - dist(b, e.home || e),
        );
        for (const size of [112, 96, 80, 64])
          for (const point of [e.home || e, ...points]) {
            const radius = size * 2 * Math.SQRT2 + R.arenaPlacement.margin;
            if (
              this.blocked(point.x, point.y, this.zoneId, radius) ||
              !points.some(
                (q) => dist(point, q) < R.arenaPlacement.step * 1.5 && this.clearSegment(point, q),
              )
            )
              continue;
            return { x: point.x, y: point.y, size };
          }
        return null;
      }
      sentinelBoardCells(e) {
        if (!e.board) return [];
        const pairs = [
          [0, 15],
          [3, 12],
          [5, 10],
          [6, 9],
          [1, 14],
          [4, 11],
          [2, 13],
          [7, 8],
        ];
        const active = pairs[e.board.beat % pairs.length];
        return Array.from({ length: 16 }, (_, i) => ({
          x: e.board.x + ((i % 4) - 1.5) * e.board.size,
          y: e.board.y + (Math.floor(i / 4) - 1.5) * e.board.size,
          size: e.board.size,
          selected: active.includes(i),
        }));
      }
      sentinelValidBoard(e, board, zone = this.zoneId) {
        return !!(
          zone === 'citadel' &&
          e.type === 'boss' &&
          e.family === 'citadel' &&
          e.hp > 0 &&
          board &&
          Number.isFinite(board.x) &&
          Number.isFinite(board.y) &&
          [112, 96, 80, 64].includes(board.size) &&
          Number.isFinite(board.timer) &&
          board.timer > 0 &&
          board.timer <= 1.9 &&
          Number.isInteger(board.beat) &&
          board.beat >= 0 &&
          board.beat < 8 &&
          ['warn', 'rest'].includes(board.phase) &&
          !this.blocked(
            board.x,
            board.y,
            zone,
            board.size * 2 * Math.SQRT2 + R.arenaPlacement.margin,
          )
        );
      }
      sentinelUpdateBoard(e, dt) {
        if (!e.board || e.hp <= 0 || !e.aggro || this.peace) return;
        const b = e.board;
        b.timer -= dt;
        if (b.timer > 0) return;
        if (b.phase === 'warn') {
          b.phase = 'rest';
          b.timer += 0.45;
          const hero = this.hero,
            zone = this.zoneId;
          for (const u of this.combatTargets()) {
            if (
              !this.sentinelBoardCells(e).some(
                (cell) =>
                  cell.selected &&
                  Math.abs(u.x - cell.x) <= cell.size / 2 &&
                  Math.abs(u.y - cell.y) <= cell.size / 2,
              )
            )
              continue;
            const landed = this.hitParty(
              u, this.worldBossEffect(b, this.weakenedEnemyDamage(e), 'damage'), 0, e.id,
            );
            if (
              this.hero !== hero ||
              this.zoneId !== zone ||
              this.s.challenge.pending ||
              this.s.challenge.gameOver
            )
              return;
            if (landed)
              this.enemyVfxResolvedContact?.(e, b, u, {
                ...R.attacks.citadel[3],
                kind: 'checkerboard',
                index: 3,
              });
          }
        } else {
          b.phase = 'warn';
          b.beat = (b.beat + 1) % 8;
          b.timer += 1.45;
        }
        b.timer = Math.max(0.05, b.timer);
      }
      // This filters the existing repertoire; no new attack, cooldown or
      // pursuit is created. Warnings remain full length and dodgeable.
      enemyWithdrawalPlan(e, plan, index) {
        if (
          !plan ||
          plan.charge ||
          plan.landing ||
          plan.advance ||
          plan.opening ||
          plan.combo ||
          plan.royalSidestep
        )
          return false;
        // These attacks commit the actor to holding/grappling a victim.
        if (e.type === 'boss' && ['mire', 'archive', 'darklord'].includes(e.family) && index === 0)
          return false;
        // Keep the bespoke moving arena/commandeering sequences under their
        // own owner. Protection and reinforcements remain useful during retreat.
        if (plan.cinderMechanic && !['protection', 'equalisation'].includes(plan.cinderMechanic))
          return false;
        return [
          'circle',
          'line',
          'cone',
          'sector',
          'ring',
          'volley',
          'summon',
          'canister',
          'formation',
          'checkerboard',
        ].includes(plan.kind);
      }
      enemyWithdrawalCastPosition(e, a = e.telegraph) {
        if (!a?.withdrawal) return;
        // Only actor-centered cues move with the actor. Ground marks and
        // target snapshots stay where the full warning put them; no homing.
        // Dreadmaw's withdrawal closure deliberately shares this recentering:
        // terrain may obstruct its gaps as he retreats. Do not restore the
        // original two-clear-exit placement here; this is his approved trick.
        // The warning and resolved closure both read this same shifted center.
        if (
          ['cone', 'sector', 'ring'].includes(a.kind) ||
          a.selfDefense ||
          a.nightSkill === 'drain'
        ) {
          a.x = e.x;
          a.y = e.y;
          a.fromX = e.x;
          a.fromY = e.y;
        }
      }
      enemyBackpedal(e, target, dt, territory) {
        if (this.hawkRetreatLocked(e, 'backpedal')) return false;
        const gap = dist(e, target),
          range = this.enemyRangedRange(e);
        if (
          !this.enemyRanged(e) ||
          e.hybrid ||
          gap >= range * R.rangedEnemyCombat.retreatFraction ||
          !this.line(e, target)
        )
          return false;
        const away = {
          x: e.x + ((e.x - target.x) / Math.max(1, gap)) * 95,
          y: e.y + ((e.y - target.y) / Math.max(1, gap)) * 95,
        };
        if (dist(away, e.home) >= territory || !this.clearSegment(e, away)) return false;
        const before = { x: e.x, y: e.y };
        this.move(
          e,
          away,
          R.rangedEnemyCombat.retreatSpeed *
            this.mountedMovementFactor(e) *
            (e.form === 'ringleader' ? R.rangedEnemyCombat.ringleaderRetreatMultiplier : 1) *
            (e.slow > 0 ? 0.5 : 1) *
            this.nightTempo(),
          dt,
        );
        if (dist(before, e) > 0.1) {
          this._hawkBackpedalAt ||= new WeakMap();
          this._hawkBackpedalAt.set(e, this.s.time);
        }
        return true;
      }
      enemyWithdrawalAction(e, target, bossTarget = target) {
        if (
          this.peace ||
          !e.aggro ||
          e.hp <= 0 ||
          e.returning ||
          e.telegraph ||
          e.motion ||
          e.rangedAim ||
          !target ||
          target.hp <= 0
        )
          return false;
        // The caller gives support healing/approach first refusal. Recovery
        // and normal skills still pay their native readiness costs.
        const gap = dist(e, target),
          visible = this.line(e, target);
        let skill = false;
        if (!this.mageSilenceActive(e) && visible && e.cd <= 0) {
          if (
            (e.captain || e.roomCaptain) &&
            e.specialCd <= 0 &&
            gap < (this.captainProfile(e)?.specialRange || 420)
          )
            skill = this.startCaptainAttack(e, target, true);
          else if (
            e.type === 'boss' &&
            gap < R.bossCadence.specialRange &&
            (!e.basicDue || gap > 200)
          )
            skill = this.startAttack(e, bossTarget, null, true);
          else if (
            e.nightOnly &&
            e.species === 'wraith' &&
            e.specialCd <= 0 &&
            gap < R.nightEnemyCombat.wraith.radius
          )
            skill = this.startNightSkill(e, target);
        }
        if (skill) {
          for (const a of [e.telegraph, ...(e.sequence || [])]) if (a) a.withdrawal = true;
          return true;
        }
        const ranged =
          this.enemyRanged(e) &&
          !(
            e.hybrid &&
            gap <= (e.form === 'ringleader' ? R.rangedEnemyCombat.ringleaderHybridMeleeRange : 65)
          );
        if (
          e.cd > 0 ||
          gap > (ranged ? this.enemyRangedRange(e) : 65) ||
          !(ranged ? this.enemyRangedLine(e, target) : visible)
        )
          return false;
        this.enemyStartBasic(e, target, ranged);
        if (e.rangedAim) e.rangedAim.withdrawal = true;
        return true;
      }
      // Stage 3 opt-in: World has its own chance resolver and intensity dial.
      // This source does not auto-install it in any production Campaign.
      worldCriticalAction(e, key) {
        const session = this._criticalWorldNative;
        if (!session?.enabled || !e?.id) return null;
        return session.release(this, key, e.id);
      }
      worldCriticalRelease(e, move) {
        return this.worldCriticalAction(e,
          move === 'heal' ? 'world/support/heal' : 'world/basic/' + move);
      }
      worldCriticalDamage(receipt, value) {
        return receipt?.critical
          ? this._criticalWorldNative.enhance(receipt, value, 'damage')
          : value;
      }
      worldCriticalHealSeconds(receipt, seconds) {
        return receipt?.critical
          ? this._criticalWorldNative.enhance(receipt, seconds, 'healTempo')
          : seconds;
      }
      worldCriticalSlowSeconds(receipt, seconds) {
        return receipt?.critical
          ? this._criticalWorldNative.enhance(receipt, seconds, 'slowDuration')
          : seconds;
      }
      worldBossEffect(a, current, lever, bounds) {
        const receipt = a?.criticalExecution;
        return receipt?.critical && receipt.effect?.lever === lever
          ? this._criticalWorldNative.enhance(receipt, current, lever, bounds)
          : current;
      }
      worldBossRelease(e, a) {
        if (!this._criticalWorldNative?.enabled || !e?.id ||
            e.type !== 'boss' || !a || a.captainSkill || a.rogueMove ||
            a.family !== e.family || !Number.isInteger(a.index) ||
            !R.attacks[e.family]?.[a.index] || e.family === 'cindermaw')
          return null;
        if (a.criticalExecution) return a.criticalExecution;
        // Actual summon admissions own their releases after the spawn action;
        // every other authored attack commits only at genuine execution.
        if (a.kind === 'summon') return null;
        const receipt = this.worldCriticalAction(e, 'world/boss/' + e.family + '/' + a.index);
        if (receipt) {
          a.criticalExecution = receipt;
          // An individual multi-beat action has one frozen decision. A queued
          // combo with a DIFFERENT index remains a separate legal action.
          for (const next of e.sequence || []) {
            if (next.family !== a.family || next.index !== a.index) break;
            if (!next.criticalExecution) next.criticalExecution = receipt;
          }
        }
        return receipt;
      }
      enemyStartBasic(e, target, ranged) {
        const nightTempo = this.nightTempo();
        e.cd =
          ((e.type === 'boss' ? R.bossCadence.basicCooldown : 1.4) *
            (e.frenzy ? R.ringleaderScaling.frenzyCooldown : 1) *
            (e.captainAttackRate || 1) *
            (e.quotaOvertime > 0 ? 0.75 : 1)) /
          nightTempo;
        if (ranged) {
          const aimTime =
            R.rangedEnemyCombat.aimTime *
            (e.frenzy ? R.ringleaderScaling.frenzyAim : 1) *
            (e.captainAttackRate || 1) *
            (e.quotaOvertime > 0 ? 0.8 : 1);
          e.rangedAim = {
            x: target.x,
            y: target.y,
            timer: aimTime,
            total: aimTime,
          };
        } else {
          const criticalReceipt = this.worldCriticalRelease(e, 'melee');
          const equipment = R.enemyMeleeEquipment(e);
          this.event('swing', {
            actor: 'enemy',
            source: e.id,
            species: e.species,
            family: e.family,
            boss: e.type === 'boss',
            ...equipment,
            x: e.x,
            y: e.y,
          });
          if (this.hitParty(
            target,
            this.worldCriticalDamage(criticalReceipt, this.weakenedEnemyDamage(e)),
            0,
            e.id,
          ))
            this.event('melee', {
              actor: 'enemy',
              source: e.id,
              species: e.species,
              family: e.family,
              boss: e.type === 'boss',
              ...equipment,
              x: target.x,
              y: target.y,
              target: target === this.hero ? 'hero' : target.id,
            });
          if (e.form === 'ringleader') e.pursuitBurstUsed = false;
        }
        e.basicDue = false;
      }
      bossCenteredReach(e, plan) {
        const scale = R.bossCadence.areaRangeMultiplier;
        const kind = plan.kind === 'sector' && e.hp > e.maxHp * 0.5 ? 'cone' : plan.kind;
        if (kind === 'cone') return 165 * scale;
        if (kind === 'sector') return 280 * scale;
        // The moving ring's reach comes from speed × lifetime, not its
        // initially displayed radius (which is overwritten on every tick).
        if (kind === 'ring')
          return plan.slowOnly
            ? plan.waveSpeed * plan.waveLife
            : R.combatGeometry.ringSpeed * R.combatGeometry.ringLife * scale;
        return null;
      }
      bossAttackWeights(e, target = this.hero, allowRepeat = false) {
        const plans = R.attacks[e.family] || [],
          behavior = R.bossBehavior[e.family] || {},
          d = dist(e, target),
          low = e.hp <= e.maxHp * 0.5,
          alive = this.bossOwnedSummons(e).length,
          cap = this.bossSummonCap(e);
        return plans.map((plan, index) => {
          if (e.family === 'citadel' && index === 3 && e.board) return 0;
          if (e.family === 'citadel' && index === 1 && !this.sentinelFormationOrders(e).length)
            return 0;
          if (e.family === 'citadel' && index === 2 && !this.sentinelPatternPath(e).length)
            return 0;
          if (!allowRepeat && index === e.lastAttackIndex && plans.length > 1) return 0;
          if (e.family === 'darklord' && index === 3 && !low) return 0;
          if (e.family === 'darklord' && index === 4 && e.hp > e.maxHp * 0.3) return 0;
          const attackTarget = this.bossAttackTarget(e, target, index);
          const reach = this.bossCenteredReach(e, plan);
          // A special must have realistic coverage at the moment it is chosen.
          if (plan.kind !== 'summon' && dist(e, attackTarget) > R.bossCadence.specialRange)
            return 0;
          if (reach !== null && dist(e, attackTarget) > reach + 25) return 0;
          let w = 1;
          if (plan.selfDefense && ((e.anastylosis || 0) > 0 || (e.anastylosisCd || 0) > 0))
            return 0;
          if (plan.sabotage && (e.sabotageCd || 0) > 0) return 0;
          if (plan.kind === 'summon') {
            if (alive >= cap || (e.summonCd || 0) > 0) return 0;
            const missing = cap - alive;
            w = 2.4 + missing * 1.15;
            if (alive >= R.bossSummoning.pressureFloor) w *= 0.7;
          } else {
            if (d <= 170 && behavior.close?.includes(index)) w *= 2.4;
            if (d >= 230 && behavior.far?.includes(index)) w *= 2.2;
            if (d >= 330 && behavior.close?.includes(index)) w *= 0.55;
            if (d <= 110 && behavior.far?.includes(index)) w *= 0.7;
          }
          if (low && behavior.phasePreferred?.includes(index)) w *= 2.25;
          return w;
        });
      }
      chooseBossAttack(e, target = this.hero, withdrawal = false) {
        const plans = R.attacks[e.family] || [];
        if (
          !withdrawal &&
          e.family === 'citadel' &&
          !e.board &&
          dist(e, target) <= R.bossCadence.specialRange
        )
          return 3;
        for (const allowRepeat of [false, true]) {
          const weights = this.bossAttackWeights(e, target, allowRepeat).map((weight, index) =>
              withdrawal && !this.enemyWithdrawalPlan(e, plans[index], index) ? 0 : weight,
            ),
            total = weights.reduce((n, w) => n + w, 0);
          if (total <= 0) continue;
          let roll = this.random() * total;
          for (let i = 0; i < weights.length; i++) {
            roll -= weights[i];
            if (roll <= 0 && weights[i] > 0) return i;
          }
        }
        // If every special is out of reach, resume closing distance.
        return -1;
      }
      bossAttackTarget(e, fallback, index) {
        const behavior = R.bossBehavior[e.family] || {},
          plan = R.attacks[e.family]?.[index];
        if (!plan || this.hero.hp <= 0 || !this.line(e, this.hero)) return fallback;
        const heroDistance = dist(e, this.hero),
          fallbackDistance = dist(e, fallback),
          reach = this.bossCenteredReach(e, plan);
        if (
          heroDistance > R.bossCadence.specialRange ||
          (reach !== null && heroDistance > reach + 25)
        )
          return fallback;
        // Authored hero-targeting remains authoritative. Targeted ground
        // marks can occasionally challenge a protected backline as well.
        const markBackline =
          plan.kind === 'circle' && fallbackDistance < 200 && heroDistance > fallbackDistance + 70;
        // The Keeper's chosen healer remains priority even for ground-targeted spells.
        if (
          e.family === 'archive' &&
          this.activeLivingParty().some((u) => u.type === 'archer' && u.hp > 0 && !u.keeperHeld)
        )
          return fallback;
        return behavior.heroTarget?.includes(index) || markBackline ? this.hero : fallback;
      }
      buildBossAttack(e, index, target, includeTrue = true) {
        const b = this.boss(e.family),
          plan = R.attacks[e.family][index],
          kind = plan.kind === 'sector' && e.hp > e.maxHp * 0.5 ? 'cone' : plan.kind,
          angle = Math.atan2(target.y - e.y, target.x - e.x),
          from = { x: e.x, y: e.y },
          center =
            plan.selfDefense || ['cone', 'ring', 'sector'].includes(kind)
              ? from
              : { x: target.x, y: target.y },
          a = {
            ...plan,
            family: e.family,
            index,
            name: b.attacks[index]?.split(':')[0] || 'Attack ' + (index + 1),
            timer: plan.warning,
            total: plan.warning,
            kind,
            ...center,
            fromX: e.x,
            fromY: e.y,
            angle,
            count: plan.count || 1,
            radius:
              (kind === 'cone'
                ? 165
                : kind === 'sector'
                  ? 280
                  : kind === 'ring'
                    ? 105
                    : index === 0
                      ? 90
                      : 115) * R.bossCadence.areaRangeMultiplier,
          },
          sequence = [];
        if (e.family === 'mine' && index === 2 && a.doubleWave) {
          sequence.push({ ...a, timer: 0.7, total: 0.7, name: 'Dynamic Compaction — second wave' });
        }
        if (e.family === 'crypt' && index === 3) {
          // Snapshot all Groundwork pads on cast. No chasing a dodging player.
          const heroMark =
            dist(e, this.hero) <= R.bossCadence.specialRange && this.line(e, this.hero)
              ? { x: this.hero.x, y: this.hero.y }
              : { x: a.x, y: a.y };
          const closest = this.activeLivingParty()
            .filter((u) => u.hp > 0 && dist(e, u) <= R.bossCadence.specialRange)
            .sort((u, v) => dist(u, heroMark) - dist(v, heroMark))[0];
          const allyMark =
            closest && dist(closest, heroMark) >= 170
              ? { x: closest.x, y: closest.y }
              : { x: heroMark.x, y: heroMark.y + 172 };
          a.groundworkMarks = [
            heroMark,
            allyMark,
            { x: a.x - 185, y: a.y - 95 },
            { x: a.x + 185, y: a.y + 95 },
          ];
        }
        if (a.paired && e.family === 'crypt' && index === 3) {
          this.prepareGroundAttack(e, a);
          const pads = this.attackPatches(a);
          a.arenaPatches = pads.slice(0, 2).map(({ x, y, radius }) => ({ x, y, radius }));
          a.groundworkMarks = pads.slice(0, 2).map((p) => ({ x: p.x, y: p.y }));
          a.count = 2;
          sequence.push({
            ...a,
            arenaPatches: pads.slice(2).map(({ x, y, radius }) => ({ x, y, radius })),
            groundworkMarks: pads.slice(2).map((p) => ({ x: p.x, y: p.y })),
            timer: a.pairWarning,
            total: a.pairWarning,
            name: a.name + ' — second pair',
          });
        }
        if (a.sequential && a.kind === 'circle' && e.family !== 'citadel') {
          this.prepareGroundAttack(e, a);
          const patches = this.attackPatches(a);
          Object.assign(a, patches[0], {
            count: 1,
            arenaPatches: [patches[0]].map(({ x, y, radius }) => ({ x, y, radius })),
          });
          for (const p of patches.slice(1))
            sequence.push({
              ...a,
              ...p,
              count: 1,
              arenaPatches: [{ x: p.x, y: p.y, radius: p.radius }],
            });
        }
        if (e.family === 'abyss' && index === 2) {
          // Lazy Eight: opposite banks, each ending at its own separately warned impact.
          a.flightPath = this.abyssFlightLegs(e, a, 1);
          let previousLanding = a;
          sequence.forEach((stage, i) => {
            stage.flightPath = this.abyssFlightLegs(previousLanding, stage, i % 2 === 0 ? -1 : 1);
            previousLanding = stage;
          });
        }
        if (e.family === 'darklord' && index === 0) {
          // Every sword beat has an anonymous preparation bar instead of
          // a named or spatial warning. Retain the actual 1.1/.5/.8s timing.
          a.anonymousCast = true;
          // The two lateral steps occur AFTER the first and second real hits,
          // before the NEXT warning. This keeps warned arc footprints honest:
          // each strike hits where the ruler stood while it was telegraphed.
          a.royalSidestep = true;
          a.royalSidestepDirection = 1;
          a.royalSidestepBaseAngle = angle;
          sequence.push(
            {
              ...a,
              angle: angle + 0.7,
              timer: 0.5,
              total: 0.5,
              coefficient: 0.85,
              name: a.name + ' — shield feint',
              royalSidestep: true,
              royalSidestepDirection: -1,
              royalSidestepBaseAngle: angle,
            },
            {
              ...a,
              angle: angle - 0.7,
              timer: 0.8,
              total: 0.8,
              coefficient: 1.3,
              name: a.name + ' — final thrust',
              royalSidestep: false,
              royalSidestepDirection: 0,
            },
          );
        } else if (a.combo)
          sequence.push({
            ...a,
            angle: angle + 0.7,
            timer: 0.8,
            total: 0.8,
            name: a.name + ' — second arc',
          });
        if (e.family === 'darklord' && index === 4) {
          // No More Heroes keeps its 1.5s commitment and actual narrow
          // hit geometry, but exposes only the shared anonymous cast bar.
          a.anonymousCast = true;
        }
        if (e.family === 'darklord' && index === 1) {
          // Warn the actual landing sites rather than teleporting to an aimed mark.
          const side = angle + Math.PI / 2;
          const flank = this.safe(e.x + Math.cos(side) * 110, e.y + Math.sin(side) * 110);
          const crossing = this.safe(
            target.x - Math.cos(side) * 110,
            target.y - Math.sin(side) * 110,
          );
          const planned = [flank, crossing, { x: target.x, y: target.y }];
          let previous = e;
          const route = planned.map((point) => {
            const next =
              this.clearSegment(previous, point, 15) &&
              !this.blocked(point.x, point.y, this.zoneId, 15)
                ? point
                : { x: previous.x, y: previous.y };
            previous = next;
            return next;
          });
          Object.assign(a, { x: route[0].x, y: route[0].y, coefficient: 0.55 });
          sequence.push(
            {
              ...a,
              x: route[1].x,
              y: route[1].y,
              timer: 0.85,
              total: 0.85,
              coefficient: 0.65,
              name: a.name + ' — crossing',
            },
            {
              ...a,
              x: route[2].x,
              y: route[2].y,
              timer: 0.85,
              total: 0.85,
              coefficient: 1.4,
              name: a.name + ' — flank strike',
            },
          );
        }
        if (a.kind === 'sector') {
          a.angle = angle + Math.PI / 2;
          a.count = 1;
          for (let j = 1; j < 3; j++)
            sequence.push({
              ...a,
              angle: angle + (j % 2 ? -Math.PI / 2 : Math.PI / 2),
              timer: plan.warning,
              total: plan.warning,
            });
        }
        if (e.family === 'darklord' && index === 3)
          for (const beat of [a, ...sequence]) {
            beat.royalTerritory = true;
            beat.protectedAngle = beat.angle + Math.PI;
          }
        if (e.family === 'citadel') {
          if (index === 0) {
            a.kind = 'canister';
            a.radius = 360 * R.balance.enemySpecialReachMultiplier;
            a.opening = 0;
          }
          if (index === 1) {
            a.kind = 'formation';
            a.radius = 230;
          }
          if (index === 2) {
            a.kind = 'pattern-charge';
            a.path = this.sentinelPatternPath(e);
            a.count = 1;
            a.opening = 0;
            if (a.path.length) Object.assign(a, a.path[a.path.length - 1]);
          }
          if (index === 3) {
            a.kind = 'checkerboard';
            a.x = e.home.x;
            a.y = e.home.y;
            a.count = 1;
          }
        }
        if (includeTrue && e.form === 'true') {
          if (e.family === 'crypt' && index === 1) a.staggered = true;
          if (e.family === 'archive' && index === 1)
            sequence.push({
              ...a,
              x: a.x + Math.cos(angle + Math.PI / 2) * 80,
              y: a.y + Math.sin(angle + Math.PI / 2) * 80,
              timer: plan.warning,
              total: plan.warning,
              name: 'Shifting water channels',
            });
          // Progressive Collapse already sequences its three marked impacts in both forms.
          if (e.family === 'abyss' && index === 0)
            sequence.push({
              ...a,
              kind: 'circle',
              x: target.x,
              y: target.y,
              landing: false,
              persistent: true,
              timer: plan.warning,
              total: plan.warning,
              name: 'Delayed flame patch',
              radius: 90 * R.bossCadence.areaRangeMultiplier,
            });
          if (e.family === 'citadel' && index === 2) a.opening = 2.5;
        }
        return { first: a, sequence };
      }
      bossComboSequence(e, index, target) {
        const behavior = R.bossBehavior[e.family] || {},
          ratio = e.hp / e.maxHp,
          combo = (behavior.combos || []).find(
            (x) =>
              x.from === index &&
              (x.phase === 'low' ? ratio <= 0.5 : x.phase === 'high' ? ratio > 0.5 : true) &&
              this.random() < x.chance,
          );
        if (!combo) return [];
        const plan = R.attacks[e.family][combo.to];
        if (
          plan.kind === 'summon' &&
          (this.bossOwnedSummons(e).length >= this.bossSummonCap(e) || (e.summonCd || 0) > 0)
        )
          return [];
        const comboTarget = this.bossAttackTarget(e, target, combo.to),
          reach = this.bossCenteredReach(e, plan);
        if (dist(e, comboTarget) > R.bossCadence.specialRange) return [];
        if (reach !== null && dist(e, comboTarget) > reach + 25) return [];
        const built = this.buildBossAttack(e, combo.to, comboTarget, true);
        return [built.first, ...built.sequence];
      }
      abyssGoAroundPoint(e) {
        const hero = this.hero,
          away = Math.atan2(e.y - hero.y, e.x - hero.x);
        // Prefer a full retreat, then smaller side steps if the arena is tight.
        // Neither terrain nor blocked walls can become a false successful escape.
        for (const radius of [110, 80, 55])
          for (const offset of [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2]) {
            const direction = away + offset,
              point = {
                x: e.x + Math.cos(direction) * radius,
                y: e.y + Math.sin(direction) * radius,
              };
            if (!this.blocked(point.x, point.y, this.zoneId, 15) && this.clearSegment(e, point, 15))
              return point;
          }
        return null;
      }
      startBossRecovery(e) {
        const cfg =
          (e.family === 'darklord' || !R.resourceMode.manaEnabled) && R.bossRecovery[e.family];
        if (
          !cfg ||
          e.type !== 'boss' ||
          e.hp <= 0 ||
          e.hp >= e.maxHp * (cfg.threshold || R.bossRecovery.threshold) ||
          (e.family === 'darklord' && e.secondWindUsed) ||
          (e.healCd || 0) > 0 ||
          e.telegraph ||
          e.motion
        )
          return false;
        // Go-Around must have a real escape path before spending its heal cast.
        if (e.family === 'abyss' && !this.abyssGoAroundPoint(e)) return false;
        e.healCd = cfg.cooldown;
        if (e.family === 'darklord') {
          e.secondWindUsed = true;
          e.secondWindCancelled = false;
          e.secondWindFacing = Math.atan2(this.hero.y - e.y, this.hero.x - e.x);
        }
        e.telegraph = {
          kind: 'circle',
          bossHeal: true,
          secondWind: e.family === 'darklord',
          name: cfg.name,
          healFraction: cfg.healFraction,
          x: e.x,
          y: e.y,
          fromX: e.x,
          fromY: e.y,
          radius: 115,
          count: 1,
          timer: cfg.warning,
          total: cfg.warning,
          recovery: 1.8,
        };
        e.noProgress = 0;
        this.event('warning', { family: e.family, bossHeal: true });
        return true;
      }
      startAttack(e, target, indexOverride = null, withdrawal = false) {
        const plans = R.attacks[e.family] || [];
        if (!plans.length) return false;
        const selected = Number.isInteger(indexOverride)
            ? Math.max(0, Math.min(plans.length - 1, indexOverride))
            : this.chooseBossAttack(e, target, withdrawal),
          actualTarget = selected < 0 ? null : this.bossAttackTarget(e, target, selected);
        if (selected < 0) return false;
        if (e.family === 'archive' && selected === 0 && e.hookedVictim) {
          const held =
            e.hookedVictim === 'hero'
              ? this.hero
              : this.s.party.find((u) => u.id === e.hookedVictim);
          if (held) held.keeperHeld = null;
          e.hookedVictim = null;
        }
        if (e.family === 'archive' && plans[selected].sabotage) e.sabotageCd = 12;
        const built = this.buildBossAttack(e, selected, actualTarget, true);
        if (!built.first) return false;
        const sequence = [...built.sequence, ...this.bossComboSequence(e, selected, actualTarget)];
        if (
          withdrawal &&
          [built.first, ...sequence].some((a) => !this.enemyWithdrawalPlan(e, a, a.index))
        )
          return false;
        if (!this.prepareAttackSequence(e, built.first, sequence)) return false;
        e.attackIndex = (e.attackIndex || 0) + 1;
        e.lastAttackIndex = selected;
        e.sequence = sequence;
        e.telegraph = built.first;
        if (e.family === 'mine' && selected === 1) this.prepareMineWorksPreview(e);
        this.event(
          'warning',
          built.first.anonymousCast
            ? { family: e.family, anonymousCast: true }
            : { family: e.family, index: selected },
        );
        return true;
      }
      attackPatches(a) {
        if (a.arenaPatches) return a.arenaPatches.map((p) => ({ ...a, ...p, count: 1 }));
        if (a.pairMarks && a.captainProfile === 'supply-vale' && a.index === 4)
          return a.pairMarks.map((p) => ({ ...a, ...p, radius: a.radius }));
        if (a.family === 'crypt' && a.index === 3 && !a.captainSkill) {
          // A target-centered construction grid: four offset hazard pads,
          // leaving deliberate corridors rather than a solid damage carpet.
          const marks = a.groundworkMarks || [
            { x: a.x, y: a.y },
            { x: a.x, y: a.y + 172 },
            { x: a.x - 185, y: a.y - 95 },
            { x: a.x + 185, y: a.y + 95 },
          ];
          return marks.slice(0, a.count || 4).map((mark) => ({
            ...a,
            x: mark.x,
            y: mark.y,
            radius: 72 * R.balance.enemySpecialReachMultiplier,
          }));
        }
        if (
          a.family === 'warlord' &&
          a.count === 6 &&
          a.kind === 'circle' &&
          a.index === 1 &&
          !a.captainSkill
        ) {
          // Spread Warlord artillery around the target with dodgeable lanes.
          const offsets = [
            [-220, -100],
            [0, -100],
            [220, -100],
            [-220, 125],
            [0, 125],
            [220, 125],
          ];
          return offsets.map(([dx, dy]) => ({
            ...a,
            x: a.x + dx * R.balance.enemySpecialReachMultiplier,
            y: a.y + dy * R.balance.enemySpecialReachMultiplier,
            radius: 72 * R.balance.enemySpecialReachMultiplier,
          }));
        }
        if (a.captainSpread) {
          // Separate footprints; no stacked damage and a gap between neighboring circles.
          const gap = a.radius * 2 + 24;
          const offsets =
            a.count === 4
              ? [
                  [0, 0],
                  [-1, -1],
                  [1, -1],
                  [0, 1.5],
                ]
              : [
                  [0, 0],
                  [-1, -1],
                  [1, -1],
                  [-1, 1],
                  [1, 1],
                ];
          return offsets.slice(0, a.count).map(([x, y]) => ({
            ...a,
            x: a.x + x * gap,
            y: a.y + y * gap,
            count: 1,
          }));
        }
        return Array.from({ length: a.count || 1 }, (_, i) => ({
          ...a,
          x: a.x + (i - ((a.count || 1) - 1) / 2) * 190,
          y: a.y + (i % 2) * 100,
          radius: a.captainRadiusMultiplier
            ? 75 * R.bossCadence.areaRangeMultiplier * a.captainRadiusMultiplier
            : a.count > 1
              ? 75 * R.bossCadence.areaRangeMultiplier
              : a.radius,
        }));
      }
      connectedArenaPoints(e) {
        const cfg = R.arenaPlacement,
          step = cfg.step,
          points = [{ x: e.x, y: e.y }],
          queue = [[0, 0]],
          visited = new Set(['0:0']);
        for (let i = 0; i < queue.length; i++) {
          const [x, y] = queue[i],
            from = { x: e.x + x * step, y: e.y + y * step };
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const xx = x + dx,
              yy = y + dy,
              key = xx + ':' + yy;
            if (visited.has(key) || Math.hypot(xx, yy) * step > cfg.searchRadius) continue;
            visited.add(key);
            const p = { x: e.x + xx * step, y: e.y + yy * step };
            if (this.blocked(p.x, p.y, this.zoneId, 15) || !this.clearSegment(from, p, 15))
              continue;
            points.push(p);
            queue.push([xx, yy]);
          }
        }
        return points;
      }
      prepareGroundAttack(e, a, arena = null) {
        if (a?.kind === 'checkerboard' && !a.boardPlan) {
          a.boardPlan = this.sentinelBoardPlan(e);
          if (!a.boardPlan) {
            a.arenaInvalid = true;
            return;
          }
        }
        if (a?.kind === 'line' && a.count === 2 && !a.charge && !a.cargo && !a.arenaLines) {
          const connected = arena || this.connectedArenaPoints(e),
            width = R.combatGeometry.dualLineHalfWidth,
            length = Math.max(60, Math.hypot(a.x - a.fromX, a.y - a.fromY)),
            side = { x: -Math.sin(a.angle), y: Math.cos(a.angle) },
            lines = [];
          for (const offset of [-85, 85]) {
            const ideal = { x: a.fromX + side.x * offset, y: a.fromY + side.y * offset },
              candidates = [
                ideal,
                ...connected
                  .filter((p) => dist(p, e) < 220)
                  .sort((p, q) => dist(p, ideal) - dist(q, ideal)),
              ];
            let chosen = null;
            for (const requireSpacing of [true, false]) {
              for (const from of candidates) {
                if (
                  this.blocked(from.x, from.y, this.zoneId, width + 3) ||
                  !connected.some(
                    (p) =>
                      dist(p, from) < R.arenaPlacement.step * 1.5 && this.clearSegment(p, from),
                  )
                )
                  continue;
                let to = from;
                for (let n = 8; n <= length; n += 8) {
                  const p = {
                    x: from.x + Math.cos(a.angle) * n,
                    y: from.y + Math.sin(a.angle) * n,
                  };
                  if (!this.clearSegment(to, p, width + 3)) break;
                  to = p;
                }
                if (dist(from, to) < Math.min(48, length * 0.5)) continue;
                if (
                  requireSpacing &&
                  lines.some(
                    (line) =>
                      this.distanceToSegment(from, { x: line.fromX, y: line.fromY }, line) <
                        width * 2 + 18 ||
                      this.distanceToSegment(to, { x: line.fromX, y: line.fromY }, line) <
                        width * 2 + 18,
                  )
                )
                  continue;
                chosen = { fromX: from.x, fromY: from.y, x: to.x, y: to.y, halfWidth: width };
                if (!requireSpacing) a.arenaSequential = true;
                break;
              }
              if (chosen) break;
            }
            if (!chosen) {
              a.arenaInvalid = true;
              return;
            }
            lines.push(chosen);
          }
          a.arenaLines = lines;
        }
        if (
          !a ||
          a.kind !== 'circle' ||
          a.arenaPatches ||
          a.selfDefense ||
          a.bossHeal ||
          a.rogueMove ||
          a.cinderMechanic === 'protection' ||
          a.cinderMechanic === 'transfer'
        )
          return;
        const cfg = R.arenaPlacement,
          raw = this.attackPatches(a),
          connected = arena || this.connectedArenaPoints(e),
          placed = [];
        let sequential = false;
        for (const patch of raw) {
          let radius = patch.radius,
            selected = null;
          const reachable = (p) =>
            connected.some((q) => dist(p, q) <= cfg.step * 1.5 && this.clearSegment(p, q, 15));
          const candidates = [
              patch,
              ...connected.slice().sort((p, q) => dist(p, patch) - dist(q, patch)),
            ],
            fits = (p, r) => !this.blocked(p.x, p.y, this.zoneId, r + cfg.margin),
            spaced = (p, r) => placed.every((q) => dist(p, q) >= r + q.radius + cfg.separation);
          selected = candidates.find(
            (p) => fits(p, radius) && spaced(p, radius) && (p !== patch || reachable(p)),
          );
          if (!selected) {
            // A confined arena uses fully warned sequential beats, never a stacked carpet.
            sequential = true;
            for (const scale of [1, 0.85, 0.65, 0.45, 0.25]) {
              radius = Math.max(15, patch.radius * scale);
              selected = candidates.find((p) => fits(p, radius) && (p !== patch || reachable(p)));
              if (selected) break;
            }
          }
          if (!selected) {
            // A caster physically inside a corrupt/blocked room cannot author a legal warning.
            // Refuse at commitment rather than display a strike that cannot exist.
            a.arenaInvalid = true;
            return;
          }
          placed.push({ x: selected.x, y: selected.y, radius });
        }
        a.arenaPatches = placed;
        a.arenaSequential = sequential;
        a.authoredPatchCount = raw.length;
        if (placed.length === 1) Object.assign(a, placed[0]);
      }
      prepareAttackSequence(e, first, sequence) {
        const pending = [first, ...sequence].some(
            (a) =>
              (a?.kind === 'circle' ||
                (a?.kind === 'line' && a.count === 2 && !a.charge && !a.cargo && !a.arenaLines)) &&
              !a.arenaPatches &&
              !a.selfDefense &&
              !a.bossHeal &&
              !a.rogueMove,
          ),
          arena = pending ? this.connectedArenaPoints(e) : null,
          beats = [];
        for (const a of [first, ...sequence]) {
          this.prepareGroundAttack(e, a, arena);
          if (a?.arenaInvalid) {
            this.event('attackPlacementFailed', { source: e.id, family: e.family, index: a.index });
            return false;
          }
          if (a?.arenaSequential && a.arenaLines?.length > 1) {
            for (const line of a.arenaLines)
              beats.push({
                ...a,
                ...line,
                count: 1,
                arenaLines: [line],
                timer: Math.max(0.7, a.timer),
                total: Math.max(0.7, a.total),
              });
          } else if (a?.arenaSequential && a.arenaPatches?.length > 1) {
            for (const p of a.arenaPatches)
              beats.push({
                ...a,
                ...p,
                count: 1,
                arenaPatches: [p],
                timer: Math.max(0.7, a.timer),
                total: Math.max(0.7, a.total),
              });
          } else beats.push(a);
        }
        Object.assign(first, beats.shift());
        sequence.splice(0, sequence.length, ...beats);
        return true;
      }
      prepareMineWorksPreview(e) {
        if (e.family !== 'mine' || e.telegraph?.index !== 1) return;
        // Predict from the last marked impact, not the first one. This also
        // works when Collapse is chained after a different engineering skill.
        const lastCollapse = (e.sequence || []).filter((a) => a.index === 1).at(-1);
        this.previewMineWorks(e, lastCollapse || e.telegraph);
      }
      previewMineWorks(e, attack) {
        if (e.family !== 'mine' || this.s.zone !== 'mine') return;
        const z = this.zone(),
          existing = z.props.filter((p) => p.garunTemporary),
          priorId = this.s.nextId;
        this.raiseMineWorks(e, attack);
        const planned = z.props.filter((p) => p.garunTemporary);
        this.s.nextId = priorId;
        z.props = z.props.filter((p) => !p.garunTemporary && !p.garunPreview);
        z.props.push(...existing);
        for (const [i, p] of planned.entries())
          z.props.push({
            id: 'garun-preview-' + e.id + '-' + i,
            x: p.x,
            y: p.y,
            r: 0,
            decorative: true,
            structure: 'mine-old-markings',
            dungeonDistrict: 'colossus-chamber',
            sceneRole: 'construction-warning',
            icon: '⚠️',
            garunPreview: true,
            expiresAt: this.s.time + 8,
          });
      }
      raiseMineWorks(e, attack, reservedSites = null) {
        if (e.family !== 'mine' || e.hp <= 0 || this.peace || this.s.zone !== 'mine') return 0;
        const z = this.zone();
        // A maximum of two pieces of temporary construction may obstruct the arena.
        z.props = z.props.filter((p) => !p.garunTemporary && !p.garunPreview);
        const captive = z.npcs.find((n) => n.family === 'mine' && n.kind === 'cage'),
          exit = z.npcs.find((n) => n.kind === 'exit'),
          targets = [this.hero, ...this.activeLivingParty(), e, captive, exit].filter(Boolean),
          initiallyWalkable = targets.filter((u) => !this.blocked(u.x, u.y, z.id, 12)),
          essentialRoutes = [
            ...(exit ? targets.filter((u) => u !== exit).map((u) => [u, exit]) : []),
            ...(captive ? [[this.hero, captive]] : []),
          ].filter(([from, to]) => this.route(from, to).length > 0),
          offsets = [
            [-160, -100],
            [160, -100],
            [-180, 110],
            [180, 110],
            [-80, 185],
            [80, 185],
          ],
          candidates =
            reservedSites === null
              ? offsets.map(([dx, dy]) => ({ x: attack.x + dx, y: attack.y + dy }))
              : reservedSites,
          newlyBuilt = [];
        // At impact, only the previously previewed positions may become solid.
        // Revalidate each one against moving occupants and routes; cancel an
        // unsafe site rather than secretly constructing somewhere else.
        for (const p of candidates) {
          if (newlyBuilt.length >= 2) break;
          if (
            this.blocked(p.x, p.y, z.id, 28) ||
            targets.some((u) => dist(u, p) < 110) ||
            this.traps().some((t) =>
              this.trapContains(
                {
                  ...t,
                  radius: (t.radius || 0) + 40,
                  length: (t.length || 0) + 80,
                  halfWidth: (t.halfWidth || 0) + 40,
                },
                p,
              ),
            )
          )
            continue;
          const prop = {
            id: 'garun-work-' + this.s.nextId++,
            x: p.x,
            y: p.y,
            r: 24,
            structure: 'mine-supports',
            icon: '🪨',
            garunTemporary: true,
            expiresAt: this.s.time + 9,
          };
          z.props.push(prop);
          if (
            initiallyWalkable.some((u) => this.blocked(u.x, u.y, z.id, 12)) ||
            essentialRoutes.some(([from, to]) => !this.route(from, to).length)
          ) {
            z.props.pop();
            continue;
          }
          newlyBuilt.push(prop);
        }
        return newlyBuilt.length;
      }
      resolveAttack(e) {
        const a = e.telegraph;
        if (!a) return;
        if (a.selfDefense && e.family === 'crypt' && a.index === 5) {
          this.worldBossRelease(e, a);
          e.anastylosis = this.worldBossEffect(a, a.defenseDuration, 'wardDuration');
          e.anastylosisCd = a.defenseCooldown;
          return;
        }
        if (a.rogueMove) {
          this.tacticalResolveRogueMove(e, a);
          return;
        }
        // Boss families share a narrow explicit action-release gate, not an
        // attack-wide fallback. Conditional utility commits at its own owner.
        const deferredBossSupport =
          (e.family === 'archive' && a.sabotage) ||
          (e.family === 'darklord' && a.royalTaxation) ||
          (e.family === 'citadel' &&
            ['formation', 'checkerboard', 'pattern-charge'].includes(a.kind));
        if (!deferredBossSupport) this.worldBossRelease(e, a);
        // Explicit conventional captain owners only. A one-patch
        // Encapsulation release affects its initial hit, not the original
        // hazard duration/ticks. Multi-beat, delegated and summon skills
        // are deliberately excluded until their own receipt review.
        const nativeCaptainCone =
          a.captainSkill && a.kind === 'cone' &&
          ((a.captainProfile === 'supply-vale' && a.index === 2) ||
            (a.captainProfile === 'supply-march' && a.index === 1) ||
            (a.captainProfile === 'supply-highlands' && a.index === 2) ||
            (a.captainProfile === 'frontier-overseer' && a.index === 0));
        const nativeEncapsulation =
          a.captainSkill && a.captainProfile === 'supply-vale' && a.index === 1 &&
          a.kind === 'circle' && !!a.persistent && !a.arenaSequential &&
          a.arenaPatches?.length === 1;
        // All four conventional captain charge plans have one physical
        // movement owner; delegated Dreadmaw and boss charges are excluded.
        const nativeCaptainCharge =
          a.captainSkill && a.kind === 'line' && a.charge &&
          ((a.captainProfile === 'supply-vale' && a.index === 0) ||
            (a.captainProfile === 'supply-march' && a.index === 0) ||
            (a.captainProfile === 'supply-highlands' && a.index === 0) ||
            (a.captainProfile === 'frontier-overseer' && a.index === 2));
        if (nativeCaptainCone || nativeEncapsulation || nativeCaptainCharge) {
          const receipt = this.worldCriticalAction(
            e, 'world/captain/' + a.captainProfile + '/' + a.index,
          );
          if (receipt) a.criticalExecution = receipt;
        }
        // One authored Hot Zone activation produces two paired warnings.
        // The first physical area release owns one World decision, inherited
        // by the second pair. Neither pair rolls per patch or floor tick.
        const nativeConventionalCaptainArea =
          a.captainSkill && a.kind === 'circle' &&
          ((a.paired && a.captainProfile === 'supply-vale' && a.index === 4) ||
            (a.captainSpread && a.captainProfile === 'supply-march' && a.index === 2) ||
            (a.captainSpread && a.captainProfile === 'supply-highlands' && a.index === 1) ||
            (a.sequential && a.captainProfile === 'frontier-overseer' && a.index === 1));
        if (nativeConventionalCaptainArea && !a.criticalExecution) {
          const receipt = this.worldCriticalAction(
            e, 'world/captain/' + a.captainProfile + '/' + a.index,
          );
          if (receipt) {
            a.criticalExecution = receipt;
            for (const next of e.sequence || [])
              if (next.captainSkill && next.captainProfile === a.captainProfile &&
                  next.index === a.index && next.kind === 'circle' &&
                  (next.paired || next.captainSpread || next.sequential))
                next.criticalExecution = receipt;
          }
        }
        if (a.bossHeal && e.family === 'abyss') {
          const point = this.abyssGoAroundPoint(e);
          // A blocked retreat can never grant free healing. The next recovery
          // opportunity retains the existing authored cooldown rules.
          if (!point) return;
          e.motion = {
            aerial: 'go-around',
            target: point,
            flightPath: [point],
            speed: 280,
            life: 2,
            hit: [],
            recovery: a.recovery,
            healFraction: a.healFraction,
          };
          return;
        }
        if (a.bossHeal) {
          if (e.hp > 0 && (!a.secondWind || !e.secondWindCancelled)) {
            const amount = Math.min(e.maxHp - e.hp, e.maxHp * a.healFraction);
            if (amount > 0) {
              e.hp += amount;
              this.event('heal', {
                x: e.x,
                y: e.y,
                resource: 'health',
                source: e.id,
                target: e.id,
                amount,
              });
            }
          }
          return;
        }
        if (a.nightSkill === 'drain') {
          // Real AoE release after warning: one roll for all native recipients.
          const criticalReceipt = this.worldCriticalAction(e, 'world/night/wraith-drain');
          const hero = this.hero,
            zone = this.zoneId,
            deaths = this.s.statistics.deaths;
          let hit = false;
          for (const u of this.combatTargets())
            if (dist(u, e) < a.radius && this.line(e, u)) {
              const landed = this.hitParty(
                u,
                this.worldCriticalDamage(criticalReceipt, this.weakenedEnemyDamage(e) * a.coefficient),
                a.manaDrain || 0,
                e.id,
              );
              if (this.hero !== hero || this.zoneId !== zone || this.s.statistics.deaths !== deaths)
                return;
              if (landed) {
                this.applySlow(u, a.slowDuration || 0);
                hit = true;
              }
              if (
                this.hero !== hero ||
                this.zoneId !== zone ||
                this.s.challenge.pending ||
                this.s.challenge.gameOver
              )
                return;
            }
          // Legacy MP mode retains the Wraith's fixed heal; in cooldown mode
          // it siphons actual HP damage per victim instead of healing twice.
          if (hit && R.resourceMode.manaEnabled) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * a.heal);
          return;
        }
        if (a.nightSkill === 'pounce') {
          // The original physical flight owns the roll, not each impact.
          const receipt = this.worldCriticalAction(e, 'world/night/stalker-pounce');
          e.motion = {
            ...a, target: { x: a.x, y: a.y }, hit: [], speed: a.pounceSpeed, life: 2,
            ...(receipt ? { criticalExecution: receipt } : {}),
          };
          return;
        }
        if (e.family === 'darklord' && a.royalTaxation) {
          const marked = [this.hero, ...this.activeLivingParty()]
            .filter((unit) => unit.hp > 0 && dist(unit, a) <= a.radius && this.line(e, unit))
            .slice(0, 4)
            .map((unit) => (unit === this.hero ? 'hero' : unit.id));
          // Four damaging strikes during the ten-second levy: each marked
          // living contributor must participate if fewer than four were
          // targetable. A complete four-character party must hit from all four.
          if (marked.length) this.worldBossRelease(e, a);
          e.royalTaxation = {
            marked, expires: this.s.time + this.worldBossEffect(a, 10, 'markDuration'),
            sources: [], hits: 0,
          };
          return;
        }
        if (e.family === 'darklord' && a.royalSidestep) {
          // Inflict the warned strike at its ORIGINAL, visible footprint,
          // then perform one short, collision-aware side movement before
          // displaying the next warning. Never move the hit after the cue.
          const hero = this.hero,
            zone = this.zoneId,
            deaths = this.s.statistics.deaths;
          this.resolveArea(e, a);
          if (
            this.hero !== hero ||
            this.zoneId !== zone ||
            this.s.statistics.deaths !== deaths ||
            e.hp <= 0
          )
            return;
          const side = (a.royalSidestepBaseAngle ?? a.angle) + Math.PI / 2,
            sign = a.royalSidestepDirection;
          // Try shorter travel on the SAME side when space is tight. No
          // opposite-side fallback, which would falsify left/right order.
          for (const distance of [80, 55, 35]) {
            const goal = this.safe(
              e.x + Math.cos(side) * distance * sign,
              e.y + Math.sin(side) * distance * sign,
            );
            const correctSide =
              (goal.x - e.x) * Math.cos(side) * sign + (goal.y - e.y) * Math.sin(side) * sign;
            if (
              correctSide >= 30 &&
              !this.blocked(goal.x, goal.y, this.zoneId, 15) &&
              this.clearSegment(e, goal, 15)
            ) {
              e.motion = {
                ...a,
                target: goal,
                hit: [],
                speed: 280,
                life: 0.5,
                royalSidestepAfterStrike: true,
              };
              return;
            }
          }
          // A completely blocked sidestep simply preserves the completed
          // warned hit; normal queue advance runs without teleportation.
          return;
        }
        if (a.cargo && e.family === 'ridge') {
          const d = Math.max(1, Math.hypot(a.x - e.x, a.y - e.y));
          this.s.projectiles.push({
            id: 'projectile-' + this.s.nextId++,
            x: e.x,
            y: e.y,
            dx: (a.x - e.x) / d,
            dy: (a.y - e.y) / d,
            speed: 260,
            life: 2,
            damage: this.worldBossEffect(
              a, this.weakenedEnemyDamage(e) * a.coefficient, 'damage',
            ),
            ...(a.criticalExecution ? { criticalExecution: a.criticalExecution } : {}),
            source: 'enemy',
            sourceId: e.id,
            species: 'cargo',
            style: 'cargo',
          });
          this.event('projectileLaunch', {
            actor: 'enemy',
            source: e.id,
            family: 'ridge',
            species: 'cargo',
            style: 'cargo',
            x: e.x,
            y: e.y,
          });
          return;
        }
        if (a.sabotage && e.family === 'archive') {
          // The Scholar punishes a visibly marked healer or hero, without direct damage.
          const victims = this.combatTargets().filter(
            (u) => u.hp > 0 && !u.keeperHeld && dist(u, a) < a.radius && this.line(e, u),
          );
          const victim =
            victims.find((u) => u.type === 'archer') || victims.find((u) => u === this.hero);
          if (victim) {
            if (victim.type === 'archer') {
              this.worldBossRelease(e, a);
              victim.healCd = (victim.healCd || 0) +
                this.worldBossEffect(a, 3, 'cooldownDebt');
            } else {
              const choices = victim.cd
                .map((time, i) => ({ time, i }))
                .filter((x) => this.hero.skills[x.i] > 0)
                .sort((x, y) => y.time - x.time);
              if (choices.length) {
                this.worldBossRelease(e, a);
                victim.cd[choices[0].i] += this.worldBossEffect(a, 3, 'cooldownDebt');
              }
            }
            this.event('warning', { family: 'archive', cooldownSabotageHit: true });
          }
          return;
        }
        if (e.family === 'citadel' && a.kind === 'checkerboard') {
          if (!a.boardPlan) return;
          if (!e.board) {
            this.worldBossRelease(e, a);
            e.board = {
              ...a.boardPlan, beat: 0, phase: 'warn', timer: 1.45,
              ...(a.criticalExecution ? { criticalExecution: a.criticalExecution } : {}),
            };
          }
          return;
        }
        if (e.family === 'citadel' && a.kind === 'formation') {
          const orders = this.sentinelFormationOrders(e);
          if (orders.length) this.worldBossRelease(e, a);
          const duration = this.worldBossEffect(a, 5, 'hasteDuration');
          for (const { unit, post } of orders) {
            // Orders remain movement, never teleportation or invented guards.
            unit.dressPost = { ...post, owner: e.id, expires: this.s.time + duration };
            unit.aggro = true;
          }
          e.dressUntil = orders.length ? this.s.time + duration : 0;
          return;
        }
        if (e.family === 'citadel' && a.kind === 'canister') {
          for (let i = -4; i <= 4; i++) {
            const angle = a.angle + i * 0.115;
            this.s.projectiles.push({
              id: 'projectile-' + this.s.nextId++,
              x: e.x,
              y: e.y,
              dx: Math.cos(angle),
              dy: Math.sin(angle),
              speed: 490,
              life: (a.radius - 7) / 490, // The last fragment stays inside its actual warning.
              preserveFootprint: true,
              hitRadius: R.combatGeometry.canisterHalfWidth,
              damage: this.worldBossEffect(a, this.weakenedEnemyDamage(e) / 9, 'damage'),
              ...(a.criticalExecution ? { criticalExecution: a.criticalExecution } : {}),
              manaDrain: 0,
              source: 'enemy',
              sourceId: e.id,
              species: e.species,
              style: 'stone',
            });
          }
          this.event('projectileLaunch', {
            actor: 'enemy',
            source: e.id,
            family: e.family,
            species: e.species,
            boss: true,
            style: 'stone',
            count: 9,
            x: e.x,
            y: e.y,
          });
          return;
        }
        if (e.family === 'citadel' && a.kind === 'pattern-charge') {
          if (!a.path?.length) return;
          this.worldBossRelease(e, a);
          e.motion = {
            ...a,
            target: { ...a.path[0] },
            leg: 0,
            hit: [],
            speed: 600,
            life: 8,
            charge: true,
          };
          return;
        }
        if (a.kind === 'summon') {
          if (a.captainSkill && (e.captain || e.roomCaptain))
            this.summonCaptainAdds(
              e,
              this.captainProfile(e)?.summon || { species: a.species, cap: a.summonCap || 3 },
            );
          else {
            const priorOwned = new Set(this.bossOwnedSummons(e).map((unit) => unit.id));
            const priorGuards = e.family === 'darklord' ? priorOwned : null;
            this.summonBossAdds(
              e,
              {
                species: a.species,
                ranged: !!a.ranged,
                normalHpScale: a.normalHpScale,
                normalDamageScale: a.normalDamageScale,
                attendant: !!a.attendant,
              },
              this.bossSummonCap(e),
            );
            const born = this.bossOwnedSummons(e).filter((unit) => !priorOwned.has(unit.id));
            if (born.length && e.type === 'boss' && !a.captainSkill &&
                this._criticalWorldNative?.enabled && e.family !== 'cindermaw') {
              const receipt = this.worldCriticalAction(e,
                'world/boss/' + e.family + '/' + a.index);
              if (receipt?.critical)
                for (const unit of born) {
                  const hp = unit.maxHp;
                  const enhanced = Math.max(hp, Math.round(
                    this._criticalWorldNative.enhance(receipt, hp, 'summonVitality'),
                  ));
                  unit.maxHp = enhanced;
                  unit.hp = Math.min(enhanced, unit.hp + enhanced - hp);
                }
            }
            if (priorGuards)
              for (const guard of this.bossOwnedSummons(e))
                if (!priorGuards.has(guard.id) && guard.hp > 0)
                  guard.royalFormationUntil = this.s.time + 6;
            e.summonCd =
              e.form === 'true' ? R.bossSummoning.trueCooldown : R.bossSummoning.normalCooldown;
          }
          return;
        }
        if (a.tracking && a.captainSkill && e.captainProfile === 'supply-vale' && a.index === 3) {
          if (
            !this.combatTargets().some(
              (u) => (u === this.hero ? 'hero' : u.id) === a.targetId && u.hp > 0,
            )
          ) {
            e.sequence = [];
            return;
          }
          // Cradle-to-Grave Tracking is ONE committed four-shot activation.
          // First shot owns the single World roll; queued warnings/shots and
          // actual projectile impacts inherit the frozen same-level receipt.
          // If the target dies before the first shot, nothing is released.
          if (a.shotNumber === 1 && !a.criticalExecution) {
            const receipt = this.worldCriticalAction(e, 'world/captain/supply-vale/3');
            if (receipt) {
              a.criticalExecution = receipt;
              for (const next of e.sequence || [])
                if (next.tracking && next.captainSkill &&
                    next.captainProfile === 'supply-vale' && next.index === 3)
                  next.criticalExecution = receipt;
            }
          }
          this.s.projectiles.push({
            id: 'projectile-' + this.s.nextId++,
            x: e.x,
            y: e.y,
            dx: Math.cos(a.angle),
            dy: Math.sin(a.angle),
            speed: a.shotSpeed,
            life: a.shotLife,
            damage: this.worldCriticalDamage(
              a.criticalExecution, this.weakenedEnemyDamage(e) * a.coefficient,
            ),
            ...(a.criticalExecution ? { criticalExecution: a.criticalExecution } : {}),
            source: 'enemy',
            sourceId: e.id,
            species: e.species,
            style: 'stone',
          });
          this.event('projectileLaunch', {
            actor: 'enemy',
            source: e.id,
            species: e.species,
            style: 'stone',
            x: e.x,
            y: e.y,
          });
          return;
        }
        if (a.kind === 'volley') {
          const style = e.projectileStyle || 'arrow';
          for (const [i, delta] of [-0.22, 0, 0.22].entries())
            this.s.projectiles.push({
              id: 'projectile-' + this.s.nextId++,
              x: e.x,
              y: e.y,
              dx: Math.cos(a.angle + delta),
              dy: Math.sin(a.angle + delta),
              speed: 260 * R.enemyProjectileMultiplier,
              life: (2.5 * R.balance.enemySpecialReachMultiplier) / R.enemyProjectileMultiplier,
              damage: this.worldBossEffect(a, this.weakenedEnemyDamage(e), 'damage'),
              ...(a.criticalExecution ? { criticalExecution: a.criticalExecution } : {}),
              manaDrain: a.manaDrain || 0,
              source: 'enemy',
              sourceId: e.id,
              species: e.species,
              style,
              delay:
                e.family === 'crypt' && a.index === 1
                  ? i * (e.form === 'true' ? a.trueShotInterval : a.normalShotInterval)
                  : a.staggered
                    ? i * 0.35
                    : 0,
            });
          this.event('projectileLaunch', {
            actor: 'enemy',
            source: e.id,
            species: e.species,
            family: e.family,
            boss: e.type === 'boss',
            style,
            count: 3,
            x: e.x,
            y: e.y,
          });
          return;
        }
        if (a.kind === 'ring') {
          this.s.hazards.push({
            ...a,
            family: e.family,
            species: e.species,
            sourceId: e.id,
            x: e.x,
            y: e.y,
            life: a.slowOnly
              ? a.waveLife
              : R.combatGeometry.ringLife * R.bossCadence.areaRangeMultiplier,
            tick: 0,
            damage: a.slowOnly ? 0 : this.worldBossEffect(
              a, this.weakenedEnemyDamage(e), 'damage',
            ),
            slowDuration: a.slowDuration
              ? this.worldBossEffect(a, a.slowDuration, 'slowDuration')
              : a.slowDuration,
            radius: 0,
            age: 0,
            hit: [],
          });
          return;
        }
        if (a.charge || a.landing) {
          e.motion = {
            ...a,
            target: { x: a.x, y: a.y },
            hit: [],
            speed: a.advance ? 100 : 450,
            ...(a.flightPath ? { flightPath: a.flightPath.map(({ x, y }) => ({ x, y })) } : {}),
            life: a.flightPath ? 7 : 5,
          };
          return;
        }
        const hero = this.hero,
          zone = this.zoneId,
          deaths = this.s.statistics.deaths;
        this.resolveArea(e, a);
        if (this.hero !== hero || this.zoneId !== zone || this.s.statistics.deaths !== deaths)
          return;
        if (
          e.family === 'mine' &&
          a.index === 1 &&
          !(e.sequence || []).some((t) => t.index === 1)
        ) {
          const reserved = this.zone()
            .props.filter((p) => p.garunPreview)
            .map((p) => ({ x: p.x, y: p.y }));
          this.raiseMineWorks(e, a, reserved);
        }
      }
      resolveArea(e, a) {
        const hero = this.hero,
          zone = this.zoneId,
          deaths = this.s.statistics.deaths;
        const party = this.combatTargets(),
          patches = this.attackPatches(a),
          hits = (u) =>
            a.arenaLines
              ? a.arenaLines.some(
                  (line) =>
                    this.distanceToSegment(u, { x: line.fromX, y: line.fromY }, line) <
                    line.halfWidth,
                )
              : a.kind === 'line'
                ? a.count === 2
                  ? [-85, 85].some(
                      (o) =>
                        this.distanceToSegment(
                          u,
                          {
                            x: a.fromX + Math.cos(a.angle + Math.PI / 2) * o,
                            y: a.fromY + Math.sin(a.angle + Math.PI / 2) * o,
                          },
                          {
                            x: a.x + Math.cos(a.angle + Math.PI / 2) * o,
                            y: a.y + Math.sin(a.angle + Math.PI / 2) * o,
                          },
                        ) < R.combatGeometry.dualLineHalfWidth,
                    )
                  : this.distanceToSegment(u, { x: a.fromX, y: a.fromY }, a) <
                    R.combatGeometry.lineHalfWidth
                : ['cone', 'sector'].includes(a.kind)
                  ? dist(u, a) < a.radius &&
                    (a.angleDegrees === 360 ||
                      Math.cos(Math.atan2(u.y - a.y, u.x - a.x) - a.angle) >
                        (a.angleDegrees
                          ? Math.cos((a.angleDegrees * Math.PI) / 360)
                          : a.kind === 'sector'
                            ? Math.cos(0.65)
                            : Math.cos(1.1)))
                  : patches.some((p) => dist(u, p) < p.radius);
        const anchorVictim =
          e.type === 'boss' && e.family === 'archive' && a.index === 0
            ? party
                .filter((u) => u.hp > 0 && !u.keeperHeld && hits(u) && this.line(e, u))
                .sort((u, v) => Number(v.type === 'archer') - Number(u.type === 'archer'))[0]
            : null;
        const jawVictim =
          e.type === 'boss' && e.family === 'mire' && a.index === 0 && !e.deathRoll
            ? party.find(
                (u) => u.hp > 0 && !(u.immune > 0) && !this.peace && hits(u) && this.line(e, u),
              )
            : null;
        for (const u of party)
          if (hits(u) && this.line(e, u)) {
            // The grabbed victim's Jaw Snap damage is distributed into roll
            // ticks instead of being applied once now and a second time later.
            const landed =
              u === jawVictim
                ? true
                : this.hitParty(
                    u,
                    a.criticalExecution?.key?.startsWith('world/boss/')
                      ? this.worldBossEffect(
                          a, this.weakenedEnemyDamage(e) * a.coefficient, 'damage',
                        )
                      : (a.nightSkill === 'pounce' ||
                          (a.captainSkill && !!a.criticalExecution))
                        ? this.worldCriticalDamage(
                            a.criticalExecution, this.weakenedEnemyDamage(e) * a.coefficient,
                          )
                        : this.weakenedEnemyDamage(e) * a.coefficient,
                    a.manaDrain || 0,
                    e.id,
                  );
            if (this.hero !== hero || this.zoneId !== zone || this.s.statistics.deaths !== deaths)
              return;
            if (landed && u === jawVictim) {
              // Exactly one jaw victim, then three evenly spaced roll impacts.
              e.deathRoll = {
                victim: u === this.hero ? 'hero' : u.id,
                // Calculate the original single-hit loss once. Each of the
                // three roll ticks is already mitigated; armor must not apply thrice.
                totalDamage: this.worldBossEffect(a, Math.max(
                  3,
                  this.weakenedEnemyDamage(e) * a.coefficient -
                    (u === this.hero
                      ? this.armor()
                      : ['soldier', 'archer', 'pet'].includes(u.type)
                        ? this.companionArmor(u.type)
                        : 5 + this.hero.level * 0.5) *
                      0.35,
                ), 'damage'),
                life: 1.5,
                elapsed: 0,
                hits: 0,
              };
              u.deathRollHeld = true;
              this.say(e.name + ' commits to Vortex Shedding.');
              this.event('warning', { family: 'mire', deathRoll: true, name: 'Vortex Shedding' });
            }
            if (
              landed &&
              e.type === 'boss' &&
              e.family === 'crypt' &&
              a.index === 0 &&
              a.push > 0 &&
              u.hp > 0
            ) {
              const d = Math.max(1, dist(u, e));
              this.move(
                u,
                {
                  x: u.x + ((u.x - e.x) * this.worldBossEffect(a, a.push, 'pushDistance')) / d,
                  y: u.y + ((u.y - e.y) * this.worldBossEffect(a, a.push, 'pushDistance')) / d,
                },
                this.worldBossEffect(a, a.push, 'pushDistance') / 0.15,
                0.15,
              );
            }
            if (landed && e.family === 'ridge' && e.type === 'boss' && a.index === 1 && u.hp > 0) {
              const d = Math.max(1, dist(u, a));
              const dest = this.safe(u.x + ((u.x - a.x) * 75) / d, u.y + ((u.y - a.y) * 75) / d);
              if (this.clearSegment(u, dest)) {
                u.x = dest.x;
                u.y = dest.y;
              }
            }
            if (landed && u === anchorVictim && u.hp > 0) {
              const d = Math.max(1, dist(u, e));
              const where = this.safe(e.x + ((u.x - e.x) * 62) / d, e.y + ((u.y - e.y) * 62) / d);
              if (this.clearSegment(u, where)) {
                u.x = where.x;
                u.y = where.y;
              }
              u.keeperHeld = e.id;
              e.hookedVictim = u === this.hero ? 'hero' : u.id;
              this.event('warning', { family: 'archive', anchorCaptured: true });
            }
            if (landed && ['cone', 'sector'].includes(a.kind))
              this.event('melee', {
                actor: 'enemy',
                source: e.id,
                species: e.species,
                family: e.family,
                boss: e.type === 'boss',
                x: u.x,
                y: u.y,
                target: u === this.hero ? 'hero' : u.id,
              });
            if (landed && (a.slow || a.slowDuration)) {
              const seconds = this.regularSlowDuration(e, a, a.slowDuration || 4);
              this.applySlow(
                u,
                a.criticalExecution?.key?.startsWith('world/boss/')
                  ? this.worldBossEffect(a, seconds, 'slowDuration')
                  : seconds,
              );
            }
            if (party[0] !== this.hero || this.s.challenge.pending || this.s.challenge.gameOver)
              return;
          }
        if (a.persistent)
          for (const p of patches) {
            // This is a separate native over-time hazard, not a second
            // critical strike. Do not persist its parent's release receipt.
            if (p.criticalExecution) delete p.criticalExecution;
            this.s.hazards.push({
              ...p,
              family: e.family,
              species: e.species,
              sourceId: e.id,
              kind: 'circle',
              life: 4,
              tick: 1,
              damage: this.weakenedEnemyDamage(e) * 0.25,
            });
          }
      }
      advanceMotion(e, dt) {
        const a = e.motion;
        if (!a) return;
        const hero = this.hero,
          zone = this.zoneId,
          deaths = this.s.statistics.deaths,
          before = { x: e.x, y: e.y };
        a.life -= dt;
        const leg = a.flightPath?.length ? a.flightPath[0] : a.target;
        const moved = this.move(e, leg, a.speed || a.pounceSpeed || 450, dt);
        if (a.flightPath?.length && dist(e, leg) < 10) a.flightPath.shift();
        if (a.charge)
          for (const u of this.combatTargets()) {
            const id = u === this.hero ? 'hero' : u.id;
            if (
              !a.hit.includes(id) &&
              this.distanceToSegment(u, before, e) < R.combatGeometry.chargeHalfWidth &&
              this.line(e, u)
            ) {
              a.hit.push(id);
              const landed = this.hitParty(
                u,
                a.criticalExecution?.key?.startsWith('world/boss/')
                  ? this.worldBossEffect(a, this.weakenedEnemyDamage(e) * a.coefficient, 'damage')
                  : a.captainSkill && a.charge
                    ? this.worldCriticalDamage(
                        a.criticalExecution, this.weakenedEnemyDamage(e) * a.coefficient,
                      )
                    : this.weakenedEnemyDamage(e) * a.coefficient,
                a.manaDrain || 0,
                e.id,
              );
              if (this.hero !== hero || this.zoneId !== zone || this.s.statistics.deaths !== deaths)
                return;
              if (landed && e.family === 'ridge' && a.index === 2 && u.hp > 0) {
                const d = Math.max(1, dist(u, e));
                const dest = this.safe(u.x + ((u.x - e.x) * 85) / d, u.y + ((u.y - e.y) * 85) / d);
                if (this.clearSegment(u, dest)) {
                  u.x = dest.x;
                  u.y = dest.y;
                }
                this.applySlow(u, 2);
              }
              if (
                this.hero !== hero ||
                this.zoneId !== zone ||
                this.s.challenge.pending ||
                this.s.challenge.gameOver ||
                e.hp <= 0
              )
                return;
            }
          }
        if (a.kind === 'pattern-charge' && dist(e, a.target) < 10 && a.leg + 1 < a.path.length) {
          a.leg++;
          a.target = { ...a.path[a.leg] };
          a.hit = [];
          return;
        }
        // Axis fallback can report success for a zero-length clear segment.
        // A charge blocked by real geometry must end when it makes no progress.
        if (
          (!a.flightPath?.length && dist(e, a.target) < (a.flightPath ? 10 : 1)) ||
          !moved ||
          dist(before, e) < 0.000001 ||
          a.life <= 0
        ) {
          const completedFlight = !a.flightPath?.length && dist(e, a.target) < 10;
          // Aerial Superiority rewards a completed offensive flight, never Go-Around
          // healing or a collision-aborted route.
          if (
            e.type === 'boss' &&
            e.family === 'abyss' &&
            e.hp > 0 &&
            completedFlight &&
            a.flightPath &&
            a.aerial !== 'go-around'
          )
            e.passiveAerialUntil = this.s.time + R.snapshotPassives.abyss.duration;
          if (a.aerial === 'high-yo-yo' && completedFlight) {
            const move = a.rogueAttack,
              victim =
                move.targetId === 'hero'
                  ? this.hero
                  : this.combatTargets().find((u) => u.id === move.targetId);
            if (victim?.hp > 0 && dist(victim, move) <= move.radius && this.line(e, victim)) {
              const hit = this.hitParty(
                victim,
                this.weakenedEnemyDamage(e) * move.coefficient,
                0,
                e.id,
              );
              if (this.hero !== hero || this.zoneId !== zone || this.s.statistics.deaths !== deaths)
                return;
              if (hit && victim.hp > 0) this.applySlow(victim, move.slowSeconds || 2);
            }
          } else if (a.aerial === 'wingover' && completedFlight) {
            originalRogueMove.call(this, e, a.rogueAttack);
          } else if (a.aerial === 'go-around' && e.hp > 0 && completedFlight) {
            // Retreat must physically finish. A blocked/expired motion is not
            // a successful Go-Around, even when its windup was valid.
            const amount = Math.min(e.maxHp - e.hp, e.maxHp * a.healFraction);
            if (amount > 0) {
              e.hp += amount;
              this.event('heal', {
                x: e.x,
                y: e.y,
                resource: 'health',
                source: e.id,
                target: e.id,
                amount,
              });
            }
          }
          if (a.captainSkill && e.captainProfile === 'supply-vale' && a.index === 0)
            e.captainPursuit = 2.5;
          if (a.landing && dist(e, a.target) < 20) this.resolveArea(e, a);
          if (a.royalSidestep && !a.royalSidestepAfterStrike) {
            // Compatibility with pre-change transient motion: active skill
            // state must not lose its hit if it existed before this package.
            this.resolveArea(e, { ...a, x: e.x, y: e.y, fromX: e.x, fromY: e.y });
          }
          if (this.hero !== hero || this.zoneId !== zone || this.s.statistics.deaths !== deaths)
            return;
          e.motion = null;
          e.cd =
            a.recovery *
            (e.type === 'boss' ? R.bossCadence.specialRecoveryMultiplier : 1) *
            (e.frenzy ? R.ringleaderScaling.frenzyCooldown : 1);
          if (a.opening)
            e.open = e.form === 'true' && e.family === 'citadel' ? a.opening / 2 : a.opening;
          e.telegraph = this.advanceQueuedAttack(e);
          if (e.family === 'mine' && a.index !== 1 && e.telegraph?.index === 1)
            this.prepareMineWorksPreview(e);
          if (e.telegraph)
            this.event(
              'warning',
              e.telegraph.anonymousCast
                ? { family: e.family, anonymousCast: true }
                : { family: e.family },
            );
          else if (!a.rogueMove)
            e.basicDue = e.type === 'boss' && e.attackIndex % R.bossCadence.skillsPerBasic === 0;
        }
      }
    }
    for (const name of Object.getOwnPropertyNames(BossCombat.prototype))
      if (name !== 'constructor')
        Object.defineProperty(
          Campaign.prototype,
          name,
          Object.getOwnPropertyDescriptor(BossCombat.prototype, name),
        );
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeBossCombat = api;
})(typeof window !== 'undefined' ? window : globalThis);
