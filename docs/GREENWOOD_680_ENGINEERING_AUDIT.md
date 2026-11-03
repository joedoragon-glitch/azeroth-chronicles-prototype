# Greenwood Vale — adversarial engineering audit, PR #680

**2026-11-03 · Draft candidate · Owner creative approval pending.**
Authoritative scope: [issue #679](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/679), its November 3 design assessment, and PR #680's complete implementation handoff. This is an engineering audit, **not** an aesthetic acceptance or live-device certification.

## Scope enforcement and reviewed implementation

| Checkpoint | Disposition | Evidence and rationale |
| --- | --- | --- |
| Preserve all monster spawns, density, placement, rates and combat balance | Protected by source diff and exact coordinate/save assertions | No enemy template, pack, spawn, damage, respawn or monster-home code is edited. `rules.js` changes only patrol location captions. Existing ordinary count is 32. New targeted regression captures every saved enemy ID, location and `home` before and after scene restoration. |
| No destructive environment migration | **Initial plan rejected, corrected** | Bumping Greenwood's full `sceneVersion` to 6 was unsafe: a complete scenery rebuild could indirectly move trees and enemies. Final design keeps version 5 and adds a fixed one-time, idempotent `greenwoodRefinementVersion: 1` overlay. It records candidate clearances and never runs generator or enemy-home clearance on the existing scene. |
| Preserve existing player structures and services | Protected, positive native coverage | Every candidate is decorative `r: 0`, uses original procedural visual vocabulary, and is skipped on water, road, reserved service, enemy-home or owned-parcel conflict. Four deterministic fresh and v4-history fixtures verify owned props survive; the same IDs never duplicate after restore. |
| Preserve Thornfang's eight save-compatible patrol legs | Protected | `startLeg:7`, `direction:-1`, route indices `0..7`, base speed `82`, Mira's actual captive NPC, attack/recovery rules and rescue interactions remain unchanged. A separate `thornGuideStep` is persisted only while traversing the 2→1 woodland return. |
| Prevent an unsafe civilian corridor | **Reproduced and corrected** | The original actual north-to-Goblin path approached Millhaven to 257 world units; a first partial guide still approached to 322. Nine private woodland guidepoints now direct only that leg around the northern and western rim, without drawing any public roads or moving monsters. |
| Preserve mid-leg saves including older pre-guide states | Protected by focused executable checks | New guides resume from saved `thornGuideStep`; historical leg-1 saves without that field finish their existing target without a backwards forced detour or teleport. |
| Remove inaccurate live GPS reports | Implemented and tested | Witness keeps original `thorn-local-report` ID at its western-road position; static trailhead IDs survive. A fresh clue requires unexpired physical pawprints within 230 units of the observer or player; current boss leg no longer appears in witness reports. Actual post-defeat Mira waiting hints remain. Saved wrong “Mill crossing” captions become northern freight crossing. |
| English/Spanish presentation | Source-integrated; full browser acceptance open | Updated menu/objective labels, map terms, local witness, Chronicle lore and conditional post-defeat Mira clue. Source spelling and translation assertions alone cannot certify actual bilingual UI rendering. |
| Standard renderers and preview | Candidate build; manual art inspection open | Reuses existing procedural `visuals.js` families and native ambient-life clock. No renderer, collision system, GPU cache or sprite manifest is replaced. Canvas/Pixi normal and phone camera comparison must still be conducted. |
| No publication | Enforced | PR stays **Draft**. The artifact workflow uses `pull_request` limited to PR 680 and `actions/upload-artifact`. It has no Pages publication, production secret, tag, release or merge step. |

## Exact execution evidence

**Run [41654104098](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41654104098)** on source commit `3248d39f216b3228a9a26f685a730806c03d6dde`:
- Passed `tests/thorn-witness.test.cjs`: local time-limited clues, historical witness/trail IDs, rescue, labels and snapshot preservation.
- Passed four-seed native micro-scenes test: seven candidate scene cards, clearance, world source count/tribute, one-time additive old-save and owned-prop migration.
- Passed complete native den-to-den path and save sequence, route order **7→6→5→4→3→2→1→0→7**, approximately **155 seconds** of simulated play. **Mira maximum measured separation 96 world units**. Minimum distances: **Millhaven 457**, **Orchard Hamlet 313**, **working mill 488**, **orchard 577**. A new exact-coordinate preservation assertion was added afterward and needs new-run verification.
- The preview step then **failed** solely because `sw.js` had stale generated content fingerprints. That is a source/release-identity defect, not a native gameplay test failure. Subsequent changes regenerated the worker's exact source hashes and changed the preview builder to regenerate/check isolated runner assets before packaging.
- **Run [41654515724](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41654515724)** on source commit `c796d59fbb5d6bb94a3fee117bdb8e140769abe9` completed both narrow native tests and generated a **downloadable nonproduction playable-site artifact**. Later GitHub `main` updates were reconciled separately and need a fresh acceptance run before using the latest candidate for owner review.

## False positives and trade-offs

- Initial `thornLeg: undefined` during the first patrol tick is a legal transitional state, not a lost route. The test now begins the observed order at the first actual integer leg while still requiring the full circuit and homecoming.
- The geographically safer patrol is longer: representative seeded circuit increased from roughly 124 to **155 simulated seconds**. That changes boss travel timing and possible contact opportunities even though **no encounter rate, spawn, enemy placement or combat parameter** was changed. Owner should judge pacing in-game.
- The nine hidden guidepoints are **not nine new public destinations**. An algorithmic route result can still vary with player-owned obstacles or path budget. Other seeds/occupied saves and physical-device runtime have not been certified.
- Passing Node assertions and generating a site do **not** prove attractive scene composition, uninterrupted visual rendering, touch behavior or phone performance.
- `sw.js` is generated from the exact current source blob fingerprints; it must be regenerated again whenever any core source path changes, including when reconciling a newer `main`.
- Standard automatic focused PR checks may exercise other touched subsystems; they are **not** manually dispatched and do not substitute for separately authorized comprehensive testing.

## Outstanding acceptance gate

Confirm the final exact-head automatic focused checks and preview artifact; conduct owner in-game creative review of seven scene cards, den approach, west observer, both crossings, complete patrol and resting/recapture/rescue. Review Canvas vs Pixi and normal vs phone view, imported saves and owned camps. Any concern remains open as a candidate revision, never an assumed design approval.

**Administrative status:** implementation staged on PR #680; **Draft**, not merged, not deployed, not device-verified. No manually triggered CI or comprehensive suite.

## Adversarial audit follow-up and release permission (2026-11-03)

Release blockers from automatic focused run [41655829881](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41655829881): (1) historic 2700-unit Goblin label was improperly changed globally, now confined to the redesigned Greenwood configure() while original rules.js is restored, (2) old patrol test targeted former Millhaven at (300,350), now checks the **actual new town** with a **360-unit avoidance radius**, and (3) sprite scope source-fingerprint record fell behind changed world.js; reviewed canon/families were unchanged and its current-only SHA-256 updated without rewriting historical receipts. Each requires fresh automatic focused CI before claiming release readiness. Owner separately authorized merge and live publication after this engineering gate; broader manual suites remain out of scope. No spawn, density, enemy position, encounter-rate or combat balance changes were made.
