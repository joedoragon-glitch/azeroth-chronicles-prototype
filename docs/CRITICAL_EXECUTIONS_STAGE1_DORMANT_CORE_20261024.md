# Stage 1 — Dormant Critical Execution Core
**24 October 2026 · PR #440 · Unmerged review checkpoint**

**Status:** Isolated probability/resolution module and focused Node tests committed. **The game does not import or execute this module.** No actor has live critical chances, no skill changes damage/status/healing, and no codex is collectible.

## Delivered

1. **src/prototype/critical-executions.js** — a standalone CommonJS/browser-global-compatible module with no consumer imports, no HTML script tag, no Campaign constructor integration and no application setting.
2. Two distinct immutable 10% baselines (party and world). The pure chance function takes separate optional party bonus and world modifier values and **only applies the matching domain**. Any book or night adjustments are illustrative inputs, not active game features.
3. The resolver defaults **OFF**. OFF returns null without consuming randomness, allocating action receipts, or altering campaign actions. Tests can explicitly enable it by supplying a separate random stream; there is no automatic fallback to Campaign.random or Math.random.
4. Only a legal actor-owned release can request a result. The action object is a weak-key identity: repeated resolution of that same action reuses one frozen outcome instead of rerolling per projectile, pulse, target or heal tick. A different released action is a new roll; changed key/domain and invalid samples fail validation.
5. A small deterministic seeded random stream supports next/snapshot/restore **in isolation**. It does not commit any save fields or select a persistent seed policy; integrating that safely is still required.
6. **tests/critical-executions.test.cjs** — checks separate baseline calculations, modifier isolation, gating, release-vs-cancel distinction, single sample per action identity, receipt reuse, thresholds, seeded replay, bad inputs and preservation of the unrelated world random source.

## PR #439 reconciliation

At this checkpoint PR #439 is **open/draft, head bea7de72429d24954d5203700e2f20ed9051318a**. It has advanced beyond the older Stage 0 snapshot: alongside the new hero combat forms and separate Basic/Tap/Charged timers, its branch now also changes hero-presentation.js, audio-hero.js, skill-reference.js, menus.js and app.js. Stage 1 deliberately touches **none** of those overlapping files. Later owner release integration must respect #439's Paladin Cross (two pulses, one roll), Mage Wide Beam (all eligible targets, one roll), Ranger Hawk (one launch, no rerolls during homing), and original Tap/charged lock timing.

The dormant resolver accepts an explicit party/world domain. It does **not** classify current Campaign actors by roster yet; Stage 2/3 must establish that from the authenticated action owner rather than a display name, category string or pet-family lookalike. Weak identity only guarantees idempotence when callers share an action object or pass its immutable receipt to children; duplicating independent action objects would roll independently.

## Focused execution evidence

The following focused commands were run locally on the same standalone source/test code and passed:

    node tests/critical-executions.test.cjs
    node --check src/prototype/critical-executions.js
    node --check tests/critical-executions.test.cjs

The tests do **not** execute the actual campaign, browser, mobile UI, Canvas/Pixi paint paths or end-to-end skill implementations. No full project test matrix, CI job, game build, merge or deploy was performed; no FPS comparison or memory profiling is claimed.

## Conditions before Stage 2 gameplay work

- Reconcile the action catalog against the **latest PR #439 and main** when integration starts; historical monster visual counts are not an up-to-date executable registry.
- Agree on critical bonuses/effect caps, special cases, and whether multibeat bosses/summons count as one or several actual releases. There is **no blanket doubled-damage fallback**.
- Decide how the isolated critical seed/state will be created, restored and protected in historical v4 saves without perturbing campaign randomness. The stream snapshot helper is not save migration.
- Introduce a real actor-domain classifier and release-owner call sites behind an OFF-by-default integration gate, then prove seeded/noncritical equivalence with focused tests. **Do not enable until every action is mapped and fair.**
- Respect current performance safeguards: no per-frame scans, no per-impact RNG, no extra geometry, and in future a separate bounded exclamation overlay rather than consuming the capped ordinary visual queue.

**Review conclusion:** Stage 1 standalone kernel is ready for review within the **same PR #440**, as requested. No deployment or merge approval is implied.
