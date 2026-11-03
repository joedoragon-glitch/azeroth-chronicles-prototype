# Ranger normal/charged identity — eight-skill source audit and focused redesign

**So I Became the Dark Lord's Problem** · 3 November 2026 · **Read-only gameplay audit + proposed design; no gameplay implementation or approval of exact tuning.**

## Why this review exists

The owner observed that some advanced **Strategist** proposals mistakenly treated charged actions as higher levels of normal actions. That is **not** a universal design law in this game. Normal and charged forms may perform markedly different tactical jobs while sharing a slot and learned rank. This prompted an independent fact-check of **Ranger skills 1–8**; the observation is a hypothesis to test, not a verdict imposed on the Ranger.

This review uses the live `main` combat owners `src/prototype/hero-combat.js`, `src/prototype/rules.js`, and the player description owner `src/prototype/skill-reference.js`. Historical design context: `docs/HERO_CLASS_SKILLS_2_8_CONSOLIDATED_REVIEW_20261015.md` and `docs/HERO_SKILLS_COOLDOWN_ROTATION_DAMAGE_AUDIT_20261015.md`. The separate Strategist draft #697 is **not** authority to rewrite this class.

### Decision test

A shared bow/arrow theme, training rank, or cooldown button does **not** itself make a pair redundant. The relevant question is whether the charged action provides a **different tactical decision**—different target, timing, position, cooperation, or counterplay—or merely improves the same release's damage, coverage and duration. A slower cooldown alone does not supply a different mechanical identity. Nor is the converse mandatory: **we should not force every healthy pair to become unrelated moves**.

## Confirmed current source behavior

| Skill | Normal / charged, as implemented today | Disposition |
| --- | --- | --- |
| **1** | **Rapid Arrows:** three staggered physical arrows directed at one foe, splitting one ordinary tap damage budget. **Hawk Interception:** autonomous moving hawk seeks a foe and, on real contact, can stop an active retreat; it is not a three-arrow upgrade. | **Preserve.** Distinct offense and anti-retreat pursuit. |
| **2** | **Pinning Shot:** two staggered physical arrows with Slow against one foe. **Pinning Volley:** physical projectiles to enemies inside an aimed line, applying Slow on lawful contact. | **Preserve provisionally.** Different single-foe versus formation-interception geometry; shared Slow is intentional. This is a *borderline family resemblance*, not evidence demanding change now. |
| **3** | **Self-Heal:** heals the hero only, unavailable when hero HP is full. **Party Heal:** same per-recipient healing to all wounded living active party members **including hero**; unavailable when nobody needs healing. | **Preserve.** Personal sustain versus team rescue and a longer charged recovery; cannot revive the fallen. Charged includes the hero but is not a universally preferable cast. |
| **4** | **Movement Haste:** hero movement boost. **Companion Rally:** movement and ordinary-basic attack-speed boost for eligible nearby living companions; invalid without a recipient, no boost to their special recovery. | **Preserve.** Source-proven clear difference in who benefits and why. |
| **5** | **Arrow Volley:** immediate physical arrows to up to six nearby foes, roughly 350-unit radius, 2.3×Power per enemy before rank scaling. **Arrow Rain:** immediate arrows to up to eight foes within roughly 370+ radius, 2.9×Power plus Slow. | **Redesign proposed.** Same area-hit tactic with more damage/coverage and an added Slow; overlaps Skill 2's crowd control. |
| **6** | **Repelling Shot:** one physical hit, (1.8×Power+20), pushes 45+ units on impact. **Repelling Volley:** three arrows aimed at the same enemy, 4.2×Power total, last arrow pushes 65+ units. | **Redesign proposed.** Same damage-and-push tactic at larger numerical strength. |
| **7** | **Piercing Arrow:** one high-damage (10×Power) defense-piercing arrow. **Charged Piercing Arrow:** one 12×Power defense-piercing arrow with Slow. | **Redesign proposed.** Same precision strike improved by damage plus Slow; slow also overlaps Skill 2. |
| **8** | **Hunter's Salvo:** multi-foe immediate arrows, up to three selected eligible foes, one 5×Power arrow each (two when isolated). **Grand Hunt:** up to five foes, two 4×Power arrows each (three when isolated). Both non-piercing. | **Redesign proposed.** Most direct example of a bigger, stronger copy of the same distributed burst. |

Rank-1 coefficients above are before rank multiplier, protections, projectile misses and defensive reductions. Both forms use the existing eight-rank investment and action-specific readiness. **No recorded bug in damage calculation or projectile contact is being claimed.** The issue is tactical design redundancy, not missing execution.

The other classes demonstrate why no universal “charged = upgrade” rule exists: Paladin Skill 3 **Shield Stance** versus **Shield Bash**, and Mage Skill 3 **Spell Interrupt** versus **Silence Field**. The Ranger's own Haste/Rally pair is an even clearer example.

## Charged-form alternatives — working candidates, NOT final owner-approved canon

Keep the **normal** versions of Skills 5–8, their lesson slots and rank investment. Replace only the *charged* action where the tactical difference is inadequate. These concepts deliberately avoid stronger normal copies and generic 'one more arrow + longer Slow' solutions. New names, numbers and additional mechanics below are **designer candidates**, not code facts or locked balance.

### Skill 5 — Arrow Volley / Arrow Rain: burst versus holding ground

- **Tap (unchanged): Arrow Volley.** Immediate spread of real arrows at enemies presently around the Ranger. Ideal for a pack already in range.
- **Charged (proposed): Arrow Rain becomes a placed, short-lived rain zone** centered on the Ranger's position at release. After a brief visible onset, arrows continue falling for approximately **3–4 active-game seconds**. An enemy already inside when rain begins or entering later can be struck **once per zone** (provisional cap **6 distinct victims**) at lower damage per victim than the existing immediate charged volley. Additional enemies arriving during the effect are its particular advantage.
- **Why this is different:** Tap cashes out damage *now*; charge is a **commitment to holding a location / punishing an advancing wave**. The player may reposition while the rain stays behind. It does **not** grant a larger instant hit or automatically apply Slow—the latter belongs more naturally to Skill 2.
- **Implementation boundaries:** world-space location fixed after release, not tethered to moving hero; actual collision/line-of-sight checks at lawful contact; bounded one active zone per Ranger and one hit per enemy per zone; no after-death, zone-change or save-restore ghosts. Presentation must show where falling arrows can actually hit; no decorative persistent hazard with invisible damage.

### Skill 6 — Repelling Shot / Rearguard Volley: drive one foe back versus disengage yourself

- **Tap (unchanged): Repelling Shot.** One precisely aimed collision-safe knockback to remove a nearby threat from a vulnerable ally or the Ranger.
- **Charged (proposed): Rearguard Volley.** A **collision-checked backward step** (provisionally up to **80–100 world units**, opposite the aimed enemy), accompanied by up to **three modest arrows at distinct pursuers** in a narrow covering fan. No automatic knockback and no three-arrow focus-fire multiplier on a single enemy.
- **Why this is different:** Tap changes **enemy** position while preserving the Ranger's own position; charge changes **Ranger** position and buys a lane of escape, useful against converging melee threats. It is not a stronger push.
- **Implementation boundaries:** never leap through walls, hazards or forbidden boss boundaries, teleport across closed paths, grant immunity, cancel Recall by accident or defeat existing movement orders. If no safe backward destination exists, refuse the charged action **before** consuming cooldown; report the understandable reason. Existing boss attack selection/timings are not touched. The candidate action name replaces the misleading “Repelling Volley” label only if adopted.

### Skill 7 — Piercing Arrow / Severing Shot: armor penetration versus timed interruption

- **Tap (unchanged): Piercing Arrow.** High-value, direct, defense-piercing damage against a single armored enemy; retains its specialized solo-boss role.
- **Charged (proposed): Severing Shot.** A **lower-damage physical arrow** (candidate around **3×Power** before rank scaling), without guaranteed defense bypass. If and only if it **actually hits while its victim is preparing one eligible warned/aimed attack**, it cancels **that one pending release**; an ordinary hit without an eligible current warning only deals modest damage.
- **Why this is different:** Tap is dependable armor damage. Charged rewards **observing a dangerous tell and timing a projectile before release**. It is a real defensive answer, not a more powerful Piercing Arrow plus Slow.
- **Implementation boundaries:** reuse the existing single-action interruption eligibility/cancellation semantics where appropriate; projectile may miss or arrive too late. Do not erase a boss's queued future stages, cancel irreversible attacks, pre-apply status at launch, create blanket boss immunity, or confuse enemy threat/targeting. Display a clear readiness/timing description. The Mage's instant-style interrupt differs because the Ranger must land a physical shot.

### Skill 8 — Hunter's Salvo / Grand Hunt: pack burst versus coordinated quarry

- **Tap (unchanged): Hunter's Salvo.** Direct immediate arrows distributed among up to three enemies; retains the existing isolated-foe fallback.
- **Charged (proposed): Grand Hunt becomes a **single-target coordinated hunt**. A modest physical **marking arrow** must genuinely land on one selected foe. For a short **~5–6-second hunting window**, the first **ordinary basic-attack hit** on that marked foe from each distinct eligible active actor (Ranger included) calls one **additional physical Ranger follow-up arrow**. Provisional limit: **four follow-ups in total**, each with bounded damage, line-of-sight and real projectile flight. It does not deliver the old five-target burst.
- **Why this is different:** Tap answers **multiple enemies immediately**; charge rewards **keeping the squad focused on one quarry** and spacing genuine basic hits. With no companions, it still has a small hero-only benefit but is deliberately less compelling than a solo tap. Unlike Companion Rally, it grants **no generalized attack-speed increase or special-cooldown acceleration**.
- **Implementation boundaries:** one marked foe at a time; no per-hit recursive follow-ups, no trigger from skills, support ticks, damage-over-time, misses or follow-up arrows themselves; one trigger per eligible actor, total cap and finite window. Mark and triggers clear on target death, returning/protection, zone change, hero death and restoration. Proper provenance for pets or Charmed allies; no enemy AI command override or fake extra companions. A single critical-execution roll at original release, never a new roll per follow-up.

## Rank growth, balance and engineering acceptance (proposal)

- Preserve shared **Rank 1–8**, existing training/instructor costs, **0.65-second charged hold**, **asymmetric normal and charged cooldowns**, global recovery and the established cooldown training/passives. Any coefficient/duration changes require a deliberate balance pass. In particular, independent charged cooldown does **not** imply free use during a normal cooldown.
- Preserve normal Skills **1–8** and charged Skills **1–4** unless a **new source-backed defect** is demonstrated. No blanket repair of Paladin, Mage, Rogue or Strategist. No automatic Skill 2/3 redesign simply because their effects share a theme.
- The rank multiplier `1 + 0.15 × (rank - 1)` should remain meaningful for attacks. For new timed/positional forms, even-rank improvements can modestly grow duration, geometry or capacity, but every paid rank must grant an actual measurable benefit. Avoid scaling target caps or proc chains into unrestricted crowd damage.
- Test the real **input → admission → release → physical contact/effect → recovery** path. Include target loss/blocked sight, interrupted preparation, no-safe-backstep, no living party, entering/leaving Rain, late interrupt, multi-arrow impact accounting, one-time mark triggers, damage reduction and boss phase scripts.
- Assert one critical roll per valid charged cast; no rolls per Rain tick or Grand Hunt follow-up, no double use of the same critical enhancement. Compare performance in crowded fights, capped effect counts, event/audio ownership and Canvas/Pixi presentation before claiming acceptance.
- Preserve **v4 saves**, regional transition and death cleanup, pause semantics, old trained-skill ranks, basic attacks, existing normal/charged UI/touch controls, and English/Spanish skill descriptions. Transient fields should not accidentally persist; old saves should load without migration.
- Do **not** rebalance the hero or other classes globally to make these designs fit. Keep individual tests focused; full suites, merges, publication and physical-device claims remain separate permission/verification gates.

## Status and handoff

**Verified in source:** the actual eight current tap/charged behaviors and the finding that Skills 5–8 substantially rely on numerical superiority. Skills 1–4 are retained after audit.

**Designed, not implemented:** four distinct charged alternatives, candidate names/numbers, and an explicit acceptance contract. They are **not approved final skill mechanics**, and the existing game descriptions remain correct until an implementation is separately approved and shipped.

**Not performed:** code edits, native gameplay tests, balance simulation, build, automated CI certification, merge, deployment, mobile/Chromebook verification. Documentation-only changes in a draft branch are a design checkpoint, not a player-facing release.

**Next engineering action if the owner accepts this direction:** implement these charged changes as one coordinated Ranger feature using `hero-combat.js`, `rules.js`, existing combat and party event owners, `skill-reference.js` and relevant tests, then reconcile this document as implemented and verify the exact head. Do not transplant the separate Strategist proposals or reopen healthy Ranger skills.
