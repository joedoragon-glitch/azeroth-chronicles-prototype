/* Presentation selection uses input capabilities, never a narrow-window phone guess. */
(function (root) {
  'use strict';
  const preferenceKey = 'azeroth-screen-v1';
  function resolve({ requested = 'auto', fine = false, coarse = false }) {
    if (requested === 'desktop' || requested === 'phone') return requested;
    return fine || !coarse ? 'desktop' : 'phone';
  }
  function init(env) {
    const match = (q) => !!env.matchMedia?.(q).matches;
    let preference = 'auto';
    try {
      preference = env.localStorage.getItem(preferenceKey) || 'auto';
    } catch (_) {}
    const params = new URLSearchParams(env.location.search || '');
    const entry = env.document.body.getAttribute?.('data-entry') || 'auto';
    const requested = params.get('experience');
    if (requested === 'desktop' || requested === 'phone') preference = requested;
    else if (entry === 'phone') preference = 'phone';
    let mode;
    const listeners = new Set();
    function apply() {
      mode = resolve({
        requested: preference,
        fine: match('(any-pointer: fine)') && match('(any-hover: hover)'),
        coarse: match('(pointer: coarse)'),
      });
      env.document.body.setAttribute('data-experience', mode);
      for (const listener of listeners) listener(mode);
    }
    apply();
    for (const query of ['(any-pointer: fine)', '(any-hover: hover)', '(pointer: coarse)'])
      env.matchMedia?.(query).addEventListener?.('change', apply);
    return {
      onChange(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
      get mode() {
        return mode;
      },
      get preference() {
        return preference;
      },
      select(value) {
        preference = ['desktop', 'phone'].includes(value) ? value : 'auto';
        try {
          env.localStorage.setItem(preferenceKey, preference);
        } catch (_) {}
        apply();
      },
      cameraAnchor(width, height) {
        return mode === 'phone'
          ? { x: width * (width < 600 ? 0.69 : 0.6), y: height * 0.5 }
          : {
              x: Math.max(
                width * 0.35,
                (width - (width <= 1000 ? 220 : Math.min(260, width * 0.27)) - 24) / 2,
              ),
              y: (height - 94) / 2,
            };
      },
    };
  }
  const api = { resolve, init, preferenceKey };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypePlatform = api;
})(typeof window !== 'undefined' ? window : globalThis);
