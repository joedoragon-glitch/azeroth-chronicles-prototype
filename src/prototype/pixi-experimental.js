/* Experimental PixiJS presentation for the LIVE Campaign.
 * The normal Canvas renderer owns input projection and critical 2D cue overlays.
 * Do not label this a complete or faster WebGL implementation before review.
 */
(function (root) {
  'use strict';

  const PIXI_SCRIPT = './assets/vendor/pixi-8.22.0.min.js';
  const BG_MARGIN = 220;
  const REGION_TILE = 512;
  const BG_SHIFT = BG_MARGIN * 0.6;
  const BG_PREFETCH_TRIGGER = BG_MARGIN * 0.33;
  // Two CPU windows, one GPU source. Never provision a second regional GPU atlas.
  const BG_TWO_WINDOW_BUDGET = 256 * 1024 * 1024;
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
  // Explicit proof-bounded reuse: only fixed authored decorative shapes that
  // never read entity identity, world coordinates, animation or game state.
  // Variable carts, wildlife, poppies, enemies, heroes and living props retain
  // their original per-entity keys. Unknown appearance fields opt OUT.
  const shareableDecorations = new Set([
    'crate', 'barrel', 'woodpile', 'stacked-lumber', 'scroll-stack',
  ]);
  const inertDecorationFields = new Set([
    'id', 'name', 'x', 'y', 'r', 'renderKind', 'structure', 'decorative',
    'spriteIdentity', 'visualScale', 'group', 'sceneRole', 'roadTrace',
    'frontierDistrict', 'crownDistrict',
  ]);
  function sharedDecorationKey(visual) {
    if (visual.renderKind !== 'prop' || visual.decorative !== true ||
        !shareableDecorations.has(visual.structure) ||
        Object.keys(visual).some((field) => !inertDecorationFields.has(field))) return null;
    const scale = visual.visualScale == null ? 1 : visual.visualScale;
    if (!Number.isFinite(scale) || scale <= 0) return null;
    return visual.structure + ':' + scale;
  }
  let libraryRequest;
  let prepareExtensionLibrary = null;
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
  function candidates(game, project, width, height, presentEntity, margin = 270,
    preloadEncounters = false) {
    const zone = game.zone();
    const result = [],
      used = new Map();
    // Only already admitted enemies are inspected. Never trigger an unentered
    // zone or roll future spawns just to manufacture a preload candidate.
    const knownEnemies = preloadEncounters ? (zone.enemies || []).filter(
      (e) => e.hp > 0 && Number.isFinite(e.x) && Number.isFinite(e.y)) : [];
    const hotSpots = knownEnemies.filter(
      (e) => e.type === 'boss' || e.fieldCaptain || e.roomCaptain || e.captain)
      .flatMap((e) => [e, e.home].filter(
        (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y)))
      .map(project);
    function add(entities, kind) {
      for (const entity of entities || []) {
        if (kind === 'enemy' && entity.hp <= 0) continue;
        const point = project(entity);
        const inCameraFringe = point.x >= -margin && point.x <= width + margin &&
          point.y >= -margin && point.y <= height + margin;
        const encounterActor = preloadEncounters && kind === 'enemy';
        const bossTerritory = preloadEncounters && kind === 'prop' &&
          hotSpots.some((p) => Math.hypot(point.x - p.x, point.y - p.y) <= 1600);
        if (!inCameraFringe && !encounterActor && !bossTerritory) continue;
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
    if (game.s.mode !== 'arena') add(zone.props, 'prop');
    // Same permanent civic features included by the Canvas depth sorter.
    if (game.s.mode !== 'arena' && !game.isDungeon() && !game.supplyRoom?.(game.zoneId) &&
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
    if (game.s.mode !== 'arena') add(zone.buildings, 'building');
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
      aheadRenderer = null,
      aheadCanvas = null,
      aheadTarget = null,
      aheadReady = null,
      aheadIdle = null,
      aheadEpoch = 0,
      terrainAtlas = null,
      terrainTilesPrepared = 0,
      terrainTileReuses = 0,
      predictiveIdle = null,
      predictiveRunning = false,
      predictionAnchor = null,
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
    // Prefer retained graphics over repeated CPU bakes during play.
    // This is an emergency allocation guard, not an eager eviction target.
    const proceduralBudget = Number.isSafeInteger(options.proceduralTextureBudgetBytes)
      ? Math.max(1, options.proceduralTextureBudgetBytes)
      : 1024 * 1024 * 1024;
    const trimAt = proceduralBudget;
    const trimTo = Math.floor(proceduralBudget * 0.9);
    let imageBytes = 0,
      disposed = false,
      baseGame = null,
      bakeZone = null,
      actorFrameNumber = 0,
      contextEpoch = 0,
      proceduralEvictions = 0,
      proceduralCacheEvictions = 0,
      proceduralBakes = 0,
      proceduralCacheHits = 0,
      sharedProceduralHits = 0,
      backgroundRepaints = 0,
      backgroundLookaheadPaints = 0,
      backgroundLookaheadPromotions = 0,
      backgroundLookaheadMisses = 0,
      backgroundLookaheadFailures = 0,
      backgroundLookaheadSkips = { idleUnavailable: 0, memoryBudget: 0,
        combat: 0, excluded: 0, hidden: 0, invalidated: 0 },
      backgroundLookaheadPaintMs = 0,
      backgroundLookaheadPromoteMs = 0,
      maxBackgroundLookaheadPromoteMs = 0,
      neighborhoodPrepared = 0,
      neighborhoodWarmupMs = 0,
      // Synchronous preparation costs only; not GPU completion/presented frames.
      syncProceduralBakeMs = 0,
      maxProceduralBakeMs = 0,
      syncBackgroundPaintMs = 0,
      maxBackgroundPaintMs = 0,
      startupSpritePreloadMs = 0,
      startupFirstSceneMs = 0,
      approvedGpuPrepared = 0,
      proceduralGpuPrepared = 0,
      gpuPreparationMs = 0,
      gpuPreparationBatches = 0;
    let cancelGpuPreparation = null;
    // One portrait-stamped Crown coin texture, reused for every visible drop.
    const crownLootTextureId = 'pixi-world-crown-loot';
    let crownLootTexture = null,
      crownLootDensity = 0;
    const measureNow = () =>
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    // Opt-in developer-mode CPU stage timings. A JS draw() completion means
    // commands were submitted, not that GPU rendering/presentation finished.
    // Never allocate a sample or read a clock during ordinary player frames.
    const drawCpuSamples = [];
    let developerDrawFrames = 0;
    const drawCpuSampleEvery = 12;
    function drawCpuReport() {
      const names = ['viewport', 'resolution', 'background', 'actors', 'atmosphere', 'scene'];
      const quantile = (values, p) => {
        const list = values.slice().sort((a, b) => a - b);
        return +(list[Math.floor((list.length - 1) * p)] || 0).toFixed(2);
      };
      return {
        sampleEvery: drawCpuSampleEvery,
        sampledFrames: drawCpuSamples.length,
        phases: Object.fromEntries(names.map(name => {
          const values = drawCpuSamples.map(row => row[name]);
          return [name, { p50Ms: quantile(values, 0.5), p95Ms: quantile(values, 0.95) }];
        })),
        note: 'Developer-only JavaScript submission cost, not GPU time, frame pacing or device FPS.',
      };
    }
    function recordBackgroundPaint(started) {
      const elapsed = Math.max(0, measureNow() - started);
      syncBackgroundPaintMs += elapsed;
      maxBackgroundPaintMs = Math.max(maxBackgroundPaintMs, elapsed);
    }
    // Pixi 8.22 PrepareSystem uploads TextureSources to the active renderer,
    // unlike Assets.load (CPU decode) and Texture.from (source registration).
    // A context can be released while the system ticker is still processing:
    // race its completion with local cancellation so the renderer guard does
    // not remain stuck in its 'preparing' phase on background/context loss.
    async function prepareGpuTextures(epoch, textures, group) {
      if (!textures.length) return epoch === contextEpoch;
      if (epoch !== contextEpoch || !app?.renderer?.prepare?.upload) return false;
      const started = measureNow();
      let cancel;
      const cancelled = new Promise((resolve) => {
        cancel = () => resolve(false);
      });
      cancelGpuPreparation = cancel;
      try {
        const upload = app.renderer.prepare.upload(textures);
        const completed = await Promise.race([Promise.resolve(upload).then(() => true), cancelled]);
        if (!completed || epoch !== contextEpoch || !scene || !app) return false;
        const elapsed = Math.max(0, measureNow() - started);
        gpuPreparationMs += elapsed;
        gpuPreparationBatches++;
        if (group === 'approved') approvedGpuPrepared += textures.length;
        else proceduralGpuPrepared += textures.length;
        return true;
      } finally {
        if (cancelGpuPreparation === cancel) cancelGpuPreparation = null;
      }
    }
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
    function releaseCrownLootTexture() {
      if (!crownLootTexture) return;
      // Detach actors before destroying a texture that could still be in use.
      if (scene) {
        scene.syncActors([]);
        scene.unregisterTexture(crownLootTextureId);
      }
      crownLootTexture.destroy?.(true);
      crownLootTexture = null;
      crownLootDensity = 0;
    }
    function effectiveRatio() {
      // Use the same device-specific backing-pixel density as Canvas.
      return worldCanvas.width / Math.max(1, viewport.width);
    }
    function dropBackgroundLookahead(release = false) {
      ++aheadEpoch;
      if (aheadIdle != null) root.cancelIdleCallback?.(aheadIdle);
      aheadIdle = null;
      aheadReady = null;
      aheadTarget = null;
      if (release) {
        if (aheadCanvas) aheadCanvas.width = aheadCanvas.height = 0;
        aheadCanvas = null;
        aheadRenderer = null;
      }
    }
    function createBackgroundPainter() {
      dropBackgroundLookahead(true);
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
      if (game().s.mode !== 'arena') createBackgroundPainter();
      drawBackground();
      previous?.destroy?.(false);
      // Keep the previous density warm: revisionFor includes backingRatio,
      // so only matching raster sizes are reused. The shared LRU trims memory.
      // An actual viewport/context reconstruction still clears resources.
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
      // Rebuild viewport-sized objects but keep the previously uploaded
      // procedural artwork. The new bridge gets the same registered textures;
      // no dungeon visit or display resize should force a full rebake.
      scene.syncActors([]);
      releaseCrownLootTexture();
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
      for (const body of baked.values()) scene.registerTexture(body.id, body.texture);
      if (game().s.mode !== 'arena') createBackgroundPainter();
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
      const shared = sharedDecorationKey(visual);
      if (shared !== null) return (
        backingRatio + ':' + zoom + ':shared-decor:' + shared + ':' + current.zoneId
      );
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

    // Pre-render exactly one major region and its visited interiors in 512px
    // tiles, with no mutation of the live hero or a hidden dungeon admission.
    function parentRegion(current) {
      return root.Campaign?.data?.regions?.[current.regionIndex()]?.id ||
        (current.isDungeon() ? null : current.zoneId);
    }
    function terrainSignature(current) {
      // Hot-path cache checks must not repeatedly rebuild the authored zone
      // or stringify full roads/paths on every frame of Chromebook travel.
      // The admitted layout owns stable revision/count metadata. Camera
      // quality/zoom changes still invalidate the appropriate raster scale.
      const zone = current.s.zones?.[current.zoneId];
      return [current.zoneId, platform.cameraZoom, backingRatio,
        !!options.getOptimizationMode(), current.zoneSize?.(),
        zone?.roads?.length || 0, zone?.footpaths?.length || 0,
        zone?.crownInheritedDecks?.length || 0,
        zone?.roadNetworkVersion || 0, zone?.destinationLayoutVersion || 0,
        zone?.dungeonSpaceVersion || 0, zone?.highlandsLandscapeVersion || 0,
        zone?.frontierSceneVersion || 0, zone?.crownSceneVersion || 0].join('|');
    }
    function tileCache(current) {
      if (!terrainAtlas || terrainAtlas.region !== parentRegion(current)) return null;
      const found = terrainAtlas.zones.get(current.zoneId);
      return found?.signature === terrainSignature(current) ? found : null;
    }
    async function prepareTerrainTiles(epoch) {
      const current = game();
      if (current.s.mode === 'arena' || !current.zoneSize?.()) return true;
      const region = parentRegion(current);
      if (!region) return true;
      if (terrainAtlas?.region !== region)
        terrainAtlas = { region, zones: new Map() };
      if (tileCache(current)) return true;
      const signature = terrainSignature(current), zoneId = current.zoneId,
        zoom = platform.cameraZoom || 1, ratio = backingRatio,
        size = current.zoneSize(), gutter = 320 * zoom;
      const minX = -size * 0.76 * zoom - gutter,
        minY = -gutter,
        columns = Math.ceil((size * 1.52 * zoom + 2 * gutter) / REGION_TILE),
        rows = Math.ceil((size * 0.54 * zoom + 2 * gutter) / REGION_TILE);
      const tiles = new Map(), viewportTile = { width: REGION_TILE, height: REGION_TILE };
      let tileX = minX, tileY = minY;
      const tilePlatform = {
        get cameraZoom() { return platform.cameraZoom; },
        cameraAnchor() {
          const hero = iso(current.hero);
          return { x: hero.x * zoom - tileX, y: hero.y * zoom - tileY };
        },
      };
      const canvas = makeCanvas(Math.round(REGION_TILE * ratio),
        Math.round(REGION_TILE * ratio));
      const ctx = requireValue(canvas.getContext('2d'), 'Terrain cache unavailable');
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const painter = root.PrototypeRenderer.create({
        ...getRendererOptions(), canvas: viewportTile, ctx,
        platform: tilePlatform, renderLayer: 'background',
        staticTerrainTimeSeconds: measureNow() / 1000,
      });
      painter.setGroundReuse?.(false);
      painter.setOptimizationMode(!!options.getOptimizationMode());
      for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
        if (epoch !== contextEpoch || current !== game() ||
            current.zoneId !== zoneId || root.document?.hidden ||
            platform.cameraZoom !== zoom || backingRatio !== ratio) return false;
        tileX = minX + x * REGION_TILE;
        tileY = minY + y * REGION_TILE;
        painter.draw();
        const tile = makeCanvas(canvas.width, canvas.height);
        requireValue(tile.getContext('2d'), 'Terrain tile unavailable')
          .drawImage(canvas, 0, 0);
        const finished = y * columns + x + 1;
        tiles.set(finished - 1, tile);
        if (finished === 1 || finished === rows * columns ||
            finished % 4 === 0)
          options.onPreparationProgress?.({ zone: zoneId, stage: 'terrain',
            prepared: finished, total: rows * columns });
        if ((x + columns * y) % 2 === 1 &&
            typeof requestAnimationFrame === 'function')
          await new Promise((done) => requestAnimationFrame(done));
      }
      if (epoch !== contextEpoch || current.zoneId !== zoneId ||
          current !== game()) return false;
      terrainAtlas.zones.set(zoneId,
        { signature, minX, minY, columns, rows, tiles, tileWidth: REGION_TILE });
      terrainTilesPrepared += tiles.size;
      return true;
    }
    function paintFromTiles(current, cache) {
      const ctx = backdrop?.getContext('2d');
      if (!ctx?.drawImage || !ctx?.clearRect) return false;
      const zoom = platform.cameraZoom || 1, ratio = backingRatio,
        anchor = platform.cameraAnchor(viewport.width, viewport.height),
        hero = iso(current.hero),
        left = hero.x * zoom - anchor.x - BG_MARGIN,
        top = hero.y * zoom - anchor.y - BG_MARGIN,
        c1 = Math.max(0, Math.floor((left - cache.minX) / REGION_TILE)),
        c2 = Math.min(cache.columns - 1,
          Math.floor((left + viewport.width + BG_MARGIN * 2 - cache.minX) / REGION_TILE)),
        r1 = Math.max(0, Math.floor((top - cache.minY) / REGION_TILE)),
        r2 = Math.min(cache.rows - 1,
          Math.floor((top + viewport.height + BG_MARGIN * 2 - cache.minY) / REGION_TILE));
      if (c1 > c2 || r1 > r2) return false;
      ctx.save?.();
      try {
        ctx.setTransform?.(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, backdrop.width, backdrop.height);
        // Outside the authored square there is still the original dark
        // background, never a transparent hole around the tile atlas.
        ctx.fillStyle = '#0c1913';
        ctx.fillRect?.(0, 0, backdrop.width, backdrop.height);
        for (let y = r1; y <= r2; y++) for (let x = c1; x <= c2; x++) {
          const tile = cache.tiles.get(y * cache.columns + x);
          if (!tile) return false;
          ctx.drawImage(tile, Math.round((cache.minX + x * REGION_TILE - left) * ratio),
            Math.round((cache.minY + y * REGION_TILE - top) * ratio));
        }
      } finally { ctx.restore?.(); }
      terrainTileReuses++;
      return true;
    }
    function drawBackground() {
      dropBackgroundLookahead();
      const started = measureNow();
      const current = game(),
        zoom = platform.cameraZoom || 1;
      if (current.s.mode === 'arena') {
        if (!scene) throw Error('Missing arena scene');
        baseGame = current;
        basePosition = { x: current.hero.x, y: current.hero.y };
        baseZone = current.zoneId;
        baseZoom = zoom;
        baseOptimization = true;
        scene.setSolidBackground(0x000000, viewport.width, viewport.height);
        recordBackgroundPaint(started);
        return;
      }
      if (!backgroundRenderer || !backdrop || !scene)
        throw Error('Missing original terrain painter');
      baseGame = current;
      basePosition = { x: current.hero.x, y: current.hero.y };
      baseZone = current.zoneId;
      baseZoom = zoom;
      baseOptimization = !!options.getOptimizationMode();
      backgroundRenderer.setOptimizationMode(baseOptimization);
      const cache = tileCache(current);
      if (!cache || !paintFromTiles(current, cache)) {
        backgroundRepaints++;
        backgroundRenderer.draw();
      }
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
      recordBackgroundPaint(started);
    }
    // This optional presentation-only painter looks ahead in the SAME zone
    // without moving the campaign hero, advancing the world or touching RNG.
    // An idle callback runs one complete original terrain painter invocation;
    // it is intentionally not claimed to be incremental or frame-free.
    function buildLookaheadPainter() {
      if (aheadRenderer) return true;
      if (!backdrop || !root.requestIdleCallback || !root.cancelIdleCallback) return false;
      const windowBytes = backdrop.width * backdrop.height * 4;
      if (windowBytes * 2 > BG_TWO_WINDOW_BUDGET) return false;
      const width = viewport.width + BG_MARGIN * 2,
        height = viewport.height + BG_MARGIN * 2;
      aheadCanvas = makeCanvas(backdrop.width, backdrop.height);
      const ctx = aheadCanvas.getContext('2d');
      if (!ctx) {
        dropBackgroundLookahead(true);
        return false;
      }
      ctx.setTransform(backingRatio, 0, 0, backingRatio, 0, 0);
      const platformAhead = {
        get cameraZoom() { return platform.cameraZoom; },
        cameraAnchor() {
          const anchor = platform.cameraAnchor(viewport.width, viewport.height),
            heroIso = iso(game().hero), targetIso = iso(aheadTarget || game().hero),
            zoom = platform.cameraZoom || 1;
          return {
            x: anchor.x + BG_MARGIN + (heroIso.x - targetIso.x) * zoom,
            y: anchor.y + BG_MARGIN + (heroIso.y - targetIso.y) * zoom,
          };
        },
      };
      aheadRenderer = root.PrototypeRenderer.create({
        ...getRendererOptions(),
        canvas: { width, height }, ctx, platform: platformAhead,
        renderLayer: 'background',
      });
      // Keep the native ground cache only; the second CPU canvas fits in a
      // combined 64 MiB two-window cap without another ground cache.
      aheadRenderer.setGroundReuse?.(false);
      return true;
    }
    // Read-only current-zone threat check: never generate a destination.
    // Optional work can wait; mandatory drawing and hard resource limits cannot.
    function nearActiveFight(current) {
      return !!current.s.projectiles?.length ||
        (current.zone()?.enemies || []).some((enemy) =>
          enemy.hp > 0 && Math.hypot(enemy.x - current.hero.x,
            enemy.y - current.hero.y) <= 420);
    }
    function canPrepareLookahead(current) {
      if (!active || !scene || !backing || !backdrop || root.document?.hidden ||
          current.s.mode === 'arena' || current.isDungeon() || current.supplyRoom?.() ||
          current.sideDungeon?.(current.zoneId)) return false;
      return !nearActiveFight(current);
    }
    function queueBackgroundLookahead(current, dx, dy) {
      // Only count blockers after the camera actually asks for lookahead.
      if (aheadReady || aheadIdle != null || !backdrop ||
          Math.max(Math.abs(dx), Math.abs(dy)) < BG_PREFETCH_TRIGGER) return;
      if (backdrop.width * backdrop.height * 8 > BG_TWO_WINDOW_BUDGET) {
        backgroundLookaheadSkips.memoryBudget++;
        return;
      }
      if (!root.requestIdleCallback || !root.cancelIdleCallback) {
        backgroundLookaheadSkips.idleUnavailable++;
        return;
      }
      if (root.document?.hidden) {
        backgroundLookaheadSkips.hidden++;
        return;
      }
      if (nearActiveFight(current)) {
        backgroundLookaheadSkips.combat++;
        return;
      }
      if (!canPrepareLookahead(current)) {
        backgroundLookaheadSkips.excluded++;
        return;
      }
      const epoch = aheadEpoch, zone = current.zoneId, zoom = platform.cameraZoom || 1,
        optimization = !!options.getOptimizationMode(), ratio = backingRatio;
      aheadIdle = root.requestIdleCallback(() => {
        aheadIdle = null;
        if (epoch !== aheadEpoch || game() !== current || current.zoneId !== zone ||
            (platform.cameraZoom || 1) !== zoom ||
            !!options.getOptimizationMode() !== optimization || backingRatio !== ratio) {
          backgroundLookaheadSkips.invalidated++;
          return;
        }
        if (!canPrepareLookahead(current)) {
          backgroundLookaheadSkips[nearActiveFight(current) ? 'combat' : 'excluded']++;
          return;
        }
        const started = measureNow();
        try {
          if (!buildLookaheadPainter()) return;
          aheadTarget = { x: current.hero.x, y: current.hero.y };
          aheadRenderer.setOptimizationMode(optimization);
          aheadRenderer.draw();
          if (epoch !== aheadEpoch) return;
          aheadReady = { point: aheadTarget, zone, zoom, optimization, ratio, game: current };
          backgroundLookaheadPaints++;
          backgroundLookaheadPaintMs += Math.max(0, measureNow() - started);
        } catch (_) {
          // Lookahead must never break active gameplay or Canvas recovery.
          backgroundLookaheadFailures++;
          dropBackgroundLookahead(true);
        }
      });
    }
    function promoteBackgroundLookahead(current, zoom) {
      const candidate = aheadReady,
        displacement = candidate && iso({
          x: current.hero.x - candidate.point.x, y: current.hero.y - candidate.point.y,
        });
      if (!candidate || candidate.game !== current ||
          candidate.zone !== current.zoneId || candidate.zoom !== zoom ||
          candidate.ratio !== backingRatio ||
          candidate.optimization !== !!options.getOptimizationMode() ||
          Math.max(Math.abs(displacement.x * zoom), Math.abs(displacement.y * zoom)) > BG_SHIFT)
        return false;
      const ctx = backdrop?.getContext('2d');
      if (!ctx?.save || !ctx.restore || !ctx.setTransform || !ctx.drawImage ||
          !ctx.clearRect || !aheadCanvas) return false;
      const started = measureNow();
      ctx.save();
      try {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, backdrop.width, backdrop.height);
        ctx.drawImage(aheadCanvas, 0, 0);
      } finally { ctx.restore(); }
      // Retain the SAME source and GPU allocation; only its pixel content changes.
      backing.source.update?.();
      basePosition = { ...candidate.point };
      baseZone = candidate.zone;
      baseZoom = candidate.zoom;
      baseOptimization = candidate.optimization;
      aheadReady = null;
      backgroundLookaheadPromotions++;
      const promotionMs = Math.max(0, measureNow() - started);
      backgroundLookaheadPromoteMs += promotionMs;
      maxBackgroundLookaheadPromoteMs = Math.max(maxBackgroundLookaheadPromoteMs, promotionMs);
      return true;
    }
    function syncBackground() {
      const current = game(),
        zoom = platform.cameraZoom || 1;
      if (baseGame && baseGame !== current)
        throw Error('Campaign changed; reset to Canvas before switching again');
      if (current.s.mode === 'arena') return; // No scrolling or rebaking black.
      // A presentation-quality transition must invalidate the retained
      // background even when the hero has not moved or changed zoom.
      if (!basePosition || baseZone !== current.zoneId || baseZoom !== zoom ||
          baseOptimization !== !!options.getOptimizationMode()) drawBackground();
      const d = iso({ x: current.hero.x - basePosition.x, y: current.hero.y - basePosition.y });
      let dx = -d.x * zoom,
        dy = -d.y * zoom;
      if (Math.abs(dx) > BG_SHIFT || Math.abs(dy) > BG_SHIFT) {
        if (!promoteBackgroundLookahead(current, zoom)) {
          backgroundLookaheadMisses++;
          drawBackground();
        }
        const movement = iso({
          x: current.hero.x - basePosition.x,
          y: current.hero.y - basePosition.y,
        });
        dx = -movement.x * zoom;
        dy = -movement.y * zoom;
      }
      scene.moveBackground(-BG_MARGIN + dx, -BG_MARGIN + dy);
      if (!tileCache(current)) queueBackgroundLookahead(current, dx, dy);
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
      if (baked.has(revision)) {
        proceduralCacheHits++;
        if (revision.includes(':shared-decor:')) sharedProceduralHits++;
        return baked.get(revision);
      }
      const started = measureNow();
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
      proceduralBakes++;
      const elapsed = Math.max(0, measureNow() - started);
      syncProceduralBakeMs += elapsed;
      maxProceduralBakeMs = Math.max(maxProceduralBakeMs, elapsed);
      return baked.get(revision);
    }
    // On switching to Pixi, the existing live view is loaded first. Then,
    // Prepare the actual saved/admitted region before revealing it: dungeon
    // interiors completely, outdoor approach and known boss territory first.
    // Yield between batches while simulation is held. Finish the selected
    // neighborhood rather than abandoning bakes after a time/count quota.
    async function warmNeighborhood(epoch, arrival = false, heading = null) {
      const started = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const current = game(), zoom = platform.cameraZoom || 1;
      const originZone = current.zoneId, origin = project(current.hero);
      const ahead = heading ? iso(heading) : null;
      const headingLength = ahead ? Math.hypot(ahead.x, ahead.y) || 1 : 1;
      const width = viewport.width, height = viewport.height;
      // Prepare the WHOLE admitted zone before revealing gameplay: every
      // outdoor actor/scenery record in the active region, or every actor and
      // prop in the bounded dungeon. Keep these bakes across interior visits.
      const dungeon = current.isDungeon() || !!current.supplyRoom?.() ||
        !!current.sideDungeon?.();
      const fringe = candidates(current, project, width, height,
        canvasRenderer.presentEntity, arrival ? Infinity :
          heading ? 4000 : 900, arrival || !!heading)
        .filter(({entity,point}) =>
          !entity.interactionOnly &&
          !(entity.kind === 'landmark' && String(entity.id || '').startsWith('bridge-')) &&
          (arrival || point.x < -270 || point.x > width + 270 ||
            point.y < -270 || point.y > height + 270) &&
          (!ahead || (point.x - origin.x) * ahead.x / headingLength +
            (point.y - origin.y) * ahead.y / headingLength >= -250))
        .sort((a,b) => {
          if (arrival) {
            const priority = (item) =>
              item.kind === 'enemy' && (item.entity.type === 'boss' ||
                item.entity.fieldCaptain || item.entity.roomCaptain ||
                item.entity.captain) ? 0 :
              item.kind === 'enemy' && item.entity.hp > 0 ? 1 :
              item.kind === 'hero' || item.kind === 'ally' ? 2 : 3;
            const dist = (item) => Math.hypot(
              item.entity.x-current.hero.x,item.entity.y-current.hero.y);
            return priority(a)-priority(b) || dist(a)-dist(b);
          }
          const distance = (p) => Math.hypot(
            Math.max(0,-p.x,p.x-width),Math.max(0,-p.y,p.y-height));
          if (ahead) {
            const threat = (item) => item.kind === 'enemy' &&
              (item.entity.type === 'boss' || item.entity.fieldCaptain) ? 0 :
              item.kind === 'enemy' ? 1 : 2;
            return threat(a) - threat(b) || distance(a.point)-distance(b.point);
          }
          return distance(a.point)-distance(b.point);
        });
      let prepared = 0,steps=0;
      for(const {entity,visual,point,key} of fringe) {
        if(epoch!==contextEpoch || !scene || !app || game()!==current ||
           current.zoneId!==originZone || platform.cameraZoom!==zoom ||
           root.document?.hidden) return false;
        // Actual loss of the GPU context cancels above; there is no deadline.
        // The emergency byte guard still prevents a failed allocation loop.
        if(imageBytes>=trimAt) break;
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
      return epoch===contextEpoch && current.zoneId===originZone;
    }
    // Outdoor predictive graphics work is strictly opportunistic and uses
    // browser idle time. It never changes enemies, campaign state, RNG or the
    // game clock. Move the lookahead toward the player's actual direction and
    // upload fresh procedural textures before they appear in the viewport.
    function queuePredictiveWarm(current) {
      if (!active || !app || !scene || !root.requestIdleCallback ||
          root.document?.hidden || current.s.mode === 'arena' ||
          current.isDungeon() || nearActiveFight(current)) return;
      const pose = { x: current.hero.x, y: current.hero.y, zone: current.zoneId,
        zoom: platform.cameraZoom || 1 };
      if (!predictionAnchor || predictionAnchor.zone !== pose.zone ||
          predictionAnchor.zoom !== pose.zoom) {
        predictionAnchor = pose;
        return;
      }
      const heading = { x: pose.x - predictionAnchor.x,
        y: pose.y - predictionAnchor.y };
      if (Math.hypot(heading.x, heading.y) < 180 ||
          predictiveIdle !== null || predictiveRunning) return;
      predictionAnchor = pose;
      const epoch = contextEpoch;
      predictiveIdle = root.requestIdleCallback(async () => {
        predictiveIdle = null;
        if (epoch !== contextEpoch || !active || game() !== current ||
            current.zoneId !== pose.zone || nearActiveFight(current)) return;
        predictiveRunning = true;
        try {
          const before = new Set(baked.keys());
          if (!await warmNeighborhood(epoch, false, heading) ||
              epoch !== contextEpoch || current.zoneId !== pose.zone ||
              nearActiveFight(current)) return;
          const fresh = [...baked].filter(([key]) => !before.has(key))
            .map(([, body]) => body.texture);
          await prepareGpuTextures(epoch, fresh, 'procedural');
        } catch (_) {
          // Optional idle work must never interrupt play; mandatory visible
          // graphics still use the normal renderer/fallback path.
        } finally {
          predictiveRunning = false;
        }
      });
    }
    async function warmArrival() {
      if (!active || !scene || !app || root.document?.hidden) return false;
      const epoch = contextEpoch, current = game();
      const before = new Set(baked.keys());
      try {
        if (!await prepareTerrainTiles(epoch)) return false;
        if (!await warmNeighborhood(epoch, true)) return false;
        if (epoch !== contextEpoch || current !== game() || !active) return false;
        // CPU procedural bakes alone do not make near-enemy WebGL frames ready.
        // Upload only the fresh textures; existing GPU sources remain reusable.
        const fresh = [...baked].filter(([key]) => !before.has(key))
          .map(([, body]) => body.texture);
        return await prepareGpuTextures(epoch, fresh, 'procedural');
      } catch (error) {
        noteFailure('arrival-preparation-failed', 'nearby-enemies', error);
        return false;
      }
    }
    function ensureCrownLootTexture(zoom) {
      const density = Math.max(1, backingRatio * zoom);
      if (crownLootTexture && crownLootDensity === density &&
          scene.hasTexture(crownLootTextureId)) return crownLootTextureId;
      releaseCrownLootTexture();
      const painter = requireValue(root.PrototypeRenderer?.drawCrownLoot,
        'Original Crown coin painter unavailable');
      const stamp = makeCanvas(Math.round(40 * density), Math.round(40 * density));
      const ctx = requireValue(stamp.getContext('2d'), 'Crown coin canvas unavailable');
      ctx.setTransform(density, 0, 0, density, 0, 0);
      painter(ctx, { x: 20, y: 20 });
      const texture = root.PIXI.Texture.from(stamp);
      texture.source.scaleMode = 'nearest';
      scene.registerTexture(crownLootTextureId, texture);
      crownLootTexture = texture;
      crownLootDensity = density;
      return crownLootTextureId;
    }
    function appendCrownLoot(records, current, zoom) {
      let ordinal = 0;
      for (const loot of current.s.loot || []) {
        ordinal++;
        if (loot.zone !== current.zoneId ||
            !Number.isFinite(loot.x) || !Number.isFinite(loot.y)) continue;
        const point = project(loot);
        if (point.x < -40 * zoom || point.x > viewport.width + 40 * zoom ||
            point.y < -40 * zoom || point.y > viewport.height + 40 * zoom) continue;
        records.push({
          key: 'crown-loot:' + (loot.id == null ? ordinal : loot.id),
          textureId: ensureCrownLootTexture(zoom),
          x: point.x - 20 * zoom,
          y: point.y - 20 * zoom,
          width: 40 * zoom,
          height: 40 * zoom,
          opacity: 1,
          flipX: false,
          // Same layering as Canvas: above actors and below world lighting.
          depth: Number.MAX_SAFE_INTEGER,
        });
      }
    }
    function actorFrame() {
      const current = game(),
        zoom = platform.cameraZoom || 1;
      // Keep already prepared outdoor and dungeon artwork resident across
      // normal entrances/exits. Only an actual hard allocation limit can
      // retire cold images; changing zoom uses a distinct density key.
      // Revision identities include zoom too: changing camera scale never
      // aliases raster sizes, and revisits can reuse images until LRU trimming.
      bakedZoom = zoom;
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
        const ground =
          visual.presentation === 'scout-tracks' || visual.kind === 'critical-codex'
            ? null
            : {
                x: point.x, y: point.y,
                scale: zoom,
                ...canvasRenderer.groundPresentation(visual),
              };
        // Canvas repaints these identities as their actual in-world objects.
        const painted = paintedVisual(visual);
        // Share the original Canvas attack/motion/idle facing decision.
        const facing = canvasRenderer.facingFor?.(painted) ?? 1;
        const chosen = adapter.commandFor(
          painted,
          { x: point.x / zoom, y: point.y / zoom },
          { region: current.regionIndex(),
            rescued: !!current.s.rescued[entity.family], facing },
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
            // Reflect procedural bodies about the foot anchor, not crop center.
            x: facing < 0
              ? point.x - (b.dx + b.logicalWidth) * zoom
              : point.x + b.dx * zoom,
            y: point.y + b.dy * zoom,
            width: b.logicalWidth * zoom,
            height: b.logicalHeight * zoom,
            opacity: 1,
            flipX: facing < 0,
            ground,
            depth: entity.x + entity.y,
          });
        } else throw Error('Missing original game artwork: ' + key);
      }
      appendCrownLoot(records, current, zoom);
      scene.syncActors(records);
      // Keep offscreen and previously visited artwork resident for reuse.
      // Only a real emergency hard-budget allocation needs LRU retirement;
      // that path protects all currently visible texture identities.
    }
    function syncAtmosphere() {
      const current = game(),
        region = current.regionIndex(),
        z = current.zone();
      const zoom = platform.cameraZoom || 1;
      if (current.s.mode === 'arena') {
        scene.syncLamps([]);
        scene.syncMotes([], zoom);
        scene.clearAtmosphere();
        return;
      }
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
        stage = 'prepare-plugin';
        requireValue(PIXI.PrepareSystem && PIXI.extensions?.add,
          'PixiJS GPU preparation extension unavailable');
        // The pinned non-module Pixi bundle exports PrepareSystem, but unlike
        // `import pixi.js/prepare` it does not install the optional system.
        if (prepareExtensionLibrary !== PIXI) {
          PIXI.extensions.add(PIXI.PrepareSystem);
          prepareExtensionLibrary = PIXI;
        }
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
        requireValue(typeof app.renderer.prepare?.upload === 'function',
          'PixiJS GPU preparation system not installed');
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
        if (game().s.mode !== 'arena') createBackgroundPainter();
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
        if (game().s.mode === 'arena') {
          // GPU arena is opt-in; even there, never preload the scenery collection.
          // Enemy, hero, party, pet and specialist artwork stays available.
          for (const [key, entry] of Object.entries(manifest.sprites))
            if (!/^(?:prop|building|structure|terrain):/.test(key)) collect(entry);
        } else collect(manifest.sprites);
        requireValue(urls.size > 0, 'Approved sprite manifest is empty');
        requireValue(urls.size <= 128, 'Unexpected sprite resource count');
        stage = 'sprite-preload';
        const approvedTextures = [];
        const preloadStarted = measureNow();
        await Promise.all(
          [...urls].map(async (src) => {
            const texture = await PIXI.Assets.load(src);
            requireValue(texture?.source, 'Approved sprite decode failed: ' + src);
            texture.source.scaleMode = 'nearest';
            scene.registerTexture(src, texture);
            loaded.add(src);
            approvedTextures.push(texture);
          }),
        );
        startupSpritePreloadMs = Math.max(0, measureNow() - preloadStarted);
        stage = 'gpu-approved-upload';
        if (!await prepareGpuTextures(thisEpoch, approvedTextures, 'approved')) return false;
        stage = 'first-scene';
        const firstSceneStarted = measureNow();
        drawBackground();
        actorFrame();
        syncAtmosphere();
        scene.draw();
        startupFirstSceneMs = Math.max(0, measureNow() - firstSceneStarted);
        // Any Pixi activation (not only a later native zone transition) must
        // preload the complete currently admitted region while the renderer
        // guard still presents its preparation panel. warmArrival() reuses
        // these same tiles rather than painting a second copy on Continue.
        stage = 'region-terrain-preparation';
        if (!await prepareTerrainTiles(thisEpoch)) return false;
        stage = 'region-art-preparation';
        if (!await warmNeighborhood(thisEpoch, true)) return false;
        stage = 'gpu-procedural-upload';
        if (!await prepareGpuTextures(thisEpoch, [...baked.values()].map((body) => body.texture),
          'procedural')) return false;
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
        // Sampling is silent outside explicitly selected developer mode.
        const observe = game()?.s?.mode === 'developer' &&
          ++developerDrawFrames % drawCpuSampleEvery === 0;
        const row = observe ? {} : null;
        let stamp = observe ? measureNow() : 0;
        // Ordinary frames must not allocate a recording callback.
        const record = row ? (name) => {
          const next = measureNow();
          row[name] = Math.max(0, next - stamp);
          stamp = next;
        } : null;
        stage = 'viewport-check';
        syncViewport();
        if (record) record('viewport');
        stage = 'resolution';
        syncResolution();
        if (record) record('resolution');
        stage = 'background';
        syncBackground();
        if (record) record('background');
        stage = 'actors';
        actorFrame();
        if (record) record('actors');
        stage = 'atmosphere';
        syncAtmosphere();
        if (record) record('atmosphere');
        stage = 'scene-render';
        scene.draw();
        if (record) record('scene');
        if (row) {
          drawCpuSamples.push(row);
          if (drawCpuSamples.length > 120) drawCpuSamples.shift();
        }
        queuePredictiveWarm(game());
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
      predictionAnchor = null;
    }
    function deactivate() {
      active = false;
      if (app?.canvas) app.canvas.style.display = 'none';
    }
    function disposeResources() {
      dropBackgroundLookahead(true);
      if (predictiveIdle !== null) root.cancelIdleCallback?.(predictiveIdle);
      predictiveIdle = null;
      predictionAnchor = null;
      ++contextEpoch; // Cancel any asynchronous neighborhood preparation.
      cancelGpuPreparation?.();
      cancelGpuPreparation = null;
      deactivate();
      releaseCrownLootTexture();
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
      terrainAtlas = null;
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
      warmArrival,
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
        drawCpuProfile: drawCpuReport(),
        loadedTextures: loaded.size,
        proceduralBytes: imageBytes,
        proceduralTextures: baked.size,
        proceduralEvictions,
        proceduralCacheEvictions,
        proceduralBakes,
        proceduralCacheHits,
        sharedProceduralHits,
        backgroundRepaints,
        terrainTilesPrepared,
        terrainTileReuses,
        cachedTerrainRegion: terrainAtlas?.region || null,
        cachedTerrainZones: [...(terrainAtlas?.zones.keys() || [])],
        backgroundLookaheadPaints,
        backgroundLookaheadPromotions,
        backgroundLookaheadMisses,
        backgroundLookaheadFailures,
        backgroundLookaheadSkips: { ...backgroundLookaheadSkips },
        backgroundLookaheadPaintMs,
        backgroundLookaheadPromoteMs,
        maxBackgroundLookaheadPromoteMs,
        backgroundLookaheadBytes: aheadCanvas ? aheadCanvas.width * aheadCanvas.height * 4 : 0,
        neighborhoodPrepared,
        neighborhoodWarmupMs,
        syncProceduralBakeMs,
        maxProceduralBakeMs,
        syncBackgroundPaintMs,
        maxBackgroundPaintMs,
        startupSpritePreloadMs,
        startupFirstSceneMs,
        approvedGpuPrepared,
        proceduralGpuPrepared,
        gpuPreparationMs,
        gpuPreparationBatches,
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
