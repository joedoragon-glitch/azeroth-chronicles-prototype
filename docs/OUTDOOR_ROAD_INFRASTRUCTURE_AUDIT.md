# Outdoor settlement and road-infrastructure audit

This audit covers the five outdoor regions and all ten major/minor settlements, not dungeon interiors. It preserves region boundaries, enemy rewards and encounter tuning, quest identifiers, authored architecture, service identities, and v4 save compatibility. Its scope includes natural and military habitation as well as formal towns.

## Road hierarchy and land use

1. **Town squares and primary routes.** A central public square is a traversable **place**, not the location of a refuge building. A direct route to the secondary settlement and a direct regional-field artery form the strategic skeleton. Existing ferries, outward transport stands, and major campaign destinations must remain reachable.
2. **Branches serve real destinations.** Continue from existing junctions toward named sites, main dungeon entrances, civilian habitats, monster strongholds, civilian production and occupation districts. The route planner skips destinations already within a useful road approach rather than laying a redundant line for every decoration.
3. **Compound thresholds.** Access roads reach a sensible distance from the entrance of a fort, occupation yard, monster den, dungeon, or production site rather than drawing paving through its houses, walls, military equipment, or inhabitants. Bridges and expressly flat road repairs are exceptions because they belong to the usable roadway.
4. **Built frontages.** Reserve the *painted visual footprint*, not only a small collision circle. Refuge houses need greater setbacks than signposts and small objects. Barracks must not be founded on an existing route; existing saved barracks must be moved to a usable plot without losing upgrades.
5. **Functional and atmospheric identity.** Inland villages, wetland fisheries, Ironroot crown/mine shipments, Frontier occupation logistics, and Crown military/levy/siege roads must correspond to the structures and settlements actually present in their regions. Wilderness must remain recognizable; a road is a transport service, not filler decoration.

## Coverage by region

| Region | Settlements | Sites and infrastructure to serve |
| --- | --- | --- |
| Greenwood Vale | Millhaven, Orchard Hamlet | Orchard livelihood, goblin camp and fort, woodland strongholds, mill approaches, Forest Crypt, trade wagon and bridges |
| Flooded Marches | Reedport, Fisher Camp | Ferry, raised crossings, Archive, Mirejaw territory, fishing habitats, reed-beast dwellings, night wraith hold and watchhouse |
| Ironroot Highlands | Stonecross, Quarry Outpost | Mint/payroll and market, quarry, ore and caravan loading, Wolf and Ogre homes, Mine, Signal Keep, ferry and crossings |
| Ashen Frontier | Emberwatch, Burned Hamlet | Convoy and roadworks, ravine crossing, shrine, inspection and checkpoint logistics, Orc/Raider/Stalker holds, military dragon project and civilian departure |
| Dark Crown | Crownwatch, Ash Refuge | Labor/levy quarter, dragon platform, foundry and administrative roads, Citadel, garrisons, ash-beast territories, siege works, fortress transit and gate |

## Implementation ownership

- `src/prototype/world.js` supplies road targets using existing `PrototypeData` and `PrototypeRules` locations and branches new roads from existing junctions. Streets are recalculated with a versioned save-compatible migration.
- `clearStreetCorridors` audits the *complete* post-authoring prop inventory: generic trees, regional daily life, named/hostile districts, saved barracks, and the major/minor refuge buildings. Only flat `roadTrace` road-surface wear/repair may lie directly on the road.
- `src/prototype/engine.js` selects a clear plot before charging for and creating future barracks. Refuge buildings retain the original service/respawn squares as independent gameplay anchors.

## Release acceptance

The new `tests/town-street-audit.test.cjs` enforces connected roads, every named site's road proximity, building/prop setbacks, the ten refuge positions, old-save migrations and both historical/future barracks construction. `tests/dungeon-pressure.test.cjs` protects the nearby combat lanes, including marsh ranged inhabitants. Regular Node, Chromium, WebKit, renderer, offline/PWA, and scope-evidence checks remain mandatory. **A draft PR is not a claim of visual inspection or a playable release.** Review actual desktop/phone scenes after CI and make further placement revisions if a visible roof, tree or wall still touches the road.

These are engineering/aesthetic criteria, not authorization to add enemies, reshape combat ranges, widen the whole world or replace the existing procedural visual canon.
