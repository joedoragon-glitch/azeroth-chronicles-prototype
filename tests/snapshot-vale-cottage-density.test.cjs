'use strict';
const assert = require('node:assert/strict');
const approved = require('../tools/sprites/approved.json');
const manifest = require('../assets/sprites/manifest.json');
const visuals = require('../src/prototype/visuals.js');
const key = 'prop:vale-cottage:vale';
const item = approved.assets[key];
const entry = manifest.sprites[key];
const legacy = approved.history[key]['3c35ef58fe76061f5fb4f017be965947afba71885b6897781d59b7253237cf15'];
assert(legacy && legacy.output.width === 192 && legacy.output.height === 192,
  'previous compressed sprite must remain as immutable rollback');
assert.equal(legacy.output.hash,
  'd94098c0186d31ce1b16815a3092957b5e428e35117729a9f2ffd9d8ec79ff3a');
assert.equal(item.source.hash,
  '6950d9ba5e8dd37162ca2a4fe4cc25e7282a621b149298b287361955404f298a');
assert.deepEqual([item.source.width, item.source.height], [1254, 1254]);
assert(item.processing.normalization.input === 'untouched-original');
assert(item.processing.normalization.intermediatePixelsUsed === false);
assert(item.processing.normalization.fullCanvasSize === 1254);
assert.equal(item.output.hash, entry.hash);
assert.deepEqual([entry.width, entry.height], [816, 816]);
assert.deepEqual([entry.displayWidth, entry.displayHeight], [192, 192]);
assert.deepEqual([entry.anchorX, entry.anchorY, entry.labelHeight], [0.5, 0.75, 64]);
const cottage = { id:'settlement-major-0',renderKind:'prop',structure:'vale-cottage' };
assert.equal(visuals.featureScale(cottage), 1.4,
  'cottage world footprint is 40 percent larger, not a camera change');
assert.equal(visuals.assetSafeScale(cottage, legacy.output), 1,
  'old 100 percent raster is deliberately not blown up');
assert.equal(visuals.assetSafeScale(cottage, entry), 1.4,
  'retained high-resolution original unlocks 150 percent camera proportion');
assert.equal(item.review.userAppearanceAcceptance, false,
  'engineering source review is not director visual acceptance');
console.log('PASS Greenwood cottage original/150% raster lineage, 1.4x proportion, and rollback');
