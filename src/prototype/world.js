/* Authored regions, settlements and interiors. Content work belongs here. */
(function (root) {
  'use strict';
  const roadPlans = new Map();
  function install(Campaign, { D, R, dungeonIds, classes }) {
    // Roster lookups are frequent during AI/render observation. Homes are
    // normally fixed; reuse their geometric distance, never the mutable roster
    // eligibility/order/roles. Reassignment of a home invalidates immediately.
    const crownPostDistances = new WeakMap();
    const crownLineages = ['crownguard', 'goblin', 'orc', 'archer', 'ogre'];
    const crownAnchors = {
      highlands: [
        [1050, 1360],
        [1850, 1160],
        [2950, 720],
      ],
      frontier: [
        [155, 615],
        [2600, 1650],
        [3000, 2700],
        [1700, 1250],
      ],
      crown: [
        [720, 900],
        [2580, 900],
        [3050, 2320],
        [3200, 2860],
      ],
    };
    function reconcileMilitaryRole(game, e, index) {
      // Reapply only when configureEnemy's exact forced-role outputs differ.
      if (e.type !== 'mob' || e.summon || e.neutral) return;
      if (
        e.forcedRole === 'ranged' &&
        e.ranged === true &&
        e.shotRange === 280 &&
        e.shotSpeed === 260 &&
        e.projectileStyle === (e.species === 'wraith' ? 'spectral' : 'arrow')
      )
        return;
      if (
        e.forcedRole === 'melee' &&
        e.ranged === false &&
        !Object.hasOwn(e, 'hybrid') &&
        !Object.hasOwn(e, 'shotRange') &&
        !Object.hasOwn(e, 'shotSpeed') &&
        !Object.hasOwn(e, 'projectileStyle')
      )
        return;
      game.configureEnemy(e, index);
    }
    const clone = (x) => JSON.parse(JSON.stringify(x)),
      clamp = (n, a, b) => Math.max(a, Math.min(b, n)),
      dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
      originalDepartureRegion = (id) => ['vale', 'highlands', 'frontier'].includes(id);
    class World {
      ensureCriticalCodex(z) {
        // Historical v4 rooms may already exist before this mechanic.
        // Reconcile only the missing authored book; never rebuild the room.
        const def = R.criticalCodices?.[z?.id],
          id = 'critical-codex-' + z?.id;
        if (!def || z.npcs.some((n) => n.id === id)) return false;
        const point = this.safe(def.x, def.y, z.id);
        z.npcs.push({
          id, kind: 'critical-codex', sideCodex: z.id,
          name: def.name, nameEs: def.nameEs,
          x: point.x, y: point.y, icon: '📖', presentation: 'critical-codex',
        });
        return true;
      }
      dungeonSpaceLayout(z) {
        const space = R.dungeonSpace?.[z.id];
        if (!space || z.dungeonSpaceVersion === space.version) return;
        // Existing objects keep their IDs, wounds, deaths and progression. Only
        // spatial coordinates change; attack radii and encounter tuning do not.
        const moved = new Set(),
          move = (p) => {
            if (!p || moved.has(p)) return;
            moved.add(p);
            p.x *= space.scale;
            p.y *= space.scale;
            if (p.home) move(p.home);
            delete p.path;
            delete p.pathTarget;
          };
        for (const p of [...z.enemies, ...z.npcs, ...z.props, ...z.nodes, ...z.buildings]) move(p);
        for (const p of z.props) {
          const index = /^decor-(\d+)$/.exec(p.id || '')?.[1],
            row = index === undefined ? null : R.dungeonDecor[z.id]?.[Number(index)];
          if (row) [p.x, p.y] = row;
        }
        for (const p of this.s.loot || []) if (p.zone === z.id) move(p);
        for (const [id, pending] of Object.entries(this.s.pending || {}))
          if (id === z.id && pending.base) move(pending.base);
        if (this.s.zone === z.id) for (const p of [this.hero, ...this.activeParty()]) move(p);
        z.dungeonSpaceVersion = space.version;
      }
      dungeonBossHome(id = this.s.zone) {
        return (
          R.interiorEncounterLayout?.[id]?.boss ||
          R.dungeonSpace?.[id]?.boss || { x: 1160, y: 1110 }
        );
      }
      defenderEncounterLayout(z) {
        const cfg = R.interiorEncounterLayout?.[z.id];
        if (!cfg || z.defenderLayoutVersion === cfg.version) return;
        const exit = z.npcs.find((n) => n.kind === 'exit');
        if (exit && cfg.entry) Object.assign(exit, cfg.entry);
        let deferred = false;
        const place = (e, point) => {
          if (!e || e.defenderHomeVersion === cfg.version) return;
          // Let an ongoing cast, movement or return finish at its current anchor.
          // Dead records keep their state; the new home is used by later returns.
          if (
            e.hp > 0 &&
            (e.aggro || e.returning || e.telegraph || e.motion || e.sequence?.length)
          ) {
            deferred = true;
            return;
          }
          if (this.blocked(point.x, point.y, z.id, this.actorRadius(e))) {
            deferred = true;
            return;
          }
          if (
            e.hp > 0 &&
            this.s.zone === z.id &&
            [this.hero, ...this.activeLivingParty()].some(
              (u) => dist(u, point) < this.actorRadius(e) + this.actorRadius(u) + 8,
            )
          ) {
            deferred = true;
            return;
          }
          e.home = { ...point };
          if (e.hp > 0) Object.assign(e, point);
          delete e.path;
          delete e.pathTarget;
          delete e.idleWanderTarget;
          e.defenderHomeVersion = cfg.version;
        };
        if (cfg.boss)
          for (const e of z.enemies.filter((e) => e.type === 'boss' && e.family === z.id))
            place(e, cfg.boss);
        if (cfg.captain)
          for (const e of z.enemies.filter((e) => e.roomCaptain && !e.summon && !e.reinforcement))
            place(e, cfg.captain);
        if (cfg.guards) {
          const guards = z.enemies
            .filter(
              (e) =>
                e.guard &&
                e.form === 'normal' &&
                e.type !== 'boss' &&
                !e.summon &&
                !e.reinforcement &&
                !e.awakenedGuard,
            )
            .sort((a, b) => this.idOrder(a, b));
          for (const index of cfg.guards) {
            const post = (R.dungeonGuardFormations[z.id] || R.treasuryGuardFormations[z.id])[index];
            place(guards[index], { x: post.x, y: post.y });
          }
        }
        if (!deferred) z.defenderLayoutVersion = cfg.version;
      }
      frontierEdgeRedistribution(z) {
        const cfg = R.frontierEdgeLayout;
        if (z.id !== 'frontier') return;
        if (z.frontierEdgeVersion === cfg.version) {
          this.frontierEdgeFinish(z);
          return;
        }
        const oldZone = this.s.zone,
          originalProps = z.props,
          nature = new Set(cfg.nature),
          isNature = (p) =>
            nature.has(p.structure) || (!p.structure && ['🌲', '🌳', '🪨'].includes(p.icon)),
          group = (p) =>
            p.frontierDistrict ||
            p.stronghold ||
            p.regionalDistrict ||
            String(p.id || '').replace(/-\d+$/, ''),
          groups = new Map(cfg.groups.map((g) => [g.id, g])),
          moving = originalProps.filter(
            (p) =>
              !isNature(p) &&
              (groups.has(group(p)) ||
                cfg.moves.some((m) => m.id === p.id && m.structure === p.structure)),
          ),
          blocked = this.blocked;
        this.s.zone = z.id;
        try {
          // Work on the same records; never regenerate forests, quest sites or
          // player constructions. Occupied plots in older saves get local alternatives.
          z.props = originalProps.filter((p) => !moving.includes(p));
          const roadDistance = (p) =>
            Math.min(
              Infinity,
              ...z.roads.flatMap((road) =>
                road.slice(1).map((q, i) => this.distanceToSegment(p, road[i], q)),
              ),
            );
          for (const p of moving) {
            const exact = cfg.moves.find((m) => m.id === p.id && m.structure === p.structure),
              g = groups.get(group(p)),
              raw = exact
                ? { x: exact.after[0], y: exact.after[1] }
                : { x: p.x + g.to[0] - g.from[0], y: p.y + g.to[1] - g.from[1] },
              margin = p.r ? p.r + 34 : 45,
              clear = (q) =>
                q.x > 100 + margin &&
                q.y > 100 + margin &&
                q.x < 3300 - margin &&
                q.y < 3300 - margin &&
                !blocked.call(this, q.x, q.y, z.id, Math.max(18, p.r || 0)) &&
                roadDistance(q) > margin + 12 &&
                !z.npcs.some((n) => dist(n, q) < 85 + margin * 0.3) &&
                !z.nodes.some((n) => dist(n, q) < 65 + margin * 0.3) &&
                !z.buildings.some((n) => dist(n, q) < 85 + margin * 0.3) &&
                !z.enemies.some((e) => e.hp > 0 && dist(e, q) < (p.r || 0) + 40) &&
                !z.props.some(
                  (n) => dist(n, q) < (isNature(n) ? 44 : 42) + (p.r || 0) + (n.r || 0),
                );
            let chosen;
            for (const radius of [0, 35, 70, 105, 140, 180, 225, 270]) {
              for (let j = 0; j < (radius ? 24 : 1); j++) {
                const q = {
                  x: raw.x + Math.cos((j * Math.PI) / 12) * radius,
                  y: raw.y + Math.sin((j * Math.PI) / 12) * radius,
                };
                if (clear(q)) {
                  chosen = q;
                  break;
                }
              }
              if (chosen) break;
            }
            if (chosen) Object.assign(p, chosen);
            z.props.push(p);
          }
          z.props = originalProps;
          // Route through the final structures, with shoulders wide enough for
          // normal traffic. Existing road and scenery versions remain untouched.
          const goals = [
            ...cfg.groups.map((g) => ({ x: g.to[0], y: Math.min(3220, g.to[1] + 175) })),
            ...cfg.homes.map(([x, y]) => ({ x, y })),
          ];
          this.blocked = function (x, y, zone, radius = 15, terrainOnly = false) {
            return blocked.call(this, x, y, zone, Math.max(radius, 30), terrainOnly);
          };
          for (const goal of goals) {
            const starts = z.roads
                .flat()
                .filter((p) => !this.blocked(p.x, p.y, z.id, 30))
                .sort((p, q) => dist(p, goal) - dist(q, goal))
                .slice(0, 8),
              candidates = [goal];
            for (const radius of [60, 120])
              for (let j = 0; j < 12; j++)
                candidates.push({
                  x: goal.x + Math.cos((j * Math.PI) / 6) * radius,
                  y: goal.y + Math.sin((j * Math.PI) / 6) * radius,
                });
            let road = [];
            for (const target of candidates) {
              if (this.blocked(target.x, target.y, z.id, 30)) continue;
              for (const start of starts) {
                road = this.route(start, target, { road: true });
                if (road.length) break;
              }
              if (road.length) break;
            }
            if (road.length) z.roads.push(road);
          }
          z.frontierEdgeVersion = cfg.version;
        } finally {
          z.props = originalProps;
          this.blocked = blocked;
          this.s.zone = oldZone;
        }
        this.frontierEdgeFinish(z);
      }
      frontierEdgeFinish(z) {
        const cfg = R.frontierEdgeLayout.finish;
        if (z.frontierVisualVersion === cfg.version) return;
        const oldZone = this.s.zone,
          blocked = this.blocked;
        this.s.zone = z.id;
        try {
          for (const row of cfg.moves) {
            const p = z.props.find((p) => p.id === row.id && p.structure === row.structure);
            if (!p) continue;
            let chosen;
            for (const radius of [0, 35, 70, 105, 140, 180]) {
              for (let j = 0; j < (radius ? 24 : 1); j++) {
                const q = {
                  x: row.to[0] + Math.cos((j * Math.PI) / 12) * radius,
                  y: row.to[1] + Math.sin((j * Math.PI) / 12) * radius,
                };
                if (
                  this.blocked(q.x, q.y, z.id, 26) ||
                  z.props.some((n) => n !== p && dist(n, q) < 65 + (n.r || 0)) ||
                  z.buildings.some((n) => dist(n, q) < 120) ||
                  z.nodes.some((n) => dist(n, q) < 85) ||
                  z.npcs.some((n) => dist(n, q) < 100) ||
                  z.enemies.some((n) => n.hp > 0 && dist(n, q) < 70)
                )
                  continue;
                if (
                  z.roads.some((road) =>
                    road.slice(1).some((b, i) => this.distanceToSegment(q, road[i], b) < 75),
                  )
                )
                  continue;
                chosen = q;
                break;
              }
              if (chosen) break;
            }
            if (chosen) Object.assign(p, chosen);
          }
          this.blocked = function (x, y, zone, radius = 15, terrainOnly = false) {
            return blocked.call(this, x, y, zone, Math.max(30, radius), terrainOnly);
          };
          const goal = { x: cfg.approach[0], y: cfg.approach[1] },
            starts = z.roads
              .flat()
              .filter((p) => !this.blocked(p.x, p.y, z.id, 30))
              .sort((a, b) => dist(a, goal) - dist(b, goal));
          for (const start of starts.slice(0, 8)) {
            const road = this.route(start, goal, { road: true });
            if (road.length) {
              z.roads.push(road);
              break;
            }
          }
          z.frontierVisualVersion = cfg.version;
        } finally {
          this.blocked = blocked;
          this.s.zone = oldZone;
        }
      }
      frontierTownServices(z) {
        const cfg = R.frontierSceneLayout;
        if (z.id !== 'frontier' || z.frontierSceneVersion !== cfg.version) return;
        for (const [id, xy] of Object.entries(z.frontierTownPlacements || cfg.npcs)) {
          const n = z.npcs.find((n) => n.id === id);
          if (n) Object.assign(n, { x: xy[0], y: xy[1] });
        }
      }
      frontierSceneComposition(z) {
        const cfg = R.frontierSceneLayout;
        if (z.id !== 'frontier' || z.frontierSceneVersion === cfg.version) return;
        const oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          const at = (xy) => ({ x: xy[0], y: xy[1] }),
            nature = new Set(R.frontierEdgeLayout.nature),
            natural = (p) => nature.has(p.structure) || /^forest-/.test(p.id || ''),
            planned = new Set(Object.keys(cfg.props)),
            moving = z.props.filter((p) => planned.has(p.id)),
            clearPlot = (q, p, margin = 35) =>
              !this.blocked(q.x, q.y, z.id, Math.max(15, p.r || 0), true) &&
              !z.buildings.some((b) => dist(q, b) < 160 + (p.r || 0)) &&
              (!(p.r > 0) ||
                oldZone !== z.id ||
                ![this.hero, ...this.activeLivingParty()].some((u) => dist(q, u) < p.r + 45)) &&
              !z.nodes.some((n) => dist(q, n) < 65 + (p.r || 0)) &&
              !z.enemies.some(
                (e) =>
                  e.hp > 0 &&
                  (dist(q, e.home || e) < 85 + (p.r || 0) || dist(q, e) < 65 + (p.r || 0)),
              ) &&
              !z.props.some(
                (n) => n !== p && !natural(n) && dist(q, n) < (p.r || 0) + (n.r || 0) + margin,
              ),
            choose = (raw, p, extra = () => true) => {
              for (const radius of [0, 45, 90, 135, 180, 240, 300])
                for (let j = 0; j < (radius ? 16 : 1); j++) {
                  const q = {
                    x: raw.x + Math.cos((j * Math.PI) / 8) * radius,
                    y: raw.y + Math.sin((j * Math.PI) / 8) * radius,
                  };
                  if (clearPlot(q, p) && extra(q)) return q;
                }
              return null;
            };
          // Preserve stable records and player constructions; fixed plots replace
          // independent radial searches that broke the original scene groups.
          z.props = z.props.filter((p) => !planned.has(p.id));
          for (const p of moving.sort((a, b) => (b.r || 0) - (a.r || 0))) {
            const q = choose(at(cfg.props[p.id]), p);
            if (q) Object.assign(p, q);
            z.props.push(p);
          }
          // Trim only the old northwest street fragments. Keep all regional
          // roads beyond the town boundary and reconnect each exact exit.
          const outside = [],
            gates = [];
          for (const road of z.roads) {
            let part = [];
            const flush = () => {
              if (part.length > 1) outside.push(part);
              part = [];
            };
            for (let j = 1; j < road.length; j++) {
              const a = road[j - 1],
                b = road[j],
                cuts = [0, 1];
              if (b.x !== a.x) cuts.push((1170 - a.x) / (b.x - a.x));
              if (b.y !== a.y) cuts.push((1500 - a.y) / (b.y - a.y));
              const ts = [...new Set(cuts.filter((t) => t >= 0 && t <= 1))].sort((a, b) => a - b);
              const point = (t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
              for (let k = 1; k < ts.length; k++) {
                const mid = point((ts[k - 1] + ts[k]) / 2),
                  p = point(ts[k - 1]),
                  q = point(ts[k]);
                if (mid.x <= 1170 && mid.y <= 1500) {
                  flush();
                  continue;
                }
                if (!part.length) part.push(p);
                part.push(q);
                for (const p of [point(ts[k - 1]), q])
                  if (
                    (Math.abs(p.x - 1170) < 0.001 && p.y <= 1500) ||
                    (Math.abs(p.y - 1500) < 0.001 && p.x <= 1170)
                  )
                    gates.push(p);
              }
            }
            flush();
          }
          z.roads = [
            ...outside,
            ...cfg.streets.map((r) => r.map(at)),
            [
              { x: 450, y: 1450 },
              { x: 450, y: 1690 },
              { x: 260, y: 1690 },
            ],
          ];
          for (const gate of gates) {
            const near = this.nearestRoadPoint({ roads: cfg.streets.map((r) => r.map(at)) }, gate);
            if (near && dist(near, gate) > 0.1) z.roads.push([near, gate]);
          }
          const shoreMargin = (p) =>
            /house|workshop|watchpost|well/.test(p.structure || '')
              ? 160
              : /tree|willow|birch/.test(p.structure || '') || /^forest-/.test(p.id || '')
                ? 105
                : /grass|scrub|poppies|ash-patch|garden/.test(p.structure || '')
                  ? 45
                  : 95;
          // Preserve the ravine as open space. Fort walls have an intentional
          // defensive relationship with it; loose domestic/work props do not.
          for (const p of z.props) {
            if (p.stronghold && /wall|gate/.test(p.structure || '')) continue;
            const [lo, hi] = R.channelBanks(3, p.y),
              margin = shoreMargin(p);
            if (p.x <= lo - margin || p.x >= hi + margin) continue;
            const side = p.x < (lo + hi) / 2 ? -1 : 1,
              raw = { x: (side < 0 ? lo : hi) + side * (margin + 35), y: p.y };
            const q = choose(raw, p, (q) => {
              const [l, r] = R.channelBanks(3, q.y);
              return (
                (q.x < l - margin || q.x > r + margin) &&
                this.distanceToRoad(z, q) > Math.max(45, (p.r || 0) + 55)
              );
            });
            if (q) Object.assign(p, q);
          }
          const shoreClear = (q, p) => {
              const [l, r] = R.channelBanks(3, q.y),
                m = shoreMargin(p);
              return q.x < l - m || q.x > r + m;
            },
            projectedClash = (q, b) =>
              Math.abs((q.x - q.y - b.x + b.y) * 0.76) < 80 &&
              Math.abs((q.x + q.y - b.x - b.y) * 0.27) < 85;
          // Replant only nature conflicting with the new town streets/plots.
          // Outside this local clearing and river margins the old forest stays.
          for (const p of z.props.filter(natural)) {
            if (p.x > 1300 || p.y > 1740) continue;
            const roadClear = /tree|willow|birch/.test(p.structure || '') || p.r > 0 ? 100 : 50,
              needs =
                this.distanceToRoad(z, p) < roadClear ||
                moving.some((b) => !natural(b) && dist(p, b) < (b.r || 0) + 90) ||
                Object.values(cfg.npcs).some((xy) => dist(p, at(xy)) < 90);
            if (!needs) continue;
            const raw = { x: p.x, y: p.y },
              q = choose(
                raw,
                p,
                (q) =>
                  this.distanceToRoad(z, q) > roadClear &&
                  !moving.some((b) => dist(q, b) < (b.r || 0) + 100) &&
                  !Object.values(cfg.npcs).some((xy) => dist(q, at(xy)) < 100),
              );
            if (q) Object.assign(p, q);
          }
          z.frontierTownPlacements = {};
          // The original burned-forest cluster now falls inside the expanded
          // residential streets. Keep its trees as a woodland beyond town,
          // rather than scattering nineteen trunks among doors and front paths.
          let treeIndex = 0;
          for (const p of z.props.filter(
            (p) => /^forest-0-/.test(p.id || '') && p.x < 1300 && p.y < 1740,
          )) {
            const j = treeIndex++,
              raw = {
                x: 170 + (j % 5) * 210 + (j % 3) * 17,
                y: 1850 + Math.floor(j / 5) * 200 + (j % 4) * 19,
              },
              q = choose(
                raw,
                p,
                (q) =>
                  this.distanceToRoad(z, q) > 105 &&
                  shoreClear(q, p) &&
                  !z.props.some((n) => n !== p && natural(n) && dist(n, q) < 115),
              );
            if (q) Object.assign(p, q);
          }
          for (const [id, xy] of Object.entries(cfg.npcs)) {
            const raw = at(xy),
              q = choose(
                raw,
                { r: 0 },
                (q) => !z.props.some((p) => !p.decorative && dist(p, q) < (p.r || 0) + 45),
              );
            const target = q || this.safe(raw.x, raw.y, z.id);
            z.frontierTownPlacements[id] = [target.x, target.y];
          }
          z.frontierSceneVersion = cfg.version;
          this.frontierTownServices(z);
          z.footpaths ||= [];
          const doors = [
            ...moving.filter((p) => /house|workshop|well|market/.test(p.structure || '')),
            ...z.npcs.filter((n) => Object.hasOwn(cfg.npcs, n.id) && !n.id.startsWith('service-')),
          ];
          // All fronts face the camera: +x,+y puts their paths beyond the door,
          // rather than drawing an approach under the roof at the back.
          for (const p of doors) {
            const door = this.safe(p.x + 40, p.y + 40, z.id),
              near = this.nearestRoadPoint(z, door);
            if (!near || dist(near, door) < 15) continue;
            const route = this.route(near, door);
            if (route.length) z.footpaths.push([near, ...route]);
          }
          const hamlet = z.npcs.find((n) => n.id === 'minor');
          if (hamlet) {
            const near = this.nearestRoadPoint(z, hamlet.servicePoint || hamlet),
              door = this.safe(hamlet.x + 45, hamlet.y + 45, z.id);
            const route = near && this.route(near, door);
            if (route?.length) z.footpaths.push([near, ...route]);
          }
          // Thin only conflicts with the final footpaths, too: a newly added
          // doorstep path must not disappear beneath a retained tree or log.
          const walking = { roads: [...z.roads, ...z.footpaths] };
          for (const p of z.props.filter(natural)) {
            const nearby = doors.filter(
              (n) => /house|workshop|well/.test(n.structure || '') || n.kind === 'rest',
            );
            if (
              (p.x > 1300 || p.y > 1740 || this.distanceToRoad(walking, p) > 65) &&
              !nearby.some((n) => projectedClash(p, n))
            )
              continue;
            const q = choose(
              p,
              p,
              (q) =>
                this.distanceToRoad(walking, q) > 75 &&
                shoreClear(q, p) &&
                !nearby.some((n) => projectedClash(q, n)) &&
                !doors.some((n) => dist(n, q) < 110) &&
                !z.props.some((n) => n !== p && natural(n) && dist(n, q) < 85),
            );
            if (q) Object.assign(p, q);
          }
          for (const [j, row] of cfg.poppies.entries()) {
            const [x, y, form] = row,
              p = {
                id: 'frontier-poppy-' + j,
                r: 0,
                decorative: true,
                structure: 'battlefield-poppies',
                poppyForm: form,
                poppyScale: 0.68 + form * 0.1,
              },
              q = choose(
                { x, y },
                p,
                (q) =>
                  this.distanceToRoad(z, q) > 42 &&
                  !z.npcs.some((n) => dist(n, q) < 95) &&
                  !z.props.some((n) => dist(n, q) < (n.r || 0) + 65) &&
                  !this.blocked(q.x, q.y, z.id, 15),
              );
            if (q) z.props.push({ ...p, ...q });
          }
        } finally {
          this.s.zone = oldZone;
        }
      }
      crownTownServices(z) {
        if (z.id !== 'crown' || z.crownSceneVersion !== R.crownSceneLayout.version) return;
        for (const [id, xy] of Object.entries(z.crownTownPlacements || R.crownSceneLayout.npcs)) {
          const n = z.npcs.find((n) => n.id === id);
          if (n) Object.assign(n, { x: xy[0], y: xy[1] });
        }
      }
      crownSceneComposition(z) {
        const cfg = R.crownSceneLayout;
        if (z.id !== 'crown' || z.crownSceneVersion === cfg.version) return;
        const oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          // An old player construction at the newly extended channel gets a
          // retained masonry deck. New construction still obeys lava collision.
          z.crownInheritedDecks = (z.buildings || [])
            .filter((b) => {
              const [lo, hi] = R.channelBanks(4, b.y);
              return (b.y < 300 || b.y > 2810) && b.x > lo - 90 && b.x < hi + 90;
            })
            .map((b) => ({
              x1: Math.min(1200, b.x - 115),
              x2: Math.max(1510, b.x + 115),
              y1: b.y - 120,
              y2: b.y + 120,
            }));
          const at = (xy) => ({ x: xy[0], y: xy[1] }),
            natural = (p) => /^forest-|^aesthetic-nature-|^aesthetic-bank-/.test(p.id || ''),
            planned = new Set(Object.keys(cfg.props)),
            moving = z.props.filter((p) => planned.has(p.id)),
            clear = (q, p) =>
              q.x > 60 &&
              q.y > 60 &&
              q.x < 3740 &&
              q.y < 3740 &&
              !this.blocked(q.x, q.y, z.id, Math.max(15, p.r || 0), true) &&
              !z.buildings.some((b) => dist(q, b) < 160 + (p.r || 0)) &&
              !z.nodes.some((n) => dist(q, n) < 65 + (p.r || 0)) &&
              (!(p.r > 0) ||
                oldZone !== z.id ||
                ![this.hero, ...this.activeLivingParty()].some((u) => dist(q, u) < p.r + 45)) &&
              !z.enemies.some(
                (e) =>
                  e.hp > 0 &&
                  (dist(q, e.home || e) < 85 + (p.r || 0) || dist(q, e) < 65 + (p.r || 0)),
              ) &&
              !z.props.some(
                (n) => n !== p && !natural(n) && dist(q, n) < (p.r || 0) + (n.r || 0) + 40,
              ),
            choose = (raw, p, extra = () => true) => {
              for (const radius of [0, 45, 90, 135, 180, 240, 300])
                for (let j = 0; j < (radius ? 16 : 1); j++) {
                  const q = {
                    x: raw.x + Math.cos((j * Math.PI) / 8) * radius,
                    y: raw.y + Math.sin((j * Math.PI) / 8) * radius,
                  };
                  if (clear(q, p) && extra(q)) return q;
                }
              return null;
            };
          z.props = z.props.filter((p) => !planned.has(p.id));
          for (const p of moving.sort((a, b) => (b.r || 0) - (a.r || 0))) {
            const q = choose(at(cfg.props[p.id]), p);
            if (q) Object.assign(p, q);
            z.props.push(p);
          }
          const outside = [],
            gates = [];
          for (const road of z.roads) {
            let part = [];
            const flush = () => {
              if (part.length > 1) outside.push(part);
              part = [];
            };
            for (let j = 1; j < road.length; j++) {
              const a = road[j - 1],
                b = road[j],
                cuts = [0, 1];
              if (b.x !== a.x) cuts.push((1150 - a.x) / (b.x - a.x));
              if (b.y !== a.y) cuts.push((1600 - a.y) / (b.y - a.y));
              const ts = [...new Set(cuts.filter((t) => t >= 0 && t <= 1))].sort((a, b) => a - b);
              const point = (t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
              for (let k = 1; k < ts.length; k++) {
                const mid = point((ts[k - 1] + ts[k]) / 2),
                  p = point(ts[k - 1]),
                  q = point(ts[k]);
                if (mid.x <= 1150 && mid.y <= 1600) {
                  flush();
                  continue;
                }
                if (!part.length) part.push(p);
                part.push(q);
                for (const p of [point(ts[k - 1]), q])
                  if (
                    (Math.abs(p.x - 1150) < 0.001 && p.y <= 1600) ||
                    (Math.abs(p.y - 1600) < 0.001 && p.x <= 1150)
                  )
                    gates.push(p);
              }
            }
            flush();
          }
          z.roads = [...outside, ...cfg.streets.map((r) => r.map(at))];
          for (const gate of gates) {
            const near = this.nearestRoadPoint({ roads: cfg.streets.map((r) => r.map(at)) }, gate);
            if (near && dist(near, gate) > 0.1) z.roads.push([near, gate]);
          }
          const shoreMargin = (p) =>
              /house|watchpost|well|laundry|woodpile|market/.test(p.structure || '')
                ? 170
                : natural(p)
                  ? 80
                  : 105,
            shoreClear = (q, p) => {
              const [lo, hi] = R.channelBanks(4, q.y),
                m = shoreMargin(p);
              return q.x < lo - m || q.x > hi + m;
            };
          for (const p of z.props) {
            if (p.stronghold || /mini-wall-/.test(p.id || '')) continue;
            if (shoreClear(p, p)) continue;
            const [lo, hi] = R.channelBanks(4, p.y),
              side = p.x < (lo + hi) / 2 ? -1 : 1,
              q = choose(
                { x: (side < 0 ? lo : hi) + side * (shoreMargin(p) + 40), y: p.y },
                p,
                (q) =>
                  shoreClear(q, p) && this.distanceToRoad(z, q) > Math.max(55, (p.r || 0) + 45),
              );
            if (q) Object.assign(p, q);
          }
          let woodland = 0;
          for (const p of z.props.filter((p) => /^forest-0-/.test(p.id || ''))) {
            const j = woodland++,
              raw = { x: 160 + (j % 3) * 130, y: 1880 + Math.floor(j / 3) * 290 };
            const q = choose(
              raw,
              p,
              (q) =>
                q.x < 440 &&
                this.distanceToRoad(z, q) > 85 &&
                !moving.some((n) => dist(q, n) < (n.r || 0) + 110) &&
                !z.props.some((n) => n !== p && natural(n) && dist(n, q) < 85),
            );
            if (q) Object.assign(p, q);
          }
          // Repair only scenery newly submerged by the channel extension,
          // before restore's generic invalid-prop filter can discard its ID.
          for (const p of z.props) {
            if (!this.blocked(p.x, p.y, z.id, p.r || 0, true)) continue;
            const q = choose(p, p);
            if (q) Object.assign(p, q);
          }
          z.crownTownPlacements = {};
          for (const [id, xy] of Object.entries(cfg.npcs)) {
            const raw = at(xy),
              q = choose(raw, { r: 0 }, (q) => shoreClear(q, { structure: 'house' }));
            const target = q || this.safe(raw.x, raw.y, z.id);
            z.crownTownPlacements[id] = [target.x, target.y];
          }
          for (const [id, xy] of Object.entries(cfg.nodes)) {
            const n = z.nodes.find((n) => n.id === id);
            if (!n) continue;
            const q = choose(at(xy), { r: 0 }, (q) => shoreClear(q, { structure: 'crate' }));
            if (q) Object.assign(n, q);
          }
          z.crownSceneVersion = cfg.version;
          this.crownTownServices(z);
          // Keep service use points and all original identities; connect the
          // visible front (+x,+y), not the back wall, to a public street.
          z.footpaths = [];
          const doors = [
            ...moving.filter((p) =>
              /house|well|market|yard|kiln|shed|washhouse/.test(p.structure || ''),
            ),
            ...z.npcs.filter(
              (n) =>
                Object.hasOwn(cfg.npcs, n.id) || /entrance|foundry|siege|fortress-gate/.test(n.id),
            ),
            ...z.nodes,
          ];
          const walking = () => ({ roads: [...z.roads, ...z.footpaths] });
          // Only conflicting natural dressing moves. Retain the surrounding
          // volcanic landscape; no new trees, houses or generic edge filler.
          for (const p of z.props.filter(natural)) {
            if (p.x > 1180 || p.y > 3250) continue;
            if (this.distanceToRoad(walking(), p) > 75 && !doors.some((n) => dist(p, n) < 115))
              continue;
            const q = choose(
              p,
              p,
              (q) =>
                shoreClear(q, p) &&
                this.distanceToRoad(walking(), q) > 85 &&
                !doors.some((n) => dist(q, n) < 125) &&
                !z.props.some((n) => n !== p && natural(n) && dist(n, q) < 85),
            );
            if (q) Object.assign(p, q);
          }
          for (const p of doors) {
            const door = this.safe(p.x + 45, p.y + 45, z.id),
              near = this.nearestRoadPoint(z, door);
            if (!near || dist(near, door) < 15) continue;
            const route = this.route(near, door);
            if (route.length) z.footpaths.push([near, ...route]);
          }
          // Connect both heat-work courts to the existing regional roads.
          for (const q of [
            { x: 2290, y: 2350 },
            { x: 2710, y: 1100 },
            { x: 1850, y: 3320 },
          ]) {
            const near = this.nearestRoadPoint(z, q),
              route = near && this.route(near, q);
            if (route?.length) z.footpaths.push([near, ...route]);
          }
        } finally {
          this.s.zone = oldZone;
        }
      }
      settlementLayout(z) {
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          this.sideDungeon(z.id) ||
          z.settlementLayoutVersion === 4
        )
          return;
        const i = this.regionIndex(z.id),
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          const major = { x: D.towns[i][0], y: D.towns[i][1] },
            minor = { x: D.minors[i][0], y: D.minors[i][1] },
            keep = (p) =>
              !String(p.id || '').startsWith('structure-') &&
              !String(p.id || '').startsWith('settlement-') &&
              !(
                String(p.id || '').startsWith('forest-') &&
                (dist(p, major) < 390 || dist(p, minor) < 330)
              );
          z.props = z.props.filter(keep);
          const terrainSafe = (x, y, r) => {
            if (!this.blocked(x, y, z.id, r, true)) return { x, y };
            for (let d = 30; d <= 180; d += 30)
              for (let n = 0; n < 16; n++) {
                const a = (n * Math.PI) / 8,
                  p = { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d };
                if (!this.blocked(p.x, p.y, z.id, r, true)) return p;
              }
            return null;
          };
          const regionalStructures = [
            { house: 'vale-cottage', workshop: 'vale-workshop', fence: 'vale-fence' },
            { house: 'march-stilt-house', workshop: 'march-boathouse', fence: 'march-boardwalk' },
            { house: 'highland-stone-house', workshop: 'highland-smithy', fence: 'highland-wall' },
            {
              house: 'frontier-patched-house',
              workshop: 'frontier-workshop',
              fence: 'frontier-palisade',
            },
            { house: 'crown-ash-house', workshop: 'crown-forgehouse', fence: 'crown-wall' },
          ][i];
          const add = (center, layout, prefix) => {
            layout.forEach(([dx, dy, structure], j) => {
              const p = terrainSafe(center.x + dx, center.y + dy, 34);
              if (!p) return;
              z.props.push({
                id: 'settlement-' + prefix + '-' + j,
                ...p,
                r: 32,
                structure: regionalStructures[structure] || structure,
                roadBlocker: true,
              });
            });
          };
          add(major, R.settlementLayouts.major, 'major');
          add(minor, R.settlementLayouts.minor, 'minor');
          const by = (id) => z.npcs.find((n) => n.id === id),
            place = (id, dx, dy) => {
              const n = by(id);
              if (n)
                Object.assign(
                  n,
                  terrainSafe(major.x + dx, major.y + dy, 8) || {
                    x: major.x + dx,
                    y: major.y + dy,
                  },
                );
            };
          place('supplier', 115, -85);
          place('recruiter', -125, 90);
          place('board', 210, 55);
          place('rest', 0, 0);
          const crownTravelHub = (R.crownRoutes || []).some((r) => z.id === 'crown' && r.travelHub);
          const rearStand = R.travelArrivalStands?.[z.id];
          if (rearStand) {
            const homeward = by('return');
            if (homeward)
              Object.assign(homeward, terrainSafe(rearStand.x, rearStand.y, 8) || rearStand);
          } else if (!R.harbors?.[z.id] && !crownTravelHub) place('return', 150, 175);
          const minorRest = by('minor');
          if (minorRest) Object.assign(minorRest, terrainSafe(minor.x, minor.y, 8) || minor);
          z.boardPositionVersion = 2;
          if (z.id === 'vale') z.supplierPositionVersion = 2;
          z.settlementLayoutVersion = 4;
        } finally {
          this.s.zone = oldZone;
        }
      }
      roadNetwork(z) {
        if (dungeonIds.includes(z.id) || this.supplyRoom(z.id) || this.sideDungeon(z.id)) return;
        this.settlementLayout(z);
        const i = this.regionIndex(z.id),
          roadVersion = 17;
        if (z.roadVersion === roadVersion) return;
        const origin = { x: D.towns[i][0], y: D.towns[i][1] },
          field = this.fieldCenter(i),
          oldZone = this.s.zone,
          key = z.id + ':v' + roadVersion;
        this.s.zone = z.id;
        const harbor = R.harbors?.[z.id],
          frontierRoutes = z.id === 'frontier' ? (R.frontierRoutes || []).map((r) => r.point) : [],
          crownRoutes = z.id === 'crown' ? (R.crownRoutes || []).map((r) => r.point) : [],
          destinations = [
            D.minors[i],
            [field.x, field.y],
            D.ports[i],
            ...(R.travelArrivalStands?.[z.id]
              ? [[R.travelArrivalStands[z.id].x, R.travelArrivalStands[z.id].y]]
              : []),
            // Roads finish at an approach to a major entrance or stronghold,
            // never underneath its artwork or defensive walls.
            ...(harbor ? [[harbor.arrival.x, harbor.arrival.y]] : []),
            ...frontierRoutes,
            ...crownRoutes,
          ],
          // Road approaches serve authored destinations without paving
          // straight through a monster compound, house, shrine, or fort.
          // All of these coordinates already exist in the game world.
          inhabitedSites = [
            {
              id: 'main-dungeon-entrance',
              name: 'Main dungeon entrance',
              x: D.entrances[i][0],
              y: D.entrances[i][1],
            },
            ...R.sites[i]
              .filter(([id]) => !/^(?:bridge-|crossing-)/.test(id))
              .map(([id, name, x, y]) => ({ id, name, x, y })),
            ...(R.creatureStrongholds || [])
              .filter((hold) => hold.region === z.id && hold.center)
              .map((hold) => ({
                id: hold.id,
                name: hold.id,
                x: hold.center[0],
                y: hold.center[1],
              })),
            ...(R.worldLifePlans?.[i]?.habitats || []).map((habitat) => ({
              id: habitat.id,
              name: habitat.id,
              x: habitat.center[0],
              y: habitat.center[1],
            })),
            ...(z.id === 'frontier' ? R.frontierDistricts || [] : []).map((district) => ({
              id: district.id,
              name: district.id,
              x: district.center[0],
              y: district.center[1],
            })),
            ...(z.id === 'crown' ? R.crownDistricts || [] : []).map((district) => ({
              id: district.id,
              name: district.id,
              x: district.center[0],
              y: district.center[1],
            })),
            ...(z.id === 'highlands' ? R.ironrootLife || [] : []).map((district) => {
              // Newly added ore and mint decorations cannot move old road
              // destinations. Preserve the original district centroid.
              const routed = district.props.filter(
                ([, , kind]) =>
                  !/^(silver|copper)-(ore-face|sort-samples|refining-hearth|die-tray)$/.test(
                    kind,
                  ) && kind !== 'sealed-crown-consignment',
              );
              return {
                id: district.id,
                name: district.id,
                x: routed.reduce((total, p) => total + p[0], 0) / routed.length,
                y: routed.reduce((total, p) => total + p[1], 0) / routed.length,
              };
            }),
          ],
          props = z.props,
          blockers = z.props
            .filter((p) => p.roadBlocker)
            .map((p) => ({ ...p, r: (p.r || 0) + (i === 2 ? 65 : 85) }));
        z.props = blockers;
        try {
          if (roadPlans.has(key)) z.roads = clone(roadPlans.get(key));
          else {
            // Build a connected road tree: the hamlet is the first arterial,
            // and later destinations branch from existing junctions instead of
            // each receiving an independent random-looking spoke from the square.
            z.roads = [];
            const visited = new Set();
            for (const [x, y] of destinations) {
              const destination = { x, y },
                id = x + ':' + y;
              if (visited.has(id) || dist(origin, destination) <= 1) continue;
              visited.add(id);
              let start = origin;
              // Main town-to-hamlet and town-to-field arterials retain
              // their original direct course; spurs join existing streets.
              if (z.roads.length && !(x === field.x && y === field.y)) {
                const junctions = z.roads.flatMap((path) => path);
                const closest = junctions.reduce(
                  (best, p) => (!best || dist(p, destination) < dist(best, destination) ? p : best),
                  null,
                );
                if (
                  closest &&
                  dist(closest, origin) >= 100 &&
                  dist(closest, destination) < dist(origin, destination) * 0.8
                )
                  start = closest;
              }
              let path = this.route(start, destination, { road: true });
              if (path.length < 2 && start !== origin)
                path = this.route(origin, destination, { road: true });
              if (path.length > 1) z.roads.push(path);
            }
            // A coherent settlement road network also serves local economic,
            // military, hostile, and named places. Add only missing branches:
            // wilderness does not become a grid of needless paved spokes.
            for (const place of inhabitedSites) {
              const center = { x: place.x, y: place.y };
              if (this.distanceToRoad(z, center) <= 230) continue;
              const junctions = z.roads.flatMap((path) => path);
              const nearest = junctions.reduce(
                (best, point) => (!best || dist(point, center) < dist(best, center) ? point : best),
                origin,
              );
              const angle = Math.atan2(nearest.y - center.y, nearest.x - center.x);
              const candidates = [];
              for (const radius of [160, 195, 220]) {
                for (const offset of [0, 0.35, -0.35, 0.7, -0.7, 1.1, -1.1, 1.6, -1.6]) {
                  const candidate = {
                    x: center.x + Math.cos(angle + offset) * radius,
                    y: center.y + Math.sin(angle + offset) * radius,
                  };
                  if (!this.blocked(candidate.x, candidate.y, z.id, 34)) candidates.push(candidate);
                }
              }
              candidates.sort((a, b) => dist(a, nearest) - dist(b, nearest));
              for (const candidate of candidates) {
                if (this.distanceToRoad(z, candidate) < 25) break;
                const path = this.route(nearest, candidate, { road: true });
                if (path.length < 2) continue;
                z.roads.push(path);
                break;
              }
            }
            roadPlans.set(key, clone(z.roads));
          }
        } finally {
          z.props = props;
          this.s.zone = oldZone;
        }
        // As before, thin anonymous forest obstacles beside roads rather
        // than displacing collision trees into hostile camps. Distinct authored
        // structures and district props survive for the frontage audit below.
        z.props = z.props.filter(
          (p) => p.roadBlocker || p.structure || this.distanceToRoad(z, p) >= (p.r || 0) + 60,
        );
        // Relocate only long-lived settlement houses before livelihood and
        // occupation scenery is authored, so those scenes remain repeatable.
        this.clearRoadBlockers(z);
        z.roadVersion = roadVersion;
        // Rebuild road-sensitive life and occupied districts for old saves.
        // IDs and captured progress remain intact; authored scenery follows
        // the newly routed network instead of retaining stale locations.
        delete z.worldLifeVersion;
        delete z.ironrootLifeVersion;
        delete z.frontierLayoutVersion;
        delete z.crownLayoutVersion;
        delete z.streetClearanceVersion;
        delete z.townVisualClearanceVersion;
        delete z.strongholdCourtyardSpacingVersion;
        delete z.landmarkRoadShoulderVersion;
        delete z.roadLampVersion;
        delete z.environmentCoherenceVersion;
      }
      // N1a migrates visual evidence and the inspection points independently
      // of interiorCoherenceVersion 3: replaying that migration would shift walls
      // and guards in established v4 saves.
      narrativeSceneReconciliation(z) {
        const inspection = R.narrativeSceneInspections?.[z.id];
        if (!inspection || z.narrativeSceneVersion === 1) return;
        const side = this.sideDungeon(z.id);
        if (side) {
          // Keep historical 'side-decor-N' IDs and all blocking geometry stable.
          for (const [j, [x, y, structure]] of side.decor.entries()) {
            const id = 'side-decor-' + j;
            const previous = z.props.find((p) => p.id === id);
            if (previous) previous.structure = structure;
            else
              z.props.push({
                id,
                ...this.safe(x, y, z.id),
                r: 0,
                decorative: true,
                structure,
                sceneRole: side.species + '-household-life',
              });
          }
        }
        for (const item of inspection) {
          if (z.npcs.some((n) => n.id === item.id)) continue;
          const point = this.safe(item.x, item.y, z.id);
          z.npcs.push({
            id: item.id,
            name: item.name,
            kind: 'scene-detail',
            narrativeId: item.narrativeId,
            ...point,
            icon: item.icon,
          });
        }
        z.narrativeSceneVersion = 1;
      }
      interiorCoherence(z) {
        this.narrativeSceneReconciliation(z);
        const side = this.sideDungeon(z.id),
          room = this.supplyRoom(z.id);
        if ((!side && !room && !dungeonIds.includes(z.id)) || z.interiorCoherenceVersion === 3)
          return;
        const previous = this.s.zone;
        this.s.zone = z.id;
        try {
          // No blanket enlargement or immunity: receiving posts, a Citadel entry
          // watch and the few posts inside immediate perception need staging.
          if (z.id === 'mine' || z.id === 'citadel') {
            const count = z.id === 'mine' ? 3 : 2,
              native = z.enemies
                .filter(
                  (e) =>
                    e.guard &&
                    !e.reinforcement &&
                    !e.summon &&
                    e.type !== 'boss' &&
                    e.form === 'normal',
                )
                .sort((a, b) => this.idOrder(a, b));
            for (const [j, e] of native.slice(0, count).entries()) {
              const post = R.dungeonGuardFormations[z.id][j],
                p = this.safe(post.x, post.y, z.id);
              e.home = { ...p };
              e.pack = z.id + '-' + post.group;
              if (e.hp > 0 && !e.aggro && !e.returning) Object.assign(e, p);
            }
          }
          // The Crypt/Archive receiving sentry, repeated side-room first post
          // and two Treasury entry posts were
          // inside 260-unit immediate perception. Shift only those posts; keep
          // guard-to-captain alerts and the full guarded chambers beyond them.
          if (side || ['crypt', 'archive', 'supply-highlands', 'supply-crown'].includes(z.id)) {
            const native = z.enemies
                .filter(
                  (e) =>
                    e.type !== 'boss' &&
                    !e.roomCaptain &&
                    !e.summon &&
                    !e.reinforcement &&
                    e.form === 'normal',
                )
                .sort((a, b) => this.idOrder(a, b)),
              e = native[0],
              post = side
                ? { x: 260, y: 390 }
                : ['crypt', 'archive'].includes(z.id)
                  ? { x: 350, y: 450 }
                  : R.treasuryGuardFormations[z.id][0];
            if (e) {
              const point = this.safe(post.x, post.y, z.id);
              e.home = { ...point };
              if (e.hp > 0 && !e.aggro && !e.returning) Object.assign(e, point);
            }
          }
          if (side) {
            for (const [j, [x, y, structure]] of side.decor.entries()) {
              const id = 'side-decor-' + j,
                old = z.props.find((p) => p.id === id);
              if (old) {
                old.structure = structure;
                continue;
              }
              const p = this.safe(x, y, z.id);
              z.props.push({
                id,
                ...p,
                r: 0,
                decorative: true,
                structure,
                sceneRole: side.species + '-household-life',
              });
            }
            // Modest offset alcoves make former column rows read as inhabited rooms.
            // Collision remains the original stable pillar radius and all exits stay open.
            for (const p of z.props.filter((p) => p.id.startsWith('side-wall-'))) {
              const j = Number(p.id.slice('side-wall-'.length));
              p.householdPartition = side.theme;
              p.sceneRole = 'occupied-wall-alcove';
              if (j === 0 || j === 3) {
                const target = { x: p.x + (j === 0 ? -35 : 35), y: p.y };
                if (
                  !z.enemies.some((e) => dist(e.home || e, target) < p.r + 45) &&
                  !this.blocked(target.x, target.y, z.id, 0, true)
                )
                  Object.assign(p, target);
              }
            }
          }
          z.interiorCoherenceVersion = 3;
        } finally {
          this.s.zone = previous;
        }
      }
      nearestRoadPoint(z, point, predicate = () => true) {
        let best = null,
          distance = Infinity;
        for (const path of z.roads || [])
          for (let j = 1; j < path.length; j++) {
            const a = path[j - 1],
              b = path[j],
              dx = b.x - a.x,
              dy = b.y - a.y,
              t = Math.max(
                0,
                Math.min(
                  1,
                  ((point.x - a.x) * dx + (point.y - a.y) * dy) / Math.max(1, dx * dx + dy * dy),
                ),
              ),
              p = { x: a.x + t * dx, y: a.y + t * dy };
            if (!predicate(p) || dist(p, point) >= distance) continue;
            best = p;
            distance = dist(p, point);
          }
        return best;
      }
      environmentCoherence(z) {
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          this.sideDungeon(z.id) ||
          z.environmentCoherenceVersion === 2
        )
          return;
        const previous = this.s.zone,
          i = this.regionIndex(z.id),
          barrier = R.barriers[i],
          [x1, x2] = barrier.bounds;
        this.s.zone = z.id;
        try {
          // Repair only positions invalidated by changed bank geometry, retaining identity,
          // wounds, deaths, ownership, collected resources and all quest state.
          for (const prop of z.props) {
            if (
              /water|pool|wallow|reeds|cattails/.test(prop.structure || '') ||
              !this.blocked(prop.x, prop.y, z.id, Math.max(8, prop.r || 0), true)
            )
              continue;
            const radius = Math.max(15, prop.r || 0),
              candidates = [];
            for (let r = 25; r <= 250; r += 25)
              for (let j = 0; j < 24; j++)
                candidates.push({
                  x: prop.x + Math.cos((j * Math.PI) / 12) * r,
                  y: prop.y + Math.sin((j * Math.PI) / 12) * r,
                });
            const p = candidates.find(
              (p) =>
                !this.blocked(p.x, p.y, z.id, radius, true) &&
                !z.props.some(
                  (q) => q !== prop && !q.decorative && dist(q, p) < (q.r || 0) + radius,
                ) &&
                !z.npcs.some((n) => dist(n, p) < radius + 50) &&
                !z.enemies.some((e) => e.hp > 0 && dist(e.home || e, p) < radius + 45),
            );
            if (p) Object.assign(prop, p);
          }
          for (const item of [...z.npcs, ...z.nodes, ...z.buildings]) {
            if (this.blocked(item.x, item.y, z.id, 15, true))
              Object.assign(item, this.safe(item.x, item.y, z.id));
          }
          for (const e of z.enemies) {
            if (e.home && this.blocked(e.home.x, e.home.y, z.id, 15, true))
              e.home = this.safe(e.home.x, e.home.y, z.id);
            if (e.hp > 0 && this.blocked(e.x, e.y, z.id, 15, true))
              Object.assign(e, this.safe(e.x, e.y, z.id));
          }
          // One common throat at each named crossing removes parallel mismatched banks.
          z.bridgeApproaches = [];
          for (const [lo, hi] of barrier.gaps) {
            const site = R.sites[i].find(
                ([id, , , y]) => /bridge-|crossing-/.test(id) && y > lo && y < hi,
              ),
              y = site ? site[3] : (lo + hi) / 2,
              west = { x: x1 - 105, y },
              east = { x: x2 + 105, y };
            // Keep previously validated route vertices intact. Join the named throat
            // with new collision-routed spurs instead of bending an old diagonal into a bank.
            for (const [bank, sign] of [
              [west, -1],
              [east, 1],
            ]) {
              const junction = this.nearestRoadPoint(z, bank, (p) =>
                sign < 0 ? p.x < x1 - 60 : p.x > x2 + 60,
              );
              if (junction && dist(junction, bank) > 15) {
                const path = this.route(junction, bank, { road: true });
                if (path.length > 1) z.roads.push(path);
              }
            }
            // Reserve the real terrain crossing before final street clearance.
            // A misplaced house must be relocated, not suppress its own road.
            if (this.clearSegment(west, east, 25, true)) z.roads.push([west, east]);
            z.bridgeApproaches.push({ id: site?.[0] || 'crossing-' + y, west, east });
          }
          const entrances = z.npcs.filter((n) => n.kind === 'dungeon' || n.sideDungeon),
            connect = (point) => {
              const start = this.nearestRoadPoint(z, point);
              if (!start || dist(start, point) < 25) return;
              const path = this.route(start, point, { road: true });
              if (path.length > 1) z.roads.push(path);
            };
          for (const n of entrances) {
            if (n.treasury && this.distanceToRoad(z, n) < 195) {
              const base = { x: n.x, y: n.y },
                candidates = [];
              for (const radius of [65, 105, 150, 205, 265, 325, 405, 505, 605])
                for (let k = 0; k < 24; k++)
                  candidates.push({
                    x: base.x + Math.cos((k * Math.PI) / 12) * radius,
                    y: base.y + Math.sin((k * Math.PI) / 12) * radius,
                  });
              const p = candidates.find(
                (p) =>
                  !this.blocked(p.x, p.y, z.id, 30) &&
                  this.distanceToRoad(z, p) >= 195 &&
                  !z.npcs.some((other) => other !== n && dist(other, p) < 145) &&
                  !z.nodes.some((other) => dist(other, p) < 95) &&
                  !z.props.some((other) => other.roadBlocker && dist(other, p) < 195),
              );
              if (p) Object.assign(n, p);
            }
            // Terminate the freight road at the frontage, not under the painted roof.
            const near = this.nearestRoadPoint(z, n);
            if (!near) continue;
            const angle = Math.atan2(near.y - n.y, near.x - n.x),
              setback = n.treasury ? 195 : 145;
            const frontage = {
              x: n.x + Math.cos(angle) * setback,
              y: n.y + Math.sin(angle) * setback,
            };
            if (!this.blocked(frontage.x, frontage.y, z.id, 25)) connect(frontage);
          }
          // Actual placed logistics yards get service access; wilderness dens remain informal.
          if (z.id === 'highlands') {
            const yards = z.props.filter((p) =>
              [
                'ore-sorting-bay',
                'caravan-loading-bay',
                'mint-workbench',
                'silver-ore-face',
                'copper-ore-face',
                'mine-supports',
              ].includes(p.structure),
            );
            for (const yard of yards) {
              const near = this.nearestRoadPoint(z, yard);
              if (!near || dist(near, yard) < 150) continue;
              const angle = Math.atan2(near.y - yard.y, near.x - yard.x),
                frontage = { x: yard.x + Math.cos(angle) * 130, y: yard.y + Math.sin(angle) * 130 };
              if (!this.blocked(frontage.x, frontage.y, z.id, 25)) connect(frontage);
            }
          }
          // Final clearance runs AFTER new routes, using painted-roof setbacks.
          delete z.streetClearanceVersion;
          this.clearStreetCorridors(z);
          if (z.id === 'march') this.marchBankEcology(z);
          // Stable metadata is a migration receipt, not a successful rendered-world review.
          z.environmentCoherenceVersion = 2;
        } finally {
          this.s.zone = previous;
        }
      }
      marchBankEcology(z) {
        const i = 1,
          barrier = R.barriers[i],
          wetDistance = (p) => {
            const [lo, hi] = R.channelBanks(i, p.y);
            let distance =
              p.y >= barrier.bounds[2] && p.y <= barrier.bounds[3]
                ? Math.min(Math.abs(p.x - lo), Math.abs(p.x - hi))
                : Infinity;
            for (const pool of R.terrain[i].filter((t) => t.kind === 'water' && t.r))
              distance = Math.min(distance, Math.abs(dist(p, pool) - pool.r));
            for (let j = 1; j < R.wetlandDrainage.length; j++) {
              const a = R.wetlandDrainage[j - 1],
                b = R.wetlandDrainage[j];
              distance = Math.min(
                distance,
                this.distanceToSegment(p, { x: a[0], y: a[1] }, { x: b[0], y: b[1] }) -
                  Math.max(a[2], b[2]),
              );
            }
            return distance;
          },
          candidates = [];
        for (let y = barrier.bounds[2] + 35; y < barrier.bounds[3] - 25; y += 55) {
          if (barrier.gaps.some(([lo, hi]) => y > lo - 80 && y < hi + 80)) continue;
          const [lo, hi] = R.channelBanks(i, y);
          candidates.push({ x: lo - 32, y }, { x: hi + 32, y });
        }
        for (const pool of R.terrain[i].filter((t) => t.kind === 'water' && t.r))
          for (let k = 0; k < 16; k++)
            candidates.push({
              x: pool.x + Math.cos((k * Math.PI) / 8) * (pool.r + 30),
              y: pool.y + Math.sin((k * Math.PI) / 8) * (pool.r + 30),
            });
        for (const [x, y, width] of R.wetlandDrainage)
          for (const sign of [-1, 1])
            candidates.push({ x: Math.max(65, x), y: y + sign * (width + 25) });
        const valid = (p, item) =>
          !this.blocked(p.x, p.y, z.id, 8, true) &&
          this.distanceToRoad(z, p) > 65 &&
          !z.npcs.some((n) => dist(n, p) < 85) &&
          !z.props.some(
            (q) => q !== item && (q.roadBlocker || q.structure === 'cattails') && dist(q, p) < 48,
          );
        const cattails = z.props
          .filter((p) => p.structure === 'cattails')
          .sort((a, b) => a.id.localeCompare(b.id));
        for (const [j, plant] of cattails.entries()) {
          // A minority remains on the authored saturated basin, rather than arbitrary dry upland.
          const saturated = Math.hypot((plant.x - 1430) / 760, (plant.y - 1750) / 600) < 1;
          if (
            !this.blocked(plant.x, plant.y, z.id, 8, true) &&
            (wetDistance(plant) < 85 || (j % 5 === 0 && saturated))
          )
            continue;
          const p = candidates
            .filter((p) => valid(p, plant))
            .sort((a, b) => dist(a, plant) - dist(b, plant))[0];
          if (p) Object.assign(plant, p);
        }
        for (const [j, p] of candidates.entries()) {
          // Leave room below v4's existing 400-prop ceiling for later authored state.
          if (z.props.length >= 380) break;
          if (j % 2 || !valid(p)) continue;
          z.props.push({
            id: 'pt312-bank-' + j,
            ...p,
            r: 0,
            decorative: true,
            structure: j % 4 ? 'reeds' : 'cattails',
            sceneRole: 'seasonal-wetland-bank',
          });
        }
      }
      clearRoadBlockers(z) {
        const oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          for (const house of z.props.filter((p) => p.roadBlocker)) {
            const setback = (house.r || 0) + 175;
            if (this.distanceToRoad(z, house) >= setback) continue;
            const origin = { x: house.x, y: house.y };
            let placed = false;
            for (const radius of [80, 120, 165, 210, 265, 325, 390, 470, 560]) {
              for (let j = 0; j < 24; j++) {
                const angle = (j * Math.PI) / 12,
                  point = {
                    x: origin.x + Math.cos(angle) * radius,
                    y: origin.y + Math.sin(angle) * radius,
                  };
                if (this.distanceToRoad(z, point) < setback) continue;
                if (this.blocked(point.x, point.y, z.id, (house.r || 0) + 9, true)) continue;
                if (z.npcs.some((n) => dist(n, point) < (house.r || 0) + 80)) continue;
                if (z.nodes.some((n) => dist(n, point) < (house.r || 0) + 60)) continue;
                if (z.buildings.some((b) => dist(b, point) < (house.r || 0) + 150)) continue;
                if (
                  z.enemies.some(
                    (enemy) =>
                      enemy.hp > 0 && dist(enemy.home || enemy, point) < (house.r || 0) + 145,
                  )
                )
                  continue;
                house.x = point.x;
                house.y = point.y;
                placed = true;
                break;
              }
              if (placed) break;
            }
          }
        } finally {
          this.s.zone = oldZone;
        }
      }
      strongholdCourtyardClearance(z) {
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          this.sideDungeon(z.id) ||
          z.strongholdCourtyardSpacingVersion === 3
        )
          return;
        const before = this.s.zone;
        this.s.zone = z.id;
        try {
          for (const cfg of (R.creatureStrongholds || []).filter((c) => c.region === z.id)) {
            const center = this.creatureStrongholdCenter(z, cfg);
            if (!center) continue;
            const locals = z.props
              .filter((p) => p.stronghold === cfg.id && p.decorative)
              .sort((a, b) => String(a.id).localeCompare(String(b.id)));
            const fixed = [];
            const walls = z.props.filter((p) => p.stronghold === cfg.id && p.r > 0);
            const radiusMax = cfg.defenseStyle === 'fort' ? 135 : 330;
            let currentItem;
            const open = (p) =>
              dist(p, center) <= radiusMax &&
              !this.blocked(p.x, p.y, z.id, 8, true) &&
              this.distanceToRoad(z, p) >= this.roadSetback(currentItem) &&
              !z.npcs.some((n) => dist(n, p) < 78) &&
              !z.nodes.some((n) => n.amount > 0 && dist(n, p) < 60) &&
              !z.buildings.some((b) => dist(b, p) < 140) &&
              !walls.some((w) => dist(w, p) < (w.r || 0) + 40) &&
              !fixed.some((q) => dist(q, p) < 93);
            for (const item of locals) {
              currentItem = item;
              if (cfg.defenseStyle === 'fort' && fixed.length < 5) {
                const [dx, dy] = [
                  [0, 0],
                  [-70, 70],
                  [70, -70],
                  [-70, -70],
                  [70, 70],
                ][fixed.length];
                const plot = { x: center.x + dx, y: center.y + dy };
                if (open(plot)) Object.assign(item, plot);
              }
              if (!open(item)) {
                let candidate = null;
                for (const radius of cfg.defenseStyle === 'fort'
                  ? [65, 100, 127]
                  : [90, 130, 165, 205, 250, 290, 320]) {
                  for (let j = 0; j < 36; j++) {
                    const angle = (j * Math.PI) / 18;
                    const p = {
                      x: center.x + radius * Math.cos(angle),
                      y: center.y + radius * Math.sin(angle),
                    };
                    if (open(p)) {
                      candidate = p;
                      break;
                    }
                  }
                  if (candidate) break;
                }
                if (candidate) Object.assign(item, candidate);
                else if (fixed.length >= 5) {
                  // Preserve the five readable lived-in objects and omit
                  // redundant clutter rather than produce intersecting art.
                  z.props.splice(z.props.indexOf(item), 1);
                  continue;
                }
              }
              fixed.push(item);
            }
          }
          for (const cfg of (R.creatureStrongholds || []).filter((c) => c.region === z.id)) {
            const center = this.creatureStrongholdCenter(z, cfg);
            if (!center) continue;
            const placed = [];
            for (const enemy of z.enemies.filter((e) => e.stronghold === cfg.id)) {
              const valid = (p) =>
                dist(p, center) <= 150 &&
                !this.blocked(p.x, p.y, z.id, 15) &&
                !placed.some((q) => dist(p, q) < 38);
              if (!valid(enemy.home)) {
                const points = [];
                for (const radius of [60, 100, 135, 30])
                  for (let j = 0; j < 24; j++)
                    points.push({
                      x: center.x + radius * Math.cos((j * Math.PI) / 12),
                      y: center.y + radius * Math.sin((j * Math.PI) / 12),
                    });
                const home = points.find(valid);
                if (home) {
                  enemy.home = { ...home };
                  if (enemy.hp > 0 && !enemy.aggro) Object.assign(enemy, home);
                }
              }
              placed.push(enemy.home);
            }
          }
          z.strongholdCourtyardSpacingVersion = 3;
        } finally {
          this.s.zone = before;
        }
      }
      clearNamedRoadMarkers(z) {
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          this.sideDungeon(z.id) ||
          z.landmarkRoadShoulderVersion === 4
        )
          return;
        const previousZone = this.s.zone;
        this.s.zone = z.id;
        try {
          for (const marker of z.npcs.filter(
            (n) =>
              n.kind === 'landmark' &&
              !n.internalSite &&
              !n.id.startsWith('bridge-') &&
              !n.id.startsWith('crossing-') &&
              !n.id.startsWith('thorn-trailhead-'),
          )) {
            const water =
              marker.id === 'mill-pond'
                ? R.terrain[this.regionIndex(z.id)].find((t) => t.r && t.kind === 'water')
                : null;
            const onShore = (p) =>
              !water || (dist(p, water) > water.r && dist(p, water) < water.r + 70);
            if (this.distanceToRoad(z, marker) >= 92 && onShore(marker)) continue;
            const original = { x: marker.x, y: marker.y };
            const candidates = [];
            if (water) {
              // Search the actual bank, not an expanding circle that can
              // leave a pond marker hundreds of units from its water.
              for (const radius of [water.r + 18, water.r + 32, water.r + 48, water.r + 64])
                for (let j = 0; j < 72; j++)
                  candidates.push({
                    x: water.x + Math.cos((j * Math.PI) / 36) * radius,
                    y: water.y + Math.sin((j * Math.PI) / 36) * radius,
                  });
              candidates.sort((a, b) => dist(a, original) - dist(b, original));
            } else {
              for (const radius of [75, 100, 125, 155, 185])
                for (let j = 0; j < 24; j++)
                  candidates.push({
                    x: original.x + Math.cos((j * Math.PI) / 12) * radius,
                    y: original.y + Math.sin((j * Math.PI) / 12) * radius,
                  });
            }
            const selected = candidates.find(
              (p) =>
                !this.blocked(p.x, p.y, z.id, 12, true) &&
                this.distanceToRoad(z, p) >= 95 &&
                onShore(p) &&
                !z.npcs.some((n) => n !== marker && dist(n, p) < 85) &&
                !z.nodes.some((n) => dist(n, p) < 60) &&
                !z.props.some((q) => q.roadBlocker && dist(q, p) < (q.r || 0) + 80),
            );
            if (selected) Object.assign(marker, selected);
          }
          z.landmarkRoadShoulderVersion = 4;
        } finally {
          this.s.zone = previousZone;
        }
      }
      townVisualClearance(z) {
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          this.sideDungeon(z.id) ||
          z.townVisualClearanceVersion === 3
        )
          return;
        const previousZone = this.s.zone;
        this.s.zone = z.id;
        try {
          const i = this.regionIndex(z.id);
          const centers = [D.towns[i], D.minors[i]].map(([x, y]) => ({ x, y }));
          const houses = z.props
            .filter(
              (p) =>
                p.roadBlocker &&
                /house|cottage|workshop|boathouse|smithy|forgehouse/.test(p.structure || ''),
            )
            .sort((a, b) => String(a.id).localeCompare(String(b.id)));
          const fixed = [];
          const houseSet = new Set(houses);
          const services = Object.values(R.serviceOffsets).map(([x, y]) => ({
            x: D.towns[i][0] + x,
            y: D.towns[i][1] + y,
          }));
          // Existing rescued specialists may be absent from the current zone.
          // Keep their eventual staffed plots free on every save, not only
          // after an instructor/blacksmith is rescued.
          const clearance = (point, house) => {
            if (this.blocked(point.x, point.y, z.id, 46, true)) return false;
            if (this.distanceToRoad(z, point) < this.roadSetback(house)) return false;
            if (services.some((n) => dist(point, n) < 165)) return false;
            if (z.npcs.some((n) => dist(n, point) < (n.kind === 'landmark' ? 165 : 135)))
              return false;
            if (z.nodes.some((n) => dist(n, point) < 110)) return false;
            if (z.buildings.some((b) => dist(b, point) < 235)) return false;
            if (z.enemies.some((e) => e.hp > 0 && dist(e.home || e, point) < 195)) return false;
            const touching = (other) => {
              if (other === house || other.roadTrace || other.structure === 'road-ruts')
                return false;
              const solid =
                other.roadBlocker ||
                /house|cottage|workshop|forge|boathouse|smithy|barracks|hall|tower|tent|palisade|shelter|watchpost|large-tree/.test(
                  other.structure || '',
                );
              if (solid) {
                // Compare actual projected centers. Two roofs can overlap on
                // screen even when their world-space circles do not collide.
                const projectedX = (point.x - point.y - other.x + other.y) * 0.76;
                const projectedY = (point.x + point.y - other.x - other.y) * 0.27;
                return Math.abs(projectedX) < 145 && Math.abs(projectedY) < 104;
              }
              return dist(point, other) < (other.r || 0) + 65;
            };
            return !fixed.some(touching) && !z.props.some((p) => !houseSet.has(p) && touching(p));
          };
          // Prefer the town rear and lateral plots; do not squeeze another
          // building onto the main street simply because the anchor is legal.
          for (const house of houses) {
            const base = { x: house.x, y: house.y };
            if (clearance(base, house)) {
              fixed.push(house);
              continue;
            }
            const center = centers.slice().sort((a, b) => dist(a, base) - dist(b, base))[0];
            const outward =
              dist(base, center) > 5
                ? Math.atan2(base.y - center.y, base.x - center.x)
                : -Math.PI / 2;
            let found = null;
            for (const radius of [
              110, 180, 260, 350, 450, 570, 700, 840, 980, 1150, 1350, 1550, 1800,
            ]) {
              for (let j = 0; j < 32; j++) {
                const fan = j === 0 ? 0 : Math.ceil(j / 2) * (j % 2 ? 1 : -1);
                const angle = outward + (fan * Math.PI) / 16;
                const point = {
                  x: base.x + Math.cos(angle) * radius,
                  y: base.y + Math.sin(angle) * radius,
                };
                if (!clearance(point, house)) continue;
                found = point;
                break;
              }
              if (found) break;
            }
            if (found) Object.assign(house, found);
            fixed.push(house);
          }
          // Paths terminate at the final door frontage, after roof reflow.
          z.footpaths = [];
          if (z.id === 'vale') {
            const houses = z.props.filter(
              (p) =>
                /vale-cottage/.test(p.structure || '') &&
                dist(p, { x: D.towns[0][0], y: D.towns[0][1] }) < 650,
            );
            for (const house of houses) {
              const near = this.nearestRoadPoint(z, house);
              if (!near || dist(near, house) < 155) continue;
              const angle = Math.atan2(near.y - house.y, near.x - house.x),
                door = { x: house.x + Math.cos(angle) * 100, y: house.y + Math.sin(angle) * 100 },
                path = this.route(near, door);
              if (path.length) z.footpaths.push([near, ...path]);
            }
          }
          z.townVisualClearanceVersion = 3;
        } finally {
          this.s.zone = previousZone;
        }
      }
      distanceToRoad(z, point) {
        let nearest = Infinity;
        for (const path of z.roads || [])
          for (let j = 1; j < path.length; j++)
            nearest = Math.min(nearest, this.distanceToSegment(point, path[j - 1], path[j]));
        return nearest;
      }
      roadSetback(p) {
        if (p.stronghold && p.r > 0) return 85;
        if (p.roadTrace) return 0; // Only deliberately flat road ruts/repairs.
        // Building anchors sit below much of their painted roof; reserve more
        // than the collision circle so rooftops do not cover carriageways.
        if (p.roadBlocker) return (p.r || 0) + 175;
        if (
          /house|cottage|workshop|forge|watchpost|tower|tent|stockade|wall|barracks|gate|roost|lean-to|palisade|foundation|shelter|stable|mangrove|dead-tree/i.test(
            p.structure || '',
          )
        )
          return Math.max((p.r || 0) + 125, 165);
        if (/market|stall|field-kitchen/i.test(p.structure || '')) return 135;
        if (p.r > 0) return p.r + 64;
        return 72;
      }
      clearStreetCorridors(z) {
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          this.sideDungeon(z.id) ||
          z.streetClearanceVersion === 3
        )
          return;
        const oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          const i = this.regionIndex(z.id),
            major = { x: D.towns[i][0], y: D.towns[i][1] },
            minor = { x: D.minors[i][0], y: D.minors[i][1] };
          // Reposition the two refuge buildings: the canonical settlement
          // coordinates are STREET SQUARES, not house footprints.
          const frontages = [
            ['rest', 190],
            ['minor', 180],
            ['board', 95],
            ['supplier', 92],
            ['recruiter', 92],
          ];
          const nearEnemyHome = (p, radius) =>
            z.enemies.some((enemy) => enemy.hp > 0 && dist(enemy.home || enemy, p) < radius);
          const canPlace = (p, item, setback) => {
            // The world coordinate is the building anchor, not its outer wall.
            // Refuge artwork must fit inside map edges at its actual scale.
            if (['rest', 'minor'].includes(item.id)) {
              const size = D.regions[i].size;
              if (Math.min(p.x, p.y, size - p.x, size - p.y) < 115) return false;
            }
            if (this.blocked(p.x, p.y, z.id, Math.max(12, (item.r || 0) + 9), true)) return false;
            if (this.distanceToRoad(z, p) < setback) return false;
            if (
              z.props.some(
                (other) =>
                  other !== item &&
                  dist(other, p) <
                    Math.max(
                      other.ironrootDistrict ? 85 : other.regionalDistrict ? 65 : 0,
                      (other.r || 0) + (item.r || 0) + (other.decorative ? 26 : 29),
                    ),
              )
            )
              return false;
            if (
              z.npcs.some(
                (other) =>
                  other !== item &&
                  dist(other, p) <
                    Math.max(
                      96,
                      (['rest', 'minor'].includes(other.id) ? 82 : 42) +
                        (['rest', 'minor'].includes(item.id) ? 36 : 0),
                    ),
              )
            )
              return false;
            // A shifted solid must not block existing patrol homes, ranged
            // engagement lanes, or the mandatory clear approach to a boss.
            if ((item.r || 0) > 0 && nearEnemyHome(p, (item.r || 0) + 145)) return false;
            return (
              !z.nodes.some((node) => dist(node, p) < (item.r || 0) + 55) &&
              !z.buildings.some((building) => building !== item && dist(building, p) < 165)
            );
          };
          const moveOffRoad = (item, setback) => {
            if (this.distanceToRoad(z, item) >= setback) return true;
            const base = { x: item.x, y: item.y },
              center = dist(base, major) <= dist(base, minor) ? major : minor;
            // Prefer moving outward into a frontage plot, retaining the
            // object's original street/district and deterministic identity.
            const outward =
              dist(base, center) > 10
                ? Math.atan2(base.y - center.y, base.x - center.x)
                : -Math.PI * 0.75;
            for (const radius of [55, 85, 115, 145, 180, 220, 270, 320, 380, 430, 480]) {
              for (let j = 0; j < 24; j++) {
                const fan = j === 0 ? 0 : Math.ceil(j / 2) * (j % 2 ? 1 : -1);
                const angle = outward + (fan * Math.PI) / 12,
                  p = {
                    x: base.x + Math.cos(angle) * radius,
                    y: base.y + Math.sin(angle) * radius,
                  };
                if (!canPlace(p, item, setback)) continue;
                item.x = p.x;
                item.y = p.y;
                return true;
              }
            }
            return false;
          };
          // Saved/player-built barracks are large buildings too. Relocate
          // a historical barracks before placing town services so neither
          // building encroaches on the newly planned right-of-way.
          for (const building of z.buildings) moveOffRoad(building, 175);
          for (const [id, setback] of frontages) {
            const npc = z.npcs.find((n) => n.id === id);
            if (!npc) continue;
            // Services retain their original playable squares even though
            // their buildings/stands occupy neighboring frontage parcels.
            if (id === 'rest') npc.servicePoint = { ...major };
            if (id === 'minor') npc.servicePoint = { ...minor };
            moveOffRoad(npc, setback);
          }
          // Generated forest obstacles must not invade the immediate living
          // and firing space of established ranged monster homes. Named habitat
          // architecture is untouched; only anonymous random trees are thinned.
          const rangedHomes = z.enemies
            .filter((enemy) => enemy.hp > 0 && (enemy.ranged || enemy.hybrid))
            .map((enemy) => enemy.home || enemy);
          z.props = z.props.filter(
            (p) =>
              !String(p.id || '').startsWith('forest-') ||
              !rangedHomes.some((home) => dist(p, home) < (p.r || 0) + 70),
          );
          // Full corridor audit, not only collision-bearing props: market
          // stalls, carts, heaps, decorative houses and trees are visual
          // obstacles too. Keep every ID/scene role; move, do not erase.
          const affected = z.props
            .filter((p) => !p.roadTrace)
            .filter((p) => this.distanceToRoad(z, p) < this.roadSetback(p))
            .sort((a, b) => (b.r || 0) - (a.r || 0) || a.id.localeCompare(b.id));
          for (const prop of affected) moveOffRoad(prop, this.roadSetback(prop));
          z.streetClearanceVersion = 3;
        } finally {
          this.s.zone = oldZone;
        }
      }
      millhavenOnboardingLayout(z) {
        const cfg = R.millhavenOnboarding;
        if (z.id !== 'vale' || z.millhavenOnboardingVersion === cfg.version) return;
        const by = (id) => z.npcs.find((n) => n.id === id),
          captain = by('recruiter'),
          supplier = by('supplier'),
          refuge = by('rest'),
          orchard = by('minor'),
          house = z.props.find((p) => p.id === cfg.refugeHouse),
          workshop = z.props.find((p) => p.id === cfg.orchardHouse);
        if (![captain, supplier, refuge, orchard, house, workshop].every(Boolean)) return;
        const point = (p) => ({ x: p.x, y: p.y }),
          swap = (a, b) => {
            const old = point(a);
            Object.assign(a, point(b));
            Object.assign(b, old);
          };
        swap(captain, supplier);
        swap(refuge, house);
        // Reuse an existing western orchard home plot rather than placing a
        // recovery house among the eastern Goblins or across a hostile fort.
        swap(orchard, workshop);
        refuge.servicePoint = {
          x: refuge.x + cfg.refugeDoorOffset.x,
          y: refuge.y + cfg.refugeDoorOffset.y,
        };
        orchard.servicePoint = { ...cfg.orchardDoor };
        z.millhavenOnboardingVersion = cfg.version;
        if (this.s.refugeSite?.zone === z.id) {
          const site = by(this.s.refugeSite.id);
          if (site?.kind === 'rest')
            Object.assign(this.s.refugeSite, site.servicePoint || point(site));
        }
        // Replace only paths to moved homes. Keep IDs, towns, roads, enemies,
        // all other scenery and player-built camps intact on old and new runs.
        const moved = [house, workshop, refuge, orchard];
        z.footpaths = (z.footpaths || []).filter(
          (path) => !path.some((p) => moved.some((home) => dist(p, home) < 160)),
        );
        for (const site of [refuge, house, workshop]) {
          const near = this.nearestRoadPoint(z, site),
            door = site.servicePoint || point(site);
          if (near) z.footpaths.push([near, ...this.route(near, door)]);
        }
        const trail = [...cfg.orchardTrail, orchard.servicePoint];
        const footpath = [trail[0]];
        for (let i = 1; i < trail.length; i++) footpath.push(...this.route(trail[i - 1], trail[i]));
        z.footpaths.push(footpath);
      }
      reedportRefugeSpacing(z) {
        if (z.id !== 'march' || z.reedportRefugeSpacingVersion === 1) return;
        // Keep the refuge frontage open. These are decorative town services,
        // not deleted objects or changes to player buildings/enemy territory.
        const layout = {
          'aesthetic-town-0': [150, 1600],
          'aesthetic-town-5': [600, 1550],
          'aesthetic-town-7': [80, 1680],
          'aesthetic-town-99': [300, 1750],
        };
        for (const [id, [x, y]] of Object.entries(layout)) {
          const p = z.props.find((p) => p.id === id);
          if (p) Object.assign(p, { x, y });
        }
        const recruiter = z.npcs.find((n) => n.id === 'recruiter');
        if (recruiter) Object.assign(recruiter, { x: 650, y: 800 });
        z.reedportRefugeSpacingVersion = 1;
      }
      // Combat-only low-spec world. The campaign terrain generator never runs here.
      arenaStages() {
        const stages = [{ id: 'hub', label: 'Safe hub · specialists', region: 0, kind: 'hub' }];
        for (const [region, r] of D.regions.entries()) {
          stages.push({ id: r.id + '-ordinary', label: r.name + ' · ordinary enemies', region, kind: 'ordinary' });
          stages.push({ id: r.id + '-guardians', label: r.name + ' · guardians and captain', region, kind: 'guardians' });
          if (r.id === 'march' || r.id === 'frontier')
            stages.push({ id: r.id + '-night', label: r.name + ' · night enemies', region, kind: 'night' });
          for (const boss of D.bosses.filter((b) => b.region === r.id)) {
            stages.push({ id: 'boss-' + boss.id, label: r.name + ' · ' + boss.name + ' · Regular', region, kind: 'boss', boss: boss.id, form: 'normal' });
            stages.push({ id: 'boss-' + boss.id + '-true', label: r.name + ' · ' + boss.name + ' · TRUE', region, kind: 'boss', boss: boss.id, form: 'true' });
          }
        }
        return stages;
      }
      arenaZone() {
        const old = this.s.zones.arena;
        // Extremely hot: zone() is used by every combat and draw step. Do not
        // rebuild the catalog of stage objects when the actor roster is unchanged.
        if (old?.arenaStage === this.s.arenaStage) return old;
        const stage = this.arenaStages().find((s) => s.id === this.s.arenaStage) || this.arenaStages()[0];
        const z = {
          id: 'arena', arenaStage: stage.id, enemies: [], props: [], npcs: [],
          buildings: [], nodes: [], packTimers: {}, clock: 0,
        };
        this.s.zones.arena = z;
        z.npcs.push({ id: 'arena-guide', kind: 'arena-guide', name: 'Arena Guide',
          x: stage.kind === 'hub' ? 900 : 520,
          y: stage.kind === 'hub' ? 1080 : 870, icon: '🧭' });
        const spawn = (def, x, y, options = {}) => {
          const enemy = this.makeEnemy(def, { x, y });
          // Native AI/combat, but no campaign rewards, victories or unlocks.
          // Temporary encounter fixture, not a "summon": that flag changes
          // real enemy AI, ranged roles, leashes and tactical support.
          enemy.arenaFixture = true;
          enemy.pack = options.pack || 'arena-' + stage.id;
          Object.assign(enemy, options);
          z.enemies.push(enemy);
          return enemy;
        };
        const region = D.regions[stage.region], species = D.species[stage.region];
        if (stage.kind === 'hub') {
          for (const [i, boss] of D.bosses.filter((b) => b.captive && b.id !== 'darklord').entries()) {
            // Wide service rows keep names readable and leave a direct walking
            // corridor from the entry to the Guide, Trainer and recovery.
            z.npcs.push({
              id: 'arena-specialist-' + boss.id,
              kind: R.teachers[boss.id] ? 'teacher' : boss.id === 'archive' ? 'alchemist' : 'smith',
              family: boss.id, name: boss.captive,
              x: 1120 + (i % 4) * 245,
              y: 640 + Math.floor(i / 4) * 320, icon: '👤',
            });
          }
          z.npcs.push({
            id: 'arena-level-trainer',
            kind: 'arena-level-trainer',
            name: 'Level Trainer',
            x: 730, y: 995,
            icon: '⭐',
          });
          z.npcs.push({ id: 'arena-recovery', kind: 'arena-recovery', name: 'Free recovery', x: 810, y: 1320, icon: '💚' });
        } else if (stage.kind === 'ordinary' || stage.kind === 'guardians') {
          const guardian = stage.kind === 'guardians';
          // Native campaign HP/damage values, not new arena balance math.
          const hp = 65 + stage.region * 105, damage = 7 + stage.region * 8;
          for (let i = 0; i < (guardian ? 3 : 4); i++) {
            const sp = species[i % species.length];
            const e = spawn({
              species: sp[0], name: sp[1] + (guardian ? ' guardian' : ''), icon: sp[2],
              level: stage.region * 3 + 1 + (guardian ? 1 : 0),
              hp, damage,
              gold: 0, xp: 0,
            }, 1400 + (i % 2) * 250, 830 + Math.floor(i / 2) * 350, {
              pack: 'arena-' + stage.id + '-' + Math.floor(i / 2),
              ...(guardian ? { guard: true, guardianBalanceVersion: 2 } : {}),
            });
            this.configureEnemy(e, i);
          }
          if (guardian) {
            const id = stage.region === 3 ? 'frontier-overseer' : 'supply-' + region.id;
            const profile = R.roomCaptains?.[id];
            if (profile) {
              const sp = species[0];
              const e = spawn({
                species: profile.species || sp[0], name: profile.name, icon: sp[2],
                level: stage.region * 3 + 2,
                hp: hp * 2, damage: damage * 1.25,
                gold: 0, xp: 0,
              }, 1900, 1050, {
                captain: true, captainProfile: id, captainMentor: profile.mentor,
                captainVisualIdol: profile.visualIdol || profile.mentor,
                visualScale: profile.visualScale || 1.16, specialCd: 0,
                ...(id === 'frontier-overseer' ? { fieldCaptain: true, fieldCaptainVersion: 1 } :
                    { roomCaptain: true, roomGuard: true, guard: true, roomCaptainVersion: 1 }),
              });
              this.configureEnemy(e, 3);
            }
          }
        } else if (stage.kind === 'night') {
          // Native night-enemy variants, on demand instead of timed world spawns.
          const id = region.id === 'march' ? 'wraith' : 'stalker';
          const cfg = R.nightEnemyCombat[id];
          for (let i = 0; i < 2; i++) {
            const e = spawn({
              species: id,
              name: region.id === 'march' ? 'Lantern wraith' : 'Ash stalker',
              icon: '👻',
              level: stage.region * 3 + 2,
              hp: Math.round((120 + stage.region * 100) * cfg.hp),
              damage: Math.round((12 + stage.region * 7) * cfg.damage),
              gold: 0, xp: 0,
            }, 1450 + i * 260, 900 + i * 300, {
              nightOnly: true, nightBalanceVersion: 1, specialCd: 1 + i * 0.35,
            });
            this.configureEnemy(e, i);
          }
        } else if (stage.kind === 'boss') {
          const boss = this.boss(stage.boss);
          if (boss) {
            const enemy = this.bossEnemy(boss, stage.form || 'normal', { x: 1770, y: 1080 });
            enemy.arenaFixture = true;
            enemy.pack = 'arena-' + stage.id;
            z.enemies.push(enemy);
            if (boss.id !== 'darklord')
              for (let i = 0; i < 2; i++) {
                const sp = species[i % species.length];
                const e = spawn({
                  species: sp[0], name: sp[1] + ' guardian', icon: sp[2],
                  level: Math.max(1, boss.level - 1), hp: 65 + stage.region * 105,
                  damage: 7 + stage.region * 8, gold: 0, xp: 0,
                }, 1510, 770 + 600 * i, { guard: true, guardianBalanceVersion: 2 });
                this.configureEnemy(e, i);
              }
          }
        }
        return z;
      }
      arenaContainActors() {
        if (this.s.mode !== 'arena') return;
        const size = this.zoneSize(),
          actors = [this.hero, ...this.s.party, ...this.zone().enemies];
        for (const actor of actors) {
          if (!Number.isFinite(actor.x) || !Number.isFinite(actor.y)) continue;
          // Navigation.move() samples with a minimum 15px segment radius.
          // Clamping a 14px hero only by actorRadius would leave its center
          // one pixel outside that segment and trap *both* movement directions.
          const radius = Math.max(15, this.actorRadius(actor)),
            low = 40 + radius, high = size - 40 - radius;
          actor.x = Math.max(low, Math.min(high, actor.x));
          actor.y = Math.max(low, Math.min(high, actor.y));
        }
      }
      arenaSelectStage(id) {
        if (this.s.mode !== 'arena' || !this.arenaStages().some((s) => s.id === id)) return false;
        this.clearEncounterUnits();
        this.clearPartyCharges();
        this.s.arenaStage = id;
        this.s.arenaRegion = this.arenaStages().find((s) => s.id === id).region;
        this.s.pending = {};
        this.s.projectiles = [];
        this.s.hazards = [];
        this.s.heroTarget = null;
        this.hero.order = null;
        this.hero.x = id === 'hub' ? 650 : 700;
        this.hero.y = id === 'hub' ? 1070 : 1060;
        for (const [i, member] of this.s.party.entries()) {
          member.x = 600 + i * 110;
          member.y = 1170;
          member.order = null;
        }
        delete this.s.zones.arena;
        this.zone();
        // Stay within the v4 save contract (mercyTime: 0–10 seconds).
        this.s.mercyTime = 10;
        this.say('Arena destination: ' + this.arenaStages().find((s) => s.id === id).label);
        return true;
      }
      arenaLevelUp() {
        if (this.s.mode !== 'arena' || this.hero.level >= 10000 || this.hero.hp <= 0)
          return false;
        // One interaction = one real XP threshold and exactly one level-up.
        // The existing progression system awards HP, talent points, and notices.
        const oldLevel = this.hero.level;
        this.xp(this.xpRequired() - this.hero.xp);
        return this.hero.level === oldLevel + 1;
      }
      arenaRest() {
        if (this.s.mode !== 'arena') return false;
        this.clearTonic();
        this.hero.hp = this.hero.maxHp;
        this.hero.mp = this.hero.maxMp;
        this.hero.slow = 0;
        this.hero.supportEffects = [];
        this.s.party.forEach((u) => {
          u.hp = u.maxHp;
          u.supportEffects = [];
          u.order = null;
        });
        return true;
      }
      arenaBuildBarracks() {
        if (this.s.mode !== 'arena') return null;
        const z = this.zone();
        if (z.buildings.length >= 4) return z.buildings[z.buildings.length - 1];
        const b = {
          id: 'arena-barracks-' + this.s.nextId++,
          kind: 'barracks', name: 'Arena Barracks', icon: '🏗️',
          theme: 'vale', x: Math.min(1850, this.hero.x + 110), y: this.hero.y,
          progress: 4, full: true, queue: 0, queueType: null,
          upgradeProgress: 0, upgradePaid: true, interactionOnly: true,
        };
        z.buildings.push(b);
        return b;
      }
      zone() {
        if (this.s.mode === 'arena') return this.arenaZone();
        if (this.s.zones[this.s.zone]) {
          const z = this.s.zones[this.s.zone];
          // Keep authored generation/migrations on their established geometry.
          // Enable the scoped traversal correction only on the finished scene.
          this.setSceneryTraversal(z, false);
          this.dungeonSpaceLayout(z);
          if (!this.isDungeon()) {
            this.regionalDestinations(z);
            this.roadNetwork(z);
          }
          this.authoredPlaces(z);
          this.clearStreetCorridors(z);
          this.regionalTravelSafety(z);
          this.environmentCoherence(z);
          this.clearNamedRoadMarkers(z);
          this.townVisualClearance(z);
          // Environment coherence adds bridge approaches and clears their roads.
          // Space the lived-in courtyard after those final scenic relocations.
          this.strongholdCourtyardClearance(z);
          this.reedportRefugeSpacing(z);
          this.millhavenOnboardingLayout(z);
          this.interiorCoherence(z);
          this.defenderEncounterLayout(z);
          this.frontierEdgeRedistribution(z);
          this.frontierSceneComposition(z);
          this.crownSceneComposition(z);
          this.highlandsLandscape(z);
          this.syncThornArrival(z);
          this.setSceneryTraversal(z);
          return z;
        }
        const i = this.regionIndex(),
          r = D.regions[i],
          dungeon = this.isDungeon(),
          id = this.s.zone;
        const z = {
          id,
          ...(id === 'highlands' ? { appalachianSourceVersion: 1 } : {}),
          enemies: [],
          props: [],
          npcs: [],
          buildings: [],
          nodes: [],
          packTimers: {},
          clock: 0,
        };
        this.s.zones[id] = z;
        if (R.dungeonSpace?.[id]) z.dungeonSpaceVersion = R.dungeonSpace[id].version;
        const room = this.supplyRoom();
        if (room) {
          z.room = true;
          z.treasury = room.boss;
          z.npcs.push({
            id: 'exit',
            name: 'Leave ' + room.name,
            kind: 'exit',
            ...R.treasuryEntry.exit,
            icon: '🚪',
          });
          const cacheSpots = R.treasuryCacheSpots?.[id] || [
            [650, 365],
            [720, 690],
            [545, 760],
          ];
          for (let j = 0; j < room.count; j++) {
            const [x, y] = cacheSpots[j];
            const p = this.safe(x, y, id);
            z.npcs.push({
              id: 'bundle-' + j,
              name: room.name + ' cache ' + (j + 1),
              kind: 'bundle',
              index: j,
              ...p,
              icon: '📦',
            });
          }
          if (!this.peace) {
            const i = this.regionIndex(),
              r = D.regions[i],
              sp = D.species[i][0],
              gold = this.regionalEnemyRewards(i, 'roomGuard').gold,
              captainProfile = R.roomCaptains?.[id],
              authored = R.treasuryGuardFormations?.[id],
              posts =
                authored ||
                [
                  [320, 340],
                  [530, 360],
                  [590, 655],
                  [745, 590],
                ].map(([x, y], j) => ({ x, y, captain: j === 3 }));
            for (const [j, slot] of posts.entries()) {
              const captain = !!slot.captain && !!captainProfile,
                p = this.safe(slot.x, slot.y, id),
                e = this.makeEnemy(
                  {
                    species: sp[0],
                    name: captain ? captainProfile.name : slot.name || sp[1] + ' treasury guard',
                    icon: sp[2],
                    level: i * 3 + 2,
                    hp: (65 + i * 105) * (captain ? 2 : 1),
                    damage: (7 + i * 8) * (captain ? 1.25 : 1),
                    gold,
                    xp: this.regionalEnemyRewards(i, 'roomGuard').xp,
                  },
                  p,
                );
              e.guard = true;
              e.roomGuard = true;
              e.mountedCrownRider = !!slot.mountedCrownRider;
              if (e.mountedCrownRider) {
                e.crownTroop = true;
                e.crownAncestry = 'wolf';
              }
              e.pack = id + '-' + (slot.group || 'guard-' + j);
              if (slot.role) e.forcedRole = slot.role;
              if (captain) {
                e.captain = true;
                e.roomCaptain = true;
                e.captainProfile = id;
                e.captainMentor = captainProfile.mentor;
                e.captainVisualIdol = captainProfile.visualIdol || captainProfile.mentor;
                e.visualScale = captainProfile.visualScale || 1.16;
                e.specialCd = 1.25;
                e.roomCaptainVersion = 1;
              }
              this.configureEnemy(e, j);
              z.enemies.push(e);
            }
          }
          this.treasuryInterior(z);
          this.treasuryGuardPopulation(z);
          this.guardianPopulation(z);
          this.roomCaptainPopulation(z);
          this.interiorCoherence(z);
          this.defenderEncounterLayout(z);
          return z;
        }
        const side = this.sideDungeon();
        if (side) {
          z.sideDungeon = side.id;
          z.npcs.push({
            id: 'exit',
            name: 'Leave ' + side.name,
            kind: 'exit',
            sideExit: true,
            x: 120,
            y: 150,
            icon: '🚪',
          });
          this.ensureCriticalCodex(z);
          for (const [j, [x, y, structure]] of (side.decor || []).entries())
            z.props.push({ id: 'side-decor-' + j, x, y, r: 0, decorative: true, structure });
          for (const [j, [x, y, radius]] of (side.walls || []).entries())
            z.props.push({
              id: 'side-wall-' + j,
              x,
              y,
              r: radius || 28,
              structure: 'pillar',
              sideDungeon: side.id,
            });
          if (!this.peace) {
            const species = D.species[i],
              preferred = species.find((s) => s[0] === side.species) || species[0],
              positions = [
                [245, 325],
                [355, 390],
                [735, 320],
                [845, 390],
                [250, 690],
                [365, 755],
                [700, 690],
                [830, 760],
                [515, 285],
                [560, 520],
                [520, 800],
                [290, 520],
                [780, 525],
                [565, 900],
                [890, 615],
                [190, 820],
              ];
            for (let j = 0; j < side.enemyCount; j++) {
              const sp = preferred,
                raw = positions[j % positions.length],
                p = this.safe(raw[0], raw[1], side.id),
                pack = Math.floor(j / 3),
                e = this.makeEnemy(
                  {
                    species: sp[0],
                    name: sp[1] + ' resident',
                    icon: sp[2],
                    level: Math.max(1, i * 3 + (pack % 2) + 1),
                    hp: 65 + i * 105,
                    damage: 7 + i * 8,
                    gold: this.regionalEnemyRewards(i).gold,
                    xp: this.regionalEnemyRewards(i).xp,
                  },
                  p,
                );
              e.pack = side.id + '-pack-' + pack;
              e.sideDungeon = true;
              this.configureEnemy(e, j);
              z.enemies.push(e);
            }
            this.ordinaryMeleePopulation(z);
            this.ordinaryRangedPopulation(z);
          }
          z.sideDungeonVersion = 1;
          this.interiorCoherence(z);
          this.defenderEncounterLayout(z);
          return z;
        }
        const region = r.id,
          bosses = D.bosses.filter((b) => b.region === region),
          field = bosses.find((b) => b.kind === 'field'),
          boss = dungeon ? this.boss(id) : field;
        if (dungeon) {
          z.npcs.push(
            {
              id: 'exit',
              name: 'Return to ' + r.name,
              kind: 'exit',
              ...(R.interiorEncounterLayout?.[id]?.entry ||
                R.dungeonSpace?.[id]?.exit || { x: 160, y: 240 }),
              icon: '🚪',
            },
            {
              id: 'cage-' + boss.id,
              name: boss.captive,
              kind: 'cage',
              family: boss.id,
              ...(R.dungeonSpace?.[id]?.captive || { x: 1200, y: 1270 }),
              icon: '🔒',
            },
          );
          if (id === 'citadel')
            z.npcs.push({
              id: 'fountain',
              name: 'Preparation fountain',
              kind: 'fountain',
              x: 430,
              y: 370,
              icon: '⛲',
            });
        } else {
          const [x, y] = D.towns[i],
            minor = D.minors[i];
          z.npcs.push(
            {
              id: 'supplier',
              name: r.town + ' Supplies',
              kind: 'supplier',
              x: x + 85,
              y: y - 40,
              icon: '🛒',
            },
            {
              id: 'recruiter',
              name: r.town + ' Captain',
              kind: 'recruiter',
              x: x - 80,
              y: y + 60,
              icon: '👥',
            },
            {
              id: 'board',
              name: r.town + ' Quest board',
              kind: 'quests',
              x: x + 70,
              y: y + 95,
              icon: '📜',
            },
            { id: 'rest', name: r.town + ' Refuge', kind: 'rest', x, y, icon: '🏠' },
            { id: 'minor', name: r.minor, kind: 'rest', x: minor[0], y: minor[1], icon: '🏡' },
          );
          const [px, py] = D.ports[i],
            outboundIcon = ['🐎', '⛵', '🐫', '🐉'][i] || '🛣️',
            returnIcon = ['', '🐎', '⛵', '🐫', '🐉'][i] || '🛣️';
          if (i < D.regions.length - 1)
            z.npcs.push({
              id: 'outbound',
              name: r.transport + ' to ' + D.regions[i + 1].name,
              kind: 'transport',
              direction: 1,
              x: px,
              y: py,
              icon: outboundIcon,
            });
          if (i > 0)
            z.npcs.push({
              id: 'return',
              name: 'Return to ' + D.regions[i - 1].name,
              kind: 'transport',
              direction: -1,
              x: x + 120,
              y: y + 150,
              icon: returnIcon,
            });
          const db = bosses.find((b) => b.kind === 'dungeon'),
            [ex, ey] = D.entrances[i];
          z.npcs.push({
            id: 'entrance',
            name: db.place,
            kind: 'dungeon',
            family: db.id,
            x: ex,
            y: ey,
            icon: '🏛️',
          });
          const { x: fx, y: fy } = this.fieldCenter(i);
          z.npcs.push({
            id: 'cage-' + field.id,
            name: field.captive,
            kind: 'cage',
            family: field.id,
            x: fx + 90,
            y: fy + 80,
            icon: '🔒',
          });
          for (let j = 0; j < 3; j++) {
            const p = this.safe(minor[0] + 150 + j * 70, minor[1] + 160 + j * 90);
            z.npcs.push({
              id: 'bundle-' + j,
              name: 'Quest supplies ' + (j + 1),
              kind: 'bundle',
              index: j,
              ...p,
              icon: '📦',
            });
          }
          const landmarks = [...D.entrances[i], ...D.ports[i]];
          for (let j = 0; j < 3; j++) {
            const p = this.safe(
              j === 0 ? minor[0] + 150 : j === 1 ? fx - 150 : ex - 180,
              j === 0 ? minor[1] + 40 : j === 1 ? fy + 180 : ey + 100,
            );
            z.npcs.push({
              id: 'landmark-' + j,
              name: ['Regional monument', 'Wildland lookout', 'Ancient ruins'][j],
              kind: 'landmark',
              ...p,
              icon: ['🗿', '🏕️', '🏚️'][j],
            });
          }
          // Regional companion labor is authored later as distributed Dark Lord Tribute; no generic bootstrap node.
          for (const [patch, [cx, cy, rx, ry]] of R.forests[i].entries())
            for (let k = 0; k < 45; k++) {
              const angle = k * 2.3999632297,
                radius = Math.sqrt((k + 0.5) / 45),
                x = cx + Math.cos(angle) * rx * radius,
                y = cy + Math.sin(angle) * ry * radius;
              if (
                z.npcs.some((n) => dist(n, { x, y }) < 150) ||
                dist({ x, y }, { x: fx, y: fy }) < 200 ||
                this.blocked(x, y, id, 50)
              )
                continue;
              z.props.push({
                id: 'forest-' + patch + '-' + k,
                x,
                y,
                r: 24,
                icon: i === 4 ? '🪨' : i === 3 ? '🌳' : k % 5 === 0 ? '🪨' : '🌲',
              });
            }
        }
        const count = dungeon ? this.dungeonGuardCount(id) : r.enemy_count,
          species = D.species[i],
          group = dungeon ? 2 : i < 2 ? 3 : i < 4 ? 4 : 5;
        for (let j = 0; j < count; j++) {
          const pack = Math.floor(j / group),
            g = dungeon ? this.dungeonGuardBlueprint(id, j) : null,
            s = g?.sp || species[pack % species.length],
            size = dungeon ? this.zoneSize(id) : r.size;
          const base = dungeon
            ? { x: g.x, y: g.y }
            : {
                x: 650 + ((pack * 337 + 71 * i) % (size - 900)),
                y: 500 + ((pack * 431 + 137 * i) % (size - 800)),
              };
          let p = this.safe(
            base.x + (dungeon ? 0 : (j % group) * 44),
            base.y + (dungeon ? 0 : ((j % group) % 2) * 50),
          );
          if (
            !dungeon &&
            D.towns.some(([tx, ty], ti) => ti === i && dist(p, { x: tx, y: ty }) < 260)
          )
            p = this.safe(base.x + 350, base.y + 250);
          const e = this.makeEnemy(
            {
              species: s[0],
              name: dungeon ? g.name : s[1],
              icon: s[2],
              level: Math.max(1, i * 3 + (pack % 2) + 1),
              hp: 65 + i * 105,
              damage: 7 + i * 8,
              gold: this.regionalEnemyRewards(i).gold,
              xp: this.regionalEnemyRewards(i, dungeon ? 'guard' : 'ordinary').xp,
            },
            p,
          );
          e.pack = dungeon ? g.pack : id + '-pack-' + pack;
          e.guard = dungeon;
          if (g?.mountedCrownRider) e.mountedCrownRider = true;
          if (g?.role) e.forcedRole = g.role;
          if (dungeon) this.configureEnemy(e, j);
          z.enemies.push(e);
        }
        const point = dungeon ? this.dungeonBossHome(id) : this.fieldCenter(i);
        if (dungeon && this.s.normal[boss.id]) z.enemies = z.enemies.filter((e) => !e.guard);
        if (!this.s.normal[boss.id] || (boss.kind === 'field' && !this.s.pending[boss.id]))
          z.enemies.push(this.bossEnemy(boss, 'normal', point));
        if (!dungeon) {
          const finalBoss = bosses.find((b) => b.kind === 'final'),
            finalReady = !!this.s.rescued.cindermaw && !!this.s.rescued.citadel;
          if (
            finalBoss &&
            finalReady &&
            !this.s.normal[finalBoss.id] &&
            !this.s.pending[finalBoss.id] &&
            !this.s.true[finalBoss.id]
          )
            z.enemies.push(
              this.bossEnemy(finalBoss, 'normal', { x: D.fields[i][0], y: D.fields[i][1] }),
            );
        }
        this.regionalDestinations(z);
        this.roadNetwork(z);
        this.authoredPlaces(z);
        this.migrateThornPatrol(z);
        this.migrateCinderInspection(z);
        this.clearStreetCorridors(z);
        this.regionalTravelSafety(z);
        this.environmentCoherence(z);
        this.clearNamedRoadMarkers(z);
        this.townVisualClearance(z);
        this.strongholdCourtyardClearance(z);
        this.reedportRefugeSpacing(z);
        this.millhavenOnboardingLayout(z);
        this.interiorCoherence(z);
        this.defenderEncounterLayout(z);
        this.refreshNPCs();
        if (this.peace) this.makeHabitat(z);
        this.syncDungeonMasterStation(z);
        this.frontierEdgeRedistribution(z);
        this.frontierSceneComposition(z);
        this.crownSceneComposition(z);
        this.highlandsLandscape(z);
        this.syncThornArrival(z);
        this.setSceneryTraversal(z);
        return z;
      }
      regionalDestinations(z) {
        const destinationVersion = z.id === 'crown' ? 5 : originalDepartureRegion(z.id) ? 4 : 3;
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          z.destinationLayoutVersion === destinationVersion
        )
          return;
        const i = this.regionIndex(z.id),
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          const move = (id, raw) => {
            const n = z.npcs.find((n) => n.id === id);
            if (!n || !raw) return;
            Object.assign(n, this.safe(raw[0], raw[1], z.id));
          };
          move('entrance', D.entrances[i]);
          // Highlands retains its inbound ferry and original distant outbound caravan.
          if (z.id !== 'march') move('outbound', D.ports[i]);
          const rearStand = R.travelArrivalStands?.[z.id];
          if (rearStand) move('return', [rearStand.x, rearStand.y]);
          if (z.id === 'crown') {
            z.npcs = z.npcs.filter((n) => n.id !== 'return' && !n.crownTravelHub);
            for (const route of (R.crownRoutes || []).filter((r) => r.travelHub)) {
              const p = this.safe(route.point[0], route.point[1], z.id),
                hub = route.travelHub;
              z.npcs.push({
                id: 'crown-travel-' + route.id,
                name: hub.name,
                kind: 'transport',
                hub: true,
                crownTravelHub: true,
                routeId: route.id,
                ...p,
                icon: hub.icon || '🛣️',
                interactionOnly: hub.visibleVehicle === false,
              });
            }
          }
          const minor = z.npcs.find((n) => n.id === 'minor');
          if (minor) Object.assign(minor, this.safe(D.minors[i][0], D.minors[i][1], z.id));
          z.destinationLayoutVersion = destinationVersion;
        } finally {
          this.s.zone = oldZone;
        }
      }
      regionalTravelSafety(z) {
        const safetyVersion = originalDepartureRegion(z.id) ? 2 : 1;
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          this.sideDungeon(z.id) ||
          z.travelSafetyVersion === safetyVersion
        )
          return;
        const landingIds =
          {
            vale: ['outbound'],
            march: ['return'],
            highlands: ['return', 'outbound'],
            frontier: ['return', 'outbound'],
            crown: ['crown-travel-frontier-return'],
          }[z.id] || [];
        const landings = landingIds.map((id) => z.npcs.find((n) => n.id === id)).filter(Boolean);
        // Preserve monster numbers and difficulty; just keep their spawn homes away
        // from the actual arrival and its immediately surrounding companion space.
        const previousZone = this.s.zone;
        this.s.zone = z.id;
        try {
          for (const e of z.enemies) {
            if (e.hp <= 0 || e.neutral || e.type === 'boss' || !e.home) continue;
            if (!landings.some((p) => dist(p, e.home) < 295)) continue;
            const nearby = landings.reduce(
              (best, p) => (!best || dist(p, e.home) < dist(best, e.home) ? p : best),
              null,
            );
            const dx = e.home.x - nearby.x;
            const dy = e.home.y - nearby.y;
            const length = Math.hypot(dx, dy) || 1;
            const directions = [
              [dx / length, dy / length],
              [0.8, 0.6],
              [0.6, -0.8],
              [-0.6, 0.8],
            ];
            for (const [ux, uy] of directions) {
              const candidate = this.safe(nearby.x + ux * 435, nearby.y + uy * 435, z.id);
              if (landings.some((p) => dist(p, candidate) < 320)) continue;
              e.home = { ...candidate };
              if (!e.aggro) Object.assign(e, candidate);
              break;
            }
          }
          z.travelSafetyVersion = safetyVersion;
        } finally {
          this.s.zone = previousZone;
        }
      }
      alignLandmarks(z) {
        if (dungeonIds.includes(z.id) || this.supplyRoom(z.id) || z.landmarkLayoutVersion === 3)
          return;
        const i = this.regionIndex(z.id),
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          for (const [id, , x, y] of R.sites[i]) {
            const n = z.npcs.find((n) => n.kind === 'landmark' && n.id === id);
            if (!n) continue;
            const target = this.safe(x, y, z.id),
              dx = target.x - n.x,
              dy = target.y - n.y;
            if (Math.hypot(dx, dy) < 1) continue;
            Object.assign(n, target);
            for (const e of z.enemies.filter((e) => e.site === id && !e.mini)) {
              const q = this.safe(e.home.x + dx, e.home.y + dy, z.id);
              e.home = { ...q };
              if (e.hp > 0 && !e.aggro) Object.assign(e, q);
            }
            for (const b of z.npcs.filter((b) => b.kind === 'bundle' && b.site === id)) {
              const q = this.safe(b.x + dx, b.y + dy, z.id);
              Object.assign(b, q);
            }
          }
          z.landmarkLayoutVersion = 3;
        } finally {
          this.s.zone = oldZone;
        }
      }
      regionalAesthetics(z) {
        const version = originalDepartureRegion(z.id) ? 5 : 4;
        if (dungeonIds.includes(z.id) || this.supplyRoom(z.id) || z.aestheticVersion === version)
          return;
        const i = this.regionIndex(z.id),
          size = D.regions[i].size,
          major = { x: D.towns[i][0], y: D.towns[i][1] },
          minor = { x: D.minors[i][0], y: D.minors[i][1] },
          field = this.fieldCenter(i),
          theme = R.natureThemes[i],
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          z.props = z.props.filter((p) => !String(p.id || '').startsWith('aesthetic-'));
          let serial = 0,
            natureCount = 0;
          const nearRoad = (p, margin = 70) =>
            z.roads?.some((path) =>
              path.some((b, j) => j && this.distanceToSegment(p, path[j - 1], b) < margin),
            );
          const clear = (p, margin = 55) =>
            !this.blocked(p.x, p.y, z.id, 8, true) &&
            !nearRoad(p, margin) &&
            !z.npcs.some((n) => dist(n, p) < 75) &&
            !z.nodes.some((n) => dist(n, p) < 70) &&
            !z.buildings.some((n) => dist(n, p) < 70) &&
            !z.props.some((q) => q.roadBlocker && dist(q, p) < q.r + 45);
          const add = (p, structure, prefix = 'nature') => {
            if (!clear(p, prefix === 'town' ? 48 : 65)) return false;
            z.props.push({
              id: 'aesthetic-' + prefix + '-' + serial++,
              ...p,
              r: 0,
              decorative: true,
              structure,
            });
            return true;
          };
          const townLife = (center, layout, prefix) => {
            for (const [dx, dy, structure] of layout) {
              const original = { x: center.x + dx, y: center.y + dy };
              if (add(original, structure, prefix)) continue;
              // Preserve authored daily-life details when clearer road and roof
              // frontages displace their original coordinates. Search nearby
              // off-road parcels deterministically rather than discarding them.
              let placed = false;
              for (const radius of [45, 80, 115, 150, 185, 225, 270]) {
                for (let j = 0; j < 24; j++) {
                  const angle = (j * Math.PI) / 12;
                  const candidate = {
                    x: original.x + Math.cos(angle) * radius,
                    y: original.y + Math.sin(angle) * radius,
                  };
                  if (
                    z.props.some(
                      (p) =>
                        String(p.id || '').startsWith('aesthetic-' + prefix + '-') &&
                        dist(p, candidate) < 36,
                    )
                  )
                    continue;
                  if (add(candidate, structure, prefix)) {
                    placed = true;
                    break;
                  }
                }
                if (placed) break;
              }
            }
          };
          townLife(major, R.settlementLayouts.majorLife, 'town');
          townLife(minor, R.settlementLayouts.minorLife, 'hamlet');
          const natureTargets = [72, 88, 120, 88, 90],
            natureSteps = [270, 250, 215, 250, 250],
            natureTarget = natureTargets[i],
            natureStep = natureSteps[i];
          for (let gx = 170; gx < size - 140 && natureCount < natureTarget; gx += natureStep)
            for (let gy = 190; gy < size - 140 && natureCount < natureTarget; gy += natureStep) {
              const seed =
                  (Math.imul(gx + i * 97, 73856093) ^ Math.imul(gy + i * 131, 19349663)) >>> 0,
                x = gx + (seed % 101) - 50,
                y = gy + ((seed >>> 8) % 91) - 45,
                p = { x, y };
              if (
                dist(p, major) < 390 ||
                dist(p, minor) < 330 ||
                dist(p, field) < 320 ||
                z.enemies.some((e) => e.hp > 0 && dist(e.home, p) < 55)
              )
                continue;
              if (add(p, theme[seed % theme.length])) natureCount++;
            }
          const {
              bounds: [x1, x2, y1, y2],
              gaps,
            } = R.barriers[i],
            edgeKinds =
              i === 0
                ? ['bush', 'reeds']
                : i === 1
                  ? ['reeds', 'cattails']
                  : i === 2
                    ? ['rock-cluster', 'alpine-scrub']
                    : i === 3
                      ? ['dead-tree', 'dry-scrub']
                      : ['black-rock', 'crystal-cluster'];
          let edgeIndex = 0;
          for (
            let y = y1 + 120;
            y < y2 - 100 && edgeIndex < 14;
            y += Math.max(130, Math.floor((y2 - y1) / 12))
          ) {
            if (gaps.some(([lo, hi]) => y > lo - 110 && y < hi + 110)) continue;
            for (const x of [x1 - 38, x2 + 38]) {
              const p = { x, y: y + ((edgeIndex * 37) % 51) - 25 };
              if (add(p, edgeKinds[edgeIndex % edgeKinds.length], 'bank')) edgeIndex++;
            }
          }
          const scenery = {
            orchard: ['sapling', 'wildflowers'],
            'den-ruins': ['stump', 'fallen-log'],
            'mill-pond': ['reeds', 'bush'],
            cache: ['bush', 'fallen-log'],
            'night-site': ['reeds', 'cattails'],
            wagon: ['driftwood', 'reeds'],
            watch: ['watchpost', 'reeds'],
            dock: ['cattails', 'driftwood'],
            lookout: ['alpine-scrub', 'rock-cluster'],
            ore: ['rock-cluster', 'heather'],
            tower: ['rock-cluster', 'pine-sapling'],
            shrine: ['dead-tree', 'ash-patch'],
            overlook: ['dry-scrub', 'rock-cluster'],
            checkpoint: ['barricade', 'banner'],
            convoy: ['cart', 'crate'],
            foundry: ['ember-pit', 'black-rock'],
            shelf: ['crystal-cluster', 'black-rock'],
            siege: ['barricade', 'banner'],
            'fortress-gate': ['black-rock', 'banner'],
          };
          for (const n of z.npcs.filter(
            (n) => n.kind === 'landmark' && !n.internalSite && scenery[n.id],
          ))
            for (const [j, structure] of scenery[n.id].entries()) {
              const a = (j ? 2.4 : -0.6) + i * 0.23,
                p = { x: n.x + Math.cos(a) * 70, y: n.y + Math.sin(a) * 70 };
              add(p, structure, 'site');
            }
          const oppression =
            i < 2 ? 'ration' : i === 2 ? 'watchpost' : i === 3 ? 'barricade' : 'banner';
          add({ x: major.x - 300, y: major.y + 15 }, oppression, 'town');
          add({ x: major.x + 300, y: major.y + 15 }, oppression, 'town');
          z.aestheticVersion = version;
        } finally {
          this.s.zone = oldZone;
        }
      }
      worldLife(z) {
        const version = originalDepartureRegion(z.id) ? 2 : 1;
        if (dungeonIds.includes(z.id) || this.supplyRoom(z.id) || z.worldLifeVersion === version)
          return;
        const i = this.regionIndex(z.id),
          plan = R.worldLifePlans?.[i],
          oldZone = this.s.zone;
        if (!plan) return;
        this.s.zone = z.id;
        try {
          z.props = z.props.filter((p) => !String(p.id || '').startsWith('world-life-'));
          let serial = 0;
          const nearRoad = (p, margin = 36) =>
            z.roads?.some((path) =>
              path.some((b, j) => j && this.distanceToSegment(p, path[j - 1], b) < margin),
            );
          const add = (x, y, structure, scope = 'wild', allowRoad = false) => {
            let p = { x, y };
            if (this.blocked(x, y, z.id, 8, true)) {
              try {
                p = this.safe(x, y, z.id);
              } catch (_) {
                return false;
              }
            }
            // Habitual camps keep their households when an access road passes
            // through an old furniture coordinate. Move within the habitat,
            // never into the carriageway or a neighboring resource site.
            const usable = (point) =>
              !this.blocked(point.x, point.y, z.id, 8, true) &&
              (allowRoad || !nearRoad(point, 65)) &&
              !z.npcs.some((n) => dist(n, point) < 45) &&
              !z.nodes.some((n) => dist(n, point) < 45);
            if (!usable(p)) {
              if (scope !== 'habitat') return false;
              let relocated = null;
              for (const radius of [55, 90, 125, 165, 210]) {
                for (let j = 0; j < 16; j++) {
                  const angle = (j * Math.PI) / 8;
                  const q = {
                    x: x + Math.cos(angle) * radius,
                    y: y + Math.sin(angle) * radius,
                  };
                  if (usable(q) && !z.props.some((other) => dist(other, q) < (other.r || 0) + 30)) {
                    relocated = q;
                    break;
                  }
                }
                if (relocated) break;
              }
              if (!relocated) return false;
              p = relocated;
            }
            z.props.push({
              id: 'world-life-' + scope + '-' + serial++,
              ...p,
              r: 0,
              decorative: true,
              structure,
            });
            return true;
          };
          for (const [x, y, structure] of plan.civilian || []) add(x, y, structure, 'civilian');
          for (const habitat of plan.habitats || []) {
            const [cx, cy] = habitat.center;
            for (const [dx, dy, structure] of habitat.props || [])
              add(cx + dx, cy + dy, structure, 'habitat');
          }
          const field = this.fieldCenter(i);
          for (const [dx, dy, structure] of plan.field || [])
            add(field.x + dx, field.y + dy, structure, 'field');
          z.worldLifeVersion = version;
        } finally {
          this.s.zone = oldZone;
        }
      }
      // Appearance-only rural smallhold scenes. Stable props and versioned
      // migration keep older saved towns, roads, rescues and actors unchanged.
      greenwoodCountryLife(z) {
        if (z.id !== 'vale' || z.greenwoodCountryVersion === 2) return;
        const previous = this.s.zone;
        this.s.zone = z.id;
        try {
          z.props = z.props.filter((p) => !String(p.id || '').startsWith('greenwood-country-'));
          const sites = R.greenwoodRuralScenes || [];
          const [townX, townY] = D.towns[0],
            futureServices = Object.values(R.serviceOffsets || {}).map(([dx, dy]) => ({
              x: townX + dx,
              y: townY + dy,
            }));
          const fits = (p) =>
            !this.blocked(p.x, p.y, z.id, 16) &&
            this.distanceToRoad(z, p) >= 100 &&
            !z.npcs.some((n) => dist(n, p) < 125) &&
            !futureServices.some((n) => dist(n, p) < 125) &&
            !z.nodes.some((n) => dist(n, p) < 90) &&
            !z.enemies.some((e) => e.hp > 0 && dist(e.home || e, p) < 135) &&
            !z.buildings.some((b) => dist(b, p) < 130) &&
            !z.props.some((q) => dist(q, p) < (q.r || 0) + (q.roadBlocker ? 125 : 63));
          for (const [j, [x, y, structure, district]] of sites.entries()) {
            if (j >= 14 && z.props.length >= 380) break;
            // Search a bounded neighborhood without moving established objects.
            let point = null;
            for (const radius of [0, 45, 85, 135, 190, 245]) {
              for (let k = 0; k < (radius ? 16 : 1); k++) {
                const theta = (k * Math.PI) / 8,
                  p = { x: x + Math.cos(theta) * radius, y: y + Math.sin(theta) * radius };
                if (fits(p)) {
                  point = p;
                  break;
                }
              }
              if (point) break;
            }
            if (!point) continue; // Better fewer real clearings than blocked roads.
            z.props.push({
              id: 'greenwood-country-' + j,
              ...point,
              r: 0,
              structure,
              decorative: true,
              greenwoodCountry: district,
            });
          }
          z.greenwoodCountryVersion = 2;
        } finally {
          this.s.zone = previous;
        }
      }
      ironrootLivelihood(z) {
        if (z.id !== 'highlands' || z.ironrootLifeVersion === 3) return;
        const oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          const prior = new Map(z.props.filter((p) => p.ironrootDistrict).map((p) => [p.id, p]));
          z.props = z.props.filter((p) => !String(p.id || '').startsWith('ironroot-life-'));
          const [townX, townY] = D.towns[this.regionIndex(z.id)];
          const futureServices = Object.values(R.serviceOffsets).map(([x, y]) =>
            this.safe(townX + x, townY + y, z.id),
          );
          for (const district of R.ironrootLife || []) {
            for (const [j, [x, y, structure]] of district.props.entries()) {
              const old = prior.get('ironroot-life-' + district.id + '-' + j);
              const candidates = [...(old ? [{ x: old.x, y: old.y }] : []), { x, y }];
              for (let d = 35; d <= 175; d += 35)
                for (let k = 0; k < 12; k++) {
                  const angle = (k * Math.PI) / 6;
                  candidates.push({ x: x + Math.cos(angle) * d, y: y + Math.sin(angle) * d });
                }
              const p = candidates.find(
                (p) =>
                  !this.blocked(p.x, p.y, z.id, 24, true) &&
                  !z.npcs.some((n) => dist(n, p) < 85) &&
                  !futureServices.some((n) => dist(n, p) < 85) &&
                  !z.nodes.some((n) => dist(n, p) < 65) &&
                  !z.roads?.some((path) =>
                    path.some((b, k) => k && this.distanceToSegment(p, path[k - 1], b) < 72),
                  ) &&
                  !z.props.some(
                    (q) =>
                      !q.regimeHeraldry &&
                      !String(q.id || '').startsWith('public-lantern-') &&
                      dist(q, p) < (q.r || 0) + 45,
                  ),
              );
              if (!p) continue;
              z.props.push({
                id: 'ironroot-life-' + district.id + '-' + j,
                ...p,
                r: 0,
                decorative: true,
                structure,
                ironrootDistrict: district.id,
              });
            }
          }
          z.ironrootLifeVersion = 3;
        } finally {
          this.s.zone = oldZone;
        }
      }
      // Worldbuilding-only successor growth on Verdun-like old battle scars
      // and practical heatworks around the two Crown lava channels. The heat
      // collectors sit on safe rock; no one moves through active lava.
      recoveryAndThermalLife(z) {
        const plan =
          z.id === 'frontier'
            ? R.frontierRecoveryScenes
            : z.id === 'crown'
              ? R.crownThermalWorksScenes
              : null;
        if (!plan || z.recoveryAndHeatVersion === 1) return;
        const oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          z.props = z.props.filter((p) => !String(p.id || '').startsWith('recovery-heat-'));
          const nearRoad = (p) => this.distanceToRoad(z, p) < 56;
          const valid = (p) =>
            !this.blocked(p.x, p.y, z.id, 17, true) &&
            !nearRoad(p) &&
            !z.npcs.some((n) => dist(n, p) < 120) &&
            !z.nodes.some((n) => dist(n, p) < 95) &&
            !z.buildings.some((b) => dist(b, p) < 120) &&
            !z.enemies.some((e) => e.hp > 0 && dist(e.home || e, p) < 82) &&
            !z.props.some(
              (other) => dist(other, p) < (other.r || 0) + (other.roadBlocker ? 130 : 62),
            );
          for (const [j, [x, y, structure, district]] of plan.entries()) {
            let point = null;
            for (const radius of [0, 55, 100, 145, 195, 250]) {
              const steps = radius ? 16 : 1;
              for (let k = 0; k < steps; k++) {
                const theta = (k * Math.PI) / 8,
                  p = {
                    x: x + Math.cos(theta) * radius,
                    y: y + Math.sin(theta) * radius,
                  };
                if (valid(p)) {
                  point = p;
                  break;
                }
              }
              if (point) break;
            }
            // A skipped prop is safer than forcing a tree into lava, a road
            // or a rescuer/boss interaction zone.
            if (!point) continue;
            z.props.push({
              id: 'recovery-heat-' + z.id + '-' + j,
              ...point,
              r: 0,
              decorative: true,
              structure,
              regionalRecovery: z.id === 'frontier' ? district : undefined,
              thermalPurpose: z.id === 'crown' ? district : undefined,
            });
          }
          z.recoveryAndHeatVersion = 1;
        } finally {
          this.s.zone = oldZone;
        }
      }
      // Sparse civil road lighting—working roads and settlement approaches,
      // not a continuous line of torches through untouched wilderness.
      roadsideLanternLife(z) {
        // Reconcile older unpublished dev.51 saves to the existing 21
        // public lanterns; the redundant fifteen-lamp pass is retired.
        if (z.props?.some((p) => p.roadLamp || String(p.id || '').startsWith('night-road-lamp-'))) {
          z.props = z.props.filter(
            (p) => !p.roadLamp && !String(p.id || '').startsWith('night-road-lamp-'),
          );
          delete z.roadLampVersion;
        }
        if (
          z.roadsideLanternVersion === 1 ||
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          this.sideDungeon(z.id)
        )
          return;
        const i = this.regionIndex(z.id),
          town = D.towns[i],
          minor = D.minors[i],
          special =
            {
              vale: [[1190, 760]],
              march: [
                [2120, 695],
                [1020, 530],
              ],
              highlands: [
                [1670, 1120],
                [2800, 700],
              ],
              frontier: [
                [1720, 1380],
                [2590, 1600],
                [2980, 2650],
              ],
              crown: [
                [2550, 900],
                [3030, 2310],
                [3210, 2830],
                [2600, 1370],
              ],
            }[z.id] || [],
          anchors = [town, minor, ...special],
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          z.props = z.props.filter((p) => !String(p.id || '').startsWith('public-lantern-'));
          let index = 0;
          const roads = z.roads?.flat() || [];
          for (const [x, y] of anchors) {
            if (index >= ({ vale: 3, march: 4, highlands: 4, frontier: 4, crown: 6 }[z.id] || 0))
              break;
            if (!roads.length) break;
            const center = roads.reduce(
              (best, p) => (!best || dist(p, { x, y }) < dist(best, { x, y }) ? p : best),
              null,
            );
            if (!center || dist(center, { x, y }) > 600) continue;
            let found = null;
            for (const radius of [65, 83, 100]) {
              for (let k = 0; k < 16; k++) {
                const a = (k * Math.PI) / 8,
                  p = { x: center.x + Math.cos(a) * radius, y: center.y + Math.sin(a) * radius },
                  shoulder = this.distanceToRoad(z, p);
                if (
                  shoulder < 38 ||
                  shoulder > 105 ||
                  this.blocked(p.x, p.y, z.id, 10, true) ||
                  z.npcs.some((n) => dist(n, p) < 83) ||
                  z.nodes.some((n) => dist(n, p) < 72) ||
                  z.buildings.some((b) => dist(b, p) < 105) ||
                  z.props.some((q) => dist(q, p) < (q.r || 0) + 62) ||
                  z.enemies.some((e) => e.hp > 0 && dist(e.home || e, p) < 90)
                )
                  continue;
                found = p;
                break;
              }
              if (found) break;
            }
            if (!found) continue;
            z.props.push({
              id: 'public-lantern-' + z.id + '-' + index++,
              ...found,
              structure: 'roadside-lantern',
              r: 0,
              decorative: true,
              publicWorks: 'maintained-road-light',
            });
          }
          z.roadsideLanternVersion = 1;
        } finally {
          this.s.zone = oldZone;
        }
      }
      frontierOccupationLayout(z) {
        if (z.id !== 'frontier' || z.frontierLayoutVersion === 4) return;
        const districts = R.frontierDistricts || [],
          routes = R.frontierRoutes || [],
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          z.props = z.props.filter((p) => !String(p.id || '').startsWith('frontier-layout-'));
          let serial = 0;
          const roadNear = (p, margin = 40) =>
            z.roads?.some((path) =>
              path.some((b, j) => j && this.distanceToSegment(p, path[j - 1], b) < margin),
            );
          const roadTraceStructures = new Set(['road-ruts', 'road-patch']);
          const clearPoint = (x, y) => {
            if (!this.blocked(x, y, z.id, 8, true)) return { x, y };
            for (let radius = 30; radius <= 180; radius += 30)
              for (let n = 0; n < 16; n++) {
                const a = (n * Math.PI) / 8,
                  p = { x: x + Math.cos(a) * radius, y: y + Math.sin(a) * radius };
                if (!this.blocked(p.x, p.y, z.id, 8, true)) return p;
              }
            return null;
          };
          const place = (base, spec, prefix) => {
            const [dx, dy, structure] = spec,
              roadTrace = roadTraceStructures.has(structure),
              raw = { x: base.x + dx, y: base.y + dy };
            const usable = (point) =>
              !!point &&
              (roadTrace ||
                (!roadNear(point, 48) &&
                  !z.npcs.some((n) => dist(n, point) < 45) &&
                  !z.nodes.some((n) => n.amount > 0 && dist(n, point) < 48) &&
                  !z.buildings.some((n) => dist(n, point) < 55)));
            let p = clearPoint(raw.x, raw.y);
            if (!usable(p) && !roadTrace) {
              // Work yards and checkpoint standards remain in their district
              // on roadside plots rather than silently disappearing.
              for (const radius of [45, 80, 115, 150, 190, 240]) {
                for (let j = 0; j < 16; j++) {
                  const angle = (j * Math.PI) / 8;
                  const q = clearPoint(
                    raw.x + Math.cos(angle) * radius,
                    raw.y + Math.sin(angle) * radius,
                  );
                  if (!usable(q)) continue;
                  if (z.props.some((other) => dist(other, q) < (other.r || 0) + 35)) continue;
                  p = q;
                  break;
                }
                if (usable(p)) break;
              }
            }
            if (!usable(p)) return false;
            z.props.push({
              id: 'frontier-layout-' + prefix + '-' + serial++,
              ...p,
              r: 0,
              decorative: true,
              structure,
              frontierDistrict: prefix,
              roadTrace,
            });
            return true;
          };
          for (const d of districts) {
            const center = { x: d.center[0], y: d.center[1] };
            for (const spec of d.props || []) place(center, spec, d.id);
          }
          for (const route of routes) {
            const center = { x: route.point[0], y: route.point[1] };
            for (const spec of route.props || []) place(center, spec, 'route-' + route.id);
          }
          z.frontierLayoutVersion = 4;
        } finally {
          this.s.zone = oldZone;
        }
      }
      darkCrownLayout(z) {
        if (z.id !== 'crown' || z.crownLayoutVersion === 1) return;
        const districts = R.crownDistricts || [],
          routes = R.crownRoutes || [],
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          z.props = z.props.filter((p) => !String(p.id || '').startsWith('crown-layout-'));
          // Replace the old generic fortress work-camp cluster with authored regime districts while keeping boss/stronghold life intact.
          for (const d of districts.filter((d) => d.id === 'fortress-logistics'))
            z.props = z.props.filter(
              (p) =>
                !(
                  String(p.id || '').startsWith('world-life-habitat-') &&
                  dist(p, { x: d.center[0], y: d.center[1] }) < 220
                ),
            );
          let serial = 0;
          const roadNear = (p, margin = 40) =>
            z.roads?.some((path) =>
              path.some((b, j) => j && this.distanceToSegment(p, path[j - 1], b) < margin),
            );
          const solidNear = (p, r) =>
            z.props.some((q) => !q.decorative && dist(q, p) < (q.r || 0) + r + 12);
          const clearPoint = (x, y, r = 8) => {
            const raw = { x, y };
            if (!this.blocked(x, y, z.id, r, true) && !solidNear(raw, r)) return raw;
            for (let radius = 35; radius <= 210; radius += 35)
              for (let n = 0; n < 16; n++) {
                const a = (n * Math.PI) / 8,
                  p = { x: x + Math.cos(a) * radius, y: y + Math.sin(a) * radius };
                if (!this.blocked(p.x, p.y, z.id, r, true) && !solidNear(p, r)) return p;
              }
            return null;
          };
          const place = (base, spec, prefix) => {
            const [dx, dy, structure, r = 0] = spec,
              raw = { x: base.x + dx, y: base.y + dy };
            const usable = (point) =>
              !!point &&
              !roadNear(point, r > 0 ? r + 62 : 50) &&
              !z.npcs.some((n) => dist(n, point) < 48) &&
              !z.nodes.some((n) => dist(n, point) < 50) &&
              !z.buildings.some((n) => dist(n, point) < 60);
            let p = clearPoint(raw.x, raw.y, Math.max(8, r));
            if (!usable(p)) {
              for (const radius of [45, 85, 125, 170, 210, 255]) {
                for (let j = 0; j < 16; j++) {
                  const angle = (j * Math.PI) / 8;
                  const q = clearPoint(
                    raw.x + Math.cos(angle) * radius,
                    raw.y + Math.sin(angle) * radius,
                    Math.max(8, r),
                  );
                  if (!usable(q)) continue;
                  if (z.props.some((other) => dist(other, q) < (other.r || 0) + r + 27)) continue;
                  p = q;
                  break;
                }
                if (usable(p)) break;
              }
            }
            if (!usable(p)) return false;
            z.props.push({
              id: 'crown-layout-' + prefix + '-' + serial++,
              ...p,
              r,
              decorative: r <= 0,
              structure,
              crownDistrict: prefix,
            });
            return true;
          };
          for (const d of districts) {
            const center = { x: d.center[0], y: d.center[1] };
            for (const spec of d.props || []) place(center, spec, d.id);
          }
          for (const route of routes) {
            const center = { x: route.point[0], y: route.point[1] };
            for (const spec of route.props || [])
              place(center, [spec[0], spec[1], spec[2], 0], 'route-' + route.id);
          }
          // Retain the visually distinctive compound scenes and at least one
          // prop in each district/route; suppress only redundant loose dressing.
          const districtProps = z.props.filter((p) =>
            String(p.id || '').startsWith('crown-layout-'),
          );
          if (districtProps.length > 27) {
            const composed = new Set([
              'crown-levy-yard',
              'crown-command-post',
              'ashbeast-roost-scene',
              'crown-logistics-bay',
              'crown-fortress-checkpoint',
            ]);
            const kept = new Set(districtProps);
            const redundant =
              /^(?:bunk|sleep-roll|war-table|weapon-rack|supply-stack|black-rock|roost|ember-pit)$/;
            for (const p of [...districtProps].reverse()) {
              if (kept.size <= 27) break;
              if (composed.has(p.structure) || !redundant.test(p.structure)) continue;
              if ([...kept].filter((q) => q.crownDistrict === p.crownDistrict).length <= 1)
                continue;
              kept.delete(p);
            }
            z.props = z.props.filter(
              (p) => !String(p.id || '').startsWith('crown-layout-') || kept.has(p),
            );
          }
          z.crownLayoutVersion = 1;
        } finally {
          this.s.zone = oldZone;
        }
      }
      harborLayout(z) {
        const h = R.harbors?.[z.id];
        if (!h) return;
        const transport =
          z.id === 'march'
            ? z.npcs.find((n) => n.id === 'outbound')
            : z.id === 'highlands'
              ? z.npcs.find((n) => n.id === 'return')
              : null;
        if (transport) {
          Object.assign(transport, h.boat);
          transport.name =
            z.id === 'march' ? 'Ferry to Ironroot Highlands' : 'Ferry back to Flooded Marches';
          transport.harbor = true;
        }
        const version = z.id === 'march' ? 3 : 2;
        if (z.harborVersion === version) return;
        const oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          const w = h.water,
            d = h.dock,
            insideHarbor = (p) => R.harborWaterBlocked(w, p.x, p.y, 12);
          z.props = z.props.filter(
            (p) =>
              !String(p.id || '').startsWith('harbor-') && (z.id === 'march' || !insideHarbor(p)),
          );
          for (const e of z.enemies.filter(
            (e) => e.hp > 0 && e.type === 'mob' && !e.nightOnly && dist(e, h.arrival) < 280,
          )) {
            const fallback = this.safe(
              z.id === 'march' ? 940 : 650,
              z.id === 'march' ? 2250 : 2180,
              z.id,
            );
            e.home = { ...fallback };
            if (!e.aggro) Object.assign(e, fallback);
          }
          const roadDistance = (p) => {
            let nearest = Infinity;
            for (const path of z.roads || [])
              for (let j = 1; j < path.length; j++)
                nearest = Math.min(nearest, this.distanceToSegment(p, path[j - 1], path[j]));
            return nearest;
          };
          const add = (id, x, y, structure, r = 0) => {
            let p = { x, y };
            if (roadDistance(p) <= 70 || this.blocked(p.x, p.y, z.id, 8, true)) {
              let found = null;
              for (const radius of [90, 130, 170, 220]) {
                for (let n = 0; n < 24; n++) {
                  const a = (n * Math.PI) / 12,
                    q = { x: x + Math.cos(a) * radius, y: y + Math.sin(a) * radius };
                  if (this.blocked(q.x, q.y, z.id, 8, true) || roadDistance(q) <= 70) continue;
                  found = q;
                  break;
                }
                if (found) break;
              }
              if (found) p = found;
              else return;
            }
            z.props.push({ id: 'harbor-' + id, ...p, r, decorative: true, structure });
          };
          if (z.id === 'march') {
            for (const [id, x, y, structure] of [
              ['mangrove-a', 2320, 500, 'mangrove'],
              ['mangrove-b', 2470, 560, 'mangrove'],
              ['mangrove-c', 2490, 820, 'mangrove'],
              ['reeds-a', 2460, 700, 'reeds'],
              ['reeds-b', 2370, 860, 'cattails'],
              ['drift', 2500, 870, 'driftwood'],
            ])
              add(id, x, y, structure);
          } else if (z.id === 'highlands') {
            for (const [id, x, y, structure] of [
              ['pine-a', 470, 1765, 'pine-sapling'],
              ['pine-b', 510, 2140, 'pine-sapling'],
              ['rock-a', 455, 1840, 'rock-cluster'],
              ['rock-b', 480, 2070, 'rock-cluster'],
              ['heather', 560, 2170, 'heather'],
            ])
              add(id, x, y, structure);
          }
          z.harborVersion = version;
        } finally {
          this.s.zone = oldZone;
        }
      }
      regionalHandoffLife(z) {
        const scenes = R.regionalHandoffScenes?.[z.id];
        const version = ['vale', 'march'].includes(z.id) ? 2 : 1;
        if (!scenes || z.regionalHandoffVersion === version) return;
        const previous = this.s.zone;
        // Version 1 props may have been placed before later road/settlement migrations.
        // Preserve their saved positions/order; append only the newly approved details.
        const appendOnly = version === 2 && z.regionalHandoffVersion === 1;
        const previousCount = z.id === 'vale' ? 3 : z.id === 'march' ? 5 : 0;
        this.s.zone = z.id;
        try {
          if (!appendOnly)
            z.props = z.props.filter((p) => !String(p.id || '').startsWith('regional-handoff-'));
          const [townX, townY] = D.towns[this.regionIndex(z.id)];
          const futureServices = Object.values(R.serviceOffsets).map(([x, y]) =>
            this.safe(townX + x, townY + y, z.id),
          );
          const clear = (p) =>
            !this.blocked(p.x, p.y, z.id, 24) &&
            !z.npcs.some((n) => dist(n, p) < 65) &&
            !futureServices.some((n) => dist(n, p) < 65) &&
            !z.nodes.some((n) => n.amount > 0 && dist(n, p) < 55) &&
            !z.props.some((n) => dist(n, p) < 45) &&
            !z.roads.some((path) =>
              path.some((b, j) => j && this.distanceToSegment(p, path[j - 1], b) < 60),
            );
          for (const [j, [x, y, structure, district, sceneRole]] of scenes.entries()) {
            if (
              appendOnly &&
              (j < previousCount || z.props.some((p) => p.id === 'regional-handoff-' + j))
            )
              continue;
            let point = null;
            for (const radius of [0, 50, 100, 150, 200]) {
              for (let n = 0; n < 16; n++) {
                const a = (n * Math.PI) / 8,
                  p = { x: x + Math.cos(a) * radius, y: y + Math.sin(a) * radius };
                if (clear(p)) {
                  point = p;
                  break;
                }
              }
              if (point) break;
            }
            if (point)
              z.props.push({
                id: 'regional-handoff-' + j,
                ...point,
                r: 0,
                decorative: true,
                structure,
                regionalDistrict: district,
                ...(sceneRole ? { sceneRole } : {}),
              });
          }
          z.regionalHandoffVersion = version;
        } finally {
          this.s.zone = previous;
        }
      }
      dungeonWorkstation(z) {
        // Rebuild these study objects for old saves as well as new Archive visits.
        // Boss/captive visibility follows the saved normal/TRUE encounter state.
        if (z.id === 'archive') {
          for (const n of [
            {
              id: 'keeper-captive',
              name: 'The Drowned Keeper',
              kind: 'keeper',
              ...this.safe(1030, 945, z.id),
              icon: '🧙',
            },
            {
              id: 'archive-restorer',
              name: 'Neri the Alchemist',
              kind: 'alchemist',
              family: 'archive',
              presentation: 'archive-restorer',
              ...this.safe(1130, 560, z.id),
              icon: '⚗️',
            },
            {
              id: 'archive-ledger',
              name: 'The Keeper’s ledger',
              kind: 'archive-record',
              ...this.safe(480, 565, z.id),
              icon: '📜',
            },
          ])
            if (!z.npcs.some((other) => other.id === n.id)) z.npcs.push(n);
        }
        const spec = R.dungeonWorkstations?.[z.id];
        if (!spec) return;
        const captive = z.npcs.find((n) => n.kind === 'cage' && n.family === z.id);
        if (captive) Object.assign(captive, spec, { x: spec.x, y: spec.y });
      }
      abyssAviationProject(z) {
        if (z.id !== 'abyss' || z.flightProjectVersion === 1) return;
        // Update only presentation on existing saves: occupants, progress and geometry stay put.
        for (const [j, [, , structure, district]] of R.dungeonDecor.abyss.entries()) {
          const p = z.props.find((p) => p.id === 'decor-' + j && p.decorative);
          if (p) Object.assign(p, { structure, dungeonDistrict: district });
        }
        z.flightProjectVersion = 1;
      }
      // The Dark Lord's paid state soldiery is multiracial, while wild wolves,
      // local civilian life and independent monster households remain native.
      // Only visual/doctrine metadata and readable names change: never HP,
      // damage, level, rewards, spawn count, home or saved enemy identity.
      crownMilitaryRoster(z) {
        if (this.peace) return;
        // Ironroot's relocation preserves the already assigned soldiery. New
        // distances must not recruit another native Wolf into a mounted slot.
        if (z.id === 'highlands' && z.appalachianVersion) return;
        const lineages = crownLineages;
        const label = (e) =>
          'Crown ' +
          (e.crownAncestry === 'crownguard' ? 'shield' : e.crownAncestry) +
          (e.ranged ? ' marksman' : ' guard');
        if (z.id === 'citadel') {
          const native = z.enemies
            .filter((e) => e.guard && e.form === 'normal' && !e.reinforcement)
            .sort((a, b) => this.idOrder(a, b));
          for (const [j, e] of native.entries()) {
            if (e.species !== 'crownguard') continue;
            e.crownTroop = true;
            e.crownAncestry = lineages[j % lineages.length];
            e.name = label(e);
          }
          return;
        }
        const anchors = crownAnchors[z.id];
        if (!anchors) return;
        const distance = (e) => {
          const x = e.home?.x,
            y = e.home?.y,
            previous = crownPostDistances.get(e);
          if (previous?.zone === z.id && previous.x === x && previous.y === y)
            return previous.distance;
          const value = Math.min(...anchors.map(([px, py]) => Math.hypot(x - px, y - py)));
          crownPostDistances.set(e, { zone: z.id, x, y, distance: value });
          return value;
        };
        // Existing Wolves nearest the Crown mint/convoy roads can be trained
        // mounts. Independent Wolf dens/strongholds and ordinary mountain
        // society are deliberately excluded; this creates no new population.
        if (z.id === 'highlands') {
          const riders = z.enemies
            .filter(
              (e) =>
                e.species === 'wolf' &&
                e.type === 'mob' &&
                e.form === 'normal' &&
                !e.guard &&
                !e.summon &&
                !e.mini &&
                !e.nightOnly &&
                !e.strongholdResident &&
                !e.site &&
                !e.neutral &&
                distance(e) < 1100,
            )
            .sort((a, b) => distance(a) - distance(b) || this.idOrder(a, b))
            .slice(0, 4);
          for (const [j, e] of riders.entries()) {
            e.mountedCrownRider = true;
            e.crownTroop = true;
            e.crownAncestry = 'wolf';
            e.name = j % 2 ? 'Crown direwolf mounted archer' : 'Crown direwolf lance patrol';
            e.forcedRole = j % 2 ? 'ranged' : 'melee';
            reconcileMilitaryRole(this, e, j);
            // Military posts use the no-farm contract while retaining the
            // original Wolf HP, damage, level and patrol/quest identity.
            e.gold = 0;
            e.xp = 0;
          }
        }
        const quota = { highlands: 5, frontier: 10, crown: 12 }[z.id];
        const soldiers = z.enemies
          .filter(
            (e) =>
              e.type === 'mob' &&
              e.form === 'normal' &&
              !e.summon &&
              !e.captain &&
              !e.roomCaptain &&
              !e.fieldCaptain &&
              !e.nightOnly &&
              !e.neutral &&
              // Crown soldier posts remain Crown even when assigned to a named
              // redoubt. Do not turn local monster habitats into generic soldiery.
              (z.id === 'crown'
                ? e.species === 'crownguard'
                : !e.guard &&
                  !e.mini &&
                  !e.strongholdResident &&
                  ['crownguard', 'goblin', 'orc', 'archer', 'ogre'].includes(e.species)) &&
              distance(e) < (z.id === 'crown' ? 1550 : 880),
          )
          .sort((a, b) => distance(a) - distance(b) || this.idOrder(a, b))
          .slice(0, quota);
        for (const [j, e] of soldiers.entries()) {
          e.crownTroop = true;
          e.crownAncestry = e.species === 'crownguard' ? lineages[j % lineages.length] : e.species;
          if (z.id === 'crown') {
            // Existing open-capital troops had all defaulted to archery;
            // half now screen the rest with shields without stat inflation.
            e.forcedRole = j % 2 === 0 ? 'melee' : 'ranged';
            reconcileMilitaryRole(this, e, j);
          }
          e.name = label(e);
        }
      }
      // Sparse state heraldry is decorative and avoids road obstructions.
      regimeHeraldry(z) {
        const anchors = {
          highlands: [
            [1100, 1370],
            [1850, 1080],
            [3090, 590],
            [770, 1680],
          ],
          frontier: [
            [260, 650],
            [1720, 1200],
            [2570, 1600],
            [2940, 2570],
            [3130, 570],
          ],
          crown: [
            [735, 850],
            [2550, 850],
            [3030, 2290],
            [3250, 2850],
            [3300, 3110],
            [300, 1530],
          ],
        }[z.id];
        if (!anchors || z.regimeHeraldryVersion === 1) return;
        const before = this.s.zone;
        this.s.zone = z.id;
        try {
          z.props = z.props.filter((p) => !String(p.id || '').startsWith('regime-banner-'));
          const nearRoad = (p) => this.distanceToRoad(z, p) < 72;
          for (const [index, [x, y]] of anchors.entries()) {
            let chosen = null;
            for (const radius of [0, 60, 105, 160, 215]) {
              for (let k = 0; k < (radius ? 12 : 1); k++) {
                const angle = (k * Math.PI) / 6,
                  p = { x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius };
                if (
                  this.blocked(p.x, p.y, z.id, 12, true) ||
                  nearRoad(p) ||
                  z.npcs.some((n) => Math.hypot(n.x - p.x, n.y - p.y) < 78) ||
                  z.nodes.some((n) => Math.hypot(n.x - p.x, n.y - p.y) < 65) ||
                  z.buildings.some((b) => Math.hypot(b.x - p.x, b.y - p.y) < 85) ||
                  z.props.some(
                    (other) => Math.hypot(other.x - p.x, other.y - p.y) < (other.r || 0) + 60,
                  )
                )
                  continue;
                chosen = p;
                break;
              }
              if (chosen) break;
            }
            if (chosen)
              z.props.push({
                id: 'regime-banner-' + z.id + '-' + index,
                ...chosen,
                r: 0,
                decorative: true,
                structure: 'crown-banner',
                regimeHeraldry: true,
              });
          }
          z.regimeHeraldryVersion = 1;
        } finally {
          this.s.zone = before;
        }
      }
      authoredPlaces(z) {
        if (this.supplyRoom(z.id)) {
          this.treasuryInterior(z);
          this.treasuryGuardPopulation(z);
          this.combatPopulation(z);
          this.guardianPopulation(z);
          this.roomCaptainPopulation(z);
          return;
        }
        if (this.sideDungeon(z.id)) {
          this.combatPopulation(z);
          this.ordinaryMeleePopulation(z);
          this.ordinaryRangedPopulation(z);
          return;
        }
        this.harborLayout(z);
        this.repairMiniGuardianReachability(z);
        this.spaceQuestBoard(z);
        this.spaceMillhavenSupplier(z);
        this.combatPopulation(z);
        this.nightEnemyPopulation(z);
        if (dungeonIds.includes(z.id)) {
          this.dungeonWorkstation(z);
          this.decorateDungeon(z);
          this.abyssAviationProject(z);
          // Existing Ironroot v4 saves may already have the current dungeon
          // geometry version. Refurbish ONLY surviving/recorded native Wolf
          // slots as mounted guards, never summon or revive replacement Wolves.
          if (z.id === 'mine' && !this.peace) {
            const native = z.enemies
              .filter((e) => e.guard && e.form === 'normal' && !e.reinforcement)
              .sort((a, b) => this.idOrder(a, b));
            for (const [j, e] of native.entries()) {
              const post = R.dungeonGuardFormations.mine[j];
              if (!post?.mountedCrownRider || e.species !== 'wolf') continue;
              e.mountedCrownRider = true;
              e.crownTroop = true;
              e.crownAncestry = 'wolf';
              e.forcedRole = post.role;
              e.name = post.name;
              this.configureEnemy(e, j);
            }
          }
          for (const e of z.enemies)
            if (e.form === 'ringleader' && e.ringleaderHealthVersion !== 3)
              this.upgradeRingleader(e);
          this.guardianPopulation(z);
          this.guardianRewards(z);
          this.crownMilitaryRoster(z);
          return;
        }
        if (z.placesVersion !== 2) {
          z.npcs = z.npcs.filter((n) => !n.id.startsWith('landmark-'));
          const i = this.regionIndex(z.id);
          for (const [id, name, x, y] of R.sites[i]) {
            let n = z.npcs.find((n) => n.id === id);
            const data = {
              id,
              name,
              kind: 'landmark',
              ...this.safe(x, y, z.id),
              icon: /bridge|crossing/i.test(name)
                ? '🪵'
                : /camp|convoy|wagon/i.test(name)
                  ? '🏕️'
                  : '🏚️',
              ...(z.id === 'frontier' && id === 'checkpoint' ? { internalSite: true } : {}),
            };
            if (n) Object.assign(n, data);
            else z.npcs.push(data);
          }
          z.placesVersion = 2;
        }
        this.localSites(z);
        this.retireResourceMini(z);
        this.resourceDeposits(z);
        this.miniDungeons(z);
        this.repairMiniGuardianReachability(z);
        this.spreadOutdoorForces(z);
        this.alignLandmarks(z);
        this.sideInteriors(z);
        this.supplyInteriors(z);
        this.regionalAesthetics(z);
        this.worldLife(z);
        this.creatureStrongholds(z);
        this.frontierOccupationLayout(z);
        this.darkCrownLayout(z);
        this.ordinaryMeleePopulation(z);
        this.ordinaryRangedPopulation(z);
        this.guardianPopulation(z);
        this.summonPopulation(z);
        for (const e of z.enemies)
          if (e.form === 'ringleader' && e.ringleaderHealthVersion !== 3) this.upgradeRingleader(e);
        this.fieldCaptainPopulation(z);
        this.finalBossPopulation(z);
        this.regionalHandoffLife(z);
        this.greenwoodCountryLife(z);
        this.ironrootLivelihood(z);
        this.crownMilitaryRoster(z);
        this.regimeHeraldry(z);
        this.recoveryAndThermalLife(z);
        this.roadsideLanternLife(z);
        this.marchCoastalLayout(z);
        this.lanternShoreLayout(z);
        this.highlandsTributeLayout(z);
      }
      highlandsTributeLayout(z, finalLayout = false) {
        const cfg = R.highlandsTribute;
        if (
          z.id !== 'highlands' ||
          z.highlandsTributeVersion === cfg.version ||
          (!finalLayout && z.appalachianVersion !== 1)
        )
          return;
        const before = this.s.zone;
        this.s.zone = z.id;
        try {
          const moved = new Set();
          // Named places own these sources; discard only obsolete invisible WIP markers.
          z.npcs = z.npcs.filter((n) => !n.id.startsWith('highlands-tribute-site-'));
          for (const [index, site] of cfg.sites.entries()) {
            const node = z.nodes.find((n) => n.tributeId === site.id && n.tribute);
            if (!node) continue;
            const landmark = z.npcs.find((n) => n.id === site.site),
              plan = R.tributePlans.highlands.find((p) => p.id === site.id),
              point = this.safe(site.x, site.y, z.id);
            if (node.amount < plan.amount || this.s.party.some((u) => u.order?.id === node.id))
              this.s.discovered['highlands:tribute:' + node.tributeId] = true;
            Object.assign(node, point, {
              site: site.site,
              siteName: landmark?.name || site.site,
              hidden: true,
              concealedTribute: true,
              storageStyle: site.storageStyle,
              context: plan.context,
            });
            moved.add(node.id);
            for (const [j, [dx, dy, structure]] of site.props.entries()) {
              const id = 'highlands-tribute-scene-' + index + '-' + j,
                p = z.props.find((p) => p.id === id),
                position = this.safe(point.x + dx, point.y + dy, z.id);
              const dressing = {
                id,
                ...position,
                structure,
                r: 0,
                decorative: true,
                tributeScene: site.id,
              };
              if (p) Object.assign(p, dressing);
              else z.props.push(dressing);
            }
          }
          if (before === z.id)
            for (const u of this.s.party.filter((u) => moved.has(u.order?.id))) {
              delete u.order.journey;
              this.clearGatheringIntent(u);
            }
          z.highlandsTributeVersion = cfg.version;
        } finally {
          this.s.zone = before;
        }
      }
      spaceQuestBoard(z) {
        if (dungeonIds.includes(z.id) || z.boardPositionVersion === 2) return;
        const board = z.npcs.find((n) => n.kind === 'quests');
        if (!board) return;
        const i = this.regionIndex(z.id),
          [x, y] = D.towns[i],
          p = this.safe(x + 210, y + 55, z.id);
        Object.assign(board, p);
        z.boardPositionVersion = 2;
      }
      spaceMillhavenSupplier(z) {
        if (z.id !== 'vale' || z.supplierPositionVersion === 2) return;
        const supplier = z.npcs.find((n) => n.id === 'supplier');
        if (!supplier) return;
        const [x, y] = D.towns[0];
        Object.assign(supplier, this.safe(x + 115, y - 85, z.id));
        z.supplierPositionVersion = 2;
      }
      marchCoastalLayout(z) {
        if (z.id !== 'march' || z.coastalSwampVersion === 1) return;
        const before = this.s.zone;
        this.s.zone = z.id;
        try {
          const h = R.harbors.march,
            nature = new Set([
              'sapling',
              'willow',
              'regrowth-willow',
              'bush',
              'marsh-bush',
              'reeds',
              'cattails',
              'wet-grass',
              'grass',
              'mangrove',
              'dead-tree',
              'driftwood',
            ]);
          // Retire the old harbor's isolated decor and replace only coastal nature.
          z.props = z.props.filter(
            (p) =>
              !String(p.id || '').startsWith('harbor-') &&
              !(nature.has(p.structure) && (p.y > 2390 || p.x > 2740)),
          );
          const roads = [
            [
              [145, 1380],
              [350, 1370],
              [560, 1250],
              [650, 1110],
            ],
            [
              [560, 1250],
              [700, 1490],
              [920, 1640],
              [1015, 1780],
            ],
            [
              [650, 1110],
              [800, 1030],
              [870, 810],
              [1000, 670],
              [1050, 500],
            ],
            [
              [650, 1110],
              [950, 1050],
              [1200, 1160],
              [1500, 1080],
              [1730, 1120],
              [2020, 1120],
            ],
            [
              [1050, 500],
              [1200, 360],
              [1550, 330],
              [1850, 430],
              [2220, 350],
              [2520, 520],
            ],
            [
              [1015, 1780],
              [1795, 1780],
            ],
            [
              [1015, 1780],
              [940, 2050],
              [830, 2210],
              [650, 2290],
              [560, 2350],
            ],
            [
              [1795, 1780],
              [1890, 1650],
              [2130, 1660],
              [2370, 1740],
              [2510, 1720],
            ],
            [
              [2020, 1120],
              [2270, 1280],
              [2630, 1350],
              [2650, 1570],
              [2510, 1720],
            ],
          ].map((r) => r.map(([x, y]) => ({ x, y })));
          const trail = [
            [1795, 1780],
            [1810, 2050],
            [1790, 2240],
            [1830, 2410],
            [1770, 2730],
            [1770, 2860],
          ].map(([x, y]) => ({ x, y }));
          z.roads = [...roads, trail];
          const oldEntrances = {
              archive: [2600, 2350],
              'supply-march': [2440, 955],
              'side-march-watchhouse': [2550, 1480],
            },
            destinations = {
              archive: [500, 2350],
              'supply-march': [2580, 520],
              'side-march-watchhouse': [2600, 1720],
            };
          for (const b of z.buildings) {
            const from = oldEntrances[b.dungeonEntrance],
              to = destinations[b.dungeonEntrance];
            if (from && to && Math.hypot(b.x - to[0], b.y - to[1]) > 650)
              Object.assign(b, this.safe(b.x + to[0] - from[0], b.y + to[1] - from[1], z.id));
          }
          if (this.s.zone === 'march' && Math.hypot(this.hero.x - 2600, this.hero.y - 2350) < 340)
            for (const u of [this.hero, ...this.s.party])
              Object.assign(u, this.safe(500 + (u.x - 2600), 2350 + (u.y - 2350), z.id));
          const relocate = (id, to, predicate) => {
            const n = z.npcs.find((n) => n.id === id);
            if (!n) return;
            const delta = { x: to.x - n.x, y: to.y - n.y };
            if (Math.hypot(delta.x, delta.y) > 1)
              for (const p of z.props.filter(predicate))
                Object.assign(p, this.safe(p.x + delta.x, p.y + delta.y, z.id));
            Object.assign(n, to);
          };
          relocate('entrance', { x: 500, y: 2350 }, (p) => p.regionalDistrict === 'archive-relief');
          relocate('watch', { x: 2600, y: 1720 }, (p) =>
            String(p.id || '').startsWith('side-entrance-side-march-watchhouse-'),
          );
          relocate('supply-entrance', { x: 2580, y: 520 }, (p) =>
            String(p.id || '').startsWith('treasury-approach-'),
          );
          for (const p of z.props.filter(
            (p) => p.regionalDistrict === 'archive-relief' && p.x > 1500,
          ))
            Object.assign(p, this.safe(p.x - 2100, p.y, z.id));
          for (const p of z.props.filter(
            (p) => String(p.id || '').startsWith('world-life-habitat-') && p.x > 2100 && p.y > 2200,
          ))
            Object.assign(p, this.safe(p.x - 1500, p.y - 130, z.id));
          // Keep old saved/player assets out of the newly authored water, with their IDs/state intact.
          for (const p of [...z.props, ...z.nodes, ...z.buildings, ...z.npcs])
            if (this.blocked(p.x, p.y, z.id, Math.min(p.r || 0, 20), true))
              Object.assign(p, this.safe(p.x, p.y, z.id));
          for (const drop of this.s.loot || [])
            if (drop.zone === z.id && this.blocked(drop.x, drop.y, z.id, 8, true))
              Object.assign(drop, this.safe(drop.x, drop.y, z.id));
          for (const e of z.enemies) {
            if (R.harborWaterBlocked(h.water, e.home.x, e.home.y, 15))
              e.home = this.safe(e.home.x, e.home.y, z.id);
            if (R.harborWaterBlocked(h.water, e.x, e.y, 15))
              Object.assign(e, this.safe(e.x, e.y, z.id));
          }
          if (this.s.refugeSite?.zone === 'march') {
            const refuge = [...z.npcs, ...z.buildings].find((n) => n.id === this.s.refugeSite.id);
            if (refuge) Object.assign(this.s.refugeSite, { x: refuge.x, y: refuge.y });
          }
          z.streetClearanceVersion = 0;
          this.clearStreetCorridors(z);
          const board = z.npcs.find((n) => n.id === 'board');
          if (board) Object.assign(board, this.safe(680, 1300, z.id));

          z.props = z.props.filter(
            (p) =>
              !nature.has(p.structure) ||
              !trail.some((q, j) => j && this.distanceToSegment(p, trail[j - 1], q) < 65),
          );
          let serial = 0;
          const add = (x, y, structure, water = false) => {
            const q = { x, y };
            if (
              this.distanceToRoad(z, q) < 58 ||
              z.npcs.some((n) => dist(n, q) < 70) ||
              z.nodes.some((n) => dist(n, q) < 65) ||
              z.buildings.some((b) => dist(b, q) < 100)
            )
              return;
            if (!water && this.blocked(x, y, z.id, 10, true)) return;
            z.props.push({
              id: 'lantern-coast-' + serial++,
              x,
              y,
              r: 0,
              decorative: true,
              structure,
              coastalSwamp: true,
            });
          };
          const bank = h.water.points.slice(0, h.water.bankCount);
          for (let j = 1; j < bank.length; j++) {
            const a = bank[j - 1],
              b = bank[j],
              len = dist(a, b),
              nx = -(b.y - a.y) / len,
              ny = (b.x - a.x) / len;
            for (let d = 35 + ((j * 17) % 60); d < len; d += 85 + (j % 4) * 19) {
              const x = a.x + ((b.x - a.x) * d) / len,
                y = a.y + ((b.y - a.y) * d) / len;
              // Bank runs clockwise around the water: inland roots, reed margins and tide litter.
              for (const off of [24 + (j % 3) * 13, 85 + (j % 4) * 17]) {
                const px = x + nx * off,
                  py = y + ny * off;
                if (
                  px < 35 ||
                  py < 35 ||
                  px > 2965 ||
                  py > 2965 ||
                  Math.hypot(px - 1880, py - 2600) < 290
                )
                  continue;
                add(
                  px,
                  py,
                  off === 32
                    ? 'mangrove'
                    : j % 3 === 0
                      ? 'driftwood'
                      : j % 2
                        ? 'cattails'
                        : 'wet-grass',
                );
              }
            }
          }
          const lagoon = R.terrain[1].find((t) => t.kind === 'rain-pools').pools[0];
          for (let j = 0; j < lagoon.points.length; j += 2) {
            const p = lagoon.points[j],
              dx = p.x - lagoon.x,
              dy = p.y - lagoon.y;
            add(
              lagoon.x + dx * 1.17,
              lagoon.y + dy * 1.17,
              j % 6 === 0 ? 'regrowth-willow' : j % 4 ? 'cattails' : 'wet-grass',
            );
          }
          add(1140, 650, 'fishing-net');
          add(1100, 720, 'fish-rack');
          // Raised freshwater hummocks grade into the coastal salt marsh.
          for (const [cx, cy] of [
            [620, 2250],
            [970, 2420],
            [1360, 2300],
            [2330, 2450],
            [2610, 2550],
            [2700, 1160],
            [2670, 1920],
          ])
            for (let j = 0; j < 9; j++) {
              const a = j * 2.4,
                r = 60 + (j % 3) * 42;
              add(
                cx + Math.cos(a) * r,
                cy + Math.sin(a) * r,
                j % 4 === 0
                  ? 'mangrove'
                  : j % 3 === 0
                    ? 'marsh-bush'
                    : j % 2
                      ? 'reeds'
                      : 'wet-grass',
              );
            }
          // A working landing with sheltered records, lamps, seats and fishing gear.
          for (const [x, y, kind] of [
            [1640, 2700, 'fishing-net'],
            [1590, 2640, 'fish-rack'],
            [2030, 2630, 'lean-to'],
            [2050, 2590, 'shelf'],
            [2060, 2700, 'scroll-stack'],
            [1590, 2740, 'drift-seat'],
            [1650, 2810, 'driftwood'],
            [1710, 2670, 'roadside-lantern'],
            [1855, 2740, 'roadside-lantern'],
            [1970, 2770, 'grave-lamp'],
            [2020, 2480, 'grave-lamp'],
            [1710, 2510, 'roadside-lantern'],
          ])
            add(x, y, kind);
          z.coastalSwampVersion = 1;
        } finally {
          this.s.zone = before;
        }
      }
      lanternFerryReason(direction = 1) {
        if (this.zoneId !== 'march' || direction !== 1 || !this.night() || this.peace) return '';
        const z = this.zone(),
          living = z.enemies.filter(
            (e) => e.species === 'wraith' && e.nightOnly && e.hp > 0,
          ).length,
          pending = Object.values(this.s.pending).some(
            (p) =>
              p.zone === 'march' &&
              p.kind === 'mob' &&
              p.base?.nightOnly &&
              p.base.species === 'wraith' &&
              !p.active,
          );
        return living || pending || !z.nightSpawned
          ? 'Lantern Shore is held by the night Wraiths. Clear them before departure, or wait for daylight.'
          : '';
      }
      lanternShoreLayout(z) {
        if (z.id !== 'march') return;
        const cfg = R.creatureStrongholds.find((h) => h.id === 'lantern-wraith-hold');
        if (z.lanternShoreVersion === cfg.relocationVersion) return;
        const before = this.s.zone;
        this.s.zone = z.id;
        try {
          const center = this.creatureStrongholdCenter(z, cfg),
            site = z.npcs.find((n) => n.id === cfg.site);
          if (site) Object.assign(site, center);
          // Retain the hidden source's identity, remaining amount and discovery.
          for (const node of z.nodes.filter((n) => n.site === cfg.site)) {
            const plan = R.tributePlans.march.find((p) => p.id === node.tributeId),
              [dx, dy] = plan?.offset || [80, 60];
            Object.assign(node, this.safe(center.x + dx, center.y + dy, z.id));
          }
          // Only this ruin is rebuilt; the Mire/Reed-beast homes stay untouched.
          this.creatureStrongholds(z, cfg.id);
          for (const [j, [x, y]] of [
            [2080, 2480],
            [2110, 2710],
          ].entries())
            if (!this.blocked(x, y, z.id, 26, true) && this.distanceToRoad(z, { x, y }) > 85)
              z.props.push({
                id: 'stronghold-' + cfg.id + '-quay-' + j,
                x,
                y,
                r: 26,
                structure: 'stonewall',
                stronghold: cfg.id,
                strongholdDefenseStyle: 'ruin',
              });

          const placed = [],
            spots = [
              ...cfg.nightSpots,
              ...Array.from({ length: 24 }, (_, j) => [
                Math.cos((j * Math.PI) / 12) * 155,
                Math.sin((j * Math.PI) / 12) * 155,
              ]),
            ],
            move = (e) => {
              const point = spots
                .map(([dx, dy]) => ({ x: center.x + dx, y: center.y + dy }))
                .find(
                  (p) => !this.blocked(p.x, p.y, z.id, 15) && placed.every((q) => dist(p, q) >= 40),
                );
              if (!point) return;
              e.home = { ...point };
              Object.assign(e, point);
              e.stronghold = cfg.id;
              this.clearEncounterState(e);
              e.aggro = false;
              e.returning = false;
              delete e.path;
              delete e.pathTarget;
              delete e.idleWanderTarget;
              placed.push(point);
            };
          for (const e of z.enemies.filter((e) => e.species === cfg.nightSpecies && e.nightOnly))
            move(e);
          for (const p of Object.values(this.s.pending))
            if (
              p.zone === z.id &&
              p.kind === 'mob' &&
              p.base?.nightOnly &&
              p.base.species === cfg.nightSpecies
            ) {
              p.base.home = { ...center };
              Object.assign(p.base, center);
              p.base.stronghold = cfg.id;
            }
          z.lanternShoreVersion = cfg.relocationVersion;
        } finally {
          this.s.zone = before;
        }
      }
      creatureStrongholdCenter(z, cfg) {
        if (cfg.site) {
          const site = R.sites[this.regionIndex(z.id)].find(([id]) => id === cfg.site);
          if (site) return { x: site[2], y: site[3] };
        }
        return cfg.center ? { x: cfg.center[0], y: cfg.center[1] } : null;
      }
      creatureStrongholds(z, onlyId = null) {
        const strongholdVersion = { crown: 10, highlands: 9, frontier: 9 }[z.id] || 8;
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          this.sideDungeon(z.id) ||
          (!onlyId && z.creatureStrongholdsVersion === strongholdVersion)
        )
          return;
        const plans = (R.creatureStrongholds || []).filter(
            (s) => s.region === z.id && (!onlyId || s.id === onlyId),
          ),
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          z.props = z.props.filter((p) =>
            onlyId
              ? p.stronghold !== onlyId &&
                !String(p.id || '').startsWith('stronghold-' + onlyId + '-')
              : !String(p.id || '').startsWith('stronghold-'),
          );
          const roadNear = (p, margin = 55) =>
            z.roads?.some((path) =>
              path.some((b, j) => j && this.distanceToSegment(p, path[j - 1], b) < margin),
            );
          const occupied = new Set();
          for (const cfg of plans) {
            // Saved landmarks must follow an authored fort relocation before garrison placement.
            if (cfg.reanchorSite && cfg.site) {
              const canonical = R.sites[this.regionIndex(z.id)].find(([id]) => id === cfg.site),
                landmark = z.npcs.find((n) => n.id === cfg.site);
              if (canonical && landmark)
                Object.assign(landmark, this.safe(canonical[2], canonical[3], z.id));
            }
            const center = this.creatureStrongholdCenter(z, cfg);
            if (!center) continue;
            // Replace light habitat dressing around the hold with a more deliberate territorial layout.
            z.props = z.props.filter(
              (p) =>
                !(String(p.id || '').startsWith('world-life-habitat-') && dist(p, center) < 175),
            );
            let livedInCount = 0;
            const placedStructures = new Set();
            for (const [j, [dx, dy, structure]] of (cfg.props || []).entries()) {
              let p = { x: center.x + dx, y: center.y + dy };
              try {
                p = this.safe(p.x, p.y, z.id);
              } catch (_) {
                continue;
              }
              if (roadNear(p, 42)) continue;
              z.props.push({
                id: 'stronghold-' + cfg.id + '-prop-' + j,
                ...p,
                r: 0,
                decorative: true,
                structure,
                stronghold: cfg.id,
                strongholdDefenseStyle: cfg.defenseStyle || 'ruin',
              });
              placedStructures.add(structure);
              livedInCount++;
            }
            // A road can clip the original domestic layout, but a stronghold must still read as a place somebody lives in.
            if (livedInCount < 5 && cfg.props?.length) {
              const fallback = [];
              for (const radius of [105, 145, 190, 235])
                for (let n = 0; n < 16; n++) {
                  const a = (n * Math.PI) / 8 + 0.3;
                  fallback.push({
                    x: center.x + Math.cos(a) * radius,
                    y: center.y + Math.sin(a) * radius,
                  });
                }
              let cursor = 0;
              for (const q of fallback) {
                if (livedInCount >= 5) break;
                if (
                  roadNear(q, 48) ||
                  this.blocked(q.x, q.y, z.id, 8, true) ||
                  z.nodes.some((n) => n.amount > 0 && dist(n, q) < 55) ||
                  z.npcs.some((n) => dist(n, q) < 55) ||
                  z.props.some((p) => p.stronghold === cfg.id && dist(p, q) < 34)
                )
                  continue;
                let p;
                try {
                  p = this.safe(q.x, q.y, z.id);
                } catch (_) {
                  continue;
                }
                if (roadNear(p, 48)) continue;
                const source = cfg.props[cursor++ % cfg.props.length],
                  structure = source[2];
                z.props.push({
                  id: 'stronghold-' + cfg.id + '-lived-' + livedInCount,
                  ...p,
                  r: 0,
                  decorative: true,
                  structure,
                  stronghold: cfg.id,
                  strongholdDefenseStyle: cfg.defenseStyle || 'ruin',
                });
                placedStructures.add(structure);
                livedInCount++;
              }
            }
            const ring =
              cfg.defenseStyle === 'fort'
                ? [
                    // Raider redoubt: a real collision-bearing perimeter with
                    // a single north gate wide enough for the existing squad.
                    ...Array.from({ length: 7 }, (_, k) => [-150 + k * 50, -150]).filter(
                      ([x]) => x !== 0 && x !== 50,
                    ),
                    ...Array.from({ length: 7 }, (_, k) => [-150 + k * 50, 150]),
                    ...Array.from({ length: 5 }, (_, k) => [-150, -100 + k * 50]),
                    ...Array.from({ length: 5 }, (_, k) => [150, -100 + k * 50]),
                  ]
                : [
                    [-145, -105],
                    [-70, -145],
                    [70, -145],
                    [145, -105],
                    [155, 20],
                    [115, 120],
                    [40, 155],
                    [-40, 155],
                    [-115, 120],
                    [-155, 20],
                  ];
            let wallCount = 0;
            for (const [j, [dx, dy]] of ring.entries()) {
              let p = { x: center.x + dx, y: center.y + dy };
              if (
                roadNear(p, 85) ||
                this.blocked(p.x, p.y, z.id, 28, true) ||
                z.nodes.some((n) => n.amount > 0 && dist(n, p) < 85)
              )
                continue;
              z.props.push({
                id: 'stronghold-' + cfg.id + '-wall-' + j,
                ...p,
                r: 26,
                structure: cfg.wall || 'stockade',
                stronghold: cfg.id,
                strongholdDefenseStyle: cfg.defenseStyle || 'ruin',
                fortCorner:
                  cfg.defenseStyle === 'fort' && Math.abs(dx) === 150 && Math.abs(dy) === 150,
              });
              wallCount++;
            }
            // Road-adjacent holds still get a partial defensive backstop on whichever side has room.
            if (!wallCount) {
              const fallback = [
                [-240, -185],
                [0, -250],
                [240, -185],
                [255, 40],
                [190, 215],
                [0, 260],
                [-190, 215],
                [-255, 40],
              ];
              for (const [j, [dx, dy]] of fallback.entries()) {
                const p = { x: center.x + dx, y: center.y + dy };
                if (
                  roadNear(p, 90) ||
                  this.blocked(p.x, p.y, z.id, 28, true) ||
                  z.nodes.some((n) => n.amount > 0 && dist(n, p) < 90) ||
                  z.npcs.some((n) => dist(n, p) < 85)
                )
                  continue;
                z.props.push({
                  id: 'stronghold-' + cfg.id + '-backstop-' + j,
                  ...p,
                  r: 26,
                  structure: cfg.wall || 'stockade',
                  stronghold: cfg.id,
                  strongholdDefenseStyle: cfg.defenseStyle || 'ruin',
                  fortCorner: cfg.defenseStyle === 'fort' && j % 2 === 0,
                });
                if (++wallCount >= 3) break;
              }
            }
            // Existing camps sometimes squeeze six furnishings into a tiny
            // cluster. Redistribute only their nonblocking domestic scenery.
            // Existing site, enemy homes, boss patrols and encounter geometry
            // stay where they are; tight/unsafe parcels are left untouched.
            const living = z.props
              .filter((p) => p.stronghold === cfg.id && p.decorative && !p.roadTrace)
              .sort((a, b) => String(a.id).localeCompare(String(b.id)));
            const resolved = [];
            for (const item of living) {
              const maxLivingRadius = cfg.defenseStyle === 'fort' ? 135 : 255;
              const clear = (p) =>
                dist(p, center) <= maxLivingRadius &&
                !this.blocked(p.x, p.y, z.id, 10, true) &&
                !roadNear(p, 70) &&
                !z.npcs.some((n) => dist(n, p) < 72) &&
                !z.nodes.some((n) => n.amount > 0 && dist(n, p) < 65) &&
                !z.props.some(
                  (wall) => wall.stronghold === cfg.id && wall.r > 0 && dist(wall, p) < wall.r + 31,
                ) &&
                !resolved.some((other) => dist(other, p) < 88);
              if (!clear(item)) {
                const old = { x: item.x, y: item.y };
                let destination = null;
                for (const radius of cfg.defenseStyle === 'fort'
                  ? [90, 110, 125, 65, 35]
                  : [120, 150, 180, 215, 245, 95, 65, 35]) {
                  for (let j = 0; j < 24; j++) {
                    const angle = (j * Math.PI) / 12;
                    const p = {
                      x: center.x + Math.cos(angle) * radius,
                      y: center.y + Math.sin(angle) * radius,
                    };
                    if (clear(p)) {
                      destination = p;
                      break;
                    }
                  }
                  if (destination) break;
                }
                if (destination) Object.assign(item, destination);
                else if (resolved.length >= 5) {
                  // Avoid cramming a sixth/seventh nonfunctional prop on top
                  // of established domestic scenes in an unsuitable corner.
                  z.props.splice(z.props.indexOf(item), 1);
                  continue;
                } else Object.assign(item, old);
              }
              resolved.push(item);
            }
            if (cfg.night) continue;
            const candidates = z.enemies
              .filter(
                (e) =>
                  e.type === 'mob' &&
                  e.form === 'normal' &&
                  !e.guard &&
                  !e.mini &&
                  !e.summon &&
                  !e.nightOnly &&
                  !e.captain &&
                  !e.roomCaptain &&
                  !e.sideDungeon &&
                  e.species === cfg.species &&
                  !occupied.has(e.id),
              )
              .sort(
                (a, b) =>
                  (a.site === cfg.site ? -1 : 0) - (b.site === cfg.site ? -1 : 0) ||
                  this.idOrder(a, b),
              )
              .slice(0, cfg.guardCount || 3);
            const spots = [
              [-95, -20],
              [-25, -95],
              [80, -65],
              [100, 35],
              [20, 105],
              [-85, 75],
            ];
            for (const [j, e] of candidates.entries()) {
              const [dx, dy] = spots[j % spots.length],
                p = this.safe(center.x + dx, center.y + dy, z.id);
              e.home = { ...p };
              if (e.hp > 0 && !e.aggro) Object.assign(e, p);
              e.stronghold = cfg.id;
              e.strongholdResident = true;
              e.pack = 'stronghold-' + cfg.id + '-' + Math.floor(j / 3);
              if (cfg.site) e.site = cfg.site;
              occupied.add(e.id);
            }
          }
          if (!onlyId) z.creatureStrongholdsVersion = strongholdVersion;
        } finally {
          this.s.zone = oldZone;
        }
      }
      sideInteriors(z) {
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          this.sideDungeon(z.id) ||
          z.sideEntranceVersion === 2
        )
          return;
        const configs = (R.sideDungeons || []).filter((d) => d.region === z.id),
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          z.props = z.props.filter((p) => !String(p.id || '').startsWith('side-entrance-'));
          const roadNear = (p, margin = 50) =>
              z.roads?.some((path) =>
                path.some((b, j) => j && this.distanceToSegment(p, path[j - 1], b) < margin),
              ),
            approach = {
              cellar: ['stump', 'crate', 'fallen-log'],
              flooded: ['reeds', 'driftwood', 'fishing-net'],
              keep: ['rock-cluster', 'stone-marker', 'weapon-rack'],
              shrine: ['ash-patch', 'bone-pile', 'stolen-goods'],
              foundry: ['black-rock', 'ember-pit', 'supply-stack'],
            };
          for (const cfg of configs) {
            let n = z.npcs.find((n) => n.id === cfg.site);
            const source = R.sites[this.regionIndex(z.id)].find((s) => s[0] === cfg.site);
            if (!source) continue;
            const p = this.safe(source[2], source[3], z.id),
              data = {
                id: cfg.site,
                name: cfg.name,
                kind: 'dungeon',
                family: cfg.id,
                sideDungeon: true,
                ...p,
                icon: '🏚️',
              };
            if (n) Object.assign(n, data);
            else {
              n = data;
              z.npcs.push(n);
            }
            for (const [j, structure] of (approach[cfg.theme] || []).entries()) {
              const a = -0.6 + j * 2.15,
                q = this.safe(p.x + Math.cos(a) * 78, p.y + Math.sin(a) * 68, z.id);
              if (roadNear(q)) continue;
              z.props.push({
                id: 'side-entrance-' + cfg.id + '-' + j,
                ...q,
                r: 0,
                decorative: true,
                structure,
              });
            }
          }
          z.sideEntranceVersion = 2;
        } finally {
          this.s.zone = oldZone;
        }
      }
      supplyInteriors(z) {
        const room = R.supplyRooms.find((r) => r.region === z.id);
        if (!room) return;
        if (z.supplyRoomVersion === 6) return;
        const oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          z.npcs = z.npcs.filter((n) => n.kind !== 'bundle');
          const center = this.fieldCenter(this.regionIndex(z.id)),
            off = room.entryOffset || [240, -160],
            target = this.safe(center.x + off[0], center.y + off[1], z.id),
            existing = z.npcs.find((n) => n.id === 'supply-entrance'),
            data = {
              ...target,
              id: 'supply-entrance',
              name: room.name,
              kind: 'dungeon',
              family: room.id,
              treasury: true,
              treasuryBoss: room.boss,
              icon: '🗝️',
            };
          if (existing) Object.assign(existing, data);
          else z.npcs.push(data);
          z.props = z.props.filter((p) => !String(p.id || '').startsWith('treasury-approach-'));
          const roadNear = (p, margin = 50) =>
              z.roads?.some((path) =>
                path.some((b, j) => j && this.distanceToSegment(p, path[j - 1], b) < margin),
              ),
            dressing =
              {
                thorn: ['fang-trophy', 'stolen-goods', 'thorn-bed'],
                mire: ['reed-nest', 'fish-rack', 'shell-hoard'],
                ridge: ['trophy-rack', 'stone-seat', 'weapon-rack'],
                cindermaw: ['roost', 'ember-pit', 'bone-pile'],
              }[room.boss] || [];
          for (const [j, structure] of dressing.entries()) {
            const a = -0.55 + j * 2.1,
              q = this.safe(target.x + Math.cos(a) * 88, target.y + Math.sin(a) * 72, z.id);
            if (roadNear(q)) continue;
            z.props.push({ id: 'treasury-approach-' + j, ...q, r: 0, decorative: true, structure });
          }
          z.supplyRoomVersion = 6;
        } finally {
          this.s.zone = oldZone;
        }
      }
      localSites(z) {
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          this.sideDungeon(z.id) ||
          z.localSitesVersion === 3
        )
          return;
        const i = this.regionIndex(z.id),
          refuges = [D.towns[i], D.minors[i]],
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          for (const n of z.npcs.filter((n) => n.kind === 'landmark')) {
            const source = R.sites[i].find((a) => a[0] === n.id);
            if (source) Object.assign(n, this.safe(source[2], source[3], z.id));
          }
          z.npcs = z.npcs.filter((n) => n.kind !== 'bundle');
          const targets = z.npcs.filter(
              (n) => n.kind === 'landmark' && !n.internalSite && !n.id.startsWith('bridge-'),
            ),
            packs = [
              ...new Set(
                z.enemies
                  .filter(
                    (e) =>
                      e.type === 'mob' && e.pack && !e.guard && !e.summon && e.form === 'normal',
                  )
                  .map((e) => e.pack),
              ),
            ];
          targets.forEach((site, j) => {
            const pack = packs[j];
            if (!pack) return;
            z.enemies
              .filter((e) => e.pack === pack)
              .forEach((e, k) => {
                let p = null;
                for (let t = 0; t < 24; t++) {
                  const a = ((t + k * 3) * Math.PI) / 12,
                    candidate = {
                      x: site.x + Math.cos(a) * (85 + Math.floor(k / 2) * 35),
                      y: site.y + Math.sin(a) * (85 + Math.floor(k / 2) * 35),
                    };
                  if (
                    this.blocked(candidate.x, candidate.y, z.id) ||
                    refuges.some(([x, y]) => dist(candidate, { x, y }) < 260) ||
                    !this.line(candidate, site)
                  )
                    continue;
                  p = candidate;
                  break;
                }
                if (!p) p = this.safe(site.x + 70, site.y + 45, z.id);
                e.home = { ...p };
                e.site = site.id;
                if (e.hp > 0 && !e.aggro) Object.assign(e, p);
              });
          });
          z.localSitesVersion = 3;
        } finally {
          this.s.zone = oldZone;
        }
      }
      resourceDeposits(z) {
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          this.sideDungeon(z.id) ||
          z.resourceDepositsVersion === 2
        )
          return;
        const plan = R.tributePlans?.[z.id] || [],
          total = R.tributeTotal || 640,
          legacyNodes = (z.nodes || []).filter((n) => !n.tribute),
          legacyRemaining = legacyNodes.reduce((sum, n) => sum + (Number(n.amount) || 0), 0),
          legacyCap = R.legacyResourceTotals?.[z.id] || 0,
          recorded = Math.max(0, Math.floor(this.s.gathered?.[z.id] || 0)),
          inferred =
            recorded > 0
              ? recorded
              : legacyNodes.length && legacyCap
                ? Math.max(0, legacyCap - legacyRemaining)
                : 0,
          already = Math.min(total, inferred),
          remaining = Math.max(0, total - already),
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          if (already > recorded) this.s.gathered[z.id] = already;
          const raw = plan.map((s) => Math.floor((remaining * s.amount) / total)),
            left = remaining - raw.reduce((a, b) => a + b, 0);
          for (let j = 0; j < left; j++) raw[j % raw.length]++;
          z.nodes = [];
          for (const [j, source] of plan.entries()) {
            const site = z.npcs.find((n) => n.id === source.site);
            if (!site) continue;
            const off = source.offset || [80, 60],
              p = this.safe(site.x + off[0], site.y + off[1], z.id),
              id = 'tribute-' + z.id + '-' + source.id;
            z.nodes.push({
              id,
              ...p,
              amount: raw[j] || 0,
              icon: '🪙',
              site: source.site,
              siteName: site.name,
              name: 'Dark Lord Tribute',
              kind: 'resource',
              tribute: true,
              tributeId: source.id,
              hidden: !!source.hidden,
              context: source.context || 'tribute stores',
              resourceGroup: 'tribute-' + z.id,
            });
            if (!source.hidden && this.s.discovered[z.id + ':' + source.site])
              this.s.discovered[z.id + ':tribute:' + source.id] = true;
          }
          z.resourceDepositsVersion = 2;
        } finally {
          this.s.zone = oldZone;
        }
      }
      retireResourceMini(z) {
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          this.sideDungeon(z.id) ||
          z.resourceMiniRetiredVersion === 1
        )
          return;
        const id = 'resource-' + z.id,
          i = this.regionIndex(z.id),
          r = D.regions[i],
          hadLegacyMini =
            (z.minis || []).some((m) => m.id === id) ||
            z.npcs.some((n) => n.mini === id) ||
            z.props.some(
              (p) => p.mini === id || String(p.id || '').startsWith('mini-wall-' + id + '-'),
            ) ||
            z.enemies.some((e) => e.mini === id);
        z.minis = (z.minis || []).filter((m) => m.id !== id);
        z.npcs = z.npcs.filter((n) => !(n.kind === 'mini' && n.mini === id));
        z.props = z.props.filter(
          (p) => p.mini !== id && !String(p.id || '').startsWith('mini-wall-' + id + '-'),
        );
        for (const e of z.enemies.filter((e) => e.mini === id)) {
          delete e.mini;
          e.guard = false;
          e.name = e.name.replace(/ guardian$/, '');
          e.gold = this.regionalEnemyRewards(i).gold;
          e.xp = this.regionalEnemyRewards(i).xp;
          delete e.miniRewardVersion;
          e.pack =
            'retired-resource-patrol-' + Math.floor((Number(e.id?.split('-').at(-1)) || 0) / 3);
        }
        for (const n of z.nodes || []) delete n.mini;
        if (hadLegacyMini) delete z.resourceDepositsVersion;
        z.resourceMiniRetiredVersion = 1;
      }
      openResourceMini(z) {
        this.retireResourceMini(z);
      }
      spreadOutdoorForces(z) {
        if (dungeonIds.includes(z.id) || this.supplyRoom(z.id) || z.outdoorOccupationVersion === 2)
          return;
        const i = this.regionIndex(z.id),
          fieldBoss = D.bosses.find((b) => b.region === z.id && b.kind === 'field'),
          center = this.fieldCenter(i),
          fieldId = 'field-' + fieldBoss.id,
          town = { x: D.towns[i][0], y: D.towns[i][1] },
          minor = { x: D.minors[i][0], y: D.minors[i][1] },
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          const mini = z.minis?.find((m) => m.id === fieldId),
            normalBoss = z.enemies.find(
              (e) => e.type === 'boss' && e.family === fieldBoss.id && e.form === 'normal',
            ),
            oldCenter = mini
              ? { x: mini.x, y: mini.y }
              : normalBoss?.home || { x: D.fields[i][0], y: D.fields[i][1] },
            dx = center.x - oldCenter.x,
            dy = center.y - oldCenter.y;
          if (Math.hypot(dx, dy) > 5) {
            const nearRoad = (p) =>
              z.roads?.some((path) =>
                path.some(
                  (b, j) => j && this.distanceToSegment(p, path[j - 1], b) < (p.r || 20) + 55,
                ),
              );
            const shifted = (p) => this.safe(p.x + dx, p.y + dy, z.id);
            if (mini) {
              mini.x = center.x;
              mini.y = center.y;
              mini.trapPosts = (mini.trapPosts || [])
                .map((p) => ({ ...p, ...shifted(p) }))
                .filter((p) => !nearRoad({ ...p, r: 20 }));
            }
            z.props = z.props.filter((p) => {
              if (p.mini !== fieldId) return true;
              const q = shifted(p);
              if (nearRoad({ ...q, r: p.r || 20 })) return false;
              Object.assign(p, q);
              return true;
            });
            const cage = z.npcs.find((n) => n.kind === 'cage' && n.family === fieldBoss.id);
            if (cage) Object.assign(cage, this.safe(center.x + 90, center.y + 80, z.id));
            const marker = z.npcs.find((n) => n.kind === 'mini' && n.mini === fieldId);
            if (marker) Object.assign(marker, this.safe(center.x - 130, center.y - 10, z.id));
            for (const e of z.enemies.filter((e) => e.mini === fieldId)) {
              const q = shifted(e.home);
              e.home = { ...q };
              if (e.hp > 0 && !e.aggro) Object.assign(e, q);
            }
            if (normalBoss) {
              normalBoss.home = { ...center };
              if (normalBoss.hp > 0 && !normalBoss.aggro) Object.assign(normalBoss, center);
            }
            const pending = this.s.pending[fieldBoss.id];
            if (pending?.kind === 'field' && pending.zone === z.id) {
              pending.base.home = { ...center };
              pending.base.x = center.x;
              pending.base.y = center.y;
            }
          }
          const allPacks = [
              ...new Set(
                z.enemies
                  .filter(
                    (e) =>
                      e.type === 'mob' &&
                      e.pack &&
                      !e.summon &&
                      !e.nightOnly &&
                      e.form === 'normal',
                  )
                  .map((e) => e.pack),
              ),
            ],
            packs = allPacks.filter((pack) =>
              z.enemies
                .filter((e) => e.pack === pack)
                .every(
                  (e) =>
                    !e.guard &&
                    !e.mini &&
                    !e.site &&
                    !e.summon &&
                    !e.nightOnly &&
                    e.form === 'normal',
                ),
            ),
            anchors = R.occupationAnchors?.[i] || [],
            used = [];
          for (let pi = 0; pi < packs.length; pi++) {
            let anchor = null;
            for (let step = 0; step < anchors.length; step++) {
              const [ax, ay] = anchors[(pi * 3 + step) % anchors.length];
              let p;
              try {
                p = this.safe(ax, ay, z.id);
              } catch (_) {
                continue;
              }
              if (
                dist(p, town) < 390 ||
                dist(p, minor) < 320 ||
                dist(p, center) < 380 ||
                z.npcs.some((n) => dist(p, n) < 150) ||
                used.some((q) => dist(p, q) < 220)
              )
                continue;
              anchor = p;
              break;
            }
            if (!anchor) continue;
            used.push(anchor);
            const members = z.enemies
              .filter((e) => e.pack === packs[pi])
              .sort((a, b) => this.idOrder(a, b));
            for (let k = 0; k < members.length; k++) {
              const a = k * 2.3999632297,
                r = 35 + Math.floor(k / 2) * 28,
                q = this.safe(anchor.x + Math.cos(a) * r, anchor.y + Math.sin(a) * r, z.id),
                e = members[k];
              e.home = { ...q };
              if (e.hp > 0 && !e.aggro) Object.assign(e, q);
            }
          }
          z.outdoorOccupationVersion = 2;
        } finally {
          this.s.zone = oldZone;
        }
      }
      repairMiniGuardianReachability(z) {
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          !z.minis?.length ||
          z.miniReachabilityVersion === 1
        )
          return;
        const oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          const occupied = [];
          for (const e of z.enemies.filter((e) => e.guard && e.mini)) {
            const mini = z.minis.find((m) => m.id === e.mini);
            if (!mini) continue;
            let marker = z.npcs.find((n) => n.kind === 'mini' && n.mini === mini.id);
            if (!marker) marker = this.safe(mini.x - 130, mini.y - 10, z.id);
            if (
              !this.blocked(e.home.x, e.home.y, z.id, 15) &&
              this.clearSegment(marker, e.home, 15)
            ) {
              occupied.push(e.home);
              continue;
            }
            let replacement = null;
            for (const radius of [70, 100, 130, 160, 190, 220]) {
              for (let n = 0; n < 24; n++) {
                const a = (n * Math.PI) / 12,
                  p = { x: mini.x + Math.cos(a) * radius, y: mini.y + Math.sin(a) * radius };
                if (
                  this.blocked(p.x, p.y, z.id, 15) ||
                  occupied.some((q) => dist(q, p) < 42) ||
                  !this.clearSegment(marker, p, 15)
                )
                  continue;
                replacement = p;
                break;
              }
              if (replacement) break;
            }
            if (replacement) {
              e.home = { ...replacement };
              if (e.hp > 0 && !e.aggro) Object.assign(e, replacement);
              occupied.push(replacement);
            }
          }
          z.miniReachabilityVersion = 1;
        } finally {
          this.s.zone = oldZone;
        }
      }
      miniDungeons(z) {
        if (dungeonIds.includes(z.id) || this.supplyRoom(z.id) || this.sideDungeon(z.id)) return;
        this.retireResourceMini(z);
        if (z.minisVersion === 2) return;
        const i = this.regionIndex(z.id),
          r = D.regions[i],
          plan = R.miniPlans[i],
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          const family = D.bosses.find((b) => b.region === z.id && b.kind === 'field').id,
            field = this.fieldCenter(i),
            id = 'field-' + family,
            existing = (z.minis || []).find((m) => m.id === id);
          if (existing) {
            if (z.minisVersion !== 2 && (this.s.normal[family] || this.s.rescued[family])) {
              existing.cleared = true;
              for (const e of z.enemies.filter((e) => e.mini === id)) {
                e.hp = 0;
                e.deathPaid = true;
              }
            }
            z.minis = [existing];
            z.minisVersion = 2;
            return;
          }
          z.minis = [];
          const inherited = !!this.s.normal[family] || !!this.s.rescued[family],
            mini = {
              id,
              type: 'field',
              family,
              site: null,
              name: plan.field,
              x: field.x,
              y: field.y,
              cleared: inherited,
              trapPosts: [],
            };
          z.minis.push(mini);
          const roads = (p) =>
              z.roads.some((path) =>
                path.some((b, j) => j && this.distanceToSegment(p, path[j - 1], b) < p.r + 60),
              ),
            posts = [
              [-190, -190],
              [-120, -190],
              [-50, -190],
              [70, -190],
              [140, -190],
              [190, -190],
              [-190, -120],
              [-190, 0],
              [-190, 120],
              [-190, 190],
              [-120, 190],
              [-50, 190],
              [70, 190],
              [140, 190],
              [190, 190],
              [190, 120],
              [190, 0],
              [190, -120],
              [-95, -65],
              [90, -75],
              [0, 140],
            ];
          for (const [j, [dx, dy]] of posts.entries()) {
            const p = { x: field.x + dx, y: field.y + dy, r: j < 18 ? 27 : 30 };
            if (
              this.blocked(p.x, p.y, z.id, p.r + 15) ||
              roads(p) ||
              z.npcs.some((n) => dist(n, p) < p.r + 65) ||
              z.nodes.some((n) => dist(n, p) < p.r + 65) ||
              z.enemies.some((e) => e.type === 'boss' && dist(e.home, p) < 90) ||
              (z.id === oldZone && dist(this.hero, p) < 80)
            )
              continue;
            z.props.push({
              id: 'mini-wall-' + id + '-' + j,
              ...p,
              structure: j < 18 ? plan.theme : 'pillar',
              mini: id,
              icon: '🪨',
            });
          }
          const count = 4 + i * 2,
            pool = z.enemies.filter(
              (e) =>
                e.type === 'mob' &&
                !e.guard &&
                !e.summon &&
                !e.mini &&
                !e.nightOnly &&
                e.form === 'normal',
            ),
            preferredSpecies = D.species[i][1][0],
            preferred = pool
              .filter((e) => e.species === preferredSpecies)
              .sort((a, b) => this.idOrder(a, b)),
            candidates = (
              preferred.length >= count ? preferred : pool.sort((a, b) => this.idOrder(a, b))
            ).slice(0, count),
            offsets = [
              [-250, -100],
              [-250, -25],
              [-110, -250],
              [-25, -250],
              [150, 110],
              [180, 40],
              [30, 180],
              [-60, 160],
              [100, -10],
              [70, 70],
              [-120, 60],
              [-100, -90],
            ];
          candidates.forEach((e, j) => {
            const [dx, dy] = offsets[j % offsets.length],
              p = this.safe(field.x + dx, field.y + dy, z.id);
            Object.assign(e, p);
            e.home = { ...p };
            e.guard = true;
            e.mini = id;
            e.pack = id + '-guard-pair-' + Math.floor(j / 2);
            e.name = e.name.replace(/ guardian$/, '') + ' guardian';
            e.gold = this.regionalEnemyRewards(i, 'roomGuard').gold;
            e.xp = this.regionalEnemyRewards(i, 'roomGuard').xp;
            e.miniRewardVersion = 1;
            if (inherited) {
              e.hp = 0;
              e.deathPaid = true;
            }
            this.configureEnemy(e, j);
          });
          const p = { x: field.x + 50, y: field.y + 65 },
            kinds = R.outdoorMiniTrapKinds[z.id] || ['spikes'];
          if (
            !this.blocked(p.x, p.y) &&
            !roads({ ...p, r: 20 }) &&
            !z.npcs.some((n) => dist(n, p) < 65)
          )
            mini.trapPosts.push({ ...p, kind: kinds[0], index: 110 });
          const marker = this.safe(field.x - 130, field.y - 10, z.id);
          z.npcs.push({
            id: 'mini-' + id,
            name: mini.name,
            kind: 'mini',
            mini: id,
            ...marker,
            icon: '🏚️',
          });
          z.minisVersion = 2;
          for (const n of [...z.npcs, ...z.nodes, ...z.enemies.filter((e) => e.hp > 0)])
            if (this.blocked(n.x, n.y, z.id)) Object.assign(n, this.safe(n.x, n.y, z.id));
          for (const e of z.enemies)
            if (this.blocked(e.home.x, e.home.y, z.id))
              e.home = this.safe(e.home.x, e.home.y, z.id);
        } finally {
          this.s.zone = oldZone;
        }
      }
    }
    const methods = Object.getOwnPropertyDescriptors(World.prototype);
    delete methods.constructor;
    Object.defineProperties(Campaign.prototype, methods);
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeWorld = api;
})(typeof window !== 'undefined' ? window : globalThis);
