# Greenwood Vale — post-release refinement staging

> **DRAFT WORKSPACE ONLY. NO PATCH IMPLEMENTED. NO FIXES AUTHORIZED.**
>
> This file exists solely to give the owner a single editable draft pull request before their complete playtest feedback has been collected. The living issue **[#679](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/679)** is the authoritative place to revise observations, evidence, preferences, and candidate work. This file is *not* a settled specification. Nothing in this branch changes the game's runtime, visual assets, spawning, navigation, balance, save state, or deployed release.

## Scope and relationship

- Game: *So I Became the Dark Lord's Problem*; Greenwood Vale **only**.
- Baseline: owner-accepted-for-initial-playtest flagship reconstruction merged as [PR #654](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/654).
- Follow-up: **one issue (#679)** and **one draft PR** for a single future patch. No other regions and no premature unrelated fixes.
- Creative authority: user feedback is **incomplete and editable**. The owner may change any direction at any time before approving the final patch plan.

## Candidate topics — observations, not implementation requirements

1. **Encounter pacing:** 32 ordinary Goblin/Skeleton field entities were preserved numerically, but the broader area and uneven route distribution leave quieter regions. Audit actual occupied/active/historical-save states and level-1 field onboarding before proposing redistribution or counts. No approved new count.
2. **Distinctive visual vocabulary:** do not confuse placed prop count (198→331) with number of unique meaningful visual/asset types. Compare unique old and new rendered types, find genuine losses (e.g., animal pen, poultry yard, wildflowers, camp identity), distinguish true absence from visual replacements, then compose any restorations intentionally. No approved restoration list.
3. **Thornfang/Mira patrol:** eight updated waypoints can be traversed, but waypoint labels, Orchard witness placement, territory coverage, long countryside/crossing legs, and proximity to the relocated farm/mill/Crypt/Goblin compounds may not reflect established wilderness scout/security lore. Preserve the moving captive, southern-first quiet opening, route clues, combat, reset, rescue and saves. No approved new route.
4. **Further live feedback:** owner has noted the region “looks decent, needs adjustments”; await specific visual and gameplay decisions, including any feedback that supersedes these observations.

See [#679](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/679) for measurements, nuance, source links and ongoing amendments. Avoid duplicating an evolving decision register here.

## Working procedure

- [ ] Continue gathering owner's firsthand notes. Edit the **existing** issue and draft PR rather than creating extra trackers.
- [ ] Distinguish measured behavior, inferred risk, owner judgment and actual bug.
- [ ] Reconcile conflicting goals (quiet settlement, active wilds, longer map, performance, lore).
- [ ] Receive owner's explicit approval of a final patch scope/design **before altering runtime or artwork**.
- [ ] Implement only approved Greenwood changes in this same PR and perform whatever focused verification/release process the owner then authorizes.
- [ ] Keep PR in **Draft** throughout preparation; do not merge or deploy without a separate go-ahead.

## Owner feedback additions / decisions

**Pending.** Write amendments in [issue #679](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/679), and reflect approved changes here only when needed for implementation. Every item can be revised or withdrawn.

**Current technical status:** Planning document only. No code/art modifications, no tests manually initiated, not merged, not deployed, not device verified.
