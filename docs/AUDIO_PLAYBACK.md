# Recorded playback, mixing and audition · v0.8.89

Joel authorized the next engineering phase after the v0.8.88 audio housekeeping. The multi-file Web Audio stack is retained. This release makes recordings and contextual production practical without composing or activating a replacement soundtrack. Warm fantasy remains the broad direction; existing regional canon and all eleven boss identities must guide the later creative pilot.

## Current experience

The game keeps the original 14 synthesized themes, peaceful/night/TRUE arrangements, effect recipes, cue selection, settings defaults and menu suspension. The recorded production registry is empty. No game save, mechanics, costs, map, collision, sprite or approved game layout changes.

The separate [audition room](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/audio/index.html) is available on desktop and phone and works offline after installation. It creates its own isolated campaign, offers every region/main dungeon/treasury/side interior and all eleven normal/TRUE bosses, and auditions existing sound, registered recordings or clearly marked diagnostic PCM tones. Selecting a boss chooses its actual home zone. It does not simulate the encounter or save that campaign.

Scene and recorded Listen buttons provide A/B switching; diagnostic stems share timing, with a live intensity slider. The room includes reference, quiet and phone mixes, an independently audible interface test under a softened menu mix, warning ducking, pause/resume, stop/reopen, waveform/peak/RMS/loop-edge measurements and a local JSON report. It never loads `app.js` or `persistence.js`, and never reads or writes game saves. No analytics or report transmission occurs. Its four explicitly published files join the offline inventory; sprite tooling remains unpublished.

## Owners and APIs

| Owner | Contract |
| --- | --- |
| `audio-assets.js` | Local fetch and SHA-256 verification; bounded codec retry; serialized lazy decode; measured duration/channels/loop checks; pinned LRU cache |
| `audio-recordings.js` | Source handles; shared start/loop timing; at most one outgoing loop group; scene rules; transitions/intensity; procedural recovery |
| `audio-mixer.js` | Independent mix profiles and foreground scene mix; priorities and bounded voice stealing |
| `audio-runtime.js` | Gesture/context lifecycle; five buses; settings/duck automation; unified source cleanup; local status |
| `tools/audio/*` | Isolated listening room and original engineering-only diagnostic WAV generation |

`configureRecordings(manifest, {baseUrl, fetch, budget})` configures an immutable snapshot of a registry. The optional fetch injection is for controlled tests/diagnostics; the game defaults to same-origin registered assets. No constructor loads files or creates a context. Without explicit configuration, the registry is fetched lazily from the game root when recorded playback is requested after gesture unlock.

`playRecording(id, {gain, bus, loop, pan, priority, fade})` returns a stoppable voice or `null` on failure. Music, ambience, effects and interface have distinct buses; metadata maps an `effect` to the effects bus. `stopRecording(voice, seconds)` releases resources at the end of its fade. A playing source pins its decoded buffer. Ambient recordings can use the same loop/source API and handles; this release does not select new ambient content automatically.

`setRecordedScore({id, stems:[{id,gain}], bpm, quantizeBars, fade})` asynchronously prepares one to four music stems with explicit equal-length loop metadata. All start on the same AudioContext timestamp, at their own loop starts. The loop-length tolerance is one context sample. A transition may wait for the next 1/2/4-bar boundary on the current group's clock; zero chooses an immediate fade. BPM is 30–300, four beats per bar. Authors must supply loop lengths coherent with the selected tempo; sample equality does not establish musical alignment. `setStemGain(index, value, seconds)` smooths intensity without restarting transport. `stopRecordedScore(seconds)` returns to the existing procedural cue.

An unsuccessful preparation, corrupt/unsupported file, missing asset, incompatible loop or memory refusal restores the existing procedural scheduler. Rapid transitions have request generations, so outdated loads cannot start later. Existing music continues while preparation is pending. Background or simulation pause freezes the shared AudioContext clock and cancels pending starts; active loops retain their position. Disposal aborts fetching, invalidates pending decode/start requests and releases every active graph/pin. Reopening builds a new context/cache.

`setRecordedCueRules([{id,when,score}])` enables first-match authored rules. Supported exact match fields are region, zone, interior, settlement, situation, night, peace, bossFamily and bossForm. Place specific rules before broad ones. When no rule matches, the procedural cue returns. An empty rule list is the production default. Rules do not alter campaign data or infer mechanics from text; actual boss family/form come from the scene metadata. There is no retry every frame after an asset failure; a rule change, scene change or pause/reopen enables another attempt.

`setSceneMix('world'|'menu'|'title')` is separate from simulation/context pause. Menu mix attenuates music/ambience and silences world effects while interface sound remains available. The later creative pass can use this boundary when wiring actual menu sounds; the current game intentionally retains menu suspension. `setMixProfile('reference'|'quiet'|'phone')` changes listening factors without rewriting saved volume preferences. Phone centers recorded panning and lowers musical/ambient masking; it is an engineering audition profile, not a certified device master. `setSettings({interface})` supplies an independent interface level; absent that preference, the existing effects level is inherited. Mute always wins over duck restoration and profile changes.

## Registration and codec policy

The v1 registry retains kind, local source, duration, SHA-256, author/license and optional loop contract from the foundation. An entry may now include up to three alternate `{src,sha256}` codec variants, in preferred order after the primary file. All variants represent the same duration/loop and each is validated, packaged and precached. Decoding tries the registered alternatives on failure instead of guessing support from a MIME string. Provide a broadly supported MP3 or WAV fallback for OGG; actual browser decoding is authoritative. WAV diagnostics verify the transport; final MP3/OGG production files still need their own codec/loop tests and listening checks.

Registered files stay under `assets/audio`, including real symlink containment at build time. Paths/hashes are rechecked at playback; corrupted fetched content is rejected. Remote URLs, unregistered file paths and escaping paths are refused. The game root resolves correctly under the GitHub Pages repository subpath. Offline playback uses complete precached files. Streaming/range requests are deliberately deferred: bounded short loop segments/stems avoid introducing a second media clock or an untested offline range cache. Long recordings that exceed the decoded budget are refused with procedural fallback; a later measured streaming path can address them.

## Resource and mix guards

| Resource | Initial policy |
| --- | --- |
| Encoded publishing | 8 MiB each, 32 MiB unique registered total, including codec variants |
| Runtime fetch | 8 MiB each; streamed response length enforced; 15-second abort |
| Registry | 128 KiB; lazy fetch with 15-second abort |
| Decode | One at a time, at most eight pending IDs; duplicate loads share one promise |
| Decoded PCM | 32 MiB default LRU; playing/prepared stems pinned; conservative stereo admission before decode |
| Decode watchdog | 20 seconds; a stalled decoder closes its asset store to prevent overlapping runaway decodes; reopen to retry |
| Channels/duration | Mono/stereo; measured duration within max(80 ms, 1%); loop cannot exceed decoded end beyond one sample |
| Score | 1–4 equal-length stems; current plus one outgoing group; bounded 0–4 second fades |
| Transient voices | 64 total; ordinary synthesis/music stops at 56, ordinary effects at 60; final capacity reserved for warnings/UI |
| Critical priority | Warning/death/game-over use priority 3; reserved capacity then steal a lower-priority source, always respecting 64 |

PCM cost is samples × channels × four bytes, rather than compressed file size. At 48 kHz, the two diagnostic mono loops use roughly 0.73 MiB total; their in-memory encoded WAVs total about 0.17 MiB. A four-stem 30-second stereo score at 48 kHz uses roughly 44 MiB and is correctly refused by the 32 MiB default. Admission includes the old playing score and new stems during a crossfade; authors should budget loop duration/channels accordingly. Browser codec allocation and transient decode overhead are outside the cache accounting, which is why decodes are serialized and admitted conservatively. These are initial guards, not measurements of every Chromebook/iPhone's CPU or total memory.

The reference/world profile retains previous levels and compression. New profile factors are comparison presets, not automatic loudness normalization. Recorded gain and panning are explicit. Waveform/RMS/peak and loop-edge measurements help find faults but do not prove pleasant sound, professional loudness, a seamless musical loop, or speaker comfort.

## Verification and next production

Non-browser tests preserve the exact original catalog/defaults, 67,088 note schedules and 186 effect events. New tests cover deduplicated loading, pin/eviction budgets, hashes/path/duration rejection, codec retry, synchronized starts/loops, quantized transitions, rapid switching, failure recovery, pause/dispose during loading, independent UI mixing and warning capacity. Packaging tests include populated isolated registries and offline subpath reads while keeping production manifests unchanged.

Chromium and WebKit run the original game audio tests plus the separate desktop/phone audition checks: gesture unlock, actual WAV decoding, finite audible unclipped OfflineAudioContext rendering, stems, menu/UI routing, frozen pause clock, Dark Lord TRUE identity, untouched storage, offline reopening and disposal/reopen. CI also retains the full game/phone/layout/gesture suites. The implementing agent owns technical verification and release.

Next: audit current place/boss canon into a cue coverage map, then produce a small representative exploration/combat/boss/ambience/interface pilot in this room and in the game. Joel judges the creative sound in context; no new engineering approval or command-line homework is required. Live iPhone speaker/headphone listening and long-session CPU/comfort remain part of that content pilot.
