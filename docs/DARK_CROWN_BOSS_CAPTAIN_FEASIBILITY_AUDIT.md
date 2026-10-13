# Dark Crown — boss, captain and finale feasibility / integration audit

**Date:** 12 October 2026  
**Purpose:** Durable engineering handoff for the intended next worldbuilding update. This document is an audit and implementation contract, **not a claim that the update has shipped or been tested together**.  
**Main baseline inspected:** \`6f8089b2013647184efb04932fe6157f548238b9\` (published v0.9.0 source)  
**Authority and scope:** [#232 master](../issues/232), [#251 audit](../issues/251), [#247 encounters](../issues/247), [#241 Cindermaw](../issues/241), [#244 Ash Sentinel](../issues/244), [#257 audiovisual](../issues/257), [#266 approved finale](../issues/266).  
**Owner clarification, 12 October:** The selected unmerged proposals and their intended revisions belong to the **future canon to be faithfully implemented**. They may not be discounted solely because they are not merged. Distinguish approved later revisions from superseded text; **do not** treat an earlier PR description as overriding its newer source, owner correction or dependent patch. Likewise, candidate implementation is not proof of functioning released gameplay.

## Executive feasibility judgment

**All four Dark Crown encounters and the approved finale are reasonably achievable in the existing multi-file GitHub Pages/PWA engine. No general combat rewrite, new game engine, sprite-system rewrite or artificial portable-HTML constraint is warranted.** The hard part is source reconciliation, truthfully communicating new danger geometry, persistent phase correctness, historical save progression and combined runtime validation—not the absence of necessary primitives.

Effort scores below are **relative engineering estimates**, not hours, dates, completed test results, difficulty/balance endorsements or authority to omit mechanics:

| Workstream | Relative effort (1 easy–5 demanding) | Current evidence | Primary extra work |
| --- | --- | --- | --- |
| Cindermaw field boss | **2/5 — low** for current fight; optional biography mostly text | Normal/TRUE plans and Ash-beast summons on \`main\`; #241 explicitly has not certified live combat | Normal/TRUE activation, reach, summon cap/reset, Vera rescue, durations/party balance; concise roost/mentor cues |
| Dreadmaw Treasury captain | **3/5 — moderate** | [#231](../pull/231) implements 5,000 HP, four broodlings, 25%-each protection, phase refill, eight-second reflection; focused mechanics/reachability tests | No invulnerable softlock from unreachable brood; four-slot metadata cleanup, real 5-companion load and warning/reflect clarity |
| Marshal Veyra / Ash Sentinel | **4/5 — high** | [#255](../pull/255) implements canister, moving real soldiers, five-leg charge, independent 4×4 board; [#263](../pull/263) corrects dependent telegraphs; focused tests exist | Old attack names versus actual combat, range selection, five-leg wall/leash semantics, simultaneous board/traps/crowd, audiovisual/phone readability |
| Dark Lord final boss | **4/5 — high** | [#261](../pull/261) has expanded veteran kit, states, phase reset and deterministic tests; [#265](../pull/265) labels protected sector | Many interacting mechanics, damage attribution, true projectile interception, real movement geometry, correct recovery/reset/VFX/SFX, party-size fairness |
| Approved throne–Awakening–credits finale | **4–5/5 — higher cross-system integration** | [#266](../issues/266) is approved design, **not shipped**; [#256](../pull/256) contains reusable peace/interior fixes but an obsolete no-coronation ending | New throne interaction, crowned presentation, existing TRUE credit, optional appointments, rest sites, credits/Nightmare, version-4 legacy state and navigation |

### Interpretation

- **Straightforward:** wording/narration, existing scenery, correcting active attack display names and move metadata, bounded summons using the existing code path, ordinary milestone cues, most procedural VFX corrections.
- **Moderate:** captain HP migration, brood protection/reflection/renewal, phase-state cleanup, small class-specific royal presentation, ordinary objective navigation and cross-location rest actions.
- **High:** independent persistent multi-target hazards while other boss actions execute; multi-leg collision-validated movement in a populated trap-heavy dungeon; multiple simultaneous Dark Lord reactions/target selection; exact combined branch and save/ending integration.
- **No demonstrated engine impossibility:** Nothing reviewed requires abandoning the intended canon or replacing the underlying Canvas/isometric simulation. A prototype passing a focused test is **not** a pass for balance, physical phone or integrated play.

## Encounter-by-encounter technical contract

### Cindermaw — field boss, not an Awakening successor

**Intended identity:** Ash-beast leader in an inhabited roost; promoted from ordinary Ash-beast origins, governs a distinct sphere; Dreadmaw is his Treasury captain/mentee and admires the Dark Lord. The precise short origin/promotion story remains to be expressed in player-visible form, not silently invented.

**Released \`main\` contract:** \`cindermaw\` family, Normal and TRUE, four plans (frontal Cinder Rend, charged Ash Rush, three persistent Furnace Spit circles, capped Ash-beast Brood Command), Vera rescue, Treasury den and its three caches. \`src/prototype/data.js\` and \`rules.js\` provide the existing abilities; \`#241\` explicitly warns that a configured fight is not sufficient proof.

**Difficulty:** Low to check configuration and adapt existing lore props; moderate for full late-party/TRUE behavioral verification. No proven failure should be asserted before reproduction.

**Required evidence:** Trigger and reach in its real roost; the four plans resolve under actual range/cooldown selection; TRUE entourage and summon caps reset properly; Vera and quest rewards remain correct; fresh/old saves, Normal/TRUE, party focus-fire, representative durations, phone warnings and no blocking geometry. Only propose balance changes when the tests show a problem.

### Dreadmaw — four-brood protection puzzle and damage-reflection phase

**Intended/implemented [#231](../pull/231):** Named captain remains \`supply-crown\` and Cindermaw's mentee. Base endurance budget **5,000 HP**, four broodlings (three melee, one ranged), **25% damage reduction per living broodling** and therefore **100% reduction at four**; summoned brood must be removed strategically. At **45% HP**, Ash Carapace refills missing brood to four; instead of the old six-second damage reduction, reflect **30% of actual incoming damage** for **eight seconds**. Zero actual damage must not reflect. Captain retains its existing attacks/reward and Treasury identity; historical HP migration preserves proportional health, not multiplying old balance revisions.

**Feasibility:** The captain summon owner tracking, mitigation, reflection and phase hooks already exist on the PR. Focused \`tests/captain-mechanics-audit.test.cjs\` checks four-brood immunity, unblockable-versus-reachable spawn positions in an example map, reflection and cleanup. These are helpful, **not certification against every historical/save layout**.

**Integration defect to reconcile:** \`rules.js\` on the draft uses \`summon.cap: 4\` and four-member composition but the legacy move descriptor still has \`summonCap: 3\`. The active \`summonCaptainAdds\` path takes \`profile.summon\`, so do not claim the move is currently limited to three; instead align metadata, descriptions, UI, VFX, tests and fallback so they cannot drift.

**Critical acceptance:** Every living protective broodling must be attackable/reachable from real entry/combat positions despite walls, occupancies and fallbacks; no immortal 100% shield by inaccessible summons; clear brood count/protection and Carapace/reflection feedback; late five-companion focus-fire; no duplicate or leaked brood on refill, leash, death or save restore; reflection source is actual *post-mitigation* damage and cannot accidentally reflect zero damage, chain recursively or ignore encounter cessation.

### Marshal Veyra / Ash Sentinel — redesigned Citadel encounter

**Identity/canon:** Veyra is the former-hero companion and loyal professional army-builder **and practicing cosmetologist**; officer discipline, training, cross-species Crown army and immaculacy matter. The Citadel remains military headquarters/regimental academy; the Dark Fortress, not the Citadel, is the political throne. Preserve Tovan, 32 existing rewardless guards, 28 traps and safe routes. Her vanity is a harmless decorative station; broad mixed-species troop implementation is not silently added.

**Actual [#255](../pull/255) and [#263](../pull/263) candidates:**
1. **Microdermabrasion** — nine actual limited-range canister projectiles sharing one boss raw-damage budget, matching nine distinct warning bearings.
2. **Dress Ranks** — existing soldiers **march** toward reachable defensive posts (no teleport or fictional soldiers). Posts are non-damaging cues.
3. **Deep-Tissue Contouring** — one fixed, fully forewarned five-leg charge path; each traversed segment can damage; blocked legs must stop cleanly.
4. **Fractional Resurfacing** — independent 4×4 grid, exactly two selected damaging squares at a time, 1.45-second warning followed by 0.45-second rest, eight pairs; persists alongside her other abilities, then cleans up.
5. **Volumize** — capped Crown soldier reinforcement including TRUE warband behavior.

**Current specific reconciliation findings:**
- The [#255](../pull/255) \`narration.js\` describes the **new** abilities, but its \`data.js\` still lists **Armor Slam / Ash Lanes / Sentinel Advance / Furnace Pulses / Ash Guard Muster**. Generic \`buildBossAttack\` derives a telegraph name from \`D.bosses.attacks[index]\`. This can produce **incorrect displayed attack names despite mechanically correct new attacks**. Update authoritative description/name ownership deliberately, including any guarded-protected file changes; do not paper over it only in Archive prose.
- The attack selector still starts from generic \`R.attacks.citadel\` plan types. In particular the converted canister has a **360-world-unit warning/reach** while general boss special eligibility can be longer; test whether selection wastes a canister at unreachable targets and scope a canister-specific reach condition if needed.
- Five-leg and grid focused tests prove several paths, warning/damage, save/reset and no-soldier orders, but not all real Citadel wall/guard/trap arrangements. [#263](../pull/263) fixes canister fan footprints, independent selected board squares and harmless march indicators and **must be incorporated together with #255**, not discarded as a cosmetic extra.

**Critical acceptance:** All five moves execute in Normal/TRUE; truthful active names, hitboxes, no full-sector phantom warning, no 16-square false danger; original 28-trap safe route and Tovan remain intact; charge never crosses solid walls or traps by an invalid shortcut; board and dress-post states stop on death/escape/save transitions; legible under summons/traps on phone.

### Dark Lord — veteran hero turned ruler

**[PR #261](../pull/261) source status:** The latest candidate includes six primary authored slots: Veteran's Repertoire (multi-arc shield feint), Pathfinder's Gambit (three landing/repositioning lunges), Royal Muster (bounded Crown summons with a temporary guard formation), Freedom Has a Price (below-50% territorial attacks), No More Heroes (below-30% line thrust), and Royal Taxation (party marks leading to a temporary shield). Tactical Writ of Restraint / Crown Decree remain; once-only **Second Wind** can heal 5% maximum HP below 35% after a 1.8-second stance, with 35% incoming reduction and rear-hit cancel; **Royal Prerogative** can intercept a hero/companion projectile using a real guard, subject to an 18-second cooldown. [#265](../pull/265) clarifies the separate protected sector. Prior WIP prose listing these as still absent is superseded by newer source and tests.

**Important inventory sanity check:** The PR references an approved “eight-main/two-reaction” concept, while the actual combat data defines **six primary attack slots**, plus separate tactical/reaction behaviors. The combined ledger must map the owner's intended ten named features to their actual engine action owners instead of blindly treating differing slot counts as a dropped mechanic. Confirm the complete list with the latest owner-approved contract; do not invent extra primary slots to satisfy a number.

**Implementation risk hotspots:**
- **Royal Taxation:** needs two **distinct living marked damage sources** to fund a 3%-max-HP shield; single-unit parties cannot meet the condition. Establish intended solo-play behavior/telegraph, real attacker source IDs and expiry so a mechanic is not an unexplained no-op or unearned shield. No actual crown/XP removal.
- **Royal Prerogative:** actual incoming projectile intersection and living guard position, damage application to that guard, 18-second cooldown, line-of-sight/collision and no area-attack interception.
- **Freedom Has a Price:** prohibited damage geometry versus protected sector **only for that authored attack**. Ordinary guards can still hurt targets in the protected sector; visuals/text must not promise global invulnerability.
- **Second Wind:** rear-hit angle from actual attacker position, once per encounter, no ghost healing or stale temporary states across death, retreat, old saves or restart.
- **Veteran/Pathfinder movement:** safe collision route, appropriate telegraph-to-hit correspondence, no instant-cast/zero-motion bugs, no unintended leash healing or long-lived phase movement.
- **Royal Muster/No More Heroes:** summon caps (Normal 3/TRUE 6), correct soldier buffs, high/low-HP attack gates, recoveries and audio/VFX event honesty.

**Difficulty:** High due to interaction count, not due to absent engine capability. Existing deterministic \`tests/dark-lord-phase-one.test.cjs\` covers major state contracts; exact-head and integrated full real encounter play remains unverified.

## Finale and state-machine coupling — [approved #266](../issues/266)

**Not shipped:** The owner-approved flow supersedes [#256](../pull/256)'s earlier ending assumptions. TRUE Dark Lord defeat → **explicit interactive throne claim at his fortress** → class-specific crowned look → resolve **only the undefeated** \`crypt/archive/mine/abyss/citadel\` TRUE flags (earlier victories always count) → optional dungeon-master appointment from five field bosses, rescued specialists and five named captains (including previously defeated Dreadmaw) → neutral/peaceful world and dungeons → **Rest** at valid refuge NPC, fountain or completed Barracks → once-only credits and persistent Nightmare unlock. Existing peaceful legacy saves remain completed.

| Feature | Engineering assessment | Non-negotiable test |
| --- | --- | --- |
| Throne prop/interaction | Low–moderate; reuse landmark/interact and validated reachable ground | Only available after TRUE Dark Lord, never in Citadel or before correct phase |
| Three crowned hero looks | Moderate; original class-canon procedural overlay + sprite precedence | Paladin/Mage/Ranger legible with existing, missing and broken sprites, after save/restore |
| TRUE credit / objective navigation | Moderate; existing flags and regional/local stepwise routing | Early TRUE wins count, zero outstanding completes immediately **after** claim, no forced rematch |
| Optional appointments | Moderate–high; new persisted map and UI but no recruitment/combat system | Candidates exactly eligible, unique assignment, defeated captains eligible, no appointment needed to end, visible/reload-safe |
| Neutral zones/interiors | Moderate–high; reuse \`makeHabitat\`, selectively salvage #256 | Reentered/new/legacy interior inhabitants nonhostile, no duplicate bosses/quests/traps |
| Rest, credits and new-game menu | Moderate–high, chiefly state transitions/save compatibility | Barracks Rest first, healing cooldown cannot deadlock finale, skip/finish same result, no automatic save overwrite/credits replay |
| Historical v4 save compatibility | High integration importance, ordinary mechanism feasible | Old \`awakening\` offered throne; old \`peace\` stays finished/unlocked; no lost old rewards or FALSE flags |

No new quest framework, new playable class, full art redesign, cutscene engine, optional forced re-fights or single-file restriction.

## Integration ledger and sequencing

**Never equate “intended canon” with “already installed on \`main\`.”** Build an explicit ledger per move/entity with \`main baseline | owner-approved specification | proposed PR + exact HEAD | actual code owner | secondary VFX/audio/UI | conflicts/dependent PR | deterministic tests | live encounter acceptance | status\`.

1. **Freeze specification and ownership:** Use #232/#247/#241/#244/#266 and accepted owner revisions as contract; preserve #231, #255→#263, #261→#265, #256's compatible peace pieces, #230 and the other selected worldbuilding PRs. Older docs can describe older budgets (e.g. Dreadmaw three-member/8% brood and old Ash Carapace) and must not override #231's four-member/25% reflection design.
2. **Small corrections first:** Cindermaw smoke/evidence and origin cues; Veyra name/data and warning reach; Dreadmaw cap metadata; obvious UI/audio stage mismatches. Document intentionally retained effects as KEEP in #257.
3. **Preserve candidate encounter mechanics while reconciling files:** \`rules.js\`, \`data.js\`, \`boss-combat.js\`, \`combat.js\`, \`engine.js\`, \`combat-visuals.js\`, \`enemy-presentation.js\`, \`enemy-vfx-*\`, \`narration.js\`, sprites/fallback, menus, world, save, build metadata. Do not merge competing patches by blind textual concatenation or discard any selected canonical action as “P1 polish.”
4. **Integrate approved #266 finale states:** Clear precedence over old \`checkEnding()\` and #256 automatic peace; preserve early victory credit and use #256's fixed post-peace interior conversion where appropriate. Record old-save migration and all three class silhouettes.
5. **Audit actual visuals/audio:** #257 requires identity-specific VFX warning geometry, false-danger/no-op cues, stage events, music/score ownership, mobile readability, sprite original-canon/fallback and offline/PWA integrity; dependent #263/#265 are part of the same integration.
6. **One candidate, one evidence set:** Deterministic test matrix, actual Normal/TRUE/early TRUE/Awakening encounters, solo and full-companion squads, level/stage-aware fight durations/casualties/potions, wall/leash and reset variants, desktop/phone Chromium/WebKit, restore historical v4, offline install/cache and performance, version coherence and exact-SHA CI. Never mark a physical device/manual playtest PASS based only on automated tests.
7. **Independent second-pass review and owner release authorization:** Record every difference from intended specification as pass/fix/explicit owner-reviewed exception; no unapproved design simplification. Keep all documentation on review branch; no \`main\` merge, deploy, tag, branch deletion or test-fixture weakening merely to get green.

## Release acceptance / current status

- [ ] Every intended Dark Crown boss/captain move has a uniquely traceable implementation and truthful presentation.
- [ ] No generic \`main\` move silently replaces an approved candidate behavior.
- [ ] Cindermaw Normal+TRUE smoke tests and Vera/caches/route pass with evidence.
- [ ] Dreadmaw's four-brood shield always has a reachable counter; phase refill/reflection/reset and metadata agree.
- [ ] Veyra's five moves execute with truthful attack names and nonmisleading canister, grid, march and charge warnings; Citadel routes remain valid.
- [ ] Dark Lord named kit, tactical reactions, guard states and recovery are demonstrably functional and fair for relevant party sizes.
- [ ] #266 throne/early TRUE credit/appointments/rest/credits compatibility is demonstrated.
- [ ] Combined branch preserves other selected region content, v4 saves, classes, rescues, audio/VFX, baseline guards and multi-file PWA.
- [ ] Exact integrated CI and sampled live encounters meet agreed gates, with failures and deferred physical testing explicitly recorded.
- [ ] Owner reviews one integrated candidate and expressly authorizes publication.

**Audit conclusion (source review only, 12 Oct 2026):** Technically feasible. Most unusual mechanics already exist in isolated source branches. The principal extra workload is correctness and integration—not an engine capability wall. This document is not a claim of merged code, finished QA or approved release.
