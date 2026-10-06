# Prototype audit — 4 October 2026

The expanded v0.6 prototype implements five regions, ten settlements, five dungeons, ten four-attack boss families, ten captive specialists, thirty quests, paid skill learning/upgrades, equipment tiers, supplies, companion commands and spending, finite gathering, construction, terrain/bridges/transport, anti-kiting resets, night scaling, saved ringleader/TRUE rules, the awakened dungeon finale, sparse peaceful habitats, Nightmare, Succession, original location and combat music, peaceful arrangements, ambience, effects, save validation and local playtest exports.

## Verification

Legacy regression checks retain the original shell. Expanded engine checks cover terrain reachability, population budgets, training charges, reward penalties, TRUE rules and saved rolls, companion kill attribution, anti-kiting, travel, one-time quests, party commands and all three succession deaths. Soundtrack checks cover unique themes, all ten location identities, boss/TRUE selection, awakening/peace and volume preferences.

All 1,024 early-dungeon outcome combinations are tested through the production engine, including unbeaten normal, failed roll, pending early TRUE and early TRUE already defeated. Every combination must reach peace without reviving a defeated TRUE or requiring another random roll.

Real Chromium checks cover 1280×800 desktop, 375×812 and 320×568 phones, and 844×390 landscape. They execute movement, controls, audio gesture unlock, saved successor choices, automatic last class, terminal game over, peace, Nightmare unlock and separate mode saves. CI repeats the browser checks against the deployed GitHub Pages game. Test logs and screenshots accompany the source.

## Corrections

The audit corrected field boss suppression after TRUE Dark Lord, stale reward flags on respawn, attacks continuing into a successor's first frame, an initial overwrite prompt, small-screen control overlap, targeting summoned adds, finite gathering rounding, queued companion capacity and tonic health effects. Invalid imports preserve the current run.

## Limits and first-player questions

These checks establish implemented rules and reachable transitions; they do not establish final balance or a completed human playthrough. Some advanced boss patterns share primitives. Art and synthesized music remain prototype assets. Local-file storage/audio behavior differs by browser; export backups before moving files. Legacy exports are retained for recovery and manual comparison where older equipment representations differ. Older backup imports can intentionally rewind offline progress.

Record travel time, boss clear time, class/successor survival, training affordability, gold income, companions lost, supply use, unclear warnings, stuck routes and audio comfort. Playtest reports are local and opt-in. No telemetry is sent automatically.
