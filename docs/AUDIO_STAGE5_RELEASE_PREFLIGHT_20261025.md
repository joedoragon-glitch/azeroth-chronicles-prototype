# Azeroth Chronicles — Audio Stage 5 Release Preflight

**Current disposition — 27 October 2026:** first-gesture audio recovery [#470](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/470), ranged-pet audio impact routing [#472](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/472), and audio preparation [#473](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/473) **merged**. This 25 October Stage 5 **standalone pre-integration** report was release-blocked **at its checkpoint**. Its draft and no-merge instructions are not present status; nor does integration independently certify physical speakers/headphones, installed/offline PWA listening, or measured audio performance. Check current source and [Development state](DEVELOPMENT_STATE.md) for any new work.

**Checkpoint:** 2026-10-25. **Branch:** audit/audio-stage5-release-preflight-20261025, independent of all prior audio PRs and based on main e3c78266b28f3325d2afdcb76ae849fcff306deb. Re-fetch all live heads before further work.

**Historical 25 October preflight disposition: RELEASE BLOCKED for this independent candidate.** This is Stage 5 preparation, not an integrated candidate, merge approval, browser certification or deployment. Keep the canonical multi-file GitHub Pages/PWA architecture. No production runtime, audio assets, gameplay, existing PR branch, save format, build version, published cache, mixer, or graphics preferences have been changed by this preflight.

## 1. Prior stages and exact-head evidence

- Stage 1: PR #468 (draft) supplies opt-in audio source-observation and registration checks, not speaker sound. It does not modify production gameplay. 
- Stage 2: PR #470 (draft) supplies first-gesture audio unlock and bounded recorded music/ambience retries. Its independently validated playback changes are not on this Stage 5 main-based checkout.
- Stage 3: PR #472 (draft) exercises actual hero/companion/boss audio dispatch and fixes previously missing ranged pet impact foley for crypt, archive, abyss and citadel. Its focused acceptance passed at head 632d67e, but the historical standalone enemy-audio reinforcement/telegraph regression remains unresolved.
- Stage 4: PR #473 (draft) adds mixer/source tests, cross-PR risk ledger, a standalone audio-audition entry dependency fix, and desktop/phone-sized Chromium WAV/one-MP3 smoke. Latest previously verified head 5126ff5 passed https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40232070797 and focused build https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40232070818, with publishing skipped. That is real codec/AudioContext browser evidence, not physical device listening, a full offline PWA test or a combined release certificate.

Sources are versioned in the above individual draft PRs. Do not treat their distinct passing CI runs as proof of one successful combined game.

## 2. Source contract verified on current main

The canonical packaging list is scripts/site-assets.cjs, consumed by scripts/build.cjs for generated HTML entries, the service worker, site packages and offline inventory. It includes the multi-file game script graph, the optional tools/audio diagnostic, and registered audio assets. Never replace this with a single-HTML artifact or a second manually maintained asset list.

The authoritative assets/audio/manifest.json registers 83 music, 14 ambience and 30 effect recordings. scripts/audio-assets.cjs validates all paths, local file identity, SHA-256 checksums, codec signatures, duration, loops, author/license provenance and an 8 MiB per-file / 32 MiB unique-total budget. These numbers establish packaging constraints, not audible loudness.

scripts/build.cjs regenerates src/prototype/audio-library.js and sw.js, verifies core entry script order, and stamps each deployable _site worker with the full commit identity from the checkout. The stored game worker is not modified by packaging. manifest.webmanifest uses scope/id "./", start_url "./phone.html" and standalone display. The worker preserves an older playable cache on failed install; a successful update waits for player acceptance before skipWaiting.

Relevant existing test owners:
- tests/audio-assets.test.cjs: registered-only packaging, bad hashes/escaping paths rejected, WAV fixture offline cache and previous-build preservation.
- tests/service-worker.test.cjs: complete cache and audio reuse/update/rollback, subpath routing.
- tests/pwa-release-id.test.cjs: fail-closed commit-stamped cache identity without mutating tracked worker.
- tests/audio-audition-browser.test.cjs: broad browser diagnostic, installed service worker and offline replay. A prior Stage 4 run exposed a missing browser bootstrap dependency in the historical diagnostic shell. PR #473 fixes that shell but only the narrower Stage 4 browser smoke was certified there. This unchanged full test must be run on a reconciled candidate, not silently called green now.

## 3. Newly submitted Stage 5 inventory preflight

tests/audio-stage5-release-preflight.test.cjs checks that the core inventory includes all published audio files, that script ordering matches canonical game entries, all 127 recordings have expected identities, PWA install/start/update markers remain present, and the optional audio diagnostic references the campaign script dependencies it needs. It reports known diagnostic tag omissions on the main baseline (fixed in unmerged Stage 4) as an explicit integration dependency, not a deceptive success.

**A passing Stage 5 inventory preflight is not release acceptance.** Its output always states RELEASE GATE = BLOCKED because upstream PR integration, physical devices, actual installed/offline PWA and owner approval remain incomplete. Run the exact-head focused CI on this branch before describing source packaging as green. No player runtime, audio mix, manifest or game save changes are present.

## 4. Unmerged-work contradiction register

The Stage 4 audit covered all 15 previously open PRs. Risk increases materially when gameplay/event sources are combined:
- #440 versus #464: dormant Critical Executions uses the fifth petSkillContact argument for a critical receipt; real projectile visuals in #464 reserve the fifth for the receipt and sixth for launchPoint. Their combined call sites have not been certified. Preserve criticals OFF by default, one decision per release, physically timed contact and no new critical audio.
- #464 versus #472: delayed Archer/Ranger/pet flight changes the real release/impact event stream. The Stage 3 audio test must be rerun on a combined source checkout; distinguish original planned burst count from releasedCount and avoid duplicate launch sounds for heroProjectileFlight.
- #470 versus #471: app.js first-gesture startup versus developer-only VFX recorder, event draining and frame-skip handling. Preserve exactly-once audio.effect dispatch independent of display skips and developer diagnostics.
- #469 versus #471/#464: renderer/pause/Pixi/Crown loot owners overlap; audio must follow combat events, not rendered frame counts. Keep the experimental GPU option, fallback and pause/resume behavior.
- #458 versus #440: true roaming bosses and critical enemy releases may change score-scene engagement timing; verify Normal/TRUE music transitions after integration.
- #445/#447/#456/#449/#465/#401: tooling, tests, documentation, governance and design. No direct Stage 5 audio source overlap at last check, but authority and build integration must be reviewed rather than reviving obsolete historical rules.

Do not merge or copy whole files to resolve these collisions. Freeze exact heads and perform a staged, separately authorized source reconciliation, retaining the behavior of each feature. No temporary combined branch is created by this PR.

## 5. Release gate matrix

| Gate | Status | Required final evidence |
|---|---|---|
| PWA multi-file audio inventory | Source-level preflight submitted | Exact current-head CI then rerun on combined candidate |
| Stage 2 first gesture and finite retry | Passed on isolated #470 | Integrated startup and simulated/offline failure browser tests |
| Stage 3 sound routes and pet impact | Passed on isolated #472 | Integrated actual action matrix after #464/#440 |
| Stage 4 balance and codec decode | Passed on isolated #473 | Combined menu/combat/boss/phone/optimization tests |
| Full PWA offline/update/reload | NOT certified on combined candidate | Service worker, installed PWA, cold/warm recording and v4 save tests |
| Physical speaker/headphone listening | NOT verified | Desktop, Chromebook, phone and headphones in calm and crowded scenes |
| CPU/voice cap/frame pacing | NOT measured for combined candidate | Device and focused simulator results, skipped-frame-aware interpretation |
| Historical enemy-audio suite | Separately unresolved | Investigate original assertion and document independent baseline |
| Release/merge/deployment | NOT authorized | User approval after all current-head evidence |

Stage 5 should also verify all 11 Normal/TRUE boss music presentations, night/settlement/peace transitions, explicit mute/sliders, foreground warning intelligibility, Pause/Resume and Optimization Off/Auto/On, plus real-world volume comfort. Do not globally increase gains or reduce existing priority/throttle budgets to force simulated audibility.

## 6. Next steps

First validate this independent preflight branch with focused Node tests and reproducible build. Do not run full browser/device matrices. Preserve all draft PRs. When authorized to integrate, snapshot current PR/main SHAs, reconcile overlapping owner functions, rerun each audio stage's targeted tests plus adjacent gameplay/renderer checks, then move to installed-PWA/cross-engine/device acceptance. The complete historical audition offline suite must be rerun on the actual final source, not only its narrower Stage 4 replacement.

**Only an explicit future release order may authorize merging to main or deploying the PWA.** Published SHA/build.txt/worker cache validation applies after that order, not now.

### Focused commands on this independent Stage 5 branch

node tests/audio-stage5-release-preflight.test.cjs
node tests/audio-assets.test.cjs
node tests/service-worker.test.cjs
node tests/pwa-release-id.test.cjs
node scripts/build.cjs --check

This document is self-contained on GitHub. Future conversations need no older local files or single-HTML export.
