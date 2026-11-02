# Dormant squad-command prototype — design and admission gates

**Official project:** So I Became the Dark Lord's Problem (SIBDLP).
**Tracking:** Issue #684 / draft PR #685. **Status: DESIGN + TEST-ONLY CODE. NOT PLAYABLE, NOT MERGED, NOT PUBLISHED.**
**Source baseline:** current `main` as reconciled on draft branch; recheck latest head before future admission.

## What actually existed before

The historical v0.8.44 unified squad-control revision removed the separate squad cursor,
per-unit selection, individual unit Move/Attack commands and Hold Fire. It replaced these
with the current encounter-scoped TARGET/THREATS or BOSS/ADDS binary doctrine. This is
recorded in `docs/PROJECT_HISTORY.md`. We must not present those historical individual
commands as still available to players or confuse them with the obsolete **hero**
`attack`-order executor archived in `tools/legacy/hero-attack-order.cjs`.

## Owner's new proposed feature, intentionally dormant

A single squad-level command applied to every *active, living* companion, without a
per-unit cursor. Prototype implementation: `tools/experimental/squad-command-planner.cjs`;
regressions: `tests/squad-command-planner-dormant.test.cjs`. This module has NO import
from `src/prototype/`, no HUD binding, no save field, no input binding, no tick hookup,
and no actual movement/combat execution. It produces **intents**, a developer term for
suggestions of what squad members should try to do, leaving all real validation to
existing game systems if/when the feature is approved for play.

| Proposed command | Draft intent | Open design questions |
| --- | --- | --- |
| Move squad | Regroup in formation around an explicitly chosen valid map location | Are destinations selected on the map, by tap, or through named markers? Formation spacing, collisions, unreachable points, return-to-hero behavior |
| Attack target | Entire eligible squad prioritizes one chosen lawful enemy | How long does the order last? When does it release on death, retreat, cover, zone change, or leash limit? Does boss/add doctrine override it? |
| Defend Hero | Squad protects the hero by prioritizing enemies that **actually target the hero**, otherwise escorts the hero | Enemy AI must expose the currently selected victim; proximity or `aggro` alone cannot prove that an enemy is targeting the hero. What if several enemies target the hero? How far may the squad pursue? |

**Defend Hero is not the same as Recall.** Recall is the owner's emergency five-second
defensive withdrawal and takes precedence over squad combat. The dormant planner
intentionally returns only a Recall intent while Recall is active. Defend Hero may
intercept actual pursuers and should eventually use normal companion skills, but that
is NOT implemented; the planner does not call `cast`, `move`, `follow` or alter
`_tacticalPartyTargets`.

**Hold Fire** was part of the old control set, but is NOT silently resurrected. It can
be discussed later as a possible fourth *squad-wide* stance. Likewise, this is not
authorization to restore the pre-modern hero attack-order execution loop or its
105/350/350/220 approach distances.

## Architectural dependencies before gameplay integration

1. **Enemy targeting receipts:** in `src/prototype/engine.js::updateEnemies` the
   enemy can select a target transiently among hero, companions, escorts and
   scripted boss targets. The future Defend planner needs a bounded per-frame
   `enemyId -> actualTargetId` observation from that authoritative resolver;
   a monster with `aggro=true` may be targeting an Archer, not the hero.
2. **Companion controller:** `party.js::updateParty` has formation following,
   target-selection doctrine, healing, Charmed/pet roles, work/gather/deposit
   orders, and constrained combat. A future adapter must arbitrate among those
   without overwriting assigned work, creating unreachable pursuit, duplicating
   attack cycles or changing hero Skill 1. Existing Recall must dominate.
3. **Pathfinding:** use `followCompanion`/path and actual collision/line-of-sight
   checks; do not teleport, ignore zone/dungeon boundaries or assume a common
   range for pet, Soldier and Archer.
4. **Command lifecycle:** validate destination/enemy/region; expiration and
   cancellation (manual override, death, scene transition, completed fight),
   precedence with the existing doctrine and save migration must be decided.
   No new save schema or external inputs are permitted in this dormant stage.
5. **UI/usability:** no additional touchscreen controls until we test demand,
   one-handed use, accessible visual feedback and conflict with Target, map
   navigation, Recall, skills and touch/keyboard bindings.
6. **Balance:** compare against current autonomous squad behavior and prevent
   trivial boss kiting, free indefinite interception or improved damage by
   inventing extra combat actions.

## Dormant admission / testing checklist

- [x] Pure input-validation and immutable intent generation.
- [x] Move, Attack, Defend Hero candidate envelopes.
- [x] Dead/resting allies excluded; invalid/dead/returning/neutral/wrong-zone
      enemy targets cannot trigger attacks.
- [x] Defend requires authoritative enemy-targeting receipts, not generic aggro.
- [x] Recall takes precedence over all proposed commands.
- [x] Guard test that the live `src/prototype` tree never imports the module.
- [ ] Full current-main focused CI receipts and code review.
- [ ] Actual enemy-victim receipt architecture and testable freshness semantics.
- [ ] Boss threat, pet/Charmed behavior, path/collision, accessibility, pause,
      damage and saves acceptance.
- [ ] Owner decision on command UI, expiration, priority vs doctrine and
      whether to add squad-wide Hold Fire.
- [ ] Explicit future authorization to wire into gameplay; separate merge,
      deployment, device-verified checkpoints.

**Important:** None of these dormant tests claims that the squad can currently
be commanded to Move, Attack or Defend in the playable game. The owner explicitly
asked us to prepare and study this without releasing it.
