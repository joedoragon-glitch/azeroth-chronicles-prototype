# Approved whole-game procedural art pass

> **Final owner approval and publication authorization — 19 October 2026, 22:06 EDT:** Joel approved the entire completed design set and explicitly requested merging and publishing it so he can play. Candidate `0.9.1+snapshot.dev.88` uses the final shared overhead translucent TRUE crown; the Dark Lord retains his normal crown below it. Desktop and phone each started and rendered a frame without uncaught exceptions; [startup receipt](evidence/APPROVED_ART_MERGE_STARTUP_20261019.json). No test suites or full-game regression were run for merge preparation. A one-time packaging/deployment job publishes the committed game; ordinary release wiring is restored afterward. After publication, perform one bounded check of day/night, facing, animation, effects and audio. The earlier local-only and pending-acceptance statements below are historical and superseded by this explicit instruction.


Joel explicitly approved all 513 entries of the illustrated assessment on 19 October 2026: all targeted refinements, substantial rebuilds and keep/protect decisions. This later instruction supersedes the older broad visual-work pause for this bounded task. The review camera is 150%. He requested the same illustrated catalog with before/after images for his later asset-by-asset review. There is no new raster generation, gameplay redesign, merge or deployment authorization in this request. Conversation URL unavailable; this dated record preserves the instruction, not independently authenticated creative acceptance.

Base: current main `1e154954d55b3eb7212cd37aad0e5ad8e1971c98`, including merged Frontier #322. Original before captures use `0a1030b0771670752ae3b6a454daf423787881b7`; the merged Frontier changes are retained. Artwork source commit: `8acd14de52359febdb40a1d588d2c4c62b4fabf7`.

Branch: `polish/approved-whole-game-art`. Candidate: `0.9.1+snapshot.dev.81`, unreleased. Owning assessment: [Issue #321](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/321).

## Completed scope

All 465 approved refinement/rebuild targets are implemented; all 47 protected primary appearances remain identical; the representative effects context is retained. This is an exhaustive pass across the 513 indexed assessment entries, including shared owners and aliases, not 513 distinct raster files.

- Connected character anatomy, fitted attire, supported equipment and species-specific bodies for monsters, captains, bosses/TRUE forms, all Crown lineages, cavalry, royal player classes, specialists, captives, appointments and pets.
- Explicit constructions for 188 props, 15 regional structures, 50 regional service/state drawings, 26 landmarks and ten entrances, plus work overlays, resources, transport and shared environment details.
- Captive and working compositions use the same named character body. Actual `masterId` appointments retain peaceful presentation; actual `crownAncestry` units retain their own species and guard/marksman equipment. No parallel actor, renderer or state system was added.
- All 33 registered sprite images, both retained idle-frame pairs, seven textures, original sources, placement and timing retain exact bytes/contracts. Only comparison/dependency metadata was reconciled to current procedural drawings, retaining former revisions in registry history. Receipts: `retained-art.json` and `retained-materials.json` under the evidence directory.

## Evidence and focused validation

[Full assessment and states](../tools/visual-review/approved-art-pass/asset-assessment.json), [handoff index](../tools/visual-review/approved-art-pass/handoff-index.json), [implementation receipt](../tools/visual-review/approved-art-pass/implementation-receipt.json), and [before preservation](../tools/visual-review/approved-art-pass/before-preservation.json) retain all individual needs, approved plans, 621 before/after references per side and hashes. Every one of the 605 original before files equals the original delivered package. All primary comparison sheets and 108 additional state pairs were visually inspected. Each entry has a resumable record under `tools/sprites/design-handoffs/approved-art-*.json`; 168 matching older candidate records point to these later records without deleting their historical evidence.

Passed `npm run build`, `npm run format:check`, `npm run check`, and `node tests/sprite-scope.test.cjs`. The dedicated artwork scope check passed 606 entity fixtures: read-only inputs, balanced Canvas save/restore, unchanged height/feature-scale geometry, 465 changed targets and 47 identical protected primaries. Active raster/material runtime contracts equal the base except comparison revisions. Current source SHA256: `40f9cce3fb60b58468c5fbcefb55f977035d567e78a13ea7af261b8112dcb457`.

Nine selected scenes were captured through the production browser renderer at 150%, before/after in desktop 1280px and phone-browser 375px layouts: 36 captures, no page errors or campaign-snapshot mutation. They include Crown night and the royal classes. Retained WebP previews and the capture receipt identify those bounded fixtures. These checks do not certify a complete campaign, every crowd/lighting combination, physical phones, animation in motion or every VFX event. No broad gameplay regression/CI marathon was run.

The portable illustrated catalog preserves the original navigation and adds paired images, additional-state comparisons, scene gallery and result-review controls. Search, all 513 paired entries, notes persistence/export, zoom, individual navigation and phone overflow checks pass. All plans are approved; finished result acceptance remains for Joel’s later review.

## Publication and next action

Implementation and evidence are committed locally. Automatic approval review rejected the external GitHub branch push because it considered publication outside the approved scope and repository trust/privacy unestablished. The push was not retried through another route. No PR, merge or deployment was performed for this pass.

Next: obtain permission for the rejected branch publication, then push the coherent review branch. When Joel returns, use his exported result notes to make bounded corrections from these retained references. Preserve the published game until the intended integration/release is explicitly requested.


## Owner review corrections — 19 October, evening

Joel reviewed the completed catalog, accepted the remaining artwork for this pass, and requested six bounded corrections. The supplied screenshots resolve the spoken names to Ashbeast, Archer, Thornfang, Lifebinder, Mirejaw and Marshal Veyra. The corrected candidate is `0.9.1+snapshot.dev.82`; the earlier dev.81 evidence above remains historical. No new merge/deployment request was made.

- Ash-beast/Cindermaw: preserve the front-facing eyes and claws; draw the segmented tail first, with its root occluded by the rear carapace and its sting arching above the creature. Covers ordinary/ranged/guard/captain bodies, Cindermaw normal/TRUE, pet and appointed forms.
- Archers: a shared stitched leather tube has an open dark mouth, bound base, visible shafts and paired feather vanes at the exposed nocks. Remove the old duplicate sticks/arrowheads. Applies to human/Ranger, Goblin, regional archers, Crown lineages and cavalry procedural paths. Protected raster pixels remain unchanged.
- Thornfang: the older canon describes woodland branch/root growth, not confirmed trophies. The earlier assessment's trophy wording was an interpretation. Joel's latest direction supersedes it: use identifiable antler trophies mounted in cut sockets and lashings on a browband, plus a suspended fang, rather than branches emerging from his back. Preserve the woodland foliage and wolf body; apply miniature/appointed variants.
- Lifebinder: replace the royal crown with a dark fabric tricorn (three-cornered hat), including the miniature. Crown-shaped TRUE overlays on non-Dark-Lord bosses are removed; retained radiance/glints still distinguish TRUE form. Veyra's crown-shaped helmet ornament becomes a fitted military crest. The Dark Lord and crowned player retain their royal crowns.
- Mirejaw: restore a threatening boss silhouette with taller staggered sharp dorsal plates, angular brow, slit eye, open dark jaw and larger interlocking teeth. Ordinary Mirelings and the deliberately friendly pet keep their existing body design; the appointed boss uses the corrected body.
- Veyra: replace the shovel-like pole head with a narrow, pointed, ridged spearhead, bound socket and a hand meeting the actual shaft. Apply normal/TRUE, miniature and appointed paths where present.

All original before images and the dev.81 reviewed results remain recoverable in git history. Updated per-design records distinguish Joel's acceptance of unchanged results from his authorization to apply these specific corrections; unseen corrected drawings are not labeled independently accepted. Faithful implementation is authorized without an additional design-approval round. The integration candidate remains local; the previously rejected external branch publication has not been retried. The next authorized step is to retain this complete, reviewable candidate for later integration.


## Natural materials and supported objects — subsequent owner review

Joel supplied eight more screenshots and requested corrections across the shown assets and related drawings. This supersedes the earlier acceptance only for these additional affected states. Candidate `0.9.1+snapshot.dev.83` retains all prior character corrections; no new release is authorized.

- Natural trees, dead wood and scrub no longer use `timber`, the construction helper whose dark endpoint marks read as screws. Growing stems taper; the main trunk and forks share one continuous silhouette, grain follows growth, and broken tips splinter. Conifers keep a central leader under needle boughs rather than broadleaf forks. Birch, willow, fruit, sapling, mangrove and their regional/nature/landmark children inherit the appropriate shared change.
- Fallen/burned logs and driftwood have irregular bark, integrated branch stubs and solid cut or weathered ends. Driftwood is bleached and frayed; the woodpile is a varied stack of split billets with solid pale end grain and contact shadows, not open pipes. Natural root furniture, shrubs, heather and cookfire fuel also lose inappropriate hardware.
- Mangrove prop roots descend from multiple trunk/branch heights at uneven angles into the substrate; they do not form one symmetric arch. Visual reference: NOAA, [Mangrove forest](https://oceanservice.noaa.gov/facts/mangroves.html). This is a compact artistic interpretation of the root system, not a botanical scale model.
- Objects are positioned by their supporting base rather than their upper rim. Corrected the stolen-goods bowl on its crate, stacked supplies, table bowls/market produce, supper/study/caretaker items, supplier countertops/shelves, camp bags, the glass-kiln side stand and preservation bottles. Shared tabletops have adequate visible depth, with bases and contact shadows inside the top plane; intentional floor props and suspended crane/kitchen vessels retain their distinct supports.
- The geothermal heat intake is a mechanical assembly with a well casing, inlet shutoff handwheel, pressure gauge, connected hot/return pipes, finned exchanger, supports and relief vent on a stone plinth. Reference: DOE [Geothermal direct use](https://www.energy.gov/hgeo/geothermal/geothermal-direct-use), which describes heated underground fluid, heat exchangers and return flow. The drawing is an artistic district-heating intake suited to the game's materials, not an engineering construction plan.
- Laundry retains its sagging line, pegs and folds; one cloth is distinctly rose/purple, with matching fold shading.

The immutable original 605 before images remain the assessment baseline. The immediately preceding reviewed art is retained in git at `12fa3b95`; latest-vs-previous comparison sheets are retained alongside the full updated catalog. Existing registered sprite pixels remain protected; only comparison/dependency receipts follow the changed procedural fallbacks. Approval of the six previous correction groups is not invented; their completed implementation remains intact. This local checkpoint is ready to carry into the eventual integration request.


## Character, camp and cavalry review — 19 October, late evening

Joel requested further corrections after reviewing the dev.83 catalog and eleven screenshots. Candidate `0.9.1+snapshot.dev.84` implements the requested drawing changes. All previous wood/environment/anatomy corrections remain; no release authority follows.

- Paladin and infantry helmets use rigid steel planes, visor slits, brow rims and cheek protection. Infantry retain the requested pointed Pickelhaube-style spike. Related Crown humans use metal helmets; archer headgear remains cloth.
- Hero Mage is a silver-haired woman with a bright, gentle face, blue gown and moon hat. Crowned Mage preserves the original blue robes, purple mouth scarf and masked/ninja silhouette, with the crown around the cone of her pointed hat. Ranger retains blond hair, pointed goatee, stern brows and actual leather quiver; royal Ranger exposes his golden hair beneath the crown. Friendly Goblin Archer restores cap and feather, a smaller nose, raised brow and sly smile.
- NPC identities now carry deliberate hair and expressions: Mira curls, Sela side braid, Neri bun, Dara bob, Lyss high ponytail, Vera pinned work bun; Borin/Orin/Eren/Tovan have distinct hair, beards/moustache and expressions. Veyra has cropped swept hair under her open metal helmet, including the pet. Captive/rescued/appointed specialists share the same body painter. The optional unassigned smith remains a humorous usable fallback with curls, curled moustache, monocle and real hammer.
- Orin has a narrow long ridged spear, Lyss and Eren carved crystal staffs, Dara/Vera/fallback smiths socketed heavy hammers, and Drowned Keeper pet a visible staff-anchor. Cinder Warlord has a spiky iron mace, officious ledger, cocked brow and crooked grin; Orc officer/marksman/common faces differ. This does not change attacks or combat behavior.
- Full barracks desks sit in the ground-level central aisle, with a smaller stool and no tall desk canopy intersecting the tents. One shared layout covers all five regional palettes.
- Direwolf riders and mounts both face right. Profile helmet/torso, hip in saddle, forward bent knee, dropped shin and near boot in a stirrup replace the front-facing spread-legged rider. The far leg is occluded. Lancer and bow loadouts share the pose, forward reins/arms and matched saddle. Thornfang's woodland trophy kit is no longer inherited by military mounts. Patrol, guard, room-guard and ringleader drawing comparisons are retained for both weapons.
- Dreadmaw already uses the corrected front-facing scorpion body with rear tail arching above the carapace; verified rather than changing its facing again. Dungeon-master engine residents already retain `masterId`; the visual dispatcher draws the actual selected specialist/field boss/captain. The refreshed catalog retains all 20 concrete appointment identities, rather than using the generic dispatcher fixture as evidence of runtime appearance.

The immutable 605 original before files and prior dev.83 results (`005ace71`) remain retained. Updated comparisons show both sides and keep acceptance of unchanged results distinct from authorization for these unseen revisions. Focused build/format/registry/scope checks and selected renderer inspections apply; no full-game regression or release is claimed. External branch publication remains blocked by the previously recorded automatic review and was not retried.

Joel then found the Mirejaw spikes excessive. The final dev.84 drawing replaces the six extremely tall plates (maximum height 31) with five staggered low plates (maximum 14), retaining the crocodile body, angular eye and strong jaw. Normal, TRUE and appointed bodies share the balanced ridge.

The latest owner request explicitly overrides the original keep decision for `specialist:darklord`. The other 46 protected primary appearances remain byte-identical, including all 33 raster identities and seven materials. The scope receipt retains the original 465 target tally and records this single additional owner-requested overhaul separately; it does not silently exempt any other keep entry.

Final drawing source: `fb1f2de20c3a98271fa4aa4da1a4c362393ad746`; SHA256 `1e3a712ccfe53499f5f9cc634423d64b0ce30a10f75996cd735858012878abab`. The latest round changes 96 catalog entries. Final bounded checks passed: build, format, registry/material/audio-scope check, focused sprite-scope check, 606 read-only balanced draw fixtures with unchanged height/feature scale, 46 unchanged protected primaries plus the one explicit smith override, 36 selected native before/after captures, original 605-file preservation, and portable catalog interaction/phone-overflow checks. Eight additional paired mounted fixtures cover lance/bow × patrol/guard/room-guard/ringleader. No broad gameplay regression was run.


## Dark Lord open-face restoration — subsequent owner review

Joel preferred the earlier Dark Lord whose face was visible. The dev.84 paladin visor had carried into his shared crowned-paladin base unintentionally. Candidate dev.85 gives that base an explicit open-face choice for the Dark Lord, restoring the earlier open brow/cheek silhouette in normal and TRUE forms. Paladin/crowned-paladin helmets and all other requested corrections remain unchanged. This is a two-state visual correction, not new raster art or release authority.


## Translucent TRUE regalia — subsequent owner review

Joel found the Dark Lord's oversized solid TRUE crown and lateral spikes excessive. Candidate dev.86 replaces that added geometry with a thin translucent lavender/gold circlet, three small suspended crystal lights and restrained translucent motes. The physical crown and restored open face remain. Other appearances using the shared TRUE head ornament receive the same airy circlet in place of lateral gold spikes; nonroyal bosses retain their species-specific radiance without receiving royal crowns. The renderer's existing TRUE aura and all combat behavior remain unchanged.

The three possible Dark Lord classes were recorded as a prospective idea in the next-update reconciliation ledger; the owner explicitly entertained keeping current gameplay for this version. No class selection, skills, save fields or balancing is implemented in this visual correction.


## Imposing translucent TRUE crown — owner revision

Joel rejected the dev.86 halo as excessively subtle and asked for the original crown reworked with stronger aesthetics and transparency. Candidate dev.87 replaces the halo with one fitted three-point crown: taller central point, shorter rounded outer points, curved band, translucent gold/amethyst facets, readable rim and central royal gem. The stacked physical/spectral crowns are replaced by this single integrated crown in TRUE form; the normal crown/open face stay unchanged. Detached lateral spikes and orbiting crystal lights are removed. Shared nonroyal TRUE head halos are removed; species-specific auras and restrained motes remain. No gameplay, class variants or release actions are included.


## Shared TRUE boss indicator — final owner clarification

Joel clarified that the translucent crown is a shared TRUE-form status indicator for every boss, not a replacement for the Dark Lord's personal crown. Dev.88 preserves the Dark Lord's normal crown in both forms and places the existing translucent design above it. All eleven TRUE bosses receive that same indicator, positioned above their own anatomy/headgear; ordinary forms retain their designs. No redesign of the accepted translucent crown is added. Detached old gold spikes/horns are not restored.

TRUE boss label/culling headroom increases from 102 to 140 presentation units so the floating indicator does not intersect health bars or names. Normal label heights, feature scale, world anchors, collisions, combat and saves remain unchanged. The artwork scope check records this explicit presentation exception.
