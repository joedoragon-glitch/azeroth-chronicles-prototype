/* Presentation selection uses input capabilities, never a narrow-window phone guess. */
(function (root) {
  'use strict';
  const preferenceKey = 'azeroth-screen-v1';
  // Preserve comparison preferences for rollback; finalized framing starts at 150%.
  const cameraPreferenceKey = 'azeroth-camera-v2';
  const defaultCameraZoom = 1.5;
  const cameraScales = [1, 1.5, 1.75];
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
    else if (entry === 'phone' && !['desktop', 'phone'].includes(preference)) preference = 'phone';
    let mode;
    let cameraPreferences = {};
    try {
      const stored = JSON.parse(env.localStorage.getItem(cameraPreferenceKey) || '{}');
      if (stored && typeof stored === 'object' && !Array.isArray(stored))
        cameraPreferences = stored;
    } catch (_) {}
    const listeners = new Set();
    function apply() {
      const previous = mode;
      mode = resolve({
        requested: preference,
        fine: match('(any-pointer: fine)') && match('(any-hover: hover)'),
        coarse: match('(pointer: coarse)'),
      });
      env.document.body.setAttribute('data-experience', mode);
      if (previous !== mode) for (const listener of listeners) listener(mode);
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
      get cameraZoom() {
        const value = cameraPreferences[mode];
        return cameraScales.includes(value) ? value : defaultCameraZoom;
      },
      selectCameraZoom(value) {
        if (!cameraScales.includes(value)) return;
        cameraPreferences[mode] = value;
        try {
          env.localStorage.setItem(cameraPreferenceKey, JSON.stringify(cameraPreferences));
        } catch (_) {}
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
          ? {
              x:
                width *
                (env.document.body.getAttribute?.('data-phone-layout') === 'left-hand'
                  ? width < 600
                    ? 0.69
                    : 0.6
                  : width < 600 && height < 650
                    ? 0.35
                    : 0.5),
              y: height * 0.42,
            }
          : {
              x: Math.max(
                width * 0.35,
                (width - (width <= 1000 ? 204 : 214) - 20) / 2,
              ),
              y: (height - 94) / 2,
            };
      },
    };
  }
  const api = {
    resolve,
    init,
    preferenceKey,
    cameraPreferenceKey,
    cameraScales,
    defaultCameraZoom,
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypePlatform = api;
})(typeof window !== 'undefined' ? window : globalThis);
