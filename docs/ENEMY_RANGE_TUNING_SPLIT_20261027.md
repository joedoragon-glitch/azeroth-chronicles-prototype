# Enemy detection versus ranged basic range — split tuning (27 October 2026)

## Why these are two controls

[PR #335](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/335), the accepted 20 October dev.101 balance change, added `enemyTargetingMultiplier: 1.1` for **both** ordinary passive acquisition and ordinary ranged-basic eligibility. The owner had asked for slightly greater targeting distance to counter superior Mage (400) and Ranger (450) basic reaches. The 10% scalar applied to *both* unrelated mechanics. [PR #343](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/343), dev.109 later that day, added an independent 30% position-derived fortified ranged bonus and used fortified firing reach as fortified passive detection.

The initial draft separated two independently authored multipliers. The owner then authorized the first concrete balance fix: **each ranged enemy's automatic detection must cover at least its actual basic firing reach, inside and outside forts**. Firing values, melee detection, special skills, damage, projectiles, cooldowns, fort bonuses, save format and player-side rules remain unchanged.

## Tune these independently in `src/prototype/rules.js`

| Global setting | Default | Controls |
| --- | ---: | --- |
| `balance.enemyAcquisitionRangeMultiplier` | `1.1` | Passive enemy detection, including the longer fortified acquisition band |
| `balance.enemyRangedBasicRangeMultiplier` | `1.1` | Enemy ordinary ranged basic attack eligibility, including fortified firing |

The common melee awareness band remains `260 × enemyAcquisitionRangeMultiplier`. Enemy basic firing is still `(shotRange || 280) × enemyRangedBasicRangeMultiplier × (fortified ? 1.3 : 1)`.

**New effective ranged awareness invariant:** `max(common awareness, actual enemyRangedRange(e), fortified legacy awareness)`, where the old fortified awareness term is `(shotRange || 280) × enemyAcquisitionRangeMultiplier × 1.3` only inside a fort. This keeps the independently adjustable detection modifier, but changing firing reach now automatically increases detection when necessary. Reducing firing reach does not reduce the native detection band. In forts, the 30% garrison bonus is position-derived for **both** ranges. Ranged detection is at least ranged firing, with equality at the current fort defaults. The older PR's exact independence of *effective* reach is superseded by this owner-approved minimum-detection relationship.

## Range audit (world units)

| Basic attacking unit | Authored/base | Current (10% hostile-only increase) |
| --- | ---: | ---: |
| Ranger hero | 450 | 450 |
| Mage hero | 400 | 400 |
| Archer companion: ordinary active squad combat | 280 | 280 |
| Archer companion: covering fire, defensive response, Recall | 185 | 185 |
| Ranged pet, all ranged-role families | 280 | 280 |
| Mireling spitter | 230 | 253 |
| Goblin slinger | 240 | 264 |
| Reedbeast spitter | 250 | 275 |
| Ogre stone thrower | 260 | 286 |
| Orc axe thrower | 260 | 286 |
| Ashbeast cinder spitter | 270 | 297 |
| Archer, Crown Guard, wraith, forced-role/default ranged | 280 | 308 |
| Skeleton bow guard | 290 | 319 |

Before this correction, all **unfortified** ordinary enemies shared 286 passive awareness regardless of shot range. The melee band stays at 286, while ranged enemies now automatically detect out to their real basic firing reach if that is greater. Ranged fort detection already normally equaled its fortified basic firing reach and will continue to meet or exceed it even when either authored multiplier changes. Base figure means before dev.101's 10% increase, not before dev.109's fort bonus.

The Archer and ranged pet have **no independent enemy-style 260/286 detector**: `party.js:squadThreats` enlists already-aggroed enemies within **540 of the hero** (or **720** for bosses/summons), then companion doctrine and target selection handle combat. Those are encounter selection thresholds, not automatic attack reach or personal visual sight. Hero auto fire similarly checks in-range eligible targets; it does not use the hostile passive detector.

**Separate confirmed discrepancy, unchanged here:** The Archer's active `companionFight` basic can launch within 280, while `companionCombatReach` and related cover/defensive/Recall basics use 185. Do not interpret this audit as a decision to equalize them without additional tests and balance review.

## Validation/limits

- `tests/fortifications.test.cjs`: native baseline and separate firing-only versus acquisition-only override probes, fortified and outside fort, with restoration after test.
- `tests/enemy-distant-damage-response.test.cjs`: keeps the original 286 passive detection contract and distinct response to delivered distant damage.
- `tests/treasury-fortifications.test.cjs` and `tools/native-fort-audit-dev145/positive-lanes.cjs`: use the firing knob for effective range evidence.
- Package, lock, build version and PWA cache are advanced together to dev.198. This is **an unmerged draft**, not a deployment authorization; focused GitHub CI/build results must be assessed on its exact head. No full game/browser/device testing has been authorized.

Keep the historical PR #335/343 records unchanged for provenance.

## Source-evidence reconciliation

Focused CI on the first PR head passed the native combat-range tests but reported a sprite-scope source fingerprint mismatch, solely because the accepted `src/prototype/rules.js` text changed. The active `docs/evidence/SPRITE_SCOPE_RECONCILIATION.json` fingerprint for that file alone is updated from `9a2f51894794332c348c9e0814d20b8558209b673e427e923f9b93b6d263975e` to `3630f14f02fc15950d8f75571ddf4f3bd61fe3b7831bf4b91d8e7c358010fdea`, as measured by the focused run. No species mapping, artwork classification, curated asset decision, other source hash or historical original has been regenerated. The exact-head sprite-scope test must pass on this updated draft.

## First balance fix: hostile ranged detection matches or exceeds basic firing (27 October)

The effective values below are **world units** at the existing 1.1 firing, 1.1 awareness and 1.3 fort multipliers. Basic firing reach never changes in this fix. Outside forts only the longer-ranged profiles require more detection. Fortified values were already numerically aligned and are now kept aligned by an explicit runtime floor even if firing is retuned later.

| Hostile ranged archetype | Ordinary basic firing | Ordinary detection before → after | Fortified basic firing | Fortified detection before → after |
| --- | ---: | ---: | ---: | ---: |
| Mireling Spitter | 253 | 286 → 286 | 328.9 | 328.9 → 328.9 |
| Goblin Slinger | 264 | 286 → 286 | 343.2 | 343.2 → 343.2 |
| Reedbeast Spitter | 275 | 286 → 286 | 357.5 | 357.5 → 357.5 |
| Ogre Stone Thrower | 286 | 286 → 286 | 371.8 | 371.8 → 371.8 |
| Orc Axe Thrower | 286 | 286 → 286 | 371.8 | 371.8 → 371.8 |
| Ashbeast Cinder Spitter | 297 | 286 → **297** | 386.1 | 386.1 → 386.1 |
| Archer / Crown Guard / Wraith / default ranged | 308 | 286 → **308** | 400.4 | 400.4 → 400.4 |
| Skeleton Bow Guard | 319 | 286 → **319** | 414.7 | 414.7 → 414.7 |

The fort columns show **conditional** native ranges if a species enters an authored fort; they do not claim every species naturally lives in every fort. Mixed-role hybrids are included whenever their actual actor flag is ranged, including saved ranged monsters, summoned units and forced-ranged variants. An explicitly forced-melee actor is unaffected. The common 286 passive radius and the original two configuration knobs remain independent for melee behavior.

**Important:** Detection distance alone does not bypass line of sight, fort shooting permissions, town safety, opening-field aggro restrictions or territorial disengagement. Player-side hero and companion/pet ranges, damage and skills are outside this fix. The earlier documentation's original parity-only draft state and original first-run fingerprint reconciliation remain as provenance, not a statement that the final draft makes no balance change.

**Validation:** `tests/fortifications.test.cjs` exercises every known ranged shot profile and fortified/unfortified state, fallbacks and tuning; `tests/enemy-distant-damage-response.test.cjs` exercises actual outdoor automatic aggro and aim inside newly covered range, refusal beyond it and melee awareness stability. Focused CI and reproducible PWA build results must correspond to the new exact branch head; no owner approval has been given for full-suite, merge or deployment.

## Allied ranged basic acquisition reconciliation — follow-up within draft #517

**Ranger hero:** automatic Skill 1/covering-fire targeting and basic firing both use `heroSkillRange(1) = 450`. **Mage hero:** the same shared selection/firing rule uses `400`. Both already cover their entire basic firing reach; the wider manual selection/locked-target band is deliberate UI targeting, not basic fire or passive awareness. No hero radius, damage, skill, pursuit, save or onboarding changes.

**Ranged pets:** native ranged basic firing remains `balance.companions.petBasicRange = 280`. **Archer companions:** native normal `companionFight` firing remains `280`, but `companionCombatReach` previously returned only `185` for covering/defensive/Recall basics. This follow-up aligns all Archer **basic** fire paths to `280`; the separately authored *first skill* still has its existing shorter reach and all specialist skill distances stay independent.

**Shared squad awareness:** before, `squadThreats` only considered already-engaged monsters within `540` units of the hero (or `720` for boss/summon), regardless of an allied ranged actor's own position. An Archer/ranged pet could therefore have a legal 280-unit basic shot while its opponent was excluded from squad threat selection when farther from the hero. After the fix, active available Archers/ranged pets can additionally recognize **already-aggroed, directly visible** enemies within their own actual `companionCombatReach`; the existing hero-centered band remains. This does **not** trigger combat against idle enemies or waive line of sight, Recall's no-pursuit/close-threat constraints, survival behavior, active roster requirements, working companions' orders, town safety or leashes.

| Allied role/path | Basic firing before → after | Target acquisition before → after |
| --- | ---: | --- |
| Mage hero automatic basic | 400 → 400 | Same firing-radius scan 400 → 400 |
| Ranger hero automatic basic | 450 → 450 | Same firing-radius scan 450 → 450 |
| Ranged pet ordinary/defensive basic | 280 → 280 | Hero-centered engaged-threat screen 540/720 only → that **or** 280 from an available ranged pet |
| Archer normal basic | 280 → 280 | Hero-centered engaged-threat screen 540/720 only → that **or** 280 from an available Archer |
| Archer covering/defensive/Recall basic | 185 → **280** | Same per-actor range now used for local basic checks; Recall remains counterattack-only |

The `540/720` are **hero-centered encounter envelopes**, not the ally's own firing radius, and should not be misconstrued as unlimited 540/720-unit shots. The separately authored manual hero-selection band is wider than automatic firing, intentionally. Verification uses focused `tests/targeting.test.cjs` for exact hero firing boundaries, real allied recognition/shot/refusals outside the hero-centered envelope, and `tests/companion-melee-basic-reach.test.cjs` for defensive versus ordinary Archer basic parity with the unchanged ranged-pet boundary. No complete game suite, merger, or deployment authorized.

### Focused regression fixture reconciliation after first allied candidate

The first allied PR-head CI exposed three failures: the new Archer normal-basic boundary fixture allowed the valid nearby formation anchor to win over the firing decision; the existing targeting suite still assumed the old Paladin 120-unit charged technique although current authored reach is 190; and the existing Archive reference suite modified the retired Skill 1 cooldowns-table slot although Skill 1 now has dedicated cooldown ownership. The revised Archer fixture uses a distant real hero anchor so the firing owner is isolated, the targeting assertion is brought into current charged rules, and the Archive test exercises the current ordinary Skill 2 cooldown field and corresponding Archive topic. This last adjustment is test-only and changes no Archive/runtime/skill behavior. The original failing run remains [recorded](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40468655441); fresh exact-head focused checks are required before acceptance.
