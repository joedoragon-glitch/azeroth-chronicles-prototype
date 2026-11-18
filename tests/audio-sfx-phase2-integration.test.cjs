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
  'charmed-wraith-heritage','barracks-complete','mage-orb-release','thorn-tripwire'];
assert.equal(Object.values(manifest.assets).filter(a=>a.kind==='effect').length,38);
assert.equal(Object.keys(manifest.director.events).length,101);
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
// A physical Mage automatic orb emits heroProjectileFlight only once after
// projectile creation. Skill-1 Tap has beam style and must not alias this cue.
a.ctx.currentTime+=.41;
const beforeMage=heard.length,mageSynth=fallbackNotes;
const mageOrb={type:'heroProjectileFlight',actor:'hero',class:'mage',slot:1,
  style:'magic',charged:false};
a.effect(mageOrb);
assert.equal(heard.length,beforeMage+1,'Mage physical orb departure owns one recorded cue');
assert.equal(heard.at(-1)?.id,'sfx-phase2-mage-orb-release');
assert.equal(fallbackNotes,mageSynth,'Warm Mage orb must not double with synthesized foley');
a.ctx.currentTime+=.4;
const beforeManual=heard.length;
a.effect({...mageOrb,style:'beam'});
assert.equal(heard.length,beforeManual,'Manual Skill-1 beam cannot claim auto orb recording');
a.ctx.currentTime+=.4;
a.effect({type:'heroSkillCast',actor:'hero',class:'mage',slot:1,
  automaticBasic:true,charged:false});
assert.equal(heard.length,beforeManual,'Early cast intent is not an orb release');
a.ctx.currentTime+=.4;
a.effect({...mageOrb,charged:true});
assert.equal(heard.length,beforeManual,'Charged beam does not play the uncharged orb identity');
const mageCold=audio();
mageCold.mixScene='world';
mageCold.playSoundEvent=()=>false;
let mageFallback=0;
mageCold.noiseBurst=()=>mageFallback++;
mageCold.tone=()=>mageFallback++;
mageCold.sweep=()=>mageFallback++;
mageCold.effect(mageOrb);
assert(mageFallback>0,'Unwarmed physical Mage flight retains procedural fallback');

// Actual Thornpup Skill-2 already has a single post-contact spell.
// The companion's visual-only petSkill release and impact must stay silent.
a.ctx.currentTime+=.4;
const beforeThorn=heard.length,thornSynth=fallbackNotes;
const thorn={type:'spell',actor:'companion',role:'pet',special:'pet-skill',
  petFamily:'thorn',slot:2,hits:2,skill:'Tripwire'};
a.effect(thorn);
assert.equal(heard.length,beforeThorn+1,'Genuinely landed Tripwire gets exactly one sound');
assert.equal(heard.at(-1)?.id,'sfx-phase2-thorn-tripwire');
assert.equal(fallbackNotes,thornSynth,'Warm Tripwire replaces generic magicCast foley');
a.effect({type:'petSkill',petFamily:'thorn',slot:2,stage:'release',hits:0});
a.effect({type:'petSkill',petFamily:'thorn',slot:2,stage:'impact',hits:2});
assert.equal(heard.length,beforeThorn+1,'Visual pet skill must not duplicate audio');
a.ctx.currentTime+=.4;
a.effect({...thorn,hits:0});
a.ctx.currentTime+=.4;
a.effect({...thorn,slot:1});
assert.equal(heard.filter(x=>x.id==='sfx-phase2-thorn-tripwire').length,1,
  'A blocked or wrong-slot pet spell cannot use recorded Tripwire');
const thornCold=audio();
thornCold.mixScene='world';
thornCold.playSoundEvent=()=>false;
let thornFallback=0;
thornCold.noiseBurst=()=>thornFallback++;
thornCold.tone=()=>thornFallback++;
thornCold.sweep=()=>thornFallback++;
thornCold.effect(thorn);
assert(thornFallback>0,'Cold Tripwire must preserve previous pet magicCast sound');
console.log('PASS eight draft audio routes and all 30 Phase 1 originals: Mage physical flight, landed Tripwire, cold fallback, no ghost impacts or doubled spell voices');
