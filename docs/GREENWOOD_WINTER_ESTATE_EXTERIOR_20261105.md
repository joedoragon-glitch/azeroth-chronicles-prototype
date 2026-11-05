# Greenwood Forest Crypt — winter-estate exterior redesign

**5 November 2026 · SIBDLP · Draft implementation · NOT merged or published**

## Owner direction and protected story

The Forest Crypt is being *adapted* into the Dark Lord's unfinished winter residence; it is not a finished manor and should not remain merely a dungeon arch with loose props. The owner authorized a substantial exterior rework, including moving the current entrance a little south and rearranging existing site props. Preserve the Lifebinder/Borin, aware Skeleton workers, Scornfang reclamation logistics, internal Crypt space/quest/guardian routes, four hero classes, v4 saves and the working Greenwood region. No new religion, estate completion, extra dungeon or active construction economy is implied.

## Exterior composition — source-backed implementation candidate

- **Dominant silhouette:** a broad weather-tight residence-in-progress with a large slate-colored central roof, left occupied timber wing, and part-constructed right roof/wall bay. Its main masonry block remains legible as the actual original crypt.
- **Old/new story:** retained ash-gray masonry arch and small carved skull keystone embedded within a much larger main frontage; generous dark access opening, new household windows and shutters, carefully bounded new timber framing. No giant skull gate or invented royal heraldry.
- **Ground contact:** real stone forecourt and steps attached to the new doorway. Roof framing is physically connected to the wing, not independent scaffolding floating among crates.
- **Site arrangement:** move the existing dungeon entry from (2830,2850) to (2830,2940) on Greenwood's 3200-unit layout. The last cartway segment, both live route representations, and existing enterable NPC marker follow the new anchor. Relocate the four existing estate work props so the doorway has a clear frontal approach and the scaffold visually serves the unfinished right wing. Leave Scornfang's separate freight depot and its road, old Crypt interiors, Skeleton territory, roads and river independent.
- **Scale:** rendered procedurally with the same approved art helpers; roughly a 200-unit-wide facade instead of a 68-unit-wide tomb gateway, with a substantially taller roof. This is an exterior visual scale, not an increase to NPC interaction distance or a new collision shape.

## Source ownership and save boundary

- `src/prototype/visuals.js`: new `winterEstateGateway()` used only for **outdoor** Crypt entries; dungeon **exit** retains the ordinary exit door, not a duplicate winter estate.
- `src/prototype/greenwood-landscape.js`: authored anchor, road geometry and scenery positions; `greenwoodEstateFacadeScene` is a one-time, idempotent adjustment for already-saved scene-version-5 campaigns, reanchoring the same NPC/road and four unowned standard site props.
- `src/prototype/greenwood.js`: calls the migration in existing Greenwood finish lifecycle, without regenerating old scenes or altering owned player objects.
- `tests/greenwood-winter-estate.test.cjs`: expected native art footprint, new route endpoint, save-state preservation, no duplicate NPCs, repeated restore and owner prop preservation.

Do not bump the global `greenwoodLayout.sceneVersion` for this cosmetic site change: that would rebuild unrelated regions of a currently authored Vale and risk unrelated user content. The facade's migration has its own `greenwoodEstateFacadeVersion` marker.

## Validation boundaries and integration

**Implemented in isolated draft branch:** source changes listed above.

**Testing:** focused CI and native scene checks must be assessed from exact PR head, not presumed by this document. Check Canvas and Pixi rendering of the same procedural source, doorway route/interactions, no opaque building overlap with the hero, normal and migrated v4 saves, and day/night scene compositions at realistic camera scale. A new facade can still require artistic adjustments after real screenshot inspection.

**Merged / published / device-verified:** no, pending separately authorized review and release. Do not trigger comprehensive test suites, merge or deploy from this design branch without explicit owner authorization.
