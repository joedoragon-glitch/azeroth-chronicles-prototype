'use strict';
/**
 * Art #321 read-only first facing probe. This deliberately DOES NOT repair
 * procedural art, change gameplay or publish. One inert custom orc actor,
 * fixed position and camera, two opposite targets; capture real Canvas and
 * actual confirmed WebGL2 page-composited PNGs and state-specific hashes.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),
      cp=require('node:child_process'),crypto=require('node:crypto'),http=require('node:http');
const sharp=require('sharp'),playwright=require('playwright');
const root=path.resolve(__dirname,'../..');
const sha=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const out=path.resolve(process.env.ART321_OUTPUT||path.join(os.tmpdir(),'art321-facing-'+sha.slice(0,12)));
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{
 let file;
 try{file=path.resolve(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '')||'index.html');}
 catch {res.writeHead(400);res.end('Invalid URL');return;}
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
  res.writeHead(404);res.end('Not found');return;
 }
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
 fs.createReadStream(file).pipe(res);
});
const digest=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
async function diff(a,b){
 const u=await sharp(a).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const v=await sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.deepEqual([u.info.width,u.info.height,u.data.length],
   [v.info.width,v.info.height,v.data.length]);
 let changed=0,absolute=0;
 for(let i=0;i<u.data.length;i+=4){
  const d=Math.abs(u.data[i]-v.data[i])+Math.abs(u.data[i+1]-v.data[i+1])+
    Math.abs(u.data[i+2]-v.data[i+2])+Math.abs(u.data[i+3]-v.data[i+3]);
  if(d>=32)changed++;
  absolute+=d;
 }
 return {pixels:u.info.width*u.info.height,changed,absolute};
}
async function facing(page,side,backend,crop){
 const prior=await page.evaluate(()=>Prototype.experimentalGraphics.sceneMetrics?.spriteUpdates||0);
 const state=await page.evaluate((direction)=>{
  const g=Prototype.game,enemy=g.zone().enemies.find(e=>e.id==='art321-facing-orc');
  if(!enemy)throw Error('Missing isolated orc');
  const where=direction==='west'?{x:enemy.x-180,y:enemy.y+180}:{x:enemy.x+180,y:enemy.y-180};
  enemy.motion={target:where};
  // Canvas whole scene has its original paintedFacing() call. Pixi's
  // transparent layer does not draw bodies, so only real GPU frames count.
  Prototype.renderer.draw();
  return {direction,target:where,x:enemy.x,y:enemy.y,zone:g.zoneId,
   campaignTime:g.s.time,clock:g.s.clock,hero:{x:g.hero.x,y:g.hero.y},
   gpu:Prototype.experimentalGraphics.mode,phase:Prototype.experimentalGraphics.phase};
 },side);
 if(backend==='webgl2'){
  await page.waitForFunction(n=>Prototype.experimentalGraphics.mode==='webgl2'&&
    Prototype.experimentalGraphics.phase==='confirmed'&&
    Prototype.experimentalGraphics.sceneMetrics.spriteUpdates>n,prior,{timeout:20000});
 }
 assert.equal(await page.evaluate(()=>Prototype.paused),true);
 const file=path.join(out,backend+'-'+side+'.png');
 await page.screenshot({path:file,clip:crop,animations:'disabled'});
 assert.equal(await page.evaluate(()=>Prototype.experimentalGraphics.mode),backend);
 return {...state,filename:path.basename(file),sha256:digest(file)};
}
async function main(){
 let browser;
 try{
  if(!fs.existsSync(path.join(root,'assets/vendor/pixi-8.22.0.min.js')))
    cp.execFileSync(process.execPath,['scripts/vendor-pixi.cjs','--ensure'],{cwd:root,stdio:'inherit'});
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  const executable=process.env.CHROMIUM_EXECUTABLE||
   ['google-chrome','google-chrome-stable','chromium','chromium-browser']
    .map(v=>cp.spawnSync('which',[v],{encoding:'utf8'}).stdout.trim()).find(Boolean);
  browser=await playwright.chromium.launch({...(executable?{executablePath:executable}:{}),
   args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle',
         '--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});
  try{
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
   await page.waitForFunction(()=>!!window.Prototype?.renderer);
   await require('../../tests/helpers/language-browser.cjs').selectEnglish(page);
   await page.keyboard.press('f');await page.keyboard.press('f');
   await page.waitForFunction(()=>document.querySelector('#modal').hidden);
   await page.keyboard.press('p');
   assert.equal(await page.evaluate(()=>Prototype.paused),true);
   const scene=await page.evaluate(()=>{
    const g=Prototype.game,r=Prototype.renderer,w=document.getElementById('world').getBoundingClientRect();
    const world=r.world(w.width*.73,w.height*.61);
    const e=g.makeEnemy({species:'orc',name:'Inert facing audit',type:'mob',
      level:3,hp:100000,damage:0,gold:0,xp:0},world);
    e.id='art321-facing-orc';e.aggro=false;e.telegraph=null;e.rangedAim=null;
    e.path=[];e.returning=false;
    g.zone().enemies.push(e);
    const p=r.screen(e),x=w.left+p.x,y=w.top+p.y;
    const clip={x:Math.round(x-90),y:Math.round(y-150),width:180,height:205};
    if(clip.x<0||clip.y<0||clip.x+clip.width>innerWidth||
       clip.y+clip.height>innerHeight)throw Error('Body crop out of viewport');
    return {id:e.id,species:e.species,renderKind:'enemy',clip,
      projected:p,hero:{x:g.hero.x,y:g.hero.y},clock:g.s.clock,
      time:g.s.time,zoom:Prototype.platform.cameraZoom,zone:g.zoneId};
   });
   const canvas={east:await facing(page,'east','canvas2d',scene.clip),
                 west:await facing(page,'west','canvas2d',scene.clip)};
   const canvasDifference=await diff(path.join(out,'canvas2d-east.png'),path.join(out,'canvas2d-west.png'));
   await page.locator('#menu-button').click();
   await page.getByRole('button',{name:'Game and settings',exact:true}).click();
   await page.getByRole('button',{name:'Screen and performance',exact:true}).click();
   await page.locator('select[aria-label="Graphics renderer"]').selectOption('webgl2');
   await page.waitForFunction(()=>Prototype.experimentalGraphics.phase==='trial'||
     (Prototype.experimentalGraphics.phase==='canvas'&&!!Prototype.experimentalGraphics.lastError),
     null,{timeout:45000});
   assert.equal(await page.evaluate(()=>Prototype.experimentalGraphics.mode),'webgl2','No valid GPU scene');
   await page.getByRole('button',{name:'Keep WebGL2'}).click();
   await page.waitForFunction(()=>Prototype.experimentalGraphics.phase==='confirmed');
   await page.evaluate(()=>Prototype.closeMenu());
   await page.waitForFunction(()=>document.querySelector('#modal').hidden);
   const pixi={east:await facing(page,'east','webgl2',scene.clip),
               west:await facing(page,'west','webgl2',scene.clip)};
   const pixiDifference=await diff(path.join(out,'webgl2-east.png'),path.join(out,'webgl2-west.png'));
   assert.deepEqual(canvas.east.hero,pixi.east.hero);
   assert.equal(canvas.east.clock,pixi.east.clock);
   assert.equal(canvas.east.campaignTime,pixi.east.campaignTime);
   assert.equal(canvas.east.x,pixi.east.x);
   assert.equal(canvas.east.y,pixi.east.y);
   assert.equal(canvas.east.zone,pixi.east.zone);
   assert.equal(canvas.east.gpu,'canvas2d');
   assert.equal(pixi.east.gpu,'webgl2');
   assert(pixiDifference.pixels===canvasDifference.pixels);
   assert.deepEqual(errors,[],'No browser page errors permitted');
   const report={schema:'art321-procedural-facing-diagnostic-v1',sourceSha:sha,
     date:new Date().toISOString(),scene,canvas,pixi,
     canvasDifference,pixiDifference,
     labels:{result:'DIAGNOSTIC_ONLY_NOT_A_FIX',device:'SwiftShader software WebGL2',
      presumedSourceDifference:'Canvas paintedFacing mirrors body; Pixi procedural baker revision lacks facing',
      resultNotAssumed:'Interpret actual PNG changes before asserting any visible defect',
      physicalDeviceNotTested:true,acceptedArtNotModified:true}};
   fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(report,null,2)+'\n');
   console.log('ART321_FACING '+JSON.stringify({sha,actor:scene.id,canvas:canvasDifference,
     pixi:pixiDifference,backend:pixi.east.gpu,crop:scene.clip,output:out}));
   console.log('PASS Art321 first real Canvas/Pixi directional diagnostic capture');
  }finally{await context.close();}
 }finally{
  await browser?.close();
  if(server.listening)await new Promise(resolve=>server.close(resolve));
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
