# Deferred boss/captain duration audit — 9 October 2026

**Status: findings retained, NOT a request to increase HP, damage, or compression.** The player explicitly asked for the unusually short encounter times to be preserved for objective balancing later. Keep this report separate from the burst-compression reassignment and automatic companion targeting work. Neither encounter mechanics nor tuning should be changed solely to satisfy this report.

## Source and limitations

These are observed outcomes from a non-browser `Campaign.tick(0.1)` harness against the real combat engine, tested in the `audit/boss-captain-timing-20261009` research branch (draft PR #153). The early baseline used the **doubled all-tier compression profile before the subsequent v0.8.108 tier reassignment**. Importantly, default Mage/Ranger **ADDS doctrine was later found to idle against the boss between waves**. Thus the first times below are useful as a historical stress baseline, **not a definitive measurement of the updated production configuration**.

Conditions: normal mode; fixed RNG return `0.87`; well-prepared hero at each region's upper level range (Vale 4, March 7, Highlands 10, Frontier 13, Crown 16), appropriate available equipment, unlocked skills/talents, supplies, and 2–6 companions according to encounter stage. An isolated boss or captain starts in its authored map/arena at full health; **all its actual summoned enemies and combat abilities are active**, but unrelated pre-existing hostile groups are removed. The bot approaches from a nearby navigable start, autoattacks, attempts to dodge warned specials, uses defensive skills/potions, and issues at most one manual skill input every 0.4 seconds. A fight ends on boss death, hero death/retreat, or a 180-second timeout. Do not confuse durations until hero defeat with kill times.

## Normal-boss victories in initial class-default scenarios (seconds)

| Boss | Paladin | Mage | Ranger |
| --- | ---: | ---: | ---: |
| Thornfang | 17.5 | 40.1 | 41.0 |
| Crypt Guardian | 7.3 | 12.5 | 16.9 |
| Mirejaw | 7.3 | 8.3 | 8.2 |
| Drowned Keeper | 8.4 | 9.9 | 10.7 |
| Ridge Tyrant | 9.7 | 15.8 | 15.1 |
| Stone Colossus | 9.7 | 12.4 | 16.5 |
| Ashen Warlord | 9.5 | 14.4 | 15.0 |
| Abyss Dragon | 10.6 | 23.5 | 19.3 |
| Cindermaw | 10.6 | 15.2 | 20.4 |
| Ash Sentinel | 19.4 | 32.3 | 36.2 |
| Dark Lord | 11.9 | 27.5 | 27.2 |

All 33 isolated normal-boss class trials in that run achieved victory. In many stage-appropriate trials, especially Paladin's, substantial authored boss mechanics barely have time to emerge.

## Captain victories in the same baseline (seconds)

| Captain | Paladin | Mage | Ranger |
| --- | ---: | ---: | ---: |
| Scornfang (Vale) | 3.4 | 2.7 | 2.7 |
| Direjaw (March) | 3.9 | 4.8 | 3.9 |
| Crag Tyrant (Highlands) | 4.4 | 3.8 | 4.0 |
| Cinder Warlord (Frontier) | 3.9 | 2.5 | 2.4 |
| Dreadmaw (Crown) | 8.4 | 9.7 | 7.5 |

These particularly short 2–5 second captain clears are the strongest **deferred durability audit** candidates. The user has **not authorized encounter retuning in this pass**.

## Confirmed doctrine confounder

The first harness unintentionally compared Paladin's default **BOSS** priority to Mage/Ranger default **ADDS** priority. Without live adds, those classes' companions could remain idle rather than damage the boss. This is a significant behavior confounder, not proof of a Paladin stat or personal DPS imbalance. Using forced identical BOSS focus, the same five encounters gave:

| Boss | Paladin BOSS | Mage BOSS | Ranger BOSS |
| --- | ---: | ---: | ---: |
| Thornfang | 17.5 | 12.6 | 13.9 |
| Crypt Guardian | 7.3 | 6.5 | 6.5 |
| Mirejaw | 7.3 | 6.6 | 6.6 |
| Abyss Dragon | 10.6 | 9.1 | 10.8 |
| Dark Lord | 11.9 | 9.7 | 9.9 |

Under the more faithful **ADDS-first, boss-when-clear** prototype, Mage normal-boss times were: Thornfang 29.8, Crypt Guardian 8.6, Mirejaw 6.9, Drowned Keeper 8.0, Ridge Tyrant 10.6, Stone Colossus 8.9, Ashen Warlord 9.4, Abyss Dragon 10.0, Cindermaw 8.9, Ash Sentinel 17.4, Dark Lord 10.8 seconds. Ranger times were respectively 29.6, 9.3, 7.1, 8.4, 9.2, 8.9, 9.6, 11.2, 10.2, 18.1, 11.5 seconds. These prototype times came from a temporary local AI variant; the shipped companion fix should be remeasured.

## TRUE-boss caution

Early TRUE encounter trials produced a **mix of rapid victories and defeats**, driven in part by larger summon groups. They are not consistently "easy" even when normal bosses die quickly. The initial fixed-seed Paladin TRUE victories included Mirejaw 11.4s, Drowned Keeper 21.3s, Ridge Tyrant 13.2s, Stone Colossus 14.4s, Ash Sentinel 33.7s and Dark Lord 23.9s, while other early TRUE bosses defeated the test party. Mage/Ranger TRUE attempts also varied and were often defeats. These **are not later Awakening-scaled dungeon rematches**, and they must not be conflated with successful kill-time data.

## Objective follow-up protocol (deferred)

Before any future boss/captain HP/defense changes, run the harness against the latest deployed version **after** the inherited tier curves and dynamic ADDS targeting both land, and collect multiple RNG seeds per class/region/form. Record encounter duration, victory/defeat, hero/party survival, potions, active additions, player input profile, and how often the boss's signature attacks actually fire. Preserve current XP, companion caps, class-specific doctrine choices, and quest progression in trial setup. Compare sustained basics, deliberate burst, and tactically managed ADDS/BOSS switching. Avoid knee-jerk balancing against a single 0.87-seed script or against the wrong party doctrine. This report is only a baseline for that later investigation.

## Greenwood Vale progression exception — intentional, do not automatically retune

The user clarified that **Crypt Guardian's comparatively quick defeat is intended**. A player may first explore Greenwood Vale, judge Thornfang too dangerous, discover the Forest Crypt, defeat its apparently formidable but more accessible Guardian, and gain confidence before returning to challenge Thornfang. Crypt Guardian may thus be the first boss *actually defeated* despite Thornfang being the zone's central threat.

**Thornfang is the real regional field boss and teaches progression through rescuing Mira**, who unlocks further hero skill instruction. Do not artificially equalize Crypt Guardian's fight length with Thornfang's, or treat the Guardian's short isolated simulation as a balance defect in itself. Preserve both encounters' identities and quest unlocks. The potential short duration of **Mirejaw** remains a separate item for objective future review; no immediate numeric changes are authorized.

This is a **player-directed optional discovery arc**, not a forced boss order. Evaluate Crypt Guardian's fight for clear tells, survivability and satisfaction at the time players actually discover it, rather than enforcing generic encounter-duration targets.
