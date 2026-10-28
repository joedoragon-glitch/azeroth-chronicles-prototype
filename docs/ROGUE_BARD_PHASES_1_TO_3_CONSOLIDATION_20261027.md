> **HISTORICAL PHASE RECORD — 28 October 2026 correction:** [Rogue PR #511](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/511) is **merged and published** and Rogue/Pícara is playable in `0.9.1+snapshot.dev.208`. The “Current decision,” “Phase 4 READY TO START,” draft/unmerged, and unplayable language below describes **27 October only**. It is preserved as exact staging evidence, **not a current work order**. Use [Development state](DEVELOPMENT_STATE.md) and [Rogue soft-launch record](ROGUE_SOFT_RELEASE_20261028.md) for present implementation and remaining independent acceptance.

# Rogue Bard — phases 1–3 consolidated baseline and Phase 4 entry

**27 October 2026 · Draft [PR #511](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/511) · Documentation consolidation, no gameplay changes**

## Historical decision at the 27 October checkpoint

**Phases 1 Foundation, 2 Hero Basics and 3 Authentic Charm: COMPLETE AS STAGED / FOCUSED VALIDATED. Phase 4 Companion Integration: READY TO START, NOT IMPLEMENTED.** Rogue is not registered/playable. PR #511 remains draft, unmerged, undeployed; no release or broad test authorization.

## Evidence ledger

| Milestone | Accepted receipt |
| --- | --- |
| Phase 1 foundation | [Focused run 40476775121](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40476775121), source `bd1cbe83` |
| Phase 2 hero basics | [Focused run 40484652535](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40484652535), source `b915bc06` |
| Phase 3 authentic Charm | [48/48 selected native focused suites + reproducible offline-ready build](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40503909024), code head `f24f16ef934ca340bc1a4413f1ee404868493e53` |
| Closeout docs-only head | [Focused CI/build run 40505058428](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40505058428) passing on `922a9cc2f267dca27a41337a9f77fb065a81cd3c` |
| Main reconciliation | `main` `5c6197e871f8f4393d26d9b7a261b9324ef85d12` merged into draft branch at `dac13bcf`, 0 behind when verified |

The initial CI run after latest-main integration detected a stale **renderer source evidence fingerprint only**; reviewing the nameplate diff and updating that fingerprint resolved it. The native Charm test passed in both runs. The final selected focused suites and build are green. This is **not** manual browser, device, full-game suite or GitHub Pages certification; the Pages step was skipped.

## Contract frozen by owner until explicit revision

- **12%** independent Charm roll only for a legitimate HP-reducing, surviving Rogue automatic-primary hit against a vetted ordinary authored enemy. Never a manual song, splash-only victim, captain/ringleader/boss, prohibited actor or quota-blocked attempt.
- Capture exactly once as a permanent owned unit, keeping true species/melee-ranged subtype and authenticated source ledger; no kill/XP/loot/quest duplication, with v4 save/restore, Succession, travel and dismissal integrity.
- Rank 1–6 quotas **3/4/4/5/6/7 owned per exact subtype** across active/reserve/fallen/away, distinct from the Rogue's rank-based **3/4/4/5/6/7 active cap**. No 12-total-owned monster ceiling; capture does not require Barracks.
- On **every** lawful capture: immediately assign a permanent silly nickname from the current UI language's **70 English or 70 Spanish names** and restore **100% of proper friendly max HP**, active or reserve. Save independent language rotation/collision avoidance; old names never translate. No naming popup, opt-in toggle, naming/healing condition or naming tutorial.
- Rogue begins alone, cannot recruit new ordinary Soldiers/Archers and never builds Barracks herself. A Rogue reached by Succession retains inherited conventional troops, pets and Charmed ownership. Weapon is a suspended oversized spherical **jingle bell on a staff**, not the historical guitar. Normal/charged Skill 1 and 1HP/2s Endure are staged behind the disabled class gate.

## Historical Phase 4 handoff — implementation was then required

1. **Monster-specific friendly profiles:** subtype-specific HP/damage/armor/movement/role; apply normal companion hero-level scaling, Vitality, training and inheritance rather than retaining hostile/night/dungeon multipliers or generic Soldier/Archer baselines.
2. **Authentic allied AI and identity:** melee/ranged/support action, movement/targeting/retreat, death/recovery, native travel across any region, stable subtype/provenance/nickname, correct species appearance (avoid generic conventional troop fallback), Canvas2D safety and optional experimental Pixi fallback.
3. **Ordinary work orders:** every genuinely Charmed subtype can build/resume/upgrade Barracks, and gather/deposit at existing unlock rank, subject to normal live/idle/area/order/safety checks. Reuse existing labor logic, not a hero-builder exception, automatic pet grant or shortcut.
4. **Roster/Succession:** Basic Barracks local Add cap 3, Full local Add cap by effective Expedition cap, type-first/paginated and status-filtered management, active/reserve/fallen/away ownership, mixed inherited troops, save-v4 forgery rejection and exact-ID native recovery.
5. **Phase-specific regression gate:** actual labor completion/refusals, movement/combat/role, source authenticity, cross-region travel, save/reload, Succession and the original 3 classes; run smallest relevant native suites plus formatter/build on final code head. Do not widen automatically into full browser/device/release suites.

## Clearly deferred, not unfinished Phase 3 work

**Phase 5:** remaining seven normal/charged music pairs and owner-reviewed final 16 skill names. **Phase 6:** Rogue crit chance and fourth independently adjustable Rogue intensity. **Phase 7:** final static normal/crowned art, bell sounds, EN/ES/mobile and renderer parity, and authored **fresh Rogue Charm quest first → genuinely capture worker → Build Barracks quest**. **Phase 8:** measured multi-seed early acquisition/balance, full browser/device/offline PWA/performance/full-suite owner playtest and release decision.

These later dependencies **prevent public class registration/merge/release**, but do not invalidate Phase 3 focused acceptance. Recheck drift against current main before implementing Phase 4; never silently revise owner-fixed Charm probability, HP or naming behavior.

## Document authority and provenance

Current scope: [eight-phase handoff](ROGUE_BARD_EIGHT_PHASE_DEVELOPMENT_HANDOFF_20261027.md), [Phase 3 technical closeout](ROGUE_BARD_PHASE3_TECHNICAL_CLOSEOUT_20261027.md), [Charm and Barracks contract](ROGUE_BARD_CHARMED_ROSTER_BARRACKS_CONTRACT_20261027.md), [canonical owner handoff](ROGUE_BARD_CANONICAL_OWNER_HANDOFF_20261027.md), [Phase 2 source receipt](ROGUE_BARD_PHASE2_HERO_FOUNDATION_20261027.md), and [original owner discussion record](ROGUE_BARD_DISCUSSION_RECORD_20261026.md) as chronological character/design evidence. The [full old PR description](ROGUE_BARD_PR511_DESCRIPTION_ARCHIVE_20261027.md) is deliberately archived, **not current authority**. Earlier proposals remain readable but are explicitly superseded where they disagree with the binding Charm/naming/healing rules.

**Historical proposed next phase (not a current work order):** confirm branch head/main drift and CI, read Phase 4 work boundaries, implement only approved companion integration, validate focused native behavior/build, update this same draft PR. No public class registration, merge, deploy or full certification without separate authorization.

## Phase 4 continuation (27 October 2026)

Phase 4 is being implemented **on the same draft PR #511**, without changing this Phase 1–3 closure. Consult the [Phase 4 companion-integration implementation record](ROGUE_BARD_PHASE4_COMPANION_INTEGRATION_20261027.md) for candidate code, contracts, testing gate and current unmerged/non-playable boundary. Do not infer CI success from an implementation commit alone.
