/* PRE-INTEGRATION: PixiJS scene bridge. Actual sprite/terrain textures, actors
   and lamp positions come from the real Azeroth pilot, not manufactured geometry.
   Never loaded by the playable PWA. */
(function(root) {
 'use strict';
 const assert=(x,msg)=>{if(!x)throw Error(msg);return x;};
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const hex=rgb=>(rgb[0]<<16)|(rgb[1]<<8)|rgb[2];
 function create({PIXI,app,width,height}={}) {
   assert(PIXI?.Container && PIXI?.Sprite && PIXI?.Graphics && PIXI?.FillGradient,
     'PixiJS v8 scene primitives required');
   assert(app?.stage && app?.renderer && width>0 && height>0,
     'GPU application and viewport required');
   const rootStage=new PIXI.Container();
   const actorsStage=new PIXI.Container();
   const effectsStage=new PIXI.Container();
   app.stage.addChild(rootStage);
   rootStage.addChild(actorsStage);
   rootStage.addChild(effectsStage);
   const actors=new Map(), glowObjects=new Map(), gradients=new Map();
   let background=null,grade=null, spritesUpdated=0, resources=new Map();
   let backdropTexture=null, discarded=0;
   const keyOf=entity=>String(entity.key);
   function setBackground(texture,x,y) {
     if(!background) {
       background=new PIXI.Sprite(texture);
       rootStage.addChildAt(background,0);
     } else background.texture=texture;
     background.position.set(x,y);
     backdropTexture=texture;
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
   function actorTexture(entity) {
     const texture=assert(resources.get(entity.textureId),
       'Missing Azeroth artwork: '+entity.textureId);
     if(!entity.sourceRect)return texture;
     const [x,y,w,h]=entity.sourceRect;
     assert([x,y,w,h].every(Number.isFinite)&&x>=0&&y>=0&&w>0&&h>0 &&
       x+w<=texture.source.width && y+h<=texture.source.height,
       'Animated sprite frame exceeds original atlas');
     return new PIXI.Texture({source:texture.source,frame:new PIXI.Rectangle(x,y,w,h)});
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
       next.add(id);
     }
     for(const [id,old] of actors) {
       if(!next.has(id)) {
         actorsStage.removeChild(old.sprite);
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
       actorsStage.addChild(state.sprite);
       spritesUpdated++;
     }
     return {actors:actors.size,removed:discarded};
   }
   function glowGradient(lamp) {
     const signature=lamp.rgb.join(',')+':'+lamp.alpha;
     if(!gradients.has(signature)) {
       const [r,g,b]=lamp.rgb;
       gradients.set(signature,new PIXI.FillGradient({
         type:'radial',center:{x:.5,y:.5},innerRadius:0,
         outerCenter:{x:.5,y:.5},outerRadius:.5,
         colorStops:[
           {offset:0,color:'rgba('+r+','+g+','+b+','+clamp(lamp.alpha,0,1)+')'},
           {offset:.35,color:'rgba('+r+','+g+','+b+','+clamp(lamp.alpha*.48,0,1)+')'},
           {offset:1,color:'rgba('+r+','+g+','+b+',0)'}
         ]
       }));
     }
     return gradients.get(signature);
   }
   function syncLamps(list) {
     assert(Array.isArray(list),'Azeroth light source array required');
     const ids=new Set();
     for(let i=0;i<list.length;i++){
       const lamp=list[i];
       assert(lamp && [lamp.x,lamp.y,lamp.radius,lamp.alpha].every(Number.isFinite) &&
         lamp.radius>0 && lamp.alpha>=0 && lamp.alpha<=1 &&
         Array.isArray(lamp.rgb) && lamp.rgb.length===3,'Invalid native light');
       const id=String(i),signature=lamp.rgb.join(',')+':'+lamp.alpha+':'+lamp.radius;
       ids.add(id);
       let state=glowObjects.get(id);
       if(!state) {
         state={graphic:new PIXI.Graphics(),signature:null};
         state.graphic.blendMode='screen';
         glowObjects.set(id,state);
         effectsStage.addChild(state.graphic);
       }
       if(state.signature!==signature) {
         state.graphic.clear();
         state.graphic.circle(0,0,lamp.radius).fill(glowGradient(lamp));
         state.signature=signature;
       }
       state.graphic.position.set(lamp.x,lamp.y);
     }
     for(const [id,state] of glowObjects)if(!ids.has(id)){
       effectsStage.removeChild(state.graphic);
       state.graphic.destroy();
       glowObjects.delete(id);
     }
   }
   function setNightTint(color,opacity) {
     if(grade){effectsStage.removeChild(grade);grade.destroy();}
     grade=new PIXI.Graphics().rect(0,0,width,height).fill({
       color:hex(color),alpha:clamp(opacity,0,1)
     });
     effectsStage.addChildAt(grade,0);
   }
   function draw() {app.render();}
   function metrics(){return{
     actors:actors.size,lights:glowObjects.size,textureSources:resources.size,
     spriteUpdates:spritesUpdated,discarded
   };}
   function destroy(){
     for(const state of actors.values())state.sprite.destroy();
     for(const state of glowObjects.values())state.graphic.destroy();
     if(grade)grade.destroy();
     if(background)background.destroy();
     for(const gradient of gradients.values())gradient.destroy?.();
     actors.clear();glowObjects.clear();gradients.clear();resources.clear();
     app.stage.removeChild(rootStage);
     rootStage.destroy({children:false});
   }
   return Object.freeze({
     setBackground,moveBackground,registerTexture,hasTexture,
     syncActors,syncLamps,setNightTint,draw,metrics,destroy
   });
 }
 const api=Object.freeze({create});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.AzerothPixiSceneBridge=api;
})(typeof window!=='undefined'?window:globalThis);
