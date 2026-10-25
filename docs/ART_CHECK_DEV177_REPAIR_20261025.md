# Inherited artwork/tool verification failures — dev.177 baseline repair

Base: main `ae0c0084c90a397738376f851d1d22c902c67279`. Draft review only; no game deployment or automatic artwork approval.

## Investigation and disposition

1. `prop:ore-sorting-bay:highlands`: the current-design decisions and the October 20 procedural-gallery selection explicitly favor the procedural body. The older registered raster comparison is no longer current. Move the active registry/manifest entry into existing revision history without erasing the original PNG or recorded assessment. Every other registered sprite and the gameplay selection remain unchanged. Restoring the raster requires a new valid current-canon review, not a hash update.
2. `terrain:ground:march`: T002's earlier palette `#26444b / #31535a / #203b42 / #85ada6` is absent from current `floorPalettes[1]`, which reads `#3e5544 / #4b614b / #30483c / #a2b48e`. The scope audit correctly detected missing source evidence, not missing PNG artwork. Reconcile the current material specification, art-catalog prompt and scope evidence with the real renderer. Retain the superseded approved texture in rollback history, with its original source and output hashes. Outdoor March floors are already excluded from texture painting; the distinct `supply-march` floor remains unchanged. Any new T002 art needs independent preparation and native/wrap review.
3. `scripts/material-pipeline.cjs`: its VM loads the renderer with `PrototypeRules` but without `PrototypeHighlands`. The renderer's CommonJS fallback therefore tries `require('./highlands.js')` in the reference VM, which provides no `require` function. Supply the concrete Highlands module explicitly, as the sprite pipeline already does. Keep the VM restricted and the material checks intact.

## Acceptance and limitations

Verify `node scripts/sprite-pipeline.cjs check`, `node scripts/sprite-scope-audit.cjs --check`, and `node scripts/material-pipeline.cjs check`, together with focused sprite/scope/material tests, reproducible packaging and changed-file formatting. Approval is never inferred from the passage of tests, nor can a historic image's canon/dependency hash be silently rewritten. All active materials remain subject to strict provenance checks; historical revisions remain byte-verifiable. All original approved PNG and source files, test decisions, game rules, save schema and Canvas renderer remain unchanged.

This report describes a proposed correction, not a passing test certificate. Any subsequently exposed material dependency drift must be reviewed rather than waived. Do not merge or publish without review and authorization.
