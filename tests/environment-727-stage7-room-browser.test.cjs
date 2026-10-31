'use strict';
// #727 Stage 7 owner-only packet: verify it opens as a LOCAL HTML file, with
// original/new/score playback and one exportable decision sheet. This is a
// UI/codec smoke test, NOT a human listening verdict or actual game compressor.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../test-results/environment-727-listening-room');
assert(fs.existsSync(path.join(root,'index.html')),'Stage 7 source pack must be built first');
const expected=18;
(async()=>{
 let browser;
 try{
   browser=await chromium.launch({headless:true});
   for(const phone of [false,true]){
     const context=await browser.newContext({viewport:phone?{width:375,height:812}:{width:1250,height:790},
       hasTouch:phone,isMobile:phone,acceptDownloads:true,serviceWorkers:'block'});
     const page=await context.newPage(),errors=[],external=[];
     page.on('pageerror',e=>errors.push(e.message));
     page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
     try{
       await page.goto(pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'load'});
       assert.equal(await page.locator('#scene option').count(),expected);
       assert.equal(await page.evaluate(()=>ENV727_DATA.rows.filter(r=>r.proposal).length),16);
       assert.equal(await page.evaluate(()=>ENV727_DATA.rows.filter(r=>r.keep).length),2);
       assert.equal(await page.evaluate(()=>ENV727_DATA.baseCatalogAssets),131);
       assert.equal(await page.locator('#candidate').isDisabled(),false);
       await page.locator('#original').click();
       await page.waitForFunction(()=>{
         const a=document.getElementById('amb');
         return a.readyState>=2&&!a.paused&&Number.isFinite(a.duration)&&a.duration>12;
       },null,{timeout:25000});
       const old=await page.locator('#amb').evaluate(e=>({duration:e.duration,src:e.currentSrc}));
       assert(old.src.includes('/audio/original/'));
       await page.locator('#candidate').click();
       await page.waitForFunction(()=>{
         const a=document.getElementById('amb');
         return !a.paused && a.readyState>=2 && a.duration>72;
       },null,{timeout:25000});
       const next=await page.locator('#amb').evaluate(e=>({duration:e.duration,src:e.currentSrc}));
       assert(next.src.includes('/audio/preview/study-vale-day-727.mp3'));
       await page.locator('#music').check();
       await page.waitForFunction(()=>{
         const s=document.getElementById('score');
         return s.readyState>=2&&!s.paused&&s.duration>2;
       },null,{timeout:25000});
       const soundtrack=await page.locator('#score').evaluate(e=>({src:e.currentSrc,duration:e.duration}));
       assert(soundtrack.src.includes('/audio/music/place-vale.mp3'));
       await page.locator('#critical').click();
       const warn=await page.locator('#warning').evaluate(e=>({src:e.currentSrc,ready:e.readyState}));
       assert(warn.src.includes('/audio/effects/sfx-critical-warning.wav'),
         'The original critical warning is WAV, not a re-encoded MP3');
       await page.locator('#decision').selectOption('preview');
       await page.locator('#notes').fill('Audition test note — source data persists for export.');
       await page.locator('#scene').selectOption({label:'Dark Crown — enclosed wind alternative'});
       assert.equal(await page.locator('#candidate').isDisabled(),false);
       assert.match(await page.locator('#creative').textContent(),/Unselected Crown alternate/);
       await page.locator('#scene').selectOption({label:'Scornfang Treasury — retain original'});
       assert.equal(await page.locator('#candidate').isDisabled(),true);
       assert.match(await page.locator('#creative').textContent(),/Retention decision/);
       const dl=page.waitForEvent('download',{timeout:10000});
       await page.locator('#export').click();
       const file=await dl,buf=fs.readFileSync(await file.path(),'utf8');
       assert.equal(file.suggestedFilename(),'SIBDLP-environmental-listening-decisions.txt');
       assert.equal(buf.split('\n').filter(x=>x.includes(' | old ')).length,18);
       assert(buf.includes('Audition test note — source data persists for export.'));
       assert(buf.includes('Greenwood Vale — day | old env-woodland-day | preview study-vale-day-727 | preview'));
       assert.deepEqual(external,[],'An offline listening room must issue no network requests');
       assert.deepEqual(errors,[],'Playback and note export must have no browser exceptions');
       console.log('PASS STAGE7_LOCAL_OWNER_ROOM '+JSON.stringify({
         profile:phone?'phone-emulated':'desktop',sourceCount:16,selectionCount:18,
         oldSeconds:old.duration,newSeconds:next.duration,
         currentScoreSeconds:soundtrack.duration,warningOriginalWav:true,
         offlineFileProtocol:true,externalRequests:0,exportedDecisions:18,
         caveat:'Browser playback and UI only; human heard/audio quality/physical device NOT verified'
       }));
     }finally{await context.close();}
   }
 }finally{if(browser)await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
