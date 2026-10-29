# Queued companion care and shared service eligibility — dev.149

Joel requested queued fallen-companion recovery and the existing 30-crown treatment, with the same cancellation/automatic delivery convenience as recruitment. He explicitly requires eligibility beyond money to remain enforced, including for town Captain recruitment.

## Runtime contract

The Captain and completed Basic/Full Barracks offer recovery and treatment even when crowns alone are missing. One unpaid request per care kind persists in v4 saves; a repeat tap cancels it without spending. Recovery binds the selected existing fallen member; treatment binds the living wounded members at request time. Neither substitutes a different target later. If the request no longer has an eligible target, it clears without charging; treatment never resurrects a fallen companion. Normal prices remain 40 crowns for recovery and 30 for treatment. Successful recovery preserves the companion ID, name and active/reserve state.

A shared companion-service check requires a living, available hero and no engaged hostile enemy within the existing `refugeThreat` radius (700 world units). Idle nearby enemies do not block services. Queuing is allowed only when other eligibility requirements pass. Execution rechecks safety, requested target state/availability and source Captain or completed Barracks before spending. A requested member away on a resource expedition postpones care. Physical return to the source is intentionally waived. Invalid/unneeded targets clear without a charge; temporary blockers wait and remain cancellable.

Town and Barracks recruitment use the same safety/source revalidation. Expedition and company-capacity reservations remain; the accepted full-active-group → reserve rule is retained. Barracks training occupancy is now checked again at funding rather than bypassed. Requests do not bypass a missing Captain, unfinished/missing Barracks, lost Expedition unlock or nearby engaged combat. Manual paid recruitment/care also share safety checks.

Care requests and the existing single recruitment request may coexist. Each ready request charges once. When multiple actions are eligible and affordable in the same tick, recovery resolves first, then treatment, then recruitment. This order is visible when multiple queues are present. A request that is not eligible does not prevent a different eligible action. Queues are evaluated after native damage, support, earnings and loot collection, and show the current blocker in the NPC interface. Automatic recovery/cancellation uses the existing immediate-save event path; healing uses existing heal events.

Owning modules: existing `party.js`, `menus.js`, `save.js`, `engine.js` and `app.js`. No parallel roster, currency model or browser state. Save additions are optional and legacy saves default to empty care requests.

## Focused verification

- Eight care mode/type/source save → travel → actual loot payment paths pass, plus combat/source/target/hero revalidation, cancellation, reserves, healing without resurrection, no target substitution, independent requests, priority, malformed/legacy saves and shared NPC menu actions.
- Existing recruitment-request suite extended: both sources recheck combat, Expedition and source availability; Barracks training occupancy rechecked; earlier full-group reserve and one-charge scenarios retained.
- Production English/Spanish shell test exercises actual Captain recovery/treatment queue/cancel rows, saved target IDs, funded combat pause and visible reason, together with prior recruitment/tutorial/quest-board flows.
- Existing menus, Barracks roster feedback and economy suites pass. Pet recovery uses the same native recovery path. Build and changed-source format/diff checks pass.
- The unrelated inherited `prototype-ui` Treasury-menu fixture limitation remains documented in the dev.148 record; no broad CI/browser matrix or whole-game suites run for this release.

Owner authorized immediate live playtesting with minimum checks. Publication uses a temporary package-only workflow, restored/removed after exact-public verification.

## Publication

PR #388 merged as `02afb4e9a316cca99ba6e7b66242bce1796559fd`; package-only run 39699745777. Exact-public receipt: `docs/evidence/QUEUED_COMPANION_CARE_DEV149_PUBLICATION_20261021.json`. Normal Pages workflow restored byte-for-byte and temporary publisher removed in closeout.

## 29 October 2026 — multi-companion Barracks queue extension (dev.234 candidate on current main)

**Owner decision (supersedes only the historical one-target recovery-queue limit above):** Completed **Basic Barracks** may queue at most **three** individually selected fallen companions. Completed **Full Barracks** may queue all genuinely owned fallen companions, with **no additional Barracks queue cap**. Town Captain recovery keeps its original **one pending companion**. The old single recovery request remains a legal v4 save; its `companionIds` list is extended in place, preserving the source/zone and original selection order, so no new campaign key or migration is required.

A Barracks Recovery submenu lists fallen companions in the existing eight-member menu pages and lets the player queue or cancel that particular ID, without removing others. Requests remain tied to their original service; adding from a different source requires clearing the old queue first, but cancellation can target a pending ID from another Barracks. Basic-to-Full upgrade preserves pending entries and unlocks more queue space. All queued recoveries cost **40 crowns each**, applied **first-in, first-out** as individual eligible requests; the first blocked request waits and the remaining members are not silently substituted. Before every charge, recheck the hero, combat safety, source completion, actual fallen target and resource-expedition absence. An invalid or already restored head is discarded without charging. Treatment at 30 crowns and ordinary recruitment retain independent queues and existing payment priority, and no paid request bypasses native service rules.

**Candidate status:** Implemented in [draft PR #635](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/635), now reconciled with merged Greenwood dev.233. Earlier focused runs found existing-test compatibility mismatches that were corrected; exact-head focused verification remains pending. No merge, deployment or device verification. Do not reinterpret dev.149's historical publication receipt as certification of dev.234.
