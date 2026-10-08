# Sprite preparation progress

Issue 111 preparation only, authorized 8 October 2026. Joel defers creative decisions and the three-asset art pilot. Infrastructure uses current-canon drawings and isolated fixtures; no new artwork is generated or registered.

Baseline: clean v0.8.84 main `3b1fa4c394c633abd61f3e8710b451c5e96618bc`, after verified PR 110 release. Branch `sprite-preparation-v0885`, release version 0.8.85.

Complete locally: pinned processing tools; parsed 231-entry catalog and three exact contracts; immutable sources/output metadata; approval/provenance-derived manifest checks; development-only four-size day/night showroom; actual transparent PNG fixture; isolated publication/rollback/packaging; browser fixture for actual sprite decoding, Canvas drawing, offline phone/subpath/query cache and retained saves. Production manifest and 22 runtime/style files are byte-identical; only release metadata changes.

Validation: baseline 36 suites and final local 37 suites passed; focused fixture tests, formatting, freshness, packaging and byte-preservation pass. Skeptical findings are fixed and documented in `SPRITE_PREPARATION_AUDIT.md`. Browser provisioning failed locally; exact-revision Chromium/WebKit/showroom/offline outcomes must come from CI. Binary GitHub blob transport/hash round-trip is recorded in the PR delivery record.

Next exact action: publish the tested tree to the branch with a lease, open the preparation PR (references Issue 111 without closing it), require all final PR gates, refresh main, merge via supported workflow, and verify post-merge gates/Pages/exact live SHA. The final PR delivery addendum closes this pre-merge checkpoint and records the known-good release. If the PR is already merged, inspect its deployment rather than duplicating implementation.

Pending later: image-tool generation, three creative appearances/approval, approved production registrations, real pilot loading benchmarks and live sprite/offline verification. No creative response, subscription or technical homework is needed from Joel during preparation.
