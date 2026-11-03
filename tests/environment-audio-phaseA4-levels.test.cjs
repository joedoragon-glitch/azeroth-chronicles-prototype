'use strict';
// #709 A4: engineering loudness comparisons at the ACTUAL current default
// game volume and routing. Real MP3 EBU R128 integrated loudness, not ears.
// No claim of true in-game mixed LUFS: bus dynamics/reverb, extra music layers,
// sceneDetails, warning effects and device output remain separate.
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const path=require('node:path');
const fs=require('node:fs');
const manifest=require('../assets/audio/manifest.json');
const defaults=require('../src/prototype/audio-catalog.js').defaults;
const profiles=require('../src/prototype/audio-mixer.js').profiles;
const root=path.resolve(__dirname,'..');
const scenarios=[
  {zone:'vale',region:'vale',interior:'outdoors',night:false},
  {zone:'vale',region:'vale',interior:'outdoors',night:true},
  {zone:'march',region:'march',interior:'outdoors',night:false},
  {zone:'march',region:'march',interior:'outdoors',night:true},
  {zone:'highlands',region:'highlands',interior:'outdoors',night:false},
  {zone:'frontier',region:'frontier',interior:'outdoors',night:false},
  {zone:'crown',region:'crown',interior:'outdoors',night:false},
  {zone:'supply-highlands',region:'highlands',interior:'treasury',night:false},
  {zone:'supply-crown',region:'crown',interior:'treasury',night:false},
  {zone:'side-highlands-signal',region:'highlands',interior:'side-dungeon',night:false},
  {zone:'side-frontier-shrine',region:'frontier',interior:'side-dungeon',night:false},
  {zone:'side-crown-foundry',region:'crown',interior:'side-dungeon',night:false},
];
const db=x=>20*Math.log10(x);
function proc(bin,args){
 const p=cp.spawnSync(bin,args,{encoding:'utf8',timeout:90000,maxBuffer:4*1024*1024});
 if(p.error||p.status!==0)throw Error(bin+' unavailable or failed: '+(p.error?.message||p.stderr.slice(-1000)));
 return p;
}
for(const bin of ['ffprobe','ffmpeg'])proc(bin,['-version']);
const lut=new Map();
function lufs(id){
 if(lut.has(id))return lut.get(id);
 const a=manifest.assets[id];
 assert(a && (a.kind==='music'||a.kind==='ambience'),id+' missing track');
 const file=path.join(root,a.src.replace(/^\.\//,''));
 assert(fs.existsSync(file),file+' MP3 absent');
 const s=proc('ffmpeg',['-nostdin','-hide_banner','-nostats','-loglevel','info',
  '-i',file,'-af','loudnorm=I=-23:TP=-2:LRA=11:print_format=json',
  '-f','null','-']).stderr;
 const m=s.match(/"input_i"\s*:\s*"([^"]+)"/);
 assert(m && Number.isFinite(+m[1]),id+' loudness unavailable');
 const n=+m[1]; lut.set(id,n); return n;
}
let worstDelta=-Infinity,worstZone=null,rows=0;
for(const s of scenarios){
 const rule=manifest.director.environment.rules.find(r=>
  Object.entries(r.when).every(([key,value])=>s[key]===value));
 const p=manifest.director.places[s.zone];
 assert(rule&&p,s.zone+' missing director route');
 const musicId=(s.night && p.night)||p.base;
 const musicGain=s.night && p.night ? (p.nightGain??p.gain) : p.gain;
 assert(musicGain>0 && rule.gain>0);
 const musicSource=lufs(musicId),ambienceSource=lufs(rule.asset);
 for(const profile of ['reference','phone']){
  const pp=profiles[profile];
  const envScalar=defaults.master*pp.master*defaults.ambience*pp.ambience*rule.gain;
  const musicScalar=defaults.master*pp.master*defaults.music*pp.music*musicGain;
  const envPrediction=ambienceSource+db(envScalar);
  const musicPrediction=musicSource+db(musicScalar);
  const delta=musicPrediction-envPrediction;
  if(delta>worstDelta){worstDelta=delta;worstZone=s.zone+' '+profile;}
  assert(Number.isFinite(delta) && envPrediction<0 && musicPrediction<0);
  console.log('A4_LEVELS '+JSON.stringify({
   zone:s.zone,mode:s.night?'night':'exploration',profile,
   musicId,bedId:rule.asset,musicSourceLUFS:musicSource,bedSourceLUFS:ambienceSource,
   effectiveMusicGainDb:+db(musicScalar).toFixed(2),
   effectiveBedGainDb:+db(envScalar).toFixed(2),
   linearRouteMusicLUFS:+musicPrediction.toFixed(2),
   linearRouteBedLUFS:+envPrediction.toFixed(2),
   musicAboveEnvironmentDb:+delta.toFixed(2)
  }));
  rows++;
 }
}
console.log('PASS #709 A4 relative source/mastering audit: '+rows+
 ' real source/route/profile comparisons, max predicted music-over-bed = '+
 worstDelta.toFixed(2)+' dB at '+worstZone);
console.log('A4_LIMIT predicted per-input LUFS after scalar gains, NOT a captured summed WebAudio output, intelligibility or a heard subjective QA. Browser transport and speaker/device evidence tracked separately.');
