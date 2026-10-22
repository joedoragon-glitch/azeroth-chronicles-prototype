'use strict';
// Read-only staging audit. Prints blockers and never alters the playable app.
const fs=require('node:fs'),path=require('node:path');
const C=require('./renderer-release-contract.cjs');
const evidence=JSON.parse(fs.readFileSync(path.join(__dirname,'renderer-readiness.json'),'utf8'));
const checks=C.GATES.map(gate=>({gate,passed:evidence.gates?.[gate]===true}));
const blockers=checks.filter(row=>!row.passed).map(row=>row.gate);
if(!evidence.nativeModule)blockers.push('native renderer source not supplied');
if(!evidence.testReceipt)blockers.push('full-frame parity receipt not supplied');
if(evidence.nativeModule && !fs.existsSync(path.resolve(__dirname,'../..',evidence.nativeModule)))
  blockers.push('declared native renderer module does not exist');
if(evidence.testReceipt && !fs.existsSync(path.resolve(__dirname,'../..',evidence.testReceipt)))
  blockers.push('declared test receipt does not exist');
const ready=C.nativeWebglReady(evidence)&&blockers.length===0;
const report={
  readyForGameIntegration:ready,
  defaultRenderer:C.DEFAULT_RENDERER,
  options:C.OPTIONS,
  gates:checks,
  blockers,
  note:'Readiness audit for future engineering only. It does NOT verify browser graphics by itself.'
};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--require-ready')&&!ready)process.exitCode=1;
