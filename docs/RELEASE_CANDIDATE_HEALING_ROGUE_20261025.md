# Azeroth Chronicles — Held Release Candidate: Captain Healing + Rogue Retreat (25 October 2026)

**Status: DRAFT ONLY. No merge or deployment authorized.**

Exact main base: `968f3493a48e1bcaf17ce6f70f9790ff9b8ed8be`, current published development version v0.9.1+snapshot.dev.183. Selected PRs are [#454](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/454) at `30a85ca0e18c642a8da34a8d073b605f3f0baf74` and [#455](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/455) at `7f7239fbc311e5bec022e5d3f086f8d1880a612e`. This branch integrates only their **final diffs**, not historical commit chains. Original PRs remain open and untouched. Shared `engine.js` / `rules.js` patches were proved to commute byte-for-byte; the rules source SHA-256 in sprite evidence was regenerated for the combined file.

## Locked mechanics
- Captain-support regular ally missing-HP heal over 3 s / 7 s support eligibility; captain recipient 50% missing HP over 5 s at <=90% HP with independent 10 s leader eligibility per ranged source; captain self 5%-max scaled healing over 5 s / independent 10 s clock. Preserve idle-boss distinction, Silence, saves and encounter rules.
- Scornfang and Direjaw each retain three ranged Treasury guards after two added zero-reward posts; Dreadmaw remains five. Keep existing dead/old-save actors, Direjaw Elastic Rebound and Dreadmaw Grafting/brood mechanics unchanged.
- Rogue retreat seeks local groups, occupied distant posts, bounded emergency Ringleader support or finite physical escape. Optional defensive Rogue casts never reverse escape direction; both decision and casting minimum are 2 s. Keep existing Slow elite 2.95 s, four-stack party ceiling, warning/LOS, cooldown debt, territorial boss/captain posts and captive-rescue logic.
- Staged package/build-info/cache identity dev.184, subject to PWA build verification. Multi-file GitHub Pages/PWA architecture remains mandatory.

## Explicitly excluded
No automatic initiation-range buff to 520. Separate Rogue ranged-pressure issue: ordinary target-selection ~360 versus legal initiation 408, captain ~360 versus 528, boss ~500 versus 600, and a further eligibility gate. Later independently audit Ranger/Mage/Archer encounters at 350, 400, 450, 480 units, then consider only reproduced narrow fixes. No range, threat, eligibility or damage change in this candidate.

Other 10 pending PRs deliberately not included: #458 TRUE boss hunt, #456 Founding Explorers docs, #452 Mage beam, #449 governance docs, #447 Pixi resume test, #445 artwork checks, #440 critical executions, #436 stationary autoattack, #435 docs closeout, #401 Vale art previews. None closed or superseded by this draft.

## Evidence and review gates
Independent exact-head focused runs succeeded and **did not publish**: [#454 40193889978](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40193889978); [#455 40193790010](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40193790010). Earlier #455 failed guards belong to historical runs, not its current green head. This integration requires its **own** focused CI/build result; do not infer green from the individual branches.

Run focused captain healing, Treasury native/save lifecycle, specialist interaction, ordinary and cross-species support healing, guardian/actor snapshot, Rogue escalation, night Rogue and night tempo, sprite-scope and encounter/save regressions. Specifically verify idle boss boundary, independent 7/10 s clocks, 90% recipient gate, paths/LOS and zero rewards, defense cast cadence and continued escape, boss/captain bounded territory and Slow/Mage/Ranger counterplay. Verify source formatting and exact-head reproducible offline **multi-file** PWA build. Normal/Nightmare practical encounters, physical-device checks and historical save trials are **not** certified by CI and remain release gates. Do not start the all-game/browser/performance matrix without owner authorization. Fix only demonstrated regressions, recheck on exact new head, and request explicit authorization before **either merge or deployment**.
