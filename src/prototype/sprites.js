/* Static illustrated sprite layer. Missing or unsafe variants fall back to PrototypeVisuals. */
(function(root){
'use strict';

const DEFAULT_MANIFEST='./assets/sprites/manifest.json';
let manifest={version:2,sprites:{}};
const images=new Map(),loading=new Map(),failed=new Set();

const clean=s=>String(s||'').toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'');
const regionKey=region=>['vale','march','highlands','frontier','crown'][region]||'vale';

function enemyKey(e){
 const base='enemy:'+clean(e.species||e.family||e.type);
 if(e.captain||e.roomCaptain||e.fieldCaptain){
  const tags=['captain'];
  if(e.hybrid)tags.push('hybrid');
  if(e.ranged)tags.push('ranged');
  if(e.guard)tags.push('guard');
  return base+':'+tags.join('-');
 }
 const tags=[];
 if(e.hybrid)tags.push('hybrid');
 if(e.ranged)tags.push('ranged');
 if(e.guard)tags.push('guard');
 return tags.length?base+':'+tags.join('-'):base;
}

function candidateKeys(e,region=0,rescued=false){
 if(!e)return [];
 const kind=e.renderKind;
 if(kind==='hero')return ['hero:'+clean(e.class)];
 if(kind==='ally')return ['ally:'+clean(e.class||e.type||'worker')];
 if(kind==='enemy'){
  if(e.type==='boss')return ['boss:'+clean(e.family)];
  return [enemyKey(e)];
 }
 if(kind==='npc'){
  if(e.kind==='cage')return ['cage:'+clean(e.family)+':'+(rescued?'open':'closed')];
  if(e.family&&['teacher','smith','alchemist'].includes(e.kind))return ['specialist:'+clean(e.family)];
  if(e.kind==='dungeon'||e.kind==='exit')return ['dungeon:'+clean(e.family)];
  if(e.kind==='transport')return ['transport:'+clean(e.name||e.icon||'regional')];
  if(e.kind==='mini')return ['site:mini:'+regionKey(region)];
  if(e.kind==='landmark')return ['landmark:'+clean(e.id||e.name)];
  return ['npc:'+clean(e.kind)+':'+regionKey(region)];
 }
 if(kind==='building'){
  const state=Number.isFinite(e.progress)&&e.progress<4?'construction':e.full?'full':'basic';
  return ['building:barracks:'+regionKey(region)+':'+state];
 }
 if(kind==='node')return ['node:'+clean(e.name||e.icon||'resource')+':'+regionKey(region)];
 if(kind==='prop'){
  if(e.decorative)return ['prop:'+clean(e.structure)+':'+regionKey(region)];
  if(e.structure)return ['prop:'+clean(e.structure)+':'+regionKey(region)];
  return ['prop:'+(e.icon==='🪨'?'rock':'wild')+':'+regionKey(region)];
 }
 return [];
}

function installManifest(next){
 if(!next||typeof next!=='object'||!next.sprites||typeof next.sprites!=='object')return false;
 manifest={version:Number(next.version)||2,sprites:{...next.sprites}};
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

function ensure(key,entry){
 if(images.has(key)||loading.has(key)||failed.has(key)||typeof root.Image!=='function')return loading.get(key)||null;
 const promise=new Promise(resolve=>{
  const img=new root.Image();
  img.decoding='async';
  img.onload=()=>{images.set(key,img);loading.delete(key);resolve(img);};
  img.onerror=()=>{failed.add(key);loading.delete(key);resolve(null);};
  img.src=entry.src;
 });
 loading.set(key,promise);
 return promise;
}

async function preload(url=DEFAULT_MANIFEST){
 if(typeof root.fetch==='function'){
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

function entityScale(e,entry){
 const authored=Number(entry?.scale);
 const base=Number.isFinite(authored)&&authored>0?authored:1;
 const entity=Number.isFinite(e?.visualScale)&&e.visualScale>0?e.visualScale:1;
 const trueBoss=e?.type==='boss'&&e?.form==='true'?1.14:1;
 return base*entity*trueBoss;
}

function overlay(ctx,e,p,entry,scale){
 if(!e||!ctx)return;
 const fxScale=(Number(entry?.overlayScale)||1)*scale;
 ctx.save();ctx.translate(p.x,p.y);ctx.lineJoin='round';ctx.lineCap='round';
 const line=(pts,c,w=2)=>{ctx.strokeStyle=c;ctx.lineWidth=w*fxScale;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x*fxScale,y*fxScale):ctx.moveTo(x*fxScale,y*fxScale));ctx.stroke();};
 const poly=(pts,c)=>{ctx.fillStyle=c;ctx.strokeStyle='#25312d';ctx.lineWidth=1.2*fxScale;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x*fxScale,y*fxScale):ctx.moveTo(x*fxScale,y*fxScale));ctx.closePath();ctx.fill();ctx.stroke();};
 const rect=(x,y,w,h,c)=>poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],c);
 const glint=(x,y,c='#f3d690',r=2)=>{ctx.save();ctx.globalAlpha=.85;ctx.fillStyle=c;ctx.beginPath();ctx.arc(x*fxScale,y*fxScale,r*fxScale,0,Math.PI*2);ctx.fill();ctx.restore();};
 if(e.rangedAim){ctx.fillStyle='#ead6a0';ctx.strokeStyle='#25312d';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,-56*fxScale,5*fxScale,5*fxScale,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
 if(e.form==='true'){
  ctx.save();ctx.globalAlpha=.48;ctx.strokeStyle=e.type==='boss'?'#fff0a6':'#e5c876';ctx.lineWidth=(e.type==='boss'?3:2)*fxScale;
  for(const r of e.type==='boss'?[30,40,50]:[23,30]){ctx.beginPath();ctx.ellipse(0,11*fxScale,r*fxScale,r*.28*fxScale,0,0,Math.PI*2);ctx.stroke();}
  if(e.type==='boss'){ctx.globalAlpha=.18;ctx.fillStyle='#f1c75e';ctx.beginPath();ctx.ellipse(0,-11*fxScale,34*fxScale,52*fxScale,0,0,Math.PI*2);ctx.fill();}
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
  if(e.frenzy){ctx.save();ctx.globalAlpha=.55;ctx.strokeStyle='#ef8c63';ctx.lineWidth=2.5*fxScale;for(const r of [25,32]){ctx.beginPath();ctx.ellipse(0,10*fxScale,r*fxScale,r*.27*fxScale,0,0,Math.PI*2);ctx.stroke();}ctx.restore();for(const x of [-19,19])glint(x,-21,'#ff9f6b',2);}
 }
 ctx.restore();
}

function draw(ctx,e,p,region=0,rescued=false){
 const found=definitionFor(e,region,rescued);
 if(!found)return false;
 const {key,entry}=found,img=images.get(key);
 if(!img){ensure(key,entry);return false;}
 const scale=entityScale(e,entry),dw=(Number(entry.displayWidth)||img.naturalWidth||img.width)*scale,dh=(Number(entry.displayHeight)||img.naturalHeight||img.height)*scale;
 const ax=Number.isFinite(entry.anchorX)?entry.anchorX:.5,ay=Number.isFinite(entry.anchorY)?entry.anchorY:.88;
 ctx.save();
 if(Number.isFinite(entry.opacity))ctx.globalAlpha=entry.opacity;
 ctx.drawImage(img,p.x-dw*ax,p.y-dh*ay,dw,dh);
 ctx.restore();
 overlay(ctx,e,p,entry,scale);
 return true;
}

function height(e,region=0,rescued=false,fallback=54){
 const found=definitionFor(e,region,rescued);
 if(!found)return fallback;
 const entry=found.entry,scale=entityScale(e,entry),label=Number(entry.labelHeight),dh=Number(entry.displayHeight),ay=Number.isFinite(entry.anchorY)?entry.anchorY:.88;
 if(Number.isFinite(label)&&label>0)return label*scale;
 if(Number.isFinite(dh)&&dh>0)return dh*ay*scale;
 return fallback;
}

function status(){return {manifestVersion:manifest.version,definitions:Object.keys(manifest.sprites).length,loaded:images.size,loading:loading.size,failed:failed.size};}

const api={DEFAULT_MANIFEST,candidateKeys,installManifest,definitionFor,preload,draw,height,status,entityScale};
root.PrototypeSprites=api;
if(typeof module!=='undefined')module.exports=api;
if(typeof document!=='undefined')preload();
})(typeof globalThis!=='undefined'?globalThis:this);
