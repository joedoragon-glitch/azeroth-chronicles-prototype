# Community Snapshot viewport-rendering optimization

**Status:** Integrated source candidate for draft PR #300; not a release or a measured hardware FPS claim. Original implementation and exact-head full-CI pass: [PR #294](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/294), commit `e3a406194ba1c293695de46070df0744233cb168`.

## Why

The existing procedural terrain renderer compared logical projected world coordinates against physical backing-canvas dimensions. At camera zoom and DPR greater than 1, off-screen terrain geometry could pass the coarse visibility test. Roads and bridge decks submitted unnecessary Canvas commands for wholly invisible geometry. The outdoor floor already has a bounded cache and must not be reimplemented.

## What the snapshot integrates

The existing worldbuilding renderer supplies its **logical viewport** to `PrototypeVisuals.terrain`, `roads`, and `bridges`. Conservative margins skip invisible landscape pieces, channels, road commands and bridges without changing their world geometry, art, material definitions, animations, combat warning boundaries or collision. Existing direct five-argument visual callers remain supported and use the original uncropped behavior.

The snapshot's new characters, moving captives, bosses, ministry sites, towns, Treasury expansion, visual warnings, original sprites, game systems, saves and PWA architecture remain authoritative. We do not import PR #294's historical `0.9.1+update.2` version/cache bump: PR #300 owns the snapshot version, build and service worker.

## Acceptance / rollout

- `node tests/viewport-culling.test.cjs`: 45 same-content byte-exact raster comparisons over five regions, three camera positions and 100/150/175% scale, plus suppression of wholly invisible road/bridge drawing. This compares the **current integrated worldbuilding source** with and without culling, not the old pre-worldbuilding art.
- The PR #300 exact-tree full Node/format/build/sprite-scope and Chromium/WebKit matrix must run **after this source change**, including desktop/phone, Optimization Mode, authored scenery, combat warnings, throne/TRUE/boss, historical saves and offline PWA behavior. Earlier snapshot or #294 CI certification does not transfer to this new combined commit.
- Report matched before/after `renderer.metrics().phases`, ground-cache hits/builds, frame-work P95, measured FPS and visual equality where practical using the **existing** renderer instrumentation/benchmarks. Preserve unsuccessful measurements. The raster tests prove safety, not a physical FPS improvement.
- No physical GTACUBA data is required. If a comparative performance test demonstrates no useful improvement, evaluate excluding the optional change before final owner-authorized publication; do not block the approved worldbuilding canon or claim guaranteed 30 FPS.
- Do not merge/deploy the live `main` branch automatically. Final snapshot publication remains separately owner-authorized.
