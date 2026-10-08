# Phase 2A — Canon sprite coverage audit

## Purpose

This is the exhaustive coverage proof for the sprite-prompt catalog. It is generated from the current production renderer's static draw families, then classified according to the canon-first rule.

A renderer case can end in one of three outcomes:

- **GENERATE** — a prompt exists in `GRAPHICS_CANON_SPRITE_PROMPTS.md`.
- **ALIAS** — a gameplay identity reuses an already generated canonical static body.
- **PROCEDURAL** — the current procedural renderer remains the intended final form for that family because its value comes from runtime geometry, repeated regional material variation, ground integration, animation/effects, or seeded natural variation.

The existence of a mechanic or a name is not enough to justify a new image.

## Catalog totals

The audited numbered catalog contains **296 entries**:

- **280 GENERATE** entries;
- **0 ALIAS** entries;
- **16 numbered KEEP PROCEDURAL** entries.

Many broad procedural systems are classified here rather than receiving pointless numbered no-image entries.

## Entity coverage

- Heroes: Paladin 001, Mage 002, Ranger 003.
- Companions: Soldier 004, allied-goblin Archer/Ranger-support 005.
- Specialists: 006–015.
- Ordinary/night enemies and visible weapon/ranged-class variants: 016–034. Mireling Spitter 030, Ogre Stone Thrower 032, Orc Axe Thrower 033 and Ash-beast Cinder Spitter 034 now have distinct procedural bodies/equipment.
- Bosses: 035–045.
- Named captains with authored static additions: 046–050. Dreadmaw 049 uses Ash-beast anatomy with a retained Dark-Lord-idol captain treatment while Cindermaw remains his gameplay mentor.
- Ringleader, Frenzy and TRUE presentation remain procedural. Non-military species keep the universal Ringleader overlay; military species use same-size officer hierarchy cues tied to their uniform instead of the generic crown treatment.
- Guard ground identifiers remain procedural. Current guard bodies use exact entries 255–270, preserving their existing uniform/shield/role cues without increasing body scale. Crown ranged troops have separate entry 254. Base, ranged, hybrid and guard states never silently substitute for one another.

## Interaction/state coverage

- Main dungeon entrances: 051–055.
- Treasury entrances: 056–059.
- Dark fortress gate: 060.
- Barracks: construction remains procedural with materials/frame/one-panel/two-panel stages; Basic regional camps are 071–075; Full Barracks have distinct procedural camp layouts within the exact same reserved footprint and must not alias Basic art when sprites are eventually activated.
- Regional town service structures: 111–130.
- Occupied side-interior entrances: Old Orchard Cellars 131, Drowned Watchhouse 228, Old Signal Keep 229, Ruined Shrine 230, Ruined Foundry 231.
- Citadel preparation fountain: 161.
- Field-boss compound marker: 162.
- Dark Lord Tribute cache: 163.
- Treasury quest bundle: 164.
- Open cage: 170; closed specialist cages: 171, 173, 175, 177–180; obsolete Borin/Neri/Dara cage IDs 172/174/176 are procedural historical decisions.
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
| `chain` | GENERATE 189 base; Frontier/Abyss local wear variation remains procedural |
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
| `cindermaw-hoard-scene` | PROCEDURAL — composed Cindermaw hoard/obsidian scene |
| `cindermaw-ash-den` | PROCEDURAL — composed Ash-beast den scene |
| `dreadmaw-vault-post` | PROCEDURAL — composed Treasury inner-vault command scene |
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
| `bone-pile` | GENERATE 200 base; Frontier/Abyss scattered-remains variation remains procedural |
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
| `roost` | GENERATE 150 base; Frontier/Abyss nest-use variation remains procedural |
| `hatchery` | GENERATE 151 base; Abyss hatchery-use variation remains procedural |
| `scribe-desk` | GENERATE 152 |
| `scroll-stack` | GENERATE 205 |
| `ossuary` | GENERATE 153 |
| `ritual-table` | GENERATE 217/218 by region |
| `grave-lamp` | GENERATE 154 |
| `caretaker-table` | GENERATE 155 |
| `grass` | GENERATE 271 — current isolated natural body; seeded placement/variants remain source-owned |
| `wet-grass` | GENERATE 272 — current isolated natural body; seeded placement/variants remain source-owned |
| `bush` | GENERATE 273 — current isolated natural body; seeded placement/variants remain source-owned |
| `marsh-bush` | GENERATE 274 — current isolated natural body; seeded placement/variants remain source-owned |
| `wildflowers` | GENERATE 275 — current isolated natural body; seeded placement/variants remain source-owned |
| `sapling` | GENERATE 276 — current isolated natural body; seeded placement/variants remain source-owned |
| `stump` | GENERATE 277 — current isolated natural body; seeded placement/variants remain source-owned |
| `fallen-log` | GENERATE 278 — current isolated natural body; seeded placement/variants remain source-owned |
| `reeds` | GENERATE 279 — current isolated natural body; seeded placement/variants remain source-owned |
| `cattails` | GENERATE 280 — current isolated natural body; seeded placement/variants remain source-owned |
| `driftwood` | GENERATE 281 — current isolated natural body; seeded placement/variants remain source-owned |
| `mangrove` | GENERATE 282 — current isolated natural body; seeded placement/variants remain source-owned |
| `dock-post` | PROCEDURAL — repeated harbor geometry |
| `pine-sapling` | GENERATE 283 — current isolated natural body; seeded placement/variants remain source-owned |
| `alpine-scrub` | GENERATE 284 — current isolated natural body; seeded placement/variants remain source-owned |
| `heather` | GENERATE 285 — current isolated natural body; seeded placement/variants remain source-owned |
| `rock-cluster` | GENERATE 286 — current isolated natural body; seeded placement/variants remain source-owned |
| `dead-tree` | GENERATE 287 — current isolated natural body; seeded placement/variants remain source-owned |
| `charred-stump` | GENERATE 288 — current isolated natural body; seeded placement/variants remain source-owned |
| `ash-patch` | PROCEDURAL — ground patch |
| `dry-scrub` | GENERATE 289 — current isolated natural body; seeded placement/variants remain source-owned |
| `burned-log` | GENERATE 290 — current isolated natural body; seeded placement/variants remain source-owned |
| `ember-pit` | PROCEDURAL — ground/fire dressing |
| `black-rock` | GENERATE 291 — current isolated natural body; seeded placement/variants remain source-owned |
| `crystal-cluster` | GENERATE 292 — current isolated natural body; seeded placement/variants remain source-owned |
| `dead-shrub` | GENERATE 293 — current isolated natural body; seeded placement/variants remain source-owned |
| `fumarole` | PROCEDURAL — atmospheric ground effect |
| `obsidian` | GENERATE 294 — current isolated natural body; seeded placement/variants remain source-owned |
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
| `chain-anchor` | PROCEDURAL — Abyss flight-equipment/logistics detail |
| `handler-station` | PROCEDURAL — Bastion handler/work station |
| `feed-crate` | PROCEDURAL — dragon provisioning container |
| `containment-post` | PROCEDURAL — legacy hardware drawing; current Bastion uses flight harness stations |
| `scorched-floor` | PROCEDURAL — flat dragon-damage ground trace |
| `egg-cradle` | PROCEDURAL — maintained hatchery/nesting support |
| `feeding-trough` | PROCEDURAL — dragon feeding infrastructure |
| `carcass-rack` | PROCEDURAL — dragon provisioning/service structure |
| `claw-scrape` | PROCEDURAL — flat dragon-use ground trace |
| `dragon-perch` | PROCEDURAL — Bastion aerie/roost structure |

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
| `watch` | GENERATE 084 — retained marker branch; active side entrance uses 228 |
| `dock` | PROCEDURAL — water/dock geometry |
| `lookout` | GENERATE 085 — retained marker branch; active side entrance uses 229 |
| `ore` | GENERATE 168 |
| `tower` | GENERATE 089 |
| `shrine` | GENERATE 086 — retained marker branch; active side entrance uses 230 |
| `overlook` | GENERATE 167 |
| `checkpoint` | PROCEDURAL/internal quest trigger; visible compound is separate |
| `foundry` | GENERATE 087 — retained marker branch; active side entrance uses 231 |
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
| Full Barracks | GENERATE 232–236, exact Full state per region; never alias Basic |
| `rest/supplier/recruiter/quests` | GENERATE 111–130 |
| `cage` | GENERATE 170–180 |
| `dungeon/exit` main families | GENERATE 051–055 and reuse for matching exit identity |
| occupied side-interior `dungeon` theme-specific facade | GENERATE 131 / 228–231 |
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
| terrain planes, roads, rivers, lava and crossings | PROCEDURAL geometry/effects; material texture candidates T001–T028 in GRAPHICS_CANON_TERRAIN_TEXTURE_CANDIDATES.md |
| authored main-dungeon walkable footprints and partition geometry | PROCEDURAL — gameplay-space structure, never a sprite requirement |

## Wild-prop strategy

The renderer deliberately seeds natural variation. The expanded current scope includes large representatives 106–110, 24 isolated smaller nature families 271–294 and two missing field-rock materials 295–296. Their placement, density, collision, seeded variation and day/night grounding remain procedural. Prepare variant-bank selection and exact regional bindings before activating broad wild keys; a single repeated tree/rock must not erase current variation. Additional members require current-reference jobs, not invented flora.

## Audit conclusion

Every static renderer family has an explicit destination: a generation prompt, a visual alias, or a documented procedural decision. Image generation must use only **GENERATE** entries from the prompt catalog and must produce exactly one isolated asset per request.

V0.8.79 reconciles the affected canonical cues after procedural polishing. Repeated game tables remain procedural despite their clearer board-and-counter drawing. Weapon racks still use regional exact keys; KEEP PROCEDURAL entries 136/137 describe the authored Frontier/Crown versions. No existing runtime sprite key is broadened or aliased.


V0.8.80 strengthens the PROCEDURAL terrain/effects families without adding sprite keys or generation entries. Natural ground uses feathered world-space materials; roads, water banks, ravine strata, lava crust and main-dungeon footprints/partitions follow actual geometry. Normal abilities, projectile contacts and recovery cues carry their existing gameplay identity. Danger outlines remain procedural and retain contrast after atmospheric grading. See `TERRAIN_EFFECTS_POLISH_V0880.md`; the historical numbered catalog remained 231 entries.

## Ironroot Highlands procedural additions v0.8.87

These additions were procedural at v0.8.87. The 8 October reconciliation promotes the isolated static bodies listed below; contextual occupants and overlays stay procedural. Dara's equipment-repair staging is a contextual specialist drawing; it must not use the old standalone cage sprite.

| Renderer family | Classification |
| --- | --- |
| `highland-pay-station` | GENERATE 237 — current exact static body |
| `ore-sorting-bay` | GENERATE 238 — current exact static body |
| `mint-workbench` | GENERATE 239 — current exact static body |
| `caravan-loading-bay` | GENERATE 240 — current exact static body |
| `mine-supports` | PROCEDURAL — repeated mine timber and repair detail |
| `mine-old-markings` | GENERATE 241 — current exact static body |
| `mine-collapse` | PROCEDURAL — rubble and broken supports |
| `ridge-supper` | GENERATE 242 — current exact static body |
| `ridge-game-corner` | GENERATE 243 — current exact static body |
| `ridge-study` | GENERATE 244 — current exact static body |
| `ridge-bed` | GENERATE 245 — current exact static body |
| `crag-rest` | GENERATE 246 — current exact static body |
| `cage` with `equipment-repair` workstation | PROCEDURAL — Dara at a secured equipment bench, same rescue state |

## Air-superiority project v0.8.86

Four current static families present Joel’s approved Bastion role and now have exact generation entries:

| Structure | Current purpose |
| --- | --- |
| `flight-planning-table` | GENERATE 247 — current exact static body |
| `flight-harness-station` | GENERATE 248 — current exact static body |
| `royal-flight-standard` | GENERATE 249 — current exact static body |
| `royal-launch-platform` | GENERATE 250 — current exact static body |

Legacy handler/containment/perch drawing keys remain available for compatibility; current Bastion slots use the project families.

## Current contextual state coverage · 8 October 2026

| Current state/renderer branch | Decision |
| --- | --- |
| `cage` with craft workstation | PROCEDURAL 251 — Borin, separate secured/rescued composition |
| `cage` with restoration workstation | PROCEDURAL 252 — Neri, separate secured/rescued composition |
| `cage` with equipment-repair workstation | PROCEDURAL 253 — Dara, separate secured/rescued composition |
| `sceneRole:pages` | PROCEDURAL — contextual overlay on current furniture; never erase it with a generic base sprite |
| `sceneRole:alchemy` | PROCEDURAL — contextual overlay on current furniture; never erase it with a generic base sprite |
| `sceneRole:pump` | PROCEDURAL — contextual overlay on current furniture; never erase it with a generic base sprite |
| `sceneRole:submerged` | PROCEDURAL — contextual overlay on current furniture; never erase it with a generic base sprite |
| `sceneRole:construction` | PROCEDURAL — contextual overlay on current furniture; never erase it with a generic base sprite |
| `sceneRole:preservation` | PROCEDURAL — contextual overlay on current furniture; never erase it with a generic base sprite |
| `sceneRole:fish-study` | PROCEDURAL — contextual overlay on current furniture; never erase it with a generic base sprite |
| `sceneRole:coin-accounting` | PROCEDURAL — contextual overlay on current furniture; never erase it with a generic base sprite |

The numbered scope is open. Newly authored bodies/states are discovered and reconciled before their generation. All 153 decoration cases, 15 settlement cases, landmark cases and workDetails roles must remain classified; automated source-case checks reject newly unclassified branches. Generic legacy `house`/`workshop`, default service fallbacks, summoned silhouettes and compatibility nodes remain procedural unless promoted through an exact documented current binding. Normal/TRUE/ringleader/guard/captain and Basic/Full/construction are not interchangeable.

## Enemy state reconciliation

Crown ranged soldier: GENERATE 254. Sixteen current guard keys: GENERATE 255–270, each with a current source reference and exact binding. Skeleton guards retain their left shield; Crown guards retain their distinct uniform and pauldrons. Shared guard ground chevrons stay procedural and must be preserved separately when these images are integrated.

Military ringleaders (Orc, Raider Archer and Crown soldier) remain entirely procedural until their species-specific officer overlays are supported. The current optional sprite overlay draws a generic crown, so enabling base images for these forms without a follow-up correction would lose current uniform rank cues. This is an integration gate, not permission to generate generic officer art. Normal/TRUE reuse also requires normal-only source references and procedural TRUE effects.
