# Phase 2A — Canon Sprite Image-Generation Prompt Catalog (AUDITED)

## Purpose

**Audit status: COMPLETE.** This document has been checked back against the current production renderer and rules after the initial 110-entry draft. Entries marked **KEEP PROCEDURAL** are intentionally not image-generation tasks.

This document is the production source for the next image-generation phase. It does **not** activate any sprite in the game. Each asset is generated **one at a time and one alone**, using its own entry below. The current procedural renderer is canon.

## Mandatory base prompt

Use this text at the beginning of every asset prompt, followed by that asset's specific prompt:

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale.

## Workflow lock

- Generate exactly one sprite per request.
- Never generate sheets, comparisons, multiple options, turnarounds, scenes, or old/new boards.
- Never fabricate a visual reference. The procedural renderer and this audited document are the references.
- Do not move to another asset until the current generation is complete.
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

**Canonical cues:** Compact humanoid rendered with the canonical human('ranger') body rather than human('archer'): green clothing, green hood/cape, bow on screen-right, quiver on screen-left/back, plus the same small teal flask/pouch and restrained pale-green/gold utility accent used by that body. Unlike the hero Ranger, it does not receive the extra hero-layer facial/strap/quiver polish.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the companion Archer/Ranger support exactly from the canonical human('ranger') body: green hood/cloak, right-side bow, left/back quiver and arrows, small teal flask/pouch and restrained pale-green/gold utility accent. Keep it slightly simpler in finish than the hero Ranger by omitting only the separate hero-layer additions. Do not remove canonical ranger-body gear and do not invent new equipment.

## B. Specialists

### 006 — Mira — Greenwood instructor

**Canonical cues:** Humanoid specialist. Olive-green cloth, dark green cape, brown hair/head covering with pale-gold trim. Tall staff on screen-right topped by a pale green diamond/leaf-like head. Rectangular pale tan item or satchel on screen-left. Teacher trim lines on torso.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Mira exactly as described. Preserve olive-green clothing, dark green cape, brown hair/head covering, pale-gold trim, right-side tall staff with pale green diamond head and the pale tan left-side rectangular item. No new jewelry, robes, wings, books or spell effects.

### 007 — Borin — village smith

**Canonical cues:** Humanoid specialist. Brown/earth clothing and dark gray-brown cape. Dark hair/head band. Heavy dark apron/chest block with brown inset. Long-handled smith hammer on screen-right with steel rectangular head.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Borin exactly as described. Preserve earthy clothes, dark apron, head band and the long-handled steel smith hammer at screen-right. No beard requirement unless naturally implied by the existing face; do not add armor, forge flames, anvil or extra tools.

### 008 — Sela — Marches instructor

**Canonical cues:** Humanoid specialist. Teal cloth, dark teal cape, dark hair. Pointed hood/hat shape in cape color with pale trim. Tall staff on screen-right topped by a round teal orb/disc.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Sela exactly as described. Preserve teal clothing, dark teal cape/pointed headwear, pale trim and right-side staff with teal round head. No extra magic effects, water motifs, jewelry or new equipment.

### 009 — Neri — alchemist

**Canonical cues:** Humanoid specialist. Slate blue-gray cloth, dark blue-gray cape, brown hair under a flat dark headband/cap. Rectangular brown satchel/item on screen-left. Blue-green flask on screen-right with small pale trim/metal neck. Two small colored alchemy vials on torso.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Neri exactly as described. Preserve the slate clothing, dark cape, flat headwear, left-side brown satchel/item, right-side blue-green flask and the two small colored vial accents. No bubbling effects, potion belt expansion, goggles or invented laboratory gear.

### 010 — Orin — Highland instructor

**Canonical cues:** Humanoid specialist. Earthy olive/tan cloth, muted green-gray cape, dark brown hair. Squared dark cap/hood with pale-gold trim. Pale gray shoulder/chest mantle. Tall staff on screen-right with pale stone/metal triangular head.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Orin exactly as described. Preserve earthy Highland palette, square dark headwear, pale mantle and right-side tall staff with pale triangular head. No fur cloak, antlers, runes or extra weapons.

### 011 — Dara — Highland smith

**Canonical cues:** Humanoid specialist. Gray-olive cloth and dark gray-green cape. Dark apron/chest block with brown inset. Pale steel headband/helmet strip. Long-handled smith hammer on screen-right with steel rectangular head.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Dara exactly as described. Preserve muted gray/olive work clothes, apron, simple pale headband and the right-side long-handled steel hammer. No forge scene, anvil, extra armor or invented runes.

### 012 — Lyss — advanced instructor

**Canonical cues:** Humanoid specialist. Muted red-brown cloth, dark burgundy cape, dark hair. Dark angular helmet/cap. Steel shoulder plates. Tall staff/pole on screen-right topped by a pale-gold diamond/banner-like head.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Lyss exactly as described. Preserve the red-brown cloth, burgundy cape, angular dark headwear, steel shoulders and right-side pole with pale-gold diamond head. No extra weapons, banners, horns or magic aura.

### 013 — Eren — runewright

**Canonical cues:** Humanoid specialist. Muted violet-gray cloth, dark purple cape, gray-violet hair/head shape. Dark angular cap/hood. Brown-violet rectangular satchel/item on screen-left. Tall staff on screen-right with a large purple diamond-shaped head and pale inner line.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Eren exactly as described. Preserve violet-gray palette, dark purple cape, left-side rectangular item and right-side tall staff with purple diamond head. No floating runes, glowing circles, extra crystals or new armor.

### 014 — Vera — master smith

**Canonical cues:** Humanoid specialist. Warm brown/tan cloth, dark brown-gray cape, pale blond/white hair. Heavy brown apron/chest block with tan inset and pale trim. Long-handled hammer on screen-right with a broad pale steel rectangular head.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Vera exactly as described. Preserve warm smith palette, pale hair, heavy apron and broad right-side hammer. No crown, extra smith tools, forge effects or new armor.

### 015 — Tovan — final instructor

**Canonical cues:** Humanoid specialist. Cool gray-blue cloth, dark slate cape, pale gray hair. Tall angular pale headpiece/hood with gold trim. Long staff on screen-right with a round gold head. Gold diamond chest mark.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Tovan exactly as described. Preserve cool gray-blue clothing, slate cape, pale angular headwear, right-side staff with round gold head and gold diamond chest mark. No halo, wings, glowing aura, extra robes or new symbols.

## C. Ordinary and night creatures

### 016 — Goblin melee

**Canonical cues:** Small humanoid enemy, about 0.8 normal human bulk. Brown clothing, muted yellow-green skin, very large pointed ears, small angular nose, dark belt/waist details, short sword on screen-right.

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

**Canonical cues:** Compact hooded humanoid archer using the darker companion-archer design: dark green clothing, dark green hood/cape, bow on screen-right, quiver on screen-left/back.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Raider Archer exactly as described. Preserve dark green hood/cape, bow and quiver silhouette. Keep it as the same simple archer visual family; no extra armor, mask, daggers or faction banner.

### 024 — Ash beast base

**Canonical cues:** Low many-legged ash creature. Oval burnt orange-brown body, multiple thin lateral legs, two larger raised forelimb/pincer shapes, curled segmented tail sweeping to screen-left/back, one pale bone-colored horn/spine near the tail/body.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ash beast exactly as described. Preserve the low oval body, many lateral legs, raised forelimbs, curled tail and burnt orange-brown palette. No lava cracks, giant scorpion stinger, wings, armor or extra horns.

### 025 — Crown soldier

**Canonical cues:** Armored humanoid based on the Soldier body: muted blue-gray armor, crown-shaped dark maroon/purple headpiece, maroon shield on screen-left, sword on screen-right, small gold horizontal chest detail.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Crown soldier exactly as described. Preserve Soldier-like armored body, dark crown-shaped headpiece, maroon left shield and right sword. No Dark Lord crown, cape, glowing eyes or extra black armor.

### 026 — Wraith

**Canonical cues:** Floating tapered spectral figure, desaturated blue-green body, dark face opening with two pale eyes, lower body splits into pointed spectral tails. Carries a small lantern on screen-right attached by a short arm/handle.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Wraith exactly as described. Preserve the tapered ghost silhouette, blue-green palette, dark face with two eyes and small right-side lantern. No hood redesign, chains, scythe, robes, mist cloud or aura outside the body.

### 027 — Ash stalker

**Canonical cues:** Floating tapered spectral figure using the same body geometry as Wraith but muted red-purple/brown coloration. Dark face opening with two pale eyes. No lantern.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ash stalker exactly as described. Preserve the Wraith-like tapered spectral silhouette, reddish-purple palette and dark face. Do not add a lantern, claws, horns, wings, smoke trail or new anatomy.

### 028 — Goblin slinger

**Canonical cues:** Same small Goblin body, ears, colors and proportions as melee Goblin, but its ranged canonical drawing replaces the sword emphasis with a simple sling/throwing line and stone on screen-right plus a small brown pouch/block on screen-left.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Goblin slinger exactly as described. It must remain the same Goblin body. Preserve the simple right-side sling/stone cue and small left-side pouch. Do not invent a bow, spear, armor or elaborate sling rig.

### 029 — Skeleton bow variant

**Canonical cues:** Same exposed Skeleton body and bone proportions as melee Skeleton, but bow on screen-right instead of sword.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Skeleton bow variant exactly as described. Preserve the same skeleton body and ivory bone palette; replace the sword only with the existing simple right-side bow. No quiver unless it is already required by the canonical silhouette, no armor or cloak.

### 030 — Mireling spitter hybrid

**Audit status: KEEP PROCEDURAL — DO NOT GENERATE A SPRITE.**

**Reason:** The current renderer gives the spitter the same static Mireling body as the melee Mireling. Its ranged identity is expressed by runtime aiming/projectile behavior, so a second raster body would be a duplicate or an invention.

### 031 — Reed-beast spitter hybrid

**Canonical cues:** Same Reed beast body as asset 019, plus the canonical hybrid mouth cue: a small darker mouth/central oval and a short pale projecting spit/tongue line toward screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Reed-beast spitter exactly as described. Preserve the base frog-like body and add only the small canonical mouth/projection cue. No sacs, glands, horns, weapon or dramatic tongue.

### 032 — Ogre stone-thrower hybrid

**Audit status: KEEP PROCEDURAL — DO NOT GENERATE A SPRITE.**

**Reason:** The current renderer gives the stone thrower the same static Ogre body as the melee Ogre. The thrown stone is a runtime projectile; there is no separate canonical static throwing kit.

### 033 — Orc axe-thrower hybrid

**Audit status: KEEP PROCEDURAL — DO NOT GENERATE A SPRITE.**

**Reason:** The current renderer keeps the same sword-bearing Orc body. The axe exists as a runtime projectile; replacing the sword or adding throwing gear would contradict the visible canon.

### 034 — Ash-beast cinder-spitter hybrid

**Audit status: KEEP PROCEDURAL — DO NOT GENERATE A SPRITE.**

**Reason:** The current renderer gives the cinder spitter the same static Ash-beast body. Cinder identity is carried by runtime projectile behavior, not a different body design.

## D. Bosses

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

**Canonical cues:** Goblin captain: same Goblin body and proportions, moderately larger. Canon additions inspired by Thornfang: wolf-trophy/bone pieces near left shoulder, three small claw/fang bone marks on torso, two green diagonal markings, small warm-gold glint. Procedural captain ground ring is NOT part of sprite.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Scornfang as the same canonical Goblin body, moderately enlarged, adding only the existing wolf-trophy/bone pieces, three small fang/claw marks and green diagonal markings. No wolf head helmet, antlers, fur cape, boss aura or new armor.

### 047 — Direjaw

**Canonical cues:** Mireling captain: same crocodilian Mireling body, moderately larger. Canon additions: heavier pale jaw-band/line and several darker/tan dorsal trophy plates, small warm-gold glints along snout. Procedural captain ground ring excluded.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Direjaw as the same canonical Mireling body, moderately enlarged, adding only the heavier jaw band and existing dorsal trophy plates. No armor harness, horns, crown, extra limbs or Mirejaw-scale redesign.

### 048 — Crag Tyrant

**Canonical cues:** Wolf captain: same gray Wolf body, moderately larger. Canon additions: quarry-metal collar across shoulders/neck with three rectangular plates, pale stone brow plate near head and a small pale protruding line. Procedural captain ground ring excluded.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Crag Tyrant as the same canonical Wolf body, moderately enlarged, adding only the metal collar plates and pale brow/stone accents. No humanoid armor, horns, antlers, saddle or giant boss proportions.

### 049 — Dreadmaw

**Audit status: KEEP PROCEDURAL — DO NOT GENERATE A SPRITE.**

**Reason:** Dreadmaw is named and mechanically distinct, but the current renderer has no cindermaw-specific captainFinish case. Visually it is only an Ash beast at captain scale plus procedural captain treatment. A unique sprite now would invent canon.

### 050 — Cinder Warlord

**Canonical cues:** Orc captain: same canonical Orc body, moderately larger. Canon additions inspired by Ashen Warlord: two steel shoulder plates, diagonal muted red authority stripe across torso, small brown tally-board block on screen-right with pale tally lines, slim pole with muted red triangular banner at screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render Cinder Warlord as the same canonical Orc body, moderately enlarged, adding only the steel shoulders, diagonal red authority stripe, tally-board block and slim red triangular banner pole. No Warlord helmet, giant weapon, extra horns or full boss armor.

## F. Major destination structures

### 051 — Forest Crypt entrance

**Canonical cues:** Compact stone gate. Gray-green rectangular masonry body with dark open doorway, triangular roof/pediment, two pale stone side columns, small skull centered high on the front.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Forest Crypt entrance exactly as described. Preserve compact gate massing, dark doorway, triangular top, two columns and single skull marker. No cemetery scene, statues, torches, vines or extra graves.

### 052 — Sunken Archive entrance

**Canonical cues:** Compact teal-gray stone gate with dark doorway, triangular roof/pediment, two pale side columns, pale teal chevron/roof emblem and teal horizontal base strip.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Sunken Archive entrance exactly as described. Preserve gate shape, dark doorway, two columns, teal chevron and base strip. No water scene, columns beyond the pair, books, statues or extra ornament.

### 053 — Colossus Mine entrance

**Canonical cues:** Compact gray-brown stone gate with dark doorway, triangular top, pale side columns, thick tan horizontal lintel/beam and diagonal steel pick/tool mark on the upper face.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Colossus Mine entrance exactly as described. Preserve the same gate architecture, tan beam and single diagonal steel tool mark. No minecart, rails, crystals, lanterns or mountain background.

### 054 — Abyss Bastion entrance

**Canonical cues:** Compact muted purple-brown stone gate with dark doorway, triangular top, pale side columns, paired small gold horn-like side ornaments and a warm orange oval emblem at the top center.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Abyss Bastion entrance exactly as described. Preserve gate geometry, paired small gold side ornaments and orange top emblem. No dragon statue, flames, wings or fortress scene.

### 055 — Citadel of Ashes entrance

**Canonical cues:** Compact blue-gray stone gate with dark doorway, triangular top, pale side columns, paired small gold horn-like side ornaments and a warm gold oval emblem at top center.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Citadel of Ashes entrance exactly as described. Preserve gate geometry and restrained gold ornaments. No giant crown, soldiers, banners, flames or fortress walls.

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

**Canonical cues:** Field-built timber drill lodge. Four main wooden posts, muted red-brown pitched roof, low tan wall, broad dark open muster bay, visible bedrolls/low bunks at lower left, weapon rack on right, small contained cookfire at lower right, shield on front-left, simple banner pole on far right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Greenwood Basic Barracks exactly as described. Preserve its rough military-shelter character and every stated function. No upgraded stone walls, tower, palisade enclosure or ornate heraldry.

### 072 — Marches Basic Barracks

**Canonical cues:** Raised reed-and-timber field barracks on multiple stilts. Muted teal roof, gray-green wall, dark central opening, reed fringe, drying line/racks, small sheltered stove, shield front-left and simple banner pole at far right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Marches Basic Barracks exactly as described. Preserve raised wetland construction, reed roof details, central shelter, stove, shield and banner. No dock, boat, watchtower or extra building.

### 073 — Highlands Basic Barracks

**Canonical cues:** Low stone redoubt with gray stone wall, dark gray-green timber roof, strong side posts, dark central opening, gear niches/low benches, small central hearth, shield on front-left and simple banner pole on far right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Highlands Basic Barracks exactly as described. Preserve low stone military shelter, roof, central opening, hearth, shield and banner. No castle tower, crenellations, giant chimney or extra walls.

### 074 — Frontier Basic Barracks

**Canonical cues:** Improvised stockade-style barracks: charred posts, patched dark red-brown awning/roof, muted brown wall, dark central opening, supply rack and small ember brazier, a few charred braces, shield front-left and simple banner pole on far right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Frontier Basic Barracks exactly as described. Preserve improvised charred construction, patched roof, supply rack, ember brazier, shield and banner. No full palisade fort, tower, giant spikes or warlord decorations.

### 075 — Dark Crown Basic Barracks

**Canonical cues:** Dark field bastion: slate-gray wall, obsidian-like braces/posts, blue-gray shelter roof, dark central opening, two low bunk/supply blocks, contained dark brazier, purple diamond emblem high on front, shield front-left and simple banner pole on far right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Dark Crown Basic Barracks exactly as described. Preserve dark field-built shelter, low bunks, brazier, single purple emblem, shield and banner. No fortress towers, crown statue, lava or extra sigils.

## I. Creature territory / stronghold identity sprites

### 076 — Goblin roadside camp

**Canonical cues:** Two overlapping small brown/tan triangular lean-to tents, a small dark fire pit with one warm glint at lower left, and a small brown crate/block at screen-right.

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

### 094 — Market stand

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

### 097 — Command tent

**Audit status: KEEP PROCEDURAL — DO NOT GENERATE A SPRITE.**

**Reason:** The renderer changes the command-tent body color in Dark Crown versus other regions. It is repeated stronghold dressing rather than a unique landmark. Keep procedural instead of multiplying static variants.

### 098 — Forge

**Canonical cues:** Compact gray forge block: lower rectangular stone base, upper smaller stone block, central dark hearth opening with three small orange flame shapes, tall dark chimney on screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Forge exactly as described. Preserve two-tier stone forge, central hearth and right chimney. No anvil, smith, smoke cloud, tools or floor.

### 099 — War table

**Canonical cues:** Low dark brown oval/round table viewed slightly from above, two short legs/supports, one diagonal pale-brown map/line across top and three tiny warm marker glints.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the War table exactly as described. Preserve low oval tabletop, two supports, one diagonal map line and three tiny markers. No chairs, maps spilling off, weapons or candles.

### 100 — Dark throne

**Canonical cues:** Dark slate-purple blocky throne: wide low seat base, tall pointed/angular back rising at center, purple diamond emblem in center of back, two short dark arm blocks.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Dark throne exactly as described. Preserve blocky dark seat, tall angular back, single purple diamond and two arms. No skulls, spikes, occupant, stairs, banners or magic glow.

### 101 — Crown banner

**Canonical cues:** Tall steel-gray pole with a muted dark purple rectangular/pointed hanging banner to screen-right, bearing one simple lighter purple diamond emblem.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Crown banner exactly as described. Preserve tall pole, one dark purple hanging banner and single diamond emblem. No crown icon, skulls, fringe, extra flags or wind effects.

### 102 — Training dummy

**Audit status: KEEP PROCEDURAL — DO NOT GENERATE A SPRITE.**

**Reason:** The training dummy uses region-dependent local wood and appears as repeated functional clutter. The procedural form already handles regional palette variation cleanly.

### 103 — Weapon rack

**Audit status: KEEP PROCEDURAL — DO NOT GENERATE A SPRITE.**

**Reason:** The rack uses region-dependent local wood and appears across multiple regions/interiors. Keep it procedural so one sprite does not flatten regional material differences.

### 104 — Fish rack

**Canonical cues:** Simple drying rack: two wooden posts and top crossbar, exactly three pale hanging fish silhouettes suspended by thin lines.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Fish rack exactly as described. Preserve two posts, crossbar and three hanging fish. No nets, barrels, water, extra fish or surrounding camp.

### 105 — Ore crane

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

### 111 — Greenwood Vale Refuge / rest house

**Canonical cues:** Small regional refuge building. Main wall #baa888, roof #9b6350, timber #806044, trim #d8bd83, dark doorway #594b3b. Canon role silhouette: rectangular house body, triangular roof, central dark door, narrow chimney on screen-right, small round warm lantern on screen-left, plus warm timber side posts with two small muted-green low plant/brace accents.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Greenwood Vale Refuge exactly from the regional service-building canon: small house body, triangular roof, central dark door, right-side chimney, small left lantern, and warm timber side posts with two small muted-green low plant/brace accents. Preserve palette relationships wall #baa888, roof #9b6350, timber #806044, trim #d8bd83, dark #594b3b. No NPC, sign, beds outside, fence, road, smoke cloud or extra annex.

### 112 — Greenwood Vale Supplier stall

**Canonical cues:** Regional supplier shelter. Wall/counter #baa888, roof #9b6350, timber #806044, trim #d8bd83, dark storage #594b3b. Canon role silhouette: two main side posts, triangular roof, low counter, one dark box on screen-left, a small central oval good, one timber crate/block on screen-right, three small goods along the lower counter, plus warm timber side posts with two small muted-green low plant/brace accents.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Greenwood Vale Supplier exactly from the canonical service silhouette: two-post roofed stall, low counter, left dark storage box, small central good, right crate/block and three small counter goods, with warm timber side posts with two small muted-green low plant/brace accents. Preserve palette wall #baa888, roof #9b6350, timber #806044, trim #d8bd83, dark #594b3b. No merchant, text sign, awning redesign, extra shelves or scattered inventory.

### 113 — Greenwood Vale Town Captain / recruiter post

**Canonical cues:** Regional recruiter/Captain post. Uses roof #9b6350, timber #806044, wall/shield #baa888, trim #d8bd83, dark platform #594b3b. Canon role silhouette: low dark platform, two strong side posts, triangular roof, shield mounted on screen-left, slim steel weapon/pole near center-right, second timber pole on right, small triangular trim pennant/crest high on right, short central post, plus warm timber side posts with two small muted-green low plant/brace accents.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Greenwood Vale Town Captain/recruiter post exactly from the canonical structure: low platform, two posts, triangular roof, mounted shield left, slim steel pole/weapon center-right, timber pole right, small triangular trim crest and short center post, with warm timber side posts with two small muted-green low plant/brace accents. Preserve regional colors. No Captain character, barracks, tower, extra weapons, text or banners beyond the stated small crest.

### 114 — Greenwood Vale Quest board

**Canonical cues:** Regional quest board. Timber #806044, roof/cap #9b6350, board #baa888, trim #d8bd83. Canon role silhouette: two tall posts, short top cap/roof, wide rectangular board, one trim line near top, exactly five small pale parchment notices arranged across the face, plus warm timber side posts with two small muted-green low plant/brace accents.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Greenwood Vale Quest board exactly from the canonical structure: two tall posts, short top cap, wide rectangular board, trim line and exactly five small pale parchment notices, with warm timber side posts with two small muted-green low plant/brace accents. Preserve regional materials/colors. No readable text, NPC, lanterns, roofed kiosk, extra notices or decorative symbols.

### 115 — Flooded Marches Refuge / rest house

**Canonical cues:** Small regional refuge building. Main wall #aab1a1, roof #618789, timber #71654f, trim #abd0c0, dark doorway #465a57. Canon role silhouette: rectangular house body, triangular roof, central dark door, narrow chimney on screen-right, small round warm lantern on screen-left, plus raised/stilted wetland framing with extra lower supports and thin reed stalks along the roofline.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Flooded Marches Refuge exactly from the regional service-building canon: small house body, triangular roof, central dark door, right-side chimney, small left lantern, and raised/stilted wetland framing with extra lower supports and thin reed stalks along the roofline. Preserve palette relationships wall #aab1a1, roof #618789, timber #71654f, trim #abd0c0, dark #465a57. No NPC, sign, beds outside, fence, road, smoke cloud or extra annex.

### 116 — Flooded Marches Supplier stall

**Canonical cues:** Regional supplier shelter. Wall/counter #aab1a1, roof #618789, timber #71654f, trim #abd0c0, dark storage #465a57. Canon role silhouette: two main side posts, triangular roof, low counter, one dark box on screen-left, a small central oval good, one timber crate/block on screen-right, three small goods along the lower counter, plus raised/stilted wetland framing with extra lower supports and thin reed stalks along the roofline.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Flooded Marches Supplier exactly from the canonical service silhouette: two-post roofed stall, low counter, left dark storage box, small central good, right crate/block and three small counter goods, with raised/stilted wetland framing with extra lower supports and thin reed stalks along the roofline. Preserve palette wall #aab1a1, roof #618789, timber #71654f, trim #abd0c0, dark #465a57. No merchant, text sign, awning redesign, extra shelves or scattered inventory.

### 117 — Flooded Marches Town Captain / recruiter post

**Canonical cues:** Regional recruiter/Captain post. Uses roof #618789, timber #71654f, wall/shield #aab1a1, trim #abd0c0, dark platform #465a57. Canon role silhouette: low dark platform, two strong side posts, triangular roof, shield mounted on screen-left, slim steel weapon/pole near center-right, second timber pole on right, small triangular trim pennant/crest high on right, short central post, plus raised/stilted wetland framing with extra lower supports and thin reed stalks along the roofline.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Flooded Marches Town Captain/recruiter post exactly from the canonical structure: low platform, two posts, triangular roof, mounted shield left, slim steel pole/weapon center-right, timber pole right, small triangular trim crest and short center post, with raised/stilted wetland framing with extra lower supports and thin reed stalks along the roofline. Preserve regional colors. No Captain character, barracks, tower, extra weapons, text or banners beyond the stated small crest.

### 118 — Flooded Marches Quest board

**Canonical cues:** Regional quest board. Timber #71654f, roof/cap #618789, board #aab1a1, trim #abd0c0. Canon role silhouette: two tall posts, short top cap/roof, wide rectangular board, one trim line near top, exactly five small pale parchment notices arranged across the face, plus raised/stilted wetland framing with extra lower supports and thin reed stalks along the roofline.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Flooded Marches Quest board exactly from the canonical structure: two tall posts, short top cap, wide rectangular board, trim line and exactly five small pale parchment notices, with raised/stilted wetland framing with extra lower supports and thin reed stalks along the roofline. Preserve regional materials/colors. No readable text, NPC, lanterns, roofed kiosk, extra notices or decorative symbols.

### 119 — Ironroot Highlands Refuge / rest house

**Canonical cues:** Small regional refuge building. Main wall #a1aaa4, roof #727a73, timber #71695b, trim #c8c4a3, dark doorway #54574f. Canon role silhouette: rectangular house body, triangular roof, central dark door, narrow chimney on screen-right, small round warm lantern on screen-left, plus low stone platform/block framing with a small masonry/chimney-like vertical mass on screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ironroot Highlands Refuge exactly from the regional service-building canon: small house body, triangular roof, central dark door, right-side chimney, small left lantern, and low stone platform/block framing with a small masonry/chimney-like vertical mass on screen-right. Preserve palette relationships wall #a1aaa4, roof #727a73, timber #71695b, trim #c8c4a3, dark #54574f. No NPC, sign, beds outside, fence, road, smoke cloud or extra annex.

### 120 — Ironroot Highlands Supplier stall

**Canonical cues:** Regional supplier shelter. Wall/counter #a1aaa4, roof #727a73, timber #71695b, trim #c8c4a3, dark storage #54574f. Canon role silhouette: two main side posts, triangular roof, low counter, one dark box on screen-left, a small central oval good, one timber crate/block on screen-right, three small goods along the lower counter, plus low stone platform/block framing with a small masonry/chimney-like vertical mass on screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ironroot Highlands Supplier exactly from the canonical service silhouette: two-post roofed stall, low counter, left dark storage box, small central good, right crate/block and three small counter goods, with low stone platform/block framing with a small masonry/chimney-like vertical mass on screen-right. Preserve palette wall #a1aaa4, roof #727a73, timber #71695b, trim #c8c4a3, dark #54574f. No merchant, text sign, awning redesign, extra shelves or scattered inventory.

### 121 — Ironroot Highlands Town Captain / recruiter post

**Canonical cues:** Regional recruiter/Captain post. Uses roof #727a73, timber #71695b, wall/shield #a1aaa4, trim #c8c4a3, dark platform #54574f. Canon role silhouette: low dark platform, two strong side posts, triangular roof, shield mounted on screen-left, slim steel weapon/pole near center-right, second timber pole on right, small triangular trim pennant/crest high on right, short central post, plus low stone platform/block framing with a small masonry/chimney-like vertical mass on screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ironroot Highlands Town Captain/recruiter post exactly from the canonical structure: low platform, two posts, triangular roof, mounted shield left, slim steel pole/weapon center-right, timber pole right, small triangular trim crest and short center post, with low stone platform/block framing with a small masonry/chimney-like vertical mass on screen-right. Preserve regional colors. No Captain character, barracks, tower, extra weapons, text or banners beyond the stated small crest.

### 122 — Ironroot Highlands Quest board

**Canonical cues:** Regional quest board. Timber #71695b, roof/cap #727a73, board #a1aaa4, trim #c8c4a3. Canon role silhouette: two tall posts, short top cap/roof, wide rectangular board, one trim line near top, exactly five small pale parchment notices arranged across the face, plus low stone platform/block framing with a small masonry/chimney-like vertical mass on screen-right.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ironroot Highlands Quest board exactly from the canonical structure: two tall posts, short top cap, wide rectangular board, trim line and exactly five small pale parchment notices, with low stone platform/block framing with a small masonry/chimney-like vertical mass on screen-right. Preserve regional materials/colors. No readable text, NPC, lanterns, roofed kiosk, extra notices or decorative symbols.

### 123 — Ashen Frontier Refuge / rest house

**Canonical cues:** Small regional refuge building. Main wall #a18e7b, roof #76585a, timber #614f46, trim #c69a75, dark doorway #4d403a. Canon role silhouette: rectangular house body, triangular roof, central dark door, narrow chimney on screen-right, small round warm lantern on screen-left, plus charred pointed side posts and a rough diagonal timber brace.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ashen Frontier Refuge exactly from the regional service-building canon: small house body, triangular roof, central dark door, right-side chimney, small left lantern, and charred pointed side posts and a rough diagonal timber brace. Preserve palette relationships wall #a18e7b, roof #76585a, timber #614f46, trim #c69a75, dark #4d403a. No NPC, sign, beds outside, fence, road, smoke cloud or extra annex.

### 124 — Ashen Frontier Supplier stall

**Canonical cues:** Regional supplier shelter. Wall/counter #a18e7b, roof #76585a, timber #614f46, trim #c69a75, dark storage #4d403a. Canon role silhouette: two main side posts, triangular roof, low counter, one dark box on screen-left, a small central oval good, one timber crate/block on screen-right, three small goods along the lower counter, plus charred pointed side posts and a rough diagonal timber brace.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ashen Frontier Supplier exactly from the canonical service silhouette: two-post roofed stall, low counter, left dark storage box, small central good, right crate/block and three small counter goods, with charred pointed side posts and a rough diagonal timber brace. Preserve palette wall #a18e7b, roof #76585a, timber #614f46, trim #c69a75, dark #4d403a. No merchant, text sign, awning redesign, extra shelves or scattered inventory.

### 125 — Ashen Frontier Town Captain / recruiter post

**Canonical cues:** Regional recruiter/Captain post. Uses roof #76585a, timber #614f46, wall/shield #a18e7b, trim #c69a75, dark platform #4d403a. Canon role silhouette: low dark platform, two strong side posts, triangular roof, shield mounted on screen-left, slim steel weapon/pole near center-right, second timber pole on right, small triangular trim pennant/crest high on right, short central post, plus charred pointed side posts and a rough diagonal timber brace.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ashen Frontier Town Captain/recruiter post exactly from the canonical structure: low platform, two posts, triangular roof, mounted shield left, slim steel pole/weapon center-right, timber pole right, small triangular trim crest and short center post, with charred pointed side posts and a rough diagonal timber brace. Preserve regional colors. No Captain character, barracks, tower, extra weapons, text or banners beyond the stated small crest.

### 126 — Ashen Frontier Quest board

**Canonical cues:** Regional quest board. Timber #614f46, roof/cap #76585a, board #a18e7b, trim #c69a75. Canon role silhouette: two tall posts, short top cap/roof, wide rectangular board, one trim line near top, exactly five small pale parchment notices arranged across the face, plus charred pointed side posts and a rough diagonal timber brace.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Ashen Frontier Quest board exactly from the canonical structure: two tall posts, short top cap, wide rectangular board, trim line and exactly five small pale parchment notices, with charred pointed side posts and a rough diagonal timber brace. Preserve regional materials/colors. No readable text, NPC, lanterns, roofed kiosk, extra notices or decorative symbols.

### 127 — Dark Crown Refuge / rest house

**Canonical cues:** Small regional refuge building. Main wall #929ba5, roof #596478, timber #555563, trim #b6a5c2, dark doorway #454653. Canon role silhouette: rectangular house body, triangular roof, central dark door, narrow chimney on screen-right, small round warm lantern on screen-left, plus dark vertical braces with small pointed finials and a single purple diamond crest high on the frame.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Dark Crown Refuge exactly from the regional service-building canon: small house body, triangular roof, central dark door, right-side chimney, small left lantern, and dark vertical braces with small pointed finials and a single purple diamond crest high on the frame. Preserve palette relationships wall #929ba5, roof #596478, timber #555563, trim #b6a5c2, dark #454653. No NPC, sign, beds outside, fence, road, smoke cloud or extra annex.

### 128 — Dark Crown Supplier stall

**Canonical cues:** Regional supplier shelter. Wall/counter #929ba5, roof #596478, timber #555563, trim #b6a5c2, dark storage #454653. Canon role silhouette: two main side posts, triangular roof, low counter, one dark box on screen-left, a small central oval good, one timber crate/block on screen-right, three small goods along the lower counter, plus dark vertical braces with small pointed finials and a single purple diamond crest high on the frame.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Dark Crown Supplier exactly from the canonical service silhouette: two-post roofed stall, low counter, left dark storage box, small central good, right crate/block and three small counter goods, with dark vertical braces with small pointed finials and a single purple diamond crest high on the frame. Preserve palette wall #929ba5, roof #596478, timber #555563, trim #b6a5c2, dark #454653. No merchant, text sign, awning redesign, extra shelves or scattered inventory.

### 129 — Dark Crown Town Captain / recruiter post

**Canonical cues:** Regional recruiter/Captain post. Uses roof #596478, timber #555563, wall/shield #929ba5, trim #b6a5c2, dark platform #454653. Canon role silhouette: low dark platform, two strong side posts, triangular roof, shield mounted on screen-left, slim steel weapon/pole near center-right, second timber pole on right, small triangular trim pennant/crest high on right, short central post, plus dark vertical braces with small pointed finials and a single purple diamond crest high on the frame.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Dark Crown Town Captain/recruiter post exactly from the canonical structure: low platform, two posts, triangular roof, mounted shield left, slim steel pole/weapon center-right, timber pole right, small triangular trim crest and short center post, with dark vertical braces with small pointed finials and a single purple diamond crest high on the frame. Preserve regional colors. No Captain character, barracks, tower, extra weapons, text or banners beyond the stated small crest.

### 130 — Dark Crown Quest board

**Canonical cues:** Regional quest board. Timber #555563, roof/cap #596478, board #929ba5, trim #b6a5c2. Canon role silhouette: two tall posts, short top cap/roof, wide rectangular board, one trim line near top, exactly five small pale parchment notices arranged across the face, plus dark vertical braces with small pointed finials and a single purple diamond crest high on the frame.

**Image-generation prompt:**

> Create exactly ONE isolated static 2D game sprite for Azeroth Chronicles. The current procedural game drawing is canon; this is only a higher-fidelity raster translation of that same design. Preserve the stated silhouette, proportions, pose, equipment/feature placement, and color relationships. Add only material definition, shading, edge clarity, and surface detail naturally implied by those existing shapes. Do not redesign, restyle, beautify by invention, or add lore-bearing details. Transparent background. No scenery. No floor patch. No baked ground shadow. No text, labels, frame, UI, health bar, target ring, aura, attack effect, or extra objects. Keep the full asset visible with modest transparent padding and readability at small gameplay scale. Render the Dark Crown Quest board exactly from the canonical structure: two tall posts, short top cap, wide rectangular board, trim line and exactly five small pale parchment notices, with dark vertical braces with small pointed finials and a single purple diamond crest high on the frame. Preserve regional materials/colors. No readable text, NPC, lanterns, roofed kiosk, extra notices or decorative symbols.

## End of production catalog

The catalog is intentionally explicit so the generation phase never has to improvise visual design. If an asset cannot be generated without inventing information, stop that asset and return it to documentation/audit rather than filling the gap creatively.
