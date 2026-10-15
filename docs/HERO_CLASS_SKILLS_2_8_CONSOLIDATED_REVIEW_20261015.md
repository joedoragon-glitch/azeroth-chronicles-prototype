# Hero class skills: implementation checkpoint and later review
15 October 2026 · Isolated branch based on PR #300 `implementation/director-snapshot-20261013`

**IMPORTANT:** Development changes only; user requested no new tests until multiple updates are consolidated. The exact branch is **not tested, certified, approved to merge, or deployed**. Do not import the older PR #305 source branch wholesale over PR #300: this implementation starts with PR #300's hero repair, worldbuilding, save and control changes.

## Implemented for planned combined QA: Skills 2–4

Existing Skills 1–2 retain **+15% of rank-1 damage per trained skill rank** for normal and charged actions. In addition, each even rank (2/4/6/8) advances the relevant status, reach or coverage without a second exponential damage multiplier. Skills remain capped at 8 under existing rescued teachers and costs; normal/charged use **one saved rank**.

| Skill | Paladin | Mage | Ranger |
|---|---|---|---|
| 2 normal | **Sundering Strike:** melee damage, weakens the damage the enemy deals for a short period | **Frost Bolt:** projectile damage plus Slow | **Pinning Shot:** existing two quick arrows with a short Slow |
| 2 charged | **Holy Cleave:** frontal cone with damage and weakening for all struck enemies | **Frost Burst:** circular AoE damage/Slow; radius and Slow increase at even ranks | **Pinning Volley:** line-shaped AoE damage plus short Slow; reach/width improve at even ranks |
| 3 normal | **Shield Stance:** 8s maximum, **65–73% incoming damage reduction** by rank; disables Skill 1, makes other Paladin skill damage **60%**, second tap immediately ends stance and starts its cooldown | **Spell Interrupt:** ends one current enemy warned/aimed attack; 8s normal cooldown, range improves at even ranks | Unchanged self-heal |
| 3 charged | **Shield Bash:** very short forward cone, damages and collision-safe pushes enemies; bosses and captains take half the bash's ordinary damage, never a fraction of max HP | **Silence Field:** short-lived radius suppresses new skill/special casts for enemies, companions and the Mage alike, not movement/basic attacks | Unchanged hero + living active party healing |
| 4 normal | **Judgment:** holy strike plus provocation (3–4s according to rank) | **Arcane Fracture:** strike plus party-wide incoming-damage vulnerability on the enemy (15–19%) | Unchanged movement haste, no enemy target required |
| 4 charged | **Grand Judgment:** primary hit plus AoE splash and group-wide provocation (5–6s) | **Arcane Rupture:** primary hit plus splash and nonstacking stronger party-wide vulnerability (20–24%) | None; no charged form approved |

Secondary effect steps are at ranks **2, 4, 6, 8**. The stronger effects are bounded: Shield Stance always lasts at most 8s; Spell Interrupt always stops one current enemy action; mage silence lasts 2–3s and radius 165–205; paladin shield bash reach 115–131 and push 55–75 world units; Grand Judgment area radius 160–180; Arcane Rupture radius 160–180. Normal skills use the existing base slot cooldowns (Skill 3: 8s, Skill 4: 14s); charged Skills 3–4 use 20s base cooldowns, all subject to existing Cooldown Training. Paladin normal Skill 3 instead starts cooldown upon stance end/cancel.

Existing effects untouched where not expressly approved: Ranger healing and haste, Skill 1 normal combo and charged projectiles, Mage Skill 2 frost identity, Paladin Skill 2 cone identity, Ranger Skill 2 line identity, class-specific Skill 5–8 abilities, Skill 8's currently shared healing/immunity (pending review), and all companion progression.

### Implementation internals awaiting combined QA

- `hero-combat.js`: rank-milestone parameters, stance state, push, interrupt, silence, taunt, fracture, normal/charged dispatch.
- `rules.js`: centralized tuning, including charged Skill 4 cooldown.
- `combat.js`: reduction when shield raised, reduction to enemy output while weakened, vulnerability from hero/companion damage.
- `engine.js`, `boss-combat.js`: enemy damage hooks, suppression of new enemy specials, taunt priority, stance expiration.
- `party.js`: silence prevents allied special casts and Ranger support inside field; basic attacks proceed.
- `app.js`: charged Skill 4 input only Paladin/Mage; Skill 4 Ranger remains instant and target-free. Tap/hold Skill 3 honors class differences.
- `renderer.js`: procedural shield overlay and persistent silence radius, preserving existing sprite/procedural fallback.
- `archive.js`, `data.js`: update class-specific skill descriptions and generic shared training labels.

**Deferred combined validation:** Skill 1 combos and charged targeting, three classes × 8 ranks × normal/charged Skills 2–4, battle against regular/captain/boss/TRUE foes, PvE leashes and walls, silence and taunt interplay, pause, reload/import of v4 saves, historical/succession campaigns, cross-device hold/release, audio/VFX, performance guards and current PR #300 integrated release tests. **No validation executed in this work item** as requested.

## Proposal for later owner review ONLY: Skills 5–8

**Do not implement these ideas without a separate owner decision.** The current code shows substantial thematic overlap, particularly Skill 8. The following direction is a balance and role proposal rather than an approval.

| Slot | Paladin: protect / hold ground | Mage: exploit / zone control | Ranger: precision / mobility |
|---|---|---|---|
| **5** | **Consecrated Ground**: moderate local holy area that helps protect companions, rather than another plain AoE strike | **Frost Ring**: close AoE attack with slow + a brief, readable cold zone (not a hard root) | **Arrow Rain**: genuine ranged projectiles into a selected area, with a small controlled hit cap |
| **6** | **Vanguard Rush**: preserve the existing obstacle-checked rush, add a tactical arrival benefit such as enemy disruption rather than brute damage alone | **Arcane Step**: limited collision-safe repositioning linked to a magic projectile or small afterimage; avoid instantaneous terrain bypass | **Evasive Shot**: projectile while repositioning/maintaining speed; not duplicate slot 4 Haste |
| **7** | **Oathbreaker / Consecrated Strike**: deliberate anti-elite holy attack with a distinct guard-breaking mechanic (not extra universal damage) | **Storm of Sigils**: placed magic attack with delayed multi-hit pulses; strong reward for correct positioning, different from Skill 2 frost | **Piercing Shot**: preserve existing defense-piercing specialist shot from PR #302, improve precision/target priorities and telegraph |
| **8** | **Last Bastion**: powerful defensive ultimate, protects allies for a defined interval and counters, **not guaranteed full immunity** | **Arcane Cataclysm**: risky high-damage area technique with clear telegraph/commitment; no free invulnerability | **Perfect Hunt**: high single-target/line precision burst with retreat or marked prey bonuses; no universal immunity |

Each future proposed skill should be distinctive compared with Skills 1–4, should scale across ranks under the existing teacher system, and should not reintroduce universally shared invulnerability. Avoid unavoidable crowd control against bosses, infinite taunt chains, exploitably long silences or unbounded 8-rank geometry growth. Evaluate sustained DPS, solo survivability, companion survivability, ordinary-versus-TRUE bosses, and Normal/Nightmare in the **single coordinated final test pass**, not piecemeal tests now.

## Integration rule

Do not merge this work before reconciliation with the latest PR #300 head, any additional owner-approved updates, and combined regression review. Keep the source tree **multi-file** for the GitHub Pages PWA. No single-file portable build restriction.
