# Enemy skill VFX · foundation and independent audit gate

Status: **foundation only, no live visual replacement**. This document governs all 11 boss families, 5 authored captain profiles, night specialists, species/role ranged attacks, ordinary/guardian/ringleader maneuvers, and their later variants. It does not authorize new attack timing, collision, AI, summon counts, saves, audio, balance, world art or animation systems.

## Why a separate foundation

Currently `combat-visuals.js` draws warning footprints, traps and persistent hazards; `renderer.js` draws projectiles, transient effects and actor auras. `boss-combat.js` and `engine.js` own attack execution and the current tactical/rogue repertoire. Generic cones/circles can give very different skills visually identical execution or a misleading summoning marker. Boss and captain phase/summon events are emitted but not given dedicated combat VFX in the current queue. All gameplay telegraphs must remain truthful and readable.

Existing `docs/TERRAIN_EFFECTS_POLISH_V0880.md` establishes world-space projection, hazards, draw order and mobile legibility. Those constraints remain binding. Our asset strategy is **not** to paint effect details into hero/boss body sprites or to change world geometry.

## What this PR actually establishes

- `src/prototype/enemy-vfx.js` defines a **pure visual identity** (stable ID, tier, ranged/melee role, TRUE variant and attack kind). It only reads enemy + authored attack descriptors, and does not generate, serialize, randomize or resolve damage.
- The stable ID uses authored family/profile + attack index. The display name is never an asset key. TRUE is a stage-level override of the same boss attack identity, not a new duplicated skill.
- Rogue identity takes precedence over basic boss/captain identity. Night identity is separate. Ringleader and guardian role matters, including melee/ranged.
- `assets/vfx/manifest.json` starts **empty**. Every unregistered or malformed stage resolves to procedural fallback; no artwork is shipped or enabled. There is no sprite download, loader, image memory or browser behavioral change in this PR.
- `tests/enemy-vfx-foundation.test.cjs` is the independent coverage/audit gate. The current Node suite automatically discovers it, and the quick suite should also include it.

## Phase/stage contract

An attack can have these *visual* stages: `windup`, `release`, `travel`, `impact`, `linger`, `spawn` and `phase`. These are **rendering vocabulary, not new simulation phases or durations**. Time should be derived from the actual attack timer, live motion/projectile state, the resolved combat event, or a bounded transient visual queue. Never infer an attack's collision from an animation frame.

Example future asset entry (illustrative, not enabled):

```json
{
  "version": 1,
  "effects": {
    "boss/thorn/1": {
      "stages": {
        "impact": {
          "type": "spritesheet",
          "src": "assets/vfx/thorn-pounce-impact.png",
          "frames": 8,
          "fps": 12,
          "frameWidth": 96,
          "frameHeight": 96,
          "anchor": { "x": 0.5, "y": 0.88 },
          "loop": false
        }
      },
      "variants": {
        "true": {
          "impact": {
            "type": "image",
            "src": "assets/vfx/thorn-true-impact.png"
          }
        }
      }
    }
  }
}
```

The actual production pipeline should assign immutable, revisioned art filenames and maintain accepted originals. Images or spritesheets will be optional replacements **per stage**, which keeps procedural telegraph and lingering hazard fallbacks available while art is incomplete. The `anchor` and `scale` metadata are *presentation only*; no changes to gameplay centers, targeting, collision radii, world sorting or projectile coordinates. Optional looping sprites should be visual-time driven and paused with the game. Do not tie hit timing to rendered frames.

No new art style is authorized. The current procedural visual canon remains the sole design blueprint. Future effect paintings, VFX frames, particles and colors must reflect the authored monster and move rather than import unrelated fantasy iconography.

## Rogue coordination: active parallel work

At foundation creation, [PR #146](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/146) is an **open draft**, not live `main`. It adds:

- basic and signature rogue choices for all 11 bosses and five captains;
- separate melee/ranged signatures for 12 ringleader species, basic ranged variants and guardian withdrawals;
- signatures such as scatter, sweep, bind, pivot and rally;
- longer cyan/teal signature telegraphs with wrapped names for small screens.

These authored mechanics and the pending PR's warning implementation are **not** to be overwritten. The stable keys intentionally describe the `rogueMove` and `rogueSignature` fields already proposed there; no duplicate rogue table or skill names are placed in the VFX foundation. Once #146 is merged, run the complete repertoire/visibility audit against the merged branch and keep its cyan warn language. Its gameplay-specific zones, priorities and timings remain authoritative. PR #149 manual targeting and PR #148 occlusion are separate concurrent work: don't alter those systems to implement VFX.

## Proposed rollout order, after foundation passes audit

1. **Ground truth and warning/resolve bridge.** Add a visual-only event envelope with actual actor ID, stable skill ID, phase, geometry and hit location. Guard against double-triggering, attacks canceled by death/zone travel, and missed attacks. Establish summon origin/landing correctness (do not show a false damage circle).
2. **Boss/captain release + aftermath, not mass art.** Start with one melee cone, one projectile volley, one summon, one charge and one persistent hazard. Preserve existing warning geometry exactly, add actual activation/impact and short-lived effects only. Allow per-stage rollback.
3. **Distinct boss and captain identity.** Author effects for all 11 boss families and five captains, including captain second phases, normal/TRUE tiers, and the Dark Lord. Avoid full-screen flashes and effect spam on phone.
4. **Night/ranged/guardian/ringleader.** Improve Soul Drain, Shadow Pounce, ranged projectiles, guardian skills and ringleader Frenzy; after #146 merges, treat basic/signature rogue moves as their own track.
5. **Reviewed sprite/animation replacement.** Plug the future asset registry into the site's script/core inventory, offline cache, deployment and renderer. Use a bounded lazy decode budget and content-revision invalidation, extending the existing sprite lifecycle safeguards. Do not build a second image loader unaware of `sprites.js` and its eviction/rollback rules.

This PR **does not connect** the descriptor to `renderer.js` or `combat-visuals.js`. That connection belongs to the first reviewed runtime VFX tranche, after the rogue branch is reconciled. Neither procedural effects nor display art should become a required simulation dependency.

## Independent foundation audit checklist

- [ ] Assert registry and attack-slot coverage for every main-branch boss and captain, night skills, ranged variants, and prospective rogue melee/ranged basic/signature descriptors.
- [ ] Verify identity stability when labels, TRUE form, attack geometry and names change.
- [ ] Verify missing/broken/malicious asset, missing stage and incomplete TRUE variants fallback to procedural without hiding cues.
- [ ] Verify the module is presentation only: authored plans and campaign state remain unchanged; no new saved state or effect scheduling occurs.
- [ ] Verify the empty manifest is intentional and no new image fetch, runtime script order change, SW/cache revision or screen change sneaks in.
- [ ] Run tests + formatter + build checks on the isolated branch; inspect PR CI and reconcile main before merging.
- [ ] When runtime integration begins, add desktop + phone screenshots (day/night, crowd and TRUE), exact warning-vs-damage geometry checks, event delivery/cancellation tests, screen/zoom performance, and future asset packaging/cache tests.
- [ ] In later art integration, do not claim a sprite-sheet pilot is production-ready without playback tests on Chromium + WebKit mobile.

### Audit decision and outstanding risks

Foundation is intentionally **inert** until the renderer is attached, so it cannot yet improve visuals or prove future GPU/decode performance. Names are not authoritative; source IDs and authored indexes are. Attack indexes must remain mapped to their original move when reordering the rules; an explicit stable move key can supersede an index if a future authoring migration actually reorders abilities. Asset-source existence, frame atlas bounds, author review, budget and offline packaging cannot be proved by an empty manifest; those are hard blockers on publishing the first live VFX art.

**Acceptance gate:** only merge this foundation if the new tests pass, formatting passes, the build/PWA checks remain green and a separate review finds no gameplay or rogue-branch interference.
