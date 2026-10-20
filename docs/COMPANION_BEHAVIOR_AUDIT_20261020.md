# Companion behavior audit — published dev.109

Joel requested a brief group announcement covering recent published changes, plus a companion-NPC audit to establish whether they still seek unsafe fights. This is an audit of the currently published runtime (`896d543cdad718c9ec5b3f2dffb4c3124d17a90a`, main closeout `0bb248c52fbeda094ff76f93d4f8f72e28469c79`), with no gameplay changes or deployment. **Result: not a clean pass.** Existing safeguards work in the covered normal cases, but three independently reproduced gaps remain.

## Findings

| Priority | Finding | Actual reproduction | Cause / recommended correction |
| --- | --- | --- | --- |
| High | Critical wounds do not trigger retreat against one ordinary foe | Six cases: Soldier and Thorn pet under each hero class, 10% HP, healthy enemy within melee reach, hero 350 units away. All assessments return `unsafe: false`; all companions attack while the enemy has one second of recovery available, make no progress toward the hero, and die when its attack becomes ready. Soldier emergency immunity is on cooldown in this case. | `woundedThreatForce` requires 1.5 weighted foes; one regular enemy weighs 1. The separate overwhelming test requires at least 2. Being in basic reach also bypasses unsupported pursuit. Add an explicit critical-health escape condition that does not require multiple enemies; retain sensible near-finished-enemy and safe-support distinctions. |
| High | Pursuit detours can leave actual support far behind | An enemy is only 300 units from the hero, but an ordinary collision-bearing wall requires a longer route. Soldier and melee pet continue offensive pursuit out to about 570 units from the stationary hero. Actual navigation, collision and safety assessment are used. | The unsupported test uses target-to-hero distance minus attack reach, rather than the companion's actual separation or planned physical route. Normal offensive routes also omit the hostile-avoidance option. Assess separation/support along the pursuit corridor and reject unsafe detached detours. |
| High | Safe resource/regroup routing misses the new fort range | Frontier garrison archer at (2955,930), accepted route (3305,920)→(3305,940). The planner's avoidance radius is 321; actual garrison reach/acquisition is 400.4. At the route midpoint, 350 away, native enemy AI becomes aggressive and aims at the gathering troop through its own fort wall. | `gatheringThreats()` retains ordinary acquisition +35, while fort AI now uses expanded ranged reach. Share the actual effective acquisition/ranged range, including fort membership, with resource/regroup threat envelopes. |

The path-detour probe establishes unsupported pursuit; it does not fabricate a measured rate of deaths from that detour. The fort probe separately establishes a real unwanted acquisition/aim. Enemy level, equipment, fort mitigation and predicted support at the destination are further tuning considerations, not additional independently proven failures in this audit.

## Safeguards that pass

- Twelve role/class cases confirm no autonomous acquisition, damage or projectile launches against idle unaggroed enemies: three hero classes × Soldier, Archer, melee pet and ranged pet.
- Existing `tools/visual-review/companion-judgment-dev106/check.cjs` passes isolated-group withdrawal, supported engagement, wall/distant/working-ally exclusion, wounds under sufficient threat, hysteresis/rejoin, defensive covering basics and lifecycle cleanup.
- Existing `recall-check.cjs` passes one-press job/cast cancellation, continued return through hero offense, completed arrival, defensive hold, 50% non-stacking retreat defense, repeated presses and save compatibility.
- Existing `tools/visual-review/field-boss-gather-dev105/gather-check.cjs` passes physical hostile-aware gathering routes, waiting, self-defense-only work, safe delivery selection, Recall and saved labor intent. The new fort-specific probe exposes a range not present in those older cases.

## Reproduce / limits

Run `node tools/visual-review/companion-behavior-audit-20261020/audit.cjs`. Its `findings.json` contains exact coordinates, health, threat/support values, route points, distances, target intent and observations. Findings are recorded as defects, not asserted as desired behavior. The harness warms the existing population/balance migration before comparing HP; an initial un-warmed fixture incorrectly interpreted max-HP normalization as damage and was corrected.

The new probes use native world collision, routing, party updates and (for wound/fort behavior) actual ticking/enemy AI. Older judgment fixtures isolate geometry, as documented in their own source. This is bounded headless evidence, not a full campaign, device/browser matrix, statistical survival study or claim that companions can never die. No version bump, runtime edit, build, hosted CI or publication was performed for this audit. Proposed repairs remain pending.

The group announcement should describe the already published companion improvements without claiming all reckless behavior is eliminated. No message is sent to the group as part of this work.
