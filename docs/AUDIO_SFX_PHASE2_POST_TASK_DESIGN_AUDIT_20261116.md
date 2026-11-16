# SIBDLP Phase 2 SFX — independent post-task sound-design and executability audit

**Audit date:** 16 November 2026. **GitHub source reviewed:** `main@409f0ed671b0ff2563f788bf45ab665e01c05ca6`. **Design branch:** `design/audio-sfx-phase2-source-audit-20261116`, draft PR #887. **Product baseline:** Phase 1's 30 replacement WAVs are merged through PR #880. PR #881 is a **different unmerged experimental draft**, not live sound inventory. **Audit question:** Is the proposed three-priority Phase 2 sound *design* a faithful, technically actionable, appropriately restrained guide to audio production, and are its claims supported by current source?

## Verdict and evidence boundary

**POST-CORRECTION DOCUMENTATION VERDICT: PASS for a source-grounded creative production brief; CONDITIONAL for individual candidate integration.** The three priority ledgers, this audit and the master handoff now give source identities, differentiated acoustic intentions, reusable versus genuinely new candidates, event ownership risks, and sequential production gates. The initial draft **did not pass** executability review: it proposed invalid manifest keys, overstated audible ownership of some companions, and treated some recruitment events too generically. Those findings were corrected within the original P1/P2/P3 documents, rather than merely hidden in this report. A **production cue is not accepted** until its actual event-to-audio path, real-game playback and by-ear A/B have been independently demonstrated.

**What was done:** static primary-source inspection, adversarial design reasoning, source-to-proposal reconciliation, document revisions and GitHub source/diff verification. **What was NOT done:** new candidate WAV creation, signal analysis of hypothetical WAVs, physical-device audition, level-matched sound A/B, actual game-mix testing, edited combat/engine/saves, source integration tests for future routes, deployment, owner artistic signoff or merge. Previously successful PR documentation CI does not certify unseen audio.

## Independent audit criteria and outcomes

| Quality criterion | Outcome | Evidence and disposition |
|---|---|---|
| **Coverage of owner scope** | **PASS** | Four heroes with eight normal/charged slots **and separate automatic basics**; Soldier/Archer; all 11 existing TRUE pet families with both specialist slots; all 12 authenticated Charmed species (including separate night/heritage), 11 bosses, five captain profiles, 12 ordinary enemy species, interface/progression/feedback |
| **Continuity of live vs draft source** | **PASS** | Main's 30 effects and 95 event keys (eight bound, remaining 87 without direct recorded mapping) are differentiated from draft #881 and unmerged monster naming #871; old records are not mistakenly represented as published changes |
| **Physical sound identity vs generic noise** | **PASS FOR BRIEF** | Distinguishes holy, steel, arcane/orb/beam/frost, physically accurate Rogue single jingle-bell, bow/hawk, bone/wet/stone, unique boss signature timing, army/companion and tactile progression. Auditory quality itself is unverified |
| **Need-driven asset scope** | **PASS** | ADD/LAYER/REFINE/KEEP/INVESTIGATE design decisions explicitly allow reusing 24 enemy material stages and current synth; neither 87 missing bindings nor every skill, pet or VFX identity imposes a file quota |
| **Real event routing** | **FIXED / GATED** | Core initial flaw: the manifest forbids nested hero event keys, Rogue uses an early procedural-return branch, pet and Charmed event metadata are not automatically audible. Revised ledgers now distinguish true sources, allowed validator fields, direct binding, possible source-only event additions and known silent ownership |
| **Attack timing and gameplay semantics** | **PASS FOR SOURCE RULES** | Separate release/contact/miss, canceled holds, delayed projectiles, pet on-hit heal/ward, nondamaging Slow/ward/phase, boss multi-pulse, summons and Charm success. **Runtime outcome evidence is still a production gate** |
| **Named bosses and captains** | **FIXED** | First pass named 11 bosses with action descriptions but five captain entries were generic. P2 now lists Scornfang, Direjaw, Crag Tyrant, Dreadmaw and Cinder Warlord with real skill families, special phases and runtime ownership |
| **Event-to-sound uniqueness** | **FIXED / GATED** | The first design mentioned duplicate-hit dangers but lacked exact routes. P1 now names silent `petSkill`/`companionSkill` and the separate `spell` fallback; P3 specifies `questComplete` + `quest` and sound on actual recruitment/Charm success |
| **Mix hierarchy and fatigue** | **DESIGN PASS; LISTENING PENDING** | Preserve enemy danger warning foreground, existing voice caps and cooldowns, restrained level/short tails; audition simultaneous allies, crowded hostile attacks, loot spam, UI scrolling, phone mono and headphones. No unsupported LUFS or loudness claims |
| **Localization, offline and compatibility** | **GATED** | Existing Sound Library and EN/ES descriptive labels, asset provenance/hashes, cold/warm fallback, v4 saves, mobile browser/PWA/offline and original identity rollback are mandatory integration gates, not accomplishments of the design review |
| **Implementation/release governance** | **PASS** | No code/asset work authorized by merely reviewing the design; PR #887 is documentation-only, draft, unmerged; main, Pages, PWA, external testers remain protected |

## Findings: reproduced from source, severity and resolution

### F01 — High: invalid proposed recorded-event key syntax (**corrected**)
Initial P1 suggested `hero.<class>.<slot>.<normal|charged>.<stage>` as a manifest key. `src/prototype/audio-contract.js` validates only `/^(effect|interface|step|ambience)\.[a-zA-Z0-9_-]+$/`; additionally the available `when` allowlist omits `petFamily`, `slot`, `skill`, `source`, `kind`, `reforge`. `audio-hero.js` currently tries a dynamic `hero....` lookup, but no such keys are registered and the validator rejects nested keys. **Repair:** P1 requires explicit *valid flat* `effect.<slug>` registrations plus source-owned mapping; schema expansion is deliberately **not** an accidental prerequisite. This fixes the design instruction, not the runtime.

### F02 — High: Rogue bell already sounds, but has no recorded lookup (**corrected**)
`hero-combat.js` genuinely emits `rogueBellBasic`, `rogueBellSkill1`, `rogueBellPerformance`. `audio-hero.js`'s first Rogue branch synthesizes shell/rattle clicks then returns, *before* the generic hero recording lookup. Merely registering a new WAV would do nothing. **Repair:** P1 identifies this precise branch as the required optional warm-recording owner, preserves old procedural fallback and the canon of **one small suspended spherical jingle bell**, and treats Skill 2–8 presentation names as working labels.

### F03 — High: Charmed native ability identity was overstated (**corrected**)
`party.js:charmedCompanionSkill` emits `companionSkill` for native/Ringleader outcomes, but `audio-effects.js:soundKind` intentionally returns `null` for this event. It lacks the `species` metadata needed for an unambiguous family recording. By contrast `charmedSpeciesSpecial` emits `charmHeritage` (visual metadata) **plus** a genuine `spell` with `kind=charmHeritage,species`, which already provides one generic sound. **Repair:** P1 now marks any new native/Ringleader recording as a **proposed transient metadata/audio-owner change** and heritage as a **replacement or controlled layer** on the already audible spell—not a guaranteed already audible distinct Charmed skill.

### F04 — High: TRUE pet sound could double or falsely signal hit (**corrected**)
`party-pets.js` emits `petSkill` release/impact metadata, while the audio router explicitly suppresses that key and already receives `melee`, `projectileLaunch/Impact`, and generic `spell`. New skill-family WAVs cannot simply be attached to the silent `petSkill` receipt without compensating for duplicate playback. **Repair:** P1 requires an explicit one-owner route using accurate `petFamily,slot,stage,hits` data outside unsupported manifest predicates, with genuine delayed contact, miss/block and conditional heal/ward checks.

### F05 — High: success-feedback producers were assumed uniform (**corrected**)
`party.js:resolveRecruitmentRequest` emits `companionRecruitment` after deferred success, but `party.js:recruit(type)` succeeds without that receipt; `party-pets.js:recruitPet` also succeeds without a dedicated event. `hero-combat.js:rogueCharmAttempt` **does** emit `rogueCharm` after lawful capture, but current audio fallback has no sound note or recorded binding. **Repair:** P3 now documents these **specific** paths and the need for narrowly scoped observation-only success receipts rather than manifest-only false coverage. Do not change the underlying transactions, RNG, party or save.

### F06 — Medium: purchase and quest feedback were conflated (**corrected**)
`progression.js:purchase` is an equipment tier/reforge receipt with `slot,tier,reforge`, not a demonstrated universal merchant purchase; the `upgrade` skill progression is separate. `rewards.js` emits `questComplete` and `quest` together, each currently mapped to a note pattern. `engine.js:gold` is emitted per pickup entity, not every individual crown. **Repair:** P3 now uses exact semantics, rejects forbidden manifest `when.slot/reforge` predicates, and flags duplicate celebratory sound suppression.

### F07 — Medium: captain palette lacked actual encounter identity (**corrected**)
Initial P2 had five mostly generic region-based palettes and omitted key characters. `rules.js:roomCaptains` and `dreadmaw-combat.js` identify the real five: **Scornfang** (tracking/dust/scramble), **Direjaw** (wet/molt, **zero-warning Flow Sliding**), **Crag Tyrant** (paid/stone/coin and hostile liquidation; not a wolf), **Dreadmaw** (agricultural ash, soil, livestock and defense; not merely Cindermaw's noise), and **Cinder Warlord** (inspection and Mandatory Overtime of **existing** workers, not spawn). **Repair:** replace the generic table in P2 with actual skills, phase cues and key exclusions.

### F08 — Medium: boss-specific mapping was aesthetic but insufficiently actionable (**corrected as design contract**)
`enemy-vfx-events.js` supplies actual `skillId,stage,variant,family,profile` and `audio-enemy.js` calls `playSoundEvent('effect.' + d.key, details)`. Existing manifest `effect.enemyRelease`/`effect.enemyImpact` have material fallbacks. **Repair:** P2 now describes a conservative exception strategy: **specific, validator-allowed `when.skillId` binding ordered before generic material entries**, or another explicit demonstrated owner for custom stages, with real release/contact and no imagined condition. **Actual runtime binding and audible test still needed.**

### F09 — Medium: subjective output and device-mix acceptance cannot be inferred (**open gate, not a documentation defect**)
There are no generated Phase 2 recordings to assess. No credible isolated-wave mastering, source-quality, psychoacoustic, crowded-combat, browser decode, or physical phone playback result can be reported. **Disposition:** keep sound-family decisions as audition candidates; a failed A/B may downgrade ADD→LAYER/REFINE/KEEP. No claim of owner listening approval.

## Sound-direction quality rubric for the forthcoming pilot

Each proposal must survive the following *auditory* checks before being included as a recorded replacement:

1. **Recognition without UI:** on an equalized, gain-matched blind A/B, the listener can identify the material/action class better than with the current warm WAV/procedural reference; a visually attractive name alone does not count.
2. **Physical semantics:** attack transients match material mass, geometry and direction (string/shaft for arrows; shell/clapper rattle for Rogue; dry bone, wet suction, mineral fracture, small animal paw for appropriate contexts). The game is whimsical but not a parody soundboard. Boss vs miniature pet preserves scale.
3. **Temporal truth:** distinct windup, committed release, delayed physical contact and conditional completion. A miss is not an impact; cancellation isn't triumph; blocked abilities do not play success; multi-hit may reuse short phrase only on actual receipt.
4. **Silence, frequency balance and sonic fatigue:** enemy danger warning remains intelligible; keep low-frequency body modest for phone speakers, upper transient non-fatiguing, short decays, no continuously held enemy or UI sources, and no high repetition across many allied creatures.
5. **Originality and coherence:** project-authored sample/synthesis recipe or properly licensed provenance, no unwanted field-recording claim, no speech/music contamination, coherent sonic palette across regions and EN/ES.
6. **No gameplay alteration:** effects are cosmetics. No saved actor fields, Charm probabilities, pet unlocks, boss attacks, collision, cooldown, reward, input, renderer or asset-cache behavior changes merely to produce audio.

## Recommended first implementation *pilot decisions* — proposals, not a quota or approval

| Pilot | Why audition this first | Minimum exact route proof before producing a binding |
|---|---|---|
| **P1: Rogue single-bell basic/Skill 1** | Strongest absent recorded class identity and a discrete known source owner | Real `rogueBellBasic` and `rogueBellSkill1` receipt in `audio-hero.js`, warm WAV vs existing procedural; combo/charged cadence, no double contact |
| **P1: Mage orb and/or Paladin shield** | Tests whether a distinctive hero family meaningfully improves high-use gameplay over substantial synth | Precise automatic launch/contact or Shield Stance enter/lower/Shield Bash outcomes, valid flat key, no hit sound for shield lowering |
| **P1: one ranged TRUE pet + one Charmed native and night example** | Validates the hardest current routing risks before producing a giant library | Authentic pet release/impact owner without generic spell doubling; Charmed native species fact and actual heritage spell source; real unlock/accessibility |
| **P2: one boss move with true contact/miss and one nondamage phase** | Tests specific `skillId` matching, warning and staged resolve without generic boss explosions | Actual `enemyVfx` identity with `stage`; one `when.skillId` exception before material fallback; nondamage phase only if a real event exists |
| **P2: one captain (Dreadmaw or Direjaw)** | Validates custom combat owner and special stage cases rather than relying on purely generic captain templates | `roomCaptains` and custom resolver against emitted `enemyVfx`, no manufactured warnings for Direjaw's Flow Sliding |
| **P3: quest/skill-learning and Barracks construction** | Representative, meaningful progress and a high-risk duplicate quest confirmation | Earned transaction with exactly one intended success voice, existing `questComplete/quest` or `construction`, no playback on an uncommitted click |
| **P3: one actual pet recruitment or successful Rogue Charm** | Validates intentional new transient success receipts in company management | One receipt after irreversible genuine success; no recording on blocked attempt, failure, duplicate admission or merely opening a menu |

**Batch size is selected after focused A/B.** This pilot list is a *learning order* for later production, not a promise to create seven files or nine recordings. More than one actual stage may justify two short files; several semantic actions may share one.

## Execution gates that must not be silently bypassed

1. **D — Design/documentation:** corrected three ledgers + master handoff + this independent audit are complete, and proposed cues are accurately classified. *The current PR #887 may remain draft until owner explicitly authorizes integration of its documents.*
2. **R — Current event-contract proof:** before each cue, recheck live main and open PRs; map exact emitted payload and legal manifest key/when; prove audio delivery in both cold and warm states, failures and silence.
3. **A — Creative candidate audition:** reproducible source recipe, original/licensed provenance, transient/spectral identity, controlled matched-level A/B against current sounds (include crowded game mix and small speakers), documented keep/revise/reject and no arbitrary WAV count.
4. **T — Engineering validation:** source unit tests for event ownership/conditions, WAV codec/hash/repeatability, actual Chromium/WebKit browser playback, heavy combat, interrupted/blocked/missed attacks, PWA/offline rollback, EN/ES Sound Library and no v4 save changes.
5. **H — Human-device acceptance:** physical iPhone and/or Chromebook listening for identity, loudness, mix, dynamics, duration and fatigue; absent evidence is **UNVERIFIED**, never “passed”.
6. **S — Release authority:** no merge, deploy, Pages player-facing PWA update, external tester contact or class/content expansion without applicable owner authorization.

## References and audit trail

[Main hero skill list](../src/prototype/hero-presentation.js) · [Actual hero casts and Rogue success](../src/prototype/hero-combat.js) · [Hero audio special branch](../src/prototype/audio-hero.js) · [Canonical creature and pet rules](../src/prototype/rules.js) · [Party Charmed and recruitment](../src/prototype/party.js) · [TRUE pet actions and admission](../src/prototype/party-pets.js) · [Boss descriptions](../src/prototype/data.js) · [Boss/captain presentation](../src/prototype/enemy-presentation.js) · [Boss stage observer](../src/prototype/enemy-vfx-events.js) · [Enemy audio selector](../src/prototype/audio-enemy.js) · [Existing sound fallbacks](../src/prototype/audio-effects.js) · [Event schema validator](../src/prototype/audio-contract.js) · [Actual audio forwarding](../src/prototype/app.js) · [Recorded manifest](../assets/audio/manifest.json) · [Progression and purchase](../src/prototype/progression.js) · [Quest payout](../src/prototype/rewards.js) · [Loot pickup](../src/prototype/engine.js).

**Final distinction:** The post-task audit *passes the corrected source-grounded planning quality gate*. It does **not** certify individual audio recordings, currently absent, or authorize their production/release. Its highest-value result is turning a broad artistic ambition into a **verifiable staged sound-design workflow with known actual signal paths, real character identity and failure cases**, without changing gameplay.
