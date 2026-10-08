/* Shared sound catalog validation for authoring and playback. */
(function (root) {
  'use strict';
  // Authoring contracts shared by registration, packaging and generated runtime data.
  const sceneFields = [
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
  const eventFields = [
    ...sceneFields,
    'actor',
    'class',
    'role',
    'species',
    'style',
    'special',
    'combo',
    'surface',
  ];
  function validateCatalog(manifest) {
    const director = manifest.director;
    if (director === undefined) return;
    const fail = (message) => {
      throw Error('Invalid audio catalog: ' + message);
    };
    const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
    const bounded = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
    const match = (when, fields) => {
      if (
        !object(when) ||
        Object.entries(when).some(
          ([key, value]) =>
            !fields.includes(key) ||
            (value !== null && !['string', 'boolean', 'number'].includes(typeof value)) ||
            (typeof value === 'number' && !Number.isFinite(value)),
        )
      )
        fail('invalid match conditions');
    };
    const music = (id) => {
      const asset = manifest.assets[id];
      if (
        !asset ||
        asset.kind !== 'music' ||
        !asset.loop ||
        !bounded(asset.bpm, 30, 300) ||
        !bounded(asset.duration, 0.000001, 600) ||
        !Number.isFinite(asset.loop.start) ||
        !Number.isFinite(asset.loop.end) ||
        asset.loop.start < 0 ||
        asset.loop.end <= asset.loop.start ||
        asset.loop.end > asset.duration
      )
        fail('missing looped music/tempo: ' + id);
      return asset;
    };
    const pair = (ids) => {
      const assets = ids.filter(Boolean).map(music);
      if (
        assets.some(
          (asset) =>
            Math.abs(
              asset.loop.end - asset.loop.start - (assets[0].loop.end - assets[0].loop.start),
            ) >
              1 / 96000 || asset.bpm !== assets[0].bpm,
        )
      )
        fail('unaligned music layers: ' + ids.join(', '));
    };
    if (
      !object(director) ||
      !object(director.places) ||
      !object(director.bosses) ||
      !object(director.specials) ||
      !object(director.events) ||
      !Array.isArray(director.rules)
    )
      fail('missing director sections');
    if (!director.places[director.fallbackPlace]) fail('missing fallback place');
    for (const [id, place] of Object.entries(director.places)) {
      if (!object(place) || !place.base) fail('invalid place: ' + id);
      for (const field of ['gain', 'nightGain', 'settlementGain'])
        if (place[field] !== undefined && !bounded(place[field], 0, 1)) fail('invalid place gain');
      if (place.fade !== undefined && !bounded(place.fade, 0, 4)) fail('invalid place fade');
      for (const base of [place.base, place.peace, place.night, place.settlement].filter(Boolean))
        pair([base, base === place.peace ? null : place.action]);
    }
    for (const [id, boss] of Object.entries(director.bosses)) {
      if (!object(boss) || !boss.base || !boss.true) fail('invalid boss: ' + id);
      pair([boss.base, boss.true]);
      for (const field of ['gain', 'idleGain', 'trueGain'])
        if (boss[field] !== undefined && !bounded(boss[field], 0, 1)) fail('invalid boss gain');
      if (boss.fade !== undefined && !bounded(boss.fade, 0, 4)) fail('invalid boss fade');
    }
    for (const key of ['title', 'defeat', 'finale']) {
      const cue = director.specials[key];
      if (!object(cue) || !bounded(cue.gain, 0, 1)) fail('invalid special: ' + key);
      music(cue.asset);
    }
    if (
      director.rules.length > 128 ||
      new Set(director.rules.map((r) => r?.id)).size !== director.rules.length
    )
      fail('invalid/duplicate cue rules');
    for (const rule of director.rules) {
      if (
        !object(rule) ||
        !/^[a-z0-9][a-z0-9:_-]*$/.test(rule.id || '') ||
        !Array.isArray(rule.score?.stems) ||
        rule.score.stems.length < 1 ||
        rule.score.stems.length > 4
      )
        fail('invalid cue rule');
      match(rule.when, sceneFields);
      pair(rule.score.stems.map((stem) => stem.id));
      for (const stem of rule.score.stems)
        if (!bounded(stem.gain, 0, 1)) fail('invalid rule stem gain');
      if (rule.score.bpm !== undefined && rule.score.bpm !== music(rule.score.stems[0].id).bpm)
        fail('rule tempo differs from asset');
      if (rule.score.fade !== undefined && !bounded(rule.score.fade, 0, 4))
        fail('invalid rule fade');
      if (rule.score.quantizeBars !== undefined && ![0, 1, 2, 4].includes(rule.score.quantizeBars))
        fail('invalid rule quantization');
    }
    if (Object.keys(director.events).length > 256) fail('too many sound events');
    for (const [key, bindings] of Object.entries(director.events)) {
      if (
        !/^(effect|interface|step|ambience)\.[a-zA-Z0-9_-]+$/.test(key) ||
        !Array.isArray(bindings) ||
        bindings.length > 32
      )
        fail('invalid sound event: ' + key);
      for (const binding of bindings) {
        const asset = manifest.assets[binding?.asset];
        if (!object(binding) || !asset || asset.kind === 'music')
          fail('missing effect/ambience: ' + key);
        match(binding.when || {}, eventFields);
        for (const [field, min, max] of [
          ['gain', 0, 1],
          ['pan', -1, 1],
          ['minGap', 0, 10],
          ['priority', 0, 3],
        ])
          if (binding[field] !== undefined && !bounded(binding[field], min, max))
            fail('invalid event ' + field);
        if (
          binding.bus !== undefined &&
          !['effects', 'interface', 'ambience'].includes(binding.bus)
        )
          fail('invalid event bus');
      }
    }
  }
  function runtimeCatalog(manifest) {
    validateCatalog(manifest);
    const { eventGuides, ...director } = manifest.director || {};
    return {
      director: manifest.director ? director : null,
      tempos: Object.fromEntries(
        Object.entries(manifest.assets)
          .filter(([, a]) => a.bpm !== undefined)
          .map(([id, a]) => [id, a.bpm]),
      ),
    };
  }
  const api = { validateCatalog, runtimeCatalog };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeAudioContract = api;
})(typeof window !== 'undefined' ? window : globalThis);
