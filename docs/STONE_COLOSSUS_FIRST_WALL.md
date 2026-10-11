# Stone Colossus — Garun the Firstborn

> **Issue #242 · Author-corrected draft for review; unmerged.** The user's corrections supersede the earlier assistant-originated “Kharun, the First Wall” resentment narrative. Preserve the public boss title **Stone Colossus** and internal family `mine`.

## Selected beta biography — eight sentences

Garun the Firstborn was the former hero's Ogre Bastion and chief architect, the companion who designed the realm's connected roads, practical settlement relocations, and distinct homes and fortresses for its many monster peoples. He chose a body of fitted stone around a luminous heartstone during an expedition when holding a collapsing mountain gate saved his party; the angular shell, golden eyes, and diamond core are his own design. Now a respected member of the Dark Lord's council, Garun still believes their ruler's order works, although he would much rather inspect a sound bridge than spend another meeting being assigned a construction project. At Colossus Mine he provides security with Ogre wardens and Wolf sentries, while the Ridge Tyrant, his captain, and the working crews handle the region's accounts, currency, and routine production. Comfortably paid for his duties but still obliged to meet the Mine's costs, he spends his spare crowns on charming junk, clever useless machines, striking geometric objects, and stark architectural experiments rather than hoarding valuable metal. He keeps Dara nominally captive yet pays the smith reasonably for repairs and peculiar artistic commissions, allowing negotiated freedom inside the guarded Mine while retaining the power to deny departure. Garun enjoys his quieter life, trusts his old friend, and sees the Mine as a workshop, refuge, gallery, and manageable post—not a retreat from politics or a secret bid for the throne. Should the Dark Lord fall, his control of roads, strongholds, safe passage, and defensive labor could make him a convincing successor whose genuine wish to shelter everyone becomes a realm of protected corridors and compulsory safety.

## Personal character and former party

Garun is not embittered or alienated from the Dark Lord. They remain friends and fellow council members. He can defend the Crown Peace with persuasive, specific examples: connected roads reduce isolation, a repaired bridge saves caravans, and dedicated monster settlements help once-displaced peoples live in homes suited to them. Garun originally conceived the linked-road scheme, settlement/fortress specialization, and practical relocation of houses and service structures into better positions. Those are established **completed past projects**, not instructions to regenerate already-built regions. His current reluctance is mundane and funny: a quiet morning with his collection may be spoiled by another council invitation, invariably followed by “one small building project.”

**Firstborn** is his personal epithet, not proof that he fathered the Ogre species or predates recorded history. The older Mine tunnels predate his stone transformation. The earlier account of an ancient creature accidentally unearthed is rejected. The gold-lit eyes and geometric chest core already in his existing game drawing remain the visual anchors for his chosen Bastion body.

He appreciates objects **for their form, ingenuity, charm or absurdity**, not their price: a self-resetting gear sculpture, a little brass animal, cleverly joined angles, a striking block casting a deep triangular shadow, a tiny machine that rings once and accomplishes nothing. His taste adapts Bauhaus, geometric constructivism and brutalist massing to a fantasy stone-and-forge setting. This is a *personal workshop-gallery* within the operating Mine, not wholesale modern architecture imposed on Ironroot. Neat alignments, negative space and sharply lit work surfaces complement the existing ore receiving, haulage, old cuts, repair forge, collapsed shafts and boss chamber.

## Authority and the odd Dara arrangement

The Ridge Tyrant remains the competent **Master of Coin**, with his captain and crews managing money, mint work, wages, payroll and normal production. Garun leads **Mine security and structural safety**, commands Ogre wardens and Wolf sentries, and has a legitimate practical role and recurring expenses. He is comfortable, not outside the economy. His logistical power derives from the roads and structures he designed, not from appropriating the Treasury.

Dara is **still a captive under the unchanged boss/key/rescue rules**. Yet Garun negotiates work assignments, pays Dara reasonably for both necessary maintenance and weird bespoke sculpture/machinery, and permits limited autonomy *inside* the controlled workshop. Payment and consent are not interchangeable: Dara may enjoy the artistic commissions and respectful treatment while being unable to leave. That contradiction should remain visible without treating captivity as a harmless employment contract. We should not imply Dara necessarily approves of Garun's system.

Garun wanders his galleries to inspect traps, structural members and repairs because he enjoys practical work and takes security personally; when free, he returns to his peculiar collectibles. He expects to be summoned again by the Dark Lord, whose friendship and functional rule he does not question. The Mine remains a working industrial installation, not a second Treasury or exclusive private palace.

## Succession without disloyalty

His succession claim is **contingent**, not a long-running plot to overthrow his friend. If the Dark Lord dies, Garun has the roads, fortifications, trained defenders, engineers, working relationships and credibility to impose order. His philosophy—every person deserves a safe passage and structurally sound shelter—can become compulsory checkpoints, assigned housing and guarded travel. He would consider that humane. People deprived of a choice might not. This resolves the central tension while preserving his affection for the original Dark Lord.

## Player-visible cues proposed in this draft

- **On first Mine entry:** one compact, one-time description ties Garun's signed safety plan to the interregional roads and relocation projects and shows the Mine as functioning security + worksite, distinct from payroll.
- **Dara's guarded workstation:** mention fairly paid *but compulsory* repairs and artistic commissions. His rescue remains keyed to defeating `mine`.
- **Mine personality:** a small geometric collection beside the existing forge/chamber is a strong visual cue. Reuse existing no-collision procedural objects, such as a stone marker, crystal, seat or game table, **only if** existing pathfinding/render equivalence and old-save placement checks remain green. No new building family is required for P0.

## LOCKED OWNER DESIGN — Seven combat moves (2026-10-11)

**Decision: ACCEPTED AND LOCKED as a combat design specification.** Do not reopen the naming, roster or intended mechanics without another owner request. **Approval of the design is not approval to merge or deploy, and does not imply all mechanics below are already implemented.** Keep the five old attack slots and their ids/indices compatible while engineering the complete seven-move behavior, with two existing tactical signatures converted into distinct attacks.

| # | Engineering-term move | Approved mechanical behavior |
| --- | --- | --- |
| 1 | **Punching Shear** | 1.6s circular warning, concentrated hit dealing **1.4× base damage**, exposes heartstone **2.5s** after impact; exposed core takes **+25% incoming damage**. |
| 2 | **Progressive Collapse** | **Three sequential** marked falling-rock impacts, first warning **1.7s**, each **1.4× base damage**. Then **up to two active**, collision-bearing temporary stone supports, each **9s lifetime**. If capped, retire older supports before adding new ones. Preview their future positions, protect exits and paths to Dara, respect all trap/collision rules; no permanent architecture changes. |
| 3 | **Dynamic Compaction** | **1.6s warning**, then **two expanding radial waves** separated by about **0.7s**; each **1.0× base damage** plus **1.5s slow** on a landed hit. The player must have an actual dodge/crossing opportunity, with no unavoidable double-hit lock. |
| 4 | **Pile Driving** | **1.7s visible lane warning**, fast charge with **1.4× base damage**. After the charge terminates for *any reason*, open core **3s**, including an unobstructed end or collision. No stuck charges on temporary supports. |
| 5 | **Lateral Load Transfer** | **1.3s warned lateral lane**. A *stone slab/environment* moves sideways rather than Garun moving; hit applies **0.6× base damage** and pushes ~**100 world units** laterally. The slab cannot penetrate walls/supports, and the lane must have an escape. Replaces, rather than merely renames, the existing Quarry Shift shove behavior. |
| 6 | **Passive Earth Pressure** | **1.65s warned frontal sector**, ~**195-world-unit reach**, **0.1× base damage** and ~**95-unit knockback**. Defensive response to melee pressure; derived from, but replaces the fantasy-named Faultline Brace tactic. |
| 7 | **Mass Underpinning** | **1.8s telegraphed call** for real Ogre wardens. **Normal: maximum 3** active. **TRUE: maximum 6**, with **two elite ringleaders**, preserving species, existing fight scheduling and current **7s Normal / 5.5s TRUE** summon cooldowns. |

**Unified rules:** Existing exposed-core damage bonus **+25%** and vulnerability windows **2.5s / 3s** are sacred contracts. Garun retains his normal guard force and his six-unit TRUE warband. Keep a **single at-50%-HP strategic escalation** that favors Progressive Collapse and Dynamic Compaction rather than creating a new save-sensitive phase. No untelegraphed collision walls under the player's feet; no inaccessible mine exits or Dara; no permanent/saved construction props; no change to the public boss name, internal `mine` identity or historical clear flags. Before aggro, he follows his inspected-point Mine patrol; during aggro, combat logic replaces his patrol.

**Implementation state on this draft:** The five persistent attack slots and two tactical-AI signatures now implement all seven named behaviors. Progressive Collapse has three sequential warned impacts and nonblocking advance construction markers, followed by a maximum of two temporary solid Mine supports with nine-second expiry, path validation and save exclusion. Dynamic Compaction emits two slowing ring hazards separated by 0.7 seconds. Lateral Load Transfer has a separate 1.3-second horizontal lane warning and 0.6× sideways slab sweep, rather than the old single-target shove. Core openings, Ogre caps, Passive Earth Pressure, inspection patrol and gallery remain. **Focused Node live tests passed on run #38144318147**. Full suite, protected source revision, desktop/phone browser tests and exact candidate SHA are still release gates. No automatic merge/deploy.

## Engineering-term combat names — labels applied

Garun announces authentic civil and structural engineering language with absolute seriousness. The humor comes from the technical accuracy: an unsuspecting player hears threatening incantations while an engineer recognizes a construction-site vocabulary lesson.

| Move slot | In-game attack name | Engineering reference |
| --- | --- | --- |
| Stone Slam | **Punching Shear** | Concentrated load punches into supporting material |
| Rockfall / temporary supports | **Progressive Collapse** | Local structural failure propagates; the temporary supports are his improvised remedy |
| Shockwave Rings | **Dynamic Compaction** | Heavy impacts and stress waves densify ground |
| Wall Rush | **Pile Driving** | Delivering impact to install structural piles |
| Stonebound Call | **Mass Underpinning** | Strengthening an existing foundation with new support |
| Quarry Shift tactical move | **Lateral Load Transfer** | Redistributing sideways loads through supporting members |
| Faultline Brace tactical signature | **Passive Earth Pressure** | Soil resistance when a wall pushes into retained ground |

The **seven named moves now have distinct mechanics**. Five keep their original stable boss attack indices (with approved targeted enhancements), while Lateral Load Transfer and Passive Earth Pressure use the tactical slots. No eighth ability is introduced: temporary construction is the outcome of Progressive Collapse.

## Engineering and QA handoff

The combat design is implemented in the current draft: boss-combat.js handles compound attacks, predicted construction positions and supports; engine.js handles lateral movement and off-combat inspection; combat.js handles slowing rings; rules.js contains the attack parameters; save.js excludes temporary structures. The original 18 Mine traps, 18 guards, boss family, keyed Dara and early TRUE/Awakening are preserved.

**Construction:** Nonblocking floor markers use existing mine-old-markings art and can expire without becoming walls. At the last Progressive Collapse impact, valid markers are replaced by up to two solid mine-supports props with nine-second lifetime and collision radius 24. Existing walls are replaced by the next construction cycle rather than accumulated indefinitely. A candidate is rejected if it overlaps traps, occupants or essential routes; pre-existing gated paths remain gated. Zone exit, boss defeat, peace, expiry and save snapshots clear transient objects.

**Tactical slab:** A line telegraph warns across the target's lateral axis for 1.3 seconds. The tactical resolver applies a 0.6× hit to each party member caught in the lateral lane. Surviving targets can be moved up to 100 world units sideways only if the movement segment is traversable, not through existing or temporary walls. The slab is an ephemeral attack, not a new permanent environment asset.

**Verification:** Focused tests/colossus-biography.test.cjs and tests/garun-mechanics.test.cjs passed in GitHub Actions run #38144318147, including Normal, early TRUE, Awakening, the six-Ogre warband, the keyed Dara, three impact stages, two slowing hazards, lateral displacement, the 18 guards/traps, previews, inspections, save exclusions and unconditional core vulnerability. The entire repository suite, protected hash fixture and phone/browser graphics remain release gates. Do not claim a merged or deployed release until further approval.

## Compatibility

Keep Stone Colossus public name, `mine` boss family, `ridge` Master of Coin, quests, crowns-only economy, Dara's key and service, 18 guardians and original trap contracts, existing roads and monster habitats, original layouts, and early TRUE/Awakening already-earned victory flags. Reconcile references to Kharun and the hostile-friend premise throughout the #242 draft; no new species, fourth class, stage or politics branch.

## Review and release gate

Owner has given concrete direction for character, economy, council role, collections, captivity tension, and aesthetic inspiration. Detailed attack-building / roaming implementation remains to be validated separately on this draft before it can claim an accepted encounter redesign. No merge, no deployment.
