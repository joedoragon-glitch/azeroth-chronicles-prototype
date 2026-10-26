# PR #440 — reviewed sprite-scope source delta (25 October 2026)

This receipt preserves the pre-integration source fingerprints rather than
silently regenerating the approved scope fixture. Focused exact-head CI
[run #40255334699](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40255334699)
reported **only these three source-hash differences**; all catalog decisions,
prepared contracts, renderer families, work roles, environment families,
terrain materials, zone samples, guard identities and enemy observations
remain unchanged.

| Source | Original approved SHA-256 | Integrated source SHA-256 |
|---|---|---|
| `src/prototype/renderer.js` | `74d157a9d2b2c9b32c371e034e4cef7bada8cd770e548d0e168279fde0374dff` | `86d4d8d825c9dd389c97b8bddbe85a7a01d1140f89ccac3e06350f8e38c67231` |
| `src/prototype/rules.js` | `48f4208cdbf1d581d74e567f94514f12f18a95e674207b0140aa61809d615d4b` | `86135c5fc398df2d20d7b6c3d6c11dadb4526975329266ef9453f9365c5f3baa` |
| `src/prototype/world.js` | `74200c6b100afe7d965bb33a0a8413e479fdaef54b981884c31d8063c5e878ed` | `17c579a6547322342cd01303858d75aeefd8fe31f00dab7f61c57d8e5a443cb4` |

- `renderer.js`: merged #464's existing effects recorder, physical arrow and
  frame-reuse work with the draft's bounded actor-following critical cues.
- `rules.js`: added the five fixed-location Codex definitions and their
  English/Spanish texts; no sprite asset identity changes.
- `world.js`: inserts the one existing-procedural Codex book NPC into each
  optional interior, including compatible v4 saves; no new raster asset.

Do not revise the protected sprite candidate counts or asset approvals based
on this hash update. Regenerate scope only after a separately reviewed real
sprite contract change. No visual acceptance, sprite approval, device test,
feature activation, or deployment is claimed here.
