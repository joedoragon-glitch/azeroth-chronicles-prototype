# Hero Skills — additional static balance audit
15 October 2026 — owner-requested follow-up after complete class-specific Skills 2–8 redesign

**Status: source review only; no gameplay tests, simulations, builds, runtime checks, source balance changes, merge, or deployment.** Preserve the request for one combined final QA pass after all feature work is consolidated. This is an assessment of the provisional `feature/hero-skills-2-4-on-snapshot-20261015` branch (based on PR #300), not a report on deployed gameplay. Numeric comparisons ignore enemy armor/guard, burst compression, interrupted shots, movement, and other encounter variables unless noted.

**Source of truth:** `src/prototype/rules.js` (`heroTactics`, `classUltimates`, `advancedCharges`, `cooldownBalance`), `src/prototype/hero-combat.js` (`castHeroUltimate`, `castMageChain`, `castChargedAdvanced`, slots 1–8), `src/prototype/combat.js` (Fracture, weakening, target-shared burst compression and boss defense piercing), `src/prototype/engine.js` (cooldowns, targeting and enemy attack scheduling), `src/prototype/party.js` (Ranger support and Rally attack timers), and `src/prototype/progression.js` (starting and inherited bonuses).

## Priority A — resolve before consolidated release

### A1. Mage charged Skill 8's vulnerability is dominated by Skill 4

- **Charged Skill 8 / Arcane Cataclysm:** Fracture +12% at rank 1 up to +16% at rank 8, **4.5s** duration, **40s** base cooldown.
- **Normal Skill 4 / Arcane Fracture:** +15–19%, **4–5s**, **14s** cooldown.
- **Charged Skill 4 / Arcane Rupture:** +20–24%, **5–6s**, **20s** cooldown.
- The existing `fractureEnemy` implementation deliberately uses one strongest nonstacking modifier. Consequently a recent Skill 4 Fracture/Rupture can prevent Skill 8 from adding or renewing meaningful vulnerability. The capstone still does more immediate AoE damage, but its defining debuff often offers no further utility.
- **Proposal, not applied:** Make Skill 8's debuff a *short, stronger burst window* using the existing Fracture status (e.g. 25–29% for 2–3s), or remove its redundant debuff and compensate with a clearly distinct existing mechanic. Evaluate stacking semantics and coordinated party burst before finalizing.

### A2. Ranger Skill 8 has poor value against a lone boss

- **Normal Skill 8 Hunter's Salvo:** one 5×Power arrow on each of up to 3 enemies, **24s** base cooldown. At one enemy: **5×Power**.
- **Charged Skill 8 Grand Hunt:** two 4×Power arrows on each of up to 5 enemies, **40s** base cooldown. At one enemy: **8×Power** total.
- **Normal Skill 7 Piercing Arrow:** 10×Power and *piercing*, **15s** cooldown. **Charged Skill 7:** 12×Power and piercing plus Slow, **25s** cooldown.
- Ranger Skill 8 is deliberately designed for multiple enemies, but with one boss and no adds, it is decisively weaker per activation *and* per cooldown than Skill 7, with no pierce. The game's `tacticalCompressDamage` also handles non-piercing attacks in a shared target-specific burst window, while Skill 7's piercing bypasses those defensive reductions. Grand Hunt's rapid same-target arrows may therefore be even less impactful against protected bosses.
- **Proposal, not applied:** Give the ultimate an explicitly bounded fallback for one/two living foes (e.g. 1–2 extra arrows on the primary target, capped at no more than a 10–12×Power unpierced single-target strike), or make its anti-crowd role unambiguous in skill explanations and avoid presenting it as an all-purpose boss finisher. Do not undermine Skill 7's anti-elite niche.

## Priority B — meaningful tuning tradeoffs

### B1. Charge versus tap on Ranger Skills 6 and 7 may not feel worth the recovery time

- **Skill 6 tap Repelling Shot:** `(1.8×Power + 20)` damage, **4s** cooldown, pushes a surviving target **45–65 world units**. **Charged Repelling Volley:** 3 hits totaling `4.2×Power`, **12s**, with a final **65–85** push.
- At Power=20 and rank 1, this is 56 raw damage every 4s versus 84 every 12s before defenses; charged offers bigger burst/push but substantially less repeated damage. If one of the three arrows misses or is blocked, the payoff shrinks further.
- **Skill 7 tap Piercing Arrow:** `10×Power`, **15s**. **Charged:** `12×Power` and modest Slow, **25s**. Charging grants only 20% more instantaneous damage for 67% longer cooldown; baseline `Power`-normalized throughput moves from 0.667/s to 0.48/s even before the charge hold. The charged variant remains a burst/control choice, not an efficiency upgrade.
- **Proposal, not applied:** Review stronger one-time crowd-disruption or a modest cooldown/coefficient rebalance for charged Skill 6/7. Prioritize *distinct tactical utility* rather than making charged attacks always dominate normal DPS.

### B2. Mage's late solo survivability depends heavily on the starting Ranger companion

- Mage no longer self-heals through Skills 3 or 8 (as deliberately approved); the Paladin has defensive/healing Skills 3 and 8, and Ranger has Skill 3 healing. The Mage starts with an Archer companion, and `rangerSupport('health')` can restore hero HP if a living active Archer is available.
- If this Archer is downed, held, inactive, out of support, or unavailable in a solo encounter, Mage has no comparable innate active heal. That may be an appropriate glass-cannon tradeoff, but it must be compared to Mage's 90 starting HP versus Paladin 120 and Ranger 105, and their class control tools.
- **Proposal, not applied:** Preserve the clear damage/control identity; check late-game survival *with and without* active support before authorizing healing or an independent class passive. Do not invent a heal/personal shield without owner approval.

### B3. Paladin stacking can reduce an unusually large share of boss damage during burst-defense windows

- At rank 8 Shield Stance reduces incoming damage **73%** for 8s and forces a normal Skill 3 cooldown **after stance ends** (base 8s; with max Cooldown Training 6.4s). Max-theoretical stance uptime under immediate refresh is `8/(8+6.4)=55.6%`.
- Charged Last Bastion can grant a **30%** damage-reduction ward for **6s** at rank 8. During overlap with Shield Stance, post-armor damage is multiplied by `0.27×0.70=0.189`: **81.1% effective mitigation** from these two effects alone.
- Skill 2's rank-8 weaken adds **20% reduction to the enemy's outgoing damage** for **4s** against sources covered by `weakenedEnemyDamage`, versus a 3s normal cooldown (2.4s with max cooldown training). It can be repeatedly refreshed at that cadence. If all three apply to the same boss hit, the combined fraction *before other armor* can be `0.8×0.27×0.70=0.1512`, or **84.88% reduction**. This is a conditional overlap, not permanent invulnerability.
- Boss Judgment taunt is capped at 2.5s for basic targeting and does not redirect scripted boss specials. The protection may therefore be intended for a tank, but with allies striking freely it risks overprotecting that window.
- **Proposal, not applied:** Compare real incoming Normal/TRUE boss damage and companion output with all three effects stacked before nerfing. If too safe, cap combined mitigation (without changing individual ranks) or adjust ward uptime; preserve the tank role and the 60%-outgoing-damage Shield Stance tradeoff.

## Priority C — watch during combined validation

### C1. Mage's single-target control can have near-continuous coverage

- Normal Frost Bolt slows for 4–5s on a 3s base cooldown (2.4s with max training). Keeping one monster continuously slowed is possible as long as shots connect. Mage also has the 8s/20s Interrupt/Silence and short displacement from Force Pulse.
- Normal Slow alone does not prevent attacks or scripted enemy specials, and the charged Silence Field suppresses allied skills too. This may be balanced; compare against bosses and captains whose movement is essential to difficulty. Avoid uncontrolled boss-interrupt loops.

### C2. Large enemy groups magnify instant Mage/Paladin areas versus capped Ranger multi-projectiles

- Mage Skill 8 damage has no explicit target count cap in its selected-target circular explosion (9×Power main plus 5×Power per additional enemy charged), while Ranger charged Skill 8 targets at most **five enemies**, two arrows each; Paladin hits all eligible enemies in a hero-centered radius.
- At 8 enemies within coverage, Mage charged damage before mitigation could be `(9+7×5)×Power = 44×Power` across the group while Ranger caps at `5×2×4×Power = 40×Power` if all ten projectiles land. Those numbers aggregate over multiple enemies and **must not** be interpreted as one-target burst.
- Ranger arrows take travel time, may encounter blocked paths, and can face shared target-burst compression. Compare crowd sizes of 1, 3, 5, 8+ before deciding target caps or radius changes. Ranger benefits from choosing a broader group, Mage from instant centered impact.

### C3. Charged Ranger Skill 4 Rally may be underwhelming without multiple attacking companions

- Rank-1 Companion Rally grants +15% movement/+8% ordinary attack speed for 4s to eligible allies, 20s base cooldown; Rank 8 gives +19%/+12% for 5s. No damage bonus or accelerated special cooldowns; also safely rejects cast when no companion is eligible.
- This is balanced against overpowered group buffs, but near a single wounded Archer its 20s charged slot cost could be less useful than normal Skill 4's +25% hero movement for 4–5.75s on a 14s cooldown. Observe actual ordinary-attack availability and party composition before raising its numbers.

## Decision / release gates

1. **Owner decision pending** on A1 (Mage charged Skill 8 vulnerability) and A2 (Ranger single-target ultimate role); numeric proposals above have not been authorized.
2. B/C findings are cautionary and should not trigger blind buffs or nerfs. Resolve from the future combined QA, especially Normal/TRUE bosses, starting-party survival, late-party damage and status overlap.
3. **Class-specific independent passives remain undefined**; do not use speculative passives to excuse or repair any observed balance problem.
4. Do not run tests or builds now, merge, deploy, or reopen unrelated PRs. Consolidate all owner-approved gameplay changes first; then one shared validation pass as requested.
