'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pixiFixedQualityExperimentActive, createResolution, createAutoOptimization } = require('../src/prototype/runtime');

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
assert.match(app, /const adaptiveSkipped =\s*eligibleDraw && frameSkip\.shouldSkip\(now, fps.target, canvasQualityBeforePixi !== null\)/);
assert.match(app, /graphicsController\?\.webglFailed\(failure\)/);
// Controlled A/B policy stress: the identical 62-ms per-draw load would have
// caused automatic scaling with the original path; live Pixi must not invoke
// that path. The Canvas control retains normal adaptation. This does NOT
// simulate real GPU presentation, enemy AI, or real-device frame rate.
function stress(activeMode, pixiActive) {
  const fixed=pixiFixedQualityExperimentActive(activeMode,pixiActive);
  const resolution=createResolution();
  resolution.configure(1.5);
  const optimizer=createAutoOptimization();
  let optimizationOn=false;
  let autoQualityChanges=0;
  for(let i=0;i<=140;i++){
    const now=i*50;
    if(!fixed && resolution.observe(now,62,20,4))autoQualityChanges++;
    if(!fixed){
      const changed=optimizer.observe(now,{
        activePlay:true,emergency:false,preference:'auto',
        optimized:optimizationOn,intervalMs:50,workMs:66,target:20,
      });
      if(changed!==null)optimizationOn=changed;
    }
  }
  return {fixed,...resolution.status(),optimizationOn,autoQualityChanges};
}
const baseline=stress('canvas2d',false);
const pixi=stress('webgl2',true);
assert(baseline.ratio<1.5 && baseline.autoQualityChanges>0,
  'Negative control: old automatic policy changes backing density under high render cost');
assert.equal(baseline.optimizationOn,true,
  'Negative control: old automatic policy enables optimization');
assert.equal(pixi.ratio,1.5,'Live Pixi must retain startup density');
assert.equal(pixi.changes,0,'Live Pixi must not adapt render density');
assert.equal(pixi.autoQualityChanges,0);
assert.equal(pixi.optimizationOn,false,'Live Pixi must not auto-enable graphics reduction');
const recovered = createResolution();
recovered.configure(1.5);
for (let i = 0; i <= 140; i++) recovered.observe(i * 50, 62, 20, 4);
assert(recovered.ratio < 1.5, 'Canvas must retain its adaptive relief');
const canvasRatio = recovered.ratio;
assert.equal(recovered.selectedRatio(1.5), 1.5, 'Pixi preparation uses the selected ceiling');
assert.equal(recovered.ratio, canvasRatio, 'Failed retry can reuse the previous Canvas density');
recovered.select('80');
assert.equal(recovered.selectedRatio(1.5), 0.8, 'Explicit density still wins');
console.log('PASS Pixi fixed-quality and Canvas relief isolation');
