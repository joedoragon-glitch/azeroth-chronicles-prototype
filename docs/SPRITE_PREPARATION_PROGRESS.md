# Sprite preparation progress

Issue 111 preparation only, authorized 8 October 2026. Joel defers creative decisions and the three-asset art pilot. Prepare infrastructure using test fixtures; do not generate or register production art.

Baseline: clean v0.8.84 main `3b1fa4c394c633abd61f3e8710b451c5e96618bc` after verified PR 110 release. Branch `sprite-preparation-v0885`.

Current step: pinned image toolchain, machine-derived prompt catalog, three reference contracts, development-only showroom and binary transport/test harness. Existing production loader eagerly decodes the current registry; preparation will measure budgets and document this limit, without changing gameplay or loading policy in the empty-registry build.

Next: implement preparation tooling, validate fixture/approval/packaging safeguards, audit, run full CI, merge and verify exact live release. Issue 111 stays open for the later image-generation and creative approval pilot.
