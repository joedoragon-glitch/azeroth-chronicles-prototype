/* Ironroot's Appalachian-inspired landscape. Authored geography and observation-only nature art. */
(function (root) {
  'use strict';
  const point = ([x, y]) => ({ x, y });
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const hash = (value) => {
    let n = 2166136261;
    for (const c of String(value)) n = Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0;
    return n;
  };
  const river = [
    [0, 1540, 65],
    [620, 1500, 68],
    [950, 1610, 60],
    [1450, 1800, 85],
    [1900, 1940, 80],
    [2300, 1890, 65],
    [2700, 1980, 75],
    [3000, 2100, 60],
    [3400, 2230, 80],
  ];
  function riverBanks(y) {
    let j = river.findIndex((p) => p[0] >= y);
    if (j <= 0) j = j < 0 ? river.length - 1 : 1;
    const a = river[j - 1],
      b = river[j],
      t = Math.max(0, Math.min(1, (y - a[0]) / (b[0] - a[0]))),
      s = t * t * (3 - 2 * t);
    const x = a[1] + (b[1] - a[1]) * s,
      w = a[2] + (b[2] - a[2]) * s;
    return [x - w, x + w];
  }
  // Sea is west of this continuous bank. The selected ferry and boarding anchors stay exact.
  const shore = [
    [150, 0],
    [195, 180],
    [110, 410],
    [165, 630],
    [95, 880],
    [145, 1120],
    [225, 1360],
    [160, 1560],
    [290, 1750],
    [390, 1845],
    [390, 1955],
    [255, 2140],
    [175, 2330],
    [260, 2570],
    [145, 2790],
    [210, 3030],
    [330, 3240],
    [450, 3400],
  ].map(point);
  const roundedShore = [shore[0]];
  for (let j = 1; j < shore.length; j++) {
    const a = shore[j - 1],
      b = shore[j];
    if (a.y >= 1750 && b.y <= 2140) {
      roundedShore.push(b);
      continue;
    }
    roundedShore.push(
      { x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 },
      { x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 },
    );
  }
  roundedShore.push(shore.at(-1));
  const coast = {
    points: [...roundedShore, point([0, 3400]), point([0, 0])],
    bankCount: roundedShore.length,
    x: 225,
    y: 1700,
    rx: 225,
    ry: 1700,
  };
  // Treasury entrance must remain off the carriageway (>=190 world units).
  // The previous [1920,330] authored position was itself a road endpoint.
  const anchors = {
    town: [750, 2180],
    quarry: [2520, 510],
    field: [2850, 1170],
    mine: [2850, 2850],
    treasury: [2170, 330],
    lookout: [3000, 2030],
    ore: [650, 390],
    wolf: [480, 1010],
    ogre: [940, 3010],
    caravan: [3100, 500],
  };
  const old = {
    town: [850, 1500],
    quarry: [1750, 1150],
    field: [2700, 700],
    mine: [2850, 2350],
    treasury: [2488, 1083],
    lookout: [2380, 1500],
    ore: [1100, 650],
    wolf: [340, 1020],
    ogre: [1980, 1820],
    caravan: [3100, 500],
  };
  const npcTargets = {
    rest: [620, 2255],
    supplier: [865, 2145],
    recruiter: [565, 2075],
    board: [980, 2255],
    minor: [2530, 620],
    entrance: anchors.mine,
    outbound: anchors.caravan,
    return: [300, 1995],
    'cage-ridge': [2940, 1250],
    'mini-field-ridge': [2720, 1160],
    lookout: anchors.lookout,
    ore: anchors.ore,
    'wolf-den': anchors.wolf,
    'ogre-hearth': anchors.ogre,
    'bridge-north': [1610, 950],
    'bridge-south': [1890, 2300],
    'supply-entrance': anchors.treasury,
    'service-ridge': [1060, 2110],
    'service-mine': [1080, 2420],
  };
  // Streets have bends and separate industrial frontages; the last shore leg ends on land.
  const roads = [
    [
      [470, 1900],
      [600, 1970],
      [750, 1990],
      [750, 2180],
      [750, 2410],
    ],
    [
      [430, 2180],
      [750, 2180],
      [1160, 2180],
    ],
    [
      [430, 2410],
      [750, 2410],
      [1160, 2410],
    ],
    [
      [750, 1990],
      [920, 1800],
      [1010, 1520],
      [1120, 1220],
      [1350, 950],
      [1800, 950],
      [2020, 800],
      [2250, 650],
      [2520, 650],
      [2820, 650],
      [3100, 500],
    ],
    [
      [1350, 950],
      [1130, 830],
      [940, 620],
      [720, 520],
      [650, 390],
    ],
    [
      [1130, 830],
      [900, 1080],
      [690, 1160],
      [480, 1170],
    ],
    [
      [2020, 800],
      [2030, 560],
      [1920, 330],
    ],
    [
      [2820, 650],
      [3070, 880],
      [3080, 1170],
      [3000, 1340],
    ],
    [
      [3080, 1170],
      [3200, 1460],
      [3190, 1770],
      [3000, 2030],
      [3000, 2300],
      [2920, 2530],
      [2850, 2850],
    ],
    [
      [1160, 2180],
      [1390, 2280],
      [1680, 2300],
      [2110, 2300],
      [2420, 2410],
      [2660, 2610],
      [2850, 2850],
    ],
    [
      [750, 2410],
      [730, 2640],
      [790, 2800],
      [940, 2840],
    ],
    [
      [790, 2800],
      [1270, 3020],
      [1850, 3000],
      [2350, 3000],
      [2670, 3040],
      [2850, 2850],
    ],
  ].map((r) => r.map(point));
  const plots = {
    'settlement-major-0': [480, 2040],
    'settlement-major-1': [690, 2020],
    'settlement-major-2': [1100, 2515],
    'settlement-major-3': [475, 2300],
    'settlement-major-4': [450, 2510],
    'settlement-major-5': [690, 2510],
    'settlement-major-6': [1110, 2020],
    'settlement-major-7': [940, 2520],
    'settlement-major-8': [350, 2320],
    'settlement-minor-0': [2390, 420],
    'settlement-minor-1': [2680, 420],
    'settlement-minor-2': [2410, 780],
    'settlement-minor-3': [2700, 790],
    'settlement-minor-4': [2850, 400],
    'settlement-minor-5': [2900, 800],
    'aesthetic-town-0': [880, 2295],
    'aesthetic-town-1': [1130, 2600],
    'aesthetic-town-2': [510, 2580],
    'aesthetic-town-3': [615, 2330],
    'aesthetic-town-4': [1180, 2370],
    'aesthetic-town-5': [865, 2030],
    'aesthetic-town-6': [1120, 2240],
    'aesthetic-town-7': [590, 2010],
    'ironroot-life-stonecross-0': [530, 2120],
    'ironroot-life-stonecross-1': [1170, 2510],
    'ironroot-life-stonecross-2': [1145, 2310],
    'ironroot-life-stonecross-3': [1070, 2280],
    'ironroot-life-stonecross-4': [1130, 2080],
    'ironroot-life-stonecross-5': [1180, 2020],
    'ironroot-life-stonecross-6': [485, 2440],
    'ironroot-life-stonecross-7': [355, 2520],
    'ironroot-life-quarry-0': [2450, 300],
    'ironroot-life-quarry-1': [2570, 275],
    'ironroot-life-quarry-2': [2680, 280],
    'ironroot-life-quarry-3': [2770, 240],
    'ironroot-life-quarry-4': [2670, 545],
    'ironroot-life-quarry-5': [2330, 810],
    'ironroot-life-quarry-6': [2800, 810],
    'ironroot-life-roads-0': [540, 320],
    'ironroot-life-roads-1': [820, 350],
    'ironroot-life-roads-2': [2680, 2780],
    'ironroot-life-roads-3': [3010, 2760],
    'ironroot-life-roads-4': [730, 320],
    'ironroot-life-roads-5': [1130, 610],
    'regime-banner-highlands-0': [1070, 2040],
    'regime-banner-highlands-1': [2740, 545],
    'regime-banner-highlands-2': [3200, 590],
    'regime-banner-highlands-3': [470, 2110],
    'public-lantern-highlands-0': [600, 1980],
    'public-lantern-highlands-1': [2480, 730],
    'public-lantern-highlands-2': [1780, 1030],
    'public-lantern-highlands-3': [3060, 1030],
  };
  const natural = (p) =>
    p.highlandsNature ||
    (!p.structure && /🌲|🌳|🪨/.test(p.icon || '')) ||
    /^(pine|pine-sapling|sapling|highland-rock|rock-cluster|heather|alpine-scrub|grass|wildflowers|fallen-log|dead-tree|stump|bush)$/.test(
      p.structure || '',
    );
  const forests = [
    [650, 650, 400, 250],
    [750, 1300, 470, 260],
    [1100, 1750, 390, 270],
    [1420, 2720, 350, 380],
    [430, 2820, 140, 350],
    [2170, 1250, 270, 500],
    [2670, 1630, 470, 230],
    [2450, 2090, 270, 230],
    [2850, 3200, 420, 130],
    [3200, 2550, 120, 600],
    [2180, 3170, 420, 150],
    [1190, 350, 170, 230],
  ];
  function ecology(x, y, seed) {
    if (y < 700 && x > 2000 && seed % 4 === 0) return 'spruce';
    if (x > 2300 && y > 2500 && seed % 6 === 0) return 'spruce';
    const banks = riverBanks(y),
      moist = Math.abs(x - (banks[0] + banks[1]) / 2) < 400;
    return moist
      ? ['birch', 'beech', 'maple', 'tulip'][seed % 4]
      : ['oak', 'maple', 'hickory', 'oak', 'maple'][seed % 5];
  }
  function install(Campaign, { D, R }) {
    Campaign.prototype.highlandsTownServices = function (z) {
      if (z.id !== 'highlands' || !z.appalachianVersion) return;
      for (const n of z.npcs) {
        // A migrated quarry refuge must retain its legal roadside frontage
        // on every later zone read, not snap back onto the new hamlet road.
        if (n.id === 'minor' && z.highlandsQuarryRoadVersion === 1) continue;
        if (
          z.finalStreetClearanceVersion === 1 &&
          ['rest', 'minor', 'supplier', 'recruiter', 'board'].includes(n.id)
        )
          continue;
        const target = npcTargets[n.id];
        if (
          target &&
          (n.id.startsWith('service-') ||
            ['rest', 'minor', 'supplier', 'recruiter', 'board'].includes(n.id))
        ) {
          Object.assign(n, this.safe(...target, z.id));
          if (n.id === 'rest' || n.id === 'minor') n.servicePoint = { x: n.x, y: n.y };
        }
      }
    };
    // Early Appalachian saves placed the generic ogre habitat at its old
    // [1980,1820] coordinates even after the named camp moved south.
    // Rehouse only that existing group, preserving every prop ID and save fact.
    Campaign.prototype.highlandsOgreHabitatFrontage = function (z) {
      if (z.id !== 'highlands' || z.highlandsOgreHabitatVersion === 1) return;
      const old = { x: 1980, y: 1820 },
        dx = anchors.ogre[0] - old.x,
        dy = anchors.ogre[1] - old.y;
      for (const p of z.props) {
        if (!String(p.id || '').startsWith('world-life-habitat-') || distance(p, old) > 220)
          continue;
        const target = { x: p.x + dx, y: p.y + dy };
        Object.assign(p, this.safe(target.x, target.y, z.id));
      }
      z.highlandsOgreHabitatVersion = 1;
    };
    // The road solver validates collision, but a stone wall, roof or decorative
    // cart can still overlap the *painted* street. Clear the final street
    // footprint, after the actual road geometry and all scenery are installed.
    // This is a once-only, ID-preserving migration for pre-fix v4 saves too.
    Campaign.prototype.highlandsFinalRoadsideClearance = function (z) {
      if (z.id !== 'highlands' || z.highlandsFinalRoadsideVersion === 1) return;
      const previous = this.s.zone;
      this.s.zone = z.id;
      try {
        const fits = (q, p, radius, required) =>
          Math.min(q.x, q.y, 3400 - q.x, 3400 - q.y) >= 110 &&
          !this.blocked(q.x, q.y, z.id, radius, true) &&
          this.distanceToRoad(z, q) + 0.01 >= required &&
          !z.props.some((other) => distance(q, other) < radius + Math.max(0, other.r || 0) + 24) &&
          !z.buildings.some((b) => distance(q, b) < radius + 90) &&
          !z.npcs.some((n) => distance(q, n) < radius + 60) &&
          !z.nodes.some((n) => distance(q, n) < radius + 65);
        // Work on the same objects rather than replacing IDs or recreating
        // camp/tribute props. Roads and authored encounter centers stay fixed.
        const affected = z.props.filter(
          (p) => !p.roadTrace && this.distanceToRoad(z, p) + 0.01 < this.roadSetback(p),
        );
        for (const p of affected) {
          const old = { x: p.x, y: p.y },
            required = this.roadSetback(p),
            radius = Math.max(15, p.r || 0),
            near = this.nearestRoadPoint(z, p),
            away = near ? Math.atan2(p.y - near.y, p.x - near.x) : -Math.PI / 2;
          z.props.splice(z.props.indexOf(p), 1);
          let chosen = null;
          for (const reach of [25, 40, 60, 85, 115, 150, 195, 250, 300]) {
            for (let j = 0; j < 24; j++) {
              const fan = j === 0 ? 0 : Math.ceil(j / 2) * (j % 2 ? 1 : -1);
              const angle = away + (fan * Math.PI) / 12,
                q = { x: old.x + Math.cos(angle) * reach, y: old.y + Math.sin(angle) * reach };
              if (fits(q, p, radius, required)) {
                chosen = q;
                break;
              }
            }
            if (chosen) break;
          }
          if (chosen) Object.assign(p, chosen);
          z.props.push(p);
        }
        // Never certify a failed search or silently exempt defenses/tribute.
        if (
          z.props.every(
            (p) => p.roadTrace || this.distanceToRoad(z, p) + 0.01 >= this.roadSetback(p),
          )
        )
          z.highlandsFinalRoadsideVersion = 1;
      } finally {
        this.s.zone = previous;
      }
    };
    Campaign.prototype.highlandsLandscape = function (z) {
      if (z.id !== 'highlands') return;
      if (z.appalachianVersion === 1) {
        this.highlandsTributeLayout(z);
        this.highlandsTownServices(z);
        return;
      }
      const previous = this.s.zone;
      this.s.zone = z.id;
      try {
        const fresh = z.appalachianSourceVersion === 1;
        const props = z.props,
          nature = props.filter(natural),
          work = props.filter((p) => !natural(p));
        const at = (k) => point(anchors[k]),
          before = (k) => point(old[k]);
        const shifted = (p, k) =>
          fresh
            ? { x: p.x, y: p.y }
            : { x: p.x + anchors[k][0] - old[k][0], y: p.y + anchors[k][1] - old[k][1] };
        const group = (p) => {
          const id = p.id || '';
          if (p.stronghold === 'wolf-packhold') return 'wolf';
          if (p.stronghold === 'ogre-hearth-fort' || p.ironrootDistrict === 'ogre-home')
            return 'ogre';
          if (
            p.mini === 'field-ridge' ||
            id.startsWith('mini-wall-field-ridge') ||
            id.startsWith('world-life-field')
          )
            return 'field';
          if (id.startsWith('side-entrance-')) return 'lookout';
          if (id.startsWith('treasury-approach-')) return 'treasury';
          if (/settlement-major|aesthetic-town/.test(id) || p.ironrootDistrict === 'stonecross')
            return 'town';
          if (/settlement-minor|aesthetic-hamlet/.test(id) || p.ironrootDistrict === 'quarry')
            return 'quarry';
          if (p.ironrootDistrict === 'caravan') return 'caravan';
          if (id.startsWith('highlands-tribute-')) return null;
          if (id.startsWith('world-life-habitat')) return p.x < 1400 ? 'wolf' : 'ogre';
          const nearest = Object.keys(anchors).sort(
            (a, b) => distance(p, before(a)) - distance(p, before(b)),
          )[0];
          return distance(p, before(nearest)) < 430 ? nearest : null;
        };
        z.props = [];
        z.roads = roads.map((r) => r.map((p) => ({ ...p })));
        z.footpaths = [];
        // Preserve player construction as the first claim on a plot.
        const choose = (raw, p = {}, extra = () => true) => {
          const radius = Math.max(15, p.r || 0);
          for (const reach of [0, 40, 80, 120, 170, 225, 290, 370, 460])
            for (let j = 0; j < (reach ? 24 : 1); j++) {
              const a = (j * Math.PI) / 12,
                q = { x: raw.x + Math.cos(a) * reach, y: raw.y + Math.sin(a) * reach };
              if (
                this.blocked(q.x, q.y, z.id, radius, true) ||
                z.buildings.some((b) => distance(q, b) < radius + 120) ||
                !extra(q)
              )
                continue;
              if (
                z.props.some(
                  (b) =>
                    distance(q, b) <
                    radius + (b.r || 0) + (p.stronghold && p.stronghold === b.stronghold ? 8 : 42),
                )
              )
                continue;
              return q;
            }
          return this.safe(raw.x, raw.y, z.id);
        };
        for (const n of z.npcs)
          if (npcTargets[n.id]) {
            Object.assign(
              n,
              n.id === 'return' ? point(npcTargets[n.id]) : this.safe(...npcTargets[n.id], z.id),
            );
            if (n.servicePoint) n.servicePoint = { x: n.x, y: n.y };
          }
        const specials = Object.entries(npcTargets).map(([, p]) => point(p));
        for (const p of work.sort((a, b) => (b.r || 0) - (a.r || 0))) {
          const k = group(p),
            raw = plots[p.id] ? point(plots[p.id]) : k ? shifted(p, k) : { x: p.x, y: p.y };
          const fort = !!p.stronghold; // Mini-dungeon stone walls still require a full road setback.
          const q = choose(
            raw,
            p,
            (q) =>
              (fort || this.distanceToRoad(z, q) + 0.01 >= this.roadSetback(p)) &&
              !specials.some((n) => distance(n, q) < (p.r || 0) + 100),
          );
          Object.assign(p, q);
          z.props.push(p);
        }
        for (const [id, x, y, structure] of [
          ['silver-adit', 610, 250, 'appalachian-silver-workings'],
          ['copper-adit', 880, 370, 'appalachian-copper-workings'],
          ['outpost-shaft', 2730, 250, 'appalachian-silver-workings'],
          ['outpost-washer', 2370, 310, 'appalachian-ore-washer'],
          ['outpost-copper', 2800, 300, 'copper-ore-face'],
          ['outpost-silver', 2600, 180, 'silver-ore-face'],
        ]) {
          const p = {
            id: 'appalachian-' + id,
            structure,
            r: 0,
            decorative: true,
            sceneRole: 'crown-coinage-ore',
            miningFacility: structure.startsWith('appalachian-'),
          };
          const q = choose(
            { x, y },
            p,
            (q) => this.distanceToRoad(z, q) > 100 && !specials.some((n) => distance(n, q) < 120),
          );
          z.props.push({ ...p, ...q });
        }
        // Saved encounter metadata must follow the complete relocated compound as well.
        const fieldMini = z.minis?.find((m) => m.id === 'field-ridge');
        if (fieldMini) {
          const dx = anchors.field[0] - fieldMini.x,
            dy = anchors.field[1] - fieldMini.y;
          fieldMini.x = anchors.field[0];
          fieldMini.y = anchors.field[1];
          fieldMini.trapPosts = (fieldMini.trapPosts || []).map((p) => ({
            ...p,
            x: p.x + dx,
            y: p.y + dy,
          }));
        }
        const siteGroups = {
          'wolf-den': 'wolf',
          'ogre-hearth': 'ogre',
          lookout: 'lookout',
          ore: 'ore',
        };
        const packs = new Map(),
          enemyHomes = [];
        const moveEnemy = (e) => {
          let k =
            e.family === 'ridge' || e.mini === 'field-ridge'
              ? 'field'
              : e.stronghold === 'wolf-packhold'
                ? 'wolf'
                : e.stronghold === 'ogre-hearth-fort'
                  ? 'ogre'
                  : siteGroups[e.site];
          let raw;
          if (k) raw = shifted(e.home || e, k);
          else {
            const key = e.pack || e.id;
            if (!packs.has(key)) {
              const index = Number(/pack-(\d+)$/.exec(key)?.[1] || packs.size),
                centers = {
                  4: [790, 2740],
                  6: [2790, 750],
                  7: [1060, 550],
                  8: [2210, 1400],
                  9: [2380, 2600],
                  10: [2850, 2580],
                  11: [3190, 1690],
                };
              packs.set(key, {
                from: { ...(e.home || e) },
                to: point(centers[index] || [2210, 1650]),
              });
            }
            const p = packs.get(key),
              h = e.home || e;
            raw = { x: p.to.x + h.x - p.from.x, y: p.to.y + h.y - p.from.y };
          }
          let q = null;
          const radius = Math.max(18, this.actorRadius(e));
          for (const reach of [0, 45, 85, 125, 170]) {
            for (let j = 0; j < (reach ? 16 : 1); j++) {
              const angle = (j * Math.PI) / 8,
                target = { x: raw.x + Math.cos(angle) * reach, y: raw.y + Math.sin(angle) * reach };
              if (
                !this.blocked(target.x, target.y, z.id, radius) &&
                enemyHomes.every((p) => distance(p, target) >= p.radius + radius + 12)
              ) {
                q = target;
                break;
              }
            }
            if (q) break;
          }
          q ||= this.safe(raw.x, raw.y, z.id);
          enemyHomes.push({ ...q, radius });
          const dx = q.x - (e.home || e).x,
            dy = q.y - (e.home || e).y;
          e.home = { ...q };
          e.x += dx;
          e.y += dy;
          if (this.blocked(e.x, e.y, z.id, 20)) Object.assign(e, q);
          delete e.path;
          delete e.pathTarget;
          delete e.idleWanderTarget;
          this.clearEncounterState(e);
          e.aggro = false;
          e.returning = 0;
        };
        for (const e of [...z.enemies].sort(
          (a, b) => Number(b.type === 'boss') - Number(a.type === 'boss'),
        ))
          moveEnemy(e);
        for (const p of Object.values(this.s.pending))
          if (p.zone === z.id && p.base) {
            const source = z.enemies.find((e) => e.id === p.base.id);
            if (source) {
              p.base.home = { ...source.home };
              Object.assign(p.base, source.home);
              delete p.base.path;
              this.clearEncounterState(p.base);
              p.base.aggro = false;
              p.base.returning = 0;
            } else moveEnemy(p.base);
          }
        // Place concealed stores at the actual named sites after their relocation.
        // Amounts, paid crowns and saved discovery remain authoritative.
        this.highlandsTributeLayout(z, true);
        for (const n of z.nodes)
          if (this.blocked(n.x, n.y, z.id, 20)) Object.assign(n, this.safe(n.x, n.y, z.id));
        // Repair entire road edges against the final real geometry. Their
        // painted centerlines and the routes used by walkers stay identical.
        z.roads = z.roads
          .map((path) => {
            const out = [this.safe(path[0].x, path[0].y, z.id)];
            for (const p of path.slice(1)) {
              const route = this.route(out.at(-1), p);
              if (route.length) out.push(...route);
            }
            return out;
          })
          .filter((path) => path.length > 1);
        for (const p of [...z.props]) {
          if (
            p.tributeScene ||
            p.stronghold ||
            this.distanceToRoad(z, p) + 0.01 >= this.roadSetback(p)
          )
            continue;
          z.props.splice(z.props.indexOf(p), 1);
          const q = choose(
            p,
            p,
            (q) =>
              this.distanceToRoad(z, q) + 0.01 >= this.roadSetback(p) &&
              !specials.some((n) => distance(n, q) < (p.r || 0) + 100),
          );
          Object.assign(p, q);
          z.props.push(p);
        }
        const allDoors = z.npcs.filter(
          (n) => !n.internalSite && !n.id.startsWith('highlands-tribute-site-'),
        );
        for (const p of [
          ...z.props.filter((p) =>
            /house|smithy|market|mint|sorting|loading|hearth/.test(p.structure || ''),
          ),
          ...allDoors,
        ]) {
          const door = this.safe(p.x + (p.structure ? 40 : 0), p.y + (p.structure ? 40 : 0), z.id),
            near = this.nearestRoadPoint(z, door);
          const route = near && this.route(near, door);
          if (route?.length && distance(near, door) > 12) z.footpaths.push([near, ...route]);
        }
        // A low, walkable understory and visible trunks keep combat and exploration legible.
        const walking = { roads: [...z.roads, ...z.footpaths] },
          candidates = [];
        for (const [patch, [cx, cy, rx, ry]] of forests.entries())
          for (let j = 0; j < 48; j++) {
            const a = j * 2.399963 + patch,
              r = Math.sqrt((j + 0.5) / 48);
            candidates.push({
              x: cx + Math.cos(a) * rx * r,
              y: cy + Math.sin(a) * ry * r,
              seed: hash(patch + ':' + j),
            });
          }
        candidates.sort((a, b) => a.seed - b.seed);
        const addNature = (p, j) => {
          const tree = j % 5 < 3,
            kind = tree ? 'tree' : j % 5 === 3 ? 'fern' : j % 3 ? 'laurel' : 'fallen-log';
          for (let attempt = 0; attempt < candidates.length; attempt++) {
            const q = candidates.shift();
            if (!q) break;
            if (
              this.blocked(q.x, q.y, z.id, tree ? 48 : 18, true) ||
              this.distanceToRoad(walking, q) < (tree ? 95 : 48) ||
              z.npcs.some((n) => distance(n, q) < (tree ? 140 : 85)) ||
              z.nodes.some((n) => distance(n, q) < (tree ? 95 : 40)) ||
              z.buildings.some((n) => distance(n, q) < 160) ||
              z.enemies.some((e) => distance(e.home || e, q) < (e.type === 'boss' ? 245 : 88)) ||
              z.props.some(
                (n) => distance(n, q) < (n.highlandsNature ? (tree ? 75 : 42) : 95 + (n.r || 0)),
              )
            )
              continue;
            Object.assign(p, {
              x: q.x,
              y: q.y,
              highlandsNature: kind,
              treeSpecies: ecology(q.x, q.y, q.seed),
              structure: 'appalachian-' + kind,
              r: tree ? 18 : 0,
              decorative: !tree,
              visualScale: tree ? 1.3 + (q.seed % 5) * 0.05 : 1.15,
              icon: tree ? '🌳' : '🌿',
            });
            z.props.push(p);
            return true;
          }
          return false;
        };
        // Reuse authored/seeded nature identities before extending the forest.
        let j = 0;
        for (const p of nature) {
          if (!addNature(p, j++)) {
            const q = choose(
              p,
              { r: 0 },
              (q) =>
                this.distanceToRoad(walking, q) > 55 && !z.npcs.some((n) => distance(n, q) < 95),
            );
            Object.assign(p, q, {
              r: 0,
              decorative: true,
              highlandsNature: 'fern',
              structure: 'appalachian-fern',
            });
            z.props.push(p);
          }
        }
        while (j < 205 && z.props.length < 480 && candidates.length) {
          if (!addNature({ id: 'appalachian-woodland-' + j }, j++)) break;
        }
        // Shore work props express an actual receiving landing rather than a water rectangle.
        for (const [id, x, y, structure] of [
          ['shore-rope', 500, 1810, 'rope-coil'],
          ['shore-load', 570, 1840, 'supply-stack'],
          ['shore-cart', 690, 1850, 'ore-cart'],
          ['shore-lamp', 490, 2010, 'roadside-lantern'],
        ]) {
          const p = { id: 'appalachian-' + id, structure, r: 0, decorative: true },
            q = choose({ x, y }, p, (q) => this.distanceToRoad(walking, q) > 60);
          z.props.push({ ...p, ...q });
        }
        z.appalachianVersion = 1;
        this.highlandsTownServices(z);
        if (previous === z.id)
          for (const u of [this.hero, ...this.activeParty()])
            if (this.blocked(u.x, u.y, z.id, this.actorRadius(u)))
              Object.assign(u, this.safe(u.x, u.y, z.id));
      } finally {
        this.s.zone = previous;
      }
    };
  }
  const colors = {
    maple: ['#713f30', '#ac512e', '#d17c37', '#e1a448'],
    oak: ['#4a4931', '#70653a', '#9d7941', '#c09a50'],
    hickory: ['#66552c', '#9a8133', '#c5a846', '#e1c164'],
    birch: ['#57633b', '#879745', '#b1b755', '#d0c773'],
    beech: ['#635038', '#927047', '#b99459', '#d1ae73'],
    tulip: ['#415d3b', '#658044', '#94a24d', '#b8b764'],
    spruce: ['#253f38', '#365b46', '#497253', '#73916a'],
  };
  function drawNature(ctx, e, p) {
    const seed = hash(e.id),
      phase = seed % 10,
      c =
        e.treeSpecies === 'spruce'
          ? colors.spruce
          : phase < 3
            ? ['#304b34', '#486942', '#78914f', '#a2af65']
            : phase < 5
              ? ['#495334', '#737a3d', '#a3a34e', '#c8bd65']
              : e.treeSpecies === 'maple' && seed % 3 === 0
                ? ['#65392f', '#974232', '#c2643c', '#de9650']
                : colors[e.treeSpecies] || colors.maple,
      s = e.visualScale || 1.3;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(s, s);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const stroke = (points, color, width = 1) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      points.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    };
    const oval = (x, y, rx, ry, color, angle = 0) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
      ctx.fill();
    };
    if (e.highlandsNature === 'tree') {
      oval(2, 9, 27, 7, '#15251c36');
      const birch = e.treeSpecies === 'birch',
        spruce = e.treeSpecies === 'spruce',
        tall = ['birch', 'tulip', 'hickory'].includes(e.treeSpecies),
        h = tall ? 78 : 67;
      for (const side of [-1, 1])
        stroke(
          [
            [side * 12, 10],
            [side * 5, 6],
            [side * 2, -8],
          ],
          '#534534',
          3,
        );
      ctx.fillStyle = birch ? '#c5c1a0' : '#66513b';
      ctx.beginPath();
      ctx.moveTo(-5, 8);
      ctx.bezierCurveTo(-3, -15, -7, -38, -2, -h + 10);
      ctx.lineTo(3, -h + 12);
      ctx.bezierCurveTo(1, -37, 4, -16, 6, 8);
      ctx.closePath();
      ctx.fill();
      stroke(
        [
          [-2, 5],
          [-3, -20],
          [0, -h + 16],
        ],
        birch ? '#e1d6b2' : '#a28a59',
        1.4,
      );
      for (const [side, y] of [
        [-1, -28],
        [1, -38],
        [-1, -51],
      ])
        stroke(
          [
            [0, y + 12],
            [side * 12, y],
            [side * 21, y - 9],
          ],
          birch ? '#c1b99b' : '#67523c',
          2.7,
        );
      if (birch)
        for (let y = -2; y > -62; y -= 9)
          stroke(
            [
              [-3, y],
              [y % 3 ? 1 : 4, y + 1],
            ],
            '#5b5b49',
            1.2,
          );
      if (spruce) {
        for (let tier = 0; tier < 6; tier++) {
          const y = -h + tier * 9,
            w = 7 + tier * 4.2;
          for (let branch = -2; branch <= 2; branch++) {
            const x = branch * w * 0.38;
            stroke(
              [
                [0, y - 7],
                [x, y],
                [x + Math.sign(branch) * 6, y + 4],
              ],
              c[1 + ((tier + branch + 8) % 3)],
              4 - tier * 0.2,
            );
          }
        }
      } else {
        const wide = e.treeSpecies === 'oak' ? 1.15 : tall ? 0.8 : 1;
        const lobes = [
          [0, -51, 25, 21],
          [-22, -42, 18, 14],
          [21, -44, 18, 14],
          [-28, -59, 15, 14],
          [26, -60, 16, 13],
          [-11, -72, 18, 15],
          [12, -71, 18, 14],
        ];
        for (const [j, [x, y, rx, ry]] of lobes.entries()) {
          const dy = tall ? -9 : 0;
          // Irregular scalloped leaf masses with lit upper edges and open gaps.
          ctx.fillStyle = c[j % 2];
          ctx.beginPath();
          for (let n = 0; n < 20; n++) {
            const a = (n * Math.PI) / 10,
              r = 1 + 0.09 * Math.sin(n * 2.7 + seed + j),
              px = (x + Math.cos(a) * rx * r) * wide,
              py = y + dy + Math.sin(a) * ry * r;
            n ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          // Broken, overlapping leaf sprays avoid the old flat oval highlights.
          for (let n = 0; n < 18; n++) {
            const a = n * 2.39996 + seed * 0.01 + j,
              r = Math.sqrt((n + 0.5) / 18),
              px = (x - 2 + Math.cos(a) * rx * r * 0.92) * wide,
              py = y + dy - 3 + Math.sin(a) * ry * r * 0.85;
            const light = n % 4 === 0 ? 3 : n % 3 ? 2 : 1;
            oval(px, py, (3.7 + (n % 3)) * wide, 2.7 + (n % 2), c[light], a * 0.15);
          }
          for (let n = 0; n < 7; n++) {
            const a = n * 2.39996 + j,
              r = Math.sqrt((n + 0.5) / 7),
              px = (x + Math.cos(a) * rx * r * 0.9) * wide,
              py = y + dy + Math.sin(a) * ry * r * 0.8;
            oval(px, py, 2.2 + (n % 2), 1.3, c[n % 3 ? 2 : 3], -0.5 + (n % 3) * 0.4);
          }
        }
        // Separate fallen leaves around the trunk, not a solid floor disc.
        for (let n = 0; n < 8; n++)
          oval(Math.sin(seed + n * 2.4) * 23, 5 + (n % 4) * 2.2, 2, 1, c[1 + (n % 3)], n);
      }
    } else if (e.highlandsNature === 'fallen-log') {
      stroke(
        [
          [-23, 4],
          [-8, 0],
          [16, -2],
        ],
        '#493d2d',
        9,
      );
      stroke(
        [
          [-22, 1],
          [-6, -3],
          [15, -5],
        ],
        '#8c7852',
        3,
      );
      oval(-24, 4, 3, 5, '#bb9d6b');
      oval(-24, 4, 1.5, 3, '#795c3c');
      stroke(
        [
          [-2, 0],
          [2, -10],
          [7, -13],
        ],
        '#705b3f',
        2,
      );
      for (let j = 0; j < 5; j++) oval(-14 + j * 6, -4, 3, 1.3, '#6d8050');
    } else if (e.highlandsNature === 'laurel') {
      for (let j = 0; j < 9; j++) {
        const x = Math.sin(j * 2.4 + seed) * 19,
          y = -4 - (j % 3) * 4;
        stroke(
          [
            [0, 7],
            [x, y],
          ],
          '#716144',
          1.3,
        );
        oval(x, y, 6, 2.1, j % 2 ? '#819354' : '#466644', -0.8 + (j % 3) * 0.6);
        if (j % 4 === 0) oval(x - 2, y + 2, 3.5, 1.8, '#a5723f', -0.4);
      }
    } else {
      for (let j = 0; j < 7; j++) {
        const a = -Math.PI + (j * Math.PI) / 6,
          x = Math.cos(a) * (15 + (j % 3) * 3),
          y = Math.sin(a) * 13;
        stroke(
          [
            [0, 7],
            [x * 0.55, y - 2],
            [x, y],
          ],
          '#82975a',
          0.8,
        );
        for (let k = 1; k < 5; k++)
          for (const side of [-1, 1])
            stroke(
              [
                [(x * k) / 5, 7 + ((y - 7) * k) / 5],
                [(x * k) / 5 + side * 3, 7 + ((y - 7) * k) / 5 - 3],
              ],
              j % 2 ? '#78964e' : '#a59d52',
              1.4,
            );
      }
    }
    ctx.restore();
  }
  // Timber-framed ore workings and a washing/sorting station. Rock carries
  // metal-bearing seams; no cut masonry, building-stone stacks or gold nuggets.
  function drawMining(ctx, e, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(e.visualScale || 1.3, e.visualScale || 1.3);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const line = (a, b, color, width = 2) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(...a);
      ctx.lineTo(...b);
      ctx.stroke();
    };
    const poly = (ps, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ps.forEach((q, j) => (j ? ctx.lineTo(...q) : ctx.moveTo(...q)));
      ctx.closePath();
      ctx.fill();
    };
    const copper = e.structure.includes('copper');
    const ore = (x, y, metal) => {
      poly(
        [
          [x - 7, y + 2],
          [x - 9, y - 4],
          [x - 3, y - 8],
          [x + 5, y - 6],
          [x + 8, y],
          [x + 2, y + 4],
        ],
        '#59605a',
      );
      line([x - 5, y - 5], [x + 3, y + 1], metal ? '#7b9d84' : '#adb6af', 2);
      line([x - 2, y - 6], [x + 4, y - 3], metal ? '#bc8158' : '#d3d7c6', 1);
    };
    if (e.structure === 'appalachian-ore-washer') {
      for (const x of [-29, 27]) {
        line([x, 10], [x, -20], '#5e4b34', 5);
        line([x + 5, 12], [x + 5, -17], '#a08455', 1.5);
      }
      poly(
        [
          [-34, -16],
          [22, -27],
          [37, -15],
          [-18, -4],
        ],
        '#a08a5e',
      );
      poly(
        [
          [-28, -16],
          [21, -23],
          [29, -16],
          [-18, -8],
        ],
        '#486c65',
      );
      for (let j = 0; j < 6; j++)
        line([-23 + j * 8, -14 - j * 1.2], [-17 + j * 8, -11 - j * 1.2], '#a0b4a0', 1);
      poly(
        [
          [-34, 0],
          [-7, -5],
          [-5, 9],
          [-30, 14],
        ],
        '#735d3f',
      );
      poly(
        [
          [8, -4],
          [35, -9],
          [35, 6],
          [11, 11],
        ],
        '#826845',
      );
      for (const [x, y, m] of [
        [-25, 1, 0],
        [-15, 0, 0],
        [18, -2, 1],
        [28, -4, 1],
      ])
        ore(x, y, m);
      line([-28, -38], [30, -38], '#b5b5a0', 2);
      line([1, -46], [1, -27], '#756349', 3);
      for (const x of [-23, 24]) {
        line([x, -38], [x - 7, -25], '#a0a38c', 0.7);
        line([x, -38], [x + 7, -25], '#a0a38c', 0.7);
        line([x - 7, -25], [x + 7, -25], '#c3c4ae', 2);
      }
    } else {
      // Broken host rock around the dark opening, not a squared quarry face.
      poly(
        [
          [-42, 10],
          [-49, -13],
          [-36, -39],
          [-15, -55],
          [13, -49],
          [34, -31],
          [45, 3],
          [29, 14],
        ],
        '#64685b',
      );
      poly(
        [
          [-42, -8],
          [-33, -33],
          [-15, -50],
          [4, -45],
          [-5, -29],
          [-26, -14],
        ],
        '#8b8b72',
      );
      poly(
        [
          [-28, 9],
          [-28, -25],
          [-13, -37],
          [15, -35],
          [28, -23],
          [28, 10],
        ],
        '#222d29',
      );
      for (const x of [-28, 28]) {
        line([x, 10], [x, -29], '#684e33', 7);
        line([x - 2, 8], [x - 2, -29], '#b19261', 2);
      }
      line([-34, -31], [33, -31], '#826641', 8);
      line([-34, -34], [33, -34], '#b19665', 2);
      line([-22, 13], [-9, -13], '#a7ada0', 2);
      line([23, 13], [9, -13], '#a7ada0', 2);
      for (const y of [-5, 1, 7, 13]) line([-17 - y * 0.25, y], [17 + y * 0.25, y], '#725e40', 2);
      line([-40, -14], [-33, -24], copper ? '#8da48a' : '#bcc5b6', 3);
      line([34, -12], [29, -23], copper ? '#bb875e' : '#d1d3be', 2);
      ore(-40, 12, copper);
      ore(-28, 16, copper);
      ore(35, 13, copper);
      line([41, -23], [38, -5], '#756040', 2);
      line([35, -22], [47, -26], '#b3b6a2', 2.5);
    }
    ctx.restore();
  }
  const api = {
    anchors,
    npcTargets,
    roads,
    coast,
    riverBanks,
    ecology,
    install,
    drawNature,
    drawMining,
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeHighlands = api;
})(typeof window !== 'undefined' ? window : globalThis);
