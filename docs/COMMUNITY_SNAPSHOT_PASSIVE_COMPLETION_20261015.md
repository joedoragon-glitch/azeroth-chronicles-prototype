# Community Snapshot — boss and captain passive completion

**Source baseline:** PR #300 exact source head `cbde536da1efb334a505ed95b7d0e904d67154e9`, since merged into `main` by the director's separate action.
**Integration:** PR #307, branch `feature/community-snapshot-passive-completion-20261015`, head `8c452bc0515e05c9088bc304c2ae4d3be206d4f0`, is now incorporated into the owner's consolidated PR #308 (`fix/highlands-mounted-ogre-art`). Its seven-file patch merged cleanly with the dev.60 iPhone playtest candidate. Both source histories are retained. #308 is the single update/acceptance target; #307 is retained as source evidence, not a second release. Nothing has been merged into main or deployed by this consolidation.
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

## Local verification and remaining gates

The focused `tests/snapshot-passive-completion.test.cjs` was executed in a local V8 JavaScript runtime against the retrieved branch source and passed. It includes Normal/TRUE verification, source/role and ownership boundaries, healing caps, death/reset, actual damage and world-tick integration, v4 save sanitation, and the 3-class × 2-mode × 2-form × solo/six-companion matrix. The same local runtime passed the existing `captain-mechanics-audit`, `dark-lord-veteran-kit`, `abyss-aviation-moves`, `snapshot-veyra-combat` and `boss-mechanics-armor` focused test sources. A read-only Archive smoke check displayed the passive text for all eleven bosses.

No GitHub Actions, deployments, merges, or publication steps were initiated by this passive work. These local checks are useful source-level regression evidence, **not** complete native Node or browser certification. Formatting, packaging, all-suite Node tests, Chromium/WebKit, historical saves on real devices, and actual multi-companion encounter duration measurements remain as final merge-acceptance gates, to be run alongside the director's other updates. Keep the provisional potency settings reviewable; they may be tuned later without redesigning the encounter systems.

## PR #308 consolidation evidence

The native Node focused passive regression passed against the combined source, including Normal/TRUE, three hero classes, both difficulties, solo/six companions, real damage/world ticks, bounded healing and transient v4 save cleanup. The existing focused Rogue cast-continuity regression also passed on the combined source, covering cast clocks, circle/edge/cover/immunity, movement, save state and warning layers. The protected-source receipt check passed. Original mechanics and the prior playtest changes merged without conflicts. Changed files are locally formatted and the version/cache identifiers regenerated together as dev.61. The protected-source and sprite-scope receipts retain their historical values and record the exact authorized passive delta rather than treating an old CI pass as certification of new source.

The prior #308 dev.60 head passed [automatic run 38723686236](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38723686236). Full integrated release validation is deferred, including full Node, Chromium/WebKit and device acceptance. The owner explicitly prohibited GitHub Actions for this consolidation; `[skip ci]` is used on the publication commit. Existing workflow definitions/gates remain unchanged. No main merge or deployment is authorized.
