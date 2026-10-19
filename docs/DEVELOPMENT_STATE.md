# Current development state — 19 October 2026

**Community Snapshot published. Feature development is on break.** The authorized closeout is documentation reconciliation and preservation. No gameplay implementation, whole-game regression pass, visual polish, merge or deployment is authorized by this page.

## Source and publication

| Item | Recorded state |
| --- | --- |
| Runtime version | `0.9.1+snapshot.dev.79` in package, lockfile and generated build info |
| Historical documentation-audit main | `57453c4651366a6debbcae454c70af3115e8ac2e` |
| Last published gameplay source | `23d951092ea5dff806c460c62ca71eeced574f5c`, merged manual Developer Mode Skill 1 fix and documentation closeout #319 |
| Publication evidence | [Packaging-only run 39312326936](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/39312326936); exact public build/copy reads recorded in the [release handoff](COMMUNITY_SNAPSHOT_RELEASE_HANDOFF_20261016.md) |
| Completed closeout / manual fix | [Merged #319](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/319); retained reconciliation ledger owns deferred notes |

The dev.79 publisher packaged the exact merge `23d951092ea5dff806c460c62ca71eeced574f5c` after the owner explicitly authorized merge/publication with no further testing on 19 October 2026. Packaging and successful Pages publication are release evidence, not a new gameplay certificate. The temporary publisher is removed after publication; the normal workflow is restored.

#300, #308, #313, #315–#318 and #319 are merged. Earlier instructions to resume or merge #300/#308/#313 are historical. The 42 previously open old PRs were closed without merging on 18 October EDT; their source branches remain preserved. #217 (sprites), #198 (isolated co-op) and #296 (process policy) are indexed under #319; closure does not mean their code shipped or their useful ideas were cancelled.

## Break closeout and future work

The repository-wide [documentation audit](DOCUMENTATION_AUDIT_20261019.md) and [per-file index](DOCUMENTATION_INDEX.md) complete the current housekeeping scope on #319. The owner authorized merging #319 with the narrow Developer Mode fix; both documentation and dev.79 are now published. The audit report itself retains the facts and limits of its earlier documentation-only checkpoint.

After the owner returns, the first quality phase is a **full independent whole-game audit / regression pass**, followed by a calm visual loving pass. These are future phases, not unfinished release checks to run now. Co-op modernization, selective adoption of old sprites and outreach are also deferred. There is no deadline, automation or automatic restart. A quiet forum is not QA evidence; community silence does not validate gameplay, and no forum response is required to take the break.

Future visual notes are retained in [the unified reconciliation ledger](NEXT_UPDATE_RECONCILIATION_20261018.md): Frontier captain/boss-species resemblance, stronger creature anatomy and identity, terrain-appropriate ranged uniforms, and optional poppies/red flowers. They are not break blockers.

## Narrow owner-authorized exception — Developer Mode Skill 1

The owner requested this repair before the break: manual Skill 1 (tap and charged, keyboard/mouse/touch) must work in Developer Mode; movement auto-attack stays disabled. Build `0.9.1+snapshot.dev.79` was subsequently merged and published through #319 under the owner’s explicit no-further-testing instruction. This does not resume other deferred work or grant authority for another release.

**Release-line policy:** stay on **0.9.1** through the owner's post-break series of existing-content repairs and refinement. Individual build identifiers may advance; 0.9.2 requires a separate owner decision. The planned complete playthrough will collect screenshots/notes of problems; Developer Mode supports inspection but does not certify normal-mode difficulty or death consequences. No new-content phase is authorized by this plan.

## Current playable contracts

- Canonical multi-file GitHub Pages/PWA, shared Campaign engine, separate desktop and phone presentation, browser/device-local saves. No multiplayer transport or playable Host/Join mode.
- Five-region campaign; Standard/Succession and Normal/Nightmare; eight class-specific skills with tap/charged forms, cooldown-only combat, companions and eleven pet families. Legacy MP fields remain recovery data behind the dormant mana flag.
- v4 save schema and existing keys remain compatible; preserve original legacy v2 backups. Crowns are the player-facing currency; internal `gold` remains compatible.
- Default camera 150%, optional 100%/175%; supported phone size begins at 375×800 CSS pixels or rotation. Narrow desktop windows remain desktop.
- Current manifests: 33 approved sprite identities, seven materials, 127 registered audio assets (83 music, 14 ambience, 30 effects). The 296-entry old prompt catalog and 426 renderer-contract census are historical inventories, not unique required sprite counts.

## Evidence limits and normal future workflow

PR #308 has full validation/publication evidence. #313 retains focused and WebKit evidence and an owner-directed early merge; later dev.76–79 publication used explicit no-CI/no-further-test waivers. Neither successful publication nor this documentation audit certifies a new complete gameplay, balance, native-device, visual or audio pass. Preserve failures, stopped runs and source-specific results in the release handoff; do not relabel them as passes or create an urgent defect from an old pending checklist.

When development is explicitly resumed, re-read current main and the owning PR, reconcile source/asset usage, use focused checks while implementing, then one coordinated final validation cycle for the final candidate. Repeat checks only when changes or failures justify it. Normal release gates and separate owner merge/deployment authorization apply; old snapshot waivers do not carry forward.

Start with [AGENTS.md](../AGENTS.md), [architecture](ARCHITECTURE.md), [documentation index](DOCUMENTATION_INDEX.md), [future reconciliation](NEXT_UPDATE_RECONCILIATION_20261018.md) and [recovery desk #297](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/297). Pre-release status paragraphs are preserved in [documentation history](PRE_BREAK_DOCUMENTATION_HISTORY_20261019.md), not used as a current task queue.
