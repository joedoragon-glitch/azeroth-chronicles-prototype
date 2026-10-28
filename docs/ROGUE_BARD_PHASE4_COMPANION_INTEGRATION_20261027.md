> **Current Rogue canon / archival notice — 28 October 2026:** This is a dated PR #511 stage report, **not a current implementation order or release status**. Rogue/Pícara is now **merged, published and normally playable** (dev.208). Weapon for both normal and crowned art = **staff with one oversized suspended spherical jingle bell**, never guitar, lute or strings. Critical intensity is **developer-authored** (Rogue Level 2 default), not a player slider. Older pre-release, guitar, naming and candidate mechanics below are historical only. Follow [current Rogue canon](ROGUE_CURRENT_CANON.md), current source, and [development state](DEVELOPMENT_STATE.md) for present-day work.

# Rogue Bard — Phase 4 companion integration implementation record

**27 October 2026 · Draft PR #511 · `design/rogue-bard-feasibility-20261026` · No merge/deploy/public fourth class.**

## Verified entry conditions

Phase 1 (foundation), Phase 2 (Rogue hero basics) and Phase 3 (lawful Charm)
were already staged and focused-validated at the Phase 4 entry. Their mechanics
are not redesigned. The authoritative baseline remains
[the consolidated Phase 1–3 record](ROGUE_BARD_PHASES_1_TO_3_CONSOLIDATION_20261027.md),
[canonical eight-phase handoff](ROGUE_BARD_EIGHT_PHASE_DEVELOPMENT_HANDOFF_20261027.md)
and [Charmed roster/Barracks contract](ROGUE_BARD_CHARMED_ROSTER_BARRACKS_CONTRACT_20261027.md).
At entry, PR #511 was draft, open, unmerged, 0 commits behind main, head
`767d3d460b02bb0f8ad147abc3cf97ea469fc0d6`.

## Native implementation (candidate pending final CI)

- **Creature stats:** The existing `soldier`/`archer` routing classes continue
  to own *only* existing movement/engagement mechanics; authentic species plus
  exact melee/ranged subtype owns distinct friendly base HP, damage, armor,
  movement speed, attack interval, melee reach / ranged distance, withdrawal
  distance, projectile style and speed. All profiles for the 10 authored
  ordinary species live in `R.balance.companions.charmed`, not in copied
  hostile actor state. Companion max HP and armor apply normal level/Vitality,
  Expedition inheritance and equipment rules. Non-Charmed soldiers, archers
  and boss pets remain on their prior tables.
- **Combat and AI:** Native party selection, line-of-sight, navigation,
  tactical caution, combat interruption, recall and region travel are reused.
  Captured melee and ranged creatures retain profile-based spacing, movement,
  attack cadence and damage. Captured ranged species have a finite, bounded
  allied triage action using the existing authored enemy-support healing
  fraction, threshold, range and cooldown. They do not inherit Soldier Guard,
  Holy Cleave, Ranger Triple Shot or ordinary Ranger support/cast actions.
  Rogue musical repertoire and critical mechanics remain unimplemented.
- **Identity and visuals:** Every newly Charmed actor keeps its Phase 3
  automatic current-language permanent name, full HP, sourceZone audit
  metadata, unique hostile source receipt and actual species/subtype.
  Renderer inputs use existing enemy sprite keys and procedural species
  drawings for Charmed allies, including in foreign regions. Both Canvas 2D
  and Pixi use these shared sprite/procedural sources; no art was newly
  published. The source zone is never an eligibility/travel restriction.
- **Labor:** Authenticated captured soldiers/archers qualify for the existing
  `availableLabor()`, `canGatherTribute()`, field gathering/deposit and
  resource-expedition pathways. Normal alive, active, idle, mission, rank and
  proximity constraints still apply. `build()`, `assignBuilder()`,
  `upgradeBarracks()` assign an actual eligible party companion, never the
  Rogue hero. Finished Basic and Full Barracks keep existing construction,
  progression, payment and group-cap rules.
- **Persistence/recovery:** Version-4 serialization retains lawful Charmed
  local construction (including unfinished normal Barracks), paid upgrades,
  resource gathering/deposit journeys, and existing expedition reservations.
  Validation still rejects a solitary forged `charmOrigin` without its
  exact source record, checks each subtype/role and per-rank ownership quota,
  and bounds ranged support cooldowns. Recovery preserves the same companion
  ID, personal name, species/subtype, ledger, active/reserve status and
  level-derived friendly max HP. Travel and Succession use the ordinary
  global party and available slot management.
- **Company UI:** Native Company, Manage Group, Charmed Monsters and Boss Pet
  Collection remain in the existing Barracks, using bounded pages of 8
  persistent IDs. Each subtype page cycles All, Active, Resting, Fallen, Away.
  Group and type summaries show status, active caps and reserves.
  Rest/Add actions revalidate the existing native eligibility before mutation.

## Implementation commits

1. `c45f47fa4a17c3a3f264c017e5342e09866a95a5` — species statistics, movement/combat baselines, native capture growth, recovery and canonical species appearance.
2. `2924cb92bd52cfd1152fc3d0ed6b321a949ea2b2` — authenticated build/upgrade work-order persistence and Charmed status filtering.
3. `355e78f7f7ed25bbc631e94c1f928ecb54a1444b` — native Phase 4 regression test including the no-worker/no-Barracks starting gate.
4. `d4da3f3cd6abdcab06ecf877b3c75c271d70a9e6` — authored ranged support AI, bounded support cooldown persistence, regression coverage.

This document is a **source implementation record**, not an assertion that
the latest code head has passed CI, complete browser playthrough or real-device
acceptance. Confirm the Actions run associated with the final implementation
commit before upgrading its state to focused-validated. The focused suite must
include the new `tests/rogue-bard-phase4-companions.test.cjs`, ordinary
class/companion/save regressions, and `npm run build` reproducibility.

## Safety and future-phase exclusions

The Rogue Bard remains **unregistered** in public class selection.
This branch stays the single draft PR #511, unmerged and undeployed.
No musical skills (Phase 5), critical mechanism/controller (Phase 6),
new sprite/audio/presentation or authored onboarding (Phase 7), or full
browser/phone/PWA acceptance and release (Phase 8) are claimed.
Completed class behavior and Phase 1–3 Charm/naming/heal design remain locked.
