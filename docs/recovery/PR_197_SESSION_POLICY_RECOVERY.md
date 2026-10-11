# PR #197 — co-op session-policy recovery checkpoint (11 October 2026)

**Status:** deferred multiplayer foundation; not active co-op, not released.
**Original retained commit:** `43ad214459f977b27ac59608b8c7b83880619249`
**Current v0.9.0 main baseline:** `d7d2c22485b08265b31bf595305ef952b40b72cd`.
**Dependent draft:** #198, based on the preserved original #197 head; do not retarget it blindly.

The original branch retains its complete reviewable implementation in Git history: `src/prototype/session.js`, interaction leases, local-vs-world pause policy, amended `app.js`, two session test suites, `docs/SESSION_MENU_POLICY.md`, and packaging changes. The current main runtime has evolved substantially since that experiment. Directly carrying forward the old `app.js`, `engine.js`, `package*.json`, workflow or `sw.js` changes would risk existing menus, old saves, browser functionality and production stability.

This consolidation commit uses the **current main tree** as its content and keeps the original source commit as a parent for lossless recovery. It does **not** enable unfinished co-op, install an unused session API, alter single-player pause semantics, or claim the multiplayer UI is operational. Resolving Git history conflicts here is **not** porting the feature.

**Future selective port under explicitly resumed multiplayer scope:** reassess session timing and stale dialog leases against the then-current app/runtime; carry over tested policy behavior rather than old code wholesale; then reconcile #198's detached roster on top of that validated policy. Ensure old-save and single-player regressions remain intact. No multiplayer API or PR #198 base has been altered in this pass.

No game runtime, deployment, or published asset was changed.