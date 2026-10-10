# Backlog reconciliation and preservation audit - 10 October 2026

Scope: screenshot tasks 4 (GitHub backlog) and 5 (documentation/project state), authorized after a read-only assessment. No runtime, art, gameplay, save, balance, build-version or workflow change is part of this maintenance diff.

## Evidence boundary

Source baseline `5aa50dda1785397d2d1dd819da126b762e775ecc` (v0.8.133). Snapshot covers **225 remote branches** and eight then-open PRs, plus completed successor PRs. GitHub counts and heads are live state and must be refreshed before each mutation. #204/#208 remain with their implementing workstreams; this pass does not merge, reset or delete their branches.

The initial inventory is pinned to v0.8.133. Subsequent verification independently confirmed #207's main release run 38018534859 succeeded in main-test, phone-webkit and deploy, including exact published-build and live smoke checks. #204 then merged as v0.8.134 at `54e578d820e6c18234c70f57516d22a739438e4e`; its main production run 38019846959 also completed successfully in all three jobs, including exact published build and live desktop/phone, actor/road and quest/Keeper checks. The current status reflects this newer evidence, while the inventory preserves its original baseline.

## PR disposition and successors

| PR | Classification | Evidence / queue action | Recovery |
| --- | --- | --- | --- |
| #132 | Intentionally deferred | Five additional identities absent from main; do not close as obsolete or replay old runtime | `production/household-flight-v08101` at `57506c52483e81987d0d1f73e22027c865ee7fbf` |
| #145 | Superseded | #191 shipped proportions; #193 shipped original-master actor/road pilots. Closed with both references | `codex/proportions-implementation-20261009` at `502b69bb03c1cc6ec7e03609a78ade70a105a8fc`; original artwork/history remains protected |
| #152 | Completed analysis handoff | Harness was explicitly never production. #159 preserves findings, #190 carries current quantitative audit. Closed without merging | `analysis/real-combat-time-to-kill-20261009` at `a2f338a808b2da2d4db9ffd5b31b258117b75775` |
| #197 | Intentionally deferred | Unmerged session policy, conflicted with later main; neither delete nor merge during housekeeping | `feature/session-menu-timing-20261009` at `43ad214459f977b27ac59608b8c7b83880619249` |
| #198 | Intentionally deferred | Stacked directly on #197, detached roster foundation; not playable co-op | `feature/cooperative-roster-foundation-20261009` at `433cbf11d36a7f8687545a0a6e5b5d3b8e07254e` |
| #203 | Superseded | #204 replaces narrow clearRoadside/roadsidePlot draft with complete street corridors, named destination/compound access and historical/future barracks checks. Closed without obsolete merge; successor independently verified published | `town-street-planning-audit-20261009` at `a9797b3f74d66d588cb7f6abf3ca5b4de9a081b5` |
| #204 | Completed | Merged and independently verified published as v0.8.134 | Keep branch and recovery history |
| #208 | Active | Latest 23-identity adaptation incorporates #207; prior-head CI is not current-head evidence | Keep active branch and production journal/originals |

Execution: #145, #152 and #203 were re-read at their recorded heads, given successor/recovery comments and closed without merging. #132, #197 and #198 remain open with explicit deferred classifications; the original bodies and authorizations are preserved. Four implementation PRs remain open: active #208 and deferred #132/#197/#198. A documentation maintenance PR is separate from that count.

The seven earlier gameplay PRs #163/#167/#174/#175/#182/#77/#79 were already reconciled by #206 and remain completed/superseded as recorded in [the earlier audit](OLDER_GAMEPLAY_FIXES_AUDIT_20261009.md). No prior closure is presented as new work here.

## Asset preservation check

PR #132's manifest has **38 keys** versus baseline main's **33**. The five absent identities are:
- `prop:flight-harness-station:frontier`
- `prop:highland-pay-station:highlands`
- `prop:mine-old-markings:highlands`
- `prop:ridge-supper:highlands`
- `prop:royal-flight-standard:frontier`

Their exact definitions and output/revision hashes are recorded in [PR132_RECOVERY_20261010.json](evidence/PR132_RECOVERY_20261010.json). Their protected source branch holds the complete original/review history. This check is key/record comparison, not a new native-art review or a claim of 150% readiness.

The #145 and #193 sprite/material asset trees were compared directly. The saved pilot resources and original source history are retained; main adds newer Keeper references and uses newer journals/specifications. Do not wholesale restore the older audio, registry or generated runtime. Keeping the original #145 ref preserves any historical divergence instead of deleting it as duplicate.

## Branch retention and deletion

The complete [branch inventory](evidence/BACKLOG_BRANCH_INVENTORY_20261010.json) records each name, SHA, PR association, ancestry, reason and actual deletion flag. Protected sets include main, all open-PR heads/dependencies, explicitly named checkpoints/backups/recovery and sprite/original production history. Divergent and squash/rebase histories are retained unless separately reconciled.

**16 narrowly verified removal candidates** have exact closed-merged PR heads and are ancestors of baseline main; their commits remain reachable from main. No remote deletion is claimed: the connected GitHub tools do not expose branch deletion and authenticated git push is unavailable. Browser fallback requires approval under the computer-use access instructions. The candidates are ready for that final step; local ref removal would not count as remote cleanup.

- `codex/audit-fixes-v070` at `43cc7e790438c9a001cfc7ffb80921c954578597` (PR #5)
- `codex/camera-framing-v08101` at `083cd2277b59ee4e544db63921b0eb9364b121c5` (PR #133)
- `codex/camera150-default-v08102` at `c3bca20db788b831996c2319fc98f447d6dae3a0` (PR #135)
- `codex/combat-party-housekeeping` at `7501ce22fa9562cdc1106246ac610f5e1998c9b1` (PR #118)
- `codex/expanded-prototype` at `ea4fd43735adb2c32ce8858e00747f06de643eb9` (PR #2)
- `codex/ringleader-v071` at `88c53b048b49fb1ae0c6361b5bff681998e2e698` (PR #6)
- `codex/roads-and-clearance` at `93a0351d8659d6323c532e9ba965fc9ee1a49610` (PR #4)
- `codex/schematic-visual-polish` at `0d52370e237d23e5d33917b7bdf5be9a198456c2` (PR #3)
- `codex/specialist-v072` at `f107f0020735c649294e70b761baaa35562fe6a2` (PR #7)
- `fix-frontier-roadside-clearance` at `c6d99108c57a4ce45bb588f0b2e63cddeea89644` (PR #82)
- `fix/restore-original-transport-departures-20261009` at `df34fc48fe1ff923f23aedaa548a9fe2f24b04ce` (PR #195)
- `goblin-native-face-v0895` at `faaaf7006b4b412bfe3717e1b7108ba7e6816b46` (PR #124)
- `integration/monster-forts-after-narration-20261009` at `0b8740393a62c043589f347bd4a2bfe30917a2f4` (PR #189)
- `integration/quest-narration-main-20261009` at `3fd533c764ecce1f2149acedada012d27db949d9` (PR #188)
- `integration/world-proportions-v0822-20261009` at `0556860331bff948122e2d14c0fd416fb0d7b0e7` (PR #191)
- `release-prepared-v0896` at `06dca793d26e883a1a05fdd9b6f60b8aac7225d5` (PR #126)

## Documentation reconciliation and validation

The old DEVELOPMENT_STATE body is preserved verbatim beneath the archive banner in DEVELOPMENT_HISTORY_THROUGH_V08133.md. Current status distinguishes source/published/human-tested states, current cache limits, completed art pilots, active candidates, deferred co-op and remaining v0.9 acceptance work. README instructions follow the current direct Talents, main Story journal, local boards and explicit Navigate paths; stale production-pause/empty-art statements are removed. Historical technical handoffs retain their text under explicit historical banners.

Validation must include preservation of the archive body, local Markdown-link resolution, JSON parsing, git diff --check, architecture regression, generated/asset checks and no diff outside README/docs. Existing hosted checks remain the PR/main release gates. No human physical-device test or finished v0.9 acceptance is inferred from documentation work.
