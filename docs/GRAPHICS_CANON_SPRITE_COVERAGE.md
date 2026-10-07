# Phase 2A — Canon sprite coverage audit

## Purpose

This is the exhaustive coverage proof for the sprite-prompt catalog. It is generated from the current production renderer's static draw families, then classified according to the canon-first rule.

A renderer case can end in one of three outcomes:

- **GENERATE** — a prompt exists in `GRAPHICS_CANON_SPRITE_PROMPTS.md`.
- **ALIAS** — a gameplay identity reuses an already generated canonical static body.
- **PROCEDURAL** — the current procedural renderer remains the intended final form for that family because its value comes from runtime geometry, repeated regional material variation, ground integration, animation/effects, or seeded natural variation.

The existence of a mechanic or a name is not enough to justify a new image.

## Catalog totals

The audited numbered catalog contains **227 entries**:

- **217 GENERATE** entries;
- **0 ALIAS** entries;
- **10 numbered KEEP PROCEDURAL** entries.

Many broad procedural systems are classified here rather than receiving pointless numbered no-image entries.

## Entity coverage

- Heroes: Paladin 001, Mage 002, Ranger 003.
- Companions: Soldier 004, allied-goblin Archer/Ranger-support 005.
- Specialists: 006–015.
- Ordinary/night enemies and visible weapon/ranged-class variants: 016–034. Mireling Spitter 030, Ogre Stone Thrower 032, Orc Axe Thrower 033 and Ash-beast Cinder Spitter 034 now have distinct procedural bodies/equipment.
- Bosses: 035–045.
- Named captains with authored static additions: 046–050. Dreadmaw 049 uses Ash-beast anatomy with a retained Dark-Lord-idol captain treatment while Cindermaw remains his gameplay mentor.
- Ringleader, Frenzy and TRUE presentation remain procedural. Non-military species keep the universal Ringleader overlay; military species use same-size officer hierarchy cues tied to their uniform instead of the generic crown treatment.
- Guard identifiers remain procedural. Military species may use restrained uniform/pauldron role cues, but role readability must not create a new species silhouette or inflate body scale.

## Interaction/state coverage

- Main dungeon entrances: 051–055.
- Treasury entrances: 056–059.
- Dark fortress gate: 060.
- Barracks: construction remains procedural; Basic regional camps are 071–075; Full Barracks have distinct procedural camp layouts within the exact same reserved footprint and must not alias Basic art when sprites are eventually activated.
- Regional town service structures: 111–130.
- Shared occupied side-interior gate: 131.
- Citadel preparation fountain: 161.
- Field-boss compound marker: 162.
- Dark Lord Tribute cache: 163.
- Treasury quest bundle: 164.
- Open cage: 170; closed specialist cages: 171–180.
- Cage contents use the same specialist canon as 006–015; no alternate prisoner designs.

## `decoration(kind)` coverage

| Renderer case | Decision |
| --- | --- |
| `torch` | GENERATE 181 |
| `coffin` | GENERATE 182 |
| `bones` | GENERATE 183 |
| `banner` | GENERATE 184/185 by region |
| `shelf` | GENERATE 186 |
| `water` | PROCEDURAL — ground/water surface |
| `rune` | PROCEDURAL — ground-state marking |
| `crate` | GENERATE 187 |
| `rail` | PROCEDURAL — repeated linear geometry |
| `crystal` | GENERATE 188 |
| `chain` | GENERATE 189 base; Abyss local wear/detail remains procedural |
| `ember` | GENERATE 190 |
| `armor` | GENERATE 191 |
| `thorn-bed` | GENERATE 138 |
| `fang-trophy` | GENERATE 139 |
| `root-table` | GENERATE 140 |
| `warm-brazier` | GENERATE 192 |
| `treasure-hoard` | GENERATE 141 |
| `boss-chest` | GENERATE 142 |
| `mire-pool` | GENERATE 143 |
| `fish-rack` | GENERATE 104 |
| `reed-nest` | GENERATE 144 |
| `shell-hoard` | GENERATE 145 |
| `drift-seat` | GENERATE 146 |
| `ridge-hearth` | GENERATE 147 |
| `weapon-rack` | PROCEDURAL — region-sensitive repeated rack |
| `stone-seat` | GENERATE 148 |
| `trophy-rack` | GENERATE 149 |
| `dark-brazier` | GENERATE 193 |
| `dark-throne` | GENERATE 100 |
| `war-table` | GENERATE 099 |
| `crown-banner` | GENERATE 101 |
| `crown-levy-yard` | PROCEDURAL — composed Crown labor/transport scene |
| `crown-command-post` | PROCEDURAL — composed Crown military command scene |
| `ashbeast-roost-scene` | PROCEDURAL — composed Ash-beast habitat scene |
| `crown-logistics-bay` | PROCEDURAL — composed Crown fortress logistics scene |
| `crown-fortress-checkpoint` | PROCEDURAL — composed final-approach control scene |
| `citadel-muster` | PROCEDURAL — composed Citadel entrance/muster station |
| `citadel-command` | PROCEDURAL — composed Citadel command station |
| `citadel-ritual-array` | PROCEDURAL — composed Citadel ritual-control station |
| `citadel-barracks-bay` | PROCEDURAL — composed Citadel barracks/training station |
| `citadel-forge-bay` | PROCEDURAL — composed Citadel forge/supply station |
| `citadel-boss-approach` | PROCEDURAL — composed Citadel final-approach station |
| `animal-pen` | GENERATE 194 |
| `drying-rack` | GENERATE 195/196 by region |
| `tax-post` | GENERATE 219–223 by region |
| `lean-to` | GENERATE 224–227 by region |
| `cookfire` | GENERATE 197 |
| `sleep-roll` | GENERATE 198 |
| `game-table` | PROCEDURAL — region-sensitive repeated furniture |
| `stolen-goods` | GENERATE 199 |
| `training-dummy` | PROCEDURAL — region-sensitive repeated prop |
| `bone-pile` | GENERATE 200 |
| `grave-marker` | GENERATE 201 |
| `pup-nest` | GENERATE 158 |
| `fishing-net` | GENERATE 202 |
| `mud-nest` | GENERATE 159 |
| `wallow` | GENERATE 160 |
| `ore-cart` | GENERATE 156 |
| `ore-crane` | GENERATE 105 |
| `tool-rack` | GENERATE 203 |
| `stone-marker` | GENERATE 157 |
| `field-kitchen` | GENERATE 213/214 by region; Frontier keeps a deterministic procedural service overlay |
| `supply-stack` | GENERATE 204 base; Frontier stack/load variation remains procedural |
| `command-tent` | PROCEDURAL — region-sensitive repeated structure with deterministic Frontier variants |
| `bunk` | GENERATE 215/216 by region |
| `forge` | GENERATE 098 |
| `roost` | GENERATE 150 base; Abyss nesting-use variation remains procedural |
| `hatchery` | GENERATE 151 base; Abyss hatchery variation remains procedural |
| `scribe-desk` | GENERATE 152 |
| `scroll-stack` | GENERATE 205 |
| `ossuary` | GENERATE 153 |
| `ritual-table` | GENERATE 217/218 by region |
| `grave-lamp` | GENERATE 154 |
| `caretaker-table` | GENERATE 155 |
| `grass` | PROCEDURAL — seeded nature |
| `wet-grass` | PROCEDURAL — seeded nature |
| `bush` | PROCEDURAL — seeded nature |
| `marsh-bush` | PROCEDURAL — seeded nature |
| `wildflowers` | PROCEDURAL — seeded nature |
| `sapling` | PROCEDURAL — seeded nature |
| `stump` | PROCEDURAL — seeded nature |
| `fallen-log` | PROCEDURAL — seeded nature |
| `reeds` | PROCEDURAL — seeded nature |
| `cattails` | PROCEDURAL — seeded nature |
| `driftwood` | PROCEDURAL — seeded nature |
| `mangrove` | PROCEDURAL — harbor/nature geometry |
| `dock-post` | PROCEDURAL — repeated harbor geometry |
| `pine-sapling` | PROCEDURAL — seeded nature |
| `alpine-scrub` | PROCEDURAL — seeded nature |
| `heather` | PROCEDURAL — seeded nature |
| `rock-cluster` | PROCEDURAL — seeded nature |
| `dead-tree` | PROCEDURAL — seeded nature |
| `charred-stump` | PROCEDURAL — seeded nature |
| `ash-patch` | PROCEDURAL — ground patch |
| `dry-scrub` | PROCEDURAL — seeded nature |
| `burned-log` | PROCEDURAL — seeded nature |
| `ember-pit` | PROCEDURAL — ground/fire dressing |
| `black-rock` | PROCEDURAL — seeded nature |
| `crystal-cluster` | PROCEDURAL — seeded nature |
| `dead-shrub` | PROCEDURAL — seeded nature |
| `fumarole` | PROCEDURAL — atmospheric ground effect |
| `obsidian` | PROCEDURAL — seeded nature |
| `market` | PROCEDURAL — region-sensitive repeated settlement prop |
| `woodpile` | GENERATE 206 |
| `laundry` | GENERATE 207 |
| `well` | GENERATE 095 |
| `barrel` | GENERATE 208 |
| `cart` | GENERATE 209 base; Frontier load/damage variation remains procedural |
| `ration` | GENERATE 210 |
| `garden` | GENERATE 211 |
| `watchpost` | GENERATE 096 base; Frontier occupation marking remains procedural |
| `barricade` | GENERATE 212 base; Frontier occupation variation remains procedural |
| `road-ruts` | PROCEDURAL — flat road wear trace |
| `road-patch` | PROCEDURAL — flat repaired-road trace |
| `stacked-lumber` | PROCEDURAL — Frontier repair-yard material |
| `repair-brace` | PROCEDURAL — Frontier rebuilding structure |
| `broken-cart` | PROCEDURAL — Frontier damage/recovery storytelling |
| `wagon-wheel` | PROCEDURAL — Frontier repair-yard clutter |
| `charred-foundation` | PROCEDURAL — Frontier ruin/recovery ground structure |
| `replacement-stakes` | PROCEDURAL — Frontier rebuilding boundary detail |
| `patched-fence` | PROCEDURAL — Frontier civilian repair detail |
| `inspection-marker` | PROCEDURAL — standardized occupation administration marker |
| `checkpoint-standard` | PROCEDURAL — standardized occupation military marker |
| `chain-anchor` | PROCEDURAL — Abyss containment detail used outside and inside the Bastion |
| `handler-station` | PROCEDURAL — Bastion handler/inspection furniture |
| `feed-crate` | PROCEDURAL — dragon feeding/logistics prop |
| `containment-post` | PROCEDURAL — repeated containment hardware |
| `scorched-floor` | PROCEDURAL — flat dragon heat/damage trace |
| `egg-cradle` | PROCEDURAL — hatchery nesting structure |
| `feeding-trough` | PROCEDURAL — dragon feeding structure |
| `carcass-rack` | PROCEDURAL — dragon provisioning structure |
| `claw-scrape` | PROCEDURAL — flat dragon-use trace |
| `dragon-perch` | PROCEDURAL — repeated aerie structure |

## `landmark()` coverage

| Renderer case | Decision |
| --- | --- |
| `orchard` | GENERATE 083 |
| `den-ruins` | SUPERSEDED in current world by side-interior gate 131 |
| `mill-pond` | PROCEDURAL — water/shore geometry |
| `night-site` | PROCEDURAL — water/reeds/lantern site |
| `cache` | GENERATE 165 |
| `wagon` | GENERATE 166 |
| `convoy` | GENERATE 166 |
| `watch` | GENERATE 084 |
| `dock` | PROCEDURAL — water/dock geometry |
| `lookout` | GENERATE 085 |
| `ore` | GENERATE 168 |
| `tower` | GENERATE 089 |
| `shrine` | GENERATE 086 |
| `overlook` | GENERATE 167 |
| `checkpoint` | PROCEDURAL/internal quest trigger; visible compound is separate |
| `foundry` | GENERATE 087 |
| `shelf` | GENERATE 169 |
| `siege` | GENERATE 088 |
| `fortress-gate` | GENERATE 060 |
| `goblin-camp` | GENERATE 076 |
| `mire-nests` | GENERATE 077 |
| `wolf-den` | GENERATE 078 |
| `ogre-hearth` | GENERATE 079 |
| `orc-bivouac` | GENERATE 080 |
| `ash-roost` | GENERATE 081 |
| `crown-barracks` | GENERATE 082 |

## Regional settlement-structure coverage

| Renderer case | Decision |
| --- | --- |
| `vale-cottage` | GENERATE 061 |
| `vale-workshop` | GENERATE 062 |
| `vale-fence` | PROCEDURAL — repeated boundary geometry |
| `march-stilt-house` | GENERATE 063 |
| `march-boathouse` | GENERATE 064 |
| `march-boardwalk` | PROCEDURAL — repeated path geometry |
| `highland-stone-house` | GENERATE 065 |
| `highland-smithy` | GENERATE 066 |
| `highland-wall` | PROCEDURAL — repeated boundary geometry |
| `frontier-patched-house` | GENERATE 067 base; seeded repair-history overlays remain procedural canon |
| `frontier-workshop` | GENERATE 068 base; seeded repair/work overlays remain procedural canon |
| `frontier-palisade` | PROCEDURAL — repeated boundary geometry |
| `crown-ash-house` | GENERATE 069 |
| `crown-forgehouse` | GENERATE 070 |
| `crown-wall` | PROCEDURAL — repeated boundary geometry |

## Other top-level render branches

| Renderer family | Decision |
| --- | --- |
| `building('barracks')` completed | GENERATE 071–075 |
| Barracks construction stages | PROCEDURAL |
| Full Barracks | ALIAS to same region's completed Barracks until canon differs |
| `rest/supplier/recruiter/quests` | GENERATE 111–130 |
| `cage` | GENERATE 170–180 |
| `dungeon/exit` main families | GENERATE 051–055 and reuse for matching exit identity |
| occupied side-interior `dungeon` default gate | GENERATE 131 |
| Treasury `dungeon` entrance | GENERATE 056–059 |
| `transport` | GENERATE 090–093 |
| `bundle` | GENERATE 164 |
| `fountain` | GENERATE 161 |
| `mini` | GENERATE 162 |
| Dark Lord Tribute node | GENERATE 163 |
| legacy/non-tribute node bodies | PROCEDURAL / legacy compatibility |
| direct `stonewall/stockade/palisade/fence/pillar` props | PROCEDURAL — repeated collision geometry |
| actor ground shadows | PROCEDURAL |
| labels/health plates/targeting/UI | PROCEDURAL |
| attack warnings, projectiles and timed combat VFX | PROCEDURAL |
| atmosphere/night lighting | PROCEDURAL |
| terrain planes, roads, rivers, lava and crossings | PROCEDURAL |
| authored main-dungeon walkable wings, partitions and gates | PROCEDURAL — gameplay-space geometry shared by collision and renderer |

## Wild-prop strategy

The renderer deliberately seeds natural variation. Phase 2A therefore creates only the five representative experiments 106–110. The smaller nature-decoration cases remain procedural during this production cycle. Phase 2B can reject even those five representative sprite experiments if they make the world more repetitive than the canonical seeded renderer.

## Audit conclusion

Every static renderer family has an explicit destination: a generation prompt, a visual alias, or a documented procedural decision. Image generation must use only **GENERATE** entries from the prompt catalog and must produce exactly one isolated asset per request.
