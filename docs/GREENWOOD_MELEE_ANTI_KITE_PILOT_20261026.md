# Greenwood Vale — ordinary melee anti-kiting pilot (26 October 2026)

Status: isolated experiment; no merge or deployment authorized. This is **the first stage only**. Broader ringleader, boss and captain designs remain proposals for later trials.

## Design intent

Players can kite Thornfang and other melee enemies using repeated ranged damage without investing in talents or equipment. Their existing 1.2-second pursuit bursts do not themselves create a dodgable, dangerous positional decision. Their Rogue withdrawals and reinforcement behavior are distinct systems and must remain intact. This experiment gives the ordinary melee monsters of Greenwood Vale an actually repeatable opportunity to intercept a retreating hero or companion.

Creatures can learn tactics from the region's leaders rather than receive stereotypes based entirely on species. The pilot combines a field-scout interception resembling Thornfang's Dynamic Entry with a restrained melee follow-up reminiscent of the Vale's boss/captain threat patterns. The move is named **Vale Interception** for this pilot. Its identity is shared by Goblins and Skeletons, including melee guardian variants in the Forest Crypt or other Greenwood instances. No new equipment, projectiles, boss summons, animations or healing systems are necessary.

## Exact eligibility and cadence

- Only living, engaged **ordinary melee** creatures of region index 0, including melee guardians.
- Do **not** apply to Ringleaders (melee or ranged), ranged or hybrid roles, bosses, captains, leader-owned summons, special Ringleader emergency guardians, neutral creatures, returning enemies, or any region outside Greenwood Vale.
- At 155–480 units from the selected reachable combat target, after just **0.35 seconds** of sustained out-of-melee-distance pressure, warn a committed ground position for **0.65 seconds**.
- The destination can lead a currently retreating target, but its prediction is fixed when the warning begins. The hero can turn, dodge, use solid terrain or enter cover. It is not a homing teleport.
- Execute a physical, collision-aware rush at up to 1,100 units/s for at most 0.75 seconds; existing enemy Slow halves the rush speed. No displacement bypasses native movement collisions or increases ordinary leash territory.
- On a successful arrival, the **marked target only** can receive a single close-range follow-up strike (0.8 × native current damage) and 0.8 seconds of ordinary Slow if that target is still within both the ground warning and the actor's 94-unit reach. A miss/blocked rush deals no remote damage. No AoE hit spam, guaranteed lock, new cooldown debt model or bonus summons.
- **4.5-second reuse** begins when the warning starts. It has no once-per-fight veto. This is intentionally much shorter than the discarded 12–16-second suggestion. Rogue movement remains on its own two-second tactical clock, and native melee/basic cooldowns, support and healing keep their current contracts.
- The observation history is runtime-only (WeakMap) and the cooldown reuses the existing native `specialCd` field; version-4 saves need no schema change. A saved active warning/motion stays in ordinary enemy state; death, reset and peace paths remain authoritative.

## Implementation

`src/prototype/engine.js`: engine-local `valeMeleeCounter` tuning table, deliberately kept out of global rules and sprite-census fingerprints.

`src/prototype/engine.js`: regional eligibility, short gap observation, fixed predicted warning, mobile cast and one bounded post-arrival hit; integration into actual `updateEnemies` and existing warning/motion owners. No separate AI loop or per-frame global enemy scan.

`tests/vale-melee-anti-kite.test.cjs`: focused cases for Goblin/Skeleton ordinary and guardian eligibility, Greenwood Crypt guardians, range/warning/cooldown boundaries, real physical movement, dodging a frozen warning, preventing damage from failed remote movement, non-target tiers/regions, repeat use, RNG neutrality and disengagement.

## Acceptance and rollout

1. Run `node tests/vale-melee-anti-kite.test.cjs`, the existing pursuit/Rogue/Silence/Slow and navigation safety regressions selected by focused CI, and the reproducible build. Do not launch the manual full certification matrix.
2. Compare native movement and successful warning/hit/miss events under Paladin, Mage and Ranger kiting, first on clear terrain and then around trees, rivers and dungeon walls. A clean test suite does not by itself prove that the move makes kiting appropriately challenging.
3. Human-playtest a low-equipment Ranger or Mage in Greenwood, with level-matched normal Goblins and Skeletons and their melee guardians. Record response frequency per minute, hit rate, dodges, enemy resets and hero survival. Compare against current production.
4. Only after this pilot's acceptance consider a separate melee/ranged Ringleader stage, then a Greenwood captain and Thornfang/Lifebinder stage. Those must build on their authored rotations, not replace or randomly duplicate them.

This branch must remain unmerged/unpublished pending review.
