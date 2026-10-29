/* Greenwood's authored parcels and v4 spatial migration. No encounter/reward rules. */
(function (root) {
  'use strict';
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function projection(size) {
    const extra = size - 2700;
    const axis = (v, knots) => {
      for (let j = 1; j < knots.length; j++) {
        const [a, da] = knots[j - 1],
          [b, db] = knots[j];
        if (v <= b) return v + extra * (da + ((db - da) * (v - a)) / (b - a));
      }
      return v + extra;
    };
    const x = (v) =>
      axis(v, [
        [0, 0],
        [300, 0],
        [900, 0.45],
        [1200, 0.7],
        [2700, 1],
      ]);
    const y = (v) =>
      axis(v, [
        [0, 0],
        [350, 0],
        [700, 0.3],
        [1750, 0.65],
        [2700, 1],
      ]);
    return { x, y, point: (p) => ({ x: x(p.x), y: y(p.y) }) };
  }
  function configure(D, R, size) {
    if (![3200, 3400].includes(size) || D.regions[0].size !== 2700)
      throw Error('Greenwood layout must configure once from its original geometry');
    const map = projection(size),
      { x, y } = map;
    const pair = (p) => {
      p[0] = x(p[0]);
      p[1] = y(p[1]);
    };
    const point = (p) => Object.assign(p, map.point(p));
    const groups = [];
    const group = (id, before, after) => groups.push({ id, before, after });
    for (const h of R.creatureStrongholds.filter((h) => h.region === 'vale')) {
      const s = R.sites[0].find((s) => s[0] === h.site);
      const p = h.center || s?.slice(2, 4);
      if (p) group(h.id, { x: p[0], y: p[1] }, map.point({ x: p[0], y: p[1] }));
    }
    for (const key of ['towns', 'minors', 'ports', 'entrances', 'fields']) pair(D[key][0]);
    D.regions[0].size = size;
    pair(R.fieldBossCenters[0]);
    R.occupationAnchors[0].forEach(pair);
    for (const s of R.sites[0]) {
      s[2] = x(s[2]);
      s[3] = y(s[3]);
    }
    R.terrain[0].forEach(point);
    const b = R.barriers[0],
      mid = (b.bounds[0] + b.bounds[1]) / 2;
    b.bounds[0] += x(mid) - mid;
    b.bounds[1] += x(mid) - mid;
    b.bounds[3] = size;
    b.gaps = b.gaps.map(([a, b]) => {
      const d = y((a + b) / 2) - (a + b) / 2;
      return [a + d, b + d];
    });
    // The main cart crossing retains its original breadth. The southern
    // exploration crossing is a narrower, still companion-safe footbridge;
    // paint and collision consume this same gap table.
    const southMid = (b.gaps[1][0] + b.gaps[1][1]) / 2;
    b.gaps[1] = [southMid - 65, southMid + 65];
    for (const p of R.landforms[0]) {
      if (p.points) p.points.forEach(pair);
      if (p.x !== undefined) point(p);
      if (p.x1 !== undefined) {
        p.x1 = x(p.x1);
        p.x2 = x(p.x2);
        p.y1 = y(p.y1);
        p.y2 = y(p.y2);
      }
    }
    R.forests[0].forEach(pair);
    R.forests[0].push(
      [x(2180), y(1600), 210, 220],
      [x(1430), y(2480), 200, 165],
      [x(300), y(2420), 175, 170],
    );
    R.worldLifePlans[0].civilian.forEach(pair);
    R.worldLifePlans[0].habitats.forEach((h) => pair(h.center));
    R.creatureStrongholds
      .filter((h) => h.region === 'vale' && h.center)
      .forEach((h) => pair(h.center));
    R.regionalHandoffScenes.vale.forEach(pair);
    R.greenwoodRuralScenes.forEach(pair);
    R.thornPatrol.route.forEach(pair);
    point(R.millhavenOnboarding.orchardDoor);
    R.millhavenOnboarding.orchardTrail.forEach(point);
    // The real Hamlet and its orchards share a district. The old onboarding
    // house swap is superseded by a final parcel pass, never by smaller houses.
    D.minors[0] = [x(760), y(850)];
    const orchard = R.sites[0].find((s) => s[0] === 'orchard');
    [orchard[1], orchard[2], orchard[3]] = ['Orchard expansion', x(1000), y(1000)];
    // Separate households/defenses from civilian production rather than
    // transporting the original camp into the middle of the new Hamlet.
    const goblin = R.sites[0].find((s) => s[0] === 'goblin-camp');
    const oldCamp = { x: 520, y: 1050 },
      camp = { x: x(400), y: y(1550) };
    goblin[2] = camp.x;
    goblin[3] = camp.y;
    const roadHome = R.worldLifePlans[0].habitats.find((h) => h.id === 'goblin-road-camp');
    roadHome.center = [camp.x, camp.y];
    groups.find((g) => g.id === 'goblin-road-fort').after = camp;
    group('goblin-road-camp', oldCamp, camp);
    const pond = R.terrain[0][0];
    R.greenwoodLayout = {
      version: 1,
      sceneVersion: 2,
      size,
      groups,
      hamlet: { x: D.minors[0][0] - 220, y: D.minors[0][1] + 20 },
      orchard: { x: orchard[2], y: orchard[3] },
      mill: { x: pond.x + 20, y: pond.y - 180 },
      pond: clone(pond),
    };
    return R.greenwoodLayout;
  }
  function install(C, { D, R }) {
    class Greenwood {
      greenwoodReserve(z) {
        const cfg = R.greenwoodLayout;
        if (z.id !== 'vale' || !cfg?.version) return;
        for (const [id, structure, p, r] of [
          ['greenwood-working-mill', 'vale-working-mill', cfg.mill, 52],
          [
            'greenwood-working-cellar',
            'fruit-cellar',
            { x: cfg.orchard.x - 240, y: cfg.orchard.y + 200 },
            25,
          ],
        ])
          if (!z.props.some((p) => p.id === id))
            z.props.push({
              id,
              structure,
              ...p,
              r,
              roadBlocker: true,
              greenwoodReserved: true,
              greenwoodScene: true,
              decorative: false,
            });
      }

      greenwoodMigrate(z) {
        const cfg = R.greenwoodLayout;
        if (z.id !== 'vale' || !cfg?.version || z.greenwoodSourceVersion === cfg.version) return;
        const map = projection(cfg.size),
          moved = new Set();
        const move = (p, forcedGroup) => {
          if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || moved.has(p)) return;
          moved.add(p);
          const g =
            forcedGroup || cfg.groups.find((g) => g.id === p.stronghold || g.id === p.habitat);
          if (g) {
            p.x += g.after.x - g.before.x;
            p.y += g.after.y - g.before.y;
          } else Object.assign(p, map.point(p));
          if (p.home) move(p.home, g);
          if (p.servicePoint) move(p.servicePoint, g);
          if (p.order && Number.isFinite(p.order.x)) move(p.order, g);
          for (const key of ['path', 'pathTarget', 'idleWanderTarget']) delete p[key];
        };
        for (const p of z.props) p.greenwoodLegacyScenery = true;
        for (const p of [...z.props, ...z.npcs, ...z.enemies, ...z.nodes, ...z.buildings]) move(p);
        for (const m of z.minis || []) {
          move(m);
          if (m.center) move(m.center);
        }
        if (z.thornArrival) {
          move(z.thornArrival.boss);
          move(z.thornArrival.captive);
        }
        for (const p of this.s.loot || []) if (p.zone === z.id) move(p);
        for (const p of Object.values(this.s.pending || {})) if (p.zone === z.id) move(p.base);
        if (this.s.refugeSite?.zone === z.id) move(this.s.refugeSite);
        if (this.s.zone === z.id) for (const p of [this.hero, ...this.s.party]) move(p);
        const previous = this.s.zone;
        this.s.zone = z.id;
        try {
          // Keep old scenery identities BEFORE restore's terrain prune. Water
          // circles/deck widths are not scaled; preserve whole defensive groups.
          for (const p of z.props)
            if (this.blocked(p.x, p.y, z.id, p.r || 0, true)) {
              let selected = null;
              for (const radius of [25, 50, 85, 125, 180, 250, 350]) {
                for (let j = 0; j < 32; j++) {
                  const a = (j * Math.PI) / 16,
                    q = { x: p.x + Math.cos(a) * radius, y: p.y + Math.sin(a) * radius };
                  if (!this.blocked(q.x, q.y, z.id, p.r || 0, true)) {
                    selected = q;
                    break;
                  }
                }
                if (selected) break;
              }
              if (selected) Object.assign(p, selected);
            }
        } finally {
          this.s.zone = previous;
        }
        for (const k of [
          'roadVersion',
          'environmentCoherenceVersion',
          'landmarkRoadShoulderVersion',
          'streetClearanceVersion',
          'townVisualClearanceVersion',
          'greenwoodFrontageVersion',
        ])
          delete z[k];
        // Existing onboarding swaps have already occurred; never swap them again.
        z.greenwoodSourceVersion = cfg.version;
      }
      greenwoodFinish(z) {
        const cfg = R.greenwoodLayout;
        const sceneVersion = cfg?.sceneVersion || cfg?.version;
        if (z.id !== 'vale' || !cfg?.version || z.greenwoodAttemptVersion === sceneVersion) return;
        const previous = this.s.zone;
        this.s.zone = z.id;
        try {
          const n = (id) => z.npcs.find((n) => n.id === id);
          const hamlet = n('minor');
          if (hamlet) {
            let body = null;
            for (const radius of [0, 35, 70, 110, 155, 200, 260, 340]) {
              for (let j = 0; j < (radius ? 24 : 1); j++) {
                const a = (j * Math.PI) / 12,
                  p = {
                    x: cfg.hamlet.x + Math.cos(a) * radius,
                    y: cfg.hamlet.y + Math.sin(a) * radius,
                  };
                if (
                  this.distanceToRoad(z, p) < 180 ||
                  this.blocked(p.x, p.y, z.id, 20) ||
                  this.blocked(p.x + 35, p.y + 100, z.id, 20)
                )
                  continue;
                body = p;
                break;
              }
              if (body) break;
            }
            if (body) Object.assign(hamlet, body);
            hamlet.servicePoint = { x: hamlet.x + 35, y: hamlet.y + 100 };
            if (this.s.refugeSite?.zone === z.id && this.s.refugeSite.id === hamlet.id)
              Object.assign(this.s.refugeSite, hamlet.servicePoint);
          }
          const orchard = n('orchard');
          if (orchard) Object.assign(orchard, cfg.orchard, { name: 'Orchard expansion' });
          const pond = cfg.pond,
            marker = n('mill-pond');
          if (marker) Object.assign(marker, { x: pond.x + 105, y: pond.y + 110 });
          const serviceDoors = z.npcs
            .filter((n) => ['rest', 'supplier', 'recruiter', 'board', 'minor'].includes(n.id))
            .map((n) => n.servicePoint || n);
          const coversDoor = (p) =>
            serviceDoors.some((door) => {
              const dx = (p.x - p.y - door.x + door.y) * 0.76,
                dy = (p.x + p.y - door.x - door.y) * 0.27;
              return Math.abs(dx) < 85 && dy > 0 && dy < 120;
            });
          for (const house of z.props.filter(
            (p) =>
              !p.greenwoodReserved &&
              /cottage|workshop|house/.test(p.structure || '') &&
              coversDoor(p),
          )) {
            let chosen = null;
            for (const d of [80, 130, 190, 260, 340, 440, 540]) {
              for (let j = 0; j < 24; j++) {
                const a = (j * Math.PI) / 12,
                  p = { x: house.x + Math.cos(a) * d, y: house.y + Math.sin(a) * d };
                if (
                  coversDoor(p) ||
                  this.blocked(p.x, p.y, z.id, Math.max(32, house.r || 0), true) ||
                  this.distanceToRoad(z, p) < this.roadSetback(house) ||
                  z.props.some(
                    (q) =>
                      q !== house &&
                      (q.greenwoodReserved
                        ? Math.abs((p.x - p.y - q.x + q.y) * 0.76) < 170 &&
                          Math.abs((p.x + p.y - q.x - q.y) * 0.27) < 150
                        : distance(p, q) < (house.r || 0) + (q.r || 0) + 65),
                  ) ||
                  z.nodes.some((q) => distance(p, q) < 110) ||
                  z.buildings.some((q) => distance(p, q) < 200) ||
                  serviceDoors.some((q) => distance(p, q) < 160)
                )
                  continue;
                chosen = p;
                break;
              }
              if (chosen) break;
            }
            if (chosen) Object.assign(house, chosen);
          }
          const result = [],
            installed = [];
          const fits = (p, radius, roof, self) => {
            const low = self?.structure === 'fruit-cellar';
            if (this.blocked(p.x, p.y, z.id, Math.max(16, radius), true)) return false;
            if (this.distanceToRoad(z, p) < (low ? 110 : roof ? radius + 175 : 72)) return false;
            if (
              z.npcs.some(
                (n) =>
                  distance(p, n.servicePoint || n) < (roof ? 150 : 80) ||
                  (n.kind === 'rest' && distance(p, n) < 100),
              )
            )
              return false;
            if (z.nodes.some((n) => distance(p, n) < (roof ? 110 : 60))) return false;
            if (z.buildings.some((n) => distance(p, n) < (roof ? 210 : 80))) return false;
            if (z.enemies.some((e) => e.hp > 0 && distance(p, e.home || e) < (roof ? 170 : 80)))
              return false;
            return ![...z.props, ...installed].some(
              (q) =>
                q !== self &&
                (roof && q.roadBlocker
                  ? Math.abs((p.x - p.y - q.x + q.y) * 0.76) < (low ? 90 : 135) &&
                    Math.abs((p.x + p.y - q.x - q.y) * 0.27) < (low ? 75 : 115)
                  : distance(p, q) < radius + (q.r || 0) + (low ? 25 : roof ? 55 : 35)),
            );
          };
          const search = (base, radius, roof, self, max = 240) => {
            for (const d of [0, 35, 70, 110, 155, 200, 240, 300, 360, 440, 520].filter(
              (d) => d <= max,
            ))
              for (let j = 0; j < (d ? 24 : 1); j++) {
                const a = (j * Math.PI) / 12,
                  p = { x: base.x + d * Math.cos(a), y: base.y + d * Math.sin(a) };
                if (fits(p, radius, roof, self)) return p;
              }
            return null;
          };
          const add = (id, structure, base, essential = false, radius = 0, roof = false) => {
            let prop = z.props.find((p) => p.id === id);
            const selected = search(
              prop?.greenwoodReserved ? prop : base,
              radius,
              roof,
              prop,
              id === 'greenwood-working-cellar' ? 520 : essential ? 240 : 155,
            );
            result.push({
              id,
              structure,
              essential,
              intended: clone(base),
              placed: !!selected,
              actual: selected,
            });
            if (!selected) return null;
            if (!prop) {
              prop = {
                id,
                r: radius,
                structure,
                decorative: !roof,
                ...(roof ? { roadBlocker: true } : {}),
                greenwoodScene: true,
              };
              z.props.push(prop);
            }
            Object.assign(prop, selected);
            installed.push(prop);
            return prop;
          };
          // Reserve complete essential footprints, retaining every displaced
          // scenery ID. Earlier generic clearance can move a fence or dressing
          // into a reserved parcel after the roads were generated.
          for (const locked of z.props.filter((p) => p.greenwoodReserved)) {
            for (const q of z.props.filter(
              (q) =>
                !q.greenwoodReserved &&
                !q.stronghold &&
                distance(q, locked) < (q.r || 0) + locked.r + 85,
            )) {
              let selected = null;
              for (const d of [100, 155, 220, 300, 390, 500]) {
                for (let j = 0; j < 24; j++) {
                  const a = (j * Math.PI) / 12,
                    p = { x: q.x + Math.cos(a) * d, y: q.y + Math.sin(a) * d };
                  if (
                    this.blocked(p.x, p.y, z.id, Math.max(16, q.r || 0), true) ||
                    this.distanceToRoad(z, p) < this.roadSetback(q) ||
                    z.props.some(
                      (other) =>
                        other !== q &&
                        distance(p, other) <
                          (q.r || 0) + (other.r || 0) + (other.greenwoodReserved ? 100 : 45),
                    ) ||
                    z.npcs.some((n) => distance(p, n.servicePoint || n) < 120) ||
                    z.nodes.some((n) => distance(p, n) < 80) ||
                    z.buildings.some((b) => distance(p, b) < 180)
                  )
                    continue;
                  selected = p;
                  break;
                }
                if (selected) break;
              }
              if (selected) Object.assign(q, selected);
              result.push({
                id: q.id,
                essential: false,
                relocated: !!selected,
                reason: 'reserved working parcel',
              });
            }
          }
          const mill = add('greenwood-working-mill', 'vale-working-mill', cfg.mill, true, 52, true);
          // A dry wheel-side bank is part of the mill, not a second painted pool.
          // Put the controlled outlet on the pond's rim. The former proposal
          // was rejected by terrain clearance and drifted onto dry ground.
          // This is scene revision 2, independent of the one-time expansion.
          const sluice = add(
            'greenwood-mill-sluice',
            'mill-sluice',
            { x: pond.x + 125, y: pond.y - 70 },
            true,
          );
          if (sluice && distance(sluice, pond) > pond.r + 35)
            result.find((p) => p.id === sluice.id).placed = false;
          const orchardBase = cfg.orchard;
          for (const [id, dx, dy, kind] of [
            ['established', -160, 50, 'fruit-tree'],
            ['bearing', -70, 150, 'fruit-tree'],
            ['young', 75, -120, 'sapling'],
            ['new', 170, -35, 'furrow-plot'],
            ['tools', 30, 260, 'farm-tool-rack'],
            ['harvest', -105, 285, 'crate'],
          ])
            add(
              'greenwood-orchard-' + id,
              kind,
              { x: orchardBase.x + dx, y: orchardBase.y + dy },
              true,
            );
          const cellar = add(
            'greenwood-working-cellar',
            'fruit-cellar',
            { x: orchardBase.x - 240, y: orchardBase.y + 200 },
            true,
            25,
            true,
          );
          for (const [name, site, props] of [
            ['cache', n('cache'), ['supply-stack', 'cart', 'scribe-desk']],
            ['estate', n('entrance'), ['stacked-lumber', 'tool-rack', 'estate-scaffold']],
            ['treasury', n('supply-entrance'), ['supply-stack', 'cart']],
          ])
            if (site)
              props.forEach((kind, j) =>
                add(
                  'greenwood-' + name + '-' + j,
                  kind,
                  { x: site.x - 160 + j * 100, y: site.y + 175 },
                  true,
                ),
              );
          // Old v4 zones already own their original nature layout. Add only
          // the three new authored groves, with the same stable patch IDs as
          // fresh generation; never rebuild old props or a player's camps.
          for (let patch = 3; patch < R.forests[0].length; patch++) {
            const prefix = 'forest-' + patch + '-';
            if (z.props.some((p) => String(p.id).startsWith(prefix))) continue;
            const [cx, cy, rx, ry] = R.forests[0][patch];
            let placed = 0;
            for (let k = 0; k < 45 && z.props.length < 380; k++) {
              const a = k * 2.3999632297,
                r = Math.sqrt((k + 0.5) / 45),
                p = { x: cx + Math.cos(a) * rx * r, y: cy + Math.sin(a) * ry * r };
              if (
                this.blocked(p.x, p.y, z.id, 50) ||
                this.distanceToRoad(z, p) < 88 ||
                this.distanceToRoad({ roads: z.footpaths || [] }, p) < 75 ||
                z.npcs.some((n) => distance(p, n.servicePoint || n) < 180) ||
                z.buildings.some((b) => distance(p, b) < 200) ||
                z.enemies.some((e) => distance(p, e.home || e) < 100)
              )
                continue;
              z.props.push({
                id: prefix + k,
                ...p,
                r: 24,
                icon: k % 5 === 0 ? '🪨' : '🌲',
                greenwoodScene: true,
              });
              placed++;
            }
            result.push({
              id: 'woodland-grove-' + patch,
              essential: false,
              authored: 45,
              placed,
              reason:
                'new authored woodland added to existing v4 zone without rebuilding old scenery',
            });
          }
          const destinations = [
            hamlet?.servicePoint,
            orchard,
            marker,
            mill && { x: mill.x + 60, y: mill.y + 95 },
            cellar && { x: cellar.x + 30, y: cellar.y + 65 },
          ].filter(Boolean);
          z.footpaths = (z.footpaths || []).filter((p) =>
            p.every((q, j) => !j || this.clearSegment(p[j - 1], q, 15)),
          );
          for (const door of destinations) {
            const road = this.nearestRoadPoint(z, door),
              path = road && this.route(road, door);
            if (path?.length && distance(path.at(-1), door) < 35) {
              const frontage = [road, ...path];
              if (!z.footpaths.some((p) => JSON.stringify(p) === JSON.stringify(frontage)))
                z.footpaths.push(frontage);
            } else
              result.push({
                id: 'frontage-' + destinations.indexOf(door),
                essential: true,
                placed: false,
              });
          }
          // A late authored mini-wall can miss a road shoulder by a few
          // units. Correct its position within the same compound; keep its
          // identity, radius, guards and doorway instead of narrowing the art.
          for (const prop of z.props.filter((p) => String(p.id).startsWith('mini-wall-'))) {
            const required = this.roadSetback(prop),
              actual = this.distanceToRoad(z, prop);
            if (actual >= required || required - actual > 25) continue;
            const road = this.nearestRoadPoint(z, prop),
              dx = prop.x - road.x,
              dy = prop.y - road.y,
              len = Math.hypot(dx, dy) || 1;
            for (const extra of [10, 20, 35]) {
              const q = { x: prop.x + (dx / len) * extra, y: prop.y + (dy / len) * extra };
              if (
                this.distanceToRoad(z, q) < required ||
                this.blocked(q.x, q.y, z.id, prop.r || 0, true) ||
                z.npcs.some((n) => distance(q, n.servicePoint || n) < 70)
              )
                continue;
              Object.assign(prop, q);
              break;
            }
          }
          z.greenwoodSceneAudit = result;
          z.greenwoodAttemptVersion = sceneVersion;
          if (result.every((p) => !p.essential || p.placed)) z.greenwoodSceneVersion = sceneVersion;
        } finally {
          this.s.zone = previous;
        }
      }
    }
    const methods = Object.getOwnPropertyDescriptors(Greenwood.prototype);
    delete methods.constructor;
    Object.defineProperties(C.prototype, methods);
  }
  const api = { projection, configure, install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeGreenwood = api;
})(typeof window !== 'undefined' ? window : globalThis);
