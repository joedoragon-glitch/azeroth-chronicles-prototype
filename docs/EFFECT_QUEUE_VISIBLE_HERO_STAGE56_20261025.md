# Azeroth Chronicles — Stage 5.6: 48-form cast admission consistency

**25 October 2026 · Draft PR #471 · unmerged and undeployed.** Project is a multi-file GitHub Pages/PWA. This checkpoint continues the already-implemented, bounded Stage 5.5 queue policy; no graphics-profile control, gameplay action, camera, audio, renderer selection or FPS optimization system was changed.

## Evidence-backed mismatch and narrow fix

The previous [48-form natural cast study](../tests/effect-quality-hero-variants.test.cjs) measures actual native Canvas alpha for each of 3 heroes × 8 skills × normal/charged. On the then-current authoring, **33 forms have visible base cast ink**, and **15 intentional normal cast stages are blank**, because an area, projectile or another scene visual owns that action. That test confirms the following Paladin normal casts have visible pixels: **Skills 1, 2, 3, 4 and 6**. Stage 5.5's overflow admission list accidentally protected only Paladin **1, 2 and 6** (plus Mage/Ranger 3/4 and charged casts). Normal Paladin Skills **3 and 4** were therefore eligible for eviction by 40+ priority-5 transients *despite visibly painted artwork*. This was a classification gap, not an observed naturally overloaded fight.

Change in `src/prototype/combat-visuals.js`: the conditional admission-only list for normal Paladin casts is `[1, 2, 3, 4, 6]`. The [Stage 4 bounded first-paint grace](EFFECT_DIAGNOSTICS_STAGE4_FIXES_20261025.md) retains its existing, narrower list and maximum **+0.12 simulated seconds**—*we are not modifying effect lifetimes*. A hero cast that has reached the queue cannot force a new frame. All deliberately blank normal casts stay ineligible for the special overflow reservation. Hero events still use authored priority 4 and the total queue cap is **40**.

### Regression

New `tests/effect-queue-visible-hero-coverage.test.cjs` creates all **48 real** hero cast receipts using the production game cast method and actual `HeroPresentation.draw` on native Canvas at 800 × 600. It compares whether each real cast paints at least one alpha pixel against what survives **60 synthetic priority-5 pet-action receipts**. It additionally repeats normal Paladin Skills 3 and 4 in the **Normal-mode** campaign, to ensure the improvement is not Developer-only. Each case asserts 40 total effects, the identical newest-high-priority eviction order of the other 39 or 40 entries, and no presentation-induced save/gameplay mutation. Expected visible/silent counts under the current source baseline: **35/15** including the two explicit Normal-mode repeats.

The source-test contract is deliberately **strict**: a new genuine hero cast painting pixel ink but omitted from reservation must fail CI; a formerly intentionally blank cast unexpectedly protected must also fail and demand review. It does not mean every visible queued cast is the only meaningful effect of its ability, certify actual hardware FPS, or justify removing optional flourishes without an independent identity/submotif audit. The test only adds development-time software Canvas work; no player-runtime pixel sampling or quality selection is introduced.

## Alignment with newer main and concurrent PRs

**Main baseline moved:** from `e3c78266` to `d64b182b` after merged Pixi acceptance #447, documentation #449/#456 and audio **Stage 1 #468, Stage 4 #473, Stage 5 #474**. The six main commits in this window change **documentation, audio probe tools/tests/workflows, and `tests/pixi-renderer-browser.test.cjs`**, but **no production source files**, so this source-limited VFX change does not override newer main behavior. Note #447's acceptance code is now in **main**; do not present it as unmerged. New main source/test base and CI should be explicitly rechecked before a merge.

Current relevant **unmerged** work streams (re-fetch live heads before combining):
- [#464](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/464) real Ranger/Archer/pet travel and revised event stages (shared `combat-visuals.js` and `hero-presentation.js`): future integration must re-run this *48-form visible-ink admission test* plus actual projectile/contact/first-paint paths, not assume hardcoded stage identities can never change.
- [#469](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/469) Canvas/Pixi parity and Pause overlay (shared `renderer.js`): keep geometry cache and both warning passes, check composed real device graphics; no direct source change here.
- [#470](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/470), [#472](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/472): unmerged Stage 2/3 sound behavior; [#475](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/475) is a **test/workflow-only temporary joint audio acceptance gate**, not gameplay code. Event ownership must remain at actual release/contact and independent from VFX queue pressure.
- [#476](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/476) desktop/phone HUD **CSS and tests only**; not in this PR. HUD layout can later change visual overlap, so real screen-size/crowd legibility still needs combined visual inspection.
- [#440](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/440) dormant critical action receipts remain opt-in and must not be activated or rolled by rendering.

The other already documented draft interactions remain in [cross-PR register](EFFECTS_CROSS_PR_INTEGRATION_AUDIT_20261025.md) and [Stage 5.5 admission record](EFFECT_QUEUE_HERO_RECOVERY_STAGE55_20261025.md). This stage neither integrates branches nor changes user graphics options.

## Verification and release gate

**Do not claim passing current CI until the exact head after parallel updates completes.** Source test alone is insufficient for physical-device visibility. Required focused artifacts: normal/new 48-form test, Stage 5.5 admission regression, Stage 4 first-paint, Stage 5 browser acceptance, 20/30/60 crowd/queue and unchanged reproducible/offline build. Do not automatically run the full-game/manual device matrix. When writing a release-readiness record, include the exact tested SHA and workflow URL and separately mark device, combined PR and full-game gates **UNVERIFIED**.

**Stop before release.** Remain draft, unmerged and undeployed; no user action or full device certification can be inferred from this regression.
