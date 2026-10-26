# Greenwood melee anti-kiting pilot — Crown doctrine

**Status:** experimental branch only. Do not merge, publish, or enable outside Greenwood on the strength of this source-only change. Human playtesting and focused execution remain acceptance gates.

## Authorial direction and martial provenance

Marshal **Veyra**, the Ash Sentinel and commander associated with the Citadel of Ashes, is the Crown's martial authority. Canon already describes the Citadel as her academy and states that Crown officers teach combatants from different peoples a common drill (rules.js). Treat that instruction as a strategic influence on the hostile field army, **not** proof that every Goblin or Skeleton personally trained with Veyra.

The general fighting grammar can draw from several established masters without literal skill copying:

- **Veyra — Sentinel Advance, Ash Lanes, Guard Pivot:** committed movement, control of likely travel lanes, precise timing and a response that adapts to where the hero is going.
- **Thornfang — Dynamic Entry and Tripwire:** bounded aggressive pursuit, movement prediction and a physically executed catch-up attempt.
- **Lifebinder — Crypt geometry and Grave Threshold:** make the route matter and threaten predictable movement without granting ordinary monsters a boss-scale arena attack.
- **Scornfang, Greenwood's captain — pursuit and disrupting a retreat:** practical command of spacing, pressure and recovery.

Shared doctrine is intentional: species-specific animations, weapons and later move accents may be layered over it, but the *tactical principle* should not be species-locked or mechanically identical to its powerful source.

## First test scope

**Enabled:** Greenwood Vale ordinary melee monsters, including normal melee guards in the Forest Crypt and Vale service/side interiors. The existing target-selection, combat-conditions, navigation, ordinary leash, damage mitigation and existing Rogue behavior remain the source of truth.

**Excluded:** ranged and hybrid monsters, all Ringleaders, captains, all bosses (including Thornfang, Lifebinder, Veyra), boss summons, Ringleader-created emergency guardians, and enemies in all other regions. None of those enemies acquires a new move in this pilot.

## Prototype: Vale Interception

An engaged eligible melee enemy outside its basic-attack range but within 155–480 world units can prepare a repeatable intercept after just **0.35 seconds** of chase-range pressure. The trigger deliberately does **not** demand a wounded, outnumbered, recently damaged or explicitly retreating victim: a stationary distant shooter also deserves resistance. It is **not** gated by Rogue eligibility.

The attacker reads observed victim motion, projects a bounded forward landing point, respects its ordinary home territory and commits to a visible ground-circle warning. If the player changes direction, uses cover or leaves the marked footprint, the follow-up fails. The unit travels using the existing collision-aware movement function; blocked or interrupted movement yields no remote hit. A completed landing can strike its selected target **once**, for 0.8x ordinary melee damage and a short ordinary Slow (0.8 seconds). All existing damage, immunity and bounded party Slow rules still apply.

Provisional timing: **4.5 seconds between possible casts**, 0.65-second warning, 0.75-second travel budget, 94-unit strike footprint. The cooldown is an independent recovered enemy-special clock, not the Rogue decision timer. It is repeatable indefinitely during a valid fight. No new RNG or map-wide leash is granted.

## Criteria before increasing scope

1. **Frequency:** ordinary Goblins, Skeletons and melee guardians should cast repeatedly in a prolonged ranged chase rather than once per encounter. Measure attempted casts, valid landings and actual successful hits, not only time-to-kill.
2. **Fairness:** a retreat in a straight line must face credible pressure; a deliberate lateral dodge and real solid cover must work. No homing retarget after the warning is committed.
3. **Fidelity:** do not disrupt existing Rogue retreats, support, town safety, defensive/quest guardians, dungeon clearance, save/reload, or ordinary melee basics.
4. **Balance:** compare Mage and Ranger outcomes, solo and party; tune short reuse before adding unavoidable hard crowd control or stronger stacking Slow.
5. **Performance:** real movement, limited warnings, no per-frame path-planning explosion; verify on Canvas and PixiJS separately before publication.

## Later phases — not implemented

After this ordinary-melee experiment, consider distinct melee and ranged **Ringleader** counters, Greenwood **captains**, **Thornfang** and **Lifebinder**, each adapting Veyra's tactical doctrine through their already-authored abilities. Ranged Ringleaders should control retreat lanes rather than blindly dash into melee. The Crown marshal herself is the doctrinal source but receives **no new attacks** through this pilot. Her authored boss moves remain intact.

The goal is to make sustained kiting a real tactical contest, **not** to require a certain hero level or equipment threshold or to make every dodge impossible.
