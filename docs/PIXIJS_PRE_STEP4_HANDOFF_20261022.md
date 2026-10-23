# PixiJS integration — pre-Step-4 engineering checkpoint (22 October 2026)

**Branch-only preparation. Not a completed browser certification, PR, merge, or deployment.**

Owner selected minimal involvement: complete technical fixes and available checks, but keep the five-step workflow separate. Work remains on `implementation/pixijs-playtest-step2-20261022`, based on main SHA `869049797d5e29270886871c89068f648c1f2a6c`. No gameplay, AI, balance, input or save-schema changes are authorized.

## Practical changes

1. Experimental PixiJS loader now references `./assets/vendor/pixi-8.22.0.min.js` instead of contacting jsDelivr from the player's game.
2. `scripts/vendor-pixi.cjs` prepares this pinned UMD distribution **at build time** from the official versioned jsDelivr path if not already present, validates expected size/version, JavaScript parsing and outputs its SHA-256. Existing files are validated, not downloaded again. `scripts/build.cjs` invokes this preparatory step in both build and source-check runs. The PWA core inventory and generated service worker include the local asset so a successfully built, installed game can cache it for offline use. This environment has no DNS access to retrieve the actual 841 KB library. **The offline dependency path is prepared but NOT independently verified** until a network-capable build fetches and tests it. A final release should record/lock the fetched checksum.
3. Canvas still initializes first. Once the user chooses Keep during the 15-second WebGL trial, a future launch may restore that previously confirmed preference; a crash/interruption marker is installed before GPU work and removed only after first GPU render. Failed startup reverts the persistent choice to Canvas. Startup never creates a second Campaign.
4. Canvas fallbacks now dispose GPU textures/resources after exposing the working Canvas, including context loss and resize. This avoids retaining a failed GPU scene indefinitely. Renderer switch handling remains device-local and does not enter game saves.
5. Renderer events are forwarded to Pixi through a wrapper around the existing renderer.queue, **outside** the authoritative `frame(now)` body. The simulation and event-consumption frame loop is not further edited.
6. Candidate packaging version advanced from source dev.167 to `0.9.1+snapshot.dev.168` in package.json, package-lock.json, generated build-info and PWA cache metadata. **Unpublished candidate**, not the public game.

## Checks actually performed

- Static JavaScript syntax checks on modified JS and generated files via V8 parsing: passed.
- Existing graphics guard (17 cases) plus three restored-startup tests executed in a V8 harness implementing Node assertion/test functions: **20/20 passed** (not the real Node test-runner environment).
- Branch-generated HTML/template script order matches game inventory, and the candidate PWA manifest includes the local pinned PixiJS asset. Package/lock/build-info/cache candidate versions match.
- The exact generated service worker could **not** be byte-for-byte certified in the limited connector harness because it lacked the project's dynamically computed material/audio file inventory. No claim of complete `npm run check`.
- Main HEAD rechecked before checkpoint. No other PR or branch touched.

## Release blockers carried into Step 4

- This environment cannot clone the GitHub repo or resolve CDN/npm hosts, so there is **no actual PixiJS bundle** in the source branch yet, and **no** complete Node build, npm format check, npm test, Chromium/WebKit, GPU hardware, installed PWA, or offline smoke run. In CI or a normal online checkout: run the existing documented commands, observe the exact vendored SHA-256, and verify all assets and generated files. Do not mark any missing test as passed.
- Original visual omissions remain: some procedural body animations, world labels/occlusion, lamps/fixtures, room lighting and other art not yet ported. Canvas combat overlays remain essential and intentionally paint on a second 2D layer. No full-frame FPS gain has been measured.
- The optional renderer is not approved for unrestricted production. Real browser smoke must confirm save persistence, gameplay motion, region/room changes, 15-second confirmation, confirmed restart, context-loss/resize fallback and readable native warnings.
- Formatter has not been run on the source; fix any Prettier changes and regressions before claiming a PR-ready build. No visual parity/benchmark expansion is requested.
- The vendor-fetch path requires online access **at packaging**, never at player runtime. An offline source checkout without the already generated vendor file cannot complete a clean build. Final release should commit or otherwise cryptographically lock a known official bundle so builds are reproducible.

## Disposition

Pre-Step-4 source preparation is checkpointed; **hold Step 4 until build/browser evidence is available**. Do not merge or deploy. The owner does not need to run diagnostics or provide a personal campaign export at this checkpoint. When a playable candidate has passed checks, their only requested involvement is a brief real Chromebook/phone playtest and explicit release decision.

## Step 4 follow-up audit — PR #407 (22 October 2026)

PR: https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/407 (draft, no merge/deployment).

The first CI iteration found a Canvas-only test-shell startup dependency: optional PixiJS classes were assumed globally available. The branch now supplies a no-op Canvas fallback if a source-only test harness omits optional modules. Actual confirmation must come from a new completed CI run.

On the original PR check, the **generated-asset/script syntax step passed** and downloaded PixiJS 8.22.0 with SHA-256 `06d9ef9823e743518793083c296d801e752db128cb1f519fbabe37e1259567ea`; the candidate vendor script now enforces this digest.

The source check failed in the sprite generator's isolated VM because `visuals.js` references `PrototypeHighlands`. Supplied this already-canonical dependency in `scripts/sprite-pipeline.cjs` without touching game rules.

A temporary PR-only formatter audit collected the exact Prettier patch. Applied its hunks to **only the touched PixiJS application/renderer/module and vendor script**. The report additionally showed formatting drift in main's untouched `engine.js`, `runtime.js`, `save.js` and `tools/sprites/approved.json`. Those files are not changed merely to make unrelated checks green; preserving source-protected historical art/gameplay receipts is more important than a cosmetic mass rewrite.

Added `tests/pixi-renderer-browser.test.cjs` to exercise Canvas default, optional GPU preparation, an unchanged Campaign identity, Keep WebGL2, reload safety and software-browser fallback. Existing Chromium and WebKit release workflows now invoke it as a **required** verification alongside, not instead of, their existing full checks. A browser without usable WebGL2 must keep Canvas. This test has not been executed yet and may expose additional issues.

Restored the temporary formatter-audit workflow back to its original PR #300 condition. Standard PR/full-CI gates remain unchanged except for the new PixiJS-specific browser check.

**Current release disposition:** No-Go until the complete *latest* PR CI passes or failures are explicitly reconciled against unchanged main, and real PixiJS mode/Canvas fallback has been shown to work on target browsers. No finished-GPU benchmark, visual parity certification, merge or deployment is claimed. Step 5 requires a new owner instruction.

### Additional focused packaging regression (review continuation)

The CI log revealed that two existing isolated packaging suites (`tests/asset-packaging.test.cjs` and `tests/audio-assets.test.cjs`) copy a minimal source fixture and omitted the newly registered `tools/webgl-pilot/` runtime helper directory. Their failure was `Missing published asset: tools/webgl-pilot/native-webgl2-core.js`, not a gameplay failure. Updated only those test checkouts to include the now-published directory; unchanged sprite/audio safety checks remain in force. No production sprites, audio, balance or saves were modified.

The broader historic game suites still show numerous independent failures on untouched engine/content paths; do not infer that they were introduced or repaired by PixiJS without comparing against a matching main baseline. Main branch has not changed in this checkpoint.

## Focused follow-up — browser and regression triage (22 October 2026)

- Exact PR-head run [39887815677](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/39887815677): targeted **WebKit PixiJS renderer-switch test passed** on desktop and phone, including live movement, 175% zoom, confirmed Keep/reload and simulated context-loss fallback. The broad WebKit certification **failed**, and broad Node/Chromium certification was **cancelled**, so there is **no** full release certificate or FPS claim.
- Node formatting reported only four unchanged historical inputs: engine.js, runtime.js, save.js and tools/sprites/approved.json. Do not rewrite protected mechanics or accepted art to manufacture a formatting pass.
- One new-feature regression was real: game-menu-ui.test.cjs expected five screen/performance choices; the experimental Graphics renderer makes six. The focused original test now verifies both Canvas and PixiJS options in English/Spanish without changing save state.
- An inherited catalog gap was confirmed by the CI asset-packaging test: the existing procedural Crown/Treasury families `crown-coin-vault` and `treasury-audit-counter` were absent from the canon sprite-coverage table. Added explicit PROCEDURAL classifications with **no art, palette, raster approval, gameplay or map change**. The source-audit classification was rechecked for all 193 decoration families after the correction; none remain unclassified in that segment.
- The source check still reports `Stale canonical reference; compare again before publication` during sprite approval provenance validation. This predates PixiJS and is not corrected by relaxing sprite provenance checks. Other older mechanical/fixture failures remain distinguishable from the renderer.
- New WebGL2 vendor remains SHA-256 pinned, and no runtime fetches PixiJS from the CDN. The PR stays **draft**, with no deployment.

**Next gate:** Run normal CI on the exact revised tree, verify the new menu/packaging corrections, and track remaining inherited failures explicitly. Do not equate the targeted WebKit success with complete regression certification.

## Further review checkpoint — exact failure identification and viewport safety

- Reviewed latest head `03d9c09f394bba49909d2a20d993a650654bbd0c` on draft PR #407 against unchanged main `869049797d5e29270886871c89068f648c1f2a6c`.
- Run [39889548577](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/39889548577) has no full release certificate: the aggregate WebKit check failed even though the **PixiJS-specific WebKit test passed** on both desktop and phone. Ordinary WebKit tests reported failures in phone, saves, archive, community, audio, VFX, sprites, performance and visuals. Its broad Node/Chromium job was cancelled; no all-green final tree exists.
- Main's most recent successful workflow was for the release path and does **not** establish that every currently failing historical suite was rerun on main. Treat existing failures as `not attributed to PixiJS` pending a like-for-like baseline, not automatically as harmless legacy noise.
- `scripts/sprite-pipeline.cjs` now reports **every** approval key that has drifted from current canonical art/catalog before continuing. It preserves the exact hash requirements and does not rewrite or accept stale approved sprite bytes. Use the next CI message to identify a bounded correction or explicitly defer the unrelated art authorization.
- Expanded the existing experimental browser smoke test: phone WebGL2 selection followed by a genuine viewport resize must restore Canvas; desktop maintains the simulated GL context-loss recovery check. Original hero motion, 175% zoom, Keep/reload and artwork readiness checks stay intact.
- The requested experimental integration remains partially layered: original Canvas renders critical combat cues; PixiJS handles its own selected GPU scene. No complete graphical parity, Chromebook speedup or production deployment has been established. **Do not merge PR #407 as Step 5 until gate results and missing evidence are reconciled.**

## New source-gate evidence — current PR run (22 October 2026, evening ET)

- Current branch candidate `31709199b59e48e0e2ecd31acce1417998add82b`, CI [39892484332](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/39892484332), completed **failure**: WebKit aggregate failed, Node/Chromium job cancelled; there is NO release certificate.
- The **targeted PixiJS WebKit browser test passed** again on desktop and phone, including real viewport resize fallback and 175% camera zoom. This is repeatable evidence for the experimental switch, not full graphical equivalence or hardware performance.
- Generated assets and syntax passed. The source check now identifies **exactly one** stale approved raster: `prop:ore-sorting-bay:highlands`.
- The current canon decision in `tools/sprites/current-design-decisions.json` explicitly selects the original **procedural** ore-sorting presentation, with the old approved raster retained as a reference/rollback source. `src/prototype/sprites.js` suppresses that raster through its existing `proceduralProps` policy. The art and original approved bytes are intentionally preserved; do not silently reapprove, restore, delete, rewrite or waive this provenance error. It needs separately authorized art-registry reconciliation before release certification.
- The standard formatter now reports the PixiJS-side vendor script plus four historical files: `engine.js`, `runtime.js`, `save.js`, `tools/sprites/approved.json`. Only vendor-script whitespace is corrected by the next checkpoint; the historical files are left unchanged pending a separately scoped, source-hash-aware formatter reconciliation.
- Other full-regression failures include older game/boss/audio fixtures unrelated to the new renderer files. They remain **unattributed** without equivalent baseline evidence and cannot be waived. No game balance, save schema, combat or PWA release gates are changed here.

**Status remains DRAFT / NO-GO FOR STEP 5.** No main update or deployment.
