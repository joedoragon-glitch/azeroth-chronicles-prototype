# So I Became the Dark Lord's Problem — director-approved worldbuilding and snapshot canon lock

**Decision date:** 12 October 2026  
**Authority:** Author's completed 45-question director ballot, including custom rulings and explicitly approved final review.  
**Status:** **DIRECTORIAL CANON APPROVED; DOCUMENTATION ONLY.** This document is not a source patch, gameplay implementation, QA certificate, merge instruction, Pages deployment, or snapshot publication approval.  
**Release label:** **Community Snapshot — October 2026** (technical build/version separately recorded).  
**Project architecture:** Existing modular multi-file GitHub Pages/PWA; never impose a portable single-HTML constraint.

## 0. How to interpret these rulings

This is the **latest specific authorial supplement** to earlier worldbuilding records, not a replacement for the approved mechanics, regional continuity, quest/save guarantees or engineering acceptance criteria they already contain. Use the newest directorial decision **only where it conflicts with earlier text**; carry forward all compatible approved earlier work. In particular, the changes to Thornfang/Mira **supersede Greenwood PR #289's fixed-cage assumption**, the sixth companion is no longer merely a #234 hypothesis, the detailed Veyrith philosophy is newly selected, and Crag's extra attack-cooldown acceleration is now expressly authorized.

**Evidence must remain separated:** (1) approved canon/design; (2) implementation actually present in the currently released main; (3) isolated unmerged code; (4) behavior demonstrably tested on one combined candidate. Approval in this document upgrades **only (1)**. Individual PR tests do not certify (4).

**Source references:** master [#232](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/232), canon audit [#251](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/251), combat [#247](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/247), audiovisual [#257](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/257), approved finale [#266](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/266), region documents [#289 Greenwood](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/289), [#290 Flooded Marches](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/290), [#293 Ironroot](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/293), [#291 Frontier](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/291), [#288 Dark Crown ministers](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/288), [#292 Dark Crown feasibility](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/292), and central feasibility [#262](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/262).

## I. Snapshot and development policy — choices 1–8

| # | Approved choice | Binding decision |
| --- | --- | --- |
| **1A** | Complete worldbuilding | This particular snapshot includes **all applicable approved worldbuilding**, implemented and verified. No silent feature omissions merely to make a deadline. |
| **2B** | 24-hour aspiration, correctness first | Attempt a candidate promptly, but **no firm completion/release deadline** and no unsafe or unverified publication. |
| **3C** | GitHub Pages | Share a **frozen, tested** browser/PWA snapshot through Pages while continued development remains isolated. Pages is public, not forum-only access control; already cached/installed PWA copies cannot necessarily be revoked by unpublishing. |
| **4A** | New official title only | Player-facing title is **So I Became the Dark Lord's Problem**, not a dual title/“formerly Azeroth Chronicles” banner. See unmerged rebrand PR [#282](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/282); preserve historical repo URLs, app scope/ID, internal save keys and old archives where necessary. |
| **5A** | Community Snapshot — October 2026 | Public-facing snapshot label is informal. Record actual build/version separately, with no forced formal beta schedule. |
| **6A** | Include approved micro-scenery | Include and verify [#284 Greenwood grove/carpentry](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/284), [#286 Marches fishery props](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/286), and [#287 Burned Hamlet garden/laundry](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/287); preserve no-collision, routes and historical-save behavior. |
| **7B** | Conditional performance addition | Include [#294 viewport culling](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/294) **only if safely and demonstrably beneficial**; it is not justification to block completed approved worldbuilding. Paused sprite work [#217](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/217) remains excluded; already released optimizations and art remain protected. |
| **8A** | Delegate missing numerical tuning | Engineering may determine **only previously unspecified** damage, cooldown, radius, cadence, status duration and motion figures under the approved actions and existing balance constraints, with actual tests. Locked values are immutable absent further owner approval. Escalate material changes of fantasy, scope, combat outcome or difficulty to the owner rather than silently inventing authorization. |

The existing all-approved-contributions/single-batch principle survives the snapshot naming change. Development may occur in small recoverable technical stages, but **do not ship an incomplete approximation of the locked scope**. The author will approve the exact final candidate separately.

## II. World history, roles and relationships — choices 9–18

| # | Approved choice | Binding decision |
| --- | --- | --- |
| **9A** | Two subtle historical clues | The Dark Lord's former player-controlled hero past is gradually hinted via **two short existing Greenwood quest / Keeper Archive interactions** (in the spirit of #252). Avoid a long expository cutscene. See explicit sixth-companion reveal-timing gap below. |
| **10C** | Hero is the missing sixth | **The current player-controlled hero really was the sixth companion** of the Dark Lord's former party. This is no longer merely an #234 idea. Make the history coherent for fresh/legacy Paladin, Mage and Ranger starts, normal/Nightmare/Succession and old saves. No new player class or compulsory hero reskin. |
| **11B** | Veyrith, Loyal Air Marshal | Proud, disciplined, loyal to the Dark Lord; believes organized aerial patrols and military superiority secure lasting peace. Keep his established purple personal-mount identity, genuine flights, approved seven aviation moves and **unfinished** royal air program. Older aerial-pathfinder/extraction/safety-permit psychology in #254 was provisional and does not override this selection. |
| **12A** | Superintendent of Reclamation | **Scornfang** holds this local administrative title while remaining a Goblin, Thornfang's disciple and the named Greenwood Treasury captain. Responsibilities include decommissioning, remediation, salvage and relocation; no new kingdom-wide ministry or unrelated economic system. |
| **13B** | Thornfang wilderness scout | Thornfang formerly worked as a **Crown wilderness scout** before estate security, explaining tracking/reconnaissance and long patrols. Do not invent a named birthplace/home region. |
| **14C** | Cindermaw's promotion | The Dark Lord personally elevated Cindermaw because of his aptitude for organizing Ash beasts and administering territory. Existing field-boss identity, Interior/Welfare ministry and relationship to Dreadmaw remain unchanged. |
| **15D** | Custom Barracks and Wraith canon | See full explicit custom text below. This is a selected fourth/custom ruling rather than A/B/C. |
| **16A** | Existing crowns only | All circulating **crowns** bear the Dark Lord's portrait, from separately sourced Ironroot silver/copper ore. No coin-reverse design, five-region insignia, metal alloy percentages or new currency system is approved. Preserve #259. |
| **17A** | Genuine retired Crypt objects | Scornfang's Treasury may display **only demonstrably retired/unused Crypt objects** as non-loot decoration after provenance audit. Never remove in-use Crypt art, duplicate rewards or change two existing Treasury collectible caches. If no legitimate retired objects exist, flag the evidence gap instead of manufacturing “retired” provenance. |
| **18B** | Lifebinder TRUE | Display **“Lifebinder TRUE”** consistently, rather than “TRUE Lifebinder”; preserve family `crypt`, enemy/save IDs, normal/TRUE/Awakening logic, fallback and old content compatibility. |

### Custom director ruling 15D — Barracks recruitment and Lantern Wraith relationships

- **Lifebinder and the Drowned Keeper were originally recruited from the Barracks as companions**, through the same general institution by which the present hero recruits Soldiers and Archers. They belonged to **different, as-yet-undiscovered companion classes**, not current Soldier/Archer classifications. Their existence hints at optional companion classes the current player has not found; **do not immediately add playable/recruitable classes, alter party slots or invent abilities**.
- **Lantern Wraiths originated in Ironroot Highlands**. Mining and mint/coin-production disturbance became intolerable, and they moved away. This history does not itself order current Ironroot spawns or new enemy population.
- **Cindermaw and Dreadmaw have grown to like the Lantern Wraiths, and the feeling is mutual**. They socialize when circumstances allow, notwithstanding their differing duties and residences.
- The Wraiths enjoy studying in the **Drowned Keeper's Archive** and assist him. He cautions them to be careful with their lanterns. They resent the Archive flooding and currently help the Keeper. **The actual cause of the flooding remains unknown**; do not retcon the Keeper's separate drowning or assert that Wraiths caused the flood.
- Do not automatically assign one common undead species/origin to Lifebinder, Keeper and Wraiths, nor rewrite existing night-only Wraith mechanics. Short existing-world cues are appropriate; new enemy AI, regions, sixth hero class, Archive minigame or combat summons require separate design approval.

### One expressly open presentation detail (NOT open underlying canon)

**OPEN: when and by what concise in-game presentation the hero explicitly learns they are the sixth former companion.** Choice 10C locks the underlying fact, choice 9A locks the two restrained early clues, but those selections **do not specify a final reveal scene/timestamp**. Do not represent the revelation as already implemented. Keep this a separately identified presentation decision to resolve deliberately without altering the established timeline or forcing new cutscene infrastructure.

## III. Greenwood and Ironroot combat — choices 19–27

| # | Approved choice | Binding decision |
| --- | --- | --- |
| **19B** | Crag double speed improvement | **Hostile Liquidation** triggers once at 55% HP and grants **+35% movement speed AND 25% shorter attack cooldowns** (draft factor `0.75`). Both are now explicitly ratified. Preserve Crag's 1,650 base HP, named captain role, Ridge-like horned humanoid species, and separate ordinary Wolf Treasury guards; do not add TRUE form. |
| **20A** | Predictable Thornfang circuit | Repeatable patrol using his original den and the approved Greenwood exterior Goblin/Skeleton territories, crossings and Forest Crypt perimeter; **exclude Millhaven**. Genuine traversable route and interactable moving captive required. |
| **21A** | Den reset with Mira | After combat disengagement, **Thornfang and Mira return together** to Thornfang's temporary Greenwood den, reset and resume the circuit. The den is not his distant original home; existing 120-second field respawn, defeat/key reward, TRUE streak/pending spawning and save rules remain protected. |
| **22C** | Tracks and local reports | Players find patrolling Thornfang through physical clues and local-inhabitant reports, not a live GPS/map-sector tracker. Hints must be discoverable and usable enough that Mira rescue is never stranded. |
| **23C** | Four sling shots | **Cradle-to-Grave Tracking** shows a numbered target tag and fires **four lighter, faster, actually dodgeable sling projectiles**. Use real scheduled, collision-tested shots with distinct readable cues. Exact unapproved numerical tuning delegated under 8A. |
| **24B** | Four Hot Zone patches | **Hot Zone** places four compact, temporary hazardous ground patches resolving in **two staggered pairs**, with truthful warnings, safe escape lanes and cleanup. |
| **25A** | Stay Alive TRUE timings | **Normal**: three clearly separated sequential bone projectiles. **TRUE**: the same three projectiles stagger/overlap their timing slightly, while remaining readable, collision-aware and dodgeable. |
| **26C** | Algor Mortis | Faster, clearly warned expanding supernatural cold wave; **zero direct HP damage** and **two seconds of Slow** on contact. No accidental shared-resolver minimum-damage leak. |
| **27A** | Anastylosis | Brief visible stone-assembly preparation, then **exactly four seconds of 20% incoming damage reduction**, self-targeted and non-damaging. Keep already approved Structural Consolidation mitigation, multiplicative stacking and truthful VFX/expiry. |

### Binding additional Greenwood character/world change — mobile Mira

**This explicitly supersedes #289's protected fixed `cage-thorn` / stationary captive presentation for the new canon.** Thornfang is smart and **keeps captive Mira physically traveling with him** on patrol. Mira is compelled to follow behind him, using the existing hero-companion following behavior as a **behavioral analogue** (not automatically a new recruit, allied fighting unit or player-controlled companion). During an encounter, she stays behind Thornfang rather than becoming an attacker. When he resets, she resets and returns with him. She performs **paid but compulsory** security-compliance inspections/work and teaches local inhabitants to meet standards **under Thornfang's supervision**. Wages **do not** imply freedom.

Thornfang intends to **return to his original unspecified home after the Dark Lord's winter estate is completed and its local inhabitants can keep it security-compliant**. This is a future character motivation, **not** an immediate order to remove the field boss or auto-complete the estate in the snapshot.

**Mandatory implementation reconciliation:** preserve the canonical **same Mira ID**, existing quest/key/reward and rescued/unrescued old-save outcomes; retire or migrate the stationary cage safely rather than cloning a second Mira. Defeating Thornfang anywhere on his real patrol must make Mira's original rescue available reliably; after liberation she must stop following him. New/historical saves, reset, encounter death, patrol teleport prevention, disengagement, respawn, pending/TRUE field fights, neutral peace and movement around narrow paths all need explicit tests. A player's companion-follow algorithm may be reused selectively without changing party count/controls, captive agency or hostile targeting. The earlier fixed-cage assertion **must be deliberately updated**, never bypassed casually.

## IV. Dark Crown ministerial combat — choices 28–40

| # | Approved choice | Binding decision |
| --- | --- | --- |
| **28C** | Variable ministerial inspections | Cindermaw chooses from already-approved Crown facilities (roost, Crownwatch, Ash Refuge, Ruined Foundry and valid inspection routes) in a variable schedule, traveling with Vera and her guards. Physical, collision-safe access and return/home/rescue logic required. |
| **29B** | Vera mobile forge | Vera travels with a **small mobile smithing workstation** and guards, not an idle fixed cage. Her labor is paid but compulsory; retain independent rescue and original post-rescue Master Smith services. No added new currency or duplicate NPC. |
| **30C** | Vera battlefield repairs | While held, Vera periodically **repairs damaged defensive equipment or defenses** of existing eligible nearby Ash-beast allies. No extra troops, new universal durability economy or unrelated global repair effect. Exact missing numbers and implementable defense-repair representation delegated under 8A; test that the action actually affects a real eligible defense state and stops appropriately on rescue/death/disengagement. |
| **31B** | Cordon Sanitaire | Burning contracting ring has **one wide safe opening that changes position exactly once** before final explosion; both locations/warnings and real navigable escapes must match the hitbox. |
| **32C** | Administrative Distraint | Successful marked claw lunge strips **all eligible currently active temporary defensive buffs**; **never** removes equipment, permanent talents/abilities or character progression. Eligibility defined against actual supported effects, not a newly invented dispel subsystem. |
| **33B** | Parens Patriae | Protect nearby Ash-beast allies for **approximately three seconds**, with **bounded fiery retaliation** against qualifying attackers. Avoid unlimited reaction loops or phantom defenses. |
| **34A** | Index of Multiple Deprivation | Seven actual sequential seals/eruptions in a **readable progression around the party**, with warnings and genuine safe paths. |
| **35C** | Horizontal Fiscal Equalisation | Strike the **healthiest party member**; heal the **weakest surviving eligible Ash-beast ally** for **100% of actual post-mitigation HP damage inflicted**, clipped to missing HP. Zero actual damage yields zero healing. |
| **36C** | Devolution of Authority | Up to **four existing, eligible Ash-beast allies** attack from distinct directions; Cindermaw follows with finishing strike, and defeating/disrupting delegates can interrupt sequence. **No fresh summons from this move.** |
| **37A** | Broodscreen Roar | Its immediate wide-area blast can be defeated by **real solid cover/line-of-sight obstruction** after anonymous **1.5s** preparation. Preserve both separately approved **1,200-unit** effect/recruitment radii and at most six **existing native responders**, distinct from 6 Normal/8 TRUE owned magical summons; do not globally change Rogue support radius. |
| **38A** | Transhumance | Dreadmaw executes **two linked, separately warned collision-aware rushes** with a readable direction change, typically L-shaped. Both paths remain dodgeable. |
| **39A** | Creep Feeding | Balanced temporary improvements to **movement speed and attack readiness** for Dreadmaw's existing **living** broodlings, not extra/revived creatures; numbers delegated under 8A. |
| **40A** | Dreadmaw contextual AI | All **seven agricultural regular attacks** have real eligible scheduling based on range, cooldown, brood count and battlefield state. Nucleus Herd respects four-unit cap; Creep Feeding requires eligible living broodlings. Do **not** modify Dreadmaw's already-approved Rogue system, 5,000-HP endurance, 25%-each broodling shields or 45%-HP reflection phase. |

Preserve #288's **seven true Cindermaw ministerial moves**, whole Treasury co-management and entire Dreadmaw agricultural repertoire; newly selected encounter patterns are refinements, not replacements. In particular keep separate owner magical summons/ordinary recruited responders/attack delegates and prevent mixed ownership or duplicate rewards.

## V. Dark Lord combat and finale — choices 41–45

| # | Approved choice | Binding decision |
| --- | --- | --- |
| **41B** | Royal Taxation solo rule | For a **genuinely solo hero**, **two separate qualifying hero attacks** satisfy the existing shield funding condition. When fighting with eligible living party sources, retain the ordinary **two distinct living damage sources** requirement. Preserve the existing shield magnitude, timer, actual source attribution, mark rules, warning and reset. |
| **42C** | Veteran's Repertoire | Dark Lord makes **short collision-aware alternating left/right sidesteps between three warned sword arcs**, not teleporting. Keep all three real damage/warning arcs, other boss moves and normal/TRUE behavior. |
| **43A** | Crowned heroes | Upon actual claim of throne, **Paladin, Mage and Ranger** each gain distinct class-specific royal costume and crown presentation based on original procedural hero artwork and established Dark Lord motifs. Do not change class gameplay or add sprites as a prerequisite; preserve silhouette/gear, fallback precedence and historical saves. |
| **44A** | Visible masters | Optional appointed dungeon masters appear as **peaceful, recognizable actors** in the cleared dungeon they govern, with inspectable name/title. Do not respawn a hostile duplicate, lose the same person's identity, or create a new boss/recruitment system. Maintain one master per dungeon, unique candidate use, save/restore and eligibility for existing field bosses, rescued specialists and **all five named captains even if previously defeated**. |
| **45A** | Concise credits | The approved final **Rest** leads to short, skippable, **once-only** credits using existing UI, then new-game menu with **Nightmare unlocked**. No cinematic engine, mandatory appointments or re-fights. |

The #266 **ordering is immutable**: defeat TRUE Dark Lord → **interact to claim throne** in Dark Crown fortress → class-specific royal look → count previously earned five dungeon TRUE victories and defeat **only outstanding** former companions → optional appointments and neutral peace → valid Rest (including qualified Barracks/healing sites) → credits/new-game Nightmare. Never silently restore obsolete PR #256 automatic peace or replay requirements. The new sixth-companion identity adds story context without altering this state machine.

## VI. Source reconciliation and demonstration gates

**Relevant primary code/dependency families to preserve:**
- Boss/captain scope: [#230](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/230), [#231](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/231), Lifebinder personhood [#258](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/258) and dependent [#280](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/280). The new six-slot Lifebinder decision supersedes earlier four-slot partial source; do not discard compatible work.
- Garun seven-move contract **#253 → #264 → #279**; Veyra five-move and warnings **#255 → #263 → #281**; Veyrith flights **#254 → #283**; Dark Lord veteran kit **#261 → #265**. [#285](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/285) is an **incomplete** integration attempt, not certification.
- Other approved specific systems: #259 ore/portrait crowns; #260 anonymous Shadow Pounce (distinct from Wraith behavior); #282 rebrand; #284/#286/#287 scenery; #288/#289/#290/#291/#292/#293 audits; approved #266 finale; conditional #294 culling. Preserve already released survivability/death/Barracks, Rogue AI, input, quest, rescue, save, combat and performance work.

**Required audit ledger for every approved behavior:** `approved statement | previously released baseline | exact source PR/commit | current integrated implementation | dependent methods/visuals/audio | actual deterministic and natural-AI tests | old-save/region tests | risk/status`. Recheck current main and current PR heads before integration; older document commit hashes are historical snapshots.

**Non-negotiable verification before claiming snapshot ready:**
1. All 45 selected choices **and custom 15D/Mira/Thornfang rulings** are represented faithfully in actual data, character cues, mechanics and locations. Explicitly distinguish lore-only qualifications from programmed skills.
2. Real scheduling/ticking and real collision for new attacks, patrol/escort travel, summons, permanent/temporary states and buffs; no names-only substitution, no frozen/duplicated captives, no no-op attacks or invisible unavoidable warning mismatch.
3. Fresh and imported historical v4 saves; all three hero classes, solo/party, Normal/Nightmare, regular/early TRUE/Awakening, field respawn/TRUE streak, cleared captains, three/two cache IDs as appropriate, rescued captive flags and quest/rest/peace transitions.
4. Exact combined-head Node, build/format, protected-source/raster guards, desktop/phone Chromium/WebKit, VFX/audio hitbox and anonymous-cue fidelity, PWA offline/install/update and deployment artifact checks. Preserve baseline tests and document actual failure/deferral; **never treat separate PR green CI as combined PASS**.
5. Independent second reviewer audits **the real rendered, playable behavior** against regional audits and this lock, documenting disagreements and fixes; record final exact SHA and rollback.
6. Snapshot build frozen and tested, development isolated, availability via public Pages with cache/offline caveat. No false security/privacy guarantee, no invented automatic release or fixed time commitment.

## VII. Remaining open item and authorization boundary

**One explicitly unresolved director-level presentation detail:** *timing and concise form of the in-game revelation that the current hero was the sixth former companion*. Do not confuse this with ambiguity of the underlying **now-approved fact**. It remains identified for later precise review; the two subtle early clues are already locked.

Other unresolved details are **engineering and evidence gaps**, not blanket permission to change the approved design: unchosen numerical tuning (delegated under 8A), actually walkable patrol points/escort constraints, defensible buff eligibility, real retired-asset provenance, balancing, truthful audiovisual cues and actual combined CI/device results.

**AUTHORIZED BY THIS RECORD:** A documentation-only draft PR, links/comments in trackers, and faithful preservation of decisions.  
**NOT AUTHORIZED:** Editing gameplay/source/test/asset/save/build files, merging, deleting history, tagging, publishing, modifying the public Pages site, or representing a snapshot as finished. Implementation requires separate appropriate instruction; the **exact finished release remains subject to the author's independent final approval**.
