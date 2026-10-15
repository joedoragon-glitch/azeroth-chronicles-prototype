# Hero class skills: implementation checkpoint and later review
15 October 2026 · Isolated branch based on PR #300 `implementation/director-snapshot-20261013`

**Additional balance review:** See [`HERO_SKILLS_STATIC_BALANCE_AUDIT_20261015.md`](./HERO_SKILLS_STATIC_BALANCE_AUDIT_20261015.md) for prioritized source-only findings on the Mage Skill 8 Fracture mismatch, Ranger solo-boss ultimate value, Paladin mitigation overlap, Ranger charged payoff, Mage survivability, and final combined QA decisions. No gameplay changes resulted from that audit.

**IMPORTANT:** Development changes only; user requested no new tests until multiple updates are consolidated. The exact branch is **not tested, certified, approved to merge, or deployed**. Do not import the older PR #305 source branch wholesale over PR #300: this implementation starts with PR #300's hero repair, worldbuilding, save and control changes.

## Source-review handoff: current approved redesign

**Implementation branch:** `feature/hero-skills-2-4-on-snapshot-20261015` (PR #300-based). The source changes through checkpoint `0a34bc91807ad48b484a7e2c9210a40b20825ca1` include all approved redesigns below. These commits are **development only**; the user's instruction remains to run **no tests** until the entire update set is combined. No merge, deployment, developer PR readiness toggle, or certification has been performed.

**Last source-review fixes:** Paladin Skill 8 is target-free on both tap and charged input (including keyboard/touch hold and no enemy reticle); Ranger Skill 4 is target-free for both tap and charged companion rally; charged Ranger Skill 4 cannot retain stale previous-buff strength after its duration expires; Mage 7 chained damage, Mage 5 knockback and Ranger 6 impact knockback all use existing combat resolvers. Standard status cleanup for Ranger rally and Paladin ward was kept on death and save restoration.

**Do not infer runtime success from source commits.** Combined QA must confirm all 24 class/skill combinations, their charged equivalents, arena mechanics (Normal/TRUE), rank steps 1–8, companion formations and target selection, damage against bosses and captains, UI/gesture accessibility, audio/VFX contracts and historical saves. Any inconsistency found there belongs in the consolidated PR before release.

## Latest approved implementation — supersedes intermediate notes below

**15 October 2026 — director-authorized class balance revision.** The new owner decisions supersede any earlier statements below that Ranger Skill 4 is tap-only, that normal Skill 8 retains immunity, that Mage Skills 5 and 7 slow enemies, or that Ranger Skill 6 grants haste. Those descriptions are now historical; this section records the **current source design**. It remains UNTESTED and unmerged pending consolidated QA.

### Ranger Skill 4 / 6 distinction

- **Ranger Skill 4 tap (14s):** hero-only +25% movement haste for 4–5.75s (existing). **Charged (20s): Companion Rally**, no dash or target needed. Living active companions within 350–390 world units and line-of-sight at cast time gain **+15–19% movement speed** and **+8–12% ordinary attack speed** for **4–5s**, calculated from the shared Skill 4 rank (secondary increments at ranks 2/4/6/8). They receive no increased hero damage, immunity, special-skill casting speed or special cooldown reduction. If no living active companion is within the cast radius and line of sight, charged Ranger Skill 4 is unavailable, displays NO ALLIES, and consumes no cooldown. Buff does not stack; its duration may refresh. Affected companions are marked with a subtle temporary ring. Combat/campaign save and defeat strip temporary rally fields; no version-4 save shape changes.
- **Ranger Skill 6 tap (4s): Repelling Shot**, still deals `(1.8×Power+20)×skillRankMultiplier` and now pushes a surviving target **45–65 world units** at arrow impact. **Charged (12s): Repelling Volley**, 3 rapid arrows totaling `4.2×Power×skillRankMultiplier`, the last applying a 65–85-unit collision-safe push. No haste on either version; this differentiates it from Ranger Skill 4 and Skill 2 slowing.

### Mage anti-overlap revisions

- **Skill 2 (3s / charged 6s): Frost Bolt / Frost Burst** exclusively owns the classic slow/frost identity. Normal projectile slows one enemy for 4–5s; charged 160–180 radius frost burst slows multiple enemies for 4–5s. Damage stays `2.2×Power×skillRankMultiplier`.
- **Skill 5 (9s / charged 18s): Force Pulse / Force Wave** uses the existing collision-safe **knockback**, not Slow. Normal `2.3×Power` area damage (350 radius), push 30–42; charged `3×Power` area damage, radius 370–410, push 45–57. Ordinary and charged damage scale normally; no invented status.
- **Skill 7 (15s / charged 25s): Arcane Chain / Arcane Chainstorm** deals **bounded chained direct damage** instead of Slow. Normal prioritizes the selected target and up to two more nearby visible foes (radius 300), at `6.5× / 4.5× / 3× Power`. Charged hits up to five visible foes (radius 380–420), at `9× / 6× / 4× Power` (third through fifth use 4×). Same rank multiplier. It does not interrupt, silence, or fracture targets.

### Complete Skill 8 replacement — all classes

**NO version of Skill 8 grants damage immunity.** The previous universal `(4×Power+60)` radius-500, self-heal-35%, invulnerability special is retired from both normal and charged skill paths. Each class has one coherent normal/charged ultimate with class-specific strengths:

| Class | Normal tap, 24s cooldown | Charged, 40s cooldown |
|---|---|---|
| **Paladin** | **Sanctuary Oath:** `3×Power` holy damage within **320** radius of hero; **15% max-HP hero self-heal**; hero and living active companions inside the radius/line of sight receive a **20% incoming-damage ward for 3.5–4.5s** | **Last Bastion:** `5.5×Power` damage in **420–460** radius; hero self-heals **20% max HP**, enemies struck are **weakened** using the existing Paladin debuff, and nearby party receives **30% incoming-damage reduction for 5–6s** |
| **Mage** | **Astral Detonation:** selected-target-centered explosion radius **210**; primary target receives `6×Power`; surrounding enemies receive `3.5×Power`; no healing or immunity | **Arcane Cataclysm:** selected-target-centered radius **260–300**, primary target `9×Power`, others `5×Power`; surviving struck enemies take **12–16% increased incoming hero/party damage** for **4.5s** (existing Fracture status, strongest nonstacking) |
| **Ranger** | **Hunter's Salvo:** arrow projectiles hit up to **three distinct enemies** around the selected target (radius 260), **one `5×Power` arrow each** | **Grand Hunt:** real arrow projectiles to up to **five distinct visible enemies** within **320–360** around selected foe, **two `4×Power` arrows per enemy** (never more than two per target) |

All listed damage uses the existing `1 + 0.15 × (rank - 1)` scalar for rank 1–8. No ult attack-speed or dash buff, no universal immunity, no invented damage-over-time status, no extra skill-tree investment. The Ranger favors many enemies; his elite single-target specialty remains Skill 7's defense-piercing arrow. Paladin protection is not permanent and cannot replace Shield Stance's eight-second cost or cooldown.

### Paladin tank interaction bounds

**Shield Stance:** 8s, 65–73% damage reduction, disables Skill 1, makes remaining offensive damage 60%, and puts Skill 3 on its normal 8s base cooldown **when the stance expires or is canceled**. **Judgment:** regular enemy taunt 3–4s tap / 5–6s charged; **boss taunt is capped at 2.5s** and affects ordinary enemy-target choice, not the boss's independently selected scripted special target or attack sequence. Neither ability changes boss leashes, phases, terrain collision or enemy ability timers. Last Bastion adds bounded party mitigation, not immunity. All duration modifiers run through the existing eight-rank training model.

### Additional no-test source integration

- Shared `hitParty` applies timed Paladin wards **after armor** and recognizes no full immunity from either reworked ultimate.
- Ranger Skill 6 `push` is applied when the hero's projectile **actually lands**, rather than at launch; existing `shieldPush` handles collision and boss motion/leash safeguards.
- Existing `engine.js` still schedules independent boss specials, but now uses the **pre-taunt target** when choosing boss specials. Enemy basic target attention can be provoked.
- The in-game Archive, HUD skill labels and README are updated to match these designs. Pending final QA must check names, exact rank gains, status stacking, and mobile charged release. **No new tests or builds were run.**

---

## Implemented for planned combined QA: Skills 2–8

Existing Skills 1–2 retain **+15% of rank-1 damage per trained skill rank** for normal and charged actions. In addition, each even rank (2/4/6/8) advances the relevant status, reach or coverage without a second exponential damage multiplier. Skills remain capped at 8 under existing rescued teachers and costs; normal/charged use **one saved rank**.

| Skill | Paladin | Mage | Ranger |
|---|---|---|---|
| 2 normal | **Sundering Strike:** melee damage, weakens the damage the enemy deals for a short period | **Frost Bolt:** projectile damage plus Slow | **Pinning Shot:** existing two quick arrows with a short Slow |
| 2 charged | **Holy Cleave:** frontal cone with damage and weakening for all struck enemies | **Frost Burst:** circular AoE damage/Slow; radius and Slow increase at even ranks | **Pinning Volley:** line-shaped AoE damage plus short Slow; reach/width improve at even ranks |
| 3 normal | **Shield Stance:** 8s maximum, **65–73% incoming damage reduction** by rank; disables Skill 1, makes other Paladin skill damage **60%**, second tap immediately ends stance and starts its cooldown | **Spell Interrupt:** ends one current enemy warned/aimed attack; 8s normal cooldown, range improves at even ranks | Unchanged self-heal |
| 3 charged | **Shield Bash:** very short forward cone, damages and collision-safe pushes enemies; bosses and captains take half the bash's ordinary damage, never a fraction of max HP | **Silence Field:** short-lived radius suppresses new skill/special casts for enemies, companions and the Mage alike, not movement/basic attacks | Unchanged hero + living active party healing |
| 4 normal | **Judgment:** holy strike plus provocation (3–4s according to rank) | **Arcane Fracture:** strike plus party-wide incoming-damage vulnerability on the enemy (15–19%) | Unchanged movement haste, no enemy target required |
| 4 charged | **Grand Judgment:** primary hit plus AoE splash and group-wide provocation (boss basic-target override capped at 2.5s) | **Arcane Rupture:** primary hit plus splash and nonstacking vulnerability (20–24%) | **Companion Rally:** +15–19% movement and +8–12% basic attack speed for 4–5s within 350–390 units |

Secondary effect steps are at ranks **2, 4, 6, 8**. The stronger effects are bounded: Shield Stance always lasts at most 8s; Spell Interrupt always stops one current enemy action; mage silence lasts 2–3s and radius 165–205; paladin shield bash reach 115–131 and push 55–75 world units; Grand Judgment area radius 160–180; Arcane Rupture radius 160–180. Normal skills use the existing base slot cooldowns (Skill 3: 8s, Skill 4: 14s); charged Skills 3–4 use 20s base cooldowns, all subject to existing Cooldown Training. Paladin normal Skill 3 instead starts cooldown upon stance end/cancel.

Existing effects untouched where not expressly approved: Ranger healing and haste, Skill 1 normal combo and charged projectiles, Mage Skill 2 frost identity, Paladin Skill 2 cone identity, Ranger Skill 2 line identity, **ordinary Skills 5–7 except the specifically revised Mage 5/7 and Ranger 6; all normal and charged Skill 8 are replaced**, and all companion progression. Newly added charged Skills 5–8 are described below; they do not automatically change their normal forms.

### Implementation internals awaiting combined QA

- `hero-combat.js`: rank-milestone parameters, stance state, push, interrupt, silence, taunt, fracture, normal/charged dispatch.
- `rules.js`: centralized tuning, including charged Skill 4–8 cooldowns and advanced charged move parameters.
- `combat.js`: reduction when shield raised, reduction to enemy output while weakened, vulnerability from hero/companion damage.
- `engine.js`, `boss-combat.js`: enemy damage hooks, suppression of new enemy specials, taunt priority, stance expiration.
- `party.js`: silence prevents allied special casts and Ranger support inside field; basic attacks proceed.
- `app.js`: all Skills 1–8 are chargeable, including Ranger 4 as a target-free companion rally. Ranger 4 tap remains target-free hero haste; Tap/hold Skill 3 honors class differences.
- `renderer.js`: procedural shield overlay, persistent silence radius, charged aim guidance and Last Bastion ward, preserving existing sprite/procedural fallback.
- `archive.js`, `data.js`: update class-specific skill descriptions for Skills 2–8 and generic shared training labels.

**Deferred combined validation:** Skill 1 combos and charged targeting, three classes × 8 ranks × normal/charged Skills 2–8 (including Ranger charged Skill 4), battle against regular/captain/boss/TRUE foes, PvE leashes and walls, silence and taunt interplay, pause, reload/import of v4 saves, historical/succession campaigns, cross-device hold/release, audio/VFX, performance guards and current PR #300 integrated release tests. **No validation executed in this work item** as requested.

## Earlier charged Skills 5–8 iteration — historical and superseded where updated above

The owner approved **a distinct charged move in every Skill 5–8 slot for all three hero classes**, with **the same 0.65-second hold** already used by earlier charged skills. At that earlier checkpoint, normal Skill 8 healing/immunity **had not yet been redesigned**; this is now superseded by the latest complete Skill 8 replacement. Charged cooldowns are deliberately longer than tap cooldowns (provisional bases: Skill 5 18s, Skill 6 12s, Skill 7 25s, Skill 8 40s). Each form uses the same learned Skill Rank 1–8: standard +15%-of-rank-1 damage per rank and restrained secondary gains at ranks 2/4/6/8. Cooldown Training applies normally.

| Slot | Paladin — charged | Mage — charged | Ranger — charged |
| --- | --- | --- | --- |
| **5** | **Consecrated Wave**: stronger, wider close holy AoE that also weakens foes | **Winter Ring**: wider and stronger frost AoE with longer Slow | **Arrow Rain**: stronger real arrow projectiles to foes in a wider area, each causing brief Slow |
| **6** | **Vanguard Impact**: use the existing collision-checked approach, then a compact shockwave that pushes nearby foes | **Focused Arcane Beam**: a stronger concentrated beam projectile with longer Slow | **Evasive Burst**: three rapid focused arrows plus increased movement haste |
| **7** | **Oath Strike**: higher-damage holy AoE with weakening against surviving foes | **Sigil Storm**: larger frost AoE with sustained Slow | **Charged Piercing Shot**: stronger single-target defense-piercing arrow with a short Slow |
| **8** | **Last Bastion**: heavy area holy strike, self-heal and short 25% damage-reduction ward for living active party (not complete immunity) | **Arcane Cataclysm**: strong area blast with a short, nonstacking vulnerability to incoming hero/companion damage | **Perfect Hunt**: high-impact defense-piercing single-target arrow, some self-heal and movement haste |

Historical note: this section precedes the approved redesign above. Normal and charged Skill 8, Mage Skills 5 and 7, Ranger Skill 6, and Ranger charged Skill 4 have since changed. No Skill 8 version now grants immunity. Any values in this older table conflicting with the latest section are obsolete.

Historical input rule (now superseded for Ranger Skill 4): all eight skills now support charge for all three classes, with Ranger 4 charged as a target-free companion rally. A tap under 0.20s casts normal, releasing an incomplete hold before 0.65s cancels, full hold then release casts charged. Normal/charged versions share a single cooldown slot. Skill 5 is target-free; Skills 6–8 retain ordinary target eligibility/line-of-sight and charge-target locking, with no silent retarget through walls. All new effects are expressed through existing projectile/charged-area/heal presentation contracts and retain procedural/sprite render fallback.

Source changes also include a visible Last Bastion ward and 5–8 charged-aim cues. Temporary shield, ward and silence state is cleared on save/import and death; ongoing original skill ranks/cooldowns remain in the version-4 save model.

No tests, automated builds, device exercises, deployment or merges have been intentionally initiated in this implementation work, per the owner's consolidated-QA instruction. This also means any errors that require executing the application remain unverified. Follow the owner's explicit request to validate **together** when combined feature branches are ready.

## Older exploratory skill ideas — historical; implemented decisions above supersede overlaps

These were preliminary ideas; the explicitly approved and implemented replacements above now control where they overlap. Remaining ideas are not authorized by this record. The current code shows substantial thematic overlap, particularly Skill 8. The following direction is a balance and role proposal rather than an approval.

| Slot | Paladin: protect / hold ground | Mage: exploit / zone control | Ranger: precision / mobility |
|---|---|---|---|
| **5** | **Consecrated Ground**: moderate local holy area that helps protect companions, rather than another plain AoE strike | **Frost Ring**: close AoE attack with slow + a brief, readable cold zone (not a hard root) | **Arrow Rain**: genuine ranged projectiles into a selected area, with a small controlled hit cap |
| **6** | **Vanguard Rush**: preserve the existing obstacle-checked rush, add a tactical arrival benefit such as enemy disruption rather than brute damage alone | **Arcane Step**: limited collision-safe repositioning linked to a magic projectile or small afterimage; avoid instantaneous terrain bypass | **Evasive Shot**: projectile while repositioning/maintaining speed; not duplicate slot 4 Haste |
| **7** | **Oathbreaker / Consecrated Strike**: deliberate anti-elite holy attack with a distinct guard-breaking mechanic (not extra universal damage) | **Storm of Sigils**: placed magic attack with delayed multi-hit pulses; strong reward for correct positioning, different from Skill 2 frost | **Piercing Shot**: preserve existing defense-piercing specialist shot from PR #302, improve precision/target priorities and telegraph |
| **8** | **Last Bastion**: powerful defensive ultimate, protects allies for a defined interval and counters, **not guaranteed full immunity** | **Arcane Cataclysm**: risky high-damage area technique with clear telegraph/commitment; no free invulnerability | **Perfect Hunt**: high single-target/line precision burst with retreat or marked prey bonuses; no universal immunity |

Each future proposed skill should be distinctive compared with Skills 1–4, should scale across ranks under the existing teacher system, and should not reintroduce universally shared invulnerability. Avoid unavoidable crowd control against bosses, infinite taunt chains, exploitably long silences or unbounded 8-rank geometry growth. Evaluate sustained DPS, solo survivability, companion survivability, ordinary-versus-TRUE bosses, and Normal/Nightmare in the **single coordinated final test pass**, not piecemeal tests now.

## Static source-review follow-up (15 October 2026)

The Mage Silence Field was reconciled with the existing enemy warning pipeline. Enemy specials **already being warned** now pause without consuming their warning timer while their caster remains inside the field; on expiration they resume the same scripted sequence. This prevents a queued boss/captain skill from resolving during silence without deleting authored boss phases. Enemy basic ranged aim, ordinary attacks and movement remain possible.

Repository provenance: work intentionally continues on `feature/hero-skills-2-4-on-snapshot-20261015`, based on PR #300's `implementation/director-snapshot-20261013` rather than published `main`. PR #305 is an **earlier partial draft** started from main for rank-scaled Skill 2; **do not merge it directly over the snapshot**. A future combined PR should selectively carry this branch (plus any later approved work), reconcile overlapping files against the latest #300 branch and run **one consolidated validation matrix** only when instructed.

Pending combined verification specifically includes combat-cast interruption, partial charged holds, paladin shield re-tap, Skill 6 rush geometry, projectile arrival timing, taunt vs special boss targeting, silence's interactions with independently scheduled specials, status reset on death/save, focus/touch controls, Sprite/Canvas visuals and PWA offline. The current source changes are **not certified**.

## Final static handoff — no-test development checkpoint

**Historical source checkpoint:** `6e91e3c08b1f6de0f5252a059ac6836c3029877b` on `feature/hero-skills-2-4-on-snapshot-20261015`. This source branch is the authoritative implementation handoff; PR #305's original `main`-based draft has a GitHub Conversation comment linking here to prevent accidental wholesale merge. The PR #300 snapshot's worldbuilding, actor AI, UX and source changes are intentionally the base.

### Source-review repairs after the initial Skills 2–8 coding pass

1. A Mage Silence Field now freezes the countdown of **already warned specials** for actors inside the field, preventing the special from resolving while silenced without deleting the boss's phases, preexisting active projectiles, or hazards. Ordinary/basic attacks and movement remain valid.
2. Mage Skill 3 Interrupt cancels **one current** warned/aimed attack. If the boss has subsequent authored queued warnings, the next warning is advanced and surfaced rather than discarding every step of a multi-part encounter. This includes preserving the Mine's special preview handoff when its next stage begins.
3. The Paladin's Skill 2 weakening effect resets its stored strength once expired, so a new lower-ranked application does not erroneously inherit a previous stronger debuff. Active stronger effects still aren't downgraded.
4. The earlier source pass included version-4 save cleanup for temporary Shield Stance, Silence Field and Last Bastion wards, earlier Skill 8 immunity distinction (now superseded: neither reworked form grants immunity), collision-aware knockback, taunt targeting and status/talent fields. All require final integrated verification.

### Explicit risks reserved for the one final combined QA

- **Input:** keyboard/touch/pointer quick taps, charged 0.65-second holds and partial cancels across **all eight** slots, especially target-free Ranger charged companion Rally; paused-screen, lost-focus and queued-cooldown behavior.
- **Boss-special integrations:** each region's standalone scripted special owner (Thornfang, Cindermaw/Dreadmaw, Keeper, Dark Lord, captains, night specials), existing warnings, charged openers and special-case damage sources. Silence must not destroy required encounter progression.
- **Movement and defense:** Paladin shield stance versus movement autoattacks, summoned pressure, HP siphons and environmental traps; Shield Bash push against corridor corners, walls, encounter leashes and active boss motions; Vanguard Impact after rush.
- **Status overlap:** higher-rank Paladin weaken/taunt, Mage fracture/Slow/silence, Ranger pinning slows, stacking, expiry, damage mitigation and cleanup in both normal and TRUE forms.
- **Save/recovery:** historical v4 imports, class Succession, changing class, defeated/returning foes, older cooldown talents, serialized status stripping and offline PWA reopen.
- **Visual/audio/performance:** new `chargedArea` effect names and projector effects, screen-space feedback, sprite/procedural fallback, browser/mobile affordances and offline service worker.
- **Balance:** compare normal vs charged Skills 1–8 across classes and ranks 1–8, representative solo and mixed-party scenarios on Normal/Nightmare; confirm 20s/18s/12s/25s/40s cooldown proposals against battle rhythm, avoid permanently locked/warned bosses or control loops.

**No tests or builds were executed for these changes**, per the user's explicit request to combine feature updates first. No merge, deployment, release, automatic QA trigger, or publication has been authorized. These source edits are development-only and should not be described as functioning on a real device until that combined pass.

### Final source consistency addition: Ranger Rally availability

The charged Ranger Skill 4 now checks for a **living active companion within the rank-scaled 350–390-unit radius and clear line of sight before spending the 20s base cooldown**. The hold UI marks the unavailable state as **NO ALLIES**. This prevents an empty companion-only ability from consuming its cooldown in a solo encounter. The normal hero-only Haste still activates without companions. Static source review only; no tests were run.

## Pending future decision: independent class passive skills

The owner raised a follow-on design topic after the active Skill 1–8 charged-form work: consider **one independent passive per playable hero class** (Paladin, Mage, Ranger). Unlike the eight active abilities, these should not require a skill button or charged input. No passive name, effect, unlock, leveling, automatic scaling, rank system, save field or combat balance has been approved. The owner's sentence explicitly began reconsidering whether the passive effect should "level up," so **do not assume manual leveling or automatic hero-level scaling**. Treat progression as undecided and discuss designs only after the active skill work.

## Integration rule

Do not merge this work before reconciliation with the latest PR #300 head, any additional owner-approved updates, and combined regression review. Keep the source tree **multi-file** for the GitHub Pages PWA. No single-file portable build restriction.
