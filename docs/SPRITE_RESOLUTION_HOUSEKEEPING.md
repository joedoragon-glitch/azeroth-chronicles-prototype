# Sprite resolution housekeeping · 150%

Joel requested preparation before adapting the existing artwork. This release changes developer tooling and review safeguards; no production image, manifest, approval, original, animation or historical checkpoint is replaced. Camera framing remains 150%. Artwork adaptation and generation are paused.

## Compatible units and processing

The accepted reference canvas remains 192×192 logical display units. Runtime display dimensions, anchors and label clearance keep their existing contracts. The renderer already separates image pixels from those units, so no gameplay or sprite runtime rewrite is needed.

`prepare` accepts a placement JSON with `rasterScale`, default 1 for compatibility. Scale 3 produces a 576×576 raster covering 150% camera × maximum desktop canvas ratio 2; scale 2.25 produces 432×432 for phone ratio 1.5. Outputs must have integer pixel dimensions, remain within the 576-pixel static limit and existing resource/encoded-memory guards, and use enough original pixels to avoid enlargement. No implicit cropping, trimming or color conversion is introduced. The existing recorded nearest resampler remains authoritative.

Translations are specified in reference display units and multiplied by raster scale. The resulting pixel translation must be integral and cannot discard visible content. New records explicitly retain raster scale, input/output dimensions and both reference/pixel translations. Old version-1/2 records without a raster scale retain density 1; their bytes and approval references are unchanged.

Publication validates actual source dimensions and hashes, raster dimensions and logical contract geometry. Current canvas size must not be changed to accommodate a denser raster. Mixed-density clips or variants reject; frame pivots and rectangles use raster pixels. A 576-pixel animation frame occupies its own bounded 580×580 padded page, with content-identical pages deduplicated by the existing loader. Assembly resets final review. Static fallback, affected clips and variants must be reprocessed together or stale presentation explicitly omitted.

## Native review and retention

Review profiles now cover desktop 1280×800 and 1024×700, phone 375×800 and 393×852, and phone landscapes 800×375 and 844×390, each in day/night. Profiles select desktop/phone explicitly. Both comparison views use 150%, the actual capped canvas ratio and the existing three-million-pixel budget. The 1024×700 profile exercises the full desktop ratio 2; larger desktop canvases may use a smaller ratio.

The showroom records physical PNG sizes separately from CSS viewport dimensions, scales isolated comparisons to 150% and marks the canvas ratio. Open full scene PNGs for 1:1 raster inspection; responsive page images and contact-sheet thumbnails are navigation aids, not native-pixel evidence. Batch capture retains full scene PNGs, hashes and physical crop geometry, and stages review output before committing it. Existing review directories and candidate checkpoints reject overwrite. Create a new revision directory for adaptation.

## Readiness inventory and limits

`sprite:resolution` validates current production, reports original/output paths, current/target density, exact revision lease, visible body footprint, source pixel sufficiency and dependent animation/variant work. It inventories retained candidate JSON files without promoting their historical review or canon to current acceptance. `docs/evidence/SPRITE_RESOLUTION_READINESS.json` records the preparation snapshot: 33 active keys and 44 retained candidate records. All 33 active retained sources, including current Paladin frame sources, contain enough pixels for the target. That establishes technical pixel availability, not artistic readability.

Active decoding remains capped at 16 MiB and two concurrent decodes. A single 576×576 RGBA fallback costs 1,327,104 bytes. Packaged unique resources retain the separate 128 MiB decoded/encoded policy; prepare staged batches rather than expanding caps to accommodate an entire future catalog. Actual image sizes and atlas content are budgeted, with procedural/static fallback and retirement still provided by the existing loader. These checks are software evidence, not physical-device performance benchmarks.

## Next production step

After a request to resume artwork adaptation, start with Paladin and Goblin. Read current originals and exact revision leases, retain the accepted identity and organic material/anatomy cues, prepare density-3 candidates with the existing explicit translations, and include Paladin's idle frames. Inspect at native 150% on desktop and the supported minimum phone, in day/night and combat context. Simplify or regenerate only details that fail that review. Replace through the existing leased immutable-revision workflow, preserving rollback. Do not resize the processed 192-pixel outputs to fabricate new detail.

Verification uses synthetic transparent fixtures in isolated checkouts to prove legacy compatibility, no source enlargement, translation guards, logical grounding, physical memory accounting, bounded dense atlases, native reviews, same-session replacement, retained old binaries and legacy rollback. Production assets remain byte-identical.

## End-to-end audit follow-up

See `SPRITE_WORKFLOW_AUDIT.md` for generation-request provenance, candidate-bound review, source-normalization guards, validated rollback history and process-interruption recovery. Use `sprite:request` before future production; use `sprite:recover` / `material:recover` if an interrupted registry transaction is detected. Artwork production remains paused.
