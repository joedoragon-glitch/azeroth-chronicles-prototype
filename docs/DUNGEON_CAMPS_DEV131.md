# Dungeon preparation and leader return rules — dev.131

**28 October Greenwood title correction (draft, not published):** the author-approved owner is Scornfang. The existing `supply-vale` entrance, caches, exit, recovery title and EN/ES objective now use **Scornfang's Treasury** on `feature/greenwood-scornfang-title-20261028` (candidate dev.211). Internal `boss:'thorn'`, `mentor:'thorn'`, encounter, rewards and v4 identities remain unchanged; this does not complete regional geography/livelihood stages #546–#551. Focused title/save and Treasury recovery checks pass, as does the reproducible dev.211 build. Original broader `local-sites` (five scenarios) and `prototype-ui` VM-harness failures reproduce on unchanged main; they remain red, with receipts in [the scoped evidence](evidence/greenwood-scornfang-20261028/checks.json). The region is not yet ready for owner acceptance. The rest of this guide describes the established preparation behavior.

The new preparation menu covers five main dungeons and four Treasuries. Side dungeons retain direct entry and their current behavior. Frontier's roaming captain has no entrance to modify.

| Region | Main dungeon | Treasury |
| --- | --- | --- |
| Greenwood Vale | Forest Crypt | Scornfang's Treasury |
| Flooded Marches | Sunken Archive | Mirejaw's Treasury |
| Ironroot Highlands | Colossus Mine | Ridge Tyrant's Treasury |
| Ashen Frontier | Abyss Bastion | No interior: roaming captain unchanged |
| Dark Crown | Citadel of Ashes | Cindermaw's Treasury |

## Preparation without repeated prompts

The first unprepared interaction offers exactly Enter dungeon and Build Barracks & set recovery, plus Back. An idle active Soldier/Ranger builds on a physically reachable nearby outdoor plot. Existing prices remain: first camp free, later Basic camps 20 crowns. Recovery switches only when normal construction finishes. Missing builders, funds, nearby combat and Succession restrictions are explained. No free healing, companion recovery or instantly completed building is added. Little Treasurer's resource exception does not add construction.

An existing completed camp within 300 world units bypasses the menu. A camp already requested from this particular entrance also bypasses it (within the 650-unit placement bound), including after reload. Nearby automatic entry preserves manually chosen recovery points. Interrupted construction resumes without repayment; the entrance-requested build assignment and automatic recovery selection survive save/reload. Selecting another recovery camp cancels pending automatic selection. The build message asks the player to finish construction before entering. Entering while unfinished still cancels field labor under the existing travel rule; pending progress/selection can be resumed by interacting with that camp.

Main-dungeon exits now arrive beside their actual outside entrance, where the camp is, instead of at town.

## Final reset contract after owner clarification

- While a main boss or Treasury captain remains alive, leaving/reentering restores the unfinished encounter: native defenders return at their posts and the leader heals/resets.
- Once a leader is defeated, door travel cannot resurrect it or bypass its existing return rules. Main normal/TRUE victories and pending TRUE/awakening progression stay authoritative. Defenders remain absent while no boss is active; a newly appearing TRUE leader restores its existing guard wave.
- Captain victory empties its Treasury immediately, including remaining defenders and summons. The room stays empty during the existing 120-second return timer. Leaving/reentering preserves that deadline and collection permission; it does not restart, shorten or skip it. When due and safe to return, the captain and native garrison spawn together through the existing all-or-nothing placement/clearance check. That return relocks recovery until the captain is defeated again.
- Earned victories, keys, rescued specialists, claimed caches, fountain uses, clear rewards, loot and regional death-loss balances remain saved. Collected treasure does not refill. Frontier's roaming captain/drop/return is unchanged. Peaceful habitats remain peaceful; side dungeons retain their old rules.
- Reloading inside preserves the current attempt rather than counting as external entry. Legacy Treasury saves with a dead captain are also emptied while awaiting its return.

Native IDs, body-safe homes, combat stats, ranged roles, captain profiles and captured awakening strength remain. Transient statuses/casts, summons, accumulated reinforcement waves and pending local mob-ringleaders are cleared on reset. Restored defeated ordinary defenders do not recreate their crowns/XP. Authored guard counts do not accumulate.

## Focused validation

`tests/dungeon-camps.test.cjs` covers all nine eligible entrance plots/routes; construction, save/reload/completion/recovery and reuse; defeat at the new camp; blockers and Treasurer construction exclusion; first two-action prompt and direct repeat/nearby-camp entry; exit arrival; normal/TRUE reset, wave counts and persistent victories/rescues. All four Treasuries exercise unfinished reset, captain-victory empty room, unchanged deadline across doors, empty immediately before due, simultaneous captain/garrison return and preserved balances/collections. Side dungeon direct entry/state remains covered separately.

Existing death-barracks, Treasury recovery, awakening-anchor and menu checks pass. The Treasury recovery regression suite retains its original collection-permission-after-reentry expectation. Awakening's old dead-guard-across-exit expectation changes to restored guards during an unfinished TRUE attempt, while fixed level/scaling and save assertions remain.

Native phone at 375×812 uses actual touch first menu/build, saved construction, completion-selected recovery, direct repeat entry, guard/boss restoration on exit, outside arrival and defeat recovery. It also leaves/reenters a defeated Treasury before the deadline, confirms it empty, advances to the actual due time and enters for the full captain/garrison return. A side dungeon enters directly. No JavaScript errors. Evidence: `tools/visual-review/dungeon-camps-dev131/native-result.json` and screenshots. Focused local checks/build only; no broad GitHub CI or device matrix. Published through PR #367 (`edf89f0cffb61b91853ea5c8d065da0c1fde3526`), package-only run 39575019566. All 12 checked public files and exact build match. The same final phone flow passed live without JavaScript errors (`live-result.json`). Normal workflow restored and temporary publisher removed. No implementation or release-cleanup tasks remain for this update. Receipt: `docs/evidence/DUNGEON_CAMPS_DEV131_PUBLICATION_20261021.json`.

Sunrise/sunset flashes, the unidentified captain observation and unapproved extra Crypt/Archive/Mine fort bonuses remain separate open items.
