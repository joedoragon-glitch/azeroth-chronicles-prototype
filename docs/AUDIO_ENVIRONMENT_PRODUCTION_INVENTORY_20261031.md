# Environmental audio — audit-of-the-audit inventory and merge gate
> 31 October 2026. Owner's clarification: **all developed environmental audio is intended to replace the older live environmental sound**, not to remain a set of demos. This inventory covers *So I Became the Dark Lord's Problem* (#709 / draft PR #711); soundtrack #673 remains a separate creative workstream. **No merge/deploy authorized.**

## Explicit audit verdict

**The earlier statement “environmental audio done / fully audited” was inaccurate.** Source-level tests have verified **all 14 original MP3 files**, the 18 deterministic selection rules and every one of **19 playable locations**. We independently re-opened, SHA-256-verified and decoded **all six retained final studio masters** (two *superseded* early proofs plus four newer regional/interior candidates). The PR repository tree still has **only 14 original environmental MP3s; none of the six candidates is registered or shipped**. The two existing room mapping changes in PR #711 are original-to-original substitutions that demonstrably reduce predicted audibility. The *new* soundscapes therefore remain **0/4 integrated, 0/19 scene replacements**. This is a blocking implementation gap, not a paper-cut.

There is **no genuine ear/hearing quality verdict on any of the six candidates**. MP3 decoding, FFT/spectral power, EBU R128 loudness, source-rights provenance, peak and loop checks are engineering evidence, **not** professional listening. No candidate has undergone integrated game + score + warning + phone speaker acceptance. Reports must not state otherwise. The interim owner listening restriction continues; wait for final approved playable rollout/listening-room timing.

### Exact physical asset and source accounting

- **14 original** 24-second loop MP3 files, exactly 14 registered `kind: ambience` IDs. They are all still managed by `environment-book`, original files each 292,509 encoded bytes (4,095,126 bytes total). 7 of 14 have no embedded discrete physical-style transient, all 14 use two procedural noise layers. The 14/14 strict MP3 decoder+hash check, 14/14 real spectral tests and all 91 cross-track spectral contrasts passed before this audit, e.g. [last strict signal CI #41207469186](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41207469186). No inferred “art approved.”
- **2 retained earlier** 72-second interior preview MP3s, original from [source run #41198262753, artifact #13040829187](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41198262753/artifacts/13040829187). These are **superseded**, not two extra required scene sounds, by the later deeper recorded-source interior masters.
- **4 newer retained** 72-second preview MP3s (Highlands/Frontier outdoors, Signal Keep/Shrine interiors), produced in [#41207464084, artifact #13044742571](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41207464084/artifacts/13044742571). Independently verified the same exact recorded hashes against local downloaded final archives. They are **current studio candidates**, still out of playable assets. 4 × 1,158,381 = 4,633,524 encoded bytes. Four simultaneous 72-second decoded mono float32 buffers would cost about 36.86 MB before score/other effects. The two older proofs add another 2,316,762 bytes in *archives only*, not in a future game bundle.
- **Many exploratory versions** existed during technical iteration: earlier 24-second interiors, first 72-second low-level interiors, first/second four-scene rebalance/peak/loop QA tries and failed-no-artifact builds. They are **not** all individually retained or certified; the issue/Actions run histories preserve reasons for rejection. It would be false to claim every transient render was artistically checked. Only the six *retained final output identities above* are claimed to have individually reopened real MP3 proof, and all six are still **not heard by a listener**.
- **19 scenes are contexts, not 19 distinct registered files.** Two of them (Vale and Marches) have a day/night split, all four Treasuries currently share the same `env-home` recording, and some side dungeons reuse main-dungeon beds. The full game-specific mapping is below. Verify against [actual production manifest](../assets/audio/manifest.json), [source book](../tools/audio/environment-book.json), and [repeatable inventory test](../tests/environment-audio-inventory.test.cjs).

## 14 original physically present sounds — none replaced

| Exact audio identity | All existing uses | Source-book content | QA/delivery status |
| --- | --- | --- | --- |
| `env-woodland-day` | Greenwood Vale | 0 authored detail group(s) | **Original** — SHA-256, decode and spectral analysis verified; artistic GO not established |
| `env-woodland-night` | Greenwood Vale (night) | 0 authored detail group(s) | **Original** — SHA-256, decode and spectral analysis verified; artistic GO not established |
| `env-marsh-day` | Flooded Marches | 1 authored detail group(s) | **Original** — SHA-256, decode and spectral analysis verified; artistic GO not established |
| `env-marsh-night` | Flooded Marches (night) | 1 authored detail group(s) | **Original** — SHA-256, decode and spectral analysis verified; artistic GO not established |
| `env-highland-wind` | Ironroot Highlands | 0 authored detail group(s) | **Original** — SHA-256, decode and spectral analysis verified; artistic GO not established |
| `env-frontier-air` | Ashen Frontier | 0 authored detail group(s) | **Original** — SHA-256, decode and spectral analysis verified; artistic GO not established |
| `env-crown-courtyard` | Dark Crown | 0 authored detail group(s) | **Original** — SHA-256, decode and spectral analysis verified; artistic GO not established |
| `env-home` | Vale Treasury; Marches Treasury; Highlands Treasury; Crown Treasury | 1 authored detail group(s) | **Original** — SHA-256, decode and spectral analysis verified; artistic GO not established |
| `env-retreat` | Forest Crypt; Ruined Shrine Barracks | 0 authored detail group(s) | **Original** — SHA-256, decode and spectral analysis verified; artistic GO not established |
| `env-archive` | Sunken Archive; Drowned Watchhouse | 1 authored detail group(s) | **Original** — SHA-256, decode and spectral analysis verified; artistic GO not established |
| `env-mine` | Colossus Mine; Ruined Foundry | 1 authored detail group(s) | **Original** — SHA-256, decode and spectral analysis verified; artistic GO not established |
| `env-dragon-hall` | Abyss Bastion | 0 authored detail group(s) | **Original** — SHA-256, decode and spectral analysis verified; artistic GO not established |
| `env-citadel` | Citadel of Ashes | 1 authored detail group(s) | **Original** — SHA-256, decode and spectral analysis verified; artistic GO not established |
| `env-cellar` | Old Orchard Cellars; Old Signal Keep | 1 authored detail group(s) | **Original** — SHA-256, decode and spectral analysis verified; artistic GO not established |

## 19 playable places — no locations silently omitted

| Game location | What PR #711 currently *would play* | Newly authored recording available? | Actual replacement status |
| --- | --- | --- | --- |
| Greenwood Vale | `env-woodland-day` / `env-woodland-night` at night | none | No replacement registered |
| Flooded Marches | `env-marsh-day` / `env-marsh-night` at night | none; day/night, coast/ferry identity still old | No replacement registered |
| Ironroot Highlands | `env-highland-wind` | `regional-ironroot-autumn` — studio-only | Candidate rendered, **not playing** |
| Ashen Frontier | `env-frontier-air` | `regional-frontier-recovery` — studio-only | Candidate rendered, **not playing** |
| Dark Crown | `env-crown-courtyard` | none | No replacement registered |
| Forest Crypt | `env-retreat` | none | No replacement registered |
| Sunken Archive | `env-archive` | none | No replacement registered |
| Colossus Mine | `env-mine` | none | No replacement registered |
| Abyss Bastion | `env-dragon-hall` | none | No replacement registered |
| Citadel of Ashes | `env-citadel` | none | No replacement registered |
| Vale Treasury | `env-home` | none; shared home | No replacement registered |
| Marches Treasury | `env-home` | none; shared home | No replacement registered |
| Highlands Treasury | `env-home` | none; shared home | No replacement registered |
| Crown Treasury | `env-home` | none; shared home | No replacement registered |
| Old Orchard Cellars | `env-cellar` | none | No replacement registered |
| Drowned Watchhouse | `env-archive` | none; Archive sound reused | No replacement registered |
| Old Signal Keep | `env-cellar` | `regional-signal-occupied` — studio-only | Candidate rendered, **not playing** |
| Ruined Shrine Barracks | `env-retreat` | `regional-shrine-occupied` — studio-only | Candidate rendered, **not playing** |
| Ruined Foundry | `env-mine` | none; Mine sound reused | No replacement registered |

**The Flooded Marches and other original sounds are intentionally preserved unless replaced later:** the game's existing wetland day and night recordings remain the *designated* Marches beds, and Drowned Watchhouse, Sunken Archive and Mirejaw's Treasury retain their present file mappings. The earlier audit noted that more regional differentiation *could* improve them, but **no newly authored replacement exists**, and the owner expressly did **not** request new tracks simply to fill perceived gaps. A missing new candidate is not authorization to silence, remove or require a replacement for any of the 15 other locations. Existing `env-archive`, `env-mine` and shared `env-home` are valid legacy choices pending any later explicitly scoped artistic review; passing route/codec checks still does not establish perceived audio beauty.

## Preserved runtime details and future artistic review (no silent subtraction)

The 14 MP3 catalog files are continuous *background beds*, not the complete environmental experience. `src/prototype/audio-production.js` also adds event-based synthesized details. The original **outdoor nighttime** behaviors have been restored on draft PR #711 after an **unauthorized #709 removal was discovered**:

- **Greenwood Vale, Ironroot Highlands, Ashen Frontier, Dark Crown:** keep the established sparse `ambience.insects` event and its three-tone synthesized fallback every eligible detail window if no recorded binding exists. All four retain their original nighttime behavior. No region-specific replacement insect recording has been produced.
- **Flooded Marches:** keep water/detail and its separate small night tone rather than substituting or deleting the whole wetland identity. Greenwood Vale daytime also retains its bird event/fallback.
- **Future quality backlog, not a required new deliverable:** the shared insect timbre may be generic relative to the different climates, especially Highlands, Frontier and Crown. Any geographically distinct fauna/night alternatives require a *specific later creative decision, approved/source-grounded replacement, actual mix review and updated tests* before removal of existing sound. Until then the old detail is preserved **even if we think we could author something nicer**.
- **Why the correction matters:** the earlier source-level audit equated “generic” with “should be removed,” which crossed creative authority. A better audit reports that concern without changing live content unless the owner approved a replacement. The updated `tests/audio-production.test.cjs` now checks both event routing and the true three-tone fallback for all four night regions.

The standing source-art/mix/loop/rights/traceability/approval standard and the documented defects/corrections learned from this series are in [Environmental sound — Continuing environmental sound-quality standard](AUDIO_ENVIRONMENT.md#continuing-environmental-sound-quality-standard--findings-from-709-31-october-2026). This inventory is the **ground-truth coverage ledger**; it is not authorization to erase elements or to generate extra recordings outside owner scope.

## All six retained candidate recordings — independent decoded-file audit

Methods: opened both preserved GitHub Actions ZIP archives locally, enforced exact MP3 name set and listed SHA-256 for each, decoded raw audio through `ffmpeg`, verified `ffprobe` **MP3 mono 32,000 Hz**, 72-second active loop after 150 ms guard, checked peaks, first/last 1-second RMS, seam samples, and 3 × 24-second cross-correlations to detect crude repetition. All six 72-second masters decode with 72.325-second guarded stream length and match the ledger's full SHA-256; no extra retained MP3 was present in those two final archive ZIPs. **No human heard any playback.**

| Candidate MP3 identity | Lineage | Actual verified SHA-256 | Encoded bytes | Audit conclusion |
| --- | --- | --- | ---: | --- |
| `side-highlands-signal-preview` | **SUPERSEDED early two-interior prototype** | `754e57e4063a7633d74ea2f564702a0101d04fb7967fa4886b0697fc0841c7a4` | 1,158,381 | archived MP3 decoded + hash verified, not for release |
| `side-frontier-shrine-preview` | **SUPERSEDED early two-interior prototype** | `0b40e333ba7b1637ca9e84e83bbd7ff3d508e5468abf5669bbf46152c4f14bae` | 1,158,381 | archived MP3 decoded + hash verified, not for release |
| `regional-ironroot-autumn` | **Current proposed scene-specific replacement** | `145e9f6b121aa5df8425c98b0261c61b993bfb35a5cae73bb0948e100d3ec261` | 1,158,381 | archived MP3 decoded + hash verified; artistic HOLD |
| `regional-frontier-recovery` | **Current proposed scene-specific replacement** | `cbb1bad2e2001de64010c651c398cdc85d2738c29f89d5ad6f3a216117053512` | 1,158,381 | archived MP3 decoded + hash verified; artistic HOLD |
| `regional-signal-occupied` | **Current proposed scene-specific replacement** | `04cd9a5345feea1dc5a912249a4c6adb80e12db39260a990b569518d62a4b3ca` | 1,158,381 | archived MP3 decoded + hash verified; artistic HOLD |
| `regional-shrine-occupied` | **Current proposed scene-specific replacement** | `d2aed039e4c7dbcb1b1b3eda188565d2336d00ede4e32b86bc01db42e7f7e037` | 1,158,381 | archived MP3 decoded + hash verified; artistic HOLD |

**Adversarial findings retained, with no hidden pass:** `regional-shrine-occupied` has a measured **+4.011 dB** first/last 1-second envelope mismatch (borderline), despite its sample seam being small; its quiet cutlery/wood source might be recognizable and anachronistic. The Signal Keep timber source is originally a **casket creak**, which is not architectural recording. Ironroot's original recording had large sharp isolated peaks, corrected via source-only peak shaping; possible audible pumping/artifacts remain untested. Frontier outdoor field ambience is recorded real wind, **not proof of active Emberwatch**; Highlands leaves are not Stonecross commerce. All four newer beds are ~1 dB quieter than their former regional baseline in source measurements while default soundtrack is already much louder, and actual post-music/warning audibility remains unknown. An exact true-peak number is not an artistic score. Other original environments have bass-heavy, generic/repeating textures. No new animal/weather/city/voice sound family was authored or should be implied.

## Critical responsibility and merge decision

**FAIL / NOT READY FOR MERGE AS ENVIRONMENT REPLACEMENT** until these concrete deficiencies are corrected:

1. **No production integration:** the four candidate MP3 binaries are GitHub workflow artifacts, not `assets/audio/ambience`. Current 14 originals remain; `src/prototype/audio-library.js`, source hashes, service worker, site package and routing do **not** refer to the new files. No tested new-buffer traversal/music/warning QA. Owner expects actual playable replacements.
2. **Only the four actually produced, newer candidates are intended replacements:** Vale day/night, Marches day/night, Dark Crown, five main dungeons, all four Treasuries and the other side interiors **retain existing environmental recordings**; no additional new source creation is mandated by this work. Exactly **15/19 locations** do not have new studio candidates; that is an **inventory fact, not itself a merger blocker**. The blocking delivery gap is that **0/4 existing new candidates** have been installed and verified in the game. Any future redesign of remaining locations is a *separate*, explicit scope governed by the environmental quality standard.
3. **Poor interim artistic substitution:** draft PR #711 currently redirects Signal Keep to generic low-end `env-cellar` and Shrine to `env-retreat` at existing low gains. This is *measured* worse versus music than prior outdoor routing, and should **not be the final product**. Replace with the intended authored interior masters after source and game-mix acceptance; otherwise remove the premature substitutions.
4. **Unverified artistic acceptability:** final listening, device translation, long-loop fatigue, actual warning intelligibility and full score/ambient balance must remain HOLD until real evaluation, not quietly downgraded to numerical proxy thresholds. Future soundtrack Phase 7/8/9 boundaries and owner-only final audition still apply.
5. **Traceability of prior attempts:** intermediate exploratory render artifacts are documented as failed/rejected/superseded, not quietly counted among accepted assets; the exact six archived final output identities are recorded. Maintain this table whenever adding/removing an environmental master. Source original creator/license attribution must accompany any eventual registered recording; no ‘original game procedural’ credit for imported CC0 source material.
6. **Tests must evolve honestly:** existing strict tests intentionally assert **14 24-second source-book-owned assets**; adding genuine replacements changes file identities, durations and license/creation methods. Update real decoding, playable browser loop-bound assertions, source-budget/cache and release/PWA fingerprint tests to the *new* catalog in the replacement PR. Do not simply weaken/remove assertions to manufacture green.

**Status summary:** original 14 physical tracks accounted for and source/signal checked **YES**; six retained candidate files physically audited for integrity **YES** (two superseded, four current); all 19 current game routes audited **YES**; original runtime night details preserved and regression protected **CODE UPDATED, CI PENDING**; every exploratory audio version artistically audited **NO**; four intended new files integrated/tested in playable game **NO**; the other 15 locations intentionally retain their existing audio **YES**; genuinely heard quality **NO**; merged/deployed **NO**.

This audit is meant to keep outstanding work explicit—not to transfer implementation or repeated debugging responsibility to the owner.
