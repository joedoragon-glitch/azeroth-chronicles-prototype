# Greenwood Vale Flagship Completion — GPT-6.1 Sol / ChatGPT Work handoff

**Status:** Ready for a dedicated Work implementation session; only the planning documents and tracking issues have been created. **No runtime changes, merge or deployment are authorized or implied by this handoff.** Updated owner direction: 28 October 2026.

## Mission

**Finish Greenwood Vale, the game's currently unfinished opening region, to flagship/presentation-card quality.** The owner expects many current players to wander in the first area and not reach other regions. A newcomer should find the first 10 minutes comprehensible, the first 30–60 minutes enjoyable even without following quests, and the region's geography, functioning homes/industry, story and encounters credible and distinctive.

This is **not** merely an optional art polish pass or a requirement to fill every plot with scenery. Build a coherent playable rural woodland province that shows what **So I Became the Dark Lord's Problem** is. Preserve existing finished gameplay, quests, narration, art provenance and five-region canon.

### Single point of coordination

**Delivery epic:** [#545 — Greenwood Vale flagship completion](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/545). Use this for project-level progress and the six child tickets below. Existing five-region creative authority remains [#235](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/235) / [#232](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/232); do not duplicate the global lore program.

**Source audit:** [PR #544](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/544) and [detailed Greenwood geography/livelihood/source audit](GREENWOOD_VALE_GEOGRAPHY_SETTLEMENT_LIVELIHOOD_AUDIT_20261028.md). The audit baseline is `main@2bab5c73...`, not guaranteed current when Work begins. Refresh `main`, current PR states, `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT_STATE.md` and relevant accepted design decisions before editing.

**Separate interaction draft:** [PR #538](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/538). Preserve independently; do not merge it or copy its code wholesale. Reconcile with current `main` when checking interaction feedback. Its dev.209 target is separate from regional rebuild delivery.

## Execution queue (GitHub issue is the current checklist)

| Phase | Task | Expected output | Evidence required |
| --- | --- | --- | --- |
| A | [#546 — baseline and size proof](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/546) | Four-seed plus representative-old-save actual-state census and feasible 3,200/3,400 layouts | Map photos at 150%, placed-vs-skipped props, real clearances, route distance/time, encounter gaps, path cost |
| B | [#547 — geography, rivers and routes](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/547) | Selected expanded authored geometry, water/collision/bridge equality, moved compound/site arrangement and connected roads | Reachability, two usable crossings, real door fronts and saved progress |
| C | [#548 — settlements and livelihood](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/548) | Lived-in Millhaven/Orchard Hamlet, working mill surroundings, orchard expansion, decorative current fruit cellar, estate construction and integrated logistics | Production credibility and 150% phone/desktop scene review |
| D | [#549 — site/lore/quest consistency](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/549) | Mill pond correction, Scornfang cache-to-Treasury supply chain, Southern bridge wayfinding, active orchard, existing occupied old cellars and EN/ES text | All six existing Greenwood quests, normal/TRUE/captive/tribute and site discovery unchanged |
| E | [#550 — first-session showpiece](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/550) | New-player first-ten-minute walkthrough, 30–60 minute optional roaming, district/mill/bridge/territory points of interest, purposeful visuals and atmosphere | Repeatable full scene/camera/lighting/interaction review, not just isolated sprites |
| F | [#551 — compatibility/performance/release acceptance](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/551) | Versioned deterministic old-save migrations, stable campaign economy/combat, exact-head relevant tests/build, performance comparisons, owner review pack | Actual native screenshots; device acceptance remains separately pending until personally observed |

Phase A is the first executable task. Later stages should be implemented in coherent chunks once the measured spatial solution is chosen, not in one unreviewable giant commit. Coordinate B/C/D while preserving acceptance at every checkpoint; E/F are cross-cutting quality gates, not paperwork deferred to the end.

## Specific owner-approved canon

- **Mill pond:** Current screenshot shows a terrain pond plus a small drawn pond landmark. Fix this design mismatch; ensure an actual working mill, wheel, waterside work and coherent water geometry. The separate eastern lake/water feature is a different feature until measured, not an object to erase automatically.
- **Southern footbridge:** Keep practical crossing and original exploration function; if inspected, describe what lies to the north and south **without assuming player approach direction**. Do not create backstory or extra per-bridge XP.
- **Orchard:** Existing named `orchard` should become a **new orchard expansion under establishment**, not abandoned country; retain ID and associated quest/resources. Support more people and the winter estate.
- **Woodland supply cache:** Belongs to **Scornfang**, for materials being transported from the old Crypt to Scornfang-supervised Treasury/estate reclamation operations. Existing code's Treasury display name is **Thornfang's Treasury**, while Scornfang is its captain/superintendent: preserve game IDs/boss and reconcile attribution rather than invent a second Treasury.
- **Old Orchard Cellars:** Already an occupied Goblin family residence with lore and side dungeon; preserve it and add a **separate, current fruit cellar used by local orchard workers**, as decorative only.
- **Region identity:** Many everyday farms, workplaces, orchards, transport businesses and homes must feel active, not replaced with an unending ruin theme. Preserve genuinely dangerous zones and regime pressure, not a sanitized empty park.
- **Space:** Current 2,700 × 2,700 is considered **too small for proportionate assets and coherent distribution**. Evaluate 3,200 and 3,400 (at least +40.5%/+58.6% area); do not solve crowding by shrinking art alone. The completed design must deliberately use additional space and preserve encounter pacing. The owner has not fixed a final dimension yet; Work should recommend a final size from hard evidence and document the choice.

## Quality/acceptance standard

A finished Greenwood offers: visually differentiated and believable districts; an obvious real mill; a productive orchard economy; story-specific Goblin and Skeleton habitation; navigable approach to the estate, Crypt, side-cellars and wagon; region-wide route variety and spare space for the player, companions, fights and major structures; readable mobile camera at the normal 150%; natural transitions of ground, water, light and villages; clear discovery/action feedback; a compelling first town and walkable routes that reveal something worthwhile; correct mobile/desktop UI and no severe performance stalls on the user's eventual device.

**Regression safety:** four existing classes and their startup, all six Vale quests and exact reward accounting, all Thornfang/Mira and Lifebinder/Borin behavior, Scornfang, companions, enemy identity/wounds/deaths, 640-crown finite outdoor tribute, hidden resources, worker orders and previously collected/paid state, both bridges, road navigation and map markers, existing structures/Barracks, all transport entries/returns, Forest Crypt/side-cellars/Treasury and `side-vale-cellars` Codex, version-4 saves/import/export/PWA keys. Do not expand enemy count or payouts to occupy new map without explicit new decision.

**Art:** preserve untouched accepted masters, sprite manifest/provenance and selected procedural visual identities; adjust scenery using established design/sprite processes. No mandatory new raster artwork. Canvas 2D is default; PixiJS/WebGL2 remains experimental/opt-in and can fall back. No implicit global graphics-engine replacement.

## Work autonomy and guardrails

**You own the engineering**: investigate current repo, create and maintain a new implementation branch and appropriately scoped draft PR(s), design and compare map alternatives, implement selected design/canon corrections, run the *smallest relevant* unit/native/build checks, repair regressions and update all affected documentation as work proceeds. Do not repeatedly ask the owner for routine layout/build/technical decisions. If the exact final map dimensions are not externally specified, choose based on measurable evidence and record alternatives. When a material unresolved lore or irreversible gameplay choice arises, present the concrete decision and safe default; do not silently retcon accepted story.

**Stop before:** a merge to `main` (main automatically publishes), any public deployment, comprehensive full-game/browser matrix, changing the game's 0.9.2 release definition, new gameplay rewards/quests/monster counts, or changing the official product identity. These require separate explicit owner approval or workstream. Do not claim iPhone performance or installed-PWA acceptance without actual device reports. No new browser/automation/deployment permissions are implied by Work's ability to use GitHub.

**Quality control workflow:** first rebase planned code on latest `main` (not the old #544 audit branch), compare concurrent PRs, keep small related commits with correct version/generated artifacts for runtime changes, use branch PR evidence, test candidate-specific migrations, and document exactly what passed on which commit. Keep other regions' saved/render source unchanged unless necessary and justified. Avoid unbounded full tests, cosmetic feature sprawl or dozens of concurrent PRs.

**Completion terms:** PLAN = intended. IMPLEMENTED = committed on a branch. TESTED = named checks pass on exact head. MERGED = integrated in `main`. PUBLISHED = exact main Pages deployment verified. DEVICE VERIFIED = user explicitly checked installed phone/device. Do not conflate these.

## Work-mode kickoff instruction (copy into the new Work session)

> Take ownership of **Greenwood Vale flagship opening-region completion** for **So I Became the Dark Lord's Problem**. Connect to `joedoragon-glitch/azeroth-chronicles-prototype`. Start with epic #545, child issues #546–#551, draft PR #544 and this `docs/GREENWOOD_FLAGSHIP_WORK_HANDOFF_20261028.md`. Read current `AGENTS.md`, architecture, development-state and canon; recheck fresh `main`. Greenwood is **unfinished**, and the owner wants it to be a high-quality first-session showcase, not optional polish. Begin execution of phase A now: generate reproducible baseline and realistic 3,200/3,400 expanded-map alternative fixtures, measuring proportions, district breathing room, road/bridge access, enemy pace, saves and phone-sized native visual layouts. Then choose and document the strongest solution, implementing the staged map/settlement/livelihood/site/quality work in safe draft PRs with focused tests and up-to-date checkpoint reports. Retain the owner's specific mill/orchard/Scornfang/old-cellar/bridge lore and all progression compatibility. Handle normal engineering choices autonomously. Do not merge, publish, run full browser suites or claim device verification without explicit approval. Report evidence and blockers back in #545/child issues, not only ephemeral chat.

## Resume state on creation

- **Planned:** Flagship project, issue hierarchy and measurement-first implementation strategy.
- **Implemented:** Audit/Work handoff documents and GitHub issues only; no executable game source.
- **Tested:** Source review only; no current project runtime/device tests.
- **Merged/published/device verified:** No. PR #544 remains draft, and independent PR #538 is unchanged.
