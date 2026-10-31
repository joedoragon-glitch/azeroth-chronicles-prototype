# Companion mastery and Charmed Ringleader training — owner design contract

> **Owner design contract dated 29 October 2026; subsequently implemented and merged in [PR #608](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/608) at [main@b4836bc](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/b4836bc27345fae1815b8c2bf8fd0424c09faf4a).** The original design/checklist sections are preserved as the decision history, not an open implementation queue. The current post-merge status and genuinely deferred work are recorded at the bottom. [PR #609](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/609) was closed unmerged after being consolidated into #608.

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
- **Charmed extension implemented in merged PR #608 / Issue #589:** preserve each of the **twelve owner-chosen third heritage abilities** with its separate `skill3Cd`, in addition to native and elite skills. Also master the authentic **Lantern Wraith Soul Drain** or **Ash Stalker Shadow Pounce** night ability with `skillNightCd` when actually possessed. These are *additional native night abilities*, distinct from the third heritage skill; #608 is **merged into main**; GitHub Pages publication and individual device uptake require separate evidence.

The inherited third heritage skills to preserve from #608 are: **Goblin—Dust Entrainment; Skeleton—Disarticulation; Mireling—Hydraulic Jump; Reedbeast—Mud Pumping; Wolf—Crowd Dispersal; Ogre—Lateral Load Transfer; Orc—Flank Command; Raider archer—Bad Deal; Ashbeast—Broodscreen Roar; Crownguard—Reversal; Lantern Wraith—Pressure Grouting; Ash Stalker—Flank Command**. The two night creatures remain Charmed by lawful night encounters and survive sunrise once captured, as specified on #608, not by this design PR.

**Historical integration safeguard (completed in PR #608):** its third heritage skills, two additional night species, critical release keys, save cooldowns and effect geometry were reconciled with the shared mastery implementation. Future work must preserve these now-merged behaviors.

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

## Historical implementation checklist and remaining acceptance gates

1. Persist per-individual mastery points/tier, guardian-award receipts and Charmed-only Orin flag in validated version-4 saves. Migrate existing save snapshots without erasing companions or erroneously granting mastery. Reconcile active, reserve, fallen, genuine boss pet ownership and Succession (including changing hero class).
2. Credit exactly once per real quest payment, hero level increment, genuine boss form victory and guardian encounter; **every** real captain kill may repeat. Make contributions party-wide for *active, alive* companions; protect against duplicated event delivery and forged actors.
3. Reuse existing skill execution and critical paths. Audit **each actual skill effect** for mastery scaling, action priority, caps, contact, Slow and healing; preserve #608's third and night skills before integrating code from it. Avoid adding per-frame polling, redundant AI, visual/audio engines or huge actor scans.
4. Present concise per-unit Mastery 0–III and progress in existing Company/pet screens; Orin's direct service and existing barracks rescued-specialist route must allow selecting **exactly one authentic Charmed actor** and previewing 100-crown promotion without payment on failed eligibility.
5. Verify deterministic early/late normal and Nightmare examples; hero level burst, repeated real captains, uncompleted and cleared dungeon guardians, reentry/reset, respawn, save/import, recovery, zero funds, repeat purchase, reserve and Succession, critical-hit parity and cross-feature regression.
6. Run the repository's focused unit/integration tests and reproducible build; later full browser/phone and playtest balance verification are separate acceptance states. Do not claim merge, release or device verification until actually done.

## Historical status at design PR creation (superseded by checkpoint below)

**Planned:** shared 3-tier mastery, event crediting, Orin's 100-crown per-Charmed full stat promotion, #608 skill reconciliation, and additional acceptance tests. **Implemented in earlier work:** normal companion growth, hero Skill-2-native unlocks, companion Ringleader movement/frenzy on merged #590; separately staged third heritage/night skills on draft #608. **Implemented by this PR:** documentation only. **Not tested or merged by this PR:** all new gameplay rules. **Deployed/device-verified:** no new feature claims.
## Integration status — 29 October 2026 follow-up

**Source implementation and owner review are consolidated on [PR #608](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/608).** PR #609 served as the initial design review record. Changes staged in PR #608 include individual mastery and rewards for all four companion groups, bounded native/heritage/night skill growth, v4 save migration and guarding encounters, and Orin's separate 100-crown per-Charmed one-time HP/damage promotion with personal instructor UI and succession carryover. This design document remains the required acceptance contract; no gameplay is implied merged, released or physical-device checked by documenting it. Exact-head automated checks are a separate gate.


## Post-merge engineering checkpoint and outstanding decisions — 29 October 2026

**Implementation:** [PR #608](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/608) was squash-merged at [`b4836bc27345fae1815b8c2bf8fd0424c09faf4a`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/b4836bc27345fae1815b8c2bf8fd0424c09faf4a). The 12 approved heritage skills, Lantern Wraith/Ash Stalker capture and daytime retention, three-tier personal mastery for Charmed creatures, Soldiers, Rangers and boss pets, individual rewards and guarded receipts, v4 persistence and recovery, and Orin's selectable one-time 100-crown Ringleader promotion are **in main**. Their menus show mastery progress; Orin previews the selected monster's stats before payment. Orin's permanent promotion applies 2.5× friendly-scaled HP, 1.5× damage, 1.2× combat pursuit and wounded attack-rate benefit **without double stacking** and without buying a Rogue Skill-2 unlock.

**Automated verification:** [the exact-head PR validation run #40844022904](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40844022904) passed **67 focused test files** and a reproducible offline-ready build, before merge. The [merged-main run #40845505116](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40845505116) subsequently **passed 57 relevant focused test files**, the offline-ready build, and the **GitHub Pages deployment**, publishing exactly `b4836bc27345fae1815b8c2bf8fd0424c09faf4a`. This confirms the code is **live on GitHub Pages**, not that a particular phone/Chromebook has downloaded or visually validated it. The published service worker is [stamped with the deploy commit](../scripts/pwa-release-id.cjs) even when the displayed dev version remains `0.9.1+snapshot.dev.224`; the installed PWA may still wait for the player to accept an update. Standard focused checks do not represent a full browser/physical device playthrough.

### Pending, explicitly separated from implemented gameplay

| Area | Status | Owner-respecting next action / acceptance test |
| --- | --- | --- |
| **Release and adoption** | **Published on GitHub Pages** by successful merged-main run #40845505116; **local device uptake unverified** | Open the [browser game](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/) or [phone game](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/phone.html); accept the game's offered update when present, and confirm the loaded release on each device. Preserve local saves; do not clear browser data as a routine update step. |
| **Three mastery thresholds** | **Implemented at cumulative 4 / 10 / 18**; owner accepted as working values, **final pacing not accepted** | Measure first Tier I/II/III acquisition for early Greenwood captures and late Dark Crown captures across Normal and Nightmare. Check that repeatable captains keep the late route reachable without making the mastery cap trivial. Only rebalance from representative playtest evidence. |
| **Guardian and repeatable captain credit** | Implemented and focused-tested; field balance not accepted | Verify guarded encounter receipts survive save/reentry and prevent pre-clear farming; every authentic returning captain gives +1; ordinary respawning Ringleaders give zero. Verify genuine boss normal/TRUE rewards, multiple hero levels from a single XP event and participation eligibility across reserve/fallen/active states. |
| **Individual paid Ringleader promotion** | Implemented and focused-tested; long-run balance not accepted | Inspect the **2.5× HP / 1.5× damage / +20% pursuit / wounded frenzy** combination alongside level scaling, Shared Training/Strength, Neri's **uncapped repeatable +10% Vitality** and personal mastery. Test very high Vitality stacks, capture roles, criticals, healing, recovery and lawful non-Rogue Succession for power creep or repeated multipliers. Keep 100 crowns and per-individual purchase until the owner decides otherwise. |
| **Skills, effects and presentation** | 12 heritage + 2 night abilities coded with independent clocks, geometry, healing, Slow, knockback, critical/FX/audio paths; automated tests passed | Human-check skill readability, native/elite/heritage/night priority, damage/healing/Slow/ward caps, animation, sounds, collision and hit feedback in real encounters. Compare mixed party sizes, bosses and night/day transitions, especially on phone and Chromebook. |
| **Ranger/Soldier/pet comparative balance** | Included in shared personal mastery; no separate new paid specialty training | Once the owner finishes monster statistics and moves to world/roster balancing, compare trained/untrained Charmed monsters against conventional Soldiers/Rangers and boss pets across early/late regions and normal/TRUE bosses. Additional pet/Soldier/Ranger **paid training is deferred and not yet designed**: no price, instructor, stat multiplier, skill or schedule is approved. Do not implement it speculatively. |
| **Broad acceptance** | Not yet certified | Run opt-in comprehensive browser/phone/nightmare suites and human device checks. Include old v4 import, reserve/fallen recovery, permanent daytime companions, progression after Succession, combat geometry, audio, and sustained performance. Never claim full-game, real-device FPS, installation or visual acceptance from focused CI alone. |

**Explicitly not missing:** a new general mastery system for pets, Soldiers or Rangers; that shared system was implemented with #608. **Actually deferred:** *additional individualized paid training for those types*, post-monster-balance review. Historical draft/branch notes above should not be interpreted as fresh implementation requests.


## Issue #620 Stage A implementation checkpoint (31 October 2026; draft branch only)

Barracks Company roster and Charmed-species pages now lead to a per-ID **Inspect** view rather than immediately invoking Rest/Activate. The individual view retains a separate explicit management choice, shows personal HP, status, Mastery tier/cumulative threshold and Orin marker, and opens a read-only ability overview from current `Campaign.rules` and companion values. That overview distinguishes native, Ringleader signature, third heritage, night-native, troop, and boss-pet skills; unlock conditions and approximate noncritical pre-defense current/next-tier damage are shown. Boss-pet details reuse the same owned-unit ability overview. Orin's existing trainer picker now uses the roster's 8-per-page pagination while preserving the exact selected actor ID, price preview and guarded confirmation.

This source modification is **implemented on an unmerged development branch only**; no claim of focused CI, publication, physical-device usability or owner's acceptance is made here. Stage B Developer Mode companion damage is now **implemented in draft PR #723 only**. It remains subject to exact-head focused CI, phone/desktop visual acceptance and separate merge/deployment authorization. The [experience design](COMPANION_COMPANY_EXPERIENCE_620.md) is the source for the intended presentation. See [issue #620](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/620) for acceptance and scope.
