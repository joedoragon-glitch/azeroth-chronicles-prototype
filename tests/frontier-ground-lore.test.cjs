'use strict';
const assert = require('node:assert/strict');
const R = require('../src/prototype/rules.js');
const V = require('../src/prototype/visuals.js');

assert.equal(typeof V.frontierGroundRecoveryAt, 'function');
assert(R.frontierRecoveryScenes.length >= 40, 'existing lore-ground scene anchors remain');
for (const [name, x, y] of [
  ['old siege verge', 525, 1000],
  ['hamlet approach', 1010, 1410],
  ['western woodland', 770, 2210],
  ['old charland', 1125, 2920],
]) assert(V.frontierGroundRecoveryAt(x, y) > 0.16, name + ' has recovering ground');
const [left, right] = R.channelBanks(3, 1750);
assert.equal(V.frontierGroundRecoveryAt((left + right) / 2, 1750), 0,
  'ravine stays bare and mineral');
assert(V.frontierGroundRecoveryAt(3200, 200) < 0.05,
  'recovery is not a blanket green recoloring');
assert.equal(V.frontierGroundRecoveryAt(NaN, 100), 0);
const ctx = {
  save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {},
  fill() {}, stroke() {}, arc() {}, bezierCurveTo() {}, quadraticCurveTo() {},
};
const painted = [], materials = { paint(_ctx, key) { painted.push(key); return true; } };
V.floor(ctx, { x: 200, y: 200 }, 480, 960, 3, false, '', false, materials);
assert.deepEqual(painted, [], 'Frontier never paints its retired raster');
V.floor(ctx, { x: 200, y: 200 }, 480, 960, 4, false, '', false, materials);
assert.deepEqual(painted, ['terrain:ground:crown'], 'Crown remains unchanged');
console.log('PASS Frontier recovery, ravine, scorched control and raster bypass');
