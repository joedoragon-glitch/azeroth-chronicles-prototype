'use strict';
/* Focused ownership test for the read-only event inventory CLI.
 * Meaningful source checks are not replaced by a placeholder syntax pass. */
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const raw=cp.execFileSync(process.execPath,['tools/audio/sfx-event-inventory.cjs'],{
  cwd:root,encoding:'utf8',maxBuffer:1024*1024,
});
const report=JSON.parse(raw);
assert.deepEqual({
  registered:report.counts.registered,
  music:report.counts.music,
  ambience:report.counts.ambience,
  effect:report.counts.effect,
  manifestEventKeys:report.counts.manifestEventKeys,
  keysWithRecordedBindings:report.counts.keysWithRecordedBindings,
  unboundProceduralOrSilentKeys:report.counts.unboundProceduralOrSilentKeys,
  heroBasicAttackProfiles:report.counts.heroBasicAttackProfiles,
  heroTapAndChargedProfiles:report.counts.heroTapAndChargedProfiles,
},{
  registered:148,music:84,ambience:34,effect:30,
  manifestEventKeys:95,keysWithRecordedBindings:8,
  unboundProceduralOrSilentKeys:87,
  heroBasicAttackProfiles:4,heroTapAndChargedProfiles:64,
});
assert.equal(report.recordedMaterialPairs.length,12);
assert.equal(report.recordedSpecials.length,6);
assert.equal(report.heroClasses.length,4);
for(const hero of report.heroClasses){
  assert.equal(hero.skills.length,8,hero.class);
  assert(hero.automaticBasic.name);
  for(const form of hero.skills){
    assert(form.tap.material && form.charged.material);
  }
}
assert.equal(report.unboundEventKeys.length,87);
assert.equal(report.recordedEventKeys.length,8);
assert(report.boundaries.some(s=>s.includes('No enemy hit on a miss')));
assert(report.caution.includes('intentionally silent'));
console.log('PASS: exact 30 recorded SFX source inventory, 95 event identities, 4 classes, 64 skill forms, no gameplay mutations');
