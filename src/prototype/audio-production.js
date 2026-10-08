/* Authored contextual soundtrack and foreground sound direction. No gameplay writes. */
(function (root) {
  'use strict';
  const library =
    typeof module !== 'undefined' ? require('./audio-library.js') : root.PrototypeAudioLibrary;
  const contract =
    typeof module !== 'undefined' ? require('./audio-contract.js') : root.PrototypeAudioContract;
  const places = library.director?.places || {};
  const bossTempos = Object.fromEntries(
    Object.entries(library.director?.bosses || {}).map(([id, boss]) => [
      id,
      library.tempos[boss.base],
    ]),
  );
  function install(Audio) {
    class Owner {
      enableProduction(enabled = true) {
        this.production = !!enabled;
        this.productionKey = null;
        this.productionIntensity = null;
        if (this.compressor) {
          this.compressor.threshold.value = enabled ? -14 : -10;
          this.compressor.ratio.value = enabled ? 3.5 : 8;
        }
        if (enabled) this.buildStudio();
        if (!enabled) {
          if (this.studio) {
            this.buses.music.disconnect(this.studio.send);
            this.buses.interface.disconnect(this.studio.send);
            for (const node of Object.values(this.studio)) node.disconnect();
            this.studio = null;
          }
          this.stopRecordedScore();
        }
      }
      soundCatalog() {
        const manifest = this.recordingManifest;
        if (this.catalogManifest !== manifest || !this.activeCatalog) {
          this.activeCatalog = manifest?.director ? contract.runtimeCatalog(manifest) : library;
          this.catalogManifest = manifest;
        }
        return this.activeCatalog;
      }
      productionCue(scene) {
        const { director, tempos } = this.soundCatalog();
        if (!director) return null;
        const rule =
          this.matchingRecordedRule(scene) || this.matchingRecordedRule(scene, director.rules);
        if (rule)
          return {
            ...rule.score,
            id: rule.id,
            bpm: rule.score.bpm ?? tempos[rule.score.stems[0].id],
            custom: true,
          };
        const special = (key) => {
          const cue = director.specials[key];
          return {
            id: cue.asset,
            stems: [{ id: cue.asset, gain: cue.gain }],
            bpm: tempos[cue.asset],
          };
        };
        if (scene.started === false || scene.situation === 'title') return special('title');
        if (scene.gameOver || scene.situation === 'game-over') return special('defeat');
        if (this.ctx && this.ctx.currentTime < this.finaleUntil && scene.peace)
          return special('finale');
        const boss = director.bosses[scene.boss?.family];
        if (scene.boss && !scene.peace && boss) {
          return {
            id: boss.base,
            bpm: tempos[boss.base],
            fade: boss.fade ?? 0.7,
            stems: [
              { id: boss.base, gain: boss.gain ?? 0.78 },
              {
                id: boss.true,
                gain:
                  scene.boss.form === 'true' ? (boss.trueGain ?? 0.55) : (boss.idleGain ?? 0.12),
              },
            ],
          };
        }
        const p =
          director.places[scene.zone] ||
          director.places[scene.region] ||
          director.places[director.fallbackPlace];
        let base = scene.peace && p.peace ? p.peace : p.base;
        if (!scene.peace && scene.interior === 'outdoors') {
          if (scene.settlement && p.settlement) base = p.settlement;
          else if (scene.night && p.night) base = p.night;
        }
        return {
          id: base,
          bpm: tempos[base],
          fade: p.fade ?? 1.2,
          stems: [
            {
              id: base,
              gain: scene.night
                ? (p.nightGain ?? 0.58)
                : scene.settlement
                  ? (p.settlementGain ?? 0.62)
                  : (p.gain ?? 0.74),
            },
            ...(p.action && !scene.peace ? [{ id: p.action, gain: 0 }] : []),
          ],
        };
      }
      updateProduction(scene) {
        if (!this.production || !this.ctx || this.paused || this.ctx.state !== 'running') return;
        const mix =
          scene.situation === 'menu' ? 'menu' : scene.situation === 'title' ? 'title' : 'world';
        if (this.mixScene !== mix) this.setSceneMix(mix);
        const now = this.ctx.currentTime;
        if (scene.settlement) {
          this.settlementUntil = now + 4;
          this.settlementZone = scene.zone;
        }
        const observed =
          scene.interior === 'outdoors' &&
          scene.zone === this.settlementZone &&
          now < (this.settlementUntil || 0)
            ? { ...scene, settlement: scene.settlement || 'nearby-refuge' }
            : scene;
        const spec = this.productionCue(observed);
        if (!spec) return;
        const selectionKey = JSON.stringify([
          spec.id,
          spec.stems.map((s) => s.id),
          spec.bpm,
          spec.custom ? spec.stems.map((s) => s.gain) : null,
        ]);
        if (selectionKey !== this.productionKey) {
          this.productionKey = selectionKey;
          this.productionIntensity = null;
          this.stepDistance = 0;
          const wanted = selectionKey;
          if (this.recordedScore?.selectionKey !== selectionKey)
            void this.setRecordedScore(spec).then((ok) => {
              if (ok && this.productionKey === wanted) {
                this.recordedScore.selectionKey = selectionKey;
                this.productionIntensity = null;
              }
            });
        }
        const group = this.recordedScore;
        if (!group || group.id !== spec.id) return;
        if (spec.custom) {
          this.sceneDetails(scene);
          return;
        }
        if (scene.engaged && !scene.peace) this.combatUntil = now + 2.5;
        const combat = !scene.peace && now < (this.combatUntil || 0);
        const intensity = scene.boss
          ? spec.stems[1]?.gain || 0
          : combat
            ? Math.min(0.55, 0.28 + scene.engaged * 0.045)
            : 0;
        const baseGain = spec.stems[0].gain;
        const key = [intensity, baseGain].join(':');
        if (key !== this.productionIntensity) {
          this.setStemGain(0, baseGain, 1.2);
          if (group.voices.length > 1) this.setStemGain(1, intensity, intensity ? 0.25 : 2.2);
          this.productionIntensity = key;
        }
        this.sceneDetails(scene);
      }
      buildStudio() {
        if (!this.production || !this.ctx || this.studio || !this.ctx.createConvolver) return;
        const ctx = this.ctx,
          length = Math.floor(ctx.sampleRate * 1.2),
          buffer = ctx.createBuffer(2, length, ctx.sampleRate);
        let seed = 73241;
        for (let ch = 0; ch < 2; ch++) {
          const data = buffer.getChannelData(ch);
          for (let i = 0; i < length; i++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            data[i] = ((seed / 4294967296) * 2 - 1) * Math.exp((-6 * i) / length) * 0.12;
          }
        }
        const convolver = ctx.createConvolver(),
          wet = ctx.createGain(),
          send = ctx.createGain();
        convolver.buffer = buffer;
        wet.gain.value = 0.13;
        send.gain.value = 0.65;
        this.buses.music.connect(send);
        this.buses.interface.connect(send);
        send.connect(convolver);
        convolver.connect(wet);
        wet.connect(this.buses.master);
        this.studio = { convolver, wet, send };
      }
      interfaceSound(kind = 'select') {
        if (
          !this.production ||
          !this.ctx ||
          this.paused ||
          this.ctx.state !== 'running' ||
          this.settings.muted
        )
          return;
        const now = this.ctx.currentTime;
        if (!this.allowSfx('interface-' + kind, now, kind === 'select' ? 0.075 : 0.13)) return;
        if (this.playSoundEvent('interface.' + kind)) return;
        const notes = {
          select: [81],
          confirm: [64, 71, 76],
          back: [67, 62],
          denied: [52, 51],
          open: [60, 67],
          close: [67, 60],
        }[kind] || [81];
        notes.forEach((midi, i) => {
          this.tone(
            midi,
            now + 0.006 + i * 0.045,
            kind === 'select' ? 0.06 : 0.16,
            kind === 'select' ? 0.017 : 0.026,
            'sine',
            'interface',
            0.003,
          );
          if (kind !== 'select')
            this.tone(
              midi + 12,
              now + 0.008 + i * 0.045,
              0.1,
              0.006,
              'triangle',
              'interface',
              0.005,
            );
        });
      }
      footstep(campaign, distance) {
        if (!this.production || !this.ctx || distance <= 0 || this.paused) return;
        this.stepDistance = (this.stepDistance || 0) + Math.min(distance, 80);
        if (this.stepDistance < 42) return;
        this.stepDistance %= 42;
        const scene = this.context || this.describe(campaign),
          now = this.ctx.currentTime;
        let surface =
          scene.interior === 'outdoors'
            ? scene.region === 'march'
              ? 'wet'
              : scene.region === 'vale'
                ? 'grass'
                : 'gravel'
            : 'stone';
        if (
          (scene.interior === 'treasury' && scene.zone !== 'supply-crown') ||
          scene.zone === 'side-vale-cellars'
        )
          surface = 'wood';
        const settings = {
          grass: [480, 0.014],
          wet: [950, 0.022],
          gravel: [1800, 0.019],
          stone: [1250, 0.02],
          wood: [620, 0.018],
        }[surface];
        if (!this.allowSfx('surface-step', now, 0.14)) return;
        if (this.playSoundEvent('step.' + surface, { surface })) return;
        this.noiseBurst(now, surface === 'wet' ? 0.09 : 0.045, settings[1], 'lowpass', settings[0]);
        this.tone(surface === 'wood' ? 42 : 29, now, 0.055, 0.01, 'sine', 'effects', 0.002);
      }
      sceneDetails(scene) {
        if (!this.ctx || !this.cue || scene.situation === 'menu' || scene.situation === 'title')
          return;
        const now = this.ctx.currentTime;
        if (now < (this.nextSceneDetail || 0)) return;
        this.nextSceneDetail = now + (scene.boss ? 8 : 3.5 + Math.random() * 5);
        if (scene.boss) return;
        if (scene.interior === 'outdoors') {
          if (scene.region === 'march') {
            if (!this.playSoundEvent('ambience.water', scene))
              this.noiseBurst(now, 0.28, 0.012, 'bandpass', 650, 0.7, 'ambience');
            if (scene.night) this.tone(72, now + 0.04, 0.12, 0.008, 'sine', 'ambience', 0.035);
          } else if (scene.region === 'vale' && !scene.night) {
            if (!this.playSoundEvent('ambience.birds', scene)) {
              this.tone(88, now, 0.1, 0.007, 'sine', 'ambience');
              this.tone(93, now + 0.14, 0.075, 0.005, 'sine', 'ambience');
            }
          } else if (scene.night) {
            if (!this.playSoundEvent('ambience.insects', scene))
              for (let i = 0; i < 3; i++)
                this.tone(95, now + i * 0.11, 0.045, 0.003, 'sine', 'ambience', 0.006);
          }
          if (scene.settlement && !this.playSoundEvent('ambience.settlement', scene))
            this.noiseBurst(now + 0.25, 0.08, 0.007, 'bandpass', 2100, 0.7, 'ambience');
        } else if (scene.zone === 'archive' || scene.zone === 'side-march-watchhouse') {
          if (this.playSoundEvent('ambience.drips', scene)) return;
          this.tone(82, now, 0.09, 0.006, 'sine', 'ambience', 0.003);
          this.tone(77, now + 0.45, 0.07, 0.004, 'sine', 'ambience', 0.003);
        } else if (scene.zone === 'mine' || scene.zone === 'side-crown-foundry') {
          if (this.playSoundEvent('ambience.metal', scene)) return;
          this.tone(48, now, 0.3, 0.004, 'triangle', 'ambience', 0.004);
          this.tone(71, now + 0.03, 0.16, 0.003, 'sine', 'ambience', 0.004);
        }
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
  const api = { install, places, bossTempos };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeAudioProduction = api;
})(typeof window !== 'undefined' ? window : globalThis);
