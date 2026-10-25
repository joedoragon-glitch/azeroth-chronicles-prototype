# Documentation coverage and authority triage — 25 October 2026

**Scope and evidence level:** This is a **current-path census and status-triage supplement**, not a declaration that every historical claim or every document body has been re-reviewed. The [machine-readable coverage register](DOCUMENTATION_COVERAGE_REGISTER_20261025.json) enumerates every Markdown path in the pinned draft tree plus this companion page, with the exact Git blob ID, frozen-census membership, current index discoverability, a conservative topic/role label and an explicit review-depth marker. The metadata does **not** replace game source, test policy, sprite registries, or the immutable [19 October inventory](DOCUMENTATION_INDEX.md). No dated task inside an older document independently authorizes resumed work.

## Pinned comparison

| Source | Verified state |
| --- | --- |
| Live release baseline | [`main` `e3c78266b28f`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/e3c78266b28f3325d2afdcb76ae849fcff306deb), package `0.9.1+snapshot.dev.185`, [focused validation and Pages publication #40208508280](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40208508280) passed |
| Draft documentation before registry | [PR #465 head `84249365a69d`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/84249365a69dee658b7427356d6b8af18732989b); open draft, not merged/deployed |
| Markdown tracked at the pinned pre-register tree | **331 paths**, of which **312** under `docs/` |
| Docs in the preserved 19 October table | **160 current paths** (the table itself has 175 incoming records across types/locations) |
| Docs absent from that older frozen census | **152** |
| Docs lacking a direct conventional local Markdown link in the pre-register index | **74**; absence of a direct link is **not** proof of an orphaned or inaccurate document |
| Assessment completed here | All tracked Markdown paths mechanically enumerated; the first 14–19 source lines of the **74 direct-link-absent docs** inspected; release/merge state spot-checked against named PRs |
| Not completed or not represented as completed | Deep full-body assessment of all 152 newer docs; individual source/acceptance verification for every dated claim; browser/device acceptance; current status of every historical draft |

## Verified cross-record routing

- **Navigation:** [Stages 2–5](NAVIGATION_STAGE2_20261023.md) are implementation-stage records; [integration PR #421](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/421) is **merged**. They are not invitations to reopen the earlier staged work.
- **Adaptive FPS and crowd protection:** [earlier draft](ADAPTIVE_FRAME_SKIP_TWO_FRAME_20261023.md) and [current-for-dev.169 reference](CURRENT_PERFORMANCE_STATUS_DEV169_20261024.md) preserve different dated assertions; the consolidated [PR #426](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/426) was **merged and published**. Hardware FPS gains are not established by a focused test.
- **Hero Skill 1:** [Area 1–4 checkpoints](HERO_SKILL1_AREA4_FINAL_REVIEW_20261024.md) and [first-pass design](HERO_SKILL1_FINAL_BALANCE_SPEC_20261024.md) are dated stages; [PR #439](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/439) is **merged**. The older “draft/unmerged” wording should not trigger implementation again.
- **Bilingual narrative and Archive:** the dependent [N1](N1_BILINGUAL_NARRATIVE_INTEGRATION_20261024.md), [A2–A3](A2_A3_ARCHIVE_BOOKSHELF_READING_20261024.md), and [A4–A5](A4_A5_ARCHIVE_BILINGUAL_VALIDATION_20261024.md) records describe a staged candidate. PRs [#428](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/428), [#430](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/430), [#432](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/432) and [#433](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/433) are **closed without merge**. These are **not** live-release claims, and closure does not erase their authored text or approval history.
- **Renderer:** [PixiJS Step 2/3](PIXIJS_PLAYTEST_STEP2_20261022.md) and [pre-Step-4](PIXIJS_PRE_STEP4_HANDOFF_20261022.md) describe an older branch-only state. [PixiJS integration #407](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/407) is **merged**; use current production source and current fallback guidance for gameplay/renderer choices, not the older not-merged checkpoint.
- **Menu/navigation UX and runtime optimization:** historical [Step 7](MENU_STEP7_AUDIT_20261023.md), [dev.177 workload audit](RUNTIME_WORKLOAD_DEV177_AUDIT.md) and companion stage reports are bounded by their original commits; [#415](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/415) and [#442](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/442) are **merged**, not pending review candidates.
- **Held healing candidate:** [25 October held candidate](RELEASE_CANDIDATE_HEALING_ROGUE_20261025.md) describes an unreleased combined proposal. [PR #454](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/454) was **closed without merge**. Do not infer merged captain-healing features from its contents or reactivate the held candidate.
- **Original approved artwork/narrative:** preserve masters, design decisions, accepted wording and source hashes. A historical “approved” record can define an artistic contract, but **never alone grants permission to activate unseen assets, reproduce closed PRs or deploy**. For current use read the [live policy](../AGENTS.md) and the [sprite design workflow](DESIGN_TO_SPRITE_WORKFLOW.md).

## Conservative registry semantics

`censusSource=oct19_frozen` means *present in the old recorded inventory*, not that its October disposition is current. `censusSource=post_oct19` means *absent from that specific table*, not that the document was created on a verified exact date. `role=dated_record` is a **routing label only**; dated source can still include valid design canon or numeric contracts. `reviewDepth=header_screened` means a bounded first-lines inspection, not full recertification. `reviewDepth=path_only` means the path/Git blob was inventoried but its body has **not** been validated by this pass. `authority=current_entrypoint` is reserved for maintained operational entrypoints and does not override the owner's task-specific approval.

The register deliberately leaves source authority at `verify_with_current_source` for historical and not-yet-reviewed material. **No approval, merge status, numerical truth, or supersession is inferred solely from filenames or the presence of a link.**

## Next documentation-governance step

Continue a **bounded full-text and exact-PR/source review** for high-risk newer records first (narrative/Archive, active combat proposals, performance, renderer, navigation), then assign specific supersession edges only where established. Do not call `Phase 2 complete` merely because every file has a metadata row. Phase 4's proposed standalone checker and any CI/workflow changes remain separately scoped and are **not** added here. Track B source-to-test governance remains a distinct read-only investigation.
