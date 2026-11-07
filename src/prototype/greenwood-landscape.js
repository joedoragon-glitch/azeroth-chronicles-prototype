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
    // Scornfang's construction-freight depot: sheltered beside the Crypt approach,
    // not sitting on the eastern trunk road or mistaken for collectible tribute.
    cache: [2600, 2610],
    watch: [2670, 2220],
    crypt: [2830, 2940],
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
  function ribbon(points, width, { roundedSource = false, subdivisions = 1 } = {}) {
    // Low-sample Catmull–Rom interpolation rounds the natural water channels
    // without large polygon counts in the real collision solver. Engineered
    // gates/headraces retain straight edges.
    let path = points;
    if (subdivisions > 1) {
      path = [];
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[Math.max(i - 1, 0)],
          b = points[i],
          c = points[i + 1],
          d = points[Math.min(i + 2, points.length - 1)];
        for (let j = 0; j < subdivisions; j++) {
          const t = j / subdivisions,
            t2 = t * t,
            t3 = t2 * t;
          const sample = (key) =>
            0.5 *
            (2 * b[key] +
              (c[key] - a[key]) * t +
              (2 * a[key] - 5 * b[key] + 4 * c[key] - d[key]) * t2 +
              (-a[key] + 3 * b[key] - 3 * c[key] + d[key]) * t3);
          path.push({ x: sample('x'), y: sample('y') });
        }
      }
      path.push(points.at(-1));
    }
    const left = [],
      right = [];
    for (let j = 0; j < path.length; j++) {
      const a = path[Math.max(0, j - 1)],
        b = path[Math.min(path.length - 1, j + 1)],
        d = distance(a, b) || 1;
      const dx = (-(b.y - a.y) / d) * width,
        dy = ((b.x - a.x) / d) * width;
      left.push({ x: path[j].x + dx, y: path[j].y + dy });
      right.push({ x: path[j].x - dx, y: path[j].y - dy });
    }
    // An unconnected uphill stream source should end in a soft springhead,
    // not a straight-edged blue trapezoid. Its exact polygon owns collision.
    const cap = [];
    if (roundedSource) {
      const first = path[0],
        next = path[1],
        d = distance(first, next) || 1,
        tx = (next.x - first.x) / d,
        ty = (next.y - first.y) / d,
        nx = -ty,
        ny = tx;
      for (let j = 1; j < 6; j++) {
        const angle = (j * Math.PI) / 6;
        cap.push({
          x: first.x - nx * Math.cos(angle) * width - tx * Math.sin(angle) * width,
          y: first.y - ny * Math.cos(angle) * width - ty * Math.sin(angle) * width,
        });
      }
    }
    const polygon = [...left, ...right.reverse(), ...cap];
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
      if (s[0] === 'cache') s[1] = "Scornfang's Supply Depot";
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
    // The actual v2 authored river gaps ARE the walkable bridge widths.
    // Deck painting and pathfinding share this table: no invisible water floor.
    // Give the southern footbridge enough shoulder clearance for real
    // patroller movement (the former 56-unit gap clipped radius-15 actors
    // when their physically routed approach drifted ~17 units off center).
    // Native pathfinding cells are
    // centered at 25 + 50*n, NOT at 50*n; the legal crossing row is at
    // y=2275 in the 3200-unit Vale. Tests verify both actual grid and routes.
    b.gaps = [
      [a.north.y - 50, a.north.y + 50],
      [a.south.y - 40, a.south.y + 40],
    ];
    const pond = ellipse(a.pond.x, a.pond.y, 140, 120),
      headrace = [
        [1005, 1340],
        [1040, 1390],
        [1110, 1415],
      ].map(q),
      // The tailrace must end just *inside* the same actual river bank used
      // by the collision solver. The old center-river endpoint left a pointed
      // blue tongue and a soil-rim wedge across the water.
      riverMouthY = 1550,
      riverMouthX = riverBanks(riverMouthY * scale, size)[0] / scale + 24,
      tailrace = [
        [1110, 1415],
        [1180, 1510],
        [1320, 1570],
        [riverMouthX, riverMouthY],
      ].map(q),
      stream = [
        [900, 880],
        [875, 980],
        [930, 1090],
        [950, 1160],
      ].map(q),
      // An upstream, walkable shallow tributary connects to the real millpond.
      upperCreek = [
        [1220, 0], [1240, 180], [1280, 350], [1265, 515],
        [1190, 680], [1090, 780], [940, 875], [900, 880],
      ].map(q),
      shallowCreek = { ...ribbon(upperCreek, 17, { subdivisions: 2 }), shallow: true },
      waters = [
        pond, ribbon(stream, 16, { subdivisions: 2 }),
        ribbon(headrace, 12), ribbon(tailrace, 20, { subdivisions: 3 }), shallowCreek,
      ],
      millBridge = {
        from: q([1210, 1575]), to: q([1250, 1495]),
        width: 62 * scale, kind: 'timber',
      },
      creekCulvert = {
        from: q([1070, 725]), to: q([1145, 805]),
        width: 76 * scale, kind: 'stone-culvert',
      },
      // One genuine service road branches from the existing west-bank farm road,
      // ends on dry ground; its NARROW footpath crosses the true
      // millrace timber bridge before reaching the loading doorway.
      millServiceLane = [
        [650, 1550], [785, 1595], [990, 1655], [1200, 1660],
      ].map(q),
      // A 24-unit pedestrian trail, NOT a cart road, runs across the
      // 62-unit-wide timber deck and then bends to the actual mill door.
      millDoorFootpath = [
        [1200, 1660], [1210, 1575], [1250, 1495],
        [1400, 1490], [1290, 1490], [1210, 1485],
      ].map(q);
    R.terrain[0] = [
      { kind: 'rain-pools', wetland: true, pools: waters,
        blockingPools: waters.filter((pool) => !pool.shallow) },
      // #806: isolated eastern blue disc retired for the dry wolf-scout homestead.
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
      upperCreek,
      millBridge,
      creekCulvert,
      millServiceLane,
      millDoorFootpath,
      millEntrance: q([1210, 1485]),
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
      // A one-time exterior-only correction for fresh Vale and saved scene-5
      // campaigns. Repositions the existing dungeon entrance and construction
      // props without regenerating terrain, bosses, player camps or paid state.
      greenwoodEstateFacadeScene(z) {
        const cfg = R.greenwoodLayout;
        if (z.id !== 'vale' || cfg?.version !== 2 ||
            z.greenwoodRedesignScene !== cfg.sceneVersion ||
            z.greenwoodEstateFacadeVersion === 1) return;
        const entry = z.npcs.find((n) => n.id === 'entrance' &&
          n.kind === 'dungeon' && n.family === 'crypt');
        if (!entry) return;
        const previous = {x: 2830 * cfg.scale, y: 2850 * cfg.scale};
        const next = cfg.anchors.crypt;
        // No replacement NPC or revised gameplay ID: old saves must still
        // refer to the same enterable Crypt and the same associated quests.
        if (distance(entry, previous) < 2 || distance(entry, next) < 2)
          Object.assign(entry, next);
        else return; // Preserve an unknown hand-placed or future location.
        // The authoritative road/camera route and the separately serialized
        // movement arrays may not share object identity after a v4 restore.
        // The real depot apron starts on the old road at (2500,2660).
        // Moving the entrance must preserve this *physical* junction.
        const depotJunction = {x: 2500 * cfg.scale, y: 2660 * cfg.scale};
        const reanchor = (path) => {
          if (!Array.isArray(path) || path.length < 2 ||
              distance(path.at(-1), previous) >= 2) return;
          if (distance(path.at(-2), depotJunction) > 1)
            path.splice(path.length - 1, 0, {...depotJunction});
          Object.assign(path.at(-1), next);
        };
        for (const r of z.greenwoodRoutes || [])
          if (r.kind === 'farm') reanchor(r.points);
        for (const road of z.roads || []) reanchor(road);
        for (const path of z.footpaths || []) reanchor(path);
        const work = [
          ['estate-scaffold', 2970, 2830],
          ['stacked-lumber', 2740, 3080],
          ['tool-rack', 2640, 2970],
          ['supply-stack', 3060, 3040],
        ];
        work.forEach(([structure, x, y], j) => {
          const p = z.props.find((p) => p.id === 'greenwood-estate-' + j);
          // User-owned content and unexpected replacement props are never
          // teleported just to tidy an estate screenshot.
          if (p && !p.playerOwned && !p.owned && !p.custom &&
              p.structure === structure)
            Object.assign(p, {x: x * cfg.scale, y: y * cfg.scale});
        });
        z.greenwoodEstateFacadeVersion = 1;
      }
      greenwoodWatermillScene(z) {
        const cfg = R.greenwoodLayout;
        if (z.id !== 'vale' || cfg?.version !== 2 ||
            z.greenwoodRedesignScene !== cfg.sceneVersion) return;
        // A previously saved #824 bridge can still carry its old 56-unit
        // visual deck even though the source river gap now permits 80.
        // Sync ONLY that existing southern crossing on the v4 fast path.
        if (z.bridgeApproaches?.[1] &&
            z.bridgeApproaches[1].width !== 80)
          z.bridgeApproaches[1].width = 80;
        if (z.greenwoodWatermillVersion === 2) return;
        const lane = cfg.millServiceLane, footpath = cfg.millDoorFootpath,
          previousLane = [[1200,1660],[1290,1600],[1350,1530],[1400,1490]]
            .map(([x,y])=>({x:x*cfg.scale,y:y*cfg.scale}));
        const same = (path, expected) => Array.isArray(path) &&
          path.length === expected.length &&
          path.every((p,j) => distance(p,expected[j]) < 0.01);
        // Preview v1 briefly contained a disconnected four-point farm lane.
        // Replace ONLY that exact known authored shape, not a player route,
        // command, established road or protected saved object.
        if (z.greenwoodWatermillVersion === 1) {
          z.roads = z.roads.filter((path)=>!same(path,previousLane));
          if (Array.isArray(z.greenwoodRoutes))
            z.greenwoodRoutes = z.greenwoodRoutes.filter((r)=>
              !(r.kind==='farm' && same(r.points,previousLane)));
          if (Array.isArray(z.greenwoodRoadKinds))
            z.greenwoodRoadKinds.length = z.roads.length;
        }
        if (!z.roads.some((path)=>same(path,lane)))
          z.roads.push(lane.map((p)=>({...p})));
        if (!z.footpaths.some((path)=>same(path,footpath)))
          z.footpaths.push(footpath.map((p)=>({...p})));
        if (z.greenwoodRoutes && !z.greenwoodRoutes.some((r)=>same(r.points,lane)))
          z.greenwoodRoutes.push({kind:'farm',points:lane.map((p)=>({...p}))});
        if (z.greenwoodRoutes && !z.greenwoodRoutes.some((r)=>same(r.points,footpath)))
          z.greenwoodRoutes.push({kind:'path',points:footpath.map((p)=>({...p}))});
        const targets = [
          ['greenwood-mill-0',1450,1410],
          ['greenwood-mill-1',1410,1380],
          ['greenwood-mill-2',1390,1410],
        ];
        // Move only replaceable legacy work scenery, never owner objects,
        // actors, residents, saved orders, tribute or physical infrastructure.
        for (const [id,x,y] of targets) {
          const p=z.props.find((item)=>item.id===id);
          if (!p || p.playerOwned || p.owned || p.custom) continue;
          const point={x:x*cfg.scale,y:y*cfg.scale};
          if (this.blocked(point.x,point.y,'vale',p.r||12,true) ||
              z.buildings.some((b)=>distance(b,point)<130)) continue;
          Object.assign(p,point);
        }
        // #824's original four typed roads retain their order/identity.
        if (Array.isArray(z.greenwoodRoadKinds))
          while(z.greenwoodRoadKinds.length<z.roads.length)
            z.greenwoodRoadKinds.push('farm');
        z.greenwoodWatermillVersion=2;
      }
      // #806: reconstruct the old eastern water circle as a coherent, dry
      // wolf-scout homestead without re-running destructive regional generation.
      greenwoodHomesteadScene(z) {
        const cfg = R.greenwoodLayout;
        if (
          z.id !== 'vale' ||
          cfg?.version !== 2 ||
          z.greenwoodRedesignScene !== cfg.sceneVersion ||
          z.greenwoodHomesteadVersion === 1
        )
          return;
        const scale = cfg.scale;
        const point = (x, y) => ({ x: x * scale, y: y * scale });
        const clean = (p, clearance = 0) =>
          !this.blocked(p.x, p.y, 'vale', clearance, true) &&
          this.distanceToRoad(z, p) >= clearance + 42 &&
          this.distanceToRoad({ roads: z.footpaths || [] }, p) >= clearance + 30 &&
          !z.buildings.some((b) => distance(b, p) < clearance + 115) &&
          !z.props.some(
            (v) =>
              (v.playerOwned || v.owned || v.custom) &&
              distance(v, p) < clearance + (v.r || 25) + 45,
          ) &&
          !z.npcs.some((n) => distance(n.servicePoint || n, p) < clearance + 80) &&
          !z.nodes.some((n) => distance(n, p) < clearance + 50) &&
          !z.enemies.some((e) => e.hp > 0 && distance(e.home || e, p) < clearance + 85);
        const alternatives = [
          [0, 0],
          [-65, -25],
          [45, -40],
          [-50, 45],
        ];
        const layouts = [
          ['lodge', 2690, 1170, 55],
          ['rest-bay', 2830, 1245, 23],
          // The former loose gear/training props and two partial rail lengths
          // cluttered this small yard. Existing surrounding farm equipment,
          // shelter and Crown standard already communicate its occupation.
        ];
        const chosen = alternatives.find(([dx, dy]) =>
          layouts.slice(0, 2).every(([, x, y, radius]) => clean(point(x + dx, y + dy), radius)),
        );
        const audit = { dryPond: true, constructed: false, skipped: [], offsets: chosen || null };
        // The plot belongs to saved players and existing residents first.
        // An occupied custom parcel must not be bulldozed to paint a homestead.
        if (!chosen) {
          z.greenwoodHomesteadAudit = {
            ...audit,
            reason: 'owned, road or actor plot needs inspection',
          };
          z.greenwoodHomesteadVersion = 1;
          return;
        }
        const [dx, dy] = chosen;
        const placements = layouts.filter(
          ([kind, x, y, r], index) => index < 2 || clean(point(x + dx, y + dy), r),
        );
        // Remove only replaceable natural scatter from the immediate shelter
        // footprints. No paid object, Quest NPC, beast or existing pasture asset.
        const cleared = placements.filter(([kind]) => kind === 'lodge' || kind === 'rest-bay');
        z.props = z.props.filter(
          (p) =>
            !(
              p.greenwoodNature &&
              cleared.some(
                ([, x, y, r]) => distance(p, point(x + dx, y + dy)) < r * scale + 60 * scale,
              )
            ),
        );
        for (const [kind, x, y, radius] of placements) {
          const blocking = kind === 'lodge' || kind === 'rest-bay';
          z.props.push({
            id: 'greenwood-thorn-homestead-' + kind,
            ...point(x + dx, y + dy),
            structure: 'thorn-homestead-' + kind,
            greenwoodFacility: 'thorn-' + kind,
            greenwoodDistrict: 'thorn-personal-homestead',
            greenwoodAuthored: true,
            r: blocking ? radius * scale : 0,
            decorative: !blocking,
            roadBlocker: blocking,
          });
        }
        audit.constructed = true;
        audit.skipped = layouts
          .filter(([name]) => !placements.some(([kind]) => name === kind))
          .map(([name]) => name);
        z.greenwoodHomesteadAudit = audit;
        z.greenwoodHomesteadVersion = 1;
      }
      greenwoodOwnerCompoundFinish(z) {
        if (z.id === 'vale' && z.greenwoodDepartureClearanceVersion !== 1) {
          const a = R.greenwoodLayout.anchors.wagon,
            b = { x: 3200, y: 80 };
          const dx = b.x - a.x,
            dy = b.y - a.y,
            len2 = dx * dx + dy * dy;
          z.props = z.props.filter((p) => {
            if (!p.greenwoodNature || p.owned || p.playerOwned || p.custom) return true;
            const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
            return t < 0 || t > 1 || Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy) > 75;
          });
          z.greenwoodDepartureClearanceVersion = 1;
        }
        if (z.id === 'vale' && z.greenwoodOwnerHomesteadLayoutVersion !== 1) {
          const bay = z.props.find((p) => p.id === 'greenwood-thorn-homestead-rest-bay');
          const lodge = z.props.find((p) => p.id === 'greenwood-thorn-homestead-lodge');
          if (bay && lodge && !bay.owned && !bay.playerOwned && !bay.custom) {
            const sc = R.greenwoodLayout.scale;
            const at = { x: lodge.x + 110 * sc, y: lodge.y + 220 * sc };
            if (
              !this.blocked(at.x, at.y, 'vale', bay.r || 23, true) &&
              this.distanceToRoad(z, at) > 65 * sc &&
              !z.buildings.some((p) => distance(p, at) < 100 * sc)
            )
              Object.assign(bay, at);
          }
          z.greenwoodOwnerHomesteadLayoutVersion = 1;
        }
        // Recompose Scornfang's *existing* loose records/store props beside
        // the farm loading apron. Keep exact IDs and never move player property.
        // This is intentionally independent of the already-completed fort pass,
        // so old version-4 saves also receive the modest visual arrangement.
        if (z.id === 'vale' && z.greenwoodTreasuryYardLayoutVersion !== 1) {
          const center = R.greenwoodLayout.anchors.treasury;
          const moves = [
            ['stronghold-treasury-yard-prop-2', -110, 73],
            ['stronghold-treasury-yard-prop-3', -143, 84],
          ];
          const grouped = [];
          const skipped = [];
          for (const [id, dx, dy] of moves) {
            const p = z.props.find((q) => q.id === id);
            if (!p || p.playerOwned || p.owned || p.custom) {
              skipped.push(id);
              continue;
            }
            const at = { x: center.x + dx, y: center.y + dy };
            if (
              this.blocked(at.x, at.y, 'vale', p.r || 0, true) ||
              this.distanceToRoad(z, at) < 45 ||
              z.buildings.some((b) => distance(b, at) < 85) ||
              z.npcs.some((n) => distance(n.servicePoint || n, at) < 65) ||
              z.props.some(
                (q) =>
                  q !== p &&
                  !q.greenwoodWall &&
                  !q.greenwoodNature &&
                  distance(q, at) < (q.r || 0) + (p.r || 0) + 24,
              )
            ) {
              skipped.push(id);
              continue;
            }
            Object.assign(p, at);
            grouped.push(id);
          }
          z.greenwoodTreasuryYardLayoutAudit = { grouped, skipped };
          z.greenwoodTreasuryYardLayoutVersion = 1;
        }
        // Cosmetic-only correction for existing v4 campaigns: remove exactly
        // the four redundant authored homestead decorations. Preserve paid,
        // custom and player-owned objects even if they reuse one of these IDs.
        if (z.id === 'vale' && z.greenwoodHomesteadPresentationVersion !== 1 &&
            z.greenwoodRedesignScene === R.greenwoodLayout?.sceneVersion) {
          const obsolete = new Set([
            'greenwood-thorn-homestead-gear',
            'greenwood-thorn-homestead-training',
            'greenwood-thorn-homestead-rear-rail',
            'greenwood-thorn-homestead-east-rail',
          ]);
          z.props = z.props.filter((p) =>
            !obsolete.has(p.id) || p.playerOwned || p.owned || p.custom);
          z.greenwoodHomesteadPresentationVersion = 1;
        }
        if (
          z.id !== 'vale' ||
          z.greenwoodOwnerCompoundVersion === 2 ||
          z.greenwoodRedesignScene !== R.greenwoodLayout?.sceneVersion
        )
          return;
        const sc = R.greenwoodLayout.scale,
          center = R.greenwoodLayout.anchors.goblin;
        const audit = { shelters: [], standard: false };
        // Joined endpoints transform identically; east gate stays in place.
        if (z.greenwoodOwnerCompoundVersion !== 1)
          for (const wall of z.props.filter(
            (p) => p.stronghold === 'goblin-road-fort' && p.greenwoodWall,
          )) {
            for (const key of ['a', 'b']) {
              const p = wall.greenwoodWall[key],
                dx = p.x - center.x,
                dy = p.y - center.y;
              p.x = center.x + dx * (dx < 0 ? 1.15 : 1);
              p.y = center.y + dy * (dy < 0 ? 1.3 : 1.08);
            }
            wall.x = (wall.greenwoodWall.a.x + wall.greenwoodWall.b.x) / 2;
            wall.y = (wall.greenwoodWall.a.y + wall.greenwoodWall.b.y) / 2;
          }
        for (const [index, dx, dy] of [
          [0, -115, -120],
          [1, 85, -120],
        ]) {
          const p = z.props.find((p) => p.id === 'stronghold-goblin-road-fort-prop-' + index);
          if (!p || p.owned || p.playerOwned || p.custom) continue;
          Object.assign(p, {
            x: center.x + dx * sc,
            y: center.y + dy * sc,
            structure: 'lean-to',
            visualScale: 1.8,
            greenwoodGoblinShelter: true,
          });
          audit.shelters.push(p.id);
        }
        // Real existing outdoor trap resolver, two avoidable defended flanks.
        // The east gate itself remains a clear entry lane.
        z.ownerDefensiveTraps = (z.ownerDefensiveTraps || []).filter(
          (t) => t.owner !== 'goblin-road-fort',
        );
        for (const [j, dy] of [-105, 115].entries()) {
          const at = { x: center.x + 260 * sc, y: center.y + dy * sc };
          if (
            this.blocked(at.x, at.y, 'vale', 45, true) ||
            this.distanceToRoad(z, at) < 70 * sc ||
            z.nodes.some((p) => distance(p, at) < 100 * sc)
          )
            continue;
          z.ownerDefensiveTraps.push({
            ...at,
            kind: 'spikes',
            index: 3100 + j,
            owner: 'goblin-road-fort',
          });
        }
        const lodge = z.props.find((p) => p.id === 'greenwood-thorn-homestead-lodge');
        if (lodge && !lodge.owned && !lodge.playerOwned && !lodge.custom) {
          // A proportionate solid footprint; reserve former loading apron.
          lodge.r = 40 * sc;
          const id = 'greenwood-thorn-homestead-standard';
          const at = { x: lodge.x - 90 * sc, y: lodge.y + 105 * sc };
          if (
            !z.props.some((p) => p.id === id) &&
            !this.blocked(at.x, at.y, 'vale', 12, true) &&
            !z.buildings.some((p) => distance(p, at) < 100 * sc)
          ) {
            z.props.push({
              id,
              ...at,
              r: 0,
              decorative: true,
              structure: 'crown-banner',
              greenwoodAuthored: true,
              greenwoodDistrict: 'thorn-personal-homestead',
            });
            audit.standard = true;
          }
        }
        // Authored civic anchors reuse existing lamps where their light covers
        // the same public role; rejected points never masquerade as placements.
        audit.publicLights = [];
        for (const [key, x, y] of [
          ['square', 650, 600],
          ['market', 810, 730],
          ['village-south', 650, 1400],
          ['hamlet', 550, 1750],
          ['freight-bridge', 1470, 990],
        ]) {
          const anchor = { x: x * sc, y: y * sc };
          const existing = z.props.find(
            (p) =>
              ['roadside-lantern', 'grave-lamp'].includes(p.structure) &&
              distance(p, anchor) < 130 * sc,
          );
          const service = z.npcs.find(
            (p) =>
              ['supplier', 'recruiter', 'quests'].includes(p.kind) &&
              distance(p, anchor) < 150 * sc,
          );
          if (!existing && service && key === 'market') {
            audit.publicLights.push({ key, id: service.id, status: 'existing-mounted-work-lamp' });
            continue;
          }
          if (existing) {
            audit.publicLights.push({ key, id: existing.id, status: 'existing' });
            continue;
          }
          let at = null;
          for (const [dx, dy] of [
            [60, 45],
            [-60, 45],
            [90, -45],
            [-90, -45],
            [120, 100],
            [-120, 100],
          ]) {
            const candidate = { x: anchor.x + dx * sc, y: anchor.y + dy * sc };
            if (
              this.blocked(candidate.x, candidate.y, 'vale', 15, true) ||
              this.distanceToRoad(z, candidate) < 75 * sc ||
              z.buildings.some((p) => distance(p, candidate) < 100 * sc) ||
              z.npcs.some((p) => distance(p.servicePoint || p, candidate) < 60 * sc) ||
              z.nodes.some((p) => distance(p, candidate) < 55 * sc)
            )
              continue;
            at = candidate;
            break;
          }
          const id = 'greenwood-owner-public-light-' + key;
          if (at)
            z.props.push({
              id,
              ...at,
              r: 0,
              decorative: true,
              structure: 'roadside-lantern',
              greenwoodAuthored: true,
              greenwoodPublicLight: true,
            });
          audit.publicLights.push({
            key,
            id: at ? id : null,
            status: at ? 'placed' : 'unresolved',
          });
        }
        // Expanded roof footprints must remain readable; remove only generated
        // replaceable trees already intruding into the new shelter yard.
        const roofs = z.props.filter((p) => p.greenwoodGoblinShelter);
        z.props = z.props.filter(
          (p) =>
            !(
              p.greenwoodNature &&
              p.greenwoodNature === 'tree' &&
              roofs.some((q) => distance(p, q) < 100 * sc)
            ),
        );
        // Replace the array so cached fort geometry observes changed walls.
        z.props = z.props.slice();
        z.greenwoodOwnerCompoundAudit = audit;
        z.greenwoodOwnerCompoundVersion = 2;
      }
      // GV-679 is an additive, nonblocking scene overlay. Never re-run the
      // layout's destructive scene generator or its enemy/home corrections to
      // deliver cosmetic refinements to an existing v4 campaign.
      greenwoodRefinementScene(z) {
        this.greenwoodHomesteadScene(z);
        this.greenwoodOwnerCompoundFinish(z);
        if (
          z.id !== 'vale' ||
          R.greenwoodLayout?.version !== 2 ||
          z.greenwoodRefinementVersion === 1 ||
          z.greenwoodRedesignScene !== R.greenwoodLayout.sceneVersion
        )
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
          const conflict =
            this.blocked(point.x, point.y, 'vale', 0, true) ||
            this.distanceToRoad(z, point) < 45 ||
            this.distanceToRoad({ roads: z.footpaths || [] }, point) < 35 ||
            z.buildings.some((b) => distance(b, point) < 135) ||
            z.props.some(
              (p) => (p.owned || p.playerOwned || p.custom) && distance(p, point) < 85,
            ) ||
            z.npcs.some((n) => distance(n.servicePoint || n, point) < 65) ||
            z.nodes.some((n) => distance(n, point) < 35) ||
            z.enemies.some((e) => e.hp > 0 && distance(e.home || e, point) < 60);
          if (conflict) {
            audit.push({
              id,
              placed: false,
              reason: 'protected road, water, owner, service or actor clearance',
            });
            continue;
          }
          z.props.push({
            id,
            structure,
            ...point,
            r: 0,
            decorative: true,
            greenwoodAuthored: true,
            greenwoodRefinement: 1,
          });
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
        // Road/bridge topology and physical deck spans are independently
        // owned by the dedicated Greenwood infrastructure PR #824.
        // This scenery pass observes routes but never edits their geometry.
        // Preserve all 17 #824 canonical corridor indices. The mill adds
        // exactly one farm service spur and one narrow dry-side door footpath.
        const routes = z.greenwoodRoutes || [],
          lane = cfg.millServiceLane || [],
          door = cfg.millDoorFootpath || [],
          matches = (candidate, expected) =>
            candidate?.points?.length === expected.length &&
            candidate.points.every((point,j)=>distance(point,expected[j])<0.01),
          includesMillPair = routes.length === 19 &&
            z.greenwoodWatermillVersion === 2 &&
            routes[17]?.kind === 'farm' && matches(routes[17],lane) &&
            routes[18]?.kind === 'path' && matches(routes[18],door);
        if (![16,17].includes(routes.length) && !includesMillPair) return;
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
              audit.push({
                id,
                placed: false,
                reason: 'target footprint conflicts; original retained',
              });
              return;
            }
            Object.assign(p, desired);
          }
          Object.assign(p, detail);
          audit.push({ id, placed: true, reason: 'existing scene identity retained' });
        };
        // The tiny shared garden/furrow icon is now an intentional household
        // bed or a multi-row rural field, without resizing other regions.
        for (const id of [
          'greenwood-homes-1',
          'greenwood-homes-2',
          'greenwood-homes-4',
          'greenwood-hamlet-2',
        ])
          change(id, 'garden', null, { greenwoodKitchen: true });
        for (const id of ['greenwood-homes-6', 'greenwood-homes-7'])
          change(id, 'furrow-plot', null, { greenwoodField: true });
        change('greenwood-orchard-6', 'furrow-plot', [510, 2080], { greenwoodField: true });
        change('greenwood-refinement-den-thorn-bed', 'thorn-bed', [875, 3070], {
          greenwoodNest: true,
        });
        // Move the entire isolated pond flock to the Hamlet's smallhold, not
        // one animal away from its feed. Avoid the bank and forest occlusion.
        change('greenwood-pasture-0', 'pasture-sheep', [350, 2460]);
        change('greenwood-pasture-1', 'feed-trough', [430, 2500]);
        change('greenwood-pasture-2', 'hay-rick', [250, 2510]);
        const orchard = z.npcs.find((n) => n.id === 'orchard');
        if (orchard) {
          const positions = [
            [1030, 2300],
            [1070, 2360],
            [1040, 2390],
          ];
          const chosen = positions
            .map(([x, y]) => at(x, y))
            .find(
              (p) =>
                !this.blocked(p.x, p.y, 'vale', 14, true) &&
                this.distanceToRoad(z, p) > 88 &&
                this.distanceToRoad({ roads: z.footpaths }, p) > 45 &&
                !z.buildings.some((b) => near(b, p) < 130),
            );
          if (chosen) Object.assign(orchard, chosen);
          audit.push({
            id: 'orchard',
            placed: !!chosen,
            reason: chosen ? 'off-road planted site' : 'no legal marker location',
          });
        }
        const candidates = [
          ['fruit', 510, 1835],
          ['fruit', 820, 1845],
          ['fruit', 425, 2490],
          ['fruit', 760, 2380],
          ['fruit', 1050, 2410],
          ['fruit', 1090, 2110],
          ['fruit', 330, 1930],
          ['fruit', 920, 2570],
          ['fruit', 950, 1940],
          ['fruit', 1180, 2300],
          ['fruit', 670, 2550],
          ['fruit', 1100, 2600],
          ['flowers', 490, 980],
          ['flowers', 730, 1150],
          ['flowers', 350, 1440],
          ['flowers', 470, 1590],
          ['flowers', 1050, 1010],
          ['flowers', 300, 1880],
          ['flowers', 920, 2430],
          ['flowers', 1070, 2630],
          ['flowers', 440, 2700],
          ['flowers', 2210, 640],
          ['flowers', 2600, 790],
          ['flowers', 2900, 1700],
          ['flowers', 2060, 2020],
          ['flowers', 2560, 2880],
          ['flowers', 850, 920],
          ['flowers', 1140, 800],
          ['flowers', 340, 740],
          ['flowers', 2320, 2120],
          ['bush', 1120, 1100],
          ['bush', 420, 1720],
          ['bush', 1130, 2700],
          ['bush', 2440, 650],
          ['bush', 2850, 1800],
          ['bush', 530, 2750],
        ];
        let fruit = 0;
        for (const [i, [kind, x, y]] of candidates.entries()) {
          const id = 'greenwood-composition-' + kind + '-' + i;
          if (z.props.some((p) => p.id === id)) continue;
          const p = at(x, y),
            isTree = kind === 'fruit';
          const limit = isTree ? 110 : kind === 'bush' ? 72 : 46;
          const inUse =
            this.blocked(p.x, p.y, 'vale', isTree ? 18 : 0, true) ||
            this.distanceToRoad(z, p) < limit ||
            this.distanceToRoad({ roads: z.footpaths }, p) < (isTree ? 70 : 28) ||
            z.buildings.some((b) => near(b, p) < (isTree ? 175 : 130)) ||
            z.npcs.some((n) => near(n.servicePoint || n, p) < (isTree ? 100 : 65)) ||
            z.nodes.some((n) => near(n, p) < (isTree ? 65 : 32)) ||
            z.props.some(
              (q) =>
                (q.owned || q.playerOwned || q.custom || q.roadBlocker) &&
                near(q, p) < (isTree ? 155 : 85),
            ) ||
            (isTree &&
              z.props.some(
                (q) =>
                  (q.structure === 'fruit-tree' || q.greenwoodNature === 'tree') &&
                  near(q, p) < 105,
              ));
          if (inUse || z.props.length >= 390) {
            audit.push({
              id,
              placed: false,
              reason: inUse ? 'protected clearance' : 'prop budget',
            });
            continue;
          }
          z.props.push({
            id,
            structure: isTree ? 'fruit-tree' : kind === 'flowers' ? 'wildflowers' : 'bush',
            ...p,
            r: 0,
            decorative: true,
            greenwoodAuthored: true,
            greenwoodComposition: 1,
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
      // Independent route/bridge version: existing v4 saves must never replay
      // greenwoodRedesignFinish's destructive scenery and placement passes.
      greenwoodRoadBridgeFinish(z) {
        const cfg = R.greenwoodLayout;
        if (
          z.id !== 'vale' ||
          cfg?.version !== 2 ||
          z.greenwoodRedesignScene !== cfg.sceneVersion ||
          z.greenwoodRoadBridgeVersion === 1
        )
          return;
        const scale = cfg.scale;
        // R07's eastern bank path must leave the south bridge straight before
        // turning toward Skeleton Watch. R08 must not double-paint 200 units
        // of the main cart line before reaching its own Treasury junction.
        // Find the old geometry itself, not its position in the route array.
        // The freight-depot apron added on main changes those positions; old
        // scene-5 v4 saves can legitimately have either 16 or 17 corridors.
        const replacePoints = (expected, newPoints) => {
          const matches = (p, x, y) =>
            Number.isFinite(p?.x) &&
            Number.isFinite(p?.y) &&
            Math.abs(p.x - x * scale) < 0.01 &&
            Math.abs(p.y - y * scale) < 0.01;
          const matchesOld = (points) => expected.every(([j, x, y]) => matches(points?.[j], x, y));
          const route = z.greenwoodRoutes?.find((r) => r.kind === 'path' && matchesOld(r.points));
          const pathIndex = z.footpaths?.findIndex(matchesOld) ?? -1;
          if (!route || pathIndex < 0) return false;
          const points = newPoints.map(([x, y]) => ({ x: x * scale, y: y * scale }));
          z.footpaths[pathIndex] = points;
          route.points = points;
          return true;
        };
        // The farm cart lane ends on solid ground just before the south
        // crossing. A short pedestrian approach takes over from there: carts
        // should not visually continue across this deliberately timber footbridge.
        const farm = z.roads?.[1];
        if (
          farm?.length === 7 &&
          Math.abs(farm.at(-1).x - 1740 * scale) < 0.01 &&
          Math.abs(farm.at(-1).y - 2280 * scale) < 0.01
        ) {
          const adjusted = [...farm.slice(0, -1), { x: 1560 * scale, y: 2280 * scale }];
          z.roads[1] = adjusted;
          if (z.greenwoodRoutes?.[1]?.kind === 'farm') z.greenwoodRoutes[1].points = adjusted;
        }
        replacePoints(
          [
            [0, 1740, 2280],
            [1, 2150, 2350],
          ],
          [
            [1560, 2280],
            [1740, 2280],
            [1950, 2280],
            [2150, 2350],
            [2300, 2220],
            [2670, 2220],
          ],
        );
        replacePoints(
          [
            [0, 2070, 1000],
            [1, 1870, 1000],
          ],
          [
            [1870, 1000],
            [1870, 1250],
            [2120, 1250],
          ],
        );
        z.greenwoodRoadKinds = z.greenwoodRoutes
          ?.filter((r) => r.kind !== 'path')
          .map((r) => r.kind) || ['cart', 'farm', 'farm', 'farm'];

        // Crossing width metadata, collision gap and illustrated deck now
        // describe one physical width. Existing art IDs and discoveries stay.
        if (Array.isArray(z.bridgeApproaches))
          z.bridgeApproaches.forEach((bridge, j) => {
            bridge.width = j === 0 ? 100 : 80;
          });

        // A save can place a traveling actor near the *old* broad bridge
        // edge. Move only an actor stranded by the newly narrower water gap,
        // into the same crossing at its centerline; do not teleport residents,
        // loot, work orders, or owned buildings across the river.
        const affected = [];
        const gaps = R.barriers[0].gaps;
        const actors = [
          ...z.enemies.filter((p) => p.hp > 0),
          ...(this.s.zone === 'vale' ? [this.hero, ...this.s.party] : []),
        ];
        for (const p of actors) {
          if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
          for (const [lo, hi] of gaps) {
            const center = (lo + hi) / 2;
            const [left, right] = riverBanks(center, cfg.size);
            if (
              Math.abs(p.y - center) > 90 ||
              p.x < left - 18 ||
              p.x > right + 18 ||
              !this.blocked(p.x, p.y, 'vale', p.r || 12, true)
            )
              continue;
            if (!this.blocked(p.x, center, 'vale', p.r || 12, true)) {
              p.y = center;
              for (const key of ['path', 'pathTarget', 'idleWanderTarget']) delete p[key];
              affected.push(p.id || 'hero');
            }
            break;
          }
        }
        z.greenwoodRoadBridgeAudit = { snappedActors: affected };
        z.greenwoodRoadBridgeVersion = 1;
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
              [[2320, 900], [2500, 1350], [2420, 1690], [2240, 1980], [2240, 2510], [2500, 2660], plan.crypt],
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
            // Short off-road freight apron from the existing Crypt approach.
            ['path', [[2500, 2660], plan.cache]],
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
            ['north', 90],
            ['south', 65],
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
              ['cart', 2515, 2570],
              ['supply-stack', 2670, 2570],
              ['scribe-desk', 2600, 2500],
              ['stacked-lumber', 2690, 2660],
            ],
            estate: [
              // A working west-side staging yard and active east-wing roof crew,
              // leaving the approach to the actual doorway visibly open.
              ['estate-scaffold', 2970, 2830],
              ['stacked-lumber', 2740, 3080],
              ['tool-rack', 2640, 2970],
              ['supply-stack', 3060, 3040],
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
          // Shape authored routes and bridge corridors before positioning
          // homestead and botanical overlays against their final road footprint.
          // The method's own version guard keeps restore idempotent.
          this.greenwoodRoadBridgeFinish(z);
          this.greenwoodWatermillScene(z);
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
  // A single coherent native painter for the homestead's actual silhouettes.
  // Shared isometric axes and a fixed palette avoid disconnected box art.
  function drawThornHomestead(ctx, e, p) {
    const kind = e.greenwoodFacility;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const poly = (a, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      a.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fill();
    };
    const stroke = (a, color, width = 2) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      a.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    };
    const oval = (x, y, rx, ry, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    const wood = '#76563d',
      beam = '#4d3c30',
      edge = '#b6956a';
    const lantern = (x, y) => {
      stroke(
        [
          [x, y - 19],
          [x, y - 9],
        ],
        beam,
        2,
      );
      poly(
        [
          [x - 5, y - 9],
          [x + 5, y - 9],
          [x + 6, y + 3],
          [x - 6, y + 3],
        ],
        '#493e32',
      );
      poly(
        [
          [x - 3, y - 6],
          [x + 3, y - 6],
          [x + 4, y],
          [x - 4, y],
        ],
        '#e6b978',
      );
      stroke(
        [
          [x - 5, y + 4],
          [x + 5, y + 4],
        ],
        edge,
        2,
      );
    };
    if (kind === 'thorn-lodge') {
      // Appropriated agricultural store: the loading opening is retained at
      // wolf scale while the surrounding monumental roof is reauthored.
      // Small body contact under the actual barn walls, not a displaced oval.
      poly(
        [
          [-60, -1],
          [31, 16],
          [85, -2],
          [85, 2],
          [31, 21],
          [-60, 4],
        ],
        '#293a2f66',
      );
      poly(
        [
          [-63, 0],
          [31, 19],
          [87, 0],
          [-7, -20],
        ],
        '#777561',
      );
      poly(
        [
          [-60, -63],
          [31, -45],
          [31, 15],
          [-60, -3],
        ],
        '#927453',
      );
      poly(
        [
          [31, -45],
          [84, -63],
          [84, -3],
          [31, 15],
        ],
        '#65513e',
      );
      poly(
        [
          [-60, -63],
          [-14, -98],
          [31, -45],
        ],
        '#9b7b56',
      );
      for (let j = 0; j < 7; j++) {
        const x = -55 + j * 13;
        stroke(
          [
            [x, -59 + (x + 55) * 0.2],
            [x, -5 + (x + 55) * 0.2],
          ],
          '#71573f',
          1,
        );
      }
      // Broad old loading door, open for a quadruped, not a scaled-down pet door.
      poly(
        [
          [-34, -49],
          [17, -39],
          [17, 11],
          [-34, 1],
        ],
        '#27372e',
      );
      oval(-8, 4, 24, 7, '#b29a72');
      for (let j = 0; j < 6; j++)
        stroke(
          [
            [-28 + j * 8, 2],
            [-23 + j * 8, 6],
          ],
          '#d8bf8d',
          1,
        );
      stroke(
        [
          [-38, 1],
          [-38, -54],
          [21, -42],
          [21, 13],
        ],
        beam,
        5,
      );
      // Keep the reused granary's front gable solid and legible. The old
      // dark diamond grain hatch overlapped the pitched roof as a false hole.
      // Small side ventilation below remains sufficient farm-building detail.
      for (let j = 0; j < 3; j++)
        stroke(
          [
            [47, -42 + j * 5],
            [69, -49 + j * 5],
          ],
          '#302d28',
          2,
        );
      // Clean two-plane pitched roof: matching depth vectors and one
      // front gable, with restrained weathering rather than overlapping
      // diagonal shingles along the visible left eave.
      const roofFrontLeft = [-64, -67],
        roofFrontRidge = [-14, -98],
        roofFrontRight = [36, -50],
        roofRearLeft = [-16, -83],
        roofRearRidge = [34, -114],
        roofRearRight = [84, -66];
      poly(
        [roofFrontLeft, roofFrontRidge, roofRearRidge, roofRearLeft],
        '#94734f',
      );
      poly(
        [roofFrontRidge, roofFrontRight, roofRearRight, roofRearRidge],
        '#624c38',
      );
      // Close the overhanging right eave onto the real side wall. Without
      // this narrow fascia, the backdrop shows through as a green wedge.
      poly([roofFrontRight, roofRearRight, [84, -63], [31, -45]], '#4b3b2d');
      stroke([roofFrontLeft, roofFrontRidge, roofFrontRight], edge, 2.5);
      stroke([roofFrontRidge, roofRearRidge], '#b6956a', 2);
      stroke([roofFrontLeft, roofRearLeft], '#a98c64', 1.6);
      stroke([roofFrontRight, roofRearRight], '#a98c64', 1.6);
      // Only two faint aligned board seams on the long visible pitch.
      for (const t of [1 / 3, 2 / 3]) {
        stroke(
          [
            [
              roofFrontRidge[0] + (roofFrontRight[0] - roofFrontRidge[0]) * t,
              roofFrontRidge[1] + (roofFrontRight[1] - roofFrontRidge[1]) * t,
            ],
            [
              roofRearRidge[0] + (roofRearRight[0] - roofRearRidge[0]) * t,
              roofRearRidge[1] + (roofRearRight[1] - roofRearRidge[1]) * t,
            ],
          ],
          '#876b4e',
          0.9,
        );
      }
      stroke(
        [
          [-61, -61],
          [-61, -1],
        ],
        beam,
        4,
      );
      stroke(
        [
          [83, -61],
          [83, -2],
        ],
        beam,
        4,
      );
      lantern(40, -25);
    } else if (kind === 'thorn-rest-bay') {
      // Lower former livestock lean-to, now a wolf rest bay: one continuous
      // single-pitch roof on four grounded posts, no fake enclosed cottage.
      // The entrance and dry bedding remain fully visible from the yard.
      poly(
        [
          [-47, -5],
          [7, 13],
          [57, -5],
          [3, -22],
        ],
        '#786f56',
      );
      poly(
        [
          [-44, -3],
          [6, 10],
          [53, -5],
          [3, -19],
        ],
        '#80785c',
      );
      // A short rear windbreak, below the open eaves.
      poly(
        [
          [-40, -40],
          [5, -61],
          [5, -26],
          [-40, -7],
        ],
        '#68513c',
      );
      stroke([[-38, -32], [4, -50]], '#a78a64', 2);
      for (const [x, y, topY] of [
        [3, -19, -78],
        [54, -7, -55],
      ]) {
        oval(x, y + 2, 6, 2.5, '#24372766');
        stroke([[x, y], [x, topY]], beam, 6);
      }
      // Raised, dry bed with a neat bank of old straw behind the open front.
      poly(
        [
          [-34, 0],
          [5, 8],
          [35, -2],
          [-4, -12],
        ],
        '#4e4638',
      );
      oval(0, -3, 30, 8, '#b5a074');
      oval(-2, -5, 25, 5, '#d1bc8b');
      for (let j = 0; j < 5; j++)
        stroke(
          [
            [-25 + j * 11, -4],
            [-19 + j * 11, 1],
          ],
          '#ddc998',
          1.5,
        );
      for (const [x, y, topY] of [
        [-43, -2, -60],
        [7, 12, -32],
      ]) {
        oval(x, y + 2, 6, 2.5, '#24372766');
        stroke([[x, y], [x, topY]], beam, 6);
      }
      // Four eaves are a parallelogram, never crossed roof slopes.
      const restRoof = [
        [-48, -62],
        [4, -86],
        [60, -62],
        [8, -38],
      ];
      poly(restRoof, '#896645');
      poly(
        [
          restRoof[3],
          restRoof[2],
          [60, -56],
          [8, -32],
        ],
        '#4a3b2d',
      );
      stroke(restRoof.concat([restRoof[0]]), '#c5a477', 3);
      for (let j = 1; j < 4; j++) {
        const t = j / 4;
        stroke(
          [
            [-48 + 52 * t, -62 - 24 * t],
            [8 + 52 * t, -38 - 24 * t],
          ],
          '#ad875b',
          1.2,
        );
      }
      stroke([[43, -28], [53, -33]], '#b39a6f', 2);
      oval(44, -26, 3, 4, '#c7a572');
    } else if (kind === 'thorn-gear') {
      // A low open gear rack on the former threshing edge, not another roof.
      poly(
        [
          [-35, 7],
          [4, 14],
          [39, 4],
          [0, -3],
        ],
        '#7e7559',
      );
      for (const [x, ground, top] of [
        [-26, 9, -43],
        [27, 4, -46],
      ]) {
        oval(x, ground + 1, 5, 2.3, '#24372766');
        stroke([[x, ground], [x, top]], beam, 5);
      }
      stroke([[-30, -47], [32, -50]], edge, 6);
      stroke([[-26, -29], [28, -31]], '#ab9066', 3);
      stroke([[-25, 6], [27, -29]], '#634b38', 2);
      for (const x of [-12, 5, 19]) {
        stroke([[x, -47], [x, -25]], '#4a4030', 2);
        oval(x, -23, 4, 2.5, '#aa8a5c');
      }
      // Two rolled canvas bundles and the scout's compact field equipment.
      poly([[-21, 3], [-2, 6], [10, 0], [-8, -3]], '#76664d');
      poly([[7, 5], [23, 7], [31, 2], [15, 0]], '#ac956f');
      stroke([[-18, 1], [-3, 4]], '#c3ac81', 1.5);
    } else if (kind === 'thorn-training') {
      // A coherent practice rail with two low targets; open yard remains clear.
      poly(
        [
          [-42, 7],
          [2, 18],
          [44, 7],
          [0, -5],
        ],
        '#82775a',
      );
      stroke([[-34, -20], [33, -24]], '#836848', 4);
      for (const [x, y, height] of [
        [-32, 8, 36],
        [32, 5, 31],
      ]) {
        oval(x, y + 2, 5, 2.4, '#22352666');
        stroke([[x, y], [x, y - height]], wood, 6);
        poly(
          [
            [x - 8, y - height + 4],
            [x + 8, y - height + 4],
            [x + 10, y - height + 19],
            [x - 10, y - height + 19],
          ],
          '#998369',
        );
        stroke([[x - 6, y - height + 11], [x + 6, y - height + 11]], '#5b5142', 1.5);
      }
      // The practice line meets the posts, not a free-standing row of stakes.
      stroke([[-32, 5], [32, 2]], '#ac8e63', 2);
    } else if (kind === 'thorn-rear-rail' || kind === 'thorn-east-rail') {
      const lean = kind === 'thorn-rear-rail' ? -1 : 1;
      const x1 = -52,
        x2 = 52,
        y1 = lean * 11,
        y2 = -lean * 11;
      stroke(
        [
          [x1, y1 - 13],
          [x2, y2 - 13],
        ],
        '#785e45',
        5,
      );
      stroke(
        [
          [x1, y1 - 27],
          [x2, y2 - 27],
        ],
        '#a2825a',
        4,
      );
      for (let i = 0; i < 4; i++) {
        const x = x1 + i * 34,
          y = y1 + ((y2 - y1) * i) / 3;
        oval(x, y + 7, 5, 2.2, '#24372766');
        stroke(
          [
            [x, y + 6],
            [x, y - 38],
          ],
          '#534435',
          6,
        );
        stroke(
          [
            [x - 4, y - 38],
            [x + 4, y - 38],
          ],
          '#c2a47a',
          3,
        );
      }
    }
    ctx.restore();
  }

  function drawFacility(ctx, e, p) {
    if (e.greenwoodFacility?.startsWith('thorn-')) return drawThornHomestead(ctx, e, p);
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
      // One timber-on-stone industrial building with a single coherent
      // three-quarter projection. The old overlapping roof/wall rectangles
      // looked like multiple unrelated houses sharing a wheel.
      ctx.fillStyle = '#17291e66';
      ctx.beginPath();
      ctx.ellipse(2, 16, 86, 20, -0.08, 0, Math.PI * 2);
      ctx.fill();
      // Two masonry foundation faces meet at the same front corner.
      poly(
        [
          [-68, -32],
          [0, -9],
          [0, 20],
          [-68, -3],
        ],
        '#a5a18b',
      );
      poly(
        [
          [0, -9],
          [69, -32],
          [69, -3],
          [0, 20],
        ],
        '#7a8275',
      );
      for (let row = 0; row < 3; row++) {
        const rise = row * 8;
        line([-67, -27 + rise], [-1, -5 + rise], '#626e64', 1.2);
        line([1, -5 + rise], [68, -27 + rise], '#515d56', 1.1);
        for (let j = 0; j < 4; j++) {
          const f = (j + (row % 2) * 0.5) / 4;
          line(
            [-67 + 66 * f, -27 + rise + 22 * f],
            [-67 + 66 * f, -20 + rise + 22 * f],
            '#6e7769',
            0.7,
          );
        }
      }
      // Timber walls have different sun/shade values but identical construction.
      poly(
        [
          [-65, -98],
          [0, -76],
          [0, -9],
          [-65, -31],
        ],
        '#b79b6b',
      );
      poly(
        [
          [0, -76],
          [67, -98],
          [67, -31],
          [0, -9],
        ],
        '#927651',
      );
      // Vertical planking follows each wall plane, not world-aligned decals.
      for (let j = 1; j < 9; j++) {
        const f = j / 9,
          x = -65 + 65 * f,
          top = -98 + 22 * f,
          foot = -31 + 22 * f;
        line([x, top + 3], [x, foot - 2], j % 3 ? '#927b55' : '#c9b082', 0.9);
      }
      for (let j = 1; j < 8; j++) {
        const f = j / 8,
          x = 67 * f,
          top = -76 - 22 * f,
          foot = -9 - 22 * f;
        line([x, top + 3], [x, foot - 2], j % 3 ? '#725a3d' : '#af8f63', 0.8);
      }
      // Shared corner posts and two level courses prove load continuity.
      for (const [a, b] of [
        [
          [-64, -99],
          [-64, -31],
        ],
        [
          [0, -77],
          [0, -9],
        ],
        [
          [67, -99],
          [67, -31],
        ],
        [
          [-32, -88],
          [-32, -20],
        ],
        [
          [34, -87],
          [34, -20],
        ],
      ])
        line(a, b, '#624b32', 5);
      for (const [a, b] of [
        [
          [-65, -62],
          [0, -40],
        ],
        [
          [0, -40],
          [67, -62],
        ],
        [
          [-65, -32],
          [0, -10],
        ],
        [
          [0, -10],
          [67, -32],
        ],
      ])
        line(a, b, '#664e34', 4);
      line([-62, -96], [-1, -75], '#e0c797', 1.5);
      line([2, -76], [65, -97], '#b5986a', 1.2);
      // The live facility painter owns the entrance (Visuals.draw dispatches
      // here before the legacy decoration). Cut it down through the plinth
      // to the dry loading apron, not a closed panel above the foundation.
      poly([[-51, -47], [-18, -36], [-18, 16], [-51, 5]], '#66523b');
      poly([[-47, -43], [-22, -35], [-22, 12], [-47, 4]], '#26362e');
      // A narrow inner jamb gives the opening depth; the timber leaf swings
      // outward from the right hinge and leaves the dark opening visible.
      poly([[-27, -36], [-22, -35], [-22, 12], [-27, 10]], '#413b2e');
      poly([[-21, -35], [-7, -28], [-7, 21], [-21, 12]], '#98764e');
      for (const x of [-17, -12])
        line([x, -33 + (x + 21) * .5], [x, 12 + (x + 21) * .64], '#705638', 1);
      for (const y of [-24, 6])
        line([-20, y], [-8, y + 7], '#514936', 2);
      line([-50, -46], [-18, -35], '#c4a77c', 3);
      line([-49, -45], [-49, 5], '#73583b', 3);
      line([-20, -35], [-20, 15], '#71563a', 2.5);
      ctx.fillStyle = '#d4bc86';
      ctx.beginPath();
      ctx.arc(-10, -3, 1.5, 0, Math.PI * 2);
      ctx.fill();
      // Windows are projected in the orientation of their actual walls.
      poly(
        [
          [-57, -82],
          [-44, -78],
          [-44, -64],
          [-57, -68],
        ],
        '#304239',
      );
      line([-57, -82], [-44, -78], '#e2c18a', 2);
      line([-57, -69], [-44, -65], '#6b5035', 2);
      line([-50, -80], [-50, -66], '#ae9469', 1.5);
      for (const [x, y] of [
        [18, -77],
        [47, -86],
      ]) {
        poly(
          [
            [x, y],
            [x + 14, y - 5],
            [x + 14, y + 13],
            [x, y + 18],
          ],
          '#2d4037',
        );
        line([x, y], [x + 14, y - 5], '#cead79', 2);
        line([x + 7, y - 2], [x + 7, y + 15], '#b59c71', 1.3);
        line([x, y + 17], [x + 14, y + 12], '#634f39', 2);
      }
      // A coherent hipped roof closes onto both walls. The previous trial
      // left a visible gap between eaves and timber facade; now every eave
      // follows the two actual wall planes and one connected front corner.
      // The material is weathered wooden shingles, lighter on the left face.
      poly(
        [
          [-73, -107],
          [0, -150],
          [0, -84],
        ],
        '#a48052',
      );
      poly(
        [
          [0, -150],
          [74, -107],
          [0, -84],
        ],
        '#76573d',
      );
      for (let row = 1; row < 5; row++) {
        const t = row / 5;
        // Roof courses radiate down each slope, meeting continuously at the
        // front hip seam rather than crossing onto an unrelated roof surface.
        line(
          [-73 * t, -150 + 43 * t],
          [0, -150 + 66 * t],
          row % 2 ? '#c4a16d99' : '#664b35aa',
          1.3,
        );
        line([0, -150 + 66 * t], [74 * t, -150 + 43 * t], row % 2 ? '#93704d99' : '#4a3a30aa', 1.2);
      }
      // Connected timber fascia physically sits beneath both roof planes.
      poly(
        [
          [-73, -107],
          [0, -84],
          [0, -79],
          [-73, -102],
        ],
        '#584231',
      );
      poly(
        [
          [0, -84],
          [74, -107],
          [74, -102],
          [0, -79],
        ],
        '#49372d',
      );
      line([-73, -107], [0, -84], '#d1ad7b', 1.5);
      line([0, -84], [74, -107], '#ad8864', 1.3);
      line([0, -150], [0, -84], '#533d2b', 2.7);
      // Bank-side wheel and its real wood axle; the authored channel meets
      // the wheel near the shared headrace/tailrace coordinate.
      const wx = -79.8,
        wy = -56.25;
      line([-62, -56], [wx + 4, wy], '#4b4130', 7);
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#513b2c';
      ctx.beginPath();
      ctx.ellipse(wx, wy, 25, 36, -0.13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#b59a69';
      ctx.stroke();
      for (let j = 0; j < 12; j++) {
        const a = (j * Math.PI) / 6,
          sx = wx + Math.cos(a) * 24,
          sy = wy + Math.sin(a) * 35;
        line([wx, wy], [sx, sy], j % 2 ? '#bfa576' : '#92734b', 2.6);
        line(
          [sx - Math.sin(a) * 6, sy + Math.cos(a) * 6],
          [sx + Math.sin(a) * 6, sy - Math.cos(a) * 6],
          '#c2a77a',
          3.2,
        );
      }
      ctx.fillStyle = '#d1bc8c';
      ctx.beginPath();
      ctx.arc(wx, wy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#574a36';
      ctx.beginPath();
      ctx.arc(wx, wy, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Understated functional lantern on the dry-side door post, not the roof.
      line([-15, -58], [-8, -63], '#544b3b', 2.8);
      line([-8, -63], [-8, -58], '#544b3b', 2);
      poly(
        [
          [-12, -58],
          [-4, -58],
          [-5, -54],
          [-11, -54],
        ],
        '#393b32',
      );
      poly(
        [
          [-11, -54],
          [-5, -54],
          [-6, -42],
          [-10, -42],
        ],
        '#d5ae66',
      );
      line([-12, -42], [-4, -42], '#514d3b', 2);
      // Short sill and worn loading boards lead toward the real dry landing
      // at millEntrance; they do not expand the solid building footprint.
      poly([[-51, 4], [-18, 15], [-25, 21], [-58, 10]], '#aaa087');
      poly([[-57, 11], [-25, 22], [-42, 31], [-73, 21]], '#987d57');
      for (let j = 0; j < 3; j++)
        line([-60 + j * 10, 13 + j * 3.4], [-71 + j * 10, 20 + j * 3.4], '#604b36', 1.1);
    } else if (e.greenwoodFacility === 'weir') {
      // A working timber gate and retaining bank *at the real channel mouth*.
      poly(
        [
          [-36, 7],
          [-33, -5],
          [33, -22],
          [39, -9],
          [7, 16],
        ],
        '#858b75',
      );
      poly(
        [
          [-29, -6],
          [33, -22],
          [32, -14],
          [-29, 2],
        ],
        '#5d665a',
      );
      for (const [x, y] of [
        [-22, -10],
        [26, -24],
      ]) {
        line([x, y + 9], [x, y - 26], '#5c4934', 6);
        line([x + 1, y - 23], [x + 1, y + 6], '#a48b61', 1.2);
      }
      for (let j = 0; j < 6; j++) {
        const x = -19 + j * 9;
        line([x, -13 - j * 2.1], [x, 2 - j * 2.1], '#aa8b5e', 6);
      }
      line([-29, -32], [35, -48], '#765839', 4);
      line([-2, -40], [-2, -26], '#4c5048', 2.5);
      line([-8, -39], [4, -42], '#adab91', 2);
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
  // The regional roads are a small static map. Precompute smooth centerlines
  // and the non-overlapping path fragments once per real geometry revision.
  // Canvas and Pixi consume this same painter; no on-tick pathfinding or meshes.
  let roadPaintCache = null;
  const roadWidths = Object.freeze({ cart: 44, farm: 26, path: 12 });
  function smoothRoad(path, kind) {
    if (!Array.isArray(path) || path.length < 3) return (path || []).slice();
    const limit = kind === 'cart' ? 85 : kind === 'farm' ? 54 : 32;
    const output = [{ ...path[0] }];
    for (let i = 1; i < path.length - 1; i++) {
      const a = path[i - 1],
        b = path[i],
        c = path[i + 1];
      const u = { x: b.x - a.x, y: b.y - a.y };
      const v = { x: c.x - b.x, y: c.y - b.y };
      const la = Math.hypot(u.x, u.y),
        lb = Math.hypot(v.x, v.y);
      if (la < 1 || lb < 1) {
        output.push({ ...b });
        continue;
      }
      const cross = Math.abs(u.x * v.y - u.y * v.x) / (la * lb);
      const dot = (u.x * v.x + u.y * v.y) / (la * lb);
      if (cross < 0.1 && dot > 0) {
        output.push({ ...b });
        continue;
      }
      // The curve stays inside the old corridor by limiting both tangents;
      // short village doorpaths should never become sweeping rural arcs.
      const reach = Math.min(limit, la * 0.26, lb * 0.26);
      const enter = { x: b.x - (u.x * reach) / la, y: b.y - (u.y * reach) / la };
      const leave = { x: b.x + (v.x * reach) / lb, y: b.y + (v.y * reach) / lb };
      output.push(enter);
      const steps = 6;
      for (let k = 1; k < steps; k++) {
        const t = k / steps,
          s = 1 - t;
        output.push({
          x: s * s * enter.x + 2 * s * t * b.x + t * t * leave.x,
          y: s * s * enter.y + 2 * s * t * b.y + t * t * leave.y,
        });
      }
      output.push(leave);
    }
    output.push({ ...path[path.length - 1] });
    return output;
  }
  function distanceToRoadSegment(p, a, b) {
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const n = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / n));
    return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
  }
  function nearWideRoad(a, b, roads) {
    // Split a footpath finely only where it could meet a broad road. Most
    // woodland trails are far from carriageways and keep their original,
    // much cheaper curved segments.
    const cross = (p, q, t) => (q.x - p.x) * (t.y - p.y) - (q.y - p.y) * (t.x - p.x);
    for (const road of roads) {
      const cutoff = roadWidths[road.kind] + roadWidths.path + 12;
      for (let i = 1; i < road.points.length; i++) {
        const c = road.points[i - 1],
          d = road.points[i];
        if (
          distanceToRoadSegment(a, c, d) <= cutoff ||
          distanceToRoadSegment(b, c, d) <= cutoff ||
          distanceToRoadSegment(c, a, b) <= cutoff ||
          distanceToRoadSegment(d, a, b) <= cutoff ||
          (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0)
        )
          return true;
      }
    }
    return false;
  }
  function prepareRoadPaint(roads, footpaths = [], kinds = []) {
    const wide = (roads || []).map((points, i) => ({
      kind: kinds[i] === 'cart' || kinds[i] === 'farm' ? kinds[i] : i === 0 ? 'cart' : 'farm',
      points: smoothRoad(points, kinds[i] === 'cart' || i === 0 ? 'cart' : 'farm'),
    }));
    // The previously appended merchant exit made the cart road bend sharply
    // right toward the wagon. Keep the main carriageway moving through to the
    // NORTH map boundary, and let the existing wagon stop branch off as a
    // narrower, gently joined service lane. These are presentation-only
    // centerlines; z.roads, NPC travel, saves and collision remain unchanged.
    // The shape check avoids altering older/unrecognized road layouts.
    const source = roads?.[0],
      destination = source?.at(-1),
      scale = destination?.x / 2880;
    if (wide[0]?.kind === 'cart' && source?.length >= 3 &&
        Number.isFinite(scale) && scale >= 1 && scale <= 1.25 &&
        Math.abs(destination.y - 280 * scale) < 1 &&
        Math.abs(source.at(-2).x - 2480 * scale) < 1 &&
        Math.abs(source.at(-2).y - 650 * scale) < 1) {
      const fork = { x: 2480 * scale, y: 650 * scale };
      wide[0].points = smoothRoad([
        ...source.slice(0, -1),
        { x: 2450 * scale, y: 490 * scale },
        { x: 2350 * scale, y: 240 * scale },
        { x: 2270 * scale, y: -35 * scale },
      ], 'cart');
      wide.push({
        kind: 'farm',
        points: smoothRoad([
          fork,
          { x: 2630 * scale, y: 495 * scale },
          { x: 2800 * scale, y: 345 * scale },
          { ...destination },
        ], 'farm'),
      });
    }
    const fragments = [];
    for (const path of footpaths || []) {
      // Keep the actual saved route and its pedestrian classification intact.
      // The southern crossing approaches a wider timber deck from a farm lane;
      // presenting its continuation as a 24-unit stripe creates an abrupt pinch.
      // Paint both banks at farm-lane breadth without altering collision, bridge
      // clearance, navigation, or any historical save.
      // Derive scale from authored route coordinates. The painter is a
      // standalone module and must not depend on a Campaign rules object.
      const southScale = path[0]?.x / 1560;
      const southCrossing =
        path.length === 6 &&
        southScale > 0 &&
        distance(path[0], { x: 1560 * southScale, y: 2280 * southScale }) < 1 &&
        distance(path[1], { x: 1740 * southScale, y: 2280 * southScale }) < 1 &&
        distance(path[2], { x: 1950 * southScale, y: 2280 * southScale }) < 1;
      if (southCrossing) {
        wide.push({ kind: 'farm', points: smoothRoad(path, 'farm') });
        continue;
      }
      // The northern woodland connector formerly doubled back parallel to
      // the freight road just before its junction. A short, direct approach
      // makes a proper Y-join without moving the source path or any actors.
      const northScale = path[0]?.x / 250;
      const northernConnector =
        path.length === 9 &&
        northScale > 0 &&
        distance(path[0], { x: 250 * northScale, y: 600 * northScale }) < 1 &&
        distance(path.at(-1), { x: 1330 * northScale, y: 1000 * northScale }) < 1;
      const paintedPath = northernConnector
        ? [...path.slice(0, -2),
          { x: 1510 * northScale, y: 885 * northScale },
          { x: 1510 * northScale, y: 1000 * northScale }]
        : path;
      const points = smoothRoad(paintedPath, 'path');
      // Short village/service spurs are maintained roads, not moss-colored
      // trails. Include them in the same unioned earth paint as cart/farm
      // roads, retaining their narrower world-space footprint.
      const length = path.reduce(
        (sum, point, i) => (i ? sum + distance(point, path[i - 1]) : sum),
        0,
      );
      const local =
        path.length === 2 && length <= 270 && path.every((p) => p.x < 1250 && p.y < 2050);
      if (local) {
        wide.push({ kind: 'path', points });
        continue;
      }
      let run = [];
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1],
          b = points[i];
        const len = distance(a, b);
        const count = nearWideRoad(a, b, wide) ? Math.max(1, Math.ceil(len / 16)) : 1;
        for (let j = 0; j < count; j++) {
          const at = j / count,
            bt = (j + 1) / count;
          const p = { x: a.x * (1 - at) + b.x * at, y: a.y * (1 - at) + b.y * at };
          const q = { x: a.x * (1 - bt) + b.x * bt, y: a.y * (1 - bt) + b.y * bt };
          const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
          const withinRoad = wide.some((road) =>
            road.points.some(
              (end, k) =>
                k > 0 &&
                // Carry the narrow track through the shoulder to the inner
                // worn surface, avoiding a rounded, detached-looking cap.
                distanceToRoadSegment(mid, road.points[k - 1], end) <
                  roadWidths[road.kind] * 0.58,
            ),
          );
          if (withinRoad) {
            if (run.length > 1) fragments.push(run);
            run = [];
          } else {
            if (!run.length) run.push(p);
            run.push(q);
          }
        }
      }
      if (run.length > 1) fragments.push(run);
    }
    return { wide, fragments, widths: roadWidths };
  }
  function appendRoadRibbon(ctx, screen, points, width) {
    if (points.length < 2) return;
    const normals = [];
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i],
        dx = b.x - a.x,
        dy = b.y - a.y,
        len = Math.hypot(dx, dy) || 1;
      normals.push({ x: -dy / len, y: dx / len });
    }
    const left = [],
      right = [];
    for (let i = 0; i < points.length; i++) {
      const before = normals[Math.max(0, i - 1)],
        after = normals[Math.min(normals.length - 1, i)];
      const nx = before.x + after.x,
        ny = before.y + after.y,
        len = Math.hypot(nx, ny) || 1;
      const dx = nx / len,
        dy = ny / len,
        denominator = Math.max(0.65, dx * after.x + dy * after.y),
        reach = width / denominator;
      left.push(screen({ x: points[i].x + dx * reach, y: points[i].y + dy * reach }));
      right.push(screen({ x: points[i].x - dx * reach, y: points[i].y - dy * reach }));
    }
    left.concat(right.reverse()).forEach((p, i) => {
      if (i) ctx.lineTo(p.x, p.y);
      else ctx.moveTo(p.x, p.y);
    });
    ctx.closePath();
  }
  function appendRoadCap(ctx, screen, point, width) {
    // Match the clockwise winding of each quad. Opposite winding would
    // cancel in Canvas's nonzero fill and punch holes at bend/junction caps.
    for (let k = 0; k < 12; k++) {
      const a = (-k * Math.PI) / 6;
      const p = screen({ x: point.x + Math.cos(a) * width, y: point.y + Math.sin(a) * width });
      if (k) ctx.lineTo(p.x, p.y);
      else ctx.moveTo(p.x, p.y);
    }
    ctx.closePath();
  }
  function roadPaintCacheMatches(cache, paths, footpaths, kinds) {
    if (
      !cache ||
      cache.paths.length !== paths.length ||
      cache.footpaths.length !== footpaths.length ||
      cache.kinds.length !== kinds.length
    )
      return false;
    for (let i = 0; i < kinds.length; i++) if (cache.kinds[i] !== kinds[i]) return false;
    for (const [current, saved] of [
      [paths, cache.paths],
      [footpaths, cache.footpaths],
    ])
      for (let i = 0; i < current.length; i++) {
        if (current[i].length !== saved[i].length) return false;
        for (let j = 0; j < current[i].length; j++)
          if (current[i][j].x !== saved[i][j][0] || current[i][j].y !== saved[i][j][1])
            return false;
      }
    return true;
  }
  function drawRoads(ctx, paths, screen, footpaths = [], kinds = []) {
    // Canvas can paint every frame. Validate a tiny numerical snapshot
    // instead of serializing world routes into a fresh JSON string at 60 FPS.
    // In-place saved-route edits still invalidate the precomputed curves.
    if (!roadPaintCacheMatches(roadPaintCache, paths, footpaths, kinds))
      roadPaintCache = {
        paths: paths.map((p) => p.map(({ x, y }) => [x, y])),
        footpaths: footpaths.map((p) => p.map(({ x, y }) => [x, y])),
        kinds: [...kinds],
        geometry: prepareRoadPaint(paths, footpaths, kinds),
      };
    const { wide, fragments } = roadPaintCache.geometry;
    const paint = (widthFactor, color) => {
      ctx.beginPath();
      // All roads and narrow tracks contribute to ONE ground shape per
      // material layer. Separate footpath painting used to lay one colored
      // strip on top of another and left visible seams at T/Y junctions.
      for (const road of wide) {
        const w = roadWidths[road.kind] * widthFactor;
        appendRoadRibbon(ctx, screen, road.points, w);
        appendRoadCap(ctx, screen, road.points[0], w);
        appendRoadCap(ctx, screen, road.points.at(-1), w);
      }
      const footWidth = roadWidths.path * widthFactor;
      for (const run of fragments) {
        appendRoadRibbon(ctx, screen, run, footWidth);
        appendRoadCap(ctx, screen, run[0], footWidth);
        appendRoadCap(ctx, screen, run[run.length - 1], footWidth);
      }
      ctx.fillStyle = color;
      ctx.fill();
    };
    ctx.save();
    paint(1.12, '#755e49');
    paint(1, '#a27a58');
    paint(0.63, '#b68d66');
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
  // Stable unscaled meadow geometry is created once, outside the frame loop.
  // No save fields, runtime noise or per-frame RNG state are involved.
  const meadowSamples = [
    [460, 970, 115, 85],
    [805, 910, 150, 110],
    [345, 1390, 130, 100],
    [450, 1880, 135, 125],
    [735, 2440, 125, 115],
    [1060, 2550, 135, 140],
    [1140, 1010, 135, 95],
    [2250, 740, 190, 135],
    [2420, 2040, 135, 100],
    [2930, 1740, 110, 120],
    [500, 2750, 145, 110],
  ].map(([cx, cy, rx, ry], index) => ({
    cx,
    cy,
    flowers: Array.from({ length: 13 }, (_, j) => {
      const h = hash('greenwood-meadow-' + index + '-' + j);
      const a = j * 2.3999632297 + (h % 23) * 0.017;
      const r = Math.sqrt(((h >>> 8) % 997) / 997);
      const dandelion = j % 4 === 0;
      return {
        x: cx + Math.cos(a) * rx * r,
        y: cy + Math.sin(a) * ry * r,
        h,
        dandelion,
        stem: dandelion ? 13 + (h % 4) : 8 + (h % 5),
        lean: ((h >>> 5) % 7) - 3,
      };
    }),
  }));
  const litterCache = new Map(); // twelve fixed native ground patches, bounded
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
      [2790, 1310, 365, 295, '#7d8752'],
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
      g.addColorStop(0, color + 'aa');
      g.addColorStop(0.55, color + '66');
      g.addColorStop(1, color + '00');
      ctx.fillStyle = g;
      ctx.fillRect(-r, -r, r * 2, r * 2);
      ctx.restore();
      // Broken leaves/blades, not a metallic scatter of identical highlights.
      const key = x + ':' + y;
      if (!litterCache.has(key))
        litterCache.set(
          key,
          Array.from({ length: 34 }, (_, j) => {
            const h = hash(key + ':' + j),
              a = j * 2.39996,
              d = Math.sqrt((h % 991) / 991);
            return { x: x + Math.cos(a) * rx * d, y: y + Math.sin(a) * ry * d, h };
          }),
        );
      ctx.fillStyle = color === '#8d8250' ? '#8b79484a' : '#83915d4a';
      ctx.beginPath();
      for (const sample of litterCache.get(key)) {
        const q = screen({ x: sample.x * s, y: sample.y * s });
        if (q.x < -12 || q.x > bounds.width + 12 || q.y < -12 || q.y > bounds.height + 12) continue;
        const h = sample.h,
          lean = h % 2 ? 1 : -1,
          length = 3 + (h % 4);
        ctx.moveTo(q.x - length, q.y);
        ctx.quadraticCurveTo(q.x, q.y - 2 * lean, q.x + length, q.y + lean);
        ctx.quadraticCurveTo(q.x, q.y + 2 * lean, q.x - length, q.y);
        ctx.closePath();
        if (h % 3 === 0) {
          ctx.moveTo(q.x + 3, q.y);
          ctx.lineTo(q.x + 1, q.y - 5);
          ctx.lineTo(q.x + 4, q.y - 2);
          ctx.closePath();
        }
      }
      ctx.fill();
    }
    // Dry, asymmetric worn ground in the former east pond's actual footprint.
    // Ground is cached with terrain; no added frame animation or water overlay.
    const dirt = [
      [2560, 1270],
      [2625, 1165],
      [2780, 1090],
      [2910, 1180],
      [2925, 1295],
      [2820, 1420],
      [2710, 1460],
      [2590, 1400],
    ].map(([x, y]) => screen({ x: x * s, y: y * s }));
    ctx.fillStyle = '#88704a44';
    ctx.beginPath();
    dirt.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fill();
    // These meadow samples are computed once and shared by every draw.
    // A bounded number of batched Canvas paths replaces hundreds of
    // per-flower strokes, fills and trig/hash calls on each painted scene.
    const meadowVisible = [];
    for (const patch of meadowSamples) {
      const center = screen({ x: patch.cx * s, y: patch.cy * s });
      if (
        center.x < -240 ||
        center.x > bounds.width + 240 ||
        center.y < -160 ||
        center.y > bounds.height + 160
      )
        continue;
      for (const flower of patch.flowers) {
        const p = screen({ x: flower.x * s, y: flower.y * s });
        if (p.x < -18 || p.x > bounds.width + 18 || p.y < -26 || p.y > bounds.height + 18) continue;
        meadowVisible.push({ x: p.x, y: p.y, ...flower });
      }
    }
    if (meadowVisible.length) {
      ctx.strokeStyle = '#87a267cc';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (const f of meadowVisible) {
        ctx.moveTo(f.x, f.y + 4);
        ctx.quadraticCurveTo(f.x + f.lean * 0.2, f.y - f.stem * 0.4, f.x + f.lean, f.y - f.stem);
      }
      ctx.stroke();
      ctx.fillStyle = '#f1eadc33';
      ctx.beginPath();
      for (const f of meadowVisible)
        if (f.dandelion) {
          ctx.moveTo(f.x + f.lean + 4.6, f.y - f.stem);
          ctx.arc(f.x + f.lean, f.y - f.stem, 4.6, 0, Math.PI * 2);
        }
      ctx.fill();
      ctx.strokeStyle = '#eee9d4be';
      ctx.lineWidth = 0.65;
      ctx.beginPath();
      for (const f of meadowVisible)
        if (f.dandelion)
          for (let k = 0; k < 12; k++) {
            const a = (Math.PI * 2 * k) / 12,
              r = 4.5 + (f.h % 3) * 0.2;
            const x = f.x + f.lean,
              y = f.y - f.stem;
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
          }
      ctx.stroke();
      const petalColors = ['#d4be9b', '#c8b0b4', '#b7bdd0', '#e1cc94'];
      for (let color = 0; color < petalColors.length; color++) {
        ctx.fillStyle = petalColors[color];
        ctx.beginPath();
        for (const f of meadowVisible) {
          if (f.dandelion || (f.h >>> 3) % petalColors.length !== color) continue;
          const x = f.x + f.lean,
            y = f.y - f.stem;
          for (let k = 0; k < 5; k++) {
            const a = (Math.PI * 2 * k) / 5,
              px = x + Math.cos(a) * 2.2,
              py = y + Math.sin(a) * 2;
            ctx.moveTo(px + 1.8, py);
            ctx.arc(px, py, 1.8, 0, Math.PI * 2);
          }
        }
        ctx.fill();
      }
      ctx.fillStyle = '#9f9866';
      ctx.beginPath();
      for (const f of meadowVisible)
        if (!f.dandelion) {
          const x = f.x + f.lean,
            y = f.y - f.stem;
          ctx.moveTo(x + 1.05, y);
          ctx.arc(x, y, 1.05, 0, Math.PI * 2);
        }
      ctx.fill();
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
    prepareRoadPaint,
    drawWall,
    drawGround,
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeGreenwoodLandscape = api;
})(typeof window !== 'undefined' ? window : globalThis);
