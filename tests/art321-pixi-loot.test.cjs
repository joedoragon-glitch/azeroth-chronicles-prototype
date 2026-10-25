'use strict';
// Focused synthetic GPU routing regression, not a replacement for real PNG A/B.
// One approved shared coin texture, transient per-drop GPU actor records,
// zone/viewport culling, removal, zoom refresh and campaign immutability.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const files = [];
const batches = [];
const registered = new Map();
const destroyed = [];
let stampPaints = 0;
function makeCanvas() {
  return {width:0,height:0,style:{},parentNode:{insertBefore(){}},
    setAttribute(){},addEventListener(){},remove(){},
    getContext(type) {
      if(type === 'webgl2')return {};
      if(type !== '2d')return null;
      return {setTransform(){},drawImage(){},getImageData(){
        // One opaque pixel satisfies the unrelated baked-actor contract.
        const data = new Uint8ClampedArray(files.at(-1).width*files.at(-1).height*4);
        return {data};
      }};
    }
  };
}
const game = {
  hero:{id:'hero',x:300,y:350,class:'ranger'},
  zoneId:'vale',
  s:{rescued:{},loot:[],time:0},
  zone:()=>({props:[],enemies:[],buildings:[]}),
  visibleNPCs:()=>[],visibleResourceNodes:()=>[],activeLivingParty:()=>[],
  isDungeon:()=>false,supplyRoom:()=>false,sideDungeon:()=>false,
  regionIndex:()=>0,night:()=>false,
  daylightPhase:()=>({darkness:0}),
};
const zoom={current:1.5};
const platform={get cameraZoom(){return zoom.current;},
  cameraAnchor:()=>({x:400,y:280})};
const api = {
  PIXI:{
    Application:class{
      constructor(){
        this.canvas=makeCanvas();
        this.canvas.getContext=type=>type==='webgl2'?{}:null;
        this.screen={width:800,height:600};
        this.renderer={resize(){}};
      }
      async init(){this.canvas.style={};}
      destroy(){}
    },
    Texture:{from(image){
      const result={source:{width:image.width,height:image.height,
        update(){},scaleMode:'unset'},destroy:(release)=>destroyed.push(release)};
      return result;
    }},
    Assets:{load:async()=>({source:{width:64,height:64,scaleMode:'nearest'}})}
  },
  Campaign:{rules:{terrain:[]}},
  PrototypeRenderer:{
    create:()=>({draw(){},setOptimizationMode(){}}),
    drawCrownLoot:(ctx,p)=>{stampPaints++;assert.equal(p.x,20);assert.equal(p.y,20);},
    nightLightKind:()=>null
  },
  PrototypeSprites:{timeMs:()=>0},
  PrototypeVisuals:{draw(){}},
  AzerothNativeWebGLCore:{lampGlowCommands:()=>[]},
  AzerothGpuSpriteAdapter:{create:()=>({
    commandFor:(_entity,point)=>({
      supported:true,texture:{src:'./assets/sprites/test.png'},
      command:{x:point.x,y:point.y,width:64,height:64,opacity:1,flipX:false}
    })
  })},
  AzerothPixiSceneBridge:{create:()=>({
    registerTexture:(id,texture)=>registered.set(id,texture),
    unregisterTexture:(id)=>registered.delete(id),
    hasTexture:(id)=>registered.has(id),
    setBackground(){},moveBackground(){},
    syncActors(list){batches.push(list.map(r=>({...r})));
      for(const r of list)assert(registered.has(r.textureId),'Unknown visible texture '+r.textureId);
    },
    syncLamps(){},setAtmosphere(){},setVignette(){},draw(){},destroy(){}
  })}
};
const document={createElement:()=>{const c=makeCanvas();files.push(c);return c;},head:{append(){}}};
const file=fs.readFileSync(path.join(__dirname,'../src/prototype/pixi-experimental.js'),'utf8');
vm.runInNewContext(file,{window:api,document,fetch:async()=>({
  ok:true,json:async()=>({sprites:{'hero:ranger':{src:'./assets/sprites/test.png'}}})
})},{filename:'pixi-experimental.js'});
const world=makeCanvas();world.width=800;world.height=600;
const renderer={
  screen:e=>({x:(e.x-game.hero.x)*zoom.current+400,
    y:(e.y-game.hero.y)*zoom.current+280}),
  presentEntity:(e,kind)=>({...e,renderKind:kind})
};
const gpu=api.PrototypePixiExperimental.create({
  worldCanvas:world,viewport:{width:800,height:600},platform,
  getGame:()=>game,canvasRenderer:renderer,getRendererOptions:()=>({}),
  getOptimizationMode:()=>false,onFailure:e=>{throw Error(JSON.stringify(e))}
});
function lastCoins(){return batches.at(-1).filter(x=>String(x.key).startsWith('crown-loot:'))}
(async()=>{
  assert.equal(await gpu.prepare(),true);
  gpu.activate();
  assert.equal(lastCoins().length,0,'No invisible placeholder coins');
  const initialResources=registered.size;
  const coin={id:'loot-101',zone:'vale',x:320,y:345,gold:12};
  const offZone={id:'loot-far-region',zone:'march',x:320,y:345,gold:3};
  const outside={id:'loot-outside-view',zone:'vale',x:100000,y:100000,gold:5};
  game.s.loot.push(coin,offZone,outside);
  const untouched=JSON.stringify(game.s.loot);
  gpu.draw();
  assert.equal(JSON.stringify(game.s.loot),untouched,'Rendering must not mutate rewards');
  assert.equal(lastCoins().length,1,'Only visible same-zone loot is drawn');
  assert.equal(lastCoins()[0].key,'crown-loot:loot-101');
  assert.equal(lastCoins()[0].depth,Number.MAX_SAFE_INTEGER,
    'Canonical Canvas loot draws after the world actor pass');
  assert.equal(lastCoins()[0].width,60,'World stamp obeys 150% camera zoom');
  assert.equal(lastCoins()[0].height,60);
  assert.equal(lastCoins()[0].x,400,'Coin center preserves world projection');
  assert.equal(lastCoins()[0].y,242.5,'Coin center preserves world projection');
  assert.equal(stampPaints,1,'One shared stamped texture, not one per loot');
  assert.equal(registered.size,initialResources+1);
  game.s.loot.push({id:'loot-102',zone:'vale',x:330,y:350,gold:1});
  gpu.draw();
  assert.equal(lastCoins().length,2);
  assert.equal(stampPaints,1,'Multiple drops reuse the same approved image');
  assert.deepEqual(Array.from(lastCoins(),x=>x.textureId),
    ['pixi-world-crown-loot','pixi-world-crown-loot']);
  game.s.loot.splice(0,1);
  gpu.draw();
  assert.deepEqual(Array.from(lastCoins(),x=>x.key),['crown-loot:loot-102'],
    'Claimed coins disappear from the GPU scene immediately');
  game.zoneId='march';
  gpu.draw();
  assert.deepEqual(Array.from(lastCoins(),x=>x.key),['crown-loot:loot-far-region'],
    'Travel switches to only the new zone loot');
  game.zoneId='vale';
  zoom.current=2;
  gpu.draw();
  assert.equal(lastCoins()[0].width,80);
  assert.equal(stampPaints,2,'Zoom rebuilds the shared stamped texture once');
  assert.equal(registered.size,initialResources+1,'Old zoom texture is released');
  assert(destroyed.includes(true),'Old GPU coin texture must be disposed');
  gpu.release();
  assert.equal(game.s.loot.length,3,'No pickup or reward mechanic was touched');
  console.log('PASS Art321 Pixi Crown loot: approved stamp, two drops, zoom, zone, pickup removal, stable registry and simulation');
})().catch(e=>{console.error(e);process.exitCode=1;});
