# Encounter territory fairness correction — owner review candidate (26 October 2026)

**STATUS: separate review-only PR, NOT MERGED, NOT DEPLOYED.** Parent audit: [issue #510](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/510). Cross-feature release hold: [melee expansion PR #508](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/508). Native reproductions: test-only [PR #512](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/512) (current main) and [PR #513](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/513) (unmerged #508 differential). This document explains the *reason for the old boundary*, *cost of changing it*, exact solution and release limitations. Never merge either test-only audit PR.

## The plain-English problem

The game assigns each hostile a **home post**. Leaving the legal combat region causes the enemy to stop chasing and ultimately return home with reset health/cooldowns. Previously, `updateEnemies` allowed some enemies to pursue farther from that post than `damage()` allowed the player to attack: an engaged **summon and field captain could chase up to 900 world units**, and an **overtime** opponent up to 1300, but ordinary nonboss damage was rejected whenever the hero/companion was more than **500 units from the enemy's home**. The game can therefore create a one-way fight: the enemy stays hostile and nearby while the player's real hit is silently discarded. It was reproduced with real `Campaign` simulation, a real clear Greenwood lane, 60 units between enemy and hero, and 600 units between hero and enemy home, including an eligible Ringleader-owned melee summon atop PR #508.

## Why the original limit exists — what must NOT be removed

The origin-from-home rule protects **encounter ownership**. Without it, arrows or distant skills could whittle a monster down far away from the area where it is allowed to fight back. It also prevents accepting attacks from players who have escaped beyond the leash while a monster is resetting/returning, keeps territorial bosses/forts from becoming map-wide targets, and preserves protected early encounters/town boundaries. Since attacks may be projectile-delayed, a destination or hit may be resolved after movement/encounter state has changed. Original 500-unit ordinary limit is valid for ordinary native combat and **should remain for idle nonboss enemies**, preventing newly introduced long-range pre-engagement sniping. Boss initial 700/1800 is likewise preserved.

The mistake was **not having a damage leash**. It was hard-coding its default 500 radius *even for an already engaged actor whose own native chase budget is larger*.

## Fix chosen: preserve the boundary, synchronize active combat

- Share one constant-time `nativeEncounterTerritory(e)` that returns the **exact existing pursuit radius and precedence** for that actor: outdoor boss 700, dungeon boss 1800, field captain 900, overtime 1300, summon 900, all other ordinary/captain/room captain 500. It reads already-existing state and adds no counter, timer, statistic, save key, random roll, path search or extra encounter.
- The `updateEnemies` pursuit gate now *reads the same function*, but remains mechanically identical: no detection, target, movement, attack range, Rogue behavior, Pursuit Burst speed/timer, 12-second stuck reset, town exclusion or territory change.
- In `Combat.damage`, actors **already engaged** use that same territory when validating where the genuine hero/companion source is located. **Idle** actors keep the old 500-unit nonboss (700/1800 boss) origin restriction. This is a damage-validity correction inside a legal existing fight, **not a new attack range**.
- Retain actual line of sight, protected openers, `attackResetProtected`, direct target validity, early charged-shot rules, fort cover, damage mitigation, boss/captain authored protection, and the existing `tacticalRogueLeashAllows` anchoring/corridor exceptions. No change to those systems or their constant values.

## Explicit cost and risk accounting

| Dimension | Cost/tradeoff | Protection/verification |
| --- | --- | --- |
| Gameplay pressure | An **engaged** summon/field captain now receives real player/companion hits from home-distance 501–900; overtime enemy 501–1300, where its pursuit was already legal. This may reduce how long a particularly mobile enemy survives compared with the bugged one-way-hit state. | This is precisely the fairness benefit; enemy HP/damage and ability cooldowns are unchanged. Test 450/500/501/550/850/900/901/1300/1301 and live Ranger/Mage scenarios. |
| Anti-kiting | More legitimate attacks land while the enemy is still allowed to chase. A moving Ranger/Mage might defeat an enemy previously protected from damage in the outer territory band. | Preserve every existing chase territory and native Pursuit Burst/Rogue timing; do not grant new attacking/retreat tools. Balance requires owner playtest, not inferred automated success. |
| Pre-engagement sniping | Widening the radius unconditionally could enable long-distance free attacks on idle special enemies. | **Not changed:** idle nonboss 500; idle boss original radius. Actual ranged attack/projectile ranges remain independent. |
| Escape/reset protection | Enlarged active-hit radius could let a stale projectile damage an opponent just after disengagement if it still carried engagement. | `attackResetProtected`, return state, HP normalization, LOS and source checks unchanged; focused reset test verifies this boundary. Future explicit projectile lifetime/in-flight reset matrices may require another review. |
| Performance | Small constant-time branch/function per engaged AI tick and incoming hit. No arrays, routefinding, LOS tests or per-actor data allocation added. | Structural O(1) comparison. No measured device FPS claim. |
| Integration | Shared helper changes one *read site* in pursuit and the hit acceptance site. PR #508 separately changes pursuit eligibility logic and will have to be reviewed/rebased against this PR's main commit. | No pursuit *behavior* changed; keep #508 unmerged until the owner approves a consolidated release order and test integration. |
| Test debt | Existing `targeting`, `mini-dungeons` and `dungeon-pressure` baseline suites are red on unchanged main (8/11 old matrix pass). | Don't conflate these with this narrowly scoped fix or falsify green broader-suite claims. Track as separate reconciliations in #510. |
| Cost to the owner | Source/test review and later actual gameplay acceptance required; no external subscription or financial cost is known. | Keep PR unmerged and draft-ready for next-day review; no deployment, asset/package or save-schema change. |

## Required merge/release gates

1. Run new `tests/encounter-territory-fairness.test.cjs` with **real native LOS at 600 units**, synthetic isolate-only LOS for longer boundary scans, and idle/return/boss/peace controls. Confirm pre-fix case actually fails if run on old `main`, then passes on the candidate.
2. Existing reset/under-fire/companion/summon/captain/fort/town/charged-opener regressions chosen by focused CI must remain green; reproducible multi-file PWA build must pass. The full historical 11-suite matrix has three preexisting failures, so report those honestly if run.
3. Review source diff to ensure combat radius helper exactly mirrors prior chase formula and no growth of detection or projectile range.
4. **No merge/deploy with this request:** owner returns to review tomorrow. Batch-release sequencing with [PR #508](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/508) is a separate decision. Validate the post-merge main Pages workflow if/when authorized.
5. Post-publication owner playtest: ordinary 500 leash, active Ringleader summons inside 900, field captains, overtime and dungeon boss, plus kill/return/re-engagement and protected settlements. Never assume all device scenarios verified from Node tests.

**Important:** This PR is intentionally limited to a fairness discrepancy in **damage legitimacy during an existing encounter**. It does not change Rogue movement, native Pursuit Burst cadence, under-fire sidestep (125 units/s, 48-unit step, 1.25-second attempt gap), or summons' owner/role eligibility. Any proposed broader anti-kiting expansion belongs solely to PR #508; its merge remains on hold until this compatibility work is reviewed.
