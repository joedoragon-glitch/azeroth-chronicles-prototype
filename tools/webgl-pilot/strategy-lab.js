/* Independent strategy laboratory: same synthetic workload, four rendering methods.
   Nothing here modifies the game's real graphics, saves or lighting. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const labels = {
    canvas: 'Original Canvas', native: 'Native WebGL',
    baked: 'Canvas-created artwork via WebGL', hybrid: 'GPU background + Canvas foreground'
  };
  const colors = ['#365647', '#6c6455', '#66836c', '#d2b279'];
  const rgb = colors.map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)));
  const bg = [16, 35, 25], side = 12;
  const status = $('status'), output = $('result');
  const contexts = {};
  let lastReport = null;

  function requireValue(yes, message) {
    if (!yes) throw Error(message);
    return yes;
  }
  const sleepFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
  const quantile = (values, p) => {
    const s = [...values].sort((a, b) => a - b);
    return +(s[Math.floor((s.length - 1) * p)] || 0).toFixed(3);
  };
  const stats = (values) => ({
    medianMs: quantile(values, 0.5), p95Ms: quantile(values, 0.95),
    maxMs: quantile(values, 1)
  });
  function generate(count, width, height) {
    let seed = 0x0a2e0a2e;
    function random() {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    }
    const world = [];
    for (let i = 0; i < count; i++) {
      // Ground and roads first, then scenery and characters: same depth
      // composition for every renderer.
      const kind = i < count * 0.45 ? 0 : i < count * 0.6 ? 1 :
        i < count * 0.87 ? 2 : 3;
      world.push({
        x: Math.floor(random() * (width - side)),
        y: Math.floor(random() * (height - side)),
        kind
      });
    }
    return world;
  }
  const movement = (step) => ({
    x: Math.round(Math.sin(step * 0.39) * 12),
    y: Math.round(Math.cos(step * 0.33) * 9)
  });
  function drawCanvas(ctx, objects, step, { overlay = false } = {}) {
    const { x: ox, y: oy } = movement(step);
    const canvas = ctx.canvas;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    if (overlay) ctx.clearRect(0, 0, canvas.width, canvas.height);
    else {
      ctx.fillStyle = '#102319';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    let kind = -1;
    for (const o of objects) {
      if (o.kind !== kind) { kind = o.kind; ctx.fillStyle = colors[kind]; }
      ctx.fillRect(o.x + ox, o.y + oy, side, side);
    }
  }

  function compile(gl, type, text) {
    const shader = requireValue(gl.createShader(type), 'Shader creation failed');
    gl.shaderSource(shader, text); gl.compileShader(shader);
    requireValue(gl.getShaderParameter(shader, gl.COMPILE_STATUS), gl.getShaderInfoLog(shader));
    return shader;
  }
  function createGpu(canvas, textured, atlas) {
    const begin = performance.now();
    const gl = requireValue(canvas.getContext('webgl2', {
      alpha: false, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance'
    }), 'WebGL2 is unavailable in this browser');
    const vertex = compile(gl, gl.VERTEX_SHADER,
      textured
        ? 'attribute vec2 position; attribute vec2 uv; uniform vec2 size; varying highp vec2 vUv;' +
          'void main(){gl_Position=vec4(position.x/size.x*2.-1.,1.-position.y/size.y*2.,0.,1.);vUv=uv;}'
        : 'attribute vec2 position; attribute vec3 color; uniform vec2 size; varying highp vec3 vColor;' +
          'void main(){gl_Position=vec4(position.x/size.x*2.-1.,1.-position.y/size.y*2.,0.,1.);vColor=color;}');
    const fragment = compile(gl, gl.FRAGMENT_SHADER,
      textured
        ? 'precision highp float; uniform sampler2D image; varying highp vec2 vUv;' +
          'void main(){gl_FragColor=texture2D(image,vUv);}'
        : 'precision highp float; varying highp vec3 vColor;' +
          'void main(){gl_FragColor=vec4(vColor,1.);}');
    const program = requireValue(gl.createProgram(), 'GPU program creation failed');
    gl.attachShader(program, vertex); gl.attachShader(program, fragment);
    gl.linkProgram(program);
    requireValue(gl.getProgramParameter(program, gl.LINK_STATUS), gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const buffer = requireValue(gl.createBuffer(), 'GPU geometry buffer unavailable');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const stride = textured ? 4 * 4 : 5 * 4;
    const attributes = textured
      ? [['position', 2, 0], ['uv', 2, 8]]
      : [['position', 2, 0], ['color', 3, 8]];
    for (const [name, count, offset] of attributes) {
      const index = gl.getAttribLocation(program, name);
      requireValue(index >= 0, 'Missing shader attribute ' + name);
      gl.enableVertexAttribArray(index);
      gl.vertexAttribPointer(index, count, gl.FLOAT, false, stride, offset);
    }
    gl.uniform2f(gl.getUniformLocation(program, 'size'), canvas.width, canvas.height);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(bg[0]/255, bg[1]/255, bg[2]/255, 1);
    gl.disable(gl.BLEND);
    let texture = null, uploadMs = 0;
    if (textured) {
      const uploadStart = performance.now();
      texture = requireValue(gl.createTexture(), 'GPU texture unavailable');
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
      gl.uniform1i(gl.getUniformLocation(program, 'image'), 0);
      gl.finish();
      uploadMs = performance.now() - uploadStart;
    }
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    const backend = debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    return {
      gl, buffer, textured, texture, backend, uploadMs,
      setupMs: performance.now() - begin, canvas
    };
  }

  // Same 12x12 rectangular objects, one draw call regardless of population.
  function geometry(objects, step, textured) {
    const n = textured ? 4 : 5, out = new Float32Array(objects.length * 6 * n);
    const { x: ox, y: oy } = movement(step);
    let i = 0;
    const vertex = (px, py, a, b, c) => {
      out[i++] = px; out[i++] = py;
      out[i++] = a; out[i++] = b;
      if (!textured) out[i++] = c;
    };
    for (const o of objects) {
      const x = o.x + ox, y = o.y + oy, x2 = x + side, y2 = y + side;
      const values = textured
        ? [o.kind * 0.25, (o.kind + 1) * 0.25]
        : rgb[o.kind].map((v) => v / 255);
      if (textured) {
        const [u0, u1] = values, v0 = 0, v1 = 0.75;
        vertex(x,y,u0,v0); vertex(x2,y,u1,v0);
        vertex(x,y2,u0,v1); vertex(x,y2,u0,v1);
        vertex(x2,y,u1,v0); vertex(x2,y2,u1,v1);
      } else {
        const [r,g,b] = values;
        vertex(x,y,r,g,b); vertex(x2,y,r,g,b); vertex(x,y2,r,g,b);
        vertex(x,y2,r,g,b); vertex(x2,y,r,g,b); vertex(x2,y2,r,g,b);
      }
    }
    return out;
  }

  function drawGpu(gpu, objects, step, flush) {
    const { gl, buffer, textured } = gpu;
    const data = geometry(objects, step, textured);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, data.length / (textured ? 4 : 5));
    if (flush) gl.finish();
  }
  function makeAtlas() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 16;
    const ctx = requireValue(canvas.getContext('2d'), 'Cannot create Canvas art atlas');
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = colors[k]; ctx.fillRect(16 * k, 0, 16, 16);
    }
    return canvas;
  }
  function gpuPixels(gpu, width, height) {
    const data = new Uint8Array(width * height * 4);
    gpu.gl.readPixels(0, 0, width, height, gpu.gl.RGBA, gpu.gl.UNSIGNED_BYTE, data);
    requireValue(gpu.gl.getError() === gpu.gl.NO_ERROR, 'GPU pixel readback failed');
    const out = new Uint8Array(data.length);
    const row = width * 4;
    for (let y=0; y<height; y++) {
      out.set(data.subarray(y * row, (y+1)*row), (height-y-1)*row);
    }
    return out;
  }
  function parity(reference, candidate) {
    let differences = 0, sum = 0, peak = 0;
    const pixels = reference.length / 4;
    for (let i=0; i<reference.length; i+=4) {
      let bad = false;
      for (let c=0; c<3; c++) {
        const d = Math.abs(reference[i+c] - candidate[i+c]);
        sum += d; peak = Math.max(peak,d);
        if (d>6) bad=true;
      }
      if (bad) differences++;
    }
    return {
      meanRgbDifference: +(sum/(pixels*3)).toFixed(3),
      percentPixelsMatchingWithin6: +(100*(1-differences/pixels)).toFixed(3),
      maximumChannelDifference: peak
    };
  }
  function computeHybridPixels(gpu, overlay, width, height) {
    const glBackground = gpuPixels(gpu, width, height);
    const combined = document.createElement('canvas');
    combined.width=width; combined.height=height;
    const q=combined.getContext('2d');
    q.putImageData(new ImageData(new Uint8ClampedArray(glBackground),width,height),0,0);
    q.drawImage(overlay,0,0);
    return q.getImageData(0,0,width,height).data;
  }
  function presentFocus() {
    const focus = $('focus').value;
    for (const section of document.querySelectorAll('[data-method]')) {
      section.hidden = focus !== 'all' && section.getAttribute('data-method') !== focus;
    }
  }
  async function run() {
    $('run').disabled = true; output.textContent = 'Preparing four methods…';
    status.textContent = 'Creating the same test scene for all methods…';
    lastReport = null;
    try {
      const [width,height] = $('size').value.split('x').map(Number);
      const count = Number($('count').value);
      requireValue(Number.isInteger(width) && Number.isInteger(height) && count>=100 && count<=3600,
        'Invalid experiment dimensions');
      const canvasIds = ['canvas','native','baked','hybridGpu','hybridCanvas'];
      for (const id of canvasIds) { $(id).width=width; $(id).height=height; }
      const world=generate(count,width,height), background=world.filter(o=>o.kind<2),
        foreground=world.filter(o=>o.kind>=2);
      const canvasCtx=requireValue($('canvas').getContext('2d'),'Original Canvas unavailable');
      const hybridOverlay=requireValue($('hybridCanvas').getContext('2d'), 'Hybrid Canvas unavailable');
      const begun=performance.now();
      const atlas=makeAtlas();
      const artPreparationMs=performance.now()-begun;
      const normalGpu=createGpu($('native'), false);
      const bakedGpu=createGpu($('baked'),true,atlas);
      const hybridGpu=createGpu($('hybridGpu'),false);
      const modes={
        canvas: (step,flush) => {
          drawCanvas(canvasCtx,world,step);
          if(flush)canvasCtx.getImageData(0,0,1,1);
        },
        native: (step,flush)=>drawGpu(normalGpu,world,step,flush),
        baked: (step,flush)=>drawGpu(bakedGpu,world,step,flush),
        hybrid: (step,flush)=>{
          drawGpu(hybridGpu,background,step,flush);
          drawCanvas(hybridOverlay,foreground,step,{overlay:true});
          if(flush)hybridOverlay.getImageData(0,0,1,1);
        }
      };
      for(const mode of Object.keys(modes))modes[mode](0,true);
      const source=canvasCtx.getImageData(0,0,width,height).data;
      const parityResults={
        native:parity(source,gpuPixels(normalGpu,width,height)),
        baked:parity(source,gpuPixels(bakedGpu,width,height)),
        hybrid:parity(source,computeHybridPixels(hybridGpu,$('hybridCanvas'),width,height))
      };
      const parityPassed=Object.values(parityResults).every(x=>x.percentPixelsMatchingWithin6>=99.0);
      if(!parityPassed){
        status.textContent='Images do not match closely enough; timing claims withheld.';
        output.textContent=JSON.stringify({parityResults,warning:'Benchmark invalid until visual parity is repaired'},null,2);
        return;
      }
      status.textContent='Comparing all four methods using repeated moving frames…';
      for(let step=0;step<3;step++)for(const mode of Object.keys(modes))modes[mode](step,true);
      const result={canvas:[],native:[],baked:[],hybrid:[]};
      const order=['canvas','native','baked','hybrid'];
      for(let step=0;step<16;step++){
        const seq=order.slice(step%4).concat(order.slice(0,step%4));
        for(const method of seq){
          const at=performance.now();
          modes[method](step,true);
          result[method].push(performance.now()-at);
        }
        if(step%5===0)await sleepFrame();
      }
      // Refresh all views at a common camera position for meaningful inspection.
      for(const mode of order)modes[mode](0,true);
      lastReport={
        scope:'Four-method TECHNICAL shape benchmark, not actual Azeroth artwork or gameplay FPS',
        objects:count, viewport:[width,height], measuredFramesPerMethod:16,
        layers:{gpuHybridBackground:background.length,canvasHybridForeground:foreground.length},
        visualParity:parityResults,
        methods:Object.fromEntries(order.map(name=>[name,stats(result[name])])),
        preparationMs:{
          createCanvasSourceArtwork:+artPreparationMs.toFixed(2),
          createNativeGpuProgram:+normalGpu.setupMs.toFixed(2),
          createCanvasTextureGpuProgram:+bakedGpu.setupMs.toFixed(2),
          atlasUploadOnly:+bakedGpu.uploadMs.toFixed(2),
          createHybridGpuProgram:+hybridGpu.setupMs.toFixed(2)
        },
        gpuBackend:normalGpu.backend,
        caveat:'The generated rectangles are identical technical sample artwork, not real isometric game graphics. All methods include a moving viewport. GPU calls use gl.finish, Canvas uses a 1-pixel readback. Browser graphics timer resolution may round fast GPU costs to zero. This does not establish best actual-game rendering architecture.'
      };
      window.AzerothGraphicsStrategyResult=lastReport;
      output.textContent=JSON.stringify(lastReport,null,2);
      status.textContent='Four methods compared. Choose a preferred method and copy a feedback report.';
    }catch(err){
      status.textContent='Comparison stopped: '+err.message;
      output.textContent=String(err.stack||err);
      lastReport=null;
    }finally{$('run').disabled=false;}
  }
  async function copyFeedback() {
    const payload=JSON.stringify({
      preference:labels[$('preferred').value],
      notes:$('feedback').value.trim(),
      benchmark:lastReport
    },null,2);
    try {
      await navigator.clipboard.writeText(payload);
      $('copyStatus').textContent='Copied. You can paste the feedback here or into a GitHub issue.';
    }catch(err){
      $('copyStatus').textContent='Clipboard unavailable. Select and copy the results above manually.';
    }
  }
  $('focus').addEventListener('change',presentFocus);
  $('run').addEventListener('click',()=>void run());
  $('copy').addEventListener('click',()=>void copyFeedback());
  presentFocus();
})();