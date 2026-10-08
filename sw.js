/* Bump CACHE_VERSION when app assets change. Tester builds activate immediately. */
const CACHE_VERSION = "azeroth-app-v0.8.82";
const CACHE_PREFIX = 'azeroth-app-';
const APP_FILES = ["./","./index.html","./prototype.html","./phone.html","./styles/prototype.css","./styles/desktop.css","./styles/phone.css","./src/sprint.js","./src/prototype/data.js","./src/prototype/rules.js","./src/prototype/world.js","./src/prototype/navigation.js","./src/prototype/engine.js","./src/prototype/audio.js","./src/prototype/visuals.js","./src/prototype/combat-visuals.js","./src/prototype/sprites.js","./src/prototype/build-info.js","./src/prototype/persistence.js","./src/prototype/platform.js","./src/prototype/input.js","./src/prototype/runtime.js","./src/prototype/renderer.js","./src/prototype/app.js","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./assets/sprites/manifest.json"];
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
    const navigationKey = key.pathname.endsWith('/phone.html') ? appURL('./phone.html') : key.pathname.endsWith('/legacy.html') ? appURL('./legacy.html') : key.pathname.endsWith('/prototype.html') ? appURL('./prototype.html') : key.pathname === appURL('./rts.html').replace(scope.origin, '') ? appURL('./rts.html') : appURL('./index.html');
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
