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
      this.blendMode='normal';this.circles=[];this.rects=[];
    }
    clear(){this.circles=[];this.rects=[];return this;}
    circle(...args){this.circles.push(args);return this;}
    rect(...args){this.rects.push(args);return this;}
    fill(g){this.fillStyle=g;calls.glows++;return this;}
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
