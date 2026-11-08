/* Dark Crown natural geology/soil model. Experimental, unconnected to runtime rendering.
 * World-anchored, deterministic presentation math only; never mutate Campaign/save state.
 * Author actual flow/island footprints against the Phase-2 native camera survey before integration.
 */
(function (root) {
  'use strict';

  const VERSION = 1;
  const WORLD_SIZE = 3800;
  const clamp = (n) => Math.max(0, Math.min(1, n));
  const smooth = (t) => t * t * (3 - 2 * t);
  const mix = (a, b, t) => a + (b - a) * t;

  function hash2(x, y, salt = 0) {
    let h = Math.imul(x | 0, 0x1f123bb5) ^ Math.imul(y | 0, 0x5f356495) ^ (salt | 0);
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }

  // Continuous across 80-unit floor diamonds and 512px Pixi background tiles.
  // Sample by world coordinates, never by screen coordinates or elapsed time.
  function noise(x, y, wavelength, salt = 0) {
    const gx = x / wavelength;
    const gy = y / wavelength;
    const ix = Math.floor(gx);
    const iy = Math.floor(gy);
    const u = smooth(gx - ix);
    const v = smooth(gy - iy);
    return mix(
      mix(hash2(ix, iy, salt), hash2(ix + 1, iy, salt), u),
      mix(hash2(ix, iy + 1, salt), hash2(ix + 1, iy + 1, salt), u),
      v,
    );
  }

  // Elliptical lava-flow lobes are authored shapes, not actor-blocking terrain.
  // age: 0 = new black lava; 1 = old weathered mineral ground.
  function flowMask(x, y, flow) {
    const c = Math.cos(flow.angle || 0);
    const s = Math.sin(flow.angle || 0);
    const dx = x - flow.x;
    const dy = y - flow.y;
    const ax = (dx * c + dy * s) / Math.max(1, flow.rx);
    const ay = (-dx * s + dy * c) / Math.max(1, flow.ry);
    const edge = 0.075 * (noise(x, y, 275, 301) - 0.5);
    return clamp((1.06 - Math.hypot(ax, ay) + edge) / 0.16);
  }

  // Kīpuka-like older-ground habitat: irregular concentric island edge with
  // a soil/vegetation core. The island objects are explicitly authored later.
  function islandMask(x, y, islands) {
    let mask = 0;
    for (const island of islands) {
      const dx = (x - island.x) / Math.max(1, island.rx);
      const dy = (y - island.y) / Math.max(1, island.ry);
      const bend = (noise(x, y, 120, island.seed || 79) - 0.5) * 0.16;
      const d = Math.hypot(dx, dy) + bend;
      mask = Math.max(mask, smooth(clamp((1.1 - d) / 0.38)));
    }
    return mask;
  }

  // The view/terrain owner must supply site-aware heat/hazard intensity and
  // vegetation exclusions at integration. In particular no plants may appear
  // on the real lava river, the two crossings, roads or hot industrial pads.
  function sample(x, y, options = {}) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    const flows = options.flows || [];
    const islands = options.islands || [];
    let age = clamp(0.33 + 0.55 * noise(x, y, 680, 17) + 0.12 * (noise(x, y, 245, 23) - 0.5));
    let flow = 0;
    for (const lobe of flows) {
      const influence = flowMask(x, y, lobe);
      age = mix(age, clamp(lobe.age), influence);
      flow = Math.max(flow, influence);
    }
    const island = islandMask(x, y, islands);
    age = mix(age, Math.max(age, 0.88), island);
    const cinder = clamp(0.25 + 0.76 * noise(x, y, 390, 41) - 0.24 * flow);
    const fracture = clamp(0.3 * noise(x, y, 95, 53) + 0.7 * noise(x, y, 205, 59));
    const oxidization = clamp((age - 0.3) * noise(x, y, 290, 71));
    const hazard = clamp(typeof options.hazardAt === 'function' ? options.hazardAt(x, y) : 0);
    const excluded = clamp(
      typeof options.exclusionAt === 'function' ? options.exclusionAt(x, y) : 0,
    );
    const cool = (1 - hazard) * (1 - excluded);
    const soil = clamp((age - 0.5) * 0.54 + island * 0.8 + cinder * 0.12) * cool;
    const pioneer = clamp(soil * 0.4 + island * 0.36) * cool;
    const shrubs = clamp((soil - 0.28) * 0.75 + island * 0.25) * cool;
    const trees = clamp((island - 0.68) * 0.65) * cool;
    return {
      age,
      flow,
      cinder,
      fracture,
      oxidization,
      island,
      soil,
      pioneer,
      shrubs,
      trees,
      // Material classification is a painter suggestion, not physical collision.
      material:
        age < 0.3
          ? 'young-basalt'
          : cinder > 0.66
            ? 'cinder-ash'
            : fracture > 0.64
              ? 'clinker'
              : 'weathered-basalt',
    };
  }

  const api = Object.freeze({ VERSION, WORLD_SIZE, hash2, noise, flowMask, islandMask, sample });
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeDarkCrownLandscape = api;
})(typeof window !== 'undefined' ? window : globalThis);
