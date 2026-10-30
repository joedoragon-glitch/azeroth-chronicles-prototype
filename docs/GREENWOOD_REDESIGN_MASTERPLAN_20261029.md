# Greenwood Vale — regional design comparison

**30 October 2026 · dev.238 implemented on draft #654 · Extended execution-quality audit completed with corrections · Unmerged/unpublished**

Authority: [restart commission on draft #644](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/644), [50 owner decisions](GREENWOOD_VALE_OWNER_ART_DIRECTION_DECISIONS_20261028.md), [epic #545](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/545). This record contains distinct design evidence, not another release ledger. The five original documents remain historical references. The alternatives preserve the design rationale; the selected 3200 implementation is now playable on the draft. Historical study receipts below describe their recorded revisions, not the current candidate.

## Historical starting reality audit

The implementation base is **main@fcc1f42**, containing the Greenwood-only dev.235 rollback after the rejected dev.233 release. **The rollback undoes the rejected work; it does not set the replacement's dimensions.** The owner reconfirmed that 3200 was reasonable in size, is not a ceiling, and must itself be reassessed for the new design. The commission was prepared on earlier main@bda30dab. Its statement that dev.233 remains the current source is therefore historical. Publication of the rollback must be verified separately; a local checkout does not prove publication. Other-region rollback drafts #649/#651 are separate work and are not incorporated here.

The five unmodified owner iPhone screenshots were recovered and inspected. They show broad angular traffic loops, scattered services, an isolated pond/wheel, fragmented Goblin fencing and an unconvincing Treasury bridge defense. They are rejection evidence, not replacement designs. Their private ZIP is not copied into the public repository.

The current source still has **32 ordinary outdoor actors, six regional quests and 640 finite outdoor crowns**. The original river is a narrow near-straight divider around x=1200; crossing centers are y=750/1750. Two independent circular water obstacles occupy the west/east. The runtime's actual Hamlet service is near (240,1420), not the declared (900,700) anchor. Source tables alone therefore cannot establish the realized scene.

`world.js` constructs roads from navigation-grid paths, then performs multiple settlement, clearance, environment and onboarding passes. `greenwood.js`'s rejected scene searched for individual prop positions after this generation. `visuals.js` gives roads shared breadth. These are source-confirmed causes that can produce disconnected composition. Navigation and collision remain authoritative, but **the replacement visible road hierarchy must be authored first**. Art and defenses must belong to deliberate district parcels.

The Marches benchmark uses an irregular shared water boundary, relocated complete districts and meaningful coastal edges. Highlands uses a shared winding river, complete relocation groups, seven deliberately varied trees, coherent ore/mint industry and doorstep routes. Frontier separates perimeter, gate, yard, service and supply functions. Greenwood needs comparable scope with its own green summer identity.

## Two complete alternatives

![Two proposed regional plans](evidence/greenwood-redesign-20261029/masterplans.svg)

Both plans retain the same identities and encounter/reward totals. Neither derives its river or street positions by stretching the old map. The drawings are **geographic design diagrams**, not game screenshots or collision acceptance.

| Relationship | A — cultivated west / wooded east, 3200 | B — river-elbow crossroads, 3400 |
| --- | --- | --- |
| Basin | A broad S-bend river flows north to south through the eastern half; a western tributary feeds the mill before joining it | River swings from the northwest across the center into the southeast; town occupies an inside elbow |
| Newcomer | Millhaven on a northwest terrace, short visible civic street and southern farm exit | Central riverside Millhaven, with crossing traffic prominent immediately |
| Production | Quieter western Hamlet; orchards and small fields surround its southern freight lane; mill on the northern production edge | Orchard village northeast, on the opposite bank; northwest mill ships through town |
| Crossings | Northern freight bridge serves town/Treasury/wagon; narrower southern bridge completes farm–woods–estate circuit | Central cart bridge and far southeast footbridge create a longer diagonal circuit |
| Hostile households | Southwest Goblin roadside fort off the farm lane; separate occupied old cellar; east-bank Skeleton watch; Thornfang in southern woods | Goblin toll compound northwest near incoming river; Skeleton watch far east; Thornfang southwest; old cellar northeast beyond cultivated village |
| Reclamation | Southeast Crypt/estate → east-bank cache → northern Treasury receiving yard → bridge/wagon | Southeast Crypt → central-east cache → southwest Treasury; crosses the civilian street to reach transport |
| Edges | Northwest managed woodland/smallholds; northeast wagon receiving edge; southeast estate works; southwest domestic Goblin/woodland approach | Northwest hydraulic/hostile approaches; northeast fruit production; southeast estate/footbridge; southwest Treasury/den |
| Migration | Stable district translation plus source-version adapters for original, expanded and rolled-back saves | More frequent bank changes and civilian/hostile swaps require more saved-object relocation |
| Risk | Longer west-bank production circuit; avoid exposing Hamlet to the southern den and cellar groups | Early transport hostility and diagonal supply traffic cut through the newcomer center; larger quiet intervals with unchanged 32 actors |

**Historical engineering selection: A's regional relationships for construction and measurement; dimensions were provisional at this checkpoint.** Its separated production and reclamation corridors give the six existing quests distinct journeys, retain a quiet welcoming opening, and use every corner without routing industrial/hostile traffic through the town center. This is a design rationale, **not a fabricated route-performance result**. Compare the selected topology at **3200 and 3400**, and extend further if complete parcels, sightlines, hydraulic works and companion-safe routes require it. Comparing A at 3200 against B at 3400 alone would confound map design with size. Reassess usable land, actual camera composition, encounter gaps, migration fit and route cost before fixing dimensions; neither the rollback nor the rejected release sets a numerical limit. Reopen the topology selection if those checks fail.

## Selected plan: parcels, routes and land use

| District / stable identities | Target center | Required parcel and connection |
| --- | --- | --- |
| Millhaven: rest/supplier/recruiter/board | 650,600 | Central east–west working street; public fronts reserved before houses; south farm exit and east freight exit; gardens/storage behind frontages |
| Orchard Hamlet: minor | 550,1750 | Small village frontage on western farm lane; crops/pastures rather than another town ring |
| Orchard expansion: orchard | 780,2100 | Bearing/young/new plantings, drying/store yard and decorative working cellar; freight north to mill/town |
| Western mill: mill-pond | Pond 900,1260; mill 1200,1400; shore marker 1040,1530 | Upstream tributary → retained impoundment/weir → short wetted headrace meeting wheel → tailrace joining river; dry loading apron on farm road |
| Northern crossing: bridge-north | 1670,1000 | Full-width maintained freight crossing, stone abutments, bridgehead receiving lane |
| Southern crossing: bridge-south | 1740,2280 | Narrow timber rural crossing, visible continuous two-bank approaches |
| Goblin roadside camp: goblin-camp / goblin-road-fort | 350,2820 | Legible irregular palisade, one open gate, guarded forecourt, domestic court and stores; separate from civilian street |
| Occupied old cellar: den-ruins / side-vale-cellars | 1080,2510 | Existing dangerous household/entrance, distinct from the current fruit store; woodland branch off agricultural loop |
| Thornfang/Mira: field-thorn and native patrol | 920,2880 | Southern woodland home/training/feeding space, physical patrol across both banks; keep newcomer path safety and hero-first admission |
| Scornfang Treasury: supply-entrance / supply-vale | 2120,1250 | Off-road entrance and defended receiving yard overlooking freight approach; fair gate opening and covered domestic/storage spaces |
| Woodland cache: cache | 2420,1690 | Quiet east-bank staging clearing on the reclamation lane |
| Skeleton watch: skeleton-watch | 2670,2220 | Older funerary stone enclosure with working domestic court; forest/estate path, not a civilian service |
| Forest Crypt / unfinished estate: entrance | 2830,2850 | Southeast arrival court, old funerary mass behind new scaffold/material yards; associated guards/captive/interior IDs retained |
| Merchant wagon: outbound | 2880,280 | Northeast terminal, yard/turning space and road south to bridge; remains an independent destination |
| Eastern farm water | 2720,1320 | Separate rural pond with managed pasture banks, not another mill |

**Route hierarchy:** one principal cart spine town → northern bridge → northeast wagon, with a Treasury receiving spur; a narrower western farm lane town → mill → Hamlet/orchard; east-bank reclamation lane bridge → cache → estate; faint woodland circuits connect old cellar, den, southern crossing and watch. Purposeful loops may connect districts; no automatic join-every-component pass may paint extra roads. Private fronts are short door paths, not additional regional arterials.

**Sixteen-cell land-use check (NW to SE):** northern band = managed hardwood/smallhold, town/freight terrace, river crossing approaches, wagon terminus; second band = farm/mill approach, hydraulic site, river/receiving bank, pasture/pond; third band = Hamlet/orchard edge, orchard/woodland transition, southern crossing/cache approach, watch woodland; southern band = Goblin household approach, old-cellar/den woods, downstream riparian quiet contrast, Crypt/estate works. Every outer band carries a purpose; quiet forest is deliberately walkable landscape, not a ring of props.

## Implementation and refusal contract

Use one shared river/pond outline for paint and collision, explicit route widths, and one authored scene for each district's roads, roofs, gates, props and guard homes. New Piedmont nature must visibly change crown/branch silhouettes, understory and ground: meadow/pasture, cultivated soil, shaded leaf litter, damp banks and localized red-clay wear. Existing raster originals remain preserved; procedural selection must be explicit where the accepted old tree would conceal the new design.

Saves require distinct adapters for original 2700, live dev.233 source-version 1, and rollback-version 1/source-version 0. Transform before terrain pruning. Preserve owned buildings and all earned/paid/discovered/defeated states; invalidate only transient paths. If no legal building plot fits, **retain the object and report an unresolved migration**, never delete it or silently overwrite another building. Second and third reload must be stable.

Reject the candidate internally for any missing essential scene, road/roof/door conflict, dry flume, gate with no coherent perimeter, inaccessible destination, unsafe bank mismatch, lost state, arbitrary empty edge, or unchanged generic natural identity. Unit checks alone cannot close visual acceptance. Four seeds, current/historical v4 saves, real 150% day/night phone/desktop scenes, actual Canvas/Pixi paths, bounded first-session/free-roam observations and reproducible focused build evidence remain required.

**Baseline receipts:** [four-seed native census](evidence/greenwood-redesign-20261029/baseline/census.json), [27 source-pinned Canvas captures](evidence/greenwood-redesign-20261029/baseline/captures-2700.json), [scene contact sheet](evidence/greenwood-redesign-20261029/baseline/native-contact-2700.webp) and [actual object/road overview](evidence/greenwood-redesign-20261029/baseline/overview-2700.webp). These are procedural fallback software-Canvas views at 150%, with live actors retained and simulation frozen for capture; not browser HUD, retained bitmap, Pixi, physical-device or owner acceptance. All four source worlds have 198 props, 32 ordinary enemies and 640 outdoor crowns; all 15 sampled destination routes reach their native targets. The existing `greenwood-flagship.test.cjs` rollback suite passed on unchanged source@fcc1f42: original worlds, expanded-save inverse conversion, identity/progress and repeat reload. Its pass certifies the baseline rollback contract only.

## Historical construction study checkpoint — draft #654

The [implementation draft #654](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/654) now contains an **inactive construction study**, enabled only by `tools/greenwood-layout/fixtures.cjs::loadRedesign(size)`. The default game still uses the published rollback configuration. `greenwood-landscape.js` owns the new basin, authored route hierarchy, settlement parcels, complete gated perimeters, mill waterworks, summer hardwood/understory drawings and ground variation. Existing raster masters and registrations remain intact. Both sizes use the same topology with unchanged local building/actor footprints.

[3200 study](evidence/greenwood-redesign-20261029/study-3200.json) and [3400 study](evidence/greenwood-redesign-20261029/study-3400.json) retain exact source hashes and disclose failures. Each exercises four seeded worlds, both-way service/site routes, every authored route segment, ordinary actor/tribute totals, and repeated spatial reloads; original-source synthetic migrations are reported separately. This is not a full-game certification. The four other regions' authored tables compare equal before/after configuration. Their gameplay and visuals are not being redesigned.

Native procedural Canvas views: [3200 contact sheet](evidence/greenwood-redesign-20261029/study-current-3200/native-contact-3200.webp), [3400 contact sheet](evidence/greenwood-redesign-20261029/study-current-3400/native-contact-3400.webp). Each set contains 27 day/night/phone-size/desktop scenes with source hashes and read-only rendering assertions. These are construction reviews, not accepted artwork, browser/Pixi parity or device evidence. Captures precede a final node-access-only reload correction; preserve their recorded hashes rather than relabeling them as final candidate evidence.

The first visual iteration was internally rejected: retained prototype scenery cluttered the new districts and walls were disconnected. The revised study replaces disposable scenery and uses shared wall endpoints for collision and drawing, with deliberate gates. Its route audit then found five wall intersections; approaches were rerouted through gates or outside compounds. Restore testing found lost waterworks, refuge-body relocation, witness movement and a blocked migrated resource; those findings led to scoped repairs, with repeated-reload results retained in the study reports.

**Scope:** Greenwood Vale, the whole first region only. The owner's supplied READY ZIPs were inspected: their five screenshots are byte-identical to the previously recovered originals; their portable index points to earlier #643, while the newer #644 commission remains controlling. Both records agree on complete reconstruction and preserved gameplay/progress. The rollback is not a size instruction, and 3200 is not a ceiling.

**Validation:** the existing rollback suite passed with the new study inactive. Generated entries, service-worker inventory and JavaScript syntax pass `node scripts/build.cjs --check` at dev.235 (221 campaign assets, 14 optional historical assets). This verifies packaging of the inactive study, not a newly versioned release. Broad game/browser suites were not run.

**Still incomplete:** genuinely player-authored expanded/rolled-back saves; full first-region encounter/patrol and rescued-service review; meaningful land-use/edge and journey comparisons beyond raw prop counts; complete art/frontage/hydraulic self-review; actual Canvas/Pixi browser parity, sustained regional play and performance checks; final dimension choice, candidate activation/versioning and owner-ready evidence. Original-source synthetic migrations pass both sizes (unchanged input, quests/payments and tribute, 32 ordinary enemies, stable second reload, no unresolved placements). The bounded construction/worker/interior stage below extends this evidence; it does not certify all played saves. No candidate is offered for owner acceptance yet. No merge, publication or device verification is claimed.

## Historical resumed lifecycle stage — source migration 2, scene revision 2

The supplied READY archives were read, all five actual owner screenshots inspected, and the recovered branch/head matched to #654. #644 remains the commission; #655's final disposition closes the proposed safeguard project without installing it. This stage changes Greenwood only and leaves the study inactive.

`make-lifecycle-saves.cjs` constructs seven controlled synthetic states with the exact expanded **dev.234 engine at bda30dab** (dev.233 geography), then passes those same exports through the exact **dev.235 inverse rollback at fcc1f428** to obtain seven genuinely converted source-version-0/rollback-version-1 inputs. They exercise partially built dungeon recovery camps, already-paid partial Full Barracks upgrades, loaded workers, delivery journeys, and heroes inside Crypt/Treasury/Old Orchard Cellars. Native build/work/gather/interior actions own the state; explicit rank/crown prerequisites, legal actor staging and controlled nearby defeats are disclosed. These are not private player exports or sustained playthroughs. The frozen [14 inputs and source provenance](evidence/greenwood-redesign-20261029/synthetic-expanded-rollback-lifecycle-v4.json.gz) are not edited during tests; regeneration requires a new explicit output path.

The first run exposed unchanged delivery breadcrumbs, a resident displaced on the second restore after the mill was installed, and an uncomposed parent exterior when restoring inside an interior. The fixes translate expanded-save breadcrumbs, resolve resident/home collision against the completed scene, and compose the parent before exits read entrance coordinates. The old rollback never translated delivery breadcrumbs and later play can replace them with 2700 coordinates; that mixed history is ambiguous. Only those saved routes are invalidated for native replanning, preserving work-order target, cargo, wallet and partial work. Owned/custom props are also retained through terrain pruning, including an unresolved placement, instead of being deleted. Scene revision advances independently of source migration; the hot path reads the configured revision rather than a hard-coded number.

Focused validation checks unchanged raw inputs; quests/payments/discovery/victories/rescues; exact remaining tribute and dead identities; construction and upgrade payment/progress; cargo delivery exactly once; stable second/third spatial reloads; recovery-camp reachability and native work completion; all three native interior exits and party arrivals; and transport-relative wagon arrival at both sizes. Final [3200 lifecycle receipt](evidence/greenwood-redesign-20261029/lifecycle-3200.json) and [3400 receipt](evidence/greenwood-redesign-20261029/lifecycle-3400.json) each pass all 14 cases with runtime/fixture hashes. `node tests/greenwood-flagship.test.cjs --record-study` passes the original default rollback checks plus these 28 cases; `node scripts/build.cjs --check`, changed-code Prettier 3.5.3 and `git diff --check` pass. The refreshed four-seed studies also pass every sampled destination/road, source migration, population/tribute and repeat-reload check at each size. [Four bounded unchanged-region controls](evidence/greenwood-redesign-20261029/scope-controls.json) compare exact fresh/restored roads, props, services, enemies, resources and construction to prior #654 head eb435b53; all match. These controls cover one seed at the 3200 configuration and do not certify whole-region gameplay or the independently newer main layouts. Reported runtime hashes were checked against the completed source. The ordinary test entry is `tests/greenwood-flagship.test.cjs`; its optional `--record-study` flag explicitly writes lifecycle receipts, while normal CI is read-only.

No first-hour, encounter, art, renderer-parity, performance or owner-acceptance gate is closed by this stage. Next: measured edge-use/journey comparison and encounter/service review, then completed scene self-review before activation.


## Historical dev.237 closeout and mandatory execution-quality gate

The owner explicitly requires completion of the actual region, followed by an audit for poor task execution **before formal acceptance testing**. That audit must judge the built world against all 50 decisions, the five original documents, both restart commissions, the real owner screenshots and later clarifications, and the Marches/Highlands/Frontier quality references. It must identify and correct omissions, timid substitutions, weak composition and misleading completion claims; passing tests are not a substitute.

The owner's real first-hour experience and final acceptance are reserved for direct exploration after the finished work is merged. Long automated playthroughs are **not required** and must not substitute for that review. The previous long orientation pilot was interrupted; its partial images/progress are diagnostic only, never a completed acceptance session. Gameplay automation is limited to short, specific defect checks and audit observations.

The implementation now targets 3200: the same district relationships fit without shrinking assets, while 3400 lengthens the measured journeys without adding a required function. Current dev.236 main is integrated, including its authorized restoration of other regions. The draft enables the replacement as dev.237; it is not merged or published. Newcomers start at Millhaven; outer corners now contain the northern managed-woodland loop, northeast wagon yard, southwest Goblin household compound and southeast Crypt/estate approach. River/mill hydraulics, working frontages, separated growth stages, rare dry-rise conifers and restrained source-owned nature are authored together. Paid camp conflicts relocate the complete camp where possible instead of pulling the mill or defensive walls apart.

**At this dev.237 checkpoint the next gate was the execution-quality audit.** The completed audit and dev.238 interior extension follow below. Older study captures and receipts retain their own source hashes.


## Execution-quality audit — 30 October 2026

This is the requested review of **task completion**, performed after building the replacement and before the final focused technical verification. It compares actual composed scenes and their owning source with the original five documents, all 50 decisions, #643/#644, all five supplied owner images, portable handoffs and the latest direct instructions. Marches/Highlands/Frontier references were reread as examples of shared physical water geometry, useful edge destinations, coherent economic districts and gated domestic courts; their colors, lore and gameplay were not copied. Current integrated base is `main@7bd288fd` (dev.236), including the separately approved other-region restoration #651. The original fcc1f42 base and all earlier receipts above are historical.

**Audit findings and corrections:**

| Finding | Judgment and remedy |
| --- | --- |
| Uniform cart-road color underdelivered M03 | Corrected two worn approaches to muted red clay; farm lanes and the remainder of the cart road remain soft earth. This is local wear, not an orange terrain wash. |
| Opening composition needed a distinct standing place | The newcomer now starts on the open main street at 520,600, with the Captain ahead across the crossroads. The camera tool previously staged the hero at the town anchor instead of the actual opening; corrected the tool as well. Saved heroes are not reset. |
| Mill visual system needed scrutiny beyond vicinity tests | Current full production scene shows tributary into the retained pond, an exposed sliding weir, a wetted wheel connection and downstream tailrace joining the river. The earlier stream under the Captain and hidden weir were removed during implementation. Loading is on a separate dry farm frontage. No second painted pond or mill economy. |
| Generic identical defenses would miss the commission | Goblin fort uses an irregular joined perimeter with east gate, approach, domestic court and stores. Treasury is an organized receiving enclosure near the freight crossing; Skeleton watch uses stone. These are distinct whole compounds, not independently scattered fence fragments. |
| Orchard growth must be visible rather than inferred | Added staked new shoots separately from young saplings and bearing trees; drying/storage and decorative earth-banked cellar stay connected to the farm lane. Existing Goblin Old Orchard Cellars remains a separate interior. |
| Nature and edge use needed actual built evidence | Rounded hardwood silhouettes, taller hickory/tulip shapes, pale wet-bank trunks, low growth and two dry-rise pines replace the generic nature layer. NW has a traversable managed-woodland loop, NE the wagon yard/farm-water circuit, SW the Goblin household/woodland approaches, SE the Crypt and estate works. The quiet river reaches intentionally contrast with those destinations. |
| Construction safety could destroy scene coherence | Moved complete conflicting paid camps to compatible plots; never independently drag the mill or perimeter sections apart. Owned objects remain retained if no legal plot exists, with an unresolved audit entry. Targeted migration verification follows this review. |
| Previous test/acceptance wording overstated authority | Long automated play was stopped. No completed 600-second session, first-hour acceptance, hardware performance or artistic approval is claimed. The owner's direct first-hour walkthrough happens after an explicitly approved merge. |

The visual evidence is actual 150% production HTML/HUD with registered assets: [29 scene/view captures](evidence/greenwood-redesign-20261029/audit-canvas/receipt.json), plus [affected-scene production reinspection](evidence/greenwood-redesign-20261029/outdoors-browser-final/receipt.json). The first set precedes the local clay/start and roadside-prop corrections and retains its own hashes. The final outdoor browser set reflects the corrected scene. Rendering is frozen for inspection, with live actors retained; software Chromium frame guards can appear in the HUD and do **not** measure phone FPS. Earlier construction fallback screenshots are not relabeled as current. Private owner originals remain private.

### All 50 decisions — implementation disposition

“Present” here means engineering/source and composed-scene review, **not owner approval**. Mechanical compatibility is verified separately after this audit. Conditional decisions do not require invented content.

| ID | Current implementation and review disposition |
| --- | --- |
| G01 | Present: independent green hardwood/agricultural river valley; no imported US history. |
| G02 | Present: welcoming civic street and farms precede occupied woods/estate pressure. Final emotional effect belongs to owner exploration. |
| G03 | Present: gentle ground patches and low implied contours, no new elevation physics. |
| G04 | Present: cultivated west transitions to layered east/southern hardwood stands. |
| G05 | Present: homes, tools, small fields, pasture, stores and work frontages. |
| G06 | Present: green valley, small fields, local clay wear and physically connected working water. |
| E01 | Present: broad rounded oak-like crowns and narrower tall hickory-like variants. |
| E02 | Present: authored groves, wooded corridors and open field margins, not a uniform scatter. |
| E03 | Present: only two pine accents on a dry rise. |
| E04 | Present: clear working mill/bridge banks, denser downstream riparian stands. |
| E05 | Present: understory in woodland interiors; road/service/compound exclusions. |
| E06 | Conditional fulfilled with compatible source-authored hardwood forms; accepted raster masters preserved. |
| M01 | Present: mature summer greens and deeper woodland shade. |
| M02 | Present: fresh greens, honey timber, muted stone and earth. |
| M03 | Audit correction: local red-clay cart approaches; remaining roads/ground restrained. |
| M04 | Present: one cart spine, narrower farm lanes, faint footpaths and useful doorstep spurs. |
| M05 | Present: timber homes/workshops/mill; stone bases and main bridge; timber southern crossing. |
| M06 | Present: damp bank edges, cultivated patches, forest litter and traffic wear. |
| W01 | Present: shared winding river outline, two maintained crossings and wilder southern reaches. |
| W02 | Present: impoundment, visible controlled weir and connected outlet. |
| W03 | Present: dedicated signature-size mill body and wheel, larger than cottage. |
| W04 | Present: short physical head/tail channels and wheel alignment; no hydraulic simulation. |
| W05 | Present: separate eastern pond with managed farm-water setting; no utility mechanics. |
| W06 | Present: broader stone freight bridge and narrower timber footbridge, both functional rural crossings. |
| S01 | Present: open authored working crossroads, visible civic services and newcomer standing place. |
| S02 | Present: retained grounded timber homes/workshops composed around useful frontages. |
| S03 | Present: irregular purposeful lanes; no automatic broad-road triangle. |
| S04 | Present: distinct workshop tool fronts, houses, storage, market and public service silhouettes. |
| S05 | Present: smaller quieter Hamlet surrounded by orchard/farm production. |
| S06 | Present: laundry, gardens, carts, tools and food/work groupings. |
| F01 | Present: new staked shoots, saplings and bearing trees with maintenance/drying. |
| F02 | Present: offset organic groves, not repetitive rectangular rows. |
| F03 | Conditional reviewed: retained established fruit art/canon; no unapproved crops or paid resources. |
| F04 | Present: separate earth-banked decorative working cellar beside orchard. |
| F05 | Present: small cultivated plots, animal pasture and kitchen gardens. |
| F06 | Present: orchard/drying/cellar frontage joins farm lane toward mill and town. |
| C01 | Present: Goblin shelter, meal, belongings and storage inside defended domestic court. |
| C02 | Present: Skeleton watch reuses older-looking stone/funerary forms with practical household props; no invented burial history. |
| C03 | Present: Thornfang woodland den has training, feeding and shelter space; native patrol retained. |
| C04 | Present: Crypt reclamation/scaffold → woodland cargo cache → Treasury receiving yard connected by east-bank lane. |
| C05 | Present: existing Crypt funerary architecture contrasted with new timber estate works; no new sacred lore. |
| C06 | Present: Scornfang's Treasury visible identity; supply-vale / boss thorn / mentor thorn remain stable. |
| C07 | Present: stores, guarded logistics and estate works coexist with civilian production; no invented atrocities. |
| P01 | Present: visible roads, services and silhouettes invite exploration; no new tutorial. |
| P02 | Present: connected farm/woods/estate and northern/farm-water circuits. Geometric measurements follow; human pacing reserved to owner. |
| P03 | Present: signature mill, orchard, domestic forts and old/new estate contrasts with quiet transitions. |
| P04 | Preserved existing restrained countryside/water audio; no new recording or audio system. |
| P05 | Present: production day and night views retain landmarks and readable roads; woods/estate darken. |
| P06 | Present: moderate authored scene/vegetation budget, clear civic/bridge/door spaces. No density quota. |
| P07 | Present: ordinary work and inhabited monster societies alongside Scornfang/estate control. Final interest judged by owner. |

### Quality-audit findings Q01–Q17 disposition

Q01/Q15: current main integrated, other drafts not presumed shipped. Q02/Q10/Q17: actual size/land-use/route measurements retained with methods and source hashes; no arithmetic-only size claim or invented FPS. Q03/Q08/Q09: named essential scenes, authored routes and working fronts are installed; focused route/party checks follow. Q04: pre-prune source-aware migration and retained paid construction, with original/expanded/rollback inputs and repeat reloads. Q05: actual unified mill water/visual system. Q06: existing approved Scornfang naming with internal identities intact. Q07/Q11: source-owned composed districts/nature and retained sprite lineage, reviewed in real scenes. Q12: latest direct owner instruction supersedes old automated 10–60 minute pilot requirements; owner owns real first-hour evaluation. Q13/Q14/Q16: historical receipts labeled, active docs reconciled and technical/owner/device/release status separated. These are dispositions of execution quality, not claims that final focused checks have already passed.

**Gate:** execution-quality review complete after reinspection of the corrected opening/clay scenes; no known omitted binding requirement is deferred to the owner as basic engineering homework. Final focused defect/save/build checks follow. Artistic first-hour and physical-device acceptance remain with the owner after authorized merge/publication; they are not automated gates or claimed completed here.


Final technical checks found a real missed join: the east-bank freight lane began near the cart spine rather than on it. The cart spine now visits the freight junction explicitly (scene revision 5). Wall collision also performed exact segment-distance calculations for distant walls during every route probe; an expanded-bounds rejection now preserves exact near-wall collision while removing that unnecessary work. These findings are corrected before handoff, not waived or assigned to owner testing.


## Owner extension — interiors and procedural art, 30 October 2026

The owner moved the endpoint of this Work session to **implemented, execution-audited and corrected**, with ordinary PR/check/merge workflow handed to a subsequent chat. Merge/publication remain unauthorized. The owner specifically authorized suitable new procedural interior assets and replacement/redrawing of unprotected generic outdoor assets. No unseen appearance is represented as owner-accepted.

**New direct canon:** the Crypt was an ordinary crypt. The Lifebinder brought his aware skeleton followers/work crews with him; they were not raised from these graves. They are paid to convert it into the Dark Lord's residence, have reservations about repurposing funerary space and limited freedom to refuse. They are neither random spawning monsters nor an invented universally enslaved species. Scornfang handles local decommissioning, remediation, salvage and relocation; Thornfang handles security. A possible future undead hero/neutrality system is discussion only and is not implemented. Borin's established captivity remains unchanged. The existing no-fabricated-retired-Crypt-art rule remains: packing frames and handling tools are work equipment, not claimed historical relics.

**Interior audit findings and implementation:**

- Scornfang's Treasury retained wolf/Thornfang-style bed, trophy and pup-den props despite its changed ownership. The scene now has a receiving area with padded handling frames, labelled inventory shelves, reclamation bench, accounts desk and guarded pay chest; a separate Goblin cot/locker and meal space give Scornfang a private household. Two cache identities, eight defenders including three ranged guardians, his mentor, combat abilities and currency remain intact. Two existing screen openings support the defended work hall. The Highlands Treasury was the functional-composition reference, not a copied floor plan.
- Ten generic lounge objects cluttered the Lifebinder's command area. These decorative-only objects are retired from that floor; guest lodging and study remain in their own wings. The battle floor has a wider command chamber, two defended threshold openings and a distinct west flank, giving the boss/attendants circulation rather than a furniture choke. Original guard identities/species/roles, attacks, summoning, rewards and captive remain. Blueprint/work-tool stations connect skeletal labor, conservation and residence conversion without adding enemies or a work minigame.
- Old Orchard Cellars contains paid Goblin families, preserves and the Codex; it is not an abandoned ruin. Thorn-style bedding/bone clutter is replaced by Goblin cots, pantry jars, tools and a cooking hearth. Its old column collision remains while lower stone piers replace gravestone-like placeholders. The first art pass made the piers too tall; internal 150% review rejected that occlusion and lowered them. No skeleton-origin lore is imposed on this Goblin household.
- New furniture is explicitly procedural even when retained rasters are loaded. Materials, fastenings, jars, bound ledgers, padded frames and hand tools serve specific functions. Source masters/registrations remain intact. Final appearance acceptance belongs to the owner.

Native evidence: [before](evidence/greenwood-redesign-20261029/interiors-before/receipt.json) and [after](evidence/greenwood-redesign-20261029/interiors-after/receipt.json), twelve source-native 150% views each; [production-browser interiors](evidence/greenwood-redesign-20261029/interiors-browser/receipt.json), nine desktop/portrait/landscape views. Source hashes and read-only rendering assertions accompany each set. The before fixture is synthetic QA generated before the interior pass, not a private player export. The scoped interior check passes original roster/stats/rewards/paid/dead/cache/tribute preservation, named interaction routes, usable furniture bases, second/third reloads, three distinct command approaches and actual Clerk of Works attendant spawning/routing. These are targeted defect checks, not a playthrough or owner acceptance.

The extended audit revisits outdoor composition as a whole: focal mill/controlled water, open service street, grouped orchard growth/storage, useful edge routes and coherent domestic/defensive sites. The strict street audit exposed decorative wells, tools and cargo on visual road margins; they were moved to actual roadside/work parcels. Custom low line-built walls use a source-appropriate 60-unit margin (31 cart half-width + 5 wall + 20 party), with physical segments checked; house-roof setbacks remain strict. Paid construction also relocates if a migrated plot lies on a road, not just beside essential scenery. No blanket regional finalizer is reintroduced.


## Handoff to the next chat — implementation endpoint

**Resume the same PR #654/branch `feat/greenwood-flagship-redesign-20261029`; do not create another redesign or replay implementation.** Dev.238 contains the active 3200 landscape (source migration 2, scene revision 5) and interior scene revision 1. Current base is main@7bd288fd. The remote commit accompanying this handoff owns the final source tree; capture/report hashes distinguish earlier observations.

Implementation and the extended task-execution self-audit are complete, with the corrections above. This is not an assertion of owner artistic acceptance, physical-device performance or a fully green release workflow. The owner requested that the next chat handle ordinary release preparation/check/PR work and return here only if substantial implementation work is uncovered. His real first-hour walkthrough follows a separately authorized merge/publication. **Do not run long automated playthroughs or ask him to re-answer the 50 decisions.** No merge or deploy occurred in this work.

### Bounded technical evidence already obtained

| Check | Actual scope/result |
| --- | --- |
| `tests/greenwood-interiors.test.cjs` | Three preserved pre-pass synthetic interiors: original IDs/stats/rewards and paid/dead/cache/tribute state, usable furniture/interaction routes, second/third spatial reloads. Actual Lifebinder attendant spawns/routes and three command approaches pass. Paid camp overlapping the mill keeps payment/state, relocates as a whole and resumes via the native command. Ordinary non-recovery build orders are intentionally cleared by the existing snapshot contract; recovery-work orders are covered by the lifecycle fixtures. |
| `tests/town-street-audit.test.cjs --region=vale` | Strict active Vale: all 16 authored cart/farm/footpath routes connected and physically clear, all 331 prop margins, service fronts and historical owned construction pass. The obsolete requirement that Hamlet be the *last* vertex is replaced with geometric membership in the connected authored network, including real footpaths. |
| `tests/greenwood-flagship.test.cjs --record-study` | Historical 2700 rollback adapter retained as an explicit fixture; active default four seeds pass essentials/counts/tribute. All 14 original-source expanded/inverse-rollback lifecycle cases at each size pass (28 total); payment, cargo, partial construction, interiors/transport and repeat reloads remain stable. |
| `redesign-playability.cjs` | Short native crossing/party/patrol and six-quest checks, with source hashes. Controlled boss/guard defeats are fixtures, not human combat. Guard-only fixture defeats use the existing companion-participation convention so an unrelated new Ringleader is not accidentally scheduled. No game guard/pending rule was weakened. |
| `redesign-scope.cjs` | Four bounded negative controls against main@7bd288fd: exact fresh/restored roads, props, NPCs, enemies, nodes and buildings agree for Marches, Highlands, Frontier and Crown. |
| `tests/crowd-collision-fast-reject.test.cjs` | Exact original terrain/scenery collision equivalence and dynamic geometry pass. Only the new Vale uses earlier per-segment candidate shortlisting; no persistent stale collision cache. A long native route diagnostic improved from roughly 630–690 ms to 280–305 ms on this host. These are host measurements, not device FPS. |
| Renderer/art | 29 early production Canvas audit views; final corrected outdoor production views; 12 before/12 final native interior views and isolated procedural furniture; 9 production Canvas interior views and 3 actual confirmed Pixi interior views. Source fingerprints, viewport/renderer and read-only assertions are retained. Software SwiftShader performance guards can appear; no hardware claim. |
| Packaging | `node scripts/build.cjs --check` passes dev.238: 222 campaign assets, 14 optional historical assets. New module is in the source template, all generated entries and offline inventory. Changed new modules/tooling use Prettier 3.5.3; `git diff --check` passes. |

Land-use method/results: [2700 baseline](evidence/greenwood-redesign-20261029/landuse-2700.json), [3200](evidence/greenwood-redesign-20261029/landuse-3200.json), [3400](evidence/greenwood-redesign-20261029/landuse-3400.json). Each has sixteen cells and outer one-eighth bands/corners, actual 50-unit walkability samples and sampled route proximity to original enemy homes. These are **not** encounter guarantees or human first-hour times. Current 3200 has 331 props, 32 ordinary enemies, 640 crowns and no empty unassigned cell. The longer estate circuit deliberately has a quiet stretch (about 5,300 units near no initial enemy home within 220); it contains the wagon/river/estate scenery, not an invented combat density pass. Owner experience remains to be judged in person. 3400 adds route distance without a required new function, so 3200 was selected.

### Remaining work belongs to the release-preparation chat

Read this record, current PR head and `AGENTS.md`; check whether main advanced, run the ordinary impacted PR checks/build required by the repository and inspect actual GitHub statuses. Reconcile any strict original fixture/source fingerprints only against the specifically authorized changes, never by blanket exclusions or false baseline claims. Earlier receipts stay source-pinned and need not be replayed unless a relevant source change invalidates them. This session does **not** claim GitHub CI green. Do not launch a full-game/browser matrix. If a new functional failure is found, diagnose it; return substantial implementation work with a concrete finding. Then obtain the owner's explicit merge/publication authorization under the existing policy. Do not declare artistic/device acceptance or invent a new mandatory automated first-hour gate.


The final native quest check also caught a transition-order defect in the new interior reconciler: it attempted to find an interior-safe point while `enter()` still held the exterior door coordinates. The reconciler now leaves out-of-room coordinates to the native arrival owner; explicit entry from the relocated Cellars door, party arrival and return have a regression case. This is an implementation repair, not a waived failing quest. All fresh/restore scene observations preceding it remain labeled with their recorded hashes.
