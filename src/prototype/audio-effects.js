/* Audio owner: effects. Keep campaign rules outside this module. */
(function (root) {
  'use strict';
  function install(Audio, catalog) {
    const { eventNotes, contextualEffectTypes } = catalog;
    class Owner {
      soundKind(input) {
        const e = typeof input === 'string' ? { type: input } : input || {},
          type = e.type;
        if (type === 'melee') {
          if (e.special === 'power-strike') return 'powerStrike';
          if (e.special === 'holy-cleave') return null;
          if (e.actor === 'hero' && e.class === 'paladin') return 'heroSteelImpact';
          if (e.actor === 'companion' && e.role === 'soldier') return 'soldierSteelImpact';
          if (e.actor === 'enemy') {
            if (e.boss || ['skeleton', 'orc', 'crownguard'].includes(e.species))
              return 'enemyWeaponImpact';
            return 'creatureImpact';
          }
          return 'meleeImpact';
        }
        if (type === 'swing') {
          if (e.companionSkill === 'power-strike') return null;
          return e.class === 'paladin' || e.actor === 'hero' ? 'swordSwing' : null;
        }
        if (type === 'projectileLaunch') {
          if (e.beam) return 'arcaneBeamLaunch';
          if (e.special === 'triple-shot') return 'tripleShot';
          if (e.rapid && e.style === 'arrow') return 'rapidBow';
          if (e.style === 'arrow') return e.actor === 'hero' ? 'heroBow' : 'bow';
          if (['axe', 'stone'].includes(e.style)) return 'heavyProjectileLaunch';
          if (e.style === 'spit') return 'organicProjectileLaunch';
          return ['magic', 'holy', 'spectral', 'cinder'].includes(e.style)
            ? 'magicLaunch'
            : 'projectileLaunch';
        }
        if (type === 'projectileImpact') {
          if (e.style === 'beam') return 'arcaneBeamImpact';
          if (e.style === 'arrow') return 'arrowImpact';
          if (['axe', 'stone'].includes(e.style)) return 'heavyProjectileImpact';
          if (e.style === 'spit') return 'organicProjectileImpact';
          return ['magic', 'holy', 'spectral', 'cinder'].includes(e.style)
            ? 'magicImpact'
            : 'projectileImpact';
        }
        if (type === 'spell') {
          if (e.special === 'piercing-volley') return null;
          if (e.kind === 'soldierGuard') return 'guardCast';
          return e.class === 'paladin'
            ? 'holyCast'
            : e.class === 'ranger'
              ? 'rangerCast'
              : 'magicCast';
        }
        if (type === 'chargedArea' && e.companion && e.effect === 'holy-cleave')
          return 'companionHolyCleave';
        if (type === 'chargedArea' && e.companion && e.effect === 'piercing-volley')
          return 'piercingVolley';
        if (type === 'basicComboFinisher')
          return e.class === 'paladin'
            ? 'paladinComboFinisher'
            : e.class === 'ranger'
              ? 'rangerComboFinisher'
              : 'mageComboFinisher';
        if (type === 'companionSkill' || type === 'hit') return null;
        if (type === 'charged' || type === 'chargedArea' || type === 'chargedImpact')
          return e.class === 'paladin'
            ? 'holyBurst'
            : e.class === 'ranger'
              ? 'rangerBurst'
              : 'magicBurst';
        if (type === 'hurt') return 'bodyHit';
        return type;
      }
      supportsType(type) {
        return (
          contextualEffectTypes.has(type) || Object.prototype.hasOwnProperty.call(eventNotes, type)
        );
      }
      allowSfx(key, now, gap) {
        const last = this.lastSfx[key] ?? -Infinity;
        if (now - last < gap) return false;
        this.lastSfx[key] = now;
        return true;
      }
      steelImpact(now, hero = false, weight = 1) {
        const boost = Math.max(0.75, Math.min(1.65, weight));
        this.noiseBurst(
          now,
          0.075 * (0.9 + boost * 0.1),
          (hero ? 0.095 : 0.065) * boost,
          'bandpass',
          hero ? 1900 : 1600,
          1.1,
        );
        this.tone(
          hero ? 40 : 43,
          now,
          0.11,
          (hero ? 0.09 : 0.06) * boost,
          'triangle',
          'effects',
          0.002,
        );
        this.tone(
          hero ? 70 : 67,
          now + 0.006,
          0.075,
          (hero ? 0.045 : 0.03) * (0.85 + boost * 0.15),
          'triangle',
          'effects',
          0.002,
        );
      }
      creatureImpact(now) {
        this.noiseBurst(now, 0.09, 0.07, 'lowpass', 720, 0.5);
        this.tone(36, now, 0.1, 0.055, 'triangle', 'effects', 0.002);
      }
      bowRelease(now, hero = false, weight = 1) {
        const boost = Math.max(0.8, Math.min(1.5, weight));
        this.noiseBurst(
          now,
          0.055,
          (hero ? 0.055 : 0.038) * boost,
          'bandpass',
          hero ? 2600 : 2200,
          1.4,
        );
        this.sweep(
          hero ? 78 : 75,
          hero ? 64 : 62,
          now,
          0.065,
          (hero ? 0.045 : 0.032) * boost,
          'triangle',
        );
      }
      magicLaunch(now, kind = 'magic', weight = 1) {
        const holy = kind === 'holyCast' || kind === 'holyBurst',
          base = holy ? 67 : 60,
          boost = Math.max(0.8, Math.min(1.5, weight));
        this.sweep(base, base + 17, now, 0.16, 0.045 * boost, 'sine');
        this.noiseBurst(now + 0.025, 0.09, 0.018 * boost, 'highpass', 1700, 0.7);
      }
      rapidBow(now, hero = false, count = 3, weight = 1) {
        for (let i = 0; i < Math.max(2, Math.min(3, count || 3)); i++) {
          const at = now + i * 0.055;
          this.noiseBurst(
            at,
            0.045,
            (hero ? 0.038 : 0.03) * weight,
            'bandpass',
            hero ? 2850 : 2450,
            1.5,
          );
          this.sweep(
            hero ? 80 : 77,
            hero ? 66 : 64,
            at,
            0.05,
            (hero ? 0.034 : 0.026) * weight,
            'triangle',
          );
        }
      }
      beam(now, impact = false) {
        if (impact) {
          this.noiseBurst(now, 0.12, 0.04, 'bandpass', 1550, 0.7);
          this.sweep(76, 48, now, 0.11, 0.045, 'sine');
          return;
        }
        this.sweep(54, 84, now, 0.22, 0.05, 'sine');
        this.sweep(66, 90, now + 0.025, 0.18, 0.025, 'triangle');
        this.noiseBurst(now + 0.02, 0.16, 0.018, 'highpass', 2200, 0.8);
      }
      heavyProjectile(now, impact = false) {
        if (impact) {
          this.noiseBurst(now, 0.1, 0.07, 'lowpass', 650, 0.55);
          this.tone(34, now, 0.1, 0.055, 'triangle', 'effects', 0.002);
        } else {
          this.noiseBurst(now, 0.075, 0.045, 'bandpass', 850, 0.7);
          this.sweep(49, 36, now, 0.09, 0.035, 'triangle');
        }
      }
      organicProjectile(now, impact = false) {
        this.noiseBurst(
          now,
          impact ? 0.09 : 0.07,
          impact ? 0.045 : 0.03,
          'lowpass',
          impact ? 700 : 1050,
          0.6,
        );
        this.sweep(
          impact ? 48 : 58,
          impact ? 36 : 50,
          now,
          impact ? 0.09 : 0.07,
          impact ? 0.025 : 0.018,
          'sine',
        );
      }
      comboFinisher(now, heroClass) {
        if (heroClass === 'paladin') {
          this.noiseBurst(now, 0.12, 0.075, 'bandpass', 1350, 0.85);
          this.tone(38, now, 0.16, 0.075, 'triangle', 'effects', 0.002);
          this.tone(76, now + 0.025, 0.2, 0.035, 'sine', 'effects', 0.006);
          return;
        }
        if (heroClass === 'ranger') {
          this.rapidBow(now, true, 3, 1.15);
          this.noiseBurst(now + 0.12, 0.07, 0.035, 'bandpass', 1050, 0.8);
          return;
        }
        this.sweep(55, 86, now, 0.2, 0.06, 'sine');
        this.noiseBurst(now + 0.04, 0.14, 0.03, 'highpass', 1900, 0.75);
        this.tone(45, now, 0.16, 0.035, 'triangle', 'effects', 0.004);
      }
      effect(input) {
        const previous = this.sourcePriority;
        const type = typeof input === 'string' ? input : input?.type;
        this.sourcePriority = ['warning', 'death', 'gameOver'].includes(type) ? 3 : 1;
        try {
          return this.renderEffect(input);
        } finally {
          this.sourcePriority = previous;
        }
      }
      renderEffect(input) {
        if (!this.ctx || this.paused || this.settings.muted || this.ctx.state !== 'running') return;
        const e = typeof input === 'string' ? { type: input } : input || {},
          type = e.type,
          kind = this.soundKind(e),
          now = this.ctx.currentTime;
        if (!kind) return;
        const actorKey =
            e.actor === 'hero'
              ? ':hero'
              : e.actor === 'companion'
                ? ':ally'
                : e.actor === 'enemy'
                  ? ':enemy'
                  : '',
          comboWeight = e.combo === 3 ? 1.28 : e.combo === 2 ? 1.12 : 1,
          crowdGap = e.actor === 'hero' ? 0.018 : 0.045;
        if (
          [
            'heroSteelImpact',
            'soldierSteelImpact',
            'enemyWeaponImpact',
            'creatureImpact',
            'meleeImpact',
            'bodyHit',
            'bow',
            'heroBow',
            'arrowImpact',
            'magicImpact',
            'heavyProjectileLaunch',
            'heavyProjectileImpact',
            'organicProjectileLaunch',
            'organicProjectileImpact',
          ].includes(kind) &&
          !this.allowSfx(kind + actorKey, now, crowdGap)
        )
          return;
        if (type === 'warning') {
          if (now - this.lastWarning < 0.35) return;
          this.lastWarning = now;
          this.duck();
        }
        if (type === 'peace') {
          this.finaleUntil = now + 12;
          this.key = null;
        }
        if (kind === 'footstep' && !this.allowSfx('footstep', now, 0.16)) return;
        if (this.playSoundEvent('effect.' + kind, e)) return;
        if (kind === 'heroSteelImpact') {
          this.steelImpact(now, true, comboWeight);
          return;
        }
        if (
          kind === 'soldierSteelImpact' ||
          kind === 'enemyWeaponImpact' ||
          kind === 'meleeImpact'
        ) {
          this.steelImpact(now, false, 1);
          return;
        }
        if (kind === 'powerStrike') {
          this.steelImpact(now, false, 1.5);
          this.tone(36, now, 0.13, 0.045, 'triangle', 'effects', 0.002);
          return;
        }
        if (kind === 'creatureImpact') {
          this.creatureImpact(now);
          return;
        }
        if (kind === 'swordSwing') {
          const boost = e.combo === 3 ? 1.25 : e.combo === 2 ? 1.08 : 1;
          this.noiseBurst(now, 0.085, 0.045 * boost, 'bandpass', e.combo === 3 ? 1250 : 1450, 1);
          this.sweep(
            e.combo === 3 ? 58 : 61,
            e.combo === 3 ? 43 : 48,
            now,
            e.combo === 3 ? 0.11 : 0.09,
            0.025 * boost,
            'triangle',
          );
          return;
        }
        if (kind === 'heroBow') {
          this.bowRelease(now, true, comboWeight);
          return;
        }
        if (kind === 'bow') {
          this.bowRelease(now, false, 1);
          return;
        }
        if (kind === 'tripleShot') {
          this.rapidBow(now, false, e.count || 3, 1.05);
          return;
        }
        if (kind === 'rapidBow') {
          this.rapidBow(now, true, e.count || 3, 1.08);
          return;
        }
        if (kind === 'piercingVolley') {
          this.rapidBow(now, false, 3, 1.18);
          this.sweep(52, 69, now, 0.16, 0.035, 'triangle');
          return;
        }
        if (kind === 'arrowImpact') {
          this.noiseBurst(now, 0.075, 0.052, 'bandpass', 900, 0.8);
          this.tone(44, now, 0.06, 0.035, 'triangle', 'effects', 0.002);
          return;
        }
        if (kind === 'arcaneBeamLaunch') {
          this.beam(now, false);
          return;
        }
        if (kind === 'arcaneBeamImpact') {
          this.beam(now, true);
          return;
        }
        if (kind === 'heavyProjectileLaunch') {
          this.heavyProjectile(now, false);
          return;
        }
        if (kind === 'heavyProjectileImpact') {
          this.heavyProjectile(now, true);
          return;
        }
        if (kind === 'organicProjectileLaunch') {
          this.organicProjectile(now, false);
          return;
        }
        if (kind === 'organicProjectileImpact') {
          this.organicProjectile(now, true);
          return;
        }
        if (
          kind === 'magicLaunch' ||
          kind === 'magicCast' ||
          kind === 'rangerCast' ||
          kind === 'holyCast'
        ) {
          this.magicLaunch(now, kind, comboWeight);
          return;
        }
        if (kind === 'magicImpact') {
          this.noiseBurst(now, 0.11, 0.035, 'bandpass', 1300, 0.6);
          this.tone(48, now, 0.12, 0.04, 'sine', 'effects', 0.004);
          this.tone(76, now + 0.02, 0.12, 0.025, 'sine', 'effects', 0.004);
          return;
        }
        if (kind === 'companionHolyCleave') {
          this.steelImpact(now, false, 1.15);
          this.magicLaunch(now, 'holyBurst', 0.9);
          return;
        }
        if (
          kind === 'paladinComboFinisher' ||
          kind === 'mageComboFinisher' ||
          kind === 'rangerComboFinisher'
        ) {
          this.comboFinisher(now, e.class);
          return;
        }
        if (kind === 'holyBurst' || kind === 'rangerBurst' || kind === 'magicBurst') {
          this.magicLaunch(now, kind);
          this.tone(kind === 'holyBurst' ? 52 : 47, now, 0.18, 0.06, 'triangle', 'effects', 0.003);
          return;
        }
        if (kind === 'guardCast') {
          this.tone(52, now, 0.12, 0.04, 'triangle', 'effects', 0.003);
          this.tone(64, now + 0.045, 0.16, 0.025, 'sine', 'effects', 0.003);
          return;
        }
        if (kind === 'bodyHit') {
          this.noiseBurst(now, 0.065, 0.045, 'lowpass', 520, 0.5);
          this.tone(33, now, 0.07, 0.035, 'triangle', 'effects', 0.002);
          return;
        }
        if (kind === 'footstep') {
          this.noiseBurst(now, 0.045, 0.022, 'lowpass', 430, 0.4);
          this.tone(29, now, 0.045, 0.014, 'sine', 'effects', 0.002);
          return;
        }
        const notes = eventNotes[type];
        if (!notes) return;
        notes.forEach((n, i) =>
          this.tone(
            n,
            now + i * 0.09,
            type === 'peace' ? 0.8 : 0.2,
            type === 'warning' ? 0.08 : 0.035,
            'sine',
            'effects',
          ),
        );
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
  else root.PrototypeAudioEffects = { install };
})(typeof window !== 'undefined' ? window : globalThis);
