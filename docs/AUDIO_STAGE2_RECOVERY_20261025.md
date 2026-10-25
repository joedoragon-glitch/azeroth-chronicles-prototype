# Stage 2 — recorded score/environment recovery and startup gesture

**Date:** 2026-10-25  
**Base:** `main` at `e3c78266b28f3325d2afdcb76ae849fcff306deb`.  
**Scope:** Stage 2 only; separate from draft Stage 1 PR #468. No asset, save, score-composition, effects, UI stylesheet, PWA, workflow or version changes. Do not merge or deploy without explicit authorization.

## Confirmed causes

1. `audio-production.js` cached `productionKey` before asynchronously loading stems. Failure returned `false` and stopped the recorded group, but the unchanged key stopped same-scene `setRecordedScore` retry attempts indefinitely.
2. `audio-environment.js` similarly held `environmentKey` after a load failure. Its pending promise did not retry while the same scene was selected. The procedural ambient fallback remained available.
3. A resumed save may open with no activated `AudioContext` until a user interaction. Browser autoplay protection prevents unprompted audio on initial load. The game must unlock on the first eligible interaction, independently of hero movement or attacking, and existing menu clicks continue to do so.

## Narrow corrections

**Music:** exactly three attempts at the selected score, initial immediate then at audio-clock time +1s and +4s after failures. Maintain synchronized stems, existing quantization/crossfades, procedural fallback, settings and 64-voice policy. The retry budget resets on **different soundtrack selection** and on new production lifecycle. No automatic persistent-failure network hot loop. Success stops retries.

**Environment:** same finite schedule, triggered through existing scene updates. A retry does not repeat the outgoing-bed fade; a genuine new scene still fades out its previous bed before the next loads. Failures preserve the existing procedural fallback. Scene changes, no-cue, disposal, epoch changes and optimization exits invalidate stale loads.

**Start:** `app.js` unlocks audio in the capture phase of the first qualifying pointer-down or key-down event (ignoring keyboard auto-repeat), so the soundtrack can activate before gameplay processes hero input. Existing action/menu unlock calls remain, especially for browser engines requiring a click. This does **not** bypass browser autoplay requirements, enable sound while muted, or introduce automatic audio without user activation; opening a saved game with no interaction can still be silent due to browser policy.

## Tests and limitations

- `node tests/audio-stage2-recovery.test.cjs`: real diagnostic PCM fixture decode and simulated transient/persistent failures; verify score and environment retry success, fixed backoff, exhaustion, no restart on healthy score, selection-change reset, synchronized 2-stem start and cancelled stale environment requests.
- Existing relevant checks: `audio-production`, `audio-environment`, `audio-recordings`, `audio-catalog`, `audio-scheduler`, `app`, and, at release acceptance, both `audio-browser` and `audio-audition-browser` desktop/phone tests.
- The new test uses a fake AudioContext, not an actual hardware speaker. Full browser startup interaction coverage and genuine physical device listening remain subject to Stage 5.

## Scope boundary and sequence

PR #468 (Stage 1 observer) is **still separate and unmerged**. Stage 2 does not require any runtime dependency on it. If Stage 1 merges later, reconcile both PR diffs against the latest `main` before merging Stage 2. Do not implement Stage 3 combat or Stage 4 mixing while validating these changes.

Accept Stage 2 only with a green exact-head focused validation and dedicated recovery test, and reviewer-approved real game-start smoke. No automatic merge or Pages deployment.
