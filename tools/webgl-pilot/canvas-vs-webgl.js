/* Canvas Only vs WebGL Only, two display/frame paths.
   The WebGL frame path uses its own GLSL shaders and GPU-resident real-game
   texture; Canvas drawing occurs in its ONE-TIME texture preparation only.
   It is not yet a native real-time equivalent of animated gameplay. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('canvasPath'), viewGL = $('webglPath');
  const status = $('status'), output = $('results'), button = $('run');
  const now = () => performance.now();
  const checked = (ok, why) => { if (!ok) throw Error(why); return ok; };
  const nextFrame = () => new Promise(done => requestAnimationFrame(done));
  const iso = ({x,y}) => ({x:(x-y)*.76,y:(x+y)*.27});
  const percentile = (numbers, fraction) => {
    const ordered = [...numbers].sort((a,b) => a-b);
    return +(ordered[Math.floor((ordered.length-1)*fraction)]||0).toFixed(2);
  };
  const stats = values => ({
    medianMs: percentile(values,.5), p95Ms: percentile(values,.95),
    minimumMs: percentile(values,0),maximumMs:percentile(values,1)
  });
  let scriptsLoaded=false;

  async function loadGameModules() {
    if (scriptsLoaded) return;
    status.textContent='Loading real game rendering modules…';
    const response=await fetch('./index.html',{cache:'no-store'});
    checked(response.ok,'Unable to retrieve generated game module list.');
    const doc=new DOMParser().parseFromString(await response.text(),'text/html');
    const srcs=[...doc.querySelectorAll('script[src]')].map(x=>x.getAttribute('src'))
      .filter(src=>src && !src.endsWith('/app.js'));
    checked(srcs.some(src=>src.endsWith('/renderer.js')),
      'Real prototype renderer missing from game page.');
    for(let i=0;i<srcs.length;i++){
      const element=document.createElement('script');
      element.src=srcs[i];
      await new Promise((resolve,reject)=>{
        element.onload=resolve;
        element.onerror=()=>reject(Error('Could not load '+srcs[i]));
        document.body.appendChild(element);
      });
      if(i%12===11){status.textContent='Loaded '+(i+1)+' original game modules…';
        await nextFrame();}
    }
    checked(window.PrototypeRenderer?.create && typeof Campaign==='function',
      'Real campaign renderer failed to initialize.');
    scriptsLoaded=true;
  }

  async function prepareGameAssets() {
    const res=await fetch('./assets/sprites/manifest.json');
    checked(res.ok,'Real game sprite manifest missing.');
    const manifest=await res.json();
    const keys=Object.keys(manifest.sprites);
    await PrototypeSprites.preload(undefined,keys);
    await PrototypeSprites.warm(keys,{variants:true,clips:true});
    await PrototypeMaterials.load();
    await Promise.all(Object.keys(PrototypeMaterials.entries||{})
      .map(key=>PrototypeMaterials.ensure(key)));
  }

  function newGPU(width,height,preparedCanvas) {
    viewGL.width=width;viewGL.height=height;
    const gl=checked(viewGL.getContext('webgl2',{
      alpha:false, antialias:false, preserveDrawingBuffer:true,
      powerPreference:'high-performance'
    }), 'WebGL2 is unavailable on this browser.');
    checked(gl.getParameter(gl.MAX_TEXTURE_SIZE)>=Math.max(preparedCanvas.width,preparedCanvas.height),
      'GPU texture size is insufficient for full real-world art at this viewport.');
    const createShader=(kind,source)=>{
      const shader=checked(gl.createShader(kind),'WebGL shader allocation failed');
      gl.shaderSource(shader,source);gl.compileShader(shader);
      checked(gl.getShaderParameter(shader,gl.COMPILE_STATUS),gl.getShaderInfoLog(shader));
      return shader;
    };
    const program=checked(gl.createProgram(),'GPU program allocation failed');
    gl.attachShader(program,createShader(gl.VERTEX_SHADER,
      'attribute vec2 pos;attribute vec2 uv;varying highp vec2 vUv;uniform vec4 crop;' +
      'void main(){gl_Position=vec4(pos,0.,1.);vUv=mix(crop.xy,crop.zw,uv);}'));
    gl.attachShader(program,createShader(gl.FRAGMENT_SHADER,
      'precision highp float;varying highp vec2 vUv;uniform sampler2D tex;' +
      'void main(){gl_FragColor=texture2D(tex,vUv);}'));
    gl.linkProgram(program);
    checked(gl.getProgramParameter(program,gl.LINK_STATUS),gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const verts=new Float32Array([
      -1,1,0,0, 1,1,1,0, -1,-1,0,1,
      -1,-1,0,1, 1,1,1,0, 1,-1,1,1
    ]);
    const buffer=checked(gl.createBuffer(),'GPU geometry unavailable');
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,verts,gl.STATIC_DRAW);
    for(const [name,offset] of [['pos',0],['uv',8]]){
      const loc=gl.getAttribLocation(program,name);
      checked(loc>=0,'GPU attribute not found '+name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc,2,gl.FLOAT,false,16,offset);
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
    const texture=checked(gl.createTexture(),'Cannot create GPU world texture');
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const uploadStart=now();
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,preparedCanvas);
    gl.finish();
    const initialGpuUploadMs=now()-uploadStart;
    gl.uniform1i(gl.getUniformLocation(program,'tex'),0);
    const cropLoc=gl.getUniformLocation(program,'crop');
    gl.clearColor(12/255,25/255,19/255,1);
    gl.disable(gl.BLEND);
    gl.viewport(0,0,width,height);
    const ext=gl.getExtension('WEBGL_debug_renderer_info');
    const backend=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
    function draw(cropX,cropY) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform4f(cropLoc,
        cropX/preparedCanvas.width,cropY/preparedCanvas.height,
        (cropX+width)/preparedCanvas.width,
        (cropY+height)/preparedCanvas.height);
      gl.drawArrays(gl.TRIANGLES,0,6);
      gl.finish();
    }
    function pixels() {
      const flipped=new Uint8Array(width*height*4);
      const raw=new Uint8Array(flipped.length);
      gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,raw);
      checked(gl.getError()===gl.NO_ERROR,'GPU world readback failed');
      const stride=width*4;
      for(let row=0;row<height;row++){
        flipped.set(raw.subarray(row*stride,(row+1)*stride),
          (height-1-row)*stride);
      }
      return flipped;
    }
    return {draw,pixels,initialGpuUploadMs,backend,
      gpuTextureBytes:preparedCanvas.width*preparedCanvas.height*4};
  }

  function pixelAgreement(original,gpu) {
    checked(original.length===gpu.length,'Graphics comparison sizes mismatch');
    let changed=0,sum=0,worst=0;
    for(let i=0;i<original.length;i+=4){
      let d=0;
      for(let channel=0;channel<3;channel++){
        const delta=Math.abs(original[i+channel]-gpu[i+channel]);
        d=Math.max(d,delta);
        sum+=delta;worst=Math.max(worst,delta);
      }
      if(d>6)changed++;
    }
    return {
      percentPixelsMatchingWithin6:+(100*(1-changed/(original.length/4))).toFixed(3),
      meanRgbDifference:+(sum/(original.length/4*3)).toFixed(3),
      maxChannelDifference:worst
    };
  }

  async function run() {
    button.disabled=true;
    window.AzerothCanvasVsWebglResult=null;
    output.textContent='Preparing genuine Azeroth artwork…';
    try {
      await loadGameModules();
      const [width,height]=$('resolution').value.split('x').map(Number);
      const zoom=Number($('zoom').value),region=$('region').value;
      const night=$('lighting').value==='night';
      checked([960,1600,2403].includes(width)&&
        [540,900,1248].includes(height)&&
        [1,1.5,1.75].includes(zoom),'Invalid diagnostic display settings');
      canvas.width=width;canvas.height=height;
      const ctx=checked(canvas.getContext('2d'),'Canvas 2D unavailable');
      const margin=160;
      const baked=document.createElement('canvas');
      baked.width=width+2*margin;baked.height=height+2*margin;
      const baker=checked(baked.getContext('2d'),'Real artwork preparation unavailable');
      const game=new Campaign('normal','paladin',()=>0.7);
      game.s.zone=region;game.zone();game.zone();
      const baseTime=night?Campaign.rules.dayCycle.nightAt+60:60;
      game.s.clock=baseTime;game.s.time=baseTime;
      Object.assign(game.hero,game.safe(650,730));
      const origin={x:game.hero.x,y:game.hero.y},originalIso=iso(origin);
      const camera=(w,h)=>({
        x:Math.max(w*.35,(w-(w<=1000?204:214)-20)/2),
        y:(h-94)/2
      });
      const platform={cameraZoom:zoom,cameraAnchor:camera};
      const bakedPlatform={cameraZoom:zoom,cameraAnchor(){
        const a=camera(width,height);
        return{x:a.x+margin,y:a.y+margin};
      }};
      const options={
        getGame:()=>game,chargePresentation:()=>null,
        queuedChargePresentation:()=>[],isPaused:()=>false,
        Campaign,PrototypeVisuals,PrototypeCombatVisuals,
        PrototypeEnemyVfxArt,PrototypeSprites,PrototypeMaterials,
        now:()=>16000
      };
      const original=PrototypeRenderer.create({
        ...options,canvas:{width,height},ctx,platform
      });
      const preparer=PrototypeRenderer.create({
        ...options,canvas:{width:baked.width,height:baked.height},
        ctx:baker,platform:bakedPlatform
      });
      original.setOptimizationMode(false);
      preparer.setOptimizationMode(false);
      status.textContent='Loading original sprites, terrain and materials…';
      await prepareGameAssets();
      status.textContent='Painting all real-world assets for GPU initialization once…';
      const bakeAt=now();
      preparer.draw();
      baker.getImageData(0,0,1,1);
      const canvasPreparationMs=now()-bakeAt;
      const gpuAt=now();
      const gpu=newGPU(width,height,baked);
      const gpuPreparationMs=now()-gpuAt;
      // Shader draws ONLY the static prepared artwork after this point.
      // No Canvas draw calls occur inside the timed WebGL-only path.
      const times={canvas:[],webgl:[]};
      const checkpoints=[];
      const frames=18,warmup=4;
      for(let i=0;i<frames+warmup;i++){
        const step=Math.max(0,i-warmup);
        const here=game.safe(
          origin.x+Math.sin(step*.35)*32,
          origin.y+(Math.cos(step*.29)-1)*24
        );
        Object.assign(game.hero,here);
        game.s.clock=baseTime+step*.03;
        game.s.time=game.s.clock;
        PrototypeSprites.advance(16,false);
        const p=iso(here);
        const cropX=margin+(p.x-originalIso.x)*zoom;
        const cropY=margin+(p.y-originalIso.y)*zoom;
        checked(cropX>=1&&cropY>=1&&
          cropX+width<=baked.width-1&&cropY+height<=baked.height-1,
          'Camera moved outside WebGL-only world texture: cannot compare safely');
        const pair=i%2 ? ['gpu','canvas']:['canvas','gpu'];
        const elapsed={};
        for(const method of pair){
          const at=now();
          if(method==='canvas'){
            original.draw();
            ctx.getImageData(0,0,1,1);
          }else gpu.draw(cropX,cropY);
          elapsed[method]=now()-at;
        }
        if(i===warmup||i===frames+warmup-1){
          const reference=ctx.getImageData(0,0,width,height).data;
          checkpoints.push({
            frame:step,
            cameraDeltaPx:{
              x:+(cropX-margin).toFixed(2),
              y:+(cropY-margin).toFixed(2)
            },
            parity:pixelAgreement(reference,gpu.pixels())
          });
        }
        if(i>=warmup){
          times.canvas.push(elapsed.canvas);
          times.webgl.push(elapsed.gpu);
        }
        if(i%5===0){
          status.textContent='Comparing moving real-world views '+Math.max(0,step+1)+'/'+frames;
          await nextFrame();
        }
      }
      // Both images show the same final camera rather than an out-of-sync pair.
      const scene=iso(game.hero);
      gpu.draw(margin+(scene.x-originalIso.x)*zoom,
        margin+(scene.y-originalIso.y)*zoom);
      const report={
        modes:['Original Canvas 2D, full live game rendering',
          'WebGL2-only timed frame drawing of prepared full-scene game artwork'],
        scope:'Actual Azeroth region terrain, roads, buildings, authored sprites, procedural entities and lamps are prepared from the game. The WebGL-only frame path uses shaders and a GPU texture and never invokes Canvas during measured GPU frames.',
        region,lighting:night?'night with original lamps':'day',
        viewport:[width,height],cameraZoom:zoom,framesMeasured:frames,
        timePerFrameMs:{
          originalCanvasFullLiveScene:stats(times.canvas),
          webglOnlyPreparedArtwork:stats(times.webgl)
        },
        initialPreparationMs:{
          originalArtworkCanvasPaint: +canvasPreparationMs.toFixed(2),
          gpuProgramAndTextureSetup:+gpuPreparationMs.toFixed(2),
          gpuTextureUpload:+gpu.initialGpuUploadMs.toFixed(2)
        },
        gpuTextureBytes:gpu.gpuTextureBytes,
        gpuBackend:gpu.backend,
        visualAgreement:checkpoints,
        renderingWorkEquivalent:false,
        verdict:'NO FAIR PERFORMANCE WINNER: WebGL-only is displaying GPU-cached, prepainted real game artwork; live actors, animated lighting and effects are not independently updated in its GPU frame path.',
        missingForWebglNativeParity:[
          'Native WebGL replacement for original procedural art creation',
          'Real-time animation and per-actor movement using original art',
          'Real-time combat effects and preserved Canvas blend/light semantics',
          'Cache invalidation and streaming beyond the texture window'
        ],
        warning:'The WebGL side is not hybrid during the frame timing, but its initial artwork is built by Canvas. It is a full visual scene GPU renderer, NOT a fully WebGL-native live game. Raw fast GPU frame time cannot be treated as gameplay FPS.'
      };
      window.AzerothCanvasVsWebglResult=report;
      output.textContent=JSON.stringify(report,null,2);
      status.textContent='Two-path test complete. Read visual agreement and the unequal animation workload before comparing frame speeds.';
    }catch(error){
      status.textContent='Two-path comparison blocked: '+error.message;
      output.textContent=String(error.stack||error);
    }finally{
      button.disabled=false;
    }
  }
  button.addEventListener('click',()=>{void run();});
})();