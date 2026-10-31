'use strict';
// #709 A4: SCOPED Chromium WebAudio on the real published-score/current catalog.
// One desktop and one phone-EMULATED context, not a native iPhone/device test.
// Actual playable game and this read-only listening room share the Audio owner.
// This does not measure perceived quality or authorize publication.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname,'..');
const prefix='/azeroth-chronicles-prototype/';
const type = {'.js':'text/javascript','.json':'application/json','.html':'text/html',
  '.css':'text/css','.mp3':'audio/mpeg','.wav':'audio/wav','.png':'image/png','.svg':'image/svg+xml'};
const cases=[
  {zone:'vale',mode:'exploration',score:'place-vale',bed:'env-woodland-day'},
  {zone:'march',mode:'night',score:'night-march',bed:'env-marsh-night'},
  {zone:'side-highlands-signal',mode:'exploration',score:'interior-side-highlands-signal',bed:'env-highland-wind'},
  {zone:'side-frontier-shrine',mode:'exploration',score:'interior-side-frontier-shrine',bed:'env-frontier-air'},
  {zone:'crown',mode:'exploration',score:'place-crown',bed:'env-crown-courtyard'},
];
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
      try{
        await page.goto('http://127.0.0.1:'+server.address().port+prefix+'tools/audio/index.html');
        await page.waitForFunction(()=>!!window.AudioAudition?.audio?.recordingManifest?.assets?.['env-woodland-day'],null,{timeout:18000});
        assert.equal(await page.evaluate(()=>AudioAudition.audio.ctx),null,'no auto-play before gesture');
        await page.locator('#advanced').evaluate(el=>{el.open=true});
        await page.locator('#profile').selectOption(phone?'phone':'reference');
        for(const x of cases){
          await page.locator('#place').selectOption(x.zone);
          await page.locator('#scene-mode').selectOption(x.mode);
          const go=page.locator('#scene-play');
          if(phone)await go.tap();else await go.click();
          await page.waitForFunction(({bed,score})=>{
            const a=AudioAudition.audio;
            return a.ctx?.state==='running'&&a.environmentVoice?.id===bed &&
              a.recordedScore?.id===score;
          },{bed:x.bed,score:x.score},{timeout:35000});
          const result=await page.evaluate(()=>{
            const a=AudioAudition.audio,e=a.environmentVoice,m=a.recordedScore;
            const pcm=e.item.buffer.getChannelData(0);
            let peak=0;
            // A real decoded MP3, not a synthetic fake buffer, with an actual
            // browser AudioBufferSource routed through the ambience bus.
            for(let i=0;i<pcm.length;i+=257)peak=Math.max(peak,Math.abs(pcm[i]));
            return {bed:e.id,score:m.id,envRate:e.item.buffer.sampleRate,
              musicRate:m.voices[0].item.buffer.sampleRate,
              envDuration:e.item.buffer.duration,peak,
              loop:e.osc.loop,loopStart:e.osc.loopStart,loopEnd:e.osc.loopEnd,
              voiceCount:a.voices.size,environmentVoices:[...a.voices].filter(v=>v.recorded&&v.bus==='ambience').length,
              musicStems:m.voices.map(v=>v.id),envGain:e.targetGain,
              ambientBus:a.mixLevel('ambience'),musicBus:a.mixLevel('music'),
              context:a.ctx.state,defaultSettings:{...a.settings},
              browserContext:a.ctx.constructor.name};
          });
          assert.equal(result.bed,x.bed);
          assert.equal(result.score,x.score);
          assert.equal(result.context,'running');
          assert(result.envDuration>24 && result.peak>0.001,'actual decoded bed must be non-silent');
          assert(result.envRate>=32000 && result.musicRate>=32000);
          assert.equal(result.loop,true);
          assert(Math.abs(result.loopStart-0.15)<0.001 && Math.abs(result.loopEnd-24.15)<0.001);
          assert(result.environmentVoices<=2,'environment transport must not accumulate voices');
          assert(result.voiceCount<=64 && result.voiceCount>=2,'bounded music + environment');
          assert(result.ambientBus>0 && result.musicBus>0);
          assert.equal(result.browserContext,'AudioContext');
          console.log('A4_BROWSER '+JSON.stringify({profile:phone?'phone-emulated':'desktop',zone:x.zone,mode:x.mode,...result}));
        }
        // Real production warning should duck music+ambience without silencing
        // the effects bus; phone profile must not increase environmental level.
        const mix=await page.evaluate(()=>{
          const a=AudioAudition.audio;
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
        console.log('A4_MIX '+JSON.stringify({profile:phone?'phone-emulated':'desktop',...mix}));
        if(phone)await page.locator('#pause').tap();else await page.locator('#pause').click();
        await page.waitForFunction(()=>AudioAudition.audio.ctx?.state==='suspended');
        if(phone)await page.locator('#pause').tap();else await page.locator('#pause').click();
        await page.waitForFunction(()=>AudioAudition.audio.ctx?.state==='running');
        if(phone)await page.locator('#stop').tap();else await page.locator('#stop').click();
        await page.waitForFunction(()=>AudioAudition.audio.ctx===null && AudioAudition.audio.voices.size===0);
        assert.deepEqual(errors,[],'page errors');
        assert.equal(await page.evaluate(()=>localStorage.getItem('audio-audit-709-sentinel')),'untouched');
        console.log('PASS #709 A4 '+(phone?'phone-emulated':'desktop')+
          ': 5 actual recorded scene scores+MP3 environmental beds, pause/resume, warning duck, mute, cleanup, no save mutation');
      }catch(error){
        console.error('A4 failed profile '+(phone?'phone-emulated':'desktop'),errors);
        console.error('page message',await page.locator('#message').textContent().catch(()=>null));
        throw error;
      }finally{await context.close();}
    }
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(e=>{console.error(e);process.exitCode=1});
