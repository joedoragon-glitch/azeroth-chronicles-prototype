# SIBDLP v0.9.2 — Monster skill lore, combat pilot and owner ballot handoff

**Latest owner voting decision: 16 November 2026 (second-round complete); initial 29-answer submission: 15 November 2026. This is the current coordination entrypoint for issues [#870](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/870) and documentation-only draft [PR #871](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/871).** It summarizes the extended owner conversation; it is **not** confirmation that combat expansion is implemented or that any alternative name has been accepted.

**Read in this order for a new chat/work session:** the **final 29-name map in this handoff** → the [source-audited naming inventory](MONSTER_SKILL_LORE_IDENTITY_V092_20261113.md) → [issue #870](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/870) and draft PR #871 → current source, newest branches and tests. The 14 November 29-option questionnaire, 15 November provisional 23+6 answers, and six-option second-round ballot are **historical voting evidence**, not unanswered questions.

## ALL 29 OWNER-PREFERRED ENGLISH NAMES — 16 November 2026 (authoritative voting record)

**The owner has now submitted the second-round #16–21 votes. All 29 naming questions have an explicit owner selection; there is NO pending six-question revote.** Preserve spelling/capitalization and the distinction between author-preferred names and actual shipped labels. There is no authorization to modify source, translate or publish merely from ballot completion. Four (#7–10) describe proposed, **unimplemented** skills, not existing game abilities. One (#12) has a material semantics concern: `Immobilization` currently applies only movement **Slow**, not full immobilization. Role-specific identity and idiomatic Spanish remain integration checks; do not silently introduce new boss service relations or effects.

### Final numbered name map (supersedes the 23+6 provisional state below)

| # | Current actor / established role | Existing game name or proposed slot | Owner's selected English name | Combat / implementation notes |
| ---: | --- | --- | --- | --- |
| 1 | Skeleton ordinary melee | `Bone Hook` | **Counterpressure** | Existing tactical move; shove |
| 2 | Skeleton ordinary ranged | `Bowguard Withdrawal` | **Protective Setback** | Existing tactical move; withdrawal |
| 3 | Skeleton ranged support | `Bonebind` | **Binding Renewal** | Existing support; ally heal |
| 4 | Skeleton melee Ringleader | `Ossuary Rattle` | **Lateral Buckling** | Existing warned sweep/push |
| 5 | Skeleton ranged Ringleader | `Bone Archer Pinning Volley` | **Temporary Restraint** | Existing area Slow; **not** a projectile volley or root |
| 6 | Lantern Wraith melee Ringleader | `Graveveil Retreat` | **Afterimage** | Existing hinder/reposition; not a spawned decoy |
| 7 | Skeleton ordinary melee NEW | `Not implemented` | **Mortise Cut** | **Proposed** proactive sword move; no implemented action |
| 8 | Skeleton ordinary ranged NEW | `Not implemented` | **Datum Line** | **Proposed** real aimed projectile; no implemented action |
| 9 | Skeleton melee Ringleader NEW | `Not implemented` | **Double Shear** | **Proposed** one normal/charged melee skill; no implemented action |
| 10 | Skeleton ranged Ringleader NEW | `Not implemented` | **Resection** | **Proposed** one normal/charged projectile skill; no implemented action |
| 11 | Scornfang Goblin melee Ringleader | `Gang Boss Smoke Trick` | **Fugitive Dust** | Existing hindrance/pivot; use actual Scornfang unit provenance |
| 12 | Scornfang Goblin ranged Ringleader | `Slingmaster Split Screen` | **Immobilization** | **Semantic hold**: code applies Slow, not full immobilization; no mechanic change |
| 13 | Mireling melee Ringleader | `Broodbank Coil` | **Backwater Effect** | Existing area Slow |
| 14 | Mireling ranged Ringleader | `Broodspit Barrage` | **Sediment Trap** | Existing area Slow; no physical volley implied |
| 15 | Independent Reed Beast ranged Ringleader | `Reedbank Mudscreen` | **Liquefaction** | Existing area Slow; no invented Archive allegiance |
| 16 | Garun Mine Ogre warden melee | `Rockside Slam` | **Pillar Punching** | **Second-round #16**; existing melee shove, mining-pillar terminology |
| 17 | Garun Mine Ogre melee Ringleader | `Boulderhand Sweep` | **Rockburst** | **Second-round #17**; existing warned area sweep/push, **no actual rockburst/explosion generated** |
| 18 | Garun Mine Ogre ranged Ringleader | `Stone Thrower Denial` | **Ground Control** | **Second-round #18**; existing warned area Slow, **no hard root or new mine supports** |
| 19 | Ashen Warlord Orc soldier melee | `Battle Shove` | **Right-of-Way** | **Second-round #19**; existing close shove, checkpoint / road priority |
| 20 | Ashen Warlord Orc melee Ringleader | `Warband Shoulder Drive` | **Force Projection** | **Second-round #20**; existing warned sweep/push, **no extra troops or projectiles** |
| 21 | Ashen Warlord Orc ranged Ringleader | `Axe Thrower Crossfire` | **Defile Control** | **Second-round #21**; existing warned area Slow, **no terrain choke or projectiles** |
| 22 | Ridge/Crag contracted archer ranged | `Disengaging Shot` | **Hedged Exit** | Existing defensive withdrawal; verify actual employer |
| 23 | Ridge/Crag contracted archer melee Ringleader | `Bow Captain Shoulder Break` | **Setoff** | Existing close scatter; verify actual employer |
| 24 | Ridge/Crag contracted archer ranged Ringleader | `Veteran Archer Denial Shot` | **Stop-Loss Order** | Existing hindrance/reposition; verify actual employer |
| 25 | Cindermaw Ministry Ash Beast melee Ringleader | `Ashmane Backlash` | **Compulsory Evacuation** | Existing scatter; require actual Ministry assignment |
| 26 | Cindermaw Ministry Ash Beast ranged Ringleader | `Cinder Spitter Smokecloud` | **Protective Separation** | Existing hinder/reposition; require actual Ministry assignment |
| 27 | Veyra Crown soldier melee | `Shield Reposition` | **Subcision** | Existing shove; army + cosmetology doctrine |
| 28 | Veyra Crown soldier ranged | `Shielded Backstep` | **Countermarch** | Existing withdrawal; formal army movement |
| 29 | Veyra Crown soldier ranged Ringleader | `Crown Volley Screen` | **Precision Sectioning** | Existing area Slow; no independent physical volley |

### Six final second-round votes — explicit supersessions

The owner's second-round answer (16 November 2026 local) explicitly selected **#16 Pillar Punching, #17 Rockburst, #18 Ground Control, #19 Right-of-Way, #20 Force Projection, #21 Defile Control**, with **no further comments**. These choices **replace**, rather than supplement as extra skill slots, the earlier four superseded first-round radio picks (`Lateral Thrust`, `Torsional Buckling`, `Falsework`, `Compulsory Removal`) and resolve former blank answers for #20–21. These old picks remain in the historical response table below solely to explain the sequence. They are **not candidate names to implement**.

**Why these six match the source:** `src/prototype/rules.js::tacticalFoundation.rogueMoves.species.ogre/orc` gives #16/#19 a melee `style: 'shove'`; `rogueRingleaderSignatures.melee.ogre/orc` gives #17/#20 warned `effect: 'sweep'` with displacement; `rogueRingleaderSignatures.ranged.ogre/orc` gives #18/#21 warned `effect: 'bind'`, implemented as a **timed Slow** in `src/prototype/engine.js`. They do **not** trigger independent explosions, rock debris, persistent mine structures, spawned units, hard roots, or physical arrow/axe/stone volleys. **Rockburst** is a genuine dynamic ground-failure concept and a strong attack-like metaphor, but this acceptance is for its *title*, not authorization to implement a literal seismic burst. **Ground Control** and **Defile Control** communicate controlling a worksite/chokepoint; the effects stay area hinder/Slow.

**Terminology independently spot-checked (16 November 2026):** MSHA's *Site Mining and Foundation Issues*, section 8.4.2.3, explicitly defines **pillar punching** as a mine support pillar pressing into the floor after bearing-capacity failure ([MSHA design manual](https://arlweb.msha.gov/Impoundments/DesignManual/Chapter-8.pdf), printed p. 8-19). **Rockburst** is a genuine sudden rock-mass failure term, documented in mining research ([Rock Mechanics Bulletin, 2025](https://www.sciencedirect.com/science/article/pii/S2773230425000332)). **Defile** in route-control doctrine means a narrow passage restricting movement, often managed with traffic control ([Military Police route-control explanation](https://armymilitarypolice.tpub.com/mp1029c/Figure-3-1-Roadblock-And-Checkpoint-Operations-54.htm)). **Defile Control** is a game title constructed from authentic terms—not proof that the exact two-word phrase is a formal doctrinal label. All are naming references **only**, not licenses to change combat geometry or add cinematic effects.

**Actual organizational ties:** Garun the Firstborn, architect/engineer and Colossus Mine boss, is responsible for his **Mine Ogre wardens** and structural supports. Ridge Tyrant (Master of Coin) and Crag Tyrant (Treasury captain) coordinate regional accounts and labor, but this does **not** make them the Ogres' direct commanders. Ashen Warlord is Frontier military governor over organized Orc warbands; **Cinder Warlord** is the roaming inspection/enforcement captain. Their movement-control/traffic terminology fits documented field duties. Same-species wild/independent units must not inherit institutional names based only on species or location.

### Meaning of approval and remaining work

- **Authorial naming selections:** All 29 English options are now accounted for. These are owner preferences about *names* only; where a title would misdescribe an effect or suggest unsupported employment, document the discrepancy rather than invent mechanics or a service relationship. In particular, #12 **Immobilization** needs a naming-versus-Slow resolution before player-facing implementation.
- **Original Greenwood gameplay scope:** Four proposed skeleton proactive skills (#7–10), Ringleader normal/charged two-form execution, and appropriate Guardian participation are still **design only**, not source changes or tested gameplay. Existing ordinary/Ringleader native Rogue skills and Charmed heritage are separate preexisting mechanics.
- **Safe implementation:** verify actual actor-post provenance before conditional names; existing `tacticalRogueMove` selects mostly by species/role. Preserve separate hostile cast labels, friendly Charmed names, fixtures, warning geometry, cooldowns, save v4 identities, bilingual EN/ES, four heroes, Normal/Nightmare, relevant source tests and renderer safety. No owner approval to update this code, merge #871, publish Pages or PWA, or contact testers.
- **Status:** owner decision-record documentation complete; **0 gameplay files modified, 0 runtime tests claimed**. Only draft docs PR #871 and issue #870 are changed by this follow-up.

## HISTORICAL first-round 29 answers (15 November 2026; 23 preferred + 6 then unresolved, superseded above)

**The owner submitted one consolidated 29-question answer message plus written feedback for #16–21. Result: 23 owner-preferred names and 6 unresolved names requiring *four replacement alternatives each*. This ledger controls over all older initial-29 and revised-29 candidate ballots.** The owner did **not** authorize code implementation, source renames, mechanical rebalance, PR merging, publication, or selecting the remaining six on their behalf. Treat these preferences as owner-authored names, **subject to accurate mechanics, post provenance, EN/ES naming, final presentation and future integration consent**.

### Recorded owner choices (exact, in questionnaire order)

| # | Actor / context | Existing skill or proposed slot | Owner response | Disposition |
| ---: | --- | --- | --- | --- |
| 1 | Skeleton melee | Bone Hook | **Counterpressure** | owner-picked |
| 2 | Skeleton bow Rogue | Bowguard Withdrawal | **Protective Setback** | owner-picked |
| 3 | Skeleton ranged healing | Bonebind | **Binding Renewal** | owner-picked |
| 4 | Skeleton Ringleader melee | Ossuary Rattle | **Lateral Buckling** | owner-picked |
| 5 | Skeleton Ringleader ranged | Bone Archer Pinning Volley | **Temporary Restraint** | owner-picked |
| 6 | Lantern Wraith melee Ringleader | Graveveil Retreat | **Afterimage** | owner-picked |
| 7 | Skeleton NEW proactive melee | Not implemented | **Mortise Cut** | owner-picked; proposed skill only |
| 8 | Skeleton NEW proactive bow | Not implemented | **Datum Line** | owner-picked; proposed skill only |
| 9 | Skeleton NEW proactive Ringleader melee normal/charged | Not implemented | **Double Shear** | owner-picked; proposed skill only |
| 10 | Skeleton NEW proactive Ringleader bow normal/charged | Not implemented | **Resection** | owner-picked; proposed skill only |
| 11 | Goblin Ringleader melee | Gang Boss Smoke Trick | **Fugitive Dust** | owner-picked; actual Scornfang crew context must be verified |
| 12 | Goblin Ringleader ranged | Slingmaster Split Screen | **Immobilization** | owner-picked; SEMANTIC REVIEW: current effect is Slow, not full immobilization |
| 13 | Mireling Ringleader melee | Broodbank Coil | **Backwater Effect** | owner-picked |
| 14 | Mireling Ringleader ranged | Broodspit Barrage | **Sediment Trap** | owner-picked |
| 15 | Reed Beast Ringleader ranged | Reedbank Mudscreen | **Liquefaction** | owner-picked; independent wetland context |
| 16 | Ogre Mine warden melee | Rockside Slam | **Lateral Thrust** | SUPERSEDED by owner's written request for 4 NEW mining-engineering options; not approved |
| 17 | Ogre Mine Ringleader melee | Boulderhand Sweep | **Torsional Buckling** | SUPERSEDED by owner's written request for 4 NEW mining-engineering options; not approved |
| 18 | Ogre Mine Ringleader ranged | Stone Thrower Denial | **Falsework** | SUPERSEDED by owner's written request for 4 NEW mining-engineering options; not approved |
| 19 | Orc Warlord soldier melee | Battle Shove | **Compulsory Removal** | SUPERSEDED by owner's written rejection of current options; request for 4 NEW leader/captain-focused alternatives |
| 20 | Orc Warlord Ringleader melee | Warband Shoulder Drive | **No selection** | Awaiting new options; original options rejected |
| 21 | Orc Warlord Ringleader ranged | Axe Thrower Crossfire | **No selection** | Awaiting new options; original options rejected |
| 22 | Contracted archer ranged | Disengaging Shot | **Hedged Exit** | owner-picked |
| 23 | Contracted archer Ringleader melee | Bow Captain Shoulder Break | **Setoff** | owner-picked |
| 24 | Contracted archer Ringleader ranged | Veteran Archer Denial Shot | **Stop-Loss Order** | owner-picked |
| 25 | Ministry Ash Beast Ringleader melee | Ashmane Backlash | **Compulsory Evacuation** | owner-picked; needs actual Ministry assignment |
| 26 | Ministry Ash Beast Ringleader ranged | Cinder Spitter Smokecloud | **Protective Separation** | owner-picked; needs actual Ministry assignment |
| 27 | Veyra-trained Crown Soldier melee | Shield Reposition | **Subcision** | owner-picked |
| 28 | Veyra-trained Crown Soldier ranged | Shielded Backstep | **Countermarch** | owner-picked |
| 29 | Veyra-trained Crown Soldier Ringleader ranged | Crown Volley Screen | **Precision Sectioning** | owner-picked |

**The six conflicted selections are *not* approvals:** the owner explicitly selected `Lateral Thrust`, `Torsional Buckling`, `Falsework` and `Compulsory Removal` in the original widget but then submitted comments saying **replace those options**, requesting four new alternatives per Ogre/Orc skill. The free-text overrides the radio control. #20 and #21 had no selection and likewise request four new choices. Do **not** silently use the four provisional older selections as finalized.

**Owner feedback, preserved with full design meaning:** Mine Ogres should have real, intriguing mining-engineering terms that sound like believable attacks to an ordinary player, anchored to work in Colossus Mine and the fields of expertise of its actual boss and the region's field boss/captain when applicable. This is a **tentative** direction for layering their regional connections, not permission to assign Ridge Tyrant/Crag Tyrant as the Ogre's direct commander or invent miner employment outside Garun's mine. Frontier Orcs should not read as generic brutes; their moves need the Ashen Warlord/Cinder Warlord's particular professional administrative and military expertise, not merely disciplinary-sounding shoulder pushes and axe crossfire. Those three existing proposed Orc name sets were rejected.

### Second-round ballot — **six** unresolved questions, 4 new alternatives each

The next single-message questionnaire must cover **only #16–21**, with Previous/Next, one saved radio answer and optional feedback per question, None of these, Review and one Send. Never re-ask the other 23.

| Original question | Actual actor / skill | A | B | C | D |
| ---: | --- | --- | --- | --- | --- |
| 16 | Mine Ogre warden, melee shove (**Rockside Slam**) | Pillar Punching | Point-Load Test | Rib Spalling | Pressure Arch |
| 17 | Mine Ogre Ringleader, melee sweeping knockback (**Boulderhand Sweep**) | Pressure Override | Rockburst | Strata Separation | Stress Redistribution |
| 18 | Mine Ogre Ringleader, ranged area Slow (**Stone Thrower Denial**) | Ground Control | Cable Bolting | Pillar Stabilization | Ventilation Stopping |
| 19 | Warlord Orc, melee shove (**Battle Shove**) | Movement Deconfliction | Right-of-Way | Route Diversion | Movement Credit Revoked |
| 20 | Warlord Orc Ringleader, melee sweep / push (**Warband Shoulder Drive**) | Passage of Lines | Countermobility | Sector Realignment | Force Projection |
| 21 | Warlord Orc Ringleader, ranged area Slow (**Axe Thrower Crossfire**) | Route Interdiction | Defile Control | Highway Regulation | Movement Restriction |

- **#16 notes:** A real pillar bearing failure; a rock strength test; wall fragmentation; an adapted shorthand for pressure-arch load redirection. Source-grounding: mining ground-control language; the effect remains a melee shove.
- **#17 notes:** All refer to underground ground stresses, displacements or instability, with plausible attack connotations. Rockburst is a dramatic metaphor only—do not add debris/explosion damage or a new effect.
- **#18 notes:** Mine ground control, reinforcing cables, support design and airflow-partition jargon. Some are process/terminology adaptations; no physical bolt projectile, new support wall, root or altered Slow is implied.
- **#19 notes:** Military movement-control jargon with occupation-route logistics; the last is a deliberate adaptation of the real 'movement credit' authorization term. Shove is physical displacement; no new economic penalty.
- **#20 notes:** Formal operational doctrine, force movement and realignment instead of orc brutality. 'Sector Realignment' is an authored adaptation; no reinforcements or travel mechanics are added.
- **#21 notes:** Route security, obstructed passage and military traffic regulation, fitting Warlord occupation/Cinder Warlord inspection. Current bind signature is an area Slow, not flying axes or full immobilization.

**External terminology source checks (not proof of the game's visual/movement resolution):** Pennsylvania DEP, [Mining Terms](https://www.pa.gov/agencies/dep/programs-and-services/mining/bureau-of-mine-safety/training/mining-terms); NIOSH [Coal Mine Roof Instability terminology](https://stacks.cdc.gov/view/cdc/235713/cdc_235713_DS1.pdf) and [ground-control work](https://stacks.cdc.gov/view/cdc/228163); Penn State [Excavation Terms](https://courses.ems.psu.edu/mng230/node/723); U.S. Army's [Operational Terms](https://gulflink.fhpr.osd.mil/al_jaber_ii/al_jaber_ii_refs/n61en123/fm_101_5_1.htm), [Military Police route-control reference](https://www.globalsecurity.org/military/library/policy/army/fm/3-19-4/chap5.htm), and [Army protection planning](https://home.army.mil/wood/contact/publications/ppb/Protection-Planning-at-Every-Echelon). **Not every proposed multiword expression is a verbatim glossary entry**: `Pressure Arch`, `Movement Credit Revoked`, `Sector Realignment`, and some role-adapted phrases deliberately combine authentic concepts for credible RPG moves.

### Source reconciliation and handling risks

- `src/prototype/rules.js` **currently** defines the existing names and **unaltered effects**. `engine.js::tacticalRogueMove` selects predominantly by species and role. **Do not globally rename every Ogre or Orc as though their player-facing skill implied formal service under Garun or Ashen Warlord**; Mine Ogre wardens and Frontier-command Orcs need stable verified actor provenance. Independent Ogre hearths, wild creatures and unrelated positions retain their cultures.
- **#12 Goblin `Immobilization` is the one specific name/mechanic discrepancy requiring review:** current Ringleader ranged `effect: 'bind'` resolves to timed **Slow**, **not rooted/zero movement**. Record the owner's preferred name but do not strengthen the ability or promise full immobilization without a separate owner decision. `Temporary Restraint` (#5) likewise denotes hindered movement; don't communicate a hard root. **#6 Afterimage** is an accepted title concept for a spectral sidestep but does not authorize spawning an illusory duplicate or new VFX. **#9 Double Shear** does not authorize extra hits unless the dual-form proactive skill is designed to have them.
- **#7–10** are owner-preferred **labels for new unimplemented skills**, not evidence of any gameplay creation; one normal/charged skill per Ringleader role. All other chosen names for pre-existing moves are **presentation** choices, not changed stats/LOS/cooldowns/AI/travel/persistence.
- Historical `Charmed` companion titles inherit the native/Ringleader species skill names, and their current skill/heritage/training layers must remain intact. Existing warning labels, summaries, native VFX identity fixtures and `Bonebind` exact-string tests need focused review **only when source renames are actually authorized**.
- **EN/ES:** decide idiomatic player-facing Spanish with the same occupational double meaning; owner supplied English names only. Do not translate the approved narrative manuscript or silently substitute an English alternative.
- **Owner acceptance state:** 23 affirmative English naming preferences, **one semantic conflict (#12)**, six second-round selections **not yet received**, zero code changes or test runs from this vote.

**Next:** deliver the six-question interactive widget; wait for the owner's actual consolidated choices and notes; then update this answer ledger and #870/#871, reconcile unresolved semantic/provenance issues, and scope any implementation separately. No main merge, PWA/Pages update or external tester contact.


## Current authoritative status, with evidence boundaries (historical snapshot; updated by the owner response ledger above)

| Subject | Status | What this means |
| --- | --- | --- |
| Owner's **lore-first comic naming rule** | **Confirmed authorial direction** | Case-by-case names should reveal what each actor's actual leader, profession, organization, culture or history contributes to the move, and still sound like genuine attacks |
| Greenwood Lifebinder skeleton pilot and ringleader dual-form concept | **Explicitly requested, design only** | Skill addition, tuning, actor/guardian behavior, authored names, EN/ES and tests **not implemented by #870/#871** |
| Existing skeleton/Ringleader/Charmed mechanics | **Source inspected on main** | Source paths and existing names known; no new gameplay playback, full campaign, cross-device or current-save acceptance claimed by this workstream |
| 12-species and boss/captain nomenclature inventory | **Documented audit** | Existing names and chain-of-command risks inventoried in PR #871; recommendations are proposals, not bulk production rename instructions |
| Revised **29 questions × four alternatives** | **Present in chat + recorded in PR #871** | The owner has requested a navigable single-message Previous/Next questionnaire with a per-question comment area and a final consolidated Send action |
| Owner's actual selections and written comments | **All 29 owner selections received** | Current final map is above; old 23+6 and replacement ballot are historical snapshots |
| GitHub [draft PR #871](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/871) | **Docs-only, unmerged and not published** | Contains naming audit and index; this handoff is an additional documentation change in the same PR |
| Current baseline | Inspected **`main@66cbf47d251ba3213a61f21e5a3eb1abf57f26df`** | Must be refreshed at next work session, not assumed eternally current |
| Conflicting ongoing branches | **#864** save continuity and **#868** tutorial both unmerged at this checkpoint | Both edit important engine files; coordinate and rebase carefully before any combat implementation |
| Save integrity / physical-device / publication | **Not newly tested; no merge/deploy consent** | Protect v4, recovery, long-session continuity, Pages/PWA and all owner release gates |

## What the owner actually asked for, in order

1. **Initial combat observation:** ordinary melee/ranged monsters seem to rely on basic attacks more than bosses and captains. The owner wants distinctive, mechanically useful attacks for ordinary monsters, guardians and Ringleaders, eventually across the existing world. Initial location was corrected explicitly from a misspoken name to **Greenwood**. Focus on the Lifebinder's skeletal worksite defenders as a manageable **first pilot**, not the entire game's immediate combat redesign.
2. **Ringleader special:** the owner proposed **one additional proactive skill**, informed by hero Skill 1/Skill 2 normal and charged concepts, with an ordinary and charged execution and a readable charge/warning. This is **not four copied hero skills** and must not replace the existing Ringleader tactical Rogue signature. Exact coefficient/geometry/cooldown/balance remain unapproved.
3. **Related companions:** owner also mentioned hired Soldier/Archer/Ranger companions, pets and Charmed monsters. Source reconciliation found they **already have** defined skills, mastery and unlock mechanics. Adding another paid training layer is **not authorized by this discussion**; do not duplicate Charmed heritage or training, erase Mira/Skill-2 gates, or infer the new hostile move becomes a friendly skill automatically.
4. **Lore correction:** earlier proposals `Boneguard Cut`, `Watcher's Pin`, `Ossuary Crosscut`, `Crypt Volley` and their variants were rejected as generic. Existing `Ossuary Rattle` was also identified as a poor indicator of Lifebinder identity. The owner wants names to **hint at the backstory**, not simply describe a skeleton's bones or borrow a boss name.
5. **Generalize the principle to every monster, case by case:** do not default to species clichés. A Mirejaw-linked Mireling should suggest **hydrology**, a Garun-linked Ogre warden **architecture/engineering**, a Scornfang Goblin **reclamation**, a paid Ridge/Crag archer **finance and security**, an Ashen Warlord Orc **military occupation/checkpoints**, a Cindermaw Ash beast **actual ministry duties**. No assumption that all instances of a species work for the same commander.
6. **Important Veyra correction:** Veyra (marshal, formerly cosmetics professional and still practicing cosmetology) trained the regular Crown army in combined drill. Soldier names should be informed by **military discipline plus Veyra's aesthetic precision/cosmetology**. They are **not** simply generic martial-sounding names. Do **not** assert she literally trained every soldier in cosmetology; these are techniques inspired by her idiosyncratic doctrine, not established cosmetology licenses.
7. **Precise humor standard:** this is a **deliberate worldbuilding joke**: real, sometimes obscure professional terms can sound like powerful attacks *even when a player does not understand the real-world term*. An ordinary or adapted professional term also qualifies if its combat double meaning works. **Authenticity alone is insufficient**; the phrase needs attack-name rhythm, credible relationship to actual effect, and an unforced funny contrast with the master's trade. Avoid a flood of anatomical jargon, invented jargon, tedious bureaucracy or obvious species-themed puns. The boss's mix of specialties matters: **the Lifebinder has BOTH mortuary/thanatology expertise AND architectural conservation/adaptive reuse**.
8. **Owner-controlled decisions:** for every ability under review, provide **four alternatives** for the owner to choose, plus an opportunity to reject all four and supply their own idea. The owner explicitly offered feedback for genuine creative decisions. Do not choose on their behalf.
9. **Questionnaire interaction, not sequential messages:** display **one question at a time inside the same assistant message**, four selectable choices, **Previous / Next**, persistent within-message selection state, **a separate freeform comment area for each**, skip/None of these, review, and a **single final Send to ChatGPT** containing all answers and comments. Owner explicitly rejected receiving 29 separate chat turns. A first attempt displayed a malformed review screen (the owner supplied a screenshot); the assistant replaced it with a simpler single-message questionnaire in the conversation. **Its rendering on the owner's exact device has not been independently reverified.** Do not mark questionnaire UX accepted without actual feedback.
10. **Handoff request:** while the owner works through the questions, reconcile all decisions and the pending work into the existing GitHub issue/PR, so a future chat cannot mistakenly treat an obsolete proposal, an unanswered question, or a draft PR as completed code. Do so now without waiting for ballot answers.

## Canon: avoid invented explanations

- **Lifebinder:** Dark Lord's former adventuring companion; disciplines **Mortuary Science and Thanatology** and **Architectural Conservation and Adaptive Reuse**. His followers are **aware and enduring skeletons brought from elsewhere** for paid work on the unfinished Forest Crypt winter residence; **they were not raised from that site's graves**. They retain names/loyalties, have doubts about the conversion and limited power to refuse. Borin is the captive smith at the estate. Skeleton move vocabulary can concern structural forces, conservation, securing a construction site, surveying, craft work, preservation and his sustaining bindings **as well as** anatomy. Existing boss abilities such as **Excarnation, Stay Alive, Clerk of Works, Differential Settlement, Algor Mortis, Anastylosis, Disarticulation, Pressure Grouting and Reconstitution** already show the intended tone; **do not gratuitously rename those**.
- **Mira:** Millhaven instructor kept by **Thornfang**, former Crown wilderness scout, canine handler and estate-approach patrol leader. Mira's rescue unlocks hero Skill 2 and companion progression. A tentative earlier suggestion that Mira personally drilled the Lifebinder's skeletons was **never established as canon**, and should not be introduced by skill names or prose.
- **Scornfang:** Thornfang's Goblin disciple, local Superintendent of Reclamation. His Treasury/guarded stores and Goblin work crews concern receiving, inventory, decommissioning, remediation, salvage and materials for the estate; they are **not** simply an outlaw gang or an elite army.
- **Mirejaw:** hydrology, channel flow, marsh territory and mud recovery; not every wild wetland creature automatically answers to him. **Direjaw** also has water/sediment-themed Treasury duties but is a distinct captain; do not conflate.
- **Drowned Keeper:** scholarly archivist and enthusiast of fishing, working to preserve a flooded Archive. **Independent Reed Beast wallows and Lantern Wraith night holdings are not automatically under his command**. Dreadmaw's affection for the Wraiths is canon, but not proof he commands every Wraith.
- **Ridge Tyrant:** Master of Coin, payroll and economic order; **Crag Tyrant** is Treasury captain and disciple. Contracted archers may serve beyond Ironroot. Wild Highland wolves occupy their own dens. Crag is **not a wolf**.
- **Garun:** Stone Colossus, architect, road and bridge engineer, maker of his own stone body, thoughtful structural conservator and patron of eccentric mechanical art. Mine wardens include **Ogres** and mounted Crown soldiers on armored direwolves, **not every wild Ogre**.
- **Ashen Warlord:** Frontier military governor, Orc warbands, patrols, checkpoints, inspections, levies, repaired roads and supply security. **Cinder Warlord** is his roaming enforcement/inspection captain, not another governor. Independent Ash Stalkers at their night hold are not automatically enlisted.
- **Veyrith:** proud loyal royal dragon preparing an **unfinished** air-force project. Don't name an entire operational fleet that does not exist.
- **Veyra:** marshal at Citadel, with formal drill, appearance of weapons/uniforms, precision, and practicing cosmetology. Distinguish Veyra's historical army-wide influence from unproven direct service of a given regional creature.
- **Cindermaw:** Ministry of Interior and Welfare, food/shelter/logistics and organization of Ash beasts. **Dreadmaw**, his devoted agricultural disciple, co-manages the Treasury and guards its Inner Vault. The same Ash beast species can appear in several roles; don't apply a Ministry-specific ability label to an unassigned wild individual. The Dark Lord's own guards are another distinct post.

Primary evidence: `src/prototype/data.js::bosses`, `src/prototype/archive.js::keeperHistories/keeperOffices`, `src/prototype/rules.js::roomCaptains/dungeonLore/rogueMoves/rogueRingleaderSignatures/companionSkills`, and `docs/MONSTER_FORTS_TERRITORIAL_AUDIT.md`.

## Current combat reality: distinguish from the new owner proposal

Existing `rules.js` defines **12 species' conditional Rogue tactical moves** and **melee/ranged Ringleader signatures**. These trigger under particular pressure or regroup conditions and are **not the proposed new proactively used ordinary/Ringleader combat skills**. The `engine.js::tacticalRogueMove` resolver usually selects by species, combat role and tier (with special Crown-doctrine handling). It does **not universally know the creature's direct employer**. Some abilities are basic melee/physical arrows without a separate named skill; do not invent special slots for them.

**Exact Lifebinder-related skeleton skills inspected:**

| Current existing name | Which system | Actual role / decision |
| --- | --- | --- |
| **Bone Hook** | Melee skeleton native Rogue move | Close shove; rename candidate, not broken combat |
| **Bowguard Withdrawal** | Ranged skeleton native Rogue move | Withdrawal; rename candidate |
| **Bonebind** | Skeleton ranged restorative support | Heals allies; rename candidate |
| **Ossuary Rattle** | Melee Skeleton Ringleader tactical signature | Warned sweep/push; core lore-mismatch example |
| **Bone Archer Pinning Volley** | Ranged Skeleton Ringleader tactical signature | **Area bind**, not real moving arrows; misleading volley language |
| **Disarticulation** | Charmed Skeleton third heritage / Lifebinder native tactical label | **Keep**; already follows owner's professional joke |
| **Stay Alive**, **Algor Mortis** | Little Lifebinder pet skills | **Keep**; derived from the boss |
| **Reconstitution**, **Pressure Grouting** | Lifebinder boss support/tactical | **Keep** |

`party.js::charmedCompanionSkill` reuses hostile native/Ringleader names in friendly skills. Charmed heritage and mastery are **already merged behavior** under historical #608; ordinary Soldiers/Archers/boss pets have their own earlier skills. Existing restorative move names and the VFX/test snapshots matter to renames. Example regression anchors: `tests/fixtures/enemy-vfx-rogue-signatures.json` contains exact existing Skeleton Ringleader names, and `tests/hybrid-dual-role-ai.test.cjs` asserts the current `Bonebind` support name.

**New proposed, not implemented:** (a) ordinary skeleton sword special, (b) ordinary skeleton bow special, (c) melee Ringleader *one extra proactive skill with regular/charged expression*, (d) ranged Ringleader likewise, (e) guardians inherit appropriate role technique **if source and balance allow**, not a made-up unrelated skill tree. Preserve the existing tactical Rogue moves alongside them. The opening Greenwood tutorial and level-1 monster admission remain functional constraints. No numerical tuning, animations, captions, Spanish translations, guardian variants, unlock behavior or source migrations have been approved or tested yet.

**Important questionnaire correction:** Original question 6 proposed a distinct Skeleton Guardian ranged move, but current precedence uses the skeleton ranged native profile rather than a guardian-specific variant; **that was not a real independent skill slot**. The revised 29th-set ballot replaces Q6 with the **existing independent Lantern Wraith melee Ringleader signature**. Original Q15 incorrectly assumed a Reed Beast was an Archive servant; revised Q15 uses its **independent wetland territory and soil rheology**, not an invented master. The previous *first* 29-question ballot and all old generic/anatomical names are **obsolete**.

## Original 29-question questionnaire — historical first-round answer key (final 29 votes above supersede this section)

**Authoritative 29-question A/B/C/D answer matrix:** see **[Revised 29-name ballot — 14 November 2026](MONSTER_SKILL_LORE_IDENTITY_V092_20261113.md#revised-29-name-ballot--14-november-2026-supersedes-earlier-unreviewed-names)**. That table lists, in order, all 29 actors, existing/proposed abilities and the exact four alternatives and story/effect rationale that appeared in the owner's latest single-message questionnaire. **Do not substitute the earlier matrix or generate an independent alternate ballot without owner instruction.**

The chat questionnaire's choices also include **None of these**. Every question has an **independent optional free-text comment** for the owner's own proposed name, correction, cultural nuance or humor preference. The questionnaire allows unanswered/skipped entries. At completion the owner is expected to send one consolidated response; it may contain partial answers, custom suggestions and commentary. **The 29-answer ballot was subsequently received and is transcribed above; this earlier text is retained for UI origin context.** An interactive control visible in a prior message is not proof of completion, and unsubmitted client-side state may not be available in a subsequent chat. **Do not ask the owner to repeat answers that were actually submitted; check the ensuing conversation first.**

When the owner submits:

1. Parse each response by **question number + actor + old skill name**; reconcile free-form notes, alternative suggestions, "None of these" and intentionally unanswered entries. A voted option is an **owner preference**, but don't invent approval for changing battle mechanics, all species' allegiance, localization or publication.
2. Reopen the exact current source and these issue/PR records. Flag only genuine authorial conflicts, e.g. a name promising arrows for an area bind, an invented army affiliation, or an idiomatic Spanish rendering that changes meaning. Resolve routine accuracy issues independently; ask the owner only where the **creative** choice materially changes intent.
3. Add an explicit **submitted-answer ledger** in the same owning issue/PR after receipt, recording chosen option, any override text, exact skills affected, and deferred/needs-revision decisions. Keep historical rejected alternatives out of the current action list. Do not conflate a player's skill name with a database/save identity.
4. Make the later, separate **implementation** only within authorized scope, with focused tests and behavior preservation; update player-facing English and idiomatic Spanish labels together and verify mobile readability and cast/name fidelity. Do not silently auto-merge or deploy.

## Execution boundaries and next engineering session

- Source owner map: `src/prototype/rules.js` owns existing tactical, healing, heritage and captain names; `src/prototype/engine.js::tacticalRogueMove` selects the profile and controls decisions; `src/prototype/party.js` owns Charmed and company use; `src/prototype/boss-combat.js` and warning/VFX owners determine honest targeting, collision and hit geometry; `src/prototype/data.js` and `archive.js` contain established story and approved manuscript; player labels, EN/ES localization and read-only enemy/VFX attack registries are separate integration points. **Do not revise the locked narrative manuscript solely to justify a skill name.**
- Investigate **reliable actor provenance** before mapping a subordinate to a captain/boss. Species and region alone are insufficient for named institutional allegiance. Never change stable gameplay IDs, event identities, saved actor origin, main history or v4 schema to implement an unverified presentation overlay.
- No invented flying arrows from a bind skill; no invented heals from defensive controls; no new field/territorial population, unwarned damage, gameplay unlock, or companions' training package merely for themed naming.
- Keep **Normal/Nightmare**, all four heroes, level-1 opening protection, Greenwood field + Forest Crypt, ordinary/guardian/Ringleader melee/ranged, tactical Rogue AI, Charmed native/heritage, enemy ranged healing, Silence/Slow, threat/cooldowns, real projectile LOS and impacts, reset/leash, historical v4 saves and restore, EN/ES, Pixi/Canvas and long-session persistence under focused regression. Test only what the code change actually requires, without claiming a browser or physical-device test from a source-level inspection.
- **Do not collide with unmerged #864 save continuity or #868 tutorial work**; recheck current branches. Keep #871 as the **documentation workstream** and issue #870 as the gameplay design owner; if gameplay implementation eventually needs its own carefully scoped branch/PR, reference them and coordinate rather than overwriting active development.
- Functional completion remains the project's overarching milestone; avoid expanding the release checklist to every imagined attack or 251 historical VFX identities. No unauthorized main merge, Pages publication, player-facing PWA update or tester contact. **v0.9.2 has not been published by this workstream.**

## Checkpoint for the successor

**Both the 29-answer ballot and the subsequent six-question revote are submitted.** Do not ask either set again or resume a speculative global rename. Use the authoritative final 29-name map above and reconcile the #12 meaning/Slow discrepancy, actual faction/post provenance, Spanish labels and later implementation boundaries before doing any code work. Keep the naming humor grounded in **the genuine professional term + convincing attack** double meaning, always balanced against the creature's actual boss, captain, post and independent cultural identity.

This workstream's immediate deliverable is **accurate documentation and clean handoff**, not playable new skills. Any future chat should verify live repo/PR state before claiming otherwise.
