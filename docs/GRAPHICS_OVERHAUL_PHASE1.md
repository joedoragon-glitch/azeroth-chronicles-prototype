# Graphics overhaul — production contract

## Direction

The visual identity is **Warcraft shapes, Ragnarok heart**: original Azeroth Chronicles designs with chunky readable fantasy silhouettes, oversized equipment and strong monster identity, softened by friendly anime-influenced faces and the inviting warmth of classic Korean/Japanese online RPGs. It is modern retro pixel art, not photorealism, grimdark realism or glossy mobile-game 3D. The target is detailed 16/32-bit-era RPG charm at approximately native gameplay resolution.

The current procedural drawings are design blueprints. New artwork is a professional illustrated interpretation of the same design, not a reinvention.

## Phase 2 rendering rules

Phase 2 uses one static sprite per approved visual state. It does not add walk cycles, directional animation, cast frames, death frames or a new animation state machine. Existing movement, lunges, projectile travel, telegraphs, hazards, hit/heal/swing effects, pursuit indicators, TRUE/ringleader effects and night tint remain procedural.

Gameplay geometry is unchanged. Collision, AI, pathfinding, attack reach, world coordinates, depth sorting, spawn positions and saves never come from image bounds.

## Locked production specification

- **View:** single three-quarter front view, body oriented slightly toward screen-right, with a mild elevated camera so the feet/ground contact are visible. Do not generate alternate facings in Phase 2.
- **Master canvas:** work close to the intended gameplay resolution. Heroes and specialists generally use about 96×112 px transparent canvases; ordinary creatures about 72–96 px; bosses about 140–180 px; buildings and entrances about 160–220 px as needed. Avoid giant illustration masters that are later crushed down.
- **Background:** fully transparent. No scenery, horizon, floor patch, frame or text.
- **Shadow:** no baked shadow. The game already draws a procedural ground shadow under entities.
- **Effects:** no baked targeting rings, glows used only to denote TRUE/ringleader state, attack warnings, health bars or UI. Intrinsic material glow on a magical object is allowed if it is part of the object itself.
- **Padding:** keep roughly 8–12% transparent safety margin around the silhouette, with extra headroom for antlers, hats, banners and raised weapons.
- **Anchor:** ground/feet contact is approximately `(0.50, 0.88)`. Horizontal creatures may vary only when manifest tuning proves necessary.
- **Readability:** silhouette and equipment must read at phone scale. Remove micro-detail before increasing display size.
- **Export:** transparent lossless WebP preferred; PNG allowed when edge quality/transparency is better. Canvas smoothing stays disabled for sprite drawing.

Initial logical/native targets are starting points, not immutable art sizes:
- hero: roughly 96×112 px
- companion: roughly 80×100 px
- small ordinary creature: roughly 64–76 px high
- humanoid ordinary enemy: roughly 72–88 px high
- specialist NPC: roughly 80×104 px
- field/dungeon boss: roughly 125–165 px high depending on silhouette
- house/barracks/dungeon entrance: roughly 125–170 px across/ high as composition requires

## Variant safety

A special gameplay silhouette must remain readable. Ranged, hybrid, guard and captain enemies require an exact approved sprite key; otherwise the old procedural renderer remains visible. They never silently inherit a plain melee/base sprite.

TRUE bosses deliberately reuse the normal boss identity plus the existing supernatural TRUE treatment and slight size emphasis. Ringleaders likewise reuse their exact underlying variant plus the procedural elite treatment.

Named captain minibosses are not part of the first vertical slice. Until captain-specific art is approved, all captains stay procedural.

## Phase 2 canary

The first real image is the **Paladin only**. It proves the full path: native-resolution transparent pixel sprite → repository asset → manifest → hosted Pages deployment → service-worker cache → crisp desktop and phone rendering → label/shadow/anchor readability. Only after that canary looks correct do we generate the rest of the vertical slice.

## Phase 2 vertical slice

After the Paladin canary:

1. Mage
2. Ranger
3. Soldier
4. Archer
5. Mira the Village Instructor
6. Borin the Village Smith
7. Goblin melee
8. Skeleton melee
9. Thornfang
10. Greenwood house
11. Greenwood Basic Barracks
12. Greenwood wild tree/vegetation prop
13. Forest Crypt entrance
14. Greenwood ground/road treatment as an art-direction reference only, not yet a sprite replacement

Ranged goblins/skeletons, captains and other role variants remain procedural until specifically converted.

## Acceptance

Every asset is checked at real gameplay zoom on 1280×800 desktop, 375×812 phone and 320×568 phone. If an image harms combat readability, the asset is simplified or resized; mechanics are not changed to accommodate the art.

Only after the complete vertical slice works together in an actual gameplay screenshot is the art direction considered locked for mass production.
