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

Individual safety, Slow, writer, projectile/canister and original-fixture tests
have passed during implementation. Final integrated focused selection, build,
publication and any remaining failure are recorded in the repair PR. A source
checkpoint is not a release claim. Broad game/browser matrices remain manual
owner opt-in. Real-device/browser/PWA acceptance is not inferred from Node tests.

Preserve combat cadence, approved Slow strength/debt, first-kill onboarding,
boss warnings, collision and fort permissions, progression, companion/pet roles,
v4 saves, selected art, Canvas/Pixi choices, dev.174 resolution behavior and the
multi-file GitHub Pages/PWA architecture. No simulation-work optimization is
included in these repairs.
