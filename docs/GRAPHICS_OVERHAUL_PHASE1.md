# Graphics Overhaul — Phase 1 Art Direction

## Purpose

Phase 1 establishes the visual language and technical contract for replacing the procedural geometric drawings with static illustrated sprites while leaving gameplay, collision, world coordinates, AI, combat timing, depth sorting and current motion behavior unchanged.

The guiding phrase is **Warcraft shapes, Ragnarok heart**: chunky, highly readable high-fantasy silhouettes and equipment, softened by friendly anime-influenced faces, colorful materials and the inviting feeling of classic Korean/Japanese online RPGs. The result must remain original Azeroth Chronicles art rather than copies of assets or characters from either reference.

## Non-goals

Phase 1 does not add walk cycles, directional animation, cast frames, bespoke death animation or a new animation state machine. Existing movement, lunges, projectile travel, telegraphs, hazards, hit/heal/swing effects, pursuit indicators, night tint, TRUE effects and ringleader effects remain in place.

Phase 1 also does not change collision radii, enemy reach, boss hitboxes, map geometry, pathfinding, spawn locations, AI behavior, quest logic or save data.

## Visual language

- Painted 2D illustration, not pixel art and not photorealism.
- Three-quarter/isometric-compatible presentation.
- Strong silhouette before fine detail.
- Chunky fantasy proportions and slightly exaggerated heads, hands, boots, weapons and armor.
- Friendly anime influence without extreme chibi proportions.
- Saturated but earthy regional palettes.
- Clear material separation: metal, leather, cloth, wood, bone, stone and magic should read at gameplay size.
- Faces should be expressive and approachable on heroes, companions and friendly NPCs.
- Monsters may be threatening, but they should remain visually charming rather than grotesque horror.
- Avoid glossy generic mobile-game 3D rendering, realistic concept-art proportions, grimdark desaturation and excessive micro-detail.

## Faithfulness rule

The current procedural drawings are design blueprints. The new asset should look like the professional illustrated interpretation of the same design, not a reinvention.

Examples:
- Paladin: plate armor, shield, sword, cape and gold sacred accents.
- Mage: blue clothing, pointed hat, staff/crystal and gold accents.
- Ranger: green hood/cloak, bow and quiver.
- Thornfang: oversized woodland wolf, vegetation, roots/branches and antler-like growth.
- Mirejaw: crocodilian swamp creature with dorsal vegetation.
- Ridge Tyrant: huge horned humanoid with heavy asymmetry.
- Ashen Warlord: armored orcish commander with oversized martial equipment.
- Dark Lord: dark armor, purple influence, crown/horns, sword and shield.

## Sprite contract

- Transparent background.
- Character feet/ground contact anchored at approximately `(0.50, 0.88)`.
- Keep generous transparent room above tall hats, antlers, horns, banners and weapons.
- The ground anchor, not the visible image rectangle, is the gameplay position.
- Collision remains engine-defined and is never inferred from sprite bounds.
- Health plates and labels use manifest `labelHeight` rather than collision geometry.
- TRUE and ringleader identities are primarily procedural overlays on the base art. Do not create a completely unrelated TRUE character.
- For ordinary enemy variants, use a dedicated variant sprite only when equipment materially changes silhouette (for example ranged vs melee); otherwise reuse the base art.

## Relative visual scale

These are art-direction targets, not collision sizes:
- Hero: 1.00
- Companion: 0.95
- Small ordinary creature: 0.75–0.90
- Human/orc ordinary enemy: 0.90–1.05
- Ogre/large ordinary creature: 1.20–1.35
- Ringleader: base creature plus existing elite overlay; modest visual emphasis only
- Field/dungeon boss: roughly 1.55–2.00 relative to a hero
- TRUE boss: same base identity with existing supernatural overlay and slight visual emphasis

## Phase 1 vertical slice

The first approved art set should be intentionally small:

1. Paladin
2. Mage
3. Ranger
4. Soldier
5. Archer
6. Mira / Thorn specialist
7. Goblin
8. Skeleton
9. Thornfang
10. One Greenwood house
11. One Greenwood barracks
12. One Greenwood wild tree/vegetation prop
13. Crypt entrance
14. A small Greenwood ground/road treatment reference

The purpose is to prove that the style works together in an actual gameplay screenshot before generating the full roster.

## Asset workflow

1. Start from the current procedural design and this art contract.
2. Generate several concept candidates at higher resolution than final gameplay display.
3. Select one canonical design; consistency matters more than novelty.
4. Remove background cleanly and preserve soft edge antialiasing.
5. Crop to a standardized transparent canvas with the ground anchor intact.
6. Export WebP when transparency/quality is acceptable; use PNG where it is not.
7. Add the asset to `assets/sprites/` and register it in `manifest.json`.
8. Verify at real gameplay zoom on desktop and phone.
9. If the asset reduces combat readability, simplify it rather than enlarging it.
10. Only after the vertical slice is approved should the rest of the asset families be generated.

## Rendering safety

The application attempts the illustrated sprite first. If the asset is absent, still loading or failed to decode, the existing procedural renderer draws the entity instead. This makes the overhaul incremental and keeps partially converted builds playable.

The hosted/PWA build is the only supported game target. Its service worker caches the sprite manifest and referenced files for offline use after the first connected load.
