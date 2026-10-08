# Sprite preparation audit

## Scope and baseline

Preparation stage of Issue 111, with creative decisions and new sprite artwork explicitly deferred by Joel. Baseline is clean v0.8.84 main `3b1fa4c394c633abd61f3e8710b451c5e96618bc`, whose handoff, release and live smoke were verified before starting. Release is v0.8.85 on branch `sprite-preparation-v0885`. Final PR/head, post-merge SHA and live evidence belong in the delivery addendum; no merge/deployment success is implied by this pre-merge audit.

Baseline formatting, freshness and all 36 non-browser suites passed. Final local build, formatting, freshness and 37 suites passed, including the new pipeline suite; focused pipeline tests were repeated after audit corrections. The Chromium/WebKit production matrices and new showroom/real-binary browser/offline test are mandatory exact-head CI gates. Local Playwright provisioning returned invalid ZIP downloads, so no local browser or physical-device pass is claimed.

## Preparation acceptance

| Issue 111 area | Prepared result | Deferred art-pilot boundary |
| --- | --- | --- |
| Specification/catalog | Parse the authoritative 231-entry catalog; verify status partition; three exact runtime contracts with source hashes, canvas/anchor/label dimensions and provenance | Additional runtime bindings are added individually from real renderer/data evidence |
| Processing | Pinned Sharp 0.35.5 and native Canvas 1.0.10; inspect/prepare/check/publish commands, PNG/lossless WebP, source retention, explicit resize policy, alpha/padding/path/budget checks | Actual generated candidates and any justified geometry/resampler adjustments |
| Comparison | Local actual-size guides/overlay plus actual game-renderer day/night views at four dimensions; both clocks frozen, deterministic state/seed | Joel judges appearance later; showroom cannot record approval or change the game |
| Binary delivery | Real transparent current-canon PNG fixture; base64 Git blob transport and hash round-trip; isolated processing/publication/packaging and actual loader decode | Image-tool-generated artwork and creative approval chain remain unexecuted |
| Loading/offline | Preserve production loader/update policy; constrain provisional decoded budgets; extend browser fixture to actual Canvas load and offline phone/subpath/query cache with retained crowns | Phone measurements, possible lazy loading/atlas decisions and approved production sprites |
| CI/release | 37 suites, pinned formatting/tool dependencies, development showroom browser gate, existing production Chromium/WebKit and exact live commit smoke | Issue stays open until later pilot/integration is actually complete |

## Preservation and inventory

`evidence/SPRITE_PREPARATION_EQUIVALENCE.json` records SHA-256 checks for 22 byte-identical files: every hand-authored campaign JS module, the accepted shared/desktop/phone CSS and production sprite manifest. Build-info/cache version change only to v0.8.85. No engine, data, rules, save, input, renderer, art, audio, map, API or browser storage implementation changes. No production file or new gameplay feature is introduced. Public inventory stays 30 campaign plus 14 optional historical assets; it excludes tooling, originals, node_modules, fixtures and scratch comparisons.

The binary fixture is the current procedural Paladin rendered on a transparent 192×192 test canvas, not proposed artwork. Its source/pixel equivalence is checked directly. It is committed under tests and omitted from deployment. The pipeline and browser harness create candidate/approval/image fixtures only in disposable isolated checkouts and retain the real production manifest byte-for-byte even when assertions fail. The build fixture packages the real PNG byte-for-byte and checks development directory exclusion.

Existing event/audio, v4/legacy/mode/Succession, balance, collision, navigation, controls/HUD, sprite variant/fallback and service-worker failure/activation contracts stay in the full suite. Current art workflow gains traceable metadata and approval-controlled manifest agreement, without treating passing tests as art approval.

## Skeptical review findings

| Finding | Correction and evidence |
| --- | --- |
| Native context scenes originally froze renderer time while terrain/atmosphere still read global performance time | Load current Visuals in a sandbox with a fixed performance clock as well; successive full-scene hashes now match for each prepared key. No production time code changes. |
| Sharp restricts package.json subpath exports | Read the library's public versions.sharp value; processing records and PNG/WebP fixture tests pass. |
| A second preparation could leave a partial candidate beside an immutable source | Preflight and write in a private staging directory, then atomically rename. Duplicate PNG preparation rejects without additional files; PNG and WebP have separate immutable directories. |
| Publication could leave binaries/metadata split on a write failure | Preflight sources/paths/budget; retain old owners and restore them plus new binary files on failure. An injected manifest write failure leaves a clean empty fixture registry and passes check afterward. |
| Unique-path budget could undercount the current loader's key-level image instances | Count decoded bytes per key while reporting unique paths separately. A duplicate-reference fixture reports one image/two instances and rejects at the reduced budget. |
| Fixture tests initially assumed production must always remain empty | Compare registry counts to current manifest and reset only isolated fixture owners. Tests remain valid after future approved registrations. |
| Browser fixture scratch cleanup could collide with a developer's candidate | Prepare/serve in an isolated temporary checkout; no real scratch candidates or production images are deleted. |
| Browser automation used a text-fill API on a range slider | Drive the actual slider with focus and End, then assert its value; keep this in the final exact-head browser gate. |
| Small-phone comparison controls could exceed available width | Allow wrapped labels and bounded selects; verify scroll width at all four browser sizes without relaxing viewport checks. |
| Post-merge exact CSS comparison caught a rounded-border paint difference while the frame loop still refreshed the HUD | Test-only repair pauses the entire animation loop, drains its pending callback/font work, and settles CSS replacement before capture. Exact pixel equality remains; a deliberately square button must fail equality. Production CSS/JS stay byte-identical. The failed run 37733620843 held deployment; corrective exact-head and post-merge outcomes belong in the delivery addendum. |

The self-review checks exact keys, canonical/source/output hashes, transparent margins, candidate immutability, path containment, publication rollback, explicit approval records, failed input, scene determinism, browser package boundaries and unchanged runtime files. No knowingly failed gate is waived. If the new CI evidence exposes a finding, repair it before merge and update the PR's delivery record.

## Commands and limits

- `npm ci`, baseline `npm run format:check`, `npm run check`, `npm test`: passed (36 suites).
- `npm run build`, `npm run format:check`, `npm run check`, `npm test`: passed locally (37 suites); focused `node tests/sprite-pipeline.test.cjs` passes after corrections.
- `node scripts/build.cjs --check --site`: passed; generated outputs current and tool/fixture/source directories excluded.
- Direct original/current SHA comparison: 22 files byte-identical; saved in evidence JSON.
- `npm audit --omit=optional --audit-level=high`: no vulnerabilities reported for inspected dependencies. This is a bounded advisory scan, not a security certification.
- `node tests/prototype-browser.test.cjs`, `node tests/phone-webkit-browser.test.cjs`, `node tests/sprite-showroom-browser.test.cjs`: required through CI on the final head and merged release.

Native scene capture is real game renderer code, without shell HUD/input controls; the existing full browser matrix covers those controls. Budgets are provisional, not physical-device measurements. Technical validation cannot detect every artistic mismatch, baked effect or incorrect identity; the engineer compares those aspects and Joel retains final appearance authority. GitHub record links document an actual approval decision, not a cryptographic authentication system. The original generated-image-tool chain and three-asset appearance pilot are deferred, so this report does not claim Issue 111 is complete.

## Recovery

Inspect branch/PR, check exact CI head and current main before merge, then verify post-merge tests, Pages, build.txt and live build version. Keep Issue 111 open. The delivery addendum will establish the released known-good SHA. If interrupted, resume from `SPRITE_PREPARATION_PROGRESS.md`; preserve newer work and all player storage. For a regression, make a focused corrective PR or revert only this change through normal gates, never force-push main or clear saves.
