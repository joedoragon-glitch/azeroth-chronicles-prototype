# Greenwood Vale flagship — recovery checkpoint and rollback runbook

> **29 October owner-authorized selective rollback:** Restore only Vale's 2,700-unit layout to spare the public the rejected experimental redesign, not an entire old application revision. Other-region fixes and contemporary Rogue/Barracks gameplay remain in main. The dev.235 candidate uses an explicit reverse save-coordinate receipt for already-migrated v4 campaigns. Keep actual pre/post-layout player exports separately; no Git branch contains them. Do not claim release until focused checks and the final Pages run succeed. The Work full-redesign commissioning package remains draft #644.

**29 October 2026 — operational safety record.** This is the recovery procedure for the flagship reconstruction. Merge/publication receipts are recorded below; a successful release does not establish device acceptance or a tested reverse save migration.

The game's public title is *So I Became the Dark Lord's Problem*. Historic repository names and the `vale` internal region ID remain unchanged.

## Recovery checkpoint

- **Verified pre-flagship source:** [`main@c55faef34a2122c4c8aa4177d262a2d865f81253`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/c55faef34a2122c4c8aa4177d262a2d865f81253), observed on 29 October 2026.
- **Preserved branch:** [`recovery/greenwood-pre-flagship-20261029`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/tree/recovery/greenwood-pre-flagship-20261029), created **from that exact commit**. Treat as a protected historical checkpoint; never force-push, delete or repurpose it for development.
- **Introduced reconstruction:** [merged PR #570](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/570), [epic #545](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/545). It was **not merged** at checkpoint creation. Its final source, approved merge strategy and test results must be rechecked before any future rollout.
- This branch preserves **repository source** at a known checkpoint, **not** a player's local save files, installed PWA cache or a certified published Pages artifact. If unrelated changes land in `main` before #570 merges, create or record an additional exact **immediate pre-merge `main` SHA**; do not overwrite this historical branch.

## Release receipt

- Immediate pre-merge main: `87792f6441c8b01b3afd25282a209b695427f649`.
- Introducing merge: [`323bb2a7`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/323bb2a75ceec9bafa8dfe9d567be057309a0115), feature head `37b7cb77dd3a6bdbf1747d247029e431f7a6d29e`, dev.233. A full merge revert would use first parent 1; review unrelated included repairs before choosing a whole-PR rollback.
- [Focused validation and Pages #40951925946](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40951925946) succeeded. Public build stamp and Greenwood source match the introducing merge. The original recovery branch remains intact.

## Before merging a future Greenwood release (required safety gate)

1. Record the actual immediately preceding `main` SHA, the PR head SHA, the precise eventual merge/squash commit and the GitHub Pages run/deployed commit. Preserve the checkpoint branch above. Avoid combining unrelated region fixes into the same PR if they can safely be split.
2. Export **external, offline copies** of real player v4 campaigns **before opening them in the new Greenwood build**. Do not overwrite the originals. Retain separate pre-upgrade and post-upgrade backups with labels and timestamps. A Git branch cannot back up browser local storage.
3. Validate fresh games and imported old saves, old Greenwood object/quest identities, the two crossings, paths, NPC interaction, all affected destinations, companions, combat, Canvas and Pixi/WebGL behavior, offline build and appropriate focused tests. Explicitly record inherited failures; do not call a red check green.
4. Verify that published assets, release/build metadata and the PWA service worker agree with the candidate; the owner authorizes the actual merge/deploy. Native browser screenshots and automation do not imply physical-device acceptance.

## If something goes wrong — select the least destructive recovery

### A. PR #570 has not merged

No rollback is needed: `main` still has the old Greenwood. Keep the draft unmerged, correct or close it, and preserve the checkpoint.

### B. The PR merged, but no player campaign has been migrated

Create a new rollback branch from **current** `main`. Locate the exact introducing commit and inspect changes made after it.

- If the reconstruction was a **squash/rebase with one standalone commit**, a candidate can start with `git revert <introduced-commit>`.
- If it used a **normal merge commit**, a candidate can start with `git revert -m 1 <merge-commit>` (first parent = prior `main`).
- If it arrived in **multiple commits**, revert the relevant complete sequence in the correct order, reviewing conflicts individually. Never guess a commit from the PR number or force-reset `main`.
- These are **candidate procedures**, not commands to run against `main` without review. Check `git diff`, exact scope, release files, asset inventories, and test coverage; open a rollback PR.

A whole-PR revert is an efficient starting point **only if the PR contains solely changes we intend to undo**. At checkpoint review, #570 touched **251 paths**, including shared `app.js`, `engine.js`, `save.js`, `world.js`, build/asset files and some **Ironroot/Flooded Marches** behavior. Reverting that entire patch could also remove independent repairs carried in the same PR. First determine whether to reverse the full integrated change or create a **selective source-grounded rollback** of Greenwood data, migration hooks, scene lifecycle, dependent assets, tests and build entries. Do not restore `greenwood.js` or `world.js` alone and assume the original map will work.

### C. The new build has already migrated a player's Greenwood save

**A code revert alone is NOT a safe save rollback.** PR #570 introduces `greenwoodSourceVersion` and one-way remapping from the former **2700-unit** Greenwood coordinates into a **3200-unit** space, with separate scene revision state. After loading and saving, people, props, active orders, service positions and other world coordinates may be in the new system. The old runtime cannot be assumed to reverse them. Merely renaming/removing a version marker can cause double migration or misplacement.

The **safe default** is to restore the preserved **pre-upgrade player export** under the reverted game, keeping a separate copy of the post-upgrade file as evidence and for possible future rescue. If retaining post-upgrade progress is essential, require a dedicated, source-audited **reverse migration** for actual saves (including repeat-load idempotence), with meaningful pre/post comparisons. Until that is written and tested, do not promise that new-layout saves can be imported into the old layout unchanged.

### D. Restore the playable release

After the rollback PR passes its **specific** tests and is owner-approved, merge it into current `main`; do **not** move `main` backwards or force-push. Correct build/version/service-worker cache identities so clients receive the restored release, then verify the **exact published Pages artifact** and PWA update/offline behavior. Check representative old-save loads, the original 2700-unit world, travel, quests and graphics. Label physical Chromebook/phone checks **device-unverified** until personally checked.

## Focused rollback audit checklist

- [ ] A fresh `main` SHA and immutable historical recovery branch are recorded, and the branch matches the pinned commit.
- [ ] The actual introducing merge/squash history is identified; unrelated commits since then are preserved.
- [ ] Every shared-code hook and cross-region edit is consciously retained or reverted; no half-installed Greenwood module remains.
- [ ] The restored game's map coordinates, collision, settlements, bridges, monsters, quest IDs, internal IDs and saves match the intended pre-reconstruction behavior.
- [ ] **Pre-upgrade real player save** imports safely; **post-upgrade save** is separately protected and either verified through a reverse migrator or explicitly declared unsupported for direct downgrade.
- [ ] Smallest relevant focused test matrix and reproducible offline release build pass on the **exact rollback head**; inherited failures are disclosed.
- [ ] The rollback PR is reviewed, merged with owner authorization, Pages publishing verified, and physical-device acceptance reported separately.

**Status at creation:** Historical recovery branch **created**; this runbook is a proposed documentation-only PR. **No gameplay rollback was implemented or tested, no Greenwood PR merged, and no production rollback deployed.** Future work must update the evidence/status when actually performed.
