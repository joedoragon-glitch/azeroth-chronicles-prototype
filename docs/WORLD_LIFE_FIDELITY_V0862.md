# World life, geography and fidelity pass — v0.8.62

## Intent

This pass treats authored geography as world canon rather than flavor text. A named ferry, quarry, shrine, camp, fortress approach, monster territory or dungeon function should be visible and spatially credible in play. A coordinate alone is not a place and a label alone is not environmental storytelling.

The tone is deliberately not grimdark. The Dark Lord has already won and imposed an order, so oppression coexists with ordinary adaptation. People still trade, repair, cook, garden, wash clothes and try to prosper. Monsters likewise sleep, eat, nest, scavenge, train and maintain territory between hostile acts. Occupation pressure is visible, but it is not the only activity represented.

## Space and geography

The old overworld bounds were too compressed for the amount of authored content. Region sizes are now:

- Greenwood Vale: 2700
- Flooded Marches: 3000
- Ironroot Highlands: 3400
- Ashen Frontier: 3400
- Dark Crown: 3800

Major dungeons, transports, minor settlements and field compounds use the extra land instead of leaving an empty border. Existing saves migrate these destinations and rebuild roads without resetting campaign progress.

Each region now has a distinct large-scale visual geography. Vale uses meadow/orchard slopes and wooded rises; Marches uses wet basins, mudflats, reed islands and shore shelves; Highlands uses stepped terraces, quarry shelves and pine basins; Frontier uses burn scars, ravine shelves, ash lowlands and a militarized road belt; Crown uses ash plateaus, obsidian shelves, crystal fields and a fortress apron.

These landforms imply height and shape in the isometric renderer. The simulation remains 2D: there is no hidden Z-axis or vertical combat physics. A smaller set of actual collision features—ponds, cliff spurs, ravine shelves, lava channels and obsidian outcrops—makes the geography affect travel as well as presentation.

## Architecture

Settlement props no longer use one universal house/workshop/fence family.

- Vale: timber cottages, workshops and rural fencing.
- Marches: stilt houses, boathouses and boardwalk construction.
- Highlands: stone homes, smithies and low stone walls.
- Frontier: repaired/patched houses, rough workshops and palisades.
- Crown: ash-stone/obsidian homes, forgehouses and dark walls.

Named town services keep their gameplay identity but receive regional structural framing as well.

## Lived-in hostile territory

Ordinary patrols remain the same authored population and rewards, but expanded occupation anchors spread them over more land. Decorative living-space clusters establish where inhabitants actually spend their time.

Examples include goblin roadside camps, mire nesting banks and wallows, wolf hunting grounds, ogre communal hearth camps, orc bivouacs and drill camps, ash-beast roosts, Crown barracks and fortress work camps.

Field-boss compounds also gain domestic or operational details—beds/nests, cooking or feeding spaces, supplies, trophies, training equipment, command tables and similar cues appropriate to the boss family. These are presentation/worldbuilding additions, not extra combat rewards.

## Treasuries and dungeons

Treasure rooms are treated as homes, stores or working spaces belonging to their owner rather than generic rooms containing quest crates. The four Treasuries now have different internal partition plans and expanded boss-specific furnishing sets.

Main-dungeon decorative sets grow from twenty generic/theme props to larger functional layouts. The intent is:

- Forest Crypt: burial complex, caretaker/ritual spaces and ossuary activity.
- Sunken Archive: drowned library/repository with salvage and aquatic occupation.
- Colossus Mine: excavation, rails, ore handling, tools, forge and giant-scale working space.
- Abyss Bastion: dragon roost, hatchery, feeding remains, heat and hoard functions.
- Citadel of Ashes: barracks, armory, command, forge, supplies and ritual/military functions.

Combat geometry, boss mechanics, rewards and progression are preserved unless a separate rule explicitly says otherwise.

## Quest pass

No new quest count was added merely because maps grew. Existing exploration objectives were preferred as the vehicle for experiencing the richer world.

Four survey quests were reworked to lead through inhabited territories: the Vale goblin camp, Highland wolf and ogre territories, a Frontier orc bivouac, and Dark Crown ash-beast/Crown military spaces. Treasury quest names and prose now agree with the actual Treasury objectives.

## Audit rules

The pass is considered incomplete if any of these fail:

1. Declared -> a location or route exists in data/lore.
2. Located -> its coordinates make geographic sense.
3. Represented -> it visibly looks like what its name claims.
4. Contextualized -> roads, inhabitants and nearby scenery explain why it is there.
5. Inhabited -> important civilian, monster and military locations show ordinary use outside combat.
6. Breathing room -> settlements, patrols, field compounds and wilderness are not stacked into one central band.
7. Regional identity -> architecture and landform silhouettes differ for reasons deeper than palette swaps.
8. Reachability -> roads, transports, quest sites, cages, dungeons and bosses remain traversable after migrations.
9. Save safety -> existing progression, deaths, resources, collections and quest payments survive layout upgrades.
10. Reward integrity -> visual/world additions do not create unintended gold, XP, resources or quest rewards.

Automated regressions cover world-size use, regional structure families, lived-in props, landforms, route clearance, destination migration, Treasury cache reachability and richer dungeon functional dressing. Human playtesting remains important for visual density, travel pacing and whether the implied terrain height reads naturally on desktop and phone.
