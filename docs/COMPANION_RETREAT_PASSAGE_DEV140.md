# Companion retreat passage — dev.140

> **Superseded runtime behavior — owner-directed rollback candidate, 28 October 2026.** This historical dev.140 friendly-only retreat passage exception is redundant and removed in candidate draft PR #567, because every actor pair can pass throughout combat and travel. Companion retreat/survival behavior is retained. This is **unmerged/unpublished** until the owner accepts it. Preserve the historical design and evidence below. See [rollback contract](ACTOR_BODY_COLLISION_ROLLBACK_20261028.md).

Joel requested friends make room for a withdrawing companion: pass through the hero and other friendly companions, while enemies and terrain remain physical obstacles. Applies to automatic tactical regrouping and active Recall return, across Soldier, Archer and all eleven companion pets for all three hero classes.

`party.js` exposes the existing automatic regroup mode independently of its movement-only defensive predicate. `navigation.js` uses that mode for symmetric friendly movement and passive separation. Friendly bodies neither block nor shove the withdrawing unit. Hostile bodies, including bosses and mounts, retain collision in both directions, even when either actor already has the generic crowd-escape allowance. A withdrawing companion cannot arm that mixed-side allowance. Terrain clearance and scripted/forced motion retain their existing rules.

Automatic friendly passage lasts through the existing regroup state, including waiting at the anchor; it ends with that state. Recall passage ends at the existing arrival distance. Damage protection still ends on arrival, with its original amount. No new saved state or save-schema migration is introduced. Combat thresholds, destination selection, work priorities, health, abilities and attack timings are unchanged.

## Focused validation

- `tests/retreat-party-collision.test.cjs`: 108 cases covering all class/role/mode combinations, real movement across hero/ally, passive separation, normal collision restoration, enemy/boss/mount blocking in both directions with preexisting escape flags, sustained low-FPS enemy jam, terrain and save/encounter lifecycle.
- Existing `travel-party-collision.test.cjs` and `crowd-escape.test.cjs` pass, retaining ordinary travel and unrelated crowd-escape behavior.
- Existing dev.106 `recall-check.cjs` and `check.cjs` pass, including one-press Recall, damage protection, regroup/rejoin and save/travel.
- Phone shell startup and a real Recall update pass without JavaScript exceptions.
- Generated build and changed-source formatting/syntax checks. No broad CI/full-game or repeated device matrix.

## Separate assessment of dev.139

The assessment predates this collision change. Source rules already detect critical health at 20% or below with one nearby ordinary foe, and wounded health at 40% or below under enough local pressure. They reassess every 0.4 seconds, move toward hero formation or healthier allies, apply the existing 50% movement-only retreat defense and require roughly 1.4 seconds of favorable observations before rejoining. Gathering/deposit can pause for caution; Soldier also has its existing personal emergency defense.

Focused characterization is preserved in `tools/visual-review/companion-critical-dev139/audit.cjs` and `findings.json`, recorded against published runtime `ef7b0b849859f8bc355e3c40710d1cd3fa128a38`. Run that script against that source revision to reproduce historical evidence; it is an observation tool, not a regression baseline or a dev.140 result.

Current gaps found, **not fixed by this collision update**:

1. A selected formation anchor can already count as arrived while still close to danger. Three close-to-hero controls at 10% health did not withdraw despite detecting unsafe pressure. The sampled alternate side route was terrain-blocked; this evidence does not establish an available safe escape route.
2. Pending charged preparation takes priority over safety. Soldier and Thorn pet controls falling from 21% to 19% health on a small non-interrupting hit stayed preparing rather than withdrawing that update.
3. Build/upgrade processing precedes caution. Critical Soldier controls continued those jobs; the gathering control correctly moved away while retaining its assignment.
4. A newly critical companion can wait for the next scheduled assessment (roughly 0.4 seconds).

The 24 controlled stress scenarios intentionally used low-health level-one companions against a level-ten foe, with ordinary support abilities on cooldown. Their deaths are not a general survival-rate measurement and do not prove all retreat routes fail. Friendly passage addresses crowd obstruction, not these separate destination/priority issues. Further behavior changes require their own owner request.

Published in [PR #376](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/376), runtime merge `e8bd3a39e700b03813a229ba4b553b258be4c066`. Package-only run [39664374072](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/39664374072) succeeded. Exact live build and six checked public resources match the prepared files. Normal workflow restored byte-for-byte and temporary publisher removed at closeout. No broad CI ran. Receipt: `docs/evidence/RETREAT_PASSAGE_DEV140_PUBLICATION_20261021.json`. Owner phone play next; separate assessment findings remain open.
