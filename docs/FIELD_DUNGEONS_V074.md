# Outdoor dungeons and specialist rescue audit — v0.7.4

## Implemented encounters

Each region now contains two small outdoor dungeons. They use the existing map, rather than separate loading-screen interiors. They have actual solid defenses, staged guardian groups, persistent clearance and a specific objective incentive.

| Region | Field boss compound | Resource dungeon |
| --- | --- | --- |
| Greenwood Vale | Orchard den stockade: Thornfang / Mira | Woodland cache ruins: finite timber and a supply crate |
| Flooded Marches | Mirejaw island redoubt: Mirejaw / Sela | Stranded wagon enclosure: provisions and a supply crate |
| Ironroot Highlands | Mountain watchtower yard: Ridge Tyrant / Orin | Abandoned quarry works: ore and an ore quest bundle |
| Ashen Frontier | Warlord checkpoint: Ashen Warlord / Lyss | Ruined shrine courtyard: finite salvage |
| Dark Crown | Dark fortress courtyard: Dark Lord / Vera | Ruined foundry works: crystals and a supply cache |

The screenshot's Highland lookout and Ruined watchtower sit by the fortified Ridge Tyrant compound. The additional stone walls and pillars have collision and block line of sight. Paths, cage access, ordinary roads and retreat remain available; the marker is a description point, not an imaginary door to an unimplemented interior.

Guardian counts rise by region: 4/6/8/10/12 in field compounds and 3/4/5/6/7 in resource sites. These are converted existing regional enemies, not extra population. Adjacent pairs engage together, allowing staged fights. Guardians retain ordinary regional health/damage profiles and explicit ranged variants. Gold is 35% of the regional midpoint, rounded down with a minimum of one. EXP is the regional reduced guardian EXP (4/7/8/9/10), matching dungeon guardians. Guardian elites inherit these lower reward bases and preserve their miniature-dungeon identity. Clearing includes living guardian ringleaders and scheduled guardian ringleaders.

No repeatable miniature-dungeon gold chest is added. The rewards are the existing resource budgets, supply objectives and field-rescue quest payouts. Resources and site-linked crates are unavailable until their dungeon is cleared. The five field rescue quests require clearing the defenders, defeating the respective boss and freeing that captive. Freeing a captive still unlocks that person's service independently; leaving defenders alive keeps the compound quest incomplete. Outdoor patrol kills exclude dungeon/miniature-dungeon guardians.

Clearance persists over saves, travel and Succession; these guardian groups do not respawn. Unrelated outdoor patrols and existing field-boss return/TRUE rules continue. Later sites have a small number of warned spike or jet traps; damage is bounded to 8% of maximum health per cycle, with retreat routes preserved. Cleared miniature-dungeon traps stop. Peace opens remaining resources, removes hostile mechanics and closes unearned hostile clear objectives without awarding them.

The original regional resource totals are unchanged. Enemy conversion lowers combat income and EXP intentionally; economy pacing and the staged fight difficulty still need human playtesting.

## Specialist bug found

The normal rescue method set only the chosen captive's flag. However, legacy v2 migration contained an unconditional loop setting nine specialists' rescue flags. That could populate towns with services before the new campaign's rescues.

New imports no longer create those rescue flags. They preserve actual learned skills, equipment, supplies, gold and recorded victories. A previously completed dungeon gives only its own cage key; the player must interact with the captive to enable the service. A recorded Dark Lord victory similarly provides only Vera's key.

Previously migrated v4 saves with the legacy inventory marker are audited once. Unsupported automatic flags are removed when there is no matching normal victory, own key or recorded rescue event. Already-proven progression is retained rather than forcing repeated rescues. This deliberately treats older completed-victory evidence conservatively; it cannot reconstruct an unrecorded physical rescue from an old export. Town teacher/smith/alchemist entries are removed and rebuilt from the resulting individual rescue facts, eliminating stray stale service entries too.

## Verification

- Full `npm test` passes, including all 30 local quests, existing roads/campaign/ending/migration checks, independent rescues for all ten captives, old-save repair and blocked service purchases.
- `tests/mini-dungeons.test.cjs` checks all ten sites: solid cover, accessible guardian routes, reduced rewards, access gates, full clear objectives, reward-once behavior, no guardian respawn, pending elite identity/rewards, migration idempotence, trap bounds, peace and invalid saves.
- Existing first-boss tests still verify all three classes completing the isolated Thornfang fight with skill 1, day and night. They do not establish the difficulty of fighting the full compound at once. Staging the defenders and using retreat remain player decisions requiring human feedback.
- Chromium cases verify rendered compounds across regions, screenshots at desktop size, individual rescue unlocks and the previous collection/map/journal checks. Source and portable builds run through the repository workflow.

No automatic capture economy, building destruction, town siege simulation or additional instanced interiors are introduced. The implemented tactical defenses and clear objectives provide the requested small-dungeon mechanics within the existing adventure.
