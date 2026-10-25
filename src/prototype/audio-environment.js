/* Independent environmental beds: bounded transitions, no gameplay state. */
(function (root) {
  'use strict';
  function install(Audio) {
    class Owner {
      // Independent of audio volume and campaign state. Cancels environment
      // selection and stops active ambience at the source on every entry.
      setOptimizationMode(enabled) {
        const next = !!enabled;
        if (this.optimizationMode === next) return false;
        this.optimizationMode = next;
        if (next) {
          this.stopEnvironment(0);
          for (const voice of [...this.voices])
            if (voice.bus === 'ambience' && !voice.recorded)
              try {
                voice.osc.stop(this.ctx?.currentTime || 0);
              } catch (_) {}
        }
        this.ambient();
        if (!next && this.environmentScene) this.updateEnvironment(this.environmentScene);
        return true;
      }
      environmentCue(scene) {
        if (
          scene.started === false ||
          scene.gameOver ||
          ['title', 'game-over'].includes(scene.situation)
        )
          return null;
        return this.matchingRecordedRule(
          scene,
          this.soundCatalog().director?.environment?.rules || [],
        );
      }
      invalidateEnvironment() {
        this.environmentRequest = (this.environmentRequest || 0) + 1;
        this.environmentKey = null;
        this.environmentRetry = null;
      }
      stopEnvironment(seconds = 0) {
        this.invalidateEnvironment();
        this.stopRecording(this.environmentVoice, seconds);
        this.stopRecording(this.environmentOutgoing, 0);
        this.environmentOutgoing = seconds ? this.environmentVoice : null;
        this.environmentVoice = null;
        this.environmentFallback = false;
        this.environmentCombatUntil = 0;
      }
      environmentGain(rule, scene) {
        const now = this.ctx.currentTime,
          policy = this.soundCatalog().director.environment;
        if (scene.engaged && !scene.peace) this.environmentCombatUntil = now + 2.5;
        return (
          rule.gain *
          (scene.boss && !scene.peace
            ? policy.bossGain
            : !scene.peace && now < (this.environmentCombatUntil || 0)
              ? policy.combatGain
              : 1)
        );
      }
      updateEnvironment(scene) {
        this.environmentScene = scene;
        if (
          this.optimizationMode ||
          !this.production ||
          !this.ctx ||
          this.paused ||
          this.ctx.state !== 'running'
        )
          return;
        const rule = this.environmentCue(scene);
        if (!rule) {
          if (this.environmentKey || this.environmentVoice) {
            this.stopEnvironment(1.5);
            this.ambient();
          }
          return;
        }
        this.environmentGain(rule, scene);
        const key = JSON.stringify([rule.asset, rule.gain, rule.fade]);
        const active = this.environmentVoice;
        if (active && !this.voices.has(active)) {
          this.environmentVoice = null;
          this.environmentKey = null;
        }
        if (this.environmentVoice?.environmentKey === key) this.environmentKey = key;
        if (key !== this.environmentKey) {
          this.environmentKey = key;
          this.environmentRetry = { attempts: 0, nextAt: this.ctx.currentTime, pending: false };
          // Only a genuine scene transition fades the previous bed. Retries must
          // not repeatedly cut or restart an outgoing environment source.
          this.stopRecording(this.environmentOutgoing, 0);
          this.environmentOutgoing = this.environmentVoice;
          this.environmentVoice = null;
          this.stopRecording(this.environmentOutgoing, rule.fade);
        }
        const retry = this.environmentRetry;
        if (
          !this.environmentVoice &&
          retry &&
          !retry.pending &&
          retry.attempts < 3 &&
          this.ctx.currentTime >= retry.nextAt
        ) {
          retry.pending = true;
          retry.attempts++;
          const request = (this.environmentRequest || 0) + 1;
          this.environmentRequest = request;
          const ctx = this.ctx,
            epoch = this.recordingEpoch || 0;
          // The first load starts immediately; failed loads retry after 1s and
          // then 4s on the running audio clock, up to three total attempts.
          this.environmentPending = (async () => {
            try {
              const assets = await this.assetsForRecordings(),
                item = await assets.load(rule.asset);
              if (
                this.ctx !== ctx ||
                epoch !== (this.recordingEpoch || 0) ||
                request !== this.environmentRequest ||
                !this.production ||
                this.paused
              )
                return false;
              const gain = this.environmentGain(rule, this.environmentScene || scene);
              const voice = this.createRecording(rule.asset, item, assets, {
                bus: 'ambience',
                loop: true,
                gain,
                fade: rule.fade,
                priority: 0,
              });
              if (!voice) throw Error('Environmental source unavailable');
              voice.environmentKey = key;
              this.environmentVoice = voice;
              retry.pending = false;
              retry.nextAt = Infinity;
              this.environmentFallback = false;
              this.environmentError = null;
              this.ambient();
              return true;
            } catch (error) {
              if (
                this.ctx === ctx &&
                request === this.environmentRequest &&
                epoch === (this.recordingEpoch || 0)
              ) {
                retry.pending = false;
                retry.nextAt = ctx.currentTime + (retry.attempts === 1 ? 1 : 4);
                this.environmentError = error.message;
                this.environmentFallback = true;
                this.ambient();
              }
              return false;
            }
          })();
        }
        const voice = this.environmentVoice;
        if (!voice) return;
        const gain = this.environmentGain(rule, scene);
        if (gain === voice.targetGain) return;
        const now = this.ctx.currentTime,
          param = voice.gain.gain;
        if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(now);
        else {
          param.cancelScheduledValues(now);
          param.setValueAtTime(param.value, now);
        }
        param.linearRampToValueAtTime(gain, now + (gain < voice.targetGain ? 0.35 : 2.5));
        voice.targetGain = gain;
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
  else root.PrototypeAudioEnvironment = { install };
})(typeof window !== 'undefined' ? window : globalThis);
