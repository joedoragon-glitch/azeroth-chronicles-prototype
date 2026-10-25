# Issue #463 / PR #464 — merged-source candidate, dev.186 (25 October 2026)

This candidate incorporates all changes from published main `31a89996815e60004e53658189a24d51d2126d62` and the approved Ranger/Paladin/companion/pet work from PR #464 head `656912d3b7872c158920df5199fd34c487f1cc60`, preserving merged Mage Skill 1 (#452/#466/#467/#479), VFX (#471), recent Pixi recovery, audio and UI work. The original PR's physical Ranger/Archer volley contact semantics remain subject to the owner's *post-publication* gameplay feedback, not a pre-merge human playtest gate.

## Reconciliation contract

- Preserve live Mage Skill 1 normal/charged caster tether, true damage front, world-locked aim and Arcane Lance Helix; no changes to Mage Skill 6 or other Mage mechanics in this patch.
- Preserve Ranger/Archer actual delayed launch coordinates and flight collision; physical volley skills may now miss moving foes or collide with terrain. No independently tethered arrow sprites.
- Preserve Paladin planted Radiant Cross and sword impact geometry, live wards, all 11 pet families, Soldier's contact semantics and honest contact VFX.
- Preserve main's effects-first-paint/diagnostics, Pixi Keep/Revert and late context-loss safety, soundtrack/input improvements and UI geometry. Identical Pixi optimization Settings-resume test repair is deduplicated once.
- Keep the dormant Critical Executions PR #440 out of this integration. Its future interactions with physical projectile contact are independently tracked.
- Version, package lock, generated build-info and service-worker cache are bumped together to `0.9.1+snapshot.dev.186` to expose installed PWA updates. Multi-file Pages/PWA is authoritative.

## Validation and release

Historical isolated PR #464 head `656912d3b7872c158920df5199fd34c487f1cc60` passed 37 focused test files plus offline-ready build in GitHub Actions 40237117158. **That run is not evidence for this integrated tree.** This two-parent candidate requires its own current-branch focused validation and reproducible build before merging. No full-game/browser matrix has been authorized. Publish on an approved merge only if exact-candidate checks pass, then verify GitHub Pages deploy; the owner tests actual gameplay afterward and may request balance or visual changes.
