# Greenwood Vale — ordinary melee anti-kiting pilot (26 October 2026)

Status: isolated release candidate; owner authorized audit, merge, and live testing on 26 October 2026. Merge is contingent on passing focused validation and production build. This is **the first stage only**. Broader ringleader, boss and captain designs remain proposals for later trials.

## Design intent

Players can kite Thornfang and other melee enemies using repeated ranged damage without investing in talents or equipment. Their existing 1.2-second pursuit bursts do not themselves create a dodgable, dangerous positional decision. Their Rogue withdrawals and reinforcement behavior are distinct systems and must remain intact. This experiment gives the ordinary melee monsters of Greenwood Vale an actually repeatable opportunity to intercept a retreating hero or companion.

**Crown doctrine and leadership:** Marshal Veyra, the Ash Sentinel, is the Crown's martial authority; the Citadel of Ashes serves as her academy. Her Sentinel Advance, Ash Lanes, and Guard Pivot establish disciplined advance, prediction of movement and control of retreat lanes. Ordinary fighters can inherit that *principle* without copying her high-level powers. Thornfang's Dynamic Entry and Tripwire contribute pursuit and positional threat; Lifebinder's fixed danger geometry contributes space control; the Vale captain contributes disruptive battlefield technique. This is a shared fighting discipline, not a species-locked spell or proof that each individual monster was personally trained by Veyra.

Creatures can learn tactics from the region's leaders rather than receive stereotypes based entirely on species. The pilot combines a field-scout interception resembling Thornfang's Dynamic Entry with a restrained melee follow-up reminiscent of the Vale's boss/captain threat patterns. The move is named **Vale Interception** for this pilot. Its identity is shared by Goblins and Skeletons, including melee guardian variants in the Forest Crypt or other Greenwood instances. No new equipment, projectiles, boss summons, animations or healing systems are necessary.

## Exact eligibility and cadence

- Only living, engaged **ordinary pure-melee** Greenwood Goblins/Skeletons of region index 0, including eligible melee guardians. Hybrid actors retain their own ranged and melee repertoire but do not acquire this new regional skill.
- Do **not** apply to Ringleaders (melee or ranged), any ranged or hybrid role, bosses, captains, leader-owned summons, special Ringleader emergency guardians, neutral creatures, returning enemies, or any region outside Greenwood Vale.
- At 155–610 units from the selected reachable combat target, after just **0.35 seconds** of sustained out-of-melee-distance pressure, warn a committed ground position for **0.65 seconds**.
- The destination can lead a currently retreating target, but its prediction is fixed when the warning begins. The hero can turn, dodge, use solid terrain or enter cover. It is not a homing teleport.
- Execute a physical, collision-aware rush at up to 1,400 units/s for at most 0.9 seconds; existing enemy Slow halves the rush speed. No displacement bypasses native movement collisions or increases ordinary leash territory.
- On a successful arrival, the **marked target only** can receive a single close-range follow-up strike (0.8 × native current damage) and 0.8 seconds of ordinary Slow if that target is still inside the 100-unit impact footprint around the committed landing. A miss/blocked rush deals no remote damage. No AoE hit spam, guaranteed lock, new cooldown debt model or bonus summons.
- **Melee reach:** eligible Greenwood ordinary melee monsters and guardians now have **120 world units**, matching the Paladin's basic reach. Bosses, captains and melee Ringleaders receive a **90-unit** basic-attack minimum across all regions. Ordinary melee elsewhere remains at **65**; Soldier basic melee remains **65**, melee pet basic remains **70**. Individually authored longer reach is preserved. Ringleader hybrids switch to close combat at **120 units** rather than 100, but must close to their 90-unit basic melee hit range. Elite reach updates do not grant Greenwood Interception.
- **Dual-role hybrid AI:** Hybrids keep ranged support healing, projectile attacks, and a short defensive backstep during melee recovery (0.42-second duration, 5.5-second independent reuse). They also keep close-range melee strikes, native chase/pursuit, and Rogue decisions. Backsteps cannot override a ready melee basic, an ongoing ranged aim, a warned skill or a regroup, and use normal collision/leash checks. This hybrid dual-role improvement is cross-region. No hybrid variant receives the Greenwood-only new interception in this first test. All hybrids keep their native ranged and melee skills. Every hybrid variant, including hybrids with guardian or Ringleader status, may self-heal 10% of maximum HP over 3 seconds every 5 seconds; the effect uses a separate recovery slot and cooldown from allied ranged heals. A ranged ally can heal the same hybrid at the same time without being denied by hybrid self-healing, and neither pulse can exceed maximum HP.
- **4.5-second reuse** begins when the warning starts. It has no once-per-fight veto. This is intentionally much shorter than the discarded 12–16-second suggestion. Rogue movement remains on its own two-second tactical clock, and native melee/basic cooldowns, support and healing keep their current contracts.
- The observation history is runtime-only (WeakMap) and the cooldown reuses the existing native `specialCd` field; version-4 saves need no schema change. A saved active warning/motion stays in ordinary enemy state; death, reset and peace paths remain authoritative.

## Implementation

`src/prototype/rules.js`: single authoritative Greenwood `valeMeleeCounter` tuning table, with an updated source fingerprint in the sprite scope evidence (no artwork changes).

`src/prototype/engine.js`: regional eligibility, short gap observation, fixed predicted warning, mobile cast and one bounded post-arrival hit; integration into actual `updateEnemies` and existing warning/motion owners. No separate AI loop or per-frame global enemy scan.

`tests/vale-melee-anti-kite.test.cjs`, `tests/hybrid-self-heal.test.cjs`, `tests/hybrid-dual-role-ai.test.cjs`: focused cases for Goblin/Skeleton ordinary and guardian eligibility, Greenwood Crypt guardians, range/warning/cooldown boundaries, real physical movement, dodging a frozen warning, preventing damage from failed remote movement, non-target tiers/regions, repeat use, RNG neutrality and disengagement.

## Acceptance and rollout

1. Run `node tests/vale-melee-anti-kite.test.cjs`, the existing pursuit/Rogue/Silence/Slow and navigation safety regressions selected by focused CI, and the reproducible build. Do not launch the manual full certification matrix.
2. Compare native movement and successful warning/hit/miss events under Paladin, Mage and Ranger kiting, first on clear terrain and then around trees, rivers and dungeon walls. A clean test suite does not by itself prove that the move makes kiting appropriately challenging.
3. Human-playtest a low-equipment Ranger or Mage in Greenwood, with level-matched normal Goblins and Skeletons and their melee guardians. Record response frequency per minute, hit rate, dodges, enemy resets and hero survival. Compare against current production.
4. Only after this pilot's acceptance consider a separate melee/ranged Ringleader stage, then a Greenwood captain and Thornfang/Lifebinder stage. Those must build on their authored rotations, not replace or randomly duplicate them.

Owner authorized integration for live testing, but any merge/publication still requires green CI and the focused Pages publication workflow. Live Ranger/Mage acceptance remains a separate observation, not something the automated checks can certify.
