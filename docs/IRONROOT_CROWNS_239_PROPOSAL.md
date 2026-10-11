# Ironroot crowns — #239 P0 proposal and implementation review

**Review status:** proposed material and die iconography, **not owner-approved canon**. Isolated draft-PR implementation; no merge, deployment, mint-system rewrite or mounted combat. The five-region regime and single player-facing `crowns` currency are already established. Existing numeric costs, loot/rewards, internal `gold` save fields, level gates and region travel remain intact.

## Historical basis: a royal crown is not a circulating crown

A sovereign's *physical regalia* may be solid gold and jewel-set (St Edward's Crown, made 1661); other regalia include gilded silver (silver-gilt). Precious crown metal and gemstone settings signify rank; they do **not** establish that every coin named *crown* is made of gold. [Royal Collection Trust, Crown Jewels](https://www.rct.uk/collection/stories/the-crown-jewels-coronation-regalia); [Royal Collection Trust, broader regalia and silver-gilt plate](https://www.rct.uk/collection/stories/the-crown-jewels).

The English *coin* called a crown began as gold in 1526, subsequently using tougher crown gold; silver crowns appeared in 1551 and shared the name, and the gold issue later ended. Historical 1726 and 1818 circulating silver crowns were **.925 sterling silver**, while earlier gold coinage used 22-carat crown gold. These are real *comparisons*, **not** copied in-world weights, shilling values or monetary mechanics. [Royal Mint Museum, crown history](https://www.royalmintmuseum.org.uk/journal/curators-corner/crown/); [Royal Mint, 1726 silver crown](https://production.royalmintmuseum.org.uk/shop/monarch/king-george-i/George-I-Silver-Crown-1726/); [Royal Mint Museum, Tudor sovereign gold fineness](https://www.royalmintmuseum.org.uk/journal/curators-corner/tudor-sovereign/).

| Historically grounded choice | Appearance and supply | Decision |
| --- | --- | --- |
| 22-carat **crown gold** (~91.7% gold, with hardening alloy) | Warm yellow, prestigious, practical for rare high-value coins; demanding gold supply makes daily wages less credible | Do not use for ordinary five-region circulation |
| **Sterling silver** (92.5% silver / 7.5% copper) | Pale cool silver with grey-worn crevices; plentiful silver-bearing ore plus modest copper; assay and high-volume hand striking are credible | **Default proposal for author review** |
| **Electrum** (gold/silver alloy, often pale gold) | Distinct honey-white ancient look; historically struck in Lydia but requires substantial gold and controlled proportions | Attractive alternative, too gold-intensive for this mine/payroll-first setting. [LBMA Lydian electrum](https://www.lbma.org.uk/wonders-of-gold/items/lydian-electrum-coin) |

## Default: the Five-Point Silver Crown

**Composition:** 925 parts silver, 75 parts copper by weight, one homogeneous alloy — **not** silver plating, a copper-ringed bimetallic token or gold-gilt currency. The coin looks cold-white/silver-grey with charcoal wear in the stamped cuts. Its small, hand-struck, subtly irregular form deliberately differs from the large historical five-shilling silver crown; no actual denomination or face-value exchange is introduced.

**Obverse:** a blunt, **five-point Crown** rises from one band, for the five regions under one peace. **Reverse:** a dark mountain split by a guarded roadway, referring to Ironroot's mines and the network that carries its taxes and wages. In-world, the pattern promises safety of trade while also marking the Dark Lord's ownership. Simple crown teeth, pale circular blanks and hard metal seals are readable even at the game's small prop scale. Avoid generic gleaming gold coin piles. Existing banners/uniforms do not change color across the realm.

**Production:** dark **argentiferous galena** and other silver-bearing stone are extracted at Ironroot's ore site and workings; workers separate metal-rich fragments from ordinary quarry stone. At Stonecross, ore is smelted, silver is recovered from lead-rich metal in a hot oxidizing **cupellation** hearth, the silver is assayed and blended with a smaller amount of copper, then hammered/pressed between engraved dies. The displayed small refining/striking stations represent multiple workers and shifts, not a single magical coin machine. Finished weighed lots are recorded by the payroll/ledger, sealed in recognizable Crown-stamped chests and dispatched along **existing** guarded roads. Cupellation is a historical silver-refining method; no lead, copper, silver or slag becomes a playable resource. [Historical Metallurgy, cupellation furnace experiment](https://www.hmsjournal.org/index.php/home/article/view/153); [Royal Mint Museum, traditional hand striking](https://www.royalmintmuseum.org.uk/learning/learning-zone/the-tower-of-london/hand-striking/); [Royal Mint, historical assaying](https://www.royalmint.com/corporate/facts/pyx.aspx).

**Political and geographic continuity:** the Ridge Tyrant remains the competent Master of Coin and keeper of wages, treasury and convoys, **not** the Colossus. Quarry crews still cut stone for construction; Ogres have homes, Wolves retain their ranges, and Ironroot is still mountainous/pine-covered. The separate #242 Colossus origin rewrite is **not** decided here; the superseded ancient-isolated story in historical Ironroot notes must not be reapproved by accident.

## Exact P0 game-visible chain and audit inventory

| Stage | Already present | Draft enhancement |
| --- | --- | --- |
| **Ore/extraction** | `Stonecross ore vein` landmark (1100,650), named mine and supported shafts | `silver-ore-face` decorative dark faceted seam near the named vein and Mine approach; readable silver flecks |
| **Sorting vs separate quarry stone** | Quarry Outpost sorting bays (1510,1020), Mine haulage and equipment repair, retained rock/quarry uses | Sorting-bay contents visibly dark silver-bearing chips, while existing stone and timber work remain |
| **Refining/assay** | Mining/working culture and Stonecross metallurgy implied by older lore | **New small `silver-refining-hearth`** beside Stonecross's existing mint bench; glowing ore furnace, ash cupel, silver buttons and slag |
| **Striking** | Existing `mint-workbench` (1070,1360) | Die teeth and cool silver blanks/finished coins; payday samples at `highland-pay-station` also silver |
| **Guarded shipment** | Stonecross and outer stand caravan/loading bays, Ridge-paid archer escorts and established routes | Loading chests now carry five-point silver seals; existing Chronicle #18 and ore-site dialogue state their Crown destinations, without new soldiers or roads |

### Player observation checklist

- [ ] At the **Stonecross ore vein**, a non-blocking dark metallic rock face is visible and examining the existing landmark identifies silver-bearing ore.
- [ ] At **Quarry Outpost**, metallic ore sorting reads differently from common quarry stone; neither the quarry livelihood nor homes disappear.
- [ ] In **Stonecross**, the refining hearth and existing die bench show silver metal **before** it becomes stamped crowns; nearby payroll is in the same silver.
- [ ] **Caravan loading** shows sealed Crown consignments and existing lore/Chronicle text describes guarded shipment across the regime, not a new transport mechanic.
- [ ] Existing Wolf/Ogre habitats, walkable roads, quest/service entrances, Treasury, mine route, Colossus, resource totals, cost/reward quantities, and historical saves remain equivalent.

### Engineering boundary and review evidence

Proposed changed surfaces: `rules.js` (small decorative placement + ore-site lore), `world.js` (Ironroot-only scenery version 2→3 for legacy saves), `visuals.js` (two procedural work scenes + metal details in existing scenes), `narration.js` (one existing quest's Chronicle copy), `tests/ironroot-highlands.test.cjs`, and the sprite classification/audit notes. No hero/enemy stats, AI, combat, resource `resource` fields, economic balances, quests, sprite manifest, saved-game schema, roads, destination IDs or action triggers are touched. Existing production sprites that are still pending must be re-authored against the new approved metal if/when activated; runtime remains procedural today.

**Validation requested for integration:** `node tests/ironroot-highlands.test.cjs`, `npm run format:check`, `npm run check`, `npm test`, Chromium/WebKit browser matrix including phone, PWA/offline and old-save/route snapshots. Inspect on-screen views from the ore landmark, Quarry sorting, Stonecross refinery+bench, and caravan stand. Mark checks verified only from actual runs. This document is an author proposal, not proof that CI or a visual check passed.
