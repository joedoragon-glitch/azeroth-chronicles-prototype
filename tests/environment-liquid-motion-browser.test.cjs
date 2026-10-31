'use strict';
// #708 V-04 actual Chromium Canvas↔Pixi water/lava parity, software GPU only.
// Keep the original focused four-sample contract; comprehensive hardware,
// zoom and recovery stress belong to later owner-device acceptance.
// Check camera stability so software GPU emergency rescue cannot fake motion.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const cp=require('node:child_process');
const playwright=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'test-artifacts','environment-708-liquid');
fs.mkdirSync(out,{recursive:true});
if(!fs.existsSync(path.join(root,'assets/vendor/pixi-8.22.0.min.js')))
  cp.execFileSync(process.execPath,['scripts/vendor-pixi.cjs','--ensure'],{cwd:root,stdio:'inherit'});
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json',
  '.css':'text/css','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '')||'index.html';
  const file=path.resolve(root,rel);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end('Not found');return;
  }
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
const bin=process.env.CHROMIUM_EXECUTABLE||
  ['google-chrome','google-chrome-stable','chromium','chromium-browser']
    .map(x=>{try{return cp.execFileSync('which',[x],{encoding:'utf8'}).trim()}catch{return null}})
    .find(Boolean);
async function diff(a,b,crop){
  const left=await loadImage(a),right=await loadImage(b);
  assert(left.width===right.width&&left.height===right.height);
  const ctx=createCanvas(crop.width,crop.height).getContext('2d');
  ctx.drawImage(left,crop.x,crop.y,crop.width,crop.height,0,0,crop.width,crop.height);
  const aa=ctx.getImageData(0,0,crop.width,crop.height).data;
  ctx.clearRect(0,0,crop.width,crop.height);
  ctx.drawImage(right,crop.x,crop.y,crop.width,crop.height,0,0,crop.width,crop.height);
  const bb=ctx.getImageData(0,0,crop.width,crop.height).data;
  let changed=0;
  for(let i=0;i<aa.length;i+=4)
    if(Math.max(Math.abs(aa[i]-bb[i]),Math.abs(aa[i+1]-bb[i+1]),
      Math.abs(aa[i+2]-bb[i+2]))>5)changed++;
  return changed;
}
const sites=[
  {name:'marches-water',zone:'march',hero:{x:1080,y:1690},hazard:{x:1420,y:1690}},
  {name:'crown-lava',zone:'crown',hero:{x:1050,y:1700},hazard:{x:1350,y:1700}},
];
async function main(){
  let browser;
  try {
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    browser=await playwright.chromium.launch({
      ...(bin?{executablePath:bin}:{}),
      args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
        '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],
    });
    const context=await browser.newContext({viewport:{width:1180,height:750}});
    const page=await context.newPage(), errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
    await page.waitForFunction(()=>!!window.Prototype?.renderer);
    await require('./helpers/language-browser.cjs').selectEnglish(page);
    if(await page.locator('#title-screen').evaluate(el=>!el.hidden)){
      await page.locator('#title-new').click();
      await page.getByRole('button',{name:'New Normal game',exact:true}).click();
      await page.getByRole('button',{name:/^English(?: ✓)?$/}).click();
      await page.getByRole('button',{name:'Standard death and refuge recovery',exact:true}).click();
      await page.getByRole('button',{name:/Paladin/}).first().click();
    }
    await page.waitForFunction(()=>!!window.Prototype?.started&&
      document.querySelector('#title-screen')?.hidden&&
      document.querySelector('#scene-loading')?.hidden!==false,
      null,{timeout:180000});
    await page.waitForFunction(()=>document.querySelector('#modal')?.hidden===true);
    async function options(renderer) {
      await page.locator('#menu-button').click();
      await page.getByRole('button',{name:'Game and settings',exact:true}).click();
      await page.getByRole('button',{name:'Screen and performance',exact:true}).click();
      await page.locator('select[aria-label="Optimization Mode"]').selectOption('on');
      if(renderer) await page.locator('select[aria-label="Graphics renderer"]').selectOption(renderer);
      if(renderer==='webgl2'){
        await page.waitForFunction(()=>Prototype.experimentalGraphics.phase==='trial' ||
          (Prototype.experimentalGraphics.phase==='canvas'&&!!Prototype.experimentalGraphics.lastError),
          null,{timeout:240000});
        assert.equal(await page.evaluate(()=>Prototype.experimentalGraphics.mode),'webgl2',
          'WebGL2 fell back before testing liquid parity');
        await page.locator('#gpu-renderer-trial button').first().click({timeout:8000});
        await page.waitForFunction(()=>Prototype.experimentalGraphics.phase==='confirmed');
      }
      await page.evaluate(()=>Prototype.closeMenu());
    }
    await options();
    const rows=[];
    async function sample(site,mode){
      const status=await page.evaluate(s=>{
        const g=Prototype.game;
        if(!g.enter(s.zone))throw Error('Could not enter current '+s.zone);
        Object.assign(g.hero,s.hero);
        g.hero.order=null;g.hero.path=[];
        g.s.clock=480;g.zone().enemies=[];g.zone().npcs=[];g.s.party=[];
        return {zone:g.zoneId,hero:{x:g.hero.x,y:g.hero.y},phase:g.daylightPhase().phase};
      },site);
      assert.equal(status.phase,'night');
      const p=await page.evaluate(s=>Prototype.renderer.screen(s.hazard),site);
      const crop={x:Math.max(0,Math.min(1000,Math.round(p.x-90))),
        y:Math.max(0,Math.min(580,Math.round(p.y-85))),width:180,height:170};
      const surface=page.locator(mode==='canvas2d'?'#world':'#world-pixi-experimental');
      await page.waitForTimeout(1100);
      const a=await surface.screenshot({path:path.join(out,site.name+'-'+mode+'-t0.png')});
      const first=await page.evaluate(s=>({
        renderer:Prototype.experimentalGraphics.mode,
        effective:Prototype.renderer.metrics().optimizationMode,
        pixiEffective:Prototype.experimentalGraphics.backgroundOptimized,
        liquidStrokes:Prototype.experimentalGraphics.sceneMetrics?.liquidStrokes,
        hero:{x:Prototype.game.hero.x,y:Prototype.game.hero.y},
        hazardScreen:Prototype.renderer.screen(s.hazard),
        zone:Prototype.game.zoneId,
      }),site);
      await page.waitForTimeout(2500);
      const b=await surface.screenshot({path:path.join(out,site.name+'-'+mode+'-t1.png')});
      const last=await page.evaluate(s=>({
        renderer:Prototype.experimentalGraphics.mode,
        effective:Prototype.renderer.metrics().optimizationMode,
        pixiEffective:Prototype.experimentalGraphics.backgroundOptimized,
        liquidStrokes:Prototype.experimentalGraphics.sceneMetrics?.liquidStrokes,
        hero:{x:Prototype.game.hero.x,y:Prototype.game.hero.y},
        hazardScreen:Prototype.renderer.screen(s.hazard),
        zone:Prototype.game.zoneId,
      }),site);
      const changed=await diff(a,b,crop);
      assert.equal(first.zone,site.zone,'sample began in another region');
      assert.equal(last.zone,site.zone,'sample ended in another region');
      // An emergency slow-render rescue correctly returns the hero to town;
      // reject that invalid still-camera screenshot rather than masking it.
      assert(Math.hypot(first.hero.x-last.hero.x,first.hero.y-last.hero.y)<1,
        'Software-GPU sample moved the hero (possible emergency refuge): '+JSON.stringify({first,last}));
      assert(Math.hypot(first.hazardScreen.x-last.hazardScreen.x,
        first.hazardScreen.y-last.hazardScreen.y)<1,
        'Camera moved during stationary liquid comparison');
      assert(first.hazardScreen.x>=crop.x&&first.hazardScreen.x<=crop.x+crop.width&&
        first.hazardScreen.y>=crop.y&&first.hazardScreen.y<=crop.y+crop.height,
        'Hazard must remain inside measured screenshot crop');
      assert.equal(first.renderer,mode,'unexpected renderer or silent fallback');
      assert.equal(last.renderer,mode,'late renderer fallback');
      assert.equal(first.effective,'on','Matched effective On required');
      assert.equal(last.effective,'on','Stable effective On required');
      if(mode==='webgl2'){
        assert.equal(first.pixiEffective,true);
        assert.equal(last.pixiEffective,true);
        assert(first.liquidStrokes>0&&last.liquidStrokes>0,
          'GPU scene must contain live glints at BOTH stationary capture times');
      }
      assert(changed>0,'Native '+site.name+' must visibly animate in '+mode+
        ', unlike the independently reproduced original static Pixi baseline');
      rows.push({site:site.name,mode,crop,changed,first,last});
    }
    for(const site of sites) await sample(site,'canvas2d');
    await options('webgl2');
    for(const site of sites) await sample(site,'webgl2');
    assert.deepEqual(errors,[],'No browser JS exceptions in actual rendered scenes');
    fs.writeFileSync(path.join(out,'liquid-motion-browser-result.json'),
      JSON.stringify({head:'issue 708 V-04 corrective candidate',rows,errors},null,2)+'\n');
    console.log('PASS #708 V-04 real Chromium: original water and lava shimmer move in Canvas AND software Pixi with static camera. '+JSON.stringify(rows));
    await context.close();
  }finally {
    await browser?.close();
    if(server.listening)await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(e=>{console.error(e);process.exitCode=1});
