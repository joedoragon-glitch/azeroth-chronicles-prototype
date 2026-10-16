# Ashen Frontier — combat canon, feasibility and integration acceptance audit

**Date:** 12 October 2026  
**Status:** Documentation-only candidate on an isolated branch. Not published gameplay; no merge, deployment, or auto-merge authorization.  
**Tracking:** [master #232](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/232) · [Frontier #240](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/240) · [Abyss Dragon #243](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/243) · [boss/captain #247](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/247) · [audiovisual #257](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/257)

## 1. Owner's decision — what must survive the consolidated update

The owner confirmed on 12 October 2026 that the adjusted **Ashen Warlord**, **Veyrith / Abyss Dragon** and **Cinder Warlord** mechanical work in their unmerged development branches is the **intended future Frontier encounter canon**. When the single coordinated worldbuilding update is prepared, faithfully reconcile those changes together, rather than treating the already-published combat as the final specification or substituting names and descriptions for mechanics.

The intended encounter contracts are **owner-approved in principle**. This is *not* automatic approval of speculative surrounding biography (Veyrith's name is approved, while longer proposed psychology/succession details remain separately reviewable), of any unreviewed code difference, or of a release.

**Definition of mechanically done:** approved intention → runnable AI/tick/resolve behavior → legible real gameplay result → verified test evidence. Each ability must do what it says: attack selection, cadence, aim/target, warning, collision, damage, status, movement, recovery, audio/VFX, counterplay, summons, despawn/reset and save lifecycle. A correctly named attack, a directly invoked test method or a green *separate* PR is not enough.

Continue the canonical multi-file GitHub Pages/PWA architecture. Do not constrain implementation to a portable single-HTML game. Do not merge, deploy, tag or replace another branch's shared combat files without an owner-approved integration.

## 2. Evidence state — baseline, PRs, tests, uncertainty

Source snapshot reviewed 12 October 2026:

| Scope | Reference | State at review | Evidence |
| --- | --- | --- | --- |
| Published baseline | `main` [6f8089b](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/6f8089b2013647184efb04932fe6157f548238b9), `package.json` v0.9.1+update.1 | Published code, NOT the proposed encounter canon | Current source reviewed |
| Ashen Warlord | [PR #230](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/230), head `49be85ec89ac7201f72d3c2fd9308f215235ccad` | Unmerged draft | Exact-head Actions [38146370657](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38146370657) successful |
| Cinder Warlord | [PR #231](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/231), head `1e298f14299518186a9166cc658fb4b9a9979fce` | Unmerged, review-ready | Exact-head Actions [38148136172](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38148136172) successful |
| Veyrith | [PR #254](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/254), head `95b7dd504fab252b9173257c408f0cdac69c7406` | Unmerged draft | Exact-head Actions [38152227774](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38152227774) successful |

Each PR was developed from the earlier v0.9.0 `main` at `d7d2c22485b08265b31bf595305ef952b40b72cd`; the reviewed current main had advanced **75 commits**, including newer combat, renderer, input, save and performance edits. GitHub reported the three PRs **not directly mergeable** at review. Independent successful workflows **do not** prove combined correctness. No new manual full encounter or integrated-branch gameplay was conducted in this audit.

Canonical references: [Frontier occupation layout](ASHEN_FRONTIER_OCCUPATION_LAYOUT.md), [Abyss air superiority](ABYSS_AIR_SUPERIORITY_CANON.md), [#230 boss implementation register](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/feature/boss-identity-pitstop-20261011/docs/BOSS_IDENTITY_PITSTOP_AUDIT.md), [#254 aviation implementation](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/feature/243-veyrith-abyss-identity/docs/ABYSS_DRAGON_AVIATION_IMPLEMENTATION.md) and [move mapping](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/feature/243-veyrith-abyss-identity/docs/ABYSS_DRAGON_AVIATION_MOVE_HANDOFF.md).

## 3. Feasibility — no major new engine required

Scale: **1** = trivial text/config; **2** = local use of existing primitives; **3** = cross-system state/counterplay/presentation; **4** = substantial integration/testing; **5** = new subsystem/architecture.

| Approved adjustment | Difficulty | Implementation already available | Required completion/verification |
| --- | --- | --- | --- |
| Ashen Warlord: Banner Bombardment six simultaneous circles | **2/5** | #230 changes `rules.attacks.warlord[1]` to six and spreads circle positions via `boss-combat.js` | Fix stale two-circle description in #230 `data.js`; verify six visible warnings, matching damage geometry and actual escape lanes |
| Ashen Warlord: stationary Choking Ash | **3/5** | #230 implements 180-unit radius; 6s on / 12s inactive; 35% miss, 30% movement reduction, 2s aftereffect; drawn in `renderer.js` | Communicate automatic engage/timed activation accurately; full hero + companion movement/attacks, duration, death/disengage/save cleanup and audio/VFX |
| Ashen Warlord: existing combo, pursuit, guard command and TRUE | **2/5** | Existing encounter framework preserved with #230's added effects; base boss HP/damage unchanged | Combined AI, summon cap, rewards, Lyss quest, field path and TRUE checks |
| Veyrith: seven aviation-themed technique names | **1/5** | #254 wires four `data.js` primary attack names plus three `rules.js` specialist names | Verify actual visible warning/log/audio text and coherence; names alone do not satisfy the mechanical design |
| Veyrith: Lazy Eight, High Yo-Yo and Wingover movement | **3/5** | #254 extends existing collision-aware world-coordinate movement with bounded waypoints and paths | Test actual AI selection; movement through map obstacles, target/telegraph fidelity, hits and scatter after motion, timeout/fallback/engagement resets and TRUE |
| Veyrith: Go-Around retreat before recovery | **3/5** | #254 moves away then restores the existing bounded 8% health after motion | Test blocked path, delay/interrupt/lifecycle behavior, cooldown and observable heal outcome |
| Veyrith: readable aerial identity | **2–3/5** | World motion is present; no dedicated handler of new `aerial` state detected in candidate renderer/VFX code during audit | Consider restrained procedural banking/trails/shadow/flight cues; must avoid misleading altitude or hit geometry; no real 3D flight or animation engine |
| Cinder Warlord: 3,000 HP and historical-save migration | **2/5** | #231 sets `enduranceHp: 3000` and one-time upgrade marker | Verify existing saves, fraction preservation during migration, cleared captains and return/respawn behavior |
| Cinder Warlord: enlarged two-stage Violation Marker | **2–3/5** | #231 `captainRadiusMultiplier: 2`, two sequential circles and normal telegraph path | Explicitly test overlap timing, real radius of both warning and damage, exit lanes on real Frontier geometry, phone readability |
| Cinder Warlord: Mandatory Overtime at 60% every 12s | **3/5** | #231 recruits up to seven nearby **existing** hostile ordinary mobs on activation and repeats while engaged | This is an **order**, not a spawn; verify available local population, real path/order following, range/leash, cleared-area outcome, repeated orders, reset and old saves |
| Combine all three PRs with present main, including shared `boss-combat.js` / `engine.js` | **4/5** | Each PR is independently coded | Purposeful diff-by-diff reconciliation; protect intervening v0.9.1 fixes; avoid wholesale last-writer-wins source copies |
| Full integration and platform certification | **4/5** | Established regressions, Chromium/WebKit and PWA workflows | Real scheduler-driven seeded encounters plus final exact-combined-SHA suite; owner-approved publication separately |

**Overall:** High feasibility, with **mostly 1–3/5 remaining individual engineering**, **4/5 integration/validation**. None of the approved Frontier abilities demonstrably requires a new engine. True airborne altitude and a general flight-physics engine would be much larger, but are *not* part of the approved scope.

## 4. Specific semantic mismatches and acceptance gaps

### Ashen Warlord

- **Confirmed contradiction:** #230 `src/prototype/rules.js` defines six Banner Bombardment circles and `boss-combat.js` creates six, while #230 `src/prototype/data.js` still says **two**. Correct the player-facing description to six before candidate integration.
- **Communication:** Choking Ash is activated on aggro and periodically regenerated in `engine.js`, not selected as an ordinary boss attack in `rules.attacks`. The renderer visualizes the 180-unit cloud, but player-facing attack text should explicitly explain this automatically occurring positional hazard, with accurate linger/recovery language.
- **Verify, don't infer:** the focused #230 test proves six patch objects and initial 6s/18s timestamps; it does **not alone** certify 35% miss distribution across all actual attack paths, correct companion movement penalties, 2-second trailing effect, lifecycle or navigable field-boss escape routes.
- Keep Ashen Warlord the **regional military governor**, preserve Orc guard warband, Lyss progression and unchanged preapproved HP/damage.

### Veyrith / Abyss Dragon

- Seven terms from the aviation handoff: **Compressor Surge** (cone), **Wake Vortex** (ring), **Lazy Eight** (two sequential landings with waypoint banking), **Scramble Order** (existing Ash-beast summons), **High Yo-Yo** (dash/feint), **Wingover** (scatter/reversal), **Go-Around** (existing bounded recovery after withdrawal).
- #254 contains meaningful movement state and behavior in `boss-combat.js`; not just attack-label substitutions. Current candidate tests directly start and resolve attacks and drive `advanceMotion`, including normal/nightmare and normal/TRUE, but a full encounter must still verify scheduler selection and event ordering through `updateEnemies` / `tick`.
- **Visual communication gap:** searched #254 `renderer.js`, `visuals.js`, `combat-visuals.js`, `enemy-vfx-art.js`, `enemy-vfx-events.js`; no dedicated use of the new `aerial` motion identifiers was found. A moving static body can still work, but the intended banking/flight identity may not read without minimal VFX. Evaluate this against #257; preserve procedural canon and telegraph clarity.
- Distinguish **real-world-plane terminology** as playful naming from actual aircraft/true altitude. **Scramble Order** currently uses existing **Ash-beast** summons, not a new breed of military dragons. Avoid text that suggests deployed squadrons; if the name “hatchlings” remains in prose, confirm it fairly describes existing visuals and species.
- Preserve the **personal purple mount**, genuine prior flights and the **unfinished** Bastion air-superiority program. The owner-approved *name* Veyrith is not blanket approval for every long-form candidate biography. Keep Eren rescue, dungeon trap/route design and v4 `abyss` keys stable.

### Cinder Warlord

- #231 retains the roaming **inspector / regional middle manager**, distinct from the Ashen Warlord governor. At 60% health, **Mandatory Overtime** accelerates the captain and issues a timed recruitment order to up to seven **existing** nearby mobile hostiles (900-unit scan); it does **not** create seven fresh guards every cycle. Repeats at 12s cadence while engaged. 
- The implementation test inserts an eligible worker, triggers the phase and runs an update tick to prove recurrence. The open question is **actual Frontier population and routing**: already-cleared areas may have zero recruits; distant or blocked units may fail to create visible pressure. This can be meaningful counterplay if player-facing expectations match, but should not be misrepresented as a spawning skill.
- #231 makes **Violation Marker** two large sequential circles. Check actual floor-space safety and precise timing instead of presuming circles cannot overlap; verify multi-stage visual warnings reflect the final hitboxes.
- Preserve the existing inspection yard, patrol, respawn, roads and ordinary-hostile camps. Do not quietly invent new troop types or make unrelated world mobs globally military.

## 5. Implementation and testing ledger for future integration

The future integrator should create a feature-by-feature ledger with **main baseline | approved design | exact PR/code owner | overlapping changes | implemented status | deterministic test | remaining concern**. At minimum:

- [ ] Branch from the **then-current** main and reconcile #230, #231 and #254 with intervening changes **per method/hunk**. Keep source-protection fixtures intact unless an expressly reviewed, narrowly scoped changed baseline demonstrates unaffected cases still match.
- [ ] Make Warlord six-circle and Choking Ash text/cues truthful; verify both heroes/companions and condition cleanup, no extra damage/HP retunes.
- [ ] Verify all seven Veyrith moves via AI scheduling/ticking and real resolution, normal/TRUE, normal/nightmare, path block, landing warning, recovery and VFX/audio; do not require full altitude simulation.
- [ ] Verify Cinder migration; Violation Marker radius/impact/counterplay; periodic order behavior with seven, few, and **zero** eligible nearby workers, plus cleared territory, range/leash and respawn.
- [ ] Exercise Paladin/Mage/Ranger, living/fallen party, solo/squad, saved/loaded halfway through active effects, boss victory/captive rescue and reentry; never persist orphaned transient hazards, motion, recruited flags or stuck cooldowns.
- [ ] Protect quests/rewards (Lyss/Eren), previously defeated bosses/captains, internal `warlord`/`abyss` identifiers, TRUE credits, Awakening/peace transitions, road exits, other-region encounters and historical v4 save import/export.
- [ ] Confirm matching visual warning ↔ actual collision geometry, reliable sound/VFX routing, render clarity on desktop and phone; avoid false claims of physical-device or subjective feel testing.
- [ ] Run full build/check, Node, Chromium/WebKit desktop/mobile, regression protected fixtures, PWA/offline/update and Pages artifact checks **on the exact combined SHA**. Document CI links, reproducible encounter evidence, actual deferrals/risks and rollback before requesting separate owner approval.

## 6. Prioritization and release disposition

**Straightforward:** correct text and move labels, retain authored base parameters, ordinary asset/event registrations.  
**Moderate:** Warlord hazard effect lifecycle, Veyrith collision-aware motion completion and presentation, Cinder multizone hit warnings and population-sensitive orders.  
**Most demanding:** reconcile three overlapping PRs against newer main while safeguarding unrelated changes and attaining deterministic full-game integration evidence.

**Recommendation:** keep all three owner-selected combat designs. Do not drop or simplify an ability solely to make a branch trivially mergeable. Escalate only a **demonstrated**, reproducible engine limitation or actual encounter failure to the owner, with a minimal faithful alternative rather than a silent replacement. This audit is documentation, not an implementation or certification.
