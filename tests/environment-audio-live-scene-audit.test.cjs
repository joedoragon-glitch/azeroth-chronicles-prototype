'use strict';
// Issue #709: route real generated campaign scenes, not invented catalog fixtures.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine.js');
const Audio=require('../src/prototype/audio.js');
const manifest=require('../assets/audio/manifest.json');
const a=new Audio();
a.enableProduction();
let count=0;
for(const id of Object.keys(manifest.director.places)) {
  const g=new Campaign('normal','paladin',()=>0.73);
  g.enter(id);
  assert.equal(g.zoneId,id,'enter must select real authored zone '+id);
  const before=JSON.stringify(g.s);
  const scene=a.describe(g,{started:true});
  assert.equal(scene.zone,id);
  assert(['outdoors','dungeon','treasury','side-dungeon'].includes(scene.interior));
  const env=a.environmentCue(scene);
  assert(env,'real scene missing audible routing: '+id+
    ' scene='+JSON.stringify(scene));
  assert.equal(manifest.assets[env.asset]?.kind,'ambience');
  assert.equal(JSON.stringify(g.s),before,'audio scene observation may not change save');
  console.log('REAL-SCENE-AUDIO '+id+' region='+scene.region+
    ' interior='+scene.interior+' rule='+env.id+' bed='+env.asset);
  count++;
}
a.dispose();
console.log('PASS #709 actual '+count+' campaign-generated location contexts and environmental rule selection');
