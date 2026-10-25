# PR #440 — Actionable Remaining-Stage Gates, Regression Matrix and Evidence Ledger
> **CURRENT BASELINE UPDATE — 25 October 2026:** PR #439 **merged** on 25 October 2026 (merge commit `7d9649151bbff578ecb34c01edfb2e14abb9d9ea`), so the Stage 2 reconciliation target is **CURRENT MAIN including #439**, not a still-open #439 branch. Main package version observed: **dev.183**. Read the [updated PR #440 handoff](PR440_INDEPENDENT_WORK_HANDOFF_20261024.md); preserve FIFO Skill 1 controls and three-form/timer mechanics. Any old "PR #439 open" instructions below are dated historical checkpoints. **PR #440 remains draft and its gameplay remains OFF.**



**24 October 2026 (America/New_York) — ongoing handoff checklist.**
Read [the independent PR handoff FIRST](PR440_INDEPENDENT_WORK_HANDOFF_20261024.md). This file is the **execution checklist**, not a second design authority. Owner's newer three-Level **strength architecture** supersedes earlier free-form per-move critical balancing proposals. The seven **implementation stages 0–6** remain separate.

## Decision and status key

- **[x]** Committed, source inspection confirms existence; detailed acceptance may still be unchecked.
- **[ ]** Not implemented or unverified; do not infer completion from a nearby green test.
- **HOLD:** the mechanic cannot be enabled/merged/published even if individual source edits exist.
- **Evidence classes:** D = documented contract/static source, F = isolated fixture, N = real native Campaign targeted regression, B = browser presentation smoke, H = measured device/performance, C = CI workflow green. Do not substitute F for N, or C for H. All future test statements should name the class, command and checked commit.
- **Separate approvals:** stage development is authorized; broad full-suite/browser matrices, merging, publication or deployment are **not**.

## Gate A — Stage 0 source roster + Stage 1 core preservation

- [x] Stage 0 action catalog at [Stage 0](CRITICAL_EXECUTIONS_STAGE0_ACTION_CATALOG_PR439_20261025.md). Source-derived scopes include hero 51, standard troop 6, pet 33, healing/support, current boss descriptions 54, captains 21, 5 captain phases plus ordinary/Rogue/night families. **These numbers are not a count of implemented crit effects.**
- [x] Stage 1 independent 10% chance pools, isolated seeded source, disabled resolver and WeakMap action identity [code](../src/prototype/critical-executions.js).
- [ ] On reconciled latest main/#439 code, run the read-only attack generator and map its **actual current output** to unique action releases. Existing historical 251 presentation IDs and older boss/captain counts are NOT certification. Useful files: scripts/monster-attack-audit.cjs, scripts/enemy-vfx-inventory.cjs, rules.js, data.js, engine.js, boss-combat.js.
- [ ] Confirm source-relative hero Skill 1 identities, slot 2–8 abilities and all 11 pet definitions in #439's latest branch. Maintain the same-slot FIFO queued-charge owner's clarified rule.
- [ ] Establish deterministic per-campaign critical RNG initialization, reload/restart/succession ownership and snapshot correctness **before** turning on rolls. Stage 1 seededStream.snapshot() alone isn't campaign save logic.
- [ ] Do not import dormant modules into build script graph or auto-enable until Stage 2/3/4/5 acceptance and final activation gate.

## Gate B — FINISH Stage 2 (highest-priority next engineering work)

### B1. Dependency reconciliation and safe edit scope
- [ ] Fetch live #440/#439/main refs, diffs, checks and [#439 handoff](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/design/hero-skill1-self-taught-combat-20261024/docs/PR439_INDEPENDENT_WORK_HANDOFF_20261024.md). Record exact SHAs and the resolution strategy in #440 before touching any overlapping source.
- [ ] Preserve Skill 1 auto / Tap / Charged, distinct basicCd/cd/chargedCd clocks for all 8 slots, native 0.65s charge and FIFO simultaneous queued forms, Recall/protected Thornfang, Shield Stance and Mage Silence.
- [ ] Replace optional wrapper for party tick methods; retain pure kernel/level modules and tests as suitable. Avoid per-frame action-history copying and O(party size) scans on each tick.

### B2. Direct hero release hooks
- [ ] One legal hero-auto beat roll, not one per combo splash target; the third finisher inherits its initiating beat outcome; no new automatic approach/cast.
- [ ] Skill 1 Paladin Tap one projectile; Mage Tap one narrow beam; Ranger Tap **one release / three arrows**; canceled or queued Skill 1 rolls zero.
- [ ] Charged Paladin Cross **one release / two separately timed pulses / max 8 distinct admitted foes**; cross and all pulses share receipt; no roll at 0.35s or on new eligible victim.
- [ ] Charged Mage Wide Beam **one release / all eligible foes once**, no arbitrary target limit; respects walls and protected targets.
- [ ] Charged Ranger Hawk **one launch** plus zero or one valid impact; existing retreat interruption is **on legal contact only**. Define meaningful critical when no interruptible retreat is active without adding universal stun/targeting bypass.
- [ ] All hero Slots 2–8 Tap+Charged in three classes, including Ranger heal/haste, Paladin stance and sanctuary, Mage chain/fracture/silence; each original consequence receives at most one bounded effect.
- [ ] Shield Stance rolling on stance-raise only, no extra roll for toggling OFF and no repair of original cooldowns by the critical resolver.

### B3. Direct companion and pet release hooks
- [ ] Soldier basic, Archer basic, Soldier Power Strike, Archer Triple Shot, Soldier Holy Cleave, Archer Piercing Volley: legal released attack only, charged second roll after complete cast, not at charge start.
- [ ] All 11 pet families: basic, first and second actions; no delegated double roll from party.js into party-pets.js; ranged shots carry immutable receipt.
- [ ] Ranger HP support: actual caster, one cast and one total heal budget distributed by native five-second HoT, never new rolls per tick. Mana support currently gated/dormant: no phantom chance until legal mana skill use.
- [ ] Original pet self-heal, single-ally heal and ward: apply consequence only on valid contact and with original caps; no ability to revive fallen units or stack strongest-only protections.
- [ ] Recall troop and pet defensive counters use an explicit committed release, **including failed/missed melee**; do not rely on hit events alone.
- [ ] Slow, Veteran cover, silence, companion charge holds, death/recovery, group stance/formation and neutral/protected actor rules retain original semantics.

### B4. Apply authored three-tier critical consequences correctly
- [x] [centralized Level 1/2/3 registry](../src/prototype/critical-levels.js) contains **92 keys**: hero 51 + troops 8 (6 attacks + heal/mana) + pets 33. Independent Hero, Companion, World controls with all default Level 1; Nightmare World Level 3 is merely opt-in. Separate from crit chance.
- [ ] Review each of 92 registry levers against REAL current-native effects and choose an existing meaningful fallback where needed. Known problems: Hawk retreat lock without retreat; Paladin stance toggle; Archer first Slow only in some Veteran situations; conditional heal/ward; dormant mana. Explicit mapping must not silently yield an invisible crit.
- [ ] Apply one typed/verified enhancement **before** owning damage/heal/status resolution and pass original method-specific bounds. Do not augment a result twice through projectile+target handlers. Stronger healing cannot exceed maxHP; mitigation can't grant unauthorized immunity; Slow/Fracture stack rules unchanged.
- [ ] Check any new tuning API does not accidentally change chance. If developer intensity changes while missiles fly, existing receipt retains its sampled tier.
- [ ] Establish no unknown party action silently falls back to ×2 damage or gets a spurious crit icon.

### Stage 2 minimum focused native acceptance
| Scenario | Prove | Suggested test owner |
| --- | --- | --- |
| 3 classes × basic still/moving, including finisher | Same native damage/targeting OFF; ON rolls one per beat, no extra splash roll | tests/critical-party-native.test.cjs (proposed) + #439 hero tests |
| Paladin Cross, Mage wide beam, Ranger hawk | One receipt persists through distinct pulses, multiple foes or homing; protected boss/terrain safety | Native Campaign hero combat fixtures |
| Skill 2–8 normal/charged | FIFO queue, cancellation, cooldown timer separation and conditional original effects | #439 Skill 1 and charge tests + new targeted tests |
| Soldier/Archer basics and charged first/second | Valid release/timing, no per-projectile/per-target reroll; Recall/cover | Native party/squad tests |
| 11 pets, each basic+2 specials | 33 keys actually reachable and legal, contact heal/ward/buff once | Native party-pets tests |
| Auto Ranger Heal and manually queued support | Exactly one selected caster, one five-second heal budget, no extra tick rolls | Native party/healing tests |
| All three global Level settings | Changing one group affects only future critical strengths for that group; Level 1 defaults, separate Nightmare override | tests/critical-levels.test.cjs and native smoke |
| Negative outcomes | Failed target/line/range/charge/peace/immortal phase doesn't consume an illegal roll or bypass checks | Character/party/encounter tests |
| Baseline equivalence | With feature OFF, same action sequence, RNG, HP, cooldowns, saves, effects count, event history and frame workload | Paired native replay |

**Gate B completion definition:** source-owned bounded pre-consequence effects are integrated for all valid party actions, targeted native tests pass and no per-frame critical scanning remains. A passing isolated adapter fixture alone **cannot** close Stage 2.

## Gate C — Stage 3: world hostiles, specialists and TRUE forms

- [ ] Reconcile latest world/mob/boss/TRUE/captain attack tables and the actual old presentation inventory generator against current source; check the historic count mismatch and any new #439 boss retreat paths.
- [ ] Add explicit **world** action keys/three-level original-effect levers. Preserve native authored names and cases; no universal damage fallback. Separate hostile/world 10% source and World intensity 1–3.
- [ ] Ordinary melee/ranged for all species/roles and ranged force/guardian/ringleader variants: one roll per swing/shot at release, not per hit/target/AI-think tick.
- [ ] Tactical Rogue basic/signature/retreat, night Wraith drain/Stalker pounce, enemy support healing, ringleader Frenzy trigger distinction; inspect real Goblin dust recipient-versus-attacker semantics and direct-target protection.
- [ ] Five captains (including specialist Dreadmaw), 11 boss families in normal and TRUE variants (including Cindermaw custom owner), summon/area/motion/recurring damage/ward/self-recovery.
- [ ] Define whether each multi-stage authored move is one activation or genuinely separate actions. Keep emitted warning, recovery, hazard count, target cap, phase reset, one-time final returns and boss healing mechanisms unchanged.
- [ ] No automatic critical for standalone Frenzy/phase presentation, environmental trap or passive life-steal tick unless a real owned activation exists.
- [ ] Targeted hostile fixtures: crowded ranged, ordinary vs guardian, 12-species healing, protected Thornfang entrance, TRUE transitions, Cindermaw delegates (one original authored activation semantics), Dreadmaw multi-leg, Dark Lord Second Wind, summoning at cap, enemy heal over time, all critical levels.
- [ ] Core safety: no enemy crit increases target footprint, warning-free harm, collateral aggro, death-roll triggers or total live-unit caps.

**Gate C definition:** every *eligible* hostile actor action owns one world-domain release and per-action Level 1–3 effect, with explicit test-backed exclusions for passives and protected scripts; no missing world keys.

## Gate D — Stage 4: exclamation indicator

- [ ] One downward-pointed **!** above **the acting performer** on critical release (party or hostile), not the victim; no new sound or delay; never use saved engine.event() for cosmetic critical cues.
- [ ] Separate bounded presentation channel (initial proposal <=12 active cues and <=1 cue per actor), no eviction of the normal 40-effect VFX queue.
- [ ] Actual-world-draw-aware visibility (~0.5–0.8 sec visible is a proposal, plus bounded absolute expiry); skipped normal draws can't erase cue unseen; genuine emergency holds simulation intentionally, must remain safe.
- [ ] Both Canvas world and Pixi world + Canvas combat overlay draw at correct feet/head/nameplate depth; don't hide quest !, targeting, warning circles, HP or party marks.
- [ ] No extra frame request or draw; bounded O(active cues) update; transitions/deaths/reloads erase stale cues; no saved state.
- [ ] Targeted Canvas/Pixi, HUD small-phone, low-resolution, high-contrast/night, skip under 20–30/30–60 Auto FPS, critical emergency and path-travel tests.

**Gate D definition:** accurate visible cue under both render paths, skip/emergency-safe and no event/FX pollution or independent frame work.

## Gate E — Stage 5: Codices of the Unforeseen and save v4

- [ ] Decide exact per-book percentage-point bonus/cap (provisional +1pp ×5), inherited bonus via Shared Training vs another explicit contract, whether monsters must be cleared before claiming, and Peace/death/succession/restart persistence. Record actual owner decision before coding.
- [ ] One inspectable book at each of five walkable locations with original inhabitants/geometry/canon/traps unchanged:
  side-vale-cellars / Old Orchard Cellars / The Art of Misdirection;
  side-march-watchhouse / Drowned Watchhouse / The Waterline Gambit;
  side-highlands-signal / Old Signal Keep / The Measured Blow;
  side-frontier-shrine / Ruined Shrine / The Feigned Opening;
  side-crown-foundry / Ruined Foundry / The Final Adjustment.
- [ ] Five unique boolean one-time claim flags, idempotent read/claim, never use merely discovered side-interior lore. No duplicate bonus on repeated entry or reload.
- [ ] New and historical v4 campaigns migrate/validate exactly; false/missing default and corrupted flags repair/reject per native owner; no mid-flight receipt persistence. Include #439's new basicCd and chargedCd migration fields.
- [ ] Derive chance from count/flags/training at read time; hero base 10% plus earned books; Soldier/Archer/pets start at their unchanged 10% and inherit **earned excess only**; no chance leak to world-domain monsters.
- [ ] English/Spanish lore and numerical combat reference, sensible HUD or Archive reference; no in-game burden for the player to operate the developer intensity controls.
- [ ] Tests: first/duplicate claim, 0..5 books, 0..5 training levels, cross-zone reentry, roster reserve/recruitment, restored saves, succession/Peace, old format, offline reload, no performance scans.

**Gate E definition:** approved lore/bonus/inheritance, exactly-once rewards and backward-compatible saves in focused native checks.

## Gate F — Stage 6: complete integration, performance evidence and owner review

- [ ] Stage 2 + Stage 3 explicit 100% eligible released-action matrix, with exclusions reasoned and reviewed; locked action IDs; no uncatalogued silent fallback.
- [ ] Confirm separate party/world **probability** 10%, and independent Hero/Companion/World **intensity** defaults 1. Explicit Nightmare World=3 changes World only if developer opts in.
- [ ] Paired SAME encounter seed/position/party/AI settings: **OFF**, **shadow critical roll** (no outcomes), **mechanics ON** without glyph, **mechanics + glyph ON**. Compare encounter outcomes separately from direct computation so a longer fight isn't confused with CPU overhead.
- [ ] Capture existing frameProfile/p95 stage times, callbackFps versus displayedFps and stage costs, frameSkip skip/recovery and emergency entries, animation/FX cap, memory and save cadence; respect CPU vs GPU measurement limits. Rough >5% repeatable med/P95 degradation is an *investigation trigger*, not a proven threshold.
- [ ] Focused Node/native/regression, three hero classes, 11 pet families, 12 hostile species, boss/TRUE, outdoor crowds, secondary interiors, both FPS Auto modes and manual mode, both Canvas/Pixi paths; phone/Chromebook targeted acceptance by owner when available.
- [ ] Re-check Power, status, survivability and crowd performance at Level 1 before suggesting optional Level 2/3; don't silently lock Nightmare=3 or change difficulty scaling.
- [ ] Verify no extra combat callbacks, audio voices or saved event backlog; no new game loops or broad per-frame code. Legacy saves and emergency runtime remain stable.
- [ ] All affected scripts registered in offline multi-file asset graph and version/cache updated only when preparing authorized activation; deterministic production build and service-worker/offline checks. No runtime new-file auto-load assumption.
- [ ] Run only impacted focused tests by default. Do NOT launch the manual comprehensive game/Chromium/WebKit workflow without separate owner approval. Capture exact commands, full pass/fail summary, tested SHA and whether run was local/CI/device.
- [ ] Final owner decision on readiness, balance, feature flag and **separate explicit permission** before merging/publishing. A green PR workflow isn't authorization.

## Exact initial commands for the next Work/checkout session

Use a checkout of #440 with its dependencies available; these targeted isolated tests are safe and small:

~~~sh
node --check src/prototype/critical-executions.js
node --check src/prototype/critical-levels.js
node --check src/prototype/critical-party-integration.js
node tests/critical-executions.test.cjs
node tests/critical-levels.test.cjs
node tests/critical-party-integration.test.cjs
~~~

After reconciling #439, expand to the smallest impacted native tests and focused build checks. Do **not** substitute npm test / npm run test:quick as if either were a narrow 3-file run (test:quick is an explicit suite allowlist that omits these new tests). Read the live .github/scripts/focused-ci.cjs and workflow before claiming automatic impacted-test coverage.

**Known historical evidence:** earlier isolated core tests and fixture checks passed in JavaScript CommonJS compatibility harnesses; prior #440 focused workflow [#40157134506](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40157134506) was green on the pre-handoff head. This **does not** prove the new per-action improvements have been exercised inside Campaign or that a renderer/browser/device accepted them. Update this ledger with each new checked commit and relevant test artifacts.

## Per-checkpoint report template (append at every stage)

~~~text
Checked date/time and branch:
#440 head / current main / #439 head:
Stage and exact scope:
Source files changed and why:
Chosen effect keys/strength levels and unresolved decisions:
Focused test command(s), environment and complete pass/fail:
Native-vs-fixture-vs-browser/device classification:
Runtime/performance evidence (or "not measured"):
Save, rendering, queue and #439 regression status:
Stage acceptance criteria passed / still missing:
Merge/deploy: NO (unless separately owner-authorized)
Single next step:
~~~

**No task box is a claim of live readiness unless source, tests and owner review support it.**
