/* Bump CACHE_VERSION when app assets change. Tester builds activate immediately. */
const CACHE_VERSION = 'azeroth-app-v0.8.76-frontier-prop-depth';
const CACHE_PREFIX = 'azeroth-app-';
const APP_FILES = ['./prototype.html', './legacy.html', './styles/prototype.css', './src/prototype/data.js', './src/prototype/rules.js', './src/prototype/engine.js', './src/prototype/audio.js', './src/prototype/visuals.js', './src/prototype/sprites.js', './src/prototype/app.js', './', './index.html', './rts.html', './styles/rts.css', './src/rts-engine.js', './src/rts.js', './styles/game.css', './styles/app.css', './styles/keyboard.css', './src/sprint.js', './src/controls.js', './src/classes.js', './src/world.js', './src/squad.js', './src/game.js', './src/app.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './assets/sprites/manifest.json'];
const appURL = path => new URL(path, self.registration.scope).href;
const appFiles = new Set(APP_FILES.map(appURL));
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
    const navigationKey = key.pathname.endsWith('/legacy.html') ? appURL('./legacy.html') : key.pathname.endsWith('/prototype.html') ? appURL('./prototype.html') : key.pathname === appURL('./rts.html').replace(scope.origin, '') ? appURL('./rts.html') : appURL('./index.html');
    const isSprite = key.href.startsWith(spriteBase);
    if (!isNavigation && !appFiles.has(key.href) && !isSprite) return;
    event.respondWith(caches.open(CACHE_VERSION).then(async cache => {
        const cached = await cache.match(isNavigation ? navigationKey : key.href);
        if (cached) return cached;
        try { return await fetch(request); }
        catch (_) { return new Response('Abre el juego con conexión una vez para preparar el modo sin conexión.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
    }));
});
