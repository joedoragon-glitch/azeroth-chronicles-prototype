/* Bump CACHE_VERSION when app assets change. Tester builds activate immediately. */
const CACHE_VERSION = "azeroth-app-v0.8.90";
const CACHE_PREFIX = 'azeroth-app-';
const APP_FILES = ["./","./index.html","./prototype.html","./phone.html","./styles/prototype.css","./styles/desktop.css","./styles/phone.css","./src/sprint.js","./src/prototype/data.js","./src/prototype/rules.js","./src/prototype/world.js","./src/prototype/navigation.js","./src/prototype/progression.js","./src/prototype/save.js","./src/prototype/combat.js","./src/prototype/hero-combat.js","./src/prototype/boss-combat.js","./src/prototype/party.js","./src/prototype/economy.js","./src/prototype/rewards.js","./src/prototype/engine.js","./src/prototype/audio-catalog.js","./src/prototype/audio-assets.js","./src/prototype/audio-mixer.js","./src/prototype/audio-runtime.js","./src/prototype/audio-score.js","./src/prototype/audio-effects.js","./src/prototype/audio-recordings.js","./src/prototype/audio-production.js","./src/prototype/audio.js","./src/prototype/visuals.js","./src/prototype/combat-visuals.js","./src/prototype/sprites.js","./src/prototype/build-info.js","./src/prototype/persistence.js","./src/prototype/platform.js","./src/prototype/input.js","./src/prototype/runtime.js","./src/prototype/renderer.js","./src/prototype/menus.js","./src/prototype/app.js","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./assets/sprites/manifest.json","./tools/audio/index.html","./tools/audio/audition.css","./tools/audio/audition.js","./tools/audio/fixtures.js","./assets/audio/manifest.json","./assets/audio/music/place-vale.mp3","./assets/audio/music/action-vale.mp3","./assets/audio/music/peace-vale.mp3","./assets/audio/music/place-march.mp3","./assets/audio/music/action-march.mp3","./assets/audio/music/peace-march.mp3","./assets/audio/music/place-highlands.mp3","./assets/audio/music/action-highlands.mp3","./assets/audio/music/peace-highlands.mp3","./assets/audio/music/place-frontier.mp3","./assets/audio/music/action-frontier.mp3","./assets/audio/music/peace-frontier.mp3","./assets/audio/music/place-crown.mp3","./assets/audio/music/action-crown.mp3","./assets/audio/music/peace-crown.mp3","./assets/audio/music/place-crypt.mp3","./assets/audio/music/action-crypt.mp3","./assets/audio/music/peace-crypt.mp3","./assets/audio/music/place-archive.mp3","./assets/audio/music/action-archive.mp3","./assets/audio/music/peace-archive.mp3","./assets/audio/music/place-mine.mp3","./assets/audio/music/action-mine.mp3","./assets/audio/music/peace-mine.mp3","./assets/audio/music/place-abyss.mp3","./assets/audio/music/action-abyss.mp3","./assets/audio/music/peace-abyss.mp3","./assets/audio/music/place-citadel.mp3","./assets/audio/music/action-citadel.mp3","./assets/audio/music/peace-citadel.mp3","./assets/audio/music/interior-supply-vale.mp3","./assets/audio/music/interior-supply-march.mp3","./assets/audio/music/interior-supply-highlands.mp3","./assets/audio/music/interior-supply-crown.mp3","./assets/audio/music/interior-side-vale-cellars.mp3","./assets/audio/music/interior-side-march-watchhouse.mp3","./assets/audio/music/interior-side-highlands-signal.mp3","./assets/audio/music/interior-side-frontier-shrine.mp3","./assets/audio/music/interior-side-crown-foundry.mp3","./assets/audio/music/boss-thorn.mp3","./assets/audio/music/boss-thorn-true.mp3","./assets/audio/music/boss-crypt.mp3","./assets/audio/music/boss-crypt-true.mp3","./assets/audio/music/boss-mire.mp3","./assets/audio/music/boss-mire-true.mp3","./assets/audio/music/boss-archive.mp3","./assets/audio/music/boss-archive-true.mp3","./assets/audio/music/boss-ridge.mp3","./assets/audio/music/boss-ridge-true.mp3","./assets/audio/music/boss-mine.mp3","./assets/audio/music/boss-mine-true.mp3","./assets/audio/music/boss-warlord.mp3","./assets/audio/music/boss-warlord-true.mp3","./assets/audio/music/boss-abyss.mp3","./assets/audio/music/boss-abyss-true.mp3","./assets/audio/music/boss-citadel.mp3","./assets/audio/music/boss-citadel-true.mp3","./assets/audio/music/boss-cindermaw.mp3","./assets/audio/music/boss-cindermaw-true.mp3","./assets/audio/music/boss-darklord.mp3","./assets/audio/music/boss-darklord-true.mp3","./assets/audio/music/title.mp3","./assets/audio/music/finale.mp3","./assets/audio/music/defeat.mp3","./assets/audio/music/peace-interior-supply-vale.mp3","./assets/audio/music/peace-interior-supply-march.mp3","./assets/audio/music/peace-interior-supply-highlands.mp3","./assets/audio/music/peace-interior-supply-crown.mp3","./assets/audio/music/peace-interior-side-vale-cellars.mp3","./assets/audio/music/peace-interior-side-march-watchhouse.mp3","./assets/audio/music/peace-interior-side-highlands-signal.mp3","./assets/audio/music/peace-interior-side-frontier-shrine.mp3","./assets/audio/music/peace-interior-side-crown-foundry.mp3","./assets/audio/music/settlement-vale.mp3","./assets/audio/music/night-vale.mp3","./assets/audio/music/settlement-march.mp3","./assets/audio/music/night-march.mp3","./assets/audio/music/settlement-highlands.mp3","./assets/audio/music/night-highlands.mp3","./assets/audio/music/settlement-frontier.mp3","./assets/audio/music/night-frontier.mp3","./assets/audio/music/settlement-crown.mp3","./assets/audio/music/night-crown.mp3"];
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
        return [...new Set(Object.values(manifest.sprites || {}).map(entry => entry && entry.src).filter(Boolean).map(appURL))];
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
