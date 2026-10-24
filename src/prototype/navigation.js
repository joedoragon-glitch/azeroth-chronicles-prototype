/* Collision, line-of-sight and pathfinding. Same rules for every platform. */
(function (root) {
  'use strict';
  function install(Campaign, D, R, dungeonIds) {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    // Runtime-only broad phase and congestion clocks. Never persist crowd state.
    const crowds = new WeakMap();
    // Opt-in and unsaved. Install wrappers on this campaign instance only so
    // disabled diagnostics add zero overhead to production collision methods.
    const diagnosticSessions = new WeakMap();
    const diagnosticMetrics = [
      'moveCalls', 'moveMs', 'moveSegmentCalls', 'segmentCalls', 'segmentMs',
      'segmentPoints', 'blockedCalls', 'blockedMs', 'actorStepCalls', 'actorStepMs',
      'nearbyActorHits', 'separationCalls', 'separationMs', 'separationBodies',
      'separationSegments', 'routeCalls', 'routeMs', 'actors', 'maxCellBodies',
    ];
    const diagnosticNow = () => performance.now();
    function diagnosticSummary(values) {
      if (!values.length) return { samples: 0, mean: 0, p95: 0, max: 0 };
      const sorted = values.slice().sort((a, b) => a - b);
      const round = x => Math.round(x * 100) / 100;
      return { samples: values.length,
        mean: round(values.reduce((a, b) => a + b, 0) / values.length),
        p95: round(sorted[Math.floor((values.length - 1) * 0.95)]),
        max: round(sorted.at(-1)) };
    }
    const watchedMethods = [
      ['move', 'moveCalls', 'moveMs'],
      ['clearSegment', 'segmentCalls', 'segmentMs'],
      ['blocked', 'blockedCalls', 'blockedMs'],
      ['actorStepAllowed', 'actorStepCalls', 'actorStepMs'],
      ['separateActors', 'separationCalls', 'separationMs'],
      ['route', 'routeCalls', 'routeMs'],
      ['nearbyActors', null, null],
      ['actorCrowd', null, null],
    ];
    const crowdPressure = new WeakMap(),
      terrainTrips = new WeakMap();
    const patrolResumes = new WeakMap();
    const sceneryReady = new WeakSet();
    const companionTrips = new WeakMap(),
      laborThreatFrames = new WeakMap(),
      unsupportedPursuits = new WeakSet();
    class Navigation {
      startCrowdDiagnostics() {
        const existing = diagnosticSessions.get(this);
        if (existing?.recording) return;
        const session = existing || { rows: [], originals: [] };
        session.rows = [];
        session.current = null;
        session.recording = true;
        diagnosticSessions.set(this, session);
        for (const [name, count, elapsed] of watchedMethods) {
          const hadOwn = Object.hasOwn(this, name),
            original = this[name];
          session.originals.push({ name, hadOwn, original });
          // Capture the original implementation. No wrapper remains after Stop.
          this[name] = function (...args) {
            const row = session.current;
            if (!row) return original.apply(this, args);
            if (count) row[count]++;
            const started = elapsed ? diagnosticNow() : 0;
            const beforeSegments = row.segmentCalls;
            const beforeBlocked = row.blockedCalls;
            let result;
            try { result = original.apply(this, args); }
            finally {
              if (elapsed) row[elapsed] += diagnosticNow() - started;
              if (name === 'move') row.moveSegmentCalls += row.segmentCalls - beforeSegments;
              if (name === 'clearSegment') row.segmentPoints += row.blockedCalls - beforeBlocked;
              if (name === 'separateActors') row.separationSegments += row.segmentCalls - beforeSegments;
            }
            if (name === 'nearbyActors') row.nearbyActorHits += result.length;
            if (name === 'actorCrowd') {
              row.actors = Math.max(row.actors, result.bodies.length);
              for (const bin of result.bins.values())
                row.maxCellBodies = Math.max(row.maxCellBodies, bin.size);
              // The number of collision bodies the separation phase evaluates.
              // Only count the refresh that starts passive separation.
              if (args[0] === true) row.separationBodies += result.bodies.length;
            }
            return result;
          };
        }
      }
      stopCrowdDiagnostics() {
        const session = diagnosticSessions.get(this);
        if (!session?.recording) return;
        session.current = null;
        session.recording = false;
        for (const { name, hadOwn, original } of session.originals) {
          if (hadOwn) this[name] = original;
          else delete this[name];
        }
        session.originals = [];
      }
      crowdDiagnosticsBeginFrame() {
        const session = diagnosticSessions.get(this);
        if (!session?.recording) return;
        session.current = Object.fromEntries(diagnosticMetrics.map(key => [key, 0]));
      }
      crowdDiagnosticsEndFrame() {
        const session = diagnosticSessions.get(this);
        if (!session?.current) return;
        session.rows.push(session.current);
        if (session.rows.length > 120) session.rows.shift();
        session.current = null;
      }
      crowdDiagnosticsReport() {
        const session = diagnosticSessions.get(this);
        const rows = session?.rows || [], metrics = {};
        for (const key of diagnosticMetrics)
          metrics[key] = diagnosticSummary(rows.map(row => row[key]));
        return {
          recording: !!session?.recording,
          sampledSimulationTicks: rows.length,
          sampleLimit: 120,
          metrics,
          note: 'Opt-in, device-local only. Timed movement, blocked, route and separation calls are nested and include observation overhead; do not add these timings or treat them as physical FPS. Only active gameplay ticks are sampled.',
        };
      }
      crowdDiagnosticsDescribe() {
        const r = this.crowdDiagnosticsReport(), m = r.metrics;
        if (!r.sampledSimulationTicks)
          return 'Crowd diagnostics: no active gameplay ticks recorded. Start sampling, return to the game, and approach a crowded fight.';
        return 'Crowd diagnostics · ' + r.sampledSimulationTicks + ' ticks' +
          (r.recording ? ' (recording)' : '') +
          '\\nMove ms mean/p95 ' + m.moveMs.mean + '/' + m.moveMs.p95 +
          ' · separation ' + m.separationMs.mean + '/' + m.separationMs.p95 +
          ' · route ' + m.routeMs.mean + '/' + m.routeMs.p95 +
          '\\nCalls/tick mean: move ' + m.moveCalls.mean +
          ', blocked ' + m.blockedCalls.mean +
          ', segment samples ' + m.segmentPoints.mean +
          ', nearby actors ' + m.nearbyActorHits.mean +
          '; max actors in one grid cell ' + m.maxCellBodies.max +
          '. Timings overlap; opt-in sampling has overhead.';
      }
      observeCrowdFrame(intervalMs, active = true) {
        const zone = this.s.zones[this.zoneId],
          cfg = R.actorSpacing;
        // Ignore background/resume gaps and intentional pauses. Cadence is only
        // an urgency signal: low FPS alone never disables body collision.
        if (!active || !Number.isFinite(intervalMs) || intervalMs <= 0 || intervalMs > 1000) {
          crowdPressure.delete(this);
          return;
        }
        let pressure = crowdPressure.get(this);
        if (pressure?.zone !== zone) pressure = { zone, slow: 0, until: 0 };
        pressure.slow =
          intervalMs >= cfg.slowFrameMs
            ? pressure.slow + Math.min(intervalMs / 1000, 0.1)
            : Math.max(0, pressure.slow - intervalMs / 1000);
        if (pressure.slow >= cfg.slowFrameSeconds) {
          pressure.slow = cfg.slowFrameSeconds;
          pressure.until = this.s.time + cfg.escapeSeconds;
        }
        crowdPressure.set(this, pressure);
      }
      crowdUnderPressure() {
        const pressure = crowdPressure.get(this);
        return pressure?.zone === this.s.zones[this.zoneId] && pressure.until > this.s.time;
      }
      crowdEscaping(unit, frame = this.actorCrowd()) {
        return (frame.congestion.get(unit)?.until || 0) > this.s.time;
      }
      reserveMovementPlan(unit) {
        const frame = this.actorCrowd(),
          limit = R.actorSpacing.movementPlansPerTick;
        // Leave one slot for the player's approach order. Deferred actors keep
        // following a valid cached route, or wait until the next simulation tick.
        if (frame.plans >= limit || (unit !== this.hero && frame.otherPlans >= limit - 1))
          return false;
        frame.plans++;
        if (unit !== this.hero) frame.otherPlans++;
        return true;
      }
      gatheringUnit(u) {
        return u?.order?.type === 'gather' || u?.order?.type === 'deposit';
      }
      gatheringThreats() {
        let frame = laborThreatFrames.get(this);
        const z = this.s.zones[this.zoneId];
        if (frame?.zone === z && frame.time === this.s.time && frame.enemies === z.enemies)
          return frame.threats;
        const cfg = R.gatheringTravel;
        const threats = this.peace
          ? []
          : z.enemies
              .filter((e) => e.hp > 0 && !e.neutral && !e.returning)
              .map((e) => ({
                x: e.x,
                y: e.y,
                r:
                  Math.max(
                    this.enemyAcquisitionRange(e),
                    this.enemyRanged(e) ? this.enemyRangedRange(e) : 0,
                    e.type === 'boss' ? R.bossCadence.specialRange : 0,
                  ) + cfg.enemyMargin,
              }));
        laborThreatFrames.set(this, { zone: z, time: this.s.time, enemies: z.enemies, threats });
        return threats;
      }
      companionTravelClear(a, b, threats = [], origin = a) {
        if (!this.clearSegment(a, b)) return false;
        // A troop already caught inside awareness can leave it, while routes
        // from safety never deliberately enter the enemy's acquisition radius.
        return threats.every(
          (e) => this.distanceToSegment(e, a, b) >= Math.min(e.r, dist(e, origin)) - 0.001,
        );
      }
      companionRoute(a, b, gathering = false) {
        const target = this.safe(b.x, b.y),
          threats = gathering ? this.gatheringThreats() : [],
          step = R.gatheringTravel.gridStep,
          n = Math.ceil(this.zoneSize() / step),
          point = (id) => ({
            x: (id % n) * step + step / 2,
            y: Math.floor(id / n) * step + step / 2,
          }),
          clear = (p, q) => this.companionTravelClear(p, q, threats, a),
          valid = new Map(),
          free = (id) => {
            if (!valid.has(id)) {
              const p = point(id);
              valid.set(id, !this.blocked(p.x, p.y));
            }
            return valid.get(id);
          };
        if (clear(a, target)) return [target];
        const near = (p) => {
            const out = [],
              cx = Math.floor(p.x / step),
              cy = Math.floor(p.y / step);
            for (let dx = -2; dx <= 2; dx++)
              for (let dy = -2; dy <= 2; dy++) {
                const x = cx + dx,
                  y = cy + dy,
                  id = y * n + x;
                if (x >= 0 && y >= 0 && x < n && y < n && free(id) && clear(p, point(id)))
                  out.push(id);
              }
            return out.sort((i, j) => dist(point(i), p) - dist(point(j), p)).slice(0, 8);
          },
          starts = near(a),
          ends = new Set(near(target));
        if (!starts.length || !ends.size) return [];
        // Eight-direction A* minimizes actual travel distance rather than the
        // old four-direction breadth-first hop count. Every diagonal and every
        // smoothed segment still obeys physical collision and hostile clearance.
        const heap = [],
          cost = new Map(),
          parents = new Map(),
          push = (id, g) => {
            const item = { id, g, f: g + dist(point(id), target) };
            let i = heap.length;
            heap.push(item);
            while (i) {
              const p = (i - 1) >> 1;
              if (heap[p].f <= item.f) break;
              heap[i] = heap[p];
              i = p;
            }
            heap[i] = item;
          },
          pop = () => {
            const first = heap[0],
              last = heap.pop();
            if (heap.length) {
              let i = 0;
              while (i * 2 + 1 < heap.length) {
                let j = i * 2 + 1;
                if (j + 1 < heap.length && heap[j + 1].f < heap[j].f) j++;
                if (heap[j].f >= last.f) break;
                heap[i] = heap[j];
                i = j;
              }
              heap[i] = last;
            }
            return first;
          };
        for (const id of starts) {
          const g = dist(a, point(id));
          cost.set(id, g);
          parents.set(id, null);
          push(id, g);
        }
        while (heap.length) {
          const current = pop(),
            id = current.id;
          if (current.g !== cost.get(id)) continue;
          if (ends.has(id)) {
            const path = [target];
            for (let at = id; at !== null; at = parents.get(at)) path.push(point(at));
            path.reverse();
            const smooth = [];
            let from = a,
              j = 0;
            while (j < path.length) {
              let far = j;
              for (let k = path.length - 1; k > j; k--)
                if (clear(from, path[k])) {
                  far = k;
                  break;
                }
              smooth.push(path[far]);
              from = path[far];
              j = far + 1;
            }
            return smooth;
          }
          const x = id % n,
            y = Math.floor(id / n),
            from = point(id);
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
          ]) {
            const xx = x + dx,
              yy = y + dy,
              next = yy * n + xx;
            if (xx < 0 || yy < 0 || xx >= n || yy >= n || !free(next)) continue;
            const g = current.g + step * Math.hypot(dx, dy);
            if (g >= (cost.get(next) ?? Infinity) || !clear(from, point(next))) continue;
            cost.set(next, g);
            parents.set(next, id);
            push(next, g);
          }
        }
        return [];
      }
      clearCompanionTravel(u) {
        companionTrips.delete(u);
        unsupportedPursuits.delete(u);
        u.path = [];
        u.routeAge = 0;
      }
      companionPursuitAnchors(u) {
        return [
          this.hero,
          ...this.activeLivingParty().filter(
            (ally) =>
              ally !== u &&
              !ally.order &&
              ally.hp / ally.maxHp > R.companionJudgment.woundedFraction &&
              dist(ally, u) <= R.companionJudgment.supportRadius &&
              this.clearSegment(ally, u),
          ),
        ];
      }
      companionSupportDistance(u, p, anchors = this.companionPursuitAnchors(u)) {
        return Math.min(...anchors.map((a) => dist(p, a)));
      }
      companionPursuitDetour(u) {
        return unsupportedPursuits.has(u);
      }
      companionPursuitRouteAllowed(u, path, stop = 0) {
        const max = R.companionJudgment.maxAdvanceFromHero,
          anchors = this.companionPursuitAnchors(u);
        return path.every((p, j) => {
          if (j < path.length - 1) return this.companionSupportDistance(u, p, anchors) <= max;
          const from = path[j - 1] || u,
            d = Math.max(1, dist(from, p)),
            reach = Math.min(stop, d),
            end = { x: p.x + ((from.x - p.x) * reach) / d, y: p.y + ((from.y - p.y) * reach) / d };
          return this.companionSupportDistance(u, end, anchors) <= max;
        });
      }
      followCompanion(u, target, speed, dt, stop, avoidHostiles = false) {
        if (dist(u, target) <= stop) return true;
        const gathering = this.gatheringUnit(u),
          cautious = avoidHostiles,
          pursuing =
            !gathering &&
            !this.s.recallActive &&
            !this.companionRetreating(u) &&
            this._tacticalPartyTargets?.has(u.id),
          threats = cautious ? this.gatheringThreats() : [];
        if (!pursuing) unsupportedPursuits.delete(u);
        if (this.companionTravelClear(u, target, threats)) {
          if (pursuing && !this.companionPursuitRouteAllowed(u, [target], stop)) {
            unsupportedPursuits.add(u);
            u.path = [{ x: target.x, y: target.y }];
            return false;
          }
          companionTrips.delete(u);
          u.path = [];
          return this.move(u, target, speed, dt, stop);
        }
        let trip = companionTrips.get(u);
        if (
          !trip ||
          trip.zone !== this.zoneId ||
          trip.cautious !== cautious ||
          dist(trip.target, target) > 30
        ) {
          trip = {
            zone: this.zoneId,
            cautious,
            target: { x: target.x, y: target.y },
            age: 0,
            path: [],
          };
          companionTrips.set(u, trip);
        }
        trip.age -= dt;
        if (trip.path.length && !this.companionTravelClear(u, trip.path[0], threats)) {
          trip.path = [];
          trip.age = 0;
        }
        if (trip.age <= 0) {
          if (this.reserveMovementPlan(u)) {
            trip.path = this.companionRoute(u, target, cautious);
            trip.age = R.gatheringTravel.replanSeconds;
            trip.target = { x: target.x, y: target.y };
            u.path = trip.path;
          } else if (!trip.path.length) return false;
        }
        while (trip.path.length && dist(u, trip.path[0]) < 1) trip.path.shift();
        if (!trip.path.length) {
          if (gathering && this.s.time >= (this._gatherRouteNoticeAt || 0)) {
            this._gatherRouteNoticeAt = this.s.time + R.gatheringTravel.noticeSeconds;
            this.notice(
              'Gathering route is blocked by terrain.',
              2.8,
              'Try another resource site or Recall the squad.',
              'feedback',
            );
          }
          return false;
        }
        if (pursuing && !this.companionPursuitRouteAllowed(u, trip.path, stop)) {
          unsupportedPursuits.add(u);
          return false;
        }
        unsupportedPursuits.delete(u);
        const moved = this.move(u, trip.path[0], speed, dt);
        if (dist(u, trip.path[0]) < 1) trip.path.shift();
        return moved;
      }
      roamingBoss(e) {
        return this.thornPatroller(e) || this.cinderPatroller(e);
      }
      attackResetProtected(e) {
        return (
          this.fieldBossReturning(e) ||
          (!!(e.returning || e.thornReturn || e.cinderReturn) && !this.roamingBoss(e))
        );
      }
      patrolResume(e) {
        const state = patrolResumes.get(this)?.get(e.id);
        return state?.zone === this.zoneId ? state : null;
      }
      capturePatrolResume(e) {
        if (!this.roamingBoss(e)) return;
        if (!patrolResumes.has(this)) patrolResumes.set(this, new Map());
        patrolResumes.get(this).set(e.id, {
          zone: this.zoneId,
          point: { x: e.x, y: e.y },
          leg: e.thornLeg ?? R.thornPatrol.startLeg,
          pause: e.thornPause || 0,
          destination: e.cinderDestination ? { ...e.cinderDestination } : null,
          stop: e.cinderStop ?? 0,
          inspectionPause: e.cinderInspectionPause || 0,
        });
      }
      releasePatrolResume(e) {
        patrolResumes.get(this)?.delete(e.id);
      }
      clearPatrolResumes() {
        patrolResumes.delete(this);
      }
      interruptPatrolReturn(e) {
        if (!this.roamingBoss(e)) return;
        e.returning = 0;
        delete e.thornReturn;
        delete e.cinderReturn;
        e.path = [];
        e.routeAge = 0;
      }
      interactionDistance(place) {
        return Math.min(dist(place, this.hero), dist(place.servicePoint || place, this.hero));
      }
      mapDestinations() {
        const zone = this.zone(),
          region = this.definition(),
          hidden = new Set([
            'supplier',
            'recruiter',
            'quests',
            'teacher',
            'smith',
            'alchemist',
            'cage',
            'bundle',
          ]);
        const places = this.visibleNPCs()
          .filter((n) => !n.thornFootprint && (this.isDungeon() || !hidden.has(n.kind)))
          .map((n) =>
            n.kind === 'rest' && n.id === 'rest' ? { ...n, name: region.town, icon: '🏘️' } : n,
          );
        const bases = zone.buildings.map((b) => ({
          ...b,
          kind: 'barracks',
          name: b.name || 'Barracks',
          icon: b.progress < 4 ? '🏗️' : '🏕️',
        }));
        // Thornfang's authored tracking clues stay on the map; never turn his
        // mobile patrol into an omniscient live destination.
        const bosses = zone.enemies
          .filter((e) => e.hp > 0 && e.type === 'boss' && !e.neutral && e.family !== 'thorn')
          .map((e) => ({
            ...e,
            name: e.name || this.boss(e.family)?.name || 'Boss',
            kind: 'boss',
            icon: '⚔️',
          }));
        return [...places, ...bases, ...bosses]
          .filter((n) => Number.isFinite(n.x) && Number.isFinite(n.y) && n.name)
          .sort((a, b) => dist(a, this.hero) - dist(b, this.hero));
      }
      navigationTarget(place) {
        if (!place || !Number.isFinite(place.x) || !Number.isFinite(place.y)) return null;
        const size = this.zoneSize(),
          anchor = place.servicePoint || place,
          harbor = place.kind === 'transport' && place.harbor ? R.harbors?.[this.zoneId] : null;
        // The authored ferry vessel floats offshore. Its ordinary offsets can
        // all land in water even when the adjacent *existing dock* is walkable.
        // This point is navigation-only: do not move the ferry, widen boarding
        // interaction range or mutate any saved NPC/service coordinates.
        if (harbor?.dock && dist(place, harbor.boat) < 1) {
          const dock = harbor.dock,
            clearance = 16, // A radius-15 actor stays strictly inside the dock.
            point = {
              x: Math.max(dock.x1 + clearance, Math.min(place.x, dock.x2 - clearance)),
              y: Math.max(dock.y1 + clearance, Math.min(place.y, dock.y2 - clearance)),
            };
          // The move order stops within 20 units: its final position must still
          // be within the transport's unchanged 115-unit interact radius.
          if (
            point.x >= 0 &&
            point.y >= 0 &&
            point.x <= size &&
            point.y <= size &&
            dist(point, place) + 20 < 115 &&
            !this.blocked(point.x, point.y)
          ) {
            const path = this.route(this.hero, point);
            if (path.length) return { point, path };
          }
        }
        for (const [dx, dy] of [
          [0, 0],
          [0, 65],
          [65, 0],
          [-65, 0],
          [0, -65],
          [65, 65],
          [-65, 65],
          [65, -65],
          [-65, -65],
        ]) {
          const point = { x: anchor.x + dx, y: anchor.y + dy };
          if (
            point.x < 0 ||
            point.y < 0 ||
            point.x > size ||
            point.y > size ||
            this.blocked(point.x, point.y)
          )
            continue;
          const path = this.route(this.hero, point);
          if (path.length) return { point, path };
        }
        return null;
      }
      actorRadius(unit) {
        const cfg = R.actorSpacing;
        return unit === this.hero
          ? cfg.heroRadius
          : unit.type === 'boss'
            ? cfg.bossRadius
            : unit.mountedCrownRider
              ? cfg.mountedRadius
              : unit.captain || unit.roomCaptain || unit.species === 'ogre'
                ? cfg.largeRadius
                : cfg.radius;
      }
      actorCrowd(refresh = false) {
        const zone = this.s.zones[this.zoneId];
        let frame = crowds.get(this);
        if (
          !refresh &&
          frame?.zone === zone &&
          frame.at === this.s.time &&
          frame.enemyList === zone?.enemies &&
          frame.enemyCount === zone?.enemies.length &&
          frame.partyList === this.s.party &&
          frame.partyCount === this.s.party.length &&
          frame.hero === this.hero
        )
          return frame;
        const enemies = (zone?.enemies || []).filter((u) => u.hp > 0 && !u.neutral),
          allies = [this.hero, ...this.activeLivingParty()].filter((u) => u.hp > 0),
          bodies = [...allies, ...enemies],
          previousBodies = frame?.bodies || [];
        frame = {
          zone,
          hero: this.hero,
          enemyList: zone?.enemies,
          enemyCount: zone?.enemies.length,
          partyList: this.s.party,
          partyCount: this.s.party.length,
          at: this.s.time,
          combatActive: this.manaCombatActive(),
          bodies,
          hostile: new Set(enemies),
          members: new Set(bodies),
          bins: new Map(),
          cells: new Map(),
          congestion: frame?.zone === zone ? frame.congestion : new WeakMap(),
          plans: frame?.zone === zone && frame.at === this.s.time ? frame.plans : 0,
          otherPlans: frame?.zone === zone && frame.at === this.s.time ? frame.otherPlans : 0,
        };
        crowds.set(this, frame);
        for (const unit of previousBodies)
          if (!frame.members.has(unit)) frame.congestion.delete(unit);
        for (const unit of bodies) this.indexActor(unit, frame);
        return frame;
      }
      indexActor(unit, frame = this.actorCrowd()) {
        if (!frame.members.has(unit)) return;
        const size = R.actorSpacing.cellSize,
          key = Math.floor(unit.x / size) + ':' + Math.floor(unit.y / size),
          old = frame.cells.get(unit);
        if (old === key) return;
        if (old) frame.bins.get(old)?.delete(unit);
        if (!frame.bins.has(key)) frame.bins.set(key, new Set());
        frame.bins.get(key).add(unit);
        frame.cells.set(unit, key);
      }
      nearbyActors(point, frame = this.actorCrowd()) {
        const size = R.actorSpacing.cellSize,
          x = Math.floor(point.x / size),
          y = Math.floor(point.y / size),
          out = [];
        for (let dx = -1; dx <= 1; dx++)
          for (let dy = -1; dy <= 1; dy++)
            for (const unit of frame.bins.get(x + dx + ':' + (y + dy)) || [])
              if (unit.hp > 0) out.push(unit);
        return out;
      }
      actorStepAllowed(unit, point, relaxFriendly = false, frame = this.actorCrowd()) {
        if (!frame.members.has(unit)) return true;
        const retreating = this.companionRetreatMode(unit),
          escaping = this.crowdEscaping(unit, frame);
        const candidates = new Set(),
          steps = Math.max(1, Math.ceil(dist(unit, point) / R.actorSpacing.cellSize));
        for (let j = 0; j <= steps; j++)
          for (const other of this.nearbyActors(
            {
              x: unit.x + ((point.x - unit.x) * j) / steps,
              y: unit.y + ((point.y - unit.y) * j) / steps,
            },
            frame,
          ))
            candidates.add(other);
        for (const other of candidates) {
          if (other === unit || other.hp <= 0) continue;
          const friendly = frame.hostile.has(unit) === frame.hostile.has(other),
            otherRetreating = this.companionRetreatMode(other);
          // Friends make room for a withdrawal. Ordinary travel also lets the
          // hero pass allies; other combat pairs keep their usual body blocking.
          if (
            friendly &&
            (retreating ||
              otherRetreating ||
              relaxFriendly ||
              (!frame.combatActive && (unit === this.hero || other === this.hero)))
          )
            continue;
          // Withdrawing party members receive friendly passage, never hostile
          // passage. Even an existing mixed-crowd escape cannot bypass this pair.
          if (!retreating && !otherRetreating && (escaping || this.crowdEscaping(other, frame)))
            continue;
          const gap = this.actorRadius(unit) + this.actorRadius(other),
            before = dist(unit, other),
            after = dist(point, other);
          // An already overlapped actor can leave, never deepen the stack.
          if (after < gap && after < Math.min(gap, before) - 0.01) return false;
          if (before >= gap && this.distanceToSegment(other, unit, point) < gap - 0.01)
            return false;
        }
        return true;
      }
      separateActors(dt) {
        // Scripted charges/repositions use their own authoritative movement owner.
        // Refresh their broad-phase positions before passive overlap recovery.
        const frame = this.actorCrowd(true),
          cfg = R.actorSpacing;
        for (const unit of frame.bodies) {
          const retreating = this.companionRetreatMode(unit);
          // Fixed warning origins, held victims and scripted motion remain authoritative.
          if (
            unit === this.hero ||
            unit.hp <= 0 ||
            unit.telegraph ||
            unit.motion ||
            unit.keeperHeld ||
            unit.deathRollHeld ||
            (this.crowdEscaping(unit, frame) && !retreating) ||
            this.partyChargeState(unit)
          )
            continue;
          let dx = 0,
            dy = 0;
          for (const other of this.nearbyActors(unit, frame)) {
            if (other === unit || other.hp <= 0) continue;
            const otherRetreating = this.companionRetreatMode(other),
              friendly = frame.hostile.has(unit) === frame.hostile.has(other);
            if (friendly && (retreating || otherRetreating)) continue;
            if (this.crowdEscaping(other, frame) && !retreating && !otherRetreating) continue;
            if (other === this.hero && !frame.combatActive && !frame.hostile.has(unit)) continue;
            const gap = this.actorRadius(unit) + this.actorRadius(other),
              distance = dist(unit, other),
              overlap = gap - distance;
            if (overlap <= cfg.tolerance) continue;
            // Stable opposite directions also separate exact coincident spawns.
            const sign = String(unit.id).localeCompare(String(other.id || 'hero')) < 0 ? -1 : 1,
              ux = distance > 0.01 ? (unit.x - other.x) / distance : sign,
              uy = distance > 0.01 ? (unit.y - other.y) / distance : sign * 0.5,
              weight = unit.type === 'boss' && other.type !== 'boss' ? 0.25 : 1;
            dx += ux * overlap * weight;
            dy += uy * overlap * weight;
          }
          const length = Math.hypot(dx, dy);
          if (!length) continue;
          const amount = Math.min(length, cfg.separationSpeed * dt),
            point = { x: unit.x + (dx / length) * amount, y: unit.y + (dy / length) * amount };
          const angle = Math.atan2(dy, dx);
          for (const p of [
            point,
            ...[0.7, -0.7, 1.35, -1.35].map((offset) => ({
              x: unit.x + Math.cos(angle + offset) * amount,
              y: unit.y + Math.sin(angle + offset) * amount,
            })),
          ]) {
            if (!this.clearSegment(unit, p) || !this.actorStepAllowed(unit, p, false, frame))
              continue;
            Object.assign(unit, p);
            this.indexActor(unit, frame);
            break;
          }
        }
      }
      setSceneryTraversal(z, ready = true) {
        if (ready) sceneryReady.add(z);
        else sceneryReady.delete(z);
      }
      sceneryMovementRadius(p, z) {
        const cfg = R.sceneryTraversal,
          r = cfg.radii[p.structure];
        if (r > 0 && !p.decorative) return p.r;
        if (r === undefined) return p.decorative ? null : p.r;
        if (r === 0) return null;
        // Keep mixed-use sites for the later case-by-case pass. This decision
        // depends on authored homes/services, never moving actors or frame rate.
        if (
          this.distanceToRoad(z, p) < cfg.roadClearance ||
          this.distanceToRoad({ roads: z.footpaths || [] }, p) < cfg.roadClearance ||
          z.npcs.some((n) => dist(p, n.servicePoint || n) < cfg.serviceClearance) ||
          z.nodes.some((n) => dist(p, n) < cfg.resourceClearance) ||
          z.buildings.some((b) => dist(p, b) < cfg.campClearance) ||
          z.enemies.some((e) => e.home && dist(p, e.home) < cfg.homeClearance)
        )
          return p.decorative ? null : p.r;
        return r;
      }
      blocked(x, y, zone = this.s.zone, radius = 15, terrainOnly = false, fort = null) {
        const i = this.regionIndex(zone),
          room = this.supplyRoom(zone),
          side = this.sideDungeon(zone),
          dungeon = dungeonIds.includes(zone),
          size = this.zoneSize(zone);
        if (
          !size ||
          x < 40 + radius ||
          y < 40 + radius ||
          x > size - 40 - radius ||
          y > size - 40 - radius
        )
          return true;
        if (room) {
          const architecture = R.treasuryArchitecture?.[zone];
          if (architecture) {
            const inside = (architecture.walkable || []).some((a) => {
              const [x1, x2, y1, y2] = a.bounds;
              return x > x1 + radius && x < x2 - radius && y > y1 + radius && y < y2 - radius;
            });
            if (!inside) return true;
            for (const w of architecture.partitions || []) {
              if (fort?.partitions.has(w.id)) continue;
              const hit =
                x > w.x1 - radius && x < w.x2 + radius && y > w.y1 - radius && y < w.y2 + radius;
              if (!hit) continue;
              const v = w.axis === 'x' ? x : y;
              if (!(w.gaps || []).some(([l, h]) => v > l + radius && v < h - radius)) return true;
            }
          } else
            for (const w of R.treasuryWalls?.[zone] || []) {
              if (fort?.partitions.has(w.id)) continue;
              const hit =
                x > w.x1 - radius && x < w.x2 + radius && y > w.y1 - radius && y < w.y2 + radius;
              if (!hit) continue;
              const v = w.axis === 'x' ? x : y;
              if (!(w.gaps || []).some(([l, h]) => v > l + radius && v < h - radius)) return true;
            }
        } else if (dungeon) {
          const architecture = R.dungeonArchitecture?.[zone];
          if (architecture) {
            const inside = (architecture.walkable || []).some((a) => {
              const [x1, x2, y1, y2] = a.bounds;
              return x > x1 + radius && x < x2 - radius && y > y1 + radius && y < y2 - radius;
            });
            if (!inside) return true;
            for (const w of architecture.partitions || []) {
              if (fort?.partitions.has(w.id)) continue;
              const hit =
                x > w.x1 - radius && x < w.x2 + radius && y > w.y1 - radius && y < w.y2 + radius;
              if (!hit) continue;
              const v = w.axis === 'x' ? x : y;
              if (!(w.gaps || []).some(([l, h]) => v > l + radius && v < h - radius)) return true;
            }
          } else {
            const [a, b, gaps] = R.dungeonWalls[zone];
            if (
              x > a - radius &&
              x < b + radius &&
              y > 120 &&
              y < 1260 &&
              !gaps.some(([l, h]) => y > l + radius && y < h - radius)
            )
              return true;
          }
        } else if (side) {
        } else {
          const {
            bounds: [, , c, e],
            gaps,
          } = R.barriers[i];
          const onInheritedDeck =
            zone === 'crown' &&
            this.s.zones[zone]?.crownInheritedDecks?.some(
              (d) =>
                x > d.x1 + radius && x < d.x2 - radius && y > d.y1 + radius && y < d.y2 - radius,
            );
          if (
            !onInheritedDeck &&
            y > c - radius &&
            y < e + radius &&
            !gaps.some(([l, h]) => y > l + radius && y < h - radius)
          ) {
            for (let at = y - radius; at <= y + radius + 0.01; at += Math.max(1, radius / 2)) {
              const [a, b] = R.channelBanks(i, at);
              if (x > a - radius && x < b + radius) return true;
            }
          }
        }
        if (!dungeon && !room && !side)
          for (const p of R.terrain[i])
            if (
              p.kind === 'rain-pools'
                ? R.rainPoolBlocked(p.pools, x, y, radius)
                : p.r
                  ? Math.hypot(x - p.x, y - p.y) < p.r + radius
                  : x > p.x1 - radius &&
                    x < p.x2 + radius &&
                    y > p.y1 - radius &&
                    y < p.y2 + radius &&
                    !(p.gaps || []).some(([l, h]) => y > l + radius && y < h - radius)
            )
              return true;
        if (!dungeon && !room && !side) {
          const harbor = R.harbors?.[D.regions[i]?.id];
          if (harbor) {
            const w = harbor.water,
              d = harbor.dock,
              onDock =
                x > d.x1 + radius && x < d.x2 - radius && y > d.y1 + radius && y < d.y2 - radius;
            if (!onDock && R.harborWaterBlocked(w, x, y, radius)) return true;
          }
        }
        const z = this.s.zones[zone];
        return (
          (!terrainOnly &&
            z?.props.some((p) => {
              if (fort?.props.has(p.id)) return false;
              // Zero-radius queries are the existing LOS/projectile contract.
              // Only positive-radius outdoor movement receives this first pass.
              const candidate =
                sceneryReady.has(z) &&
                radius > 0 &&
                !dungeon &&
                !room &&
                !side &&
                R.sceneryTraversal.radii[p.structure] !== undefined;
              const r = candidate
                ? Math.max(R.sceneryTraversal.radii[p.structure], p.decorative ? 0 : p.r)
                : p.decorative
                  ? null
                  : p.r;
              if (
                r === null ||
                (candidate && R.sceneryTraversal.radii[p.structure] === 0) ||
                Math.hypot(x - p.x, y - p.y) >= r + radius
              )
                return false;
              const body = candidate ? this.sceneryMovementRadius(p, z) : r;
              return body !== null && Math.hypot(x - p.x, y - p.y) < body + radius;
            })) ||
          false
        );
      }
      safe(x, y, zone = this.s.zone) {
        if (!this.blocked(x, y, zone)) return { x, y };
        for (let r = 30; r < 450; r += 30)
          for (let i = 0; i < 24; i++) {
            const a = (i * Math.PI) / 12,
              p = { x: x + Math.cos(a) * r, y: y + Math.sin(a) * r };
            if (!this.blocked(p.x, p.y, zone)) return p;
          }
        throw Error('No safe arrival');
      }
      line(a, b) {
        const n = Math.ceil(dist(a, b) / 20);
        for (let i = 1; i < n; i++)
          if (
            this.blocked(a.x + ((b.x - a.x) * i) / n, a.y + ((b.y - a.y) * i) / n, this.s.zone, 0)
          )
            return false;
        return true;
      }
      clearSegment(a, b, radius = 15, terrainOnly = false) {
        const n = Math.max(1, Math.ceil(dist(a, b) / 8));
        for (let j = 0; j <= n; j++)
          if (
            this.blocked(
              a.x + ((b.x - a.x) * j) / n,
              a.y + ((b.y - a.y) * j) / n,
              this.s.zone,
              radius,
              terrainOnly,
            )
          )
            return false;
        return true;
      }
      route(a, b, options = {}) {
        const terrainOnly = !!options.terrainOnly,
          target = this.safe(b.x, b.y),
          step = 50,
          size = this.zoneSize(),
          n = Math.ceil(size / step),
          point = (id) => ({ x: (id % n) * step + 25, y: Math.floor(id / n) * step + 25 });
        if (!options.road && this.clearSegment(a, target, 15, terrainOnly)) return [target];
        const nearby = (p) => {
          const out = [],
            cx = Math.floor(p.x / step),
            cy = Math.floor(p.y / step);
          for (let dx = -2; dx <= 2; dx++)
            for (let dy = -2; dy <= 2; dy++) {
              const x = cx + dx,
                y = cy + dy;
              if (x < 0 || y < 0 || x >= n || y >= n) continue;
              const id = y * n + x,
                q = point(id);
              if (
                !this.blocked(q.x, q.y, this.s.zone, 15, terrainOnly) &&
                this.clearSegment(p, q, 15, terrainOnly)
              )
                out.push(id);
            }
          return out.sort((x, y) => dist(point(x), p) - dist(point(y), p));
        };
        const starts = nearby(a),
          ends = nearby(target);
        if (!starts.length || !ends.length) return [];
        const search = (sources, goals) => {
          const queue = [...sources],
            parents = new Map(sources.map((id) => [id, null])),
            destinations = new Set(goals),
            valid = new Map();
          const free = (id) => {
            if (!valid.has(id)) {
              const p = point(id);
              valid.set(id, !this.blocked(p.x, p.y, this.s.zone, 15, terrainOnly));
            }
            return valid.get(id);
          };
          for (let at = 0; at < queue.length; at++) {
            const id = queue[at];
            if (destinations.has(id)) {
              let path = [target];
              for (let j = id; j !== null; j = parents.get(j)) path.push(point(j));
              path.reverse();
              if (options.road) {
                const compact = [{ x: a.x, y: a.y }];
                for (let j = 0; j < path.length; j++) {
                  const prev = compact.at(-1),
                    q = path[j],
                    next = path[j + 1];
                  if (
                    next &&
                    ((prev.x === q.x && q.x === next.x) || (prev.y === q.y && q.y === next.y))
                  )
                    continue;
                  compact.push(q);
                }
                return compact;
              }
              const smooth = [];
              let current = a,
                j = 0;
              while (j < path.length) {
                let far = j;
                for (let k = j + 1; k < path.length; k++) {
                  if (!this.clearSegment(current, path[k], 15, terrainOnly)) break;
                  far = k;
                }
                smooth.push(path[far]);
                current = path[far];
                j = far + 1;
              }
              return smooth;
            }
            const x = id % n,
              y = Math.floor(id / n),
              from = point(id);
            for (const [dx, dy] of [
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1],
            ]) {
              const xx = x + dx,
                yy = y + dy,
                j = yy * n + xx;
              if (
                xx < 0 ||
                yy < 0 ||
                xx >= n ||
                yy >= n ||
                parents.has(j) ||
                !free(j) ||
                !this.clearSegment(from, point(j), 15, terrainOnly)
              )
                continue;
              parents.set(j, id);
              queue.push(j);
            }
          }
          return [];
        };
        // Preserve all successful legacy routes and generated road geometry.
        // Only a false no-route retries with the other collision-validated
        // nearby anchors. Each seed and goal already has a clear end segment.
        const primary = search([starts[0]], [ends[0]]);
        return primary.length ? primary : search(starts, ends);
      }
      move(entity, target, speed, dt, stop = 0, forced = false) {
        const d = dist(entity, target);
        if (d <= stop) return true;
        const step = Math.min(d - stop, speed * dt),
          nx = entity.x + ((target.x - entity.x) / d) * step,
          ny = entity.y + ((target.y - entity.y) / d) * step;
        const frame = this.actorCrowd(),
          cfg = R.actorSpacing,
          congestion = frame.congestion.get(entity) || { blocked: 0, until: 0 };
        // A retreat cannot acquire or retain enemy-phasing from a previous jam.
        const retreating = this.companionRetreatMode(entity);
        if (retreating) congestion.until = 0;
        if (this.s.time - (congestion.at ?? this.s.time) > 0.25) congestion.blocked = 0;
        const elapsed = congestion.at === this.s.time ? 0 : Math.min(dt, 0.1),
          relaxed = (congestion.friendlyUntil || 0) > this.s.time;
        congestion.at = this.s.time;
        let crowdBlocked = false;
        const legal = (p) => {
          if (!this.clearSegment(entity, p)) return false;
          if (forced || entity.motion) return true;
          if (this.actorStepAllowed(entity, p, relaxed, frame)) return true;
          crowdBlocked = true;
          return false;
        };
        if (legal({ x: nx, y: ny })) {
          entity.x = nx;
          entity.y = ny;
          congestion.blocked = 0;
          frame.congestion.set(entity, congestion);
          this.indexActor(entity, frame);
          return true;
        }
        let moved = false;
        if (legal({ x: nx, y: entity.y })) {
          entity.x = nx;
          moved = true;
        }
        if (legal({ x: entity.x, y: ny })) {
          entity.y = ny;
          moved = true;
        }
        if (!moved && frame.members.has(entity)) {
          const angle = Math.atan2(target.y - entity.y, target.x - entity.x);
          // Local side steps form distinct approach slots without replanning terrain routes.
          for (const offset of [0.55, -0.55, 1.05, -1.05]) {
            const p = {
              x: entity.x + Math.cos(angle + offset) * step,
              y: entity.y + Math.sin(angle + offset) * step,
            };
            if (!legal(p)) continue;
            Object.assign(entity, p);
            moved = true;
            break;
          }
        }
        const advanced = d - dist(entity, target) > Math.min(0.5, step * 0.2);
        congestion.blocked = !advanced && crowdBlocked ? congestion.blocked + elapsed : 0;
        if (congestion.blocked >= cfg.congestionSeconds)
          congestion.friendlyUntil = this.s.time + cfg.relaxSeconds;
        const escapeAfter = this.crowdUnderPressure()
          ? cfg.pressureBlockedSeconds
          : cfg.escapeBlockedSeconds;
        if (congestion.blocked >= escapeAfter && !retreating) {
          // Terrain was clear but bodies prevented progress. Permit temporary
          // overlap, including opposing bodies/bosses; never teleport or replan.
          congestion.until = this.s.time + cfg.escapeSeconds;
          congestion.blocked = 0;
        }
        frame.congestion.set(entity, congestion);
        this.indexActor(entity, frame);
        return moved;
      }
      thornPatroller(e) {
        return e?.type === 'boss' && e.family === 'thorn' && this.zoneId === 'vale';
      }
      thornCaptive(z = this.zone()) {
        return z.npcs.find((n) => n.id === 'cage-thorn');
      }
      thornCaptiveFollowing() {
        return !this.peace && !this.s.rescued.thorn && !this.s.keys.thorn;
      }
      migrateThornPatrol(z) {
        if (z.id !== 'vale') return;
        for (const e of z.enemies)
          if (e.type === 'boss' && e.family === 'thorn' && e.form === 'true')
            e.home = { ...this.fieldCenter(0) };
        const n = this.thornCaptive(z);
        if (n) {
          n.presentation = 'mobile-captive';
          n.workKind = 'teacher';
          n.context =
            'Mira is paid for compulsory security-compliance inspections under Thornfang’s supervision. Wages do not make her free.';
        }
        // Static trailheads remain useful when footprints have faded. They are
        // physical clues, never destinations derived from the boss’s live position.
        for (const [i, [x, y]] of R.thornPatrol.route.entries()) {
          const id = 'thorn-trailhead-' + i;
          if (!z.npcs.some((n) => n.id === id))
            z.npcs.push({
              id,
              kind: 'landmark',
              name: 'Scout tracks · ' + R.thornPatrol.names[i],
              x,
              y,
              icon: '🐾',
              presentation: 'scout-tracks',
              thornTrail: i,
            });
        }
        let witness = z.npcs.find((n) => n.id === 'thorn-local-report');
        if (!witness) {
          z.npcs.push(
            (witness = {
              id: 'thorn-local-report',
              kind: 'patrol-report',
              name: 'Orchard trail witness',
              icon: '🧑',
              thornReport: true,
            }),
          );
        }
        // Open western road shoulder: clear of the hamlet roofs and lantern.
        // Reposition the same resident on old saves as well as fresh campaigns.
        Object.assign(witness, this.safe(780, 740, 'vale'));
      }
      thornReport(concise = false) {
        if (this.s.rescued.thorn) return 'Mira is free. Find her teaching in Millhaven.';
        if (this.s.keys.thorn) {
          const n = this.thornCaptive(),
            cfg = R.thornPatrol;
          const i = n
            ? cfg.route
                .map(([x, y], i) => ({ i, d: dist(n, { x, y }) }))
                .sort((a, b) => a.d - b.d)[0].i
            : 0;
          return (
            'Thornfang was defeated. Mira waits near ' +
            cfg.names[i] +
            '. Your journal can guide you to her last known waiting place.'
          );
        }
        const z = this.s.zones.vale,
          cfg = R.thornPatrol,
          scout = z?.enemies.find(
            (e) => e.family === 'thorn' && e.type === 'boss' && e.hp > 0 && !e.neutral,
          ),
          fresh = z?.npcs
            .filter((n) => n.thornFootprint && n.expires > this.s.time)
            .sort((a, b) => b.expires - a.expires)[0];
        let clue = '';
        if (scout) {
          const nearest = cfg.route
            .map(([x, y], i) => ({ i, d: dist(scout, { x, y }) }))
            .sort((a, b) => a.d - b.d)[0].i;
          const leg =
            Number.isInteger(scout.thornLeg) &&
            scout.thornLeg >= 0 &&
            scout.thornLeg < cfg.route.length
              ? scout.thornLeg
              : cfg.startLeg;
          clue =
            scout.returning || scout.thornReturn
              ? 'The patrol is returning to the temporary den. The tracks loop back there. '
              : scout.aggro
                ? 'There is fighting near ' +
                  cfg.names[nearest] +
                  '. Approach carefully; Mira is still with the patrol. '
                : 'The latest trail report puts the patrol near ' +
                  cfg.names[nearest] +
                  ', heading toward ' +
                  cfg.names[leg] +
                  '. ';
        }
        if (concise) {
          if (!scout) return 'No fresh sighting. Follow the pawprints from the temporary den.';
          if (scout.returning || scout.thornReturn)
            return 'Thornfang is returning to the temporary den with Mira.';
          const nearest = cfg.route
            .map(([x, y], i) => ({ i, d: dist(scout, { x, y }) }))
            .sort((a, b) => a.d - b.d)[0].i;
          const leg =
            Number.isInteger(scout.thornLeg) &&
            scout.thornLeg >= 0 &&
            scout.thornLeg < cfg.route.length
              ? scout.thornLeg
              : cfg.startLeg;
          return scout.aggro
            ? 'Fighting near ' + cfg.names[nearest] + '. Mira is still with Thornfang.'
            : 'Last sighting: ' +
                cfg.names[nearest] +
                ', heading for ' +
                cfg.names[leg] +
                '. Mira is with him.';
        }
        if (fresh) clue += 'Fresh pawprints mark the route; follow their direction. ';
        return (
          clue +
          'Thornfang once served as a Crown wilderness scout. He takes Mira from his temporary den through the Southern crossing, the Forest Crypt perimeter, Skeleton territory, the Mill crossing and Goblin territory. They avoid Millhaven. Mira performs paid but compulsory inspections. When the winter estate is finished and its inhabitants can keep it secure, he intends to return to his distant home.'
        );
      }
      updateThornCaptive(dt) {
        if (this.zoneId !== 'vale') return;
        const z = this.zone(),
          n = this.thornCaptive(z);
        if (!n || !this.thornCaptiveFollowing()) return;
        const e = z.enemies.find((u) => this.thornPatroller(u) && u.hp > 0 && !u.neutral);
        if (e) this.follow(n, e, R.thornPatrol.captiveSpeed, dt, R.thornPatrol.separation);
      }
      updateThornPatrol(e, dt) {
        if (!this.thornPatroller(e) || e.aggro || e.neutral || this.peace || e.hp <= 0)
          return false;
        if (e.thornReturn) {
          this.disengage(e, dt);
          return true;
        }
        const cfg = R.thornPatrol,
          n = this.thornCaptive();
        if (n && this.thornCaptiveFollowing() && dist(n, e) > cfg.waitForCaptive) return true;
        e.thornPause = Math.max(0, (e.thornPause || 0) - dt);
        if (e.thornPause) return true;
        const i =
          Number.isInteger(e.thornLeg) && e.thornLeg >= 0 && e.thornLeg < cfg.route.length
            ? e.thornLeg
            : cfg.startLeg;
        const [x, y] = cfg.route[i];
        const before = { x: e.x, y: e.y };
        this.follow(e, { x, y }, cfg.speed * (e.slow > 0 ? 0.5 : 1), dt, cfg.arrival);
        if (dist(before, e) > 0) this.recordThornTracks(e, before);
        if (dist(e, { x, y }) <= cfg.arrival + 1e-7) {
          e.thornLeg = (i + cfg.direction + cfg.route.length) % cfg.route.length;
          e.thornPause = cfg.pause;
          delete e.path;
        } else e.thornLeg = i;
        return true;
      }
      recordThornTracks(e, before) {
        const z = this.zone(),
          cfg = R.thornPatrol;
        z.npcs = z.npcs.filter((n) => !n.thornFootprint || n.expires > this.s.time);
        const prior = z.npcs.filter((n) => n.thornFootprint).at(-1);
        if (prior && dist(prior, e) < cfg.trackSpacing) return;
        z.npcs.push({
          id: 'thorn-footprint-' + this.s.nextId++,
          kind: 'landmark',
          name: 'Scout footprints',
          icon: '🐾',
          presentation: 'scout-tracks',
          thornFootprint: true,
          x: e.x,
          y: e.y,
          angle: Math.atan2(e.y - before.y, e.x - before.x),
          expires: this.s.time + cfg.trackLife,
        });
        const marks = z.npcs.filter((n) => n.thornFootprint);
        const remove = new Set(
          marks.slice(0, Math.max(0, marks.length - cfg.trackLimit)).map((n) => n.id),
        );
        z.npcs = z.npcs.filter((n) => !remove.has(n.id));
      }
      follow(entity, target, speed, dt, stop = 45) {
        if (this.s.party.includes(entity))
          return this.followCompanion(entity, target, speed, dt, stop);
        if (dist(entity, target) <= stop) return true;
        if (this.clearSegment(entity, target)) {
          entity.path = [];
          return this.move(entity, target, speed, dt, stop);
        }
        entity.routeAge = (entity.routeAge || 0) - dt;
        const trip = terrainTrips.get(entity),
          zone = this.s.zones[this.zoneId];
        if (!trip || trip.zone !== zone || dist(trip.target, target) > 80 || entity.routeAge <= 0) {
          if (!trip || trip.zone !== zone || dist(trip.target, target) > 80) entity.path = [];
          if (this.reserveMovementPlan(entity)) {
            entity.path = this.route(entity, target);
            entity.routeAge = R.actorSpacing.routeRetrySeconds;
            terrainTrips.set(entity, { zone, target: { x: target.x, y: target.y } });
          }
        }
        while (entity.path?.length && dist(entity, entity.path[0]) < 1) entity.path.shift();
        if (!entity.path?.length) return false;
        const moved = this.move(entity, entity.path[0], speed, dt);
        if (dist(entity, entity.path[0]) < 1) entity.path.shift();
        // A body-blocked step cannot be repaired by rebuilding a terrain-only
        // route. Retain the retry clock even for an empty/unreachable route.
        return moved;
      }
    }
    const methods = Object.getOwnPropertyDescriptors(Navigation.prototype);
    delete methods.constructor;
    Object.defineProperties(Campaign.prototype, methods);
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeNavigation = api;
})(typeof window !== 'undefined' ? window : globalThis);
