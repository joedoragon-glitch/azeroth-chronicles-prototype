# SIBDLP SFX Phase 2 — complete three-priority sound-design handoff (16 November 2026)

**Classification: DESIGN AUDIT / PROPOSED NEW SOUND IDENTITIES — no assets or implementation.** **Source snapshot:** `main@409f0ed671b0ff2563f788bf45ab665e01c05ca6`, `0.9.1+snapshot.dev.289` in `build-info.js`. The owner instructed an autonomous, **sequential** sound-design assessment of (1) four playable classes + ordinary companions + TRUE pets + authenticated Charmed monsters, (2) bosses + distinctive enemies, (3) interactions + progression, followed by complete documentation before authoring new Phase 2 recordings.

**READ THESE THREE RECORDS IN ORDER:**

1. [P1 — all four playable classes, Soldier/Archer, eleven TRUE-boss pets, twelve Charmed families](AUDIO_SFX_PHASE2_P1_HERO_COMPANION_PETS_CHARMS_20261116.md).
2. [P2 — eleven bosses, five captains and twelve enemy species](AUDIO_SFX_PHASE2_P2_BOSSES_ENEMIES_20261116.md).
3. [P3 — interface, loot, skills, quests, company/Barracks, recruitment, discovery and travel](AUDIO_SFX_PHASE2_P3_INTERACTION_PROGRESSION_20261116.md).

## Reconciled current state — do not mistake earlier snapshots for current source

| Matter | Actual status / evidence / disposition |
|---|---|
| Recorded current effects | **30** manifest WAV IDs; 12 material release/impact pairs + warning, hero blade, Power Strike, Holy Cleave, Piercing Volley; `main` has Phase 1 manager `sfx-phase1-original-hybrid` and 48-kHz replacement source. **IMPLEMENTED IN MAIN SOURCE** |
| Phase 1 PR #880 | **MERGED** and integrated to main, with archived original WAVs, per-binding rollback and documented focused testing. Its current main source does not imply a physical owner-device acoustic acceptance report. **SOURCE COMPLETED; listening/device independently UNVERIFIED** |
| Pilot PR #881 | **OPEN DRAFT / UNMERGED** A/B/experimental 30 + ten studies. Its sounds are **not** extra live registrations; do not count or auto-merge. **SEPARATE UNVERIFIED/DEFERRED experiment** |
| Sound/event catalog | **148** registered recorded assets = 84 music + 34 ambience + 30 effects; **95** director event keys, **8** with direct recorded bindings and remaining **87** without direct WAVs. Many have procedural sound, deliberate silence or future use. **SOURCE VERIFIED, NOT 87 DEFECTS** |
| SFX Phase 2 | **OWNER-AUTHORIZED DESIGN AUDIT COMPLETED IN THESE DOCS**. New recordings, runtime bindings, WAV counts, artistic acceptance, actual game-mix tests and release are **NOT YET IMPLEMENTED OR EARNED** |
| v0.9.2 | **FUTURE functional-completion milestone**; do not call Phase 2 a functional prerequisite or broaden gameplay. Preserves four classes, established mechanics, EN/ES, v4 saves, renderer/PWA integrity. **SEPARATE OWNER-PRIORITIZED milestone** |

**Do not confuse current-source implementation with public GitHub Pages deployment or an installed iPhone/Chromebook update.** Confirm each separately if needed for production acceptance.

## Independent design results at a glance

| Priority | Existing systems already capable of audio | What is genuinely worth new short recordings or staged layer prototypes | What should *not* become a recording quota |
|---|---|---|---|
| **1 — Heroes/party/pets/Charmed** | Hero per-slot/form/cast-stage synth, 5 registered hero/ally specials, Soldier/Archer skills, actual pet release/impact, authenticated species actions and Rogue one-bell | Class signature families (Mage orb/beam/frost, Ranger arrow/hawk, Rogue physically accurate bell, Paladin shield/ward); Archer Triple Shot; subtle common ally baseline; voice-free family-specific pet and Charmed overlays after A/B | 64 hero normal/charged forms, 22 pet ability rows, 12 monster species or all Charm names do *not* mean one WAV per row |
| **2 — Bosses/distinct enemies** | 24 warm material pairs, global dangerous windup warning, actual stage routing, materials/personality/motifs, moving cargo procedures | Key *recognizable* attacks for all 11 boss families (real leap vs miss, cold wave vs non-damage, suction, cargo, mine collapse, military bombardment, dragon wakes, Veyra tile abrasion, Cindermaw ring/claw, Dark Lord blade cadence), then selected captains/night threats | 46+ boss entries / normal+TRUE duplicate masters; 251 historic VFX identities; invented hazards or non-live proposed moves |
| **3 — Interactions/progression** | 40 event-note synths, six UI procedural sounds, five distance-based footsteps, six scene detail generators, 34 recorded ambience beds | Clear success states for learning, level, quest completion, gold/items, Barracks construction/upgrade/recruitment, pet/Charmed acceptance where verified, company/exploration/discovery; lightweight contact materials | 95 event keys, 87 empty WAV mappings, all buttons, ambient loops, per-unit healing, all status icons, routine footsteps without a positive A/B |

## Sound-design hierarchy and selection rule

**Tier A — foundation audible identity:** hero basic/class separator and skill-1 physicality, Rogue single-bell authenticity, key crowd-limited ally skill; 11 boss families' most legible gameplay-signature attacks; high-value progression success (quest/skill/level, actual construction, item/coin and meaningful recruitment). **Tier B — distinctive depth:** unique Skill 2–8 mechanical signatures where the current synth loses distinction, pets and Charmed family coloring, boss secondary signatures and captain/protected-phase identity, support, resources and discoveries. **Tier C — only if auditions justify:** ordinary species minor variants, optional footstep foley, interface micro-click recordings, rare conditional UI/world motions.

A proposed **ADD** or **LAYER** is a rationale to produce a *controlled audition candidate*, **not** unconditional permission to replace current playback. Prefer improving/reusing the Phase 1 physical material masters and current procedural sound when they are already contextually and perceptually sound. Keep a single coherent project-owned sound-world with material logic, restrained dynamics, silence where meaningful, and no forced cinematic bravado or added music.

## Cross-cutting technical conditions before production

1. **Audit HEAD again before producing:** inspect actual active PRs, any changes to `hero-presentation`, `rules`, pet/Charm routes, monster skill implementation and event mappings. The three ledgers are frozen source-grounded design proposals; newer owner choices supersede drafts. In particular, monster skill-name #870/#871 work is not automatically live actions.
2. **For each candidate, fill a production row:** `proposal-id`, owner priority, player action, exact emitted event and source line, actor/class/species/family, attack/stage/form, current recorded asset / procedural fallback, proposed source recipe, layer/mix objective, loudness target, null/blocked/miss behavior, frequency and priority, localization-neutral title + EN/ES label, validation evidence, and KEEP/REVISE/ACCEPT status. These fields are a *future production manifest*, not already captured waveforms.
3. **One action = one intentional audible result:** a cast might legitimately have *departure* then *contact* (separated), but neither a visual `petSkill` receipt nor `companionSkill` metadata may double the corresponding real combat sound. Protect interrupted casts, misses, shield-only consequences, projectiles with delayed launches, area hits with dozens of targets, TRUE phase changes, real enemy summons, Rogue performance and no false reward.
4. **Audio safety:** critical warning first; short sounds on correct effects/interface bus, existing ducking/voice caps, no unbounded source creation, no repeated long tails, correct cold/failure fallback, no ghost hits, correct per-cue gains relative to old/new Phase 1 recordings. Music (84) and long ambience (34) are out of scope.
5. **Use the *existing* Game Sound Library:** clear subcategories **Heroes**, **Companions**, **TRUE Pets**, **Charmed**, **Bosses**, **Captains/Enemies**, **UI & Progression**, with nested short filters by identity/role/stage rather than an unsortable flat list or second sound room. Current main offers a 30-effects shortcut, not completed Phase 2 categories; this is a UX proposal. A/B should distinguish actual current recording, current procedural gameplay reference and proposed WAV, with player-action labels and no fake “live game” badge.
6. **Verification stages are separate:** (i) source inventory and event-to-role checks; (ii) deterministic WAV signal/codec/hash/provenance; (iii) actual real-browser playable event routing and mix, including desktop/phone emulated; (iv) offline/PWA/cache/source rollback and regression; (v) physical iPhone/Chromebook + human by-ear aesthetic and fatigue acceptance; (vi) explicitly authorized merge and published-build confirmation. **This audit performed (i) as static source/design review only; none of (ii)–(vi) are claimed for any Phase 2 assets.**
7. **No new mechanics or saves:** do not change hero classes/skills, pet availability/TRUE unlocks, Charmed acquisition, combat geometry, loot, progression, 95 existing keys merely to satisfy a recording target, v4 persistence, graphics, soundtrack, or bilingual content. A missing sound is a functional blocker only if supported by a specific reproduced player-facing requirement, not by a spreadsheet count.

## Implementation scheduling / gates

- **Gate D (now):** design-source assessments for all three priorities **documented**. This is complete as a reviewable draft, without implying that owner personally approved each artistic choice.
- **Gate R (future):** once Phase 1 source/release status and current owner priorities are reconciled, construct an actual *deduplicated candidate cue register* by event and a compact controlled A/B pilot. No fixed quota; producer independently selects priority A auditions, retains/revises on their merits.
- **Gate P (future):** generate/license and record reproducible physical WAVs only for selected needs; preserve manifest IDs and rolls; layer safely with procedural sources and preserve event timing.
- **Gate V (future):** focused real-game stage/event, audio-browser/phone, PWA/offline/rollback, docs, cue library navigation, artistically valid comparisons, actual-device and owner acceptance recorded with real evidence.
- **Gate S (permission):** no unapproved merge to main, Pages/PWA deployment, external tester interaction or unrelated gameplay modification. The owner asked to **document first**; this design PR can stay draft without affecting the player.

## Provenance and project routing

- Authoritative planning issue: [#877](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/877), original priority decision [owner comment](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/877#issuecomment-6909394606).
- Phase 1 main integration [PR #880](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/880), separate unmerged [experimental PR #881](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/881), [Phase 1 technical record](AUDIO_SFX_PHASE1_20261116.md).
- Live source: [manifest](../assets/audio/manifest.json), [hero catalog](../src/prototype/hero-presentation.js), [hero foley](../src/prototype/audio-hero.js), [party](../src/prototype/party.js), [pet routes](../src/prototype/party-pets.js), [rules](../src/prototype/rules.js), [enemies](../src/prototype/enemy-presentation.js), [boss table](../src/prototype/data.js), [audio effects router](../src/prototype/audio-effects.js), [audio production](../src/prototype/audio-production.js), [audio notes](../src/prototype/audio-catalog.js), [progression](../src/prototype/progression.js), [rewards](../src/prototype/rewards.js).
- Project-level authority: [AGENTS](../AGENTS.md), [Development State](DEVELOPMENT_STATE.md), [Decisions](DECISIONS.md), [Documentation Index](DOCUMENTATION_INDEX.md).

**This handoff, with P1/P2/P3, is meant to be enough for an independent future ChatGPT/Work session to continue the *Phase 2 sound design/production decision* without relying on the original conversation. It does not retroactively close any Phase 1 listening gate or establish gameplay integration.**
