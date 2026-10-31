// Phase 5 source, legacy hook and frozen-Crown source regressions only.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const s=read('tools/audio/phase5-scores.json'),old=read('tools/audio/score-book.json');
const catalog=read('assets/audio/manifest.json'),freeze=read('tools/audio/phase2-crown-freeze.json').frozen;
const names=['thorn','crypt','mire','archive','ridge','mine','warlord','abyss'];
assert.equal(s.schemaVersion,1);assert.equal(s.families.length,8);assert.equal(s.cues.length,16);
assert.deepEqual(s.cues.map(x=>x.id),names.flatMap(x=>['boss-'+x,'boss-'+x+'-true']));
assert.equal(Object.keys(freeze).length,18);
assert.equal(Object.values(catalog.assets).filter(x=>x.kind==='music').length,83);
for(const [i,f] of s.families.entries()){
 assert.equal(f.key,names[i]);const original=old.cues[f.id];
 assert.equal(f.bpm,original.bpm);assert.equal(f.mode,original.mode);assert.equal(f.root,original.root);
 assert.deepEqual(f.originalHook,original.melody);
 const historicalChords=original.flavor%3===1?[0,3,5,4]:[0,5,3,4];
 assert.deepEqual(f.harmony.slice(0,4),historicalChords,
   'Opening motif pitch alone does not preserve original chord context');
 assert.deepEqual(f.openingHarmonyHeritage,historicalChords);
 assert.equal(f.harmony.at(-1),0);
 assert.equal(f.leadBars.at(-1).at(-1)[1],0,'final base cadence lacks return to tonic');
 for(const k of ['harmony','energy','leadBars','trueBars'])assert.equal(f[k].length,f.bars);
 assert.notDeepEqual(f.leadBars,f.trueBars);
 if(f.leadRegisterByBar){assert.equal(f.leadRegisterByBar.length,f.bars);assert.deepEqual(f.leadRegisterByBar.slice(0,4),[f.register,f.register,f.register,f.register]);}
 if(f.key==='crypt') {assert.equal(f.trueRegister,0);assert.equal(f.pulseRegister,-12);}
 if(f.key==='ridge') {assert.equal(f.pulseRegister,-12);assert.ok(f.leadRegisterByBar.slice(4).includes(0));assert.equal(f.trueRegister,0);}
 if(f.key==='mire') assert.equal(f.trueRegister,36,'Mire TRUE chime requires a coherent scored register');
 if(f.key==='archive') assert.equal(f.trueRegister,24,'Keeper TRUE chime requires a coherent scored register');
 if(f.key==='abyss') {assert.equal(f.companionRegister,0);assert.ok(f.leadRegisterByBar.slice(4).includes(0));}
 assert.ok(f.identity.length>=65 && f.truePsychology.length>=80);
 for(let t=0;t<16;t++){
  const match=f.leadBars[Math.floor(t/4)].find(x=>x[0]===t%4);
  if(original.melody[t]==null) assert.equal(match,undefined);
  else {assert.ok(match);assert.equal(match[1],original.melody[t]);assert.equal(match[2],original.melody[(t+1)%16]==null?1.55:.84);}
 }
 if(f.key==='crypt'){assert.equal(f.title,'Keeper of the Winter Works');assert.equal(f.register,0);}
 else {assert.equal(f.motifDisposition,'retained');assert.equal(f.register,12);}
}
for(const [id,record] of Object.entries(freeze)){
 const a=catalog.assets[id];assert.ok(a&&a.src);
 const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,a.src))).digest('hex');
 assert.equal(hash,record.sha256,'protected Crown recording differs: '+id);
}
const run=cp.spawnSync('python3',['tools/audio/phase5-compose.py','--check'],{cwd:root,encoding:'utf8',timeout:120000});
assert.equal(run.status,0,run.stdout+'\n'+run.stderr);
console.log('PASS Phase 5 original motifs, 16 exact IDs, 18 physical Crown hashes and Python source');
