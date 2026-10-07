# Phase 2A — Sprite prompt catalog audit

## Final result

`GRAPHICS_CANON_SPRITE_PROMPTS.md` is the authoritative production document for the next sprite-generation phase.

The completed audit contains **231 numbered entries**:

- **221 GENERATE** entries with complete one-at-a-time image-generation prompts;
- **0 ALIAS** entries that reuse an already generated canonical static body;
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

The hero Ranger remains the canonical human Ranger body plus hero-layer polish.

The companion Archer is now deliberately different: an allied goblin scout using goblin anatomy, green scout clothing, hood/cape, bow and quiver, with a simple ally-specific strap, pouch and warm-gold knot. This establishes that an ordinary monster species can also appear as a trusted party member. It no longer borrows the hero Ranger's body or Ranger-specific flask/utility ornaments.

The hostile Raider Archer remains human('archer'), a simpler human ranged enemy, so hero Ranger, companion Archer and hostile Archer are three distinct procedural identities.

### Ranged classes are visual classes

Mireling Spitter, Ogre Stone Thrower, Orc Axe Thrower and Ash-beast Cinder Spitter now have persistent static procedural distinctions in addition to their runtime projectile behavior. Their ranged variants use different palettes, clothing/harnesses and role equipment. Most importantly, the Orc Axe Thrower no longer carries the melee Orc sword; it visibly carries throwing axes.

Reed-beast Spitter, Goblin Slinger and Skeleton Bow already had static ranged cues and remain unchanged in principle.

### Dreadmaw

Dreadmaw's current combat mentor and Treasury master is Cindermaw, but his procedural visual idol is the Dark Lord. This preserves the character's history: before Cindermaw was introduced, the same Crown Treasury captain was named "Dread Lord" and used mentor:'darklord'. Dreadmaw therefore keeps an Ash-beast body with Dark-Lord-inspired obsidian-purple harness/sigil treatment rather than becoming a plain Ash-beast alias or a miniature humanoid Dark Lord.

### Side-interior entrances — v0.8.79 supersession

The earlier shared default-gate diagnosis was correct at the time, but has now been addressed in the procedural renderer. `gate(family)` resolves each occupied side interior through its rules-defined theme. Old Orchard Cellars uses a low cellar arch and steps (131), Drowned Watchhouse a damaged raised timber facade (228), Old Signal Keep a crenellated signal keep (229), Ruined Shrine a broken portico with occupation timber (230), and Ruined Foundry a chimney repair-hall facade (231). All five preserve their exact runtime `dungeon:side-*` keys. Generic exits and field-compound marker 162 remain separate designs.

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

Names do not override drawings. The retained `landmark()` watch/lookout/shrine/foundry bodies remain separately catalogued historical or conditional branches. Active Drowned Watchhouse, Old Signal Keep, Ruined Shrine and Ruined Foundry entrances use their distinct `kind:'dungeon'` bodies and prompts 228–231. Do not substitute the old landmark-marker prompts for these active entrances.

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

The procedural canon now defines three distinct Barracks states. Construction remains a rough regional worksite. Basic Barracks are reasonably sized, cozy field-adventure camps built around a low expedition tent, visible sleeping gear, communal fire and practical equipment. Full Barracks transform the same reserved camp footprint into a richer expedition base with a second sleeping tent, open command canopy/map table, additional bedding/seating, supplies, authority markers and warm camp lighting. Basic and Full use the same footprint by design, so the upgrade cannot outgrow an accepted site. They remain camps rather than shops, houses, forts or oversized military compounds.

The existing 071–075 prompt entries describe the five regional Basic camps. Full Barracks must remain procedural until a later catalog extension gives the five Full camp variants their own one-at-a-time entries; they must not reuse a Basic sprite once sprite activation begins.

## Guard and elite states

Guard identifiers stay procedural. No guard armor may be invented during generation.

Ringleaders reuse the exact approved underlying species/variant body plus the procedural elite treatment. TRUE bosses reuse the normal approved boss body plus procedural TRUE treatment.

## Final conclusion

The prompt catalog no longer requires image-generation-time art direction. Every renderer family has an explicit destination: GENERATE, ALIAS, or PROCEDURAL.

If a future generation cannot be completed directly from its audited entry, that asset returns to documentation/audit. The image generator does not fill the gap creatively.

## V0.8.79 procedural polish reconciliation

Main entrances 051–055, specialists 006–015 and their closed cages 171–180, services 111–130, and affected furnishings have been rewritten against the revised renderer. This is an intentional procedural-canon revision before raster production, not an image-generation redesign. Basic and Full camps, heroes, companions, enemy variants, captains and major bosses retain their established bodies. Construction now progresses through materials, frame, one canvas panel and both panels. The manifest remains empty. The catalog now contains 231 entries: 221 GENERATE, 0 ALIAS and 10 KEEP PROCEDURAL.
