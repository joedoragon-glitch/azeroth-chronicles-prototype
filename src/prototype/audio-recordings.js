/* Recorded sources, synchronized loop groups and procedural fallback. */
(function (root) {
  'use strict';
  const Assets =
    typeof module !== 'undefined' ? require('./audio-assets.js') : root.PrototypeAudioAssets;
  const contract =
    typeof module !== 'undefined' ? require('./audio-contract.js') : root.PrototypeAudioContract;
  function install(Audio) {
    const clamp = (n, fallback = 1) =>
      Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
    class Owner {
      configureRecordings(manifest, options = {}) {
        if (
          !manifest ||
          manifest.schemaVersion !== 1 ||
          !manifest.assets ||
          Array.isArray(manifest.assets)
        )
          throw Error('Invalid recording manifest');
        contract.validateCatalog(manifest);
        this.stopEnvironment();
        this.stopRecordedScore(0);
        for (const voice of [...this.voices]) if (voice.recorded) this.stopRecording(voice, 0);
        this.recordingAssets?.dispose();
        this.recordingAssets = null;
        this.recordingManifest = JSON.parse(JSON.stringify(manifest));
        this.recordingOptions = options;
        this.environmentError = null;
        if (this.ctx && this.production) this.ambient();
        this.recordingEpoch = (this.recordingEpoch || 0) + 1;
        this.recordedCueKey = null;
        this.recordingError = null;
        this.productionKey = null;
        this.productionIntensity = null;
        this.soundLoads = new Set();
        this.soundFailures = new Set();
      }
      setRecordedCueRules(rules = []) {
        const fields = [
          'region',
          'zone',
          'interior',
          'settlement',
          'situation',
          'night',
          'peace',
          'bossFamily',
          'bossForm',
        ];
        if (
          !Array.isArray(rules) ||
          rules.length > 128 ||
          rules.some(
            (r) =>
              !r.id ||
              !r.when ||
              Object.keys(r.when).some((k) => !fields.includes(k)) ||
              !r.score?.stems,
          )
        )
          throw Error('Invalid recorded cue rules');
        if (new Set(rules.map((r) => r.id)).size !== rules.length)
          throw Error('Duplicate recorded cue rule');
        this.recordedCueRules = JSON.parse(JSON.stringify(rules));
        this.stopRecordedScore();
        this.recordedCueKey = null;
        this.productionKey = null;
        this.productionIntensity = null;
      }
      matchingRecordedRule(scene, rules = this.recordedCueRules) {
        const observed = {
          ...scene,
          bossFamily: scene.boss?.family || null,
          bossForm: scene.boss?.form || null,
        };
        return rules?.find((r) => Object.entries(r.when).every(([k, v]) => observed[k] === v));
      }
      updateRecordedCue(scene) {
        // Production owns selection when enabled, including explicit rule overrides.
        if (this.production || !this.recordedCueRules?.length || !this.ctx || this.paused) return;
        const rule = this.matchingRecordedRule(scene);
        const key = rule?.id || 'procedural';
        if (key === this.recordedCueKey) return;
        this.recordedCueKey = key;
        if (rule && this.recordedScore?.id === rule.id) return;
        if (rule) void this.setRecordedScore({ ...rule.score, id: rule.id });
        else this.stopRecordedScore();
      }
      playSoundEvent(key, details = {}) {
        if (!this.ctx || this.paused || this.settings.muted || this.ctx.state !== 'running')
          return false;
        const scene = this.context || {},
          observed = {
            ...scene,
            bossFamily: scene.boss?.family || null,
            bossForm: scene.boss?.form || null,
            ...details,
          },
          binding = this.soundCatalog().director?.events?.[key]?.find((b) =>
            Object.entries(b.when || {}).every(([field, value]) => observed[field] === value),
          );
        if (!binding) return false;
        const assets = this.recordingAssets,
          item = assets?.touch(binding.asset);
        if (!item) {
          // Warm the next occurrence. Never delay an impact/click or play it after a fetch.
          this.soundLoads ||= new Set();
          this.soundFailures ||= new Set();
          if (this.soundLoads.size >= 2 || (assets?.pending.size || 0) >= 6) return false;
          if (!this.soundLoads.has(binding.asset) && !this.soundFailures.has(binding.asset)) {
            const epoch = this.recordingEpoch || 0,
              loads = this.soundLoads,
              failures = this.soundFailures;
            loads.add(binding.asset);
            void this.assetsForRecordings()
              .then((store) => store.load(binding.asset))
              .catch((error) => {
                if (epoch === (this.recordingEpoch || 0)) {
                  failures.add(binding.asset);
                  this.recordingError = error.message;
                }
              })
              .finally(() => loads.delete(binding.asset));
          }
          return false;
        }
        if (!this.allowSfx('recorded-event:' + key, this.ctx.currentTime, binding.minGap ?? 0.025))
          return true;
        try {
          const bus =
            binding.bus ||
            (key.startsWith('interface.')
              ? 'interface'
              : key.startsWith('ambience.')
                ? 'ambience'
                : 'effects');
          return !!this.createRecording(binding.asset, item, assets, {
            gain: binding.gain ?? 0.35,
            pan: binding.pan ?? 0,
            priority: Math.max(
              this.sourcePriority ?? (bus === 'interface' ? 3 : 1),
              binding.priority ?? 0,
            ),
            bus,
            loop: false,
            fade: 0.005,
          });
        } catch (error) {
          this.recordingError = error.message;
          return false;
        }
      }
      async assetsForRecordings() {
        if (!this.ctx || this.paused || this.ctx.state !== 'running')
          throw Error('Audio is locked or paused');
        const ctx = this.ctx,
          epoch = this.recordingEpoch || 0;
        if (!this.recordingManifest) {
          if (!this.manifestRequest) {
            const controller = new AbortController();
            this.manifestController = controller;
            const timer = root.setTimeout(() => controller.abort(), 15000);
            this.manifestRequest = root
              .fetch(
                new URL(
                  './assets/audio/manifest.json',
                  root.location?.href || 'https://localhost/',
                ),
                { signal: controller.signal },
              )
              .then(async (r) => {
                if (!r.ok) throw Error('Recording registry unavailable');
                const text = await r.text();
                if (new TextEncoder().encode(text).byteLength > 256 * 1024)
                  throw Error('Recording registry exceeds budget');
                return JSON.parse(text);
              })
              .finally(() => {
                root.clearTimeout(timer);
                this.manifestRequest = null;
                this.manifestController = null;
              });
          }
          const manifest = await this.manifestRequest;
          if (ctx !== this.ctx || epoch !== (this.recordingEpoch || 0))
            throw Error('Audio changed during registry load');
          contract.validateCatalog(manifest);
          this.recordingManifest = manifest;
        }
        if (!this.recordingAssets)
          this.recordingAssets = new Assets(ctx, this.recordingManifest, this.recordingOptions);
        return this.recordingAssets;
      }
      createRecording(id, item, assets, options = {}) {
        if (!this.ctx || this.paused || this.ctx.state !== 'running' || assets.closed) return null;
        for (const key of ['at', 'gain', 'pan', 'priority', 'fade'])
          if (options[key] !== undefined && !Number.isFinite(options[key]))
            throw Error('Invalid source option: ' + key);
        const bus = options.bus || (item.entry.kind === 'effect' ? 'effects' : item.entry.kind);
        if (!['music', 'ambience', 'effects', 'interface'].includes(bus) || !this.buses?.[bus])
          throw Error('Invalid recording bus');
        const priority = Number.isFinite(options.priority)
          ? Math.max(0, Math.min(3, options.priority))
          : bus === 'interface'
            ? 3
            : bus === 'music'
              ? 0
              : 1;
        if (!this.reserveVoice(priority)) return null;
        assets.retain(id, item);
        const source = this.ctx.createBufferSource(),
          gain = this.ctx.createGain();
        const now = this.ctx.currentTime,
          at = Math.max(now + 0.005, options.at || 0),
          fade = Math.max(0, Math.min(4, options.fade ?? 0.025));
        source.buffer = item.buffer;
        source.loop = options.loop ?? !!item.entry.loop;
        if (source.loop) {
          source.loopStart = item.entry.loop?.start || 0;
          source.loopEnd = Math.min(
            item.buffer.duration,
            item.entry.loop?.end || item.buffer.duration,
          );
        }
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(clamp(options.gain), at + fade);
        source.connect(gain);
        let pan = null;
        if (this.ctx.createStereoPanner) {
          pan = this.ctx.createStereoPanner();
          pan.pan.value =
            this.mixProfile === 'phone' ? 0 : Math.max(-1, Math.min(1, options.pan || 0));
          gain.connect(pan);
          pan.connect(this.buses[bus]);
        } else gain.connect(this.buses[bus]);
        let released = false;
        const voice = {
          osc: source,
          gain,
          pan,
          bus,
          score: null,
          recorded: true,
          priority,
          id,
          item,
          at,
          offset: source.loop ? source.loopStart : 0,
          targetGain: clamp(options.gain),
          authoredPan: Math.max(-1, Math.min(1, options.pan || 0)),
          release: () => {
            if (!released) {
              released = true;
              assets.release(item);
            }
          },
        };
        source.onended = () => {
          source.disconnect();
          gain.disconnect();
          pan?.disconnect();
          voice.release();
          this.voices.delete(voice);
          if (
            voice.recordedScore &&
            voice.recordedScore === this.recordedScore &&
            !this.recordedScore.voices.some((v) => this.voices.has(v))
          )
            this.recordedScore = null;
        };
        this.voices.add(voice);
        try {
          source.start(at, voice.offset);
        } catch (error) {
          source.disconnect();
          gain.disconnect();
          pan?.disconnect();
          voice.release();
          this.voices.delete(voice);
          throw error;
        }
        return voice;
      }
      async playRecording(id, options = {}) {
        const ctx = this.ctx,
          epoch = this.recordingEpoch || 0;
        try {
          const assets = await this.assetsForRecordings(),
            item = await assets.load(id);
          if (ctx !== this.ctx || epoch !== (this.recordingEpoch || 0)) return null;
          const voice = this.createRecording(id, item, assets, options);
          if (voice) this.recordingError = null;
          return voice;
        } catch (error) {
          this.recordingError = error.message;
          return null;
        }
      }
      stopRecording(voice, seconds = 0.08) {
        if (!voice || !this.voices.has(voice) || !this.ctx) return;
        const now = this.ctx.currentTime;
        seconds = Math.max(0, Math.min(4, seconds));
        if (voice.gain.gain.cancelAndHoldAtTime) voice.gain.gain.cancelAndHoldAtTime(now);
        else {
          voice.gain.gain.cancelScheduledValues(now);
          voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
        }
        voice.gain.gain.linearRampToValueAtTime(0, now + seconds);
        try {
          voice.osc.stop(now + seconds + 0.01);
        } catch (_) {}
        if (!seconds) {
          voice.osc.disconnect();
          voice.gain.disconnect();
          voice.pan?.disconnect();
          voice.release();
          this.voices.delete(voice);
        }
      }
      stopRecordedScore(seconds = 0.15) {
        this.recordedRequest = (this.recordedRequest || 0) + 1;
        for (const voice of [...this.voices])
          if (voice.recordedScore) this.stopRecording(voice, seconds);
        this.recordedScore = null;
        if (this.ctx) this.next = this.ctx.currentTime + 0.06;
      }
      async setRecordedScore(spec) {
        const request = (this.recordedRequest || 0) + 1;
        this.recordedRequest = request;
        const ctx = this.ctx;
        try {
          if (!spec || !Array.isArray(spec.stems) || !spec.stems.length || spec.stems.length > 4)
            throw Error('Recorded score needs 1–4 stems');
          const assets = await this.assetsForRecordings(),
            held = [];
          try {
            // Pin each stem while later stems decode; no queued stem can evict it.
            for (const stem of spec.stems) {
              const item = await assets.load(stem.id);
              if (item.entry.kind !== 'music' || !item.entry.loop)
                throw Error('Score stems need music loop metadata');
              assets.retain(stem.id, item);
              held.push({ stem, item });
            }
            if (
              ctx !== this.ctx ||
              request !== this.recordedRequest ||
              this.paused ||
              ctx.state !== 'running'
            )
              return false;
            const loop = held[0].item.entry.loop,
              duration = loop.end - loop.start;
            for (const { item } of held)
              if (
                Math.abs(item.entry.loop.end - item.entry.loop.start - duration) >
                1 / ctx.sampleRate
              )
                throw Error('Stem loop lengths must match within one sample');
            const now = ctx.currentTime,
              bpm = spec.bpm ?? 120,
              bars = spec.quantizeBars ?? 0;
            if (!Number.isFinite(bpm) || bpm < 30 || bpm > 300 || ![0, 1, 2, 4].includes(bars))
              throw Error('Invalid score grid');
            const grid = (bars * 4 * 60) / bpm,
              origin = this.recordedScore?.at || now;
            const at = grid ? origin + Math.ceil((now + 0.06 - origin) / grid) * grid : now + 0.06;
            if (spec.fade !== undefined && !Number.isFinite(spec.fade))
              throw Error('Invalid score fade');
            const fade = Math.max(0.025, Math.min(4, spec.fade ?? 0.5));
            // At most one outgoing group; repeated switches cannot accumulate loops.
            for (const v of [...this.voices])
              if (v.recordedScore && v.recordedScore !== this.recordedScore)
                this.stopRecording(v, 0);
            const old = this.recordedScore,
              voices = [];
            for (const { stem, item } of held) {
              const voice = this.createRecording(stem.id, item, assets, {
                at,
                fade,
                gain: stem.gain,
                loop: true,
                bus: 'music',
                priority: 2,
              });
              if (!voice) {
                for (const v of voices) this.stopRecording(v, 0);
                throw Error('No voices for score');
              }
              voices.push(voice);
            }
            const group = {
              id: spec.id || spec.stems.map((s) => s.id).join('+'),
              at,
              bpm,
              duration,
              voices,
            };
            for (const v of voices) v.recordedScore = group;
            if (old)
              for (const v of old.voices) {
                v.gain.gain.cancelScheduledValues(at);
                v.gain.gain.setValueAtTime(v.gain.gain.value, at);
                v.gain.gain.linearRampToValueAtTime(0, at + fade);
                v.osc.stop(at + fade + 0.01);
              }
            for (const s of [...this.scores]) this.retireScore(s, fade, at);
            this.recordedScore = group;
            this.recordingError = null;
            return true;
          } finally {
            for (const { item } of held) assets.release(item);
          }
        } catch (error) {
          if (ctx === this.ctx && request === this.recordedRequest) {
            this.recordingError = error.message;
            this.stopRecordedScore();
          }
          return false;
        }
      }
      setStemGain(index, value, seconds = 0.15) {
        const voice = this.recordedScore?.voices[index];
        if (!voice || !this.ctx) return;
        const now = this.ctx.currentTime;
        if (voice.gain.gain.cancelAndHoldAtTime) voice.gain.gain.cancelAndHoldAtTime(now);
        else {
          voice.gain.gain.cancelScheduledValues(now);
          voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
        }
        voice.gain.gain.linearRampToValueAtTime(
          clamp(value),
          now + Math.max(0.02, Math.min(4, seconds)),
        );
        voice.targetGain = clamp(value);
      }
      recordingStatus() {
        return {
          environment: this.environmentVoice
            ? {
                id: this.environmentVoice.id,
                at: this.environmentVoice.at,
                gain: this.environmentVoice.targetGain,
              }
            : null,
          environmentError: this.environmentError || null,
          score: this.recordedScore
            ? {
                id: this.recordedScore.id,
                at: this.recordedScore.at,
                stems: this.recordedScore.voices.map((v) => v.id),
                bpm: this.recordedScore.bpm,
              }
            : null,
          voices: [...this.voices].filter((v) => v.recorded).length,
          assets: this.recordingAssets?.status() || null,
          lastError: this.recordingError || null,
        };
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
  else root.PrototypeAudioRecordings = { install };
})(typeof window !== 'undefined' ? window : globalThis);
