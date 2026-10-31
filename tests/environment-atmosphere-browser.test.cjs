'use strict';
// #708 targeted real Chromium scene reproduction; no gameplay code or save changes.
// Failing V-01 contract is intentional until the separate corrective PR lands.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const cp = require('node:child_process');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
async function compareCrop(first,second,rect) {
  const a=await loadImage(first),b=await loadImage(second);
  assert.equal(a.width,b.width); assert.equal(a.height,b.height);
  const c=createCanvas(rect.width,rect.height),ctx=c.getContext('2d');
  ctx.drawImage(a,rect.x,rect.y,rect.width,rect.height,0,0,rect.width,rect.height);
  const left=ctx.getImageData(0,0,rect.width,rect.height).data;
  ctx.clearRect(0,0,rect.width,rect.height);
  ctx.drawImage(b,rect.x,rect.y,rect.width,rect.height,0,0,rect.width,rect.height);
  const right=ctx.getImageData(0,0,rect.width,rect.height).data;
  let changed=0,blue=0;
  for(let i=0;i<left.length;i+=4) {
    if(Math.max(Math.abs(left[i]-right[i]),Math.abs(left[i+1]-right[i+1]),
      Math.abs(left[i+2]-right[i+2]))>5)changed++;
    if(left[i+2]>left[i]*1.08 && left[i+1]>left[i]*1.08)blue++;
  }
  return {changedPixels:changed,blueTintPixels:blue,regionPixels:rect.width*rect.height};
}

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
      motes:Prototype.experimentalGraphics.sceneMetrics?.atmosphereMotes,
      optimized:Prototype.experimentalGraphics.backgroundOptimized,
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
      motes:Prototype.experimentalGraphics.sceneMetrics?.atmosphereMotes,
      optimized:Prototype.experimentalGraphics.backgroundOptimized
    }));
    assert((await gpu.screenshot({path:path.join(out,'marches-no-wraith-pixi.png')})).length>1024);
    const result={scene,withWraith,withoutWraith,errors};
    fs.writeFileSync(path.join(out,'wraith-lamp-result.json'),JSON.stringify(result,null,2)+'\n');
    console.log('ATMOSPHERE-708-WRAITH-PIXELS '+JSON.stringify(result));
    assert.equal(withoutWraith.mode,'webgl2');
    assert.deepEqual(errors,[], 'No page errors during actual atmosphere painting');
    assert.equal(withWraith.lights,withoutWraith.lights,
      'V-01 diagnostic baseline: uncorrected Pixi is missing both Wraith lantern glows; a change requires reassessment');
    console.log('REPRODUCED V-01 uncorrected Pixi: Wraith carried-glass GPU lights absent; THIS IS NOT A PARITY PASS');
    // Software WebGL2 can legitimately trigger the emergency Optimization
    // override even when the saved preference was Off. The mode transition
    // suppresses ambient motes; never mislabel this as a Wraith-light defect.
    if(withWraith.optimized===withoutWraith.optimized) {
      assert.equal(withWraith.motes,withoutWraith.motes,
        'At a matched effective Optimization tier, removing a Wraith cannot alter motes');
    } else {
      console.log('OBSERVED EMERGENCY OPTIMIZATION OVERRIDE: '+withWraith.motes+
        ' to '+withoutWraith.motes+' motes; tier changed during software-GPU scene');
    }
    console.log('PASS #708 audit repro and screenshots; V-01 renderer parity remains FAILED on baseline main');

    // V-04: prove or disprove the stationary Pixi cached-water case using
    // actual GPU-presented and native Canvas frames. Keep the camera and
    // current night phase fixed, with optional motes disabled in both paths.
    await page.locator('#menu-button').click();
    await page.getByRole('button',{name:'Game and settings',exact:true}).click();
    await page.getByRole('button',{name:'Screen and performance',exact:true}).click();
    await page.locator('select[aria-label="Optimization Mode"]').selectOption('on');
    await page.evaluate(()=>Prototype.closeMenu());
    const waterSite=await page.evaluate(()=>{
      const g=Prototype.game;
      g.hero.x=1400;g.hero.y=1450;g.hero.order=null;g.hero.path=[];
      g.s.clock=480;g.zone().enemies=[];g.s.party=[];g.zone().npcs=[];
      return {region:g.zoneId,hero:{x:g.hero.x,y:g.hero.y},
        water:{x:1700,y:1450},optimizationSetting:localStorage.getItem('azeroth-optimization-mode-v1')};
    });
    assert.equal(waterSite.region,'march');
    assert.equal(waterSite.optimizationSetting,'on');
    await page.waitForFunction(()=>Prototype.experimentalGraphics.backgroundOptimized===true);
    await page.waitForTimeout(700);
    const waterCrop={x:765,y:315,width:340,height:250};
    const gpuClockStart=await page.evaluate(()=>Prototype.game.s.clock);
    const pixiA=await gpu.screenshot({path:path.join(out,'marches-stationary-water-pixi-t0.png')});
    await page.waitForTimeout(1350);
    const pixiB=await gpu.screenshot({path:path.join(out,'marches-stationary-water-pixi-t1.png')});
    const gpuClockEnd=await page.evaluate(()=>Prototype.game.s.clock);
    const pixiWater=await compareCrop(pixiA,pixiB,waterCrop);
    // Switch the original renderer, not a mocked variant, without changing
    // the admitted Campaign, hero position, lighting or Optimization tier.
    await page.locator('#menu-button').click();
    await page.getByRole('button',{name:'Game and settings',exact:true}).click();
    await page.getByRole('button',{name:'Screen and performance',exact:true}).click();
    await page.locator('select[aria-label="Graphics renderer"]').selectOption('canvas2d');
    await page.evaluate(()=>Prototype.closeMenu());
    await page.waitForFunction(()=>Prototype.experimentalGraphics.mode==='canvas2d');
    await page.waitForTimeout(250);
    const canvasClockStart=await page.evaluate(()=>Prototype.game.s.clock);
    const canvasA=await canvas.screenshot({path:path.join(out,'marches-stationary-water-canvas-t0.png')});
    await page.waitForTimeout(1350);
    const canvasB=await canvas.screenshot({path:path.join(out,'marches-stationary-water-canvas-t1.png')});
    const canvasClockEnd=await page.evaluate(()=>Prototype.game.s.clock);
    const canvasWater=await compareCrop(canvasA,canvasB,waterCrop);
    const waterResult={site:waterSite,clip:waterCrop,pixi:pixiWater,canvas:canvasWater,
      clock:{pixiStart:gpuClockStart,pixiEnd:gpuClockEnd,
        canvasStart:canvasClockStart,canvasEnd:canvasClockEnd},
      context:'Same stationary region/camera with effective Optimization On, night and actors removed; Canvas vs WebGL2 screenshot crop; both paths may intentionally reuse static terrain in this tier. NOT a proof of Off-mode shimmer parity or lack thereof.'};
    fs.writeFileSync(path.join(out,'stationary-water-result.json'),
      JSON.stringify(waterResult,null,2)+'\n');
    console.log('ATMOSPHERE-708-STATIONARY-WATER-PIXELS '+JSON.stringify(waterResult));
    assert(pixiWater.blueTintPixels>1000 && canvasWater.blueTintPixels>1000,
      'V-04 screenshots must actually show the blue channel rather than an unrelated roadside');
    // An actual controlled run showed NO temporal changes in either renderer
    // while Optimization On was selected. Original native Canvas Off-mode
    // rendering IS time-dependent, but this optimized browser pair cannot
    // isolate a Pixi regression; record the evidence without overclaiming.
    if(canvasWater.changedPixels===0 && pixiWater.changedPixels===0)
      console.log('V-04 INCONCLUSIVE (optimization-on): stationary Canvas and Pixi crops are both static; no Pixi-only water defect established');
    else console.log('V-04 OPTIMIZATION-ON OBSERVATION: Canvas changed '+canvasWater.changedPixels+
      ' pixels; Pixi changed '+pixiWater.changedPixels+
      '. Inspect artifacts and actual effective tier before making a defect claim');
    // V-04 follow-up. The earlier stationary water capture was explicitly
    // Optimization On and static in BOTH renderers. Make a controlled attempt
    // at effective Off on two original channels before proposing any cache fix.
    // Under software-WebGL load an emergency override can still force On:
    // record that fact instead of asserting that a saved Off preference won.
    const offSites=[
      {region:'crown',name:'crown-lava',hero:{x:1050,y:1700},hazard:{x:1350,y:1700}},
      {region:'march',name:'marches-water',hero:{x:1080,y:1690},hazard:{x:1420,y:1690}},
    ];
    async function setAuditSite(site){
      const result=await page.evaluate((s)=>{
        const g=Prototype.game;
        if(!g.enter(s.region)) throw Error('Failed current-region entry '+s.region);
        g.s.clock=480;
        Object.assign(g.hero,s.hero);
        g.hero.order=null;
        g.hero.path=[];
        g.zone().enemies=[];
        g.zone().npcs=[];
        g.s.party=[];
        return {zone:g.zoneId,phase:g.daylightPhase().phase,
          hero:{x:g.hero.x,y:g.hero.y},clock:g.s.clock};
      },site);
      assert.equal(result.zone,site.region,'Unexpected V-04 location');
      assert.equal(result.phase,'night','V-04 night must stay away from twilight');
      return result;
    }
    async function sampleOff(site,engine){
      const world=await setAuditSite(site);
      const rect=await page.evaluate((s)=>{
        // Native Canvas and Pixi have a shared screen projection. Follow the
        // authored water/lava coordinate, not a guessed fixed screen crop.
        const p=Prototype.renderer.screen(s.hazard);
        const width=180,height=170;
        return {x:Math.max(0,Math.min(1180-width,Math.round(p.x-width/2))),
          y:Math.max(0,Math.min(750-height,Math.round(p.y-height/2))),
          width,height,projected:p};
      },site);
      const crop={x:rect.x,y:rect.y,width:rect.width,height:rect.height};
      const control={...crop,x:Math.max(0,Math.min(1180-crop.width,crop.x-215))};
      const surface=engine==='canvas2d'?canvas:gpu;
      await page.waitForTimeout(1300);
      const first=await surface.screenshot({path:path.join(out,site.name+'-'+engine+'-off-attempt-t0.png')});
      const initial=await page.evaluate(()=>({
        mode:Prototype.experimentalGraphics.mode,
        savedPreference:localStorage.getItem('azeroth-optimization-mode-v1'),
        canvasEffective:Prototype.renderer.metrics().optimizationMode,
        pixiEffectiveOptimized:Prototype.experimentalGraphics.backgroundOptimized,
        clock:Prototype.game.s.clock,
      }));
      await page.waitForTimeout(2600);
      const second=await surface.screenshot({path:path.join(out,site.name+'-'+engine+'-off-attempt-t1.png')});
      const final=await page.evaluate(()=>({
        mode:Prototype.experimentalGraphics.mode,
        savedPreference:localStorage.getItem('azeroth-optimization-mode-v1'),
        canvasEffective:Prototype.renderer.metrics().optimizationMode,
        pixiEffectiveOptimized:Prototype.experimentalGraphics.backgroundOptimized,
        clock:Prototype.game.s.clock,
      }));
      assert.equal(initial.mode,engine,'Renderer silently changed during V-04');
      assert.equal(final.mode,engine,'Renderer silently fell back during V-04');
      return {site:site.name,world,crop,control,
        hazardDiff:await compareCrop(first,second,crop),
        controlDiff:await compareCrop(first,second,control),initial,final,
        interpretation:'A rendered screenshot difference alone can contain moving atmospheric motes, not just liquid shimmer; inspect pixels and effective optimization before diagnosing terrain.'};
    }
    // The current mode is Canvas after the earlier Optimization-On pair.
    await page.locator('#menu-button').click();
    await page.getByRole('button',{name:'Game and settings',exact:true}).click();
    await page.getByRole('button',{name:'Screen and performance',exact:true}).click();
    await page.locator('select[aria-label="Optimization Mode"]').selectOption('off');
    await page.evaluate(()=>Prototype.closeMenu());
    const offEvidence=[];
    for(const site of offSites) offEvidence.push(await sampleOff(site,'canvas2d'));
    await page.locator('#menu-button').click();
    await page.getByRole('button',{name:'Game and settings',exact:true}).click();
    await page.getByRole('button',{name:'Screen and performance',exact:true}).click();
    await page.locator('select[aria-label="Graphics renderer"]').selectOption('webgl2');
    await page.waitForFunction(()=>{
      const r=Prototype.experimentalGraphics;
      return r.mode==='webgl2' && (r.phase==='trial'||r.phase==='confirmed') ||
        r.phase==='canvas' && !!r.lastError;
    },null,{timeout:240000});
    if( (await page.evaluate(()=>Prototype.experimentalGraphics.phase))==='trial'){
      await page.locator('#gpu-renderer-trial button').first().click({timeout:8000});
      await page.waitForFunction(()=>Prototype.experimentalGraphics.phase==='confirmed');
    }
    await page.evaluate(()=>Prototype.closeMenu());
    for(const site of [offSites[1],offSites[0]])
      offEvidence.push(await sampleOff(site,'webgl2'));
    const v04={
      scope:'Actual game, same authored Marches water and Crown lava site per renderer; saved Optimization Off requested. Does not claim effective Off if emergency override intervenes.',
      views:offEvidence,errors,
    };
    fs.writeFileSync(path.join(out,'stationary-liquid-off-attempt-result.json'),
      JSON.stringify(v04,null,2)+'\n');
    console.log('ATMOSPHERE-708-V04-EFFECTIVE-OFF-ATTEMPT '+JSON.stringify(v04));
    assert.deepEqual(errors,[],'No page errors during V-04 real browser attempts');
    await context.close();
  }finally{
    await browser?.close();
    if(server.listening)await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(e=>{console.error(e);process.exitCode=1});
