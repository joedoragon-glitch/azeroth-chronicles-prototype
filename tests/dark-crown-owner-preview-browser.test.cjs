'use strict';
// Two narrowly scoped real-browser journeys; no whole-game test matrix.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const pageHtml=fs.readFileSync(path.join(root,'dark-crown-owner-preview.html'),'utf8');
assert(pageHtml.includes('dark-crown-owner-preview.js')&&!pageHtml.includes('{{ENTRY}}'));
const mime={'.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{
 let f;
 try{f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch(e){res.writeHead(400).end();return;}
 if(f!==root&&!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 if(f===root)f=path.join(root,'index.html');
 fs.readFile(f,(err,bytes)=>{
  if(err){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(req.method==='HEAD'?undefined:bytes);
 });
});
async function run(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const u='http://127.0.0.1:'+server.address().port+'/dark-crown-owner-preview.html?developer=1';
  for(const [name,viewport] of [['desktop',{width:1200,height:800}],['narrow',{width:390,height:680}]]){
   const ctx=await browser.newContext({viewport,serviceWorkers:'block'});
   try{
    const p=await ctx.newPage();p.setDefaultTimeout(90000);
    const errors=[];p.on('pageerror',e=>errors.push(e.message));
    await p.goto(u,{waitUntil:'domcontentloaded',timeout:45000});
    await p.waitForFunction(()=>!document.getElementById('title-screen')?.hidden&&document.getElementById('startup-update')?.hidden,null,{timeout:90000});
    await p.locator('#title-new').click();
    await p.getByRole('button',{name:'New Developer Mode run'}).click();
    await p.getByRole('button',{name:/^English/}).click();
    await p.getByRole('button',{name:/Paladin/}).click();
    await p.waitForFunction(()=>window.Prototype?.started===true,null,{timeout:90000});
    assert.equal(await p.evaluate(()=>Prototype.game.s.mode),'developer');
    assert.deepEqual(await p.evaluate(()=>Object.keys(Campaign.classes).sort()),['mage','paladin','ranger','rogue']);
    await p.locator('#dark-crown-review-locations summary').click();
    await p.locator('[data-owner-destination=arrival]').click();
    const crown=await p.evaluate(()=>({zone:Prototype.game.zoneId,hero:{x:Prototype.game.hero.x,y:Prototype.game.hero.y},dev:localStorage.getItem('azeroth-v4-developer'),normal:localStorage.getItem('azeroth-v4-normal')}));
    assert.equal(crown.zone,'crown');assert(crown.dev&&JSON.parse(crown.dev).zone==='crown');assert.equal(crown.normal,null);
    assert(Math.hypot(crown.hero.x-690,crown.hero.y-430)<300);
    await p.locator('#dark-crown-review-locations summary').click();
    await p.locator('[data-owner-destination=foundry-in]').click();
    assert.deepEqual(await p.evaluate(()=>({zone:Prototype.game.zoneId,enemies:Prototype.game.zone().enemies.length})),{zone:'side-crown-foundry',enemies:14});
    await p.locator('#dark-crown-review-locations summary').click();
    await p.locator('[data-owner-destination=fortress]').click();
    assert.equal(await p.evaluate(()=>Prototype.game.zoneId),'crown');
    assert.deepEqual(errors.slice(0,3),[]);
    console.log('PASS '+name+' native Developer run: Crown, Foundry with 14 guards, fortress and scoped save');
   }finally{await ctx.close();}
  }
 }finally{await browser.close();}
}
run().then(()=>server.close(),e=>{console.error(e);server.close();process.exitCode=1;});
