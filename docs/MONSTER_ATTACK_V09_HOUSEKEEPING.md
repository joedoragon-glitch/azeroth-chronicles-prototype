# v0.9 monster-attack housekeeping: source registry and critical-skill triage

**Status:** proposed documentation/tooling workstream, not a completed gameplay certification.  
**Audit baseline:** `main` at `7e9751ab257e4e8e11e6dd62d7878cdac816b1ac`, 10 October 2026.  
**Change policy:** read-only inspection and documentation. No skill/balance/AI/graphics/save changes are authorized by this audit alone.

## v0.9 scope decision

v0.9 should repair **broken existing abilities**, not redesign the combat system. Four dispositions govern each finding:

1. **Release blocker:** A live skill fails to resolve, has a materially incorrect target/shape/status/timing, can break an encounter, or violates a critical promised gameplay behavior. Verify a reproducer, fix narrowly, and add a regression.
2. **Unambiguous repair:** A proven mistake with an unambiguous, non-authorial correction (including inaccurate technical wording). Fix without requiring a creative design decision; gameplay-altering fixes still get targeted verification.
3. **Authorial decision:** Two defensible design contracts conflict. Record current behavior, intended alternatives and player impact; do not silently select a new mechanic. Only block v0.9 if the inconsistency independently qualifies as a release blocker.
4. **Deferred polish/expansion:** Optional new statuses, thematic refinement, richer VFX/audio, additional TRUE-exclusive attacks and encounter expansion. Retain a future work item; do not let this become a v0.9 gate.

A green test suite means tested conditions worked, not that each name, lore description, animation, telegraph and outcome have been independently certified.

## Authoritative, generated read-only registry

Run from repository root:

```sh
node scripts/monster-attack-audit.cjs --json > /tmp/monster-attacks.json
node scripts/monster-attack-audit.cjs --markdown > /tmp/monster-attacks.md
node scripts/monster-attack-audit.cjs --summary
```

The new generator reads **existing live sources** and imports `scripts/enemy-vfx-inventory.cjs`; it does not duplicate attack rule tables or create playable moves. Every row retains its stable presentation ID, actor/role, displayed name, mechanic/source data where available, attack kind, proposed rendering stages, and an explicit *unreviewed* status. Normal/TRUE share a stable boss attack ID; their differences must be exercised at runtime, not inferred from a duplicate catalog.

The established VFX source contains **251 visual identities**, distributed as 46 authored boss attacks, 16 captain attacks, five captain phases, two night skills, 18 projectile identities, 84 rogue basics, 40 rogue signatures, 28 basic melee identities and 12 ringleader frenzy identities. These are **not 251 distinct damage mechanics or 251 pass results**. The generated registry additionally includes the three trap kinds (`spikes`, `jet`, `seal`) and configured boss recovery actions as separate non-attack groups; passive siphon and status sources remain referenced rather than being mislabeled new attack skills.

Source ownership:

| Contract | Authoritative owner |
| --- | --- |
| Boss descriptions and display ordering | `src/prototype/data.js` |
| Boss plans, captain plans, night/ranged profiles, rogue moves/signatures, trap tunings, recovery | `src/prototype/rules.js` |
| Boss attack selection and damage geometry | `src/prototype/boss-combat.js` |
| Rogue activation, status/displacement and trap actual hits | `src/prototype/engine.js` |
| Projectiles, periodic hazards, siphons and hit resolution | `src/prototype/combat.js` |
| Warning and danger shapes | `src/prototype/combat-visuals.js` |
| Procedural effect recipes and optional per-stage replacements | `src/prototype/enemy-vfx-art.js`, `assets/vfx/manifest.json` |
| Stable visual identities and existing catalog | `src/prototype/enemy-vfx.js`, `scripts/enemy-vfx-inventory.cjs` |

For each skill, later playtest reviews should assess **execution, written intent, character/species identity, hitbox-versus-telegraph fidelity, presentation fidelity, and encounter/reset integrity** independently. Mark neither passed nor broken based on the registry row alone. Compare rendering at windup, release, travel, actual hit/ground impact, lingering hazard and phase/summon as applicable; include line of sight, protected terrain, missed attacks, immunity, killed party members, saves/returns, normal/TRUE, and rogue variants.

The eventual developer workbench may consume this JSON to filter/search, preview the actual Canvas effect alongside its authoritative hitbox, and record review decisions. **The workbench is future tooling, not a v0.9 release blocker and is not implemented by this housekeeping pass.** Keep gameplay geometry in the simulation.

## Reassessment queue — evidence and needed action

**No widespread or newly proven live skill failure is established by this source pass.** Existing regression suites and the successful exact-main CI run `38024584015` provide substantial prior mechanical coverage. The following are **code-supported discrepancies or review leads**, not a completed browser-test failure list.

| ID | Skill/system | Source observation | Triage / next evidence |
| --- | --- | --- | --- |
| MA-01 | Thornfang Pounce | `data.js` promises a missed-pounce opening of 1.5 s; `rules.attacks.thorn[1]` defines `landing` and `recovery`, but no explicit `opening`. The motion resolver only grants `e.open` when `opening` is present. Boss recovery is globally multiplied by 0.25. | **Potential release blocker / authorial fork.** Reproduce hit/miss; determine whether the promised punish window is intended to be true vulnerability (`open`) or recovery-only. Do not guess a gameplay change. |
| MA-02 | Stone Colossus Wall Rush | Description makes a three-second core opening conditional on striking a marked pillar. `rules.attacks.mine[3]` grants `opening: 3`; `advanceMotion()` applies it when motion stops, without a pillar-impact condition. | **Potential release blocker / authorial fork.** Test impact with/without pillar and whether the collision condition is essential; repair code or wording after settling intended gameplay. |
| MA-03 | Persistent elemental effects | `combat-visuals.js` maps any hazard with legacy `manaDrain` to spectral presentation before checking elemental family. Mana mode is dormant. This can make e.g. Ash Sentinel's Furnace Pulses and TRUE Abyss delayed flame patch look spectral while the mechanic is elemental. | **Presentation mismatch, normally unambiguous repair.** Verify actual on-screen samples. Make material styling reflect action/family independently of dormant MP; never change hitbox to match art. |
| MA-04 | Rogue ranged signatures | `Bone Archer Pinning Volley`, `Axe Thrower Crossfire` and `Crown Volley Screen` use marked-area `bind` resolution; `enemy-vfx-art.js` maps bind to a roots-like procedural recipe. No traveling volley is authored for these signatures. | **Semantic/presentation review**, not automatically broken: a projectile-themed area-denial slow may be intentional. Elevate only if misleading telegraph/danger or a nonfunctional effect is reproduced; otherwise defer better identity cues. |
| MA-05 | Slow application / immunity | On the baseline, some shared hit paths apply `slow` independently of a successful hit/immunity check. | **Owned by active [PR #210](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/210)**, which centralizes status guards and audits all trap contexts. Re-test after integration; do not independently rewrite its logic. |
| MA-06 | Dark Lord and TRUE Dark Lord | Both forms share four authored attack slots. TRUE adds combat pressure, warband and form modifications; no independent TRUE-exclusive rotation is required by the current source contract. | **Deferred authorial design**, unless a currently implemented TRUE move is mechanically broken. Inspect Crown Phase, backline marks, call caps, rogue Crown Grasp/Decree and transitions on both forms. |
| MA-07 | Dungeon/side/outdoor traps | `spikes`, `jet`, `seal` use separate trap mechanics, not enemy VFX identities. Baseline timing, conditions and readouts are under active revision. | **Rebaseline after #210**, which has explicitly authorized condition-first trap behavior, timings and shared regional profiles. Avoid treating unmerged proposal as published gameplay. |
| MA-08 | Boss recovery prose | Authored recovery strings may suggest full post-cast downtime while `bossCadence.specialRecoveryMultiplier` is 0.25. | **Documentation/behavior verification.** Check per-skill actual recovery and whether a safe punish window was explicitly promised. Do not blanket-retune proven cooldown balance. |

The existing `tests/prototype.test.cjs`, `tests/audit-regressions.test.cjs`, `tests/rogue-integration.test.cjs`, `tests/enemy-vfx-inventory.test.cjs`, `tests/enemy-vfx-quality.test.cjs`, `tests/dungeon-pressure.test.cjs`, and browser VFX/rogue suites already test major mechanical contracts. The generator's own regression should prove roster/source linkage and snapshot purity; it is **not** a replacement for runtime behavior tests or subjective animation/identity review.

## Release gate and next maintenance order

1. Keep the generated roster exhaustive and uniquely keyed; never allow undocumented new attacks or force a review status to PASS by counting entries.
2. Reconcile active combat-conditions PR #210 before retesting its status and trap changes. Preserve that branch and its authored choices; do not silently merge or revert it.
3. Obtain deterministic reproducers for MA-01 and MA-02, inspect MA-03 in real Canvas/browser rendering, then classify each as critical defect, unambiguous fix, or an authorial choice.
4. Repair **only confirmed release-blocking defects** and unambiguous existing-contract errors, with targeted before/after regression and full release gates. Defer optional new status effects, special attacks and full VFX work.
5. Run the full stable campaign/desktop/phone/WebKit/TRUE/rogue/save/PWA checks and representative human playtesting before declaring v0.9 ready. Automated evidence does not certify physical-device play comfort.

This workstream is **housekeeping**: it creates an inspectable foundation, a decision queue, and a strict threshold for when additional creative attention is actually needed. No authorial decision is required merely to preserve this audit.
