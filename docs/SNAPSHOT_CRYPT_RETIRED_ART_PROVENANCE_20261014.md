> **Historical record — 19 October 2026:** Candidate status, approvals, failures and next actions below apply to their dated checkpoints. They do not direct a new chat to resume or re-merge old work. The published snapshot is `0.9.1+snapshot.dev.78`; development is paused, with [current state](DEVELOPMENT_STATE.md) and draft #319 governing recovery. Original evidence remains below.

# Crypt art provenance decision — Community Snapshot (14 October 2026)

**Scope:** director choice 17A, Scornfang / Greenwood Treasury. This is a source-backed **negative finding**, not a claim that every older historical or off-repository drawing has been recovered. No furniture, sprite, reward, cache, loot, collision, source manifest, or gameplay objects are changed here.

## Audited evidence

- **Published reference:** `main` at `6f8089b2013647184efb04932fe6157f548238b9`, `src/prototype/rules.js` → `dungeonDecor.crypt`. Exact exported array contains **30** furnishing tuples.
- **Combined snapshot branch:** `implementation/director-snapshot-20261013`, same exported `dungeonDecor.crypt` contains **40** tuples. All **30/30 baseline tuples are still present, verbatim**, and there are 10 added estate/retreat details. **Zero baseline furnishing tuples were removed or retired.** The original 30 use 17 distinct procedural structure types; all 17 remain used. Current expanded Crypt has 20 structure types.
- **Current source locations:** all these tuples are active Crypt interior layout, not candidate loose/scrapped art. `src/prototype/world.js` consumes the existing dungeon decoration layer; neither the authored new estate features nor the original Crypt furnishers were retired. In the actual existing `assets/sprites/manifest.json`, there are no specifically labeled Crypt-retired artwork keys. The recursive published-main and draft-PR tree inventories show no files named Crypt furniture or retired Crypt image assets; the five matching Crypt filenames are **music tracks**, which are still in use and never represent furnishings.
- **Treasury contract:** `R.supplyRooms` retains `supply-vale` with **exactly two existing collectible caches**, and `R.treasuryDecor['supply-vale']` retains its eleven existing scene tuples (beds, trophy, hoard, furniture, etc.). Reusing a shared existing kind such as `warm-brazier` or `game-table` is **not** proof that a previously installed Crypt furnishing became unused.

## Decision

No **demonstrably retired/unused Crypt-specific object** is established by the currently accessible published baseline, combined branch, or checked asset inventory. Therefore choice **17A's conditional permission authorizes zero new salvage decorations in Scornfang's Treasury at this checkpoint**. Adding a Crypt-looking prop and calling it retired would invent provenance and contradict the rule. Keep all Crypt objects, existing Scornfang's Treasury furnishing, its two cache IDs/rewards and all save/migration behavior unchanged.

The negative result **settles the present implementation action**: there is nothing eligible to install. The broader historical provenance question remains open **only if a genuine retired original/asset is later supplied**, with its former version/path/blob identity, proof of removal from active Crypt use, archive/asset original-master provenance, collision/loot-safe reuse plan and explicit owner acceptance.

## Focused receipt and final audit boundary

The comparison evaluated the actual exported `PrototypeRules.dungeonDecor.crypt` arrays from both refs, rather than inferring retirement from names. The baseline and snapshot tree inventories were fetched recursively and were not truncated. This is a focused source/provenance audit, **not** the deferred full build, historical-save suite, WebKit/Chromium rendering, independent playable audit or release certification.

**Authority:** owner choice 17A in `docs/DIRECTOR_WORLD_BUILDING_SNAPSHOT_CANON_LOCK_20261012.md`; original #230/#289 context and PR #300 implementation ledger. No merge/deploy/publication.
