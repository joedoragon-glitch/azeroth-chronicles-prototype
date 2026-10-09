# Boss and captain range balancing — reviewed integration

This change supersedes draft PR #129. It is based on the live post-foundation `main` branch so rogue retreat/reset infrastructure remains intact. It does not activate autonomous rogue behavior or tiered burst compression.

## Audited mechanics
- Boss special acquisition: 560 to 600 world units. Captain activation: Vale 420→470, Marches 390→437, Highlands 430→482, Crown 440→493 and Frontier captain 440→493.
- Boss and captain cone, sector, and circular impact radii gain 15% without changing warnings/recovery/damage. Multi-circle patches expand from 75 to 86.25 units, while the original patch spacing remains unchanged.
- Boss ring waves gain real travel distance by extending **ring hazard lifetime** 15%. Merely scaling the ring's initial radius does not extend it because `updateHazards()` recomputes ring radius from age and speed on every tick. Maximum ring reach becomes approximately 331.2 (previously 288) world units.
- Boss centered attacks are eligible only when their effective geometry can reach the selected party target; the Dark Lord's high-HP sector uses its *actual cone* shape for that decision. Long-reaching marks retain the ability to target the hero behind Soldiers, provided there is line of sight and the target is within skill activation range.
- Distant captain cones are removed from the eligible move pool **before** avoiding a repeat of the last move. This preserves useful lines/circles instead of aborting valid casts. The selected captain circle can mark the hero when within range and line of sight.
- If a boss has no useful move, it resumes pursuit. When **only** its previous move remains eligible, it may repeat that move instead of entering an idle loop. Out-of-reach chained cone/sector/ring attacks are skipped instead of appearing impossibly at range.
- Summon caps/compositions, boss and captain cooldowns, telegraph warning and recovery durations, damage coefficients, original territorial leash, and phase/special identities are unchanged. Existing rogue regroup behavior retains its own scoped leash exception.

## Validation and boundaries
- Regression checks cover all 11 boss families in normal and TRUE forms, all five captain profiles, ring propagation, charge/targetable attacks, range-conditioned selection, low-health Dark Lord phase, backline hero targeting with/without line of sight, and non-wasted combo chains.
- Existing phase-weight tests are updated to supply a *reachable* target rather than accidentally asserting an ability should be eligible from across the map.
- Browser/phone, gameplay and sprite-scope checks must be green before merge. A full controlled time-to-kill/difficulty calibration is a separate encounter-balance activity; geometric coverage testing is not a substitute for it.
- Rogue AI and burst-compression activation remain separate later milestones.
