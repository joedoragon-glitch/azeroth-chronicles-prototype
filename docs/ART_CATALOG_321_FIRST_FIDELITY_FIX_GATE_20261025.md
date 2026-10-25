# First fidelity repair gate — Crown loot and separate pause feedback

**25 October 2026.** Follow-up to [Art Catalog #321 deep audit](ART_CATALOG_321_DEEP_RENDERER_ASSESSMENT_20261025.md). Evidence pin: `befb8349c48b36e9f0e047a6162f08a1db16e214` (PR #469 capture, based on main `e3c78266...`). This document is a **concrete implementation specification**, not an implementation, production approval, owner art reapproval, or renderer-default change. Preserve the existing unmerged draft and accepted artwork.

## Follow-up: fixes implemented and first acceptance gate passed in draft

This document originally specified future repair work. **A subsequent candidate implementation is now on the same unmerged draft PR #469.** Changes are restricted to `src/prototype/pixi-experimental.js` (shared GPU Crown-coin stamp before atmosphere) and `src/prototype/renderer.js` (identical paint-only pause cue for full Canvas and transparent GPU overlay), plus a bounded native regression and a stronger existing one-scene screenshot collector. The original specification remains below to preserve the decision trail.

[Real matched screenshot proof](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40228970808) confirms **936 Canvas versus 919 WebGL2 changed pixels** when one true-shaped test coin appears (both nonzero; active GPU). The Pixi paused overlay now has expected alpha 102 and the label is visible. The [11-file focused suite passed](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40228970789), including multiple-loot instances, immediate sprite removal, zone change, texture reuse, zoom rebuilding and reward-data immutability. [Durable checkpoint](evidence/ART_CATALOG_321_CROWN_LOOT_FIX_VERIFICATION_20261025.json). **Day/night, occlusion, actual enemy-kill/pickup and physical-device acceptance remain open**, as does owner approval to merge or deploy; the original section below is a design gate, not a declaration of unimplemented code.

## Stage 2 addendum: actual nighttime test passed on the candidate

A **later** [isolated real Chromium night run](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40231313295) confirms the approved Crown coin also visibly renders in a genuinely dark paused Vale at **150% zoom**. Canvas changed **556** pixels on insertion, Pixi changed **515**, and source-independent inspection of the downloaded PNGs verified all six hashes, **0.837 changed-mask overlap**, and **14/13,456 full-crop threshold differences**. [Permanent result ledger](evidence/ART_CATALOG_321_NIGHT_CROWN_LOOT_PARITY_20261025.json). This retires **only the one-scene night Crown-coin visibility check**; multiple-region night grading, significant foreground occlusion, real drop/pickup, phones, context loss and 513-case Pixi art certification remain open. The initial repair gate below is preserved as historical test-design provenance, not current unimplemented work.

## Proven failure

The real [paired 150% composed-frame evidence](evidence/ART_CATALOG_321_MATCHED_COMPOSED_CAPTURES_20261025.json) captures the **same paused Campaign** with temporary, production-shaped `Campaign.s.loot` in the Vale. Full Canvas: **707/13,456** sampled pixels change with the Crown coin. Confirmed WebGL2/PixiJS: **0/13,456** change; 95 actors, 115 GPU texture sources. Six independently checked PNG hashes, [CI pass](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40226232523), and the original source comparison agree. The loot simulation/pickup is not itself proven broken; this is a **visibility/presentation** failure.

Secondary observed presentation difference: full Canvas displays the **Paused** label and translucent darkening while actual Pixi with the same stopped simulation clock omits them. Do not conflate this separate user-feedback issue with Crown loot or count it as another historical art case.

## Recommended isolated repair slices — separate implementation approval

### Repair A: make the actual Crown coin visible in Pixi without changing its art

- The canonical paint owner remains exported `PrototypeRenderer.drawCrownLoot(ctx,point)` in `src/prototype/renderer.js`. It paints the approved portrait-stamped Ironroot circulating coin. Do not replace with generic gold, another material, or an icon.
- The simplest correctness fallback is to draw every in-zone `game.s.loot` item into the **transparent Pixi Canvas overlay** using the same `drawCrownLoot` function, after the GPU scene is rendered. That is a small source change with a real risk: it puts loot *above* some nighttime grade, actors and foreground structures, whereas full Canvas draws loot in the world entity pass **before atmosphere**. This cannot be labeled complete visual parity merely because a coin appears.
- For true world-composition parity, investigate a shared lightweight **Pixi loot texture** painted from the existing Crown-coin function exactly once per relevant resolution/zoom, then include per-drop instances in `scene.syncActors()` with world projection and appropriate depth sorting. Do not generate one 576×576 bake per loot drop; cache one bounded coin source. Ensure day/night grade, occlusion, pixel density, foot anchor, camera zoom and pickup/removal match the Canvas reference. This is preferred **if it can be delivered as a tightly scoped rendering-only change without affecting actor budgets or fallback safety**.
- Neither approach may change `Campaign.s.loot` objects, `gold` field, drop or pickup radius, `nextId`, gold grants, combat, save format, or accepted coin anatomy. A corrected rendering path must not prevent Canvas fallback when WebGL fails.

### Repair B: restore paused visibility in the optional GPU mode, independently

- The normal Canvas code in `src/prototype/renderer.js` fills a translucent dark panel and paints `Paused` after effects when `isPaused()`. The `renderLayer === 'overlay'` branch returns before reaching that block. The matched PNG pair confirms the label absent from Pixi despite `game.s.time === 0` and a paused Campaign.
- Reuse one shared **paint-only** pause overlay helper from both branches, retaining screen positioning, 150% scaling and contrast. Avoid duplicating game pause logic or triggering a second pause state. Keep GUI accessible, campaign/input untouched, and test both paused/unpaused transitions in both modes.
- Treat this as a **separate UI feedback fix**; it does not explain the Crown-loot pixel failure.

## Regression acceptance before merging a future repair

1. Run the already available [isolated PR-only one-scene capture](../tools/visual-review/art321-crown-loot-browser.cjs) with software WebGL2 and preserve its [GitHub artifact](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40226232523/artifacts/12610898765) as the known **before**. Confirm backend `webgl2`, same zone/time/hero/150% camera and identically located temporary loot.
2. Require an actual **nonzero Pixi composed screenshot delta** that is geographically concentrated at the coin, and corresponding nonzero Canvas delta. A false positive from a moving time clock, UI overlay, menu, zoom, or accidental Canvas fallback invalidates the test. Do not set a naive pixel-perfect threshold as art identity acceptance.
3. At least once, compare the **composed world screenshot**, not only the transparent Canvas overlay, at day and night plus one occluding object; check coin stamp, anchor, brightness and sorting. Test appearance immediately after drop, disappearance upon pickup and after world-zone changes.
4. Confirm the pause label/tint appears only while paused on both renderers, while the same Campaign time remains stopped. Confirm no unintended HUD/mouse/touch obstruction.
5. Run narrow source, sprite/renderer and actual Chromium tests; perform recovery tests separately. Existing broader Pixi browser acceptance has occasionally produced timing failures in software WebGL; do not declare those failures fixed by the loot patch or run a full browser/phone matrix without authorization.
6. Keep any visual repair in a **separate, individually reviewable change** (or clearly delimited follow-up commit only if explicitly authorized), preserve historical owner approvals and the Canvas renderer default. No automatic merge, deploy or Pixi promotion.

## Accepted at this checkpoint

- **Pass:** a reproducible matched Chromium paired-frame capture exists, has verified hashes, records one confirmed visual difference and is retained as a downloadable run artifact.
- **Open:** the actual GPU/overlay implementation fix, pause feedback parity, nighttime/occlusion acceptance, hardware performance and 512 remaining legacy art IDs plus post-catalog additions.
- **Boundary:** no source-renderer or simulation changes are committed under this document.
