# PR #132 — legacy sprite recovery checkpoint (11 October 2026)

**Status:** deferred source-art preservation, not installed artwork or publication authorization.
**Original retained commit:** `57506c52483e81987d0d1f73e22027c865ee7fbf`
**Clean modern baseline:** `d7d2c22485b08265b31bf595305ef952b40b72cd` (released v0.9.0).
**Parent branch history:** retained as the first parent of this non-production reconciliation commit.

The older branch carried five previously reviewed visual identities which remain valuable:
- `prop:mine-old-markings:highlands`
- `prop:ridge-supper:highlands`
- `prop:royal-flight-standard:frontier`
- `prop:flight-harness-station:frontier`
- `prop:highland-pay-station:highlands`

Those five sprite entries are absent from the current main manifest as of this checkpoint. The full historical artwork, reviews, provenance, registry edits and packaging tests remain available **in the original commit and its ancestors**. This branch intentionally uses the current main tree rather than replaying pre-v0.9 sprite manifests, approved registries, packaging/runtime files or service-worker versions; it does **not** install the five old sprites, overwrite accepted newer sprite keys or change the deployed game.

**Recovery handoff:** In a separately authorized #160 sprite batch, recover original source assets and per-identity records from the retained source commit, reconcile the five identities against the latest canonical sprite manifest, revalidate source hashes and labels/camera anchors/visible scene bindings, run the existing sprite and PWA checks, and seek fresh explicit approval. Do not reinterpret this documentation-only merge-conflict resolution as asset integration.

No art was regenerated or discarded, and no live main change was made.