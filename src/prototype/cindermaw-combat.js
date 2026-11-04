/* Cindermaw's approved ministry attacks. Extends existing Campaign owners;
 * no browser state, separate campaign store, or new enemy population. */
(function (root) {
  'use strict';
  function install(Campaign, { D, R }) {
    const P = Campaign.prototype,
      previous = {};
    for (const key of [
      'bossAttackWeights',
      'bossAttackTarget',
      'buildBossAttack',
      'resolveAttack',
      'advanceMotion',
      'clearEncounterState',
      'cancelEncounter',
      'damage',
      'summonBossAdds',
      'tacticalRogueLeashAllows',
    ])
      previous[key] = P[key];
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
      angleDistance = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))),
      alive = (e) => e && e.hp > 0 && !e.neutral && !e.returning,
      isMinister = (e) => e?.type === 'boss' && e.family === 'cindermaw',
      // Unsaved, actor-scoped inspection-selection frontiers. No game-state
      // or authored itinerary change; each stop uses the native terrain grid.
      inspectionPlans = new WeakMap(),
      interrupted = (c, hero, zone, deaths) =>
        c.hero !== hero ||
        c.zoneId !== zone ||
        c.s.statistics.deaths !== deaths ||
        c.s.challenge.pending ||
        c.s.challenge.gameOver;
    class Ministry {
      cinderPatroller(e) {
        return isMinister(e) && this.zoneId === 'crown';
      }
      veraCaptive(z = this.zone()) {
        return z.npcs.find((n) => n.id === 'cage-cindermaw');
      }
      veraHeld() {
        return !this.peace && !this.s.rescued.cindermaw && !this.s.keys.cindermaw;
      }
      migrateCinderInspection(z) {
        if (z.id !== 'crown') return;
        const n = this.veraCaptive(z);
        if (!n) return;
        n.presentation = 'mobile-forge';
        n.workKind = 'smith';
        n.context =
          'Vera is the paid but captive chief field engineer. Her guarded mobile forge travels on Cindermaw’s ministerial inspections. She repairs nearby Ash-beast defensive equipment, but cannot leave until freed.';
        if (z.cinderInspectionVersion === 1) return;
        // Designate existing ordinary residents once; no new troop or changed
        // home, species, reward, population or respawn identity.
        const home = this.fieldCenter(4);
        const guards = z.enemies
          .filter(
            (u) =>
              u.hp > 0 &&
              u.type === 'mob' &&
              u.species === 'ashbeast' &&
              !u.summon &&
              !u.guard &&
              !u.mini &&
              !u.strongholdResident,
          )
          .sort((a, b) => dist(a, home) - dist(b, home) || this.idOrder(a, b))
          .slice(0, R.cinderInspection.guardCap);
        n.escortGuardIds = guards.map((u) => u.id);
        for (const u of guards) u.veraEscort = true;
        for (const e of z.enemies) if (isMinister(e)) e.home = { ...home };
        z.cinderInspectionVersion = 1;
      }
      cinderInspectionStops() {
        return R.cinderInspection.stops.map((p) => ({ ...p, ...this.safe(p.x, p.y, 'crown') }));
      }
      cinderEntourageTogether(e) {
        const n = this.veraCaptive(),
          cfg = R.cinderInspection;
        if (!n || !this.veraHeld()) return true;
        if (dist(n, e) > cfg.waitForCaptive) return false;
        return (n.escortGuardIds || []).every((id) => {
          const u = this.zone().enemies.find((a) => a.id === id);
          return !u || u.hp <= 0 || u.aggro || dist(u, e) <= cfg.waitForCaptive + 50;
        });
      }
      updateCinderInspection(e, dt) {
        if (!this.cinderPatroller(e) || e.aggro || e.neutral || this.peace || e.hp <= 0)
          return false;
        if (e.cinderReturn) {
          inspectionPlans.delete(e);
          this.disengage(e, dt);
          return true;
        }
        if (!this.cinderEntourageTogether(e)) return true;
        const cfg = R.cinderInspection;
        e.cinderInspectionPause = Math.max(0, (e.cinderInspectionPause ?? cfg.pauseMin) - dt);
        if (!e.cinderDestination) {
          const last = Number.isInteger(e.cinderStop) ? e.cinderStop : 0;
          let search = inspectionPlans.get(e);
          if (!search || search.zone !== this.zoneId ||
              search.fightStart !== e.fightStart || search.stop !== last ||
              dist(search.origin, e) > 20) {
            search = { zone: this.zoneId, fightStart: e.fightStart,
              stop: last, origin: { x: e.x, y: e.y },
              stops: this.cinderInspectionStops().map((p, i) => ({ ...p, i })),
              index: 0, choices: [], pending: null };
            inspectionPlans.set(e, search);
          }
          // Previously the synchronous filter finished four complete routes
          // (plus a fifth follow search) in a single inspection tick.
          // Preserve original candidate order and single random draw, but
          // carry each native path-search frontier across finite updates.
          while (search.index < search.stops.length) {
            const stop = search.stops[search.index];
            if (stop.i === last) { search.index++; continue; }
            const pending = search.pending;
            const result = this.advanceBudgetedRoute(
              pending?.origin || e, pending?.target || stop,
              'cinder-selection', pending,
            );
            if (result.pending) {
              search.pending = result.state;
              return true;
            }
            search.pending = null;
            // Keep each solver-approved waypoint list alongside its original
            // facility candidate. The selected itinerary must not pay for the
            // same costly search a second time after the authored pause.
            if (result.path.length) search.choices.push({ ...stop, path: result.path });
            search.index++;
          }
          // Plan during the already-authored inspection pause. The boss
          // still selects its next facility only when that pause expires;
          // no extra random draw or earlier movement is introduced.
          if (e.cinderInspectionPause > 0) return true;
          inspectionPlans.delete(e);
          if (!search.choices.length) {
            e.cinderInspectionPause = cfg.pauseMin;
            return true;
          }
          const p = search.choices[
            Math.min(search.choices.length - 1, Math.floor(this.random() * search.choices.length))
          ];
          e.cinderDestination = { x: p.x, y: p.y, name: p.name, i: p.i };
          // An invalidated first leg falls back to a new bounded search;
          // never trust a stale path after collision/actor displacement.
          if (!this.adoptBudgetedRoute(e, e.cinderDestination, 'cinder-patrol', p.path)) {
            delete e.path;
            e.routeAge = 0;
          }
        }
        if (e.cinderInspectionPause > 0) return true;
        const p = e.cinderDestination;
        this.follow(e, p, cfg.speed * (e.slow > 0 ? 0.5 : 1), dt, cfg.arrival, 'cinder-patrol');
        if (dist(e, p) <= cfg.arrival + 1e-7) {
          e.cinderStop = p.i;
          delete e.cinderDestination;
          delete e.path;
          e.cinderInspectionPause = cfg.pauseMin + this.random() * (cfg.pauseMax - cfg.pauseMin);
        }
        return true;
      }
      updateVeraEscort(u, dt) {
        if (
          !u.veraEscort ||
          this.zoneId !== 'crown' ||
          u.hp <= 0 ||
          u.aggro ||
          u.neutral ||
          u.returning
        )
          return false;
        const e = this.zone().enemies.find((a) => isMinister(a) && a.hp > 0 && !a.neutral);
        if (e && this.veraHeld()) {
          const captive = this.veraCaptive(),
            index = captive?.escortGuardIds?.indexOf(u.id) ?? 0,
            center = captive || e,
            preferred = this.safe(center.x + (index === 0 ? -65 : 65), center.y + 35, 'crown'),
            // Near a large solid the nearest safe offset can land beyond the
            // minister's wait radius. Collapse formation in that narrow space
            // so correctly positioned guards cannot deadlock the itinerary.
            point =
              dist(preferred, e) <= R.cinderInspection.waitForCaptive + 20 ? preferred : center;
          this.follow(u, point, R.cinderInspection.guardSpeed, dt, 20, 'cinder-guard');
          return true;
        }
        // Liberation/victory cancels compulsory escort; surviving ordinary
        // guards walk home rather than snapping back or spawning replacements.
        if (dist(u, u.home) > 1) {
          this.follow(u, u.home, R.cinderInspection.guardSpeed, dt, 0, 'cinder-guard');
          return true;
        }
        delete u.veraEscort;
        return false;
      }
      updateVeraFieldwork(dt) {
        if (this.zoneId !== 'crown') return;
        const z = this.zone(),
          n = this.veraCaptive(z),
          e = z.enemies.find((a) => isMinister(a) && a.hp > 0 && !a.neutral);
        if (
          !n ||
          !e ||
          !this.veraHeld() ||
          this.hero.hp <= 0 ||
          this.s.challenge.pending ||
          this.s.challenge.gameOver
        ) {
          this.clearVeraRepairs(z);
          return;
        }
        // Reuse the established collision/follow machinery. Vera never joins
        // the party, target lists or damage resolver.
        this.follow(n, e, R.cinderInspection.captiveSpeed, dt, R.cinderInspection.separation, 'cinder-escort');
        if (!e.aggro || e.returning || e.cinderReturn) {
          this.clearVeraRepairs(z);
          return;
        }
        const cfg = R.cinderInspection.repairs;
        const eligible = this.cinderAllies(e, cfg.radius + R.cinderInspection.separation).filter(
          (u) => u.aggro && dist(u, n) <= cfg.radius && this.line(n, u),
        );
        for (const u of eligible)
          if (!u.veraEquipment) {
            const max = Math.min(
              cfg.equipmentMax,
              Math.max(cfg.equipmentMin, u.baseHp * cfg.equipmentHpFraction),
            );
            u.veraEquipment = { owner: e.id, max, remaining: max };
          }
        n.veraRepairDue = Math.max(0, (n.veraRepairDue ?? cfg.interval) - dt);
        if (n.veraRepairDue > 0) return;
        n.veraRepairDue = cfg.interval;
        const target = eligible
          .filter(
            (u) =>
              u.veraEquipment?.owner === e.id && u.veraEquipment.remaining < u.veraEquipment.max,
          )
          .sort(
            (a, b) =>
              a.veraEquipment.remaining / a.veraEquipment.max -
                b.veraEquipment.remaining / b.veraEquipment.max || this.idOrder(a, b),
          )[0];
        if (!target) return;
        const equipment = target.veraEquipment;
        equipment.remaining = Math.min(
          equipment.max,
          equipment.remaining + equipment.max * cfg.restoreFraction,
        );
        n.veraRepairUntil = this.s.time + 0.7;
        n.veraRepairTarget = target.id;
      }
      clearVeraRepairs(z = this.zone()) {
        for (const u of z.enemies) delete u.veraEquipment;
        const n = this.veraCaptive(z);
        if (n)
          for (const key of ['veraRepairDue', 'veraRepairUntil', 'veraRepairTarget']) delete n[key];
      }
      cinderAllies(e, radius, ready = false) {
        return this.zone().enemies.filter(
          (u) =>
            u !== e &&
            alive(u) &&
            u.type === 'mob' &&
            u.species === 'ashbeast' &&
            dist(u, e) <= radius &&
            (!ready ||
              (!u.telegraph &&
                !u.motion &&
                !u.rangedAim &&
                !u.cinderDelegate &&
                !u.slow &&
                (!this._tacticalCinderResponses?.has(u.id) ||
                  this._tacticalCinderResponses.get(u.id).joined))),
        );
      }
      cinderHealthiest(e) {
        return (
          this.combatTargets()
            .filter((u) => u.hp > 0 && dist(u, e) <= R.bossCadence.specialRange && this.line(e, u))
            .sort(
              (a, b) =>
                b.hp / b.maxHp - a.hp / a.maxHp ||
                b.hp - a.hp ||
                String(a.id || 'hero').localeCompare(String(b.id || 'hero')),
            )[0] || null
        );
      }
      cinderGapPlan(e, target) {
        const plan = R.attacks.cindermaw[0],
          toward = Math.atan2(target.y - e.y, target.x - e.x),
          angles = [
            toward,
            toward + Math.PI / 2,
            toward - Math.PI / 2,
            toward + Math.PI,
            ...Array.from({ length: 72 }, (_, i) => (i * Math.PI) / 36),
          ],
          valid = [];
        for (const angle of angles) {
          if (valid.some((a) => angleDistance(a, angle) < 0.05)) continue;
          const safe = Array.from({ length: 9 }, (_, i) => (i / 8 - 0.5) * plan.gapWidth).every(
            (offset) => {
              const point = {
                x: e.x + Math.cos(angle + offset) * (plan.initialRadius + plan.width + 15),
                y: e.y + Math.sin(angle + offset) * (plan.initialRadius + plan.width + 15),
              };
              return (
                !this.blocked(point.x, point.y, this.zoneId, 15) && this.clearSegment(e, point, 15)
              );
            },
          );
          if (safe) valid.push(angle);
        }
        const first = valid[0],
          second = valid.find((a) => angleDistance(a, first) >= Math.PI / 2 - 0.05);
        return Number.isFinite(first) && Number.isFinite(second) ? [first, second] : null;
      }
      cinderDelegatePlan(e, target) {
        const plan = R.attacks.cindermaw[5],
          candidates = this.cinderAllies(e, plan.radius, true),
          chosen = [],
          toward = Math.atan2(e.y - target.y, e.x - target.x);
        for (let j = 0; j < plan.delegateCap; j++) {
          const angle = toward + (j * Math.PI) / 2,
            point = {
              x: target.x + Math.cos(angle) * plan.approachRadius,
              y: target.y + Math.sin(angle) * plan.approachRadius,
            };
          if (
            this.blocked(point.x, point.y, this.zoneId, 15) ||
            !this.clearSegment(point, target, 15)
          )
            continue;
          const eligible = candidates
            .filter((u) => !chosen.some((p) => p.id === u.id))
            .sort((a, b) => dist(a, point) - dist(b, point) || this.idOrder(a, b));
          const unit = eligible.find((u) => this.route(u, point).length);
          if (unit) chosen.push({ id: unit.id, point, angle });
        }
        return chosen;
      }
      cinderSealPlan(e, target) {
        const p = R.attacks.cindermaw[3],
          party = this.combatTargets().filter((u) => u.hp > 0 && dist(u, target) <= 320),
          center = party.length
            ? {
                x: party.reduce((n, u) => n + u.x, 0) / party.length,
                y: party.reduce((n, u) => n + u.y, 0) / party.length,
              }
            : target,
          start = Math.atan2(target.y - e.y, target.x - e.x),
          marks = [];
        for (let j = 0; j < p.count; j++) {
          let mark;
          for (const radius of [
            p.sealOrbit,
            p.sealOrbit + 35,
            p.sealOrbit - 30,
            p.sealOrbit + 70,
          ]) {
            for (const offset of [0, 0.18, -0.18, 0.36, -0.36]) {
              const angle = start + (j * Math.PI * 2) / p.count + offset,
                point = {
                  x: center.x + Math.cos(angle) * radius,
                  y: center.y + Math.sin(angle) * radius,
                };
              if (
                !this.blocked(point.x, point.y, this.zoneId, 15) &&
                marks.every((m) => dist(m, point) >= p.radius * 1.5) &&
                this.route(target, point).length
              ) {
                mark = point;
                break;
              }
            }
            if (mark) break;
          }
          if (!mark) return null;
          marks.push(mark);
        }
        return marks;
      }
      bossAttackWeights(e, target = this.hero, allowRepeat = false) {
        if (!isMinister(e)) return previous.bossAttackWeights.call(this, e, target, allowRepeat);
        const plans = R.attacks.cindermaw,
          d = dist(e, target),
          wounded = this.cinderAllies(e, 360).some((u) => u.hp < u.maxHp),
          cap = this.bossSummonCap(e);
        return plans.map((p, i) => {
          if (!allowRepeat && e.lastAttackIndex === i) return 0;
          if (e.cinderDelegation) return 0;
          if (e.cinderCordon && ![2, 6].includes(i)) return 0;
          if (i === 0 && !this.cinderGapPlan(e, target)) return 0;
          if (i === 1 && !this.clearSegment(e, target, 15)) return 0;
          if (i === 3 && !this.cinderSealPlan(e, target)) return 0;
          if (
            i === 2 &&
            (!this.cinderAllies(e, p.radius).length || (e.cinderProtectionCd || 0) > 0)
          )
            return 0;
          if (i === 4 && (!wounded || !this.cinderHealthiest(e))) return 0;
          if (i === 5 && !this.cinderDelegatePlan(e, target).length) return 0;
          if (i === 6 && (this.bossOwnedSummons(e).length >= cap || (e.summonCd || 0) > 0))
            return 0;
          let weight = i === 6 ? 2 + Math.max(0, cap - this.bossOwnedSummons(e).length) : 1;
          if (i === 4 && wounded) weight *= 2.4;
          if (d <= 180 && [0, 1, 2, 5].includes(i)) weight *= 1.8;
          if (d > 230 && [0, 3, 4, 6].includes(i)) weight *= 1.8;
          return weight;
        });
      }
      bossAttackTarget(e, fallback = this.hero, index = 0) {
        if (isMinister(e) && index === 4) return this.cinderHealthiest(e) || fallback;
        return previous.bossAttackTarget.call(this, e, fallback, index);
      }
      buildBossAttack(e, index, target, includeTrue = true) {
        if (!isMinister(e) || index === 6)
          return previous.buildBossAttack.call(this, e, index, target, includeTrue);
        const p = R.attacks.cindermaw[index],
          centered = [0, 2, 5].includes(index),
          a = {
            ...p,
            family: 'cindermaw',
            index,
            name: D.bosses.find((b) => b.id === 'cindermaw').attacks[index].split(':')[0],
            timer: p.warning,
            total: p.warning,
            count: 1,
            x: centered ? e.x : target.x,
            y: centered ? e.y : target.y,
            fromX: e.x,
            fromY: e.y,
            angle: Math.atan2(target.y - e.y, target.x - e.x),
            targetId: target === this.hero ? 'hero' : target.id,
            radius: p.radius || p.initialRadius || 55,
          },
          sequence = [];
        if (index === 0) {
          const gaps = this.cinderGapPlan(e, target);
          if (gaps) {
            a.gapAngle = gaps[0];
            a.nextGap = gaps[1];
          }
        }
        if (index === 3) {
          const marks = this.cinderSealPlan(e, target);
          if (!marks) return { first: null, sequence: [] };
          Object.assign(a, marks[0], { stage: 1, stages: p.count });
          for (let j = 1; j < marks.length; j++)
            sequence.push({
              ...a,
              ...marks[j],
              stage: j + 1,
              timer: p.stageWarning,
              total: p.stageWarning,
            });
        }
        if (index === 5) {
          a.delegates = this.cinderDelegatePlan(e, target);
          a.delegateCenter = { x: target.x, y: target.y };
        }
        return { first: a, sequence };
      }
      cinderStripTemporaryDefense(unit) {
        if (unit.hp <= 0) return;
        unit.immune = 0;
        if (unit === this.hero && unit.tonic) this.clearTonic();
      }
      cinderProtection(unit) {
        const guard = unit?.cinderGuard,
          owner = guard && this.zone().enemies.find((e) => e.id === guard.owner);
        return guard &&
          guard.until > this.s.time &&
          alive(owner) &&
          owner.aggro &&
          owner.cinderProtectionCast?.until > this.s.time
          ? { guard, owner }
          : null;
      }
      damage(unit, amount, source = 'hero', options = null) {
        const protectedState = this.cinderProtection(unit),
          before = unit?.hp,
          hero = this.hero,
          zone = this.zoneId,
          deaths = this.s.statistics.deaths,
          result = previous.damage.call(
            this,
            unit,
            protectedState ? amount * R.attacks.cindermaw[2].protectionFactor : amount,
            source,
            options,
          );
        const lost = Math.max(0, (before || 0) - (unit?.hp || 0));
        if (!protectedState || !result || !lost || interrupted(this, hero, zone, deaths))
          return result;
        const { owner } = protectedState,
          cast = owner.cinderProtectionCast,
          p = R.attacks.cindermaw[2],
          attacker =
            source === 'hero' ? this.hero : this.activeLivingParty().find((u) => u.id === source);
        if (
          !cast ||
          cast.until <= this.s.time ||
          !alive(owner) ||
          !owner.aggro ||
          !attacker ||
          attacker.hp <= 0 ||
          dist(attacker, unit) > p.retaliationRange ||
          !this.line(unit, attacker) ||
          cast.reactions >= p.retaliationLimit ||
          (cast.last[source] ?? -Infinity) + p.retaliationCooldown > this.s.time
        )
          return result;
        cast.reactions++;
        cast.last[source] = this.s.time;
        const landed = this.hitParty(
          attacker,
          owner.damage * p.retaliationCoefficient,
          0,
          owner.id,
        );
        if (landed && !interrupted(this, hero, zone, deaths))
          this.enemyVfxResolvedContact?.(owner, cast, attacker, {
            ...p,
            index: 2,
            kind: 'circle',
            selfDefense: false,
          });
        return result;
      }
      cinderCriticalAction(e, a) {
        if (!isMinister(e) || !a || a.index < 0 || a.index > 6 ||
            a.cinderMechanic !== R.attacks.cindermaw[a.index]?.cinderMechanic ||
            !this._criticalWorldNative?.enabled) return null;
        if (a.criticalExecution) return a.criticalExecution;
        const receipt = this.worldCriticalAction(e, 'world/boss/cindermaw/' + a.index);
        if (receipt) {
          a.criticalExecution = receipt;
          // Repeated warned marks within the same original move inherit the
          // first release, rather than creating fresh rolls at each impact.
          for (const next of e.sequence || []) {
            if (next.index !== a.index || next.cinderMechanic !== a.cinderMechanic) break;
            next.criticalExecution = receipt;
          }
        }
        return receipt;
      }
      resolveAttack(e) {
        const a = e.telegraph;
        if (a?.cinderDelegate) {
          const owner = this.zone().enemies.find((u) => u.id === a.cinderOwner);
          if (!alive(owner) || !owner.cinderDelegation || e.slow > 0) return;
          e.motion = {
            ...a,
            ...(owner.cinderDelegation.criticalExecution
              ? { criticalExecution: owner.cinderDelegation.criticalExecution } : {}),
            cinderMotion: 'delegate',
            target: { x: a.x, y: a.y },
            speed: R.attacks.cindermaw[5].rushSpeed,
            life: R.attacks.cindermaw[5].delegateLife,
            hits: [],
            recovery: 0.7,
          };
          return;
        }
        if (isMinister(e) && a?.kind === 'summon' && a.index === 6) {
          // A Ministry responder critical is decided only after real summons
          // were admitted. The generic boss owner retains the exact plan,
          // population cap and cooldown; setup summons never consume RNG.
          const before = new Set(this.bossOwnedSummons(e).map((u) => u.id));
          const result = previous.resolveAttack.call(this, e);
          const born = this.bossOwnedSummons(e).filter((u) => !before.has(u.id));
          if (born.length) {
            const receipt = this.cinderCriticalAction(e, a);
            if (receipt?.critical)
              for (const u of born) {
                const hp = u.maxHp;
                const enhanced = Math.max(hp, Math.round(
                  this._criticalWorldNative.enhance(receipt, hp, 'summonVitality'),
                ));
                u.maxHp = enhanced;
                u.hp = Math.min(enhanced, u.hp + enhanced - hp);
              }
          }
          return result;
        }
        if (!isMinister(e) || !a?.cinderMechanic || a.rogueMove)
          return previous.resolveAttack.call(this, e);
        if (a.cinderMechanic === 'cordon') {
          if (!Number.isFinite(a.gapAngle) || !Number.isFinite(a.nextGap)) return;
          this.cinderCriticalAction(e, a);
          e.cinderCordon = {
            ...a,
            elapsed: 0,
            life: a.cordonLife,
            radius: a.initialRadius,
            switched: false,
            burns: {},
            warning: false,
          };
        } else if (a.cinderMechanic === 'distraint') {
          this.cinderCriticalAction(e, a);
          e.motion = {
            ...a,
            cinderMotion: 'distraint',
            target: { x: a.x, y: a.y },
            speed: a.speed,
            life: a.life,
            hits: [],
          };
        } else if (a.cinderMechanic === 'protection') {
          const protectedAllies = this.cinderAllies(e, a.radius);
          if (protectedAllies.length) this.cinderCriticalAction(e, a);
          const duration = this.worldBossEffect(a, a.duration, 'wardDuration');
          e.cinderProtectionCast = { until: this.s.time + duration, reactions: 0, last: {} };
          e.cinderProtectionCd = a.protectionCooldown;
          for (const u of protectedAllies)
            u.cinderGuard = { owner: e.id, until: this.s.time + duration };
        } else if (a.cinderMechanic === 'seals') {
          this.cinderCriticalAction(e, a);
          return previous.resolveAttack.call(this, e);
        } else if (a.cinderMechanic === 'equalisation') {
          const target =
              a.targetId === 'hero'
                ? this.hero
                : this.activeLivingParty().find((u) => u.id === a.targetId),
            hero = this.hero,
            zone = this.zoneId,
            deaths = this.s.statistics.deaths;
          if (!target || target.hp <= 0 || dist(target, a) > a.radius || !this.line(e, target))
            return;
          this.cinderCriticalAction(e, a);
          const hp = target.hp;
          this.hitParty(
            target, this.worldBossEffect(a, e.damage * a.coefficient, 'damage'), 0, e.id,
          );
          if (interrupted(this, hero, zone, deaths) || !alive(e) || !e.aggro) return;
          const actual = Math.max(0, hp - target.hp);
          if (!actual) return;
          const recipient = this.cinderAllies(e, a.allyRange)
            .filter((u) => u.hp < u.maxHp)
            .sort(
              (u, v) => u.hp / u.maxHp - v.hp / v.maxHp || u.hp - v.hp || this.idOrder(u, v),
            )[0];
          if (recipient) {
            const amount = Math.min(actual, recipient.maxHp - recipient.hp);
            recipient.hp += amount;
            this.event('heal', {
              x: recipient.x,
              y: recipient.y,
              target: recipient.id,
              amount,
              source: e.id,
              cinderEqualisation: true,
            });
          }
        } else if (a.cinderMechanic === 'delegation') {
          if (!a.delegates?.length) return;
          const center = { ...a.delegateCenter };
          e.cinderDelegation = {
            members: a.delegates.map((p) => p.id),
            center,
            index: 0,
            life: a.delegationLife,
            finishing: false,
          };
          for (const plan of a.delegates) {
            const unit = this.zone().enemies.find((u) => u.id === plan.id);
            if (!alive(unit) || unit.slow > 0) {
              this.stopCinderDelegation(e);
              return;
            }
            unit.cinderDelegate = {
              owner: e.id,
              point: plan.point,
              center,
              phase: 'approach',
              stalled: 0,
            };
            this.engage(unit, true, false);
            unit.path = [];
            unit.routeAge = 0;
          }
          const receipt = this.cinderCriticalAction(e, a);
          if (receipt) e.cinderDelegation.criticalExecution = receipt;
        } else if (a.cinderMechanic === 'finisher') {
          if (!this.validCinderDelegation(e)) {
            this.stopCinderDelegation(e);
            return;
          }
          e.motion = {
            ...a,
            ...(e.cinderDelegation.criticalExecution
              ? { criticalExecution: e.cinderDelegation.criticalExecution } : {}),
            cinderMotion: 'finisher',
            target: { x: a.x, y: a.y },
            speed: R.attacks.cindermaw[1].speed,
            life: 2,
            hits: [],
          };
        }
      }
      validCinderDelegation(e) {
        return e.cinderDelegation?.members.every((id) => {
          const u = this.zone().enemies.find((u) => u.id === id);
          return alive(u) && !u.slow && u.cinderDelegate?.owner === e.id;
        });
      }
      stopCinderDelegation(e) {
        for (const u of this.zone().enemies)
          if (u.cinderDelegate?.owner === e.id) {
            delete u.cinderDelegate;
            if (u.telegraph?.cinderOwner === e.id) u.telegraph = null;
            if (u.motion?.cinderOwner === e.id) u.motion = null;
            u.path = [];
            u.routeAge = 0;
          }
        delete e.cinderDelegation;
        if (e.telegraph?.cinderMechanic === 'finisher') e.telegraph = null;
        if (e.motion?.cinderMotion === 'finisher') e.motion = null;
        e.cd = Math.max(e.cd || 0, R.attacks.cindermaw[5].recovery);
      }
      updateCinderDelegate(u, dt) {
        const order = u.cinderDelegate,
          p = R.attacks.cindermaw[5],
          owner = this.zone().enemies.find((e) => e.id === order.owner),
          state = owner?.cinderDelegation;
        if (
          !alive(owner) ||
          !owner.aggro ||
          !state ||
          u.slow > 0 ||
          (order.phase === 'warning' &&
            (!u.telegraph?.cinderDelegate || u.telegraph.cinderOwner !== order.owner))
        ) {
          if (owner) this.stopCinderDelegation(owner);
          else delete u.cinderDelegate;
          return true;
        }
        if (order.phase === 'approach') {
          if (dist(u, order.point) > 8) {
            const before = { x: u.x, y: u.y };
            this.follow(u, order.point, p.approachSpeed, dt, 0);
            order.stalled = dist(u, before) > Math.max(0.1, dt * 10) ? 0 : order.stalled + dt;
            if (order.stalled > 2.5) this.stopCinderDelegation(owner);
            return true;
          }
          order.phase = 'ready';
        }
        if (order.phase === 'ready' && state.members[state.index] === u.id) {
          u.telegraph = {
            family: 'cindermaw',
            index: 5,
            cinderDelegate: true,
            cinderOwner: owner.id,
            cinderMechanic: 'delegate',
            kind: 'line',
            charge: true,
            name: 'Devolution of Authority',
            fromX: u.x,
            fromY: u.y,
            x: order.center.x,
            y: order.center.y,
            angle: Math.atan2(order.center.y - u.y, order.center.x - u.x),
            radius: 55,
            count: 1,
            coefficient: p.delegateCoefficient,
            timer: p.delegateWarning,
            total: p.delegateWarning,
            recovery: 0.7,
            stage: state.index + 1,
            stages: state.members.length,
          };
          order.phase = 'warning';
          this.event('warning', { source: u.id, family: 'ashbeast' });
        } else if (order.phase === 'warning') {
          u.telegraph.timer -= dt;
          if (u.telegraph.timer <= 0) {
            this.resolveAttack(u);
            u.telegraph = null;
            order.phase = 'rush';
          }
        } else if (order.phase === 'rush') {
          if (u.motion) this.advanceMotion(u, dt);
          if (!u.motion && u.cinderDelegate) {
            order.phase = 'done';
            state.index++;
          }
        }
        return true;
      }
      updateCinderRegularState(e, dt, recovery = this.cooldownRecoveryElapsed(e, dt, true)) {
        if (e.cinderGuard?.until <= this.s.time) delete e.cinderGuard;
        if (e.cinderDelegate) return this.updateCinderDelegate(e, dt);
        if (!isMinister(e)) return false;
        e.cinderProtectionCd = Math.max(0, (e.cinderProtectionCd || 0) - recovery);
        if (e.cinderProtectionCast?.until <= this.s.time) {
          delete e.cinderProtectionCast;
          for (const u of this.zone().enemies)
            if (u.cinderGuard?.owner === e.id) delete u.cinderGuard;
        }
        if (!alive(e) || !e.aggro || this.peace) {
          delete e.cinderCordon;
          if (e.cinderDelegation) this.stopCinderDelegation(e);
          return false;
        }
        if (e.cinderCordon && !this.advanceCinderCordon(e, dt)) return true;
        const state = e.cinderDelegation;
        if (!state) return false;
        state.life -= dt;
        if (state.life <= 0 || !this.validCinderDelegation(e)) {
          this.stopCinderDelegation(e);
          return true;
        }
        if (state.index >= state.members.length && !state.finishing) {
          state.finishing = true;
          const p = R.attacks.cindermaw[5];
          e.telegraph = {
            ...p,
            family: 'cindermaw',
            index: 5,
            cinderMechanic: 'finisher',
            kind: 'line',
            charge: true,
            selfDefense: false,
            name: 'Devolution of Authority — finishing strike',
            fromX: e.x,
            fromY: e.y,
            x: state.center.x,
            y: state.center.y,
            angle: Math.atan2(state.center.y - e.y, state.center.x - e.x),
            coefficient: p.finisherCoefficient,
            radius: p.finisherRadius,
            count: 1,
            timer: p.finisherWarning,
            total: p.finisherWarning,
            recovery: p.recovery,
          };
          this.event('warning', { family: 'cindermaw', index: 5 });
        }
        // The ordinary warning/motion bridge owns the final physical strike.
        return !state.finishing;
      }
      advanceCinderCordon(e, dt) {
        const c = e.cinderCordon,
          p = R.attacks.cindermaw[0],
          hero = this.hero,
          zone = this.zoneId,
          deaths = this.s.statistics.deaths;
        c.elapsed += dt;
        c.life = Math.max(0, p.cordonLife - c.elapsed);
        c.radius =
          p.initialRadius +
          (p.finalRadius - p.initialRadius) * Math.min(1, c.elapsed / p.cordonLife);
        c.warning = !c.switched && c.elapsed >= p.switchAt - p.switchWarning;
        if (!c.switched && c.elapsed >= p.switchAt) {
          c.gapAngle = c.nextGap;
          c.switched = true;
          c.warning = false;
        }
        const hits = (unit) =>
          unit.hp > 0 &&
          this.line({ x: c.x, y: c.y }, unit) &&
          angleDistance(Math.atan2(unit.y - c.y, unit.x - c.x), c.gapAngle) > p.gapWidth / 2;
        for (const unit of this.combatTargets().filter(hits)) {
          const key = unit === this.hero ? 'hero' : unit.id,
            r = dist(unit, c),
            final = c.life <= 0,
            contact = final ? r <= c.radius + p.width : Math.abs(r - c.radius) <= p.width;
          if (!contact || (!final && (c.burns[key] ?? -Infinity) + p.tickInterval > this.s.time))
            continue;
          c.burns[key] = this.s.time;
          const landed = this.hitParty(
            unit,
            final
              ? this.worldBossEffect(c, e.damage * p.blastCoefficient, 'damage')
              : e.damage * p.coefficient,
            0,
            e.id,
          );
          if (interrupted(this, hero, zone, deaths) || !alive(e)) return false;
          if (landed) this.enemyVfxResolvedContact?.(e, c, unit);
        }
        if (c.life <= 0) delete e.cinderCordon;
        return true;
      }
      advanceMotion(e, dt) {
        const m = e.motion;
        if (!m?.cinderMotion) return previous.advanceMotion.call(this, e, dt);
        if (m.cinderMotion === 'delegate') {
          const owner = this.zone().enemies.find((u) => u.id === m.cinderOwner);
          if (!alive(owner) || !this.validCinderDelegation(owner) || e.slow > 0) {
            if (owner) this.stopCinderDelegation(owner);
            e.motion = null;
            return;
          }
        }
        const before = { x: e.x, y: e.y },
          step = Math.min(dt, m.life),
          hero = this.hero,
          zone = this.zoneId,
          deaths = this.s.statistics.deaths;
        const remaining = dist(e, m.target),
          distance = Math.min(remaining, m.speed * step),
          next =
            remaining > 0
              ? {
                  x: e.x + ((m.target.x - e.x) / remaining) * distance,
                  y: e.y + ((m.target.y - e.y) / remaining) * distance,
                }
              : before;
        // A warned straight rush cannot slide onto an unannounced alternate lane.
        if (this.clearSegment(e, next, 15)) Object.assign(e, next);
        m.life -= dt;
        if (dist(e, before) < 1e-7 && dist(e, m.target) > 8) {
          if (m.cinderMotion === 'delegate') {
            const owner = this.zone().enemies.find((u) => u.id === m.cinderOwner);
            if (owner) this.stopCinderDelegation(owner);
          }
          e.motion = null;
          e.cd = m.recovery;
          return;
        }
        const candidates =
          m.cinderMotion === 'distraint'
            ? this.combatTargets().filter((u) =>
                m.targetId === 'hero' ? u === this.hero : u.id === m.targetId,
              )
            : this.combatTargets();
        for (const unit of candidates) {
          const key = unit === this.hero ? 'hero' : unit.id;
          if (
            unit.hp <= 0 ||
            m.hits.includes(key) ||
            this.distanceToSegment(unit, before, e) > 55 ||
            !this.line(e, unit)
          )
            continue;
          m.hits.push(key);
          if (m.cinderMotion === 'distraint') this.cinderStripTemporaryDefense(unit);
          this.hitParty(
            unit, this.worldBossEffect(m, e.damage * m.coefficient, 'damage'), 0, e.id,
          );
          if (interrupted(this, hero, zone, deaths)) return;
        }
        if (dist(e, m.target) <= 8 || m.life <= 0) {
          e.motion = null;
          e.cd = m.recovery;
          if (m.cinderMotion === 'finisher') this.stopCinderDelegation(e);
        }
      }
      tacticalRogueLeashAllows(e, target, territory) {
        const order = e?.cinderDelegate,
          owner = order && this.zone().enemies.find((u) => u.id === order.owner);
        if (order && alive(owner) && owner.cinderDelegation && target?.hp > 0)
          return dist(target, owner) <= 700 && dist(e, owner) <= 900;
        if (
          e.veraEscort &&
          e.veraFightAnchor &&
          this.zoneId === 'crown' &&
          target?.hp > 0 &&
          dist(target, e.veraFightAnchor) <= territory &&
          dist(e, e.veraFightAnchor) <= territory + 200
        )
          return true;
        if (e.veraEscort && this.zoneId === 'crown' && this.veraHeld()) {
          const minister = this.zone().enemies.find((u) => isMinister(u) && alive(u) && u.aggro);
          if (
            minister &&
            target?.hp > 0 &&
            dist(e, minister) <= 700 &&
            dist(target, minister) <= 700
          )
            return true;
        }
        return previous.tacticalRogueLeashAllows.call(this, e, target, territory);
      }
      clearEncounterState(e, units) {
        const result = previous.clearEncounterState.call(this, e, units);
        for (const key of [
          'cinderCordon',
          'cinderProtectionCast',
          'cinderProtectionCd',
          'cinderGuard',
          'cinderDelegation',
          'cinderDelegate',
          'veraEquipment',
          'cinderFightAnchor',
          'veraFightAnchor',
        ])
          delete e[key];
        return result;
      }
      cancelEncounter(e) {
        if (isMinister(e)) this.clearVeraRepairs();
        if (e.cinderDelegate) {
          const owner = this.zone().enemies.find((u) => u.id === e.cinderDelegate.owner);
          if (owner) this.stopCinderDelegation(owner);
        }
        if (e.cinderDelegation) this.stopCinderDelegation(e);
        for (const u of this.zone().enemies)
          if (u.cinderGuard?.owner === e.id) delete u.cinderGuard;
        return previous.cancelEncounter.call(this, e);
      }
      summonBossAdds(e, plan, cap) {
        const before = new Set(this.zone().enemies.map((u) => u.id)),
          result = previous.summonBossAdds.call(this, e, plan, cap);
        if (isMinister(e)) {
          const born = this.bossOwnedSummons(e).filter((u) => !before.has(u.id));
          for (const u of born)
            u.name =
              e.form !== 'true'
                ? 'Ministry responder'
                : u.trueSummonRole === 'captain'
                  ? 'TRUE Ministry responder Ringleader'
                  : 'TRUE-bound Ministry responder';
          // This helper only preserves responder identity. Critical potency
          // belongs to the original action owner after admitted spawns exist.
        }
        return result;
      }
    }
    const descriptors = Object.getOwnPropertyDescriptors(Ministry.prototype);
    delete descriptors.constructor;
    Object.defineProperties(P, descriptors);
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeCindermawCombat = api;
})(typeof window !== 'undefined' ? window : globalThis);
