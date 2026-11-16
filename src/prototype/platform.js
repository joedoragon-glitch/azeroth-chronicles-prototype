/* Presentation selection uses input capabilities, never a narrow-window phone guess. */
(function (root) {
  'use strict';
  const preferenceKey = 'azeroth-screen-v1';
  // Preserve comparison preferences for rollback; finalized framing starts at 150%.
  const cameraPreferenceKey = 'azeroth-camera-v2';
  const defaultCameraZoom = 1.25;
  const cameraScales = [1, 1.25, 1.5, 1.75];
  // Menu density is independent from world zoom and rendering pixel density.
  const menuDensityPreferenceKey = 'azeroth-menu-density-v1';
  const menuDensityChoices = ['auto', 'compact', 'standard'];
  function resolveMenuDensity({
    preference = 'auto',
    mode = 'desktop',
    width = 800,
    height = 375,
    top = 0,
    right = 0,
    bottom = 0,
    left = 0,
  } = {}) {
    if (preference === 'compact' || preference === 'standard') return preference;
    // Logical CSS pixels: physical Retina pixels are for clarity, not layout.
    // Keep this decision cheap and deterministic. Rich text can still scroll.
    const usableWidth = Math.max(0, width - left - right);
    const usableHeight = Math.max(0, height - top - bottom);
    return mode === 'phone'
      ? usableHeight <= 470 || usableWidth < 760
        ? 'compact'
        : 'standard'
      : usableHeight < 650 || usableWidth < 760
        ? 'compact'
        : 'standard';
  }
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
    let menuDensityPreference = 'auto';
    try {
      const stored = env.localStorage.getItem(menuDensityPreferenceKey);
      if (menuDensityChoices.includes(stored)) menuDensityPreference = stored;
    } catch (_) {}
    let menuDensityCache = null;
    function updateMenuDensity(bounds = {}) {
      const width = Number.isFinite(bounds.width) ? bounds.width : env.innerWidth || 800;
      const height = Number.isFinite(bounds.height) ? bounds.height : env.innerHeight || 375;
      const style = env.getComputedStyle?.(env.document.documentElement);
      const safe = (edge) => {
        const supplied = bounds[edge];
        const raw = Number.isFinite(supplied)
          ? supplied
          : Number.parseFloat(style?.getPropertyValue('--phone-safe-' + edge) || '0');
        return Number.isFinite(raw) ? Math.max(0, raw) : 0;
      };
      const insets = {
        top: safe('top'),
        right: safe('right'),
        bottom: safe('bottom'),
        left: safe('left'),
      };
      const signature = [mode, menuDensityPreference, width, height, ...Object.values(insets)].join(
        '|',
      );
      if (menuDensityCache?.signature === signature) return menuDensityCache.effective;
      const effective = resolveMenuDensity({
        preference: menuDensityPreference,
        mode,
        width,
        height,
        ...insets,
      });
      menuDensityCache = { signature, effective };
      env.document.body.setAttribute('data-menu-density-preference', menuDensityPreference);
      env.document.body.setAttribute('data-menu-density-effective', effective);
      return effective;
    }
    const listeners = new Set();
    function apply() {
      const previous = mode;
      mode = resolve({
        requested: preference,
        fine: match('(any-pointer: fine)') && match('(any-hover: hover)'),
        coarse: match('(pointer: coarse)'),
      });
      env.document.body.setAttribute('data-experience', mode);
      updateMenuDensity();
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
      get menuDensity() {
        return menuDensityPreference;
      },
      get effectiveMenuDensity() {
        return updateMenuDensity();
      },
      updateMenuDensity,
      selectMenuDensity(value) {
        if (!menuDensityChoices.includes(value)) return;
        menuDensityPreference = value;
        try {
          env.localStorage.setItem(menuDensityPreferenceKey, value);
        } catch (_) {}
        updateMenuDensity();
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
              x: Math.max(width * 0.35, (width - (width <= 1000 ? 204 : 214) - 20) / 2),
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
    menuDensityPreferenceKey,
    menuDensityChoices,
    resolveMenuDensity,
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypePlatform = api;
})(typeof window !== 'undefined' ? window : globalThis);
