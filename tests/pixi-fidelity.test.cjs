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

const inits=[],draws=[],resizes=[],frames=[],resources=new Set();
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
    Assets:{load:async()=>({source:{width:816,height:816}})}
  },
  PrototypeRenderer:{
    create:({canvas,ctx})=>({setOptimizationMode(){},draw(){
      draws.push({width:canvas.width,height:canvas.height,ratio:ctx.ratio});
    }}),
    nightLightKind:()=>null
  },
  PrototypeSprites:{timeMs:()=>1000},
  PrototypeVisuals:{draw(){}},
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
    syncLamps(){},setAtmosphere(){},setVignette(){},
    draw(){if(failSceneDraw)throw Error(failSceneDraw==='context' ? 'WebGL context lost' : 'Synthetic Pixi scene draw error')},
    destroy(){}
  })}
};
const mockDocument={createElement:()=>canvas(),head:{append(){}}};
const manifest={sprites:{hero:{src:'./assets/sprites/test.png'}}};
const pixiSource=fs.readFileSync(path.join(__dirname,'../src/prototype/pixi-experimental.js'),'utf8');
vm.runInNewContext(pixiSource,{
  window:runtime,document:mockDocument,
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
const gpu=runtime.PrototypePixiExperimental.create(gpuOptions);
(async()=>{
  assert.equal(await gpu.prepare(),true,'retina Pixi scene must prepare');
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
  gpu.activate();
  gpu.draw();
  canvasSurface.width=912;canvasSurface.height=420;
  gpu.draw();
  assert.equal(gpu.status().pixelRatio,1);
  assert.deepEqual(resizes,[1.5,1],'quality change resizes GPU in place');
  assert.equal(draws.at(-1).ratio,1,'background raster follows changed quality');
  // Simulate region travel without altering saved combat state. Procedural
  // GPU textures from the previous region must be released before rebuilding.
  game.props=[{id:'post',x:game.hero.x+10,y:game.hero.y+5,structure:'lumber-pile'}];
  game.zoneId='highlands';
  gpu.draw();
  assert.equal(gpu.status().proceduralTextures,1,'procedural body must be generated in new region');
  assert(gpu.status().proceduralBytes>0);
  const proceduralBefore=resources.size;
  for(const zone of ['vale','highlands','vale','highlands']){
    game.zoneId=zone;
    gpu.draw();
    assert.equal(gpu.status().proceduralTextures,1,'old zone body must be evicted');
    assert.equal(resources.size,proceduralBefore,'old registered textures must not accumulate');
  }
  assert(gpu.status().proceduralEvictions>=4,'region changes should release procedural rasters');
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
  assert.equal(tinyGpu.status().proceduralTextures,2,
    'zone switching must preserve only the freshly visible scene');
  tinyGpu.release();
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
  rejectWebGLContext=true;
  const startupGpu=runtime.PrototypePixiExperimental.create(gpuOptions);
  assert.equal(await startupGpu.prepare(),false);
  rejectWebGLContext=false;
  assert.equal(startupGpu.failureDetails().type,'context-unavailable');
  assert.equal(startupGpu.failureDetails().stage,'webgl2-context');
  assert.match(startupGpu.failureDetails().message,/WebGL2 context not available/);
  console.log('PASS Pixi/Canvas cache and precise draw/context/startup failure diagnostics');
})().catch(error=>{console.error(error);process.exitCode=1});
