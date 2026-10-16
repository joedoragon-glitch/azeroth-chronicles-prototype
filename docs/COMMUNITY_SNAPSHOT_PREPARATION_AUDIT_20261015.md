# Community Snapshot — independent source/handoff audit, 15 October 2026

**Status: SOURCE-ONLY AUDIT — NOT IMPLEMENTED OR TESTED.** Scope: assess the preparation commit `b7c8cc8f3a0f7f79e9e8209d19ab49f90937fc5a` and the exact PR #308 candidate `70cc701f41c41e0eec6c3c17dfb85eb0363ad49c`. This is an adversarial review of the preparation, not an assertion that visual, balance, lifecycle or device acceptance has been performed.

## Git/release isolation: VERIFIED

- At audit time PR #308 was **open, unmerged**, head `70cc701...`; `main` was `d7c878b...`. Preparation branch `prep/community-snapshot-post308-20261015` pointed at `b7c8cc8...`, a single commit ahead of the **PR head**, zero commits behind it.
- GitHub compare confirmed the preparation commit added only `docs/COMMUNITY_SNAPSHOT_POST308_HANDOFF_20261015.md` and `tools/community-snapshot/pet-roster-draft.json`. No runtime, asset, manifest, package, generated app, workflow or test source was modified by it. The branch is **not** a merged release or a substitute for PR #308.
- The branch had no PR opened during preparation. The commit message was marked `[skip ci]`. **No tests, builds, performance benchmarks, browser checks, workflow dispatches, merges or deployments were initiated by this chat.** This confirms actions taken here only; it does not certify the status of independent #308 checks.
- **Release gate:** on PR #308 merge, re-read its actual final head, merge commit, current `main`, and the new feature branch before integrating. Never use the outdated `main` SHA from this audit as a future source of truth; do not merge this preparatory checkpoint directly as the game release.

## Findings ranked by potential implementation damage

**F01 · CRITICAL · Party AI default would silently turn pets into Soldiers.**
`src/prototype/party.js` lines ~1080, 1102, 1112–1205 use `u.type === 'archer'` to select ranged combat and fall through to a Soldier-like melee/weapon event path for every other type. `companionTrySkill` only resolves the two existing unit types. A naive new `type:'pet'` would fight like a Soldier, be incorrectly signaled and potentially fail to fire pet skills. Give pets a **separate, explicit, narrowly scoped ally behavior dispatch** and shared-safe targeting; preserve the current Soldier/Archer paths byte-for-byte where possible. This is approved pet functionality, **not** license to optimize the enemy/combat AI.

**F02 · CRITICAL · Existing procedural ally drawing cannot represent boss pets.**
`visuals.js` `allyBodyKind` (line ~5) maps any non-Archer type to `class||type||worker`; `draw()` (line ~14224) passes it to `human(role)`. With a pet type, this yields an ordinary humanoid silhouette rather than the promised mini boss. The enemy boss drawings are in a distinct enemy branch. Add an explicit procedural **pet art path**, indexed by vetted boss identity, with individual friendly proportions and original canonical accents. Draw presentation-only, keep physical actor coordinates/collisions, shadow/anchor, native pixel legibility and depth-order unaffected. No new sprite files.

**F03 · CRITICAL · v4 saves, factory, recovery and growth reject or lose pet identity.**
`save.js` party validation (line ~436) permits only `worker|soldier|archer`; `party.js::unit` (line ~315) knows two types; `party.js::recover` (line ~557) reconstructs from `dead.type` and would lose boss-specific identity; `progression.js::companionMaxHp` and `companionArmor` read only per-type tables, and `syncCompanionLevelStats` (line ~95) skips non-Soldier/Archer units. Specify stable, validated **unit type versus pet family** fields; bounded stats, recovery retaining family/individual ID, hero-level/vitality/equipment inheritance policy and old/new v4 round trips. Keep legacy worker migration separate. A missing pet visual/stat is not permission to coerce it to Soldier.

**F04 · HIGH · Barracks recruitment queues default unknown types to Soldier.**
`party.js::finishRecruit` (lines ~1209–1219) resolves `queueType` as Soldier unless exactly Soldier/Archer. `menus.js::barracksRecruitmentMenu` (lines ~927+) lists only those two. `menus.js::unitLabel` (line ~783) labels every non-Archer ally Soldier; `renderer.js` ally labels (lines ~1839 and ~2009) choose `type` over `name`. A pet could consume a queue and silently create a Soldier or display the wrong name. Either extend the queued exact-discriminator contract end-to-end (including saves), **or** give pet recruitment a separate atomic Barracks action with explicit availability, price, uniqueness and capacity checks. Do not touch the existing troop queue accidentally. Ensure pet labels/display name are exact and readable.

**F05 · HIGH · Permanent unlock, dismissal and duplicate semantics must be reconciled.**
`engine.js::victory` (lines ~2690–2698) sets both `s.victories[family+':true']` and `s.true[family]`; `save.js` validates `s.true` even if `s.victories` is missing. **Use `s.true` as the robust historical entitlement**; show a reward notice on a first legitimate TRUE victory only. Existing `dismissCompanion` removes a reserve unit, while `recover` re-creates a fallen unit. Decide whether a boss pet can be dismissed/re-hired or instead returned to a persistent collection; avoid making a permanently unlocked pet permanently lost. Enforce one recruited instance per family unless later explicitly approved; ensure no recruitment stacking exploit, no retroactive currency charge to claim prior TRUE rewards, and no unlock from normal/captain kills.

**F06 · HIGH · Default party formations and support logic are class-specific.**
`party.js::partyFormationOffset` (lines ~737–781) offers one fallback slot for an unknown type, causing multiple pets to overlap. Soldier screens specifically protect Archers (line ~813), and Archer Heal/Mana Recovery uses explicit `archer` checks. Pet movement/range/formation and protection must be deliberate and distinguish pet roles. Decide whether any pets may do manual labor (the present labor whitelist excludes them; default **NO**) and ensure they cannot accidentally offer Archer Heal/Mana Recovery. Do not rewrite the squad's current focus/adds doctrine.

**F07 · HIGH · Companion rebalance must account for existing defensive/utility mechanics.**
Soldier already triggers 2.5s immunity below 50% HP with a 14s recovery in `party.js` lines ~877–888. Archer has automatic/manual Heal and Mana Recovery. Both get level HP growth, Companion Vitality and inherited stats from Expedition training; charged second skills use the approved #308 shared interruption pathway. A review that counts only their two attacks, or simply increases HP/damage, will mis-diagnose weakness. Record actual deaths, target prioritization, movement, effective casts, charged interruptions and mitigation by region/class/mode before selecting new skills or numerical tuning. Final results remain unmeasured here.

**F08 · HIGH · Boss skills in draft are concepts, not reusable damage APIs.**
The 11 proposed pet move pairs in `pet-roster-draft.json` mirror non-summon *names* from `data.js`, but some original boss techniques are arena-scale, persistent zones, allied guard commands, complex movement or self/other unit-dependent (e.g. Cindermaw's Parens Patriae). None is authorized to call an enemy boss controller verbatim. Reinterpret each as short, capped, readable, party-safe effects with no summons, no permanent hazards and no new boss attack AI. The draft's `petId` strings are **design catalog keys, not validated `unit.type` values**; prefer a controlled type `pet` plus a separate validated `petFamily` or an equivalently explicit discriminated schema.

**F09 · HIGH · Player communication requires more than a one-time toast.**
Owner requires unlock to be visible through the game's existing information systems and recruitable in Barracks. Provide first-win notice **and** enduring Barracks catalog states (locked / TRUE unlocked / recruitable / active / resting / fallen). Integrate an appropriate existing Archive/Keeper reference when it improves discovery without creating a mandatory new lecture or clutter. Prior TRUE winners should see the unlocked pet at their next relevant Barracks visit. Ensure the final TRUE Dark Lord reward is accessible in postgame.

**F10 · MEDIUM · Avoid accidentally undoing previous rendering/performance optimization.**
`docs/PERFORMANCE_V09_RESULTS.md` already records road display-list reuse, occlusion memoization, audio hot-path efficiencies and service-worker URL optimization, with mixed/inconclusive full-frame observations. `docs/SNAPSHOT_VIEWPORT_PERFORMANCE_20261014.md` records camera/DPR-aware terrain/road culling. Review **current merged source** and existing evidence first; prioritize measured regressions or clearly costly present-version procedural art. Measure complete scenes, not just isolated helpers, only when final validation is permitted. Combat/AI performance is **read-only profiling and recommendations, never a change request under Requirement #5**.

**F11 · MEDIUM · A complete visual audit is still outstanding.**
The handoff states a proposed rubric, *not* a completed case-by-case census or professional-quality art review. Before drawing changes, audit exact **currently procedural** monsters/variants, architecture and props, cross-check existing registered sprite coverage, and preserve intentionally accepted shapes. Compare native phone/desktop sizes, lighting, scene mixing, shadows and label clearance. Note where an asset is already illustrated to avoid unnecessary procedural replacement; never infer live sprite coverage from old catalog counts. No screenshot, native visual or subjective polish acceptance has been performed here.

**F12 · MEDIUM · Single release does not justify skipping correctness work.**
The user authorized **one heavy final overnight integration cycle**, not a claim that an untested game is ready or an exemption from mandatory CI/release gates. No tests run in this preparation chat. Work mode should stage code without claiming validation, preserve resumable commits, collect late bug reports and execute the full existing required validation **once on the integrated release candidate** when authorized. Changed code after a successful test invalidates affected evidence. Do not modify or bypass checks, branch protection, test fixtures or release/worker packaging merely to suppress execution.

## Acceptance crosswalk

| Requirement | Source-only readiness | Not yet delivered |
| --- | --- | --- |
| #1 Procedural art quality | Owners identified: `visuals.js`, `renderer.js`, asset registration/fallback | Full family census, graded decisions, artwork edits and native visual QA |
| #2 Soldier/Archer value | Two attacks plus charged second, Soldier emergency immunity, Ranger support and growth found | Late-region death/skill evidence, balance design, changes and play validation |
| #3 TRUE boss pets | Eleven exact boss IDs and first-victory/save hooks identified; inert move/visual concepts exist | Unlock/UI/deployment/recovery/stat/code/graphics and save migrations |
| #4 Incoming issues | Scope and consolidated integration requirement captured | Future user issues not yet supplied and no fixes coded |
| #5 Safe optimization | Previous optimization studies identified; prohibited combat/AI edits documented | Updated current-build baseline, selective presentation optimization, AI/combat assessment report |
| Release | Isolated branch and two-file source-only preparatory commit confirmed | #308 merge, source reconciliation, one integrated feature PR, overnight checks, approval and deployment |

## Source handoff correction and stop-conditions

1. Do **not** implement a pet by only adding a menu entry, allowing arbitrary `u.type`, or scaling enemy boss objects. Resolve F01–F06 on an exact current-main source before any pet code is considered ready.
2. Do **not** claim old TRUE wins need to be replayed; `s.true` already provides historical entitlement. Do not silently clear, overwrite, refund or duplicate rewards.
3. Do **not** pursue performance work within combat or AI even when inspecting them for companion/pet feature logic. Scope authorized balance/feature alterations narrowly and separately.
4. Do **not** treat proposed pet move pairs or a procedural-fidelity rating as player-approved final art or balance; keep them changeable until reviewed at gameplay scale.
5. This audit is **documentation only**. All findings are based on static source inspection and Git metadata; neither rendering nor save behavior has been executed. The next implementation must reconcile the possibly changed PR #308/merged main head.

**Audit disposition:** Preparatory checkpoint is **safe and recoverable**; the handoff is **usable only with these explicit critical integration caveats**. No production implementation has been certified. This document supersedes overbroad interpretations of the initial handoff, without cancelling any approved user requirements.
