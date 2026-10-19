> **Historical record — 19 October 2026:** Candidate status, approvals, failures and next actions below apply to their dated checkpoints. They do not direct a new chat to resume or re-merge old work. The published snapshot is `0.9.1+snapshot.dev.78`; development is paused, with [current state](DEVELOPMENT_STATE.md) and draft #319 governing recovery. Original evidence remains below.

# Deferred combined hero audiovisual verification

**Plan only. None of these checks has been executed by this audiovisual workstream.**
Begin only after the owner authorizes testing of the consolidated development
candidate. Do not let branch preparation trigger hosted tests or deployment.

## Consolidation preparation

1. Establish the latest active-skill baseline and all owner-approved workstreams.
   Merge `feature/hero-skill-av-20261015` by ancestry, excluding old PR #305.
   Reconcile additive event metadata and keep current gameplay rules untouched.
2. Choose a single development/release version and cache identifier after all
   integration conflicts are resolved. Regenerate the entry graph, build-info,
   audio catalog and service worker through `npm run build`. This branch only
   made mechanical generated-file edits and did not run the build.
3. Run the repository's formatting pass/check, generated/asset checks and one
   combined non-browser/browser gate. Reuse that evidence when the tree is
   unchanged; do not certify every individual skill with repeated full runs.

## Behavioral invariants to establish

- Compare the authoritative parent and combined candidate for identical damage,
  cooldowns, eight-rank growth, 0.65s hold, tap/cancel boundaries, status durations,
  targets, collision paths, costs, boss phase/telegraph behavior and controls.
  New receipts, transient markers and art must never authorize or reject a skill.
- Exercise every class × slots 1–8 × tap/charged = **48 forms**, at rank 1 and 8;
  include rank 4 where secondary coverage steps matter. Use the broader active
  skill combined balance matrix rather than replacing it with cosmetic checks.
- Paladin: shield re-tap/expiry and cooldown onset, disabled Skill 1 during stance,
  weaker offensive damage, Shield Bash/Vanguard wall and leash interactions,
  Judgment taunt versus independent boss specials, ward/stance overlap and
  non-invulnerable party protection. Effects must report actual mechanics.
- Mage: successful/failed current-cast Interrupt, next queued warning preserved,
  Silence on enemies AND allied specials with ordinary attacks still possible,
  Fracture strength/expiry/overlap, Force without invented Slow, exact chain
  recipients and synchronous damage, bounded normal/charged explosions.
- Ranger: two normal pinning arrows, charged line geometry, actual healing
  recipients, no-allies Rally rejection and movement/basic-attack-only buffs,
  no dash or special-speed promise, last-arrow knockback, piercing single-target
  treatment and correct normal/charged isolated-target hunt arrow counts.
- Real projectile launches occur only after their existing stagger delays; travel
  and impacts match actual paths, redirection, rejection and terrain removal.
  No arrows sit visible at the hero while waiting. Pre-knockback impact position
  is separate from the subsequent displacement streak. Vanished targets do not
  receive invented later damage or impacts.

## Visual and sound acceptance

- Capture all 48 forms with actual sprites and procedural fallback at the default
  150% camera, plus 100%/175%; day/night, indoor/outdoor, Normal/TRUE encounters.
- Evaluate legibility against mixed packs, companions, summons and simultaneous
  boss warnings, including dense geometric/checkerboard/line/anonymous warnings.
  Warning outlines and cast labels must stay readable above hero decoration.
- Confirm shield/ward, taunt, Slow, Weaken, Fracture, silence, haste and Rally
  cues match actual active status and disappear on expiry, death, restore,
  class/campaign change and travel. Some status icons intentionally coalesce
  under the documented per-enemy limit; gameplay/warning cues must not disappear.
- Judge class silhouettes, impact positions, shaft visibility, source artwork
  consistency, charged weight and skill identity. Mage Force/Fracture/chain must
  not resemble frost; Ranger effects must not imply magic damage or dashes;
  Paladin ultimate protection must not imply invulnerability.
- Audition normal/charged releases, actual flight staggering, hits, blocked hits,
  interruptions, charge build/ready/cancel and simultaneous chains/volleys. Check
  headphone, Chromebook speakers and phone speakers at ordinary volume.
- Confirm near-simultaneous warnings retain audible priority and hero sounds
  recede. Check mute and each relevant volume, foreground/menu/background mix,
  audio unlock, context suspension/resumption and missing optional recordings.
  Soft caps may merge rapid contact sounds but never real projectile drawings.
- Turn OS reduced motion on/off during play. Static footprints, contact glyphs,
  real projectiles, warning cues and charge progress must remain; decorative
  shards, oscillation, orbital movement and staggered link jitter should stop.
- Exercise keyboard, mouse, touch and hybrid input: tap under existing cutoff,
  partial hold cancel, exact/long charged release, queued cooldown, lost target,
  missing allies, full-health heal rejection, lost pointer capture, menu, focus
  loss and backgrounding. No presentation callback may produce a later cast.

## Performance, packaging and recovery

- Measure default and optimization modes in representative populated battles on
  actual target devices; compare frame work/cadence to parent. Inspect queue
  ceiling (40 shared effects), no more than 24 enemy status drawings, bounded
  decoration and audio voice/source cleanup. Current bounds are design limits,
  not measured performance guarantees.
- Verify Chrome desktop/Chromebook and phone Chromium/WebKit, small supported
  portrait/landscape views, all three entries and 150% zoom. Screenshot changes
  should be scoped to these explicitly authorized combat effects.
- Validate both new scripts are in canonical inventory, generated script order,
  package, all entries and service-worker precache. Install/update/reopen offline;
  confirm all sound/art works without extra network requests and cache transition
  preserves v4 saves and retained legacy backups.
- Import real historical v4 saves and test succession, death recovery, travel and
  new campaign. Presentation markers/queues must not survive as active combat
  states, modify save rank/cooldown semantics, or leak old effects into a new scene.
- Publish the eventual combined result only after the owner's merge/deployment
  authorization and successful applicable checks of that exact tree. Record exact
  commit/run evidence and distinguish implementation, automated checks, physical
  device judgment and deployed behavior.
