# Companion mastery and Charmed Ringleader training — owner design contract

> **29 October 2026 — review draft, documentation only.** This is the proposed design for *So I Became the Dark Lord's Problem*. It does **not** implement combat, roster, UI or save changes. Source basis: [merged PR #590](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/590), [draft/unmerged PR #608](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/608) and [Issue #589](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/589). Do not confuse #608's feature-branch implementation with current main.

## Intent and sequencing

A player who charms a Goblin in Greenwood Vale should be able to keep that **same individual** useful in Dark Crown. Later creatures should offer different advantages, not mandatory replacements for favorites. Individual companion mastery is a lightweight, shared framework across **Charmed monsters, hired Soldiers, hired Archers (Rangers), and boss pets**. Monster statistics and Ringleader promotion are the **first implementation/balance priority**. More specialized paid training for Soldiers, Rangers and pets is **not authorized or defined now**; the owner may return to those groups **after reviewing monster statistics and world balance**. Their inclusion in **mastery** is approved in principle; their **extra trainers or paid bonuses** are deferred and must not be invented.

## Three independent progression tracks

1. **Ordinary level scaling:** existing friendly species/role profile; hero-level HP/attack growth; Shared Training/Strength, Companion Vitality, healing and role-specific behavior. Never copy a wild monster's raw region, hostile elite, or night multipliers at Charm.
2. **Personal mastery (all four companion groups):** a persistent, individual **Mastery 0–III** with one cumulative point counter. Advancing mastery upgrades **every real skill the individual has unlocked**, simultaneously. No skill-by-skill XP or separate mastery purchases; abilities unlocked later automatically use the individual's current tier.
3. **Personal Ringleader training (Charmed only):** optional, one-time **100-crown** purchase from **Orin the Highland Instructor** after freeing him from the Ridge Tyrant in **Ironroot Highlands**. Player deliberately selects an owned Charmed monster. This adds full Ringleader HP/damage superiority; it does not substitute for mastery or hero Skill-2 heritage unlocks.

### Tentative personal mastery thresholds

| Tier | Cumulative points | Skills |
| --- | ---: | --- |
| Mastery 0 | 0–3 | Currently unlocked abilities at baseline |
| Mastery I | 4–9 | **All** available abilities Tier I |
| Mastery II | 10–17 | **All** available abilities Tier II |
| Mastery III | 18+ | **All** available abilities Tier III (cap) |

The **4/10/18** thresholds are working **balance candidates**, not demonstrated campaign pacing. Mastery is individual, not by species, role, pet family, hero or squad. Existing ordinary attacks and level scaling remain; skill tiers improve appropriate effects of **authored skills** (e.g., damage, actual healing, controlled defense) without arbitrary global cooldown reductions or uncontrolled Slow stacking. Exact tier coefficients and outcome-by-outcome balancing **remain to be designed and tested** after inspecting all relevant skills. Preserve native reach, geometry, target counts, cast warnings, projectile contact, interruptibility, cooldowns, anti-spam spacing and legitimate critical behavior.

## What gets mastered, source-reconciled

- **Soldier:** native Power Strike and Holy Cleave, the latter only when legitimately unlocked through existing hero Skill 2 / companion training. Do not grant Charmed-only skills.
- **Archer / Ranger companion:** Triple Shot, Piercing Volley after the same native Skill-2 gate, and any genuinely unlocked allied healing effect with a separately reviewed safe mastery benefit. Do not fabricate mana recovery or additional attack skills.
- **Boss pet:** that pet family's authored first and second (charged) abilities where actually unlocked, respecting TRUE boss ownership, target geometry, ward/heal limitations and original charged-action timing. No generic Ringleader abilities.
- **Charmed species on merged PR #590:** the species/role **native Rogue maneuver** and separate **Ringleader elite signature**, which **hero Skill 2** already unlocks along with +20% combat pursuit and wounded frenzy. The signature does **not** replace the native maneuver.
- **Charmed extension in draft PR #608 / Issue #589:** preserve each of the **twelve owner-chosen third heritage abilities** with its separate `skill3Cd`, in addition to native and elite skills. Also master the authentic **Lantern Wraith Soul Drain** or **Ash Stalker Shadow Pounce** night ability with `skillNightCd` when actually possessed. These are *additional native night abilities*, distinct from the third heritage skill; #608 itself remains **draft, unmerged and unshipped**.

The inherited third heritage skills to preserve from #608 are: **Goblin—Dust Entrainment; Skeleton—Disarticulation; Mireling—Hydraulic Jump; Reedbeast—Mud Pumping; Wolf—Crowd Dispersal; Ogre—Lateral Load Transfer; Orc—Flank Command; Raider archer—Bad Deal; Ashbeast—Broodscreen Roar; Crownguard—Reversal; Lantern Wraith—Pressure Grouting; Ash Stalker—Flank Command**. The two night creatures remain Charmed by lawful night encounters and survive sunrise once captured, as specified on #608, not by this design PR.

**Important integration boundary:** do not build this against main as though #608's third heritage or two extra night species already exist. Land mastery for existing actors safely, then reconcile #608's *actual merged implementation* or feature branch explicitly, without overwriting its owner-approved third skills, two extra night skills, critical release keys, save cooldowns or effect geometry.

## Earned mastery points for every active, living companion

At the time of the **authoritative achievement**, award the listed points **to each active, living, legitimate party companion**, of any of the four categories. The companion must be accompanying the hero; personal final-hit credit is **not** required. Never award to reserve, fallen, absent or acquired-later units retroactively.

| Actual event | Points per eligible companion | Duplicate/repeat rule |
| --- | ---: | --- |
| Complete one real quest | +1 | Once, tied to the existing automatically paid quest |
| Hero gains a level | +1 | Once for **each** actual level gained (including multiple levels in one XP reward) |
| Ordinary, respawning Ringleader defeated | **0** | Never a mastery source |
| **Guardian Ringleader** defeated | **+1** | **Once per stable guarded encounter per individual companion**; repeated pre-clear respawns cannot be farmed |
| **Captain defeated**, including repeatable captain returns | **+1** | **Every genuine captain defeat**; no once-per-identity cap (owner expressly corrected this) |
| Normal-form boss victory | +2 | Only a genuinely awarded form victory, not temporary reset |
| TRUE-form boss victory | +2 | Distinct genuine TRUE victory; avoid duplicate state/event replay |

The owner's distinctions are intentional: ordinary Ringleaders respawn too freely and **do not** award mastery; Guardian Ringleaders are scarce, but must not be repeatedly farmable in an uncleared dungeon; **captains do respawn** to help players regain scarce crowns and **every real captain kill gives +1**. Preserve those rules even when a captain's identity repeats. No routine mob-kill or invented N-kill grind reward.

Quests and boss victories are finite. Hero levels plus intentionally repeatable captain victories allow late captures and newly recruited pets/companions a path to Tier III. **Assess real accessible late-game captain frequency and threshold reachability**, particularly after campaign completion, before finalizing thresholds.

Do not use transient log/notification events as the sole achievement owner. Reuse genuine quest payment, XP level advancement and actual enemy victory processing; prevent duplication on restore/replay. For Guardian Ringleaders, use a **stable saved encounter key** (not just a runtime enemy ID), tracking personal award history, and fail closed if the encounter cannot be securely identified. Never let guardian spawns or unfinished-dungeon resets create unlimited credits. Each level-up reward counts once regardless of how often the UI notice appears.

## Personal Ringleader training: Orin, Ironroot, 100 crowns

**Orin the Highland Instructor** is the established rescued Ridge specialist; **Dara** is the Mine smith. The owner said “Odin” orally, but the existing instructor to reuse is **Orin**. This is an optional one-time decision for **a specific owned Charmed monster**. Present the selected individual and nickname, species/role, before/after statistics, **100 crowns**, current funds and confirmation. Check actual rescue, ownership, eligibility, funds, not-already-trained and transaction success; never debit twice. Store the benefit on the individual, persist it across reserve/fallen, recovery, regions, saves and lawful Succession.

The live hostile Ringleader balance in `src/prototype/rules.js` is:
```js
{ hp: 2.5, damage: 1.5, pursuit: 1.2,
  frenzyThreshold: 0.5, frenzyCooldown: 0.6, frenzyAim: 0.75 }
```
So **Orin's full stat promotion** grants **2.5× max HP and 1.5× attack damage on the friendly companion's computed, level-scaled baseline**. The existing **1.2× combat pursuit and 0.6× wounded basic attack interval** are already obtained from hero Skill 2; training **must not apply them twice**. `frenzyAim` pertains to hostile ranged aiming; first establish whether any legitimate friendly ranged aim interval exists before applying it, rather than pretending it does. If hero Skill 2 hasn't yet been learned, paid Orin training still grants its personal stat promotion, while the separately gated elite signature/pursuit/frenzy must be handled according to the native unlock rule. No import of hostile enemy AI, rogue regroup, raw night/region scaling or elite capture eligibility.

**Single-source multipliers:** 1.5× damage must apply *exactly once* to eligible regular attacks and skill damage before their separately defined, legitimate mastery potency/critical effects; 2.5× health must apply *exactly once* to recalculated max HP, including Neri vitality/inheritance without unbounded repeated multiplication on every level-sync. Preserve absolute missing HP on growth and never revive an already fallen unit by normalization. Review huge multiplier + uncapped Vitality rank interactions against real late-game encounters. Ensure legitimately trained monsters retain persistent personal bonuses after **Succession into a non-Rogue hero class** even though the current `charmedEliteTrained` check is Rogue-specific.

The existing **global hero Skill-2 companion-training gate stays for Soldiers, Archers, pets and the earlier Charmed signature**, with a new personal Orin-trained flag controlling *only the paid full Ringleader stats*. Do not turn 100 crowns into a squad-wide purchase or make paid training a requirement to possess native or inherited skills. All mastery tiers apply to abilities regardless of whether their owner purchased Ringleader Training.

## Future training for other companions — deliberately deferred

The owner may later assess **extra, paid training for Soldiers, Archers/Rangers and boss pets**, **only after monster statistics are finalized and overall world/roster balance is reviewed**. This document **does not set prices, trainers, bonuses, exclusive skills or release dates** for those groups. Their newly proposed **shared mastery participation is independent** of that future decision. Keep the normal shared instructor, Skill-2, Neri, pet family and existing progression economy unchanged for now.

## Required implementation and verification before a gameplay PR

1. Persist per-individual mastery points/tier, guardian-award receipts and Charmed-only Orin flag in validated version-4 saves. Migrate existing save snapshots without erasing companions or erroneously granting mastery. Reconcile active, reserve, fallen, genuine boss pet ownership and Succession (including changing hero class).
2. Credit exactly once per real quest payment, hero level increment, genuine boss form victory and guardian encounter; **every** real captain kill may repeat. Make contributions party-wide for *active, alive* companions; protect against duplicated event delivery and forged actors.
3. Reuse existing skill execution and critical paths. Audit **each actual skill effect** for mastery scaling, action priority, caps, contact, Slow and healing; preserve #608's third and night skills before integrating code from it. Avoid adding per-frame polling, redundant AI, visual/audio engines or huge actor scans.
4. Present concise per-unit Mastery 0–III and progress in existing Company/pet screens; Orin's direct service and existing barracks rescued-specialist route must allow selecting **exactly one authentic Charmed actor** and previewing 100-crown promotion without payment on failed eligibility.
5. Verify deterministic early/late normal and Nightmare examples; hero level burst, repeated real captains, uncompleted and cleared dungeon guardians, reentry/reset, respawn, save/import, recovery, zero funds, repeat purchase, reserve and Succession, critical-hit parity and cross-feature regression.
6. Run the repository's focused unit/integration tests and reproducible build; later full browser/phone and playtest balance verification are separate acceptance states. Do not claim merge, release or device verification until actually done.

## Status at design PR creation

**Planned:** shared 3-tier mastery, event crediting, Orin's 100-crown per-Charmed full stat promotion, #608 skill reconciliation, and additional acceptance tests. **Implemented in earlier work:** normal companion growth, hero Skill-2-native unlocks, companion Ringleader movement/frenzy on merged #590; separately staged third heritage/night skills on draft #608. **Implemented by this PR:** documentation only. **Not tested or merged by this PR:** all new gameplay rules. **Deployed/device-verified:** no new feature claims.
## Integration status — 29 October 2026 follow-up

**Source implementation and owner review are consolidated on [PR #608](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/608).** PR #609 served as the initial design review record. Changes staged in PR #608 include individual mastery and rewards for all four companion groups, bounded native/heritage/night skill growth, v4 save migration and guarding encounters, and Orin's separate 100-crown per-Charmed one-time HP/damage promotion with personal instructor UI and succession carryover. This design document remains the required acceptance contract; no gameplay is implied merged, released or physical-device checked by documenting it. Exact-head automated checks are a separate gate.
