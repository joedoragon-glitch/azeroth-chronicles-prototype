# Community Snapshot + PR #311 — source integration record (16 October 2026)

**State: SOURCE-INTEGRATED, NOT RUNTIME-VALIDATED.** This is a source compatibility review and recovery handoff, not a successful test, human-art acceptance, release certificate or authorization for CI.

## Immutable inputs and protected output

- Released predecessor in main: merged PR #308, `6bc27be31792b1c38147d61e98ceed6acf3e2560`. PR #300 is already merged, and is NOT the second feature branch.
- Community Snapshot passing source re-audit: `ca33acb14d92cbce12633eaab702318343dce509`, branch `feature/community-snapshot-post308-20261016`; implementation includes eleven pet families, veteran companion extensions and procedural/scene art.
- Ten-issue implementation: draft PR #311, `b91347f863d68d6b7beca76e23f625ddd7ff1293`, branch `fix/pre-snapshot-ten-issues-20261015`.
- Integration branch: `integration/community-snapshot-311-20261016`. First combined source checkpoint: `e513ea7fb9bfa21d5e102177bb3eedd3954e6cc4`; no PR opened and no push to the pre-existing #311 PR branch.
- All three predecessor branches/commits remain intact. No main write, merge, deployment, tag or Pages publication.

## Mechanical merge audit

Common ancestor of both feature heads: merged #308 `6bc27be31792b1c38147d61e98ceed6acf3e2560`. PR #311 changes 21 files; the Community candidate adds its own 91-file delta relative to #308. The intersection is **seven source files**, reconciled at original PR #311 patch hunks against the audited Community versions, with exact context matching and no discarded hunk:

| Shared runtime owner | Imported #311 hunks | Existing Community feature retained |
| --- | ---: | --- |
| `boss-combat.js` | 1 | pet armor in held-roll resolution |
| `engine.js` | 14 | pet owner install/unlock and validated past victories |
| `party.js` | 4 | pet formation, dispatch, charge and veteran troop skills |
| `renderer.js` | 4 | pet appearances and identity-keyed phase memoization |
| `rules.js` | 13 | eleven pet kits and authored procedural rules |
| `save.js` | 2 | v4 pet entitlements and troop queue validation |
| `visuals.js` | 2 | improved art and existing rendering identities |

Nonoverlapping PR #311 files (targeting, build/version carriers, supporting tests, occlusion coverage, docs) were preserved from that exact head. This is a source three-way/hunk compatibility result, not compiler or execution evidence.

## Cross-feature issue and correction

**IN-01 / Recall pets:** PR #311's standing defensive Recall correctly avoids pursuit, but its normal defensive basic branch treated all non-Archer companions as melee Soldiers. That conflicts with the Community's distinct ranged/melee pet identities. The integrated `party.js` now chooses ranged-pet reach from the pet catalog and invokes `party-pets.js::petDefensiveCounter` for pet basics; the latter preserves pet projectiles, melee effects, cooldown ownership and no active-skill/chase policy. An unexecuted ranged Crypt/melee Thorn regression probe has been added to `tests/pre-snapshot-ten-issues.test.cjs`. All other tested assumptions about pets remain unproven until authorized execution.

**IN-02 / source receipt lineage:** The Community's baseline exact-hash tests protect #308 files such as `app.js` and `hero-combat.js` that PR #311 legitimately changes, as well as shared files. Merely importing #311 would produce false source-drift failures. `authorizedCommunity311IntegrationRevision` in the existing protected manifest is an **append-only exact SHA-256 overlay**, with historical source receipts preserved; the hash test accepts the new values only for explicitly listed paths. Any subsequent source edit or third incoming package must append another exact revision before the final test session rather than disabling protection.

**IN-03 / generated-version boundary:** PR #311 carries manually revised package/lock, `build-info.js` and `sw.js` for an untested `0.9.1+snapshot.dev.66` draft. This is NOT proof that current generated HTML, worker asset sets or the new Community pet graph are synchronized. The authorized validation cycle must select one final candidate version after all packages are integrated and perform a real full regeneration, source/load-order audit, cache upgrade and PWA checks. Until then, this integration branch is not deployable.

## Retained acceptance / not executed

- Skill approach and charge release, input cancellation, target death and Recall persistent defensive command across Soldier/Archer/ranged pets/melee pets; direct and offensive area casts deliberately resume engagement, defensive ones do not.
- Hostile mixed-species support triage/approach, captain guards and exact once Scornfang historical HP migration, captain cooldowns/geometry, named-and-species Rogue moves, renewable anti-kiting versus leash.
- Coin/mint Dark Lord portrait, inherited and new Treasury decor, major cover/occlusion and real browser performance oracles, day/night/native phones; pet renders and provenance, eleven TRUE collection and v4 recovery.
- Full original and added Node/Chromium/WebKit checks, actual historical saves, full late-game combat/balance matrix, 426 art contract review, phone/Chromebook experience, generated assets and offline installation.

**Execution status:** No test, syntax check, build, simulation, renderer, browser, benchmark, CI, PR trigger or deployment is authorized or was run in this integration. The user has said a third feature is still in development. Incorporate it into this same combined branch when delivered, then redo the source audit and authorize **one** final overnight validation cycle. Any required fixes remain on this combined workstream. Do not merge/publish without separate explicit permission.
