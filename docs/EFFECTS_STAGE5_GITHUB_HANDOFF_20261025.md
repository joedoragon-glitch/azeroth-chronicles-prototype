# Effects PR #471 — review and release handoff

**Status:** Focused effects candidate. **Scope frozen.** This is the **single current instructions document** for [draft PR #471](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/471). All other October 25 notes were consolidated in [technical evidence](EFFECTS_PR471_VERIFICATION_20261025.md) or are preserved in [Git history before housekeeping](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/tree/07530ef5355aa82769b511778a62cb0e116885c0/docs). Old stage numbers, work plans and cross-PR audit snapshots are **not active instructions**.

## Decision in one paragraph

The original aim was to investigate and improve essential combat-effect visibility at low FPS without replacing existing optimization. That work has a bounded implementation and focused automated proof. **Stop adding feature stages, synthetic matrices and integration workflows to this PR.** Finish only independently reproduced regressions in its five changed runtime files, then review the candidate through the normal PR/release process. Cross-stream conflict in another *draft* is not a #471 acceptance failure.

## Shipped-on-merge candidate — what changes

- **Opt-in developer effects recorder:** Start/Stop/Clear in Developer Mode's Screen and performance controls, bounded in memory, exported inside the existing playtest JSON. Nothing sampled or persisted in normal gameplay. Counts document painter attempts, **not proof of visible pixels**.
- **Essential cue first-paint grace:** Up to **0.12 simulated seconds** of bounded eligibility for a narrow set of hero effects otherwise expiring between permitted draws. No new frame request or change to FPS/skip policy. Deliberately blank cast stages remain blank.
- **Combat status legibility:** Silence, Taunt and Slow take priority; selected target, boss and captain status-bearing actors get precedence. At most **3 status positions** on each of **24 enemies**; a small +N glyph uses an existing position for overflow.
- **Warning geometry reuse:** Share current enemy attack polygon construction between immediately adjacent fill/outline painting in the *same draw*. Includes Dark Lord protected-side sector and both Canvas and experimental Pixi Canvas overlay. No inter-frame cache, collision change or warning omission.
- **Transient queue admission:** Still **40 total effects**; only when already overloaded, preserve at most one recent visible hero cue and one player/ally recovery. Deliberately silent normal casts and hostile heals are not protected. Visible Paladin normal Skills 3/4 were reconciled against real Canvas ink.
- **Minor Mage finisher ornament:** The existing optimization reduces optional spark/streak drawing while keeping the advancing arc and real combat identity.

These are candidate changes in this draft, **not a claim they are live on GitHub Pages**. No Ultra/Balanced/Performance quality-menu implementation and no rewrite of existing Off/Auto/On optimization.

## What has actually been checked

- 48 native hero cast forms, intentional silent stages, companion/boss warnings and statuses; software Canvas tests at desktop/phone-emulated sizes; simulated 20/30/60 drawing; identity and save-purity assertions.
- At the pre-housekeeping head `07530ef5355aa82769b511778a62cb0e116885c0`, [focused GitHub Actions #40238780331](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40238780331) **passed 46 affected test files**, reproducible build/syntax; publishing **skipped**. The new housekeeping head requires its **own** final check.
- Some queue tests inject intentionally exaggerated effect pressure; their passing does **not** establish how often that condition arises naturally.
- Per-draw pixel fidelity checks do **not** certify actual phone/Chromebook FPS, thermal behavior, readability in a crowded battle, or full Pixi GPU composition.

See [technical verification](EFFECTS_PR471_VERIFICATION_20261025.md) for exact test paths, old evidence archive, and integration limitations.

## Boundaries: what NOT to do in this PR

1. **Do not add a Stage 5.7, another broad audit, another monitoring/checker workflow, or new graphics presets.**
2. **Do not integrate #440 Critical Executions, #464 real projectile travel, #469 Pixi parity, #470/#472 audio, #458 boss pursuit, or #476 HUD.** Their maintainers own their changes. If joint integration is later needed, validate it separately on the integration candidate; do not make it a release-blocking task for effects alone.
3. Keep existing game architecture: multi-file GitHub Pages/PWA; Canvas default/Pixi optional; saved Auto 20–30 FPS, adaptive skipping, adaptive resolution, emergency rescue and accessibility reduced-motion preference unchanged.
4. **Do not describe independent draft CI, historical logs or temporary synthetic fixtures as device-certified gameplay.** No further test expansion absent a specific reproducible regression.
5. No automatic transition to ready/merge/deploy merely because this document exists.

## Short completion checklist

- [x] Focused implementation and targeted regression coverage.
- [x] Historical findings retained in Git history; no duplicate active handoffs.
- [ ] Latest **housekeeping commit**: focused CI and offline-ready build green.
- [ ] Human visual acceptance where essential telegraphs and hero cues are visible on a **real** phone/Chromebook, or an explicit owner decision to accept that release risk.
- [ ] Explicit **release/deployment** decision. **Merging this repository's PR into `main` automatically triggers the focused GitHub Pages deployment workflow.** Do not silently conflate PR merge with an unpublished code consolidation.

If that final release bar isn't met, **leave this stable draft as a review candidate** rather than grow it; close it only if superseded by a clearly identified successor. Owner permission to merge when ready does not make missing device acceptance data appear.

**Stop here.** Future work needs a concrete user-visible defect, separate scope, and owner-directed priority—not another inherited continuation plan.
