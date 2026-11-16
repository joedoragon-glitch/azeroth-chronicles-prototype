# Alternate Layout Mode — developer-only

**Status (16 November 2026):** The formerly public control variant has been retired at the owner's direction. Preserve this implementation as a neutral, source-only **alternate layout mode** for development and comparison. Do not publicly release, advertise, link, or deploy it. The standard single-player game on `main` and its official public links are unaffected. This branch is **not a verified v0.9.2 release candidate**.

## Branch and release boundary

- Developer source: `developer/alternate-layout-mode`. This is a separate implementation branch, not a second public edition.
- The previous nested GitHub Pages route is no longer included in the standard Pages package. Never restore that route, run the former special publisher, or create a replacement public URL.
- The previous public publisher has been deleted from this source branch. Commits to the developer branch may run focused, **non-deploying** checks only.
- Because the GitHub repository itself is public, source code on its branches is visible. **Developer-only** here means *no public hosted game*, not a password-protected repository.
- The layout's underlying source is based on the older 0.9.1+snapshot.dev.288.controls.2 variant and has deliberate differences from newer `main`; it does not inherit mainline updates automatically. The mainline public build at the retirement checkpoint was 0.9.1+snapshot.dev.291 (commit `985c3e802abec3e6cef01cebb6ee788f4d772b15`).

## Local use and saves

- Check out this developer branch and run the ordinary local game entry files, using the existing build/site workflow if needed. **Do not upload the built site to public hosting.**
- Storage is isolated with the new prefix `alternate-layout:`, the writer lock `alternate-layout-campaign-writer-v1`, a distinct `alternate-layout-app-` offline cache prefix, and an independent nested worker scope when run from its own local directory. Normal game storage keys and the official PWA worker must not be changed.
- No compatibility migration from earlier special-layout saves is required. Old saves may be inaccessible. **New playthroughs must still save, reload, and resume**, using the existing v4 campaign schema, writer guard and persistence pipeline.
- Fresh normal/Nightmare games within the alternate layout are independent of standard public saves. Do not treat either namespace as interchangeable.

## Fixed controls and layout

| Behavior | Alternate desktop | Alternate phone |
| --- | --- | --- |
| Movement and menu navigation | WASD | Fixed left joystick; precision menu drags |
| Confirm / interact | F or Enter | Left-side Confirm; Back for menu return |
| Manually activated hero skills | Keys 1–4 | Skills 1–4 in an arc around left joystick |
| Target, recall, squad | E, Q, Tab | Dedicated right-side buttons |
| Companion Heal | R or left-click on eligible world target | Separate Heal button |
| Map, skills journal, Talents, pause/help | Z, X, C, V/G | Menus and HUD |
| Menu pointer/touch selections | Disabled except native input/file pickers | Joystick select + Confirm (not direct item taps) |
| Click/tap-to-move | Disabled | Disabled |

The menu joystick recognizes intentional relative movement; small tremors/ambiguous diagonals are ignored, repeat scrolling is delayed and controlled, and reversing requires recentering. Field movement remains analog. Do not silently introduce these controls into standard `main`.

All four original classes and instructors remain. Skills 5–8 are still individually trainable: successful manual Skill 1 can conditionally trigger learned Skill 5, 2→6, 3→7 and 4→8, matching normal/charged form. Follow-up effects keep their own rank and target legality and do not activate separate cooldowns. Automatic basic attacks require genuine hero movement, and cannot trigger a paired secondary. Existing campaign rewards, bosses, progression, AI, v4 validation, and bilingual UI should remain otherwise intact.

## Verification and future changes

Focused checks live in `.github/workflows/alternate-layout-joystick.yml`, including menu controls, isolated fresh-save behavior, and exact offline worker fingerprints. A check passing is **not** proof of target-device acceptance or a continuous earned campaign. Any future compatibility port from published `main` into this branch requires a separate decision and must retain isolation; no reverse ports of variant-only preferences, automatic refresh, or deployment.

Prior control feedback is referenced only as generic **user feedback** where it helps explain a behavior. No personal attribution or special edition branding is maintained in this developer implementation.
