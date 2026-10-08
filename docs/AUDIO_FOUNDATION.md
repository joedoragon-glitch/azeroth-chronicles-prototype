# Audio foundation and production sequence

**Current status:** the technical playback/mixer/audition phase is now implemented in v0.8.89; see [AUDIO_PLAYBACK.md](AUDIO_PLAYBACK.md). The remainder of this document records the v0.8.88 housekeeping baseline and its original gap assessment. Production recordings and soundtrack changes remain deferred to the contextual pilot.

Joel's 8 October 2026 direction is a professional contextual audio overhaul, preceded by housekeeping. Warm fantasy is the broad musical direction. Music should relate to the place, situation and actual boss, with a complete menu/interaction/effects soundscape. This phase prepares the foundation; it does not compose, generate, approve or activate replacement sound.

## Stack assessment

The canonical multi-file JavaScript/Canvas/Web Audio PWA is suitable. The renderer does not determine audio quality; no engine migration, native wrapper, game backend or single-file release is necessary. Web Audio already supplies gesture-controlled playback, separate gain buses, synthesized instruments and scheduling. Separate local recordings can join the existing repository and offline release pipeline.

The limitation was implementation organization and the prototype sound catalog, rather than an HTML constraint. At the baseline `fafefe0` (v0.8.86), `audio.js` contained 1,315 lines combining compositions, score selection, gain routing, context lifecycle, node creation, ambience and contextual effects. The catalog has 14 synthesized themes: five regional, five main-dungeon, three generic boss cues and a finale. Regions and dungeons retain peaceful arrangements. The sound-event contract covers literal campaign events, including deliberately silent markers whose concrete attack owns the sound.

## Current owners

| Owner | Responsibility |
| --- | --- |
| `audio.js` | Public `PrototypeAudio` facade and instance state; existing call sites and Node/browser exports |
| `audio-catalog.js` | Existing melodies, forms, modes, defaults, event notes and explicit event coverage |
| `audio-score.js` | Current cue policy, observation of campaign/shell context, transport scheduling, fades and synthesized ambience |
| `audio-runtime.js` | AudioContext lifecycle, gain buses, warning ducking, tone/noise/sweep sources, voice bounds, cleanup and local diagnostics |
| `audio-effects.js` | Contextual event routing, crowd throttling and the existing effect recipes |
| `scripts/audio-assets.cjs` | Registered recorded-audio validation and published-file inventory |

Owners install methods before the facade is exported, using the same module-boundary pattern as the campaign. Domain gameplay remains unchanged. Desktop, phone and offline entries load the same audio owners through the declared asset graph.

`audio.describe(campaign, activity)` exposes region, exact zone, outdoors/main dungeon/treasury/side dungeon, nearby refuge, day/night, peace, combat, actual boss family/form/name, low health, title/menu/pause/background/game-over state. Observation neither changes the campaign nor changes current musical selection. `audio.status()` reports context state, selected cue, observed scene, active voices/scores, ambience count and saved volumes. The optional exported playtest report includes this local diagnostic; nothing is transmitted.

## Housekeeping corrections

| Finding | Correction |
| --- | --- |
| Noise buffer sources bypassed the 64-voice limit; their source/filter/gain connections lacked completion cleanup. | All transient sources share the bound; noise completion disconnects all three nodes. This is resource safety, not a complete future priority mixer. |
| Disposal left score/noise state and connections behind. | Disposal stops/disconnects sources, retires graph state and timers, clears context-specific throttles, and supports repeated calls/reopening. |
| A pending resume could finish after pause or disposal. | Resume checks the current context and desired pause state before restarting the scheduling clock. |
| Only the `suspended` context state was considered by gesture unlock. | Gesture unlock can also retry an `interrupted` context. Effects do not schedule into a non-running context. Real iOS interruptions still need device playtesting. |
| First warnings at context time zero were suppressed by a zero timestamp. | Warning throttling starts at negative infinity. |
| A warning's future gain restoration could conflict with subsequently edited mute/volume settings. | Mixer changes cancel/rebuild scheduled gain automation from the newest preferences, retaining warning ducking. |
| `pagehide` only saved. | It also suspends audio. Menu and explicit-pause silence remain the current behavior. |
| Recorded audio had no explicit validation/packaging contract. | An empty production registry now drives the same packaging, cache and deployment inventory as the runtime owners. Only registered recordings would ship. |

## Recorded-file contract

`assets/audio/manifest.json` currently contains `schemaVersion: 1` and an empty `assets` object. **There is no production recording and no file-playback backend in this release.** This is a validated publishing contract; playback/decoder integration belongs to the next technical phase before activation of recordings. Existing procedural audio stays the fallback baseline.

Future entries have a stable ID, `kind` (`music`, `ambience` or `effect`), repository-local `src`, positive duration, SHA-256, author/license credits and optional validated loop start/end. Paths must stay in `assets/audio`, including real symlink targets. The validator checks the file/container signature, registered content hash, provenance fields, duration and loop ranges. Duplicate references ship once; unregistered sources and masters do not ship.

Initial package guards are 8 MiB per encoded file and 32 MiB total unique recorded files. These are adjustable engineering defaults, not creative limits or a claim about every phone's cache quota. Registration puts approved files into the generated precache. A missing registered file rejects the new installation, preserving the previous playable cache. Actual browser decode, measured duration, audible loop seams and available device storage must be checked before activation; signatures and metadata alone do not prove those properties. MP3/WAV/OGG containers are allowed by packaging; playback must select a supported codec on each browser, with a tested broadly supported fallback. These files are not decoded into memory merely because they are cached.

## Remaining production work

| Area | Current behavior | Required next development |
| --- | --- | --- |
| Exploration | One 32-bar synthesized form per region; night is a quieter variation. | Authored regional motifs and richer instruments/recordings; long-session variation; deliberate day/night arrangements. |
| Settlements/camps | Regional score; no dedicated settlement arrangement or local source mix. | Cozy refuge/camp arrangements; nearby fire, water and settlement activity driven by actual locations. |
| Main dungeons | Five distinct themes. | Environmental identity, entrances, interior detail, tension and post-clear arrangements. |
| Treasuries/side dungeons | Treasury uses parent-region music; unrecognized side-zone IDs fall back to Vale in the scheduler. | Explicit authored cue mappings for every interior, including peaceful revisits. The fallback remains unchanged during housekeeping. |
| Ordinary combat | Regional score continues; contextual attack effects exist. | Beat-aligned combat layers, intensity/hysteresis, readable warning priority and clean disengagement. |
| Boss encounters | Shared field/dungeon boss compositions, regional timbre, TRUE accent; Dark Lord has a separate cue. | Individual boss identity, phase/TRUE arrangements, intro/defeat transitions and summons without transition thrashing. |
| Ending | Finale and peaceful mode; broad scene metadata is now available. | Directed awakening, victory, defeat, Succession and peaceful-world transitions. |
| Menus/title | Opening menus suspends the AudioContext; no interface sounds. | Separate simulation pause from foreground/menu mix state, interface bus, keyboard/mouse/touch selection/confirm/back/denied sounds, title and pause arrangements. |
| Footsteps/interactions | Generic timer-based step; existing progression event melodies. | Actual distance/surface footsteps (no walking sound into walls), doors, discoveries, inventory, trade, training, labor/building and recovery identities without duplicate events. |
| Recorded playback | Packaging contract only. | Asset loader, codec selection, cancellable lazy decode, bounded decoded-memory cache, loop/stem transport, seamless transitions and procedural fallback on failure. Choose buffer vs media streaming using measurements, not assumption. Streaming would also require tested range-request caching. |
| Mix/performance | Four buses, compression, crowd gaps, corrected bounded sources and cleanup. | Reserve/steal priorities for critical warnings/UI, music/SFX balance, subtle stereo placement, normalization/headroom, measured worst-case CPU/memory. |
| Audition | Game playback and diagnostics. | Development-only sound showroom: exact scene/boss/phase combinations, A/B against current sound, normal/quiet/phone mixes and loop-seam inspection. |

The content pass should audit the latest map/canon before assigning music. There are 11 boss definitions in current data (including Cindermaw and the Dark Lord), not merely five regional boss identities. Existing and upcoming region redesigns must not be flattened into generic dungeon mood. No fixed list of instruments for individual places is approved by choosing the broad warm-fantasy direction.

## Sequence

1. Finish/verify this foundation and preserve the existing musical catalog and gameplay.
2. Implement the recorded playback/transport/mixer and development audition path using isolated fixtures; measure desktop/phone resource budgets and offline failure recovery.
3. Define a cue/coverage map from current region and boss canon; build a small representative audio pilot for exploration, combat/boss, ambience and interface. Joel judges the sound in context.
4. Expand approved direction across the actual places, boss families/forms and interaction inventory; verify loops, transitions, priorities, loudness and offline/device behavior.

Passing structural, finite-output or no-clipping tests does not establish professional musical quality. Composition, sound design and hearing the result in context remain part of production; the technical verification belongs to the implementing agent.

## Verification

`tests/audio-housekeeping.test.cjs` compares the extracted catalog/defaults, 67,088 scheduled note calls across existing cue/peace/night/TRUE combinations, 186 representative effect events and routing against the captured v0.8.86 fixture. It also verifies cleanup, voice limits, gain automation, interruption/resume races and observational context. Existing soundtrack selection and engine event tests remain.

`tests/audio-assets.test.cjs` uses only a temporary silent PCM fixture to verify packaging, hashes/provenance/loops/budgets/paths, duplicate registration, unregistered exclusion, offline subpath/query reads and failed-install retention. The production audio registry remains empty throughout.

`tests/audio-browser.test.cjs` checks actual gesture unlock, menu/background suspend/resume, frozen campaign saves, crowd source release and 28 OfflineAudioContext renders (14 themes × normal/peace) for non-silent finite unclipped output in Chromium and WebKit. CI runs it alongside the existing device/phone matrix before deployment. Headless WebKit is not a substitute for hearing the game on Joel's physical iPhone.
