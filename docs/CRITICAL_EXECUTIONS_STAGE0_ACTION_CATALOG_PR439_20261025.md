# Stage 0 — Critical Action Inventory and PR #439 Reconciliation
**25 October 2026 · Draft design PR #440 · documentation only**

**Status: source-grounded inventory assembled; authorial effect signoff and executable enumeration remain pending.** This catalog is **not** a claim that all actions have approved effects, that the current historic enemy presentation register has been regenerated, or that Stage 1 may be merged. The proposed critical improvements below are **candidate directions** only. Nothing here changes gameplay, cooldowns, audio/VFX, save fields or published builds.

**Dual-source rule.** Ordinary source baseline: `main` at `e4e8234b5f784ddc9492fe79d956fd0a696b12af` (PR #440 base). **Hero execution target:** unmerged [PR #439](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/439), `design/hero-skill1-self-taught-combat-20261024` at `f2ef5de159bb10721ab96c554fb3806f34bd8eb9`. This draft PR already commits **Area 1 gameplay**, but A/V, localized player descriptions, general tests and balancing are not finalized. Its mechanics must **not be described as live/main behavior**. If #439 changes or merges, reconcile this document against its latest SHA before Stage 1.

## 0. Cross-PR integration contract (non-negotiable)

PR #439 replaces the original overloaded Skill 1 with **three distinct action families per class**: an independent automatic 3-beat basic/finisher (including movement and stationary versions); a separate instant 3-second normal Tap (formerly charged Paladin holy projectile, Mage narrow beam, Ranger three arrows); and three *new charged actions*: Paladin **Radiant Cross**, Mage **Wide Arcane Beam**, Ranger **Hawk Interception**. Thus Stage 0 covers **3 hero automatic combo identities + 3 classes × 8 skills × 2 forms = 51 listed hero activation families**, not the old 48 Skill 1 forms plus unseparated automatic basics.

PR #439 also introduces `hero.basicCd`, separate `hero.cd[0..7]` **normal Tap timers**, and `hero.chargedCd[0..7]` **charged locks**. A charged cast starts normal and charged timers; a Tap only starts/refreshes the normal timer. Charging is a distinct legal release, **not** a second critical chance on the subsequent damage pulse/flight. The critical effect must never modify either recovery clock. Its v4 save migration adds new timer defaults; critical codex migration must be tested on **saves with and without these new timer fields**. PR #439's `skill-reference.js` is **not yet updated to reflect its three new Skill 1 forms**; for S1 use PR #439 combat/rules and its authored specs, not the older Skill Journal display copy. More at [PR #439 Area 1](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/design/hero-skill1-self-taught-combat-20261024/docs/HERO_SKILL1_AREA1_IMPLEMENTATION_20261024.md) (document is on the #439 branch, not #440), [numeric specification](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/design/hero-skill1-self-taught-combat-20261024/docs/HERO_SKILL1_FINAL_BALANCE_SPEC_20261024.md), and [asymmetric cooldown contract](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/design/hero-skill1-self-taught-combat-20261024/docs/ASYMMETRIC_TAP_CHARGED_COOLDOWNS_20261024.md).

**Reconciliation/merge guard:** PR #440 must not copy/overwrite any of PR #439's changed gameplay files (`app.js`, `engine.js`, `hero-combat.js`, `boss-combat.js`, `rules.js`, `save.js`) in Stage 0; later implementation must branch from a reconciled base, account for #439 timers and charged Skill 1 transients, and recheck #439's planned A/V/audio changes. PR #436 independent stationary-auto code is a distinct unmerged proposal; do not silently layer three branches.

## 1. Release boundary and coverage definitions

- **Unit:** a valid **actor-owned combat skill activation/release**, not an individual target, impact, projectile, bleed/Slow tick, animation event or periodically updated buff. Failed prerequisites, queued input and interrupted preparation are *not* releases. For multi-stage skills, explicit boundary review is required.
- **Result:** one critical decision per activation, stored on the transient action/attack/heal receipt for all existing consequences. A single `!` is attributed to the **executing actor** when released, not every recipient/impact, and adds no windup.
- **Every eligible active action requires:** stable key, actor/domain, actual admission/release code path, existing effect, candidate critical consequence/cap, negative protection cases, and a deterministic focused test. Candidate effects can reuse extant outcomes but **none is approved yet**.
- **Environmental traps**, passive periodic siphon, static buffs, generic periodic regeneration, service consumables, noncombat commands, enemy Frenzy/phase *presentation*, ordinary movement or queued/cancelled casts are **excluded from independent rolls** unless source audit demonstrates a distinct actor-owned activation. A *summon cast* is eligible even though summoned creatures subsequently make their own rolls on their own attacks.
- **No geometry change:** never enlarge a radius/line, issue extra missiles, add summons, accelerate cast, change warning/recovery/cooldown, override immunity or move the damaging footprint. A critical may enhance the original skill's already-authorized result subject to its own cap.

**Registry status terminology:** `S` = source-confirmed action identity/owner, `C` = candidate critical lever only, `G` = guardrail identified, `P` = activation boundary/authorial signoff still pending, `E` = intentionally excluded (no independent roll). All candidates below are `S/C/G`, not approved or tested. Some multi-phase rows additionally require `P`.

## 2. Hero inventory — 51 action families (PR #439 target branch)

Action owner: `src/prototype/hero-combat.js::cast`, `castMovementBasic`, new `resolveHeroCrossPulse`, `resolveWideArcaneBeam`, `advanceHeroSkillEffects` (PR #439). Other skills 2–8 cross-reference current `skill-reference.js` but **not** its stale Skill 1 description. For all rows: cooldowns/charge/recovery, original effects, damage admission and existing protections remain unchanged.

| Stable proposed key | Existing/pr439 action semantics | Boundary / receipt | Candidate critical consequence (NOT approved) | Specific no-change / cap gate |
| --- | --- | --- | --- | --- |
| `hero/paladin/auto` | Sword Combo, 3 hits + 3rd cleave | Independent auto basic on PR439; one roll per beat; finisher splash inherits its beat | Bounded armor interaction / enhanced existing cleave | No new targets, wider cleave, auto-trigger or added basic attack |
| `hero/mage/auto` | Arcane Combo, 3 hits + finisher splash | Independent 0.85s-class auto cadence (talent-modified); one roll per beat | Skill-specific arcane potency on original hit and existing finisher | No extra splash target or beam |
| `hero/ranger/auto` | Bow Combo, 3 hits + third arrow fan | Independent auto cadence; later arrows inherit specific activation | Skill-specific precision/defense interaction | Do not add arrows or automatic pursuit |
| `hero/paladin/1-tap` | Promoted holy projectile (former charged Skill 1) | PR439 instant Tap; own 3s normal timer | Small bounded holy damage/armor interaction | One roll for projectile release; no new radius/shot |
| `hero/paladin/1-charged` | Radiant Cross, 2 pulses / 0.35s / 8 distinct foes max | PR439 new authored first pulse at release, second from transient effect queue | Enhanced second pulse effectiveness on targets legally hit twice | One roll total; no second-roll, extra pulse, width or range |
| `hero/mage/1-tap` | Promoted thin arcane beam (former charged Skill 1) | PR439 instant Tap; 3s normal cooldown | More precise magic potency on same one target | Do not turn into the charged full-width beam |
| `hero/mage/1-charged` | Wide Arcane Beam, terrain-clipped corridor, once per foe | PR439 releases immediate one-time line; no target-count cap | Bounded potency on same legal hits | No wider corridor, extra hits, defense/wall bypass |
| `hero/ranger/1-tap` | Promoted three focused arrows (former charged Skill 1) | PR439 instant Tap, three staggered missiles | Greater precision on existing attack package | One roll for ALL three arrows; no added arrows |
| `hero/ranger/1-charged` | Hawk Interception, finite homing/contact, same-retreat lock | PR439 single target; transient hawk flight until contact/expiry | Slightly longer existing same-retreat suppression on valid contact | Do not add travel budget, new target, universal stun or invalid retreat cancellation |
| `hero/paladin/2-tap` | Sundering Strike, single hit + Weaken | Normal Skill 2 Tap; PR439 separate short cooldown | Slightly longer Weaken duration | Keep current stacking/mitigation restrictions |
| `hero/paladin/2-charged` | Holy Cleave, frontal group + Weaken | One charged group release | Slightly stronger authored Weaken | Preserve cone, legal targets, dual cooldowns |
| `hero/mage/2-tap` | Frost Bolt, damage + Slow | Single projectile release | Longer existing Slow | Same Slow stacking, no new freeze |
| `hero/mage/2-charged` | Frost Burst, area damage + Slow | One group action | Longer existing Slow on already eligible hits | No radius change or extra rolls |
| `hero/ranger/2-tap` | Pinning Shot, two slowing arrows | One release / two arrows | Longer Slow after legal contact | Do not roll per arrow or add shots |
| `hero/ranger/2-charged` | Pinning Volley, line + Slow | One line release | More effective existing Slow, bounded | No widened line or hit policy change |
| `hero/paladin/3-tap` | Shield Stance, raise/lower mitigation | Begin stance is activation; lowering same stance is NOT second crit cast | Modest improvement in existing stance protection | Do not crit toggle-off; no immunity or altered cooldown-on-end |
| `hero/paladin/3-charged` | Shield Bash, frontal push | One group action | Slightly stronger existing displacement / mitigation effect | Collision-safe push; no new immobilize |
| `hero/mage/3-tap` | Spell Interrupt, targeted bolt | One projectile; interrupt only on legal hit | Modest impact improvement; exact variant needs owner choice | No pre-hit telegraph cancellation or new Silence |
| `hero/mage/3-charged` | Silence Field, bilateral special-skill block | One field creation, not each field tick | Slightly longer existing bilateral field duration | Must affect friend and foe alike; cap and no new geometry |
| `hero/ranger/3-tap` | Self-Heal | One valid personal heal action | Greater original healing | No overheal / revival; no crit on failed full-health cast |
| `hero/ranger/3-charged` | Party Heal to living eligible recipients | One valid cast shared by all recipients | Greater existing heal per eligible living recipient | No per-recipient crit; no dead-unit resurrection |
| `hero/paladin/4-tap` | Judgment, holy shot + Taunt | One projectile release | Longer existing Taunt where allowed | Boss basic-only attention limits retained |
| `hero/paladin/4-charged` | Grand Judgment, splash + group Taunt | One group action | Slightly more effective existing Taunt | Do not redirect boss scripted specials |
| `hero/mage/4-tap` | Arcane Fracture, damage + vulnerability | One projectile release | Longer existing Fracture | Strongest-only vulnerability, not extra stack |
| `hero/mage/4-charged` | Arcane Rupture, group damage + vulnerability | One group action | Longer existing Fracture | No extra targets/coverage |
| `hero/ranger/4-tap` | Movement Haste self-buff | One self-buff activation | Longer existing movement Haste | Not attack cadence or skill cooldown Haste |
| `hero/ranger/4-charged` | Companion Rally, movement + basic attack cadence | One party buff activation | Longer existing Rally duration | No extra recipients or special/charge haste |
| `hero/paladin/5-tap` | Holy Area, nearby area hit | One area activation | Bounded holy potency on same targets | No added area/targets |
| `hero/paladin/5-charged` | Consecrated Wave, wider hit + Weaken | One area activation | Longer existing Weaken | No geometry/target cap change |
| `hero/mage/5-tap` | Force Pulse, damage + push | One area activation | Slightly stronger existing push | Collision and protected encounter rules unchanged |
| `hero/mage/5-charged` | Force Wave, wider push effect | One area activation | Slightly stronger existing push | No cone/radius change |
| `hero/ranger/5-tap` | Arrow Volley, area damage | One area action | Bounded arrow effectiveness on original hits | No more arrows/targets |
| `hero/ranger/5-charged` | Arrow Rain, wider hits + Slow | One area action | Longer existing Slow | No altered warning footprint |
| `hero/paladin/6-tap` | Vanguard Rush, approach + strike | Release after valid reach/path | Slightly stronger original strike outcome | No faster/longer dash, no extra approach |
| `hero/paladin/6-charged` | Vanguard Impact, rush + push wave | One action including wave | Slightly stronger bounded original push | No new second wave or displacement past geometry |
| `hero/mage/6-tap` | Magic Shot, projectile + Slow | One projectile | Longer existing Slow | No added flight speed |
| `hero/mage/6-charged` | Focused Beam, stronger shot + Slow | One beam release | Longer existing Slow | No width increase |
| `hero/ranger/6-tap` | Repelling Shot, shot + push | One shot | Slightly stronger existing push | Collision-safe |
| `hero/ranger/6-charged` | Repelling Volley, 3 arrows + push | One release despite 3 missiles | Slightly stronger existing push | No per-arrow critical or extra volleys |
| `hero/paladin/7-tap` | Holy Assault, area hit | One group action | Bounded potency against original targets | No greater radius |
| `hero/paladin/7-charged` | Oath Strike, wider damage + Weaken | One group action | Longer existing Weaken | No new zone hazard |
| `hero/mage/7-tap` | Arcane Chain, chain between foes | One chain release including every hop | Bounded chain hit potency | No extra hops/target count |
| `hero/mage/7-charged` | Chainstorm, stronger wider chain | One chain action | Bounded potency of original chain | No rerolls on chain hops |
| `hero/ranger/7-tap` | Piercing Arrow, defense interaction | One shot | Improved existing defense-piercing characteristic within caps | Must not bypass immunity / protected boss |
| `hero/ranger/7-charged` | Stronger piercing arrow + Slow | One shot | Longer existing Slow or calibrated pierce | Keep existing protection |
| `hero/paladin/8-tap` | Sanctuary Oath, damage+self-heal+party ward | One composite action | Improve original ward or heal (choose one) | Do not apply per affected unit; no immunity |
| `hero/paladin/8-charged` | Last Bastion, bigger area + heal+ward+Weaken | One composite action | Improve original ward or Weaken (choose one) | Strongest mitigation wins; no extra area |
| `hero/mage/8-tap` | Astral Detonation, area/primary emphasis | One explosion | Greater original primary-target potency | No added fracture where not authored |
| `hero/mage/8-charged` | Arcane Cataclysm, area + Fracture | One explosion | Longer authored Fracture | No added damage zones |
| `hero/ranger/8-tap` | Hunter’s Salvo, multi-target arrows | One salvo across all targets/arrows | Improved original shot effectiveness | No more arrows or target cap |
| `hero/ranger/8-charged` | Grand Hunt, two/three arrows per target | One hunt across burst salvo | Improved original precision/defense interaction | No per-arrow rerolls, no further arrows |

## 3. Companion and pet inventory — 39 action families

`party.js` owns Soldier and Archer **ordinary basics**, **first automatic specials**, and **second charged specials**: six activation families. Their separate `u.cd`, `u.skill1Cd`, `u.skill2Cd`, `skillGlobalCd` and `healCd` are **not** PR #439's hero Skill 1 clocks. Soldier's survival guard is a **reactive self-defense trigger** and must be inventoried as a potentially eligible separate action only if source establishes a discrete release; it must not also crit merely from damage interception. Ranger party Heal is a separate **support cast** sourced to an individual Ranger. `party-pets.js` defines **11 pets** on the same party roster, each with one basic and two named special skills = **33 activation families**. Their special on-hit self/ally healing and ward must inherit one release result.

| Proposed pet keys (basic / first / second) | Pet | First | Second | First crit direction | Second crit direction |
| --- | --- | --- | --- | --- | --- |
| `pet/thorn/{basic,1,2}` | Thornpup (melee) | Dynamic Entry | Tripwire | Stronger original target strike | Longer existing multi-target Slow |
| `pet/crypt/{basic,1,2}` | Little Lifebinder (ranged) | Stay Alive | Algor Mortis | Greater original self/one-ally heal after contact | Longer original Slow |
| `pet/mire/{basic,1,2}` | Mireling (melee) | Hydraulic Hop | Little Inundation | Longer existing Slow | Bounded potency on existing group hits |
| `pet/archive/{basic,1,2}` | Pocket Keeper (ranged) | Water Jet | Undertow | Bounded original jet hit potency | Longer existing line Slow |
| `pet/ridge/{basic,1,2}` | Little Treasurer (melee) | Coinage Bonk | Rolling Cargo | Bounded opening strike potency | Bounded original line impact |
| `pet/mine/{basic,1,2}` | Pebble Colossus (melee) | Punching Shear | Tiny Compaction | Slightly longer/better original personal ward | Longer group Slow |
| `pet/warlord/{basic,1,2}` | Ash Cadet (melee) | Cleaving Combo | Pursuit Sweep | Bounded group potency | Bounded original sweep hit |
| `pet/abyss/{basic,1,2}` | Veyrith Whelp (ranged) | Compressor Puff | Wake Vortex | Bounded original single strike | Longer existing vortex Slow |
| `pet/citadel/{basic,1,2}` | Little Marshal (ranged) | Precise Contouring | Fractional Resurfacing | Bounded line-hit potency | Longer authored Slow |
| `pet/cindermaw/{basic,1,2}` | Cinder Cub (melee) | Little Cordon | Parens Patriae | Bounded group potency | Slightly better original ward |
| `pet/darklord/{basic,1,2}` | Pocket Sovereign (melee) | Veteran’s Repertoire | Pathfinder’s Gambit | More effective existing wounded-target bonus | Bounded original line follow-up |

**Troop candidate table (not approved):**

| Proposed action key | Real behavior / proposed lever | Critical roll boundary |
| --- | --- | --- |
| `troop/soldier/basic` | Sword basic; bounded existing hit potency / armor interaction | Each committed basic |
| `troop/archer/basic` | Archer ranged projectile; precision without extra arrows | On launch, not impact |
| `troop/soldier/first` | Power Strike; may also give existing Veteran ward. Candidate: slightly better *existing ward* when eligible, else bounded hit potency | Valid special release after own cooldown tests |
| `troop/archer/first` | Triple Shot; no fourth arrow; one outcome for full burst | Volley release |
| `troop/soldier/second` | Holy Cleave, area; bounded current hit potency | Charged special resolution after valid charge |
| `troop/archer/second` | Piercing Volley, line; bounded current piercing effectiveness | Charged volley release, not per target |

**Additional individually audited support/reactive activations (not counted in the above 39):** `troop/archer/ranger-heal` (`party.js::rangerSupport`; one heal over five seconds, no re-roll per tick), `troop/soldier/survival-guard` (reactive defense: `P` until exact release boundary reviewed), Ranger Heal queuing (excluded, no cast), and pet ward/ally-heal *consequences* (not separate rolls). Any action on workers that is not a combat move must not accrue automatic crits.

## 4. Hostile authored boss inventory — 54 named attack slots

Source: `src/prototype/data.js` boss descriptions cross-checked against `rules.js::attacks`, `boss-combat.js`, `cindermaw-combat.js`. **11 boss families, 54 slots in current source**; Normal/TRUE form distinctions are *separate runtime scenarios* even where one stable plan ID is shared. This revises the historic `MONSTER_ATTACK_V09_HOUSEKEEPING.md` count of **46** visual attack IDs. **Do not report that historical 251-ID presentation register as the current executable critical count** before regenerating. Per-slot role and release boundary must be examined at authored move/motion level.

| Proposed key | Boss | Slot | Current move | Critical-design constraint / next action |
| --- | --- | ---: | --- | --- |
| `boss/thorn/0` | Thornfang | 0 | Use-of-Force Escalation | line/cone damage — potency only, not footprint; exact critical magnitude **TBD** |
| `boss/thorn/1` | Thornfang | 1 | Dynamic Entry | marked leap — preserve trajectory & recovery; exact critical magnitude **TBD** |
| `boss/thorn/2` | Thornfang | 2 | Tripwire | line Slow — bounded duration; exact critical magnitude **TBD** |
| `boss/thorn/3` | Thornfang | 3 | Quick Reaction Force | summon — keep 3-pup cap, seek non-count variant; exact critical magnitude **TBD** |
| `boss/crypt/0` | Lifebinder | 0 | Excarnation | cone + knockback — safer bounded push; exact critical magnitude **TBD** |
| `boss/crypt/1` | Lifebinder | 1 | Stay Alive | three bolts — one result for all; exact critical magnitude **TBD** |
| `boss/crypt/2` | Lifebinder | 2 | Clerk of Works | summon attendants — preserve safety cap; exact critical magnitude **TBD** |
| `boss/crypt/3` | Lifebinder | 3 | Differential Settlement | persistent patches — consequence only, no lifespan/draw changes; exact critical magnitude **TBD** |
| `boss/crypt/4` | Lifebinder | 4 | Algor Mortis | Slow-only ring — bounded Slow; exact critical magnitude **TBD** |
| `boss/crypt/5` | Lifebinder | 5 | Anastylosis | defensive assembly — bounded mitigation duration; exact critical magnitude **TBD** |
| `boss/mire/0` | Mirejaw | 0 | Fluvial Incision | bite/conditional death roll — no extra roll ticks; exact critical magnitude **TBD** |
| `boss/mire/1` | Mirejaw | 1 | Hydraulic Jump | charge — no more travel; exact critical magnitude **TBD** |
| `boss/mire/2` | Mirejaw | 2 | Inundation | mud beds — Slow only, same hazard ticks; exact critical magnitude **TBD** |
| `boss/mire/3` | Mirejaw | 3 | Flood-Pulse Recruitment | summon — current cap unchanged; exact critical magnitude **TBD** |
| `boss/archive/0` | Drowned Keeper | 0 | Anchor swing | anchor hit/capture — preserve unique victim and grab count; exact critical magnitude **TBD** |
| `boss/archive/1` | Drowned Keeper | 1 | Water jets | paired water lanes — same warning geometry; exact critical magnitude **TBD** |
| `boss/archive/2` | Drowned Keeper | 2 | Undertow | patch Slow — bounded Slow; exact critical magnitude **TBD** |
| `boss/archive/3` | Drowned Keeper | 3 | Echo call | summon echoes — cap unchanged; exact critical magnitude **TBD** |
| `boss/archive/4` | Drowned Keeper | 4 | Cooldown Sabotage | cooldown sabotage — capped extra debt; avoid lockout; exact critical magnitude **TBD** |
| `boss/ridge/0` | Ridge Tyrant | 0 | Coinage Blow | hammer hit — bounded outcome; exact critical magnitude **TBD** |
| `boss/ridge/1` | Ridge Tyrant | 1 | Rolling Cargo | cargo moving projectile — one roll, unchanged obstruction; exact critical magnitude **TBD** |
| `boss/ridge/2` | Ridge Tyrant | 2 | Toll Collection | charge lane — no extra contact ticks; exact critical magnitude **TBD** |
| `boss/ridge/3` | Ridge Tyrant | 3 | Payroll Order | summon archers — cap unchanged; exact critical magnitude **TBD** |
| `boss/mine/0` | Stone Colossus | 0 | Punching Shear | core-opening strike — don't change original exposure window without review; exact critical magnitude **TBD** |
| `boss/mine/1` | Stone Colossus | 1 | Progressive Collapse | successive falls and supports — no extra falling stones/supports; exact critical magnitude **TBD** |
| `boss/mine/2` | Stone Colossus | 2 | Dynamic Compaction | two shockwaves — one result, fixed number and spacing; exact critical magnitude **TBD** |
| `boss/mine/3` | Stone Colossus | 3 | Pile Driving | charge/core opening — do not alter 3s fairness window without review; exact critical magnitude **TBD** |
| `boss/mine/4` | Stone Colossus | 4 | Mass Underpinning | summon wardens — cap unchanged; exact critical magnitude **TBD** |
| `boss/warlord/0` | Ashen Warlord | 0 | Cleaving combo | two cleave arcs — one result per committed authored attack vs separate beat pending owner decision; exact critical magnitude **TBD** |
| `boss/warlord/1` | Ashen Warlord | 1 | Banner Bombardment | six artillery circles — same footprints, no added marks; exact critical magnitude **TBD** |
| `boss/warlord/2` | Ashen Warlord | 2 | Guard command | guard command — no extra units; exact critical magnitude **TBD** |
| `boss/warlord/3` | Ashen Warlord | 3 | Pursuit charge | charge lane — no altered warning/recovery; exact critical magnitude **TBD** |
| `boss/abyss/0` | Abyss Dragon | 0 | Compressor Surge | compressor cone — bounded outcome; exact critical magnitude **TBD** |
| `boss/abyss/1` | Abyss Dragon | 1 | Wake Vortex | expanding ring — consequence only; exact critical magnitude **TBD** |
| `boss/abyss/2` | Abyss Dragon | 2 | Lazy Eight | two marked aerial landings — sequence receipt semantics need owner review; exact critical magnitude **TBD** |
| `boss/abyss/3` | Abyss Dragon | 3 | Scramble Order | summon defenders — cap unchanged; exact critical magnitude **TBD** |
| `boss/citadel/0` | Ash Sentinel | 0 | Microdermabrasion | nine canister fragments — one outcome across nine, preserve aggregate cap; exact critical magnitude **TBD** |
| `boss/citadel/1` | Ash Sentinel | 1 | Dress Ranks | formation movement — phase/command candidate, no extra guards; exact critical magnitude **TBD** |
| `boss/citadel/2` | Ash Sentinel | 2 | Deep-Tissue Contouring | five-leg charge — one action vs leg boundaries to decide; exact critical magnitude **TBD** |
| `boss/citadel/3` | Ash Sentinel | 3 | Fractional Resurfacing | 16-tile board — do not expand board/beat or add tiles; exact critical magnitude **TBD** |
| `boss/citadel/4` | Ash Sentinel | 4 | Volumize | summon soldiers — cap unchanged; exact critical magnitude **TBD** |
| `boss/cindermaw/0` | Cindermaw | 0 | Cordon Sanitaire | contracting cordon — no smaller safe gap; exact critical magnitude **TBD** |
| `boss/cindermaw/1` | Cindermaw | 1 | Administrative Distraint | temporary buff-strip lunge — no extra stripped categories; exact critical magnitude **TBD** |
| `boss/cindermaw/2` | Cindermaw | 2 | Parens Patriae | protect Ash beasts — bounded defense, no new retaliation targets; exact critical magnitude **TBD** |
| `boss/cindermaw/3` | Cindermaw | 3 | Index of Multiple Deprivation | seven seals — no new locations/ticks; exact critical magnitude **TBD** |
| `boss/cindermaw/4` | Cindermaw | 4 | Horizontal Fiscal Equalisation | actual-damage-linked heal — preserve actual HP-loss accounting; exact critical magnitude **TBD** |
| `boss/cindermaw/5` | Cindermaw | 5 | Devolution of Authority | up to 4 delegated attacks — fixed composition/cap; one execution vs delegate action; exact critical magnitude **TBD** |
| `boss/cindermaw/6` | Cindermaw | 6 | Mutual Aid Agreement | summons + TRUE elite captains — fixed 6/8 caps; exact critical magnitude **TBD** |
| `boss/darklord/0` | Dark Lord | 0 | Veteran’s Repertoire | single special — exact table inspection before special effect; exact critical magnitude **TBD** |
| `boss/darklord/1` | Dark Lord | 1 | Pathfinder’s Gambit | mobility path — preserve native protection/retreat; exact critical magnitude **TBD** |
| `boss/darklord/2` | Dark Lord | 2 | Royal Muster | muster summons — cap unchanged; exact critical magnitude **TBD** |
| `boss/darklord/3` | Dark Lord | 3 | Freedom Has a Price | boss special — high-risk status, exact review; exact critical magnitude **TBD** |
| `boss/darklord/4` | Dark Lord | 4 | No More Heroes | boss special — high-risk status, exact review; exact critical magnitude **TBD** |
| `boss/darklord/5` | Dark Lord | 5 | Royal Taxation | royal levy — four-hit cap and marked roster unchanged; exact critical magnitude **TBD** |

## 5. Hostile captains — 21 authored attacks + 5 phases

Source: `rules.js::roomCaptains` and `boss-combat.js`; Dreadmaw has extra native resolution in `dreadmaw-combat.js`. Current source defines **five** captain profiles and **21** named attack slots, compared to the historical register's **16**. The five named **phase transitions** are listed below separately as **`P/E` until source establishes an actor-owned attack release**; their VFX presentation does not itself create another roll.

| Proposed key | Captain | Authored slots (zero-based) | Phase (not automatically an attack) | First critical direction |
| --- | --- | --- | --- | --- |
| `captain/supply-vale/{0..4}` | Scornfang | `0` Selective Deconstruction; `1` Encapsulation; `2` Dust Entrainment; `3` Cradle-to-Grave Tracking; `4` Hot Zone | Corrective Action | Preserve marked shape; use effect-specific bounded improvement, never extra phases/reinforcements |
| `captain/supply-march/{0..2}` | Direjaw | `0` Flow Sliding; `1` Sand Boil; `2` Mud Pumping | Elastic Rebound | Preserve marked shape; use effect-specific bounded improvement, never extra phases/reinforcements |
| `captain/supply-highlands/{0..2}` | Crag Tyrant | `0` Hostile Takeover; `1` Margin Call; `2` Bad Deal | Hostile Liquidation | Preserve marked shape; use effect-specific bounded improvement, never extra phases/reinforcements |
| `captain/supply-crown/{0..6}` | Dreadmaw | `0` Subsoiling; `1` Transhumance; `2` Ensiling; `3` Nucleus Herd; `4` Purse-Seine Closure; `5` Creep Feeding; `6` Evapotranspiration | Ash Carapace | Preserve marked shape; use effect-specific bounded improvement, never extra phases/reinforcements |
| `captain/frontier-overseer/{0..2}` | Cinder Warlord | `0` Inspection Cleave; `1` Violation Marker; `2` Compliance Charge | Mandatory Overtime | Preserve marked shape; use effect-specific bounded improvement, never extra phases/reinforcements |

## 6. Ordinary hostiles, Rogue layer, night, healing and cross-cutting behavior

**Species set in current data:** Goblin, Skeleton, Mireling, Reed Beast, Wolf, Ogre, Orc, Archer, Ash Beast, Crown Soldier, plus night-exclusive Wraith and Stalker. For each of these **12 species**, inventory basic melee, compatible native/forced ranged role, ordinary/guardian/ringleader variants, and any Frenzy or support eligibility. `engine.js::updateEnemies` / `boss-combat.js::enemyStartBasic` handle basic execution; `combat.js` handles projectile travel/contact and actual HP loss. The seven explicitly authored ranged profiles are Goblin slinger, Skeleton bow guard, Reed Beast spitter, Mireling spitter, Ogre stone thrower, Orc axe thrower, Ash Beast cinder spitter; **forced ranged variants also exist** and must be derived from real `configureEnemy` rather than assumed to equal these seven.

| Existing family / reference | Typical source identities | Proposed critical lever | Gate |
| --- | --- | --- | --- |
| `enemy/{species}/melee` | 12 species, plus boss/captain melee role identities | Modest species-specific physical effect; avoid blanket double damage | Same contact/range/guard |
| `ranged/{species}/{style}` | Native & forced species/role projectiles | Stronger pre-existing Slow or a modest style-specific hit characteristic | Roll launch once; no projectile-count or speed change |
| `rogue-basic/{tier}/{role}/{species}` | Normal / guardian / ringleader × melee/ranged | Longer applicable Slow, bounded shove or longer existing Dust cover | Actual role/region/source mechanic governs, not label |
| `rogue-signature/{tier}/{role}/{species}` | Ringleader species×role and captain/boss signatures | One authored signature-specific improvement | Preserve all warning, retreat/geometry and safety rules |
| `night/wraith/drain` | Wraith Soul Drain: Slow and HP siphon after real loss | Modest Slow duration or bounded recovery based on actual HP | No extra targets, double heal, new area |
| `night/stalker/pounce` | Stalker Shadow Pounce movement/landing | Bounded existing on-hit Slow | No added landing radius/travel |
| `enemy/support-heal/{source}` | 12 species names + eligible bosses/captains; one multi-recipient heal cast | Greater existing total heal once per cast | No per-recipient roll; restore over 5s and max HP |
| `boss/recovery/{family}` | Abyss Go-Around; Citadel Ash Reforge; Dark Lord Second Wind | A little more of the authored eligible heal | Respect original warning, interrupt/retreat, threshold and one-use limits |
| `boss/passive-siphon` | Lifebinder/Archive/Dark Lord and other eligible damage-based recovery | **No separate roll**; optionally inherits the owning hit's chosen critical effect only | Based on actual lost HP; avoid multiplying twice |
| `enemy/frenzy/{species}` | Ringleader Frenzy | **E:** passive state/presentation, not independent action | Could still modify chance later, not extra critical action |
| `environment/{spikes,jet,seal}` | Traps in side, main and outdoor mini interiors | **E:** environmental hazards, no combatant release | Keep as traps; no boss-free crit |
| `cindermaw/retaliation`, `dreadmaw/phase`, guard reactions | Specialist reactive/phase behaviors | **P:** identify a discrete skill release before granting an independent chance | No reciprocal infinite crit loops |

**Important exact lore/mechanics distinction:** Goblin Blinding Dust applies hit-dependent Slow to struck victims but grants the **Goblin attacker** temporary protection from direct targeting (`rogueDustCoverUntil`); area attacks may still hit. A critical could enhance the two existing outcomes independently, but must not make the struck player untargetable. Similarly, Slow refresh/stack debt, damage immunity, taunt, ward, suppression, existing phase defenses and staggered warnings must use their native owner and counters.

**Registry work needed:** The existing source-derived visual registry (`scripts/enemy-vfx-inventory.cjs`, `scripts/monster-attack-audit.cjs`) defines a deterministic stable-ID inventory by boss/captain/night/ranged/Rogue/basic/Frenzy group. Historical docs say **251 VFX identities** (46 boss moves, 16 captain attacks, 5 phase, 2 night, 18 ranged, 84 Rogue basics, 40 signatures, 28 melee basics, 12 Frenzy). Because current boss/captain source *alone* is now **54 + 21**, the historical 251 must **not** be used as a complete new critical-action roster, nor should it be arithmetically adjusted and called verified. At the Stage 0 verification gate, run the existing read-only generator against a **reconciled #439/latest-main source tree**, then diff its actual rows and map each *eligible action* to this semantic register. The historical IDs are also not proof that phase/recovery/Frenzy are separate actions. No executable extraction or CI was run during this documentation pass.

## 7. Activation-boundary and regression matrix

| Boundary | Must prove | Focused test outline |
| --- | --- | --- |
| PR439 stationary + moving auto basic | One crit per successfully initiated basic beat, Combo beat 3 splash shares outcome; passive auto never opens protected Thornfang | 3 classes × movement/stillness/3-beat |
| PR439 Skill 1 Tap | Paladin holy, Mage beam, Ranger 3 arrows all roll once; Tap does not lock Charged timer | Three classes; ready/blocked/target missing |
| PR439 charged cross | One roll at release; both separated pulses share it | 2 pulses / 8-target cap / kill-or-exit between pulses |
| PR439 charged wide beam | One roll despite no cap on targets | 1, 5, 12 aligned foes, terrain/immune |
| PR439 charged hawk | One roll at launch; no reroll each homing tick/contact/retreat gate | Travel exhaustion, misses, collision, current-versus-scripted retreat |
| PR439 Skills 2–8 | Charged starts both lockouts; Tap during Charged-only recovery does not reroll Charged or reset its timer | 3 classes × 7 slots; interrupted charge / mixed queued input |
| Companion second charge | Roll only at successful post-preparation release; no crit for interruption | Soldier, Archer, all pet slot2 |
| Pet ranged + support | Release receipt survives projectile; original self/ally healing occurs once per legitimate hit | All 11 families, immunities, no extra recipient |
| Enemy support | One roll for one multi-target healing action; not recipient/tick | 1, 4, 8 wounded targets / full-health case |
| Rogue Dust & withdraw | Cover belongs to attacker, Slow to victim, legal hit/retreat only | Protected target, native fallback & Hawking PR439 interactions |
| Boss sequenced skills | Define whether one authored move with internal beats or multiple new releases; no duplicated crit markers | Stone Colossus waves, Ash Sentinel checkerboard, Cindermaw delegates, Dreadmaw motion |
| Summon skills | One roll per summon CAST; its summoned actors later roll their own attacks | Cap, reset, excess summon denial, Nightmare/TRUE |
| Visual cue | Separate max-12 marker queue, actual-draw-aware lifetime; no saved statistic entries | Canvas/Pixi overlay × Auto FPS/frame-skip/critical emergency |
| Book/save compatibility | Distinct claims per side interior, no duplicate; derived bonus survives intended succession | v4 legacy, PR439 timer migration, peace, reload, reserve/pets |

**Performance-critical guard:** no per-frame rate calculation for all 200 roster members; no roll in simulation tick/AI consideration; no per-hit roll; no extra projectile/summon/trap/telegraph geometry; preserve capped 40 normal effects and independent planned 12-crit cue cap. Don't start a visible marker until it can be drawn. Better crowd-control/healing might change encounter length and workload even when direct code cost is O(1) per release.

## 8. Stage 0 completion criteria and handoff

**Source inventory delivered:** 51 PR439-target hero action families, 6 core Soldier/Archer attacks + 33 pet action families, 54 boss slot descriptions across 11 families, 21 captain slots across 5, 5 captain phases flagged for non-action review, 12 species ordinary/role/Rogue dimensions, 2 night skills, enemy/party healing, recovery, exclusions and special owner calls. These categories can overlap the historic VFX rows and **must never be summed into one “unique combat moves” figure**.

**What is NOT complete yet:** owner approval of exact critical effect and cap for each skill, version-verified regeneration of the historic enemy registry, proof of every timing boundary in real execution, #439's remaining A/V/UI and final code stabilization, reconciliation with #436 and executable focused tests. Until then, **Stage 0 is a mapped design inventory with review gates, not a certified implementation-ready registry**. Next narrow engineering deliverable: read-only extraction/enumeration tool & test against the reconciled PR439 target source; then approve each explicit effect before implementing Stage 1's dormant probability API. No default universal critical multiplier to cover unmapped entries.

**Provenance:** `main` / PR #440 base `e4e8234b5f784ddc9492fe79d956fd0a696b12af`; PR #439 head `f2ef5de159bb10721ab96c554fb3806f34bd8eb9`. No merge, CI, test run, release or deployment performed. 
