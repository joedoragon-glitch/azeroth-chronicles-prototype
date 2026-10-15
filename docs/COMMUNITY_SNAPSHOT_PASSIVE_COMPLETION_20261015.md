# Community Snapshot — boss and captain passive completion

**Source baseline:** draft PR #300 at `cbde536da1efb334a505ed95b7d0e904d67154e9`.
**Integration:** follow-up branch only, PR targeting #300's implementation branch.
**Scope:** seven previously uncovered boss families with Normal/TRUE variants; two
previously uncovered named captains; Dreadmaw's existing passive documented as-is.

## Existing canonical passives (unchanged)

- Thornfang: Rapid Deployment, owned Wolf movement ×1.08 Normal / ×1.15 TRUE.
- Lifebinder (`crypt`): Structural Consolidation, damage taken ×0.94 / ×0.88.
- Mirejaw: Groundwater Recharge, 2% / 5% own maximum HP per second while
  intersecting owned live mud patches.
- Drowned Keeper: Emergency Stabilization, one trigger at 50% HP,
  30% damage mitigation for 6 seconds / 40% for 8 seconds.
- Scornfang: Prolonged Exposure, eligible normal attack Slows ×1.10,
  phase Slows ×1.20.
- Direjaw: Strain Hardening, 4% damage mitigation per actual hit,
  up to 12%, refreshed for 5 seconds.
- Dreadmaw: **Broodward** (existing behavior, not a new buff),
  25% damage reduction per living owned broodling, maximum four.
  The four-brood full protection, 45%-HP carapace reflection, and
  existing counterplay remain unchanged.

## New boss passives

| Family | Name | Normal | TRUE | Counter |
| --- | --- | --- | --- | --- |
| Ridge Tyrant | Contractual Protection | 8% baseline reduction plus 5% per owned living nearby Archer, max 23% | 12% baseline plus 6% each, max 30% | Defeat or distance the actual Archers |
| Garun | Self-Assembly | 18% reduction with core closed; regain 4% max HP when real exposure ends (18s cooldown) | 28%; regain 6% | Damage exposed core; exploit repair cooldown |
| Ashen Warlord | Chain of Command | 10% baseline reduction plus 4% per nearby owned Orc, max 22%; Orcs deal 15% extra damage | 15% baseline plus 5% each, max 30%; Orcs deal 25% extra | Eliminate owned Orcs or pull away |
| Veyrith | Aerial Superiority | 12% baseline damage reduction, rising to 22% for 4s after a completed offensive flight | 18% baseline, rising to 32% for 4s | Dodge, break route, or pressure after cover ends; Go-Around is excluded |
| Veyra | Regimental Cohesion | 10% baseline reduction; 20% during real Dress Ranks with a living nearby Crown guard | 15% baseline; 30% during Dress Ranks | Defeat guards, or wait out actual formation |
| Cindermaw | Emergency Provisioning | Below 70% HP: 0.5% own max HP/s alone, 1% with a nearby living Ash beast (12% max total per fight); 3 wounded allies heal 0.8% each/s | 0.8% alone, 1.6% with allies (20% fight cap); 1.2% allies | Defeat or separate Ash beasts to halve boss recovery; no resurrection or cross-map effect |
| Dark Lord | Veteran's Instinct | Four actual HP-damaging hits within 4s enable 25% mitigation for 6s (12s internal cooldown) | 35% mitigation | Spread timing of attacks; fully shielded, invalid or immune hits never count |

Dark Lord group encounters require at least two distinct attackers for the trigger;
solo encounters can trigger through four qualifying hits from the hero alone.
All mitigation is multiplicative with existing authored defenses and is bypassed
by the established explicitly piercing hero damage, not by ordinary attacks.

## New captain passives

- **Crag Tyrant — Hazard Pay.** Crag always takes 12% less incoming damage,
  increasing to 25% total reduction while a living room guard is within 320 units. Eligible living Treasury guards near
  an actively engaged Crag deal 20% more outgoing damage. No new personnel or
  alteration to Hostile Liquidation.
- **Cinder Warlord — Escalating Enforcement.** Each real HP-damaging hit
  received adds one 5% incoming-damage-reduction stack (up to 25%), refreshed
  for five seconds. At five stacks, the captain's outgoing attacks deal 15%
  more damage. Fast multi-companion focus activates this earlier, not later.
  Expired stacks disappear. No change to Mandatory Overtime or troop quotas.

## Encounter and compatibility constraints

- No additional enemy count, summon caps, attack slots, hero stats, equipment,
  Crown economy, XP, loot, cooldown-only mode, temporary attack geometry,
  telegraphs, or authored cinematic movement.
- Passives require actual live role and ownership. Foreign/distant/dead
  summons, same-named ordinary enemies and idle actors cannot activate them.
- Time-based defenses expire; saved/loaded/transferred/disengaged encounters
  clear the new temporary state, and no extra v4 persistence keys are required.
- Health restore never exceeds missing HP, resurrects allies, or duplicates
  a zero-damage hit; one per-encounter Cindermaw cap is absolute.
- Keep original director-approved four boss and three captain traits exactly
  as coded. This project is intentionally a provisional Community Snapshot
  completion, not authority to retune their locked numerical choices.
- Evaluate fight duration against multiple classes, Normal/TRUE, 0–6 companions,
  add-first versus boss-first priorities, and burst versus sustained pressure.
  The October 9, 2026 timing audit is a *historical stress reference*, not
  certification of the October 15 candidate.

## Verification

`tests/snapshot-passive-completion.test.cjs` tests all nine new identities
and both forms, ownership, death, restoration cooldown and healing limits.
The main suite and device/CI gates are required before accepting this branch.
No main merge, GitHub Pages release, or public snapshot publication is implied.
