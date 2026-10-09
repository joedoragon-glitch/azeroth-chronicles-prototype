# Sprite additions, replacement and animation readiness · 8 October 2026

## Implemented lifecycle and pilots · v0.8.92

Three production keys are active: `hero:paladin`, `enemy:goblin` and `prop:vale-cottage:vale`. The Goblin uses Joel's explicitly accepted playful half-smile and organic ears. Paladin has a faithful two-frame idle; its static fallback is retained as a rollback revision. Native placement and desktop/phone day/night comparisons are recorded under `tools/sprites/pilots/2026-10-08-refined`. Engineer review of the idle is distinguished from Joel's actual image acceptance.

The versioned optional format supports clip rectangles/pivots/timing and stable-ID variant banks. The loader is lazy, deduplicates content, limits concurrent decodes to two and active decoded residency to 16 MiB, pins visible resources and retires obsolete revisions. Replacement, removal and rollback use expected revision leases and immutable retained originals. Atlas assembly requires a final visual review. Build/offline enumeration shares the same resource schema. Asset-scoped evidence isolates unrelated catalog/map additions. Playtest exports include sprite diagnostics.

Chat edits follow `DESIGN_TO_SPRITE_WORKFLOW.md`; `npm run sprite:asset -- "name or exact key"` exposes current originals, revision, dependent presentation and history. An authorized edit proceeds through generation, visual checks, implementation and release. Reconcile affected frames/variants together, or temporarily use the new static design. Preserve material-appropriate contours across every candidate, rather than copying accidental procedural blockiness.

The reconciled scope remains 296 decisions (280 GENERATE, 16 PROCEDURAL), 70 prepared body contracts and 28 separate terrain material candidates. This release completes the lifecycle foundation and three pilots. Remaining body production, terrain texture processing/world mapping, authored directions and additional motion clips are subsequent asset jobs. Runtime memory bounds are software checks; they do not claim a measured physical-device performance guarantee.

The following audit/preparation notes describe the earlier checkpoint and remain historical evidence.

Joel requested that future additions, replacement and eventual animation be included in the current system review. The present system is a validated static pilot pipeline. It is not yet optimized for the entire expanded catalog, in-session asset replacement, natural variant banks, terrain materials or animation. This audit records concrete upgrade requirements before bulk integration; it adds no runtime behavior or animation art.

## Current evidence

| Operation | Current behavior | Required follow-up |
| --- | --- | --- |
| Add a new static body | Reviewed open catalog totals; exact prepared key; immutable input/output hashes; source/anchor validation; registry-derived packaging | Keep stable asset IDs and per-asset records; prepare each new exact contract rather than copying a guessed key |
| Change an existing image | publish deliberately rejects an already approved key | Add explicit replace/rollback with an expected-old-hash lease, retained old source and preflighted new output |
| Reload a changed manifest in the same session | Images and loading promises are keyed only by logical key; installManifest clears failures but retains decoded images | Key decoded/load state by content identity or URL+hash; retire removed/stale revisions, and ignore late stale loads |
| Load the whole art catalog | preload eagerly schedules all definitions; no runtime decoded LRU | Load current-zone/visible and imminent assets; bound decode concurrency and active memory; pin necessary assets and retain procedural fallback |
| Reuse a shared file | Packaging deduplicates source paths; runtime Image objects are separately keyed | Deduplicate actual decoded content, not only manifest paths |
| Animate an asset | draw draws the full image; no frame/clip timing or directional selection | Add a versioned optional clip/frame layer with static/procedural fallback and a paused presentation clock |
| Cache animation/terrain offline | Current sprite packaging and service worker enumerate only entry.src | Enumerate and validate every active static image, atlas page and texture through one inventory |

Read against sprites.js, renderer.js, sprite-pipeline.cjs, scripts/build.cjs and the service-worker template. Evidence in docs/evidence/SPRITE_LIFECYCLE_AUDIT.json includes an isolated VM test of the actual current loader: a new manifest requests new.png but the existing same-key decoded old.png is still drawn. This is a same-session invalidation gap, not a claim that a clean app reload cannot adopt new art. Full release replacements still need a version/cache update.

The current static publication cap is 16 MiB decoded. An illustrative 280-image catalog at the current 192×192 RGBA canvas is 39.375 MiB; 28 256×256 material textures add 7 MiB, before additional nature variants, animation, decode overhead or other application memory. Actual dimensions, unique resources and cropping/atlas packing may reduce this. Do not raise the cap to make eager loading pass. Separate total packaged resources from bounded active decoded residency, measure real phone/Chromebook behavior, and stage integration. Budget calculations are not performance benchmarks.

## Asset lifecycle contract

Logical gameplay identity stays stable, for example hero:paladin or prop:bush:vale. Content revisions use immutable hash-named files, with provenance and a changelog of accepted revisions. Adding a later candidate does not renumber existing work or discard its master.

Replacement is a single reviewed operation: verify the expected active revision; preflight source/output hashes, canon, anchor, format and residency budget; stage the new resource and authoritative registry; switch the manifest atomically within the repository release; preserve the old accepted source/revision for rollback. Failure restores prior metadata/resources. The browser retires decoded old revisions and stale pending decodes. Removing an asset drops its live references and keeps a procedural fallback. Do not silently overwrite a file at the same URL or evict a live pinned frame while it is drawn.

The development-only approval/provenance record remains distinct from packaging and from runtime rendering. A catalog count change alone cannot invalidate an unrelated accepted asset's appearance. Its own source/contract changes require review and fresh metadata. Explicit generation/implementation authorization does not require technical approval homework from Joel.

## Animation format and rendering plan

The proposed extension retains the current static src, display size, pivot/anchor and label clearance as a fallback. Optional named clips refer to frames with image/atlas source rectangles, duration, common pivot and optional authored facing. A static asset remains a one-frame asset; the logical identity does not change when clips are added. A versioned format migration must be explicit because the current approval validator only accepts the exact static manifest it derives.

The renderer supplies presentation state and a shared clock. Idle/walk/attack/hurt/death are candidate clip names, not automatically required generation jobs for every object. Choose states, direction count and frame counts per current gameplay need. Environment sway, water/lava motion and actor clips have different owners; all must respect pause, hidden/background suspension and reduced motion where available. Timing, collision, damage windows, telegraphs and save data remain gameplay-owned. Attack frames follow actual action timing rather than delaying damage to match art. No per-sprite timers or new campaign save state are required.

Frames preserve feet/root grounding, apparent body size, equipment ownership, palette and a safe canvas across motion. Existing accepted masters can supply a fallback and visual reference; they do not guarantee that every directional or articulated frame can be generated without new art work. Keep true-form, guard/officer cues, labels, warnings and shadows in their correct presentation owners. Missing/invalid/unloaded clips fall back to the accepted static image, then current procedural rendering.

Produce individual referenced frames, then assemble atlases deterministically in tooling. Do not ask the image generator to invent a complete sheet. Validate source rectangles, page dimensions, edge padding, pivot consistency, durations, loop endpoints and total unique decoded residency. Compare clips at native size and in desktop/phone day/night scenes. Optional trimming must retain and compensate the exact pivot; keep untrimmed masters. Atlas changes must not silently reinterpret frame indices.

## Implementation order

1. Complete current pilot source/anchor corrections and preserve accepted design direction.
2. Implement reversible replacement and content-aware invalidation; add deterministic tests for replace, remove, rollback, reload and a late old decode.
3. Add bounded lazy/shared loading, residency/decode instrumentation and variant-bank selection, with current-zone preload and fallback tests. Preserve the strict current eager budget until its active-residency replacement is proven.
4. Prove the five-ground terrain processor/render path and environment comparisons. Integrate static batches using the new loader; measure real limits.
5. Add the backward-compatible clip/atlas adapter and a small actual gameplay animation pilot. Verify pause/background behavior, action synchronization, anchoring, failed clips and offline resources before expanding animation production.

The immediate task is scope and readiness reconciliation. These runtime additions require their own tested implementation/release; neither this document nor the format plan claims they already exist. See tools/sprites/asset-format-plan.json for the concrete proposed shape, and SPRITE_SCOPE_RECONCILIATION.md for the current generation inventory.

## Memory policy update · v0.8.126

Joel explicitly approves a 256 MiB decoded sprite-residency ceiling, superseding the earlier 16 MiB active-runtime policy described above. The current shared contract and production policy agree. Lazy loading, content sharing, two concurrent decodes, LRU eviction/visible pinning, per-image limits, packaged/download limits and original-master art remain unchanged. This is additional cache headroom, not a request to eagerly load the catalog. See GROUND_WINDOW_PERFORMANCE.md.
