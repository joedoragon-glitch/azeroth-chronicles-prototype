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

## Phase 1 environmental composition review — 31 October 2026 (draft #732, evidence only)

**Owner's quality standard:** Evaluate the existing region from the perspectives of a game designer, photographer and person who could actually walk and live here. Judge material/geographical credibility, purposeful work and shelter, framing/depth/focal hierarchy, the rhythm between occupied and open areas, and the integrity of ordinary life alongside destruction. More props or effects are not necessarily better. **The owner reserves comprehensive road-network design for a separately guided discussion:** do not connect roads or broadly relocate established scenery simply to satisfy a connectivity count. Only assess a specific physical obstruction if it becomes evident in actual gameplay.

**Actual performed review:** The Phase 1 test in `tests/environment-phase1-regions.test.cjs` captures 30 source-native Canvas reference views at the game's 150% gameplay zoom across all five regions. The original [focused run #41227900417](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41227900417) successfully produced and retained the 30 PNG views/checksums. Ashen Frontier subjects include Emberwatch, Burned Hamlet, the scarred crossing, the western recovering woodland, occupied checkpoint and Bastion approach. These are camera samples in isolated game Campaigns, **not** measured continuous human walk-throughs, full Pixi images or physical-device approval.

**Visual disposition:** The present Frontier convincingly distinguishes repaired domestic and supply spaces from scorched military infrastructure and recovering soil. The western recovery shot at (920,2120) shows repeated silhouettes of burned trunks with small new growth. Two bounded art experiments were considered in draft #732, and neither was accepted:
- The first attempted to vary the procedural `dead-tree` shape; the **entire 30-view before/after image set remained pixel-identical**, so it was removed as not demonstrating a real scenic improvement.
- The second attempted to vary only the small new-growth overlay on retained raster trunks, leaving approved base sprites unchanged; the **30-view before/after image set again remained pixel-identical**. Its new overlay-focused unit test also failed a required shape assertion. It too was **reverted, with its temporary test removed**. Do not call either candidate implemented or visually approved merely because its intermediate branch commits exist.

**Important cross-renderer discovery, not silently waived:** Source shows that Canvas's `frontierTreeShoots` layer for retained burned-tree rasters is still explicitly marked **not ported to Pixi** in `tools/webgl-pilot/native-sprite-adapter.js`, while PixiJS is now the default renderer. That is an existing, specific renderer-fidelity debt, not evidence that the Frontier's whole region looks different or that the current screenshot's tree family uses that raster route. It was transferred to the **existing #478 renderer parity work** in [the source-grounded follow-up](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/478#issuecomment-6547365348) for a depth-correct, performance-bounded solution before Phase 4 atmosphere acceptance. Phase 1 must not ship a change visible only in backup Canvas, replace approved original artwork or silently add per-tree GPU textures.

**Phase 1 current result:** Design and native scene review are complete with **no accepted runtime or environment-art change**: world geometry, roads, props, tree sprites, encounters, saves and soundtrack remain as on source main. The results justify protecting the current region identity rather than running a speculative recoloring/roadside clutter campaign. Later owner-device and human traversal/artistic acceptance, and direct Pixi/Canvas source-image parity, remain separately unverified. Any future aesthetic improvement must be supported by an actual pixel delta in the intended active renderer, compositionally reviewed at gameplay scale, and retested without harming what is already successful.
