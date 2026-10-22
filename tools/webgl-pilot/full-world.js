/* Isolated whole-scene Canvas -> WebGL bridge diagnostic.
   Displays the real complete renderer, does NOT accelerate its CPU painting.
   No saves, production renderer edits, or changes to lighting/art. */
(function () {
  'use strict';
  const get = (id) => document.getElementById(id);
  const status = get('status'), results = get('results'), run = get('run');
  const native = get('native'), gpuCanvas = get('gpu');
  const stamp = () => performance.now();
  const yieldFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
  const ensure = (yes, message) => { if (!yes) throw Error(message); return yes; };
  const stat = (numbers) => {
    const values = [...numbers].sort((a, b) => a - b);
    const pick = (fraction) => values[Math.min(values.length - 1, Math.floor((values.length - 1) * fraction))];
    return { medianMs: +pick(0.5).toFixed(2), p95Ms: +pick(0.95).toFixed(2),
      minMs: +values[0].toFixed(2), maxMs: +values.at(-1).toFixed(2) };
  };
  let loaded = false;

  async function loadGameCode() {
    if (loaded) return;
    status.textContent = 'Loading the real game drawing modules (not your saved game)…';
    const response = await fetch('./index.html', { cache: 'no-store' });
    ensure(response.ok, 'Cannot read game module list.');
    const gamePage = new DOMParser().parseFromString(await response.text(), 'text/html');
    const paths = [...gamePage.querySelectorAll('script[src]')]
      .map((script) => script.getAttribute('src'))
      .filter((path) => path && !path.endsWith('/app.js'));
    ensure(paths.some((path) => path.endsWith('/renderer.js')), 'Real game renderer missing.');
    ensure(paths.some((path) => path.endsWith('/visuals.js')), 'Real world visuals missing.');
    for (const [index, path] of paths.entries()) {
      const script = document.createElement('script');
      script.src = path;
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => reject(Error('Game module could not load: ' + path));
        document.body.appendChild(script);
      });
      if ((index + 1) % 12 === 0) {
        status.textContent = 'Loaded ' + (index + 1) + '/' + paths.length + ' original game modules…';
        await yieldFrame();
      }
    }
    ensure(typeof Campaign === 'function' && typeof PrototypeRenderer?.create === 'function',
      'Campaign rendering modules failed to initialize.');
    loaded = true;
  }

  function setupGL(width, height) {
    const gl = gpuCanvas.getContext('webgl2', {
      alpha: false, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance'
    });
    ensure(gl, 'This browser has no working WebGL2 context.');
    ensure(gl.getParameter(gl.MAX_TEXTURE_SIZE) >= Math.max(width, height),
      'Viewport exceeds this GPU texture size limit.');
    const shader = (type, source) => {
      const object = ensure(gl.createShader(type), 'Cannot allocate shader');
      gl.shaderSource(object, source);
      gl.compileShader(object);
      ensure(gl.getShaderParameter(object, gl.COMPILE_STATUS), gl.getShaderInfoLog(object));
      return object;
    };
    const vs = shader(gl.VERTEX_SHADER,
      'attribute vec2 position; attribute vec2 texcoord; varying highp vec2 vUv;' +
      'void main(){gl_Position=vec4(position,0.0,1.0);vUv=texcoord;}');
    const fs = shader(gl.FRAGMENT_SHADER,
      'precision highp float; varying highp vec2 vUv; uniform sampler2D frame;' +
      'void main(){gl_FragColor=texture2D(frame,vUv);}');
    const program = ensure(gl.createProgram(), 'Cannot allocate GPU program');
    gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    ensure(gl.getProgramParameter(program, gl.LINK_STATUS), gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const verts = new Float32Array([
      -1, 1, 0, 0,   1, 1, 1, 0,   -1,-1, 0, 1,
      -1,-1, 0, 1,   1, 1, 1, 0,    1,-1, 1, 1
    ]);
    const buffer = ensure(gl.createBuffer(), 'Cannot allocate GPU geometry buffer');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    for (const [name, offset] of [['position', 0], ['texcoord', 8]]) {
      const loc = gl.getAttribLocation(program, name);
      ensure(loc >= 0, name + ' GPU attribute missing');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 16, offset);
    }
    gl.activeTexture(gl.TEXTURE0);
    const texture = ensure(gl.createTexture(), 'Cannot allocate GPU frame texture');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.viewport(0, 0, width, height);
    gl.uniform1i(gl.getUniformLocation(program, 'frame'), 0);
    gl.disable(gl.BLEND);
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    const backend = debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    const present = () => {
      const beginUpload = stamp();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, native);
      gl.finish();
      const uploadMs = stamp() - beginUpload;
      const beginDraw = stamp();
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.finish();
      return { uploadMs, gpuDisplayMs: stamp() - beginDraw };
    };
    return { gl, backend, present, textureBytes: width * height * 4 };
  }

  function visualComparison(gl, width, height, ctx) {
    const source = ctx.getImageData(0, 0, width, height).data;
    const raw = new Uint8Array(source.length);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, raw);
    ensure(gl.getError() === gl.NO_ERROR, 'WebGL frame readback failed.');
    let sum = 0, worst = 0, changed = 0;
    const row = width * 4;
    for (let y = 0; y < height; y++) {
      const sourceRow = y * row, gpuRow = (height - 1 - y) * row;
      for (let x = 0; x < row; x += 4) {
        let difference = 0;
        for (let c = 0; c < 3; c++) {
          const diff = Math.abs(source[sourceRow + x + c] - raw[gpuRow + x + c]);
          sum += diff; difference = Math.max(diff, difference);
          worst = Math.max(worst, diff);
        }
        if (difference > 4) changed++;
      }
    }
    return {
      meanRgbChannelDifference: +(sum / (width * height * 3)).toFixed(3),
      worstChannelDifference: worst,
      pixelsWithRgbDifferenceOver4: changed,
      percentPixelsMatchingWithin4: +(100 * (1 - changed / (width * height))).toFixed(3)
    };
  }

  async function warmAssets() {
    status.textContent = 'Preparing original game sprites and terrain materials…';
    const manifestResp = await fetch('./assets/sprites/manifest.json');
    ensure(manifestResp.ok, 'Original sprite manifest unavailable.');
    const manifest = await manifestResp.json();
    const keys = Object.keys(manifest.sprites);
    await PrototypeSprites.preload(undefined, keys);
    await PrototypeSprites.warm(keys, { variants: true, clips: true });
    if (typeof PrototypeMaterials !== 'undefined') {
      await PrototypeMaterials.load();
      await Promise.all(Object.keys(PrototypeMaterials.entries || {})
        .map((key) => PrototypeMaterials.ensure(key)));
    }
  }

  async function measure() {
    run.disabled = true;
    results.textContent = 'Preparing full-scene comparison…';
    window.AzerothFullWorldPilotResult = null;
    try {
      await loadGameCode();
      const [width, height] = get('resolution').value.split('x').map(Number);
      const zoom = Number(get('zoom').value);
      const night = get('timeofday').value === 'night';
      const region = get('region').value;
      ensure(Number.isInteger(width) && width > 0 && width <= 2403 &&
        Number.isInteger(height) && height > 0 && height <= 1248, 'Invalid viewport.');
      native.width = gpuCanvas.width = width;
      native.height = gpuCanvas.height = height;
      const ctx = ensure(native.getContext('2d'), 'Canvas 2D is unavailable.');
      const bridge = setupGL(width, height);
      const game = new Campaign('normal', 'paladin', () => 0.7);
      game.s.zone = region;
      game.zone();
      game.zone();
      game.s.clock = night ? Campaign.rules.dayCycle.nightAt + 60 : 60;
      game.s.time = game.s.clock;
      const safe = game.safe(650, 730);
      Object.assign(game.hero, safe);
      const startingHero = { x: game.hero.x, y: game.hero.y };
      const viewport = { width, height };
      const platform = {
        cameraZoom: zoom,
        cameraAnchor(w, h) {
          return { x: Math.max(w * 0.35, (w - (w <= 1000 ? 204 : 214) - 20) / 2),
            y: (h - 94) / 2 };
        }
      };
      const renderer = PrototypeRenderer.create({
        canvas: viewport, ctx, getGame: () => game, platform,
        chargePresentation: () => null,
        queuedChargePresentation: () => [],
        isPaused: () => false,
        Campaign, PrototypeVisuals, PrototypeCombatVisuals, PrototypeEnemyVfxArt,
        PrototypeSprites, PrototypeMaterials
      });
      renderer.setOptimizationMode(false);
      await warmAssets();
      // All full-world work, including nighttime illumination and roads, passes
      // through the unmodified production renderer. We move the camera target
      // only on this unsaved, temporary campaign.
      const frames = 18, samples = { painter: [], upload: [], gpu: [], combined: [] };
      let parity = null, firstFrame = null, lastFrame = null, metrics = null;
      for (let i = -4; i < frames; i++) {
        const frameIndex = Math.max(0, i);
        const origin = game.safe(startingHero.x + Math.sin(frameIndex * 0.27) * 38,
          startingHero.y + Math.cos(frameIndex * 0.27) * 24);
        Object.assign(game.hero, origin);
        game.s.clock = (night ? Campaign.rules.dayCycle.nightAt + 60 : 60) + frameIndex * 0.02;
        game.s.time = game.s.clock;
        PrototypeSprites.advance(16, false);
        const at = stamp();
        renderer.draw();
        ctx.getImageData(0, 0, 1, 1); // force Canvas completion, not full-frame readback
        const paintMs = stamp() - at;
        const transfer = bridge.present();
        if (i === 0) { parity = visualComparison(bridge.gl, width, height, ctx);
          firstFrame = renderer.metrics(); }
        if (i >= 0) {
          samples.painter.push(paintMs);
          samples.upload.push(transfer.uploadMs);
          samples.gpu.push(transfer.gpuDisplayMs);
          samples.combined.push(paintMs + transfer.uploadMs + transfer.gpuDisplayMs);
        }
        if (i === frames - 1) {
          lastFrame = renderer.metrics();
          metrics = { sprites: PrototypeSprites.status(), materials: PrototypeMaterials.status() };
        }
        if (i % 4 === 0) {
          status.textContent = 'Rendering real moving world frame ' + Math.max(0, i + 1) +
            ' / ' + frames + '…';
          await yieldFrame();
        }
      }
      const report = {
        result: parity.percentPixelsMatchingWithin4 >= 99.9
          ? 'Full-world Canvas/WebGL presentation matches'
          : 'Visual differences detected — do not claim parity',
        scope: 'Complete production world canvas, moving camera, existing art, terrain, roads, buildings, lighting, occlusion and effects. The GPU receives a FULLY PAINTED Canvas frame; it is not an independent WebGL game renderer.',
        region, lighting: night ? 'night (lamps preserved)' : 'day',
        backingPixels: [width, height], cameraZoom: zoom, framesMeasured: frames,
        parity, gpuBackend: bridge.backend,
        fullFrameGpuTextureBytes: bridge.textureBytes,
        timeMs: {
          originalFullCanvasPaint: stat(samples.painter),
          fullFrameGpuTransfer: stat(samples.upload),
          gpuPresentOnly: stat(samples.gpu),
          totalCanvasPlusGpu: stat(samples.combined)
        },
        renderFirst: firstFrame, renderLast: lastFrame,
        assets: metrics,
        limitation: 'The GPU paint savings are NOT measured here: Canvas still generates every world pixel. This trial measures exact integration, full-scene CPU baseline and GPU-copy overhead. It does not prove better gameplay FPS or add a GPU setting.'
      };
      window.AzerothFullWorldPilotResult = report;
      results.textContent = JSON.stringify(report, null, 2);
      status.textContent = report.result + '. Read the Canvas cost and GPU upload overhead separately.';
    } catch (error) {
      status.textContent = 'Complete-world diagnostic blocked: ' + error.message;
      results.textContent = String(error.stack || error);
      window.AzerothFullWorldPilotResult = null;
    } finally { run.disabled = false; }
  }
  run.addEventListener('click', () => { void measure(); });
  status.textContent = 'Ready. This independent diagnostic does not load your saved game.';
})();