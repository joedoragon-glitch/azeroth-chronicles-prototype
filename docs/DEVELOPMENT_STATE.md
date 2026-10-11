# Current development state and v0.9 readiness

## v0.9.0 candidate preparation · 10 October 2026

**Candidate only; not published or accepted.** This addendum supersedes the old active-work labels below. The earlier snapshot is retained as dated history.

- Last independently verified production at preparation: **v0.8.138**, commit `6c2381b34ce63fb935936a4e69ec404996f7765a`, tree `d5616558097655755e581d75f4707a1571b03c24`. Combined #226 integrates performance, Auto/30/60 render scheduling and development/CI workflow changes. Full identical-tree [run 38087706102](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38087706102) and merged-main [publication 38091031125](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38091031125) passed. Subsequent source versions require their own evidence.
- Combat conditions #210 and item/equipment/collision QA #216 are integrated. #211/#212 are superseded. #223/#224/#225 were combined in #226 rather than separately merged. Old active-candidate references below are historical.
- The #214 boss decision is settled: preserve current Pounce recovery and Wall Rush opening; change only the inaccurate descriptions. This candidate includes #227 source through `3e2b3136de8f8b9ce5da7caff4afa365f60d6935`. Its parent release workstream owns any separate v0.8.139 publication. Current acceptance remains tracked in [#213](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/213); do not infer live deployment from this branch.
- This candidate changes release version/cache metadata and documentation. It adds no mechanics, art or save schema changes beyond the already scoped #227 descriptions. Core save keys, authored geometry, combat numbers and approved presentation are retained.
- Joel reports ordinary play working so far and uninterrupted save retention across major updates throughout development, with no forced restart from corruption. This is positive user-reported longitudinal evidence. It is not an independently tested historical export/import round trip, a full campaign completion, or physical offline/performance measurement.
- Complete natural campaign/late-game acceptance, a genuine historical export/import cycle and the remaining physical device/PWA checks are open. Joel has not completed the game and is not being assigned code-level verification. These criteria need evidence or explicit release-scope disposition before the beta is declared accepted; this preparation does not waive them.
- #217 sprites remain paused and excluded. #132 art recovery and #197/#198 co-op remain deferred. Original branches, artwork and rollback references remain protected.

See [v0.9 release notes, gate and rollback](V09_RELEASE_NOTES.md). The [10 October evidence branch](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/tree/audit/v09-readiness-20261010) preserves independent live reads, 28 named boss scenarios, description-only semantic comparisons and six bounded early-progression action pilots. The pilots are not full campaign certification; three completed the early-route save check and three stopped after a death.

## Preserved earlier status snapshot

This is a dated repository status snapshot for the v0.9 stabilization work. [Roadmap #192](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/192) is the cross-workstream navigation record; [#160](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/160) owns asset-by-asset production. Earlier chronological notes are [archived intact](DEVELOPMENT_HISTORY_THROUGH_V08133.md).

Snapshot refreshed **2026-10-10T04:15:13+00:00**. The baseline and work dispositions below describe that audit, not live branch state. Before resuming work, use current `origin/main`, `package.json`, open PRs and their latest runs; #192 and #160 retain the workstream handoffs. Historical candidate labels below are not instructions to replay or merge them.

## Baseline and release evidence

Source baseline at this audit: **v0.8.135**, released runtime at `170adbf708ac1ea3b26e57621d0089f182932270`, from merged nature adaptation [#208](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/208). Main subsequently advanced to the deployment-evidence-only commit `1e232c71a9e63f87efe152868432bbfcc4a39ffd`. It includes the released road and Abyss work. Exact-head PR run 38020278879 passed; main release [run 38021457158](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38021457158) completed successfully in main-test, phone-webkit and deploy, including the exact published build and live desktop/phone, actor/road and quest/Keeper gates. The #160 handoff and retained journal record the independent 23-output nature hash/dimension/alpha audit and 276 browser scenes. All 23 existing nature identities are deployed; no new artwork was generated. The other eight active adaptations and broader missing catalog remain open under #160.

Independently verified published baseline: **v0.8.135**, `170adbf708ac1ea3b26e57621d0089f182932270`, from #208 and run 38021457158. The preserved road checkpoint is **v0.8.134**, `54e578d820e6c18234c70f57516d22a739438e4e`, from merged road overhaul [#204](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/204). Its main release [run 38019846959](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38019846959) also completed successfully in all three jobs and exact published-build/live gates. Both technical releases are complete without certifying every human regional/device acceptance criterion.

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
| #208 nature original density | Completed and independently verified published: 23 existing identities as v0.8.135, incorporating #204 | Preserve originals, journal and exact release evidence. The other eight active adaptations and missing catalog stay with #160. |
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
