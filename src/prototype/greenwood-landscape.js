/* Greenwood regional reconstruction. Authored geography, parcels and source-aware v4 moves. */
(function (root) {
  'use strict';
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const point = ([x, y]) => ({ x, y });
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const hash = (s) => {
    let h = 2166136261;
    for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
    return h;
  };
  const plan = {
    town: [650, 600],
    hamlet: [550, 1750],
    orchard: [780, 2100],
    pond: [900, 1260],
    mill: [1200, 1400],
    north: [1670, 1000],
    south: [1740, 2280],
    goblin: [350, 2820],
    cellars: [1080, 2510],
    den: [920, 2880],
    treasury: [2120, 1250],
    cache: [2420, 1690],
    watch: [2670, 2220],
    crypt: [2830, 2850],
    wagon: [2880, 280],
  };
  const river = [
    [0, 1730, 68],
    [450, 1790, 78],
    [1000, 1670, 67],
    [1550, 1500, 88],
    [2280, 1740, 64],
    [2730, 1610, 81],
    [3200, 1770, 95],
  ];
  function riverBanks(y, size = 3200) {
    const s = size / 3200,
      at = y / s;
    let j = river.findIndex((p) => p[0] >= at);
    if (j <= 0) j = j < 0 ? river.length - 1 : 1;
    const a = river[j - 1],
      b = river[j],
      t = Math.max(0, Math.min(1, (at - a[0]) / (b[0] - a[0]))),
      f = t * t * (3 - 2 * t);
    const x = (a[1] + (b[1] - a[1]) * f) * s,
      w = a[2] + (b[2] - a[2]) * f;
    return [x - w, x + w];
  }
  function ellipse(x, y, rx, ry) {
    return {
      x,
      y,
      rx,
      ry,
      points: Array.from({ length: 32 }, (_, j) => {
        const a = (j * Math.PI) / 16,
          r = 1 + 0.04 * Math.sin(a * 3);
        return { x: x + Math.cos(a) * rx * r, y: y + Math.sin(a) * ry * r };
      }),
    };
  }
  function ribbon(points, width) {
    const left = [],
      right = [];
    for (let j = 0; j < points.length; j++) {
      const a = points[Math.max(0, j - 1)],
        b = points[Math.min(points.length - 1, j + 1)],
        d = distance(a, b) || 1;
      const dx = (-(b.y - a.y) / d) * width,
        dy = ((b.x - a.x) / d) * width;
      left.push({ x: points[j].x + dx, y: points[j].y + dy });
      right.push({ x: points[j].x - dx, y: points[j].y - dy });
    }
    const polygon = [...left, ...right.reverse()];
    const xs = polygon.map((p) => p.x),
      ys = polygon.map((p) => p.y),
      x = (Math.min(...xs) + Math.max(...xs)) / 2,
      y = (Math.min(...ys) + Math.max(...ys)) / 2;
    return { x, y, rx: Math.max(...xs) - x, ry: Math.max(...ys) - y, points: polygon };
  }
  function configure(D, R, size = 3200) {
    if (R.greenwoodLayout || D.regions[0].size !== 2700)
      throw Error('Configure Greenwood once from original tables');
    if (size < 3200 || size > 4000) throw Error('Unmeasured Greenwood extent');
    const scale = size / 3200,
      q = (p) => ({ x: p[0] * scale, y: p[1] * scale }),
      a = Object.fromEntries(Object.entries(plan).map(([k, p]) => [k, q(p)]));
    const old = {
      town: point(D.towns[0]),
      hamlet: point(D.minors[0]),
      den: point(D.fields[0]),
      crypt: point(D.entrances[0]),
      wagon: point(D.ports[0]),
      north: { x: 1200, y: 750 },
      south: { x: 1200, y: 1750 },
      pond: { x: 630, y: 1320 },
      orchard: { x: 1050, y: 740 },
      goblin: { x: 520, y: 1050 },
      cellars: { x: 540, y: 2220 },
      cache: { x: 1550, y: 1150 },
      watch: { x: 1820, y: 2260 },
      treasury: { x: 1015, y: 1580 },
    };
    const controls = Object.keys(old).map((key) => ({ key, before: old[key], after: a[key] }));
    const map = (p) => {
      const exact = controls.find((c) => distance(c.before, p) < 0.01);
      if (exact) return { ...exact.after };
      const near = controls
        .map((c) => ({ ...c, d: distance(c.before, p) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 3);
      let dx = 0,
        dy = 0,
        sum = 0;
      for (const c of near) {
        const w = 1 / Math.pow(Math.max(40, c.d), 3);
        sum += w;
        dx += (c.after.x - c.before.x) * w;
        dy += (c.after.y - c.before.y) * w;
      }
      return { x: p.x + dx / sum, y: p.y + dy / sum };
    };
    for (const [key, id] of [
      ['towns', 'town'],
      ['minors', 'hamlet'],
      ['fields', 'den'],
      ['entrances', 'crypt'],
      ['ports', 'wagon'],
    ])
      D[key][0] = [a[id].x, a[id].y];
    D.regions[0].size = size;
    R.fieldBossCenters[0] = [a.den.x, a.den.y];
    const siteKeys = {
      'bridge-north': 'north',
      'bridge-south': 'south',
      orchard: 'orchard',
      'den-ruins': 'cellars',
      'mill-pond': 'pond',
      cache: 'cache',
      'goblin-camp': 'goblin',
    };
    for (const s of R.sites[0]) {
      const p = a[siteKeys[s[0]]];
      s[2] = p.x;
      s[3] = p.y;
      if (s[0] === 'orchard') s[1] = 'Orchard expansion';
    }
    const camps = R.creatureStrongholds.filter((h) => h.region === 'vale');
    for (const h of camps) if (h.id === 'skeleton-watch') h.center = [a.watch.x, a.watch.y];
    for (const h of R.worldLifePlans[0].habitats) {
      const p =
        h.id === 'goblin-road-camp' ? a.goblin : h.id === 'crypt-fringe' ? a.watch : a.cellars;
      h.center = [p.x, p.y];
    }
    R.occupationAnchors[0] = [
      [350, 2640],
      [550, 2420],
      [1080, 2730],
      [2550, 620],
      [2870, 980],
      [2740, 1570],
      [2670, 2220],
      [2860, 2940],
      [1080, 2510],
      [1280, 1630],
      [2800, 1850],
      [1370, 2900],
    ].map((p) => [p[0] * scale, p[1] * scale]);
    R.worldLifePlans[0].civilian = R.worldLifePlans[0].civilian.map(([x, y, kind]) => {
      const p = map({ x, y });
      return [p.x, p.y, kind];
    });
    for (const list of [R.greenwoodRuralScenes, R.regionalHandoffScenes.vale])
      for (const p of list) {
        const v = map(point(p));
        p[0] = v.x;
        p[1] = v.y;
      }
    const b = R.barriers[0];
    b.bounds = [1500 * scale, 1800 * scale, 0, size];
    b.gaps = [
      // The actual walkable water gap and painted deck share the same span.
      [a.north.y - 55, a.north.y + 55],
      [a.south.y - 32, a.south.y + 32],
    ];
    const pond = ellipse(a.pond.x, a.pond.y, 140, 120),
      headrace = [
        [1005, 1340],
        [1040, 1390],
        [1110, 1415],
      ].map(q),
      tailrace = [
        [1110, 1415],
        [1180, 1510],
        [1320, 1570],
        [1500, 1550],
      ].map(q),
      stream = [
        [900, 880],
        [875, 980],
        [930, 1090],
        [950, 1160],
      ].map(q);
    const waters = [pond, ribbon(stream, 16), ribbon(headrace, 12), ribbon(tailrace, 20)];
    R.terrain[0] = [
      { kind: 'rain-pools', wetland: true, pools: waters },
      { kind: 'water', x: 2720 * scale, y: 1320 * scale, r: 140 },
    ];
    R.forests[0] = []; // The authored stands below own nature, not circular forest stamps.
    R.landforms[0] = [
      { kind: 'meadow', shape: 'ellipse', x: a.town.x, y: a.town.y, rx: 560, ry: 420 },
      {
        kind: 'orchard-slope',
        shape: 'rect',
        x1: 270 * scale,
        y1: 1610 * scale,
        x2: 1110 * scale,
        y2: 2320 * scale,
      },
    ];
    // The north-west crossing to Goblin perimeter leg used to cut through
    // Millhaven's domestic edge. This scout-only chain stays on the western
    // woodland rim; it does not draw roads, add NPCs or change public routes.
    // Each original patrol index (and all historical thornLeg values) is kept.
    // Revised captions belong to the 3200-unit Greenwood reconstruction.
    // Legacy 2700-unit campaigns and rollback fixtures keep their names.
    R.thornPatrol.names = [
      'temporary den',
      'Goblin perimeter',
      'Northern freight crossing, west bank',
      'Northern freight crossing, east bank',
      'Skeleton watch perimeter',
      'Forest Crypt perimeter',
      'Southern crossing, east bank',
      'Southern crossing, west bank',
    ];
    R.thornPatrol.westernWoodlandGuide = [
      [1410, 550],
      [1080, 150],
      [460, 150],
      [120, 430],
      [120, 690],
      [310, 1000],
      [255, 1450],
      [155, 1900],
      [150, 2590],
    ].map(([x, y]) => [x * scale, y * scale]);
    R.thornPatrol.route = [
      a.den,
      q([350, 2450]),
      q([1460, 1000]),
      q([1880, 1000]),
      a.watch,
      q([2730, 2630]),
      q([1940, 2280]),
      q([1530, 2280]),
    ].map((p) => [p.x, p.y]);
    R.millhavenOnboarding.orchardDoor = { x: a.hamlet.x + 35, y: a.hamlet.y + 100 };
    R.millhavenOnboarding.orchardTrail = [a.town, q([650, 1550]), a.hamlet];
    const cfg = {
      version: 2,
      sceneVersion: 5,
      size,
      scale,
      anchors: a,
      start: q([520, 600]),
      legacy: old,
      controls,
      waters,
      headrace,
      tailrace,
      map,
      groups: [],
      pond: { ...a.pond, r: 140 },
      mill: a.mill,
      orchard: a.orchard,
      hamlet: a.hamlet,
    };
    R.greenwoodLayout = cfg;
    return cfg;
  }
  function install(C, { D, R }) {
    class Landscape {
      // GV-679 is an additive, nonblocking scene overlay. Never re-run the
      // layout's destructive scene generator or its enemy/home corrections to
      // deliver cosmetic refinements to an existing v4 campaign.
      greenwoodRefinementScene(z) {
        if (z.id !== 'vale' || R.greenwoodLayout?.version !== 2 ||
            z.greenwoodRefinementVersion === 1 || z.greenwoodRedesignScene !== R.greenwoodLayout.sceneVersion)
          return;
        const scale = R.greenwoodLayout.scale;
        const cards = [
          ['millhaven-poultry', 'poultry-yard', 520, 1170, 'working household yard'],
          ['millhaven-flowers', 'wildflowers', 470, 1140, 'dry domestic verge'],
          ['hamlet-pen', 'animal-pen', 175, 2375, 'sheep / fodder smallhold'],
          ['orchard-flowers', 'wildflowers', 1035, 2380, 'cultivated dry margin'],
          ['pond-reeds-west', 'reeds', 770, 1210, 'slow pond shoreline'],
          ['pond-reeds-east', 'reeds', 1035, 1200, 'slow pond shoreline'],
          ['den-thorn-bed', 'thorn-bed', 1190, 3080, 'sheltered scout den edge'],
        ];
        const audit = [];
        for (const [key, structure, x, y, reason] of cards) {
          const id = 'greenwood-refinement-' + key;
          const point = { x: x * scale, y: y * scale };
          if (z.props.some((p) => p.id === id)) {
            audit.push({ id, placed: true, reason: 'existing candidate retained' });
            continue;
          }
          const conflict = this.blocked(point.x, point.y, 'vale', 0, true) ||
            this.distanceToRoad(z, point) < 45 ||
            this.distanceToRoad({ roads: z.footpaths || [] }, point) < 35 ||
            z.buildings.some((b) => distance(b, point) < 135) ||
            z.props.some((p) => (p.owned || p.playerOwned || p.custom) && distance(p, point) < 85) ||
            z.npcs.some((n) => distance(n.servicePoint || n, point) < 65) ||
            z.nodes.some((n) => distance(n, point) < 35) ||
            z.enemies.some((e) => e.hp > 0 && distance(e.home || e, point) < 60);
          if (conflict) {
            audit.push({ id, placed: false, reason: 'protected road, water, owner, service or actor clearance' });
            continue;
          }
          z.props.push({ id, structure, ...point, r: 0, decorative: true,
            greenwoodAuthored: true, greenwoodRefinement: 1 });
          audit.push({ id, placed: true, reason });
        }
        z.greenwoodRefinementAudit = audit;
        z.greenwoodRefinementVersion = 1;
      }
      // Non-destructive, versioned landscape composition: never replay the
      // original scene-5 generator on an established v4 game. Keep stable
      // gameplay/owner IDs and place only bounded, static regional decoration.
      greenwoodCompositionFinish(z) {
        const cfg = R.greenwoodLayout;
        if (
          z.id !== 'vale' ||
          cfg?.version !== 2 ||
          z.greenwoodRedesignScene !== cfg.sceneVersion ||
          z.greenwoodCompositionVersion === 1
        )
          return;
        const scale = cfg.scale;
        const at = (x, y) => ({ x: x * scale, y: y * scale });
        const near = (a, b) => distance(a, b);
        const audit = [];
        const roads = z.greenwoodRoutes?.length === 16
          ? z.greenwoodRoutes
          : [
              ...(z.roads || []).map((points, i) => ({ kind: i ? 'farm' : 'cart', points })),
              ...(z.footpaths || []).map((points) => ({ kind: 'path', points })),
            ];
        if (roads.length !== 16) return;
        // A Treasury spur used to reverse-paint a section of the main road.
        // Share the actual junction vertex instead of overdrawing that edge.
        const routeCopy = roads.map((r) => ({
          kind: r.kind,
          points: r.points.map((p) => ({ x: p.x, y: p.y })),
        }));
        const junction = at(1870, 1000);
        const trunk = routeCopy[0].points;
        const onSpine = trunk.findIndex((p) => near(p, at(2070, 1000)) < 0.1);
        if (onSpine > 0 && !trunk.some((p) => near(p, junction) < 0.1))
          trunk.splice(onSpine, 0, junction);
        const spur = routeCopy[7].points;
        if (
          spur.length > 1 &&
          near(spur[0], at(2070, 1000)) < 0.1 &&
          near(spur[1], junction) < 0.1
        )
          spur.shift();
        const frequency = new Map();
        const key = (p) => Math.round(p.x * 10) + ':' + Math.round(p.y * 10);
        for (const r of routeCopy)
          for (const p of r.points) frequency.set(key(p), (frequency.get(key(p)) || 0) + 1);
        // Soften open-country corners only; preserve bridge centers, shared
        // junctions, short frontage spurs and safe original endpoints.
        const soften = (r) => {
          if (r.points.length < 3) return r;
          const out = [r.points[0]];
          for (let i = 1; i < r.points.length - 1; i++) {
            const p = r.points[i], a = r.points[i - 1], b = r.points[i + 1];
            if ((frequency.get(key(p)) || 0) > 1) {
              out.push(p);
              continue;
            }
            const d0 = near(a, p), d1 = near(b, p);
            const cut = Math.min(r.kind === 'cart' ? 65 : r.kind === 'farm' ? 42 : 25, d0 * 0.19, d1 * 0.19);
            if (cut < 10) {
              out.push(p);
              continue;
            }
            const before = { x: p.x + ((a.x - p.x) * cut) / d0, y: p.y + ((a.y - p.y) * cut) / d0 };
            const after = { x: p.x + ((b.x - p.x) * cut) / d1, y: p.y + ((b.y - p.y) * cut) / d1 };
            const curve = [before, 0.33, 0.67, after].map((t) => {
              if (typeof t === 'object') return t;
              return {
                x: before.x * (1 - t) * (1 - t) + 2 * p.x * (1 - t) * t + after.x * t * t,
                y: before.y * (1 - t) * (1 - t) + 2 * p.y * (1 - t) * t + after.y * t * t,
              };
            });
            if (curve.some((v) => this.blocked(v.x, v.y, 'vale', 12, true)))
              out.push(p);
            else out.push(...curve);
          }
          out.push(r.points.at(-1));
          return { kind: r.kind, points: out };
        };
        const shaped = routeCopy.map(soften);
        z.greenwoodRoutes = shaped;
        z.roads = shaped.filter((r) => r.kind !== 'path').map((r) => r.points);
        z.footpaths = shaped.filter((r) => r.kind === 'path').map((r) => r.points);
        const change = (id, expected, target, detail = {}) => {
          const p = z.props.find((item) => item.id === id);
          if (!p || p.structure !== expected || p.owned || p.playerOwned || p.custom) {
            audit.push({ id, placed: false, reason: 'missing, changed or owned scene object' });
            return;
          }
          if (target) {
            const desired = at(...target);
            if (
              this.blocked(desired.x, desired.y, 'vale', 4, true) ||
              this.distanceToRoad(z, desired) < (detail.greenwoodField ? 125 : 55) ||
              z.buildings.some((b) => near(b, desired) < 130)
            ) {
              audit.push({ id, placed: false, reason: 'target footprint conflicts; original retained' });
              return;
            }
            Object.assign(p, desired);
          }
          Object.assign(p, detail);
          audit.push({ id, placed: true, reason: 'existing scene identity retained' });
        };
        // The tiny shared garden/furrow icon is now an intentional household
        // bed or a multi-row rural field, without resizing other regions.
        for (const id of ['greenwood-homes-1', 'greenwood-homes-2', 'greenwood-homes-4', 'greenwood-hamlet-2'])
          change(id, 'garden', null, { greenwoodKitchen: true });
        for (const id of ['greenwood-homes-6', 'greenwood-homes-7'])
          change(id, 'furrow-plot', null, { greenwoodField: true });
        change('greenwood-orchard-6', 'furrow-plot', [510, 2080], { greenwoodField: true });
        change('greenwood-refinement-den-thorn-bed', 'thorn-bed', [875, 3070], { greenwoodNest: true });
        // Move the entire isolated pond flock to the Hamlet's smallhold, not
        // one animal away from its feed. Avoid the bank and forest occlusion.
        change('greenwood-pasture-0', 'pasture-sheep', [350, 2460]);
        change('greenwood-pasture-1', 'feed-trough', [430, 2500]);
        change('greenwood-pasture-2', 'hay-rick', [250, 2510]);
        const orchard = z.npcs.find((n) => n.id === 'orchard');
        if (orchard) {
          const positions = [[1030, 2300], [1070, 2360], [1040, 2390]];
          const chosen = positions.map(([x, y]) => at(x, y)).find((p) =>
            !this.blocked(p.x, p.y, 'vale', 14, true) &&
            this.distanceToRoad(z, p) > 88 &&
            this.distanceToRoad({ roads: z.footpaths }, p) > 45 &&
            !z.buildings.some((b) => near(b, p) < 130));
          if (chosen) Object.assign(orchard, chosen);
          audit.push({ id: 'orchard', placed: !!chosen, reason: chosen ? 'off-road planted site' : 'no legal marker location' });
        }
        const candidates = [
          ['fruit', 510, 1835], ['fruit', 820, 1845], ['fruit', 425, 2490],
          ['fruit', 760, 2380], ['fruit', 1050, 2410], ['fruit', 1090, 2110],
          ['fruit', 330, 1930], ['fruit', 920, 2570], ['fruit', 950, 1940],
          ['fruit', 1180, 2300], ['fruit', 670, 2550], ['fruit', 1100, 2600],
          ['flowers', 490, 980], ['flowers', 730, 1150], ['flowers', 350, 1440],
          ['flowers', 470, 1590], ['flowers', 1050, 1010], ['flowers', 300, 1880],
          ['flowers', 920, 2430], ['flowers', 1070, 2630], ['flowers', 440, 2700],
          ['flowers', 2210, 640], ['flowers', 2600, 790], ['flowers', 2900, 1700],
          ['flowers', 2060, 2020], ['flowers', 2560, 2880], ['flowers', 850, 920],
          ['flowers', 1140, 800], ['flowers', 340, 740], ['flowers', 2320, 2120],
          ['bush', 1120, 1100], ['bush', 420, 1720], ['bush', 1130, 2700],
          ['bush', 2440, 650], ['bush', 2850, 1800], ['bush', 530, 2750],
        ];
        let fruit = 0;
        for (const [i, [kind, x, y]] of candidates.entries()) {
          const id = 'greenwood-composition-' + kind + '-' + i;
          if (z.props.some((p) => p.id === id)) continue;
          const p = at(x, y), isTree = kind === 'fruit';
          const limit = isTree ? 110 : kind === 'bush' ? 72 : 46;
          const inUse =
            this.blocked(p.x, p.y, 'vale', isTree ? 18 : 0, true) ||
            this.distanceToRoad(z, p) < limit ||
            this.distanceToRoad({ roads: z.footpaths }, p) < (isTree ? 70 : 28) ||
            z.buildings.some((b) => near(b, p) < (isTree ? 175 : 130)) ||
            z.npcs.some((n) => near(n.servicePoint || n, p) < (isTree ? 100 : 65)) ||
            z.nodes.some((n) => near(n, p) < (isTree ? 65 : 32)) ||
            z.props.some((q) =>
              (q.owned || q.playerOwned || q.custom || q.roadBlocker) &&
              near(q, p) < (isTree ? 155 : 85)) ||
            (isTree && z.props.some((q) =>
              (q.structure === 'fruit-tree' || q.greenwoodNature === 'tree') &&
              near(q, p) < 105));
          if (inUse || z.props.length >= 390) {
            audit.push({ id, placed: false, reason: inUse ? 'protected clearance' : 'prop budget' });
            continue;
          }
          z.props.push({
            id, structure: isTree ? 'fruit-tree' : kind === 'flowers' ? 'wildflowers' : 'bush',
            ...p, r: 0, decorative: true, greenwoodAuthored: true, greenwoodComposition: 1,
          });
          if (isTree) fruit++;
          audit.push({ id, placed: true, reason: 'land-use-aware placement' });
        }
        z.greenwoodCompositionAudit = audit;
        z.greenwoodCompositionFruitCount = fruit;
        z.greenwoodCompositionVersion = 1;
      }
      greenwoodRedesignMigrate(z) {
        const cfg = R.greenwoodLayout;
        if (z.id !== 'vale' || cfg?.version !== 2 || z.greenwoodSourceVersion === 2) return;
        // Keep the input export untouched (restore cloned it). Normalize only
        // expanded coordinates, then map complete saved entities to the new basin.
        const expanded = z.greenwoodSourceVersion === 1 && z.greenwoodRollbackVersion !== 1;
        const oldProjection = (
          typeof PrototypeGreenwood !== 'undefined' ? PrototypeGreenwood : require('./greenwood.js')
        ).projection(3200);
        const inverse = (n, f) => {
          let lo = -500,
            hi = 5000;
          for (let j = 0; j < 48; j++) {
            const m = (lo + hi) / 2;
            if (f(m) < n) lo = m;
            else hi = m;
          }
          return (lo + hi) / 2;
        };
        const seen = new Set(),
          groupKey = (p) =>
            p.stronghold === 'goblin-road-fort' || p.habitat === 'goblin-road-camp'
              ? 'goblin'
              : p.stronghold === 'skeleton-watch'
                ? 'watch'
                : null;
        const move = (p, key) => {
          if (!p || seen.has(p) || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
          seen.add(p);
          key = key || groupKey(p);
          let original = { x: p.x, y: p.y };
          if (expanded) {
            if (key) {
              const old = cfg.legacy[key],
                src = oldProjection.point(key === 'goblin' ? { x: 400, y: 1550 } : old);
              original = { x: p.x - src.x + old.x, y: p.y - src.y + old.y };
            } else
              original = { x: inverse(p.x, oldProjection.x), y: inverse(p.y, oldProjection.y) };
          }
          if (key) {
            const a = cfg.anchors[key],
              b = cfg.legacy[key];
            Object.assign(p, { x: original.x + a.x - b.x, y: original.y + a.y - b.y });
          } else Object.assign(p, cfg.map(original));
          if (p.home) move(p.home, key);
          if (p.servicePoint) move(p.servicePoint, key);
          if (p.order && Number.isFinite(p.order.x)) move(p.order, key);
          // Expanded saves keep breadcrumbs in expanded coordinates. The old
          // rollback did not convert these, and later play could replace some
          // with 2700 coordinates: that mixed history cannot be safely inferred.
          // Let native delivery replan only that route; retain order/cargo/costs.
          if (z.greenwoodRollbackVersion === 1 && p.order?.journey) delete p.order.journey;
          else for (const step of p.order?.journey?.points || []) move(step, key);
          for (const k of ['path', 'pathTarget', 'idleWanderTarget']) delete p[k];
        };
        for (const p of [...z.props, ...z.npcs, ...z.enemies, ...z.nodes, ...z.buildings]) move(p);
        for (const m of z.minis || []) {
          move(m);
          move(m.center);
        }
        if (z.thornArrival) {
          move(z.thornArrival.boss, 'den');
          move(z.thornArrival.captive, 'den');
        }
        for (const p of this.s.loot || []) if (p.zone === 'vale') move(p);
        for (const p of Object.values(this.s.pending || {})) if (p.zone === 'vale') move(p.base);
        if (this.s.refugeSite?.zone === 'vale') move(this.s.refugeSite);
        if (this.s.zone === 'vale') for (const p of [this.hero, ...this.s.party]) move(p);
        z.greenwoodSourceVersion = 2;
        delete z.greenwoodRedesignScene;
        z.roads = [];
        z.footpaths = [];
        // Terrain-only correction precedes restore's prune. Owned buildings
        // remain present even when their preferred translated plot needs repair.
        const previous = this.s.zone;
        this.s.zone = 'vale';
        try {
          z.greenwoodMigrationUnresolved = [];
          for (const p of [...z.props, ...z.buildings, ...z.nodes, ...z.npcs, ...z.enemies]) {
            if (!this.blocked(p.x, p.y, 'vale', p.r || 15, true)) continue;
            let found = null;
            for (let r = 35; r <= 700 && !found; r += 35)
              for (let j = 0; j < 32; j++) {
                const a = (j * Math.PI) / 16,
                  q = { x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r };
                if (
                  !this.blocked(q.x, q.y, 'vale', p.r || 15, true) &&
                  !z.buildings.some((b) => b !== p && distance(b, q) < 180)
                ) {
                  found = q;
                  break;
                }
              }
            if (found) Object.assign(p, found);
            else z.greenwoodMigrationUnresolved.push(p.id);
          }
        } finally {
          this.s.zone = previous;
        }
      }
      greenwoodRedesignFinish(z) {
        const cfg = R.greenwoodLayout;
        if (z.id !== 'vale' || cfg?.version !== 2 || z.greenwoodRedesignScene === cfg.sceneVersion)
          return;
        const a = cfg.anchors,
          s = cfg.scale,
          q = (p) => ({ x: p[0] * s, y: p[1] * s });
        const previous = this.s.zone;
        this.s.zone = 'vale';
        try {
          const routes = [
            [
              'cart',
              [
                [250, 600],
                [650, 600],
                [1000, 650],
                [1330, 1000],
                [1670, 1000],
                [2070, 1000],
                [2320, 900],
                [2480, 650],
                plan.wagon,
              ],
            ],
            [
              'farm',
              [
                [650, 600],
                [650, 1050],
                [650, 1550],
                [550, 1750],
                [780, 2100],
                [1300, 2280],
                [1740, 2280],
              ],
            ],
            [
              'farm',
              [
                [650, 1550],
                [940, 1660],
                [1200, 1660],
              ],
            ],
            [
              'farm',
              [[2320, 900], [2500, 1350], [2420, 1690], [2240, 1980], [2240, 2510], plan.crypt],
            ],
            [
              'path',
              [
                [550, 1750],
                [250, 2100],
                [650, 2450],
                [650, 2640],
                [750, 2850],
                [920, 2880],
                [1080, 2510],
                [1300, 2280],
              ],
            ],
            ['path', [[650, 2640], [550, 2820], plan.goblin]],
            [
              'path',
              [
                [1740, 2280],
                [2150, 2350],
                [2300, 2220],
                [2670, 2220],
              ],
            ],
            [
              'path',
              [
                [2070, 1000],
                [1870, 1000],
                [1870, 1250],
                [2120, 1250],
              ],
            ],
            [
              'path',
              [
                [250, 600],
                [75, 520],
                [75, 180],
                [450, 110],
                [1000, 110],
                [1590, 480],
                [1590, 750],
                [1430, 990],
                [1330, 1000],
              ],
            ],
            [
              'path',
              [
                plan.wagon,
                [3030, 620],
                [3020, 1020],
                [3030, 1480],
                [2920, 1570],
                [2520, 1570],
                [2500, 1350],
              ],
            ],
            [
              'path',
              [
                [460, 480],
                [460, 600],
              ],
            ],
            [
              'path',
              [
                [400, 710],
                [400, 600],
              ],
            ],
            [
              'path',
              [
                [810, 730],
                [810, 623],
              ],
            ],
            [
              'path',
              [
                [780, 470],
                [780, 619],
              ],
            ],
            [
              'path',
              [
                [405, 1660],
                [595, 1660],
              ],
            ],
            [
              'path',
              [
                [1040, 1530],
                [1040, 1660],
              ],
            ],
          ].map(([kind, points]) => ({ kind, points: points.map(q) }));
          z.greenwoodRoutes = routes;
          z.roads = routes.filter((r) => r.kind !== 'path').map((r) => r.points);
          z.footpaths = routes.filter((r) => r.kind === 'path').map((r) => r.points);
          z.bridgeApproaches = [
            ['north', 55],
            ['south', 32],
          ].map(([key, width]) => {
            const [lo, hi] = riverBanks(a[key].y, cfg.size);
            return {
              west: { x: lo - 100, y: a[key].y },
              east: { x: hi + 100, y: a[key].y },
              width,
            };
          });
          const npcPositions = {
            supplier: [400, 710],
            recruiter: [810, 730],
            board: [780, 470],
            rest: [425, 380],
            minor: [370, 1560],
            outbound: plan.wagon,
            entrance: plan.crypt,
            'bridge-north': plan.north,
            'bridge-south': plan.south,
            orchard: plan.orchard,
            'den-ruins': plan.cellars,
            'mill-pond': [1040, 1530],
            cache: plan.cache,
            'goblin-camp': plan.goblin,
            'supply-entrance': plan.treasury,
            'mini-field-thorn': [920, 2880],
            'thorn-local-report': [850, 750],
          };
          for (const n of z.npcs) {
            if (npcPositions[n.id]) Object.assign(n, q(npcPositions[n.id]));
            if (n.id === 'orchard') n.name = 'Orchard expansion';
            if (n.id === 'rest' || n.id === 'minor') n.servicePoint = { x: n.x + 35, y: n.y + 100 };
            if (n.id.startsWith('thorn-trailhead-')) {
              const p = R.thornPatrol.route[Number(n.id.split('-').at(-1))];
              if (p) Object.assign(n, point(p));
            }
          }
          // Prototype scenery is replaceable. Retain actual user-owned objects;
          // paid/discovered/defeated state and construction live in their owners.
          // Do not scatter the old decoration IDs over the new geography.
          z.props = z.props.filter((p) => p.playerOwned || p.owned || p.custom);
          const audit = [];
          const put = (id, structure, p, extra = {}) => {
            const e = {
              id,
              structure,
              ...q(p),
              r: 0,
              decorative: true,
              greenwoodAuthored: true,
              ...extra,
            };
            z.props.push(e);
            return e;
          };
          const house = (id, kind, p) =>
            put(id, kind, p, { r: 38, decorative: false, roadBlocker: true });
          for (const [id, kind, p] of [
            ['settlement-major-0', 'vale-cottage', [425, 380]],
            ['settlement-major-1', 'vale-cottage', [200, 390]],
            ['settlement-major-2', 'vale-workshop', [1100, 360]],
            ['settlement-major-3', 'vale-cottage', [250, 940]],
            ['settlement-major-4', 'vale-cottage', [380, 1180]],
            ['settlement-major-5', 'vale-cottage', [970, 360]],
            ['settlement-major-6', 'vale-workshop', [1390, 600]],
            ['settlement-major-7', 'vale-cottage', [850, 260]],
            ['settlement-minor-0', 'vale-cottage', [370, 1560]],
            ['settlement-minor-1', 'vale-cottage', [170, 1840]],
            ['settlement-minor-2', 'vale-cottage', [420, 2070]],
            ['settlement-minor-3', 'vale-workshop', [1000, 1920]],
          ])
            house(id, kind, p);
          // Scene cards reserve a small working group of props at authored
          // positions, including recognizable production and service fronts.
          const scenes = {
            civic: [
              ['market', 360, 800],
              ['well', 780, 900],
              ['ration', 700, 420],
              ['roadside-lantern', 650, 500],
            ],
            carpenter: [
              ['woodpile', 1160, 450],
              ['tool-rack', 1050, 450],
              ['cart', 1250, 480],
            ],
            homes: [
              ['laundry', 130, 900],
              ['garden', 190, 1070],
              ['garden', 490, 1080],
              ['barrel', 1020, 1080],
              ['garden', 160, 330],
              ['woodpile', 1030, 235],
              ['furrow-plot', 230, 1300],
              ['furrow-plot', 340, 1300],
              ['farm-tool-rack', 400, 1370],
            ],
            hamlet: [
              ['well', 780, 1710],
              ['laundry', 160, 1700],
              ['garden', 180, 2000],
              ['farm-tool-rack', 500, 1500],
              ['hay-rick', 220, 2240],
              ['pasture-sheep', 200, 2330],
              ['feed-trough', 330, 2280],
            ],
            orchard: [
              ['fruit-tree', 620, 2140],
              ['fruit-tree', 680, 2300],
              ['fruit-tree', 850, 2240],
              ['fruit-tree', 880, 2010],
              ['sapling', 750, 1900],
              ['sapling', 900, 1820],
              ['furrow-plot', 1130, 1870],
              ['drying-rack', 960, 2330],
              ['farm-tool-rack', 600, 1960],
              ['crate', 1280, 2140],
            ],
            mill: [
              ['cart', 1340, 1780],
              ['supply-stack', 1350, 1640],
              ['barrel', 1310, 1500],
            ],
            wagon: [
              ['cart', 2790, 260],
              ['barrel', 2970, 380],
              ['crate', 3030, 290],
            ],
            cache: [
              ['cart', 2540, 1980],
              ['supply-stack', 2490, 1830],
              ['scribe-desk', 2560, 1700],
            ],
            estate: [
              ['estate-scaffold', 2970, 2760],
              ['stacked-lumber', 2860, 2920],
              ['tool-rack', 2620, 2940],
              ['supply-stack', 2860, 3050],
            ],
            cellars: [
              ['stump', 980, 2470],
              ['crate', 1180, 2570],
              ['fallen-log', 1250, 2440],
              ['lean-to', 1380, 2550],
              ['cookfire', 1290, 2450],
              ['sleep-roll', 1220, 2580],
            ],
            den: [
              ['lean-to', 700, 2830],
              ['cookfire', 780, 2750],
              ['sleep-roll', 1060, 2810],
              ['pup-nest', 1020, 3000],
              ['root-table', 780, 3010],
              ['fang-trophy', 1100, 2990],
              ['training-dummy', 1120, 2850],
            ],
            pasture: [
              ['pasture-sheep', 2700, 1500],
              ['feed-trough', 2860, 1410],
              ['hay-rick', 2900, 1160],
            ],
          };
          for (const [scene, props] of Object.entries(scenes))
            props.forEach(([kind, x, y], j) =>
              put('greenwood-' + scene + '-' + j, kind, [x, y], { greenwoodDistrict: scene }),
            );
          put('greenwood-working-mill', 'vale-working-mill', plan.mill, {
            r: 52,
            decorative: false,
            roadBlocker: true,
            greenwoodFacility: 'mill',
          });
          put('greenwood-working-cellar', 'fruit-cellar', [1120, 2040], {
            r: 25,
            decorative: false,
            roadBlocker: true,
          });
          put('greenwood-mill-sluice', 'mill-sluice', [1005, 1340], { greenwoodFacility: 'weir' });
          put('greenwood-orchard-new-planting', 'sapling', [1240, 2070], {
            greenwoodFacility: 'new-planting',
            greenwoodDistrict: 'orchard',
          });
          // Perimeters use shared line segments, with one deliberate gate.
          // Every picket and collision query reads these same world endpoints.
          const perimeter = [
            [-200, -160, -67, -160],
            [-67, -160, 67, -160],
            [67, -160, 200, -160],
            [200, -160, 200, -70],
            [200, 70, 200, 200],
            [200, 200, 67, 200],
            [67, 200, -67, 200],
            [-67, 200, -200, 200],
            [-200, 200, -200, 80],
            [-200, 80, -200, -40],
            [-200, -40, -200, -160],
          ];
          for (const [id, key, material] of [
            ['goblin-road-fort', 'goblin', 'stockade'],
            ['skeleton-watch', 'watch', 'stonewall'],
            ['treasury-yard', 'treasury', 'stockade'],
          ]) {
            const center = a[key],
              rotate = key === 'goblin' ? 1 : -1;
            const walls =
              key === 'goblin'
                ? [
                    [-210, -120, -70, -175],
                    [-70, -175, 130, -150],
                    [130, -150, 200, -80],
                    [200, -80, 200, -65],
                    [200, 75, 185, 200],
                    [185, 200, 40, 220],
                    [40, 220, -190, 170],
                    [-190, 170, -210, -120],
                  ]
                : perimeter;
            walls.forEach(([x1, y1, x2, y2], j) => {
              const start = { x: center.x + x1 * rotate, y: center.y + y1 },
                end = { x: center.x + x2 * rotate, y: center.y + y2 };
              put('stronghold-' + id + '-wall-' + j, material, [0, 0], {
                x: (start.x + end.x) / 2,
                y: (start.y + end.y) / 2,
                r: 28,
                decorative: false,
                stronghold: id === 'treasury-yard' ? undefined : id,
                greenwoodWall: { a: start, b: end, material },
              });
            });
            const interior =
              key === 'goblin'
                ? [
                    ['lean-to', -80, -80],
                    ['sleep-roll', 70, -90],
                    ['cookfire', -80, 80],
                    ['stolen-goods', 80, 110],
                    ['game-table', 0, 130],
                  ]
                : key === 'watch'
                  ? [
                      ['grave-marker', -80, -80],
                      ['grave-lamp', 80, -80],
                      ['caretaker-table', 0, -80],
                      ['ossuary', 100, 110],
                      ['sleep-roll', -90, 110],
                    ]
                  : [
                      ['supply-stack', -70, -80],
                      ['cart', 80, -75],
                      ['scribe-desk', 70, 90],
                      ['barrel', -80, 100],
                    ];
            interior.forEach(([kind, x, y], j) =>
              put('stronghold-' + id + '-prop-' + j, kind, [0, 0], {
                x: center.x + x,
                y: center.y + y,
                stronghold: id === 'treasury-yard' ? undefined : id,
              }),
            );
          }
          const stands = [
            [250, 160, 300, 150],
            [1260, 280, 270, 200],
            [280, 1210, 250, 260],
            [180, 2460, 170, 290],
            [1230, 2920, 270, 210],
            [2300, 240, 300, 180],
            [2940, 1900, 210, 360],
            [2220, 2980, 280, 180],
            [2040, 1780, 260, 240],
            [2100, 680, 200, 240],
            [2940, 2490, 180, 230],
            [1390, 1910, 190, 250],
            [1200, 2200, 190, 190],
            [2870, 120, 220, 100],
          ];
          let trees = 0,
            low = 0;
          for (let j = 0; j < 260; j++) {
            const id = 'greenwood-nature-' + j,
              h = hash(id),
              stand = stands[j % stands.length],
              kind = j % 4 === 0 ? 'understory' : j % 13 === 0 ? 'fallen-log' : 'tree';
            let selected = null;
            for (let k = 0; k < 160; k++) {
              const angle = (((h % 360) + k * 137.5) * Math.PI) / 180,
                rad = Math.sqrt(((h + k * 37) % 997) / 997),
                candidate = q([
                  stand[0] + Math.cos(angle) * stand[2] * rad,
                  stand[1] + Math.sin(angle) * stand[3] * rad,
                ]);
              if (
                this.blocked(candidate.x, candidate.y, 'vale', 20, true) ||
                this.distanceToRoad(z, candidate) < 105 ||
                this.distanceToRoad({ roads: z.footpaths }, candidate) < 65 ||
                cfg.tailrace.some(
                  (p, j, points) =>
                    j > 0 &&
                    this.distanceToSegment(candidate, points[j - 1], p) <
                      (kind === 'tree' ? 185 : 70),
                ) ||
                z.npcs.some((n) => distance(candidate, n.servicePoint || n) < 170) ||
                z.buildings.some((b) => distance(candidate, b) < 230) ||
                z.enemies.some((e) => distance(candidate, e.home || e) < 70) ||
                z.props.some(
                  (p) =>
                    distance(p, candidate) <
                    (p.greenwoodNature ? (kind === 'tree' ? 65 : 34) : p.roadBlocker ? 220 : 75),
                )
              )
                continue;
              selected = candidate;
              break;
            }
            audit.push({ id, kind, placed: !!selected, essential: false });
            if (!selected) continue;
            put(id, null, [0, 0], {
              ...selected,
              greenwoodNature: kind,
              treeSpecies:
                j === 43 || j === 183
                  ? 'pine'
                  : [
                      'oak',
                      'oak',
                      'oak',
                      'oak',
                      'hickory',
                      'hickory',
                      'hickory',
                      'beech',
                      'tulip',
                      'sycamore',
                    ][h % 10],
              r: kind === 'tree' ? 18 : 0,
              decorative: kind !== 'tree',
              icon: kind === 'tree' ? '🌲' : null,
            });
            if (kind === 'tree') trees++;
            else low++;
          }
          // Keep a migrated paid camp as a complete functional object. Its new
          // plot may change; tearing a mill or perimeter apart is not a safe
          // substitute for a compatible construction migration.
          for (const b of z.buildings) {
            const essential = (p) => p.greenwoodWall || p.greenwoodFacility || p.roadBlocker;
            if (
              z.props.some((p) => essential(p) && distance(p, b) < 190) ||
              this.distanceToRoad(z, b) < 175 ||
              this.blocked(b.x, b.y, 'vale', 50, true) ||
              z.npcs.some((n) => distance(n.servicePoint || n, b) < 120)
            ) {
              const before = { x: b.x, y: b.y };
              const entrance =
                b.dungeonEntrance &&
                z.npcs.find((n) => n.kind === 'dungeon' && n.family === b.dungeonEntrance);
              let plot = null;
              for (let d = 220; d <= 900 && !plot; d += 40)
                for (let j = 0; j < 32; j++) {
                  const angle = (j * Math.PI) / 16,
                    candidate = {
                      x: before.x + Math.cos(angle) * d,
                      y: before.y + Math.sin(angle) * d,
                    };
                  if (
                    this.blocked(candidate.x, candidate.y, 'vale', 50, true) ||
                    this.distanceToRoad(z, candidate) < 175 ||
                    (entrance && distance(candidate, entrance) > R.dungeonCamp.builtRadius) ||
                    z.buildings.some((other) => other !== b && distance(other, candidate) < 190) ||
                    z.npcs.some((n) => distance(n.servicePoint || n, candidate) < 120) ||
                    z.props.some((p) => essential(p) && distance(p, candidate) < 190)
                  )
                    continue;
                  const route = this.route(a.town, candidate);
                  if (route.length && distance(route.at(-1), candidate) < 35) {
                    plot = candidate;
                    break;
                  }
                }
              if (plot) {
                Object.assign(b, plot);
                if (previous === 'vale')
                  for (const u of this.s.party)
                    if (u.order?.id === b.id && distance(u, before) < 220)
                      Object.assign(u, { x: u.x + plot.x - before.x, y: u.y + plot.y - before.y });
              } else
                audit.push({
                  id: b.id,
                  essential: true,
                  placed: false,
                  reason: 'paid camp requires a compatible plot; object retained',
                });
            }
            for (const p of z.props.filter((p) => !p.playerOwned && distance(p, b) < 190)) {
              if (essential(p)) {
                audit.push({
                  id: p.id,
                  essential: true,
                  placed: false,
                  reason: 'fixed compound conflicts with retained paid camp',
                });
                continue;
              }
              let selected = null;
              for (let d = 230; d <= 600 && !selected; d += 40)
                for (let j = 0; j < 24; j++) {
                  const angle = (j * Math.PI) / 12,
                    candidate = { x: b.x + Math.cos(angle) * d, y: b.y + Math.sin(angle) * d };
                  if (
                    !this.blocked(candidate.x, candidate.y, 'vale', p.r || 15, true) &&
                    this.distanceToRoad(z, candidate) > 100 &&
                    !z.props.some((other) => other !== p && distance(other, candidate) < 90)
                  ) {
                    selected = candidate;
                    break;
                  }
                }
              if (selected) Object.assign(p, selected);
              else
                audit.push({
                  id: p.id,
                  essential: true,
                  placed: false,
                  reason: 'owned building parcel conflict',
                });
            }
          }
          z.greenwoodSceneAudit = audit;
          z.greenwoodNatureCensus = { trees, low };
          z.greenwoodRedesignScene = cfg.sceneVersion;
          z.greenwoodSourceVersion = 2;
          z.greenwoodAttemptVersion = cfg.sceneVersion;
          z.greenwoodSceneVersion = cfg.sceneVersion;
          this.setSceneryTraversal(z);
          for (const node of z.nodes)
            if (this.blocked(node.x, node.y, 'vale'))
              Object.assign(node, this.safe(node.x, node.y, 'vale'));
          // Restore's first safety pass saw the old scenery. Resolve against
          // the completed scene now, so a second reload cannot move a resident
          // out of a newly installed mill, house or perimeter.
          for (const enemy of z.enemies)
            for (const p of [enemy.home, enemy])
              if (p && this.blocked(p.x, p.y, 'vale'))
                Object.assign(p, this.safe(p.x, p.y, 'vale'));
          const witness = z.npcs.find((n) => n.id === 'thorn-local-report');
          if (witness) Object.assign(witness, this.safe(850 * s, 750 * s, 'vale'));
          this.greenwoodRefinementScene(z);
          this.greenwoodCompositionFinish(z);
        } finally {
          this.s.zone = previous;
        }
      }
    }
    const methods = Object.getOwnPropertyDescriptors(Landscape.prototype);
    delete methods.constructor;
    Object.defineProperties(C.prototype, methods);
  }
  function drawNature(ctx, e, p) {
    const h = hash(e.id),
      species = e.treeSpecies || 'oak';
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const stroke = (pts, color, width) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      pts.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    };
    const oval = (x, y, rx, ry, color, rot = 0) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
      ctx.fill();
    };
    if (e.greenwoodNature === 'tree') {
      const tall = species === 'hickory' || species === 'tulip',
        pale = species === 'sycamore' || species === 'beech',
        height = tall ? 105 : species === 'oak' ? 76 : 83,
        spread =
          species === 'oak' ? 55 : species === 'hickory' ? 38 : species === 'sycamore' ? 58 : 44;
      oval(3, 8, spread * 0.83, 10, '#112e2440');
      stroke(
        [
          [-14, 9],
          [-4, 1],
          [0, -38],
        ],
        pale ? '#887d63' : '#65513a',
        7,
      );
      stroke(
        [
          [15, 7],
          [5, 0],
          [2, -height + 17],
        ],
        pale ? '#bab89a' : '#765e40',
        8,
      );
      stroke(
        [
          [0, -30],
          [-19, -52],
          [-24, -height + 12],
        ],
        pale ? '#a6a88d' : '#665437',
        5,
      );
      stroke(
        [
          [2, -42],
          [23, -58],
          [32, -height + 10],
        ],
        pale ? '#b4b89a' : '#705b3e',
        4,
      );
      if (!pale)
        for (let j = 0; j < 5; j++)
          stroke(
            [
              [-2 + (j % 3), -7 - j * 8],
              [-3 + (j % 3), -13 - j * 8],
            ],
            '#3f3829',
            0.9,
          );
      if (species === 'pine') {
        for (let j = 0; j < 5; j++) {
          const y = -109 + j * 17,
            w = 13 + j * 6;
          ctx.beginPath();
          ctx.moveTo(-w, y + 20);
          ctx.quadraticCurveTo(-w * 0.8, y + 9, -4, y - 13);
          ctx.quadraticCurveTo(2, y - 21, 8, y - 5);
          ctx.quadraticCurveTo(w * 0.6, y + 7, w, y + 19);
          ctx.quadraticCurveTo(0, y + 31, -w, y + 20);
          ctx.fillStyle = j % 2 ? '#31583e' : '#3b6949';
          ctx.fill();
          stroke(
            [
              [-w * 0.5, y + 16],
              [0, y + 11],
              [w * 0.45, y + 17],
            ],
            '#749052',
            1.5,
          );
        }
        ctx.restore();
        return;
      }
      // Stable, asymmetrical lobed masses. Species alter branch topology and
      // crown proportion, rather than recoloring the generic tree bitmap.
      const palette =
        species === 'oak'
          ? ['#254b35', '#376544', '#507a49', '#7b9958']
          : species === 'hickory'
            ? ['#2f5436', '#486e3c', '#67884b', '#9aa760']
            : species === 'sycamore'
              ? ['#2b5944', '#3e7657', '#689367', '#9aae78']
              : species === 'beech'
                ? ['#254f3d', '#3c7052', '#5e8a61', '#85a46d']
                : ['#2d583c', '#43754c', '#6b945d', '#9ab372'];
      const masses = [
        [-spread * 0.55, -height + 17, spread * 0.57, 24],
        [spread * 0.46, -height + 12, spread * 0.61, 27],
        [-3, -height - 4, spread * 0.62, 28],
        [-spread * 0.6, -height + 36, spread * 0.53, 22],
        [spread * 0.5, -height + 36, spread * 0.57, 23],
        [-1, -height + 30, spread * 0.66, 29],
      ];
      for (const [j, m] of masses.entries()) {
        const [x, y, rx, ry] = m;
        ctx.beginPath();
        const n = 10,
          points = Array.from({ length: n }, (_, k) => {
            const angle = (k * Math.PI * 2) / n;
            const radius = 1 + 0.1 * Math.sin(k * 2.7 + (h % 41) + j);
            return [x + Math.cos(angle) * rx * radius, y + Math.sin(angle) * ry * radius];
          });
        const middle = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        ctx.moveTo(...middle(points[n - 1], points[0]));
        for (let k = 0; k < n; k++)
          ctx.quadraticCurveTo(...points[k], ...middle(points[k], points[(k + 1) % n]));
        ctx.closePath();
        ctx.fillStyle = palette[j % 3];
        ctx.fill();
        for (let k = 0; k < 5; k++) {
          const dx = ((((h >>> k) % 19) - 9) * rx) / 17,
            dy = ((((h >>> (k + 4)) % 13) - 6) * ry) / 15;
          oval(x + dx, y + dy, 3.5 + (k % 3), 1.4, palette[3], -0.3 + k * 0.15);
        }
      }
      if (species === 'hickory')
        stroke(
          [
            [1, -29],
            [14, -42],
            [24, -45],
          ],
          '#817b4c',
          2,
        );
      for (let j = 0; j < 5; j++) oval(-19 + j * 8, 10 + (j % 2) * 3, 4, 1.4, '#8c805344', j * 0.5);
    } else if (e.greenwoodNature === 'fallen-log') {
      oval(0, 8, 35, 7, '#102c2533');
      stroke(
        [
          [-34, 3],
          [26, -5],
        ],
        '#4c4230',
        14,
      );
      stroke(
        [
          [-31, -1],
          [23, -9],
        ],
        '#84734c',
        5,
      );
      oval(27, -5, 5.5, 8, '#baa779', -0.25);
      oval(27, -5, 3, 5, '#78633d', -0.25);
      stroke(
        [
          [-10, 1],
          [-7, -15],
          [0, -21],
        ],
        '#6e603e',
        4,
      );
      stroke(
        [
          [-25, 0],
          [-10, -3],
        ],
        '#526d37',
        4,
      );
    } else {
      const type = h % 4;
      oval(0, 7, 24, 7, '#183c282d');
      for (let j = 0; j < 7; j++) {
        const x = (j - 3) * 7,
          y = (j % 3) * 2 - 3,
          height = type === 0 ? 28 : 12 + (j % 3) * 5;
        stroke(
          [
            [x, 8],
            [x - 3, -height * 0.6],
            [x + ((j % 2) * 2 - 1) * 6, -height],
          ],
          '#566f39',
          1.6,
        );
        oval(x - 4, -height * 0.55, 6, 2.5, j % 2 ? '#71904c' : '#426a3b', -0.55);
        oval(x + 2, -height * 0.8, 5.5, 2.5, '#6f8b49', 0.45);
        if (type === 3 && j % 2) oval(x - 2, -height, 1.7, 1.7, '#d4cc8e');
        if (type === 2 && j % 2) oval(x + 1, -height * 0.7, 1.4, 1.4, '#684c4e');
      }
    }
    ctx.restore();
  }
  function drawFacility(ctx, e, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.lineJoin = 'round';
    const poly = (pts, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      pts.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fill();
    };
    const line = (a, b, color, w = 1) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(...a);
      ctx.lineTo(...b);
      ctx.stroke();
    };
    if (e.greenwoodFacility === 'mill') {
      poly(
        [
          [-62, 7],
          [-64, -88],
          [8, -111],
          [69, -87],
          [69, -4],
          [0, 18],
        ],
        '#725940',
      );
      poly(
        [
          [-64, -88],
          [0, -66],
          [69, -87],
          [7, -112],
        ],
        '#a98b5d',
      );
      poly(
        [
          [-78, -86],
          [-5, -143],
          [82, -104],
          [5, -56],
        ],
        '#624332',
      );
      poly(
        [
          [-78, -86],
          [-5, -143],
          [6, -56],
        ],
        '#a46e45',
      );
      poly(
        [
          [6, -56],
          [82, -104],
          [82, -96],
          [6, -48],
        ],
        '#443a2c',
      );
      for (let j = 0; j < 7; j++) line([-62, -76 + j * 11], [3, -54 + j * 10], '#ba9b67', 2);
      for (const x of [-56, -7, 58]) line([x, -67], [x, 5], '#463c2b', 5);
      poly(
        [
          [-4, -31],
          [18, -37],
          [18, 10],
          [-4, 16],
        ],
        '#282f26',
      );
      for (const [x, y] of [
        [-38, -56],
        [32, -64],
      ]) {
        poly(
          [
            [x, y],
            [x + 15, y - 5],
            [x + 15, y + 15],
            [x, y + 20],
          ],
          '#293f35',
        );
        line([x + 7, y - 2], [x + 7, y + 17], '#b3a578', 2);
      }
      // Wheel root matches the shared world-space head/tailrace junction:
      // (-90,+15) world = (-79.8,-20.25) screen relative to this body.
      const wx = -79.8,
        wy = -56.25;
      ctx.strokeStyle = '#453c2d';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.ellipse(wx, wy, 23, 36, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#ba9c66';
      ctx.lineWidth = 3;
      ctx.stroke();
      for (let j = 0; j < 12; j++) {
        const a = (j * Math.PI) / 6;
        line([wx, wy], [wx + Math.cos(a) * 23, wy + Math.sin(a) * 36], '#b49a68', 3);
      }
      for (const dy of [-14, 0, 14]) line([wx - 25, wy + dy], [wx - 19, wy + dy + 8], '#d4bc83', 4);
      line([wx, wy], [0, -16], '#51412d', 6);
      poly(
        [
          [-62, 7],
          [0, 26],
          [72, 4],
          [70, -4],
          [0, 17],
          [-62, 0],
        ],
        '#8a8970',
      );
      line([-58, 10], [2, 28], '#b0ac89', 3);
    } else if (e.greenwoodFacility === 'new-planting') {
      for (const [x, y] of [
        [-26, 4],
        [8, -6],
        [30, 6],
      ]) {
        ctx.fillStyle = '#776344';
        ctx.beginPath();
        ctx.ellipse(x, y, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        line([x - 5, y], [x - 5, y - 24], '#a7905d', 2);
        line([x, y], [x, y - 13], '#55713b', 2);
        line([x - 5, y - 9], [x + 1, y - 9], '#c7b77e', 1);
        poly(
          [
            [x, y - 10],
            [x - 6, y - 15],
            [x - 8, y - 10],
            [x, y - 7],
          ],
          '#72934a',
        );
      }
    } else {
      poly(
        [
          [-32, -2],
          [10, -12],
          [32, -3],
          [-10, 7],
        ],
        '#777b66',
      );
      line([-29, 2], [-29, -32], '#68523a', 5);
      line([29, -10], [29, -44], '#68523a', 5);
      line([-34, -33], [34, -46], '#baa06b', 5);
      poly(
        [
          [-22, -13],
          [22, -22],
          [22, -10],
          [-22, -1],
        ],
        '#8c7249',
      );
      line([0, -40], [0, -6], '#504c3a', 2);
      ctx.strokeStyle = '#b7a879';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -42, 8, 5, -0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawRoads(ctx, paths, screen) {
    // Three continuous roadbed bands per whole corridor, not separate opaque
    // quads and circles at every point. World-space miters stay bounded.
    const ribbon = (points, half) => {
      const left = [], right = [];
      for (let i = 0; i < points.length; i++) {
        const a = points[Math.max(0, i - 1)];
        const b = points[Math.min(points.length - 1, i + 1)];
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * half, ny = (dx / len) * half;
        left.push({ x: points[i].x + nx, y: points[i].y + ny });
        right.push({ x: points[i].x - nx, y: points[i].y - ny });
      }
      return [...left, ...right.reverse()];
    };
    const paint = (points, color) => {
      if (points.length < 3) return;
      ctx.beginPath();
      points.map(screen).forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };
    ctx.save();
    for (let band = 0; band < 3; band++)
      for (const [i, path] of (paths || []).entries()) {
        if (path.length < 2) continue;
        const trunk = i === 0, full = trunk ? 44 : 26;
        const width = band === 0 ? full + 5 : band === 1 ? full : full * 0.57;
        const color = band === 0
          ? '#586249'
          : band === 1
            ? trunk ? '#9a7556' : '#978365'
            : trunk ? '#b18b61' : '#b4a078';
        paint(ribbon(path, width), color);
      }
    ctx.restore();
  }
  function drawWall(ctx, e, p) {
    const w = e.greenwoodWall,
      project = (q) => ({
        x: p.x + (q.x - e.x - q.y + e.y) * 0.76,
        y: p.y + (q.x - e.x + q.y - e.y) * 0.27,
      }),
      a = project(w.a),
      b = project(w.b),
      wood = w.material === 'stockade';
    const line = (x1, y1, x2, y2, color, width) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };
    ctx.save();
    ctx.lineCap = 'round';
    line(a.x, a.y + 3, b.x, b.y + 3, '#18332544', 12);
    if (wood) {
      const n = Math.ceil(distance(w.a, w.b) / 12);
      for (let j = 0; j <= n; j++) {
        const f = j / n,
          x = a.x + (b.x - a.x) * f,
          y = a.y + (b.y - a.y) * f,
          h = 35 + (hash(e.id + j) % 8);
        line(x, y, x, y - h, j % 3 ? '#8a7349' : '#9a8154', 6);
        ctx.fillStyle = '#d0b982';
        ctx.beginPath();
        ctx.moveTo(x - 3, y - h + 1);
        ctx.lineTo(x, y - h - 7);
        ctx.lineTo(x + 3, y - h + 1);
        ctx.closePath();
        ctx.fill();
        line(x - 1, y - 2, x - 1, y - h + 5, '#b59b64', 1);
      }
      for (const h of [9, 23]) line(a.x, a.y - h, b.x, b.y - h, '#56482e', 4);
    } else {
      for (let h = 3; h < 30; h += 9) {
        line(a.x, a.y - h, b.x, b.y - h, h % 2 ? '#939781' : '#737f70', 10);
        const n = Math.ceil(distance(w.a, w.b) / 30);
        for (let j = 0; j <= n; j++) {
          const f = (j + (h % 2) * 0.5) / n;
          if (f > 1) continue;
          const x = a.x + (b.x - a.x) * f,
            y = a.y + (b.y - a.y) * f;
          line(x, y - h - 4, x, y - h + 4, '#4c5a4b', 1);
        }
      }
      line(a.x, a.y - 31, b.x, b.y - 31, '#bbc0a2', 4);
    }
    ctx.restore();
  }
  function drawGround(ctx, screen, cfg, bounds) {
    const s = cfg.scale;
    const patches = [
      [260, 200, 430, 280, '#263e2d'],
      [1250, 300, 420, 300, '#30462c'],
      [250, 1200, 360, 420, '#31482f'],
      [230, 2530, 350, 500, '#2b432d'],
      [1180, 2870, 450, 370, '#293d2e'],
      [2250, 240, 430, 300, '#30492e'],
      [2880, 1930, 370, 550, '#253f2f'],
      [2200, 2980, 410, 340, '#2e432d'],
      [2020, 1780, 390, 370, '#34492e'],
      [650, 780, 500, 330, '#78894c'],
      [480, 1900, 420, 490, '#8d8250'],
      [2780, 1320, 390, 320, '#84934f'],
    ];
    ctx.save();
    for (const [x, y, rx, ry, color] of patches) {
      const p = screen({ x: x * s, y: y * s }),
        r = (rx + ry) * 0.5 * s;
      if (
        p.x + r * 1.1 < 0 ||
        p.x - r * 1.1 > bounds.width ||
        p.y + r * 0.45 < 0 ||
        p.y - r * 0.45 > bounds.height
      )
        continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(1, 0.355);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, color + 'dd');
      g.addColorStop(0.55, color + '88');
      g.addColorStop(1, color + '00');
      ctx.fillStyle = g;
      ctx.fillRect(-r, -r, r * 2, r * 2);
      ctx.restore();
      // Stable leaf litter and grass flecks have world phase, never screen noise.
      for (let j = 0; j < 34; j++) {
        const a = j * 2.39996,
          h = hash(x + ':' + y + ':' + j),
          d = Math.sqrt((h % 991) / 991),
          q = screen({ x: (x + Math.cos(a) * rx * d) * s, y: (y + Math.sin(a) * ry * d) * s });
        ctx.fillStyle = color === '#8d8250' ? '#b39c6355' : '#b3aa6844';
        ctx.beginPath();
        ctx.ellipse(q.x, q.y, 3 + (h % 3), 1.2, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Seeded meadow flowers and white dandelion clocks are part of the
    // static Greenwood ground, not new saved props or per-frame AI.
    // Irregular sunlit pockets keep the countryside open between clusters.
    const meadows = [
      [460, 970, 115, 85], [805, 910, 150, 110],
      [345, 1390, 130, 100], [450, 1880, 135, 125],
      [735, 2440, 125, 115], [1060, 2550, 135, 140],
      [1140, 1010, 135, 95], [2250, 740, 190, 135],
      [2610, 1050, 190, 100], [2420, 2040, 135, 100],
      [2930, 1740, 110, 120], [500, 2750, 145, 110],
    ];
    for (const [index, [cx, cy, rx, ry]] of meadows.entries()) {
      const center = screen({ x: cx * s, y: cy * s });
      if (
        center.x < -240 || center.x > bounds.width + 240 ||
        center.y < -160 || center.y > bounds.height + 160
      )
        continue;
      for (let j = 0; j < 13; j++) {
        const h = hash('greenwood-meadow-' + index + '-' + j);
        const a = j * 2.3999632297 + (h % 23) * 0.017;
        const r = Math.sqrt(((h >>> 8) % 997) / 997);
        const p = screen({
          x: (cx + Math.cos(a) * rx * r) * s,
          y: (cy + Math.sin(a) * ry * r) * s,
        });
        if (p.x < -18 || p.x > bounds.width + 18 || p.y < -26 || p.y > bounds.height + 18)
          continue;
        const dandelion = j % 4 === 0;
        const stem = dandelion ? 13 + (h % 4) : 8 + (h % 5);
        const lean = ((h >>> 5) % 7) - 3;
        ctx.strokeStyle = '#87a267cc';
        ctx.lineWidth = dandelion ? 1 : 1.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + 4);
        ctx.quadraticCurveTo(p.x + lean * 0.2, p.y - stem * 0.4, p.x + lean, p.y - stem);
        ctx.stroke();
        const fx = p.x + lean, fy = p.y - stem;
        if (dandelion) {
          ctx.fillStyle = '#f1eadc33';
          ctx.beginPath();
          ctx.arc(fx, fy, 4.6, 0, Math.PI * 2);
          ctx.fill();
          for (let k = 0; k < 12; k++) {
            const theta = (Math.PI * 2 * k) / 12;
            const dx = Math.cos(theta) * (4.5 + (h % 3) * 0.2);
            const dy = Math.sin(theta) * (4.5 + (h % 3) * 0.2);
            ctx.strokeStyle = '#eee9d4be';
            ctx.lineWidth = 0.65;
            ctx.beginPath();
            ctx.moveTo(fx, fy);
            ctx.lineTo(fx + dx, fy + dy);
            ctx.stroke();
          }
        } else {
          const petals = ['#d4be9b', '#c8b0b4', '#b7bdd0', '#e1cc94'];
          ctx.fillStyle = petals[(h >>> 3) % petals.length];
          for (let k = 0; k < 5; k++) {
            const theta = (Math.PI * 2 * k) / 5;
            ctx.beginPath();
            ctx.arc(fx + Math.cos(theta) * 2.2, fy + Math.sin(theta) * 2, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#9f9866';
          ctx.beginPath();
          ctx.arc(fx, fy, 1.05, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }
  const api = {
    configure,
    install,
    riverBanks,
    hash,
    plan,
    drawNature,
    drawFacility,
    drawRoads,
    drawWall,
    drawGround,
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeGreenwoodLandscape = api;
})(typeof window !== 'undefined' ? window : globalThis);
