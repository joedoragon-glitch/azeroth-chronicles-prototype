/* Experimental PixiJS presentation for the LIVE Campaign.
 * The normal Canvas renderer owns input projection and critical 2D cue overlays.
 * Do not label this a complete or faster WebGL implementation before review.
 */
(function(root) {
  'use strict';

  const PIXI_SCRIPT = './assets/vendor/pixi-8.22.0.min.js';
  const BG_MARGIN = 220;
  const iso = (point) => ({
    x: (point.x - point.y) * 0.76,
    y: (point.x + point.y) * 0.27,
  });
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  function requireValue(value, message) {
    if (!value) throw Error(message);
    return value;
  }
  function makeCanvas(width, height) {
    const element = document.createElement('canvas');
    element.width = width;
    element.height = height;
    return element;
  }
  let libraryRequest;
  function loadPixi() {
    if (root.PIXI?.Application) return Promise.resolve(root.PIXI);
    if (!libraryRequest) {
      libraryRequest = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = PIXI_SCRIPT;
        script.async = true;
        script.onload = () => root.PIXI?.Application
          ? resolve(root.PIXI)
          : reject(Error('PixiJS did not initialize'));
        script.onerror = () => reject(Error('Local PixiJS runtime unavailable; Canvas remains active'));
        document.head.append(script);
      }).catch((error) => {
        libraryRequest = null;
        throw error;
      });
    }
    return libraryRequest;
  }
  function candidates(game, project, width, height) {
    const zone = game.zone();
    const result = [], used = new Map();
    function add(entities, kind) {
      for (const entity of entities || []) {
        if (kind === 'enemy' && entity.hp <= 0) continue;
        const point = project(entity);
        if (point.x < -270 || point.x > width + 270 ||
            point.y < -270 || point.y > height + 270) continue;
        const identity = entity.id == null
          ? String(entity.name || entity.structure || 'object') + ':' + entity.x + ':' + entity.y
          : String(entity.id);
        const stem = kind + ':' + identity;
        const count = used.get(stem) || 0;
        used.set(stem, count + 1);
        const visual = { ...entity, renderKind: kind, spriteIdentity: entity };
        if (kind === 'hero' && game.s.throneClaimed) visual.crowned = true;
        result.push({ entity, visual, kind, point, key: count ? stem + '#' + count : stem });
      }
    }
    add(zone.props, 'prop');
    add(game.visibleNPCs(), 'npc');
    add(game.visibleResourceNodes(), 'node');
    add(zone.buildings, 'building');
    add(zone.enemies, 'enemy');
    add(game.activeLivingParty(), 'ally');
    add([game.hero], 'hero');
    return result.sort((a,b) => (a.entity.x+a.entity.y)-(b.entity.x+b.entity.y));
  }
  function bake(visual, game) {
    const work = makeCanvas(576,576), c = work.getContext('2d');
    requireValue(c, 'Original procedural artist is unavailable');
    const center = {x:288,y:460};
    root.PrototypeVisuals.draw(c,visual,center,game.regionIndex(),!!game.s.rescued[visual.family]);
    const {data} = c.getImageData(0,0,work.width,work.height);
    let left=576,top=576,right=-1,bottom=-1;
    for(let y=0;y<576;y++)for(let x=0;x<576;x++){
      if(data[(y*576+x)*4+3]>0){
        left=Math.min(left,x);right=Math.max(right,x);
        top=Math.min(top,y);bottom=Math.max(bottom,y);
      }
    }
    if(right<left || bottom<top) return null;
    left=Math.max(0,left-2);top=Math.max(0,top-2);
    right=Math.min(575,right+2);bottom=Math.min(575,bottom+2);
    const image=makeCanvas(right-left+1,bottom-top+1);
    image.getContext('2d').drawImage(work,left,top,image.width,image.height,0,0,image.width,image.height);
    return { image, dx:left-center.x,dy:top-center.y };
  }
  function create(options) {
    const { worldCanvas, viewport, platform, getGame, canvasRenderer,
      getRendererOptions } = options;
    let app=null, scene=null, adapter=null, backgroundRenderer=null,
      backdrop=null, backing=null, basePosition=null, baseZone=null,
      baseZoom=null, active=false, lastError=null;
    const baked = new Map(), ownedTextures=[], loaded=new Set();
    let imageBytes=0, disposed=false, baseGame=null;
    function project(entity) { return canvasRenderer.screen(entity); }
    function game() { return getGame(); }
    function clearBakes() {
      for(const texture of ownedTextures) texture.destroy?.(true);
      ownedTextures.length=0;
      baked.clear();
      imageBytes=0;
      loaded.clear();
    }
    function drawBackground() {
      const current=game(), zoom=platform.cameraZoom || 1;
      if (!backgroundRenderer || !backdrop || !scene) throw Error('Missing original terrain painter');
      baseGame=current;
      basePosition={x:current.hero.x,y:current.hero.y};
      baseZone=current.zoneId; baseZoom=zoom;
      backgroundRenderer.setOptimizationMode(!!options.getOptimizationMode());
      backgroundRenderer.draw();
      if (backing) {
        backing.source.update?.();
        scene.setBackground(backing,-BG_MARGIN,-BG_MARGIN);
      } else {
        backing=root.PIXI.Texture.from(backdrop);
        backing.source.scaleMode='nearest';
        scene.setBackground(backing,-BG_MARGIN,-BG_MARGIN);
      }
    }
    function syncBackground() {
      const current=game(), zoom=platform.cameraZoom || 1;
      if (baseGame && baseGame!==current)
        throw Error('Campaign changed; reset to Canvas before switching again');
      if (!basePosition || baseZone!==current.zoneId || baseZoom!==zoom)
        drawBackground();
      const d=iso({x:current.hero.x-basePosition.x,y:current.hero.y-basePosition.y});
      let dx=-d.x*zoom,dy=-d.y*zoom;
      if (Math.abs(dx)>BG_MARGIN*0.6 || Math.abs(dy)>BG_MARGIN*0.6) {
        drawBackground(); dx=0;dy=0;
      }
      scene.moveBackground(-BG_MARGIN+dx,-BG_MARGIN+dy);
    }
    function actorFrame() {
      const current=game(), zoom=platform.cameraZoom || 1;
      const records=[];
      for(const {entity,visual,point,key} of candidates(current,project,viewport.width,viewport.height)) {
        if (entity.interactionOnly ||
            (entity.kind==='landmark' && String(entity.id||'').startsWith('bridge-')))
          continue;
        const chosen=adapter.commandFor(visual,
          {x:point.x/zoom,y:point.y/zoom},
          {region:current.regionIndex(),rescued:!!current.s.rescued[entity.family]});
        if(chosen.supported){
          if(!scene.hasTexture(chosen.texture.src))
            throw Error('New sprite needs Pixi preload: '+chosen.texture.src);
          const c=chosen.command;
          records.push({key,textureId:chosen.texture.src,sourceRect:c.sourceRect,
            x:c.x*zoom,y:c.y*zoom,width:c.width*zoom,height:c.height*zoom,
            opacity:c.opacity,flipX:c.flipX,depth:entity.x+entity.y});
        } else if(chosen.reason==='original-game-procedural-art'){
          const revision=key+':'+current.zoneId+':'+!!current.s.rescued[entity.family]+
            ':'+(entity.form||'')+':'+(entity.presentation||'')+':'+!!visual.crowned;
          if(!baked.has(revision)){
            const body=bake(visual,current);
            if(!body) {
              if(entity.renderKind==='landmark' || entity.kind==='landmark') continue;
              throw Error('Unrendered procedural entity: '+key);
            }
            const bytes=body.image.width*body.image.height*4;
            if(imageBytes+bytes>64*1024*1024) throw Error('Procedural GPU memory limit reached');
            imageBytes+=bytes;
            const id='pixi-procedural:'+revision;
            const texture=root.PIXI.Texture.from(body.image);
            texture.source.scaleMode='nearest';
            scene.registerTexture(id,texture);
            ownedTextures.push(texture);
            baked.set(revision,{...body,id});
          }
          const b=baked.get(revision);
          records.push({key,textureId:b.id,
            x:point.x+b.dx*zoom,y:point.y+b.dy*zoom,
            width:b.image.width*zoom,height:b.image.height*zoom,
            opacity:1,flipX:false,depth:entity.x+entity.y});
        } else throw Error('Missing original game artwork: '+key);
      }
      scene.syncActors(records);
    }
    function syncAtmosphere() {
      const current=game(), region=current.regionIndex(), z=current.zone();
      const zoom=platform.cameraZoom || 1;
      const phase=current.daylightPhase?.()||{};
      const darkness=current.isDungeon() || current.supplyRoom()
        ? (current.night()?1:0) : phase.darkness ?? (current.night()?1:0);
      const lights=[];
      if(darkness>0){
        for(const p of z.props) {
          const kind=root.PrototypeRenderer.nightLightKind(String(p.structure||''));
          if(kind)lights.push({...project(p),kind,id:p.id});
        }
        for(const b of z.buildings)
          if(b.progress>=4)lights.push({...project(b),kind:'window',id:b.id});
        for(const n of current.visibleNPCs())
          if(['rest','supplier','recruiter','quests','fountain','transport',
            'smith','teacher','alchemist'].includes(n.kind)&&!n.interactionOnly)
            lights.push({...project(n),kind:'lantern',id:n.id});
      }
      const local=lights.filter(p=>p.x> -140*zoom && p.x<viewport.width+140*zoom &&
        p.y> -160*zoom && p.y<viewport.height+140*zoom)
        .sort((a,b)=>((a.x-viewport.width/2)**2+(a.y-viewport.height/2)**2)-
          ((b.x-viewport.width/2)**2+(b.y-viewport.height/2)**2)).slice(0,36)
        .map(p=>({...p,x:p.x/zoom,y:p.y/zoom}));
      const hero=project(current.hero);
      const lamps=root.AzerothNativeWebGLCore.lampGlowCommands(local,region,{
        darkness,hero:{x:hero.x/zoom,y:hero.y/zoom}
      }).map(p=>({...p,x:p.x*zoom,y:p.y*zoom,radius:p.radius*zoom}));
      scene.syncLamps(lamps);
      scene.setAtmosphere({region,darkness,
        peaceBlend:current.peace?phase.phase==='victory-sunrise'?(phase.progress||0):1:0,
        optimized:!!options.getOptimizationMode(),
        warmth:phase.warmth||0,phase:phase.phase||'day'});
      scene.setVignette({darkness,optimized:!!options.getOptimizationMode()});
    }
    async function prepare() {
      if(disposed)throw Error('Experimental renderer disposed');
      // A second opt-in trial must release the previous GPU context and scene.
      if(app)disposeResources();
      try {
        const PIXI=await loadPixi();
        requireValue(root.AzerothPixiSceneBridge && root.AzerothGpuSpriteAdapter &&
          root.AzerothNativeWebGLCore,'PixiJS scene modules not loaded');
        app=new PIXI.Application();
        await app.init({width:viewport.width,height:viewport.height,
          preference:['webgl'],preferWebGLVersion:2,resolution:1,
          autoStart:false,antialias:false,background:0x0c1913});
        requireValue(app.canvas.getContext('webgl2'),'WebGL2 context not available');
        app.canvas.id='world-pixi-experimental';
        app.canvas.setAttribute('aria-hidden','true');
        app.canvas.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;display:none';
        worldCanvas.parentNode.insertBefore(app.canvas,worldCanvas);
        app.canvas.addEventListener('webglcontextlost',(event)=>{
          event.preventDefault();active=false;options.onFailure('WebGL context lost');
        });
        scene=root.AzerothPixiSceneBridge.create({
          PIXI,app,width:viewport.width,height:viewport.height});
        adapter=root.AzerothGpuSpriteAdapter.create({
          sprites:root.PrototypeSprites,gpuCore:root.AzerothNativeWebGLCore,
          clock:()=>root.PrototypeSprites.timeMs(),
          isReducedMotion:()=>root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false
        });
        backdrop=makeCanvas(viewport.width+BG_MARGIN*2,viewport.height+BG_MARGIN*2);
        const bgContext=requireValue(backdrop.getContext('2d'),'Background canvas unsupported');
        const bgViewport={width:backdrop.width,height:backdrop.height};
        const bgPlatform={
          get cameraZoom(){return platform.cameraZoom},
          cameraAnchor(){
            const a=platform.cameraAnchor(viewport.width,viewport.height);
            return {x:a.x+BG_MARGIN,y:a.y+BG_MARGIN};
          }
        };
        backgroundRenderer=root.PrototypeRenderer.create({
          ...getRendererOptions(),canvas:bgViewport,ctx:bgContext,
          platform:bgPlatform,renderLayer:'background',
        });
        // Warm all canonical sprites once (~46 MiB decoded across 38 files).
        // Otherwise entering any previously unseen neighborhood forces fallback.
        const response=await fetch('./assets/sprites/manifest.json');
        requireValue(response.ok,'Original sprite manifest unavailable');
        const manifest=await response.json(),urls=new Set();
        function collect(value){
          if(!value||typeof value!=='object')return;
          if(typeof value.src==='string' &&
              value.src.startsWith('./assets/sprites/') &&
              /\.(?:png|webp)$/i.test(value.src))
            urls.add(value.src);
          for(const child of Object.values(value))
            if(typeof child==='object')
              Array.isArray(child)?child.forEach(collect):collect(child);
        }
        collect(manifest.sprites);
        requireValue(urls.size>0,'Approved sprite manifest is empty');
        requireValue(urls.size<=128,'Unexpected sprite resource count');
        await Promise.all([...urls].map(async src=>{
          const texture=await PIXI.Assets.load(src);
          requireValue(texture?.source,'Approved sprite decode failed: '+src);
          texture.source.scaleMode='nearest';
          scene.registerTexture(src,texture);loaded.add(src);
        }));
        drawBackground();
        actorFrame();syncAtmosphere();scene.draw();
        return true;
      }catch(error){
        lastError=String(error?.message||error);
        disposeResources();
        return false;
      }
    }
    function draw() {
      if(!active||!scene)throw Error('Inactive PixiJS renderer');
      try{
        if(app.screen.width!==viewport.width||app.screen.height!==viewport.height)
          throw Error('Viewport changed: return to Canvas');
        syncBackground();actorFrame();syncAtmosphere();scene.draw();
      }catch(error){
        lastError=String(error?.message||error);
        options.onFailure(lastError);
        throw error;
      }
    }
    function activate(){
      requireValue(app?.canvas&&scene,'PixiJS scene not prepared');
      app.canvas.style.display='block';active=true;
    }
    function deactivate(){active=false;if(app?.canvas)app.canvas.style.display='none';}
    function disposeResources() {
      deactivate();scene?.destroy?.();scene=null;
      clearBakes();
      backing?.destroy?.(false);backing=null;
      if(app){const node=app.canvas;app.destroy(true);node?.remove();app=null;}
      backgroundRenderer=null;backdrop=null;basePosition=null;baseGame=null;
    }
    function dispose(){disposed=true;disposeResources();}
    function noteEvents(events){adapter?.noteEvents?.(events);}
    return Object.freeze({prepare,draw,activate,deactivate,release:disposeResources,dispose,noteEvents,
      status:()=>({active,lastError,loadedTextures:loaded.size,proceduralBytes:imageBytes})});
  }
  const api=Object.freeze({create});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.PrototypePixiExperimental=api;
})(typeof window!=='undefined'?window:globalThis);
