# SIBDLP — Strategist Priority 2: focused combat validation (4 November 2026)

**Status:** Implementation stabilized; native Campaign combat and Reversal regressions PASSED. **Draft PR [#792](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/792), unmerged and unpublished.** The exact gameplay source/test SHA is `c44fcd4b3c621210efe4cc0b1b38c1340aa7c60b`. No comprehensive suite, website deployment, class publication or real-device acceptance is claimed. This is an evidence receipt, not Priorities 3, 4 or 5.

## Authority and correction of a candidate error

The CURRENT **3 November 2026 v3.2** chapter in PR #697's `docs/STRATEGIST_STAGE1_GAME_DESIGN_20261102.md` supersedes historical v3/v3.1 cards. It deliberately **cuts** Sluice Line / Water Trace, Running Facet, Fire 3 delayed same-target heat primer and Fire 3 cross-artifact conversion. It RETAINS the source-backed six actions **Rinsing Cut / Clear Current, Stone Facet / Notched Facet, Flash Temper / Furnace Exchange**. An intermediate Priority 2 commit `70fe522` mistakenly followed superseded proposal text. This was identified before acceptance and **fully reversed in the effective source by `c44fcd4`**, with no force push. Tests and source files `hero-combat.js`, `rules.js`, `app.js` were restored to their pre-Priority-2 implementations. The mistaken intermediate commit is history, **not** the delivered combat design. Current original-source conformity was reviewed against the latest chapter, not the older rows.

## Exact accepted focused evidence

1. [GitHub Actions #41955276270 — Strategist Priority 2 focused native Campaign combat](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41955276270) **SUCCESS** at `c44fcd4`, Node 22 with locked dependencies. `node --check` passed for changed source/test. All four explicit bounded commands passed: `node tests/strategist-e0-native.test.cjs`, `node tests/strategist-materials.test.cjs`, `node tests/strategist-developer-admission.test.cjs`, `node tests/strategist-developer-isolation.test.cjs`. The E0 test creates genuine `Campaign` instances and drives native `cast`, `enemyStartBasic`, `hitParty`, `companionCoverAttack`, `updateProjectiles` and `damage`; it is **not only a mock-method suite**.
2. [GitHub Actions #41955276308 — Strategist Reversal native Campaign acceptance](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41955276308) **SUCCESS** at the same `c44fcd4`: `tests/strategist-warning-reversal-prototype.test.cjs` verifies warning instance/geometry/cleanup, real Cindermaw Administrative Distraint, both successful pre-release cancellation and its ordinary unreversed movement, temporary-defense strip and damage. Log records 54 authored warning builders examined, 36 eligible attack builders and 18 non-attack/anonymous forms; these counts are the test inventory, **not** a promise of live playthrough coverage.

## Priority 2 mechanics and findings

| Mechanic | Native behavior tested | Status / evidence boundary |
| --- | --- | --- |
| Water 1N Rinsing Cut | True source/line-of-sight and <=90 enemy hit; at most one existing native Slow removed without refunding already acquired cooldown debt; false material and shared cooldown reject | PASS on native Campaign E0, source authentication checked separately |
| Water 1C Clear Current | A real current Slow on living active Ogre/Soldier/Archer permits at most three genuine cleanses, no damage or invented status, no cast with no qualifying Slow | PASS, native charged slot cooldown |
| Mineral 2N Stone Facet | One stationary oriented two-sided face, one first physical swept shot, real enemy stone canceled before hero impact, no subsequent free intercept | PASS native Campaign |
| Mineral 2C Notched Facet | True open center and two lips. New native Campaign regression actually **releases Archer's own ordinary arrow** through `companionCoverAttack` and resolves `updateProjectiles`: a center arrow passes, an off-center arrow is blocked before the foe, using one actual face; nonphysical magic cannot consume it | PASS native original projectile owner; browser sprite/phone legibility pending |
| Fire 3N Flash Temper | Active source/one <=90 guarded enemy contact, no remote or deferred heat | PASS native Campaign, no invented timer |
| Fire 3C Furnace Exchange | Genuine active fire, facing-locked forward <=90 limited to two distinct contacts; backward/out-of-range foes not struck; cooldowns applied only to valid cast | PASS native Campaign |
| Ogre short basic and finite Acid | Only real HP-reducing, consecutive same-target dagger hits count; stocked third consumes one Bottle, bounded friendly-safe area; miss, refusal, target change, death/zone/save edge cases do not mint Bottle or extra beats | PASS existing original Campaign E0 |
| Ogre Dodge | 5% independent chance on genuine living enemy hit and none on reflection/ambient sources; a Dodged native hostile projectile has **no attached Slow**. New confirmed defect: a persistent hazard retaining a live enemy source ID previously could trigger Dodge like a discrete hit; both ring and periodic hazard callers now explicitly disallow Ogre Dodge, without affecting landed hazard Slow | FIXED and native-tested; only Ogre behavior changed |
| Ogre melee-basic retaliation | Separate provisional 10% chance, <=35% basic force and one bounded counter on eligible enemy close melee-basic targeting Ogre; may counter even after a Dodge, not on enemy ranged basics, persistent hazards, companion hits or boss specials | PASS native Campaign |
| Reversal regression | Native authored warnings incl Cindermaw Distraint; cancel at real pre-release boundary so buff strip and HP loss never occur on success, while ordinary unreversed contact remains unchanged | PASS #41955276308 |

**Material-source fidelity:** `strategist-materials.js` validates authentic current-zone live sources, sight, dark/dry/empty/industrial operating state and protected scenery; the E0 test injects explicit well/boulder/fire props **with native Campaign semantics**, and the materials suite tests its classifier and line-of-sight rules. These are valid source authentication tests, but **not a complete survey of every naturally generated material site in all five outdoor regions**. The source parser was not broadened or relaxed.

**Engineering boundaries:** Physical faces remain in an unsaved per-Campaign `WeakMap`, queried only when projectiles actually fly, no per-render-frame grid scan, no extra enemy AI, no added global workpiece systems, no new save fields or publicly registered class. The ongoing-hazard Dodge fix passes a local exclusion context into `hitParty` from two hazard emission sites and preserves the ordinary hit path. These are source-level bounded-cost observations, **not measured CPU/frame-time or device data**.

## Remaining risks and hold

- **Presentation/interaction:** Not verified in actual browser, Canvas/Pixi, touchscreen or iPhone; the developer-only touch button/hold input and charged notch phone-scale readability belong to later separately authorized gates. No owner Ogre final visual approval.
- **Saves / admission:** Developer admission and v4/public boundary focused checks passed, but exhaustive historical imported-save/playthrough/device acceptance is Priority 3/5; do not publish a fifth class on this evidence.
- **Combat coverage:** Not a full naturally generated multi-region combat journey, balance study, every boss's real-device animation or performance benchmark. Fire/Water/Mineral coefficients and Ogre passive probabilities remain provisional and not individually owner-approved.
- **Integration:** Relevant parallel Strategist Labs/material work remains in separate draft PRs and must not be silently merged. Re-compare main before eventual integration. No comprehensive suites were run.

**Stop condition met for this bounded task:** Priority 2's original Campaign regression and the Reversal safety regression are green at the exact gameplay source SHA. Priorities 3–5 are untouched. Nothing merged, deployed or publicly enabled.


## Subsequent work handoff (documentation-only follow-up)

The next independently authorized workstream is [Priority 3: Developer Admission, Saves & Class Isolation](STRATEGIST_PRIORITY3_ADMISSION_SAVES_HANDOFF_20261104.md). This Priority 2 evidence remains attributable to tested gameplay source `c44fcd4`. Do **not** reinterpret the passed Priority 2 admission smoke/narrow tests as completion of Priority 3's real app/persistence and historical-save acceptance. Priorities 4 and 5 remain pending and separate.
