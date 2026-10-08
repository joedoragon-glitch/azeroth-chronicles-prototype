/* Independent environmental beds: bounded transitions, no gameplay state. */
(function (root) {
  'use strict';
  function install(Audio) {
    class Owner {
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
        if (!this.production || !this.ctx || this.paused || this.ctx.state !== 'running') return;
        this.environmentScene = scene;
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
          const request = (this.environmentRequest || 0) + 1;
          this.environmentRequest = request;
          const ctx = this.ctx,
            epoch = this.recordingEpoch || 0;
          // Leaving a place never leaves its water/machinery playing while the next file loads.
          this.stopRecording(this.environmentOutgoing, 0);
          this.environmentOutgoing = this.environmentVoice;
          this.environmentVoice = null;
          this.stopRecording(this.environmentOutgoing, rule.fade);
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
