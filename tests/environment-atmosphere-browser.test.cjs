'use strict';
// #708 targeted real Chromium scene reproduction; no gameplay code or save changes.
// Failing V-01 contract is intentional until the separate corrective PR lands.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const cp = require('node:child_process');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'test-artifacts', 'environment-708');
fs.mkdirSync(out, {recursive:true});
if (!fs.existsSync(path.join(root,'assets/vendor/pixi-8.22.0.min.js')))
  cp.execFileSync(process.execPath,['scripts/vendor-pixi.cjs','--ensure'],{cwd:root,stdio:'inherit'});
const types = {'.html':'text/html','.js':'application/javascript','.json':'application/json',
  '.css':'text/css','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const server = http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname)
    .replace(/^\/+/,'')||'index.html';
  const file=path.resolve(root,name);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end('Not found');return;
  }
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
function executable(){
  if(process.env.CHROMIUM_EXECUTABLE)return process.env.CHROMIUM_EXECUTABLE;
  for(const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){
    try{return cp.execFileSync('which',[name],{encoding:'utf8'}).trim()}catch{}
  }
  return null;
}
async function enterGame(page){
  await page.waitForFunction(()=>!!window.Prototype?.renderer);
  await require('./helpers/language-browser.cjs').selectEnglish(page);
  const title=page.locator('#title-screen');
  if(await title.evaluate(el=>!el.hidden)){
    if(!(await page.locator('#title-continue').isDisabled()))
      await page.locator('#title-continue').click();
    else{
      await page.locator('#title-new').click();
      await page.getByRole('button',{name:'New Normal game',exact:true}).click();
      await page.getByRole('button',{name:/^English(?: ✓)?$/}).click();
      await page.getByRole('button',{name:'Standard death and refuge recovery',exact:true}).click();
      await page.getByRole('button',{name:/Paladin/}).first().click();
    }
  }
  await page.waitForFunction(()=>!!window.Prototype?.started&&
    document.querySelector('#title-screen')?.hidden&&
    document.querySelector('#scene-loading')?.hidden!==false,
    null,{timeout:180000});
  await page.waitForFunction(()=>document.querySelector('#modal')?.hidden===true);
}
async function switchPixi(page){
  await page.locator('#menu-button').click();
  await page.getByRole('button',{name:'Game and settings',exact:true}).click();
  await page.getByRole('button',{name:'Screen and performance',exact:true}).click();
  await page.locator('select[aria-label="Optimization Mode"]').selectOption('off');
  await page.locator('select[aria-label="Graphics renderer"]').selectOption('webgl2');
  await page.waitForFunction(()=>{
    const r=Prototype.experimentalGraphics;
    return r.phase==='trial'||(r.phase==='canvas'&&!!r.lastError);
  },null,{timeout:240000});
  const status=await page.evaluate(()=>Prototype.experimentalGraphics);
  assert.equal(status.mode,'webgl2',
    'V-01 requires actual software WebGL2, not silent Canvas fallback: '+JSON.stringify(status));
  const confirm=page.locator('#gpu-renderer-trial button').first();
  await confirm.click({timeout:8000});
  await page.waitForFunction(()=>Prototype.experimentalGraphics.phase==='confirmed',
    null,{timeout:8000});
  await page.evaluate(()=>Prototype.closeMenu());
}
async function main(){
  let browser;
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const bin=executable();
    browser=await playwright.chromium.launch({
      ...(bin?{executablePath:bin}:{}),
      args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
        '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
    });
    const context=await browser.newContext({viewport:{width:1180,height:750}});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
    await enterGame(page);
    // An admitted, current Campaign region and live nonboss Wraith. This is not
    // a handcrafted illustration or a fabricated image-comparison fixture.
    // Do not assume a particular scene coordinate from an obsolete saved map.
    const scene=await page.evaluate(()=>{
      const g=Prototype.game;
      if(!g.enter('march'))throw Error('Cannot enter current Flooded Marches');
      g.s.clock=480; // night, away from twilight boundaries
      g.zone().enemies=[];
      g.s.party=[];
      const w=g.makeEnemy({
        species:'wraith',name:'Lantern wraith',level:1,hp:2000,
        damage:0,gold:0,xp:0
      },{x:g.hero.x+34,y:g.hero.y+30});
      w.neutral=true;
      g.zone().enemies.push(w);
      window.__environment708Wraith=w;
      return {region:g.zoneId,clock:g.s.clock,id:w.id};
    });
    await page.waitForTimeout(180);
    const canvas=page.locator('#world');
    assert((await canvas.screenshot({path:path.join(out,'marches-wraith-canvas.png')})).length>1024,
      'Actual Canvas screenshot must contain pixels');
    await switchPixi(page);
    await page.waitForFunction(()=>Prototype.experimentalGraphics.sceneMetrics?.lights>=1);
    await page.waitForTimeout(180);
    const withWraith=await page.evaluate(()=>({
      mode:Prototype.experimentalGraphics.mode,
      phase:Prototype.game.daylightPhase().phase,
      lights:Prototype.experimentalGraphics.sceneMetrics?.lights,
      motes:Prototype.experimentalGraphics.sceneMetrics?.motes,
      time:Prototype.game.s.clock
    }));
    assert.equal(withWraith.mode,'webgl2','No GPU fallback during reproduction');
    assert.equal(withWraith.phase,'night','Wraith scene must be night');
    const gpu=page.locator('#world-pixi-experimental');
    assert((await gpu.screenshot({path:path.join(out,'marches-wraith-pixi.png')})).length>1024);
    await page.evaluate(()=>{
      const g=Prototype.game;
      g.zone().enemies=g.zone().enemies.filter(e=>e!==window.__environment708Wraith);
    });
    await page.waitForTimeout(240);
    const withoutWraith=await page.evaluate(()=>({
      mode:Prototype.experimentalGraphics.mode,
      lights:Prototype.experimentalGraphics.sceneMetrics?.lights,
      motes:Prototype.experimentalGraphics.sceneMetrics?.motes
    }));
    assert((await gpu.screenshot({path:path.join(out,'marches-no-wraith-pixi.png')})).length>1024);
    const result={scene,withWraith,withoutWraith,errors};
    fs.writeFileSync(path.join(out,'wraith-lamp-result.json'),JSON.stringify(result,null,2)+'\n');
    console.log('ATMOSPHERE-708-WRAITH-PIXELS '+JSON.stringify(result));
    assert.equal(withoutWraith.mode,'webgl2');
    assert.deepEqual(errors,[], 'No page errors during actual atmosphere painting');
    assert.equal(withWraith.lights,withoutWraith.lights+2,
      'V-01: Pixi must add one radius-64 carried lantern glow and one glass light for a visible Wraith');
    assert.equal(withWraith.motes,withoutWraith.motes,
      'The carried lamp must not alter bounded atmospheric motes');
    console.log('PASS #708 actual game Canvas/Pixi Wraith-night screenshot and two GPU lamp nodes');
    await context.close();
  }finally{
    await browser?.close();
    if(server.listening)await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(e=>{console.error(e);process.exitCode=1});
