# Azeroth Chronicles — Stage 4 evidence-based VFX corrections

**Date:** 25 October 2026
**Scope:** Draft [PR #471](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/471), based on main `e3c78266b28f3325d2afdcb76ae849fcff306deb`. Source-derived follow-up to [Stage 3 findings](EFFECT_DIAGNOSTICS_STAGE3_FINDINGS_20261025.md). No merge or deployment authorized.

## Goals and constraints

Preserve the actual combat outcomes, projectile travel and timing, the 40-item transient visual budget, the existing FPS/adaptive-skipping decisions and ordinary player CPU safeguards. **Do not** add a timer, polling observer, screenshot capture, network request, background job or new saved-state field. Developer effect recording remains explicitly opt-in and off by default, including in Developer Mode.

### Change A — bounded first eligible paint

The source-proven failure was a short visual cue aging out via `renderer.update()` before the scheduled `renderer.draw()` was permitted. A small presentation-only guard now protects **an essential hero cue that has never been handed to its painter**:

- Applies to authored **visible** HeroPresentation stages only, such as selected tap/charged casts and their impact/area/chain/cancel/displace/cross cues. Deliberately blank cast stages, whose projectile or area already owns the visible motion, do not receive grace.
- If the cue's ordinary lifetime would expire before any painter call, it can remain eligible for a normal, already-scheduled draw for **no more than 0.12 simulation seconds beyond its original expiry**. The held visual life is `min(max, 0.075s)`, so it appears briefly rather than restarting at full size.
- Once drawn, the cue **expires at its next update** (no repeat grace, additional draw requests, or changed gameplay timestamps). If no eligible draw comes before the grace deadline, it expires without a misleading late flash.
- The extension exists on the transient presentation object only. Nothing touches AI, skill damage, cooldown, hit detection, projectile movement, save data, or native FPS/adaptive policy.
- Ordinary gameplay adds only a small conditional in the existing `visualFx` update loop; the expensive developer-only recorder remains disabled unless manually started.

**Limit:** This does not force pixels through an offscreen or intentionally suppressed painter. Stage 2's `painted` counter still measures calls, not perceptual visibility. Boss/captain/enemy and persistent telegraph rendering is not changed without a demonstrated analogous failure.

### Change B — more truthful status drawing within the existing budgets

The old enemy-status code considered Weaken → Fracture → Taunt → Slow → Silence in world order and drew only three markers, stopping after 24 enemies. It silently concealed priority control effects and later important targets.

The new bounded selector:

- Scans the eligible visible enemies with a **maximum of 24 chosen records**, replacing a low-priority enemy only if a more important selected target, boss, or captain appears later. The hero's selected target outranks a boss, a boss outranks a captain, and ordinary enemies retain previous order otherwise.
- Gives the three icon positions to **Silence, Taunt, Slow, Fracture, Weaken**, in that priority order. When more than three statuses are active, the first two important glyphs are shown plus a compact `+N` marker occupying the third glyph position (`N` counts the hidden statuses). No extra glyph slot or arena-wide overlay.
- Keeps the **three markers per enemy / 24 enemies** budgets. Actor status checks are performed on the existing rendering pass with a fixed-size result array; there is no additional per-frame timer, background thread, data storage or separate screen pass.
- Does not alter how statuses apply, expire, or influence combat. The prioritization is a visibility policy only.

### Change C — intentionally **no** increase in the 40-effect queue

Stage 3 proved that a 100-hit synthetic burst evicts low-priority transients while preserving a higher-priority heal. It did **not** prove a naturally generated, safety-critical missing cue or a favorable CPU budget for raising the limit. The queue remains at 40 with existing priority rules.

## Automated regressions

Updated tests:
- `tests/effect-diagnostics-stage3.test.cjs` — the prior controlled missed-paint reproduction now expects an essential cue to reach the first *scheduled* drawing call, with immediate post-draw expiry; five stacked statuses must produce distinct visible overflow.
- `tests/effect-diagnostics-stage3-party.test.cjs` — 25 ordinary enemies still produce the same image as 24, while a late boss or hero-selected enemy replaces an ordinary marker in the fixed 24-entity budget.
- New `tests/effect-diagnostics-stage4.test.cjs` — real Paladin Skill 1 casts at 20/30/60 simulation steps/s, normal/charged, controlled delayed-first-draw rescue; bounded cancellation when starving beyond the grace limit; no resurrection of intentionally blank Paladin Skill 5 cast; no developer recording in normal mode, no mutation of gameplay snapshot, 40-entry queue unchanged.
- Existing `tests/effect-diagnostics.test.cjs`, native Canvas/pet/boss coverage and integration/persistence tests provide additional focused impact validation through repository CI policy.

**What these can and cannot prove:** CI Canvas pixel assertions and deterministic simulation steps validate candidate behavior. No benchmark of physical hardware thermal load, real displayed frames or GPU completion was performed; no conclusion about actual real-world visual loss frequency is justified without post-merge, owner-approved device evidence. The user is not assigned testing work.

## Release/handoff conditions

Stage 4 should be accepted only after focused CI succeeds on the final draft head and the reproducible build check passes. The PR must stay draft, unmerged, undeployed, with the published player game untouched. Stage 5 remains release/visual acceptance planning; do not alter independent PR #440, PR #449, or the established multi-file PWA architecture.
