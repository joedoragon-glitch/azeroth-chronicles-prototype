'use strict';
// Focused CI browser experiment: REAL native combat in Vale, then synthetic
// repeatable extra render pressure. This is policy verification, not Chromebook FPS.
const assert=require('node:assert/strict'),fs=require('node:fs'),
  path=require('node:path'),http=require('node:http'),cp=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'application/javascript',
  '.css':'text/css','.json':'application/json','.png':'image/png',
  '.webp':'image/webp','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname)
    .replace(/^\/+/,'')||'index.html';
  const file=path.resolve(root,name);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end('not found');return;
  }
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
function binary(){
  if(process.env.CHROMIUM_EXECUTABLE)return process.env.CHROMIUM_EXECUTABLE;
  for(const p of ['google-chrome','google-chrome-stable','chromium'])
    try{return cp.execFileSync('which',[p],{encoding:'utf8'}).trim()}catch(_){}
  return null;
}
async function run(){
  let browser,ctx;
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const exe=binary();
    browser=await chromium.launch({...(exe?{executablePath:exe}:{}),
      args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
        '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    ctx=await browser.newContext({viewport:{width:1100,height:700}});
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.setDefaultTimeout(20000);
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
    await page.waitForFunction(()=>!!window.Prototype?.renderer,null,{timeout:30000});
    await require('./helpers/language-browser.cjs').selectEnglish(page);
    await page.waitForFunction(()=>document.querySelector('#startup-update')?.hidden,
      null,{timeout:90000});
    if(!(await page.locator('#title-screen').evaluate(e=>e.hidden))){
      await page.locator('#title-new').click();
      await page.getByRole('button',{name:'New Normal game',exact:true}).click();
      await page.getByRole('button',{name:/^English(?: ✓)?$/}).click();
      await page.getByRole('button',
        {name:'Standard death and refuge recovery',exact:true}).click();
      await page.getByRole('button',{name:/Paladin/}).first().click();
    }
    await page.waitForFunction(()=>Prototype.started &&
      document.querySelector('#title-screen')?.hidden &&
      document.querySelector('#scene-loading')?.hidden!==false,
      null,{timeout:240000});
    await page.waitForFunction(()=>Prototype.experimentalGraphics.mode==='webgl2' &&
      Prototype.experimentalGraphics.active,null,{timeout:90000});
    await page.waitForFunction(()=>document.querySelector('#modal')?.hidden,
      null,{timeout:10000});
    const before=await page.evaluate(()=>{
      const g=Prototype.game,h=g.hero;
      g.zone().enemies.length=0;
      const pos=g.safe(h.x+80,h.y,g.zoneId);
      const e=g.makeEnemy({species:'goblin',level:1,hp:10000,damage:0,gold:0,xp:0},pos);
      e.aggro=true;g.zone().enemies.push(e);g.s.heroTarget=e.id;
      g.s.mercyTime=0;h.cd[0]=0;
      Prototype.fps.select('20');Prototype.closeMenu();Prototype.updateHUD();
      return {heroX:h.x,clock:g.s.time,enemy:e.id,
        ratio:Prototype.renderResolution.status().ratio,
        changes:Prototype.renderResolution.status().changes,
        optimization:Prototype.renderer.metrics().optimizationMode,
        renderer:Prototype.experimentalGraphics.mode,
        bakes:Prototype.experimentalGraphics.proceduralBakes};
    });
    assert.equal(before.renderer,'webgl2');
    await page.keyboard.down('d');await page.waitForTimeout(850);await page.keyboard.up('d');
    const combat=await page.evaluate(()=>({
      clock:Prototype.game.s.time,
      moved:Prototype.game.hero.x!==undefined,
      enemies:Prototype.game.zone().enemies.filter(e=>e.hp>0&&e.aggro).length
    }));
    assert(combat.clock>before.clock&&combat.enemies>0,
      'Actual live combat did not progress '+JSON.stringify(combat));
    // Forced 62-ms work inside REAL Canvas combat-overlay draws challenges
    // the old automatic rendering policy. Not representative hardware timing.
    await page.evaluate(()=>{
      const r=Prototype.renderer,old=r.draw;
      window.__combatPilotOriginal=old;window.__combatPilotDraws=0;
      r.draw=function(...args){
        const out=old.apply(this,args),until=performance.now()+62;
        while(performance.now()<until){}
        __combatPilotDraws++;return out;
      };
    });
    try{await page.waitForTimeout(9500)}
    finally{await page.evaluate(()=>{
      if(__combatPilotOriginal)Prototype.renderer.draw=__combatPilotOriginal;
      delete window.__combatPilotOriginal;
    }).catch(()=>{})}
    const after=await page.evaluate(()=>({
      clock:Prototype.game.s.time,
      renderer:Prototype.experimentalGraphics.mode,
      active:Prototype.experimentalGraphics.active,
      ratio:Prototype.renderResolution.status().ratio,
      changes:Prototype.renderResolution.status().changes,
      optimization:Prototype.renderer.metrics().optimizationMode,
      bakes:Prototype.experimentalGraphics.proceduralBakes,
      draws:window.__combatPilotDraws,
      emergencyEntries:Prototype.frameSkip.status().emergencyEntries,
      lastFailure:Prototype.experimentalGraphics.lastFailure
    }));
    console.log('P0_COMBAT_FIXED_QUALITY '+JSON.stringify({before,combat,after}));
    assert(after.draws>=16,'Insufficient real draws under combat stress');
    assert(after.clock>before.clock,'Combat simulation stopped');
    assert.equal(after.renderer,'webgl2','Unexpected GPU-to-Canvas fallback');
    assert(after.active,'Pixi must remain active');
    assert.equal(after.optimization,before.optimization,
      'Automatic optimization changed Pixi presentation');
    assert.equal(after.ratio,before.ratio,
      'Automatic render density changed during combat');
    assert.equal(after.changes,before.changes,
      'Adaptive resolution triggered during combat');
    assert.deepEqual(errors,[],'Browser page errors');
    console.log('PASS Pixi combat under controlled repeatable render pressure');
  }finally{
    await ctx?.close();await browser?.close();
    if(server.listening)await new Promise(resolve=>server.close(resolve));
  }
}
run().catch(e=>{console.error(e);process.exitCode=1;});
