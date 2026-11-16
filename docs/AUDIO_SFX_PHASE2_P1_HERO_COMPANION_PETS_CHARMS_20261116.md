# SIBDLP Phase 2 sound-design assessment — P1: heroes, companions, TRUE pets and Charmed creatures

**Design state:** source-reviewed proposal, **not** an implemented or individually approved WAV inventory. **Date:** 16 November 2026. **Audited base:** `main@409f0ed671b0ff2563f788bf45ab665e01c05ca6` (post-merge PR #880 / dev.289 source). **Owner authorization:** independently assess and document necessary sounds for the four existing playable classes, conventional companions, **all 11 TRUE boss pets** and **Charmed monsters**, then P2/P3. No sound registration, gameplay change, merge or publication is authorized by this assessment.

## Baseline and decision method

The live-source manifest has **30 registered effect WAVs** after Phase 1, **95 event keys**, **8 event keys with recorded mappings** and a procedural audio system. Existing hero-specific synthesis in `audio-hero.js` has substantial differences among class, slot, form, phase, combo and motifs; do not describe all 64 skill forms as silent or as 64 missing recordings. The currently recorded special IDs include `sfx-hero-steel-swing`, `sfx-hero-steel-impact`, `sfx-power-strike`, `sfx-holy-cleave` and `sfx-piercing-volley`. New recordings must provide a *perceptible new semantic identity*, not merely a second WAV that repeats a working procedural shape.

**Decision codes:** **ADD** = distinct new recorded transient/accent recommended; **LAYER** = new short identity may complement an existing recording/synth, with existing voice prioritized; **REFINE** = improve/reuse procedural shape first, no standalone WAV yet; **KEEP** = existing signal preferred. **Importance:** **A** recognizable recurring/action-critical; **B** specialist flavor or progression; **C** conditional after controlled A/B. This is a *creative production order*, not a defect severity or count guarantee. A/B hearing, tested event delivery and performance remain unverified.

### Automatic attacks, separate from Skill 1 Tap

| Actor | Existing baseline | Phase 2 sound-design decision |
|---|---|---|
| Paladin | Sword combo (steel); warm recorded swing/contact and combo gain variants | **KEEP/A:** retain recorded blade transients; **LAYER/B:** restrained metal/holy finisher accent only if the current combo finish is indistinct, never a second hit |
| Mage | Arcane combo/orb procedural release/contact | **ADD/A:** compact resonant arcane orb departure + small contact family; different from long beam; reuse variants for automatic 3-hit rhythm |
| Ranger | Bow combo; procedural bow string, shaft and contact | **ADD/A:** physically legible bow release and arrow contact family; reserve crisp rapid cadence for Rapid Arrows rather than a machine-gun loop |
| Rogue | Single hanging spherical jingle-bell basic, procedurally represented as tiny shell/rattle collisions | **ADD/A:** one recognizable *small jingle bell on a staff* physical-source identity, with dynamic 2/3-hit movement variants; no guitar, church/handbell or full musical tune |

### Four heroes — actual eight slots and normal/charged forms

**The two named forms share an authored skill slot.** Proposed records describe sound *families or layers*, not compulsory one-file-per-form replacements. Only play stages for which the engine emits real receipts; automatic combos are not Skill 1 Tap.

| Slot | Paladin | Proposed audio action |
|---|---|---|
| 1 | Radiant Strike / Radiant Cross | **ADD/A** focused holy projectile release vs four-arm two-pulse resolution; dynamic pulses synchronized to real `heroSkillArea`, no sound at bookkeeping completion |
| 2 | Sundering Strike / Holy Cleave | **LAYER/B** tempered blade cut with a weakening rasp; larger spread for charged, reuse existing sword release/contact; distinguish this *hero* Holy Cleave from the separately recorded *companion* Holy Cleave |
| 3 | Shield Stance / Shield Bash | **ADD/A** shield-up metallic latch and downward release; bash gets discrete shield face impact and push-air edge; do not loop while shield is held |
| 4 | Judgment / Grand Judgment | **LAYER/B** focused judgment sigil launch and larger resonant splash; no duplicate contact if projectile blocked |
| 5 | Holy Area / Consecrated Wave | **ADD/B** close consecration bloom vs travelling widening wave; small clean harmonic energy, not choir |
| 6 | Vanguard Rush / Vanguard Impact | **LAYER/B** real rush/footfall thrust and landing steel impact; charged adds controlled push-wave edge |
| 7 | Holy Assault / Oath Strike | **LAYER/B** repeated holy-blade/area language with a distinct oath attack accent only if distinguishable from slot 2 |
| 8 | Sanctuary Oath / Last Bastion | **ADD/A** bounded area strike followed by conditional self-heal/party ward realization; charged adds larger defensive bloom and Weaken, **never** an immunity cue |

| Slot | Mage | Proposed audio action |
|---|---|---|
| 1 | Arcane Beam / Wide Arcane Beam | **ADD/A** narrow luminous beam start and contact; charged sustained short beam-energy texture + bounded lane pulses, not repeated per target or on `complete` |
| 2 | Frost Bolt / Frost Burst | **ADD/A** icy bolt edge and local crystalline crackle, broader crystalline breakup for charged; distinguish from arcane orb |
| 3 | Spell Interrupt / Silence Field | **ADD/A** abrupt clean magical cutoff for successful interruption and stable low silence-field contour; do not assert interruption on blocked/missed strike |
| 4 | Arcane Fracture / Arcane Rupture | **LAYER/B** brittle harmonic split for vulnerability; charge expands fracture field without copy-pasted detonation |
| 5 | Force Pulse / Force Wave | **ADD/B** sub-bass-light pressure displacement and airy push tail, safe on small speakers |
| 6 | Magic Shot / Focused Arcane Beam | **REFINE/B** reuse orbital/beam family with shorter articulation and controlled focussed finish |
| 7 | Arcane Chain / Arcane Chainstorm | **ADD/B** stepped, source-timed chain sparks with capped variations; not one WAV triggered per enemy in large mobs |
| 8 | Astral Detonation / Arcane Cataclysm | **ADD/B** distinctive two-part charge/decompression identity, short explosion-free low body and airy top; preserve warning intelligibility |

| Slot | Ranger | Proposed audio action |
|---|---|---|
| 1 | Rapid Arrows / Hawk Interception | **ADD/A** repeated *actual* bow departures and **separate** original hawk wing/sweep arrival for charged; do not sound simulated flight/expiry as another attack |
| 2 | Pinning Shot / Pinning Volley | **LAYER/B** arrow release with distinct tense restraint/immobilizing pressure, additional streaks only at committed projectiles |
| 3 | Self-Heal / Party Heal | **ADD/A** subtle natural restorative flourish, broader allied response when the party is actually healed; avoid generic combat impact |
| 4 | Movement Haste / Companion Rally | **ADD/B** airy brisk mobility accent vs grounded company rally response; avoid constant running loop or spamming each ally |
| 5 | Arrow Volley / Arrow Rain | **LAYER/B** grouped bowstring textures vs wider intermittent arrow fall on actual resolved stages |
| 6 | Repelling Shot / Repelling Volley | **LAYER/B** harder arrow thock with short displacement tail, charged fan version; never sound a push if no contact |
| 7 | Piercing Arrow / Charged Piercing Arrow | **ADD/B** high-tension whistling release with crisp penetrating contact, distinguish from generic arrows |
| 8 | Hunter's Salvo / Grand Hunt | **ADD/B** characteristic multi-departure signature and final hunt accent, never an endlessly repeating loop |

| Slot | Rogue | Proposed audio action |
|---|---|---|
| 1 | Ding and Sting / Raise a Racket | **ADD/A** authentic one-bell jingle impulse and a *performance gesture* that develops from the same instrument; sound one actual release, not one per affected target |
| 2 | Lead Feet / Can't Dance | **LAYER/B** small dragged bell cadence + short weight/tempo disruption; do not imply literal leg shackles |
| 3 | Beat Breaker / Shut the Band Up | **ADD/B** snapped off-beat cut and an audible absence/closure of a pattern rather than a second danger warning |
| 4 | Sour Note / Rotten Chorus | **LAYER/B** slightly unstable rattle overtone and short descending sour response; no full musical song |
| 5 | Sticky Shuffle / Briar Boogie | **ADD/B** tacky/stationary rhythmic texture at actual cast, restrained protection accent for allies |
| 6 | Stolen Beat / Time Out | **LAYER/B** clipped rhythmic displacement and suspended-tick motif suggesting cooldown control; no invented frozen-time sound |
| 7 | Wrong Foot / Panic Party | **LAYER/B** stumbling offset and controlled group disruption, do not turn a tactical push into sonic slapstick |
| 8 | Bad Bell Day / Last Laugh | **ADD/B** strongest recognizable one-bell musical/impact punctuation; coherent with basic jingle and no Hollywood finale |

**Rogue canon:** one suspended oversized **spherical jingle bell on a staff**; player does not have a guitar or multiple handbells. Sound-design proposals must honor its small shell+rattle physicality, the existing performance system, and the current source's names/mechanics; provisional labels are not approval to revise skills. Existing `rogueBellBasic`, `rogueBellSkill1` and `rogueBellPerformance` are **real gameplay event receipts currently intercepted by the Rogue-specific procedural audio owner**. They are not registered recorded events; the Rogue branch in `audio-hero.js` returns after synthesis without calling `playSoundEvent`. A Phase 2 recorded bell therefore needs an explicit, tested branch at this exact owner, not a manifest entry alone. Skill 2–8 names are working/provisional presentation labels, not new owner-approved final terminology.

## Standard Soldier and Archer companions

| Action | Current source | Recommendation |
|---|---|---|
| Soldier basic steel contact | `melee` -> procedural soldierSteelImpact | **ADD/A** dry shorter ally sword contact vs hero steel; make ensemble tolerable |
| Soldier Power Strike | Existing `sfx-power-strike` | **KEEP/A** Phase 1 recorded impact; only optional tiny swing preparation accent on valid cast, never fake landed impact when blocked |
| Soldier Holy Cleave | Existing `sfx-holy-cleave` on companion charged area | **KEEP/A** distinct approved registered identity; verify warm/cold parity and no double sound from associated melee |
| Soldier defensive guard/ward | `spell(kind=soldierGuard)` procedural | **LAYER/B** single muted shield/ward engage, not continuous drone |
| Archer basic shot | `projectileLaunch`/impact procedural arrow | **LAYER/A** shared ranger arrow family with a slightly softer ally variant |
| Archer Triple Shot | Existing counted `projectileLaunch` synthesis (`count:3, releasedCount:1, pendingCount:2`) | **ADD/A** unmistakable three-part string cadence respecting *actual delayed shots*, no three fake simultaneous arrows |
| Archer Piercing Volley | Existing `sfx-piercing-volley` on charged-area receipt | **KEEP/A** use its registered transient; evaluate actual projectile contact separately |
| Ranger/companion healing and support | `heal`, support conditions and procedural callbacks | **LAYER/B** short restoration/assist acknowledgment once per genuine cast, not one chime per healed unit |

Ordinary allies, pets and Charmed monsters use common party voice budgets and can be numerous. Variants should be selected by role and true ability receipt; never multiply audio by squad count or projectiles fabricated before launch.

## All eleven TRUE-boss pets — individualized small-scale characters

`rules.js:petCompanions` defines exactly **eleven** families, recruited using established TRUE victory records. Every pet has basic combat and **Skill 1 / Skill 2**, which are not identical to hostile boss attacks. `party-pets.js` emits `petSkill` as **visual-only in the current audio router** (`soundKind` deliberately returns null). Existing basic `melee` and `projectileLaunch/Impact`, and skill impact `spell` (currently a generic magic-like accent), supply some playable feedback. The metadata has useful `petFamily`, `slot`, `stage` and `hits`, but those fields are **not all allowed in manifest `when` conditions**. Any selective pet family recording requires explicit routing and **replacing or attenuating** the related legacy sound, never simply making `petSkill` an extra uncontrolled voice. Proposed **ADD/B** = one family signature *component*, often reused across both pet skills in different shapes. Basic combat may borrow shared physical material.

| Family / pet | Skill 1 | Skill 2 | Proposed distinctive family palette and event |
|---|---|---|---|
| Thorn / **Thornpup** | Dynamic Entry | Tripwire | **ADD/B:** tight paw-launch with twig snap; compact fibrous ground snare on actual hit |
| Crypt / **Little Lifebinder** | Stay Alive | Algor Mortis | **ADD/B:** dry bone needle/click plus small healing after *landed* shot; chilled breath/ring for slow |
| Mire / **Mireling** | Hydraulic Hop | Little Inundation | **LAYER/B:** watery hydraulic rebound followed by soft splashes; use current wet family as base |
| Archive / **Pocket Keeper** | Water Jet | Undertow | **ADD/B:** pencil-thin pressurized water jet vs short suction line, no full ambiences |
| Ridge / **Little Treasurer** | Coinage Bonk | Rolling Cargo | **ADD/B:** precise coin-metal strike and bounded wood/axle rattle; **reuse** existing cargo system when correctly timed |
| Mine / **Pebble Colossus** | Punching Shear | Tiny Compaction | **ADD/B:** compact mineral fracture and short compression pulse; ward glint only on valid contact |
| Warlord / **Ash Cadet** | Cleaving Combo | Pursuit Sweep | **LAYER/B:** clipped military steel pair vs wider disciplined sweep; reuse steel and ally voice policy |
| Abyss / **Veyrith Whelp** | Compressor Puff | Wake Vortex | **ADD/B:** airy scaled-dragon compression pop and a small vortex swirl, never full-sized boss roar |
| Citadel / **Little Marshal** | Precise Contouring | Fractional Resurfacing | **ADD/B:** sharply measured cutting/tool-like sweep and fine resurfacing hiss; no projectile-flight sound for instant line/fan |
| Cindermaw / **Cinder Cub** | Little Cordon | Parens Patriae | **ADD/B:** ember ring scuff and compact protective claw/ward pulse; not continuous roar |
| Dark Lord / **Pocket Sovereign** | Veteran's Repertoire | Pathfinder's Gambit | **ADD/B:** miniature practiced blade doublet and precise directional follow-up; no fake triumphant finale |

**Pet guardrails:** no eleven cloned boss-sized explosions; no voice-over or animal cries invented as existing canon; make sound distinct by attack articulation/mass/medium, not loudness. Skill-2 0.65-second interruptible hold must not sound as a successful release if cancelled; ranged pet shot contact occurs later and may miss. Pet self-heal/ally heal/ward are conditional on actual hits, not automatically successful on any release. No new pet skills or progression requirements.

## Authenticated Charmed monsters — not generic human troops

**Source identity:** `party.js` preserves authenticated `charmOrigin`, uses `isCharmedCompanion`, and explicitly prevents these companions from inheriting generic Soldier/Archer special skill trees. It has **species-native ordinary maneuvers, trained Ringleader signatures, third heritage moves**, and separate night abilities for Wraith/Stalker, gated by real availability. Some legitimate heritage casts currently feed one existing procedural/recorded `spell` source; `charmHeritage` event itself is visual-only. Do not add a second audio voice or force all third skills to exist for all units.

| Species family | Native/heritage mechanic to respect | Phase 2 design recommendation |
|---|---|---|
| Goblin | Dust Entrainment; melee/ranged, stone slinger subtype | **LAYER/B:** faint gritty dust scatter / small stone slap; no teleport sound |
| Skeleton | Disarticulation; bone melee or bow guard | **ADD/B:** dry articulated bone shift and subtle projectile rattle |
| Mireling | Hydraulic Jump; wet/organic ranged subtype | **LAYER/B:** short watery pump + landing pressure |
| Reed Beast | Mud Pumping; wet spit | **LAYER/B:** thicker reed/wet reed-bed spit than mireling |
| Wolf | Crowd Dispersal; melee | **ADD/B:** lean paw rush / forceful snap; not generic roaring dog |
| Ogre | Lateral Load Transfer; melee/stone ranged | **ADD/B:** low stone/wood structural strain followed by restrained shove |
| Orc | Flank Command; axe ranged variant | **LAYER/B:** martial shifting footwork + metal/chop release |
| Archer | Bad Deal; arrow role | **REFINE/B:** bow timing, withdrawal and pinning accent from shared arrow family |
| Ash Beast | Broodscreen Roar; cinder projectile option | **ADD/B:** dry furnace breath / compact ash disturbance |
| Crown Guard | Reversal; shield/arrow variants | **LAYER/B:** disciplined steel shield reversal and curt formation click |
| Wraith (night) | Pressure Grouting heritage **plus separate Soul Drain** | **ADD/A:** spectral pressure seal vs restrained draining contour; both gated by correct real casts |
| Stalker (night) | Flank Command heritage **plus separate Shadow Pounce** | **ADD/A:** close shadow-footfall lunge and brief negative-space snap; no early collision report |

Trained Ringleader/guardian distinctions need an **intensity/silhouette accent** derived from the actual role/special, not one new file per named maneuver. The pending monster skill lore/name proposals in issue #870 / PR #871 are **not automatically current main mechanics**; check their implementation before attaching cues. Charmed skills use own allied provenance and do not borrow hostile boss/captain AIs. **Audit correction:** the ordinary/Ringleader Charmed native action can emit only `companionSkill` metadata after its gameplay resolution, which is deliberately silent in `audio-effects.js`; a native action is therefore **not guaranteed its own audible signature**. Its `companionSkill` payload currently lacks the species field, whereas `charmHeritage` and the paired `spell(kind=charmHeritage)` supply `species`. To make native/Ringleader identity audible, the later implementation must carefully add a factual, transient species/role/slot cue or explicit audio route at an existing committed event, with only one audible owner. Do not misclassify these as 12 already supported recorded skills.

## Independent post-task audit: actual audio ownership and a first executable pilot map

The initial palette review was artistically useful but did not establish an executable source-to-sound mapping. The following route evidence is **static-source verified** and must gate Phase 2 production. `ADD` still means *candidate for audition*, not an implemented WAV.

| Pilot candidate | Committed source receipt | Current audio owner and current state | Correct recording integration contract |
|---|---|---|---|
| Rogue one-bell auto / Tap / performance | `hero-combat.js:rogueBellBasic/rogueBellSkill1/rogueBellPerformance` | `audio-hero.js` Rogue-first procedural branch; currently **no recorded lookup** | Explicit optional warm-WAV lookup *inside that branch*, then original rattle on cold/failure, one cast one bell pattern; do not use fabricated `heroSkillCast` |
| Paladin sword combo and shield | Automatic `swing/melee`; Skill 3 actual `heroSkillCast`, shield lowered as separate existing effect | `effect.swordSwing` and `effect.heroSteelImpact` **already recorded**; Skill 3 procedural | Keep both recordings, audition only shield engage/physical bash via legal committed stage; shield-down must not sound as a new bash |
| Mage auto orb / frost / beam | `hero-combat.js` automatic combo; skill projectile flight/contact and `heroSkillArea` for charged beam | `audio-hero.js` procedural with class/slot, plus Beam stage source | Map selected real release or contact receipts to explicit **flat valid** director key, suppress matching synth only when warm; charged beam completion is bookkeeping |
| Ranger bow / hawk | Automatic bow receipt; `heroHawk` phase receipts for charged Skill 1 | `audio-hero.js` suppresses hawk `flight` and `expire` as deliberate silence | Short confirmed hawk *release or impact* candidate only; no faux flight/repeat or retreat success on cancelled action |
| Archer Triple Shot | `party.js:projectileLaunch` with `count:3,releasedCount:1,pendingCount:2` | `audio-effects.js` synthesizes `tripleShot` as three quick impulses at the initial event | For recorded identity test the actual staggered projectile departures; do **not** schedule additional false impacts or count all three as simultaneous real launches |
| Eleven pet family signatures | `party-pets.js:petSkill` at release and impact, with real separate projectile/melee/spell events | `petSkill` intentionally silent; generic `spell` accent after actual skill contact | Add only an explicitly selected sound owner with family/slot/stage facts and **replace/duck**, not double the generic contact; 11 different pet families are not 22 mandatory WAVs |
| Charmed native / Ringleader | `party.js:companionSkill` on committed native/Ringleader move | deliberately silent in `soundKind`, lacks species payload | Add precise transient species/role/slot metadata at source and one audio owner; no audio tied to damage loop, no hostile AI |
| Charmed heritage / Wraith or Stalker night | `party.js:charmHeritage` + `spell(kind=charmHeritage, species)` | only existing `spell` owns one sound (material/generic) | Differentiate at the already-audible cast using allowed species predicate or explicit legal flat event key, no second sound on `charmHeritage` visual receipt |
| Soldier Power Strike / Holy Cleave, Archer Piercing Volley | Actual companion skill releases/impacts | Phase 1 registered `effect.powerStrike`, `effect.companionHolyCleave`, `effect.piercingVolley` | **KEEP** first and verify actual A/B; no replacement justified merely by inclusion in this matrix |

**No new feature, pet availability, Charm capture opportunity or additional class is implied.** The pilot descriptions do not authorize production until source-route, collision outcome, warm/cold fallback and busy-combat mix tests are specified per cue.

## Proposed recorded families for subsequent production (no fixed file quota)

1. **First audition set (A):** Mage orb vs beam, Mage frost, Ranger bow/hawk, Rogue single-bell basic/performance, Paladin shield/ward, Soldier basic vs existing Power Strike, Archer Triple Shot, and one Wraith/Stalker allied signature. Distinct release/contact files are warranted only for independently audible phases.
2. **Second audition set (B):** per-pet signature family with explicit Skill 1 and Skill 2 variations, plus 12 Charmed-family overlays, *reusing* material masters where effective. Promote only the candidates that survive role-based A/B and congested battle-mix evaluation.
3. **Contextual synthesis to preserve:** reactive enemy count, target-dependent chain/volley, detailed charge rise, changing pulse counts, unique hit locations, movement surfaces, warning priority and routine ally attacks where layered synthesis works better than static samples.

## Execution-ready audio routing and acceptance contract

- Inventory exact event/skill/profile metadata from `hero-presentation.js`, `hero-combat.js`, `party.js`, `party-pets.js` and `audio-hero.js` **again at Phase 2 implementation HEAD**. The documented labels are current-source presentation names, not a promise every form is available under every save.
- **CORRECTED AUDIO CONTRACT (independent audit):** the existing manifest validator `audio-contract.js` only accepts *one-dot* director keys of the form `effect.<singleSlug>`, `interface.<singleSlug>`, `step.<singleSlug>`, or `ambience.<singleSlug>`; nested keys such as `hero.paladin.1.normal.release` are currently **invalid**. Although `audio-hero.js` experimentally asks for dynamic `hero.<class>.<slot>.<form>.<phase>` strings, these cannot be registered without a deliberate, tested schema/runtime migration. **Recommended conservative route:** use valid flat `effect.hero-paladin-1-release`-style keys (examples, not registered names), looked up by an explicit audio-owner mapping from the actual hero event. Do not simply append invalid keys to the manifest. Only the allowed `when` fields from `audio-contract.js` may be used (e.g. `class`, `role`, `species`, `skillId`, `stage`, `variant`); `petFamily`, `slot`, `skill`, `source`, and `kind` are **not** permitted predicates. Register a matching real event delivery path or the recording is unreachable. Preserve current procedural fallback.
- Each candidate requires: exact gameplay-producer event, release vs contact vs conditional effect, canonical material, timing, one-voice policy, priority/gain relative to critical warning, old/fallback behavior, A/B sample, performance/voice budget, and EN/ES Sound Library label.
- Test projectile misses/blocks, re-aims, multi-contact AOEs, combo cadences, cancelled charge, ranged pet delayed contact, healing-only-on-hit, heavy crowd, active reserve/charm roster and realistic phone-speaker output. Never write campaign/save state from an audio callback.
- Source review is **COMPLETE for design triage**, not a claim of full earned playthrough or listening verification. New assets, exact cue number, acoustic acceptance, mobile hearing, mixing and gameplay are **AWAITING PRODUCTION/ACCEPTANCE**.

## Primary source anchors

- [Source hero slots/basic and visuals](../src/prototype/hero-presentation.js); [hero audio](../src/prototype/audio-hero.js); [actual hero casts](../src/prototype/hero-combat.js).
- [Companion combat, Charmed provenance and skills](../src/prototype/party.js); [all 11 pet action routes](../src/prototype/party-pets.js); [pet/companion and heritage rules](../src/prototype/rules.js).
- [Shared effect sound router](../src/prototype/audio-effects.js); [procedural notes/silence](../src/prototype/audio-catalog.js); [recorded event binding](../src/prototype/audio-recordings.js); [registered assets](../assets/audio/manifest.json).
- [Phase 1 integration/rollback](AUDIO_SFX_PHASE1_20261116.md), [original SFX owner issue #877](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/877).

**Boundary:** This is Phase 2 *design documentation*. No user/player-facing asset, code, skill, save or published sound has changed.
