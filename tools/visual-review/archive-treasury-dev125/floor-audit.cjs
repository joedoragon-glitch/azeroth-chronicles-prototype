'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  C = require('../../../src/prototype/engine');
const g = new C('developer', 'mage', () => 0.9);
g.enter('archive');
const a = C.rules.dungeonArchitecture.archive,
  old = a.walkable.filter((p) => p.id !== 'lower-hall-join');
// Independent exact rectangle-union coverage oracle for a square clearance box.
// Slightly exceed radius 15 so genuine outside-wall contact is not a false seam.
function covered(areas, x, y, r) {
  const lo = x - r,
    hi = x + r,
    top = y - r,
    bottom = y + r;
  const xs = [
    lo,
    hi,
    ...areas.flatMap((p) => p.bounds.slice(0, 2)).filter((v) => v > lo && v < hi),
  ].sort((a, b) => a - b);
  for (let i = 1; i < xs.length; i++) {
    const mid = (xs[i - 1] + xs[i]) / 2;
    const intervals = areas
      .filter((p) => mid > p.bounds[0] && mid < p.bounds[1])
      .map((p) => p.bounds.slice(2))
      .sort((a, b) => a[0] - b[0]);
    let at = top;
    for (const [l, h] of intervals) {
      if (l > at) break;
      at = Math.max(at, h);
    }
    if (at < bottom) return false;
  }
  return true;
}
function partition(x, y) {
  return a.partitions.some(
    (w) =>
      x > w.x1 - 15 &&
      x < w.x2 + 15 &&
      y > w.y1 - 15 &&
      y < w.y2 + 15 &&
      !(w.gaps || []).some(
        ([l, h]) => (w.axis === 'x' ? x : y) > l + 15 && (w.axis === 'x' ? x : y) < h - 15,
      ),
  );
}
let priorFalseBlocks = 0,
  remainingFalseBlocks = 0,
  checked = 0;
for (let x = 100; x < 1380; x += 5)
  for (let y = 120; y < 1380; y += 5) {
    if (!covered(a.walkable, x, y, 15.01) || partition(x, y)) continue;
    checked++;
    if (
      !old.some(
        ({ bounds: [x1, x2, y1, y2] }) => x > x1 + 15 && x < x2 - 15 && y > y1 + 15 && y < y2 - 15,
      )
    )
      priorFalseBlocks++;
    if (g.blocked(x, y)) remainingFalseBlocks++;
  }
// Check union identity exactly on the arrangement's cells, not a visual guess.
const xs = [...new Set(a.walkable.flatMap((p) => p.bounds.slice(0, 2)))].sort((a, b) => a - b),
  ys = [...new Set(a.walkable.flatMap((p) => p.bounds.slice(2)))].sort((a, b) => a - b);
for (let i = 1; i < xs.length; i++)
  for (let j = 1; j < ys.length; j++) {
    const x = (xs[i - 1] + xs[i]) / 2,
      y = (ys[j - 1] + ys[j]) / 2;
    const inside = (areas) =>
      areas.some(({ bounds: [x1, x2, y1, y2] }) => x > x1 && x < x2 && y > y1 && y < y2);
    assert.equal(inside(old), inside(a.walkable), 'exterior floor footprint must remain identical');
  }
assert.equal(priorFalseBlocks, 280);
assert.equal(remainingFalseBlocks, 0);
const result = {
  step: 5,
  clearance: 15.01,
  checked,
  priorFalseBlocks,
  remainingFalseBlocks,
  footprintUnchanged: true,
  limit:
    'Static Archive floor samples with true partition clearance excluded; not an every-frame campaign simulation',
};
fs.writeFileSync(__dirname + '/floor-audit.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
