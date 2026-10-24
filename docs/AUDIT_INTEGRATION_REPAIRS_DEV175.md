# Audit integration repairs — dev.175

Owner authorization: fix the remaining six significant findings together,
one at a time, and investigate the recurring stale-test pattern. Base production
is dev.174 / `2e22989252af7af232487f993fec39c24318ac07`; retain its resolution fix.

## Runtime corrections

- **F1:** Failed-load slots reject automatic writes; title-screen lifecycle
  saves require a started campaign. A dedicated English/Spanish recovery menu
  offers raw original export, import and an explicitly confirmed new run.
  Replacement preserves the first and latest unreadable originals in bounded
  mode-specific backups. A missing other-mode run cannot cause fallback to
  overwrite an existing Normal save. Snapshot validation precedes every write.
- **F2:** Hero cooldown validation uses the existing persisted-actor numeric
  ceiling of 1e9, allowing authorized lasting Slow debt above 60 seconds without
  capping gameplay debt. Negative, nonfinite and excessive input stays invalid.
  Native 20-hit elite Slow cases round-trip in Normal and Nightmare.
- **F5:** Enemy projectile contact checks compare swept actor entry with the
  first blocking terrain contact. A wall behind a target no longer wins merely
  because a larger update reaches both. Existing actor iteration priority,
  fort launch rights, widths, cargo handling and footprint/lifetime owners remain.
- **F6:** A Web Lock gives one same-origin game/PWA window exclusive campaign
  write ownership. Other windows pause and offer export/reload. Ownership is
  acquired before saving/restart recovery and released on pagehide; bfcache
  restoration reloads fresh progress. Optimistic byte checks additionally reject
  stale writes, including interference from an older non-locking client. PWA
  controller changes do not discard an owning client's unsaved run after a
  failed save. Unsupported HTTPS browsers fail closed with export/reload guidance.

The writer lock is global to the app origin so mode switches and profile writes
cannot race between windows. It does not change the v4 campaign shape or keys.
File-based development/test adapters retain byte-conflict protection without
requiring browser APIs. Browser-lock semantics follow the Web Locks API;
multi-window focused tests use a controlled lock manager, not device certification.

## Why the tests repeatedly drifted

Two independent gaps compounded each other:

1. Fixtures created artificial states by setting level/aggro without satisfying
   the later native admission rule. Increasing level is not the dev.162
   first-kill boundary. The shared post-opening fixture now performs an actual
   hero-involved kill and asserts that admission happened.
2. Dedicated regressions selected themselves when first added, but later
   source-only edits often selected generic architecture checks. CI now maps
   persistence, save, runtime, rules, onboarding, navigation, shared combat and
   boss geometry to their relevant existing contracts. Mapping-policy tests
   protect these edges, and missing mapped tests fail explicitly.

Historical anchors: dev.96's accepted reach update (`7eea76c7`, 20 October),
dev.161 opening admission (`77780ab4`, 21 October), the subsequent first-kill
rule, and Slow stacking/debt (`b89abaaf`, 24 October). The three original failing
suites were not all reconciled with these changes. This is evidence of incomplete
integration verification; it does not prove the accepted mechanics are wrong.

**F7 originals repaired:** `ranged-pet-support`, `enemy-support-healing` and
`snapshot-encounter-lifecycle`. Negative cases remain. Groundwork keeps the
independently reviewed 86.4-unit expectation; the two pet Slow cases keep reviewed
2.25/1.25-second expectations, rather than reproducing the resolver's formula.
No protected historical fixture or original hash is regenerated.

## Focused checkpoint and preservation

The integrated focused selection passed **21 test files**, with no uncovered
changed source paths or missing mapped regressions. It covers app/menu behavior,
historical saves, restart and critical recovery, persistence and writer safety,
onboarding, companion healing/support, combat conditions, projectile/canister
boundaries, Slow debt, encounter lifecycle, resolution, PWA release/cache logic
and CI selection policy. Encounter lifecycle includes 72 cases and six historical
restores. After additional asynchronous ownership edge cases were repaired,
the five affected app/menu/persistence/restart/writer suites were rerun successfully.
The owner-refresh tests also retain Developer mode and earned Nightmare access;
a fresh successful load dismisses an obsolete failed-load prompt.

`node scripts/build.cjs --check` passes: dev.175, 217 campaign assets and 14 optional
historical assets. Changed JavaScript/test files pass syntax, Prettier and
`git diff --check`. Reproduce the focused selection after checking out this branch:

```sh
CI_BASE_SHA=2e22989252af7af232487f993fec39c24318ac07 node .github/scripts/focused-ci.cjs
node scripts/build.cjs --check
```

The full `npm run check` is **not green**. The sprite checker reports a stale
`prop:ore-sorting-bay:highlands` canonical reference; sprite-scope reports missing
March terrain source evidence; the material checker reports `require is not defined`.
Each failure also reproduces on an unchanged dev.174 checkout (its sprite check
lists 17 stale references, including that prop). Enemy audio coverage passes:
264 identities and 1,962 stage/variant decisions. Global formatting has 16 inherited
warnings, down from 21 on unchanged dev.174; touched code is formatted. No art
approval, source evidence, immutable fixture or unrelated source is rewritten to
silence these checks. These inherited tooling failures remain separate work.

The initial recoverable source checkpoint is `3585af1d`; this document and final
source are retained on `fix/audit-integration-safety-20261024`. No PR, merge,
deployment, comprehensive test suite or browser matrix is authorized by the
original read-only audit mandate. The later instruction authorizes these scoped
repairs; PR creation, merge and publication remain pending explicit approval.
Real-device/browser/PWA acceptance is not inferred from Node tests.

Preserve combat cadence, approved Slow strength/debt, first-kill onboarding,
boss warnings, collision and fort permissions, progression, companion/pet roles,
v4 saves, selected art, Canvas/Pixi choices, dev.174 resolution behavior and the
multi-file GitHub Pages/PWA architecture. No simulation-work optimization is
included in these repairs.
