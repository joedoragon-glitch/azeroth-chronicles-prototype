/* Public audio facade. Catalog, playback, scoring and effects have separate owners. */
(function (root) {
  'use strict';
  const common = typeof module !== 'undefined';
  const catalog = common ? require('./audio-catalog.js') : root.PrototypeAudioCatalog;
  const owners = common
    ? [
        require('./audio-mixer.js'),
        require('./audio-runtime.js'),
        require('./audio-score.js'),
        require('./audio-effects.js'),
        require('./audio-recordings.js'),
        require('./audio-production.js'),
      ]
    : [
        root.PrototypeAudioMixer,
        root.PrototypeAudioRuntime,
        root.PrototypeAudioScore,
        root.PrototypeAudioEffects,
        root.PrototypeAudioRecordings,
        root.PrototypeAudioProduction,
      ];
  const { themes, defaults } = catalog;
  class PrototypeAudio {
    constructor(settings = {}) {
      this.settings = { ...defaults };
      this.setSettings(settings);
      this.ctx = null;
      this.cue = null;
      this.voices = new Set();
      this.scores = [];
      this.score = null;
      this.step = 0;
      this.next = 0;
      this.clock = null;
      this.noise = null;
      this.paused = false;
      this.history = [];
      this.lastWarning = -Infinity;
      this.finaleUntil = 0;
      this.lastSfx = {};
      this.duckUntil = 0;
      this.context = null;
    }
  }
  for (const owner of owners) owner.install(PrototypeAudio, catalog);
  PrototypeAudio.themes = themes;
  PrototypeAudio.defaults = defaults;
  if (common) module.exports = PrototypeAudio;
  else root.PrototypeAudio = PrototypeAudio;
})(typeof window !== 'undefined' ? window : globalThis);
