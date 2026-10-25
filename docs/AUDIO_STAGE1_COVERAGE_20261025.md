# Audio Stage 1 — development-only observability and coverage

**Started:** October 25, 2026  
**Base:** `main` at `e3c78266b28f3325d2afdcb76ae849fcff306deb`  
**Scope:** Stage 1 only, separate review-only draft. No runtime audio changes, no sound-master edits, no save/PWA/CI/workflow changes, no merge or deployment.

## What this stage establishes

`tools/audio/coverage-probe.js` is an **opt-in read-only observer**, not included in the game's normal script inventory. Its only changes are wrappers on the one audio instance deliberately attached by the developer; `detach()` removes those wrappers. It records bounded recent events in memory (default 400, maximum 2,000), without persistent storage, network requests, save writes or console spam.

At the moment an audio event occurs it can distinguish: a requested and created recorded voice, a synthesized source attempt, a no-recording binding, a nonmatching conditional binding, a cold/unavailable recorded event, muted/paused/locked context, optimization-affected ambience, and a throttled event. It also logs music score requests and their asynchronous success/failure, changes to the selected environmental bed, and Optimization Mode transitions.

`snapshot(scene)` reports the selected music ID and requested stems, currently registered recorded stem IDs and source target gains, intended and active environmental bed, procedural transport/fallback indicators, bus gain policy, mute/pause/context/optimization flags, selection keys, asset load counts and recorded/environment errors. `report()` returns the bounded event ring and counters. **A recorded voice being scheduled or selected is not proof of heard audio**; rendering, external volume, speaker output and hardware routing remain distinct.

The probe is intentionally not exposed as a player menu, and should not be enabled for benchmark measurements because method wrapping and event capture have some overhead. Never leave it attached during performance comparisons.

## Deterministic routing check

Run only when appropriate for Stage 1:

```sh
node tests/audio-stage1-coverage.test.cjs
node tests/audio-stage1-coverage.test.cjs --json
```

The new test uses the actual current `PrototypeAudio` production cue selector and recording event matcher, with the repository's existing fake Web Audio context. Its generated test scenes cover each of the 19 place entries (normal and peaceful), regional night and settlement variants, all eleven normal/TRUE boss pairs, and title/defeat/finale. It verifies that **83 unique music IDs and 14 ambience beds are reachable in these synthetic selection scenarios**, and verifies that **all 30 recorded WAV IDs can be selected and dispatched against a mock warmed cache**. It also checks procedural attempts, non-recorded event categories, throttle, mute, Optimization Mode and cold-unavailable labeling, and fake success/failure observation.

The test does **not** play/decode actual MP3/WAV bytes, validate all real-game boss/skill trigger conditions, perform a physical playback/listening test or guarantee that users will hear every cue. It does not modify game state or network/cache code. It should complement—not replace—`audio-production`, `audio-catalog`, `audio-recordings`, `audio-browser`, `audio-audition-browser`, and `enemy-audio` tests.

## Optional observation of real gameplay (developer console only)

After opening the game online in a developer browser, paste:

```js
const script = document.createElement('script');
script.src = './tools/audio/coverage-probe.js';
document.head.append(script);
script.onload = () => {
  window.audioProbe = AudioCoverageProbe.attach(Prototype.audio);
  console.log('Audio observer attached; play representative scenes before inspecting report.');
};
```

Then inspect the current selection with `audioProbe.snapshot()` and collect recent receipts with `audioProbe.report()`. On completion call `audioProbe.detach(); delete window.audioProbe;`. This dev-tool file is not precached for offline PWA use, and no automatic production injection occurs. The observer has not been certified as a substitute for a real-device listening exercise.

## Evidence and handoff

- Existing pre-Stage-1 audio inventory: 83 music, 14 ambience, 30 effects, 95 event categories (8 with WAV bindings), no manifest-orphaned asset found.
- Source-level retry concerns remain **AUD-01/AUD-02**, explicitly reserved for Stage 2. Stage 1 does not change any retry/error behavior.
- Cold-then-procedural behavior **AUD-03** remains intentional, awaiting Stage 3's real action matrix.
- Optimization/mix behavior **AUD-05/AUD-06** remains unchanged, awaiting Stage 4 measurement.
- Stage 5 still owns exact browser/device/offline release certification.

Before claiming Stage 1 complete: run the focused Node test against the PR head, verify the diff contains only this diagnostic, test and documentation, and record the exact observed results. A passed synthetic routing test is not an 83-track audible certification. Keep the PR a draft until authorized review; **do not merge or deploy**.
