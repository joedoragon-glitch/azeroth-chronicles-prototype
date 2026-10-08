/* Shared opaque material contract for runtime, registration and offline inventory. */
(function (root) {
  'use strict';
  const LIMITS = Object.freeze({
    dimension: 256,
    decodedBytes: 2 * 1024 * 1024,
    concurrent: 2,
    encodedBytes: 1024 * 1024,
  });
  const local = (src) =>
    typeof src === 'string' && /^\.\/assets\/materials\/[a-z0-9_-]+\.png$/.test(src);
  function entries(manifest) {
    if (
      manifest?.version !== 1 ||
      !manifest.materials ||
      Array.isArray(manifest.materials) ||
      typeof manifest.materials !== 'object'
    )
      throw Error('Invalid material manifest');
    const out = {};
    for (const [key, value] of Object.entries(manifest.materials)) {
      if (
        !/^terrain:(ground|road|floor|rock|lava|bridge):[a-z0-9-]+$/.test(key) ||
        !value ||
        !local(value.src) ||
        !/^[a-f0-9]{64}$/.test(value.hash || '') ||
        value.width !== LIMITS.dimension ||
        value.height !== LIMITS.dimension ||
        !Number.isFinite(value.worldSpan) ||
        value.worldSpan < 80 ||
        value.worldSpan > 1280 ||
        !Number.isFinite(value.opacity) ||
        value.opacity < 0 ||
        value.opacity > 0.5 ||
        !/^[a-f0-9]{64}$/.test(value.revision || '')
      )
        throw Error('Invalid material entry: ' + key);
      out[key] = { ...value };
    }
    const paths = new Map();
    for (const item of Object.values(out)) {
      if (paths.has(item.src) && paths.get(item.src) !== item.hash)
        throw Error('Conflicting material resource');
      paths.set(item.src, item.hash);
    }
    return out;
  }
  function sources(manifest) {
    return [...new Set(Object.values(entries(manifest)).map((e) => e.src))];
  }
  const api = { LIMITS, local, entries, sources };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeMaterialContract = api;
})(typeof window !== 'undefined' ? window : globalThis);
