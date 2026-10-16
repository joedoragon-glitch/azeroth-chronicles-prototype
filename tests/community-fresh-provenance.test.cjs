'use strict';
// Synthetic source receipts exercise the admission gate; these are not gameplay observations.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),git=ref=>cp.execFileSync('git',['rev-parse',ref],{cwd:root,encoding:'utf8'}).trim();
process.env.COMMUNITY_OBSERVED_COMMIT=git('HEAD');process.env.COMMUNITY_OBSERVED_RUN='1';
const {verifyInputs}=require('../scripts/community-balance-provenance.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(path.join(root,p));
const seed='docs/evidence/pr313-validation-continuation-20261016/baseline308-complete-cache.json.gz';
const baseline=JSON.parse(zlib.gunzipSync(read(seed)));
const sources=Object.fromEntries(fs.readdirSync(path.join(root,'src/prototype')).filter(n=>n.endsWith('.js')).map(n=>['src/prototype/'+n,hash(read('src/prototype/'+n))]));
const meta={candidateCommit:git('HEAD'),candidateTree:git('HEAD^{tree}'),harnessSha256:hash(read('scripts/community-companion-balance.cjs')),observerSha256:hash(read('scripts/community-companion-observe.cjs')),seedSha256:hash(read(seed)),seededBaselines:3072,sources:{candidate:sources,baseline:baseline.sources}};
assert(verifyInputs(meta).loadedEngineOwners.includes('src/prototype/engine.js'));
for(const mutate of [m=>m.candidateCommit='f'.repeat(40),m=>m.sources.candidate['src/prototype/engine.js']='0'.repeat(64),m=>m.sources.candidate['src/prototype/renderer.js']='0'.repeat(64),m=>m.seedSha256='0'.repeat(64),m=>m.observerSha256='0'.repeat(64),m=>m.seededBaselines=2336,m=>delete m.sources.candidate['src/prototype/combat-visuals.js'],m=>m.sources.baseline['src/prototype/engine.js']='0'.repeat(64)]){
  const altered=structuredClone(meta);mutate(altered);assert.throws(()=>verifyInputs(altered));
}
assert.equal(baseline.rows.length,3072);assert.equal(baseline.rows.filter(r=>r.baseline.observationFailed).length,1,'original baseline failure retained');
console.log('PASS synthetic fresh source admission and rejection of altered engine/render/observer/seed/baseline receipts; no gameplay outcome claimed');
