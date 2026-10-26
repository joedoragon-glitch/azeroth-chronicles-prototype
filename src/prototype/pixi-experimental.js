/* Experimental PixiJS presentation for the LIVE Campaign.
 * The normal Canvas renderer owns input projection and critical 2D cue overlays.
 * Do not label this a complete or faster WebGL implementation before review.
 */
(function (root) {
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
        script.onload = () =>
          root.PIXI?.Application ? resolve(root.PIXI) : reject(Error('PixiJS did not initialize'));
        script.onerror = () =>
          reject(Error('Local PixiJS runtime unavailable; Canvas remains active'));
        document.head.append(script);
      }).catch((error) => {
        libraryRequest = null;
        throw error;
      });
    }
    return libraryRequest;
  }
  function candidates(game, project, width, height, presentEntity, margin = 270) {
    const zone = game.zone();
    const result = [],
      used = new Map();
    function add(entities, kind) {
      for (const entity of entities || []) {
        if (kind === 'enemy' && entity.hp <= 0) continue;
        const point = project(entity);
        if (point.x < -margin || point.x > width + margin ||
            point.y < -margin || point.y > height + margin)
          continue;
        const identity =
          entity.id == null
            ? String(entity.name || entity.structure || 'object') + ':' + entity.x + ':' + entity.y
            : String(entity.id);
        const stem = kind + ':' + identity;
        const count = used.get(stem) || 0;
        used.set(stem, count + 1);
        const visual = presentEntity(entity, kind);
        result.push({ entity, visual, kind, point, key: count ? stem + '#' + count : stem });
      }
    }
    add(zone.props, 'prop');
    // Same permanent civic features included by the Canvas depth sorter.
    if (!game.isDungeon() && !game.supplyRoom?.(game.zoneId) &&
        !game.sideDungeon?.(game.zoneId))
      add((root.Campaign?.rules?.terrain?.[game.regionIndex()] || [])
        .filter((p) => ['fountain', 'grain-silo', 'orrery'].includes(p.kind))
        .map((p) => ({
          id: p.kind === 'orrery' ? 'crown-orrery'
            : p.kind === 'grain-silo' ? 'frontier-grain-silo' : 'frontier-civic-fountain',
          x: p.x, y: p.y, r: p.r,
          structure: p.kind === 'orrery' ? 'crown-orrery'
            : p.kind === 'grain-silo' ? 'frontier-grain-silo' : 'frontier-civic-fountain',
          decorative: true,
        })), 'prop');
    add(game.visibleNPCs(), 'npc');
    add(game.visibleResourceNodes(), 'node');
    add(zone.buildings, 'building');
    add(zone.enemies, 'enemy');
    add(game.activeLivingParty(), 'ally');
    add([game.hero], 'hero');
    if (zone.escort) add([{ ...zone.escort, icon: '🧑‍🌾', name: 'Supply escort' }], 'ally');
    return result.sort((a, b) => a.entity.x + a.entity.y - (b.entity.x + b.entity.y));
  }
  function bake(visual, game, density = 1) {
    // The procedural artist draws vectors. Bake at the same final display
    // density as Canvas (camera zoom × backing ratio), not a 1x bitmap.
    const width = Math.round(576 * density),
      work = makeCanvas(width, width),
      c = work.getContext('2d');
    requireValue(c, 'Original procedural artist is unavailable');
    c.setTransform(density, 0, 0, density, 0, 0);
    const center = { x: 288, y: 460 };
    root.PrototypeVisuals.draw(
      c,
      visual,
      center,
      game.regionIndex(),
      !!game.s.rescued[visual.family],
    );
    const { data } = c.getImageData(0, 0, work.width, work.height);
    let left = width,
      top = width,
      right = -1,
      bottom = -1;
    for (let y = 0; y < width; y++)
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 0) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    if (right < left || bottom < top) return null;
    left = Math.max(0, left - 2);
    top = Math.max(0, top - 2);
    right = Math.min(width - 1, right + 2);
    bottom = Math.min(width - 1, bottom + 2);
    const image = makeCanvas(right - left + 1, bottom - top + 1);
    image
      .getContext('2d')
      .drawImage(work, left, top, image.width, image.height, 0, 0, image.width, image.height);
    return {
      image,
      dx: left / density - center.x,
      dy: top / density - center.y,
      logicalWidth: image.width / density,
      logicalHeight: image.height / density,
    };
  }
  function create(options) {
    const { worldCanvas, viewport, platform, getGame, canvasRenderer, getRendererOptions } =
      options;
    let app = null,
      scene = null,
      adapter = null,
      backgroundRenderer = null,
      backdrop = null,
      backing = null,
      basePosition = null,
      baseZone = null,
      baseZoom = null,
      baseOptimization = null,
      backingRatio = 1,
      bakedZoom = null,
      active = false,
      lastError = null,
      lastFailure = null;
    const baked = new Map(),
      loaded = new Set();
    // The old 64 MiB image budget preceded the procedural art expansion.
    // Use 256 MiB as a strict image-data ceiling, with earlier LRU trimming
    // to leave memory headroom for the original sprite, ground and audio caches.
    const proceduralBudget = Number.isSafeInteger(options.proceduralTextureBudgetBytes)
      ? Math.max(1, options.proceduralTextureBudgetBytes)
      : 256 * 1024 * 1024;
    const trimAt = Math.floor(proceduralBudget * 0.625);
    const trimTo = Math.floor(proceduralBudget * 0.5);
    let imageBytes = 0,
      disposed = false,
      baseGame = null,
      bakeZone = null,
      actorFrameNumber = 0,
      contextEpoch = 0,
      proceduralEvictions = 0,
      proceduralCacheEvictions = 0,
      neighborhoodPrepared = 0,
      neighborhoodWarmupMs = 0;
    function noteFailure(type, stage, error) {
      const message = String(error?.message || error).slice(0, 240);
      lastError = message;
      // Capture counts BEFORE Canvas fallback disposes the GPU scene.
      lastFailure = Object.freeze({
        type, stage, message, timestampMs: Date.now(),
        resources: {
          loadedTextures: loaded.size,
          proceduralTextures: baked.size,
          proceduralBytes: imageBytes,
        },
      });
      return lastFailure;
    }
    function project(entity) {
      return canvasRenderer.screen(entity);
    }
    function effectiveRatio() {
      // Use the same device-specific backing-pixel density as Canvas.
      return worldCanvas.width / Math.max(1, viewport.width);
    }
    function createBackgroundPainter() {
      const width = viewport.width + BG_MARGIN * 2,
        height = viewport.height + BG_MARGIN * 2;
      backdrop = makeCanvas(Math.round(width * backingRatio), Math.round(height * backingRatio));
      const bgContext = requireValue(backdrop.getContext('2d'), 'Background canvas unsupported');
      // Keep the same logical camera coordinates while rasterizing more sharply.
      bgContext.setTransform(backingRatio, 0, 0, backingRatio, 0, 0);
      const bgViewport = { width, height };
      const bgPlatform = {
        get cameraZoom() {
          return platform.cameraZoom;
        },
        cameraAnchor() {
          const a = platform.cameraAnchor(viewport.width, viewport.height);
          return { x: a.x + BG_MARGIN, y: a.y + BG_MARGIN };
        },
      };
      backgroundRenderer = root.PrototypeRenderer.create({
        ...getRendererOptions(),
        canvas: bgViewport,
        ctx: bgContext,
        platform: bgPlatform,
        renderLayer: 'background',
      });
      basePosition = null;
    }
    function syncResolution() {
      const next = effectiveRatio();
      if (Math.abs(next - backingRatio) < 0.001) return;
      // Change resolution without falling back or changing the camera zoom.
      app.renderer.resize(viewport.width, viewport.height, next);
      backingRatio = next;
      const previous = backing;
      backing = null;
      createBackgroundPainter();
      drawBackground();
      previous?.destroy?.(false);
      // Stale procedural images were rasterized for the previous density.
      clearBakes(true);
    }
    // Confirmed mobile WebGL must survive normal iOS viewport changes after
    // switching apps. Rebuild viewport-sized scene layers in the SAME GPU
    // context; Canvas remains available if any resize or render step fails.
    function syncViewport() {
      if (app.screen.width === viewport.width && app.screen.height === viewport.height) return;
      requireValue(viewport.width > 0 && viewport.height > 0, 'Invalid PixiJS viewport');
      // Validate cached approved textures before touching the existing scene.
      const originals = [...loaded].map((src) => {
        const texture = root.PIXI.Assets.get(src);
        requireValue(texture?.source, 'Approved artwork unavailable after resize: ' + src);
        return [src, texture];
      });
      // Retired procedural textures must never remain referenced by sprites.
      clearBakes(true);
      scene.destroy();
      scene = null;
      const previous = backing;
      backing = null;
      previous?.destroy?.(false);
      const ratio = effectiveRatio();
      app.renderer.resize(viewport.width, viewport.height, ratio);
      backingRatio = ratio;
      scene = root.AzerothPixiSceneBridge.create({
        PIXI: root.PIXI, app, width: viewport.width, height: viewport.height,
      });
      for (const [src, texture] of originals) scene.registerTexture(src, texture);
      createBackgroundPainter();
      bakedZoom = null;
      drawBackground();
    }
    function game() {
      return getGame();
    }
    function clearBakes(keepLoaded = false) {
      // Remove actor references before destroying their GPU source textures.
      if (scene && baked.size) {
        scene.syncActors([]);
        for (const body of baked.values()) scene.unregisterTexture(body.id);
      }
      proceduralEvictions += baked.size;
      for (const body of baked.values()) body.texture.destroy?.(true);
      baked.clear();
      imageBytes = 0;
      bakeZone = null;
      if (!keepLoaded) loaded.clear();
    }
    function revisionFor(entity, visual, key, current, zoom) {
      return (
        backingRatio + ':' + zoom + ':' + key + ':' + current.zoneId + ':' +
        !!current.s.rescued[entity.family] + ':' + (entity.form || '') + ':' +
        (entity.presentation || '') + ':' + !!visual.crowned
      );
    }
    function evictUnused(protectedRevisions, bytesNeeded) {
      if (bytesNeeded <= 0) return 0;
      // Caller must have already synchronized the actor scene (or cleared
      // its sprites): retired textures cannot be referenced by live actors.
      const eligible = [...baked.entries()]
        .filter(([revision]) => !protectedRevisions.has(revision))
        .sort((a, b) => a[1].lastUsedFrame - b[1].lastUsedFrame);
      let freed = 0;
      for (const [revision, body] of eligible) {
        if (freed >= bytesNeeded) break;
        scene.unregisterTexture(body.id);
        body.texture.destroy?.(true);
        baked.delete(revision);
        imageBytes -= body.bytes;
        freed += body.bytes;
        proceduralEvictions++;
        proceduralCacheEvictions++;
      }
      return freed;
    }
    function drawBackground() {
      const current = game(),
        zoom = platform.cameraZoom || 1;
      if (!backgroundRenderer || !backdrop || !scene)
        throw Error('Missing original terrain painter');
      baseGame = current;
      basePosition = { x: current.hero.x, y: current.hero.y };
      baseZone = current.zoneId;
      baseZoom = zoom;
      baseOptimization = !!options.getOptimizationMode();
      backgroundRenderer.setOptimizationMode(baseOptimization);
      backgroundRenderer.draw();
      if (backing) {
        backing.source.update?.();
        scene.setBackground(backing, -BG_MARGIN, -BG_MARGIN, viewport.width + BG_MARGIN * 2,
          viewport.height + BG_MARGIN * 2);
      } else {
        backing = root.PIXI.Texture.from(backdrop);
        backing.source.scaleMode = 'nearest';
        scene.setBackground(backing, -BG_MARGIN, -BG_MARGIN, viewport.width + BG_MARGIN * 2,
          viewport.height + BG_MARGIN * 2);
      }
    }
    function syncBackground() {
      const current = game(),
        zoom = platform.cameraZoom || 1;
      if (baseGame && baseGame !== current)
        throw Error('Campaign changed; reset to Canvas before switching again');
      // A presentation-quality transition must invalidate the retained
      // background even when the hero has not moved or changed zoom.
      if (!basePosition || baseZone !== current.zoneId || baseZoom !== zoom ||
          baseOptimization !== !!options.getOptimizationMode()) drawBackground();
      const d = iso({ x: current.hero.x - basePosition.x, y: current.hero.y - basePosition.y });
      let dx = -d.x * zoom,
        dy = -d.y * zoom;
      if (Math.abs(dx) > BG_MARGIN * 0.6 || Math.abs(dy) > BG_MARGIN * 0.6) {
        drawBackground();
        dx = 0;
        dy = 0;
      }
      scene.moveBackground(-BG_MARGIN + dx, -BG_MARGIN + dy);
    }
    function paintedVisual(visual) {
      return visual.kind === 'archive-record'
        ? { ...visual, renderKind: 'prop', structure: 'scroll-stack',
            decorative: true, sceneRole: 'dry-stacks' }
        : visual.kind === 'keeper'
          ? { ...visual, renderKind: 'enemy', type: 'boss', family: 'archive', form: 'normal' }
          : visual;
    }
    // First-time procedural art is drawn on a temporary 2D bitmap before
    // being usable as a Pixi texture. A bounded prewarm cannot evict current
    // onscreen sprites; only the live actor pass may trim scene resources.
    function ensureProcedural(painted, revision, current, zoom,
                              protectedRevisions = null, detach = null) {
      if (baked.has(revision)) return baked.get(revision);
      const body = bake(painted, current, backingRatio * zoom);
      if (!body) return null;
      const bytes = body.image.width * body.image.height * 4;
      if (imageBytes + bytes > proceduralBudget && detach) {
        detach();
        evictUnused(protectedRevisions, imageBytes + bytes - trimTo);
      }
      if (imageBytes + bytes > proceduralBudget) {
        if (!detach) return null;
        throw Error('Visible procedural artwork exceeds Pixi image budget');
      }
      const id = 'pixi-procedural:' + revision;
      const texture = root.PIXI.Texture.from(body.image);
      texture.source.scaleMode = 'nearest';
      scene.registerTexture(id, texture);
      imageBytes += bytes;
      baked.set(revision, { ...body, id, bytes, texture, lastUsedFrame: actorFrameNumber });
      return baked.get(revision);
    }
    // On switching to Pixi, the existing live view is loaded first. Then,
    // prepare a limited fringe just beyond the camera so a quick step from
    // Millhaven toward its goblins doesn't require every first bake in combat.
    // Yield between batches while the full game simulation is held still by
    // the renderer preparation guard; never run this as an unbounded emitter.
    async function warmNeighborhood(epoch) {
      const started = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const current = game(), zoom = platform.cameraZoom || 1;
      const width = viewport.width, height = viewport.height;
      const fringe = candidates(current, project, width, height,
        canvasRenderer.presentEntity, 650)
        .filter(({entity,point}) =>
          !entity.interactionOnly &&
          !(entity.kind === 'landmark' && String(entity.id || '').startsWith('bridge-')) &&
          (point.x < -270 || point.x > width + 270 ||
            point.y < -270 || point.y > height + 270))
        .sort((a,b) => {
          const distance = (p) => Math.hypot(
            Math.max(0,-p.x,p.x-width),Math.max(0,-p.y,p.y-height));
          return distance(a.point)-distance(b.point);
        });
      let prepared = 0,steps=0;
      for(const {entity,visual,point,key} of fringe) {
        if(epoch!==contextEpoch || !scene || !app || game()!==current ||
           platform.cameraZoom!==zoom) return false;
        const elapsed=(typeof performance !== 'undefined' ? performance.now() : Date.now())-started;
        if(prepared>=18 || elapsed>600 || imageBytes>=trimAt) break;
        const painted=paintedVisual(visual);
        const chosen=adapter.commandFor(painted,
          {x:point.x/zoom,y:point.y/zoom},
          {region:current.regionIndex(),rescued:!!current.s.rescued[entity.family]});
        if(chosen.supported)continue; // Canonical sprites already preloaded.
        if(chosen.reason!=='original-game-procedural-art')continue;
        const revision=revisionFor(entity,visual,key,current,zoom);
        if(baked.has(revision))continue;
        // The warm-up never evicts current-frame art to make room.
        const cached=ensureProcedural(painted,revision,current,zoom);
        if(!cached)continue;
        prepared++;
        if(++steps%2===0 && typeof requestAnimationFrame==='function')
          await new Promise(resolve=>requestAnimationFrame(resolve));
      }
      neighborhoodPrepared += prepared;
      neighborhoodWarmupMs +=
        (typeof performance !== 'undefined' ? performance.now() : Date.now())-started;
      return epoch===contextEpoch;
    }
    function actorFrame() {
      const current = game(),
        zoom = platform.cameraZoom || 1;
      if (bakedZoom !== zoom || (bakeZone !== null && bakeZone !== current.zoneId)) {
        clearBakes(true);
        bakedZoom = zoom;
      }
      bakeZone = current.zoneId;
      actorFrameNumber++;
      const visible = candidates(
        current,
        project,
        viewport.width,
        viewport.height,
        canvasRenderer.presentEntity,
      ).filter(({ entity }) =>
        !entity.interactionOnly &&
        !(entity.kind === 'landmark' && String(entity.id || '').startsWith('bridge-')),
      );
      // Protect ALL current-frame identities, including entries encountered
      // later in the loop, from accidental eviction during a capacity trim.
      const protectedRevisions = new Set(
        visible.map(({ entity, visual, key }) =>
          revisionFor(entity, visual, key, current, zoom),
        ),
      );
      const records = [];
      let detachedForEviction = false;
      for (const { entity, visual, point, key } of visible) {
        // The approved Canvas feet treatment is independent of sprite art.
        // Pixi draws it below each body at the same depth in world space.
        const ground = {
          x: point.x, y: point.y,
          scale: zoom,
          ...canvasRenderer.groundPresentation(visual),
        };
        // Canvas repaints these identities as their actual in-world objects.
        const painted = paintedVisual(visual);
        const chosen = adapter.commandFor(
          painted,
          { x: point.x / zoom, y: point.y / zoom },
          { region: current.regionIndex(), rescued: !!current.s.rescued[entity.family] },
        );
        if (chosen.supported) {
          if (!scene.hasTexture(chosen.texture.src))
            throw Error('New sprite needs Pixi preload: ' + chosen.texture.src);
          const c = chosen.command;
          records.push({
            key,
            textureId: chosen.texture.src,
            sourceRect: c.sourceRect,
            x: c.x * zoom,
            y: c.y * zoom,
            width: c.width * zoom,
            height: c.height * zoom,
            opacity: c.opacity,
            flipX: c.flipX,
            ground,
            depth: entity.x + entity.y,
          });
        } else if (chosen.reason === 'original-game-procedural-art') {
          const revision = revisionFor(entity, visual, key, current, zoom);
          const b = ensureProcedural(painted, revision, current, zoom,
            protectedRevisions, () => {
              // Old actors must release retired textures before a budget trim.
              if (!detachedForEviction) {
                scene.syncActors([]);
                detachedForEviction = true;
              }
            });
          if (!b) {
            if (entity.renderKind === 'landmark' || entity.kind === 'landmark') continue;
            throw Error('Unrendered procedural entity: ' + key);
          }
          b.lastUsedFrame = actorFrameNumber;
          records.push({
            key,
            textureId: b.id,
            x: point.x + b.dx * zoom,
            y: point.y + b.dy * zoom,
            width: b.logicalWidth * zoom,
            height: b.logicalHeight * zoom,
            opacity: 1,
            flipX: false,
            ground,
            depth: entity.x + entity.y,
          });
        } else throw Error('Missing original game artwork: ' + key);
      }
      scene.syncActors(records);
      // At this point all offscreen sprites have been removed; trim their
      // original GPU sources only when above the soft watermark. This keeps
      // a short return path warm, but bounds long walks through large towns.
      if (imageBytes > trimAt)
        evictUnused(protectedRevisions, imageBytes - trimTo);
    }
    function syncAtmosphere() {
      const current = game(),
        region = current.regionIndex(),
        z = current.zone();
      const zoom = platform.cameraZoom || 1;
      const phase = current.daylightPhase?.() || {};
      const darkness =
        current.isDungeon() || current.supplyRoom()
          ? current.night()
            ? 1
            : 0
          : (phase.darkness ?? (current.night() ? 1 : 0));
      const lights = [];
      if (darkness > 0) {
        for (const p of z.props) {
          const kind = root.PrototypeRenderer.nightLightKind(String(p.structure || ''));
          if (kind) lights.push({ ...project(p), kind, id: p.id });
        }
        for (const b of z.buildings)
          if (b.progress >= 4) lights.push({ ...project(b), kind: 'window', id: b.id });
        for (const n of current.visibleNPCs())
          if (
            [
              'rest',
              'supplier',
              'recruiter',
              'quests',
              'fountain',
              'transport',
              'smith',
              'teacher',
              'alchemist',
            ].includes(n.kind) &&
            !n.interactionOnly
          )
            lights.push({ ...project(n), kind: 'lantern', id: n.id });
      }
      const local = lights
        .filter(
          (p) =>
            p.x > -140 * zoom &&
            p.x < viewport.width + 140 * zoom &&
            p.y > -160 * zoom &&
            p.y < viewport.height + 140 * zoom,
        )
        .sort(
          (a, b) =>
            (a.x - viewport.width / 2) ** 2 +
            (a.y - viewport.height / 2) ** 2 -
            ((b.x - viewport.width / 2) ** 2 + (b.y - viewport.height / 2) ** 2),
        )
        .slice(0, 36)
        .map((p) => ({ ...p, x: p.x / zoom, y: p.y / zoom }));
      const hero = project(current.hero);
      const lamps = root.AzerothNativeWebGLCore.lampGlowCommands(local, region, {
        darkness,
        hero: { x: hero.x / zoom, y: hero.y / zoom },
      }).map((p) => ({ ...p, x: p.x * zoom, y: p.y * zoom, radius: p.radius * zoom }));
      scene.syncLamps(lamps);
      scene.setAtmosphere({
        region,
        darkness,
        peaceBlend: current.peace
          ? phase.phase === 'victory-sunrise'
            ? phase.progress || 0
            : 1
          : 0,
        optimized: !!options.getOptimizationMode(),
        warmth: phase.warmth || 0,
        phase: phase.phase || 'day',
      });
      // Canvas's atmospheric motes use logical world-viewport dimensions,
      // then get enlarged by the current camera zoom on the final surface.
      // They continue drifting even when the player/camera is stationary.
      const zoomedWidth = viewport.width / zoom,
        zoomedHeight = viewport.height / zoom;
      const motes = root.PrototypeVisuals.atmosphereMotes({
        width: zoomedWidth, height: zoomedHeight, region, darkness,
        dungeon: !!current.isDungeon(), room: !!current.supplyRoom(),
        optimized: !!options.getOptimizationMode(),
        time: (typeof performance !== 'undefined' ? performance.now() : 0) / 1000,
      });
      scene.syncMotes(motes, zoom);
      scene.setVignette({ darkness, optimized: !!options.getOptimizationMode() });
    }
    async function prepare() {
      if (disposed) throw Error('Experimental renderer disposed');
      // A previous WebGL context can dispatch an asynchronous contextlost
      // event after its Canvas fallback. Once a new attempt begins, signals
      // from the old context must not take down the new confirmed session.
      // A second opt-in trial must release the previous GPU context and scene.
      if (app) disposeResources();
      const thisEpoch = ++contextEpoch;
      let stage = 'library-load';
      try {
        const PIXI = await loadPixi();
        stage = 'application-init';
        requireValue(
          root.AzerothPixiSceneBridge &&
            root.AzerothGpuSpriteAdapter &&
            root.AzerothNativeWebGLCore,
          'PixiJS scene modules not loaded',
        );
        app = new PIXI.Application();
        await app.init({
          width: viewport.width,
          height: viewport.height,
          preference: ['webgl'],
          preferWebGLVersion: 2,
          resolution: effectiveRatio(),
          autoDensity: true,
          autoStart: false,
          antialias: false,
          background: 0x0c1913,
        });
        stage = 'webgl2-context';
        requireValue(app.canvas.getContext('webgl2'), 'WebGL2 context not available');
        app.canvas.id = 'world-pixi-experimental';
        app.canvas.setAttribute('aria-hidden', 'true');
        app.canvas.style.cssText =
          'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;display:none';
        worldCanvas.parentNode.insertBefore(app.canvas, worldCanvas);
        app.canvas.addEventListener('webglcontextlost', (event) => {
          event.preventDefault();
          if (thisEpoch !== contextEpoch) return;
          active = false;
          options.onFailure(noteFailure('context-loss', 'webglcontextlost', 'WebGL context lost'));
        });
        stage = 'scene-setup';
        scene = root.AzerothPixiSceneBridge.create({
          PIXI,
          app,
          width: viewport.width,
          height: viewport.height,
        });
        adapter = root.AzerothGpuSpriteAdapter.create({
          sprites: root.PrototypeSprites,
          gpuCore: root.AzerothNativeWebGLCore,
          clock: () => root.PrototypeSprites.timeMs(),
          isReducedMotion: () =>
            root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false,
        });
        backingRatio = effectiveRatio();
        createBackgroundPainter();
        // Warm all canonical sprites once (~46 MiB decoded across 38 files).
        // Otherwise entering any previously unseen neighborhood forces fallback.
        stage = 'sprite-manifest';
        const response = await fetch('./assets/sprites/manifest.json');
        requireValue(response.ok, 'Original sprite manifest unavailable');
        const manifest = await response.json(),
          urls = new Set();
        function collect(value) {
          if (!value || typeof value !== 'object') return;
          if (
            typeof value.src === 'string' &&
            value.src.startsWith('./assets/sprites/') &&
            /\.(?:png|webp)$/i.test(value.src)
          )
            urls.add(value.src);
          for (const child of Object.values(value))
            if (typeof child === 'object')
              Array.isArray(child) ? child.forEach(collect) : collect(child);
        }
        collect(manifest.sprites);
        requireValue(urls.size > 0, 'Approved sprite manifest is empty');
        requireValue(urls.size <= 128, 'Unexpected sprite resource count');
        stage = 'sprite-preload';
        await Promise.all(
          [...urls].map(async (src) => {
            const texture = await PIXI.Assets.load(src);
            requireValue(texture?.source, 'Approved sprite decode failed: ' + src);
            texture.source.scaleMode = 'nearest';
            scene.registerTexture(src, texture);
            loaded.add(src);
          }),
        );
        stage = 'first-scene';
        drawBackground();
        actorFrame();
        syncAtmosphere();
        scene.draw();
        stage = 'nearby-art-preparation';
        if(!await warmNeighborhood(thisEpoch))return false;
        if(thisEpoch!==contextEpoch)return false;
        return true;
      } catch (error) {
        noteFailure(stage === 'webgl2-context' ? 'context-unavailable' : 'preparation-failed',
          stage, error);
        disposeResources();
        return false;
      }
    }
    function draw() {
      // A WebGL context-loss event already initiated Canvas recovery. A
      // late callback must not replace that precise failure with "inactive".
      if (!active && lastFailure?.type === 'context-loss') return;
      let stage = 'active-check';
      try {
        if (!active || !scene) throw Error('Inactive PixiJS renderer');
        stage = 'viewport-check';
        syncViewport();
        stage = 'resolution';
        syncResolution();
        stage = 'background';
        syncBackground();
        stage = 'actors';
        actorFrame();
        stage = 'atmosphere';
        syncAtmosphere();
        stage = 'scene-render';
        scene.draw();
      } catch (error) {
        // Pixi/ANGLE can signal context loss through its draw exception
        // BEFORE the browser fires webglcontextlost. Preserve that cause
        // and avoid a second failure after the event released the scene.
        if (!active && lastFailure?.type === 'context-loss') return;
        const message = String(error?.message || error),
          contextLost =
            /WebGL context lost/i.test(message) ||
            app?.canvas?.getContext?.('webgl2')?.isContextLost?.() === true,
          type = contextLost
            ? 'context-loss'
            : stage === 'viewport-check'
              ? 'viewport-changed'
              : stage === 'active-check'
                ? 'inactive-renderer'
                : 'render-exception';
        options.onFailure(noteFailure(type, stage, error));
        if (!contextLost) throw error;
      }
    }
    function activate() {
      requireValue(app?.canvas && scene, 'PixiJS scene not prepared');
      app.canvas.style.display = 'block';
      active = true;
    }
    function deactivate() {
      active = false;
      if (app?.canvas) app.canvas.style.display = 'none';
    }
    function disposeResources() {
      ++contextEpoch; // Cancel any asynchronous neighborhood preparation.
      deactivate();
      scene?.destroy?.();
      scene = null;
      clearBakes();
      backing?.destroy?.(false);
      backing = null;
      if (app) {
        const node = app.canvas;
        app.destroy(true);
        node?.remove();
        app = null;
      }
      backgroundRenderer = null;
      backdrop = null;
      basePosition = null;
      baseOptimization = null;
      baseGame = null;
      backingRatio = 1;
      bakedZoom = null;
      bakeZone = null;
    }
    function dispose() {
      disposed = true;
      disposeResources();
    }
    function noteEvents(events) {
      adapter?.noteEvents?.(events);
    }
    return Object.freeze({
      prepare,
      draw,
      activate,
      deactivate,
      release: disposeResources,
      dispose,
      noteEvents,
      failureDetails: () => lastFailure,
      status: () => ({
        active,
        lastError,
        // Actual Pixi scene counters; Canvas overlay counters are separate.
        sceneMetrics: scene?.metrics?.() || null,
        loadedTextures: loaded.size,
        proceduralBytes: imageBytes,
        proceduralTextures: baked.size,
        proceduralEvictions,
        proceduralCacheEvictions,
        neighborhoodPrepared,
        neighborhoodWarmupMs,
        proceduralBudget,
        proceduralTrimAt: trimAt,
        pixelRatio: backingRatio,
        backdropWidth: backdrop?.width || 0,
        backdropHeight: backdrop?.height || 0,
        backgroundOptimized: baseOptimization,
      }),
    });
  }
  const api = Object.freeze({ create });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PrototypePixiExperimental = api;
})(typeof window !== 'undefined' ? window : globalThis);
