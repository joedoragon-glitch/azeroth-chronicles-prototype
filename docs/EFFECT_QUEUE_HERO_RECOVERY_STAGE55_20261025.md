# Azeroth Chronicles — Stage 5.5: bounded hero and player-recovery admission

**Date:** 25 October 2026. **Branch:** existing [draft PR #471](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/471). **Release:** HOLD (not merged, not deployed). Multi-file GitHub Pages/PWA retained.

## Reason for the additional safeguard

The existing transient-effects queue (`src/prototype/combat-visuals.js::queue`) is capped at **40** and evicts the lowest numerical priority first. Normal hero-skill and healing presentation receipts use priority **4**, while many boss/captain and other important release accents use priority **5**. Prior Stage 5.2 test evidence demonstrated that one real Paladin cue and a player heal survive **100 synthetic priority-1 hits**, **not** that either can survive a burst of more than 40 higher-priority transient accents. The independent Stage 4 first-paint grace can only extend cues **still in the queue**. Under adversarial overload it could never rescue an evicted hero cast.

This gap is limited to the short-lived `visualFx` queue. Live attack telegraphs, safe openings, actual projectile travel, status markers, persistent hazards, current FPS render permits and the emergency safety system are **outside this queue** and are not changed.

## Change (one narrow queue overflow policy)

- **Do nothing extra when the queue is at or below 40 items.** Keep the pre-existing fast path, ordering, numerical priorities, effect durations and native painter selection.
- When queue admission would exceed 40, identify **at most one most recently queued visible/meaningful hero-skill receipt** and **at most one most recent player/ally healing receipt** (a `heal` effect whose `actor !== 'enemy'`). Do not reserve any generic `enemyVfx`, ordinary contact accent or hostile heal.
- HERO normal `cast` stages that are intentionally visually blank are excluded. The Stage 4 source's existing presentation-stage classification is used for those: non-cast hero stages and charged casts may be meaningful; normal cast stages count only for Paladin 1/2/6 or Mage/Ranger 3/4. This protects the cue's *admission*, not a guarantee that every catalog stage visibly paints.
- Evict the usual lowest-priority entries from all **other** candidates until exactly 40 remain; when priorities tie, preserve the existing earliest-entry eviction order. There are always at least 39 evictable candidates for a 41+ queue, so no special fallback or cap increase is necessary.
- Only the already-existing optional developer observer sees each evicted receipt via its normal `overflow` call. No sampling for normal players, additional drawing requests, timer, asynchronous job, mutation of combat/game saves or preference changes.

The trade-off under an **extreme high-priority burst** is at most two transient high-priority accents making room for the latest player execution and healing outcome. This is not wholesale suppression of bosses, companions or unknown effects, not a new dynamic cap and **not an Ultra/Balanced/Performance selector**. Real danger geometry remains state-owned and unaffected. Normal fights that never exceed 40 work exactly as before.

## Regression

New `tests/effect-queue-hero-recovery-reservation.test.cjs`:
1. Creates a **real Normal-mode Paladin Skill 1 cast** and a player-health recovery event. The cast and heal are entered through the existing production event/queue pipeline.
2. Injects **60 synthetic priority-5 transients**, deliberately beyond the 40 cap (not a naturally reached combat event). Verifies at most two protected player-feedback slots and retention of the newest 38 high-priority transients, with the original 40 count unchanged.
3. Separately tests hero-only, healing-only and absent-protected-cue cases. With no protected cues the original newest-40 high-priority eviction order is exact.
4. Proves deliberately **silent** Paladin normal Area Skill 5's cast stage does **not** steal a reservation; likewise `actor:'enemy'` healing is not incorrectly treated as player recovery.
5. Rechecks a 100-entry low-priority impact burst, the old case from Stage 5.2; observer overflow totals and save-state purity must remain correct.

**Evidence limits:** These are controlled queue-admission invariants and developer-recorder tests, **not** natural 60-priority-5 encounter frequency, actual composited graphics, real-device FPS, thermal costs or a full-game certification. A reserved cue can still expire under legitimate frame-skipping/long stalls; Stage 4's max 0.12-second grace, the selected FPS target and emergency protections remain authoritative. The helper classifies hero stages using the currently tested Stage 4 rule; future changes to hero stages in [unmerged #464](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/464) require re-auditing this classification and jointly testing projectile release/contact, especially Ranger volleys.

## Cross-stream and acceptance boundaries

- [#464](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/464) modifies pet/charged release lifetimes elsewhere **in the same `queue` function**. Future integration must preserve #464's short line afterimages and physical projectiles *and* this isolated 40-overflow rule, then run both suites. Do not replace the whole function from one branch.
- [#469](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/469) Canvas/Pixi effects and Pause overlay, [#470](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/470) audio gesture/recovery and dormant [#440](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/440) critical receipts are untouched and remain distinct unmerged drafts. None are implicitly certified by standalone #471 focused CI.
- The existing user preference Auto **20–30 FPS** default, adaptive frame skip, resolution adaptation, Optimization Mode Off/Auto/On and emergency protection are unchanged. There is **no 60 FPS assumption**.
- **Do not release:** owner approval, real phone/Chromebook readability and frame-time checks, matched automatic-pressure case measurements, composed Pixi parity, and a separately authorized combined draft acceptance remain outstanding.

**Exact-head CI:** Verify the newest PR #471 commit after this documentation and any concurrent work; older run links cannot substitute. A passing focused test establishes the limited contract above, not full-game or device performance.
