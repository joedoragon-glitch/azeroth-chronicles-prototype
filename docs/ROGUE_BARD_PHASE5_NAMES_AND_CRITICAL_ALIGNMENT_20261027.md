> **Current handoff:** [Phase 5 / early Phase 6 restart checkpoint](ROGUE_BARD_PHASE5_PHASE6_RESTART_CHECKPOINT_20261027.md). Working names are not final approval.

# Rogue Bard — playful bell-staff naming and documented critical contract
**27 October 2026 · draft PR #511 · owner-directed naming revision.**

These are *first-play working titles* pending owner playtesting and approval, not a new combat design. The earlier classical/concert names were overly ornate for this cheeky, shameless, bell-staff-wielding trickster. No skill geometry, targeting, damage, duration, boon, cost, or Charm mechanic changes as a consequence of this rename.

| Slot | Tap — working title | Charged — working title | Same existing mechanical pair |
| --- | --- | --- | --- |
| 1 | Ding and Sting | Raise a Racket | Enemy bell shock / ally basic-damage boon |
| 2 | Lead Feet | Can't Dance | Enemy Slow / ally speed and cooldown |
| 3 | Beat Breaker | Shut the Band Up | Enemy interrupt/Silence / ally cast protection |
| 4 | Sour Note | Rotten Chorus | Enemy DoT and anti-heal / ally HoT and heal amplification |
| 5 | Sticky Shuffle | Briar Boogie | Enemy stationed Slow/pulses / ally inside-field Slow resistance/ward (station still design-provisional) |
| 6 | Stolen Beat | Time Out | Enemy cooldown debt / ally special cooldown acceleration |
| 7 | Wrong Foot | Panic Party | Enemy push/Weaken / ally damage/stability |
| 8 | Bad Bell Day | Last Laugh | Enemy area damage/disruption / ally critical opportunity/special damage |

The definitive numeric critical design **already exists** in [the 16-action critical catalogue](ROGUE_BARD_DUAL_SIDED_PERFORMANCES_CRITICAL_TIERS_20261027.md), with one documented tap/charged effect lever per slot, three critical-intensity levels, and a separate Rogue slider. **New owner decision: Rogue's default is Level 2 in all game modes; Hero, Companion, and World remain Level 1 by default.** Only *display titles* change here; stable numeric skill slots and `hero/rogue/{slot}-{tap,charged}` keys must never depend on translated names. **Current partial implementation:** the distinct Rogue Level-2 group, +2pp/hero-level chance bonus and all 17 authored critical keys exist. Native critical releases are currently wired only for the automatic combo/basic action and for manual Skill 1 tap and charged: three separate keys, one frozen Party-stream decision each. The other 14 skill-form critical consequences, visible slider, settings/persistence and full validation are pending. The existing critical system for other classes must remain unchanged. All 16 normal/charged critical consequences and the additional automatic-basic key remain required. A legal cast must roll a single critical using the existing Party stream; if critical, only its registered lever enhances the lawful outcome at Rogue Level 1/2/3; no separate ally/hostile rolls, new status family, bonus Charm rolls, or random streams. The full Phase 6 implementation needs independent tests and settings/save migration before acceptance.

**Validation caveat:** current PR #511 CI run [40514168520](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40514168520) passed the focused Phase 4 and early Phase 5 suites, but failed a *source-only* sprite evidence fingerprint because the Phase 5 numerical configuration edited `rules.js`; the test did not find a sprite-family scope difference. Refreshing evidence requires exact-art/code review; do not bypass its canonical guard.
