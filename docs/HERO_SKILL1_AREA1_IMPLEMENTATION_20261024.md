> **Historical checkpoint:** [PR #439](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/439) merged on 25 October 2026. The draft, implementation and next-step directions below describe that earlier candidate; they are not an instruction to resume or re-merge it. Consult [Development state](DEVELOPMENT_STATE.md) and current source for present behavior and acceptance.

**Historical status:** This document preserves the original implementation checkpoint. Later work, repaired CI, completed FIFO input and expanded verification supersede its unfinished-work statements; see [the current final review](HERO_SKILL1_AREA4_FINAL_REVIEW_20261024.md).

# Hero Skill 1 integration — Area 1 gameplay implementation checkpoint

**24 October 2026 · Draft PR #439 · AREA 1 only · Not merged or deployed**

This record distinguishes executable behavior on the PR branch from later audiovisual, in-game documentation, interaction refinement and testing work. Numerical values in [the core balance specification](HERO_SKILL1_FINAL_BALANCE_SPEC_20261024.md) are the approved **first-pass** candidates, not playtest-certified. The [new owner-directed cooldown model](ASYMMETRIC_TAP_CHARGED_COOLDOWNS_20261024.md) supersedes old shared-timer descriptions.

## Executable mechanics implemented on this branch

1. **Three Skill 1 forms, one learned rank**: existing 100/110/120% automatic three-hit combo with 55% splash remains automatic; the former charged Paladin holy shot/Mage thin beam/Ranger three quick arrows are promoted to instant **3-second normal Skill 1 Tap**; charged Slot 1 now dispatches the new class techniques, with full existing rank/protection policies.
2. **Stationary/moving automatic basics**: PR #436's stationary intent is incorporated directly into this branch, with unsuccessful idle probes throttled to 10 per second. Basics run on **hero.basicCd** (0.85s base) independent of activated Skill 1, and are not blocked merely because the player is charging. The original #436 PR remains separate, open and unmerged; do not merge it independently into this integration.
3. **Paladin Radiant Cross**: 8s charged lock and 3s normal lock. Four-arm cross rotates toward selected target, 190–230-unit arms, 70–102 displayed core width, up to 8 distinct foes, one hit per target on each of two damage pulses separated by 0.35s, `1.5(P+12)M(rank)` per pulse. Enemy collision bodies count toward arm intersections; center overlap never causes extra hits. Delayed second pulse is simulation-owned and zone/defeat gated.
4. **Mage Wide Arcane Beam**: 7s charged lock + 3s normal lock; a 440–480-unit terrain-clipped, 96–128-full-width corridor; `2.4(P+12)M(rank)` once per eligible enemy body inside it, with **no arbitrary target count cap**. Enemy contact does not terminate the beam; walls and protection checks still apply.
5. **Ranger Hawk Interception**: 8s charged lock + 3s normal lock; targeted one-foe homing attack, launch range 450, travel speed 650, bounded 560–620 cumulative path, 1.25s lifetime, contact against real body radii, `2.25(P+12)M(rank)` on legal contact. A real active Rogue regroup/escape, authored Rogue `withdraw`, or ranged backpedal receives 4.0–4.6 seconds of **same-retreat-family suppression**, without universal stun. **Scripted/mandatory boss phase returns are deliberately not cancelled**. Transient WeakMap state cannot enter saves or leak across enemy identities.
6. **Asymmetric cooldowns for all eight hero skill slots**: retain `hero.cd[0..7]` as the **normal** cooldowns and add `hero.chargedCd[0..7]` as charged-only locks. Charged starts **both** relevant timers; normal Tap only starts normal, never extends charged; Charged requires both ready. Paladin Skill 3 Shield Stance preserves lowering/expiry-based normal cooldown, and normal Stance is available after its 8s cooldown even if charged Bash's 20s lock persists. Existing Cooldown Training and Slow recovery apply to each timer once using the same elapsed recovery value.
7. **Save v4 migration**: new campaigns start both arrays and basic timer at zero. Historical `hero.cd` values migrate into charged lock while normal is clamped to a normal recovery; original slot-1 remaining also initializes absent automatic-basic cooldown. Invalid/malformed array and timer values are rejected. Companion timers, skills and saved rosters are not converted.
8. **Form-aware input readiness — historical Area 1 implementation, NOT final queue behavior**: normal tapping when only charged cooldown remains is allowed. Charged queues wait for both timers and genuine 0.65s preparation. The Area 1 input code currently allows a normal press to **replace/cancel** a pending charged request; **this is now explicitly contrary to the later owner's approved Area 3 decision**. Both form requests must instead **stack FIFO**, without silent replacement; see [the authoritative queue contract](HERO_SKILL1_AREA3_QUEUE_STACKING_DECISION_20261024.md). Two-clock HUD mechanics exist; ordered multi-entry queue HUD/input remain Area 3 work.

## Source ownership

- `src/prototype/rules.js`: shared numerical first-skill config and class charged cooldowns.
- `src/prototype/hero-combat.js`: cast timer ownership, promoted taps, charged geometry/flight and event receipts.
- `src/prototype/engine.js`: three hero timers, delayed effects tick, Rogue retreat classification/lockouts and AI gates.
- `src/prototype/boss-combat.js`: actual ranged backpedal tracking and tactical suppression gate.
- `src/prototype/save.js`: validation/migration of v4 hero cooldown fields.
- `src/prototype/app.js`: stationary automatic basic probes and form-specific charge queue admission.
- `tests/hero-skill1-stage1.test.cjs`: focused native smoke cases covering cooldowns, basic independence, Paladin pulses, Mage corridor, Ranger escape interception, Shield Stance and save validation.

## What has **actually** been checked so far

- All changed JavaScript gameplay files passed a syntax-compilation check.
- Direct cast/controller checks succeeded for Paladin/Mage/Ranger Tap and Charged, preserving the charged lock across subsequent normal casts.
- The committed `tests/hero-skill1-stage1.test.cjs` source was **executed against native campaign module code** in a JS harness with a reduced set of inert noncombat services; its Skill 1 form, cross/beam/hawk, Skill 2, Shield Stance and save-validation assertions **passed**. This is **not** proof that `npm test`, the full game build, audio/presentation or browser input checks passed. The harness does not validate all dungeon/encounter motion paths.
- No full automated suite, browser matrix, deployment or merge was performed as part of this first-stage implementation checkpoint.

## Historical work remaining at the Area 1 checkpoint

**Area 2 — audiovisual plus actual bilingual in-game player teaching.** This code emits mechanical `heroSkillArea`, `heroHawk`, `skill1Tap` and `hawkRetreatInterrupted` receipts but the dedicated new cross/beam/hawk presentation art, impact/recovery sound design, live numeric Skill Journal, Keeper's Archive, HUD, instructor/guide copy and localized names **are not yet implemented**. See [mandatory A/V and game UI contract](HERO_SKILL1_AV_AND_IN_GAME_GUIDANCE_SCOPE_20261024.md). Temporary working names and Spanish translations suffice.

**Area 3 — owner-approved multi-entry queue plus optional boss retreat audit.** Replace the Area 1 obsolete *held/tapped replacement* behavior with **same-skill FIFO stacking of charged and normal requests**. Do not remove an earlier Charged entry when a later Tap is queued; the Tap follows it when normal recovery permits. Test input thresholds, independent skill slots and clear bilingual queue order using [the owner's exact sequence](HERO_SKILL1_AREA3_QUEUE_STACKING_DECISION_20261024.md). Also audit extended boss/captain optional escape-motion cancellation without breaking scripted/TRUE returns or phase healing. This is not yet implemented or certified.

**Area 4 — focused testing and test-led adjustment.** Run the committed native suite with Node in the full repository, add all-slot 1–8 cooldown + Slow/queue, save load/roundtrip, physical path and boss/companion regressions, then build/offline checks and appropriate targeted browser/Pixi/Canvas checks. Resolve any failures before considering PR ready. No broad tuning before observed data.

At this Area 1 checkpoint the draft was not ready for merge or deployment; PR #439 later merged.
