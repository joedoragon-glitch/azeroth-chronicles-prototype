# Paladin normal / charged skill identity audit — 3 November 2026

> **Status:** Design-only, source-verified audit and exploratory replacement directions. **No gameplay, balancing, player text, asset, test, save, release or deployment change.** Working proposals below are not approved Paladin mechanics. The owner requested a neutral check after the same design concern was raised for the Strategist: **charged is not required to be a superior level of tap**. That criterion must not be weaponized to redesign already differentiated skills.

## Sources / authority

- Current `main` read of [`src/prototype/hero-combat.js`](../src/prototype/hero-combat.js): cast routing, effects, positional prerequisites, real targeting.
- Current `main` read of [`src/prototype/rules.js`](../src/prototype/rules.js): `chargedSkills`, `heroTactics`, `advancedCharges`, `classUltimates`, target caps.
- Current `main` read of [`src/prototype/skill-reference.js`](../src/prototype/skill-reference.js): player-facing form descriptions and numerical preview.
- [Historical hero skill design/owner decisions](HERO_CLASS_SKILLS_2_8_CONSOLIDATED_REVIEW_20261015.md), not evidence that every individual effect remains a permanent requirement. Existing playable designs were deliberately chosen and must be preserved until a new design is actually selected.
- [Strategist Stage 2 working design PR #697](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/697): later class explores greater tap/charged functional asymmetry; it is **not** proof of a mandatory universal pattern.

## The actual finding

The strong version of the allegation ("Paladin Skills 4–8 are the same move, just stronger") is **overstated**. They are not byte-for-byte or mechanically identical: there are new target shapes, weaker or stronger crowd control, positioning, and new secondary effects. However, several charged skills are still **predominantly enhancements of the same tactical job**; the Paladin's two area-attack slots also significantly overlap with each other. This is a legitimate design concern, **not an established gameplay bug**, and is not a mandate to discard a useful working skill.

| Slot | Tap in current game | Charged in current game | Source-level assessment |
| --- | --- | --- | --- |
| **1 — Radiant Strike** | One aimed, traveling holy projectile; automatic sword combo runs separately | **Radiant Cross**: two location-anchored pulses across four arms | **Keep.** Different geometry, timing, and positional use. |
| **2 — Sundering Strike** | Melee damage + Weaken on one foe | **Holy Cleave**: frontal cone damage + Weaken on several foes | **Review.** Broadly the same strike/debuff job expanded from single to group. It has positional differences, but remains upgrade-shaped. |
| **3 — Shield Stance** | Long self-protection stance; lowers on second tap; outgoing tradeoff; Skill 1 restricted | **Shield Bash**: immediate short frontal damage and collision-safe knockback | **Keep.** Defensive commitment versus offensive displacement. |
| **4 — Judgment** | Targeted holy projectile + single-enemy Taunt | **Grand Judgment**: target-centered burst + group Taunt | **Review, moderate.** Group control matters, but remains amplified Taunt with added splash. Not intrinsically defective. |
| **5 — Holy Area** | Instant self-centered area damage; six-target cap | **Consecrated Wave**: slightly wider area hit, higher damage, eight-target cap + Weaken | **Strong overlap.** Predominantly larger burst with extra debuff. |
| **6 — Vanguard Rush** | Close the gap to one enemy, then strike | **Vanguard Impact**: same approach with an area push wave at landing | **Borderline / preserve provisionally.** The push can be a genuine *peel* (creating space) rather than merely more damage. Test whether players use it differently before replacing. |
| **7 — Holy Assault** | Self-centered area damage, larger/heavier than Skill 5 normal; six-target cap | **Oath Strike**: self-centered area damage + Weaken, eight-target cap | **Strong overlap.** Repeats charged Skill 5's area damage + Weaken identity at greater reach/damage. |
| **8 — Sanctuary Oath** | Party ward + Paladin self-heal + self-centered holy blast | **Last Bastion**: larger blast, stronger self-heal/ward, more targets + Weaken | **Strong overlap.** Broadly the same mixed damage/heal/mitigation package upgraded. |

**Cross-slot concern:** Skills 5 and 7 use the same kind of nearby area-attack operation, and charged 5 and 7 both apply the Paladin's existing Weaken. Their radius/damage/caps differ, but this is not an especially distinctive choice even *between separate skill slots*. The added Weaken on charged Skill 8 compounds the recurrence.

**Peer-class counterexamples to a universal upgrade rule:** Paladin Skill 3 is guard versus bash; Ranger Skill 4 is *personal movement* versus *companion movement/attack rally*; Mage Skill 3 is *single warned attack interrupt* versus *bilateral silence field*. Other class slots also have bigger charged analogues, so **there is neither a mandatory upgrade rule nor a mandatory requirement for all charged pairs to be different genres**.

## Recommended disposition

- **Preserve Skills 1 and 3.** Do not introduce gratuitous redesigns.
- **Prioritize original alternatives for 5, 7, and 8**, including resolving the normal 5/7 cross-slot overlap.
- **Consider redesigning Skill 2** because its Weaken cone is the same effect spread across enemies, but retain its frontal-cleave positional identity if it proves tactically interesting.
- **Review Skill 4 rather than assume it's wrong.** Single-threat control versus group-threat control may already be meaningful against different encounters.
- **Protect Skill 6 unless practical evidence says its displacement is merely a statistically superior Rush.** A rush to engage one enemy and a rush to scatter several can be two real decisions.

## Working redesign directions — **NOT chosen or authorized implementations**

These are *contrast tests* to reveal possible distinct player decisions, not replacements to silently install. Numerical values, names, unlocks, critical behavior and artwork are undecided.

| Slot | Retain / candidate tap purpose | Candidate charged purpose | Why a player would choose one over the other |
| --- | --- | --- | --- |
| **2** | Retain focused **Weaken** against the most dangerous enemy | **Timed holy counter**: brief post-release parry window, mitigating one incoming direct strike and retaliating once on valid contact; not a longer Shield Stance | Proactive enemy damage suppression versus anticipating one incoming attack. Must not trivialize bosses or duplicate Shield Bash. |
| **4** | Retain targeted projectile **Taunt** to deliberately pull one enemy onto Paladin | **Judgment of Accountability**: place a brief mark on one foe that punishes an actual attack against an ally, without mass-Taunting every nearby foe | Immediate threat redirection versus punishing a foe for ignoring the defender. Requires controlled trigger and no infinite retaliation. |
| **5** | Retain instant, finite nearby **holy burst** | **Consecrated Vigil**: establish a short-lived fixed-location sanctuary for gradual allied recovery or protection, **without upfront blast** | Clear the immediate space versus choose a place worth holding. Must not reproduce Slot 8's instant party ward. |
| **6** | Retain enemy-directed **Vanguard Rush** | **First preference: keep existing landing push** if tests show genuine crowd-peel use. Optional *Guardian Intercept*: dash to endangered ally to guard an incoming hit rather than dash toward the enemy | Offensive engagement versus protection of position or an ally. Ally targeting, solo play, collision and movement would need a separate design. |
| **7** | Retain **Holy Assault** as high-impact crowd clear, but adjust overlap with 5 if necessary | **Oath Strike** as a *focused* single-target commitment/finisher, trading area coverage for bounded pressure on a priority foe | Fighting a pack versus committing to a dangerous elite. Must not create boss-execution shortcuts. |
| **8** | Retain **Sanctuary Oath** as offensive recovery plus short party ward | **Last Bastion** as a finite *defensive emergency stand*: limited party damage-sharing/absorption budget that taxes Paladin's position/survivability, **without bigger blast or guaranteed immunity** | Stabilize while still attacking versus sacrifice offense to keep a threatened party alive. Respect Shield Stance mitigation nonstacking and no revival or invulnerability. |

Alternatives are intentionally theme-consistent but not automatically endorsed. Do **not** import the Strategist's environmental intercept, Reversal or other signature abilities. Do **not** assume every proposed mechanic is feasible or balanced.

## Engineering and acceptance boundaries before any gameplay revision

1. **Define one-sentence tactical contrast** for every chosen normal/charged pair; preserve the class as a tank/protector/front-line fighter, not an arbitrary spell catalog. Check distinctiveness **across slots**, especially 2/4/5/7/8.
2. **Seek owner creative selection before implementation.** Explicitly document what existing authored behavior is superseded, including historical decisions, rather than quietly rewriting approved skills.
3. Keep eight slots, shared trained rank 1–8, separate tap/charge cooldowns, 0.65-second hold, current input/queue protections and normal automatic Skill 1 cadence unless separately changed with evidence.
4. Audit targeting/LOS, melee/dash clearance, boss telegraphs and scripting, critical execution receipts, Skill Block, damage/taunt/ward mitigation, rank scaling, target caps, no revivals/immunity, and arena Normal/TRUE encounters.
5. Update `rules.js` and `hero-combat.js` **together** with truthful skill journal/instructor previews, bilingual strings, combat VFX/audio, Keeper Archive, and guidance. Preserve historical saves and avoid unbounded per-frame or per-enemy work.
6. Add focused tests proving that *each form performs its distinct authored job*, that both remain useful rather than one dominating, and that original Paladin/Ranger/Mage/Rogue/Strategist boundaries are respected. Test input and game performance as appropriate; actual-device acceptance is separate.
7. Review, merge and publish only after explicit later approval. **No existing game code is changed by this audit.**

## Status

**Audited:** Paladin 1–8, both forms and core live combat routes on current `main`.  
**Evidence:** Source descriptions, rules and branches inspected; no new executable tests or player playthrough performed.  
**Planned:** Owner-led creative decision for problematic or borderline pairs.  
**Implemented / tested / merged / deployed / device-verified:** **None for this proposed redesign.**
