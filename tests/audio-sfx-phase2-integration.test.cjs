'use strict';
// Real PrototypeAudio owners + valid manifest, fake decoded buffers, no physical-device claim.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {audio}=require('./helpers/audio-context.cjs');
const {validateCatalog,runtimeCatalog}=require('../src/prototype/audio-contract.js');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/audio/manifest.json'),'utf8'));
const compiled=require('../src/prototype/audio-library.js');
validateCatalog(manifest);
assert.deepEqual(compiled,runtimeCatalog(manifest),'Runtime sound catalog must match exact recorded manifest');
const ids=['rogue-bell-basic','rogue-bell-emphatic','lifebinder-cold-ring','quest-complete',
  'charmed-wraith-heritage','barracks-complete'];
assert.equal(Object.values(manifest.assets).filter(a=>a.kind==='effect').length,36);
assert.equal(Object.keys(manifest.director.events).length,99);
for(const id of ids){
  const a=manifest.assets['sfx-phase2-'+id];
  assert(a && a.kind==='effect' && a.managedBy==='sfx-phase2-pilot-dsp');
  assert(fs.existsSync(path.join(root,a.src.replace(/^\.\//,''))));
}
// Original Phase 1 recorded release/impact bindings keep their exact order;
// boss-specific routing MUST NOT overwrite generic creature material.
const known=JSON.parse(fs.readFileSync(path.join(root,'tools/audio/sfx-phase1-rollback.json'),'utf8'));
for(const [id,entries] of Object.entries(known.originalEventBindings))
  for(const {event,index} of entries){
    const original=manifest.director.events[event]?.[index];
    assert.equal(original?.asset,id,'Phase 1 material path moved: '+event+'/'+id);
  }
const a=audio();
a.mixScene='world';
a.configureRecordings(manifest);
const heard=[];
const warm=new Set(ids.map(id=>'sfx-phase2-'+id));
a.recordingAssets={
  pending:new Map(), // Match production asset-loader contract; not an empty fake.
  touch(id){return warm.has(id)?{buffer:{}}:null;}
};
a.createRecording=(id,item,assets,options)=>{
  heard.push({id,options});
  return {id};
};
a.enemyAccent=()=>{};
a.enemyMaterial=()=>{};
let fallbackNotes=0;
a.noiseBurst=()=>fallbackNotes++;
a.tone=()=>fallbackNotes++;
a.sweep=()=>fallbackNotes++;
const first={type:'rogueBellBasic',class:'rogue',combo:1};
a.effect(first);
assert.equal(heard.at(-1)?.id,'sfx-phase2-rogue-bell-basic');
assert.equal(fallbackNotes,0,'Warm Rogue sound must not double with procedural shell');
a.ctx.currentTime+=.15;
a.effect({type:'rogueBellBasic',class:'rogue',combo:3});
assert.equal(heard.at(-1)?.id,'sfx-phase2-rogue-bell-emphatic');
a.ctx.currentTime+=.15;
a.effect({type:'rogueBellSkill1',class:'rogue',form:'charged'});
assert.equal(heard.at(-1)?.id,'sfx-phase2-rogue-bell-emphatic');
const heardAt=heard.length;
a.effect({type:'rogueBellBasic',class:'paladin',combo:1});
assert.equal(heard.length,heardAt,'Rogue-only bell must not sound for Paladin');
const cold=audio();
cold.mixScene='world';
cold.playSoundEvent=(key)=>{assert(/^effect\.rogueBell/.test(key));return false};
let coldSynthesis=0;
cold.noiseBurst=()=>coldSynthesis++;
cold.tone=()=>coldSynthesis++;
cold.effect({type:'rogueBellBasic',class:'rogue',combo:1});
assert(coldSynthesis>0,'Unwarmed Rogue source must retain existing procedural output');
// Model the actual boss VFX receipt; only the exact release is specialized.
a.enemySoundDecision=(e)=>({
  mode:'shared',
  // Match enemy-presentation.route: a ground resolve without confirmed
  // contact must NEVER masquerade as a landed enemyImpact.
  key:e.stage==='release'?'enemyRelease':
    e.stage==='impact'&&e.contact===false?'enemyGroundImpact':'enemyImpact',
  material:'spectral',personality:'spectral',action:'spell',accent:null,
  signature:true
});
a.ctx.currentTime+=.3;
const boss={type:'enemyVfx',family:'crypt',skillId:'boss/crypt/4',stage:'release',
 tier:'boss',variant:'normal',dangerous:false};
a.enemyExpression(boss);
assert.equal(heard.at(-1)?.id,'sfx-phase2-lifebinder-cold-ring','Only real Algor Mortis release owns cold ring');
const count=heard.length;
a.ctx.currentTime+=.3;
a.enemyExpression({...boss,stage:'impact',contact:false});
assert.equal(heard.length,count,'An impact without contact cannot play the special release');
// Quest reward genuinely emits TWO observed events: only one should be audible.
a.ctx.currentTime+=.3;
const beforeQuest=heard.length,notesBeforeQuest=fallbackNotes;
a.effect({type:'questComplete',id:'quest-1'});
a.effect({type:'quest',id:'quest-1',automatic:true});
assert.equal(heard.length,beforeQuest+1);
assert.equal(heard.at(-1)?.id,'sfx-phase2-quest-complete');
assert.equal(fallbackNotes,notesBeforeQuest,'Quest bookkeeping must not double-chime after an earned payoff');
a.ctx.currentTime+=.25;
a.effect({type:'quest',id:'other',automatic:true});
assert(fallbackNotes>notesBeforeQuest,'Independent later quest notes must keep existing synthesized feedback');
a.ctx.currentTime+=.4;
const beforeHeritage=heard.length,notesBeforeHeritage=fallbackNotes;
a.effect({type:'spell',actor:'companion',kind:'charmHeritage',species:'wraith'});
assert.equal(heard.length,beforeHeritage+1,'A genuine Charmed Wraith heritage cast must get exactly one voice');
assert.equal(heard.at(-1)?.id,'sfx-phase2-charmed-wraith-heritage');
assert.equal(fallbackNotes,notesBeforeHeritage,'Warm Wraith heritage must replace generic magicCast');
a.effect({type:'charmHeritage',actor:'companion',species:'wraith'});
assert.equal(heard.length,beforeHeritage+1,'Paired visual-only heritage must not add a sound');
a.ctx.currentTime+=.4;
a.effect({type:'construction',id:'barracks-1'});
assert.equal(heard.at(-1)?.id,'sfx-phase2-barracks-complete','Actual Barracks completion sound');
console.log('PASS six actual Phase 2 draft audio routes; 30 Phase 1 bindings; Rogue warm/cold; boss no fake impact; single quest, Charmed heritage and Barracks feedback');
