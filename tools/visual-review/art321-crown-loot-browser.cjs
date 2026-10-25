'use strict';
// Art Catalog #321 — isolated, opt-in real-browser paired evidence capture.
// Run: node tools/visual-review/art321-crown-loot-browser.cjs
// Requires repo devDependencies and real Chromium with WebGL2 (software WebGL2
// is valid for correctness; this does NOT establish phone/hardware performance).
// Never alters saved user data, source assets, CI workflows or game rules.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const playwright = require('playwright');
const root = path.resolve(__dirname, '../..');
const sourceSha = cp.execFileSync('git', ['rev-parse', 'HEAD'], {cwd:root,encoding:'utf8'}).trim();
const out = path.resolve(process.env.ART321_OUTPUT || path.join(os.tmpdir(),'azeroth-art321-crown-loot-'+sourceSha.slice(0,12)));
fs.mkdirSync(out,{recursive:true});
const types = {'.html':'text/html','.js':'application/javascript','.json':'application/json',
  '.css':'text/css','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg',
  '.ogg':'audio/ogg'};
const server = http.createServer((req,res)=>{
  let filename;
  try {filename=path.resolve(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '')||'index.html');}
  catch {res.writeHead(400);res.end('Invalid path');return;}
  if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()){
    res.writeHead(404);res.end('Not found');return;
  }
  res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream'});
  fs.createReadStream(filename).pipe(res);
});
function installedChromium(){
  if(process.env.CHROMIUM_EXECUTABLE)return process.env.CHROMIUM_EXECUTABLE;
  for(const binary of ['google-chrome','google-chrome-stable','chromium','chromium-browser'])
    try{return cp.execFileSync('which',[binary],{encoding:'utf8'}).trim()}catch{}
  return null;
}
function sha256(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
async function probe(page,backend,png){
  const evidence=await page.evaluate(()=>{
    const g=Prototype.game,r=Prototype.renderer,world=document.getElementById('world');
    const gpu=Prototype.experimentalGraphics,ctx=world.getContext('2d');
    const rect=world.getBoundingClientRect(),w=rect.width,h=rect.height;
    if(!ctx||w<300||h<300)throw Error('Real world Canvas unavailable');
    const at=r.world(w*.68,h*.48);
    const loot={id:'art321-crown-loot-fixture',zone:g.zoneId,x:at.x,y:at.y,gold:1};
    const point=r.screen(loot),ratioX=world.width/w,ratioY=world.height/h;
    const radius=Math.max(18,Math.ceil(16*(Prototype.platform.cameraZoom||1)*Math.max(ratioX,ratioY)));
    const x=Math.max(0,Math.floor(point.x*ratioX-radius)),y=Math.max(0,Math.floor(point.y*ratioY-radius));
    const sampleWidth=Math.min(world.width-x,radius*2+1),
      sampleHeight=Math.min(world.height-y,radius*2+1);
    if(sampleWidth<20||sampleHeight<20)throw Error('Invalid pixel crop');
    const take=()=>{r.draw();return ctx.getImageData(x,y,sampleWidth,sampleHeight).data;};
    const before=take();
    g.s.loot.push(loot);
    const after=take();
    let changed=0,sum=0;
    for(let i=0;i<before.length;i+=4){
      const d=Math.abs(before[i]-after[i])+Math.abs(before[i+1]-after[i+1])+
        Math.abs(before[i+2]-after[i+2])+Math.abs(before[i+3]-after[i+3]);
      if(d>=32)changed++;sum+=d;
    }
    window.__art321Cleanup=()=>{
      const index=g.s.loot.indexOf(loot);
      if(index>=0)g.s.loot.splice(index,1);
      delete window.__art321Cleanup;
      r.draw();
    };
    return {
      renderer:gpu.mode,phase:gpu.phase,zone:g.zoneId,point:{x:point.x,y:point.y},
      cameraZoom:Prototype.platform.cameraZoom,viewport:{width:w,height:h},
      backing:{width:world.width,height:world.height},
      gpuActors:gpu.sceneMetrics?.actors??null,
      gpuTextures:gpu.sceneMetrics?.textureSources??null,
      samplePixels:sampleWidth*sampleHeight,changedPixels:changed,pixelDifference:sum,
      state:'deterministic temporary Campaign.s.loot fixture',
    };
  });
  try {
    assert.equal(evidence.renderer,backend,
      'Pixel evidence must be attributed to actual renderer, never Canvas fallback');
    if(backend==='webgl2')
      assert(evidence.gpuActors>0&&evidence.gpuTextures>0,'WebGL actors/textures not drawn');
    if(backend==='canvas2d')
      assert(evidence.changedPixels>25&&evidence.pixelDifference>2000,
        'Actual canvas coin pixels must differ from the same image without loot');
    await page.screenshot({path:png,animations:'disabled'});
    return {...evidence,screenshot:path.basename(png),screenshotSha256:sha256(png)};
  } finally {
    await page.evaluate(()=>window.__art321Cleanup?.());
  }
}
async function run(){
  let browser;
  try{
    if(!fs.existsSync(path.join(root,'assets/vendor/pixi-8.22.0.min.js')))
      cp.execFileSync(process.execPath,['scripts/vendor-pixi.cjs','--ensure'],{cwd:root,stdio:'inherit'});
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const binary=installedChromium();
    browser=await playwright.chromium.launch({...(binary?{executablePath:binary}:{}),
      args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle',
        '--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const context=await browser.newContext({viewport:{width:1280,height:800}});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
    await page.waitForFunction(()=>!!window.Prototype?.renderer);
    await require('../../tests/helpers/language-browser.cjs').selectEnglish(page);
    await page.keyboard.press('f');
    await page.keyboard.press('f');
    await page.waitForFunction(()=>document.querySelector('#modal').hidden);
    const canvas=await probe(page,'canvas2d',path.join(out,'canvas-with-coin.png'));
    await page.locator('#menu-button').click();
    await page.getByRole('button',{name:'Game and settings',exact:true}).click();
    await page.getByRole('button',{name:'Screen and performance',exact:true}).click();
    await page.locator('select[aria-label="Graphics renderer"]').selectOption('webgl2');
    await page.waitForFunction(()=>{
      const g=Prototype.experimentalGraphics;
      return g.phase==='trial'||(g.phase==='canvas'&&!!g.lastError);
    },null,{timeout:45000});
    let state=await page.evaluate(()=>Prototype.experimentalGraphics);
    assert.equal(state.mode,'webgl2','Pixi did not actually initialize: '+JSON.stringify(state.lastFailure));
    await page.getByRole('button',{name:'Keep WebGL2'}).click();
    state=await page.evaluate(()=>Prototype.experimentalGraphics);
    assert.equal(state.phase,'confirmed','WebGL2 trial was not confirmed');
    const pixi=await probe(page,'webgl2',path.join(out,'pixi-with-coin.png'));
    assert.equal(canvas.zone,pixi.zone,'Capture used different region');
    assert.equal(canvas.cameraZoom,pixi.cameraZoom,'Capture used different camera zoom');
    assert.deepEqual(canvas.viewport,pixi.viewport,'Capture used different viewport');
    const report={
      kind:'art-catalog-321-crown-loot-paired-evidence-v1',
      sourceCommit:sourceSha,engine:'chromium',captureType:'real software WebGL2',
      gameSimulation:'one disposable browser Campaign',
      canvas,pixi,
      limitations:[
        'Test fixture injected using the real game.s.loot object shape; not a recorded enemy kill.',
        'Pixel differences measure world Canvas 2D surface; in Pixi that surface is the transparent cue overlay.',
        'PNG files are composed page captures at each mode, not owner-accepted visual golden masters.',
        'A zero Pixi overlay delta cannot independently rule out a separate GPU sprite; verify source candidates.',
        'No device hardware performance or pixel-perfect equivalence is claimed.'
      ],
      errors
    };
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(report,null,2)+'\n');
    console.log('PASS Art321 real paired browser capture '+JSON.stringify({
      sourceCommit:sourceSha,canvasChanged:canvas.changedPixels,pixiOverlayChanged:pixi.changedPixels,
      activeMode:pixi.renderer,output:out,
    }));
    await context.close();
  }finally{
    await browser?.close();
    if(server.listening)await new Promise(resolve=>server.close(resolve));
  }
}
run().catch(err=>{console.error(err);process.exitCode=1});
