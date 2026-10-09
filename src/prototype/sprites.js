/* Bounded optional sprites. Simulation and saved state remain engine-owned. */
(function (root) {
  'use strict';

  const DEFAULT_MANIFEST = './assets/sprites/manifest.json';
  const Format =
    root.PrototypeSpriteFormat ||
    (typeof require === 'function' ? require('./sprite-format.js') : null);
  let manifest = { version: 2, sprites: {} },
    epoch = 0,
    manifestRequest = 0;
  const images = new Map(),
    loading = new Map(),
    failed = new Set(),
    queue = [],
    pins = new Set();
  let active = new Map(),
    bytes = 0,
    reserved = 0,
    decoding = 0,
    tick = 0,
    inFrame = false;
  let budget = Format.LIMITS.decodedBytes,
    concurrency = Format.LIMITS.concurrent;
  let clock = 0,
    pausedClock = false,
    states = new WeakMap();
  const events = new Map();
  const counters = {
    evictions: 0,
    staleLoads: 0,
    invalidPresentation: 0,
    budgetSkips: 0,
    peakDecodedBytes: 0,
    peakReservedBytes: 0,
    peakConcurrent: 0,
  };
  const identity = (r) =>
    (r.hash ? 'sha256:' + r.hash : r.src) + ':' + (r.width || '') + 'x' + (r.height || '');
  const estimate = (r) =>
    r.width && r.height ? r.width * r.height * 4 : Format.LIMITS.resourcePixels * 4;

  const clean = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  const regionKey = (region) =>
    ['vale', 'march', 'highlands', 'frontier', 'crown'][region] || 'vale';

  function enemyKey(e) {
    const base = 'enemy:' + clean(e.species || e.family || e.type);
    if (e.captain || e.roomCaptain || e.fieldCaptain) {
      const tags = ['captain'];
      if (e.hybrid) tags.push('hybrid');
      if (e.ranged) tags.push('ranged');
      if (e.guard) tags.push('guard');
      return base + ':' + tags.join('-');
    }
    const tags = [];
    if (e.hybrid) tags.push('hybrid');
    if (e.ranged) tags.push('ranged');
    if (e.guard) tags.push('guard');
    return tags.length ? base + ':' + tags.join('-') : base;
  }

  function candidateKeys(e, region = 0, rescued = false) {
    if (!e || e.presentation === 'workstation' || e.sceneRole) return [];
    const kind = e.renderKind;
    if (kind === 'hero') return ['hero:' + clean(e.class)];
    if (kind === 'ally') return ['ally:' + clean(e.class || e.type || 'worker')];
    if (kind === 'enemy') {
      if (e.type === 'boss') return ['boss:' + clean(e.family)];
      return [enemyKey(e)];
    }
    if (kind === 'npc') {
      if (e.kind === 'cage' && e.workstation === 'equipment-repair') return [];
      if (e.kind === 'cage')
        return ['cage:' + clean(e.family) + ':' + (rescued ? 'open' : 'closed')];
      if (e.family && ['teacher', 'smith', 'alchemist'].includes(e.kind))
        return ['specialist:' + clean(e.family)];
      if (e.kind === 'dungeon' || e.kind === 'exit') return ['dungeon:' + clean(e.family)];
      if (e.kind === 'transport') return ['transport:' + clean(e.name || e.icon || 'regional')];
      if (e.kind === 'mini') return ['site:mini:' + regionKey(region)];
      if (e.kind === 'landmark') return ['landmark:' + clean(e.id || e.name)];
      return ['npc:' + clean(e.kind) + ':' + regionKey(region)];
    }
    if (kind === 'building') {
      const state =
        Number.isFinite(e.progress) && e.progress < 4 ? 'construction' : e.full ? 'full' : 'basic';
      return ['building:barracks:' + regionKey(region) + ':' + state];
    }
    if (kind === 'node')
      return ['node:' + clean(e.name || e.icon || 'resource') + ':' + regionKey(region)];
    if (kind === 'prop') {
      if (e.decorative) return ['prop:' + clean(e.structure) + ':' + regionKey(region)];
      if (e.structure) return ['prop:' + clean(e.structure) + ':' + regionKey(region)];
      return ['prop:' + (e.icon === '🪨' ? 'rock' : 'wild') + ':' + regionKey(region)];
    }
    return [];
  }

  function installManifest(next) {
    let parsed, resources;
    try {
      if (next?.formatVersion !== undefined && next.formatVersion !== 3) return false;
      try {
        parsed = Format.entries(next);
      } catch (error) {
        if (!next?.sprites || Array.isArray(next.sprites) || typeof next.sprites !== 'object')
          return false;
        parsed = Format.entries({
          ...next,
          sprites: Object.fromEntries(
            Object.entries(next.sprites).map(([key, value]) => {
              try {
                return [key, Format.entry(value)];
              } catch (_) {
                const staticEntry = Format.entry({
                  ...value,
                  clips: undefined,
                  variants: undefined,
                });
                counters.invalidPresentation++;
                return [key, staticEntry];
              }
            }),
          ),
        });
      }
      resources = Format.resources({ ...next, sprites: parsed });
    } catch (_) {
      return false;
    }
    const nextActive = new Map(resources.map((r) => [identity(r), r]));
    epoch++;
    manifestRequest++;
    manifest = { version: Number(next.version) || 2, sprites: parsed };
    active = nextActive;
    failed.clear();
    pins.clear();
    states = new WeakMap();
    events.clear();
    for (const [id, item] of images)
      if (!active.has(id)) {
        images.delete(id);
        bytes -= item.bytes;
      }
    for (let i = queue.length - 1; i >= 0; i--)
      if (!active.has(queue[i].id)) {
        const job = queue.splice(i, 1)[0];
        loading.delete(job.id);
        job.resolve(null);
      }
    if (!inFrame) pump();
    return true;
  }
  function definitionFor(e, region = 0, rescued = false) {
    // Military officers have a distinct procedural finish, not the generic monster crown.
    if (e?.form === 'ringleader' && ['orc', 'archer', 'crownguard'].includes(e.species))
      return null;
    for (const key of candidateKeys(e, region, rescued)) {
      const entry = manifest.sprites[key];
      if (entry?.src) return { key, entry };
    }
    return null;
  }
  function room(size) {
    if (size > budget) return false;
    while (bytes + reserved + size > budget) {
      const candidates = [...images.entries()]
        .filter(([id]) => !pins.has(id))
        .sort((a, b) => a[1].used - b[1].used);
      if (!candidates.length) return false;
      const [id, old] = candidates[0];
      images.delete(id);
      bytes -= old.bytes;
      counters.evictions++;
    }
    return true;
  }
  function pump() {
    if (inFrame || typeof root.Image !== 'function') return;
    for (let i = 0; i < queue.length && decoding < concurrency; ) {
      const job = queue[i],
        size = estimate(job.resource);
      if (!room(size)) {
        counters.budgetSkips++;
        queue.splice(i, 1);
        loading.delete(job.id);
        job.resolve(null);
        continue;
      }
      queue.splice(i, 1);
      reserved += size;
      decoding++;
      counters.peakReservedBytes = Math.max(counters.peakReservedBytes, bytes + reserved);
      counters.peakConcurrent = Math.max(counters.peakConcurrent, decoding);
      const img = new root.Image();
      let finished = false;
      const done = (ok) => {
        if (finished) return;
        finished = true;
        reserved -= size;
        decoding--;
        loading.delete(job.id);
        const width = img.naturalWidth || img.width,
          height = img.naturalHeight || img.height,
          decoded = width * height * 4;
        if (!active.has(job.id)) {
          counters.staleLoads++;
          ok = false;
        } else if (
          ok &&
          (!Number.isInteger(width) ||
            !Number.isInteger(height) ||
            width <= 0 ||
            height <= 0 ||
            width * height > Format.LIMITS.resourcePixels ||
            decoded > size ||
            (job.resource.width &&
              (width !== job.resource.width || height !== job.resource.height)))
        ) {
          failed.add(job.id);
          ok = false;
        } else if (!ok) failed.add(job.id);
        if (ok && room(decoded)) {
          images.set(job.id, { image: img, bytes: decoded, used: ++tick });
          bytes += decoded;
          counters.peakDecodedBytes = Math.max(counters.peakDecodedBytes, bytes);
          job.resolve(img);
        } else job.resolve(null);
        pump();
      };
      img.decoding = 'async';
      img.onload = () => {
        try {
          Promise.resolve(typeof img.decode === 'function' ? img.decode() : null).then(
            () => done(true),
            () => done(false),
          );
        } catch (_) {
          done(false);
        }
      };
      img.onerror = () => done(false);
      try {
        img.src = job.resource.src;
      } catch (_) {
        done(false);
      }
    }
  }
  function ensure(resource) {
    const id = identity(resource);
    const cached = images.get(id);
    if (cached) {
      cached.used = ++tick;
      return Promise.resolve(cached.image);
    }
    if (failed.has(id) || typeof root.Image !== 'function') return Promise.resolve(null);
    if (loading.has(id)) return loading.get(id);
    if (estimate(resource) > budget) {
      counters.budgetSkips++;
      return Promise.resolve(null);
    }
    let resolve;
    const promise = new Promise((r) => {
      resolve = r;
    });
    loading.set(id, promise);
    queue.push({ id, resource, resolve });
    if (!inFrame) pump();
    return promise;
  }
  async function warm(keys = [], options = {}) {
    const pending = [];
    for (const key of keys) {
      const entry = manifest.sprites[key];
      if (!entry) continue;
      pending.push(ensure(entry));
      if (options.variants)
        for (const resource of entry.variants || []) pending.push(ensure(resource));
      if (options.clips)
        for (const clip of Object.values(entry.clips || {}))
          for (const frame of clip.frames) pending.push(ensure(frame));
    }
    await Promise.allSettled(pending);
    return status();
  }
  async function preload(url = DEFAULT_MANIFEST, keys = []) {
    const request = ++manifestRequest;
    if (typeof root.fetch === 'function') {
      try {
        const response = await root.fetch(url, { cache: 'no-cache' });
        if (response.ok) {
          const next = await response.json();
          if (request === manifestRequest) installManifest(next);
        }
      } catch (_) {}
    }
    await warm(keys);
    return manifest;
  }
  function configure(options = {}) {
    const size = options.decodedBytes ?? budget,
      count = options.concurrent ?? concurrency;
    if (
      !Number.isInteger(size) ||
      size < 16 ||
      size > Format.LIMITS.decodedBytes ||
      !Number.isInteger(count) ||
      count < 1 ||
      count > Format.LIMITS.concurrent ||
      decoding
    )
      return false;
    pins.clear();
    if (!room(0) || reserved > size) return false;
    budget = size;
    concurrency = count;
    room(0);
    return true;
  }
  function beginFrame() {
    inFrame = true;
    pins.clear();
  }
  function endFrame() {
    inFrame = false;
    pump();
  }
  function advance(ms, paused = false) {
    pausedClock = paused;
    if (!paused && Number.isFinite(ms) && ms >= 0) clock += Math.min(ms, 100);
  }
  function noteEvents(list) {
    for (const e of list || []) {
      const who =
        e.type === 'hurt' ? e.target : ['swing', 'shot', 'cast'].includes(e.type) ? e.actor : null;
      if (who) events.set(who, { state: e.type === 'hurt' ? 'hurt' : 'attack', at: clock });
    }
    for (const [id, e] of events) if (clock - e.at > 10000) events.delete(id);
    while (events.size > 256) events.delete(events.keys().next().value);
  }
  function phase(e, entry) {
    const actor = e.spriteIdentity || e,
      old = states.get(actor);
    if (pausedClock && old) return { name: old.state, elapsed: clock - old.at };
    const dx = old ? e.x - old.x : 0,
      dy = old ? e.y - old.y : 0;
    const event = events.get(e.renderKind === 'hero' ? 'hero' : e.id);
    let name =
      e.spriteClip ||
      (e.hp <= 0
        ? 'death'
        : old && e.hp < old.hp
          ? 'hurt'
          : e.telegraph
            ? 'windup'
            : Math.hypot(dx || 0, dy || 0) > 0.01
              ? 'walk'
              : 'idle');
    if (event) {
      const clip = entry.clips?.[event.state],
        duration = clip?.frames.reduce((sum, f) => sum + f.durationMs, 0) || 0;
      if (clock - event.at < duration) name = event.state;
    }
    const facing =
      e.spriteFacing ||
      (Math.hypot(dx || 0, dy || 0) > 0.01
        ? Math.abs(dx) > Math.abs(dy)
          ? dx > 0
            ? 'east'
            : 'west'
          : dy > 0
            ? 'south'
            : 'north'
        : old?.facing || 'south');
    const selected = entry.clips?.[name + ':' + facing] ? name + ':' + facing : name;
    const at = old?.state === selected ? old.at : event?.state === name ? event.at : clock;
    states.set(actor, { x: e.x, y: e.y, hp: e.hp, state: selected, at, facing });
    return { name: selected, elapsed: clock - at };
  }
  function variant(e, entry) {
    if (!entry.variants) return entry;
    if (entry.variantSelector) {
      // Match visuals.js exactly so authored blade heights and moss locations
      // survive raster replacement. Existing banks retain rendezvous selection.
      const seed = String(e.id || e.name || e.species || e.family || e.kind || 'azeroth');
      let h = 2166136261;
      for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
      const selector = entry.variantSelector;
      return entry.variants.find((item) => item.id === selector.slots[(h >>> 0) % selector.modulo]);
    }
    const seed = String(e.spriteVariantSeed ?? e.seed ?? e.id ?? (e.x || 0) + ':' + (e.y || 0));
    let best = entry.variants[0],
      score = -1;
    for (const item of entry.variants) {
      let h = 2166136261;
      for (const ch of seed + '|' + item.id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
      if (h >>> 0 > score) {
        score = h >>> 0;
        best = item;
      }
    }
    return best;
  }
  function frameFor(clip, elapsed) {
    const duration = clip.frames.reduce((s, f) => s + f.durationMs, 0);
    let t = clip.loop ? elapsed % duration : Math.min(elapsed, duration - 0.001);
    for (const f of clip.frames) {
      if (t < f.durationMs) return f;
      t -= f.durationMs;
    }
    return clip.frames[clip.frames.length - 1];
  }
  function imageFor(resource) {
    const id = identity(resource);
    pins.add(id);
    const item = images.get(id);
    if (item) {
      item.used = ++tick;
      return item.image;
    }
    ensure(resource);
    return null;
  }

  function entityScale(e, entry) {
    const authored = Number(entry?.scale);
    const base = Number.isFinite(authored) && authored > 0 ? authored : 1;
    const entity = Number.isFinite(e?.visualScale) && e.visualScale > 0 ? e.visualScale : 1;
    const trueBoss = e?.type === 'boss' && e?.form === 'true' ? 1.14 : 1;
    return base * entity * trueBoss;
  }

  function overlay(ctx, e, p, entry, scale) {
    if (!e || !ctx) return;
    const fxScale = (Number(entry?.overlayScale) || 1) * scale;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const line = (pts, c, w = 2) => {
      ctx.strokeStyle = c;
      ctx.lineWidth = w * fxScale;
      ctx.beginPath();
      pts.forEach(([x, y], i) =>
        i ? ctx.lineTo(x * fxScale, y * fxScale) : ctx.moveTo(x * fxScale, y * fxScale),
      );
      ctx.stroke();
    };
    const poly = (pts, c) => {
      ctx.fillStyle = c;
      ctx.strokeStyle = '#25312d';
      ctx.lineWidth = 1.2 * fxScale;
      ctx.beginPath();
      pts.forEach(([x, y], i) =>
        i ? ctx.lineTo(x * fxScale, y * fxScale) : ctx.moveTo(x * fxScale, y * fxScale),
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };
    const rect = (x, y, w, h, c) =>
      poly(
        [
          [x, y],
          [x + w, y],
          [x + w, y + h],
          [x, y + h],
        ],
        c,
      );
    const glint = (x, y, c = '#f3d690', r = 2) => {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x * fxScale, y * fxScale, r * fxScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    if (e.rangedAim) {
      ctx.fillStyle = '#ead6a0';
      ctx.strokeStyle = '#25312d';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, -56 * fxScale, 5 * fxScale, 5 * fxScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    if (e.form === 'true') {
      ctx.save();
      ctx.globalAlpha = 0.48;
      ctx.strokeStyle = e.type === 'boss' ? '#fff0a6' : '#e5c876';
      ctx.lineWidth = (e.type === 'boss' ? 3 : 2) * fxScale;
      for (const r of e.type === 'boss' ? [30, 40, 50] : [23, 30]) {
        ctx.beginPath();
        ctx.ellipse(0, 11 * fxScale, r * fxScale, r * 0.28 * fxScale, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (e.type === 'boss') {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#f1c75e';
        ctx.beginPath();
        ctx.ellipse(0, -11 * fxScale, 34 * fxScale, 52 * fxScale, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      line(
        [
          [-19, 18],
          [-8, 23],
          [9, 23],
          [21, 17],
        ],
        '#e2c36f',
        e.type === 'boss' ? 3 : 2,
      );
      for (const x of [-17, 17])
        poly(
          [
            [x, -36],
            [x * 1.45, -54],
            [x * 0.48, -42],
          ],
          '#e1bd6d',
        );
      for (const x of [-11, 0, 11]) glint(x, -47, '#ffe7a8', e.type === 'boss' ? 2.4 : 1.3);
      if (e.type === 'boss') {
        poly(
          [
            [-22, -52],
            [-14, -66],
            [-7, -56],
            [0, -70],
            [7, -56],
            [14, -66],
            [22, -52],
          ],
          '#d7ad42',
        );
        for (const x of [-26, 26]) glint(x, -28, '#fff4bd', 2.8);
      }
    } else if (e.form === 'ringleader') {
      rect(-4, -47, 8, 8, '#d3b46c');
      poly(
        [
          [-12, -40],
          [-15, -49],
          [-5, -45],
          [0, -53],
          [5, -45],
          [15, -49],
          [12, -40],
        ],
        '#d3b46c',
      );
      for (const x of [-16, 16])
        line(
          [
            [x, -12],
            [x * 1.2, -24],
          ],
          '#d5b36e',
          2,
        );
      glint(0, -51, '#fff0b7', 1.5);
      if (e.frenzy) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = '#ef8c63';
        ctx.lineWidth = 2.5 * fxScale;
        for (const r of [25, 32]) {
          ctx.beginPath();
          ctx.ellipse(0, 10 * fxScale, r * fxScale, r * 0.27 * fxScale, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
        for (const x of [-19, 19]) glint(x, -21, '#ff9f6b', 2);
      }
    }
    ctx.restore();
  }

  function draw(ctx, e, p, region = 0, rescued = false) {
    const found = definitionFor(e, region, rescued);
    if (!found) return false;
    const { entry } = found,
      scale = entityScale(e, entry);
    const animation = phase(e, entry),
      clip = entry.clips?.[animation.name];
    const reduced =
      typeof root.matchMedia === 'function' &&
      root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = clip && !reduced ? frameFor(clip, animation.elapsed) : null;
    let resource = frame || variant(e, entry),
      img = imageFor(resource);
    if (!img && resource !== entry) {
      frame = null;
      resource = entry;
      img = imageFor(entry);
    }
    if (!img) return false;
    const width = frame?.rect[2] || img.naturalWidth || img.width,
      height = frame?.rect[3] || img.naturalHeight || img.height;
    const dw = (Number(entry.displayWidth) || width) * scale,
      dh = (Number(entry.displayHeight) || height) * scale;
    const ax = frame
      ? frame.pivot[0] / width
      : Number.isFinite(entry.anchorX)
        ? entry.anchorX
        : 0.5;
    const ay = frame
      ? frame.pivot[1] / height
      : Number.isFinite(entry.anchorY)
        ? entry.anchorY
        : 0.88;
    const dest = [
      Math.round(p.x - dw * ax),
      Math.round(p.y - dh * ay),
      Math.round(dw),
      Math.round(dh),
    ];
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (Number.isFinite(entry.opacity)) ctx.globalAlpha = entry.opacity;
    if (frame) ctx.drawImage(img, ...frame.rect, ...dest);
    else ctx.drawImage(img, ...dest);
    ctx.restore();
    overlay(ctx, e, p, entry, scale);
    return true;
  }

  function height(e, region = 0, rescued = false, fallback = 54) {
    const found = definitionFor(e, region, rescued);
    if (!found) return fallback;
    const entry = found.entry,
      scale = entityScale(e, entry),
      label = Number(entry.labelHeight),
      dh = Number(entry.displayHeight),
      ay = Number.isFinite(entry.anchorY) ? entry.anchorY : 0.88;
    if (Number.isFinite(label) && label > 0) return label * scale;
    if (Number.isFinite(dh) && dh > 0) return dh * ay * scale;
    return fallback;
  }

  function status() {
    return {
      manifestVersion: manifest.version,
      definitions: Object.keys(manifest.sprites).length,
      loaded: images.size,
      loading: decoding,
      queued: queue.length,
      failed: failed.size,
      decodedBytes: bytes,
      reservedBytes: reserved,
      maxDecodedBytes: budget,
      maxConcurrentDecodes: concurrency,
      clockMs: clock,
      ...counters,
    };
  }

  const api = {
    DEFAULT_MANIFEST,
    candidateKeys,
    installManifest,
    definitionFor,
    preload,
    warm,
    configure,
    beginFrame,
    endFrame,
    advance,
    noteEvents,
    frameFor,
    timeMs: () => clock,
    variant,
    draw,
    height,
    status,
    entityScale,
  };
  root.PrototypeSprites = api;
  if (typeof module !== 'undefined') module.exports = api;
  if (typeof document !== 'undefined') preload();
})(typeof globalThis !== 'undefined' ? globalThis : this);
