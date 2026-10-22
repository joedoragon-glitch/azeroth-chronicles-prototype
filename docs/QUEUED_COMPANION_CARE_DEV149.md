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
