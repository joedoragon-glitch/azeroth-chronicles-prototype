/* Audio owner: score. Keep campaign rules outside this module. */
(function (root) {
  'use strict';
  function install(Audio, catalog) {
    const { themes, colors, pitch } = catalog;
    class Owner {
      describe(campaign, activity = {}) {
        const zone = campaign.zone(),
          region = campaign.definition(),
          hero = campaign.hero;
        const engaged = zone.enemies.filter((e) => e.hp > 0 && e.aggro && !e.neutral);
        const boss = engaged.find((e) => e.type === 'boss');
        const interior = campaign.supplyRoom()
          ? 'treasury'
          : campaign.sideDungeon()
            ? 'side-dungeon'
            : campaign.isDungeon()
              ? 'dungeon'
              : 'outdoors';
        const refuge =
          interior === 'outdoors' &&
          zone.npcs.find((n) => n.kind === 'rest' && Math.hypot(n.x - hero.x, n.y - hero.y) < 260);
        return {
          region: region.id,
          zone: campaign.zoneId,
          interior,
          settlement: refuge?.id || null,
          situation: activity.backgrounded
            ? 'background'
            : activity.menu
              ? 'menu'
              : activity.paused
                ? 'pause'
                : activity.started === false
                  ? 'title'
                  : campaign.s.challenge.gameOver
                    ? 'game-over'
                    : campaign.peace
                      ? 'peace'
                      : boss
                        ? 'boss'
                        : engaged.length
                          ? 'combat'
                          : refuge
                            ? 'settlement'
                            : 'exploration',
          night: campaign.night(),
          peace: campaign.peace,
          boss: boss ? { family: boss.family, form: boss.form, name: boss.name } : null,
          engaged: engaged.length,
          lowHealth: hero.hp > 0 && hero.hp / hero.maxHp <= 0.25,
        };
      }
      choose(campaign) {
        if (campaign.peace && this.ctx && this.ctx.currentTime < this.finaleUntil)
          return {
            id: 'finale',
            peace: true,
            night: campaign.night(),
            region: campaign.definition().id,
          };
        const z = campaign.zone(),
          boss = z.enemies.find((e) => e.hp > 0 && e.aggro && e.type === 'boss' && !e.neutral);
        return {
          id: campaign.supplyRoom()
            ? campaign.definition().id
            : campaign.peace
              ? campaign.zoneId
              : boss
                ? boss.family === 'darklord'
                  ? 'darklord-boss'
                  : campaign.isDungeon()
                    ? 'dungeon-boss'
                    : 'field-boss'
                : campaign.zoneId,
          peace: campaign.peace,
          night: campaign.night(),
          true: boss?.form === 'true',
          region: campaign.definition().id,
        };
      }
      update(campaign, paused = false, activity = {}) {
        this.setPaused(paused);
        // Metadata is available for later authored cue rules; current cue selection is preserved.
        this.context = this.describe(campaign, activity);
        const selected = this.choose(campaign),
          key = JSON.stringify(selected);
        if (this.key === key) return;
        const sameScore = this.cue?.id === selected.id && this.cue?.peace === selected.peace;
        this.key = key;
        this.cue = selected;
        if (sameScore) {
          if (this.ctx) this.ambient();
          return;
        }
        this.step = 0;
        this.history.push(selected);
        if (this.history.length > 50) this.history.shift();
        if (this.ctx) {
          this.transitionScore(selected);
          this.next = this.ctx.currentTime + 0.06;
          this.ambient();
        }
      }
      retireScore(score, seconds = 0) {
        if (!score || !this.ctx) return;
        const now = this.ctx.currentTime;
        score.node.gain.cancelScheduledValues(now);
        score.node.gain.setValueAtTime(score.node.gain.value, now);
        score.node.gain.linearRampToValueAtTime(0, now + seconds);
        score.until = now + seconds;
        for (const v of this.voices)
          if (v.score === score)
            try {
              v.osc.stop(now + seconds + 0.02);
            } catch (_) {}
        if (!seconds) {
          score.node.disconnect();
          this.scores = this.scores.filter((s) => s !== score);
        }
      }
      transitionScore(cue) {
        const now = this.ctx.currentTime,
          seconds = cue.id.includes('boss') ? 0.5 : 2;
        for (const s of [...this.scores]) if (s !== this.score) this.retireScore(s);
        if (cue.peace) for (const s of [...this.scores]) this.retireScore(s);
        else this.retireScore(this.score, seconds);
        const node = this.ctx.createGain();
        node.gain.setValueAtTime(0, now);
        node.gain.linearRampToValueAtTime(1, now + seconds);
        node.connect(this.buses.music);
        this.score = { node, key: this.key, until: Infinity };
        this.scores.push(this.score);
      }
      cancelMusic() {
        for (const s of [...this.scores]) this.retireScore(s);
        this.score = null;
      }
      schedule() {
        if (!this.ctx || this.paused || this.ctx.state !== 'running' || !this.cue) return;
        for (const s of [...this.scores]) if (s.until <= this.ctx.currentTime) this.retireScore(s);
        const cue = this.cue,
          theme = themes.find((t) => t.id === cue.id) || themes[0],
          peace = cue.peace || cue.id === 'finale',
          bpm = peace ? Math.max(64, theme.bpm - 10) : theme.bpm,
          beat = 60 / bpm;
        if (this.next < this.ctx.currentTime - 0.2) this.next = this.ctx.currentTime + 0.05;
        while (this.next < this.ctx.currentTime + 0.14) {
          const step = this.step++,
            at = this.next,
            degree = theme.form[step % 256],
            phrase = Math.floor(step / 64) % 4,
            root = theme.root + (peace ? 12 : 0),
            chord = (phrase === 2 ? [5, 3, 1, 4] : [0, 5, 3, 4])[Math.floor(step / 16) % 4];
          if (degree !== null) {
            const variation =
              (phrase === 2 || phrase === 6) && step % 8 === 6
                ? 2
                : phrase === 5 && step % 8 === 2
                  ? -1
                  : 0;
            this.tone(
              root + pitch(degree + variation, peace),
              at,
              beat * 0.7,
              cue.night ? 0.022 : 0.035,
              cue.id.includes('boss')
                ? colors[cue.region] || theme.lead
                : colors[theme.id] || theme.lead,
            );
          }
          if (step % 4 === 0) {
            for (const offset of [0, 2, 4])
              this.tone(
                theme.root - 12 + pitch(chord + offset, peace),
                at,
                beat * 1.8,
                0.012,
                'sine',
              );
            this.tone(theme.root - 24 + pitch(chord, peace), at, beat * 1.2, 0.022, 'triangle');
          }
          if (!peace && step % 2 === 0)
            this.tone(31, at, 0.09, cue.id.includes('boss') ? 0.025 : 0.009, 'sine');
          if (cue.true && step % 4 === 2)
            this.tone(theme.root + pitch(6, false), at, beat * 0.8, 0.012, 'triangle');
          if (peace && step % 8 === 6)
            this.tone(root + 12 + pitch(chord + 4, true), at, beat * 0.8, 0.015, 'sine');
          if (step % 16 === 8) {
            if (cue.region === 'march' || cue.id === 'archive')
              this.tone(80, at, 0.35, 0.009, 'sine', 'ambience');
            if (cue.region === 'highlands' || cue.id === 'mine')
              this.tone(41, at, 0.9, 0.006, 'triangle', 'ambience');
            if (
              !peace &&
              (cue.region === 'frontier' || cue.region === 'crown' || cue.id === 'abyss')
            )
              this.tone(29, at, 1.2, 0.004, 'sine', 'ambience');
            const outdoor = cue.id === cue.region || cue.peace;
            if (outdoor && !cue.night) {
              this.tone(89, at, 0.12, 0.009, 'sine', 'ambience');
              this.tone(94, at + 0.15, 0.1, 0.007, 'sine', 'ambience');
            } else if (!outdoor) {
              this.tone(cue.id === 'archive' ? 79 : 73, at, 0.13, 0.008, 'sine', 'ambience');
            } else this.tone(93, at, 0.05, 0.003, 'sine', 'ambience');
          }
          this.next += beat / 2;
        }
      }
      ambient() {
        if (!this.ctx) return;
        if (this.noise) {
          try {
            this.noise.source.stop();
          } catch (_) {}
          this.noise.source.disconnect();
          this.noise.filter.disconnect();
          this.noise.gain.disconnect();
          this.noise = null;
        }
        if (!this.cue) return;
        const length = this.ctx.sampleRate * 3,
          buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate),
          data = buffer.getChannelData(0);
        let prev = 0;
        for (let i = 0; i < length; i++) {
          prev = (prev + (Math.random() * 2 - 1) * 0.04) / 1.04;
          data[i] = prev;
        }
        const source = this.ctx.createBufferSource(),
          filter = this.ctx.createBiquadFilter(),
          gain = this.ctx.createGain();
        source.buffer = buffer;
        source.loop = true;
        filter.type = 'lowpass';
        filter.frequency.value =
          this.cue.region === 'march' ? 950 : this.cue.id === this.cue.region ? 420 : 180;
        gain.gain.value = this.cue.peace ? 0.09 : 0.13;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.buses.ambience);
        source.start();
        this.noise = { source, filter, gain };
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
  else root.PrototypeAudioScore = { install };
})(typeof window !== 'undefined' ? window : globalThis);
