# Rogue Bard — Phase 5 musical repertoire implementation checkpoint

**27 October 2026 · draft PR #511 · implementation begun, not complete or approved for release.**

The authoritative [eight-phase handoff](ROGUE_BARD_EIGHT_PHASE_DEVELOPMENT_HANDOFF_20261027.md)
defines Phase 5 as **seven remaining tap/charged pairs (Skills 2–8, 14 total
forms)**, all requiring combat-only legal hostile AoE with independently
applied, conceptually inverse beneficial AoE to living, active, in-range
companions. All 16 performance titles received a short, cheeky bell-staff naming pass; these are working names for owner playtesting, not settled lore. Skill 1 from Phase 2 is preserved.

The first implemented vertical slice comprises **Skill 2** (native enemy
Slow / allied Quickstep movement + cooldown recovery) and **Skill 6**
(enemy not-ready cooldown debt / allied Borrowed Time special recovery).
Both have normal and charged forms, legal-target LOS/range gates, fixed
maximum hostile targets and independent active-allied recipients. A common
bounded WeakMap stores at most one Quickstep and one Borrowed Time record per
party actor, keyed by exact in-memory actor and region; boons never enter
v4 campaign saves. Stronger reapplication and later expiration win within a
family without additive stacking. Native movement uses the greater of Ranger
Rally and Quickstep rather than multiplying them. The common combat cooldown
clock applies Quickstep to party cooldown recovery; it adds Borrowed Time
only for legal special cooldowns, with combined acceleration capped at +25%.
Enemy Skill 6 debt affects only known, non-ready cooldown fields.

**Not yet implemented:** Skill 3 anti-interrupt, Skill 4 HoT/anti-heal,
Skill 5 dual-polarity station (design still partly provisional), Skills
7–8 damage/crit group boons, final name acceptance, and all Phase 6 Rogue critical
mechanics. No new art/audio, tutorial, public class registration or release.
The numeric configurations here are first-pass candidates, not final balance.

The focused test `tests/rogue-bard-phase5-repertoire.test.cjs` checks learned
gating, no-op invalid casts, charged/tap variants, legal hostile Slow/debt,
same-area ally boons, nonstacking and expired effects, saved-data isolation,
no Charm RNG changes and old-class behavior. The PR's focused CI and
reproducible build must pass at the **new** head before these claims can be
marked verified. Phase 4 also requires its previously failed CI to be
revalidated following the focused-CI parser repair at `b7c0c1d`.
