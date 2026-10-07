# Graphics overhaul — canonical sprite production contract

## Governing rule

The current production procedural visuals are **canon**.

The sprite overhaul does not reinterpret, redesign, restyle, modernize, or replace that canon with a new artistic language. Its purpose is narrower and stricter: where a raster sprite materially improves clarity, finish, texture, or small-scale readability, the sprite is the natural higher-fidelity version of the visual already authored by the procedural renderer.

A successful sprite should make the player think **"that is the same thing, now rendered at the next level"**, not **"that character or place has been redesigned."**

Previous style slogans, outside-game aesthetic references, and experimental sprite assets are not authoritative. They may be useful production history, but they cannot override the current procedural design.

## Canon source order

When producing or reviewing a sprite, use this authority order:

1. **Current production `src/prototype/visuals.js` rendering** — silhouette, proportions, pose, equipment placement, palette, material cues, anatomy, architecture and identifying motifs.
2. **Current authored data/rules** — names, roles, species, regional identity, equipment/function and gameplay variants that clarify what the renderer represents.
3. **Current gameplay presentation** — actual on-screen scale, ground relationship, labels, effects, collision-independent positioning and surrounding environment.
4. **Older sprite experiments or concept work** — reference only. If they conflict with the current procedural visual, the procedural visual wins.

No sprite may establish new canon by accident.

## What "higher fidelity" allows

A sprite may add finish that is naturally implied by the canonical drawing:

- cleaner edges and deliberate pixel/raster clusters;
- material shading for metal, cloth, wood, bone, fur, stone and foliage already present;
- folds, seams, bevels, grain, fur breakup and similar surface information;
- facial readability where the procedural figure already establishes a face/head;
- clearer separation between overlapping canonical equipment;
- modest lighting and value structure that preserves the original palette relationships;
- enough local detail to keep the same silhouette readable at gameplay size.

A sprite may **not** invent:

- new armor pieces, weapons, clothing layers or props;
- new horns, antlers, banners, trophies, symbols or magical effects;
- new anatomy or changed creature species cues;
- a different body build, pose language or character age;
- new faction colors or a substantially different palette;
- architecture not represented by the canonical structure;
- decorative lore that was not already expressed by the renderer or authored world data;
- a new visual genre or external-game imitation.

If a desired improvement requires redesigning the underlying thing, it is not part of this sprite overhaul.

## Selective conversion rule

Sprites are not mandatory for every drawn object.

Convert an existing visual only when a static raster asset produces a real benefit over the current procedural form without sacrificing gameplay readability, scale flexibility, animation behavior, or geographic coherence.

The procedural renderer remains a first-class canonical renderer, not an embarrassing fallback to be deleted as quickly as possible.

### Strong sprite candidates

These are visually identity-heavy and gain the most from additional finish:

- hero classes;
- Soldier and Archer companions;
- captive/rescued specialists;
- ordinary monster families and their exact ranged/hybrid/guard variants;
- field, dungeon and final bosses;
- named captain/miniboss identities once their exact canonical variant is documented;
- major settlement buildings with distinctive regional designs;
- completed barracks and construction states when a sprite can preserve the authored regional structure;
- dungeon/Treasury/side-interior entrances;
- large or distinctive authored creature-home/stronghold structures and selected landmark props.

### Usually remain procedural

These already benefit from geometry, repetition, animation or runtime state:

- terrain planes and biome ground;
- roads, rivers, water, lava and crossings;
- collision walls, fences, palisades and repeated structural segments;
- ground shadows;
- night lighting and atmosphere;
- TRUE/ringleader/frenzy state treatments;
- targeting rings, health bars, labels and UI;
- attack telegraphs;
- projectiles and moving attack objects;
- hit, heal, mana, swing, Guard and other timed combat VFX;
- hazards and trap warnings;
- other effects whose value comes primarily from runtime animation rather than static detail.

This list is a production default, not a permanent prohibition. A later asset may be promoted to sprites only after showing a concrete visual benefit while remaining canon-faithful.

## Rendering rules

Phase 2 uses one static sprite per approved canonical visual state. It does not add walk cycles, directional animation, cast frames, death frames or a new animation state machine. Existing movement, lunges, projectile travel, telegraphs, hazards, hit/heal/swing effects, pursuit indicators, TRUE/ringleader effects, shadows and night treatment remain procedural.

Gameplay geometry is unchanged. Collision, AI, pathfinding, attack reach, world coordinates, depth sorting, spawn positions and saves never come from image bounds.

## Production specification

- **Pose/view:** match the current procedural presentation for that asset. Do not impose a universal new pose when the canon already communicates something different.
- **Scale:** establish the sprite at the same apparent gameplay scale as the procedural version before adding detail.
- **Canvas:** work close to intended gameplay resolution. Avoid giant illustration masters that are later crushed down.
- **Background:** fully transparent. No scenery, horizon, floor patch, frame or text.
- **Shadow:** no baked shadow. The game already renders canonical procedural grounding shadows.
- **Effects:** do not bake TRUE/ringleader state, target rings, warnings, health bars, labels or transient combat effects into the sprite.
- **Padding:** enough transparent margin to avoid clipping canonical weapons, hats, horns, antlers, banners or other existing protrusions; do not create new protrusions just to fill space.
- **Anchor:** tune the ground anchor to reproduce the existing character-to-shadow relationship. The default remains near `(0.50, 0.88)`, but visual matching takes priority over forcing every silhouette to the same fraction.
- **Readability:** preserve the canonical silhouette at phone scale. Remove non-canonical micro-detail before increasing display size.
- **Export:** transparent lossless WebP or PNG. Canvas smoothing remains disabled for sprite drawing.

## Variant safety

A gameplay-significant variant must receive its own approved canonical sprite key.

Ranged, hybrid, guard and captain enemies never silently inherit a plain melee/base sprite. Until the exact variant has a faithful sprite, the canonical procedural drawing remains visible.

TRUE bosses deliberately reuse their normal canonical identity plus the procedural TRUE treatment unless the underlying normal sprite itself changes. Ringleaders likewise reuse their exact underlying variant plus the procedural elite treatment.

## Approval test

Every proposed sprite must pass a side-by-side comparison against the current procedural version at real gameplay size.

Review, in order:

1. same recognizable silhouette;
2. same apparent body/structure proportions;
3. same pose and ground relationship;
4. same equipment/feature placement;
5. same dominant and secondary color relationships;
6. same species/class/building identity;
7. no invented lore-bearing details;
8. improved readability or material finish at 1280×800, 375×812 and 320×568.

If the new sprite is attractive but fails those checks, it is rejected.

## Phase 2 restart

The previous Paladin canary is not automatically restored. It predates this stricter canon rule and must be judged against the current procedural Paladin like any new candidate.

The restart sequence is:

1. capture/reference the current procedural Paladin at representative gameplay scale;
2. produce a canon-faithful Paladin sprite from that exact design;
3. validate silhouette, proportions, palette, equipment placement, ground/shadow relationship and phone readability;
4. register it only after approval;
5. then repeat for the next high-value canonical sprite candidates.

Mass production does not begin until several assets prove that the pipeline preserves canon consistently.
