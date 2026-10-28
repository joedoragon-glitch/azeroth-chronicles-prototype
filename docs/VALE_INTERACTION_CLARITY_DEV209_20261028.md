# Greenwood Vale interaction clarity — dev.209 draft (28 October 2026)

## Owner's field report and scope
The owner wandered freely through Greenwood Vale from Millhaven without entering a dungeon. Interact became available near some things, but it was unclear which object was selected and whether pressing it did anything. The owner wants subdued gold/cream focus around **small** NPCs/pickups, not entire buildings, and explicitly offers authorial decisions for sites missing lore. No lore is to be invented.

## Source-confirmed root causes
- The actual action chooses the closest of visible NPCs, visible tribute nodes and Barracks **within 115 game-world units**, using `interactionDistance` for refuge service frontages. On phone the chosen name had lived only in the browser button `title`, not reliably visible to a touch user.
- Engine actions `say()` informative results, but the Interact UI branch did not show them. In particular `landmark` and `mini` tell the player about existing sites and encounters internally; without readable inspection feedback they look unfinished.
- Existing Captain, supplier, quest board, refuge first-use, Barracks, and transport menus are functional and should not be rewritten as invented features.
- Resource tribute labor is conditional on Expedition Rank 2, an idle companion and an unexhausted source. It is not a free hand-pickup of every scenery prop.

## Focused draft implementation
- Reuse the nearest-target snapshot already computed during the HUD refresh (not an additional whole-world scan every render frame). Show the selected name beneath the HUD and in the Interact button's accessible name and title. A press still re-resolves the actual target at the unchanged range.
- One static 1.5 px muted ivory-gold corner cue on small service people/quest boards/captives/supplies/tribute pickups, drawn in both normal Canvas and experimental Pixi's Canvas overlay. No structure, landmark, boat or dungeon entrance outline. No new textures, animation, draw cache, gameplay state or saved flags.
- A landmark or mini encounter opens a readable existing `Campaign.interact` message in a dismissible inspection panel. Other normally silent successes show the existing message or neutral confirmation; unhandled failure shows the engine reason or a neutral no-change receipt. Existing dedicated menus/quest/hero narration remain unchanged.
- No new tutorial flow, quest, loot or dialogue created.

## Greenwood Vale exterior inventory
| Interactable | Existing action | Result |
| --- | --- | --- |
| Millhaven Captain | Party/recruitment and first-company tutorial | Existing menu; name and small actor cue |
| Millhaven Supplies | Supply/merchant menu | Existing menu; name and cue |
| Quest board | Quest selection | Existing menu; name and cue |
| Millhaven Refuge and western orchard refuge | Heal, respawn/recovery, initial first-use instructions | Name only; no building outline |
| Region transport and dungeon gate | Travel/entry/camp preparation | Name only; no boat/building outline |
| Field captive | Requires defeated boss/key to release | Name/cue; blocked reason or rescue receipt |
| Quest supplies | Recover once when conditions met | Name/cue; relevant guard/completion feedback |
| Landmarks, orchard, pond, bridges, caches, camp and old ruins | Discover, survey/quest flags, engine `siteDescription` | Readable authored inspection; no giant highlight |
| Dark Lord Tribute resource nodes | Companion gathering with rank/idle limits | Name/cue; reason on failure |
| Built Barracks | Recovery, recruitment/company services | Existing menu; name only |

## Authorial decision queue — no invented context
`rules.sites[0]` includes **Mill bridge, Southern footbridge, Abandoned orchard, Old Orchard Cellars, Mill pond, Woodland supply cache, Goblin roadside camp**. The engine already supplies some exact quest/tribute references and the authored Goblin-camp narration; for less-described sites it can fall back to a mechanically truthful "outdoor patrol site / no separate dungeon interior". The following are **questions rather than presumed missing gameplay**:
- What story or historic use belongs to the Mill pond and Southern footbridge, beyond being a physical landmark/crossing?
- Do Old Orchard Cellars and the Abandoned orchard convey clues, history, a specific quest context, or simply exploration atmosphere?
- What has the Woodland supply cache's contents and ownership become in the current story?

Ask the author before adding lore, interactions, dungeon interiors, special rewards, or teaching copy beyond existing systems.

## Safety and acceptance
No interaction radius, gameplay rules, world coords, AI, collision, NPC eligibility, campaign save schema, renderer choice, PWA logic or authored procedural art was intentionally changed. The version/cache stamp is generated for dev.209. Focused tests target production HUD behavior, unchanged 115-unit reach, readable site details, small-only cue policy and both renderer calls. Full browser/device acceptance remains a separate approval; the owner uses the normal live game only after authorized publication.
