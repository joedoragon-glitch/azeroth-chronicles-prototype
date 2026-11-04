/* Strategist-only environmental material truth. No renderer sampling or automatic frame work.
 * This module is dormant until a future class/Field Lab owner calls its API.
 * Pure inventory lookups never modify the Campaign, the world, or the save.
 */
(function (root) {
  'use strict';

  const CELL = 192;
  const MAX_CAST_RANGE = 320;
  const MAX_GATHER_RANGE = 3800;
  const MAX_SIGHT_PROBES = 32;
  const MAX_ROUTE_PROBES = 24;
  const MAX_ZONE_INDEXES = 6;
  const MAX_ACTIVE_HAZARD_PROBES = 64;
  const OVERWORLD = Object.freeze(['vale', 'march', 'highlands', 'frontier', 'crown']);
  const MATERIALS = Object.freeze(['water', 'mineral', 'wood', 'fire']);
  const propKinds = Object.freeze({
    water: new Set(['well', 'fountain', 'mill-pond', 'pond', 'water', 'cistern', 'water-trough']),
    mineral: new Set([
      'rock', 'boulder', 'rock-cluster', 'highland-rock', 'black-rock', 'mossy-basalt', 'obsidian',
      'crystal-cluster', 'silver-ore-face', 'copper-ore-face', 'ore-face',
      'crystal', 'ore-cart', 'appalachian-silver-workings', 'appalachian-copper-workings',
      'stonewall', 'crown-wall', 'highland-wall', 'stone-marker',
    ]),
    wood: new Set([
      'tree', 'fruit-tree', 'dead-tree', 'sapling', 'pine-sapling', 'stump',
      'charred-stump', 'fallen-log', 'burned-log', 'driftwood', 'woodpile',
      'palisade', 'stockade', 'regrowth-birch', 'regrowth-willow',
      'appalachian-tree', 'appalachian-fallen-log', 'stacked-lumber', 'mangrove',
      'willow', 'fence', 'patched-fence', 'vale-fence', 'frontier-palisade', 'march-boardwalk',
    ]),
    fire: new Set([
      'torch', 'cookfire', 'campfire', 'bonfire', 'warm-brazier', 'dark-brazier',
      'ridge-hearth', 'estate-hearth', 'cellar-hearth', 'forge', 'ember-pit',
      'silver-refining-hearth', 'furnace', 'field-kitchen', 'ember', 'ogre-hearth',
      'citadel-forge-bay', 'geothermal-heat-intake', 'fumarole',
      'roadside-lantern', 'grave-lamp',
    ]),
  });
  // State-dependent identities are not proof that the pictured container is
  // full, the ore wagon is loaded or the industrial fixture is producing heat.
  // The authoring owner must supply a durable, authoritative live-state flag.
  const storedWaterKinds = new Set(['cistern', 'water-trough']);
  const storedOreKinds = new Set(['ore-cart']);
  const operatingHeatKinds = new Set([
    'forge', 'furnace', 'silver-refining-hearth', 'citadel-forge-bay',
    'geothermal-heat-intake',
  ]);
  const isFinitePoint = (p) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y);
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const cellKey = (x, y) => Math.floor(x / CELL) + ':' + Math.floor(y / CELL);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const privateSessions = new WeakMap();

  // A property or material label from a save is not authority. Only known structure
  // identities and the world rules below establish that a source really exists.
  function protectedHome(p) {
    const name = String(p?.structure || '').toLowerCase();
    // Settlement props are reserved town infrastructure, even if a wall or
    // woodpile would otherwise be a recognized material identity.
    const id = String(p?.id || '');
    return p?.protectedHome === true || id.startsWith('settlement-') || id.startsWith('crown-layout-') ||
      p?.civilianResidence === true ||
      /(?:^|[-_])(house|home|cottage|dwelling|residence|barracks|inn|living-quarters)(?:$|[-_])/.test(name) ||
      ['house', 'cottage', 'barracks', 'home', 'residence'].includes(p?.kind);
  }
  function propMaterial(p, gameTime = 0) {
    if (!isFinitePoint(p) || protectedHome(p) || p?.destroyed === true) return null;
    // These specific regional overlays are expressly scenery-only. Do not
    // promote a reused visual identity to gameplay without new authored state.
    if (p.greenwoodRefinement === 1 || p.crownCivicForecourt === true ||
        p.crownFoundryWorker === true || p.crownFoundryExterior === true) return null;
    const kind = String(p.structure || '');
    // Greenwood's authored forest deliberately stores nature in a separate
    // property, often with structure:null. These are real trees and fallen logs.
    if (p.greenwoodAuthored === true && String(p.id || '').startsWith('greenwood-nature-') && p.greenwoodNature === 'tree') return 'wood';
    if (p.greenwoodAuthored === true && String(p.id || '').startsWith('greenwood-nature-') && p.greenwoodNature === 'fallen-log') return 'wood';
    if (kind === 'crystal' && p.sceneRole === 'art-object') return null;
    // Containers require actual authored contents. Never assume every barrel is water.
    if (['barrel', 'bucket', 'jar', 'container', 'water-container'].includes(kind))
      return p.containsWater === true && p.empty !== true ? 'water' : null;
    if (propKinds.water.has(kind))
      return p.dry !== true &&
        (!storedWaterKinds.has(kind) || (p.containsWater === true && p.empty !== true))
        ? 'water' : null;
    if (propKinds.mineral.has(kind)) {
      if (kind.startsWith('appalachian-') && p.miningFacility !== true) return null;
      if (storedOreKinds.has(kind) && (p.containsOre !== true || p.empty === true)) return null;
      return 'mineral';
    }
    if (propKinds.wood.has(kind)) return 'wood';
    if (propKinds.fire.has(kind)) {
      if (p.lit === false || p.active === false || p.extinguished === true ||
          p.heatActive === false) return null;
      if (operatingHeatKinds.has(kind) &&
          p.lit !== true && p.active !== true && p.heatActive !== true) return null;
      return 'fire';
    }
    // A real temporary combat hazard must be supplied by its combat owner.
    // It is never inferred from a visual particle or a cosmetic flame prop.
    if (p.authoritativeCombatFire === true && p.kind === 'active-fire-hazard' &&
        Number.isFinite(p.expiresAt) && p.expiresAt > gameTime) return 'fire';
    return null;
  }

  function segmentDistance(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const length2 = dx * dx + dy * dy;
    const t = length2 ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / length2, 0, 1) : 0;
    return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
  }
  function closestPolygon(p, vertices) {
    if (!Array.isArray(vertices) || vertices.length < 2) return null;
    let best = null, bestD = Infinity;
    for (let i = 0; i < vertices.length; i++) {
      const rawA = vertices[i], rawB = vertices[(i + 1) % vertices.length];
      // March's authored harbor polygon uses [x,y] tuples; most wetland and
      // Highland polygons use {x,y}. Support both, never ignore a real coast.
      const a = Array.isArray(rawA) ? { x: rawA[0], y: rawA[1] } : rawA;
      const b = Array.isArray(rawB) ? { x: rawB[0], y: rawB[1] } : rawB;
      if (!isFinitePoint(a) || !isFinitePoint(b)) continue;
      const vx = b.x - a.x, vy = b.y - a.y, n = vx * vx + vy * vy;
      const t = n ? clamp(((p.x - a.x) * vx + (p.y - a.y) * vy) / n, 0, 1) : 0;
      const q = { x: a.x + vx * t, y: a.y + vy * t }, d = distance(p, q);
      if (d < bestD) { best = q; bestD = d; }
    }
    return best;
  }
  function closestToShape(p, shape) {
    if (shape.points) return closestPolygon(p, shape.points);
    if (Number.isFinite(shape.r)) {
      const d = distance(p, shape);
      if (d <= shape.r) return { x: p.x, y: p.y };
      const t = shape.r / Math.max(0.001, d);
      return { x: shape.x + (p.x - shape.x) * t, y: shape.y + (p.y - shape.y) * t };
    }
    if (Array.isArray(shape.bounds)) {
      const [x1, x2, y1, y2] = shape.bounds;
      const y = clamp(p.y, y1, y2);
      if ((shape.gaps || []).some(([lo, hi]) => y > lo && y < hi)) return null;
      return { x: clamp(p.x, x1, x2), y };
    }
    if (Number.isFinite(shape.x1) && Number.isFinite(shape.x2)) {
      let y = clamp(p.y, shape.y1, shape.y2);
      for (const [lo, hi] of shape.gaps || [])
        if (y >= lo && y <= hi) {
          // Industrial lava channels have deliberately dry bridge openings.
          // The closest actual lava is at a channel edge, not in that gap.
          const below = clamp(lo - 1, shape.y1, shape.y2);
          const above = clamp(hi + 1, shape.y1, shape.y2);
          y = Math.abs(p.y - below) < Math.abs(p.y - above) ? below : above;
        }
      return { x: clamp(p.x, shape.x1, shape.x2), y };
    }
    return isFinitePoint(shape) ? { x: shape.x, y: shape.y } : null;
  }

  function terrainSources(rules, zoneId, regionIndex) {
    // Parent-region indices also apply to dungeons. Outdoor water/lava must
    // NEVER leak into an interior through its containing region number.
    if (!Number.isInteger(regionIndex) || OVERWORLD[regionIndex] !== zoneId) return [];
    const result = [];
    (rules?.terrain?.[regionIndex] || []).forEach((shape, i) => {
      const material = shape.kind === 'water' || shape.kind === 'fountain' ||
        shape.kind === 'rain-pools' ? 'water' : shape.kind === 'lava' ? 'fire' : null;
      if (!material) return;
      if (shape.kind === 'rain-pools') {
        (shape.pools || []).forEach((pool, j) => result.push({
          id: 'terrain-' + i + '-' + j, material, kind: 'geometry', shape: pool,
        }));
      } else result.push({ id: 'terrain-' + i, material, kind: 'geometry', shape });
    });
    // March's shallow drainage is explicitly water despite being walkable.
    // Wet-grass and generic damp-colored landforms are not equivalent sources.
    if (zoneId === 'march' && Array.isArray(rules?.wetlandDrainage))
      result.push({ id: 'march-drainage', material: 'water', kind: 'drainage',
        shape: rules.wetlandDrainage });
    const harbor = rules?.harbors?.[zoneId]?.water;
    if (harbor) result.push({ id: 'harbor-water', material: 'water', kind: 'geometry', shape: harbor });
    const barrier = rules?.barriers?.[regionIndex];
    if (barrier && ['water', 'lava'].includes(barrier.kind)) result.push({
      id: 'regional-channel', material: barrier.kind === 'water' ? 'water' : 'fire',
      kind: 'channel', shape: barrier, regionIndex,
    });
    return result;
  }
  function sourcePoint(hero, source, rules) {
    if (source.kind === 'drainage') {
      let point = null, best = Infinity;
      const pieces = source.shape;
      for (let i = 1; i < pieces.length; i++) {
        const a = { x: pieces[i - 1][0], y: pieces[i - 1][1] },
          b = { x: pieces[i][0], y: pieces[i][1] },
          vx = b.x - a.x, vy = b.y - a.y,
          n = vx * vx + vy * vy;
        const t = n ? clamp(((hero.x - a.x) * vx + (hero.y - a.y) * vy) / n, 0, 1) : 0,
          center = { x: a.x + vx * t, y: a.y + vy * t },
          d = distance(hero, center),
          width = pieces[i - 1][2] + (pieces[i][2] - pieces[i - 1][2]) * t;
        const edge = d <= width ? { x: hero.x, y: hero.y } : {
          x: center.x + (hero.x - center.x) * width / Math.max(0.001, d),
          y: center.y + (hero.y - center.y) * width / Math.max(0.001, d),
        };
        const gap = distance(hero, edge);
        if (gap < best) { point = edge; best = gap; }
      }
      return point;
    }
    if (source.kind !== 'channel') return closestToShape(hero, source.shape || source.prop);
    const b = source.shape, [, , y1, y2] = b.bounds || [];
    if (![y1, y2].every(Number.isFinite) || typeof rules?.channelBanks !== 'function') return null;
    const possible = [clamp(hero.y, y1, y2), clamp(hero.y - 48, y1, y2),
      clamp(hero.y + 48, y1, y2)];
    for (const [lo, hi] of b.gaps || [])
      if (hero.y >= lo - MAX_CAST_RANGE && hero.y <= hi + MAX_CAST_RANGE)
        possible.push(clamp(lo - 1, y1, y2), clamp(hi + 1, y1, y2));
    let closest = null, best = Infinity;
    for (const y of possible) {
      if ((b.gaps || []).some(([lo, hi]) => y >= lo && y <= hi)) continue;
      const banks = rules.channelBanks(source.regionIndex, y);
      if (!Array.isArray(banks) || banks.length !== 2 || !banks.every(Number.isFinite)) continue;
      const x = Math.abs(hero.x - banks[0]) < Math.abs(hero.x - banks[1]) ? banks[0] : banks[1];
      const point = { x, y }, d = distance(hero, point);
      if (d < best) { best = d; closest = point; }
    }
    return closest;
  }

  function intersectsRectangle(a, b, rect) {
    // Fast-reject partitions nowhere near the segment before sampling.
    const left = rect.x1 ?? rect.bounds?.[0], right = rect.x2 ?? rect.bounds?.[1],
      top = rect.y1 ?? rect.bounds?.[2], bottom = rect.y2 ?? rect.bounds?.[3];
    if (![left, right, top, bottom].every(Number.isFinite) ||
        Math.max(a.x, b.x) <= left || Math.min(a.x, b.x) >= right ||
        Math.max(a.y, b.y) <= top || Math.min(a.y, b.y) >= bottom) return false;
    const n = Math.max(1, Math.ceil(distance(a, b) / 12));
    for (let i = 1; i < n; i++) {
      const p = { x: a.x + (b.x - a.x) * i / n, y: a.y + (b.y - a.y) * i / n };
      const x1 = rect.x1 ?? rect.bounds?.[0], x2 = rect.x2 ?? rect.bounds?.[1];
      const y1 = rect.y1 ?? rect.bounds?.[2], y2 = rect.y2 ?? rect.bounds?.[3];
      if (p.x <= x1 || p.x >= x2 || p.y <= y1 || p.y >= y2) continue;
      const v = rect.axis === 'x' ? p.x : p.y;
      if (!(rect.gaps || []).some(([lo, hi]) => v > lo && v < hi)) return true;
    }
    return false;
  }
  function segmentsCross(a, b, c, d) {
    const orient = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    const abC = orient(a, b, c), abD = orient(a, b, d);
    const cdA = orient(c, d, a), cdB = orient(c, d, b);
    // Collinear tangencies do not block a deliberately exposed source point.
    return abC * abD < 0 && cdA * cdB < 0;
  }
  function opaqueProps(zone) {
    const obstructions = [];
    for (const p of zone.props || []) {
      if (p?.greenwoodWall?.a && p.greenwoodWall.b) {
        obstructions.push({ kind: 'wall-segment', prop: p, a: p.greenwoodWall.a, b: p.greenwoodWall.b });
      }
      if (p.decorative || !(p.r > 0) || !isFinitePoint(p)) continue;
      if (/wall|stockade|palisade|gate|fortress|watchpost|house|tower|pillar|cellar-pier/.test(String(p.structure || '')))
        obstructions.push({ kind: 'circle', prop: p, center: p, radius: p.r });
    }
    for (const p of zone.buildings || []) {
      if (!isFinitePoint(p)) continue;
      obstructions.push({
        kind: 'circle', prop: p, center: p,
        radius: Number.isFinite(p.r) ? p.r : 30,
      });
    }
    return obstructions;
  }
  function indexObstructions(zone) {
    const grid = new Map();
    for (const obstruction of opaqueProps(zone)) {
      const a = obstruction.kind === 'circle' ? obstruction.center : obstruction.a;
      const b = obstruction.kind === 'circle' ? obstruction.center : obstruction.b;
      const r = obstruction.kind === 'circle' ? obstruction.radius : 1;
      if (!isFinitePoint(a) || !isFinitePoint(b)) continue;
      const x1 = Math.floor((Math.min(a.x, b.x) - r) / CELL);
      const x2 = Math.floor((Math.max(a.x, b.x) + r) / CELL);
      const y1 = Math.floor((Math.min(a.y, b.y) - r) / CELL);
      const y2 = Math.floor((Math.max(a.y, b.y) + r) / CELL);
      for (let x = x1; x <= x2; x++)
        for (let y = y1; y <= y2; y++) {
          const key = x + ':' + y;
          if (!grid.has(key)) grid.set(key, []);
          grid.get(key).push(obstruction);
        }
    }
    return grid;
  }
  function nearbyObstructions(grid, a, b) {
    const found = new Set();
    const minX = Math.floor((Math.min(a.x, b.x) - 1) / CELL);
    const maxX = Math.floor((Math.max(a.x, b.x) + 1) / CELL);
    const minY = Math.floor((Math.min(a.y, b.y) - 1) / CELL);
    const maxY = Math.floor((Math.max(a.y, b.y) + 1) / CELL);
    for (let x = minX; x <= maxX; x++)
      for (let y = minY; y <= maxY; y++)
        for (const obstruction of grid.get(x + ':' + y) || []) found.add(obstruction);
    return found;
  }
  function hasSight(hero, target, source, zone, rules, index = null) {
    // Deliberately NOT Campaign.line/clearSegment: they reject water, ravines and lava.
    // A lazily indexed obstacle catalog avoids an all-prop scan per nearby source.
    const partitions = rules?.dungeonArchitecture?.[zone.id]?.partitions ||
      rules?.treasuryArchitecture?.[zone.id]?.partitions ||
      rules?.treasuryWalls?.[zone.id] || [];
    if (partitions.some((wall) => intersectsRectangle(hero, target, wall))) return false;
    const obstructions = nearbyObstructions(index?.obstructions || indexObstructions(zone), hero, target);
    for (const o of obstructions) {
      if (o.prop === source?.prop) continue;
      if (o.kind === 'wall-segment') {
        if (segmentsCross(hero, target, o.a, o.b)) return false;
      } else if (segmentDistance(o.center, hero, target) < o.radius) return false;
    }
    return true;
  }
  function sourceIndex(zone, rules, regionIndex, time) {
    const grid = new Map();
    for (const prop of zone.props || []) {
      const material = propMaterial(prop, time);
      if (!material) continue;
      const source = { id: prop.id, kind: 'prop', material, prop };
      const key = cellKey(prop.x, prop.y);
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(source);
    }
    return {
      zone, props: zone.props, length: zone.props?.length || 0,
      buildings: zone.buildings, buildLength: zone.buildings?.length || 0,
      rulesTerrain: rules?.terrain?.[regionIndex],
      grid, obstructions: indexObstructions(zone),
      terrain: terrainSources(rules, zone.id, regionIndex),
    };
  }
  function candidates(index, point, radius, material) {
    const found = [];
    const loX = Math.floor((point.x - radius) / CELL), hiX = Math.floor((point.x + radius) / CELL);
    const loY = Math.floor((point.y - radius) / CELL), hiY = Math.floor((point.y + radius) / CELL);
    for (let x = loX; x <= hiX; x++)
      for (let y = loY; y <= hiY; y++)
        for (const source of index.grid.get(x + ':' + y) || [])
          if (source.material === material) found.push(source);
    return found.concat(index.terrain.filter((source) => source.material === material));
  }

  function state(game, zone, rules) {
    if (!game || !zone || typeof game !== 'object') return null;
    let session = privateSessions.get(game);
    if (!session) { session = new Map(); privateSessions.set(game, session); }
    const regionIndex = typeof game.regionIndex === 'function' ? game.regionIndex(zone.id) : -1;
    const old = session.get(zone.id);
    if (!old || old.zone !== zone || old.props !== zone.props ||
        old.length !== (zone.props?.length || 0) || old.buildings !== zone.buildings ||
        old.buildLength !== (zone.buildings?.length || 0) ||
        old.rulesTerrain !== rules?.terrain?.[regionIndex]) {
      const created = sourceIndex(zone, rules, regionIndex, game.s?.time || 0);
      // Keep only a small working set in RAM; old regions are reconstructed on
      // demand rather than keeping every visited dungeon's index forever.
      if (session.has(zone.id)) session.delete(zone.id);
      session.set(zone.id, created);
      while (session.size > MAX_ZONE_INDEXES) session.delete(session.keys().next().value);
      return created;
    }
    return old;
  }
  function invalidate(game, zoneId) {
    const cache = privateSessions.get(game);
    if (!cache) return;
    if (zoneId === undefined) cache.clear();
    else cache.delete(zoneId);
  }
  function authenticCombatFire(h) {
    // Actual combat owns timed hazards in s.hazards, not z.props. The Abyss
    // delayed-flame patch is an already authored physical fire. Other/new
    // effects must opt in with explicit combat-owned material metadata.
    return isFinitePoint(h) && h.life > 0 && h.kind === 'circle' &&
      ((h.family === 'abyss' && h.name === 'Delayed flame patch' && h.persistent === true) ||
        (h.authoritativeCombatFire === true && h.material === 'fire'));
  }
  function findSource(game, material, options = {}) {
    if (!MATERIALS.includes(material) || !isFinitePoint(options.at)) return null;
    const zone = options.zone, rules = options.rules;
    const maxRange = options.access ? MAX_GATHER_RANGE : MAX_CAST_RANGE;
    if (!zone || !rules || !Number.isFinite(options.range) ||
        options.range < 0 || options.range > maxRange) return null;
    const index = state(game, zone, rules);
    if (!index) return null;
    const nearby = [];
    for (const source of candidates(index, options.at, options.range + 36, material)) {
      // Live conditions are checked again, so extinguishing a fire never waits for a cache reset.
      if (source.prop && propMaterial(source.prop, game.s?.time || 0) !== material) continue;
      // Gatherers touch an authored solid at its actual outer surface.
      // Combat casting retains #770's original optical lookup.
      const point = options.access && source.kind === 'prop' &&
          Number.isFinite(source.prop?.r) && source.prop.r > 0
        ? closestToShape(options.at, source.prop)
        : sourcePoint(options.at, source, rules);
      if (!point) continue;
      const d = distance(options.at, point);
      if (d <= options.range) nearby.push({ source, point, d });
    }
    // Combat effects are not saved props and must not enter the long-lived
    // index. Inspect this tiny, bounded volatile list on actual Strategist
    // Fire checks only. Workers never harvest hostile temporary flame patches.
    if (!options.access && options.sight && material === 'fire' &&
        game?.s?.zone === zone.id) {
      const active = game.s.hazards || [];
      for (let i = 0; i < active.length && i < MAX_ACTIVE_HAZARD_PROBES; i++) {
        const h = active[i];
        if (!authenticCombatFire(h)) continue;
        const source = {
          id: 'combat-fire-' + i, kind: 'hazard', material: 'fire',
          shape: { x: h.x, y: h.y, r: Number.isFinite(h.radius) ? h.radius : 0 },
        };
        const point = sourcePoint(options.at, source, rules);
        const d = point ? distance(options.at, point) : Infinity;
        if (d <= options.range) nearby.push({ source, point, d });
      }
    }
    // Deterministic nearest-first selection: a Lab does not repeatedly pathfind
    // to every source in a region when nearby candidates are unreachable.
    nearby.sort((a, b) => a.d - b.d || String(a.source.id).localeCompare(String(b.source.id)));
    let routeProbes = 0, sightProbes = 0;
    for (const { source, point, d } of nearby) {
      if (options.sight) {
        if (++sightProbes > MAX_SIGHT_PROBES) break;
        if (!hasSight(options.at, point, source, zone, rules, index)) continue;
      }
      if (options.access) {
        if (++routeProbes > MAX_ROUTE_PROBES) break;
        if (!options.access(source, point, zone)) continue;
      }
      return { id: source.id, material, point, distance: d, source: source.prop || source.shape };
    }
    return null;
  }
  function forCombat(game, material, options = {}) {
    // Fast fail BEFORE reading zones, iterating props or allocating a session.
    if (game?.hero?.class !== 'strategist') return null;
    const hero = game.hero;
    if (!isFinitePoint(hero)) return null;
    const zone = options.zone || game.s?.zones?.[game.s.zone];
    return findSource(game, material, {
      at: hero, zone, rules: options.rules || game.constructor?.rules,
      range: options.range, sight: true,
    });
  }
  function forGather(game, material, options = {}) {
    // A qualified Field Lab caller must prove ownership/staffing and supply an
    // actual route. This module never invents workers, teleportation or labor.
    if (typeof options.authorize !== 'function' ||
        options.authorize(game, options.lab, options.worker) !== true ||
        typeof options.route !== 'function' || typeof options.passable !== 'function' ||
        !isFinitePoint(options.worker)) return null;
    const zone = options.zone || game?.s?.zones?.[options.lab?.zone];
    if (!zone || zone.id !== options.lab?.zone || !OVERWORLD.includes(zone.id)) return null;
    return findSource(game, material, {
      at: options.worker, zone, rules: options.rules || game.constructor?.rules,
      range: options.range,
      access: (source, point) => {
        const route = options.route(options.worker, point, zone);
        if (!Array.isArray(route) || !route.length || route.length > 128 ||
            !route.every(isFinitePoint) ||
            distance(route[route.length - 1], point) > 24) return false;
        // The last waypoint being near the source is NOT evidence that a
        // worker can reach it. Each step must pass authoritative navigation.
        let previous = options.worker;
        for (const waypoint of route) {
          if (options.passable(previous, waypoint, zone) !== true) return false;
          previous = waypoint;
        }
        return true;
      },
    });
  }
  const api = Object.freeze({
    MATERIALS, propMaterial, protectedHome, terrainSources, closestToShape,
    hasSight, findSource, forCombat, forGather, invalidate,
  });
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeStrategistMaterials = api;
})(typeof window !== 'undefined' ? window : globalThis);
