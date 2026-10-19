# Frontier visuals — integration handoff

**Latest owner direction, 19 October 2026:** the owner subsequently explicitly authorized merging this completed visual batch directly into the game. Carry forward existing evidence and use the normal update workflow for the shared final checks. The earlier handoff-only scope is superseded; no test results are promoted to a full-game certificate.

## Integration branch and staging status

The owner explicitly approved pushing the prepared branch, then authorized merging it. The earlier staging blocker is superseded. Git push in this workspace lacked credentials; connected GitHub API staging uses one atomic commit with the same completed runtime source and retained evidence. `tools/visual-review/source-baselines/index.json` preserves exact local checkpoint source bytes and hashes; the manual review tools can use these when the local commit IDs are absent from the squashed remote history. The portable bundle retains the original full local history.

Portable delivery: `frontier-visual-update.bundle` contains this complete branch, including all original source checkpoints and retained references. Its prerequisite is base commit `e6ea987aded7b441bdedf51e1fc29b38b1ed2f02`. In a clone containing that base, import it and combine into the chosen update branch:

```sh
git bundle verify /path/to/frontier-visual-update.bundle
git fetch /path/to/frontier-visual-update.bundle polish/frontier-orc-identity
git merge --squash FETCH_HEAD
```

Remote staging is now approved; the remote-branch commands below are the normal integration route after verifying the branch head. The portable bundle remains a fallback. Importing or combining this work does not start a separate validation cycle.

## Retrieve and combine

- Source branch: `polish/frontier-orc-identity`.
- Base: `e6ea987aded7b441bdedf51e1fc29b38b1ed2f02` (current main verified on 19 October).
- Final runtime drawing checkpoint: `eddc15f02fb1e229fd3e5137c1f8ec970203fdc3`.
- Prior complete local handoff: `0a1030b0`; subsequent changes prepare this integration handoff only.
- Candidate package line: `0.9.1+snapshot.dev.80`, unreleased. Stay on 0.9.1; the combined update owns its final build identifier.

From the branch that owns the combined PR, with a clean worktree:

```sh
git fetch origin polish/frontier-orc-identity
git merge --squash origin/polish/frontier-orc-identity
```

Review and commit the resulting combined changes in the destination PR. A normal merge is also valid when retaining individual history is preferred. No destination branch/PR was guessed or modified by this handoff.

If the destination has changed `visuals.js`, reconcile the shared `orcBody`, complete `frontierRaider`, rank finishes, Crown overlay exclusions and final foot-stroke exclusion as a unit. Do not replace the whole renderer with either side or restore the rejected Crown armor/quiver layering. Keep the source branch: its historical commits own the retained art references and comparison baselines.

**Version/build reconciliation:** the actual runtime change is `src/prototype/visuals.js`. The package, lockfile, generated `src/prototype/build-info.js` and `sw.js` advance the isolated candidate to dev.80. If the destination already has a different candidate identifier, keep the combined update's chosen version, reconcile package/lockfile together, and generate build information/service worker once from the final combined source. Do not downgrade a newer build, copy generated outputs blindly, or reuse a published version for changed content.

## Included work

1. Shared Orc anatomy and readable faces across normal/ranged/guardian/officer/Crown units, Cinder Warlord and the Ashen Warlord. Cinder visibly imitates his governor while retaining his inspection identity and ledger.
2. Frontier-only enemy archers have one coherent guerrilla field outfit, one bow and one quiver. Crown allegiance is a cloth armband; their old helmet, plate, second uniform and duplicate equipment passes are excluded.
3. The decorative stroke between Frontier archer boots is removed. Use `feet-corrected-body-8` through `feet-corrected-body-11` as the latest archer reference, rather than earlier previews still showing that stroke.

No new content, gameplay, maps, spawns, saves, combat timing/geometry, audio, flowers or approved sprite registrations changed. Other-region archers and allied Goblin Archer art remain intact. The manual capture/scope tools and per-design handoffs are included; they are not new automatic CI suites.

## Test evidence to carry into the shared process

| Source / scope | Already completed | Limits / final shared work |
| --- | --- | --- |
| Initial Orc/Frontier candidate, `c8a281d8` | Build, formatting, generated/asset checks; enemy VFX art and sprite lifecycle suites; 24 desktop/phone before/after captures | Initial armored marksman was subsequently rejected; those receipts remain historical, not approval of that art. |
| Guerrilla correction, `0703dfaa` | Build, formatting, generated/asset checks; 16 actual marksman/redoubt captures at 150%, day/night; 3 affected archer contracts changed while 37 others stayed pixel-identical | Desktop/phone Chromium 134 emulation at DPR 1, not physical devices or WebKit. VFX/lifecycle suites were not repeated for this body-only correction. |
| Final foot correction, `eddc15f0` | Build/syntax, focused formatting and native-size body inspection | Full asset check, browser matrix and full regression have not been rerun for this last one-stroke change. The existing build version remains the same unreleased candidate. |
| This integration handoff | Source/diff, reference existence/hash and commit verification only | No additional runtime tests, browser captures, hosted CI, merge or deployment. |

Use these results to avoid repeated implementation/preflight cycles. They are not a certificate for a different Git tree. Run the coordinated final checks once on the final combined candidate, including its relevant gameplay/save/offline, browser/device and visual review gates; revalidate further only for actual changes or failures. Do not launch a separate full validation cycle for this branch merely because it is being recovered or added to another PR.

[Detailed changes and dated receipts](FRONTIER_VISUAL_POLISH_20261019.md) · [Latest corrected marksman](evidence/frontier-marksman-20261019/feet-corrected-body-11.webp) · [Orc/captain/boss context](evidence/frontier-polish-20261019/after-lineage-1280-day.webp)

**Next action:** incorporate this branch into the owner's chosen update workstream, reconcile any same-file/build conflicts, and include it in that update's shared final validation and release decision. The owner has now authorized merging this visual batch. The normal workflow remains responsible for checks and successful publication.
