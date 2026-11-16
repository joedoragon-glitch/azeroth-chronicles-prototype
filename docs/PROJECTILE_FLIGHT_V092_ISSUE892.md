# v0.9.2 Projectile-flight reconciliation — issue #892

Status: isolated engineering candidate; **not a published or player-accepted balancing release**. Owner-approved principle: physical projectile **weapon/ability identity** sets its authored baseline; global controls begin at a neutral 1.0 and never substitute for bad individual velocities.

## Historical cause and reconciled choices

- [v0.7.6 PR #9](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/9) made enemy bolts and boss volleys 15% faster, scaling lifetime down without increasing range. It was a presentation/feel improvement, not weapon-specific ballistic design.
- [v0.8.14 main commit ae4dbae](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/ae4dbae58744) made ordinary hostile bolts 1.7× faster, also reduced aim from 0.55 to 0.35 s and cooldown from 1.8 to 1.15 s. The latter two timing decisions remain; 1.7× did not represent weapon identity.
- [PR #733](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/733) later doubled Goblin Slinger stones without extending reach and aligned Charmed native ranged flight. Effective Goblin stone **816 world units/s** remains the new authored starting point, not a stacked special speed multiplier.
- Fortified fire retains its contextual 1.3× and actual aim footprint. This is not a general tuning control.
- [PR #479](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/479) Mage normal Skill 1 guided beam 492.8 and bounded travel remain approved and unchanged.
- [PR #464](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/464) Ranger shafts remain physical, staggered, directional, sweep-colliding and missable; no return to legacy guaranteed hits.

## Authored velocity register (world units/s, neutral tuning)

| Producer | Projectile identity | Before | Candidate |
|---|---|---:|---:|
| Goblin ordinary / Charmed | slung stone | 816 | 816 |
| Skeleton ordinary / Charmed | arrow | 476 | 850 |
| Reedbeast ordinary / Charmed | spit | 374 | 650 |
| Mireling ordinary / Charmed | spit | 391 | 660 |
| Ogre ordinary / Charmed | hand-thrown stone | 374 | 600 |
| Orc ordinary / Charmed | hand-thrown axe | 425 | 630 |
| Ashbeast ordinary / Charmed | hot cinder | 408 | 680 |
| Archer/Crownguard ordinary / Charmed | arrows | 442 | 850 |
| Wraith ordinary / Charmed | spectral ranged bolt | 442 | 700 |
| Lifebinder | Bone Volley | 299 | 720 |
| Ridge Tyrant | Rolling Cargo | 260 | 700 |
| Citadel boss | nine canister fragments | 490 | 650 |
| Vale captain | Cradle-to-Grave tracking volley | 400 | 600 |
| Other boss physical volleys | three aimed bolts | 299 | 700 |
| Ranger hero | basic arrows | 550 | 850 |
| Ranger hero | Rapid Arrows | 620 | 900 |
| Ranger hero | charged/ultimate arrows | 620–650 | 920 |
| Normal companion Archer | basic bow | 450 | 850 |
| Companion Archer | Triple Shot / Piercing Volley | 520 / 650 | 900 / 920 |
| Ranged boss pets | magical basic / targeted skill | 450 / 550 | 600–700 / 650–750 by family |
| Mage hero | auto / ordinary homing Skill 1 | 550 / 492.8 | unchanged |
| Paladin / magical skills | authored effects | distinct | unchanged unless explicitly listed |

These are **game-balance candidates**, not literal physics. Medieval arrows and slingstones have overlapping historical speed distributions. Relative movement should be intuitively legible in a 2D RPG, with special warning/collision mechanics determining fair dodging. Do not conflate instant lines, telegraphed AoEs, traveling waves or charging enemies with physical projectile colliders.

## Control and range contracts

`R.projectileFlight.globalSpeedScale = 1.0`: all real moving hostile/hero/ally bolts.

`R.projectileFlight.hostileSpeedScale = 1.0`: additional scalar only for hostile moving bolts (including boss and captain); does **not** change AI, launch delays, aiming, cooldown, warning, actual maximum distance, hitbox dimensions or damage.

The physical collision loop scales both displacement and remaining flight lifetime by the same factor. Original maximum missed-shot distances are recorded independently of speed, including original ordinary species defaults, Charmed species, cargo 520, Bone Volley 780, and Citadel canister warning radius. Existing fortified arc adjustment remains contextual and independent. Critical damage and save structure remain untouched.

Both old general multipliers, the old Goblin ad hoc 2×, and the old `R.enemyProjectileMultiplier` speed workaround are retired. Source configs now encode final baseline velocities. Long-standing hit/miss/tile/collision and VFX release/impact paths remain the same; new speed affects the time at which contact occurs.

**v4 compatibility:** old enemies or Charmed individuals may still have prior `shotSpeed` fields embedded in a stored snapshot, particularly if forced roles, recovery or old companions were created before this candidate. These persisted fields are not destructively rewritten. New native releases derive effective velocity from the current species/weapon rule, while original independent distance budgets protect max travel. Previously launched missiles retain their saved speed unless and until they expire.

## Source and validation targets

Affected source: `rules.js`, `engine.js`, `boss-combat.js`, `hero-combat.js`, `progression.js`, `party.js`, `party-pets.js`, `combat.js`. No renderer/audio/persistence schema edits.

Relevant automated and browser work: `tests/projectile-flight-coherence.test.cjs`, `combat-feedback`, `fortifications`, `rogue-bard-phase4-companions`, `projectile-order`, `friendly-projectile-dodging`, `mage-skill1-beam-flight`, `pt312-combat-integration`, `critical-ranger-volley-physical-native`, `enemy-vfx-quality`, `audit-regressions` plus focused CI and built checks. Revalidate native hit/miss after real shots, 16.7/33/100ms ticks, terrain/fort cover, summons/TRUE, save roundtrips and concurrent ranged company.

**Acceptance still separate:** source review and green CI do not mean player-playable timing, Canvas/Pixi sprite legibility, physical-device acceptance, end-to-end campaign playthrough or published-build verification. Also note merging into `main` triggers GitHub Pages deployment under current `focused-deploy.yml`, so independent merge/deploy authorization boundaries must be respected even if PR checks pass.
