# Conversation → procedural design → sprites

Joel's 8 October 2026 instruction makes sprite delivery part of the content workflow. It applies to new hero classes, characters, monsters, companions, NPCs, structures, scenery, terrain and visible objects introduced by locations or lore. The procedural design establishes the visual canon. Once Joel accepts that design and requests sprites, continue from its accepted reference in the originating chat or another chat; do not restart the design from a name or an old catalog prompt.

This is an agent workflow. Joel can give feedback and request the next stage in ordinary conversation. The agent owns records, catalog updates, reference capture, processing, checks, implementation and publication within the authorized task. A request for procedural design alone does not silently authorize generating or activating final sprites. Existing authorization to produce sprites does not need another technical permission round.

## Persistent handoff

At the end of content/design work, write or update a per-design record under `tools/sprites/design-handoffs/<stable-design-id>.json`, using `tools/sprites/design-handoff-template.json`. Keep its durable reference in the content issue/PR and relevant location/lore document. These records track the transition; the prompt catalog, exact specifications and approved registry keep their existing ownership. Do not copy those registries into a second catalog.

Record the actual request and approval scope in plain language, with a chat link when available and a repository issue/PR documenting the decision. Include the source commit, exact renderer branch/state, isolated procedural reference, actual gameplay context, hashes and the visible traits to preserve. Retain these references as repository assets, rather than relying on temporary chat files. If a conversation link is unavailable, mark that explicitly and preserve the dated decision summary. Never invent an approval, hash, URL or exact runtime key. An engineer's recorded decision is traceability, not independently authenticated creative approval.

The handoff must distinguish concept acceptance, procedural-design acceptance, permission to produce sprites, generated-image acceptance and release status. Approval of a procedural design establishes what the sprite must faithfully translate; it does not claim that an unseen generated image was accepted. Carry forward actual corrections and approval wording without introducing a new creative gate when the task already authorizes faithful implementation. The current pilot record remains in `tools/sprites/pilots/2026-10-08`; its accepted directions and pending Goblin face correction are not superseded by the template.

## Work stages

| Stage | Agent action and evidence |
| --- | --- |
| Idea / lore discovery | Identify visible entities and scene dependencies. Keep provisional story/design decisions marked provisional. Narrative-only material does not create an image job. |
| Procedural design | Implement the design in its owning module when authorized; capture the exact entity/state and device context. Review identity, equipment, regional palette, silhouette and scene meaning. |
| Procedural design accepted | Record Joel's actual accepted version and unresolved corrections. Retain immutable reference files and source hashes. If sprites were deferred, leave a discoverable handoff with the next action. |
| Sprite requested / queued | Re-read current source and the accepted record. Reconcile changed traits; append a stable catalog decision and verified binding. Describe why any geometry, effects or composition stays procedural. Prepare missing exact contracts. |
| Sprite candidate | Generate one isolated body or material from the accepted reference. Preserve the original; process through the appropriate body/material tooling. Compare canon, native size, grounding and actual context. Record corrections against that candidate. |
| Sprite accepted | Record actual appearance acceptance and the retained source/output hashes. Complete technical placement checks separately. Do not let an unchanged Goblin face inherit acceptance from the general pilot direction. |
| Integrated / released | Publish a new registration or explicit replacement revision, verify fallback, memory/device/offline behavior and exact deployed build. Record the commit/PR, resource revision and rollback target. |

Each record has one explicit next action and a status matching the latest evidenced stage. Update it in the same repository change as the design or production work, so another chat can resume without reconstructing the discussion. Until a record exists, recover current decisions from project documents/issues and available conversation context; never treat missing provenance as acceptance.

## Locations, lore and shared designs

A new location produces a list of visible requirements, not one flattened background. Track terrain materials, structures/entrances, furniture, flora/rocks, NPCs/creatures and dynamic/contextual overlays separately. Bind each item to the actual map/state and appropriate owner. Preserve collision, rescue/construction states, seeded placement, contextual work scenes and presentation effects. List reused accepted assets by stable identity and queue only new or genuinely changed designs. Scope discovery remains bounded; review authored/lore additions even when a source census has not encountered them.

When lore introduces a named NPC, object, faction uniform or creature, create its handoff alongside that lore decision if it needs an on-screen design. If its appearance is still unspecified, leave it at idea/procedural-design status rather than manufacture a sprite prompt. A shared species/class design can reference one accepted base plus explicit loadout, guard, officer, TRUE or regional variants. Do not assume that one base image covers every visible state.

## Changes and animation

Keep design identity and existing numbered catalog IDs stable. A changed design produces a new revision linked to the former accepted reference. Compare only that asset's dependencies and affected variants. Global source/catalog hashes remain useful snapshots; unrelated additions must not force regeneration of existing art. The current tooling already hashes catalog sections individually, but its global canon hash can still invalidate records after a canon-document edit; dependency-scoped review is a required follow-up, not implemented by this document.

For a replacement, retain the old accepted image, approval and source; record the expected active revision and rollback revision. The current publish command rejects replacement and the loader has a same-session invalidation gap. Implement the explicit replacement path before activating replacements, following `SPRITE_ASSET_LIFECYCLE_ANIMATION_AUDIT.md`.

Record animation needs while designing: actual gameplay states, directional requirements, equipment consistency, shared feet/root pivot and static fallback. Leave requirements undecided when gameplay does not yet establish them; do not multiply every new design into a fixed frame/direction set. Animation is a later linked production job using the accepted master and dedicated frame references. Clip/atlas tooling and a paused presentation clock are proposed, not currently available. Missing animation must retain the accepted static/procedural path.

## Start a later chat

Read `DEVELOPMENT_STATE.md`, this workflow, `SPRITE_PRODUCTION_CURRENT_CONTEXT.md`, the relevant content/lore documents and the design handoff. Confirm the latest source and the record's next action. Use existing acceptance and authorization within their recorded scope. If the user requests sprites for an accepted design, perform the handoff, reference and exact-key preparation as part of that request; do not assign repository chores to Joel.
