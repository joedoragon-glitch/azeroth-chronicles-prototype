# Economy and EXP housekeeping — prepared v0.8.89

Joel authorized an audit followed by implementation. This pass separates economics and rewards while preserving today's balance. It builds on main `7109b34` (audio foundation) and the rebased combat/party split `c6c57b5`. The untouched comparison checkout is that combined commit, before economic edits. Regional source branches remain intact. Joel subsequently lifted the initial publication pause and explicitly authorized proceeding through publication. Release uses the existing GitHub checks and exact deployed-commit verification.

## Audit findings and implementation

Prices were already partly centralized in rules/content, but their calculation and crown transactions were mixed into engine/progression/party. Learning/rank costs, reforge rounding and transport prices were independently calculated in menus. Several barracks descriptions still contained numeric prices. Boss/awakened/clear reward policies and regional enemy profiles contained embedded constants.

`economy.js` now owns prices, `spend`, `grant`, the transport debit and defeat penalty. Menus call the same quotation API as purchases. `rewards.js` owns regional profiles, boss/TRUE/awakening payouts, ringleader multipliers, level-gap/ordinary reductions, enemy reward delivery, quest payouts, dungeon guard reward suppression and resource deposit rounding. `progression.js` retains leveling and training/equipment effects; `xpRequired` is shared by level-up logic and the HUD.

Authoring tables stay in their existing canonical locations rather than being duplicated into a giant money file. Actions retain their own gates and effects. The two new owners install methods on the same Campaign instance, without importing engine, creating state stores or using the DOM. Both are in the shared entry graph, packaging inventory and offline cache.

## All crown expenses and financial lifecycle rules

| Expense/rule | Authoritative inputs | Preserved amount/behavior |
| --- | --- | --- |
| New hero | `rules.balance.economy.startingCrowns` | 30 crowns |
| Learn hero skills | `data.skills[][3]` → `skillTrainingCost(slot, 0)` | Slots 2/3/4/6/5/7/8: 40/75/160/220/400/1000/1600; learning total 3495 |
| Upgrade hero skills | `data.skills[][5]` → `skillTrainingCost(slot, currentRank)` | Per-current-rank units for slots 1/2/3/4/6/5/7/8: 20/35/45/60/50/80/140/180; teacher gates remain |
| Expedition rank | progression eligibility | Free; rescue/curriculum/maximum-rank gates remain |
| Shared Training | `rules.expeditionSupportSkills.sharedTraining.costs` | 140 per rank, five ranks |
| Shared Strength | `rules.expeditionSupportSkills.sharedStrength.costs` | 125/200/300/425 |
| Companion Vitality | `rules.balance.companions.vitalityCost` | 200 per rank; unchanged uncapped training |
| Ranger Heal / Mana Recovery | `rules.rangerSupport` | 50 / 40 for Rank 2 |
| Discipline reset | `rules.balance.disciplines.resetCost` | 250; two free resets remain separate and cannot be wasted |
| Weapon tiers | `rules.balance.equipment.prices.weapon` | 100/450/1000/2000 |
| Armor tiers | `rules.balance.equipment.prices.armor` | 80/300/700/1200 |
| Reforge | equipment prices + `economy.reforgePriceDivisor` | Ceil(tier price / 2); once per eligible current tier |
| Town recruitment | `rules.balance.companions.recruitPrices` | Soldier 70, Archer/Ranger 100; three-total-companion cap |
| Barracks recruitment | `rules.balance.companions.barracksRecruitPrices` | Soldier 60, Archer/Ranger 85; queue/roster gates remain |
| Fallen companion recovery | `rules.balance.companions.recoveryCost` | 40 for one fallen companion |
| Living companion treatment | `rules.balance.companions.treatmentCost` | 30; wounded living roster only, threat gate remains |
| Basic barracks | `rules.balance.barracks.buildCost` | First barracks free; subsequent buildings 20 |
| Full barracks | `rules.balance.barracks.fullUpgradeCost` | 100, charged once before construction; Expedition 4 gate |
| Preparation tonic | `rules.balance.economy.preparationTonicCost` | 70; rescued Neri/advanced service required; no repeat charge while active |
| Outbound transport | `data.regions[].fare` → `travelFare` | Vale 25, Marches 60, Highlands 110, Frontier 180; recovery waiver preserved |
| Return transport / Crown hub | route eligibility | Free; return ticket / visited destination gates preserved |
| Defeat | `rules.balance.economy.deathPenaltyFraction` | Ceil(20% of positive carried crowns); balance floors at zero |
| Succession | lifecycle, not a purchase | Remaining crowns/progress retained; new hero level/skills reset as before |
| Refuge/fountain services | existing eligibility | Remain free; retired combat potions remain unavailable |

Transport debits after a successful arrival and remains inside the existing rollback boundary. An arrival failure restores crowns, route tickets and campaign state. Money mutations are confined to economy except constructor/successor/save restoration, which establish or restore state rather than create transactions. Currency remains displayed as crowns; compatible internal `gold` fields and v4 schema are unchanged.

## All reward sources and EXP rules

| Source/policy | Authoritative inputs | Preserved behavior |
| --- | --- | --- |
| Ordinary outdoor/resident enemies | `data.regions[].gold_range`, `enemy_xp` | Crowns = floor regional mean; normal non-guard/non-captain mobs receive half base EXP |
| Dungeon guard profiles | regional `guard_xp` | Profile uses guard EXP; main-dungeon guards are subsequently set to zero crowns/EXP, including pending guards, by the existing versioned policy |
| Treasury/local guards | regional values + `balance.rewards.roomGuardCrownsFraction` | Max(1, floor(mean crowns × 0.35)); base guard EXP |
| Field captains | regional values + `balance.rewards` | Round(mean crowns × 2.5), round(ordinary base EXP × 2); exempt from ordinary half-EXP rule |
| Night enemies | regional values | Lower bound of crown range; base regional EXP; unchanged night eligibility |
| Ringleaders | original pending reward + `balance.rewards.ringleaderMultiplier` | ×1.5 crowns and EXP; payout rounding remains later |
| Normal bosses | `data.bosses[].gold/xp` | Authored base rewards; all 11 families preserved |
| TRUE bosses | base values + `balance.rewards.trueBossMultiplier` | ×2 crowns and EXP |
| Awakened TRUE dungeon bosses | `balance.rewards.awakenedBossCrowns/awakenedBossXp` | Crypt/Archive/Mine/Abyss/Citadel order: crowns 500/600/700/800/1000, EXP 1000/1250/1500/1750/2000 |
| Challenge reduction | `rules.progression.levelGapRewards` | Hero-minus-enemy gaps 0/1/2/3/4+: multiplier 1/0.75/0.4/0.1/0; floor final crowns/EXP |
| Summons / repeated defeats | existing kill guards | No summon payout; already-paid defeats cannot pay again |
| Enemy payout timing | `awardEnemyReward`, kill and pickup orchestration | EXP on kill; crowns in world loot, paid on pickup; no zero-crown pile |
| Quest payouts | `data.quests[][3/4]` and existing quest definitions | 30 authored quests: 4340 crowns / 9000 EXP; automatic, once only, no payment for peace-closed quests; barracks tutorial has no currency payout |
| First dungeon clear | `balance.rewards.dungeonClearCrowns` | 100/220/400/650/900 once; normal boss clear plus no live/pending guards required |
| Tribute/resources | `rules.tributeTotal`, `tributePlans`, existing world allocation | 640 per region, 3200 across five regions; labor timings and resource depletion retained |
| Resource deposit | `resourceDepositReward` | Floor(carry + 1e-7); fractional carry retained; no EXP |
| Treasury caches | collection/quest orchestration | Collected markers satisfy objectives; no direct crown transaction invented |
| EXP thresholds / growth | `rules.balance.growth`, `rules.manaBalance` | 120 × current level; HP +25/level, existing MP growth, full refill, training point and roster sync; consecutive levels supported |

Base amounts are inputs, not guarantees of net income: level gaps, ordinary EXP reduction, forms, population, eligibility and one-time payment state affect actual earnings. `data.economy` is an unused aggregate reference. Several totals still match current authored data, but its estimated main-route total is not an enforced gameplay budget. It was neither adopted as a second live catalog nor used to rebalance the game.

## Verification and limits

- Untouched combined combat/audio baseline compared against the final economic implementation: **559** deterministic result/live/transient/snapshot comparisons, including 132 additional economic checkpoints across all three professions, both modes and Standard/Succession.
- Comparisons retain authored content and existing rules, CSS order and **20 pixel-identical Canvas scenes**. Newly extracted numeric parameters are separately asserted against their former values.
- Economic replay covers skill learning/upgrades, inheritance, equipment/reforging, support, respec/tonic, first-free/repeated barracks, once-paid upgrades, hiring queues, treatment/recovery, fractional deposits, paid/free/failed travel, insufficient funds, every boss form, once-only quests/dungeon clears, summon exclusions, kill/pickup timing and Succession.
- Price mutation tests prove both UI quotes and actual charges follow changed learning/rank/equipment prices and ceil-rounded reforges.
- Shared browser script graph installs the new owners without CommonJS or a DOM; all class/mode simulations agree with Node.
- All **285 existing public methods/accessors** retain their property descriptors and declared argument counts; new quotation/reward helpers extend the API.
- `npm run build`, `npm run format:check`, `npm run check`, and `git diff --check` pass.
- `npm test`: **44 regression suites passed**.
- Chromium full device matrix: **224 desktop/mobile checks passed** across seven viewport configurations, including accepted CSS equivalence, native charge inputs and offline entry paths.
- Desktop and phone Chromium audio integration both pass: gesture unlock, pause/background lifecycle, frozen campaign state, bounded/released voices and 28 finite, non-silent, unclipped score renders per entry.
- Local WebKit attempt cannot launch because `/root/.cache/ms-playwright/webkit-2336/pw_run.sh` is absent. This is an unavailable check, not a passing result.

Reproducible comparison evidence: `docs/evidence/ECONOMY_EXP_EQUIVALENCE.json`. Run `node scripts/compare-housekeeping.cjs ../economy-baseline` against the untouched `c6c57b5` checkout; do not use `--exact-methods` for this formula-delegation pass. The earlier extraction-only combat report/evidence remains historical.

This is structural housekeeping, not a gameplay rebalance, full campaign completion test or proof that all bugs are absent. Storage-denial, malformed-import and long-session stress investigations remain deferred at Joel's direction. No presentation fixture, artwork or audio recipe was changed. WebKit is unavailable in this environment; its release check remains required in CI. The local checks above precede publication; GitHub release checks must pass before deployment.
