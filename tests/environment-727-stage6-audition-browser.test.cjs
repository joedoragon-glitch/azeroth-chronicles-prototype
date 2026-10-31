'use strict';
// #727 Stage 7 local-only packet, real Chromium playback/navigation/download QA.
// This runs only against a generated temporary owner artifact; no publication,
// creative acceptance, actual iPhone/Chromebook or real-game mixer claim.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../test-results/environment-727-listening-room');
const entry=path.join(root,'index.html');
assert(fs.statSync(entry).isFile(),'Source-verified packet must be built before the browser test');
const index=pathToFileURL(entry).href;
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    for(const phone of [false,true]){
      const context=await browser.newContext({viewport:phone?{width:375,height:812}:{width:1280,height:800},
        hasTouch:phone,isMobile:phone,acceptDownloads:true});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.goto(index);
        await page.waitForFunction(()=>window.ENV727_DATA?.rows?.length===18);
        const study=await page.evaluate(()=>{
          const d=window.ENV727_DATA;
          return {rows:d.rows.length,candidates:d.rows.filter(x=>x.proposal).length,
            keeps:d.rows.filter(x=>x.keep).length,originals:d.rows.every(x=>x.old?.src&&x.music?.src)};
        });
        assert.deepEqual(study,{rows:18,candidates:16,keeps:2,originals:true});
        assert.equal(await page.locator('#scene option').count(),18);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),
          'Listening panel must fit chosen device viewport');
        const hit=async id=>{if(phone)await page.locator(id).tap();else await page.locator(id).click();};
        // Frozen production ledgers order the comparisons by studio stage,
        // not alphabetically. Always select the actual Greenwood day row.
        const valeIndex=await page.evaluate(()=>window.ENV727_DATA.rows.findIndex(x=>x.rule==='vale'));
        assert(valeIndex>=0,'Expected Greenwood daytime comparison row');
        await page.locator('#scene').selectOption(String(valeIndex));
        await hit('#original');
        await page.waitForFunction(()=>{
          const x=document.getElementById('amb');
          return !x.paused&&Number.isFinite(x.duration)&&x.duration>20;
        },null,{timeout:10000});
        let first=await page.evaluate(()=>({src:document.getElementById('amb').currentSrc,
          playing:!document.getElementById('amb').paused}));
        assert(first.src.endsWith('/env-woodland-day.mp3'),JSON.stringify(first));
        await hit('#candidate');
        await page.waitForFunction(()=>{
          const x=document.getElementById('amb');
          return !x.paused&&x.currentSrc.endsWith('/study-vale-day-727.mp3')&&x.duration>72;
        },null,{timeout:10000});
        await page.locator('#music').check();
        await page.waitForFunction(()=>{
          const x=document.getElementById('score');
          return !x.paused&&x.currentSrc.endsWith('/place-vale.mp3')&&x.duration>10;
        },null,{timeout:12000});
        await page.locator('#decision').selectOption('preview');
        await page.locator('#notes').fill('Preview preferred in test only; no human hearing verdict');
        const altIndex=await page.evaluate(()=>window.ENV727_DATA.rows.findIndex(x=>x.alternative));
        assert(altIndex>=0);
        await page.locator('#scene').selectOption(String(altIndex));
        assert.equal(await page.locator('#candidate').isDisabled(),false);
        const selected=await page.evaluate(()=>window.ENV727_DATA.rows[Number(document.querySelector('#scene').value)].proposal.id);
        assert.equal(selected,'study-crown-enclosed-727');
        for(const i of [16,17]){
          await page.locator('#scene').selectOption(String(i));
          assert(await page.locator('#candidate').isDisabled(),'Retained Treasury has no new recording');
          assert.equal(await page.locator('#decision').inputValue(),'undecided');
        }
        await page.locator('#scene').selectOption(String(valeIndex));
        assert.equal(await page.locator('#decision').inputValue(),'preview',
          'User choice must survive navigation between comparisons');
        assert((await page.locator('#notes').inputValue()).startsWith('Preview preferred'));
        const downloadPending=page.waitForEvent('download',{timeout:10000});
        await hit('#export');
        const downloaded=await downloadPending;
        const file=await downloaded.path();
        const bytes=fs.readFileSync(file,'utf8');
        assert(bytes.includes('SIBDLP #727 Stage 7'));
        assert(bytes.includes('Greenwood Vale'));
        assert(bytes.includes('Preview preferred in test only'));
        assert(bytes.includes('Scornfang Treasury'));
        assert(bytes.includes('Ridge Tyrant Treasury'));
        assert.equal(bytes.split('\n').filter(l=>l.includes(' | old ')).length,18,
          'One exported row per comparison, including deliberate keeps');
        assert.deepEqual(errors,[],'Local listening room has no runtime errors');
        console.log('PASS STAGE7_OFFLINE_LISTENING_UI '+JSON.stringify({
          profile:phone?'phone-emulated':'desktop',study,originalPlayed:first.playing,
          previewAndDev248MusicPlayed:true,alternateAndTwoKeeps:true,exportedRows:18,
          ownerCreativeApproval:false,actualHeadphonesAudition:false,gameMixer:true===false
        }));
      }finally{await context.close();}
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
