'use strict';
/*
 * Art Catalog #321 — ONE real Chromium/SwiftShader 2D vs PixiJS paired capture.
 * AUDIT ONLY. No simulation, renderer, visual asset, save schema, or gameplay code edits.
 * Browser uses fresh, disposable storage; work stays inside a draft PR.
 *
 * Four screenshot conditions are saved: Canvas no coin/coin, and Pixi no coin/coin.
 * Both pixel-difference tests use actual Chromium PAGE COMPOSITES, not only the
 * Canvas cue overlay. Backend is asserted; fallback never counts as a Pixi pass.
 * Output is in ART321_OUTPUT (or temporary directory), not the game's repo.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const sharp = require('sharp');
const playwright = require('playwright');
const root = path.resolve(__dirname, '../..');
const sourceSha = cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const coverMode = process.env.ART321_COVER_BROWSER === '1';
const overrideClock = process.env.ART321_SCENE_CLOCK === undefined
  ? null : Number(process.env.ART321_SCENE_CLOCK);
if (overrideClock!==null)
  assert(Number.isFinite(overrideClock)&&overrideClock>=0&&overrideClock<600,
    'Night/daylight audit clock must be within the current 600-second authored cycle');
const out = path.resolve(process.env.ART321_OUTPUT ||
  path.join(os.tmpdir(),'azeroth-art321-crown-loot-'+sourceSha.slice(0,12)));
fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json',
  '.css':'text/css','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const server=http.createServer((req,res)=>{
  let filename;
  try{filename=path.resolve(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname)
    .replace(/^\/+/,'')||'index.html');}
  catch{res.writeHead(400);res.end('Invalid path');return;}
  if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)||
     !fs.statSync(filename).isFile()){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream',
    'Cache-Control':'no-store'});
  fs.createReadStream(filename).pipe(res);
});
function chromiumBinary(){
  if(process.env.CHROMIUM_EXECUTABLE)return process.env.CHROMIUM_EXECUTABLE;
  for(const cmd of ['google-chrome','google-chrome-stable','chromium','chromium-browser'])
    try{return cp.execFileSync('which',[cmd],{encoding:'utf8'}).trim()}catch{}
  return null;
}
const hash=(buffer)=>crypto.createHash('sha256').update(buffer).digest('hex');
async function compareImages(beforePath,afterPath){
  const a=await sharp(beforePath).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const b=await sharp(afterPath).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(a.info.width,b.info.width);
  assert.equal(a.info.height,b.info.height);
  assert.equal(a.data.length,b.data.length);
  let changed=0,deltaTotal=0,alphaChanged=0;
  for(let i=0;i<a.data.length;i+=4){
    const delta=Math.abs(a.data[i]-b.data[i])+
      Math.abs(a.data[i+1]-b.data[i+1])+
      Math.abs(a.data[i+2]-b.data[i+2])+
      Math.abs(a.data[i+3]-b.data[i+3]);
    if(delta>=32)changed++;
    if(a.data[i+3]!==b.data[i+3])alphaChanged++;
    deltaTotal+=delta;
  }
  return {totalPixels:a.info.width*a.info.height,changedPixels:changed,
    pixelDifference:deltaTotal,alphaChangedPixels:alphaChanged};
}
async function capture(page,backend){
  const info=await page.evaluate(()=>{
    const g=Prototype.game,r=Prototype.renderer,world=document.getElementById('world'),
      graphics=Prototype.experimentalGraphics,rect=world.getBoundingClientRect();
    if(!world.getContext('2d')||rect.width<300||rect.height<300)
      throw Error('World backing Canvas or viewport missing');
    // The cover variant uses an ACTUAL current-zone scenery object, not a
    // guessed sprite or dynamically created replacement asset. Crown loot is
    // canonically overlaid after all standing Canvas world entities.
    let cover=null;
    if(coverMode) {
      const options=(g.zone().props||[]).filter(p=>
        p && Number.isFinite(p.x)&&Number.isFinite(p.y) &&
        (p.structure||p.kind||p.name) && !p.interactionOnly)
        .map(p=>({p,screen:r.screen(p)}))
        .filter(item=>item.screen.x>175&&item.screen.x<rect.width-175&&
          item.screen.y>170&&item.screen.y<rect.height-160)
        .sort((a,b)=>{
          const quality=v=>
            /cottage|tower|tree|hut|barn|statue|arch|tent|shrine/i.test(
              String(v.p.structure||v.p.kind||v.p.name||'')) ? 0:1;
          return quality(a)-quality(b) ||
            Math.abs(a.screen.x-rect.width*.62)-Math.abs(b.screen.x-rect.width*.62);
        });
      if(!options.length)throw Error('No authored scenery is available in the stable viewport');
      const chosen=options[0],p=chosen.p;
      cover={id:p.id??null,structure:p.structure??null,
        kind:p.kind??null,name:p.name??null,
        world:{x:p.x,y:p.y},
        projected:{x:chosen.screen.x,y:chosen.screen.y}};
    }
    const worldPt=cover
      ?r.world(cover.projected.x,cover.projected.y-19)
      :r.world(rect.width*.74,rect.height*.66);
    const fixture={id:'art321-visual-coin',zone:g.zoneId,x:worldPt.x,y:worldPt.y,gold:1};
    const screen=r.screen(fixture);
    const x=rect.left+screen.x,y=rect.top+screen.y;
    const clip={x:Math.max(0,Math.round(x-58)),y:Math.max(0,Math.round(y-58)),
      width:116,height:116};
    const win={width:window.innerWidth,height:window.innerHeight};
    if(clip.x+clip.width>win.width||clip.y+clip.height>win.height)
      throw Error('Clip is not inside the actual visual viewport');
    return {
      mode:graphics.mode,phase:graphics.phase,zone:g.zoneId,time:g.s.time,
      sceneClock:g.s.clock,daylightPhase:g.daylightPhase().phase,
      darkness:g.daylightPhase().darkness,night:g.night(),
      hero:{x:g.hero.x,y:g.hero.y},zoom:Prototype.platform.cameraZoom,
      sceneActors:graphics.sceneMetrics?.actors??null,
      textureSources:graphics.sceneMetrics?.textureSources??null,
      viewport:win,worldBacking:{width:world.width,height:world.height},
      screen:{x,y},clip,fixture,cover,
      pauseOverlayAlpha:world.getContext('2d').getImageData(12,12,1,1).data[3]
    };
  });
  assert.equal(info.mode,backend,'Capture must come from the requested actual backend');
  if(backend==='webgl2'){
    assert.equal(info.phase,'confirmed','WebGL must be retained and confirmed');
    assert(info.sceneActors>0&&info.textureSources>0,'GPU scene did not draw actors/textures');
  }
  if(backend==='webgl2')
    assert(info.pauseOverlayAlpha>=80,
      'Pixi Canvas overlay must retain the same paused-screen tint as Canvas 2D');
  const before=path.join(out,backend+'-empty-crop.png');
  const after=path.join(out,backend+'-coin-crop.png');
  const full=path.join(out,backend+'-coin-full.png');
  // The pause guarantees the campaign world is identical before/after each coin.
  assert.equal(await page.evaluate(()=>Prototype.paused),true,
    'Paused Campaign required to prevent pixel-diff confounders');
  await page.screenshot({path:before,clip:info.clip,animations:'disabled'});
  await page.evaluate((object)=>{
    Prototype.game.s.loot.push(object);
    // The Canvas path can be redrawn synchronously. Pixi owns a SEPARATE
    // scene and runs during the game's paused idle renderer cadence.
    Prototype.renderer.draw();
  },info.fixture);
  try{
    if(backend==='webgl2')
      await page.waitForFunction((previous)=>
        Prototype.experimentalGraphics.mode==='webgl2' &&
        Prototype.experimentalGraphics.sceneMetrics.actors===previous+1,
        info.sceneActors,{timeout:30000});
    await page.screenshot({path:after,clip:info.clip,animations:'disabled'});
    await page.screenshot({path:full,animations:'disabled'});
    const pixels=await compareImages(before,after);
    assert.equal(await page.evaluate(()=>Prototype.experimentalGraphics.mode),backend,
      'Renderer switched/fell back during the actual screenshot');
    return {
      backend,zone:info.zone,simulationTime:info.time,hero:info.hero,
      sceneClock:info.sceneClock,daylightPhase:info.daylightPhase,
      darkness:info.darkness,night:info.night,
      zoom:info.zoom,viewport:info.viewport,worldBacking:info.worldBacking,
      pauseOverlayAlpha:info.pauseOverlayAlpha,
      gpuActors:info.sceneActors,textureSources:info.textureSources,
      screen:info.screen,clip:info.clip,cover:info.cover,pixels,
      images:[before,after,full].map(file=>({
        path:path.basename(file),sha256:hash(fs.readFileSync(file))
      }))
    };
  }finally{
    await page.evaluate((id)=>{
      const list=Prototype.game.s.loot,idx=list.findIndex(x=>x.id===id);
      if(idx!==-1)list.splice(idx,1);
      Prototype.renderer.draw();
    },info.fixture.id);
  }
}
// Optional end-to-end proof uses the REAL Campaign.kill() and Campaign.tick()
// paths. The page is disposable; no real user's save is written.
// A manually paused game suppresses normal world draw cadence. A prior
// injected texture can remain in the last WebGL composite even after the
// underlying Campaign loot array has been emptied. Force a *normal gameplay*
// frame (no internal renderer poking), pause again, then sample a truly empty
// world frame. This occurs only AFTER the matched, frozen A/B pair is finished.
async function flushPausedGpu(page, expected, scenario) {
  assert.equal(await page.evaluate(()=>Prototype.paused),true,
    'The previous test stage must start paused');
  await page.keyboard.press('p');
  try {
    await page.waitForFunction(expectedState=>{
      const gpu=Prototype.experimentalGraphics;
      return gpu.mode==='webgl2' && gpu.phase==='confirmed' &&
        gpu.sceneMetrics.actors===expectedState.actors &&
        Prototype.game.s.loot.length===expectedState.loot;
    },expected,{timeout:12000});
  }finally{
    await page.keyboard.press('p');
    await page.waitForFunction(()=>Prototype.paused,null,{timeout:5000});
  }
  const state=await page.evaluate(()=>({
    mode:Prototype.experimentalGraphics.mode,
    actors:Prototype.experimentalGraphics.sceneMetrics.actors,
    loot:Prototype.game.s.loot.length,paused:Prototype.paused,
    gameTime:Prototype.game.s.time,
  }));
  console.log('ART321_EARNED_FLUSH '+JSON.stringify({scenario,...state}));
  return state;
}

async function verifyEarnedLoot(page, originalActors) {
  const scene=await page.evaluate(()=>{
    const g=Prototype.game,r=Prototype.renderer,rect=document.getElementById('world').getBoundingClientRect();
    const where=r.world(rect.width*.74,rect.height*.66);
    const screen=r.screen(where),px=rect.left+screen.x,py=rect.top+screen.y;
    const clip={x:Math.round(px-58),y:Math.round(py-58),width:116,height:116};
    if(clip.x<0||clip.y<0||clip.x+116>innerWidth||clip.y+116>innerHeight)
      throw Error('Actual reward crop is not fully visible');
    if(Math.hypot(where.x-g.hero.x,where.y-g.hero.y)<=100)
      throw Error('Earned reward location must be outside automatic pickup radius');
    return {where,clip,clock:g.s.clock,phase:g.daylightPhase().phase,
      time:g.s.time,zone:g.zoneId,gold:g.hero.gold,
      gpuActors:Prototype.experimentalGraphics.sceneMetrics.actors};
  });
  const clean=await flushPausedGpu(page,{actors:originalActors,loot:0},'after synthetic coin cleanup');
  const empty=path.join(out,'earned-loot-before.png'),
    earned=path.join(out,'earned-loot-visible.png'),
    gone=path.join(out,'earned-loot-collected.png');
  await page.screenshot({path:empty,clip:scene.clip,animations:'disabled'});
  const drop=await page.evaluate(location=>{
    const g=Prototype.game;
    const e=g.makeEnemy({
      species:'goblin',type:'mob',name:'Audit earned coin',level:1,
      hp:1,damage:0,gold:23,xp:0,
    },location);
    // makeEnemy itself allocates a native entity ID. Record the loot ID
    // allocator AFTER that allocation, not before the enemy was created.
    const before={loot:g.s.loot.length,kills:g.s.statistics.kills,nextId:g.s.nextId,
      crowns:g.hero.gold};
    e.heroParticipated=true;
    g.zone().enemies.push(e);
    e.hp=0;
    const expected=g.enemyReward(e).gold;
    g.kill(e); // authoritative death→awardEnemyReward path
    const result=g.s.loot.find(l=>l.id==='loot-'+before.nextId);
    if(!result||result.gold!==expected||result.zone!==g.zoneId||
       g.s.statistics.kills!==before.kills+1||g.hero.gold!==before.crowns)
      throw Error('Production kill did not produce exactly one unpaid world reward');
    const snapshot=g.snapshot();
    if(!snapshot.loot?.some(l=>l.id===result.id))
      throw Error('Earned coin absent from canonical v4 snapshot');
    return {id:result.id,gold:result.gold,zone:result.zone,x:result.x,y:result.y,
      previousGold:before.crowns,previousLootCount:before.loot,
      previousActors:Prototype.experimentalGraphics.sceneMetrics.actors,
      kills:g.s.statistics.kills,snapshotRetainsCoin:true};
  },scene.where);
  // Resume a real scheduled draw once so the new earned coin reaches the
  // actual WebGL world rather than leaving a stale paused framebuffer.
  await flushPausedGpu(page,{
    actors:clean.actors+1,loot:drop.previousLootCount+1,
  },'native killed enemy with unpaid reward');
  const renderState=await page.evaluate(id=>({
    mode:Prototype.experimentalGraphics.mode,
    phase:Prototype.experimentalGraphics.phase,
    metrics:Prototype.experimentalGraphics.sceneMetrics,
    coinStillPresent:Prototype.game.s.loot.some(x=>x.id===id),
    paused:Prototype.paused,
    zone:Prototype.game.zoneId,
    modalHidden:document.querySelector('#modal').hidden
  }),drop.id);
  console.log('ART321_EARNED_PRECAPTURE '+JSON.stringify(renderState));
  assert.equal(renderState.coinStillPresent,true);
  assert.equal(renderState.mode,'webgl2');
  assert.equal(renderState.phase,'confirmed');
  await page.screenshot({path:earned,clip:scene.clip,animations:'disabled'});
  const pixelDiff=await compareImages(empty,earned);
  assert(pixelDiff.changedPixels>25&&pixelDiff.pixelDifference>2000,
    'Native earned Crown loot must appear in the actual WebGL page composite');
  const collected=await page.evaluate(id=>{
    const g=Prototype.game,l=g.s.loot.find(x=>x.id===id);
    if(!l)throw Error('Award vanished before real pickup');
    g.hero.x=l.x;g.hero.y=l.y;
    const before=g.hero.gold;
    g.tick(.01); // authoritative proximity-based reward grant
    const after=g.hero.gold;
    const exists=g.s.loot.some(x=>x.id===id);
    if(exists||after!==before+l.gold)
      throw Error('Canonical Campaign pickup did not remove and credit the earned coin');
    g.tick(.01);
    if(g.hero.gold!==after)throw Error('Claimed earned coin double-paid');
    return {goldBeforePickup:before,goldAfterPickup:after,earnedGold:l.gold,
      lootRemoved:!exists,paidOnce:true,
      sceneClock:g.s.clock,scenePhase:g.daylightPhase().phase};
  },drop.id);
  // Move camera back to its original location while the scene has no loot:
  // never use a changed camera to claim before/after pixel parity.
  await page.screenshot({path:gone,animations:'disabled'});
  return {
    stateBefore:scene,renderFlushesUseNormalGameplayFrames:true,
    producedBy:'Campaign.kill -> awardEnemyReward',
    collectedBy:'Campaign.tick(.01) proximity pickup',
    coin:drop,visibleCompositeDiff:pixelDiff,pickup:collected,
    pngs:[empty,earned,gone].map(file=>({
      filename:path.basename(file),sha256:hash(fs.readFileSync(file))
    }))
  };
}

async function start(){
  let browser;
  try{
    if(!fs.existsSync(path.join(root,'assets/vendor/pixi-8.22.0.min.js')))
      cp.execFileSync(process.execPath,['scripts/vendor-pixi.cjs','--ensure'],
        {cwd:root,stdio:'inherit'});
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const binary=chromiumBinary();
    browser=await playwright.chromium.launch({...(binary?{executablePath:binary}:{}),
      args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
        '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});
    try{
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
      await page.waitForFunction(()=>!!window.Prototype?.renderer);
      await require('../../tests/helpers/language-browser.cjs').selectEnglish(page);
      await page.keyboard.press('f');
      await page.keyboard.press('f');
      await page.waitForFunction(()=>document.querySelector('#modal').hidden);
      // Every capture still uses the SAME disposable Campaign and remains
      // paused in both renderers. The night mode changes presentation clock
      // only, not combat events, AI, loot, saves or the published default.
      if (overrideClock!==null) {
        await page.evaluate(clock=>{Prototype.game.s.clock=clock;},overrideClock);
        await page.waitForFunction(clock=>
          Math.abs(Prototype.game.s.clock-clock)<.15,overrideClock);
      }
      // The game can safely be paused while the settings/trial are inspected.
      await page.keyboard.press('p');
      assert.equal(await page.evaluate(()=>Prototype.paused),true);
      const canvas=await capture(page,'canvas2d');
      assert(canvas.pixels.changedPixels>25&&canvas.pixels.pixelDifference>2000,
        'Canvas Crown coin must change real composed screenshot pixels');
      // Both renderers must now draw real Crown loot; the original baseline
      // for Pixi was exactly zero changed pixels at the same camera and state.
      await page.locator('#menu-button').click();
      await page.getByRole('button',{name:'Game and settings',exact:true}).click();
      await page.getByRole('button',{name:'Screen and performance',exact:true}).click();
      await page.locator('select[aria-label="Graphics renderer"]').selectOption('webgl2');
      await page.waitForFunction(()=>{
        const status=Prototype.experimentalGraphics;
        return status.phase==='trial'||(status.phase==='canvas'&&!!status.lastError);
      },null,{timeout:45000});
      let status=await page.evaluate(()=>Prototype.experimentalGraphics);
      assert.equal(status.mode,'webgl2',
        'A Canvas fallback is not WebGL2 evidence: '+JSON.stringify(status.lastFailure));
      // Do not extend the timed trial. Use its actual player-facing Keep button.
      await page.getByRole('button',{name:'Keep WebGL2'}).click();
      status=await page.evaluate(()=>Prototype.experimentalGraphics);
      assert.equal(status.phase,'confirmed','WebGL trial not confirmed');
      await page.evaluate(()=>Prototype.closeMenu());
      await page.waitForFunction(()=>document.querySelector('#modal').hidden);
      const pixi=await capture(page,'webgl2');
      assert(pixi.pixels.changedPixels>25&&pixi.pixels.pixelDifference>2000,
        'Pixi Crown coin must visibly change actual composed frame pixels');
      if(coverMode) {
        assert(canvas.cover&&pixi.cover,'Both captures must have authored cover');
        assert.deepEqual(canvas.cover,pixi.cover,
          'Coin must be over the SAME actual authored scenery in both renderer modes');
        assert(canvas.pixels.changedPixels>25&&pixi.pixels.changedPixels>25,
          'Coin must remain visible in front of authored world scenery');
      }
      assert.equal(canvas.zone,pixi.zone);
      assert.equal(canvas.zoom,pixi.zoom,'Camera zoom changed across renderer captures');
      assert.deepEqual(canvas.viewport,pixi.viewport);
      assert.deepEqual(canvas.hero,pixi.hero,'Hero moved between captures');
      assert.equal(canvas.simulationTime,pixi.simulationTime,'Campaign clock moved between captures');
      assert.equal(canvas.daylightPhase,pixi.daylightPhase,
        'Day/night appearance must match the pinned paused campaign');
      assert.equal(canvas.night,pixi.night,'Night state changed with rendering backend');
      assert(Math.abs(canvas.sceneClock-pixi.sceneClock)<.001,
        'Authored world daylight clock must stay frozen while paused');
      if (overrideClock!==null) {
        assert.equal(canvas.night,overrideClock>=360&&overrideClock<600,
          'The optional snapshot must actually exercise the desired night state');
        assert.equal(canvas.daylightPhase,overrideClock>=360&&overrideClock<570?'night':
          overrideClock>=570?'sunrise':overrideClock>=330?'sunset':'day');
      }
      const earnedLifecycle=process.env.ART321_EARNED_BROWSER==='1'
        ?await verifyEarnedLoot(page,pixi.gpuActors):null;
      assert.deepEqual(errors,[],'Uncaught browser page errors');
      const report={
        schema:'art321-real-composed-paired-pixel-capture-v2',
        sourceSha,runTimeUtc:new Date().toISOString(),
        requestedSceneClock:overrideClock,
        authoredCoverMode:coverMode,
        engine:'Chromium ANGLE SwiftShader WebGL2 (software renderer)',
        source:'disposable game Campaign and temporary native-shaped Crown loot object',
        test:'one 1280x800 Chromium context; game paused; same Campaign, hero, zone, zoom, clock',
        canvas,pixi,earnedLifecycle,
        interpretation:{
          visualDeltaMeasured:'real Chromium page composite crop, before/after Crown coin',
          webglVerified:'active confirmed scene with nonzero actor/texture metrics',
          ownerArtAcceptance:'NOT PERFORMED',
          hardwarePerformance:'NOT MEASURED'
        },
        limitations:[
          'One synthetic loot object with real runtime shape, not an authored combat reward.',
          'Full and crop PNGs are retained; they are not approved golden images.',
          'A software GPU correctness trial cannot establish real-device performance.',
          'This tests only shared:loot, not any other catalog asset.'
        ]
      };
      const evidencePath=path.join(out,'evidence.json');
      fs.writeFileSync(evidencePath,JSON.stringify(report,null,2)+'\n');
      console.log('ART321_CAPTURE '+JSON.stringify({
        sha:sourceSha,zone:canvas.zone,zoom:canvas.zoom,
        canvasPixels:canvas.pixels.changedPixels,pixiPixels:pixi.pixels.changedPixels,
        pixiMode:pixi.backend,actors:pixi.gpuActors,textures:pixi.textureSources,
        authoredCover:coverMode?pixi.cover:null,
        output:out,report:'evidence.json'}));
      if(earnedLifecycle)console.log('ART321_EARNED_LOOT ' + JSON.stringify({
        backend:'webgl2',
        changedPixels:earnedLifecycle.visibleCompositeDiff.changedPixels,
        originalGold:earnedLifecycle.coin.previousGold,
        earnedGold:earnedLifecycle.coin.gold,
        paidOnce:earnedLifecycle.pickup.paidOnce,
        lootRemoved:earnedLifecycle.pickup.lootRemoved,
        authoredPhase:earnedLifecycle.stateBefore.phase,
      }));
      console.log('PASS focused real Chromium Canvas/Pixi paired capture');
    }finally{
      await context.close();
    }
  }finally{
    await browser?.close();
    if(server.listening)await new Promise(resolve=>server.close(resolve));
  }
}
start().catch(e=>{console.error(e);process.exitCode=1});
