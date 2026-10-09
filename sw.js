/* Bump CACHE_VERSION when app assets change. Tester builds activate immediately. */
const CACHE_VERSION = "azeroth-app-v0.8.123";
/* Shared sprite/variant/clip resource contract: runtime, packaging and offline caching. */
(function (root) {
  'use strict';
  const LIMITS = Object.freeze({
    decodedBytes: 16 * 1024 * 1024,
    concurrent: 2,
    resourcePixels: 1024 * 1024,
  });
  const local = (src) =>
    typeof src === 'string' &&
    /^\.\/assets\/sprites\/[a-zA-Z0-9_/-]+\.(png|webp)$/.test(src) &&
    !src.includes('..');
  const positive = (n) => Number.isFinite(n) && n > 0;
  function resource(value) {
    const item = typeof value === 'string' ? { src: value } : value;
    if (!item || !local(item.src)) throw Error('Missing or invalid sprite resource');
    if (
      (item.width !== undefined || item.height !== undefined) &&
      (![item.width, item.height].every((n) => Number.isInteger(n) && n > 0) ||
        item.width * item.height > LIMITS.resourcePixels)
    )
      throw Error('Invalid sprite resource dimensions');
    if (item.hash !== undefined && !/^[a-f0-9]{64}$/.test(item.hash))
      throw Error('Invalid sprite content hash');
    return { ...item };
  }
  function entry(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw Error('Invalid sprite entry');
    const out = {
      ...value,
      ...resource({ src: value.src, width: value.width, height: value.height, hash: value.hash }),
    };
    for (const field of ['displayWidth', 'displayHeight', 'scale', 'labelHeight', 'overlayScale'])
      if (out[field] !== undefined && !positive(out[field])) throw Error('Invalid sprite ' + field);
    for (const field of ['anchorX', 'anchorY'])
      if (
        out[field] !== undefined &&
        !(Number.isFinite(out[field]) && out[field] >= 0 && out[field] <= 1)
      )
        throw Error('Invalid sprite anchor');
    if (out.variants !== undefined) {
      if (!Array.isArray(out.variants) || !out.variants.length || out.variants.length > 64)
        throw Error('Invalid sprite variants');
      out.variants = out.variants.map(resource);
      if (
        out.variants.some((v) => !/^[a-z0-9][a-z0-9-]*$/.test(v.id || '')) ||
        new Set(out.variants.map((v) => v.id)).size !== out.variants.length
      )
        throw Error('Invalid stable variant IDs');
      if (new Set(out.variants.map((v) => v.src)).size !== out.variants.length)
        throw Error('Duplicate sprite variant');
    }
    if (out.variantSelector !== undefined) {
      const selector = out.variantSelector;
      if (
        !selector ||
        selector.kind !== 'procedural-modulo' ||
        !Number.isInteger(selector.modulo) ||
        selector.modulo < 1 ||
        selector.modulo > 64 ||
        !Array.isArray(selector.slots) ||
        selector.slots.length !== selector.modulo ||
        !out.variants ||
        selector.slots.some((id) => !out.variants.some((v) => v.id === id))
      )
        throw Error('Invalid procedural variant selector');
      out.variantSelector = { ...selector, slots: [...selector.slots] };
    }
    if (out.clips !== undefined) {
      if (!out.clips || typeof out.clips !== 'object' || Array.isArray(out.clips))
        throw Error('Invalid sprite clips');
      out.clips = Object.fromEntries(
        Object.entries(out.clips).map(([name, clip]) => {
          if (
            !/^[a-z][a-z0-9-]*(?::[a-z-]+)?$/.test(name) ||
            !clip ||
            typeof clip.loop !== 'boolean' ||
            !Array.isArray(clip.frames) ||
            !clip.frames.length ||
            clip.frames.length > 120
          )
            throw Error('Invalid sprite clip');
          const frames = clip.frames.map((frame) => {
            const f = { ...frame, ...resource(frame) };
            if (
              !Array.isArray(f.rect) ||
              f.rect.length !== 4 ||
              !f.rect.every(Number.isInteger) ||
              f.rect[0] < 0 ||
              f.rect[1] < 0 ||
              f.rect[2] <= 0 ||
              f.rect[3] <= 0 ||
              !f.width ||
              !f.height ||
              f.rect[0] + f.rect[2] > f.width ||
              f.rect[1] + f.rect[3] > f.height
            )
              throw Error('Invalid sprite frame rectangle');
            if (
              !positive(f.durationMs) ||
              f.durationMs > 10000 ||
              !Array.isArray(f.pivot) ||
              f.pivot.length !== 2 ||
              !f.pivot.every(Number.isFinite) ||
              f.pivot[0] < 0 ||
              f.pivot[0] > f.rect[2] ||
              f.pivot[1] < 0 ||
              f.pivot[1] > f.rect[3]
            )
              throw Error('Invalid sprite frame timing/pivot');
            return { ...f, rect: [...f.rect], pivot: [...f.pivot] };
          });
          return [name, { loop: clip.loop, frames }];
        }),
      );
    }
    return out;
  }
  function entries(manifest) {
    if (
      !manifest ||
      !manifest.sprites ||
      typeof manifest.sprites !== 'object' ||
      Array.isArray(manifest.sprites)
    )
      throw Error('Invalid sprite manifest');
    return Object.fromEntries(
      Object.entries(manifest.sprites).map(([key, value]) => {
        if (!/^[a-z][a-z0-9-]*(?::[a-z0-9_-]+)+$/.test(key)) throw Error('Invalid sprite key');
        return [key, entry(value)];
      }),
    );
  }
  function resources(manifest) {
    const unique = new Map();
    for (const value of Object.values(entries(manifest))) {
      const items = [
        value,
        ...(value.variants || []),
        ...Object.values(value.clips || {}).flatMap((c) => c.frames),
      ];
      for (const item of items) {
        const r = resource(item),
          old = unique.get(r.src);
        if (old && (old.width !== r.width || old.height !== r.height || old.hash !== r.hash))
          throw Error('Conflicting sprite resource metadata');
        unique.set(r.src, r);
      }
    }
    return [...unique.values()];
  }
  const api = {
    LIMITS,
    local,
    entry,
    entries,
    resources,
    sources: (m) => resources(m).map((r) => r.src),
  };
  root.PrototypeSpriteFormat = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

const CACHE_PREFIX = 'azeroth-app-';
const APP_FILES = ["./","./index.html","./prototype.html","./phone.html","./styles/prototype.css","./styles/desktop.css","./styles/phone.css","./src/sprint.js","./src/prototype/data.js","./src/prototype/rules.js","./src/prototype/world.js","./src/prototype/navigation.js","./src/prototype/progression.js","./src/prototype/save.js","./src/prototype/combat.js","./src/prototype/hero-combat.js","./src/prototype/boss-combat.js","./src/prototype/party.js","./src/prototype/economy.js","./src/prototype/narration.js","./src/prototype/rewards.js","./src/prototype/enemy-presentation.js","./src/prototype/enemy-vfx.js","./src/prototype/enemy-vfx-events.js","./src/prototype/engine.js","./src/prototype/audio-catalog.js","./src/prototype/audio-contract.js","./src/prototype/audio-library.js","./src/prototype/audio-assets.js","./src/prototype/audio-mixer.js","./src/prototype/audio-runtime.js","./src/prototype/audio-score.js","./src/prototype/audio-enemy.js","./src/prototype/audio-effects.js","./src/prototype/audio-recordings.js","./src/prototype/audio-production.js","./src/prototype/audio-environment.js","./src/prototype/audio.js","./src/prototype/visuals.js","./src/prototype/combat-visuals.js","./src/prototype/enemy-vfx-art.js","./src/prototype/sprite-format.js","./src/prototype/sprites.js","./src/prototype/material-contract.js","./src/prototype/materials.js","./src/prototype/build-info.js","./src/prototype/persistence.js","./src/prototype/platform.js","./src/prototype/input.js","./src/prototype/runtime.js","./src/prototype/renderer.js","./src/prototype/archive.js","./src/prototype/menus.js","./src/prototype/app.js","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./assets/sprites/manifest.json","./assets/vfx/manifest.json","./assets/materials/manifest.json","./assets/materials/a1fa0f5fb4fb2f203147fa8ebce4c4a1703dd7161890e69df4592e0e1d6f4334.png","./assets/materials/b1782a435760ed6bce0e5b1b5ad87ae8709ac22ae21c880e0b6a70bf13712276.png","./assets/materials/e108c18f0c95bcd577a0cf6a802a33847162af9276d3336be5d9f3b9abbae09d.png","./assets/materials/bf8577c52fb47274c71ce2e8c73c98c66a2515d5b62a89120156e5749c3a4ba7.png","./assets/materials/7985f36f485ad35a0b55907cbb099bd4656695f5b4377373bdeba23f727eb3b2.png","./tools/audio/index.html","./tools/audio/audition.css","./tools/audio/audition.js","./tools/audio/fixtures.js","./assets/audio/manifest.json","./assets/audio/music/place-vale.mp3","./assets/audio/music/action-vale.mp3","./assets/audio/music/peace-vale.mp3","./assets/audio/music/place-march.mp3","./assets/audio/music/action-march.mp3","./assets/audio/music/peace-march.mp3","./assets/audio/music/place-highlands.mp3","./assets/audio/music/action-highlands.mp3","./assets/audio/music/peace-highlands.mp3","./assets/audio/music/place-frontier.mp3","./assets/audio/music/action-frontier.mp3","./assets/audio/music/peace-frontier.mp3","./assets/audio/music/place-crown.mp3","./assets/audio/music/action-crown.mp3","./assets/audio/music/peace-crown.mp3","./assets/audio/music/place-crypt.mp3","./assets/audio/music/action-crypt.mp3","./assets/audio/music/peace-crypt.mp3","./assets/audio/music/place-archive.mp3","./assets/audio/music/action-archive.mp3","./assets/audio/music/peace-archive.mp3","./assets/audio/music/place-mine.mp3","./assets/audio/music/action-mine.mp3","./assets/audio/music/peace-mine.mp3","./assets/audio/music/place-abyss.mp3","./assets/audio/music/action-abyss.mp3","./assets/audio/music/peace-abyss.mp3","./assets/audio/music/place-citadel.mp3","./assets/audio/music/action-citadel.mp3","./assets/audio/music/peace-citadel.mp3","./assets/audio/music/interior-supply-vale.mp3","./assets/audio/music/interior-supply-march.mp3","./assets/audio/music/interior-supply-highlands.mp3","./assets/audio/music/interior-supply-crown.mp3","./assets/audio/music/interior-side-vale-cellars.mp3","./assets/audio/music/interior-side-march-watchhouse.mp3","./assets/audio/music/interior-side-highlands-signal.mp3","./assets/audio/music/interior-side-frontier-shrine.mp3","./assets/audio/music/interior-side-crown-foundry.mp3","./assets/audio/music/boss-thorn.mp3","./assets/audio/music/boss-thorn-true.mp3","./assets/audio/music/boss-crypt.mp3","./assets/audio/music/boss-crypt-true.mp3","./assets/audio/music/boss-mire.mp3","./assets/audio/music/boss-mire-true.mp3","./assets/audio/music/boss-archive.mp3","./assets/audio/music/boss-archive-true.mp3","./assets/audio/music/boss-ridge.mp3","./assets/audio/music/boss-ridge-true.mp3","./assets/audio/music/boss-mine.mp3","./assets/audio/music/boss-mine-true.mp3","./assets/audio/music/boss-warlord.mp3","./assets/audio/music/boss-warlord-true.mp3","./assets/audio/music/boss-abyss.mp3","./assets/audio/music/boss-abyss-true.mp3","./assets/audio/music/boss-citadel.mp3","./assets/audio/music/boss-citadel-true.mp3","./assets/audio/music/boss-cindermaw.mp3","./assets/audio/music/boss-cindermaw-true.mp3","./assets/audio/music/boss-darklord.mp3","./assets/audio/music/boss-darklord-true.mp3","./assets/audio/music/title.mp3","./assets/audio/music/finale.mp3","./assets/audio/music/defeat.mp3","./assets/audio/music/peace-interior-supply-vale.mp3","./assets/audio/music/peace-interior-supply-march.mp3","./assets/audio/music/peace-interior-supply-highlands.mp3","./assets/audio/music/peace-interior-supply-crown.mp3","./assets/audio/music/peace-interior-side-vale-cellars.mp3","./assets/audio/music/peace-interior-side-march-watchhouse.mp3","./assets/audio/music/peace-interior-side-highlands-signal.mp3","./assets/audio/music/peace-interior-side-frontier-shrine.mp3","./assets/audio/music/peace-interior-side-crown-foundry.mp3","./assets/audio/music/settlement-vale.mp3","./assets/audio/music/night-vale.mp3","./assets/audio/music/settlement-march.mp3","./assets/audio/music/night-march.mp3","./assets/audio/music/settlement-highlands.mp3","./assets/audio/music/night-highlands.mp3","./assets/audio/music/settlement-frontier.mp3","./assets/audio/music/night-frontier.mp3","./assets/audio/music/settlement-crown.mp3","./assets/audio/music/night-crown.mp3","./assets/audio/ambience/env-woodland-day.mp3","./assets/audio/ambience/env-woodland-night.mp3","./assets/audio/ambience/env-marsh-day.mp3","./assets/audio/ambience/env-marsh-night.mp3","./assets/audio/ambience/env-highland-wind.mp3","./assets/audio/ambience/env-frontier-air.mp3","./assets/audio/ambience/env-crown-courtyard.mp3","./assets/audio/ambience/env-home.mp3","./assets/audio/ambience/env-retreat.mp3","./assets/audio/ambience/env-archive.mp3","./assets/audio/ambience/env-mine.mp3","./assets/audio/ambience/env-dragon-hall.mp3","./assets/audio/ambience/env-citadel.mp3","./assets/audio/ambience/env-cellar.mp3","./assets/audio/effects/sfx-steel-release.wav","./assets/audio/effects/sfx-steel-impact.wav","./assets/audio/effects/sfx-claw-release.wav","./assets/audio/effects/sfx-claw-impact.wav","./assets/audio/effects/sfx-bone-release.wav","./assets/audio/effects/sfx-bone-impact.wav","./assets/audio/effects/sfx-stone-release.wav","./assets/audio/effects/sfx-stone-impact.wav","./assets/audio/effects/sfx-wet-release.wav","./assets/audio/effects/sfx-wet-impact.wav","./assets/audio/effects/sfx-arrow-release.wav","./assets/audio/effects/sfx-arrow-impact.wav","./assets/audio/effects/sfx-spectral-release.wav","./assets/audio/effects/sfx-spectral-impact.wav","./assets/audio/effects/sfx-ash-release.wav","./assets/audio/effects/sfx-ash-impact.wav","./assets/audio/effects/sfx-holy-release.wav","./assets/audio/effects/sfx-holy-impact.wav","./assets/audio/effects/sfx-arcane-release.wav","./assets/audio/effects/sfx-arcane-impact.wav","./assets/audio/effects/sfx-root-release.wav","./assets/audio/effects/sfx-root-impact.wav","./assets/audio/effects/sfx-dust-release.wav","./assets/audio/effects/sfx-dust-impact.wav","./assets/audio/effects/sfx-critical-warning.wav","./assets/audio/effects/sfx-hero-steel-swing.wav","./assets/audio/effects/sfx-hero-steel-impact.wav","./assets/audio/effects/sfx-power-strike.wav","./assets/audio/effects/sfx-holy-cleave.wav","./assets/audio/effects/sfx-piercing-volley.wav"];
const LEGACY_FILES = ["./legacy.html","./rts.html","./styles/rts.css","./styles/game.css","./styles/app.css","./styles/keyboard.css","./src/rts-engine.js","./src/rts.js","./src/controls.js","./src/classes.js","./src/world.js","./src/squad.js","./src/game.js","./src/app.js"];
const appURL = path => new URL(path, self.registration.scope).href;
const appFiles = new Set(APP_FILES.map(appURL));
const legacyFiles = new Set(LEGACY_FILES.map(appURL));
const spriteBase = appURL('./assets/sprites/');
async function spriteAssetURLs(cache){
    try {
        const response = await cache.match(appURL('./assets/sprites/manifest.json'));
        if (!response) return [];
        const manifest = await response.json();
        return [...new Set(PrototypeSpriteFormat.sources(manifest).map(appURL))];
    } catch (_) { return []; }
}
self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_VERSION);
        await cache.addAll([...appFiles].map(url => new Request(url, { cache: 'reload' })));
        const sprites = await spriteAssetURLs(cache);
        if (sprites.length) await cache.addAll(sprites.map(url => new Request(url, { cache: 'reload' })));
        await self.skipWaiting();
    })());
});
self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
    const request = event.request, url = new URL(request.url), scope = new URL(self.registration.scope);
    if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
    const key = new URL(url); key.search = ''; key.hash = '';
    const isNavigation = request.mode === 'navigate';
    const navigationKey = appFiles.has(key.href) && key.pathname.endsWith('.html') ? key.href : key.pathname.endsWith('/phone.html') ? appURL('./phone.html') : key.pathname.endsWith('/legacy.html') ? appURL('./legacy.html') : key.pathname.endsWith('/prototype.html') ? appURL('./prototype.html') : key.pathname === appURL('./rts.html').replace(scope.origin, '') ? appURL('./rts.html') : appURL('./index.html');
    const isSprite = key.href.startsWith(spriteBase);
    if (!isNavigation && !appFiles.has(key.href) && !legacyFiles.has(key.href) && !isSprite) return;
    event.respondWith(caches.open(CACHE_VERSION).then(async cache => {
        const cached = await cache.match(isNavigation ? navigationKey : key.href);
        if (cached) return cached;
        try {
            // Historical games are independent and are downloaded only when opened.
            if(isNavigation && legacyFiles.has(navigationKey)) {
                await cache.addAll([...legacyFiles].map(url => new Request(url, { cache: 'reload' })));
                return await cache.match(navigationKey);
            }
            const response=await fetch(request);
            if(response.ok)await cache.put(key.href,response.clone());
            return response;
        }
        catch (_) { return new Response('Open this game online once to prepare it for offline play.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
    }));
});
