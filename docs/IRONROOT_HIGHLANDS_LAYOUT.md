# Ironroot Highlands livelihood and mine pass

Ironroot remains a mountain province with pine forest, homes, wild Wolf territory and Ogre households. Small production scenes connect its mineral wealth to the Dark Lord's crowns. The Ridge Tyrant serves as the competent Master of Coin; paid work and usable roads support his political argument without making the narrator endorse it.

## Implemented places

Stonecross adds payroll, a small striking press, shipment loading and domestic supper/garden details. Quarry Outpost gains sorting, supports, equipment and rest details. Caravan staging and maintained-road supplies connect the settlements. Ogre hearth life retains its games, bedding and cooking; limited work details do not extend into Wolf habitats. Existing strongholds and Old Signal Keep are preserved.

The personal Treasury retains its entrance, guard quota, three-cache quest and rewards. A connected domestic floor plan replaces the old dividers, with drawn walls matching collision. Supper, hearth, bed, game corner and a small study now dominate its furnishings. Wealth remains in a secure reserve. Crag Tyrant keeps the same Wolf body and captain attacks; his bedding identifies him as a trusted household protector.

Colossus Mine replaces the legacy divider with receiving/haulage, new supported workings, older cuts, a repair forge, collapsed shafts, an ancient boss chamber and a reconnecting hauling loop. The 18 guardians retain the original species allocation and ranged profiles, including stone-throwing Ogres; no ranged Wolves or new weapon identities are introduced. Traps still number 18, with unchanged tuning. Routes to the boss, Dara and work areas allow travel without entering a trap footprint.

## Deliberate choices from the open handoff

| Open choice | Implemented interpretation |
| --- | --- |
| Colossus history | Ancient guardian exposed by old workings; current production routes around its territory rather than controlling it |
| Dara's compelled work | Repairing mining tools, cart axles and supports at a secured repair bench |
| Tyrant's private comfort | Supper and a tabletop game by a warm hearth |
| Minting visibility | One small Stonecross striking workbench, supported by sorted ore and sealed shipments |
| Ridge archers | Hired convoy/payroll escorts; established species, caps, stats and attacks retained |
| Direct Dark Crown presence | Restrained sealed correspondence and guarded movement; no new administrative district |

These interpretations are recorded as implementation decisions for further playtesting. They were not fixed in the earlier discussion.

## Compatibility and verification

The v4 schema, storage keys, currency amounts, rewards, rescues and production sprite manifest remain compatible. Ironroot's Treasury migration preserves the exact collected cache IDs, not merely the count. Mine migration repositions invalid occupants without reviving dead or cleared encounters. Dara's workstation retains the original key/rescue interaction and independent service unlock. Existing save serialization still resets living hostile health and combat transients; this pass does not change that behavior.

The Ironroot regression suite covers deterministic placement, road/service clearances, habitat preservation, real following through the mine, routes avoiding all trap footprints, old occupancy/death/clear/rescue state, TRUE Colossus warband and deterministic procedural drawings. Chromium and WebKit device suites now visit the new Stonecross, Quarry, Treasury and captive-forge scenes using the actual browser renderer. Local Canvas previews use the production renderer. The catalog classifies all new contextual scenes as procedural; the old cage sprite cannot override Dara's equipment bench.

Local verification passed: build, generated-file/sprite checks, formatter checks, the initial 38 non-browser regression suites, all 217 Chromium desktop/phone checks across seven device sizes, the four-size sprite showroom and real binary/offline sprite reads. A pre-change main snapshot migrated successfully, and a direct comparison confirmed unchanged Mine guardian species, names, health/damage, ranged weapons, levels and rewards. Desktop and phone screenshots of the new scenes were visually inspected. WebKit and the exact published-build smoke checks remain release gates in the existing GitHub workflow; they are not claimed as locally completed.
