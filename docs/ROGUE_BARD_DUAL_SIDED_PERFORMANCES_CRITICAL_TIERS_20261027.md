# Rogue Bard — dual-sided combat performances and independent critical intensity
**27 October 2026 | PR #511 design revision | documentation-only | status: owner-directed principles, numerical/effect details proposed**

## Decisions and separation of approval

**New owner directions:** Rogue is a **critical-centered class**; evaluate **+2 percentage points of personal critical chance per hero level** (instead of prior +1pp), level 1 included; every regular/charged skill should be a **reasonably sized AoE performance** doing something negative to hostiles **and something favorable to allied companions inside the same performance footprint**; distinct short buffs should be able to **overlap** under skilled timing; **all eight manual skills are combat-only**. The Rogue must have a **dedicated independent Level 1/2/3 critical-intensity category/slider**, not inherit the existing Hero intensity setting. The sixteen musical skill names are already **owner-approved**. All specific numbers, buff choices, per-skill critical levers and exact UI/save persistence mechanics below are **recommendations pending gameplay review**, not statements of owner signoff.

Never accidentally rewrite the original three hero classes, reassign the global Hero intensity, give the Rogue HP/Power/Armor/Speed passives, add buff spam actors, or treat this design document as a runtime implementation.

## Source-verified merged PR #440 contract

[PR #440](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/440), merged at `e433f7a84d47ca796e89dc299cdfa32e769b49ae`. Live `src/prototype/critical-levels.js` has three groups `hero/companion/world`, base Level **1** for Normal/Nightmare/Developer, and independently settable Level **1/2/3**. `src/prototype/critical-party-native.js` samples a committed skill **once** in **the Party RNG stream**; the receipt stores group, intensity and exactly **one** explicitly registered effect lever. `src/prototype/critical-executions.js` has independent Party/World 10% chance domains. `progression.js::criticalPartyBonus('hero')` contributes Codices; `criticalPartyChance('hero')` presents that value. Codices are +1 percentage point each, up to 5. The controls are presently **developer/native configuration methods**, not yet a persistent visible game-settings slider. `party.js` has existing `rangerRallyUntil`, `rangerRallyMovement`, `rangerRallyAttack` and health support budgets, but **not** a generic eight-song status system.

### Four intensity categories, two random domains (do NOT conflate them)

| Independent slider/group | Who it changes | Default | Crit RNG domain |
|---|---|---|---|
| Hero | Paladin, Mage, Ranger | Level 1 | Party |
| **Rogue** (NEW) | Rogue hero ONLY | **Level 1** | **Party — existing stream** |
| Companions | Soldier, Archer, charmed friendly monsters and pets | Level 1 | Party |
| World | Enemies, captains, bosses, etc. | Level 1 | World |

**Rogue slider adjustment affects the *strength of future Rogue hero criticals only***. Hero settings cannot override Rogue; Rogue setting cannot alter base Hero, companion or hostile intensities. Separate intensity **does not** imply a third RNG stream or a second critical roll. Charmed monsters get **Companion intensity** under any hero; Rogue's ally-crit-chance buff (Skill 7) can affect how frequently those allies crit, but **never** their intensity dial. On Succession, whichever current hero casts owns the corresponding slider (Rogue or Hero).

**Recommended source integration map** (after explicit code approval):
1. In `critical-levels.js`, add `rogue` to `GROUPS` and `DEFAULT_LEVELS={hero:1,rogue:1,companion:1,world:1}`; retain Normal/Nightmare/Developer override machinery and exact 1/2/3 bounds. Register `hero/rogue/auto` and each `hero/rogue/{1..8}-{tap,charged}` explicitly with **group `rogue`**, never `hero`. `getLevel('rogue')`, `setLevel('rogue',2,'normal')`, `snapshot().rogue` and `modes.nightmare.rogue` must work independently.
2. Existing native `critical-party-native.js::release` uses the **registered action's group** and resolves `domain:'party'`; retain this, including one frozen receipt sampled at legal release and no new stream. If legacy opt-in review adapter `critical-party-integration.js` is still supported, its hard-coded `key.startsWith('hero/') ? 'hero' ...` route **must** explicitly dispatch `hero/rogue/*` to `rogue`, or the module must be retired/blocked for Rogue in tests; silent fallthrough is wrong.
3. Add `+0.02 × hero.level` to **hero-source-only** critical **bonus** for current Rogue, preserving `criticalPartyChance('hero')` and the native sampler consistency. Existing base 0.10 and Codex max +0.05 remain. Other heroes and companion sources receive no Rogue-level boost. No stored incremental tick is needed; derive from current live class/level to avoid save or Succession double-add.
4. Existing tuning is session-local and **not** a user-facing persistent slider. To fulfill user's `move the slider` requirement, add a **separate Rogue 1–3 control** beside the three existing categories in the intended player/dev Critical Intensity interface, route it to the native Party session's `setCriticalLevel('rogue', level, mode)`, and specify which player/dev modes expose it. Persist/reapply a **validated, optional** Rogue preference at startup and load in existing settings/save ownership (not as another RNG state). Missing older-save key must default to Level 1; reject 0/4/nonintegers; make Normal/Nightmare/Developer overrides independent and preserve existing settings. UI must be usable with mobile controls and localized. **Do not claim a usable visible slider until one has actually been implemented and tested.**
5. Change `tests/critical-levels.test.cjs` exact registry counts and snapshots intentionally: +17 Rogue hero action keys, one new intensity group. Test two sliders moved in opposite directions, all modes, live non-Rogue class, Rogue succession and in-flight receipts; ensure World separate stream unchanged. Record migrated older snapshots and preference reload. Keep existing explicit native levers and optional critical feature gating.

### Proposed Rogue hero chance at +2 percentage points per level (not yet coded)

`pRogueHero = clamp(0.10 + 0.02 * hero.level + min(0.05, 0.01 * codicesOwned), 0, 1)`.

| L | No Codices | All five Codices |
|---:|---:|---:|
| 1 | 12% | 17% |
| 5 | 20% | 25% |
| 10 | 30% | 35% |
| 15 | **40%** | **45%** |
| 18 | **46%** | **51%** |
| 20 | 50% | 55% |

At a proposed ~46–51% late-game **hero** critical probability, endgame is a frequently critical performer, **not** an automatically Level 3 performer. The independent Rogue intensity slider still defaults to **Level 1**. If the owner later chooses a hard cap/late level ceiling, review probability explicitly rather than guessing Level 15 is max. Crit chance and intensity are not modifiers of Charm rolls.

## Dual-sided AoE policy (owner direction / proposed implementation)

- Every **manual tap and charged skill** must be a bounded performance affecting **hostile enemies negatively** and **living active allied companions favorably** if inside the **same legal world-space AoE** at release. Include owned charmed monsters and pet companions, including those inherited by a later non-Rogue hero only when a Rogue is actually performing. The Rogue herself **does not** receive these proposed companion boons by default, to preserve her glass-cannon support identity.
- **Recommended footprint:** centered on selected legal enemy/contact/placed trap point **within 260 units from the Rogue** (charged center up to 300), normal radius **120–155** world units depending on skill and charged **160–200**; follow walls/line-of-sight and existing encounter blockers. This is a **skill area**, not full-screen aura or every ally anywhere nearby. Return snapshots of legal enemies and allies at release in **deterministic ID order**; enemy caps **2–4 tap / 3–6 charged** as specified per slot, ally cap bounded by real max active party (**≤7** for Rogue at maximum Expedition). Auras are **one-shot timed effects on current occupants, not continuously ticking overlapping floor actors**. Traps are the one exception: friendly support applies at **placement** within its trap footprint, and enemy effect triggers later; no second friendly buff on trigger.
- **Combat-only:** every skill (even heal/support/trap forms) requires a real live hostile engagement and a valid reachable hostile area/cast position at release, not just standing near an inert enemy. Illegal out-of-combat casts neither apply buffs nor spend RNG/cooldown. Appropriately permit the area to buff eligible companions if enemies are immune/none are debuffable, provided the encounter and legal target are real. Never buff on an invalid charge/canceled cast, via pause/transition, or from a store/party menu.
- **One action = one native critical decision** after lawful release, shared by both teams and all affected targets. **One** chosen existing lever per tap or charged form is enhanced at Level 1/2/3. Other enemy/ally consequences happen at their ordinary designed baseline on that critical; this is consistent with merged PR #440, which explicitly avoids turning crit into free new targets/statuses/actions. Delayed traps and DoT/HoT use the cast/placement receipt; never re-roll each tick/contact.
- **Distinct buffs overlap across different song families**, e.g. basic damage + movement speed + attack speed + ward + recovery. **Same family does not add multiplicatively or create multiple timers**: strongest potency remains, expiration is max(existing expiry, new source expiry), capped at its own duration rule; re-casting doesn't accumulate healing budgets (remaining healing is replaced/merged with a fixed bound) or build infinite stacks. A **proposed maximum four distinct Rogue song boons per companion** at a time is a *reviewable safety valve*, not an owner-approved limitation; if introduced, deterministic priority/refresh behavior and clear UI are necessary. Native Ranger Rally must not double-stack its matching movement/attack-speed components: use the higher effective component. Other classes' support is not globally nerfed.
- Status timers run in real game simulation time and expire correctly through pause, zoning, downed companions and Succession. A companion that is **resting/fallen/off-zone** is not a recipient. All effects should clear/suspend on the relevant character's death; when a Rogue dies, remaining buffs should not indefinitely persist on inherited pets/charmed units.
- **No new animation cycles or per-frame AoE queries**. Use current static skill event/presentation budget, small bounded status records and existing regular updates. A display indicator for distinct buffs may share status HUD rather than new effect actors.

## The 8 approved pairs: new two-sided effect proposals

**All base amounts here are initial candidates, not verified numbers.** Charged stronger or slightly larger, but same skill identity. Friendly buffs affect **active living companions inside that exact AoE** (Soldier/Archer, charmed, pets), **not every roster member**; each has an independent short finite timer. Normal/charged versions of the same slot refresh **one boon family** rather than creating two copies.

| # | Regular performance: enemy AoE + allied boon | Charged performance: enemy AoE + allied boon | Enemy cap tap/charged |
|---|---|---|---|
| 1 | **Staccato Sting:** bounded musical hits; **Encore Edge** +5% companion **basic-attack damage** for 4.5s | **Fortissimo Crescendo:** wider hit; same Encore Edge **+7%** for 6s | 2 / 4 |
| 2 | **Dragging Waltz:** Slow; **Quickstep** +8% companion movement speed for 4.5s | **Largo in Chains:** wider Slow; Quickstep **+12%** for 6s | 3 / 4 |
| 3 | **Broken Cadence:** actual casting interruption + modest debt; **Steady Backbeat** +6% companion **ordinary basic attack speed** for 4.5s | **Fugue of Discord:** up to three real active enemy casts interrupted + brief bounded Silence; Steady Backbeat **+8%** for 6s | 2 / 3 |
| 4 | **Withering Lament:** brief DoT + partial incoming-healing reduction; **Mending Refrain** total **4% of each recipient's max HP** spread over 4s | **Requiem of Rot:** slightly wider DoT/anti-heal; Mending Refrain total **6% max HP** over 5s | 3 / 4 |
| 5 | **Snaring Tango:** place an enemy-only Slow trap; **Sheltering Step** reduces legal incoming companion damage by 6% for 4.5s to allies in footprint **at placement** | **Thornstep Tarantella:** bounded damage+Slow trap; Sheltering Step **9%** for 6s | 3 / 4 when trap activates |
| 6 | **Stolen Tempo:** adds debt to **already nonready** enemy skill timers only; **Borrowed Tempo** makes valid companion *special cooldowns* recover **12% faster** for 4.5s | **Rondo of Lost Time:** modest debt to up to four; Borrowed Tempo **18%** faster for 6s | 2 / 4 |
| 7 | **Reeling Rondo:** collision-legal pushback + brief Weaken; **Fortune's Step** +**2 percentage points** to recipients' **companion-only** personal critical-chance rolls for 4.5s | **Panic Polka:** wider bounded push + Weaken; Fortune's Step +**3pp** for 6s | 2 / 4 |
| 8 | **Rhapsody of Ruin:** controlled AoE hit/short disruption; **Encore Strike** +8% recipient **special-skill damage** for 5s (not basics or heals) | **The Silencing Coda:** at most six enemy contacts, larger damage and short boss-protected Silence; Encore Strike **+12%** for 7s | 4 / 6 |

**No buff stacking loophole:** Boon 1 enhances only basic damage, 8 enhances only special damage; 3 helps *basic cadence*; 6 helps *special recharge*, not basic cadence; 7 improves **companion critical chance** without touching Rogue personal chance or companion intensity. Ranger Rally movement/attack cadence obey strongest-of-same-stat rule. Companion Power and future innate hero passives are unaffected. This is **not** a proposal to lower basic cooldowns permanently or to multiply all DPS by 8 simultaneous bonuses.

## Explicit per-action critical level catalogue — all 16 approved names

**Each row's Level 1/2/3 is the *bonus to exactly one existing consequence on a successful critical*, not a new secondary attack.** Native values from merged `critical-levels.js`: `damage` ×1.08/1.20/1.40; `healAmount` ×1.10/1.25/1.45; `slowDuration` +0.20/0.50/1.00s; `cooldownDebt` +0.20/0.50/0.90s; `silenceDuration` +0.15/0.35/0.65s; `hasteDuration` or `wardDuration` +0.30/0.75/1.40s; `pushDistance` ×1.08/1.18/1.30; `weakenDuration` +0.20/0.50/1.00s. The lever is keyed by cast action, not rolled per target. Group for **all these entries is `rogue`**, not `hero`.

| Slot/form — approved name | Enhances which existing consequence? (native lever) | L1 | L2 | L3 |
|---|---|---|---|---|
| 1 tap — **Staccato Sting** | Enemy direct-hit damage (`damage`), one primary receipt across valid area | ×1.08 | ×1.20 | ×1.40 |
| 1 charged — **Fortissimo Crescendo** | Enemy direct-hit damage (`damage`) | ×1.08 | ×1.20 | ×1.40 |
| 2 tap — **Dragging Waltz** | Enemy Slow duration (`slowDuration`) | +0.20s | +0.50s | +1.00s |
| 2 charged — **Largo in Chains** | **Ally Quickstep duration** (`hasteDuration`); enemy Slow stays baseline | +0.30s | +0.75s | +1.40s |
| 3 tap — **Broken Cadence** | Hostile existing skill cooldown debt (`cooldownDebt`) | +0.20s | +0.50s | +0.90s |
| 3 charged — **Fugue of Discord** | Hostile Silence duration (`silenceDuration`), respecting boss/control caps | +0.15s | +0.35s | +0.65s |
| 4 tap — **Withering Lament** | Ally initial **Mending Refrain total healing budget** (`healAmount`), no per-tick crit | ×1.10 | ×1.25 | ×1.45 |
| 4 charged — **Requiem of Rot** | Ally Mending Refrain total healing budget (`healAmount`) | ×1.10 | ×1.25 | ×1.45 |
| 5 tap — **Snaring Tango** | Original triggered Slow trap duration (`slowDuration`), snapshotted at lawful placement | +0.20s | +0.50s | +1.00s |
| 5 charged — **Thornstep Tarantella** | **Ally Sheltering Step duration** (`wardDuration`); trap damage remains baseline | +0.30s | +0.75s | +1.40s |
| 6 tap — **Stolen Tempo** | Hostile already nonready skill cooldown debt (`cooldownDebt`) | +0.20s | +0.50s | +0.90s |
| 6 charged — **Rondo of Lost Time** | **Ally Borrowed Tempo duration** (`hasteDuration`); hostile debt baseline | +0.30s | +0.75s | +1.40s |
| 7 tap — **Reeling Rondo** | Original legal hostile push distance (`pushDistance`), never pushes through walls | ×1.08 | ×1.18 | ×1.30 |
| 7 charged — **Panic Polka** | Hostile original Weaken duration (`weakenDuration`); allied critical-chance increase remains +3pp | +0.20s | +0.50s | +1.00s |
| 8 tap — **Rhapsody of Ruin** | Original actual direct area damage (`damage`) | ×1.08 | ×1.20 | ×1.40 |
| 8 charged — **The Silencing Coda** | Original hostile short Silence duration (`silenceDuration`), capped against protected targets | +0.15s | +0.35s | +0.65s |

**Illustrative noticeable endgame:** Rogue at hero L18 with five Codices crits on ~51% of her *legal committed actions*, independent of slider. With Rogue dial Level 3, a **critical Requiem of Rot** improves the original **6% max-HP ally heal budget to 8.7% over five seconds**, not to a new burst, and enemies still receive normal DoT/anti-heal. At slider Level 1 that same critical boosts healing to **6.6%** (6%×1.10). A **critical Largo in Chains** at Level 3 extends its **6-second Quickstep to 7.4s**, while its enemy Slow keeps normal duration; at Level 1 Quickstep runs **6.3s**. A Level 3 critical **Fugue of Discord** adds **0.65s** to its already legitimate Silence only on legal recipients; it neither silences an immune boss nor interrupts spells after release. These are meaningful but bounded versions, not a second set of actions or different cooldowns.

**Auto is the seventeenth explicit Rogue critical action**: `hero/rogue/auto` (`damage` ×1.08/1.20/1.40), only one critical receipt per short AoE auto, **one** primary-target Charm attempt on legal living contact and **no critical boost to Charm chance**. Candidate automatic basic name *Barbed Riff* and 3rd-hit finisher *Rattling Crescendo* still need naming confirmation; unlike the sixteen manual-skill names, they were not separately approved. **Auto is not a manual combat-only skill**; leave its existing combat targeting semantics unchanged.

## Performance and acceptance gates

1. **Baseline fairness and first capture:** 90 HP/18 Power/3 Armor/300 Speed at L1; zero starting companions. Compare actual early enemy HP/hits and first Charm access (12% original rate still tentative) against the three existing classes that start with two allies. A dense buff kit must not hide a disastrous solo opening.
2. **Chance, odds and isolates:** at L1/15/18 prove 12%/40%/46% Rogue without Codices and 17%/45%/51% with all five; Paladin/Mage/Ranger keep their own odds and Hero intensity; companions get only limited timed Fortune's Step when actually within footprint. Party/World RNG streams remain exactly two.
3. **Four-slider independence:** for each of Normal/Nightmare/Developer, exercise `hero=3,rogue=1,companion=2,world=3` and inverse combinations; verify only correct performers change. Rogue slider change after a released projectile/trap cannot affect its frozen receipt. Ensure slider is genuinely accessible and preference survives reopen/load if promised; old saves still Level1.
4. **Sixteen-skill matrix:** 16 forms × 3 intensities, one critical receipt per legal cast, direct hit/AoE/HoT/DoT/trap timing, LOS, recipients, expire/refresh, skill rank, charge canceled, combat-only locked, enemy immunity, action miss and no extra Charm rolls.
5. **Stacking and efficiency:** 1–7 active teammates, all enemy caps, mixture of 3–4 different song boons, burst damage/attack speed/crit-chance interlock with native Ranger Rally and Codices; buffs don't silently affect Rogue itself, fallen/reserve, or arbitrary friendly NPCs. Cap worst-case statuses at ≤7×8 families, **no persistent sound-ring actor per boon** and no per-frame broad target scans.
6. **Boss balance:** late Rogue L15/L18 and Rogue dial L1/L3 versus normal and TRUE leaders; avoid prolonged silence lock or excessive multi-ally healing. Compare survival, effective team DPS and duration, not only individual tooltips.
7. **Save/transition:** older v4 snapshots, Succession into/out of Rogue, party membership and active cap overflow, zone/pause/restart, no stale buffs, no modified world RNG, offline/PWA and both renderers. Do not change common critical level sliders without matching regression.
