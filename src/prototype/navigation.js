/* Collision, line-of-sight and pathfinding. Same rules for every platform. */
(function (root) {
  'use strict';
  function install(Campaign, D, R, dungeonIds) {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    class Navigation {
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
            bounds: [a, b, c, e],
            gaps,
          } = R.barriers[i];
          if (
            x > a - radius &&
            x < b + radius &&
            y > c - radius &&
            y < e + radius &&
            !gaps.some(([l, h]) => y > l + radius && y < h - radius)
          )
            return true;
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
      thornReport() {
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
        return 'Thornfang once served as a Crown wilderness scout. He takes Mira from his temporary den through Goblin territory, the Mill crossing, Skeleton territory, the Forest Crypt perimeter and the Southern crossing. They avoid Millhaven. Mira performs paid but compulsory inspections. When the winter estate is finished and its inhabitants can keep it secure, he intends to return to his distant home.';
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
