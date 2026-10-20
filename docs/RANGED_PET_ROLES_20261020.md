# Ranged pet roles — dev.114

Joel approved the individual ranged-pet recommendations after the live dev.113 assessment: stronger useful Lifebinder healing, better Keeper area/control payoff, higher Whelp burst and a modest Marshal damage increase. Audit before merge/publication; no nerfs or Archer changes. Afterwards assess the seven remaining pets only, without implementing their recommendations.

| Pet | Prepared change |
| --- | --- |
| Little Lifebinder | Stay Alive heals self for 10% maximum HP instead of 4%, plus one wounded nearby party member for 10% of the pet's maximum HP. Lowest health fraction first; 280 reach and clear line. Both heals require actual projectile contact. Damage unchanged. |
| Pocket Keeper | Water Jet 2.1→2.4×. Undertow 1.3→2.2×, range 300→320, width 70→100, cap 3→5, Slow 1.5→2 seconds. |
| Veyrith Whelp | Compressor Puff 2.3→3.6×. Wake Vortex 1.4→2.4×, radius 95→110, cap 3→4. Slow unchanged. |
| Little Marshal | Precise Contouring 1.7→1.9×; Fractional Resurfacing 1.6→1.8×. Precision shapes, reach, caps and Slow unchanged. |

All existing cooldowns, basics, shared growth/inheritance, formation, AI safety, Recall and Archer/Soldier rules remain unchanged. Existing rosters read current skill definitions; no rest/re-hire. The healing description is updated, allied heal uses the existing readable heal effect, and expanded attacks/charge visuals consume the authoritative skill geometry.

## Initial audit

The same 189-case actual-tick fixture as dev.113 passes. Values below are delivered DPS in the existing supported level-20, 30-second single/cluster/scripted-moving fixture, not encounter survival or win rate. Lifebinder's new support is deliberately measured separately, rather than counting healing as damage.

| Unit | Single before→after | Six-target cluster before→after | Moving before→after |
| --- | ---: | ---: | ---: |
| Archer | 93.87→93.87 | 159.87→159.87 | 27.87→27.87 |
| Little Lifebinder | 74.20→74.20 | 86.92→86.92 | 19.79→19.79 |
| Pocket Keeper | 78.26→85.15 | 92.04→131.79 | 21.20→26.50 |
| Veyrith Whelp | 80.21→94.69 | 95.05→132.85 | 22.08→29.68 |
| Little Marshal | 77.03→79.50 | 106.00→112.01 | 31.09→33.57 |

At level 20 without inheritance a successful Lifebinder hit can restore 34 HP to itself and 34 to one ally, versus 13.6 self-only previously. It heals at most one ally per contact, never scales from the recipient's large HP pool, clamps overheal and excludes dead/resting/out-of-range/blocked allies. Missed shots give neither heal. This trades raw damage for support; upgraded Archer Heal remains a stronger flexible single-recipient heal (150 HP/10 seconds, without needing projectile contact).

Prepared focused tests cover real contact/miss/dead/resting source, recipient priority, range/line/death/reserve, full-pet ally healing, overheal, hero-pool independence, existing saves and expanded charged damage/Slow/event geometry. Initial existing pet lifecycle/activation/132 VFX frames/automatic range and dungeon-wall checks pass. Final combined integrity/source audit pending.

Evidence: `tools/pet-parity-audit-20261020/approved.json` (dev.113) and `ranged-dev114.json` (candidate). Reproduce current audit with `PET_AUDIT_OUTPUT=tools/pet-parity-audit-20261020/ranged-dev114.json node tools/pet-parity-audit-20261020/check.cjs`.
