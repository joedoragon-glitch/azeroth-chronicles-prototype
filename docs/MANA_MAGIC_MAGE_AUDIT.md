# Mana, magic, and Mage-class audit — 9 October 2026

## Scope and authority

Source-review audit of the current multi-file PWA Campaign engine (main as of 2026-10-09), not the historical `src/game.js` / `legacy.html` prototype. Review covers Paladin, Mage and Ranger MP pools, skill costs and failure paths, passive recovery, Ranger companion support, environmental restoration, enemy MP drains, save migration, and playable Mage skills. Source inspection is distinct from a human/browser combat playtest; report test results only after CI completes. This pass preserves existing difficulty, class balance, enemy timing, boss health, and the decision to retire combat potions.

Primary implementation owners:
- `src/prototype/hero-combat.js`: `skillManaCost`, `cast`, Mage attack/slow/charged branches.
- `src/prototype/progression.js`: +5 MP per level, mana talent scaling, `manaCombatActive`, legacy normalization.
- `src/prototype/engine.js`: passive tick regen, refuge, one-use fountains, retired `buyPotion`, death/succession, passive combat context.
- `src/prototype/party.js`: Ranger Heal / Mana Recovery, 5-second effects, automatic triggering, per-Ranger cooldowns.
- `src/prototype/combat.js`: bounded MP drain on authored magical hits only.
- `src/prototype/save.js`: MP bounds, mana-balance migrations, support-effect validation/persistence.
- `src/prototype/app.js`, `menus.js`: MP HUD, charge readiness, Ranger support controls and training.

## Verified source contract

| Mechanic | Paladin | Mage | Ranger |
| --- | ---: | ---: | ---: |
| Starting max MP | 60 | 100 | 70 |
| MP/level | +5 | +5 | +5 |
| Normal Skill 1 | Free | Free | Free |
| Normal Skills 2–8 base MP | 15 / 10 / 25 / 40 / 20 / 45 / 60 | Same | Same |
| Further skill-rank cost | +8% of base per rank above 1, rounded up | Same | Same |
| Charged Skill 1 / 2 / 3 MP | 20% / 30% / 35% maximum MP, rounded up | Same | Same |
| Base combat / noncombat regen | 1 / 2.5 MP/s | Same | Same |
| Per Mana Training rank, combat / noncombat | +0.25 / +0.5 MP/s | +0.375 / +0.75 MP/s | +0.25 / +0.5 MP/s |

The `manaBalance.regen.talentCombat` and `talentOutOfCombat` values are declared in rules but **are not the values directly read by** `manaRegenRate()`; actual scaling is computed from class-specific Mana Training profiles. Do not blindly “fix” those numbers and change Mage progression. Make the source-of-truth relationship explicit in a separate, balance-preserving cleanup if desired.

Skill 1 normal is a free basic attack, not an infinite-cost spell. Charged Skill 1 costs mana. Skills 1–3 support charge input; other skill slots do not. The shared caster refuses casts for cooldown, locked rank, unavailable target where required, unwounded Skill 3 recipient, or insufficient MP **before** deducting mana or starting cooldown. This audit adds full three-class slot/charge edge tests.

Class identity:
- **Paladin**: melee skill delivery, holy effects, defensive immunity, self-heal and charged party heal.
- **Mage**: magic projectiles/basic combo, frost slow on designated skills, frost-burst charged second, arcane AoE specials, defensive immunity, self-heal/charged party heal. Its 90 HP and 3 base armor are the lowest starting values.
- **Ranger hero**: arrow-based attacks, haste/mobility and same shared healing slots. **Ranger companions** (type `archer`) are the source of field Mana Recovery, regardless of player class.

Regeneration is bounded by maximum MP. Authored hostile aggro within 700 world units selects the lower combat rate. Ranger Mana Recovery is hero-only: Rank 1 restores 40 MP over five seconds; Rank 2 restores 100, trained through Neri. Each active living Ranger has an independent 10-second mana-support cooldown; automatic usage triggers at 35% MP or below during combat and tops up outside combat. Existing support effects should not stack on the same hero. Companions have no MP resource.

Restoration objects/services:
- Rest point / refuge: full hero MP and living-party HP, one shared 90-second rest cooldown, blocked by active nearby threats.
- Preparation fountain: once per zone, requires cleared guards/engagement; restores 60% max MP and HP (bounded by maximum); use persists in saves.
- Field consumables: legacy health/mana combat potions are **retired by design**, not missing or intended for reintroduction. The archive alchemist sells a Preparation Tonic that increases health, not mana.

Enemy mana drain comes from authored boss/night/ranged magic attacks; `drainMana` rounds maxMP fractions, caps at current MP, and prevents negative MP. Ordinary physical damage has no MP drain.

## Findings and changes in this branch

1. **Low-severity data integrity edge — fixed.** Save validation permits a Ranger recovery effect with zero remaining duration. Before this change, `updateRangerSupport` would compute `0/0` when such an effect retained positive `remaining`, turning hero MP into `NaN`. The runtime now discards expired/empty effects safely. New regression exercises save restore and ticking.
2. **Low-severity HUD state mismatch — fixed.** The manual Mana Regen button previously appeared ready even while a mana-support effect was already restoring the hero, although the engine correctly rejected a second activation. The control now disables during the effect and reports “Restoring”.
3. **Review item, no balance change.** The rules object advertises separate universal per-talent regen constants, but runtime reads class profiles instead. Existing Paladin/Mage/Ranger Mana Training scaling and tests are authoritative for this pass.
4. **Design communication, no change.** The Mage character-selection blurb says “mana recovery and barriers”; in combat, passive regeneration and Ranger companion support restore MP. Mage Skill 3 is Self-Heal (HP), not a Mage-exclusive mana refill. Revise wording only after class tooltip audit, not by inventing an unapproved resource skill.
5. **Balance unknown, do not retune from static inspection.** Mage's 100-MP starting pool and frost/ranged toolkit are implemented. Effectiveness across early, mid, late, boss and TRUE fights requires repeatable full-encounter trials (several RNG seeds, independent player-input profiles, boss summons, party doctrine, mana-starvation metrics). The separate `DEFERRED_ENCOUNTER_TIME_AUDIT.md` explicitly warns that older short boss timing trials mix doctrine behaviors and pre-reassignment compression. This branch does not reinterpret them as current Mage balance results.

## Added regression coverage

`tests/mana-magic-mage.test.cjs` checks:
- All eight normal skills and charged 1–3, all three classes: exact MP cost, insufficient MP refusal with no projectile/cooldown mutation, no double-cast, and basic attacks still possible at zero MP.
- Mana Training combat/out-of-combat regen computed from each class profile; MP cap.
- Ranger recovery over time, no stacking, maxMP cap; expired effects restored from saves cannot poison MP.
- Fountain MP amount, one-use restriction and persistence across restore.
- Authored MP-drain helper floor and empty-MP behavior.
- Mage-only frost projectile, charged Frost Burst multi-target slow, frost area skills, barrier, and final healing/protection.

Existing suites `prototype.test.cjs`, `auto-potions.test.cjs`, `refuge-rest.test.cjs`, and browser/input tests also cover many charged, support, regen, save, and restoration behaviors. The new suite is complementary, not a replacement.

## Remaining verification before calling Mage gameplay fully audited

Run GitHub CI tests and browser checks on the audit branch. Separately instrument a current-main gameplay harness with actual Mage MP over time, number of successful/denied casts, time with insufficient mana, external Ranger mana supplied, survival, enemy kills and spell contribution. Cross Paladin/Mage/Ranger × early/mid/late levels × mob/ringleader/normal boss/TRUE boss × companion/no Ranger × Normal/Nightmare. Compare with sensible skill ranks and progression, not all slots artificially unlocked. Respect authored short encounter timing and do not auto-increase boss durability. Verify charged casting on desktop and touch, including abort/wait/no-target/no-MP states. No new consumable, class-exclusive passive, potion vendor or numerical retune is authorized by this review.
