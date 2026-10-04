/* Original authored prototype melodies. No external music assets or streaming. */
(function(root){
'use strict';
const themes=[
 {id:'vale',bpm:92,root:60,lead:'triangle',melody:[0,2,4,7,4,2,0,2,4,5,7,9,7,4,2,null,4,7,9,7,5,4,2,0,2,4,5,2,0,null,0,null]},
 {id:'march',bpm:78,root:62,lead:'sine',melody:[0,null,4,3,2,null,6,4,3,2,0,null,-1,2,3,null,4,6,7,6,4,null,3,2,0,2,3,4,2,null,0,null]},
 {id:'highlands',bpm:84,root:55,lead:'triangle',melody:[0,0,4,null,7,7,5,4,2,null,0,2,4,null,2,null,7,9,7,5,4,2,4,null,5,4,2,0,-1,2,0,null]},
 {id:'frontier',bpm:100,root:57,lead:'triangle',melody:[0,2,0,4,3,null,2,0,-2,0,2,3,4,3,2,null,4,5,7,5,4,null,3,2,0,2,3,2,0,-2,0,null]},
 {id:'crown',bpm:72,root:60,lead:'sine',melody:[7,null,6,4,3,null,2,0,-1,null,0,2,3,2,0,null,4,null,5,7,6,null,4,3,2,0,2,3,2,null,0,null]},
 {id:'crypt',bpm:76,root:57,lead:'sine',melody:[0,null,4,null,3,2,null,0,-1,null,2,null,3,2,0,null,4,null,7,6,4,null,3,2,0,null,2,3,2,null,0,null]},
 {id:'archive',bpm:82,root:62,lead:'sine',melody:[0,4,null,7,6,null,4,3,2,null,0,3,2,null,-1,null,4,7,null,9,7,6,4,null,3,4,2,null,0,2,0,null]},
 {id:'mine',bpm:96,root:53,lead:'triangle',melody:[0,0,null,3,0,2,4,null,3,3,null,2,0,null,-2,null,4,4,null,7,5,4,3,null,2,0,2,3,0,null,0,null]},
 {id:'abyss',bpm:90,root:55,lead:'triangle',melody:[0,2,3,null,4,3,2,0,-2,null,0,2,3,2,null,0,7,6,4,null,5,4,3,2,0,2,3,4,2,null,0,null]},
 {id:'citadel',bpm:70,root:60,lead:'sine',melody:[0,null,7,null,6,4,null,3,2,null,4,null,3,2,0,null,4,null,7,9,7,null,6,4,3,null,2,4,2,null,0,null]},
 {id:'field-boss',bpm:112,root:50,lead:'triangle',melody:[0,0,3,4,0,2,3,null,5,4,3,2,0,0,-1,null]},
 {id:'dungeon-boss',bpm:104,root:48,lead:'triangle',melody:[0,3,4,7,6,4,3,2,0,0,-1,2,3,4,2,null]},
 {id:'darklord-boss',bpm:88,root:45,lead:'triangle',melody:[0,null,0,3,4,null,6,4,3,2,0,null,-1,0,2,null]},
 {id:'finale',bpm:80,root:60,lead:'sine',melody:[0,2,4,7,9,null,7,4,5,7,9,11,12,null,7,null,4,5,7,9,7,4,2,null,0,4,7,9,7,4,0,null]}
];
const scale=(peace)=>peace?[0,2,4,5,7,9,11]:[0,2,3,5,7,8,10];
const pitch=(degree,peace)=>{const s=scale(peace),oct=Math.floor(degree/7),i=((degree%7)+7)%7;return s[i]+12*oct;};
const defaults={master:.65,music:.4,ambience:.25,effects:.7,muted:false};
class PrototypeAudio{
 constructor(settings={}){this.settings={...defaults};this.setSettings(settings);this.ctx=null;this.cue=null;this.voices=new Set();this.step=0;this.next=0;this.clock=null;this.noise=null;this.paused=false;this.history=[];this.lastWarning=0;this.finaleUntil=0;}
 setSettings(settings){for(const k of ['master','music','ambience','effects'])if(Number.isFinite(settings[k]))this.settings[k]=Math.max(0,Math.min(1,settings[k]));if(typeof settings.muted==='boolean')this.settings.muted=settings.muted;this.applySettings();}
 applySettings(){if(!this.ctx)return;const now=this.ctx.currentTime;for(const [key,node]of Object.entries(this.buses||{}))node.gain.setTargetAtTime(this.settings[key]*(this.settings.muted?0:1),now,.04);}
 async unlock(){try{const A=root.AudioContext||root.webkitAudioContext;if(!A)return false;if(!this.ctx){this.ctx=new A();this.buses={};for(const key of ['master','music','ambience','effects'])this.buses[key]=this.ctx.createGain();const compressor=this.ctx.createDynamicsCompressor();compressor.threshold.value=-10;compressor.ratio.value=8;this.buses.master.connect(compressor);compressor.connect(this.ctx.destination);for(const key of ['music','ambience','effects'])this.buses[key].connect(this.buses.master);this.applySettings();this.next=this.ctx.currentTime+.05;this.clock=root.setInterval(()=>this.schedule(),25);this.ambient();}if(!this.paused&&this.ctx.state==='suspended'){await this.ctx.resume();this.next=this.ctx.currentTime+.06;}return this.ctx.state==='running';}catch(_){return false;}}
 choose(campaign){if(campaign.peace&&this.ctx&&this.ctx.currentTime<this.finaleUntil)return {id:'finale',peace:true,night:campaign.night(),region:campaign.definition().id};const z=campaign.zone(),boss=z.enemies.find(e=>e.hp>0&&e.aggro&&e.type==='boss'&&!e.neutral);return {id:campaign.peace?campaign.zoneId:boss?boss.family==='darklord'?'darklord-boss':campaign.isDungeon()?'dungeon-boss':'field-boss':campaign.zoneId,peace:campaign.peace,night:campaign.night(),true:boss?.form==='true',region:campaign.definition().id};}
 update(campaign,paused=false){this.setPaused(paused);const selected=this.choose(campaign),key=JSON.stringify(selected);if(this.key===key)return;this.key=key;this.cue=selected;this.step=0;this.history.push(selected);if(this.history.length>50)this.history.shift();if(this.ctx){this.cancelMusic();this.next=this.ctx.currentTime+.06;this.ambient();}}
 cancelMusic(){for(const v of [...this.voices])if(v.bus==='music'){v.gain.gain.cancelScheduledValues(this.ctx.currentTime);v.gain.gain.setTargetAtTime(0,this.ctx.currentTime,.45);try{v.osc.stop(this.ctx.currentTime+2);}catch(_){} }}
 setPaused(paused){if(this.paused===paused)return;this.paused=paused;if(!this.ctx)return;if(paused){this.ctx.suspend().catch(()=>{});}else{this.ctx.resume().then(()=>{this.next=this.ctx.currentTime+.06;}).catch(()=>{});}}
 tone(midi,at,duration,volume=.04,type='sine',bus='music'){if(!this.ctx||this.voices.size>=64)return;const osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(440*2**((midi-69)/12),at);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.03);gain.gain.exponentialRampToValueAtTime(.0001,at+Math.max(.04,duration));osc.connect(gain);gain.connect(this.buses[bus]);const v={osc,gain,bus};this.voices.add(v);osc.onended=()=>{osc.disconnect();gain.disconnect();this.voices.delete(v);};osc.start(at);osc.stop(at+duration+.05);}
 schedule(){if(!this.ctx||this.paused||this.ctx.state!=='running'||!this.cue)return;const cue=this.cue,theme=themes.find(t=>t.id===cue.id)||themes[0],peace=cue.peace||cue.id==='finale',bpm=peace?Math.max(64,theme.bpm-10):theme.bpm,beat=60/bpm;
  if(this.next<this.ctx.currentTime-.2)this.next=this.ctx.currentTime+.05;
  while(this.next<this.ctx.currentTime+.14){const step=this.step++,at=this.next,degree=theme.melody[step%theme.melody.length],phrase=Math.floor(step/theme.melody.length)%8,root=theme.root+(peace?12:0),chord=[0,5,3,4][Math.floor(step/8)%4];
   if(degree!==null){const variation=(phrase===2||phrase===6)&&step%8===6?2:phrase===5&&step%8===2?-1:0;this.tone(root+pitch(degree+variation,peace),at,beat*.7,cue.night?.022:.035,theme.lead);}
   if(step%4===0){for(const offset of [0,2,4])this.tone(theme.root-12+pitch(chord+offset,peace),at,beat*1.8,.012,'sine');this.tone(theme.root-24+pitch(chord,peace),at,beat*1.2,.022,'triangle');}
   if(!peace&&step%2===0)this.tone(31,at,.09,cue.id.includes('boss')?.025:.009,'sine');
   if(cue.true&&step%4===2)this.tone(theme.root+pitch(6,false),at,beat*.8,.012,'triangle');
   if(peace&&step%8===6)this.tone(root+12+pitch(chord+4,true),at,beat*.8,.015,'sine');
   if(step%16===8){const outdoor=cue.id===cue.region||cue.peace;if(outdoor&&!cue.night){this.tone(89,at,.12,.009,'sine','ambience');this.tone(94,at+.15,.1,.007,'sine','ambience');}else if(!outdoor){this.tone(cue.id==='archive'?79:73,at,.13,.008,'sine','ambience');}else this.tone(93,at,.05,.003,'sine','ambience');}
   this.next+=beat/2;
  }}
 ambient(){if(!this.ctx)return;if(this.noise){try{this.noise.source.stop();}catch(_){}this.noise.source.disconnect();this.noise.filter.disconnect();this.noise.gain.disconnect();this.noise=null;}if(!this.cue)return;const length=this.ctx.sampleRate*3,buffer=this.ctx.createBuffer(1,length,this.ctx.sampleRate),data=buffer.getChannelData(0);let prev=0;for(let i=0;i<length;i++){prev=(prev+(Math.random()*2-1)*.04)/1.04;data[i]=prev;}
  const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=this.cue.region==='march'?950:this.cue.id===this.cue.region?420:180;gain.gain.value=this.cue.peace?.09:.13;source.connect(filter);filter.connect(gain);gain.connect(this.buses.ambience);source.start();this.noise={source,filter,gain};}
 effect(type){if(!this.ctx||this.paused||this.settings.muted)return;const now=this.ctx.currentTime;if(type==='warning'){if(now-this.lastWarning<.35)return;this.lastWarning=now;this.buses.music.gain.setTargetAtTime(this.settings.music*.4,now,.025);this.buses.music.gain.setTargetAtTime(this.settings.music,now+.55,.1);}
  if(type==='peace'){this.finaleUntil=now+12;this.key=null;}const notes={footstep:[28],purchase:[75,79],successor:[60,64,72],gameOver:[43,38,31],swing:[45,38],spell:[62,74],hit:[39],hurt:[35],heal:[64,67,72],gold:[84,88],level:[72,76,79,84],rescue:[67,72,76],learning:[60,64,67],upgrade:[64,67,72],travel:[55,62,67],eliteWarning:[45,46,52],warning:[57,57],bossDefeat:[60,67,72],peace:[60,64,67,72,76,79],death:[50,46,43],reset:[48,43]}[type];if(!notes)return;notes.forEach((n,i)=>this.tone(n,now+i*.09,type==='peace'?.8:.2,type==='warning'?.08:.035,'sine','effects'));}
 dispose(){if(this.clock)root.clearInterval(this.clock);if(this.noise)try{this.noise.source.stop();}catch(_){}if(this.ctx)this.ctx.close().catch(()=>{});this.ctx=null;this.voices.clear();}
}
PrototypeAudio.themes=themes;PrototypeAudio.defaults=defaults;
if(typeof module!=='undefined')module.exports=PrototypeAudio;else root.PrototypeAudio=PrototypeAudio;
})(typeof window!=='undefined'?window:globalThis);
