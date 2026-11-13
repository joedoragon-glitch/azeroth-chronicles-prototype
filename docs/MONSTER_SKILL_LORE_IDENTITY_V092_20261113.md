# Enemy skill identity — lore and authority audit (v0.9.2 design draft)

**Status:** 13 November 2026, source-level design reconciliation only. **No game names, mechanics, effects, saves, translations or deployed build changed by this document.** Owner direction and implementation scope: [#870](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/870). Baseline inspected: `main@66cbf47d251ba3213a61f21e5a3eb1abf57f26df`. Existing save-integrity candidate #864 and tutorial candidate #868 are unmerged and own overlapping combat-engine work. This document is a proposal, **not owner acceptance of the individual skill names**.

## What the player ought to learn from a skill name

The purpose is not to make every attack sound elaborate. A named ability should reveal something true about **the particular actor**: their life, work, affiliation, leader's methods, or a training tradition that is already supported by canon. Begin with the leader and the creature's established story **before** looking for a metaphor in the attack geometry. The result still needs to tell the truth about what happens mechanically, fit in a mobile cast label, and sound natural in English and Spanish.

A generic species may rightly use an instinctive physical description. A trained subordinate at a guarded post should usually do more: a junior form of the commander's doctrine, a task learned in service, or a response shaped by defending that location. This is not achieved by automatically prepending a boss's name. A guard is not necessarily a student; a worker can be an unwilling subordinate; a wild animal is not automatically a member of a provincial army.

**Content authority:** `src/prototype/data.js` boss histories and attacks; `src/prototype/archive.js` Keeper histories and offices; `src/prototype/rules.js` enemy/captain/companion skills and worksite details; `docs/MONSTER_ATTACK_V09_HOUSEKEEPING.md` existing read-only inventory; `docs/ROGUE_CHARM_HERITAGE_589.md` the existing friendly heritage decisions; `docs/MONSTER_FORTS_TERRITORIAL_AUDIT.md` independent territorial homes.

## Greenwood: the Lifebinder's followers (first naming pilot)

### Canon that the names must uphold

The Lifebinder specializes in **mortuary science, thanatology, architectural conservation and adaptive reuse**. He binds the dead into **aware, enduring skeletons**, not returned living persons. The skeletons **came with him** to convert the Forest Crypt into a partially built winter residence. **They were not raised from the graves there**. They have names, loyalties, reservations about the conversion, and limited freedom to refuse paid work. The site has receiving areas, tools, pay records, guest rooms, an ossuary inherited from its prior use, scaffolding and workstations. Captive smith Borin works there.

That distinction is decisive for names: using "ossuary" as the skeletons' defining identity tells the player about **the building they occupy**, not who the workers are or what the Lifebinder taught them. An anatomical, conservation or construction technique can reveal their genuine milieu without claiming they were resurrected from this crypt. Likewise, their combat training should not be invented as **Mira's instruction**: Mira is captive with Thornfang's patrol, which is a different arrangement. The Lifebinder already supervises his own followers. Marshal Veyra's general army training is also separate.

The master's already-authored vocabulary offers a particularly strong model:

| Existing Lifebinder action | Story/discipline conveyed | Treatment |
| --- | --- | --- |
| **Excarnation** | Actual mortuary procedure | Keep |
| **Stay Alive** | Endurance, care and an ironic name for his condition | Keep |
| **Clerk of Works** | Organized construction labor | Keep |
| **Differential Settlement** | Structural engineering | Keep |
| **Algor Mortis** | Postmortem physiology | Keep |
| **Anastylosis** | Architectural reconstruction using original material | Keep |
| **Disarticulation** / **Pressure Grouting** | Anatomy / conservation as his existing tactical language | Keep |
| **Reconstitution** | Restorative support | Keep |
| **Little Lifebinder** pet: **Stay Alive** / **Algor Mortis** | Truthful miniaturized boss repertoire | Keep |

### Exact existing skeleton actor names (source verified, not runtime retested)

| Actor / ability owner | Existing live name | Executed effect | Disposition, *candidate* replacement if needed |
| --- | --- | --- | --- |
| Ordinary melee (species Rogue tactic) | **Bone Hook** | Single-target shove | **Review: Anatomical Leverage** — a control technique learned in a mortuary/conservation culture, not a generic bone pun |
| Ordinary ranged (species Rogue tactic) | **Bowguard Withdrawal** | Warned defensive withdrawal | **Review: Controlled Relocation** — carries the care-for-materials / safe relocation idiom; needs gameplay-label readability review |
| Ranged skeleton restorative support | **Bonebind** | Heals eligible wounded allies | **Review: Binding Maintenance** — points to the Lifebinder's actual sustaining bond, **not** resurrection |
| Melee Ringleader reactive signature | **Ossuary Rattle** | Warned short sweeping displacement | **Replace candidate: Structural Shear** — shifts identity toward professional engineering; alternative **Load-Bearing Excision** bridges anatomical and structural vocabulary, pending owner preference |
| Ranged Ringleader reactive signature | **Bone Archer Pinning Volley** | Warned area **bind/Slow**; not a simulated multi-arrow projectile volley | **Replace candidate: Conservation Perimeter** — named for actual estate defense and truthful hold-the-boundary effect |
| Charmed Skeleton native and Skill-2 elite | Names above are reused from hostile tactical profiles in `party.js::charmedCompanionSkill` | Friendly bounded native/elite effects | **Use the same accepted name**, not a second unrelated friendly title. Training gates and individual Mastery unchanged |
| Charmed Skeleton third heritage | **Disarticulation** | One-target Lifebinder-derived shove | **Keep**; it already announces the real relationship |
| Basic melee swing / bow projectile | No separate special title | Melee attack / physical arrow | **Keep as basic**; do not invent a special ability just to fill the glossary |

**New proactive Greenwood pilot under #870 — *do not* mistake these for implemented skills:**

| Actor | Working name to workshop | Narrative clue and mechanical constraint |
| --- | --- | --- |
| Ordinary skeleton swords | **Sectioning Stroke** | A modest deliberate cut reflecting anatomical training; not a bonus hero-level class skill |
| Ordinary skeleton bows | **Survey Stake** | Aimed ranged pressure reflecting estate boundaries and surveying; must resolve through real LOS/projectile rules |
| Melee skeleton Ringleader | **Transverse Section** (normal / charged) | Distinctive multi-angle anatomical/structural technique; one ability, two readable executions |
| Ranged skeleton Ringleader | **Measured Salvo** (normal / charged) | Assessed firing lanes and worksite perimeter; a *real* volley if named salvo, unlike the existing area-bind signature |

**Editorial caution:** even names with appropriate technical vocabulary can be unsatisfying if they merely sound like jargon. The final name needs to be a piece of storytelling, not a glossary exercise. In particular, choose between the two melee-Ringleader reactive options after verifying actual sweep visuals and player-facing clarity. Avoid translating medical/engineering terminology literally into awkward Spanish. The owner explicitly offers creative feedback when a true authorial decision is needed.

### The immediate bug/quality distinction

This audit establishes a **confirmed naming/lore mismatch** in the existing Skeleton Ringleader presentation, **not a confirmed broken combat algorithm**. `Bone Archer Pinning Volley` is also a stronger semantic accuracy finding because the signature code resolves an area bind; a name promising projectiles can mislead players about counterplay. All other skeleton names remain review candidates. No change to cooldown, hitbox, Slow, target cap, movement, guardian rank, original boss kit, third heritage, Orin promotion, pet skills or skill unlock follows from a better title.

## All existing monster factions: species-wide skill inventory

These are current `rules.js` *named* species tactics (conditional Rogue melee/ranged), melee/ranged Ringleader signatures, ordinary enemy restorative technique and the pre-existing Charmed heritage skill. **This is a naming inventory, not a claim that every actor can simultaneously perform all five.** An actor may be melee-only, a skill may be gated/conditional, and Charmed heritage has its own legitimate unlock. Bold descriptions after the table identify the connection that must govern any changes.

| Species | Species Rogue melee / ranged | Ringleader melee / ranged | Hostile healer | Charmed heritage | Primary naming finding |
| --- | --- | --- | --- | --- | --- |
| **Goblin** | Blinding Dust / Blinding Dust | Gang Boss Smoke Trick / Slingmaster Split Screen | Scrap Poultice | Dust Entrainment | Blinding Dust is legitimate innate craft; **Gang Boss** risks describing Scornfang's paid reclamation crews as a generic criminal gang. Role-specific salvage/abatement language is stronger for the actual Treasury |
| **Skeleton** | Bone Hook / Bowguard Withdrawal | Ossuary Rattle / Bone Archer Pinning Volley | Bonebind | Disarticulation | Main Greenwood pilot above; link techniques to Lifebinder's actual dual profession |
| **Mireling** | Bog Tangle / Retreating Bog Spit | Broodbank Coil / Broodspit Barrage | Bog Balm | Hydraulic Jump | Wetland instincts are valid; Mirejaw's **hydrology** is the deeper source for named organized defenders |
| **Reed beast** | Ordinary fallback *Desperate Feint* / Reed Spit Screen | Reedquake Kick / Reedbank Mudscreen | Sapburst | Mud Pumping | Melee native profile lacks a species-specific named maneuver. Independent reed wallows must not be presented as Direjaw's employees without post evidence |
| **Wolf** | Flanking Snap / Covering Howl | Alpha Crossbite / Alpha Covering Howl | Packheart Howl | Crowd Dispersal | Natural pack instincts are fine for wild Highland wolves. Thornfang's actual professionally handled hounds warrant **K9 recall, scent and controlled-entry** vocabulary in their assigned context |
| **Ogre** | Rockside Slam / Covering Stone | Boulderhand Sweep / Stone Thrower Denial | Stone Salve | Lateral Load Transfer | Garun's **structural safety, roads, supports and workshop** are much more distinctive for his Mine wardens; do not attribute independent Ogre households to Garun's command by default |
| **Orc** | Battle Shove / Retreating Axe | Warband Shoulder Drive / Axe Thrower Crossfire | Warband Rally | Flank Command | Ashen Warlord's **occupied-road logistics, orders, patrol discipline, inspection** should inform names for his troops; Cinder Warlord's inspection details justify a narrower post layer |
| **Raider archer** | Disengaging Shot / Disengaging Shot | Bow Captain Shoulder Break / Veteran Archer Denial Shot | Field Dressing | Bad Deal | Actual Ridge/Crag payroll guards are **contracted escorts** safeguarding coin and cargo, sometimes across regions. Do not infer identity from current zone |
| **Ash beast** | Cinder Feint / Cinder Spit Screen | Ashmane Backlash / Cinder Spitter Smokecloud | Emberheart | Broodscreen Roar | Species is used under different organizations: Cindermaw's **Interior/Welfare ministry**, Dreadmaw's **Agriculture/Treasury**, and Veyrith's **air-site defenders**. Species-only labels erase the difference |
| **Crown soldier** | Shield Reposition / Shielded Backstep | Shieldwall Counterturn / Crown Volley Screen | Crown Triage | Reversal | Veyra's **drill and combined ranks**, contracted riders, regional garrisons, and the Dark Lord's own guards are distinct echelons; the actor's actual post should matter |
| **Lantern Wraith** | Fading Grasp / Spectral Backstep | Graveveil Retreat / Spectral Withdrawal | Echo Mend | Pressure Grouting | Wraiths have their **own night territory** and a documented relationship of affection with Dreadmaw; the Lifebinder-derived friendly heritage is a **thematic adaptation**, not proof of universal Crypt service |
| **Ash Stalker** | Shadow Sidestep / Shadow Screen | Nightclaw Reversal / Dusktrail Screen | Shadow Stitch | Flank Command | Night predators have their **own Cinder Hold**. A Warlord-derived friendly heritage move is an adaptation, **not evidence they are his drill-trained troops** |

Source path: `src/prototype/rules.js::enemySupportHealing.species`, `tacticalFoundation.rogueMoves`, `rogueRingleaderSignatures`, `balance.companions.charmHeritage`. Friendlies reuse those identity strings through `src/prototype/party.js`. Existing boss pets have separate authored names; don't absorb them into this table. Similarly, the two native night skills **Soul Drain** (Wraith) and **Shadow Pounce** (Stalker) remain independent and must not be reclassified as leader-taught skills.

**Interpretation:** mechanically correct *species-native* terminology is not inherently defective. The biggest gap is that *service-specific* lore is rarely encoded when a unit has an actual named post. Overwriting a global species dictionary with a treasury-themed or regiment-themed name would give *wild* animals and independent residents an invented allegiance.

## Boss and captain chains: established semantic dictionaries to reuse

These are not orders to give every guard a boss move. They are existing concepts from which subordinate technique titles can grow without contradicting the chain of command.

| Proven authority or distinct population | Established story | Appropriate subordinate vocabulary | Boundaries |
| --- | --- | --- | --- |
| **Thornfang / documented Greenwood hound patrol** | Former Crown wilderness scout; professional canine handling and scent work | Recall, tracking, entry, contact/break-contact, trained pack signals | Not a blanket explanation for wild Ironroot wolves |
| **Scornfang / his Goblin Treasury guards and salvage crews** | Thornfang's disciple, superintendent of local reclamation and salvaged building material | Selective deconstruction, survey, tagging, containment, abatement, secured storage | Goblins are mainly construction/reclamation labor, not automatically permanent winter-retreat soldiers |
| **Lifebinder / his Greenwood skeleton crews** | Mortuary science, thanatology, conservation, adaptive reuse | Sectioning, articulated leverage, conservation, bindings, shoring, settlement, protected worksite | Not raised from Crypt graves; not compelled Mira disciples |
| **Mirejaw / actual hydrological followers** | Waterways, mud, floodplain recovery, regulation of channel access | Incision, jump, current, inundation, backwater, flow | Independent fisher settlements and wildlife retain agency |
| **Direjaw / Treasury defenders** | Mud, sediment and groundwater operations | Flow sliding, silt curtain, sand boil, pumping, sediment control | Do not assign Direjaw's institutional status to every Reed beast |
| **Drowned Keeper / actual Archive defenders** | Scholar, archivist, restored records and troubled flooded Archive | Catalogues, damaged records, preservation, rebound currents, controlled water | Wraiths at their own hold are not automatically Archive custodians |
| **Ridge Tyrant / actual contracted archers** | Master of Coin; wage and transport discipline | Payroll, audit, toll, liability, protected cargo, contract enforcement | Hired escorts can appear outside Ironroot |
| **Crag Tyrant / Treasury household security** | Disciple and paid-household captain, Crown riders on armored direwolves | Store security, paid screen, audit response, vault and account custody | Crag is not a wolf; wild Highlands wolves are independent |
| **Garun / Colossus Mine Ogre wardens** | Architect/engineer, bridge builder, protective structural design and creative objects | Shear, supports, underpinning, load transfer, safe passage, construction restraint | Not every Ogre is a formal engineer or employee |
| **Ashen Warlord / deployed Orc warbands** | Military occupation, rebuilding and guarded trade | Inspection, drill, cordon, secured crossing, requisition, convoy | Preserve tension between protection and coercion |
| **Cinder Warlord / inspector patrols** | Enforces Warlord policies and mandatory overtime at work sites | Violation, compliance, inspection, orders, overtime | Roaming inspector is not provincial governor |
| **Veyrith / Abyss air-site defenders** | Loyal personal mount and prospective air marshal, fleet not yet completed | Scramble, intercept, wake, flight path, launch procedures | No fictitious active mass air force |
| **Veyra / Citadel and professional Crown soldiers** | Marshal, precise drill, uniforms, cosmetology, polished field discipline | Dress ranks, contour, formation, inspection, practiced reversal | Her influence can be army-wide; command of a specific unit needs actual provenance |
| **Cindermaw / Ministry Ash-beast troops** | Interior, welfare, infrastructure and organized Ash beasts | Cordon, safeguarding, delegation, material support, protection | Ministry operations are not the same as wild Ash-beast behavior |
| **Dreadmaw / Inner Treasury guards** | Agricultural minister, devoted disciple, custody of vault | Stores, rationing, husbandry, enclosure, grain/stock custody | His affection for Wraiths does not equal command of every Wraith |
| **Dark Lord / confirmed royal household guards** | Command, taxation, sovereignty and martial history | Decree, muster, levy, royal mandate, court defense | Royal guards must be distinguished from all generic Crown soldiers |

Some existing captain and boss skills already excel at this: Scornfang's **Selective Deconstruction, Encapsulation, Dust Entrainment**; Crag Tyrant's **Hostile Takeover, Margin Call**; Garun's **Punching Shear, Mass Underpinning**; Veyra's **Dress Ranks, Microdermabrasion**; Cindermaw's **Cordon Sanitaire, Administrative Distraint**. **Keep those where their move and story still agree.** Also keep already coherent species/charm names when no better grounded replacement exists.

## Implementation implications — not yet executed

1. **No species-to-boss lookup table.** Verify a unit's actual *authored* faction/post before selecting optional localized display text. The current `makeEnemy` model stores `species` and may store `family`, `pack`, `guard`, `crownTroop` and other flags, but not one guaranteed universal commander link. `engine.js::tacticalRogueMove` chooses most native names by `species` and ranged/melee, with an existing Crown-doctrine ancestry alternation. Do not pretend a spawn's current `zone` is sufficient evidence of employment.
2. **Prefer a controlled naming overlay to stat changes.** Preserve original skill IDs, timing, warning secrecy, hit geometry, splash/Slow, reactive AI, projectile collisions, save version and individual Mastery. For a truly universal and documented Greenwood Skeleton name, a single canonical profile label may suffice. For an institution-specific name, select only when provenance is explicit and stable.
3. **Never invent names for ordinary basic attacks** just to satisfy a design checklist. Distinguish a deliberately triggered special from a basic sword swing or ordinary arrow.
4. **Shared source of truth:** hostile telegraph names, healing event names, ally skill reports, Barracks → Company → Inspect, Developer panel, VFX inventory and any public skill reference should agree. A Charmed unit inheriting a named tactic must not silently display a second disconnected translation.
5. **Beware snapshots/tests:** `tests/fixtures/enemy-vfx-rogue-signatures.json` contains exact Skeleton Ringleader names; `tests/hybrid-dual-role-ai.test.cjs` asserts `Bonebind`. Change both deliberately if the actual strings change, then run focused tests. The source-based attack inventory may report historical counts; no count should increase from a rename.
6. **Bilingual standard:** names and brief descriptions must be checked as English and idiomatic Spanish. `archive.js` has its own reference-translator layer and manuscript lock; don't edit its approved narrative to sneak a skill change in. An anonymous cast must remain anonymous even when a localized name exists.
7. **No new saved field required for a pure naming pass.** A true context-specific role naming system may require an authenticated, existing post/property; review v4 snapshots/restore before adding anything. Avoid brittle heuristics based on mutable enemy coordinates or zone assumptions.
8. **Development safety:** reconcile current open #864 save-continuity and #868 tutorial engine edits before implementation. Tests must separately cover normal/guardian/ringleader melee/ranged, existing Charmed names, crew versus unrelated same-species actors, actor migration/reload, old v4 saves and EN/ES. Browser/device acceptance and owner names approval remain open.

## Decision ledger and next scope

**Confirmed by current owner:** Skills should carry their real social and narrative connections; audit Skeleton names and extend the principle across ordinary, guardian and Ringleader monster groups; prioritize Greenwood as first real gameplay pilot; ask only for genuine creative judgment calls.

**Source-verified:** the names and actual source roles inventoried above; Lifebinder's follower origin; cross-region exceptions; Charmed inheritance; the existence of prior monster attack and VFX registries.

**Awaiting authorial acceptance:** individual suggested names, their Spanish presentations, any context-specific override when the unit's post isn't explicit, and how far to extrapolate a commander's doctrine to ordinary forces. This document is a working proposal, not silent approval.

**Unverified:** freshly executed combat/playback, accessibility of the proposed new proactive skills, on-device readability and performance, updated PR-focused tests and full-campaign balance. No merge, Pages/PWA publication or external tester contact authorized.

**Next bounded engineering change after naming review:** only the five existing Skeleton labels whose source and meaning were checked, their exact-name tests/fixtures, and any player-visible EN/ES mapping actually used by the game; then evaluate **the new proactive Greenwood attacks** from #870 as a separate implementation step on the coordinated branch. Do not begin a global renaming of all 251 historical VFX identities or invent additional paid companion skills.
