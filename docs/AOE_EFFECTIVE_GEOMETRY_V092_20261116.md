# v0.9.2 area-of-effect geometry — first normalization slice (16 Nov 2026)

**Workstream:** [#896](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/896). **Candidate branch:** `audit/aoe-effective-geometry-v092-20261116`, based on `main@37ef6b0f86d91e2cc9af92c3660c757855200d33` (dev.290). **Status:** first source implementation only, pending exact-head focused checks, browser/renderer validation and independent review. **No balance retuning, merge or Pages/PWA release approved.**

## Owner-approved outcome

Use **one definitive effective area value** for each combat attack, shared by hit detection, attack selection and warning/effect presentation. Retire nested historical global bonuses without changing the attack's resulting footprint, timing, damage, class identity, save compatibility or available counterplay. *Do not normalize all hostile mechanics blindly:* specialized Cindermaw/Dreadmaw court mechanics, night enemies, Rogue tactics and player/companion/pet abilities have different geometry owners.

## Historical input and precise first-slice migration

Merged [PR #136](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/136) supplied the old 1.15 boss-area multiplier; merged [PR #335](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/335) later supplied another 1.20 global hostile-special reach modifier. Conventional boss footprints therefore used `1.15 × 1.20 = 1.38`. Previously exported `R.bossCadence.areaRangeMultiplier` is removed from combat consumers and replaced by the explicit `R.bossAreaGeometry` values below, all in world units:

| Conventional footprint | Old derivation | Effective definition | Consumer |
| --- | --- | --- | --- |
| Boss cone | 165 × 1.38 | 227.7 | Cast geometry and selection |
| Boss sector | 280 × 1.38 | 386.4 | Cast geometry and selection |
| Boss first circle | 90 × 1.38 | 124.2 | Ground warning and hits |
| Boss other circle | 115 × 1.38 | 158.7 | Ground warning and hits |
| Initial boss ring placeholder | 105 × 1.38 | 144.9 | Cast state, not ring travel |
| Standard multi-circle patch | 75 × 1.38 | 103.5 | Warning and damage pads |
| Captain doubled patch | 75 × 1.38 × 2 | 207 | Frontier Violation Marker |
| Conventional ring lifetime | 1.6 × 1.38 | 2.208 s | Actual hazards and warning calculation |
| TRUE Abyss delayed blast | 90 × 1.38 | 124.2 | Extra warned impact |
| Captain cone fallback | 145 × 1.38 | 200.1 | Missing authored radius only |
| Captain other fallback | 85 × 1.38 | 117.3 | Missing authored radius only |
| Boss special activation | 600 × 1.20 | 720 | Acquisition/eligible attacks |

**Important:** The `720` targeting/acquisition band is **not** a universal damage radius. An expanding ring travels `180 × 2.208 = 397.44` to its centerline; its band adds its independent 25-unit half-width. The initial placeholder is not the effective travel distance.

All authored *captain* `specialRange` and `radius` fields in `roomCaptains` now express their actual effective sizes without per-cast runtime multiplication. Known values:

| Captain | Effective activation | Cast radii and notes |
| --- | ---: | --- |
| Scornfang | 672 | Encapsulation 144; Dust Entrainment cone 227.7; Hot Zone source spacing radius 88.32, individual multi-circle patches 103.5; tracking volley duration 2.52 s |
| Direjaw | 588 | Sand Boil cone 207; Mud Pumping source spacing 121.44, individual pads 103.5 |
| Crag Tyrant | 642 | Margin Call source spacing 118.68, individual pads 103.5; Bad Deal full-circle 200.1 |
| Dreadmaw | 654 | Subsoiling 78; Transhumance charge 66.24; Ensiling 228; Closure nominal 204; Evapotranspiration 66; dedicated non-radius geometry (ring, orbit, separation and stages) still uses the established specialist rules |
| Cinder Warlord | 654 | Inspection Cleave 207; Violation Marker source 209.76 and two damage patches 207 each |

The `radius` field of a multi-pad captain move can control **spacing** while individual patches determine the actual struck area. Those are distinct authored dimensions and should not be conflated. Dreadmaw's special shape fields and Crown arena mechanics are deliberately not flattened by this first slice. The previous `fixedRadius` and `captainRadiusMultiplier` arithmetic is no longer used by the captain cast-radius owner; Frontier's actual doubled patch size is written directly as `patchRadius: 207`.

## Consistency and protected boundaries

- `boss-combat.js:buildBossAttack` commits a single attack geometry. `attackPatches` owns conventional multi-pad damage areas. `combat-visuals.js:warningShapes` consumes those same committed patches, with the ring warning reading the identical authored travel lifetime as the runtime hazard.
- `engine.js:startCaptainAttack` consumes the final profile radius for both cone eligibility and actual cast marks. Changes to the radius should not require matching edits to a hidden global scale.
- Boss/captain cooldowns, warning durations, damage coefficients, summon behavior, offensive eligibility, ring speeds, cap/phase identities, character positions, real terrain checks and PT-007 target-centered ground-AoE behavior stay unchanged. No `R.bossCadence.areaRangeMultiplier` reference remains in those conventional runtime owners.
- Other shapes still have independent legitimate geometry: `balance.enemySpecialReachMultiplier` remains in **specialized** enemies, night/Rogue roles and bespoke offsets; exact shape-specific values and possible nested scaling require the next audited slice. Hero classes, Soldiers, Archers, pets, Charmed tactics, traps and Ranger physical projectiles are **not normalized in this commit**, even though their authored value inventory belongs to #896.
- The old generic `tests/audit-regressions.test.cjs` had contradicted the merged #335 tuning and PT-007 ground-area decision. Expectations now check 720-unit activation, final boss radii, actual expanding ring lifetime and terrain-blocked directed attacks while allowing warned ordinary circles through unrelated line-of-sight obstructions.
- Floating-point baking can change the last insignificant binary precision bits of a radius (for example `75 × 1.38` versus literal `103.5`); that is **not an intended game-balance change**. Boundary geometry regression should use sensible tolerances.

## Next gate and evidence limits

This is **not yet the completed project-wide AoE audit.** Check focused suites for normal/TRUE bosses, five captains, special attacks, warning VFX, friendlies and saved-game behavior. Confirm current `main` changes and later branch conflicts before merge. Validate real damage at inside/outside edges, warning polygons, moving/locked targets, line-of-sight PT-007 differences, Cindermaw and Dreadmaw exceptions, screen scaling and Canvas/Pixi parity. No full campaign playthrough, physical device check or published build verification is implied.

If relevant original tests fail, retain failing receipts and distinguish an old bad expectation from a real regression. Follow-up candidates should change *one authored source at a time* and demonstrate equal effective values before any balance decisions.

## Stage 2 — authored night/Rogue effective radii (unmerged candidate)

The next narrow commit series removes the global 1.2 expansion of `nightEnemyCombat`, the 24 melee/ranged `rogueRingleaderSignatures`, and the 16 captain/boss `rogueSignatures`. There are **42 explicitly audited numeric `radius` properties** (two nighttime and forty elite signatures). Each final radius equals its historical authored radius multiplied by 1.2, with no changes to damage, warnings, cast durations, effect identities, rank scaling or target limits. Exact final radii are asserted independently in `tests/enemy-reach-regroup.test.cjs`.

- Night Wraith siphon radius **252**; Night Stalker impact radius **93.6**. Its different **432** special-approach distance is now named separately as `nightEnemyCombat.stalker.approachRange`.
- All 24 Ringleader signatures retain their exact separate melee/ranged radii. These are not replacements for ordinary mob attacks or the additional Skeleton skill/lore work in concurrent draft PR #900.
- Captain Rogue-signature radii: Scornfang **138**, Direjaw **150**, Crag Tyrant **144**, Dreadmaw **192**, Cinder Warlord **162**. Boss signature radii: Thorn **198**, Crypt **144**, Mire **174**, Archive **168**, Ridge **162**, Mine **234**, Warlord **186**, Abyss **246**, Citadel **180**, Cindermaw **1440**, Dark Lord **210**.
- `R.enemyRogueGeometry` now owns the existing Rogue acquisition distances (boss **600**, captain **528**, other **408**), fallback strike radii (boss **126**, captain **114**, other **96**), mounted rider dash radius **198**, and slab *warning* offsets **72/120**. Acquisition and impact sizes are deliberately not interchangeable. Native threat-selection and tactical windup consume this same named table, avoiding another formula duplication.
- **Remaining deliberate exception:** `tacticalResolveRogueMove` recalculates mobile slab endpoints with **60/100** offsets at release while its earlier warning uses **72/120**. This was already true before the normalization and is not silently changed as a no-balance migration. The mobile cast-bar presentation suppresses ground polygons for elites; examine actual range/hitboxes and intended mobile-cast rules before making any corrective behavior or VFX changes. Also check Cindermaw's intentionally unusually large **1440**-unit signature for legal cast behavior and player counterplay. These exceptions remain unverified pending targeted tests.

### Stage gates and CI disposition

First stage focused run [#43868222598](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/43868222598) finished **failure**. Of 39 selected suites, three reported failures: `tests/audit-regressions.test.cjs` (multiple cases, including historically stale initial boss fixtures and non-AoE assertions), `tests/enemy-vfx-events.test.cjs` (release assertion previously lacked a boss ID), and `tests/sprite-scope.test.cjs` (expected source SHA256 fingerprint drift from `rules.js` content changes). Numerous related focused checks passed (native per-family warnings, ring projection, Canvas draw purity, companion/Soldier/Archer skills, Rogue repertoire, v4 restore), but this run **is not an acceptance PASS**. The new stage commits include better fixture diagnostics and a real native boss for F02, without waiving other original failures. Once all source edits are complete, review the *final* source fingerprint against the same sprite scope, update the **current** evidence only (preserving history), run relevant suites and inspect all failures on the exact PR head.

Concurrent open PR #900 also edits `rules.js`, `engine.js`, `boss-combat.js`, `combat.js` and sprite evidence. Its added Skeleton skill identities/lore are outside this AoE workstream; **reconcile both branches before any integration**, do not force one over the other. The latest verified `main` advanced since PR #902 began. Stage 3 will audit specialized Cindermaw/Citadel/Dreadmaw and remaining dynamic/off-target spatial rules, then validate the four hero classes, two troop roles, eleven pets and legitimate Charmed inheritance without changing approved player skills.
