'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pixiFixedQualityExperimentActive } = require('../src/prototype/runtime');

// Only a live Pixi world disables automatic quality adjustments. The backup
// renderer and incomplete GPU startup retain their normal adaptation policy.
assert.equal(pixiFixedQualityExperimentActive('webgl2', true), true);
assert.equal(pixiFixedQualityExperimentActive('webgl2', false), false);
assert.equal(pixiFixedQualityExperimentActive('canvas2d', true), false);
assert.equal(pixiFixedQualityExperimentActive('canvas2d', false), false);
assert.equal(pixiFixedQualityExperimentActive(undefined, undefined), false);

// Guard the three critical shell call-sites; emergency frame skipping itself
// remains covered independently by frame-skip.test.cjs.
const app = fs.readFileSync(path.resolve(__dirname, '../src/prototype/app.js'), 'utf8');
assert.match(app, /if \(!optimizationMode && !pixiFixedQualityPilotActive\(\)\)/);
assert.match(app, /!pixiFixedQualityPilotActive\(\) &&\s*renderResolution\.observe\(/);
assert.match(app, /const optimizationDecision = pixiFixedQualityPilotActive\(\)\s*\? null\s*: autoOptimization\.observe\(/);
assert.match(app, /graphicsController\?\.status\(\)\.mode,[\s\S]*?pixiGame\.status\(\)\.active/);
assert.match(app, /const adaptiveSkipped = eligibleDraw && frameSkip\.shouldSkip\(/);
assert.match(app, /graphicsController\?\.webglFailed\(failure\)/);
console.log('Pixi fixed-quality draft pilot policy and safety boundaries: OK');
