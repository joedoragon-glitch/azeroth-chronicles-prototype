# Greenwood Vale landmark options — preview only

Owner requests three procedural alternatives each for Millhaven Refuge and the other regional recovery house, Orchard Hamlet. The refuge should read as a leading civic building, while retaining rural town architecture. Orchard Hamlet should convey communal orchard shelter rather than another private cottage. Owner also requests assessment and three alternatives for other landmarks that would benefit. The earlier explicit hold on implementation/publication remains in effect.

Source: published dev.161, main `0f5bf0212dacab5c1551e3ae36915a0bfbf8ca4a`. No live code, gameplay, scenery placement, asset registration, generated entry or version change. Canvas alternatives live solely in `tools/visual-review/vale-landmark-options-20261021/designs.cjs`. Nothing in the runtime imports them. No AI raster generation: the PNGs are repeatable renders of procedural code.

## Bounded regional assessment

| Existing landmark | Finding | Disposition |
| --- | --- | --- |
| Millhaven Refuge (`rest`) | Same cottage renderer as ordinary homes; weak civic/recovery identity | Three requested alternatives: Hearth Hall, Shelter Court, Lantern House |
| Orchard Hamlet (`minor`) | Same recovery cottage as Millhaven; lacks orchard/community identity | Three requested alternatives: Harvest Hall, Orchard Court, Wayside Hearth |
| Millhaven Captain (`recruiter`) | Same generic tiled kiosk silhouette as other services | Three optional alternatives: Watch House, Company Lodge, Captain’s Gate |
| Millhaven Supplies (`supplier`) | Stock detail differs but generic kiosk silhouette repeats | Three optional alternatives: Provision Store, Market Arcade, Wagon Store |
| Mill pond (`mill-pond`) | A tiny generic pool and oar despite the region’s working-mill context | Three optional mill-and-pond ensembles: Wheel House, Pondside Mill, Twin Gable Mill |
| Thornfang’s Treasury (`supply-entrance`) | Reuses cottage with a wide door, leaves and tusks | Three optional alternatives: Thorn Lodge, Root Vault, Stockade Counting House |
| Forest Crypt (`entrance`) | Recognizable stone arch, skull and recessed entry | Retain in this pass; surrounding unfinished-estate treatment can be considered separately |
| Old Orchard Cellars (`den-ruins`) | Distinct low cellar arch and closed, bound doorway | Retain; no side-dungeon mechanics added |
| Quest board (`board`) | Recognizable papers and board; deliberate simple service form | Retain, repair its placement separately |
| Merchant wagon (`outbound`) | Distinct horse/cart travel silhouette | Retain |
| Abandoned orchard (`orchard`) | Fruit grove clearly conveys function | Retain |
| Woodland supply cache (`cache`) | Recognizable chest, lock and tools | Retain |
| Goblin roadside camp (`goblin-camp`) | Readable tent/campfire cluster | Retain |
| Orchard den stockade (`mini-field-thorn`) | Simple gate already distinguishes the defended site; lower visual priority | Retain in this bounded pass |
| Mill bridge, Southern footbridge | Drawn separately as full world-space decks; blank isolated entity drawings are not missing assets | Retain; no bridge or collision change |
| Thornfang trailheads/witness | Functional route cues and NPC rather than replacement buildings | Retain |

Alternatives share terracotta tiles, warm plaster, timber framing, mossy stone, strong dark contours and shallow three-quarter perspective. Identity comes from silhouette and use: sheltered rest, civic lantern, orchard crest, guard balcony, equipment, stock loading, working wheel or defended vault. The symbol for shelter is an emblem, not a new quest marker. Added architectural bays/props are part of each candidate drawing, not new interactable actors.

Sheets show enlarged choices and compact procedural comparisons against the current renderer. They are design references, not final map placement or collision certification. Larger/taller candidates require a native plot/door/occlusion review if chosen, especially the northern-edge Refuge plot. No doorway, footprint, interaction range, water or collision rule has changed. A mill selection would require a deliberate visual shoreline fit; the drawn water is a preview, not a new water hazard.

## Pending owner-reported placement repairs

1. Props superimposed on the house near the moved Refuge/Captain area: screenshot `F6409E8D-99D6-4DC0-A54B-622A1B7F67F3.png`. The left/front-wall sack/container overlap is visible. Exact decorative actor IDs still need investigation during implementation.
2. A signboard wedged between the well and house: screenshot `206637ED-4D72-4389-8CB7-859AB699AC43.png`. Exact actor ID still needs investigation; do not mistake intended architectural joints for the reported independent prop overlap.

3. Replace dev.161’s ordinary level-1 field protection duration with a saved first-monster-kill boundary. Native ordinary aggression resumes after the first hero-involved kill even if still level 1; accidental nonlethal damage does not globally unlock the field. Thornfang’s separate once-per-run personal-hit gate and level-2 Thornfang/Mira arrival remain. This is requested behavior only, not implemented.

All three remain pending. Uploaded screenshots were visible in chat; their reported scratch paths were unavailable. No copy or fabricated source ID is recorded.

## Evidence and next action

Preview renderer creates eighteen transparent references, six A/B/C sheets and a current-landmark drawing census, six native current-plot 150% contexts (procedural fallback only), with a read-only campaign-state assertion. These are preview checks only, not gameplay/device tests. Per-design handoffs preserve the exact option labels/source and do not record acceptance, sprite authorization or release. A recoverable design branch is retained without merging or triggering broad CI.

Next action: Joel selects or revises an option for each desired location. Keep unselected options and the two placement reports. Implementation/publication remains on hold until Joel asks to apply the collected changes.

## Additional queued procedural NPC correction — trail witness

The Orchard trail witness (`thorn-local-report`, `kind: patrol-report`) is the NPC that reports Thornfang's route. Owner reports an impossible two-left-hands appearance and a weaker silhouette/detail standard than newer procedural NPCs. Current source in `src/prototype/visuals.js`, `e.kind === 'patrol-report'`, draws two separate `grip` calls at local positions `(14,-5)` and `(20,-4)`, adjacent to the report sheet and staff; this is a concrete anatomical-composition suspect, **not** proof that changing either call alone suffices. It needs a full, carefully composed procedural scout redraw, with two believable anatomically distinct arms/hands and a visually intelligible staff/report relationship, preserving the moss hood/cloak, copper clasp, scarf, satchel, field chart and practical trail-scout identity. Inspect at native game scale and verify the staff, chart, hand count, silhouette and accessories from the actual draw order. Preserve NPC ID, position, interaction, patrol reports and gameplay. No visual or gameplay modification is authorized in this preview-only batch.

## Focused follow-up code findings (no runtime change)

The ordinary aggression boundary currently lives in `src/prototype/field-onboarding.js:awaitsHeroAttack`: an unprovoked ordinary Vale enemy is protected while hero level is below `R.fieldOnboarding.spawnLevel` (level 2). `admitOpeningHeroAttack` sets the enemy-local `introHeroProvoked` flag on an admitted deliberate hit. Owner's revised rule is a **saved first hero-involved monster kill boundary**, not a first hit and not level 2. Implementation should gate only ordinary Greenwood Vale field monsters on that saved fact; keep the per-enemy provocation needed to respond to deliberate attacks before the first kill, keep automatic/basic/companion restrictions for protected enemies, preserve migration and v4 saved-state validation, and leave Thornfang's own first-personal-hit and level-2 appearance logic separate. No implementation, tests or publication are claimed for this request.

Reference for review outside GitHub: a standalone interactive viewer was prepared from the exact pinned `designs.cjs` URL, with options only and no remote mutations; whether the remote script loads depends on the review browser's network access. Original render scripts and six choice-sheet definitions in this branch remain authoritative.

## Owner decisions — 21 October 2026

- **Millhaven Refuge: B — Shelter Court APPROVED as the preferred procedural design** (three-building court with central entrance; owner selected B in design review). This is *design approval only*: do not implement, merge or deploy until owner authorizes the implementation batch. Plot, doorway, clearance and occlusion still require native fit review before use.
