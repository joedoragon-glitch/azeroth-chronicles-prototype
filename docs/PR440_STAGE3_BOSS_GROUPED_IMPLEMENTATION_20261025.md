# PR #440 — Grouped boss critical-action implementation checkpoint
**25 October 2026. Draft PR only — no merge, release, deployment or automatic player activation.**

Repository `joedoragon-glitch/azeroth-chronicles-prototype`, branch
`design/critical-executions-codices-20261024`, source head at documentation drafting
[`7e1db5419da21bb07e7425c6b5bff10f9ada3e28`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/7e1db5419da21bb07e7425c6b5bff10f9ada3e28).
Earlier tested baseline: [`93b71477`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/93b71477e89902046ce6d68c7025d147eda497f8),
[focused CI #40242302991](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40242302991) success.

## New source coverage — implemented candidate, NOT certified
The **93 existing Party** native keys and **21 of 21 existing captain specials** remain intact.
The original `R.attacks` catalog has exactly **54 authored boss actions in eleven
families**. All 54 now have exact `world/boss/<family>/<index>` registry keys
(82 World keys total including 7 basic/night/Rogue, 21 captains, 54 bosses).
**This count establishes registered candidate coverage, not a passed native-action matrix.**

Two grouped source commits on this same draft:

1. [`caaaa676`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/caaaa67655316d05e2ffb80456882ac029d5082d):
   44 additional authored keys across Thorn, Crypt, Mire, Archive, Ridge, Mine,
   Warlord, Abyss, Citadel and Dark Lord. Shared boss release owners,
   one-receipt queued beats, direct-area consequences, real cargo and volley
   projectiles, nine original canister pellets, physical charges, delayed
   landing, hazard/ring onset, actual newly admitted summon vitality, Crypt
   defensive window, original push distance, Archive cooldown sabotage,
   Citadel formation and checkerboard, and Royal Taxation window.
   The former three source-verified boss keys remain.
2. [`7e1db541`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/7e1db5419da21bb07e7425c6b5bff10f9ada3e28):
   all seven Cindermaw original indexed specialist keys through its **own**
   `cindermaw-combat.js` owner: Cordon's final blast only, physical Distraint,
   original protection-duration window, sequenced Seals, Equalisation's original
   hit/heal chain, a single receipt inherited by the original delegation/
   finisher motion, and actual new responder vitality. Ordinary Cordon ring
   burns and unrelated retaliations do not silently gain critical damage.

**Invariants of the candidate:** No universal boss fallthrough, no changing
the authoring attack tables, no added summons/targets/projectiles/telegraphs,
no bonus environmental hazard ticks, no critical reroll per stage or victim,
no immunity/collision/terrain bypass. All mechanics require the dormant
opt-in World session and are absent from production's installed runtime.

## Focused test coverage submitted with source
- `tests/critical-levels.test.cjs`: all 54 boss-action identifiers and their
  exact proposed typed levers, 82 World + 93 Party registry count.
- `tests/critical-world-boss-batched-native.test.cjs`: real Thornfang
  physical landing/summons and Ridge cargo/charge across Normal and TRUE,
  three strength levels, failed spawn/cancellation, unchanged native shapes.
- `tests/critical-world-boss-cindermaw-native.test.cjs`: real Cindermaw
  Distraint, original allied Protection and responder summons, Normal/TRUE
  and all three levels.
- Existing targeted Thornfang/Ridge original cone tests updated for their now
  independent cargo/landing action ownership.

**Validation blocker:** No exact-head focused GitHub Actions workflow result
was returned for either grouped implementation commit at this checkpoint.
Do not treat registry/test authorship as test success. Run or obtain applicable
focused CI and repair failures on the same draft before calling Stage 3
accepted. No broad browser/game/performance/device matrix was requested.

**High-priority follow-up native gates:** Cindermaw Cordon legal gaps and
delegated multi-member finisher; Crypt push+ring; Mire already-mitigated
Death Roll; Archive Slow-area and sabotage; Mine double wave and sequential
placement; Citadel board, formation, pattern charge; Dark Lord three-stage
combos and taxation; all Normal/TRUE, Normal/Nightmare, no-critical parity,
no illegal RNG releases, cancellation/reset/v4 snapshots. Check relevant
existing specialist/snapshot suites rather than substituting new fixtures
for original owner tests. Confirm that any persistent `criticalExecution`
receipts are stripped by the existing v4 snapshot reset.

## Integration and Step 2 readiness
- **Current owner execution policy:** same draft PR #440, coherent source
  batches, proportionate focused testing; concentrated final cross-system,
  device, FPS and balance gate only on separate owner authorization.
- Main advanced while this source was authored; latest seen `9b215ea5`,
  branch **six commits behind main** at this checkpoint. Integrate
  safely on this draft at the appropriate owner boundary; preserve unmerged
  #464 physical Ranger/Archer/pet projectile semantics and #458 TRUE boss
  pursuit. Neither independent PR has been integrated/tested with #440.
- Production Critical Executions **OFF** and draft **unmerged/unpublished**.
- **Next stage after Stage 3 focused green checks:** the five secondary-dungeon
  Codices, one-time claim flags, read-time Hero/Companion chance and inherited
  book bonus, deterministic independent RNG controllers, v4 restore/migration,
  and English/Spanish UI/reference. The old +1 percentage point/book and
  Shared Training rules remain **unapproved numerical proposals**; do not
  silently lock these into player-visible balance.
- Later stages remain critical `!` presentation, cross-PR integration,
  final acceptance, explicit owner merge/activation/deploy choices.

**Single next engineering action:** obtain exact-head focused feedback for
the grouped boss commits and fix any new native failures, then start the Codex
save/reward implementation inside this existing draft PR once Stage 3 has
sufficient verified mechanical acceptance.
