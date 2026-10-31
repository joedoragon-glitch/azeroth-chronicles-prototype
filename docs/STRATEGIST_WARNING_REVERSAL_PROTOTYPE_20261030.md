# Strategist warned-attack reversal — isolated native proof (30 October 2026)

**Status: DRAFT PR #696; NOT PLAYABLE, NOT MERGED, NOT DEPLOYED.** This documents a source-level combat experiment, **not** a released skill, confirmed balance, final class curriculum or new storyline. The production four-class campaign is deliberately unchanged: no fifth-class menu, authored combat kit, starting saves, instructor training, touch button or visual asset is added here.

## The player experience we intend to prove

A Strategist reverses the usual response to a hostile warning. Instead of fleeing, the player enters the **actual incoming damage/debuff footprint**, stays exposed until ready to act and invokes a deliberate left-hand reaction **before the release**. A successful reversal consumes **one specific committed attack instance** and returns harmful force to the responsible caster. That one impending release harms **no one it would have struck**, including companions standing in its threatened area, rather than protecting only the hero. It does not protect against another attack unless that other warning is separately read and reversed.

This is an intentional high skill-ceiling mechanic. In intense late-game combat, sufficiently skillful timing may prevent practically all telegraphed damage and status effects, *if the player individually counters them*. Do not add arbitrary chain quotas, guaranteed bleed-through damage, ambient temporary immunity or multi-warning erasure for artificial difficulty. Failed reads, wrong positions, late inputs and all untouched simultaneous or later attacks remain genuinely dangerous.

## Source-grounded experimental scope

`src/prototype/boss-combat.js` introduces four narrowly scoped prototype methods:

- `strategistReversalSupported(e,a)`: explicit allowlist for **Stone Colossus/Garun** `mine/0` (one frozen target-centered circle) and **Drowned Keeper** `archive/1` (the native twin parallel ground lanes), verifying source/plan identity and safe shape.
- `strategistReversalCovers(a,point)`: uses `attackPatches` and actual `distanceToSegment` contact with the original frozen geometry. The Keeper's open channel is **not** a hit. No invented scenery collision truncation.
- `attemptStrategistReversal(enemyId)`: an explicit direct command that must find a current genuine enemy `telegraph`, eligible hero identity, live positive timer, valid impact occupancy and line to source. Repeated commands against the same warning fail. This command is **not yet wired to UI or keyboard** and no Strategist can be loaded or selected.
- `strategistResolveReversal(e,a)`: at the original boss release, consume only that warning's receipt, skip its real party-facing damage/debuff resolution, apply one source-appropriate direct rebound to the caster and emit an ordinary effect receipt. The native boss scheduler still owns subsequent warnings. The prototype return-force coefficient is deliberately temporary (rank-1=35%, +10 percentage points per rank), for **validation not approval**. No blanket shared cooldown is added.

The branch-native `tests/strategist-warning-reversal-prototype.test.cjs` checks the real `Campaign` and native warned-attack builders/geometry in generated dungeon zones; a deliberately unsupported in-memory `hero.class='strategist'` fixture is used to exercise the method **without** admitting a selectable class. Positive and baseline damage, companions, duplicate/late/outside/wrong-class/not-the-source, next-warning independence and excluded summon are expected evidence points. A test pass is **not** player/device validation.

## What this prototype explicitly does NOT prove

- Five playable classes, dual-dagger automatic attacks, Water/Earth/Fire starting skills or their charged forms, the additional alchemical Skills 4–8 or Neri's new instructor role.
- Combat instructors' progression/mastery integration, companion combat training migration from a three-skill start, Field Orders mapping, active left-hand controls on desktop and mirrored/mobile touch.
- Other authored boss attacks; ring/persistent hazards, projectiles, charge motion, stage sequences, specialized support and unusual patterns require separate actual-impact owners, not a generic warning-cancel loop. The two pilots establish the per-warning seam only.
- Full normal/TRUE/Nightmare/late-Awakening balance, high-throughput real attacks, device FPS, visual/sound cues, save/restore/succession, EN/ES interface or editorial acceptance.
- Any new Neri/Archive flood/Garun/Scornfang/Dreadmaw story or recruitment. That exploration is parked in #695.

## Rollout guardrails

PR #696 remains draft and unmerged. Treat existing four classes and all original enemy release paths as protected. Evaluate exact-head native tests, documentation check and offline build; do not claim 'tested' until they pass. If a fixture or actual resolution behavior disagrees, repair the code/test fixture honestly, not by weakening the original mechanics. A real playable Strategist and full class integration still require their own explicit acceptance in project #674.
