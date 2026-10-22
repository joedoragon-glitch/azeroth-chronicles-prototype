/* Standalone hybrid experiment. All original gameplay, light and art files remain untouched. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const status = $('status'), output = $('results'), runButton = $('run');
  const original = $('reference'), gpuWorld = $('gpuWorld'), gpuCopy = $('gpuCopy');
  const now = () => performance.now();
  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
  const need = (condition, message) => { if (!condition) throw Error(message); return condition; };
  const summary = (input) => {
    const numbers = [...input].sort((a, b) => a - b);
    const sample = (p) => numbers[Math.floor((numbers.length - 1) * p)];
    return {
      medianMs: +sample(0.5).toFixed(2), p95Ms: +sample(0.95).toFixed(2),
      minMs: +numbers[0].toFixed(2), maxMs: +numbers.at(-1).toFixed(2)
    };
  };
  const iso = (p) => ({ x: (p.x - p.y) * 0.76, y: (p.x + p.y) * 0.27 });
  let loaded = false, hybridRendererClass = null;

  async function loadScript(src) {
    const el = document.createElement('script');
    el.src = src;
    await new Promise((ok, fail) => {
      el.onload = ok;
      el.onerror = () => fail(Error('Cannot load ' + src));
      document.body.appendChild(el);
    });
  }

  async function loadGame() {
    if (loaded) return;
    status.textContent = 'Loading game artwork and original renderer…';
    const res = await fetch('./index.html', { cache: 'no-store' });
    need(res.ok, 'Cannot retrieve current game entry.');
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const scripts = [...doc.querySelectorAll('script[src]')].map((el) => el.getAttribute('src'));
    need(scripts.some((x) => x.endsWith('/renderer.js')), 'Original renderer absent');
    for (const [index, path] of scripts.entries()) {
      if (path.endsWith('/app.js')) continue;
      await loadScript(path);
      if (index % 13 === 0) await nextFrame();
    }
    need(window.PrototypeRenderer?.create && typeof Campaign === 'function',
      'Original campaign renderer failed to load');
    // Create a diagnostic-only variant of the current source in memory.
    // This file is NEVER written back into the game and cannot affect the
    // normal PrototypeRenderer global.
    const response = await fetch('./src/prototype/renderer.js', { cache: 'no-store' });
    need(response.ok, 'Original renderer source unavailable');
    let source = await response.text();
    const replaceOnce = (before, after) => {
      need(source.split(before).length === 2, 'Renderer changed; safe diagnostic patch unavailable');
      source = source.replace(before, after);
    };
    replaceOnce('    now = () => performance.now(),\n  }) {',
      "    now = () => performance.now(),\n    diagnosticLayer = 'full',\n  }) {");
    replaceOnce("    function render() {\n      ctx.fillStyle = '#0c1913';\n      ctx.fillRect(0, 0, canvas.width, canvas.height);",
      "    function render() {\n      if (diagnosticLayer !== 'foreground') {\n        ctx.fillStyle = '#0c1913';\n        ctx.fillRect(0, 0, canvas.width, canvas.height);\n      }");
    // Create real world-layer split in memory only; the shipped renderer is
    // untouched. Static textures cover floor, terrain, bridges and roads.
    // Combat ground cues and all active scenery/effects stay dynamic.
    replaceOnce('      ctx.save();\n      if (authoredFloor)',
      "      if (diagnosticLayer !== 'foreground') {\n      ctx.save();\n      if (authoredFloor)");
    replaceOnce(
      "      PrototypeCombatVisuals.ground(ctx, screen, game, 'fill', now() / 1000);\n" +
      "      PrototypeCombatVisuals.ground(ctx, screen, game, 'underlay-cue', game.s.time);\n" +
      "      finishPhase('terrain');\n      const boardCue = null,",
      "      finishPhase('terrain');\n      if (diagnosticLayer === 'background') return;\n" +
      "      }\n" +
      "      PrototypeCombatVisuals.ground(ctx, screen, game, 'fill', now() / 1000);\n" +
      "      PrototypeCombatVisuals.ground(ctx, screen, game, 'underlay-cue', game.s.time);\n" +
      "      const boardCue = null,");
    replaceOnce('else root.PrototypeRenderer = api;', 'else root.PrototypeHybridTestRenderer = api;');
    const sourceUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    try { await loadScript(sourceUrl); }
    finally { URL.revokeObjectURL(sourceUrl); }
    // Keep the renderer API object, not its create function. Previously
    // assigning ".create" here caused the later ".create(...)" to fail.
    const experimentalRenderer = window.PrototypeHybridTestRenderer;
    need(typeof experimentalRenderer?.create === 'function',
      'Hybrid diagnostic renderer API has no create function');
    hybridRendererClass = experimentalRenderer;
    loaded = true;
  }

  function makeCompositor(canvas, width, height, background = null) {
    const started = now();
    canvas.width = width; canvas.height = height;
    const gl = need(canvas.getContext('webgl2', {
      alpha: false, antialias: false, preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    }), 'WebGL2 unavailable on this browser');
    const createShader = (kind, source) => {
      const shader = need(gl.createShader(kind), 'Shader allocation failed');
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      need(gl.getShaderParameter(shader, gl.COMPILE_STATUS), gl.getShaderInfoLog(shader));
      return shader;
    };
    const shaderProgram = need(gl.createProgram(), 'GPU program unavailable');
    gl.attachShader(shaderProgram, createShader(gl.VERTEX_SHADER,
      'attribute vec2 pos; attribute vec2 uv; varying highp vec2 vUv;' +
      'uniform vec4 crop; void main(){gl_Position=vec4(pos,0.,1.);' +
      'vUv=mix(crop.xy,crop.zw,uv);}'));
    gl.attachShader(shaderProgram, createShader(gl.FRAGMENT_SHADER,
      'precision highp float;varying highp vec2 vUv;uniform sampler2D image;' +
      'void main(){gl_FragColor=texture2D(image,vUv);}'));
    gl.linkProgram(shaderProgram);
    need(gl.getProgramParameter(shaderProgram,gl.LINK_STATUS),
      gl.getProgramInfoLog(shaderProgram));
    gl.useProgram(shaderProgram);
    const data = new Float32Array([
      -1, 1, 0, 0, 1, 1, 1, 0, -1,-1, 0, 1,
      -1,-1, 0, 1, 1, 1, 1, 0, 1,-1, 1, 1
    ]);
    const buffer = need(gl.createBuffer(), 'GPU geometry buffer unavailable');
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
    for (const [name, offset] of [['pos',0],['uv',8]]) {
      const location=gl.getAttribLocation(shaderProgram,name);
      need(location>=0, 'Missing GPU shader attribute '+name);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location,2,gl.FLOAT,false,16,offset);
    }
    gl.uniform1i(gl.getUniformLocation(shaderProgram,'image'),0);
    const crop=gl.getUniformLocation(shaderProgram,'crop');
    gl.activeTexture(gl.TEXTURE0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
    const makeTexture=(image,w,h)=>{
      const tex=need(gl.createTexture(),'GPU image texture unavailable');
      gl.bindTexture(gl.TEXTURE_2D,tex);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      if(image)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
      else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
      return tex;
    };
    const staticTexture=background?makeTexture(background):null;
    const dynamicTexture=makeTexture(null,width,height);
    gl.viewport(0,0,width,height);
    gl.clearColor(12/255,25/255,19/255,1);
    const debug=gl.getExtension('WEBGL_debug_renderer_info');
    const backend=debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
    gl.finish();
    const preparationMs=now()-started;
    function drawLayer(texture, x0,y0,x1,y1) {
      gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.uniform4f(crop,x0,y0,x1,y1);
      gl.drawArrays(gl.TRIANGLES,0,6);
    }
    function present(overlayCanvas,cropX=0,cropY=0) {
      const started=now();
      gl.clear(gl.COLOR_BUFFER_BIT);
      if(staticTexture) {
        gl.disable(gl.BLEND);
        drawLayer(staticTexture,
          cropX/background.width,cropY/background.height,
          (cropX+width)/background.width,(cropY+height)/background.height);
      }
      const uploadAt=now();
      gl.bindTexture(gl.TEXTURE_2D,dynamicTexture);
      gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,overlayCanvas);
      gl.finish();
      const uploadMs=now()-uploadAt;
      const gpuAt=now();
      if(staticTexture) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      } else gl.disable(gl.BLEND);
      drawLayer(dynamicTexture,0,0,1,1);
      gl.finish();
      return {uploadMs,gpuDrawMs:now()-gpuAt,totalMs:now()-started};
    }
    function capture() {
      const raw=new Uint8Array(width*height*4);
      gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,raw);
      need(gl.getError()===gl.NO_ERROR,'GPU pixels could not be read');
      const topDown=new Uint8Array(raw.length),row=width*4;
      for(let y=0;y<height;y++)
        topDown.set(raw.subarray(y*row,(y+1)*row),(height-y-1)*row);
      return topDown;
    }
    return {
      backend,preparationMs,present,capture,textureBytes:
        width*height*4+(background?background.width*background.height*4:0)
    };
  }

  function compareBytes(ref,output) {
    need(ref.length===output.length,'Image dimensions differ');
    let sum=0,max=0,different=0;
    for(let i=0;i<ref.length;i+=4){
      let diff=0;
      for(let c=0;c<3;c++){
        const d=Math.abs(ref[i+c]-output[i+c]);
        sum+=d;diff=Math.max(diff,d);max=Math.max(max,d);
      }
      if(diff>6)different++;
    }
    return {
      meanRgbDifference:+(sum/(ref.length/4*3)).toFixed(3),
      maxRgbDifference:max,
      percentPixelsMatchingWithin6:+(100*(1-different/(ref.length/4))).toFixed(3)
    };
  }

  async function prepareAssets() {
    const response = await fetch('./assets/sprites/manifest.json');
    need(response.ok, 'Sprite catalog not available');
    const keys = Object.keys((await response.json()).sprites);
    await PrototypeSprites.preload(undefined, keys);
    await PrototypeSprites.warm(keys, { variants: true, clips: true });
    await PrototypeMaterials.load();
    await Promise.all(Object.keys(PrototypeMaterials.entries)
      .map((name) => PrototypeMaterials.ensure(name)));
  }

  async function measure() {
    runButton.disabled = true;
    window.AzerothRealGpuWorldResult = null;
    output.textContent = 'Preparing original artwork and GPU worlds…';
    try {
      await loadGame();
      const [width,height] = $('resolution').value.split('x').map(Number);
      const zoom=Number($('zoom').value);
      const region=$('region').value, night=$('lighting').value==='night';
      need(Number.isInteger(width)&&width>=400&&width<=2403&&
        Number.isInteger(height)&&height>=350&&height<=1248&&
        [1,1.5,1.75].includes(zoom),'Invalid diagnostic dimensions');
      original.width=width;original.height=height;
      const originalCtx=need(original.getContext('2d'),'Original Canvas unavailable');
      const margin=160;
      const backdrop=document.createElement('canvas');
      backdrop.width=width+2*margin; backdrop.height=height+2*margin;
      const backgroundCtx=need(backdrop.getContext('2d'),'Cannot create background artwork');
      const live=document.createElement('canvas');
      live.width=width;live.height=height;
      const liveCtx=need(live.getContext('2d'),'Cannot paint dynamic game layer');
      const game=new Campaign('normal','paladin',()=>0.7);
      game.s.zone=region;game.zone();game.zone();
      const baseTime=night?Campaign.rules.dayCycle.nightAt+60:60;
      game.s.clock=baseTime;game.s.time=baseTime;
      Object.assign(game.hero,game.safe(650,730));
      const startHero={x:game.hero.x,y:game.hero.y};
      const baseIso=iso(startHero);
      const anchor=(w,h)=>({x:Math.max(w*.35,(w-(w<=1000?204:214)-20)/2),y:(h-94)/2});
      const platform={
        cameraZoom:zoom,cameraAnchor:(w,h)=>anchor(w,h)
      };
      const expandedPlatform={
        cameraZoom:zoom,
        cameraAnchor(){
          const at=anchor(width,height);
          return{x:at.x+margin,y:at.y+margin};
        }
      };
      // A frozen clock keeps day/night color, effects and original lamps
      // deterministic between renderers. Sprite animation still advances.
      const options={
        getGame:()=>game,chargePresentation:()=>null,
        queuedChargePresentation:()=>[],
        isPaused:()=>false,Campaign,PrototypeVisuals,
        PrototypeCombatVisuals,PrototypeEnemyVfxArt,
        PrototypeSprites,PrototypeMaterials,now:()=>16000
      };
      const reference=PrototypeRenderer.create({
        ...options,canvas:{width,height},ctx:originalCtx,platform
      });
      const background=hybridRendererClass.create({
        ...options,canvas:{width:backdrop.width,height:backdrop.height},
        ctx:backgroundCtx,platform:expandedPlatform,diagnosticLayer:'background'
      });
      const moving=hybridRendererClass.create({
        ...options,canvas:{width,height},ctx:liveCtx,platform,
        diagnosticLayer:'foreground'
      });
      reference.setOptimizationMode(false);
      background.setOptimizationMode(false);
      moving.setOptimizationMode(false);
      status.textContent='Loading real game images/materials for all scene layers…';
      await prepareAssets();
      status.textContent='Building the real terrain, roads and bridges once…';
      const started=now();
      background.draw();backgroundCtx.getImageData(0,0,1,1);
      const bakeMs=now()-started;
      const layeredGpu=makeCompositor(gpuWorld,width,height,backdrop);
      const copiedGpu=makeCompositor(gpuCopy,width,height);
      const rounds=14, warmup=4;
      const times={fullCanvas:[],fullGpuWorld:[],dynamicCanvasSource:[],
        gpuDynamicTextureUpload:[],gpuLayerDraw:[],
        canvasToGpuTotal:[],canvasToGpuUpload:[]};
      const checkedFrames=[];
      let first=null,last=null,referenceState=null,layerState=null;
      for(let index=0;index<rounds+warmup;index++){
        const step=Math.max(0,index-warmup);
        const pos=game.safe(startHero.x+Math.sin(step*.35)*32,
          startHero.y+Math.cos(step*.29)*24);
        Object.assign(game.hero,pos);
        game.s.clock=baseTime+step*.03;
        game.s.time=game.s.clock;
        PrototypeSprites.advance(16,false);
        const center=iso(pos);
        const cropX=margin+(center.x-baseIso.x)*zoom,
          cropY=margin+(center.y-baseIso.y)*zoom;
        need(cropX>1&&cropY>1&&cropX+width<backdrop.width-1&&
          cropY+height<backdrop.height-1,
          'Camera exceeded static world cache; test stopped rather than showing missing terrain');
        const baselineStart=now();
        reference.draw();
        originalCtx.getImageData(0,0,1,1);
        const baselineTime=now()-baselineStart;
        const liveStart=now();
        liveCtx.setTransform(1,0,0,1,0,0);
        liveCtx.clearRect(0,0,width,height);
        moving.draw();
        liveCtx.getImageData(0,0,1,1);
        const sourceTime=now()-liveStart;
        const gpuPart=layeredGpu.present(live,cropX,cropY);
        const copyPart=copiedGpu.present(original);
        const gpuTime=sourceTime+gpuPart.totalMs;
        if(index===warmup||index===rounds+warmup-1){
          const source=originalCtx.getImageData(0,0,width,height).data;
          const layerCheck=compareBytes(source,layeredGpu.capture());
          const transferCheck=compareBytes(source,copiedGpu.capture());
          checkedFrames.push({frame:step,layerCheck,transferCheck});
          if(index===warmup)first=reference.metrics();
          if(index===rounds+warmup-1){
            last=reference.metrics();referenceState=PrototypeSprites.status();
            layerState={renderer:moving.metrics(),materials:PrototypeMaterials.status()};
          }
        }
        if(index>=warmup){
          times.fullCanvas.push(baselineTime);
          times.fullGpuWorld.push(gpuTime);
          times.dynamicCanvasSource.push(sourceTime);
          times.gpuDynamicTextureUpload.push(gpuPart.uploadMs);
          times.gpuLayerDraw.push(gpuPart.gpuDrawMs);
          times.canvasToGpuTotal.push(baselineTime+copyPart.totalMs);
          times.canvasToGpuUpload.push(copyPart.uploadMs);
        }
        if(index%4===0){
          status.textContent='Drawing full real game scenes: frame '+Math.max(0,step+1)+' / '+rounds;
          await nextFrame();
        }
      }
      const matches=checkedFrames.every(entry=>
        entry.layerCheck.percentPixelsMatchingWithin6>=99.5&&
        entry.transferCheck.percentPixelsMatchingWithin6>=99.9);
      const report={
        verdict:matches?'Full real-game GPU-composited scene closely matches Canvas':
          'Visual mismatch detected — timing must not justify renderer adoption',
        scope:'Full production scene in an isolated moving unsaved campaign. Canvas makes original artwork; GPU retains terrain/road texture, uploads dynamic actor/effect texture and renders BOTH layers. This is WebGL output, NOT GPU-native procedural artwork generation.',
        region,lighting:night?'night (original lamps retained)':'day',
        viewport:[width,height],cameraZoom:zoom,framesMeasured:rounds,
        originalArtAndLayerParity:checkedFrames,
        timePerFrameMs:{
          originalCompleteCanvas:summary(times.fullCanvas),
          completeGpuCompositedWorld:summary(times.fullGpuWorld),
          gpuWorldCanvasDynamicArtwork:summary(times.dynamicCanvasSource),
          gpuWorldDynamicTextureUpload:summary(times.gpuDynamicTextureUpload),
          gpuWorldShaderDrawing:summary(times.gpuLayerDraw),
          originalCanvasThenGpuTransfer:summary(times.canvasToGpuTotal),
          fullFrameCanvasTextureUpload:summary(times.canvasToGpuUpload)
        },
        gpuPreparation:{
          staticOriginalArtworkPaintMs:+bakeMs.toFixed(2),
          layeredGpuSetupAndUploadMs:+layeredGpu.preparationMs.toFixed(2),
          copyGpuSetupMs:+copiedGpu.preparationMs.toFixed(2),
          staticAndDynamicTextureBytes:layeredGpu.textureBytes,
          fullFrameCopyTextureBytes:copiedGpu.textureBytes,
          gpuBackend:layeredGpu.backend
        },
        firstOriginalRenderer:first,lastOriginalRenderer:last,
        dynamicRenderer:layerState,
        assets:referenceState,
        limitation:'Full GPU canvas compositing is implemented. Fully native WebGL commands for every production terrain, material, actor, effect and lamp remain unimplemented. Dynamic scenery is still painted with the original Canvas artist before uploading. The scene is scripted, not gameplay FPS. Do not promise GPU-native performance or remove Canvas fallback.',
      };
      window.AzerothRealGpuWorldResult=matches?report:null;
      output.textContent=JSON.stringify(report,null,2);
      status.textContent=report.verdict+'. All methods include real game graphics and scripted motion.';
    }catch(err){
      status.textContent='Real-game GPU comparison blocked: '+err.message;
      output.textContent=String(err.stack||err);
      window.AzerothRealGpuWorldResult=null;
    }finally{runButton.disabled=false;}
  }

  runButton.addEventListener('click', () => { void measure(); });
  status.textContent = 'Ready to compare full real-game art, moving layers and the GPU world compositor.';
})();