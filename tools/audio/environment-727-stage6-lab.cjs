'use strict';
// #727 Stage 6: ephemeral, isolated A/B integration for frozen source-authored MP3s.
// NEVER commit the materialized manifest, game runtime audio library, cache worker,
// or generated candidate files. Run only in a disposable Actions checkout.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const assert = require('node:assert/strict');

const ROOT = path.resolve(__dirname, '../..');
const RAW = path.resolve(process.env.ENV727_STAGE6_INPUT || 'tools/audio/.stage6-artifacts');
const REPORT = path.resolve(process.env.ENV727_STAGE6_REPORT || 'test-results/environment-727-stage6-trial.json');
const FILES = [
  ['day', 'environment-727-outdoor-studies.json', 'encodedPreviews'],
  ['night-crown', 'environment-727-outdoor-expansion.json', 'encodedPreviewEvidence'],
  ['dungeons', 'environment-727-dungeon-studies.json', 'encodedPreviewEvidence'],
  ['side', 'environment-727-side-interiors.json', 'encodedPreviewEvidence'],
  ['treasuries', 'environment-727-treasury-studies.json', 'encodedPreviewEvidence'],
];
// Keep the original gain/fade from each game's rule; a different gain would
// invalidate an old-vs-new A/B, even if a ledger proposed another route gain.
const CHOICES = Object.freeze({
  'vale': 'study-vale-day-727',
  'vale-night': 'study-vale-night-727',
  'march': 'study-march-day-727',
  'march-night': 'study-march-night-727',
  'crown': 'study-crown-open-727', // A/B also contains an unselected enclosed-wind alternative.
  'crypt': 'studio-crypt-winter-estate-727',
  'archive': 'studio-archive-restoration-727',
  'mine': 'studio-colossus-mine-727',
  'abyss': 'studio-abyss-flight-hall-727',
  'citadel': 'studio-citadel-command-727',
  'side-vale-cellars': 'studio-orchard-cellars-727',
  'side-march-watchhouse': 'studio-drowned-watchhouse-727',
  'side-crown-foundry': 'studio-ruined-foundry-727',
});
const SUPPLY_CHOICES = Object.freeze({
  'supply-march': 'studio-mirejaw-guarded-wet-store-727',
  'supply-crown': 'studio-cindermaw-roost-vault-727',
});
const KEEP = ['supply-vale', 'supply-highlands'];
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const manifestPath = path.join(ROOT, 'assets/audio/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const before = JSON.stringify(manifest);
const ledgers = FILES.map(([stage,file,evidenceKey]) => {
  const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/audio',file), 'utf8'));
  const outputs = ledger[evidenceKey]?.outputs;
  assert(Array.isArray(outputs) && outputs.length === ledger.studies.length, stage + ' frozen output ledger incomplete');
  const recordById = new Map(outputs.map(o => [o.id,o]));
  return {stage,ledger,recordById};
});
const trials = [];
for (const {stage,ledger,recordById} of ledgers) {
  for (const s of ledger.studies) {
    const o = recordById.get(s.id);
    assert(o, 'Missing SHA-frozen output: ' + s.id);
    assert(/^[a-f0-9]{64}$/.test(o.sha256), 'Invalid frozen output SHA: '+s.id);
    assert.equal(o.bytes,1158381, 'Unexpected previously accepted MP3 bytes: '+s.id);
    assert.equal(manifest.assets[s.referenceBed]?.kind,'ambience','Missing preserved original '+s.referenceBed);
    assert(!manifest.assets[s.id], 'Candidate already registered before ephemeral testing: '+s.id);
    const relevantSources = [s.mainSource,s.secondarySource,...(s.events||[]).map(e=>e.source)].filter(Boolean);
    const inputs = relevantSources.map(id => {
      const found = ledger.sources.find(a=>a.id===id);
      assert(found && /^[a-f0-9]{64}$/.test(found.sha256), 'Unpinned original source: '+id);
      assert(/CC0|public domain/i.test(found.license),'Unverified usage rights: '+id);
      return {id,creator:found.creator||found.author||'unknown creator',license:found.license,
        evidence:found.evidence||found.url,sha256:found.sha256};
    });
    trials.push({stage,id:s.id,sceneId:s.sceneId||null,referenceBed:s.referenceBed,
      sha256:o.sha256,bytes:o.bytes,inputs});
  }
}
assert.equal(trials.length,16,'Source-frozen Stage2–5 preview count changed');
assert.equal(new Set(trials.map(t=>t.id)).size,16);
assert.equal(KEEP.length,2);
assert.equal(Object.keys(CHOICES).length+Object.keys(SUPPLY_CHOICES).length,15);
assert(Object.values({...CHOICES,...SUPPLY_CHOICES}).every(id=>trials.some(t=>t.id===id)));
const gameRules=manifest.director.environment.rules;
assert.equal(gameRules.length,18);
assert.equal(Object.keys(manifest.director.places).length,19);
assert.equal(Object.keys(manifest.assets).length,131);
const originalRouting=gameRules.map(r=>({id:r.id,when:r.when,asset:r.asset,gain:r.gain,fade:r.fade}));
assert(gameRules.some(r=>r.id==='homes'&&r.asset==='env-home'&&r.when.interior==='treasury'));
const report = {project:'SIBDLP #727 Stage 6 isolated, NO DEPLOY candidate comparison',
  sourceBase:'PR #743 Stage 5 frozen head 0e2fb018',studies:trials,
  retainedTreasuries:KEEP,unselectedAlternative:['study-crown-enclosed-727'],
  selectedTrials:{...CHOICES,...SUPPLY_CHOICES},originalRouting,
  originalManifestSha256:sha(Buffer.from(before)),studioOnly:true,gameRegistered:false,
  humanHeard:false,merged:false,deployed:false,deviceVerified:false};
if (!process.argv.includes('--materialize')) {
  assert.equal(JSON.stringify(manifest),before,'Preflight must not mutate the source manifest');
  console.log('PASS #727 Stage6 immutable preflight: 16 frozen A/B recordings (15 temporarily routed studies, one Crown alternative), 2 Treasury retains, 18 original environment rules and 19 places; no game registration.');
  process.exit(0);
}
for (const t of trials) {
  const input=path.join(RAW,t.id+'.mp3');
  assert(fs.existsSync(input), 'Frozen Stage2–5 artifact missing: '+input);
  const bytes=fs.readFileSync(input);
  assert.equal(bytes.length,t.bytes,'Candidate source size mismatch '+t.id);
  assert.equal(sha(bytes),t.sha256,'Candidate SHA-256 mismatch '+t.id);
  assert(bytes.toString('ascii',0,3)==='ID3'||(bytes[0]===255&&(bytes[1]&224)===224),'Invalid MP3 signature '+t.id);
  const dest=path.join(ROOT,'assets/audio/ambience',t.id+'.mp3');
  assert(!fs.existsSync(dest),'Refusing to overwrite an original or existing recording '+dest);
  fs.copyFileSync(input,dest,fs.constants.COPYFILE_EXCL);
  const probe=JSON.parse(cp.execFileSync('ffprobe',['-v','error','-show_entries',
    'format=duration:stream=codec_name,channels,sample_rate','-of','json',dest],{encoding:'utf8'}));
  const duration=Number(probe.format.duration);
  assert(duration>=72.15&&duration<74,'Invalid guarded trial duration '+t.id+': '+duration);
  assert(probe.streams[0].codec_name==='mp3' && probe.streams[0].channels===1,'Candidate codec drift '+t.id);
  manifest.assets[t.id]={kind:'ambience',src:'./assets/audio/ambience/'+t.id+'.mp3',
    duration,sha256:t.sha256,loop:{start:0.15,end:72.15},
    credits:{author:[...new Set(t.inputs.map(x=>x.creator))].join('; ')+' (field/foley) + SIBDLP source-led studio arrangement',
      license:'CC0-1.0 / public domain originals; see #727 source ledgers'},
    creationMethod:'imported-recording',title:'Stage 6 UNRELEASED A/B — '+t.id};
  t.audioDecodedAtNativeRateBytes=72*32000*4;
}
const comparisons=[];
for (const rule of gameRules) {
  if (!CHOICES[rule.id]) continue;
  comparisons.push({rule:rule.id,original:rule.asset,trial:CHOICES[rule.id],
    gain:rule.gain,fade:rule.fade});
  rule.asset=CHOICES[rule.id];
}
const home=gameRules.findIndex(r=>r.id==='homes');
assert(home>=0,'Treasury fallback missing');
const homeRule=gameRules[home];
for(const [zone,id] of Object.entries(SUPPLY_CHOICES)){
  gameRules.splice(home,0,{id:'stage6-'+zone,when:{zone},asset:id,
    gain:homeRule.gain,fade:homeRule.fade});
  comparisons.push({rule:'stage6-'+zone,original:'env-home',trial:id,
    gain:homeRule.gain,fade:homeRule.fade});
}
assert.equal(gameRules.length,20);
assert.equal(comparisons.length,15);
assert.equal(gameRules.find(r=>r.id==='homes').asset,'env-home','Unselected homes must stay on the original');
assert.equal(manifest.director.environment.combatGain,0.45);
assert.equal(manifest.director.environment.bossGain,0.25);
assert.equal(manifest.assets['env-home'].sha256,JSON.parse(before).assets['env-home'].sha256);
require('../../scripts/audio-assets.cjs').publishedFiles(ROOT,manifest);
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
report.trialsSelected=comparisons;
report.sourceMaterializedOnlyInDisposableCI=true;
report.ephemeralManifestAssets=Object.keys(manifest.assets).length;
report.ephemeralEnvironmentRules=gameRules.length;
report.originalAssetCount=131;
report.ephemeralDecodedIfAllNewBuffersNativeBytes=16*72*32000*4;
report.ephemeralDecodedIfAllNewBuffers48kBytes=16*72*48000*4;
report.browserCacheBudgetBytes=96*1024*1024;
report.status='UNMERGED ephemeral test overlay; candidates NOT committed to game; artistic selection HOLD';
fs.mkdirSync(path.dirname(REPORT),{recursive:true});
fs.writeFileSync(REPORT,JSON.stringify(report,null,2)+'\n');
console.log('PASS #727 Stage6 ephemeral overlay: 16 exact artifact MP3s SHA/bytes/codec verified, 15 A/B route selections, two original Treasury keeps; 147 temporary assets/20 temporary routes; NEVER commit these generated files.');
