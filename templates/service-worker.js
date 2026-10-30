/* Bump CACHE_VERSION when app assets change. A complete update waits for the startup gate (or explicit in-game install). */
const CACHE_VERSION = {{CACHE_VERSION}};
{{SPRITE_FORMAT}}
const CACHE_PREFIX = 'azeroth-app-';
const APP_FILES = {{APP_FILES}};
const LEGACY_FILES = {{LEGACY_FILES}};
const appURL = path => new URL(path, self.registration.scope).href;
const appFiles = new Set(APP_FILES.map(appURL));
const legacyFiles = new Set(LEGACY_FILES.map(appURL));
const spriteBase = appURL('./assets/sprites/');
// Registration scope and public entry URLs are immutable for this worker.
const scope = new URL(self.registration.scope);
const navigationURLs = {
    phone: appURL('./phone.html'),
    legacy: appURL('./legacy.html'),
    prototype: appURL('./prototype.html'),
    rts: appURL('./rts.html'),
    index: appURL('./index.html')
};
const rtsPath = new URL(navigationURLs.rts).pathname;
async function spriteAssetURLs(cache){
    try {
        const response = await cache.match(appURL('./assets/sprites/manifest.json'));
        if (!response) return [];
        const manifest = await response.json();
        return [...new Set(PrototypeSpriteFormat.sources(manifest).map(appURL))];
    } catch (_) { return []; }
}
// Preserve complete offline installation, but do not redownload unchanged
// recordings for every code/art release. A matching path alone is not enough.
async function audioHashes(cache) {
    try {
        const response = await cache.match(appURL('./assets/audio/manifest.json'));
        const manifest = response && await response.json();
        const hashes = new Map();
        for (const entry of Object.values(manifest?.assets || {})) {
            for (const resource of [entry, ...(entry.variants || [])]) {
                if (/^\.\/assets\/audio\/[a-zA-Z0-9/_-]+\.(mp3|ogg|wav)$/.test(resource.src) &&
                    /^[a-f0-9]{64}$/.test(resource.sha256 || ''))
                    hashes.set(appURL(resource.src), resource.sha256);
            }
        }
        return hashes;
    } catch (_) { return new Map(); }
}
self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_VERSION);
        const audioManifest = appURL('./assets/audio/manifest.json');
        await cache.addAll([new Request(audioManifest, { cache: 'reload' })]);
        const wanted = await audioHashes(cache);
        const previous = [];
        for (const name of await caches.keys()) {
            if (name.startsWith(CACHE_PREFIX) && name !== CACHE_VERSION) {
                const old = await caches.open(name);
                previous.push({ cache: old, hashes: await audioHashes(old) });
            }
        }
        const downloads = [];
        for (const url of appFiles) {
            if (url === audioManifest) continue;
            const hash = wanted.get(url);
            let reused = false;
            if (hash) {
                for (const old of previous) {
                    if (old.hashes.get(url) !== hash) continue;
                    const response = await old.cache.match(url);
                    if (!response?.ok) continue;
                    await cache.put(url, response);
                    reused = true;
                    break;
                }
            }
            if (!reused) downloads.push(new Request(url, { cache: 'reload' }));
        }
        await cache.addAll(downloads);
        const sprites = await spriteAssetURLs(cache);
        if (sprites.length) await cache.addAll(sprites.map(url => new Request(url, { cache: 'reload' })));
        // Keep the previous complete build until the startup gate requests
        // activation, or a player explicitly installs during active play.
    })());
});
self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
    const request = event.request, url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
    // The optional graphics demo is a separate real webpage, not a game route.
    // Do not turn its navigation into the cached campaign homepage.
    if (url.pathname.startsWith(appURL('./tools/webgl-pilot/').replace(scope.origin, ''))) return;
    const key = url; key.search = ''; key.hash = '';
    const isNavigation = request.mode === 'navigate';
    const navigationKey = isNavigation ? appFiles.has(key.href) && key.pathname.endsWith('.html') ? key.href : key.pathname.endsWith('/phone.html') ? navigationURLs.phone : key.pathname.endsWith('/legacy.html') ? navigationURLs.legacy : key.pathname.endsWith('/prototype.html') ? navigationURLs.prototype : key.pathname === rtsPath ? navigationURLs.rts : navigationURLs.index : null;
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
