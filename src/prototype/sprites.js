/* Static illustrated sprite layer. Falls back to PrototypeVisuals until an asset is ready. */
(function(root){
'use strict';

const DEFAULT_MANIFEST='./assets/sprites/manifest.json';
let manifest={version:1,sprites:{}};
const images=new Map(),loading=new Map(),failed=new Set();

const clean=s=>String(s||'').toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'');
const regionKey=region=>['vale','march','highlands','frontier','crown'][region]||'vale';

function candidateKeys(e,region=0,rescued=false){
 if(!e)return [];
 const kind=e.renderKind;
 if(kind==='hero')return ['hero:'+clean(e.class)];
 if(kind==='ally'){
  const role=clean(e.class||e.type||'worker');
  return ['ally:'+role];
 }
 if(kind==='enemy'){
  if(e.type==='boss')return ['boss:'+clean(e.family)];
  const base='enemy:'+clean(e.species||e.family||e.type);
  const variants=[];
  if(e.hybrid)variants.push('hybrid');
  if(e.ranged)variants.push('ranged');
  if(e.guard)variants.push('guard');
  const keys=[];
  if(variants.length)keys.push(base+':'+variants.join('-'));
  if(e.hybrid)keys.push(base+':hybrid');
  if(e.ranged)keys.push(base+':ranged');
  if(e.guard)keys.push(base+':guard');
  keys.push(base);
  return [...new Set(keys)];
 }
 if(kind==='npc'){
  if(e.kind==='cage')return ['cage:'+clean(e.family)+':'+(rescued?'open':'closed')];
  if(e.family&&['teacher','smith','alchemist'].includes(e.kind))return ['specialist:'+clean(e.family)];
  if(e.kind==='dungeon'||e.kind==='exit')return ['dungeon:'+clean(e.family)];
  if(e.kind==='transport')return ['transport:'+clean(e.name||e.icon||'regional')];
  if(e.kind==='mini')return ['site:mini:'+regionKey(region)];
  if(e.kind==='landmark')return ['landmark:'+clean(e.id||e.name)];
  return ['npc:'+clean(e.kind)+':'+regionKey(region),'npc:'+clean(e.kind)];
 }
 if(kind==='building'){
  const state=Number.isFinite(e.progress)&&e.progress<4?'construction':e.full?'full':'basic';
  return ['building:barracks:'+regionKey(region)+':'+state,'building:barracks:'+regionKey(region),'building:barracks'];
 }
 if(kind==='node')return ['node:'+clean(e.name||e.icon||'resource')+':'+regionKey(region),'node:'+regionKey(region)];
 if(kind==='prop'){
  if(e.decorative)return ['prop:'+clean(e.structure)+':'+regionKey(region),'prop:'+clean(e.structure)];
  if(e.structure)return ['prop:'+clean(e.structure)+':'+regionKey(region),'prop:'+clean(e.structure)];
  const wild=e.icon==='🪨'?'rock':'wild';
  return ['prop:'+wild+':'+regionKey(region),'prop:'+wild];
 }
 return [];
}

function installManifest(next){
 if(!next||typeof next!=='object'||!next.sprites||typeof next.sprites!=='object')return false;
 manifest={version:Number(next.version)||1,sprites:{...next.sprites}};
 failed.clear();
 return true;
}

function definitionFor(e,region=0,rescued=false){
 for(const key of candidateKeys(e,region,rescued)){
  const entry=manifest.sprites[key];
  if(entry&&entry.src)return {key,entry};
 }
 return null;
}

function embeddedSource(src){
 const table=root.__AZEROTH_EMBEDDED_SPRITES__;
 return table&&table[src]||src;
}

function ensure(key,entry){
 if(images.has(key)||loading.has(key)||failed.has(key)||typeof root.Image!=='function')return loading.get(key)||null;
 const promise=new Promise(resolve=>{
  const img=new root.Image();
  img.decoding='async';
  img.onload=()=>{images.set(key,img);loading.delete(key);resolve(img);};
  img.onerror=()=>{failed.add(key);loading.delete(key);resolve(null);};
  img.src=embeddedSource(entry.src);
 });
 loading.set(key,promise);
 return promise;
}

async function preload(url=DEFAULT_MANIFEST){
 if(root.__AZEROTH_SPRITE_MANIFEST__)installManifest(root.__AZEROTH_SPRITE_MANIFEST__);
 else if(typeof root.fetch==='function'){
  try{
   const response=await root.fetch(url,{cache:'no-cache'});
   if(response.ok)installManifest(await response.json());
  }catch(_){}
 }
 const pending=[];
 for(const [key,entry]of Object.entries(manifest.sprites))if(entry?.src){const p=ensure(key,entry);if(p)pending.push(p);}
 if(pending.length)await Promise.allSettled(pending);
 return manifest;
}

function overlay(ctx,e,p,entry){
 if(!e||!ctx)return;
 const scale=Number(entry?.overlayScale)||(e.type==='boss'?1.25:1);
 ctx.save();ctx.translate(p.x,p.y);ctx.lineJoin='round';ctx.lineCap='round';
 const line=(pts,c,w=2)=>{ctx.strokeStyle=c;ctx.lineWidth=w*scale;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x*scale,y*scale):ctx.moveTo(x*scale,y*scale));ctx.stroke();};
 const poly=(pts,c)=>{ctx.fillStyle=c;ctx.strokeStyle='#25312d';ctx.lineWidth=1.2*scale;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x*scale,y*scale):ctx.moveTo(x*scale,y*scale));ctx.closePath();ctx.fill();ctx.stroke();};
 const rect=(x,y,w,h,c)=>poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],c);
 const glint=(x,y,c='#f3d690',r=2)=>{ctx.save();ctx.globalAlpha=.85;ctx.fillStyle=c;ctx.beginPath();ctx.arc(x*scale,y*scale,r*scale,0,Math.PI*2);ctx.fill();ctx.restore();};
 if(e.rangedAim){ctx.fillStyle='#ead6a0';ctx.strokeStyle='#25312d';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,-56*scale,5*scale,5*scale,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
 if(e.form==='true'){
  ctx.save();ctx.globalAlpha=.48;ctx.strokeStyle=e.type==='boss'?'#fff0a6':'#e5c876';ctx.lineWidth=(e.type==='boss'?3:2)*scale;
  for(const r of e.type==='boss'?[30,40,50]:[23,30]){ctx.beginPath();ctx.ellipse(0,11*scale,r*scale,r*.28*scale,0,0,Math.PI*2);ctx.stroke();}
  if(e.type==='boss'){ctx.globalAlpha=.18;ctx.fillStyle='#f1c75e';ctx.beginPath();ctx.ellipse(0,-11*scale,34*scale,52*scale,0,0,Math.PI*2);ctx.fill();}
  ctx.restore();
  line([[-19,18],[-8,23],[9,23],[21,17]],'#e2c36f',e.type==='boss'?3:2);
  for(const x of [-17,17])poly([[x,-36],[x*1.45,-54],[x*.48,-42]],'#e1bd6d');
  for(const x of [-11,0,11])glint(x,-47,'#ffe7a8',e.type==='boss'?2.4:1.3);
  if(e.type==='boss'){poly([[-22,-52],[-14,-66],[-7,-56],[0,-70],[7,-56],[14,-66],[22,-52]],'#d7ad42');for(const x of [-26,26])glint(x,-28,'#fff4bd',2.8);}
 }else if(e.form==='ringleader'){
  rect(-4,-47,8,8,'#d3b46c');
  poly([[-12,-40],[-15,-49],[-5,-45],[0,-53],[5,-45],[15,-49],[12,-40]],'#d3b46c');
  for(const x of [-16,16])line([[x,-12],[x*1.2,-24]],'#d5b36e',2);
  glint(0,-51,'#fff0b7',1.5);
  if(e.frenzy){ctx.save();ctx.globalAlpha=.55;ctx.strokeStyle='#ef8c63';ctx.lineWidth=2.5*scale;for(const r of [25,32]){ctx.beginPath();ctx.ellipse(0,10*scale,r*scale,r*.27*scale,0,0,Math.PI*2);ctx.stroke();}ctx.restore();for(const x of [-19,19])glint(x,-21,'#ff9f6b',2);}
 }
 ctx.restore();
}

function draw(ctx,e,p,region=0,rescued=false){
 const found=definitionFor(e,region,rescued);
 if(!found)return false;
 const {key,entry}=found,img=images.get(key);
 if(!img){ensure(key,entry);return false;}
 const dw=Number(entry.displayWidth)||img.naturalWidth||img.width;
 const dh=Number(entry.displayHeight)||img.naturalHeight||img.height;
 const ax=Number.isFinite(entry.anchorX)?entry.anchorX:.5;
 const ay=Number.isFinite(entry.anchorY)?entry.anchorY:.88;
 ctx.save();
 if(Number.isFinite(entry.opacity))ctx.globalAlpha=entry.opacity;
 ctx.drawImage(img,p.x-dw*ax,p.y-dh*ay,dw,dh);
 ctx.restore();
 overlay(ctx,e,p,entry);
 return true;
}

function height(e,region=0,rescued=false,fallback=54){
 const found=definitionFor(e,region,rescued);
 if(!found)return fallback;
 const entry=found.entry,dh=Number(entry.displayHeight),ay=Number.isFinite(entry.anchorY)?entry.anchorY:.88;
 return Number(entry.labelHeight)||Number.isFinite(dh)?(Number(entry.labelHeight)||dh*ay):fallback;
}

function status(){
 return {manifestVersion:manifest.version,definitions:Object.keys(manifest.sprites).length,loaded:images.size,loading:loading.size,failed:failed.size};
}

const api={DEFAULT_MANIFEST,candidateKeys,installManifest,definitionFor,preload,draw,height,status};
root.PrototypeSprites=api;
if(typeof module!=='undefined')module.exports=api;
if(typeof document!=='undefined')preload();
})(typeof globalThis!=='undefined'?globalThis:this);
