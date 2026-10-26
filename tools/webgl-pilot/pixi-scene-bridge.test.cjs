'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const Bridge=require('./pixi-scene-bridge.js');
function pixiFixture(){
  const calls={render:0,sprites:0,images:0,glows:0};
  class Container {
    constructor(){this.children=[];this.position={x:0,y:0,set:(x,y)=>{this.position.x=x;this.position.y=y}};}
    addChild(o){this.removeChild(o);this.children.push(o);o.parent=this;return o;}
    addChildAt(o,i){this.removeChild(o);this.children.splice(i,0,o);o.parent=this;return o;}
    removeChild(o){const i=this.children.indexOf(o);if(i>=0)this.children.splice(i,1);}
    destroy(){}
  }
  class Sprite {
    constructor(texture){
      calls.sprites++;this.texture=texture;this.scale={x:1,y:1};
      this.position={x:0,y:0,set:(x,y)=>{this.position.x=x;this.position.y=y}};
      this.width=0;this.height=0;this.alpha=1;
    }
    destroy(){}
  }
  class Graphics {
    constructor(){
      this.position={x:0,y:0,set:(x,y)=>{this.position.x=x;this.position.y=y}};
      this.blendMode='normal';this.circles=[];this.rects=[];this.ellipses=[];this.strokes=[];this.fills=[];
    }
    clear(){this.circles=[];this.rects=[];this.ellipses=[];this.strokes=[];this.fills=[];return this;}
    circle(...args){this.circles.push(args);return this;}
    rect(...args){this.rects.push(args);return this;}
    ellipse(...args){this.ellipses.push(args);return this;}
    stroke(g){this.strokes.push(g);return this;}
    fill(g){this.fillStyle=g;this.fills.push(g);calls.glows++;return this;}
    destroy(){}
  }
  class FillGradient {
    constructor(options){this.options=options}
    destroy(){}
  }
  class Texture {
    constructor({source,frame}){
      this.source=source;this.frame=frame;calls.images++;
    }
    destroy(){}
  }
  class Rectangle{
    constructor(x,y,w,h){this.x=x;this.y=y;this.width=w;this.height=h;}
  }
  const PIXI={Container,Sprite,Graphics,FillGradient,Texture,Rectangle};
  const stage=new Container();
  const app={stage,renderer:{},render(){calls.render++}};
  return {PIXI,app,calls};
}
function picture(id='art',width=576,height=576){
  return {id,source:{width,height}};
}
function actor(key='hero',x=60,depth=5){
  return {key,x,y:120,width:88,height:102,depth,
    textureId:'hero.png',sourceRect:[2,2,96,96],opacity:1,flipX:false};
}
test('real sprite atlas frames move as Pixi scene nodes without Canvas painting',()=>{
  const {PIXI,app,calls}=pixiFixture();
  const bridge=Bridge.create({PIXI,app,width:640,height:360});
  bridge.registerTexture('hero.png',picture());
  bridge.setBackground(picture('floor',960,680),-160,-160);
  bridge.syncActors([actor()]);
  const first=app.stage.children[0].children[1].children[0];
  assert.equal(first.position.x,60);assert.equal(first.position.y,120);
  assert.equal(first.texture.frame.width,96);
  assert.equal(calls.images,1);
  bridge.syncActors([actor('hero',105)]);
  const moved=app.stage.children[0].children[1].children[0];
  assert.equal(moved,first,'same GPU actor must be reused');
  assert.equal(moved.position.x,105,'new camera/hero movement updates GPU sprite');
  bridge.draw();
  assert.equal(calls.render,1);
  assert.equal(calls.images,1,'same frame atlas subtexture is cached');
  bridge.destroy();
});
test('frame swaps use bounded reusable Pixi atlas frames',()=>{
  const {PIXI,app,calls}=pixiFixture();
  const stage=Bridge.create({PIXI,app,width:600,height:350});
  stage.registerTexture('hero.png',picture());
  const e=actor();
  stage.syncActors([e]);
  stage.syncActors([{...e,sourceRect:[100,2,96,96]}]);
  stage.syncActors([e]);
  assert.equal(calls.images,2);
  stage.destroy();
});
test('zero or missing textures reject before a partial actor update',()=>{
  const {PIXI,app}=pixiFixture();
  const scene=Bridge.create({PIXI,app,width:600,height:350});
  scene.registerTexture('hero.png',picture());
  scene.syncActors([actor()]);
  assert.throws(()=>scene.syncActors([actor(),{...actor('missing',150),
    textureId:'missing-artwork.png'}]),/Missing original game actor texture/);
  assert.equal(scene.metrics().actors,1);
  assert.throws(()=>scene.syncActors([{...actor(),width:0}]),/geometry/);
  scene.destroy();
});
test('native radial lamps use screen blend and independent per-light transforms',()=>{
  const {PIXI,app,calls}=pixiFixture();
  const scene=Bridge.create({PIXI,app,width:600,height:350});
  const light={x:180,y:100,radius:90,rgb:[255,207,132],alpha:0.3};
  scene.syncLamps([light]);
  const visual=app.stage.children[0].children[1].children[0];
  assert.equal(visual.blendMode,'screen');
  assert.equal(visual.position.x,180);
  assert.equal(visual.circles[0][2],90);
  const prev=calls.glows;
  scene.syncLamps([{...light,x:250}]);
  assert.equal(visual.position.x,250);
  assert.equal(calls.glows,prev,'light gradient is reused when source merely moves');
  scene.syncLamps([]);
  assert.equal(scene.metrics().lights,0);
  scene.destroy();
});
test('scene orders real actors by original isometric depth and retains default GPU path',()=>{
  const {PIXI,app}=pixiFixture();
  const scene=Bridge.create({PIXI,app,width:600,height:350});
  scene.registerTexture('hero.png',picture());
  scene.syncActors([actor('far',170,99),actor('near',20,1)]);
  const actorContainer=app.stage.children[0].children[0];
  assert.equal(actorContainer.children[0].position.x,20);
  assert.equal(actorContainer.children[1].position.x,170);
  scene.destroy();
});

test('Pixi atmosphere mirrors original vertical night tints and bottom alpha',()=>{
  const layers=Bridge.atmosphereLayers({region:0,darkness:1,peaceBlend:0});
  assert.equal(layers.length,1);
  assert.equal(layers[0].style,'linear');
  assert.equal(layers[0].colorStops[0].color,'rgba(11,25,42,0.48)');
  assert.equal(layers[0].colorStops[1].color,'rgba(9,17,30,0.58)');
  assert.equal(layers[0].start.y,0);
  assert.equal(layers[0].end.y,1);
  const peaceful=Bridge.atmosphereLayers({region:4,darkness:1,peaceBlend:1});
  assert.equal(peaceful[0].colorStops[0].color,'rgba(27,19,43,0.54)');
  assert.equal(peaceful[0].colorStops[1].color,'rgba(22,31,49,0.3)');
});
test('daytime region tint and diagonal sun gradient preserve original palette',()=>{
  const layer=Bridge.atmosphereLayers({region:1,darkness:0,optimized:false});
  assert.equal(layer.length,2);
  assert.equal(layer[0].style,'solid');
  assert.equal(layer[0].opacity,.05);
  assert.equal(layer[1].colorStops[0].color,'rgba(255,244,203,0.07)');
  assert.equal(Bridge.atmosphereLayers({region:1,darkness:0,optimized:true}).length,1);
});
test('Pixi atmosphere avoids rebuilding unchanged grades while lights can move',()=>{
  const {PIXI,app,calls}=pixiFixture();
  const scene=Bridge.create({PIXI,app,width:640,height:360});
  scene.setAtmosphere({region:0,darkness:1});
  const first=calls.glows;
  scene.setAtmosphere({region:0,darkness:1});
  assert.equal(calls.glows,first);
  scene.setAtmosphere({region:1,darkness:1});
  assert.ok(calls.glows>first);
  scene.destroy();
});

test('original Canvas radial vignette uses its two real centers and physical radii',()=>{
  const night=Bridge.vignetteDescription({darkness:1,optimized:false},1600,900);
  assert.equal(night.type,'radial');
  assert.equal(night.textureSpace,'global');
  assert.deepEqual(night.center,{x:800,y:432});
  assert.deepEqual(night.outerCenter,{x:800,y:450});
  assert.equal(night.innerRadius,162);
  assert.equal(night.outerRadius,1152);
  assert.equal(night.colorStops[0].color,'rgba(0,0,0,0)');
  assert.equal(night.colorStops[1].color,'rgba(0,0,0,0.15)');
  const day=Bridge.vignetteDescription({darkness:0},1600,900);
  assert.equal(day.colorStops[1].color,'rgba(5,15,10,0.12)');
  assert.equal(Bridge.vignetteDescription({darkness:1,optimized:true},1600,900),null);
});
test('native vignette remains last after lamp updates and caches unchanged fill',()=>{
  const {PIXI,app,calls}=pixiFixture();
  const scene=Bridge.create({PIXI,app,width:1600,height:900});
  scene.syncLamps([{x:150,y:200,radius:90,rgb:[255,207,132],alpha:.3}]);
  scene.setAtmosphere({region:0,darkness:1});
  scene.setVignette({darkness:1,optimized:false});
  const effects=app.stage.children[0].children[1];
  const v=effects.children.at(-1);
  assert.equal(v.fillStyle.options.type,'radial');
  assert.equal(v.fillStyle.options.outerRadius,1152);
  const old=calls.glows;
  scene.setVignette({darkness:1,optimized:false});
  assert.equal(calls.glows,old,'unchanged vignette reuses GPU gradient');
  scene.syncLamps([{x:200,y:210,radius:90,rgb:[255,207,132],alpha:.3}]);
  assert.equal(effects.children.at(-1),v,'final GPU vignette follows night lamp passes');
  assert.equal(scene.metrics().vignetteActive,true);
  scene.setVignette({darkness:1,optimized:true});
  assert.equal(scene.metrics().vignetteActive,false);
  scene.destroy();
});

function assertPixiRgba(color) {
  const match=/^rgba\((\d{1,3}),(\d{1,3}),(\d{1,3}),(0(?:\.\d+)?|1(?:\.0+)?)\)$/.exec(color);
  assert.ok(match,'PixiJS-compatible decimal rgba required: '+color);
  for(const channel of match.slice(1,4))
    assert.ok(Number(channel)<=255,'RGB channel exceeds 255: '+color);
}
test('near-nightfall vignette never emits scientific notation in RGB',()=>{
  const darkness=1-2.999800030600852e-8;
  const color=Bridge.vignetteDescription({darkness},912,420).colorStops[1].color;
  assert.equal(color,'rgba(0,0,0,0.15)');
  assertPixiRgba(color);
});
test('day-night and night-day transition gradients remain Pixi-compatible across regions',()=>{
  const darknesses=[0,1e-10,.02,.25,.5,.75,1-2.999800030600852e-8,1];
  for(const darkness of [...darknesses,...darknesses.slice().reverse()])
    for(let region=0;region<5;region++)
      for(const peaceBlend of [0,.23,.5,1]){
        const spec={region,darkness,peaceBlend,warmth:.4,phase:'sunset'};
        for(const layer of Bridge.atmosphereLayers(spec))
          for(const stop of layer.colorStops||[])assertPixiRgba(stop.color);
        for(const stop of Bridge.vignetteDescription(spec,912,420).colorStops)
          assertPixiRgba(stop.color);
      }
});
test('scene accepts repeated day-night gradient rebuilds without triggering Pixi color parse error',()=>{
  const {PIXI,app}=pixiFixture();
  const Gradient=PIXI.FillGradient;
  PIXI.FillGradient=class extends Gradient {
    constructor(options){
      super(options);
      for(const stop of options.colorStops||[])assertPixiRgba(stop.color);
    }
  };
  const scene=Bridge.create({PIXI,app,width:912,height:420});
  for(const darkness of [0,.3,.7,1-2.999800030600852e-8,1,.7,.3,0]){
    scene.setAtmosphere({region:0,darkness,warmth:.5,phase:'sunset'});
    scene.setVignette({darkness,optimized:false});
    scene.draw();
  }
  assert.equal(scene.metrics().vignetteActive,true);
  scene.destroy();
});

test('high-DPI Pixi backdrop retains the same logical geometry as Canvas',()=>{
  const {PIXI,app}=pixiFixture();
  const scene=Bridge.create({PIXI,app,width:912,height:420});
  const backing=picture('high-density-ground',2028,1290);
  scene.setBackground(backing,-220,-220,1352,860);
  const node=app.stage.children[0].children[0];
  assert.equal(node.position.x,-220);
  assert.equal(node.position.y,-220);
  assert.equal(node.width,1352,'logical terrain width must not inherit 1.5x bitmap width');
  assert.equal(node.height,860,'logical terrain height must not inherit 1.5x bitmap height');
  scene.destroy();
});


test('discarded procedural artwork unregisters after old scene actors are released',()=>{
  const {PIXI,app}=pixiFixture();
  const scene=Bridge.create({PIXI,app,width:912,height:420});
  scene.registerTexture('procedural:vale',picture());
  scene.syncActors([{key:'cottage',textureId:'procedural:vale',
    x:40,y:50,width:100,height:120,depth:1,opacity:1}]);
  assert.equal(scene.metrics().actors,1);
  scene.syncActors([]);
  assert.equal(scene.metrics().actors,0);
  assert.equal(scene.unregisterTexture('procedural:vale'),true);
  assert.equal(scene.hasTexture('procedural:vale'),false);
  assert.equal(scene.metrics().textureSources,0,'old GPU resources must not persist');
  assert.equal(scene.unregisterTexture('procedural:vale'),false,'double release is safe');
  scene.destroy();
});

test('Pixi atmosphere restores the same bounded daylight motes as Canvas, before vignette',()=>{
  const Visuals=require('../../src/prototype/visuals.js');
  const {PIXI,app}=pixiFixture();
  const scene=Bridge.create({PIXI,app,width:912,height:420});
  const daylight=Visuals.atmosphereMotes({
    width:608,height:280,region:0,darkness:0,time:10,
  });
  assert.equal(daylight.length,14);
  scene.setAtmosphere({region:0,darkness:0});
  scene.syncMotes(daylight,1.5);
  scene.setVignette({darkness:0,optimized:false});
  const effects=app.stage.children[0].children[1];
  const moteGraphic=effects.children.at(-2);
  assert.equal(moteGraphic.circles.length,14,'one reused GPU batch represents all Canvas motes');
  assert.deepEqual(moteGraphic.circles[0],[
    daylight[0].x*1.5,daylight[0].y*1.5,daylight[0].r*1.5,
  ],'CSS geometry matches Canvas zoom and the shared screen-space motion');
  assert.equal(moteGraphic.fillStyle.color,0xeadf9e,'Vale daylight palette preserved');
  assert.equal(moteGraphic.fillStyle.alpha,.18,'Canvas daylight opacity preserved');
  assert.equal(scene.metrics().atmosphereMotes,14);
  assert.equal(effects.children.at(-1).fillStyle.options.type,'radial',
    'vignette must stay in front of motes');
  scene.syncMotes(Visuals.atmosphereMotes({
    width:608,height:280,region:0,darkness:1,time:12,
  }),1.5);
  assert.equal(effects.children.at(-2),moteGraphic,'motes reuse one GPU node during motion');
  assert.equal(moteGraphic.fillStyle.color,0xdcefa8,'night palette preserved');
  assert.equal(moteGraphic.fillStyle.alpha,.24,'Canvas night alpha preserved');
  scene.syncMotes([],1.5);
  assert.equal(moteGraphic.visible,false,'active Optimization Mode suppresses GPU motes');
  assert.equal(scene.metrics().atmosphereMotes,0);
  scene.destroy();
});

test('Canvas atmosphere mote contract preserves regional counts, deterministic motion and optimization',()=>{
  const Visuals=require('../../src/prototype/visuals.js');
  const options={width:608,height:280,region:0,darkness:0,time:10};
  const first=Visuals.atmosphereMotes(options);
  const same=Visuals.atmosphereMotes(options);
  assert.deepEqual(first,same,'no randomized particle emitter or game state mutation');
  const moved=Visuals.atmosphereMotes({...options,time:12});
  assert.notEqual(moved[0].x,first[0].x,'Canvas drift animates without player movement');
  assert.equal(Visuals.atmosphereMotes({...options,region:3}).length,18);
  assert.equal(Visuals.atmosphereMotes({...options,region:4}).length,18);
  assert.equal(Visuals.atmosphereMotes({...options,dungeon:true}).length,8);
  assert.equal(Visuals.atmosphereMotes({...options,room:true}).length,8);
  assert.deepEqual(Visuals.atmosphereMotes({...options,optimized:true}),[]);
  const march=Visuals.atmosphereMotes({...options,region:1});
  assert.equal(march[0].r,2.5,'approved marsh mist scale remains unchanged');
  assert.deepEqual(march[0].rgb,[184,216,202]);
  assert.deepEqual(Visuals.atmosphereMotes({...options,region:0,darkness:1})[0].rgb,
    [220,239,168],'approved night Vale tint remains unchanged');
});

test('Canvas-matched hero shadows and ground markers sit below sprite and track movement',()=>{
  const {PIXI,app}=pixiFixture();
  const scene=Bridge.create({PIXI,app,width:912,height:420});
  scene.registerTexture('hero.png',picture());
  const hero={...actor(),ground:{x:112,y:174,rx:18,ry:5.5,
    marker:{color:'#f5d992bb',important:true}}};
  scene.syncActors([hero]);
  const nodes=app.stage.children[0].children[0].children;
  assert.equal(nodes.length,2,'one reusable ground graphic and one sprite');
  const [ground,sprite]=nodes;
  assert.equal(sprite.texture.source.width,576);
  assert.equal(ground.position.x,112);
  assert.deepEqual(ground.ellipses[0],[0,9,28,11],
    'first ground shape is the Canvas hero selection ring');
  assert.deepEqual(ground.ellipses.at(-1),[1,11,18,5.5],
    'dark contact ellipse uses original Canvas radii');
  assert.equal(ground.strokes[0].color,0xf5d992);
  assert.equal(ground.strokes[0].alpha,0xbb/255);
  assert.equal(ground.fills.at(-1).alpha,0x66/255);
  scene.syncActors([{...hero,x:88,ground:{...hero.ground,x:160,y:199,scale:1.5}}]);
  assert.deepEqual(ground.ellipses.at(-1),[1.5,16.5,27,8.25],
    'GPU shadow scales with 150% camera zoom and retains Canvas feet offset');
  const moved=app.stage.children[0].children[0].children;
  assert.equal(moved[0],ground,'reuse ground artwork without allocating per frame');
  assert.equal(moved[1],sprite,'same approved actor sprite remains');
  assert.equal(ground.position.x,160);
  assert.equal(ground.position.y,199);
  scene.syncActors([]);
  assert.equal(app.stage.children[0].children[0].children.length,0);
  scene.destroy();
});
test('shadows use Canvas prop sizes and share depth ordering with their actor',()=>{
  const {PIXI,app}=pixiFixture();
  const scene=Bridge.create({PIXI,app,width:912,height:420});
  scene.registerTexture('hero.png',picture());
  const prop={...actor('house',170,5),ground:{x:170,y:180,rx:31,ry:8,marker:null}};
  const sheep={...actor('sheep',35,2),ground:{x:35,y:155,rx:18,ry:5.5,marker:null}};
  scene.syncActors([prop,sheep]);
  const nodes=app.stage.children[0].children[0].children;
  assert.equal(nodes.length,4);
  assert.deepEqual(nodes[0].ellipses.at(-1),[1,11,18,5.5]);
  assert.deepEqual(nodes[2].ellipses.at(-1),[1,11,31,8]);
  assert.equal(nodes[1].position.x,35);
  assert.equal(nodes[3].position.x,170);
  assert.equal(nodes[0].strokes.length,0,'props without rings get only contact shadows');
  scene.destroy();
});
