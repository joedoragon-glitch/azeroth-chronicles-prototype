'use strict';
// #727 Stage 6 nonmutating source gate before temporary CI overlay. No audio registration.
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const original=require('../assets/audio/manifest.json');
assert.equal(Object.keys(original.assets).length,131);
assert.equal(original.director.environment.rules.length,18);
assert.equal(Object.keys(original.director.places).length,19);
const homes=original.director.environment.rules.find(x=>x.id==='homes');
assert.equal(homes.when.interior,'treasury');
assert.equal(homes.asset,'env-home');
assert.equal(original.director.environment.combatGain,.45);
assert.equal(original.director.environment.bossGain,.25);
execFileSync(process.execPath,['tools/audio/environment-727-stage6-lab.cjs','--preflight'],{cwd:root,stdio:'inherit'});
console.log('PASS #727 Stage6 source preflight: all archived studio candidates remain outside the playable original catalog.');
