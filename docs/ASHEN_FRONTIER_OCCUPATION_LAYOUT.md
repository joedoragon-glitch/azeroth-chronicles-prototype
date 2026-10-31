> **Reference boundary — 19 October 2026:** Design/ownership rules below remain reference material where consistent with current source and later director decisions. Version numbers, asset counts, historical verification and next-stage instructions describe their own checkpoints. Development is paused; use [current state](DEVELOPMENT_STATE.md) and [the documentation index](DOCUMENTATION_INDEX.md) before any new work.

# Ashen Frontier occupation/recovery layout pass

This pass keeps Ashen Frontier fully procedural and turns its existing ingredients into a clearer occupied-frontier identity. It introduces no sprites, no new rewards, no combat rebalance and no progression changes.

## Current lore-ground reconciliation — 30 October 2026, draft PR #698

The Frontier is a recovering occupied province, not uniformly scorched. Its current
`data.js` and `rules.frontierRecoveryScenes` explicitly place pioneer grasses,
young trees, poppies, repaired gardens and cool soil among charred ruins. The older
T004 uniform ash raster is therefore retired from active registration, preserving
its original and approval record as rollback history. The draft renderer adds
one restrained west-to-east cool-soil transition, feathered local moss-earth washes, fine mixed ash/sediment grain, and sparse rooted growth in those named
locations, with damage and military infrastructure still visible. The original
ravine, pools, roads, existing props and gameplay/collision geometry are untouched.

**Native engineering art review, 31 October 2026:** Six real-game Canvas views at 150% zoom (Emberwatch, Burned Hamlet, western regrowth, northern ravine, checkpoint and night Bastion) were compared before/after on the same engine/world. The area transitions, subdued regrowth, road readability and preserved scarred areas were examined; an excessively smooth first pass was corrected by procedural ash/soil grain. The current PR's exact-head [12 focused checks and offline build](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41175895963) and [browser PWA update checks](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41175895959) passed on the pre-cleanup candidate. This is **not** owner-device acceptance or measured FPS; the final test-harness cleanup requires revalidation before merge.
Before release, inspect actual 150% day/night scenes and run the focused material,
rendering and reproducible offline checks. No broad terrain recoloring or green
meadow replacement is authorized by this focused reconstruction.

## Regional identity

Ashen Frontier is no longer treated as only a burned battlefield on the road to Dark Crown. The region now reads as land that was devastated first and then consolidated because stable roads, specialist labor, garrison rest points and reliable supply flow are more useful to the regime than permanent chaos.

The scars remain visible. Burned ground, ruined structures, charred vegetation and the ravine still communicate the earlier destruction. New procedural dressing is deliberately crude and functional rather than elegant reconstruction.

## Civilian recovery

### Emberwatch

Emberwatch remains the main surviving settlement. Its new livelihood layer mixes market activity, food preparation, supplies, fuel, carts and repair work with watch infrastructure. The visual message is a settlement that still functions, but under occupation control.

### Burned Hamlet

Burned Hamlet is explicitly neither healthy nor abandoned. Its procedural layer mixes ash and burned remains with tools, wood, carts, food preparation and stored supplies. Existing patched Frontier houses remain the main architecture, while the new props make the history legible: people are living and rebuilding inside the damage rather than after it has disappeared.

## Occupation corridor

The Frontier road network now has its own version and reaches five dedicated functional spurs:

1. convoy service and supply handling;
2. northern ravine roadworks;
3. Cinder Warlord inspection/administrative ground;
4. checkpoint logistics supporting the Ashen Warlord;
5. the controlled approach to Abyss Bastion.

Existing routes to Burned Hamlet, the field-boss checkpoint, Abyss Bastion and the dragon roost remain intact. The Ruined Shrine, convoy and Orc bivouac are also connected into the practical road network instead of reading as isolated map decorations.

## Hierarchy

The Ashen Warlord remains the regional military governor and field boss. His checkpoint now has a visibly separate support/logistics sphere.

Cinder Warlord remains the roaming middle-management captain. The new inspection-yard and road-administration dressing reinforces his existing patrol/discipline role without changing his combat mechanics.

Abyss Dragon is the Dark Lord’s purple dragon and personal flying mount. The guarded Bastion approach provisions his air-superiority project: population growth, rider preparation and facilities under construction. Purple royal flight standards and saddle/harness equipment identify that purpose. This 8 October decision supersedes the earlier generic support/containment interpretation; see `ABYSS_AIR_SUPERIORITY_CANON.md`.

## Ordinary monster life

The pass preserves the existing Orc road fort, Raider drill redoubt and night Stalker cinder hold. These remain ordinary-monster centers of power with sleeping, cooking, training, storage, guarding and personal-use props. The Ruined Shrine interior also remains an Orc barracks conversion.

## Practical safeguards

- All new Frontier district props are procedural.
- New occupation/recovery props are decorative rather than new collision walls.
- Existing bosses, enemies, rewards, resources, quests and rescues are preserved.
- Frontier roads receive a save-safe version bump; existing saves regenerate only the road/layout presentation layer.
- Regression coverage checks route reachability, district identity, settlement history, Bastion/checkpoint separation, multiple monster strongholds and the night Stalker hold.

## Phase 1 environmental-finishing candidate — 31 October 2026 (draft #732, NOT RELEASED)

**Owner's visual direction:** Judge the world as a game designer, photographer and someone who actually inhabits and walks the place. A landscape should have convincing foreground/midground/background, coherent terrain use and believable evidence of work, shelter and recovery; it must still be intelligible while moving, not merely attractive as a still. Good composition includes breathing room; more props, effects or road links are not automatically improvements. The owner explicitly reserves broader road-network design for a separately directed effort. **Phase 1 does not connect roads or displace established houses or scenery in pursuit of graph connectivity.**

**Observed current-game visual issue and targeted response:** A 150%-zoom real-Campaign screenshot of the recovering western Frontier near (920, 2120) shows a close concentration of same-silhouette burned trunks. That visual repetition risks reading as stamped scenery instead of a woodland at mixed stages of recovery. The narrow draft correction is in `src/prototype/visuals.js`: each existing `dead-tree` gets a small, identity-seeded width/height/lean variation, and any fresh green epicormic shoots use the identical local tree profile so they remain attached to the branch. It changes **drawing only**: no authorial tree IDs or count, coordinates, encounter distribution, shelter and civilian props, procedural ground, road path, collision, combat, saves, source raster, or plant-spawn rules. Other regions' dead trees and the `dead-shrub`/`dry-scrub` families retain their exact original silhouettes. The existing approved green shoots and scorched-plus-recovery lore remain protected.

**Quality requirements before acceptance:** Review genuine before/after Frontier recovery/char views at 150% gameplay scale (day and night where informative); inspect whether variation looks natural rather than random/synthetic, green shoots remain biologically attached, and negative space/players/hazards remain legible. The focused unit tests should verify stable identities, identical output on repeat, no entity mutation and unchanged non-Frontier/shrub silhouettes; the original source/render/sprite checks and offline build must also pass. CI screenshot receipts alone do **not** mean artistic approval, default-Pixi physical parity, installed-device performance, or publication. If the candidate looks worse in its actual image pairs, revert this localized shape variation rather than compensating with unrelated vegetation or more clutter. The full region remains committed to the existing documented recovery and occupation identity.

**Phase 1 composition coverage:** The new `tests/environment-phase1-regions.test.cjs` captures 30 live-Campaign camera views from all five outdoor regions at 150% presentation scale. They cover identifiable starts/secondary settlements, lived-in work areas, characteristic wilderness and important landmark approaches, without altering real saves, geometry or roads. The draft workflow retains PNGs and metadata. Source-native Canvas previews are reference evidence, not substitute device or default PixiJS acceptance. Region-specific owner artistic acceptance remains unclaimed.
