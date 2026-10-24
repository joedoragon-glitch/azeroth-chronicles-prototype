# Performance resilience integration — merge preparation and release gate

**Date:** 24 October 2026 (America/New_York)
**Status:** Combined **draft PR #426**, `integration/performance-resilience-20261024`, based on `main` at `cdc2a94dd8b3602c31f7e9134ab2540f813f9aff`. **Do not merge or deploy yet.** This is an integration and focused-audit handoff, not permission to publish or launch broad browser suites.

## Scope: four independent drafts, one review candidate

| Original PR | Inclusion and retained behavior |
| --- | --- |
| [#422](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/422) | Default-On adaptive skips (2 eligible world drawings under measured pressure, with a 350 ms stale-image guard); critical-load state permits 5 skips, 650 ms guard and temporarily halts combat; existing unclean-session restart guard validates a saved run and returns a living party to selected barracks/refuge when the previous browser session ended unexpectedly |
| [#423](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/423) | Optional, Off-by-default, bounded 120-active-tick crowd diagnostics; on-device nonpersistent recordings, bilingual controls and playtest export |
| [#424](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/424) | Fast reject distant circular terrain/props using axis bounds before precise distance math; keep close-range collision exact and mutable scenery fresh |
| [#425](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/425) | Only on persistent critical slowdown, cancel live enemy encounters, return engaged enemies to recorded homes, physically withdraw at most two companions per protected callback behind the hero, and relocate to barracks/refuge as a last resort without `die()`, penalties, free HP or Succession override |

The branches overlap. PR #425 already includes nearly all of #422 but their late heads diverged in app/restart tests; the integration retains the #425 escalation and most recent #422 restart regression. PRs #423/#424 both modify `navigation.js`; their changes have been deliberately composed. **Do not merge the original PRs sequentially** as if independent; use this single candidate, review file-level equivalence, and close/supersede old drafts only after an authorized publication.

## Additional identified issue: two Auto FPS modes versus skipped drawings

Review found `createFrameRate.observe` previously sampled workload on actual drawn frames only; deliberately skipped callbacks were not explicitly distinguished from ordinary limiter omissions. That could make a recovery/promotion decision rely on an artificially cheap-looking set of callbacks.

The candidate now passes `adaptiveSkipped` from the actual app loop to the FPS controller. It counts skips only when the Adaptive Frame Skip gate suppressed an **eligible** world draw, never when the ordinary FPS limiter withheld it.

- Both Auto **20–30** and Auto **30–60** can lower their target after sustained adaptive pressure: at least 3 adaptive omissions and at least 5% of eligible drawing opportunities in the recent six-second sample, in addition to their existing draw-rate/workload fallback criteria.
- Auto promotions require a clean recent measurement window without adaptive omissions; the existing promotion thresholds and cooldown still apply.
- Manual 20/30/60 settings and stored preferences remain fixed; rendering skips never suppress the main simulation/update callback by themselves. Critical emergency is a separate, intentional safety pause.

Focused `tests/auto-fps-adaptive-coupling.test.cjs` covers both Auto demotions under artificially cheap surviving frames, prevention of false promotion while still skipping, eventual normal recovery, distinction from the FPS limiter, and manual preferences. This is controller-level evidence, not a hardware FPS claim.

## Follow-up safety correction in integration

A severe stall **without engaged enemies** previously had no path from the first escalation attempt to the refuge fallback. Now, after the initial five-second critical period, the controller marks the attempt even if there was no encounter to cancel; another eight seconds of unresolved critical trouble can return the living party safely. User-initiated pause/menu/background periods clear escalation timers so ordinary idle wall time cannot trigger involuntary relocation. New focused cases exercise both behaviors. Hero and companion HP, crowns, legitimate deaths and v4 save data stay protected.

## Focused validation and evidence

- [Integrated CI run 40062483652](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40062483652): **success**. 11 selected test files, including Auto coupling, frame-rate, frame-skip, critical reset/restart, crowd diagnostics, collision equivalence, crowd escape, retreat passage, bilingual menus, platform runtime and architecture (the crowd/retreat tests run through the direct collision test). Reproducible offline-ready build and syntax checks passed. No broad CI run.
- [Integrated edge-case run 40062622171](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40062622171): **success**. Same selected 11 focused tests with no-enemy severe stall and pause-duration safeguards; build/syntax passed.
- In the synthetic 600-prop/3,200-probe collision fixture, precise `Math.hypot` calls decreased from **1,849,219** to **689** with the same **421** collision classifications. Hosted CI time is variable; this is not a measured Chromebook/phone FPS improvement.
- Important test boundaries: Node/production-shell checks cannot prove compositor-presented FPS, human input responsiveness, full encounter behavior on real devices, or OS-specific force-close behavior.

## Audit remaining before owner-authorized merge / publication

1. **Boss-specific reset audit (important).** The emergency reset calls existing boss-specific `cancelEncounter` and `clearEncounterState`, returns engaged enemies to their home coordinates and resets core combat state. The ordinary `disengage` finish path also clears detailed captain/boss fields (cooldowns, passives, TRUE-wave flags, patrol markers, charge/hold state). The emergency path does not exhaustively exercise those scripted specialties. Before public release, verify representative boss families (Thorn/Cindermaw patrols, TRUE bosses/summons, Archive/Mire captures, captain/fort phases) with direct focused regression; correct any residual state without changing normal combat balance.
2. **Device-level crowded-fight acceptance (important).** Compare matched heavy-crowd scenes with frame-skip On/Off for Auto 20–30 and Auto 30–60, Canvas 2D and optional PixiJS/WebGL2. Watch actual callback responsiveness, telegraph readability, input, party withdrawal, oscillating emergency entry/exit and force-close/reopen behavior. No measured FPS improvements or cross-browser guarantee are claimed yet.
3. **PWA/versioned release preparation.** Current package remains `0.9.1+snapshot.dev.168`. A release must use the established version/package/service-worker offline-cache update process and verify all published asset integrity; the current PR checks only its snapshot-consistent offline build, not a new public version. **Merging to `main` automatically runs the focused GitHub Pages deployment workflow**, so do not merge until the release version and publication checklist are ready.
4. **Unclean-session limitations.** The device-local marker and last valid save must survive; a fully hung browser cannot execute rescue code until restart. A normal shutdown can clear the marker, and saves may be stale or unavailable. Do not promise perfect crash detection or arbitrary corrupt-save repair.
5. **Release sign-off.** Owner to explicitly approve final merge/deployment after reviewing audit outcomes. No full game/browser/WebKit CI may be launched automatically; request separate consent if broad certification becomes necessary.

## New chat handoff

The authoritative combined candidate is **draft [PR #426](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/426)**, branch `integration/performance-resilience-20261024`; `main` was not merged or deployed during this work. Prior drafts #422–#425 stay open as history. First review latest PR #426 focused checks, then complete the boss-reset safety audit and release/version checklist before presenting a merge-ready recommendation. Keep implementation changes small and ask before broader test matrices.

## Focused boss-reset repair after independent audit (24 October 2026)

The first independently confirmed release blocker is corrected in this **draft only**: emergency disengagement now calls the exact same completed-disengage cleanup as normal enemy leashes, instead of maintaining a shorter copy that left Frenzy, Dark Lord Second Wind/royal modifiers, cooldowns and participation state behind. Native Garun temporary and preview obstacles are removed when its live encounter is interrupted, and roaming Thornfang/Cindermaw return flags and captured patrol metadata are reconciled before the shared cleanup. Boss-owned summons are still cancelled by the existing encounter hooks. The same hero HP, crowns, save schema, death/Succession and normal combat rules remain in place.

The focused regression is in `tests/critical-restart-recovery.test.cjs`, covering normal/TRUE Dark Lord state, captain phases, mine props, roam-patrol return data and the ordinary disengage path. This does **not** authorize a merge or deployment. Restart-marker checkpoint identity, device-level crowded-combat verification, PWA version/cache and final owner sign-off remain separate gates.

## Restart-recovery durable checkpoint fix (24 October 2026)

The unclean-session marker now derives its `gameTime` and `nextId` from the last **persisted** Normal/Nightmare checkpoint rather than the live campaign, which can legitimately advance between five-second autosaves. The same-mode/class checks remain, and arming rejects absent, invalid or demonstrably mismatched save metadata. Recovery still works on a validated copied campaign and follows established refuge/barracks placement; no save schema or death/HP/progression rules change. Focused `tests/restart-recovery.test.cjs` cases cover newer live state, newer saved state, wrong-class/new-run rejection and absent storage. This corrects the independent audit's restart checkpoint blocker; it does not imply a merge, deployment or completion of other release gates.

**Owner hardware-testing decision:** There are currently no independent device testers. Hardware acceptance is deferred to the owner's hands-on testing **after** the game is published; it is not a premerge blocker for this release. Automated checks remain required, and no matched-device FPS or browser-performance guarantee is claimed.
