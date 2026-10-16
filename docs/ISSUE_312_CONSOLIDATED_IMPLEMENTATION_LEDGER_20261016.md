# Issue #312 — consolidated source integration ledger · 16 October 2026

**OPEN: implementation underway. Not tested, built, browser-validated, CI-certified, merged, deployed or released.** All 18 PT-001–PT-018 definitions and acceptance conditions remain authoritative in [Issue #312](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/312). This is a source integration record, not a claim that all 18 are fixed.

## Recovery and current priorities

- Source foundation: Community Snapshot `ca33acb14d92cbce12633eaab702318343dce509` + 10-issue PR #311, already combined at `f0e08ba7341a557dcb6ba9eb33d652a9e03dd339`.
- New PR #311 self-contained handoff `b6217312beefb451b9521d3303565f4778973b30` changes **only its audit document** versus the previously integrated head; no 10-issue runtime code needs reintegration.
- Continue on `integration/community-snapshot-311-20261016`; source edits/checkpoints use `[skip ci]`. Retain originals, protected #308 hash history, save v4 and unmerged PR #311.
- The owner explicitly prioritizes **one fully consolidated, properly source-audited implementation** over time-to-validation. Any subsequent overnight cycle, publication and release all require separate later decisions.

## PT issue status and source responsibility

| PT ID | Current disposition | Unresolved work/evidence |
| --- | --- | --- |
| PT-001 | Source reviewed: four core Thornfang skills and weighted refill already exist. No observed runtime reproduction. | Reproduce absent pup refill with cooldown, leash, range, normal/TRUE and Developer; then correct only an established deficiency. |
| PT-002 | Not implemented. Navigation has terrain/prop collision, not general live-body steering. | Time-bounded friendly congestion relief, normal de-stacking, large boss priority and walls; gameplay and old saves. |
| PT-003 | **Partial source change**: ordinary Goblin/skeleton attack selection and explicitly supplied weapon names use steel/organic categorization instead of blunt Goblin default. | Trace actual equipment through real strike events and test windup/swing/hit/terrain material, overcrowded audio and phones. |
| PT-004 | Not implemented. | Greenwood Orchard Den/cart, cellar access, Millhaven west footpaths and service life; identify exact obstruction by composed scene. |
| PT-005 | Not implemented. | Southern Footbridge connections on both banks, Treasury access, Forest Crypt logistics. |
| PT-006 | Not implemented. | Marches cattails in actual wetland/water overlay, retain limited saturated inland plants. |
| PT-007 | Source gap identified: unbounded captainSpread/area offsets. Not implemented. | Connected-room valid strike footprints and telegraph/hit parity for all patterns, not Direjaw only. |
| PT-008 | Not implemented optional restrained hierarchy. | No wallhack boss visibility or oversized icon; actual crowds. |
| PT-009 | Not implemented. | Lake Causeway water continuity, curved banks, road crossings and marsh ecology. |
| PT-010 | Not implemented. | Source-coordinate and final composed five-region environment coherence audit. |
| PT-011 | Not implemented. | Selective Ogre-standard organic rounding for creatures, transports and props without generic cuteness or sprite churn. |
| PT-012 | **Partial source change**: real Ridge Rolling Cargo launch and wall collision now send cargo-specific audible events to existing audio owner. | Actual LEDGER CAST continuation versus legitimate leash/interrupt, plus actual heavy cargo flight/hit/ground audio quality. |
| PT-013 | Not implemented. | Ironroot rivers spanning map, Timber Crossing/Stone Bridge road graph; full-region water semantics. |
| PT-014 | Not implemented. | Ridge Treasury carriageway clearing, mining logistics and portals. |
| PT-015 | Not implemented (cargo subset overlaps PT-012). | All boss/captain/TRUE and Rogue event matrices, prioritized warning/release/impact and audio mix. |
| PT-016 | Not implemented. | All dungeon/Treasury/occupied interior entrance pacing, no indiscriminate enemy/trap nerfs. |
| PT-017 | Not implemented. | Species-appropriate inhabited interiors, Old Signal Keep and current occupants first, collision and old saves. |
| PT-018 | **Source implementation**: Developer-only zero fare, return-ticket bypass, no paid ticket/recovery mutation, Crown hub availability, visible FREE label. | Run authored no-crowns transport loop and Normal/Nightmare negative controls; old saves/phone/menu. |

## Source-audit discipline

All source additions remain **provisional**. No runtime, editor/formatter execution, build, browser, simulation, test, CI, performance check, or manual native visual/audio validation has been initiated. Prepared acceptance probes are not successful tests. Do not claim issue completion based on compiling or editing a line. Every new PT implementation needs traceable owner, source evidence, adversarial regression cases, dependencies and unresolved caveats. Preserve historical hashes: add exact provenance overlay for changed files, never delete or relax old assertions. Owner subsequently authorized **one DRAFT integration PR for Work-mode handoff** while testing stays prohibited. Since the PR event can launch Actions, keep `[skip ci]` on the latest commit, inspect actual Actions state after PR creation, and do not dispatch CI manually.

## Next implementation passes (not an overnight-validation commitment)

1. Finish high-impact source mechanics PT-002, PT-007, PT-001 and remaining PT-012 behavior; independent source audit for preserving challenge, fair telegraphs and old saves.
2. Ground PT-004/005/006/009/010/013/014 using current source's actual hydrology, roads, props, bridge layouts and sprite footprints. Edit related systems together, then audit all five regions.
3. Complete PT-003/015 event fidelity and PT-008/011/016/017 world/presentation/interior refinements; maintain original art, economy, dungeon challenge and meaningful monster dwellings.
4. Redo the **full cross-feature source execution audit**, including Community pets/Recall, all PR #311 issues, every PT ID, exact modified source receipts, and authored acceptance matrix. Correct findings, re-audit until source readiness is earned. Only then discuss a consolidated validation cycle with the owner.
