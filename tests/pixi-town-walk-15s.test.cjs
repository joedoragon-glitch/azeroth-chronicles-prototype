'use strict';
// One-off, strictly focused live-Campaign town walk for the owner.
// Runs only on a disposable browser profile. Never writes to a real save or
// changes the game's source. The Linux runner is NOT an iPhone FPS benchmark.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const cp = require('node:child_process');
const playwright = require('playwright');
const root = path.resolve(__dirname, '..');
const pixiFile = path.join(root, 'assets/vendor/pixi-8.22.0.min.js');
if (!fs.existsSync(pixiFile))
  cp.execFileSync(process.execPath, ['scripts/vendor-pixi.cjs', '--ensure'], {cwd:root,stdio:'inherit'});
const types = {'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.woff2':'font/woff2'};
const server = http.createServer((req,res) => {
  const name = decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
  const file = path.resolve(root,name);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
function chromePath() {
  if (process.env.CHROMIUM_EXECUTABLE) return process.env.CHROMIUM_EXECUTABLE;
  for (const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser']) {
    try {return cp.execFileSync('which',[name],{encoding:'utf8'}).trim();} catch (_) {}
  }
  return null;
}
async function main() {
  let browser;
  try {
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    const binary = chromePath();
    const opts = {
      headless:true,
      args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
        '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
    };
    if (binary) opts.executablePath=binary;
    browser = await playwright.chromium.launch(opts);
    // Approximate the owner's CSS viewport/backing density, NOT mobile GPU hardware.
    const context = await browser.newContext({
      viewport:{width:912,height:420},deviceScaleFactor:3,isMobile:true,hasTouch:true
    });
    const page = await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e?.message||e)));
    await page.goto('http://127.0.0.1:'+server.address().port+'/phone.html',
      {waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForFunction(()=>!!window.Prototype?.game,{timeout:45000});
    await require('./helpers/language-browser.cjs').selectEnglish(page);
    await page.keyboard.press('f');
    await page.keyboard.press('f');
    await page.waitForFunction(()=>document.querySelector('#modal')?.hidden,{timeout:45000});
    await page.evaluate(() => {
      // Renderer test only: use standard 30-FPS setting with auto sharpness.
      Prototype.fps.select('30');
      Prototype.frameSkip.select(false);
      Prototype.renderResolution.select('auto');
      const g=Prototype.game;
      if(g.zoneId!=='vale')g.enter('vale');
      const town=g.zone().npcs.find(n=>n.kind==='rest');
      if(town){
        // Place this isolated test run near an established settlement NPC.
        g.hero.x=town.x+120; g.hero.y=town.y+80;
      }
      g.hero.order=null;
      g.hero.path=[];
    });
    await page.locator('#menu-button').click();
    await page.getByRole('button',{name:'Game and settings',exact:true}).click();
    await page.getByRole('button',{name:'Screen and performance',exact:true}).click();
    const selector=page.locator('select[aria-label="Graphics renderer"]');
    await selector.waitFor({state:'visible'});
    await selector.selectOption('webgl2');
    await page.waitForFunction(() =>
      Prototype.experimentalGraphics.phase !== 'preparing',null,{timeout:45000});
    const selection=await page.evaluate(()=>Prototype.experimentalGraphics);
    if(selection.mode!=='webgl2'){
      console.log('INCONCLUSIVE_WEBGL2_UNAVAILABLE '+JSON.stringify({selection,errors}));
      throw Error('Headless CI cannot initialize Pixi WebGL2; this is not an iPhone failure');
    }
    await page.getByRole('button',{name:'Keep WebGL2'}).click({timeout:10000});
    assert.equal(await page.evaluate(()=>Prototype.experimentalGraphics.phase),'confirmed');
    const first = await page.evaluate(() => ({
      hero:{x:Prototype.game.hero.x,y:Prototype.game.hero.y},
      graphics:Prototype.experimentalGraphics
    }));
    const frames=[];
    const keys=['d','s','a','w'];
    // Real key-down movement for exactly 4 x 3.75 seconds = ~15s walking.
    for (const key of keys) {
      await page.keyboard.down(key);
      await page.waitForTimeout(3750);
      await page.keyboard.up(key);
      const entry=await page.evaluate(() => ({
        hero:{x:Prototype.game.hero.x,y:Prototype.game.hero.y},
        renderer:Prototype.experimentalGraphics,
        profile:Prototype.frameProfile.report(),
        runtime:Prototype.runtime.report(Prototype.renderer.metrics(),'phone'),
        target:Prototype.fps.target
      }));
      frames.push({key,...entry});
      if(entry.renderer.mode!=='webgl2') break;
    }
    const last=frames.at(-1);
    const totalTravel=frames.reduce((sum,row,i)=>{
      const prior=i?frames[i-1].hero:first.hero;
      return sum+Math.hypot(row.hero.x-prior.x,row.hero.y-prior.y);
    },0);
    const report={
      label:'Focused Pixi WebGL2 15-second town walk (automated Chromium)',
      browser:'Linux Chromium software ANGLE/SwiftShader; not iPhone GPU or iOS WebKit',
      viewport:{width:912,height:420,dpr:3},
      durationSeconds:keys.length*3.75,
      initial:first,
      windows:frames.map(v=>({
        key:v.key,
        hero:v.hero,
        renderer:v.renderer,
        fpsTarget:v.target,
        callbackRate:v.profile.callbackFps,
        issuedDrawRate:v.profile.displayedFps,
        renderMeanMs:v.profile.stages.renderMs.meanMs,
        renderP95Ms:v.profile.stages.renderMs.p95Ms,
        drawnFrames:v.profile.drawnFrames,
        activeFrames:v.profile.activeFrames,
        proceduralBytes:v.renderer.proceduralBytes,
        proceduralTextures:v.renderer.proceduralTextures
      })),
      totalTravelWorldUnits:Math.round(totalTravel),
      finalMode:last.renderer.mode,
      finalPhase:last.renderer.phase,
      lastError:last.renderer.lastError,
      lastFallbackReason:last.renderer.lastFallbackReason,
      pageErrors:errors,
    };
    console.log('PIXITOWN_WALK_RESULT '+JSON.stringify(report));
    assert(totalTravel>20,'No meaningful movement: inputs did not move the hero');
    assert.equal(last.renderer.mode,'webgl2','The renderer fell back while walking');
    assert.equal(last.renderer.phase,'confirmed','The Pixi mode stopped being confirmed');
    assert(!errors.length,'Uncaught browser error during walk: '+errors.join(' | '));
    console.log('PASS 15-second real-input Pixi town walk retained WebGL2');
    await context.close();
  } finally {
    await browser?.close();
    if (server.listening) await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error('PIXITOWN_WALK_FAILURE',error);process.exitCode=1;});
