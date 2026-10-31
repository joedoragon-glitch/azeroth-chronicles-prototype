'use strict';
// #709 A2: objective cross-bed spectrum/time-variation audit of ACTUAL
// published MP3 recordings. Spectral similarity != subjective similarity,
// recognizability, musical quality, or suitability for an individual scene.
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const assert=require('node:assert/strict');
const manifest=require('../assets/audio/manifest.json');
const book=require('../tools/audio/environment-book.json');
const regional=require('../tools/audio/environment-regional-studies.json');
const root=path.resolve(__dirname,'..');
const sampleRate=16000,fftSize=2048;
const bands=[0,125,250,500,1000,2000,4000,8000];
const jobs=Object.entries(manifest.assets).filter(([,a])=>a.kind==='ambience');
assert.equal(jobs.length,18);
assert.equal(book.cues.length,14);
const data=[];
function fftPowerFromPcm(pcm,start){
  const re=new Float64Array(fftSize),im=new Float64Array(fftSize);
  for(let i=0;i<fftSize;i++) {
    const h=0.5-0.5*Math.cos(2*Math.PI*i/(fftSize-1));
    re[i]=pcm.readFloatLE((start+i)*4)*h;
  }
  for(let i=1,j=0;i<fftSize;i++){
    let bit=fftSize>>1;
    for(;j&bit;bit>>=1)j^=bit;
    j^=bit;
    if(i<j){const t=re[i];re[i]=re[j];re[j]=t;}
  }
  for(let length=2;length<=fftSize;length*=2){
    const angle=-2*Math.PI/length,wr=Math.cos(angle),wi=Math.sin(angle);
    for(let i=0;i<fftSize;i+=length){
      let r=1,imw=0;
      for(let j=0;j<length/2;j++){
        const even=i+j,odd=even+length/2;
        const tr=r*re[odd]-imw*im[odd],ti=r*im[odd]+imw*re[odd];
        re[odd]=re[even]-tr;im[odd]=im[even]-ti;
        re[even]+=tr;im[even]+=ti;
        const nr=r*wr-imw*wi;imw=r*wi+imw*wr;r=nr;
      }
    }
  }
  const result=new Float64Array(fftSize/2+1);
  for(let i=1;i<result.length;i++)result[i]=re[i]*re[i]+im[i]*im[i];
  return result;
}
function std(values){
  const mean=values.reduce((a,b)=>a+b,0)/values.length;
  return Math.sqrt(values.reduce((a,b)=>a+(b-mean)**2,0)/values.length);
}
for(const [id,a] of jobs){
  const registeredStudio = {
    'env-highlands-autumn':'regional-ironroot-autumn',
    'env-frontier-recovery':'regional-frontier-recovery',
    'env-signal-occupied':'regional-signal-occupied',
    'env-shrine-occupied':'regional-shrine-occupied',
  };
  const study=regional.studies.find(b=>b.id===registeredStudio[id]);
  const bookEntry=book.cues.find(b=>b.id===id) ||
    (study && {layers:[{recordedField:true},{proceduralAir:true}],details:study.events});
  assert(bookEntry,id+' lacks both original source book and recorded-source study');
  const file=path.join(root,a.src.replace(/^\.\//,''));
  const proc=cp.spawnSync('ffmpeg',['-nostdin','-hide_banner','-loglevel','error',
    '-i',file,'-vn','-ac','1','-ar',String(sampleRate),'-f','f32le','pipe:1'],
    {encoding:null,maxBuffer:8*1024*1024,timeout:90000});
  if(proc.error||proc.status!==0)throw Error('ffmpeg physical MP3 decode failed for '+id+': '+
    (proc.error?.message||String(proc.stderr).slice(-500)));
  const pcm=proc.stdout,frames=pcm.length/4;
  assert(frames>sampleRate*24 && pcm.length%4===0,id+' actual PCM invalid');
  const envelope=[];
  for(let second=0;second<24;second++){
    let sq=0;
    const start=second*sampleRate;
    for(let i=0;i<sampleRate;i++){
      const v=pcm.readFloatLE(4*(start+i));
      assert(Number.isFinite(v),id+' nonfinite PCM');
      sq+=v*v;
    }
    const rms=Math.sqrt(sq/sampleRate);
    envelope.push(20*Math.log10(Math.max(rms,1e-12)));
  }
  let spectrum=new Float64Array(fftSize/2+1);
  const positions=[1,3,5,7,9,11,13,15,17,19,21,23];
  for(const second of positions){
    const start=Math.round((second+0.15)*sampleRate);
    const s=fftPowerFromPcm(pcm,start);
    for(let k=1;k<s.length;k++)spectrum[k]+=s[k];
  }
  const binHz=sampleRate/fftSize;
  let total=0,weighted=0,logSum=0,linearSum=0,used=0;
  const distribution=new Array(bands.length-1).fill(0);
  for(let k=1;k<spectrum.length;k++){
    const hz=k*binHz,v=spectrum[k];
    total+=v;weighted+=hz*v;
    if(v>0){logSum+=Math.log(v);linearSum+=v;used++;}
    const bi=bands.findIndex((e,i)=>i<bands.length-1 && hz>=e&&hz<bands[i+1]);
    if(bi>=0)distribution[bi]+=v;
  }
  assert(total>0&&used>0,id+' no measurable spectrum');
  const fractions=distribution.map(v=>v/total);
  const geo=Math.exp(logSum/used),arithmetic=linearSum/used;
  const report={
    id,sourceBands:bookEntry.layers.length,authoredDetails:bookEntry.details.length,
    rmsEnvelopeStdDb:+std(envelope).toFixed(3),
    envelopeDbRange:+(Math.max(...envelope)-Math.min(...envelope)).toFixed(3),
    centroidHz:+(weighted/total).toFixed(1),
    normalizedBandEnergy:fractions.map(v=>+v.toFixed(5)),
    energyBelow250:+(fractions[0]+fractions[1]).toFixed(4),
    energyAbove2000:+(fractions[5]+fractions[6]).toFixed(4),
    spectralFlatness:+(geo/arithmetic).toFixed(5)
  };
  console.log('A2_SPECTRAL '+JSON.stringify(report));
  data.push({id,distribution:fractions});
}
const similarities=[];
for(let i=0;i<data.length;i++)for(let j=i+1;j<data.length;j++){
  const a=data[i].distribution,b=data[j].distribution;
  let dot=0,na=0,nb=0;
  for(let k=0;k<a.length;k++){dot+=a[k]*b[k];na+=a[k]*a[k];nb+=b[k]*b[k];}
  const cosine=dot/Math.sqrt(na*nb);
  similarities.push({a:data[i].id,b:data[j].id,spectralBandCosine:+cosine.toFixed(6)});
}
similarities.sort((a,b)=>b.spectralBandCosine-a.spectralBandCosine);
console.log('A2_MOST_SPECTRALLY_SIMILAR '+JSON.stringify(similarities.slice(0,12)));
console.log('PASS #709 A2 physical-source spectral engineering: 18/18 real MP3s (14 original+4 new), 24-second comparable analysis windows, 153 pairwise broad-band contrasts');
console.log('A2_LIMIT the four 72-second sources are sampled only over their first 24 seconds here; averaged broad frequency bands and 1-second envelope cannot determine sound identity, timbral plausibility, synthetic/codec artifacts by ear, or aesthetic acceptance; high cosine is only a homogeneity INVESTIGATION FLAG');
