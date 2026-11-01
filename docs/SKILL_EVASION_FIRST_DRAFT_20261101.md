# Skill evasion — first implementation draft (2026-11-01)

**Game:** So I Became the Dark Lord's Problem (SIBDLP). The GitHub repository retains the historical Azeroth Chronicles name.

**Status:** Draft code for review, not merged, released, or device-verified. Provisional probabilities are balance controls, not final tuning.

## Owner-authored rules

| Defender / incoming attack | Single-target SKILL | AoE SKILL |
| --- | ---: | ---: |
| All hostile enemies vs ordinary hero/companion skills | 20% | 30% |
| All hostile enemies vs **hero Ranger** skills | 15% | 25% |
| All hostile enemies vs **hero Rogue Bard performances** | 0% | 0% |
| Friendly Soldier, Archer/Ranger, pet or legitimately Charmed companion vs monster skills, including Rogue maneuvers | 20% | 30% |

**Night:** hostile enemies gain **five percentage points**, not a 5% multiplicative boost. Thus ordinary enemy rates become 25%/35% and Ranger-specific rates 20%/30%. Friendly companion evasion does **not** automatically rise at night. Ordinary basic auto attacks, basic physical shots and basic combo finishers remain outside this mechanic. The hero has no new defensive dodge. Fifth-class reversals are unchanged.

**Critical executions:** Interpreting the owner's latest dictated clarification as “crits are not dodged”: a true critical receipt bypasses evasion. This should be confirmed in the owner review.

**Independent targets:** An area skill performs a separate chance decision *per eligible recipient*, after the ordinary geometry/contact test. A blast with three targets may dodge zero, one, two, or all three independently. It is not one roll for the whole spell. Where a skill has an explicit action ID, repeated hits from the same action reuse a recipient's first decision.

## Implementation ownership

- `src/prototype/rules.js` holds the four configurable probabilities and the enemy-only night increment.
- `src/prototype/combat.js` owns individual defensive decisions, bounded result memoization, basic-versus-skill classification, and contact-level integration. It does not move a defender or change the existing telegraph or physical projectile collision.
- Hero, party, boss and ordinary hostile Rogue maneuvers supply attack kind, critical receipts, and where applicable action identity.
- Canvas/shared Pixi overlay receives a brief DODGE text effect from a source-owned `skillEvaded` combat event. The queue stays within the existing 40-effect budget; translation and visual-device acceptance remain to review.

## Safeguards

- An evasion decision is made only for a *legally contacting* offensive skill. A dodged hit returns false before HP loss, lifesteal, damage-based healing, critical secondary effects, associated slow/push/taunt, and on-hit effects that already honor landed-hit status.
- Existing immunity, line of sight, threat engagement, invalid charged opener, and physical projectile/ground geometry are not replaced.
- An evasion roll is never taken for an ordinary basic (including the basic's splash finisher) or for the hero themselves.
- `evasionActionId` can preserve a single recipient result across shots/ticks. Bounded transient caches are not part of campaign saves. Most independent area-target decisions use a unique recipient identity. Further persistence cases and multi-phase skills require focused verification.
- Evasion sampling uses a separate optional injection hook for deterministic tests. The default browser fallback uses an independent random source, leaving `Campaign.random` unchanged. Save/replay determinism should be reviewed before merging.
- The PR must prove English/Spanish UI behavior, deterministic contact fixtures, historical save compatibility, first-class/companion/boss coverage, and real browser animation/overlay behavior.

## Proposed acceptance checks

1. Day and night chances for ordinary enemy and hero Ranger cases; Rogue musical immunity.
2. Real single-target skill, single-target projectile, area skill and three-target Mage blast, each with critical and noncritical releases.
3. Hero and companion basic/finisher exclusions; companion attacks and charmed identity.
4. Companion survival against boss and captain circles, warning lanes, Rogue moves, projectile volleys and persistent hazards, including their slows.
5. Repeated Ranger arrows and repeating AoE pulses reuse an action-target decision where intended, but targets remain independent.
6. Correct attribution and on-hit side effects: avoided attacks cause no damage, drain, healing, slow, push or Charm, while legitimate misses still consume a skill release and its cooldown.
7. Canvas 2D / Pixi overlay, performance and bounded effect count; older save restore and no unexpected randomness regressions.

**Review boundary:** This is an implementation candidate, not evidence that every authored action has been fully classified, tested or approved. No merge or deployment without the project owner's go-ahead.
