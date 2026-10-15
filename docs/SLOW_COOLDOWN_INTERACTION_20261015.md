# Timed Slow now reduces skill cooldown recovery — review candidate

**Owner request:** An enemy Rogue bind, snare, captain/boss Slow, projectile or trap Slow must protect a monster against player and companion ability spam, not merely impair foot movement. Apply the same rule to slowed monsters for predictable status semantics.

- `R.cooldownBalance.slowRecoveryMultiplier = 0.65`: every second that overlaps actual Slow counts as **0.65 seconds** toward remaining skill cooldowns. Sustained Slow makes a cooldown take about **54% longer** to refill, but finite Slow only adds the missing recovery while active. A 3-second Slow adds up to 1.05 seconds of recovery debt to a longer cooldown.
- Keep **base cooldowns and talent reductions** intact. Countdown recovery slows temporarily; **do not extend the current timer on every Slow hit**, stack additive cooldown penalties or retroactively modify completed cooldowns.
- Hero Skills 1–8, charged variants, companion basic/global/first/second skill timers, companion Ranger healing/recovery and survival cooldowns, enemy basic/special/summon/recovery timers and pending Rogue reaction deadlines all obey this. Status, phase, hazard, cast/warning and animation timers remain at wall-clock speed.
- Slow is still only applied after a valid hit to living nonimmune units; longer reapplications refresh the remaining duration without multiplying penalties. Mage frost now also slows monster skill recovery; this is a reciprocal balance consideration to evaluate against stronger hero skills in draft PR #305.
- No new persisted field or migration. Save v4 already holds `unit.slow` and remaining cooldowns. Timers recover normally at Slow expiry, including an exact sub-frame expiry.
- Keep the new feature isolated from PR #305 and avoid merge/deploy until an integrated balance review with the completed hero progression overhaul, full automated checks, old-save and phone/desktop gameplay verification.

## Verification status

This is a **source and regression-test checkpoint**, not a certified release. Execute `node tests/slow-cooldown.test.cjs` and existing combat, Rogue, charged-input, party/AI and save suites, then run the project build/format/check pipeline and desktop/mobile browser matrix. Exact-head CI and real-device playtesting are outstanding until demonstrated by evidence.
