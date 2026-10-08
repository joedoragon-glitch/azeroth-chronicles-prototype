/* Authored contextual soundtrack and foreground sound direction. No gameplay writes. */
(function (root) {
  'use strict';
  const places = {
    vale: ['place-vale', 'action-vale', 'peace-vale', 92],
    march: ['place-march', 'action-march', 'peace-march', 82],
    highlands: ['place-highlands', 'action-highlands', 'peace-highlands', 88],
    frontier: ['place-frontier', 'action-frontier', 'peace-frontier', 96],
    crown: ['place-crown', 'action-crown', 'peace-crown', 84],
    crypt: ['place-crypt', 'action-crypt', 'peace-crypt', 84],
    archive: ['place-archive', 'action-archive', 'peace-archive', 86],
    mine: ['place-mine', 'action-mine', 'peace-mine', 96],
    abyss: ['place-abyss', 'action-abyss', 'peace-abyss', 96],
    citadel: ['place-citadel', 'action-citadel', 'peace-citadel', 88],
    'supply-vale': ['interior-supply-vale', null, 'peace-interior-supply-vale', 92],
    'supply-march': ['interior-supply-march', null, 'peace-interior-supply-march', 82],
    'supply-highlands': ['interior-supply-highlands', null, 'peace-interior-supply-highlands', 88],
    'supply-crown': ['interior-supply-crown', null, 'peace-interior-supply-crown', 84],
    'side-vale-cellars': [
      'interior-side-vale-cellars',
      null,
      'peace-interior-side-vale-cellars',
      92,
    ],
    'side-march-watchhouse': [
      'interior-side-march-watchhouse',
      null,
      'peace-interior-side-march-watchhouse',
      82,
    ],
    'side-highlands-signal': [
      'interior-side-highlands-signal',
      null,
      'peace-interior-side-highlands-signal',
      88,
    ],
    'side-frontier-shrine': [
      'interior-side-frontier-shrine',
      null,
      'peace-interior-side-frontier-shrine',
      96,
    ],
    'side-crown-foundry': [
      'interior-side-crown-foundry',
      null,
      'peace-interior-side-crown-foundry',
      84,
    ],
  };
  const bossTempos = {
    thorn: 116,
    crypt: 104,
    mire: 108,
    archive: 108,
    ridge: 108,
    mine: 100,
    warlord: 120,
    abyss: 112,
    citadel: 108,
    cindermaw: 118,
    darklord: 104,
  };
  function install(Audio) {
    class Owner {
      enableProduction(enabled = true) {
        this.production = !!enabled;
        this.productionKey = null;
        this.productionIntensity = null;
        if (!enabled) {
          this.stopRecordedScore();
          this.setSceneMix('world');
        }
      }
      productionCue(scene) {
        if (scene.started === false || scene.situation === 'title')
          return { id: 'title', stems: [{ id: 'title', gain: 0.7 }], bpm: 88 };
        if (scene.gameOver || scene.situation === 'game-over')
          return { id: 'defeat', stems: [{ id: 'defeat', gain: 0.55 }], bpm: 84 };
        if (this.ctx && this.ctx.currentTime < this.finaleUntil && scene.peace)
          return { id: 'finale', stems: [{ id: 'finale', gain: 0.72 }], bpm: 88 };
        if (scene.boss && !scene.peace && bossTempos[scene.boss.family]) {
          const id = 'boss-' + scene.boss.family;
          return {
            id,
            bpm: bossTempos[scene.boss.family],
            fade: 0.7,
            stems: [
              { id, gain: 0.78 },
              { id: id + '-true', gain: scene.boss.form === 'true' ? 0.55 : 0.12 },
            ],
          };
        }
        const p = places[scene.zone] || places[scene.region] || places.vale;
        let base = scene.peace && p[2] ? p[2] : p[0];
        if (!scene.peace && scene.interior === 'outdoors' && places[scene.region]) {
          if (scene.settlement) base = 'settlement-' + scene.region;
          else if (scene.night) base = 'night-' + scene.region;
        }
        return {
          id: base,
          bpm: p[3],
          fade: 1.5,
          stems: [
            { id: base, gain: scene.night ? 0.58 : scene.settlement ? 0.62 : 0.74 },
            ...(p[1] && !scene.peace ? [{ id: p[1], gain: 0 }] : []),
          ],
        };
      }
      updateProduction(scene) {
        if (!this.production || !this.ctx || this.paused || this.ctx.state !== 'running') return;
        this.setSceneMix(
          scene.situation === 'menu' ? 'menu' : scene.situation === 'title' ? 'title' : 'world',
        );
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
        if (spec.id !== this.productionKey) {
          this.productionKey = spec.id;
          this.productionIntensity = null;
          this.stepDistance = 0;
          const wanted = spec.id;
          if (this.recordedScore?.id !== spec.id)
            void this.setRecordedScore(spec).then((ok) => {
              if (ok && this.productionKey === wanted) this.productionIntensity = null;
            });
        }
        const group = this.recordedScore;
        if (!group || group.id !== spec.id) return;
        if (scene.engaged && !scene.peace) this.combatUntil = now + 2.5;
        const combat = !scene.peace && now < (this.combatUntil || 0);
        const intensity = scene.boss
          ? scene.boss.form === 'true'
            ? 0.55
            : 0.12
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
            this.noiseBurst(now, 0.28, 0.012, 'bandpass', 650, 0.7, 'ambience');
            if (scene.night) this.tone(72, now + 0.04, 0.12, 0.008, 'sine', 'ambience', 0.035);
          } else if (scene.region === 'vale' && !scene.night) {
            this.tone(88, now, 0.1, 0.007, 'sine', 'ambience');
            this.tone(93, now + 0.14, 0.075, 0.005, 'sine', 'ambience');
          } else if (scene.night) {
            for (let i = 0; i < 3; i++)
              this.tone(95, now + i * 0.11, 0.045, 0.003, 'sine', 'ambience', 0.006);
          }
          if (scene.settlement)
            this.noiseBurst(now + 0.25, 0.08, 0.007, 'bandpass', 2100, 0.7, 'ambience');
        } else if (scene.zone === 'archive' || scene.zone === 'side-march-watchhouse') {
          this.tone(82, now, 0.09, 0.006, 'sine', 'ambience', 0.003);
          this.tone(77, now + 0.45, 0.07, 0.004, 'sine', 'ambience', 0.003);
        } else if (scene.zone === 'mine' || scene.zone === 'side-crown-foundry') {
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
