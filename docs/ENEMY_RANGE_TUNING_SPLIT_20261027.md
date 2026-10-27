# Enemy detection versus ranged basic range — split tuning (27 October 2026)

## Why these are two controls

[PR #335](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/335), the accepted 20 October dev.101 balance change, added `enemyTargetingMultiplier: 1.1` for **both** ordinary passive acquisition and ordinary ranged-basic eligibility. The owner had asked for slightly greater targeting distance to counter superior Mage (400) and Ranger (450) basic reaches. The 10% scalar applied to *both* unrelated mechanics. [PR #343](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/343), dev.109 later that day, added an independent 30% position-derived fortified ranged bonus and used fortified firing reach as fortified passive detection.

The present change separates the two multipliers without changing today's defaults, encounter range, skills, damage, projectiles, cooldowns, fort bonus, save schema or player-side rules.

## Tune these independently in `src/prototype/rules.js`

| Global setting | Default | Controls |
| --- | ---: | --- |
| `balance.enemyAcquisitionRangeMultiplier` | `1.1` | Passive enemy detection, including the longer fortified acquisition band |
| `balance.enemyRangedBasicRangeMultiplier` | `1.1` | Enemy ordinary ranged basic attack eligibility, including fortified firing |

Unfortified detection: `260 × enemyAcquisitionRangeMultiplier`. Fortified ranged detection: `max(260, (shotRange || 280) × 1.3) × enemyAcquisitionRangeMultiplier`. Basic ranged fire: `(shotRange || 280) × enemyRangedBasicRangeMultiplier × (inFort ? 1.3 : 1)`.

**Deliberate independence in forts:** Before the refactor, acquisition indirectly called `enemyRangedRange(e)`. That path has been removed, so retuning *only* ranged firing distance no longer retunes detection, and vice versa, even for fortified enemies. The existing 30% fort bonus is separate and unchanged.

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

All unfortified enemies share ordinary passive acquisition **260 → 286**, regardless of species. In forts, ranged enemies use the larger of ordinary acquisition and the fortified species band; e.g., default 280-shot: **364 → 400.4**. Base figure is the pre-dev.101 10% targeting increase, not the pre-dev.109 fortified upgrade.

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
