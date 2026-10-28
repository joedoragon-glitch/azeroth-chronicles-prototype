/* Original procedural hero foley. Uses the existing mixer, voice pool and cleanup. */
(function (root) {
  'use strict';
  function install(Audio) {
    class Owner {
      heroSkillEffect(e) {
        const art =
          root.PrototypeHeroPresentation ||
          (typeof require === 'function' ? require('./hero-presentation.js') : null);
        if (!art?.owns(e)) return false;
        if (
          !this.ctx ||
          this.paused ||
          this.settings.muted ||
          this.ctx.state !== 'running' ||
          !this.mixLevel('effects')
        )
          return true;
        if (e.class === 'rogue' &&
          ['rogueBellBasic', 'rogueBellSkill1', 'rogueBellPerformance'].includes(e.type)) {
          // Actual release receipts only: bounded bell phrases, not per-contact
          // voices or ongoing station audio that could increase phone load.
          const now = this.ctx.currentTime;
          if (!this.allowSfx('rogue:' + e.type + ':' + (e.form || 'auto'), now, 0.075) ||
            this.voices.size > 38) return true;
          const basic = e.type === 'rogueBellBasic',
            charged = e.form === 'charged',
            quiet = now - this.lastWarning < 0.4 ? 0.4 : 1,
            weight = (charged ? 1.14 : 0.88) * quiet,
            base = basic ? 82 : e.type === 'rogueBellSkill1'
              ? 74 : 70 + Math.min(8, Math.max(2, e.slot || 2)),
            prior = this.sourcePriority;
          this.sourcePriority = 1;
          try {
            this.tone(base, now, 0.11, 0.032 * weight, 'triangle', 'effects', 0.003);
            this.tone(base + (basic ? 7 : 5), now + 0.034,
              0.13, 0.023 * weight, 'sine', 'effects', 0.004);
            if (charged || (basic && e.combo === 3))
              this.tone(base + 12, now + 0.079,
                0.16, 0.02 * weight, 'triangle', 'effects', 0.005);
          } finally {
            this.sourcePriority = prior;
          }
          return true;
        }
        // New Skill 1 gameplay receipts sound only at their actual mechanical
        // stages. Bounded single-voice accents prevent crowd hit multiplication.
        if (e.slot === 1 && ['heroSkillArea', 'heroHawk'].includes(e.type)) {
          // The wide beam finishes over time; its bookkeeping completion
          // must not trigger a second launch sound.
          if (e.type === 'heroSkillArea' && e.phase === 'complete') return true;
          if (e.type === 'heroHawk' && (e.phase === 'flight' || e.phase === 'expire')) return true;
          if (
            !this.allowSfx(
              'skill1:' +
                e.class +
                ':' +
                (e.type === 'heroSkillArea' ? (e.pulse ?? 'beam') : e.phase),
              this.ctx.currentTime,
              0.05,
            )
          )
            return true;
          if (this.voices.size > 38) return true;
          const now = this.ctx.currentTime,
            quiet = now - this.lastWarning < 0.4 ? 0.4 : 1,
            old = this.sourcePriority;
          this.sourcePriority = 1;
          try {
            const phase =
              e.type === 'heroSkillArea'
                ? e.class === 'paladin'
                  ? 'pulse' + e.pulse
                  : 'wideBeam'
                : e.phase;
            if (this.playSoundEvent('hero.' + e.class + '.1.charged.' + phase, e)) return true;
            if (e.class === 'paladin') {
              this.tone(
                e.pulse === 0 ? 57 : 61,
                now,
                0.13,
                0.026 * quiet,
                'triangle',
                'effects',
                0.004,
              );
              this.tone(
                e.pulse === 0 ? 76 : 80,
                now + 0.02,
                0.17,
                0.016 * quiet,
                'sine',
                'effects',
                0.005,
              );
              this.noiseBurst(now, 0.06, 0.012 * quiet, 'bandpass', 1200, 0.7);
            } else if (e.class === 'mage') {
              this.sweep(48, 86, now, 0.22, 0.032 * quiet, 'sine');
              this.noiseBurst(now + 0.03, 0.16, 0.026 * quiet, 'bandpass', 1250, 0.8);
              this.tone(62, now + 0.025, 0.2, 0.019 * quiet, 'triangle', 'effects', 0.006);
            } else if (e.phase === 'launch') {
              this.sweep(83, 67, now, 0.09, 0.014 * quiet, 'triangle');
              this.noiseBurst(now, 0.08, 0.011 * quiet, 'highpass', 2300, 0.8);
            } else if (e.phase === 'impact' && e.landed) {
              this.noiseBurst(now, 0.05, 0.026 * quiet, 'bandpass', 1500, 0.75);
              this.tone(65, now, 0.08, 0.021 * quiet, 'triangle', 'effects', 0.003);
              if (e.interrupted)
                this.tone(88, now + 0.04, 0.13, 0.018 * quiet, 'sine', 'effects', 0.005);
            }
          } finally {
            this.sourcePriority = old;
          }
          return true;
        }
        if (e.type === 'hawkRetreatInterrupted' || e.type === 'skill1Tap') return true;
        const event = { ...e, charged: e.charged || e.type === 'chargedArea' },
          def = art.profile(event);
        if (!def) return true;
        const now = this.ctx.currentTime,
          slot = e.slot || 1,
          flight = e.type === 'heroProjectileFlight',
          impact = e.type === 'projectileImpact' || e.type === 'melee',
          area = e.type === 'spell' || e.type === 'chargedArea',
          cast = e.type === 'heroSkillCast',
          swing = e.type === 'swing',
          charge = e.type === 'heroCharge';
        // Original launch receipts remain available to sprites/other consumers.
        // Foley follows the actual delayed projectile departure, never batch creation.
        if (!flight && !impact && !area && !cast && !swing && !charge) return true;
        if (cast && !(event.charged || (e.class === 'ranger' && slot === 3))) return true;
        const phase = charge
          ? e.stage
          : flight
            ? 'launch'
            : impact
              ? 'impact'
              : cast || swing
                ? 'release'
                : 'area';
        if (
          !this.allowSfx(
            'hero:' + e.class + ':' + slot + ':' + phase,
            now,
            phase === 'impact' ? 0.065 : phase === 'launch' ? 0.035 : 0.08,
          )
        )
          return true;
        // Reserve headroom before the existing 60/64 shared voice ceilings.
        if (this.voices.size > 38) return true;
        if (now - (this.heroSoundWindow || -Infinity) > 0.25) {
          this.heroSoundWindow = now;
          this.heroSoundCount = 0;
        }
        if ((this.heroSoundCount || 0) >= 9) return true;
        this.heroSoundCount = (this.heroSoundCount || 0) + 1;
        const quiet = now - this.lastWarning < 0.4 ? 0.4 : 1,
          weight = (event.charged ? 1.12 : 0.88) * quiet,
          previous = this.sourcePriority;
        this.sourcePriority = 1;
        try {
          // Optional future recorded replacement; cold/missing recordings retain synthesis.
          if (
            this.playSoundEvent(
              'hero.' +
                e.class +
                '.' +
                slot +
                '.' +
                (event.charged ? 'charged.' : 'normal.') +
                phase,
              event,
            )
          )
            return true;
          if (charge) {
            const base = e.class === 'paladin' ? 57 : e.class === 'mage' ? 66 : 73;
            if (e.stage === 'cancel') this.sweep(base, base - 5, now, 0.065, 0.012 * quiet, 'sine');
            else if (e.stage === 'ready') {
              this.tone(base + 12, now, 0.11, 0.023 * quiet, 'sine', 'effects', 0.005);
              this.tone(base + 19, now + 0.025, 0.09, 0.012 * quiet, 'sine', 'effects', 0.004);
            } else
              this.sweep(
                base + (e.stage === 'rise' ? 5 : 0),
                base + 9,
                now,
                0.09,
                0.012 * quiet,
                e.class === 'ranger' ? 'triangle' : 'sine',
              );
            return true;
          }
          // A short release accent; the real flight/area/impact supplies the body.
          if (cast && event.charged) {
            this.tone(
              e.class === 'paladin' ? 48 : e.class === 'mage' ? 57 : 62,
              now,
              0.1,
              0.021 * weight,
              'triangle',
              'effects',
              0.003,
            );
            return true;
          }
          if (e.landed === false) {
            this.noiseBurst(now, 0.045, 0.015 * quiet, 'bandpass', 1350, 0.8);
            return true;
          }
          if (e.effect === 'shield-lowered') {
            this.tone(47, now, 0.08, 0.022 * weight, 'triangle', 'effects', 0.002);
            return true;
          }
          const motif = def.motif;
          if (e.class === 'ranger' && [1, 2, 5, 6, 7, 8].includes(slot)) {
            if (flight) {
              this.bowRelease(now, true, weight * (slot === 7 ? 1.2 : 1));
              if (slot === 7) this.sweep(85, 64, now, 0.12, 0.018 * weight, 'triangle');
            } else if (impact) {
              this.noiseBurst(
                now,
                slot === 7 ? 0.09 : 0.055,
                0.033 * weight,
                'bandpass',
                slot === 7 ? 1550 : slot === 6 ? 620 : 970,
                0.8,
              );
              this.tone(
                slot === 6 ? 36 : 45,
                now,
                0.07,
                0.024 * weight,
                'triangle',
                'effects',
                0.002,
              );
            } else if (area && slot === 2) {
              this.rapidBow(now, true, 3, 0.75 * weight);
            } else if (area && slot === 5 && !event.charged) {
              this.rapidBow(now, true, 3, 0.7 * weight);
            }
            return true;
          }
          if (e.class === 'paladin' && (swing || impact) && [1, 2, 6].includes(slot)) {
            // Retain the approved recorded sword foley when warm; synthesis is
            // immediate on cold/offline decode and stays quieter after warnings.
            if (
              quiet === 1 &&
              this.playSoundEvent(swing ? 'effect.swordSwing' : 'effect.heroSteelImpact', event)
            )
              return true;
            if (swing) {
              this.noiseBurst(now, 0.08, 0.028 * weight, 'bandpass', slot === 2 ? 1150 : 1500, 1);
              this.sweep(62, 45, now, 0.09, 0.017 * weight, 'triangle');
            } else this.steelImpact(now, true, weight * (e.combo === 3 ? 1.2 : 1));
            return true;
          }
          if (def.material === 'frost') {
            this.noiseBurst(
              now,
              impact || area ? 0.13 : 0.08,
              0.035 * weight,
              'highpass',
              flight ? 2900 : 1800,
              1.5,
            );
            this.tone(flight ? 88 : 82, now, 0.13, 0.025 * weight, 'sine', 'effects', 0.003);
            if (event.charged)
              this.tone(94, now + 0.035, 0.16, 0.016 * weight, 'sine', 'effects', 0.003);
          } else if (motif === 'interrupt') {
            this.noiseBurst(now, 0.035, 0.04 * weight, 'highpass', 2200, 1);
            this.sweep(86, 48, now, 0.065, 0.032 * weight, 'triangle');
          } else if (motif === 'silence') {
            this.sweep(76, 43, now, 0.18, 0.032 * weight, 'sine');
            this.tone(55, now, 0.22, 0.024 * weight, 'sine', 'effects', 0.006);
          } else if (motif === 'fracture') {
            this.tone(76, now, 0.1, 0.027 * weight, 'triangle', 'effects', 0.002);
            this.tone(77, now + 0.018, 0.12, 0.02 * weight, 'sine', 'effects', 0.002);
            this.noiseBurst(now, 0.065, 0.024 * weight, 'bandpass', 2000, 1.2);
          } else if (motif === 'force') {
            this.noiseBurst(now, 0.14, 0.04 * weight, 'lowpass', 560, 0.6);
            this.sweep(47, 32, now, 0.16, 0.045 * weight, 'sine');
          } else if (motif === 'chain') {
            const points = Math.min(5, e.chain?.length || 1);
            for (let i = 0; i < points; i++) {
              this.tone(
                68 + i * 3,
                now + i * 0.045,
                0.09,
                0.022 * weight,
                'triangle',
                'effects',
                0.002,
              );
            }
          } else if (motif === 'astral' || motif === 'cataclysm') {
            this.sweep(83, 38, now, 0.22, 0.043 * weight, 'sine');
            this.noiseBurst(now, 0.18, 0.036 * weight, 'bandpass', 800, 0.65);
            this.tone(72, now + 0.06, 0.23, 0.022 * weight, 'sine', 'effects', 0.004);
          } else if (['restore', 'haste', 'rally'].includes(motif)) {
            this.tone(
              motif === 'rally' ? 67 : 72,
              now,
              0.16,
              0.026 * weight,
              'sine',
              'effects',
              0.009,
            );
            this.tone(
              motif === 'haste' ? 86 : 79,
              now + 0.05,
              0.17,
              0.017 * weight,
              'sine',
              'effects',
              0.009,
            );
            this.noiseBurst(now, 0.1, 0.012 * weight, 'highpass', 3300, 0.6);
          } else if (e.class === 'paladin') {
            if (['shield', 'bash'].includes(motif)) {
              this.steelImpact(now, true, 0.9 * weight);
              this.tone(38, now, 0.13, 0.025 * weight, 'triangle', 'effects', 0.002);
            } else {
              this.tone(
                ['sanctuary', 'bastion'].includes(motif) ? 55 : 64,
                now,
                0.18,
                0.034 * weight,
                'triangle',
                'effects',
                0.004,
              );
              this.tone(76, now + 0.025, 0.21, 0.024 * weight, 'sine', 'effects', 0.006);
              this.noiseBurst(now, 0.08, 0.019 * weight, 'bandpass', 1200, 0.7);
            }
          } else if (motif === 'beam') {
            this.sweep(
              flight ? 54 : 78,
              flight ? 87 : 48,
              now,
              flight ? 0.17 : 0.1,
              0.035 * weight,
              'sine',
            );
            this.noiseBurst(now, 0.08, 0.018 * weight, 'highpass', 1900, 0.8);
          } else {
            this.sweep(flight ? 66 : 78, flight ? 82 : 57, now, 0.11, 0.028 * weight, 'sine');
            this.tone(
              slot === 6 ? 70 : 64,
              now + 0.01,
              0.1,
              0.017 * weight,
              'triangle',
              'effects',
              0.004,
            );
          }
        } finally {
          this.sourcePriority = previous;
        }
        return true;
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
  else root.PrototypeAudioHero = { install };
})(typeof window !== 'undefined' ? window : globalThis);
