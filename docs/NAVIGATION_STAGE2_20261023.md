# Navigation workstream — Stage 2: ownership, manual takeover and cancel

Date: 23 October 2026. The plan and findings are tracked in [issue #420](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/420). Stages 2–5 are to share **one draft PR and branch**, with an owner review after each stage, followed by a final combined audit before any merge. No per-stage deployment.

## Implemented scope

- The map's **Navigate** still asks the hero to walk, but stores a **runtime guide/session** separate from the ordinary hero movement order. Existing quest objectives remain guidance-only. The destination guide survives manual directional takeover so players can keep following the route on their own.
- Player **keyboard/joystick/manual world movement** is the immediate takeover boundary. Combat does not trigger cancellation: skills (even unsuccessful attempts), the existing movement auto-basic, and companions can continue during a normal travel order. Existing explicitly targeted skill-approach mechanics remain owned by combat; when such an order replaces an active navigation walk, the guide stays without controlling the new order.
- The map now offers **Clear waypoint** for an active map-started trip as well as a quest guide. A small, conditionally visible **Cancel navigation** / **Cancelar ruta** control appears outside menus. Both remove guidance and stop only the navigation-owned walk; neither revokes a saved companion gathering assignment.
- Opening/closing or using non-movement settings in menus no longer silently cancels an active navigation order. Modal input state and charge are still cleared. The game remains frozen while menus are open.
- On arrival, death, zone transition or game replacement, the runtime guide is invalidated. After manual movement the guide is recomputed at a bounded cadence using the existing pathfinder, without forcing hero movement.
- Saving a normal `move` or `skill-approach` hero instruction no longer persists its movement path. A historical v4 save carrying a move order is sanitized on restore; this avoids invisible, uncancelable autopilot after reopening the PWA. Save format and progress fields are unchanged.

## Source ownership

- `src/prototype/app.js`: navigation runtime guide, ownership check, map Navigate/Clear, control placement, menu lifecycle, manual takeover and renderer route selection
- `src/prototype/save.js`: transient movement sanitization only
- `styles/app.css` and `styles/phone.css`: small conditional Cancel control, safe-area offsets and focus ring
- `tests/navigation-stage2.test.cjs`: targeted English/Spanish production-shell contract, manual vs combat, menu preservation, cancellation and save compatibility

## Validation and known limits

Use only the focused suites automatically selected by `.github/scripts/focused-ci.cjs` plus its package build check. No full-game, all-browser, device, or performance matrix. Stage 2 contains **no** changes to collision, `navigationTarget()`, the shared BFS solver, map marker selection, transport boarding, encounter AI, graphics caching or the multi-file PWA.

The existing **Marches ferry approach failure** and **single-start/single-end BFS false negatives** are deliberately reserved for Stages 3 and 4. Stage 5 covers actual mouse/touch click scaling, accessibility/layout evidence on phones, overlapping destination markers and full navigation integration; no device pass is claimed for Stage 2.

### Stage checkpoints

- [x] Stage 1: source audit and user contract — #420
- [x] Stage 2: implementation and focused checks, including contextual UI/shortcut audit; owner acceptance and final cross-stage audit remain outstanding
- [ ] Stage 3: real service-frontage resolution including both ferries
- [ ] Stage 4: bounded route solver correction with collision and road safety
- [ ] Stage 5: marker interaction and end-to-end integrated verification
- [ ] Final combined audit and **explicit owner permission** before merging

## Stage 2 targeted audit addendum — 23 October 2026

Owner feedback: the on-screen Cancel control must **not** clutter the HUD when no actual map-destination journey is active. The map must remain easy to discover on phones and through an existing keyboard shortcut, without new key collisions.

**Audit finding repaired:** Previously, `updateHUD()` showed the Cancel button whenever `questGuide` was truthy—even if it was merely an unrelated tracked quest or gathering objective, or the route was empty. The control now requires a **valid current navigation session with a nonempty visible route**, matching campaign, hero, zone and death count, living hero, and not-yet-reached destination. It hides when the player is idle, simply opens the map, tracks a quest without navigation, arrives, loses route validity, changes zone/dies/loads a different campaign, cancels explicitly, or has a menu open (the latter also via CSS). It **stays visible during manual takeover while destination guidance remains active**: the waypoint still exists and the player still needs a way to dismiss it. Map → Clear waypoint remains available for quest/gathering guide removal without canceling companion work.

**Keyboard investigation:** `PrototypeInput` already binds Map to **Z** and supports **M** as a safe alias while mana mode is retired (`resourceMode.manaEnabled=false`). Custom assigned M keys take priority; the alias never steals a custom skill key. **Tab** remains bound to Squad Doctrine, so no controls were reassigned. Map shortcut hints now show the actual `map` binding plus M only when that alias is available, in desktop hints and bilingual Controls information. The Adventure menu retains **Map and travel routes** as its prominent second ordinary action (after the tutorial-oriented Barracks item), adding a short EN/ES shortcut hint instead of new phone HUD clutter.

**Guide isolation correction:** `startNavigation()` owns a copied set of guide waypoints so the engine consuming `hero.path` does not mutate a guide created from a story destination. A canceled navigation status also uses the correct Spanish phrase.

**Focused regression additions:** No Cancel on initial idle/map inspection or quest-only guide; Cancel appears only after Navigate; persists for guided manual takeover; disappears on arrival and explicit Clear; M and Z open Map; Tab is unchanged; M assigned to a custom skill overrides the map alias; Map remains near the top of the Adventure menu with correct dynamic key label; test also covers joystick, keyboard, world tap, pause, gathering conservation, old-save movement sanitization and EN/ES.

**Evidence bounds:** GitHub's existing focused PR workflow verifies changed-source syntax, relevant Node/UI shell checks and the reproducible Pages/PWA build. This is **not** actual phone/landscape browser or physical-device certification. Stage 5 still owns screenshot/touch-target/overlay review. The owner explicitly resolved the combat precedence: a deliberately targeted **out-of-range skill must not divert or cancel active map navigation**. `startNavigation()` marks only the chosen travel order as `navigation: true`. `hero-combat.js::cast()` rejects an unavailable out-of-range target while that exact map-owned move is current, without queuing `skill-approach`, consuming mana or spending cooldown. Passive attacks, in-range skills and companion combat retain normal handling. Normal targeted skill approaches **outside** map-owned autopilot remain unchanged. The focused `tests/targeting.test.cjs` now covers the out-of-range rule for Paladin, Mage and Ranger, while preexisting tests still cover normal skill approaches. Its ordinary-combat fixture explicitly activates Greenwood's field to respect the current level-1 hero-first onboarding protection. Follow-up integration/device observation belongs to Stage 5; never add blanket skill-button cancellation.

**Release boundary:** Cumulative draft PR #421 stays unmerged and undeployed. Later Stages 3–5 and one final combined audit precede any explicit merge authorization.
