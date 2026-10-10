# v0.9 monster-attack housekeeping — authoritative audit handoff

**Status:** source audit and review infrastructure proposed in [PR #212](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/212), **not** a claim that every skill has been individually certified.  
**Baseline:** main commit \`905e822da16b5a8ca7f959ee1f3e1a89f92b52d4\`, v0.8.136, 10 October 2026; includes merged combat-conditions [PR #210](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/210).  
**Ownership:** this is part of [v0.9 roadmap #192](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/192). The game remains the canonical multi-file Pages/PWA, retaining v4 saves and existing authored designs.

## Decision recorded: stabilize existing skills, do not expand combat

v0.9 is housekeeping and beta preparation. Repair **broken existing attacks** before release, but do not turn the audit into a monster redesign, new status-effect program, new TRUE-exclusive move catalogue, or full VFX replacement project. A future developer workbench is helpful but **not a release prerequisite**.

| Disposition | Standard | Release action |
| --- | --- | --- |
| **Release blocker** | Reproduced attack fails to fire/resolve, applies materially wrong damage, targeting, hit geometry or effects, irreversibly breaks an encounter, or violates an essential promised gameplay contract | Fix narrowly and add failing-before/passing-after regression before v0.9 |
| **Unambiguous repair** | Reproduced implementation, documentation or presentation error with only one defensible correction and no new creative policy | Correct in the owning module and verify; no authorial meeting required |
| **Authorial decision** | Name/design and mechanics imply different but defensible player experiences; either choice materially changes the intended gameplay | Record alternatives and consequences. Only release-blocking if a functional defect is independently established |
| **Deferred polish / expansion** | More attractive VFX, stronger species identity, optional statuses, extra boss moves, additional TRUE-form complexity, noncritical thematic refinements | Document for later; do not hold v0.9 |

**Evidence labels matter:** *source-verified* means a code path was inspected; *regression-covered* means an existing automated scenario exercises specified behavior; *browser-verified* means actual rendered gameplay was inspected; *human acceptance pending* means no authorial/artistic signoff exists. None of these alone proves all other labels. Do not silently label 251 entries “pass” because the coverage test passes.

## First deliverable: generated, read-only source registry

\`scripts/monster-attack-audit.cjs\` generates an export directly from the production \`Campaign\` data/rules and the existing \`scripts/enemy-vfx-inventory.cjs\`; it does **not** duplicate, alter, enable, or tune attacks. Use:

\`\`\`sh
node scripts/monster-attack-audit.cjs --summary
node scripts/monster-attack-audit.cjs --json > /tmp/monster-attacks.json
node scripts/monster-attack-audit.cjs --markdown > /tmp/monster-attacks.md
node tests/monster-attack-audit.test.cjs
\`\`\`

The existing register counts **251 presentation identities**, not 251 separate combat algorithms or 251 successful reviews:

| Scope | IDs |
| --- | ---: |
| 11 boss families' authored moves (normal/TRUE share stable ID; 92 form resolutions) | 46 |
| Five captain movesets | 16 |
| Five captain phase presentations | 5 |
| Night-exclusive Wraith and Stalker skills | 2 |
| Native/forced ranged projectile identities | 18 |
| Ordinary, guardian, ringleader, boss and captain rogue basic identities | 84 |
| Role/species-specific ringleader, captain and boss rogue signatures | 40 |
| Boss/captain/species basic melee identities | 28 |
| Species ringleader Frenzy presentation | 12 |
| **Total existing VFX identities** | **251** |

Three environmental trap kinds (\`spikes\`, \`jet\`, \`seal\`) and the two configured non-attack boss recovery actions (\`Ember Renewal\`, \`Ash Reforge\`) are **separately** indexed: 256 records in all at this baseline, pending actual generator verification. Passive HP siphon, damage compression, protection, enemy summons, special combos, and status applications are **cross-cutting mechanics**, not extra invented moves; a visual ID may be reused across multiple form/role scenarios.

Registry row contract: stable ID, source group, actor/role/name, gameplay plan/configuration, source path, written boss description when present, form/role distinctions, existing presentation identity/material/action when obtainable, prospective windup/release/travel/impact/linger/spawn/phase stages and **explicitly unreviewed** mechanics/description/species/visual/lifecycle fields. **An absent description for an ordinary species basic is not automatically a defect.** Do not silently synthesize lore, gameplay promises or asset requirements.

The existing visual bridge is observation-only. The canonical telegraph, hitbox, damage and duration remain owned by the combat engine, not generated VFX metadata.

### Source ownership

| Subject | Owning source |
| --- | --- |
| Boss names, order and written attack descriptions | \`src/prototype/data.js\` |
| Boss plans, captains, ranged/night, rogue, recovery, geometry and trap tunings | \`src/prototype/rules.js\` |
| Boss sequences, target selection, summons, charges, openings, special resolution | \`src/prototype/boss-combat.js\` |
| Enemy decisions, tactical signatures, encounter lifecycle, environmental traps | \`src/prototype/engine.js\` |
| Shared HP/status mitigation, siphons, projectiles and periodic hazards | \`src/prototype/combat.js\` |
| Actual danger indicators/trap shapes | \`src/prototype/combat-visuals.js\` |
| Procedural VFX recipe, material and action vocabulary | \`src/prototype/enemy-vfx-art.js\` |
| Stable IDs, observer stages, legacy VFX roster | \`src/prototype/enemy-vfx.js\`, \`src/prototype/enemy-vfx-events.js\`, \`scripts/enemy-vfx-inventory.cjs\` |
| Evidence and prior regression methods | \`docs/ENEMY_SKILL_VFX_AUDIT.md\`, \`docs/ENEMY_SKILL_VFX_QUALITY_AUDIT.md\`, \`docs/ROGUE_PR146_INTEGRATION_AUDIT.md\`, \`docs/COMBAT_CONDITIONS_V09.md\` |

## What must be accounted for

### Boss normal/TRUE authored repertoire

All names below come from \`data.js\`. Geometry and actual timing come from \`rules.js\` and the resolver; the prose is **not** used to calculate hits.

| Family | Existing authored attacks |
| --- | --- |
| Thornfang | Bite; Pounce; Root Line; Den Howl |
| Crypt Guardian | Bone Sweep; Bone Volley; Grave Call; Draining Ground |
| Mirejaw | Jaw Snap; Mire Rush; Bog Spit; Brood Call |
| Drowned Keeper | Anchor Swing; Water Jets; Undertow; Echo Call |
| Ridge Tyrant | Hammer Blow; Boulder Throw; Ridge Charge; War Cry |
| Stone Colossus | Stone Slam; Rockfall; Shockwave Rings; Wall Rush; Stonebound Call |
| Ashen Warlord | Cleaving Combo; Banner Bombardment; Guard Command; Pursuit Charge |
| Abyss Dragon | Flame Cone; Wing Shockwave; Shadow Flight; Hatchling Call |
| Ash Sentinel | Armor Slam; Ash Lanes; Sentinel Advance; Furnace Pulses; Ash Guard Muster |
| Cindermaw | Cinder Rend; Ash Rush; Furnace Spit; Brood Command |
| Dark Lord | Dark Cleave; Fortress Bombardment; Black Guard Call; Crown Phase |

TRUE forms reuse the authored slots but **must be executed separately in tests**: extra summons/automatic waves, form multipliers, independent actor targeting, extra family-specific patterns (such as staggered bone volley, shifting channels, delayed rockfall, delayed flame patch), altered openings, phase transitions and game-over/awakening recovery. Never infer normal/TRUE equivalence from identical names or visual IDs.

**Dark Lord priority:** specifically inspect both normal and TRUE Dark Cleave, sequential bombardment, Crown defenders, the half-HP Crown Phase and its safe sectors, TRUE warband/replenishment, backline geometry, HP siphon, and the **separate** tactical Crown Grasp / Crown Decree moves. Lack of a third exclusive TRUE rotation is not a defect unless such a move is already an authored promise.

### Other monster repertoires

Five captains have 16 authored attacks: Scornfang (Hookfang Rush, Briar Pot, Pocket Sand), Direjaw (Bog Skitter, Spatter Fan, Silt Slick), Crag Tyrant (Shoulder Rush, Scree Kick, Ridge Feint), Dreadmaw (Cinder Mark, Blackline Rush, Ember Veil, Brood Call) and Cinder Warlord (Inspection Cleave, Violation Marker, Compliance Charge). Each has a separate authored phase.

Both night specialists must be checked: Wraith **Soul Drain** and Stalker **Shadow Pounce**. Species/role variants include Goblin, Skeleton, Mireling, Reed Beast, Wolf, Ogre, Orc, Archer, Ash Beast, Crown Soldier, Wraith and Stalker; actual native/forced ranged projectiles, basic melee, guardian and ringleader roles and Frenzy are included.

**The rogue system is a distinct attack layer**, not a replacement for normal rotations. Preserve single-target basics, the 12 species × melee/ranged ringleader signatures, five captain signatures and 11 boss signatures; verify warning shape, hit consequences (Slow, shove, scatter, bind, reposition, rally), unique effect, attacker role, protection/retreat eligibility, terrain, target death and reset. Cyan warnings do not prove the effect was applied. Normal and TRUE share each boss's two rogue choices, but must be sampled in both form contexts.

**Environmental hazards are separate**. In merged v0.8.136, main dungeons, side dungeons and outdoor mini-sites share five regional timing/damage profiles: spikes cause short injury Slow; jets attempt collision-safe outward displacement; seals cause longer Slow. Each living hero/active companion has one **attempt** per trap activation, not unlimited damage while standing inside. Immunity prevents on-hit conditions. Hostile creatures do not receive player trap damage. The provisional tuning and historical difference are documented in \`docs/TRAP_ACTIVATION_CYCLE_V09_AUDIT.md\`. This is **already merged #210**, not unfinished scope to implement again.

### Mechanic and presentation acceptance matrix for every row

1. **Availability and triggering:** Eligible target, normal/TRUE/role, cooldown, phase, target-in-range, path/LOS, valid summon count; no ability silently abandoned while other legal moves exist.
2. **Damage and geometry:** Correct cone/circle/line/ring/sector/projectile/movement path; precise dodge versus yellow/cyan warning; obstruction and invulnerability respected; neither visual-only false damage nor unmarked damaging area.
3. **Secondary consequences:** Actual Slow, siphon, displacement, recovery, wound/phase opening, reinforcement and target-cover behavior; no status after immunity, fatal hit or zone transition. Dormant MP fields do not imply an active mana system.
4. **Identity and media:** Skill name, description, species/boss anatomy, timing, procedural recipe, material (fur/roots/water/stone/metal/ash/etc.), projectile, impact and audio agree. Existence of VFX art alone is not a thematic PASS.
5. **Lifecycle and performance:** Repeated casts, TRUE encounters, summoned units, overlap, reset/escape/return, kill/succession, historical saves, pause, offline PWA, desktop and phone warning readability.

## Source-supported findings awaiting focused disposition

These are **not 8 proven broken skills**. They are a combined shortlist of suspected contracts, previously merged fixes and visual review leads.

| ID | Category | Source observation | Next action and priority |
| --- | --- | --- | --- |
| **MA-01** | Potential contract defect / possible authorial fork | **Thornfang Pounce:** \`data.js\` describes a 1.5 s opening after a *miss*. \`rules.attacks.thorn[1]\` has \`landing\` and \`recovery\`, but no \`opening\`; \`advanceMotion()\` only grants exposed-core \`e.open\` when configured. General boss cooldown recovery uses a 0.25 multiplier. | **High.** Reproduce hit/miss and effective punish interval. If an actual promised vulnerable opening is absent, flag as blocker; do not assume which alternative mechanic was intended. |
| **MA-02** | Potential contract defect / possible authorial fork | **Stone Colossus Wall Rush:** prose conditions its 3 s exposed core on *striking a marked pillar*. The move sets \`opening: 3\`; \`advanceMotion()\` grants the opening on motion termination, not a verified pillar hit. | **High.** Reproduce with/without pillar, inspect collision and opening damage. Resolve code-versus-description only after intent is determined. |
| MA-03 | Visual material mismatch | **Ash Sentinel Furnace Pulses / elemental persistent hazards:** hazard coloring prioritizes a dormant legacy \`manaDrain\` field before the action's ember/stone family, potentially rendering elemental danger spectral. | **Medium.** Observe actual Canvas output. A narrowly scoped material-only correction is normally non-authorial; preserve exact gameplay hit geometry. |
| MA-04 | Semantic/VFX review lead | **Rogue ranged volleys/crossfire:** several role signatures execute warned area binds, not moving volleys. Generic bind recipe can suggest roots even where bows, axes or Crown gun-lines are named. | **Medium/low.** Check actual cue versus true area effect; only escalate if misleading/dangerous. Do not invent projectiles solely from the move name. |
| MA-05 | Completed baseline integration | **Slow/immunity:** older hit paths could apply conditions independently of a successful, nonimmune hit. | **Merged as v0.8.136 in #210.** Keep regression coverage and recheck within representative boss/trap encounters; do not reopen as a pending implementation. |
| MA-06 | Deferred authorial design | **Dark Lord normal/TRUE:** four common authored slots with extra TRUE combat pressure, not a wholly different exclusive rotation. | **Defer new skill design.** Fix only a specific currently implemented ability that fails its contract; the current design need not grow for v0.9. |
| MA-07 | Completed baseline integration; acceptance pending | **Traps:** status-first spikes/jet/seal, revised regional warnings, cycles, damage, parity across all three contexts. | **Merged as v0.8.136 in #210.** Verify displayed warning, safe path and actual device comfort in beta; further retuning needs data. |
| MA-08 | Description/timing review | **Boss recovery prose:** authored recovery values and actual post-special cooldowns differ because of the live boss cadence multiplier; an “opening” is separate from \`cd\`. | **Medium.** Inspect every move with a promised safe window, not a blanket cooldown retune. Existing quantitative cooldown audit did not authorize new balance changes. |

No additional definite skill malfunction was established by the source inspection summarized here. **This is an evidence boundary, not proof of zero other bugs.** New symptoms should link an exact skill ID, form, zone, RNG/test state, intended result, actual result and reproduction.

## Validation history and release gate

Prior work: \`docs/ROGUE_PR146_INTEGRATION_AUDIT.md\` reports 99 basic and 51 signature live-resolution scenarios; \`docs/ENEMY_SKILL_VFX_QUALITY_AUDIT.md\` documents 251 identity coverage, 297 catalog scenes per browser/viewport and actual basic contact checks. Boss range/geometry and 11-family normal/TRUE encounters are separately tested in \`tests/audit-regressions.test.cjs\`, \`tests/prototype.test.cjs\` and related suites. These are **historical evidence in those documents**, not newly rerun full human acceptance of the current PR.

The new generator and test must confirm deterministic, pure source extraction, complete group/role coverage, unique IDs and readable Markdown/JSON output. **Do not merge a failed or incomplete CI run.** After changes, require exact-head format/Node tests, the project's full desktop/phone Chromium + WebKit path, successful main release, exact published SHA and representative real-device play before claiming v0.9 readiness.

**Next work order:** (1) preserve and merge read-only registry/docs once CI is green; (2) produce focused isolated reproducers for MA-01/02 and correct only proven gameplay defects; (3) verify MA-03 visually and check same material rules for comparable hazards; (4) re-evaluate the already merged condition/trap contracts; (5) defer optional media and TRUE redesign for authorial review after the weekend. Future workbench can load this read-only data and replay actual visual effects and hit geometry without mutating simulation.

No new authorial decision is required to finish documentation or source inventory. Any disputed design is explicitly parked, with alternatives and evidence requirements, instead of being silently decided.
