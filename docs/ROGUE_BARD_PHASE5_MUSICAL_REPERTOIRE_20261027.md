> **Later Phase 6 update:** The remaining fourteen manual Rogue critical releases are staged and a developer-only intensity group defaults to Level 2; there is **no player-facing slider or profile preference**. [Phase 6 continuation](ROGUE_BARD_PHASE6_NATIVE_CRITICAL_CONTINUATION_20261027.md) supersedes earlier pending-Phase-6 statements below; Phase 5 naming and station tuning remain owner-provisional.\n\n> **Live checkpoint:** See [Phase 5 / Phase 6 restart checkpoint](ROGUE_BARD_PHASE5_PHASE6_RESTART_CHECKPOINT_20261027.md). All seven additional song families are staged, not final-accepted. Full native critical wiring and playtesting remain pending.

# Rogue Bard — Phase 5 musical repertoire implementation checkpoint

**27 October 2026 · draft PR #511 · implementation begun, not complete or approved for release.**

The authoritative [eight-phase handoff](ROGUE_BARD_EIGHT_PHASE_DEVELOPMENT_HANDOFF_20261027.md)
defines Phase 5 as **seven remaining tap/charged pairs (Skills 2–8, 14 total
forms)**, all requiring combat-only legal hostile AoE with independently
applied, conceptually inverse beneficial AoE to living, active, in-range
companions. All 16 performance titles received a short, cheeky bell-staff naming pass; these are working names for owner playtesting, not settled lore. Skill 1 from Phase 2 is preserved.

The first implementation slices comprise **Skill 2** (native enemy
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

**Next staged slice:** Skill 7 Wrong Foot / Panic Party has native collision-safe push/Weaken and a same-area Firm Footing ally outgoing-damage boon, with nonstacking expiry and no persistent stat mutation. The corresponding numerical effects are still provisional.

**Next staged slice:** Skill 3 Beat Breaker / Shut the Band Up interrupts an actual warned/aiming native enemy action, and grants Steady Beat protection against damage-threshold cancellation of a live companion charge. Charged hush is transient and limited to ordinary eligible non-boss special starts. Death, target legality, scripted phases and other cancellation paths are unchanged.\n\n**Next staged slice:** Skill 4 Sour Note / Rotten Chorus holds a finite hostile DoT and anti-healing budget, plus a finite same-area companion HoT and increased separately delivered Ranger support healing. It does not amplify its own HoT, revive allies or store effects in saves.\n\n**Next staged slice:** Skill 8 Bad Bell Day / Last Laugh delivers bounded enemy bell blasts and a short companion Finale: +4/+6pp individual critical chance and +4/+6% lawful Soldier/Archer special damage. Bonus chances feed the existing *opt-in* Party critical source (not a Rogue critical effect receipt); the Rogue's own Phase 6 controller is still absent. Charged non-boss hush reuses the Skill 3 short special-start gate.\n\n**Last staged slice:** Skill 5 Sticky Shuffle / Briar Boogie is a **provisional** magical bell station, not a physical trap. Its bounded lifetime, two-station cap, enemy pulse target caps, Slow and charged small damage, and inside-only allied Slow resistance/ward require device/gameplay owner review before the station concept itself becomes canonical. All station state is weak/ephemeral and is absent from saves; it is canceled by class, region, hero death or peace transitions.\n\n**Not yet complete:** owner acceptance of the Skill 5 station concept, final naming, browser/device balance, and full Phase 6 critical implementation. The 17 Rogue critical keys and Level-2 default are authored; native execution is currently attached only for automatic basic and manual Skill 1 tap/charged. Fourteen other native action receipts and a visible/persistent slider remain pending. No new art/audio, tutorial, public class registration or release.
The numeric configurations here are first-pass candidates, not final balance.

The focused test `tests/rogue-bard-phase5-repertoire.test.cjs` checks learned
gating, no-op invalid casts, charged/tap variants, legal hostile Slow/debt,
same-area ally boons, nonstacking and expired effects, saved-data isolation,
no Charm RNG changes and old-class behavior. The PR's focused CI and
reproducible build must pass at the **new** head before these claims can be
marked verified. Phase 4 also requires its previously failed CI to be
revalidated following the focused-CI parser repair at `b7c0c1d`.
