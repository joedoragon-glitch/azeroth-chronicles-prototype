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
