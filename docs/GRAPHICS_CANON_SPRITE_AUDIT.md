# Canon sprite-conversion audit

This audit applies the canonical rule in `GRAPHICS_OVERHAUL_PHASE1.md`: the production procedural visuals are the source of truth, and sprite work is justified only where a static raster asset produces a meaningful visual gain without redesign.

## Priority A — convert first

These families carry persistent identity and currently compress a lot of canonical information into small procedural primitives.

| Family | Why sprites help | Canon that must remain fixed |
| --- | --- | --- |
| Hero Paladin / Mage / Ranger | Faces, armor/clothing material separation, weapons and class silhouette can read more cleanly at phone scale. | Current body proportions, class colors, cape/hood/hat treatment, shield/sword/staff/bow placement and pose. |
| Soldier / Archer companions | Repeated on-screen actors benefit from clearer role/equipment identity. | Existing Paladin/Ranger-derived visual language, scale relationship to hero, shield/sword or bow/quiver placement. |
| Captive/rescued specialists | Each already has regional clothing/tools and is progression-critical. | Current family-specific clothes, hair/headwear, tools, colors and specialist role. |
| Ordinary monster families | Fur/bone/skin/material readability can improve without changing combat silhouettes. | Species anatomy, scale, weapons, ears/horns/limbs and current regional palette. |
| Boss families | Their procedural drawings encode highly specific silhouettes that deserve higher fidelity. | Exact boss anatomy, size relationship, weapons, foliage/bone/armor motifs and current pose language. |
| Dungeon/Treasury/side-interior entrances | Static authored destinations gain strongly from material texture and shape clarity. | Current footprint, roof/gate/opening geometry, region materials and identifying symbols already drawn. |
| Regional houses / workshops / completed barracks | These are major screenshot-defining structures and already have distinct region-specific canon. | Existing massing, raised/stone/patchwork/ash construction, doors, roofs, posts and functional clutter represented in the renderer. |

## Priority B — convert selectively

These can benefit, but only when the result is visibly better than the procedural original at actual play scale.

| Family | Default |
| --- | --- |
| Large authored trees/vegetation | Candidate when a particular tree or vegetation silhouette is distinctive enough to justify an asset. Generic repeated foliage can remain procedural. |
| Creature stronghold props | Convert large identity-bearing tents, nests, hearths, roosts or barracks structures; keep small repeatable clutter procedural unless it clearly benefits. |
| Treasury furnishings | Beds/nests, trophy pieces, warm areas and major furniture can become sprites if they remain exact translations; generic crates/bones/racks need not. |
| Settlement life props | Wells, market stands, gardens, laundry structures and work areas are candidates where a sprite materially improves the lived-in read. |
| Tribute/node visuals | Convert only if the current node needs better material readability; gameplay state and values remain procedural/data-driven. |
| Construction states | Sprite only if every visible construction stage can preserve the current authored progression cleanly. |

## Priority C — remain procedural

The following derive most of their value from runtime geometry, repetition, animation or gameplay state and therefore do not need sprite replacement:

- biome floor planes and large terrain fields;
- roads and road-edge treatment;
- rivers, ponds, water shimmer, lava and channels;
- bridges/crossings whose geometry follows terrain;
- repeated walls, stockades, palisades, fences and pillars;
- actor ground shadows;
- night darkness and local light pools;
- pollen, mist, dust, ash, sparks and other atmosphere;
- attack telegraphs and hazard warning shapes;
- projectiles, thrown/spinning weapons and moving attack objects;
- impacts, melee swings, healing, mana recovery, Guard and timed combat VFX;
- TRUE, ringleader and frenzy overlays;
- health/mana bars, labels, quest punctuation, targeting and UI.

Keeping these procedural is not a temporary compromise. For many of them it is the natural final form because code-driven geometry/animation is more faithful to how they behave.

## Variant requirements

Do not collapse visible gameplay variants during conversion.

- Goblin melee and goblin ranged are separate approvals.
- Skeleton melee and skeleton ranged are separate approvals.
- Hybrid species keep their hybrid weapon/range cues.
- Guardian versions preserve guardian equipment.
- Named captains remain procedural until their exact canonical silhouette is captured.
- Ringleaders reuse the exact approved underlying variant plus procedural elite treatment.
- TRUE bosses reuse the normal approved boss identity plus procedural TRUE treatment unless a future mechanic changes the underlying body itself.

## First production sequence

The first pass should prove the canon-preservation workflow rather than maximize asset count:

1. Paladin
2. Mage
3. Ranger
4. Soldier
5. Archer
6. Mira
7. Borin
8. Goblin melee
9. Skeleton melee
10. Thornfang
11. one Greenwood house
12. Greenwood Basic Barracks
13. Forest Crypt entrance
14. one representative Greenwood tree/vegetation prop

After these coexist coherently in a real gameplay scene, reassess the Priority B categories before expanding further.

## Acceptance evidence

For each candidate, preserve a procedural reference screenshot and compare the sprite at identical gameplay scale. Record any deliberate anchor or display-size adjustment. An asset is approved for what it preserves and clarifies, not for being prettier in isolation.
