'use strict';
/*
 * Art #321: executable integration check against competing unmerged PR heads.
 * No GitHub merge, push, branch update, active checkout mutation or deployment.
 * git merge-tree makes a tree object; an ephemeral local commit/worktree is
 * created solely to execute selected Node tests and then deleted.
 * Separate from both the canonical game suite and the PR's screenshot capture.
 */
const cp = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const output = path.resolve(process.argv[2] ||
  path.join(os.tmpdir(),'art321-cross-draft-regressions.json'));
const PRS = [
  {pr:471,scope:'Effects renderer / recorded cue & warning compatibility',
    tests:['tests/art321-pixi-loot.test.cjs','tests/pixi-fidelity.test.cjs',
      'tests/occlusion.test.cjs','tests/effect-diagnostics-stage4.test.cjs',
      'tests/effect-quality-protected-cues.test.cjs']},
  {pr:464,scope:'Hero/Ranger/Archer/pet projectile visuals',
    tests:['tests/art321-pixi-loot.test.cjs','tests/pixi-fidelity.test.cjs',
      'tests/hero-postcast-visuals.test.cjs','tests/pet-postcast-visuals.test.cjs']},
  {pr:440,scope:'Dormant critical-action combat integration',
    tests:['tests/art321-pixi-loot.test.cjs','tests/pixi-fidelity.test.cjs',
      'tests/critical-executions.test.cjs','tests/critical-party-native.test.cjs']},
  {pr:458,scope:'TRUE-form regional boss movement and engine safety',
    tests:['tests/art321-pixi-loot.test.cjs','tests/pixi-fidelity.test.cjs',
      'tests/true-field-boss-hunt.test.cjs']},
  {pr:470,scope:'Audio recovery, startup gesture and app integration',
    tests:['tests/art321-pixi-loot.test.cjs','tests/pixi-fidelity.test.cjs',
      'tests/audio-stage2-recovery.test.cjs']},
  {pr:472,scope:'Combat action-to-sound routing and roster continuity',
    tests:['tests/art321-pixi-loot.test.cjs','tests/pixi-fidelity.test.cjs',
      'tests/audio-stage3-action-audit.test.cjs','tests/roster-skill-update.test.cjs']},
  {pr:445,scope:'Artwork scope/pipeline repair and original accepted art registry',
    tests:['tests/art321-pixi-loot.test.cjs','tests/art-catalog-321-source-integrity.test.cjs',
      'tests/sprite-scope.test.cjs']},
  {pr:465,scope:'Documentation and release governance entry points',
    tests:['tests/art321-pixi-loot.test.cjs','tests/architecture.test.cjs',
      'tests/ci-scope.test.cjs']},
  {pr:468,scope:'Read-only combat-audio source coverage observations',
    tests:['tests/art321-pixi-loot.test.cjs',
      'tests/audio-stage1-coverage.test.cjs']},
];
function git(args, allowFailure=false) {
  const v=cp.spawnSync('git',args,{cwd:root,encoding:'utf8',
    maxBuffer:4*1024*1024});
  if(v.error)throw v.error;
  if(v.status!==0&&!allowFailure)
    throw Error('git '+args.join(' ')+' failed: '+(v.stderr||v.stdout).slice(0,1400));
  return v;
}
function fetchPR(n){
  const ref='refs/art321-integrate/'+n;
  git(['fetch','--quiet','--no-tags','--depth=320','origin',
    '+refs/pull/'+n+'/head:'+ref]);
  return git(['rev-parse',ref]).stdout.trim();
}
function mergeTree(ours,theirs){
  const mb=git(['merge-base',ours,theirs],true);
  if(mb.status!==0)return {status:'INDETERMINATE',message:'Ancestry unavailable'};
  const v=git(['merge-tree','--write-tree','--messages',ours,theirs],true);
  if(v.status!==0)return {status:v.status===1?'CONFLICT':'INDETERMINATE',
    mergeBase:mb.stdout.trim(),details:(v.stdout+'\n'+v.stderr).slice(0,2400)};
  return {status:'CLEAN',mergeBase:mb.stdout.trim(),
    tree:v.stdout.trim().split('\n')[0]};
}
const runNode=(cwd,file,limit=30000)=>{
  if(!fs.existsSync(path.join(cwd,file)))
    return {file,status:'NOT_PRESENT',details:'File unavailable in tested combination'};
  const p=cp.spawnSync(process.execPath,[file],{cwd,encoding:'utf8',
    timeout:limit,maxBuffer:1_000_000,env:{...process.env,CI:'true'}});
  return {file,status:p.error?'ERROR':p.status===0?'PASS':'FAIL',
    exitCode:p.status,detail:(p.stderr||p.stdout||String(p.error)).slice(-1800)};
};
function runTemporaryTree(merge,ours,theirs,tests){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'art321-compat-'));
  let attached=false;
  try{
    const commit=cp.spawnSync('git',['commit-tree',merge.tree,'-p',ours,'-p',theirs],
      {cwd:root,encoding:'utf8',env:{...process.env,GIT_AUTHOR_NAME:'Transient CI',
      GIT_AUTHOR_EMAIL:'ci@invalid.example',GIT_COMMITTER_NAME:'Transient CI',
      GIT_COMMITTER_EMAIL:'ci@invalid.example'},
      input:'temporary compatibility regression only\n'});
    if(commit.status!==0)throw Error('Could not create ephemeral test object: '+commit.stderr);
    const sha=commit.stdout.trim();
    git(['worktree','add','--quiet','--detach',dir,sha]);
    attached=true;
    // The same locked dependencies from the runner; no npm install or repo edits.
    fs.symlinkSync(path.join(root,'node_modules'),path.join(dir,'node_modules'),'dir');
    const checks=[
      {file:'src/prototype/renderer.js',syntax:true},
      {file:'src/prototype/pixi-experimental.js',syntax:true}
    ].map(({file})=>{
      const p=cp.spawnSync(process.execPath,['--check',file],
        {cwd:dir,encoding:'utf8',timeout:10000});
      return {file:'syntax:'+file,status:p.status===0?'PASS':'FAIL',
        detail:(p.stderr||'').slice(-700)};
    });
    if(checks.some(x=>x.status==='FAIL'))return {tests:checks,passed:false};
    for(const file of tests)checks.push(runNode(dir,file));
    return {tests:checks,passed:checks.every(x=>x.status==='PASS')};
  }finally{
    // Never leave a test commit checked out or modify a source branch.
    if(attached)git(['worktree','remove','--force',dir],true);
    fs.rmSync(dir,{recursive:true,force:true});
  }
}
function main(){
  const ours=fetchPR(469);
  const results=[];
  for(const item of PRS){
    let theirs;
    try {
      theirs=fetchPR(item.pr);
      const combo=mergeTree(ours,theirs);
      const regression=combo.status==='CLEAN'
        ?runTemporaryTree(combo,ours,theirs,item.tests):null;
      results.push({pr:item.pr,scope:item.scope,ours,theirs,
        ...combo,regression});
    }catch(e){
      results.push({pr:item.pr,scope:item.scope,ours,
        theirs:theirs||null,status:'INDETERMINATE',error:String(e.message).slice(0,2200)});
    }
  }
  const report={schema:'art321-unmerged-cross-draft-executable-regression-v1',
    generatedAtUtc:new Date().toISOString(),
    method:'git merge-tree + transient non-pushed local commit/worktree + selected native Node tests',
    mutations:['NO GitHub merge','NO branch update','NO game or save edit','NO deploy'],
    ours,results};
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  for(const r of results)console.log('ART321_INTEGRATION '+JSON.stringify({
    pr:r.pr,ours:r.ours,theirs:r.theirs,status:r.status,
    tests:r.regression?.tests.map(x=>({file:x.file,status:x.status})),
    passed:r.regression?.passed,error:r.error}));
  // Preserve useful failed/conflict evidence in the uploaded artifact; fail
  // only on actual executed-regression failures or unavailable verification.
  if(results.some(x=>x.status==='INDETERMINATE'||
    (x.regression&&!x.regression.passed)))process.exitCode=1;
}
main();
