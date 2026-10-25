# Tap/Charged Skill Cooldowns — Owner-Directed Asymmetric Recovery Contract

**24 October 2026 · Draft PR #439 · owner-requested correction for hero Skills 1–8**
**Status:** new combat behavior implemented on PR #439's Area 1 draft branch and covered by a focused native smoke test, not merged, published, or fully playtested. This **supersedes** the older "one shared cooldown where either form blocks both for the full last-used duration" rule wherever that rule appears in the other PR documents. The owner has been the practical solo playtester and has reported that the former design makes charged skills unduly punish access to practical normal taps. The goal is to preserve tactical charged cooldowns while **never making a normal tap wait longer solely because charged was used**.

## 1. Exact gameplay rule

**Each hero skill slot gets a short normal-tap readiness timer and an additional charged-form readiness timer.** The charged form is allowed only if **both** are ready. The normal form is allowed as soon as **the normal timer** is ready; its eligibility never depends on charged readiness. Charged-form use locks normal only for the normal form's usual cooldown, while its charged lock remains longer:

- On **successful normal Tap of slot N**:
  - Set/restart **normal(N)** to `normalCooldown(N)`, e.g., 3s for Skill 2.
  - **Do not reset, extend, accelerate, erase, or replace charged(N)**. A charged lock already counting down continues normally.
  - Charged form cannot start until **both** normal(N) and charged(N) recover.
- On **successful Charged Hold of slot N**:
  - Set/restart **normal(N)** to that slot's **ordinary normal cooldown** (not the charged cooldown), e.g., 3s for Skill 2.
  - Set/restart **charged(N)** to that slot's **full charged cooldown**, e.g., 6s for Skill 2.
  - Once normal(N) reaches zero, **Tap is available** even if charged(N) remains >0. Charged is still unavailable until *both* timers reach zero.
- **Distinct slots are independent.** Casting Skill 2 does not touch Skill 1,3,4,5,6,7,8 cooldowns. **No new global recovery, shared haste lock, backlash, penalty, resource, or delayed charge threshold** is authorized.
- The normal availability is still subject to existing **other** restrictions (silence, shield stance, range/LOS, healing need, hit/death/interruption/Recall, target selection and legal cast/queue behavior). `partyChargeRecovery(hero)` remains a brief gate on beginning actual charged preparation after an interruption, and must **not** keep an ordinary Tap unavailable after its timer ends.
- **Automatic Skill 1 basics are a third, independent timer**, not blocked by either active Skill 1 normal or charged cooldown (except original combat restrictions). All three still scale from the same Rank 1–8 Skill 1 training.
- Both timer categories consume the **same amount of elapsed cooldown recovery** supplied by existing `cooldownRecoveryElapsed(hero,dt)` once per simulation frame. Thus **Slow**, Slow stacks/debt, Cooldown Training (-4% per rank up to -20%) and simulation pause behave consistently. Charge cost/damage/cooldown are fixed at use (unless existing rules explicitly adjust an in-progress cooldown). A Slow hit must not reset any timer; neither form bypasses Slow by switching timers.

### Reference examples, no recovery modifiers

**Skill 2** (`normal=3s`, `charged=6s`):
- Charged Skill 2 succeeds at t=0: `normal=3`, `charged=6`.
- At t=2: neither eligible.
- At t=3: Tap available, Charged still blocked for 3s.
- If player **does not tap**, Charged returns at t=6.
- If player **taps at t=3**, normal restarts through t=6 but **charged's original lock still ends at t=6**; both forms available then.
- If player **taps at t=5**, normal restarts through t=8, original charged lock ends at t=6; Charged does **not** become usable until t=8 because the most recent normal Tap still has cooldown.
- If player taps first at t=0: both forms blocked by normal to t=3 (even if charged timer was zero); Charged is never delayed beyond t=3 unless an older charged lock was already active.
- If a charged Skill 2 misses its target **after a legal launch**, cooldown still applies. If a requested cast fails before admission/cast consumption, start **neither** timer.

**Skill 7** (`normal=15s`, `charged=25s`): after a successful Charged Skill 7, normal Skill 7 returns at t=15 and can be tapped while Charged Skill 7 is still unavailable until t=25. Tapping at t=15 restarts only normal through t=30, so the next actual Charged Skill 7 readiness is t=30. This keeps both attacks tactical without an imposed 25s *normal* lockout.

**Skill 1 after PR #439** (`normal=3s`, Charged Paladin/Ranger=8s, Mage=7s): charging only blocks the promoted normal Tap for **3s**. Separate automatic basic cadence continues at 0.85s. Charging Mage Skill 1 does not cause a 7s ban on its thin beam, nor Ranger 8s ban on its 3-arrow Tap.

## 2. Unmodified base durations

Numerical durations listed below are the **unmodified base** across Paladin, Mage, Ranger; class-specific new Skill 1 charged differences are included:

| Slot | Normal Tap (seconds) | Charged Hold (seconds) | Other native rule |
| --- | ---: | ---: | --- |
| **1** | **3.0** | Paladin **8**, Mage **7**, Ranger **8** | Auto basics **0.85s** own timer; Tap is the former charged attack |
| **2** | **3** | **6** | Asymmetric rule illustrated above |
| **3** | **8** | **20** | **Paladin Shield Stance:** normal-tap timer starts when stance is lowered/ends, not at raise; tap to lower works during stance |
| **4** | **14** | **20** | Ranger charged Companion Rally requires eligible ally |
| **5** | **9** | **18** | Same normal/charged damage and area roles retained |
| **6** | **4** | **12** | Same class-specific skill behaviors retained |
| **7** | **15** | **25** | Preserves long charged cooldown without blocking normal for 25s |
| **8** | **24** | **40** | Normal becomes available at 24s after Charged, not 40s |

**Cooldown Training at 5 ranks** reduces each by 20% when set; for example Skill 2 3/6 becomes **2.4/4.8s**, Skill 7 15/25 becomes **12/20s**. All available times are further influenced by native Slow recovery **in-game**, rather than being assumed to follow wall-clock seconds while slowed.

### Paladin Shield Stance preservation

- On first **normal Tap Skill 3**, raise Shield Stance as already authored; keep normal cooldown starting **on lowering or natural expiry** (8s base). Do **not** consume new charged lock merely for stance activation.
- During active stance: normal Tap Skill 3 **must still lower it immediately**, even if the normal timer would otherwise prevent the action; charged Shield Bash remains unavailable while stance is up according to existing restrictions.
- On lower/natural expiry: assign normal Skill 3's 8s base timer; **do not reset existing charged Skill 3 lock**. This blocks a charged Shield Bash for 8s as intended and does not create a fake 20s normal lockout.
- On successful charged Shield Bash (when stance not raised): set normal Skill 3 timer **8s** and charged Skill 3 lock **20s**; once 8s elapses, Shield Stance Tap can be raised despite Shield Bash's remaining 12s charged lock.
- Snapshot/import while stance was raised triggers ordinary normal Skill 3 recovery (8s) when stance is force-ended; charge lock must be preserved separately. Never allow unlimited stance-toggle bypass of natural 8s recovery.

## 3. Implementation ownership without breaking saved games

- Retain `hero.cd[i]` array of eight entries as **the normal Tap timer** so extant HUD/read-only code and save shape can migrate predictably. Add `hero.chargedCd[i]` (or clearly named equivalent) as **eight charged-only lockout timers**. Do **not** make `hero.cd` the longer of the two or make charged lock one shared global timer. Use explicit `canTapSkill(slot)` / `canChargeSkill(slot)` (or equivalent) in **all** native casts, queued inputs, HUD, AI-adjacent instrumentation and unready feedback, including delayed skill-approach.
- At valid normal Tap launch: `hero.cd[i] = skillCooldown(slot,false)`; **leave `hero.chargedCd[i]` unchanged**.
- At valid charged Hold launch: `hero.cd[i] = skillCooldown(slot,false)`; `hero.chargedCd[i] = skillCooldown(slot,true)`. Handle Paladin normal Skill 3 shield raise/lower exception above. **Only successful admission** consumes cooldown.
- Both arrays decrement via **the same single computed** `heroRecovery` each tick; never calculate cooldown recovery twice and incur extra Slow stack/debt. Respect simulation-time pause, death, hero slow, rank/talent, and negative-time clamping.
- **Queue input semantics:** a sub-0.20s Tap on a slot with `hero.cd[i] == 0` can cast **immediately** even if `chargedCd[i]>0`; it must not be coerced into waiting for charged ready merely because the button has a long charged lock. Charged queues wait until **both** timers ready and then perform a full genuine **0.65s** charge preparation before release. Queued Tap waits **only** for normal timer. A brief hold during cooldown selects charged per existing queued 0.25s threshold. Per-slot queue choice and manual release rules must survive. Do not let a charged queue occupy the button so that the owner cannot tap normal for the next 20s; support independent form-specific intent or an explicit cancel/replacement route where necessary. A queued charged request never fires early as a normal tap.
- **UI and audio:** for each skill expose *two separate readiness metrics*, e.g. `Tap READY · Charged 3.0s`, without claiming "Skill unavailable" when Tap is ready. Show both class-specific Skill 1 numbers. Ensure button visual states, skill Journal, comparison/training menus, icons, touch/keyboard accessibility and Keeper Archive explain the asymmetric relationship in English and Spanish. The normal-first-cooldown reading is especially important for the Solo Ranger player's healing/movement utility and late Skill 7/8 timings. Audio charge cues must not activate for a queued charged cast until it actually begins prep.
- **Save compatibility (v4):** continue validating the existing eight finite nonnegative `hero.cd` values and the newly introduced eight `hero.chargedCd`. For old saves **missing `chargedCd`**, the old `hero.cd[i]` is an **ambiguous last-used-form shared remaining cooldown**. Preserve safety without permanently extending Tap: set `chargedCd[i] = old hero.cd[i]`; clamp normal `hero.cd[i] = min(old remaining, current skillCooldown(slot,false))`. This gives the normal form **at most** one ordinary cooldown after load while retaining the old remaining charged wait; accurately reconstructing the original cast form/time is impossible from the legacy field. Existing Shield Stance save-end exception applies first. Do **not** infer the new charged form had already been used in older save (it did not exist), nor let old saves grant immediate charged attacks while an existing 25s lock was running. Do not reset companion `u.cd/u.skill1Cd/u.skill2Cd/u.skillGlobalCd`, roster training, hero ranks or gear.
- New campaigns initialize `hero.chargedCd = Array(8).fill(0)`; still introduce independent Skill 1 `hero.basicCd` as in the [numerical Skill 1 specification](HERO_SKILL1_FINAL_BALANCE_SPEC_20261024.md). For an old save also missing `basicCd`, snapshot the **pre-migration** `hero.cd[0]` before clamping for normal and initialize basic to that previous nonnegative remaining value conservatively. After load, the full `hero.cd[0]` must no longer own automatic basics.
- Queued charged inputs, live hero charge preparation, transitory hawks/cross area markers are **not** serialized; handle zone, death, Recall, paused menu, skill-approach and interrupted charge recovery as currently authorized, with explicit tests.

## 4. Tests required before any merge or deployment

1. Matrix: all **8 skills × 3 hero classes** (where skill learned) × Tap-first and Charged-first; with no modifiers and max Cooldown Training. Check Tap starts only its own cooldown; Charged starts **both** with their proper durations; Tap during charged lock does not restart/erase it; Charged requires **both** ready. Include Skill 1 auto basic and class-specific 8/7/8 charged timers.
2. Time sequences for Skill 2 t=0/3/6/8, Skill 7 t=0/15/25/30, and Skill 8 t=0/24/40 with intervening Tap. Confirm no cumulative global cooldown or hidden anti-spam penalty.
3. Slow applied mid-cooldown and its expiration, stacked slow/debt, paused-game/load clock and cooldown training: *both* timers recover consistently, without double recovery or bypass. Check interrupted charge ~0.5s recovery and no unintended Tap lock.
4. Charge input/queue: immediate normal Tap while charged-only lock active; queued Charged never slips through until both ready; queued Tap independent; cancel/release/retarget/range/middle-release consistency; GUI displays separate counters on desktop/touch including assistive technology and both languages.
5. Paladin Shield Stance repeated taps, auto expiry, abort/death/save, charged Shield Bash then stance, stance then charged Shield Bash; no stance exploitation. Mage Silence normal/charged Skill 1 changes from the integration, and unchanged Skills 2–8 eligibility beyond cooldown policy.
6. Safe v4 migration with legacy `hero.cd` remaining from normal or charged, positive numbers, interrupted/cancelled charge, shield; no companion timer/rank resets; verify roundtrip persist of both new arrays and new basic timer, reject malformed data.
7. Skill 1 Paladin two-hit cross, Mage every-enemy line, Ranger hawk contact/retreat break preserve charged and normal timer separation; 11 pets and Soldier/Archer first/second skills remain independently scheduled. Do not alter existing sound effects, boss return safety or player instructions about true current cooldowns.

**Implementation boundary:** This owner-directed behavior now has an executable initial implementation in draft PR #439. See [Area 1 checkpoint](HERO_SKILL1_AREA1_IMPLEMENTATION_20261024.md). Integrate with the same PR's visuals, sound and bilingual in-game descriptions when source-code work is separately authorized; run only focused tests, and do not merge/deploy without permission.
