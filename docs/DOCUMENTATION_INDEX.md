# Documentation directory — what each document is for

**So I Became the Dark Lord's Problem** · Draft directory updated 28 October 2026 · **419 Markdown documents indexed**.

Every tracked Markdown document appears **once** below, grouped by subject, with a one-sentence purpose. This page helps you choose which file to open. It is **not** a release ledger, approval list, proof of implementation or invitation to resume an old task.

**Read first:** [Development state](DEVELOPMENT_STATE.md) owns verified public-build and acceptance information; [Architecture](ARCHITECTURE.md) maps source owners; [Decisions](DECISIONS.md) gives design rules and supersessions; [AGENTS.md](../AGENTS.md) governs authorization; [Engineering workflow](MECHANIC_DEVELOPMENT.md) describes verification; [Brand identity](BRAND_IDENTITY.md) gives the official title and legacy exceptions.

**Checkpoint:** `dev.209` was published on GitHub Pages ([release #40741421490](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40741421490)); the changed listening room and documentation in draft [PR #563](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/563) remain unpublished. Check GitHub for anything newer.

**Description caveat:** Core guides and representative historical files were checked against their contents. For other older files, these brief finding-aid descriptions use their titles, subjects and provisional registry classifications—not a claim that all 419 bodies were independently audited. Labels such as *Dated record* describe source context, not a present work order.

## Jump to a subject

- [Essential guides and active project policy](#essential-guides-and-active-project-policy) (11)
- [Music, sound effects and audio production](#music-sound-effects-and-audio-production) (14)
- [Hero abilities, combat, enemies and bosses](#hero-abilities-combat-enemies-and-bosses) (121)
- [Companions, Barracks, pets and specialists](#companions-barracks-pets-and-specialists) (19)
- [World, geography, travel and narrative](#world-geography-travel-and-narrative) (42)
- [Sprite art, textures and visual design](#sprite-art-textures-and-visual-design) (55)
- [Rendering, optimization, performance and WebGL experiments](#rendering-optimization-performance-and-webgl-experiments) (44)
- [Navigation, maps and pathfinding](#navigation-maps-and-pathfinding) (5)
- [Menus, controls, HUD and usability](#menus-controls-hud-and-usability) (11)
- [Save data, backup and recovery](#save-data-backup-and-recovery) (5)
- [Documentation governance and reference records](#documentation-governance-and-reference-records) (16)
- [Historical releases, reviews and integration handoffs](#historical-releases-reviews-and-integration-handoffs) (37)
- [Other dated system findings](#other-dated-system-findings) (39)

## Essential guides and active project policy

- [Agents](../AGENTS.md) — *Maintained guide.* Standing developer/AI-agent instructions for authorization, focused testing, documentation and releases.
- [Controles](../CONTROLES.md) — *Reference.* Legacy Spanish controls entrypoint that directs players to the current complete Spanish guide.
- [Architecture](ARCHITECTURE.md) — *Maintained guide.* Current Campaign execution map and source ownership across combat, saves, rendering, sound and builds.
- [Brand Identity](BRAND_IDENTITY.md) — *Maintained guide.* Official title, Spanish promotional rendering and technical legacy identifiers to preserve.
- [Communication Style](COMMUNICATION_STYLE.md) — *Maintained guide.* Voice and scope guidance for writing the owner's public posts and player-facing updates.
- [Decisions](DECISIONS.md) — *Maintained guide.* Gameplay and world rules, with dated revisions reorganized into nine subjects.
- [Development State](DEVELOPMENT_STATE.md) — *Maintained guide.* Verified published-build checkpoint, implemented features, pending work and acceptance limits.
- [Documentation Index](DOCUMENTATION_INDEX.md) — *Maintained guide.* This annotated directory, explaining the purpose of every tracked Markdown document.
- [Mechanic Development](MECHANIC_DEVELOPMENT.md) — *Maintained guide.* Engineering workflow for authorized changes, regression checks, documentation and integration.
- [Guia En Espanol](../GUIA_EN_ESPANOL.md) — *Maintained guide.* Full Spanish player guide: controls, game progression, saving, language choice and repository help.
- [Game README](../README.md) — *Maintained guide.* Player introduction, links to the playable game, controls, saves, graphics and development information.

## Music, sound effects and audio production

- [Audio Authoring](AUDIO_AUTHORING.md) — *Maintained guide.* Audio recipe rendering, manifest registration, attribution and production validation.
- [Audio Environment](AUDIO_ENVIRONMENT.md) — *Reference.* Environmental sound beds, their synthesis source and location/scene playback rules.
- [Audio Foundation](AUDIO_FOUNDATION.md) — *Reference.* Reference structure or catalog for audio, with its original assumptions and scope.
- [Audio Playback](AUDIO_PLAYBACK.md) — *Maintained guide.* Current audio engine, mixers, production scenes and standalone listening-room behavior.
- [Audio Sound Pass](AUDIO_SOUND_PASS.md) — *Design reference.* Artistic identities of the soundtrack's 83 music cues and guidance for future composition.
- [Audio Stage1 Coverage 20261025](AUDIO_STAGE1_COVERAGE_20261025.md) — *Dated record.* Development-only observer for tracing game event coverage by the audio layer.
- [Audio Stage2 Recovery 20261025](AUDIO_STAGE2_RECOVERY_20261025.md) — *Dated record.* Dated stage for Web Audio startup, interruption recovery and fallback.
- [Audio Stage3 Handoff 20261025](AUDIO_STAGE3_HANDOFF_20261025.md) — *Dated record.* Preserves audio context, known work and next-stage questions from a dated handoff.
- [Audio Stage3 Real Action Audit 20261025](AUDIO_STAGE3_REAL_ACTION_AUDIT_20261025.md) — *Dated record.* Tests real native game actions against audible cues rather than event-name assumptions.
- [Audio Stage4 Mix Audit 20261025](AUDIO_STAGE4_MIX_AUDIT_20261025.md) — *Dated record.* Checks audio mixing and sound-stage acceptance at the original review checkpoint.
- [Audio Stage5 Release Preflight 20261025](AUDIO_STAGE5_RELEASE_PREFLIGHT_20261025.md) — *Dated record.* Historical audio release-readiness gates and unresolved checks; not a new work order.
- [Enemy Audio Coverage](ENEMY_AUDIO_COVERAGE.md) — *Reference.* Enemy actions that should make sound and deliberate silence/coverage decisions.
- [Enemy Audio Final Audit](ENEMY_AUDIO_FINAL_AUDIT.md) — *Reference.* Examines enemy audio final for source or design inconsistencies, recording dated findings and limits.
- [Enemy Audio Synchronization](ENEMY_AUDIO_SYNCHRONIZATION.md) — *Reference.* Timing of enemy audio relative to attack resolution and visual telegraphs.

## Hero abilities, combat, enemies and bosses


### Rogue/Bard fourth-class work

- [Night Ringleader Rogue 20261020](NIGHT_RINGLEADER_ROGUE_20261020.md) — *Dated record.* Describes night ringleader rogue decisions, constraints or engineering observations from its original development checkpoint.
- [Release Candidate Healing Rogue 20261025](RELEASE_CANDIDATE_HEALING_ROGUE_20261025.md) — *Dated record.* Documents historical release planning, gates and evidence for healing rogue.
- [Rogue AI Phase2](ROGUE_AI_PHASE2.md) — *Reference.* Describes a particular development stage of rogue AI and its recorded work status.
- [Rogue Bard Canonical Owner Handoff 20261027](ROGUE_BARD_CANONICAL_OWNER_HANDOFF_20261027.md) — *Design reference.* Preserves rogue bard canonical owner context, known work and next-stage questions from a dated handoff.
- [Rogue Bard Class Independence Audit 20261027](ROGUE_BARD_CLASS_INDEPENDENCE_AUDIT_20261027.md) — *Dated record.* Examines rogue bard class independence for source or design inconsistencies, recording dated findings and limits.
- [Rogue Bard Discussion Record 20261026](ROGUE_BARD_DISCUSSION_RECORD_20261026.md) — *Dated record.* Preserves owner discussion and evolving decisions about rogue bard discussion, subject to later rulings.
- [Rogue Bard Dual Sided Performances Critical Tiers 20261027](ROGUE_BARD_DUAL_SIDED_PERFORMANCES_CRITICAL_TIERS_20261027.md) — *Dated record.* Discusses rogue bard dual sided performances critical tiers measurements, bottlenecks or optimization trade-offs.
- [Rogue Bard Eight Phase Development Handoff 20261027](ROGUE_BARD_EIGHT_PHASE_DEVELOPMENT_HANDOFF_20261027.md) — *Dated record.* Preserves rogue bard eight phase development context, known work and next-stage questions from a dated handoff.
- [Rogue Bard Fourth Class Feasibility 20261026](ROGUE_BARD_FOURTH_CLASS_FEASIBILITY_20261026.md) — *Dated record.* Investigates rogue bard fourth class feasibility as a proposal or pilot without establishing production readiness.
- [Rogue Bard Fourth Class Housekeeping 20261027](ROGUE_BARD_FOURTH_CLASS_HOUSEKEEPING_20261027.md) — *Dated record.* Describes rogue bard fourth class housekeeping decisions, constraints or engineering observations from its original development checkpoint.
- [Rogue Bard Gameplay Balance Candidate 20261026](ROGUE_BARD_GAMEPLAY_BALANCE_CANDIDATE_20261026.md) — *Dated record.* Describes rogue bard gameplay balance decisions, constraints or engineering observations from its original development checkpoint.
- [Rogue Bard Implementation Housekeeping 20261026](ROGUE_BARD_IMPLEMENTATION_HOUSEKEEPING_20261026.md) — *Dated record.* Explains how rogue bard housekeeping was to be integrated, with its checkpoint-specific implementation evidence.
- [Rogue Bard Live Playtest Gate 20261027](ROGUE_BARD_LIVE_PLAYTEST_GATE_20261027.md) — *Dated record.* Records tests or acceptance criteria for rogue bard live playtest gate at its original checkpoint.
- [Rogue Bard Mainline Reconciliation 20261027](ROGUE_BARD_MAINLINE_RECONCILIATION_20261027.md) — *Dated record.* Compares rogue bard mainline with related source, feature decisions or branch changes.
- [Rogue Bard Owner Review 20261026](ROGUE_BARD_OWNER_REVIEW_20261026.md) — *Dated record.* Preserves owner discussion and evolving decisions about rogue bard owner, subject to later rulings.
- [Rogue Bard Phase2 Hero Foundation 20261027](ROGUE_BARD_PHASE2_HERO_FOUNDATION_20261027.md) — *Dated record.* Describes a particular development stage of rogue bard hero and its recorded work status.
- [Rogue Bard Phase3 Technical Closeout 20261027](ROGUE_BARD_PHASE3_TECHNICAL_CLOSEOUT_20261027.md) — *Dated record.* Describes a particular development stage of rogue bard technical closeout and its recorded work status.
- [Rogue Bard Phase5 Musical Repertoire 20261027](ROGUE_BARD_PHASE5_MUSICAL_REPERTOIRE_20261027.md) — *Dated record.* Designs the Rogue's performance-based abilities and musical repertoire during staged development.
- [Rogue Bard Phase5 Names And Critical Alignment 20261027](ROGUE_BARD_PHASE5_NAMES_AND_CRITICAL_ALIGNMENT_20261027.md) — *Dated record.* Describes a particular development stage of rogue bard names and critical alignment and its recorded work status.
- [Rogue Bard Phase5 Phase6 Restart Checkpoint 20261027](ROGUE_BARD_PHASE5_PHASE6_RESTART_CHECKPOINT_20261027.md) — *Dated record.* Describes a particular development stage of rogue bard restart and its recorded work status.
- [Rogue Bard Phase6 Native Critical Continuation 20261027](ROGUE_BARD_PHASE6_NATIVE_CRITICAL_CONTINUATION_20261027.md) — *Dated record.* Preserves rogue bard native critical continuation context, known work and next-stage questions from a dated handoff.
- [Rogue Bard Phases 1 To 3 Consolidation 20261027](ROGUE_BARD_PHASES_1_TO_3_CONSOLIDATION_20261027.md) — *Dated record.* Describes a particular development stage of rogue bard phases 1 to 3 consolidation and its recorded work status.
- [Rogue Bard PR511 Description Archive 20261027](ROGUE_BARD_PR511_DESCRIPTION_ARCHIVE_20261027.md) — *Dated record.* Describes rogue bard description archive decisions, constraints or engineering observations from its original development checkpoint.
- [Rogue Foundation Phase1](ROGUE_FOUNDATION_PHASE1.md) — *Reference.* Describes a particular development stage of rogue and its recorded work status.
- [Rogue PR146 Integration Audit](ROGUE_PR146_INTEGRATION_AUDIT.md) — *Reference.* Examines rogue for source or design inconsistencies, recording dated findings and limits.
- [Rogue Ranged Pressure DEV184 20261025](ROGUE_RANGED_PRESSURE_DEV184_20261025.md) — *Dated record.* Describes rogue ranged pressure decisions, constraints or engineering observations from its original development checkpoint.
- [Rogue Territorial Escalation 20261025](ROGUE_TERRITORIAL_ESCALATION_20261025.md) — *Dated record.* Describes rogue territorial escalation decisions, constraints or engineering observations from its original development checkpoint.

### Critical Executions, Codices and PR #440

- [Critical Companion Survival DEV141](CRITICAL_COMPANION_SURVIVAL_DEV141.md) — *Dated record.* Describes critical companion survival decisions, constraints or engineering observations from its original development checkpoint.
- [Critical Executions And Unforeseen Codices Design 20261024](CRITICAL_EXECUTIONS_AND_UNFORESEEN_CODICES_DESIGN_20261024.md) — *Dated record.* Design for Critical Executions and collectible Codices, separate from live integration proof.
- [Critical Executions Feasibility Performance Implementation Audit 20261024](CRITICAL_EXECUTIONS_FEASIBILITY_PERFORMANCE_IMPLEMENTATION_AUDIT_20261024.md) — *Dated record.* Examines critical executions feasibility performance for source or design inconsistencies, recording dated findings and limits.
- [Critical Executions Stage0 Action Catalog PR439 20261025](CRITICAL_EXECUTIONS_STAGE0_ACTION_CATALOG_PR439_20261025.md) — *Dated record.* Describes a particular development stage of critical executions action catalog and its recorded work status.
- [Critical Executions Stage1 Dormant Core 20261024](CRITICAL_EXECUTIONS_STAGE1_DORMANT_CORE_20261024.md) — *Dated record.* Preserves an early dormant Critical Executions core, before later native campaign activation.
- [Critical Executions Stage2 Party Receipt Checkpoint 20261024](CRITICAL_EXECUTIONS_STAGE2_PARTY_RECEIPT_CHECKPOINT_20261024.md) — *Dated record.* Describes a particular development stage of critical executions party receipt and its recorded work status.
- [Critical Executions Three Level Strength Policy 20261024](CRITICAL_EXECUTIONS_THREE_LEVEL_STRENGTH_POLICY_20261024.md) — *Dated record.* Specifies intended critical executions three level strength behavior or boundaries, subject to later decisions.
- [Critical Freeze Restart Recovery 20261023](CRITICAL_FREEZE_RESTART_RECOVERY_20261023.md) — *Dated record.* Describes critical freeze restart recovery decisions, constraints or engineering observations from its original development checkpoint.
- [Critical Safe Contributions DEV143](CRITICAL_SAFE_CONTRIBUTIONS_DEV143.md) — *Dated record.* Investigates whether endangered companions can fight without stepping into active hazards.
- [PR440 Critical Stage2 Stop Checkpoint 20261025](PR440_CRITICAL_STAGE2_STOP_CHECKPOINT_20261025.md) — *Dated record.* Describes a particular development stage of critical stop and its recorded work status.
- [PR440 DEV191 Reviewed Sprite Scope Delta 20261025](PR440_DEV191_REVIEWED_SPRITE_SCOPE_DELTA_20261025.md) — *Dated record.* Examines reviewed sprite scope delta for source or design inconsistencies, recording dated findings and limits.
- [PR440 DEV192 PIXI Main Reconciliation 20261026](PR440_DEV192_PIXI_MAIN_RECONCILIATION_20261026.md) — *Dated record.* Compares PIXI main with related source, feature decisions or branch changes.
- [PR440 Independent Work Handoff 20261024](PR440_INDEPENDENT_WORK_HANDOFF_20261024.md) — *Dated record.* Preserves independent work context, known work and next-stage questions from a dated handoff.
- [PR440 Integrated Candidate Audit Handoff 20261025](PR440_INTEGRATED_CANDIDATE_AUDIT_HANDOFF_20261025.md) — *Dated record.* Examines integrated for source or design inconsistencies, recording dated findings and limits.
- [PR440 Stage Gates And Regression Matrix 20261024](PR440_STAGE_GATES_AND_REGRESSION_MATRIX_20261024.md) — *Dated record.* Describes a particular development stage of stage gates and regression matrix and its recorded work status.
- [PR440 Stage2 Gate Stage3 Native Handoff 20261025](PR440_STAGE2_GATE_STAGE3_NATIVE_HANDOFF_20261025.md) — *Dated record.* Preserves gate native context, known work and next-stage questions from a dated handoff.
- [PR440 Stage2 Pets Native Checkpoint 20261025](PR440_STAGE2_PETS_NATIVE_CHECKPOINT_20261025.md) — *Dated record.* Describes a particular development stage of pets native and its recorded work status.
- [PR440 Stage3 Boss Grouped Implementation 20261025](PR440_STAGE3_BOSS_GROUPED_IMPLEMENTATION_20261025.md) — *Dated record.* PR #440 checkpoint for grouped boss Critical Executions and its native implementation evidence.
- [PR440 Stage3 Captains Verified Boss Entry Handoff 20261025](PR440_STAGE3_CAPTAINS_VERIFIED_BOSS_ENTRY_HANDOFF_20261025.md) — *Dated record.* Preserves captains verified boss entry context, known work and next-stage questions from a dated handoff.
- [PR440 Stage3 Cross Pr Compatibility Audit 20261025](PR440_STAGE3_CROSS_PR_COMPATIBILITY_AUDIT_20261025.md) — *Dated record.* Examines cross pr compatibility for source or design inconsistencies, recording dated findings and limits.
- [PR440 Stage3 Special Actions Native Checkpoint 20261025](PR440_STAGE3_SPECIAL_ACTIONS_NATIVE_CHECKPOINT_20261025.md) — *Dated record.* Describes a particular development stage of special actions native and its recorded work status.

### Hero abilities, skills, cooldowns and combat controls

- [Asymmetric Tap Charged Cooldowns 20261024](ASYMMETRIC_TAP_CHARGED_COOLDOWNS_20261024.md) — *Dated record.* Describes asymmetric tap charged cooldowns decisions, constraints or engineering observations from its original development checkpoint.
- [Charge Slow Consolidation 20261015](CHARGE_SLOW_CONSOLIDATION_20261015.md) — *Dated record.* Describes charge slow consolidation decisions, constraints or engineering observations from its original development checkpoint.
- [Cooldown Balance Audit 20261009](COOLDOWN_BALANCE_AUDIT_20261009.md) — *Dated record.* Examines cooldown balance for source or design inconsistencies, recording dated findings and limits.
- [Cooldown Balance Next Chat](COOLDOWN_BALANCE_NEXT_CHAT.md) — *Reference.* Preserves cooldown balance context, known work and next-stage questions from a dated handoff.
- [Cooldown Only Combat Migration](COOLDOWN_ONLY_COMBAT_MIGRATION.md) — *Reference.* Rules for migrating from mana-driven combat to cooldown-only abilities.
- [Enemy Skill VFX Audit](ENEMY_SKILL_VFX_AUDIT.md) — *Reference.* Examines enemy skill VFX for source or design inconsistencies, recording dated findings and limits.
- [Enemy Skill VFX Foundation](ENEMY_SKILL_VFX_FOUNDATION.md) — *Reference.* Reference structure or catalog for enemy skill VFX, with its original assumptions and scope.
- [Enemy Skill VFX Quality Audit](ENEMY_SKILL_VFX_QUALITY_AUDIT.md) — *Reference.* Examines enemy skill VFX for source or design inconsistencies, recording dated findings and limits.
- [Enemy Skill VFX Work Handoff](ENEMY_SKILL_VFX_WORK_HANDOFF.md) — *Reference.* Preserves enemy skill VFX work context, known work and next-stage questions from a dated handoff.
- [Forts Ranger Passage 20261020](FORTS_RANGER_PASSAGE_20261020.md) — *Dated record.* Describes forts ranger passage decisions, constraints or engineering observations from its original development checkpoint.
- [Hero Class Skills 2 8 Consolidated Review 20261015](HERO_CLASS_SKILLS_2_8_CONSOLIDATED_REVIEW_20261015.md) — *Dated record.* Examines hero class skills 2 8 consolidated for source or design inconsistencies, recording dated findings and limits.
- [Hero Guided Survival DEV145](HERO_GUIDED_SURVIVAL_DEV145.md) — *Dated record.* Describes hero guided survival decisions, constraints or engineering observations from its original development checkpoint.
- [Hero Skill AV Combined Verification 20261015](HERO_SKILL_AV_COMBINED_VERIFICATION_20261015.md) — *Dated record.* Records tests or acceptance criteria for hero skill av combined at its original checkpoint.
- [Hero Skill AV Development Ledger 20261015](HERO_SKILL_AV_DEVELOPMENT_LEDGER_20261015.md) — *Dated record.* Summarizes the historical status, evidence or progression of hero skill av development ledger.
- [Hero Skill AV Implementation 20261015](HERO_SKILL_AV_IMPLEMENTATION_20261015.md) — *Dated record.* Explains how hero skill av was to be integrated, with its checkpoint-specific implementation evidence.
- [Hero Skill Player Guidance Audit 20261015](HERO_SKILL_PLAYER_GUIDANCE_AUDIT_20261015.md) — *Dated record.* Examines hero skill player guidance for source or design inconsistencies, recording dated findings and limits.
- [Hero Skill1 Area1 Implementation 20261024](HERO_SKILL1_AREA1_IMPLEMENTATION_20261024.md) — *Dated record.* Explains how hero skill1 area1 was to be integrated, with its checkpoint-specific implementation evidence.
- [Hero Skill1 Area2 Implementation 20261024](HERO_SKILL1_AREA2_IMPLEMENTATION_20261024.md) — *Dated record.* Explains how hero skill1 area2 was to be integrated, with its checkpoint-specific implementation evidence.
- [Hero Skill1 Area3 Implementation 20261024](HERO_SKILL1_AREA3_IMPLEMENTATION_20261024.md) — *Dated record.* Explains how hero skill1 area3 was to be integrated, with its checkpoint-specific implementation evidence.
- [Hero Skill1 Area3 Queue Stacking Decision 20261024](HERO_SKILL1_AREA3_QUEUE_STACKING_DECISION_20261024.md) — *Dated record.* Describes hero skill1 area3 queue stacking decisions, constraints or engineering observations from its original development checkpoint.
- [Hero Skill1 Area4 Final Review 20261024](HERO_SKILL1_AREA4_FINAL_REVIEW_20261024.md) — *Dated record.* Examines hero skill1 area4 final for source or design inconsistencies, recording dated findings and limits.
- [Hero Skill1 AV And In Game Guidance Scope 20261024](HERO_SKILL1_AV_AND_IN_GAME_GUIDANCE_SCOPE_20261024.md) — *Dated record.* Specifies intended hero skill1 av and in game guidance scope behavior or boundaries, subject to later decisions.
- [Hero Skill1 Companion Dependencies 20261024](HERO_SKILL1_COMPANION_DEPENDENCIES_20261024.md) — *Dated record.* Describes hero skill1 companion dependencies decisions, constraints or engineering observations from its original development checkpoint.
- [Hero Skill1 Final Balance Spec 20261024](HERO_SKILL1_FINAL_BALANCE_SPEC_20261024.md) — *Dated record.* Describes hero skill1 final balance spec decisions, constraints or engineering observations from its original development checkpoint.
- [Hero Skill1 Self Taught Combat Design 20261024](HERO_SKILL1_SELF_TAUGHT_COMBAT_DESIGN_20261024.md) — *Dated record.* Specifies intended hero skill1 self taught combat design behavior or boundaries, subject to later decisions.
- [Hero Skills Consolidation 20261015](HERO_SKILLS_CONSOLIDATION_20261015.md) — *Dated record.* Describes hero skills consolidation decisions, constraints or engineering observations from its original development checkpoint.
- [Hero Skills Cooldown Rotation Damage Audit 20261015](HERO_SKILLS_COOLDOWN_ROTATION_DAMAGE_AUDIT_20261015.md) — *Dated record.* Examines hero skills cooldown rotation damage for source or design inconsistencies, recording dated findings and limits.
- [Hero Skills Single Integration Handoff 20261015](HERO_SKILLS_SINGLE_INTEGRATION_HANDOFF_20261015.md) — *Dated record.* Preserves hero skills single context, known work and next-stage questions from a dated handoff.
- [Hero Skills Static Balance Audit 20261015](HERO_SKILLS_STATIC_BALANCE_AUDIT_20261015.md) — *Dated record.* Examines hero skills static balance for source or design inconsistencies, recording dated findings and limits.
- [Issue463 Hero Companion Projectile Audit 20261025](ISSUE463_HERO_COMPANION_PROJECTILE_AUDIT_20261025.md) — *Dated record.* Examines issue463 hero companion projectile for source or design inconsistencies, recording dated findings and limits.
- [Mage Beam Travel And Hero Projectile Audit 20261025](MAGE_BEAM_TRAVEL_AND_HERO_PROJECTILE_AUDIT_20261025.md) — *Dated record.* Examines mage beam travel and hero projectile for source or design inconsistencies, recording dated findings and limits.
- [Mounted Roster Skills 20261020](MOUNTED_ROSTER_SKILLS_20261020.md) — *Dated record.* Reference structure or catalog for mounted roster skills, with its original assumptions and scope.
- [Pet Skill Scheduling DEV180](PET_SKILL_SCHEDULING_DEV180.md) — *Dated record.* Describes pet skill scheduling decisions, constraints or engineering observations from its original development checkpoint.
- [Ranger Support Feedback 20261020](RANGER_SUPPORT_FEEDBACK_20261020.md) — *Dated record.* Describes ranger support feedback decisions, constraints or engineering observations from its original development checkpoint.
- [Skill Journal DEV159](SKILL_JOURNAL_DEV159.md) — *Dated record.* Describes skill journal decisions, constraints or engineering observations from its original development checkpoint.
- [Skill Queue Forms DEV139](SKILL_QUEUE_FORMS_DEV139.md) — *Dated record.* Describes skill queue forms decisions, constraints or engineering observations from its original development checkpoint.
- [Slow Cooldown Interaction 20261015](SLOW_COOLDOWN_INTERACTION_20261015.md) — *Dated record.* Describes slow cooldown interaction decisions, constraints or engineering observations from its original development checkpoint.

### Enemy AI, bosses, captains and battle hazards

- [Boss Captain Range Audit](BOSS_CAPTAIN_RANGE_AUDIT.md) — *Reference.* Examines boss captain range for source or design inconsistencies, recording dated findings and limits.
- [Captain Healing And Treasury Guards 20261025](CAPTAIN_HEALING_AND_TREASURY_GUARDS_20261025.md) — *Dated record.* Describes captain healing and treasury guards decisions, constraints or engineering observations from its original development checkpoint.
- [Enemy Healing Consolidation 20261015](ENEMY_HEALING_CONSOLIDATION_20261015.md) — *Dated record.* Describes enemy healing consolidation decisions, constraints or engineering observations from its original development checkpoint.
- [Enemy Ordinary Healing DEV181](ENEMY_ORDINARY_HEALING_DEV181.md) — *Dated record.* Describes enemy ordinary healing decisions, constraints or engineering observations from its original development checkpoint.
- [Enemy Range Tuning Split 20261027](ENEMY_RANGE_TUNING_SPLIT_20261027.md) — *Dated record.* Describes enemy range tuning split decisions, constraints or engineering observations from its original development checkpoint.
- [Enemy VFX Validation](ENEMY_VFX_VALIDATION.md) — *Reference.* Records tests or acceptance criteria for enemy VFX at its original checkpoint.
- [Enemy Withdrawal DEV144](ENEMY_WITHDRAWAL_DEV144.md) — *Dated record.* Records enemy retreat and recovery behavior, including Dreadmaw's ring-closing complications.
- [Fort Repairs DEV151](FORT_REPAIRS_DEV151.md) — *Dated record.* Describes fort decisions, constraints or engineering observations from its original development checkpoint.
- [Frontier Aesthetics Boss Gather 20261020](FRONTIER_AESTHETICS_BOSS_GATHER_20261020.md) — *Dated record.* Describes frontier aesthetics boss gather decisions, constraints or engineering observations from its original development checkpoint.
- [Monster Forts Territorial Audit](MONSTER_FORTS_TERRITORIAL_AUDIT.md) — *Reference.* Examines monster forts territorial for source or design inconsistencies, recording dated findings and limits.
- [Native Range Fort Audit DEV145](NATIVE_RANGE_FORT_AUDIT_DEV145.md) — *Dated record.* Examines native range fort for source or design inconsistencies, recording dated findings and limits.
- [Nightmare Specialist Upkeep DEV145](NIGHTMARE_SPECIALIST_UPKEEP_DEV145.md) — *Dated record.* Describes nightmare specialist upkeep decisions, constraints or engineering observations from its original development checkpoint.
- [PR313 Enemy Healing 20261016](PR313_ENEMY_HEALING_20261016.md) — *Dated record.* Describes enemy healing decisions, constraints or engineering observations from its original development checkpoint.

### Other combat and survival investigations

- [Combat Arena Low Spec](COMBAT_ARENA_LOW_SPEC.md) — *Reference.* Combat-space readability and technical constraints for lower-performance devices.
- [Combat Conditions V09](COMBAT_CONDITIONS_V09.md) — *Dated record.* Meaning and presentation of status conditions in combat.
- [Combat Flow And Menus DEV126](COMBAT_FLOW_AND_MENUS_DEV126.md) — *Dated record.* Explains combat flow and menus player interaction or interface readability choices.
- [Combat Party Housekeeping](COMBAT_PARTY_HOUSEKEEPING.md) — *Reference.* Describes combat party housekeeping decisions, constraints or engineering observations from its original development checkpoint.
- [Greenwood Melee Anti Kite Pilot 20261026](GREENWOOD_MELEE_ANTI_KITE_PILOT_20261026.md) — *Dated record.* Investigates greenwood melee anti kite pilot as a proposal or pilot without establishing production readiness.
- [Greenwood Native Pursuit 20261026](GREENWOOD_NATIVE_PURSUIT_20261026.md) — *Dated record.* Describes greenwood native pursuit decisions, constraints or engineering observations from its original development checkpoint.
- [Issue463 DEV186 Integration 20261025](ISSUE463_DEV186_INTEGRATION_20261025.md) — *Dated record.* Explains how issue463 was to be integrated, with its checkpoint-specific implementation evidence.
- [Issue463 Pet Family Release Impact Audit 20261025](ISSUE463_PET_FAMILY_RELEASE_IMPACT_AUDIT_20261025.md) — *Dated record.* Examines issue463 pet family impact for source or design inconsistencies, recording dated findings and limits.
- [Issue463 Postcast Integration Readiness 20261025](ISSUE463_POSTCAST_INTEGRATION_READINESS_20261025.md) — *Dated record.* Explains how issue463 postcast readiness was to be integrated, with its checkpoint-specific implementation evidence.
- [Issue463 PR464 Independent Continuation Handoff 20261025](ISSUE463_PR464_INDEPENDENT_CONTINUATION_HANDOFF_20261025.md) — *Dated record.* Preserves issue463 independent continuation context, known work and next-stage questions from a dated handoff.
- [Issue463 Unmerged Work Compatibility Audit 20261025](ISSUE463_UNMERGED_WORK_COMPATIBILITY_AUDIT_20261025.md) — *Dated record.* Examines issue463 unmerged work compatibility for source or design inconsistencies, recording dated findings and limits.
- [Melee Basic Range Regression Audit 20261026](MELEE_BASIC_RANGE_REGRESSION_AUDIT_20261026.md) — *Dated record.* Examines melee basic range regression for source or design inconsistencies, recording dated findings and limits.
- [Melee Pursuit Expansion 20261026](MELEE_PURSUIT_EXPANSION_20261026.md) — *Dated record.* Describes melee pursuit expansion decisions, constraints or engineering observations from its original development checkpoint.
- [Melee Reach Balancing Workbench](MELEE_REACH_BALANCING_WORKBENCH.md) — *Maintained guide.* Describes melee reach balancing workbench decisions, constraints or engineering observations from its original development checkpoint.
- [Melee Reach Merge Readiness 20261026](MELEE_REACH_MERGE_READINESS_20261026.md) — *Dated record.* Documents historical release planning, gates and evidence for melee reach merge readiness.
- [Neri Projectile Pet 20261020](NERI_PROJECTILE_PET_20261020.md) — *Dated record.* Describes neri projectile pet decisions, constraints or engineering observations from its original development checkpoint.
- [Pet Parity Audit 20261020](PET_PARITY_AUDIT_20261020.md) — *Dated record.* Examines pet parity for source or design inconsistencies, recording dated findings and limits.
- [Ranged Pet Roles 20261020](RANGED_PET_ROLES_20261020.md) — *Dated record.* Defines ranged companion and pet positioning, attacks and support-role distinctions.
- [Slow Cap Playtest Repair 20261025](SLOW_CAP_PLAYTEST_REPAIR_20261025.md) — *Dated record.* Records tests or acceptance criteria for slow cap playtest repair at its original checkpoint.
- [Survival Audit DEV142 144](SURVIVAL_AUDIT_DEV142_144.md) — *Dated record.* Examines survival 144 for source or design inconsistencies, recording dated findings and limits.
- [Survival Followup Audit DEV145](SURVIVAL_FOLLOWUP_AUDIT_DEV145.md) — *Dated record.* Examines survival followup for source or design inconsistencies, recording dated findings and limits.
- [Twilight DEV121](TWILIGHT_DEV121.md) — *Dated record.* Describes twilight decisions, constraints or engineering observations from its original development checkpoint.
- [Twilight Feasibility Audit 20261020](TWILIGHT_FEASIBILITY_AUDIT_20261020.md) — *Dated record.* Examines twilight feasibility for source or design inconsistencies, recording dated findings and limits.

## Companions, Barracks, pets and specialists

- [Barracks Build Copy DEV155](BARRACKS_BUILD_COPY_DEV155.md) — *Dated record.* Describes barracks build copy decisions, constraints or engineering observations from its original development checkpoint.
- [Barracks Roster Feedback DEV127](BARRACKS_ROSTER_FEEDBACK_DEV127.md) — *Dated record.* Reference structure or catalog for barracks roster feedback, with its original assumptions and scope.
- [Barracks Tutorial DEV154](BARRACKS_TUTORIAL_DEV154.md) — *Dated record.* Describes barracks tutorial decisions, constraints or engineering observations from its original development checkpoint.
- [Basic Barracks Menus DEV156](BASIC_BARRACKS_MENUS_DEV156.md) — *Dated record.* Explains basic barracks menus player interaction or interface readability choices.
- [Companion Behavior Audit 20261020](COMPANION_BEHAVIOR_AUDIT_20261020.md) — *Dated record.* Examines companion behavior for source or design inconsistencies, recording dated findings and limits.
- [Companion Judgment 20261020](COMPANION_JUDGMENT_20261020.md) — *Dated record.* Describes companion judgment decisions, constraints or engineering observations from its original development checkpoint.
- [Companion Judgment Refinement DEV142](COMPANION_JUDGMENT_REFINEMENT_DEV142.md) — *Dated record.* Describes companion judgment refinement decisions, constraints or engineering observations from its original development checkpoint.
- [Companion Onboarding DEV148](COMPANION_ONBOARDING_DEV148.md) — *Dated record.* Describes companion onboarding decisions, constraints or engineering observations from its original development checkpoint.
- [Companion Retreat Passage DEV140](COMPANION_RETREAT_PASSAGE_DEV140.md) — *Dated record.* Describes companion retreat passage decisions, constraints or engineering observations from its original development checkpoint.
- [Crown Companions 20261020](CROWN_COMPANIONS_20261020.md) — *Dated record.* Describes crown companions decisions, constraints or engineering observations from its original development checkpoint.
- [Gathering Escort DEV130](GATHERING_ESCORT_DEV130.md) — *Dated record.* Describes gathering escort decisions, constraints or engineering observations from its original development checkpoint.
- [Pet Visual Identity 20261020](PET_VISUAL_IDENTITY_20261020.md) — *Dated record.* Describes pet visual identity decisions, constraints or engineering observations from its original development checkpoint.
- [Queued Companion Care DEV149](QUEUED_COMPANION_CARE_DEV149.md) — *Dated record.* Describes queued companion care decisions, constraints or engineering observations from its original development checkpoint.
- [Recall Highlight DEV153](RECALL_HIGHLIGHT_DEV153.md) — *Dated record.* Describes recall highlight decisions, constraints or engineering observations from its original development checkpoint.
- [Recall Tutorial DEV152](RECALL_TUTORIAL_DEV152.md) — *Dated record.* Describes recall tutorial decisions, constraints or engineering observations from its original development checkpoint.
- [Resource Gathering Flow Audit DEV129](RESOURCE_GATHERING_FLOW_AUDIT_DEV129.md) — *Dated record.* Examines resource gathering flow for source or design inconsistencies, recording dated findings and limits.
- [Rogue Bard Charmed Roster Barracks Contract 20261027](ROGUE_BARD_CHARMED_ROSTER_BARRACKS_CONTRACT_20261027.md) — *Dated record.* Rogue Charm rules and interactions with companion slots, orders and Barracks.
- [Rogue Bard Phase4 Companion Integration 20261027](ROGUE_BARD_PHASE4_COMPANION_INTEGRATION_20261027.md) — *Dated record.* Maps how Rogue Charm and companion abilities integrate with the existing roster and combat.
- [Travel Companion Collision 20261020](TRAVEL_COMPANION_COLLISION_20261020.md) — *Dated record.* Describes travel companion collision decisions, constraints or engineering observations from its original development checkpoint.

## World, geography, travel and narrative


### Regions, settlements, transportation and terrain

- [Abyss Air Superiority Canon](ABYSS_AIR_SUPERIORITY_CANON.md) — *Reference.* Explains the Dark Lord's purple dragon and unfinished breeding, flight and air-superiority project at Abyss Bastion.
- [Abyss Bastion Dungeon Depth](ABYSS_BASTION_DUNGEON_DEPTH.md) — *Reference.* Describes abyss bastion dungeon depth decisions, constraints or engineering observations from its original development checkpoint.
- [Ashen Frontier Occupation Layout](ASHEN_FRONTIER_OCCUPATION_LAYOUT.md) — *Reference.* Maps the Ashen Frontier's occupied settlements, strategic infrastructure and authored world layout.
- [Ashen Frontier Prop Depth](ASHEN_FRONTIER_PROP_DEPTH.md) — *Reference.* Describes ashen frontier prop depth decisions, constraints or engineering observations from its original development checkpoint.
- [Coastal Marches DEV134](COASTAL_MARCHES_DEV134.md) — *Dated record.* Describes coastal marches decisions, constraints or engineering observations from its original development checkpoint.
- [Continue Highlands 20261021](CONTINUE_HIGHLANDS_20261021.md) — *Dated record.* Describes continue highlands decisions, constraints or engineering observations from its original development checkpoint.
- [Director World Building Snapshot Canon Lock 20261012](DIRECTOR_WORLD_BUILDING_SNAPSHOT_CANON_LOCK_20261012.md) — *Dated record.* Describes director world building snapshot canon lock decisions, constraints or engineering observations from its original development checkpoint.
- [Dungeon Camps DEV131](DUNGEON_CAMPS_DEV131.md) — *Dated record.* Describes dungeon camps decisions, constraints or engineering observations from its original development checkpoint.
- [Ferry Size DEV137](FERRY_SIZE_DEV137.md) — *Dated record.* Describes ferry size decisions, constraints or engineering observations from its original development checkpoint.
- [Field Dungeons V074](FIELD_DUNGEONS_V074.md) — *Dated record.* Describes field dungeons decisions, constraints or engineering observations from its original development checkpoint.
- [Frontier Abyss Layout 20261020](FRONTIER_ABYSS_LAYOUT_20261020.md) — *Dated record.* Describes frontier abyss layout decisions, constraints or engineering observations from its original development checkpoint.
- [Frontier Reach Regroup 20261020](FRONTIER_REACH_REGROUP_20261020.md) — *Dated record.* Describes frontier reach regroup decisions, constraints or engineering observations from its original development checkpoint.
- [Frontier Town River 20261020](FRONTIER_TOWN_RIVER_20261020.md) — *Dated record.* Describes frontier town river decisions, constraints or engineering observations from its original development checkpoint.
- [Frontier Update Integration 20261019](FRONTIER_UPDATE_INTEGRATION_20261019.md) — *Dated record.* Explains how frontier update was to be integrated, with its checkpoint-specific implementation evidence.
- [Highlands Appalachian DEV138](HIGHLANDS_APPALACHIAN_DEV138.md) — *Dated record.* Describes highlands appalachian decisions, constraints or engineering observations from its original development checkpoint.
- [Highlands DEV138 Geography Aesthetic Audit](HIGHLANDS_DEV138_GEOGRAPHY_AESTHETIC_AUDIT.md) — *Dated record.* Examines highlands geography aesthetic for source or design inconsistencies, recording dated findings and limits.
- [Highlands Treasury DEV138](HIGHLANDS_TREASURY_DEV138.md) — *Dated record.* Describes highlands treasury decisions, constraints or engineering observations from its original development checkpoint.
- [Ironroot Highlands Layout](IRONROOT_HIGHLANDS_LAYOUT.md) — *Reference.* Describes ironroot highlands layout decisions, constraints or engineering observations from its original development checkpoint.
- [Orchard Witness DEV147](ORCHARD_WITNESS_DEV147.md) — *Dated record.* Relocation and saved-position migration of the Orchard witness to a visible roadside spot.
- [Regional Handoff Audit](REGIONAL_HANDOFF_AUDIT.md) — *Reference.* Examines regional for source or design inconsistencies, recording dated findings and limits.
- [Side Dungeon Design Discussion 20261021](SIDE_DUNGEON_DESIGN_DISCUSSION_20261021.md) — *Dated record.* Preserves owner discussion and evolving decisions about side dungeon design discussion, subject to later rulings.
- [Snapshot Transport And HUD Visual Preaudit 20261015](SNAPSHOT_TRANSPORT_AND_HUD_VISUAL_PREAUDIT_20261015.md) — *Dated record.* Examines snapshot transport and HUD visual preaudit for source or design inconsistencies, recording dated findings and limits.
- [Tidal Ferry DEV136](TIDAL_FERRY_DEV136.md) — *Dated record.* Describes tidal ferry decisions, constraints or engineering observations from its original development checkpoint.
- [Transport Arrivals And Burst Compression](TRANSPORT_ARRIVALS_AND_BURST_COMPRESSION.md) — *Reference.* Transport landing positions and tiered combat-damage compression requirements.
- [World Life Fidelity V0862](WORLD_LIFE_FIDELITY_V0862.md) — *Dated record.* Worldbuilding standard linking named locations to credible, navigable in-game geography.
- [World Proportion And Density Guardrails](WORLD_PROPORTION_AND_DENSITY_GUARDRAILS.md) — *Reference.* Describes world proportion and density guardrails decisions, constraints or engineering observations from its original development checkpoint.

### Story, Archive, characters and localization

- [A2 A3 Archive Bookshelf Reading 20261024](A2_A3_ARCHIVE_BOOKSHELF_READING_20261024.md) — *Dated record.* Describes a2 a3 archive bookshelf reading decisions, constraints or engineering observations from its original development checkpoint.
- [A4 A5 Archive Bilingual Validation 20261024](A4_A5_ARCHIVE_BILINGUAL_VALIDATION_20261024.md) — *Dated record.* Records tests or acceptance criteria for a4 a5 archive bilingual at its original checkpoint.
- [Archive Floor Seam DEV124](ARCHIVE_FLOOR_SEAM_DEV124.md) — *Dated record.* Describes archive floor seam decisions, constraints or engineering observations from its original development checkpoint.
- [Archive Formatting Pass 20261024](ARCHIVE_FORMATTING_PASS_20261024.md) — *Dated record.* Documents readability and formatting treatment for the Keeper's collectible Archive text.
- [Archive Integration Review 20261024](ARCHIVE_INTEGRATION_REVIEW_20261024.md) — *Dated record.* Examines archive for source or design inconsistencies, recording dated findings and limits.
- [Development State Archive Through 20261028](DEVELOPMENT_STATE_ARCHIVE_THROUGH_20261028.md) — *Dated record.* Preserved release-by-release development diary and earlier validation records.
- [Keeper Archive Copy Audit 20261020](KEEPER_ARCHIVE_COPY_AUDIT_20261020.md) — *Dated record.* Examines keeper archive copy for source or design inconsistencies, recording dated findings and limits.
- [Keeper Archive Mechanics Audit 20261024](KEEPER_ARCHIVE_MECHANICS_AUDIT_20261024.md) — *Dated record.* Examines keeper archive mechanics for source or design inconsistencies, recording dated findings and limits.
- [Keeper Reference Writing](KEEPER_REFERENCE_WRITING.md) — *Reference.* Keeper-authored Archive narrative voice and conditions for lore-consistent text.
- [Keeper Unlock Audit 20261009](KEEPER_UNLOCK_AUDIT_20261009.md) — *Dated record.* Reviews Keeper access, rescue and unlock conditions against previously approved story progression.
- [N1 Bilingual Narrative Integration 20261024](N1_BILINGUAL_NARRATIVE_INTEGRATION_20261024.md) — *Dated record.* Explains how n1 bilingual narrative was to be integrated, with its checkpoint-specific implementation evidence.
- [Quest Archive Continuation](QUEST_ARCHIVE_CONTINUATION.md) — *Reference.* Preserves quest archive continuation context, known work and next-stage questions from a dated handoff.
- [Snapshot Precert Implementation And Narrative Audit 20261014](SNAPSHOT_PRECERT_IMPLEMENTATION_AND_NARRATIVE_AUDIT_20261014.md) — *Dated record.* Examines snapshot precert and narrative for source or design inconsistencies, recording dated findings and limits.
- [Treasury Forts And Archive DEV125](TREASURY_FORTS_AND_ARCHIVE_DEV125.md) — *Dated record.* Describes treasury forts and archive decisions, constraints or engineering observations from its original development checkpoint.

### Other geographic and narrative records

- [Dark Crown Regime Layout](DARK_CROWN_REGIME_LAYOUT.md) — *Reference.* Describes dark crown regime layout decisions, constraints or engineering observations from its original development checkpoint.
- [Snapshot Crown Economy Audit 20261015](SNAPSHOT_CROWN_ECONOMY_AUDIT_20261015.md) — *Dated record.* Examines snapshot crown economy for source or design inconsistencies, recording dated findings and limits.

## Sprite art, textures and visual design


### Sprite pipelines, manifests and original-master policies

- [Approved Art Pass 20261019](APPROVED_ART_PASS_20261019.md) — *Dated record.* Describes approved art decisions, constraints or engineering observations from its original development checkpoint.
- [Camera Sprite Targets](CAMERA_SPRITE_TARGETS.md) — *Reference.* Describes camera sprite targets decisions, constraints or engineering observations from its original development checkpoint.
- [Design To Sprite Workflow](DESIGN_TO_SPRITE_WORKFLOW.md) — *Maintained guide.* Sprite-art workflow from approved design and untouched masters through exports and review.
- [Graphics Canon Sprite Audit](GRAPHICS_CANON_SPRITE_AUDIT.md) — *Reference.* Examines graphics canon sprite for source or design inconsistencies, recording dated findings and limits.
- [Graphics Canon Sprite Coverage](GRAPHICS_CANON_SPRITE_COVERAGE.md) — *Reference.* Describes graphics canon sprite decisions, constraints or engineering observations from its original development checkpoint.
- [Graphics Canon Sprite Prompt Audit](GRAPHICS_CANON_SPRITE_PROMPT_AUDIT.md) — *Reference.* Historical procedural sprite-catalog and prompt review, later superseded by new art scope.
- [Graphics Canon Sprite Prompts](GRAPHICS_CANON_SPRITE_PROMPTS.md) — *Reference.* Describes graphics canon sprite prompts decisions, constraints or engineering observations from its original development checkpoint.
- [Graphics Canon Sprite Roster](GRAPHICS_CANON_SPRITE_ROSTER.md) — *Reference.* Reference structure or catalog for graphics canon sprite roster, with its original assumptions and scope.
- [Regional Environment Sprite Scope](REGIONAL_ENVIRONMENT_SPRITE_SCOPE.md) — *Reference.* Specifies intended regional environment sprite scope behavior or boundaries, subject to later decisions.
- [Sprite Asset Lifecycle Animation Audit](SPRITE_ASSET_LIFECYCLE_ANIMATION_AUDIT.md) — *Reference.* Examines sprite asset lifecycle animation for source or design inconsistencies, recording dated findings and limits.
- [Sprite Original Master Export Policy](SPRITE_ORIGINAL_MASTER_EXPORT_POLICY.md) — *Maintained guide.* Source-resolution and provenance safeguards when exporting or replacing game sprites.
- [Sprite Phase3 Pilot Release](SPRITE_PHASE3_PILOT_RELEASE.md) — *Reference.* Investigates sprite pilot as a proposal or pilot without establishing production readiness.
- [Sprite Preparation Audit](SPRITE_PREPARATION_AUDIT.md) — *Reference.* Examines sprite preparation for source or design inconsistencies, recording dated findings and limits.
- [Sprite Preparation Progress](SPRITE_PREPARATION_PROGRESS.md) — *Reference.* Summarizes the historical status, evidence or progression of sprite preparation progress.
- [Sprite Preparation](SPRITE_PREPARATION.md) — *Reference.* Describes sprite preparation decisions, constraints or engineering observations from its original development checkpoint.
- [Sprite Production Current Context](SPRITE_PRODUCTION_CURRENT_CONTEXT.md) — *Reference.* Describes sprite production current context decisions, constraints or engineering observations from its original development checkpoint.
- [Sprite Production Paused 2026 10 08](SPRITE_PRODUCTION_PAUSED_2026-10-08.md) — *Dated record.* Describes sprite production paused 2026 10 08 decisions, constraints or engineering observations from its original development checkpoint.
- [Sprite Resolution Housekeeping](SPRITE_RESOLUTION_HOUSEKEEPING.md) — *Reference.* Describes sprite resolution housekeeping decisions, constraints or engineering observations from its original development checkpoint.
- [Sprite Restart 20261020](SPRITE_RESTART_20261020.md) — *Dated record.* Describes sprite restart decisions, constraints or engineering observations from its original development checkpoint.
- [Sprite Scope Reconciliation](SPRITE_SCOPE_RECONCILIATION.md) — *Reference.* Reconciles art identities, source variants and dated sprite production counts.
- [Sprite Workflow Audit](SPRITE_WORKFLOW_AUDIT.md) — *Reference.* Examines sprite workflow for source or design inconsistencies, recording dated findings and limits.
- [Readme Approved Art Pass](../tools/visual-review/README_APPROVED_ART_PASS.md) — *Dated record.* Reference instructions for inspecting accepted visual artwork outside the game.

### Character/creature appearance and art reviews

- [Art Check DEV177 Repair 20261025](ART_CHECK_DEV177_REPAIR_20261025.md) — *Dated record.* Describes art check repair decisions, constraints or engineering observations from its original development checkpoint.
- [Bows Lipstick 20261020](BOWS_LIPSTICK_20261020.md) — *Dated record.* Describes bows lipstick decisions, constraints or engineering observations from its original development checkpoint.
- [Community Snapshot Art Audit 20261016](COMMUNITY_SNAPSHOT_ART_AUDIT_20261016.md) — *Dated record.* Examines community snapshot art for source or design inconsistencies, recording dated findings and limits.
- [Frontier Visual Polish 20261019](FRONTIER_VISUAL_POLISH_20261019.md) — *Dated record.* Describes frontier visual polish decisions, constraints or engineering observations from its original development checkpoint.
- [Goblin Slinger Arrow Geometry DEV194](GOBLIN_SLINGER_ARROW_GEOMETRY_DEV194.md) — *Dated record.* Describes goblin slinger arrow geometry decisions, constraints or engineering observations from its original development checkpoint.
- [Party Playtest Diagnostics 20261025](PARTY_PLAYTEST_DIAGNOSTICS_20261025.md) — *Dated record.* Records tests or acceptance criteria for party playtest diagnostics at its original checkpoint.
- [Procedural Character Quickfix 20261020](PROCEDURAL_CHARACTER_QUICKFIX_20261020.md) — *Dated record.* Describes procedural character quickfix decisions, constraints or engineering observations from its original development checkpoint.
- [Rogue Bard Static Visual Design 20261026](ROGUE_BARD_STATIC_VISUAL_DESIGN_20261026.md) — *Design reference.* Accepted Rogue jingle-bell staff appearance and procedural art constraints.
- [Rogue Phase7 Procedural Art 20261027](ROGUE_PHASE7_PROCEDURAL_ART_20261027.md) — *Dated record.* Describes a particular development stage of rogue procedural art and its recorded work status.
- [Slinger Arrow Art Review DEV195](SLINGER_ARROW_ART_REVIEW_DEV195.md) — *Dated record.* Examines slinger arrow art for source or design inconsistencies, recording dated findings and limits.
- [Snapshot Crypt Retired Art Provenance 20261014](SNAPSHOT_CRYPT_RETIRED_ART_PROVENANCE_20261014.md) — *Dated record.* Describes snapshot crypt retired art provenance decisions, constraints or engineering observations from its original development checkpoint.
- [Veyra Ivory 20261020](VEYRA_IVORY_20261020.md) — *Dated record.* Describes veyra ivory decisions, constraints or engineering observations from its original development checkpoint.
- [Visual Followups DEV122](VISUAL_FOLLOWUPS_DEV122.md) — *Dated record.* Describes visual followups decisions, constraints or engineering observations from its original development checkpoint.
- [emberwatch river dev108 — README](../tools/visual-review/emberwatch-river-dev108/README.md) — *Dated record.* Shows the readme art-review context and dated comparison/approval references.
- [fortifications dev109 — README](../tools/visual-review/fortifications-dev109/README.md) — *Dated record.* Shows the readme art-review context and dated comparison/approval references.
- [frontier bastion audit 20261020 — README](../tools/visual-review/frontier-bastion-audit-20261020/README.md) — *Dated record.* Shows the readme art-review context and dated comparison/approval references.
- [mouth staff preview 20261020 — README](../tools/visual-review/mouth-staff-preview-20261020/README.md) — *Dated record.* Shows the readme art-review context and dated comparison/approval references.
- [treasurer moneybag dev118 — README](../tools/visual-review/treasurer-moneybag-dev118/README.md) — *Dated record.* Shows the readme art-review context and dated comparison/approval references.
- [veyra ivory correction 20261020 — README](../tools/visual-review/veyra-ivory-correction-20261020/README.md) — *Dated record.* Shows the readme art-review context and dated comparison/approval references.
- [veyra options 20261020 — README](../tools/visual-review/veyra-options-20261020/README.md) — *Dated record.* Shows the readme art-review context and dated comparison/approval references.

### Textures, geometry and procedural visual polish

- [Effects PR471 Verification 20261025](EFFECTS_PR471_VERIFICATION_20261025.md) — *Dated record.* Records tests or acceptance criteria for effects at its original checkpoint.
- [Effects Stage5 Github Handoff 20261025](EFFECTS_STAGE5_GITHUB_HANDOFF_20261025.md) — *Dated record.* Preserves effects github context, known work and next-stage questions from a dated handoff.
- [Graphics Canon Paladin](GRAPHICS_CANON_PALADIN.md) — *Reference.* Describes graphics canon paladin decisions, constraints or engineering observations from its original development checkpoint.
- [Graphics Canon Terrain Texture Candidates](GRAPHICS_CANON_TERRAIN_TEXTURE_CANDIDATES.md) — *Reference.* Describes graphics canon terrain texture candidates decisions, constraints or engineering observations from its original development checkpoint.
- [Graphics Overhaul Phase1](GRAPHICS_OVERHAUL_PHASE1.md) — *Reference.* Describes a particular development stage of graphics overhaul and its recorded work status.
- [Graphics Procedural Polish V0879](GRAPHICS_PROCEDURAL_POLISH_V0879.md) — *Dated record.* Describes graphics procedural polish decisions, constraints or engineering observations from its original development checkpoint.
- [Mage Hair Quickfix 20261020](MAGE_HAIR_QUICKFIX_20261020.md) — *Dated record.* Describes mage hair quickfix decisions, constraints or engineering observations from its original development checkpoint.
- [Procedural Cottage 20261020](PROCEDURAL_COTTAGE_20261020.md) — *Dated record.* Describes procedural cottage decisions, constraints or engineering observations from its original development checkpoint.
- [Procedural Selections 20261020](PROCEDURAL_SELECTIONS_20261020.md) — *Dated record.* Describes procedural selections decisions, constraints or engineering observations from its original development checkpoint.
- [Rogue Charm Nameplate Polish 20261028](ROGUE_CHARM_NAMEPLATE_POLISH_20261028.md) — *Dated record.* Describes rogue charm nameplate polish decisions, constraints or engineering observations from its original development checkpoint.
- [Rogue Jingle Canon And Slowdown DEV208 20261028](ROGUE_JINGLE_CANON_AND_SLOWDOWN_DEV208_20261028.md) — *Dated record.* Describes rogue jingle canon and slowdown decisions, constraints or engineering observations from its original development checkpoint.
- [Snapshot Vale Cottage Original Export 20261014](SNAPSHOT_VALE_COTTAGE_ORIGINAL_EXPORT_20261014.md) — *Dated record.* Describes snapshot vale cottage original export decisions, constraints or engineering observations from its original development checkpoint.
- [Terrain Texture Pipeline](TERRAIN_TEXTURE_PIPELINE.md) — *Reference.* Describes terrain texture pipeline decisions, constraints or engineering observations from its original development checkpoint.

## Rendering, optimization, performance and WebGL experiments


### Experimental PixiJS, GPU and WebGL

- [PIXI Twilight Glow Failure 20261026](PIXI_TWILIGHT_GLOW_FAILURE_20261026.md) — *Dated record.* Describes PIXI twilight glow failure decisions, constraints or engineering observations from its original development checkpoint.
- [PIXIJS Playtest Step2 20261022](PIXIJS_PLAYTEST_STEP2_20261022.md) — *Dated record.* Records tests or acceptance criteria for PIXIJS playtest at its original checkpoint.
- [PIXIJS Playtest Step3 Audit 20261022](PIXIJS_PLAYTEST_STEP3_AUDIT_20261022.md) — *Dated record.* Examines PIXIJS playtest for source or design inconsistencies, recording dated findings and limits.
- [PIXIJS Pre Step4 Handoff 20261022](PIXIJS_PRE_STEP4_HANDOFF_20261022.md) — *Dated record.* Preserves PIXIJS pre context, known work and next-stage questions from a dated handoff.
- [WEBGL Renderer Pilot Preparation 20261022](WEBGL_RENDERER_PILOT_PREPARATION_20261022.md) — *Dated record.* Investigates WEBGL renderer pilot preparation as a proposal or pilot without establishing production readiness.
- [Canvas Vs WEBGL Readme](../tools/webgl-pilot/CANVAS_VS_WEBGL_README.md) — *Reference.* Canvas/WebGL comparison setup, results and technical limits.
- [Full World Readme](../tools/webgl-pilot/FULL_WORLD_README.md) — *Reference.* Experimental full-world WebGL drawing prototype and its boundaries.
- [Hybrid Readme](../tools/webgl-pilot/HYBRID_README.md) — *Reference.* Experimental split Canvas/WebGL rendering strategy and caveats.
- [webgl pilot — README](../tools/webgl-pilot/README.md) — *Reference.* Entry guide for the experimental WebGL renderer pilots and demos.
- [Real World GPU Readme](../tools/webgl-pilot/REAL_WORLD_GPU_README.md) — *Reference.* GPU pilot for drawing actual game scenes rather than simple synthetic geometry.
- [Strategy Lab Readme](../tools/webgl-pilot/STRATEGY_LAB_README.md) — *Reference.* Experiments comparing alternative renderer strategies and their measurements.

### Frame rate, recovery, optimization and profiling

- [Adaptive Frame Skip DEV166](ADAPTIVE_FRAME_SKIP_DEV166.md) — *Dated record.* Describes adaptive frame skip decisions, constraints or engineering observations from its original development checkpoint.
- [Adaptive Frame Skip Two Frame 20261023](ADAPTIVE_FRAME_SKIP_TWO_FRAME_20261023.md) — *Dated record.* Describes adaptive frame skip two frame decisions, constraints or engineering observations from its original development checkpoint.
- [Auto Optimization Emergency Override 20261024](AUTO_OPTIMIZATION_EMERGENCY_OVERRIDE_20261024.md) — *Dated record.* Describes auto optimization emergency override decisions, constraints or engineering observations from its original development checkpoint.
- [Auto Resolution 20fps DEV174](AUTO_RESOLUTION_20FPS_DEV174.md) — *Dated record.* Discusses auto resolution 20fps measurements, bottlenecks or optimization trade-offs.
- [Chromebook Performance 20261019](CHROMEBOOK_PERFORMANCE_20261019.md) — *Dated record.* Chromebook measurements and performance constraints observed at the October checkpoint.
- [Community Snapshot Performance 20261016](COMMUNITY_SNAPSHOT_PERFORMANCE_20261016.md) — *Dated record.* Dated performance checks and limits for the October Community Snapshot candidate.
- [Current Performance Status DEV169 20261024](CURRENT_PERFORMANCE_STATUS_DEV169_20261024.md) — *Dated record.* Dated dev.169 performance and adaptive frame-skip status; not current device FPS evidence.
- [Frame Profiler DEV165](FRAME_PROFILER_DEV165.md) — *Dated record.* Describes frame profiler decisions, constraints or engineering observations from its original development checkpoint.
- [Ground Window Performance](GROUND_WINDOW_PERFORMANCE.md) — *Reference.* Discusses ground window performance measurements, bottlenecks or optimization trade-offs.
- [Material Rendering Performance](MATERIAL_RENDERING_PERFORMANCE.md) — *Reference.* Discusses material rendering performance measurements, bottlenecks or optimization trade-offs.
- [Menu Screen Performance Step2 20261023](MENU_SCREEN_PERFORMANCE_STEP2_20261023.md) — *Dated record.* Describes a particular development stage of menu screen performance and its recorded work status.
- [Optimization Audit 20261020](OPTIMIZATION_AUDIT_20261020.md) — *Dated record.* Examines optimization for source or design inconsistencies, recording dated findings and limits.
- [Performance Baseline DEV170 20261024](PERFORMANCE_BASELINE_DEV170_20261024.md) — *Dated record.* Discusses performance baseline measurements, bottlenecks or optimization trade-offs.
- [Performance Evidence Register 20261024](PERFORMANCE_EVIDENCE_REGISTER_20261024.md) — *Dated record.* Historical performance measurements, instrumentation caveats and regression evidence.
- [Performance Measurement Audit 20261022](PERFORMANCE_MEASUREMENT_AUDIT_20261022.md) — *Dated record.* Examines performance measurement for source or design inconsistencies, recording dated findings and limits.
- [Performance Resilience Integration 20261024](PERFORMANCE_RESILIENCE_INTEGRATION_20261024.md) — *Dated record.* Explains how performance resilience was to be integrated, with its checkpoint-specific implementation evidence.
- [Performance V09 Project](PERFORMANCE_V09_PROJECT.md) — *Dated record.* Discusses performance project measurements, bottlenecks or optimization trade-offs.
- [Performance V09 Results](PERFORMANCE_V09_RESULTS.md) — *Dated record.* Records measurements and conclusions from the v0.9 performance workstream, not current device FPS.
- [Snapshot Viewport Performance 20261014](SNAPSHOT_VIEWPORT_PERFORMANCE_20261014.md) — *Dated record.* Discusses snapshot viewport performance measurements, bottlenecks or optimization trade-offs.

### Graphics rendering and other measurements

- [Crowd Collision Fast Reject 20261023](CROWD_COLLISION_FAST_REJECT_20261023.md) — *Dated record.* Discusses crowd collision fast reject measurements, bottlenecks or optimization trade-offs.
- [Crowd Escape 20261020](CROWD_ESCAPE_20261020.md) — *Dated record.* Discusses crowd escape measurements, bottlenecks or optimization trade-offs.
- [Crowd Movement Diagnostics 20261023](CROWD_MOVEMENT_DIAGNOSTICS_20261023.md) — *Dated record.* Discusses crowd movement diagnostics measurements, bottlenecks or optimization trade-offs.
- [Perf Ws2 Browser Canvas Controls](PERF_WS2_BROWSER_CANVAS_CONTROLS.md) — *Reference.* Explains perf ws2 browser canvas controls player interaction or interface readability choices.
- [Perf Ws2 Full Render Diagnostics](PERF_WS2_FULL_RENDER_DIAGNOSTICS.md) — *Reference.* Discusses perf ws2 full render diagnostics measurements, bottlenecks or optimization trade-offs.
- [Perf Ws2 Visuals V09](PERF_WS2_VISUALS_V09.md) — *Dated record.* Describes perf ws2 visuals decisions, constraints or engineering observations from its original development checkpoint.
- [Perf Ws4 Infrastructure 20261010](PERF_WS4_INFRASTRUCTURE_20261010.md) — *Dated record.* Describes perf ws4 infrastructure decisions, constraints or engineering observations from its original development checkpoint.
- [Perf Ws1 Terrain Road Rendering](perf-ws1-terrain-road-rendering.md) — *Reference.* Describes perf ws1 terrain road rendering decisions, constraints or engineering observations from its original development checkpoint.
- [Perf Ws3 Interface Audio 20261010](perf-ws3-interface-audio-20261010.md) — *Reference.* Describes perf ws3 interface audio 20261010 decisions, constraints or engineering observations from its original development checkpoint.
- [PR518 Engineering Handoff 20261027](PR518_ENGINEERING_HANDOFF_20261027.md) — *Dated record.* Engineering context and outstanding acceptance for the title, Canvas and experimental Pixi work.
- [PR518 Target Device Acceptance 20261027](PR518_TARGET_DEVICE_ACCEPTANCE_20261027.md) — *Maintained guide.* Real-device acceptance plan for title/graphics and experimental Pixi presentation.
- [Regional Graphics Preparation Title Screen 20261027](REGIONAL_GRAPHICS_PREPARATION_TITLE_SCREEN_20261027.md) — *Dated record.* Describes regional graphics preparation title screen decisions, constraints or engineering observations from its original development checkpoint.
- [Runtime Workload DEV177 Audit](RUNTIME_WORKLOAD_DEV177_AUDIT.md) — *Dated record.* Examines runtime workload for source or design inconsistencies, recording dated findings and limits.
- [Runtime Workload DEV177](RUNTIME_WORKLOAD_DEV177.md) — *Dated record.* Describes runtime workload decisions, constraints or engineering observations from its original development checkpoint.

## Navigation, maps and pathfinding

- [Map Wayfinding Followup](MAP_WAYFINDING_FOLLOWUP.md) — *Reference.* Describes map wayfinding followup decisions, constraints or engineering observations from its original development checkpoint.
- [Navigation Stage2 20261023](NAVIGATION_STAGE2_20261023.md) — *Dated record.* Describes a particular development stage of navigation and its recorded work status.
- [Navigation Stage3 20261023](NAVIGATION_STAGE3_20261023.md) — *Dated record.* Describes a particular development stage of navigation and its recorded work status.
- [Navigation Stage4 20261023](NAVIGATION_STAGE4_20261023.md) — *Dated record.* Describes a particular development stage of navigation and its recorded work status.
- [Navigation Stage5 20261023](NAVIGATION_STAGE5_20261023.md) — *Dated record.* Describes a particular development stage of navigation and its recorded work status.

## Menus, controls, HUD and usability

- [Adaptive Mobile HUD Implementation 20261027](ADAPTIVE_MOBILE_HUD_IMPLEMENTATION_20261027.md) — *Dated record.* Explains how adaptive mobile HUD was to be integrated, with its checkpoint-specific implementation evidence.
- [Field Onboarding DEV161](FIELD_ONBOARDING_DEV161.md) — *Dated record.* Describes field onboarding decisions, constraints or engineering observations from its original development checkpoint.
- [Game Menus DEV157](GAME_MENUS_DEV157.md) — *Dated record.* Explains game menus player interaction or interface readability choices.
- [HUD Option B PC Phone 20261025](HUD_OPTION_B_PC_PHONE_20261025.md) — *Dated record.* Explains HUD option b pc phone player interaction or interface readability choices.
- [Instructor Menus DEV158](INSTRUCTOR_MENUS_DEV158.md) — *Dated record.* Explains instructor menus player interaction or interface readability choices.
- [Keyboard Ergonomics Audit](KEYBOARD_ERGONOMICS_AUDIT.md) — *Reference.* Examines keyboard ergonomics for source or design inconsistencies, recording dated findings and limits.
- [Menu Foundation Step1 20261023](MENU_FOUNDATION_STEP1_20261023.md) — *Dated record.* Describes a particular development stage of menu and its recorded work status.
- [Menu Overhaul Steps3 7](MENU_OVERHAUL_STEPS3_7.md) — *Reference.* Describes a particular development stage of menu overhaul steps3 7 and its recorded work status.
- [Menu Step7 Audit 20261023](MENU_STEP7_AUDIT_20261023.md) — *Dated record.* Examines menu for source or design inconsistencies, recording dated findings and limits.
- [Millhaven Onboarding DEV160](MILLHAVEN_ONBOARDING_DEV160.md) — *Dated record.* Describes millhaven onboarding decisions, constraints or engineering observations from its original development checkpoint.
- [Responsive UI Audit 20261009](RESPONSIVE_UI_AUDIT_20261009.md) — *Dated record.* Examines responsive UI for source or design inconsistencies, recording dated findings and limits.

## Save data, backup and recovery

- [Ashen Frontier Recovery 240 Note](ASHEN_FRONTIER_RECOVERY_240_NOTE.md) — *Reference.* Describes ashen frontier recovery 240 note decisions, constraints or engineering observations from its original development checkpoint.
- [Director Chat Requests And Recovery 20261014](DIRECTOR_CHAT_REQUESTS_AND_RECOVERY_20261014.md) — *Dated record.* Describes director chat requests and recovery decisions, constraints or engineering observations from its original development checkpoint.
- [Regional Recovery And Warning Audit DEV123](REGIONAL_RECOVERY_AND_WARNING_AUDIT_DEV123.md) — *Dated record.* Examines regional recovery and warning for source or design inconsistencies, recording dated findings and limits.
- [Save Recovery Checkpoints DEV176](SAVE_RECOVERY_CHECKPOINTS_DEV176.md) — *Dated record.* Bounded three-checkpoint save recovery and user-facing restore behavior.
- [Treasury Death Recovery DEV128](TREASURY_DEATH_RECOVERY_DEV128.md) — *Dated record.* Specifies regional storage of lost crowns and their recovery from captain-gated caches.

## Documentation governance and reference records

- [Agents History 20261025](../AGENTS_HISTORY_20261025.md) — *Dated record.* Archived agent work orders and dated permissions; a historical ledger, not fresh authorization.
- [Backlog Housekeeping 20261010](BACKLOG_HOUSEKEEPING_20261010.md) — *Dated record.* Describes backlog housekeeping decisions, constraints or engineering observations from its original development checkpoint.
- [Documentation Audit 20261019](DOCUMENTATION_AUDIT_20261019.md) — *Dated record.* Examines documentation for source or design inconsistencies, recording dated findings and limits.
- [Documentation Coverage Notes 20261025](DOCUMENTATION_COVERAGE_NOTES_20261025.md) — *Dated record.* Methodology, scope and limitations of the repository-wide document census and classifications.
- [Documentation Governance Audit Handoff 20261025](DOCUMENTATION_GOVERNANCE_AUDIT_HANDOFF_20261025.md) — *Dated record.* Examines documentation governance for source or design inconsistencies, recording dated findings and limits.
- [Documentation Governance Deep Audit 20261025](DOCUMENTATION_GOVERNANCE_DEEP_AUDIT_20261025.md) — *Dated record.* Investigates conflicts between document authority, historical work orders and current governance.
- [Documentation Phase0 Baseline 20261027](DOCUMENTATION_PHASE0_BASELINE_20261027.md) — *Dated record.* Frozen initial documentation inventory and historical indexing gaps.
- [Economy Exp Housekeeping](ECONOMY_EXP_HOUSEKEEPING.md) — *Reference.* Describes economy exp housekeeping decisions, constraints or engineering observations from its original development checkpoint.
- [Housekeeping Audit](HOUSEKEEPING_AUDIT.md) — *Reference.* Examines housekeeping for source or design inconsistencies, recording dated findings and limits.
- [Housekeeping Progress](HOUSEKEEPING_PROGRESS.md) — *Reference.* Summarizes the historical status, evidence or progression of housekeeping progress.
- [Housekeeping V0881](HOUSEKEEPING_V0881.md) — *Dated record.* Describes housekeeping decisions, constraints or engineering observations from its original development checkpoint.
- [Monster Attack V09 Housekeeping](MONSTER_ATTACK_V09_HOUSEKEEPING.md) — *Dated record.* Describes monster attack housekeeping decisions, constraints or engineering observations from its original development checkpoint.
- [Pre Break Documentation History 20261019](PRE_BREAK_DOCUMENTATION_HISTORY_20261019.md) — *Dated record.* Verbatim pre-break historical status, architecture and release-note records.
- [Project History](PROJECT_HISTORY.md) — *Reference.* Summarizes the historical status, evidence or progression of project history.
- [Test Drift History DEV145](TEST_DRIFT_HISTORY_DEV145.md) — *Dated record.* Records tests or acceptance criteria for drift history at its original checkpoint.
- [Test Reliability Stages 1 To 3 20261027](TEST_RELIABILITY_STAGES_1_TO_3_20261027.md) — *Dated record.* Classifies test drift and regression failures, with baseline comparison procedures.

## Historical releases, reviews and integration handoffs

- [Beta Readiness 20261010](BETA_READINESS_20261010.md) — *Dated record.* Documents historical release planning, gates and evidence for beta readiness.
- [Community Snapshot Audit Repairs 20261016](COMMUNITY_SNAPSHOT_AUDIT_REPAIRS_20261016.md) — *Dated record.* Examines community snapshot for source or design inconsistencies, recording dated findings and limits.
- [Community Snapshot Balance 20261016](COMMUNITY_SNAPSHOT_BALANCE_20261016.md) — *Dated record.* Describes community snapshot balance decisions, constraints or engineering observations from its original development checkpoint.
- [Community Snapshot Execution Audit 20261016](COMMUNITY_SNAPSHOT_EXECUTION_AUDIT_20261016.md) — *Dated record.* Examines community snapshot execution for source or design inconsistencies, recording dated findings and limits.
- [Community Snapshot Implementation 20261016](COMMUNITY_SNAPSHOT_IMPLEMENTATION_20261016.md) — *Dated record.* Explains how community snapshot was to be integrated, with its checkpoint-specific implementation evidence.
- [Community Snapshot Passive Completion 20261015](COMMUNITY_SNAPSHOT_PASSIVE_COMPLETION_20261015.md) — *Dated record.* Describes community snapshot passive completion decisions, constraints or engineering observations from its original development checkpoint.
- [Community Snapshot Post308 Handoff 20261015](COMMUNITY_SNAPSHOT_POST308_HANDOFF_20261015.md) — *Dated record.* Preserves community snapshot post308 context, known work and next-stage questions from a dated handoff.
- [Community Snapshot PR311 Integration Audit 20261016](COMMUNITY_SNAPSHOT_PR311_INTEGRATION_AUDIT_20261016.md) — *Dated record.* Examines community snapshot for source or design inconsistencies, recording dated findings and limits.
- [Community Snapshot Preparation Audit 20261015](COMMUNITY_SNAPSHOT_PREPARATION_AUDIT_20261015.md) — *Dated record.* Examines community snapshot preparation for source or design inconsistencies, recording dated findings and limits.
- [Community Snapshot Release Handoff 20261016](COMMUNITY_SNAPSHOT_RELEASE_HANDOFF_20261016.md) — *Dated record.* Snapshot release handoff and the limited test exceptions permitted for that dated batch.
- [Community Snapshot Source Contract 20261016](COMMUNITY_SNAPSHOT_SOURCE_CONTRACT_20261016.md) — *Dated record.* Preserves source and behavior constraints for that particular Community Snapshot batch.
- [Community Snapshot Source Reaudit 20261016](COMMUNITY_SNAPSHOT_SOURCE_REAUDIT_20261016.md) — *Dated record.* Examines community snapshot source for source or design inconsistencies, recording dated findings and limits.
- [Community Snapshot Validation 20261016](COMMUNITY_SNAPSHOT_VALIDATION_20261016.md) — *Dated record.* Records tests or acceptance criteria for community snapshot at its original checkpoint.
- [Founding Explorers Execution Record](FOUNDING_EXPLORERS_EXECUTION_RECORD.md) — *Dated record.* Dated source and verification record for the founding expedition.
- [Founding Explorers Implementation Handoff](FOUNDING_EXPLORERS_IMPLEMENTATION_HANDOFF.md) — *Dated record.* Implementation handoff for the opening expedition and its companion onboarding.
- [Founding Explorers Launch Prep Kit 20261025](FOUNDING_EXPLORERS_LAUNCH_PREP_KIT_20261025.md) — *Dated record.* Historical test and launch preparation for the founding expedition.
- [Post Snapshot Playtest Fixes 20261015](POST_SNAPSHOT_PLAYTEST_FIXES_20261015.md) — *Dated record.* Records tests or acceptance criteria for post snapshot playtest at its original checkpoint.
- [PR313 Cautionary Audit 20261016](PR313_CAUTIONARY_AUDIT_20261016.md) — *Dated record.* Examines cautionary for source or design inconsistencies, recording dated findings and limits.
- [PR313 Integrated Source Audit 20261016](PR313_INTEGRATED_SOURCE_AUDIT_20261016.md) — *Dated record.* Examines integrated source for source or design inconsistencies, recording dated findings and limits.
- [PR313 Resume 20261016](PR313_RESUME_20261016.md) — *Dated record.* Preserves resume context, known work and next-stage questions from a dated handoff.
- [PR313 Throne Gate 20261016](PR313_THRONE_GATE_20261016.md) — *Dated record.* Describes throne gate decisions, constraints or engineering observations from its original development checkpoint.
- [PR313 Validation 20261016](PR313_VALIDATION_20261016.md) — *Dated record.* Records tests or acceptance criteria for pr313 validation 20261016 at its original checkpoint.
- [PR313 Work Implementation 20261016](PR313_WORK_IMPLEMENTATION_20261016.md) — *Dated record.* Explains how work was to be integrated, with its checkpoint-specific implementation evidence.
- [PR439 Independent Work Handoff 20261024](PR439_INDEPENDENT_WORK_HANDOFF_20261024.md) — *Dated record.* Preserves independent work context, known work and next-stage questions from a dated handoff.
- [Pre Snapshot Ten Issues Implementation Audit 20261015](PRE_SNAPSHOT_TEN_ISSUES_IMPLEMENTATION_AUDIT_20261015.md) — *Dated record.* Examines pre snapshot ten issues for source or design inconsistencies, recording dated findings and limits.
- [Rogue Soft Release 20261028](ROGUE_SOFT_RELEASE_20261028.md) — *Dated record.* Scope, shipped behavior and outstanding acceptance for the playable Rogue fourth class.
- [Snapshot Certification Repairs 20261015](SNAPSHOT_CERTIFICATION_REPAIRS_20261015.md) — *Dated record.* Documents historical release planning, gates and evidence for snapshot certification.
- [Snapshot Checkpoint Audit 20261013](SNAPSHOT_CHECKPOINT_AUDIT_20261013.md) — *Dated record.* Examines snapshot for source or design inconsistencies, recording dated findings and limits.
- [Snapshot Implementation 20261013](SNAPSHOT_IMPLEMENTATION_20261013.md) — *Dated record.* Explains how snapshot was to be integrated, with its checkpoint-specific implementation evidence.
- [Snapshot Implementation Freeze Handoff 20261015](SNAPSHOT_IMPLEMENTATION_FREEZE_HANDOFF_20261015.md) — *Dated record.* Preserves snapshot freeze context, known work and next-stage questions from a dated handoff.
- [Snapshot Monster Stronghold Case Audit 20261014](SNAPSHOT_MONSTER_STRONGHOLD_CASE_AUDIT_20261014.md) — *Dated record.* Examines snapshot monster stronghold case for source or design inconsistencies, recording dated findings and limits.
- [Snapshot Precert Implementation Quality Audit 20261014](SNAPSHOT_PRECERT_IMPLEMENTATION_QUALITY_AUDIT_20261014.md) — *Dated record.* Examines snapshot precert for source or design inconsistencies, recording dated findings and limits.
- [Update Notice 20261020](UPDATE_NOTICE_20261020.md) — *Dated record.* Describes update notice decisions, constraints or engineering observations from its original development checkpoint.
- [V09 Release Notes](V09_RELEASE_NOTES.md) — *Reference.* October Community Snapshot release record, not an up-to-date release ledger.
- [Work Mode PR313 Handoff Verification 20261016](WORK_MODE_PR313_HANDOFF_VERIFICATION_20261016.md) — *Dated record.* Records tests or acceptance criteria for work mode at its original checkpoint.
- [Work Mode Single Pr Handoff 20261016](WORK_MODE_SINGLE_PR_HANDOFF_20261016.md) — *Dated record.* Preserves work mode single pr context, known work and next-stage questions from a dated handoff.
- [Work Mode Source Handoff Audit 20261016](WORK_MODE_SOURCE_HANDOFF_AUDIT_20261016.md) — *Dated record.* Examines work mode source for source or design inconsistencies, recording dated findings and limits.

## Other dated system findings


### Gameplay, interface and environment follow-ups

- [Lantern Dock DEV135](LANTERN_DOCK_DEV135.md) — *Dated record.* Describes lantern dock decisions, constraints or engineering observations from its original development checkpoint.
- [Local Site Audit](LOCAL_SITE_AUDIT.md) — *Reference.* Examines local site for source or design inconsistencies, recording dated findings and limits.
- [Mechanics Audit V081](MECHANICS_AUDIT_V081.md) — *Dated record.* Reviews game-mechanic consistency at the historical v0.8.1 checkpoint.
- [Night Tempo 20261020](NIGHT_TEMPO_20261020.md) — *Dated record.* Records nighttime enemy movement and attack-tempo scaling, including which timers remain unchanged.
- [Older Gameplay Fixes Audit 20261009](OLDER_GAMEPLAY_FIXES_AUDIT_20261009.md) — *Dated record.* Examines older gameplay for source or design inconsistencies, recording dated findings and limits.
- [Outdoor Road Infrastructure Audit](OUTDOOR_ROAD_INFRASTRUCTURE_AUDIT.md) — *Reference.* Examines outdoor road infrastructure for source or design inconsistencies, recording dated findings and limits.
- [Resource Discovery DEV132](RESOURCE_DISCOVERY_DEV132.md) — *Dated record.* Describes resource discovery decisions, constraints or engineering observations from its original development checkpoint.
- [Scenery Notifications Batch 354](SCENERY_NOTIFICATIONS_BATCH_354.md) — *Reference.* Describes scenery notifications batch 354 decisions, constraints or engineering observations from its original development checkpoint.
- [Terrain Effects Polish V0880](TERRAIN_EFFECTS_POLISH_V0880.md) — *Dated record.* Describes terrain effects polish decisions, constraints or engineering observations from its original development checkpoint.
- [Thornfang Opening DEV146](THORNFANG_OPENING_DEV146.md) — *Dated record.* Describes thornfang opening decisions, constraints or engineering observations from its original development checkpoint.

### Cross-system observations, integration and open questions

- [Sprite directory README](../assets/sprites/README.md) — *Reference.* Sprite-manifest structure, asset conventions and procedural fallback expectations.
- [Adaptive Resolution 20261020](ADAPTIVE_RESOLUTION_20261020.md) — *Dated record.* Describes adaptive resolution decisions, constraints or engineering observations from its original development checkpoint.
- [Amber Narration Implementation](AMBER_NARRATION_IMPLEMENTATION.md) — *Reference.* Explains how amber narration was to be integrated, with its checkpoint-specific implementation evidence.
- [Approved Lips Staffs 20261020](APPROVED_LIPS_STAFFS_20261020.md) — *Dated record.* Describes approved lips staffs decisions, constraints or engineering observations from its original development checkpoint.
- [Audit Fixes V070](AUDIT_FIXES_V070.md) — *Dated record.* Examines audit fixes v070 for source or design inconsistencies, recording dated findings and limits.
- [Audit Integration Repairs DEV175](AUDIT_INTEGRATION_REPAIRS_DEV175.md) — *Dated record.* Examines audit integration repairs dev175 for source or design inconsistencies, recording dated findings and limits.
- [Brief Company DEV150](BRIEF_COMPANY_DEV150.md) — *Dated record.* Describes brief company decisions, constraints or engineering observations from its original development checkpoint.
- [Combined Validation Repairs 20261015](COMBINED_VALIDATION_REPAIRS_20261015.md) — *Dated record.* Records tests or acceptance criteria for combined at its original checkpoint.
- [Defender Space DEV129](DEFENDER_SPACE_DEV129.md) — *Dated record.* Describes defender space decisions, constraints or engineering observations from its original development checkpoint.
- [Deferred Encounter Time Audit](DEFERRED_ENCOUNTER_TIME_AUDIT.md) — *Reference.* Examines short boss fights, legitimate early-party setups and encounters left for further review.
- [Developer Mode](DEVELOPER_MODE.md) — *Reference.* Describes developer mode decisions, constraints or engineering observations from its original development checkpoint.
- [Development History Through V08133](DEVELOPMENT_HISTORY_THROUGH_V08133.md) — *Dated record.* Summarizes the historical status, evidence or progression of development history through.
- [Encounter Space Audit DEV127](ENCOUNTER_SPACE_AUDIT_DEV127.md) — *Dated record.* Examines encounter space for source or design inconsistencies, recording dated findings and limits.
- [Hero Class Foundations Level1 Audit 20261026](HERO_CLASS_FOUNDATIONS_LEVEL1_AUDIT_20261026.md) — *Dated record.* Examines hero class foundations level1 for source or design inconsistencies, recording dated findings and limits.
- [Issue 312 Consolidated Implementation Ledger 20261016](ISSUE_312_CONSOLIDATED_IMPLEMENTATION_LEDGER_20261016.md) — *Dated record.* Explains how issue 312 consolidated ledger was to be integrated, with its checkpoint-specific implementation evidence.
- [Item Equipment Integrity 20261010](ITEM_EQUIPMENT_INTEGRITY_20261010.md) — *Dated record.* Describes item equipment integrity decisions, constraints or engineering observations from its original development checkpoint.
- [N1a Scene Reconciliation 20261024](N1A_SCENE_RECONCILIATION_20261024.md) — *Dated record.* Compares n1a scene with related source, feature decisions or branch changes.
- [Next Update Reconciliation 20261018](NEXT_UPDATE_RECONCILIATION_20261018.md) — *Dated record.* Compares next update with related source, feature decisions or branch changes.
- [Playtest Audit](PLAYTEST_AUDIT.md) — *Reference.* Examines playtest for source or design inconsistencies, recording dated findings and limits.
- [Proportion Implementation Checkpoint](PROPORTION_IMPLEMENTATION_CHECKPOINT.md) — *Reference.* Explains how proportion was to be integrated, with its checkpoint-specific implementation evidence.
- [Quest Announcement Requirements](QUEST_ANNOUNCEMENT_REQUIREMENTS.md) — *Reference.* Requirements for readable in-game quest, objective and discovery notifications.
- [Quest Interiors V082](QUEST_INTERIORS_V082.md) — *Dated record.* Describes quest interiors decisions, constraints or engineering observations from its original development checkpoint.
- [Rogue First Phone Acceptance 20261028](ROGUE_FIRST_PHONE_ACCEPTANCE_20261028.md) — *Dated record.* First Rogue phone playtest findings and remaining device-specific defects.
- [Sprint](SPRINT.md) — *Reference.* Historical dormant Sprint design and why it does not appear in normal player controls.
- [Support Recipient Audit 20261020](SUPPORT_RECIPIENT_AUDIT_20261020.md) — *Dated record.* Examines support recipient for source or design inconsistencies, recording dated findings and limits.
- [Talent Notice DEV133](TALENT_NOTICE_DEV133.md) — *Dated record.* Describes talent notice decisions, constraints or engineering observations from its original development checkpoint.
- [Test Upkeep DEV145](TEST_UPKEEP_DEV145.md) — *Dated record.* Records tests or acceptance criteria for upkeep at its original checkpoint.
- [Trap Activation Cycle V09 Audit](TRAP_ACTIVATION_CYCLE_V09_AUDIT.md) — *Dated record.* Examines trap activation cycle for source or design inconsistencies, recording dated findings and limits.
- [Treasurer Moneybag 20261020](TREASURER_MONEYBAG_20261020.md) — *Dated record.* Describes treasurer moneybag decisions, constraints or engineering observations from its original development checkpoint.

<a id="phase-3--topical-directory-for-previously-unindexed-markdown-paths-27-october-2026"></a>
<a id="earlier-status-and-historical-inventory-retained"></a>
<a id="documentation-index--20-october-2026"></a>
<a id="complete-incoming-inventory"></a>
<a id="files-added-by-this-audit"></a>

## Historical inventory and exact source receipts

The previous [long-form index and SHA inventory at commit 0327422](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/0327422af4bb1fd82bdfa7deffa793ad70659515/docs/DOCUMENTATION_INDEX.md) remains intact in Git history. Removing the repeated dense historical tables from this **current navigation page** does not delete any historical source or change its provenance.

The [existing machine-readable coverage register](DOCUMENTATION_COVERAGE_REGISTER_20261025.json) tracks all Markdown filenames, source hashes and provisional authority labels. Its [methodology notes](DOCUMENTATION_COVERAGE_NOTES_20261025.md) explain the limits of historical classification. Source files and checked commits, not this index, determine what really exists.
