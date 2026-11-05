'use strict';
// Temporary source-grounded millbank scene census for the owner's occlusion report.
// Uses the actual campaign scene, without altering state or launching a broad suite.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const { rng } = require('../tools/greenwood-layout/fixtures.cjs');
const distance = (a, b) => Math.hypot(a.x-b.x, a.y-b.y);
const anchor = { x: 1040, y: 1500 };
const relevant = (p) => ({
  id: p.id, kind: p.structure || p.greenwoodNature || p.kind || 'unknown',
  x: Math.round(p.x), y: Math.round(p.y),
  d: Math.round(distance(p, anchor)), owner: !!(p.playerOwned || p.owned || p.custom),
});
for (const seed of [0x47564101,0x47564102,0x47564103,0x47564104]) {
  const g = new C('normal','paladin',rng(seed));
  const z = g.zone();
  const nearby = z.props.filter(p => distance(p,anchor)<490).map(relevant).sort((a,b)=>a.d-b.d);
  const trees = nearby.filter(p=>p.kind==='tree');
  const likely = nearby.filter(p=>/fallen-log|sheep|poultry|cart|supply|barrel|mill|reeds|bush/.test(p.kind));
  console.log('MILL_OCCLUSION_CENSUS '+JSON.stringify({seed,nearbyCount:nearby.length,trees,likely,other:nearby.filter(p=>!trees.includes(p)&&!likely.includes(p)).slice(0,35)}));
  assert(z.props.some(p=>p.id==='greenwood-working-mill'));
  assert.equal(z.nodes.reduce((n,p)=>n+p.amount,0),640);
}
console.log('PASS four seeded Greenwood live-prop censuses; read-only evidence, no new placement');
