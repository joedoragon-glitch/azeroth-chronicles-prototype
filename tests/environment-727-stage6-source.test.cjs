'use strict';
// #727 Stage6 + live promotion: preserve archival source proof and game registrations.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),m=require('../assets/audio/manifest.json');
const map=require('../tools/audio/environment-727-production-routing.json');
assert.equal(Object.keys(m.assets).length,147);
assert.equal(m.director.environment.rules.length,22);
assert.equal(Object.keys(m.director.places).length,19);
assert.equal(m.director.environment.combatGain,.45);
assert.equal(m.director.environment.bossGain,.25);
assert.equal(m.director.environment.rules.find(x=>x.id==='homes')?.asset,'env-home');
for(const [rule,asset] of Object.entries({...map.existingRuleReplacements,...map.treasurySpecificRules}))
 assert.equal(m.director.environment.rules.find(x=>x.id===rule)?.asset,asset);
execFileSync(process.execPath,['tools/audio/environment-727-stage6-lab.cjs','--preflight'],{cwd:root,stdio:'inherit'});
for(const p of ['tools/audio/environment-727-audition-pack.cjs','tools/audio/environment-727-audition/player.js'])
 execFileSync(process.execPath,['--check',p],{cwd:root,stdio:'inherit'});
const page=fs.readFileSync(path.join(root,'tools/audio/environment-727-audition/index.html'),'utf8');
for(const id of ['scene','original','candidate','amb','score','critical','warning','decision','notes','export'])
 assert(page.includes('id="'+id+'"'),'Local comparative UI component missing '+id);
assert(page.includes('src="data.js"')&&page.includes('src="player.js"'));
console.log('PASS #727 current 147-asset playable registration, 16 original-source SHA frozen; Sound Library and owner comparison source integrity; no release or hearing claim.');
