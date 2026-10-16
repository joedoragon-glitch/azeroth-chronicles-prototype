# Ironroot Highlands — royal audience canon-to-code audit (12 October 2026)

> **OWNER DECISIONS + ENGINE AUDIT; DOCUMENTATION ONLY.** This record follows the Ironroot royal meeting and its requested source/feasibility audit. It is not a patch, a passed full regression, an authorized merge, or a deployment. Treat the next worldbuilding update as **one integrated, owner-approved publication**, with all selected approved drafts reconciled. Read [#232](../issues/232) and [#251](../issues/251) for the controlling source/release distinctions.

## 1. Authority and source-state boundaries

**Published baseline:** v0.9.0 on main. **Not published:** [#230](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/230) Ridge redesign; [#231](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/231) Crag redesign; Garun parent/follow-up chain [#253](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/253) → [#264](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/264) → [#279](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/279); and Ironroot coin-production [#259](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/259). Draft [#285](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/285) attempts selected four-boss technical integration but says explicitly that it is incomplete; it is **not** evidence of completed Ridge/Crag/Garun integration.

| Character / matter | Released main | Approved future canon/design | Draft implementation evidence |
| --- | --- | --- | --- |
| **Ridge Tyrant** | Field boss, family ridge; level 8; 2,400 Normal base HP; 36 base damage; Master of Coin; Orin captive | Financial combat identity and six identified mechanics below; not a dungeon successor | Substantive code in #230, unmerged |
| **Crag Tyrant** | Named Wolf Treasury captain, not a boss/TRUE form; old Wolf visuals and species record | **New 12 October owner correction: SAME SPECIES AS RIDGE TYRANT**, a horned humanoid mountain tyrant, NOT a Wolf. Retains discipleship, Treasury command, approved named attacks and mechanics | 1,650 HP and financial captain mechanics in #231; **species change is NOT implemented on main or #231** |
| **Garun the Firstborn / Stone Colossus** | Dungeon boss, family mine; level 9; 3,200 Normal base HP; 42 base damage; legacy ancient-guardian narrative is **obsolete** | Locked former companion/Ogre Bastion biography, council architect/security duties, Dara contradiction, seven engineering skills; do not reopen | #253 implements, #264 improves combat legibility, #279 fixes actual mechanics; all unmerged and dependent |
| **Ironroot crowns** | One kingdom currency; Stonecross minting, Quarry Outpost, caravan economy and mountain community | Separate silver and copper extraction, Dark Lord portrait on circulating crowns; **no fixed alloy ratio or invented coin reverse** | #259, unmerged; Wolf cavalry remains deferred |

The latest explicit owner decision takes precedence over older issue descriptions and legacy text. A design approved by the owner is **not** implementation or QA evidence. A green test on a parent branch is **not** proof that later dependent branches or the combined candidate pass.

## 2. Regional continuity: preserve the existing world

Ironroot Highlands remains levels 7–10 and a mountain/pine, stone-quarry and mineral-production province: Stonecross, Quarry Outpost, ferries/caravans, steep connected terraces and switchbacks, stone and timber bridges, old mountain watchtower/keep, field-boss Treasury, Colossus Mine, Wolf territory and Ogre households. The Crown Peace provides wages, functional roads, minted crowns and caravan escorts, without erasing coerced labor or dissent. Wolves and Ogres have homes and ordinary lives; do not turn all residents into troops or a new industry.

Preserve **three collectible Treasury caches with their exact per-cache IDs**, access, guards and rewards; Orin and Dara as **independent rescues**; field-boss/dungeon-boss/TRUE identity; the Mine's **18 guards and 18 traps**, walkable repairs, forge, routes and exits; fixed combat/progression/quest flags, historical v4 saves, all pre-earned TRUE victories credited under approved ending [#266](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/266), and neutral peace. Preserve the one currency even where internal save fields still say gold. No new royal ministries, economic system, specie-wide redesign, fourth class, extra regions, or Wolf cavalry have been authorized here.

## 3. Ridge Tyrant — approved design and runtime translation

**Identity:** The Dark Lord's competent **Master of Coin** and Highlands **field boss**, not Garun's dungeon successor. He manages accounts, wages, roads, mint distribution, protected mineral caravans and archers. Believes circulating crowns and maintained infrastructure substantiate the regime's benefits; that does not make coercive ownership or Orin's captivity benign. No new appointment has been made.

**Approved mechanics in #230** (Normal and TRUE share identities, preserving existing true/difficulty modifiers and original base HP/damage):

| Category | Selected name | Expected existing/proposed-to-merge behavior | Audit evidence / remaining gate |
| --- | --- | --- | --- |
| Regular 0 | **Coinage Blow** | Existing warned frontal melee/hammer arc, unchanged base mechanic | data.js label and four-slot rules; verify in actual encounter |
| Regular 1 | **Rolling Cargo** | Real moving cargo projectile with damage and knockback, not merely a pretend cart | #230 rules.js marks a line/cargo, boss-combat.js spawns moving projectile, combat.js collision/displacement, renderer draws cargo. **Description discrepancy:** #230 data.js says “marks one landing point” while actual rules use a line/moving projectile. Match player-facing description, warning geometry and hit corridor on final candidate |
| Regular 2 | **Toll Collection** | Warned charge with original damage, physical shove and **2-second slow** on hit | #230 boss-combat.js charge contact resolver; test line/path/telegraph and slow |
| Regular 3 | **Payroll Order** | Existing three contracted archer reinforcements; bounded summon rules. Archers favor measured high-damage attackers | #230 engine.js AI resolves threat for owned ranged summons; test summons/target switches and LOS |
| Timed triggered | **Ledger Audit** | Every **12 seconds**, mark the recorded high-damage dealer for **5 seconds**; payroll archers focus mark while active | #230 engine.js uses existing tacticalThreatSnapshot. Its lookback is the shared **6-second threat window**, not necessarily the whole 12-second cycle; verify actual owner-intended target behavior and visible mark, including an empty/expired ledger |
| Existing combat stance | **Ledger of Losses** | Ledger opens immediately on engagement; **ground telegraph graphics** suppressed, not attack execution windups, audio and legible actor cues | #230 engine.js ledgerOpen, renderer.js visible carried ledger, combat-visuals.js filters ALL Ridge telegraph ground drawings. **Risk:** this also catches rogue/other warnings; validate counterplay and hidden/explicit skill cues, especially mobile |
| Basic rogue | **Stone Feint** (existing registry) | Separate single-target shove tactic; not a fifth ordinary boss attack | tacticalFoundation rogueMoves.bosses.ridge |
| Rogue signature | **Payroll Screen** (existing registry) | Tactical rally and bounded existing guard-post replenishment; not Payroll Order, and not a free global summon | rogueSignatures.bosses.ridge + tacticalRogueCommanderSupport; verify only eligible guard records |

**Important semantic mismatch to resolve:** Rolling Cargo is a *moving line projectile* on #230 but still described as a point-marker in the attack prose. Fix presentation and text to the actual approved movement/collision behavior, rather than silently changing the projectile to match stale wording. Likewise Ledger of Losses must not remove every usable anticipation cue simply because graphics are suppressed.

No extra Ridge passive, numerical buff, new department or redesigned species is approved by this meeting.

## 4. Crag Tyrant — owner-locked species correction plus existing captain kit

**Explicit royal decision (12 October):** Crag is **the same species as Ridge Tyrant**, with Ridge's established **horned humanoid mountain-tyrant anatomy**, NOT a Wolf. Crag is still an individual, trusted disciple and **Treasury captain/household protector**; no biological relationship or formal new species label is asserted. The existing ordinary **Wolf Treasury guards remain Wolves**. Crag is NOT promoted into a field/dungeon boss, does NOT gain TRUE, and retains the named abilities and fight design approved in #231.

**Source-verified correction scope:**
- main and #231 **world.js** create the named captain from Highlands ordinary species Wolf; **engine.js** sets the roomCaptain/captainProfile while preserving that species. Existing loaded saves retain the Wolf species.
- **visuals.js** draws ordinary captains according to species (Wolf body) and separately applies a Wolf-disciple collar/brow finish when mentored by ridge. **sprites.js** chooses an enemy:species captain key rather than a boss:ridge key. A name-only change, profile mentor tweak, or boss sprite swap will not correctly change anatomy through every render path.
- Implement a **Crag-specific identity/render migration**, keyed to stable named captain profile **supply-highlands**, during spawn **and existing-save restore/population**. Use Ridge-consistent horned humanoid appearance (procedural fallback and sprite-selection support if applicable) without globally changing Wolves, other ogres or the actual boss family ridge. Preserve Crag's own readable silhouette, scale, equipment/command identity, melee role, targeting/collision, attack authority and captain type.
- Avoid setting e.type = boss or changing the boss family/TRUE registry merely to reuse Ridge artwork; that would break combat lifecycle, rewards, flags or boss-specific logic. Treat the chosen underlying species/visual key as an implementation detail pending exact integration, not a newly decreed canonical taxonomy.
- Update all player-visible terminology, regional historical source if used for new game content, sprite manifest/fallback, enemy VFX materials, impact sounds, and named-captain portrait/identifier. Wolf howls and quadrupedal bite/claw cues must not survive where inconsistent with his new body.
- Migration must preserve stable captain ID, dead/alive state, three cache IDs, existing guard records, wounds/revive-on-load conventions, Treasury versioning and **#231's one-time authoritative 1,650 base-HP migration**; no multiplying new HP through legacy stat budgets.

**#231 approved combat, unchanged by species conversion:**

| Category | Approved name | Engine contract / evidence |
| --- | --- | --- |
| Captain regular 0 | **Hostile Takeover** | Real line charge; old 0.95s warning when conventional, 1.25× coefficient |
| Captain regular 1 | **Margin Call** | **Five separated** marked impact circles at unchanged individual 86 radius (before standard boss range scaling), with no overlapping stacked damage |
| Captain regular 2 | **Bad Deal** | **360-degree** area hit: both collision and visible warning must be a true full circle, not a disguised narrow cone |
| One-time phase at **55% HP** | **Hostile Liquidation** | 1,650 base HP, **+35% movement** from phase; no separate TRUE. **Audit discrepancy:** #231 implementation reuses generic kind:howl logic that ALSO applies **captainAttackRate = 0.75** (25% shorter basic attack cooldown), quickens active cooldowns and changes action readiness. The cited approval expressly calls out movement, not this extra attack-speed behavior. Reconcile this incidental inherited effect against owner approval; do not silently treat it as ratified |
| High-HP warning policy | **Anonymous preparation** | At **HP > 550**, ordinary captain attacks hide identity/footprint but expose a generic **0.9-second** Preparing cue. At **550 HP and below**, original skill warnings/footprints return. Rogue telegraphs must be examined separately; don't globally blind other encounters |
| Basic rogue | **Shoulder Feint** | Existing individual shove, separate from the three regular moves |
| Rogue signature | **Paid Screen** | Conditional tactical rally; only refills bounded *existing*, local guard records under its existing eligibility/caps. Retain Wolf guards even after Crag's body conversion |

**Interaction check:** Hostile Liquidation triggers at 55% HP (907.5 of 1,650 unscaled), whereas full skill footprint warnings do **not** return until the last 550 HP. This intentionally creates a phase interval where the captain is faster yet his regular attacks still use anonymous preparation. Test this interval for real fairness on desktop and phone. No new passive, summon limit, or damage buff is approved.

**Protection:** #231 captain regression covers five zones, attack shape separation, warning fatigue, HP and save migration. It does **not** cover a non-Wolf Crag and is not proof of this newly approved correction. Build named-captain species/render/save tests that fail against the old Wolf implementation and pass only after the full conversion.

## 5. Garun the Firstborn — immutable biography/engineering contract

**Identity already approved in #253/#242:** Garun is the Dark Lord's loyal old Ogre Bastion companion and council architect. He **chose** his fitted stone body and luminous heartstone after holding a collapsing gate. He conceived the realm's interlinked roads, monster-specific settlements and relocations. He oversees **Mine structural safety and security**, Ogre wardens and Wolf sentries, not mint administration (Ridge's responsibility). He enjoys inspecting civil works, geometric sculpture and amusingly useless machines and resents endless requests for new buildings. Dara receives reasonable payment for compelled repairs and artwork but **cannot leave**; wages do not cancel captivity or the key-gated independent rescue. His potential successor rule is a benevolent-sounding but **compulsory** infrastructure/shelter regime, not a scheme against his friend. “Ancient isolated creature accidentally mined out,” “Kharun” and the estranged/resentful biography are **superseded**. Fix remaining main source text during actual integration without retconning existing Mine geometry or cleared flags.

**Seven LOCKED names and exact mechanics; no renaming or eighth move:**

1. **Punching Shear** — 1.6s circular warning; 1.4× hit; expose core **2.5s**, exposed core receives **+25% incoming damage**.
2. **Progressive Collapse** — **three sequential** impacts with 1.7s marking, each 1.4×; display construction previews; afterwards **up to two** collision-bearing Mine supports lasting **9 seconds**; do not block traps, actors, Dara or exit/required paths; no stacking/permanent props/saved barriers.
3. **Dynamic Compaction** — 1.6s warning; **two expanding full-damage rings** separated about **0.7s**, with **1.5s slow** per landed hit; real dodge opportunities/no forced unavoidable lock.
4. **Pile Driving** — visible 1.7s lane warning; 1.4× charge; unconditional **3s** core opening whenever charge terminates, including collision/clear endpoint.
5. **Lateral Load Transfer** — separate **1.3s warned lateral slab lane**; 0.6× and **up to 100 world units** sideways push through traversable space only; hit is decided by actual lane occupants, not exclusively original target.
6. **Passive Earth Pressure** — **active tactical Rogue signature**, **not an always-on passive** despite technical term; 1.65s frontal sector, about 195 reach, 0.1× damage, ~95 knockback, defensive counter-pressure.
7. **Mass Underpinning** — 1.8s summon call; **three max Normal / six max TRUE** Ogre wardens, TRUE including two elite ringleaders; retain existing **7s Normal / 5.5s TRUE** summon cooldown schedules.

Only one existing ~50%-HP tactical escalation favoring Collapse/Compaction is intended. Five original boss slots and two independent tactical moves remain stable. Off-combat Mine inspection stops on aggro. All original forms, 18 guards/traps, heartstone contract, 18-trap navigation and Dara key/recovery remain protected.

**Engineering translation and prior fixes:**
- #253 implemented the seven distinct moves, patrol, gallery and captive relationship on an isolated draft; its earlier automated tests are not the final integration gate.
- #264 correctly separates passable projected supports from completed solid obstacles and indicates exposed core only when the actual e.open timer is active.
- #279 corrects **previewed site = construction site**, aborts an occupied/unsafe support rather than teleporting it elsewhere, adds missing support previews for low-HP combo-triggered Collapse, makes the lateral lane affect any actual party occupant, and clears temporary construction on death/disengagement. #279 reports in-memory focused harness validation; **its latest exact-head GitHub/browser/mobile CI was not certified**.
- #285 is unfinished multi-boss integration; do not accidentally restore pre-#279 construction or old generic Mine moves during cherry-pick/reconciliation.

Do **not** add an unsolicited Garun passive, extra construction cycle, new dungeon master, new art style, permanent walls, or new TRUE boss identity. Preserve seven approved skill names mechanically and visually.

## 6. Actual source-level integration hazards to resolve (ordered)

**P0 — must resolve before claiming creative fidelity or release-ready mechanics:**

1. **Crag species/render/save mismatch** — #231 spawns a Wolf while the owner now approves Ridge's horned humanoid species. Apply a named-captain-only conversion, not a global Wolf/species rewrite; verify procedural fallback, sprite key, VFX/SFX and old saves/dead captain.
2. **Crag generic howl attack-rate inheritance** — #231's 55% phase includes extra 0.75 cooldown multiplier in addition to +35% movement. Confirm whether this was ever specifically approved; otherwise isolate movement without sneaking in extra attack-speed tuning. Test whole HP interval >550 and ≤550.
3. **Ridge Rolling Cargo description vs actual collision** — #230 uses an actual line projectile and renderer cargo art, but stale attack prose describes a marked landing point. Normalize wording/warnings to the authoritative mechanical choice without changing its attack physics.
4. **Ridge warning readability** — #230 suppresses ground warning drawings whenever ledgerOpen (including tactical warnings). Prove visible reaction windows via animation/sound/actor cues; resolve any anonymous/opaque unfair hit, especially phone. No fake hidden zero-windup instant attacks.
5. **Garun dependency chain** — integrate #253 → #264 → #279 in order and verify complete construction/collision semantics. Never merge #253 alone thinking its previously fixed issues are resolved there; do not regard unfinished #285 as a green combined candidate.
6. **Overlapping code** — #230 and #231 both edit engine.js, boss-combat.js, rules.js, combat.js, combat-visuals.js and protected regression fixtures; Garun touches several of the same files. Merge semantically by behavior and test, not “pick one branch,” overwriting the other.
7. **Narrative/ending and money** — reconcile #259 coin metals/portrait without silently choosing a ratio, #266 throne/TRUE already-earned flags, Garun's new story against main's obsolete Mine historical strings and game-visible text, and saved boss family identifiers.

**P1 — verify during the SAME consolidated update (not excuses to remove P0):** distinct projectile/attack VFX and SFX with truthful impact positions; three class/campaign encounter legibility and real pacing; pathing on all authored terrain; player comprehension of ranks/household roles; appropriate procedural sprite fallback and PWA caching. Do not silently omit selected owner-approved scope because a special visual or asset is inconvenient.

## 7. Candidate acceptance checklist (MUST show results, not just checkboxes)

- [ ] Source ledger per feature: **main baseline | owner authorization | final PR/commit implementation | cross-branch dependencies | test case | residual risk**; link the exact tested candidate SHA.
- [ ] **Crag anatomy:** new game + imported save show horned humanoid Crag throughout Treasury, combat and peace where represented; only named Crag changes, Wolf guards and habitats unchanged; preserved captain rank, enemy ID, damage/HP, three Treasury caches, death and historical state.
- [ ] **Crag skills:** Hostile Takeover is a charge; Margin Call has five truly separated circles; Bad Deal's displayed shape and hits cover 360 degrees; one 55% phase with correct movement; verify unintended inherited cooldown; generic visible 0.9s preparation above 550 HP and original warnings below/equal 550; two independent rogue responses and bounded guard rally.
- [ ] **Ridge skills:** four correctly scheduled regular slots, owned contracted Archer targeting, visible Ledger Audit mark every 12s for 5s with supported damage-window semantics, actual moving Rolling Cargo collision/knockback matched to warning and prose, real 2s Toll slow, readable Ledger of Losses with no invisible unavoidable attacks, both separate rogue skills.
- [ ] **Garun skills:** all 7 appear through natural scheduler, early TRUE and Awakening as applicable; supports **never** appear at unpreviewed positions, overlap occupants/traps, close exits/keys, or survive death/disengagement/save; two rings and slow, guaranteed 2.5s/3s exposure, sideways actual-lane shove, 3/6 Ogre caps/two elite TRUE members, 18 guards and traps, Dara rescued via original mechanic.
- [ ] QA with **Paladin, Mage, Ranger**; Normal, Nightmare and applicable challenge/TRUE variants; early TRUE vs crowned Awakening separated; attack pacing and usable reaction time on **desktop + touch phone** (Chromium and WebKit), including anonymous Crag prep and Ledger warning suppression.
- [ ] Regression of quests/Orin/Dara, field-boss keys, Treasury three individual collected cache IDs, historical v4 saves, death/resurrect logic, roads, bridges, terraces, wolf/ogre territories, guards/traps, sprite fallback, VFX/SFX, transport and region-specific economy, crown distribution, saved already-earned TRUE flags, neutral finale, rewards and difficulty multipliers.
- [ ] Run exact-head Node tests, protected renderer/source checks, production build, desktop/phone browser and PWA/offline install/update, full selected-boss battle tests. Record **actual** pass/fail evidence, not inherited PR-body historical CI claims.
- [ ] Independent second-pass audit comparing approved records with **rendered gameplay** and current source; owner reviews discrepancies and explicitly authorizes the **single combined merge/deploy**.

## 8. Implementation ownership and non-goals

This is an **implementation-ready audit/checklist and owner decision record**, not an implicit request to begin coding. Preserve #230, #231, #253, #264, #279, #259, #285 and the separate region audience docs [#289](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/289)/[#290](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/290). Source should be compared again at the eventual integration head; this document is date-stamped evidence, not a permanent certification.

**Explicit approvals in THIS meeting:** Crag becomes the SAME SPECIES as Ridge Tyrant; all three keep their pre-approved professional roles, character histories and existing combat choices. **Not approved here:** new passives, new ministries, reinterpretation of Garun's seven skills, new attack buffs, separate captain TRUE, new metal ratios, Wolf cavalry, branch deletion, test-guard weakening, incremental deployment, or automatic release.

**GitHub work authorized by this request: documentation only.** No gameplay source, CSS, audio, art, tests, merge, deployment or CI rerun in this PR. Future gameplay modifications need separate instruction and exact integrated certification.
