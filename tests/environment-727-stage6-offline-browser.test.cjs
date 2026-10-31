'use strict';
// #727 Stage 6: disposable site, exact frozen candidate MP3s available after an
// honest service-worker installation and page reopen with the network OFF.
// No physical phone, user auditory judgement, hosted deployment or update claim.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../_site');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/audio/manifest.json')));
const study=require('../test-results/environment-727-stage6-trial.json');
assert.equal(study.studies.length,16);
assert.equal(Object.keys(manifest.assets).length,147);
const prefix='/azeroth-chronicles-prototype/';
const types={'.js':'text/javascript','.json':'application/json','.html':'text/html',
  '.css':'text/css','.mp3':'audio/mpeg','.png':'image/png','.svg':'image/svg+xml'};
let requests=0;
const server=http.createServer((req,res)=>{
  requests++;
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const relative=name.startsWith(prefix)?name.slice(prefix.length):null;
  const file=relative===null?'':path.resolve(root,relative||'index.html');
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end();return;
  }
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true});
    for(const phone of [false,true]){
      const context=await browser.newContext({viewport:phone?{width:375,height:812}:{width:1280,height:800},
        isMobile:phone,hasTouch:phone,serviceWorkers:'allow'});
      const page=await context.newPage();
      const entry='http://127.0.0.1:'+server.address().port+prefix+(phone?'phone.html':'index.html');
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.goto(entry,{waitUntil:'domcontentloaded'});
        await page.evaluate(async()=>{
          const registration=await navigator.serviceWorker.register('./sw.js',{scope:'./'});
          if(registration.waiting) registration.waiting.postMessage({type:'SKIP_WAITING'});
        });
        // Install waits for all catalog MP3s, generated code and PWA art. Don't
        // fake acceptance by fetching only the test candidates over the network.
        await page.waitForFunction(async()=>{
          if(!navigator.serviceWorker.controller) return false;
          const names=(await caches.keys()).filter(k=>k.startsWith('azeroth-app-v'));
          if(names.length!==1)return false;
          const store=await caches.open(names[0]);
          const url=new URL('./assets/audio/ambience/studio-cindermaw-roost-vault-727.mp3',location.href);
          return !!await store.match(url);
        },null,{timeout:120000,polling:800});
        const online=await page.evaluate(async ids=>{
          const names=(await caches.keys()).filter(k=>k.startsWith('azeroth-app-v'));
          const store=await caches.open(names[0]);
          const missing=[],found=[];
          for(const id of ids){
            const url=new URL('./assets/audio/ambience/'+id+'.mp3',location.href);
            const response=await store.match(url);
            if(!response||!response.ok) missing.push(id);
            else found.push({id,status:response.status});
          }
          const keys=(await store.keys()).map(req=>req.url);
          const worker=await navigator.serviceWorker.ready;
          return {cacheName:names[0],allCacheNames:names,entryCount:keys.length,
            cacheExamples:keys.filter(x=>x.includes('/assets/audio/')).slice(0,6),
            cindermawMatch:await (async()=>{
              const u=new URL('./assets/audio/ambience/studio-cindermaw-roost-vault-727.mp3',location.href);
              const response=await store.match(u);
              return {url:u.href,status:response?.status||null,exists:!!response};
            })(),matched:found,cachedCandidateCount:ids.length-missing.length,missing,
            controlled:!!navigator.serviceWorker.controller,scope:worker.scope};
        },study.studies.map(s=>s.id));
        console.log('STAGE6_OFFLINE_CACHE_DIAGNOSTICS '+JSON.stringify({profile:phone?'phone-emulated':'desktop',online}));
        assert.deepEqual(online.missing,[],'Incomplete fresh PWA install of frozen candidate MP3s');
        assert.equal(online.cachedCandidateCount,16);
        await context.setOffline(true);
        // Reopen the actual offline PWA entry, not just a standalone file fetch.
        await page.reload({waitUntil:'domcontentloaded',timeout:20000});
        const offline=await page.evaluate(async tests=>{
          const verified=[];
          for(const t of tests){
            const url='./assets/audio/ambience/'+t.id+'.mp3';
            const res=await fetch(url);
            if(!res.ok) throw Error('Offline MP3 missing: '+t.id+' HTTP '+res.status);
            const bytes=await res.arrayBuffer();
            const digest=await crypto.subtle.digest('SHA-256',bytes);
            const actual=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
            if(actual!==t.sha256||bytes.byteLength!==t.bytes)
              throw Error('Offline MP3 corrupt or stale: '+t.id);
            verified.push(t.id);
          }
          const catalog=await (await fetch('./assets/audio/manifest.json')).json();
          return {verifiedCount:verified.length,verified,
            controlled:!!navigator.serviceWorker.controller,
            catalogAssets:Object.keys(catalog.assets).length,
            gameTitle:document.title};
        },study.studies.map(s=>({id:s.id,sha256:s.sha256,bytes:s.bytes})));
        assert.equal(offline.verifiedCount,16);
        assert.equal(offline.catalogAssets,147);
        assert(offline.controlled);
        assert.equal(await page.locator('#title-heading').count(),1,
          'Offline reopen must retain the actual playable title entry');
        assert.deepEqual(errors,[],'PWA runtime page exceptions');
        console.log('PASS STAGE6_OFFLINE '+JSON.stringify({profile:phone?'phone-emulated':'desktop',
          online,offline:{verifiedCount:offline.verifiedCount,catalogAssets:offline.catalogAssets,
            controlled:offline.controlled,gameTitle:offline.gameTitle},
          note:'Fresh-install offline reopen and full 16 SHA-verified MP3 fetches only; update/physical-device NOT certified'}));
        await context.setOffline(false);
      }finally{await context.close();}
    }
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(e=>{console.error(e);process.exitCode=1});
