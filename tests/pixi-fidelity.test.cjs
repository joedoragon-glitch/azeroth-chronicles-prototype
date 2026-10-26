'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Renderer = require('../src/prototype/renderer.js');
const Visuals = require('../src/prototype/visuals.js');

const game = {
  hero: {id:'hero',x:334,y:298}, zoneId:'vale',
  s:{rescued:{},throneClaimed:false,statistics:{deaths:0}},
  zone:()=>({props:game.props||[],enemies:[],buildings:[]}),
  visibleNPCs:()=>[],visibleResourceNodes:()=>[],activeLivingParty:()=>[],
  regionIndex:()=>0,isDungeon:()=>false,supplyRoom:()=>false,
  sideDungeon:()=>false,night:()=>false,daylightPhase:()=>({darkness:0})
};
const view={width:912,height:420}, platform={
  cameraZoom:1.5,cameraAnchor:()=>({x:456,y:210})
};
const sprites={
  definitionFor:e=>({entry:{width:e.id==='home'?816:192,
    height:e.id==='home'?816:192,displayWidth:192,displayHeight:192}}),
  timeMs:()=>1000
};
const painter=Renderer.create({
  canvas:view,ctx:{},getGame:()=>game,platform,
  chargePresentation:()=>null,isPaused:()=>false,
  Campaign:{rules:{ambientLife:{},harbors:{}}},
  PrototypeVisuals:Visuals,PrototypeSprites:sprites,
  PrototypeCombatVisuals:{},PrototypeEnemyVfxArt:null,PrototypeGroundCache:null
});
const cottage={id:'home',structure:'vale-cottage',x:180,y:260};
const image=painter.presentEntity(cottage,'prop');
assert.equal(image.visualScale,1.4,'Pixi must share the Canvas cottage scale');
assert.equal(cottage.visualScale,undefined,'art presentation must not mutate game entities');
assert.equal(image.spriteIdentity,cottage);
const oldImage=painter.presentEntity({structure:'vale-cottage'},'prop');
assert.equal(oldImage.visualScale,1,'low-density art must not be blindly enlarged');

const inits=[],draws=[],resizes=[],frames=[],moteFrames=[],resources=new Set(), approvedTextures=new Map();
let holdWarmFrames=false, deferredWarmFrame=null;
let currentActorTextures = new Set(), destroyedProcedural = 0,
  lastApplicationCanvas = null, rejectWebGLContext = false, failSceneDraw = false;
function canvas() {
  const surface={
    width:0,height:0,style:{},
    getContext(type) {
      if(type!=='2d')return null;
      return {setTransform(ratio){this.ratio=ratio},drawImage(){},
        getImageData(){const data=new Uint8ClampedArray(surface.width*surface.height*4);
          const x=Math.floor(surface.width/2),y=Math.floor(surface.height*.8);
          data[(y*surface.width+x)*4+3]=255;return {data}}
      };
    },
    handlers:{},setAttribute(){},
    addEventListener(name,handler){surface.handlers[name]=handler},
    remove(){}
  };
  return surface;
}
class Application {
  constructor(){
    this.canvas=canvas();
    lastApplicationCanvas=this.canvas;
    this.canvas.getContext=type=>type==='webgl2'&&!rejectWebGLContext?{}:null;
    this.renderer={
      resize:(w,h,ratio)=>{
        resizes.push(ratio);
        this.screen={width:w,height:h};
        this.canvas.width=Math.round(w*ratio);
        this.canvas.height=Math.round(h*ratio);
      }
    };
  }
  async init(options){inits.push(options);this.renderer.resize(options.width,options.height,options.resolution);}
  destroy(){}
}
const textureFrom=image=>({source:{width:image.width,height:image.height,update(){}},
  destroy(releaseSource){if(releaseSource)destroyedProcedural++}
});
const runtime={
  Campaign:{rules:{terrain:[]}},
  PIXI:{
    Application,Texture:{from:textureFrom},
    Assets:{
      load:async(src)=>{
        const texture={source:{width:816,height:816}};
        approvedTextures.set(src,texture);
        return texture;
      },
      get:src=>approvedTextures.get(src)
    }
  },
  PrototypeRenderer:{
    create:({canvas,ctx})=>({setOptimizationMode(){},draw(){
      draws.push({width:canvas.width,height:canvas.height,ratio:ctx.ratio});
    }}),
    nightLightKind:()=>null
  },
  PrototypeSprites:{timeMs:()=>1000},
  PrototypeVisuals:{draw(){},atmosphereMotes:Visuals.atmosphereMotes},
  AzerothNativeWebGLCore:{lampGlowCommands:()=>[]},
  AzerothGpuSpriteAdapter:{create:()=>({
    commandFor:(entity,point)=>entity.renderKind==='prop'
      ? {supported:false,reason:'original-game-procedural-art'} : ({
      supported:true,texture:{src:'./assets/sprites/test.png'},
      command:{x:point.x,y:point.y,width:120,height:100,
        opacity:1,flipX:false,sourceRect:null}
    })
  })},
  AzerothPixiSceneBridge:{create:()=>({
    registerTexture(id){resources.add(id)},
    hasTexture:id=>resources.has(id),
    unregisterTexture(id){
      assert(!currentActorTextures.has(id),'cannot destroy texture still used by a live sprite');
      return resources.delete(id);
    },
    setBackground(){},moveBackground(){},
    syncActors(list){
      for(const actor of list)assert(resources.has(actor.textureId),
        'an actor needs a registered texture before being drawn');
      currentActorTextures=new Set(list.map(actor=>actor.textureId));
      frames.push(list);
    },
    syncLamps(){},setAtmosphere(){},syncMotes(motes,zoom){moteFrames.push({motes,zoom});},setVignette(){},
    draw(){if(failSceneDraw)throw Error(failSceneDraw==='context' ? 'WebGL context lost' : 'Synthetic Pixi scene draw error')},
    destroy(){}
  })}
};
const mockDocument={createElement:()=>canvas(),head:{append(){}}};
const manifest={sprites:{hero:{src:'./assets/sprites/test.png'}}};
const pixiSource=fs.readFileSync(path.join(__dirname,'../src/prototype/pixi-experimental.js'),'utf8');
vm.runInNewContext(pixiSource,{
  window:runtime,document:mockDocument,
  requestAnimationFrame:(done)=>{
    if(holdWarmFrames)deferredWarmFrame=done;
    else done();
  },
  fetch:async()=>({ok:true,json:async()=>manifest})
}, {filename:'pixi-experimental.js'});
const canvasSurface={width:1368,height:630,parentNode:{insertBefore(){}}};
const gpuOptions={
  worldCanvas:canvasSurface,viewport:view,platform,getGame:()=>game,
  canvasRenderer:{
    screen:e=>({x:456+(e.x-game.hero.x)*1.5,y:210+(e.y-game.hero.y)*1.5}),
    presentEntity:painter.presentEntity,
    groundPresentation:painter.groundPresentation
  },
  getRendererOptions:()=>({}),getOptimizationMode:()=>false,onFailure:()=>{}
};
// One offscreen procedural actor represents the first unseen scenery while
// stepping west from Millhaven. It must be cached before the Pixi trial opens.
game.props=[{
  id:'cold-west-fringe',x:game.hero.x-580,y:game.hero.y,
  structure:'lumber-pile'
}];
const gpu=runtime.PrototypePixiExperimental.create(gpuOptions);
(async()=>{
  assert.equal(await gpu.prepare(),true,'retina Pixi scene must prepare');
  assert.equal(gpu.status().neighborhoodPrepared,1,
    'near-west fringe is prepared while simulation remains frozen');
  assert.equal(gpu.status().proceduralTextures,1,
    'offscreen procedural image is cached without drawing it in the live scene');
  assert(gpu.status().neighborhoodWarmupMs>=0);
  assert.equal(frames[0].length,1,'prewarming must not add offscreen actors to the world');
  const heroStartX=game.hero.x;
  game.hero.x-=470;
  gpu.activate();
  gpu.draw();
  assert.equal(gpu.status().proceduralTextures,1,
    'westward first visit must reuse the prewarmed identity instead of baking again');
  game.hero.x=heroStartX;
  game.props=[];
  assert.equal(inits[0].resolution,1.5,'Pixi must use Canvas output ratio');
  assert.equal(draws[0].width,1352,'CSS-space terrain dimensions stay unchanged');
  assert.equal(draws[0].height,860);
  assert.equal(draws[0].ratio,1.5,'background painting must be retina');
  assert.equal(gpu.status().backdropWidth,2028);
  assert.equal(frames[0][0].width,180,'camera zoom applies without double DPI scaling');
  assert.equal(frames[0][0].ground.rx,18,'Pixi uses the same hero shadow footprint as Canvas');
  assert.equal(frames[0][0].ground.scale,1.5,'contact shadow scales with physical camera zoom');
  assert.equal(frames[0][0].ground.marker.color,'#f5d992bb',
    'hero ground ring must have the original approved Canvas color');
  assert.equal(frames[0][0].ground.x,456,'shadow tracks camera projection, not sprite crop');
  assert.equal(moteFrames[0].zoom,1.5,'motes follow Canvas physical camera zoom');
  assert.equal(moteFrames[0].motes.length,14,'Pixi receives the 14 original Vale outdoor motes');
  assert.equal(moteFrames[0].motes[0].alpha,.18,'daytime Pixi pollen uses original alpha');
  assert.deepEqual(moteFrames[0].motes[0].rgb,[234,223,158],
    'approved daylight Vale palette is forwarded unchanged');
  const regionMote=moteFrames[0].motes[0];
  assert(regionMote.x>=-40 && regionMote.x<=912/1.5+40,
    'motes originate in the Canvas logical viewport, not the pixel backing');
  gpu.activate();
  gpu.draw();
  canvasSurface.width=912;canvasSurface.height=420;
  gpu.draw();
  assert.equal(gpu.status().pixelRatio,1);
  assert.deepEqual(resizes,[1.5,1],'quality change resizes GPU in place');
  assert.equal(draws.at(-1).ratio,1,'background raster follows changed quality');
  // Mimic a confirmed iPhone returning from another app at a new viewport.
  // The renderer must rebuild its viewport-dependent layers without a new
  // graphics trial or a fall back to Canvas.
  view.width=844;view.height=390;
  canvasSurface.width=844;canvasSurface.height=390;
  assert.doesNotThrow(()=>gpu.draw(),'confirmed viewport change must remain usable');
  assert.equal(gpu.status().active,true);
  assert.equal(draws.at(-1).width,844+440,'terrain painter must use new logical width');
  assert.equal(draws.at(-1).height,390+440,'terrain painter must use new logical height');
  assert.equal(inits.length,1,'resize must reuse the same GPU application/context');
  assert.equal(resizes.at(-1),1,'resized GPU must match Canvas density');
  assert.equal(gpu.status().loadedTextures,1,'approved sprites must survive viewport rebuild');
  // Normalizing back to the original landscape viewport is also safe.
  view.width=912;view.height=420;
  canvasSurface.width=912;canvasSurface.height=420;
  gpu.draw();
  assert.equal(gpu.status().active,true);
  // Simulate region travel without altering saved combat state. Procedural
  // GPU textures from the previous region must be released before rebuilding.
  game.props=[{id:'post',x:game.hero.x+10,y:game.hero.y+5,structure:'lumber-pile'}];
  game.zoneId='highlands';
  gpu.draw();
  assert.equal(gpu.status().proceduralTextures,1,
    'prior density and viewport changes may legitimately clear old artwork');
  assert(gpu.status().proceduralBytes>0);
  const initialBakes=gpu.status().proceduralBakes;
  for(const zone of ['vale','highlands','vale','highlands']){
    game.zoneId=zone;
    gpu.draw();
    assert(gpu.status().proceduralBytes<=gpu.status().proceduralBudget,
      'cross-zone texture retention stays within its hard memory ceiling');
  }
  assert(gpu.status().proceduralTextures>=2,
    'the two repeatedly visited regions retain their procedural art');
  assert(gpu.status().proceduralBakes<=initialBakes+1,
    'returning to a room must reuse its earlier procedural artwork');
  assert(gpu.status().proceduralCacheHits>0,'revisited region uses cached art');
  assert.equal(gpu.status().loadedTextures,1,'canonical original sprite remains warmed');
  gpu.release();
  // 160 pixel-bytes per miniature procedural texture is sufficient for the
  // deterministic mock. This intentionally tiny *test-only* budget forces
  // the same LRU path that real towns would take under sustained roaming.
  resources.clear();
  currentActorTextures.clear();
  const tinyGpu=runtime.PrototypePixiExperimental.create({
    ...gpuOptions,
    proceduralTextureBudgetBytes:800
  });
  game.zoneId='vale';
  game.props=[{id:'walk-0',x:game.hero.x+8,y:game.hero.y+6,structure:'lumber-pile'}];
  assert.equal(await tinyGpu.prepare(),true);
  tinyGpu.activate();
  const baseline=tinyGpu.status();
  assert(baseline.proceduralBytes>0 && baseline.proceduralBytes<=800);
  const previousSceneTextures=destroyedProcedural;
  const seen=[];
  for(let i=1;i<=65;i++){
    game.props=[
      {id:'walk-'+i,x:game.hero.x+8,y:game.hero.y+6,structure:'lumber-pile'},
      {id:'walk-'+(i-1),x:game.hero.x+20,y:game.hero.y+12,structure:'lumber-pile'}
    ];
    tinyGpu.draw();
    const state=tinyGpu.status();
    assert.equal(state.active,true);
    assert(state.proceduralBytes<=state.proceduralBudget,
      'long same-zone walks must stay under the hard procedural budget');
    assert(state.proceduralTextures<=8,'same-zone cache must not grow indefinitely');
    seen.push(state.proceduralBytes);
  }
  assert(tinyGpu.status().proceduralCacheEvictions>0,
    'same-zone movement must evict old offscreen images');
  assert(destroyedProcedural>previousSceneTextures,
    'eviction must release actual GPU source textures');
  // Revisiting an evicted identity must work and not leave dangling references.
  game.props=[
    {id:'walk-0',x:game.hero.x+8,y:game.hero.y+6,structure:'lumber-pile'},
    {id:'walk-65',x:game.hero.x+20,y:game.hero.y+12,structure:'lumber-pile'}
  ];
  tinyGpu.draw();
  assert.equal(tinyGpu.status().active,true);
  assert(tinyGpu.status().proceduralBytes<=800);
  // A zone change must still clear retained old-zone assets.
  game.zoneId='highlands';
  tinyGpu.draw();
  assert(tinyGpu.status().proceduralBytes<=tinyGpu.status().proceduralBudget,
    'zone switching must preserve bounded art while reusing recent scenes');
  tinyGpu.release();
  // If iOS backgrounds the PWA during the short two-per-frame warmup,
  // the removed GPU scene may never be rebuilt by a stale async callback.
  resources.clear();currentActorTextures.clear();
  game.zoneId='vale';
  game.props=[
    {id:'fringe-a',x:game.hero.x-580,y:game.hero.y,structure:'lumber-pile'},
    {id:'fringe-b',x:game.hero.x-600,y:game.hero.y,structure:'lumber-pile'},
  ];
  holdWarmFrames=true;
  const interruptedGpu=runtime.PrototypePixiExperimental.create(gpuOptions);
  const pendingWarm=interruptedGpu.prepare();
  for(let j=0;j<30 && !deferredWarmFrame;j++)await Promise.resolve();
  assert.equal(typeof deferredWarmFrame,'function',
    'two nearby procedural bakes yield before a trial can be revealed');
  interruptedGpu.release();
  const resumeFrame=deferredWarmFrame;
  holdWarmFrames=false;deferredWarmFrame=null;
  resumeFrame();
  assert.equal(await pendingWarm,false,'released GPU rejects stale neighborhood preparation');
  assert.equal(interruptedGpu.status().active,false);
  game.props=[];
  const failures=[];
  const failedDrawGpu=runtime.PrototypePixiExperimental.create({
    ...gpuOptions,onFailure:(detail)=>failures.push(detail)
  });
  assert.equal(await failedDrawGpu.prepare(),true);
  failedDrawGpu.activate();
  failSceneDraw=true;
  assert.throws(()=>failedDrawGpu.draw(),/Synthetic Pixi scene draw error/);
  failSceneDraw=false;
  assert.equal(failures.at(-1).type,'render-exception');
  assert.equal(failures.at(-1).stage,'scene-render');
  assert.match(failures.at(-1).message,/Synthetic Pixi scene draw error/);
  assert.equal(failedDrawGpu.failureDetails().type,'render-exception');
  assert.equal(failedDrawGpu.status().lastError,failures.at(-1).message);
  failedDrawGpu.release();
  // Some WebGL drivers report context loss by throwing from Pixi's draw
  // loop before dispatching webglcontextlost. The first failure is still
  // context-loss, and the ensuing Canvas release must not be overwritten.
  const contextDrawFailures=[];
  let contextDrawGpu;
  contextDrawGpu=runtime.PrototypePixiExperimental.create({
    ...gpuOptions,onFailure:(detail)=>{
      contextDrawFailures.push(detail);
      contextDrawGpu.release();
    }
  });
  assert.equal(await contextDrawGpu.prepare(),true);
  contextDrawGpu.activate();
  failSceneDraw='context';
  assert.doesNotThrow(()=>contextDrawGpu.draw(),
    'a lost context must recover safely without rethrowing a drawing fault');
  failSceneDraw=false;
  assert.equal(contextDrawFailures.length,1,'report one root context failure');
  assert.equal(contextDrawFailures[0].type,'context-loss');
  assert.equal(contextDrawFailures[0].stage,'scene-render');
  assert.equal(contextDrawFailures[0].resources.loadedTextures,1);
  assert.equal(contextDrawGpu.failureDetails().type,'context-loss');
  assert.doesNotThrow(()=>contextDrawGpu.draw(),'late draw after context loss is ignored');
  assert.equal(contextDrawFailures.length,1,'late render cannot replace the original loss');
  const lostGpu=runtime.PrototypePixiExperimental.create({
    ...gpuOptions,onFailure:(detail)=>failures.push(detail)
  });
  assert.equal(await lostGpu.prepare(),true);
  lostGpu.activate();
  assert.equal(typeof lastApplicationCanvas.handlers.webglcontextlost,'function');
  let prevented=false;
  lastApplicationCanvas.handlers.webglcontextlost({
    preventDefault(){prevented=true}
  });
  assert(prevented);
  assert.equal(failures.at(-1).type,'context-loss');
  assert.equal(failures.at(-1).stage,'webglcontextlost');
  assert.equal(failures.at(-1).resources.loadedTextures,1);
  assert.equal(lostGpu.failureDetails().type,'context-loss');
  lostGpu.release();
  // A late contextlost event from a retired GPU canvas must not tear down
  // the newly prepared replacement after bounded automatic recovery.
  const replayFailures=[];
  const replayGpu=runtime.PrototypePixiExperimental.create({
    ...gpuOptions,onFailure:(detail)=>replayFailures.push(detail)
  });
  assert.equal(await replayGpu.prepare(),true);
  replayGpu.activate();
  const retiredCanvas=lastApplicationCanvas;
  replayGpu.release();
  assert.equal(await replayGpu.prepare(),true);
  replayGpu.activate();
  retiredCanvas.handlers.webglcontextlost({preventDefault(){}});
  assert.equal(replayFailures.length,0,'obsolete context event is ignored after reprepare');
  assert.equal(replayGpu.status().active,true,'replacement GPU remains active');
  replayGpu.draw();
  assert.equal(replayGpu.status().active,true);
  replayGpu.release();
  rejectWebGLContext=true;
  const startupGpu=runtime.PrototypePixiExperimental.create(gpuOptions);
  assert.equal(await startupGpu.prepare(),false);
  rejectWebGLContext=false;
  assert.equal(startupGpu.failureDetails().type,'context-unavailable');
  assert.equal(startupGpu.failureDetails().stage,'webgl2-context');
  assert.match(startupGpu.failureDetails().message,/WebGL2 context not available/);
  console.log('PASS Pixi/Canvas cache and precise draw/context/startup failure diagnostics');
})().catch(error=>{console.error(error);process.exitCode=1});
