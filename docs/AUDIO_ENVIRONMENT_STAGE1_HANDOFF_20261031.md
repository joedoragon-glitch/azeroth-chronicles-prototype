# #709 — Environmental finishing pass: four-scene source integration and artistic handoff
**31 October 2026 · SIBDLP · draft PR #711 · not merged / not deployed**

## What changed in the game (exact source-backed inventory)

The original soundscape had **14 registered 24-second environmental MP3s**, routed by **18 environment rules** across **19 named playable locations**, with separate woodland/marsh day/night options and supplementary sparse nighttime/in-world events. **All 14 old MP3s remain registered and on disk**, allowing comparison, reuse or rollback. This finishing pass adds exactly **four distinct 72-second reviewed-source MP3s**, resulting in **18 registered environmental files** (131 total catalog assets: original 83 music, original 30 effects, 18 ambience), while retaining 18 environment rules and 19 locations.

| Actual game location | Previous playback ID | Draft new recording ID | Origin and sound role |
| --- | --- | --- | --- |
| Ironroot Highlands outdoors, day and night | `env-highland-wind` | `env-highlands-autumn` | CC0 autumn hardwood forest/leaves field recording (Wilfredor), restrained mixed ridge texture; stable distinct night insects remain as original detail |
| Recovering Ashen Frontier outdoors, day and night | `env-frontier-air` | `env-frontier-recovery` | CC0 real open-field wind (Thimras), not constant flames; original sparse night insect detail preserved |
| Old Signal Keep interior | `env-highland-wind` | `env-signal-occupied` | Different filtered Highland recorded field interval and rare public-domain recorded timber creak (stephan) |
| Ruined Shrine Barracks interior | `env-frontier-air` | `env-shrine-occupied` | Different filtered Frontier field interval and sparse public-domain muted wooden/domestic movement (thore) |

The two **temporary reuse proposals** (Cellar for Keep and Retreat for Shrine) were **reverted** as premature substitutions, not ruled out artistically: owner agrees in principle to reuse if better than the original or new recording. Those two candidate recordings are still already in the game's preserved original 14-file catalog for later comparative hearing; no separate reuse master was added. Both older proof-of-concept 72s trials were superseded by the four listed current masters and remain only source-audit artifacts.

All other **15 of 19** locations—including Vale day/night, Flooded Marches day/night, Dark Crown, five main dungeons, four Treasuries, and three other side interiors—**retain their old recordings**. Insect sounds for Vale, Ironroot, Frontier and Crown are **preserved**, not removed; Marches water/night details are preserved. No soundtrack, warning, effects, music score, artwork, gameplay, menu or source-positioned weather changes are authorized by this pass.

## Physical source masters and reversibility

| Game ID | Original studio ID | MP3 SHA-256 |
| --- | --- | --- |
| `env-highlands-autumn` | `regional-ironroot-autumn` | `145e9f6b121aa5df8425c98b0261c61b993bfb35a5cae73bb0948e100d3ec261` |
| `env-frontier-recovery` | `regional-frontier-recovery` | `cbb1bad2e2001de64010c651c398cdc85d2738c29f89d5ad6f3a216117053512` |
| `env-signal-occupied` | `regional-signal-occupied` | `04cd9a5345feea1dc5a912249a4c6adb80e12db39260a990b569518d62a4b3ca` |
| `env-shrine-occupied` | `regional-shrine-occupied` | `d2aed039e4c7dbcb1b1b3eda188565d2336d00ede4e32b86bc01db42e7f7e037` |

All four have source/codec-corrected, guarded MP3s, 32kHz mono 128 kbps, measured ~72.36 s file length with **0.15–72.15 s loop bounds**, each **1,158,381 bytes**. SHA-256s verified against original source-recording studio [#41207464084](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41207464084), [artifact](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41207464084/artifacts/13044742571). [Region source and output evidence](../tools/audio/environment-regional-studies.json) retains CC0/PD authors, physical original URLs/source SHA-1s, 72s authoring method and frank sonic concerns. The former original IDs and exact bytes are **untouched**.

The repeatable [promotion script](../tools/audio/integrate-regional-candidates.cjs) verifies every original MP3 SHA and byte size, preserves the old catalog and asset files, registers the four independent new IDs, updates their four precise rules, and records source/copyright metadata. [Isolated integration Action #41212681223](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41212681223) **SUCCESS**: real FFmpeg/FFprobe/EBU decoder integrity and gain analysis, original-preservation/regression tests, 19-zone native routing, stereo-context-simulated transport, generated audio-library + offline worker checks, byte budgets, and strict allowlist; it committed only four MP3s, manifest/route, generated runtime library, PWA worker fingerprint and source-status ledger on the **draft branch**. This is the **source-integrated** state, not final owner-audition authorization.

## Merge / net-improvement gate (owner requirement)

The goal is **a better-sounding game, not a replacement count or green test**. Keep older sound whenever an alternative cannot be demonstrated better; existing-recording reuse is welcome if it gives a stronger aesthetic/contextual result. Maintain a separate per-location comparison of **original vs reused vs newly recorded** where applicable and disclose drawbacks.

**Validated already:** exact source files and license evidence; SHA-256 provenance; studio decoded 72s waveform/spectral/true-peak analysis; no naïve three-times 24s repetition; no physical clipping; source-local Highland peak repair; interior sample balance repair; all original recordings and nocturnal details preserved; actual game asset names/catalog/rules, generated runtime/offline references and owner stage boundaries; target no-deploy build passed integration CI.

**Artistic/physical acceptance still HOLD:** No actual person has heard the four new recordings in game. Ironroot's natural field could contain transient/mic artifacts, despite measured peak shaping. Frontier wind does not on its own imply working Emberwatch. Signal timber was sourced from a casket-creak recording, not real Ogrelife construction; Shrine wood detail was sourced from wood/cutlery and may be anachronistic. Shrine one-second seam envelope measures **+4.011 dB** even though the sample seam is numerically small. New outdoor files are slightly quieter than older sources while music often masks ambience. Full-source-plus-music-plus-warning intelligibility and fatigue/physical iPhone speaker approval have not occurred. A diagnostic spreadsheet or numerical pass is **not** a heard creative GO.

**Runtime/memory caution:** Four 72-second 32kHz mono float32 sources would consume ~36.86 MB at their native rate if all decoded at once; browser AudioContext often resamples to 44.1 kHz or 48 kHz (approximately 50.8–55.3 MB for four concurrent decoded buffers), before music and effects, against the existing 96 MiB recording-cache target. Unlike MP3 storage, this is RAM. Explicitly test bounded caching, crossfades, load/cancellation and warning priority on actual desktop and phone-emulated gameplay, with device verification separate.

**Scope closeout:** Once source/real-browser routing, cache, audible risk logging, focused checks and documentation have been reconciled, this *bounded four-place finishing pass* can be handed back for a final **combined** artistic sound+score audition after soundtrack #673's independent planned work. Later improvements to the *other* 15 locations and generic night detail belong to **future explicitly authorized environmental audio work**, not the current PR. Do not merge, deploy, ask owner for interim debugging/listening, or claim physical device verification without explicit owner approval.

## Historical evidence and quality standards

- [Full original 14 + six retained studio identities + 19-location critical inventory](AUDIO_ENVIRONMENT_PRODUCTION_INVENTORY_20261031.md) — original source/recordings, prior failed/rejected studio variants, corrected QA findings, scene matrix
- [Environmental quality standard and all stage audit lessons](AUDIO_ENVIRONMENT.md) — rights, meaningful natural texture, unique location identity, loop/true-peak/combined mix, artifacts, memory, regression honesty, preservation of existing details
- [Production authoring rules](AUDIO_AUTHORING.md) and [soundtrack creative reference](AUDIO_SOUND_PASS.md), kept as distinct workstreams
- [Issue #709](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/709) and [draft PR #711](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/711) — current technical findings, non-merge policy, final owner acceptance
