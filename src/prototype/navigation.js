/* Collision, line-of-sight and pathfinding. Same rules for every platform. */
(function (root) {
  'use strict';
  function install(Campaign, D, R, dungeonIds) {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    // Runtime collision applies to terrain and scenery only, not other actors.
    // Opt-in and unsaved. Navigation/terrain diagnostics no longer inspect actors.
    // Disabled diagnostics add zero runtime instrumentation overhead.
    const diagnosticSessions = new WeakMap();
    const diagnosticMetrics = [
      'moveCalls',
      'moveMs',
      'moveSegmentCalls',
      'segmentCalls',
      'segmentMs',
      'segmentPoints',
      'blockedCalls',
      'blockedMs',
      'routeCalls',
      'routeMs',
      'companionRouteCalls',
      'companionRouteMs',
      'companionFollowCalls',
      'companionFollowMs',
      'companionTravelClearCalls',
      'companionTravelClearMs',
    ];
    const diagnosticNow = () => performance.now();
    function diagnosticSummary(values) {
      if (!values.length) return { samples: 0, mean: 0, p95: 0, max: 0 };
      const sorted = values.slice().sort((a, b) => a - b);
      const round = (x) => Math.round(x * 100) / 100;
      return {
        samples: values.length,
        mean: round(values.reduce((a, b) => a + b, 0) / values.length),
        p95: round(sorted[Math.floor((values.length - 1) * 0.95)]),
        max: round(sorted.at(-1)),
      };
    }
    const watchedMethods = [
      ['move', 'moveCalls', 'moveMs'],
      ['clearSegment', 'segmentCalls', 'segmentMs'],
      ['blocked', 'blockedCalls', 'blockedMs'],
      ['route', 'routeCalls', 'routeMs'],
      // Follow includes path planning and segment checks; these are nested
      // timings, never additive. In particular, the companion A* search does
      // not use the normal route() method.
      ['companionRoute', 'companionRouteCalls', 'companionRouteMs'],
      ['followCompanion', 'companionFollowCalls', 'companionFollowMs'],
      ['companionTravelClear', 'companionTravelClearCalls', 'companionTravelClearMs'],
    ];
    // Non-critical route planning shares one finite budget across live
    // companion, delivery and tactical consumers. Keep unrelated gameplay
    // balance and sprite-scope fingerprints untouched.
    const routePlanningLimits = Object.freeze({
      terrainProbesPerTick: 768,
      terrainProbesPerSearch: 512,
      routeNodesPerTick: 240,
      routeNodesPerSearch: 120,
    });
    const terrainTrips = new WeakMap(),
      movementPlanFrames = new WeakMap(),
      routePlanningFrames = new WeakMap();
    const patrolResumes = new WeakMap();
    const sceneryReady = new WeakSet();
    // This shortlist exists only during one synchronous line/segment query.
    // No cache survives the return, so subsequent in-place geometry edits are fresh.
    const propQueries = new WeakMap();
    function collisionProps(game, z, x, y, radius) {
      const query = propQueries.get(game),
        props = z?.props;
      if (
        !query ||
        !props ||
        props.length < 80 ||
        !Number.isFinite(radius) ||
        radius < 0 ||
        !Number.isFinite(x) ||
        !Number.isFinite(y)
      )
        return props;
      if (query.props !== props || query.length !== props.length) {
        query.props = props;
        query.length = props.length;
        query.reads = 0;
        query.candidates = null;
      }
      // Early obstructions and short moves don't pay for a shortlist.
      if (++query.reads <= 8) return props;
      if (!query.candidates)
        query.candidates = props.filter((p) => {
          const r =
            Math.max(0, p.r || 0, R.sceneryTraversal.radii[p.structure] || 0) + query.padding;
          return (
            ![r, p.x, p.y, p.r].every(Number.isFinite) ||
            (p.x + r >= query.left &&
              p.x - r <= query.right &&
              p.y + r >= query.top &&
              p.y - r <= query.bottom)
          );
        });
      return query.candidates;
    }
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
            try {
              result = original.apply(this, args);
            } finally {
              if (elapsed) row[elapsed] += diagnosticNow() - started;
              if (name === 'move') row.moveSegmentCalls += row.segmentCalls - beforeSegments;
              if (name === 'clearSegment') row.segmentPoints += row.blockedCalls - beforeBlocked;
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
        session.current = Object.fromEntries(diagnosticMetrics.map((key) => [key, 0]));
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
        const rows = session?.rows || [],
          metrics = {};
        for (const key of diagnosticMetrics)
          metrics[key] = diagnosticSummary(rows.map((row) => row[key]));
        return {
          recording: !!session?.recording,
          sampledSimulationTicks: rows.length,
          sampleLimit: 120,
          metrics,
          note: 'Opt-in, device-local only. Terrain and route timings are nested and include observation overhead; do not add timings or treat them as FPS. No actor-to-actor collision instrumentation remains.',
        };
      }
      crowdDiagnosticsDescribe() {
        const r = this.crowdDiagnosticsReport(), m = r.metrics;
        if (!r.sampledSimulationTicks)
          return 'Navigation diagnostics: no active gameplay ticks recorded. Start sampling, return to the game, and test movement or combat.';
        return (
          'Navigation diagnostics · ' + r.sampledSimulationTicks + ' ticks' +
          (r.recording ? ' (recording)' : '') +
          '\nMove ms mean/p95 ' + m.moveMs.mean + '/' + m.moveMs.p95 +
          ' · terrain segment ' + m.segmentMs.mean + '/' + m.segmentMs.p95 +
          ' · route ' + m.routeMs.mean + '/' + m.routeMs.p95 +
          '\nCompanion follow ms mean/p95 ' + m.companionFollowMs.mean + '/' +
          m.companionFollowMs.p95 + ' · companion A* ' +
          m.companionRouteMs.mean + '/' + m.companionRouteMs.p95 +
          '\nCalls/tick mean: move ' + m.moveCalls.mean +
          ', blocked terrain checks ' + m.blockedCalls.mean +
          ', segment points ' + m.segmentPoints.mean +
          '. Timings overlap; opt-in sampling has overhead.'
        );
      }
      reserveMovementPlan(unit) {
        // Keep general route-search limits without retaining actor grid state.
        const zone = this.s.zones[this.zoneId], at = this.s.time,
          limit = R.navigationPlanning.movementPlansPerTick;
        let frame = movementPlanFrames.get(this);
        if (!frame || frame.zone !== zone || frame.at !== at) {
          frame = { zone, at, plans: 0, otherPlans: 0 };
          movementPlanFrames.set(this, frame);
        }
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
      // Incremental searches use the same collision geometry as the native
      // solvers. The caller controls how many authoritative blocked() probes
      // and node expansions may run in one simulation update.
      *budgetedRouteSafe(x, y) {
        if (!(yield { kind: 'blocked', args: [x, y, this.zoneId, 15] })) return { x, y };
        for (let r = 30; r < 450; r += 30)
          for (let i = 0; i < 24; i++) {
            const angle = (i * Math.PI) / 12,
              p = { x: x + Math.cos(angle) * r, y: y + Math.sin(angle) * r };
            if (!(yield { kind: 'blocked', args: [p.x, p.y, this.zoneId, 15] })) return p;
          }
        throw Error('No safe arrival');
      }
      *budgetedRouteSegment(a, b, radius = 15) {
        const n = Math.max(1, Math.ceil(dist(a, b) / 8));
        for (let j = 0; j <= n; j++) {
          const x = a.x + ((b.x - a.x) * j) / n,
            y = a.y + ((b.y - a.y) * j) / n;
          if (yield { kind: 'blocked', args: [x, y, this.zoneId, radius] }) return false;
        }
        return true;
      }
      *budgetedCompanionRoute(a, b, gathering = false) {
        const target = yield* this.budgetedRouteSafe(b.x, b.y),
          threats = gathering ? this.gatheringThreats() : [],
          step = R.gatheringTravel.gridStep,
          n = Math.ceil(this.zoneSize() / step),
          point = (id) => ({
            x: (id % n) * step + step / 2,
            y: Math.floor(id / n) * step + step / 2,
          }),
          game = this,
          clear = function* (p, q) {
            if (!(yield* game.budgetedRouteSegment(p, q))) return false;
            return threats.every((e) =>
              game.distanceToSegment(e, p, q) >= Math.min(e.r, dist(e, a)) - 0.001);
          },
          valid = new Map(),
          free = function* (id) {
            if (!valid.has(id)) {
              const p = point(id);
              valid.set(id, !(yield { kind: 'blocked', args: [p.x, p.y, game.zoneId, 15] }));
            }
            return valid.get(id);
          };
        if (yield* clear(a, target)) return [target];
        const near = function* (p) {
          const out = [],
            cx = Math.floor(p.x / step), cy = Math.floor(p.y / step);
          for (let dx = -2; dx <= 2; dx++)
            for (let dy = -2; dy <= 2; dy++) {
              const x = cx + dx, y = cy + dy, id = y * n + x;
              if (x >= 0 && y >= 0 && x < n && y < n &&
                  (yield* free(id)) && (yield* clear(p, point(id)))) out.push(id);
            }
          return out.sort((i, j) => dist(point(i), p) - dist(point(j), p)).slice(0, 8);
        };
        const starts = yield* near(a), ends = new Set(yield* near(target));
        if (!starts.length || !ends.size) return [];
        const heap = [], cost = new Map(), parents = new Map(),
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
            const first = heap[0], last = heap.pop();
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
          yield { kind: 'node' };
          const current = pop(), id = current.id;
          if (current.g !== cost.get(id)) continue;
          if (ends.has(id)) {
            const path = [target];
            for (let at = id; at !== null; at = parents.get(at)) path.push(point(at));
            path.reverse();
            const smooth = [];
            let from = a, j = 0;
            while (j < path.length) {
              let far = j;
              for (let k = path.length - 1; k > j; k--)
                if (yield* clear(from, path[k])) { far = k; break; }
              smooth.push(path[far]);
              from = path[far];
              j = far + 1;
            }
            return smooth;
          }
          const x = id % n, y = Math.floor(id / n), from = point(id);
          for (const [dx, dy] of [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1],
          ]) {
            const xx = x + dx, yy = y + dy, next = yy * n + xx;
            if (xx < 0 || yy < 0 || xx >= n || yy >= n || !(yield* free(next))) continue;
            const g = current.g + step * (dx && dy ? Math.SQRT2 : 1);
            if (g >= (cost.get(next) ?? Infinity) || !(yield* clear(from, point(next))))
              continue;
            cost.set(next, g);
            parents.set(next, id);
            push(next, g);
          }
        }
        return [];
      }
      *budgetedTacticalRoute(a, b) {
        const target = yield* this.budgetedRouteSafe(b.x, b.y),
          step = 50, n = Math.ceil(this.zoneSize() / step),
          point = (id) => ({ x: (id % n) * step + 25, y: Math.floor(id / n) * step + 25 }),
          game = this;
        if (yield* this.budgetedRouteSegment(a, target)) return [target];
        const nearby = function* (p) {
          const out = [], cx = Math.floor(p.x / step), cy = Math.floor(p.y / step);
          for (let dx = -2; dx <= 2; dx++)
            for (let dy = -2; dy <= 2; dy++) {
              const x = cx + dx, y = cy + dy;
              if (x < 0 || y < 0 || x >= n || y >= n) continue;
              const id = y * n + x, q = point(id);
              if (!(yield { kind: 'blocked', args: [q.x, q.y, game.zoneId, 15] }) &&
                  (yield* game.budgetedRouteSegment(p, q))) out.push(id);
            }
          return out.sort((x, y) => dist(point(x), p) - dist(point(y), p));
        };
        const starts = yield* nearby(a), ends = yield* nearby(target);
        if (!starts.length || !ends.length) return [];
        const search = function* (sources, goals) {
          const queue = [...sources],
            parents = new Map(sources.map((id) => [id, null])),
            destinations = new Set(goals), valid = new Map(),
            free = function* (id) {
              if (!valid.has(id)) {
                const p = point(id);
                valid.set(id, !(yield { kind: 'blocked', args: [p.x, p.y, game.zoneId, 15] }));
              }
              return valid.get(id);
            };
          for (let at = 0; at < queue.length; at++) {
            yield { kind: 'node' };
            const id = queue[at];
            if (destinations.has(id)) {
              const path = [target];
              for (let j = id; j !== null; j = parents.get(j)) path.push(point(j));
              path.reverse();
              const smooth = [];
              let current = a, j = 0;
              while (j < path.length) {
                let far = j;
                for (let k = j + 1; k < path.length; k++) {
                  if (!(yield* game.budgetedRouteSegment(current, path[k]))) break;
                  far = k;
                }
                smooth.push(path[far]);
                current = path[far];
                j = far + 1;
              }
              return smooth;
            }
            const x = id % n, y = Math.floor(id / n), from = point(id);
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const xx = x + dx, yy = y + dy, next = yy * n + xx;
              if (xx < 0 || yy < 0 || xx >= n || yy >= n || parents.has(next) ||
                  !(yield* free(next)) ||
                  !(yield* game.budgetedRouteSegment(from, point(next)))) continue;
              parents.set(next, id);
              queue.push(next);
            }
          }
          return [];
        };
        const primary = yield* search([starts[0]], [ends[0]]);
        return primary.length ? primary : yield* search(starts, ends);
      }
      routePlanningLimits() {
        return routePlanningLimits;
      }
      advanceBudgetedRoute(a, b, mode, pending = null, gathering = false) {
        const cfg = routePlanningLimits, now = this.s.time,
          zone = this.zoneId, origin = { x: a.x, y: a.y },
          target = { x: b.x, y: b.y };
        let frame = routePlanningFrames.get(this);
        if (!frame || frame.zone !== zone || frame.time !== now) {
          frame = {
            zone, time: now,
            probes: cfg.terrainProbesPerTick,
            nodes: cfg.routeNodesPerTick,
          };
          routePlanningFrames.set(this, frame);
        }
        let plan = pending;
        if (!plan || plan.zone !== zone || plan.mode !== mode ||
            plan.gathering !== gathering ||
            dist(plan.origin, origin) > 20 || dist(plan.target, target) > 20) {
          const generator = mode === 'tactical' || mode === 'pursuit'
            ? this.budgetedTacticalRoute(origin, target)
            : this.budgetedCompanionRoute(origin, target, gathering);
          plan = { zone, mode, gathering, origin, target, generator, request: null, reply: undefined };
        }
        let probes = Math.min(frame.probes, cfg.terrainProbesPerSearch),
          nodes = Math.min(frame.nodes, cfg.routeNodesPerSearch);
        while (true) {
          if (!plan.request) {
            const next = plan.generator.next(plan.reply);
            plan.reply = undefined;
            if (next.done) return { pending: false, path: next.value, state: null };
            plan.request = next.value;
          }
          if (plan.request.kind === 'node') {
            if (!nodes) break;
            nodes--;
            frame.nodes--;
            plan.reply = undefined;
          } else if (plan.request.kind === 'blocked') {
            if (!probes) break;
            probes--;
            frame.probes--;
            plan.reply = this.blocked(...plan.request.args);
          } else throw Error('Unknown route planning step');
          plan.request = null;
        }
        return { pending: true, path: null, state: plan };
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
            // Unit cardinal/diagonal edge lengths are fixed; avoid repeated hypot in A*'s hot loop.
            const g = current.g + step * (dx && dy ? Math.SQRT2 : 1);
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
          trip.cautious !== cautious
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
        // Moving heroes and workers cannot invalidate a search every few
        // ticks. Keep walking a previously validated path while refreshing
        // the destination, and finish any in-progress search against its
        // frozen origin/target before considering another update.
        if (!trip.search && dist(trip.target, target) > 30) {
          trip.target = { x: target.x, y: target.y };
          trip.age = 0;
        }
        trip.age -= dt;
        if (trip.path.length && !this.companionTravelClear(u, trip.path[0], threats)) {
          trip.path = [];
          trip.age = 0;
        }
        if (trip.age <= 0 || trip.search) {
          if (trip.search || this.reserveMovementPlan(u)) {
            // Incomplete searches retain their frontier and are not mistaken
            // for an unreachable destination. Actual movement remains native.
            const origin = trip.search?.origin || u,
              destination = trip.search?.target || target,
              result = this.advanceBudgetedRoute(origin, destination, 'companion', trip.search, cautious);
            if (result.pending) {
              trip.search = result.state;
              trip.age = 0;
              if (!trip.path.length) return false;
            } else {
              trip.search = null;
              trip.path = result.path;
              // The route may have been computed while the actor/hero moved.
              // A stale first leg is not permission to bypass collision.
              if (trip.path.length && !this.companionTravelClear(u, trip.path[0], threats))
                trip.path = [];
              trip.age = trip.path.length ? R.gatheringTravel.replanSeconds : 0;
              trip.target = { x: target.x, y: target.y };
              u.path = trip.path;
            }
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
      // Attack contact and terrain clearance still need actor dimensions.
      // This helper no longer participates in actor-to-actor movement blocking.
      actorRadius(unit) {
        const cfg = R.actorContactRadii;
        return unit === this.hero
          ? cfg.hero
          : unit.type === 'boss'
            ? cfg.boss
            : unit.mountedCrownRider
              ? cfg.mounted
              : unit.captain || unit.roomCaptain || unit.species === 'ogre'
                ? cfg.large
                : cfg.normal;
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
        if (this.s.mode === 'arena' && zone === 'arena') {
          const size = this.zoneSize(zone);
          return !Number.isFinite(x) || !Number.isFinite(y) ||
            x < 40 + radius || y < 40 + radius ||
            x > size - 40 - radius || y > size - 40 - radius;
        }
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
                  ? // Reject obstacles far outside the circle's bounding box
                    // without invoking a square root.
                    Math.abs(x - p.x) < p.r + radius &&
                    Math.abs(y - p.y) < p.r + radius &&
                    Math.hypot(x - p.x, y - p.y) < p.r + radius
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
            collisionProps(this, z, x, y, radius)?.some((p) => {
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
              if (r === null || (candidate && R.sceneryTraversal.radii[p.structure] === 0))
                return false;
              const reach = r + radius,
                dx = x - p.x,
                dy = y - p.y;
              // A circle never overlaps a point outside its enclosing square.
              // Query current prop coordinates/radii every time: no stale cache.
              if (Number.isFinite(reach) && (Math.abs(dx) >= reach || Math.abs(dy) >= reach))
                return false;
              const distance = Math.hypot(dx, dy);
              if (distance >= reach) return false;
              const body = candidate ? this.sceneryMovementRadius(p, z) : r;
              // Reuse the precise distance. Authored collision rules and
              // boundary handling remain unchanged.
              return body !== null && distance < body + radius;
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
      move(entity, target, speed, dt, stop = 0) {
        const d = dist(entity, target);
        if (d <= stop) return true;
        const step = Math.min(d - stop, speed * dt),
          nx = entity.x + ((target.x - entity.x) / d) * step,
          ny = entity.y + ((target.y - entity.y) / d) * step;
        if (this.clearSegment(entity, { x: nx, y: ny })) {
          entity.x = nx;
          entity.y = ny;
          return true;
        }
        let moved = false;
        if (this.clearSegment(entity, { x: nx, y: entity.y })) {
          entity.x = nx;
          moved = true;
        }
        if (this.clearSegment(entity, { x: entity.x, y: ny })) {
          entity.y = ny;
          moved = true;
        }
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
        const zone = this.s.zones[this.zoneId],
          // Only real enemy actors use this bounded combat planner. Hero
          // orders, authored roads and non-enemy scripted routes retain the
          // original synchronous route API and movement behavior.
          enemyPursuit = entity.aggro && !entity.returning &&
            entity.type !== 'boss' && !entity.captain && !entity.roomCaptain &&
            zone.enemies.includes(entity);
        if (this.clearSegment(entity, target)) {
          entity.path = [];
          if (enemyPursuit) terrainTrips.delete(entity);
          return this.move(entity, target, speed, dt, stop);
        }
        entity.routeAge = (entity.routeAge || 0) - dt;
        let trip = terrainTrips.get(entity);
        if (enemyPursuit) {
          // A moving hero must not reset the entire search frontier every
          // update. A pending search uses its frozen origin and destination;
          // its result is validated against the actor's actual position.
          const invalid = !trip || trip.zone !== zone;
          const changed = !invalid && dist(trip.target, target) > 80;
          if (invalid || (changed && !trip.pending)) {
            entity.path = [];
            trip = { zone, target: { x: target.x, y: target.y }, pending: null };
            terrainTrips.set(entity, trip);
            entity.routeAge = 0;
          }
          if (trip.pending || entity.routeAge <= 0) {
            if (trip.pending || this.reserveMovementPlan(entity)) {
              const origin = trip.pending?.origin || entity,
                destination = trip.pending?.target || target,
                result = this.advanceBudgetedRoute(origin, destination, 'pursuit', trip.pending);
              if (result.pending) {
                trip.pending = result.state;
              } else {
                trip.pending = null;
                trip.target = { x: target.x, y: target.y };
                entity.path = result.path;
                // The actor might have escaped or been displaced while the
                // frontier was suspended. Never accept a stale obstructed leg.
                const staleFirstLeg =
                  entity.path.length && !this.clearSegment(entity, entity.path[0]);
                if (staleFirstLeg) entity.path = [];
                // Preserve the original no-route cooldown: a closed or
                // unreachable arena must not be searched four times as often.
                // Only a search invalidated by the actor's own movement may
                // retry sooner, after fresh native collision validation.
                entity.routeAge = staleFirstLeg
                  ? Math.min(0.25, R.navigationPlanning.routeRetrySeconds)
                  : R.navigationPlanning.routeRetrySeconds;
              }
            }
          }
        } else if (!trip || trip.zone !== zone || dist(trip.target, target) > 80 || entity.routeAge <= 0) {
          if (!trip || trip.zone !== zone || dist(trip.target, target) > 80) entity.path = [];
          if (this.reserveMovementPlan(entity)) {
            entity.path = this.route(entity, target);
            entity.routeAge = R.navigationPlanning.routeRetrySeconds;
            terrainTrips.set(entity, { zone, target: { x: target.x, y: target.y } });
          }
        }
        while (entity.path?.length && dist(entity, entity.path[0]) < 1) entity.path.shift();
        if (!entity.path?.length) return false;
        const moved = this.move(entity, entity.path[0], speed, dt);
        if (dist(entity, entity.path[0]) < 1) entity.path.shift();
        return moved;
      }
    }
    const methods = Object.getOwnPropertyDescriptors(Navigation.prototype);
    for (const name of ['line', 'clearSegment']) {
      const original = methods[name].value;
      methods[name].value = function (...args) {
        if (propQueries.has(this)) return original.apply(this, args);
        const [a, b] = args;
        // Sparse interiors, tiny moves and terrain-only sweeps cannot benefit
        // from this shortlist. Leave their original cheap path allocation-free.
        if (
          (this.s.zones?.[this.s.zone]?.props.length || 0) < 80 ||
          (name === 'clearSegment' && args[3]) ||
          Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 48
        )
          return original.apply(this, args);
        propQueries.set(this, {
          left: Math.min(a.x, b.x),
          right: Math.max(a.x, b.x),
          top: Math.min(a.y, b.y),
          bottom: Math.max(a.y, b.y),
          padding: name === 'line' ? 0 : (args[2] ?? 15),
          reads: 0,
        });
        try {
          return original.apply(this, args);
        } finally {
          propQueries.delete(this);
        }
      };
    }
    delete methods.constructor;
    Object.defineProperties(Campaign.prototype, methods);
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeNavigation = api;
})(typeof window !== 'undefined' ? window : globalThis);
