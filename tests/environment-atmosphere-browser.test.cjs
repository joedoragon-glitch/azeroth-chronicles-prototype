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
async function setOptimizationMode(page,mode) {
  await page.locator('#menu-button').click();
  await page.getByRole('button',{name:'Game and settings',exact:true}).click();
  await page.getByRole('button',{name:'Screen and performance',exact:true}).click();
  await page.locator('select[aria-label="Optimization Mode"]').selectOption(mode);
  await page.evaluate(()=>Prototype.closeMenu());
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
      window.__environment708Game=g;
      return {region:g.zoneId,clock:g.s.clock,id:w.id};
    });
    await page.waitForTimeout(180);
    const canvas=page.locator('#world');
    assert((await canvas.screenshot({path:path.join(out,'marches-wraith-canvas.png')})).length>1024,
      'Actual Canvas screenshot must contain pixels');
    await switchPixi(page);
    await page.waitForFunction(()=>Prototype.experimentalGraphics.sceneMetrics?.lights>=1);
    await page.waitForTimeout(180);
    const withWraith=await page.evaluate(()=>{
      const g=Prototype.game, w=window.__environment708Wraith;
      const source=g.zone().enemies.find(e=>e.id===w?.id);
      return {
        mode:Prototype.experimentalGraphics.mode,
        phase:g.daylightPhase().phase,
        zone:g.zoneId, gameSame:g===window.__environment708Game,
        wraithAlive:!!source&&source.species==='wraith'&&source.hp>0,
        wraithType:source?.type, wraithHp:source?.hp,
        sourceCount:g.zone().enemies.filter(e=>e.species==='wraith'&&e.hp>0).length,
        lights:Prototype.experimentalGraphics.sceneMetrics?.lights,
        motes:Prototype.experimentalGraphics.sceneMetrics?.atmosphereMotes,
        optimized:Prototype.experimentalGraphics.backgroundOptimized,
        optimizationSetting:localStorage.getItem('azeroth-optimization-mode-v1'),
        time:g.s.clock
      };
    });
    assert.equal(withWraith.mode,'webgl2','No GPU fallback during reproduction');
    assert.equal(withWraith.phase,'night','Wraith scene must be night');
    const gpu=page.locator('#world-pixi-experimental');
    assert((await gpu.screenshot({path:path.join(out,'marches-wraith-pixi.png')})).length>1024);
    // The emergency graphics override intentionally enables Optimization
    // under critical software-GPU load even when Off is the saved preference.
    // Compare Wraith contribution in one STABLE effective state instead of
    // confusing a genuine emergency tier transition with missing lighting.
    await setOptimizationMode(page,'on');
    await page.waitForFunction(()=>Prototype.experimentalGraphics.backgroundOptimized===true);
    // This source test must isolate ONE fixed living lantern; otherwise
    // ordinary Marches Wraith spawns while the software GPU is preparing can
    // replace the removed light and make a correct renderer look broken.
    await page.evaluate(()=>{
      const g=Prototype.game, id=window.__environment708Wraith.id;
      const carried=g.zone().enemies.find(e=>e.id===id);
      if(!carried || carried.hp<=0)throw Error('Injected Wraith vanished');
      g.zone().enemies=[carried];
    });
    await page.waitForTimeout(1200);
    const withWraithOn=await page.evaluate(()=>({
      lights:Prototype.experimentalGraphics.sceneMetrics?.lights,
      motes:Prototype.experimentalGraphics.sceneMetrics?.atmosphereMotes,
      optimized:Prototype.experimentalGraphics.backgroundOptimized,
      optimizationSetting:localStorage.getItem('azeroth-optimization-mode-v1'),
      wraithCount:Prototype.game.zone().enemies.filter(e=>e.species==='wraith'&&e.hp>0).length
    }));
    assert((await gpu.screenshot({path:path.join(out,'marches-wraith-pixi-opt-on.png')})).length>1024);
    await page.evaluate(()=>{
      const g=Prototype.game, id=window.__environment708Wraith.id;
      g.zone().enemies=g.zone().enemies.filter(e=>e.id!==id);
    });
    // Wait for the actual GPU scene to consume the changed Wraith list.
    // A 240ms wall-clock sleep was flaky under software WebGL2 + adaptive
    // frame skipping; an observed light-count transition is the real gate.
    await page.waitForFunction((expected)=>
      Prototype.experimentalGraphics.mode==='webgl2' &&
      Prototype.experimentalGraphics.sceneMetrics?.lights===expected,
      withWraithOn.lights-2,{timeout:30000, polling:250});
    const withoutWraith=await page.evaluate(()=>({
      mode:Prototype.experimentalGraphics.mode,
      zone:Prototype.game.zoneId,
      optimized:Prototype.experimentalGraphics.backgroundOptimized,
      optimizationSetting:localStorage.getItem('azeroth-optimization-mode-v1'),
      lights:Prototype.experimentalGraphics.sceneMetrics?.lights,
      motes:Prototype.experimentalGraphics.sceneMetrics?.atmosphereMotes,
      sourceCount:Prototype.game.zone().enemies.filter(e=>e.species==='wraith'&&e.hp>0).length
    }));
    assert((await gpu.screenshot({path:path.join(out,'marches-no-wraith-pixi.png')})).length>1024);
    const result={scene,withWraithOff:withWraith,withWraithOn,withoutWraithOn:withoutWraith,errors};
    fs.writeFileSync(path.join(out,'wraith-lamp-result.json'),JSON.stringify(result,null,2)+'\n');
    console.log('ATMOSPHERE-708-WRAITH-PIXELS '+JSON.stringify(result));
    assert.equal(withoutWraith.mode,'webgl2');
    assert.deepEqual(errors,[], 'No page errors during actual atmosphere painting');
    assert.equal(withWraith.gameSame,true,'GPU transition replaced the live campaign');
    assert.equal(withWraith.wraithAlive,true,'Wraith must still exist before computing GPU light parity');
    assert.equal(withWraith.optimizationSetting,'off','Initial Off preference must be selected');
    assert.equal(withWraithOn.optimizationSetting,'on','Controlled On preference must persist');
    assert.equal(withWraithOn.optimized,true);
    assert.equal(withoutWraith.optimizationSetting,'on','Same On preference must persist after Wraith removal');
    assert.equal(withoutWraith.optimized,true,'No emergency state transition across compared frames');
    assert.equal(withWraithOn.wraithCount,1,
      'Matched-source comparison must contain only one injected living Wraith');
    assert.equal(withoutWraith.sourceCount,0,
      'All Wraiths must be absent in the paired no-lamp screenshot');
    assert.equal(withWraithOn.lights,withoutWraith.lights+2,
      'V-01: Pixi must add one radius-64 Wraith lantern glow and one glass light in matched Optimization On frames');
    assert.equal(withWraithOn.motes,0);
    assert.equal(withoutWraith.motes,0,
      'Optimization On intentionally suppresses optional motes, not carried lamps');
    console.log('PASS #708 actual game Canvas/Pixi Wraith-night screenshot and two GPU lamp nodes');
    await context.close();
  }finally{
    await browser?.close();
    if(server.listening)await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(e=>{console.error(e);process.exitCode=1});
