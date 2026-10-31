'use strict';
// #709 A4: SCOPED Chromium WebAudio on the real published-score/current catalog.
// One desktop and one phone-EMULATED context, not a native iPhone/device test.
// Runs the PLAYABLE GAME entrypoint directly. Listening-room #647 is intentionally deferred to soundtrack Phase 8.
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
// 19 independently entered playable Campaign zones + the two registered
// day/night environmental alternatives (Vale and Marches): 21 scenes per
// profile. Explicit expected IDs catch accidental route/content regressions.
const cases=[
  {zone:'vale',mode:'exploration',score:'place-vale',bed:'env-woodland-day'},
  {zone:'vale',mode:'night',score:'night-vale',bed:'env-woodland-night'},
  {zone:'march',mode:'exploration',score:'place-march',bed:'env-marsh-day'},
  {zone:'march',mode:'night',score:'night-march',bed:'env-marsh-night'},
  {zone:'highlands',mode:'exploration',score:'place-highlands',bed:'env-highland-wind'},
  {zone:'frontier',mode:'exploration',score:'place-frontier',bed:'env-frontier-air'},
  {zone:'crown',mode:'exploration',score:'place-crown',bed:'env-crown-courtyard'},
  {zone:'crypt',mode:'exploration',score:'place-crypt',bed:'env-retreat'},
  {zone:'archive',mode:'exploration',score:'place-archive',bed:'env-archive'},
  {zone:'mine',mode:'exploration',score:'place-mine',bed:'env-mine'},
  {zone:'abyss',mode:'exploration',score:'place-abyss',bed:'env-dragon-hall'},
  {zone:'citadel',mode:'exploration',score:'place-citadel',bed:'env-citadel'},
  {zone:'supply-vale',mode:'exploration',score:'interior-supply-vale',bed:'env-home'},
  {zone:'supply-march',mode:'exploration',score:'interior-supply-march',bed:'env-home'},
  {zone:'supply-highlands',mode:'exploration',score:'interior-supply-highlands',bed:'env-home'},
  {zone:'supply-crown',mode:'exploration',score:'interior-supply-crown',bed:'env-home'},
  {zone:'side-vale-cellars',mode:'exploration',score:'interior-side-vale-cellars',bed:'env-cellar'},
  {zone:'side-march-watchhouse',mode:'exploration',score:'interior-side-march-watchhouse',bed:'env-archive'},
  {zone:'side-highlands-signal',mode:'exploration',score:'interior-side-highlands-signal',bed:'env-highland-wind'},
  {zone:'side-frontier-shrine',mode:'exploration',score:'interior-side-frontier-shrine',bed:'env-frontier-air'},
  {zone:'side-crown-foundry',mode:'exploration',score:'interior-side-crown-foundry',bed:'env-mine'},
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
        for(const x of cases){
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
          assert(result.envDuration>24 && result.peak>0.001,'real decoded bed non-silence');
          assert(result.envRate>=32000 && result.musicRate>=32000);
          assert.equal(result.loop,true);
          assert(Math.abs(result.loopStart-0.15)<0.001 && Math.abs(result.loopEnd-24.15)<0.001);
          assert(result.environmentVoices<=2,'environment must not accumulate voices');
          assert(result.voiceCount<=64 && result.voiceCount>=2,'bounded music and environment');
          assert(result.ambientBus>0 && result.musicBus>0);
          assert.equal(result.browserContext,'AudioContext');
          console.log('A4_GAME_BROWSER '+JSON.stringify({profile:phone?'phone-emulated':'desktop',...description,...result}));
        }
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
        console.log('A4_GAME_MIX '+JSON.stringify({profile:phone?'phone-emulated':'desktop',...mix}));
        await page.evaluate(()=>Prototype.audio.setPaused(true));
        await page.waitForFunction(()=>Prototype.audio.ctx?.state==='suspended');
        await page.evaluate(()=>Prototype.audio.setPaused(false));
        await page.waitForFunction(()=>Prototype.audio.ctx?.state==='running');
        await page.evaluate(()=>Prototype.audio.dispose());
        await page.waitForFunction(()=>Prototype.audio.ctx===null && Prototype.audio.voices.size===0);
        assert.deepEqual(errors,[],'game browser runtime page errors');
        assert.equal(await page.evaluate(()=>localStorage.getItem('audio-audit-709-sentinel')),'untouched');
        console.log('PASS #709 A4 GAME '+(phone?'phone-emulated':'desktop')+
          ': 21 real Campaign scenes (19 unique zones + 2 night routes) + decoded MP3 beds, pause/resume, warning duck, mute, cleanup');
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
