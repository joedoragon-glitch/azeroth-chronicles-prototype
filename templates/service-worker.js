/* Each published release prepares an atomic offline cache; the game controls activation. */
const CACHE_VERSION = {{CACHE_VERSION}};
{{SPRITE_FORMAT}}
const CACHE_PREFIX = 'azeroth-app-';
const APP_FILES = {{APP_FILES}};
const APP_FINGERPRINTS = {{APP_FINGERPRINTS}};
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
// A content fingerprint is scoped to an asset's actual bytes, not its URL or release number.
// A new release gets its own complete offline cache, but unchanged assets are copied locally.
const fingerprintURL = appURL('./__offline-fingerprints-v1__');
async function cachedFingerprints(cache) {
    try {
        const response = await cache.match(fingerprintURL);
        const value = response && await response.json();
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (_) { return {}; }
}
async function matchesFingerprint(response, fingerprint) {
    if (!response?.ok || typeof fingerprint !== 'string' || !self.crypto?.subtle) return false;
    const vendor = /^sha256:[a-f0-9]{64}$/.test(fingerprint);
    if (!vendor && !/^[a-f0-9]{40}$/.test(fingerprint)) return false;
    try {
        const bytes = new Uint8Array(await response.arrayBuffer());
        // Regular assets use Git's blob SHA-1 (length-prefixed content identity).
        // Pinned PixiJS is a generated vendor file and uses its verified SHA-256.
        const prefix = vendor ? null : new TextEncoder().encode('blob ' + bytes.length + '\0');
        const input = vendor ? bytes : new Uint8Array(prefix.length + bytes.length);
        if (prefix) { input.set(prefix); input.set(bytes, prefix.length); }
        const digest = await self.crypto.subtle.digest(vendor ? 'SHA-256' : 'SHA-1', input);
        const hex = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
        return (vendor ? 'sha256:' + hex : hex) === fingerprint;
    } catch (_) { return false; }
}
async function spriteHashes(cache) {
    try {
        const response = await cache.match(appURL('./assets/sprites/manifest.json'));
        if (!response) return new Map();
        return new Map(PrototypeSpriteFormat.resources(await response.json())
            .map(resource => [appURL(resource.src), resource.hash || null]));
    } catch (_) { return new Map(); }
}
// The audio manifest supplies SHA-256 fingerprints for recordings and variants.
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
        // Fresh manifests are mandatory: never infer that a manifest is unchanged from its path.
        const audioManifest = appURL('./assets/audio/manifest.json');
        await cache.addAll([new Request(audioManifest, { cache: 'reload' })]);
        const wantedAudio = await audioHashes(cache);
        const previous = [];
        for (const name of await caches.keys()) {
            if (name.startsWith(CACHE_PREFIX) && name !== CACHE_VERSION) {
                const old = await caches.open(name);
                previous.push({
                    cache: old,
                    audio: await audioHashes(old),
                    sprites: await spriteHashes(old),
                    fingerprints: await cachedFingerprints(old)
                });
            }
        }
        const downloads = [];
        for (const path of APP_FILES) {
            const url = appURL(path);
            if (url === audioManifest) continue;
            const recordingHash = wantedAudio.get(url);
            const fingerprint = APP_FINGERPRINTS[path];
            let reused = false;
            for (const old of previous) {
                const response = await old.cache.match(url);
                if (!response?.ok) continue;
                const trustedFingerprint = fingerprint && old.fingerprints[path] === fingerprint;
                // Existing installed versions have no fingerprint index. During migration,
                // hash those cached bytes once instead of forcing a whole-game download.
                const oldBytesMatch = fingerprint && !old.fingerprints[path] &&
                    await matchesFingerprint(response.clone(), fingerprint);
                if ((recordingHash && old.audio.get(url) === recordingHash) ||
                    trustedFingerprint || oldBytesMatch) {
                    await cache.put(url, response);
                    reused = true;
                    break;
                }
            }
            if (!reused) downloads.push(new Request(url, { cache: 'reload' }));
        }
        if (downloads.length) await cache.addAll(downloads);
        const spriteDownloads = [];
        for (const [url, hash] of await spriteHashes(cache)) {
            let reused = false;
            if (hash && /^[a-f0-9]{64}$/.test(hash)) {
                for (const old of previous) {
                    if (old.sprites.get(url) !== hash) continue;
                    const response = await old.cache.match(url);
                    if (!response?.ok) continue;
                    await cache.put(url, response);
                    reused = true;
                    break;
                }
            }
            if (!reused) spriteDownloads.push(new Request(url, { cache: 'reload' }));
        }
        if (spriteDownloads.length) await cache.addAll(spriteDownloads);
        // Persist the release's trusted fingerprints for fast reuse on its next update.
        await cache.put(fingerprintURL, new Response(JSON.stringify(APP_FINGERPRINTS),
            { headers: { 'Content-Type': 'application/json' } }));
        // The game activates waiting updates automatically only before title-screen entry.
        // An update discovered during gameplay still waits for the player's explicit action.
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
    // The standalone demo's HTML navigation must not route to the RPG home page.
    // Four scripts in this directory are also core RPG scripts and MUST remain
    // cache-controlled, including offline and incremental updates.
    if (request.mode === 'navigate' &&
        url.pathname.startsWith(appURL('./tools/webgl-pilot/').replace(scope.origin, ''))) return;
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
