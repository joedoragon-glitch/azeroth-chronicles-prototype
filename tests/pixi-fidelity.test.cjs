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
  zone:()=>({props:[],enemies:[],buildings:[]}),
  visibleNPCs:()=>[],visibleResourceNodes:()=>[],activeLivingParty:()=>[],
  regionIndex:()=>0,isDungeon:()=>false,supplyRoom:()=>false,
  sideDungeon:()=>false,night:()=>false,daylightPhase:()=>({darkness:0})
};
const view={width:912,height:420}, platform={
  cameraZoom:1.5,cameraAnchor:()=>({x:456,y:210})
};
const sprites={
  definitionFor:e=>({entry:{width:e.structure==='vale-cottage'?816:192,
    height:e.structure==='vale-cottage'?816:192,displayWidth:192,displayHeight:192}}),
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

const inits=[],draws=[],resizes=[],frames=[];
function canvas() {
  return {
    width:0,height:0,style:{},
    getContext(type) {
      if(type!=='2d')return null;
      return {setTransform(ratio){this.ratio=ratio}};
    },
    setAttribute(){},addEventListener(){},remove(){}
  };
}
class Application {
  constructor(){
    this.canvas=canvas();
    this.canvas.getContext=type=>type==='webgl2'?{}:null;
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
const textureFrom=image=>({source:{width:image.width,height:image.height,update(){}},destroy(){}});
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
    commandFor:(entity,point)=>({
      supported:true,texture:{src:'./assets/sprites/test.png'},
      command:{x:point.x,y:point.y,width:120,height:100,
        opacity:1,flipX:false,sourceRect:null}
    })
  })},
  AzerothPixiSceneBridge:{create:()=>({
    registerTexture(){},hasTexture:()=>true,
    setBackground(){},moveBackground(){},
    syncActors(list){frames.push(list)},
    syncLamps(){},setAtmosphere(){},setVignette(){},draw(){},destroy(){}
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
const gpu=runtime.PrototypePixiExperimental.create({
  worldCanvas:canvasSurface,viewport:view,platform,getGame:()=>game,
  canvasRenderer:{
    screen:e=>({x:456+(e.x-game.hero.x)*1.5,y:210+(e.y-game.hero.y)*1.5}),
    presentEntity:painter.presentEntity
  },
  getRendererOptions:()=>({}),getOptimizationMode:()=>false,onFailure:()=>{}
});
(async()=>{
  assert.equal(await gpu.prepare(),true,'retina Pixi scene must prepare');
  assert.equal(inits[0].resolution,1.5,'Pixi must use Canvas output ratio');
  assert.equal(draws[0].width,1352,'CSS-space terrain dimensions stay unchanged');
  assert.equal(draws[0].height,860);
  assert.equal(draws[0].ratio,1.5,'background painting must be retina');
  assert.equal(gpu.status().backdropWidth,2028);
  assert.equal(frames[0][0].width,180,'camera zoom applies without double DPI scaling');
  gpu.activate();
  gpu.draw();
  canvasSurface.width=912;canvasSurface.height=420;
  gpu.draw();
  assert.equal(gpu.status().pixelRatio,1);
  assert.deepEqual(resizes,[1.5,1],'quality change resizes GPU in place');
  assert.equal(draws.at(-1).ratio,1,'background raster follows changed quality');
  gpu.release();
  console.log('PASS Pixi/Canvas sharpness, sizing and quality-transition parity');
})().catch(error=>{console.error(error);process.exitCode=1});
