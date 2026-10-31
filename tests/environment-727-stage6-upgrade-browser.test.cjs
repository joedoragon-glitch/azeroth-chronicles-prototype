'use strict';
// #727 Stage 6: real fresh->updated PWA lifecycle with current dev.248 music,
// source-frozen ambient preview assets, rollback identity and offline reopening.
// Two synthetic CI-only release identities; NOT published/device/listening proof.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const oldSite=path.join(root,'_site-env727-baseline');
const nextSite=path.join(root,'_site');
const study=require('../test-results/environment-727-stage6-trial.json');
const original=JSON.parse(fs.readFileSync(path.join(oldSite,'assets/audio/manifest.json'),'utf8'));
const next=JSON.parse(fs.readFileSync(path.join(nextSite,'assets/audio/manifest.json'),'utf8'));
assert.equal(Object.keys(original.assets).length,131);
assert.equal(Object.keys(next.assets).length,147);
assert.equal(study.studies.length,16);
for(const [id,entry] of Object.entries(original.assets))
  assert.equal(entry.sha256,next.assets[id]?.sha256,'Current dev.248 soundtrack/original bed changed in trial: '+id);
const prefix='/azeroth-chronicles-prototype/';
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json',
  '.css':'text/css','.png':'image/png','.mp3':'audio/mpeg','.svg':'image/svg+xml'};
const oldVersion='-release-aaaaaaaaaaaa',nextVersion='-release-bbbbbbbbbbbb';
for(const [folder,revision] of [[oldSite,oldVersion],[nextSite,nextVersion]]){
  const filepath=path.join(folder,'sw.js');
  const originalWorker=fs.readFileSync(filepath,'utf8');
  assert(/-release-[a-f0-9]{12}/.test(originalWorker),'Reproducible packaged release ID required');
  fs.writeFileSync(filepath,originalWorker.replace(/-release-[a-f0-9]{12}/,revision));
}
let serveNew=false,requests=[];
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const rel=name.startsWith(prefix)?name.slice(prefix.length):null;
  const folder=serveNew?nextSite:oldSite;
  const disk=rel===null?'':path.resolve(folder,rel||'index.html');
  if(!disk.startsWith(folder+path.sep)||!fs.existsSync(disk)||!fs.statSync(disk).isFile()){
    res.writeHead(404);res.end();return;
  }
  requests.push({newSite:serveNew,path:rel});
  res.setHeader('Cache-Control','no-cache');
  res.setHeader('Content-Type',types[path.extname(disk)]||'application/octet-stream');
  fs.createReadStream(disk).pipe(res);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true});
    for(const phone of [false,true]){
      serveNew=false;
      requests=[];
      const context=await browser.newContext({
        viewport:phone?{width:375,height:812}:{width:1280,height:800},
        isMobile:phone,hasTouch:phone,serviceWorkers:'allow'
      });
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      const entry='http://127.0.0.1:'+server.address().port+prefix+(phone?'phone.html':'index.html');
      try{
        await page.addInitScript(()=>localStorage.setItem('env727-upgrade-sentinel','unchanged-save'));
        await page.goto(entry,{waitUntil:'domcontentloaded'});
        await page.evaluate(async()=>{
          const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./'});
          if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});
        });
        await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:120000,polling:500});
        const baseline=await page.evaluate(async()=>{
          const list=(await caches.keys()).filter(k=>k.startsWith('azeroth-app-v'));
          const cache=await caches.open(list[0]);
          const m=await (await cache.match(new URL('./assets/audio/manifest.json',location.href))).json();
          return {names:list,entries:(await cache.keys()).length,assets:Object.keys(m.assets).length};
        });
        assert.equal(baseline.names.length,1);
        assert(baseline.names[0].endsWith(oldVersion));
        assert.equal(baseline.assets,131);
        assert(baseline.entries>120);
        // The test server changes the published *files* without allowing a
        // public deployment. update() is the actual Service Worker update path.
        serveNew=true;
        const upgraded=await page.evaluate(async suffix=>{
          const deadline=Date.now()+120000;
          const reg=await navigator.serviceWorker.ready;
          await reg.update();
          while(Date.now()<deadline){
            const current=await navigator.serviceWorker.getRegistration();
            if(current?.waiting)current.waiting.postMessage({type:'SKIP_WAITING'});
            const names=(await caches.keys()).filter(n=>n.startsWith('azeroth-app-v'));
            if(names.length===1&&names[0].endsWith(suffix)&&navigator.serviceWorker.controller){
              const cache=await caches.open(names[0]);
              const catalog=await cache.match(new URL('./assets/audio/manifest.json',location.href));
              if(!catalog?.ok)throw Error('Updated manifest absent from active offline cache');
              const manifest=await catalog.json();
              return {names,entries:(await cache.keys()).length,assets:Object.keys(manifest.assets).length};
            }
            await new Promise(done=>setTimeout(done,300));
          }
          throw Error('SW updated release never activated and cleaned prior cache');
        },nextVersion);
        assert.equal(upgraded.names.length,1);
        assert(upgraded.names[0].endsWith(nextVersion));
        assert.equal(upgraded.assets,147);
        assert(upgraded.entries>=baseline.entries+16,'New ambient previews missing from replacement offline package');
        const updateRequests=requests.filter(x=>x.newSite);
        // The reuse optimization must not download unchanged 65 new-score
        // recordings again. The new previews must be fetched at least once.
        assert.equal(updateRequests.filter(x=>x.path==='assets/audio/music/place-vale.mp3').length,0,
          'Unchanged new soundtrack recording was needlessly fetched during PWA update');
        assert(updateRequests.some(x=>x.path==='assets/audio/ambience/studio-cindermaw-roost-vault-727.mp3'),
          'Updated PWA did not download a new candidate file');
        await context.setOffline(true);
        await page.reload({waitUntil:'domcontentloaded',timeout:25000});
        const offline=await page.evaluate(async studies=>{
          const out=[];
          for(const t of studies){
            const response=await fetch('./assets/audio/ambience/'+t.id+'.mp3');
            if(!response.ok)throw Error('Updated offline recording unavailable: '+t.id);
            const content=await response.arrayBuffer();
            const digest=await crypto.subtle.digest('SHA-256',content);
            const actual=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
            if(actual!==t.sha256||content.byteLength!==t.bytes)
              throw Error('Updated audio bytes or SHA differ from frozen source: '+t.id);
            out.push(t.id);
          }
          const manifest=await (await fetch('./assets/audio/manifest.json')).json();
          return {verified:out.length,catalog:Object.keys(manifest.assets).length,
            controller:!!navigator.serviceWorker.controller,title:document.title,
            save:localStorage.getItem('env727-upgrade-sentinel')};
        },study.studies.map(x=>({id:x.id,bytes:x.bytes,sha256:x.sha256})));
        assert.equal(offline.verified,16);
        assert.equal(offline.catalog,147);
        assert.equal(offline.controller,true);
        assert.equal(offline.save,'unchanged-save');
        assert.equal(await page.locator('#title-heading').count(),1);
        assert.deepEqual(errors,[],'PWA upgrade produced game runtime page errors');
        console.log('PASS STAGE6_OFFLINE_UPGRADE '+JSON.stringify({
          profile:phone?'phone-emulated':'desktop',baseline,upgraded,
          newAssetDownloads:updateRequests.filter(x=>x.path.startsWith('assets/audio/ambience/stu')||x.path.startsWith('assets/audio/ambience/study')).length,
          unchangedScoreRequests:updateRequests.filter(x=>x.path==='assets/audio/music/place-vale.mp3').length,
          offline,syntheticReleaseIds:true,liveDeployment:false}));
        await context.setOffline(false);
      }finally{await context.close();}
    }
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(e=>{console.error(e);process.exitCode=1});
