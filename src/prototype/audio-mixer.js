/* Mixer policy independent of simulation pause and authored compositions. */
(function (root) {
  'use strict';
  const profiles = Object.freeze({
    reference: { master: 1, music: 1, ambience: 1, effects: 1, interface: 1 },
    quiet: { master: 0.65, music: 0.8, ambience: 0.65, effects: 0.85, interface: 0.85 },
    phone: { master: 0.9, music: 0.85, ambience: 0.65, effects: 1, interface: 1 },
  });
  function install(Audio) {
    class Owner {
      setMixProfile(name = 'reference') {
        if (!profiles[name]) throw Error('Unknown mix profile');
        this.mixProfile = name;
        for (const voice of this.voices || [])
          if (voice.pan) voice.pan.pan.value = name === 'phone' ? 0 : voice.authoredPan || 0;
        this.applySettings();
      }
      setSceneMix(scene = 'world') {
        if (!['world', 'menu', 'title'].includes(scene)) throw Error('Unknown mix scene');
        this.mixScene = scene;
        this.applySettings();
      }
      mixLevel(key) {
        const settings =
          key === 'interface'
            ? (this.settings.interface ?? this.settings.effects)
            : this.settings[key];
        const scene =
          this.mixScene === 'menu'
            ? { music: 0.22, ambience: 0.15, effects: 0 }
            : this.mixScene === 'title'
              ? { ambience: 0.4, effects: 0 }
              : {};
        return (
          settings *
          (profiles[this.mixProfile || 'reference'][key] ?? 1) *
          (scene[key] ?? 1) *
          (this.settings.muted ? 0 : 1)
        );
      }
      reserveVoice(priority = 1) {
        const limit = priority >= 3 ? 64 : priority >= 1 ? 60 : 56;
        if (this.voices.size < limit) return true;
        if (priority < 2) return false;
        const victim = [...this.voices].find(
          (v) => (v.priority ?? (v.bus === 'music' ? 0 : 1)) < priority,
        );
        if (!victim) return false;
        try {
          victim.osc.stop();
        } catch (_) {}
        victim.osc.disconnect();
        victim.gain.disconnect();
        victim.filter?.disconnect();
        victim.pan?.disconnect();
        victim.release?.();
        this.voices.delete(victim);
        return this.voices.size < 64;
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
  if (typeof module !== 'undefined') module.exports = { install, profiles };
  else root.PrototypeAudioMixer = { install, profiles };
})(typeof window !== 'undefined' ? window : globalThis);
