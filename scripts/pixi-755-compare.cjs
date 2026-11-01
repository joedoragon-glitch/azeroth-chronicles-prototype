'use strict';
// #755: compare identical composite draw fixtures with same-runner baseline evidence.
// This scores JS draw-call duration only. No monitor FPS, GPU completion, or phone claims.
const fs = require('node:fs');
function median(nums) {const s=nums.slice().sort((a,b)=>a-b);return s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2;}
function inspect(baseline,candidate) {
  if(baseline.length<2 || candidate.length<2) throw Error('Need at least two independent runs per side');
  const all=[...baseline,...candidate], a=all[0];
  const comparable = x=>JSON.stringify([x.engine,x.viewport,x.deviceScaleFactor,x.zoom,x.optimized,x.benchmarkVersion,x.perfSamples,x.perfWarmup]);
  for(const run of all){
    if(comparable(run)!==comparable(a)) throw Error('Environment or fixture mismatch: '+run.head);
    if(!Array.isArray(run.benchmarks) || run.benchmarks.length!==4 || run.errors?.length) throw Error('Incomplete/corrupt benchmark: '+run.head);
  }
  const details=[], problems=[];
  for(const count of [1,8,24,48]) {
    const rows=all.map(run=>run.benchmarks.find(b=>b.count===count));
    if(rows.some(row=>!row || row.sampleCount<64 || row.warmupDraws<12 || !Number.isFinite(row.p50) || !Number.isFinite(row.p95) || row.p50>row.p95 || row.bakesDelta!==0 || row.active===false))
      throw Error('Invalid steady/cached sample for '+count+' actors');
    const measures={count};
    for(const key of ['p50','p95']){
      const b=rows.slice(0,baseline.length).map(r=>r[key]);
      const c=rows.slice(baseline.length).map(r=>r[key]);
      const middle=median(b),candidateMiddle=median(c);
      const spread=median(b.map(x=>Math.abs(x-middle)));
      // Percentage of baseline and repeated-baseline spread, not a target FPS.
      // The 25% tolerance catches material drift without treating a SwiftShader ms as hardware speed.
      const tolerance=Math.max(middle*0.25,3*spread);
      const unreliable=middle<=0 || (Math.max(...b)-Math.min(...b))/middle>0.60;
      const regressed=candidateMiddle>middle+tolerance;
      measures[key]={baselineMs:middle,candidateMs:candidateMiddle,baselineRunsMs:b,candidateRunsMs:c,baselineMadMs:spread,toleranceMs:tolerance,relativeChangePct:middle>0?100*(candidateMiddle/middle-1):null,decision:unreliable?'INCONCLUSIVE':regressed?'HOLD':'GO'};
      if(unreliable)problems.push(`${count} actors ${key}: baseline dispersion too large to certify`);
      else if(regressed)problems.push(`${count} actors ${key}: material relative CPU draw regression`);
    }
    details.push(measures);
  }
  return {decision:problems.length?'HOLD':'GO',note:'Synchronous JavaScript draw-call time in software-WebGL Chromium; not presented FPS, GPU completion, GPU allocation, or real-device acceptance.',referenceShas:[...new Set(baseline.map(x=>x.head))],candidateShas:[...new Set(candidate.map(x=>x.head))],engine:a.engine,viewport:a.viewport,deviceScaleFactor:a.deviceScaleFactor,zoom:a.zoom,optimized:a.optimized,perfSamples:a.perfSamples,perfWarmup:a.perfWarmup,details,problems};
}
function main(argv) {
  const baseline=[],candidate=[];let output=null;
  for(let i=0;i<argv.length;i++){
    if(argv[i]==='--baseline')baseline.push(JSON.parse(fs.readFileSync(argv[++i],'utf8')));
    else if(argv[i]==='--candidate')candidate.push(JSON.parse(fs.readFileSync(argv[++i],'utf8')));
    else if(argv[i]==='--out')output=argv[++i];
    else throw Error('Unknown argument '+argv[i]);
  }
  const result=inspect(baseline,candidate);
  if(output)fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
  if(result.decision!=='GO')process.exitCode=1;
}
if(require.main===module) {
  try {main(process.argv.slice(2));}catch(e){console.error(e);process.exitCode=1;}
}
module.exports={median,inspect};
