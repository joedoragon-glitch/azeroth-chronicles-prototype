# Fourth-class readiness housekeeping — draft PR #511

**27 October 2026 | Limited runtime preparation + focused regression source | Draft, unmerged, not deployed**

This follow-up was requested **within the existing Rogue Bard PR #511**, not a separate PR. The latest owner-approved Rogue Bard names, mirrored combat-only performances, proposed class mechanics and unresolved balance decisions remain in [canonical owner handoff](ROGUE_BARD_CANONICAL_OWNER_HANDOFF_20261027.md) and [the sixteen-form matrix](ROGUE_BARD_DUAL_SIDED_PERFORMANCES_CRITICAL_TIERS_20261027.md).

## Implemented in this branch (inert for all three existing classes)

1. **Single Expedition active-cap source with class bonus.** `R.balance.companions.activeCaps` remains `[0,2,3,3,4,5,6]`. `Campaign.activeSlotBonuses.rogue = 1` is a dormant future-class configuration in `progression.js` (the class-count-dependent `rules.js` edit was reverted to preserve source-evidence fingerprints); there is **no** `balance.classes.rogue` entry and no currently selectable Rogue. `progression.js::expeditionPartyCap` and the version-4 save validator now use the same rank table plus optional class bonus. All current classes retain 2/3/3/4/5/6 active companions.
2. **Succession checks derive the class count.** `save.js` validates maximum fallen classes and Game Over identity using `Object.keys(classes).length`, instead of two hardcoded `3` values. With the current three-class registry, accepted and rejected historical saves should behave exactly as before. The existing Succession mechanics are not replaced.
3. **Seventh same-type formation location.** `party.js::partyFormationOffset` now defines a seventh location in each of the four existing Soldier/Archer × melee/ranged-hero arrays, while retaining the exact first six offsets. This prevents the obvious wraparound collision when seven allies share one troop type. **This is not yet proof that all mixed companion/pet compositions are collision-safe**; the seven-actor browser and boss combat matrices remain necessary.
4. **Class-count-dependent user-facing messages.** `app.js` now constructs the number of classes for Succession introductory copy and final Game Over copy from `Campaign.classes`. When there are three classes, the original full English translation lookup string remains byte-for-byte the same at runtime. Explicit fourth-class English/Spanish paragraphs are provided, with an optional `Rogue Bard` ending title, but no fourth character-creation button until the class actually exists.
5. **Focused regression fixture.** `tests/fourth-class-readiness.test.cjs` checks existing starter troops/caps, future +1 rank limits, original six and distinct seventh formation positions, and three-class/four-class Game Over validation. The four-class save tests **temporarily augment the in-process registry inside the isolated test**; they do not expose Rogue in actual gameplay.

## Owner clarification added 27 October — Charm roster and Barracks

[Expedition ownership and Barracks navigation contract](ROGUE_BARD_CHARMED_ROSTER_BARRACKS_CONTRACT_20261027.md) is now authoritative: Rogue's **owned copies per individual charmable monster type** are limited to **3/4/4/5/6/7 by Expedition rank**, counting all owned active, resting, fallen and away specimens. **No aggregate 12-charmed-monster cap**. Barracks existence and upgrade never cap capture/ownership. Current Basic Barracks local active management remains **3** at every rank; Full Barracks uses Rogue's rank cap. The existing one-page flat Manage group / Name companions lists need bounded navigation and a charmed type-first collection without disrupting the current Soldier/Ranger/Boss Pet paths.

The existing general 200-company guard is a separate technical safety condition; do not elevate it into a new Charm balance rule without examining the eligible creature catalog. Exact individual-type IDs, Succession inheritance, fallen/recovery and save authenticity remain implementation dependencies.

## Barracks navigation preparation now committed in the same draft

6. **Scalable menu foundations:** `src/prototype/menus.js` now pages the existing `Manage group` and `Name companions` lists at **eight members per page**; existing small-roster Rest/Add actions and their revalidation remain direct. A **dormant Charmed monsters** link appears in Company **only when a roster actually contains `charmOrigin`**. It groups members by the future stable `charmOrigin.typeId` and pages both type indexes and member lists, showing active/resting/fallen counts with direct Rest/Add actions. Type names use an explicitly provided future `typeName`, falling back safely; missing type IDs stay isolated per member rather than falsely merging distinct species. There is **no per-frame scan**. Basic/Full Add remains guarded by existing authoritative `barracksFieldCap` and `companionActivationReason`.
7. **Localization and focused UI test source:** `app.js` has new static English/Spanish collection and paging labels and selected dynamic count segments. `tests/barracks-charmed-roster-readiness.test.cjs` constructs synthetic **in-memory** tagged friendly specimens to exercise type sorting, large-roster pagination, direct rest/activate behavior, Basic three-slot refusal, Full future seven-slot capacity and no change to existing class menu visibility. **This is not a valid actual charmed-save fixture or evidence of a working Charm conversion.** Both new source files have been syntax-checked, but runtime/browser tests and Spanish visual acceptance remain outstanding.

**Critical future integration dependency:** the current `charmOrigin.typeId` is a **presentation-side provisional contract**, not yet an authenticated capture/save schema. Before any production Charm unlock, the enemy definition/allowlist must establish an exact stable individual archetype key, v4 validation, count-at-admission function and correct rendered monster identity. The new UI does **not** currently enforce per-type ownership quotas; there is no Rogue Charm implementation for it to check. The generic 200-member safety cap has not changed.

## Later cross-domain audit (same PR)

[Full seven-domain source audit and CI triage](ROGUE_BARD_CLASS_INDEPENDENCE_AUDIT_20261027.md) adds explicit starter-party configuration, fail-closed unimplemented class combat, an explicit basic-attack approach table, class-specific selection text, rank-derived Expedition service messages, and Succession normalization of active-party overflow. Critically, `save.js` now accepts **two fallen classes with two available successors** when four classes exist; its previous pending-death assumption was still three-class-specific. Added targeted regression fixtures for these invariants.

The first Rogue Barracks is still an **authored gameplay design blocker**: she has zero normal starters and cannot hire Soldiers/Archers, while construction currently needs an active Labor-eligible companion. Decide a narrow legitimate builder policy for captured allies or an equivalent in-world alternative before registering Rogue. Do not hand out free conventional troops or silently permit all captured monsters to run the existing resource economy.

The earlier focused CI run at `fa6cb2b` recorded failures in Skill 1 description/cooldown and stale `rules.js` fingerprint evidence. The dormant slot bonus is now in `progression.js` so `rules.js` source was restored; rerun at the **latest** branch head before claiming a clean pass. Some legacy tests may still be independently out-of-date. The class remains unavailable, and this is not feature-complete or release-approved.

## Additional save guard and current-mainline reconciliation

The provisional Charmed monsters UI is **not a capture/save permission**: current `save.js` now rejects any imported companion with `charmOrigin` until an authenticated eligible-type contract, companion conversion and migration have been implemented. `tests/fourth-class-readiness.test.cjs` checks that a forged provisional record is refused. A separate correction in `tests/hero-skill1-area2.test.cjs` compares displayed cooldowns with the actual normal/charged native reduction rather than obsolete unmodified 3/7/8-second literals.

**Required mainline integration:** [exact conflict and next-step record](ROGUE_BARD_MAINLINE_RECONCILIATION_20261027.md). The PR branch trails current mainline changes which have implemented Paladin/Mage/Ranger level-1 class passives and melee pursuit. `engine.js`, `progression.js`, `hero-combat.js` and `save.js` have edits on **both** sides. The current draft must reconcile these source changes and their evidence/tests **before** a clean CI result or merge is claimed. This is not license to replace newer mainline functionality with old branch files.

## Intentional non-implementation / remaining blockers

This housekeeping **does not make Rogue Bard playable**. Do not interpret it as approving or implementing her proposed stats, basic, Charm, 16 performances, 2-second Endure, extra critical probability, critical intensities, art or music. None of those is tested or balanced.

Before actual class registration, the implementation must still explicitly handle:

- **Hero creation and no starting troops:** replace unconditional Soldier/Archer creation for Rogue only; Arena/Developer start, empty-party onboarding, recruitment restrictions and reserve prompts must remain safe for old classes.
- **Combat dispatch:** class-specific auto targeting/reach, Skill 1 tap/charge, all eight songs, original AoE support recipients, third-combo targets; eliminate all implicit “not Paladin/Mage = Ranger” fallthroughs before registering the class.
- **Critical systems:** one native party-domain crit receipt per Rogue release and +2pp/level personal chance if later approved; fourth independently adjustable, bilingual, persistent Rogue Level 1–3 **UI** selector; no third critical RNG stream. Coordinate with merged #440 and draft passives #509.
- **Charmed species identity:** one positive ordinary-hostile allowlist, exact conversion/reward/quest/respawn transaction, independent deterministic Charm RNG, friendly role/AI, same-species display/art, death/recovery, quota, save validation and Succession ownership across all classes. Do not simply make an enemy allegiance-friendly.
- **Capacity beyond the number seven:** mixed pets/Soldiers/Archers, formation collision avoidance and successor overflow to reserve. Seven-same-type uniqueness is only one preparatory guard.
- **Skills/status/other shared systems:** native casting cancellation, positive HoT/incoming healing, Slow and cooldown clocks, station fields and target ownership, hazard disarm decision, temporary status stripping on saves/travel, innate Endure's lethal interception, immune bosses, talent/trainer/Archive translations and UI, class art and crowned ending, sound, render/critical indicators and both Canvas/Pixi rendering.
- **Offline artifact and device regression:** ensure any eventual *new* JS/assets join the GitHub Pages/PWA asset graph. This game is **multi-file** by design. No portable one-HTML limitation must be reintroduced.

## Verification and release gates

Source changes were committed directly on PR #511. **Full runtime regression, browser/phone playthrough, performance profiling and release build have not been performed as part of this housekeeping edit.** The new test must pass under Node, followed by existing focused save/migration, Succession, party and bilingual UI suites. The draft must remain unmerged until the owner reviews the combined design and readiness work and authorizes a release path.

Next safe step is targeted test/CI inspection, followed by a code-review pass looking for class fallthroughs; do **not** add an incomplete Rogue registry entry to make a superficial test pass.
