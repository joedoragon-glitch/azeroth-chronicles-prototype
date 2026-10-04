# Local quests and sites — v0.7.3

## Findings

The 30 local quests have explicit engine objectives. Named landmarks were not all inert: bridges correspond to terrain crossings, reconnaissance landmarks record visits, and the gate completes the final approach quest. However, landmark interaction supplied no explanation, generic collected crates stayed drawn, every worker deposit spawned at a main town offset, and several named destinations had no specific encounter beyond nearby generic enemies.

Two functional mismatches were found: dungeon guardians counted toward quests described as outdoor patrols, and the escorted supplier could take melee damage but was excluded from enemy projectile, area, charge and hazard victims. The escort quest was completable; its protection mechanics were incomplete.

## Corrective implementation

- Preserve the five existing regional resource budgets and enemy populations. Relocate finite deposits away from both main and minor refuges and assign existing patrol packs to defend sites. Keep enemy reward values unchanged.
- Place three distinct quest crates at authored landmarks in each collection region. Remove the Frontier's unused generic crates: its supply objective is an escort, not a collection quest.
- Hide collected crates from rendering, map destinations and interaction selection. Record collections even before acceptance, retaining existing design behavior.
- Show missing objectives and the correct reward board in the journal. Announce newly completed quests and save collections/completions.
- Explain landmark roles on first discovery and interaction, including crossings, surveys, supply collection, worker deposits, the escort and boss approaches. There is no implied interior entrance for an outdoor site.
- List named worker deposits on the map and allow nearby interaction to assign a worker. Gathering orders repeat deposit trips until exhausted or superseded by another order. Enemies can target workers at sites and along routes; the main towns retain their refuge behavior.
- Limit outdoor patrol progress to outdoor ordinary enemies while the quest is active. Include the supplier in enemy attack victims, with its existing retry behavior after defeat.
- Upgrade existing saves once, preserving resource depletion, collections, quest payments and enemy deaths. No new resources or rewards appear on upgrade.

| Region | Worker expedition | Collection destinations / supply activity |
| --- | --- | --- |
| Greenwood Vale | Woodland supply cache | Abandoned orchard, Orchard den ruins, Woodland supply cache |
| Flooded Marches | Stranded supply wagon | Stranded supply wagon, Causeway watch platform, Sunken dock |
| Ironroot Highlands | Stonecross ore vein, moved into contested highland ground | Ore vein, Highland lookout, Ruined watchtower |
| Ashen Frontier | Occupied checkpoint | Supplier at Supply convoy, escorted to Emberwatch |
| Dark Crown | Crystal shelf | Ruined foundry, Crystal shelf, Siege camp |

## All 30 local objectives

| Region | Quest | Completion mechanism |
| --- | --- | --- |
| Vale | The missing instructor | Defeat Thornfang and interact with Mira's cage |
| Vale | Protect the mill road | 5 outdoor regional ordinary enemies while active |
| Vale | Orchard supplies | Interact with all 3 named site crates |
| Vale | A smith behind bars | Defeat Crypt Guardian and free Borin |
| Vale | The wagon departure | Visit Mill bridge and wagon stand |
| Vale | Woodland survey | Visit Orchard den ruins and Southern footbridge |
| March | A teacher on the island | Defeat Mirejaw and free Sela |
| March | Causeway patrol | 6 outdoor regional ordinary enemies while active |
| March | The drowned alchemist | Defeat Drowned Keeper and free Neri |
| March | Fisher provisions | Interact with all 3 named site crates |
| March | Lanterns after dark | Observe Lantern shore at night and kill 2 night wraiths while active |
| March | The eastern ferry | Visit the ferry stand |
| Highlands | The ridge prisoner | Defeat Ridge Tyrant and free Orin |
| Highlands | Quarry relief | 7 outdoor regional ordinary enemies while active |
| Highlands | The captive forge | Defeat Mine Colossus and free Dara |
| Highlands | Ore for Stonecross | Interact with all 3 named ore supply crates |
| Highlands | A road through stone | Visit Stone bridge and Timber crossing |
| Highlands | The caravan trail | Visit the caravan stand |
| Frontier | The occupied checkpoint | Defeat Ashen Warlord and free Lyss |
| Frontier | Supplies for Emberwatch | Keep supplier close enough to follow the road into Emberwatch |
| Frontier | The stolen runes | Defeat Abyss Dragon and free Eren |
| Frontier | Reclaim the road | 8 outdoor regional ordinary enemies while active |
| Frontier | The burned settlement | Visit Ruined shrine, Burned Hamlet and Ravine overlook |
| Frontier | Dragon passage | Visit the dragon roost |
| Crown | The final instructor | Defeat Ash Sentinel and free Tovan |
| Crown | Break the siege | 8 outdoor regional ordinary enemies while active |
| Crown | The master smith | Defeat Dark Lord and free Vera |
| Crown | Refuge supplies | Interact with all 3 named site caches |
| Crown | Fortress reconnaissance | Visit Ruined foundry, Crystal shelf and Siege camp |
| Crown | The last approach | Visit Dark fortress gate, not the transport stand |

Rewards still require a claim at the appropriate local board and pay once. Patrol, night and escort quests close without unearned rewards when peace removes their hostile objectives.

## Validation and limits

`tests/local-sites.test.cjs` exercises all 30 quests independently through engine interactions, kill accounting, physical site arrival, escort movement, reload and single-payment checks. Additional cases check inactive/dungeon kills, deposit/cache paths and guards, worker damage and complete repeated gathering, upgrade idempotence, and projectile/area damage to the escort. The existing ranged-attack regression uses a fixed clear fixture position so its projectile check does not depend on newly authored patrol placement.

Local `npm test` passed, including the shell interaction harness and all 30 objective scenarios. Full Chromium execution could not run locally because the browser download returned an invalid archive. The added Chromium cases have not yet run; they await the repository CI checks.

The browser suite checks collection through the actual Interact button, journal progress, hidden collected map entries and named guarded resource destinations at all four supported viewport sizes, for both source and portable builds.

This change gives the outdoor sites concrete uses; it does not introduce separate mini dungeon interiors, unique bosses at every landmark, capture-point ownership or town sieges. The lookout and shrine remain survey/patrol objectives, rather than new interiors. Further encounter design should use these now-functional destinations as its starting point. Human playtesting is still needed for escort survivability, early worker-expedition difficulty and the presentation of site labels.
