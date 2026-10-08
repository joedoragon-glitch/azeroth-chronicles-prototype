# Environmental sound · v0.8.93

Environmental playback is independent of the soundtrack. `audio-environment.js` owns one active loop, at most one outgoing loop, scene selection, load cancellation and gain changes. Music/form changes do not restart the environmental transport. Scene observation never changes gameplay, weather, collisions, saves or progression.

## Creative direction

Fourteen original mono 24-second beds cover all nineteen current places. They are restrained textures rather than a wildlife show: woodland leaf air (day/night), shallow marsh water (day/night), mountain wind, dry frontier air, sheltered Crown courtyards, quiet homes, secluded stone retreat, damp archive, distant mine/foundry works, vaulted Abyss air, Citadel machinery and a timber cellar. Side interiors reuse suitable beds at lower gains. Bosses reduce ambience to 25% of the exploration gain, combat to 45%, with a short attack and slow recovery. Existing menu/profile/mute controls apply through the ambience bus.

The assets contain no third-party recordings, music or model-generated audio. `tools/audio/environment-book.json` holds deterministic seeds, spectral bands, levels, sparse transient timing and reusable generation briefs. `render-environment.py` supplies periodic spectral synthesis, wrapped physical-style transients and encoding. Creative guides describe the intended result; they are not historical model prompts. The listening room exposes both guides and exact recipe references.

Environmental details remain separate first-match `ambience.*` events with synthesized recovery. They occur 18–36 seconds apart and are suppressed in combat, boss encounters, title and game-over scenes. There are no added animal roars, dense bird choruses, crowds, weather events or continuous insect swarms. This pass adds broad location atmosphere; it does not introduce source-positioned waterfalls, individual nearby objects or distance/occlusion simulation.

## Author or replace a bed

`assets/audio/manifest.json` remains the runtime authoring source. `director.environment` contains:

```json
{
  "combatGain": 0.45,
  "bossGain": 0.25,
  "detailGap": [18, 36],
  "rules": [
    {"id": "archive", "when": {"zone": "archive"}, "asset": "env-archive", "gain": 0.33, "fade": 2.5}
  ]
}
```

Rules use the existing scene match fields, first match wins. Put exact interiors and night variants ahead of broad region matches. Gains range from 0 to 1; fades from 0.025 to 4 seconds. Referenced assets must have `kind: "ambience"` and valid loop bounds. The shared contract validates registration, build and playback before changing live sources. Removing the optional environment section restores the original background texture for older catalogs.

For an original texture adjustment, edit its book entry and run:

```sh
python3 tools/audio/render-environment.py --id env-archive
```

The renderer changes only assets marked `managedBy: "environment-book"`, preserves custom imported replacements, edited guides and manifest routing, and never changes music assets. Renderer output uses 150 ms periodic codec guards; the loop spans 0.15–24.15 seconds. New book entries also need explicit catalog routing. Obsolete recordings are removed deliberately after their routing has been changed.

For an external replacement, keep the existing ID and register the approved local recording with measured bounds:

```sh
npm run audio:register -- env-archive assets/audio/ambience/my-archive.mp3 --kind ambience --loop-start 0.15 --loop-end 24.15 --author "Joel" --license "CC0-1.0"
```

Bounds are illustrative for a new file. Registration marks the replacement as imported and removes renderer ownership. The original renderer then preserves it. Adding a new ID works the same way; point an environmental rule at it. No runtime code changes are required to replace a sound or route a new location.

## Lifecycle and release

Rapid scene changes cancel stale starts; a departing bed fades out even while the next file loads. Active and outgoing buffers use the shared pinned 32 MiB decoded LRU cache, source limits and cleanup. Pause freezes the context and resumes the same active loop. Catalog replacement stops old sources and reloads the same scene; invalid replacement leaves playback untouched. Failed loads use the original synthesized background without retrying every frame. Environmental diagnostics are separate from music errors in `recordingStatus()`.

The 14 beds add approximately 3.9 MiB, bringing 97 registered files to 23.9 MiB, below the 32 MiB encoded budget. Decoding stays lazy. All registered files join the versioned offline cache. Desktop and phone use the same environmental owner; the phone profile reduces ambience and retains mono compatibility. The listening room can audition individual beds and full contextual scenes without loading app/persistence or touching campaign saves. Replaying an audition replaces its previous recording instead of stacking loops.

Release follows `AUDIO_AUTHORING.md`: bump version, regenerate entries/service worker, run catalog/format/build checks, regression tests and desktop/phone audio/offline browser checks before publishing.
