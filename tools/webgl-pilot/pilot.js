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
    const center = { x: 650, y: 730 };
    const focus = iso(center);
    const scale = 1.5;
    const objects = [], proceduralCandidates = [];
    let considered = 0, procedural = 0, offscreen = 0, seq = 0;
    const sets = [
      [z.props, 'prop'], [game.visibleNPCs(), 'npc'], [game.visibleResourceNodes(), 'node'],
      [z.buildings, 'building'], [z.enemies, 'enemy'],
      [game.activeLivingParty(), 'ally'], [[game.hero], 'hero'],
    ];
    const regionIndex = game.regionIndex();
    for (const [list, kind] of sets) {
      for (const source of list) {
        if (kind === 'enemy' && source.hp <= 0) continue;
        considered++;
        const e = { ...source, renderKind: kind };
        const found = PrototypeSprites.definitionFor(e, regionIndex, !!game.s.rescued[e.family]);
        const entry = found && manifest.sprites[found.key] ? found.entry : null;
        if (PrototypeVisuals.featureScale(e) > 1)
          e.visualScale = PrototypeVisuals.assetSafeScale(e, entry);
        const point = iso(e);
        const anchorX = Math.round(W / 2 + (point.x - focus.x) * scale);
        const anchorY = Math.round(H / 2 + (point.y - focus.y) * scale);
        if (!entry) {
          procedural++;
          // Include original procedural props and actors near the viewport.
          // The generous margin admits tall scenery crossing the screen edge.
          if (e.interactionOnly || (kind === 'npc' && e.kind === 'landmark' && e.id?.startsWith('bridge-')))
            continue;
          if (anchorX < -280 || anchorX > W + 280 || anchorY < -350 || anchorY > H + 300) {
            offscreen++;
            continue;
          }
          proceduralCandidates.push({
            procedural: true, entity: e, anchorX, anchorY, x: anchorX, y: anchorY,
            src: 'procedural:' + seq++, kind, sort: e.x + e.y, opacity: 1,
          });
          continue;
        }
        const factor = PrototypeSprites.entityScale(e, entry);
        const width = Math.round((Number(entry.displayWidth) || entry.width) * factor * scale);
        const height = Math.round((Number(entry.displayHeight) || entry.height) * factor * scale);
        const x = Math.round(anchorX - width * (entry.anchorX ?? 0.5));
        const y = Math.round(anchorY - height * (entry.anchorY ?? 0.88));
        if (x > W + 10 || x + width < -10 || y > H + 10 || y + height < -10) {
          offscreen++;
          continue;
        }
        objects.push({
          x, y, width, height, key: found.key, src: entry.src, kind,
          opacity: Number.isFinite(entry.opacity) ? entry.opacity : 1, sort: e.x + e.y,
        });
      }
    }
    // A bounded mixture of nearby original procedural objects. We report
    // any excluded objects rather than pretending this is the entire scene.
    const proceduralLimit = 72;
    proceduralCandidates.sort((a, b) =>
      Math.hypot(a.anchorX - W / 2, a.anchorY - H / 2) -
      Math.hypot(b.anchorX - W / 2, b.anchorY - H / 2));
    const selected = proceduralCandidates.slice(0, proceduralLimit);
    objects.push(...selected);
    objects.sort((a, b) => a.sort - b.sort);
    return {
      objects, considered, procedural, offscreen, region, regionIndex, scale,
      selectedProcedural: selected.length,
      proceduralOmittedByLimit: Math.max(0, proceduralCandidates.length - proceduralLimit),
      selectedKinds: selected.reduce((out, e) => {
        out[e.kind] = (out[e.kind] || 0) + 1; return out;
      }, {}),
    };
  }

  function bakeProcedural(scene, images) {
    const procedural = scene.objects.filter((o) => o.procedural);
    const begun = performance.now();
    const stage = document.createElement('canvas');
    stage.width = 1000;
    stage.height = 1000;
    const painter = checked(stage.getContext('2d', { willReadFrequently: true }),
      'Cannot render procedural artwork');
    const anchor = { x: 500, y: 700 };
    let pixelBytes = 0, empty = 0;
    for (const item of procedural) {
      painter.setTransform(1, 0, 0, 1, 0, 0);
      painter.clearRect(0, 0, stage.width, stage.height);
      painter.save();
      painter.scale(scene.scale, scene.scale);
      PrototypeVisuals.draw(painter, item.entity,
        { x: anchor.x / scene.scale, y: anchor.y / scene.scale },
        scene.regionIndex, false);
      painter.restore();
      const rgba = painter.getImageData(0, 0, stage.width, stage.height).data;
      let left = stage.width, top = stage.height, right = -1, bottom = -1;
      for (let i = 3; i < rgba.length; i += 4) {
        if (rgba[i] < 1) continue;
        const at = (i - 3) / 4, x = at % stage.width, y = Math.floor(at / stage.width);
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
      if (right < left) { empty++; item.x = item.anchorX; item.y = item.anchorY;
        item.width = item.height = 1; }
      else {
        left = Math.max(0, left - 1); top = Math.max(0, top - 1);
        right = Math.min(stage.width - 1, right + 1);
        bottom = Math.min(stage.height - 1, bottom + 1);
        item.x = item.anchorX + left - anchor.x;
        item.y = item.anchorY + top - anchor.y;
        item.width = right - left + 1;
        item.height = bottom - top + 1;
      }
      const image = document.createElement('canvas');
      image.width = item.width; image.height = item.height;
      checked(image.getContext('2d'), 'Procedural crop failed')
        .drawImage(stage, left === stage.width ? 0 : left,
          top === stage.height ? 0 : top, image.width, image.height,
          0, 0, image.width, image.height);
      images.set(item.src, image);
      pixelBytes += image.width * image.height * 4;
    }
    return {
      items: procedural.length, empty,
      preparationMs: Number((performance.now() - begun).toFixed(1)),
      croppedSourceBytes: pixelBytes,
      staticArtOnly: true,
    };
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
    checked(gl, 'WebGL2 unavailable on this browser; no GPU timing possible.');
    const begun = performance.now();
    // Real procedural images can require several atlases. Preserve depth
    // ordering by drawing contiguous runs, not re-sorting by texture.
    const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const size = maxSize >= 2048 ? 2048 : maxSize >= 1024 ? 1024 : 0;
    checked(size, 'GPU texture limit too small for original art');
    const pages = [];
    const makePage = () => {
      checked(pages.length < 8, 'Texture memory safety limit (8 pages) exceeded');
      const atlas = document.createElement('canvas');
      atlas.width = atlas.height = size;
      const painter = checked(atlas.getContext('2d'), 'Cannot create texture page');
      painter.imageSmoothingEnabled = false;
      pages.push({ atlas, painter });
    };
    makePage();
    const entries = new Map();
    let left = 2, top = 2, shelf = 0;
    for (const [src, img] of images) {
      const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      checked(iw + 4 < size && ih + 4 < size,
        'One original object is too large for the diagnostic atlas');
      if (left + iw + 2 >= size) { left = 2; top += shelf + 2; shelf = 0; }
      if (top + ih + 2 >= size) {
        makePage(); left = 2; top = 2; shelf = 0;
      }
      pages[pages.length - 1].painter.drawImage(img, left, top);
      entries.set(src, {
        page: pages.length - 1,
        u0: left / size, v0: top / size,
        u1: (left + iw) / size, v1: (top + ih) / size
      });
      shelf = Math.max(shelf, ih);
      left += iw + 2;
    }
    const vert = compile(gl, gl.VERTEX_SHADER,
      'attribute vec2 p; attribute vec2 uv; attribute float opacity; uniform vec2 screen; varying highp vec2 vUv; varying highp float vOpacity;' +
      'void main(){gl_Position=vec4(p.x/screen.x*2.0-1.0,1.0-p.y/screen.y*2.0,0.,1.);vUv=uv;vOpacity=opacity;}');
    const frag = compile(gl, gl.FRAGMENT_SHADER,
      'precision highp float; varying highp vec2 vUv; varying highp float vOpacity; uniform sampler2D atlas;' +
      'void main(){gl_FragColor=texture2D(atlas,vUv)*vOpacity;}');
    const program = checked(gl.createProgram(), 'Cannot create GPU program');
    gl.attachShader(program, vert); gl.attachShader(program, frag); gl.linkProgram(program);
    checked(gl.getProgramParameter(program, gl.LINK_STATUS), gl.getProgramInfoLog(program));
    gl.useProgram(program);
    gl.viewport(0, 0, W, H);
    gl.uniform2f(gl.getUniformLocation(program, 'screen'), W, H);
    gl.uniform1i(gl.getUniformLocation(program, 'atlas'), 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.activeTexture(gl.TEXTURE0);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    const textures = pages.map(({ atlas }) => {
      const texture = checked(gl.createTexture(), 'GPU texture allocation failed');
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
      return texture;
    });
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
    // Drop temporary CPU-side atlases after GPU upload.
    for (const page of pages) { page.atlas.width = 0; page.atlas.height = 0; }
    return {
      gl, entries, buffer, textures, backend,
      atlasPages: pages.length, atlasPixels: size * size * pages.length,
      atlasBytes: size * size * pages.length * 4,
      preparationMs: Number((performance.now() - begun).toFixed(1))
    };
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
    let total = 0, max = 0, colorDifference = 0;
    let foreground2d = 0, foregroundWebgl = 0, intersection = 0, union = 0;
    const pixels = a.length / 4;
    const mask2d = new Uint8Array(pixels);
    const maskWebgl = new Uint8Array(pixels);
    for (let index = 0; index < pixels; index++) {
      const i = index * 4;
      let cpuDistance = 0, gpuDistance = 0, rgbDifference = 0;
      for (let c = 0; c < 4; c++) {
        const delta = Math.abs(a[i + c] - b[i + c]);
        total += delta;
        if (delta > max) max = delta;
        if (c < 3) {
          const bg = [12, 25, 19][c];
          cpuDistance += Math.abs(a[i + c] - bg);
          gpuDistance += Math.abs(b[i + c] - bg);
          rgbDifference += delta;
        }
      }
      const cpu = cpuDistance > 25;
      const gpu = gpuDistance > 25;
      if (cpu) { foreground2d++; mask2d[index] = 1; }
      if (gpu) { foregroundWebgl++; maskWebgl[index] = 1; }
      if (cpu && gpu) intersection++;
      if (cpu || gpu) { union++; colorDifference += rgbDifference; }
    }
    // Canvas and WebGL can disagree on a sprite's edge by one physical pixel.
    // Compare occupancy within a 3x3 neighborhood in BOTH directions. This
    // detects missing bodies or substantial displacement without requiring
    // unrelated rasterizers to have bit-identical edge pixels.
    const near = (mask, index) => {
      const x = index % W, y = Math.floor(index / W);
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= H) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx >= 0 && xx < W && mask[yy * W + xx]) return true;
        }
      }
      return false;
    };
    let coveredCanvas = 0, coveredWebGL = 0;
    for (let index = 0; index < pixels; index++) {
      if (mask2d[index] && near(maskWebgl, index)) coveredCanvas++;
      if (maskWebgl[index] && near(mask2d, index)) coveredWebGL++;
    }
    return {
      meanChannelDifference: Number((total / a.length).toFixed(3)),
      maximumChannelDifference: max,
      meanForegroundChannelDifference: union ? Number((colorDifference / (union * 3)).toFixed(2)) : null,
      foregroundPixelsCanvas: foreground2d,
      foregroundPixelsWebGL: foregroundWebgl,
      foregroundOverlap: union ? Number((intersection / union).toFixed(3)) : 0,
      withinOnePixelCanvas: foreground2d ? Number((coveredCanvas / foreground2d).toFixed(3)) : 0,
      withinOnePixelWebGL: foregroundWebgl ? Number((coveredWebGL / foregroundWebgl).toFixed(3)) : 0,
    };
  }

  async function run() {
    runButton.disabled = true;
    status.textContent = 'Preparing current campaign objects and original art…';
    output.textContent = 'Running…';
    try {
      checked(typeof Campaign === 'function', 'Campaign scripts did not load');
      const response = await fetch('./assets/sprites/manifest.json');
      checked(response.ok, 'Cannot load original sprite catalog');
      const manifest = await response.json();
      checked(PrototypeSprites.installManifest(manifest), 'Sprite catalog rejected');
      const scene = sceneObjects(byId('scene').value, manifest);
      checked(scene.objects.length > 1, 'Nothing visible in this scene');
      const sources = [...new Set(scene.objects.filter((o) => !o.procedural).map((o) => o.src))];
      const beganDecode = performance.now();
      const pairs = await Promise.all(sources.map(async (src) => [src, await loadImage(src)]));
      checked(!pairs.some(([, image]) => !image), 'Original sprite image unavailable');
      const images = new Map(pairs);
      const decodeMs = Number((performance.now() - beganDecode).toFixed(1));
      status.textContent = 'Drawing procedural objects using the real game artist…';
      const baked = bakeProcedural(scene, images);
      status.textContent = 'Uploading original and procedural artwork to WebGL…';
      const gpu = gpuSetup(images);
      const drawCached = (step, flush = false) => {
        const ox = Math.round(Math.sin(step * 0.35) * 16);
        const oy = Math.round(Math.cos(step * 0.25) * 10);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#0c1913';
        ctx.fillRect(0, 0, W, H);
        ctx.imageSmoothingEnabled = false;
        for (const o of scene.objects) {
          ctx.globalAlpha = o.opacity;
          ctx.drawImage(images.get(o.src), o.x + ox, o.y + oy, o.width, o.height);
        }
        ctx.globalAlpha = 1;
        if (flush) ctx.getImageData(0, 0, 1, 1);
      };
      const drawOriginal = (step, flush = false) => {
        const ox = Math.round(Math.sin(step * 0.35) * 16);
        const oy = Math.round(Math.cos(step * 0.25) * 10);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#0c1913';
        ctx.fillRect(0, 0, W, H);
        ctx.imageSmoothingEnabled = false;
        for (const o of scene.objects) {
          if (!o.procedural) {
            ctx.globalAlpha = o.opacity;
            ctx.drawImage(images.get(o.src), o.x + ox, o.y + oy, o.width, o.height);
          } else {
            ctx.save();
            ctx.scale(scene.scale, scene.scale);
            PrototypeVisuals.draw(ctx, o.entity,
              { x: (o.anchorX + ox) / scene.scale, y: (o.anchorY + oy) / scene.scale },
              scene.regionIndex, false);
            ctx.restore();
          }
        }
        ctx.globalAlpha = 1;
        if (flush) ctx.getImageData(0, 0, 1, 1);
      };
      const drawGPU = (step, flush = false) => {
        const gl = gpu.gl;
        gl.clearColor(12 / 255, 25 / 255, 19 / 255, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindBuffer(gl.ARRAY_BUFFER, gpu.buffer);
        const mesh = packGeometry(scene.objects, gpu.entries, step);
        gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.DYNAMIC_DRAW);
        // Page batching never rearranges the game's back-to-front draw order.
        let from = 0;
        while (from < scene.objects.length) {
          const page = gpu.entries.get(scene.objects[from].src).page;
          let end = from + 1;
          while (end < scene.objects.length && gpu.entries.get(scene.objects[end].src).page === page) end++;
          gl.bindTexture(gl.TEXTURE_2D, gpu.textures[page]);
          gl.drawArrays(gl.TRIANGLES, from * 6, (end - from) * 6);
          from = end;
        }
        if (flush) gl.finish();
      };
      drawOriginal(0, true);
      const livePixels = new Uint8Array(ctx.getImageData(0, 0, W, H).data);
      drawCached(0, true);
      const cachedPixels = new Uint8Array(ctx.getImageData(0, 0, W, H).data);
      drawGPU(0, true);
      const bottomUp = new Uint8Array(W * H * 4);
      gpu.gl.readPixels(0, 0, W, H, gpu.gl.RGBA, gpu.gl.UNSIGNED_BYTE, bottomUp);
      const flipped = new Uint8Array(bottomUp.length);
      for (let row = 0; row < H; row++)
        flipped.set(bottomUp.subarray(row * W * 4, (row + 1) * W * 4),
          (H - row - 1) * W * 4);
      const visualDifference = comparePixels(cachedPixels, flipped);
      const cachedVsOriginal = comparePixels(livePixels, cachedPixels);
      const acceptable = (d) => {
        const coverage = d.foregroundPixelsCanvas
          ? d.foregroundPixelsWebGL / d.foregroundPixelsCanvas : 0;
        return coverage >= 0.95 && coverage <= 1.05
          && (d.foregroundOverlap >= 0.9 ||
            Math.min(d.withinOnePixelCanvas, d.withinOnePixelWebGL) >= 0.97)
          && d.meanForegroundChannelDifference <= 25;
      };
      if (!acceptable(visualDifference) || !acceptable(cachedVsOriginal)) {
        status.textContent = 'INVALID comparison — procedural artwork differs. Timings withheld.';
        output.textContent = JSON.stringify({
          message: 'All images must match visually before this experiment can claim a speed result.',
          cachedVsWebgl: visualDifference, originalVsCached: cachedVsOriginal,
          procedural: baked, includedProcedural: scene.selectedProcedural,
          gpuBackend: gpu.backend
        }, null, 2);
        window.AzerothGpuPilotResult = null;
        return;
      }
      status.textContent = 'Pictures aligned; measuring drawing methods…';
      for (let k = 0; k < 4; k++) { drawOriginal(k, true); drawCached(k, true); drawGPU(k, true); }
      const results = { originalCanvas: [], cachedCanvas: [], webgl: [] };
      const methods = { originalCanvas: drawOriginal, cachedCanvas: drawCached, webgl: drawGPU };
      for (let round = 0; round < 12; round++) {
        const order = round % 3 === 0 ? ['originalCanvas','cachedCanvas','webgl']
          : round % 3 === 1 ? ['webgl','originalCanvas','cachedCanvas']
          : ['cachedCanvas','webgl','originalCanvas'];
        for (const method of order) {
          const at = performance.now();
          methods[method](round, true);
          results[method].push(performance.now() - at);
        }
      }
      drawCached(0, true); drawGPU(0, true);
      const countSprites = scene.objects.filter((o) => !o.procedural).length;
      const report = {
        scope: 'Current game entity artwork: original procedural draws versus cached Canvas and WebGL texture composition. No floor, lighting, combat overlays or full-game FPS.',
        scene: scene.region, cameraZoom: scene.scale, viewport: [W, H],
        renderedSprites: countSprites, renderedProcedural: baked.items,
        totalObjectsDrawn: scene.objects.length,
        originalEntitiesConsidered: scene.considered,
        originalProceduralCount: scene.procedural,
        proceduralOmittedByLimit: scene.proceduralOmittedByLimit,
        proceduralVisibleKindCounts: scene.selectedKinds,
        outsideViewOrUnsupported: scene.offscreen,
        proceduralPreparationMs: baked.preparationMs,
        proceduralCroppedSourceBytes: baked.croppedSourceBytes,
        originalImages: sources.length, decodePreparationMs: decodeMs,
        gpuAtlasPreparationMs: gpu.preparationMs, gpuAtlasPages: gpu.atlasPages,
        gpuAtlasBytes: gpu.atlasBytes, gpuBackend: gpu.backend,
        visualDifference, originalVsCached: cachedVsOriginal,
        timePerFrameMs: {
          originalCanvas2d: samples(results.originalCanvas),
          cachedCanvas2d: samples(results.cachedCanvas),
          webgl2: samples(results.webgl)
        },
        warning: 'Original Canvas redraws procedural art per frame; cached Canvas and WebGL use static baked images. Preparation is reported separately and must be amortized. Animated actors, changing scenery, floor, roads, lights and effects are not included. Hardware comparisons are not whole-game FPS.'
      };
      window.AzerothGpuPilotResult = report;
      output.textContent = JSON.stringify(report, null, 2);
      status.textContent = 'Three-way comparison complete. Same static artwork, no game changes.';
    } catch (err) {
      status.textContent = 'Experiment blocked: ' + err.message;
      output.textContent = String(err.stack || err);
      window.AzerothGpuPilotResult = null;
    } finally {
      runButton.disabled = false;
    }
  }

  runButton.addEventListener('click', () => { void run(); });
})();