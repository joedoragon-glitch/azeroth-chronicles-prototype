# Abyss Dragon — aviation terminology handoff (#243)

**Review status:** The owner agreed *in principle* to the seven real aviation terms and authorized moving to the next development phase. This is approval of the naming direction, not a blanket authorization to change attack geometry, combat balance, or locked runtime contracts. This document records intended labels; it does **not** assert those labels are currently visible in combat.

## Proposed player-facing labels and exact existing owners

| Aviation name | Existing move | Existing runtime owner | Behavior to preserve |
| --- | --- | --- | --- |
| **Compressor Surge** | Flame Cone | `data.js` boss attack label, `rules.attacks.abyss[0]` | 1.5 s warned frontal cone, safe flank |
| **Wake Vortex** | Wing Shockwave | `data.js` boss attack label, `rules.attacks.abyss[1]` | 1.7 s expanding ring; dangerous moving band |
| **Lazy Eight** | Shadow Flight | `data.js` boss attack label, `rules.attacks.abyss[2]` | Two **sequential** marked landing circles; 1.8 s warning; **not** a continuous physical figure-eight |
| **Scramble Order** | Hatchling Call | `data.js` boss attack label, `rules.attacks.abyss[3]` | 2 s summon warning; existing **Ash-beast**-species add family and live cap; no new dragon species |
| **High Yo-Yo** | Ashwing Feint | `rules.js` boss dash/feint name | Existing short dash/feint parameters, no new altitude simulation |
| **Wingover** | Wingward Break | `rules.js` scatter ability name | Existing warned defensive scatter, push and sidestep |
| **Go-Around** | Ember Renewal | `rules.js` recovery ability name | Existing warned 8% self-recovery, 24-second cooldown and threshold; no new immunity/flight phase |

These are real aviation or aerial-combat terms repurposed as fantasy move names. The precise analogy is intentionally playful rather than a claim that a dragon has turbine machinery. **Compressor Surge** describes the flame burst rather than literal compressor hardware; **Scramble Order** is a defensive launch order rather than proof the air force has deployed.

## Tactical identity and safe acceptance

Veyrith is the Dark Lord's personal dragon—the playful **Air Force One** comparison—and also a former freely allied aerial pathfinder. He controls safe approaches, avoids letting enemies settle, makes two planned landings, calls existing defenders and has a defensive emergency recovery. Those already-visible actions support his meticulous command personality.

For implementation, the four authored attack strings under the `abyss` boss in `data.js` feed **live boss telegraph names** via `boss-combat.js`; the other three techniques have their names in `rules.js`. Both data and rules files are intentionally protected by the frozen performance/rendering baseline regression. Do **not** silently rewrite the protected hash fixture or weaken that safety test merely to pass CI. Integrate the renames only with a reviewed and explicitly documented baseline update that demonstrates unchanged combat behavior and renders.

Required acceptance after actual runtime wiring: identical warning/recovery timings, cone/ring/landing geometry, target selection, summons and cap, skill/recovery values and normal/TRUE/Awakening; a visible warning-name inspection; Eren rescue and historical saves; full Node/build/format checks plus desktop Chromium and phone WebKit. Existing `abyss-dragon-identity.test.cjs` tests the pre-rename baseline. Update it to cover actual labels only alongside the implementation.

**Not part of this naming phase:** aircraft, pilot costumes, a new airborne physics system, continuous figure-eight movement, deployable air units, new dragon hatchlings, extra special attacks, visual redesign or alteration of Bastion service routes.

**Release rule:** stays on draft PR #254 for the worldbuilding combination defined by #232. No separate merge or deployment.
