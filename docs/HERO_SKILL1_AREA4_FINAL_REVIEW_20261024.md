> **Historical checkpoint:** [PR #439](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/439) merged on 25 October 2026. The draft, implementation and next-step directions below describe that earlier candidate; they are not an instruction to resume or re-merge it. Consult [Development state](DEVELOPMENT_STATE.md) and current source for present behavior and acceptance.

# PR #439 — Integrated code review and focused validation

**Candidate:** 0.9.1+snapshot.dev.178, continuing draft branch
`design/hero-skill1-self-taught-combat-20261024`.
**Integrated base:** published dev.177, `ae0c0084c90a397738376f851d1d22c902c67279`.
**Release status:** draft, unmerged, unpublished. No main write or deployment was
performed. Neither PR #436 nor unrelated Critical Executions PR #440 was merged.

## Completed work

1. Reproduced and repaired both handoff failures. Audio now enters a legally
   engaged Thornfang encounter and refreshes the earned throne before claiming
   peace. Skill references assert independent normal/charged timers and wait for
   actual hawk contact. The reference audit exposed and fixed omitted shared
   **+0.25s landed Slow duration** in player-visible figures.
2. Implemented the owner's same-slot FIFO stacking across Skills 1–8. Distinct
   IDs, repeated forms, stable order, independent other slots, a 16-entry cap
   with bilingual rejection feedback, and contact-specific cancellation replace
   the old single-request overwrite. Full order/form is accessible in button
   labels/titles; compact C/N order and gold/blue world markers remain bounded.
3. Preserved quick-tap/hold thresholds, genuine preparation after readiness,
   interruptions, no-chase releases, Recall and lifecycle clearing. A short tap
   lowers active Shield Stance without erasing an older queued Shield Bash.
4. Audited optional Rogue regroup/escape, withdrawal motion and ranged
   backpedal, including eligible bosses. Suppression affects only the interrupted
   family. Committed attack warnings, Thornfang opening, safety returns, offensive
   aerial motions and boss healing requirements remain protected. Abyss
   Go-Around retains its flight-earned heal; it is not treated as an optional
   free retreat. There is no blanket boss immunity.
5. Fixed two integration defects discovered through tests: Slow's hit-time debt
   now reaches positive charged/basic timers as well as normal timers; a hawk
   at oblique boss contact no longer hovers at a floating-point residue. Its
   comparison tolerance is **0.0000001 world unit**, not a meaningful range buff.
6. Integrated the published bounded save checkpoints and runtime workload fixes
   from current main. Existing v4 saves, recovery keys, packaging, Canvas fallback
   and renderer choices remain supported. Changed runtime files use the pinned
   formatter; package/lock/generated version agree.

## Verification and its limits

- [Successful integrated focused CI checkpoint](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40160105253),
  source `6e18a094d58aa71bf3c039b039edd4d2f73882cc`: **38 relevant files passed**;
  build passed; publish skipped. This predates the final oblique-contact
  correction and extra original-suite upkeep. The **latest PR check** is the
  authority for that final head; do not substitute this checkpoint URL.
- New integration checks cover **144** class/rank/training/slot combinations
  (ranks 1/4/8, training 0/5), dual clocks, stacked Slow debt/recovery, v4 hero and
  companion timers, crowd caps, delayed-effect travel cleanup, all eleven pets'
  independent first/second clocks, unchanged basic combos and oblique hawk
  contact at 60/30/10 simulation updates per second.
- The production-shell suite executes English/Spanish keyboard and pointer/touch
  paths: exact Charged→Normal ordering, four alternating requests, normal-ready
  non-overtaking, independent slots, duplicate forms, ambiguous release, contact
  cancellation, queue-full feedback, menu/blur/travel, interrupted preparation,
  invalid target, no-heal and Shield Stance. This is real shell code with a DOM
  harness, not browser/device certification.
- Dedicated retreat tests and the original 54 charged-opener cases pass; the
  original cooldown-only, consolidated hero forms, companion interruption and
  pet activation suites were reconciled and passed. Their old opening fixtures
  also failed on untouched dev.177; they now perform native opening admission.
  Original cooldown assertions now check both clocks. Silence still blocks the
  activated Tap while independent ordinary basics remain possible.
- Area 2 checks use actual native Canvas surfaces in ordinary/reduced motion,
  plus original offline/muted audio and bounded event tests. All 22 existing pet
  visual effects remain in focused coverage. Packaging/generated syntax and
  changed-file formatting pass.
- **Browser/play acceptance remains open.** No Chromium binary was installed;
  Playwright's download returned invalid/truncated archives. No successful
  browser or Pixi/WebGL presentation journey, real audio listening, phone/device
  input latency, FPS certification or human balance acceptance is claimed.
- `npm run check` still stops on the inherited stale
  `prop:ore-sorting-bay:highlands` canon receipt. The other previously documented
  art-tool defects and unrelated repository-wide formatting warnings are retained
  in `RUNTIME_WORKLOAD_DEV177.md` / its audit. No art baseline was regenerated to
  conceal these failures. The focused packaging gate is separately green.
- No comprehensive game suite or full browser matrix was launched. Focused CI
  mappings now preserve these feature tests and affected original suites on
  future source changes.

## Action-economy observation

Reproducible probe: `tests/helpers/hero-skill1-balance-probe.cjs` with the dev.177
and candidate checkout roots. [Raw observations](evidence/HERO_SKILL1_BALANCE_20261024.json)
contain all 18 class/count/policy comparisons. These are 12-second deterministic
high-HP fixtures with enemy/companion AI disabled and automatic-basic permission;
no survival, encounter-duration or hardware conclusion follows.

| Class | Basic-only damage, before → after | Basics + repeated normal Tap, before → after |
|---|---:|---:|
| Paladin | 495 → 495 | 495 → 855 |
| Mage | 520.2 → 520.2 | 520.2 → 928.2 |
| Ranger | 489.6 → 489.6 | 489.6 → 873.6 |

The independent basic cadence is preserved. Total output increases when the new
activated action can run alongside basics; groups gain further from Cross/Beam.
That is the explicit design's action-economy change, and it deserves owner
playtesting. **No damage, cooldown, boss HP or companion strength was retuned.**

## Historical next review action (not a current work order)

> Read the current PR check and the owner-facing scope. Complete a bounded actual
> browser/play check when that environment is available, with particular attention
> to small-screen queue readability, class effects/audio and combined damage.
> Keep the draft and the approved initial numbers until owner review. Obtain the
> owner's explicit merge/publication authorization before releasing dev.178.
>