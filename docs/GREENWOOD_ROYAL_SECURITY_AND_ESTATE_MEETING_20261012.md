# Greenwood Vale — royal security, decommissioning and winter-estate appointments

**Owner-approved royal meeting, 12 October 2026. DESIGN/CANON RECORD ONLY — NOT GAMEPLAY IMPLEMENTATION.**

This records the Dark Lord's decisions for **Thornfang, Scornfang and Lifebinder** during the second administrative meeting. It is a follow-up to, **not a replacement for**, draft PR #288 (Cindermaw/Dreadmaw). Preserve the existing Greenwood/Forest Crypt foundation, approved unmerged worldbuilding and historical saves. No implementation, merge, asset deletion, deployment or CI certification is authorized by this record.

Related: master #232; five-region continuity #235; Greenwood #236; Lifebinder #237; boss/captain reconciliation #247; audit #251; unmerged PRs #230 (boss identities and estate), #231 (captain endurance), #258 (Lifebinder identity), #288 (separate royal meeting). **Approval here is authorial design approval, not a statement that the approved changes exist in main or have passed gameplay tests.**

## 1. Canon hierarchy and protected regional identity

- **Published baseline:** v0.9.0 on main; Greenwood Vale is a rural wooded/farming **level 1–4** province, with Millhaven as the beginning town, Orchard Hamlet, the working mill, local Goblin and Skeleton communities/territories, Thornfang's den and Treasury, and the Forest Crypt.
- **Unmerged, intended work:** #230 creates the warmer unfinished winter-estate environment and approved Lifebinder combat/attendant details; #258 records Lifebinder's self-aware free-willed skeletal preservation and save-safe public name; #231 gives Scornfang the **260 base-HP** budget and enhanced Scavenger's Nerve/pursuit/Briar Pot. **Keep all three branches intact and reconcile their overlapping files deliberately.**
- **This meeting:** approves the Greenwood role/route, named abilities and new combat design below. They **supersede only the explicitly identified older names or behaviors**; unrelated published and unmerged mechanics, regional fixtures, UI, art, music and encounters remain protected.
- The Dark Lord governs all five regions but **Greenwood is not a new national administrative capital, industrial center, or global security apparatus**. The local exception is explained by the Dark Lord's personal winter retreat and a particularly powerful **assigned** guard.
- **Encounter freedom is essential:** the player may choose Thornfang or Lifebinder first; Scornfang may even be encountered/defeated earlier. Never add a forced quest dependency/order between them simply to explain the story. Preserve both independently rescued specialists, normal/TRUE progression, encounter accessibility, and current Crown Peace/finale compatibility.
- Do **not** change Thornfang's **1,200 Normal base HP** (stronger than nearby-region Mirejaw's 1,100), Lifebinder's **650 Normal base HP / 16 damage / level 3**, Scornfang's approved **260 base HP** under #231, or other approved boss/captain base statistics. TRUE, nighttime/Nightmare, encounter-stage, save and other global modifiers must still derive from the existing system rather than be silently flattened or double-applied.

## 2. Thornfang — externally assigned estate security

### Identity and job (approved)

Thornfang is **not native to Greenwood Vale**. The Dark Lord assigned him there from **an as-yet-UNSPECIFIED place elsewhere** to secure the forest approaches, the region's existing monster settlements, and especially the Forest Crypt construction/renovation of the Dark Lord's private winter residence. He is a physically formidable **field boss**, not a new dungeon successor, a minister, a natural hometown predator by default, or a ruler of all Crown security. His 1,200 HP despite the rural early region is a deliberate character/worldbuilding distinction, not something to nerf or normalize.

- Replace the previous static-at-den behavior with **actual navigable overworld patrol**, starting/returning to his existing den/field compound and reaching the **existing Forest Crypt exterior entrance**, also regularly checking **all established Greenwood monster living locations** (including the Goblin roadside camp and Skeleton watch/settlement, with other approved habitat anchors resolved from live world data).
- Preserve the **actual den** near (760, 1750), **existing Crypt exterior entrance** near (2150, 2100), established **Goblin camp** near (520, 1050) and **Skeleton watch** near (1820, 2260) as candidate anchors from main. Coordinates are *reference locations, not an approved hardcoded straight-line movement list*. Determine legal reachable standing positions, bridge use, a practical round trip, and site coverage from current road/collision/navigation geometry before implementing.
- **Never patrol into Millhaven**, the starting town. Do not draw a route through buildings, impassable rivers, the interior dungeon, other walls or important player-safe starting space. This is exterior patrol, **not** movement into a side-map via an overworld coordinate.
- Patrol must be interruptible: the player can encounter and fight him **along his route**, choose an advantageous location, disengage, or fight another objective first. Preserve line-of-sight, chase/leash behavior, combat warning integrity and safe restoration of his normal patrol on reset. No instantaneous cross-map teleport, impossible home return, permanent lock-in, or vanishing boss.
- **Mira the Village Instructor stays in her original cage at the field compound.** Do **not** invent a travelling cage or escort. Defeating Thornfang anywhere on his authorized patrol must still give the existing key/rescue entitlement so the player can return and free Mira; existing rescue/service/quest and old-save facts are preserved.
- Preserve Thornfang's original field-Treasury association, all rewards, existing guardians, normal/TRUE encounter and TRUE availability/reappearance behavior. A patrol must not break the specific two-normal-defeat/TRUE field encounter chain or an existing-save state.
- The established roaming **Cinder Warlord field captain** provides a precedent for real route navigation, but its different territorial/combat rules cannot be copied blindly. Thornfang is a boss with a separate leash, encounter respawn and TRUE identity.

### Six approved names, unchanged mechanics

All names are **authentic professional security/access-control or protective operations terms** intended to sound like formidable attack names to newcomers. This is **strictly a thematic rename** of his four existing regular attacks and two existing tactical rogue actions; no damage/HP/range/count/phase/cooldown/VFX geometry changes were approved.

| Existing move / slot | Final approved name | Protected behavior |
| --- | --- | --- |
| Bite (regular 1) | **Use-of-Force Continuum** | Existing short warned frontal bite/arc |
| Pounce (regular 2) | **Interdiction** | Existing warned landing/leap and its actual recovery contract |
| Root Line (regular 3) | **Anti-Passback** | Existing marked narrow line and slow |
| Den Howl (regular 4) | **Response Force** | Existing bounded wolf-pup summon |
| Pack Feint (rogue basic) | **Counter-Surveillance** | Existing tactical reposition/dash |
| Packbreaker Howl (rogue signature) | **Crowd Dispersal** | Existing warned local forced scatter, including its 0.6-second transient control behavior |

Retain current attack/VFX/audio **stable internal family and slot IDs**, and update player-facing labels consistently. New names must not leak mechanically hidden information earlier than approved telegraphs.

## 3. Scornfang — Greenwood decommissioning and salvage lead

### Identity, promotion and responsibilities (approved)

**Scornfang is a Goblin**, a distinct **ranged/slinger Treasury captain**, and Thornfang's disciple; he is **not a wolf**. He is promoted to lead Greenwood's local **site decommissioning, remediation, asset recovery and relocation logistics** for the winter-estate conversion. He is not in his post merely because of Thornfang: his expertise and capacity to keep Thornfang's security activity from interfering with Lifebinder's ongoing construction are part of his purpose.

- Knowledge magically bestowed in the fictional meeting: **site decommissioning, remediation, mortuary affairs, salvaging/materials recovery, adaptive reuse, and relocation logistics**. This is *fictional expertise*, not automatic permission for new player skills or a management/economic subsystem.
- **His existing Thornfang's Treasury becomes an additional depot of salvaged/relocated assets from the old Forest Crypt.** Store appropriately retired funerary furnishings, obsolete equipment, historic architectural pieces, reusable stonework, old construction materials or verified superseded visual props. Audit #230's Crypt/estate environment and active art references **before** deciding what is truly unused; reuse actual unused game assets where safe **without deleting source artwork, breaking procedural fallbacks, or accidentally moving active/required objects**.
- Keep the Treasury's **two original player-collectible caches**, guard and captain encounters, ingress/egress, pathing, treasure rewards, quest completion, legacy layouts and saved collected-cache identities. Salvage dressing is **not** new collectible loot, new rewards, or permission to duplicate caches.
- Coordinate with Lifebinder rather than seize his estate authority. **Self-aware life-bound Skeletons are persons**, not scrap or corpses: any transfer concerns their own residence/agency; mortuary handling of *unoccupied* human remains is separate. Preserve historic objects needing protection; do not assume all tomb props must be removed.
- **His precise formal royal title/ministerial rank was not explicitly chosen**; the **promotion and functional assignment are approved**. Do not silently confer a new kingdom-wide ministry or transfer Thornfang's ownership of the Treasury. Name the organizational office later if the Dark Lord wishes.
- Retain **260 base HP** from unmerged #231, its one-time historical-save migration and correct encounter modifiers, approved 55% phase threshold, 100-unit Briar Pot footprint and 20%/2.5-second post-charge pursuit. The existing two rogue maneuvers remain functioning and, for now, retain their own names.

### Five approved regular moves and one phase

| # | Final approved name | Relationship to #231 | Final conceptual behavior |
| --- | --- | --- | --- |
| 1 | **Selective Deconstruction** | Reworks/renames Hookfang Rush | Warned straight-line charge, original hit contract; preserve approved **20% post-charge pursuit for 2.5 seconds** |
| 2 | **In Situ Stabilization** | Reworks/renames Briar Pot | Thrown binding compound produces existing damaging/slowing persistent area, approved **100-unit radius** |
| 3 | **Particulate Resuspension** | Reworks/renames Pocket Sand | Existing short damaging/slowing cone; professional particulate-dust framing |
| 4 | **Cradle-to-Grave Tracking** | **New regular move** | Clearly marks a chosen target with a numbered tracking tag, then launches a **short sequence of aimed, dodgeable sling shots**; provide usable warning/counterplay |
| 5 | **Exclusion Zone** | **New regular move** | Scornfang deploys several **separated, temporary danger patches** representing hazardous-worksite markers; clear navigable escape gaps and bounded lifetime |
| Phase | **Final Clearance Inspection** | **Renames** #231 Scavenger's Nerve | Triggers **once at 55% HP**; preserve its movement/aggression/attack-rate effects; **no additional HP, heal or invulnerability** |

Scornfang retains his separate existing rogue actions, **Pocket Trick** (snare) and **Bait-and-Switch** (slow/sidestep), without unrequested rework. Five regular moves are **not** seven regular moves plus rogue skills. For the two new regular moves, exact damage coefficients, hit radii/timing, cooldown cadence and visuals remain **engineering specifications to design under owner approval and beginner readability**, not numbers to invent. Do not retune other captains or shared rogue AI to make the two moves fit.

## 4. Lifebinder — mortuary preservation and winter-estate stewardship

### Canon and qualifications (approved)

- **Lifebinder** is the single existing level-3 Forest Crypt dungeon boss (stable internal family **crypt**), previously displayed as Crypt Guardian. **No additional Great Lifekeeper or second boss.**
- He was one of the Dark Lord's **five former adventuring companions**, an oathwright/caretaker of the fallen, now an independently minded conscious skeletal being. He preserved dead or dying individuals as **self-aware Skeleton people**, with their own memory, personality and will: **not normal healing, enslaving corpses, obedience magic or instant mass-raising**. Keep the specific approved #258 biography, limitations and narrative clues; Lantern Wraith origins are **not** automatically his doing.
- His two magical professional qualifications, exactly as approved, are **Mortuary Science and Thanatology** and **Architectural Conservation and Adaptive Reuse**. These combine his concern for preserving the fallen with his present office as trusted **caretaker / conservation-and-adaptive-reuse project overseer** of the Dark Lord's unfinished **private winter residence**.
- Preserve the inherited estate vision (older memorial/crypt heritage and named remains, warm Crown guest rooms, partly unfinished works, six-place winter gathering), **Borin's compelled construction/smith work and original rescue gate**, and the owner's personal retreat separate from the Dark Crown political throne.
- Scornfang's salvage activity and Thornfang's exterior security are **supporting responsibilities**, not a transfer of Lifebinder's interior estate supervision.
- Keep his **650 Normal base HP, 16 base damage and level 3**, intended forgiving introductory dungeon experience; ordinary TRUE form **1,170 base HP** before global modifiers. Retain quest order freedom, stable IDs/save flags, existing normal/early TRUE/Awakening access, voice/art identity and relevant existing scene/sprite rules.

### Six final approved regular moves (owner corrections supersede interim proposals)

| # | Final approved name | Function and approved mechanic |
| --- | --- | --- |
| 1 | **Thanatopraxy** | Reworked Binding Sweep: **warned frontal arc** with modest damage and **light backward knockback**; no stun/prolonged lockout |
| 2 | **Stay Alive** | Retained funny original name (owner explicitly rejected the proposed "Taphonomy" rename): **three visible sequential bone projectiles**, dodgeable and blocked by solid pillars; preserve existing windup baseline |
| 3 | **Clerk of Works** | Renamed **Call the Attendants**: **keep the summon skill**. Each Normal cast summons **three junior Crown-style estate attendants** with #230's **twelve concurrent Normal safe ceiling**; TRUE remains the separately approved **six-member (four minion + two elite) warband**, preserving source-specific cap/role logic |
| 4 | **Groundwork** | Original name deliberately restored (owner rejected interim "Underpinning"): **four clearly marked ground eruptions in two successive pairs**, rather than #230's four simultaneous resolves; existing persistent-hazard intent and safe paths remain |
| 5 | **Algor Mortis** | **New:** warned expanding supernatural cold wave producing **brief Slow but no direct HP damage**, with readable travel/escape |
| 6 | **Anastylosis** | **New:** visible temporary assembled-stone defensive treatment, **20% damage reduction lasting FOUR (4) seconds** (owner corrected the former 2 seconds). **No invulnerability or lasting blocking walls** |

Two existing rogue/tactical moves get *names only* changed, retaining their distinct old mechanics:

| Existing rogue action | Final approved name | Preserved action |
| --- | --- | --- |
| Bone Hook | **Disarticulation** | Short defensive shove |
| Grave Threshold | **Repointing** | Warned slowing/binding control |

**Important overlap:** #230 implements four **simultaneous** Groundwork marks and its four-attack scheduler; this meeting approves two **successive pairs** and **six regular** moves, plus renamed separate rogues. #258 intentionally keeps the baseline three Skeleton summons in its isolated story-only branch; the owner's combined target **keeps #230's approved Crown-attendant design and summon cap while retaining #258's independent life-bound Skeleton lore**. Resolve these explicitly rather than taking one draft as sole truth. The new wave/defense attacks require actual scheduler, VFX/audio, resolver and save/reset work; renaming data alone does not implement them.

Six regular moves must **remain manageable for a beginner**: bounded timings and non-overlapping unavoidable damage; avoid forcing level-specific skills, adding new boss phases, HP buffs, or requiring either Thornfang or Scornfang to be beaten first. TRUE and Awakening may use the game's existing scaling/warband rules, not invented new versions of this fight.

## 5. State/dependency ledger and implementation safeguards

| Surface | Shipped main / existing foundation | Unmerged intended work | Latest owner-approved Greenwood requirement | Gate |
| --- | --- | --- | --- | --- |
| Thornfang role/patrol | 1,200 HP fixed field boss at original den, nearby fixed Mira cage, local wandering only | None of #230/#231/#258 supplies this approved cross-map patrol | Assigned out-of-region estate/monster-settlement security; navigable overworld visits; Millhaven off-limits; static Mira cage | Real-path patrol, combat on route, quest/rescue, reset/TRUE/historical saves |
| Thornfang attacks | Four existing regular + two separate rogues | Existing mechanics may have other VFX/audio guard coverage | Six exact real-security labels, **no ability retune** | Normal/TRUE attack identity, no broken telegraph, stable keys |
| Scornfang role/treasury | Goblin Treasury captain, two existing quest caches and interior guards | #231 captain endurance & combat changes; #230 estate scene conversion | Promoted local decommissioning/remediation lead; Treasury holds verified retired Crypt assets | No loot/collision/save/artist-reference loss |
| Scornfang combat | Three regular + phase + two rogues | #231 **260 HP**, 55% phase, widened pot, pursuit; old-save upgrade | Five named regular, two new mechanics and renamed phase; rogue unchanged | Real scheduling, range/cooldown balance, no global rogue edits |
| Lifebinder identity | Internal crypt family, 650 HP level-3 dungeon with Borin and legacy naming | #258 story, independent skeleton agency and safe name migration | Full dual profession and trusted estate role retained | Compatible quest/TRUE/save/narration and no second boss |
| Lifebinder combat/estate | Four regular moves, Skeleton summon, older Crypt appearance | #230 attendants, warm estate, four marks and extra counterplay | Six final move names/mechanics, four patches in two pairs, 4-second Anastylosis, separate rogue renames | Combined #230/#258 integration with real AI attack and scene tests |

### Engineering/QA requirements before any later authorized implementation

1. **Travel/pathing:** derive Thornfang's patrol stops from already-existing den, monster habitats and Forest Crypt **exterior** entrance; test every leg using the real collision-aware navigator including bridge crossings and reset/home return. He never crosses into Millhaven/start town or enters an instanced interior. No ghost-walking, stuck paths or sudden teleports.
2. **Fight and rescue:** players may fight Thornfang at any reachable leg; his key/rewards and **stationary Mira cage** remain correctly findable and usable. Confirm normal, two-defeat field TRUE transition, early TRUE where applicable, defeat/resurrection state, retreat/leash, all three classes, solo/party, original quest progress and historical saves.
3. **Treasury inventory:** inventory original #230 and main Crypt decorative props and currently registered art/visual assets to identify actual retired content before reuse. Reuse by **reference**, not destructive moves/deletions. Keep active copies and source assets, and verify Scornfang Treasury's two exact cache records, portal/exit, wall collision, captain state and old-save versions. Salvage props yield no extra loot/rewards.
4. **Scornfang skills:** preserve exact #231 balance, HP migration and two rogue moves; prove each of five regular moves is actually selected, warns/resolves/hits, stays dodgeable, cleans up on reset/death/save and works on desktop/phone. Five-slot scheduling cannot silently remove normal goblin ranged role.
5. **Lifebinder skills:** six regular moves must execute through **real tick/AI** and render/audio paths, not just renamed descriptions. Test successive two-pair Groundwork and nonoverlapping escapes, Pillar collision for Stay Alive, Clerk of Works 3-at-once Normal summons and 12-living safety ceiling, separate TRUE warband, non-damaging slow wave, exactly 20% reduction for 4 seconds, cooldowns and phase/reentry cleanup. Keep easy first-dungeon experience and Borin's rescue.
6. **Continuity:** preserve free-willed Skeleton identities, named original cave/estate spaces, no invented forced undead relocation; remain consistent with #230/#258, #231 and #288 without replacing any branch or importing obsolete naming/biography over newer approvals.
7. **Release discipline:** follow #232's **single consolidated integration** and explicit owner gate. Before any selected gameplay publication: exact-head Node/build/format, browser desktop/phone Chromium/WebKit, save migrations, route/encounter tests, PWA/offline/asset caches, sprite fallback, audiovisual hitbox/telegraph matching, a second independent scope audit and rollback reference. Never claim these passed because the narrative document exists.

### Deliberately not settled by this meeting

- Thornfang's **origin region or personal recruitment history** beyond “assigned from elsewhere”; exact patrol stop coordinates/order, dwell times, patrol rate and exclusion buffers until real-world paths are checked. No new extra-region home or area.
- Scornfang's **formal office title/rank**, exact salvage material list pending actual unused-asset audit, and precise statistics/cadence/cosmetics for the two new attacks; no new regional economics, national ministry or collectible resource subsystem.
- Exact balancing/cooldown/visual recipes for Lifebinder's new abilities beyond the specified mechanics, and how best to preserve/upgrade #230's existing four-slot scheduler. This is not permission to simplify the accepted mechanics into cosmetic renames.
- Completion dates, release version, merge authorization, new faction/biome, new boss/specialist, new player-facing class or new quest requirements.

**Status as of this document:** owner decisions recorded for planning; **no gameplay code, asset, save, quest, test or release changes** and no approval to merge/deploy. Preserve unmerged work on its current branches.
