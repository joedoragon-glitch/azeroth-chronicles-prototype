# Rogue jingle-bell canon audit and focused slowdown report — 28 October 2026

**Prepared release candidate:** 0.9.1+snapshot.dev.208. Base: published dev.207 / `main@a46effdc`. This candidate is **draft and not published**; owner is comfortable with ordinary live-first acceptance after an explicitly authorized release, not a preview testing workflow.

## 1. How the incorrect bell propagated (verified root cause)

The owner explicitly fixed the Rogue weapon on 27 October: a staff with **one large suspended spherical jingle bell**, not a generic handbell or guitar. This appears in `docs/ROGUE_BARD_STATIC_VISUAL_DESIGN_20261026.md`, `docs/ROGUE_BARD_CANONICAL_OWNER_HANDOFF_20261027.md`, `src/prototype/rules.js` (`instrument: 'suspended-jingle-bell'`) and the existing `rogueBellStaff()` procedural world art. Those areas were correct.

The class-admission registry in `engine.js` nevertheless used the generic hanging handbell emoji `🔔` for both New Game and the HUD; `tests/rogue-bard-live-playtest-admission.test.cjs` asserted that **incorrect** value. Subsequent dev.207 foley initially treated ambiguous `bell` naming as tonal bell notes before the owner's correction to jingle rattles. **Root cause is a specification-to-subsystem handoff and test-fixture gap**, not absent owner clarity or a missing game-engine jingle mechanic. An implementation was deemed functional with no cross-subsystem identity acceptance.

**Small repair:** use a semantic `jingle-bell` registry token, render a simple spherical slotted jingle-ball SVG (no staff) in New Game, Succession and HUD, and update the admission guard to assert the canonical token and cross-screen presentation. Do not change hero staff artwork, sound, combat, saves, art pipeline or create speculative polishing work. This is a single static UI glyph, not a new image/sprite system. No generic bell emoji remains Rogue's class symbol.

**Development prevention:** when owner updates equipment or class canon, review at minimum rules, world art, skill FX, audio, new-game selection, HUD, Succession and tests; don't lock a placeholder/old icon into CI. Cite the controlling canonical document. Historic guitar and earlier bell language retained as history is not live authorization.

## 2. Why the old report could not identify the cause

The public `Export playtest report` already includes bounded aggregate CPU stage figures and companion Slow/roster/emergency history; optional renderer recording was *off* in the owner iPhone report. A rare 205–227 ms callback gap cannot be attributed from mean `companionAIMs`, and the old `frameProfile` only retained 180 active callback samples that were reset by graphics-tuning changes. Its `companionAIMs` timed all `updateParty()`, not individual behavior subtasks; it recorded neither exact exceptional frame context nor world location.

**Focused automatic extension, no new workflow:** `performance.frameProfile.slowdownIncidents` retains at most **16 exceptional callback records** (synchronous work at least 50 ms, callback interval at least 120 ms, or emergency entry). Each includes current and previous callback timing, actual event categories in both, and location/context when an incident occurs: region ID, hero world X/Y and 256-unit region-grid cell; class, movement, nearby radius 420, total/nearby/engaged enemy counts and up to eight local enemy types, active/Charmed ally counts, nearby props/buildings/NPCs/hazards/projectiles and current event-type counts. The report does **not** include personal GPS coordinates, full zone/party snapshots, player-entered names or event payloads in this new section.

`updateParty()` now gives diagnostic timing boundaries for **guidance, shared setup, all active-unit work, and bookkeeping**, all within `companionAIMs`. This is not per-unit CPU attribution; specific causes remain hypotheses until slow-frame evidence supports one. An observed callback interval includes browser scheduling/suspension; it is not the same as synchronous JS work or GPU completion. A previous callback's duration can suggest correlation, not causality.

History survives the ordinary Auto graphics profiling reset so a single rare stall is not erased; the player's preexisting **Reset performance sample** clears both rolling statistics and incident records. Only exceptional callbacks enumerate nearby world actors; ordinary frames record just a tiny category list (at most twelve event types) while standard stage timers already run. All data are session-local, memory-bounded, observation-only and available using the **existing** `Export playtest report` button; the PWA/service worker, mode, saves, controls, AI choices, damage, recovery and adaptive frame-skip rules remain unchanged.

## 3. Acceptance

- Run focused frame/party/export/class icon/CI and offline build on the exact head.
- Confirm the icon is a **standalone spherical jingle bell**, *not* staff plus bell.
- User's standard workflow is public-game playtesting after authorized ordinary publication; **do not invent a branch preview/testing workflow**.
- Pending: real phone visual/audio judgment, one actual incident exported from dev.208, and proof of simulation vs renderer vs browser scheduling cause. The prior severe iPhone slowdown remains unresolved until those data exist.
