/* Stage-aligned enemy expression. Shared identities/profiles belong to enemy-presentation. */
(function (root) {
  'use strict';
  const P =
    typeof module !== 'undefined'
      ? require('./enemy-presentation.js')
      : root.PrototypeEnemyPresentation;
  // Motifs identify a creature/faction, never a second list of skill names.
  const motifs = Object.freeze({
    thorn: [45, 52],
    crypt: [62, 61],
    mire: [42, 39],
    archive: [68, 63],
    ridge: [38, 45],
    mine: [33, 40],
    warlord: [46, 41],
    abyss: [39, 51],
    citadel: [55, 50],
    cindermaw: [44, 56],
    darklord: [58, 65],
    'supply-vale': [70, 66],
    'supply-march': [48, 43],
    'supply-highlands': [43, 38],
    'supply-crown': [52, 64],
    'frontier-overseer': [50, 45],
    wraith: [73, 68],
    stalker: [47, 42],
    wolf: [45, 52],
    goblin: [70, 66],
    skeleton: [62, 61],
    reedbeast: [48, 43],
    mireling: [48, 43],
    ogre: [38, 45],
    orc: [46, 41],
    archer: [55, 50],
    crownguard: [55, 50],
    ashbeast: [44, 56],
  });
  const textures = Object.freeze({
    steel: [1800, 52, 36],
    claw: [950, 44, 33],
    bone: [2400, 67, 49],
    stone: [480, 38, 28],
    wet: [760, 48, 35],
    arrow: [2300, 76, 55],
    spectral: [1500, 74, 56],
    ash: [1150, 45, 30],
    holy: [2100, 72, 60],
    arcane: [1700, 67, 48],
    root: [620, 49, 34],
    dust: [3200, 65, 52],
  });
  const personalities = Object.freeze({
    wolf: 38,
    skeleton: 69,
    mire: 41,
    ogre: 32,
    orc: 43,
    dragon: 36,
    military: 54,
    spectral: 73,
    shadow: 47,
    goblin: 65,
    stone: 30,
  });
  function install(Audio) {
    class Owner {
      enemySoundDecision(e) {
        return P.route(e);
      }
      enemyExpression(e) {
        if (
          !this.ctx ||
          this.paused ||
          this.settings.muted ||
          this.ctx.state !== 'running' ||
          ['menu', 'title'].includes(this.mixScene)
        )
          return;
        const d = this.enemySoundDecision(e);
        if (!d || d.mode === 'silent') return;
        // Event objects are frozen. Keep delivery dedupe outside the campaign and
        // reset it with the audio lifecycle; WeakSet has no accumulating ID map.
        this.enemyAudioSeen ||= new WeakSet();
        if (this.enemyAudioSeen.has(e)) return;
        this.enemyAudioSeen.add(e);
        const now = this.ctx.currentTime,
          warning = e.stage === 'windup' && e.dangerous,
          gap = e.stage === 'windup' ? 0.035 : e.stage === 'spawn' ? 0.09 : 0.045;
        if (!this.allowSfx('enemy:' + d.key + ':' + d.material, now, gap)) return;
        if (warning) {
          // Keep the critical warning priority/duck/throttle shared with legacy warnings.
          if (now - this.lastWarning < 0.35) return;
          this.lastWarning = now;
          this.duck();
        }
        const previous = this.sourcePriority;
        this.sourcePriority = warning ? 3 : 1;
        try {
          const details = {
            ...e,
            ...d,
            material: d.material,
            personality: d.personality,
            action: d.action,
            accent: d.accent,
          };
          if (this.playSoundEvent('effect.' + d.key, details)) {
            this.enemyAccent(now, d, e.stage, e.variant);
            return;
          }
          this.enemyMaterial(now, d, e.stage, warning, e.variant);
        } finally {
          this.sourcePriority = previous;
        }
      }
      enemyMaterial(now, d, stage, warning = false, variant = 'normal') {
        const [hz, high, low] = textures[d.material] || textures.claw;
        const impact = stage === 'impact',
          release = stage === 'release',
          phase = stage === 'phase',
          spawn = stage === 'spawn';
        const weight = variant === 'true' ? 1.08 : 1;
        if (stage === 'windup') {
          // Two short pitched pulses remain readable on phone speakers. Non-damage
          // summon casting uses a rising material rustle without the danger motif.
          if (warning) {
            this.tone(76, now, 0.11, 0.062, 'sine', 'effects', 0.004);
            this.tone(71, now + 0.095, 0.12, 0.05, 'sine', 'effects', 0.004);
          }
          this.noiseBurst(now, 0.09, warning ? 0.018 : 0.025, 'bandpass', hz, 0.8);
        } else {
          this.noiseBurst(
            now,
            impact ? 0.1 : spawn ? 0.065 : 0.11,
            impact ? 0.058 : phase ? 0.04 : 0.035,
            'bandpass',
            hz,
            0.8,
          );
          if (['spectral', 'arcane', 'holy'].includes(d.material))
            this.sweep(impact ? high : low, impact ? low : high, now, 0.15, 0.035 * weight, 'sine');
          else
            this.sweep(
              release ? high : low + 8,
              low,
              now,
              impact ? 0.1 : 0.08,
              0.025 * weight,
              'triangle',
            );
        }
        this.enemyAccent(now, d, stage, variant);
      }
      enemyAccent(now, d, stage, variant = 'normal') {
        const release = stage === 'release',
          phase = stage === 'phase',
          impact = stage === 'impact',
          spawn = stage === 'spawn',
          low = textures[d.material]?.[2] || 36;
        // Common creatures get a local texture; important casts get a short motif.
        const accent = d.accent && (release || phase || (stage === 'windup' && d.summon)),
          notes = motifs[d.accent] || motifs[d.personality] || [low, low + 7];
        if (accent) {
          const spacing =
            {
              summon: 0.125,
              volley: 0.045,
              line: 0.06,
              ring: 0.05,
              cone: 0.07,
              sector: 0.1,
              circle: 0.095,
              scatter: 0.045,
              pivot: 0.035,
              sweep: 0.075,
              bind: 0.115,
              rally: 0.135,
            }[d.action] || 0.085;
          this.tone(
            notes[0],
            now + 0.016,
            variant === 'true' ? 0.145 : 0.13,
            0.025,
            'triangle',
            'effects',
            0.004,
          );
          this.tone(
            notes[1],
            now + spacing,
            0.14,
            0.02,
            variant === 'true' ? 'triangle' : 'sine',
            'effects',
            0.004,
          );
        } else if (impact || spawn) {
          const pitch = personalities[d.personality];
          if (pitch) this.tone(pitch, now + 0.01, 0.065, 0.017, 'triangle', 'effects', 0.003);
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
  const api = { install, motifs, textures, personalities };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeAudioEnemy = api;
})(typeof window !== 'undefined' ? window : globalThis);
