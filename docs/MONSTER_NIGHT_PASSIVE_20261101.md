# Owned monsters inherit the world’s nighttime power

**Game:** *So I Became the Dark Lord's Problem*  
**Status:** Implemented on an unmerged development branch; testing and merge are separate gates.  
**Scope:** Existing monster-night mechanics, boss pets and legally captured Rogue Bard monsters. No new abilities, artwork, save-version change or UI toggle.

## Owner decision

A creature remains a monster regardless of allegiance. At night, wild monsters, legitimately owned Charmed monsters and unlocked boss pets use **one authoritative monster-night profile**. It expires automatically at sunrise. An owned Wraith or Stalker remains a companion after dawn; its distinct Soul Drain or Shadow Pounce skill remains independently governed by the existing heritage system. Normal Soldier/Archer companions and the hero do not acquire monster ancestry.

## Current shared mechanics

The campaign’s `monsterNightBonuses(actor)` derives its nighttime profile from the existing `night()`, `nightPoints()` and `rules.balance.nightTempo`. It returns `{ hp, damage, tempo, skillBlock }`:

- Max HP: `1.10 + 0.03 × qualifying night points` at night, otherwise 1.
- Attack damage: `1.15 + 0.02 × qualifying night points` at night, otherwise 1.
- Combat movement and ordinary/basic attack rate: existing `rules.balance.nightTempo` curve, 1.10× up to 1.25× at night, otherwise 1.
- **Merged Skill Block:** the existing `rules.skillBlock.nightEnemyBonus` value (+5 percentage points) is the **single** night Block setting for wild monsters and legitimately owned Charmed monsters/boss pets. Its older name is retained to avoid rewriting current skill balance/tests. The merged `Combat.skillBlocks` resolver applies the bonus only to eligible **skills**, per recipient. Ordinary automatic/basic attacks and combo finishers do not invoke Skill Block. Critical skills continue to bypass it. Normal Soldiers/Archers retain their standard daytime Block rates.

Existing hostile `multipliers()` (HP/damage) and `nightTempo()` now delegate to that one profile. Friendly action paths read those same values rather than independent copies. Pet and Charmed base stats, individual mastery, Orin promotions, attack identity and normal partner Rally/Quickstep composition remain intact.

## Automatic lifecycle and identity

- Normal play: night begins at the actual game clock's cutoff; when it ends, inherited bonuses disappear on the next live simulation tick.
- Nightmare: its established introductory twilight grace remains effective. Peace and arena suppress the passive.
- Newly recruited pets and newly Charmed monsters immediately acquire the current bonus. Existing reserves also gain/lose it at day/night transitions. Newly earned nighttime victory points rescale max HP even before the next dawn.
- HP maximum is *recomputed from the normal progression baseline*, not multiplied repeatedly. On a stat transition, current HP changes by the difference in maximum, respecting existing wounds and preserving dead companions. At sunrise severely injured survivors remain at a minimum of 1 HP, matching normal companion progression’s existing preservation rule.
- Legitimate ownership is checked against saved individual Charmed capture provenance or the unlocked pet family/roster entry. Normal troops, the hero, fake Charm tags and actor clones with the wrong pet family cannot claim the passive.
- The passive has no separate player setting, persisted status effect, ticking duration, owner-specific night rule, new random stream or version-4 save field. Visual day/night transitions remain unchanged.

## Verification and integration notes

Automated regression `tests/monster-night-passive.test.cjs` covers genuine and reserve pets/Charmed allies, troop exclusion, sunset/sunrise, non-stacking, night-progress changes, damage/basic tempo, wounds, bogus identities, version-4 save restore, Normal/Nightmare/peace/arena rules. Existing native night-tempo and Charm/pet combat tests remain required before merging.

**Integration with merged PR #760:** Skill Block is implemented on `main`, with existing per-target rolls, critical priority, collision checks, Blocked! feedback and a separate saved v4 RNG stream. This draft PR changes **only** the night bonus eligibility for legally owned monsters by reusing `monsterNightBonuses(defender).skillBlock` in that existing resolver. It does not extend Skill Block to autoattacks, create any new Block roll/ability, or change normal companion/block balance. The separate player-learning UI design in draft PR #772 is outside this implementation.

**Publication boundary:** Branch implementation and CI results do not constitute physical iPhone/Chromebook acceptance or a deployed game. Merge and deployment require the owner's later review.
