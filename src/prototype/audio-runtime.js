/* Audio owner: runtime. Keep campaign rules outside this module. */
(function (root) {
  'use strict';
  function install(Audio, catalog) {
    class Owner {
      status() {
        return {
          state: this.ctx?.state || 'locked',
          paused: this.paused,
          cue: this.cue ? { ...this.cue } : null,
          context: this.context
            ? { ...this.context, boss: this.context.boss ? { ...this.context.boss } : null }
            : null,
          voices: this.voices.size,
          maxVoices: 64,
          scores: this.scores.length,
          ambienceLayers: this.noise ? 1 : 0,
          settings: { ...this.settings },
        };
      }
      setSettings(settings) {
        for (const k of ['master', 'music', 'ambience', 'effects'])
          if (Number.isFinite(settings[k]))
            this.settings[k] = Math.max(0, Math.min(1, settings[k]));
        if (typeof settings.muted === 'boolean') this.settings.muted = settings.muted;
        this.applySettings();
      }
      applySettings() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        for (const [key, node] of Object.entries(this.buses || {})) {
          const volume = this.settings[key] * (this.settings.muted ? 0 : 1);
          const ducked = ['music', 'ambience'].includes(key) && this.duckUntil > now;
          node.gain.cancelScheduledValues(now);
          node.gain.setTargetAtTime(volume * (ducked ? 0.4 : 1), now, 0.04);
          if (ducked) node.gain.setTargetAtTime(volume, this.duckUntil, 0.1);
        }
      }
      duck(seconds = 0.55) {
        if (!this.ctx) return;
        this.duckUntil = this.ctx.currentTime + seconds;
        this.applySettings();
      }
      async unlock() {
        try {
          const A = root.AudioContext || root.webkitAudioContext;
          if (!A) return false;
          if (!this.ctx) {
            this.ctx = new A();
            this.buses = {};
            for (const key of ['master', 'music', 'ambience', 'effects'])
              this.buses[key] = this.ctx.createGain();
            const compressor = this.ctx.createDynamicsCompressor();
            compressor.threshold.value = -10;
            compressor.ratio.value = 8;
            this.buses.master.connect(compressor);
            compressor.connect(this.ctx.destination);
            for (const key of ['music', 'ambience', 'effects'])
              this.buses[key].connect(this.buses.master);
            this.applySettings();
            this.next = this.ctx.currentTime + 0.05;
            this.clock = root.setInterval(() => this.schedule(), 25);
            this.ambient();
          }
          if (this.paused) {
            if (this.ctx.state === 'running') await this.ctx.suspend();
            return false;
          }
          if (!this.paused && ['suspended', 'interrupted'].includes(this.ctx.state)) {
            const ctx = this.ctx;
            await ctx.resume();
            if (this.ctx !== ctx) return false;
            if (this.paused) {
              await ctx.suspend();
              return false;
            }
            this.next = ctx.currentTime + 0.06;
          }
          return !this.paused && this.ctx?.state === 'running';
        } catch (_) {
          return false;
        }
      }
      setPaused(paused) {
        if (this.paused === paused) return;
        this.paused = paused;
        if (!this.ctx) return;
        if (paused) {
          this.ctx.suspend().catch(() => {});
        } else {
          const ctx = this.ctx;
          ctx
            .resume()
            .then(() => {
              if (this.ctx !== ctx) return;
              if (this.paused) return ctx.suspend();
              this.next = ctx.currentTime + 0.06;
            })
            .catch(() => {});
        }
      }
      tone(midi, at, duration, volume = 0.04, type = 'sine', bus = 'music', attack = 0.03) {
        if (!this.ctx || this.voices.size >= 64) return;
        const osc = this.ctx.createOscillator(),
          gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(440 * 2 ** ((midi - 69) / 12), at);
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(volume, at + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + Math.max(0.04, duration));
        osc.connect(gain);
        if (bus === 'music' && !this.score) this.transitionScore(this.cue || { id: 'vale' });
        gain.connect(bus === 'music' ? this.score.node : this.buses[bus]);
        const v = { osc, gain, bus, score: bus === 'music' ? this.score : null };
        this.voices.add(v);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
          this.voices.delete(v);
        };
        osc.start(at);
        osc.stop(at + duration + 0.05);
      }
      noiseBurst(
        at,
        duration = 0.08,
        volume = 0.04,
        filterType = 'bandpass',
        frequency = 1200,
        q = 0.7,
      ) {
        if (!this.ctx || !this.buses?.effects || this.voices.size >= 64) return;
        const length = Math.max(8, Math.floor(this.ctx.sampleRate * duration)),
          buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate),
          data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
        const source = this.ctx.createBufferSource(),
          filter = this.ctx.createBiquadFilter(),
          gain = this.ctx.createGain();
        source.buffer = buffer;
        filter.type = filterType;
        filter.frequency.setValueAtTime(frequency, at);
        if (filter.Q) filter.Q.value = q;
        gain.gain.setValueAtTime(Math.max(0.0001, volume), at);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.buses.effects);
        const voice = { osc: source, filter, gain, bus: 'effects', score: null };
        this.voices.add(voice);
        source.onended = () => {
          source.disconnect();
          filter.disconnect();
          gain.disconnect();
          this.voices.delete(voice);
        };
        source.start(at);
        source.stop(at + duration + 0.02);
      }
      sweep(fromMidi, toMidi, at, duration = 0.1, volume = 0.04, type = 'triangle') {
        if (!this.ctx || this.voices.size >= 64) return;
        const osc = this.ctx.createOscillator(),
          gain = this.ctx.createGain(),
          hz = (m) => 440 * 2 ** ((m - 69) / 12);
        osc.type = type;
        osc.frequency.setValueAtTime(hz(fromMidi), at);
        osc.frequency.exponentialRampToValueAtTime(hz(toMidi), at + duration);
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.linearRampToValueAtTime(volume, at + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
        osc.connect(gain);
        gain.connect(this.buses.effects);
        const v = { osc, gain, bus: 'effects', score: null };
        this.voices.add(v);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
          this.voices.delete(v);
        };
        osc.start(at);
        osc.stop(at + duration + 0.03);
      }
      dispose() {
        if (this.clock !== null) root.clearInterval(this.clock);
        this.clock = null;
        if (this.noise) {
          try {
            this.noise.source.stop();
          } catch (_) {}
          for (const key of ['source', 'filter', 'gain']) this.noise[key].disconnect();
          this.noise = null;
        }
        for (const voice of this.voices) {
          try {
            voice.osc.stop();
          } catch (_) {}
          voice.osc.disconnect();
          voice.gain.disconnect();
          voice.filter?.disconnect();
        }
        for (const score of this.scores) score.node.disconnect();
        for (const bus of Object.values(this.buses || {})) bus.disconnect();
        if (this.ctx) this.ctx.close().catch(() => {});
        this.ctx = null;
        this.buses = null;
        this.score = null;
        this.scores = [];
        this.key = null;
        this.duckUntil = 0;
        this.finaleUntil = 0;
        this.lastWarning = -Infinity;
        this.lastSfx = {};
        this.voices.clear();
      }
    }
    for (const name of Object.getOwnPropertyNames(Owner.prototype))
      if (name !== 'constructor')
        Object.defineProperty(
          Audio.prototype,
          name,
          Object.getOwnPropertyDescriptor(Owner.prototype, name),
        );
  }
  if (typeof module !== 'undefined') module.exports = { install };
  else root.PrototypeAudioRuntime = { install };
})(typeof window !== 'undefined' ? window : globalThis);
