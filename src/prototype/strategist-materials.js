/* Strategist-only environmental material truth. No renderer sampling or automatic frame work.
 * This module is dormant until a future class/Field Lab owner calls its API.
 * Pure inventory lookups never modify the Campaign, the world, or the save.
 */
(function (root) {
  'use strict';

  const CELL = 192;
  const MAX_CAST_RANGE = 320;
  const MAX_GATHER_RANGE = 320;
  const MATERIALS = Object.freeze(['water', 'mineral', 'wood', 'fire']);
  const propKinds = Object.freeze({
    water: new Set(['well', 'fountain', 'mill-pond', 'pond', 'water', 'cistern', 'water-trough']),
    mineral: new Set([
      'rock-cluster', 'highland-rock', 'black-rock', 'mossy-basalt', 'obsidian',
      'crystal-cluster', 'silver-ore-face', 'copper-ore-face', 'ore-face',
      'stonewall', 'crown-wall', 'stone-marker',
    ]),
    wood: new Set([
      'tree', 'fruit-tree', 'dead-tree', 'sapling', 'pine-sapling', 'stump',
      'charred-stump', 'fallen-log', 'burned-log', 'driftwood', 'woodpile',
      'palisade', 'stockade', 'regrowth-birch', 'regrowth-willow',
      'appalachian-tree', 'appalachian-fallen-log',
    ]),
    fire: new Set([
      'torch', 'cookfire', 'campfire', 'bonfire', 'warm-brazier', 'dark-brazier',
      'ridge-hearth', 'estate-hearth', 'cellar-hearth', 'forge', 'ember-pit',
      'silver-refining-hearth', 'furnace', 'field-kitchen',
    ]),
  });
  const isFinitePoint = (p) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y);
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const cellKey = (x, y) => Math.floor(x / CELL) + ':' + Math.floor(y / CELL);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const privateSessions = new WeakMap();

  // A property or material label from a save is not authority. Only known structure
  // identities and the world rules below establish that a source really exists.
  function protectedHome(p) {
    const name = String(p?.structure || '').toLowerCase();
    return p?.protectedHome === true ||
      /(?:^|[-_])(house|home|cottage|dwelling|residence|barracks|inn|living-quarters)(?:$|[-_])/.test(name) ||
      ['house', 'cottage', 'barracks', 'home', 'residence'].includes(p?.kind);
  }
  function propMaterial(p, gameTime = 0) {
    if (!isFinitePoint(p) || protectedHome(p) || p?.destroyed === true) return null;
    const kind = String(p.structure || '');
    // Containers require actual authored contents. Never assume every barrel is water.
    if (['barrel', 'bucket', 'jar', 'container', 'water-container'].includes(kind))
      return p.containsWater === true && p.empty !== true ? 'water' : null;
    if (propKinds.water.has(kind)) return p.dry !== true ? 'water' : null;
    if (propKinds.mineral.has(kind)) return 'mineral';
    if (propKinds.wood.has(kind)) return 'wood';
    if (propKinds.fire.has(kind))
      return p.lit === false || p.active === false || p.extinguished === true ||
        p.heatActive === false ? null : 'fire';
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
      const a = vertices[i], b = vertices[(i + 1) % vertices.length];
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
    if (Number.isFinite(shape.x1) && Number.isFinite(shape.x2))
      return { x: clamp(p.x, shape.x1, shape.x2), y: clamp(p.y, shape.y1, shape.y2) };
    return isFinitePoint(shape) ? { x: shape.x, y: shape.y } : null;
  }

  function terrainSources(rules, zoneId, regionIndex) {
    if (!Number.isInteger(regionIndex) || regionIndex < 0 || regionIndex > 4) return [];
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
    if (source.kind !== 'channel') return closestToShape(hero, source.shape || source.prop);
    const b = source.shape, [, , y1, y2] = b.bounds || [];
    if (![y1, y2].every(Number.isFinite) || typeof rules?.channelBanks !== 'function') return null;
    const possible = [clamp(hero.y, y1, y2), clamp(hero.y - 48, y1, y2), clamp(hero.y + 48, y1, y2)];
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
    // Sample only authoritative indoor partitions at a 12-unit interval.
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
  function hasSight(hero, target, source, zone, rules) {
    // Deliberately NOT Campaign.line/clearSegment: they reject water, ravines and lava.
    // Only actual opaque structures should obstruct manipulation.
    const partitions = rules?.dungeonArchitecture?.[zone.id]?.partitions ||
      rules?.treasuryArchitecture?.[zone.id]?.partitions ||
      rules?.treasuryWalls?.[zone.id] || [];
    if (partitions.some((wall) => intersectsRectangle(hero, target, wall))) return false;
    for (const p of zone.props || []) {
      if (p === source?.prop || p.decorative || !(p.r > 0) || !isFinitePoint(p)) continue;
      const structure = String(p.structure || '');
      if (!/wall|stockade|palisade|gate|fortress|watchpost|house|tower/.test(structure)) continue;
      if (segmentDistance(p, hero, target) < p.r) return false;
    }
    for (const building of zone.buildings || []) {
      if (!isFinitePoint(building)) continue;
      const r = Number.isFinite(building.r) ? building.r : 30;
      if (segmentDistance(building, hero, target) < r) return false;
    }
    return true;
  }
  function sourceIndex(zone, rules, regionIndex, time) {
    const grid = new Map(), items = [];
    for (const prop of zone.props || []) {
      const material = propMaterial(prop, time);
      if (!material) continue;
      const source = { id: prop.id, kind: 'prop', material, prop };
      items.push(source);
      const key = cellKey(prop.x, prop.y);
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(source);
    }
    return {
      zone, props: zone.props, length: zone.props?.length || 0,
      buildings: zone.buildings, buildLength: zone.buildings?.length || 0,
      rulesTerrain: rules?.terrain?.[regionIndex],
      grid, terrain: terrainSources(rules, zone.id, regionIndex),
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
      session.set(zone.id, created);
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
  function findSource(game, material, options = {}) {
    if (!MATERIALS.includes(material) || !isFinitePoint(options.at)) return null;
    const zone = options.zone, rules = options.rules;
    if (!zone || !rules || !Number.isFinite(options.range) ||
        options.range < 0 || options.range > MAX_CAST_RANGE) return null;
    const index = state(game, zone, rules);
    if (!index) return null;
    let best = null, bestD = Infinity;
    for (const source of candidates(index, options.at, options.range + 36, material)) {
      // Live conditions are checked again, so extinguishing a fire never waits for a cache reset.
      if (source.prop && propMaterial(source.prop, game.s?.time || 0) !== material) continue;
      const point = sourcePoint(options.at, source, rules);
      if (!point) continue;
      const d = distance(options.at, point);
      if (d > options.range || d >= bestD) continue;
      if (options.sight && !hasSight(options.at, point, source, zone, rules)) continue;
      if (options.access && !options.access(source, point, zone)) continue;
      best = { id: source.id, material, point, distance: d, source: source.prop || source.shape };
      bestD = d;
    }
    return best;
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
        typeof options.route !== 'function' || !isFinitePoint(options.worker)) return null;
    const zone = options.zone || game?.s?.zones?.[options.lab?.zone];
    if (!zone || zone.id !== options.lab?.zone) return null;
    return findSource(game, material, {
      at: options.worker, zone, rules: options.rules || game.constructor?.rules,
      range: options.range,
      access: (source, point) => {
        const route = options.route(options.worker, point, zone);
        return Array.isArray(route) && route.length > 0 &&
          route.every(isFinitePoint) && isFinitePoint(route[route.length - 1]) &&
          distance(route[route.length - 1], point) <= 24;
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
