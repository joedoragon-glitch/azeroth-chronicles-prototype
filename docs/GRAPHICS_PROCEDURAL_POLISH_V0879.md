# Procedural canon polish — v0.8.79

This pass prepares the existing procedural art for later major changes and sprite production. It strengthens the identity of selected static drawings in `src/prototype/visuals.js`. It does not change world layout, collision, entity positions, interaction radii, saves, progression, prices or combat rules.

## Destination identity

The five main dungeon entrances now have different construction:

| Destination | Procedural body |
| --- | --- |
| Forest Crypt | Low faceted stone vault, arched doorway, skull, shallow steps and moss |
| Sunken Archive | Broad stepped lintel, tall columns, side recesses, lower water staining and wide steps |
| Colossus Mine | Irregular rock tunnel, timber braces, rails and sleepers |
| Abyss Bastion | Tapered ash/plum pylons, notched central lintel, pointed barred doorway |
| Citadel of Ashes | Paired pointed towers, central gable, grille and purple inset |

Occupied side interiors no longer inherit an identical generic gate. Their rules-defined themes select a low cellar entrance, raised damaged watchhouse, crenellated signal keep, fractured occupied shrine or chimney repair hall. These exteriors describe the already-established locations; they do not introduce new quests, factions or mechanics. Generic exits, field-compound markers and Treasury entrances retain their previous drawings.

All entrance bodies fit the existing 64-pixel label-height allowance and remain centered on their existing interaction anchors. Bars and occupation boards are descriptive facade details, not new collision objects.

## Furniture and working objects

Root tables use branching pedestals and uneven wooden tops. Game tables carry a small board and counters; war tables have parchment routes and pin flags; ritual tables are chamfered stone slabs on pedestals. Writing desks have a sloping top, open ledger, inkpot and quill. Tool racks display a hammer, shovel and tongs; weapon racks display a spear, sword and axe; fish racks hang recognizable elongated fish at different heights. Kitchens suspend a pot over the existing fire, with attached food box and ladle. Bedrolls and low single bunks have pillows, blankets, ties or rails.

Regional timber and selected cloth/stone colors remain meaningful. These drawings stay lightweight, deterministic and within the previous local placement envelope. No additional world props or blockers are placed. Repeated game tables and region-sensitive racks continue to use procedural rendering where the coverage audit calls for it.

## Specialists and town services

Each specialist retains their established body, palette, face, headgear and profession tool. Personal clothing construction now differs: Mira's shoulder wrap, Borin's asymmetric pocket apron, Sela's wrap and front panel, Neri's work apron/vial loops, Orin's fringed mantle, Dara's shoulder guard and segmented pocket, Lyss's sash/split coat, Eren's diamond-inset work apron, Vera's shoulder guard/leather panel and Tovan's pale robe panels. Closed cages use these same specialist bodies.

Services retain a recognizable quest board, counter, equipment post or refuge. Their regional roof construction now differs: Vale pitched awnings, Marches uneven ribbed reed roofs, Highland stepped stone canopies, Frontier patched roofs and Crown slate canopies. Shelves, stock, document holders, pennants and benches support each service's function. Refuge bodies differ by regional construction. Chimneys belong to the Highland refuge rather than every Highland service.

## Camp construction and retained canon

Unfinished camps show four stages using existing progress: materials/stakes below 1, frame below 2, one canvas panel below 3, and both canvas panels below 4. Finished Basic and Full camps retain their established layouts and shared reserved footprint.

Heroes, companions, ranged variants, military rank cues, named captains, major bosses, Treasury entrances and composed Crown/Bastion scenes retain their current canon. Terrain, atmosphere, effects, UI, repeated defensive geometry and ordinary clutter are outside this pass.

## Sprite reconciliation and verification

The sprite manifest remains empty. Existing runtime keys remain exact. Catalog IDs remain stable: 131 is now the cellar entrance; 228–231 add the other four side-interior bodies. The catalog contains 231 numbered entries: 221 GENERATE, 0 ALIAS, 10 KEEP PROCEDURAL. Changed specialists and their closed cages, main entrances, services and generated furniture prompts describe the revised drawings.

Verification uses actual Campaign-created entrances, geometry-only render signatures to catch accidental shared-gate fallback, deterministic/state-preserving draw checks and the existing regression suite. Canvas comparisons at native and enlarged sizes check material separation, silhouette and label clearance; release checks cover desktop/mobile browser behavior and deployed assets. Visual comparisons are review aids, not image-generation assets or new game sprites.
