# Hero Skill 1: self-taught combat — design contract (24 October 2026)

> **Status: design / dependency review only. No gameplay implementation, numerical retuning, class charged-technique proposals, merge, or deployment is authorized by this document.**
>
> **Audit baseline:** `main` at `e4e8234b5f784ddc9492fe79d956fd0a696b12af`. [Unmerged prerequisite PR #436](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/436) removes the hero's movement requirement for automatic attacks. When this draft eventually becomes an implementation candidate, reconcile that work into the same proposed integration, do not assume #436 is deployed, and re-audit against then-current `main`.

## 1. Owner-directed meaning (approved design direction)

The hero has learned a basic combat repertoire **independently**, not from a captured/rescued specialist. Greenwood Vale is the beginning of the playable journey, **not** a claim that the hero spent their whole life there or never traveled elsewhere. This is a narrative explanation for the hero starting with Skill 1 Rank 1; do not invent a childhood, a named teacher, a new quest, a new unlock prerequisite, or a new historical feat. **"Self-taught combat" is a working descriptive term, not a confirmed in-game skill name.**

There remain **eight hero skill slots**. Within the existing Skill 1 discipline, the player can perform three related combat actions, **not** three separately learnable skills:

1. **Automatic basic attack (not a numbered UI skill):** operates by itself while stationary or moving when normal eligibility permits; retains the class's existing same-target three-beat combo and its third-beat secondary finisher. Uses its **own basic-attack cadence**, not the Skill 1 activated-technique cooldown.
2. **Skill 1 tap / normal:** inherit the exact attack currently implemented as **charged Skill 1** (Paladin focused holy projectile, Mage arcane beam, Ranger focused three-arrow burst), but it is now a **normal, immediate tap skill**. No 0.65-second charge preparation, charge snapshot, or charge-specific interruption for this promoted attack. It receives its own normal Skill 1 cooldown, independent of basic attacks.
3. **Skill 1 hold / charged:** an **unassigned design opportunity** for one new charged class-specific technique for Paladin, Mage, and Ranger. **Do not implement a placeholder attack or invent names, figures, shapes, buffs, or damage.** Design proposals and owner selection come next **within this same draft PR**.

All three derive their rank and unlocked/progression status from the **single existing `hero.skills[0]`**. Do not create another hero skill slot, learning track, trainer, curriculum requirement, upgrade currency, or separate skill rank. Skill 1 starts at Rank 1 and may advance through the existing rescued-specialist **upgrade** pathway; self-taught **initial acquisition** does not mean specialists are forbidden from refining it later.

## 2. Current code and what the change actually entails

| Concern | Audited present behavior | Intended later implementation |
| --- | --- | --- |
| Starting rank | `engine.js`: `skills: [1,0,...]`; `save.js` requires `skills[0]>=1`. | Preserve same field, initial rank and v4 save acceptance. |
| Basic trigger | `app.js` invokes `castMovementBasic()` after actual movement; PR #436 proposes standing autoattack. `hero-combat.js` calls `cast(1,...,automatic=true)`. | Incorporate/verify stationary autoattack behavior; invoke a **distinct automatic-basic resolver**, not the activated Skill 1 tap handler. |
| Basic attack cadence | Current normal slot-1 recovery `hero.cd[0]`, base 0.85s; same-target three-beat combo 100/110/120%, 55% secondary finisher, four-second combo window. | Preserve base combo, targeting and **effective attack cadence** as starting behavior, independently of Skill 1's normal/charged recovery. |
| Promoted normal Skill 1 | Current *charged* slot 1 fires a holy projectile / beam / 3-arrow burst with total raw damage `3 × (Power+12) × rank multiplier` before defenses, and a 3s base charged cooldown. | Keep class attack identity, projectile mechanics and initial **3s base normal cooldown**, but make tap immediate; no charge-only casting status. Keep existing rank scaling and Cooldown Training rules. |
| Future charged Skill 1 | Current charged skill occupies that form; both forms currently share `hero.cd[0]`. | New technique yet to be designed. **Activated** tap/charged Skill 1 continue to share the existing *slot 1* cooldown ownership; distinct charged cooldown duration to be specified during design. |
| Training | `data.js`: Skill 1 tagged `start`; `rules.js` rescued teachers have `train: [1,...]` with sequential rank ceilings. | Preserve no specialist for initial access, and **preserve specialist-assisted later ranks and costs**. Rewrite lore and training copy, not gates. |
| Cooldown modifiers | `skillCooldown(slot,charged)`, Cooldown Training -4% per rank (up to -20%), and Slow-related cooldown recovery operate on existing actor timers. | Reuse current modifiers and rules, not invent a second progression/price scheme. Plumbing required to apply relevant existing recovery rules to separated basic and activated timers. |
| Current UI | `skill-reference.js`, `app.js`, `archive.js`, `data.js` refer to Skill 1 as Basic attack/Sword, Arcane or Bow Combo. | Show automatic combo as the **basic-attack portion** of one self-taught discipline; tap as the promoted former charged attack; charged as the subsequently approved new technique. |
| Save compatibility | v4 has `hero.cd[0]`, no distinct hero-basic timer; combo state is a transient `Campaign` field. | Specify/verify safe mapping of existing cooldown on restore and new distinct basic timer without breaking historical saves; no new hero skill rank field. |

**Important scope distinction:** preserving rank progression, Cooldown Training and numerical starting values does **not** make the resolver/timer migration a no-code change. Current auto and manual slot 1 share the **same** `cast(1)` function and `hero.cd[0]`; an independent automatic cadence must actually be implemented and made safe for restore, pause and other interrupts.

## 3. Detailed behavioral contract for later implementation

- **Automatic basics:** Work while standing, manual movement, or permitted auto-navigation; target must be eligible/in actual class reach and line of sight. Do not issue a pursuit/skill-approach order, replace a map destination, cancel Recall, take precedence over queued movement, or acquire otherwise protected opening enemies. Preserve explicit/locked target preferences, class reach, class-specific projectiles, incoming target dodge, combo continuity/reset, armor and damage protections. Do not produce attacks during pause, hidden focus, menus, emergency recovery, defeat, or developer-mode restrictions. Respect Shield Stance and applicable combat disables. Follow PR #436's bounded failed-probe throttling without throttling successful eligible attacks.
- **Separate readiness:** Basic attacks **must not** consume, start, extend or wait for `hero.cd[0]`; normal/charged Skill 1 **must not** consume, start, extend or wait for the automatic-basic timer. An auto hit must not cause an activated Skill 1 queue to wait; conversely, use of Skill 1 must not reset basic cadence. Pending charged input must not implicitly silence basics solely to protect an obsolete shared cooldown; preserve real stance/silence/simulation restrictions and test attack/charge overlaps.
- **Promoted tap:** Tap is an ordinary immediate Skill 1 action. Keep the formerly charged attack's target identity, reach/line of sight, contact/dodge/projectile and associated visuals/audio in appropriate **normal** presentation form. Remove charge-only 0.65s preparation, hold receipt, pre-aggro **charged** invalidation, charge interruption and `charged:true` effects from its normal execution; retain ordinary opening encounter safeguards (deliberate attacks can open an encounter, basics may not). This is not a new autoattack.
- **Future charged form:** Existing 0.65-second hold/release, queued form selection, interruption and charged-opener protections continue to govern actual **new charged** Skill 1 once designed. Tap and charged share the skill-slot timer, though their resulting durations may differ under the existing cooldown framework. No placeholder action until the owner selects techniques for all three classes.
- **Three-beat combo:** Keep it on **automatic basics**, not on the tap button. Maintain 4s target-linked reset, target choice, secondary geometry, third-hit VFX/audio and relevant skill-rank scaling. Old manual-combo branch and event semantics require explicit migration: names like `basicComboFinisher`, `automaticBasic`, `combo`, `heroSkillCast`, `slot:1` appear across renderer, sound, impacts, archive and tests.
- **Movement + shielding + support:** Keep Paladin Shield Stance no-basic rule; audit whether its prior "no Skill 1" restriction applies to tap/charged as well, rather than silently allowing either. Retain Mage Silence's separate basic-vs-skill restriction. Retain Recall disengagement, covered retreats, target lock/retargeting, and navigation ownership. Prevent basic hits from bypassing first-encounter hero-initiation gates (Vale/Thornfang).
- **Damage economics:** Preserve existing basic combo coefficients, promotion damage, rank scaling and cooldown training at first pass. **Do not claim that combined damage throughput remains unchanged**: now autoattack and tap coexist instead of competing for a timer. A focused balance study across three classes, solo/party, normal/TRUE bosses and protected/opening enemies is required after future charged designs are selected; no unapproved numeric rebalance.
- **Input:** Keyboard, mouse, touch, tap-vs-hold classification, 0.65s charge threshold, queued tap/charged forms and visual charge/aim cues must all remain reliable. Basic attacks are passive, not a ninth button.

## 4. Companion dependency contract

See [companion audit](HERO_SKILL1_COMPANION_DEPENDENCIES_20261024.md) for the exact code trace and focused verification matrix.

**Audited preliminary result:** Soldier/Archer/pet ordinary attacks use individual `u.cd` timers and their own AI, not hero `hero.cd[0]` or `hero.skills[0]`. Their distinct **first automatic specials** use `u.skill1Cd` (an unrelated field with an unfortunately similar name). Their second-skill unlock is gated by **hero Skill 2** (`hero.skills[1]`) and saved `companionCombatTraining`. Do not conflate **companion "first skill"** with **hero Skill 1**. Preserve current pet and soldier/archer cooldowns, AI, damage inheritance, healer behavior, shared cooldown recovery, Ranger Rally and restoration. Check *indirect* dependencies through party engagement, aura/buff ownership, shared hero Power inheritance, spell effects, rendering/audio, and save imports before changing any source.

## 5. Required player-facing alignment (future gameplay commit, not yet edited)

1. **Hero Skills / Character Skill Journal:** Show "automatic basic combo" as a section of the single Skill 1 rank, and separate **Tap** (promoted class technique) and **Charged** (new, approved technique). Give accurate independent **basic interval** and activated normal/charged cooldown figures, shared rank, rank milestones, costs and target/restriction text. Show no phantom hold requirement on Tap.
2. **Skill 1 level-up and rescued instructor menus:** Skill 1 Rank 1 is self-taught / already learned. Existing rescued teachers **refine the same Skill 1 repertoire** at later ranks (preserve current teacher ceilings, upgrade costs and progression). Do not imply a specialist first taught the skill, nor that Skill 1 cannot be trained further. Existing Skill 2+ teaching stays unchanged.
3. **Drowned Keeper's Archive and live figures:** Explain why the starting hero can fight before specialists, the three **actions inside one discipline**, class differences, independent basic/activated cooldown, automatic combo and new charge. Update numerical Q&A from actual final rules, not hand-written stale balances. Preserve Keeper voice, historical lore and progression locks, and English/Spanish equivalence.
4. **HUD button/tooltips, beginner guidance, README and controls:** Clarify that basics are automatic (even idle) and not the result of tapping Skill 1. Preserve displayed charge queue/recovery, selected enemy markers, touch/keyboard labels and the two-handed layout. Do not add extra control slots.
5. **Named skill and audiovisual dictionaries:** Distinguish automatic combo vs promoted tap vs actual new charge, so ability logs/indicators/VFX/sounds do not mislabel former charged as charged or suppress combo-finisher cues.
6. **Localization:** English and Spanish should explain all distinctions, including the hero's past without asserting Greenwood Vale was the only place the hero lived or trained.

## 6. Acceptance checklist / dependency-aware focused verification

- [ ] Rebase this draft on current `main`; inspect #436's status/diff and incorporate stationary basics into **one** integrated implementation (do not merge source PR blindly).
- [ ] Class-by-class tests: Paladin, Mage, Ranger auto basic while idle/moving/navigating, all three combo beats and third-hit geometry, damage and class reach.
- [ ] Verify independent automatic-basic timer vs activated slot-1 timer under combat, pause, menus, hidden page, restoration, Slow and Cooldown Training at ranks 0–5.
- [ ] Assert prior charged attack becomes immediate Tap with identical meaningful attack content/damage/projectile class identity and **3s starting cooldown**, without old charge prep or charged opener receipt.
- [ ] Resolve the three new charged techniques through explicit owner review before implementation; verify each 0.65s hold/cancel/queue/interruption/targeting and shared Skill 1 slot cooldown without consuming basic cadence.
- [ ] Verify manual target/lock, Recall, map travel, no passive pursuit, First Vale/Thornfang opening guard, Paladin Shield Stance, Mage Silence and developer mode.
- [ ] Verify Soldier and Archer ordinary attacks and Power Strike / Triple Shot continue; Hero Skill 2 gates their second skills; Ranger support and Rally unchanged.
- [ ] Verify all boss pets: basic attack interval, first skill, gated second charged skill, AI and contact effects; preserve returning/resting/fallen and historical v4 companions.
- [ ] Validate save migration for existing positive `hero.cd[0]` plus new basic-timer initialization (explicit policy still to be finalized); no free cooldown bypass on save/import or reset of old skill ranks.
- [ ] Verify Skill Journal, instructor training, Keeper Archive, button tips, README/controls and concise English/Spanish language against **real code output** for all three classes.
- [ ] Run only targeted native, input and relevant browser checks when implementation exists; **no comprehensive matrix, merge, main push or deployment without separate authorization**. Preserve multi-file GitHub Pages/PWA assets, service-worker stability and Canvas/Pixi fallback.

## 7. Reserved next design stage — no proposals approved yet

For Paladin, Mage and Ranger, later append to this **same PR** an owner-reviewable **new charged Skill 1** proposal: distinct combat role, mechanic/target geometry, visuals, interaction with class Skills 2–8, 0.65s charge and interrupt behavior, rank/milestone scaling, normal-vs-charged cooldown comparison, potential boss/TRUE exploits, damage throughput and companion synergy. Do **not** invent new specialist lore, independent skill trees, spell-resource bars or global lockouts. **No class technique, cooldown duration, name, or balance value is selected in this initial draft.**

## 8. Paladin charged Skill 1 — Grand Cross-inspired candidate (owner brainstorming; **NOT approved**)

**Origin:** The owner cited the Crusader/Paladin *Grand Cross* from *Ragnarok Online* as inspiration **without copying that named skill or its entire ruleset**: Holy attack centered on the caster, cross-shaped area, up to three hits dependent on positioning and movement, approximately 0.9s active duration, immobilization, noninterruptible cast, a 20%-of-current-HP cost, and reductions to hit counts when creatures crowd particular cells. These are **reference mechanics only**, not approved Azeroth Chronicles behavior.

**Working placeholder name:** **Radiant Cross** (not owner-approved; must be renamed/approved before implementation).

### Core visual/combat concept to evaluate

- The Paladin raises the blade and, on a valid **charged Skill 1** release, four arms of brilliant holy light project from the Paladin's location to form a cross. The art, animation, exact orientation and name must be original to Azeroth Chronicles.
- **Directional/positional encounter:** The cross is **anchored at the release position** rather than following the Paladin. Consider orienting one arm toward the chosen/locked enemy and the opposite/perpendicular arms around the Paladin, instead of enforcing map-grid cardinal directions. Such aim-based orientation still requires validation against touch targeting, line of sight, hero-size collision and sprite readability.
- **Suggested two discrete pulses**, spaced over a brief total window, as a first design hypothesis. Every eligible enemy can receive at most one hit from each pulse; crossing arms must **not** double-hit the same enemy within a pulse. Enemies moving into/out of a lit arm can change their hit count. Avoid the original's monster-population-dependent penalty to nearby hit counts: crowding should not unpredictably reduce individual attacks.
- Use the existing hero Power / Skill 1 **rank** and normal charged damage protections, not a new Holy-vs-Hybrid damage system or new class-specific resource. Preserve the same Skill 1 shared-rank progression as automatic basic and promoted normal. Proposed total damage, area length/width, target cap, persistence, pulse spacing, cooldown and rank-milestone geometry are **NOT selected**. The charged cooldown should be evaluated against the promoted tap's 3s starting recovery plus the independent automatic-basic output.
- **No 20% HP cost, extra immobilization or uninterruptible cast in this first candidate.** Existing ~0.65s hold, charged interruption and queued-input rules stay intact; the melee positional commitment, target selection and delayed hit opportunities supply tactical risk. A different risk/cost tradeoff can be reviewed later, but is not selected.
- This is a **deliberate activated hero attack**, never an automatic basic, and must not advance or erase the automatic three-beat combo. It must obey current protected-boss opening constraints for genuine charged skill releases; no precharged boss opening exploits, and no cross hit admitted through walls or protected leash geometry. Allies and the hero are not damage targets by default; never add accidental companion damage.
- **No imported status effects in this candidate:** no weaken, taunt, crowd push, Slow, ward or healing. Those belong to other Paladin abilities and make the cross mechanically indistinct if grafted on.

### Distinguish from current Paladin Skills 2–8

- **Skill 2:** Sundering Strike/Holy Cleave is frontal and **weakens**; cross is four narrow directional arms and relies on positioning rather than a weaken debuff.
- **Skill 3:** Shield Stance/Shield Bash handles mitigation and cone push; charged cross neither guards nor pushes.
- **Skill 4:** Judgment/Grand Judgment causes taunt; charged cross does not affect threat selection.
- **Skills 5 and 7:** Holy Area/Consecrated Wave and Holy Assault/Oath Strike are wide **area damage + stronger weakening** choices. Charged cross trades broad coverage for **narrow line geometry and multiple time-separated hit opportunities**, no weaken.
- **Skill 6:** Vanguard Rush/Impact is movement/gap closing; cross stays anchored and provides no dash.
- **Skill 8:** Sanctuary Oath/Last Bastion heals/wards nearby allies; cross is pure offense.

### Owner decisions still required

- [ ] Confirm whether caster-centered, potentially **aim-rotated** cross is the right visual/combat identity.
- [ ] Confirm one, two or three pulses, their total active period and whether the light persists visibly between pulses.
- [ ] Choose whether the Paladin can move normally through the release and recovery, versus any **brief** authored commitment that does not replicate the reference's 0.9s root.
- [ ] Set reach, width, target cap, rank scaling, raw power per pulse, visual warning/readability and **charged cooldown** after first-pass solo/group/boss balance comparison.
- [ ] Approve a distinctive final name and original FX/audio for both English and Spanish.
- [ ] Check independent hero-basic cadence, Paladin Shield Stance restrictions, companions/AI, protected openings, collision and performance (bounded hit tests, 2 pulses at most initially).

**Status:** proposal captured because the owner shared Grand Cross as inspiration; **no implementation, numerical balance, class-skill selection or approval implied**. Mage and Ranger charged Skill 1 remain **entirely undesigned**.

## Reference code (baseline)

- [`src/prototype/hero-combat.js`](../src/prototype/hero-combat.js): `castMovementBasic`, `cast`, `skillCooldown`, charged slot-1 forms, combo, damage and projectile flags.
- [`src/prototype/app.js`](../src/prototype/app.js): main simulation/basic trigger; charge selection, HUD, keyboard/touch input and translated tooltips.
- [`src/prototype/rules.js`](../src/prototype/rules.js), [`data.js`](../src/prototype/data.js): cooldown/combos and teacher curricula; initial skill definition.
- [`src/prototype/engine.js`](../src/prototype/engine.js), [`progression.js`](../src/prototype/progression.js), [`save.js`](../src/prototype/save.js): initial rank, upgrades and legacy save contract.
- [`src/prototype/skill-reference.js`](../src/prototype/skill-reference.js), [`archive.js`](../src/prototype/archive.js): class-specific skill descriptions and Keeper's live figures.
- [`src/prototype/party.js`](../src/prototype/party.js), [`party-pets.js`](../src/prototype/party-pets.js), [`combat.js`](../src/prototype/combat.js): companion timers, party spell effects and protected engagements.
