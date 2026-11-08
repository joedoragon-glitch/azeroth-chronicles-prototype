/* World-anchored Dark Crown geology and older-ground habitat. */
(function (root) {
  'use strict';

  const VERSION = 2;
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

  // Long flows travel away from the main fissure. Short overlapping lobes
  // leave pockets of weathered rock between successive eruptions.
  const flows = [
    { x: 1060, y: 380, rx: 560, ry: 225, angle: -0.35, age: 0.35 },
    { x: 1600, y: 880, rx: 780, ry: 310, angle: -0.53, age: 0.14 },
    { x: 2130, y: 1150, rx: 940, ry: 310, angle: 0.19, age: 0.24 },
    { x: 800, y: 1740, rx: 710, ry: 300, angle: 0.24, age: 0.19 },
    { x: 660, y: 2520, rx: 560, ry: 310, angle: -0.49, age: 0.23 },
    { x: 1740, y: 2960, rx: 760, ry: 310, angle: 0.58, age: 0.14 },
    { x: 3000, y: 3210, rx: 730, ry: 350, angle: 0.31, age: 0.34 },
  ];
  const islands = Object.freeze([
    Object.freeze({ id: 'ash-refuge', x: 365, y: 2010, rx: 205, ry: 160, seed: 111 }),
    Object.freeze({ id: 'southwest', x: 710, y: 3120, rx: 275, ry: 205, seed: 143 }),
    Object.freeze({ id: 'southern-fold', x: 1770, y: 3410, rx: 240, ry: 195, seed: 181 }),
  ]);
  const authored = { flows, islands };
  function pigment(field) {
    const age = field.age;
    return [
      48 + age * 21 + field.oxidization * 18,
      47 + age * 17 + field.island * 9,
      57 + age * 19 - field.island * 6,
    ];
  }
  const rgb = (channels) => 'rgb(' + channels.map(Math.round).join(',') + ')';
  function tilePigment(ctx, p, x, y, field) {
    if (typeof ctx.createLinearGradient !== 'function') return rgb(pigment(field));
    // Adjacent diamonds sample their shared world vertices. Shade across the
    // dominant axis to soften seams while keeping the mineral colors local.
    const left = pigment(sample(x, y + 80, authored));
    const right = pigment(sample(x + 80, y, authored));
    const top = pigment(sample(x, y, authored));
    const bottom = pigment(sample(x + 80, y + 80, authored));
    const delta = (a, b) => a.reduce((sum, value, index) => sum + Math.abs(value - b[index]), 0);
    const horizontal = delta(left, right) >= delta(top, bottom);
    const gradient = horizontal
      ? ctx.createLinearGradient(p.x - 60.8, p.y, p.x + 60.8, p.y)
      : ctx.createLinearGradient(p.x, p.y, p.x, p.y + 43.2);
    gradient.addColorStop(0, rgb(horizontal ? left : top));
    gradient.addColorStop(0.5, rgb(pigment(field)));
    gradient.addColorStop(1, rgb(horizontal ? right : bottom));
    return gradient;
  }
  function paintTile(ctx, p, x, y) {
    // The renderer owns the 80-unit world diamond. Anchoring the grain to
    // this lattice keeps Canvas windows and overlapping Pixi tiles consistent.
    const field = sample(x + 40, y + 40, authored);
    ctx.fillStyle = tilePigment(ctx, p, x, y, field);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 60.8, p.y + 21.6);
    ctx.lineTo(p.x, p.y + 43.2);
    ctx.lineTo(p.x - 60.8, p.y + 21.6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 1;
    ctx.stroke();
    const tileX = x / 80,
      tileY = y / 80;
    const grainCount = Math.round(5 + 8 * field.cinder);
    for (let n = 0; n < grainCount; n++) {
      const u = 10 + hash2(tileX, tileY, 401 + n * 23) * 60;
      const v = 10 + hash2(tileX, tileY, 719 + n * 31) * 60;
      const px = p.x + (u - v) * 0.76,
        py = p.y + (u + v) * 0.27;
      const joint = n < 2 && field.fracture > 0.48;
      const length = 2 + hash2(tileX, tileY, 907 + n * 47) * (joint ? 22 : 4);
      ctx.strokeStyle = n % 3 === 0 ? '#c7b0a92b' : '#20202d62';
      ctx.lineWidth = joint ? 1.3 : 0.7;
      ctx.beginPath();
      ctx.moveTo(px - length / 2, py + 1);
      ctx.lineTo(px, py - (joint ? 3 : 1));
      ctx.lineTo(px + length / 2, py + (joint ? 2 : 0));
      ctx.stroke();
    }
  }

  const api = Object.freeze({
    VERSION,
    WORLD_SIZE,
    hash2,
    noise,
    flowMask,
    islandMask,
    sample,
    islands,
    paintTile,
  });
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeDarkCrownLandscape = api;
})(typeof window !== 'undefined' ? window : globalThis);
