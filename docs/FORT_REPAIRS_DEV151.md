# Frontier cleanup and Veyra warning repairs · dev.151

Joel approved both defects from [the native fort audit](NATIVE_RANGE_FORT_AUDIT_DEV145.md). This release builds on published dev.150, retaining the Thornfang patrol/witness, story-first quest board, recruitment and queued companion-care changes and shortened Captain briefing.

## Resulting behavior

The Frontier recovery captain's death unlocks his cache and starts his existing return timer, but does not remove unrelated regional enemies or the Ashen Warlord. Recovery synchronization now restricts enclosed garrison cleanup to actual `supplyRoom` zones, matching the immediate captain-death path. Enclosed Treasury cleanup and paid captain/guard returns remain intact. The fix prevents new erroneous cleanup; it does not guess which historical deaths were legitimate or revive existing corpses.

Veyra's nine canister fragments keep their authored flight span when receiving a fort speed bonus. Their six-unit contact width now shares the same geometry constant as their existing six-unit warning lanes, instead of inheriting ordinary enemy projectiles' wider contact. The existing fragment count, raw damage budget, warning duration, 30% fort speed bonus, own-wall permissions and transient cleanup remain. Other projectile kinds retain their existing minimum-flight and collision defaults.

## Focused verification

- `treasury-recovery`: existing five-region loss/collection/return checks plus four explicit phase contexts preserving the actual Frontier roster and regional boss after a captain kill, full tick and restore. Night-only populations are settled before checking identity; previously dead actors remain dead.
- `snapshot-veyra-combat`: existing encounter/point-blank checks plus 112 real boundary cases across four phase contexts, Normal/TRUE and three native firing directions. Check terminal and lateral warning edges, inside/outside damage, 20/100 ms and long terminal steps, fixed special span and retained fort speed.
- Original `fortifications`, `treasury-fortifications`, `enemy-reach-regroup`, Veyra's 18 fatal cases and AV identity checks pass. The formerly failing `fortifications` suite now reaches and passes all its original assertions without fixture bypasses.
- Current queued companion-care suite passes. Independent rejection probes restore each old faulty method in a separate process: the new regressions reject outdoor cleanup, special-flight extension and oversized fragment contact.
- Generated build/syntax and changed-source formatting pass. Desktop and phone browser startup execute the repaired Frontier case with 57/57 unrelated actors surviving, boss alive and no JavaScript page errors.

Exact test inputs, logs and the scope of the rejection probes are retained in [the validation receipt](evidence/FORT_REPAIRS_DEV151.json) and [local evidence](../tools/fort-repairs-dev151/). Existing audit reproductions remain historical defect controls; their deliberate old-bug assertions are superseded by the updated original suites.

The separate wolf hold's old 85-unit road exclusion remains a layout/expectation review. No broad CI, full-game/device matrix or save reset is part of this repair. Publication uses committed files only, then restores the normal release workflow. Final deployment details are recorded in the publication receipt after public byte verification.

## Publication

PR [#390](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/390) merged as `a5a8c1f4f76e4a3aa13122c7605e83a988ffbca3`. Package-only run [39700991767](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/39700991767) succeeded. Public `build.txt` and all 12 checked desktop/phone/runtime files match the tested checkout exactly, including the retained dev.150 briefing. The normal release workflow is restored byte-for-byte and the temporary publisher removed. [Publication receipt](evidence/FORT_REPAIRS_DEV151_PUBLICATION_20261022.json). No broad CI ran.
