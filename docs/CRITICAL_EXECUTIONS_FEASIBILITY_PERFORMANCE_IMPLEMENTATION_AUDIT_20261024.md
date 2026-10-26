# Critical Executions — Feasibility, Performance, and Implementation Audit

> **CURRENT CONTINUATION RULE (24 October 2026):** This source-only report records an earlier planning snapshot. The owner subsequently required **all stages to remain in the same continuing draft PR #440**; the recommendation below for separate PRs is superseded. Stage 1 code and a Stage 2 opt-in adapter/tier registry now exist, but no gameplay is enabled. **Read [PR440 independent Work handoff](PR440_INDEPENDENT_WORK_HANDOFF_20261024.md) and [stage gates](PR440_STAGE_GATES_AND_REGRESSION_MATRIX_20261024.md) FIRST** for up-to-date status, owner decisions and safe continuation. Do not mistake older no-code or estimated-FPS language for current measured results.
**24 October 2026 · PR #440 · Source-only audit against current main at PR base `e4e8234b5f784ddc9492fe79d956fd0a696b12af`**  
**Disposition:** Technically feasible; predicted incremental *per-action* runtime cost low if designed as described. Integration and balance risks are substantial. **No FPS/CPU/memory benchmark, native hardware playtest, automated test execution or implementation has been performed for this document.** This report is a plan, not a test certificate or authorization to merge/deploy.

Companion proposal: [Critical Executions and the Codices of the Unforeseen](CRITICAL_EXECUTIONS_AND_UNFORESEEN_CODICES_DESIGN_20261024.md). This audit refines that tentative proposal; no provisional book numbers, names or succession rules become final by appearing here.

## Executive decision

**Recommend proceeding through small, separately reviewable implementation PRs, with the entire new mechanic disabled until its action coverage, bounded presentation, legacy saves and performance checks pass.** No renderer rewrite, sprite/audio work, FPS algorithm change, extra attack phase, extra enemy, or new dungeon geometry is necessary.

**What is cheap:** a single probability roll and indexed rule lookup **when an action actually releases**, a scalar/descriptor attached to that action, a derived five-book party bonus, and a small single-glyph visual cue at ~10% of releases. This is not a per-frame multiplier on every entity or every target hit.

**What is hard:** mapping all authored attack/support variants to meaningful, fair upgrades without letting multi-projectile actions reroll, modifying real damage/status/healing safely across many owners, and preventing indicator/event spam during crowded encounters. Performance cannot be certified until implemented and measured on target devices.

### Feasibility/risk matrix

| Workstream | Source-based feasibility | Risk / dominant concern |
| --- | --- | --- |
| Independent party/world 10% bases | High | Low overhead; do not share one mutable rate or inherit the base twice |
| Codex-derived bonus & companion/pet inheritance | High | Save/qualification/succession rules and consistent fractional math |
| Per-action roll and outcome | High in principle | **Medium/high integration:** separate launch, telegraph, delayed impact and multi-beat action boundaries |
| Every skill has unique critical behavior | Achievable but broad | **High authoring/balance:** all hero forms, troop/pet roles, species/elite/Rogue, bosses/TRUE, support and specials |
| Point-down `!` on both renderers | High | **Medium presentation:** collision with UI, cap, skipped frames, night readability |
| Five once-only side-dungeon manuscripts | High | **Medium save/lore:** no existing optional-interior reward/clear contract; legacy saves and peaceful campaigns |
| Target-device performance | Expected low incremental CPU if bounded | **Unverified:** no current measured delta; event dispatch, rendering and combat state divergences need paired benchmarks |

## 1. Direct source findings and dependencies

1. **Combat is intentionally split.** `src/prototype/hero-combat.js::cast` commits the hero's cooldown after prerequisites, then emits `heroSkillCast`; the action can spawn a single projectile, three staggered Ranger arrows, a chain, multi-target area, healing or a charged skill. `basicComboFinisher` has additional secondary targets. `party.js` owns Soldier/Archer basics, skills, charged follow-ups, Ranger healing and periodic heals; `party-pets.js::usePetSkill` creates an action with possible delayed projectile and heal/ward on contact. `boss-combat.js::startAttack` prepares visible warnings while `resolveAttack` later executes an action, and `resolveArea` can hit multiple party members; `engine.js` owns Rogue and ordinary enemy/update/healing flows. `cindermaw-combat.js` and `dreadmaw-combat.js` extend hostile combat with additional special paths.
2. **Source catalogue exists but is not a critical-effect inventory.** `scripts/monster-attack-audit.cjs` plus `docs/MONSTER_ATTACK_V09_HOUSEKEEPING.md` enumerate **251 enemy presentation identities**, not 251 unique algorithms or critical definitions. Reuse their IDs and existing rules as starting evidence; separately inventory hero forms, companion/pet moves, support, boss sequenced/subactions, healing and reactive moves. No automatic universal fallback.
3. **Some examples need exact mechanical correction.** The actual Goblin Rogue dust (`engine.js::tacticalResolveRogueMove`, near the `rogueDustCoverUntil` assignment) applies attack-dependent Slow to successfully struck victims; **the Goblin attacker** gains temporary exclusion from *direct targeting*, while area damage may still hit. It does not make the struck hero untargetable. A critical variant could extend *the actual two distinct existing effects*, with independent caps. `COMBAT_CONDITIONS_V09.md` is the authoritative status reference.
4. **Existing mitigation order matters.** `combat.js` owns damage, status, actual HP removal, friendly projectile interception, protected boss openings, and tactical burst compression. `boss-combat.js::resolveArea` has guard/hold/motion/summon/family exceptions; `engine.js::enemySupportHeal` assigns multi-recipient recovery **one cooldown**, and `party.js::rangerSupport` heals over five seconds. A critical must modify the intended authored property **without reapplying damage, bypassing prevention, changing geometry or rerolling for ticks**.
5. **The existing event method writes saved statistics.** `engine.js::event` pushes into `s.statistics.events` (capped at **400**) as well as `effects`; `app.js` drains `game.effects` once per frame into renderer and audio. A critical *visual marker* should **not** call `event()` once for each cue and pollute history, duplicate audio, or trigger a save. There is precedent in `enemy-vfx-events.js` for pushing transient observation-only events directly into `game.effects`.
6. **Presentation already has limits and two surfaces.** `combat-visuals.js::queue` builds a transient FX list capped at **40**, dropping lower-priority effects. `renderer.js::updateVisualFx` reduces lifetimes on game updates and `drawVisualFx` draws each FX; the renderer's **Canvas 2D full world and PixiJS Canvas overlay both invoke that draw path**, so one cue painter can serve both. The game already renders a literal `!` over the Millhaven recruiter; the critical symbol must differ in spatial/contextual identity from that quest/recruitment prompt. It must not evict existing warnings or healing FX from the current 40-slot shared queue.
7. **Frame skipping is live and deliberately nuanced.** `runtime.js` / `app.js`: Auto 20–30 / 30–60 observe adaptive skipping; ordinary skipping can suppress eligible drawings while gameplay continues; critical emergency **holds simulation and combat** during stalls, then probes real draws. `docs/CURRENT_PERFORMANCE_STATUS_DEV169_20261024.md` and `docs/PERFORMANCE_EVIDENCE_REGISTER_20261024.md` explain that `callbackFps`, `displayedFps`, legacy `fps`, and CPU draw-call time have different meanings. An indicator must not induce an extra draw or prevent the skip controller from functioning; it should not expire invisibly before the first eligible draw.
8. **Five appropriate optional sites already exist.** `rules.js::sideDungeons` has Old Orchard Cellars (Goblin, 6 residents), Drowned Watchhouse (Reed Beast, 8), Old Signal Keep (Ogre, 10), Ruined Shrine (Orc, 12), Ruined Foundry (Crown Guard, 14). Each has authored floors, props/walls and traps but no boss/captive/quest/recoverable reward. `world.js` builds the resident/exit/entrance and `engine.js::interact` handles NPC kinds. There is no single established `sideDungeonCleared` reward predicate. The `discovered` entry for reading interior lore is **not** a reward claim. An optional book can be an existing-format inspectable NPC/prop at a checked, walkable position, without adding any population or repeated scan.
9. **Inheritance has two existing tracks.** `progression.js::expeditionSupportFraction('sharedTraining')` shares discipline-derived HP/damage/speed at **0–5/5**; `sharedStrength` is a different **0–4/4** track for persistent equipment/stat benefits. Pet records live in the ordinary `party` roster. A crit bonus is a **new named derived quantity**, *not* a hidden modifier to damage inheritance. Current design proposes using Shared Training to pass the **earned book bonus only**, never the universal 10% base; this remains an approval item.
10. **Save v4 is strict.** `save.js::validate` handles migration/defaults, exact known Expedition rank keys, roster limits, and zone checks. `snapshot` explicitly clears live projectiles/hazards and temporary combat orders and `restore` clears transients. Store **five compact once-only codex claims** in campaign state with exact allowlist and boolean validation, absent-save default and idempotent migration. No transient glyph or attack crit receipt belongs in `s.statistics.events` or durable save fields. Succession preservation remains undecided.

## 2. Proposed low-overhead technical architecture

### 2A — Resolve only on actual action releases

A tiny **Critical Execution** rules service may expose conceptual methods `criticalChance(actor)`, `rollCritical(actionContext)`, `criticalEffect(actionKey, critical)`. These are proposed API names, not present code. Actor classification is **party** (hero plus recruited Soldier/Ranger/pet) versus **world combatant** (all applicable monsters, elites, bosses, hostile healers and summons). No global mutable shared 10%. Environment traps, consumable/rest heals, quest actions and noncombat passives are **not automatically combatant skill executions** and need their own explicit scope decision.

Action owners make **one roll only once** *after a legal cast reaches the actual release point*, not at keydown, failed range check, windup start, empty/invalid healer cast, AI consideration, or per-frame/tick. Store a small boolean / effect tag in the **transient action receipt** when delayed follow-through occurs. All child missiles of one shot, chain hops, area targets, damage-over-time ticks and delayed recovery pulses inherit that receipt; they do not call the roller. A distinct later attack sequence beat that is *truly a new activation* may roll independently **only if mapped as such in the action catalog**.

Avoid:
- Calling the resolver inside `updateParty` / `updateEnemies` on every idle actor per tick.
- A world scan to find nearby critics; use the already resolved performer and action context.
- Allocating arrays/objects on every failed action or every normal-hit result.
- Changing projectile count, multi-hit counts, telegraph windows, basic combo cadence, hit area, collision, pathfinder or AI target choice just to make a crit stronger.
- Mutating the underlying authored rules table, skill rank, or base chance for temporary effects.

**RNG gate:** Current Campaign accepts injected `random` and uses `this.random()` for other stochastic gameplay (e.g. early TRUE roll, wandering and weighted selections). Extra reads can shift unrelated outcomes and make historical seeded tests diverge. Before choosing the RNG implementation, compare (a) same stream with adjusted seeded-test expectations against (b) a **separate deterministic, save-safe critical stream** that does not perturb existing encounters. Recommend isolation **if** it can be implemented without a large new per-action allocation or fragile state migration; document seed, restore/succession behavior and malformed-state defense. Never claim current seeded outcomes are unaffected without proving it.

### 2B — Fast authored effect dispatch

Maintain a static indexed **action-key → critical-effect configuration**, using the existing rules/content IDs (slot, class, charged, species/role, Rogue signature, boss family/index/form and heal type). Resolve in constant time at release; avoid stringifying large objects, searching tables for every target, or per-frame introspection. Action-specific callbacks use existing damage/status/heal services.

Critical behavior changes **one bounded existing consequence** where possible: duration/strength of actual Slow, direct-target-cover duration, ward value/duration, healing amount applied to original recipient(s), armor interaction for physical attacks, etc. Apply effect data to the existing calculation **once at the owning semantic layer** and keep all original caps/counters. A larger heal remains capped by missing HP; over-time heals snapshot their total allowance once. Stronger hostile controls need explicit caps and anti-lockout review, especially Nightmare/TRUE/party crowds. Protected bosses still receive compression and guards in the same order.

### 2C — Dedicated transient cue, *not* another audio/attack event

When a release truly crits, enqueue **one tiny presentation-only receipt** with actor identity and world anchor, unique activation key, zone, and brief lifetime. No new sound, telegraph, animation or attack warning. Do **not** call `game.event()` for this one cue: add it to a bounded transient channel (or piggyback a release presentation receipt without duplicate logs). The renderer can revalidate scene/actor identity, or keep the release position if the performer immediately travels/dies. Decide this consistently.

**Provisional cue budget:** no more than **12** concurrently visible critical markers, at most one marker per actor at once, fixed small Canvas operations (glyph + backing/outline), no DOM nodes, particles, gradients, image asset, collision polygons or per-target effects. Prioritize hero, boss and nearby combat-critical actors; coalesce/evict lower-priority markers. Keep this queue **separate from the established 40-effect budget** so normal heal/attack warnings retain their current access. Prefer reusing `renderer.js` rendering in both full Canvas and Pixi's Canvas overlay.

Lifecycle: do not begin the **visible duration** until an actual world draw has shown the marker, then retain it about **0.5–0.8 seconds** of eligible presentation (provisional, visual QA required). Bound absolute residency and clear on zone/reset/reload, while respecting pause and emergency; do not force extra draw calls to guarantee visibility. A reduced-motion mode is static with the same information. Position above actor with reserved space relative to health plate, nameplate, charged HUD/warnings and camera edges; use simple bounded fallback positions, **not per-frame all-pairs label layout**. The old recruiter `!` is an interface notification, not a critical.

### 2D — Codex claims with zero per-frame bookkeeping

Keep five durable booleans, keyed to existing `sideDungeons[].id`, e.g. `s.criticalCodices`; canonical books are static content and should add no heavyweight asset. On a real one-time interaction, validate region, actual configured book identity, proximity, claim eligibility and unclaimed flag; set exactly one flag and send one ordinary **claim feedback/save** event. Subsequent interactions read already learned without granting another bonus. No respawn duplication.

Compute an immutable effective percentage at **release** via the fixed set of five flags (or one invalidated cache if measurements justify it). Working formula:
```
hero    = 0.10 + 0.01 * count(claimed codices)                 // provisional
ally    = 0.10 + (hero - 0.10) * (SharedTrainingRank / 5)       // provisional
pet     = ally                                                 // same party roster
hostile = 0.10 + worldOnlyModifier                            // initially zero
```
At three volumes and Shared Training 3/5, a companion/pet would be **11.8%**, not 13%, 18%, or 10% plus another inherited base. Enemy nighttime change is explicitly **not** part of this implementation. World-only modifications in future must use the game's true `night()` semantics (including Nightmare), not a generic visual darkness flag.

Books may be safely placed without changing geometry, but their **unlock rule** is an authorial decision, not a preexisting “side clear” flag. Recommend **a deliberate inspect-and-learn interaction** behind a reachable in-world book at each site, with optional contested-access messaging; decide whether clearing all current residents is required before implementation. The current side residents' social lore should not be rewritten as “they all stole secret magic manuals.” Separate the lore-discovery flag from a codex-claim flag.

**Legacy-save edge:** an old campaign that previously visited/emptied the interior does not automatically own a new codex. On update it should still be able to enter and claim unless the owner chooses a different migration. Specify that books remain obtainable during peace, after side-enemy death/reset, and with preexisting saves, or explicitly document an exception. Codex knowledge across Succession/hero replacement must be decided before adding durable state.

## 3. Performance model (hypothesis, not measurement)

Baseline cost for the new roller is **O(1) per released action**, not O(entities × simulation frames) or O(projectiles × impacts). The five-flag check is bounded O(5), and the static action-configuration lookup is O(1) for authored keys. At a **hypothetical** 20 real action releases per second and a 10% critical rate, expect about **two marker creation events per second on average**, subject to clustering, actual chance modifiers and actor count. This example is arithmetic, **not** a measured game attack rate.

Most CPU danger would come from accidentally rolling at every frame/tick/hit, performing per-target dynamic status lookups, or using the existing 40-slot VFX insertion loop and all-pairs label avoidance to animate indicators. A second risk is **simulation divergence**: longer debuffs/heals change combat length, targeting and number of concurrent actors, so even code that costs almost nothing directly may materially alter enemy/companion work in a busy encounter. Document performance of a **mechanics-off shadow roll**, *isolated effects*, and the **full gameplay change** separately.

The frame-skip system makes raw FPS comparisons misleading. Reuse dev.169 `frameProfile`'s 180 active callback windows and per-layer rendering/crowd counters. Treat `simulationMs`, broad companion/enemy AI subsets, `eventDispatchMs`, `renderMs`, `pixiMs` and `canvasOverlayMs` as separate synchronous measurements; **do not add P95s together**, call callback opportunities completed ticks during emergency, or call issued draws physical display FPS.

### Benchmarks & provisional acceptance gates

| Scenario | Paired setup | Evidence and gate |
| --- | --- | --- |
| Release overhead | Same scripted action counts, critical code OFF vs shadow rolls with no effect/glyph; seeded deterministic scenarios | Prove **one roll per legal release**, zero idle/tick work, and no repeatable material increase in simulation/event dispatch |
| Mechanics overhead | OFF vs enabled with fixed authored outcomes but glyph OFF | Track action counts, damage/heal/status correctness, actor population, frame-stage distributions; distinguish indirect balance load from new code time |
| Marker draw cost | Same fixed actor/world positions, 0 vs 10% vs forced-100%-critical **visual stress only** | Both Canvas and Pixi/overlay; cue count <= 12; existing warning/heal FX visible, no new draw triggers, no unbounded FX/heap growth |
| Crowded combat | Five-region representative mob/elite/Rogue, six active allies, pets, projectile spread, boss normal/TRUE, heal/counters, low-end/phone | Compare paired runs (at least three clean repeats where practical), memory, warnings, emergency events, frame skips, player readability |
| Persistence | Historical v4 saves, post-claim, repeat travel, double interact, forced failure/reload, Succession, peace | Exactly five idempotent grants, bounded state, no rollback/duplicate reward, valid restores |

**Proposed investigation threshold, not a claimed current result:** any repeatable degradation greater than roughly **5%** in matched median/P95 stage time, materially lower issued-draw cadence, additional emergency entries, missed critical/attack warnings, or growing memory prompts profiling and redesign; do not waive with a synthetic microbench. Final tolerances and device acceptance require owner approval and real samples. Explicitly record renderer, FPS mode, render resolution, optimization preference, frame-skip state and crowd sample coverage alongside reports.

Development work must comply with the owner's **focused-only testing policy**. Do not launch the full game suite, broad Chromium/WebKit matrix, or publish without separate authorization. Narrow Node/production-shell fixtures and existing source regression scripts are permitted at implementation stages; full device certification is a distinct approval gate.

## 4. Recommended implementation plan and review gates

| Stage | Deliverable | Focused review gate | Repository touchpoints |
| --- | --- | --- | --- |
| **0 — Action and lore inventory** | Generate human-reviewed action matrix with source owner, release boundary, multi-stage behavior, ordinary semantics, critical consequence, cap, test case, and traceability to existing enemy audit | No unclassified player/enemy/boss/pet/real healing action; all proposed effects reviewed before balance acceptance | `scripts/monster-attack-audit.cjs` as source, `rules.js`, skills and boss modules; **documentation only** |
| **1 — Dormant core contract** | Separate 10% party/world chance definitions, actor classification, optional critical RNG and deterministic receipt test API; feature gate defaults OFF | Normal game unchanged while OFF, no extra RNG calls while OFF, one-roll-on-release contract, no expanded simulation loops | Small dedicated core/rules module, `rules.js`, focused Node tests |
| **2 — Hero and recruited party actions** | Implement hero 3-class basics/combos/tap+charged, Soldier/Ranger/pet basics and special/healing variants, receipt propagation | Correct mixed target/projectile count, ward/heal, damage compression, no one-hit rerolls, no change to baseline timing or costs | `hero-combat.js`, `party.js`, `party-pets.js`, `combat.js` |
| **3 — Hostile action owners** | Ordinary melee/ranged, Rogue/elite signatures, night/guards/captains, support heal, 11 boss families/normal+TRUE and special extensions | Every active action in catalogue mapped; no accidental stronger/suppressed telegraph, no inescapable crowd control; seeded checks and snapshot parity | `engine.js`, `boss-combat.js`, special boss modules and `rules.js` |
| **4 — Critical cue presentation** | Separate bounded transient ! with actor/scene identity and actual-draw-aware visibility; both Canvas and Pixi overlay | No double audio, statistics churn, VFX eviction, cross-zone ghosts, unreadable overlays, FPS gate change; forced marker stress checks | `renderer.js`, `combat-visuals.js`, optional transient presentation emitter |
| **5 — Codices, inheritance and persistence** | One manual per existing side dungeon, explicit one-time claim, bilingual text, party-only bonus calculation and v4 migration | Five distinct claims, repeated entry/import safety, six-companion/pet parity, book accessibility/peace/succession behavior, valid old saves | `rules.js`, `world.js`, `engine.js::interact`, `progression.js`, `save.js`, menu/reference |
| **6 — Integration and performance acceptance** | Full critical capability switched on only after coverage + owner review; paired profiler evidence, representative screen checks and regression record | No unexplained stage-time regression, emergency/skip divergence or warning obstruction; skill balance signed off; owner explicitly authorizes merge/deploy | Focused test files, authoring docs, PR reviews, optional separately authorized device tests |

**PR strategy:** Keep #440 as the draft design/audit source. Implementation stages should be distinct draft PRs (or a carefully rebased integration branch) without merging partially authored critical functionality into production. The feature gate must not leak dormant UI/save claims. A code PR may include newly authored tests but not modify unrelated optimization or rendering algorithms.

## 5. Authorial decisions needed before Stage 5 and full activation

1. **Book balance:** five manuals x provisional **+1 percentage point** (hero 10% → 15%); exact max and any later modifiers.
2. **Inheritance:** Shared Training ratio (proposed) vs Shared Strength vs a separate rule; whether retired/reserve members inherit automatically when active.
3. **Claim mechanics:** interact-and-learn immediately vs require clearing the room; placement and dialogue; confirm books stay optional.
4. **Succession and Peace:** campaign-wide shared knowledge across new heroes, how books remain claimable after the realm becomes peaceful.
5. **Move details:** approve specific consequence and cap for each real action; make boss/disabling/heal variants deliberately bounded. Crit indicator's placement/lifetime and priority under crowded conditions.
6. **RNG ownership:** shared legacy stream vs isolated saved stream. Choose based on deterministic-fixture coverage, not performance folklore.

## Final verdict

**Proceed with implementation planning, not direct rollout.** The game's modular combat, inspectable side interiors, existing inheritance fractions and shared Canvas cue surface make this realistic and avoid new art/audio/geometry. With one roll per action, fixed authored lookups, five claim flags and <=12 transient glyphs, the *direct* performance cost should be small **by design**; actual performance impact remains **unmeasured**, particularly in crowd/boss encounters where better heals and crowd control affect AI workload. The critical action catalog, RNG determinism, finite cue budget, v4 saves and measured comparisons are the gates for safe activation.

**Current PR #440 contains only documentation. No gameplay, CI, release, or deployment was performed by this audit.**
