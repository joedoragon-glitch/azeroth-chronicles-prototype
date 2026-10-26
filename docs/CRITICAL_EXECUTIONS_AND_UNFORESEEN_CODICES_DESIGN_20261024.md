# Critical Executions and the Codices of the Unforeseen
**Status:** Tentative design proposal · 24 October 2026 · draft PR only  
**Change class:** Design/documentation only. No mechanics, probabilities, assets, menus, saves, tests, release or deployment are changed by this proposal.  
**Approval boundary:** All numbers beyond the two agreed 10% starting chances, all book names, reward amounts, acquisition rules and individual special effects require subsequent review.

## 1. Player-authored premise

Criticals in Azeroth Chronicles are **exceptionally effective executions of existing moves**, not a generic 5% chance to deal double damage.

- Every action performed by a hero, recruited companion, pet, ordinary monster, ringleader, captain or boss is eligible to have a **specific critical variant**: basic/automatic strikes, active and charged skills, hostile Rogue maneuvers, healing, defensive abilities, and other real combat moves.
- **Both independent critical-chance pools start at 10%.** Party members (hero + recruited companions + pets) have a party baseline; every other combatant has a separate world-combatant baseline. They happen to start equal, but must not be represented by one shared mutable setting.
- The hero may earn **permanent critical-chance bonuses above 10%** from combat manuals held in optional side dungeons. Companions and pets inherit some or all of **that earned bonus** through the game's existing inheritance philosophy. Their own 10% baseline remains intact even with no Shared Training.
- World-combatant chance must be separately tunable later, perhaps for night encounters, without altering the party's books, party baseline or inheritance.
- A critical action keeps its original animation, sound, attack telegraph, area/shape, movement, timing, charge, resource requirements, cooldown and target rules. It adds a **case-by-case superior consequence** appropriate to that move, not a universal multiplier or free new attack.
- A brief classic downward-pointing **!**, with its point directed toward the actor, announces that the actor **released** a critical action. It is informational rather than a new warning; it may not postpone or interfere with the existing action or obscure cast bars, warnings, vital status markers or targeting information.
- A critically executed attack may still miss, be dodged, blocked, intercepted or rendered ineffective under ordinary combat rules. Criticals are not guaranteed hits.

These are **design commitments for review**, not yet implementation.

## 2. Current-repository anchors (verified against main while drafting)

| Area | Existing source contract | Consequence for this feature |
| --- | --- | --- |
| Side interiors | `src/prototype/rules.js` defines five `sideDungeons`, explicitly without a boss, captive, quest reward or gatherable resource; `tests/mini-dungeons.test.cjs` exercises entrance, species and traps. | Reward each interior without converting it into a main boss dungeon or gathering site. |
| Inheritance | `src/prototype/progression.js` has `expeditionSupportFraction()`, `companionInheritedHpBonus()`, `companionInheritedDamageBonus()`, `companionInheritedSpeedBonus()` and `companionInheritedArmorBonus()`. | Add a distinct inherited **critical bonus** pathway; do not assume an existing critical stat already exists. |
| Shared Training | `src/prototype/rules.js` defines 5 Shared Training ranks; it currently shares applicable discipline-derived HP/damage/speed, while Shared Strength is a separate 4-rank track for other persistent benefits. | **Proposed**: treat book-learned critical mastery as a Shared Training-adjacent knowledge benefit, inheriting a fraction of the bonus. Explicitly approve this choice before implementation. |
| Pets | `src/prototype/party-pets.js` and `party.js` implement pets as specialized members of the existing party, not a separate companion economy. | Pets use the same party critical base and inherited-book calculation as other recruited units. |
| Combat | `hero-combat.js`, `boss-combat.js`, `combat.js`, `party.js`, `party-pets.js`, `engine.js`, and the authored rules divide attack ownership among several paths. | Audit the real action catalog and place critical resolution at the authoritative action owner, not in display-only effects. |
| Saves | `save.js` validates and migrates campaign snapshots with version 4. | Plan explicit default/validation for any earned-book flags; existing campaigns must load unchanged. No save migration is part of this documentation PR. |
| Rendering | Existing attack/warning effects are procedural; current rendering can skip drawings under load. | A fleeting ! needs bounded visibility that survives ordinary frame skips without affecting simulation or forcing an extra telegraph. |

Note: “critical” already occurs in existing *critical-health companion survival* and *critical performance recovery* vocabulary. New implementation names must distinguish **critical execution / crit chance** from those unrelated systems.

## 3. Two independent chance domains

Proposed conceptual interfaces (illustrative; **not code to merge**):

```text
party.baseChance = 0.10
world.baseChance = 0.10

bookBonus = sum of distinct, claimed codex grants (proposal: five x +0.01)
heroChance = clamp(party.baseChance + bookBonus, allowedBounds)
companionChance = clamp(party.baseChance + bookBonus * inheritanceFraction, allowedBounds)
petChance = companionChance
worldCombatantChance = clamp(world.baseChance + worldOnlyModifiers, allowedBounds)
```

**Key invariants:**
1. Party and world have separate starting values even when both equal 0.10. A night-only world modifier must not touch the party setting.
2. The **10% baseline is never inherited or multiplied**: only hero-earned points above the baseline pass to companions/pets.
3. Inheritance is a **live read of current training and learned-book state**, not a second bonus added each time a pet joins, heals, re-enters, or is restored.
4. A book is learned once per campaign; no stacking by re-entry, repeated clearing, duplicate pickups, reserve recruitment or save/load.
5. Inheritance uses a real fractional value, not an early integer-percent rounding step. For example, if the hero has +3 percentage points from books and inherits at 3/5 Shared Training, the party member gains +1.8 points: 11.8% total (before any future cap).
6. Any later hostile-night bonus is a separate opt-in decision, **not included** in this design PR.

**Working proposal, not approved balance:** one distinct book per five dungeons, +1 **percentage point** each, so a hero with all books has 15%; an untrained companion/pet remains at 10%, and a fully Shared-Trained companion/pet reaches 15%. This is additive percentage points, not “10% of 10%.” The amounts and cap are provisional.

**Open inheritance decision:** Should the earned bonuses follow `Shared Training` exactly (current proposal), follow `Shared Strength`, or have a new explicitly documented knowledge-sharing rule? Do not silently treat books as a hero talent or equipment bonus. Character succession / hero replacement, reset behavior and campaign-wide persistence must be separately specified before any save fields are added.

## 4. Side-dungeon codices: tentative adventure identity

Working collection name: **The Codices of the Unforeseen**. Each is a discoverable **manual of combat insight** recovered from a particular inhabited place, rather than a consumable, a new currency or another skill-rank training screen. The manuals represent tricks observed, practiced, copied, or safeguarded by combatants; a beast need not literally be able to read for knowledge to be found in its lair.

| Existing optional interior | Existing inhabitants | Proposed volume title and lore hook |
| --- | --- | --- |
| **Old Orchard Cellars** (`side-vale-cellars`) | Goblins | **The Art of Misdirection** — Goblin notes on distraction, timing and taking advantage of an opening, found amid their occupied living space. |
| **Drowned Watchhouse** (`side-march-watchhouse`) | Reed Beasts | **The Waterline Gambit** — a water-damaged watch manual recording adaptations to slippery close combat, preserved in the partly flooded watchhouse; no claim that Reed Beasts wrote it. |
| **Old Signal Keep** (`side-highlands-signal`) | Ogres | **The Measured Blow** — practical notes on weight, timing and leverage alongside the keep's functional warning station and maintained work equipment. |
| **Ruined Shrine** (`side-frontier-shrine`) | Orcs | **The Feigned Opening** — a field-training folio among the garrison's drill materials and existing Scornfang memoranda; it does not replace the site's established shrine lore. |
| **Ruined Foundry** (`side-crown-foundry`) | Crown Guards | **The Final Adjustment** — a Crown tactical/armorer manual kept near active repair benches and weapons. |

The five names, their authors, prose, exact positions and means of collection are **draft fiction** requiring canon review. Existing inhabitants are not rewritten as uniformly hostile caricatures; preserve the location's approved social and environmental details.

**Proposed acquisition pattern:** one visible, inspectable volume within each existing interior; earn/claim it only once, with a clear player-facing acknowledgment and a simple collection record. A suitable guard/clear or reachability prerequisite is **undecided**. Avoid adding a side boss, new quest prerequisite, harvest loop, or additional mandatory progression. Do not silently change existing populations, geometry, traps, entry/exit, respawns or regional navigation. Handle English/Spanish copy and HUD/readout only when implementing.

**Why books belong here:** optional side dungeons gain a distinct permanent, modest reason to explore while critical executions still exist for every combatant from the beginning. Monster knowledge is an in-world explanation for special execution rather than proof that only monsters with books may crit.

## 5. Critical execution semantics

### Roll and ownership
- Proposed **one roll per committed/released action**, not one per target, projectile, chain hop, tick or damage callback. A six-target skill has one outcome shared across its release. A repeated separately committed auto attack has its own roll.
- Decide the result **at action release**, after valid preparation/cast rules permit release and before its impacts resolve. A charged skill that is cancelled before release does not earn an extra critical attempt.
- Delayed projectiles, bouncing skills and damage-over-time effects carry the activation's critical identity without rerolling. Treat genuinely distinct later casts as new actions.
- Do not create a critical roll for passive environmental traps, non-combat transitions or presentation-only events unless an actual combatant-owned move is explicitly identified.
- Crit does not override immunity, facing/line-of-sight, collision, hit confirmation, protective boss openings, shield logic, area boundaries, friendly-fire policy, tactical burst compression, or existing status immunities.
- Do not change cooldown values, charge duration, recharge, animation timing, VFX geometry, projectile travel, action cost, AI choice, telegraph timing or damage resolver ownership.

### What the special effect means
Every authored action needs a **specific improvement in its established purpose**. No blanket double damage; no generic extra stun or effect pasted onto unrelated attacks. For actions without existing utility, a modest thematically appropriate combat advantage may be authored *after* source and balance review; never silently inject one.

**Illustrative candidates only; verify actual skill behavior first:**

| Type | Example critical signature | Guardrail |
| --- | --- | --- |
| Goblin blinding dust | Longer application of the statuses the real dust attack currently causes | Verify its exact current Slow/untargetability semantics, immunity and stacking before choosing values. |
| Healing | Greater healing from the same release | Preserve target, overheal cap and current healing restrictions; no extra cast. |
| Slow/freeze | Slightly longer or more effective existing hindrance | Respect duration bounds, counters and immunity; no automatic hard-disable. |
| Defensive ability | Longer or more effective existing shield/mitigation | No invented immortality or reset of the ability. |
| Basic physical attack | A restrained skill-appropriate advantage such as armor interaction | Verify protections and avoid de facto universal double damage. |
| Boss charged action | One bounded superior aspect of the already telegraphed move | Preserve warning shape/timing and an ordinary valid dodge window. |

**Coverage requirement before activation:** produce an inventory of all attack and support activation paths—hero class tap/charged/basic, companion Soldier/Archer basics and skills, all pets' basics and special slots, ordinary and ranged species, Rogue/elite/ringleader moves, night enemies, guard/captain moves, all bosses (normal/TRUE), heals, buffs and counters. Record each action's owner, action boundary, existing consequences, planned critical consequence, safety cap and test. Any unreviewed action is a coverage blocker, **not** an excuse for a generic fallback multiplier.

### Chance adjustment and randomness
- Shared resolution API should ask for **the executing actor's domain and effective chance**, then record that outcome on the action, not mutate the actor's permanent combat stats.
- Tests must use seeded/controlled randomness. Existing deterministic scripted encounters and coverage tests will need careful examination for RNG-consumption differences when actual criticals are introduced.
- Do not increase enemy world chance at night, change boss forms' crit rate or add book-granted effects in this PR. Those are separate later design decisions.

## 6. Exclamation indicator contract

- The critical **!** appears over the **actor that released** the skill (hero, companion, pet, regular enemy or boss), oriented point-down toward that actor, for a brief bounded duration (tentative visual target ~0.5–0.8 seconds, tune with actual readability tests).
- It should be visibly distinct from existing enemy warning symbols but **not itself be a warning**. It never announces an extra preparation phase or gives extra response time. A ranged projectile can be critically released and still miss.
- Use existing procedural presentation: no new animation or audio asset is required. Position relative to the actor with clearance for casting bars, health/status badges, boss warnings, telegraph overlays, and screen edges; use sensible fallback for crowds.
- Rendering/frame-skipping must not consume the marker before it can be seen. Any visual lifetime is presentation-only and cannot block action resolution, slow combat or force unbounded redraws.
- Critical indicators may stack only in a bounded, readable way when nearby actors release simultaneously. Accessibility and English/Spanish explanatory text need review, while the glyph itself can remain universal.

## 7. Implementation sequence after design approval

1. **Catalog and balance audit:** enumerate real action paths and map each to an explicit critical effect. Review protection, healing, status, boss difficulty and special-case attacks. Approve book reward amounts, caps, persistence and inheritance branch.
2. **Core resolver in isolation:** independent party/world probabilities, bounded one-roll-per-action identity, effect descriptors, deterministic tests; dormant behind a development gate until full coverage exists.
3. **Action-owner integration:** hero, companions/pets, ordinary enemy/Rogue/night variants, captains and bosses, without duplicating damage/impact logic or modifying existing telegraphs.
4. **Presentation:** procedurally display actor-owned **!**, with collision-safe overlay layout and frame-skip/readability coverage.
5. **Codex rewards and save compatibility:** five one-time collectible flags and critical bonus derivation; validate legacy v4 restores, repeat entry, inventory/roster/succession, English/Spanish.
6. **Focused integrated regressions and live device acceptance:** fixed RNG fixtures for misses/blocks/multi-hit/projectiles/status/heals, all modes/three hero classes, historical saves, phone/desktop, normal/TRUE/night; no merge or deployment without approval.

Possible implementation touchpoints: `rules.js` for authoritative data; `combat.js` plus owning action modules for resolution; `progression.js` for effective party inheritance; `world.js` and interaction ownership for volumes; `save.js` for persistent claim flags; presentation layer for **!**. These are **places to investigate**, not permission to refactor existing systems.

## 8. Approval and non-goals

**Ready for owner review now:** the core identity of critical executions, separate 10% pools, books as party-only permanent mastery, and source-grounded dungeon list.

**Still tentative:** title and number of volumes; individual lore blurbs; +1 percentage point per book/15% hero cap; whether Shared Training passes 0–100% of learned bonus; how books are guarded or claimed; succession behavior; individual skill improvements and status caps; display duration.

**Explicitly not part of this PR:** enabling or changing combat; adjusting enemy night strength; changing skill animations, sounds, warnings, shapes, cooldowns or costs; adding a side boss or new dungeon geometry; changing persistence/schema; performance work; rewriting existing canon; merging/releasing/deploying anything.

**Draft checkpoint:** Documentation is the sole deliverable of this pull request. Implementation should begin only through a subsequent scoped and approved change.
