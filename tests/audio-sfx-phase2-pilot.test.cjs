'use strict';
// Source-and-signal checks only: no web browser or human-ear acceptance claim.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const {CUES,renderWav}=require('../tools/audio/sfx-phase2-pilot.cjs');
const {identify,byId}=require('../tools/audio/sfx-phase2-pilot-routes.cjs');
const book=JSON.parse(fs.readFileSync(path.join(root,'tools/audio/sfx-phase2-pilot.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/audio/manifest.json'),'utf8'));
assert.equal(book.schemaVersion,1);
assert.equal(book.rate,48000);
assert.equal(CUES.length,8);
assert.deepEqual(CUES,book.cues);
assert.equal(new Set(CUES.map(c=>c.id)).size,8);
assert.deepEqual([...byId].sort(),CUES.map(c=>c.id).sort());
assert.equal(Object.values(manifest.assets).filter(a=>a.kind==='effect').length,30,
  'Phase 2 previews must not silently register new production effects');
const signalHashes=new Set(),rmsValues=new Set();
for(const cue of CUES){
  const {bytes,metrics}=renderWav(cue);
  const filepath=path.join(root,'tools/audio/sfx-phase2-previews',cue.id+'.wav');
  const existing=fs.readFileSync(filepath);
  assert(existing.equals(Buffer.from(bytes)),cue.id+': not bit-for-bit reproducible');
  assert(bytes instanceof Uint8Array,'PCM render must return bytes, not text');
  assert.equal(Buffer.from(bytes).toString('ascii',0,4),'RIFF');
  assert.equal(Buffer.from(bytes).toString('ascii',8,12),'WAVE');
  assert.equal(Buffer.from(bytes).readUInt16LE(20),1);
  assert.equal(Buffer.from(bytes).readUInt16LE(22),1);
  assert.equal(Buffer.from(bytes).readUInt32LE(24),48000);
  assert.equal(Buffer.from(bytes).readUInt16LE(34),16);
  assert.equal(Buffer.from(bytes).readUInt32LE(40),bytes.length-44);
  assert(metrics.peak>.06&&metrics.peak<.65,cue.id+' peak '+metrics.peak);
  assert(metrics.rms>.008&&metrics.rms<.15,cue.id+' RMS '+metrics.rms);
  assert(metrics.tailPeak<.03,cue.id+' tail '+metrics.tailPeak);
  assert(metrics.tailRms<.008,cue.id+' tail RMS '+metrics.tailRms);
  assert(cue.seconds<.5&&cue.seconds>.3,cue.id+' long or truncated transient');
  const digest=crypto.createHash('sha256').update(bytes).digest('hex');
  signalHashes.add(digest);
  rmsValues.add(metrics.rms.toFixed(5));
  assert(!Object.values(manifest.assets).some(a=>a.src?.includes('sfx-phase2-previews/')),
    'Unaccepted preview leaked into player asset manifest');
}
assert.equal(signalHashes.size,8,'Independent identities must not repeat identical WAVs');
assert(rmsValues.size>=7,'Pilot acoustic dynamics must not be a cloned single envelope');
const accepted=[
  [{type:'rogueBellBasic',class:'rogue',combo:1},'rogue-bell-basic'],
  [{type:'rogueBellBasic',class:'rogue',combo:3},'rogue-bell-emphatic'],
  [{type:'rogueBellSkill1',class:'rogue',form:'tap'},'rogue-bell-basic'],
  [{type:'rogueBellSkill1',class:'rogue',form:'charged'},'rogue-bell-emphatic'],
  [{type:'rogueBellPerformance',class:'rogue',slot:8,form:'charged'},'rogue-bell-emphatic'],
  [{type:'heroSkillCast',class:'mage',slot:1,automaticBasic:true,charged:false},'mage-orb-release'],
  [{type:'petSkill',petFamily:'thorn',slot:2,stage:'release',hits:0},'thorn-tripwire'],
  [{type:'spell',actor:'companion',kind:'charmHeritage',species:'wraith'},'charmed-wraith-heritage'],
  [{type:'enemyVfx',family:'crypt',skillId:'boss/crypt/4',stage:'release'},'lifebinder-cold-ring'],
  [{type:'questComplete',id:'quest-1'},'quest-complete'],
  [{type:'construction',id:'barracks-1'},'barracks-complete']
];
for(const [event,id] of accepted)assert.equal(identify(event)?.id,id,JSON.stringify(event));
const rejected=[
  null,{}, {type:'quest'}, {type:'constructionProgress'}, {type:'barracksUpgrade'},
  {type:'rogueBellBasic',class:'paladin'}, {type:'heroSkillCast',class:'mage',slot:1,automaticBasic:false},
  {type:'heroSkillCast',class:'mage',slot:1,automaticBasic:true,charged:true},
  {type:'petSkill',petFamily:'thorn',slot:2,stage:'impact',hits:2},
  {type:'petSkill',petFamily:'crypt',slot:2,stage:'release'},
  {type:'spell',actor:'companion',kind:'charmHeritage',species:'stalker'},
  {type:'charmHeritage',species:'wraith',stage:'release'},
  {type:'enemyVfx',family:'crypt',skillId:'boss/crypt/4',stage:'windup'},
  {type:'enemyVfx',family:'crypt',skillId:'boss/crypt/4',stage:'impact',contact:false},
  {type:'enemyVfx',family:'crypt',skillId:'boss/crypt/5',stage:'release'}
];
for(const event of rejected)assert.equal(identify(event),null,'false success/contact '+JSON.stringify(event));
const source=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const evidence=[
  ['src/prototype/hero-combat.js',["this.event('rogueBellBasic'","this.event('rogueBellSkill1'","this.event('rogueBellPerformance'","this.event('heroSkillCast'"]],
  ['src/prototype/party-pets.js',["this.event('petSkill'","this.petSkillEvent(u, target, slot, 0, 'release')"]],
  ['src/prototype/party.js',["this.event('spell', { actor: 'companion', kind: 'charmHeritage'"]],
  ['src/prototype/enemy-vfx.js',["'boss/' + family + '/' + index"]],
  ['src/prototype/data.js',["Algor Mortis: a warned expanding cold wave"]],
  ['src/prototype/rewards.js',["this.event('questComplete'","this.event('quest'"]],
  ['src/prototype/party.js',["this.event('construction'"]],
  ['src/prototype/audio-effects.js',["'petSkill'","'charmHeritage'"]]
];
for(const [p,needles] of evidence)for(const needle of needles)
  assert(source(p).includes(needle),'Source receipt no longer supports '+p+': '+needle);
assert(!source('scripts/site-assets.cjs').includes("sfx-phase2-previews"),
  'Unaccepted preview bank must not be packaged by the site asset allowlist');
console.log('PASS SFX Phase 2 isolated pilot: eight original deterministic WAVs, headers/peaks/tails, distinct hashes, exact source-affinity routes, blocked outcomes, no live registration');
