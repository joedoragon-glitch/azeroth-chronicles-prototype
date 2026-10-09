/* Shared sprite/variant/clip resource contract: runtime, packaging and offline caching. */
(function (root) {
  'use strict';
  const LIMITS = Object.freeze({
    decodedBytes: 256 * 1024 * 1024,
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
