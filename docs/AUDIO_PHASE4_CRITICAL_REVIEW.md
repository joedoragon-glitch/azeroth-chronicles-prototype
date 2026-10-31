# Phase 4 soundtrack — independent source, orchestration and recorded-output audit

**31 October 2026.** For *So I Became the Dark Lord's Problem*. Master [#673](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/673); corrective [draft #716](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/716), stacked on Phase 3 draft [#704](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/704). This is the **source-led creative audit and decoded-signal engineering record**, not a claim that a reviewer actually heard these files.

**Authoritative acceptance hierarchy:** the 14 owner-approved soundtrack choices Q01–Q14 in #673; current game-world inhabitants, work and story; [AUDIO_SOUND_PASS.md](AUDIO_SOUND_PASS.md), [AUDIO_AUTHORING.md](AUDIO_AUTHORING.md), [ARTISTIC_ASSET_WORKFLOW.md](ARTISTIC_ASSET_WORKFLOW.md); the two current Phase 3 base pilot decisions and exact sample bank. Source/technical proof cannot replace actual hearing. Owner's **first audition and final creative acceptance belong only to Phase 9**.

**Exact tested recording source:** `a9f588ce0a82816254c101f41e7a9fbe4eefe556`; [isolated 38-track studio CI #41195837083](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41195837083) **SUCCESS**, metrics artifact `phase4-isolated-studio-metrics`. The audio source is the tested SHA; later documentation-only commits do not change that playback material. No preview MP3 was registered, merged, distributed, deployed, or used for a device-verified or genuinely heard test.

## Review verdict — previous GO was premature

The first 38-MP3 pass on `e85a049` demonstrated **codec and basic clock correctness only**. It did **not** satisfy the existing sound-bible source-quality expectation. We found and corrected these real defects:

1. **Wrong source melody inheritance (material):** For the Greenwood and Archive Phase 2-based primary themes, Phase 4's `heritage_notes()` omitted the per-bar harmony offset used by the actual earlier ensemble. Reproduced against all original `leadShifts`, overrides and performed durations; the revised test covers **84 note events across their full forms**, not only the two-bar opening. The supplied original motif and chord progression, not incidental pilot MP3 audio, now govern the new variants.
2. **Mechanical template overuse (material):** Every arrangement previously reused role-default accompaniment patterns, exactly repeated energy trajectories within a role and role-default acoustic reflections. They are now replaced by **15 separately authored scene-specific rhythmic palettes and 15 individual room/acoustic profiles**, transformed by dramatic context. Each cue retains its own form, questions, responses and four-part energy arc. There are **eight distinct action percussion accents**, not the same two-hit boss drum recipe repeated everywhere.
3. **Unnecessary base-melody duplication (material):** The action overlays repeated the whole lead on each H slot while the parent base remained live. An additive stem now introduces counterpoint instead. New source QA confirms **49 action H slots carry counterlines rather than copying the base lead**. **160 non-action H slots** still refer to their parent/original hook intentionally; inherited notes and stereo/bass roles are kept separately identifiable.
4. **Incorrect interior storytelling (material):** Drowned Watchhouse is a **Reed Beast home**, Old Signal Keep an **operating Ogre/Crown-service station**, Ruined Shrine an **inhabited Orc barracks/workspace**, and Old Orchard Cellars a refuge with displaced families, games, beds and legitimately purchased preserves. The seven base/peace pairs are corrected in both room authority and **all 14 arrangement intentions**. The cellar source also restores its actual **four-note Phase 2 kitchen motif**, then re-composes the surrounding body under the current recorded palette; the old 96-kbps oscillator pilot audio is **not** reused.
5. **Unnatural recorded-note stretching (material source risk):** The first corrected renderer still generated **57 note events** shifted five or more semitones from the nearest recorded source, including large upper horn leaps. Twelve named answer/interjection roles are lowered into natural horn registers. The Old Signal Keep's full ascending two-note calls are shifted **together** in three carefully chosen late bars per variant, protecting the interval shape; two exposed flute response roles are lowered as complete phrases. The exact final recorded-sample routing now has **13 such events**: **11 pre-existing Phase 3 parent low-bass** notes (4 Crypt, 4 Frontier, 3 Mine) and **two Vale flute** motif notes (night/peace). No horn outliers remain in the tracked final render. We have **not** added arbitrary source-library complexity or altered the Phase 3 original masters.
6. **Weak loop safety gate and actual Ridge Treasury seam (material):** The prior test allowed a decoded loop jump up to 0.2 full scale; one `interior-supply-highlands` preview measured **0.04751**. A deliberate quieter cadence before the return, 45-ms symmetrical boundary taper and tighter **0.005** decoded-sample acceptance now produced a **maximum measured 0.00002** across all 38 candidates. This verifies a codec-boundary measurement; whether the transition *feels musical* during repeat listening remains UNVERIFIED.

These are actual changes to score source, instrumental register, recorded performance and encoded audio, not only reworded intent or green-test decoration. No new lore, game runtime changes or Crown music were introduced.

## Scene-family critical identity review

| Source family/context | Approved current story/emotional ground | Corrected score-specific musical device |
| --- | --- | --- |
| `place-vale` | Orchard farming, homes, subtle estate vigilance | warm flute/harp phrases, field-work pulse; danger as restraint rather than war |
| `place-march` | Fishers, trade routes, displaced Wraith history | unsteady offbeat current, piano/reed pulse; night sympathetic but dangerous |
| `place-highlands` | Ogre homes, coinage, work control | steady craft/mint groove and warm lower horn; no greedy-villain caricature |
| `place-frontier` | Recovery and war scars | repair-and-return string pulse with exposed silences; no permanent inferno |
| `place-crypt` | Lifebinder's unfinished winter estate | measured work/care/craft phrase, not generic undead horror |
| `place-archive` | Urgent preservation of knowledge | quicker, broken salvage phrases and breathing spaces; not generic rain lullaby |
| `place-mine` | Garun's stone studio and conviction | weight, measured chisel beats and old-friend gravity, distinct from mint |
| `place-abyss` | Veyrith's not-yet-realized aviation program | rising space/flight gesture with uncertain arrival; not captive-beast or Crown theme |
| `supply-vale` | Scornfang's occupied reclamation office and home | small office/goblin domestic motions under guarded order |
| `supply-march` | Mirejaw's guarded wetland cache | cautious logistics and short irregular water-dwelling turns |
| `supply-highlands` | Ridge Tyrant's inhabited treasury/home | books, comfort and control; final cadence creates silence before repeat |
| `side-vale-cellars` | Displaced Goblin families' active refuge | restored original Phase 2 four-note kitchen phrase, but fully re-scored body/peace |
| `side-march-watchhouse` | Reed Beast dwelling, nests/fish racks | long water-soaked rests without false abandoned-barracks mood |
| `side-highlands-signal` | Active Ogre household and Crown signal station | recognizable two-note fifth call; both tones deliberately shift octaves as a unit |
| `side-frontier-shrine` | Orc barracks and ritual-furnishing workspace | lived-in drills/ritual residue, neither vacant shrine nor generic occult cue |

**Q11 is global**, not local: every `peace-*` and `peace-interior-*` version is for the final post-throne conditions. Their quieter returns and counter-melodies suggest relief with remaining uncertainty, rather than a locally liberated treasure room. The shared original theme and its harmonies are deliberately inherited where possible; these variants are not supposed to erase each family's home identity. Separate night/settlement tracks reflect scene function, not unapproved new world events.

## Audited 38-ID provenance and acceptance ledger

The exact scope is **8 action + 8 global peace + 4 night + 4 settlement + 7 interiors + 7 global interior peace = 38** (not the older arithmetic error of 42). With 8 Phase 3 primary bases, 16 Phase 5 boss/TRUE parts and 3 Phase 6 narrative pieces, there are exactly **65 permitted non-Crown IDs**; 18 deferred Dark Crown recordings remain untouched, including their physical SHA-256 assertions.

| Existing stable cue | Composition function | Parent and musical clock | Present production gate |
| --- | --- | --- | --- |
| `action-vale` | Additive danger counterline, not parent-lead doubling | `place-vale`, 12 bars @ 92 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `action-march` | Additive danger counterline, not parent-lead doubling | `place-march`, 14 bars @ 82 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `action-highlands` | Additive danger counterline, not parent-lead doubling | `place-highlands`, 14 bars @ 88 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `action-frontier` | Additive danger counterline, not parent-lead doubling | `place-frontier`, 16 bars @ 96 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `action-crypt` | Additive danger counterline, not parent-lead doubling | `place-crypt`, 12 bars @ 84 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `action-archive` | Additive danger counterline, not parent-lead doubling | `place-archive`, 16 bars @ 86 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `action-mine` | Additive danger counterline, not parent-lead doubling | `place-mine`, 14 bars @ 96 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `action-abyss` | Additive danger counterline, not parent-lead doubling | `place-abyss`, 16 bars @ 96 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `peace-vale` | Global post-throne fragile peace alternative | `place-vale`, 12 bars @ 92 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `peace-march` | Global post-throne fragile peace alternative | `place-march`, 14 bars @ 82 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `peace-highlands` | Global post-throne fragile peace alternative | `place-highlands`, 14 bars @ 88 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `peace-frontier` | Global post-throne fragile peace alternative | `place-frontier`, 16 bars @ 96 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `peace-crypt` | Global post-throne fragile peace alternative | `place-crypt`, 12 bars @ 84 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `peace-archive` | Global post-throne fragile peace alternative | `place-archive`, 16 bars @ 86 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `peace-mine` | Global post-throne fragile peace alternative | `place-mine`, 14 bars @ 96 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `peace-abyss` | Global post-throne fragile peace alternative | `place-abyss`, 16 bars @ 96 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `night-vale` | Guarded/sympathetic nighttime arrangement | `place-vale`, 12 bars @ 92 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `night-march` | Guarded/sympathetic nighttime arrangement | `place-march`, 14 bars @ 82 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `night-highlands` | Guarded/sympathetic nighttime arrangement | `place-highlands`, 14 bars @ 88 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `night-frontier` | Guarded/sympathetic nighttime arrangement | `place-frontier`, 16 bars @ 96 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `settlement-vale` | Inhabited daily-life arrangement | `place-vale`, 12 bars @ 92 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `settlement-march` | Inhabited daily-life arrangement | `place-march`, 14 bars @ 82 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `settlement-highlands` | Inhabited daily-life arrangement | `place-highlands`, 14 bars @ 88 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `settlement-frontier` | Inhabited daily-life arrangement | `place-frontier`, 16 bars @ 96 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `interior-supply-vale` | Distinct occupied-room base | `supply-vale`, 12 bars @ 92 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `peace-interior-supply-vale` | Global post-throne interior alternative | `supply-vale`, 12 bars @ 92 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `interior-supply-march` | Distinct occupied-room base | `supply-march`, 12 bars @ 82 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `peace-interior-supply-march` | Global post-throne interior alternative | `supply-march`, 12 bars @ 82 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `interior-supply-highlands` | Distinct occupied-room base | `supply-highlands`, 12 bars @ 88 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `peace-interior-supply-highlands` | Global post-throne interior alternative | `supply-highlands`, 12 bars @ 88 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `interior-side-vale-cellars` | Distinct occupied-room base | `side-vale-cellars`, 12 bars @ 92 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `peace-interior-side-vale-cellars` | Global post-throne interior alternative | `side-vale-cellars`, 12 bars @ 92 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `interior-side-march-watchhouse` | Distinct occupied-room base | `side-march-watchhouse`, 12 bars @ 82 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `peace-interior-side-march-watchhouse` | Global post-throne interior alternative | `side-march-watchhouse`, 12 bars @ 82 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `interior-side-highlands-signal` | Distinct occupied-room base | `side-highlands-signal`, 12 bars @ 88 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `peace-interior-side-highlands-signal` | Global post-throne interior alternative | `side-highlands-signal`, 12 bars @ 88 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `interior-side-frontier-shrine` | Distinct occupied-room base | `side-frontier-shrine`, 12 bars @ 96 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |
| `peace-interior-side-frontier-shrine` | Global post-throne interior alternative | `side-frontier-shrine`, 12 bars @ 96 | Source-revised; exact-head isolated codec PASS; heard UNVERIFIED |

**Recorded-source and technical proof at exact SHA:** 38 individually authored 44.1-kHz stereo / 192-kbps MP3s genuinely synthesized, encoded and decoded in temporary CI storage, not published or committed as game assets; combined encoded bytes **33,124,042**; decoded peak maximum **0.62144**; decoded loop-edge step maximum **0.00002**; smallest measured stereo-side RMS **0.00164**, safe mono-fold peak checked; **eight live-clock base/action raw-signal comparisons**, max combined absolute peak **0.760997**. **49 unique CC0 source recording files** used for **3,125 recorded-note calls** across the Phase 4 candidates and memory-rendered primary parents, with original pinned bank provenance and deterministic drum generation checked. All 18 physical original Crown tracks passed SHA-256 freeze tests and 83 catalog music IDs remain accounted for.

**Packaging projection:** If only the 38 Phase 4 existing recordings were replaced, the current whole catalog would project to **48,768,993 encoded bytes**, below today's 256-MiB package ceiling. This is **not** a complete 65-replacement budget, runtime decoded-cache certification, or an authorization to register the candidates. Other phases have not yet rendered their final sources.

## Boundaries, evidence gaps and required later acceptance

**What passed:** the current score, active regional canon/credit/ID checks, **84-event original pilot harmony test**, additive nonduplicated counterpoint source test, distinct scene palettes, 38 recorded-sample encode/decode, measured clock synchronization/overlays, conservative loop/seam/stereo/mono gates and frozen Crown checks. **Source was critically inspected and repaired**; it is a materially stronger candidate than the previous quick template pass.

**What did NOT occur:** no actual headphone/speaker audition, genuine internal listener's judgement, two-loop listening-fatigue comparison, emotionally credible/pleasant timbre confirmation, instrumental attack/colour by ear, independent gameplay-warning intelligibility or in-game/browser/offline/mobile mixing. The chosen CC0 bank contains some originally compressed/lossy recordings, and sample provenance alone does not prove attractive acoustics. The repeated 30–45-second loops, exposed chimes, family balance, remaining Vale flute shifts and 11 pre-existing Phase 3 bass transpositions are specific **listening questions**, not imaginary certifications or automatic new-sample demands.

**Phase 7** owns the actual game-catalog 65-cue integration, real gains, warning masking, crossfades, memory/cache and offline/device issues (see [#699](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/699)). **Phase 8** owns final listening-room certification. **Phase 9** is the project owner's first complete collection audition and final creative judgement. If a later genuine hearing reveals a defect, revisit only affected candidates, bases, registrations and tests. No invisible internal audition has been performed.

**Disposition for discussion with the owner:** the known source-composition/canon/codec failures of the first Phase 4 candidate were corrected and the new exact recorded-source studio verification passed. **Scoped source/isolated engineering result: eligible for technical-GO consideration, not an acoustic-quality or final artistic GO.** Heard sound UNVERIFIED; owner approval Phase 9; candidate DRAFT / UNMERGED / UNPUBLISHED / UNREGISTERED / NOT DEVICE-VERIFIED. Stop here instead of indefinite polishing without a genuine new finding.
