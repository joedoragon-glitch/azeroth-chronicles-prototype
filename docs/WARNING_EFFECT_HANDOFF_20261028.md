# Combat warning-to-effect handoff — October 28, 2026

**Project:** *So I Became the Dark Lord's Problem*. **Source:** PR #578. The PR and GitHub Actions records determine the current merge and publication status; physical-device confirmation is separately required.

## Player-facing behavior

A ground circle, cone, sector, line, cast label, or ordinary ranged aiming line is an **advance warning**. It is visible only while the action's actual cast/aim timer is positive. At the transition where the engine releases that action, the old warning must disappear in the same rendered state; the outcome is then shown through the real projectile, rush, instant impact, heal, summons, or active hazard.

This applies to ordinary ranged attacks, normal monster Rogue maneuvers, elite/boss Rogue casts, captains and bosses in Normal/TRUE forms, anonymous casts, and the same native combat visuals drawn by Canvas 2D and on top of the PixiJS experimental world.

**Citadel checkerboard:** selected tiles show a full warning during the `warn` phase. The engine applies damage at `warn → rest`. During `rest`, selected tiles no longer retain a red ground danger footprint; a small centered impact burst indicates the completed hit. The ordinary board grid remains visible. The next `warn` phase may mark new cells.

## Important distinctions

- A **queued follow-up attack** has a different, still-pending warning. It may correctly appear while the previous hit's artwork is fading. Removing it would conceal an upcoming hit. The previous action's warning object is retired; the next action owns its own independent timer and footprint.
- **Moving projectiles and charges** begin their damaging journey when the preparation ends. A projectile may hit later, and an enemy charge may damage only when it physically contacts the player; neither should retain its pre-release targeting warning during travel.
- **Damaging lingering hazards** (rings, persistent pools, vents, Dreadmaw closure, Cindermaw cordon and active dungeon traps) must remain legible as active effects as long as their native damage windows exist. Their continued presence is not an expired windup warning. Secondary warnings for a later pulse or final blast remain until *that* separate hit begins.
- Casts with no damage (heals, summons, defensive/support skills) follow the same preparation-to-effect visual handoff without inventing damage.
- Existing durations, health calculations, hit geometry, critical mechanics, boss sequencing and save format are unchanged.

## P0 performance/minimalist presentation candidate — 6 November 2026 (draft only)

[Issue #849](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/849) records the owner's direction to prioritize rendering cost while retaining aesthetically disciplined, subtle warnings. The related [#846](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/846) owns combat-only hostile labels and hero-proximate trap cues. At source baseline `main@284ebff43ccd72e287869d6bb5a3929c43be313e`, neither change was implemented.

A separate **unmerged, unpublished candidate** `perf/telegraph-presentation-849-20261106` proposes:
- A single **thin, stable outline plus restrained translucent interior** for a committed ground attack, painted in one cue pass instead of reconstructing/stroking a second dashed path in a second pass. Muted gold for ordinary warnings, muted blue for Rogue movement, subdued teal for signatures and green for non-damaging protective/healing cues. Preserve boss-specific protected gaps, target footprints, cast clocks, Citadel warned/rest semantics and active damaging hazards. This changes presentation pixels by design, not gameplay geometry.
- A once-per-render-draw derived trap-list cache separate from the existing `warningFrameShapes` entries, plus a visual-only **40-world-unit outer-edge reveal** for spikes/seals and the full capsule length of jets. Still run actual `Campaign.updateTraps()` damage/collision and trap timers for everyone; no renderer decision is permitted to cancel an attack.
- One pending-cast roster scan per actor-cue draw; avoid DOM layout queries when no cast needs the compact HUD-safe bar, and no HUD/name-wrapping allocations on peaceful exploration frames. Royal Tax status remains independent of casts.
- Reuse bounded, mathematically identical unit-circle angular coordinates for frequently used radial shapes instead of repeating trigonometric work. No persistence, renderer preference, simulation or save changes.

**Important truth boundary:** renderer-only eligibility must not recompute combat obstacles, AI, hit eligibility or line of sight. But `boss-combat.js::connectedArenaPoints()` includes real authored battlefield-placement validation for the Citadel court and must not be removed as if it were a warning display check. Some warnings intentionally have no ground footprint (summons, anonymous casts and Ledger behavior); they still need their appropriate actor cue.

**Validation required before any publication:** source/native warning tests for all boss families, Rogue moves, anonymous casts, protected sides, pending-to-release handoff, trap geometry/lifecycle, night/day, overlapping effects and both Canvas/Pixi presentations. Need comparable baseline/candidate graphics-stage timings and real Chromebook playtest data. A source/test improvement does **not** prove an FPS gain. This branch is not a released player build; no PR merge, Pages/PWA update or owner-device performance claim is authorized by this documentation.

## Engineering changes and verification

- `src/prototype/combat-visuals.js`: one `pendingWarning` gate for ground warnings, cast captions and ranged aim; Citadel's rest-phase artwork is no longer a second dangerous-square highlight.
- `src/prototype/enemy-vfx-art.js`: actor windup presentation reads the same pending-warning gate; the existing event-owned release/travel/impact/linger effect paths are unchanged.
- `tests/warning-effect-handoff.test.cjs`: verifies timed visibility boundaries with native Canvas pixels, ordinary Rogue casts, anonymous casts, ranged aims, Citadel transitions and release ownership of all boss families in Normal/TRUE form. Included in the quick regression runner.

This entry describes the **source implementation**, not proof of publication. Record automated CI, browser/phone playtesting, merging and publication separately as they occur. No version bump or release is authorized by this document.
