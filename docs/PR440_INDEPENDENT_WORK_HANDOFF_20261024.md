# PR #440 — Critical Executions: independent development / Work-mode handoff

## CURRENT CONTINUATION — Stage 2 pet-family integration (25 October 2026)

**The owner has now explicitly authorized continuing beyond the earlier STOP checkpoint.** The earlier “stop before pets” paragraphs below are historical instructions, not a present hold. [Read the new pet-family checkpoint](PR440_STAGE2_PETS_NATIVE_CHECKPOINT_20261025.md) before relying on the dated material below. Same open **draft PR #440**, still OFF, unmerged and unpublished. Source commit `704d479fdf78db03d1e5a75270208188d5b07814` adds direct owners for all 33 pet action keys. Its native pet test passed **99 family/action/level combinations** in [focused run #40218283495](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40218283495); **workflow failed only at the independent Pixi browser context-loss diagnostic**, so no successful exact-head build is claimed. An additional ordinary-basic and multi-target coverage update follows that source commit and requires its own validation.

At the start of the pet slice, live `main` was `e3c78266b28f3325d2afdcb76ae849fcff306deb`, **46 commits ahead of the draft's merge base**. `party-pets.js` was identical on main and PR before editing; `combat.js` overlaps newer main work, so **no full current-main integration/rebase is claimed**. Full Stage 2 OFF/ON/save/RNG/performance acceptance and current-main reconciliation are still open; stages 3–6 are untouched. Do not merge, publish, enable or run a broad full suite without separate approval.


## CURRENT STOP CHECKPOINT — 25 October 2026

**Owner-directed STOP before pet-family integration.** [Read this self-contained, current source-verified GitHub handoff FIRST](PR440_CRITICAL_STAGE2_STOP_CHECKPOINT_20261025.md). Historical status notes and old `main`/PR SHAs below are NOT current instructions. Ranger Heal, dormant Mana, and standalone Soldier Guard native sources and tests are checkpointed; their native tests passed in [run #40204460034](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40204460034), but **the overall workflow was RED due to an unrelated Pixi browser viewport-change/Keep-Revert failure**. PR #440 stays DRAFT, unmerged, unpublished and production feature OFF. Do not start pets until explicit new authorization.

> **LIVE STATUS CORRECTION — 25 October 2026 (verified after the handoff was written):** [PR #439](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/439) is now **MERGED and CLOSED**, not an open draft. GitHub reports merge time **2026-10-25 04:21:03 UTC**, final head `be3662e953bb85be51a4c15de18b48102ee330d1` and merge commit `7d9649151bbff578ecb34c01edfb2e14abb9d9ea`. Its exact-head [focused checks #40160551845](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40160551845) succeeded. Current `main` reports package version **dev.183**. **Next Work session must re-fetch current main and rebase/reconcile PR #440 against merged #439 skill logic and FIFO queue**, then pursue the still-unfinished native Stage 2 release hooks. Do NOT treat old references below to "#439 open draft" or dev.175 main as current fact. #440 itself is **open draft, unmerged and disabled**. No critical-gameplay activation or deployment of #440 has occurred.



**READ FIRST in every new ChatGPT chat, Work session, or developer handoff.**
**Date of verified snapshot:** 24 October 2026 (America/New_York).
**Repository:** [joedoragon-glitch/azeroth-chronicles-prototype](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype)
**ONE continuing pull request:** [#440](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/440)
**Continuing branch:** design/critical-executions-codices-20261024
**Related merged PR:** [#439 — Self-taught Hero Skill 1](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/439), branch design/hero-skill1-self-taught-combat-20261024
**Other relevant intent:** #439 already incorporates the stationary-auto objective of unmerged #436; do not stack #436 on top.

## 1. Mission and autonomy: the GitHub PR is the source of truth

Azeroth Chronicles is a **multi-file GitHub Pages/PWA game**. Finish a game-wide, action-specific critical-execution mechanic with independent party/world critical chance, three global critical-effect strength settings, a brief above-actor exclamation cue, and five optional permanent codices. Preserve gameplay, performance, saved games, published behavior, narrative canon, both renderer paths and #439's parallel hero skill redesign.

**The user explicitly asked that all stages remain in this SAME PR #440** so a fresh chat or Work mode can resume without access to this old conversation. This file, existing #440 technical documents, live GitHub source, and #439's own handoff are enough to continue; no transcript, model memory, external personal file or sandbox copy is required. **Do not create a separate Stage 3/4/5 PR by default.** Update this document and the PR body at each meaningful checkpoint. Work on the draft branch only, unless the owner changes this instruction.

**Permissions:** Staged coding, targeted static audits, documents and appropriately focused tests have been requested. **No authorization to merge #439/#440, push to main, mark ready, publish/deploy, activate incomplete gameplay, run full-game/full browser matrices, or launch manual Pages certification.** Follow live [AGENTS.md](../AGENTS.md) and [architecture](ARCHITECTURE.md); full manual workflow needs owner approval (approve_full_suite=true). Successful focused checks are *not* release permission. Do not assume dev.169 is the newest main: refetch current main on every resumption.

## 2. Live checkpoint, not a frozen future claim

At this handoff audit:
- **#440:** OPEN DRAFT, based on main; previous head **78abeedbbc77ffd95ef330ed5863374a5f4f3e9c** BEFORE committing this handoff, **12 changed files** (6 design/checkpoint docs + 3 new isolated JS modules + 3 new focused tests). The previous head's [focused workflow #40157134506](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40157134506) reported **success**. This result predates the handoff commits and **does not establish native action coverage, balance, device performance or end-to-end integration**.
- **#439:** OPEN DRAFT, previous head **e682f009361af7486e8720a49bad936f161f6f4d**, 25 changed files. Latest retrieved focused run **#40157386094 was cancelled**, so do not call the latest #439 run green. Its [self-contained handoff](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/design/hero-skill1-self-taught-combat-20261024/docs/PR439_INDEPENDENT_WORK_HANDOFF_20261024.md) records earlier targeted CI failures and the new same-slot FIFO queue requirement. Re-check CI and changed files after any new #439 commit.
- Both PRs previously referenced main base **e4e8234b5f784ddc9492fe79d956fd0a696b12af**; refs and main can advance. Do not treat any SHA, CI result, source line number or action count here as permanently current.

**Important status distinction:** Stage 0 action inventory and design exist; Stage 1 dormant probability engine exists; Stage 2 **opt-in testing adapter + three-tier effect registry** exist. **Stage 2 is NOT complete as live gameplay integration.** Stages 3–6 remain unimplemented as live gameplay in #440. No #440 module is in the current game script manifest. No player can collect a critical book or see a crit exclamation via this PR.

## 3. User decisions already made — preserve these

### 3A. Critical chances versus critical strength

These are two independent axes. **Chance** answers WHETHER an action is critical; **intensity** answers HOW MUCH its authored original consequence improves **if** it is critical.

- Two *separate* independent **10% base critical-chance domains**: **party** (hero, Soldier/Archer, and recruited pets), and **world** (ordinary enemies, elites, Rogue maneuvers, captains, bosses, TRUE forms, enemy healers and combatant summons). Starting values equal 10%, but must remain separate configurable sources. Hero codex bonuses may eventually add only to the party side; no nighttime world bonus has been approved.
- **Exactly ONE decision per valid, committed/released combat action**, after its prerequisites and before consequences. No decision for queued/cancelled/failed actions, no reroll per arrow, victim, bounce, cross pulse, hazard tick, heal tick, summon recipient or render. Delayed children inherit the immutable release outcome. A critical still may miss, be absorbed, intercepted or face immunity.
- **Three independently adjustable *critical-effect intensity* groups:** Hero (all 3 classes), Companions (Soldier, Archer/Ranger, all 11 pet families), World (all hostile combatants). Each selects Level 1, 2 or 3; default for all groups/modes **Level 1**. Level 1 = modest/safe, Level 2 = meaningful middle, Level 3 = deliberately strong but not a license to bypass encounter protections. No Level 4 or unbounded mechanic. Nightmare-world Level 3 is an *available future opt-in override*, not an automatic Nightmare rule.
- A developer must be able to switch one whole group quickly after tests, without changing other groups or the 10% chance. The current tuning module implements this **in memory**; no persistent developer control, in-game menu, save preference or full production integration yet. A change affects **future releases only**, not a shot already in flight.
- **Every real skill uses an authored, existing-effect-specific lever** (duration, mitigation, damage, heal, existing push, etc.) instead of a universal double-damage rule or generic stun. Centralized Level 1/2/3 values are initial *candidate numbers*, not measured/approved final balance. No new projectiles, summons, damaging footprints, cooldown/windup changes, targeting bypass, encounter breaking, new periodic work or uncapped effects.
- The user's simplification is intentional: don't ask for a separate deep balance debate over hundreds of bespoke effects. Validate that the **lever is mechanically real and meaningful at all three levels**, preserve per-move caps, and tune central tiers after player/AI testing. Conditional exceptions require explicit review, not a silent global fallback.

### 3B. Visual and dungeon identity

- On a critical RELEASE, show one brief classic downward-pointing **!** above the actor **performing** the action, not on the victim. No special new sound, cast warning, latency or combat rhythm change. Do not obscure telegraphs/names/quest ! prompts. Planned small separate transient cue queue (provisional <=12 simultaneous, one per actor), not the combat FX 40-slot pool or saved statistics.
- Five optional secondary dungeon codices, provisional collection title **Codices of the Unforeseen**, are **one-time permanent combat learning**, not skill ranks or default strength-level upgrades. Tentative book bonus **+1 percentage point each × 5**, not yet owner-approved; companions/pets inherit only the earned extra portion, tentatively through **Shared Training 0–5/5** (not the baseline 10%; Shared Strength 0–4/4 is different). No final claim eligibility, Peace/succession handling, permanence rules or book balance has been approved.
- Do **not** conflate **the seven implementation stages 0–6** with **critical-effect strength Levels 1–3**.

### 3C. PR #439 is authoritative for its skills until reconciled

Skill 1 on #439: independent moving/stationary **three-beat automatic basic** (0.85s base timer and established finisher), **instant normal Tap** (Paladin holy projectile, Mage narrow beam, Ranger THREE staggered arrows; 3s base cooldown), and **new Charged Skill 1** (Paladin Radiant Cross, TWO pulses / 0.35s gap; Mage wide beam hits EACH legal foe once; Ranger one finite homing hawk with conditional same-retreat interruption). One skill rank; no ninth skill. All Slots 1–8 have **separate normal and charged recovery**: Charged starts both timers, Tap starts only normal, and Tap cannot reset remaining charged lock. Charge preparation may be cancelled. PR #439's latest handoff also states **same-slot Tap and Charged queue requests coexist in FIFO order, not automatic cancellation/replacement**. Do not rewrite PR #439's queue/cooldowns, false-merge #436, or assume an old copied skill journal is current.

## 4. Original project roadmap — exact status and what remains

| Implementation stage | Scope | Current truth | Next gate |
| --- | --- | --- | --- |
| **0** Action/lore inventory | All real released moves, owners, exceptions, proposed effects | **Documented, NOT source-generator-certified**. Catalog 51 hero keys, 6 troop basics/specials, 33 pet actions, extra Ranger support, 54 current boss description slots, 21 captain slots, 5 captain phases (often NOT active moves), ordinary/Rogue/night/healing families. Old enemy VFX 251 IDs are historical presentation identities, not 251 current executable actions. | Re-run read-only enemy roster generator on reconciled main/#439; verify action release semantics and all source paths. |
| **1** Dormant probability core | Independent base pools, isolated seeded RNG, one decision per action identity | **Standalone implementation committed**; no runtime import; seeded stream snapshot/restore helper not save migration. | Native/equivalence tests and seed-state ownership before activation. |
| **2** Hero/companions/pets | Hero all 3 classes, Soldier/Archer, all 11 pets, basic/charged/delayed, healing | **Partial code checkpoint.** Opt-in review adapter, typed strength registry for 92 party action identities, tests/fixtures; **NO actual skill modifications or production release hooks**. | Replace post-hoc/per-tick observer with direct pre-consequence action-owner hooks on reconciled #439 code; validate real original consequences and native focused tests. |
| **3** World action integration | Ordinary ranged/melee, tactical Rogue, ringleaders/night, hostile healers, captains, bosses/TRUE, specialists | **Not implemented.** World Level 1–3 setting exists but no actual hostile effect registry or release hooks. | Add explicit source-derived world registry; integrate each valid authored release, keep one roll for multi-phase abilities, test protection/scene caps. |
| **4** Actor ! indicator | Separate bounded transient overlay for Canvas and Pixi Canvas overlay | **Not implemented.** No displayed critical cue. | Actual-draw-aware lifetime, skip/emergency-safe, up to ~12 markers, no saved event/history/extra redraw. |
| **5** Five codices | Interactible books, reward rules, chance inheritance, v4 migration, bilingual lore | **Design proposal only.** No active book flags or bonuses. | Approve outstanding rule choices; implement idempotent claims and validated legacy-save compatibility. |
| **6** Integration/acceptance | Comparisons, simulation/performance/audio/UI/save, release review | **Not executed for complete feature.** | Focused tests, matched OFF/shadow/mechanics/visual benchmarks, targeted phone/Chromebook/Canvas/Pixi checks, final owner review; separately authorized broad suites/deployment only. |

**The most useful immediate continuation is finishing Stage 2 safely**, not skipping to Stage 3 simply because a previous assistant called Stage 2 a checkpoint.

## 5. Existing files and exact code ownership

### PR #440 new source (all dormant)
- [critical-executions.js](../src/prototype/critical-executions.js): BASE_CHANCE party/world 0.10, chanceFor(), seededStream(), createResolver() (default OFF, WeakMap action receipt identity). Stream is separate from Campaign.random but no persistence policy exists.
- [critical-levels.js](../src/prototype/critical-levels.js): GROUPS hero/companion/world, DEFAULT_LEVELS all 1; per-mode overrides; explicit 92 action keys; initial 3-tier lever tables; enhanceExisting() helper honors passed bounds, but **is not called by any native skill**.
- [critical-party-integration.js](../src/prototype/critical-party-integration.js): manual opt-in prototype wrapping of hero cast/event, companion first/second, pet skills/counters, Ranger support, companionFight and updateParty. Receipts attach to transient newly spawned projectiles and PR #439-style hero effects. **Review adapter only; not an acceptable production frame-path solution.**
- [test/contract files](../tests/critical-executions.test.cjs) and [strength levels test](../tests/critical-levels.test.cjs) and [party fixture test](../tests/critical-party-integration.test.cjs): focused contracts; the last simulates native method shapes, not full Campaign combat.

### Native game owner map on current main/#439
- hero-combat.js: actual hero cast commitment; projectiles; auto-combo; Cross/Beam/Hawk from #439
- party.js and party-pets.js: Soldier/Archer basics/charge, real Ranger healing and pet combat/wards/projectiles
- combat.js: canonical damage, hit protection, projectile impact, statuses, immunity
- engine.js: Campaign state, ordinary enemy/Rogue behavior, enemy support healing, travel and event history
- boss-combat.js plus cindermaw-combat.js/dreadmaw-combat.js: warning vs attack release, sequences, bosses and special owners
- rules.js/data.js: authored attack, status, dungeon, balance and pet tables
- progression.js: inheritance including Shared Training and Shared Strength
- save.js: strict v4 campaign validation/restore/migration; persistence.js: browser save ownership
- world.js: existing optional dungeon geometry and residents
- renderer.js/combat-visuals.js/app.js/runtime.js: transient presentations, 40 normal FX cap, dual draw paths, frame skip/emergency; site-assets.cjs: explicit offline script graph
- tests/run.cjs and focused-deploy.yml: test discovery and CI boundaries

Use actual final source; no source line numbers in historical docs should be treated as stable.

## 6. Critical correctness/performance hazards already found (read before coding)

1. **The Stage 2 adapter is NOT active and cannot supply pre-hit upgrades.** Some troop/pet results are observed only AFTER original damage, healing or cooldown changes. Never retroactively change a result or use event() as a new source of attack permission. Migrate to minimal direct hooks at real native release sites before applying enhanceExisting().
2. **Per-tick cost of prototype observation wrappers:** companionFight/updateParty currently inspect the 64-entry history, created events, party and shot arrays; don't install this adapter in live app. Keep enabled-only test usage or replace with O(1) per-release hooks. Current simulation already faces low-end hardware/frame-skip pressures.
3. **One-roll ownership is incomplete in production:** a new temporary object passed to resolver.release() has a new identity each time; WeakMap idempotence only works if the SAME action receipt/context is handed to every descendant. For 3 Ranger arrows, chain victims, multi-pulse Cross, moving Hawk, pet contact heals and boss multibeat attacks, propagate one receipt, never re-resolve on impact.
4. **Missing/candidate effects:** the 92 keys represent an authoring registry, NOT 92 proven useful critical effects. For example Ranger Hawk currently selects retreatLockDuration yet a non-retreating Hawk still requires a meaningful legal crit; Paladin Shield Stance should roll only on raising, not lowering; Archer first-skill Slow is conditional (Veteran/contact), so define a fallback when absent. Ranger mana recovery uses dormant MP logic. Some heals or wards are conditional. Resolve case-by-case with an explicit approved fallback from the SAME action, not a global doubled-damage policy.
5. **Actor attribution and intro protection:** only genuine party combatants use party probability; active summoned hostiles/world specialists use world probability. Auto basic must not open protected Vale/Thornfang fights, and companion contact must not bypass authored resets. Avoid naming/display heuristics.
6. **World non-attacks:** Frenzy/phase graphics, passive siphon, environment traps, stand-alone proc damage or each summoned minion arrival is not necessarily a separately released move. Cindermaw/Dreadmaw and normal vs TRUE extensions require exact count/sequence review. Goblin Dust Slow affects victims while Goblin *attacker* gains direct-target cover; AoE may still reach Goblin.
7. **No saved-stat or presentation pollution:** engine.event() pushes persisted 400-cap statistics. Future crit glyph must go to separate transient lane, not app's existing 40-FX queue; skip-aware lifetime should not expire before first real draw. Don't force draws, undo Adaptive Frame Skip, or override simulation HOLD in genuine critical emergency.
8. **Persistence:** don't persist live projectile/cue/receipt or indiscriminately add to v4 snapshots. Isolated RNG needs explicit durable seed/state rules to prevent save/reload exploitation without breaking old saves. Book claims need exactly five validated once-only flags, not rediscovery-only flags. Verify Peace, death/succession and travel before choosing permanence.
9. **Build integration intentionally absent:** site-assets.cjs does NOT list #440's new modules; there is no import in game startup. Do not claim live mechanics or player controls. If/when adding to game script graph, update offline bundle/version/registration as required by [ARCHITECTURE.md](ARCHITECTURE.md).
10. **Tests and performance evidence:** tests/run.cjs discovers all .test.cjs in broad runs, but --quick uses an explicit allowlist and does NOT automatically include new critical tests; explicitly run only impacted files. Prior standalone checks were either local Node or a JS/CommonJS compatibility harness; they do not certify native game, browser, CI selection, FPS, memory or hardware results.

## 7. Codices: five specific locations, current proposal only

| Existing optional interior ID | Occupants | Proposed book |
| --- | --- | --- |
| side-vale-cellars — Old Orchard Cellars | Goblins | The Art of Misdirection |
| side-march-watchhouse — Drowned Watchhouse | Reed Beasts | The Waterline Gambit |
| side-highlands-signal — Old Signal Keep | Ogres | The Measured Blow |
| side-frontier-shrine — Ruined Shrine | Orcs | The Feigned Opening |
| side-crown-foundry — Ruined Foundry | Crown Guards | The Final Adjustment |

These interiors already contain real combat, inhabitants, props/traps and traversable rooms, but no established once-only reward-clear predicate, boss or captive. Do not recreate dungeon geometry or erase the inhabitants' established culture. The names and exact bonus/eligibility/persistence remain review proposals. **Codex chance is distinct from the 1–3 intensity setting.** Optional future ties to intensity must be explicitly approved, not slipped in.

## 8. How to resume in a NEW chat or ChatGPT Work session

1. Open **PR #440**, this document, and all linked technical docs; read live [AGENTS.md](../AGENTS.md) and [ARCHITECTURE.md](ARCHITECTURE.md). Also open [#439's independent handoff](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/design/hero-skill1-self-taught-combat-20261024/docs/PR439_INDEPENDENT_WORK_HANDOFF_20261024.md) and its newer same-slot FIFO queue decision.
2. Fetch LIVE #440 head/diff/CI, #439 head/diff/CI and current main **first**. Do not start work from any handoff SHA without refreshing. Retain #440 as the ONE continuing draft; do not edit #439 without explicit reason/consent.
3. Review the 3 dormant modules and focused tests. Confirm no accidental script registration or combat behavior changes. Re-run focused commands in an actual checkout where available; do not rely on earlier passing snippets as definitive code coverage.
4. Reconcile/coordinate #439: it is not a passive spec anymore; it has concrete hero code, cooldowns, art/audio/UI and a separate ongoing Area 3/4 completion plan. Before editing shared hero files, choose a safe integration base/branch strategy that preserves the entire #439 diff; **no wholesale replacement from older main** and no merge/deploy without approval.
5. Finish Stage 2 at actual pre-consequence release points, with true party-domain attribution, per-skill bounds, a meaningful 1/2/3 variant for every real party action, no per-tick history scan and robust native tests. Do NOT turn the system ON for players yet.
6. Then execute Stage 3 world effects, Stage 4 transient glyph, Stage 5 codices/save/copy and Stage 6 focused performance/regression checks in that order. At each stage update #440 handoff, validation matrix and PR description with: **implemented files, test commands/results, blockers, merge/deploy state and next exact step**.
7. If some authorial decision is genuinely unresolved (book bonus/claim/succession or true novel status interaction), record the proposed default and ask the owner **only before committing an irreversible mechanic**. The user already approved the three-tier architecture and requested forward development; do not restart basic design discussions.
8. Keep this branch's work **disabled until comprehensive critical-action coverage is achieved**, and preserve the game's multi-file GitHub Pages/PWA build, offline caching, per-device preferences, save v4 compatibility, release safeguards and proper measurement interpretation.

**Copyable prompt for the next chat / Work:**

~~~text
Continue Azeroth Chronicles critical executions in the existing GitHub draft PR #440
(joedoragon-glitch/azeroth-chronicles-prototype; branch
design/critical-executions-codices-20261024). READ FIRST:
docs/PR440_INDEPENDENT_WORK_HANDOFF_20261024.md and
docs/PR440_STAGE_GATES_AND_REGRESSION_MATRIX_20261024.md,
then inspect PR #440, PR #439, live main, AGENTS.md and architecture.
Follow the documented user-approved design, three independent Level 1–3 strength
groups and two 10% chance domains. Finish the outstanding native Stage 2 direct
release hooks without altering PR #439's Skill 1/FIFO queue/cooldowns, then
progress through Stages 3–6. Record progress and focused evidence in the
SAME PR #440. Keep incomplete gameplay off. Do not merge/deploy, run full
browser/game suites, or start a new PR without explicit owner approval.
~~~

## 9. Canonical reading order (all part of same PR #440)

1. **This handoff** — owner decisions, present truth, first next step, process and risks.
2. [Stage gates and regression matrix](PR440_STAGE_GATES_AND_REGRESSION_MATRIX_20261024.md) — implementable checklists and acceptance criteria for Stages 2–6.
3. [Original Critical Executions + Codices design](CRITICAL_EXECUTIONS_AND_UNFORESEEN_CODICES_DESIGN_20261024.md) — detailed intent and five optional interior proposals.
4. [Feasibility/performance audit](CRITICAL_EXECUTIONS_FEASIBILITY_PERFORMANCE_IMPLEMENTATION_AUDIT_20261024.md) — source owners, stats/VFX/performance/save constraints, staged rollout.
5. [Stage 0 catalog and PR #439 reconciliation](CRITICAL_EXECUTIONS_STAGE0_ACTION_CATALOG_PR439_20261025.md) — action mapping, candidate effects and unresolved release boundaries. Older SHA/CI claims are historical snapshots.
6. [Stage 1 kernel contract](CRITICAL_EXECUTIONS_STAGE1_DORMANT_CORE_20261024.md) — separate RNG/receipt API, disabled behavior.
7. [Stage 2 review-adapter checkpoint](CRITICAL_EXECUTIONS_STAGE2_PARTY_RECEIPT_CHECKPOINT_20261024.md) — what tests cover and why direct hooks are still missing.
8. [Owner's three-tier intensity contract](CRITICAL_EXECUTIONS_THREE_LEVEL_STRENGTH_POLICY_20261024.md) — three groups and initial central lever table; current authoritative **strength architecture**.
9. **Always also read** [PR #439 handoff](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/design/hero-skill1-self-taught-combat-20261024/docs/PR439_INDEPENDENT_WORK_HANDOFF_20261024.md) for its real code and user-approved queue behavior.

**Handoff conclusion:** The continuing draft contains a tested isolated foundation, not a finished critical mechanic. The developer's first deliverable is a credible, low-cost **native Stage 2 completion candidate** with release-timed effects and source/CI evidence. The owner can then review that checkpoint without reconstructing this conversation.


## 25 October continuation checkpoint — Native Skill 1 vertical slice (NOT Stage 2 complete)

- **Current verified baseline at reconciliation:** `main` dev.184 commit `8215ab0f301a88cf3b4a55659001cae6ef05db0b`; PR #439 is merged at `7d9649151bbff578ecb34c01edfb2e14abb9d9ea`; old #440 head `1d9a45bf23d465b3561fb72f31a878eb71d729c9`. PR #440 merged *main into its own draft branch* at `cae15e6dc61e6cf66e69b85a2b8e1352683b0ac7`, preserving all 14 #440-only files and current #439 native FIFO/three-form code. This was **not** a merge of PR #440 to main.
- **Code added:** `src/prototype/critical-party-native.js` — explicit disabled-by-default, per-release native session with isolated critical RNG and immutable level-specific receipt; `src/prototype/hero-combat.js` — direct native Skill 1 auto/Tap/Charged commitment receipt and bounded existing-damage enhancement. Tap's 3 Ranger arrows inherit one receipt; Paladin Cross two pulses, Mage beam targets, Hawk flight/contact inherit the sampled release effect. Auto finisher uses the one beat's enhanced base damage rather than rerolling; optional receipt is attached to projectiles and delayed hero effects. `src/prototype/critical-levels.js` corrects Ranger Hawk to use its always-existing contact damage as the critical lever, instead of retreat locking which can be inapplicable.
- **Tests authored:** `tests/critical-party-native.test.cjs` exercises actual Campaign Skill 1 three classes and forms, child receipts, multi-targets, roll counts, canceled attempts, and delayed tier stability; existing `tests/critical-levels.test.cjs` updates the Hawk expectation. `tests/critical-party-integration.test.cjs` retains its historical fixture observer contract only; it is NOT installed, loaded, or accepted as production combat ownership.
- **Verified focused CI evidence:** source/test checkpoint plus handoff docs at exact PR head `5c064247a35bbb84b1abc91bd7d8506af4ca9077` passed [Focused checks #40198013992](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40198013992): **17 changed files, 15 focused test files, all passing**; reproducible offline-ready build passed; publish job **skipped**. Logs explicitly executed `critical-executions.test.cjs`, `critical-levels.test.cjs`, `critical-party-integration.test.cjs`, new `critical-party-native.test.cjs` (actual native Campaign Skill 1), and original `hero-skill1-integration`, `hero-skill1-retreats`, `hero-skill1-stage1` among relevant suites. This is N+F+C evidence, NOT device/browser, FPS, matched OFF/ON, memory, save exploit review or full Stage 2 coverage.
- **Still OFF:** `critical-party-native.js` is NOT in `scripts/site-assets.cjs` and no Campaign constructor installs a session. Default gameplay sees only optional undefined-property checks; no RNG draws, buffs, books or glyphs are enabled. No owner authorization to merge, deploy or enable incomplete criticals.
- **Stage 2 remains PARTIAL.** The native Skill 1 slice is a checkpoint; remaining hero slots 2–8, Soldier/Archer, 11 pet families, Ranger support, Recall counters, full 92-key source validation, mandatory bounds, negative-outcome and native baseline/performance comparisons are unchecked. The old post-hoc `critical-party-integration.js` observer must NOT be activated; remove/retire after replacement coverage.
- **Single next action:** check exact-head CI and repair any findings, then extend the same O(1) native pre-consequence receipt pattern to the remaining hero slots, followed by troop/pet owners. No Stage 3, production import or critical visual before finishing Stage 2.


## 25 October continuation — Hero Skills 2–8 and six native troop combat moves

**Supersedes the earlier "hero slots 2–8 / Soldier / Archer unfinished" status above.** This is still a **PARTIAL Stage 2 checkpoint**, not permission to activate, merge or deploy.

- **Hero Skill 2–8 scope completed on this draft branch:** All 42 Paladin/Mage/Ranger Tap-and-Charged forms now take an actual per-action release receipt from `hero-combat.js`, with the existing `critical-party-native.js` session. Damage, Slow, weaken, taunt, silence, interrupt recovery, wards, healing, fracture and movement displacement use their mapped native consequences with original geometry, caps, clocks and projectile counts. `combat.js` propagates the Mage interrupt receipt to the actual impact resolver. `tests/critical-hero-2to8-native.test.cjs` exercises **42 real Campaign variants**, cancellation, action receipt and cooldown boundaries. Source checkpoint [CI #40200568877](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40200568877): **37 relevant test files passed**, offline-ready build accepted, publish skipped. This predates later `main` updates.
- **Troop scope completed on this draft branch:** Six registered combat identities `troop/{soldier,archer}/{basic,first,second}`. `party.js` now samples at direct ordinary, defensive-cover, gathering-defense, and Recall/basic owners; Soldier Power Strike, Archer three-arrow Triple Shot, and each charged Second Skill use one immutable action receipt. Second Skills have no sample during 0.65s windup or interrupted/targetless cancellation; actual permitted multi-target area uses one release, not one sample per victim. No extra arrow, enemy, footprint, cooldown, movement or damage callback.
- **Authored Archer decision:** `troop/archer/first` now uses the always-present **existing damage** on its three arrows, replacing the provisional `slowDuration` critical lever because Veteran covering Slow is conditional and not guaranteed on every valid Triple Shot. The ordinary Veteran Slow remains unchanged. Soldier Power Strike's conditional Veteran ward remains unchanged; its own existing strike damage is strengthened instead. `critical-levels.test.cjs` and dormant historical fixture test expectations were updated; the legacy post-hoc observer is still NOT installed.
- **Native evidence:** `tests/critical-troop-native.test.cjs` exercises six actual Campaign move families, native cover/basic/special, one roll per burst/area, canceled second charge, no RNG before release, cooldown parity and original OFF fallback. Its later checkpoint additionally tests ordinary combat and gathering-counterattack releases. [CI #40201499241](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40201499241) **PASSED 38 focused files and offline-ready build** on head `d5bf124d8500f2ec77da281f1d0c88c1fcd1a9fa`, publishing SKIPPED. The expanded tests at `04a52d5ccaa85d90d6e14d459a2ece7d360917ef` all passed in [CI #40201923485](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40201923485), but that overall focused workflow was **RED** because the unrelated Pixi renderer browser context-loss diagnostic expected `context-loss` and observed `render-exception`. Reproducible build step was skipped in that red run. Do NOT claim an all-green exact-current-head run.
- **Current-main drift / separate gate:** At this checkpoint, `main` is `72ef6a551153eeb75d40156b91564db00195ac02`, **44 commits beyond** the previously reconciled dev.184 `8215ab0f`. Its changes include `hero-combat.js` and `combat.js`, but not `party.js`. PR #440's head `04a52d5c` is **diverged** and must be carefully reconciled with new Mage-beam/projectile behavior and any later main changes, not blindly overwritten or presented as integration-ready. This was deliberately **not** done in this narrow troop slice, to avoid colliding with ongoing independent work.
- **Intentionally excluded:** Soldier reactive Survival Guard (`survivalCd`, 2.5s native immunity), Ranger/Archer heal and mana support (`troop/archer/heal` and `mana`), eleven pet families, hostile/world criticals, codices, cues/UI, saves/persistence, and stage-wide FPS/memory/device/offline performance certification. Survivor Guard is a separate potentially eligible activation requiring its own release/design review, not a seventh free critical attached to basic damage. Ordinary critical feature gate remains **OFF**; no new critical modules were registered in the production PWA graph.
- **Next independent action:** reconcile the newest `main` against the draft's current hero and projectile code and isolate the unrelated Pixi context-loss failure *without broadening Stage 2 troop scope*. Then, only with separate owner authorization, select the next remaining Stage 2 slice (Ranger support or the eleven pets). No merge, deployment or production toggle.
