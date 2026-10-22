/* Development-only PixiJS WebGL2 scene. No playable-game changes.
   Real game campaign and original art, background prepared once, independent
   animated sprite nodes and GPU-generated lamp gradients. No full-frame copy.
   Not certified for full parity; pixel and scene omissions are reported. */
(function() {
 'use strict';
 const $=id=>document.getElementById(id);
 const ref=$('reference'),output=$('pixi-output'),results=$('results'),
   status=$('status'),button=$('run');
 const now=()=>performance.now();
 const need=(v,why)=>{if(!v)throw Error(why);return v;};
 const tick=()=>new Promise(done=>requestAnimationFrame(done));
 const iso=p=>({x:(p.x-p.y)*.76,y:(p.x+p.y)*.27});
 const stats=input=>{
   const a=[...input].sort((x,y)=>x-y),v=p=>+(a[Math.floor((a.length-1)*p)]||0).toFixed(2);
   return {medianMs:v(.5),p95Ms:v(.95),minMs:v(0),maxMs:v(1)};
 };
 let gameLoaded=false, staticRenderer=null, activeApp=null;
 async function loadScript(src){
   const el=document.createElement('script');el.src=src;
   await new Promise((good,bad)=>{
     el.onload=good;el.onerror=()=>bad(Error('Failed original module '+src));
     document.body.appendChild(el);
   });
 }
 async function loadGame(){
   if(gameLoaded)return;
   const response=await fetch('./index.html',{cache:'no-store'});
   need(response.ok,'Current game page unavailable');
   const doc=new DOMParser().parseFromString(await response.text(),'text/html');
   const paths=[...doc.querySelectorAll('script[src]')]
     .map(node=>node.getAttribute('src')).filter(Boolean);
   need(paths.some(p=>p.endsWith('/renderer.js')),'Original renderer absent');
   for(const [i,path] of paths.entries()){
     if(!path.endsWith('/app.js'))await loadScript(path);
     if(i%13===0)await tick();
   }
   need(typeof Campaign==='function'&&window.PrototypeRenderer?.create,
     'Original game did not initialize');
   // Sandboxed in-memory renderer patch: ONLY the terrain/roads ground,
   // exactly as in the prior real-world diagnostic. Shipping files unchanged.
   const response2=await fetch('./src/prototype/renderer.js',{cache:'no-store'});
   need(response2.ok,'Terrain painting source unavailable');
   let source=await response2.text();
   function patch(before,after){
     need(source.split(before).length===2,'Production renderer changed; refuse unsafe experiment');
     source=source.replace(before,after);
   }
   patch('    now = () => performance.now(),\n  }) {',
     "    now = () => performance.now(),\n    diagnosticLayer = 'full',\n  }) {");
   patch("    function render() {\n      ctx.fillStyle = '#0c1913';\n      ctx.fillRect(0, 0, canvas.width, canvas.height);",
     "    function render() {\n      if (diagnosticLayer !== 'foreground') {\n        ctx.fillStyle = '#0c1913';\n        ctx.fillRect(0, 0, canvas.width, canvas.height);\n      }");
   patch('      ctx.save();\n      if (authoredFloor)',
     "      if (diagnosticLayer !== 'foreground') {\n      ctx.save();\n      if (authoredFloor)");
   patch(
     "      PrototypeCombatVisuals.ground(ctx, screen, game, 'fill', now() / 1000);\n"+
     "      PrototypeCombatVisuals.ground(ctx, screen, game, 'underlay-cue', game.s.time);\n"+
     "      finishPhase('terrain');\n      const boardCue = null,",
     "      finishPhase('terrain');\n      if (diagnosticLayer === 'background') return;\n"+
     "      }\n"+
     "      PrototypeCombatVisuals.ground(ctx, screen, game, 'fill', now() / 1000);\n"+
     "      PrototypeCombatVisuals.ground(ctx, screen, game, 'underlay-cue', game.s.time);\n"+
     "      const boardCue = null,");
   patch('else root.PrototypeRenderer = api;',
     'else root.AzerothPixiStaticBackgroundRenderer = api;');
   const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
   try{await loadScript(url);}finally{URL.revokeObjectURL(url);}
   staticRenderer=need(window.AzerothPixiStaticBackgroundRenderer?.create,
     'Static original background renderer absent');
   gameLoaded=true;
 }
 function canvas(sizeX,sizeY){
   const c=document.createElement('canvas');c.width=sizeX;c.height=sizeY;return c;
 }
 function candidateEntities(game,screenPoint,width,height){
   const z=game.zone(),candidates=[],keyCounts=new Map();
   function add(list,kind){
     for(const entity of list||[]){
       if(kind==='enemy'&&entity.hp<=0)continue;
       const p=screenPoint(entity);
       if(p.x< -250||p.x>width+250||p.y< -250||p.y>height+250)continue;
       // Object names/structures are not necessarily unique in a zone.
       // Use a stable id where present, otherwise an authored world position.
       const identity=entity.id!=null?String(entity.id):
         String(entity.name||entity.structure||'object')+':'+entity.x+':'+entity.y;
       const baseKey=kind+':'+identity;
       const repeat=keyCounts.get(baseKey)||0;
       keyCounts.set(baseKey,repeat+1);
       candidates.push({entity,visual:{...entity,renderKind:kind,
         spriteIdentity:entity},kind,point:p,
         key:repeat?baseKey+'#'+repeat:baseKey});
     }
   }
   add(z.props,'prop');add(game.visibleNPCs(),'npc');
   add(game.visibleResourceNodes(),'node');add(z.buildings,'building');
   add(z.enemies,'enemy');add(game.activeLivingParty(),'ally');
   add([game.hero],'hero');
   return candidates.sort((a,b)=>(a.entity.x+a.entity.y)-(b.entity.x+b.entity.y));
 }
 function drawProceduralEntity(visual,game){
   // One-time original art bake PER BODY, not a copied completed game frame.
   // The GPU moves each cropped texture after this point.
   const input=canvas(576,576),ctx=input.getContext('2d');
   need(ctx,'Cannot prepare existing procedural artwork');
   const center={x:288,y:460},rescued=!!game.s.rescued[visual.family];
   PrototypeVisuals.draw(ctx,visual,center,game.regionIndex(),rescued);
   const w=input.width,h=input.height,rgba=ctx.getImageData(0,0,w,h).data;
   let left=w,top=h,right=-1,bottom=-1;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
     if(rgba[(y*w+x)*4+3]>0) {
       if(x<left)left=x;if(x>right)right=x;
       if(y<top)top=y;if(y>bottom)bottom=y;
     }
   }
   // Some original entities intentionally have no independent body: their
   // artwork belongs to the terrain pass. Report unexpected blanks separately.
   if(right<left||bottom<top)return null;
   left=Math.max(0,left-2);top=Math.max(0,top-2);
   right=Math.min(w-1,right+2);bottom=Math.min(h-1,bottom+2);
   const tight=canvas(right-left+1,bottom-top+1);
   tight.getContext('2d').drawImage(input,left,top,tight.width,tight.height,0,0,tight.width,tight.height);
   return {image:tight,dx:left-center.x,dy:top-center.y};
 }
 function pairSource(asset){
   return asset?.texture?.src||asset?.texture?.id||'unknown';
 }
 function compareByArea(reference,actual,width,height) {
   // Partition the entire visible scene to localize mismatches. This runs
   // outside recorded timings and DOES NOT relax any acceptance threshold.
   const out=[];
   for(let row=0;row<3;row++)for(let col=0;col<3;col++){
     const x0=Math.floor(col*width/3),x1=Math.floor((col+1)*width/3),
       y0=Math.floor(row*height/3),y1=Math.floor((row+1)*height/3);
     let changed=0,total=0,max=0,count=0;
     for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
       const i=4*(y*width+x);let d=0;count++;
       for(let c=0;c<3;c++){
         const n=Math.abs(reference[i+c]-actual[i+c]);
         total+=n;d=Math.max(d,n);max=Math.max(max,n);
       }
       if(d>6)changed++;
     }
     out.push({
       zone:['top','middle','bottom'][row]+'-'+['left','center','right'][col],
       percentPixelsWithin6:+(100*(1-changed/count)).toFixed(3),
       meanRgbDifference:+(total/(count*3)).toFixed(3),
       maxChannelDifference:max
     });
   }
   return out;
 }
 function reportDiff(reference,actual){
   const n=Math.min(reference.length,actual.length);
   let change=0,total=0,worst=0;
   for(let i=0;i<n;i+=4){
     let top=0;for(let c=0;c<3;c++){
       const v=Math.abs(reference[i+c]-actual[i+c]);
       total+=v;worst=Math.max(worst,v);top=Math.max(top,v);
     }
     if(top>6)change++;
   }
   return {pixelsCompared:n/4,percentPixelsWithin6:+(100*(1-change/(n/4))).toFixed(3),
     meanRgbDifference:+(total/(n/4*3)).toFixed(3),maxChannelDifference:worst};
 }
 async function run(){
   button.disabled=true;results.textContent='Loading actual Azeroth gameplay art…';
   try{
     need(window.PIXI?.Application,'PixiJS library did not load — browser network/CDN unavailable');
     need(window.AzerothPixiSceneBridge?.create &&
       window.AzerothNativeWebGLCore?.spriteLayout &&
       window.AzerothGpuSpriteAdapter?.create,
       'Isolated scene bridge or original sprite adapter missing');
     await loadGame();
     const PIXI=window.PIXI,[width,height]=$('size').value.split('x').map(Number),
       zoom=Number($('zoom').value),region=$('region').value,
       night=$('lighting').value==='night';
     need([960,1600,2403].includes(width)&&[540,900,1248].includes(height)&&
       [1,1.5,1.75].includes(zoom),'Invalid benchmark dimensions');
     ref.width=width;ref.height=height;
     const ctx=need(ref.getContext('2d'),'Original Canvas unavailable');
     if(activeApp){activeApp.destroy(true);activeApp=null;output.replaceChildren();}
     const app=new PIXI.Application();
     await app.init({width,height,autoStart:false,preference:['webgl'],
       preferWebGLVersion:2,resolution:1,antialias:false,background:0x0c1913});
     // The test must refuse fallback to WebGPU, WebGL1, or Canvas.
     need(app.canvas.getContext('webgl2'),
       'PixiJS could not initialize WebGL2 on this browser');
     activeApp=app;output.appendChild(app.canvas);
     const game=new Campaign('normal','paladin',()=>0.7);
     game.s.zone=region;game.zone();game.zone();
     const baseTime=night?Campaign.rules.dayCycle.nightAt+60:60;
     game.s.clock=baseTime;game.s.time=baseTime;
     Object.assign(game.hero,game.safe(650,730));
     const starting={x:game.hero.x,y:game.hero.y},initialIso=iso(starting);
     const anchor=(w,h)=>({x:Math.max(w*.35,(w-(w<=1000?204:214)-20)/2),
       y:(h-94)/2});
     const platform={cameraZoom:zoom,cameraAnchor:anchor};
     const margin=160,backdrop=canvas(width+2*margin,height+2*margin),
       groundCtx=need(backdrop.getContext('2d'),'Background Canvas unavailable');
     const backgroundPlatform={cameraZoom:zoom,cameraAnchor(){
       const a=anchor(width,height);return {x:a.x+margin,y:a.y+margin};
     }};
     const opts={getGame:()=>game,chargePresentation:()=>null,
       queuedChargePresentation:()=>[],isPaused:()=>false,
       Campaign,PrototypeVisuals,PrototypeCombatVisuals,
       PrototypeEnemyVfxArt,PrototypeSprites,PrototypeMaterials,now:()=>16000};
     const reference=PrototypeRenderer.create({
       ...opts,canvas:{width,height},ctx,platform
     });
     const floorPainter=staticRenderer({
       ...opts,canvas:{width:backdrop.width,height:backdrop.height},
       ctx:groundCtx,platform:backgroundPlatform,diagnosticLayer:'background'
     });
     reference.setOptimizationMode(false);
     floorPainter.setOptimizationMode(false);
     status.textContent='Preparing only the real terrain/roads once…';
     const manifestResponse=await fetch('./assets/sprites/manifest.json');
     need(manifestResponse.ok,'Original sprite manifest missing');
     const manifest=await manifestResponse.json(),keys=Object.keys(manifest.sprites);
     await PrototypeSprites.preload(undefined,keys);
     await PrototypeSprites.warm(keys,{variants:true,clips:true});
     await PrototypeMaterials.load();
     await Promise.all(Object.keys(PrototypeMaterials.entries||{})
       .map(key=>PrototypeMaterials.ensure(key)));
     const prepStarted=now();
     floorPainter.draw();
     groundCtx.getImageData(0,0,1,1);
     const artPrepMs=now()-prepStarted;
     const scene=window.AzerothPixiSceneBridge.create({PIXI,app,width,height});
     const backdropTexture=PIXI.Texture.from(backdrop);
     backdropTexture.source.scaleMode='nearest';
     scene.setBackground(backdropTexture,-margin,-margin);
     const adapter=window.AzerothGpuSpriteAdapter.create({
       sprites:PrototypeSprites,gpuCore:window.AzerothNativeWebGLCore,
       clock:()=>PrototypeSprites.timeMs(),
       isReducedMotion:()=>matchMedia('(prefers-reduced-motion: reduce)').matches
     });
     const textureLoads=new Map(),proceduralBakes=new Map();
     let measuredResourcesLocked=false,proceduralTextureBytes=0;
     const counters={proceduralBakes:0,authoredTextures:0,missingProcedural:0,
       unsupportedDynamicOverlays:0,intentionallyBodyless:0,
       unexpectedEmptyArtwork:0};
     const skippedArtwork=new Map();
     async function ensureTexture(src){
       if(measuredResourcesLocked&&!textureLoads.has(src))
         throw Error('New sprite artwork entered measured frames without preloading: '+src);
       if(!textureLoads.has(src)){
         textureLoads.set(src,(async()=>{
           const t=await PIXI.Assets.load(src);
           need(t?.source,'Could not decode approved original game asset: '+src);
           t.source.scaleMode='nearest';scene.registerTexture(src,t);
           counters.authoredTextures++;
           return t;
         })());
       }
       return textureLoads.get(src);
     }
     function pointOf(entity){
       const p=iso(entity),center=iso(game.hero),a=anchor(width,height);
       return {x:a.x+(p.x-center.x)*zoom,
         y:a.y+(p.y-center.y)*zoom};
     }
     // No animated procedural body is baked every GPU frame; all are once-only.
     async function buildFrame(){
       const visible=candidateEntities(game,pointOf,width,height);
       const records=[];
       for(const {entity,visual,key,point} of visible){
         if(entity.interactionOnly ||
           (entity.kind==='landmark' && String(entity.id||'').startsWith('bridge-'))){
           counters.intentionallyBodyless++;
           if(!skippedArtwork.has(key))skippedArtwork.set(key,{
             id:key,reason:entity.interactionOnly?'interaction-only (no world body)':
               'bridge artwork already in terrain',expected:true
           });
           continue;
         }
         const selected=adapter.commandFor(visual,{x:point.x/zoom,y:point.y/zoom},
           {region:game.regionIndex(),rescued:!!game.s.rescued[entity.family]});
         if(selected.supported){
           if(!scene.hasTexture(selected.texture.src))
             await ensureTexture(selected.texture.src);
           const c=selected.command;
           records.push({key,textureId:selected.texture.src,
             sourceRect:c.sourceRect,
             x:c.x*zoom,y:c.y*zoom,width:c.width*zoom,height:c.height*zoom,
             opacity:c.opacity,flipX:c.flipX,depth:entity.x+entity.y});
           counters.unsupportedDynamicOverlays++;
         }else if(selected.reason==='original-game-procedural-art'){
           if(!proceduralBakes.has(key)){
             if(measuredResourcesLocked)
               throw Error('New procedural actor entered measured frames without preparation: '+key);
             const baked=drawProceduralEntity(visual,game);
             if(!baked){
               counters.unexpectedEmptyArtwork++;
               skippedArtwork.set(key,{
                 id:key,kind:entity.renderKind,visualKind:entity.kind||null,
                 presentation:entity.presentation||null,
                 reason:'original drawing routine painted zero body pixels',expected:false
               });
               proceduralBakes.set(key,null);
               continue;
             }
             const id='prepared-procedural:'+key;
             const bytes=baked.image.width*baked.image.height*4;
             need(proceduralTextureBytes+bytes<=64*1024*1024,
               'Procedural artwork GPU texture preparation exceeded 64 MiB budget');
             proceduralTextureBytes+=bytes;
             const texture=PIXI.Texture.from(baked.image);
             texture.source.scaleMode='nearest';
             scene.registerTexture(id,texture);
             proceduralBakes.set(key,{...baked,id});
             counters.proceduralBakes++;
           }
           const b=proceduralBakes.get(key);
           if(!b)continue;
           records.push({key,textureId:b.id,
             x:point.x+b.dx*zoom,y:point.y+b.dy*zoom,
             width:b.image.width*zoom,height:b.image.height*zoom,
             opacity:1,flipX:false,depth:entity.x+entity.y});
         }else{
           counters.missingProcedural++;
           throw Error('An approved original asset is unavailable: '+key);
         }
       }
       scene.syncActors(records);
       const z=game.zone(),i=game.regionIndex();
       const darkness=game.daylightPhase?.()?.darkness??(game.night()?1:0);
       const sourceLights=[];
       if(darkness>0){
         for(const p of z.props){
           const kind=PrototypeRenderer.nightLightKind(String(p.structure||''));
           if(kind)sourceLights.push({...pointOf(p),kind,
             fixture:p.structure==='roadside-lantern'?'post':undefined,id:p.id});
         }
         for(const b of z.buildings)
           if(b.progress>=4)sourceLights.push({...pointOf(b),kind:'window',id:b.id});
         for(const n of game.visibleNPCs())
           if(['rest','supplier','recruiter','quests','fountain','transport',
               'smith','teacher','alchemist'].includes(n.kind)&&!n.interactionOnly)
             sourceLights.push({...pointOf(n),kind:'lantern',id:n.id});
       }
       sourceLights.sort((a,b)=>{
         const ax=a.x-width/2,ay=a.y-height/2,
           bx=b.x-width/2,by=b.y-height/2;
         return (ax*ax+ay*ay)-(bx*bx+by*by);
       });
       const lamps=window.AzerothNativeWebGLCore.lampGlowCommands(sourceLights.slice(0,36),
         i,{darkness,hero:pointOf(game.hero)});
       scene.syncLamps(lamps);
       const lightState=game.daylightPhase?.() || {};
       scene.setAtmosphere({
         region:i,darkness,
         peaceBlend:game.peace ? (lightState.phase==='victory-sunrise'?
           lightState.progress:1) : 0,
         optimized:false,
         warmth:lightState.warmth||0,phase:lightState.phase||'day'
       });
       return {visible:records.length,nightLights:lamps.length};
     }
     status.textContent='Preparing approved procedural body textures and actor animations…';
     // Warm the original atlases first so each measured frame only moves
     // PixiJS scene nodes instead of waiting for network decode.
     const primed=candidateEntities(game,pointOf,width,height);
     const urls=new Set();
     for(const {visual,entity} of primed){
       const found=PrototypeSprites.definitionFor(visual,game.regionIndex(),
         !!game.s.rescued[entity.family]);
       if(!found)continue;
       if(found.entry.src)urls.add(found.entry.src);
       for(const clip of Object.values(found.entry.clips||{}))
         for(const f of clip.frames||[])if(f.src)urls.add(f.src);
       for(const variant of found.entry.variants||[])if(variant.src)urls.add(variant.src);
     }
     await Promise.all([...urls].map(ensureTexture));
     // Prepare objects across the WHOLE upcoming scripted camera path.
     // This prevents a surprise Canvas bake during measured GPU frames.
     for(let warm=0;warm<14;warm++){
       const pos=game.safe(starting.x+Math.sin(warm*.35)*32,
         starting.y+(Math.cos(warm*.29)-1)*24);
       Object.assign(game.hero,pos);
       await buildFrame();
     }
     Object.assign(game.hero,starting);
     await buildFrame();scene.draw();
     measuredResourcesLocked=true;
     const prepMs=now()-prepStarted;
     const canvasTimes=[],gpuTimes=[],pixels=[],rounds=14,warmup=3;
     let lastCounts={visible:0,nightLights:0};
     for(let step=-warmup;step<rounds;step++){
       const frame=Math.max(0,step);
       const pos=game.safe(starting.x+Math.sin(frame*.35)*32,
         starting.y+(Math.cos(frame*.29)-1)*24);
       Object.assign(game.hero,pos);
       game.s.clock=baseTime+frame*.03;game.s.time=game.s.clock;
       PrototypeSprites.advance(16,false);
       const camera=iso(pos);
       const cropX=margin+(camera.x-initialIso.x)*zoom,
         cropY=margin+(camera.y-initialIso.y)*zoom;
       need(cropX>=0&&cropY>=0&&
         cropX+width<backdrop.width&&cropY+height<backdrop.height,
         'Camera left the initially prepared terrain area');
       const first=now();reference.draw();ctx.getImageData(0,0,1,1);
       const canvasMs=now()-first;
       const second=now();
       scene.moveBackground(-cropX,-cropY);
       lastCounts=await buildFrame();
       scene.draw();
       const gpuMs=now()-second;
       if(step>=0){canvasTimes.push(canvasMs);gpuTimes.push(gpuMs);}
       if(step===0||step===rounds-1){
         const source=ctx.getImageData(0,0,width,height).data;
         try {
           const image=await app.renderer.extract.pixels({
             target:app.stage,frame:new PIXI.Rectangle(0,0,width,height)
           });
           const actual=image?.pixels||image;
           if(actual?.length===source.length)
             pixels.push({frame,parity:reportDiff(source,actual),
               regions:compareByArea(source,actual,width,height)});
           else pixels.push({frame,error:'Pixi extraction returned unexpected dimensions'});
         }catch(error){pixels.push({frame,error:String(error.message)});}
       }
       if(step%4===0) {
         status.textContent='Original artwork with GPU actors, frame '+(frame+1)+'/'+rounds;
         await tick();
       }
     }
     const report={
       verdict:'EXPERIMENTAL PIXIJS PATH ONLY — not production-parity, no winner',
       approach:'Real production terrain/roads baked once; every actor is a separate movable GPU sprite, including individually prepared procedural bodies. Atlas animation frames and radial lamps drawn using PixiJS WebGL2.',
       renderer:'WebGL2 / '+(app.renderer.name||String(app.renderer.constructor?.name)),
       region,lighting:night?'night':'day',viewport:[width,height],zoom,
       preparationMs:{onceOnlyOriginalTerrainAndRoads:+artPrepMs.toFixed(2),
         totalGPUScenePreparation:+prepMs.toFixed(2)},
       measuredFrames:rounds,
       perFrameMs:{fullLiveOriginalCanvas:stats(canvasTimes),
         pixiGpuSceneWithIndependentMovingActors:stats(gpuTimes)},
       actorsAndLights:lastCounts,counters,
       proceduralTextureBytes,pixelParity:pixels,
       skippedArtDetails:[...skippedArtwork.values()].slice(0,60),
       caution:counters.unexpectedEmptyArtwork?
         'Some original entities painted no standalone sprite. See skippedArtDetails; image parity remains a release blocker.':
         'Known bodyless landmarks are already drawn in original terrain.',
       dependency:'PixiJS 8.22.0 pinned external development CDN (requires connectivity)',
       diagnostics:'Nine screen regions locate source mismatches; GPU atmosphere now uses original top-to-bottom region grade and daytime/sunset tint instead of one flat color.',
       incompleteFeatures:[
         'Procedural actor bodies currently use one-time original art textures, not live art state',
         'Full original day/night screen-blend grading and lamp fixtures are not yet parity verified',
         'Actor occlusion outlines and all transient combat VFX are not ported',
         'Full depth/labels/room architecture parity is not yet validated'
       ],
       workEquivalent:false,
       limitation:'This is real GPU scene-graph animation, not a frozen full-world screenshot. It is also not a finished native full game renderer or acceptable game settings option.'
     };
     results.textContent=JSON.stringify(report,null,2);
     status.textContent='PixiJS real-world scene comparison completed. Still not production certified.';
   }catch(error){
     results.textContent=String(error.stack||error);
     status.textContent='PixiJS isolated experiment blocked: '+error.message;
   }finally{button.disabled=false;}
 }
 button.addEventListener('click',()=>{void run();});
})();
