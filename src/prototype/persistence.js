/* Browser storage adapter. The engine remains responsible for validating saves. */
(function (root) {
  'use strict';
  const profileKey = 'azeroth-v4-profile',
    saveKey = (mode) => 'azeroth-v4-' + mode;
  function create({ storage, Campaign, status = () => {} }) {
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
        storage.setItem(profileKey, JSON.stringify(profile));
        return true;
      } catch (_) {
        status('Local storage unavailable. Export before closing.');
        return false;
      }
    }
    function save(game, profile) {
      try {
        storage.setItem(saveKey(game.s.mode), JSON.stringify(game.snapshot()));
        profile.activeMode = game.s.mode;
        if (game.peace) profile.nightmareUnlocked = true;
        if (!saveProfile(profile)) return false;
        status('Saved locally · export for a backup');
        return true;
      } catch (_) {
        status('Saving failed. Export your run before closing.');
        return false;
      }
    }
    function load(mode) {
      try {
        const raw = storage.getItem(saveKey(mode));
        if (raw) return Campaign.restore(JSON.parse(raw));
      } catch (_) {
        status('Saved run unavailable. Import a backup.');
      }
      return null;
    }
    function migrateLegacy() {
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
      exists(mode) {
        try {
          return !!storage.getItem(saveKey(mode));
        } catch (_) {
          return false;
        }
      },
      writeCandidate(candidate) {
        storage.setItem(saveKey(candidate.s.mode), JSON.stringify(candidate.snapshot()));
      },
    };
  }
  const api = { create, profileKey, saveKey };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypePersistence = api;
})(typeof window !== 'undefined' ? window : globalThis);
