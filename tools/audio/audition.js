/* Standalone, read-only soundtrack room. No persistence, save import or gameplay boot. */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const audio = new PrototypeAudio();
  const baseUrl = new URL('../../', location.href).href;
  const diagnostic = AudioDiagnosticFixtures.create();
  const kindNames = { music: 'Music', ambience: 'Environment', effect: 'Effect' };
  let registry = null;
  let source = null;
  let action = 0;
  let userPaused = false;
  let hasPlayback = false;
  let visibleRecordings = [];
  let visibleLimit = 24;
  const generatedCues = [
    ...Object.keys(PrototypeAudioCatalog.eventNotes).map((id) => ({
      id: 'event:' + id, title: human(id), category: 'Story / system',
    })),
    ...['select', 'confirm', 'back', 'denied', 'open', 'close'].map((id) => ({
      id: 'ui:' + id, title: 'Menu · ' + human(id), category: 'Interface',
    })),
    ...['grass', 'wet', 'gravel', 'stone', 'wood'].map((id) => ({
      id: 'step:' + id, title: 'Step · ' + human(id), category: 'Movement',
    })),
  ];

  function message(value) {
    $('message').textContent = value;
  }
  function playing(name, text) {
    hasPlayback = true;
    $('now-playing').textContent = name;
    $('pause').disabled = false;
    $('stop').disabled = false;
    $('pause').textContent = 'Pause';
    message(text);
  }
  function stopped(text) {
    hasPlayback = false;
    userPaused = false;
    $('now-playing').textContent = 'Nothing playing';
    $('pause').disabled = true;
    $('stop').disabled = true;
    $('pause').textContent = 'Pause';
    message(text);
  }
  function run(fn) {
    return () => {
      try {
        Promise.resolve(fn()).catch((error) => {
          message('Could not play audio: ' + (error?.message || String(error)));
        });
      } catch (error) {
        message('Could not play audio: ' + (error?.message || String(error)));
      }
    };
  }
  function option(text, value) {
    return new Option(text, value);
  }
  function group(label, items, select) {
    if (!items.length) return;
    const g = document.createElement('optgroup');
    g.label = label;
    for (const item of items) g.append(option(item.name, item.id));
    select.add(g);
  }
  function human(text) {
    return String(text).replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  function soundTitle(id, entry) {
    // A legacy catalog display label survives for this asset; the score-book
    // and the playable game's official title are the source of current naming.
    if (id === 'title') return "So I Became the Dark Lord's Problem";
    return entry?.title || human(id);
  }
  function catalogCounts(manifest) {
    const count = { music: 0, ambience: 0, effect: 0 };
    for (const entry of Object.values(manifest.assets || {}))
      if (Object.hasOwn(count, entry.kind)) count[entry.kind]++;
    return count;
  }
  function populatePlaces() {
    group('Outdoor regions', PrototypeData.regions.map((r) => ({ id: r.id, name: r.name })), $('place'));
    group(
      'Main dungeons',
      Campaign.dungeonIds.map((id) => {
        const theme = PrototypeAudio.themes.find((t) => t.id === id);
        return { id, name: theme?.name || human(id) };
      }),
      $('place'),
    );
    group(
      'Treasuries',
      PrototypeRules.supplyRooms.map((r) => ({ id: r.id, name: r.name || human(r.id) })),
      $('place'),
    );
    group(
      'Side interiors',
      PrototypeRules.sideDungeons.map((r) => ({ id: r.id, name: r.name || human(r.id) })),
      $('place'),
    );
    group(
      'Other game moments',
      [
        { id: 'special:title', name: 'Main title screen' },
        { id: 'special:defeat', name: 'Defeat' },
        { id: 'special:finale', name: 'Peaceful finale' },
      ],
      $('place'),
    );
    for (const b of PrototypeData.bosses) $('boss').add(option(b.name, b.id));
  }
  function bossPlace(boss) {
    return boss.kind !== 'dungeon'
      ? boss.region
      : boss.id === 'darklord'
        ? 'citadel'
        : boss.id;
  }
  function currentPlaceRoute() {
    return registry?.director?.places?.[$('place').value] || null;
  }
  function syncScene() {
    const special = $('place').value.startsWith('special:');
    if (special) $('boss').value = '';
    const boss = $('boss').value;
    const route = currentPlaceRoute();
    const mode = $('scene-mode');
    for (const item of mode.options) {
      item.disabled =
        (item.value === 'combat' && !route?.action) ||
        (item.value === 'settlement' && !route?.settlement) ||
        (item.value === 'night' && !route?.night) ||
        (item.value === 'peace' && !route?.peace);
    }
    if (mode.selectedOptions[0]?.disabled) mode.value = 'exploration';
    mode.disabled = special || !!boss;
    $('boss').disabled = special;
    $('form').disabled = !boss;
    const info = special
      ? 'This is a special cue, separate from regional exploration music.'
      : boss
        ? 'A boss has a unique theme. Normal and TRUE use the same musical clock, with a stronger second layer in TRUE.'
        : mode.value === 'combat'
          ? 'Combat keeps the location melody and adds synchronized action music.'
          : mode.value === 'peace'
            ? 'This arrangement reflects the world after liberation.'
            : mode.value === 'settlement'
              ? 'A quieter arrangement for nearby settlements.'
              : mode.value === 'night'
                ? 'A nighttime arrangement of the location music.'
                : 'Exploration plays the main theme and the appropriate quiet environmental recording.';
    $('scene-help').textContent = info;
    const manifest = registry;
    let cue = null;
    if (manifest) {
      if (special) cue = manifest.director?.specials?.[$('place').value.slice(8)]?.asset;
      else if (boss) cue = manifest.director?.bosses?.[boss]?.base;
      else cue = mode.value === 'peace'
        ? route?.peace
        : mode.value === 'settlement'
          ? route?.settlement
          : mode.value === 'night'
            ? route?.night
            : route?.base;
    }
    $('scene-description').textContent = cue && manifest?.assets?.[cue]
      ? 'Selected: ' + soundTitle(cue, manifest.assets[cue])
      : 'Select a location to hear its soundtrack.';
  }
  function pairFor(id) {
    const director = audio.recordingManifest?.director;
    if (!director) return null;
    for (const route of Object.values(director.places || {}))
      if (route.action && (route.base === id || route.action === id))
        return { base: route.base, layer: route.action, label: 'combat layer' };
    for (const route of Object.values(director.bosses || {}))
      if (route.true && (route.base === id || route.true === id))
        return { base: route.base, layer: route.true, label: 'TRUE layer' };
    return null;
  }
  function usageFor(id, manifest) {
    const uses = [], director = manifest?.director || {};
    for (const [place, route] of Object.entries(director.places || {}))
      for (const [role, asset] of Object.entries(route))
        if (asset === id) uses.push(human(place) + ' · ' + human(role));
    for (const [boss, route] of Object.entries(director.bosses || {}))
      for (const [role, asset] of Object.entries(route))
        if (asset === id) uses.push(human(boss) + ' · ' + human(role) + ' boss');
    for (const [moment, spec] of Object.entries(director.specials || {}))
      if (spec.asset === id) uses.push(human(moment) + ' scene');
    for (const rule of director.environment?.rules || [])
      if (rule.asset === id) uses.push('Environment · ' + human(rule.id));
    for (const [event, bindings] of Object.entries(director.events || {}))
      if (bindings.some((rule) => rule.asset === id)) uses.push('Event · ' + human(event));
    return [...new Set(uses)];
  }
  function collectionFor(id, entry) {
    if (entry.kind === 'ambience') return 'environment';
    if (entry.kind === 'effect') return 'effects';
    return entry.creationMethod === 'authored-recorded-source-score' ? 'new-score' : 'dark-crown';
  }
  function labelFor(id, entry) {
    if (entry.kind === 'ambience') return 'Environment';
    if (entry.kind === 'effect') return 'Recorded effect';
    if (collectionFor(id, entry) === 'dark-crown') return 'Preserved original';
    if (id.endsWith('-true')) return 'TRUE boss layer';
    if (id.startsWith('boss-')) return 'Boss score';
    if (id.startsWith('action-')) return 'Action layer';
    return 'Soundtrack';
  }
  function cardFor({ id, entry, uses }) {
    const card = document.createElement('article');
    card.className = 'sound-card';
    card.dataset.id = id;
    card.dataset.selected = String($('recording').value === id);
    card.setAttribute('role', 'listitem');
    const top = document.createElement('div');
    top.className = 'card-top';
    const label = document.createElement('span');
    label.className = 'tag';
    label.textContent = labelFor(id, entry);
    const duration = document.createElement('span');
    duration.className = 'duration';
    if (Number.isFinite(entry.duration)) {
      const seconds = Math.round(entry.duration);
      duration.textContent = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
    }
    top.append(label, duration);
    const title = document.createElement('button');
    title.type = 'button';
    title.className = 'card-title';
    title.textContent = soundTitle(id, entry);
    title.setAttribute('aria-label', 'Select ' + soundTitle(id, entry));
    title.addEventListener('click', () => selectRecording(id));
    const context = document.createElement('p');
    context.className = 'card-context';
    context.textContent = uses.length ? uses.slice(0, 2).join('; ') : 'Listen to this recording alone';
    const code = document.createElement('span');
    code.className = 'card-id';
    code.textContent = id;
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'quick-play';
    play.textContent = '▶ Play';
    play.setAttribute('aria-label', 'Play ' + soundTitle(id, entry));
    play.addEventListener('click', run(async () => {
      selectRecording(id);
      await playRecording();
    }));
    card.append(top, title, context, code, play);
    return card;
  }
  function selectRecording(id) {
    if (![...$('recording').options].some((o) => o.value === id)) return;
    $('recording').value = id;
    showRecording();
  }
  function renderCards() {
    $('library-grid').replaceChildren(...visibleRecordings.slice(0, visibleLimit).map(cardFor));
    $('show-more').hidden = visibleLimit >= visibleRecordings.length;
  }
  function renderGenerated() {
    const query = $('search').value.trim().toLowerCase();
    const cues = generatedCues.filter((item) => !query ||
      (item.id + ' ' + item.title + ' ' + item.category).toLowerCase().includes(query));
    const grid = $('generated-grid');
    grid.replaceChildren();
    for (const item of cues) {
      const card = document.createElement('article');
      card.className = 'sound-card';
      card.setAttribute('role', 'listitem');
      const label = document.createElement('span');
      label.className = 'tag';
      label.textContent = item.category;
      const title = document.createElement('strong');
      title.textContent = item.title;
      const id = document.createElement('span');
      id.className = 'card-id';
      id.textContent = item.id;
      const play = document.createElement('button');
      play.type = 'button';
      play.className = 'quick-play';
      play.textContent = '▶ Play generated cue';
      play.setAttribute('aria-label', 'Play ' + item.title);
      play.addEventListener('click', run(() => playGenerated(item.id, item.title)));
      card.append(label, title, id, play);
      grid.append(card);
    }
    $('result-count').textContent = cues.length + ' generated game cues · ' + generatedCues.length + ' in this collection';
    $('library-grid').hidden = true;
    $('recorded-panel').hidden = true;
    $('generated-panel').hidden = false;
    $('show-more').hidden = true;
  }
  async function playGenerated(id, title) {
    const token = ++action;
    audio.enableProduction(true);
    await gesture();
    if (token !== action) return;
    audio.stopEnvironment(0);
    audio.stopRecordedScore(0);
    stopIsolatedVoices();
    clearProcedural();
    if (id.startsWith('ui:')) audio.interfaceSound(id.slice(3));
    else if (id.startsWith('step:')) {
      const surface = id.slice(5);
      audio.context = {
        region: surface === 'wet' ? 'march' : surface === 'gravel' ? 'frontier' : 'vale',
        interior: ['wood', 'stone'].includes(surface) ? 'treasury' : 'outdoors',
        zone: surface === 'wood' ? 'supply-vale' : 'vale', situation: 'exploration', started: true,
      };
      audio.stepDistance = 0;
      audio.footstep({}, 43);
    } else audio.effect(id.slice(6));
    hasPlayback = false;
    $('now-playing').textContent = 'Last heard: ' + title;
    $('pause').disabled = true;
    $('stop').disabled = true;
    message('Played ' + title + ' with the game engine. Press Play again to repeat.');
  }
  function fillLibrary(previousId) {
    const manifest = audio.recordingManifest;
    if (!manifest) return;
    if ($('kind').value === 'generated') return renderGenerated();
    $('library-grid').hidden = false;
    $('recorded-panel').hidden = false;
    $('generated-panel').hidden = true;
    const kind = $('kind').value, collection = $('collection').value;
    const query = $('search').value.trim().toLowerCase();
    const bucket = { main: [], variations: [], bosses: [], interiors: [], special: [],
      legacy: [], ambience: [], effect: [] };
    visibleRecordings = [];
    for (const [id, entry] of Object.entries(manifest.assets)) {
      if (kind !== 'all' && entry.kind !== kind) continue;
      if (collection !== 'all' && collectionFor(id, entry) !== collection) continue;
      const uses = usageFor(id, manifest);
      if (query && !(id + ' ' + soundTitle(id, entry) + ' ' + uses.join(' ') +
        ' ' + (entry.generationGuide || '')).toLowerCase().includes(query)) continue;
      const item = { id, name: soundTitle(id, entry) + ' · ' + id, entry, uses };
      visibleRecordings.push(item);
      if (entry.kind !== 'music') bucket[entry.kind].push(item);
      else if (entry.creationMethod !== 'authored-recorded-source-score') bucket.legacy.push(item);
      else if (id.startsWith('boss-')) bucket.bosses.push(item);
      else if (id.startsWith('interior-') || id.startsWith('peace-interior-'))
        bucket.interiors.push(item);
      else if (['title', 'defeat', 'finale'].includes(id)) bucket.special.push(item);
      else if (id.startsWith('place-')) bucket.main.push(item);
      else bucket.variations.push(item);
    }
    if ($('sort').value !== 'catalog') {
      const value = (item) => $('sort').value === 'id' ? item.id : soundTitle(item.id, item.entry);
      visibleRecordings.sort((a, b) => value(a).localeCompare(value(b)));
    }
    const target = $('recording'), selected = previousId || target.value;
    target.replaceChildren();
    for (const [key, label] of [
      ['main', 'Regional and dungeon main themes'],
      ['variations', 'Combat, night, settlement, liberation'],
      ['bosses', 'Bosses and TRUE themes'],
      ['interiors', 'Treasuries and side interiors'],
      ['special', 'Title, defeat and finale'],
      ['legacy', 'Original Dark Crown — preserved'],
      ['ambience', 'Environmental sound beds'],
      ['effect', 'Recorded sound effects'],
    ]) group(label, bucket[key], target);
    if (!target.options.length) target.add(option('No recordings match this filter', ''));
    if (selected && [...target.options].some((o) => o.value === selected)) target.value = selected;
    $('result-count').textContent = visibleRecordings.length + ' matching recordings · ' +
      Object.keys(manifest.assets).length + ' total registered';
    renderCards();
    showRecording();
  }
  function showRecording() {
    const id = $('recording').value;
    const entry = audio.recordingManifest?.assets?.[id];
    const info = $('recording-info');
    info.replaceChildren();
    const title = document.createElement('strong');
    title.textContent = entry ? soundTitle(id, entry) : 'No recording selected';
    info.append(title);
    if (entry) {
      const details = document.createElement('div');
      const labels = [
        entry.kind === 'music'
          ? entry.creationMethod === 'authored-recorded-source-score'
            ? 'Phase 3–6 recorded-source composition'
            : 'Original Dark Crown recording — not rebuilt'
          : kindNames[entry.kind] || human(entry.kind),
        entry.bpm ? entry.bpm + ' BPM' : null,
        entry.duration ? entry.duration.toFixed(1) + ' seconds' : null,
        id,
      ].filter(Boolean);
      for (const part of labels) {
        const span = document.createElement('span');
        span.textContent = part;
        details.append(span);
      }
      info.append(details);
    }
    const uses = entry ? usageFor(id, audio.recordingManifest) : [];
    if (uses.length) {
      const context = document.createElement('p');
      context.textContent = 'Used in: ' + uses.slice(0, 5).join('; ') + (uses.length > 5 ? '…' : '');
      info.append(context);
    }
    for (const card of $('library-grid').children)
      card.dataset.selected = String(card.dataset.id === id);
    const pair = pairFor(id);
    $('record-play').disabled = !entry;
    $('stem-play').disabled = !pair &&
      !(source === 'diagnostic' && ['diagnostic-a', 'diagnostic-b'].includes(id));
    $('intensity').disabled = $('stem-play').disabled;
    $('pair-help').textContent = pair
      ? 'Pair available: ' + soundTitle(pair.base, audio.recordingManifest.assets[pair.base]) +
        ' + ' + pair.label + '. This does not replace or edit either sound.'
      : source === 'diagnostic' && id
        ? 'The two test tones are synchronized engineering fixtures, not soundtrack tracks.'
        : 'This recording does not have a synchronized action/TRUE partner.';
    showGuide();
  }
  function showGuide() {
    const manifest = audio.recordingManifest;
    const key = $('guide-event').value;
    const entry = manifest?.assets?.[$('recording').value];
    $('guide-text').value = key
      ? manifest?.director?.eventGuides?.[key] || 'No creative brief registered.'
      : entry?.generationGuide || 'This diagnostic fixture has no production creative brief.';
    if (!key && $('recording').value === 'title')
      $('guide-text').value = $('guide-text').value.replaceAll(
        'Azeroth Chronicles',
        "So I Became the Dark Lord's Problem",
      );
    $('guide-recipe').textContent = !key && $('recording').value === 'title'
      ? "The recording's old descriptive text still uses the former development name. The official game and music title is So I Became the Dark Lord's Problem; do not reuse the old name in new creative work."
      : key
        ? 'Exact event implementation: src/prototype/audio-effects.js, audio-production.js and audio-catalog.js.'
      : entry?.creationMethod === 'authored-recorded-source-score'
        ? 'Exact Phase 3–6 recorded-instrument score: ' + entry.sourceScore + '. The historic score-book is not this master.'
        : entry?.managedBy === 'score-book'
          ? 'Original preserved Dark Crown music: tools/audio/score-book.json; renderer: render-score.py.'
        : entry?.managedBy === 'environment-book'
          ? 'Original environment recipe: tools/audio/environment-book.json; renderer: render-environment.py.'
          : entry?.managedBy === 'sfx-book'
            ? 'Original effect recipe: tools/audio/sfx-book.json; renderer: render-sfx.py.'
            : entry?.creationMethod === 'imported-recording'
              ? 'Imported asset: review its author and license metadata before reusing it.'
              : 'Engineering-generated fixture or an asset with another recorded source.';
  }
  function fillGuides() {
    const selected = $('guide-event').value;
    $('guide-event').replaceChildren(option('Creative brief for the selected recording', ''));
    for (const key of Object.keys(audio.recordingManifest?.director?.eventGuides || {}))
      $('guide-event').add(option(human(key) + ' · event ' + key, key));
    if ([...$('guide-event').options].some((o) => o.value === selected))
      $('guide-event').value = selected;
  }

  async function selectSource(requested = $('source').value) {
    if (source === requested && audio.recordingManifest) return;
    const token = ++action;
    const data = requested === 'diagnostic'
      ? await diagnostic
      : { manifest: registry || await fetch(new URL('assets/audio/manifest.json', baseUrl))
        .then((response) => {
          if (!response.ok) throw Error('The game recording library could not be loaded (' + response.status + ').');
          return response.json();
        }) };
    if (token !== action) return;
    audio.configureRecordings(data.manifest, {
      baseUrl,
      ...(data.fetch ? { fetch: data.fetch } : {}),
    });
    if (requested === 'production') registry = data.manifest;
    if (source && source !== requested) stopped('Switched audio libraries. Choose a recording or scene to begin.');
    source = requested;
    $('source').value = requested;
    fillGuides();
    fillLibrary();
    if (registry) {
      const count = catalogCounts(registry);
      $('catalog-count').textContent =
        Object.keys(registry.assets).length + ' registered recordings: ' +
        count.music + ' music tracks, ' + count.ambience + ' environmental sounds and ' +
        count.effect + ' effects; plus ' + generatedCues.length +
        ' synthesized game cues. Candidate build: ' + PrototypeBuild.version + '.';
    } else {
      $('catalog-count').textContent = 'The production catalog is unavailable; you can still try engineering test tones.';
    }
    syncScene();
  }
  async function gesture() {
    userPaused = false;
    audio.setPaused(false);
    if (!(await audio.unlock())) throw Error('Your browser has not enabled audio. Press Play again, or check the device volume.');
    audio.setMixProfile($('profile').value);
    audio.setSceneMix($('mix-scene').value);
  }
  function stopIsolatedVoices() {
    for (const voice of [...audio.voices])
      if (voice.recorded && !voice.recordedScore) audio.stopRecording(voice, 0);
  }
  function clearProcedural() {
    audio.cue = null;
    audio.key = null;
    audio.cancelMusic();
    audio.ambient();
  }
  function sceneFromCampaign() {
    const special = $('place').value.startsWith('special:');
    if (special) {
      const moment = $('place').value.slice(8);
      return {
        region: 'vale', zone: 'vale', interior: 'outdoors', settlement: null,
        situation: moment === 'title' ? 'title' : moment === 'defeat' ? 'game-over' : 'peace',
        started: moment !== 'title', gameOver: moment === 'defeat',
        peace: moment === 'finale', night: false, boss: null, engaged: 0,
      };
    }
    const boss = PrototypeData.bosses.find((b) => b.id === $('boss').value);
    const place = boss ? bossPlace(boss) : $('place').value;
    const campaign = new Campaign();
    campaign.enter(place);
    const scene = audio.describe(campaign);
    const mode = $('scene-mode').value;
    return {
      ...scene,
      night: !boss && mode === 'night',
      peace: !boss && mode === 'peace',
      settlement: !boss && mode === 'settlement' ? 'audition-refuge' : null,
      boss: boss ? { family: boss.id, form: $('form').value, name: boss.name } : null,
      engaged: boss ? 1 : mode === 'combat' ? 4 : 0,
      situation: boss ? 'boss' : mode === 'combat' ? 'combat' : mode === 'peace' ? 'peace' : mode,
      started: true,
      gameOver: false,
    };
  }
  function draw(item) {
    if (!item?.buffer) return;
    const samples = item.buffer.getChannelData(0);
    const canvas = $('waveform');
    const ctx = canvas.getContext('2d');
    let peak = 0;
    let sum = 0;
    for (const n of samples) {
      peak = Math.max(peak, Math.abs(n));
      sum += n * n;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#e5ce91';
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const start = Math.floor((x * samples.length) / canvas.width);
      const end = Math.max(start + 1, Math.floor(((x + 1) * samples.length) / canvas.width));
      let min = 0, max = 0;
      for (let i = start; i < end; i++) {
        min = Math.min(min, samples[i]);
        max = Math.max(max, samples[i]);
      }
      ctx.moveTo(x, 60 - max * 400);
      ctx.lineTo(x, 60 - min * 400);
    }
    ctx.stroke();
    let seam = 'not a music loop';
    if (item.entry.loop) {
      const first = Math.min(samples.length - 1, Math.round(item.entry.loop.start * item.buffer.sampleRate));
      const last = Math.min(samples.length - 1, Math.round(item.entry.loop.end * item.buffer.sampleRate) - 1);
      seam = Math.abs(samples[first] - samples[last]).toFixed(5) + ' sample-edge difference';
    }
    $('measurement').textContent = item.buffer.duration.toFixed(2) +
      ' seconds · ' + item.buffer.numberOfChannels + ' channel(s) · peak ' +
      peak.toFixed(3) + ' · RMS ' + Math.sqrt(sum / samples.length).toFixed(3) +
      ' · ' + seam + '. Only listening can judge the sound.';
  }
  function inspect(id) {
    const item = audio.recordingAssets?.touch(id);
    if (item) draw(item);
  }
  async function playScene() {
    let token = ++action;
    const useRecorded = $('new-score').checked;
    audio.enableProduction(useRecorded);
    // Call unlock within the actual click before any async catalog fetch: mobile
    // browsers may otherwise reject playback because user activation expired.
    await gesture();
    if (token !== action) return;
    if ($('source').value !== 'production' || source !== 'production') {
      await selectSource('production');
      token = action;
      if (source !== 'production') return;
    }
    const scene = sceneFromCampaign();
    audio.context = scene;
    stopIsolatedVoices();
    audio.stopEnvironment(0);
    audio.finaleUntil = scene.situation === 'peace' && $('place').value === 'special:finale'
      ? audio.ctx.currentTime + 120 : 0;
    if (!useRecorded) {
      if ($('place').value.startsWith('special:')) {
        throw Error('Original procedural comparison is only available for locations and bosses.');
      }
      const boss = PrototypeData.bosses.find((b) => b.id === $('boss').value);
      const campaign = new Campaign();
      campaign.enter(boss ? bossPlace(boss) : $('place').value);
      if (boss) {
        const point = campaign.safe(campaign.hero.x + 180, campaign.hero.y, campaign.zoneId);
        campaign.zone().enemies.push(campaign.bossEnemy(boss, $('form').value, point));
      }
      for (const enemy of campaign.zone().enemies)
        enemy.aggro = !!boss && enemy.type === 'boss' && enemy.family === boss.id;
      Object.defineProperty(campaign, 'peace', { value: scene.peace });
      campaign.night = () => scene.night;
      audio.stopRecordedScore(0);
      audio.update(campaign);
      playing('Original synthesized game music', 'Playing the legacy procedural soundtrack for comparison.');
      return;
    }
    clearProcedural();
    const spec = audio.productionCue(scene);
    if (!spec) throw Error('The selected scene has no registered soundtrack.');
    const ok = await audio.setRecordedScore({
      ...spec,
      quantizeBars: Number($('grid').value),
    });
    if (token !== action) return;
    if (!ok) throw Error(audio.recordingError || 'The selected scene could not start.');
    if (scene.engaged && !scene.boss && spec.stems.length > 1)
      audio.setStemGain(1, Math.min(0.55, 0.28 + scene.engaged * 0.045), 0.2);
    audio.updateEnvironment(scene);
    const main = registry.assets[spec.stems[0].id];
    const label = soundTitle(spec.stems[0].id, main);
    const situation = scene.boss ? scene.boss.form === 'true' ? 'TRUE boss' : 'Boss'
      : $('place').value.startsWith('special:') ? 'Special scene'
        : $('scene-mode').selectedOptions[0]?.textContent || 'Exploration';
    $('scene-description').textContent = 'Playing: ' + label +
      (spec.stems.length > 1 ? ' · ' + spec.stems.length + ' synchronized music layers' : ' · single music layer');
    playing(label + ' · ' + situation, 'Listening to the recorded game scene. Use Stop audio when finished.');
  }
  async function playRecording() {
    let token = ++action;
    const requested = $('source').value;
    audio.enableProduction(false);
    await gesture();
    if (token !== action) return;
    if (source !== requested) {
      await selectSource(requested);
      token = action;
      if (source !== requested) return;
    }
    const id = $('recording').value;
    const entry = audio.recordingManifest?.assets?.[id];
    if (!entry) throw Error('Choose a recording from the library first.');
    audio.stopEnvironment(0);
    audio.stopRecordedScore(0);
    stopIsolatedVoices();
    clearProcedural();
    let ok;
    if (entry.kind === 'music' && entry.loop)
      ok = await audio.setRecordedScore({
        id, stems: [{ id, gain: 0.65 }],
        bpm: entry.bpm || 120, quantizeBars: Number($('grid').value),
      });
    else
      ok = await audio.playRecording(id, {
        bus: entry.kind === 'ambience' ? 'ambience' : 'effects',
        loop: entry.kind === 'ambience',
        gain: 0.65,
      });
    if (token !== action) return;
    if (!ok) throw Error(audio.recordingError || 'The recording could not play.');
    inspect(id);
    if (entry.kind === 'effect') {
      hasPlayback = false;
      $('now-playing').textContent = 'Last heard: ' + soundTitle(id, entry);
      $('pause').disabled = true;
      $('stop').disabled = true;
      message('Played ' + id + '. Short effects finish on their own; press Play again to repeat.');
    } else {
      playing(soundTitle(id, entry), 'Playing ' + id + ' alone. Press Stop audio to end the loop.');
    }
  }
  async function playPaired() {
    const token = ++action;
    const pair = source === 'diagnostic'
      ? { base: 'diagnostic-a', layer: 'diagnostic-b', label: 'test tone' }
      : pairFor($('recording').value);
    if (!pair) throw Error('This recording has no synchronized second layer.');
    const sourceLabel = source;
    const entry = audio.recordingManifest.assets[pair.base];
    audio.enableProduction(false);
    await gesture();
    if (token !== action) return;
    audio.stopEnvironment(0);
    stopIsolatedVoices();
    clearProcedural();
    const ok = await audio.setRecordedScore({
      id: sourceLabel === 'diagnostic' ? 'diagnostic-stems' : pair.base + '-paired',
      bpm: entry.bpm || 120, quantizeBars: Number($('grid').value),
      stems: [
        { id: pair.base, gain: 0.6 },
        { id: pair.layer, gain: Number($('intensity').value) },
      ],
    });
    if (token !== action) return;
    if (!ok) throw Error(audio.recordingError || 'The two layers could not play together.');
    inspect(pair.base);
    playing(soundTitle(pair.base, entry) + ' + ' + pair.label,
      'Both parts started in sync. Move Paired-layer volume to compare their balance.');
  }
  function volumeControls() {
    for (const bus of ['master', 'music', 'ambience', 'effects', 'interface']) {
      const label = document.createElement('label');
      const input = document.createElement('input');
      const output = document.createElement('output');
      input.type = 'range';
      input.min = '0';
      input.max = '1';
      input.step = '0.01';
      input.value = String(audio.settings[bus] ?? 1);
      input.id = 'volume-' + bus;
      output.id = 'readout-' + bus;
      output.textContent = Math.round(Number(input.value) * 100) + '%';
      label.htmlFor = input.id;
      label.append(human(bus) + ' level', output, input);
      $('volumes').append(label);
      input.addEventListener('input', () => {
        audio.setSettings({ [bus]: Number(input.value) });
        output.textContent = Math.round(Number(input.value) * 100) + '%';
      });
    }
  }

  populatePlaces();
  volumeControls();
  $('place').addEventListener('change', () => {
    $('boss').value = '';
    syncScene();
  });
  $('scene-mode').addEventListener('change', syncScene);
  $('boss').addEventListener('change', () => {
    const boss = PrototypeData.bosses.find((b) => b.id === $('boss').value);
    if (boss) $('place').value = bossPlace(boss);
    syncScene();
  });
  $('form').addEventListener('change', syncScene);
  $('kind').addEventListener('change', () => { visibleLimit = 24; fillLibrary(); });
  $('collection').addEventListener('change', () => { visibleLimit = 24; fillLibrary(); });
  $('sort').addEventListener('change', () => fillLibrary());
  $('search').addEventListener('input', () => { visibleLimit = 24; fillLibrary(); });
  $('show-more').addEventListener('click', () => { visibleLimit += 24; renderCards(); });
  $('reset-library').addEventListener('click', () => {
    $('kind').value = 'all';
    $('collection').value = 'all';
    $('sort').value = 'catalog';
    $('search').value = '';
    visibleLimit = 24;
    fillLibrary();
  });
  $('recording').addEventListener('change', showRecording);
  $('guide-event').addEventListener('change', showGuide);
  $('source').addEventListener('change', run(async () => {
    await selectSource();
    message(source === 'diagnostic'
      ? 'Engineering test tones selected. Return to Real game recordings for the soundtrack.'
      : 'The complete production sound library is ready.');
  }));
  $('scene-play').addEventListener('click', run(playScene));
  $('record-play').addEventListener('click', run(playRecording));
  $('stem-play').addEventListener('click', run(playPaired));
  $('intensity').addEventListener('input', () => {
    $('intensity-value').textContent = Math.round(Number($('intensity').value) * 100) + '%';
    audio.setStemGain(1, Number($('intensity').value));
  });
  $('copy-guide').addEventListener('click', run(async () => {
    if (!navigator.clipboard?.writeText) throw Error('Clipboard is unavailable; select the text and copy it manually.');
    await navigator.clipboard.writeText($('guide-text').value);
    message('Creative brief copied. It describes the sound; no files were changed.');
  }));
  $('profile').addEventListener('change', () => audio.setMixProfile($('profile').value));
  $('mix-scene').addEventListener('change', () => audio.setSceneMix($('mix-scene').value));
  $('mute').addEventListener('change', () => audio.setSettings({ muted: $('mute').checked }));
  $('pause').addEventListener('click', run(async () => {
    if (!hasPlayback) return;
    userPaused = !userPaused;
    audio.setPaused(userPaused);
    if (!userPaused && !(await audio.unlock())) throw Error('Playback could not resume.');
    $('pause').textContent = userPaused ? 'Resume' : 'Pause';
    message(userPaused ? 'Audio paused.' : 'Audio resumed.');
  }));
  $('stop').addEventListener('click', () => {
    action++;
    audio.dispose();
    stopped('Stopped. Choose any scene or recording to listen again.');
  });
  $('warning').addEventListener('click', run(async () => {
    await gesture();
    audio.effect('warning');
    message('Played the game warning effect. Keep warnings audible over music.');
  }));
  $('ui-play').addEventListener('click', run(async () => {
    await gesture();
    if (source === 'diagnostic') {
      if (!(await audio.playRecording('diagnostic-click', { bus: 'interface', gain: 0.6 })))
        throw Error(audio.recordingError || 'Diagnostic click could not play.');
    } else {
      audio.enableProduction(true);
      audio.interfaceSound('confirm');
    }
    message('Played an interface test. The advanced menu simulation may alter its mix.');
  }));
  $('report').addEventListener('click', () => {
    const report = {
      version: PrototypeBuild.version,
      timestamp: new Date().toISOString(),
      page: 'soundtrack-listening-room',
      selectedSource: source,
      selectedRecording: $('recording').value,
      selectedScene: $('place').value,
      currentMessage: $('message').textContent,
      audio: audio.status(),
      waveformMeasurement: $('measurement').textContent,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sibdlp-audio-diagnostic.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message('Downloaded a local technical report. No data was uploaded.');
  });
  document.addEventListener('visibilitychange', () => audio.setPaused(document.hidden || userPaused));
  addEventListener('pagehide', () => audio.dispose());
  setInterval(() => {
    if ($('advanced').open && $('status').closest('details').open)
      $('status').textContent = JSON.stringify(audio.status(), null, 2);
  }, 1000);
  selectSource('production').catch((error) => {
    $('catalog-count').textContent = 'Could not load the production library. Choose Play to retry.';
    message(error.message);
  });
  // The audition page deliberately never opens or writes campaign saves.
  if ('serviceWorker' in navigator)
    navigator.serviceWorker.register(new URL('sw.js', baseUrl)).catch(() => {});
  window.AudioAudition = { audio, ready: diagnostic, selectSource, pairFor, syncScene, usageFor, collectionFor };
})();
