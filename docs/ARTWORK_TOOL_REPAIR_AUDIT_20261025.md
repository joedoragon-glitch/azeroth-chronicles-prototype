# Artwork tooling repairs — isolated change audit (PR #445)

Date: 2026-10-25. Baseline: main at ae0c0084c90a397738376f851d1d22c902c67279 (snapshot.dev.177).

## Scope and causes

1. **Material reference VM**: visuals.js resolves PrototypeHighlands via require when the sandbox omits it. Material tooling now injects the same Highlands module as sprite-pipeline.cjs, leaving require unavailable inside the VM. No game code changed.
2. **Ore sorting bay**: the owner selected the procedural version in current-design-decisions.json; the earlier approved raster is intentionally retained in the manifest as comparison/rollback provenance. The stale-canon test now distinguishes only this explicitly recorded procedural selection. It still checks approval record shape, source/output hashes, dimensions, manifest derivation, budget, revisions, and retained rollback records. It does not replace or auto-approve art.
3. **March and Highlands material candidates**: historical candidate palettes differ from the current floorPalettes in visuals.js. The scope check now validates the retained candidate palette exactly and separately checks the current renderer palette colors. This also covers the corresponding side-interior candidate keys, preserving existing approved material dependency hashes.

## Game and performance blast radius

Changed: scripts/material-pipeline.cjs, scripts/sprite-pipeline.cjs, scripts/sprite-scope-audit.cjs and tests/sprite-scope.test.cjs. These are developer-only validation/test files. No changes to src/prototype runtime, enemy/combat logic, frame scheduling, collision, save/load, player storage, visual source bytes, approved assets, image/audio binaries, or runtime manifests. Runtime behavior and frame cost should therefore be unchanged by the diff; this is a static scope conclusion, not a measured benchmark.

## Audit and release gate

- Review the PR diff for accidental runtime, asset, manifest, or approval edits.
- Run focused tests: sprite-scope, sprite-pipeline, materials, sprites and architecture; run `npm run check` (which exercises all three inherited checks) and `node scripts/build.cjs --check`.
- Verify retained ore image remains registered and procedural drawing remains selected.
- Verify negative tests reject missing current March and Highlands colors; check registry/provenance still rejects changed binary hashes.
- Confirm CI checks pass on the final PR head. Do not merge or deploy with any outstanding failures.

**Status at document creation:** static diff audit performed; execution/CI results pending. This PR is intentionally draft until validated.
