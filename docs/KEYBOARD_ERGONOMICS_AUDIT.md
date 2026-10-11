# Desktop keyboard ergonomics audit — v0.9.0 beta

Source reviewed: `main` at `d7d2c22485b08265b31bf595305ef952b40b72cd`. Scope is the active `src/prototype` client (not the historical/legacy game).

## Finding

- The old default `KeyE` and `KeyF` actions both called `interact()` during world play; `KeyF` additionally confirmed menu choices.
- `KeyQ` was the default target-cycle/target-lock key. Keeping WASD engaged while tapping E is more comfortable on many desktop keyboard layouts than reaching to Q.
- Space **is not unused**: it casts Skill 6. The proposal to put Ranger Heal on Space was withdrawn. Keep Skill 6 on Space and Ranger Heal on H.
- Squad recall was bound to `Backquote` (`\``). A second `Q` shortcut is useful once targeting moves to E, but must never shadow a user-defined Q binding.

## Proposed defaults

| Key | Behavior |
| --- | --- |
| W / A / S / D | Move (unchanged) |
| E | Cycle hero target on tap; lock on hold (previous Q behavior) |
| F | Context interaction in the world; confirm/interact in menus |
| Q | Additional shortcut to Recall when Backquote remains the default and Q is unassigned |
| Backquote | Recall squad (original key retained) |
| Space | Skill 6 (unchanged) |
| H | Command Ranger Heal (unchanged) |

Existing phone/touch controls and the target button remain as before. Keyboard bindings remain customizable.

## Save and keyboard preference compatibility

- Campaign saves are not modified; binding preferences live under `azeroth-input-v1`.
- Previous default Q targeting is upgraded to E on load when E is not assigned to another active action.
- Custom target keys are retained; explicit custom Q assignments override the new Q recall alias.
- If E is already custom-bound, retain Q targeting rather than produce a duplicate or discard the entire preference map.
- Old `interact` preference entries become redundant; F continues to provide world interaction.
- If Recall is remapped from Backquote, the auxiliary Q alias disappears unless Q is explicitly assigned to Recall.

## Regression coverage

1. Unit checks: new defaults; old Q/E preference migration; custom targeting; custom E; explicit custom Q; reset/rebind; Space and H unchanged.
2. Browser checks: target tap and hold/lock with E, W/A/S/D plus E pressed concurrently, F NPC interaction, F menu confirmation, target HUD button, keyboard rebind and persistence after reload.
3. Integration verification: Node regression suite, browser/device CI, build and deployment checks; require passing statuses before merge.
4. Practical QA still required: physical keyboards including non-US layout, Chromebook, and phone controls; ensure held movement never drops on target press/release.

## Rollback

This change is isolated to a feature branch and PR; no direct production changes or save-schema migrations. Revert the PR if regressions are confirmed. Existing user bindings can still be reset from the in-game Controls menu.
