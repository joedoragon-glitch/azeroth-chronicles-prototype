/* Approved agricultural regular attacks; retained Dreadmaw Rogue/phase remain in existing owners. */
(function (root) {
  'use strict';
  function install(Campaign, { R }) {
    const P = Campaign.prototype,
      previous = {};
    for (const key of [
      'startCaptainAttack',
      'resolveAttack',
      'advanceMotion',
      'advanceQueuedAttack',
      'updateCinderRegularState',
      'ownedSummonMovementFactor',
      'clearEncounterState',
      'cancelEncounter',
    ])
      previous[key] = P[key];
    const dread = (e) => e?.roomCaptain && e.captainProfile === 'supply-crown',
      d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
      alive = (e) => e && e.hp > 0 && !e.neutral && !e.returning;
    const interrupted = (c, hero, zone, deaths) =>
      c.hero !== hero ||
      c.zoneId !== zone ||
      c.s.statistics.deaths !== deaths ||
      c.s.challenge.pending ||
      c.s.challenge.gameOver;
    class Agriculture {
      dreadRushPlan(e, target) {
        const p = R.roomCaptains['supply-crown'].attacks[1],
          angle = Math.atan2(target.y - e.y, target.x - e.x);
        for (const factor of p.lengthFactors) {
          const length = p.legLength * factor;
          const first = {
            x: e.x + Math.cos(angle) * length,
            y: e.y + Math.sin(angle) * length,
          };
          if (!this.clearSegment(e, first, 15) || this.blocked(first.x, first.y, this.zoneId, 15))
            continue;
          for (const turn of [Math.PI / 2, -Math.PI / 2]) {
            const next = {
              x: first.x + Math.cos(angle + turn) * length,
              y: first.y + Math.sin(angle + turn) * length,
            };
            if (
              !this.blocked(next.x, next.y, this.zoneId, 15) &&
              this.clearSegment(first, next, 15)
            )
              return { first, next, angle, turn };
          }
        }
        return null;
      }
      dreadClosurePlan(e) {
        const p = R.roomCaptains['supply-crown'].attacks[4];
        const centers = [
          e,
          ...Array.from({ length: 24 }, (_, j) => ({
            x: e.x + Math.cos((j * Math.PI) / 12) * p.centerSearchRadius,
            y: e.y + Math.sin((j * Math.PI) / 12) * p.centerSearchRadius,
          })),
        ];
        for (const center of centers) {
          if (
            this.blocked(center.x, center.y, this.zoneId, 15) ||
            !this.clearSegment(e, center, 15)
          )
            continue;
          for (const radius of p.allowedRadii) {
            const angles = [];
            for (let j = 0; j < 72; j++) {
              const angle = (j * Math.PI) / 36;
              if (
                angles.some(
                  (a) => Math.abs(Math.atan2(Math.sin(a - angle), Math.cos(a - angle))) < 1.4,
                )
              )
                continue;
              const valid = Array.from({ length: 9 }, (_, i) => (i / 8 - 0.5) * p.gapWidth).every(
                (offset) => {
                  const point = {
                    x: center.x + Math.cos(angle + offset) * (radius + p.width + 15),
                    y: center.y + Math.sin(angle + offset) * (radius + p.width + 15),
                  };
                  return (
                    !this.blocked(point.x, point.y, this.zoneId, 15) &&
                    this.clearSegment(center, point, 15)
                  );
                },
              );
              if (valid) angles.push(angle);
              if (angles.length === 2)
                return {
                  x: center.x,
                  y: center.y,
                  gaps: angles,
                  initialRadius: radius,
                  finalRadius: radius * p.finalRadiusFactor,
                  finalBlastRadius: radius * p.finalBlastFactor,
                };
            }
          }
        }
        return null;
      }
      dreadPatchPlan(e, target, count, radius, separation) {
        const points = [];
        for (let j = 0; j < 24 && points.length < count; j++) {
          const angle = (j * Math.PI) / 12,
            raw = {
              x: target.x + Math.cos(angle) * radius,
              y: target.y + Math.sin(angle) * radius,
            },
            point = raw;
          if (
            this.blocked(point.x, point.y, this.zoneId, 15) ||
            !this.line(e, point) ||
            !this.route(target, point).length ||
            points.some((p) => d(p, point) < separation)
          )
            continue;
          points.push(point);
        }
        return points.length === count ? points : null;
      }
      dreadEligible(e, target, index) {
        if (!alive(e) || !target || target.hp <= 0) return false;
        const p = R.roomCaptains['supply-crown'].attacks[index],
          brood = this.captainOwnedSummons(e);
        if (index === 1) return !!this.dreadRushPlan(e, target);
        if (index === 2) return d(e, target) <= p.radius + 25 && this.line(e, target);
        if (index === 3) return brood.length < 4 && (e.summonCd || 0) <= 0;
        if (index === 4)
          return (
            !e.dreadClosure && d(e, target) <= p.initialRadius + 60 && !!this.dreadClosurePlan(e)
          );
        if (index === 5)
          return (
            (e.dreadFeedCd || 0) <= 0 && brood.some((u) => (u.dreadFeedUntil || 0) <= this.s.time)
          );
        if (index === 6)
          return (
            !e.dreadVapors?.some((v) => v.skill === 6) &&
            !!this.dreadPatchPlan(e, target, p.count, p.orbit, p.minimumSeparation)
          );
        return !!this.dreadPatchPlan(e, target, p.count, p.orbit, p.minimumSeparation);
      }
      buildDreadAttack(e, target, index) {
        const p = R.roomCaptains['supply-crown'].attacks[index],
          a = {
            ...p,
            captainSkill: true,
            captainProfile: e.captainProfile,
            index,
            family: e.family,
            fromX: e.x,
            fromY: e.y,
            x: target.x,
            y: target.y,
            angle: Math.atan2(target.y - e.y, target.x - e.x),
            timer: p.warning,
            total: p.warning,
            count: 1,
          },
          sequence = [];
        if (index === 0 || index === 6) {
          const points = this.dreadPatchPlan(e, target, p.count, p.orbit, p.minimumSeparation);
          if (!points) return null;
          Object.assign(a, points[0], { stage: 1, stages: p.count });
          for (let j = 1; j < points.length; j++)
            sequence.push({
              ...a,
              ...points[j],
              stage: j + 1,
              timer: p.nextWarning,
              total: p.nextWarning,
            });
        } else if (index === 1) {
          const plan = this.dreadRushPlan(e, target);
          if (!plan) return null;
          Object.assign(a, plan.first, { dreadLeg: 1, stage: 1, stages: 2 });
          sequence.push({
            ...a,
            ...plan.next,
            fromX: plan.first.x,
            fromY: plan.first.y,
            angle: plan.angle + plan.turn,
            dreadLeg: 2,
            stage: 2,
            timer: p.nextWarning,
            total: p.nextWarning,
          });
        } else if (index === 2 || index === 3 || index === 5) {
          Object.assign(a, { x: e.x, y: e.y });
        } else if (index === 4) {
          const closure = this.dreadClosurePlan(e);
          if (!closure) return null;
          Object.assign(a, {
            x: e.x,
            y: e.y,
            radius: closure.initialRadius,
            ...closure,
          });
        }
        return { first: a, sequence };
      }
      startCaptainAttack(e, target, withdrawal = false) {
        if (!dread(e)) return previous.startCaptainAttack.call(this, e, target, withdrawal);
        const plans = R.roomCaptains['supply-crown'].attacks,
          brood = this.captainOwnedSummons(e).length;
        let eligible = plans
          .map((p, i) => ({ p, i }))
          .filter(
            (x) =>
              this.dreadEligible(e, target, x.i) &&
              (!withdrawal || this.enemyWithdrawalPlan(e, x.p, x.i)),
          );
        if (!eligible.length) return false;
        let chosen;
        if (!e.captainOpeningSummon && brood === 0 && eligible.some((x) => x.i === 3)) {
          chosen = eligible.find((x) => x.i === 3);
          e.captainOpeningSummon = true;
        }
        if (!chosen) {
          const withoutRepeat = eligible.filter((x) => x.i !== e.lastCaptainAttack);
          if (withoutRepeat.length) eligible = withoutRepeat;
          const candidates = eligible.map((x) => ({
            ...x,
            weight:
              1 +
              (x.i === 3 ? 4 - brood : 0) +
              (x.i === 5 && brood >= 2 ? 1 : 0) +
              (x.i === 1 && d(e, target) > 140 ? 1 : 0) +
              (x.i === 2 && d(e, target) < 130 ? 1.2 : 0) +
              (x.i === 4 && this.combatTargets().filter((u) => d(u, e) < 210).length > 1 ? 1 : 0),
          }));
          let roll = this.random() * candidates.reduce((n, x) => n + x.weight, 0);
          chosen = candidates.at(-1);
          for (const x of candidates) {
            roll -= x.weight;
            if (roll <= 0) {
              chosen = x;
              break;
            }
          }
        }
        const built = this.buildDreadAttack(e, target, chosen.i);
        if (!built) return false;
        if (!this.prepareAttackSequence(e, built.first, built.sequence)) return false;
        e.lastCaptainAttack = chosen.i;
        e.sequence = built.sequence;
        e.telegraph = built.first;
        e.specialCd = R.roomCaptains['supply-crown'].specialCooldown * (e.captainPhase ? 0.82 : 1);
        this.event('warning', { captain: e.captainProfile, index: chosen.i });
        return true;
      }
      resolveAttack(e) {
        const a = e.telegraph;
        if (!dread(e) || !a?.dreadMechanic || a.rogueMove)
          return previous.resolveAttack.call(this, e);
        if (a.dreadMechanic === 'rush') {
          e.motion = {
            ...a,
            dreadMotion: true,
            target: { x: a.x, y: a.y },
            speed: a.speed,
            life: a.motionLife,
            hits: [],
          };
          return;
        }
        if (a.dreadMechanic === 'feeding') {
          e.dreadFeedCd = a.cooldown;
          for (const u of this.captainOwnedSummons(e)) {
            if (!alive(u) || u.dreadFeedUntil > this.s.time) continue;
            u.dreadFeedUntil = this.s.time + a.duration;
            u.cd = Math.min(u.cd, 0.25);
          }
          return;
        }
        if (a.dreadMechanic === 'closure') {
          e.dreadClosure = { ...a, age: 0, radius: a.initialRadius, tick: 0 };
          return;
        }
        // Explicit specialist release owner, after the real cone warning.
        // The original direct contact may crit; delegated vapor-over-time
        // and its Slow remain wholly native and never carry this receipt.
        if (a.dreadMechanic === 'ensiling' && a.captainSkill &&
            a.captainProfile === 'supply-crown' && a.index === 2 &&
            a.kind === 'cone' && !a.criticalExecution) {
          const receipt = this.worldCriticalAction(e, 'world/captain/supply-crown/2');
          if (receipt) a.criticalExecution = receipt;
        }
        const hero = this.hero,
          zone = this.zoneId,
          deaths = this.s.statistics.deaths;
        previous.resolveAttack.call(this, e);
        if (interrupted(this, hero, zone, deaths) || !alive(e) || !e.aggro) return;
        if (a.dreadMechanic === 'ensiling' || a.dreadMechanic === 'steam') {
          e.dreadVapors ||= [];
          e.dreadVapors.push({
            x: a.x,
            y: a.y,
            angle: a.angle,
            angleDegrees: a.angleDegrees,
            radius: a.radius,
            kind: a.kind,
            life: a.vaporLife,
            age: 0,
            tick: 0,
            coefficient: a.vaporCoefficient,
            slow: a.dreadMechanic === 'ensiling',
            skill: a.index,
            tickInterval: a.vaporTick,
            slowDuration: a.slowDuration,
          });
          e.dreadVapors = e.dreadVapors.slice(-4);
        }
      }
      advanceQueuedAttack(e) {
        const a = previous.advanceQueuedAttack.call(this, e);
        if (dread(e) && a?.dreadLeg === 2) {
          Object.assign(a, {
            fromX: e.x,
            fromY: e.y,
            angle: Math.atan2(a.y - e.y, a.x - e.x),
          });
          if (!this.clearSegment(e, a, 15)) {
            e.sequence = [];
            return null;
          }
        }
        return a;
      }
      advanceMotion(e, dt) {
        const m = e.motion;
        if (!dread(e) || !m?.dreadMotion) return previous.advanceMotion.call(this, e, dt);
        const hero = this.hero,
          zone = this.zoneId,
          deaths = this.s.statistics.deaths,
          before = { x: e.x, y: e.y },
          distance = d(e, m.target),
          step = Math.min(distance, m.speed * dt),
          next = {
            x: e.x + ((m.target.x - e.x) * step) / Math.max(1e-9, distance),
            y: e.y + ((m.target.y - e.y) * step) / Math.max(1e-9, distance),
          };
        if (!this.clearSegment(e, next, 15)) {
          e.motion = null;
          e.sequence = [];
          e.cd = m.recovery;
          return;
        }
        Object.assign(e, next);
        m.life -= dt;
        for (const u of this.combatTargets()) {
          const key = u === this.hero ? 'hero' : u.id;
          if (
            u.hp <= 0 ||
            m.hits.includes(key) ||
            this.distanceToSegment(u, before, e) > m.radius ||
            !this.line(e, u)
          )
            continue;
          m.hits.push(key);
          this.hitParty(u, e.damage * m.coefficient, 0, e.id);
          if (interrupted(this, hero, zone, deaths)) return;
        }
        if (distance <= step + 1e-7 || m.life <= 0) {
          e.motion = null;
          e.cd = m.recovery * (e.captainAttackRate || 1);
          if (distance <= step + 1e-7) {
            e.telegraph = this.advanceQueuedAttack(e);
            if (e.telegraph)
              this.event('warning', { captain: e.captainProfile, index: e.telegraph.index });
          } else e.sequence = [];
        }
      }
      ownedSummonMovementFactor(u) {
        const owner =
          !this.peace &&
          u.summon &&
          u.dreadFeedUntil > this.s.time &&
          this.zone().enemies.find((e) => e.id === u.owner && dread(e) && alive(e) && e.aggro);
        return owner
          ? R.roomCaptains['supply-crown'].attacks[5].movementFactor
          : previous.ownedSummonMovementFactor.call(this, u);
      }
      updateCinderRegularState(e, dt, recovery = this.cooldownRecoveryElapsed(e, dt, true)) {
        if (e.dreadFeedUntil) {
          const owner = this.zone().enemies.find(
            (u) => u.id === e.owner && dread(u) && alive(u) && u.aggro,
          );
          if (this.peace || !owner || e.dreadFeedUntil <= this.s.time) delete e.dreadFeedUntil;
          else
            e.cd = Math.max(
              0,
              e.cd - recovery * (R.roomCaptains['supply-crown'].attacks[5].readinessFactor - 1),
            );
        }
        if (!dread(e)) return previous.updateCinderRegularState.call(this, e, dt, recovery);
        e.dreadFeedCd = Math.max(0, (e.dreadFeedCd || 0) - recovery);
        if (!alive(e) || !e.aggro || this.peace) {
          delete e.dreadClosure;
          delete e.dreadVapors;
          return previous.updateCinderRegularState.call(this, e, dt, recovery);
        }
        const hero = this.hero,
          zone = this.zoneId,
          deaths = this.s.statistics.deaths;
        for (const v of e.dreadVapors || []) {
          v.life -= dt;
          v.age += dt;
          v.tick -= dt;
          if (v.life <= 0 || v.tick > 0) continue;
          v.tick = v.tickInterval;
          for (const u of this.combatTargets()) {
            const inside =
              d(u, v) <= v.radius &&
              (v.kind !== 'cone' ||
                Math.cos(Math.atan2(u.y - v.y, u.x - v.x) - v.angle) >=
                  Math.cos((v.angleDegrees * Math.PI) / 360));
            if (u.hp <= 0 || !inside || !this.line(v, u)) continue;
            const hit = this.hitParty(u, e.damage * v.coefficient, 0, e.id);
            if (interrupted(this, hero, zone, deaths)) return true;
            if (hit) this.enemyVfxResolvedContact?.(e, v, u);
            if (hit && v.slow) this.applySlow(u, v.slowDuration);
          }
        }
        if (e.dreadVapors) e.dreadVapors = e.dreadVapors.filter((v) => v.life > 0);
        const ring = e.dreadClosure;
        if (ring) {
          ring.age = Math.min(ring.duration, ring.age + dt);
          ring.radius =
            ring.initialRadius +
            ((ring.finalRadius - ring.initialRadius) * ring.age) / ring.duration;
          ring.tick -= dt;
          if (ring.tick <= 0) {
            ring.tick = ring.tickInterval;
            for (const u of this.combatTargets()) {
              const angle = Math.atan2(u.y - ring.y, u.x - ring.x),
                safe = ring.gaps.some(
                  (a) =>
                    Math.abs(Math.atan2(Math.sin(angle - a), Math.cos(angle - a))) <=
                    ring.gapWidth / 2,
                );
              if (
                u.hp <= 0 ||
                safe ||
                Math.abs(d(u, ring) - ring.radius) > ring.width ||
                !this.line(ring, u)
              )
                continue;
              const landed = this.hitParty(u, e.damage * ring.coefficient, 0, e.id);
              if (interrupted(this, hero, zone, deaths)) return true;
              if (landed) this.enemyVfxResolvedContact?.(e, ring, u);
            }
          }
          if (ring.age >= ring.duration) {
            delete e.dreadClosure;
            for (const u of this.combatTargets()) {
              if (u.hp <= 0 || d(u, ring) > ring.finalBlastRadius || !this.line(ring, u)) continue;
              const landed = this.hitParty(u, e.damage * ring.finalCoefficient, 0, e.id);
              if (interrupted(this, hero, zone, deaths)) return true;
              if (landed) this.enemyVfxResolvedContact?.(e, ring, u);
            }
          }
        }
        return previous.updateCinderRegularState.call(this, e, dt, recovery);
      }
      clearEncounterState(e, units) {
        const result = previous.clearEncounterState.call(this, e, units);
        for (const key of ['dreadClosure', 'dreadVapors', 'dreadFeedCd', 'dreadFeedUntil'])
          delete e[key];
        return result;
      }
      cancelEncounter(e) {
        if (dread(e))
          for (const u of this.zone().enemies) if (u.owner === e.id) delete u.dreadFeedUntil;
        return previous.cancelEncounter.call(this, e);
      }
    }
    const descriptors = Object.getOwnPropertyDescriptors(Agriculture.prototype);
    delete descriptors.constructor;
    Object.defineProperties(P, descriptors);
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeDreadmawCombat = api;
})(typeof window !== 'undefined' ? window : globalThis);
