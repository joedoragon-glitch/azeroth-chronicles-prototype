/* Optional Stage 1 audio observation. Never loaded by the production game. */
(function (root) {
  'use strict';
  const active = new WeakMap();
  function attach(audio, { limit = 400 } = {}) {
    if (!audio || typeof audio.playSoundEvent !== 'function' || typeof audio.productionCue !== 'function')
      throw Error('A live PrototypeAudio instance is required');
    if (active.has(audio)) throw Error('Audio coverage probe already attached');
    if (!Number.isInteger(limit) || limit < 10 || limit > 2000) throw Error('Invalid trace limit');
    const events = [], counts = Object.create(null), originals = [], tally = { recordings: 0, procedural: 0, throttled: 0 };
    const stamp = () => Number.isFinite(audio.ctx?.currentTime) ? +audio.ctx.currentTime.toFixed(3) : null;
    const push = (type, detail = {}) => {
      counts[type] = (counts[type] || 0) + 1;
      if (events.length >= limit) events.shift();
      events.push({ at: stamp(), type, ...detail });
    };
    function wrap(name, handler) {
      if (typeof audio[name] !== 'function') return;
      const owned = Object.prototype.hasOwnProperty.call(audio, name);
      const previous = Object.getOwnPropertyDescriptor(audio, name);
      const original = audio[name];
      const wrapped = function (...args) { return handler.call(this, original, args); };
      Object.defineProperty(audio, name, { configurable: true, writable: true, value: wrapped });
      originals.push({ name, previous, owned, wrapped });
    }
    const reason = (a) => !a.ctx ? 'locked' : a.paused ? 'paused' : a.settings?.muted ? 'muted'
      : a.ctx.state !== 'running' ? 'context_not_running' : null;
    wrap('createRecording', function (fn, args) {
      const voice = fn.apply(this, args);
      if (voice) {
        tally.recordings++;
        push('recording_started', { asset: args[0], bus: args[3]?.bus || null });
      }
      return voice;
    });
    for (const name of ['tone', 'noiseBurst', 'sweep']) {
      wrap(name, function (fn, args) {
        // Source attempt, not a guarantee that a hardware speaker produced a sound.
        tally.procedural++;
        push('procedural_attempt', { recipe: name });
        return fn.apply(this, args);
      });
    }
    wrap('allowSfx', function (fn, args) {
      const accepted = fn.apply(this, args);
      if (!accepted) {
        tally.throttled++;
        push('throttled', { key: String(args[0]).slice(0, 120) });
      }
      return accepted;
    });
    wrap('playSoundEvent', function (fn, args) {
      const [key, details = {}] = args;
      const bindings = this.soundCatalog()?.director?.events?.[key] || [];
      const scene = this.context || {};
      const observed = { ...scene, bossFamily: scene.boss?.family || null, bossForm: scene.boss?.form || null, ...details };
      const selected = bindings.find((b) => Object.entries(b.when || {}).every(([field, value]) => observed[field] === value));
      const blocked = reason(this) || (this.optimizationMode && key.startsWith('ambience.') ? 'optimization' : null);
      const pre = tally.recordings, previousThrottle = tally.throttled;
      const available = selected && this.recordingAssets?.cache?.has(selected.asset);
      const result = fn.apply(this, args);
      const outcome = tally.recordings > pre ? 'recording_started' : blocked ||
        !bindings.length ? (blocked || 'no_recording_binding') :
        !selected ? 'condition_unmatched' :
        tally.throttled > previousThrottle ? 'throttled' :
        !available ? 'cold_or_unavailable' : result ? 'accepted_no_source' : 'source_not_started';
      push('event_route', { key, asset: selected?.asset || null, outcome });
      return result;
    });
    wrap('effect', function (fn, args) {
      const input = args[0];
      const e = typeof input === 'string' ? { type: input } : input || {};
      const preRecorded = tally.recordings, preProcedural = tally.procedural, preThrottle = tally.throttled;
      const result = fn.apply(this, args);
      const outcome = tally.recordings > preRecorded ? 'recording_started'
        : tally.procedural > preProcedural ? 'procedural_attempted'
          : reason(this) || (tally.throttled > preThrottle ? 'throttled' : 'no_source_observed');
      push('effect_receipt', {
        event: e.type || 'unknown', stage: e.stage || e.phase || null,
        slot: Number.isInteger(e.slot) ? e.slot : null,
        skillId: typeof e.skillId === 'string' ? e.skillId.slice(0, 120) : null,
        outcome,
      });
      return result;
    });
    wrap('setRecordedScore', function (fn, args) {
      const spec = args[0];
      push('score_requested', { id: spec?.id || null, stems: spec?.stems?.map((s) => s.id) || [] });
      return Promise.resolve(fn.apply(this, args)).then((ok) => {
        push('score_resolved', { id: spec?.id || null, outcome: ok ? 'started' : 'failed', error: ok ? null : this.recordingError || null });
        return ok;
      }, (error) => {
        push('score_resolved', { id: spec?.id || null, outcome: 'rejected', error: error?.message || String(error) });
        throw error;
      });
    });
    wrap('updateEnvironment', function (fn, args) {
      const before = this.environmentKey || null;
      const result = fn.apply(this, args);
      if ((this.environmentKey || null) !== before)
        push('environment_selection', { key: this.environmentKey || null, asset: this.environmentVoice?.id || null });
      return result;
    });
    wrap('setOptimizationMode', function (fn, args) {
      const was = !!this.optimizationMode;
      const result = fn.apply(this, args);
      if (was !== !!this.optimizationMode) push('optimization', { enabled: !!this.optimizationMode });
      return result;
    });
    function snapshot(scene = audio.context || null) {
      const expectedScore = scene && audio.productionCue(scene);
      const expectedEnvironment = scene && audio.environmentCue(scene);
      const activeScore = audio.recordedScore;
      const status = audio.recordingStatus?.() || {};
      return {
        context: scene ? {
          region: scene.region || null, zone: scene.zone || null, interior: scene.interior || null,
          situation: scene.situation || null, night: !!scene.night, peace: !!scene.peace,
          bossFamily: scene.boss?.family || null, bossForm: scene.boss?.form || null,
          engaged: scene.engaged || 0,
        } : null,
        expectedScore: expectedScore ? {
          id: expectedScore.id, stems: expectedScore.stems.map((s) => ({ id: s.id, requestedGain: s.gain })),
        } : null,
        activeScore: activeScore ? {
          id: activeScore.id, stems: activeScore.voices.map((v) => ({ id: v.id || null, gain: v.targetGain ?? null })),
        } : null,
        expectedEnvironment: expectedEnvironment?.asset || null,
        activeEnvironment: audio.environmentVoice?.id || null,
        proceduralScoreActive: !!audio.score && (!activeScore || (audio.ctx && audio.ctx.currentTime < (activeScore.at ?? 0))),
        proceduralAmbientActive: !!audio.noise, environmentFallback: !!audio.environmentFallback,
        productionSelectionKey: audio.productionKey || null, environmentSelectionKey: audio.environmentKey || null,
        optimization: !!audio.optimizationMode, muted: !!audio.settings?.muted,
        paused: !!audio.paused, contextState: audio.ctx?.state || 'locked',
        busGain: Object.fromEntries(['master', 'music', 'ambience', 'effects', 'interface'].map((key) =>
          [key, audio.ctx && typeof audio.mixLevel === 'function' ? audio.mixLevel(key) : null])),
        pendingLoads: status.assets?.pending ?? null,
        decodedBytes: status.assets?.decodedBytes ?? null,
        recordedError: status.lastError || null,
        environmentError: status.environmentError || null,
      };
    }
    const api = {
      snapshot,
      report: () => ({ schemaVersion: 1, mode: 'development-observation',
        caveat: 'Routing/source attempts are not physical speaker certification',
        counts: { ...counts }, recent: events.slice(), latest: snapshot() }),
      detach: () => {
        for (const { name, previous, owned, wrapped } of originals.reverse()) {
          if (audio[name] !== wrapped) continue;
          if (owned) Object.defineProperty(audio, name, previous);
          else delete audio[name];
        }
        active.delete(audio);
        return true;
      },
    };
    active.set(audio, api);
    return api;
  }
  const api = { attach };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AudioCoverageProbe = api;
})(typeof window !== 'undefined' ? window : globalThis);
