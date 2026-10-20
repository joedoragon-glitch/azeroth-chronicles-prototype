# Individual pet roles — dev.114

Joel approved the individual ranged-pet recommendations after the live dev.113 assessment: stronger useful Lifebinder healing, better Keeper area/control payoff, higher Whelp burst and a modest Marshal damage increase. Audit before merge/publication; no nerfs or Archer changes. Joel subsequently authorized straightforward, evidence-backed changes for the other seven pets in this same update, and required every pet to have a real individual specialty. He clarified that Sovereign is an ordinary peer with no extra power for being a late/Dark Lord unlock.

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


## Remaining pets: assessment and implementation

No shared stats, immunity or special unlock advantage was added. The skills' existing control, ward and area roles are improved; Sovereign gets a bounded wounded-target specialty to separate it from Treasurer's heavy hit/cargo pattern. Every collection row/detail now explains its real specialty, and numerical skill summaries include the new heal/finisher conditions.

| Pet | Evidence/need | Straightforward change |
| --- | --- | --- |
| Thornpup | Single-target near Soldier, small area payoff | Entry 2.4→2.6×; Tripwire 1.3→1.8×, cap 3→4, Slow 1.5→2s. |
| Mireling | Weak broad splash; slowing entry distinguishes it from Tripwire | Hop 2.2→2.4×, Slow 1→1.5s; flood 1.4→2×, radius 115→125, cap 3→4. |
| Little Treasurer | Already competitive single-target, weak cargo payoff | Cargo 1.7→2×, cap 3→4. Heavy first hit unchanged. |
| Pebble Colossus | Ward was weaker and briefer than veteran Soldier's, without Soldier immunity | First ward 15%/2s→25%/4s; compaction 1.5→1.8×, cap 3→4, Slow 1→1.5s. |
| Ash Cadet | Two cleaves still lagged Soldier's area skill | First cleave 1.8→2.2×, cap 2→3; sweep 1.8→2.1×, cap 3→4. |
| Cinder Cub | Charged ward had low uptime/reliability under pressure | Ring 1.4→1.7×, cap 3→4; charged ward 25%/3s→35%/4s. Still requires finishing the charge/hit. |
| Pocket Sovereign | Healthy-target damage already near Soldier; limited line payoff and overlap with Treasurer | First keeps 2.6×, gains +25% damage only at target HP ≤35%; second keeps 2×, cap 2→3. Ordinary stats/cooldowns/slots, no execution and no late-unlock advantage. |

The two defensive pets remain distinct: Colossus's more frequent ward is on its first move, Cinder's stronger ward needs the charged second. Sovereign's conditional finisher preserves Treasurer's better healthy-target hit and broader cargo strip. No unbounded area caps or new immunity abilities.

### Combined damage results

Same controlled level-20 actual-tick fixture, dev.113→dev.114, single / six-target cluster / scripted-moving DPS:

| Unit | Before | After |
| --- | ---: | ---: |
| Soldier | 89.44 / 146.64 / 87.71 | 89.44 / 146.64 / 87.71 |
| Thornpup | 82.15 / 95.93 / 78.62 | 86.21 / 114.83 / 82.68 |
| Mireling | 81.27 / 96.11 / 77.73 | 85.86 / 117.66 / 82.33 |
| Little Treasurer | 87.10 / 105.12 / 87.10 | 88.69 / 120.49 / 88.69 |
| Pebble Colossus | 80.38 / 96.28 / 72.43 | 81.97 / 110.59 / 73.49 |
| Ash Cadet | 80.56 / 112.36 / 77.03 | 84.98 / 149.46 / 81.44 |
| Cinder Cub | 78.79 / 98.58 / 69.96 | 80.91 / 116.95 / 72.08 |
| Pocket Sovereign | 87.27 / 97.87 / 87.27 | 87.27 / 108.47 / 87.27 |

The high-HP fixture never reaches the finisher threshold; Sovereign's new bonus is independently tested below/above/exactly at 35%, using actual damage and its original cooldown. It is not counted as a fictitious extra DPS gain here. Wards are checked through actual incoming damage, expiration, strongest-layer Recall/Paladin interaction and charge interruption, not inferred survival statistics. Ash Cadet slightly exceeds Soldier cluster output here, as expected for its cleave specialty; Soldier retains its defensive tools.

Final combined source, integrity and release checks pending. Current matrix: `tools/pet-parity-audit-20261020/pets-dev114.json`; the earlier `ranged-dev114.json` is the intermediate four-pet checkpoint, preserved for traceability.
