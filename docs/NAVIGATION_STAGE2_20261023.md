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
- [x] Stage 2: authored implementation and focused test definitions (pending focused PR CI results and owner acceptance)
- [ ] Stage 3: real service-frontage resolution including both ferries
- [ ] Stage 4: bounded route solver correction with collision and road safety
- [ ] Stage 5: marker interaction and end-to-end integrated verification
- [ ] Final combined audit and **explicit owner permission** before merging
