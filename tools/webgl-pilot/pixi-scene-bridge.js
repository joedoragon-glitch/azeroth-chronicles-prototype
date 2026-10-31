/* PRE-INTEGRATION: PixiJS scene bridge. Actual sprite/terrain textures, actors
   and lamp positions come from the real Azeroth pilot, not manufactured geometry.
   Never loaded by the playable PWA. */
(function(root) {
 'use strict';
 const assert=(x,msg)=>{if(!x)throw Error(msg);return x;};
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const hex=rgb=>(rgb[0]<<16)|(rgb[1]<<8)|rgb[2];
 // Original PrototypeVisuals.atmosphere palettes, unmodified.
 const NIGHT=[[11,25,42,.48],[12,32,44,.48],[19,29,42,.50],
   [32,20,35,.52],[27,19,43,.54]];
 const DAY=[[213,229,163,.045],[150,206,205,.05],[221,219,184,.045],
   [215,157,120,.05],[166,146,196,.05]];
 // PixiJS FillGradient requires decimal CSS rgba(), including for minuscule alphas.
 // Centralize formatting so no light/grade/vignette can emit exponent notation.
 const rgba=(rgb,a)=>'rgba('+rgb.slice(0,3).map(c=>Math.round(clamp(c,0,255))).join(',')+
   ','+clamp(a,0,1).toFixed(6).replace(/0+$/,'').replace(/\.$/,'')+')';
 // Round subpixel light intensities to stable, reusable visual states.
 const lampOpacity=a=>Math.round(clamp(a,0,1)*1024)/1024;
 const MAX_CACHED_LAMP_GRADIENTS=96;
 function atmosphereLayers({region=0,darkness=0,peaceBlend=0,
                            optimized=false,warmth=0,phase='day'}={}) {
   const i=Math.max(0,Math.min(4,Math.trunc(region)||0));
   const night=clamp(darkness,0,1),day=1-night,peace=clamp(peaceBlend,0,1);
   const layers=[];
   if(night>0){
     layers.push({type:'night',style:'linear',colorStops:[
       {offset:0,color:rgba(NIGHT[i],NIGHT[i][3]*night)},
       {offset:1,color:rgba([9+13*peace,17+14*peace,30+19*peace],
         (.58-.28*peace)*night)}
     ],start:{x:0,y:0},end:{x:0,y:1}});
   }
   if(day>0){
     layers.push({type:'day-tint',style:'solid',rgb:DAY[i].slice(0,3),
       opacity:DAY[i][3]*day});
     if(!optimized)layers.push({type:'day-sun',style:'linear',
       start:{x:0,y:0},end:{x:1,y:1},colorStops:[
         {offset:0,color:rgba([255,244,203],.07*day)},
         {offset:.45,color:rgba([255,255,255],0)},
         {offset:1,color:rgba(i>=3?[97,56,55]:[22,55,42],
           (i>=3?.035:.025)*day)}
       ]});
   }
   if(warmth>0){
     const sunset=phase==='sunset',strength=clamp(warmth,0,1)*
       (phase==='victory-sunrise'?1.25:1);
     layers.push({type:'warmth',style:'linear',
       start:{x:0,y:sunset?.15:.8},end:{x:1,y:sunset?.9:.1},
       colorStops:[
         {offset:0,color:rgba(sunset?[244,139,70]:[248,185,177],
           (sunset?.23:.18)*strength)},
         {offset:.52,color:rgba([255,216,143],.07*strength)},
         {offset:1,color:rgba(sunset?[103,64,126]:[255,233,171],
           (sunset?.09:.19)*strength)}
       ]});
   }
   return layers;
 }
 // The Canvas artist's final vignette, represented directly as a GPU gradient.
 function vignetteDescription({darkness=0,optimized=false}={},width,height) {
   if(optimized)return null;
   assert(Number.isFinite(width)&&Number.isFinite(height)&&width>0&&height>0,
     'Positive viewport needed for original vignette');
   const night=clamp(darkness,0,1),day=1-night;
   return {
     type:'radial',textureSpace:'global',
     center:{x:width*.5,y:height*.48},
     innerRadius:Math.min(width,height)*.18,
     outerCenter:{x:width*.5,y:height*.5},
     outerRadius:Math.max(width,height)*.72,
     colorStops:[
       {offset:0,color:'rgba(0,0,0,0)'},
       {offset:1,color:rgba([5*day,15*day,10*day],.12+.03*night)}
     ]
   };
 }
 function create({PIXI,app,width,height}={}) {
   assert(PIXI?.Container && PIXI?.Sprite && PIXI?.Graphics && PIXI?.FillGradient,
     'PixiJS v8 scene primitives required');
   assert(app?.stage && app?.renderer && width>0 && height>0,
     'GPU application and viewport required');
   const rootStage=new PIXI.Container();
   // Original liquid highlights sit above the baked terrain yet below
   // scenery/actors and the existing atmospheric grade.
   const liquidGraphic=new PIXI.Graphics();
   const actorsStage=new PIXI.Container();
   const effectsStage=new PIXI.Container();
   app.stage.addChild(rootStage);
   rootStage.addChild(liquidGraphic);
   rootStage.addChild(actorsStage);
   rootStage.addChild(effectsStage);
   const actors=new Map(), glowObjects=new Map(), gradients=new Map(), frameTextures=new Map();
   let background=null,grade=null, gradeGradients=[],atmosphereSignature=null,
     vignette=null,vignetteGradient=null,vignetteSignature=null,
     spritesUpdated=0, resources=new Map();
   let backdropTexture=null, discarded=0, moteGraphic=null, moteCount=0, liquidCount=0;
   const keyOf=entity=>String(entity.key);
   function setBackground(texture,x,y,width,height) {
     if(!background) {
       background=new PIXI.Sprite(texture);
       rootStage.addChildAt(background,0);
     } else background.texture=texture;
     background.tint=0xffffff;
     background.position.set(x,y);
     // The backing raster can be 1.5x high DPI while the world remains CSS-sized.
     if(Number.isFinite(width)&&width>0)background.width=width;
     if(Number.isFinite(height)&&height>0)background.height=height;
     backdropTexture=texture;
   }
   function setSolidBackground(color,width,height) {
     // Reuse Pixi's 1px white texture instead of scenery-sized GPU buffers.
     setBackground(PIXI.Texture.WHITE,0,0,width,height);
     background.tint=color;
   }
   function moveBackground(x,y) {
     assert(background,'Static original artwork must be loaded before camera moves');
     background.position.set(x,y);
   }
   function registerTexture(id,texture) {
     assert(typeof id==='string'&&id&&texture?.source,'Registered approved art needs a PixiJS texture');
     resources.set(id,texture);
   }
   function hasTexture(id) {return resources.has(id);}
   // Procedural textures are local to a scene/zoom. Remove their registrations
   // before destroying their source images so long sessions do not leak GPU
   // resource entries across regions and quality changes.
   function unregisterTexture(id) {
     if(!resources.has(id))return false;
     resources.delete(id);
     for(const [frameId,frame] of frameTextures)
       if(frameId.startsWith(id+':')){
         frame.destroy?.(false);
         frameTextures.delete(frameId);
       }
     return true;
   }
   function actorTexture(entity) {
     const texture=assert(resources.get(entity.textureId),
       'Missing Azeroth artwork: '+entity.textureId);
     if(!entity.sourceRect)return texture;
     const [x,y,w,h]=entity.sourceRect;
     assert([x,y,w,h].every(Number.isFinite)&&x>=0&&y>=0&&w>0&&h>0 &&
       x+w<=texture.source.width && y+h<=texture.source.height,
       'Animated sprite frame exceeds original atlas');
     const cacheId=entity.textureId+':'+[x,y,w,h].join(',');
     if(!frameTextures.has(cacheId)) frameTextures.set(cacheId,
       new PIXI.Texture({source:texture.source,frame:new PIXI.Rectangle(x,y,w,h)}));
     return frameTextures.get(cacheId);
   }
   // Match the Canvas entityShadow/groundMarker presentation contract.
   // These GPU graphics live in the same depth-sorted stage immediately below
   // each sprite; a 2D overlay would incorrectly draw them over actors.
   function groundGraphic(graphic,ground) {
     const {rx,ry,marker}=ground;
     const zoom=ground.scale||1;
     graphic.clear();
     if(marker) {
       const important=!!marker.important;
       const hex=marker.color;
       const color=Number.parseInt(hex.slice(1,7),16);
       const alpha=Number.parseInt(hex.slice(7,9),16)/255;
       graphic.ellipse(0,9*zoom,(important?28:21)*zoom,(important?11:8)*zoom)
         .stroke({color,alpha,width:(important?2:1)*zoom});
       if(important)
         graphic.ellipse(0,9*zoom,34*zoom,14*zoom)
           .stroke({color:0xf3e2bb,alpha:0x44/255,width:(important?2:1)*zoom});
     }
     graphic.ellipse(4*zoom,13*zoom,rx*1.18*zoom,ry*1.35*zoom)
       .fill({color:0x05100c,alpha:0x38/255});
     graphic.ellipse(1*zoom,11*zoom,rx*zoom,ry*zoom)
       .fill({color:0x020906,alpha:0x66/255});
   }
   // Each actor moves/animates as a GPU sprite. Canvas never paints a frame.
   // A one-time procedural body bake is allowed as an explicitly counted source.
   function syncActors(list) {
     assert(Array.isArray(list),'Complete ordered actor scene list required');
     const next=new Set();
     for(const item of list) {
       const id=keyOf(item);
       assert(id!=='undefined'&&!next.has(id),'Actor keys must be unique');
       assert(item.textureId && resources.has(item.textureId),
         'Missing original game actor texture: '+String(item.textureId));
       assert([item.x,item.y,item.width,item.height].every(Number.isFinite)&&
         item.width>0&&item.height>0,'Invalid actor geometry');
       if(item.ground) {
         const g=item.ground;
         assert([g.x,g.y,g.rx,g.ry,g.scale||1].every(Number.isFinite)&&
           g.rx>0&&g.ry>0&&(g.scale===undefined||g.scale>0),
           'Canvas-matched GPU contact shadow geometry required');
         if(g.marker)assert(/^#[0-9a-f]{8}$/i.test(g.marker.color),
           'Canvas marker RGBA color required');
       }
       if(item.sourceRect){
         const rect=item.sourceRect,texture=resources.get(item.textureId);
         assert(rect.length===4&&rect.every(Number.isFinite)&&
           rect[0]>=0&&rect[1]>=0&&rect[2]>0&&rect[3]>0&&
           rect[0]+rect[2]<=texture.source.width&&
           rect[1]+rect[3]<=texture.source.height,
           'Original animated atlas frame outside loaded texture');
       }
       next.add(id);
     }
     for(const [id,old] of actors) {
       if(!next.has(id)) {
         actorsStage.removeChild(old.sprite);
         if(old.ground){actorsStage.removeChild(old.ground);old.ground.destroy();}
         old.sprite.destroy();actors.delete(id);discarded++;
       }
     }
     // Sort in identical isometric depth order (x+y) before drawing.
     const ordered=[...list].sort((a,b)=>a.depth-b.depth);
     for(const item of ordered) {
       const id=keyOf(item);
       let state=actors.get(id);
       if(!state) {
         state={sprite:new PIXI.Sprite(actorTexture(item)),frameKey:''};
         actors.set(id,state);
       }
       const frameKey=item.textureId+':'+(item.sourceRect||[]).join(',');
       if(state.frameKey!==frameKey) {
         state.sprite.texture=actorTexture(item);
         state.frameKey=frameKey;
       }
       // Width/height set before mirroring so the sign is retained.
       state.sprite.width=item.width;
       state.sprite.height=item.height;
       state.sprite.scale.x=(item.flipX?-1:1)*Math.abs(state.sprite.scale.x);
       state.sprite.position.set(item.x+(item.flipX?item.width:0),item.y);
       state.sprite.alpha=clamp(item.opacity??1,0,1);
       if(item.ground) {
         if(!state.ground)state.ground=new PIXI.Graphics();
         const signature=JSON.stringify({
           rx:item.ground.rx,ry:item.ground.ry,
           scale:item.ground.scale,marker:item.ground.marker
         });
         if(state.groundSignature!==signature) {
           groundGraphic(state.ground,item.ground);
           state.groundSignature=signature;
         }
         state.ground.position.set(item.ground.x,item.ground.y);
         actorsStage.addChild(state.ground);
       }else if(state.ground){
         actorsStage.removeChild(state.ground);
         state.ground.destroy();
         state.ground=null;
         state.groundSignature=null;
       }
       actorsStage.addChild(state.sprite);
       spritesUpdated++;
     }
     return {actors:actors.size,removed:discarded};
   }
   function glowGradient(lamp,opacity,key) {
     if(!gradients.has(key)) {
       gradients.set(key,new PIXI.FillGradient({
         type:'radial',center:{x:.5,y:.5},innerRadius:0,
         outerCenter:{x:.5,y:.5},outerRadius:.5,
         colorStops:[
           {offset:0,color:rgba(lamp.rgb,opacity)},
           {offset:.35,color:rgba(lamp.rgb,opacity*.48)},
           {offset:1,color:rgba(lamp.rgb,0)}
         ]
       }));
     }
     return gradients.get(key);
   }
   function syncLamps(list) {
     assert(Array.isArray(list),'Azeroth light source array required');
     for(const lamp of list)assert(lamp &&
       [lamp.x,lamp.y,lamp.radius,lamp.alpha].every(Number.isFinite)&&
       lamp.radius>0&&lamp.alpha>=0&&lamp.alpha<=1&&
       Array.isArray(lamp.rgb)&&lamp.rgb.length===3&&
       lamp.rgb.every(c=>Number.isFinite(c)&&c>=0&&c<=255),
       'Invalid native light');
     const ids=new Set();
     for(let i=0;i<list.length;i++) {
       const lamp=list[i],opacity=lampOpacity(lamp.alpha);
       // Daylight-adjacent near-zero glows must not generate GPU gradients.
       if(opacity===0)continue;
       const id=String(i),key=lamp.rgb.join(',')+':'+opacity,
         signature=key+':'+lamp.radius;
       ids.add(id);
       let state=glowObjects.get(id);
       if(!state) {
         state={graphic:new PIXI.Graphics(),signature:null,gradientKey:null};
         state.graphic.blendMode='screen';
         glowObjects.set(id,state);
         effectsStage.addChild(state.graphic);
       }
       if(state.signature!==signature) {
         state.graphic.clear();
         state.graphic.circle(0,0,lamp.radius).fill(glowGradient(lamp,opacity,key));
         state.signature=signature;
         state.gradientKey=key;
       }
       state.graphic.position.set(lamp.x,lamp.y);
     }
     for(const [id,state] of glowObjects)if(!ids.has(id)){
       effectsStage.removeChild(state.graphic);
       state.graphic.destroy();
       glowObjects.delete(id);
     }
     // Only release superseded gradients: active Graphics retain their fill.
     if(gradients.size>MAX_CACHED_LAMP_GRADIENTS){
       const inUse=new Set([...glowObjects.values()].map(state=>state.gradientKey));
       for(const [key,fill] of gradients){
         if(gradients.size<=MAX_CACHED_LAMP_GRADIENTS)break;
         if(inUse.has(key))continue;
         fill.destroy?.();
         gradients.delete(key);
       }
     }
     // Original order: atmosphere grade, lights, motes, vignette.
     if(vignette)effectsStage.addChild(vignette);
   }
   function syncLiquidMotion(lines,zoom=1) {
     assert(Array.isArray(lines)&&lines.length<=320&&Number.isFinite(zoom)&&zoom>0,
       'Bounded authored liquid-highlight geometry required');
     liquidGraphic.clear();
     for(const line of lines) {
       assert(line&&[line.x1,line.y1,line.x2,line.y2,line.width].every(Number.isFinite)&&
         line.width>0&&/^#[0-9a-f]{8}$/i.test(line.color),
         'Invalid native water/lava highlight');
       const color=Number.parseInt(line.color.slice(1,7),16),
         alpha=Number.parseInt(line.color.slice(7,9),16)/255;
       liquidGraphic.moveTo(line.x1,line.y1).lineTo(line.x2,line.y2)
         .stroke({color,alpha,width:line.width*zoom,cap:'round'});
     }
     liquidCount=lines.length;
   }
   function setAtmosphere(spec) {
     const description=atmosphereLayers(spec);
     const signature=JSON.stringify(description);
     if(signature===atmosphereSignature)return;
     atmosphereSignature=signature;
     if(grade){effectsStage.removeChild(grade);grade.destroy({children:true});}
     for(const fill of gradeGradients)fill.destroy?.();
     gradeGradients=[];
     grade=new PIXI.Container();
     for(const layer of description){
       const shape=new PIXI.Graphics().rect(0,0,width,height);
       if(layer.style==='solid')
         shape.fill({color:hex(layer.rgb),alpha:layer.opacity});
       else {
         const fill=new PIXI.FillGradient({
           type:'linear',textureSpace:'local',start:layer.start,end:layer.end,
           colorStops:layer.colorStops
         });
         gradeGradients.push(fill);
         shape.fill(fill);
       }
       grade.addChild(shape);
     }
     effectsStage.addChildAt(grade,0);
   }
   // Screen-space pollen, fog motes and sparks share their presentation
   // recipe with the original Canvas atmosphere. One reusable GPU geometry
   // handles at most 18 deterministic circles, not an animated emitter.
   function clearAtmosphere() {
     // Arena has no environmental presentation: destroy/release retained
     // gradients, grade geometry and vignette, while keeping combat effects.
     if(grade){effectsStage.removeChild(grade);grade.destroy({children:true});grade=null;}
     for(const fill of gradeGradients)fill.destroy?.();
     gradeGradients=[];
     atmosphereSignature=null;
     if(vignette){effectsStage.removeChild(vignette);vignette.destroy();vignette=null;}
     if(vignetteGradient){vignetteGradient.destroy?.();vignetteGradient=null;}
     vignetteSignature=null;
   }
   function syncMotes(list,zoom=1) {
     assert(Array.isArray(list)&&list.length<=18&&Number.isFinite(zoom)&&zoom>0,
       'Bounded Canvas atmosphere motes and camera zoom required');
     for(const mote of list)
       assert(mote&&[mote.x,mote.y,mote.r,mote.alpha].every(Number.isFinite)&&
         mote.r>0&&mote.alpha>=0&&mote.alpha<=1&&
         Array.isArray(mote.rgb)&&mote.rgb.length===3&&
         mote.rgb.every(c=>Number.isFinite(c)&&c>=0&&c<=255),
         'Invalid original atmosphere mote');
     if(!list.length) {
       moteCount=0;
       if(moteGraphic)moteGraphic.visible=false;
       return;
     }
     if(!moteGraphic) {
       moteGraphic=new PIXI.Graphics();
       effectsStage.addChild(moteGraphic);
     }
     moteGraphic.visible=true;
     moteGraphic.clear();
     for(const mote of list)moteGraphic.circle(mote.x*zoom,mote.y*zoom,mote.r*zoom);
     moteGraphic.fill({color:hex(list[0].rgb),alpha:list[0].alpha});
     moteCount=list.length;
     // The approved Canvas order is atmosphere grade → lamps → motes → vignette.
     effectsStage.addChild(moteGraphic);
     if(vignette)effectsStage.addChild(vignette);
   }
   function setVignette(spec={}) {
     const desc=vignetteDescription(spec,width,height),
       signature=JSON.stringify(desc);
     if(signature===vignetteSignature)return;
     vignetteSignature=signature;
     if(vignette){effectsStage.removeChild(vignette);vignette.destroy();vignette=null;}
     if(vignetteGradient){vignetteGradient.destroy?.();vignetteGradient=null;}
     if(!desc)return;
     vignetteGradient=new PIXI.FillGradient(desc);
     vignette=new PIXI.Graphics().rect(0,0,width,height).fill(vignetteGradient);
     effectsStage.addChild(vignette);
   }
   // Outside measured frames: compare GPU lights independently from actors.
   async function captureLightingOnly() {
     const prior=actorsStage.visible;
     actorsStage.visible=false;
     try {
       const raw=await app.renderer.extract.pixels({
         target:app.stage,frame:new PIXI.Rectangle(0,0,width,height)
       });
       return raw?.pixels||raw;
     } finally {
       actorsStage.visible=prior;
       app.render();
     }
   }
   // Outside timed frames: capture only the retained real terrain/roads texture.
   async function captureBackgroundOnly() {
     const a=actorsStage.visible,e=effectsStage.visible,l=liquidGraphic.visible;
     actorsStage.visible=false;effectsStage.visible=false;liquidGraphic.visible=false;
     try {
       const raw=await app.renderer.extract.pixels({
         target:app.stage,frame:new PIXI.Rectangle(0,0,width,height)
       });
       return raw?.pixels||raw;
     } finally {
       actorsStage.visible=a;effectsStage.visible=e;liquidGraphic.visible=l;
       app.render();
     }
   }
   function draw() {app.render();}
   function metrics(){return{
     actors:actors.size,lights:glowObjects.size,vignetteActive:!!vignette,
     atmosphereMotes:moteCount,liquidStrokes:liquidCount,
     textureSources:resources.size,lampGradients:gradients.size,
     spriteUpdates:spritesUpdated,discarded
   };}
   function destroy(){
     for(const state of actors.values()){
       state.ground?.destroy();
       state.sprite.destroy();
     }
     for(const state of glowObjects.values())state.graphic.destroy();
     if(grade)grade.destroy();
     if(vignette)vignette.destroy();
     if(moteGraphic){moteGraphic.destroy();moteGraphic=null;}
     if(vignetteGradient)vignetteGradient.destroy?.();
     liquidGraphic.destroy();
     if(background)background.destroy();
     for(const texture of frameTextures.values())texture.destroy?.(false);
     for(const gradient of gradients.values())gradient.destroy?.();
     for(const gradient of gradeGradients)gradient.destroy?.();
     actors.clear();glowObjects.clear();gradients.clear();resources.clear();frameTextures.clear();
     app.stage.removeChild(rootStage);
     rootStage.destroy({children:false});
   }
   return Object.freeze({
     setBackground,setSolidBackground,moveBackground,registerTexture,hasTexture,unregisterTexture,
     syncActors,syncLamps,setAtmosphere,clearAtmosphere,syncMotes,syncLiquidMotion,setVignette,
     captureBackgroundOnly,captureLightingOnly,draw,metrics,destroy
   });
 }
 const api=Object.freeze({create,atmosphereLayers,vignetteDescription});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.AzerothPixiSceneBridge=api;
})(typeof window!=='undefined'?window:globalThis);
