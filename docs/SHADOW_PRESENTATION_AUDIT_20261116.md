# Shadow presentation audit — 16 November 2026

**Owner objective:** bring SIBDLP's existing grounded shadows up to finished-product quality, with measured size, anchored placement, coherent day/night appearance, and no duplicate or missing shadows. Preserve basic elliptical art direction; do not introduce photorealistic projected silhouettes, a new lighting engine, gameplay/collision changes, asset reauthoring by default, save fields, or broad performance tuning.

**Source baseline:** `main@409f0ed671b0ff2563f788bf45ab665e01c05ca6` (dev.289). **Tracking:** [#893](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/893). **This branch:** first narrowly verified source-level duplicate treatment; full visual acceptance is still open. Do not interpret draft tests or this document as a merged/published fix.

## Historical reconstruction (verified GitHub metadata and source)

| Date / record | What it actually established | What it does not prove |
| --- | --- | --- |
| 6 Oct, [PR #16](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/16) | First registered Paladin body kept the existing procedural shadow and marker | Sprite-footprint/shadow fit for every replacement |
| 6 Oct, [PR #22](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/22), commit `6e350360` | Replaced the original single `#0006` oval with a two-pass, offset, translucent ground shadow and hard-coded kind/boss radii | That later bodies lack their own separate painted shadows |
| 9 Oct, [PR #127](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/127) | Nature sprite replacements retained procedural world shadows | Current manifest has no baked-in ground paint |
| 9 Oct, [PR #191](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/191) | Presentation-only size targets and asset-safe scale for houses, entrances, trees; no combat/collision changes | Every displayed sprite has a matching `rx/ry` foot |
| 25–26 Oct, [#484](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/484), [#485](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/485), integration [#490](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/490) | Real iPhone Canvas/Pixi comparison found missing Pixi shadows; integrated renderer now draws GPU ground ellipses under each actor using shared geometry | Owner current-head same-scene device acceptance |
| 26 Oct, [#491](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/491) | Special shadow exclusions for ground decals/Codex | General art fit for every prop |
| 3 Nov, [#752](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/752), [#758](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/758) | Highlands ferry Pixi shadow, body and depth now share actual vessel's visual anchor | All other unusual transport visual anchors |
| 5 Nov, [#828](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/828), commits `a57c33c`, `c049dadd`, `08819b9` | Removed generic ovals under wall/flat soil/bridge, reduced small plant ground, dimmed shadows outdoors after dark and quantized opacity for reusable Pixi geometry | Fully separate moon/contact/cast-light models or other-region visual acceptance |

The original sprite pipeline deliberately distinguished source body from presentation-owned shadows. Its generation references omit shadow/markers; retain that boundary.

## Current architecture

- **Shared descriptor:** `src/prototype/renderer.js:groundPresentation(e)` derives kind-based ellipse radii, selected visualScale, zero/low-opacity exclusions, a quantized outdoor daylight attenuation and gameplay marker styling.
- **Canvas:** `entityShadow(e,p)` draws a broad translucent ellipse at `(+4,+13)` and a smaller/darker contact ellipse at `(+1,+11)`, under the visible body. Most entities receive both. This *pair* is intentional, not itself duplicate artwork.
- **Pixi:** `src/prototype/pixi-experimental.js:actorFrame` submits the same shared descriptor at the stationary projected ground location. `tools/webgl-pilot/pixi-scene-bridge.js:groundGraphic` uses a reusable Graphics node under each actor. Signature includes quantized opacity; frame-to-frame movement does not allocate a replacement node.
- **Art body:** procedural `PrototypeVisuals.draw()` or registered `PrototypeSprites.draw()` is composited above ground. Source texture/pivot, optional idle bob and special visual transport position must not move the shared ground incorrectly.
- **Night:** `shadowOpacity=Math.round(16*base*(1-0.72*darkness))/16` outdoors; at darkness 1 an ordinary full-opacity contact is **0.25** following quantization, while the underlying unquantized target is 0.28. This fades *both* broad and contact components together with unchanged relative geometry/color. Current dungeons bypass outdoor daylight attenuation (keep unless actual interior observations justify change).

## Findings and bounded action

| Finding | Evidence classification | Disposition |
| --- | --- | --- |
| Procedural `shade()` draws an extra ellipse in pets, general boss branch and specifically Cindermaw; generic renderer also draws its two ellipses | **Confirmed by current source.** Cindermaw can receive two local ovals plus two common ovals. Local art is retained in Pixi procedural textures and cannot use the common nighttime opacity. | **Narrow candidate fix on this branch:** remove only obsolete local `shade()` calls and now-unused helper in `visuals.js`. Keep all body material shading, ground decoration, marker rings and scene paint. Add an actual native painter regression for ordinary/TRUE bosses, Cindermaw and pets. |
| All currently visible entities use broad category defaults despite different visual footprint widths | **Source-confirmed heuristic; individual appearance unverified.** E.g., many large landmarks enter `npc` default unless another rule applies, and only exact `house`/`workshop` prop structure names use the larger radius before scale. | Inventory visible sprites and procedural alternatives; review at 100/150/175% with consistent camera/feet. Change only demonstrated mismatches, not blanket scaling. |
| Day/night has one shared opacity rather than separate cast vs contact treatment | **Source-confirmed limitation.** Neither local lamps nor moon direction alters individual shadow position, and the same two ellipses remain at night. | Compare actual dusk, full night, dawn and locally illuminated interiors. Consider a dimmer broad cast and restrained stable foot contact (without misleading dark puddles), but require scene review and preserve markers. |
| Ambience split into static habitat and separately moving animal textures in Pixi | **Unverified overlap/placement issue.** Habitat has the entity ground descriptor; the per-animal texture entries have no `ground` field. Some animals or locations may instead contain naturally painted base contact. | Capture Canvas/Pixi wildlife together before introducing extra actor shadow graphics. Check that animal paint or grass is not duplicated. |
| Additional explicit visual ground paint in barracks/camps and authored facilities | **Intentional or unverified, not automatically a bug.** Ground patches and local post contacts are distinct from universal opaque shadows. | Preserve until scene-level comparison proves redundant/incorrect. Do not remove every ellipse or flatten handcrafted physical supports. |
| Active imported sprites could contain unwanted baked cast shadows or inconsistent transparent margins | **Unverified.** Original-master/manifest policy is encouraging but not a current pixel-level inventory. | Validate current manifest alpha and source-at-foot geometry against live representative captures, identify exact sprite key/revision before touching assets. |
| Night-opacity changes may trigger Pixi Graphics regeneration | **Existing mitigation confirmed.** Opacity quantized to 1/16 and cached by per-actor signature. | No new speculative performance changes. Profile only source-confirmed bottlenecks on representative dense native scenes. |

## Validation and acceptance matrix

**Phase 1 — source repair:** `node tests/shadow-artwork-grounding.test.cjs` tests the real procedural Canvas artist for duplicate boss/pet contact geometry and protects existing day/twilight/night and flat-object exclusions. Run existing focused `tests/pixi-fidelity.test.cjs`, `tests/pixi-parity.test.cjs`, `tools/webgl-pilot/pixi-scene-bridge.test.cjs`, `tests/greenwood-environment-quality.test.cjs`, plus relevant sprite assets tests. This is *source/native fixture* validation, not physical-device acceptance.

**Phase 2 — representative real game screenshots:** freeze actual Campaign, camera, active sprite selection, and clock; capture paired native Canvas and real GPU Pixi where available, **before/after** source candidate, including the following contrasts:

1. Actor grounding: hero in all four classes, ordinary mobs, captains, TRUE and normal bosses (especially Cindermaw), Soldier/Archer/Charmed/pet companions, resizes/idle/facing.
2. Props/scenery: houses, workshops, barracks, towers, trees/orchard, shrubs/wildflowers/crops, palisades, roads/bridges, loot, traps and interactive ground decals, with intentional exclusions distinguished.
3. Spatial consistency: Greenwood village, wilderness/fort/estate, March wetlands, Highlands ferry/mines, Frontier habitats/flight, Crown monumental buildings, major interiors.
4. Lighting: day, dusk, full outdoor night, sunrise, moonlit open space, occupied lamp/lantern/fires, dungeon/cave depth. Protect combat markers and accessibility against background grade.
5. Performance: simple fixed-seed actor count and Pixi ground signature/recreation count, unchanged save and renderer fallback. Avoid a new general performance optimization phase.

Review the *actual pixels at gameplay size* and record exact source SHA/seed/zoom/renderer/clock and what changed. A synthetic palette check or broad CI green cannot replace an observed foot-to-body match. Capture artifacts must be traceable; compare against earlier accepted playtest screenshots, not generated concept art. Record owner aesthetic acceptance and physical device evidence separately.

**Acceptance status:** confirmed duplicate local path addressed by a draft candidate; all cross-region art quality, imported asset pixel census, all-class coverage and physical-device visuals remain **unverified** at the time of authoring. No merge, main-release or Pages/PWA update is authorized by this audit.
