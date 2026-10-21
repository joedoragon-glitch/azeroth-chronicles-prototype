# Survival and withdrawal audit — dev.142–144

Review-only audit requested by Joel after dev.144. Runtime remains `0.9.1+snapshot.dev.144`; no gameplay repair, version bump or deployment is included. Audited main closeout `657f006b10e7ddb24b6315e4ce07309876d5b36b` and historical dev.141–143 source checkpoints.

**Result: five confirmed defects, including three failures to avoid current danger, one excessive refusal to contribute, and one enemy attack-placement regression. The previously green suites do not establish that this mechanism is complete.**

## Findings

### F1 — High: critical companions can advance into long-range threats (dev.142, retained in 143/144)

`companionSurvivalThreats()` detects effective ranged/boss reach, but `companionSafetyAssessment()` still decides critical wounded exposure using only the 260-unit `nearThreatRadius`. Outside that radius, one enemy with hero support can pass the normal combat assessment. The early critical branch then falls through to offensive movement, bypassing `followCriticalCompanion()` and its safe-contribution checks.

Reproduction: at 10% HP, companion `(1100,1500)`, hero `(1150,1500)`, enemy `(1420,1500)`. Ranged reach is 440; captain reach 672; boss reach 720. In all twelve cases (Soldier, Archer, melee Ridge pet, ranged Archive pet × three threat kinds), assessment reports `unsafe:false`, retreat mode remains false, and one 0.05-second update reduces the 320-unit enemy gap to approximately 307.5–309.5. The same twelve probes on dev.141 enter retreat without advancing; all twelve regress in both historical dev.142 and dev.143.

Repair: make critical entry/reassessment use actual threat reach inside the established judgment owner, and ensure critical actors never fall through to offensive pursuit to qualify for a contribution. Preserve situational rejoining above 20%; do not restore a 40% recovery gate.

### F2 — High: safe contributions ignore outdoor traps (dev.143/144)

`companionSafeContribution()` checks `traps()` only inside `isDungeon()`. Native outdoor mini-site traps are returned by the same trap owner and damage companions through `updateTraps()`.

Reproduction: native Vale spikes at `(810,1815)`, active phase 0.98 in the 0.93–1.93 damage interval. A protected critical Archer on the spikes is allowed to contribute and holds its exact position. Native trap resolution reduces HP from 10.5 to 6.475.

Repair: apply native trap footprint/phase checks wherever traps exist, including outdoor sites and side locations. Do not change trap damage or party collision.

### F3 — High: specialized persistent hazards are absent from the safety check (dev.143/144)

The check reads generic `s.hazards` and current enemy warnings/reach, but Dreadmaw stores persistent vapor in `enemy.dreadVapors`. Those hazards continue dealing damage after the caster moves away. Similar specialist stores require an inventory rather than assuming the generic array covers every active area.

Reproduction: critical Archer on a live Dreadmaw vapor patch with the caster 700 units away and a legal screened melee target nearby. Safe contribution returns true. The Archer continues firing; the actual Dreadmaw update applies the authored 0.12 vapor coefficient and kills it from 10.5 HP in 1.25 seconds. This is current, detectable danger, not a prediction of every future enemy action.

Repair: reuse the authoritative footprints and active windows for specialized hazards in both hold eligibility and retreat destination scoring. Do not add an unrelated guaranteed-survival rule.

### F4 — Medium: an expanding ring incorrectly forbids firing in its cleared interior (dev.143/144)

Generic hazards are treated as filled circles: `distance < radius + margin`. Generic ring damage instead tests the moving annulus, with its native half-width. A ring that has already passed the actor keeps disqualifying an otherwise safe position as its radius grows.

Reproduction: Archer 50 units from a generic ring center, ring radius 180 and expanding outward. Contribution is refused, while native hazard resolution leaves HP unchanged. There is no later central blast in this generic ring owner.

Repair: use ring-specific present/future geometry for the relevant action duration. Preserve the native ring's authored effects; distinguish specialized closing rings with final blasts.

### F5 — Originally high; now accepted: Dreadmaw withdrawal shifts escape gaps (dev.144)

`enemyWithdrawalCastPosition()` recenters every `kind:'ring'` on the actor. Dreadmaw's native `dreadClosurePlan()` deliberately chooses a possibly offset center and validates two terrain-clear exit gaps. Generic recentering discards that placement without validating it again.

Reproduction uses the actual Dreadmaw object and actual Treasury terrain, without a terrain override. At legal actor position `(120,120)`, the native closure planner chooses `(180,120)` and both gaps pass the original nine-ray clearance test. The native withdrawal selector starts that real skill. The moving-cast position update snaps its center 60 units back to `(120,120)`; one of the same two validated exits becomes blocked. This can occur without a change in the player's position.

Original repair recommendation (superseded by owner decision below): preserve the validated ground anchor for this specialist ring, or perform native exit validation before relocation.

**Owner disposition, 21 October 2026: closed as accepted behavior.** Keep Dreadmaw’s sneaky actor-centered withdrawal ring. Terrain-obstructed gaps can occur situationally; no guaranteed reachable escape route or additional revalidation is required. Existing cues track the shifted geometry. See [design decision](DECISIONS.md#dreadmaw-withdrawal-ring--owner-decision-21-october-2026). The reproduction remains accurate; the design requirement changed.

## Validation gap and retained behavior

The three release suites still pass on current dev.144: **62 critical-survival, 72 safe-contribution and 61 enemy-withdrawal scenarios (195 total)**. Their fixtures omit the scenarios above. In particular, the dev.144 captain factory sets `captain:true` but omits `roomCaptain:true`; the named Dreadmaw case therefore bypasses the real Dreadmaw-specific dispatch, whose predicate requires `roomCaptain`.

Existing positive checks continue to cover 21% rejoining without a recovery latch, independent healthy fighters, safe ranged/troop/pet contributions, unsafe charge cancellation, following/Recall, healing priority, cooldowns, warning clocks, collision and save cleanup. No defect in the removal of the fixed 40% recovery gate or current v4 save compatibility was reproduced. The four older suite failures recorded in dev.144 remain inherited baseline limitations; this audit does not reclassify them as new survival findings.

Historical repair order: F1, then the shared trap/hazard geometry behind F2–F4, then F5. F1–F4 were addressed in dev.145; the owner subsequently accepted F5 rather than requesting a repair. Extend tests with actual runtime actor flags, native environmental states, legal destinations and explicit expected survival/withdrawal outcomes. Keep the existing tactical architecture, skill identities, percentages and release workflow.

## Evidence and reproduction

- [`check.cjs`](../tools/survival-audit-dev142-144/check.cjs): `node tools/survival-audit-dev142-144/check.cjs`. Reports adversarial observations, including defects; a zero script exit means the probe completed, **not** that the audit passed.
- [`current.json`](../tools/survival-audit-dev142-144/current.json): sixteen current probes, including twelve entry/approach cases and the four environmental/geometry cases.
- [`entry-history.json`](../tools/survival-audit-dev142-144/entry-history.json): twelve entry probes each on historical dev.141/142/143 (36 controls).
- Historical comparison: set `SURVIVAL_AUDIT_ENGINE` to an archived historical `src/prototype/engine.js` and pass `--entry-only`.

Companion probes use an open bounded mechanical arena to isolate decisions; trap data and damage resolution are native. Vapor state uses authored timing/coefficient and native damage resolution. F5 uses the real Treasury geometry and native captain dispatch. This is a bounded implementation audit, not a full campaign/device/FPS certification. No broad CI, repair implementation, balance changes or publication was performed.

## dev.145 follow-up

Owner-approved companion guidance and actual-footprint checks resolve reproductions F1–F4. F5’s reproduction is unchanged, but the owner subsequently accepted the situational obstruction as Dreadmaw’s intentional withdrawal tactic; it is closed rather than awaiting repair. See [scope, limits and reassessment](HERO_GUIDED_SURVIVAL_DEV145.md) and [the 16 rerun observations](../tools/survival-audit-dev142-144/dev145.json). Original evidence above is historical and unchanged.
