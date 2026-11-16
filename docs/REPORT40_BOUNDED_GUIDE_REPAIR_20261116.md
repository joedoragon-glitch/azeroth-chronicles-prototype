# Report #40 — bounded optional waypoint route repair (16 November 2026)

**Status: DRAFT engineering candidate / NOT merged, published or accepted.** Owner authorized continuation of the repair and focused source/CI validation, **not** official/GTA Cuba publication or physical-device certification. The defect and final acceptance remain in [issue #886](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/886). The independent test-only alternatives and measured real-Greenwood cost are in [draft #885](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/885).

## Reconciled evidence

Private player Report (40) had seven ~200–260ms residual-JS stalls spaced about 100–110 world units apart, with an active Thornfang informant waypoint. Source-native CI measured ~340–396ms per Greenwood `navigationTarget()` call and 26–31k terrain checks. Original browser frames did not record the exact route-call timestamp, and GitHub timings are not Chromebook measurements. Published #879/#882 reduced unnecessary refresh frequency and cleared the encountered Thornfang lead; the expensive synchronous search remains.

## Candidate design

- Add `Campaign.budgetedNavigationTarget(place, origin)` for *optional display-only* guide refreshes. It mirrors the native `navigationTarget()` ordered ferry dock/offset candidates, authoritative terrain radius, `route()` 50-unit-grid BFS and smoothing using the existing `budgetedTacticalRoute()` generator. The original `navigationTarget()` and direct Navigate movement orders remain unchanged.
- The browser shell drives the optional generator at **at most 128 collision probes, 24 graph nodes and a 3ms checked wall-time target per callback**. This is a cooperative budget, not a hard real-time 3ms guarantee: an individual terrain probe or generator step cannot be preempted mid-instruction. The script avoids every hundreds-of-milliseconds synchronous full-route call in the passive refresh path.
- Preserve the already-shipped 450-unit / 2-second/75-unit manual route-refresh eligibility. Continue the active pending route instead of restarting on every hero displacement; validate the computed route tail **against the live hero position**, using further bounded native collision checks. If there is no safe attachment, abandon the proposal and retry no sooner than two game seconds later, without injecting a stale path. Target changes and guide cancellation discard pending work.
- Quest/gathering passive path refreshes use the same scheduler. Explicit *noncombat* quest selection retains its immediate path; a forced refresh during active combat is deferred. The scheduler refuses optional route probes while squad engagement, mana combat, or incoming enemy projectiles are present.
- The generator, pending frontier and counters are runtime-only. No enemy/companion/charmed/pet/boss planner pools, collision rules, actor movement or v4 persistence keys are modified. Existing waypoint-path report counters now distinguish cumulative route CPU from maximum individual callback slice, along with combat deferrals and stale retries. No per-frame logging or persistence.

## Evidence and acceptance boundaries

- `tests/report40-budgeted-navigation.test.cjs`: compare native and generator destination/path on three representative obstructed Greenwood approaches; strict 128/24 slice quotas; native walkable segment checks.
- `tests/report40-passive-guide-shell.test.cjs`: bilingual production-shell deferred manual guide; no synchronous reroute; combat deferral; per-update work bound; Clear waypoint; no serialized planner.
- Existing Thorn witness, map/quest navigation, regional arrival and targeted app/persistence/PWA tests must continue to pass. CI, native route parity and browser fixture acceptance do **not** prove smooth rendering on the owner's Chromebook.
- Remaining uncertainties: real-device worst-case individual probe/slice cost, perceived delayed visual guidance during long moving paths or extended combat, dynamically changing walkability, and full regional quest/ferry field acceptance. Keep #886 open; record any test failures honestly and do not quietly relax route validity or save integrity.
- Separate draft autosave [#873](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/873) and predictive cache [#876](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/876) remain independent and unmerged. Their existing integration/SwiftShader and conflict gates remain pending; do not fold them into this route-causality experiment.
