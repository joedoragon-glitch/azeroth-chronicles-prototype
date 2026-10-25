# Hero Skill 1 — consolidated numerical and implementation-ready design specification

**24 October 2026 · Draft PR #439 · design decisions authorized by owner, **not yet implemented**.**
**Baseline:** `main` at `e4e8234b5f784ddc9492fe79d956fd0a696b12af`, existing [design/companion audit](HERO_SKILL1_SELF_TAUGHT_COMBAT_DESIGN_20261024.md), [companion dependency matrix](HERO_SKILL1_COMPANION_DEPENDENCIES_20261024.md), and [hero damage/cooldown source audit](HERO_SKILLS_COOLDOWN_ROTATION_DAMAGE_AUDIT_20261015.md). Values below are the **chosen first-implementation specification**, rather than vague candidate ranges. Numerical effectiveness is **not certified** by a simulation or playtest; any actual adjustment requires reported focused evidence and owner review.

## One discipline, three actions, no additional rank or specialist

All hero classes already start with `hero.skills[0] = 1`; later specialists may upgrade that same Skill 1 rank up to the established curricula. **Automatic basics, normal tap Skill 1 and charged hold Skill 1 all use this one learned rank**, its old costs and existing +15%-per-rank multiplier. Rescued teachers *refine* self-taught fundamentals; they are not required for the hero to know how to attack.

**Use these common symbols for every damage formula:**
- `P = this.power()`, the computed hero Power at the moment of execution, not the class's original starting Power.
- `B = P + 12` (the existing Skill 1 damage basis).
- `M(r) = 1 + 0.15 * (r - 1)`, with `r = hero.skills[0]` from 1 through 8; `M(1)=1`, `M(8)=2.05`.
- `k(r) = floor(r/2)`, with milestones at ranks 2, 4, 6 and 8; `k(1)=0`, `k(8)=4`.
- `T = min(5, hero.talents[1])`: ordinary **Cooldown Training** decreases each base recovery by `4% * T` (up to 20%). Enemy/hero Slow may additionally change elapsed cooldown recovery under the existing `cooldownRecoveryElapsed` rules. No separate charge talent, XP/crowns or mana cost.

### Fixed base cooldowns

| Action | Paladin | Mage | Ranger | Owns timer |
| --- | ---: | ---: | ---: | --- |
| **Automatic basic combo** (all three beats) | **0.85 s per basic attack** | **0.85 s** | **0.85 s** | New dedicated **hero basic timer**, independent of activated Skill 1 |
| **Skill 1 normal Tap** (current charged form, now immediate) | **3.0 s** | **3.0 s** | **3.0 s** | Shared activated `hero.cd[0]` |
| **Skill 1 charged Hold** (new form) | **8.0 s** | **7.0 s** | **8.0 s** | Same `hero.cd[0]` as normal Tap; use chosen duration **after successful form**, not a second charge meter |

**With max Cooldown Training** (T=5): basic **0.68 s**, Tap **2.4 s**, Paladin/Ranger charged **6.4 s**, Mage charged **5.6 s**, *before* Slow effects or any pre-existing combat-tempo modifiers. Existing automatic-attack tempo/night behavior must not be altered by this split. No cooldown penalty or extra locking between basic and the activated slot.

**Charged input timing remains 0.65s** of preparation (a genuine release inside the existing <0.20s tap classification is a normal cast; middle threshold/cancel and charge queue behavior remain as currently implemented). Preserve existing charged interruption and protected-encounter receipt rules; no variable charge thresholds.

## 1. Automatic basics (all hero classes; their combo stays automatic)

- **Same basic damage and beat order:** `B * M(r)` on beat 1; `1.1 B * M(r)` on beat 2; `1.2 B * M(r)` on beat 3, subject to native hit/contact and defense rules. The third beat keeps **55% of the unmultiplied base hit** for eligible secondary splash geometry, and current class-specific fan/cleave visuals, no extra statuses. Four seconds without a compatible target/hit and target switch follow present combo reset rules.
- Paladin basic reach **120**, Mage **400**, Ranger **450** (existing targeting limits). Preserve hit/LOS, manual priority, no passive chase, stationary eligibility via PR #436 reconciliation, protected boss/first Vale opening, Recall and navigation, Shield Stance's block on Paladin basics, relevant Mage Silence exemptions, charge-overlap behavior and real combat pausing.
- **Basic timer base = 0.85 s**, recovered under the same current cooldown reduction and Slow recovery accounting as it effectively received while attached to `hero.cd[0]`; preserve applicable night attack tempo. Basic attacks continue while charging or after activating Skill 1 if otherwise eligible. No passive basic suppresses a queued Skill 1.
- Do not treat basics as a learned ninth button/slot or a separate talent. Avoid replacing `automaticBasic` projectile/damage attribution with an ordinary deliberate cast; opening guards require this flag.

## 2. Promoted normal Skill 1 (Tap): existing former-charged attack, no hold

| Class | Tap appearance/mechanics | Native reach | Raw damage to selected foe | Base cooldown |
| --- | --- | ---: | --- | ---: |
| **Paladin** | **Focused holy projectile**, one hit, ordinary legal dodge/contact; no extra weaken/taunt | **120** | `3 B M(r)` | **3.0 s** |
| **Mage** | **Thin arcane beam** to one target, one projectile/contact, no chain/splash/Slow; stays distinct from Skill 6's slowing Focused Beam | **400** | `3 B M(r)` | **3.0 s** |
| **Ranger** | **Three rapid arrows** at one foe, `0, 0.08, 0.16s` launch offsets, each arrow independently dodgeable; no automatic Slow or piercing | **450** | `3 * [B M(r)]` as three equal `B M(r)` arrows **if all connect** | **3.0 s** |

Every Tap uses a *normal* activation (no 0.65s wind-up, no `charged:true` misleading metadata, no charged-preparation interrupt) and its own `hero.cd[0]` while maintaining ordinary deliberate combat/targeting/line-of-sight. Retain the existing shot speeds: Paladin holy **550**, Mage beam **1000**, Ranger arrows **620** units/s, unless a focused visual/contact audit proves a required technical correction. New charged attacks do not silently overwrite these normal projectile mechanics.

## 3. Charged Paladin — **Radiant Cross** (working label)

| Property | **Chosen specification** |
| --- | --- |
| Base activated cooldown | **8.0 s** |
| Geometry | **Four-armed cross** centered at Paladin's **position on charged release**, frozen for both pulses; two perpendicular full axes. |
| Orientation | One axis aimed from Paladin toward the valid selected enemy, the other 90 degrees across it. If no manual target, the native nearest valid foe within effective reach supplies orientation. |
| Arm reach, per direction | **190 + 10 k(r)** units; **190** at rank 1, **230** at rank 8. This is *not* the complete horizontal/vertical end-to-end span, which is twice the arm reach. |
| Half width of each arm | **35 + 4 k(r)** units; full luminous/damaging width **70** at rank 1, **102** at rank 8. |
| Number of pulses | Exactly **two**, at **0.00 and 0.35 seconds** after legal release; the cross's active window ends after the second pulse (art fade may linger harmlessly). |
| Damage | **`1.5 B M(r)` per pulse per foe**, **`3 B M(r)` total** for a foe in both pulses, before enemy protections. No combo multiplier. |
| Targets | Up to **8 distinct eligible enemies per cast**; deterministic manual target first, then proximity/ID order. **Cap is across the whole cast**, not per pulse. All admitted enemies may be hit twice if they remain inside the light; enemy body crossing a center/intersection cannot receive two hits *within the same pulse*. |
| Timing/movement | Existing **0.65s hold**; no additional immobilization, HP sacrifice, uninterruptible bonus or movement override. |
| Effects | Pure holy-area **damage**. No taunt, weaken, push, heal, ward, invulnerability, new resource or armor piercing. |
| Terrain/protection | Every candidate must be legally reachable by the holy arm through terrain/line-of-sight; truncate effect at solid barriers on the relevant arm, no cross-through-wall damage. Respect protected openings and encounter reset. |

**Cast admission:** Require at least one valid enemy in the charged cross's *effective reach* (not the old 120-unit Paladin Tap limit), unless owner later explicitly authorizes empty-space pre-casting. Prevent automatic dash/pursuit or replacing an active navigation route to reach such a target. Class Skill 5 and 7 circles/weakening remain distinct because this cross uses narrow arms, a positioning requirement and timed revisit, not a radius blast or status debuff.

**Focus tests:** Rank-1/8 cross sizes, clipping/walls, rotated diagonal axis, damage from at most two pulses per target, center crossing, 8-target cap, area enemies entering/leaving between pulses, no extra stage damage after faint visual fade, no attack while Shield Stance raised.

## 4. Charged Mage — **Wide Arcane Beam** (working label)

| Property | **Chosen specification** |
| --- | --- |
| Base activated cooldown | **7.0 s** |
| Geometry | Single **straight broad corridor** from Mage along the direction fixed at release toward the selected valid target. |
| Effective maximum reach | **440 + 10 k(r)** units, from Mage: **440** at rank 1, **480** at rank 8. |
| Damaging half width | **48 + 4 k(r)** units, full beam width **96** at rank 1, **128** at rank 8. Match visual glow's clearly signaled damaging core to the authoritative width. |
| Damage | **`2.4 B M(r)` once per legal enemy** intersecting the full corridor. |
| Target count | **Every eligible enemy in its corridor**, **no arbitrary numerical cap**, as specifically requested by the owner; one hit **per enemy per cast**. Deterministic, bounded **one-pass** evaluation of actual zone enemy list (no chain or repeated full scans). |
| Penetration | Continues through **enemy bodies** until max legal range; neither the selected target nor a defeated target terminates the beam. |
| Timing/movement | Existing **0.65s charge hold**; beam resolves **as one release event**, **not a channeled continuous beam, barrage or multiple pulses**. Visual afterglow has no second hit. |
| Effects | Pure arcane **damage**; no shield/armor piercing, Slow, silence, knockback, vulnerability, area blast or chain targeting. |
| Terrain/protection | Cut the broad corridor at first actual solid obstruction. No damage through walls, outside range, or during protected boss opening/untargetable phases. |

**Cast admission:** At least one eligible direct target within **440 + 10k** supplies beam direction. Additional enemies inside the width need not each have been individually selected, but must independently pass legal area damage/admission and terrain checks (avoid losing hit eligibility simply because an enemy is temporarily protected from **direct selection** such as Goblin dust when established area spells can still hit it). Preserve ordinary player target-lock/navigation policy; unlike automatic basics, the charged cast is deliberate.

**Why these values:** One foe receives **2.4 B** every 7s rather than **3 B** every 3s on Tap; charged wins when at least several enemies are lined up in the **full-width geometry**, not by replacing repeated precision fire. Skill 6's slowing focused attack, Skill 7's target-hopping chain, and Skill 8's radial burst/vulnerability retain their roles.

**Focus tests:** rank growth, aligned groups of 1/3/5/8/12 enemies, one hit each regardless of corridor overlap, fast moving enemies, centerline vs half-width edge, LOS clipping, creature piercing but **no shield/terrain piercing**, native target lock, performance under dense groups, and readable phone/desktop beams.

## 5. Charged Ranger — **Hawk Interception** (working label)

| Property | **Chosen specification** |
| --- | --- |
| Base activated cooldown | **8.0 s** |
| Initial target acquisition range | **450** units and legal direct target/LOS; cannot pre-launch at protected enemy or pursue outside initial combat rules. |
| Hawk movement | Homing against **the original single target only**, finite speed **650 units/sec**, reroutes/turns toward moving target without infinite pathfinding or teleport. |
| Maximum cumulative hawk flight path | **560 + 15 k(r)** units actually flown: **560** rank 1 to **620** rank 8; **does not reset** each tick as target runs. |
| Absolute flight lifetime | **1.25 seconds** after launch; expiry on either lifetime or cumulative flight budget, whichever occurs first. |
| Contact radius | **22 units** from hawk center to target's actual collision footprint (consistent with existing friendly hit allowance), one contact only. The target may move, but cannot use **ordinary projectile sidestep/dodge** to invalidate an otherwise legal contact. |
| Damage on valid contact | **`2.25 B M(r)`** single-target raw damage, using existing armor/shields, protections and burst compression; no unconditional defense-piercing. |
| Interrupt | **Only on valid hawk contact**: immediately stop the target's **currently active, interruptible tactical retreat** (if any), without a universal stun/silence, and suppress reactivation of **that same retreat family/maneuver** for **`4.0 + 0.15k(r)` seconds**: **4.0s** rank 1, **4.6s** rank 8. |
| Nonretreating enemies | Hawk still deals its normal damage on contact; **no preemptive blanket anti-retreat mark** when the enemy is not actively withdrawing. |
| Identity/cost | One momentary hawk **ability effect**, not a recruit, summon, independent AI actor, party member, boss pet or separate skill tree; no extra resource consumption. |
| Terrain/protection | The hawk **cannot bypass solid barriers, map/room/zone limits, invulnerable phases, neutral protections, encounter leash, or protected narrative returns**. If no authorized path remains or target leaves the valid encounter, expire harmlessly. |

**Detailed retreat-semantic matrix:** See [§10 in the core design document](HERO_SKILL1_SELF_TAUGHT_COMBAT_DESIGN_20261024.md#10-ranger-charged-skill-1--pursuit-hawk-and-tactical-retreat-counter-core-identity-owner-directed-exact-rules-pending). **Implement by explicit current-retreat kind at impact and a per-target cooldown gate at each relevant initiation point, not by deleting random enemy fields.** Required:
1. **Rogue regroup:** interrupt `thinking/travel/escape`, clear current travel/escape work safely, maintain **active encounter** and a valid local anchor, and override existing **new-wound exception** while suppression is active so it does not simply restart instantly. Never reset threat/home or open a path into a safe town.
2. **Rogue withdrawal maneuver:** only `style:'withdraw'` / actual authored withdrawal, not every `rogueMove`. Cancel retreat component and its related action if explicitly a retreat-only windup; do not delete a separate committed offensive warning. Other Rogue snare/shove/defense is still usable.
3. **Ranged backpedal:** currently `enemyBackpedal` is a per-tick movement decision **without a distinct authored timer**. Add *transient observation of actual backpedal execution*, interrupt movement on contact, and check short suppression before the next backpedal decision. No general root or global ranged combat disable.
4. **Boss/captain authored tactical withdrawal:** interrupt genuinely optional escape movement with an audited safe cancellation method; preserve committed attack warning correctness and remove any escape-only grants that require a completed movement. **Abyss Go-Around must not yield free healing** if its actual retreat motion is safely interrupted. If a boss phase is an unavoidable scripted arena safety/recovery motion, leave it intact and document the exemption.
5. **Protected openings/returns:** never intercept Thornfang's opening withdrawal with captive, `returning`/leash reset, field-boss unstick/reposition safety, scripted boss phase transitions or emergency restoration. This protection **is not** a blanket "boss immune to hawk": normal active tactical retreats should be stoppable when their authored path supports it.
6. On a **legally established contact** with an otherwise damageable active enemy, attempt native damage. An ordinary damage-absorbing shield may reduce/absorb numerical HP loss **without automatically negating the physical retreat-interruption**; true immunity/ineligibility/invalid encounter phase prevents both. This explicitly distinguishes *contact control* from *unconditional piercing damage*.
7. A retreat that **already ended before contact** receives ordinary hawk damage only. Neither ordinary running/chase motion nor a neutral patrol is a 'retreat'. Do not retroactively cancel a completed escape/disengage.
8. The lockout is **one enemy, one retreat family**, not a world/global Rogue cooldown or multi-target effect; eligible new retreat can occur normally after expiry. Suppression elapsed should use game simulation time, not wall clock; pause, menu, hidden page and emergency simulation hold must not erode it unfairly. New transient state should clear on true defeat, safe encounter reset, travel, and import, without affecting existing serialized Rogue balance.

**Focus tests:** Rogue `thinking/travel/escape` including wounded bypass; species withdraw; ranged backpedal; voluntary captain/boss movement; Abyss Go-Around partial path; scripted Thornfang/captive return; boss unstick; contact on ordinary foe; blocked/moving/fast/out-of-range target; contact shield/no damage; no Dodge-based evasion after contact; no cross-zone seeking; all eleven pet/first-skill states untouched.

## 6. Per-rank numerical table

All damages below are *before defense*; `B = P+12` and damage uses `M(r)` once and **only once**. `k` increments at 2/4/6/8; cooldowns are fixed per form and change only with the existing global Cooldown Training/Slow systems.

| Skill 1 rank | `M(r)` | `k` | Paladin Cross arm reach / full width | Mage Wide Beam reach / full width | Hawk flight budget / same-retreat suppression |
| --- | ---: | ---: | --- | --- | --- |
| **1** | **1.00** | 0 | **190 / 70** | **440 / 96** | **560 / 4.00s** |
| **2** | **1.15** | 1 | 200 / 78 | 450 / 104 | 575 / 4.15s |
| **3** | **1.30** | 1 | 200 / 78 | 450 / 104 | 575 / 4.15s |
| **4** | **1.45** | 2 | 210 / 86 | 460 / 112 | 590 / 4.30s |
| **5** | **1.60** | 2 | 210 / 86 | 460 / 112 | 590 / 4.30s |
| **6** | **1.75** | 3 | 220 / 94 | 470 / 120 | 605 / 4.45s |
| **7** | **1.90** | 3 | 220 / 94 | 470 / 120 | 605 / 4.45s |
| **8** | **2.05** | 4 | **230 / 102** | **480 / 128** | **620 / 4.60s** |

**Damage relationships for any rank:** Auto basic beats = **`[1, 1.1, 1.2] * B * M(r)`**; Tap = **`3 B M(r)`** total for a perfect connect; Paladin charged = **`1.5 B M(r)` twice = `3 B M(r)`** per foe at both pulses; Mage charged = **`2.4 B M(r)`** per foe; Ranger hawk = **`2.25 B M(r)`** per legal contact. Rank increases do **not** create more cross pulses, beam hits, hawks, target-count slots or separate status stacking.

### Sanity check at hypothetical P=20, rank 1 (illustrative, not gameplay validation)

| Action | Raw single-foe damage | Base recovery | Damage divided by base recovery |
| --- | ---: | ---: | ---: |
| One ordinary basic (unmultiplied first beat) | 32 | 0.85s | 37.65 per second (combo avg is higher, excluding splash) |
| Any promoted normal Tap | 96 | 3s | **32.00/s** |
| Paladin Cross (both pulses) | 96 | 8s | **12.00/s** per foe |
| Mage Wide Beam | 76.8 | 7s | **10.97/s** per foe |
| Ranger Hawk | 72 | 8s | **9.00/s** per contact |

**Important throughput finding:** decoupling basic and Tap allows sustained **basic hits plus a separate 3s normal attack**. With P=20 at rank 1, rough ideal primary-target output is **`32*(1+1.1+1.2)/(3*0.85) = 41.41 raw DPS`** from full three-beat basic cycles **plus** **32.00 raw DPS** from repeated perfect Tap attacks, before action-time costs, combo reset, misses, projectile travel and protections; **73.41** combined is *not* an encounter DPS measurement. This is substantially more than the old shared-cooldown behavior. **Do not adjust boss HP or independently weaken companions to hide this change**; run focused play/fixture validation before merge and report whether the owner wants a separate balancing pass.

## 6A. Execution order and rule-table compatibility

This design intentionally changes the **meaning of slot 1 normal versus charged**, which the current runtime rule tables cannot express simply by changing the old `chargedSeconds[1] = 3`.

- Existing `R.balance.skills.cooldowns[1] = 0.85` belongs to the **old manual/basic shared resolver**. Migrate that original 0.85s baseline to the new automatic-basic timer. Set **activated normal Skill 1 to 3s** explicitly, rather than accidentally retaining the old 0.85s tap.
- Existing `R.cooldownBalance.chargedSeconds[1] = 3` is **one universal slot value**. Implement **class-specific** charged Skill 1 cooldown resolution for **Paladin 8s / Mage 7s / Ranger 8s** while preserving all other slot cooldowns and Cooldown Training. This requires an explicit class+slot choice, not a universal overwrite of the old `chargedSeconds[1]`.
- On valid charged release, store a **snapshot of class, rank, computed Power, zone and cast origin** where needed. Cross damage remains tied to cast-time Power over both pulses; hawk damage remains tied to launch-time Power when it later impacts. Cancel expired/pending temporary hit effects on target death, unsafe target state, zone switch, defeated/game-over state or save/load transition. Never serialize a live hawk/cross projectile into an old campaign as a hidden delayed hit.
- Charge cooldown is spent **once on successful cast launch/release**. Later misses, lawful hawk expiration or enemies leaving cross arms do not refund cooldown (same principle as other attacks). Invalid initial targets/path/cast eligibility fail **without** a cooldown charge. Delay does not rerun the normal Tap form.
- **Hawk hit order:** validate legal contact and native hit eligibility **while the retreat state is still present**; apply normal damage/protections (including current Rogue-regroup half-damage mitigation), and then atomically interrupt the eligible retreat + set its same-family lockout. Do not first erase `thinking/travel/escape` and accidentally grant the hawk undeserved full damage. Do not suppress a retreat on an ineligible/immune actor; legal contact into an ordinary absorb shield still counts for interruption as specified.
- **Clocking:** Cross 0.35s follow-up and hawk 1.25s flight use game simulation elapsed time. Paused/menu/hidden/emergency frames do not create free late hits or run offscreen pathfinding. A bounded, deterministic effect update step keeps draw/frame-skip distinct from combat simulation.

## 7. Mechanically precise regression and save-compatibility contract

### Hero timer split and v4 imports

- Retain the eight `hero.cd` slots and `hero.skills[0]` rank. **Only activated Tap/Charged skill 1 updates `hero.cd[0]`**.
- Introduce one dedicated **hero-basic timer** (suggested `hero.basicCd`, **not** `hero.skill1Cd`: the latter is the companion's unrelated first-special name). Decrement it through `cooldownRecoveryElapsed(hero,dt)` without causing two different timers to share readiness. Initialize to zero on a new campaign, validate finite nonnegative on v4 saves and preserve current outstanding value on newer saves.
- **Missing-field historical v4 migration:** when an imported hero has no `basicCd`, conservatively initialize `hero.basicCd = max(0, hero.cd[0])` while leaving the existing `hero.cd[0]` unchanged. If the legacy shared cooldown was active at save time, **neither** automatic nor the promoted Tap gains an immediate free action solely because of the split. Keep all other cooldowns/talents/party state unchanged. Store the new timer on future saves after validation (bounded as other hero timers are).
- Existing live combo step/target state is transient; do not convert a saved skill command into auto pursuit. Keep old `automaticBasic` semantics across projectiles and presentation and grant no auto-first-hit against protected bosses.
- Preserve **Cooldown Training** and Slow recovery on both timers. Do **not** apply the talent twice to the countdown or multiply cooldown by two class-specific buffs; write tests for no-Slow/rank-0 vs max-training and slowed windows.
- The automatic basic may continue during charge preparation if the hero can otherwise attack; the actual Skill 1 release is not an auto attack. Casting charged/normal Skill 1 does not reset combo step. No app-level charge slot 1 suppression solely because a former shared timer existed.
- Preserve ordinary NPC guard restrictions: Shield Stance blocks Paladin **both** automatic basics and activated normal/charged Skill 1 while shield held (as current Slot 1), while Mage Silence permits ordinary magical **automatic basic** but blocks **both activated** Mage Skill 1 techniques (currently normal slot 1 is exempt because it *is* basic; must change). These are intentional consequences of the new split, not incidental gameplay nerfs.
- Never alter `party.js` companion `u.cd/u.skill1Cd/u.skill2Cd/u.skillGlobalCd`, `party-pets.js` boss-pet first/second skills, veteran effects, Ranger Rally, Skill 2 unlock/companionCombatTraining repairs, shared bonus Power inheritance, onboarding, class hero rank or PWA architecture.
- For Ranger Hawk, new transient suppression must preserve native Rogue restart guards, prevent `newWound` bypass, not overwrite `_tacticalRogueNext` indiscriminately or drop active boss warning/scripted protection, and expire using simulation time. No new field in historical enemy saves without clear migration.

### Minimum focused proof (no comprehensive full-suite trigger)

1. 3 heroes x ranks 1/4/8 x no training/max training: automatic basics continue while normal/charged timers are occupied and vice versa; auto/normal/charged all scale with **one** skill rank.
2. Former charged-to-Tap shots: keep projectile timings/speeds/identity, normal 3s cooldown and immediate activation; rank scaling unchanged. Retain charge hold, interrupts, queued behavior and protected opener on **new** charged.
3. Paladin Cross: unique-hit-per-pulse, 8 distinct cap, rotating aim, 0.35s second pulse, movement without extra root and no self-damage, protected LOS/clipping; shield blocks both modes.
4. Mage Beam: every legal enemy in path, **no numerical target cap**, width edge vs selected target, no through-wall/guard bypass, one hit each; Silence blocks activated modes but not auto.
5. Ranger Hawk: 450 initial range, **1.25s or cumulative path limit**, single tracked target, ordinary dodge can't negate actual contact, no contact if obstruction, 4.0–4.6s **same-retreat only** lock; test all audited retreat kinds + safety exclusions.
6. Companion parity: Soldier Archer + 11 pet families ordinary/first/second skills, native timers, damage inheritance, Rally/Slow/Silence and Hero Skill 2 unlock; save rehydration of old positive hero/companion cooldowns.
7. First Vale/Thornfang protected opening, boss/TRUE phases, recalling, nav/map order, manual lock, offscreen/menu/game-over/emergency recovery, redraw/frame skipping. Ensure new effects integrate with sound/render safely without expensive repeated allocations/target scans.
8. Player documentation: readable bilingual Journal, training/teacher preview, Keeper archive, normal/charged figures, upgraded geometry/lockout, HUD action descriptions and first-combat guidance reflect the exact **live** rules, no invented specialist/lore or extra skill slot.
9. Manual/focused combat study against 1/3/5/8/12 foes, normal/TRUE boss, all companion counts and ranger retreat patterns; report sustained DPS and role utility before any merge/publish.

**No tests or browser suites ran for this documentation-only numerical specification.** It neither implements gameplay nor authorizes merge/deployment. The existing draft PR remains the one integration surface; reconcile open stationary-autoattack PR #436 there when gameplay coding is explicitly authorized.
