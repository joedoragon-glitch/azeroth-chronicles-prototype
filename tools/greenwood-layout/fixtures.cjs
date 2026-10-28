'use strict';
// Offline comparison only. Run each size in a separate process: native world.js
// intentionally caches road plans by region/version. Never load into the game.
const clone = (v) => JSON.parse(JSON.stringify(v));
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function candidate(C, size) {
  if (![2700, 3200, 3400].includes(size)) throw Error('Unknown comparison');
  const D = C.data,
    R = C.rules,
    extra = size - 2700;
  // Keep the origin/start; allocate most extra width to the cultivated west
  // bank, preserving local house/hero footprints and all compound offsets.
  const lerp = (v, knots) => {
    for (let j = 1; j < knots.length; j++) {
      const [a, da] = knots[j - 1],
        [b, db] = knots[j];
      if (v <= b) return v + extra * (da + ((db - da) * (v - a)) / (b - a));
    }
    return v + extra;
  };
  const x = (v) =>
    lerp(v, [
      [0, 0],
      [300, 0],
      [900, 0.45],
      [1200, 0.7],
      [2700, 1],
    ]);
  const y = (v) =>
    lerp(v, [
      [0, 0],
      [350, 0],
      [700, 0.3],
      [1750, 0.65],
      [2700, 1],
    ]);
  const pair = (p) => {
    p[0] = x(p[0]);
    p[1] = y(p[1]);
  };
  const point = (p) => {
    p.x = x(p.x);
    p.y = y(p.y);
  };
  const before = {};
  for (const key of ['towns', 'minors', 'ports', 'entrances', 'fields']) {
    before[key] = clone(D[key][0]);
    pair(D[key][0]);
  }
  if (!extra) return { size, x, y, before, proposal: 'unmodified native 2700 baseline' };
  D.regions[0].size = size;
  pair(R.fieldBossCenters[0]);
  R.occupationAnchors[0].forEach(pair);
  for (const site of R.sites[0]) {
    site[2] = x(site[2]);
    site[3] = y(site[3]);
  }
  for (const p of R.terrain[0]) point(p); // Water radii intentionally unchanged.
  const barrier = R.barriers[0],
    oldMid = (barrier.bounds[0] + barrier.bounds[1]) / 2;
  barrier.bounds[0] += x(oldMid) - oldMid;
  barrier.bounds[1] += x(oldMid) - oldMid;
  barrier.bounds[3] = size;
  barrier.gaps = barrier.gaps.map(([lo, hi]) => {
    const delta = y((lo + hi) / 2) - (lo + hi) / 2;
    return [lo + delta, hi + delta]; // Retain deck widths.
  });
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
  return {
    size,
    x,
    y,
    before,
    proposal:
      'west-bank-weighted anchor redistribution; native local footprints, enemy counts and rewards retained; NOT a save migration',
  };
}
module.exports = { rng, candidate, clone };
