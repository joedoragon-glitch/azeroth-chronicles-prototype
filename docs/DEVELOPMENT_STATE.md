# Current development state and v0.9 readiness

This is the authoritative repository status snapshot for the v0.9 stabilization work. [Roadmap #192](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/192) is the cross-workstream navigation record; [#160](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/160) owns asset-by-asset production. Earlier chronological notes are [archived intact](DEVELOPMENT_HISTORY_THROUGH_V08133.md).

Snapshot captured **2026-10-10T03:51:00+00:00**. Later source/release changes are tracked in #192 and #160; re-check their exact heads and runs before new work.

## Baseline and release evidence

Current source baseline: **v0.8.135**, main `170adbf708ac1ea3b26e57621d0089f182932270`, from merged nature adaptation [#208](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/208). It includes the released road and Abyss work. Exact-head PR run 38020278879 passed; main release [run 38021457158](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38021457158) is running at this snapshot. Publication still requires its exact-build, live browser and nature-asset gates. Asset-by-asset completion stays with #160.

Independently verified published baseline: **v0.8.134**, `54e578d820e6c18234c70f57516d22a739438e4e`, from merged road overhaul [#204](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/204). Main release [run 38019846959](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38019846959) completed successfully in main-test, phone-webkit and deploy. The exact published-build, live desktop/phone smoke, original-master actor/road and quest/Keeper Archive checks all passed. Independent live reads confirmed the exact SHA and v0.8.134 build-info/service-worker versions. This completes the road technical release without certifying every human regional/device acceptance criterion.

Preserved prior production checkpoint: **v0.8.133**, `5aa50dda1785397d2d1dd819da126b762e775ecc`, Abyss integration [#207](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/207), [run 38018534859](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38018534859). Main-test, phone-webkit and deploy all succeeded, including exact published build, live desktop/phone, actor/road and Keeper checks. Abyss technical integration is complete; human acceptance remains open. #204 preserves this work and the earlier v0.8.132 gameplay fixes.

This maintenance pass is documentation/backlog reconciliation. It does not certify a completed v0.9 release. Later commits and runs supersede the snapshot only when independently verified.

## Current playable contracts

- Multi-file GitHub Pages/PWA application, shared Campaign engine, distinct desktop and phone presentation; local saves and no game backend. Existing v4 keys and v2 backup import remain compatible.
- Camera defaults to the selected 150%; 100% and 175% remain optional per screen. Supported phone space begins at 375x800 CSS pixels or its rotation. Browser emulation does not certify real-device comfort or performance.
- Cooldown-only combat is authoritative: no live MP spending/HUD, five Cooldown Training ranks reduce cooldowns by 4% each, and approved actual-damage healing remains. MP fields and switchable historical logic are recovery data, not permission to restore an old MP economy. The quantitative audit recommends no retune.
- The main Story journal guides specialist rescues, onward transport, the Dark Lord, five TRUE guardians and completion. Local jobs remain on quest boards. Map navigation starts through explicit Navigate; Talents is directly available in Adventure. Single-player menus pause the simulation.
- Authored regional handoffs and the Abyss royal-flight canon remain authoritative. The purple dragon is the Dark Lord's personal mount, and the air force is unfinished. #207 restores one feeding/service safe lane and adds round-trip route regressions; it is not a new dungeon or flight system.
- Original-master Paladin/Goblin idles and Vale/Highlands roads shipped in #193. Baseline manifests contain **33 sprite identities and 7 materials**. The decoded sprite ceiling is **256 MiB**, separate from the 64 MiB outdoor-floor picture; both are bounded lazy caches, not guaranteed device allocations. Earlier 16 MiB or empty-manifest notes are historical.

## Work disposition and preservation

| Work | Disposition at audit | Next step |
| --- | --- | --- |
| #208 nature original density | Completed source integration of 23 existing identities as v0.8.135, incorporating #204; production verification running | Require its exact deployment/live nature-asset gates before marking those assets deployed. The other eight active adaptations and missing catalog stay with #160. |
| #210 combat conditions and secondary effects | Active v0.8.136 candidate, opened after the initial backlog inventory; based on v0.8.135 | Its own implementation workstream must verify the current head and release. Preserve `audit/v09-combat-conditions-20261009`; housekeeping does not merge its gameplay changes. |
| #204 outdoor road infrastructure | Completed and independently verified published as v0.8.134 | Exact deployment/live checks passed. Automated coverage and screenshot review do not close all regional human acceptance. |
| #203 earlier town-planning draft | Superseded by #204; closed without merging obsolete runtime | Original branch/head retained as recovery. |
| #132 household/mine/flight art | Intentionally deferred integration, not obsolete | Preserve its five additional identities, untouched sources, revisions, reviews and branch. Recover a bounded asset batch against current main under #160. |
| #197 session timing; #198 cooperative roster | Intentionally deferred from this stabilization pass; #198 depends on #197 | Preserve both branches. No playable networking/Host/Join feature exists in current main. Their earlier authorizations are not revoked. |
| #145 old proportion/art branch | Superseded by #191 (proportions) and #193 (pilot art); closed | Original branch and all original artwork/history retained as a protected checkpoint. |
| #152 encounter experiment | Completed analysis handoff; closed, experimental harness intentionally unmerged | Branch/harness retained. #159 preserves encounter findings and #190 owns the current quantitative cooldown audit. |

#204 and #208 initially both used v0.8.134; they integrated serially. #204 merged first, and #208 adopted that main state and v0.8.135. Both workflow additions remain in the combined source. A previous head's green run is not evidence for a newer head; publication is a separate gate.

## v0.9 acceptance still to establish

1. Verify the exact combined stabilization commit through generated/asset checks, the full Node suite, relevant Chromium/WebKit device paths, Pages publication, published SHA and live smoke. Keep merged, published and human-tested states distinct.
2. Validate the Abyss campaign end to end: full-party handling, trap readability, Eren rescue, boss/TRUE/Awakening transitions, outward and return wing routes, and actual phone movement/interaction. Automated route and save regressions support but do not replace this human acceptance.
3. Continue observed regional playtesting in Greenwood, Marches, Highlands, Frontier and Crown: travel/departure identity, collision/road/entrance access, rescue/escort/quest progression, settlement life and encounter pacing. Record reproducible defects before changes; open lore choices remain open.
4. Complete the measured crowding/play-distance review required by WORLD_PROPORTION_AND_DENSITY_GUARDRAILS.md. The released size classifier alone is not a completed density audit; #204's street tests alone do not certify every visual footprint or encounter gap. Do not add enemies or expand maps to compensate for decoration without the required measurements.
5. Keep backlog classifications, recovery references and player instructions aligned with actual releases. Finish only verified redundant branch deletion; no branch-count target is a release criterion.

The remaining complete artwork catalog is explicitly **not a v0.9 release blocker** in #192. Co-op groundwork, new wrappers and unresolved optional lore are preserved separate workstreams; this cleanup makes no claim that they are complete or cancelled.

## Limits and recovery

Campaigns remain browser/device-local; there is no cloud sync or multiplayer backend. Real iOS gesture behavior, thumb reach, target Chromebook cadence, full human campaign progression and subjective visual/audio quality are not certified by CI. Export a save before clearing browser data. Keep historical MP fields, accepted sprite originals, animation dependencies and rollback history.

See [backlog audit and recovery inventory](BACKLOG_HOUSEKEEPING_20261010.md), [gameplay decisions](DECISIONS.md), [architecture](ARCHITECTURE.md), [regional handoffs](REGIONAL_HANDOFF_AUDIT.md) and [Abyss canon](ABYSS_AIR_SUPERIORITY_CANON.md). Historical handoffs are evidence of past work, not a current instruction to replay it.
