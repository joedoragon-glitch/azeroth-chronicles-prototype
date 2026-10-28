# Sound design and audio production — current game

**So I Became the Dark Lord's Problem** · Source checked **28 October 2026** · Playable build **`0.9.1+snapshot.dev.208`**

**Current status:** The contextual soundtrack, environmental sound, recorded effects, menu feedback and audio audition room are **implemented**. The earlier v0.8.89 plan to create a recorded-playback engine and begin a soundtrack pilot is **historical, not pending work**. Published code and automated checks do not establish that all music, speakers/headphones, boss transitions or installed offline sessions have passed final listening acceptance.

**Jump to:** [Sound in the game](#what-the-game-sounds-like) · [Regional music](#musical-identity-by-place) · [Playback](#how-sound-reacts-to-gameplay) · [Production](#how-to-create-or-change-a-sound) · [Listening and verification](#audition-validation-and-unfinished-acceptance) · [Technical owners](#technical-owners-and-reference-documents).

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

The existing theme names and original musical directions are:

| Location | Music and atmosphere |
| --- | --- |
| Greenwood Vale | **Orchard Roads** — flute, harp and a welcoming woodland character |
| Mirefen Marches | **Reedwater** — piano, bells and uncertain marsh colors |
| Ironroot Highlands | **Payday on the Ridge** — horn and dulcimer |
| Ashen Frontier | **Embers Still Warm** — cello and guitar |
| Crown Province | **Roads Beneath the Banner** — restrained minor cello/piano |
| Forest Crypt | **The Unfinished Retreat** — the caretaker's abandoned retreat |
| Sunken Archive | **Restoration After Rain** — delicate, working restoration |
| Colossus Mine | **Veins and Old Stone** — measured labor and deep stone |
| Abyss Bastion | **Purple Wings** — the Dark Lord's dragon project |
| Crown Citadel | **The Machinery of Rule** — controlled, formal power |

The five outdoor regions each have night and settlement arrangements. Regions and main dungeons use synchronized **base and combat layers**; interior locations have quieter themes and peaceful versions. Boss families and TRUE forms use their real encounter identities rather than a generic boss track. Exact cue names, instrument recipes, tempos and gains belong to the [score book](../tools/audio/score-book.json) and [production manifest](../assets/audio/manifest.json). The [living soundtrack and sound-identity guide](AUDIO_SOUND_PASS.md) explains the current cue families, artistic rationale and reusable creative briefs. The v0.8.90 predecessor remains preserved in Git history.

## How sound reacts to gameplay

- **Exploration and combat:** Scene and place select the score. Combat increases a synchronized action layer without starting the tune over, then recedes after fighting. Bosses and TRUE forms use dedicated layers; transitions crossfade instead of piling tracks on top of one another.
- **Surroundings:** An independent environmental recording follows the region, interior and day/night context. Combat and boss activity lower its gain so danger signals remain audible. Optimization Mode can turn off optional ambience without changing game rules.
- **Movement, attacks and menus:** Footsteps reflect actual hero movement and surface type. Enemy warnings, hero/companion actions and interface choices use recorded or synthesized effects with timing and priority limits. Menus soften music/ambience, suppress world effects and keep interface feedback audible.
- **Starting, pausing and fallback:** Browser sound requires an eligible user gesture to unlock. Pause/background suspends the audio context. Local files are precached for offline-ready use; if a recording fails to load or decode, its procedural fallback remains available. Recorded music/environment use bounded retries, not perpetual per-frame restarts.
- **Mixes and sliders:** **Game and settings → Sound settings** provides Master, Music, Ambience, Effects and Interface volume controls plus mute. The built-in phone profile reduces masking and centers recorded panning; it's a listening policy, **not proof of real-phone mastering**.

The released code includes the [first-gesture/recovery repair #470](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/470), [ranged-pet impact routing #472](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/472), and earlier [audio preparation #473](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/473). All three are **merged**, not future Stage 2/3 work orders.

## How to create or change a sound

**Production authority:** [`assets/audio/manifest.json`](../assets/audio/manifest.json) defines the active audio IDs, files, music locations, boss cues, effects, gains and credits. The game loads the generated [`audio-library.js`](../src/prototype/audio-library.js); **don't hand-edit the generated file**.

1. **Listen first and identify the exact need.** Use the [audio audition room](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/audio/index.html) to compare the actual region/boss and existing recording against the original sound. Decide whether this is composition, environment, an effect, a missing event binding or mixing before creating another asset.
2. **Edit the correct creative source.** Music comes from [`score-book.json`](../tools/audio/score-book.json) and [`render-score.py`](../tools/audio/render-score.py). Environment beds come from [`environment-book.json`](../tools/audio/environment-book.json) / [`render-environment.py`](../tools/audio/render-environment.py); effects from [`sfx-book.json`](../tools/audio/sfx-book.json) / [`render-sfx.py`](../tools/audio/render-sfx.py). Third-party/imported approved recordings go beneath `assets/audio/` with honest author/license information.
3. **Keep the contract consistent.** Reuse stable IDs if replacing a sound, keep location/boss/event mappings correct, and ensure synchronized stem loops share compatible tempo and duration. The [authoring guide](AUDIO_AUTHORING.md) explains render/register/bind commands, safe replacements, and manifest regeneration.
4. **Check the candidate, then listen in-game.** Run `npm run audio:check`, affected tests and relevant packaging/browser checks according to the change. Listen for warning intelligibility, starts/stops, boss changes, menu transitions and levels. Updating descriptions alone does not generate new sound; waveform or checksum checks do not demonstrate good music.
5. **Release only by the normal authorized process.** Asset changes need consistent manifest hashes, generated resources, version and offline cache. Keep candidate sounds on their branch until approved; do not revive an old Stage 5 checklist or run the full browser suite merely because this document was refreshed.

**Technical limits worth knowing:** The recording system verifies SHA-256 file hashes and restricted local paths. Its design includes a **32 MiB default decoded-audio cache**, **32 MiB encoded catalog / 8 MiB per-file limit**, and **64-source ceiling** that reserves priority for critical warnings and interface effects. Assets load/decode lazily, playing loops remain pinned, and transitions free resources. These **are source policies**, not measurements of actual Chromebook/iPhone CPU, RAM or loudness.

## Soundtrack listening room — practical guide

The [soundtrack listening room](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/audio/index.html) is a **separate, read-only player**. Its revised production-first interface is published in `dev.210` ([Pages run #40769070733](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40769070733)); consult [Development state](DEVELOPMENT_STATE.md) for current publication status and verify the installed cache separately on each device.

In the revised interface:

1. **Hear a game scene:** choose a place, an appropriate situation (exploration, combat, settlement, night or liberated world), or a boss and Normal/TRUE form, then press **Play this scene**. The same registered source music, synchronized action/TRUE layers and environmental rules are used without starting a saved campaign. The main title, defeat and finale are available under *Other game moments*.
2. **Browse individual recordings:** filter the full catalog by **83 music tracks**, **14 environmental beds** or **30 sound effects**; search by name or stable ID, inspect the recording, then press **Play selected recording**. This plays a file by itself, which is different from the combined scene soundtrack. Where appropriate, **Play with paired layer** auditions the music together with its synchronized combat/TRUE part.
3. **Reuse a creative brief:** the selected production asset displays its natural-language guide and exact recipe owner. **Copy creative brief** copies text for a composer or later development session; it does not change or regenerate audio.
4. **Optional advanced tools:** expand **Advanced listening tools** for temporary volume/mix adjustments, diagnostic test tones, musical-bar transition timing, waveform measurements, live engineering data and a downloadable local JSON report. These are troubleshooting and sound-production aids, **not a sound-quality score or public feedback submission**.

Audio begins only after the user chooses to play something. **Pause** and **Stop audio** appear near the top, rather than hiding among diagnostics. No campaign saves or local game preferences are read or written by the standalone room. The page is designed for desktop and phone. Dedicated Chromium desktop/phone, decoded-recording, and offline-reopen acceptance has passed for the candidate ([evidence #40761403220](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40761403220)), but real-device listening remains unverified. Focused source/build checks alone cannot certify perceived sound quality or hardware behavior.

For creative decisions about *why* each composition exists, see [Soundtrack and sound identity](AUDIO_SOUND_PASS.md); for adding, replacing or regenerating a file, see [Audio authoring](AUDIO_AUTHORING.md).

## Audition, validation and unfinished acceptance

The [independent audition room](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/audio/index.html) lets developers and the owner compare scores, individual cues, bosses, reference/quiet/phone mixes and local audio measurements. It does **not** read or write the playable campaign's saves.

**Verified for this documentation update:** the active source enables production audio, the manifest contains the 127 registered assets and present-day scene/event policies, and #470/#472/#473 were merged. The exact public build and focused Pages evidence are in [Development state](DEVELOPMENT_STATE.md). Historic [25 October Stage 5 preflight](AUDIO_STAGE5_RELEASE_PREFLIGHT_20261025.md) describes a **then-blocked standalone candidate**, not the present deployment or automatic authorization for further production.

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
