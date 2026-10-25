# Hero Skill 1 redesign — companion dependency audit

**24 October 2026 · Read-only code trace of `main` `e4e8234`.** This is a supporting analysis for [the three-action Skill 1 contract](HERO_SKILL1_SELF_TAUGHT_COMBAT_DESIGN_20261024.md); **no companion or hero gameplay source has changed**.

## Conclusion

**No direct mechanical dependency was found between the hero's Skill 1 rank or slot-1 cooldown and Soldier/Archer/pet ordinary attack cadence or their first-special cooldowns.** In particular, the similarly named **`u.skill1Cd`** belongs to each companion's **first special**, **not** to `hero.skills[0]` or the hero's Skill 1 timer. The confirmed companion special-unlock dependency is instead **the hero learning Skill 2** (`hero.skills[1]`) or the persisted `companionCombatTraining` flag. This separation must survive the hero redesign.

This is an audit of current direct code references, **not a claim that changing hero combat cannot affect party results indirectly**: opening/engagement, automatic targeting, inherited damage, projectiles, animation events, Slow/recovery and Ranger Rally can alter outcomes. Those dependencies are explicit below.

## Mechanical ownership table

| Unit/action | Current source owner / timer | Relation to hero Skill 1 | Safeguard |
| --- | --- | --- | --- |
| Hero basic autoattack | `hero-combat.js:castMovementBasic → cast(1, ..., automatic=true)`, `hero.cd[0]` today | **Currently tightly coupled** to normal Skill 1. | Break this **hero-only** coupling while retaining automatic eligibility and 3-hit combo. |
| Soldier ordinary sword attack | `party.js:companionCoverAttack`, `u.cd`, damage via `companionAttackDamage(u)` | **No hero Skill 1 rank/cd gate**. | Retain own cadence, reach/LOS, damage and encounter permissions. |
| Archer ordinary arrow | `party.js:companionCoverAttack`, `u.cd`, own arrow projectiles | **No hero Skill 1 rank/cd gate**. | Retain own cadence/projectile motion/dodge and damage. |
| Boss pet ordinary/basic or defensive counter | `party.js:companionCoverAttack` or `petDefensiveCounter`, `u.cd`, pet tuning in `rules.js` | **No hero Skill 1 rank/cd gate**. | Retain pet family/role ranges, recovery and special defensive behavior. |
| Soldier first special, **Power Strike** | `party.js:companionUseFirstSkill`, `u.skill1Cd` = shared first-skill 8s, `u.skillGlobalCd` | **Not hero Skill 1**. Available independent of hero Skill 1 manipulation. | Keep first special and its veteran effects. |
| Archer first special, **Triple Shot** | `party.js:companionUseFirstSkill`, `u.skill1Cd` = 8s, `u.skillGlobalCd` | **Not hero Skill 1**. | Keep 3 projectiles, impact/VFX and veteran effects. |
| Pet first automatic special (per boss family) | `party-pets.js:usePetSkill(u, target,1)`, `u.skill1Cd` = `petFirstCooldown` (8s), `skillGlobalCd` | **Not hero Skill 1**. | Keep all eleven families, pet effects and personal timers. |
| Soldier second special, **Holy Cleave** | `companionSecondSkillUnlocked()`; `u.skill2Cd` (12s) | **Hero Skill 2** or `companionCombatTraining`, **not Skill 1**. | Keep old and imported roster unlock. |
| Archer second special, **Piercing Volley** | Same second-skill gate, `u.skill2Cd` (12s) | **Hero Skill 2**, not Skill 1. | Retain line geometry and unlock. |
| Pet charged second special (per family) | `party-pets.js:usePetSkill(...,2)`, `companionSecondSkillUnlocked()`, `u.skill2Cd` = `petSecondCooldown` (12s) | **Hero Skill 2**, not Skill 1. | Preserve charge prep/interrupt and current family-specific effects. |
| Shared cooldown recovery | `party.js` applies `cooldownRecoveryElapsed(u,dt)` to `u.cd`, `u.skill1Cd`, `u.skill2Cd`, `u.skillGlobalCd`. | Companions recover independently; share environmental status *rules*, not hero slot timer. | New hero-only basic timer cannot repurpose any `u.*Cd` or disturb Slow/debt accounting. |
| Ranger Skill 4 companion Rally | `party.js:companionRallyAttackSpeed`; applies to companion ordinary speed | Unrelated to hero Skill 1; **hero Skill 4 charged**, not Skill 1. | Preserve Rally's own uptime, selected recipients and personal basic cadence. |
| Inherited companion attack bonus | `party.js:companionAttackDamage` draws from `u.damage + hero.level*2 + companionInheritedDamageBonus()`; `progression.js` computes bonuses from hero stats/equipment/training. | Inherits **hero stats**, not hero Skill 1's attack cooldown/rank. | Do not change Power or inherited-stat formulas when splitting hero attack. |
| Restore/migration | `save.js` validates companion `skill1Cd/skill2Cd` and repairs `companionCombatTraining` when `hero.skills[1] > 0`. | Existing saved companion timers and second-skill training are independent of `hero.skills[0]`. | Do not rename or erase companion `skill1Cd`; do not infer Skill 2 from hero Skill 1. |

## Important indirect cross-system constraints

1. **First-hostile / encounter admission.** `combat.js` distinguishes `automaticBasic` from a deliberate hero attack: automatic basics cannot open certain protected combat encounters, and companion hits may trigger a prescribed withdraw/reset rather than opening it. Separating basic from hero `cast(1)` must preserve the `automaticBasic` attribution for melee, projectiles, and combo splash; do not let companion hits bypass the hero-first requirement.
2. **Squad engagement, retreat and Recall.** Present hero automatic attacks must not use the same deliberate-combat semantics that release Recall or override navigation. Companions react to real aggro and orders; newly passive stationary basics could change engagement frequency. No accidental companion AI/movement rewriting.
3. **Timing and combined damage.** Even if each companion's numbers remain exactly unchanged, the hero can now autoattack at the same time as a promoted normal Skill 1. This can shorten fights and change who gets targeted/when companions act, including in TRUE boss phases. Test at least 0, 1, 3 and 6 active companions with representative pets.
4. **Debuffs and recovery.** `cooldownRecoveryElapsed` applies Slow-based cooldown recovery separately per unit. New hero basic/slot-1 cooldown independence must not change companion slowdown, Rally, healing support or Silence rules. Auto basics and charged skill preparation remain different event kinds.
5. **Targeting and projectile callbacks.** Hero basic combo uses `combo`, `automaticBasic` and finisher fields that flow into hit resolution, renderer and sound; the promoted normal class technique uses formerly charged projectile forms. Unit-specific companion shots and companion special effects need their own authorship and sound identities retained.
6. **Veteran skills and charge queue.** Companions have their own 1.5s special lockout; any hero input queue/charge changes must not route through companions' `skillGlobalCd` or mistaken `skill1Cd`.
7. **Save schema.** Keep existing companion roster, cooldown values, combat-training flag, Expedition training and v4 import/restore behavior intact. Any new hero-specific automatic cooldown migration should not touch companion data.

## Focused companion regression plan for implementation stage

- [ ] Hero Skill 1 Rank 1 versus Rank 8: Soldier/Archer/pet **ordinary attack** interval and first special stay unchanged at equivalent hero stats (isolated skill rank only).
- [ ] Hero **normal `cd[0]`**, **charged-only `chargedCd[0]`** and separate basic timer independently busy/ready: existing Soldiers/Archers/pets continue attacking/casting their own specials without inheriting hero cooldowns.
- [ ] Hero Skill 2 still locked/unlocked: each companion's second-special eligibility behaves exactly as before; v4 imports repair stale `companionCombatTraining` without resetting `u.skill2Cd`.
- [ ] Soldier melee + Power Strike and Archer arrows + Triple Shot retain 8s first and 12s second separate timers, own shared special lockout and automatic AI priority.
- [ ] Each of the eleven pet families retains ordinary attacks, family first skill, learned/charged second skill, contact requirement, family VFX, healing and debuff effects.
- [ ] Slow/stack debt, Mage Silence, Paladin stance, Ranger Rally, Recall, veteran enhancement, wounded/retreating companions and protected Vale/Thornfang opening are regression-tested.
- [ ] Save/reload with `hero.cd[0]>0`, `hero.chargedCd[0]>0`, `u.cd>0`, `u.skill1Cd>0`, `u.skill2Cd>0`: hero Tap can recover independently while charged is still cooling; companion states persist without unintended resets.
- [ ] Hero + 0/1/3/6 companions against solo and multiple hostiles in normal/TRUE contexts: measure **total party output**, not just per-companion attack numbers.
- [ ] English/Spanish companion and Keeper wording makes clear **hero Skill 1** is not **companion first skill** and that Hero Skill 2 governs advanced companion skills.

## Audit paths

- [`party.js`](../src/prototype/party.js): `companionCoverAttack`, `companionAttackDamage`, `companionSecondSkillUnlocked`, `companionUseFirstSkill`, `companionTrySkill`, per-tick `u.cd`/`u.skill1Cd`/`u.skill2Cd`.
- [`party-pets.js`](../src/prototype/party-pets.js): `petSkillDefinition`, `usePetSkill`, `petFirstCooldown`, `petSecondCooldown`.
- [`rules.js`](../src/prototype/rules.js): companion first and second skill tuning; all pet family definitions; cooldown recovery and combo definition.
- [`progression.js`](../src/prototype/progression.js): inherited companion stat bonuses, hero Skill 2 unlock on learning.
- [`save.js`](../src/prototype/save.js): companion cooldown persistence, hero Skill 1 initial-rank validation and Hero Skill 2 unlock repair.
- [`combat.js`](../src/prototype/combat.js): `automaticBasic` and protected encounter entry.
