'use strict';
// Original deterministic SIBDLP Phase 2 audition WAV producer; unregistered previews.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const CUES=[
  {
    "id": "rogue-bell-basic",
    "seed": 220601,
    "seconds": 0.36,
    "priority": "P1",
    "actor": "Rogue",
    "stage": "committed bell basic",
    "intent": "Small slotted spherical jingle-bell shell and internal rattle, two close strikes"
  },
  {
    "id": "rogue-bell-emphatic",
    "seed": 220602,
    "seconds": 0.43,
    "priority": "P1",
    "actor": "Rogue",
    "stage": "emphatic/charged bell",
    "intent": "Same physical bell with three stronger separated clapper movements; not a pitched choir"
  },
  {
    "id": "mage-orb-release",
    "seed": 220603,
    "seconds": 0.39,
    "priority": "P1",
    "actor": "Mage",
    "stage": "automatic orb release",
    "intent": "Compact arcane orb departure: rising elastic resonator with short bright air shear"
  },
  {
    "id": "thorn-tripwire",
    "seed": 220604,
    "seconds": 0.37,
    "priority": "P1",
    "actor": "Thornpup",
    "stage": "committed Skill 2",
    "intent": "Small tensioned fibrous tripwire, fast twig-snap and whipping wood strand"
  },
  {
    "id": "charmed-wraith-heritage",
    "seed": 220605,
    "seconds": 0.41,
    "priority": "P1",
    "actor": "Charmed Wraith",
    "stage": "heritage committed cast",
    "intent": "Subtle spectral pressure seal, airy vacuum and low wavering rim; no false HP-hit"
  },
  {
    "id": "lifebinder-cold-ring",
    "seed": 220606,
    "seconds": 0.46,
    "priority": "P2",
    "actor": "Lifebinder",
    "stage": "Algor Mortis non-damaging slow cast",
    "intent": "Brittle cold-wave halo and airy crystalline settling, not a damaging impact"
  },
  {
    "id": "quest-complete",
    "seed": 220607,
    "seconds": 0.42,
    "priority": "P3",
    "actor": "Progression",
    "stage": "earned quest payoff",
    "intent": "Concise parchment/seal tap followed by warm restrained rising achievement resonance"
  },
  {
    "id": "barracks-complete",
    "seed": 220608,
    "seconds": 0.44,
    "priority": "P3",
    "actor": "Barracks",
    "stage": "actual completed construction",
    "intent": "Dry timber joining knock and discrete last iron fastening with controlled settling"
  }
];
function renderWav(cue){
 const RATE=48000,N=Math.round(cue.seconds*RATE), y=new Float64Array(N);
 let state=cue.seed>>>0;
 function rnd(){state^=state<<13;state^=state>>>17;state^=state<<5;return ((state>>>0)/2147483648)-1;}
 function env(t,at,attack,decay){const age=t-at;return age<0?0:Math.min(1,age/Math.max(.0001,attack))*Math.exp(-age/Math.max(.001,decay));}
 function noise(at,amp,attack,decay,kind,lowHz,highHz){
  let lp1=0,lp2=0;const a1=Math.exp(-2*Math.PI*lowHz/RATE),a2=Math.exp(-2*Math.PI*highHz/RATE);
  for(let i=0;i<N;i++){const x=rnd(),t=i/RATE;lp1=a1*lp1+(1-a1)*x;lp2=a2*lp2+(1-a2)*x;
   const colored=kind==="low"?lp1:kind==="high"?x-lp2:lp2-lp1;
   y[i]+=amp*colored*env(t,at,attack,decay);
  }
 }
 function tone(at,hz0,hz1,amp,attack,decay,partial=0,flutter=0){
  let phase=0;
  for(let i=0;i<N;i++){let t=i/RATE,age=Math.max(0,t-at);
   let hz=hz1+(hz0-hz1)*Math.exp(-age/.048);
   if(t>=at){phase+=2*Math.PI*hz/RATE;
    const modulation=flutter?(.75+.25*Math.cos(2*Math.PI*flutter*age)):1;
    y[i]+=amp*modulation*(Math.sin(phase)+partial*Math.sin(2.61*phase+.36))*env(t,at,attack,decay);
   }
  }
 }
 function knock(at,fund,amp,decay){tone(at,fund,fund*.94,amp,.0007,decay,.4);noise(at,amp*.9,.0004,Math.min(.018,decay*.38),"mid",650,5900);}
 switch(cue.id){
 case "rogue-bell-basic":
  for(const [at,scale] of [[.004,1],[.055,.72],[.105,.35]]){tone(at,2620,2600,.065*scale,.0008,.055,.4);tone(at,3730,3680,.035*scale,.001,.036,.25);noise(at,.12*scale,.0006,.013,"high",550,2450);}
  break;
 case "rogue-bell-emphatic":
  for(const [at,scale] of [[.003,1],[.047,.85],[.107,1],[.163,.55]]){tone(at,2630,2580,.071*scale,.0008,.074,.48);tone(at,4010,3930,.033*scale,.0008,.042,.2);noise(at,.13*scale,.0005,.012,"high",700,3200);}
  break;
 case "mage-orb-release":
  tone(.018,395,1040,.085,.009,.11,.25,10);tone(.03,700,1850,.028,.005,.079,.3);noise(.025,.24,.017,.075,"mid",400,5300);noise(.068,.18,.015,.051,"high",1700,6700);
  break;
 case "thorn-tripwire":
  noise(.004,.38,.0007,.022,"mid",420,7100);knock(.006,570,.11,.028);tone(.022,900,430,.07,.002,.082,.32);noise(.063,.28,.003,.058,"mid",200,2500);noise(.104,.13,.002,.019,"high",1200,8000);
  break;
 case "charmed-wraith-heritage":
  tone(.018,510,315,.073,.014,.145,.3,7);tone(.027,1220,690,.043,.014,.105,.44,13);noise(.015,.28,.02,.087,"mid",200,1800);noise(.066,.18,.018,.062,"high",2300,7200);
  break;
 case "lifebinder-cold-ring":
  tone(.023,820,740,.057,.005,.085,.25,11);tone(.061,2100,1360,.036,.012,.112,.34);noise(.021,.27,.014,.14,"mid",700,7800);noise(.073,.15,.006,.077,"high",2600,9400);
  break;
 case "quest-complete":
  knock(.003,630,.058,.026);noise(.01,.12,.003,.018,"mid",500,3100);tone(.037,700,700,.047,.006,.083,.22);tone(.12,880,870,.04,.006,.09,.17);tone(.204,1160,1120,.027,.01,.073,.22);
  break;
 case "barracks-complete":
  knock(.004,210,.13,.051);noise(.006,.4,.0015,.048,"low",850,2700);knock(.105,1240,.07,.058);noise(.118,.15,.003,.027,"high",1600,7900);knock(.193,310,.035,.042);
  break;
 default:throw Error("Unknown cue "+cue.id);
 }
 let rawPeak=0;for(const n of y)rawPeak=Math.max(rawPeak,Math.abs(n));
 const gain=Math.min(1,0.64/Math.max(rawPeak,1e-9));
 let total=0,peak=0,tail=0,tailSum=0,tailCount=0;
 const bytes=new Uint8Array(44+N*2),view=new DataView(bytes.buffer);
 const writeAscii=(offset,s)=>{for(let i=0;i<s.length;i++)bytes[offset+i]=s.charCodeAt(i)};
 writeAscii(0,"RIFF");view.setUint32(4,36+N*2,true);writeAscii(8,"WAVE");writeAscii(12,"fmt ");view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,RATE,true);view.setUint32(28,RATE*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);writeAscii(36,"data");view.setUint32(40,N*2,true);
 for(let i=0;i<N;i++){const val=Math.max(-1,Math.min(1,y[i]*gain));view.setInt16(44+2*i,Math.round(val*32767),true);total+=val*val;peak=Math.max(peak,Math.abs(val));if(i>=N-Math.round(.04*RATE)){tail=Math.max(tail,Math.abs(val));tailSum+=val*val;tailCount++;}}
 return {bytes,metrics:{id:cue.id,rate:RATE,samples:N,seconds:cue.seconds,peak:+peak.toFixed(6),rms:+Math.sqrt(total/N).toFixed(6),tailPeak:+tail.toFixed(6),tailRms:+Math.sqrt(tailSum/tailCount).toFixed(6)}};
}
function renderAll(dest,check=false){
 const result=[];
 if(!check)fs.mkdirSync(dest,{recursive:true});
 for(const cue of CUES){const {bytes,metrics}=renderWav(cue),target=path.join(dest,cue.id+'.wav');
   if(check){const actual=fs.readFileSync(target);if(!actual.equals(Buffer.from(bytes)))throw Error('Phase 2 pilot WAV changed or nonreproducible: '+cue.id);}
   else fs.writeFileSync(target,Buffer.from(bytes));
   const digest=crypto.createHash('sha256').update(bytes).digest('hex');
   result.push({...metrics,sha256:digest,bytes:bytes.length});
 }
 return result;
}
if(require.main===module){
 const mode=process.argv.includes('--check')?'check':process.argv.includes('--render')?'render':null;
 if(!mode)throw Error('Use --render or --check. Both operate only on unregistered tools/audio/sfx-phase2-previews');
 const dest=path.resolve(__dirname,'sfx-phase2-previews');
 const report=renderAll(dest,mode==='check');
 for(const r of report){if(!(r.peak>.02&&r.peak<.8&&r.rms>.002&&r.rms<.35&&r.tailPeak<.07))throw Error('Invalid signal range '+JSON.stringify(r));}
 console.log('PASS '+mode+' eight reproducible original mono 48kHz PCM16 SFX pilot WAVs');
 console.log(JSON.stringify(report));
}
module.exports={CUES,renderWav,renderAll};
