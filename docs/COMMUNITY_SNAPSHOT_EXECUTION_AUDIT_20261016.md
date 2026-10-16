# Community Snapshot execution audit — 16 October 2026

Historical audit of `7581ed12d57e70e42bbaed6b8223bc8d4c709b22`; the [follow-up source audit](COMMUNITY_SNAPSHOT_SOURCE_REAUDIT_20261016.md) records corrections and the current source-readiness verdict. Original findings below are preserved.

**Verdict: NOT READY FOR FINAL VALIDATION. Three high-priority and four medium-priority findings remain open.** The earlier source-ready label was premature and is withdrawn. This is a source audit of the implementation, not an independent runtime certification. The implementing agent performed this review; no separate reviewer or agent was used.

Audited implementation: [`7581ed12d57e70e42bbaed6b8223bc8d4c709b22`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/7581ed12d57e70e42bbaed6b8223bc8d4c709b22), tree `4a1fcd15e3676b4be367719a2522f0d539cff3a8`, branch `feature/community-snapshot-post308-20261016`. Predecessor/main: merged PR #308, `6bc27be31792b1c38147d61e98ceed6acf3e2560`. GitHub reads during this audit confirmed these heads; the Actions query for the candidate returned zero runs. The audit checkpoint changes documentation only and does not repair the frozen implementation.

## Method and limits

Read the preparation handoff, twelve-finding audit and pet catalog against the implementation record, architecture/ownership requirements, current runtime paths, added tests, existing balance and performance harnesses, art inventory and handoffs. Trace movement, skill selection, targeting, lifecycle/save, presentation and proposed acceptance paths. Treat counts and documentation as claims to examine, not evidence of completion.

No tests, syntax checks, builds, browser sessions, gameplay simulations, benchmarks, workflow dispatches, PR creation, merge or deployment were performed. Reading test source is not running it. Runtime quality, actual balance, native-size appearance, device behavior, offline behavior and measured performance remain unknown. The user's restriction legitimately defers those observations; it does not justify declaring incomplete source preparation ready.

## Open findings

### A01 — High: ranged pets can repeatedly stop without attacking

Evidence: `src/prototype/party-pets.js`, `updatePetCombat` approach branch around lines 203–224; `src/prototype/party.js`, `archerCombatPoint` around lines 875–887; `src/prototype/navigation.js`, `follow` around lines 466–467; Veyrith Whelp and Little Marshal skill definitions in `rules.js`.

These two ranged pets have a shorter second-skill range of 260. The pet adapter moves and returns before skills or basics whenever distance exceeds the minimum of its skill ranges. The reused Archer helper accepts a formation anchor as far as 280 from the enemy. On unobstructed terrain, a pet already on that anchor at distance 270 selects its own position as the destination. `follow` returns immediately, and the pet never reaches an attack decision. The next unchanged update repeats the same result. The 35-unit movement stopping tolerance also needs accounting for around the helper's preferred range of 250.

This is a defect established by the source path, not a claimed runtime reproduction. Incoming issue CS-003 was recorded as repaired, but changing the outer distance threshold did not reconcile the helper's destination policy. It can suppress a usable longer-range first skill and basic attack merely because the shorter second skill is out of reach.

Required correction: make pet positioning and stopping margins consistent with usable attack ranges, without changing approved troop navigation or enemy AI. Permit available attacks while the shorter skill is unavailable. Author automatic update-path cases at the 260/280 boundaries, stationary formation anchors, obstructed lines and movement stopping margins; execute only after authorization. Revisit F01/F06/F08 and CS-003.

### A02 — High: the art inventory does not substantiate a comprehensive case-by-case aesthetic review

Evidence: `tools/community-snapshot/procedural-art-inventory.json`, `docs/COMMUNITY_SNAPSHOT_ART_AUDIT_20261016.md`, and `src/prototype/visuals.js`, `wildProp` around lines 198–199.

The 367 records are a useful draft census, and substantive changes to selected creatures, structures and props exist. However, 135 records repeat the same generic retention rationale, 50 service records repeat another, and broad entries such as shared specialists collapse several distinct designs. Many source references name a whole drawing layer rather than a reachable branch. These do not establish individual aesthetic evaluation. One concrete census error is `environment:wild-tree-crown`: `wildProp` always selects rock when region is 4, so this is not a reachable Crown tree path in that renderer.

The count mixes family, regional, construction and shared-layer records. It cannot be used as a count of independently examined designs. Preserving all 33 registered illustrated identities is valuable but does not establish the quality of their procedural fallbacks.

Required correction: reconcile reachable cases and variants with precise owners/branches, identify grouped shared designs explicitly, and record specific observations and reasons for change or retention. Separate source observations from native-size acceptance. Relabel the current inventory as a draft until this work is complete. Actual desktop/mobile aesthetic review remains deferred under the user's restriction; no browser review is requested now. Revisit F11.

### A03 — High: the authored validation does not yet answer the automatic-combat and late-game balance requirements

Evidence: `tests/community-pets.test.cjs` around lines 92–105; `scripts/combined-skill-balance.cjs`; its fixture in `scripts/cooldown-balance-audit.cjs`; the balance report and validation checklist.

The all-eleven pet cases provide useful lifecycle, direct skill, save and charge coverage. They invoke first and second skills directly against a nearby target. Advancing the party during an existing hold does not exercise normal ranged approach, retreat, automatic choice and basic projectile use for each pet. A01 can therefore survive these checks. Other promised cases, including every family's first real unlock and important transitions while charging, are broader in prose than in the new executable coverage.

The existing combined balance matrix runs Normal difficulty with solo or six Soldier/Archer parties. It contains no mixed/six-pet party matrix, no Nightmare comparison, and no matched predecessor/candidate comparison of the new troop behavior. Existing encounter telemetry does not provide the companion-specific survival, casts, protection, interruption and movement downtime requested for judging usefulness. Retaining that suite is correct; describing it alongside a future checklist is not equivalent to preparing the new balance study.

Required correction: author automatic per-pet combat cases, focused missing entitlement/lifecycle cases and an explicit matched late-game comparison matrix. Include Highlands/Frontier/Crown, troop-only and pet compositions, relevant progression conditions, difficulties and companion telemetry. Define configuration, baseline and interpretation before execution. Do not invent final tuning or run the matrix during this phase. Revisit F01/F03/F05/F07/F08/F12.

### A04 — Medium: the new browser fixture cannot support its claimed visual coverage

Evidence: `tests/community-snapshot-browser.test.cjs`, region loop and gallery/screenshot sequence; validation checklist's desktop/phone section.

The fixture paints regions at the hero spawn with six pets, without simulating or deliberately activating skills. A nonempty whole-canvas assertion can pass from terrain alone. The effect-bound assertion is made without deliberately populating effects. Each regional painting is overwritten, then the canvas is cleared for a gallery; only that final gallery is captured. The gallery alternates facing by family instead of drawing each family in both directions, despite its comment. Changed enemies, buildings, entrances, charged effects and collection menus are not deliberately staged and captured by this new fixture.

Required correction: retain useful renderer-purity assertions, but add targeted reachable scenes and saved captures for changed art, both facings of each pet, actual charge/impact/status presentation and collection/recovery UI. Use actor-specific assertions where feasible and human visual acceptance for aesthetics. Label drawing coverage separately from gameplay and visual acceptance. Preserve the existing browser/snapshot gates. Revisit F02/F09/F11/F12.

### A05 — Medium: pet area damage incorrectly excludes dust-covered collateral targets

Evidence: `party-pets.js`, `petSkillTargets` around lines 94–102; `combat.js`, `tacticalDirectTargetable` around lines 267–268 and `damage` around lines 487–491.

Pet targeting filters every candidate through `tacticalDirectTargetable`, including circle, cone and line collateral. Rogue dust cover makes that predicate false. The existing damage owner deliberately applies this exclusion only to non-area damage. Passing `{area: true}` later cannot restore the pet targets already discarded. A pet aiming at an eligible enemy therefore cannot damage a covered neighboring enemy inside its area, contrary to the existing area/direct distinction.

Required correction: distinguish valid direct aim from area collateral eligibility; preserve neutral/returning exclusions, terrain and caps. Do not grant direct aim at a covered enemy. Add a covered-collateral case beside an eligible primary target for each relevant shape. Revisit F08 and the #308 compatibility contract.

### A06 — Medium: skill teaching and presentation omit meaningful distinctions between pet moves

Evidence: `party-pets.js`, `petSkillSummary` around lines 56–74 and `petSkill` event payload; menu/Keeper consumers; `renderer.js`, `petSkill` around lines 1100–1120.

The shared player explanation lists damage, target cap, cooldown and status values but omits range and shape. Keeper entries reuse that summary, so players cannot learn which moves are lines, cones or target-centered circles there. The renderer uses essentially the same small ellipse for every pet skill and a short selected-target line for some shapes. It ignores the supplied radius and does not represent the configured cone/line dimensions. Distinct mechanical definitions exist, but their names and colors alone do not adequately communicate how to use them.

Required correction: add concise shape/range/targeting descriptions through the existing information owners and readable procedural charge/impact distinctions grounded in the existing geometry. Keep presentation subordinate to combat and do not expand into a new audiovisual system. Confirm native readability later. Revisit F09 and pet identity requirements.

### A07 — Medium: procedural design provenance is stale or points to a commit without the design

Evidence: the eleven `tools/sprites/design-handoffs/companion-pet-*.json` records; existing `abyss-dragon.json`, `crown-direwolf-riders.json` and `lantern-wraith-light.json`; `AGENTS.md` and `docs/DESIGN_TO_SPRITE_WORKFLOW.md`.

The new pet handoffs identify #308 as their `sourceCommit`, although that immutable commit contains no pet artwork. Existing affected handoffs still describe earlier accepted appearances and evidence without recording that the shared procedural body was changed. A moving branch/path and historical accepted record cannot substitute for an immutable candidate reference with its own unverified status.

Required correction: point candidate references at the actual implementation checkpoint, retain predecessor canon separately, and reconcile handoffs for changed existing designs and shared variants. Preserve old approval/evidence as history and explicitly defer native acceptance. This is traceability work within existing authorization, not a request for another design-approval gate. Revisit F02/F11 and repository design ownership.

## Requirement and preparation-audit disposition

| Requirement | Source audit disposition |
| --- | --- |
| Follow #308; consolidated recoverable branch | Baseline and branch ordering confirmed. No PR, release or deployment initiated. |
| Comprehensive procedural improvement | Real selected improvements; comprehensive review remains incomplete (A02/A04/A07). Native appearance unknown. |
| Late-game Soldier/Archer | Narrow veteran changes account for existing immunity/support. Adequacy remains unestablished; comparison preparation incomplete (A03). |
| Eleven collectible TRUE pets | Shared catalog/engine, explicit discriminator, dedicated drawing path, historical `s.true` ownership, roster/recovery integration exist. Combat/teaching defects remain (A01/A05/A06). |
| Incoming corrections | Register exists, but CS-003 disposition was premature. No additional owner-supplied gameplay bug was received. |
| Safe performance | Pure presentation hash memo and assessment documentation exist. No broader combat/AI optimization identified in reviewed changes; no benefit measured. |
| Saves, module graph and integration | Explicit pet validation, uniqueness, growth and recovery paths exist. v4 correctness remains untested. Generated artifacts intentionally remain #308 until authorized build. |
| Final validation readiness | Fails source-readiness review. Correct A01–A07 and re-audit before requesting execution. |

Preparation F01–F06 have substantial explicit source treatment; that does not close their runtime obligations, and A01 affects F01/F06. F07 has source rationale but lacks the prepared comparison required to establish late-game adequacy. F08 has a shared ally implementation rather than imported boss AI, with A01/A05 still open. F09 is partial (A06). F10's scope separation is respected in reviewed source, with measured evidence deferred. F11 is incomplete (A02/A04/A07). F12 is incomplete because readiness was overstated (A03/A04); the no-execution restriction itself was respected.

## Next checkpoint criteria

Address all seven findings within the same feature branch, update the incoming register and relevant design/source receipts, and preserve a coherent corrected source checkpoint. Re-audit the actual new source paths and authored acceptance coverage without executing them. Only then identify the exact candidate for owner-authorized validation. Tests, builds, CI, browser work and deployment remain prohibited now. Do not merge or deploy after validation without separate release authorization.

The implementation has a useful shared foundation; this audit does not recommend discarding it or rewriting the party system. It does require retracting the readiness claim and doing the missing source work before spending the overnight validation cycle on this candidate.
