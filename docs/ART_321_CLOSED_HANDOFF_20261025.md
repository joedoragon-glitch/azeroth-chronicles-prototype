# Art #321 — consolidated closeout (PR #469)

**Decision: closed without merge.** This branch is an archived, unmerged implementation candidate. It does not update `main`, GitHub Pages, live art, gameplay, or the default Canvas 2D renderer. The previous full 30-file audit remains retrievable at immutable Git commit [`80f9f5210058`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/tree/80f9f521005864749a92d5cd21362d50b9571e69); the six experimental CI workflows and large generated evidence indexes were deliberately removed from the *final branch tree*, not erased from history.

## Retained scope

Exactly **two game-source files**, **two narrow native tests**, and this handoff:

- `src/prototype/pixi-experimental.js`: one reusable GPU Crown-loot stamp painted by the existing approved Canvas coin painter, synchronized with live rewards and the current world; procedural and raster sprite facing mirror from the original Canvas presentation decision around the appropriate body anchor.
- `src/prototype/renderer.js`: share the existing paint-only *Paused* cue between Canvas and Pixi overlay; expose the existing ephemeral Canvas facing decision for experimental GPU rendering.
- `tests/art321-pixi-loot.test.cjs`: limited GPU sprite/reward/texture-lifecycle and directional-presentational checks.
- `tests/art321-native-earned-loot.test.cjs`: canonical `Campaign.kill` → loot → snapshot/restore → `Campaign.tick` pickup and once-only gold for day/night.

Neither original approved sprite designs nor combat mechanics, movement, cooldowns, audio, save schema, PWA multi-file architecture, and renderer defaults were modified.

## Evidence already obtained (historical candidate)

One-scene real Chromium/WebGL2 screenshot checks succeeded *before consolidation*: [Crown loot daytime](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40237914291), [night](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40237914273), [over an actual Vale cottage in day/night](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40237914263), [native earned reward and pickup](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40237914287), [Orc east/west facing](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40237914298), and [focused regression](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40237914270). These tests establish limited **candidate** behavior, **not** a production certification or endorsement of every historic art case. Screenshot artifacts have GitHub Actions retention limits; the original audit evidence JSON and prose is permanently accessible through the immutable audit commit above.

**Outstanding cross-PR finding:** the latest [pairwise combination run](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40237914304) failed **only** a `tests/sprite-scope.test.cjs` regression in the temporary combination with PR #445. That combination *merged cleanly*, but its selected test failed. Other tested pairwise combinations passed; simultaneous integration of all open PRs and physical devices were **not** validated. Do not relabel the #445 failure as an old Git conflict or silently treat the combined work as release-ready.

## Next work is a different, deliberately bounded workflow

**PixiJS/WebGL experimental → reliable** deserves its own explicitly approved project plan and independent PRs, not the continued expansion of #469. First resolve present-main and overlapping-PR dependencies; then define measurable feature parity, gameplay/event invariants, context-loss fallback, actual device performance, visual acceptance and conservative GPU/texture budgets before considering a default-renderer switch. The 513 historically approved art identities remain the artistic reference; don't reopen them as a blanket task. Avoid a six-workflow audit apparatus, repeated generated catalogs, full-game matrices without reason, or incidental feature redesign. Retain the multi-file GitHub Pages/PWA architecture.

**No merge, no deployment, no renderer promotion.** This PR was intentionally closed after cleanup; any future renderer implementation requires its own scoped review and release authorization.
