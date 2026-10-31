'use strict';
// #709 Phase A3: analyze the real 18 MP3 recordings on the CI runner.
// Objective signal statistics do NOT certify that a soundscape sounds good,
// expresses regional lore or is audible on speakers/iPhone in gameplay.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const cp=require('node:child_process');
const manifest=require('../assets/audio/manifest.json');
const root=path.resolve(__dirname,'..');
const jobs=Object.entries(manifest.assets).filter(([,a])=>a.kind==='ambience');
assert.equal(jobs.length,18);
function tool(bin,args,opts={}) {
  const p=cp.spawnSync(bin,args,{
    cwd:root,encoding:opts.binary?null:'utf8',
    maxBuffer:12*1024*1024,timeout:90000
  });
  if(p.error) throw Error(bin+' unavailable or timed out: '+p.error.message);
  if(p.status!==0) throw Error(bin+' exited '+p.status+': '+String(p.stderr).slice(-1400));
  return p;
}
function db(value){return value>0 ? +(20*Math.log10(value)).toFixed(2) : null}
const binaries=['ffmpeg','ffprobe'];
const missing=binaries.filter(bin=>{const check=cp.spawnSync(bin,['-version'],{encoding:'utf8',timeout:10000});return !!check.error||check.status!==0});
if(missing.length&&process.env.REQUIRE_AUDIO_SIGNAL_DECODE==='1') {
  throw Error('Strict A3 audio measurement requires real external decoders: missing '+missing.join(', '));
}
let totalBytes=0;
if(missing.length) {
  for(const [id,a] of jobs) {
    const file=path.join(root,a.src.replace(/^\.\//,''));
    assert(fs.existsSync(file),'missing real MP3 '+id);
    const bytes=fs.readFileSync(file);
    totalBytes+=bytes.length;
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),
      a.sha256,id+' real physical MP3 hash mismatch');
    assert(a.loop.end<=a.duration,id+' manifest loop invalid');
  }
  console.log('PASS #709 A3 file integrity: 18/18 actual MP3 SHA-256 hashes and catalog loop bounds, '+totalBytes+' bytes');
  console.log('A3_REAL_DECODE_NOT_RUN: '+missing.join(', ')+' missing on this runner. Strict decoder job (REQUIRE_AUDIO_SIGNAL_DECODE=1) is mandatory for decoded waveform/loudness acceptance.');
  process.exit(0);
}
for(const [id,a] of jobs) {
  const file=path.join(root,a.src.replace(/^\.\//,''));
  assert(fs.existsSync(file),'missing physical MP3 '+id);
  const bytes=fs.readFileSync(file);
  totalBytes+=bytes.length;
  const sha=crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha,a.sha256,id+' physical SHA mismatch');
  const probed=JSON.parse(tool('ffprobe',['-v','error','-select_streams','a:0',
    '-show_entries','stream=codec_name,sample_rate,channels,duration:format=duration',
    '-of','json',file]).stdout);
  const stream=probed.streams?.[0];
  assert(stream,id+' audio stream missing');
  assert.equal(stream.codec_name,'mp3',id+' codec');
  assert.equal(stream.channels,1,id+' expected mono input');
  const probeDuration=+(stream.duration||probed.format.duration);
  assert(Number.isFinite(probeDuration)&&probeDuration>=a.loop.end,id+' loop outside physical stream');
  const pcm=tool('ffmpeg',['-nostdin','-hide_banner','-loglevel','error','-i',file,
    '-vn','-f','f32le','-acodec','pcm_f32le','-ac','1','-ar','44100','pipe:1'],{binary:true}).stdout;
  assert.equal(pcm.length%4,0,id+' invalid PCM byte width');
  const frames=pcm.length/4;
  const sr=44100;
  assert(frames>sr*a.loop.end,id+' actual decoded buffer lacks full declared loop');
  const first=Math.round(a.loop.start*sr),last=Math.round(a.loop.end*sr);
  assert(first>=0&&last<frames,id+' loop index invalid');
  let sum=0,peak=0,clipped=0,active=0;
  for(let i=0;i<frames;i++){
    const v=pcm.readFloatLE(4*i);
    assert(Number.isFinite(v),id+' non-finite decoded sample');
    sum+=v*v;
    const x=Math.abs(v);
    if(x>peak) peak=x;
    if(x>=.999)clipped++;
    if(x>=.00001)active++;
  }
  const rms=Math.sqrt(sum/frames);
  assert(rms>0,id+' decoded bed is digital silence');
  const seam=Math.abs(pcm.readFloatLE(4*last)-pcm.readFloatLE(4*first));
  // Compare local signal energy on either side of the exact loop boundary.
  const window= Math.round(sr*.025);
  const windowRms=(start,dir)=>{
    let x=0;
    for(let i=0;i<window;i++) {
      const v=pcm.readFloatLE(4*(start+dir*i));
      x+=v*v;
    }
    return Math.sqrt(x/window);
  };
  const early=windowRms(first,1),late=windowRms(last,-1);
  // EBU R128 integrated loudness and true-peak via named FFmpeg loudnorm analysis.
  const l=tool('ffmpeg',['-nostdin','-hide_banner','-nostats','-loglevel','info',
    '-i',file,'-af','loudnorm=I=-23:TP=-2:LRA=11:print_format=json',
    '-f','null','-']).stderr;
  const meter=(key)=>{
    const m=l.match(new RegExp('"'+key+'"\\s*:\\s*"([^"]+)"'));
    return m?m[1]:null;
  };
  assert(meter('input_i')!==null && meter('input_tp')!==null,
    id+' loudnorm analysis missing');
  console.log('A3_SIGNAL '+JSON.stringify({
    id,sha256:sha,bytes:bytes.length,codec:stream.codec_name,
    channels:stream.channels,rate:+stream.sample_rate,
    manifestDuration:a.duration,probeDuration,decodedDuration:+(frames/sr).toFixed(5),
    loop:a.loop,peakDbfs:db(peak),rmsDbfs:db(rms),
    integratedLufs:meter('input_i'),truePeakDbtp:meter('input_tp'),
    seamSampleJump:+seam.toFixed(7),entry25msDbfs:db(early),
    exit25msDbfs:db(late),clippedSamples:clipped,
    activeFraction:+(active/frames).toFixed(5)
  }));
}
console.log('PASS #709 A3: 18/18 real MP3 physical hashes, mono decoding and loop endpoints; '+
  totalBytes+' encoded bytes; logged EBU R128 loudness, true peak, RMS, seam and active signal');
console.log('A3_LIMIT numerical integrity != perceptual seam quality, in-game mix, headphone or device verdict');
