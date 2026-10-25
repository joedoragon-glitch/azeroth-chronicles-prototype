# Captain healing and Treasury ranged support — decision and implementation record

**Date:** 25 October 2026  
**Working branch:** `feature/captain-healing-independent-idle-20261025`  
**Baseline:** `main` after ordinary-enemy healing PR #448 (merge `1312082`)  
**Status:** Draft review candidate. **Not merged, not deployed; GitHub CI and gameplay outcome still to be verified.**  
**Scope:** Captains and their support ecosystem, without altering boss healing or previously improved ordinary-to-ordinary recovery.

## Director decisions from the discussion

1. **Healing captain → ordinary monsters, including eligible summons:** restore **100% of HP missing at cast time over 3 seconds**, using a **7-second ordinary-ally cast cooldown**. An area cast may treat several wounded ordinary recipients. The named restorative captain roles are Scornfang (`Salvage Surge`), Direjaw (`Silt Pulse`), and Dreadmaw (`Grafting`). Crag Tyrant and Cinder Warlord are not granted new healing abilities.
2. **Captain self-healing:** retain the original **5% of the captain's maximum HP, adjusted by the existing source scaling, over 5 seconds**. Give the captain a **separate 10-second self-healing clock**, independent of support spells for other monsters. Its seven-second ally-support cooldown cannot accidentally spend or refresh its self-healing clock, and vice versa.
3. **Engagement independence:** an ordinary ranged guard can detect, approach, and treat a wounded captain while the guard and/or captain are unengaged. Once started, captain healing **continues across idle → engaged → idle transitions**. Combat aggro is not a healing requirement. Do not relax the safeguards against dead/neutral/returning targets, active duplicate effects, obstruction, Silence, or a full encounter reset.
4. **Captain as an intermediate recipient:** the director wants captains substantially better supported than bosses but not identical to ordinary monsters. **Draft tuning for review**, not a final locked numeric approval: a separate source heals **50% of the captain's missing HP over 5 seconds** when the captain is at **90% HP or below**. Each ordinary ranged source retains a **10-second per-healer captain-support eligibility**, independent from its seven-second ordinary-recipient cast. This midpoint value must be validated and may be refined without changing the director-approved design goal.
5. **Treasury defenders:** add **two ranged guardian posts** in *each* of Scornfang's Greenwood Treasury (`supply-vale`) and Direjaw's March Treasury (`supply-march`), increasing both from **1 to 3 ranged guardians**. Keep old posts, existing save identities, dead guards, layouts, and zero-repeatable-reward policy intact. Crag Tyrant retains **3** ranged Treasury guardians. Dreadmaw retains **5**, without adding new guards. The count is not a promise that every unit can cast at every moment; navigation, terrain, sight lines, fighting, and death still matter.
6. **Dreadmaw separately:** `Grafting` is an authored restorative support action distinct from the seven regular captain attacks. As part of the generic captain upgrade, it **fully restores missing HP to each eligible ordinary broodling/monster over 3 seconds**. Dreadmaw's own current self-restoration is preserved pending a separate appraisal of `Grafting`, `Brood Call`, `Broodward` protection, other special moves, and actual gameplay. Four owned broodlings are possible (three melee, one ranged); the lone ranged broodling can itself heal its captain when able. Do **not** automatically nerf or inflate Dreadmaw's personal numbers without that specific review.
7. **Direjaw's `Elastic Rebound`: preserve its existing positive survivability.** Authoritative source currently triggers this one-time `molt` phase when Direjaw first falls to **55% max HP or less**, then adds **50% max HP** (capped at full) and raises movement speed by 20%. The discussion used an approximate larger percentage; **source values above are authoritative**. The director expressly does **not** want a preemptive nerf in response to new guards/support; reconsider only on real gameplay evidence.
8. **Rogue regroup around Dreadmaw:** leave withdrawal behavior and its formation targeting untouched for this candidate. The tactical algorithm currently groups eligible allies by pack and favors **closer allies**; it does **not guarantee choosing the Treasury captain**. Overwhelmed guards may eventually converge on the captain, but this remains a hypothesis for playtest—not established automatic leader-seeking behavior.

## Treasury-by-Treasury design audit

| Treasury | Captain | Original authored ranged guards | Draft ranged guards | Design observation |
| --- | --- | ---: | ---: | --- |
| Greenwood / `supply-vale` | Scornfang | 1 | **3** | Add two near the command side of the wall/divider; existing distant lookout remains |
| Flooded Marches / `supply-march` | Direjaw | 1 | **3** | Add two near Direjaw's side of the flood divider; keep one original distant lookout |
| Ironroot Highlands / `supply-highlands` | Crag Tyrant | 3 | **3** | No new posts; captain does not cast support itself |
| Dark Crown / `supply-crown` | Dreadmaw | 5 | **5** | No increase; only one authored initial post was within the 350-unit radius, before line-of-sight and movement |

The new Greenwood and March posts are authored as zero-XP/zero-crown guardians. A regression asserts **three actual ranged guardians per changed Treasury**, proximity (≤350 units) and initial line-of-sight from each of the two new posts to the captain, original slot preservation, and legacy-save append-without-revival behavior. The actual in-game result still needs verification in native simulation and browser/phone play.

## Healing contract in the draft

| Source → target | Target eligibility | Healing over time | Clock |
| --- | --- | --- | --- |
| Ordinary ranged / eligible ranged summon → ordinary | Any missing HP | Full missing HP / 3s | 7s support cast |
| Restorative captain → ordinary (including brood) | Any missing HP | Full missing HP / 3s | 7s support cast |
| Ordinary ranged / eligible ranged summon → captain | Captain ≤90% HP (draft tuning) | 50% missing HP / 5s (draft tuning) | 10s *per source* captain eligibility |
| Restorative captain → own HP | Captain ≤75% HP | Existing scaled 5% maximum HP / 5s | 10s **independent self** |
| Restorative captain → another captain | Recipient ≤90% HP (draft tuning) | 50% missing HP / 5s (draft tuning) | 10s *per source* leader eligibility |
| Any eligible source → boss | Existing boss requirements | Existing scaled 5% maximum HP / 5s | Existing 10s leader treatment |

Effects never resurrect, never stack on one recipient, and are runtime-only (save schema v4 unchanged). A source still needs valid range (350 units) and unobstructed line of sight at cast time. Mid-heal engagement transitions alone do not abort captain pulses.

## Work written to this draft branch

- `src/prototype/engine.js`: targeting, different recipient budgets, captain-specific independent self timer, idle-safe pulse progression, and idle guard approach.
- `src/prototype/rules.js`: intermediate captain recipient configuration and the four additional ranged Treasury posts.
- `tests/captain-healing-independent.test.cjs`: isolated healing clocks, idle transitions, recipient budgets, Grafting/general captain support, preserved Elastic Rebound and roster counts.
- `tests/enemy-support-healing.test.cjs`, `tests/enemy-ordinary-heal-balance.test.cjs`, `tests/enemy-cross-species-idle-healing.test.cjs`: updated acceptance expectations for captain support while guarding ordinary/boss behavior.
- `tests/snapshot-guardian-density-direwolf-riders.test.cjs`: new native guard totals, proximity/line-of-sight and legacy-save identity requirements.

## Outstanding validation and decisions

- **Do not claim tests passed just because assertions were authored.** Obtain actual GitHub Actions results (or run native tests) and repair any formatting, behavior, regression or build failures before requesting merge.
- Test both Normal/Nightmare modes and fresh/historical v4 saves. Verify that newly appended Treasury posts neither duplicate nor revive old dead defenders, that existing area combat and captain attacks still work, and that source clocks survive interruptions without persisting into saves.
- Independently simulate idle guard → idle captain healing, idle → aggro → idle pulses, ordinary → captain treatment every 10 seconds, captain simultaneous multi-target ordinary treatment every 7 seconds, and captain independent self recovery every 10 seconds.
- Check actual spawn positions, pathfinding, wall visibility, call-for-aid activity, ranged guardians' attack-versus-heal decision time, and combat survival for each Treasury. A static count is not encounter evidence.
- Retest Dreadmaw `Grafting` and brood shield durability as a separate specialist balance pass; assess whether his five ranged guards cluster via natural Rogue regroup instead of presuming they do.
- Reassess Direjaw's `Elastic Rebound` **without weakening it upfront**; assess how it interacts with the three ranged guards and new middle-ground healing.
- A 50%-of-missing-HP captain recipient heal and ≤90%-HP entry are **provisional draft numbers** subject to director review; do not represent them as already authorized exact tuning.
- Do not merge, ship or modify the live `main` without explicit director review and validation.

## GitHub change record and verification checkpoints

- **Draft PR:** [#454 — Captain support healing, idle recovery and Treasury guard reinforcement](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/454), head `feature/captain-healing-independent-idle-20261025`, base `main`; status **open / draft, not merged**.
- **GitHub base:** `1312082b4bd5d216c0c2bc641dbaab6c13daf778`, ordinary healing PR #448. The captain work is isolated to the draft branch.
- **Discussion continuity:** The director specifically reiterated that all gameplay choices, GitHub edits, implementation findings, testing status and remaining balance uncertainties need to be documented in the repository rather than existing only in conversation. Keep this document and the PR description in sync as changes are made. Do not mark a numerical tuning recommendation as final without an explicit director decision.
- **Last verified workflow check (25 Oct 2026):** `Focused checks and deploy` showed **pending** for the then-current PR head. A skipped `Community balance input provenance` run was also present. This is **not evidence of passed tests**. Re-check against the latest head after each commit.
- **Documentation consolidation:** this file is the authoritative dated decision log for PR #454; a duplicate similarly named draft was retired to avoid contradictory inventories or proposed guard totals. All four Treasury formations are described above by both previous and draft guard counts.
