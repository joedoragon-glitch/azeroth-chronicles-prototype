# Environmental sound · v0.8.93

> **Current-use boundary — 19 October 2026:** Apply this contract with [current development state](DEVELOPMENT_STATE.md). Dated verification/rollout sections retain their historical scope; they do not authorize work during the break.

Environmental playback is independent of the soundtrack. `audio-environment.js` owns one active loop, at most one outgoing loop, scene selection, load cancellation and gain changes. Music/form changes do not restart the environmental transport. Scene observation never changes gameplay, weather, collisions, saves or progression.

## Creative direction

Fourteen original mono 24-second beds cover all nineteen current places. They are restrained textures rather than a wildlife show: woodland leaf air (day/night), shallow marsh water (day/night), mountain wind, dry frontier air, sheltered Crown courtyards, quiet homes, secluded stone retreat, damp archive, distant mine/foundry works, vaulted Abyss air, Citadel machinery and a timber cellar. Side interiors reuse suitable beds at lower gains. Bosses reduce ambience to 25% of the exploration gain, combat to 45%, with a short attack and slow recovery. Existing menu/profile/mute controls apply through the ambience bus.

The assets contain no third-party recordings, music or model-generated audio. `tools/audio/environment-book.json` holds deterministic seeds, spectral bands, levels, sparse transient timing and reusable generation briefs. `render-environment.py` supplies periodic spectral synthesis, wrapped physical-style transients and encoding. Creative guides describe the intended result; they are not historical model prompts. The listening room exposes both guides and exact recipe references.

Environmental details remain separate first-match `ambience.*` events with synthesized recovery. They occur 18–36 seconds apart and are suppressed in combat, boss encounters, title and game-over scenes. **Draft-only A5 behavior in [issue #709](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/709), [unmerged PR #711](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/711):** sparse night insects are retained in Greenwood Vale, and the Flooded Marches retains its water/night detail; the generic synthesized insect chirps are removed from Highlands, Ashen Frontier and Dark Crown exteriors. **This correction is implemented and narrowly tested on PR #711 only; the published game on `main` still uses the old rule until an expressly authorized merge and deployment.** No recordings or night soundtrack were replaced. These changes alone do not qualify the three regions as artistically complete. There are no added animal roars, dense bird choruses, crowds, weather events or continuous insect swarms. This pass adds broad location atmosphere; it does not introduce source-positioned waterfalls, individual nearby objects or distance/occlusion simulation.

## #709 A5 occupied-interior routing candidate (draft only)

The existing soundscape sent unfiltered open outdoor wind/air into two occupied side interiors. The unmerged [#711](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/711) correction instead reuses **existing** quiet interior sound assets, with their original conservative route levels:

- **Old Signal Keep** (functioning Highlands signal reserve): `env-highland-wind` → `env-cellar` (sheltered timber air and an occasional quiet settling creak), keeping **0.22** gain. This suggests enclosure, **not** a newly authored Ogrelife or signaling recording.
- **Ruined Shrine Barracks** (occupied Frontier barracks in a converted shrine): `env-frontier-air` → `env-retreat` (quiet stone-air space with distant drafts), keeping **0.23** gain. This adds neither invented religious ritual nor military machinery.

These are **source/canon-grounded routing candidates, not genuinely heard artistic approvals**. They trade the exterior's local wind/grit signature for the spatial logic of an enclosed inhabited room. Both sites still need a rendered sound/context comparison, especially against the current music and warning mix. The broader 19-location identity and small-speaker balance risks remain **OPEN**. No MP3, authoring book, catalog ID, soundtrack, music gain, combat attenuation, new species, weather or foley was changed. The same 14 assets and 18 rules still cover 19 places; the live published build remains unchanged until owner-authorized merge and deployment.

The separate [#647](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/647) listening-room correction remains deferred to soundtrack Phase 8. No interim owner audition is requested; environmental final acceptance and soundtrack Phase 9 first listening remain different gates.

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

Rapid scene changes cancel stale starts; a departing bed fades out even while the next file loads. Active and outgoing buffers use the shared pinned decoded LRU cache (96 MiB default under the 31 October 2026 PR #712 budget revision), source limits and cleanup. Pause freezes the context and resumes the same active loop. Catalog replacement stops old sources and reloads the same scene; invalid replacement leaves playback untouched. Failed loads use the original synthesized background without retrying every frame. Environmental diagnostics are separate from music errors in `recordingStatus()`.

The 14 beds contributed approximately 3.9 MiB in the original release. The current full manifest has 127 registered assets (83 music, 14 ambience, 30 effects), approximately 24.5 MiB of source files, below the former 32 MiB encoded cap and far below the new 256 MiB source-contract ceiling. Decoding stays lazy. All registered files join the versioned offline cache. Desktop and phone use the same environmental owner; the phone profile reduces ambience and retains mono compatibility. The listening room can audition individual beds and full contextual scenes without loading app/persistence or touching campaign saves. Replaying an audition replaces its previous recording instead of stacking loops.

Release follows `AUDIO_AUTHORING.md`: bump version, regenerate entries/service worker, run catalog/format/build checks, regression tests and desktop/phone audio/offline browser checks before publishing.
