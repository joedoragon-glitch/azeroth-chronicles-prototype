# PR #518 — Engineering handoff, verified scope and next-phase entry

**Project:** Azeroth Chronicles (multi-file GitHub Pages/PWA)  
**Repository:** `joedoragon-glitch/azeroth-chronicles-prototype`  
**Draft pull request:** [#518 — Regional graphics preparation and main menu](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/518)  
**Head branch:** `perf/region-graphics-preparation-title-screen-20261027`  
**Design and detailed acceptance contract:** [REGIONAL_GRAPHICS_PREPARATION_TITLE_SCREEN_20261027.md](REGIONAL_GRAPHICS_PREPARATION_TITLE_SCREEN_20261027.md)  
**Initially prepared:** 27 October 2026 after Stages 0–3. Some sections preserve explicitly dated historical checkpoints. **Current:** Stages 0–5 are implemented in this draft, Stage 6 combat-sensitive cache policy is in focused verification, and Stage 7 device/browser acceptance remains open. Refer to the [current device acceptance runbook](PR518_TARGET_DEVICE_ACCEPTANCE_20261027.md).

> **Historical Stage 3 decision (superseded):** This PR was **ready for the next development workstream** (main screen and Continue/loading lifecycle), but is **NOT production-accepted, merge-ready, performance-certified or approved to deploy**. All three housekeeping areas have an initial code-and-focused-test implementation. They have *not* passed the complete browser/physical-device/visual-performance acceptance gates. Keep this distinction in every future status report.

## 1. Scope and why it exists

Azeroth Chronicles presently opens directly into a saved campaign. The proposed user-facing lifecycle is **fresh launch → main screen → Continue → ready first gameplay frame → active game**. Returning from a merely hidden/minimized but still-running PWA resumes the current surface. A real OS-terminated/reloaded page opens at the title screen. Main-menu entries: **Continue**, **New Game**, **Saved Games & Backups**, **Settings**, and **Help & Credits**, all appropriately bilingual and touch/keyboard accessible.

This separation should allow presentation-only preparation while gameplay is inactive, without simulating combat, mutating authoritative zones, changing game RNG, bypassing save ownership, or accidentally replacing a campaign. Loading transitions for transport, regions and dungeons follow the same safety contract, subject to later implementation.

The prior renderer analysis identified three limitations:

1. Decoded approved sprite sources were not guaranteed GPU-prepared when first used.
2. Unseen procedural art still incurred first-use rasterization; per-actor cache keys caused avoidable duplication for *some*, but not all, identical artwork.
3. PixiJS terrain was a camera-following raster window, not a precomputed region; background redraws and GPU source updates could cause traversal spikes.

The changes below address these as a **bounded initial implementation**, not as proof that all startup or frame hitches are gone.

## 2. Implementation inventory — exact claims

| Workstream | Implemented on PR branch | Verified by focused checks | Not yet established |
| --- | --- | --- | --- |
| Stage 0: instrumentation | Synchronous procedural bake cumulative/maximum times, background paint cumulative/maximum times, preload/first-scene stage times, cache counters | Metrics finite/nonnegative; existing renderer regressions pass | Full GPU completion timing, GPU-memory residency, p95/p99 physical-device frame times |
| Stage 1: GPU preparation | PixiJS 8.22 optional `PrepareSystem` registered before app initialization. `renderer.prepare.upload` awaited on approved sprite textures and nearby/visible procedural texture inputs. Preparation has context-epoch cancellation and fallback to Canvas. | Mocked upload barrier/registration/cancellation paths and focused build | Real WebGL2 browser upload success and physical-device improvement; counters are accepted inputs, not driver allocations |
| Stage 2: procedural art reuse | Safe cache key for **five explicit fixed decorative prop families**: `crate`, `barrel`, `woodpile`, `stacked-lumber`, `scroll-stack`. Appearance-field allowlist; same zoom, backing ratio, scale and zone. Separate actor identity, placement and ground effects retained. `sharedProceduralHits` diagnostic. | Authored Canvas draw-instruction comparisons across identities, sharing isolation, extra-state exclusions, distinct carts and warm-frame reuse | General character, companion, pet or enemy equivalence; these are deliberately NOT deduplicated |
| Stage 3: terrain lookahead | One **optional additional CPU** terrain window painted on `requestIdleCallback`; reuse existing single Pixi GPU backdrop by copying prepared pixels on crossing. Combined two-window estimated CPU bitmap limit **64 MiB** (raised from the initial 32 MiB limit); staging painter disables its own ground cache. Falls back to original painter on miss/stale/unsupported. Combat, dungeon/arena, hidden-page guards and diagnostic counters. | Lookahead/promotion and miss tests, memory bound, single GPU source update, active-combat bypass, Canvas/default renderer source checks | Whether idle work *actually reduces* p95/p99 stalls, preserves animated water/time-of-day exactness, or is acceptable on low-memory devices |

**Initial Stages 0–3 code files (historical):** `src/prototype/pixi-experimental.js` and `tests/pixi-fidelity.test.cjs`; later stage work also changes `app.js`, menus, site assets and lifecycle tests. The design/acceptance document and this handoff are the documentation changes. No authoritative engine, combat, save schema, hero class, Canvas baseline or game-map changes are intended by this PR's renderer commits.

### Details not to misstate

- The original Pixi background remains a **220-presentation-unit-margin viewport window**, with a **132 CSS-pixel drift threshold**; it has *not* been replaced by a region-wide map or static tile atlas.
- Lookahead begins to be considered around **73 CSS pixels** of drift, only if safe and supported, with one complete synchronous CPU paint executed inside a browser idle callback. This can move an expensive task rather than reduce it. There is one extra bounded CPU bitmap and **no second retained large GPU background texture**.
- The Canvas renderer's outdoor floor has its own one-window cache (historical **64 MiB** budget) and is not replaced here.
- The procedural raster budget is historically **256 MiB estimated image data** with bounded soft eviction; it is *not* measured total browser+GPU memory.
- Manifest count was **37 unique approved sprite URLs at the initial audit**, not a stable contract; re-count after asset changes.
- Nearby procedural warmup remains bounded by its **18-image / 600 ms** preparation policy; full-region or all-character pre-rendering has **not** been built.
- GPU-preparation counters do not certify that the driver uploaded exactly the reported number of fresh textures or that all first-use GPU stalls are eliminated.
- No visual or FPS uplift should be claimed until measured. A green mock/source test run and a successful PWA build are not hardware certification.

## 3. Regression evidence and gaps

All linked validation below passed at the time of this handoff:

- [Stage 0: preparation instrumentation — Actions #40459366892](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40459366892)
- [Stage 1: explicit Pixi GPU preparation — Actions #40465777929](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40465777929)
- [Stage 2: restricted decorative sharing — Actions #40467933690](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40467933690)
- [Stage 3: one-window terrain lookahead — Actions #40471830540](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40471830540)
- [Consolidated draft head at handoff entry — Actions #40472347209](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40472347209)

The final link validates the consolidated source/tests/documentation as of the then-current draft head `ac1bc1afca8f67a6ad4439577c1f69daead252c7`. Subsequent handoff-documentation edits will create newer commits/CI. **Always recheck CI on the actual head before merging or claiming acceptance.** The focused workflow did **not** perform a broad, physical-device browser matrix, and validation artifacts were not a live WebGL2 speed comparison.

**Required device/browser acceptance:** desktop and phone real Chromium where WebGL2 actually works, iOS Home Screen PWA and context loss, the exact ASUS CX5403CMA-DB588 Chromebook, Canvas parity. Exercise cold/warm launch and Pixi opt-in/Keep/Revert, near-Millhaven goblin approach and dense combat, all three hero classes, dungeons and return journeys, zoom/DPR/viewport changes, repeated zone crossings, idle/active fight transitions, water and day/night scenes, long roaming memory, save recovery. Compare exact screenshot/parity and input availability, plus matched p95/p99 frame time, source upload duration, texture eviction/bake counts, real memory pressure and first playable frame. Record both baseline and branch with identical settings; label software GPU separately from physical GPU. If terrain lookahead causes a hitch or visual divergence, revert or disable the *prototype* rather than relaxing safety gates.

## 4. Current architectural and integration risks

1. **Browser texture readiness:** `PIXI.PrepareSystem` is explicitly registered and mocked in source tests, but the pinned browser bundle and actual upload timing still need live WebGL2 verification. Canvas recovery/Keep-Revert must work on failure and interrupted uploads.
2. **CPU terrain prepaint:** `requestIdleCallback` does not make the complete original painter incremental. A hidden main-thread stall, canvas-to-canvas blit, time-varying water/terrain, or GPU source upload on promotion may outweigh the avoided redraw. The current `64 MiB` allowance only bounds two estimated CPU raster windows (32 MiB at the original Stage 3 checkpoint); other existing caches remain resident.
3. **Visual identities:** the fixed-decoration allowlist is deliberately narrow. Existing procedural wolves and Frontier carts use identity-derived variants, and other entities depend on state, facing, pose, equipment, form, zoom and DPR. Do not broaden sharing by species, name or family without corresponding authored-art tests.
4. **Unrelated upstream changes:** the PR branched from `main` commit `740c4549`. At this handoff audit `main` had advanced to `286e8c0d` through other PRs (including class onboarding #520 and CI/test reliability #522). Before editing lifecycle files or merging, inspect the newest `main` and reconcile relevant changes. Do **not** overwrite those commits by copying an old `app.js`, `styles` or test harness wholesale.
5. **Overlapping performance PRs:** historical draft #487 includes other procedural preparation ideas, while #490 already merged bounded fringe warmup. Only cherry-pick unique, freshly reconciled value; do not blindly merge another stale approach.
6. **Save ownership / persistence:** a loaded game and `started = true` are intertwined in existing `app.js`. Initial restore, legacy migration, unclean-session recovery, pending `navigator.locks` ownership, PWA update reloads, autosave, crash-marker arming and focus/visibility handlers all need review before changing startup semantics. Simply setting `started = false` risks losing save protection or loading screens.
7. **Minimize and BFCache:** `visibilitychange` and `pageshow` already exist; `pageshow(event.persisted)` currently triggers reload. Reconcile with the new user contract so true in-memory background resume stays in gameplay where supported, while genuine cold/reloaded launches show the title.
8. **Game state safety:** `Campaign.zone()` lazily constructs stateful areas. No preload code may call `zone()` for an unentered destination just to build graphics. Destination preflight must use read-only presentation data and can be deferred until a safe boundary.

## 5. Historical Stage 3 next workstream — main screen and Continue (now implemented)

The next chat should **continue on draft PR #518**, not invent a new initiative. Recommended order:

1. **Reconcile with current `main` and inventory startup routes.** Inspect `src/prototype/app.js` (`load`, `start`, pending writer ownership, `frame`, `visibilitychange`, `pageshow`, menus, renderer guard); `src/prototype/persistence.js`; existing English/Spanish copy and class-selection UI from merged #520. Establish an explicit UI/game lifecycle state contract separate from save availability.
2. **Implement accessible, bilingual title screen without premature gameplay.** Continue enabled only for validated available saves; direct New Game, Saved Games & Backups, Settings, Help & Credits actions use existing implementation/guards. Existing developer and arena gates remain hidden or protected. On a fresh tab launch/reload, show title; on still-live background/foreground switch, preserve current surface. Preserve recovery of corrupted saves, multiple campaigns, writer-conflict controls and historical migrations.
3. **Define inactive loaded state and writer contract.** Simulation/game clock, combat, movement, regeneration, timers, gameplay autosave and crash-marker arm must not advance merely because title is visible. Unclean-session rescue and write ownership must remain authoritative. No unsupported reset/new campaign on title-only navigation. The active campaign must be the same logical save when Continue is tapped.
4. **Add first-frame reveal barrier and real loading stages.** Show Canvas or Pixi only when an *essential* correct first playable view is ready. Reuse current preload, prewarm and foreground safety guard. Wait for required art but do not block Continue indefinitely on optional entire-region prewarming; support Pixi upload errors/context loss by falling back to Canvas. Restore touch/keyboard focus and audio input safely.
5. **Return to Main Menu** from an active session should save with existing ownership/backup/recovery guards and stop simulation; no reload required. Treat `pagehide`, service-worker update and interrupted preparation explicitly.
6. **Only then** add destination presentation preflight for travel/dungeon transition screens and more nuanced combat-aware scheduling, without mutating unvisited zones or changing combat timing. Terrain lookahead is a separate optional runtime optimization, not a dependency for the title screen.
7. Add focused lifecycle and functional UI tests, a11y/touch/Spanish regressions, Canvas/Pixi fallback tests, unclean save/writer conflict tests. Preserve existing narrow CI policy and request separate approval before broad browser matrix, merge or publication.

### Acceptance checklist for first title-screen increment

- [ ] Cold app launch with valid Normal/Nightmare save shows main screen instead of moving combat.
- [ ] Continue returns to exact saved zone, hero/party, position, HP/MP, progression and camera, without an intermediate half-drawn world.
- [ ] Cold launch without a save safely offers New Game; unreadable save offers recovery and never overwrites it.
- [ ] New Game goes directly to existing mode/class/name choices (including merged class-growth onboarding), retaining backups/confirmations.
- [ ] Settings and language switching work before loading active gameplay; all primary controls reachable on phone and desktop with keyboard and semantic labels.
- [ ] Save management and import/export are reachable from title in bounded steps and respect writer ownership.
- [ ] Backgrounding/minimizing a running page preserves its current screen; actual reload/termination displays title; restart/restore and service-worker scenarios are covered.
- [ ] Title idle does not advance game clocks/combat, write gameplay saves in error, or leave audio/renderer running unnecessarily.
- [ ] Continue has guarded ready-first-frame behavior in both renderer modes, no indefinite waits and safe Canvas fallback.
- [ ] Existing Canvas/visual, combat, saves, optimization, accessibility, and bilingual regression tests remain green.

## 6. Merge/release rules and next-chat restart instructions

**Draft PR stays open, unmerged and undeployed.** Do not mark ready for review or merge just because stages 0–3 source checks pass. **Historical checkpoint (superseded):** at the Stage 3 handoff the title/menu was not implemented and Stages 5–7 were planned. Current status is at the top and bottom of this file. Distinguish what has been committed from what is proposed in all future updates.

For a new conversation: start by reading **this file**, the [detailed design/acceptance contract](REGIONAL_GRAPHICS_PREPARATION_TITLE_SCREEN_20261027.md), and the **current PR #518 patch/head/CI**. Check the newest `main` and linked issues before writing. Work on the same draft branch; make incremental commits, run narrow affected tests and the reproducible build, and keep these docs plus the PR description in sync. Report unverified device and visual claims explicitly. Do not take saved-chat context as a substitute for repository source.

**Historical owner-facing status after Stage 3 (superseded):** “The three graphics limitations have bounded implementations and passing focused regressions in draft PR #518; real-device performance/visual acceptance remains open; the next task is a safe bilingual main menu and Continue/ready-first-frame lifecycle.”

## Stage 4 source checkpoint — 27 October 2026 (review pending)

Merged current `main@28d8bb1139b6095ab40522571067da720b4720c0` into the continuing draft at `92896fe8439174ec777b73be0a539d8e3386f0f7`, preserving the earlier Pixi renderer commits. Added the public-branded main screen, explicit inactive campaign startup, guarded Continue first-scene draw barrier, New Game/backup/settings/help routes, guarded Return to Main Menu, and bilingual title-level regression coverage. Current main onboarding and adaptive HUD are retained from the reconciled tree. **Source candidate, not production acceptance:** check focused CI at the new exact head, browser input/render/save paths, corrupt save writer conflicts, physical iOS/Chromebook fidelity and fallback before stage sign-off. No merge or deploy is authorized.

## Stage 5 — safe arrival presentation-preflight source candidate (27 October 2026)

**Committed scope:** The browser shell now provides an opaque bilingual "preparing travel" / "drawing arrival" screen for region-forward/backward transport (including work passage), Crown hub routes, authored main/side-dungeon entrances, and dungeon/side/supply exit interactions. Menu actions invoke a shell-managed scene transition, but the *existing* `Campaign.travel`, `travelHub`, and `interact` remain the only mechanisms that can move a player, debit crowns, reveal lore, reset encounters, or construct zones. No engine/rules/v4 snapshot or RNG changes.

**Read-only preflight contract:** sprite selection reads the current hero and, only if present, `game.s.zones[destination]` (already generated and admitted campaign state). It never calls `game.zone(destination)`, `enter`, generator code, or stateful traversal for an unvisited destination. Artwork warmth is limited to twelve manifest keys and a 300 ms bounded *wait* using the existing sprite decoded-resource cache; a timed-out decode queue may finish only in the presentation cache later. This is not a real GPU texture-ready guarantee or a full-region/chunk pre-render.

**Reveal and safety:** The old frame remains covered and combat simulation is frozen throughout preflight and destination drawing. Failed domain travel closes the overlay and keeps the old menu. Success saves with existing writer/checkpoint protections, then draws the actual arrival under the opaque overlay; only a completed draw reveals gameplay and restores input/focus. A failed Pixi draw tries Canvas; a repeated failure exposes a keyboard-accessible Canvas retry. Hidden/interrupted preparations cannot later commit a trip. A committed but hidden arrival is not rolled back; foreground resumes the paint/reveal only under writer ownership. Title-screen idle also warms only the restored current scene. The loading stage shows real phase labels, not invented percentages.

**Verification pending:** exact-head focused CI and reproducible build; live Android/iOS and Chromium/WebGL2 Canvas/Pixi parity, throttled/canceled decode behavior, scene fade/presentation, background/resume, hostile arrival, v4 save recovery, and measured performance/VRAM. Do not treat the code pass as acceptance, merge clearance, or production readiness.

## Supported baseline and combat-critical arrivals — owner direction (27 October 2026)

The exceptionally slow phone that motivated earlier optimization work and very old desktop machines are **not** minimum supported hardware targets. Treat approximately **4 GiB mobile RAM** and **8 GiB PC RAM** with current browsers/hardware as *provisional validation starting points*, **not** certified or advertised specifications. This is not an app-level RAM admission check. Canvas fallback and finite resource caps remain essential. The optimization goal is enough useful working-set space for modern 2D RPG art and near-immediate hostiles, not forcing all development toward a 500 MB device.

Stage 5 now expands read-only sprite preflight to up to 64 nearby/encounter keys, 750 ms optional outdoor preflight, 1400 ms post-commit warming for **main dungeons, side dungeons and supply rooms** (1200 ms for other arrivals), while the simulation stays paused until the first painted frame is revealed. The destination is never created during preflight. The combined CPU lookahead budget is now 64 MiB (prior 32 MiB); the Pixi procedural cache hard cap remains 256 MiB, with softer LRU trimming 75/62.5%. No new engine mutation, combat invulnerability, artificial arrival delay in game time, RAM probing, or ultra-low-end acceptance requirement. Source/test verification and physical-device performance still pending on this exact follow-up.

### Stage 5 refinement: first-engagement acceptance guard

Expanded the read-only presentation preflight to use the actual hero arrival point after native region or dungeon entry, ranking living enemies within 850 game units before nearby enemies, hero/party and decorative art. All real destinations (not merely main/side dungeons) can prepare approved enemy sprite variants and combat clips after the authorized transition, without moving campaign clocks. New Game and Continue use the same hostile-save warm-up, including after unclean-session recovery. The optional confirmed Pixi renderer now bakes a bounded near-spawn fringe and explicitly uploads newly prepared procedural textures before uncovering gameplay, with an 1800 ms upload timeout and Canvas fallback. The Pixi procedural hard budget remains 256 MiB, soft trimming 75% → 62.5%, and CPU two-window background cap 64 MiB. This is a source/testing gate, NOT measured hardware acceptance; the previously stated mainstream-device planning floor remains provisional.


## Current Stage 6 checkpoint and testing gate — 27 October 2026

**Device reference:** owner’s ASUS Chromebook CX5403CMA-DB588, consumer **8 GB LPDDR5X / 128 GB NVMe SSD**. This ChromeOS configuration is the primary real-world desktop-class test baseline; modern ~4 GiB+ phone/tablet and another 8 GiB+ desktop are secondary validation cohorts. Low-memory outliers and obsolete PCs are not release acceptance gates. These are unverified planning targets, not official minimum requirements or RAM-based app restrictions.

**Stage 6 source candidate:** The currently entered zone alone is checked for live projectiles or living enemies within 420 game-world units. Optional terrain lookahead is withheld during that encounter; optional *soft* offscreen Pixi texture eviction is likewise deferred, reducing repeated combat bakes. Existing mandatory draw and hard-budget eviction paths remain active, no zone is speculatively created, and combat/save/AI/game-clock mechanics are unchanged.

**Source truth for Stage 5:** 64 unique approved keys; pre-commit ordinary travel warming up to 750 ms; post-native-commit nearby art 1400 ms for combat-critical main/side/supply interiors or 1200 ms for other destinations; Continue post-recovery up to 1400 ms; Pixi arrival GPU-preparation watchdog 1800 ms before Canvas fallback. Terrain CPU windows jointly have a 64 MiB image estimate; procedural Pixi images have a 256 MiB hard cap with 75%/62.5% optional soft trim. Maximum waits are per stage, not an end-to-end loading promise, and no cache counter represents total VRAM.

**Stage 7 is still missing:** verify precise first-frame, live GPU-backed Pixi presentation and performance against Canvas on the owner Chromebook plus representative phone/browser(s); run close-range combat and all main/side-dungeon arrivals, recovery, long roaming, English/Spanish controls, repeated region crossings, zoom/DPR, hidden/foreground and WebGL failure fallback. Use [the complete runbook](PR518_TARGET_DEVICE_ACCEPTANCE_20261027.md) and record matched p95/p99 times, input latency and memory pressure. Stage 6 focused CI must be green on the exact commit before practical device acceptance; source passing is not merge/deployment authorization.


### Owner-approved integration for user testing (supersedes earlier hold)

The owner authorized merging this PR into the playable game **once exact-head automated technical checks pass and no merge-blocking issue remains**, so they can conduct Stage 7 real-browser testing personally on the ASUS CX5403CMA-DB588 and report back. Earlier no-merge/no-deploy instructions in this historical handoff are superseded **for this specific conditional integration**. Pixi/WebGL2 stays optional with Canvas fallback and must **not** be labeled performance-certified or made default solely by merging. Real hardware measurements, visual parity and device stability remain unverified until the owner's follow-up. See [test runbook](PR518_TARGET_DEVICE_ACCEPTANCE_20261027.md).
