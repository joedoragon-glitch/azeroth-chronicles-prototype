# Automatic Optimization and Non-Optional Emergency Safety — draft review

Date: 25 October 2026. Integrates `main` at `7d964915` (released dev.178) while preserving hero Skill 1, FIFO skill queues and asymmetric cooldowns. Candidate `0.9.1+snapshot.dev.179`. Draft only; no merge, deployment or hardware FPS claim.

## Owner decisions

1. Critical safety takes priority over optional rendering preferences. Turning **Adaptive frame skip Off** now suppresses ordinary adaptive omissions, **not** critical-gap detection, emergency simulation protection, bounded emergency drawing skips, real-draw recovery probes, companion withdrawal, safe-return escalation or restart protection.
2. **Optimization Mode becomes Off / Auto / On**, with **Auto** as the new default. The next update deliberately migrates existing device choices (even earlier saved Off/On) to Auto **once**; subsequent player selections persist. This touches no v4 campaign save or unrelated preference.
3. Ordinary manual **Off** remains meaningful outside emergencies; emergency conditions can temporarily enable simplified graphics even then. Manual **On** remains enabled. Do not silently alter gameplay, disable warning geometry, or change the player's stored choice during a temporary safety override.

## Existing components reused

- `src/prototype/runtime.js`: existing drawing workload, Auto 20–30 and 30–60 FPS targeting, adaptive frame skipping, and adaptive resolution remain independent. A small `createAutoOptimization()` observes active callback interval/work and actual adaptive omissions to request presentation-only mode changes.
- `src/prototype/app.js`: the same transition steps already used by the manual Optimization toggle (materials, environmental audio, renderer, resize, measurement reset) are reused for automatic decisions. Canvas and optional Pixi receive the same effective optimization status.
- Critical recovery remains nonlethal, preserves HP and v4 saves, and uses the established encounter/companion/restart paths. Only extreme lag activates the emergency override. It does not promise protection against a totally frozen JavaScript engine.

## Initial controller thresholds (subject to device acceptance)

- **Immediate** optimization escalation on an actual critical recovery episode.
- Otherwise, require at least four seconds of active observation showing repeated severe callback delay (80+ ms), high callback work relative to the render target, or meaningful adaptive skipped-draw pressure.
- Keep lighter presentation during the emergency and until at least 60 seconds after activation **and** 60 seconds of steady healthy active observations; hysteresis protects against visual/audio thrashing.
- Ignore pause/hidden/modal callback gaps. An intentional manual 20 FPS **render cap** does not by itself count as callback lag; adaptive skipped drawings are explicit pressure evidence rather than fake free headroom.

These are conservative source-level starting conditions, **not** measured optimal thresholds or hardware-certified FPS improvement.

## Focused checks and remaining acceptance

- Targeted source/runtime tests: Off emergency override; three healthy drawn probes; unchanged ordinary Off and manual FPS settings; preserved no-damage simulation hold; noncritical Off; sustained Auto engagement; healthy visual recovery; update migration once in English and Spanish; stored user overrides after migration; menu selector and browser preference regression.
- Before release, run selected Node/shell and narrow Canvas/Pixi browser checks, PWA packaging/syntax checks, and source-focused verification. Do not launch the full-game or broad browser matrices without the owner's separate approval.
- Physical acceptance remains open for Chromebook/AMD A12 and iPhone: crowded combat, 1–3 FPS stalls, 20 FPS targets, 100/150/175% camera, retained warnings/audio, screen transitions, restart recovery, and actual displayed FPS/P95/P99. Optimization can lower drawing cost but cannot repair arbitrary CPU, GPU, memory or browser failure.
- Release requires coherent package/build/service-worker revision, exact-head focused success, and explicit owner authorization before merge/publish. The multi-file PWA is unchanged.
