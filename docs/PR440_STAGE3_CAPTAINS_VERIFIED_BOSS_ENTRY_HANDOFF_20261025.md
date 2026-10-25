# PR #440 — Verified Stage 3 captain completion and boss-family entry handoff

**25 October 2026 — authoritative for this checkpoint.** Repository: `joedoragon-glitch/azeroth-chronicles-prototype`; existing [draft PR #440](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/440); branch `design/critical-executions-codices-20261024`. Native source accepted at **[`4a9d30583eda5617d8e78a6d12a638edd450d8ec`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/4a9d30583eda5617d8e78a6d12a638edd450d8ec)**. Latest `main` through `6d2a3c8b` (#465 active-governance update) was safely included in this draft with **zero commits behind main** at this checkpoint. Re-fetch refs before future edits; overlapping Work sessions may move them.

**Do not merge, deploy, enable Critical Executions, start a full-game/browser matrix or claim physical-device/balance approval.** The multi-file GitHub Pages/PWA is canonical. Production `scripts/site-assets.cjs` omits the Critical Party/World sessions and the Campaign constructor does not install them. These are **dormant, test-only critical effects**; no new critical sound, glyph, projectile count, render event or live skill has been published.

## Implemented, source-test-verified coverage

| Owner | Explicit native action keys | Release rule |
| --- | ---: | --- |
| Party: heroes, troops, pets | **93** | Original committed action once; not per impact or canceled charge |
| World: ordinary enemy melee/ranged, hostile healing, night and Rogue | **7** | Real swing/projectile launch/heal cast/night special/Rogue resolution |
| World: all four conventional captain profiles | **14 of 14** | Each authored cone, tracked volley, one/two-patch circle, multi-stage area or physical charge retains one activation receipt |
| World: Dreadmaw specialist | **7 of 7** | Each original delegated attack gets a distinct real execution consequence; never blanket damage |
| World: boss family special moves | **2 of 54** | Thornfang index 0 cone and Ridge Tyrant index 0 cone only; the other 52 indexed boss specials remain without World critical registration |
| **World total** | **30** | Independent World 10% stream; potency Levels 1/2/3; unknown actions fail closed |

The Party tally is 51 hero, 33 pet and 9 troop action keys. The three-level levers are **candidate tuning**, not owner-approved final damage/balance values. Ordinary noncritical behavior is unchanged because receipt application requires the opt-in World session.

### Dreadmaw seven specialist actions — verified separately

| Index and native owner | Critical consequence (no added recipients/stages) | Exact focused evidence |
| --- | --- | --- |
| 0 — **Subsoiling** | One receipt across two original terrain-safe ground impacts; neither mark/timer changes | [#40233669543](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40233669543): **44 focused files + build PASS** |
| 1 — **Transhumance** | One receipt across the actual two perpendicular collision-checked legs; legal second leg inherits, blocked second leg cancels as before | [#40236811373](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40236811373): **46 + build PASS** |
| 2 — **Ensiling** | Actual initial warned cone contact strengthened; native Slow/vapor/floor ticks unchanged | [#40233153410](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40233153410): **43 + build PASS** |
| 3 — **Nucleus Herd** | The already-authored `summonVitality` lever increases only actually spawned original brood HP at Levels 1–3; original cap **4**, exactly 3 melee/1 ranged, positions/ownership/zero rewards unchanged. No roll on full cap. | [#40238251554](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40238251554): **48 + build PASS**; preceding #40237685755 was **red solely because an old registry test assumed every captain lever was damage**; the real native Herd test already passed, and the assertion was corrected. |
| 4 — **Purse-Seine Closure** | Delayed original center blast strengthened only; both traversable ring gaps, contracting periodic ring damage, timing and blast radius unchanged | [#40237245635](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40237245635): **47 + build PASS** |
| 5 — **Creep Feeding** | Existing eligible owned brood haste **duration** extended by the already-authored `hasteDuration` values, bounded below unchanged 10-second cooldown. No extra brood, eligibility, cooldown or buff factor change; no roll with zero eligible recipients. | [#40238674666](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40238674666): **49 + build PASS** |
| 6 — **Evapotranspiration** | One receipt across three original warned ground contacts; native steam vapor tick strength/cadence/Slow unchanged | [#40234163833](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40234163833): **45 + build PASS** |

[Three remaining conventional captain area skills](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40232764823) also passed 42 focused files and reproducible build. Earlier captain trials, pet/hero integrations and main reconciliation remain documented in [Stage 3 special action checkpoint](PR440_STAGE3_SPECIAL_ACTIONS_NATIVE_CHECKPOINT_20261025.md) and [Stage 2 native reconciliation](PR440_STAGE2_GATE_STAGE3_NATIVE_HANDOFF_20261025.md).

### First normal/TRUE boss specials — verified

- **Thornfang index 0 original warned cone**, `world/boss/thorn/0` / `damage`: Native delayed warning resolves into the same direct-area cone. No changes to protected field opening, form flags, target admission or the three other Thorn skills. **[Exact-head focused CI #40239134615](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40239134615) PASS: 50 relevant test files and reproducible build**, Normal/TRUE forms, Normal/Nightmare, all three intensities, immunity, cancellation, no-critical parity, v4 snapshot reset.
- **Ridge Tyrant index 0 original warned cone**, `world/boss/ridge/0` / `damage`: Same single direct-area-contact owner under an explicit source/family allowlist. The boss's cargo projectile, charge and summon remain excluded. **[Exact-head focused CI #40239640005](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40239640005) PASS: 51 relevant test files and reproducible build**, Normal/TRUE, Normal/Nightmare, levels 1/2/3, native timer/geometry, protected target, cancellation, no-critical parity and v4 reset.

**Focused evidence is not full-game certification.** No full browser/device matrix, sustained crowd/FPS benchmark, full-Party equivalence/random-distribution campaign, final tuning review, or physical game/audio acceptance was performed.

## Remaining authored boss catalog — 52 of 54 original action entries

This is an inventory of `R.attacks` as authored in `src/prototype/rules.js`, **not** permission to synthesize one common boss multiplier. Indexed moves have separate admission, movement, summon and deferred-effect owners; Normal/TRUE can change their timing, allowed stages or target pressure.

| Boss family | Authored count | Original action shapes and release issues |
| --- | ---: | --- |
| Thorn | 4 | **Index 0 immediate cone completed.** Index 1 delayed landing circle; index 2 direct Slow line; index 3 summon. |
| Crypt | 6 | Push cone, delayed volley, attendant summon, paired/persistent circles, slow-only ring, timed self-defense |
| Mire | 4 | Jaw/Death Roll cone with three already-mitigated ticks, physical charge, persistent multi-circle, summon |
| Archive | 5 | Keeper hold/anchor cone, dual line, persistent Slow circle, ranged summon, sabotage |
| Ridge | 4 | **Index 0 immediate cone completed.** Index 1 cargo projectile, index 2 physical charge, index 3 summon |
| Mine | 5 | Heavy direct circle, sequential circles, double-wave ring, physical charge, summon |
| Warlord | 4 | Combo cone, six-circle area, summon, charge |
| Abyss | 4 | Mana-drain cone, ring, sequential aerial landing, summon; independent retreat/heal |
| Citadel | 5 | Canister pellets, formation, pattern-charge, checkerboard, summon; protected arena board |
| Cindermaw | 7 | Delegated cordon, distraint, protection/retaliation, seals, equalisation, delegation/finisher, summon; review `cindermaw-combat.js` |
| Dark Lord | 6 | Authored cone, delayed landing, summon, multi-stage royal sector, line, Royal Taxation; Second Wind and response mechanics separate |
| **Total** | **54** | **2 currently implemented, 52 remaining** |

**Recommended next source slice:** Thorn index 2 Slow line (the actual direct contact supports the existing `slowDuration` lever while native HP damage remains unchanged), then separately verify Thorn index 1 landing and index 3 summon via the actual contact/summon owner. For each boss/form and movement stage: ensure one chance decision at a real action release, original legal descendants only, no per-impact/telegraph/tick reroll, unaffected immunity/retreat/LOS, and test both Normal/TRUE plus Normal/Nightmare. Start a new focused CI run only after pushing one coherent source batch.

## Save/RNG, cross-PR coexistence and release gates

- `src/prototype/save.js::snapshot()` already clears transient projectiles, hazards, enemy telegraphs, motion and queued attack state. Dreadmaw tests prove that in-flight `criticalExecution` receipts **do not survive v4 snapshots**; preserve that existing reset. This is **not** verification of a deterministic independently saved World/Party critical RNG controller, an unfinished Stage 5 design prerequisite.
- New `main` merges were reconciled **without overlapping critical source**: approved low-impact docs/audio batches, PR #477's Pixi context-loss browser test correction and PR #465's active-governance documentation. Owner current authority `AGENTS.md` and the architecture/mechanic-development guidance were consulted. Branch was zero commits behind main at the last source check.
- Refreshed open-PR file audit: only **[#464](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/464)** (`combat.js`, `hero-combat.js`, `party-pets.js`, `party.js`) and **[#458](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/458)** (`engine.js`) have direct filename overlap with #440. #464 changes Ranger/Archer physical release/impact sequencing: later integration **must preserve one critical receipt at original skill release and pass its frozen result through new physical projectiles/launch-point arguments**. #458 changes TRUE regional boss hunting and must coexist with native world release/withdrawal admission. Neither is merged with this draft or jointly tested. [Cross-PR audit](PR440_STAGE3_CROSS_PR_COMPATIBILITY_AUDIT_20261025.md) has exact API/hunk considerations.
- New UI #476, audio #475/#472/#470 and VFX #471 have no exact filename overlap with #440 on the last open-PR listing, but inter-PR visual/event behavior remains independently unverified. Before Stage 4 critical `!` indication, reconcile Canvas/Pixi/VFX/skip-budget rendering and all other approved visual work.
- Keep **Stage 4** critical indication, **Stage 5** Codex/claim state, independent critical RNG seed/restore and v4 compatibility, and **Stage 6** device/FPS, balance and release decisions behind their original gates. No automatic activation, broad CI, merge or deployment.

**Future-chat continuation:** Check the actual latest PR head and main, read [active AGENTS policy](../AGENTS.md), [architecture](ARCHITECTURE.md), [mechanic process](MECHANIC_DEVELOPMENT.md), [original stage gates](PR440_STAGE_GATES_AND_REGRESSION_MATRIX_20261024.md), and this handoff. Preserve source ownership; use the same PR #440, expected-SHA branch leases and only relevant focused tests. If another chat already advanced an action, inspect its actual commit/CI before doing more. Do not overwrite neighboring unmerged art, audio, visual or boss-pursuit branches.
