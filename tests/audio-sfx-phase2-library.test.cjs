'use strict';
// Source-level Game Sound Library contract: no claim of in-game listening or device acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'tools/audio/index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'tools/audio/audition.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/audio/manifest.json'),'utf8'));
const phase2=Object.entries(manifest.assets).filter(([id,a])=>a.managedBy==='sfx-phase2-pilot-dsp');
const effectCount=Object.values(manifest.assets).filter(a=>a.kind==='effect').length;
assert.equal(phase2.length,8,'Pilot library must not accidentally claim additional sounds');
assert.equal(effectCount,38,'Thirty protected originals plus eight draft technical candidates');
const original=Object.values(manifest.assets).filter(a=>a.managedBy==='sfx-phase1-original-hybrid');
assert.equal(original.length,30,'Existing 30 source masters remain represented');
assert(html.includes('id="effect-language"'));
assert(html.includes('<option value="en">English</option>'));
assert(html.includes('<option value="es">Español</option>'));
assert(html.includes('id="effect-identity"'));
const expected={
 'sfx-phase2-rogue-bell-basic':'heroes',
 'sfx-phase2-rogue-bell-emphatic':'heroes',
 'sfx-phase2-mage-orb-release':'heroes',
 'sfx-phase2-thorn-tripwire':'pets',
 'sfx-phase2-charmed-wraith-heritage':'charmed',
 'sfx-phase2-lifebinder-cold-ring':'bosses',
 'sfx-phase2-quest-complete':'progression',
 'sfx-phase2-barracks-complete':'progression'
};
for(const [id,group] of Object.entries(expected)){
 assert(manifest.assets[id]?.kind==='effect',id+': missing recorded WAV');
 const re=new RegExp("'"+id+"': \\['"+group+"','([^']+)'\\]");
 const label=js.match(re)?.[1];
 assert(label && /[^\x00-\x7f]/.test(label),id+': missing actual Spanish cue name');
 assert(manifest.assets[id].sha256?.length===64,id+': missing physical SHA');
}
for(const value of ['heroes','companions','pets','charmed','bosses','captains','progression'])
 assert(html.includes('value="'+value+'"'),value+': missing identity filter');
assert(js.includes('effectIdentity(id, entry) !== identity'),'filter must apply to each real asset');
assert(js.includes('visibleRecordings.length : visibleLimit'),
 'Effect grid must not paginate away draft originals');
assert(js.includes("count.effect + ' recorded effects'"),'Library count must derive from manifest');
assert(js.includes('Phase 2 · unmerged candidate'),'Originals must not appear to be released');
assert(html.includes('unmerged technical candidates'));
assert(!html.includes('30 new effects')&&!html.includes('All 30 effects'),
 'Old fixed-count labels would misrepresent post-pilot catalog');
assert(!js.includes('localStorage.')&&!js.includes('indexedDB.'),
 'Read-only sound browser must not access persistent campaign state');
console.log('PASS eight SFX Phase 2 source-owned Sound Library names EN/ES, identity filters, original 30 preservation, draft labels and no stale counts');
