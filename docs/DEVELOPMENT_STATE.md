# Development state — what is live and what is next

**So I Became the Dark Lord's Problem** · Verified **28 October 2026** · Published playable build: **`0.9.1+snapshot.dev.209`** (verified checkpoint; recheck later main revisions)

This is the **current status page**, not a task list or a release diary. It records what is published, what has actually been tested, and what remains unfinished. For how to play, start with the [README](../README.md). For earlier release-by-release details, open the [historical development-state archive](DEVELOPMENT_STATE_ARCHIVE_THROUGH_20261028.md).

**Jump to:** [Release](#verified-release) · [Playable today](#playable-today) · [Unfinished work](#unfinished-work) · [Known risks](#known-risks-and-acceptance) · [Where to work](#where-to-work-next) · [Maintenance](#how-to-keep-this-page-trustworthy) · [History](#historical-record)

## Verified release

| Question | Verified answer |
| --- | --- |
| Which source is on `main`? | [Commit `5addd94`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/5addd94a0401738e385d834db965694128b76e4b) at this checkpoint; the `dev.209` gameplay release entered at [2a03b3a](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/2a03b3ad6ed693c24bb50471f85325c9d51cca53) before later documentation-only main commits. |
| Which game version? | **`0.9.1+snapshot.dev.209`**, verified in published main package/build/cache identifiers. Draft #563 carries its own overlapping version candidate; that does not imply its listening-room changes are shipped. |
| Did automated checks pass? | **Yes.** [Main release run #40741421490](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40741421490) passed focused checks/build for `dev.209`; later [docs-only main run #40742177116](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40742177116) passed at `5addd94`. These are separate tested commits. |
| Was the site published? | **Yes.** Both mainline runs [#40741421490](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40741421490) and [#40742177116](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40742177116) published successfully; neither deployed draft #563. |
| Did each phone/Chromebook receive and accept this update? | **Unknown.** A successful site publication does not prove an existing browser or installed PWA has refreshed its cache or passed physical-device testing. |
| Did the full-game / browser matrix pass at this commit? | **Not claimed.** The normal workflow uses focused checks. The comprehensive workflow is separately owner-authorized. |

**Player links:** [Browser / Chromebook](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/) · [Phone / PWA](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/phone.html) · [Spanish game guide](../GUIA_EN_ESPANOL.md).

This is one continuing playable Community Snapshot, not a separate successor game. **Merged** means incorporated into Git; **tested** means specific checks passed; **published** means the site job passed; **device-verified** requires observed results on that device. None automatically proves the next.

## Playable today

The public version includes:

- **Four classes:** Paladin, Mage, Ranger and **Rogue / Pícara**. Rogue's normal New Game entry, musical combat, native Charm companions and v4 save integration shipped through [PR #511](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/511). The [Rogue soft-release record](ROGUE_SOFT_RELEASE_20261028.md) explains the intended scope and incomplete acceptance; older staged-release instructions are historical.
- **A continuing five-region campaign**, with settlements, five main dungeons, recruitable companions, Barracks and specialist services, story progression, and local Normal/Nightmare saves. The game remains single-player and offline-capable.
- **Cooldown-based skills**, class progression, and the live five-Codex / Critical Executions system ([merged gameplay PR #440](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/440)). Extra probability-regression coverage in [draft PR #515](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/515) is **not** missing gameplay.
- **Native melee anti-kiting Pursuit Burst** for eligible ordinary nonsummoned melee enemies and melee Ringleaders across regions ([merged PR #508](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/508)). It does **not** extend to every summon, captain, boss or ranged enemy.
- **Main title menu, Continue, backups, controls, sound and diagnostics**, with shared campaign logic but distinct desktop/phone layouts. The [renderer/title preparation PR #518](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/518) is merged; this is not proof of full Pixi/device acceptance.

These are **implemented and published capabilities**, not a claim that every boss, route, sound, visual or long-session playthrough has passed final human testing.

## Unfinished work

**Development priority: functional completion before optional optimization and cosmetic polish.** The intended `v0.9.2` milestone is to make essential gameplay and progression work end-to-end without major blockers; it is **a planning goal, not a shipped version or public commitment**. The owner approves individual features and merges.

| Area | Current situation | Where to look |
| --- | --- | --- |
| **First-region player flow** | Greenwood Vale interaction clarity and the proposed first-region completion pass are **draft work**, not current public `dev.209` behavior. | [First-region audit #544](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/544), [interaction drafts #538](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/538) and [#533](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/533) |
| **Combat territory fairness** | Damage-permission versus chase/reset distance is still under review. The merged pursuit improvement did not close it. | [Issue #510](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/510); [#504](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/504) retains a stale future-rollout title even though #508 merged |
| **Rogue acceptance** | The owner's initial phone field test established Rogue/Charm operation, **not** a complete boss/region, sound, art or long-session performance sign-off. | [Phone findings](ROGUE_FIRST_PHONE_ACCEPTANCE_20261028.md), [dev.208 jingle/performance report](ROGUE_JINGLE_CANON_AND_SLOWDOWN_DEV208_20261028.md), [unmerged follow-up #531](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/531) |
| **Physical-device and end-to-end acceptance** | Long playthroughs, specific phone/Chromebook results and outstanding defects require real playtesting. A focused build cannot certify them. | [Stage 7 device runbook](PR518_TARGET_DEVICE_ACCEPTANCE_20261027.md), [Recovery Desk #297](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/297) |

This is a **short decision-oriented view**, not an exhaustive issue tracker. Check [open issues and PRs](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pulls) and the owning contracts before acting; a proposal's existence is not permission to implement or release it.

## Known risks and acceptance

- **Rendering:** **Canvas 2D remains the default and fallback.** PixiJS WebGL2 is optional and **experimental**, with a 15-second Keep/Revert trial. [Graduation #478](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/478), [phone cache/performance #481](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/481), [contact shadows #484](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/484), [ambience #486](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/486) and [recovery #460](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/460) remain open. Do not call Pixi supported or faster on real hardware without evidence.
- **Performance work is not the immediate completion goal:** [Canvas optimization draft #527](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/527), [merged and published Canvas resize #553](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/553) and [merged and published Pixi parity #554](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/554) are part of `dev.209`; separate optimization #527 remains draft. The narrower [diagnostics PR #552](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/552) **merged**, but that does not ship the rest of #527 or prove an FPS improvement.
- **Lighting:** Owner-reported sunrise white flashes remain under [issue #357](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/357); possible sunset flashes are not independently confirmed.
- **Saves:** Campaigns are local to the browser/device. The v4 save schema is maintained, but cloud sync and playable co-op are not part of the current game. Preserve backups before clearing browser data or moving devices.
- **Art/audio:** Original procedural presentation and contextual sound are integrated, but complete real-device visual/audio acceptance remains open. The approved bell-staff, not the rejected guitar, is [Rogue's current art contract](ROGUE_BARD_STATIC_VISUAL_DESIGN_20261026.md).

**To check a specific device:** Use **Game and settings → Check for game update** / **Install available game update** when offered. Then choose **Screen and performance → Export playtest report** and inspect its `version` field. This is a *local diagnostic report*, not a campaign save export or automatic telemetry. For backups use **Save and game management → Save backups**. The corresponding Spanish controls are in [CONTROLES.md](../CONTROLES.md).

## Where to work next

- **Draft documentation/audio audition #563:** Its rewritten listening room, sound guides and candidate cache files are **unmerged and unpublished**. Its `dev.209` candidate now overlaps the separately released `dev.209` on `main`; reconcile version/cache and newer main changes before any authorized integration. [PR #563](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/563).
- **Playing / player help:** [README](../README.md), [Guía en español](../GUIA_EN_ESPANOL.md).
- **Finding current source ownership:** [Architecture](ARCHITECTURE.md) and the actual code.
- **Accepted mechanics and current developer rules:** [Design decisions](DECISIONS.md), [AGENTS.md](../AGENTS.md), [mechanic workflow](MECHANIC_DEVELOPMENT.md).
- **Specific pending work:** The matching [issue or PR](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues), plus [Recovery Desk #297](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/297). Avoid resuming an old handoff solely because it says "current" or "next."
- **Finding historical design/audit evidence:** [Documentation index](DOCUMENTATION_INDEX.md) and [coverage register](DOCUMENTATION_COVERAGE_REGISTER_20261025.json). Classification does not prove every old document was fully re-reviewed.

**Reminder:** Draft PRs are **planned or implemented only on their branches**; they are not merged or published until the relevant GitHub evidence says so. No old test, merge or release approval carries forward to a new task.

## How to keep this page trustworthy

1. Refresh the **exact `main` SHA**, game/cache versions, actual focused workflow result, and Pages publication before changing the top table. Pin the checkpoint; never call a draft published.
2. Keep statuses **small and specific**: playable, outstanding functional blockers, experimental systems, and device limits. Update relevant rows when real PR/issue states change; don't duplicate a whole PR diary here.
3. Preserve superseded detail in the [historical archive](DEVELOPMENT_STATE_ARCHIVE_THROUGH_20261028.md) and feature-specific receipts. Update this page during normal authorized feature work; don't generate another competing "current status" ledger.
4. **Safety:** No routine full browser/game certification, merge, main publication or gameplay change is authorized by this document alone. Follow current owner approval and the focused CI policy in [AGENTS.md](../AGENTS.md).

## Historical record

The extensive **19–28 October development diary**—including earlier builds, audit outcomes, original approvals, past proposals, and superseded "current" labels—was moved **without rewriting its historical text** to [Development-state archive through 28 October](DEVELOPMENT_STATE_ARCHIVE_THROUGH_20261028.md). It is evidence of what was known then, **not instructions to resume or publish that work**. The [original pre-reorganization page at `main@3765ed3`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/3765ed3bbbf67385561ba47b46887eda6ccf3e7c/docs/DEVELOPMENT_STATE.md) remains permanently available for comparison.

**Scope of this refresh:** The October 28 top-level source, CI, publication and named PR/issue dispositions were verified against GitHub. Historical per-feature notes were preserved, not exhaustively re-certified; real-device acceptance was not performed.
