# Soundtrack and sound identity — living creative reference

## Phase 5 owner-directed musical-source re-audit (31 October 2026)

**New mandatory gate:** Distinct TRUE prose and a working encoder are not enough when many simultaneous main and counterphrase accented notes grind against unrelated chord roots. Selected scored TRUE arrival bars now intentionally voice the chord on the accent; other melodic tensions are retained and individually reviewed. The glockenspiel written parts must also stay within the actual two-sample G5/C6 source coverage after whole-phrase revoicing, not silently octave fold or undergo extreme interpolation. No sound-by-ear quality pass is claimed.

The initial Phase 5 16/16 technical PASS did not cover all musical craft mandated by this sound bible: six inherited boss opening melodies were reharmonized without review; Mirejaw/Drowned Keeper TRUE glockenspiel and Ridge TRUE cello could invert their own played intervals via silent note-by-note octave correction; and original/performed comparisons did not inspect full-form notes delivered to the sampler. These are **actual source defects**, not mere unauditioned sonic risks. [The revised Phase 5 adversarial review](AUDIO_PHASE5_CRITICAL_REVIEW.md#independent-adversarial-audit--source-revise-until-revised-exact-source-validation) and source/negative tests now require full chord inheritance, explicit TRUE registers, evidenced tonic returns and measured performed MIDI at the sampler boundary. The previous green MP3s are superseded when source changes; rerender exact new code before accepting the source/isolated technical milestone. Sound-by-ear remains UNVERIFIED, first owner audition Phase 9, all 18 Dark Crown recordings protected.


## Phase 5 boss/TRUE soundtrack source checkpoint — 31 October 2026

The eight boss themes and eight synchronously additive TRUE voices are now **source-authored and isolated stereo-technical tested**, not published. [Draft #721](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/721), built on Phase 4 #716, passed [exact audio-producing commit `229065f`, focused CI #41207846367](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41207846367): 16/16 recorded-source MP3s really encoded and decoded, eight exact sample-frame TRUE overlays passed, permanent anti-copy/anti-clone/performed-note/Crown/source-provenance safeguards passed, and a correction of unnatural large sampler repitches reduced source shifts from 52 to 9. [Phase 5 critical review](AUDIO_PHASE5_CRITICAL_REVIEW.md) and [tracked render hashes](../tools/audio/phase5-render-evidence.json) preserve the individual character choices and real evidence. The **draft working title** for Lifebinder is **Keeper of the Winter Works**; the obsolete *published* Summer Keys title and all original game audio metadata remain untouched until authorized later integration.

**Heard acoustic quality has never been verified.** The source/isolated technical pass cannot certify character expression as heard, loop fatigue, warning masking or a mix on phones. Phase 7 #699 integration, Phase 8 room, Phase 9 owner's first hearing/acceptance, and future Crown-only production are unaffected. No merge, deployment, live-asset replacement, or device certification occurred.

## What is authoritative, and what is interpretive?

- **Exact notes, melodies, tempo, mode, instrument recipes and synchronized-layer structure:** [Original score book](../tools/audio/score-book.json), rendered through [render-score.py](../tools/audio/render-score.py).
- **Currently registered files, playable titles, reusable natural-language generation briefs, routing, author/credit metadata and content hashes:** [Audio manifest](../assets/audio/manifest.json).
- **Environmental textures:** [environment book](../tools/audio/environment-book.json). **Recorded one-shot effects:** [SFX book](../tools/audio/sfx-book.json). Both have separate synthesis owners.
- **How to produce, register, test and publish sounds:** [Audio authoring](AUDIO_AUTHORING.md). **How the live mixer, scene director and playback work:** [Current sound production](AUDIO_PLAYBACK.md).
- **What a scene means now:** [live region and boss data](../src/prototype/data.js), [interior and Treasury definitions](../src/prototype/rules.js), [Keeper Archive](../src/prototype/archive.js), later approved [decisions](DECISIONS.md), and [source-backed Phase 0A audit with the owner's 14 binding selections](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/673).
- **Listening acceptance:** internal audio checks precede the independent listening-room repair/certification (Phase 8). The owner's **first musical audition is Phase 9, after all development**; the [current public room](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/audio/index.html) has a [known separate browser bootstrap defect](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/647), and published assets must not be mistaken for an unmerged 65-cue production candidate.

**Evidence boundary:** Titles, IDs, modes, beats per minute (BPM), lead instruments and cue relationships in **the existing score metadata** come from the current recipe/catalog. They describe *old recordings*, not mandated tempos, instrument limits or newly completed music. The **owner-approved 26-family sound bible below supersedes historical descriptions** when they conflict with current gameplay and approved lore. Original score metadata and credit provenance remain preserved until the authorized audio production phases. Do not treat a generated metadata guide as the literal historical prompt that created a recording: the recorded assets were composed/rendered by the project's original deterministic tools; these English briefs were written afterward to help reproduce their intent.

## Overall musical language

The score uses original, warm-fantasy **instrumental** compositions, not licensed tracks, commercial samples, AI-generated recordings or full orchestral performances. Its recurring vocabulary includes flute, harp/plucked strings, piano, cello, horn, bells, bowed layers, dulcimer/guitar colors and deliberately restrained percussion. Original cues use developed eight-bar loops with melodic phrases and cadences.

The design challenge is **contrast with continuity**: a peaceful settlement should feel inhabited, a dangerous crossing should remain recognizably part of its region, and a boss should have an individual identity rather than the same generic loud track everywhere. Music must leave room for combat warnings, speech-free interface feedback and environmental sounds. Darkness and danger are present without demanding constant grim or maximal instrumentation.

The system treats music as a *family*: exploration/base, synchronized encounter action, **global post-ending peace**, daytime/night/near-refuge settlement colors outdoors, and dedicated boss with a compatible TRUE layer. **The `peace` selector is global after the required TRUE Dark Lord victory, throne claim and five TRUE dungeon victories; it is not a local reward for defeating a boss.** Keep intentional melodic relationships across a family without flattening distinct places or characters into instrument swaps on identical loops. The owner selected **fragile relief and uncertainty** for peace (Q11), **character-specific TRUE escalation** (Q10), **a subtle old-companions leitmotif** (Q13) and a **meaningfully transformed title/finale shared theme** (Q12).

**Source-palette quality policy:** See [curated artistic source and sample-palette workflow](ARTISTIC_ASSET_WORKFLOW.md) and the [CC0 Phase 3 sample bank](../tools/audio/phase3-sample-bank.json). Selected recorded instrument clips are ingredients for a candidate renderer, **not** an accepted score, and draft Phase 3's revised studio renderer now attempts to use this bank, but actual rendered results, musical suitability and listening acceptance are still separate unpassed gates.

## Current soundtrack source-production sequence (31 October 2026)

**Phase 4 has been CLOSED at the explicitly scoped authored-source and isolated-studio technical gate**, on the owner's authorization: **38** existing cue IDs, revised after a substantive adversarial audit; see [full Phase 4 critique](AUDIO_PHASE4_CRITICAL_REVIEW.md), [permanent quality-control implementation](../tools/audio/score-quality-controls.py), [negative regression fixtures](../tests/audio-score-quality-controls.test.py), and [passing exact CI #41197631496](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41197631496). New score source and recorded previews are **not in the published game**. No one has actually heard and assessed the produced soundtrack; professional acoustics, fatigue, gameplay warnings and owner acceptance remain **UNVERIFIED** until the approved later gates. The original 18 Dark Crown recordings remain frozen; draft Phase 4 [#716](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/716) and Phase 3 [#704](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/704) are unmerged.

**Phase 5 is next:** author the eight existing boss and synchronized TRUE pairs (16 IDs), each from the specific opponent's actual personality and source motif rather than a common boss loop. The current canonical bosses, psychology, subtle shared old-companions idea (Q10/Q13), and Lifebinder's retired title (Q14) are specified in [the approved boss table below](#eight-in-scope-boss-and-synchronized-true-families). The exact runnable handoff, dependencies, allowed scope and reusable QA procedures live in [Audio authoring](AUDIO_AUTHORING.md#phase-5-authoring-handoff--eight-boss--eight-synchronized-true-cues). A green source/codec run is not a favorable listening critique, nor a reason to alter protected Crown music. Historical Phase 4 BLOCKED/42-cue statements later in this living reference are retained as superseded checkpoints, not current instructions.

## Composer and sound-design acceptance principles — standing quality bar (31 October 2026)

The **sound bible is a production standard, not decoration**. A successful audio codec, an importable cue, a correct ID, a plausible chord progression or four instrument names do not establish a satisfying score. A completed family should **sound like the character and place it was written for**, develop recognizably over time, keep the game readable, and withstand repeated play. The [mandatory creative/audio engineering gate](AUDIO_AUTHORING.md#standing-soundtrack-quality-gate) applies proactively through the soundtrack workflow, with the [Phase 2 pilot failures and remedy #701](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/701) as negative examples.

The composer's test for each family is: *What is its memorable hook?* *How is the original identity continued or deliberately revised?* *Where does the dramatic argument move over the loop?* *What is the harmonic tension, and what happens to it?* *What change in actual rhythm, voicing, orchestration and timbre makes combat or TRUE feel different?* *What sounds like lived-in culture, personality or human conflict instead of a generic genre cue?* *Why can this track repeat without turning into clockwork?* If those questions cannot be answered from the score and production choices, the family is not ready to be cloned into variants.

**Listen with production skepticism when possible.** Review audible timbre/expressivity, motif memorability, balance, transient harshness, texture congestion, perceived intensity, variation and loop fatigue by genuinely hearing the rendered candidate, not imagining it from code. If real listening was not possible, state exactly that, and do not attach words such as *beautiful*, *cinematic*, *professional*, *emotionally powerful* or *musically accepted* to the file as though verified. Actual subjective owner acceptance remains exclusively Phase 9; the soundtrack team owns earlier source-led craft review and honest internal QA.

**Historical first-generation audit (corrected in the v2 pilots; current Phase 2 disposition is GO below):** Technical Phase 2 rendering was complete, but the original eight compositions received a **REVISE BEFORE SCALING** source-quality finding: formulaic accompaniment, melody/chord friction without documented preparation, limited musical development, uncertain old/new motif continuity and action/TRUE character arc, and unproven oscillator timbres. **That first-generation recipe was not approved for Phase 3.** The revised v2 pilot work addressed its source deficiencies, was re-rendered/re-checked, and received a later scoped GO. It still cannot certify heard musical quality or be cloned mechanically into new families. That is a design-quality hold, separate from [Phase 7 decoded-cache risk #699](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/699) and the later Phase 9 owner-audition gate.


## Phase 3 primary-theme source checkpoint — Halloween 2026

[Draft PR #704](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/704) adds the **eight primary base compositions** for Greenwood Vale, Flooded Marches, Ironroot Highlands, Ashen Frontier, Forest Crypt, Sunken Archive, Colossus Mine and Abyss Bastion. It incorporates the already source-approved corrected v2 Greenwood and Archive base themes, then individually composes six further regional/dungeon scores with source-level original-motif mappings and authored harmonic, rhythmic, expressive and counter-melodic plans. See [Phase 3 source themes](../tools/audio/phase3-themes.json) and [Phase 3 renderer](../tools/audio/phase3-compose.py).

The source design **does not reuse one arranger loop for all eight scenes**: quayside pauses versus scholarly salvage, autumn work-ledger horn pulse versus a stone architect's considered oath, scarred frontier renewal versus an unfinished winter estate, and the Bastion's unlaunched upward ambition each require their own phrasing and orchestral pacing. The original motif contour is tracked or intentionally reinterpreted per theme; there is no improvised Dark Crown lore.

**HISTORICAL status, superseded by the Phase 3 QUALITY HOLD:** Eight base score designs existed, but the supposed source-design GO is **withdrawn**; only the older unregistered eight-MP3 encode/decode had passed. Six source hooks have since changed, so their original preview hashes and measured codec verdict do not certify the amended candidates. The source-level outcome is design-candidate approval, not a genuine acoustic or owner acceptance. Corrected source and **eight actual isolated MP3 previews passed** [focused CI #41175260693](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41175260693) at source commit `cc69e2aa`. The largest decoded peak was **0.61066** and the largest loop-edge step **0.00047**; the eight-only prospective catalog is **27,251,469 / 33,554,432 bytes** (not a whole-score budget clearance). Per-cue hashes, sizes and source evidence are archived in [Phase 3 render evidence](../tools/audio/phase3-render-evidence.json). A separate source-level inspection identified and corrected an unintended Colossus Mine 15-semitone melodic jump before the successful run, and the new focused regression guards against future unreviewed octave-plus leaps. No new runtime recordings are registered; Phase 4's related 42 contextual/interior cues, Phase 5 boss pairs, Phase 6 narrative pieces, Phase 7 integration QA, Phase 8 listening room and owner Phase 9 acceptance are not completed by these base themes. All 18 Crown music assets remain unchanged. **Audible instrumental quality, distinctive sound as heard, warning clarity, two-loop fatigue and owner listening remain UNVERIFIED.** Numeric results will not be represented as sonic acceptance. See [authoring and gate status](AUDIO_AUTHORING.md#phase-3--eight-primary-area-themes-draft-704-31-october-2026) and [master issue #673](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/673).

## Approved Phase 1 sound bible — 26 musical identities / 65 cues

**Binding decision:** [Issue #673](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/673) documents a 26-group source/game-lore matrix and all 14 explicit authorial decisions (Q01–Q14). **In scope:** four outdoor regions (20 cues), four main dungeons (12), seven smaller interiors (14), eight boss/TRUE pairs (16), and title/defeat/finale (3). All **83 existing music IDs** stay registered; **18 Dark Crown and directly associated cues across seven additional families are frozen**, awaiting that fifth region's later worldbuilding and a separately focused production pass. These descriptions are approved **musical direction**, not proof that newly rendered files already meet it.

Use **current game truth** (occupants, tasks, story history, world states, actual cue routing) before selecting musical materials. Keep the 65 families distinct through phrasing, motif, cadence, harmonic purpose, form, sound space, instrumentation and silences; the original eight-bar recipes and three recurring chord templates are starting evidence, **not mandatory new composition limits**. Maintain actual sonic continuity across variations, loop alignment between simultaneous base/action and boss/TRUE stems, and clarity of attack warnings. The family IDs below are stable compatibility keys, not the whole narrative. Do not prescribe unapproved new scene transitions.

### Four in-scope outdoor regions

| Context / current cue IDs | Approved emotional job and family guidance |
| --- | --- |
| **Greenwood Vale:** `place-vale`, `action-vale`, `peace-vale`, `night-vale`, `settlement-vale` | **Q01 A:** predominantly warm, welcoming summer farmland and wooded homes, with subtle unease where patrolled estates and constrained workers intrude. Base motif is human-scaled and inviting; action introduces real risk, settlement feels inhabited, night is recognizable but more guarded. Global peace means fragile relief, not the automatic local defeat of Thornfang. |
| **Flooded Marches:** `place-march`, `action-march`, `peace-march`, `night-march`, `settlement-march` | Inhabited fishing and trade, reed channels and threatened routes. **Q04 B:** night is eerie but sympathetic to the Lantern Wraiths' displaced history, while remaining genuinely dangerous. Water does not equal horror, and no composition may assert that Wraiths caused the Archive flood. |
| **Ironroot Highlands:** `place-highlands`, `action-highlands`, `peace-highlands`, `night-highlands`, `settlement-highlands` | Autumn hardwood mountains, silver/copper transport, a mint, working Ogre homes and managed roads. **Q06 B:** comfortable and industrious with persistent undertones of control; neither unalloyed prosperity nor generic desolation. Everyday work, authority and ambivalence should all be legible. |
| **Ashen Frontier:** `place-frontier`, `action-frontier`, `peace-frontier`, `night-frontier`, `settlement-frontier` | **Q08 A:** recovery and resilience mindful of war scars. Repaired crossings, gardens, poppies, families and young regrowth coexist with an occupation and compulsory work; the music must not portray a lifeless perpetual firestorm or unearned freedom. |

### Four in-scope main dungeons

| Context / current cue IDs | Approved emotional job and family guidance |
| --- | --- |
| **Forest Crypt / unfinished winter estate:** `place-crypt`, `action-crypt`, `peace-crypt` | **Q03 C:** careful construction, routine and craftsmanship with unsettling undertones. Lifebinder adapts funerary space into a future winter residence using aware skeletal workers, with paid but constrained freedom and compelled smith labor. A personal place under work, not a random cursed crypt. |
| **Sunken Archive:** `place-archive`, `action-archive`, `peace-archive` | **Q05 A:** urgency and fragility of saving irreplaceable knowledge. A living archive in an unexplained preservation emergency, supervised by a learned former companion; Neri's restoration work is compelled. Preserve scholarly intelligence rather than generic water horror or a calm rain-cleanup fantasy. |
| **Colossus Mine:** `place-mine`, `action-mine`, `peace-mine` | **Q07 B:** weight of facing an old companion sincerely loyal to his cause. Productive mine and Garun's guarded studio/workshop, refuge and practical architectural world, not the lair of a mindless ancient animated stone creature. Mechanical weight serves personal conviction and craft. |
| **Abyss Bastion:** `place-abyss`, `action-abyss`, `peace-abyss` | **Q09 D:** ambition mixed with uncertainty, emphasizing the scale of an unfinished royal aviation project. Veyrith is the Dark Lord's proud, loyal personal dragon/mount, not an imprisoned beast, and there is no operational dragon fleet yet. Aspirational flight color with disciplined preparation. |

### Seven in-scope inhabited Treasuries and side interiors

**All seven use Q02 C:** balance ordinary or domestic musical gestures with intrusion of tension. They are dangerous *to the player* without being empty evil lairs; no local boss defeat switches them into a separate global peace state.

| Context / base and global-peace IDs | Source-true purpose for the musical identity |
| --- | --- |
| **Scornfang's Treasury:** `interior-supply-vale`, `peace-interior-supply-vale` | A Goblin superintendent's active reclamation office, defended stores, materials ledger and private household—not Thornfang's home. Workflow and domestic order under security pressure. |
| **Mirejaw's Treasury:** `interior-supply-march`, `peace-interior-supply-march` | An actual guarded, three-cache raid context within the Marches; marsh logistics and immediate danger, without fabricating a tender biography for an undocumented household. |
| **Ridge Tyrant's Treasury:** `interior-supply-highlands`, `peace-interior-supply-highlands` | Private residence, guarded wealth and cache, comforts of supper and games, administrative bookkeeping, trained household protection and living wage/compulsion contradictions. |
| **Old Orchard Cellars:** `interior-side-vale-cellars`, `peace-interior-side-vale-cellars` | Former fruit store now an inhabited Goblin refuge for displaced workers, families and young; games, beds and legitimately purchased preserves. A hostile encounter must not be scored like a vacant haunted cellar or stolen-food joke. |
| **Drowned Watchhouse:** `interior-side-march-watchhouse`, `peace-interior-side-march-watchhouse` | Part-flooded former military post reclaimed as a Reed Beast dwelling with nests, fish racks and shells, not an empty ghost barracks. |
| **Old Signal Keep:** `interior-side-highlands-signal`, `peace-interior-side-highlands-signal` | An *active* signal station maintained by Crown service, with Ogre households, tools, supper and leisure. Old architecture does not mean broken, abandoned or primitive. |
| **Ruined Shrine:** `interior-side-frontier-shrine`, `peace-interior-side-frontier-shrine` | Orc barracks and inhabited workspace *maintaining* old ritual furnishings; organized drills, domestic life, Scornfang memoranda. Ruin does not automatically imply desecration or occult horror. |

### Eight in-scope boss and synchronized TRUE families

**Q10 B:** each TRUE escalation must respond to **the particular boss's psychology and conflict**, not be the same louder drum stem transposed eight times. Keep normal/TRUE parts compatible for real overlay; the named TRUE sound can have its own rhythmic/harmonic/intensity development without replacing the base melody. **Q13 A:** Lifebinder, Drowned Keeper, Garun and Veyrith may share a **subtle recurring old-companions leitmotif** with appropriate variations; this does **not** require writing the deferred Dark Lord's new music now.

| Encounter / pair | Individual musical confrontation |
| --- | --- |
| **Thornfang:** `boss-thorn`, `boss-thorn-true` | A skilled former wilderness scout, canine trainer and intelligent patrolling estate chief; tactical pursuit rather than a mindless forest predator. Mira's paid but compulsory role should not be glamorized as consent. |
| **Lifebinder:** `boss-crypt`, `boss-crypt-true` | A familiar former companion and serious mortuary/conservation professional defending contested winter-estate work, aware skeletal workers and morally uneasy loyalty. **Q14 A:** retire the old summer-keys title; choose a winter-estate/current-story working name in authoring metadata during the score production phase, without changing the stable IDs. |
| **Mirejaw:** `boss-mire`, `boss-mire-true` | Wetland intelligence, local territorial danger and hydraulics/ambush—not possession of every fishery or alleged control over Wraiths. |
| **Drowned Keeper:** `boss-archive`, `boss-archive-true` | Scholar, councillor and old companion defending books in a preservation emergency while retaining coercive authority over Neri. Emotional urgency and intellectual determination, not simply generic undead villainy. |
| **Ridge Tyrant:** `boss-ridge`, `boss-ridge-true` | Master of Coin whose controlled roads, paid workforce and efficient economy are a sincere but coercive political philosophy; avoid greedy-ogre caricature or an endorsement of forced service. |
| **Stone Colossus / Garun:** `boss-mine`, `boss-mine-true` | Self-made stone-bodied former Ogre Bastion and architect, loyal defender of friends, workplace and beliefs. **Q07 B:** tragic gravity of facing someone sincerely convinced by his cause, with individual craft and intelligence. |
| **Ashen Warlord:** `boss-warlord`, `boss-warlord-true` | Governor and military commander of a recovering occupied country; disciplined control, real transport safety and enforced work, distinct from subordinate Cinder Warlord. |
| **Veyrith / Abyss Dragon:** `boss-abyss`, `boss-abyss-true` | Proud, loyal personal mount and Air Marshal fiercely protecting an ambitious but unfinished royal flight program; sovereign stature and uncertainty, not a chained captive dragon. |

### Three global narrative cues

| Context / ID | Owner-approved dramatic job |
| --- | --- |
| **Title:** `title` | **Q12 A:** establish a distinctive memorable original fantasy theme, with space for later transformation rather than an unchanging copied loop. The current official game title is *So I Became the Dark Lord's Problem*; retired development-name metadata is not canon. |
| **Defeat:** `defeat` | Convey an actual loss without inventing universal permanent death across Normal, Nightmare and Succession rules. It can relate to the main theme without becoming an indistinct copy. |
| **Finale:** `finale` | **Q11 B + Q12 A:** fragile peace, relief and uncertainty close together; *transform* the memorable title theme rather than reproducing the old exact notes unchanged. Plays during a bounded global peace window only after actual throne/TRUE ending gates; do not pre-author Dark Crown's unresolved future politics. |

### Reserved seventh-family extension — seven Crown contexts / 18 unchanged IDs

**Owner's later-integration instruction:** Once Dark Crown's fifth-region worldbuilding is completed, the 18 currently registered Crown assets receive a **focused symphonic-composition pass** that naturally extends the finished 65-ID score. Seven reserved families are: outdoor `crown` (5); major dungeon `citadel` (3); `supply-crown` Treasury (2); `side-crown-foundry` (2); `boss-citadel`/TRUE (2); `boss-cindermaw`/TRUE (2); and `boss-darklord`/TRUE (2). Their existing music files are **not changed or accepted in this phase**.

Future Crown work may reuse the vocabulary and tooling **only after the 65 in-scope compositions pass their own creative and technical gates**; the 65 have not been accepted at this checkpoint. Reserve integration hooks for the old-party leitmotif and title/finale theme without presuming a Dark Lord theme, settled political outcome, precise Crown instrument set, or completed region lore. Preserve all 83 active IDs, synchronized family loop boundaries, live dev.242 encoded budget of 256 MiB per catalog / 16 MiB per file constraints and practical decoded-cache headroom. Partial re-rendering must prove **all 18 Crown payload hashes unchanged**; future Crown rework uses the same pipeline and a new bounded owner-approved creative audit/verification gate. See the [full future Crown contract in #673](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/673).

**Completion boundaries:** This Phase 1 guide sets the *creative acceptance contract*, not completed sound. Phase 2 pilots new compositional language; Phases 3–6 produce the 65 recordings; Phase 7 internally certifies them while all 83 IDs still route; Phase 8 repairs/certifies the independent room with the exact candidate; **Phase 9 is the owner's first listening**. Crown music remains a later separate extension, not silently mixed into this acceptance.

---

## Phase 2 working contrast, not accepted replacement audio

The new isolated composition source studies four deliberately different contexts before production moves to all 65 included recordings: Greenwood's welcoming outdoor household scale; the Sunken Archive's fragile, urgent knowledge rescue; the inhabited Old Orchard Cellars' domestic refuge under threat; and the Lifebinder's winter-estate craft/old-companion encounter with an independently articulated TRUE escalation. The pilot profiles differ in **form, rests, pulse, chord sequence, instrument interplay, countermelody and melodic-cell transformation**, and use distinct 12- or 16-bar phrasing rather than the former uniform eight bars. The preview score data and compiler are in `tools/audio/phase2-pilots.json` and `tools/audio/phase2-composer.py`, with their safeguard and measurement instructions in [Audio authoring](AUDIO_AUTHORING.md).

**Status — technical Phase 2 complete; creative acceptance deferred:** Eight Phase 2 pilot recordings were **rendered and decoded successfully in isolated CI** ([run #41165770234](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41165770234)), with loop/seam, synchronized layers, overlay headroom and eight-only encoded-budget measurements recorded in [Audio authoring](AUDIO_AUTHORING.md) and [Phase 2 render evidence](../tools/audio/phase2-render-evidence.json). **Historical first-generation status:** technical rendering was complete, but its score-design quality was **NOT ACCEPTED as the template for Phase 3**; the subsequent v2 editorial GO below supersedes this status. The [pre-Phase-3 composition-quality audit](AUDIO_AUTHORING.md#pre-phase-3-musical-quality-audit--31-october-2026) found substantial source-level musical-development, harmonic-voice-leading, timbral and scene-specific escalation risks that require revision before scaling. No direct listening occurred, so neither audible failure nor musical success is claimed. This is separate from the deliberate Phase 9 owner-review gate. Under the owner's clarified workflow, comparative listening, listener fatigue and creative acceptance remain **unperformed and explicitly deferred to Phase 9**. Technical preview generation alone cannot establish artistic success. A separately tracked [Phase 7 decoded-cache/transition QA risk #699](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/699) will be evaluated before the owner-ready Phase 8 listening room, not treated as a Phase 2 blocker. The current 83 registered tracks are unchanged; the seven future Crown symphonic families (18 existing IDs) remain deferred. Internal studies may use temporary files, but there is no owner listening before Phase 9 and no standalone-room acceptance before Phase 8.

### Corrective pilot studies — source-first, not yet owner-accepted

Following [creative source review #701](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/701), the project now carries a **second authored pilot generation** in `tools/audio/phase2-pilots-v2.json` and `phase2-ensemble.py`, staged through `phase2-recompose.py`; the first eight preview score recipes and their historical measurements remain intact for comparison. Each of the four cases now has an explicit 3–4-section emotional arc, individually changing accompaniment/action textures, phrase-energy map, deliberately altered lead gestures and authored counterpoint. The source mapping calls for **Greenwood's preserved welcoming hook**, the **Archive's scholar gesture challenged by rescue urgency**, the **Cellars' domestic family motif reinterpreted in fragile global peace**, and **Lifebinder's winter-work cello material opposed by a sparse former-companion TRUE horn response**. None of this creates the future Crown score.

Source-only analysis shows substantially fewer accidental melody–basic-triad clashes, particularly at strong beats in the Archive and Lifebinder (details in [Audio authoring](AUDIO_AUTHORING.md#phase-2-corrective-composition-pass--revised-eight-pilot-source-31-october-2026)). **All eight revised MP3s were technically rendered/decoded in [focused CI #41171093136](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41171093136), with detailed [v2 evidence](../tools/audio/phase2-v2-render-evidence.json). This is not an audition or certified expressive sound**. The synthesis still relies on the original virtual instrument waveforms; the v2 render/decoder checks passed, while actual headphones/speaker experience and comparative internal acoustic judgment remain distinct **UNVERIFIED** gates. Owner listening remains Phase 9; the corrected Phase 2 source/technical disposition below resolves the original pre-scaling quality hold in [#701](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/701), while actual sound remains UNVERIFIED.

### Phase 2 exit gate after corrective source review
**Owner cross-chat sequence:** Phase 3 starts **only in a separate new chat**, using [master tracker #673](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/673) as the durable handoff, with no early owner auditions or silent production merges. This preserves a multi-chat plan while retaining source truth in GitHub.


**Phase 2 is GREEN for source composition and isolated technical engineering, NOT an approved or genuinely heard release score.** The first eight pilot programs were reworked as a distinct v2 candidate. [The formal source/technical/unknown-listening disposition](AUDIO_AUTHORING.md#phase-2-final-pre-scaling-disposition--source-go--technical-go--listening-unverified-31-october-2026) verifies four scene-specific score designs and 8/8 real MP3 renders ([CI #41171093136](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41171093136), preserved v2 hashes/measurements), with evidence/docs [CI #41171870832](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41171870832) also passed. No actual comparative listening, soundtrack registration, browser playback, merge or publication has occurred. The owner listens first in Phase 9; future compositions must meet the same independent sound-designer source-quality standard before scaling.

## The ten principal place identities

**Historical catalog metadata — not the new 65-cue composition mandate.** The Crown/Citadel rows are the 18-ID deferred family and remain playable placeholders. Each row gives the actual **base** cue, its source-derived musical palette, and an earlier creative idea to interpret only where consistent with the 26-family sound bible above. All ten places have separate base/encounter/after-liberation recordings at the same BPM; the related cue IDs are in the next section.

| Place | Existing theme | Source palette | Creative intent / listening guardrail |
| --- | --- | --- | --- |
| Greenwood Vale | **Orchard Roads** (`place-vale`) | 92 BPM · major · flute + harp | Welcoming woodland roads and inhabited countryside; preserve the flute-and-harp warmth rather than treating the first region as a generic battlefield. |
| Flooded Marches | **Reedwater** (`place-march`) | 82 BPM · dorian · piano + bell | Uncertain wetland atmosphere; the Dorian piano/bell palette should be recognizable even when tension increases. |
| Ironroot Highlands | **Payday on the Ridge** (`place-highlands`) | 88 BPM · mixolydian · horn + dulcimer | Work, stone and exposed ridges; horn and dulcimer distinguish this from both marsh and fortress music. |
| Ashen Frontier | **Embers Still Warm** (`place-frontier`) | 96 BPM · dorian · cello + guitar | Scorched territory without constant maximal bombast; the cello/guitar combination keeps human warmth amid damage. |
| Dark Crown | **Roads Beneath the Banner** (`place-crown`) | 84 BPM · minor · cello + piano | The weight of occupied authority; restrained minor cello/piano rather than a triumphal palace fanfare. |
| Forest Crypt | **The Unfinished Retreat** (`place-crypt`) | 84 BPM · dorian · cello + harp | A caretaker's unfinished seasonal retreat; preserve the sense of a place with personal history, not merely an anonymous haunted crypt. |
| Sunken Archive | **Restoration After Rain** (`place-archive`) | 86 BPM · dorian · piano + bell | A place of scholarship and restoration; piano and bells should leave room for quiet concentration rather than only watery horror. |
| Colossus Mine | **Veins and Old Stone** (`place-mine`) | 96 BPM · minor · horn + dulcimer | Deep stone and steady labor; horn and dulcimer carry a physical, worklike rhythm. |
| Abyss Bastion | **Purple Wings** (`place-abyss`) | 96 BPM · minor · horn + harp | The Dark Lord's personal dragon and flight project; the horn/harp combination should distinguish it from a generic infernal dungeon. |
| Citadel of Ashes | **The Machinery of Rule** (`place-citadel`) | 88 BPM · minor · cello + piano | Controlled, formal machinery of rule; measured cello/piano tension instead of indiscriminate orchestral chaos. |

These named identities were already part of the historical sound pass. This document does not authorize a new musical direction; it makes the old rationale easier to use alongside today's real cue recipes.

## Regional and dungeon variations: 30 music files

For the five outdoor regions and five main dungeons, the three source IDs follow the same scheme. The existing encounter cue is a **rhythmic/additive layer** aligned to the base track. A `peace-*` cue is a **global after-ending arrangement**, selected only after the actual full end-state, not merely after the site's boss is defeated.

| Location | Base / encounter / global peace |
| --- | --- |
| Greenwood Vale | `place-vale` / `action-vale` / `peace-vale` |
| Flooded Marches | `place-march` / `action-march` / `peace-march` |
| Ironroot Highlands | `place-highlands` / `action-highlands` / `peace-highlands` |
| Ashen Frontier | `place-frontier` / `action-frontier` / `peace-frontier` |
| Dark Crown | `place-crown` / `action-crown` / `peace-crown` |
| Forest Crypt | `place-crypt` / `action-crypt` / `peace-crypt` |
| Sunken Archive | `place-archive` / `action-archive` / `peace-archive` |
| Colossus Mine | `place-mine` / `action-mine` / `peace-mine` |
| Abyss Bastion | `place-abyss` / `action-abyss` / `peace-abyss` |
| Citadel of Ashes | `place-citadel` / `action-citadel` / `peace-citadel` |

**Outdoor extensions (10 files):** the outdoor regions also have a quieter settlement arrangement and a nighttime version. These are additional contextual variants, not new regions.

| Region | Settlement cue | Night cue |
| --- | --- |
| Greenwood Vale | `settlement-vale` — Orchard Roads — hearths and neighbors | `night-vale` — Orchard Roads — nightfall |
| Flooded Marches | `settlement-march` — Reedwater — hearths and neighbors | `night-march` — Reedwater — nightfall |
| Ironroot Highlands | `settlement-highlands` — Payday on the Ridge — hearths and neighbors | `night-highlands` — Payday on the Ridge — nightfall |
| Ashen Frontier | `settlement-frontier` — Embers Still Warm — hearths and neighbors | `night-frontier` — Embers Still Warm — nightfall |
| Dark Crown | `settlement-crown` — Roads Beneath the Banner — hearths and neighbors | `night-crown` — Roads Beneath the Banner — nightfall |

**When reworking a family:** keep the region's signature lead/texture recognizable. Inspect the exact recipe rather than assuming every variation shares identical orchestration. In particular, the after-liberation variants often switch from modal/minor tension into major harmony, with a softer piano, flute and/or harp emphasis. Encounter layers need exact synchronized timing/tempo with their base to prevent flams and drifting loops. Test entry, combat rise/release, night/settlement transitions and post-ending states by listening in the game.

## Treasuries and side interiors: 18 music files

These are deliberately **smaller-scale arrangements** for places that need an identity without competing with the outdoor score. Each has an existing base and after-liberation alternative.

| Interior | Base recording | Global peace | Existing palette |
| --- | --- | --- | --- |
| Scornfang's Treasury | `interior-supply-vale` | `peace-interior-supply-vale` | 92 BPM · dorian · piano + harp |
| Mirejaw's Treasury | `interior-supply-march` | `peace-interior-supply-march` | 82 BPM · dorian · piano + bell |
| Ridge Tyrant's Treasury | `interior-supply-highlands` | `peace-interior-supply-highlands` | 88 BPM · dorian · piano + dulcimer |
| Cindermaw's Treasury | `interior-supply-crown` | `peace-interior-supply-crown` | 84 BPM · dorian · piano + piano |
| Old Orchard Cellars | `interior-side-vale-cellars` | `peace-interior-side-vale-cellars` | 92 BPM · minor · cello + harp |
| Drowned Watchhouse | `interior-side-march-watchhouse` | `peace-interior-side-march-watchhouse` | 82 BPM · minor · cello + bell |
| Old Signal Keep | `interior-side-highlands-signal` | `peace-interior-side-highlands-signal` | 88 BPM · minor · cello + dulcimer |
| Ruined Shrine | `interior-side-frontier-shrine` | `peace-interior-side-frontier-shrine` | 96 BPM · minor · cello + guitar |
| Ruined Foundry | `interior-side-crown-foundry` | `peace-interior-side-crown-foundry` | 84 BPM · minor · cello + piano |

**Creative guardrail:** Treasuries are active defended sites and some are inhabited homes or workplaces; the old blanket description as resting spaces is incorrect. Cellars, watchhouses, signal keeps and shrines likewise have residents, occupations and material history. Do not default to empty dungeon horror. Do not turn every interior into another outdoor battle loop. The peaceful variants should preserve recognition while signaling a different world state; their exact harmony, notes and titles remain in the score book.

## Eleven boss families: 22 music files

Each family has an actual base boss cue and a separate, **synchronized additive TRUE layer**. The TRUE track does not need to replace the boss's theme: it intensifies the same musical clock. These are **eleven families**, including the Dark Lord—not eleven additional independent TRUE bosses.

| Family | Existing title and pair of source IDs | Music palette | Dramatic identity to keep in view |
| --- | --- | --- | --- |
| thorn | **Thorn Underfoot** · `boss-thorn` / `boss-thorn-true` | 116 BPM · dorian · flute + guitar | Woodland predator encounter; keep its distinct identity within the Vale palette. |
| crypt | **Keeper of the Summer Keys** *(obsolete catalog title; owner Q14 A requires renaming during score-authoring phase)* · `boss-crypt` / `boss-crypt-true` | 104 BPM · minor · cello + harp | Lifebinder: a former companion/mortuary professional protecting the unfinished **winter estate** and aware workers; no invented summer story. |
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

## Recorded sound effects: 30 cues

Effects are brief **event signals**—for instance release, travel, impact, warning, interaction or menu feedback—not little pieces of background music. The original [SFX recipe book](../tools/audio/sfx-book.json) contains all 30 ID-specific natural-language briefs; [the manifest](../assets/audio/manifest.json) contains the exact active recording paths and event bindings. The existing procedural effects remain available as fallbacks.

A sound replacement needs to preserve what the event communicates: recognizably different materials, release versus impact, target feedback and especially readable danger warnings. Prefer short, distinct transients to uniform cinematic booms. The source's guide for steel impact, for example, calls for a brief physical steel texture **without a voice, long tail or musical bed**. Audit the actual event and its neighbors before changing one effect; louder does not automatically mean clearer.

## A reusable composer / audio-generation handoff

The catalog already stores a `generationGuide` for each recorded asset. **Copy the specific guide from the manifest or audition room**, then use this supplementary brief structure when collaborating with a composer or external audio generator:

> Create an **original instrumental fantasy-RPG cue** for [exact place, boss or event]. Its job is [exploration / encounter layer / relief / night / settlement / TRUE escalation / effect]. Convey [the established location or character identity] while leaving room for combat warnings and interface feedback. Retain [lead, supporting instrument, BPM, mode, recognizable motif]. For a synchronized layer, match the source's meter, chord timing and exact musical loop duration. Favor a clean, repeatable phrase over a generic epic crescendo. No vocals or borrowed melodies. Compare the result with the current recording before approval.

This is a **future-facing brief template**, not a recovered original AI prompt. If exact reproduction is wanted, use the source score and synthesis recipe rather than prose alone. The generation guide describes intent but does not encode every note, timbre or mastering parameter.

## Phase 3 source-quality correction and blocked expansion — 31 October 2026

The completed **eight isolated sound files** described in [draft PR #704](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/704) are *technical composition candidates*, **not approved artistic assets**. The previous source GO was withdrawn after an exact note-level comparison found substantial gaps between several original hooks and the currently played new ones; the corrections must consider the recycled Greenwood and Archive v2 bases as well as six new themes. [`phase3-quality-review.json`](../tools/audio/phase3-quality-review.json) identifies the actual pitches/rhythms and per-area questions, with a regression test to prevent future source changes from making the critique stale. Its interval matches are diagnostic prompts rather than numerical creative grades.

All six new songs use the same inherited oscillator instrument synthesis/mastering. Although arrangements and instrument labels differ, **convincing individual tone, phrasing, release, mix, identifiable motif and long-session comfort have not been genuinely heard and verified**. Re-rendered MP3 duration, hash, peak and loop-edge checks do not cure those deficiencies. The owner did not authorize dropping the standard just because the next phase is large.

**Binding gate: Phase 3 source musical quality REVISE, old isolated technical encodes historically passed, genuinely heard quality UNVERIFIED; Phase 4 42-cue expansion BLOCKED.** Repair and critically compare the final actual notes, harmonic path, orchestration, timbre and musical pacing **before** generating derivative families. Real internal sound judgment must be documented honestly when obtainable, without asking the owner for early musical acceptance; Phase 9 remains the owner’s first audition. The new [audio budget PR #712](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/712) was merged and published separately, but greater capacity is not a musical-quality certificate. The 18 deferred Dark Crown recordings remain frozen.

## Listening, revision and acceptance

1. **Identify the actual cue** by stable ID and current game context in the source-backed 26-family sound bible. Developers may use independent proven playback for technical/critical music QC. **Do not ask the owner to listen to work in progress.** The owner first listens in Phase 9 through the Phase 8 certified standalone room, comparing base/action/global-peace or boss/TRUE **as a set** without playing a campaign.
2. **State the creative problem first:** melody, harmony, instrumentation, atmosphere, repetition, mix level, transition, event routing or a missing sound are different tasks. Record what should be preserved alongside what should change.
3. **Read the source metadata:** `tools/audio/score-book.json` for notes and musical recipe; `assets/audio/manifest.json` for the current asset title, generation brief, credits, hash and routing; the environment/SFX books for those sound types.
4. **Implement only approved changes** through [Audio authoring](AUDIO_AUTHORING.md). Keep IDs and routing stable unless a deliberate design change requires a migration. Re-render dependent synchronized layers together if harmony, tempo or loop length changes. Updating only prose does not create audio.
5. **Validate technically and musically inside production:** run the affected checks (including `npm run audio:check` where relevant), verify looping/crossfades/offline packaging, and independently verify warning clarity, headphone/speaker comfort, combat transitions and sustained replay where feasible. **Record unperformed physical-device checks explicitly**, never replace them with a source audit or force the owner to listen before Phase 9. Automated checks prove file and playback properties, **not** artistic success.

**Current source inventory (not creative completion):** 83 registered music + 14 environmental + 30 recorded effect assets = **127 total**; 65 songs are this cycle's creative work and 18 direct Crown music files are deliberately deferred. The soundtrack and related playback are implemented, but this guide makes **no claim** of a newly completed headphone/iPhone/Chromebook listening review, full-game regression suite or publication of fresh audio.

## Version history, not current work orders

The earlier [v0.8.90 sound-pass text](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/3765ed3bbbf67385561ba47b46887eda6ccf3e7c/docs/AUDIO_SOUND_PASS.md) records the original project's rollout, 83-cue score and release-verification intentions. It remains valuable provenance, but old test statements, version numbers, dates, release gates and the original development name must not be treated as today's instructions. For an exact playable build or deployment status, follow [Development state](DEVELOPMENT_STATE.md).
