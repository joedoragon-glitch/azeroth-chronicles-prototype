# Cooldown-only combat and dormant-MP migration — 9 October 2026

## Decision and guardrails
The active Azeroth Chronicles multi-file PWA uses **cooldowns, not mana**, for Paladin, Mage and Ranger skills. MP is dormant instead of deleted: original class MP values, growth formulas, MP balance rules, enemy drain definitions, Ranger mana restoration, save fields and the previous HUD/help paths remain in source or version history. The shared switch is `PrototypeRules.resourceMode.manaEnabled = false`. Turning it back to `true` restores the old mana-based behavior, subject to regression tests. Never silently discard MP on save export/restore.

No mana pool/regen/item tuning is authorized. Preserve current damage, geometry, positioning, warning timing, NPCs, boss encounters and quests. No new effects for formerly draining attacks have been approved.

## Active combat contract

- All normal and charged hero skills require **zero MP**. Existing target, skill-unlock and cooldown checks remain enforced.
- Normal hero skill cooldowns still use their prior base values: slot 1 = 0.85s, 2 = 3s, 3 = 8s, 4 = 14s, 5 = 9s, 6 = 4s, 7 = 15s, 8 = 24s.
- Charged 1, 2 and 3 use provisional base cooldowns of **3s, 6s and 20s**, to avoid a free triple-damage basic projectile / area attack / party heal being repeated at the old ordinary speed. These are experimental parameters, not final balance approval.
- Mana Training's five saved ranks become **Cooldown Training**: all hero skill cooldowns are reduced by 4% per invested rank, up to 20% at Rank 5. Existing talent index 1 and saved rank are preserved without resetting points; zero-rank cooldowns remain unchanged.
- Ranger Heal remains available through party and manual controls. Ranger Mana Recovery and its training are dormant and hidden; Mana Recovery input and the MP bar are removed from active UI. MP recovery effects stored by old saves do not apply while the flag is disabled.
- The active Character → Skills and teachers menu presents class-specific skill behavior, normal cooldown and charged behavior/cooldown. The active Talents menu exposes the five-rank Cooldown Training instead of Mana Training.
- Historical saves retain `mp`, `maxMp`, `manaBalanceVersion`, legacy potions, support cooldowns and Ranger mana training in the saved data. Those values remain **untouched** during cooldown-only play except for legacy validation/migration. The portable single-HTML architecture is not a constraint.

## Enemy skills with MP-specific effects

The following entries all still deal their regular authored HP damage. Their MP drain is **disabled only**, leaving all other properties intact for now. One attack can have several simultaneous effects (damage, slowing, persistent hazard, summons); do not strip those accidentally. Attack positions are zero-based in the source; named attacks below are from `src/prototype/data.js`.

| Enemy / encounter | Authored attack (source rules index) | Former MP drain | Remaining attack behavior | Replacement decision |
| --- | --- | --- | --- | --- |
| Crypt Guardian (`crypt`) | **Draining ground** (attack 4, index 3) | 5% max MP | Marked persistent circle / HP damage | Review name and whether any additional effect is needed |
| Drowned Keeper (`archive`) | **Water jets** (attack 2, index 1) | 8% max MP | Two warned parallel damage lanes | No replacement needed for structural threat unless playtest says otherwise |
| Drowned Keeper (`archive`) | **Undertow** (attack 3, index 2) | 4% max MP | Slowing persistent hazard / HP damage | Existing slow already replaces resource pressure |
| Abyss Dragon (`abyss`) | **Flame cone** (attack 1, index 0) | 8% max MP | Warned cone / HP damage | Preserve flame identity; decide whether added effect is needed |
| Abyss Dragon (`abyss`) | **Wing shockwave** (attack 2, index 1) | 10% max MP | Expanding warned ring / HP damage | Existing timed positioning challenge remains |
| Ash Sentinel (`citadel`) | **Ash lanes** (attack 2, index 1) | 8% max MP | Two warned lanes / HP damage | Preserve safe channel |
| Ash Sentinel (`citadel`) | **Furnace pulses** (attack 4, index 3) | 10% max MP | Three sequential persistent circles / HP damage | Existing hazard sequencing remains |
| Dark Lord (`darklord`) | **Dark cleave** (attack 1, index 0) | 8% max MP | Frontal combo / HP damage | Preserve melee combo |
| Dark Lord (`darklord`) | **Fortress bombardment** (attack 2, index 1) | 10% max MP | Three sequential warned circles / HP damage | Existing bombardment threat remains |
| Dark Lord (`darklord`) | **Crown phase** (attack 4, index 3) | 12% max MP | Sequential sector pulses / HP damage | Preserve rotating safe-sector mechanic |
| Night Wraith | **Soul Drain** | 12% max MP | Warned circular area, HP damage, slowing, and authored self-healing | Rename or reconsider only after review; other effects already make it distinctive |
| Ranged Wraiths | **Spectral ranged projectile** | 6% max MP on successful hero hit | Projectile HP damage / original aiming and positioning | Leave projectile threat intact |
| Ranged Ash-beasts | **Ranged projectile** | 4% max MP on successful hero hit | Projectile HP damage / original aiming and positioning | Leave projectile threat intact |

MP drain applies only to the hero; it never drained companion mana (companions have no MP pool). The boss and night attacks remain visually identifiable even while the `manaDrain` config field is dormant.

## Validation requirements

- All three classes × normal Skills 1–8 and charged 1–3, ranks 0–5 in Cooldown Training: exact cooldown, no MP deduction, no double-cast during cooldown.
- Charge hold/cancel/wait on keyboard, pointer and mobile; distinguish charged vs normal recovery time, no new UI clutter.
- Existing save imports preserve the 5-rank talent and all legacy MP fields; reward/travel/XP/death/level-up do not refill dormant mana.
- Ranger Heal (manual/auto, training, cooldown, target selection) remains operational. Ranger Mana Recovery has no active UI, input, purchase path or effect.
- Draining enemy attack still hurts HP and retains its non-mana mechanics; no hidden MP change.
- Regression suite must be reconciled: old mana-specific tests were authored for the previous mode and should not constrain the new mode while the archival implementation stays testable.

## Reversibility

The feature flag controls the living rules without deleting legacy functions. Prior git history and this report retain precise earlier behavior. For a future MP restoration, change the flag and run both the retained historical mana tests and browser compatibility checks; review any previous old-save MP state before publishing. Do **not** convert the legacy MP schema destructively or rewrite every historical document to pretend mana never existed.
