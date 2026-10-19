> **Historical record — 19 October 2026:** Candidate status, approvals, failures and next actions below apply to their dated checkpoints. They do not direct a new chat to resume or re-merge old work. The published snapshot is `0.9.1+snapshot.dev.78`; development is paused, with [current state](DEVELOPMENT_STATE.md) and draft #319 governing recovery. Original evidence remains below.

# First snapshot checkpoint self-audit — 13 October 2026

**Recovery notice:** This is the dated audit of the completed first title/scenery batch. Its final “next step” is historical. The current leading implementation branch and exact head, later foundation/regional/patrol/engineering/aviation packages, actual current gates and next action are recorded in [PR #300](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/300) and [the implementation ledger](SNAPSHOT_IMPLEMENTATION_20261013.md). Do not replay first-batch work or encounter foundations from this older audit. It remains evidence for its stated original tree only.

**Scope:** audit the engineering preparation and title/scenery batch in draft [PR #300](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/300), before proceeding to encounter foundations. This is a self-review, not the independent second reviewer or complete playable snapshot audit required by canon.

**Audited runtime:** `d275d0e034ffa89da848be28453cafe792e1cee1`, tree `136fa666b508bb27163a6adb6fc59239dae6f655`, development build `0.9.1+snapshot.dev.2`. Main remains `6f8089b2013647184efb04932fe6157f548238b9` / `0.9.1+update.1`. The audit corrections affect verification and documentation only; every runtime, CSS, manifest, package, generated entry and service-worker file remains identical to that verified runtime.

## Findings and corrections

| Finding | Consequence | Correction |
| --- | --- | --- |
| Ledger retained pending statuses after successful final CI | A later chat could repeat completed work or mistrust the checkpoint | Updated only choices 4A/6A to verified in the combined game, with exact runtime/tree/run evidence; all remaining gameplay remains pending |
| New fruit-tree handoff lacked durable reference/context files and hashes | A future art request depended on temporary scratch files | Retained isolated procedural capture, native desktop context and actual WebKit phone capture with hashes and source identity; no sprite registration or invented director acceptance |
| Comparison filters matched broad district/structure categories with any regional-handoff ID | An unrelated future prop in those categories could be hidden from equivalence | Replaced with exactly twelve approved region/ID/structure/district/role tuples; duplicate approved identities are rejected; negative tests retain unrelated, collidable or mismatched props |
| Browser scenery helper required only one painted furnishing per district | A district could pass while another furnishing never rendered | Added per-furnishing camera checks through the actual running renderer on Chromium/WebKit profiles |

No additional game-runtime defect was reproduced in the implemented title/scenery scope. The earlier saved-Marches-position defect was already fixed in `cb9fd86a` and subsequently verified at `d275d0e0`.

An intermediate development commit (`dd123f65`) had claimed a local painter-fixture PASS even though its crowd setup failed. The subsequent correction and checkpoint explicitly superseded that claim; final CI passed. This audit does not erase history or treat that intermediate claim as valid evidence. New checks and commits are performed sequentially with failure stopping the checkpoint operation.

## Authority, scope and preparation review

- Compared all 45 selected ballot IDs, in order, against the ledger: exact match. Its 17 additional rows retain custom Barracks/Wraith/Mira rulings and compatible regional/ministry/finale packages. This is complete ballot indexing, not an exhaustive method-level audit of every unimplemented move.
- Compared the committed canon copy byte-for-byte with `f10cc9129c831e956e630eacaed8c5ba82c38403`: identical SHA-256 `65d5c824bbcdc3b2aefd59a2ab820e7f73dd5f3856f97b027c324f364635fe33`.
- Rechecked repository instructions, architecture, relevant design handoff rules, exact diff, first-batch source proposals and existing tests. The seven Greenwood, three Marches and two Frontier additions match the approved source tables; original props/routes/interactions remain protected.
- Reviewed the integration diff against the main baseline. No combat, encounter AI, navigation, player-class, quest, rescue, currency, save-schema or progression owner was changed. World changes are confined to scenery migration; app changes are installation/display wording.
- Rechecked live PR #298: open, draft and unmerged at its original canonical commit. PR #300 remains isolated/draft. No main edits, merges, release, deployment or public-game changes.
- No final sixth-companion revelation scene, new lore, currency, classes, combat approximation or optional #294 optimization was introduced. New sprite production remains excluded.

## Verification evidence

**Original combined runtime:** [full CI 38349470015](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38349470015) succeeded in Node/Chromium, WebKit and clean package certification. Deployment was skipped. It includes 104 Node suites, 2,880 paired simulation frames, six genuine historical saves, 40 exact full-render comparisons, three-class historical Normal/Nightmare imports, PWA upgrade/offline reopening, quests/rescues/Rogue/audio/VFX checks and renderer comparisons. This is combined-head evidence, not inherited green source-PR tests.

**Additional self-audit checks:**

- 600 region placements across 200 varied seeds, rotating all three classes and both modes: exact scenery counts, no missing additions.
- Permanent `snapshot-scenery-audit.test.cjs`: 216 region cases across twelve seeds, all three classes and both modes; exact counts, road/collision clearance, historical scenery restoration, original prop order, repeated save idempotence and quest/rescue/key/currency preservation.
- Negative controls for the exact comparison exclusions: unrelated IDs, wrong structures/districts/roles, collision and decorative-state changes remain visible; duplicate approved identities fail.
- Actual serialized painter setup/proof executed in eleven scenes, including crowd: repeated zone/draw calls do not regenerate stripped comparison props; unrelated props survive and changed gameplay still changes the proof. The stubbed Canvas in this focused lifecycle probe is not browser raster evidence.
- Re-ran full equivalence with the narrowed exclusions: 2,880 paired frames, six historical saves and 40 render comparisons passed.
- Inspected actual WebKit 375x800 captures for all five affected districts from final successful run 38349470015, artifact 11790632246. The new tree's phone context is retained in its [handoff](../tools/sprites/design-handoffs/greenwood-fruit-tree.json).

The audit correction head and its hosted full Chromium/WebKit/per-furnishing results are recorded in the PR #300 resume checkpoint. The earlier runtime certificate remains bounded to its exact tree; unchanged runtime does not mean the new verification files inherited that certificate.

## Readiness and limits

This checkpoint can proceed to selective #230/#231/#280 foundations once the audit-correction tree passes its full hosted checks. There is no newly identified creative decision or required main change.

The large combat, mobile-captive/patrol, story, ministry and #266 finale work is still unimplemented on this branch. Those packages must expand into exact method/move tests as each is integrated. No release candidate is recommended. Full campaign progression, natural new boss AI, real phone/Chromebook performance, director appearance acceptance and the independent final reviewer remain open where applicable. This self-audit cannot certify them.

**Next concrete step:** reconcile encounter/captain cancellation and save cleanup, replace name-sensitive Groundwork/Hookfang Rush dispatch with stable family/slot identity before approved renames, and test death, disengagement, travel, restore and Normal/TRUE transitions before adding moving captives.
