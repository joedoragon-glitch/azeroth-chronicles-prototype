# Independent source-level HANDOFF audit — Community + PR #311 + Issue #312 (16 October 2026)

**Audit target:** Is the consolidated GitHub state safe to transfer into Work mode for **continued implementation**? This is NOT an audit that all 28 issues are fixed or that the finished game is ready to validate.

## Canonical inputs grounded by read-only GitHub

- `main` `6bc27be31792b1c38147d61e98ceed6acf3e2560` (merged PR #308).
- Community source checkpoint `ca33acb14d92cbce12633eaab702318343dce509`, passing second Community-only source audit, untested.
- Draft PR #311 live head `b6217312beefb451b9521d3303565f4778973b30`, one docs-only commit above original implementation `b91347f863d68d6b7beca76e23f625ddd7ff1293`. Ten issues remain in code; the final audit text is present in integration.
- Issue #312 open and detailed 18/18, including observations, binding exceptions, source audit, acceptance gates and dependencies. It is **specification**, not implementation.
- Unified branch `integration/community-snapshot-311-20261016` descends from `ca33acb`; first code integration `e513ea7fb9bfa21d5e102177bb3eedd3954e6cc4`, source audit `f0e08ba7341a557dcb6ba9eb33d652a9e03dd339`, early #312 draft `67e68758b5c27dc2fc441ddffce7927c4084b9d4`. The recovery commits remain on GitHub.
- PR #300/#308 already merged; do not import them again. PR #311 remains draft and unmerged; no existing consolidated PR is open at the time this audit was prepared.

## Original Community A01–A07 source-audit preservation

The seven repairs in `docs/COMMUNITY_SNAPSHOT_SOURCE_REAUDIT_20261016.md` are **mandatory final-candidate acceptance**, not already certified on this combined branch. Specifically retain A01 ranged-pet positioning, A02 426 renderer-contract art review, A03 automatic pet/balance matrices, A04 native capture fixtures, A05 area collateral/targeting, A06 pet teaching and visible charge geometry, and A07 immutable design provenance. The checkpoint `ca33acb14d92cbce12633eaab702318343dce509` remains independently recoverable, its source PASS scoped to that original tree. The final combined source audit and eventual authorized tests must recheck all seven. See the exhaustive preservation table in `docs/WORK_MODE_SINGLE_PR_HANDOFF_20261016.md`.

## Static checks and findings

| Gate | Source evidence | Verdict for Work handoff |
| --- | --- | --- |
| H01 identity/recoverability | One persistent integration branch; immutable Community + #311 inputs and exact commit IDs | PASS |
| H02 no lost first-batch code | All 40 #311 patch hunks integrated, 39 byte-identical and one deliberately augmented with pet-specific defensive Recall; latest #311 change docs-only | PASS (static) |
| H03 18-issue preservation | #312 has 18 numbered sections and original binding exceptions; integration ledger explicitly indexes PT-001 through PT-018 | PASS for requirements retention |
| H04 state honesty | PT-018 drafted, PT-003/PT-012 partial; other PT items remain untouched or investigated; none claims runtime proof | PASS only if scope remains explicit |
| H05 no duplicate release | Single branch/source PR, main not modified, no individual #311 or Community merge/deploy | PASS |
| H06 pending tests | Prior audits and new regression probes are authored only; no build, browser, CI or live gameplay executed in this source phase | PASS for non-execution policy |
| H07 version/PWA | Existing generated carriers dev.66 not regenerated from combined pet module | OPEN FOR LATER AUTHORIZED VALIDATION, not a handoff blocker |
| H08 source integrity | Previous protected #308, Community and #311 hashes retained. A new exact source receipt covers #312's changed paths; no blanket exclusions | PASS if current source matches the appended hashes |
| H09 source code quality | PT-003 generic Goblin audio fallback does not yet discriminate visible/equipped weapons; cargo travel sound incomplete; PT-002/007 and world work absent | OPEN IMPLEMENTATION, explicitly assigned to Work |
| H10 trigger safety | `.github/workflows/pages.yml` reacts to `pull_request` against main. Draft PR may schedule CI; final prepared commit contains `[skip ci]` to instruct GitHub to skip. Must READ workflow run metadata after opening, do not launch manual workflows | CONDITIONAL — confirm remote post-PR state |

**Blockers for game/source readiness:** Remaining 18 PT requirements (except partially drafted items) and end-to-end cross-feature source audit. **Not blockers for a solid Work handoff** provided they are explicitly open and governed above. Do not convert this handoff PASS into final integration PASS.

## Adversarial risks Work must resolve

1. **Partial audio PT-003:** event currently often lacks `weapon`; defaults Goblin/skeleton to steel. It may fix one observed blade but not establish exact equipment-based fidelity. Source-audit the true attack and VFX ownership and assign actual material before declaring fixed.
2. **Partial PT-012:** cargo release/wall/hero impact cues drafted; verify emitted events, terrain impact coordinates, actual mix and continuing LEDGER CAST/leash behavior later. 'LEDGER CAST' is an indicator, not the name of Rolling Cargo.
3. **Developer transit PT-018:** fare check bypass and `FREE` UI are narrowly developer-only; verify mode identity, unvisited routes, both directions, Crown hub, absence of paid ticket mutations, and normal/nightmare parity during later authorized tests.
4. **World data PT-004/005/006/009/010/013/014:** compare final composed roads and hydrology to rendered sprite footprints. No exact obstruction identifier was supplied; do not invent one.
5. **Combat PT-001/002/007:** Thornfang missing pup refill is an observation, not a confirmed source failure; strict actor collision can deadlock crowds; patterned damage must fit connected walkable rooms with genuine dodgeability.
6. **Protected-source receipt:** each later Work code edit must append new exact SHA-256 provenance rather than modifying historical values or weakening the final shared gate.
7. **PR-created CI:** draft PR creation itself can be a workflow trigger. Confirm whether GitHub skipped checks via commit message. Do not assert that no checks ran merely because none were manually dispatched.
8. **Release boundary:** a GitHub PR is review/integration infrastructure, not approval to merge, run overnight tests or deploy.

## Objective conclusion

**HANDOFF READY only after** current-branch source/handoff documents are committed, exact source protection extended, and a single draft PR verified open. This verdict concerns *recoverability and implementation instructions*. Overall 28-issue implementation readiness and runtime certification are expressly **NOT PASSED**.

After the Work phase, require a **new** full source audit, addressing each individual PT entry, preservation checks, and proof that no 'false-positive test fix' weakened a regression. Then request the owner's distinct authorization to start the one consolidated overnight test cycle.
