# Hero-guided critical companion movement — dev.145

Hero guidance applies only at **20% HP or below**, including pets. Above 20%, existing combat and situational regrouping remain in control: hero dodges do not cancel healthy companions’ prepared attacks or make them constantly relocate. There is no replacement recovery percentage.

Critically wounded companions first seek nearby protection. While the hero moves, nearby companions copy his movement direction; distant companions catch up. This overrides critical attack holds and clears their charge. When the hero stops, they immediately stop copying, check their own actual warning/hazard footprint and make a bounded local escape if still exposed. A clear, protected companion can contribute using its existing safe attacks and skills. Being inside an enemy’s possible attack range alone does not force long flight.

The existing party/judgment owner implements transient per-campaign hero-motion observations, protected contributions and bounded destination/route scoring. Physical hostile/terrain collision and existing friendly retreat passage remain. Stationary holding receives no movement-only retreat defense. Cooldowns, healing, 20% entry, above-20% situational rejoining, paid work/cargo and save schema are retained. No new learned skills, teleport, damage modifier or persistent survival state.

Actual footprint inventory: native area patches/dual lines/cones, warned motion and aim lanes, incoming projectiles, generic persistent circles/expanding rings, all returned trap sites, Dreadmaw vapor/closure, Cinder cordon, Citadel board cells and Ashen cloud. Gaps and wave interiors remain distinct from filled damage circles; lookahead covers preparation and imminent moving hazards. Checks observe current mechanics rather than guarantee safety from every future action. Moving hero guidance has priority; physical collision remains authoritative.

## Verification

- 68 new hero-guidance scenarios pass, including exact 20%/21% boundary pairs across all three hero classes, Soldier, Archer and melee/ranged pets; forward dodges with a companion ahead; stopping immediately; hostile/terrain collision; warning escape and safe contributions.
- Existing 62 critical-survival, 72 contribution and 108 friendly-passage scenarios pass, along with existing judgment and Recall checks. Historical tests that required fleeing beyond possible enemy reach now assert the owner-approved nearby protection policy; native actual-warning, no-chase, timing and work/save checks remain.
- Real phone startup, hero-guided dodge, native warning escape after stopping, nearby survival and transient save state pass without JavaScript exceptions.
- Build/generated syntax, changed-source formatting and whitespace checks pass. No broad GitHub CI or full-game/device matrix.

## Original audit reassessment

The original 16 probes rerun against dev.145 are saved in [dev145.json](../tools/survival-audit-dev142-144/dev145.json). Historical audit evidence remains unchanged.

| Finding                                                  | Reassessment                                                                                                                                                                                          |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1: critical actors advance into long-range threats      | Resolved reproduction: all 12 stationary long-reach cases enter precautionary behavior without offensive advance. Following a moving hero into engagement is allowed by the approved guidance policy. |
| F2: outdoor trap omitted                                 | Resolved reproduction: native outdoor spikes reject holding/fire and trigger escape. A unit already inside an active hit can still take damage during escape.                                         |
| F3: specialist lingering hazards omitted                 | Resolved reproduction: native Dreadmaw vapor rejects holding, the companion escapes and survives, then can contribute after clearing it.                                                              |
| F4: cleared expanding-ring interior rejected             | Resolved reproduction: the cleared interior permits safe contribution; health remains unchanged.                                                                                                      |
| F5: moving Dreadmaw cast recenters its prevalidated ring | **Still open.** Native center shifts 60 units, changing two valid exits to one. Enemy cast placement is outside this companion patch.                                                                 |

The later enemy repair must also correct the dev.144 Dreadmaw fixture to set native `roomCaptain`, then validate native exit placement while withdrawing. The four inherited baseline suite failures documented in dev.144 remain separate historical issues; they were not rerun or represented as fixed here.

## Publication

Prepared for PR #381 and package-only publication. Restore the normal release workflow byte-for-byte and remove the temporary publisher after exact public build/file verification.
