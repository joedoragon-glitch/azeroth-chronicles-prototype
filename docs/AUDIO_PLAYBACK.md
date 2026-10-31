# Sound design and audio production — current game

## Current unmerged soundtrack scope — Phase 6 narrative work (31 October 2026)

**Supersedes this page's older Phase-3/4-blocked planning language as a CURRENT status statement, without altering its historical verification:** Phase 3 [#704](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/704) has eight authored source candidates; Phase 4 [#716](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/716) has 38; independently audited Phase 5 [#721](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/721) has 16; new draft Phase 6 [#724](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/724) authors the remaining title/defeat/finale scores. The earlier holds and older CI links below are historical evidence, not orders to restart phases. **None** of these 65 isolated candidates is published, registered, heard/artistically accepted or device verified. The original 18 Dark Crown files and all 83 live music IDs are unchanged; Phase 7 #699, Phase 8 and Phase 9 remain gated. See [Phase 6 critical review](AUDIO_PHASE6_CRITICAL_REVIEW.md).


**So I Became the Dark Lord's Problem** · Current-source and creative-contract check **30 October 2026** · **Documentation candidate, not a new audio build**. For exact published version see [Development state](DEVELOPMENT_STATE.md).

**Current status:** The live engine and original 83-music/14-ambience/30-effect catalog remain published; **no reconstructed soundtrack candidate is installed**. Eight primary themes in [draft #704](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/704) now preserve all eight historical opening motifs and are technically encoded/decoded in isolated stereo source QA ([exact head #41184695666](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41184695666), [render evidence](../tools/audio/phase3-stereo-render-evidence.json)); 55 pinned CC0 sources feed the isolated renderer. The successful encode and score checks **do not** certify natural timbre, good full-loop phrasing, expressive harmony or repeated-listening quality. **Historical Phase 3 checkpoint (superseded for scheduling): musical source REVISE and Phase 4 BLOCKED at that earlier date; actual heard quality remains UNVERIFIED.** The 18 Crown recordings remain protected. Draft soundtrack changes are **not merged, registered, deployed or device-verified**; owner first audition remains Phase9.

**Jump to:** [Sound in the game](#what-the-game-sounds-like) · [Regional music](#musical-identity-by-place) · [Playback](#how-sound-reacts-to-gameplay) · [Production](#how-to-create-or-change-a-sound) · [Listening and verification](#audition-validation-and-unfinished-acceptance) · [Technical owners](#technical-owners-and-reference-documents).

**Status distinction for the new artistic palette:** The [curated-source production guide](ARTISTIC_ASSET_WORKFLOW.md) and [Phase 3 recorded-instrument bank](../tools/audio/phase3-sample-bank.json) belong to the unmerged studio-work draft. They are now connected to an **isolated studio rendering candidate** only; they do **not** add music to the live game or prove heard quality. The published original sound catalog remains in place.

## Soundtrack source milestone versus currently playable audio (31 October 2026)

**Phase 4 of the separate 65-cue soundtrack rebuild is complete for source-authoring and isolated encoded-preview QA only**, following the independent [38-cue critique](AUDIO_PHASE4_CRITICAL_REVIEW.md) and [exact Phase 4 CI #41197631496](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41197631496). The permanent [music quality controls](../tools/audio/score-quality-controls.py) catch false inherited notes, complete copied additive leads, cloned score templates and decoded loop seams. The owner's final hearing stays in Phase 9; there has been no genuine audible QC, integrated playback, merge, deployment or device verification of the candidates. **This page's 83/127 registered-audio and current listening-room descriptions refer to the existing live game assets, not to Phase 3/4 draft compositions.** Do not imply the 38 new MP3 previews are playable in the game. The subsequent **16-boss/TRUE-cue Phase 5** is documented in draft [#721](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/721); it is not the next phase. The 18 original Crown music files remain frozen.

## What the game sounds like

The score is **original, warm-fantasy instrumental music**, composed and rendered from the project's own recipes. Flutes, plucked strings, piano, cello, horns, bells, bowed layers and restrained percussion distinguish locations without burying combat and interface sounds. These aren't licensed commercial soundtrack recordings or live orchestral performances.

The **current production manifest** [`assets/audio/manifest.json`](../assets/audio/manifest.json) contains:

| Registered audio | Count | Role |
| --- | ---: | --- |
| **Music** | **83** | Five outdoor regions, main dungeons, quieter interiors, situation variants, boss and TRUE-form themes, title/defeat/finale |
| **Environmental recordings** | **14** | Woodland, marsh, wind, interior, mine and other background textures |
| **Recorded effects** | **30** | Action and interface sounds, alongside retained synthesized effects |
| **Total** | **127** | Local catalog with source paths, credits, hashes and routing |

The soundtrack is mapped across **19 places** (five regions, five main dungeons, four treasuries and five side interiors). **Eleven boss families** have their own music and normal/TRUE arrangements. The 127 figure is a **registered asset count**, not proof that every gameplay action produces a distinct recording or every mix has been approved on physical devices.

## Musical identity by place

The **currently registered old recordings** use the names/instruments below. These are historical catalog descriptions, **not yet the approved 65-cue rebuilt score**. The [26-family canon sound bible](AUDIO_SOUND_PASS.md#approved-phase-1-sound-bible--26-musical-identities--65-cues) sets the new composition direction. The Dark Crown and Citadel rows remain **unmodified deferred placeholders**:

| Location | Music and atmosphere |
| --- | --- |
| Greenwood Vale | **Orchard Roads** — flute, harp and a welcoming woodland character |
| Flooded Marches | **Reedwater** — piano, bells and uncertain marsh colors |
| Ironroot Highlands | **Payday on the Ridge** — horn and dulcimer |
| Ashen Frontier | **Embers Still Warm** — cello and guitar |
| Dark Crown | **Roads Beneath the Banner** — restrained minor cello/piano |
| Forest Crypt | **The Unfinished Retreat** — a former companion's still-unfinished winter estate and complex work crews |
| Sunken Archive | **Restoration After Rain** — delicate, working restoration |
| Colossus Mine | **Veins and Old Stone** — measured labor and deep stone |
| Abyss Bastion | **Purple Wings** — the Dark Lord's dragon project |
| Citadel of Ashes | **The Machinery of Rule** — controlled, formal power |

The five outdoor regions each have night and near-refuge settlement arrangements in the registered original catalog. Regions and main dungeons use synchronized **base and combat layers**; interior locations have local identities and **global post-ending peace** versions. In the current composition cycle, **four outdoor region families, four main dungeons, seven smaller interiors and eight boss families** are included; the fifth-region Crown families stay untouched. Boss families and TRUE forms use their real encounter identities rather than a generic boss track. Exact cue names, instrument recipes, tempos and gains belong to the [score book](../tools/audio/score-book.json) and [production manifest](../assets/audio/manifest.json). The [living soundtrack and sound-identity guide](AUDIO_SOUND_PASS.md) explains the current cue families, artistic rationale and reusable creative briefs. The v0.8.90 predecessor remains preserved in Git history.

## Approved music scope and future Dark Crown integration

The current [83-ID music director](../assets/audio/manifest.json) stays active so existing saves and scenes do not lose sounds. The [source-based Phase 0A audit and owner decisions](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/673) define **65 replacement/creative candidates**: four outdoor families × five cues (20), four dungeons × three (12), seven Treasuries/side interiors × two (14), eight bosses × normal/TRUE (16), and three narrative cues (3). **The 18 existing Crown-associated cues in seven families stay unchanged, registered and playable** during this project. The 14 environmental beds and 30 one-shot effects remain out of this music-completion scope.

**Dark Crown is an extension seam, not discarded work.** Its seven reserved musical identities—Crown outdoors, Citadel of Ashes, Cindermaw's Treasury, Ruined Foundry, Veyra/Ash Sentinel, Cindermaw and Dark Lord—will receive a **focused future symphonic treatment after the owner finishes the fifth region's worldbuilding**. This composition phase should reuse the same musical production toolkit, source-controlled cue recipes and audio contracts, permit a partial render that preserves unchanged Crown asset hashes, and preserve enough budget/instrumental/motivic flexibility to integrate the new fifth region without rewriting the finished 65 cues by default. The prior owner choice for a subtle *former-companions leitmotif* and a title/finale thematic transformation are optional bridges; **they do not authorize composing Crown lore or a Dark Lord theme early**. See the future [Crown extension contract in #673](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/673).

**State semantics:** A `peace-*` cue does **not** start after a single region boss falls. Game `peace` is the global post-throne ending state, requiring the qualifying TRUE Dark Lord, throne claim and five dungeon TRUE victories. The `finale` special is a bounded event in that global state, and the owner selected **fragile relief with remaining uncertainty** for global-peace music. In outdoor non-peace scenes, near-rest refuge settlement takes precedence over night; additive combat and TRUE layers must remain aligned to their base. All retained old recordings still play until authorized replacements are actually produced.

## How sound reacts to gameplay

- **Exploration and combat:** Scene and place select the score. Combat increases a synchronized action layer without starting the tune over, then recedes after fighting. Bosses and TRUE forms use dedicated layers; transitions crossfade instead of piling tracks on top of one another.
- **Surroundings:** An independent environmental recording follows the region, interior and day/night context. Combat and boss activity lower its gain so danger signals remain audible. Optimization Mode can turn off optional ambience without changing game rules.
- **Movement, attacks and menus:** Footsteps reflect actual hero movement and surface type. Enemy warnings, hero/companion actions and interface choices use recorded or synthesized effects with timing and priority limits. Menus soften music/ambience, suppress world effects and keep interface feedback audible.
- **Starting, pausing and fallback:** Browser sound requires an eligible user gesture to unlock. Pause/background suspends the audio context. Local files are precached for offline-ready use; if a recording fails to load or decode, its procedural fallback remains available. Recorded music/environment use bounded retries, not perpetual per-frame restarts.
- **Mixes and sliders:** **Game and settings → Sound settings** provides Master, Music, Ambience, Effects and Interface volume controls plus mute. The built-in phone profile reduces masking and centers recorded panning; it's a listening policy, **not proof of real-phone mastering**.

The released code includes the [first-gesture/recovery repair #470](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/470), [ranged-pet impact routing #472](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/472), and earlier [audio preparation #473](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/473). All three are **merged**, not future Stage 2/3 work orders.

## How to create or change a sound

**Production authority:** [`assets/audio/manifest.json`](../assets/audio/manifest.json) defines the active audio IDs, files, music locations, boss cues, effects, gains and credits. The game loads the generated [`audio-library.js`](../src/prototype/audio-library.js); **don't hand-edit the generated file**.

1. **Read the game story, actual cue route and the approved creative identity first.** For the current 65-ID composition project, use the [26-family sound bible](AUDIO_SOUND_PASS.md) and [#673](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/673), not old soundtrack adjectives as canon. Internal production audio listening is the engineering team's responsibility where verified playback is available; **never demand the owner auditions unfinished music or plays through the campaign**.
2. **Edit the correct creative source.** Music comes from [`score-book.json`](../tools/audio/score-book.json) and [`render-score.py`](../tools/audio/render-score.py). Environment beds come from [`environment-book.json`](../tools/audio/environment-book.json) / [`render-environment.py`](../tools/audio/render-environment.py); effects from [`sfx-book.json`](../tools/audio/sfx-book.json) / [`render-sfx.py`](../tools/audio/render-sfx.py). Third-party/imported approved recordings go beneath `assets/audio/` with honest author/license information.
3. **Keep the contract consistent.** Reuse stable IDs if replacing a sound, keep location/boss/event mappings correct, and ensure synchronized stem loops share compatible tempo and duration. The [authoring guide](AUDIO_AUTHORING.md) explains render/register/bind commands, safe replacements, and manifest regeneration.
4. **Verify the candidate internally without involving the owner.** Run `npm run audio:check`, affected tests and relevant packaging/browser checks according to the change. Use independently verified internal playback if available to check warning intelligibility, transitions and levels; **record any unperformed listening honestly**. Updating descriptions alone does not generate new sound; hashes and waveforms do not demonstrate artistic quality.
5. **Release only by the normal authorized process.** Asset changes need consistent manifest hashes, generated resources, version and offline cache. Keep candidate sounds on their branch until approved; do not revive an old Stage 5 checklist or run the full browser suite merely because this document was refreshed.

**Technical limits worth knowing (published dev.242 / PR #712):** The recording system verifies SHA-256 file hashes and restricted local paths. Live main provides a **96 MiB default decoded-audio cache** (192 MiB maximum explicit override), **256 MiB encoded catalog / 16 MiB per-file limit**, and **64-source ceiling** that reserves priority for critical warnings and interface effects. Assets load/decode lazily, playing loops remain pinned, and transitions free resources. These **are source policies**, not measurements of actual Chromebook/iPhone CPU, RAM or loudness.

## Soundtrack listening room — practical guide

The [soundtrack listening room](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/audio/index.html) is a **separate, read-only player**. Its historical production-first interface was published in `dev.210` ([Pages run #40769070733](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40769070733)); consult [Development state](DEVELOPMENT_STATE.md) for current publication status and verify the installed cache separately on each device.

In the revised interface:

1. **Hear a game scene:** choose a place, an appropriate situation (exploration, combat, settlement, night or liberated world), or a boss and Normal/TRUE form, then press **Play this scene**. The same registered source music, synchronized action/TRUE layers and environmental rules are used without starting a saved campaign. The main title, defeat and finale are available under *Other game moments*.
2. **Browse individual recordings:** filter the full catalog by **83 music tracks**, **14 environmental beds** or **30 sound effects**; search by name or stable ID, inspect the recording, then press **Play selected recording**. This plays a file by itself, which is different from the combined scene soundtrack. Where appropriate, **Play with paired layer** auditions the music together with its synchronized combat/TRUE part.
3. **Reuse a creative brief:** the selected production asset displays its natural-language guide and exact recipe owner. **Copy creative brief** copies text for a composer or later development session; it does not change or regenerate audio.
4. **Optional advanced tools:** expand **Advanced listening tools** for temporary volume/mix adjustments, diagnostic test tones, musical-bar transition timing, waveform measurements, live engineering data and a downloadable local JSON report. These are troubleshooting and sound-production aids, **not a sound-quality score or public feedback submission**.

Audio begins only after the user chooses to play something. **Pause** and **Stop audio** appear near the top, rather than hiding among diagnostics. No campaign saves or local game preferences are read or written by the standalone room. **Current main has a known separate standalone browser bootstrap omission** ([#647](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/647), [unmerged draft fix #650](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/650)); this **must be repaired and certified in Phase 8 after the 65 songs are finished**, against the exact final candidate, not an old Pages snapshot. Older dedicated Chromium desktop/phone, decoded-recording, and offline-reopen checks passed for a then-current candidate ([evidence #40761403220](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40761403220)), but real-device listening remains unverified. Focused source/build checks alone cannot certify perceived sound quality or hardware behavior.

For creative decisions about *why* each composition exists, see [Soundtrack and sound identity](AUDIO_SOUND_PASS.md); for adding, replacing or regenerating a file, see [Audio authoring](AUDIO_AUTHORING.md).

## Audition, validation and unfinished acceptance

The [independent audition room](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/audio/index.html) is intended to let users compare scores, individual cues, boss normal/TRUE combinations and reference mixes without touching the playable campaign's saves. **The current standalone implementation is not certified for the new music candidate; defer its repair/complete certification until Phase 8**, immediately before the owner's Phase 9 listening session. The final 65 included cues must be navigable without playing the game; the 18 registered deferred Crown cues must be visibly marked as *old placeholders, not newly accepted*. No public deployment or installed-phone claim is authorized by documentary changes.

**Verified by source comparison for this Phase 1 documentation candidate:** the current audio runtime supports contextual selections and the catalog retains 127 IDs; the source and lore audit and 14 owner choices are recorded in #673. **No replacement music has yet been generated, no new audio regression has been run in this documentary update, and no current listening-room device certification is claimed.** Earlier playback PRs #470/#472/#473 are merged. The exact public build and focused Pages evidence are in [Development state](DEVELOPMENT_STATE.md). Historic [25 October Stage 5 preflight](AUDIO_STAGE5_RELEASE_PREFLIGHT_20261025.md) describes a **then-blocked standalone candidate**, not the present deployment or automatic authorization for further production.

**Still requiring direct evidence:** perceived balance and speaker/headphone comfort on physical devices; warning audibility in crowded fights; every boss/TRUE/music transition in context; fresh install and offline reopen on relevant phones; sustained listening/performance behavior. Focused CI, file counts and synthetic audio tests cannot certify those experiences. Treat problems as scoped testing/creative decisions, **not an automatic new optimization project**.

## Technical owners and reference documents

| What you need | Source |
| --- | --- |
| Live cue inventory, credits and event/scene mapping | [Audio manifest](../assets/audio/manifest.json) |
| Composer recipes and artistic rationale | [Score book](../tools/audio/score-book.json), [living soundtrack design guide](AUDIO_SOUND_PASS.md) |
| Rendering, importing, registration and release steps | [Audio authoring](AUDIO_AUTHORING.md) |
| Environmental cue selection | [Environment reference](AUDIO_ENVIRONMENT.md), [`audio-environment.js`](../src/prototype/audio-environment.js) |
| Combat music selection and stem intensity | [`audio-production.js`](../src/prototype/audio-production.js) |
| Runtime, recorded transport and mix | [`audio.js`](../src/prototype/audio.js), [`audio-runtime.js`](../src/prototype/audio-runtime.js), [`audio-recordings.js`](../src/prototype/audio-recordings.js), [`audio-mixer.js`](../src/prototype/audio-mixer.js) |
| Build, release and device evidence | [Development state](DEVELOPMENT_STATE.md) |

**Historical specification:** The earlier [v0.8.89 recorded playback and audition document](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/3765ed3bbbf67385561ba47b46887eda6ccf3e7c/docs/AUDIO_PLAYBACK.md) preserves the old API details, original empty-library phase and then-planned soundtrack pilot. It is **not** the current sound-production status.
