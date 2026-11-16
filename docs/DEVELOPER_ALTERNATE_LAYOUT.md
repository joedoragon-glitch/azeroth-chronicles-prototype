# Developer Alternate Layout — retained local experiment

**Status: retired from public release, 16 November 2026.** This is a neutral, private-use development layout retained in the public source repository only as an experimental branch. It was informed by anonymous user feedback, with no continuing association, public attribution, dedicated community release, external user support, or update commitment.

## Distribution and source boundaries

- Developer branch: `developer/alternate-control-layout`; **not** the public `main` source, and not a candidate to merge as a whole.
- Launch a local checkout on a developer-controlled device with `npm ci --ignore-scripts`, `npm run dev`, then open `http://127.0.0.1:8080/` or `http://127.0.0.1:8080/phone.html`. Do not share or publish a remotely hosted alternate-layout link.
- The separate GitHub Pages edition publisher has been removed. Official public releases must exclude the retired alternate-layout subtree. No branch push, merge, Pages deployment, or external communication is authorized merely by this document.
- This remains source-accessible because the parent repository is public. Local-only hosting is not authentication or a guarantee of source secrecy. If exclusive access to these source files is later desired, move the layout into a private repository.
- The standard public game retains its original controls, eight independently triggered skill slots, input choices, save files, offline cache and update behavior. No reverse-import of the specialized experiment.

## Independent local storage and saves

- The developer layout intentionally starts with **new**, independent storage under `developer-alternate-layout:`. Older experimental-mode saves are **not** migrated, recovered or overwritten. No campaign save schema change is required.
- New Normal/Nightmare v4 local saves, reload/resume and export/import must still function under this layout. Test them before relying on the mode for extended play.
- The layout's preferences use the same neutral prefix, and its campaign writer lock is isolated. Its PWA cache namespace is `developer-alternate-layout-app-`; avoid registering it over the root game's worker.
- Do not clear, rename or modify standard-game or old experimental-mode localStorage keys; historical data can remain even though no compatibility is guaranteed. Always preserve the live game's save integrity.

## Retained controls

The purpose of the experiment is a fixed, joystick-oriented alternative, not a new game class or balance redesign.

| Action | Desktop | Phone |
| --- | --- | --- |
| Move / menu navigation | WASD | Fixed left joystick; deliberate menu drags and delayed held repeats |
| Confirm / interact | F or Enter | Separate Confirm control beside joystick |
| Menu / back | Esc | Back |
| Active hero skills | Keys 1–4 | Four buttons in an arc near the left joystick |
| Target / recall / doctrine | E / Q / Tab | Corresponding right-side controls |
| Companion Heal | R; left-click world if an eligible helper exists | Separate Heal field control |
| Map / journal / talents / help | Z / X / C / G | Joystick-driven menus |

Direct pointer selection of menu options and click/tap-to-move are disabled, while native text/file input and field buttons remain functional. The four playable classes, established campaign, quests and specialist training chain remain in place.

Learned secondary Skills 5–8 follow **manual** Skills 1–4 respectively (1→5, 2→6, 3→7, 4→8) when the primary legally releases and the secondary meets its own conditions. Secondary skills retain their individual training ranks and effects but have no independent key/cooldown activation in this experiment. Movement-only automatic basics do not activate these secondary skills. The joystick's precise menu navigation uses a thumb-relative direction latch; it does not change field movement.

## Verification and maintenance

Source-only controls/joystick regression: `node tests/alternate-layout-menu-joystick.test.cjs`. The neutral branch-specific workflow checks relevant syntax, the precise menu/field controls and committed offline worker hashes. This does not certify a physical phone, a complete campaign playthrough, long-session save continuity or full compatibility with subsequent public-main development.

The alternate layout is **frozen except for direct owner-requested developer maintenance**. Previously granted publication or testing waivers are not new deployment authority. A new local playthrough and save/continue test are required after this rename. Keep technical history intact; only current labels and narratives are generic.
