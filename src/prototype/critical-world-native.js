/* Stage 3 — native World critical receipts for explicit authored actions.
   Opt-in only. A different RNG stream from the Party session is required. */
(function (root) {
  'use strict';
  function createSession(Critical, Levels, options = {}) {
    if (!Critical?.createResolver || !Levels?.createTuning)
      throw Error('Native World criticals need both contract modules');
    if (options.enabled !== true)
      return Object.freeze({
        enabled: false, release() { return null; }, enhance(_r, value) { return value; },
      });
    const resolver = Critical.createResolver({ enabled: true, stream: options.stream });
    const tuning = options.tuning || Levels.createTuning();
    function release(game, key, source) {
      const def = Levels.ACTIONS[key];
      if (!def || def.group !== 'world')
        throw Error('Unknown native World critical action: ' + key);
      if (!game?.s || typeof source !== 'string' || !source)
        throw Error('World action needs real campaign and actor');
      const sample = resolver.release({
        action: {}, key, domain: 'world', released: true,
      });
      const intensity = tuning.effectFor(key, 'world', game.s.mode || 'normal');
      return Object.freeze({
        ...sample, source, group: 'world', intensity: intensity.level,
        effect: sample.critical ? intensity : null,
      });
    }
    return Object.freeze({
      enabled: true, release,
      enhance(receipt, current, lever, bounds) {
        return Levels.enhanceExisting(receipt, current, lever, bounds);
      },
      criticalLevels() { return tuning.snapshot(); },
      setCriticalLevel(group, level, mode) {
        if (group !== 'world') throw Error('World session cannot change Party tuning');
        return tuning.setLevel(group, level, mode);
      },
    });
  }
  const API = Object.freeze({ createSession });
  if (typeof module !== 'undefined') module.exports = API;
  else root.PrototypeCriticalWorldNative = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
