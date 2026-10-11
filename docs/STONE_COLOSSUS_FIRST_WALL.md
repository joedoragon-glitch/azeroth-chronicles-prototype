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

## Engineering-term combat names — proposed and applied

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

All **seven labels** are text-only changes, with no timing, coefficient, shape, health, summoning or AI change. The technical move names replace the earlier fantasy names in `data.js` and tactical definitions in `rules.js`, keeping the underlying attack slot indices stable. No extra attack is added: `Raise the Works` is the temporary-support consequence of Progressive Collapse.

## Combat and roaming audit — author has permitted mechanical innovation

The current fight has five authored attack slots: Stone Slam (circle; 1.6s warning and 2.5s exposed core), Rockfall (three circles; 1.7s), Shockwave Rings (1.6s), Wall Rush (warned 1.7s lane and **unconditional 3s exposed core**), and Stonebound Call (Ogre summon, six elite allies in TRUE). Its other tactical moves are Quarry Shift shove and Faultline Brace sweep. These are serviceable but not strongly distinctive of an *architect who builds during a fight*. Boss attack selection is weighted across existing shared shapes, so merely renaming those attacks does not satisfy the owner's new direction.

**Recommended signature, separate engineering gate:** **Raise the Works**: Garun telegraphs and erects **two temporary low geometric barricades** in prevalidated arena cells; they are short-lived, destructible or expire automatically, and must leave an entrance-to-boss-to-Dara route and a counterplay lane. A preview must distinguish unbuilt and solid states; the barricades must not invalidate existing trap cues. Do not use persistent world props or mutate authored map walls as an easy shortcut. Structures must be transient combat entities excluded from save or safely reconstructed. Avoid a full building system or Fortnite-scale freedom. One alternate: **Inspect and Repair**, a non-aggressive visible pause near a damaged support before battle, followed by walking away from it; do not create a stealth encounter or let the boss become unreachable.

**Roaming is a separate risk** from attack geometry. Existing code supports captain patrol routes, but that cannot be assumed safe for a dungeon boss. A boss-moving inspection loop must be bounded to existing traversable Mine galleries, stay out of dangerous trap footprints, never drag a TRUE or keyed encounter through the captive, preserve combat leashes and target/recovery rules, and stop deterministically on aggro. The boss spawn and late-TRUE reentry must remain compatible with saved coordinates and historical clears. Prefer a conservative loop with 2–3 curated inspection anchors, wait/inspect animation, and guaranteed fallback home. Do not recycle field-captain patrol code blindly.

**Testing gate for an actual structural attack:** Normal/early TRUE/Awakening live attack timings, 18 original traps, all guard species/caps, accessible boss/Dara/exit under each barricade placement, line-of-sight and warning fairness for Mage/Ranger/Soldier groups, save/reload during and after constructions, death/peace transitions, phone WebKit and desktop Chromium screenshots, old saves, and the protected simulation/performance checks. The author allowed redesign, but this document does **not** claim the two new mechanics already work. They should be implemented only in a separately tested encounter slice rather than slipped into narrative strings.

## Compatibility

Keep Stone Colossus public name, `mine` boss family, `ridge` Master of Coin, quests, crowns-only economy, Dara's key and service, 18 guardians and original trap contracts, existing roads and monster habitats, original layouts, and early TRUE/Awakening already-earned victory flags. Reconcile references to Kharun and the hostile-friend premise throughout the #242 draft; no new species, fourth class, stage or politics branch.

## Review and release gate

Owner has given concrete direction for character, economy, council role, collections, captivity tension, and aesthetic inspiration. Detailed attack-building / roaming implementation remains to be validated separately on this draft before it can claim an accepted encounter redesign. No merge, no deployment.
