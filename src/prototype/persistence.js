/* Browser storage adapter. The engine remains responsible for validating saves. */
(function (root) {
  'use strict';
  const profileKey = 'azeroth-v4-profile',
    saveKey = (mode) => 'azeroth-v4-' + mode;
  function create({ storage, Campaign, status = () => {}, canWrite = () => true }) {
    const failedLoads = new Map();
    const expected = new Map(),
      conflicts = new Set();
    for (const mode of ['normal', 'nightmare', 'developer']) {
      try {
        expected.set(mode, storage.getItem(saveKey(mode)) ?? null);
      } catch (_) {}
    }
    function writeSnapshot(game, replace = false) {
      const mode = game.s.mode;
      if (!canWrite()) throw Error('Another window owns campaign saving');
      const current = storage.getItem(saveKey(mode)) ?? null;
      if (conflicts.has(mode) || (expected.has(mode) && current !== expected.get(mode))) {
        conflicts.add(mode);
        throw Error('Campaign changed in another window');
      }
      if (failedLoads.has(mode) && !replace) throw Error('Original unreadable save is protected');
      const snapshot = game.snapshot();
      Campaign.validate(snapshot);
      const bytes = JSON.stringify(snapshot);
      if (replace && failedLoads.has(mode)) {
        const original = storage.getItem(saveKey(mode));
        if (original) {
          // Preserve the first failed original and the most recent replacement
          // separately. Bounded backups never overwrite the original v2 backup.
          const first = saveKey(mode) + '-unreadable-backup';
          if (!storage.getItem(first)) storage.setItem(first, original);
          else if (storage.getItem(first) !== original)
            storage.setItem(saveKey(mode) + '-latest-unreadable-backup', original);
        }
      }
      storage.setItem(saveKey(mode), bytes);
      expected.set(mode, bytes);
      failedLoads.delete(mode);
      return true;
    }
    function loadProfile(defaults) {
      try {
        const p = JSON.parse(storage.getItem(profileKey) || 'null');
        if (p)
          return {
            ...defaults,
            nightmareUnlocked: p.nightmareUnlocked === true,
            activeMode: p.activeMode === 'nightmare' ? 'nightmare' : 'normal',
            audio: p.audio || defaults.audio,
          };
      } catch (_) {}
      return defaults;
    }
    function saveProfile(profile) {
      try {
        if (!canWrite()) return false;
        storage.setItem(profileKey, JSON.stringify(profile));
        return true;
      } catch (_) {
        status('Local storage unavailable. Export before closing.');
        return false;
      }
    }
    function save(game, profile) {
      try {
        writeSnapshot(game);
        if (game.s.mode !== 'developer') profile.activeMode = game.s.mode;
        if (game.peace && game.s.mode !== 'developer') profile.nightmareUnlocked = true;
        if (!saveProfile(profile)) return false;
        status('Saved locally · export for a backup');
        return true;
      } catch (_) {
        status('Saving failed. Export your run before closing.');
        return false;
      }
    }
    function load(mode) {
      let raw;
      try {
        raw = storage.getItem(saveKey(mode));
        expected.set(mode, raw ?? null);
        conflicts.delete(mode);
        if (raw) {
          const restored = Campaign.restore(JSON.parse(raw));
          if (restored.s.mode !== mode) throw Error('Mismatched save slot');
          failedLoads.delete(mode);
          return restored;
        }
      } catch (_) {
        failedLoads.set(mode, raw);
        status('Saved run unavailable. Import a backup.');
      }
      return null;
    }
    function migrateLegacy() {
      if (!canWrite()) return null;
      try {
        const original = storage.getItem('azeroth-chronicles-prototype-save-v2');
        if (!original) return null;
        const candidate = Campaign.migrate(JSON.parse(original));
        if (!storage.getItem('azeroth-v2-original-backup'))
          storage.setItem('azeroth-v2-original-backup', original);
        return candidate;
      } catch (_) {
        status('Legacy save retained unchanged. Import a valid export to migrate.');
        return null;
      }
    }
    return {
      loadProfile,
      saveProfile,
      save,
      load,
      migrateLegacy,
      loadFailed: (mode) => failedLoads.has(mode),
      original: (mode) => failedLoads.get(mode) || '',
      conflicted: (mode) => conflicts.has(mode),
      exists(mode) {
        try {
          return !!storage.getItem(saveKey(mode));
        } catch (_) {
          return false;
        }
      },
      writeCandidate(candidate) {
        return writeSnapshot(candidate, true);
      },
    };
  }
  // One modern browser/PWA window owns campaign writes for the whole origin.
  // An unfulfilled request is non-writing; closing/crashing releases the lock.
  // File-based test/development adapters retain optimistic byte checks above.
  function createWriterGuard({ locks, required = false } = {}) {
    let state = locks?.request ? 'pending' : required ? 'unsupported' : 'owner';
    let releaseLock = null,
      released = false;
    let resolveReady;
    const ready = new Promise((resolve) => {
      resolveReady = resolve;
    });
    if (state !== 'pending') resolveReady(state);
    else {
      try {
        Promise.resolve(
          locks.request('azeroth-campaign-writer-v1', { ifAvailable: true }, (lock) => {
            if (released || !lock) {
              state = released ? 'closed' : 'blocked';
              resolveReady(state);
              return;
            }
            state = 'owner';
            resolveReady(state);
            return new Promise((resolve) => {
              releaseLock = resolve;
            });
          }),
        ).catch(() => {
          state = 'blocked';
          resolveReady(state);
        });
      } catch (_) {
        state = 'blocked';
        resolveReady(state);
      }
    }
    return {
      ready,
      get pending() {
        return state === 'pending';
      },
      status: () => state,
      canWrite: () => state === 'owner' && !released,
      release() {
        released = true;
        state = 'closed';
        releaseLock?.();
      },
    };
  }
  // A frozen browser cannot run a rescue callback. Keep only a tiny,
  // device-local in-progress marker so the NEXT launch can relocate a valid
  // campaign save safely. The marker never contains a save or replaces one.
  const recoveryMarkerKey = 'azeroth-active-play-recovery-v1';
  function createRestartGuard({ storage, Campaign, canWrite = () => true }) {
    function read() {
      try {
        const value = JSON.parse(storage?.getItem(recoveryMarkerKey) || 'null');
        return value?.active === true && value.version === 1 ? value : null;
      } catch (_) {
        return null;
      }
    }
    function arm(game) {
      if (!canWrite()) return false;
      if (!game?.s || game.s.mode === 'developer') return false;
      try {
        // The live campaign can advance between five-second autosaves.
        // Anchor recovery to the checkpoint actually written to storage,
        // not newer game time/IDs which the next launch cannot restore.
        const raw = storage?.getItem(saveKey(game.s.mode));
        if (!raw) return false;
        const saved = JSON.parse(raw);
        if (
          saved?.mode !== game.s.mode ||
          saved.hero?.class !== game.hero.class ||
          !Number.isFinite(saved.time) ||
          !Number.isFinite(saved.nextId) ||
          !Number.isFinite(game.s.time) ||
          !Number.isFinite(game.s.nextId) ||
          saved.time > game.s.time + 1e-6 ||
          saved.nextId > game.s.nextId
        )
          return false;
        storage.setItem(
          recoveryMarkerKey,
          JSON.stringify({
            version: 1,
            active: true,
            mode: game.s.mode,
            heroClass: game.hero.class,
            // Refuse a different/older run without rejecting legitimate
            // unsaved play after the last durable checkpoint.
            nextId: saved.nextId,
            gameTime: saved.time,
          }),
        );
        return true;
      } catch (_) {
        return false;
      }
    }
    function clean() {
      if (!canWrite()) return false;
      try {
        // setItem fallback supports restricted storage adapters without removeItem.
        if (typeof storage?.removeItem === 'function') storage.removeItem(recoveryMarkerKey);
        else storage?.setItem(recoveryMarkerKey, '');
        return true;
      } catch (_) {
        return false;
      }
    }
    function recover(game) {
      if (!canWrite()) return null;
      const marker = read();
      if (
        !marker ||
        !game?.s ||
        marker.mode !== game.s.mode ||
        marker.heroClass !== game.hero.class ||
        (Number.isFinite(marker.nextId) && game.s.nextId < marker.nextId) ||
        (Number.isFinite(marker.gameTime) && game.s.time + 1e-6 < marker.gameTime) ||
        game.s.challenge?.pending ||
        game.s.challenge?.gameOver ||
        game.hero.hp <= 0
      )
        return null;
      try {
        // Work on a validated copy: a failed safe arrival never damages the
        // already-restored game or overwrites its last valid saved snapshot.
        const candidate = Campaign.restore(game.snapshot());
        const chosen = candidate.selectedBarracksRespawn();
        if (chosen) {
          if (
            !candidate.enter(chosen.zone, {
              x: chosen.barracks.x + 85,
              y: chosen.barracks.y + 50,
            })
          )
            return null;
        } else {
          const region = candidate.definition().id,
            stored = candidate.s.refugeSite,
            refuge =
              stored?.zone === region &&
              candidate.s.zones[region]?.npcs.some((n) => n.kind === 'rest' && n.id === stored.id)
                ? { zone: region, id: stored.id }
                : { zone: region, id: 'rest' };
          if (!candidate.enter(refuge.zone)) return null;
          candidate.arriveRefuge(refuge);
        }
        return candidate;
      } catch (_) {
        return null;
      }
    }
    return { arm, clean, recover, read };
  }
  const api = {
    create,
    createWriterGuard,
    createRestartGuard,
    profileKey,
    saveKey,
    recoveryMarkerKey,
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypePersistence = api;
})(typeof window !== 'undefined' ? window : globalThis);
