# Fresh original-master exports for the 150% camera

Joel selected 150% camera framing and resumed sprite production on 9 October 2026. His subsequent clarification requires fresh exports from original generated artwork, followed by native-size review and implementation. This policy applies to adaptation of existing sprites and to the remaining authorized sprite production. Read it with [CAMERA_SPRITE_TARGETS.md](CAMERA_SPRITE_TARGETS.md), [DESIGN_TO_SPRITE_WORKFLOW.md](DESIGN_TO_SPRITE_WORKFLOW.md) and the current production journal.

## Source of every replacement

Start with the untouched generator output for the accepted artwork revision. Do not enlarge the smaller 100% in-game export to make a 150% replacement, and do not use that export as a generation/editing reference in place of the original. Old runtime exports remain valid comparison and rollback evidence.

“Original” means the unprocessed generator output of the accepted revision, including an accepted artistic correction. It does not mean reverting to a superseded design: retain the accepted Goblin face, corrected steel tool handles and other recorded changes. Keep earlier originals as history.

For each asset, resolve its stable key, active revision, original file and hash, placement contract, attached animation frames/variants and any older intermediate files. Inspect the actual original artwork and verify its dimensions and usable detail. Check that the file really precedes processing; a file named `source.png` or “master” is not sufficient proof. Record unavailable historical provenance explicitly rather than inventing it.

## Audit older intermediates

Inspect the path from generator output through any padded, resized, cropped or translated master to the runtime export. Record original dimensions/hash, intermediate dimensions and operations, and the selected final output dimensions/hash. A large padded canvas can contain little artwork; judge the visible body and retained source detail.

If an older step downsampled or otherwise discarded detail, rebuild the new export from the untouched generator output. Carry forward only the placement information required to preserve the accepted footprint and grounding: reference canvas geometry, transparent padding, translation, root pivot and display/label anchors. Do not feed the lossy intermediate pixels into the new export.

Represent old resize/padding operations as a placement transform and apply it directly to the original for the final raster. Aim for one final resampling pass, adding transparent output padding as needed. Never enlarge an insufficient original to claim recovered detail. If the original is too small, unavailable or unreadable at the target, recover the retained original or generate an appropriate replacement under the existing authorization; preserve the old revision.

Keep all originals, intermediate files, processed exports, approvals, checkpoints and rollback records. New candidates and evidence use new immutable paths. Check older files without overwriting them.

## Sizing and placement

The camera remains at 150% by default. World units, movement speeds, collision, targeting and attack ranges stay unchanged. Sprite display dimensions and accepted grounding also stay unchanged; higher raster density supplies detail for the same world-sized artwork.

The standard body frame is 192×192 logical units. Its maximum desktop budget is 576×576 raster pixels (192 × 1.5 camera zoom × capped DPR 2); the phone budget alone is 432×432 at capped DPR 1.5. The existing canvas pixel budget can lower the effective ratio, so review the actual rendered ratio. These frame budgets include transparent space and do not mean that every visible body should fill the frame. Use each asset's exact contract and the visible-body targets in CAMERA_SPRITE_TARGETS.md. Terrain textures follow their separate material contracts; do not automatically turn every texture into a 576-pixel body frame.

Review the original's composition, intended size and placement before exporting. Check the new output's silhouette, feet/base, root pivot, translations, display bounds, label clearance and contextual overlays. Adapt dependent frames and variants from their own originals and retain consistent density, grounding and animation timing.

## Review the result in the game

Inspect actual 150% game scenes after preparing each replacement, including supported desktop and phone profiles, day/night, relevant combat/targeting context and affected clips/variants. Use the actual CSS body size and physical raster output, rather than a magnified master or contact sheet alone. Compare against the existing game appearance for identity and grounding; that comparison does not authorize using the old runtime image as an export source.

Enough source pixels do not prove good artwork. If faces, equipment, materials or outlines still read poorly, simplify or regenerate from the retained original and accepted procedural reference, with readable detail designed for the chosen on-screen size. Preserve organic anatomy, material-appropriate contours and accepted identity. Repeat export and in-game review after a correction.

The implementing agent owns these checks and faithful implementation under Joel's existing authorization. Record engineer review separately from actual user appearance acceptance; do not claim that Joel approved an unseen replacement or introduce another technical approval round.

## Evidence and release

For every replacement retain the original path/hash/dimensions, the audited intermediate lineage, final placement/export settings, candidate/output hashes, native-size review evidence, affected presentation dependencies and prior revision. Mark prepared, reviewed, integrated and released states accurately; sufficient pixels or successful preparation alone does not establish visual approval or release.

Use the existing immutable candidate, expected-revision replacement and registry interruption-recovery workflow. Run the required build, registry, regression and relevant device checks before publishing. Verify the exact deployed build, record the GitHub commit/PR and preserve a rollback target. Resume from the latest journal after interruptions without overwriting another chat's changes.

## Decision provenance

Source: Joel's current chat on 9 October 2026, approximately 02:10 and 02:22 EDT; a conversation URL is unavailable. Joel explicitly requested that this approach be documented in GitHub. His instructions were to use the original generated sprites for fresh 150% exports, check masters and older intermediates, rebuild from untouched generator output where detail had been discarded, retain necessary placement information, inspect the result in the game, and simplify or regenerate when detail still reads poorly.

This documents the required approach and production authorization. It does not assert that every original has already been audited or that any new replacement has already passed review or shipped.
