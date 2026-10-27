# Canvas Phase 4 — wildflowers selective procedural-art reuse gate

Date: 27 October 2026  
PR: [#527](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/527) (draft)  
Authority: [Phases 0–3 consolidation](CANVAS_PHASE0_3_CONSOLIDATION_HANDOFF_20261027.md), [roadmap](CANVAS_NATIVE_PREPARATION_ASSESSMENT_20261027.md) and [Phase 3 HOLD](CANVAS_PHASE3_LOOKAHEAD_EVIDENCE_20261027.md).

## Decision — HOLD production caching

Phase 4 examined **one** candidate, the existing `prop` / `decorative` / `structure: 'wildflowers'` family in `PrototypeVisuals.draw()`. This decorative branch uses four flower groups with repeated stems and filled ovals, so it is plausible work to avoid repeating. It has no evident animation-clock or campaign-state input in the specific `craftedDecoration('wildflowers')` body. It is nevertheless rendered through the shared contour implementation, local entity transform, camera translation and DPR/zoom scaling. The artist-authored native vector raster remains the canon.

**Do not install an active cache yet.** Even a favorable isolated `drawImage` timing is not evidence of net real-frame improvement, enough on-screen repeated instances, pixel-faithful antialiasing under fractional movement, or safe target-device memory. There is no measured Chromebook/iOS browser benefit and Phase 2 browser screenshot acceptance remains outstanding. The phase meets its research/hold option: retain direct procedural drawing and original sprite fallback in the shipping renderer. No new preparation scheduler, canvas, scene generation, manifest entry, saved preference or Pixi texture was introduced.

The source-only A/B is `tests/canvas-procedural-art-phase4-benchmark.test.cjs`. It uses the **actual** `PrototypeVisuals.draw()` art twice, either directly in a visible Node Canvas or drawn once into a hypothetical tile and subsequently composed with `drawImage()`. It records offscreen bake cost, warmed 90-draw calls, pixel differences, and logical tile-byte estimates. **Measurement cannot be treated as game FPS, browser compositor timing or a target-device win.**

## Candidate inventory and suitability

| Candidate | Repeated work | Immutable conditions / exclusion | Decision |
| --- | --- | --- | --- |
| `wildflowers` decorative prop | 4 stems and 16 petals plus centers, outlines and native contours; can appear in outdoor scenery | Static only for specifically marked decorative props; do not include living/nesting/animated props, actors, shadows, labels, combat telegraphs or layered VFX | **Microbenchmark only**; fail closed to direct vector painting |
| Other trees, settlement houses and decorative structures | More elaborate but larger, more varied and sometimes independently animated/contextual | Require individual provenance, variant and depth studies | Not in Phase 4 candidate set |

The renderer depth-sorts live entities and places ground marker, shadow, aura and flight/combat cues *before* the body, while labels and other effects remain live. A hypothetical art tile could only replace the body at that precise position in `sprite()` **after** the registered-sprite attempt fails. Moving drawing to the floor cache, replacing an active illustrated sprite, or flattening overlays would change visual canon and is prohibited.

## Baseline, identity, invalidation and fallback contract for a future revisit

- **Baseline:** ordinary direct `PrototypeVisuals.draw()` of the original `wildflowers` body, not an already-warmed raster, compared to a warmed bitmap at CSS zoom 0.85, 1.0, 1.25, DPR 1, 1.5, 2, and integer/fractional screen anchors. Bench sample reports *only* Node CPU operation wall time and RGBA mismatch counts; test-only study surfaces do not ship.
- **Identity:** art family/structure and approved art-source revision; contour/geometry class; region, palette/material version and optimization mode; variant or entity-specific authored shape parameters (including ID/seed when uncertain); actual visualScale/rotation/mirroring; DPR, zoom, raster width/height; and the fractional pixel phase of the translated anchor. No key is acceptable if its input can silently change with game time, animation, combat or a rescue/progression flag.
- **Invalidation:** dispose on visual source/material revision, region/scene change, zoom, DPR, renderer mode, pixel-phase change, quality/optimization setting, page hide/restart, explicit reset and any entity variant/geometry change. Failed key validation draws native art, never a stale bitmap.
- **Memory ownership:** any later CPU surface must have one Canvas renderer owner, not the sprite decoder or Pixi GPU cache. A provisional **2 MiB art sub-limit** would be *inside* a hard combined ceiling of the current nominal **64 MiB ground limit**: `floorRasterBytes + artworkRasterBytes <= 64 MiB`. That cannot be guaranteed by separately enforcing two limits. Release the candidate's oldest/single raster before allocating a replacement; if the existing floor raster leaves no room, do **not** evict it merely to paint flowers—draw direct. These are RGBA *estimates*, not device process-memory guarantees.
- **Fallback:** missing/changed key, unsupported zoom/transform, invisible/invalid body, failed allocation, drawImage exception, memory pressure, or disabled cache must continue immediately through the existing native Canvas art path with no save writes, simulation calls or mode switch. The baseline remains independently usable.
- **Preparation:** no background or title work at this stage; no eager region prepaint. A cache would be populated only from already-visible, eligible props and must not generate or mutate zone, game, RNG, writer ownership, actor poses or combat state.

The research test explicitly checks that a *proposed* key changes when DPR, zoom, anchor fractional phase, region, artwork revision, palette or family changes, that the hypothetical tile estimate stays within a small study bound, that the production fallback call exists, and that the supplied prop object is unchanged. **These are research guards, not real production-cache invalidation/eviction certification.** The established `tests/ground-cache.test.cjs` and `tests/canvas-title-preparation.test.cjs` remain the production Canvas cache and campaign-lifecycle regression gates.

## Acceptance ledger

| Gate | Evidence | Status |
| --- | --- | --- |
| Native procedural candidate examined | `visuals.js` wildflower path; `renderer.js` depth / sprite / overlay path | Source-reviewed |
| Direct vs hypothetical reuse: CPU cost / pixel difference at multiple DPR / zoom / anchors | `canvas-procedural-art-phase4-benchmark.test.cjs`; exact CI receipt to be recorded | **Research only** |
| Actual production procedural cache / combined floor + art eviction / failure tests | Not implemented | HOLD / not applicable until a valid proposal |
| Visual screenshot parity in real browser incl. fractional motion / full scene | Not run | Open |
| Repeated-scene frequency, frame p95/p99, net main-thread savings and memory on real Chromebook/phone | Not measured | Open |
| Campaign/save integrity and Pixi/PWA/Keep-Revert acceptance | Existing unaffected source; no new runtime path | New feature not installed; broader Phase 2–6 gates remain open |
| Merge, deploy, Phase 3 lookahead | Explicitly unauthorized | **None** |

## Required evidence to lift HOLD

Instrument actual repeated on-screen wildflower count and per-family draw cost in matched Canvas frames before writing a cache owner. Show meaningful whole-frame tail improvement, including bake and eviction amortization, at realistic instance counts. Require no visible image drift at fractional anchors, different DPR/zoom/quality and night lighting, and verified process-memory headroom across sustained roaming. Only then prototype an opt-in, bounded Canvas-only cache and add *real* visual/invalidation/failure/eviction/campaign tests to its implementation. Reject immediately if pixel parity or device tails regress. Phase 3 regional lookahead stays disabled regardless.

**Status:** Phase 4 investigated; production cache HELD; PR remains draft and unmerged. No performance upgrade is claimed.
