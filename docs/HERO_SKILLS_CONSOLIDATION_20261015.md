# Hero gameplay and audiovisual consolidation into PR #308

15 October 2026. **Source integrated; validation deferred. Nothing merged into main or deployed.**

## Authority and one continuing update

The owner supplied the completed hero integration handoff, then clarified that it
belongs in the current chat's existing implementation so **everything is tested
and released together**. PR #308 / `fix/highlands-mounted-ogre-art` remains the only
release/review PR. No competing hero PR is created. Local isolated preparation
branch `integration/consolidated-hero-skills-20261015` starts from freshly fetched
main; its reconciled result is incorporated back into #308. Preserve all of the
previously authorized #306 healing, #307 boss/captain passives, #310 charged damage
interruption, latest saved Slow overhaul and phone playtest work. They are already
approved for this single update, rather than unrelated work silently imported.

| Retrieved source | Exact commit | Disposition |
| --- | --- | --- |
| Latest main, including merged #300 | `d7c878b992b35b72e2df2f7f44afb1f16ac21ff8` | Isolated preparation baseline |
| Complete Skills 1–8, balance, concise menus and handoff | `06d174f0612b75b165f458e9fea1db60073ef5f5` | Merged first by Git three-way ancestry |
| Complete audiovisual source | `3687c17b78c499d509454edf71bfb99dc202aa81` | Merged second by ancestry, retaining newer gameplay menus |
| Existing #308 implementation and selected-AV records | `7d0b9033e0cda2be1e82f62b6c090410f62caa04` | Reconciled with the hero result; retained as publication first parent |

The AV parent `1d142ea7936e4004e697fb9ebbb7205eb6d33cf5` predates the later
hero-reference menu commits. No file is replaced wholesale from an older branch.
The source heads remain ancestors, so future merges cannot blindly replay the old
implementation. Historical partial PR #305 is excluded. Independent **hero class**
passives remain deferred; this is distinct from #307's already authorized enemy
boss/captain passives.

Read the original [single-integration handoff](HERO_SKILLS_SINGLE_INTEGRATION_HANDOFF_20261015.md),
[skill specification](HERO_CLASS_SKILLS_2_8_CONSOLIDATED_REVIEW_20261015.md),
[damage/cooldown audit](HERO_SKILLS_COOLDOWN_ROTATION_DAMAGE_AUDIT_20261015.md),
[static balance audit](HERO_SKILLS_STATIC_BALANCE_AUDIT_20261015.md),
[player guidance audit](HERO_SKILL_PLAYER_GUIDANCE_AUDIT_20261015.md),
[48-form AV mapping](HERO_SKILL_AV_IMPLEMENTATION_20261015.md),
[AV development ledger](HERO_SKILL_AV_DEVELOPMENT_LEDGER_20261015.md), and
[combined AV verification](HERO_SKILL_AV_COMBINED_VERIFICATION_20261015.md).
Their source-branch status statements are historical, not evidence of integrated
validation. This ledger supersedes the prior #308 dependency-wait checkpoint.

## Preserved approved behavior

- All 3 classes, 8 slots, normal/charged pairs: **48 forms**. Same Rank 1–8,
  +15% of rank-1 baseline per rank, one learned rank and shared cooldown slot.
- Fixed **0.65 active seconds**; short tap below 0.20s; incomplete hold cancels.
  Base normal cooldowns stay 0.85/3/8/14/9/4/15/24s; charged
  3/6/20/20/18/12/25/40s. Existing training reduction stays intact.
- Paladin stance/Weaken/Judgment and stronger-single ward mitigation, Mage
  frost/force/chain/Interrupt/bilateral Silence/Fracture distinctions, Ranger
  Rally/healing/pinning/repelling/piercing/multi-arrow mechanics are retained.
  Ultimates stay class specific and grant no universal immunity. Approved
  durations, damage coefficients, area caps and boss targeting safeguards stay.
- Shared damage interruption remains cumulative **actual HP lost after final
  mitigation**, max(6 HP, 7% max HP), lethal cancellation, 0.5s charged retry
  recovery and no full ability cooldown on interruption. All eight hero holds
  now use that existing common path; ordinary taps retain their existing path.
- Slow retains 65% allied / 85% enemy cooldown recovery, including fresh
  cooldowns and final partial-frame overlap. Rally improves only ordinary
  attacks/movement. No second Slow penalty, altered hold/warning/buff duration,
  enemy HP nerf, relaxed immunity or invented hero passive is added.

## Conflicts and code-level reconciliation

| Owner / overlap | Resolution |
| --- | --- |
| `app.js`: all-eight input versus #310 transient charge maps | Keep all-eight target requirements, Rally recipient and Ranger-only healing checks, shared active-time clock and lifecycle cancellation. Retain skill-specific colors plus build/rise/ready/cancel observations. Cancellation reads the common seconds clock rather than mixing it with AV's old performance milliseconds. Successful release clears the transient map without playing cancel feedback. Damage interruption uses its existing dedicated treatment once. Guard observation/HUD paths after lifecycle cancellation. |
| `hero-combat.js` | Keep the full authoritative gameplay plus additive cast/chain/contact/displacement receipts. Add only the existing shared charged-recovery gate to direct charged resolution; ordinary taps remain allowed. No damage/range/status/cooldown retuning. |
| `combat.js`: final HP and event receipts | Apply the stronger of stance and ward after armor, then record actual HP loss for interruption and life steal. Keep actual departure after stagger/target checks, blocked-contact receipts, pre-push impact coordinates and successful push only. |
| `engine.js`: cooldown and shield lifetime | Shared Slow recovery decrements all eight cooldowns once; stance duration and Silence expiry use ordinary time. Stance end still starts its normal slot cooldown. Preserve #308 post-damage companion release and frozen-Rogue correction. |
| Enemy ordinary/Rogue damage | Preserve Weaken and #307 outgoing factors together. Combined direct ordinary melee/Rogue hits carry the source ID through shared damage; no duplicate passive multiplier. Existing full-circle Rogue victims, geometry and per-victim coefficients stay. |
| Silence versus #306/#310 | New enemy support-healing activation honors Silence; existing healing pulses are not canceled. Companion special initiation and pending release honor bilateral Silence without spending full skill cooldown. Normal attacks remain permitted. Existing active immunity remains effective; Soldier survival activation follows the hero source's Silence rule. |
| `party.js`: Rally plus Slow/preparation | Combine Rally movement with the stronger existing Rogue movement factor. Rally alters only ordinary swing/shot interval; special/heal/defensive recovery remains on the existing shared Slow path. Pending charged skills still finish after damage, never instantly. |
| `boss-combat.js` / save | Union both sets of transient status/passive cleanup fields. Keep independent boss special targeting, defenses, scripts and authored phases. v4 snapshots strip temporary new stance/ward/Rally/Silence on copies, preserving live state and original save keys. |
| `renderer.js` / `combat-visuals.js` | Retain all hero drawings, actual projectile shapes, status badges, reduced motion and bounded queue. Keep #308 floor warnings beneath actors/props; paint healing indicators and translucent actor captions separately above hero decoration. Do not restore the obsolete above-actor ground cue pass. |
| Audio facade / audition | Keep dedicated interruption sound, steel recordings, new hero owner, warning headroom and existing mixer/settings/cleanup. Add missing hero owner and its catalog dependencies to `tools/audio/index.html`; otherwise its manual audio facade load would fail. |
| Player information | Keep latest concise Adventure/Barracks/teacher Hero skills pages, live cooldown/rank/trainer/cost details and optional Keeper information. The earlier AV fork does not overwrite these. No tutorial framework or empty passive UI. |
| Package / PWA | One dev.64 version/cache ID; both new modules remain in canonical inventory, browser template, all three entries, CommonJS audio owners and SW precache. Mechanical version/generated-file reconciliation only: no build or generator execution. |

New owners `hero-presentation.js` and `audio-hero.js` are retained from the AV
source. No raster assets, recordings, timers, presentation callbacks that cast
skills, or parallel animation/audio systems are introduced. Existing save, party,
encounter, rendering and audio owners continue to own their respective state.
Travel/death/bench/Recall/input-loss/pause cleanup uses the previously consolidated
clock/maps, with the hero source's new transient status cleanup retained. Do not
infer a new blanket zone cancellation for ordinary timed wards from cosmetic
status wording: approved source lifetimes remain authoritative.

## Player information reconciliation requested during integration

The owner also requested that changed conditions remain learnable without
lengthening every menu, skill card or NPC speech. Source inspection found the
existing Controls and Hero skills quick references plus the Keeper's short topic /
optional figures pattern; no general status guide existed there. Add **Combat
conditions** to Controls and Hero skills (therefore accessible through Adventure,
either Barracks and teacher Review). Each selected topic shows only a brief
explanation. The Keeper gains **Conditions and recovery**, sharing those brief
definitions while reserving detailed rules and live percentages for his existing
figures view. Keep his pact/availability gate and lore unchanged.

Cover Slow movement/cooldown recovery, Silence, actual-HP charged interruption
versus Mage Spell Interrupt, Weaken/Fracture, taunt, Haste/Rally, protection,
dust/displacement and healing. Existing boss/captain/observed ranged-healer
records show applicable support-heal names; passive dossiers remain intact.
Correct the old armor-only formula label to identify it as the pre-shield/ward
stage. Update `COMBAT_CONDITIONS_V09.md` to remove obsolete current claims about
hero immunity, Ranger Skill 6 haste and nonexistent Silence, retaining dated
historical findings separately. No new combat mechanic is implied by these copy
changes. Menu, Archive read-only/figures and shared-definition cases are added but
not executed; phone wrapping and actual player comprehension remain in the joint
gate.

## Deferred regression source and one acceptance gate

**Not executed:** no feature/suite tests, browser session, simulation, build,
generated-file check, CI/workflow dispatch, deployment check or gameplay test.
Pinned formatting was applied to edited source; that is not a correctness pass.
Publication uses `[skip ci]` without changing permanent CI protections.

Added `tests/hero-skills-consolidation.test.cjs` for all 48 resolver/presentation
forms, combined stance/ward actual-HP interruption, direct charged retry gating,
new shield cooldown under Slow, Silence versus pending companions/support healing,
Rally/Slow and save purity, staggered actual arrow departure and installed AV audio
routing/mute. Existing keyboard/touch cooldown source matrix now covers all eight
slots and valid Rally recipients. Audio offline/harness fixtures include the new
owners. Legacy audio recipe preservation explicitly bypasses only the replacement
hero dispatcher, leaving original music/routing/recipes guarded; the combined
suite exercises the installed new dispatcher. These are written cases, not passes.
Other historical gameplay/UI expectations may require adaptation at the shared
gate where approved skill behavior deliberately changed; never restore obsolete
skills or weaken enemy encounters to satisfy them.

Historical source receipts remain intact. A separate authorized hero-consolidation
receipt binds exact combined source, active frame and this ledger. Sprite-scope
source hashes are synchronized statically; its world-discovery generation is not
run. Prior green checks do not certify dev.64.

After all selected initiatives are assembled and the owner authorizes the single
gate: regenerate canonical build outputs once, check formatting/assets/generated
artifacts and protected receipts, run the full regression and Chromium/WebKit
matrix, cover all 48 forms at ranks 1/4/8 and Normal/TRUE boss interactions,
solo/full-party and reactive versus canned rotations, teaching/menu paths,
actual launches/impacts/status and audio priority/mute, reduced motion, legacy v4
saves/death/Succession/travel, device performance and PWA install/update/offline.
Record exact commit/tree evidence. Subjective appearance/sound/device comfort and
combat balance remain unmeasured. Separate owner merge/deployment approval remains
required after successful combined validation.
