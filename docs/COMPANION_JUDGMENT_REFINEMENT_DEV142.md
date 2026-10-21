# Companion judgment refinement — dev.142

Joel clarified that the work must improve the established companion combat behavior, keeping its working tactical logic, rather than replace it with a new survival policy. The dev.141 mandatory recovery to 40% HP is removed. There is **no replacement 25% recovery gate**.

## One tactical decision system

The existing `companionCautiousCombat` assessment owns withdrawal and rejoining again. It retains nearby allied support, wounded threat pressure, hero commitment, pursuit limits, 0.4-second regular observations and roughly 1.4 seconds of favorable conditions before rejoining. The existing critical threshold remains 20% HP: one nearby ordinary foe is enough to warrant withdrawal. Above critical health, tactical judgment can permit combat without requiring treatment to 25% or 40%. The older 40% wounded-pressure threshold remains a situational input, not a mandatory healing target.

Critical retreat refinements remain inside that assessment: use lower-pressure positions around the moving hero, account for ranged/boss reach, avoid an already-arrived unsafe formation point and use bounded physical local escape if a distant route is unavailable. Critically wounded units avoid offensive attacks while withdrawing. The existing catch-up pace, slowdown effects and movement-only retreat defense remain. Dev.140 friendly passage remains; enemies and terrain keep blocking.

Critical wounds cause the existing assessment to run before a pending attack or job can conceal danger. A newly critical actor cancels an unreleased offensive preparation, including damage late in the same tick. Unsafe construction, upgrades, gathering and delivery pause with orders, paid progress and cargo intact. A critical worker can continue a safe job when danger has gone. Healthy companions and the player keep their own orders. Recall, forced enemy holds and healing retain their established behavior.

The independent critical-survival driver and saved recovery latch are removed. Old dev.141 `survivalRetreat` flags are recognized, validated and stripped on restore. Only current health and runtime tactical observations govern caution; no new saved decision state or schema is introduced. English/Spanish feedback describes following and returning when conditions allow, with no promised percentage.

## Verification

Focused suite: `tests/critical-companion-survival.test.cjs` retains all 39 class/role combinations and adds real resumption of combat at 21% under favorable conditions, ordinary multi-enemy caution, obsolete saved-lock removal, clear-path Recall defense and safe-job continuation. Its current 62 scenarios also cover charge timing, independent healthy fighters, catch-up, work/cargo, healing, Recall/travel, ranged/boss reach, hostile collision, forced holds, walls and native terrain with actual ticks.

Existing automatic judgment, one-press Recall and all 108 retreat-passage cases pass. A bounded phone-shell check verifies actual critical withdrawal, visible situation-based feedback and absence of a saved recovery latch. Build/generated syntax and locked changed-source formatting are checked before publication. No broad CI/full-game or repeated device matrix.

This supersedes dev.141's fixed 40% recovery rule; its dated documentation and public receipt are historical evidence. The publication follows the standing owner package-only process, with exact live-build/source verification followed by normal workflow restoration and removal of the temporary publisher. Published in [PR #378](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/378), runtime merge `6dbc66d44d3670e20a76ef382fa64e7c303cda55`. Package-only run [39672336793](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/39672336793) succeeded. Exact public build and ten checked runtime files match. Normal workflow restored byte-for-byte and temporary publisher removed at closeout. Receipt: `docs/evidence/JUDGMENT_REFINEMENT_DEV142_PUBLICATION_20261021.json`. Owner phone play next; no automatic wider work.
