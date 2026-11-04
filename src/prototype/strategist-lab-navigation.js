/* Dormant Field Lab navigation: bounded, zone-explicit routes using Campaign.blocked.
 * Never writes game.s.zone, never calls active-zone route()/clearSegment(),
 * never treats a renderer-colored terrain patch as collision evidence.
 */
(function (root) {
  'use strict';
  const RADIUS = 15, STEP = 60, PROBE_STEP = 12;
  const DEFAULT_NODES = 300, DEFAULT_PROBES = 2400;
  const MAX_WAYPOINTS = 128;
  const isPoint = (p) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y);
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function budget(nodes = DEFAULT_NODES, probes = DEFAULT_PROBES) {
    return {
      nodes: Math.max(0, Math.min(1200, Math.floor(nodes))),
      probes: Math.max(0, Math.min(9600, Math.floor(probes))),
      exhausted: false,
      expanded: 0, tested: 0,
    };
  }
  function isWorld(g, zoneId) {
    return !!g?.s?.zones?.[zoneId] &&
      typeof g.blocked === 'function' &&
      typeof g.zoneSize === 'function' &&
      Number.isFinite(g.zoneSize(zoneId)) &&
      g.zoneSize(zoneId) >= 500;
  }
  function accessible(g, zoneId, x, y, b) {
    if (!b || b.probes <= 0) {
      if (b) b.exhausted = true;
      return false;
    }
    b.probes--; b.tested++;
    return g.blocked(x, y, zoneId, RADIUS) === false;
  }
  function passable(g, zoneId, from, to, token = budget(0, DEFAULT_PROBES)) {
    if (!isWorld(g, zoneId) || !isPoint(from) || !isPoint(to) ||
        distance(from, to) > 4000) return false;
    const length = distance(from, to), slices = Math.max(1, Math.ceil(length / PROBE_STEP));
    // Validate every segment including both ends, as native clearSegment does,
    // but with an explicit zone rather than the hero's currently active zone.
    for (let j = 0; j <= slices; j++) {
      const t = j / slices;
      if (!accessible(g, zoneId,
        from.x + (to.x - from.x) * t,
        from.y + (to.y - from.y) * t, token)) return false;
    }
    return true;
  }
  function heap() {
    const items = [];
    return {
      push(value) {
        let i = items.length;
        items.push(value);
        while (i) {
          const p = (i - 1) >> 1;
          if (items[p].score <= value.score) break;
          items[i] = items[p]; i = p;
        }
        items[i] = value;
      },
      pop() {
        const first = items[0], last = items.pop();
        if (!items.length) return first;
        let i = 0;
        while (i * 2 + 1 < items.length) {
          let j = i * 2 + 1;
          if (j + 1 < items.length && items[j + 1].score < items[j].score) j++;
          if (last.score <= items[j].score) break;
          items[i] = items[j]; i = j;
        }
        items[i] = last;
        return first;
      },
      get size() { return items.length; },
    };
  }
  function route(g, zoneId, start, end, token = budget()) {
    if (!isWorld(g, zoneId) || !isPoint(start) || !isPoint(end) ||
        !token || !Number.isFinite(token.nodes) || !Number.isFinite(token.probes))
      return [];
    const size = g.zoneSize(zoneId);
    if (start.x < 0 || start.y < 0 || end.x < 0 || end.y < 0 ||
        start.x >= size || start.y >= size) return [];
    // Never "snap" the requested destination out of a rock or water source.
    // A future source API must explicitly offer a walkable approach point.
    if (!accessible(g, zoneId, end.x, end.y, token) ||
        !accessible(g, zoneId, start.x, start.y, token)) return [];
    if (passable(g, zoneId, start, end, token)) return [{ x: end.x, y: end.y }];
    const count = Math.ceil(size / STEP),
      gridPoint = (i) => ({ x: (i % count) * STEP + STEP / 2,
        y: Math.floor(i / count) * STEP + STEP / 2 }),
      gridKey = (x, y) => y * count + x,
      cells = (p) => {
        const baseX = Math.floor(p.x / STEP), baseY = Math.floor(p.y / STEP);
        const out = [];
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            const x = baseX + dx, y = baseY + dy;
            if (x < 0 || y < 0 || x >= count || y >= count) continue;
            const id = gridKey(x, y), point = gridPoint(id);
            if (passable(g, zoneId, p, point, token)) out.push(id);
            if (token.exhausted) return out;
          }
        return out;
      };
    const starts = cells(start), goals = new Set(cells(end));
    if (token.exhausted || !starts.length || !goals.size) return [];
    const open = heap(), scores = new Map(), parents = new Map();
    for (const s of starts) {
      const p = gridPoint(s), d = distance(start, p);
      scores.set(s, d); parents.set(s, null);
      open.push({ id: s, cost: d, score: d + distance(p, end) });
    }
    const offsets = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
    while (open.size && token.nodes > 0 && token.probes > 0) {
      const next = open.pop();
      if (next.cost !== scores.get(next.id)) continue;
      token.nodes--; token.expanded++;
      if (goals.has(next.id)) {
        const raw = [{ x: end.x, y: end.y }];
        let cursor = next.id;
        while (cursor !== null) { raw.unshift(gridPoint(cursor)); cursor = parents.get(cursor); }
        // Only simplify when the exact native collision samples prove the
        // replacement line is traversable. Keep the conservative route if the
        // remaining shared budget cannot afford smoothing.
        const result = [], all = [start, ...raw];
        let at = 0;
        while (at < all.length - 1) {
          let candidate = at + 1;
          for (let j = at + 2; j < all.length; j++) {
            if (token.probes < 400 || !passable(g, zoneId, all[at], all[j], token)) break;
            candidate = j;
          }
          result.push({ x: all[candidate].x, y: all[candidate].y });
          at = candidate;
          if (result.length > MAX_WAYPOINTS) return [];
        }
        return result.every(isPoint) ? result : [];
      }
      const cx = next.id % count, cy = Math.floor(next.id / count);
      for (const [dx,dy] of offsets) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= count || y >= count) continue;
        const id = gridKey(x, y), from = gridPoint(next.id), to = gridPoint(id);
        if (!passable(g, zoneId, from, to, token)) continue;
        const cost = next.cost + distance(from, to);
        if (cost >= (scores.get(id) ?? Infinity)) continue;
        scores.set(id, cost); parents.set(id, next.id);
        open.push({ id, cost, score: cost + distance(to, end) });
      }
    }
    if (token.nodes <= 0 || token.probes <= 0) token.exhausted = true;
    return []; // Over-budget is unavailable, never a fabricated traversable route.
  }
  function adapter() {
    return Object.freeze({
      budget, passable, route,
      // One shared budget across the at-most-24 source probes in #770.
      newDecisionBudget: () => budget(),
    });
  }
  const api = Object.freeze({ adapter, budget, passable, route });
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeStrategistLabNavigation = api;
})(typeof window !== 'undefined' ? window : globalThis);
