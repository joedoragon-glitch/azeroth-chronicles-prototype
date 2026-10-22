/* Standalone hybrid experiment. All original gameplay, light and art files remain untouched. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const status = $('status'), output = $('results'), runButton = $('run');
  const original = $('reference'), hybrid = $('hybrid');
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
      "    function render() {\n      if (diagnosticLayer !== 'overlay') {\n        ctx.fillStyle = '#0c1913';\n        ctx.fillRect(0, 0, canvas.width, canvas.height);\n      }");
    replaceOnce('      const bounds = tileBounds(size);\n      const paintFloor =',
      "      if (diagnosticLayer !== 'overlay') {\n      const bounds = tileBounds(size);\n      const paintFloor =");
    replaceOnce("      ctx.restore();\n      finishPhase('floor');\n      if (authoredFloor)",
      "      }\n      ctx.restore();\n      finishPhase('floor');\n      if (diagnosticLayer === 'floor') return;\n      if (authoredFloor)");
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

  function createGPU(width, height, floorCanvas) {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const gl = need(canvas.getContext('webgl2', {
      alpha: false, antialias: false, preserveDrawingBuffer: true
    }), 'WebGL2 is not available on this Chromebook');
    const shader = (type, text) => {
      const sh = need(gl.createShader(type), 'GPU shader unavailable');
      gl.shaderSource(sh, text); gl.compileShader(sh);
      need(gl.getShaderParameter(sh, gl.COMPILE_STATUS), gl.getShaderInfoLog(sh));
      return sh;
    };
    const vs = shader(gl.VERTEX_SHADER,
      'attribute vec2 pos; attribute vec2 uv; varying highp vec2 vUv; uniform vec4 crop;' +
      'void main(){gl_Position=vec4(pos,0.,1.);vUv=mix(crop.xy,crop.zw,uv);}');
    const fs = shader(gl.FRAGMENT_SHADER,
      'precision highp float; varying highp vec2 vUv; uniform sampler2D image;' +
      'void main(){gl_FragColor=texture2D(image,vUv);}');
    const program = need(gl.createProgram(), 'GPU program unavailable');
    gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    need(gl.getProgramParameter(program, gl.LINK_STATUS), gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const verts = new Float32Array([
      -1, 1, 0, 0,  1, 1, 1, 0,  -1,-1, 0, 1,
      -1,-1, 0, 1,  1, 1, 1, 0,   1,-1, 1, 1
    ]);
    const buffer = need(gl.createBuffer(), 'GPU buffer unavailable');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    for (const [key, offset] of [['pos', 0], ['uv', 8]]) {
      const attr = gl.getAttribLocation(program, key);
      gl.enableVertexAttribArray(attr);
      gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 16, offset);
    }
    const texture = need(gl.createTexture(), 'GPU texture unavailable');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const at = now();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, floorCanvas);
    gl.finish();
    const preparationMs = now() - at;
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    const gpuName = debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    const cropLocation = gl.getUniformLocation(program, 'crop');
    const present = (cropX, cropY) => {
      const begin = now();
      gl.viewport(0, 0, width, height);
      gl.uniform4f(cropLocation,
        cropX / floorCanvas.width, cropY / floorCanvas.height,
        (cropX + width) / floorCanvas.width, (cropY + height) / floorCanvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.finish();
      return now() - begin;
    };
    return {
      canvas, present, gpuName, preparationMs,
      textureBytes: floorCanvas.width * floorCanvas.height * 4
    };
  }

  function compareCanvases(a, b, width, height) {
    const source = a.getImageData(0, 0, width, height).data;
    const result = b.getImageData(0, 0, width, height).data;
    let sum = 0, worst = 0, bad = 0;
    for (let i = 0; i < source.length; i += 4) {
      let largest = 0;
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(source[i + c] - result[i + c]);
        sum += d; largest = Math.max(largest, d); worst = Math.max(worst, d);
      }
      if (largest > 6) bad++;
    }
    return {
      meanRgbDifference: +(sum / (width * height * 3)).toFixed(2),
      maximumRgbDifference: worst,
      percentPixelsMatchingWithin6: +(100 * (1 - bad / (width * height))).toFixed(3)
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
    window.AzerothHybridPilotResult = null;
    output.textContent = 'Preparing…';
    try {
      await loadGame();
      const [width, height] = $('resolution').value.split('x').map(Number);
      const zoom = Number($('zoom').value), night = $('lighting').value === 'night';
      const region = $('region').value;
      need(width >= 400 && width <= 2403 && height >= 350 && height <= 1248,
        'Invalid experimental resolution');
      const margin = 160;
      original.width = hybrid.width = width;
      original.height = hybrid.height = height;
      const originalCtx = need(original.getContext('2d'), 'Original Canvas unavailable');
      const hybridCtx = need(hybrid.getContext('2d'), 'Hybrid Canvas unavailable');
      const floorCanvas = document.createElement('canvas');
      floorCanvas.width = width + 2 * margin;
      floorCanvas.height = height + 2 * margin;
      const floorCtx = need(floorCanvas.getContext('2d'), 'Ground preparation Canvas unavailable');
      const game = new Campaign('normal', 'paladin', () => 0.7);
      game.s.zone = region; game.zone(); game.zone();
      const baseTime = night ? Campaign.rules.dayCycle.nightAt + 60 : 60;
      game.s.clock = baseTime; game.s.time = baseTime;
      Object.assign(game.hero, game.safe(650, 730));
      const anchorHero = { x: game.hero.x, y: game.hero.y };
      const anchor = (w, h) => ({
        x: Math.max(w * 0.35, (w - (w <= 1000 ? 204 : 214) - 20) / 2),
        y: (h - 94) / 2
      });
      const platform = {
        cameraZoom: zoom,
        cameraAnchor(w, h) { return anchor(w, h); }
      };
      const overPlatform = {
        cameraZoom: zoom,
        cameraAnchor() {
          const p = anchor(width, height);
          return { x: p.x + margin, y: p.y + margin };
        }
      };
      const options = {
        getGame: () => game, chargePresentation: () => null,
        queuedChargePresentation: () => [], isPaused: () => false,
        Campaign, PrototypeVisuals, PrototypeCombatVisuals,
        PrototypeEnemyVfxArt, PrototypeSprites, PrototypeMaterials,
        now: () => 16000
      };
      const reference = PrototypeRenderer.create({
        ...options, canvas: { width, height }, ctx: originalCtx, platform
      });
      const floorOnly = hybridRendererClass.create({
        ...options, canvas: { width: floorCanvas.width, height: floorCanvas.height },
        ctx: floorCtx, platform: overPlatform, diagnosticLayer: 'floor'
      });
      const foreground = hybridRendererClass.create({
        ...options, canvas: { width, height }, ctx: hybridCtx, platform,
        diagnosticLayer: 'overlay'
      });
      reference.setOptimizationMode(false);
      floorOnly.setOptimizationMode(false);
      foreground.setOptimizationMode(false);
      status.textContent = 'Warming original sprites and material textures…';
      await prepareAssets();
      const startFloor = now();
      floorOnly.draw(); floorCtx.getImageData(0, 0, 1, 1);
      const floorPrepareMs = now() - startFloor;
      const gpu = createGPU(width, height, floorCanvas);
      const baseIso = iso(anchorHero);
      const metrics = { reference: [], hybrid: [], gpuFloor: [], canvasOverlay: [], gpuToCanvas: [] };
      let parity = null, referenceStats = null, overlayStats = null;
      const rounds = 14;
      for (let index = 0; index < rounds + 4; index++) {
        const k = index - 4;
        const phase = Math.max(k, 0);
        const position = game.safe(
          anchorHero.x + Math.sin(phase * 0.35) * 32,
          anchorHero.y + Math.cos(phase * 0.29) * 24
        );
        Object.assign(game.hero, position);
        game.s.clock = baseTime + phase * 0.03;
        game.s.time = game.s.clock;
        PrototypeSprites.advance(16, false);
        const nextIso = iso(position);
        const cropX = margin + (nextIso.x - baseIso.x) * zoom;
        const cropY = margin + (nextIso.y - baseIso.y) * zoom;
        need(cropX >= 1 && cropY >= 1 &&
          cropX + width <= floorCanvas.width - 1 &&
          cropY + height <= floorCanvas.height - 1,
          'Camera moved outside the preserved GPU ground window');
        const refAt = now();
        reference.draw();
        originalCtx.getImageData(0, 0, 1, 1);
        const refMs = now() - refAt;
        const glMs = gpu.present(cropX, cropY);
        const compositeAt = now();
        hybridCtx.setTransform(1, 0, 0, 1, 0, 0);
        hybridCtx.drawImage(gpu.canvas, 0, 0);
        const compositeMs = now() - compositeAt;
        const overlayAt = now();
        foreground.draw();
        hybridCtx.getImageData(0, 0, 1, 1);
        const overlayMs = now() - overlayAt;
        if (index === 4 || index === rounds + 3) {
          parity = compareCanvases(originalCtx, hybridCtx, width, height);
          referenceStats = reference.metrics(); overlayStats = foreground.metrics();
        }
        if (k >= 0) {
          metrics.reference.push(refMs);
          metrics.hybrid.push(glMs + compositeMs + overlayMs);
          metrics.gpuFloor.push(glMs);
          metrics.gpuToCanvas.push(compositeMs);
          metrics.canvasOverlay.push(overlayMs);
        }
        if (index % 4 === 0) {
          status.textContent = 'Comparing frame ' + Math.max(0, k + 1) + ' of ' + rounds + '…';
          await nextFrame();
        }
      }
      const match = parity.percentPixelsMatchingWithin6 >= 99.5;
      const report = {
        verdict: match ? 'Hybrid and original visual output closely match' :
          'Hybrid has visible differences; benchmark NOT VALID for adoption',
        region, lighting: night ? 'night — unchanged lamps' : 'day',
        viewport: [width, height], cameraZoom: zoom,
        framesMeasured: rounds, parity, gpuBackend: gpu.gpuName,
        preparedStaticGround: {
          canvasPaintingMs: +floorPrepareMs.toFixed(2),
          gpuUploadMs: +gpu.preparationMs.toFixed(2),
          textureBytes: gpu.textureBytes,
          refreshedPerFrame: false
        },
        timePerFrameMs: {
          fullOriginalCanvas: summary(metrics.reference),
          completeHybrid: summary(metrics.hybrid),
          hybridGpuGround: summary(metrics.gpuFloor),
          hybridGpuToCanvas: summary(metrics.gpuToCanvas),
          hybridCanvasForegroundAndEffects: summary(metrics.canvasOverlay)
        },
        referenceRender: referenceStats, hybridForegroundRender: overlayStats,
        limitation: 'Hybrid GPU draws ONLY the reused original static ground layer. Canvas continues to paint terrain/roads/actors/buildings/lighting/occlusion and all dynamic art. Real-world animation may require more invalidation. No gameplay FPS or settings change.'
      };
      output.textContent = JSON.stringify(report, null, 2);
      window.AzerothHybridPilotResult = match ? report : null;
      status.textContent = report.verdict + '. See detailed per-frame times and the one-time preparation cost.';
    } catch (error) {
      status.textContent = 'Hybrid diagnostic blocked: ' + error.message;
      output.textContent = String(error.stack || error);
    } finally { runButton.disabled = false; }
  }
  runButton.addEventListener('click', () => { void measure(); });
  status.textContent = 'Ready to compare original Canvas with GPU-ground + Canvas-world.';
})();