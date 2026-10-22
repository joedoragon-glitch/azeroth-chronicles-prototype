/* Isolated sprite-composition experiment only. No production renderer or lighting changes. */
(function () {
  'use strict';
  const byId = (id) => document.getElementById(id);
  const view2d = byId('canvas2d');
  const viewGL = byId('canvasgl');
  const output = byId('results');
  const status = byId('status');
  const runButton = byId('run');
  const W = view2d.width, H = view2d.height;
  const ctx = view2d.getContext('2d');
  const iso = (p) => ({ x: (p.x - p.y) * 0.76, y: (p.x + p.y) * 0.27 });
  const samples = (a) => {
    const sorted = a.slice().sort((x, y) => x - y);
    const at = (p) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
    return { medianMs: Number(at(0.5).toFixed(2)), p95Ms: Number(at(0.95).toFixed(2)),
      samples: sorted.map((x) => Number(x.toFixed(2))) };
  };
  const checked = (thing, label) => { if (!thing) throw Error(label); return thing; };

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = async () => {
        try { if (img.decode) await img.decode(); resolve(img); }
        catch (_) { resolve(img); }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function sceneObjects(region, manifest) {
    const game = new Campaign('normal', 'paladin', () => 0.7);
    if (region !== 'vale') checked(game.enter(region), 'Could not enter ' + region);
    const z = game.zone();
    const center = region === 'vale' ? { x: 650, y: 730 }
      : region === 'frontier' ? { x: 650, y: 730 } : { x: 650, y: 730 };
    const focus = iso(center);
    const scale = 1.5;  // Same isometric transform and authored sprite dimensions as the game.
    const objects = [];
    let considered = 0, procedural = 0, offscreen = 0;
    const sets = [
      [z.props, 'prop'], [game.visibleNPCs(), 'npc'], [game.visibleResourceNodes(), 'node'],
      [z.buildings, 'building'], [z.enemies, 'enemy'],
      [game.activeLivingParty(), 'ally'], [[game.hero], 'hero'],
    ];
    for (const [list, kind] of sets) {
      for (const source of list) {
        if (kind === 'enemy' && source.hp <= 0) continue;
        considered++;
        const e = { ...source, renderKind: kind };
        const found = PrototypeSprites.definitionFor(e, game.regionIndex(), !!game.s.rescued[e.family]);
        if (!found || !manifest.sprites[found.key]) { procedural++; continue; }
        const entry = found.entry;
        if ((PrototypeVisuals.featureScale?.(e) || 1) > 1)
          e.visualScale = PrototypeVisuals.assetSafeScale(e, entry);
        const spriteScale = PrototypeSprites.entityScale(e, entry);
        const width = Math.round((Number(entry.displayWidth) || entry.width) * spriteScale * scale);
        const height = Math.round((Number(entry.displayHeight) || entry.height) * spriteScale * scale);
        const p = iso(e);
        const x = Math.round(W / 2 + (p.x - focus.x) * scale - width * (entry.anchorX ?? 0.5));
        const y = Math.round(H / 2 + (p.y - focus.y) * scale - height * (entry.anchorY ?? 0.88));
        if (x > W + 10 || x + width < -10 || y > H + 10 || y + height < -10) {
          offscreen++;
          continue;
        }
        objects.push({ x, y, width, height, key: found.key, src: entry.src,
          opacity: Number.isFinite(entry.opacity) ? entry.opacity : 1,
          sort: e.x + e.y });
      }
    }
    objects.sort((a, b) => a.sort - b.sort);
    return { objects, considered, procedural, offscreen, region, scale };
  }

  function compile(gl, type, text) {
    const shader = checked(gl.createShader(type), 'Unable to create shader');
    gl.shaderSource(shader, text);
    gl.compileShader(shader);
    checked(gl.getShaderParameter(shader, gl.COMPILE_STATUS), gl.getShaderInfoLog(shader));
    return shader;
  }

  function gpuSetup(images) {
    const gl = viewGL.getContext('webgl2', {
      alpha: false, antialias: false, preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    checked(gl, 'WebGL2 is unavailable on this browser. No GPU comparison can be claimed.');
    const start = performance.now();
    const size = Math.min(4096, gl.getParameter(gl.MAX_TEXTURE_SIZE));
    const atlas = document.createElement('canvas');
    atlas.width = atlas.height = size;
    const painter = checked(atlas.getContext('2d'), 'Cannot create atlas');
    painter.imageSmoothingEnabled = false;
    const entries = new Map();
    let left = 2, top = 2, shelf = 0;
    for (const [src, img] of images) {
      const iw = img.naturalWidth, ih = img.naturalHeight;
      checked(iw + 4 < size && ih + 4 < size, 'Atlas source exceeds GPU texture size');
      if (left + iw + 2 >= size) { left = 2; top += shelf + 2; shelf = 0; }
      checked(top + ih + 2 < size, 'Too many source sprites for this test atlas');
      painter.drawImage(img, left, top);
      entries.set(src, { u0: left / size, v0: top / size,
        u1: (left + iw) / size, v1: (top + ih) / size });
      shelf = Math.max(shelf, ih);
      left += iw + 2;
    }
    const vert = compile(gl, gl.VERTEX_SHADER,
      'attribute vec2 p; attribute vec2 uv; attribute float opacity; uniform vec2 screen; varying vec2 vUv; varying float vOpacity;' +
      'void main(){gl_Position=vec4(p.x/screen.x*2.0-1.0,1.0-p.y/screen.y*2.0,0.,1.);vUv=uv;vOpacity=opacity;}');
    const frag = compile(gl, gl.FRAGMENT_SHADER,
      'precision mediump float; varying vec2 vUv; varying float vOpacity; uniform sampler2D atlas;' +
      'void main(){gl_FragColor=texture2D(atlas,vUv)*vOpacity;}');
    const program = checked(gl.createProgram(), 'Cannot create shader program');
    gl.attachShader(program, vert); gl.attachShader(program, frag); gl.linkProgram(program);
    checked(gl.getProgramParameter(program, gl.LINK_STATUS), gl.getProgramInfoLog(program));
    gl.useProgram(program);
    gl.viewport(0, 0, W, H);
    gl.uniform2f(gl.getUniformLocation(program, 'screen'), W, H);
    gl.uniform1i(gl.getUniformLocation(program, 'atlas'), 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const texture = checked(gl.createTexture(), 'Cannot allocate atlas texture');
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    const buffer = checked(gl.createBuffer(), 'Cannot create geometry buffer');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const stride = 5 * 4;
    for (const [name, count, offset] of [['p', 2, 0], ['uv', 2, 8], ['opacity', 1, 16]]) {
      const location = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, count, gl.FLOAT, false, stride, offset);
    }
    const renderer = gl.getExtension('WEBGL_debug_renderer_info');
    const backend = renderer ? gl.getParameter(renderer.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    gl.finish();
    return { gl, entries, buffer, backend, atlasPixels: size * size,
      atlasBytes: size * size * 4, preparationMs: Number((performance.now() - start).toFixed(2)) };
  }

  function packGeometry(objects, uvBySource, step) {
    const data = new Float32Array(objects.length * 30);
    let i = 0;
    const offsetX = Math.round(Math.sin(step * 0.35) * 16);
    const offsetY = Math.round(Math.cos(step * 0.25) * 10);
    const add = (x, y, u, v, opacity) => {
      data[i++] = x; data[i++] = y; data[i++] = u; data[i++] = v; data[i++] = opacity;
    };
    for (const item of objects) {
      const u = checked(uvBySource.get(item.src), 'Atlas sprite missing');
      const x = item.x + offsetX, y = item.y + offsetY;
      const X = x + item.width, Y = y + item.height, a = item.opacity;
      add(x,y,u.u0,u.v0,a); add(X,y,u.u1,u.v0,a); add(x,Y,u.u0,u.v1,a);
      add(x,Y,u.u0,u.v1,a); add(X,y,u.u1,u.v0,a); add(X,Y,u.u1,u.v1,a);
    }
    return data;
  }

  function comparePixels(a, b) {
    let total = 0, max = 0;
    const length = a.length;
    for (let i = 0; i < length; i++) {
      const delta = Math.abs(a[i] - b[i]);
      total += delta;
      if (delta > max) max = delta;
    }
    return { meanChannelDifference: Number((total / length).toFixed(3)),
      maximumChannelDifference: max };
  }

  async function run() {
    runButton.disabled = true;
    status.textContent = 'Preparing an isolated campaign scene and its original images…';
    output.textContent = 'Running…';
    let gpu = null;
    try {
      checked(typeof Campaign === 'function', 'Game engine scripts did not load');
      const manifest = await (await fetch('./assets/sprites/manifest.json')).json();
      checked(PrototypeSprites.installManifest(manifest), 'Sprite catalog rejected');
      const scene = sceneObjects(byId('scene').value, manifest);
      checked(scene.objects.length > 1, 'Not enough registered sprite objects in this camera view');
      const sources = [...new Set(scene.objects.map((o) => o.src))];
      const loadedAt = performance.now();
      const pairs = await Promise.all(sources.map(async (src) => [src, await loadImage(src)]));
      const failed = pairs.filter(([, img]) => !img).map(([src]) => src);
      checked(!failed.length, 'Some original images failed to load: ' + failed.join(', '));
      const images = new Map(pairs);
      const decodingMs = Number((performance.now() - loadedAt).toFixed(2));
      status.textContent = 'Preparing GPU texture and checking visuals…';
      gpu = gpuSetup(images);
      const draw2d = (step, forceReadback = false) => {
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#0c1913';
        ctx.fillRect(0, 0, W, H);
        ctx.imageSmoothingEnabled = false;
        const ox = Math.round(Math.sin(step * 0.35) * 16);
        const oy = Math.round(Math.cos(step * 0.25) * 10);
        for (const o of scene.objects) {
          ctx.globalAlpha = o.opacity;
          ctx.drawImage(images.get(o.src), o.x + ox, o.y + oy, o.width, o.height);
        }
        ctx.globalAlpha = 1;
        if (forceReadback) ctx.getImageData(0, 0, 1, 1);
      };
      const drawGPU = (step, forceWait = false) => {
        const gl = gpu.gl;
        gl.clearColor(12 / 255, 25 / 255, 19 / 255, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindBuffer(gl.ARRAY_BUFFER, gpu.buffer);
        const mesh = packGeometry(scene.objects, gpu.entries, step);
        gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, mesh.length / 5);
        if (forceWait) gl.finish();
      };
      draw2d(0, true); drawGPU(0, true);
      const cpuPixels = ctx.getImageData(0, 0, W, H).data;
      const bottomUp = new Uint8Array(W * H * 4);
      gpu.gl.readPixels(0, 0, W, H, gpu.gl.RGBA, gpu.gl.UNSIGNED_BYTE, bottomUp);
      const flipped = new Uint8Array(bottomUp.length);
      for (let row = 0; row < H; row++)
        flipped.set(bottomUp.subarray(row * W * 4, (row + 1) * W * 4), (H - row - 1) * W * 4);
      const equality = comparePixels(cpuPixels, flipped);
      status.textContent = 'Measuring repeated frames…';
      for (let k = 0; k < 6; k++) { draw2d(k,true); drawGPU(k,true); }
      const results = { canvas: [], webgl: [] };
      for (let round = 0; round < 14; round++) {
        const order = round % 2 ? ['webgl', 'canvas'] : ['canvas', 'webgl'];
        for (const method of order) {
          const at = performance.now();
          if (method === 'canvas') draw2d(round, true);
          else drawGPU(round, true);
          results[method].push(performance.now() - at);
        }
      }
      const report = {
        scope: 'Sprite composition only; not a full frame, not real gameplay FPS; same live manifest and campaign geometry',
        scene: scene.region, cameraZoom: scene.scale,
        viewport: [W, H], renderedSprites: scene.objects.length,
        originalEntitiesConsidered: scene.considered,
        proceduralOrUnregisteredExcludedFromBoth: scene.procedural,
        registeredOutsideViewport: scene.offscreen,
        uniqueOriginalImages: images.size,
        decodePreparationMs: decodingMs,
        gpuAtlasPreparationMs: gpu.preparationMs,
        gpuAtlasBytes: gpu.atlasBytes, gpuBackend: gpu.backend,
        visualDifference: equality,
        timePerFrameMs: { canvas2d: samples(results.canvas), webgl2: samples(results.webgl) },
        warning: 'Forced sync (Canvas 1x1 readback; WebGL gl.finish) in local browser. GPU and Canvas submit different batches. Results depend on hardware. Pixel differences require manual review. Do not extrapolate to whole-game FPS.'
      };
      window.AzerothGpuPilotResult = report;
      output.textContent = JSON.stringify(report, null, 2);
      status.textContent = 'Done. Compare both pictures and check the measurements; nothing was changed in the game.';
    } catch (err) {
      status.textContent = 'Benchmark blocked: ' + err.message;
      output.textContent = String(err.stack || err);
    } finally {
      runButton.disabled = false;
    }
  }

  runButton.addEventListener('click', () => { void run(); });
})();