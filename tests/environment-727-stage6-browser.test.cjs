'use strict';
// #727 Stage 6: exact frozen MP3 previews temporarily imported only in disposable CI checkout.
// One desktop and one phone-EMULATED context, not a native iPhone/device test.
// Runs the PLAYABLE GAME entrypoint directly. Listening-room #647 is intentionally deferred to soundtrack Phase 8.
// This does not measure perceived quality, authorize registration in a published build, or authorize publication.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname,'..');
const forcedRate=Number(process.env.ENV727_FORCE_SAMPLE_RATE||0);
if(forcedRate && forcedRate!==48000)throw Error('Only 48000 Hz alternate browser test is supported');
const prefix='/azeroth-chronicles-prototype/';
const type = {'.js':'text/javascript','.json':'application/json','.html':'text/html',
  '.css':'text/css','.mp3':'audio/mpeg','.wav':'audio/wav','.png':'image/png','.svg':'image/svg+xml'};
// 19 independently entered playable Campaign zones + the two temporarily overlaid
// day/night environmental alternatives (Vale and Marches): 21 scenes per
// profile. Explicit expected IDs catch accidental route/content regressions.
const cases=[
  {zone:'vale',mode:'exploration',score:'place-vale',bed:'study-vale-day-727'},
  {zone:'vale',mode:'night',score:'night-vale',bed:'study-vale-night-727'},
  {zone:'march',mode:'exploration',score:'place-march',bed:'study-march-day-727'},
  {zone:'march',mode:'night',score:'night-march',bed:'study-march-night-727'},
  {zone:'highlands',mode:'exploration',score:'place-highlands',bed:'env-highlands-autumn'},
  {zone:'frontier',mode:'exploration',score:'place-frontier',bed:'env-frontier-recovery'},
  {zone:'crown',mode:'exploration',score:'place-crown',bed:'study-crown-open-727'},
  {zone:'crypt',mode:'exploration',score:'place-crypt',bed:'studio-crypt-winter-estate-727'},
  {zone:'archive',mode:'exploration',score:'place-archive',bed:'studio-archive-restoration-727'},
  {zone:'mine',mode:'exploration',score:'place-mine',bed:'studio-colossus-mine-727'},
  {zone:'abyss',mode:'exploration',score:'place-abyss',bed:'studio-abyss-flight-hall-727'},
  {zone:'citadel',mode:'exploration',score:'place-citadel',bed:'studio-citadel-command-727'},
  {zone:'supply-vale',mode:'exploration',score:'interior-supply-vale',bed:'env-home'},
  {zone:'supply-march',mode:'exploration',score:'interior-supply-march',bed:'studio-mirejaw-guarded-wet-store-727'},
  {zone:'supply-highlands',mode:'exploration',score:'interior-supply-highlands',bed:'env-home'},
  {zone:'supply-crown',mode:'exploration',score:'interior-supply-crown',bed:'studio-cindermaw-roost-vault-727'},
  {zone:'side-vale-cellars',mode:'exploration',score:'interior-side-vale-cellars',bed:'studio-orchard-cellars-727'},
  {zone:'side-march-watchhouse',mode:'exploration',score:'interior-side-march-watchhouse',bed:'studio-drowned-watchhouse-727'},
  {zone:'side-highlands-signal',mode:'exploration',score:'interior-side-highlands-signal',bed:'env-signal-occupied'},
  {zone:'side-frontier-shrine',mode:'exploration',score:'interior-side-frontier-shrine',bed:'env-shrine-occupied'},
  {zone:'side-crown-foundry',mode:'exploration',score:'interior-side-crown-foundry',bed:'studio-ruined-foundry-727'},
];
const sampledCases=forcedRate ? cases.filter(x=>['vale','march','highlands','crypt','mine','supply-march','supply-crown','side-crown-foundry'].includes(x.zone)) : cases;
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const rel=name.startsWith(prefix)?name.slice(prefix.length):null;
  const file=rel===null?'':path.resolve(root,rel||'index.html');
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end();return;
  }
  res.setHeader('Content-Type',type[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    const launch={headless:true};
    if(process.env.CHROMIUM_EXECUTABLE){
      launch.executablePath=process.env.CHROMIUM_EXECUTABLE;
      launch.args=['--no-sandbox','--disable-dev-shm-usage'];
    }
    browser=await chromium.launch(launch);
    for(const phone of [false,true]){
      const context=await browser.newContext({
        viewport:phone?{width:375,height:812}:{width:1280,height:800},
        isMobile:phone,hasTouch:phone,serviceWorkers:'block',
      });
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(()=>localStorage.setItem('audio-audit-709-sentinel','untouched'));
      if(forcedRate)await page.addInitScript(rate=>{
        const Native=globalThis.AudioContext || globalThis.webkitAudioContext;
        class AudioContext extends Native {
          constructor(options={}) { super({...options,sampleRate:rate}); }
        }
        globalThis.AudioContext=AudioContext;
      },forcedRate);
      try{
        await page.goto('http://127.0.0.1:'+server.address().port+prefix+(phone?'phone.html':'index.html'));
        await page.waitForFunction(()=>!!window.Prototype?.audio && !!window.Campaign &&
          !!document.querySelector('#title-screen:not([hidden])') &&
          !document.querySelector('#startup-update:not([hidden])'),null,{timeout:30000});
        assert.equal(await page.evaluate(()=>Prototype.audio.ctx),null,'no auto-play before gesture');
        // The game intentionally pauses audio at the title screen. Release only
        // that pause in this isolated browser test, then supply a real pointer
        // gesture on the VISIBLE title heading without starting/saving a game.
        await page.evaluate(()=>Prototype.audio.setPaused(false));
        if(phone)await page.locator('#title-heading').tap();
        else await page.locator('#title-heading').click();
        await page.waitForFunction(()=>Prototype.audio.ctx?.state==='running',null,{timeout:18000});
        await page.evaluate(phone=>{
          const a=Prototype.audio;
          a.update=()=>{}; // hold simulation-driven audio selection while testing real Campaign scenes
          a.enableProduction(true);
          a.setMixProfile(phone?'phone':'reference');
        },phone);
        for(const x of sampledCases){
          const description=await page.evaluate(({zone,mode})=>{
            const a=Prototype.audio;
            const g=new Campaign('normal','paladin',()=>0.73);
            g.enter(zone);
            const before=JSON.stringify(g.s);
            const original=a.describe(g,{started:true});
            if(JSON.stringify(g.s)!==before)throw Error('Audio description mutated campaign');
            const scene={...original,night:mode==='night',peace:false,engaged:0,boss:null,
              settlement:null,situation:'exploration',started:true,gameOver:false};
            a.context=scene;
            a.updateProduction(scene);
            return {zone:scene.zone,region:scene.region,interior:scene.interior,
              selected:a.environmentCue(scene)?.asset,score:a.productionCue(scene)?.id};
          },{zone:x.zone,mode:x.mode});
          assert.equal(description.zone,x.zone);
          assert.equal(description.selected,x.bed);
          assert.equal(description.score,x.score);
          await page.waitForFunction(({bed,score})=>{
            const a=Prototype.audio;
            // In the real game the production/environment schedulers retry
            // failed transient decodes each frame; continue pumping them while
            // this test keeps Campaign state deliberately frozen.
            if(a.ctx?.state==='running'&&a.context){
              a.updateProduction(a.context);
              a.updateEnvironment(a.context);
            }
            return a.ctx?.state==='running'&&a.environmentVoice?.id===bed &&
              a.recordedScore?.id===score;
          },{bed:x.bed,score:x.score},{timeout:35000});
          const result=await page.evaluate(()=>{
            const a=Prototype.audio,e=a.environmentVoice,m=a.recordedScore;
            const pcm=e.item.buffer.getChannelData(0);
            let peak=0;
            // The real browser decoded the actual production MP3; no simulated PCM.
            for(let i=0;i<pcm.length;i+=257)peak=Math.max(peak,Math.abs(pcm[i]));
            return {bed:e.id,score:m.id,envRate:e.item.buffer.sampleRate,
              musicRate:m.voices[0].item.buffer.sampleRate,
              envDuration:e.item.buffer.duration,peak,
              envDecodedBytes:e.item.buffer.length*e.item.buffer.numberOfChannels*4,
              recordingCache:a.recordingAssets?.status(),
              loop:e.osc.loop,loopStart:e.osc.loopStart,loopEnd:e.osc.loopEnd,
              voiceCount:a.voices.size,environmentVoices:[...a.voices].filter(v=>v.recorded&&v.bus==='ambience').length,
              musicStems:m.voices.map(v=>v.id),envGain:e.targetGain,
              ambientBus:a.mixLevel('ambience'),musicBus:a.mixLevel('music'),
              context:a.ctx.state,settings:{...a.settings},
              browserContext:a.ctx.constructor.name};
          });
          assert.equal(result.bed,x.bed);
          assert.equal(result.score,x.score);
          assert.equal(result.context,'running');
          if(forcedRate){
            assert.equal(result.envRate,forcedRate,'Ambient buffer must actually decode at forced 48 kHz');
            assert.equal(result.musicRate,forcedRate,'Current dev248 score must actually decode at forced 48 kHz');
          }
          assert(result.envDuration>24 && result.peak>0.001,'real decoded bed non-silence');
          assert(result.recordingCache && result.recordingCache.decodedBudget===128*1024*1024,
            'real cache must retain its updated 128MiB decoded recording budget');
          assert(result.recordingCache.decodedBytes<=result.recordingCache.decodedBudget,
            'real decoded music and environmental buffers exceed bounded cache');
          assert(result.recordingCache.pinned<=result.recordingCache.cached,
            'recording cache reports inconsistent active resource pins');
          assert(result.envRate>=32000 && result.musicRate>=32000);
          assert.equal(result.loop,true);
          const newRecording=['env-highlands-autumn','env-frontier-recovery','env-signal-occupied','env-shrine-occupied'].includes(x.bed) || x.bed.startsWith('study-') || x.bed.startsWith('studio-');
          const expectedEnd=newRecording ? 72.15 : 24.15;
          if(newRecording)assert(result.envDecodedBytes>8*1024*1024 && result.envDecodedBytes<16*1024*1024,
            'real 72-second environmental MP3 must decode to an expected bounded mono PCM buffer');
          assert(Math.abs(result.loopStart-0.15)<0.001 && Math.abs(result.loopEnd-expectedEnd)<0.001,
            x.zone+' must decode and start the actual '+expectedEnd+'-second source loop');
          assert(result.environmentVoices<=2,'environment must not accumulate voices');
          assert(result.voiceCount<=64 && result.voiceCount>=2,'bounded music and environment');
          assert(result.ambientBus>0 && result.musicBus>0);
          assert.equal(result.browserContext,'AudioContext');
          console.log('STAGE6_GAME_BROWSER '+JSON.stringify({profile:phone?'phone-emulated':'desktop',...description,...result}));
        }
        // A1/A4 real WebAudio attenuation and optimization gate. Use the
        // actual current scene+rule from Campaign; only the event state is
        // deliberately changed to isolate combat / boss / global peace.
        const attenuation=await page.evaluate(()=>{
          const a=Prototype.audio,s=a.environmentScene,rule=a.environmentCue(s);
          const original=a.environmentVoice.targetGain;
          a.updateEnvironment({...s,engaged:3,boss:null,peace:false});
          const combat=a.environmentVoice.targetGain;
          a.updateEnvironment({...s,engaged:0,boss:{family:'citadel',form:'normal'},peace:false});
          const boss=a.environmentVoice.targetGain;
          a.updateEnvironment({...s,engaged:0,boss:null,peace:true});
          const peace=a.environmentVoice.targetGain;
          return {bed:a.environmentVoice.id,rule:rule.id,original,combat,boss,peace,
            activeRecordedAmbient:[...a.voices].filter(v=>v.recorded&&v.bus==='ambience').length};
        });
        assert(Math.abs(attenuation.combat-attenuation.original*.45)<1e-10,'combat bed gain');
        assert(Math.abs(attenuation.boss-attenuation.original*.25)<1e-10,'boss bed gain');
        assert(Math.abs(attenuation.peace-attenuation.original)<1e-10,'global peace bed recovery');
        await page.evaluate(()=>Prototype.audio.setOptimizationMode(true));
        const off=await page.evaluate(()=>{
          const a=Prototype.audio;
          return {environment:a.environmentVoice?.id||null,
            activeRecordedAmbient:[...a.voices].filter(v=>v.recorded&&v.bus==='ambience').length};
        });
        assert.equal(off.environment,null,'optimization stops environment source');
        assert.equal(off.activeRecordedAmbient,0,'optimization releases recorded ambient source');
        await page.evaluate(()=>Prototype.audio.setOptimizationMode(false));
        await page.waitForFunction(bed=>Prototype.audio.environmentVoice?.id===bed,
          attenuation.bed,{timeout:20000});
        console.log('STAGE6_GAME_TRANSITIONS '+JSON.stringify({
          profile:phone?'phone-emulated':'desktop',...attenuation,optimizationOff:off,
          resumed:await page.evaluate(()=>Prototype.audio.environmentVoice?.id)
        }));
        // Let the just-restarted environment and soundtrack finish their
        // authored entry crossfades before measuring steady-state output.
        await page.waitForTimeout(4200);
        // A4 post-compressor graph capture: independent of source-LUFS
        // predictions. Analyze actual running WebAudio output in Chromium,
        // both with current score and environment separately and combined.
        // This is objective dBFS on a short browser window, NOT speaker or ear QA.
        const renderedMix=await page.evaluate(async()=>{
          const a=Prototype.audio,ctx=a.ctx;
          const orig={music:a.settings.music,ambience:a.settings.ambience};
          const analyser=ctx.createAnalyser();
          analyser.fftSize=2048;
          const stream=ctx.createMediaStreamDestination();
          a.compressor.connect(analyser);analyser.connect(stream);
          const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
          const capture=async()=>{
            await delay(180); // allow the existing gain envelopes to settle
            const samples=new Float32Array(analyser.fftSize);
            let sum=0,count=0,peak=0,liveFrames=0;
            for(let j=0;j<18;j++){
              await delay(45);
              analyser.getFloatTimeDomainData(samples);
              let frameEnergy=0;
              for(const x of samples){sum+=x*x;frameEnergy+=x*x;peak=Math.max(peak,Math.abs(x));count++;}
              if(frameEnergy>1e-13)liveFrames++;
            }
            const rms=Math.sqrt(sum/count);
            return {rmsDbfs:+(20*Math.log10(Math.max(rms,1e-10))).toFixed(2),
              peakDbfs:+(20*Math.log10(Math.max(peak,1e-10))).toFixed(2),
              liveFrames,frames:18};
          };
          try{
            a.setSettings({music:0,ambience:orig.ambience});
            const environmentOnly=await capture();
            a.setSettings({music:orig.music,ambience:0});
            const soundtrackOnly=await capture();
            a.setSettings({music:orig.music,ambience:orig.ambience});
            const combined=await capture();
            return {environmentOnly,soundtrackOnly,combined,
              soundtrackAboveEnvironmentDb:+(soundtrackOnly.rmsDbfs-environmentOnly.rmsDbfs).toFixed(2),
              restored:{music:a.settings.music,ambience:a.settings.ambience}};
          }finally{
            a.setSettings(orig);
            a.compressor.disconnect(analyser);
            analyser.disconnect();stream.disconnect();
          }
        });
        assert(renderedMix.environmentOnly.liveFrames>=12,'real live environment graph was not rendering');
        assert(renderedMix.soundtrackOnly.liveFrames>=12,'real live music graph was not rendering');
        assert(renderedMix.combined.liveFrames>=12,'combined audio graph was not rendering');
        assert(renderedMix.combined.peakDbfs<0,'no digital clipping at sampled output frames');
        assert(renderedMix.soundtrackAboveEnvironmentDb>0,'environment signal unexpectedly louder than score');
        console.log('STAGE6_GAME_CAPTURE '+JSON.stringify({profile:phone?'phone-emulated':'desktop',...renderedMix}));
        const mix=await page.evaluate(()=>{
          const a=Prototype.audio;
          const original={music:a.mixLevel('music'),ambience:a.mixLevel('ambience'),effects:a.mixLevel('effects')};
          a.setSceneMix('menu');
          const menu={music:a.mixLevel('music'),ambience:a.mixLevel('ambience'),effects:a.mixLevel('effects')};
          a.setSceneMix('world');
          a.effect('warning');
          const warning={duckUntil:a.duckUntil,now:a.ctx.currentTime,effects:a.mixLevel('effects')};
          a.setSettings({muted:true});
          const muted={music:a.mixLevel('music'),ambience:a.mixLevel('ambience'),effects:a.mixLevel('effects')};
          a.setSettings({muted:false});
          return {original,menu,warning,muted,after:a.mixLevel('ambience')};
        });
        assert(mix.menu.music<mix.original.music && mix.menu.ambience<mix.original.ambience);
        assert.equal(mix.menu.effects,0);
        assert(mix.warning.duckUntil>mix.warning.now && mix.warning.effects>0);
        assert.deepEqual(mix.muted,{music:0,ambience:0,effects:0});
        assert.equal(mix.after,mix.original.ambience);
        console.log('STAGE6_GAME_MIX '+JSON.stringify({profile:phone?'phone-emulated':'desktop',...mix}));
        await page.evaluate(()=>Prototype.audio.setPaused(true));
        await page.waitForFunction(()=>Prototype.audio.ctx?.state==='suspended');
        await page.evaluate(()=>Prototype.audio.setPaused(false));
        await page.waitForFunction(()=>Prototype.audio.ctx?.state==='running');
        await page.evaluate(()=>Prototype.audio.dispose());
        await page.waitForFunction(()=>Prototype.audio.ctx===null && Prototype.audio.voices.size===0);
        assert.deepEqual(errors,[],'game browser runtime page errors');
        assert.equal(await page.evaluate(()=>localStorage.getItem('audio-audit-709-sentinel')),'untouched');
        console.log('PASS #727 STAGE6 GAME '+(phone?'phone-emulated':'desktop')+
          ': '+sampledCases.length+' real Campaign scenes at '+(forcedRate||'device-default')+' Hz + decoded MP3 beds, pause/resume, warning duck, combat/boss/peace, optimization, mute, cleanup');
      }catch(error){
        console.error('A4 failed profile '+(phone?'phone-emulated':'desktop'),errors);
        console.error('game title',await page.locator('#title-heading').textContent().catch(()=>null));
        throw error;
      }finally{await context.close();}
    }
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(e=>{console.error(e);process.exitCode=1});
