# Shared melee Pursuit Burst expansion — implementation candidate (26 October 2026)

**Status: proposed PR #508, NOT MERGED OR LIVE.** The owner has already tested and accepted the Greenwood-only pilot from merged [PR #502](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/502) and two-second recovery adjustment [PR #506](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/506). This document records the next owner-approved scope and the exact proposed code behavior, not a production deployment. The current cross-chat ledger is [issue #504](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/504). Do not separately merge the older unmerged PR #505, whose original handoff contained stale Greenwood figures.

## Approved timing, unchanged from the playtested pilot

- Same pre-existing native `pursuitBurst` / `pursuitBurstReadyAt`, multiplier **1.5×**, burst active for **1.2 seconds**.
- Eligible enhanced melee recovery is **2.0 seconds** of normal movement; nominal start-to-start **3.2 seconds**, maximum hypothetical burst uptime 37.5%. No extra dash, teleport, damage, Slow, hit, attack timer, warning, or impact.
- Native ordinary pursuit 175 units/s; boosted ordinary 262.5 units/s. **Eligible melee Ringleaders deliberately keep their existing native 1.2× speed advantage**: 210 units/s normal, 315 units/s burst, **the SAME 2-second recovery**. No compensating nerf or distinct Ringleader timer.

## Scope table

| Actual actor and ancestry | Proposed eligible? | Important details |
| --- | --- | --- |
| Normal melee actors across five regions and their interiors | **Yes** | Not just Greenwood Goblins/Skeletons; gate actual melee capability |
| Native dungeon, town-defense and regional melee guardians | **Yes** | Guard role is not a captain flag |
| Native melee Ringleaders | **Yes** | Keep 1.2× native speed modifier and 3.2-second burst cycle |
| True melee/ranged hybrids | **Yes** | Preserve native ranged firing/aim, healing, spacing, stance choice and melee basics; no new skill |
| Ringleader-called **melee** emergency guardians | **Yes** | Real `summon/owner/rogueEmergencyReinforcement` requires verified non-boss/captain summoner |
| Other melee summons with fully verified ordinary/Ringleader owner chain | **Yes** | Fail closed on missing owner or cyclic ownership |
| Bosses, captains, room or field captains | **No** | Keep existing authored skills and pursuit cadence |
| Boss- or captain-owned summoned creatures, direct OR indirect | **No** | Includes ordinary-looking species and Ringleader-form TRUE summons |
| Pure ranged and ranged summons | **No** | Ordinary ranged basics, standoff and backpedal unchanged |
| Unverified orphan summons or synthetic developer summons | **No** | Cannot classify ownership safely, including migrated saves |
| Night-only melee actors | **Yes when free to pursue** | Existing night-special priorities and actions still take precedence |

**Latest owner correction is authoritative:** Both **captain-owned** and **boss-owned** summons are out of scope even when they are melee. Naturally present, non-summoned melee defenders **near** a captain remain eligible, enabling real captain-fight observation without altering captains or their summons.

## Technical contract

`src/prototype/engine.js` provides `meleePursuitBurstEligible`: actively engaged, alive, non-neutral and non-returning `type: 'mob'`; no captain/boss or developer-summon flag; `enemyRanged(e)` false or genuine `e.hybrid` true. Summons must resolve their **complete owner chain in the active zone** to non-boss/non-captain mobs. A missing owner, detected cycle or boss/captain at any ancestor rejects the new recovery. Identical hero-target and clear-line-of-sight pursuit conditions, ordinary attack reach, collision-aware `follow`, no-progress handling, territory and native movement modifiers continue to govern actual motion.

One renamed **rules table key**: `R.balance.pursuit.meleeRecoverySeconds = 2` replaces the old region-only `valeRecoverySeconds` name; **neither is a v4 save schema key**. Noneligible ordinary monsters keep their original 7-second start-to-start Pursuit Burst cadence and bosses 5.5 seconds. Actual duty cycle is lower if warnings, ranged aims, strikes, obstacles, Rogue tactics or loss of LoS intervene.

**Explicit non-change:** The under-fire fallback `enemyUnderFireSidestep` stays at **125 units/s**, a **48-unit** local target, a **1.25-second** minimum attempt interval after **0.6-second** blocked progress, and a **four-second** last-real-hit awareness. Do not merge the two systems. Melee basic reach, ranged enemy attack ranges, hybrid role switching, boss/captain skills, summons lifecycle, rewards and v4 restoration remain independently owned.

## Merge readiness checklist

- [ ] Focused test `tests/melee-pursuit-expansion.test.cjs` covers five regions, interiors, melee/guard/Ringleader/hybrid roles, pure ranged, direct and indirect boss/captain summons, known non-elite owners, orphan and cycles.
- [ ] Regression `tests/vale-melee-anti-kite.test.cjs` verifies actual Greenwood collision-safe 3.2s repeat and 315-units/s Ringleader movement with no extra strike/Slow.
- [ ] Existing `tests/hybrid-dual-role-ai.test.cjs` and `tests/melee-reach-balancing.test.cjs` remain green; source SHA256 evidence updated.
- [ ] GitHub focused validation and reproducible offline/PWA build green for exact PR head.
- [ ] Owner reviews this PR and authorizes merge/deployment separately. This request is **to prepare**, not to publish now.
- [ ] After merge, validate actual running build and owner playtests Ranger/Mage kiting in non-Greenwood regions, melee Ringleaders and captain encounters (captain summons unchanged). No full browser/phone test matrix has been authorized.

**Resume in a new chat:** consult [issue #504](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/504), this document, [PR #508](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/508), current engine/rules/tests and latest CI; distinguish existing Greenwood-only deployed gameplay from proposed broader eligibility. Preserve the multi-file GitHub Pages/PWA architecture and older PR #496 Vale Interception as retired history.
