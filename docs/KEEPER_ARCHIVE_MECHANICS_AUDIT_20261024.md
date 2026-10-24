# Keeper Archive — numerical and mechanics audit, 24 October 2026

## Authority and scope

**Audited latest main: `6d0ce97465bc2145b68d25c29e7dae2739162ec1` (published dev.170).** Audited Archive: the continuing #433 draft, on #432 → #430 → #428. Candidate version after these reference-only repairs: **dev.172**. No merge, rebase, deployment or gameplay/balance change is authorized or performed.

This is the requested **mechanical accuracy audit**, distinct from the preceding A4 translation audit. Preserving English numbers in Spanish was not evidence that those English numbers matched latest main. The findings below compare the reference with main's actual rules and native methods. The approved 53 EN/ES manuscript pairs and three supplements remain immutable; only non-literary technical reference text is corrected.

A detached main worktree supplied the native engine and rules. This draft's Archive was loaded with that real engine/data/rules without combining branches or substituting draft combat code. The same test also runs against the draft's native engine for backward compatibility. Main's newer mechanics are **not imported into the older stack** by this audit. The reference adapts to the actual supplied rule set; integration still must retain #429/#431.

## Findings corrected

| Finding | Correction and authoritative evidence |
| --- | --- |
| Slow described only an expiring slowdown, omitting #429's stack suppression and persistent cooldown debt. | Rule-dependent explanation includes first-hit 65% allied / 85% enemy recovery, stack divisors with 0.35 / 0.15 penalties, added 0.25s duration and per-hit 35% / 15% debt on eligible already-recovering cooldowns. The maximum remaining duration wins, stacks clear on expiry and debt persists. `combat.js`: `applySlow`, `cooldownRecoveryElapsed`. Older draft rules retain their older accurate explanation. |
| Mage Frost summary and charged details advertised raw Slow seed durations, omitting main's 0.25s addition. Ranger Skill 2's charged Slow was missing from its figures. | Show effective initial-hit durations: latest-main Mage tap 2.25–2.45s and charged 3.45–4.45s by ranks 1–8; rank-specific tap and charged Mage/Ranger figures use native milestone formulas plus the shared bonus. Ranger charged uses `heroTactics.ranger.volley`, not the geometry definition's absent `slow` field. Overlapping-hit debt remains explained separately. |
| Pet Slow and veteran Ranger covering-shot Slow similarly displayed raw seeds. | Add the live shared duration bonus to the Archive-only reference projection. Do not change `party-pets.js`, party behavior or any skill definitions. All 22 pet skills checked against native effects/definitions. |
| Dark Lord's Second Wind inherited the generic 60% recovery threshold and exposed the internal 9999s lock as a repeat cooldown. It was hidden incorrectly in dormant mana mode. | Use its own strict **below 35% HP** gate, 1.8s warning and 5% heal. Explain **once per encounter**, rear-hit interruption and the 65% incoming multiplier during preparation. Apply the same availability condition as `startBossRecovery`. Veyrith/Veyra keep their own normal recovery cooldowns. |
| Closed Ash Sentinel 65% / exposed Colossus 125% could be read as final received damage. | Identify them as intermediate multipliers before other passive defenses and burst compression. Native isolated damage probes verify both factors. |
| Ridge Tyrant / Warlord passive wording did not specify summoned/engaged followers, range or all caps. Dark Lord's Veteran's Instinct omitted its multi-source requirement. | Show owned, engaged summons within 400 / 380 paces and the three-follower caps, from live rules. With living field companions, Veteran's Instinct requires at least two distinct contributing sources. Native passive gates checked. |
| Pet advice claimed no pet performs labor. | Preserve the actual exception: Little Treasurer can gather tribute and join resource expeditions; other pets cannot. No pet summons. `canGatherTribute`, `gatheringTravel.petWorkerFamily`; ordinary building labor remains soldier/archer-only. |
| Ranger 50% care threshold appeared to cover all healing; soldier immunity wording excluded exactly 50%. | The threshold applies to **automatic combat care**. Outside combat automatic care treats any wounded living ally; manual care can also treat injured allies above that threshold. Soldier immunity activates at half health **or less**. Native support/party source checked. |
| Skill cooldown numbers did not distinguish base recovery from accumulated Slow debt; charged basic multiplier was ambiguous for Ranger's three arrows. | Label base recovery and charged **total** damage before defenses; retain the existing two-decimal display rounding and native queries. No cooldown/charge behavior changes. |

## Complete numerical reference register

| Surface | Authoritative source and audit |
| --- | --- |
| Armor, wards, immunity | `combat.hitParty`: max(3, incoming − armor × 0.35), strongest stance/ward rather than multiplicative stacking; live `armor()` includes equipment/reforges. Native armor/ward probes and unchanged immunity guards. |
| Fort protection/range | `fortifications.enemyRangedRange`, `combat.damage`, `rules.balance.fortifications`; real native reach ratio and damage factor isolated from other layers. |
| Burst compression | `tacticalProtectionTier` / `tacticalCompressDamage`: all six tiers, knee/tail percentages, rolling two-second window, logarithmic incremental damage and opening multiplier. Native shared-history curve probes. |
| Rogue eligibility/regroup | `combat.tacticalRogueEligibility`, `tacticalRogueWounded`, regroup candidates/phase damage; wounded threshold, level disadvantage/protection, attacking-source count, summon condition, awareness radius and half-damage travel guard source-checked. No AI changes. |
| Conditions | Charge preparation 0.65s, 7% HP / minimum 6 HP interruption, 0.5s retry; Silence rank range; 2.5s boss taunt cap; Ranger 25% haste and 15–19% / 8–12% rally; stance 60% outgoing; automatic/manual healing distinctions. Checked against charged/combat/party owners and native casts. |
| XP and discipline | `enemyReward` / `reward`, `xpRequired`, talent profiles, rank caps and `skillCooldown`; ordinary XP reduction, level-gap table, flooring, per-level HP/points, training inheritance and cooldown training. Native reward and query checks. |
| Hero skills | All three classes × eight slots × eight ranks × two forms: **384 accepted native casts**. Cooldown spent, current effective Slow, area/chain/projectile target counts, shield duration, Silence, rally, Paladin healing/ward and Cataclysm vulnerability checked. Accepted-hit fixtures record raw outputs without killing targets; they are bounded resolver probes, not full-game playtests. |
| Companion and pet reference | Ranger health ranks/amounts/duration/cooldown and eligibility, shared training/strength fractions, Companion Vitality, veteran ward/covering shot, charge contracts, free recruitment/unlock/roster predicates and worker exception. All eleven families / 22 skill definitions and native effects checked. |
| Boss baseline figures | All eleven normal daytime actor levels/HP/damage compared with `bossEnemy`. Each attack's actual `buildBossAttack` first warning/coefficient matches the displayed normal baseline. Summon caps use native `bossSummonCap`. Observed encounter rows retain each actor's current level/max HP/damage; baseline coefficients are not promised as every night/TRUE/phase sequence's final output. |
| Boss/captain passives and recovery | Native ownership/radius/cap/formation factors, closed-core defenses, Cindermaw per-second regeneration/budget, Veteran's Instinct gates, Scornfang duration multiplier; all displayed remaining passive fields traced to `greenwoodPassives`, `marchesPassives`, `snapshotPassives`, captain profiles and their consuming combat branches. Boss recovery checked against its own thresholds, heal fraction, warning, one-time lock and modifier. |
| TRUE appearance | `kill`, `fieldBossStreak`, `activatePending`, `awaken`: two qualifying field defeats / one Dark Lord defeat, one-in-three early dungeon roll, later awakening and persistent victory gates unchanged. Source review; lifecycle suite retains behavioral coverage. |

## Focused verification and reproduction

- `ARCHIVE_MECHANICS_ROOT=/absolute/path/to/main-checkout node tests/archive-mechanics-audit.test.cjs`: **PASS** with the actual pinned latest-main engine. Covers the native probes above; no global test runner or browser matrix.
- The same test without the environment override verifies the older draft engine. CI discovers it as a directly changed focused test; the CI default is **not** represented as a fresh main-engine run.
- `ARCHIVE_MECHANICS_ROOT=/absolute/path/to/main-checkout node tests/archive-translation-coverage.test.cjs`: **PASS, 4,992 fields**, including both resource reference modes, all classes, all Treasury/side-dungeon encounters, pets, gates, source number order, exact approved substrings and no save mutation. It also runs against the draft engine.
- Existing independent manuscript hashes, N1 bilingual shell, A2/A3 navigation, Archive reference and A4/A5 shell checks remain focused companions to the audit. Narrow build/format checks and final remote CI are recorded on PR #433.
- This continuation changes no native engine, combat, rules, party, progression, rewards, save or manuscript module. No save keys, spell effects, game balance or world geometry change. No browser/full-suite rerun was needed for a numerical reference audit.

## Acceptance boundary

The numerical/mechanical reference has now been audited against the **pinned latest main**, with the corrections above. This does not claim every possible gameplay interaction was simulated. Future changes to rules/resolvers must rerun the corresponding audit; the explicit main SHA prevents confusing this result with a later version.

The stack still needs its eventual integration review against main, preserving #429's Slow mechanics and #431's preference/trial UI, followed by relevant combined-candidate checks. All four PRs remain draft and unmerged. Merge and deployment still require explicit owner authorization. Physical-device/WebKit/screen-reader certification remains separate and unperformed.
