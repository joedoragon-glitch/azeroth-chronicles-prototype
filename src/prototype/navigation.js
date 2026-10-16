/* Collision, line-of-sight and pathfinding. Same rules for every platform. */
(function (root) {
  'use strict';
  function install(Campaign, D, R, dungeonIds) {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    // Runtime-only broad phase and congestion clocks. Never persist crowd state.
    const crowds = new WeakMap();
    class Navigation {
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
      actorCrowd() {
        const zone = this.s.zones[this.zoneId];
        let frame = crowds.get(this);
        if (frame?.zone === zone && frame.at === this.s.time &&
            frame.enemyList === zone?.enemies && frame.enemyCount === zone?.enemies.length &&
            frame.partyList === this.s.party && frame.partyCount === this.s.party.length &&
            frame.hero === this.hero) return frame;
        const enemies = (zone?.enemies || []).filter((u) => u.hp > 0 && !u.neutral),
          allies = [this.hero, ...this.activeLivingParty()].filter((u) => u.hp > 0),
          bodies = [...allies, ...enemies];
        frame = {
          zone,
          hero: this.hero,
          enemyList: zone?.enemies,
          enemyCount: zone?.enemies.length,
          partyList: this.s.party,
          partyCount: this.s.party.length,
          at: this.s.time,
          bodies,
          hostile: new Set(enemies),
          members: new Set(bodies),
          bins: new Map(),
          cells: new Map(),
          congestion: frame?.zone === zone ? frame.congestion : new WeakMap(),
        };
        crowds.set(this, frame);
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
        const candidates = new Set(), steps = Math.max(1, Math.ceil(dist(unit, point) / R.actorSpacing.cellSize));
        for (let j = 0; j <= steps; j++)
          for (const other of this.nearbyActors({ x: unit.x + (point.x - unit.x) * j / steps,
            y: unit.y + (point.y - unit.y) * j / steps }, frame)) candidates.add(other);
        for (const other of candidates) {
          if (other === unit || other.hp <= 0) continue;
          const friendly = frame.hostile.has(unit) === frame.hostile.has(other);
          if (friendly && relaxFriendly) continue;
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
        const prior = crowds.get(this);
        if (prior) prior.at = -Infinity;
        const frame = this.actorCrowd(),
          cfg = R.actorSpacing;
        for (const unit of frame.bodies) {
          // Fixed warning origins, held victims and scripted motion remain authoritative.
          if (unit === this.hero || unit.hp <= 0 || unit.telegraph || unit.motion ||
              unit.keeperHeld || unit.deathRollHeld || this.partyChargeState(unit)) continue;
          let dx = 0, dy = 0;
          for (const other of this.nearbyActors(unit, frame)) {
            if (other === unit || other.hp <= 0) continue;
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
            point = { x: unit.x + dx / length * amount, y: unit.y + dy / length * amount };
          const angle = Math.atan2(dy, dx);
          for (const p of [point, ...[0.7, -0.7, 1.35, -1.35].map((offset) => ({
            x: unit.x + Math.cos(angle + offset) * amount,
            y: unit.y + Math.sin(angle + offset) * amount,
          }))]) {
            if (!this.clearSegment(unit, p) || !this.actorStepAllowed(unit, p, false, frame)) continue;
            Object.assign(unit, p);
            this.indexActor(unit, frame);
            break;
          }
        }
      }
      blocked(x, y, zone = this.s.zone, radius = 15, terrainOnly = false) {
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
              const hit =
                x > w.x1 - radius && x < w.x2 + radius && y > w.y1 - radius && y < w.y2 + radius;
              if (!hit) continue;
              const v = w.axis === 'x' ? x : y;
              if (!(w.gaps || []).some(([l, h]) => v > l + radius && v < h - radius)) return true;
            }
          } else
            for (const w of R.treasuryWalls?.[zone] || []) {
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
          if (y > c - radius && y < e + radius &&
              !gaps.some(([l, h]) => y > l + radius && y < h - radius)) {
            for (let at = y - radius; at <= y + radius + 0.01; at += Math.max(1, radius / 2)) {
              const [a, b] = R.channelBanks(i, at);
              if (x > a - radius && x < b + radius) return true;
            }
          }
        }
        if (!dungeon && !room && !side)
          for (const p of R.terrain[i])
            if (
              p.r
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
            if (
              !onDock &&
              x > w.x1 - radius &&
              x < w.x2 + radius &&
              y > w.y1 - radius &&
              y < w.y2 + radius
            )
              return true;
          }
        }
        const z = this.s.zones[zone];
        return (
          (!terrainOnly &&
            z?.props.some((p) => !p.decorative && Math.hypot(x - p.x, y - p.y) < p.r + radius)) ||
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
        const start = starts[0],
          end = ends[0],
          queue = [start],
          parents = new Map([[start, null]]),
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
          if (id === end) {
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
      }
      move(entity, target, speed, dt, stop = 0) {
        const d = dist(entity, target);
        if (d <= stop) return true;
        const step = Math.min(d - stop, speed * dt),
          nx = entity.x + ((target.x - entity.x) / d) * step,
          ny = entity.y + ((target.y - entity.y) / d) * step;
        const frame = this.actorCrowd(),
          congestion = frame.congestion.get(entity) || { blocked: 0, until: 0 },
          relaxed = congestion.until > this.s.time,
          legal = (p) => this.clearSegment(entity, p) &&
            this.actorStepAllowed(entity, p, relaxed, frame);
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
            const p = { x: entity.x + Math.cos(angle + offset) * step,
              y: entity.y + Math.sin(angle + offset) * step };
            if (!legal(p)) continue;
            Object.assign(entity, p);
            moved = true;
            break;
          }
        }
        const advanced = d - dist(entity, target) > Math.min(0.5, step * 0.2);
        congestion.blocked = advanced ? 0 : congestion.blocked + dt;
        if (congestion.blocked >= R.actorSpacing.congestionSeconds) {
          // Only same-side bodies relax, and only for this bounded interval.
          congestion.until = this.s.time + R.actorSpacing.relaxSeconds;
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
        if (!z.npcs.some((n) => n.id === 'thorn-local-report')) {
          const p = this.safe(900, 850, 'vale');
          z.npcs.push({
            id: 'thorn-local-report',
            kind: 'patrol-report',
            name: 'Orchard trail witness',
            ...p,
            icon: '🧑',
            thornReport: true,
          });
        }
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
              : 1;
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
              : 1;
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
          'Thornfang once served as a Crown wilderness scout. He takes Mira from his temporary den through Goblin territory, the Mill crossing, Skeleton territory, the Forest Crypt perimeter and the Southern crossing. They avoid Millhaven. Mira performs paid but compulsory inspections. When the winter estate is finished and its inhabitants can keep it secure, he intends to return to his distant home.'
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
            : 1;
        const [x, y] = cfg.route[i];
        const before = { x: e.x, y: e.y };
        this.follow(e, { x, y }, cfg.speed * (e.slow > 0 ? 0.5 : 1), dt, cfg.arrival);
        if (dist(before, e) > 0) this.recordThornTracks(e, before);
        if (dist(e, { x, y }) <= cfg.arrival + 1e-7) {
          e.thornLeg = (i + 1) % cfg.route.length;
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
        if (dist(entity, target) <= stop) return true;
        if (this.clearSegment(entity, target)) {
          entity.path = [];
          return this.move(entity, target, speed, dt, stop);
        }
        entity.routeAge = (entity.routeAge || 0) - dt;
        if (!entity.path?.length || entity.routeAge <= 0) {
          entity.path = this.route(entity, target);
          entity.routeAge = 1.3;
        }
        while (entity.path?.length && dist(entity, entity.path[0]) < 1) entity.path.shift();
        if (!entity.path?.length) return false;
        const moved = this.move(entity, entity.path[0], speed, dt);
        if (dist(entity, entity.path[0]) < 1) entity.path.shift();
        if (!moved) entity.routeAge = 0;
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
