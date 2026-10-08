(function () {
  'use strict';
  const $ = (id) => document.getElementById(id),
    audio = new PrototypeAudio(),
    baseUrl = new URL('../../', location.href).href;
  const diagnostic = AudioDiagnosticFixtures.create();
  let registry = null,
    source = null,
    action = 0,
    userPaused = false;
  const message = (text) => {
    $('message').textContent = text;
  };
  for (const region of PrototypeData.regions) $('place').add(new Option(region.name, region.id));
  for (const id of Campaign.dungeonIds) {
    const theme = PrototypeAudio.themes.find((t) => t.id === id);
    $('place').add(new Option(theme?.name || id, id));
  }
  for (const entry of [...PrototypeRules.supplyRooms, ...PrototypeRules.sideDungeons])
    $('place').add(new Option(entry.name || entry.id, entry.id));
  for (const boss of PrototypeData.bosses) $('boss').add(new Option(boss.name, boss.id));
  for (const bus of ['master', 'music', 'ambience', 'effects', 'interface']) {
    const label = document.createElement('label'),
      input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '1';
    input.step = '0.01';
    input.value = String(audio.settings[bus] ?? audio.settings.effects);
    input.id = 'volume-' + bus;
    label.append(bus.charAt(0).toUpperCase() + bus.slice(1), input);
    $('volumes').append(label);
    input.addEventListener('input', () => audio.setSettings({ [bus]: Number(input.value) }));
  }
  async function selectSource() {
    const selected = $('source').value;
    if (source === selected) return;
    const token = ++action;
    const data =
      selected === 'diagnostic'
        ? await diagnostic
        : {
            manifest:
              registry ||
              (await fetch(new URL('assets/audio/manifest.json', baseUrl)).then((r) => {
                if (!r.ok) throw Error('Production registry unavailable');
                return r.json();
              })),
          };
    if (token !== action) return;
    if (selected === 'production') registry = data.manifest;
    audio.configureRecordings(data.manifest, {
      baseUrl,
      ...(data.fetch ? { fetch: data.fetch } : {}),
    });
    source = selected;
    $('recording').replaceChildren();
    for (const [id, entry] of Object.entries(data.manifest.assets))
      $('recording').add(new Option(id + ' · ' + entry.kind, id));
    if (!$('recording').options.length)
      $('recording').add(new Option('No production recordings yet', ''));
    $('stem-play').disabled = selected !== 'diagnostic';
    $('ui-play').disabled = selected !== 'diagnostic';
  }
  async function gesture() {
    userPaused = false;
    audio.setPaused(false);
    if (!(await audio.unlock())) throw Error('Tap Listen again to enable audio.');
  }
  function run(fn) {
    return () => {
      fn().catch((e) => message(e.message));
    };
  }
  function clearProcedural() {
    audio.cue = null;
    audio.cancelMusic();
    audio.ambient();
  }
  function draw(item) {
    const samples = item.buffer.getChannelData(0),
      canvas = $('waveform'),
      ctx = canvas.getContext('2d');
    let peak = 0,
      sum = 0;
    for (const n of samples) {
      peak = Math.max(peak, Math.abs(n));
      sum += n * n;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#e5ce91';
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const start = Math.floor((x * samples.length) / canvas.width),
        end = Math.max(start + 1, Math.floor(((x + 1) * samples.length) / canvas.width));
      let min = 0,
        max = 0;
      for (let i = start; i < end; i++) {
        min = Math.min(min, samples[i]);
        max = Math.max(max, samples[i]);
      }
      ctx.moveTo(x, 60 - max * 400);
      ctx.lineTo(x, 60 - min * 400);
    }
    ctx.stroke();
    let seam = 'not looped';
    if (item.entry.loop) {
      const first = Math.round(item.entry.loop.start * item.buffer.sampleRate),
        last = Math.min(
          samples.length - 1,
          Math.round(item.entry.loop.end * item.buffer.sampleRate) - 1,
        );
      seam = Math.abs(samples[first] - samples[last]).toFixed(5) + ' sample-edge difference';
    }
    $('measurement').textContent =
      item.buffer.duration.toFixed(3) +
      ' seconds · ' +
      item.buffer.numberOfChannels +
      ' channel(s) · peak ' +
      peak.toFixed(3) +
      ' · RMS ' +
      Math.sqrt(sum / samples.length).toFixed(3) +
      ' · ' +
      seam +
      '. Listen for seams; measurements alone do not establish a good loop.';
  }
  $('source').addEventListener('change', run(selectSource));
  $('scene-play').addEventListener(
    'click',
    run(async () => {
      await gesture();
      action++;
      audio.stopRecordedScore();
      for (const v of [...audio.voices]) if (v.recorded) audio.stopRecording(v);
      const campaign = new Campaign(),
        boss = PrototypeData.bosses.find((b) => b.id === $('boss').value);
      const place = boss
        ? boss.kind !== 'dungeon'
          ? boss.region
          : boss.id === 'darklord'
            ? 'citadel'
            : boss.id
        : $('place').value;
      campaign.enter(place);
      for (const enemy of campaign.zone().enemies) {
        enemy.aggro = enemy.type === 'boss' && enemy.family === boss?.id;
        if (enemy.aggro) enemy.form = $('form').value;
      }
      Object.defineProperty(campaign, 'peace', { value: $('peace').checked });
      campaign.night = () => $('night').checked;
      audio.key = null;
      audio.update(campaign);
      $('scene-description').textContent = JSON.stringify(audio.context);
      message(
        'Playing current game sound. Boss names and scenes are observed from an isolated campaign.',
      );
    }),
  );
  $('record-play').addEventListener(
    'click',
    run(async () => {
      await gesture();
      await selectSource();
      const id = $('recording').value;
      if (!id) {
        message('No production recording is registered yet.');
        return;
      }
      const entry = audio.recordingManifest.assets[id];
      let ok;
      if (entry.kind === 'music' && entry.loop)
        ok = await audio.setRecordedScore({
          id,
          stems: [{ id, gain: 0.6 }],
          bpm: 120,
          quantizeBars: Number($('grid').value),
        });
      else {
        audio.stopRecordedScore();
        ok = await audio.playRecording(id, { gain: 0.6 });
      }
      if (ok) {
        clearProcedural();
        draw(audio.recordingAssets.touch(id));
        message('Playing ' + id + '.');
      } else message(audio.recordingError || 'Playback did not start.');
    }),
  );
  $('stem-play').addEventListener(
    'click',
    run(async () => {
      await gesture();
      await selectSource();
      const ok = await audio.setRecordedScore({
        id: 'diagnostic-stems',
        bpm: 120,
        quantizeBars: Number($('grid').value),
        stems: [
          { id: 'diagnostic-a', gain: 0.5 },
          { id: 'diagnostic-b', gain: Number($('intensity').value) },
        ],
      });
      if (ok) {
        clearProcedural();
        draw(audio.recordingAssets.touch('diagnostic-a'));
        message('Two diagnostic stems share the same start time and two-second loop.');
      } else message(audio.recordingError || 'Stems did not start.');
    }),
  );
  $('ui-play').addEventListener(
    'click',
    run(async () => {
      await gesture();
      await selectSource();
      await audio.playRecording('diagnostic-click', { bus: 'interface', gain: 0.6 });
    }),
  );
  $('warning').addEventListener(
    'click',
    run(async () => {
      await gesture();
      audio.effect('warning');
    }),
  );
  $('intensity').addEventListener('input', () =>
    audio.setStemGain(1, Number($('intensity').value)),
  );
  $('profile').addEventListener('change', () => audio.setMixProfile($('profile').value));
  $('mix-scene').addEventListener('change', () => audio.setSceneMix($('mix-scene').value));
  $('mute').addEventListener('change', () => audio.setSettings({ muted: $('mute').checked }));
  $('pause').addEventListener(
    'click',
    run(async () => {
      userPaused = !userPaused;
      audio.setPaused(userPaused);
      if (!userPaused) await audio.unlock();
    }),
  );
  $('stop').addEventListener('click', () => {
    action++;
    audio.dispose();
    audio.cue = null;
    audio.key = null;
    message('Stopped. Choose Listen to reopen.');
  });
  $('report').addEventListener('click', () => {
    const report = {
      version: PrototypeBuild.version,
      at: new Date().toISOString(),
      audio: audio.status(),
      measurement: $('measurement').textContent,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'azeroth-audio-report.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document.addEventListener('visibilitychange', () =>
    audio.setPaused(document.hidden || userPaused),
  );
  addEventListener('pagehide', () => audio.dispose());
  setInterval(() => {
    $('status').textContent = JSON.stringify(audio.status(), null, 2);
  }, 250);
  selectSource().catch((e) => message(e.message));
  // Same game-scoped worker, no game boot or storage owner is loaded in this room.
  if ('serviceWorker' in navigator)
    navigator.serviceWorker.register(new URL('sw.js', baseUrl)).catch(() => {});
  window.AudioAudition = { audio, ready: diagnostic, selectSource };
})();
