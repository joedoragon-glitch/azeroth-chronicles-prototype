# Enemy Skill VFX Overhaul — implementation and audit

Runtime: **0.8.111**. The foundation and housekeeping remain intact. PR #161 adds the observation-only event bridge; the subsequent art layer completes the live repertoire.

## Coverage

`node scripts/enemy-vfx-inventory.cjs` reads the current mechanics. Its proposed stage slots are a source inventory, not a claim that cosmetic stages should introduce extra attacks. The implemented catalog has **200 live identities**:

| Group | Identities | Presentation |
| --- | ---: | --- |
| Boss authored attacks | 46 | All 11 families, normal and TRUE; 92 resolved variants |
| Captain attacks | 16 | All five profiles |
| Captain transformations/phases | 5 | Scramble, molt, howl, carapace, command |
| Night-exclusive skills | 2 | Soul Drain and Shadow Pounce |
| Ranged projectiles | 7 | Actual existing travel and contact |
| Rogue basics | 84 | Ordinary, guardian, ringleader, melee/ranged, boss and captain identities |
| Basic melee | 28 | Boss, captain and species materials |
| Ringleader frenzy | 12 | Brief transition cue, not a permanent particle aura |

Guardians and ringleaders share species materials where the action is shared. They retain separate tactical identities. TRUE inherits the same attack grammar with a small release accent, not multiplied particle density.

PR #146 remains an independently developed draft. It was reconciled read-only against rogue head `6c915b6`: **40 real signature resolutions** passed full snapshot equivalence with the visual observer on/off. A visual-only fixture preserves those IDs and descriptors for Chromium/WebKit regression coverage. No pending AI or balance changes were copied into main. `scripts/enemy-vfx-rogue-compat.cjs <rogue-worktree>` reruns this comparison; `--update-fixture` refreshes only the visual fixture. Live inventory automatically expands when its registry reaches main.

## Visual direction and five pilots

Art uses the established procedural forms and restrained fur, bone, root, mire, water, stone, steel, ember, ash, shadow, spectral and dust palettes. Angular cuts, claw marks, stones, droplets, tethers, shell plates and small arrival disturbances describe actions. There are no new screen flashes, additive blooms, full-screen filters or fireworks.

| Pilot | Audit finding and resulting correction |
| --- | --- |
| Thornfang Pounce | Landing payoff follows the actual landing; small claw scuffs and local motion accents leave the squad visible. |
| Crypt Bone Volley | Replaces generic arrows with readable short bone shafts; stagger and collision stay simulation-owned. |
| Mirejaw Brood Call | Removes a false damage footprint around the selected target. Cast feedback stays at the caller; arrivals mark actual summoned units. |
| Stone Colossus Expanding Rings | Stone chips track the actual live circumference. The warning now includes the existing lifetime/range multiplier; the attack itself is unchanged. |
| Dreadmaw Carapace | Settling shell edges express protection; brood arrival is a separate, local cue. The central body remains readable. |

Comparisons: [desktop](vfx-audit/pilot-desktop.jpg), [phone](vfx-audit/pilot-phone.jpg). Full-resolution pilot and catalog captures are workflow artifacts under `test-results/`. The desktop pairs crop the same combat area; phone pairs retain the actual HUD and controls.

The five pilots were inspected through **90 actual-game scenes / 180 images** across 1280×800, 375×812 and 812×375, day/night, crowded six-companion fights and 100/150/175% camera zooms. WebKit also captured all five in portrait/landscape and day/night at 150%. Native canvas catalog draws inspect intermediate animation times; browser contact sheets cover every live identity, all 46 extra TRUE variants, and 40 pending signature descriptors: **286 scenes per browser/viewport**.

## Combat and lifecycle safeguards

- The bridge observes existing resolutions and successful hits. It never schedules damage, changes ranges, consumes RNG or advances IDs. Immutable, sanitized envelopes and projectile/hazard associations live outside v4 saves and statistics.
- Ground effects follow authoritative circle/cone/sector/line geometry and clip to that footprint. Ring decoration follows existing hazards; movement follows existing motion. Ground material draws after night grading, with intersected body exclusions; danger warnings and targeting guidance draw above it.
- Cyan rogue cues remain distinct from ordinary attack cues. Signatures have a separate dash/weight and a full wrapped label. Names remain presentation only.
- Visual queue shares the existing **40-effect cap**; incoming observation events cap at 120, replay IDs at 512 per epoch. Crowds reduce motifs, never warning geometry. No cosmetic RNG, new image cache or per-frame asset loading is introduced.
- Duplicate delivery, stale timestamps, source death/return, player defeat, pending challenge results, zone travel and same-zone reentry suppress decoration. Paused/menu time freezes transient animation. Existing hazards and projectiles retain their original mechanics and danger cues.
- Drawing and replacement assets are read-only with respect to combat state. Automated comparisons cover **194 live boss/captain/rogue/night resolutions**, plus the 40 pending signatures.

## Illustrated replacement path

`assets/vfx/manifest.json` remains empty in production. Procedural art is the complete default. Reviewed `vfx:` sprite entries can replace individual `windup`, `release`, `travel`, `impact`, `linger`, `spawn` and `phase` slots through this existing manifest, including optional TRUE stage overrides.

The shared sprite loader owns frame rectangles, exact clip timing, density, pivot, lazy decode, cache residency, reduced-motion frames and offline packaging. Missing entries, absent clips, malformed manifests, pending decodes and removed assets fall back per stage. No second asset system is created. `PrototypeEnemyVfxArt.rollback(id, stage)` suppresses one decorative stage without removing its combat warning; `game.enemyVfxEnabled = false` is the diagnostic baseline switch.

## Verification and practical limits

The release gate includes formatting/generated-entry checks, the complete regression suite, the 204-check desktop/mobile matrix, WebKit phone checks, audio playback/audition, material rendering, sprite showroom/lifecycle and the new catalog/pilot browser jobs. Main deployment runs the same gates, verifies the exact published SHA, then exercises the live desktop/phone paths.

Performance capture alternates warmed decorated/undecorated frames in the same scene and reports raw draw-time medians, renderer counters and sprite residency in `measurements.json`. These are shared, headless software-rendering measurements, not physical-device FPS promises. Decorative counts and asset residency stay bounded. Physical iPhone/Android GPU, thermal and system-callout behavior still require real-device play; this limitation does not change the desktop/mobile browser validation.

Global nighttime grading, existing actor artwork, combat tuning, AI and progression were preserved. The pending rogue mechanics are outside this visual-only change and remain owned by PR #146.
