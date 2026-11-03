# So I Became the Dark Lord's Problem — Mage tap/charged skill design audit

**3 November 2026 · design-only working proposal · source checkpoint `bbc482b70d472d79fb3e66fad92390d3b47a0184` (`main`).**

> This is a factual audit of **current playable Mage behavior**, followed by **candidate creative corrections**. The owner has clarified that a charged form is not required to be a numerical or area upgrade of its normal form. A pair can offer two genuinely different tactical decisions. This instruction does **not** prove any existing Mage skill defective. None of the candidates below is implemented, owner-approved as an individual move, tested, merged, deployed, or device-verified. Existing playable rules remain authoritative until a later, separately authorized implementation.

## Source and comparison

- Live skill identities and menu text: [`src/prototype/skill-reference.js`](../src/prototype/skill-reference.js) lines 59–106; the read-only rank projection at 391–598.
- Native cast decisions/contact semantics: [`src/prototype/hero-combat.js`](../src/prototype/hero-combat.js), especially `castMageChain`, `castHeroUltimate`, `castChargedAdvanced`, `cast`, Skills 1–4 and normal Skills 5–8.
- Ratios, radius, target caps and trained rank data: [`src/prototype/rules.js`](../src/prototype/rules.js) `chargedSkills`, `heroTactics`, `classUltimates`, `advancedCharges`, `heroAreaTargetCaps`.
- Approved older background: [`HERO_CLASS_SKILLS_2_8_CONSOLIDATED_REVIEW_20261015.md`](HERO_CLASS_SKILLS_2_8_CONSOLIDATED_REVIEW_20261015.md) and [`COMBAT_CONDITIONS_V09.md`](COMBAT_CONDITIONS_V09.md). Historical snapshots are supporting context, not a substitute for current source.
- Evidence that dissimilar forms are permitted today: **Ranger Skill 4** normal grants self movement Haste; charged applies companion movement/basic-attack Rally and requires eligible companions. **Paladin Skill 3** normal raises a defensive stance; charged strikes/pushes a cone. **Mage Skill 3** normal interrupts one current warning via a physical hit; charged creates a bilateral, self-silencing field. The 'larger copy' pattern is plainly **not** a universal rule.

**Audit criterion:** Compare what the player *chooses to do*, not just animation names or different numerical values. A different target profile alone may make a form situationally useful, but merely increasing area, target count, potency or duration, without a new tactical decision or downside, is a design-overlap candidate. This is a qualitative design classification, not a runtime defect or proof that a skill is badly balanced.

## Actual Mage audit — all eight slots

| Slot | Current normal | Current charged | Finding | Disposition |
|---|---|---|---|---|
| **1 — Arcane Beam** | Focused aimed/homing single-target beam; separate automatic same-target 3-beat combo. | Wide, committed line corridor can strike multiple enemies with larger damage. | **Borderline upgrade-pattern**: line commitment does create a positioning choice, but the current description and payoff mainly sell a wider, stronger beam. | Propose a sharper precision-versus-homing distinction; retain automatic combo. |
| **2 — Frost Bolt** | One traveling hit damages and Slows one enemy. | Instant target-centered Frost Burst damages and Slows several in a larger circle. | **Upgrade-pattern**: same damage-plus-Slow package mainly expands affected enemies; the targeted AoE is tactically useful but not a fresh spell decision. | Propose an actual persistent crossing-control alternative. |
| **3 — Spell Interrupt** | Hit a warned/aiming foe with a traveling projectile to cancel that *one current action*. | Place a short-lived Silence field around Mage, preventing special activations from enemies, allied casters and Mage himself. | **Distinct and intentional**: single precise interception versus dangerous bilateral area suppression. | **Keep both unchanged**; not a redesign target. |
| **4 — Arcane Fracture** | Single traveling damage/vulnerability application. | Larger instant splash with greater, longer vulnerability on everyone hit. | **Strong upgrade-pattern**: same Fracture payload distributed more broadly. | Propose application versus deliberate detonation. |
| **5 — Force Pulse** | Damage and collision-safe push to nearby enemies; capped at six. | Bigger damage/push in a wider pulse; capped at eight. | **Strong upgrade-pattern**: same radial shove with improved figures. | Propose push-versus-pull positional choice. |
| **6 — Magic Shot** | Projectile damages and briefly Slows one target. | Faster, stronger focused beam projectile that Slows longer. | **Strong upgrade-pattern**: change of projectile style is real, but combat consequence remains a stronger Slowing shot. | Propose offense-versus-self-reposition. |
| **7 — Arcane Chain** | Instant capped chain damage to up to three selected/nearby foes. | More chain damage to up to five foes across a larger radius. | **Strong upgrade-pattern**: same instant bounce pattern with greater figures. | Propose damage-versus-mana-conversion chain. |
| **8 — Astral Detonation** | Instant targeted explosion: major primary and smaller secondary damage; cap five. | Larger/harder explosion: cap seven plus brief nonstacking Fracture. | **Partial upgrade-pattern**: the additional Fracture adds a setup role, but the main action is still a superior instant explosion, overlapping Skill 4's debuff. | Propose immediate detonation versus delayed area denial. |

**Verdict:** **7 of 8** deserve design attention under the owner's stronger creative standard: 1, 2, 4, 5, 6, 7 and 8. **3 is already differentiated.** Severity differs: 4–7 are the clearest copies; 1 and 2 have legitimate positional/targeting distinctions and should *not* be described as broken. Finding an upgrade-pattern is not proof that a pair lacks balance, that players dislike it, or that existing code has a bug.

## Candidate paired design — preserve the Mage's eight normal identities

**Design principle:** Leave the eight *normal* actions and the automatic Skill 1 combo intact as the established starting point. Change the *charged* choice only where necessary, so that waiting 0.65 seconds yields a different tactical commitment, **not automatically more of the normal effect**. Working titles, multipliers, distances and durations below are provisional. Keep cooldown cost/rank curriculum until measured balance justifies a change; charged is not guaranteed higher direct damage.

### Skill 1 — Arcane Beam / **Arcane Spear** (candidate)

- **Normal unchanged:** a reliable focused single-foe beam; the separate automatic three-hit combo keeps its normal identity and existing fourth-second target ownership rules.
- **Charged candidate — Arcane Spear:** instead of the existing broad instant corridor, release a **very narrow, straight, aim-locked piercing beam**. It can contact at most three real enemies in a row; damage is divided across contacts rather than delivering the current broad high-damage wash. The Mage must deliberately line enemies up and cannot retarget/homing-correct after release. Against a lone moving foe, normal is the reliable choice; charged rewards position and alignment rather than power.
- **Guards:** no through-wall strikes; line of sight/collision at actual contact; a frozen release aim with deterministic ordered hits; no additional Skill 1 combo hits or duplicate critical rolls; no ability to make the beam a superior single-target boss shot by stacking contacts. Existing beam travel/presentation contracts need targeted regression.

### Skill 2 — Frost Bolt / **Rime Crossing** (candidate)

- **Normal unchanged:** direct Frost Bolt impact with modest damage and Slow on one foe.
- **Charged candidate — Rime Crossing:** inscribe a short-lived **stationary frost threshold centered on the selected target's release-time position**, not an immediate circular blast. It deals **no upfront AoE damage**. Each enemy that *actually crosses into* its narrow perimeter can be Slowed once; staying inside does not retrigger and stepping in and out does not farm stacks. The line becomes useful in retreats and at choke points, not as a guaranteed multi-hit version of Frost Bolt.
- **Guards:** no fabricated walk-blocking terrain; never cancel active enemy warnings; time-limited (candidate 3–4s), cap entrants (candidate four), single live threshold per Mage; collision/LOS and eventual disappear-on-travel/death handling; boss Slow still follows existing resistance/recovery rules. When enemies remain stationary, charged may yield nothing: that is a legitimate positional risk, not an excuse to add an instant blast.

### Skill 3 — Spell Interrupt / Silence Field — **retain current pair**

Normal remains one projectile-delivered interruption of a currently warned/aimed attack. Charged remains a short, bilateral Silence area around the Mage and must continue to suppress eligible allied and Mage special activations as well as enemies. Preserve present basic-attack exceptions, boss handling, readiness/cooldowns and warning-ownership checks. No new form is proposed.

### Skill 4 — Arcane Fracture / **Arcane Shatter** (candidate)

- **Normal unchanged:** apply direct damage and a finite single-target, strongest-only incoming-damage Fracture. It is the *setup* cast.
- **Charged candidate — Arcane Shatter:** target one foe and **spend an active Mage-authored Fracture** to cause a short-range, capped arcane splash from that enemy. The splash is strongest when it consumes actual remaining vulnerability; it **does not apply or refresh Fracture**, cannot consume another class's unrelated source, and may be cast without a prior mark for a much smaller fallback impact. The decision is whether to preserve the party damage window or cash it in now.
- **Guards:** consume only one valid current effect; calculate reward from bounded remaining Fracture strength/time rather than raw enemy maximum HP; up to three additional visible contacts, fixed one-shot damage/critical receipt, no chained detonation or reaction to this damage; test overlapping charged Skill 8's historical Fracture carefully if implementation changes later.

### Skill 5 — Force Pulse / **Gravity Draw** (candidate)

- **Normal unchanged:** immediate nearby damage-plus-outward push; an escape and breathing-room button.
- **Charged candidate — Gravity Draw:** choose to **draw a small number of nearby enemies toward a safe point just ahead of the Mage** to bring a loose group together, with little or **no upfront damage**. Normal creates distance; charged risks reducing it to set up a follow-up spell. It is not a bigger shove in reverse merely for damage: the tactical consequence is deliberately inviting danger into a chosen area.
- **Guards:** cap pulled enemies (candidate four), limit displacement (candidate 35–55 world units), collision-aware move each candidate through legal ground only, never pull through walls, across boss leashes, out of authored arena hazards or through protected encounter transitions; enemies immune to displacement remain immune. No lasting snare, stun, immunity or forced scatter status.

### Skill 6 — Magic Shot / **Phase Shot** (candidate)

- **Normal unchanged:** ordinary targeted damage-and-Slow projectile, useful for slowing pursuit.
- **Charged candidate — Phase Shot:** launch a **modest magic projectile from the original Mage position**, and at release execute a **short collision-checked retreat** directly away from the selected foe (candidate 70–95 world units). The charged projectile has **no Slow** and is not a stronger shot; the value is creating distance while firing. It does not grant invulnerability, damage avoidance during the charge, or the Strategist's unique passive Dodge.
- **Guards:** require an actually legal retreat segment before committing mana/cooldown (otherwise fail without payment); no jumping walls, bypassing ferry/entrance bounds, escaping boss arenas, or cancelling manual navigation by surprise. Projectile must still travel and hit physically; no free impact because Mage moved. If forced scatter or stun makes the release invalid, preserve existing input priority.

### Skill 7 — Arcane Chain / **Mana Circuit** (candidate)

- **Normal unchanged:** an immediate, capped offensive leap among nearby selected foes.
- **Charged candidate — Mana Circuit:** make a **non-damaging arcane circuit** through up to four separate currently eligible foes and regain a **fixed small amount of Mage mana for each genuinely linked foe**. This is resource recovery in exchange for giving up Arcane Chain's large damage. The target search remains visible/collision-legal and bounded; a single enemy yields a small return, packs reward planning without generating damage.
- **Guards:** enemies do **not** have an invented mana stat to drain; the pulse restores only actual Mage MP up to existing maximum, and must not refund more resources than designed after accounting for cast cost. One contact per foe, no repeat activation, no linked damage, no instant cooldown resetting, no hits manufactured on out-of-range/dead targets. Avoid an infinite mana loop even at maximum training.

### Skill 8 — Astral Detonation / **Astral Convergence** (candidate)

- **Normal unchanged:** reliable immediate targeted explosion with primary-plus-secondary damage; the fast burst remains the Mage's emergency kill option.
- **Charged candidate — Astral Convergence:** establish a **fixed, visible celestial focus at the selected foe's position at release**, with **no initial explosion or Fracture**. It then delivers **two separately telegraphed, moderate bursts** within that stationary region over a short finite lifetime (candidate ~2.5s). Enemies can leave; keeping the battle within the focus can beat the instant normal blast in aggregate, but a fleeing boss can evade most of it. The player deliberately trades certainty for zoning and coordination.
- **Guards:** selected enemy position is snapshotted, not homing; target caps per pulse, one living focus per Mage, legal LOS at each pulse, no instant proc on cast, no repeating critical roll, never hit combat entrants who were not legally admitted when the chosen targeting rules require contact receipts; finite timers cleaned up on death/zone change/pause/restore. Normal's known immediate capped burst remains effective.

## Design separation / risks and provisional constraints

1. **Distinct decisions at every modified slot.** Aim/homing vs line commitment (1); immediate Slow vs crossing-zone control (2); single action cancellation vs bilateral suppression (3, preserved); apply Fracture vs consume (4); push away vs invite inward (5); slow one attacker vs Mage reposition (6); immediate damage vs finite mana recovery (7); instant burst vs delayed stationary control (8). Different *actions*, not simply bigger numbers.
2. **Mage identity:** beam precision, frost tempo, risky antimagic, arcane vulnerability, spatial forces, mobile casting, chained resonance and astral control. Avoid borrowing Paladin wards/taunts, Ranger heal/Rally, Rogue musical boons/Charm or the proposed Ogre's authentic material mechanics and one-event Reversal.
3. **Cooldown/rank:** keep eight shared trained ranks and separate normal/charged readiness, 0.65s hold, existing mana/cast cancellation and +15% normal damage rank growth. New charge effects must show *truthful rank-dependent improvement* in instructor/journal and combat; no dead paid ranks. Do not mechanically apply an unconditional 15% damage growth to non-damaging Mana Circuit.
4. **Save/runtime:** no save schema bump for transient zones, links or marks; transient state must be properly discarded on death, zone change, succession, reload and recovery. No autonomous world generation from casts, no changes to map collision, bosses or active warnings, and no infinite status/tick effects.
5. **Visual/audio/controls:** support English/Spanish, keyboard/phone hold, charge cancellation, readable telegraphs (enemy warnings still distinguishable), Canon-first existing art, Canvas 2D and PixiJS effects; charge announcements should describe the *actual* different function. Keep total active effects bounded to avoid mobile frame spikes.
6. **Critical actions:** one permitted critical decision at actual valid cast release, carried across projectile contact and later deterministic pulses; never roll again per target/tick or manufacture phantom damage. Each candidate requires explicit critical-category handling, including non-damage resource/position effects.
7. **Inter-class coordination:** other class audits may be happening concurrently. This Mage branch must not rewrite Paladin, Ranger, Rogue, the Strategist's separate draft #697, or shared maintained decisions until accepted. Do not assume a source file which has advanced since this checkpoint is unchanged when implementing.

## Engineering handoff, conditional on later scope authorization

Before code changes: resolve exact Mage design preferences that materially affect class identity; decide which proposals to retain versus adapt. Then revise `rules.js` / `hero-combat.js` and read-only skill-reference projections in one isolated implementation branch, update English/Spanish menus, audio and visual semantics, and tests. The smallest relevant validations include every changed slot at ranks 1/4/8, charged interruptions, valid/invalid targeting, projectile impact vs launch, boss and protected-target rules, collision and los, active companion interactions, damage/critical receipts, mana/cooldown economy, older v4 saves, Canvas/Pixi visual parity, and performance bounds. Do **not** initiate the full game suite, merge, deploy, or claim device results by virtue of this design document.

**Status:** source behavior inspected; design alternatives documented; **no gameplay alterations and no game tests performed**. This review records a credible design-improvement opportunity, not a confirmed gameplay regression. The author can review or replace any candidate without losing the current functioning Mage.
