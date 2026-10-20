# Mounted movement and existing-roster skills — 20 October 2026

Published in [PR #334](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/334), merge `82622dc002b96f2fa4a6c9744542d76a80387bfe`. Package-only [run 39396497512](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/39396497512) succeeded; all ten public file checks match the prepared release. Normal workflow restored; temporary publisher removed. [Receipt](evidence/MOUNTED_ROSTER_DEV100_PUBLICATION_20261020.json). Owner live play next; no automatic further work.

Prepared dev.100 on published dev.99. Joel requested faster Highlands wolf riders and asked whether updating the game makes existing pets and companions receive current skills, or requires rest/rehiring.

## Behavior

Mounted Crown riders now walk at 1.30 times the equivalent foot movement speed. The prior 1.18 multiplier applied only to pursuit/mobile Rogue pursuit. The shared factor now also covers idle patrol, captain patrol, formation movement, support approach, ranged withdrawal and tactical Rogue travel/escape. Night and existing Slow factors continue to compose where applicable. Scripted attack dashes, projectiles, cooldowns, damage and map geometry are unchanged. The mounted identity is shared by the Highlands and other Crown riders.

Pets and troops read their current skill definitions from game rules; there is no saved learned-move list per unit. Loading updated game code updates existing roster members. Resting or rehiring is unnecessary. First skills are automatic without learning a separate prerequisite. Second skills require hero Skill 2, taught by rescued Mira in Millhaven after Thornfang. Previously earned advanced training remains earned.

Found a reproducible legacy-state mismatch: an explicit companionCombatTraining=1 survives loading even if hero Skill 2 is already learned. Missing flags were already inferred correctly. Save validation now promotes that stale flag to 2 after validating hero skills and the training flag, preserving IDs, names, wounds, roster status and cooldowns. The live unlock getter also respects learned hero Skill 2; the training overview uses that same getter. This is a possible cause of the owner's observation, not a diagnosis of an unprovided player save.

Skills require an active living unit, eligible enemy/range/line of sight and ready cooldowns; Silence, Recall and work orders can suppress them. Second skills charge before release. Moving enemies can dodge aimed projectiles. The existing release/name and contact effects remain. Updating code alone does not bypass training or reset cooldowns.

## Focused verification

- Mounted movement: 16 paired real Highlands movement scenes, day/night and Slow; pursuit, withdrawal, idle patrol and tactical escape, plus save identity. Passed.
- Existing night-tempo and pursuit-burst focused checks passed.
- Restored roster: soldier, archer and all eleven pets, each with absent/core/advanced training flags and learned hero Skill 2 (39 cases). Missing historical skill cooldown fields recover; both skills are selected automatically through real ticks, charges/projectiles resolve and enemies take damage. No rehiring/rest calls. Passed.
- Untrained first/locked second, live unlock, retained earned training, existing cooldowns/wounds/identity and invalid flag rejection passed.
- Lifebinder activation and all-pet automatic combat checks passed.
- Build/generated syntax and changed-file formatting passed.

No whole-game suite, browser matrix or broad hosted CI. Owner live play is the remaining device/gameplay check. Preserve v4 save keys and schema, FPS/travel changes and artwork.
