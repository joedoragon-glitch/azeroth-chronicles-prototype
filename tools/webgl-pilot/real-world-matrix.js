/* Complete real-game pipeline matrix: production Canvas, Canvas->WebGL, hybrid, hybrid->WebGL. No native full-WebGL implementation claims. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const status = $('status'), output = $('results'), runButton = $('run');
  const original = $('original'), hybrid = $('hybrid');
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
    const uploadFrame = (source) => {
      need(source.width === floorCanvas.width && source.height === floorCanvas.height,
        'GPU source dimensions changed without texture reallocation');
      const t = now();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.finish();
      return now() - t;
    };
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
      canvas, present, uploadFrame, gpuName, preparationMs,
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

  function samePixels(ctx, gpuSurface, width, height) {
    const target = document.createElement('canvas');
    target.width = width; target.height = height;
    const context = need(target.getContext('2d'), 'Cannot compare GPU pixels');
    context.drawImage(gpuSurface, 0, 0);
    return compareCanvases(ctx, context, width, height);
  }

  async function measure() {
    runButton.disabled = true;
    window.AzerothRealWorldPipelineResult = null;
    output.textContent = 'Preparing a real production scene and four complete display pipelines…';
    try {
      await loadGame();
      const [width, height] = $('resolution').value.split('x').map(Number);
      const zoom = Number($('zoom').value), night = $('lighting').value === 'night';
      const region = $('region').value;
      const simulation = $('movement').value === 'simulate';
      need(width >= 400 && width <= 2403 && height >= 350 && height <= 1248,
        'Unsupported diagnostic resolution');
      const margin = 160;
      original.width = hybrid.width = width;
      original.height = hybrid.height = height;
      const originalCtx = need(original.getContext('2d'), 'Original game Canvas not available');
      const hybridCtx = need(hybrid.getContext('2d'), 'Hybrid Canvas not available');
      const floorCanvas = document.createElement('canvas');
      floorCanvas.width = width + margin * 2;
      floorCanvas.height = height + margin * 2;
      const floorCtx = need(floorCanvas.getContext('2d'), 'Original floor preparation failed');
      const game = new Campaign('normal', 'paladin', () => 0.7);
      game.s.zone = region;
      game.zone(); game.zone();
      const baseClock = night ? Campaign.rules.dayCycle.nightAt + 60 : 60;
      game.s.clock = baseClock; game.s.time = baseClock;
      Object.assign(game.hero, game.safe(650, 730));
      const originHero = { x: game.hero.x, y: game.hero.y };
      const anchor = (w, h) => ({
        x: Math.max(w * 0.35, (w - (w <= 1000 ? 204 : 214) - 20) / 2),
        y: (h - 94) / 2
      });
      const platform = { cameraZoom: zoom, cameraAnchor(w, h) { return anchor(w, h); } };
      const extraPlatform = { cameraZoom: zoom, cameraAnchor() {
        const p = anchor(width, height);
        return { x: p.x + margin, y: p.y + margin };
      }};
      const options = {
        getGame: () => game, chargePresentation: () => null,
        queuedChargePresentation: () => [], isPaused: () => false,
        Campaign, PrototypeVisuals, PrototypeCombatVisuals,
        PrototypeEnemyVfxArt, PrototypeSprites, PrototypeMaterials,
        now: () => 16000
      };
      const originalRenderer = PrototypeRenderer.create({
        ...options, canvas: { width, height }, ctx: originalCtx, platform
      });
      const floorOnly = hybridRendererClass.create({
        ...options, canvas: { width: floorCanvas.width, height: floorCanvas.height },
        ctx: floorCtx, platform: extraPlatform, diagnosticLayer: 'floor'
      });
      const foreground = hybridRendererClass.create({
        ...options, canvas: { width, height }, ctx: hybridCtx,
        platform, diagnosticLayer: 'overlay'
      });
      for (const renderer of [originalRenderer, floorOnly, foreground])
        renderer.setOptimizationMode(false);
      status.textContent = 'Warming the real game art, sprite animation and material textures…';
      await prepareAssets();

      const beforeFloor = now();
      floorOnly.draw();
      floorCtx.getImageData(0, 0, 1, 1);
      const floorPaintMs = now() - beforeFloor;
      const gpuFloor = createGPU(width, height, floorCanvas);
      // Full-frame GPU textures are display surfaces; they do NOT avoid the
      // original painting. Their upload and presentation costs are both timed.
      const gpuOriginal = createGPU(width, height, original);
      const gpuHybrid = createGPU(width, height, hybrid);
      $('gpuOriginal').replaceChildren(gpuOriginal.canvas);
      $('gpuHybrid').replaceChildren(gpuHybrid.canvas);
      const center = iso(originHero);
      const metrics = {
        canvas: [], fullGpu: [], hybrid: [], hybridGpu: [],
        gpuCopy: [], gpuDisplay: [], groundGpu: [],
        groundGpuToCanvas: [], foregroundCanvas: [],
        hybridUpload: [], hybridGpuDisplay: [], simulation: []
      };
      const parity = { canvasGpu: [], canvasHybrid: [], canvasHybridGpu: [] };
      let referenceMetrics = null, hybridMetrics = null;
      const rounds = 14;
      for (let frame = -4; frame < rounds; frame++) {
        const positionIndex = Math.max(0, frame);
        let simulatedMs = 0;
        if (simulation) {
          const t = now();
          game.tick(1 / 60, {
            x: Math.cos(positionIndex * 0.29) * 0.3,
            y: Math.sin(positionIndex * 0.29) * 0.3,
            speedFactor: 1
          });
          simulatedMs = now() - t;
        }
        const position = game.safe(
          originHero.x + Math.sin(positionIndex * 0.35) * 32,
          originHero.y + Math.cos(positionIndex * 0.29) * 24
        );
        Object.assign(game.hero, position);
        if (!simulation) {
          game.s.clock = baseClock + positionIndex * 0.03;
          game.s.time = game.s.clock;
        }
        PrototypeSprites.advance(16, false);
        const projected = iso(position);
        const cropX = margin + (projected.x - center.x) * zoom;
        const cropY = margin + (projected.y - center.y) * zoom;
        need(cropX >= 1 && cropY >= 1 &&
          cropX + width <= floorCanvas.width - 1 &&
          cropY + height <= floorCanvas.height - 1,
          'Camera exceeded the reusable ground atlas; no fake GPU improvement reported');

        const beforeCanvas = now();
        originalRenderer.draw();
        originalCtx.getImageData(0, 0, 1, 1);
        const canvasMs = now() - beforeCanvas;

        const copyMs = gpuOriginal.uploadFrame(original);
        const presentMs = gpuOriginal.present(0, 0);
        const fullGpuMs = canvasMs + copyMs + presentMs;

        const groundMs = gpuFloor.present(cropX, cropY);
        const beforeCompose = now();
        hybridCtx.setTransform(1, 0, 0, 1, 0, 0);
        hybridCtx.drawImage(gpuFloor.canvas, 0, 0);
        const gpuToCanvasMs = now() - beforeCompose;

        const beforeActors = now();
        foreground.draw();
        hybridCtx.getImageData(0, 0, 1, 1);
        const actorMs = now() - beforeActors;
        const hybridMs = groundMs + gpuToCanvasMs + actorMs;

        const secondUploadMs = gpuHybrid.uploadFrame(hybrid);
        const secondPresentMs = gpuHybrid.present(0, 0);
        const hybridGpuMs = hybridMs + secondUploadMs + secondPresentMs;

        if (frame === 0 || frame === Math.floor(rounds / 2) || frame === rounds - 1) {
          parity.canvasGpu.push(samePixels(originalCtx, gpuOriginal.canvas, width, height));
          parity.canvasHybrid.push(compareCanvases(originalCtx, hybridCtx, width, height));
          parity.canvasHybridGpu.push(samePixels(originalCtx, gpuHybrid.canvas, width, height));
          referenceMetrics = originalRenderer.metrics();
          hybridMetrics = foreground.metrics();
        }
        if (frame >= 0) {
          metrics.canvas.push(canvasMs);
          metrics.fullGpu.push(fullGpuMs);
          metrics.hybrid.push(hybridMs);
          metrics.hybridGpu.push(hybridGpuMs);
          metrics.gpuCopy.push(copyMs);
          metrics.gpuDisplay.push(presentMs);
          metrics.groundGpu.push(groundMs);
          metrics.groundGpuToCanvas.push(gpuToCanvasMs);
          metrics.foregroundCanvas.push(actorMs);
          metrics.hybridUpload.push(secondUploadMs);
          metrics.hybridGpuDisplay.push(secondPresentMs);
          metrics.simulation.push(simulatedMs);
        }
        if ((frame + 4) % 4 === 0) {
          status.textContent = 'Drawing real game frame ' + Math.max(0, frame + 1) +
            ' / ' + rounds + ' with four complete display pipelines…';
          await nextFrame();
        }
      }
      const minimumMatch = (tests) =>
        Math.min(...tests.map((test) => test.percentPixelsMatchingWithin6));
      const visualAgreement = {
        originalToFullFrameGpu: minimumMatch(parity.canvasGpu),
        originalToHybrid: minimumMatch(parity.canvasHybrid),
        originalToHybridGpu: minimumMatch(parity.canvasHybridGpu),
        checkedMovingFrames: [0, Math.floor(rounds / 2), rounds - 1],
        individualChecks: parity
      };
      const visuallyValid = visualAgreement.originalToFullFrameGpu >= 99.9 &&
        visualAgreement.originalToHybrid >= 99.5 &&
        visualAgreement.originalToHybridGpu >= 99.5;
      const report = {
        result: visuallyValid ? 'All complete scenes meet the visual-parity gates' :
          'Some methods differ visually; DO NOT rank those methods as production candidates',
        scope: 'Same REAL unmodified world renderer, original materials and sprites, roads, terrain, buildings, nighttime lamps, actors, shadow/occlusion, and available VFX in 4 complete output pipelines.',
        scene: region, lighting: night ? 'night / original lamps' : 'day',
        movement: simulation ? 'scripted hero path plus isolated Campaign.tick' : 'scripted camera and hero motion with sprite animation',
        viewport: [width, height], cameraZoom: zoom,
        measuredFrames: rounds, gpuBackend: gpuFloor.gpuName,
        renderedParts: { productionCanvasWorld: true, proceduralWorldArt: true,
          originalSprites: true, groundAndRoads: true,
          originalLighting: true, activeCombatVfxIfPresent: true, gameHudIncluded: false },
        visualAgreement,
        timesPerFrameMs: {
          fullOriginalCanvas: summary(metrics.canvas),
          originalCanvasThenWebgl: summary(metrics.fullGpu),
          gpuGroundPlusCanvasWorld: summary(metrics.hybrid),
          hybridThenWebglOutput: summary(metrics.hybridGpu),
          canvasPaintingInFullWebgl: summary(metrics.canvas),
          fullCanvasToGpuUpload: summary(metrics.gpuCopy),
          gpuFullFrameDisplay: summary(metrics.gpuDisplay),
          hybridGpuGroundDisplay: summary(metrics.groundGpu),
          hybridGpuToCanvas: summary(metrics.groundGpuToCanvas),
          hybridCanvasForegroundEffectsLights: summary(metrics.foregroundCanvas),
          hybridResultGpuUpload: summary(metrics.hybridUpload),
          hybridResultGpuDisplay: summary(metrics.hybridGpuDisplay),
          simulationSeparateFromRendering: summary(metrics.simulation)
        },
        preparation: {
          staticGroundPaintMs: +floorPaintMs.toFixed(2),
          staticGroundGpuUploadMs: +gpuFloor.preparationMs.toFixed(2),
          oneTimeFullFrameGpuAllocationsMs: +(gpuOriginal.preparationMs + gpuHybrid.preparationMs).toFixed(2),
          gpuTextureBytes: {
            ground: gpuFloor.textureBytes,
            originalFullFrame: gpuOriginal.textureBytes,
            hybridFullFrame: gpuHybrid.textureBytes
          }
        },
        rendererMetrics: {
          original: referenceMetrics, hybridDynamic: hybridMetrics,
          spriteStatus: PrototypeSprites.status(),
          materialsStatus: PrototypeMaterials.status()
        },
        nativeWebglIndependentWorld: {
          implemented: false, benchmarked: false, gpuNativeShareOfFullScene: 'Not measured',
          reason: 'All four full-scene pipelines currently depend on original Canvas-authored graphics. Real GPU-sprite composition is tested separately but does not independently render all the original world, dynamic procedural forms, animated silhouettes, depth occlusion, night-light blending, road and combat effects.'
        },
        warning: 'Do not confuse a GPU displaying real game art with a fully independent WebGL renderer. Original Canvas 2D painting remains responsible for most pixels. These 14 frames are moving-world render timing, not real gameplay FPS. Visual gates must pass before drawing speed conclusions.'
      };
      output.textContent = JSON.stringify(report, null, 2);
      window.AzerothRealWorldPipelineResult = visuallyValid ? report : null;
      status.textContent = report.result +
        '. See CPU painting, GPU transfer and whole-pipeline times; native full-WebGL is still unimplemented.';
    } catch (error) {
      status.textContent = 'Real-game comparison blocked: ' + error.message;
      output.textContent = String(error.stack || error);
      window.AzerothRealWorldPipelineResult = null;
    } finally {
      runButton.disabled = false;
    }
  }

  runButton.addEventListener('click', () => { void measure(); });
  status.textContent = 'Ready to compare four complete real-art world-rendering pipelines.';
})();