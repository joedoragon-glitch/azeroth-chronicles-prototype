> **16 October 2026, release-blocker follow-up:** Main `9f69e5209e37207935281118208efe1005ec567a` remains unpublished. Existing run [38988414523](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38988414523) completed `phone-webkit` with failure. Its completed logs show fresh-start waits/menu lookups timing out because PR #315 inserted language choice ahead of Challenge condition. Audio subsequently waited for outdoor ambience while still in the class menu. This is a confirmed test setup incompatibility from source and logs, not proof that all gameplay is correct. Owner authorized a focused fix after this finding.
>
> Prepared repair: existing browser startup paths explicitly select English through the public chooser, including fresh Normal/Nightmare/hybrid paths; historical PWA fixtures without the chooser retain their existing flow. Existing assertions stay enabled, including the no-audio-before-first-gesture assertion. PR #315 English/Spanish runtime remains intact, is formatted to the pinned style, and gets the missing version/cache advance to `0.9.1+snapshot.dev.76`. Append-only source receipts retain the earlier hashes and separately record inbound main hashes. No combat, saves, balance or workflow gates change.
>
> Validation: build/generated JavaScript syntax and whitespace inspection only. No browser/regression suite, balance study, CI dispatch or rerun was started. The new candidate is not certified, merged or deployed; existing failed checks are not treated as success. Saved with `[skip ci]` to respect the owner's no-rerun instruction. A fresh authorized CI/deployment cycle remains necessary before publication.

# Community Snapshot: release tradeoffs and pause handoff

Recorded 16 October 2026, 21:00 EDT. This is a documentation checkpoint, not a new audit or a claim that unfinished checks passed.

## Purpose and stopping point

Deliver a working Community Snapshot to the forum, preserve the remaining work, then let Joel take a break. The forum commitment is not an open-ended commitment to perfect balance, exhaustive polish, or continuous development. Resume the backlog only when Joel chooses. Do not schedule more balancing, test cycles, audits or features merely because this list exists.

Finish only the concrete release closeout: a successful publication, confirmation of the published build, and a shareable game/changelog. Forum delivery and player acceptance have not been confirmed in this record. Actual crashes, save loss or blocked progression deserve specific fixes; speculative improvements can wait. No forum messages or posts have been sent by this assistant.

“Archive” currently means pause active project work and preserve its sources/evidence. The GitHub repository has not been made read-only; doing that while publication is pending would be premature. Keep hosting, save compatibility and recovery information available during the break.

## Exact source and current release state

- Community integration: [PR #313](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/313).
- Tested source candidate: `81b8a5f6eaa90c58f80f535c9b49c8f1e1cd40bd`, tree `ef81a5926f38e0e54d6bc78226f341dd20367d46`, version `0.9.1+snapshot.dev.75`.
- Merged on 16 October at 20:42 EDT as `147e534363f4ff98655bc77b66df07afa058b971`, following Joel's direct instruction. WebKit had passed; the PR's main `pr-check` was still running. No completed exact-tree PR certificate was claimed.
- The [original PR CI](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38977938067) still showed `pr-check` running at this checkpoint; `phone-webkit` completed successfully.
- A subsequent localization change, [PR #315](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/315), advanced `main` to `9f69e5209e37207935281118208efe1005ec567a`. Its parent is the #313 merge. The commit adds the minimal English/Spanish presentation option and changes `src/prototype/app.js`.
- That later push superseded/cancelled [the first main release run](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38987645284). The [replacement release run](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38988414523) was running on `9f69e52` when checked. Cancellation of the superseded run is not an implementation failure.
- Publication and the live build identifier are not confirmed here. A merge is not proof of deployment. Source-specific passes for `81b8a5f` do not certify the later localization tree.

## What was compressed, stopped or deferred

| Item | Evidence actually available | Remaining limit and disposition |
| --- | --- | --- |
| Merge before all PR checks finished | WebKit succeeded; focused checks below passed. | The main PR check and its certificate were unfinished at merge. This was an explicit release tradeoff, not a full CI pass. Review the eventual result; repair concrete failures rather than invent another broad audit. |
| Fresh balance study | Older complete 6,912-case observations and all 3,072 baseline observations remain preserved, including the original baseline exception. The final-runtime study started as eight shards. | Joel explicitly deferred the six unfinished shards and their source/completeness gate at 19:16 EDT. Do not call the final study complete or use an older source's results as a fresh certificate. The study and provenance are not blockers for this snapshot. Resume only after the break if requested. |
| Local browser matrix | Full desktop 1280×800 and phone 375×800 paths passed. A complete 393×852 replay passed all 48 original assertions. Focused healing/throne native checks passed all five principal layouts. | The first 393×852 held-D movement check timed out after five seconds. Its unchanged replay passed; no reproducible gameplay cause was established. Keep that discrepancy. The extra landscape/large-phone continuation was stopped on Joel's instruction; it is not a completed local full-matrix pass. |
| Art and audio acceptance | Automated WebKit art/effects/audio checks passed for the #313 candidate. Existing visual records account for 426 renderer-contract dispositions with their individual historical/current-world limits. | A capture, source census or automated gate is not a human review of every design or a physical-device/listening certificate. Do not upgrade staged-body/default-zoom receipts into universal authored-location acceptance. Further aesthetic polish is optional post-break work. |
| Performance confidence | Existing scoped checks, WebKit performance gates and the pure faction-lookup correction passed. | No universal iPhone/Chromebook FPS guarantee is established. The 100-cast probe measures lookup overhead, not device frame rate. Further combat/AI profiling or optimization stays deferred unless an actual play problem is reported. |
| Late localization integration | `9f69e52` changes `app.js`; its own release checks are running. | This commit's diff does not include a version/cache/build advance. Its new initial language dialog also changes the onboarding contract used by existing browser fixtures. Review those integration/bookkeeping points if the current checks flag them; these are source-observed follow-ups, not newly executed failures. Do not claim #313's earlier passes cover this later code. Coordinate with the #315 workstream rather than silently replacing it. |
| Release/pause boundary | Code, failures, receipts and original backups remain retained. | Live publication, a forum handoff link and forum feedback are still unconfirmed. After that bounded delivery, pause. Do not turn a small forum's snapshot into an endless production-certification project. |

No completed observation should be replayed merely because a chat timed out. Reuse evidence only for the source and scope it actually covers. An interrupted run, stopped continuation, cancelled superseded run, or pending job is not a pass.

Two older limits also stay visible: the dev.73 optional 980×1740 probe ended in a locator timeout, and the earlier bounded balance review retained 116 adverse outcome reversals plus three diagnostic-only timeout traces. Those are historical, version-specific records in the resume/evidence ledger, not proof of a current runtime defect or a player success probability. The late Spanish option is partial localization, not a completed translation of the campaign.

## Confirmed problems already addressed

These were repaired, not deliberately postponed:

- Two stale protected document checksums were corrected; all 24 integrity checks passed on the #313 candidate.
- Targeting browser fixtures were reconciled with approved approach-and-release and target-lock behavior. They retain no early damage/cooldown and same-target assertions rather than weakening the mechanic.
- Enemy healing now independently identifies living hostile roster members and excludes the hero, troops and all eleven pets, including malformed-roster tests. A normal valid roster did not reproduce player HP healing. The concrete moving-recipient visual bug was reproduced and fixed: recovery now follows its actual recipient/caster and cannot fall back to the hero.
- “Claim the Throne” is absent before TRUE Dark Lord victory, including cached v4 restores; awakening makes it available immediately. Normal Dark Lord access still requires rescuing Vera and Tovan. Early access to the courtyard was not proof of a missing boss-spawn implementation.
- Throne routes, sixth-companion reveal, v4 restoration, awakening tier rules and all 1,024 ending-state combinations passed focused checks.
- Earlier cast-label/HUD placement, scenery comparison, map collection handling and other implemented audit repairs are preserved in the existing validation ledger. Do not reopen them as unresolved solely because an old checkpoint says “not tested.”

The narrow healing/throne changes did not retune healing numbers or change the v4 save schema. Earlier broader snapshot changes retain their own recorded scope and evidence.

## Process debt, including the assistant's part

Validation grew beyond the practical needs of a small community snapshot and consumed too much of the owner's free time. The assistant should have kept a clearer separation between necessary functional release checks and extended balance/art/performance work, reused completed evidence promptly, and kept status reports concise. Repeated polling did not make GitHub jobs execute faster.

The early merge also reached `main` before the reusable PR certificate existed. The normal main workflow therefore started its fallback full validation. That automatic duplication was not a manual test restart, but its time cost should have been explained clearly before merging. A later feature push then superseded that first release run. Improve this workflow after the break; do not redesign CI or start more runs as part of writing this handoff.

The owner's decision to narrow the release was legitimate. This record describes actual tradeoffs and evidence boundaries; it is not a claim that the snapshot is broken or that the owner must finish every optional item.

## Restart later, without reconstructing this conversation

1. Read the current `main`, deployed build identifier and latest release outcome. The hashes above are checkpoints, not permission to overwrite newer work. Preserve v4 saves and original backups.
2. Close only concrete release failures or actual forum reports first. Check the late #315 integration separately from #313. Retain original failing outputs; distinguish a runtime bug from stale bookkeeping or fixture assumptions.
3. If requested later, investigate the single movement timeout from a reproducible report; do not launch another broad matrix merely because one local replay differed.
4. If balance work resumes, recover the existing partitions/baseline cache, verify exact executable inputs, retain losses and exceptions, and review outcomes before proposing tuning. Do not treat scripted win rates as player success probabilities.
5. Leave optional visual polish, human device/audio review and further profiling in a low-pressure backlog. Simplify release validation before another large update so one feature or documentation change does not repeatedly restart unrelated work.

There is no promised deadline or automatic restart of this backlog. Joel chooses when, and whether, to resume after the break.

## Linked implementation and evidence records

- [Enemy healing correction](PR313_ENEMY_HEALING_20261016.md)
- [Throne visibility follow-up](PR313_THRONE_GATE_20261016.md)
- [Validation ledger](PR313_VALIDATION_20261016.md)
- [Earlier resume checkpoints](PR313_RESUME_20261016.md)
- [Community art scope](COMMUNITY_SNAPSHOT_ART_AUDIT_20261016.md)
- [Community performance scope](COMMUNITY_SNAPSHOT_PERFORMANCE_20261016.md)

Historical pause/source-only and balance-gate directions remain intact as provenance. The owner's later instructions and this dated handoff supersede them for the release/pause decision. The conditional merge watch has been disabled because #313 is merged. This documentation is preserved on the existing integration branch and linked from #313 without modifying the active release tree or triggering new tests.
