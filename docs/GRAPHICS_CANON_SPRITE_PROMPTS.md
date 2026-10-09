# Phase 2A — Canon Sprite Image-Generation Prompt Catalog (AUDITED)

<!-- SPRITE_TOTALS {"entries":296,"generate":280,"alias":0,"procedural":16} -->

## Purpose

**Audit status: COMPLETE.** This document has been checked back against the current production renderer and rules after the initial 110-entry draft, including a second pass over every top-level render branch. Entries marked **KEEP PROCEDURAL** are intentionally not image-generation tasks.

This document is the production source for the next image-generation phase. It does **not** activate any sprite in the game. Each asset is generated **one at a time and one alone**, using its own entry below. The current procedural renderer is canon.

## Audit status — authoritative for generation

This catalog has completed its Phase 2A documentation audit. The next image-generation phase must obey the per-entry status:

- **GENERATE:** entries containing an **Image-generation prompt**. Generate exactly one image for that entry.
- **ALIAS:** reuse the named existing asset; do not generate a second image.
- **KEEP PROCEDURAL:** do not generate a sprite; the current renderer remains the final visual for that item.

The audited catalog contains **296 numbered entries**: **280 GENERATE**, **0 ALIAS**, and **16 numbered KEEP PROCEDURAL**. Broad procedural systems that do not need individual numbered entries are exhaustively classified in `GRAPHICS_CANON_SPRITE_COVERAGE.md`. Do not add visual details from memory, older concept sheets, or prior generated images. If an entry still lacks enough information, stop on that entry rather than improvising.

The v0.8.79 procedural polish pass revises entrances, specialist clothing, regional services and selected furnishings. Entry 131 now covers Old Orchard Cellars alone; entries 228–231 cover the other four occupied side interiors. Existing IDs are preserved. See `GRAPHICS_PROCEDURAL_POLISH_V0879.md` for the scope and retained procedural families.

## Mandatory base prompt

Use this text at the beginning of every asset prompt, followed by that asset's specific prompt:

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale.

## Intended design and material-appropriate shape · 8 October 2026

Joel clarified that procedural primitives can create accidental anatomy and blocky forms. This applies to every candidate, including props, buildings, terrain and scenery. Preserve the intended identity, functional structure, proportions, palette, equipment and major silhouette; refine contours and joins to suit the actual material. Organic body parts, leaves, flowers, branches and natural rock can have natural contours. Curved manufactured parts can gain their intended curves. Hard edges remain appropriate for armor, quarried blocks, timber joints or machinery when those are the design. A coarse polygon is a reference for meaning, not a requirement to reproduce awkward geometry literally. This clarification governs the base and per-entry prompts below; include it in every actual generation request. It authorizes faithful shape refinement, not new species, loadouts, symbols, lore or changes to gameplay geometry. Review at native size against intended design and current scene context.

## Workflow lock

- Generate exactly one sprite per request.
- Never generate sheets, comparisons, multiple options, turnarounds, scenes, or old/new boards.
- Never fabricate a visual reference. The procedural renderer and this audited document are the references.
- Do not move to another asset until the current generation is complete.
- This is an open inventory. Reconcile current renderer/map additions before their production; the total is not a ceiling.
- Capture the current exact body and scene context; remove procedural grounding shadows from generation references, retain them in gameplay comparisons.
- Check native-size facial readability, apparent silhouette, placement and alpha margins before publication.
- Joel's accepted Goblin direction is a playful asymmetrical half-smile, a small ivory tooth/sliver at one lower mouth corner, a separate small nose, and organic pointed ears with natural joins/folds. Preserve that intention rather than a robotic polygon or a face-wide triangle.
- Candidate assets remain outside the live sprite manifest until Phase 2B audit approval.
- Only entries containing **Image-generation prompt** are generated. Entries marked **KEEP PROCEDURAL** are skipped.

## A. Heroes and companions

### 001 — Hero — Paladin

**Canonical cues:** Compact humanoid hero. Muted blue-gray armored body; steel helmet, chest plate and shoulder plates; blue shield on screen-left; sword on screen-right; brown cape; gold vertical chest mark with short crossbar and gold shield accent. Narrow stance.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Paladin exactly as described. Keep shield left, sword right, compact proportions, restrained steel highlights, brown cape and small gold holy markings. No tabard, halo, wings, extra armor, oversized cross, glowing sword or new heraldry.

### 002 — Hero — Mage

**Canonical cues:** Compact humanoid hero. Blue clothing; large pointed blue hat; dark blue cape; long staff on screen-right with a cyan crystal/orb; small gold waist/chest accent; simple face visible beneath hat. Narrow stance.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Mage exactly as described. Preserve the tall pointed blue hat, blue robe/body, dark cape, right-side wooden staff with cyan crystal, small gold accents and compact proportions. Do not add belts, spellbooks, floating magic, extra gems, shoulder armor or new robe symbols.

### 003 — Hero — Ranger

**Canonical cues:** Compact hooded humanoid. Green clothing and dark green cape; bow on screen-right; quiver on screen-left/back with visible arrows; small gold accent. The canonical human('ranger') body also carries a small teal flask/pouch on screen-left and a small pale-green/gold hand/utility accent on screen-right. The hero layer adds simple facial marks, extra strap/quiver definition and restrained pale-green highlights.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ranger exactly as described. Preserve green hood, green body/cloak, right-side bow, left/back quiver and arrows, the small teal left-side flask/pouch, the small pale-green/gold utility accent, compact proportions and restrained gold detail. Do not add daggers, leather-armor redesign, animal motifs, magical arrows, new pouches or equipment not listed.

### 004 — Companion — Soldier

**Canonical cues:** Compact armored humanoid derived from the non-Paladin armored human: muted blue-gray body, steel helmet/chest/shoulders, green-gray shield on screen-left, sword on screen-right, small crest point and crossed strap marks; no hero cape or Paladin gold cross.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Soldier exactly as described. Keep the same compact armored silhouette, shield left and sword right. It must read as a simpler military companion than the Paladin. No cape, holy cross, ornate heraldry, oversized armor or extra weapons.

### 005 — Companion — Archer / Ranger support

**Canonical cues:** Compact allied goblin scout: semi-human goblin proportions, olive-green goblin skin, long pointed ears and a small goblin facial/nose silhouette. Muted green scout clothing with a darker green hood/cape. Bow on screen-right and quiver/arrows on screen-left/back preserve the established Archer companion role. A diagonal travel strap, small brown side pouch and restrained warm-gold ally knot distinguish the companion from hostile goblins. It does not use the hero Ranger's teal flask/pouch or pale-green utility ornament. Organic pointed ears with natural folds/joins; playful half-smile with a small ivory corner-tooth/sliver and separate narrow nose. Refine procedural shape artifacts rather than copying robotic ear panels.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the companion Archer as the allied goblin scout defined by the procedural renderer: compact goblin-derived semi-human body, olive skin, long ears, muted green scout clothing, darker green hood/cape, bow on screen-right, quiver on screen-left/back, diagonal travel strap, small brown pouch and restrained warm-gold ally knot. It must read as a friendly party member while remaining unmistakably goblin. Do not copy the human Ranger face/body, do not add the Ranger's teal flask or pale-green utility ornament, and do not turn it into the hostile Goblin Slinger or human Raider Archer.

### 006 — Mira — Greenwood instructor

**Canonical cues:** Humanoid specialist. Olive-green cloth, dark green cape, brown hair/head covering with pale-gold trim. Tall staff on screen-right topped by a pale green diamond/leaf-like head. Rectangular pale tan item or satchel on screen-left. Teacher trim lines on torso. Screen-left olive shoulder wrap with a pale stitched edge; the existing tan rectangular item remains partly visible beneath it.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Mira — Greenwood instructor. Humanoid specialist. Olive-green cloth, dark green cape, brown hair/head covering with pale-gold trim. Tall staff on screen-right topped by a pale green diamond/leaf-like head. Rectangular pale tan item or satchel on screen-left. Teacher trim lines on torso. Screen-left olive shoulder wrap with a pale stitched edge; the existing tan rectangular item remains partly visible beneath it. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 007 — Borin — village smith

**Canonical cues:** Humanoid specialist. Brown/earth clothing and dark gray-brown cape. Dark hair/head band. Heavy dark apron/chest block with brown inset. Long-handled smith hammer on screen-right with steel rectangular head. Asymmetric longer leather apron, angled pale seam and small rectangular pocket toward screen-left. The inset remains partly visible beneath the apron.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Borin — village smith. Humanoid specialist. Brown/earth clothing and dark gray-brown cape. Dark hair/head band. Heavy dark apron/chest block with brown inset. Long-handled smith hammer on screen-right with steel rectangular head. Asymmetric longer leather apron, angled pale seam and small rectangular pocket toward screen-left. The inset remains partly visible beneath the apron. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 008 — Sela — Marches instructor

**Canonical cues:** Humanoid specialist. Teal cloth, dark teal cape, dark hair. Pointed hood/hat shape in cape color with pale trim. Tall staff on screen-right topped by a round teal orb/disc. Broad pale-teal screen-left shoulder wrap, diagonal pale strap and a short teal front panel below the belt.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Sela — Marches instructor. Humanoid specialist. Teal cloth, dark teal cape, dark hair. Pointed hood/hat shape in cape color with pale trim. Tall staff on screen-right topped by a round teal orb/disc. Broad pale-teal screen-left shoulder wrap, diagonal pale strap and a short teal front panel below the belt. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 009 — Neri — alchemist

**Canonical cues:** Humanoid specialist. Slate blue-gray cloth, dark blue-gray cape, brown hair under a flat dark headband/cap. Rectangular brown satchel/item on screen-left. Blue-green flask on screen-right with small pale trim/metal neck. Two small colored alchemy vials on torso. Pale gray-green work apron with a dark horizontal upper seam and three small colored vials in lower apron loops, in addition to the two round torso accents.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Neri — alchemist. Humanoid specialist. Slate blue-gray cloth, dark blue-gray cape, brown hair under a flat dark headband/cap. Rectangular brown satchel/item on screen-left. Blue-green flask on screen-right with small pale trim/metal neck. Two small colored alchemy vials on torso. Pale gray-green work apron with a dark horizontal upper seam and three small colored vials in lower apron loops, in addition to the two round torso accents. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 010 — Orin — Highland instructor

**Canonical cues:** Humanoid specialist. Earthy olive/tan cloth, muted green-gray cape, dark brown hair. Squared dark cap/hood with pale-gold trim. Pale gray shoulder/chest mantle. Tall staff on screen-right with pale stone/metal triangular head. Broad gray-green shoulder mantle with a scalloped/fringed lower outline and pale vertical seam marks.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Orin — Highland instructor. Humanoid specialist. Earthy olive/tan cloth, muted green-gray cape, dark brown hair. Squared dark cap/hood with pale-gold trim. Pale gray shoulder/chest mantle. Tall staff on screen-right with pale stone/metal triangular head. Broad gray-green shoulder mantle with a scalloped/fringed lower outline and pale vertical seam marks. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 011 — Dara — Highland smith

**Canonical cues:** Humanoid specialist. Gray-olive cloth and dark gray-green cape. Dark apron/chest block with brown inset. Pale steel headband/helmet strip. Long-handled smith hammer on screen-right with steel rectangular head. Angular pale-gray screen-left shoulder guard and a broad segmented lower apron pocket with two pale dividers.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Dara — Highland smith. Humanoid specialist. Gray-olive cloth and dark gray-green cape. Dark apron/chest block with brown inset. Pale steel headband/helmet strip. Long-handled smith hammer on screen-right with steel rectangular head. Angular pale-gray screen-left shoulder guard and a broad segmented lower apron pocket with two pale dividers. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 012 — Lyss — advanced instructor

**Canonical cues:** Humanoid specialist. Muted red-brown cloth, dark burgundy cape, dark hair. Dark angular helmet/cap. Steel shoulder plates. Tall staff/pole on screen-right topped by a pale-gold diamond/banner-like head. Diagonal gold-tan teaching sash and two uneven red-brown split coat tails that expose the middle of the lower body.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Lyss — advanced instructor. Humanoid specialist. Muted red-brown cloth, dark burgundy cape, dark hair. Dark angular helmet/cap. Steel shoulder plates. Tall staff/pole on screen-right topped by a pale-gold diamond/banner-like head. Diagonal gold-tan teaching sash and two uneven red-brown split coat tails that expose the middle of the lower body. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 013 — Eren — runewright

**Canonical cues:** Humanoid specialist. Muted violet-gray cloth, dark purple cape, gray-violet hair/head shape. Dark angular cap/hood. Brown-violet rectangular satchel/item on screen-left. Tall staff on screen-right with a large purple diamond-shaped head and pale inner line. Asymmetric violet work apron with a pale diagonal seam and a flat pale-purple diamond inset; pale side seam at screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Eren — runewright. Humanoid specialist. Muted violet-gray cloth, dark purple cape, gray-violet hair/head shape. Dark angular cap/hood. Brown-violet rectangular satchel/item on screen-left. Tall staff on screen-right with a large purple diamond-shaped head and pale inner line. Asymmetric violet work apron with a pale diagonal seam and a flat pale-purple diamond inset; pale side seam at screen-right. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 014 — Vera — master smith

**Canonical cues:** Humanoid specialist. Warm brown/tan cloth, dark brown-gray cape, pale blond/white hair. Heavy brown apron/chest block with tan inset and pale trim. Long-handled hammer on screen-right with a broad pale steel rectangular head. Broad pale-metal screen-left shoulder guard, asymmetric dark leather screen-right apron panel and one pale lower apron seam.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Vera — master smith. Humanoid specialist. Warm brown/tan cloth, dark brown-gray cape, pale blond/white hair. Heavy brown apron/chest block with tan inset and pale trim. Long-handled hammer on screen-right with a broad pale steel rectangular head. Broad pale-metal screen-left shoulder guard, asymmetric dark leather screen-right apron panel and one pale lower apron seam. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 015 — Tovan — final instructor

**Canonical cues:** Humanoid specialist. Cool gray-blue cloth, dark slate cape, pale gray hair. Tall angular pale headpiece/hood with gold trim. Long staff on screen-right with a round gold head. Gold diamond chest mark. Long pale blue-gray split front robe panels with gold vertical edges. Keep the existing chest mark and tall staff.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Tovan — final instructor. Humanoid specialist. Cool gray-blue cloth, dark slate cape, pale gray hair. Tall angular pale headpiece/hood with gold trim. Long staff on screen-right with a round gold head. Gold diamond chest mark. Long pale blue-gray split front robe panels with gold vertical edges. Keep the existing chest mark and tall staff. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

## C. Ordinary and night creatures

### 016 — Goblin melee

**Canonical cues:** Small humanoid enemy, about 0.8 normal human bulk. Brown clothing, muted yellow-green skin, very large pointed ears, small angular nose and separate simple mouth (no wide pale triangular grin), dark belt/waist details, short sword on screen-right. Organic pointed ears with natural folds/joins; playful half-smile with a small ivory corner-tooth/sliver and separate narrow nose. Refine procedural shape artifacts rather than copying robotic ear panels.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the melee Goblin exactly as described. Keep the small body, huge pointed ears, brown clothes, yellow-green skin and short right-side sword. No helmet, shield, backpack, armor set or new tribal decorations.

### 017 — Skeleton melee

**Canonical cues:** Small exposed bone skeleton with skull, rib cage, thin bone arms and legs, short sword on screen-right. Warm ivory bone color with dark outlines.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the melee Skeleton exactly as described. Preserve exposed bones, compact skull/rib silhouette and right-side sword. No armor, cloak, shield, glowing eyes, necromantic aura or extra bones.

### 018 — Mireling melee

**Canonical cues:** Low horizontal crocodilian creature: long tail to screen-left, oval body, long toothy snout to screen-right, four low legs, dark green dorsal spikes, olive-green body.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Mireling exactly as described. Preserve long low crocodilian proportions, tail left, snout right, four legs, dark dorsal spikes and olive-green palette. No horns, fins, saddle, armor or amphibian redesign.

### 019 — Reed beast base

**Canonical cues:** Squat frog-like creature with broad round green body, two large raised eyes, wide simple mouth, broad side limbs/feet, olive and marsh-green palette.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Reed beast exactly as described. Preserve the round frog-like body, two large eyes, wide mouth and broad side limbs. No reptile scales, horns, armor, weapons or extra anatomy.

### 020 — Wolf

**Canonical cues:** Low gray wolf in side-facing game silhouette: long body, tail extending screen-left, four legs, head to screen-right, pointed ears and muzzle; cool gray coat with slightly lighter markings.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Wolf exactly as described. Preserve the side-on body, tail left, head right, four-leg proportions, pointed ears and gray palette. No antlers, armor, collar or foliage; those belong to other identities.

### 021 — Ogre melee

**Canonical cues:** Very bulky humanoid, about 1.5 human bulk. Muted tan/olive skin, minimal dark brown waist belt, small paired tusk/horn marks around face, heavy wooden club/maul held on screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ogre exactly as described. Preserve the oversized bulky humanoid proportions, muted tan/olive skin, simple waist band and heavy right-side wooden weapon. No armor suit, helmet, tattoos, extra horns or new clothing.

### 022 — Orc melee

**Canonical cues:** Broad humanoid enemy, slightly larger than human. Muted olive-green skin, brown-olive clothing, steel shoulder plates, short sword on screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the melee Orc exactly as described. Preserve olive skin, modest steel shoulder plates, brown-olive body and right-side sword. No large warlord armor, banner, helmet, axe, shield or extra trophies.

### 023 — Raider Archer

**Canonical cues:** Compact hooded humanoid enemy rendered with `human('archer')`, not the Ranger body. Darker green clothing, dark green hood and cape, bow on screen-right, quiver on screen-left/back with visible arrows. It does **not** have the Ranger-specific teal flask/pouch or pale-green/gold utility accent.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Raider Archer exactly from the canonical human('archer') body: compact darker-green hooded archer, bow on screen-right and quiver with arrows on screen-left/back. Keep it visibly simpler than the Ranger hero and companion Ranger-support body. Do not add the Ranger teal flask/pouch, utility accent, daggers, armor, mask, banner or new equipment.

### 024 — Ash beast base

**Canonical cues:** Low many-legged ash creature. Oval burnt orange-brown body, multiple thin lateral legs, two larger raised forelimb/pincer shapes, curled segmented tail sweeping to screen-left/back, one pale bone-colored horn/spine near the tail/body.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ash beast exactly as described. Preserve the low oval body, many lateral legs, raised forelimbs, curled tail and burnt orange-brown palette. No lava cracks, giant scorpion stinger, wings, armor or extra horns.

### 025 — Crown soldier

**Canonical cues:** Compact Crown melee humanoid: muted violet cloth (#62566e), gray steel head/chest (#939fa7), angular maroon-purple Crown helmet, maroon shield on screen-left, sword on screen-right, restrained pale-gold visor/chest marks and current diagonal uniform seam. It is not the blue-gray allied Soldier body.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Crown soldier exactly as described. Preserve violet uniform, gray steel head/chest, angular maroon-purple Crown helmet, maroon left shield, right sword and restrained pale-gold visor/chest marks. No Dark Lord crown, cape, glowing eyes or extra black armor.

### 026 — Wraith

**Canonical cues:** Floating tapered spectral figure, desaturated blue-green body, dark face opening with two pale eyes, lower body splits into pointed spectral tails. Carries a small lantern on screen-right attached by a short arm/handle.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Wraith exactly as described. Preserve the tapered ghost silhouette, blue-green palette, dark face with two eyes and small right-side lantern. No hood redesign, chains, scythe, robes, mist cloud or aura outside the body.

### 027 — Ash stalker

**Canonical cues:** Floating tapered spectral figure using the same body geometry as Wraith but muted red-purple/brown coloration. Dark face opening with two pale eyes. No lantern.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ash stalker exactly as described. Preserve the Wraith-like tapered spectral silhouette, reddish-purple palette and dark face. Do not add a lantern, claws, horns, wings, smoke trail or new anatomy.

### 028 — Goblin slinger

**Canonical cues:** Same small Goblin body, ears, colors and proportions as melee Goblin, but its ranged canonical drawing replaces the sword emphasis with a simple sling/throwing line and stone on screen-right plus a small brown pouch/block on screen-left. Organic pointed ears with natural folds/joins; playful half-smile with a small ivory corner-tooth/sliver and separate narrow nose. Refine procedural shape artifacts rather than copying robotic ear panels.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Goblin slinger exactly as described. It must remain the same Goblin body. Preserve the simple right-side sling/stone cue and small left-side pouch. Do not invent a bow, spear, armor or elaborate sling rig.

### 029 — Skeleton bow variant

**Canonical cues:** Same exposed Skeleton body and bone proportions as melee Skeleton, but bow on screen-right instead of sword.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Skeleton bow variant exactly as described. Preserve the same skeleton body and ivory bone palette; replace the sword only with the existing simple right-side bow. No quiver unless it is already required by the canonical silhouette, no armor or cloak.

### 030 — Mireling spitter hybrid

**Canonical cues:** Same low crocodilian species silhouette as the melee Mireling, but a distinct ranged class body. Slightly darker muted green hide and warmer amber markings. A woven reed/leather harness crosses the torso, with a small side pouch and a visible mouth/spit-projection fitting at the snout. Dark dorsal spikes remain.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Mireling Spitter exactly as the ranged procedural class: preserve the low crocodilian Mireling anatomy, tail left, snout right, four low legs and dorsal spikes, but use the darker muted-green ranged palette, amber markings, crossed reed/leather harness, small side pouch and visible snout/spit-projection cue. Do not add humanoid armor, a saddle, horns, fins or projectile effects.

### 031 — Reed-beast spitter hybrid

**Canonical cues:** Same Reed beast body as asset 019, plus the canonical hybrid mouth cue: a small darker mouth/central oval and a short pale projecting spit/tongue line toward screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Reed-beast spitter exactly as described. Preserve the base frog-like body and add only the small canonical mouth/projection cue. No sacs, glands, horns, weapon or dramatic tongue.

### 032 — Ogre stone-thrower hybrid

**Canonical cues:** Same very bulky Ogre species and paired facial tusk marks, but a distinct ranged class. Gray-olive/brown clothing rather than the melee Ogre's warmer body treatment, an asymmetric shoulder wrap, diagonal throwing strap, and a large stone satchel on screen-left with visible stones. A simple throwing sling/stone tool is carried on screen-right. No melee club.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ogre Stone Thrower exactly as the ranged procedural class. Preserve the very bulky Ogre proportions, muted tan/olive skin and paired facial tusk marks, but use the gray-olive/brown ranged clothing, asymmetric shoulder wrap, diagonal throwing strap, stone satchel on screen-left with visible stones, and the simple throwing sling/stone tool on screen-right. Do not give it the melee Ogre's heavy wooden club, armor suit, helmet, tattoos or extra horns.

### 033 — Orc axe-thrower hybrid

**Canonical cues:** Same broad olive-skinned Orc species, but a distinct ranged class. Rust-brown clothing replaces the melee Orc's brown-olive outfit. Shoulder protection is lighter and asymmetric rather than the melee steel pair. A diagonal throwing harness and small side pouch cross the body. Two compact throwing axes are carried on screen-right/back. No sword.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Orc Axe Thrower exactly as the ranged procedural class. Preserve the broad Orc proportions and olive-green skin, but use rust-brown clothing, lighter asymmetric shoulder pads, diagonal throwing harness, small side pouch and two compact throwing axes carried on screen-right/back. The ranged Orc must not carry the melee Orc's sword and must not resemble the armored Ashen Warlord.

### 034 — Ash-beast cinder-spitter hybrid

**Canonical cues:** Same low many-legged Ash-beast anatomy, raised forelimbs and curled tail, but a distinct ranged class. Darker red-brown/purple carapace replaces the ordinary burnt-orange body. Additional dorsal cinder plates and two visible cinder sacs/vents carry restrained warm orange highlights.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ash-beast Cinder Spitter exactly as the ranged procedural class. Preserve the low many-legged Ash-beast silhouette, raised forelimbs, curled tail and pale tail/body spine, but use the darker red-brown/purple carapace, added dorsal cinder plates and two visible cinder sacs/vents with restrained warm-orange highlights. Do not add wings, humanoid equipment, a giant scorpion stinger, lava cracks or active projectile effects.

### 035 — Thornfang

**Canonical cues:** Large brown-gray wolf using the Wolf body as its base. Same side-facing pose: tail left, head right. Larger scale. Canon additions: dark green vegetation mass over back/shoulders, root/branch-like protrusions rising from the back/head area, several leafy tufts along body, pale facial/tooth details and yellow-gold eye.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Thornfang exactly as described. It must unmistakably be the canonical enlarged wolf, not a redesigned fantasy wolf. Preserve brown-gray coat, green back growth, restrained branch/root protrusions, leafy tufts and right-facing head. Do not add giant deer antlers, armor, vines everywhere, glowing magic, extra tails or new anatomy.

### 036 — Crypt Guardian

**Canonical cues:** Large humanoid skeletal guardian. Dark gray-violet body/armor, oversized skull head, muted purple left shield, long pole on screen-right ending in a pale bone blade/head, additional bone accents and crown-like bone ridge over skull.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Crypt Guardian exactly as described. Preserve skull-headed humanoid proportions, dark violet-gray body, left shield and right pole with bone head. No cloak, full plate redesign, necromantic glow, wings or new weapon type.

### 037 — Mirejaw

**Canonical cues:** Large crocodilian boss using Mireling geometry: tail left, long body, toothy snout right, four legs. Dark olive body with pale marsh-tan dorsal vegetation/spine plates and reinforced jaw/teeth details.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Mirejaw exactly as described. Preserve the low crocodilian body and right-facing snout, dark olive palette and the existing pale dorsal vegetation/spines. No horns, armor plates, saddle, extra heads or giant fantasy crocodile redesign.

### 038 — Drowned Keeper

**Canonical cues:** Large humanoid in muted teal/blue-green. Pointed dark teal hood/head silhouette. Tall steel pole/anchor-like weapon on screen-right with broad lower prongs; small gold round accent near upper pole. Watery/sea-worn palette but no free-standing water effect.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Drowned Keeper exactly as described. Preserve teal humanoid body, pointed hood and right-side anchor-like pole weapon. No pirate coat, tentacles, barnacle crown, water aura or extra nautical props.

### 039 — Ridge Tyrant

**Canonical cues:** Very large bulky humanoid, tan-brown body. Two pale bone horns rising from head, broad asymmetric shoulder masses, dark belt/waist band, massive hammer/maul on screen-right with gray metal head, rough stone/bone accents.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ridge Tyrant exactly as described. Preserve huge humanoid bulk, two head horns, asymmetric shoulders and massive right-side hammer. No extra horns, fur mantle, full armor suit, crown or new weapons.

### 040 — Stone Colossus

**Canonical cues:** Massive blocky stone golem. Two rectangular legs, broad irregular gray-green stone torso, square stone head, small gold eyes, glowing-looking but material gold diamond/core embedded at chest, huge stone forearms, cracked/angled stone facets.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Stone Colossus exactly as described. Preserve blocky golem anatomy, gray-green stone, square head, gold eyes and chest diamond. No lava, moss, runes, shoulder crystals, extra limbs or floating stones.

### 041 — Ashen Warlord

**Canonical cues:** Large armored Orc commander. Muted olive-green skin and dark red-brown clothing. Steel helmet with two pale bone horn projections, steel shoulder armor, dark chest block, large polearm/axe on screen-right with broad steel head, red-brown cape/cloth mass on screen-left/back, small gold studs.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ashen Warlord exactly as described. Preserve Orc identity, horned steel helmet, steel shoulders, right-side large polearm/axe and red-brown cloth/cape. No banner unless part of the held weapon, no black plate redesign, fire aura or extra trophies.

### 042 — Abyss Dragon

**Canonical cues:** Purple-violet dragon in compact game pose. Two large angular wings extending left and right, long body and tail, long horned head oriented screen-right/up, two pale horns, two legs, pale tan underside bands.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Abyss Dragon exactly as described. Preserve violet body, two angular wings, horned right-facing head, compact proportions and pale underside bands. No extra wings, spikes, armor, flames, rider or background.

### 043 — Cindermaw

**Canonical cues:** Large ash-beast boss using the low many-legged Ash beast anatomy. Burnt red-brown body, many lateral legs, larger raised forelimbs/pincers, long curled tail sweeping left/back, pale bone horn/spine and several dark purple-brown carapace plates; small warm orange highlights/glints are intrinsic body accents only.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Cindermaw exactly as described. Preserve the canonical enlarged Ash beast anatomy and colors. Do not turn it into a lava wolf, dragon, giant scorpion with a new stinger, or add magma cracks/aura not present in the body.

### 044 — Ash Sentinel

**Canonical cues:** Very large armored humanoid. Blue-gray/steel body, oversized rectangular helmet/head, gold crown-like crenellated ridge, thin gold visor band, blue-gray shield on screen-left, long polearm on screen-right with broad steel blade, orange-gold diamond chest core.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ash Sentinel exactly as described. Preserve massive armored proportions, gold crown ridge, left shield, right polearm and orange-gold chest diamond. No cape, wings, full gold armor, flame aura or new symbols.

### 045 — Dark Lord

**Canonical cues:** Large dark armored humanoid. Deep purple/dark slate body and cape mass, pale gray face/helmet area, angular slate helmet, gold crown/horn crest, sword on screen-right, maroon-purple shield on screen-left, purple diamond chest sigil with pale inner highlight, reddish eyes.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Dark Lord exactly as described. Preserve the dark purple armored silhouette, gold crown/horn crest, sword right, maroon shield left and chest sigil. No wings, giant horns beyond the crest, skull motifs, fire, extra cape layers or new weaponry.

## E. Named captains / minibosses

### 046 — Scornfang

**Canonical cues:** Goblin captain: same Goblin body and proportions, moderately larger. Canon additions inspired by Thornfang: wolf-trophy/bone pieces near left shoulder, three small claw/fang bone marks on torso, two green diagonal markings, small warm-gold glint. Procedural captain ground ring is NOT part of sprite. Current treasury loadout is ranged: sling/stone on screen-right and small brown pouch on screen-left, not the melee sword. Preserve the small angular nose with separate simple mouth; no wide pale triangular grin. The current guard role also retains its small pale-gold body mark. Exclude all captain rings and guard ground chevrons from the raster. Organic pointed ears with natural folds/joins; playful half-smile with a small ivory corner-tooth/sliver and separate narrow nose. Refine procedural shape artifacts rather than copying robotic ear panels.

**Runtime sprite key:** `enemy:goblin:captain-ranged-guard`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Scornfang. Goblin captain: same Goblin body and proportions, moderately larger. Canon additions inspired by Thornfang: wolf-trophy/bone pieces near left shoulder, three small claw/fang bone marks on torso, two green diagonal markings, small warm-gold glint. Procedural captain ground ring is NOT part of sprite. Current treasury loadout is ranged: sling/stone on screen-right and small brown pouch on screen-left, not the melee sword. Preserve the small angular nose with separate simple mouth; no wide pale triangular grin. The current guard role also retains its small pale-gold body mark. Exclude all captain rings and guard ground chevrons from the raster. Preserve the exact current loadout, source silhouette and existing captain scale. Do not add anatomy, equipment, a new uniform, scenery or ground effects.

### 047 — Direjaw

**Canonical cues:** Mireling captain: same crocodilian Mireling body, moderately larger. Canon additions: heavier pale jaw-band/line and several darker/tan dorsal trophy plates, small warm-gold glints along snout. Procedural captain ground ring excluded. Current treasury loadout is the Mireling hybrid ranged class: darker muted green hide, amber markings, torso reed/leather harness, side pouch and current snout fitting; retain these beneath the captain additions. The current guard role also retains its small pale-gold body mark. Exclude all captain rings and guard ground chevrons from the raster.

**Runtime sprite key:** `enemy:mireling:captain-hybrid-ranged-guard`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Direjaw. Mireling captain: same crocodilian Mireling body, moderately larger. Canon additions: heavier pale jaw-band/line and several darker/tan dorsal trophy plates, small warm-gold glints along snout. Procedural captain ground ring excluded. Current treasury loadout is the Mireling hybrid ranged class: darker muted green hide, amber markings, torso reed/leather harness, side pouch and current snout fitting; retain these beneath the captain additions. The current guard role also retains its small pale-gold body mark. Exclude all captain rings and guard ground chevrons from the raster. Preserve the exact current loadout, source silhouette and existing captain scale. Do not add anatomy, equipment, a new uniform, scenery or ground effects.

### 048 — Crag Tyrant

**Canonical cues:** Wolf captain: same gray Wolf body, moderately larger. Canon additions: quarry-metal collar across shoulders/neck with three rectangular plates, pale stone brow plate near head and a small pale protruding line. Procedural captain ground ring excluded. The current guard role also retains its small pale-gold body mark. Exclude all captain rings and guard ground chevrons from the raster.

**Runtime sprite key:** `enemy:wolf:captain-guard`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Crag Tyrant. Wolf captain: same gray Wolf body, moderately larger. Canon additions: quarry-metal collar across shoulders/neck with three rectangular plates, pale stone brow plate near head and a small pale protruding line. Procedural captain ground ring excluded. The current guard role also retains its small pale-gold body mark. Exclude all captain rings and guard ground chevrons from the raster. Preserve the exact current loadout, source silhouette and existing captain scale. Do not add anatomy, equipment, a new uniform, scenery or ground effects.

### 049 — Dreadmaw

**Canonical cues:** Enlarged Ash-beast captain body. Dreadmaw's current combat mentor and Treasury master is Cindermaw, but his retained visual idol is the Dark Lord, preserving his original "Dread Lord" imitator identity. The Ash-beast carapace carries a dark obsidian-purple harness, a small Crown/Dark-Lord-style purple sigil, restrained bronze/gold authority linework. He remains unmistakably an Ash beast rather than becoming humanoid. Current treasury loadout is the hybrid Cinder Spitter: dark red-brown/purple carapace, dorsal cinder plates and two restrained orange-highlighted sacs/vents beneath the existing captain harness. The current guard role also retains its small pale-gold body mark. Exclude all captain rings and guard ground chevrons from the raster.

**Runtime sprite key:** `enemy:ashbeast:captain-hybrid-ranged-guard`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Dreadmaw. Enlarged Ash-beast captain body. Dreadmaw's current combat mentor and Treasury master is Cindermaw, but his retained visual idol is the Dark Lord, preserving his original "Dread Lord" imitator identity. The Ash-beast carapace carries a dark obsidian-purple harness, a small Crown/Dark-Lord-style purple sigil, restrained bronze/gold authority linework. He remains unmistakably an Ash beast rather than becoming humanoid. Current treasury loadout is the hybrid Cinder Spitter: dark red-brown/purple carapace, dorsal cinder plates and two restrained orange-highlighted sacs/vents beneath the existing captain harness. The current guard role also retains its small pale-gold body mark. Exclude all captain rings and guard ground chevrons from the raster. Preserve the exact current loadout, source silhouette and existing captain scale. Do not add anatomy, equipment, a new uniform, scenery or ground effects.

### 050 — Cinder Warlord

**Canonical cues:** Orc captain: same canonical Orc body, moderately larger. Canon additions inspired by Ashen Warlord: two steel shoulder plates, diagonal muted red authority stripe across torso, small brown tally-board block on screen-right with pale tally lines, slim pole with muted red triangular banner at screen-right.

**Runtime sprite key:** `enemy:orc:captain`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Cinder Warlord. Orc captain: same canonical Orc body, moderately larger. Canon additions inspired by Ashen Warlord: two steel shoulder plates, diagonal muted red authority stripe across torso, small brown tally-board block on screen-right with pale tally lines, slim pole with muted red triangular banner at screen-right. Preserve the exact current loadout, source silhouette and existing captain scale. Do not add anatomy, equipment, a new uniform, scenery or ground effects.

## F. Major destination structures

### 051 — Forest Crypt entrance

**Canonical cues:** Muted gray-green low stone mausoleum, broad rounded/faceted vault roof, central tall arched dark opening, two pale narrow front piers, skull above the arch, two shallow front steps and three restrained moss patches. No triangular house roof.

**Runtime sprite key:** `dungeon:crypt`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Forest Crypt entrance. Muted gray-green low stone mausoleum, broad rounded/faceted vault roof, central tall arched dark opening, two pale narrow front piers, skull above the arch, two shallow front steps and three restrained moss patches. No triangular house roof. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 052 — Sunken Archive entrance

**Canonical cues:** Teal-gray archive facade with two tall pale stone columns, broad low stepped stone lintel, recessed dark rectangular doorway, two narrow side recesses, pale horizontal door lintel, dark lower water-stain band and two wide pale entry steps. Small pale triangle on the upper stone lintel.

**Runtime sprite key:** `dungeon:archive`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Sunken Archive entrance. Teal-gray archive facade with two tall pale stone columns, broad low stepped stone lintel, recessed dark rectangular doorway, two narrow side recesses, pale horizontal door lintel, dark lower water-stain band and two wide pale entry steps. Small pale triangle on the upper stone lintel. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 053 — Colossus Mine entrance

**Canonical cues:** Irregular gray-green rock portal with a dark central tunnel, two thick timber uprights and heavy horizontal lintel, diagonal corner braces, pale rock chip on screen-left and two short steel rails with three timber sleepers leading into the opening.

**Runtime sprite key:** `dungeon:mine`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Colossus Mine entrance. Irregular gray-green rock portal with a dark central tunnel, two thick timber uprights and heavy horizontal lintel, diagonal corner braces, pale rock chip on screen-left and two short steel rails with three timber sleepers leading into the opening. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 054 — Abyss Bastion entrance

**Canonical cues:** Muted plum/ash stone bastion portal with two tall tapered side pylons, pale warm seam on each pylon, notched low central lintel and dark pointed doorway. Two vertical metal bars and one crossbar occupy the doorway. Small warm oval inset above it and a low broad threshold.

**Runtime sprite key:** `dungeon:abyss`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Abyss Bastion entrance. Muted plum/ash stone bastion portal with two tall tapered side pylons, pale warm seam on each pylon, notched low central lintel and dark pointed doorway. Two vertical metal bars and one crossbar occupy the doorway. Small warm oval inset above it and a low broad threshold. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 055 — Citadel of Ashes entrance

**Canonical cues:** Cool slate fortress portal with two square towers and sharply pointed slate caps, central triangular stone gable, dark pointed arch, three vertical grille bars and a pale crossbar, a purple diamond inset in the upper gable and restrained masonry courses in the lower towers.

**Runtime sprite key:** `dungeon:citadel`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Citadel of Ashes entrance. Cool slate fortress portal with two square towers and sharply pointed slate caps, central triangular stone gable, dark pointed arch, three vertical grille bars and a pale crossbar, a purple diamond inset in the upper gable and restrained masonry courses in the lower towers. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 056 — Thornfang Treasury entrance

**Canonical cues:** Woodland house-like entrance: warm tan walls, muted red-brown roof, dark central doorway, two vertical wooden side posts, green thorn/leaf spikes along roof and a small pale bone/fang cluster high on the front.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Thornfang's Treasury entrance exactly as described. Preserve the house-like massing, dark doorway, side posts, green roof growth and small bone/fang crest. No wolf statue, giant antlers, treasure pile or extra fortifications.

### 057 — Mirejaw Treasury entrance

**Canonical cues:** Raised wetland entrance: two tall wooden stilts/posts, pale green-gray wall block, muted teal roof, dark central doorway, reed stalks along roofline, small green dorsal/spine shapes over doorway.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Mirejaw's Treasury entrance exactly as described. Preserve raised posts, wetland roof, reed fringe, dark doorway and small green spine shapes. No crocodile head facade, water pool, boats or extra nests.

### 058 — Ridge Tyrant Treasury entrance

**Canonical cues:** Stone lodge entrance: broad gray stone walls, two heavier side blocks/posts, gray-green triangular roof, dark central doorway, pale trim line, paired pale bone horn motifs high on front, small round stones near lower sides.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Ridge Tyrant's Treasury entrance exactly as described. Preserve stone lodge massing, paired horn motifs, dark doorway and side stones. No giant skull, ogre statue, banners or mountain backdrop.

### 059 — Cindermaw Treasury entrance

**Canonical cues:** Rocky cave entrance assembled from dark gray-purple boulders. Outer irregular arch, smaller black inner opening, two small purple-brown horn/plate shapes on upper sides, a few restrained warm orange glints near lower front.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Cindermaw's Treasury entrance exactly as described. Preserve the irregular dark boulder cave, black opening, small side plates and few warm glints. No lava waterfall, giant monster mouth, skulls or extra crystals.

### 060 — Dark fortress gate

**Canonical cues:** Large dark stone fortress gate: wide rectangular dark-gray wall block, deep black central opening, two tall flanking towers/pillars, angular broad roof/pediment across the top.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Dark fortress gate exactly as described. Preserve the simple broad gate mass, two side towers and dark opening. No statues, skulls, banners, torches, moat, army or extra towers.

## G. Settlement structure families

### 061 — Vale cottage

**Canonical cues:** Warm pale timber cottage: rectangular tan wall body, steep muted red roof, visible vertical wood framing, dark central door, small blue-gray window on screen-right, pale trim line.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Vale cottage exactly as described. Preserve simple timber-frame proportions, red roof, door and single small window. No chimney unless clearly part of the existing silhouette, no flower boxes, porch, fence or extra story.

### 062 — Vale workshop

**Canonical cues:** Wider rustic timber workshop: warm tan wall body, uneven muted red roof, four strong vertical timber posts, broad dark open central doorway/work bay, small brown side block on screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Vale workshop exactly as described. Preserve broad low work-building proportions, red roof, exposed posts and dark central opening. No forge chimney, signs, tools outside or extra annexes.

### 063 — March stilt house

**Canonical cues:** Wetland house raised on four wooden stilts. Pale olive-gray wall body, muted green roof, dark central doorway, reed/thatch-like thin sticks along roofline, pale trim.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the March stilt house exactly as described. Preserve raised four-stilt construction, green roof, reed-like roof fringe and central door. No boat, water patch, nets, balcony or extra rooms.

### 064 — March boathouse

**Canonical cues:** Longer raised wetland structure on four stilts. Gray-green wall, muted teal-green roof, broad dark central opening, reed/thatch fringe along roofline, pale trim.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the March boathouse exactly as described. Preserve long low raised form, four stilts, teal roof and broad central opening. No boat, dock, water, ropes or extra storage props.

### 065 — Highland stone house

**Canonical cues:** Compact gray stone house with visible horizontal masonry courses, dark triangular gray-green roof, dark central door, small chimney on screen-right, pale trim.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Highland stone house exactly as described. Preserve compact stone mass, masonry lines, dark roof, central door and small right chimney. No snow, banners, porch or extra windows.

### 066 — Highland smithy

**Canonical cues:** Wide low gray stone smithy with visible masonry courses, dark gray-green roof, broad dark central work opening, tall chimney on screen-right, small contained hearth/brazier at lower right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Highland smithy exactly as described. Preserve low stone work-building proportions, roof, central opening, tall right chimney and small hearth. No anvil outside, smoke plume, sign or extra tools.

### 067 — Frontier patched house

**Canonical cues:** Scorched frontier house: muted tan-brown wall, irregular dark red-brown patched roof, dark central door, several visible rectangular repair patches on wall, one charred diagonal support at upper left.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Frontier patched house exactly as described. Preserve patched roof, wall repairs, central door and charred brace. No flames, smoke, barricade, extra weapons or destroyed wall sections.

### 068 — Frontier workshop

**Canonical cues:** Rough frontier workshop: two tall dark timber posts, uneven dark red-brown roof, muted brown wall body, broad dark central opening, pale trim line, small ember hearth at lower right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Frontier workshop exactly as described. Preserve rough posts, patched roof, central opening and small contained hearth. No weapon racks, banners, smoke cloud or extra sheds.

### 069 — Crown ash house

**Canonical cues:** Dark ash-stone house: slate-gray wall, four dark vertical braces/posts, blue-gray angular roof, black central door, purple diamond emblem high on front, pale trim.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Crown ash house exactly as described. Preserve dark stone/braced massing, blue-gray roof, black doorway and single purple diamond emblem. No towers, spikes, flames or extra sigils.

### 070 — Crown forgehouse

**Canonical cues:** Wide dark stone forgehouse with visible block courses, blue-gray roof, black central opening, tall dark chimney on screen-right, small dark hearth at lower right with restrained warm glints.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Crown forgehouse exactly as described. Preserve wide blocky mass, roof, central opening, right chimney and small hearth. No lava channel, giant furnace, banners or extra towers.

## H. Player-built Basic Barracks

### 071 — Greenwood Basic Barracks

**Canonical cues:** Reasonably sized cozy field-adventure camp, not a building: low muted red-brown/tan expedition tent with open dark flap, visible bedrolls and blankets, communal cookfire, practical supply crate, simple weapon rack, shield, modest camp banner/lantern and small Greenwood grass/flower touches.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Greenwood Basic Barracks as a compact but clearly readable cozy expedition camp. Keep the low tent, sleeping gear, communal cookfire and practical gear corner visible. It must not resemble a shop stall, house, lodge, fortress or permanent military building.

### 072 — Marches Basic Barracks

**Canonical cues:** Reasonably sized cozy wetland expedition camp: low muted teal-gray tent with open flap, visible bedrolls, communal cookfire/stove, supply crate, weapon rack, shield, modest banner/lantern, reed details and a restrained raised timber edge suited to damp ground.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Marches Basic Barracks as a cozy wetland camp. Preserve the low tent, sleeping gear, warm fire, practical supplies, reeds and light raised footing. No boathouse, shop counter, permanent stilt house, dock, fortress or watchtower.

### 073 — Highlands Basic Barracks

**Canonical cues:** Reasonably sized cozy alpine expedition camp: low gray-olive canvas tent with open flap, visible bedrolls, communal stone-ring hearth, supply crate, weapon rack, shield, modest banner/lantern and small stone markers around the edge.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Highlands Basic Barracks as a cozy field camp. Preserve the low canvas shelter, sleeping gear, stone-ring fire, practical gear corner and rocky regional touches. No stone redoubt, house, shop, castle wall or tower.

### 074 — Frontier Basic Barracks

**Canonical cues:** Reasonably sized cozy frontier expedition camp: low patched rust-brown canvas tent with open flap, bedrolls, ember cookfire, supply crate, weapon rack, shield, modest banner/lantern and a few scorched braces/logs reflecting the burned region.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Frontier Basic Barracks as a cozy rugged field camp. Preserve patched canvas, visible sleeping gear, warm ember fire, supplies and scorched regional touches. No stockade building, shop stall, palisade fort, watchtower or warlord compound.

### 075 — Dark Crown Basic Barracks

**Canonical cues:** Reasonably sized cozy Dark Crown expedition camp: low slate-purple canvas tent with open flap, visible bedrolls, contained warm brazier/cookfire, supply crate, weapon rack, shield, modest banner/lantern, restrained obsidian braces and a small purple camp emblem.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Dark Crown Basic Barracks as a cozy expedition camp adapted to hostile Crown terrain. Preserve the low tent, sleeping gear, contained warm fire, supplies, restrained obsidian accents and small purple emblem. No fortress walls, permanent stone building, shop stall, towers or oversized arcane machinery.

### 076 — Goblin roadside camp

**Canonical cues:** Two overlapping small brown/tan triangular lean-to tents, a small dark fire pit with one warm glint at lower left, and a small brown crate/block at screen-right. Organic pointed ears with natural folds/joins; playful half-smile with a small ivory corner-tooth/sliver and separate narrow nose. Refine procedural shape artifacts rather than copying robotic ear panels.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Goblin roadside camp exactly as described as one compact place sprite. Preserve two tents, tiny fire pit and right-side crate. No goblins, palisade, banners, treasure, extra tents or scenery.

### 077 — Mire nesting bank

**Canonical cues:** Low marsh nest cluster: broad dark green oval nest/base with repeated reed stalks rising around it and two smaller olive-green inner nest ovals.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Mire nesting bank exactly as described. Preserve low oval nest, repeated reeds and two inner nest shapes. No creatures, eggs, water patch, bones or extra props.

### 078 — Wolf den / hunting-ground shelter

**Canonical cues:** Rocky gray den: broad irregular stone mound/arch, deep dark central cave opening, two small muted brown-gray ground stones at the lower sides.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Wolf den exactly as described. Preserve rock mound, dark cave opening and two small side stones. No wolf, bones, trees, antlers or extra cave scenery.

### 079 — Ogre hearth

**Canonical cues:** Low dark circular hearth with three orange-brown flame shapes in center and two squat gray stone blocks standing left and right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ogre hearth exactly as described. Preserve simple hearth, three flames and two stone blocks. No ogre, tent, cooking pot, weapon rack or extra camp clutter.

### 080 — Orc bivouac

**Canonical cues:** Single broad muted brown-red triangular command tent with center pole, small dark brown supply block on screen-right, and a slim pole with small muted red triangular banner at far right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Orc bivouac exactly as described. Preserve tent, right-side supply block and small banner pole. No orcs, palisade, cookfire, weapons or extra tents.

### 081 — Ash-beast roost

**Canonical cues:** Low dark gray-purple oval nest with several short stick-like protrusions around it, one central purple-brown triangular plate/spike and one restrained warm glint.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ash-beast roost exactly as described. Preserve low oval roost, stick rim, central purple plate and one warm accent. No ash beast, eggs, lava, bones or extra rocks.

### 082 — Crown field barracks stronghold

**Canonical cues:** Compact dark military hut: slate-gray rectangular wall, four dark vertical braces/posts, blue-gray pitched roof, black central opening, purple diamond emblem high on front.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Crown field barracks landmark exactly as described. Preserve the same compact hut massing and single purple emblem. No surrounding wall, troops, banners, tower or extra props.

## J. Named landmark structures

### 083 — Abandoned orchard cluster

**Canonical cues:** Three small orchard trees in a row, each with narrow brown trunk and rounded muted green canopy; sparse warm fruit glints; simple low brown baseline/fence line.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Abandoned orchard cluster exactly as described. Preserve exactly three small trees, simple trunks/canopies and restrained fruit accents. No farmhouse, crates, road, extra trees or landscape background.

### 084 — Drowned Watchhouse exterior marker

**Canonical cues:** Canonical outdoor landmark is a simple wooden watch structure: two tall timber posts, upper horizontal platform/beam, mid-level crossbeam and a narrow central pole rising above.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Drowned Watchhouse landmark exactly as the existing wooden watch structure. Do not reinterpret the name as a full house. Preserve two posts, upper beam, mid crossbeam and central raised pole. No roof, walls, water, reeds or extra props.

### 085 — Old Signal Keep exterior marker

**Canonical cues:** Canonical outdoor landmark is a rocky lookout marker: cluster of three low gray stones, one tall central pole rising upward, and a muted brown triangular banner projecting to screen-right near the top.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Old Signal Keep landmark exactly as the existing rocky lookout marker. Do not invent a keep or tower. Preserve the low stone cluster, central pole and right-facing triangular banner.

### 086 — Ruined Shrine

**Canonical cues:** Small gray-brown ruined shrine: low rectangular stone body, two narrow upright rear columns, muted gray-brown triangular roof/pediment, one broken muted red zigzag ritual mark across the front.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ruined Shrine exactly as described. Preserve low ruined shrine form, two rear columns, triangular top and single red broken mark. No statue, altar accessories, candles, vines or extra ruins.

### 087 — Ruined Foundry

**Canonical cues:** Compact gray industrial ruin: low rectangular body, two uneven upper block/chimney structures, dark oval forge opening/hearth at lower center, three restrained orange ember glints.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ruined Foundry exactly as described. Preserve compact blocky ruin, two upper structures, central dark hearth and only a few warm ember accents. No smoke, lava, machinery expansion or extra buildings.

### 088 — Siege camp

**Canonical cues:** Large muted brown triangular tent with central pole, small dark brown supply block at screen-right, separate tall pole at far right with muted purple-red triangular banner.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Siege camp exactly as described. Preserve the single tent, right-side supply block and far-right banner pole. No siege engine, soldiers, walls, fires or extra tents.

### 089 — Watchtower / tower landmark

**Canonical cues:** Compact gray stone tower: rectangular central tower body, two small crenellated blocks at upper left and right, one dark green-gray broken/diagonal inset shape across upper front.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Watchtower landmark exactly as described. Preserve short stone tower, two top blocks and single dark diagonal/broken inset. No flags, stairs, windows, battlements beyond the two blocks or surrounding wall.

## K. Transport identities

### 090 — Merchant wagon

**Canonical cues:** Compact covered wagon: brown rectangular cart body, two dark wheels, pale tan triangular/arched canvas cover, simple horizontal pale trim, short forward shaft to screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Merchant wagon exactly as described. Preserve compact cart, two wheels, pale cover and right-side shaft. No horse, cargo pile, driver, lanterns or road.

### 091 — Ferryman boat

**Canonical cues:** Simple wooden ferry boat: long brown hull, pale trim line, central vertical mast, single pale triangular sail extending to screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ferryman boat exactly as described. Preserve long hull, single mast and one right-side triangular sail. No ferryman, water, oars, second sail, cargo or dock.

### 092 — Pack-beast caravan mount

**Canonical cues:** Camel-like tan pack animal: long horizontal body, raised hump, four simple legs, long neck and head to screen-right, brown saddle blanket/load on back and one darker side pack.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Pack-beast caravan mount exactly as described. Preserve camel-like anatomy, right-facing neck/head, saddle blanket/load and side pack. No rider, reins, caravan train, extra bags or desert scenery.

### 093 — Dragon transport

**Canonical cues:** Muted olive-gray compact dragon using the canonical dragon anatomy: two angular wings, horned head to screen-right, two legs, tail, with a simple brown rectangular saddle on its back.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Dragon transport exactly as described. Preserve olive-gray dragon body and simple brown saddle. No rider, armor, reins, fire, banners or background.

## L. Selected large world-life props

### 094 — Standard market stand — Vale/Marches/Highlands/Crown

**Audit status: KEEP PROCEDURAL — DO NOT GENERATE A SPRITE.**

**Reason:** The market canopy is region-sensitive in the renderer and the prop is repeated settlement dressing. A single static sprite would either erase that regional difference or require an unnecessary variant family. Keep procedural.

### 095 — Well

**Canonical cues:** Low gray stone oval well with dark teal water opening, two wooden side posts and a small muted red-brown triangular roof above.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Well exactly as described. Preserve stone ring, water opening, two posts and small roof. No bucket, rope crank, flowers or ground patch.

### 096 — Watchpost

**Canonical cues:** Two narrow wooden posts supporting a small horizontal platform and simple muted brown triangular roof, with one thin central pole rising above.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Watchpost exactly as described. Preserve two-post frame, platform, simple roof and central pole. No guard, ladder, banner, walls or extra structure.

### 097 — Frontier command tent

**Audit status: KEEP PROCEDURAL — DO NOT GENERATE A SPRITE.**

**Reason:** The renderer changes the command-tent body color in Dark Crown versus other regions. It is repeated stronghold dressing rather than a unique landmark. Keep procedural instead of multiplying static variants.

### 098 — Forge

**Canonical cues:** Compact gray forge block: lower rectangular stone base, upper smaller stone block, central dark hearth opening with three small orange flame shapes, tall dark chimney on screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Forge exactly as described. Preserve two-tier stone forge, central hearth and right chimney. No anvil, smith, smoke cloud, tools or floor.

### 099 — War table

**Canonical cues:** Broad brown clipped-corner rectangular command table on two timber legs. Pale parchment map with bent green route line, three short pin flags rising from the map, a short rolled document on screen-left and small brown writing block on the right. Flags are muted purple in Dark Crown; no readable text.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one War table. Broad brown clipped-corner rectangular command table on two timber legs. Pale parchment map with bent green route line, three short pin flags rising from the map, a short rolled document on screen-left and small brown writing block on the right. Flags are muted purple in Dark Crown; no readable text. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 100 — Dark throne

**Canonical cues:** Dark slate-purple blocky throne: wide low seat base, tall pointed/angular back rising at center, purple diamond emblem in center of back, two short dark arm blocks.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Dark throne exactly as described. Preserve blocky dark seat, tall angular back, single purple diamond and two arms. No skulls, spikes, occupant, stairs, banners or magic glow.

### 101 — Crown banner

**Canonical cues:** Tall steel-gray pole with a muted dark purple rectangular/pointed hanging banner to screen-right, bearing one simple lighter purple diamond emblem.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Crown banner exactly as described. Preserve tall pole, one dark purple hanging banner and single diamond emblem. No crown icon, skulls, fringe, extra flags or wind effects.

### 102 — Greenwood training dummy

**Audit status: KEEP PROCEDURAL — DO NOT GENERATE A SPRITE.**

**Reason:** The training dummy uses region-dependent local wood and appears as repeated functional clutter. The procedural form already handles regional palette variation cleanly.

### 103 — Highlands weapon rack

**Audit status: KEEP PROCEDURAL — DO NOT GENERATE A SPRITE.**

**Reason:** The rack uses region-dependent local wood and appears across multiple regions/interiors. Keep it procedural so one sprite does not flatten regional material differences.

### 104 — Marches fish rack

**Canonical cues:** Braced timber drying frame, broad upper rail and three elongated silver-green fish suspended at staggered heights by pale ties. Each fish has a forked tail above a narrow body, pale belly seam and small eye near its lower head. No identical diamond tokens.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Marches fish rack. Braced timber drying frame, broad upper rail and three elongated silver-green fish suspended at staggered heights by pale ties. Each fish has a forked tail above a narrow body, pale belly seam and small eye near its lower head. No identical diamond tokens. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 105 — Highlands ore crane

**Canonical cues:** Simple quarry crane: two tall wooden side supports and top beam, diagonal brace, hanging steel cable on screen-right ending in a small gray load/rock.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ore crane exactly as described. Preserve two supports, top beam, diagonal brace and one hanging cable/load. No cart, pulley machinery expansion, workers, mine wall or extra ropes.

## M. Vegetation / wild-prop representatives

### 106 — Greenwood broadleaf tree / bush cluster

**Canonical cues:** Canonical Greenwood wild prop: slim brown trunk with two short branches; overlapping rounded foliage masses in several muted greens, asymmetrical canopy, optional few tiny warm flower/fruit glints.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render one Greenwood wild-prop tree exactly as described. Preserve slim trunk, branching and clustered rounded green canopy. No giant tree, roots, mushrooms, sign, ground patch or dramatic flowers.

### 107 — Marches wetland shrub / reed cluster

**Canonical cues:** Canonical Marches wild prop: short brown trunk/stem, several rounded muted green wetland foliage clumps, four narrow reed stems rising around lower sides, occasional tiny pale marsh highlights.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render one Marches wetland shrub exactly as described. Preserve compact foliage clumps and surrounding reed stems. No water patch, flowers, cattail heads unless already implicit, animals or extra scenery.

### 108 — Highlands pine

**Canonical cues:** Canonical Highlands wild prop: slim brown trunk and four stacked triangular tiers of muted green pine foliage, widest at bottom and narrowing upward; simple short roots/branch lines at base.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render one Highlands pine exactly as described. Preserve the four-tier triangular pine silhouette and muted green palette. No snow, cones, rocks, birds or extra shrubs.

### 109 — Frontier charred tree

**Canonical cues:** Canonical Frontier wild prop: dark brown narrow trunk with two large bare angular branches extending left and right/up, a few small burnt reddish-brown leaf/ember-shaped clusters attached to branches.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render one Frontier charred tree exactly as described. Preserve bare angular branch silhouette and very sparse burnt clusters. No flames, smoke, glowing trunk cracks, ground ash patch or extra branches.

### 110 — Dark Crown obsidian/crystal rock

**Canonical cues:** Canonical Dark Crown rock: irregular low dark gray-purple rock mass with lighter purple facet on left/top, one narrow purple crystal spike emerging from the right-upper area and a restrained pale-purple glint.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render one Dark Crown rock exactly as described. Preserve irregular dark rock, lighter facet, single purple crystal spike and restrained glint. No crystal cluster, lava, runes, smoke or ground patch.

## N. Regional town service structures — added by prompt audit

The first roster omitted four purpose-specific procedural service structures. The renderer gives each a distinct silhouette and each region a distinct material palette, so the audited catalog includes all 20 exact region/role combinations rather than flattening them into generic art.

## N. Regional service structures missing from the first roster

### 111 — Vale quest board

**Canonical cues:** Vale regional frame: simple wood posts with small green base patches. Materials use warm tan faces and regional timber/trim. Quest board sheltered by a red-brown pitched canvas/timber awning with a pale lower edge. Two main timber uprights, five small parchment notices with short illegible marks, lower document shelf and narrow right-side holder. No readable text.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Vale quest board. Vale regional frame: simple wood posts with small green base patches. Materials use warm tan faces and regional timber/trim. Quest board sheltered by a red-brown pitched canvas/timber awning with a pale lower edge. Two main timber uprights, five small parchment notices with short illegible marks, lower document shelf and narrow right-side holder. No readable text. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 112 — Vale supplier stall

**Canonical cues:** Vale regional frame: simple wood posts with small green base patches. Materials use warm tan faces and regional timber/trim. Supplier counter under a red-brown pitched canvas/timber awning with a pale lower edge. Open serving space, two small shelves on the left, one tied central sack, right-side rectangular stock box, broad pale-edged counter and two vertical lower panel seams.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Vale supplier stall. Vale regional frame: simple wood posts with small green base patches. Materials use warm tan faces and regional timber/trim. Supplier counter under a red-brown pitched canvas/timber awning with a pale lower edge. Open serving space, two small shelves on the left, one tied central sack, right-side rectangular stock box, broad pale-edged counter and two vertical lower panel seams. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 113 — Vale recruiter post

**Canonical cues:** Vale regional frame: simple wood posts with small green base patches. Materials use warm tan faces and regional timber/trim. Recruiter equipment post under a red-brown pitched canvas/timber awning with a pale lower edge. Low dark platform, shield on screen-left, weapon shafts and pale spearhead toward screen-right, central short rack and small right pennant. Keep the pennant muted purple in Dark Crown and roof-colored elsewhere.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Vale recruiter post. Vale regional frame: simple wood posts with small green base patches. Materials use warm tan faces and regional timber/trim. Recruiter equipment post under a red-brown pitched canvas/timber awning with a pale lower edge. Low dark platform, shield on screen-left, weapon shafts and pale spearhead toward screen-right, central short rack and small right pennant. Keep the pennant muted purple in Dark Crown and roof-colored elsewhere. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 114 — Vale refuge/rest house

**Canonical cues:** Vale regional frame: simple wood posts with small green base patches. Materials use warm tan faces and regional timber/trim. Warm timber-framed cottage with steep triangular red-brown roof and visible corner beams. Dark lower central doorway with one pale vertical edge, warm wall lamp to screen-left and small attached bench toward screen-right. Only the Highlands refuge has a tall chimney.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Vale refuge/rest house. Vale regional frame: simple wood posts with small green base patches. Materials use warm tan faces and regional timber/trim. Warm timber-framed cottage with steep triangular red-brown roof and visible corner beams. Dark lower central doorway with one pale vertical edge, warm wall lamp to screen-left and small attached bench toward screen-right. Only the Highlands refuge has a tall chimney. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 115 — Marches quest board

**Canonical cues:** Marches regional frame: raised timber platform and four support posts. Materials use muted reed-gray green faces and regional timber/trim. Quest board sheltered by a asymmetric teal reed roof with diagonal straw ribs. Two main timber uprights, five small parchment notices with short illegible marks, lower document shelf and narrow right-side holder. No readable text.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Marches quest board. Marches regional frame: raised timber platform and four support posts. Materials use muted reed-gray green faces and regional timber/trim. Quest board sheltered by a asymmetric teal reed roof with diagonal straw ribs. Two main timber uprights, five small parchment notices with short illegible marks, lower document shelf and narrow right-side holder. No readable text. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 116 — Marches supplier stall

**Canonical cues:** Marches regional frame: raised timber platform and four support posts. Materials use muted reed-gray green faces and regional timber/trim. Supplier counter under a asymmetric teal reed roof with diagonal straw ribs. Open serving space, two small shelves on the left, one tied central sack, right-side rectangular stock box, broad pale-edged counter and two vertical lower panel seams.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Marches supplier stall. Marches regional frame: raised timber platform and four support posts. Materials use muted reed-gray green faces and regional timber/trim. Supplier counter under a asymmetric teal reed roof with diagonal straw ribs. Open serving space, two small shelves on the left, one tied central sack, right-side rectangular stock box, broad pale-edged counter and two vertical lower panel seams. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 117 — Marches recruiter post

**Canonical cues:** Marches regional frame: raised timber platform and four support posts. Materials use muted reed-gray green faces and regional timber/trim. Recruiter equipment post under a asymmetric teal reed roof with diagonal straw ribs. Low dark platform, shield on screen-left, weapon shafts and pale spearhead toward screen-right, central short rack and small right pennant. Keep the pennant muted purple in Dark Crown and roof-colored elsewhere.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Marches recruiter post. Marches regional frame: raised timber platform and four support posts. Materials use muted reed-gray green faces and regional timber/trim. Recruiter equipment post under a asymmetric teal reed roof with diagonal straw ribs. Low dark platform, shield on screen-left, weapon shafts and pale spearhead toward screen-right, central short rack and small right pennant. Keep the pennant muted purple in Dark Crown and roof-colored elsewhere. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 118 — Marches refuge/rest house

**Canonical cues:** Marches regional frame: raised timber platform and four support posts. Materials use muted reed-gray green faces and regional timber/trim. Low raised reed-gray house with sloped ribbed teal roof, pale landing rail and visible support posts. Dark lower central doorway with one pale vertical edge, warm wall lamp to screen-left and small attached bench toward screen-right. Only the Highlands refuge has a tall chimney.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Marches refuge/rest house. Marches regional frame: raised timber platform and four support posts. Materials use muted reed-gray green faces and regional timber/trim. Low raised reed-gray house with sloped ribbed teal roof, pale landing rail and visible support posts. Dark lower central doorway with one pale vertical edge, warm wall lamp to screen-left and small attached bench toward screen-right. Only the Highlands refuge has a tall chimney. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 119 — Highlands quest board

**Canonical cues:** Highlands regional frame: low coursed stone plinth. Materials use pale gray-green faces and regional timber/trim. Quest board sheltered by a broad stepped gray-green stone lintel/canopy. Two main timber uprights, five small parchment notices with short illegible marks, lower document shelf and narrow right-side holder. No readable text.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Highlands quest board. Highlands regional frame: low coursed stone plinth. Materials use pale gray-green faces and regional timber/trim. Quest board sheltered by a broad stepped gray-green stone lintel/canopy. Two main timber uprights, five small parchment notices with short illegible marks, lower document shelf and narrow right-side holder. No readable text. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 120 — Highlands supplier stall

**Canonical cues:** Highlands regional frame: low coursed stone plinth. Materials use pale gray-green faces and regional timber/trim. Supplier counter under a broad stepped gray-green stone lintel/canopy. Open serving space, two small shelves on the left, one tied central sack, right-side rectangular stock box, broad pale-edged counter and two vertical lower panel seams.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Highlands supplier stall. Highlands regional frame: low coursed stone plinth. Materials use pale gray-green faces and regional timber/trim. Supplier counter under a broad stepped gray-green stone lintel/canopy. Open serving space, two small shelves on the left, one tied central sack, right-side rectangular stock box, broad pale-edged counter and two vertical lower panel seams. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 121 — Highlands recruiter post

**Canonical cues:** Highlands regional frame: low coursed stone plinth. Materials use pale gray-green faces and regional timber/trim. Recruiter equipment post under a broad stepped gray-green stone lintel/canopy. Low dark platform, shield on screen-left, weapon shafts and pale spearhead toward screen-right, central short rack and small right pennant. Keep the pennant muted purple in Dark Crown and roof-colored elsewhere.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Highlands recruiter post. Highlands regional frame: low coursed stone plinth. Materials use pale gray-green faces and regional timber/trim. Recruiter equipment post under a broad stepped gray-green stone lintel/canopy. Low dark platform, shield on screen-left, weapon shafts and pale spearhead toward screen-right, central short rack and small right pennant. Keep the pennant muted purple in Dark Crown and roof-colored elsewhere. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 122 — Highlands refuge/rest house

**Canonical cues:** Highlands regional frame: low coursed stone plinth. Materials use pale gray-green faces and regional timber/trim. Solid gray-green stone refuge with shallow hipped stone roof, masonry courses and tall right chimney. Dark lower central doorway with one pale vertical edge, warm wall lamp to screen-left and small attached bench toward screen-right. Only the Highlands refuge has a tall chimney.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Highlands refuge/rest house. Highlands regional frame: low coursed stone plinth. Materials use pale gray-green faces and regional timber/trim. Solid gray-green stone refuge with shallow hipped stone roof, masonry courses and tall right chimney. Dark lower central doorway with one pale vertical edge, warm wall lamp to screen-left and small attached bench toward screen-right. Only the Highlands refuge has a tall chimney. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 123 — Frontier quest board

**Canonical cues:** Frontier regional frame: two pointed timber supports and diagonal repair brace. Materials use weathered warm brown faces and regional timber/trim. Quest board sheltered by a uneven red-brown patched canopy with one tan patch and diagonal timber edge. Two main timber uprights, five small parchment notices with short illegible marks, lower document shelf and narrow right-side holder. No readable text.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Frontier quest board. Frontier regional frame: two pointed timber supports and diagonal repair brace. Materials use weathered warm brown faces and regional timber/trim. Quest board sheltered by a uneven red-brown patched canopy with one tan patch and diagonal timber edge. Two main timber uprights, five small parchment notices with short illegible marks, lower document shelf and narrow right-side holder. No readable text. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 124 — Frontier supplier stall

**Canonical cues:** Frontier regional frame: two pointed timber supports and diagonal repair brace. Materials use weathered warm brown faces and regional timber/trim. Supplier counter under a uneven red-brown patched canopy with one tan patch and diagonal timber edge. Open serving space, two small shelves on the left, one tied central sack, right-side rectangular stock box, broad pale-edged counter and two vertical lower panel seams.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Frontier supplier stall. Frontier regional frame: two pointed timber supports and diagonal repair brace. Materials use weathered warm brown faces and regional timber/trim. Supplier counter under a uneven red-brown patched canopy with one tan patch and diagonal timber edge. Open serving space, two small shelves on the left, one tied central sack, right-side rectangular stock box, broad pale-edged counter and two vertical lower panel seams. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 125 — Frontier recruiter post

**Canonical cues:** Frontier regional frame: two pointed timber supports and diagonal repair brace. Materials use weathered warm brown faces and regional timber/trim. Recruiter equipment post under a uneven red-brown patched canopy with one tan patch and diagonal timber edge. Low dark platform, shield on screen-left, weapon shafts and pale spearhead toward screen-right, central short rack and small right pennant. Keep the pennant muted purple in Dark Crown and roof-colored elsewhere.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Frontier recruiter post. Frontier regional frame: two pointed timber supports and diagonal repair brace. Materials use weathered warm brown faces and regional timber/trim. Recruiter equipment post under a uneven red-brown patched canopy with one tan patch and diagonal timber edge. Low dark platform, shield on screen-left, weapon shafts and pale spearhead toward screen-right, central short rack and small right pennant. Keep the pennant muted purple in Dark Crown and roof-colored elsewhere. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 126 — Frontier refuge/rest house

**Canonical cues:** Frontier regional frame: two pointed timber supports and diagonal repair brace. Materials use weathered warm brown faces and regional timber/trim. Patched warm-brown shelter with uneven patched canopy, right wall repair panel and a small attached left lean-to. Dark lower central doorway with one pale vertical edge, warm wall lamp to screen-left and small attached bench toward screen-right. Only the Highlands refuge has a tall chimney.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Frontier refuge/rest house. Frontier regional frame: two pointed timber supports and diagonal repair brace. Materials use weathered warm brown faces and regional timber/trim. Patched warm-brown shelter with uneven patched canopy, right wall repair panel and a small attached left lean-to. Dark lower central doorway with one pale vertical edge, warm wall lamp to screen-left and small attached bench toward screen-right. Only the Highlands refuge has a tall chimney. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 127 — Dark Crown quest board

**Canonical cues:** Dark Crown regional frame: four slate supports, two purple-tinted spikes and one small top diamond. Materials use cool slate-gray faces and regional timber/trim. Quest board sheltered by a trapezoidal slate canopy with tapered end ornaments and pale purple lower edge. Two main timber uprights, five small parchment notices with short illegible marks, lower document shelf and narrow right-side holder. No readable text.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Dark Crown quest board. Dark Crown regional frame: four slate supports, two purple-tinted spikes and one small top diamond. Materials use cool slate-gray faces and regional timber/trim. Quest board sheltered by a trapezoidal slate canopy with tapered end ornaments and pale purple lower edge. Two main timber uprights, five small parchment notices with short illegible marks, lower document shelf and narrow right-side holder. No readable text. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 128 — Dark Crown supplier stall

**Canonical cues:** Dark Crown regional frame: four slate supports, two purple-tinted spikes and one small top diamond. Materials use cool slate-gray faces and regional timber/trim. Supplier counter under a trapezoidal slate canopy with tapered end ornaments and pale purple lower edge. Open serving space, two small shelves on the left, one tied central sack, right-side rectangular stock box, broad pale-edged counter and two vertical lower panel seams.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Dark Crown supplier stall. Dark Crown regional frame: four slate supports, two purple-tinted spikes and one small top diamond. Materials use cool slate-gray faces and regional timber/trim. Supplier counter under a trapezoidal slate canopy with tapered end ornaments and pale purple lower edge. Open serving space, two small shelves on the left, one tied central sack, right-side rectangular stock box, broad pale-edged counter and two vertical lower panel seams. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 129 — Dark Crown recruiter post

**Canonical cues:** Dark Crown regional frame: four slate supports, two purple-tinted spikes and one small top diamond. Materials use cool slate-gray faces and regional timber/trim. Recruiter equipment post under a trapezoidal slate canopy with tapered end ornaments and pale purple lower edge. Low dark platform, shield on screen-left, weapon shafts and pale spearhead toward screen-right, central short rack and small right pennant. Keep the pennant muted purple in Dark Crown and roof-colored elsewhere.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Dark Crown recruiter post. Dark Crown regional frame: four slate supports, two purple-tinted spikes and one small top diamond. Materials use cool slate-gray faces and regional timber/trim. Recruiter equipment post under a trapezoidal slate canopy with tapered end ornaments and pale purple lower edge. Low dark platform, shield on screen-left, weapon shafts and pale spearhead toward screen-right, central short rack and small right pennant. Keep the pennant muted purple in Dark Crown and roof-colored elsewhere. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 130 — Dark Crown refuge/rest house

**Canonical cues:** Dark Crown regional frame: four slate supports, two purple-tinted spikes and one small top diamond. Materials use cool slate-gray faces and regional timber/trim. Square slate refuge with low trapezoidal roof, small barred left window and purple diamond above the doorway. Dark lower central doorway with one pale vertical edge, warm wall lamp to screen-left and small attached bench toward screen-right. Only the Highlands refuge has a tall chimney.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Dark Crown refuge/rest house. Dark Crown regional frame: four slate supports, two purple-tinted spikes and one small top diamond. Materials use cool slate-gray faces and regional timber/trim. Square slate refuge with low trapezoidal roof, small barred left window and purple diamond above the doorway. Dark lower central doorway with one pale vertical edge, warm wall lamp to screen-left and small attached bench toward screen-right. Only the Highlands refuge has a tall chimney. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

## O. Shared side-interior entrance

### 131 — Old Orchard Cellars entrance

**Canonical cues:** Low mossy gray-green stone cellar arch partly capped by an uneven green earth/stone lip. Dark recessed opening, three broad descending-entry step shapes, short wooden rails beside the opening and a small attached brown storage box on screen-right. No tower or pitched roof.

**Runtime sprite key:** `dungeon:side-vale-cellars`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Old Orchard Cellars entrance. Low mossy gray-green stone cellar arch partly capped by an uneven green earth/stone lip. Dark recessed opening, three broad descending-entry step shapes, short wooden rails beside the opening and a small attached brown storage box on screen-right. No tower or pitched roof. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

## P. Regional prop variants exposed by audit

### 132 — Frontier market stand

**Audit status: KEEP PROCEDURAL — DO NOT GENERATE A SPRITE.**

**Reason:** Market stands are repeated settlement dressing and already handle regional canopy color procedurally. The audited production set keeps all market stands procedural.

### 133 — Dark Crown command tent

**Audit status: KEEP PROCEDURAL — DO NOT GENERATE A SPRITE.**

**Reason:** Command tents are repeated stronghold dressing and already change palette by region. The audited production set keeps command tents procedural.

### 134 — Frontier training dummy

**Audit status: KEEP PROCEDURAL — DO NOT GENERATE A SPRITE.**

**Reason:** Training dummies are repeated functional clutter whose wood palette follows the region. The audited production set keeps them procedural.

### 135 — Dark Crown training dummy

**Audit status: KEEP PROCEDURAL — DO NOT GENERATE A SPRITE.**

**Reason:** Training dummies are repeated functional clutter whose wood palette follows the region. The audited production set keeps them procedural.

### 136 — Frontier weapon rack

**Canonical cues:** Frontier timber weapon frame with two stout uprights and two horizontal rails. Spear on screen-left, sword with pale gold crossguard in the middle, broad-headed axe on screen-right. Brown shafts and muted steel blades; three distinct weapon silhouettes.

**Audit status: KEEP PROCEDURAL — DO NOT GENERATE A SPRITE.**

**Reason:** Repeated functional equipment follows regional timber materials and remains procedural.

### 137 — Dark Crown weapon rack

**Canonical cues:** Dark Crown slate-gray timber weapon frame with two stout uprights and two horizontal rails. Spear on screen-left, sword with pale gold crossguard in the middle, broad-headed axe on screen-right. Brown shafts and muted steel blades; three distinct weapon silhouettes.

**Audit status: KEEP PROCEDURAL — DO NOT GENERATE A SPRITE.**

**Reason:** Repeated functional equipment follows regional timber materials and remains procedural.

## Q. Identity-bearing boss-home / dungeon props promoted by audit

### 138 — Thorn bed

**Canonical cues:** Low oval olive-green bedding/nest with four triangular leafy/thorn clumps rising from it and two brown branch supports at the outer sides.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Thorn bed exactly as described. Preserve low oval bed, four leafy/thorn clumps and two side branch supports. No wolf, flowers, antlers or extra nest material.

### 139 — Vale fang trophy

**Canonical cues:** Tall simple Greenwood wooden post with three paired sets of small ivory fang/bone trophies mounted symmetrically at different heights.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Vale fang trophy exactly as described. Preserve one tall wooden post and exactly three paired fang sets. No skull, banner, antlers, rope decorations or extra bones.

### 140 — Root table

**Canonical cues:** Irregular warm wooden root tabletop with a thick branching root pedestal spreading beneath it. One restrained grain line and three small pale bowls containing ochre, brown and green food shapes. No regular oval tabletop or thin straight table legs.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Root table. Irregular warm wooden root tabletop with a thick branching root pedestal spreading beneath it. One restrained grain line and three small pale bowls containing ochre, brown and green food shapes. No regular oval tabletop or thin straight table legs. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 141 — Treasure hoard

**Canonical cues:** Compact pile of five overlapping gold coin/valuable ovals with exactly three restrained pale-gold glints.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Treasure hoard exactly as described. Preserve the compact five-mass gold pile and only three small glints. No chest, gems, weapons, crown or overflowing treasure mountain.

### 142 — Boss chest

**Canonical cues:** Compact warm-brown chest: rectangular lower box, trapezoidal/sloped lid, vertical gold center band and small rectangular gold latch.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Boss chest exactly as described. Preserve simple box, sloped lid, single gold band and latch. No gems, skull lock, open lid, treasure spill or extra metalwork.

### 143 — Mire pool

**Canonical cues:** Low teal-green oval pool with four thin reed stems around the outer sides and exactly three small olive lily-pad/plant ovals on the surface.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Mire pool exactly as described. Preserve low oval pool, four reeds and three small plant ovals. No water splash, creatures, flowers or surrounding ground.

### 144 — Reed nest

**Canonical cues:** Low olive oval reed nest with repeated diagonal reed sticks around the rim and a darker green oval depression in the center.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Reed nest exactly as described. Preserve low oval nest, repeated reed rim and dark center. No eggs, creature, bones or water.

### 145 — Shell hoard

**Canonical cues:** Small cluster of exactly five pale shell ovals with simple central seam lines and two restrained pale glints.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Shell hoard exactly as described. Preserve five shells, simple seams and two small glints. No coins, pearls, chest, sand or water.

### 146 — Drift seat

**Canonical cues:** Simple driftwood bench: one thick diagonal/log seat from lower-left to upper-right, two short legs and three small pale grain/twig marks.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Drift seat exactly as described. Preserve one driftwood seat log, two legs and three small surface marks. No backrest, cushions, shells or extra driftwood.

### 147 — Ridge hearth

**Canonical cues:** Blocky gray stone hearth: low rectangular base, smaller raised rear block, dark oval fire basin at front center and three small orange flame shapes.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ridge hearth exactly as described. Preserve two-tier stone structure, central fire basin and exactly three flame shapes. No chimney, cooking pot, benches or extra stones.

### 148 — Stone seat

**Canonical cues:** Heavy blocky gray stone chair: wide rectangular seat/base, tall rectangular back, two thick lower side/leg blocks and one pale horizontal trim line on the back.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Stone seat exactly as described. Preserve blocky chair geometry and single pale trim line. No throne spikes, runes, cushions or skulls.

### 149 — Highland trophy rack

**Canonical cues:** Two Highland wooden uprights with one top crossbar and exactly three pale bone trophy points hanging/standing beneath it on thin brown supports.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Highland trophy rack exactly as described. Preserve two posts, one crossbar and exactly three bone trophies. No skulls, animal heads, banners or extra weapons.

### 150 — Ash-beast roost prop

**Canonical cues:** Low brown-gray oval roost with five thin stick-like rim pieces and two darker triangular plate/spike shapes inside.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ash-beast roost prop exactly as described. Preserve low oval roost, five rim sticks and two inner triangular plates. No ash beast, eggs, lava, bones or glow.

### 151 — Abyss hatchery

**Canonical cues:** Low dark brown oval nest with exactly three muted tan oval eggs and two outer stick supports.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Abyss hatchery exactly as described. Preserve low nest, exactly three eggs and two outer sticks. No hatchlings, cracks, flames, treasure or extra eggs.

### 152 — Archive scribe desk

**Canonical cues:** Tilted brown writing desk with two stout legs, sloping surface and pale lower trim. Open pale parchment ledger with central crease and two short illegible strokes on each side; dark right inkpot and pale quill rising toward upper right. No readable text.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Archive scribe desk. Tilted brown writing desk with two stout legs, sloping surface and pale lower trim. Open pale parchment ledger with central crease and two short illegible strokes on each side; dark right inkpot and pale quill rising toward upper right. No readable text. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 153 — Crypt ossuary

**Canonical cues:** Low gray rectangular bone cabinet/box with exactly five small skulls visible across its face/interior and one pale horizontal trim line near the top.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Crypt ossuary exactly as described. Preserve rectangular ossuary, five skulls and one trim line. No candles, bones spilling out, doors, runes or extra skulls.

### 154 — Vale grave lamp

**Canonical cues:** Tall simple metal grave lamp: narrow vertical steel pole, angular muted brown-gray lantern housing near the top and one restrained warm-gold inner light point.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Grave lamp exactly as described. Preserve tall pole, angular lantern housing and single warm light point. No flame plume, chains, grave marker or surrounding glow.

### 155 — Vale caretaker table

**Canonical cues:** Low brown rectangular table with two short legs, one small tan rectangular item on the left and one small muted brown oval item on the right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Caretaker table exactly as described. Preserve low table and exactly two small tabletop items. No chair, skulls, candles, tools or food spread.

### 156 — Highland ore cart

**Canonical cues:** Small brown rectangular mine cart with two dark wheels, three gray ore stones piled along the top and a short wooden handle/shaft projecting to screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Highland ore cart exactly as described. Preserve small cart, two wheels, three ore stones and right-side handle. No rails, worker, extra ore pile or lantern.

### 157 — Highland stone marker

**Canonical cues:** Vertical stack of three rounded gray stones decreasing in size upward, with one short pale carved line across the middle stone.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Highland stone marker exactly as described. Preserve exactly three stacked stones and one pale carved line. No runes, moss, flag, skull or ground patch.

### 158 — Greenwood pup nest

**Canonical cues:** Low tan-olive oval nest with repeated short straw/reed sticks around the rim and exactly two small muted brown oval pup/body shapes resting inside.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Pup nest exactly as described. Preserve low nest, straw rim and exactly two small brown shapes. Do not add detailed wolves, eyes, toys, bones or extra pups.

### 159 — March mud nest

**Canonical cues:** Low dark-brown mud oval with a darker green inner oval depression and four short reed sticks around the rim.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Mud nest exactly as described. Preserve mud oval, green center and four reeds. No eggs, creature, water patch or extra plants.

### 160 — March wallow

**Canonical cues:** Low gray-brown outer oval with a muted teal-green inner wet oval and exactly three small olive mud/plant ovals on the surface.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Wallow exactly as described. Preserve low two-oval structure and exactly three surface marks. No creature, splashes, reeds or ground scenery.


## O. Audit additions — interaction states, missing landmarks and static furnishings

These entries were added only after the second full-renderer audit. They close static-visual gaps that were not present in the initial planning roster.

### 161 — Citadel preparation fountain

**Canonical cues:** Unique interactable: low pale gray stone oval basin, smaller blue-teal water oval inside, narrow pale stone central pedestal, wider pale cap/bowl near the top and one thin cyan vertical water stream above it.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Citadel preparation fountain exactly as described. Preserve one low stone basin, teal inner water, narrow central pedestal, upper pale bowl/cap and one thin cyan water stream. No surrounding floor, guardian statues, runes, coins, plants, extra tiers or healing aura.

### 162 — Field-boss compound marker

**Canonical cues:** Generic `kind:'mini'` world marker used for field compounds: compact gray-green rectangular structure, dark central opening, two taller pale gray-green side pillars/towers and two pale cap blocks along the top.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the field-compound marker exactly as described: compact gray-green block, dark opening, two taller side pillars and pale top caps. No triangular roof, regional emblem, boss symbol, walls, guards, flags or scenery.

### 163 — Dark Lord Tribute cache

**Canonical cues:** Active tribute node: warm dark-brown rectangular chest/base, sloped medium-brown lid, vertical gold center band, small rectangular gold latch and three restrained pale-gold glints.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Dark Lord Tribute cache exactly as described. Preserve brown chest/base, sloped lid, single vertical gold band, small gold latch and only three restrained glints. No coin pile, crown, skull, open lid, text or surrounding ground.

### 164 — Treasury quest cache bundle

**Canonical cues:** Interactable cache bundle: compact tan-brown rectangular crate with two pale diagonal braces crossing the face to form an X.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Treasury quest cache exactly as described: one compact tan-brown rectangular crate and exactly two pale diagonal braces forming an X. No lid opening, coins, rope, emblem, text or extra boxes.

### 165 — Woodland supply cache landmark

**Canonical cues:** Greenwood landmark: one medium brown rectangular crate with two pale crossing braces, plus one thick dark-brown fallen log/branch extending down-left from the crate.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Woodland supply cache landmark exactly as described. Preserve one braced crate and one thick down-left log/branch. No treasure, sacks, trees, grass patch or extra crates.

### 166 — Stranded supply wagon / supply convoy landmark

**Canonical cues:** Shared landmark body: broad brown cart body, two dark wheels, pale tan covered top/canopy and a simple wooden shaft projecting to screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the shared stranded-wagon/convoy landmark exactly as described. Preserve broad cart, two wheels, pale covered top and right-side shaft. No draft animal, driver, cargo pile, banner, road or scenery.

### 167 — Ravine overlook landmark

**Canonical cues:** Three narrow brown wooden posts with one horizontal pale-brown rail across them; two small gray-brown rocks sit low near the center.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ravine overlook marker exactly as described. Preserve three posts, one horizontal rail and exactly two low rocks. No cliff, vista, flag, sign, rope or ground patch.

### 168 — Stonecross ore vein landmark

**Canonical cues:** Three separate gray-brown ore/crystal rock spikes arranged left, center and right, each angular and vertically pointed, with three restrained warm-gold glints.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Stonecross ore vein exactly as described. Preserve exactly three angular gray ore spikes and three small warm-gold glints. No minecart, pickaxe, cave, ground patch or extra crystals.

### 169 — Dark Crown crystal shelf landmark

**Canonical cues:** Three tall purple crystal formations of different heights arranged left, center and right; center is tallest. Muted violet palette with one pale-violet glint near the tall center crystal.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Crystal shelf landmark exactly as described. Preserve exactly three differently sized purple crystal formations, center tallest, and one restrained pale-violet glint. No rock base, lava, runes, extra crystals or ground patch.

### 170 — Open specialist cage

**Canonical cues:** Shared rescued/open cage state: brown rectangular outer cage frame, dark inner opening, five pale steel vertical bars and one pale horizontal crossbar. The right-side cage door is swung open outward. No specialist remains inside and the gold lock is absent.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the open specialist cage exactly as described. Preserve brown rectangular frame, dark interior, five pale vertical bars, one horizontal bar and the right-side door visibly swung open. No prisoner, lock, chains, floor, wall or extra bars.

### 171 — Closed cage — Mira

**Canonical cues:** Closed captive state: brown rectangular cage frame, dark interior, exactly five pale vertical bars, one horizontal crossbar and small gold lower-center lock. Behind the bars is the same current specialist body: Humanoid specialist. Olive-green cloth, dark green cape, brown hair/head covering with pale-gold trim. Tall staff on screen-right topped by a pale green diamond/leaf-like head. Rectangular pale tan item or satchel on screen-left. Teacher trim lines on torso. Screen-left olive shoulder wrap with a pale stitched edge; the existing tan rectangular item remains partly visible beneath it.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Closed cage — Mira. Closed captive state: brown rectangular cage frame, dark interior, exactly five pale vertical bars, one horizontal crossbar and small gold lower-center lock. Behind the bars is the same current specialist body: Humanoid specialist. Olive-green cloth, dark green cape, brown hair/head covering with pale-gold trim. Tall staff on screen-right topped by a pale green diamond/leaf-like head. Rectangular pale tan item or satchel on screen-left. Teacher trim lines on torso. Screen-left olive shoulder wrap with a pale stitched edge; the existing tan rectangular item remains partly visible beneath it. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 172 — Closed cage — Borin

**Production decision:** KEEP PROCEDURAL — DO NOT GENERATE A SPRITE. The old barred-cage proposal is superseded for current Borin. Current captive rendering is a secured workstation, not a cage. Retain this ID for history; use the dedicated current-state decision at the end of this catalog and do not generate obsolete cage art.

### 173 — Closed cage — Sela

**Canonical cues:** Closed captive state: brown rectangular cage frame, dark interior, exactly five pale vertical bars, one horizontal crossbar and small gold lower-center lock. Behind the bars is the same current specialist body: Humanoid specialist. Teal cloth, dark teal cape, dark hair. Pointed hood/hat shape in cape color with pale trim. Tall staff on screen-right topped by a round teal orb/disc. Broad pale-teal screen-left shoulder wrap, diagonal pale strap and a short teal front panel below the belt.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Closed cage — Sela. Closed captive state: brown rectangular cage frame, dark interior, exactly five pale vertical bars, one horizontal crossbar and small gold lower-center lock. Behind the bars is the same current specialist body: Humanoid specialist. Teal cloth, dark teal cape, dark hair. Pointed hood/hat shape in cape color with pale trim. Tall staff on screen-right topped by a round teal orb/disc. Broad pale-teal screen-left shoulder wrap, diagonal pale strap and a short teal front panel below the belt. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 174 — Closed cage — Neri

**Production decision:** KEEP PROCEDURAL — DO NOT GENERATE A SPRITE. The old barred-cage proposal is superseded for current Neri. Current captive rendering is a secured workstation, not a cage. Retain this ID for history; use the dedicated current-state decision at the end of this catalog and do not generate obsolete cage art.

### 175 — Closed cage — Orin

**Canonical cues:** Closed captive state: brown rectangular cage frame, dark interior, exactly five pale vertical bars, one horizontal crossbar and small gold lower-center lock. Behind the bars is the same current specialist body: Humanoid specialist. Earthy olive/tan cloth, muted green-gray cape, dark brown hair. Squared dark cap/hood with pale-gold trim. Pale gray shoulder/chest mantle. Tall staff on screen-right with pale stone/metal triangular head. Broad gray-green shoulder mantle with a scalloped/fringed lower outline and pale vertical seam marks.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Closed cage — Orin. Closed captive state: brown rectangular cage frame, dark interior, exactly five pale vertical bars, one horizontal crossbar and small gold lower-center lock. Behind the bars is the same current specialist body: Humanoid specialist. Earthy olive/tan cloth, muted green-gray cape, dark brown hair. Squared dark cap/hood with pale-gold trim. Pale gray shoulder/chest mantle. Tall staff on screen-right with pale stone/metal triangular head. Broad gray-green shoulder mantle with a scalloped/fringed lower outline and pale vertical seam marks. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 176 — Closed cage — Dara

**Production decision:** KEEP PROCEDURAL — DO NOT GENERATE A SPRITE. The old barred-cage proposal is superseded for current Dara. Current captive rendering is a secured workstation, not a cage. Retain this ID for history; use the dedicated current-state decision at the end of this catalog and do not generate obsolete cage art.

### 177 — Closed cage — Lyss

**Canonical cues:** Closed captive state: brown rectangular cage frame, dark interior, exactly five pale vertical bars, one horizontal crossbar and small gold lower-center lock. Behind the bars is the same current specialist body: Humanoid specialist. Muted red-brown cloth, dark burgundy cape, dark hair. Dark angular helmet/cap. Steel shoulder plates. Tall staff/pole on screen-right topped by a pale-gold diamond/banner-like head. Diagonal gold-tan teaching sash and two uneven red-brown split coat tails that expose the middle of the lower body.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Closed cage — Lyss. Closed captive state: brown rectangular cage frame, dark interior, exactly five pale vertical bars, one horizontal crossbar and small gold lower-center lock. Behind the bars is the same current specialist body: Humanoid specialist. Muted red-brown cloth, dark burgundy cape, dark hair. Dark angular helmet/cap. Steel shoulder plates. Tall staff/pole on screen-right topped by a pale-gold diamond/banner-like head. Diagonal gold-tan teaching sash and two uneven red-brown split coat tails that expose the middle of the lower body. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 178 — Closed cage — Eren

**Canonical cues:** Closed captive state: brown rectangular cage frame, dark interior, exactly five pale vertical bars, one horizontal crossbar and small gold lower-center lock. Behind the bars is the same current specialist body: Humanoid specialist. Muted violet-gray cloth, dark purple cape, gray-violet hair/head shape. Dark angular cap/hood. Brown-violet rectangular satchel/item on screen-left. Tall staff on screen-right with a large purple diamond-shaped head and pale inner line. Asymmetric violet work apron with a pale diagonal seam and a flat pale-purple diamond inset; pale side seam at screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Closed cage — Eren. Closed captive state: brown rectangular cage frame, dark interior, exactly five pale vertical bars, one horizontal crossbar and small gold lower-center lock. Behind the bars is the same current specialist body: Humanoid specialist. Muted violet-gray cloth, dark purple cape, gray-violet hair/head shape. Dark angular cap/hood. Brown-violet rectangular satchel/item on screen-left. Tall staff on screen-right with a large purple diamond-shaped head and pale inner line. Asymmetric violet work apron with a pale diagonal seam and a flat pale-purple diamond inset; pale side seam at screen-right. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 179 — Closed cage — Vera

**Canonical cues:** Closed captive state: brown rectangular cage frame, dark interior, exactly five pale vertical bars, one horizontal crossbar and small gold lower-center lock. Behind the bars is the same current specialist body: Humanoid specialist. Warm brown/tan cloth, dark brown-gray cape, pale blond/white hair. Heavy brown apron/chest block with tan inset and pale trim. Long-handled hammer on screen-right with a broad pale steel rectangular head. Broad pale-metal screen-left shoulder guard, asymmetric dark leather screen-right apron panel and one pale lower apron seam.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Closed cage — Vera. Closed captive state: brown rectangular cage frame, dark interior, exactly five pale vertical bars, one horizontal crossbar and small gold lower-center lock. Behind the bars is the same current specialist body: Humanoid specialist. Warm brown/tan cloth, dark brown-gray cape, pale blond/white hair. Heavy brown apron/chest block with tan inset and pale trim. Long-handled hammer on screen-right with a broad pale steel rectangular head. Broad pale-metal screen-left shoulder guard, asymmetric dark leather screen-right apron panel and one pale lower apron seam. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 180 — Closed cage — Tovan

**Canonical cues:** Closed captive state: brown rectangular cage frame, dark interior, exactly five pale vertical bars, one horizontal crossbar and small gold lower-center lock. Behind the bars is the same current specialist body: Humanoid specialist. Cool gray-blue cloth, dark slate cape, pale gray hair. Tall angular pale headpiece/hood with gold trim. Long staff on screen-right with a round gold head. Gold diamond chest mark. Long pale blue-gray split front robe panels with gold vertical edges. Keep the existing chest mark and tall staff.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Closed cage — Tovan. Closed captive state: brown rectangular cage frame, dark interior, exactly five pale vertical bars, one horizontal crossbar and small gold lower-center lock. Behind the bars is the same current specialist body: Humanoid specialist. Cool gray-blue cloth, dark slate cape, pale gray hair. Tall angular pale headpiece/hood with gold trim. Long staff on screen-right with a round gold head. Gold diamond chest mark. Long pale blue-gray split front robe panels with gold vertical edges. Keep the existing chest mark and tall staff. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 181 — Dungeon torch

**Canonical cues:** Simple vertical brown-gray torch shaft with a compact two-layer orange/yellow flame at its upper end.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render one canonical dungeon torch: straight shaft and compact two-layer flame. No wall bracket, smoke, floor, extra flames or aura.

### 182 — Crypt coffin

**Canonical cues:** Muted gray-green tapered coffin: wider shoulders, narrower foot, pale horizontal short line near upper face and one pale vertical line down the center.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Crypt coffin exactly as described. No corpse, skull, candles, runes, open lid or surrounding floor.

### 183 — Loose bones prop

**Canonical cues:** One small ivory skull at screen-left plus two thick crossed long bones extending across the lower/right area.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the loose-bones prop exactly as described: one small skull and exactly two crossed long bones. No pile, extra bones, blood or ground.

### 184 — Standard dungeon banner

**Canonical cues:** Tall steel-gray pole with one muted brown hanging banner to screen-right, pointed/irregular lower edge and one simple vertical gold mark.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the standard dungeon banner exactly as described. No readable emblem beyond the single vertical gold mark, no second flag, floor or wall.

### 185 — Dark Crown dungeon banner

**Canonical cues:** Tall steel-gray pole with one muted purple hanging banner to screen-right, pointed/irregular lower edge and one simple vertical gold mark.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Dark Crown dungeon banner exactly as described. No crown symbol, text, extra flags or scenery.

### 186 — Archive shelf

**Canonical cues:** Tall rectangular brown shelving unit with three horizontal shelves and small alternating muted teal/brown book-or-container rectangles arranged across the shelves.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Archive shelf exactly as described. Preserve tall rectangular shelf, three shelves and compact alternating muted contents. No loose books, ladder, desk or wall.

### 187 — Generic braced crate

**Canonical cues:** Medium warm-brown rectangular crate with two pale diagonal braces crossing the front in an X.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render one canonical braced crate exactly as described. No label, metal corners, open lid, contents or extra crate.

### 188 — Mine crystal prop

**Canonical cues:** Exactly three slim blue-gray crystal spikes arranged left, center and right, each vertically faceted and pointed, with no rock base.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly three canonical Mine crystal spikes as described. No glowing aura, rock base, extra shards or ground patch.

### 189 — Hanging chain

**Canonical cues:** Vertical series of repeated pale steel oval chain links ending in one larger dark-gray oval/ring at the bottom.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the hanging chain exactly as described. Preserve repeated oval links and one larger bottom ring. No hook, wall, prisoner or extra chain.

### 190 — Ember bed

**Canonical cues:** Low dark charcoal oval bed with exactly three short muted orange-red flame/ember triangles rising from it.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the ember bed exactly as described. No logs, brazier rim, smoke, ground patch or extra flames.

### 191 — Armor display

**Canonical cues:** Static humanoid armor display in muted blue-gray steel tones, mounted above a low dark rectangular stand and carrying a muted gray-blue shield on screen-left.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the armor display exactly as described. It is an empty display/mannequin, not a living soldier. Preserve steel humanoid silhouette, low stand and left shield. No sword, face, banner or room scenery.

### 192 — Warm brazier

**Canonical cues:** Low dark-brown oval brazier with exactly three warm orange flame triangles and one small pale-gold center glint.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the warm brazier exactly as described. No tall legs, chains, smoke, surrounding light pool or extra fire.

### 193 — Dark Crown brazier

**Canonical cues:** Low dark purple-gray oval brazier with exactly three muted red-purple flame triangles and two restrained warm glints.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Dark Crown brazier exactly as described. No spikes, chains, smoke, skulls or aura.

### 194 — Vale animal pen

**Canonical cues:** Simple small wooden pen: two upright side posts, two horizontal rails, with exactly two small muted-brown animal/body ovals low inside.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Vale animal pen exactly as described. Preserve two posts, two rails and two simple small animal/body ovals. Do not invent identifiable livestock species, roof, gate or scenery.

### 195 — Vale drying rack

**Canonical cues:** Two Greenwood wooden posts with top crossbar; exactly three hanging rectangular cloth/items suspended by thin lines, center item muted teal and side items muted brown/tan.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Vale drying rack exactly as described. No laundry line beyond the rack, people, baskets or extra cloth.

### 196 — Marches drying rack

**Canonical cues:** Same two-post drying-rack geometry as the canonical prop but using the darker Flooded Marches local wood; exactly three hanging rectangular cloth/items suspended by thin lines.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Marches drying rack exactly as described. Preserve two darker wetland-wood posts, top bar and exactly three hanging items. No extra cloth, fish, people or scenery.

### 197 — Cookfire

**Canonical cues:** Three crossed dark-brown log lines over a low dark oval fire bed, with exactly three orange flame triangles and one small pale-gold center glint.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the cookfire exactly as described. No cooking pot, stones, smoke, ground patch or extra logs.

### 198 — Sleep roll

**Canonical cues:** Low brown bedroll with raised pale pillow on screen-left, angular folded blanket covering the right half, two pale blanket seams, one dark tie toward screen-right and narrow dark base edge. Blanket is muted teal in Marches, violet-gray in Dark Crown and tan elsewhere.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Sleep roll. Low brown bedroll with raised pale pillow on screen-left, angular folded blanket covering the right half, two pale blanket seams, one dark tie toward screen-right and narrow dark base edge. Blanket is muted teal in Marches, violet-gray in Dark Crown and tan elsewhere. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 199 — Stolen goods pile

**Canonical cues:** Two overlapping warm-brown rectangular crates/boxes, one muted green folded/triangular cloth item and one short steel object projecting at screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the stolen-goods pile exactly as described. Preserve exactly two box masses, one muted green item and one short steel object. No coins, weapons pile, sacks or extra loot.

### 200 — Bone pile

**Canonical cues:** Compact cluster of four crossed ivory bone sets with one small skull near the upper-left/center.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the bone pile exactly as described. Preserve four compact bone groupings and one small skull. No giant skeleton, blood, grave marker or ground patch.

### 201 — Grave marker

**Canonical cues:** Tall muted gray stone grave marker with rectangular lower body, pointed triangular top and a simple pale cross made from one vertical and one horizontal line.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the grave marker exactly as described. No name text, moss, flowers, candles, skull or ground.

### 202 — Marches fishing net

**Canonical cues:** Two wetland-wood posts with a hanging pale net drawn as a simple crisscross mesh between them.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Marches fishing net exactly as described. Preserve two posts and one simple crisscross net. No fish, dock, water, floats or extra ropes.

### 203 — Highland tool rack

**Canonical cues:** Highland timber work-tool rack with two thick uprights, broad top and lower rails, steel-headed hammer on screen-left, wooden-handled shovel with broad steel blade in the middle and paired steel tongs on screen-right. The tools have different silhouettes.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Highland tool rack. Highland timber work-tool rack with two thick uprights, broad top and lower rails, steel-headed hammer on screen-left, wooden-handled shovel with broad steel blade in the middle and paired steel tongs on screen-right. The tools have different silhouettes. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 204 — Supply stack

**Canonical cues:** Exactly four overlapping warm-brown supply boxes/crates arranged as a compact stack, each with one pale diagonal brace.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the supply stack exactly as described. Preserve four boxes and one diagonal brace per box. No sacks, barrels, labels or extra crates.

### 205 — Archive scroll stack

**Canonical cues:** Exactly five small pale parchment scroll bundles arranged in a compact pile, each as a short rolled rectangle with darker roll-end detail.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Archive scroll stack exactly as described. Preserve exactly five scroll bundles. No books, shelf, desk, loose sheets or ink.

### 206 — Woodpile

**Canonical cues:** Exactly five short brown logs arranged in a compact overlapping pile, each with a pale circular cut end visible on one side.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the woodpile exactly as described. Preserve five logs and visible cut ends. No axe, stump, fire, fence or ground.

### 207 — Laundry line

**Canonical cues:** Two simple wooden posts with one pale clothesline and exactly two hanging cloth rectangles, one muted blue-gray and one muted red-brown.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the laundry line exactly as described. Preserve two posts, one line and exactly two cloth pieces. No basket, people, extra laundry or house.

### 208 — Barrel

**Canonical cues:** Single upright warm-brown barrel with oval top and bottom and exactly two pale metal/wood bands around the body.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render one canonical barrel exactly as described. No tap, rope, label, cargo or extra barrels.

### 209 — Small handcart

**Canonical cues:** Low warm-brown rectangular cart with two dark wheels, a raised shallow cargo box and one short wooden shaft projecting to screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the small handcart exactly as described. No animal, cargo pile, person, canopy or road.

### 210 — Ration stack

**Canonical cues:** Exactly three small warm-brown wrapped ration parcels/boxes arranged in a compact cluster, each with one pale diagonal tie/brace.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the ration stack exactly as described. Preserve exactly three parcels and their simple diagonal ties. No food exposed, sacks, basket or table.

### 211 — Garden patch

**Canonical cues:** Five thin green plant stems in a row with small muted green/tan leaf/produce ovals and one simple brown baseline/soil line.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the garden patch exactly as described. Preserve five stems and simple baseline. No fence, flowers beyond the small canonical ovals, watering can or ground field.

### 212 — Barricade

**Canonical cues:** Exactly four short pointed dark-brown wooden stakes/posts in a row with one thicker diagonal brown brace crossing the front.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the barricade exactly as described. Preserve four pointed stakes and one diagonal brace. No spikes beyond the four, sandbags, banner or ground.

### 213 — Frontier field kitchen

**Canonical cues:** Frontier field kitchen: low muted stone/brown hearth with compact warm fire beneath a hanging gray cauldron. Two stout wood posts and upper beam support a short central chain. Pot has pale rolled rim and side seam, ladle hangs at screen-right, pale food box at screen-left. Keep deterministic local repair marks restrained.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Frontier field kitchen. Frontier field kitchen: low muted stone/brown hearth with compact warm fire beneath a hanging gray cauldron. Two stout wood posts and upper beam support a short central chain. Pot has pale rolled rim and side seam, ladle hangs at screen-right, pale food box at screen-left. Keep deterministic local repair marks restrained. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 214 — Dark Crown field kitchen

**Canonical cues:** Dark Crown field kitchen: low muted stone/brown hearth with compact warm fire beneath a hanging gray cauldron. Two slate-gray wood posts and upper beam support a short central chain. Pot has pale rolled rim and side seam, ladle hangs at screen-right, pale food box at screen-left.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Dark Crown field kitchen. Dark Crown field kitchen: low muted stone/brown hearth with compact warm fire beneath a hanging gray cauldron. Two slate-gray wood posts and upper beam support a short central chain. Pot has pale rolled rim and side seam, ladle hangs at screen-right, pale food box at screen-left. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 215 — Frontier bunk

**Canonical cues:** Frontier single low timber bunk with four visible corner-post segments, pale mattress and left pillow, warm rust blanket over the right half with one pale vertical stripe, short head/foot rails and dark lower bed-frame seam. Not a stacked bunk bed.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Frontier bunk. Frontier single low timber bunk with four visible corner-post segments, pale mattress and left pillow, warm rust blanket over the right half with one pale vertical stripe, short head/foot rails and dark lower bed-frame seam. Not a stacked bunk bed. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 216 — Dark Crown bunk

**Canonical cues:** Dark Crown single low timber bunk with four visible corner-post segments, pale mattress and left pillow, violet blanket over the right half with one pale vertical stripe, short head/foot rails and dark lower bed-frame seam. Not a stacked bunk bed.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Dark Crown bunk. Dark Crown single low timber bunk with four visible corner-post segments, pale mattress and left pillow, violet blanket over the right half with one pale vertical stripe, short head/foot rails and dark lower bed-frame seam. Not a stacked bunk bed. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 217 — March ritual table

**Canonical cues:** Marches pale green-gray ritual stone slab with chamfered corners on a short rectangular pedestal, pale lower slab edge and pale inset seam on the pedestal. Central flat purple diamond plate with small warm oval inset; two pale unlit candles on dark holders at either side.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one March ritual table. Marches pale green-gray ritual stone slab with chamfered corners on a short rectangular pedestal, pale lower slab edge and pale inset seam on the pedestal. Central flat purple diamond plate with small warm oval inset; two pale unlit candles on dark holders at either side. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 218 — Frontier ritual table

**Canonical cues:** Frontier warm gray-brown ritual stone slab with chamfered corners on a short rectangular pedestal, pale lower slab edge and pale inset seam on the pedestal. Central flat purple diamond plate with small warm oval inset; two pale unlit candles on dark holders at either side.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Frontier ritual table. Frontier warm gray-brown ritual stone slab with chamfered corners on a short rectangular pedestal, pale lower slab edge and pale inset seam on the pedestal. Central flat purple diamond plate with small warm oval inset; two pale unlit candles on dark holders at either side. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 219 — Vale tax post

**Canonical cues:** Tall regional wooden post (#806044) with a rectangular muted-brown notice board near the top, exactly three pale horizontal writing lines and one small dark-brown box attached low on screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Vale tax post exactly as described using wood #806044. Preserve one tall post, one rectangular notice board, exactly three pale horizontal lines and one small lower-right box. No readable text, coins, flags, guards or extra notices.

### 220 — Marches tax post

**Canonical cues:** Tall regional wooden post (#71654f) with a rectangular muted-brown notice board near the top, exactly three pale horizontal writing lines and one small dark-brown box attached low on screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Marches tax post exactly as described using wood #71654f. Preserve one tall post, one rectangular notice board, exactly three pale horizontal lines and one small lower-right box. No readable text, coins, flags, guards or extra notices.

### 221 — Highlands tax post

**Canonical cues:** Tall regional wooden post (#71695b) with a rectangular muted-brown notice board near the top, exactly three pale horizontal writing lines and one small dark-brown box attached low on screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Highlands tax post exactly as described using wood #71695b. Preserve one tall post, one rectangular notice board, exactly three pale horizontal lines and one small lower-right box. No readable text, coins, flags, guards or extra notices.

### 222 — Frontier tax post

**Canonical cues:** Tall regional wooden post (#614f46) with a rectangular muted-brown notice board near the top, exactly three pale horizontal writing lines and one small dark-brown box attached low on screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Frontier tax post exactly as described using wood #614f46. Preserve one tall post, one rectangular notice board, exactly three pale horizontal lines and one small lower-right box. No readable text, coins, flags, guards or extra notices.

### 223 — Dark Crown tax post

**Canonical cues:** Tall regional wooden post (#555563) with a rectangular muted-brown notice board near the top, exactly three pale horizontal writing lines and one small dark-brown box attached low on screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Dark Crown tax post exactly as described using wood #555563. Preserve one tall post, one rectangular notice board, exactly three pale horizontal lines and one small lower-right box. No readable text, coins, flags, guards or extra notices.

### 224 — Vale lean-to

**Canonical cues:** Simple regional lean-to made from two upright wooden posts (#806044), one broad uneven muted-brown slanted roof/canopy and one low dark-brown rectangular rear/storage block.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Vale lean-to exactly as described using regional wood #806044. Preserve two posts, one uneven slanted canopy and one low rear/storage block. No occupants, fire, bedrolls, crates, banner or scenery.

### 225 — Marches lean-to

**Canonical cues:** Simple regional lean-to made from two upright wooden posts (#71654f), one broad uneven muted-brown slanted roof/canopy and one low dark-brown rectangular rear/storage block.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Marches lean-to exactly as described using regional wood #71654f. Preserve two posts, one uneven slanted canopy and one low rear/storage block. No occupants, fire, bedrolls, crates, banner or scenery.

### 226 — Highlands lean-to

**Canonical cues:** Simple regional lean-to made from two upright wooden posts (#71695b), one broad uneven muted-brown slanted roof/canopy and one low dark-brown rectangular rear/storage block.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Highlands lean-to exactly as described using regional wood #71695b. Preserve two posts, one uneven slanted canopy and one low rear/storage block. No occupants, fire, bedrolls, crates, banner or scenery.

### 227 — Frontier lean-to

**Canonical cues:** Simple regional lean-to made from two upright wooden posts (#614f46), one broad uneven muted-brown slanted roof/canopy and one low dark-brown rectangular rear/storage block.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Frontier lean-to exactly as described using regional wood #614f46. Preserve two posts, one uneven slanted canopy and one low rear/storage block. No occupants, fire, bedrolls, crates, banner or scenery.

## V0.8.79 — Distinct occupied side-interior entrances

### 228 — Drowned Watchhouse entrance

**Canonical cues:** Raised weathered gray-green timber watchhouse on four short posts. Uneven teal roof with a broken middle/right slope, vertical wall planks, dark central rectangular doorway, small right window with pale crossbar, a broad timber front landing and a shorter front step. Two restrained side reed stalks.

**Runtime sprite key:** `dungeon:side-march-watchhouse`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Drowned Watchhouse entrance. Raised weathered gray-green timber watchhouse on four short posts. Uneven teal roof with a broken middle/right slope, vertical wall planks, dark central rectangular doorway, small right window with pale crossbar, a broad timber front landing and a shorter front step. Two restrained side reed stalks. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 229 — Old Signal Keep entrance

**Canonical cues:** Compact gray-green stone keep with four square battlements, dark lower central doorway, two small upper slit windows, visible masonry courses, a tall central signal pole with a short tan flag extending right, crack in the right wall and attached angular fallen stone at lower left.

**Runtime sprite key:** `dungeon:side-highlands-signal`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Old Signal Keep entrance. Compact gray-green stone keep with four square battlements, dark lower central doorway, two small upper slit windows, visible masonry courses, a tall central signal pole with a short tan flag extending right, crack in the right wall and attached angular fallen stone at lower left. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 230 — Ruined Shrine entrance

**Canonical cues:** Broken warm stone shrine portico: two narrow pillars with pale capitals, fractured triangular pediment with an irregular central break, dark inner doorway partly crossed by one diagonal occupation timber, tall right-side pole with a small muted-red pennant and a small broken stone at screen-left.

**Runtime sprite key:** `dungeon:side-frontier-shrine`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Ruined Shrine entrance. Broken warm stone shrine portico: two narrow pillars with pale capitals, fractured triangular pediment with an irregular central break, dark inner doorway partly crossed by one diagonal occupation timber, tall right-side pole with a small muted-red pennant and a small broken stone at screen-left. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

### 231 — Ruined Foundry entrance

**Canonical cues:** Compact slate working repair-hall facade with low trapezoidal roof and tall squared chimney at screen-right. Dark wide doorway between two pale metal uprights, broad pale lintel, small left furnace/window opening with warm horizontal inset, flat pale-metal anvil-shaped roof plaque and small attached left-side repair support.

**Runtime sprite key:** `dungeon:side-crown-foundry`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Ruined Foundry entrance. Compact slate working repair-hall facade with low trapezoidal roof and tall squared chimney at screen-right. Dark wide doorway between two pale metal uprights, broad pale lintel, small left furnace/window opening with warm horizontal inset, flat pale-metal anvil-shaped roof plaque and small attached left-side repair support. Treat all listed furnishings or equipment as attached parts of this one asset. Preserve the current screen-left/screen-right arrangement. Do not add occupants, new symbols, additional equipment, surrounding scenery or effects.

## End of production catalog

The catalog is intentionally explicit so the generation phase never has to improvise visual design. If an asset cannot be generated without inventing information, stop that asset and return it to documentation/audit rather than filling the gap creatively.

## P. Current-map additions and corrected states · 8 October 2026

These entries were reconciled from current production code and authored placement, not inferred from lore. Each generation still requires its current screenshot/reference and exact state. New IDs append without renumbering existing assets.

### 232 — Greenwood Full Barracks

**Canonical cues:** Current Full expedition camp, same reserved footprint as Basic: low central open-flap tent, additional smaller sleeping tent on screen-left, extra bedrolls, open command canopy above a low map table, supply/gear corner on screen-right, shield, weapon rack, communal cookfire, banner/lamps and added seating/supplies. Regional materials: brown-tan canvas and warm pale trim; small grass/flower accents. This is a camp, never a shop or masonry fort.

**Runtime sprite key:** `building:barracks:vale:full`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Greenwood Full Barracks. Current Full expedition camp, same reserved footprint as Basic: low central open-flap tent, additional smaller sleeping tent on screen-left, extra bedrolls, open command canopy above a low map table, supply/gear corner on screen-right, shield, weapon rack, communal cookfire, banner/lamps and added seating/supplies. Regional materials: brown-tan canvas and warm pale trim; small grass/flower accents. This is a camp, never a shop or masonry fort. All listed parts belong to this single current asset. Match the current reference proportions, orientation, equipment, palette and apparent gameplay size. Keep procedural grounding shadows out of the image; preserve intrinsic material marks only.

### 233 — Marches Full Barracks

**Canonical cues:** Current Full expedition camp, same reserved footprint as Basic: low central open-flap tent, additional smaller sleeping tent on screen-left, extra bedrolls, open command canopy above a low map table, supply/gear corner on screen-right, shield, weapon rack, communal cookfire, banner/lamps and added seating/supplies. Regional materials: muted green-gray canvas, teal bedding, reed details and damp-ground timber edge. This is a camp, never a shop or masonry fort.

**Runtime sprite key:** `building:barracks:march:full`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Marches Full Barracks. Current Full expedition camp, same reserved footprint as Basic: low central open-flap tent, additional smaller sleeping tent on screen-left, extra bedrolls, open command canopy above a low map table, supply/gear corner on screen-right, shield, weapon rack, communal cookfire, banner/lamps and added seating/supplies. Regional materials: muted green-gray canvas, teal bedding, reed details and damp-ground timber edge. This is a camp, never a shop or masonry fort. All listed parts belong to this single current asset. Match the current reference proportions, orientation, equipment, palette and apparent gameplay size. Keep procedural grounding shadows out of the image; preserve intrinsic material marks only.

### 234 — Highlands Full Barracks

**Canonical cues:** Current Full expedition camp, same reserved footprint as Basic: low central open-flap tent, additional smaller sleeping tent on screen-left, extra bedrolls, open command canopy above a low map table, supply/gear corner on screen-right, shield, weapon rack, communal cookfire, banner/lamps and added seating/supplies. Regional materials: gray-olive canvas, muted stone markers and alpine timber. This is a camp, never a shop or masonry fort.

**Runtime sprite key:** `building:barracks:highlands:full`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Highlands Full Barracks. Current Full expedition camp, same reserved footprint as Basic: low central open-flap tent, additional smaller sleeping tent on screen-left, extra bedrolls, open command canopy above a low map table, supply/gear corner on screen-right, shield, weapon rack, communal cookfire, banner/lamps and added seating/supplies. Regional materials: gray-olive canvas, muted stone markers and alpine timber. This is a camp, never a shop or masonry fort. All listed parts belong to this single current asset. Match the current reference proportions, orientation, equipment, palette and apparent gameplay size. Keep procedural grounding shadows out of the image; preserve intrinsic material marks only.

### 235 — Frontier Full Barracks

**Canonical cues:** Current Full expedition camp, same reserved footprint as Basic: low central open-flap tent, additional smaller sleeping tent on screen-left, extra bedrolls, open command canopy above a low map table, supply/gear corner on screen-right, shield, weapon rack, communal cookfire, banner/lamps and added seating/supplies. Regional materials: patched rust-brown canvas, scorched braces and warm ember details. This is a camp, never a shop or masonry fort.

**Runtime sprite key:** `building:barracks:frontier:full`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Frontier Full Barracks. Current Full expedition camp, same reserved footprint as Basic: low central open-flap tent, additional smaller sleeping tent on screen-left, extra bedrolls, open command canopy above a low map table, supply/gear corner on screen-right, shield, weapon rack, communal cookfire, banner/lamps and added seating/supplies. Regional materials: patched rust-brown canvas, scorched braces and warm ember details. This is a camp, never a shop or masonry fort. All listed parts belong to this single current asset. Match the current reference proportions, orientation, equipment, palette and apparent gameplay size. Keep procedural grounding shadows out of the image; preserve intrinsic material marks only.

### 236 — Dark Crown Full Barracks

**Canonical cues:** Current Full expedition camp, same reserved footprint as Basic: low central open-flap tent, additional smaller sleeping tent on screen-left, extra bedrolls, open command canopy above a low map table, supply/gear corner on screen-right, shield, weapon rack, communal cookfire, banner/lamps and added seating/supplies. Regional materials: slate-purple canvas, restrained obsidian braces and small purple camp emblem. This is a camp, never a shop or masonry fort.

**Runtime sprite key:** `building:barracks:crown:full`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Dark Crown Full Barracks. Current Full expedition camp, same reserved footprint as Basic: low central open-flap tent, additional smaller sleeping tent on screen-left, extra bedrolls, open command canopy above a low map table, supply/gear corner on screen-right, shield, weapon rack, communal cookfire, banner/lamps and added seating/supplies. Regional materials: slate-purple canvas, restrained obsidian braces and small purple camp emblem. This is a camp, never a shop or masonry fort. All listed parts belong to this single current asset. Match the current reference proportions, orientation, equipment, palette and apparent gameplay size. Keep procedural grounding shadows out of the image; preserve intrinsic material marks only.

### 237 — Highlands payroll station

**Canonical cues:** Broad muted timber pay table; pale ledger with three ruled lines on screen-left, three small gold crowns on screen-right, raised small framed payroll notice at left/back, one already-authored small worker on screen-right in green-gray work clothing. Keep the worker attached as part of this exact static station; add no queue or new people.

**Runtime sprite key:** `prop:highland-pay-station:highlands`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Highlands payroll station. Broad muted timber pay table; pale ledger with three ruled lines on screen-left, three small gold crowns on screen-right, raised small framed payroll notice at left/back, one already-authored small worker on screen-right in green-gray work clothing. Keep the worker attached as part of this exact static station; add no queue or new people. All listed parts belong to this single current asset. Match the current reference proportions, orientation, equipment, palette and apparent gameplay size. Keep procedural grounding shadows out of the image; preserve intrinsic material marks only.

### 238 — Highlands ore-sorting bay

**Canonical cues:** Three timber ore bins with paired muted gray-tan angular ore heaps; thin horizontal steel weighing beam above, central upright, two hanging shallow balance pans at left and right.

**Runtime sprite key:** `prop:ore-sorting-bay:highlands`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Highlands ore-sorting bay. Three timber ore bins with paired muted gray-tan angular ore heaps; thin horizontal steel weighing beam above, central upright, two hanging shallow balance pans at left and right. All listed parts belong to this single current asset. Match the current reference proportions, orientation, equipment, palette and apparent gameplay size. Keep procedural grounding shadows out of the image; preserve intrinsic material marks only.

### 239 — Stonecross mint workbench

**Canonical cues:** Broad low timber workbench, two steel press uprights, dark gray horizontal cap, centered vertical striking shaft and cross handle, muted metal base/anvil, one gold striking disc and three small gold coins on screen-left, narrow brown block at right. A small manual press, no industrial machinery or large hoard.

**Runtime sprite key:** `prop:mint-workbench:highlands`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Stonecross mint workbench. Broad low timber workbench, two steel press uprights, dark gray horizontal cap, centered vertical striking shaft and cross handle, muted metal base/anvil, one gold striking disc and three small gold coins on screen-left, narrow brown block at right. A small manual press, no industrial machinery or large hoard. All listed parts belong to this single current asset. Match the current reference proportions, orientation, equipment, palette and apparent gameplay size. Keep procedural grounding shadows out of the image; preserve intrinsic material marks only.

### 240 — Highlands loaded caravan cart

**Canonical cues:** Wide timber cart with two dark circular wheels, two brown sealed crates of different heights, pale horizontal load seam, forward timber shaft at screen-right and one small pale sealed paper on the right crate.

**Runtime sprite key:** `prop:caravan-loading-bay:highlands`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Highlands loaded caravan cart. Wide timber cart with two dark circular wheels, two brown sealed crates of different heights, pale horizontal load seam, forward timber shaft at screen-right and one small pale sealed paper on the right crate. All listed parts belong to this single current asset. Match the current reference proportions, orientation, equipment, palette and apparent gameplay size. Keep procedural grounding shadows out of the image; preserve intrinsic material marks only.

### 241 — Mine old-cut marker

**Canonical cues:** Single irregular tall gray-green cut-stone fragment, pale angular diamond-like old cut marking and short horizontal lower seam. No invented runes, text, glowing magic or historical symbols.

**Runtime sprite key:** `prop:mine-old-markings:highlands`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Mine old-cut marker. Single irregular tall gray-green cut-stone fragment, pale angular diamond-like old cut marking and short horizontal lower seam. No invented runes, text, glowing magic or historical symbols. All listed parts belong to this single current asset. Match the current reference proportions, orientation, equipment, palette and apparent gameplay size. Keep procedural grounding shadows out of the image; preserve intrinsic material marks only.

### 242 — Ridge supper table

**Canonical cues:** Low wide timber table with two visible supports, two pale oval plates toward left and right, central dark bowl with muted tan food, brown vessel and pale neck at screen-right. No extra diners or feast.

**Runtime sprite key:** `prop:ridge-supper:highlands`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Ridge supper table. Low wide timber table with two visible supports, two pale oval plates toward left and right, central dark bowl with muted tan food, brown vessel and pale neck at screen-right. No extra diners or feast. All listed parts belong to this single current asset. Match the current reference proportions, orientation, equipment, palette and apparent gameplay size. Keep procedural grounding shadows out of the image; preserve intrinsic material marks only.

### 243 — Ridge tabletop game corner

**Canonical cues:** Broad low timber game table with exactly a four-by-four alternating dark tan/pale tan board, three small pale/dark counters/pieces and one gray-green low seat block at each side. Preserve current counter placement; no chess set redesign.

**Runtime sprite key:** `prop:ridge-game-corner:highlands`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Ridge tabletop game corner. Broad low timber game table with exactly a four-by-four alternating dark tan/pale tan board, three small pale/dark counters/pieces and one gray-green low seat block at each side. Preserve current counter placement; no chess set redesign. All listed parts belong to this single current asset. Match the current reference proportions, orientation, equipment, palette and apparent gameplay size. Keep procedural grounding shadows out of the image; preserve intrinsic material marks only.

### 244 — Ridge private study table

**Canonical cues:** Low timber study table, large pale open ruled ledger left-center, small pale sealed letter on screen-right with muted purple-red seal, diagonal pale quill, pale candle toward screen-left and its small intrinsic warm point. No new writing or large treasury piles.

**Runtime sprite key:** `prop:ridge-study:highlands`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Ridge private study table. Low timber study table, large pale open ruled ledger left-center, small pale sealed letter on screen-right with muted purple-red seal, diagonal pale quill, pale candle toward screen-left and its small intrinsic warm point. No new writing or large treasury piles. All listed parts belong to this single current asset. Match the current reference proportions, orientation, equipment, palette and apparent gameplay size. Keep procedural grounding shadows out of the image; preserve intrinsic material marks only.

### 245 — Ridge private bed

**Canonical cues:** Low timber bed frame with broad headboard, muted green-gray blanket, pale tan upper pillow/bedding band and one pale lower horizontal blanket seam. No canopy, occupants, extra pillows or new furniture.

**Runtime sprite key:** `prop:ridge-bed:highlands`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Ridge private bed. Low timber bed frame with broad headboard, muted green-gray blanket, pale tan upper pillow/bedding band and one pale lower horizontal blanket seam. No canopy, occupants, extra pillows or new furniture. All listed parts belong to this single current asset. Match the current reference proportions, orientation, equipment, palette and apparent gameplay size. Keep procedural grounding shadows out of the image; preserve intrinsic material marks only.

### 246 — Crag Tyrant bedding and bowl

**Canonical cues:** Low brown oval bedding with smaller pale tan inner cushion, one steel-gray shallow water bowl attached at screen-right, pale diagonal blanket seam at left. No Wolf occupant, bones or trophies.

**Runtime sprite key:** `prop:crag-rest:highlands`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Crag Tyrant bedding and bowl. Low brown oval bedding with smaller pale tan inner cushion, one steel-gray shallow water bowl attached at screen-right, pale diagonal blanket seam at left. No Wolf occupant, bones or trophies. All listed parts belong to this single current asset. Match the current reference proportions, orientation, equipment, palette and apparent gameplay size. Keep procedural grounding shadows out of the image; preserve intrinsic material marks only.

### 247 — Royal aerial planning table

**Canonical cues:** Angled broad brown timber tabletop with two supports, pale inset map, three muted purple compact dragon-formation marks, connected purple route strokes, pale map divisions and small upright purple-bound planning book on screen-right. No new maps, labels or extra dragons outside the map.

**Runtime sprite key:** `prop:flight-planning-table:frontier`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Royal aerial planning table. Angled broad brown timber tabletop with two supports, pale inset map, three muted purple compact dragon-formation marks, connected purple route strokes, pale map divisions and small upright purple-bound planning book on screen-right. No new maps, labels or extra dragons outside the map. All listed parts belong to this single current asset. Match the current reference proportions, orientation, equipment, palette and apparent gameplay size. Keep procedural grounding shadows out of the image; preserve intrinsic material marks only.

### 248 — Royal flight harness station

**Canonical cues:** Two brown timber uprights and crossbeam; one suspended muted purple-brown saddle with tan inset, two tan hanging harness/stirrup loops with small pale metal fittings, low brown tool block and diagonal pale maintenance tool. Flight equipment, not restraints or a prisoner rack.

**Runtime sprite key:** `prop:flight-harness-station:frontier`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Royal flight harness station. Two brown timber uprights and crossbeam; one suspended muted purple-brown saddle with tan inset, two tan hanging harness/stirrup loops with small pale metal fittings, low brown tool block and diagonal pale maintenance tool. Flight equipment, not restraints or a prisoner rack. All listed parts belong to this single current asset. Match the current reference proportions, orientation, equipment, palette and apparent gameplay size. Keep procedural grounding shadows out of the image; preserve intrinsic material marks only.

### 249 — Royal purple dragon standard

**Canonical cues:** Tall warm timber pole on screen-left with small gold diamond finial; one purple banner extending screen-right with pale purple angular dragon-wing emblem and small pale gold central Crown diamond, irregular lower edge and restrained pale seam. Preserve this existing aviation emblem, not generic banner lore.

**Runtime sprite key:** `prop:royal-flight-standard:frontier`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Royal purple dragon standard. Tall warm timber pole on screen-left with small gold diamond finial; one purple banner extending screen-right with pale purple angular dragon-wing emblem and small pale gold central Crown diamond, irregular lower edge and restrained pale seam. Preserve this existing aviation emblem, not generic banner lore. All listed parts belong to this single current asset. Match the current reference proportions, orientation, equipment, palette and apparent gameplay size. Keep procedural grounding shadows out of the image; preserve intrinsic material marks only.

### 250 — Unfinished royal launch platform

**Canonical cues:** Low angled brown plank platform with visible front/right thickness, plank seams, one loose inset board, two tall unfinished uprights, short overhead timber at left, small purple pennant at upper-right, spare beams and small tool box/maintenance tool. Preserve the open unfinished framework; do not complete the platform or add dragons/riders.

**Runtime sprite key:** `prop:royal-launch-platform:frontier`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Unfinished royal launch platform. Low angled brown plank platform with visible front/right thickness, plank seams, one loose inset board, two tall unfinished uprights, short overhead timber at left, small purple pennant at upper-right, spare beams and small tool box/maintenance tool. Preserve the open unfinished framework; do not complete the platform or add dragons/riders. All listed parts belong to this single current asset. Match the current reference proportions, orientation, equipment, palette and apparent gameplay size. Keep procedural grounding shadows out of the image; preserve intrinsic material marks only.

### 251 — Borin secured craft workstation

**Canonical cues:** Borin beside a tool rack and small secured lock, current smith clothing and craft context; he disappears from this captive state after rescue.

**Production decision:** KEEP PROCEDURAL — DO NOT GENERATE A SPRITE. Current rescue-state composition must preserve specialist disappearance, workstation furniture and the exact secured presentation. The existing runtime rejects generic cage substitution. The separately cataloged rescued specialist body remains eligible. A later isolated-component conversion can be added after its exact state/binding is designed; do not generate a permanently occupied workstation.

### 252 — Neri secured restoration workstation

**Canonical cues:** Neri beside a writing/restoration desk with alchemy materials and small secured lock; she disappears from this captive state after rescue.

**Production decision:** KEEP PROCEDURAL — DO NOT GENERATE A SPRITE. Current rescue-state composition must preserve specialist disappearance, workstation furniture and the exact secured presentation. The existing runtime rejects generic cage substitution. The separately cataloged rescued specialist body remains eligible. A later isolated-component conversion can be added after its exact state/binding is designed; do not generate a permanently occupied workstation.

### 253 — Dara secured equipment-repair workstation

**Canonical cues:** Dara at the wide repair bench with cart/metal parts, hammer and small restraint; she disappears from this captive state after rescue.

**Production decision:** KEEP PROCEDURAL — DO NOT GENERATE A SPRITE. Current rescue-state composition must preserve specialist disappearance, workstation furniture and the exact secured presentation. The existing runtime rejects generic cage substitution. The separately cataloged rescued specialist body remains eligible. A later isolated-component conversion can be added after its exact state/binding is designed; do not generate a permanently occupied workstation.

### 254 — Crown ranged soldier

**Canonical cues:** Compact Crown ranged humanoid, muted violet cloth (#62566e), gray steel (#939fa7), angular maroon-purple Crown helmet and small pale gold visor/chest marks; bow on screen-right, quiver and three arrow shafts at screen-left/back, small dark purple side cloth. No sword or shield. Preserve the current uniform rather than using the simpler Raider Archer.

**Runtime sprite key:** `enemy:crownguard:ranged`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Crown ranged soldier. Compact Crown ranged humanoid, muted violet cloth (#62566e), gray steel (#939fa7), angular maroon-purple Crown helmet and small pale gold visor/chest marks; bow on screen-right, quiver and three arrow shafts at screen-left/back, small dark purple side cloth. No sword or shield. Preserve the current uniform rather than using the simpler Raider Archer. No guard pauldrons, officer sash, extra crest, new equipment or ground marker.

### 255 — Skeleton melee guard

**Canonical cues:** Small exposed bone skeleton with skull, rib cage, thin bone arms and legs, short sword on screen-right. Warm ivory bone color with dark outlines. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural. The current skeleton guard has the additional muted gray polygon shield at screen-left; retain the bow or sword of this exact variant.

**Runtime sprite key:** `enemy:skeleton:guard`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Skeleton melee guard. Small exposed bone skeleton with skull, rib cage, thin bone arms and legs, short sword on screen-right. Warm ivory bone color with dark outlines. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural. The current skeleton guard has the additional muted gray polygon shield at screen-left; retain the bow or sword of this exact variant. Omit the procedural ground chevron, targeting/elite indicators and shadows. No captain/officer additions, new equipment or bulk increase.

### 256 — Skeleton ranged guard

**Canonical cues:** Same exposed Skeleton body and bone proportions as melee Skeleton, but bow on screen-right instead of sword. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural. The current skeleton guard has the additional muted gray polygon shield at screen-left; retain the bow or sword of this exact variant.

**Runtime sprite key:** `enemy:skeleton:ranged-guard`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Skeleton ranged guard. Same exposed Skeleton body and bone proportions as melee Skeleton, but bow on screen-right instead of sword. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural. The current skeleton guard has the additional muted gray polygon shield at screen-left; retain the bow or sword of this exact variant. Omit the procedural ground chevron, targeting/elite indicators and shadows. No captain/officer additions, new equipment or bulk increase.

### 257 — Reedbeast ranged guard

**Canonical cues:** Same Reed beast body as asset 019, plus the canonical hybrid mouth cue: a small darker mouth/central oval and a short pale projecting spit/tongue line toward screen-right. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural.

**Runtime sprite key:** `enemy:reedbeast:hybrid-ranged-guard`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Reedbeast ranged guard. Same Reed beast body as asset 019, plus the canonical hybrid mouth cue: a small darker mouth/central oval and a short pale projecting spit/tongue line toward screen-right. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural. Omit the procedural ground chevron, targeting/elite indicators and shadows. No captain/officer additions, new equipment or bulk increase.

### 258 — Ogre melee guard

**Canonical cues:** Very bulky humanoid, about 1.5 human bulk. Muted tan/olive skin, minimal dark brown waist belt, small paired tusk/horn marks around face, heavy wooden club/maul held on screen-right. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural.

**Runtime sprite key:** `enemy:ogre:guard`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Ogre melee guard. Very bulky humanoid, about 1.5 human bulk. Muted tan/olive skin, minimal dark brown waist belt, small paired tusk/horn marks around face, heavy wooden club/maul held on screen-right. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural. Omit the procedural ground chevron, targeting/elite indicators and shadows. No captain/officer additions, new equipment or bulk increase.

### 259 — Ogre ranged guard

**Canonical cues:** Same very bulky Ogre species and paired facial tusk marks, but a distinct ranged class. Gray-olive/brown clothing rather than the melee Ogre's warmer body treatment, an asymmetric shoulder wrap, diagonal throwing strap, and a large stone satchel on screen-left with visible stones. A simple throwing sling/stone tool is carried on screen-right. No melee club. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural.

**Runtime sprite key:** `enemy:ogre:hybrid-ranged-guard`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Ogre ranged guard. Same very bulky Ogre species and paired facial tusk marks, but a distinct ranged class. Gray-olive/brown clothing rather than the melee Ogre's warmer body treatment, an asymmetric shoulder wrap, diagonal throwing strap, and a large stone satchel on screen-left with visible stones. A simple throwing sling/stone tool is carried on screen-right. No melee club. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural. Omit the procedural ground chevron, targeting/elite indicators and shadows. No captain/officer additions, new equipment or bulk increase.

### 260 — Archer ranged guard

**Canonical cues:** Compact hooded humanoid enemy rendered with `human('archer')`, not the Ranger body. Darker green clothing, dark green hood and cape, bow on screen-right, quiver on screen-left/back with visible arrows. It does **not** have the Ranger-specific teal flask/pouch or pale-green/gold utility accent. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural.

**Runtime sprite key:** `enemy:archer:ranged-guard`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Archer ranged guard. Compact hooded humanoid enemy rendered with `human('archer')`, not the Ranger body. Darker green clothing, dark green hood and cape, bow on screen-right, quiver on screen-left/back with visible arrows. It does **not** have the Ranger-specific teal flask/pouch or pale-green/gold utility accent. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural. Omit the procedural ground chevron, targeting/elite indicators and shadows. No captain/officer additions, new equipment or bulk increase.

### 261 — Crownguard ranged guard

**Canonical cues:** Compact Crown ranged humanoid, muted violet cloth (#62566e), gray steel (#939fa7), angular maroon-purple Crown helmet and small pale gold visor/chest marks; bow on screen-right, quiver and three arrow shafts at screen-left/back, small dark purple side cloth. No sword or shield. Preserve the current uniform rather than using the simpler Raider Archer. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural. Guard uniform uses darker violet cloth (#51495d), lighter steel (#aab2b5), two gray outward shoulder plates and pale-gold collar line; never substitute the unguarded Crown uniform.

**Runtime sprite key:** `enemy:crownguard:ranged-guard`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Crownguard ranged guard. Compact Crown ranged humanoid, muted violet cloth (#62566e), gray steel (#939fa7), angular maroon-purple Crown helmet and small pale gold visor/chest marks; bow on screen-right, quiver and three arrow shafts at screen-left/back, small dark purple side cloth. No sword or shield. Preserve the current uniform rather than using the simpler Raider Archer. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural. Guard uniform uses darker violet cloth (#51495d), lighter steel (#aab2b5), two gray outward shoulder plates and pale-gold collar line; never substitute the unguarded Crown uniform. Omit the procedural ground chevron, targeting/elite indicators and shadows. No captain/officer additions, new equipment or bulk increase.

### 262 — Wolf melee guard

**Canonical cues:** Low gray wolf in side-facing game silhouette: long body, tail extending screen-left, four legs, head to screen-right, pointed ears and muzzle; cool gray coat with slightly lighter markings. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural.

**Runtime sprite key:** `enemy:wolf:guard`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Wolf melee guard. Low gray wolf in side-facing game silhouette: long body, tail extending screen-left, four legs, head to screen-right, pointed ears and muzzle; cool gray coat with slightly lighter markings. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural. Omit the procedural ground chevron, targeting/elite indicators and shadows. No captain/officer additions, new equipment or bulk increase.

### 263 — Orc melee guard

**Canonical cues:** Broad humanoid enemy, slightly larger than human. Muted olive-green skin, brown-olive clothing, steel shoulder plates, short sword on screen-right. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural.

**Runtime sprite key:** `enemy:orc:guard`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Orc melee guard. Broad humanoid enemy, slightly larger than human. Muted olive-green skin, brown-olive clothing, steel shoulder plates, short sword on screen-right. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural. Omit the procedural ground chevron, targeting/elite indicators and shadows. No captain/officer additions, new equipment or bulk increase.

### 264 — Crownguard melee guard

**Canonical cues:** Compact Crown melee humanoid with violet cloth, gray steel head/chest, angular maroon-purple Crown helmet, maroon shield on screen-left, sword on screen-right and restrained pale-gold visor/chest marks. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural. Guard uniform uses darker violet cloth (#51495d), lighter steel (#aab2b5), two gray outward shoulder plates and pale-gold collar line; never substitute the unguarded Crown uniform.

**Runtime sprite key:** `enemy:crownguard:guard`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Crownguard melee guard. Compact Crown melee humanoid with violet cloth, gray steel head/chest, angular maroon-purple Crown helmet, maroon shield on screen-left, sword on screen-right and restrained pale-gold visor/chest marks. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural. Guard uniform uses darker violet cloth (#51495d), lighter steel (#aab2b5), two gray outward shoulder plates and pale-gold collar line; never substitute the unguarded Crown uniform. Omit the procedural ground chevron, targeting/elite indicators and shadows. No captain/officer additions, new equipment or bulk increase.

### 265 — Goblin melee guard

**Canonical cues:** Small humanoid enemy, about 0.8 normal human bulk. Brown clothing, muted yellow-green skin, very large pointed ears, small angular nose and separate simple mouth (no wide pale triangular grin), dark belt/waist details, short sword on screen-right. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural. Organic pointed ears with natural folds/joins; playful half-smile with a small ivory corner-tooth/sliver and separate narrow nose. Refine procedural shape artifacts rather than copying robotic ear panels.

**Runtime sprite key:** `enemy:goblin:guard`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Goblin melee guard. Small humanoid enemy, about 0.8 normal human bulk. Brown clothing, muted yellow-green skin, very large pointed ears, small angular nose and separate simple mouth (no wide pale triangular grin), dark belt/waist details, short sword on screen-right. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural. Omit the procedural ground chevron, targeting/elite indicators and shadows. No captain/officer additions, new equipment or bulk increase.

### 266 — Goblin ranged guard

**Canonical cues:** Same small Goblin body, ears, colors and proportions as melee Goblin, but its ranged canonical drawing replaces the sword emphasis with a simple sling/throwing line and stone on screen-right plus a small brown pouch/block on screen-left. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural. Organic pointed ears with natural folds/joins; playful half-smile with a small ivory corner-tooth/sliver and separate narrow nose. Refine procedural shape artifacts rather than copying robotic ear panels.

**Runtime sprite key:** `enemy:goblin:ranged-guard`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Goblin ranged guard. Same small Goblin body, ears, colors and proportions as melee Goblin, but its ranged canonical drawing replaces the sword emphasis with a simple sling/throwing line and stone on screen-right plus a small brown pouch/block on screen-left. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural. Omit the procedural ground chevron, targeting/elite indicators and shadows. No captain/officer additions, new equipment or bulk increase.

### 267 — Mireling melee guard

**Canonical cues:** Low horizontal crocodilian creature: long tail to screen-left, oval body, long toothy snout to screen-right, four low legs, dark green dorsal spikes, olive-green body. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural.

**Runtime sprite key:** `enemy:mireling:guard`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Mireling melee guard. Low horizontal crocodilian creature: long tail to screen-left, oval body, long toothy snout to screen-right, four low legs, dark green dorsal spikes, olive-green body. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural. Omit the procedural ground chevron, targeting/elite indicators and shadows. No captain/officer additions, new equipment or bulk increase.

### 268 — Mireling ranged guard

**Canonical cues:** Same low crocodilian species silhouette as the melee Mireling, but a distinct ranged class body. Slightly darker muted green hide and warmer amber markings. A woven reed/leather harness crosses the torso, with a small side pouch and a visible mouth/spit-projection fitting at the snout. Dark dorsal spikes remain. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural.

**Runtime sprite key:** `enemy:mireling:hybrid-ranged-guard`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Mireling ranged guard. Same low crocodilian species silhouette as the melee Mireling, but a distinct ranged class body. Slightly darker muted green hide and warmer amber markings. A woven reed/leather harness crosses the torso, with a small side pouch and a visible mouth/spit-projection fitting at the snout. Dark dorsal spikes remain. Existing guard state adds a restrained pale-gold rectangular chest/role mark; preserve current species size and exact loadout. Ground guard chevrons remain procedural. Omit the procedural ground chevron, targeting/elite indicators and shadows. No captain/officer additions, new equipment or bulk increase.


### 269 — Ash beast melee guard

**Canonical cues:** Low many-legged ash creature. Oval burnt orange-brown body, multiple thin lateral legs, two larger raised forelimb/pincer shapes, curled segmented tail sweeping to screen-left/back, one pale bone-colored horn/spine near the tail/body. Existing guard state adds a restrained pale-gold rectangular role mark; preserve the current species size and loadout. Guard ground chevrons remain procedural.

**Runtime sprite key:** `enemy:ashbeast:guard`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Ash beast melee guard. Low many-legged ash creature. Oval burnt orange-brown body, multiple thin lateral legs, two larger raised forelimb/pincer shapes, curled segmented tail sweeping to screen-left/back, one pale bone-colored horn/spine near the tail/body. Existing guard state adds a restrained pale-gold rectangular role mark; preserve the current species size and loadout. Guard ground chevrons remain procedural. Omit procedural ground chevrons, targeting indicators and shadows. No captain additions or increased bulk.

### 270 — Ash beast cinder-spitter guard

**Canonical cues:** Same low many-legged Ash-beast anatomy, raised forelimbs and curled tail, but a distinct ranged class. Darker red-brown/purple carapace replaces the ordinary burnt-orange body. Additional dorsal cinder plates and two visible cinder sacs/vents carry restrained warm orange highlights. Existing guard state adds a restrained pale-gold rectangular role mark; preserve the current species size and loadout. Guard ground chevrons remain procedural.

**Runtime sprite key:** `enemy:ashbeast:ranged-guard`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one Ash beast cinder-spitter guard. Same low many-legged Ash-beast anatomy, raised forelimbs and curled tail, but a distinct ranged class. Darker red-brown/purple carapace replaces the ordinary burnt-orange body. Additional dorsal cinder plates and two visible cinder sacs/vents carry restrained warm orange highlights. Existing guard state adds a restrained pale-gold rectangular role mark; preserve the current species size and loadout. Guard ground chevrons remain procedural. Omit procedural ground chevrons, targeting indicators and shadows. No captain additions or increased bulk.

### 271 — Environmental Grass

**Canonical cues:** Three sparse muted green (#739266) grass blades, small upright clump, restrained differing blade heights. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:grass:vale`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Grass as the current procedural reference. Three sparse muted green (#739266) grass blades, small upright clump, restrained differing blade heights. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 272 — Environmental Wet Grass

**Canonical cues:** Four sparse muted marsh-green (#688c70) blades, narrow upright clump, slightly taller than dry grass. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:wet-grass:march`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Wet Grass as the current procedural reference. Four sparse muted marsh-green (#688c70) blades, narrow upright clump, slightly taller than dry grass. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 273 — Environmental Bush

**Canonical cues:** Compact three-lobed leafy bush: left/right low lobes and raised central lobe, muted green (#58784f), no trunk or flowers. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:bush:vale`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Bush as the current procedural reference. Compact three-lobed leafy bush: left/right low lobes and raised central lobe, muted green (#58784f), no trunk or flowers. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 274 — Environmental Marsh Bush

**Canonical cues:** Compact three-lobed muted gray-green (#5d7662) wetland bush, broad low foliage and two tiny pale highlights. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:marsh-bush:march`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Marsh Bush as the current procedural reference. Compact three-lobed muted gray-green (#5d7662) wetland bush, broad low foliage and two tiny pale highlights. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 275 — Environmental Wildflowers

**Canonical cues:** Four thin muted green stems carrying tiny warm yellow, muted pink, pale cream and pale blue flower heads; preserve their sparse arrangement and very small scale. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:wildflowers:vale`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Wildflowers as the current procedural reference. Four thin muted green stems carrying tiny warm yellow, muted pink, pale cream and pale blue flower heads; preserve their sparse arrangement and very small scale. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 276 — Environmental Sapling

**Canonical cues:** Small brown trunk (#74583e) and three rounded green foliage clumps (#52794f), raised central/left canopy and smaller right clump. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:sapling:vale`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Sapling as the current procedural reference. Small brown trunk (#74583e) and three rounded green foliage clumps (#52794f), raised central/left canopy and smaller right clump. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 277 — Environmental Stump

**Canonical cues:** Low short brown stump (#76563c), warm tan oval cut face (#b38b5d), one restrained dark grain line. No roots or new shoots. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:stump:vale`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Stump as the current procedural reference. Low short brown stump (#76563c), warm tan oval cut face (#b38b5d), one restrained dark grain line. No roots or new shoots. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 278 — Environmental Fallen Log

**Canonical cues:** Diagonal brown log, lower left to upper right, tan round cut end on screen-right, two short branch stubs. No fungi, leaves or surrounding ground. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:fallen-log:vale`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Fallen Log as the current procedural reference. Diagonal brown log, lower left to upper right, tan round cut end on screen-right, two short branch stubs. No fungi, leaves or surrounding ground. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 279 — Environmental Reeds

**Canonical cues:** Five fine muted olive-green (#748c62) reed stems with restrained differing heights; no cattail heads or water patch. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:reeds:march`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Reeds as the current procedural reference. Five fine muted olive-green (#748c62) reed stems with restrained differing heights; no cattail heads or water patch. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 280 — Environmental Cattails

**Canonical cues:** Four fine muted olive-green stems (#71875e), each with narrow elongated brown cattail head (#796245). Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:cattails:march`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Cattails as the current procedural reference. Four fine muted olive-green stems (#71875e), each with narrow elongated brown cattail head (#796245). Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 281 — Environmental Driftwood

**Canonical cues:** Slender weathered brown-gray (#776752) diagonal branch from lower left to upper right with two short branching twigs. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:driftwood:march`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Driftwood as the current procedural reference. Slender weathered brown-gray (#776752) diagonal branch from lower left to upper right with two short branching twigs. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 282 — Environmental Mangrove

**Canonical cues:** Small brown trunk, four rounded muted wetland-green foliage masses (#4d735f), exposed paired splayed roots on both sides and restrained leaf highlights. No water patch. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:mangrove:march`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Mangrove as the current procedural reference. Small brown trunk, four rounded muted wetland-green foliage masses (#4d735f), exposed paired splayed roots on both sides and restrained leaf highlights. No water patch. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 283 — Environmental Pine Sapling

**Canonical cues:** Small slim brown trunk and three stacked triangular muted gray-green (#526c50) foliage tiers, widest below and narrow above. No snow or cones. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:pine-sapling:highlands`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Pine Sapling as the current procedural reference. Small slim brown trunk and three stacked triangular muted gray-green (#526c50) foliage tiers, widest below and narrow above. No snow or cones. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 284 — Environmental Alpine Scrub

**Canonical cues:** Low three-lobed muted gray-olive shrub (#778166), shallow rounded masses, compact alpine silhouette. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:alpine-scrub:highlands`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Alpine Scrub as the current procedural reference. Low three-lobed muted gray-olive shrub (#778166), shallow rounded masses, compact alpine silhouette. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 285 — Environmental Heather

**Canonical cues:** Four sparse fine gray-green (#778067) stems with tiny muted mauve/lavender (#b79ab9/#a99bc6) flower heads. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:heather:highlands`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Heather as the current procedural reference. Four sparse fine gray-green (#778067) stems with tiny muted mauve/lavender (#b79ab9/#a99bc6) flower heads. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 286 — Environmental Rock Cluster

**Canonical cues:** Three small low gray-green stones, left stone lower, larger lighter central stone raised, smaller dark right stone; preserve #797d75/#90928a/#666b66 relationships. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:rock-cluster:highlands`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Rock Cluster as the current procedural reference. Three small low gray-green stones, left stone lower, larger lighter central stone raised, smaller dark right stone; preserve #797d75/#90928a/#666b66 relationships. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 287 — Environmental Dead Tree

**Canonical cues:** Small dark brown (#5f4b40) bare trunk with two angular upward side branches and a short left twig. No leaves or flame. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:dead-tree:frontier`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Dead Tree as the current procedural reference. Small dark brown (#5f4b40) bare trunk with two angular upward side branches and a short left twig. No leaves or flame. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 288 — Environmental Charred Stump

**Canonical cues:** Low short charcoal-brown stump (#4a403a), muted brown cut face (#6c5545) and one dark burnt grain line. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:charred-stump:frontier`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Charred Stump as the current procedural reference. Low short charcoal-brown stump (#4a403a), muted brown cut face (#6c5545) and one dark burnt grain line. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 289 — Environmental Dry Scrub

**Canonical cues:** Four fine dry brown (#78614f) stems, outward leaning upper branches with small crossing side twigs. No foliage or flowers. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:dry-scrub:frontier`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Dry Scrub as the current procedural reference. Four fine dry brown (#78614f) stems, outward leaning upper branches with small crossing side twigs. No foliage or flowers. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 290 — Environmental Burned Log

**Canonical cues:** Low diagonal charcoal-brown log (#4a403a) with two short darker burnt stubs (#2f2d2b). No embers or smoke. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:burned-log:frontier`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Burned Log as the current procedural reference. Low diagonal charcoal-brown log (#4a403a) with two short darker burnt stubs (#2f2d2b). No embers or smoke. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 291 — Environmental Black Rock

**Canonical cues:** Three low dark violet-gray stones, larger raised central stone, lower left/right stones, #4e4a54/#625a69/#403f48 relationships. No added crystal. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:black-rock:crown`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Black Rock as the current procedural reference. Three low dark violet-gray stones, larger raised central stone, lower left/right stones, #4e4a54/#625a69/#403f48 relationships. No added crystal. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 292 — Environmental Crystal Cluster

**Canonical cues:** Three narrow irregular faceted muted violet crystals, tallest center, medium left, shortest right, #766a91/#9382ac/#6f6488 and one restrained pale central glint. No aura. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:crystal-cluster:crown`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Crystal Cluster as the current procedural reference. Three narrow irregular faceted muted violet crystals, tallest center, medium left, shortest right, #766a91/#9382ac/#6f6488 and one restrained pale central glint. No aura. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 293 — Environmental Dead Shrub

**Canonical cues:** Four thin muted dark brown (#62534e) bare stems, outward upper branches and small side twigs; preserve sparse low silhouette. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:dead-shrub:crown`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Dead Shrub as the current procedural reference. Four thin muted dark brown (#62534e) bare stems, outward upper branches and small side twigs; preserve sparse low silhouette. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 294 — Environmental Obsidian

**Canonical cues:** Single irregular dark slate-violet (#373740) upright stone shard, broad low base, uneven pointed upper silhouette and restrained violet facet line (#8b789a). No rune or glow. Preserve the actual current seed/reference; additional visual variants require their own recorded source reference.

**Runtime sprite key:** `prop:obsidian:crown`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one isolated Obsidian as the current procedural reference. Single irregular dark slate-violet (#373740) upright stone shard, broad low base, uneven pointed upper silhouette and restrained violet facet line (#8b789a). No rune or glow. Add only readable material definition and fine detail. Do not add vegetation, anatomy, symbols, objects, a ground patch or baked shadow. Keep the current silhouette and small gameplay scale.

### 295 — Environmental Vale field rock

**Canonical cues:** Low fixed five-point field rock from the live icon-rock branch; pale left/top facet (#a0ad9b), gray-green body (#849183) and dark edge line (#647466). This branch is identical across seeds and regions; the unused wildProp moss branch is not its reference. No Crown crystal spike.

**Runtime sprite key:** `prop:rock:vale`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one field rock from the current vale icon-rock branch. Low fixed five-point field rock from the live icon-rock branch; pale left/top facet (#a0ad9b), gray-green body (#849183) and dark edge line (#647466). This branch is identical across seeds and regions; the unused wildProp moss branch is not its reference. No Crown crystal spike. Preserve the current geometry. No new crystals, symbols, ground patch, other rocks or baked shadow.

### 296 — Environmental Highlands field rock

**Canonical cues:** Low fixed five-point field rock from the live icon-rock branch; pale left/top facet (#a0ad9b), gray-green body (#849183) and dark edge line (#647466). This branch is identical across seeds and regions; the unused wildProp moss branch is not its reference. No Crown crystal spike.

**Runtime sprite key:** `prop:rock:highlands`

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render exactly one field rock from the current highlands icon-rock branch. Low fixed five-point field rock from the live icon-rock branch; pale left/top facet (#a0ad9b), gray-green body (#849183) and dark edge line (#647466). This branch is identical across seeds and regions; the unused wildProp moss branch is not its reference. No Crown crystal spike. Preserve the current geometry. No new crystals, symbols, ground patch, other rocks or baked shadow.
