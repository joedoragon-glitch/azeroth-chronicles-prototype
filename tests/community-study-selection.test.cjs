'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const code = fs.readFileSync(path.join(__dirname,'../.github/scripts/select-community-study.cjs'),'utf8');
async function run(runs, compatible, status=200) {
  const writes=[], messages=[], calls=[];
  const process={env:{GITHUB_REPOSITORY:'joedoragon-glitch/azeroth-chronicles-prototype',COMMUNITY_BRANCH:'integration/community-snapshot-311-20261016',GITHUB_OUTPUT:'fixture',GITHUB_TOKEN:'synthetic-fixture'},exitCode:0};
  const context={process,console:{log:(...v)=>messages.push(v),error:v=>messages.push(v)},setTimeout:fn=>fn(),
    fetch:async()=>({ok:status===200,status,json:async()=>({workflow_runs:runs})}),
    require:name=>name==='node:fs'?{appendFileSync:(_,s)=>writes.push(s)}:name==='node:child_process'?{execFileSync:(_,args)=>{calls.push(args);return args[0]==='diff'&&!compatible.has(args[2])?'src/prototype/engine.js\n':'';}}:require(name)};
  await vm.runInNewContext(code,context);
  return {writes,messages,calls,exitCode:process.exitCode};
}
(async()=>{
  const a={id:101,head_sha:'a'.repeat(40),status:'in_progress'},b={id:102,head_sha:'b'.repeat(40),status:'completed'};
  const exact=await run([a,b],new Set([b.head_sha]));
  assert.equal(exact.exitCode,0);assert(exact.writes[0].includes('run_id=102\ncommit='+b.head_sha));
  const pending=await run([a],new Set([a.head_sha]));
  assert.equal(pending.exitCode,0,'pending exact-input run is selected and must still pass the workflow watch');
  const stale=await run([a],new Set());
  assert.equal(stale.exitCode,1,'old runtime cannot certify new gameplay');assert.equal(stale.writes.length,0);
  const denied=await run([],new Set(),403);assert.equal(denied.exitCode,1);assert.equal(denied.writes.length,0);
  const malformed=await run([{id:103,head_sha:'not-a-sha'}],new Set());assert.equal(malformed.exitCode,1);assert.equal(malformed.writes.length,0);
  console.log('PASS hosted study selection rejects changed inputs, missing evidence, API failure and malformed commit; exact pending evidence still requires completion');
})().catch(e=>{console.error(e);process.exitCode=1;});
