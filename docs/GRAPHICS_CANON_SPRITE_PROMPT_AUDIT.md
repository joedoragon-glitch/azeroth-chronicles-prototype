# Phase 2A — Sprite prompt catalog audit

## Final result

`GRAPHICS_CANON_SPRITE_PROMPTS.md` is the authoritative production document for the next sprite-generation phase.

The completed audit contains **227 numbered entries**:

- **212 GENERATE** entries with complete one-at-a-time image-generation prompts;
- **5 ALIAS** entries that reuse an already generated canonical static body;
- **10 numbered KEEP PROCEDURAL** entries;
- additional broad procedural systems classified exhaustively in `GRAPHICS_CANON_SPRITE_COVERAGE.md`.

No sprite is active in the game yet.

## Audit basis

The catalog was checked against the current production versions of:

1. `src/prototype/visuals.js` — primary visual canon;
2. `src/prototype/rules.js` — authored species, regional, stronghold, captain and encounter context;
3. `src/prototype/data.js` — canonical names/roles/regions;
4. `src/prototype/engine.js` — which visual branches are actually instantiated in the current game;
5. `src/prototype/sprites.js` — future integration keys and exact-variant fallback behavior.

The renderer, not a semantic name or prior generated image, wins every conflict.

## Production workflow locked

The next phase must operate like this:

1. Select exactly one **GENERATE** entry from the prompt catalog.
2. Use that entry's complete prompt.
3. Generate exactly one isolated sprite and nothing else.
4. Do not generate sheets, old/new comparisons, turnarounds, multiple options, scenes or batches.
5. Do not infer missing design information.
6. Store the candidate outside the live manifest.
7. Move to the next prompt only after that one asset exists.

ALIAS entries receive no new image. KEEP PROCEDURAL families receive no sprite.

## Corrections found during audit

### Ranger and Archer bodies

The hero Ranger uses the canonical Ranger body plus hero-layer polish. The companion Archer/Ranger support is also rendered with `human('ranger')`, so it retains the Ranger body's teal flask/pouch and small pale-green/gold utility accent.

The hostile Raider Archer is different: it uses `human('archer')`, a simpler darker-green archer without those Ranger-specific extras. Its earlier alias was incorrect and was replaced by its own prompt 023.

### Mechanical variants are not automatically visual variants

The following remain visual aliases because their static procedural bodies do not change:

- 030 Mireling spitter → 018 Mireling;
- 032 Ogre stone thrower → 021 Ogre;
- 033 Orc axe thrower → 022 Orc;
- 034 Ash-beast cinder spitter → 024 Ash beast.

Their ranged identity lives in runtime aiming/projectile behavior.

Reed-beast spitter 031 remains a separate image because the renderer does add a visible hybrid-specific mouth/projection cue. Goblin slinger 028 and Skeleton bow 029 also visibly change static equipment.

### Dreadmaw

Dreadmaw is mechanically named and distinct, but the current renderer has no `cindermaw` branch in `captainFinish`. Its static body is the ordinary Ash-beast body at captain scale plus procedural captain treatment. Entry 049 therefore aliases 024. A unique Dreadmaw image would currently invent canon.

### Side-interior entrance

The five occupied side-interior entrances are `kind:'dungeon'` and fall through to the default `gate()` renderer. Prompt 131 now correctly describes that triangular-roof masonry gate. It no longer confuses the side-interior gate with the separate `kind:'mini'` field-compound marker.

The actual field-compound marker is prompt 162.

### Missing interactables

The audit added static prompts for:

- Citadel preparation fountain 161;
- field-boss compound marker 162;
- Dark Lord Tribute cache 163;
- Treasury quest cache 164;
- open specialist cage 170;
- ten closed specialist cages 171–180.

This prevents progression-critical interactables from being forgotten while characters/buildings are upgraded.

### Missing named landmarks

The audit added renderer-faithful prompts for the Woodland cache, wagon/convoy, Ravine overlook, Stonecross ore vein and Dark Crown crystal shelf.

Names do not override drawings. Drowned Watchhouse remains the actual timber watch marker in prompt 084; Old Signal Keep remains the actual rock-and-banner lookout marker in prompt 085.

### Settlement services

The initial roster omitted the four purpose-specific town service structures. The final catalog includes all five regional versions of:

- Quest board;
- Supplier;
- Town Captain / recruiter post;
- Refuge / rest house.

These are prompts 111–130.

### Static furnishings

The second pass promoted additional static, identity-bearing dungeon/settlement/stronghold objects where raster detail genuinely helps: coffins, shelves, cages, display armor, braziers, bedrolls, stolen goods, bone piles, regional tax posts/lean-tos, regional kitchens/bunks/ritual tables and other authored furnishings.

Repeated ground geometry and seeded nature remain procedural where raster replacement would reduce variation or make world geometry less faithful.

## Procedural decisions

The following remain procedural by design:

- terrain planes and biome ground;
- roads, rivers, ponds, lava and crossings;
- collision walls, fences, stockades, palisades, boardwalks and pillars;
- shadows;
- night lighting and atmosphere;
- TRUE/Ringleader/Frenzy overlays;
- health bars, labels, targeting and UI;
- attack warnings and trap warnings;
- moving projectiles/thrown weapons;
- hit/heal/mana/swing/Guard and other timed VFX;
- seeded small-scale vegetation and terrain dressing;
- region-sensitive repeated props where a single sprite would flatten canonical material variation.

The detailed case-by-case proof is in `GRAPHICS_CANON_SPRITE_COVERAGE.md`.

## Barracks states

The sprite registry supports construction/basic/full keys, but the current renderer does not define a separate Full-Barracks completed body. Phase 2A therefore generates the canonical completed regional Barracks body only. Construction stays procedural. Full may later alias the completed body during implementation unless canon first gains a distinct Full visual.

## Guard and elite states

Guard identifiers stay procedural. No guard armor may be invented during generation.

Ringleaders reuse the exact approved underlying species/variant body plus the procedural elite treatment. TRUE bosses reuse the normal approved boss body plus procedural TRUE treatment.

## Final conclusion

The prompt catalog no longer requires image-generation-time art direction. Every renderer family has an explicit destination: GENERATE, ALIAS, or PROCEDURAL.

If a future generation cannot be completed directly from its audited entry, that asset returns to documentation/audit. The image generator does not fill the gap creatively.
