/* Browser storage adapter. The engine remains responsible for validating saves. */
(function (root) {
  'use strict';
  const profileKey = 'azeroth-v4-profile',
    saveKey = (mode) => 'azeroth-v4-' + mode,
    checkpointKey = (mode) => saveKey(mode) + '-checkpoints-v1';
  const checkpointLimit = 3,
    checkpointIntervalMs = 60000,
    checkpointMaxChars = 500000;
  function create({ storage, Campaign, status = () => {}, canWrite = () => true, now = Date.now }) {
    const failedLoads = new Map();
    const expected = new Map(),
      conflicts = new Set();
    const previews = new Map(),
      checkpointCache = new Map(),
      validatedBytes = new Map();
    let previewSequence = 0,
      backupWarning = false;
    for (const mode of ['normal', 'nightmare', 'developer', 'arena']) {
      try {
        expected.set(mode, storage.getItem(saveKey(mode)) ?? null);
      } catch (_) {}
    }
    function readCheckpoints(mode) {
      try {
        const raw = storage.getItem(checkpointKey(mode));
        const cached = checkpointCache.get(mode);
        if (cached && cached.raw === raw) return cached.entries.slice();
        if (!raw || raw.length > checkpointMaxChars) return [];
        const value = JSON.parse(raw);
        if (value?.version !== 1 || !Array.isArray(value.entries)) return [];
        const entries = value.entries
          .slice(0, checkpointLimit)
          .filter(
            (entry) =>
              entry &&
              typeof entry.bytes === 'string' &&
              entry.bytes.length <= checkpointMaxChars &&
              Number.isFinite(entry.savedAt) &&
              entry.savedAt >= 0 &&
              entry.savedAt <= 8.64e15,
          );
        checkpointCache.set(mode, { raw, entries });
        return entries.slice();
      } catch (_) {
        return [];
      }
    }
    function restoreCandidate(bytes, mode) {
      const data = JSON.parse(bytes),
        candidate = data?.version === 2 ? Campaign.migrate(data) : Campaign.restore(data);
      if (candidate.s.mode !== mode) throw Error('Mismatched recovery mode');
      // Restoration can normalize runtime state. The resulting campaign must
      // itself serialize into a valid, reloadable save before it is offered.
      Campaign.validate(candidate.snapshot());
      return candidate;
    }
    function remember(mode, bytes, force = false) {
      if (!canWrite() || !bytes) return;
      if (bytes.length > checkpointMaxChars) {
        backupWarning = true;
        return;
      }
      const entries = readCheckpoints(mode),
        timestamp = now();
      if (!Number.isFinite(timestamp) || timestamp < 0 || timestamp > 8.64e15) {
        backupWarning = true;
        return;
      }
      if (entries.some((entry) => entry.bytes === bytes)) return;
      const age = timestamp - (entries[0]?.savedAt ?? -Infinity);
      if (!force && age >= 0 && age < checkpointIntervalMs) return;
      try {
        if (validatedBytes.get(mode) !== bytes) restoreCandidate(bytes, mode);
      } catch (_) {
        return; // An invalid primary can never be promoted to a good checkpoint.
      }
      const next = [{ bytes, savedAt: timestamp }, ...entries].slice(0, checkpointLimit);
      // Cap both count and encoded size. Quota pressure sheds oldest backups
      // first; a failed atomic setItem leaves the previous bundle untouched.
      while (next.length) {
        const bundle = JSON.stringify({ version: 1, entries: next });
        if (bundle.length <= checkpointMaxChars) {
          try {
            storage.setItem(checkpointKey(mode), bundle);
            checkpointCache.set(mode, { raw: bundle, entries: next.slice() });
            return;
          } catch (_) {}
        }
        next.pop();
      }
      backupWarning = true;
    }
    function writePrimary(mode, bytes) {
      try {
        storage.setItem(saveKey(mode), bytes);
      } catch (error) {
        // Backup retention must not consume the space needed for normal saving.
        // Keep at least one checkpoint while attempting to free older entries.
        const entries = readCheckpoints(mode);
        while (entries.length > 1) {
          entries.pop();
          try {
            storage.setItem(checkpointKey(mode), JSON.stringify({ version: 1, entries }));
            storage.setItem(saveKey(mode), bytes);
            return;
          } catch (_) {}
        }
        throw error;
      }
    }
    function writeSnapshot(game, replace = false) {
      const mode = game.s.mode;
      if (!canWrite()) throw Error('Another window owns campaign saving');
      const current = storage.getItem(saveKey(mode)) ?? null;
      if (conflicts.has(mode) || (expected.has(mode) && current !== expected.get(mode))) {
        conflicts.add(mode);
        throw Error('Campaign changed in another window');
      }
      // Import/new-run can target a slot other than the one loaded at startup.
      // Classify that previous primary before any automatic/explicit overwrite.
      if (current && !failedLoads.has(mode) && validatedBytes.get(mode) !== current) {
        try {
          restoreCandidate(current, mode);
          validatedBytes.set(mode, current);
        } catch (_) {
          failedLoads.set(mode, current);
        }
      }
      if (failedLoads.has(mode) && !replace) throw Error('Original unreadable save is protected');
      const snapshot = game.snapshot();
      Campaign.validate(snapshot);
      const bytes = JSON.stringify(snapshot);
      backupWarning = false;
      // Keep the preceding durable primary, never an uncommitted live state.
      // Explicit import/new-run/recovery boundaries bypass the one-minute rate.
      remember(mode, current, replace);
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
      writePrimary(mode, bytes);
      expected.set(mode, bytes);
      validatedBytes.set(mode, bytes);
      failedLoads.delete(mode);
      if (!readCheckpoints(mode).length) remember(mode, bytes, true);
      return true;
    }
    function loadProfile(defaults) {
      try {
        const p = JSON.parse(storage.getItem(profileKey) || 'null');
        if (p)
          return {
            ...defaults,
            nightmareUnlocked: p.nightmareUnlocked === true,
            activeMode: ['normal', 'nightmare', 'arena'].includes(p.activeMode) ? p.activeMode : 'normal',
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
        if (game.peace && !['developer', 'arena'].includes(game.s.mode)) profile.nightmareUnlocked = true;
        if (!saveProfile(profile)) return false;
        status(
          backupWarning
            ? 'Saved locally, but a recovery checkpoint could not be stored. Export a backup.'
            : 'Saved locally · export for a backup',
        );
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
          validatedBytes.set(mode, raw);
          if (canWrite()) remember(mode, raw);
          return restored;
        }
        if (
          storage.getItem(checkpointKey(mode)) ||
          storage.getItem(saveKey(mode) + '-unreadable-backup') ||
          storage.getItem(saveKey(mode) + '-latest-unreadable-backup')
        ) {
          failedLoads.set(mode, raw);
          status('Saved run unavailable. Try recovery or import a backup.');
        }
      } catch (_) {
        failedLoads.set(mode, raw);
        status('Saved run unavailable. Try recovery or import a backup.');
      }
      return null;
    }
    function recoveryOptions(mode) {
      previews.clear();
      const original = storage.getItem(saveKey(mode)) ?? null,
        sources = [
          { bytes: original, source: 'compatible', savedAt: null },
          ...readCheckpoints(mode).map((entry) => ({ ...entry, source: 'checkpoint' })),
          {
            bytes: storage.getItem(saveKey(mode) + '-latest-unreadable-backup'),
            source: 'original',
            savedAt: null,
          },
          {
            bytes: storage.getItem(saveKey(mode) + '-unreadable-backup'),
            source: 'original',
            savedAt: null,
          },
          ...(mode === 'normal'
            ? [
                {
                  bytes: storage.getItem('azeroth-chronicles-prototype-save-v2'),
                  source: 'legacy',
                  savedAt: null,
                },
                {
                  bytes: storage.getItem('azeroth-v2-original-backup'),
                  source: 'legacy',
                  savedAt: null,
                },
              ]
            : []),
        ];
      const options = [],
        seen = new Set();
      for (const entry of sources) {
        if (!entry.bytes || seen.has(entry.bytes)) continue;
        seen.add(entry.bytes);
        try {
          const candidate = restoreCandidate(entry.bytes, mode),
            id = mode + ':' + ++previewSequence;
          previews.set(id, { ...entry, mode, original });
          options.push({
            id,
            source: entry.source,
            savedAt: entry.savedAt,
            heroClass: candidate.hero.class,
            level: candidate.hero.level,
            zone: candidate.zoneId,
            gameTime: candidate.s.time,
          });
          if (options.length === checkpointLimit) break;
        } catch (_) {}
      }
      return options;
    }
    function recover(mode, id) {
      const preview = previews.get(id);
      if (!preview || preview.mode !== mode) throw Error('Recovery option expired');
      if ((storage.getItem(saveKey(mode)) ?? null) !== preview.original)
        throw Error('Campaign changed since recovery preview');
      const candidate = restoreCandidate(preview.bytes, mode);
      writeSnapshot(candidate, true);
      previews.clear();
      return candidate;
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
      recoveryOptions,
      recover,
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
    checkpointKey,
    checkpointLimit,
    checkpointIntervalMs,
    checkpointMaxChars,
    recoveryMarkerKey,
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypePersistence = api;
})(typeof window !== 'undefined' ? window : globalThis);
