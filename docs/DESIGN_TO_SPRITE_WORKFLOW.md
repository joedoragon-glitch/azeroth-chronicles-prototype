# Conversation → procedural design → sprites

Joel's 8 October 2026 instruction makes sprite delivery part of the content workflow. It applies to new hero classes, characters, monsters, companions, NPCs, structures, scenery, terrain and visible objects introduced by locations or lore. The procedural design establishes the intended visual canon. Joel permits natural anatomy and material-appropriate contours when procedural primitives produced accidental blocky forms; preserve identity and function rather than literal polygon artifacts. Once Joel accepts that design and requests sprites, continue from its accepted reference in the originating chat or another chat; do not restart the design from a name or an old catalog prompt.

This is an agent workflow. Joel can give feedback and request the next stage in ordinary conversation. The agent owns records, catalog updates, reference capture, processing, checks, implementation and publication within the authorized task. A request for procedural design alone does not silently authorize generating or activating final sprites. Existing authorization to produce sprites does not need another technical permission round.

## Persistent handoff

At the end of content/design work, write or update a per-design record under `tools/sprites/design-handoffs/<stable-design-id>.json`, using `tools/sprites/design-handoff-template.json`. Keep its durable reference in the content issue/PR and relevant location/lore document. These records track the transition; the prompt catalog, exact specifications and approved registry keep their existing ownership. Do not copy those registries into a second catalog.

Record the actual request and approval scope in plain language, with a chat link when available and a repository issue/PR documenting the decision. Include the source commit, exact renderer branch/state, isolated procedural reference, actual gameplay context, hashes and the visible traits to preserve. Retain these references as repository assets, rather than relying on temporary chat files. If a conversation link is unavailable, mark that explicitly and preserve the dated decision summary. Never invent an approval, hash, URL or exact runtime key. An engineer's recorded decision is traceability, not independently authenticated creative approval.

The handoff must distinguish concept acceptance, procedural-design acceptance, permission to produce sprites, generated-image acceptance and release status. Approval of a procedural design establishes what the sprite must faithfully translate; it does not claim that an unseen generated image was accepted. Carry forward actual corrections and approval wording without introducing a new creative gate when the task already authorizes faithful implementation. The original pilot remains in `tools/sprites/pilots/2026-10-08`; the approved playful Goblin correction and release records are in `tools/sprites/pilots/2026-10-08-refined`.

## Current 150% production and interruption recovery

Joel resumed autonomous adaptation, remaining sprite/texture generation, implementation, verification and publication on 9 October 2026. Earlier pauses are historical. Follow [SPRITE_ORIGINAL_MASTER_EXPORT_POLICY.md](SPRITE_ORIGINAL_MASTER_EXPORT_POLICY.md): fresh exports from untouched generator outputs of accepted revisions, never enlarged 100% runtime exports. Audit older padded/resized intermediates; where they discarded detail, rebuild directly from the original with the required placement metadata. Review each result in actual 150% game scenes and simplify or regenerate if its detail still reads poorly. Preserve all originals and checkpoints. Read `SPRITE_WORKFLOW_AUDIT.md` and `SPRITE_RESOLUTION_HOUSEKEEPING.md` before new production. Use `sprite:request` to capture validated exact prompt/reference/context evidence after reconciling the actual accepted handoff; inspect and attach retained accepted originals for edits. This planning capture does not establish creative acceptance or grant generation permission. Retain exact tool request/result IDs and source attachments; never invent missing historical provenance.

Body rasters target 576×576 pixels over unchanged 192×192 logical geometry. Review native 150% scenes, including affected clips/variants. Sprite and terrain publication use a persistent interruption journal; a pending journal blocks validation/publication until `sprite:recover` or `material:recover` restores the prior registry pair. Never bypass recovery by deleting the journal. Existing originals and checkpoints remain immutable.

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

Keep design identity and numbered catalog IDs stable. Version 0.8.92 hashes each asset's isolated procedural reference, exact binding/runtime geometry and catalog section. Global hashes remain snapshots; unrelated maps, code and catalog additions do not invalidate accepted art. A real change to that asset's reference or contract requires comparison and renewed evidence, rather than automatic regeneration.

The format supports optional stable-ID variants and named clips with explicit frame rectangles, durations and shared root pivots. Generate each frame separately from the accepted master, then assemble deterministic atlas pages through `attach-clip`. The shared presentation clock freezes with gameplay pause; missing animation falls back to the accepted static image, then procedural rendering. Engine movement, combat timing and collision stay authoritative. Authored directions are optional; no automatic mirroring or universal frame multiplier is imposed.

## Request an edit in any chat

A request such as “change the goblin's ears and put it in the game” is an edit-and-implementation job. Run `npm run sprite:asset -- "goblin"` to resolve the catalog identity, current immutable source, active revision, attached clips/variants and rollback history. Exact keys or catalog IDs resolve directly. Ambiguous names return choices; use the conversation/location context to identify the requested asset before editing. Unregistered designs resume their accepted handoff.

Inspect and edit the retained source with the image-generation tool, carrying forward accepted traits and the material-appropriate shape rule. Preserve both originals. Review native scale and actual desktop/phone scenes, prepare the new candidate and record actual feedback and authorized faithful implementation separately. Do not invent acceptance of an unseen image or add another technical permission round to an already authorized request.

Update affected animation frames and variants together. If they cannot be made consistent in this revision, release the new static fallback with the stale dependent presentation omitted. Do not mix an edited body with obsolete frames. Atlas attachment resets the final review so the assembled animation receives an actual visual check.

Use `sprite:replace <candidate.json> <expected-active-revision>`; a stale lease rejects the edit rather than overwriting another chat's work. The registry retains the former source, output, review and presentation. Use `sprite:rollback <key> <target-revision> <expected-active-revision>` to restore it; restoring a removed registration uses the explicit lease `absent`. Old sources remain available. Rebuild/version, validate the registry and offline resources, run relevant device checks, publish and verify the deployed build. Record the resulting revision and release reference in the same change. The agent owns this sequence.

## Start a later chat

Read `DEVELOPMENT_STATE.md`, this workflow, `SPRITE_PRODUCTION_CURRENT_CONTEXT.md`, the relevant content/lore documents and the design handoff. Confirm the latest source and the record's next action. Use existing acceptance and authorization within their recorded scope. If the user requests sprites for an accepted design, perform the handoff, reference and exact-key preparation as part of that request; do not assign repository chores to Joel.
