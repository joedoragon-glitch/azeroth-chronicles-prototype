# Four-class, multi-mode save-slot audit and preview migration (27 October 2026)

> Draft PR [#511](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/511) / `design/rogue-bard-feasibility-20261026`. **No production save migration, publication, merge or Rogue public admission approved.** This is a compatibility-first preview candidate. The user correctly identified a core architecture gap: game content expanded from Paladin/Normal, but save slots remained *one per mode*.

## Verified pre-change behavior

- `persistence.js::saveKey(mode)` is `azeroth-v4-<mode>`; the original app stores **one primary** per Normal, Nightmare, Developer or Arena. There is no per-class dimension. A new Paladin and Rogue both target `azeroth-v4-normal`. The new-run confirmation prevents silent replacement, but it **cannot retain the runs concurrently**.
- Recovery bundles likewise use `azeroth-v4-<mode>-checkpoints-v1`, each capped at three validated previous snapshots and 500,000 characters. These are historical *versions* of one mode slot, not independently selectable class campaigns.
- Campaign v4 snapshot validation already validates `hero.class` against the current registered classes and supports Succession, companion inventories and both independent critical RNG streams; it is **not** a Paladin-only serializer. Legacy v2 migration remains a separate explicit, protected path.
- Existing global browser writer lock, optimistic byte fences, checkpoint quota handling, unreadable-original preservation, profile `nightmareUnlocked` and v4 campaign schema must remain intact.

## Implemented, but deliberately opt-in while Rogue is in preview

`PrototypePersistence.createClassSlots` wraps the existing validated writer/checkpoint/recovery owner **without changing the legacy `create()` API**. The explicit `?roguePlaytest=1` branch preview uses this multi-slot adapter; the ordinary app retains the established production adapter.

| Slot | New additive primary storage key | Legacy key preserved |
| --- | --- | --- |
| Normal / Paladin | `azeroth-v4-normal-paladin` | `azeroth-v4-normal` |
| Normal / Rogue | `azeroth-v4-normal-rogue` | `azeroth-v4-normal` |
| Nightmare / Mage | `azeroth-v4-nightmare-mage` | `azeroth-v4-nightmare` |
| Developer / Ranger | `azeroth-v4-developer-ranger` | `azeroth-v4-developer` |
| Arena / Rogue | `azeroth-v4-arena-rogue` | `azeroth-v4-arena` |

The same rule applies to every registered class and mode. Checkpoint and unreadable-original keys add the class **before the existing suffix**; e.g. `azeroth-v4-normal-rogue-checkpoints-v1`. Mode/class validation is enforced before accepting a class-named save. The source legacy primary is **never deleted or rewritten** during an ordinary class save; it remains readable under the exact hero class recorded in its bytes. The next successful write to that class creates a separate new primary. The old checkpoint/recovery history remains intact, with new class histories starting independently.

- The preview's actual New Game overwrite warning scopes to the **selected class AND mode**. Starting Rogue Normal cannot replace Paladin Normal.
- The title Saved Games menu enumerates each available class+mode slot and labels/exports each individually; recovery choices are class-scoped and wrong-class contents are rejected. The current active class is a **presentation preference** (`profile.activeClass`) for startup selection, **not** a field in the v4 campaign, nor an intensity preference.
- The browser preview's restart marker reads the current class key; crash recovery cannot mistakenly associate another hero class's checkpoint. The global single-writer lock and per-slot optimistic byte checks remain authoritative.
- Importing a validated run writes to its proper class/mode key. Older browsers not in preview continue reading their original legacy saves without interacting with these additive slots. Explicitly switching out of preview does **not** load the new class slots in the historical public layout; this is an intentional rollout gate, not data loss.
- Only **one active campaign per exact class+mode pair** is supported. A second Paladin Normal still prompts for overwrite; multiple named characters of the same class/mode are a separate future design requiring a stable slot ID and new UI.
- All data remains **browser-local**. Clearing site data, switching devices/origins or opening a different host does not transfer saves. Export backups before testing.

## Succession: immutable slot owner, mutable active hero

**Critical follow-up safeguard:** Succession is a continuation of the original campaign. A Rogue-founded run remains stored in `azeroth-v4-<mode>-rogue` when Rogue dies and Mage, Ranger or Paladin takes over; the successor's **active** `hero.class` must not redirect the save into a different class's independent slot. `createClassSlots` binds each loaded/created Campaign to its **founding slot class** with an in-memory WeakMap, persists the ordinary v4 campaign bytes unchanged, and reconstructs that binding by the class selected from the save menu on load. The class-named slot accepts a different current hero only when a valid Succession snapshot's `challenge.fallen` includes that slot owner. No new v4 field, global migration, or player setting is needed. Profile `activeClass`, conflicts and restart-marker keys refer to **slot ownership**, not a successor's current class. The stored restart marker separately records the actual current hero for stale-run validation. The alternate successor's independent same-mode save must remain byte-identical before and after the takeover.

This also clarifies the one-slot-per-class rule: class is the **starting class of the campaign**, not necessarily the current class under Succession. Historical v4 saves had no owner metadata; a legacy mode-only save is initially associated with its *current* recorded hero class when first copied to a modern class slot. That compatibility choice cannot reconstruct an undocumented older founding class.

## Acceptance and open risks

`tests/rogue-bard-class-save-slots.test.cjs` exercises four-class, four-mode separation, legacy preservation, startup fallback, validation, corruption and recovery boundaries, conflict-free reads of other classes, and the preview shell. Re-run existing `save-writer`, `save-recovery-checkpoints`, `persistence-safety`, `save-import`, Succession, Rogue class and focused UI tests on the new exact head. These are **necessary but not sufficient** for actual browser/PWA tests.

Manual acceptance still required: title/menu navigation with multiple named class slots, full save/load/restart and export/import, stale two-tab ownership/lock, storage quota warning, checkpoints, old v2 migration, corrupted old v4 recovery, save after Succession, and PWA/origin scope on desktop and mobile. Do not claim live owner acceptance based only on Node checks.

**Do not merge, deploy or migrate public user data without explicit approval.**
