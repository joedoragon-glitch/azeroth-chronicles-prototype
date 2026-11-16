# v0.9.2 — hero automatic-basic fallback and Slow pressure review (16 November 2026)

## Authority, scope, and source baseline

Owner decision (16 November): while the player has selected or held an enemy beyond the protagonist's **automatic basic-attack** range, the protagonist may continue passive covering fire at another nearby **lawfully eligible** enemy. This does **not** clear or replace the player's selected/locked enemy, redirect explicit manual skills, create automatic pursuit, override a deliberate skill-approach order, abandon Recall or change the basic cooldown. Source comparison baseline: `main@bd967ac4c4d0870262d547ee2cbcde5b79c31c5d` (published dev.290); this is a draft candidate, not the published build. Integration must recheck the latest main and the independently unmerged tutorial PR #868 before merge.

Implementation is confined to `src/prototype/hero-combat.js` (the four-class automatic-basic resolver), new native regression `tests/v092-hero-auto-basic-target-fallback.test.cjs`, and regenerated `sw.js` source fingerprints. No save-v4 schema, balance coefficients, movement, skill cooldowns, input mapping, renderer or enemy AI were changed.

The shared helper `automaticBasicNearbyFallbackAllowed(selected, range, targetId)` returns true only where no explicit target ID was passed and either no manual selection exists or the selected enemy lies beyond **that class's basic reach**. Rogue bell auto attacks and Paladin/Mage/Ranger ordinary auto attacks use this same gate. Selection and held LOCK remain intact, and the existing manual skill resolver still attacks its selected enemy or undertakes the lawful approach-and-release order. An in-range selection blocked by line of sight does **not** silently retarget to another enemy. The existing target-eligibility filters continue to govern fallbacks; introductory hero-first protection and all other authorizations remain enforced.

## Verification, with evidence boundaries

- Read-only, pre-change measured cadence audit: [Actions #43864230223](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/43864230223), **PASS** on 67 controlled native fixtures. Four classes, Rank-0/Rank-5 training, 60/30/5 FPS synthetic frame schedules, sustained Slow, actual impact-time debt and lock/skill behavior. This audit predates the targeting fix and uses the engine with an emulated browser probe; it is **not** a physical-device or actual browser FPS measurement.
- Targeting candidate: [native focused Actions #43870644292](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/43870644292) checked the minimal authored fallback source. The 52-case four-class native target/lock/manual skills/line-of-sight/Slow/onboarding suite and related Skill-1, Rogue, Slow, and 144-case dual-clock engine regressions passed. The build procedure regenerated and verified a worker fingerprint from the source; formatting remained limited to the new test to avoid whole-file source churn. The temporary workflow was removed after its evidence run.
- The historical `tests/targeting.test.cjs` suite fails on the unchanged base and on this candidate. The candidate's first visible failure is an Archer companion threat-recognition assertion at 275 world units, outside the new hero-basic resolver. Treat the entire old suite as **baseline-red**, not passed and not proof that the companion issue has been repaired. No unrelated companion behavior was changed.
- These source-level and engine-native checks do not certify an earned full-campaign run, actual mobile/desktop browser timing, PWA installation/update, or physical-device acceptance. This draft is **unmerged and unpublished**.

## Additional Slow audit — assessment only, NOT implemented in this patch

Existing shared Slow mechanics include reduced cooldown-recovery speed and *separate impact-time cooldown debt* on each non-ready attack timer. With maximum Cooldown Training, ordinary Paladin/Mage/Rogue basic cooldown is 0.68 seconds (Ranger at Level 1: 0.6715 seconds). A four-stack Slow leaves only about **31.7% cooldown recovery** while active; each 2-second Slow hit gains the existing 0.25-second duration bonus and adds `2.25 × 0.35 = 0.7875` seconds of impact-time debt to an already-recovering basic, up to the four-stack allied cap.

The native audit measured a **5.37-second gap** from the original auto attack to the next after four rapid Slow hits in an otherwise unobstructed 60-FPS training-max scenario; with sustained, debt-free four-stack Slow the native rate was about **2.15 seconds per basic**. This severe combined suppression can make the character appear dormant even though the timer mechanics are functioning correctly.

### Review-only alternatives for *automatic basics* after four rapid hits

| Policy | Next attack after original, seconds | Status |
| --- | ---: | --- |
| Keep current four impact debts + slowed recovery | ~5.37 | Native-measured current behavior |
| Cap impact-time debt at one Slow hit, still use four-stack recovery | ~3.02 | Analytical model, **not implemented** |
| Remove additional impact-time debt from `hero.basicCd`, still use four-stack recovery | ~1.93 | Analytical model, **not implemented** |

The comparison fixes the initial basic attack at time 0, advances an ordinary 0.1-second simulation tick, applies four simultaneous 2-second Slow hits, and uses 60-FPS cooldown steps until the next legal attack. These are controlled stress bounds, not typical encounter-frequency measurements.

**Recommendation for separate owner acceptance:** basic attacks should continue recovering more slowly under Slow, including multiple stacks, but should not also accumulate the same impact-time cooldown debt as high-value special skills. This preserves meaningful suppression of attack speed while preventing a short control episode from creating a multi-second passive offense lockout. Retain existing special/charged, companion and enemy debt/recovery contracts unchanged until separately reviewed. The owner authorized this review, **not** an unapproved Slow balance rewrite in the targeting patch.

## Integration safeguards

The tutorial draft PR #868 adds `automaticHeroTargetAllowed(e)` to prevent passive auto-attack initiation of unengaged bosses and captains. An eventual integration must retain that stronger candidate eligibility rule for both the selected target and any fallback, including Rogue secondary splash; do not regress elite initiation to the older `awaitsHeroAttack`-only test. Regenerate `sw.js` from the **latest integrated source and release version**, not a stale branch fingerprint. Re-run relevant four-class target/elite/manual-skill, save/PWA and focused CI gates on the exact integration head. No merge or publication is covered by this workstream's implementation/testing authorization.
