/* Bump CACHE_VERSION when app assets change. New releases wait for player consent. */
const CACHE_VERSION = 'azeroth-app-v0.3.0';
const CACHE_PREFIX = 'azeroth-app-';
const APP_FILES = ['./', './index.html', './styles/game.css', './styles/app.css', './src/game.js', './src/app.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
const appURL = path => new URL(path, self.registration.scope).href;
const appFiles = new Set(APP_FILES.map(appURL));
self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll([...appFiles])));
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
    if (!isNavigation && !appFiles.has(key.href)) return;
    event.respondWith(caches.open(CACHE_VERSION).then(async cache => {
        const cached = await cache.match(isNavigation ? appURL('./index.html') : key.href);
        if (cached) return cached;
        try { return await fetch(request); }
        catch (_) { return new Response('Abre el juego con conexión una vez para preparar el modo sin conexión.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
    }));
});
