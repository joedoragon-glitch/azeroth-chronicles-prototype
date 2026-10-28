> **Current Rogue canon / archival notice — 28 October 2026:** Rogue/Pícara **has shipped as the fourth playable class** after PR #511 merged. This file is a dated implementation, art or preview record, **not the current release gate**. Binding equipment is one **staff with a suspended oversized spherical jingle bell** in normal/crowned art, never guitar, lute or strings. Critical intensity is developer-only (Rogue Level 2 default), and legitimately Charmed companions—not Rogue herself—construct the first Barracks. For any new changes or publicity follow [current Rogue canon](ROGUE_CURRENT_CANON.md) and [development state](DEVELOPMENT_STATE.md); old draft statuses, guitar audio/art, skill names and preview instructions below are superseded history.

# Rogue — Phase 7 static procedural first-play appearance (27 October 2026)

**Status:** staged on draft PR #511; **not owner-approved, merged, publicly deployed or browser/device visually accepted.** This is game-source artwork, not a generated concept image or a preapproved raster sprite. The playable preview stays behind `?roguePlaytest=1` on a separately hosted draft build.

## Source and owner decisions

The binding appearance is [original Rogue discussion](ROGUE_BARD_DISCUSSION_RECORD_20261026.md) plus [static visual specification](ROGUE_BARD_STATIC_VISUAL_DESIGN_20261026.md) as overridden by later direct owner decisions. Use **Rogue** (ES **Pícara**) as the single-word *player-visible* class name; keep the internal `rogue` identifier and the existing multi-file architecture. This is the attractive, warm dark-brown-skinned, mischievous woman with visible long black wavy hair, asymmetric plum/violet/copper sari-inspired practical travel clothes, brass adornments and sash. Her **single weapon** is a staff with **one oversized spherical jingle bell suspended from its crooked head**, never an instrument with strings. Reference pictures previously supplied cover only that weapon, not another character's outfit.

## Actual game implementation

`src/prototype/visuals.js` now has `rogueHero(false)` and `rogueHero(true)`, routed directly from existing `hero('rogue')` and `crownedHero('rogue')`. Both share the same `rogueBellStaff(crowned)` geometry, complexion, face, uncovered hair and foot anchor. Crowned Rogue adds the dark-violet royal mantle, crimson facing, five-point narrow circlet and violet jewel; no new weapon. Other three class paths are intentionally untouched.

This is **static canvas drawing** at native in-world hero coordinates, which the existing renderer and Pixi's procedural fallback can invoke. There are no new animations, frame timings, movement poses, attack rigs, generated image files, caches, collisions, camera scales, simulation effects or save fields. There is deliberately **no** `hero:rogue` raster entry in the sprite manifest; the standard optional asset lookup misses and falls back to the new native procedural art, while crowned heroes already use the procedural path. The existing public class roster is not changed.

`src/prototype/app.js` uses `Rogue` / `Pícara` for player-facing class selection, character summary and ending; `src/prototype/menus.js` uses the matching one-word class reference. Historic document titles and internal feature names may remain Rogue Bard for provenance.

## Coverage / evidence

`tests/rogue-bard-procedural-art.test.cjs` drives `PrototypeVisuals.draw` with a traced Canvas context for regular and crowned variants. It checks geometry/colors, same-state deterministic replay, lack of actor mutation, balanced context ownership, distinctness from all three legacy heroes, optional raster fallback, and final one-word presentation strings. `docs/evidence/SPRITE_SCOPE_RECONCILIATION.json` refreshes only the exact `visuals.js` source SHA256 after review; the approved raster catalog/families/palettes remain unchanged.

**Not yet proven:** Browser-accurate screenshots at native and 375px-phone sizes in day/night across all five regions, Canvas and optional Pixi comparison, actual readable face and bell in motion/occlusion, renderer performance, and owner aesthetic acceptance. A test-context trace or conceptual mockup does **not** certify the visual result. These remain explicit manual preview gates. Do not change game mechanics, saves, PWA behavior or publicly enable the class as part of art review.
