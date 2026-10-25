# Ordinary ranged-enemy healing buff — dev.181

Target: existing dev.180 main `2af8e97990f6d45b446149592334b9d31b2dfb34`. This update changes healing strength and cadence for ordinary ranged enemy healers treating ordinary enemies only. It does not fix the separately audited idle-recipient pulse cancellation, idle approach limits or eligibility thresholds. Boss/captain offensive AI, authored healing roles, normal player healing, enemy damage, and persistent saves are not altered.

| Cast and recipient | Before | Dev.181 |
| --- | --- | --- |
| Ordinary ranged healer → ordinary enemy (including other species and ringleaders) | 5% of recipient max HP in 5s / 10s caster recovery | **Full HP (all missing HP at cast) in 3s / 7s caster recovery** |
| Ordinary ranged healer → boss/captain/field captain | 5% in 5s / 10s source eligibility | **5% in 5s / separate 10s leader eligibility per source** |
| Boss/captain healer → any eligible target | 5% in 5s / 10s caster recovery | Unchanged |

For an ordinary target at 40% HP, treatment restores the missing 60 percentage points linearly over three seconds, reaching 100% if no further damage occurs. Healing budget is determined at cast start; damage taken during pulses requires later treatment. Encounter scaling does not reduce the full-heal amount. No healing through walls, on dead/neutral/returning targets, or above the original 75%/90% thresholds. Existing 350-unit range, five-second leader pulses, overlap/no-stacking behavior, scaling, Silence, Slow-based recovery, and area selection remain in force.

A runtime-only WeakMap keeps each ordinary healer's leader-target eligibility on the original ten-second cooldown despite a separate seven-second ordinary cast recovery. Both cooldowns decrement from the same recovered simulation time; leader casters retain their original interval. They reset on disengage and do not appear in v4 saves. Mixed casts give ordinary units the complete missing-HP budget while leaders retain the original amounts.

Tests: existing enemy-support-healing, enemy-area-healing, enemy-reach-regroup, enemy-withdrawal-actions, archive-mechanics-audit, Slow/save tests; new `tests/enemy-ordinary-heal-balance.test.cjs` covers all 12 species, mixed ordinary/leader area treatment, individual leader cooldown, unchanged leader sources, melee exclusion and save shape. Device/feel balancing remains unverified.