> **29 October 2026 — current Rogue performance change (PR #595):** Owner approved singer/dancer-centered circular AoE for all eight skills (normal and charged), including automatic basics. This is an active source change under CI review, not a claim that PR #595 is already merged, published, or phone-verified. All radius values below in the historical 27 October record are superseded by the table here. Damage, criticals, Charm probability, maximum hostile target counts, buff strength, durations, cooldowns, and up-to-two-station limit are unchanged.
>
> | Action | Normal radius | Charged radius |
> | --- | ---: | ---: |
> | Automatic basic / third-hit finisher | 220 / 250 | — |
> | Skill 1 | 225 | 290 |
> | Skill 2 | 225 | 280 |
> | Skill 3 | 225 | 280 |
> | Skill 4 | 225 | 280 |
> | Skill 5 music station | 220 | 275 |
> | Skill 6 | 225 | 290 |
> | Skill 7 | 225 | 290 |
> | Skill 8 | 240 | 310 |
>
> Casts require a legal hostile inside the Rogue-centered circle and use the same circle for enemy effects, lawful nearby companion boons and visual rings. Automatic attacks have one primary target (only that target can Charm) and circular secondary contacts; the third-hit finisher has a wider 250-unit pulse. Skill 5 stations remain fixed at the place she performed, not attached to her as she moves. Existing bounded VFX are centered on the singer and use lighter perimeter accents to remain legible in mobile/optimized rendering. Source-level and automated checks are separate from actual phone acceptance.

> **Current release status — 28 October 2026:** [PR #511](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/511) **merged and published**; Rogue/Pícara is a normally selectable fourth class in `0.9.1+snapshot.dev.208`. Earlier branch, draft, URL-preview and unimplemented language below describes historical stages and is **superseded as a current instruction**. Phone/boss/visual/audio/long-tail performance acceptance still has independent gates; see [Development state](DEVELOPMENT_STATE.md), [Rogue soft launch](ROGUE_SOFT_RELEASE_20261028.md), and [phone findings](ROGUE_FIRST_PHONE_ACCEPTANCE_20261028.md).

# Rogue Bard — playable branch-preview gate and Skill 5 decision (27 October 2026)

> Draft PR [#511](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/511), branch `design/rogue-bard-feasibility-20261026`. **Owner decision: Skill 5 IS a placed magical music station** (not a physical trap). Owner requires a class that can actually be selected and playtested in the game's own menus. The PR remains **draft, unmerged, and not deployed**; repository publishing and final public class release remain separate approvals.

## Genuine game admission, opt-in by preview URL

- `src/prototype/engine.js` exposes `Campaign.enableRoguePlaytest()`, which registers the Rogue Bard class and its complete numeric starting stats, disciplines and moving-auto-basic profile in the same registries used by `Campaign`, class selection, save validation, Succession and native movement basics. This function is **never called automatically by the headless engine**, preserving the three existing publicly playable classes and historical regression fixtures.
- `src/prototype/app.js` calls it **before loading/recovery/validation and before constructing the class-selection menu**, but only for an explicit `?roguePlaytest=1` URL query parameter. The new **Rogue Bard** button appears in the ordinary Normal, Nightmare and available Developer/Diagnostics class-selection menus. Use the usual game controls, acquire skills from instructors, cast both forms, capture companions by lawful automatic primary hits, and test saves/Succession.
- Normal users opening the ordinary route still see three existing classes; no global public release, auto-entitlement, save migration, new RNG stream or critical-intensity player setting has been added. The query flag is an **unlisted test gate, NOT authorization/authentication**. A branch build must actually be hosted before anyone can use this URL in a browser. Merely passing CI on an unmerged PR does **not** create a live preview URL.
- A Rogue test save may only be **loaded/validated while the opt-in query flag is present**. Always export existing Normal/Nightmare saves before replacing a slot in a preview; the new-run confirmation remains active. Without the test flag, the unchanged class registry intentionally refuses Rogue saves, preserving them rather than attempting a silent conversion.
- `src/prototype/app.js` now labels all eight working musical skill pairs in the actual touch/keyboard UI. Those labels are provisional and mechanically inert. Rogue's level-up message uses the class-specific Mischief growth name; the critical-level default remains separate `rogue: 2` in developer-authored native tuning only.

## Skill 5 — owner decision and evidence boundary

**Confirmed concept:** `Sticky Shuffle` (tap) / `Briar Boogie` (charged) create **placed magical music stations** that affect enemies and allied companions in a circle while they remain inside. **Not traps, summons, moving pet actors, permanent structures, or free buffs after exit.**

The current implementation is still *prototype tuning*: tap placement range 260, radius 140, lifetime 4s, stationary slow pulses, and 25% Slow resistance for companions currently inside; charged placement range 300, radius 180, lifetime 5s, modest damage pulses, 40% Slow resistance and 6% incoming-damage ward inside. No more than **two live stations**; regions/peace/death invalidate them and nothing is saved. These **numerical figures are not yet owner-approved**; note older design proposals of 8s/10s are historical and differ from actual code. No need to redesign away from the station concept.

## Evidence / release boundary

- `tests/rogue-bard-live-playtest-admission.test.cjs` asserts opt-in registration, original-class isolation, Normal/Nightmare/Developer real construction, source-level game-shell gate and Skill 5 labels, critical default, v4 snapshot validation/reload, progression, Succession and absence of player-critical slider.
- Existing Phase 4/5/6 combat, companion, station, temporal critical and legacy class suites must still pass at the **new exact commit**; no source-only statement proves actual iPhone/desktop browser usability.
- For actual live owner acceptance: host a dedicated **non-production branch preview** (or explicitly approve deployment/merge), open its `?roguePlaytest=1` URL, create a new Rogue, evaluate Charm-first capture, worker/Barracks recovery, instructors, Skill 5 footprints, boss control, save/reload, Succession and desktop/touch.
- **Do not merge, deploy to production, or make Rogue the default public fourth class without explicit owner approval.** Keep PR draft until playtest evidence is reviewed.
