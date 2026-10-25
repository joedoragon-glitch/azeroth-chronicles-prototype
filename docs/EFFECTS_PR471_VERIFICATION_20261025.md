# PR #471 — technical evidence and deferred work register

**One supporting technical document** for the [review handoff](EFFECTS_STAGE5_GITHUB_HANDOFF_20261025.md), as of 25 October 2026. Snapshot history, not a queue of new tasks. The original 13 other overlapping Stage 2–5.6 essays and cross-PR status snapshots are retained in [GitHub's immutable pre-housekeeping commit](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/tree/07530ef5355aa82769b511778a62cb0e116885c0/docs), **not** repeated here.

## Source owners and invariants

| Source | Candidate change | Must remain unchanged |
| --- | --- | --- |
| `src/prototype/app.js` | Developer-only diagnostics UI, optional report field, gated frame/skip observations | Gameplay defaults; live diagnostics off in normal mode; existing FPS and optimization controller |
| `src/prototype/renderer.js` | Bounded diagnostics, single first-paint grace, draw-local warning geometry and painter receipts | Existing Canvas/Pixi overlay, draw eligibility, no timer/frame forcing, no save mutation |
| `src/prototype/combat-visuals.js` | Optional draw-local warning patch map, at most two protected transient admissions during overload | Warning hitboxes/colors/safe gaps, ordinary ordering and **40 transient slots** |
| `src/prototype/hero-presentation.js` | Priority status glyphs/selection and fewer optional Mage finisher sparks when optimized | **3 positions × 24 eligible actors**, class identity, actual combat outcomes |
| `src/prototype/enemy-vfx-art.js` | Optional developer painter observation | Enemy VFX ownership, pet impacts, real projectiles |

The warning cache is intentionally **per render call**, not per combat tick; both fill and outline remain painted. The temporary hit/receipt object is not a projectile. First-paint grace max **+0.12 simulated seconds**, never more draw callbacks. Normal-player recorder remains absent. Current user settings (Optimization Off/Auto/On, default Auto 20–30 FPS, frame skip, adaptive resolution, emergency recovery and reduced motion) are existing systems, not changed by this PR.

## Why each change was considered

- Natural casts and simulated withheld draw slots showed short hero feedback could expire before any eligible paint. Selected first-paint grace changes the one-shot presentation opportunity, **not the game action**.
- Multiple status effects previously hid Silence/Taunt/Slow and later selected/important actors due to list order. Status priority and +N reuse the old budget.
- Real warning fill and outline calculated identical authored world attack polygons twice. Per-draw reuse preserves byte-identical native Canvas pixels for natural cone/canister/ring warnings; the Dark Lord's actual low-HP protected-side sector is included. This is **not** a measured hardware speedup.
- When >40 transients were deliberately injected, priority-5 effects could evict visible priority-4 hero/heal feedback. The overflow-only exception reserves at most **one newest meaningful hero cue and one player/ally recovery**, leaving all others under stable ordinary eviction. **15 deliberately silent normal hero casts** are not given fake flashes. Stage 5.6 corrected an omission for real visible Paladin normal Skills 3/4.
- The Mage combo finisher keeps its combat arc/identity while existing optimized/reduced-motion paths suppress some secondary ornament. Only a narrow authored case was changed.

## Existing focused tests (retain, don't keep expanding)

The 20 dedicated `tests/effect-*.test.cjs` files cover the original developer recorder, natural producers, Canvas acceptance and later targeted regressions. Important checks include:

- `tests/effect-diagnostics.test.cjs`, `tests/effect-diagnostics-stage3.test.cjs`, `tests/effect-diagnostics-stage3-party.test.cjs`, `tests/effect-diagnostics-stage4.test.cjs`, `tests/effect-diagnostics-stage5-shell.test.cjs`, `tests/effect-diagnostics-stage5-browser.test.cjs`: recorder scope/export, real producer receipts, expiry, first paint and browser emulation.
- `tests/effect-quality-protected-cues.test.cjs`, `tests/effect-quality-hero-variants.test.cjs`, `tests/effect-quality-identity-contract.test.cjs`, `tests/effect-quality-mage-finisher-ornament.test.cjs`: preserved identities, 48 naturally admitted hero casts, staged Mage ornament; **not installed graphics tiers**.
- `tests/effect-queue-hero-recovery-reservation.test.cjs`, `tests/effect-queue-visible-hero-coverage.test.cjs`: source-backed cast/heal plus synthetic 40-slot queue pressure; 48 casts and two separate Normal-mode Paladin 3/4 rechecks. **33 originally visible forms + 2 repeat checks, 15 intentionally blank**.
- `tests/effect-warning-budget-audit.test.cjs`, `tests/effect-warning-frame-reuse.test.cjs`, `tests/effect-warning-reuse-family-matrix.test.cjs`, `tests/effect-warning-protected-side-frame-reuse.test.cjs`, `tests/effect-warning-concurrent-bosses.test.cjs`, `tests/effect-warning-ledger-cast.test.cjs`, `tests/effect-warning-anonymous-cast.test.cjs`, `tests/effect-warning-crowd-fps.test.cjs`: 11 first-boss warning families, special intentional-warning omissions, three bosses together, same Canvas pixels after movement, 20/30/60 simulated cadence and normal-mode purity.

**Authoritative pre-housekeeping CI:** [run #40238780331](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40238780331) at `07530ef5355aa82769b511778a62cb0e116885c0` — 46 selected focused test files PASS; reproducible build/syntax PASS; publishing SKIPPED. A later docs-only cleanup commit must pass its own CI. Full-game, physical device, WebKit and composed Pixi acceptance were **not** run here.

## Deferred, separate scopes — do not reopen #471

- **Graphics Ultra/Balanced/Performance** are proposals, not a built settings menu. If warranted by real hardware readings, design a *separate* performance/graphics PR that integrates with existing Off/Auto/On rather than replacing it. Prior design sketches are available in the archived source commit under `EFFECT_GRAPHICS_TIERS_FPS_RECONCILIATION_20261025.md` and `EFFECT_QUALITY_PROTECTED_PRESENTATION_CONTRACT_20261025.md`.
- **Other unmerged drafts:** #464 real Ranger/Archer/pet release and impact, #469 Canvas/Pixi parity, #470/#472 audio startup/sounds, #440 dormant Critical Executions, #458 TRUE boss movement, #476 HUD. Their integration and timing contracts belong to their own release candidates. **Do not rebase, cherry-pick, merge or resolve their conflicts inside this effects PR.**
- Earlier **read-only** cross-PR matrix found individually clean selected-native pairs with #464, #469, #470, #440, #472 and #458. The **cumulative** combination stopped at #440 after a clean #464/#469/#470 prefix. This is a **future multi-PR integration concern**, not a #471 effects regression, and a green workflow result never meant the cumulative candidate was clean. Snapshot logs are preserved in Git history and GitHub Actions.
- Device test: inspect warning/skill visibility and crowded frames on actual phone and Chromebook; compare meaningful scene workloads, not just synthetic burst tests. **Never claim FPS gain without measurement.** No new test matrix is mandated until a reproducible defect or authorized release check exists.

## Verification limits and review decision

**This PR is development-complete pending release acceptance**, not certified as live. Unit/Canvas/Chromium emulation can't establish actual FPS, client cache refresh, thermal stability, human readability, or the safety of combining independently authored drafts. Merge to `main` triggers automatic Pages deployment through `.github/workflows/focused-deploy.yml`; physical-device acceptance (or explicit acceptance of that risk) and a release decision must therefore precede merge. Close only if superseded, not as a substitute for delivering the already-implemented candidate.

**No further work plan is inherited from this document.** Preserve the current tests as regression protection; open a narrowly scoped new issue/PR only upon demonstrated future need.
