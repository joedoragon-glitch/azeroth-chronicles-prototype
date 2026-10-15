# 15 October iPhone playtest audit — candidate dev.63, PR #308

This record covers every request visible in the playtest conversation, including the later witness clarification and Paladin sound report. PR #300 was explicitly authorized, merged at `d7c878b992b35b72e2df2f7f44afb1f16ac21ff8`, and its dev.57 Pages release was verified earlier in the session. The changes below are a separate candidate in [PR #308](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/308), branch `fix/highlands-mounted-ogre-art`. They are not merged or deployed. Leave the complete candidate for the owner's return; do not infer new merge authorization from #300.

## Consolidated passive update

At the owner's 15 October request, PR #307 (`8c452bc0515e05c9088bc304c2ae4d3be206d4f0`) is incorporated into this same PR #308 candidate. Seven new boss passives, two new captain passives, and Archive descriptions for all eleven bosses/five captains are included alongside every playtest correction below. See [the passive ledger](COMMUNITY_SNAPSHOT_PASSIVE_COMPLETION_20261015.md) for tuning, counters and constraints. The source histories are retained together.

The earlier dev.60 exact head `9290b9d80730ad2793158f41b6ff672ddc867046` passed automatic run [38723686236](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38723686236). That result certifies the earlier playtest-only candidate, not this expanded dev.61 update. The native focused passive regression passed on the combined source. Full release validation is deferred by the owner; this checkpoint is published with `[skip ci]`, without starting GitHub Actions. Nothing is merged or deployed.

## Consolidated enemy healing update

The owner also requested PR #306 (`c8d0ee2e7cb9a9986c60166a454efc0b44b1add8`) in this same update. The dev.62 candidate includes its eligible ranged-monster support healing, three captain/five boss restorative profiles, gradual recipient-relative healing/scaling, species-specific particles and healer links, ongoing status and transient v4 cleanup. See [the healing integration ledger](ENEMY_HEALING_CONSOLIDATION_20261015.md). Both source histories and all of #307 remain included.

The render-hook conflict preserves both the healing indicator and #308 actor captions; warning floor shapes remain beneath actors/props. Historical source receipts are retained, with a separate exact combined-source receipt; the sprite-scope evidence is regenerated. Native focused healing, passive and Rogue regressions passed on the combined source. This is not full release certification. GitHub Actions remain prohibited, publication uses `[skip ci]`, and no merge or deployment is authorized.

## Charged casting and Slow integration

The owner added PR #310 (`695ac81d78a6788c00a7f75141370941392b0ae6`) and the latest saved Slow branch (`752158bf7048c34d77b8b9db0f3de1477a668366`, not the older closed #309 head). Both are incorporated with #306/#307 in this same dev.63 candidate. [Combined code-audit dispositions and deferred verification](CHARGE_SLOW_CONSOLIDATION_20261015.md) record the shared fixed preparation clock, post-damage release phase, actual-HP interruption/recovery and feedback, 65%/85% cooldown recovery, final-frame Slow fix and newly introduced healing/passive timers.

**No tests, browser suites, builds, deployment checks or GitHub Actions were run for this batch, per the owner.** Regression source is adapted for the eventual single combined validation. Prior green evidence is historical and does not certify this expanded head. Version/cache metadata is synchronized directly; build regeneration is deferred.

## Feedback coverage

| Owner feedback | Implemented result and owning files |
| --- | --- |
| Highlands Crown direwolf lance patrol has a huge rider on a small mount | Shared `visuals.js:crownDirewolfRider` reduces seated human/equipment to 0.72 and enlarges mount/tack to 1.22 about the paw anchor, with aligned saddle/stirrups. |
| Ranged mounted variant has the same proportion problem | The same helper corrects the archer, including the shared Mine/Treasury guard bodies. Wild wolves and bosses keep their separate art. |
| Ogres need an aesthetic pass | `visuals.js:ogreBody` uses rounded connected torso/arms/hands, readable brows/nose and curved paired tusks. Club and stone thrower keep distinct gear, original palette and guard/Crown overlays. |
| Huge iPhone Chronicle cards hide combat | `styles/phone.css` gives long notices the safe horizontal width, shallow padding and inline label, with readable wrapping. They remain below vitals and pass input through. |
| Delay announcements until disengagement/end of combat | `app.js:updateCriticalNotice` queues nonurgent narration and milestones until 2.5 seconds of quiet after nearby hero/party threats, incoming projectiles and residual hazards. Danger hides/requeues existing prose with its full reading time. Urgent warnings remain immediate. |
| Tripwire 0.5 / Rogue 0.3s appears frozen | `engine.js:updateEnemies` no longer lets anchored regroup skip an already committed telegraph, motion or ranged aim clock. Reproduced the actual Tripwire freeze and verified countdown/release after the correction. Regular numeric cast labels explicitly include seconds. |
| Cast-name rectangles obscure the enemy | `combat-visuals.js:actorCues` uses translucent plaque/progress backgrounds (roughly half opacity). Named plaques anchor above their caster, away from the player-targeted footprint. |
| Warning shapes render over hero, companions, terrain props and monsters | `renderer.js` paints warning fills and outlines before standing entities, then paints actor captions separately. Ground geometry stays authoritative and visible around feet; it cannot paint over a standing body or prop. |
| Ordinary Rogue slows do not give enemies an edge | `rules.js:tacticalFoundation.rogueSlowMovementFactor` is 0.4: a 60% movement reduction, including sprint and ordered movement, for hero and companions. Existing durations remain. Generic non-Rogue slows retain 0.65. |
| Ordinary Rogue circle does not cover its visible area | Ground-marked ordinary basic moves resolve against every living combat party member inside the fixed, original circle at release, with individual LOS, immunity and dodge gates. The original victim can escape; an inside-edge party member can still be hit. Per-victim damage coefficients are unchanged. Elite actor-only basics and Garun's special lane keep their authored contact rules. |
| Thornfang footsteps should be subtler and have no shadows | `visuals.js` draws smaller translucent mud impressions in the ground plane. `renderer.js` paints all scout tracks before standing entities, bypassing shadows, rings, auras and labels. IDs, routes, spacing, lifetime and interactions remain. |
| Farm animals and other non-monsters should wander locally and cannot be harmed | `visuals.js:ambientAnimalPose` gives sheep, poultry, penned animals, pups and mire nest creatures independent bounded walk/rest phases. Structures/feed stay fixed; confined animals stay local. Shared presentation time freezes motion on pause. These existing creatures have no combat targets or HP and cannot be hit. `sprites.js` prevents a flat static composite from suppressing their individual motion. |
| Joystick should be subtler/more transparent | `styles/phone.css` reduces base/thumb opacity and border weight and removes their shadows. The 104px touch region and 44px thumb remain, with centered thumb placement and unchanged gesture handling. |
| Witness should provide a useful clue and look more stylish | `navigation.js:thornReport` reports actual nearest patrol site and next route leg, plus fighting, return, defeated/Mira-waiting and rescued states. `visuals.js` gives the existing orchard witness a moss cloak/hood, copper clasp, scarf, satchel, staff and rolled chart. |
| Witness conversation does not need to pause; keep it concise | Witness interaction produces a short “Last sighting … heading for …” clue using the nonurgent narration queue. It opens no modal and does not pause action. Combat defers it. Longer existing track/lore interactions retain their context. |
| Paladin auto attack sounds wooden | Dedicated `blade-air`/`blade-contact` recipes replace the generic falling body tone in the two existing Paladin recordings. Bright inharmonic steel partials, a short edge scrape and airy release replace the wooden knock. `audio-effects.js` cold fallback uses matching steel/air synthesis. Event IDs, combo routing, duration, gains and attack timing remain. |
| Lantern Wraiths carry lanterns and should illuminate | `renderer.js` derives a light from each living visible Wraith's actual mirrored, bobbed hand position, including captain scale. `visuals.js:atmosphere` adds restrained daylight bloom and a small warm night pool with bright glass. No extra fixture is drawn; death removes the light and Optimization Mode retains it. |
| Asked where the previously requested immortal/summoning Game Master mode is | Already released as Developer Mode. Open `phone.html?developer=1`, then Menu → New Developer Mode run. Fatal damage refills HP; regional boss/captain summons and damage telemetry are present. Separate developer save slot; no duplicate implementation or public gate change. See `docs/DEVELOPER_MODE.md`. |
| Review the entire chat, record an audit and leave a PR ready for return | This mapping, focused regression evidence, reusable art handoffs, before/after references and the PR description preserve the full batch. Existing CI remains the release gate. No manual full test/certification run was dispatched. |

## Evidence actually completed

- Local build, formatting, generated files/syntax, sprite/material inventories and enemy audio coverage passed for dev.60.
- `rogue-cast-continuity.test.cjs`: actual Tripwire, ordinary/elite Rogue and ranged clocks while a target leaves regroup range; release/miss instead of freezing; full circle, inside/outside edge, cover and immunity; sprint speeds across classes; expiration; hero/companion save round-trip; ground/caption ordering and translucent rendering.
- `ambient-life.test.cjs`: all five families really change their rendered positions, alternate local walking/resting, remain continuous/deterministic when paused, avoid static substitution, and retain IDs after save. Existing livestock cannot be attacked with any hero skill slot.
- `snapshot-cozy-night-lighting.test.cjs`: real native renderer checks day/night, both facings, captain scale, movement, Optimization Mode, dead/unrelated-creature exclusion and save purity; no extra floating lamp. Retained natural Marches Lantern shore before/after, day and portrait-night references.
- `thorn-witness.test.cjs`: all patrol legs, current direction, fighting/return, fresh/expired tracks, Mira's post-defeat location, rescue, invalid historic leg fallback, proximity and combat-deferred narration.
- `notice-presentation.test.cjs`: extracted actual shell updater, quiet interval, combat interruption/resume, urgent warning priority, projectile/hazard safety, full reading time and campaign isolation. Existing `prototype-ui.test.cjs` now asserts the quiet interval before prose resumes.
- Existing focused suites passed during implementation: mobile Rogue casts, Rogue integration (99 basics/51 signatures and lifecycle), combat conditions, Ironroot cues, encounter lifecycle/historical saves, Thorn patrol/rescue (18 seeded circuits), enemy VFX art (264 recipes), mounted guards/facing/Crown composition, menus, narration and audio catalog/playback dispatch. Unchanged successful suites were not repeatedly rerun.
- Actual Campaign/native Canvas captures retain both riders and Ogre loadouts at desktop/phone 100/150%; additional phone portrait/landscape day/night combat-cue scenes, scout-track before/after, witness before/after, and three motion phases for each ambient family. Gameplay draws are save-pure. Review JPEGs are compressed evidence, not pixel parity fixtures.
- Original Paladin pre-change WAVs and measured before/after PCM are retained under `tools/audio/references/paladin-steel`. Both replacement masters are finite, have zero-edge envelopes and measured nonclipping peaks below 0.19. Subjective iPhone listening remains owner review; spectral measures do not establish aesthetic acceptance.

## CI corrections and remaining release evidence

The initial dev.58 [automatic run](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38708396982) failed. Its Node failures were stale protected-source/sprite-scope receipts and an announcement test expecting immediate combat-to-prose delivery. Its browser failures were a 0.5-second notice expiring during screenshot capture before an interruption probe, and a keyboard test expecting a nonurgent level-up milestone while enemies remained engaged. The fixtures now preserve the historical receipts, explicitly record this owner-authorized batch, wait through the new quiet interval, give the screenshot probe a real reading window, and isolate the keyboard test from combat. Required job names and workflows are unchanged.

The complete dev.59 [automatic run](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38713358549) passed the new focused regressions and Chromium quest/announcement, Rogue, audio, sprite, terrain and VFX paths. WebKit passed phone gestures, save upgrades, quest/announcements, Rogue effects, audio, VFX, actor idles/combat, terrain and performance before its final captures. The main job exposed four remaining older Node expectations and a browser render probe:

- Audio housekeeping now retains the original v0.8.86 catalog/music/routing receipt and per-kind hashes for every original sound. Exactly `heroSteelImpact` and `swordSwing` have separate authorized recipe hashes; unrelated effects still fail if changed.
- The Dreadmaw protection test reconstructs the original Rogue table by removing only the explicitly recorded new 0.4 movement factor. All older protected fields and method hashes remain enforced. The complete 42-cast/lifecycle Dreadmaw suite passed locally.
- Node and Chromium terrain probes now assert the authored ground-underlay/caption split rather than requiring warning outlines above actors.
- First-boss scenarios still defeat the same 1200-HP Thornfang without deaths or potions. Daylight Mage/Ranger finish in 15.6/16.3 seconds instead of 18.8/19.3 with the old engine timer path: they stop evading the no-longer-frozen cast sooner. Their minimum timing bound is now 15 seconds; the other four scenarios retain 17 seconds. The 120-second ceiling, win, death, supply and historic HP-upgrade assertions remain. No game code was changed to satisfy this result.

The historical phone pixel comparison also applies exact scoped reference transforms for the explicitly requested joystick and announcement styles. It retains the original fixture, every other pixel, and its altered-button negative control. All four formerly failing Node suites passed locally after these test-only corrections. The next automatic head run remains the final integrated gate; passing subsets do not certify the old failed run.

The dev.60 [automatic run](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38719313729) passed every Node suite and the complete WebKit job, including performance and visual captures. Its only remaining failure was a later legacy Chromium critical-notice probe running in a restored combat scene. The geometry/stack probes and level-up reminder now run against a temporary quiet campaign with simulation frozen, then restore the original campaign, effects, tick and saved run. Combat deferral remains tested by the dedicated real-shell and Chromium/WebKit notice helper. No production code or version changed for this test correction.

The notice geometry/interruption helper and concise witness shell check remain in existing Chromium/WebKit paths. Local browser binaries could not be obtained (empty/truncated downloads), so no local browser pass is claimed. Final automatic CI must pass at the complete new PR head before this candidate is called merge-ready. The latest run/head and remaining action belong in the PR resume comment, avoiding a self-referential commit hash here.

## Compatibility and retained canon

The v4 save version and existing keys remain compatible. An optional bounded `rogueSlow` remaining-time field distinguishes the authorized stronger Rogue condition; old saves without it retain ordinary Slow behavior. Death/recovery/expiration clear it. No economy, loot, training, quest payout or per-victim damage coefficient changes were made. The ordinary Rogue area correction intentionally changes who is struck to match its existing visible circle.

Per-design handoffs: `crown-direwolf-riders.json`, `ogre-body-aesthetic.json`, `thornfang-scout-tracks.json`, `ambient-harmless-wander.json`, `thornfang-trail-witness.json`, and `lantern-wraith-light.json` in `tools/sprites/design-handoffs`. These preserve procedural owners, stable identity, revision references and future animation requirements. No generated raster replacement or owner acceptance of new aesthetics is implied.

## Historical selected-AV checkpoint — dependency handoff now incorporated

The owner selected `feature/hero-skill-av-20261015` at
`3687c17b78c499d509454edf71bfb99dc202aa81` for this same PR #308 and said the
remaining hero skill overhaul handoff is coming next. GitHub source and ancestry
were retrieved, not just the chat summary. The AV source has two presentation
commits above active-skill parent `1d142ea7936e4004e697fb9ebbb7205eb6d33cf5`.
The currently retrieved active-skill branch
`feature/hero-skills-2-4-on-snapshot-20261015` is at
`2300d7e9c9e7142595956ae3dca4d3acdbe37f15`; its later commits add concise
player-facing skill references. Both descend from the same active-skill parent.
Historical PR #305 is excluded.

**Selected, not yet merged into the runtime.** The AV branch depends on the full
new Skills 1–8 implementation. A whole ancestry merge now would also import the
hero gameplay overhaul before its promised handoff; porting only its visual hooks
would leave some effects describing skills absent from the combined runtime.
Preserve the existing combined implementation until that dependency is supplied.
The exact source [48-form mapping](HERO_SKILL_AV_IMPLEMENTATION_20261015.md),
[development ledger](HERO_SKILL_AV_DEVELOPMENT_LEDGER_20261015.md),
[combined verification plan](HERO_SKILL_AV_COMBINED_VERIFICATION_20261015.md), and
`tools/sprites/design-handoffs/hero-skills-av.json` are retained here unchanged as
source handoff records. Their statements describe the source branch, not completed
integration or validation of #308.

When the hero handoff arrives, establish its latest authoritative commit first,
then merge that source and AV by ancestry into this branch. Keep the shared
0.65-second active clock, actual-HP interruption accounting after final mitigation,
short recovery, 65%/85% Slow cooldown recovery, post-damage companion completion,
healing/passives and all iPhone fixes. Reconcile shell charge rise/ready/cancel
feedback against the shared clock (the AV source still uses `performance.now()`),
avoid double interruption audio/visuals, retain the warning underlay and separate
actor captions rather than restoring the old ground cue pass, and keep enemy and
companion presentation paths. New script inventory, load order, entry pages and
service worker must be reconciled at one combined version; do not copy the older
AV package/cache identifiers over dev.63. The eventual authorized regeneration
and validation must include all 48 forms, reduced motion, sound limits, device
performance, historical saves and PWA/offline behavior. No balance or 0.65-second
change is authorized by this AV addition.

This documentation-only checkpoint does not change runtime/generated artifacts or
source receipts. No tests, builds, browser sessions, CI, merge into main or
deployment were initiated. Continue this same PR; do not create an AV PR or treat
this dependency record as completed incorporation.

## Hero gameplay and audiovisual overhaul incorporated

The owner supplied the complete hero handoff and confirmed this remains the same
combined update. Gameplay source `06d174f0612b75b165f458e9fea1db60073ef5f5` and
AV source `3687c17b78c499d509454edf71bfb99dc202aa81` are incorporated by ancestry
with every previously selected #308 workstream. The prior dependency-wait section
is historical, superseded by this integration. [The combined hero source ledger](HERO_SKILLS_CONSOLIDATION_20261015.md)
records all 48 forms, preserved gameplay/numbers, concise skill reference menus,
file conflicts, shared charge/Slow/Silence/healing reconciliation, module/offline
load paths, source-only regressions and the deferred single validation gate.
PR #305 and independent hero passives remain excluded. One dev.64 package/cache
identifier is used; canonical build regeneration is deferred. No tests, builds,
browser sessions, GitHub Actions, main merge or deployment were initiated.

The owner additionally requested complete, appropriately concise player learning:
Combat conditions is accessible from Controls and Hero skills, while the Keeper's
Conditions and recovery shelf reserves detailed live rules for its figures view.
Slow recovery, Silence, interruptions, Weaken/Fracture, taunt, protection, Rally,
dust/displacement and enemy healing are covered; eligible Archive healer profiles
and developer condition documentation are reconciled. No extra compulsory NPC
lecture or combat popup is introduced.
