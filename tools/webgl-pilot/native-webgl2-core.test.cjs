'use strict';
// Small preintegration-only tests. They do NOT make the native WebGL renderer
// production ready or replace visual/performance testing on real hardware.
const assert = require('node:assert/strict');
const test = require('node:test');
const Core = require('./native-webgl2-core.js');

function fakeGPUCanvas(width = 640, height = 360) {
  const calls = [], events = new Map();
  const gl = {
    VERTEX_SHADER: 35633, FRAGMENT_SHADER: 35632, COMPILE_STATUS: 35713,
    LINK_STATUS: 35714, ARRAY_BUFFER: 34962, STATIC_DRAW: 35044,
    FLOAT: 5126, RGBA: 6408, UNSIGNED_BYTE: 5121,
    TEXTURE0: 33984, TEXTURE_2D: 3553, TEXTURE_MIN_FILTER: 10241,
    TEXTURE_MAG_FILTER: 10240, TEXTURE_WRAP_S: 10242,
    TEXTURE_WRAP_T: 10243, CLAMP_TO_EDGE: 33071,
    NEAREST: 9728, UNPACK_FLIP_Y_WEBGL: 37440,
    UNPACK_PREMULTIPLY_ALPHA_WEBGL: 37441, MAX_TEXTURE_SIZE: 3379,
    BLEND: 3042, ONE: 1, ONE_MINUS_SRC_ALPHA: 771,
    ONE_MINUS_SRC_COLOR: 769, TRIANGLES: 4,
    COLOR_BUFFER_BIT: 16384, NO_ERROR: 0,
    createShader: () => ({}), shaderSource: () => {},
    compileShader: () => {}, getShaderParameter: () => true,
    getShaderInfoLog: () => '', deleteShader: () => {},
    createProgram: () => ({}), attachShader: () => {},
    linkProgram: () => {}, getProgramParameter: () => true,
    getProgramInfoLog: () => '', useProgram: () => {},
    deleteProgram: () => {}, createBuffer: () => ({}),
    bindBuffer: () => {}, bufferData: () => {},
    deleteBuffer: () => {}, getAttribLocation: () => 0,
    enableVertexAttribArray: () => {}, vertexAttribPointer: () => {},
    getUniformLocation: (_, name) => name,
    uniform2f: () => {}, uniform4f: () => {},
    uniform3f: () => {}, uniform1f: () => {}, uniform1i: () => {},
    createTexture: () => ({}), deleteTexture: () => {},
    activeTexture: () => {}, bindTexture: () => {},
    pixelStorei: () => {}, texParameteri: () => {},
    texImage2D: (...args) => calls.push(['upload',args]),
    getParameter: () => 4096,
    getError: () => 0, isContextLost: () => false,
    enable: () => {}, disable: () => {},
    blendFunc: (...args) => calls.push(['normalBlend',args]),
    blendFuncSeparate: (...args) => calls.push(['screenBlend',args]),
    viewport: () => {}, clearColor: () => {}, clear: () => {},
    drawArrays: (...args) => calls.push(['draw',args])
  };
  const canvas = {
    width, height, getContext(type) {
      assert.equal(type,'webgl2','2D Canvas must never be used inside native GPU core');
      return gl;
    },
    addEventListener: (event, callback) => events.set(event,callback),
    removeEventListener: (event) => events.delete(event)
  };
  return {canvas,gl,calls,events};
}

test('world isometry and camera anchor match the production renderer projection',()=>{
  const projected=Core.iso(10,20);
  assert.ok(Math.abs(projected.x+7.6)<1e-9);
  assert.ok(Math.abs(projected.y-8.1)<1e-9);
  const platform={cameraZoom:1.5,cameraAnchor:(w,h)=>({x:w*.45,y:h*.42})};
  const center=Core.project({x:600,y:700},{x:600,y:700},
    {width:900,height:540},platform);
  assert.deepEqual(center,{x:405,y:226.8});
  const moved=Core.project({x:610,y:700},{x:600,y:700},
    {width:900,height:540},platform);
  assert.ok(Math.abs(moved.x-center.x-11.4)<1e-9);
  assert.ok(Math.abs(moved.y-center.y-4.05)<1e-9);
});

test('original sprite pivots, clip rectangles and mirroring preserve the approved art',()=>{
  const entry={displayWidth:192,displayHeight:192,anchorX:0.5,anchorY:0.75};
  const ordinary=Core.spriteLayout({
    textureId:'hero',entry,imageWidth:576,imageHeight:576,
    point:{x:250,y:350},scale:1
  });
  assert.deepEqual(
    [ordinary.x,ordinary.y,ordinary.width,ordinary.height],
    [154,206,192,192]);
  assert.deepEqual(ordinary.sourceRect,[0,0,576,576]);
  const frame={rect:[2,2,576,576],pivot:[288,432]};
  const facingLeft=Core.spriteLayout({
    textureId:'atlas',entry,frame,imageWidth:580,imageHeight:580,
    point:{x:250,y:350},scale:1,facing:-1
  });
  assert.equal(facingLeft.flipX,true);
  assert.equal(facingLeft.x,154);
  assert.deepEqual(facingLeft.sourceRect,frame.rect);
  assert.throws(()=>Core.spriteLayout({
    textureId:'bad',entry,frame,imageWidth:570,imageHeight:570,
    point:{x:0,y:0}}),/inside original image/);
});

test('original night-lamp locations, radii and tint feed native light commands',()=>{
  const lamps=Core.lampGlowCommands([
    {x:40,y:60,kind:'window'},
    {x:70,y:80,kind:'work-fire'},
    {x:90,y:100,kind:'carried-lantern'}
  ],4,{hero:{x:20,y:30}});
  assert.equal(lamps.length,5);
  assert.deepEqual(lamps[0].rgb,[215,191,231]);
  assert.deepEqual([lamps[1].radius,lamps[1].y],[70,28]);
  assert.deepEqual([lamps[2].radius,lamps[2].y],[105,67]);
  assert.deepEqual([lamps[3].radius,lamps[3].y],[64,100]);
  assert.equal(lamps[4].radius,10);
  assert.deepEqual(Core.lampGlowCommands(lamps,4,{darkness:0}),[]);
});

test('WebGL sprites and lights are drawn natively with screen blending, no Canvas calls',()=>{
  const {canvas,calls}=fakeGPUCanvas();
  const core=Core.create({canvas});
  core.registerTexture('actor',{width:64,height:64});
  const commands=[
    {kind:'sprite',textureId:'actor',x:50,y:60,width:32,height:32,
      sourceRect:[0,0,64,64],opacity:1,flipX:false},
    {kind:'nightGrade',top:[.1,.2,.3,.48],bottom:[.1,.2,.3,.58],strength:1},
    {kind:'screenGlow',x:80,y:75,radius:70,rgb:[255,207,132],alpha:.27},
  ];
  const r=core.draw(commands);
  assert.deepEqual(r,{frames:1,commands:3});
  assert.equal(calls.filter(c=>c[0]==='draw').length,3);
  assert.equal(calls.filter(c=>c[0]==='upload').length,1);
  assert.equal(calls.filter(c=>c[0]==='screenBlend').length,1);
  assert.deepEqual(calls.find(c=>c[0]==='screenBlend')[1],
    [1,769,1,771]);
  assert.equal(core.metrics().textureBytes,16384);
  assert.equal(core.releaseTexture('actor'),true);
  assert.equal(core.metrics().textureBytes,0);
  core.destroy();
  assert.equal(core.available(),false);
});

test('bounded GPU residency rejects oversize textures before upload',()=>{
  const {canvas,calls}=fakeGPUCanvas();
  const core=Core.create({canvas,budgetBytes:4096});
  core.registerTexture('small',{width:16,height:16});
  assert.throws(()=>core.registerTexture('too-large',{width:64,height:64}),
    /budget exceeded/);
  assert.equal(calls.filter(c=>c[0]==='upload').length,1);
  assert.throws(()=>core.draw([{kind:'sprite',textureId:'missing',
    x:0,y:0,width:32,height:32}]),/texture missing/);
  core.destroy();
});

test('WebGL context loss fails closed and requires fresh renderer/asset upload',()=>{
  const {canvas,events}=fakeGPUCanvas();
  let losses=0,restores=0,prevented=0;
  const core=Core.create({
    canvas,onContextLost:()=>losses++,onRestoreRequired:()=>restores++
  });
  core.registerTexture('hero',{width:8,height:8});
  events.get('webglcontextlost')({preventDefault:()=>prevented++});
  assert.equal(losses,1);assert.equal(prevented,1);
  assert.equal(core.available(),false);
  assert.throws(()=>core.draw([]),/context lost/);
  events.get('webglcontextrestored')();
  assert.equal(restores,1);
  assert.equal(core.available(),false,'must not silently reuse invalid GPU resources');
  core.destroy();
  assert.equal(events.size,0);
});

test('unsupported GPU commands fail loudly, never silently omit game artwork',()=>{
  const {canvas}=fakeGPUCanvas(),core=Core.create({canvas});
  assert.throws(()=>core.draw([{kind:'some-unimplemented-game-effect'}]),
    /Unsupported GPU scene command/);
  core.destroy();
});
