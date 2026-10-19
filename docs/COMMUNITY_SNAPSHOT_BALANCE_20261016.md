> **Historical record — 19 October 2026:** Candidate status, approvals, failures and next actions below apply to their dated checkpoints. They do not direct a new chat to resume or re-merge old work. The published snapshot is `0.9.1+snapshot.dev.78`; development is paused, with [current state](DEVELOPMENT_STATE.md) and draft #319 governing recovery. Original evidence remains below.

# Companion and pet tuning rationale — source candidate

No simulations, death observations, benchmarks, browser play or balance tests have run. Values below are provisional engineering choices anchored to current #308 rules, not measured final balance. The final overnight cycle must retain adverse observations and may revise these values within the approved scope.

## Existing troop budget and narrow improvement

Soldier base HP 120, armor 8, damage 12; Ranger HP 105, armor 5, damage 15. Each gains 12 HP per hero level beyond one; attacks add 2 damage per hero level, plus existing Expedition inheritance. Companion Vitality applies after level/inheritance HP and adds 10% per rank. Shared Training passes discipline HP/attack/movement; Shared Strength passes other HP/attack/equipment armor. These investments, not a new mandatory system, remain the main late-game growth path.

Soldier emergency immunity already lasts 2.5s below half HP with 14s recovery. Rangers already supply automatic/manual Heal and dormant legacy Mana Recovery. Both already have first attack recovery 8s, charged second recovery 12s, 0.65s holds and the #308 actual-HP-loss interruption threshold. Slow/Silence and Ranger Rally remain unchanged. There is no new third cooldown or blanket HP/damage increase.

At Expedition 4, available through Highlands training, successful Power Strike grants a 20% self-ward for 2s. That is at most 25% un-Slowed uptime from this strike, conditional on a real hit. It is weaker than a major Paladin protection and never multiplies with it. Immunity timing is unchanged. The purpose is a little protection while screening enemies, not a damage increase or party-wide defense.

At Expedition 4, Rangers may fire their ready Triple Shot while falling back from an enemy within 150 units. Only its first actual arrow contact adds 1s Slow. The Ranger still moves during that frame; the 8s cooldown, target/line/terrain and Silence contracts still apply. This addresses the source path that previously skipped all shots while retreating. It is functional companion support, not a navigation/AI optimization. It does not automatically dodge boss warnings, extend attack range or grant immunity.

## Pet budget

All eleven pets use one `pet` discriminator and a vetted `petFamily`. All share HP 112, armor 6, base attack 13, 12 HP/level, existing Vitality/Expedition inheritance and existing Ranger healing. Ordinary attack interval is 0.95s versus troop 0.85s. Pet first/second recoveries are 8/12s, with second skills using the same interrupted charge path. No rank bonus copies TRUE boss damage, health, summons, arena controllers or reward scaling.

Untrained source arithmetic illustrates the band, without predicting encounter outcomes:

| Hero level | Soldier HP / attack | Ranger HP / attack | Pet HP / attack |
| --- | --- | --- | --- |
| 9 | 216 / 30 | 201 / 33 | 208 / 31 |
| 12 | 252 / 36 | 237 / 39 | 244 / 37 |
| 16 | 300 / 44 | 285 / 47 | 292 / 45 |

For comparison, authored Normal bosses include Ridge damage 36, Colossus 42, Warlord 48, Veyrith 54 and Dark Lord 70, before difficulty/scaling/special coefficients/passives. These numbers alone cannot establish survivability: targeting, actual mitigation, charged interruptions, forced movement and available care matter.

| Pet | First / charged second | Tactical identity |
| --- | --- | --- |
| Thornpup | Dynamic Entry / Tripwire | Melee strike and capped brief area Slow |
| Little Lifebinder | Stay Alive / Algor Mortis | Ranged pressure, small self-heal, cold Slow |
| Mireling | Hydraulic Hop / Little Inundation | Short-range control and splash |
| Pocket Keeper | Water Jet / Undertow | Ranged strike and narrow slowing line |
| Little Treasurer | Coinage Bonk / Rolling Cargo | Heavy single strike and short capped line |
| Pebble Colossus | Punching Shear / Tiny Compaction | Brief self-ward and close slowing pulse |
| Ash Cadet | Cleaving Combo / Pursuit Sweep | Narrow multi-target melee cones |
| Veyrith Whelp | Compressor Puff / Wake Vortex | Ranged burst and short air Slow |
| Little Marshal | Precise Contouring / Fractional Resurfacing | Narrow line and precise slowing cone |
| Cinder Cub | Little Cordon / Parens Patriae | Close pressure and brief self-protection |
| Pocket Sovereign | Veteran’s Repertoire / Pathfinder’s Gambit | Single-target melee and two-target line |

Pet attacks use 1–3 target caps; first multipliers 1.4–2.8 versus troop first 3×; second multipliers 1.2–2.0 versus troop 2.2/2.4. Slow is 1–1.5s; healing is self-only 4% max HP per successful Lifebinder first; wards are self-only 15%/2s or 25%/3s. Live figures come from `rules.js`, exposed in the collection and Keeper. These are deliberately simplified ally interpretations: e.g. no real boss cargo, arena flooding, fixed hazards, summons or boss-AI movement sequence is invoked.

## Required final observations

Compare pre-update troops to candidate troops at matched hero levels, training and gear across Highlands, Frontier and Crown, all classes, Normal/Nightmare, two/four/six units, ordinary 1/3/5/8/12 packs, captains and Normal/TRUE bosses. Log survival time/deaths, effective damage/casts, interrupted charges, healing/immune/ward uptime, pursuit/retreat downtime, targets and encounter duration. Test mixed pet/troop and six-pet parties; ensure control stacking does not trivialize bosses and pets do not dominate both troops' roles. Include low-investment and well-trained parties. Keep the hero necessary. Do not retune enemy AI, navigation or global combat timing to make the results look better.

## Authored matched study after source audit A03 — NOT RUN

`scripts/community-companion-balance.cjs` now implements this separate study. The unchanged earlier hero matrix remains required. The new runner loads the exact merged #308 engine and candidate engine into the same fixture/policy, with separate source hashes. It does not emulate old troop behavior with a candidate feature flag.

| Dimension | Authored configurations |
| --- | --- |
| Hero/difficulty | Paladin, Mage, Ranger; Normal and Nightmare |
| Region/level | Highlands 9, Frontier 12, Crown 16 — explicit comparison fixtures, not a claim these are every player's levels |
| Investment | Low: no disciplines/inheritance/Vitality, prior equipment tier, learned regional skills at Rank 1. Trained: seven discipline ranks, region's equipment tier, three Vitality ranks, regional Shared Training/Strength ceilings and region-teacher skill ceiling. No inaccessible Skills 7/8 are granted in earlier regions. |
| Party | Solo control; two/four/six alternating troops; four/six mixed troops and pets; three distinct six-pet cohorts spanning all eleven families |
| Encounters | Actual native role/weapon/mount blueprints staged in packs of 1/3/5/8/12; actual supply-room captains in Highlands/Crown and field overseer in Frontier; regular/TRUE field and dungeon bosses; regular/TRUE Dark Lord in Crown |
| Seeds/policy | 113 and 271; same responsive scripted rotation and warning reaction in both versions; 0.1s production ticks, up to 90 seconds |

This defines 6,912 candidate observations and 3,072 matched #308 observations before sharding. Pet rows are candidate-only; compare them with troop rows at equal slot count and configuration, never with nonexistent #308 pets. Earlier-region six-unit parties are explicitly labelled capacity stress, since normal regional training does not yet grant six slots. Earlier-region return visits with later pets are controlled postgame/entitlement cases. The Pocket Sovereign is excluded from both Dark Lord fights: that pet cannot legitimately precede its own TRUE unlock.

The runner records per-unit effective damage, HP received, positive healing at the healing owners, first/second casts, charge starts/interruption, death time/survival, immunity/ward availability, movement distance, moving-without-cast time, target samples and final support cooldowns. It retains encounter loss/timeouts, hero contribution and remaining HP. Movement is an observation, not an automatic diagnosis of wasted frames; protection availability is not a fabricated estimate of damage prevented. Hero death can end observation before every companion's independent survival limit.

Captains retain their authored formations. Cindermaw retains designated native escorts and captive/forge dependencies; boss geometry and summoned actors remain production-owned. Background population/reinforcement loops and reward EXP are disabled identically in the isolated study, matching the earlier study's boundary. This does not substitute for the unchanged full native boss/mechanic and natural-campaign gates. Results must be interpreted before tuning: do not approve balance from finite telemetry alone or quietly discard failed cases.

After authorization, export the exact #308 tree into an isolated directory and write `git rev-parse 6bc27be31792b1c38147d61e98ceed6acf3e2560` into its `community-baseline-commit.txt`. The runner refuses a different receipt. Run `COMMUNITY_BALANCE_SHARD=0/8 node scripts/community-companion-balance.cjs <baseline-directory> <shard-output.json>` and the other seven shard indices, retaining all output and actual source hashes. These are future commands, not executed work. Merge the observations by full configuration key; review matched troop differences, equal-slot pet tradeoffs, and all surviving failures before any release decision.

## Pet positioning correction

Ranged pets prefer a comfortable firing band, with a stopping margin inside their shorter special's reach. A covered formation anchor is not a firing destination: the pet specialization selects a legal point around the target, then calls unchanged navigation for the route. If confined terrain prevents that preferred spacing, the pet can still use an otherwise legal attack while repositioning. This is a narrowly necessary pet function, not a combat/AI performance optimization. Existing Soldier/Archer positioning and every shared charge/cooldown/Slow rule remain unchanged.
