# Soundtrack and sound identity — living creative reference

**So I Became the Dark Lord's Problem** · Creative/reference source check: **28 October 2026** · Catalog checkpoint: public game **0.9.1+snapshot.dev.208**.

**Purpose:** Explain the musical intentions of the existing soundtrack and preserve usable creative briefs for any later remix, regeneration, composer handoff, sound replacement, or expansion. **This is a living design guide, not a v0.8.90 release checklist.** For which build is live, consult [Development state](DEVELOPMENT_STATE.md), not this page.

The original [24 October v0.8.90 sound pass](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/3765ed3bbbf67385561ba47b46887eda6ccf3e7c/docs/AUDIO_SOUND_PASS.md) remains available verbatim in Git history. Its named place identities, original-instrument approach and creative context inform this guide; its dated test and deployment claims do **not** apply to current builds.

## What is authoritative, and what is interpretive?

- **Exact notes, melodies, tempo, mode, instrument recipes and synchronized-layer structure:** [Original score book](../tools/audio/score-book.json), rendered through [render-score.py](../tools/audio/render-score.py).
- **Currently registered files, playable titles, reusable natural-language generation briefs, routing, author/credit metadata and content hashes:** [Audio manifest](../assets/audio/manifest.json).
- **Environmental textures:** [environment book](../tools/audio/environment-book.json). **Recorded one-shot effects:** [SFX book](../tools/audio/sfx-book.json). Both have separate synthesis owners.
- **How to produce, register, test and publish sounds:** [Audio authoring](AUDIO_AUTHORING.md). **How the live mixer, scene director and playback work:** [Current sound production](AUDIO_PLAYBACK.md).
- **How it actually sounds:** [Audio audition room](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/audio/index.html), followed by in-game listening. A written brief is not a substitute for hearing it.

**Evidence boundary:** Titles, IDs, modes, beats per minute (BPM), lead instruments and cue relationships below come from the current recipe/catalog. Descriptive phrases under *creative intent* retain the old sound-pass concepts or offer **editorial listening guidance**, not a newly approved lore or composition mandate. Do not treat a generated metadata guide as the literal historical prompt that created a recording: the recorded assets were composed/rendered by the project's original deterministic tools; these English briefs were written afterward to help reproduce their intent.

## Overall musical language

The score uses original, warm-fantasy **instrumental** compositions, not licensed tracks, commercial samples, AI-generated recordings or full orchestral performances. Its recurring vocabulary includes flute, harp/plucked strings, piano, cello, horn, bells, bowed layers, dulcimer/guitar colors and deliberately restrained percussion. Original cues use developed eight-bar loops with melodic phrases and cadences.

The design challenge is **contrast with continuity**: a peaceful settlement should feel inhabited, a dangerous crossing should remain recognizably part of its region, and a boss should have an individual identity rather than the same generic loud track everywhere. Music must leave room for combat warnings, speech-free interface feedback and environmental sounds. Darkness and danger are present without demanding constant grim or maximal instrumentation.

The system commonly treats music as a *family* rather than separate unrelated songs: exploration/base, synchronized encounter action, calmer post-liberation arrangements; daytime/night/settlement colors outdoors; dedicated boss with a compatible TRUE layer. A future replacement should preserve that musical relationship unless the owner explicitly approves a new direction.

## The ten principal place identities

Each row gives the actual **base** cue, its source-derived musical palette, and the existing creative idea to protect. All ten places have separate base/encounter/after-liberation recordings at the same BPM; the related cue IDs are in the next section.

| Place | Existing theme | Source palette | Creative intent / listening guardrail |
| --- | --- | --- | --- |
| Greenwood Vale | **Orchard Roads** (`place-vale`) | 92 BPM · major · flute + harp | Welcoming woodland roads and inhabited countryside; preserve the flute-and-harp warmth rather than treating the first region as a generic battlefield. |
| Mirefen Marches | **Reedwater** (`place-march`) | 82 BPM · dorian · piano + bell | Uncertain wetland atmosphere; the Dorian piano/bell palette should be recognizable even when tension increases. |
| Ironroot Highlands | **Payday on the Ridge** (`place-highlands`) | 88 BPM · mixolydian · horn + dulcimer | Work, stone and exposed ridges; horn and dulcimer distinguish this from both marsh and fortress music. |
| Ashen Frontier | **Embers Still Warm** (`place-frontier`) | 96 BPM · dorian · cello + guitar | Scorched territory without constant maximal bombast; the cello/guitar combination keeps human warmth amid damage. |
| Crown Province | **Roads Beneath the Banner** (`place-crown`) | 84 BPM · minor · cello + piano | The weight of occupied authority; restrained minor cello/piano rather than a triumphal palace fanfare. |
| Forest Crypt | **The Unfinished Retreat** (`place-crypt`) | 84 BPM · dorian · cello + harp | A caretaker's unfinished seasonal retreat; preserve the sense of a place with personal history, not merely an anonymous haunted crypt. |
| Sunken Archive | **Restoration After Rain** (`place-archive`) | 86 BPM · dorian · piano + bell | A place of scholarship and restoration; piano and bells should leave room for quiet concentration rather than only watery horror. |
| Colossus Mine | **Veins and Old Stone** (`place-mine`) | 96 BPM · minor · horn + dulcimer | Deep stone and steady labor; horn and dulcimer carry a physical, worklike rhythm. |
| Abyss Bastion | **Purple Wings** (`place-abyss`) | 96 BPM · minor · horn + harp | The Dark Lord's personal dragon and flight project; the horn/harp combination should distinguish it from a generic infernal dungeon. |
| Crown Citadel | **The Machinery of Rule** (`place-citadel`) | 88 BPM · minor · cello + piano | Controlled, formal machinery of rule; measured cello/piano tension instead of indiscriminate orchestral chaos. |

These named identities were already part of the historical sound pass. This document does not authorize a new musical direction; it makes the old rationale easier to use alongside today's real cue recipes.

## Regional and dungeon variations: 30 music files

For the five outdoor regions and five main dungeons, the three source IDs follow the same scheme. The encounter cue is a **rhythmic/additive layer** aligned to the base track, not necessarily a different full composition; the after-liberation cue is a gentler alternative.

| Location | Base / encounter / after liberation |
| --- | --- |
| Greenwood Vale | `place-vale` / `action-vale` / `peace-vale` |
| Mirefen Marches | `place-march` / `action-march` / `peace-march` |
| Ironroot Highlands | `place-highlands` / `action-highlands` / `peace-highlands` |
| Ashen Frontier | `place-frontier` / `action-frontier` / `peace-frontier` |
| Crown Province | `place-crown` / `action-crown` / `peace-crown` |
| Forest Crypt | `place-crypt` / `action-crypt` / `peace-crypt` |
| Sunken Archive | `place-archive` / `action-archive` / `peace-archive` |
| Colossus Mine | `place-mine` / `action-mine` / `peace-mine` |
| Abyss Bastion | `place-abyss` / `action-abyss` / `peace-abyss` |
| Crown Citadel | `place-citadel` / `action-citadel` / `peace-citadel` |

**Outdoor extensions (10 files):** the outdoor regions also have a quieter settlement arrangement and a nighttime version. These are additional contextual variants, not new regions.

| Region | Settlement cue | Night cue |
| --- | --- |
| Greenwood Vale | `settlement-vale` — Orchard Roads — hearths and neighbors | `night-vale` — Orchard Roads — nightfall |
| Mirefen Marches | `settlement-march` — Reedwater — hearths and neighbors | `night-march` — Reedwater — nightfall |
| Ironroot Highlands | `settlement-highlands` — Payday on the Ridge — hearths and neighbors | `night-highlands` — Payday on the Ridge — nightfall |
| Ashen Frontier | `settlement-frontier` — Embers Still Warm — hearths and neighbors | `night-frontier` — Embers Still Warm — nightfall |
| Crown Province | `settlement-crown` — Roads Beneath the Banner — hearths and neighbors | `night-crown` — Roads Beneath the Banner — nightfall |

**When reworking a family:** keep the region's signature lead/texture recognizable. Inspect the exact recipe rather than assuming every variation shares identical orchestration. In particular, the after-liberation variants often switch from modal/minor tension into major harmony, with a softer piano, flute and/or harp emphasis. Encounter layers need exact synchronized timing/tempo with their base to prevent flams and drifting loops. Test entry, combat rise/release, night/settlement transitions and post-liberation states by listening in the game.

## Treasuries and side interiors: 18 music files

These are deliberately **smaller-scale arrangements** for places that need an identity without competing with the outdoor score. Each has an existing base and after-liberation alternative.

| Interior | Base recording | After liberation | Existing palette |
| --- | --- | --- | --- |
| Thornfang's Treasury | `interior-supply-vale` | `peace-interior-supply-vale` | 92 BPM · dorian · piano + harp |
| Mirejaw's Treasury | `interior-supply-march` | `peace-interior-supply-march` | 82 BPM · dorian · piano + bell |
| Ridge Tyrant's Treasury | `interior-supply-highlands` | `peace-interior-supply-highlands` | 88 BPM · dorian · piano + dulcimer |
| Cindermaw's Treasury | `interior-supply-crown` | `peace-interior-supply-crown` | 84 BPM · dorian · piano + piano |
| Old Orchard Cellars | `interior-side-vale-cellars` | `peace-interior-side-vale-cellars` | 92 BPM · minor · cello + harp |
| Drowned Watchhouse | `interior-side-march-watchhouse` | `peace-interior-side-march-watchhouse` | 82 BPM · minor · cello + bell |
| Old Signal Keep | `interior-side-highlands-signal` | `peace-interior-side-highlands-signal` | 88 BPM · minor · cello + dulcimer |
| Ruined Shrine | `interior-side-frontier-shrine` | `peace-interior-side-frontier-shrine` | 96 BPM · minor · cello + guitar |
| Ruined Foundry | `interior-side-crown-foundry` | `peace-interior-side-crown-foundry` | 84 BPM · minor · cello + piano |

**Creative guardrail:** Treasuries are resting spaces, while old cellars, watchhouses, signal keeps, shrines and foundries have quieter, sometimes uneasy identities. Do not turn every interior into another outdoor battle loop. The peaceful variants should preserve recognition while signaling a different world state; their exact harmony, notes and titles remain in the score book.

## Eleven boss families: 22 music files

Each family has an actual base boss cue and a separate, **synchronized additive TRUE layer**. The TRUE track does not need to replace the boss's theme: it intensifies the same musical clock. These are **eleven families**, including the Dark Lord—not eleven additional independent TRUE bosses.

| Family | Existing title and pair of source IDs | Music palette | Dramatic identity to keep in view |
| --- | --- | --- | --- |
| thorn | **Thorn Underfoot** · `boss-thorn` / `boss-thorn-true` | 116 BPM · dorian · flute + guitar | Woodland predator encounter; keep its distinct identity within the Vale palette. |
| crypt | **Keeper of the Summer Keys** · `boss-crypt` / `boss-crypt-true` | 104 BPM · minor · cello + harp | The summer-keys caretaker encounter, related to the Crypt's remembered purpose. |
| mire | **Teeth Beneath the Reeds** · `boss-mire` / `boss-mire-true` | 108 BPM · dorian · cello + bell | Predator pressure under marsh reeds; retain the Dorian color. |
| archive | **The Scholar's Hook** · `boss-archive` / `boss-archive-true` | 108 BPM · minor · piano + bell | The Archive's scholar confrontation; preserve its piano/bell character. |
| ridge | **Master of Coin** · `boss-ridge` / `boss-ridge-true` | 108 BPM · minor · horn + dulcimer | An adversary associated with coin and authority in the Highlands. |
| mine | **The Mountain Remembers** · `boss-mine` / `boss-mine-true` | 100 BPM · minor · horn + dulcimer | The mountain confrontation, connected to the mine's heavy stone identity. |
| warlord | **Orders in the Ash** · `boss-warlord` / `boss-warlord-true` | 120 BPM · minor · horn + guitar | Ashen command and martial orders; the faster horn/guitar combination distinguishes the encounter. |
| abyss | **His Majesty's Wings** · `boss-abyss` / `boss-abyss-true` | 112 BPM · minor · horn + harp | Dragon-and-flight project confrontation; preserve the Abyss horn/harp signature. |
| citadel | **The Last Watch** · `boss-citadel` / `boss-citadel-true` | 108 BPM · minor · cello + bell | A final watch within the apparatus of rule; cello/bell rather than a generic boss cue. |
| cindermaw | **The Ember Maw** · `boss-cindermaw` / `boss-cindermaw-true` | 118 BPM · minor · cello + dulcimer | The named Ember Maw encounter; its own cello/dulcimer identity matters. |
| darklord | **Crown Without Horizon** · `boss-darklord` / `boss-darklord-true` | 104 BPM · minor · horn + piano | The Dark Lord's own theme and climax; its restrained horn/piano vocabulary is distinct from the other ten families. |

The titles and instrument/tempo fields are factual catalog entries. The last column is interpretive **review guidance**, not proof that the recording's composer used those exact words or that a new character backstory has been approved.

**TRUE-form replacement rule:** Match base/TRUE tempo, bar length, loop bounds and tonal/harmonic timing. Reinforce conflict without drowning out warnings or making the ordinary encounter inaudible. Compare both states at the same volume and on an actual device before approving a change.

## Main-menu, loss and ending: three music files

| Scene | Current cue | Production identity |
| --- | --- | --- |
| Title | `title` — **So I Became the Dark Lord's Problem** | 88 BPM · major · horn + harp; warm opening with a rising motif |
| Defeat | `defeat` — **The Road Remains** | 84 BPM · minor · cello + piano; calm, reflective rather than a punishing fanfare |
| Finale | `finale` — **A Country Wakes** | 88 BPM · major · flute + harp; a gentler, released sense of arrival |

**Catalog note (verified 28 October):** the score book gives the title cue the official game name. The current manifest's *descriptive title field and generationGuide* for the same `title` asset still contain the retired development name. That is **legacy creative metadata**, not authorization to rename the game or assume the player-facing UI still uses it. A separate scoped asset-metadata correction can resolve this when approved; this documentation-only edit does not modify source sound files, code or routing.

## Environmental sound: 14 background beds

Environmental recordings are **not music cues**. They build a restrained sense of place below the soundtrack. The [environment book](../tools/audio/environment-book.json) holds the actual per-bed guide and deterministic synthesis recipe. The current catalog has these identities:

| Recording ID | Sound identity / production purpose |
| --- | --- |
| `env-woodland-day` | Woodland — gentle leaf air |
| `env-woodland-night` | Woodland — still night air |
| `env-marsh-day` | Marches — shallow water and reeds |
| `env-marsh-night` | Marches — quiet night water |
| `env-highland-wind` | Highlands — open mountain air |
| `env-frontier-air` | Frontier — dry open air |
| `env-crown-courtyard` | Crown — sheltered courtyard |
| `env-home` | Residences — quiet room |
| `env-retreat` | Crypt — secluded stone retreat |
| `env-archive` | Archive — restoration hall water |
| `env-mine` | Mine and foundry — distant works |
| `env-dragon-hall` | Abyss — high vaulted air |
| `env-citadel` | Citadel — restrained machinery |
| `env-cellar` | Cellars — sheltered timber room |

Preserve the **low-density, spacious** environmental character: quiet woodland air, marsh movement, ridge wind, frontier dryness, sheltered courtyards, interiors, water/stone work and distant machinery as appropriate. These textures intentionally avoid a wildlife spectacle, constant storms, loud animal calls, crowded villages or intrusive rhythmic events. Sparse details may punctuate silence; sound should not cover warning effects. The game currently lowers environmental gain during combat and bosses, and uses a separate audio owner so music changes do not constantly restart it.

**Ongoing environment quality standard and source reconciliation (31 October 2026):** The original 14-bed table above remains the truthful **retained original source catalog**, but the unmerged draft now also registers **four additional 72-second physical-recording-based environmental assets**; do not mistake this historical table for all 18 draft assets. Issue [#709](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/709) has two superseded early interior studies and **four** newer, physically recorded 72-second candidates for Ironroot Highlands outdoors, Ashen Frontier outdoors, Old Signal Keep and Ruined Shrine Barracks. They are **registered, physically present, and routed** in unmerged draft [PR #711](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/711). The other 15 location contexts—including Flooded Marches day and night, Sunken Archive, Drowned Watchhouse and the four Treasuries—retain their existing environment records unless a separate later replacement is actually authored and approved. The four registered IDs are `env-highlands-autumn`, `env-frontier-recovery`, `env-signal-occupied`, `env-shrine-occupied`; original files are preserved for A/B comparison, appropriate reuse and rollback. See [four-place integration handoff](AUDIO_ENVIRONMENT_STAGE1_HANDOFF_20261031.md). The [complete file/scene map](AUDIO_ENVIRONMENT_PRODUCTION_INVENTORY_20261031.md) controls that inventory, while [the accumulated artistic, source-rights, loop/codec, mix and review standard](AUDIO_ENVIRONMENT.md#continuing-environmental-sound-quality-standard--findings-from-709-31-october-2026) guides any future environmental work. **Original sparse nighttime insect details are preserved in Vale, Highlands, Frontier and Crown; generic sound is a future design concern, not authorization to silence it.** Final combined score/environment/warning listening remains deferred until the soundtrack's own accepted audition workflow; do not infer a creative green light from CI.

## Recorded sound effects: 30 cues

Effects are brief **event signals**—for instance release, travel, impact, warning, interaction or menu feedback—not little pieces of background music. The original [SFX recipe book](../tools/audio/sfx-book.json) contains all 30 ID-specific natural-language briefs; [the manifest](../assets/audio/manifest.json) contains the exact active recording paths and event bindings. The existing procedural effects remain available as fallbacks.

A sound replacement needs to preserve what the event communicates: recognizably different materials, release versus impact, target feedback and especially readable danger warnings. Prefer short, distinct transients to uniform cinematic booms. The source's guide for steel impact, for example, calls for a brief physical steel texture **without a voice, long tail or musical bed**. Audit the actual event and its neighbors before changing one effect; louder does not automatically mean clearer.

## A reusable composer / audio-generation handoff

The catalog already stores a `generationGuide` for each recorded asset. **Copy the specific guide from the manifest or audition room**, then use this supplementary brief structure when collaborating with a composer or external audio generator:

> Create an **original instrumental fantasy-RPG cue** for [exact place, boss or event]. Its job is [exploration / encounter layer / relief / night / settlement / TRUE escalation / effect]. Convey [the established location or character identity] while leaving room for combat warnings and interface feedback. Retain [lead, supporting instrument, BPM, mode, recognizable motif]. For a synchronized layer, match the source's meter, chord timing and exact musical loop duration. Favor a clean, repeatable phrase over a generic epic crescendo. No vocals or borrowed melodies. Compare the result with the current recording before approval.

This is a **future-facing brief template**, not a recovered original AI prompt. If exact reproduction is wanted, use the source score and synthesis recipe rather than prose alone. The generation guide describes intent but does not encode every note, timbre or mastering parameter.

## Listening, revision and acceptance

1. **Identify the actual cue** by its stable ID and context. Listen to the released recording in the [audition room](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/audio/index.html) and in the game. Compare base/action/peace or boss/TRUE **as a set**, not in isolation.
2. **State the creative problem first:** melody, harmony, instrumentation, atmosphere, repetition, mix level, transition, event routing or a missing sound are different tasks. Record what should be preserved alongside what should change.
3. **Read the source metadata:** `tools/audio/score-book.json` for notes and musical recipe; `assets/audio/manifest.json` for the current asset title, generation brief, credits, hash and routing; the environment/SFX books for those sound types.
4. **Implement only approved changes** through [Audio authoring](AUDIO_AUTHORING.md). Keep IDs and routing stable unless a deliberate design change requires a migration. Re-render dependent synchronized layers together if harmony, tempo or loop length changes. Updating only prose does not create audio.
5. **Validate technically and musically:** run the affected checks (including `npm run audio:check` where relevant), verify looping/crossfades/offline packaging, and audition warning clarity, headphone/speaker comfort, combat transitions, and longer sessions on target devices. Automated checks prove file and playback properties, **not** artistic success.

**Current evidence:** 83 registered music + 14 environmental + 30 recorded effect assets = **127 total** at the verified 28 October source checkpoint. The soundtrack and related playback are implemented, but this guide makes **no claim** of a newly completed headphone/iPhone/Chromebook listening review, full-game regression suite or publication of fresh audio.

## Version history, not current work orders

The earlier [v0.8.90 sound-pass text](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/3765ed3bbbf67385561ba47b46887eda6ccf3e7c/docs/AUDIO_SOUND_PASS.md) records the original project's rollout, 83-cue score and release-verification intentions. It remains valuable provenance, but old test statements, version numbers, dates, release gates and the original development name must not be treated as today's instructions. For an exact playable build or deployment status, follow [Development state](DEVELOPMENT_STATE.md).
