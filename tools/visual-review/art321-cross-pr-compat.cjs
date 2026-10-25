'use strict';
/* Read-only cross-PR merge-tree audit for Art Catalog #321.
 * Never touches Git index/worktree, never merges/pushes, and never runs game suites.
 * This probes the actual current PR head vs the named still-unmerged branches,
 * recording source SHAs, common ancestors and Git's *real* 3-way result.
 */
const cp = require('node:child_process');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname,'../..');
const output = process.argv[2] || path.join(root,'art321-cross-pr-audit.json');
const checks = [
  {pr:471,scope:'Renderer diagnostics + protected visual effects',overlap:['src/prototype/renderer.js']},
  {pr:464,scope:'Ranger/Archer/Paladin projectile rendering',overlap:['src/prototype/renderer.js']},
  {pr:447,scope:'Pixi browser recovery acceptance',overlap:[]},
];
const run=(args,{allowFailure=false}={})=>{
  const r=cp.spawnSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:4*1024*1024});
  if(r.error)throw r.error;
  if(!allowFailure && r.status!==0)throw Error('git '+args.join(' ')+' failed: '+r.stderr.slice(0,800));
  return {status:r.status,stdout:r.stdout||'',stderr:r.stderr||''};
};
function fetch(name,gitRef){
  run(['fetch','--quiet','--no-tags','--depth=300','origin',
    '+'+gitRef+':refs/audit-art321/'+name]);
  return run(['rev-parse','refs/audit-art321/'+name]).stdout.trim();
}
function mergeBase(a,b){
  let result=run(['merge-base',a,b],{allowFailure:true});
  if(result.status===0)return result.stdout.trim();
  // One bounded deepening; lack of merge-base is NOT a clean outcome.
  run(['fetch','--quiet','--no-tags','--deepen=600','origin'],{allowFailure:true});
  result=run(['merge-base',a,b],{allowFailure:true});
  return result.status===0?result.stdout.trim():null;
}
function probe(ours,theirs){
  const mb=mergeBase(ours,theirs);
  if(!mb)return {status:'INDETERMINATE',mergeBase:null,
    reason:'Could not establish shared ancestry from available history'};
  const r=run(['merge-tree','--write-tree','--messages',ours,theirs],
    {allowFailure:true});
  if(r.status===0)return {status:'CLEAN',mergeBase:mb,
    resultTree:r.stdout.trim().split('\n')[0]};
  if(r.status===1)return {status:'CONFLICT',mergeBase:mb,
    // Git reports precise conflicted paths in human-readable messages.
    conflictDetails:r.stdout.slice(0,12000),errors:r.stderr.slice(0,1500)};
  return {status:'INDETERMINATE',mergeBase:mb,
    reason:'merge-tree error '+r.status+': '+r.stderr.slice(0,900)};
}
// Verify the composed tree actually retains both sides' source contracts.
// The real merge-tree result is read, parsed, and inspected without checking
// out, committing, merging or modifying any branch.
function inspectCombinedTree(tree,pr){
  const source=(path)=>run(['show',tree+':'+path]).stdout;
  const renderer=source('src/prototype/renderer.js'),
    pixi=source('src/prototype/pixi-experimental.js');
  new vm.Script(renderer,{filename:'combined-renderer.js'});
  new vm.Script(pixi,{filename:'combined-pixi-experimental.js'});
  const contracts={
    canonicalCrownPainter:renderer.includes('function drawCrownLoot(ctx, p)'),
    pixiCrownActor:pixi.includes('appendCrownLoot(records, current, zoom);'),
    sharedPauseHelper:renderer.includes('function drawPausePresentation()'),
    canvasAndPixiPauseCalls:(renderer.match(/drawPausePresentation\(\);/g)||[]).length===2,
    trueRendererSplit:renderer.includes("renderLayer === 'overlay'"),
    retainedCombatOverlay:renderer.includes('drawVisualFx();') &&
      renderer.includes('for (const projectile of game.s.projectiles) drawProjectile(projectile);'),
  };
  if(pr===471){
    contracts.effectDiagnosticsRetained=renderer.includes('effectRecorder.draw(game);') &&
      renderer.includes('effectRecorder?.painted(f);') &&
      renderer.includes('const warningFrameShapes = new Map();');
    contracts.firstPaintProtectionRetained=renderer.includes('function firstPaintEssential(f)') &&
      renderer.includes('firstPaintGraceSeconds');
  }
  if(pr===464){
    contracts.delayedProjectileReleaseRetained=renderer.includes('p.rangerDelayedLaunch') &&
      renderer.includes('p.companionDelayedLaunch');
    contracts.noDuplicatePetFlightRetained=renderer.includes('!f.physicalProjectile');
    contracts.archerVolleyCueRetained=renderer.includes('f.projectileVolley');
  }
  return {status:Object.values(contracts).every(Boolean)?'PASS':'FAIL',contracts};
}
function main(){
  const ours=fetch('469','refs/pull/469/head');
  const mainSha=fetch('main','refs/heads/main');
  const results=[];
  for(const check of checks){
    let theirs;
    try {
      theirs=fetch(String(check.pr),'refs/pull/'+check.pr+'/head');
      const againstAudit=probe(ours,theirs);
      const againstMain=probe(mainSha,theirs);
      const semantic=againstAudit.status==='CLEAN'
        ?inspectCombinedTree(againstAudit.resultTree,check.pr):null;
      results.push({...check,ours,theirs,...againstAudit,semantic,
        mainStatus:againstMain.status,mainMergeBase:againstMain.mergeBase,
        inheritedFromMain:againstAudit.status==='CONFLICT'&&againstMain.status==='CONFLICT',
        mainConflictDetails:againstMain.status==='CONFLICT'
          ?againstMain.conflictDetails.slice(0,4000):undefined});
    }catch(e){
      results.push({...check,ours,theirs:theirs||null,status:'INDETERMINATE',
        reason:String(e.message).slice(0,900)});
    }
  }
  const report={schema:'art321-cross-pr-source-merge-audit-v1',
    createdUtc:new Date().toISOString(),ours,mainSha,method:'read-only git merge-tree --write-tree',
    doesNot:['merge','checkout modification','deploy','full-game testing'],
    results};
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  for(const r of results)
    console.log('ART321_CROSS_PR '+JSON.stringify({
      pr:r.pr,status:r.status,ours:r.ours,theirs:r.theirs,
      mergeBase:r.mergeBase,mainStatus:r.mainStatus,mainMergeBase:r.mainMergeBase,
      inheritedFromMain:r.inheritedFromMain,semantic:r.semantic,overlap:r.overlap,
      conflicts:r.status==='CONFLICT'?r.conflictDetails.slice(0,1400):undefined,
      reason:r.reason
    }));
  if(results.some(r=>r.status==='INDETERMINATE'||r.semantic?.status==='FAIL'))process.exitCode=1;
}
main();
