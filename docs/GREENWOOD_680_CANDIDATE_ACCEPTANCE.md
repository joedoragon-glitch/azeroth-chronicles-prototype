# Greenwood Vale — #679 / draft PR #680 candidate acceptance and scene cards

**2026-11-03.** Implementation checkpoint; provisional visual choices, not a final creative sign-off. Authoritative scope: [issue #679](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/679) and [PR #680 handoff](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/680).

## Hard boundary

**Out of scope, absolutely unchanged:** enemy spawn tables, ordinary monster counts (32), monster locations/homes, density, pack/encounter rates, combat numbers, rewards, attack AI, boss strength, first-level protection. Thornfang patrol was reviewed as geographic characterization, **not** to force new fights. Existing routes and names remain a playable clue network, not remote-target GPS.

## Scenic candidates: fixed scene cards, using existing canonical procedural artwork

| Stable ID suffix | Drawing | Authored coordinates (3,200 world) | Why it belongs there | Placement policy |
| --- | --- | --- | --- | --- |
| `millhaven-poultry` | `poultry-yard` | 520,1170 | One domestic working yard south of homes/gardens | Decorative; no added farm/livestock simulation; road/house/owned parcel clearance |
| `millhaven-flowers` | `wildflowers` | 470,1140 | Dry village garden verge | Small, unobtrusive flowers; no wildflowers in flooded ground |
| `hamlet-pen` | `animal-pen` | 175,2375 | One sheep enclosure with the existing sheep/trough/hay smallhold | Uses the existing sheep pen art; no new physical enclosure or gate |
| `orchard-flowers` | `wildflowers` | 1035,2380 | Cultivated margin by the orchard work area | Avoid the existing orchard road and cellar frontage |
| `pond-reeds-west` | `reeds` | 770,1210 | Sheltered west bank of the millpond | Land edge, outside powered channels, no water geometry change |
| `pond-reeds-east` | `reeds` | 1035,1200 | Sheltered east millpond margin | No sluice/headrace blockage or river crossing change |
| `den-thorn-bed` | `thorn-bed` | 1190,3080 | Single sheltered Thornfang den perimeter cue | Not a hazard, loot source, interaction, or second nest |

These are **provisional**. Any candidate overlapping protected terrain/roads, services, enemy home positions, or player-owned/custom structures is omitted rather than moving those objects. The zone stores an audit receipt for each candidate. Scenery positions must be reviewed in the actual normal-zoom camera and at night before approving any item. Regenerating the whole scene for seven cosmetic props was rejected as unsafe.

## Patrol and witness design

The eight fixed indexed destinations are preserved: den (0) → southern west bank (7) → southern east bank (6) → Forest Crypt perimeter (5) → Skeleton watch (4) → northern east freight bank (3) → northern west freight bank (2) → Goblin perimeter (1) → den (0). No public roads/crossings or saved `thornLeg` indices are changed.

**Pending adversarial decision:** trace *actual* continuous movement along north-west-bank → Goblin frontier, not just straight waypoint connectors. If it passes through Orchard Hamlet, the working mill, or player-owned compounds, repair only with a collision-safe scout-only guidepath after proving it is necessary; do not blindly add waypoints or change combat. Full den→den completion and Mira spacing need evidence beyond eight indices seen.

The same `thorn-local-report` observer remains by the western road, renamed from an inaccurate Orchard witness. Old `thorn-trailhead-2/3` captions are refreshed to Northern freight crossing without duplicating markers. Reports stop claiming exact current boss leg from miles away. Local, recent pawprints are physical evidence, not a permanent radar marker. Exact post-defeat captive recovery information remains available.

## Regression protections and evidence rubric

Focused native checks: `node tests/thorn-witness.test.cjs`, `node tests/greenwood-679-candidate.test.cjs`, and only the related existing Greenwood/navigation/Thornfang tests selected by ordinary focused CI. These check scene-5 save overlay reconciliation, stable IDs, no authored collision, retained monsters and tribute, scout label truthfulness, capped footstep freshness, the full native den→den circuit, Mira physical spacing, and no Millhaven incursion. Follow up on any failure with a reproducible fix, never by weakening an expected invariant to make it pass.

**Visual review still required:** normal/phone zoom and day/night on Millhaven household, Hamlet sheep pen, orchard verge, the actual two millpond shores, den, witness and both bridges; Canvas 2D and optional PixiJS; line-of-sight to services, telegraphs and compounds; owned/custom property coexistence; no render-time explosions. Automated tests cannot certify device feel or final composition.

## Executed focused test receipts (do not confuse with final acceptance)

- **Initial automatic PR run [41652282443](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41652282443)**, source PR head `6a343357469f90e172e1de40c537997256ad68bc`: witness/local-footprint/native save assertions **passed**; four seeded scenery/owned-property/source-count assertions **passed**. Full patrol path diagnostic reported successful physical den-to-den travel, Mira within 96 units and **minimum distance to Millhaven 257 units**, despite completing all eight legs in order. This is a real creative/geographic defect exposed by a new adversarial test, not a claimed acceptance pass. The first assertion also exposed an initial undefined `thornLeg` sentinel before the first patrol update; the test now filters that valid transitional state.
- **Correction:** the new temporary private `westernWoodlandGuide` is used only on 2→1, keeping the established eight indexed legs and all old saves. Mid-leg save/restore and old in-flight no-guide fallback now have explicit checks. The corrective commit is not certified by the initial run.
- **Still required:** a new exact-head focused native pass, native public-path and captive compatibility, review-site packaging, and real gameplay camera comparison. Failure in any check is a blocker, not a reason to weaken a safety threshold.

## Nonproduction playable review

The PR-only GitHub Actions workflow `.github/workflows/greenwood-680-preview.yml` is intentionally limited to **draft PR #680**. It automatically runs just the focused candidate tests and builds a ZIP artifact containing the full ordinary site (`index.html`, scripts, styles, audio, sprites and service worker). It does **not** publish GitHub Pages, deploy, merge, or manually dispatch a comprehensive suite.

After a **successful** workflow run, open the [PR #680 Actions/checks](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/680/checks), download the artifact named `greenwood-680-playable-<commit>`, extract it, then serve that extracted folder through a local static HTTP server. For example, from its folder run `python3 -m http.server 8765`, and open `http://localhost:8765` in Chrome. Do **not** open the HTML directly under `file://`: web browsers restrict its game assets there. Use a separate local browser profile if you want to protect an existing production campaign. The review site is an artifact, **not** a live public URL.

Record the exact workflow SHA, job result, screenshot/device observations, test failures and final owner feedback in PR #680. No release flags or status promotion are inferred merely from a successful build.

## Engineering audit decisions

1. **Rejected:** bumping scene version 5→6 just to rebuild fixed scenery. That would regenerate nature, clear/set scene props and potentially move actors on imported saves. Instead, a one-time cosmetic overlay preserves the established simulation.
2. **Rejected:** new patrol waypoints before measuring the walked route. Keep native bounded search, 8 saved leg indices and original schedule.
3. **Rejected:** omniscient witness reporting live `thornLeg`. Information now derives only from local, unexpired footprints; defeat/rescue clues retain their purpose.
4. **Rejected:** treating decorative reed/wood/pen imagery as resource harvesting or a combat/monster placement system.
5. **Unverified until workflow/device:** focus tests, browser render and nonproduction playable review. All claims of *tested* must identify an observed exact run and commit.

**Release gate:** Keep PR #680 **Draft** and **unmerged**. Do not deploy, manually trigger CI, start a comprehensive test suite or claim physical device verification without separate authorization.
