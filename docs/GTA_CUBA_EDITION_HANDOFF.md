# GTA Cuba Edition

Development record for [PR #872](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/872). The edition is isolated in `mod/gta-cuba-edition`. Player-facing pages use the standard game title.

## Source and status

- Official release baseline: `e97dd771190ee83f37fc61d091671e4d110c3a36`, `0.9.1+snapshot.dev.288`. The [successful Pages deployment](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42541651863), [live build marker](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/build.txt), hosted version script and matching application bytes establish the base. The later documentation-only main commit and all unmerged PR work are excluded.
- Edition source: `0.9.1+snapshot.dev.288.controls.2`. The request explicitly waived automated, manual, regression and device tests and campaign playthroughs. The edition is untested. Packaging and deployment metadata are release operations.
- The original distribution used its own host. The GitHub Pages release workflow stages the edition under `tools/webgl-pilot/play/`, a path the official worker passes through for navigation. The edition registers its own scoped worker and prefixes its storage keys. Existing saves from a different host can be exported there and imported on GitHub Pages.

## Controls and combat

- Desktop movement and menu navigation use WASD. F confirms and interacts. Esc opens or backs out of a menu. Skills 1–4 use number keys 1–4. E targets, Q recalls, Tab changes squad doctrine in the field, R commands Heal, Z opens the map, X opens the skill journal, C opens Talents, G shows controls and V pauses.
- The phone uses the fixed left joystick with four skill buttons above it. Squad doctrine, recall and targeting are on the right. Use the joystick and the Confirm button beside it for menu choices. Use the Back row to dismiss menus. Joystick navigation runs on the title and New Game screens as well as during play. Name fields and system dialogs retain native text and file handling. New Game is available in Settings and uses in-game confirmation before replacing an existing save.
- Desktop left-click in the world requests the existing healer companion action. Mouse or touch selection of game menu options and click-to-move are disabled. Guided travel still uses its existing menu routes. The published baseline's disabled mana mode is retained.
- Slots 5–8 are available through the same instructors, learning requirements and rank upgrades. A successful activation of 1–4 resolves its learned pairing in the same form after the primary release. The pairings are 1→5, 2→6, 3→7 and 4→8.
- The primary pays its existing costs and starts its existing recovery. Its paired effect uses its own rank, native targeting and protection rules, with no extra resource cost or independent cooldown. If the primary requests an approach, the pair waits for release. A failed or interrupted primary never releases its pair. With no legal secondary target the secondary produces no effect or pursuit. Basics never trigger pairs.
- The existing automatic Skill 1 cadence runs only when the hero actually changes position during movement. Manual skills remain available while stationary.

## Updating and removing the edition

For a refresh, read the official Pages build marker and confirm its successful deployment. Port only the existing edition changes onto that exact source. Preserve the edition origin, prefixed storage and cache keys, v4 save format, and fixed controls. Package with `node scripts/build.cjs --package-only --site` and the published release's pinned Pixi asset already present. Stamp the edition SHA using `GITHUB_SHA`. The branch-only `fixed-controls-pages.yml` workflow layers the edition over a package rebuilt from the currently published official SHA. The `github-pages` deployment environment must allow `mod/gta-cuba-edition`. Normal official deployments replace the Pages artifact, so re-run edition publication after refreshing it for each new official release. Keep PR #872 away from main integration and keep the official Pages workflow untouched.

To retire both web links, stop the edition update automation and remove public access from the edition Site. The isolated source branch may then be deleted independently. A previously installed offline copy can remain on its device.
