# Issue #239 — Ironroot silver and copper production

**Owner correction (11 October 2026):** The coins are called **crowns**, and they bear **the Dark Lord's face**. No five-point insignia, regional symbolism, new reverse image or additional denomination is approved. Ironroot mines **both silver and copper**. The exact proportion of the two metals in a crown is **not specified** and is not needed for the beta.

## Historically grounded production, without inventing canon

Coinage historically used silver alloyed with copper for durability; historical sterling silver used 92.5% silver and 7.5% copper, but **that number is reference context, not this game's specification**. Coins bearing rulers' portraits are a long-established practice. Royal ceremonial crowns may be gold or silver-gilt and need not share their metals with circulating currency. See [Royal Mint Museum on the crown coin](https://www.royalmintmuseum.org.uk/journal/curators-corner/crown/) and [Royal Collection Trust on regalia](https://www.rct.uk/collection/stories/the-crown-jewels).

The intended readable sequence is **silver ore + copper ore → mining → sorting → refining and alloy preparation → striking crowns with the Dark Lord's portrait → guarded distribution across all five regions**. The Ridge Tyrant retains the Master of Coin role. No second currency, new economic resource, exchange rate, pay quantity, tax system or gameplay production subsystem.

## World locations and visual implementation

| Stage | Player-visible cue |
| --- | --- |
| Mining | Dark silver-bearing faces and separate rusty orange/green copper-bearing faces beside the existing Stonecross ore site and mine approach |
| Colossus Mine | Silver/copper ore faces in the standard workings and both samples in the receiving/haulage area; existing guards, traps, rescue workbench, rooms, routes and Colossus unchanged |
| Sorting | Silver chips and distinct copper-orange samples at Quarry Outpost; **stone quarrying remains a separate construction-material activity** |
| Refining | Stonecross refining hearth and both mined metals connected to the existing mint; no new gameplay ingredients |
| Striking | Existing mint with a small supplemental die tray showing **the Dark Lord's profile** on silver-colored crowns |
| Distribution | Existing Crown-guarded caravan consignments marked with the ruler's portrait, using the same roads and escorts |

These details use decorative structures with zero collision, preserve existing approved sprites, and use the existing Highlands scenery version 3 to refresh earlier saves. No existing numeric values, biome, town, NPCs, Wolf/Ogre territories, encounters or game progression change.

## Beta acceptance and evidence checklist

- [ ] Observe **both distinct ore types** outdoors and inside Colossus Mine.
- [ ] Verify Quarry Outpost's metal sorting and independent stone quarrying remain believable.
- [ ] Observe refining, Dark Lord portrait striking, and guarded shipments in Stonecross/caravan staging.
- [ ] Confirm unchanged resource totals, rewards, prices, currency labels, roads, routes, save/restoration, mines' guards/traps and residences.
- [ ] Run node, asset/sprite checks, historical saves, Chromium, WebKit and offline/browser gates; attach real results for the PR head SHA.
- [ ] Owner reviews the implementation. **No merge or deployment.**

Wolf-mounted Crown soldiers remain an unrelated, deferred P2 idea in [IRONROOT_WOLF_CAVALRY_DEFERRED.md](IRONROOT_WOLF_CAVALRY_DEFERRED.md).
