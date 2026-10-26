# PR #440 — Stage 2 pet families: native continuation checkpoint

> **Later current status:** Stage 2's owner implementation has been merged with newer main *within this draft* and bounded Stage 3 native World basics/healing have begun. Read [current handoff](PR440_STAGE2_GATE_STAGE3_NATIVE_HANDOFF_20261025.md) before following dated next steps below. No deployment.

**25 October 2026 — active source and testing record.** The owner expressly authorized resuming after the Ranger Heal/dormant Mana and Soldier Guard stop checkpoint. The original [STOP checkpoint](PR440_CRITICAL_STAGE2_STOP_CHECKPOINT_20261025.md) is retained as history, not erased. This report stands independently of any earlier chat.

## Scope and refs

- Repository: [Azeroth Chronicles](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype); continuing [draft PR #440](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/440), branch `design/critical-executions-codices-20261024`.
- Pet native source/test commit: [`704d479fdf78db03d1e5a75270208188d5b07814`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/704d479fdf78db03d1e5a75270208188d5b07814). It followed checkpoint `755b292799fea735f8c7f08beacecc4b4d9b809d`. Subsequent tests and documentation are committed separately.
- Observed `main` before this implementation: `e3c78266b28f3325d2afdcb76ae849fcff306deb`. #440 remained **46 commits behind main**, merge base `8215ab0f301a88cf3b4a55659001cae6ef05db0b`; `party-pets.js` was byte-identical on both branches before editing. `combat.js` and `hero-combat.js` carry newer main changes. This pet slice **does not merge/rebase/reconcile the entire draft with current main**, and must not overwrite those newer changes.
- Separate [PR #449](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/449) documentation/test governance remains untouched.

## Implemented: eleven pet families × three releases

- `src/prototype/party-pets.js` now has `petCriticalRelease` for one opt-in decision at each committed pet basic, first skill and successfully released charged second skill. It covers **thorn, crypt, mire, archive, ridge, mine, warlord, abyss, citadel, cindermaw, darklord**. Both ordinary combat and Recall defensive basics have native release hooks, independently of `party.js`'s troop hooks.
- `usePetSkill` selects its single immutable receipt after original legality checks and before the native consequence. The 0.65s second-skill charge still belongs to `party.js` and does not roll until its resolved release; invalid targets, interrupted/canceled holds and blocked skill admission consume no roll.
- Ranged basic and target-shaped first/second shots carry the single frozen receipt in transient projectile data; `combat.js` forwards the **same** receipt to `petSkillContact` on a legal hit, with no impact-time roll. Direct group attacks reuse it for every legally selected enemy, keeping original cones, lines, circles, caps and LOS/target/immune checks.
- Authored native consequence follows `critical-levels.js` registry exactly: **damage** amplifies existing successful hit damage; **slowDuration** extends an existing Slow; **healAmount** improves Little Lifebinder's original contact self/one-wounded-ally heal amounts while retaining maximum-HP caps, contact and ally selection; **wardDuration** extends existing self wards on actual legal contacts and preserves strongest-only ward strength/Paladin non-stacking. Level 1/2/3 values are still proposed, not finally balance-approved.
- No new action recipients, damage footprints, projectiles, instant heals, cooldown reductions, windup shortcuts, target immunity bypass, saved pet state, additional per-frame work or combat event families are introduced. Existing missed/blocked attacks can still spend their **release** critical decision and then fail to connect. The older post-hoc observer stays fixture-only.

## Focused validation and limits

- [CI #40218283495](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40218283495), source commit `704d479f`: **`tests/critical-pet-native.test.cjs` PASSED** all **99 native family/action/level combinations**. It tests actual Campaign pet abilities across all three companion intensity levels, charged-release boundaries, capped single/multi-hit consequences, ranged contact and receipt identity, healing, Slow, ward, rejected skills and missing-target holds, misses and immutable delayed effects. The same run passed existing native Ranger/Guard, troop, hero, core critical suites and other selected tests.
- **Overall CI FAILED** because independent `tests/pixi-renderer-browser.test.cjs` expected `context-loss` but received `render-exception` during its Pixi safety diagnostic. This is the separately tracked renderer-test instability seen in earlier #440 runs. Do not weaken its assertion or claim that this pet work fixed it. No successful package build followed the failure; no production certification/performance/device evidence.
- A subsequent small test extension exercises ordinary pet basic attacks and additional multi-target outcomes beyond the original Recall-basic 99 matrix. Check its new exact-head CI separately; the earlier successful native receipt belongs to `704d479f`.
- Independently verified: `scripts/site-assets.cjs` does **not** register new critical modules and `src/prototype/engine.js` does not auto-install a critical session. No PWA player receives these critical rolls. No merge, release, deployment or activation occurred.

## Still pending / next engineering gate

1. Re-fetch latest `main` and PR #440, carefully reconcile changed hero/combat code on the same draft branch while preserving merged #439's three-form Skill 1 behavior, all subsequent Mage changes and other ongoing work. Do **not** apply stale wholesale file copies.
2. Re-audit all **93 registered party actions** for real/meaningful consequences; run additional negative admission, no-session OFF parity, deterministic RNG/save-v4 compatibility and focused performance checks. Stage 2 still **partial** pending that global gate.
3. Independently investigate Pixi's context-loss/viewport-change browser instability outside this pet slice. Green native tests do not equal green integrated CI.
4. Stage 3 World hostile actions, Stage 4 performer `!` VFX, Stage 5 five Codices and save rules, Stage 6 final performance/integration remain **not implemented**. Do not automatically enable or publish any stage.

**Authority:** [Independent PR handoff](PR440_INDEPENDENT_WORK_HANDOFF_20261024.md), [stage gates](PR440_STAGE_GATES_AND_REGRESSION_MATRIX_20261024.md), [AGENTS.md](../AGENTS.md) and live source. Multi-file GitHub Pages/PWA architecture remains mandatory.
