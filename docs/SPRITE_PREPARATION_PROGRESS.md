# Sprite preparation progress

Issue 111 preparation only, authorized 8 October 2026. Joel defers creative decisions and the three-asset art pilot. Infrastructure uses current-canon drawings and isolated fixtures; no new artwork is generated or registered.

Baseline: clean v0.8.84 main `3b1fa4c394c633abd61f3e8710b451c5e96618bc`, after verified PR 110 release. Branch `sprite-preparation-v0885`, release version 0.8.85.

Complete locally: pinned processing tools; parsed 231-entry catalog and three exact contracts; immutable sources/output metadata; approval/provenance-derived manifest checks; development-only four-size day/night showroom; actual transparent PNG fixture; isolated publication/rollback/packaging; browser fixture for actual sprite decoding, Canvas drawing, offline phone/subpath/query cache and retained saves. Production manifest and 22 runtime/style files are byte-identical; only release metadata changes.

Validation: baseline 36 suites and final local 37 suites passed; focused fixture tests, formatting, freshness, packaging and byte-preservation pass. Skeptical findings are fixed and documented in `SPRITE_PREPARATION_AUDIT.md`. Browser provisioning failed locally; exact-revision Chromium/WebKit/showroom/offline outcomes must come from CI. Binary GitHub blob transport/hash round-trip is recorded in the PR delivery record.

PR 112 merged as `2bf1381e1b98855ad0fe5e321c2ae5b5f2f3cb72` after exact-head run 37732790295 passed all 37 suites, 210 Chromium checks, WebKit phone checks, four showroom viewports and actual binary Canvas/offline/save checks. All four showroom screenshots were visually inspected. Post-merge run 37733620843 held deployment: the strict CSS comparison found a six-pixel-wide rounded-border difference at 1280×800. Runtime/styles remain unchanged. The comparison froze tick/draw but left the frame loop's closed-over HUD refresh running during CSS replacement.

Next exact action: publish the focused test-only repair (pause the complete frame loop, drain pending rendering and font work, settle both captures, and retain exact equality with a deliberate changed-border negative control), require final PR gates, merge and verify post-merge gates/Pages/exact live SHA. No assertion tolerance or production change is introduced. The final PR delivery addendum records the released known-good SHA. If the corrective PR is already merged, inspect its deployment rather than duplicating implementation.

Pending later: image-tool generation, three creative appearances/approval, approved production registrations, real pilot loading benchmarks and live sprite/offline verification. No creative response, subscription or technical homework is needed from Joel during preparation.
