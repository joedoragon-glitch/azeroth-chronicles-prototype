# Terrain texture pipeline · v0.8.94

The dedicated opaque-material path precedes terrain image production. This pass adds no active terrain images. All 28 current candidates retain stable T001–T028 IDs and exact resource keys in `tools/sprites/terrain-specifications.json`.

`scripts/material-pipeline.cjs` captures flat current-source reference samples and preserves immutable originals. Preparation requires a bounded square, fully opaque PNG and produces a 256 × 256 lossless PNG with an explicit Lanczos3 resize. It does not crop, trim, change colors or repair seams. Opposite-edge discontinuities are measured against internal grain; publication rejects excessive discontinuity. Every material needs recorded native-scale and 3 × 3 wrap review. Authorize faithful engineer implementation without claiming unseen images received Joel's creative acceptance.

`src/prototype/material-contract.js` owns the runtime/build schema. Exact keys, local filenames, hashes, revisions, dimensions, repeat span and restrained opacity are checked. `tools/sprites/materials/approved.json` owns active records and retained history; the runtime manifest derives from it. Publication and rollback use expected-revision leases, retained source/output files and atomic metadata recovery. A procedural rollback removes the active material while preserving its history. The packaged material budget includes retained revisions.

`src/prototype/materials.js` maps repeat patterns in world coordinates, then applies the existing isometric projection. It clips to the actual floor tile, road interior, rocky/lava surface or bridge top. Grain follows the camera and retains the current DPR transform. Wood grain has explicit orientation. Supply-room and side-interior keys follow current map identity. Water, margins, joints, fractures, planks, supports, geometry and animation remain owned by their existing procedural renderers. Existing day/night treatment applies afterward.

The loader lazily decodes at most two images concurrently, with a 2 MiB active decode/reservation budget, visible-resource pins, LRU eviction and revision retirement. Failed, missing or timed-out resources fall back to current procedural surfaces. No simulation, collisions, saves or combat timings change.

The shared site inventory enumerates every active material for packaging and service-worker precaching. A missing active tile rejects installation before the new worker auto-activates. Rollback binaries remain in the repository, while only active textures enter the player download.

Validation covers opaque/square processing, seam measurements, unchanged masters, replacement leases, retained rollback/removal/restoration, atomic failed-install behavior, offline bytes, world-phase stability and exact clipping. A 28-resource stress fixture stays within residency/concurrency bounds. Real WebKit passes on desktop and phone sizes; Chromium and WebKit checks are part of release CI. These software checks do not claim measured performance on Joel's physical device.

Next: produce and review the five regional ground pilots, then proceed through roads, interior floors and stone/lava/wood materials in small batches. Compare current material color, native grain strength, wrap seams, all device sizes and day/night scenes before activation.

## Ground pilot review

The five regional ground pilots retain exact image-generation prompts and original sources under `tools/sprites/batches/2026-10-08-terrain/T001` through `T005`. Review evidence includes 3×3 wraps, edge measurements and four desktop/phone viewport pairs in day/night. Reproduce a native comparison with `node scripts/material-pipeline.cjs showroom tools/sprites/batches/2026-10-08-terrain/T001/candidate/candidate.json`. Its left column is procedural canon and its right column adds the proposed grain. World span 320 and opacity 0.28 remain explicit per-resource settings; no roads, objects, geometry or terrain collision are baked into these images.


## Bounded ground projection · v0.8.123

Ground materials reuse a screen-aligned isometric repeat at the current physical Canvas scale. Original world phase, opacity and surface clips remain authoritative. A separate 8 MiB projected RGBA LRU cache supplements the existing 2 MiB source-image budget; eviction and manifest retirement release backing stores. Unsupported/oversized/non-ground transforms keep the original projection. Artwork, scene animation, gameplay and saves remain unchanged. See [MATERIAL_RENDERING_PERFORMANCE.md](MATERIAL_RENDERING_PERFORMANCE.md) for regression evidence, sampling tolerances and device-test limits.
